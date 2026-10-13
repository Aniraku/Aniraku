// Provider progress + score sync — restored Aniraku Watch.jsx:1904-1956
// auto-sync engine, upgraded with throttling + average-score pushes.
//
// - `syncWatchProgress({ animeId, episode, progress, duration, mode })`
//   pushes to every configured+connected provider (MAL + AniList) via
//   `POST /api/v1/sync/update`. Mode `completed` sends progress=duration +
//   status=completed; mode `watching` sends current position +
//   status=watching. Fire-and-forget safe: resolves `{ synced, failed }`,
//   never throws.
// - `syncAverageScore` pushes `averageRating(ratings)` via
//   `PUT /api/v1/sync/score` (providers only support anime-level scores).
// - Status cache: GET /api/v1/sync once per page session (null = not fetched).
// - Throttle: `watching` pushes at most once per 60s per episode; `completed`
//   always pushes (idempotent server-side).

import {
  fetchNotifications,
  fetchServerHistoryRows,
  getSessionUserId,
  getSyncStatus,
  isRateLimitError,
  PROVIDER_LABELS,
  readLocalBookmarks,
  updateSyncProgress,
  type SyncStatus,
} from './sync';
import {
  averageRating,
  fetchEpisodeRatings,
  updateSyncScore,
} from './episodeRatings';
import { supabase } from './supabase';
import {
  isEpisodeCompleted,
  readLocalHistoryRows,
  reconcileLocalHistory,
  type HistoryRow,
} from './watchHistory';

let statusCache: SyncStatus | null | undefined;
let statusInflight: Promise<SyncStatus | null> | null = null;

async function getCachedStatus(): Promise<SyncStatus | null> {
  if (statusCache !== undefined) return statusCache;
  if (!statusInflight) {
    statusInflight = getSyncStatus().then((data) => {
      statusCache = data;
      statusInflight = null;
      return data;
    });
  }
  return statusInflight;
}

export function resetSyncStatusCache(): void {
  statusCache = undefined;
  statusInflight = null;
}

function connectedProviders(data: SyncStatus | null): string[] {
  if (!data) return [];
  return ['mal', 'anilist'].filter((p) => {
    const s = data[p] as
      | { configured?: boolean; connected?: boolean }
      | undefined;
    // Backend sends both; `configured` may be absent on older deploys —
    // treat missing as configured when connected is true.
    return Boolean(s?.connected) && (s?.configured ?? true);
  });
}

export interface SyncProgressArgs {
  animeId: string | number;
  episode: number;
  /** Current position in seconds (watching) — ignored for completed. */
  progress?: number;
  duration?: number;
  mode: 'completed' | 'watching';
}

export interface SyncProgressResult {
  synced: string[];
  failed: string[];
}

const lastWatchingPush = new Map<string, number>();
const WATCHING_THROTTLE_MS = 60000;

export async function syncWatchProgress(
  args: SyncProgressArgs,
): Promise<SyncProgressResult> {
  const empty: SyncProgressResult = { synced: [], failed: [] };
  const animeId = Math.floor(Number(args.animeId));
  const episode = Math.floor(Number(args.episode));
  if (!Number.isFinite(animeId) || animeId <= 0) return empty;
  if (!Number.isFinite(episode) || episode <= 0) return empty;

  const duration = Math.floor(Number(args.duration) || 0);
  if (duration <= 0) return empty;
  const progress =
    args.mode === 'completed'
      ? duration
      : Math.floor(Number(args.progress) || 0);
  if (progress <= 0) return empty;

  if (args.mode === 'watching') {
    const key = `${animeId}:${episode}`;
    const now = Date.now();
    if (now - (lastWatchingPush.get(key) ?? 0) < WATCHING_THROTTLE_MS) {
      return empty;
    }
    lastWatchingPush.set(key, now);
  }

  const data = await getCachedStatus().catch(() => null);
  const providers = connectedProviders(data);
  if (!providers.length) return empty;

  const status = args.mode === 'completed' ? 'completed' : 'watching';
  const results = await Promise.allSettled(
    providers.map((p) =>
      updateSyncProgress({ provider: p, animeId, episode, progress, status }),
    ),
  );
  const synced: string[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value?.ok) synced.push(providers[i]);
    else failed.push(providers[i]);
  });
  return { synced, failed };
}

/** Push the average episode rating as the provider anime score. */
export async function syncAverageScore(
  animeId: string | number,
  ratings: Record<number | string, number>,
): Promise<SyncProgressResult> {
  const empty: SyncProgressResult = { synced: [], failed: [] };
  const id = Math.floor(Number(animeId));
  if (!Number.isFinite(id) || id <= 0) return empty;
  const score = averageRating(ratings);
  if (score === null) return empty;
  const data = await getCachedStatus().catch(() => null);
  const providers = connectedProviders(data);
  if (!providers.length) return empty;
  const results = await Promise.allSettled(
    providers.map((p) => updateSyncScore({ provider: p, animeId: id, score })),
  );
  const synced: string[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value?.ok) synced.push(providers[i]);
    else failed.push(providers[i]);
  });
  return { synced, failed };
}

// ---------------------------------------------------------------------------
// Force overwrite — writes Aniraku's per-title finished counts straight to
// one provider via `POST /api/v1/sync/update`, bypassing bulk export's
// never-regress-a-provider-lead guard. That guard is correct for routine
// exports (episodes watched directly on the provider must survive), but it
// makes past-inflated provider values permanent: no export can ever lower
// them. Force is the correction path — explicit user action only, with a
// confirm screen showing exactly what will be overwritten.
//
// Scope matches bulk export (bookmarked titles). Per title the pushed
// number is the highest FINISHED local episode (>=95% watched — the same
// threshold the backend fold uses), so force and export agree on truth.
// Titles with no finished local episode are SKIPPED (the update endpoint
// rejects unwatched pushes) and reported — clear those on the provider
// manually once. Average score rides along per title.
// ---------------------------------------------------------------------------

export interface ForceTarget {
  animeId: number;
  title: string;
  /** Highest finished episode — the number written to the provider. */
  episode: number;
  /** Seconds on that row (the update endpoint requires progress > 0). */
  progressSeconds: number;
}

export interface ForcePlan {
  targets: ForceTarget[];
  /** Bookmarked titles with no finished local episode. */
  skippedNoEvidence: { animeId: number; title: string }[];
}

function finishedEpisodeOf(rows: HistoryRow[]): {
  episode: number;
  seconds: number;
} | null {
  let best: { episode: number; seconds: number } | null = null;
  for (const row of rows) {
    if (!isEpisodeCompleted(row.progress, row.duration)) continue;
    if (!best || row.episode_number > best.episode) {
      best = {
        episode: row.episode_number,
        seconds: Math.max(1, Math.floor(Number(row.progress) || 0)),
      };
    }
  }
  return best;
}

/** Local truth snapshot for the force confirm screen (sync, no network). */
export function computeForcePlan(): ForcePlan {
  const rows = readLocalHistoryRows();
  const bookmarks = readLocalBookmarks();
  const byAnime = new Map<number, HistoryRow[]>();
  for (const row of rows) {
    const list = byAnime.get(row.anime_id);
    if (list) list.push(row);
    else byAnime.set(row.anime_id, [row]);
  }
  const targets: ForceTarget[] = [];
  const finishedIds = new Set<number>();
  for (const bookmark of bookmarks) {
    const fin = finishedEpisodeOf(byAnime.get(bookmark.id) ?? []);
    if (!fin) continue;
    finishedIds.add(bookmark.id);
    targets.push({
      animeId: bookmark.id,
      title: bookmark.title || `Anime ${bookmark.id}`,
      episode: fin.episode,
      progressSeconds: fin.seconds,
    });
  }
  targets.sort((a, b) => a.title.localeCompare(b.title));
  const skippedNoEvidence = bookmarks
    .filter((b) => !finishedIds.has(b.id))
    .map((b) => ({ animeId: b.id, title: b.title || `Anime ${b.id}` }));
  return { targets, skippedNoEvidence };
}

/** Push one title's finished count (+ average score) to one provider. */
export async function forcePushTitle(
  provider: string,
  target: ForceTarget,
): Promise<{ ok: boolean; error?: string }> {
  const pushed = await updateSyncProgress({
    provider,
    animeId: target.animeId,
    episode: target.episode,
    progress: target.progressSeconds,
    status: 'watching',
  });
  if (!pushed.ok) return pushed;
  try {
    const ratings = await fetchEpisodeRatings(target.animeId).catch(() => null);
    const score = ratings ? averageRating(ratings) : null;
    if (score !== null) {
      await updateSyncScore({
        provider,
        animeId: target.animeId,
        score,
      }).catch(() => ({ ok: false as const }));
    }
  } catch {
    // score is additive — the progress overwrite already landed
  }
  return { ok: true };
}

// ── Background force job (paced, notified, per-provider mutex) ──

export type ForceJobStatus = 'running' | 'done' | 'error' | 'interrupted';

export interface ForceJobState {
  provider: string;
  status: ForceJobStatus;
  startedAt: number;
  updatedAt: number;
  total: number;
  pushed: number;
  scores: number;
  skipped: number;
  failed: number;
  lastError?: string;
  message?: string;
  note?: string;
}

export type ForceJobs = Record<string, ForceJobState>;

const FORCE_JOB_KEY = 'aniraku:force-job';
// AniList mutations share the 30 req/min budget (2 writes/title here:
// progress + score) — one title per 5s stays well under it. MAL gets the
// same polite pace.
const FORCE_PACE_MS = 5000;
const FORCE_RATE_WAIT_MS = 65000;
const FORCE_RATE_RETRIES = 3;

const forceJobsInFlight = new Set<string>();
let forceJobs: ForceJobs = {};
const forceJobListeners = new Set<(jobs: ForceJobs) => void>();

function readForceJobs(): void {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(FORCE_JOB_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Record<string, ForceJobState>;
    for (const [provider, job] of Object.entries(parsed)) {
      if (!job || typeof job !== 'object') continue;
      forceJobs[provider] = {
        ...job,
        provider,
        status: job.status === 'running' ? 'interrupted' : job.status,
        updatedAt: Date.now(),
      };
    }
  } catch {
    // corrupt payload — start clean
  }
}

readForceJobs();

function persistForceJobs(): void {
  try {
    window.localStorage.setItem(FORCE_JOB_KEY, JSON.stringify(forceJobs));
  } catch {
    // storage unavailable — memory-only
  }
}

function setForceJob(next: ForceJobState): void {
  forceJobs = { ...forceJobs, [next.provider]: next };
  persistForceJobs();
  forceJobListeners.forEach((listener) => {
    try {
      listener(forceJobs);
    } catch {
      // a broken listener must not break the store
    }
  });
}

export function getForceJobs(): ForceJobs {
  return forceJobs;
}

export function subscribeForceJobs(
  listener: (jobs: ForceJobs) => void,
): () => void {
  forceJobListeners.add(listener);
  try {
    listener(forceJobs);
  } catch {
    // ignore listener errors
  }
  return () => {
    forceJobListeners.delete(listener);
  };
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function notifyForceFinished(
  provider: string,
  totals: { pushed: number; scores: number; skipped: number; failed: number },
  error?: string,
): Promise<string> {
  const label = PROVIDER_LABELS[provider] ?? provider;
  const parts: string[] = [];
  if (totals.pushed > 0) parts.push(`${totals.pushed} titles overwritten`);
  if (totals.scores > 0) parts.push(`${totals.scores} scores`);
  if (totals.skipped > 0)
    parts.push(`${totals.skipped} skipped (no local progress)`);
  if (totals.failed > 0) parts.push(`${totals.failed} failed`);
  const message = error
    ? `Force overwrite on ${label} stopped: ${error}`
    : `Force overwrite on ${label} finished: ${parts.join(' · ') || 'nothing to overwrite'}`;
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (uid) {
      await supabase.from('notifications').insert({
        user_id: uid,
        type: error ? 'export_failed' : 'export_complete',
        message,
        anime_id: null,
      });
    }
  } catch {
    // best-effort
  }
  try {
    await fetchNotifications();
  } catch {
    // store keeps last-known rows
  }
  return message;
}

/**
 * Overwrite one provider's numbers with Aniraku's finished counts.
 * Pulls server history first (import-planted and other-device evidence
 * counts), then pushes title by title at a polite pace. Resolves with
 * the terminal snapshot; progress flows through subscribeForceJobs.
 */
export async function runForceJob(provider: string): Promise<ForceJobState> {
  const current = forceJobs[provider];
  if (forceJobsInFlight.has(provider) || current?.status === 'running') {
    return (
      current ?? {
        provider,
        status: 'running',
        startedAt: Date.now(),
        updatedAt: Date.now(),
        total: 0,
        pushed: 0,
        scores: 0,
        skipped: 0,
        failed: 0,
      }
    );
  }
  forceJobsInFlight.add(provider);
  const startedAt = Date.now();
  const totals = { pushed: 0, scores: 0, skipped: 0, failed: 0 };
  let done = 0;
  let total = 0;
  let lastError: string | undefined;
  const progress = (note?: string): ForceJobState => ({
    provider,
    status: 'running',
    startedAt,
    updatedAt: Date.now(),
    total,
    pushed: totals.pushed,
    scores: totals.scores,
    skipped: totals.skipped,
    failed: totals.failed,
    ...(lastError ? { lastError } : {}),
    ...(note ? { note } : {}),
  });
  setForceJob(progress());
  try {
    // Server-first so import-planted and other-device evidence counts.
    try {
      const uid = await getSessionUserId();
      if (uid) {
        const serverRows = await fetchServerHistoryRows(uid);
        if (serverRows.length) reconcileLocalHistory(serverRows);
      }
    } catch {
      // offline — local evidence still applies
    }
    const plan = computeForcePlan();
    total = plan.targets.length;
    totals.skipped = plan.skippedNoEvidence.length;
    setForceJob(progress());
    for (const target of plan.targets) {
      let rateWaits = 0;
      for (;;) {
        const res = await forcePushTitle(provider, target);
        if (res.ok) {
          totals.pushed += 1;
          break;
        }
        if (
          res.error &&
          isRateLimitError(res.error) &&
          rateWaits < FORCE_RATE_RETRIES
        ) {
          rateWaits += 1;
          setForceJob(
            progress(
              `Rate limited — waiting before retrying ${target.title} (attempt ${rateWaits}/${FORCE_RATE_RETRIES})…`,
            ),
          );
          await sleepMs(FORCE_RATE_WAIT_MS);
          continue;
        }
        totals.failed += 1;
        lastError = `${target.title}: ${res.error ?? 'failed'}`;
        break;
      }
      done += 1;
      setForceJob(
        progress(
          total > 0 ? `Overwriting ${done}/${total}… ${target.title}` : undefined,
        ),
      );
      await sleepMs(FORCE_PACE_MS);
    }
    const message = await notifyForceFinished(provider, totals);
    const terminal: ForceJobState = { ...progress(), status: 'done', message };
    setForceJob(terminal);
    return terminal;
  } catch (err) {
    const message = await notifyForceFinished(
      provider,
      totals,
      (err as Error)?.message || 'interrupted',
    );
    const terminal: ForceJobState = { ...progress(), status: 'error', message };
    setForceJob(terminal);
    return terminal;
  } finally {
    forceJobsInFlight.delete(provider);
  }
}

/** Fire-and-forget wrapper for UI handlers. */
export function startForceJob(provider: string): ForceJobState {
  void runForceJob(provider);
  const snapshot = getForceJobs()[provider];
  return (
    snapshot ?? {
      provider,
      status: 'running',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      total: 0,
      pushed: 0,
      scores: 0,
      skipped: 0,
      failed: 0,
    }
  );
}
