// Episode download orchestration: click → download starts immediately.
//
// No dialog: the Download button calls startEpisodeDownload(), a floating
// pill (components/DownloadStack) shows segment/mux progress with a cancel
// button, and the finished file is committed through a normal anchor
// download so it lands in Chrome's own download stack (Ctrl+J).
//
// Source contract (user's rule): download the SAME source the user is
// watching — their selected language and server. /stream is consulted only
// for CDN headers + subtitle tracks (session-cached) and as a fallback when
// the watched server has no direct source.

import {
  isDownloadCanceled,
  startHlsDownload,
  type DownloadProgress,
} from './hlsDownload';
import { fetchAnirakuStream } from '../hooks/useApi';
import { showToast } from '../components/Toaster';

export interface DownloadTask {
  id: string;
  /** Episode label shown on the pill, e.g. "EP 10 — Bleach TYBW". */
  label: string;
  phase: 'preparing' | 'segments' | 'muxing' | 'done';
  /** 0..1 across the current phase. */
  pct: number;
  segmentsDone: number;
  segmentsTotal: number;
  bytes: number;
  fileName?: string;
  failed?: boolean;
  cancel: () => void;
}

type TaskRecord = Record<string, DownloadTask>;

const listeners = new Set<() => void>();
let tasks: TaskRecord = {};

function emit(): void {
  // Invalidate the snapshot cache BEFORE notifying — useSyncExternalStore
  // compares snapshots by reference, so getSnapshot() must return the same
  // array until the store actually changes (a fresh Object.values() on
  // every read would re-render forever).
  taskListCache = null;
  listeners.forEach((listener) => listener());
}

// Referentially stable list for React (rebuilt only on emit).
let taskListCache: DownloadTask[] | null = null;

function getTaskList(): DownloadTask[] {
  if (taskListCache === null) taskListCache = Object.values(tasks);
  return taskListCache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function hasActiveDownload(id: string): boolean {
  const task = tasks[id];
  return !!task && !task.failed && task.phase !== 'done';
}

function upsert(task: DownloadTask): void {
  tasks = { ...tasks, [task.id]: task };
  emit();
}

function remove(id: string): void {
  const next = { ...tasks };
  delete next[id];
  tasks = next;
  emit();
}

function applyProgress(
  task: DownloadTask,
  progress: DownloadProgress,
): void {
  // hlsDownload reports a 'manifest' phase; the pill folds it into
  // 'preparing' (there is nothing visible to show for it).
  const phase: DownloadTask['phase'] =
    progress.phase === 'manifest'
      ? 'preparing'
      : (progress.phase as DownloadTask['phase']);
  const pct =
    progress.phase === 'segments' && progress.segmentsTotal > 0
      ? progress.segmentsDone / progress.segmentsTotal
      : progress.phase === 'muxing'
        ? progress.muxProgress
        : progress.phase === 'done'
          ? 1
          : 0;
  upsert({
    ...task,
    phase,
    pct,
    segmentsDone: progress.segmentsDone,
    segmentsTotal: progress.segmentsTotal,
    bytes: progress.bytes,
  });
}

export interface EpisodeDownloadArgs {
  anilistId: string | number;
  episode: number;
  lang: 'sub' | 'dub';
  titleSlug: string;
  label: string;
  /** Direct HLS URL of the server the user is watching (may be null). */
  preferredSourceUrl?: string | null;
  /** CDN headers of the watched server (subtitle/segment fetches). */
  headers?: Record<string, string> | null;
  /** Subtitle files of the watched server — the same list the player shows. */
  subtitles?: { label: string; language?: string; url: string }[];
  /** Variant height chosen in the download dialog (HLS master only). */
  qualityHeight?: number | null;
  apiBase: string;
}

const activeTasks = new Map<string, AbortController>();

/**
 * Kick off an episode download with zero UI friction. Returns immediately
 * after validation; progress lives in the floating DownloadStack pill.
 */
export function startEpisodeDownload(args: EpisodeDownloadArgs): void {
  const id = `${args.anilistId}:${args.episode}:${args.lang}`;
  if (activeTasks.has(id)) {
    showToast('Already downloading this episode', { type: 'info' });
    return;
  }
  const controller = new AbortController();
  activeTasks.set(id, controller);

  const fileNameBase = `aniraku-${args.titleSlug || 'anime'}-episode-${args.episode}${
    args.lang === 'dub' ? '-dub' : ''
  }`;

  const task: DownloadTask = {
    id,
    label: args.label,
    phase: 'preparing',
    pct: 0,
    segmentsDone: 0,
    segmentsTotal: 0,
    bytes: 0,
    cancel: () => controller.abort(),
  };
  upsert(task);

  void (async () => {
    let sourceUrl: string | null = args.preferredSourceUrl ?? null;
    let streamHeaders: Record<string, string> | null | undefined =
      args.headers ?? null;
    let subtitles: { label: string; language?: string; url: string }[] =
      (args.subtitles ?? []).filter((s) => s?.url);
    try {
      // /stream gives CDN headers + subtitle files and doubles as the
      // source fallback; it is session-cached so this is instant after the
      // player booted.
      try {
        const stream = await fetchAnirakuStream({
          animeId: Number(args.anilistId),
          episode: args.episode,
          lang: args.lang,
        });
        streamHeaders = args.headers ?? stream?.headers ?? null;
        if (!sourceUrl) {
          const sources = Array.isArray(stream?.sources) ? stream.sources : [];
          const rank = (s: any) =>
            s?.type === 'hls'
              ? 3
              : s?.verification === 'proxy'
                ? 2
                : s?.verification === 'direct'
                  ? 1
                  : 0;
          const best = [...sources]
            .filter((s: any) => s?.url && s?.type !== 'embed')
            .sort((a: any, b: any) => rank(b) - rank(a))[0];
          if (best?.url) sourceUrl = best.url as string;
        }
        if (subtitles.length === 0) {
          subtitles = (Array.isArray(stream?.subtitles) ? stream.subtitles : [])
            .filter((s: any) => s?.url)
            .slice(0, 6)
            .map((s: any, i: number) => ({
              label: s?.label || s?.lang || `Subtitle ${i + 1}`,
              language:
                typeof s?.lang === 'string' && s.lang.length <= 3
                  ? s.lang
                  : undefined,
              url: s.url as string,
            }));
        }
      } catch {
        // /stream down — the watched server's URL alone can still work.
      }
      if (!sourceUrl) {
        throw new Error('No direct download source is available for this episode.');
      }

      const result = await startHlsDownload({
        url: sourceUrl,
        headers: streamHeaders,
        proxyBase: args.apiBase,
        filename: fileNameBase,
        subtitles,
        qualityHeight: args.qualityHeight ?? null,
        signal: controller.signal,
        onProgress: (p) => applyProgress(task, p),
      });
      if (result.ok) {
        upsert({
          ...task,
          phase: 'done',
          pct: 1,
          fileName: result.fileName,
        });
        showToast('Episode downloaded', {
          description: `${result.fileName} — check Chrome downloads.`,
          type: 'success',
        });
        // The pill has said its piece — clear it shortly.
        setTimeout(() => remove(id), 2500);
      } else {
        upsert({ ...task, phase: 'done', failed: true });
        showToast('Download failed', {
          description: result.error,
          type: 'error',
        });
        setTimeout(() => remove(id), 5000);
      }
    } catch (err) {
      if (isDownloadCanceled(err) || controller.signal.aborted) {
        showToast('Download canceled', { type: 'info' });
      } else {
        upsert({ ...task, phase: 'done', failed: true });
        showToast('Download failed', {
          description: err instanceof Error ? err.message : undefined,
          type: 'error',
        });
        setTimeout(() => remove(id), 5000);
      }
    } finally {
      activeTasks.delete(id);
    }
  })();
}

// — React binding —

import { useSyncExternalStore } from 'react';

const EMPTY_TASKS: DownloadTask[] = [];

export function useDownloadTasks(): DownloadTask[] {
  return useSyncExternalStore(
    subscribe,
    getTaskList,
    () => EMPTY_TASKS,
  );
}
