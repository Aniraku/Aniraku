// Whole-anime sub/dub track counts.
//
// Primary source — the Aniraku backend's fast track endpoint the user added
// alongside the slow /servers provider fan-out:
//   GET {API_BASE}api/v1/anime/{anilistId}/track
//     → 200 {"sub": <exact count>, "dub": <exact count>}
//     → 404 {"error":"anime not found"} (movies / titles without data —
//       treated as counts 0 with a shorter retry TTL)
// One cheap request per anime, exact episode counts (e.g. One Piece returns
// dub 1157 of 1180 — the real release lag), cached locally so cards, the
// watch pills and the episode list never re-fetch per render.
//
// Secondary source — the Watch page's own `/servers` pools (fetched for
// playback anyway): every settled observation raises a per-anime high-water
// mark of the highest episode PROVEN to have real sub/dub servers. The
// displayed count is the max of the two, so a stale backend snapshot can
// never hide a dub the player just proved.
//
// The same knowledge skips dead weight in the watch boot path: when the dub
// count is proven lower than the requested episode, the dub /servers call is
// not made at all (isDubProvenAbsent).
//
// Storage (localStorage `aniraku:track-counts`):
//   { [animeId]: { sub, dub, ts, missing? } }

const STORAGE_KEY = 'aniraku:track-counts';
const TRACK_TTL_MS = 24 * 60 * 60 * 1000;
// Backend has no data at all (movies, unaired, unmapped) — retry sooner than
// a normal refresh so newly added titles appear, but not on every render.
const MISSING_TTL_MS = 6 * 60 * 60 * 1000;

export interface TrackCounts {
  sub: number;
  dub: number;
  ts: number;
  /** Backend 404 — no data for this title. */
  missing?: boolean;
}

type CountRecord = Record<string, TrackCounts>;

const listeners = new Set<() => void>();
const inflight = new Map<string, Promise<TrackCounts>>();
let cache: CountRecord | null = null;

function emit(): void {
  listeners.forEach((listener) => listener());
}

function readStore(): CountRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as CountRecord) : {};
  } catch {
    return {};
  }
}

function writeStore(record: CountRecord): void {
  cache = record;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Quota/privacy mode — the in-session map still serves this session.
  }
  emit();
}

function ensureCache(): CountRecord {
  if (cache === null) cache = readStore();
  return cache;
}

export function getTrackCounts(animeId: string): TrackCounts | null {
  const id = String(animeId || '');
  if (!id) return null;
  return ensureCache()[id] ?? null;
}

function isStale(entry: TrackCounts): boolean {
  const ttl = entry.missing ? MISSING_TTL_MS : TRACK_TTL_MS;
  return !entry.ts || Date.now() - entry.ts > ttl;
}

/**
 * Resolve track counts for one anime: cached when fresh, else one backend
 * GET (in-flight deduped). Never throws — failures resolve to null and a
 * later call retries.
 *
 * `priority` (Watch page) fetches immediately; the default (card rails)
 * goes through a small FIFO so a grid of ~20 visible cards can't fire 20
 * simultaneous requests and stall the page. Default concurrency: 3.
 */
const CARD_QUEUE_LIMIT = 3;
const cardQueue: (() => void)[] = [];
let cardQueueActive = 0;

function runQueued<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      cardQueueActive += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          cardQueueActive -= 1;
          const next = cardQueue.shift();
          if (next) next();
        });
    };
    if (cardQueueActive < CARD_QUEUE_LIMIT) run();
    else cardQueue.push(run);
  });
}

export function ensureTrackCounts(
  animeId: string,
  apiBase: string,
  options: { priority?: boolean } = {},
): Promise<TrackCounts | null> {
  const id = String(animeId || '');
  if (!id || typeof window === 'undefined') return Promise.resolve(null);
  const record = ensureCache();
  const cached = record[id];
  if (cached && !isStale(cached)) return Promise.resolve(cached);
  const existing = inflight.get(id);
  if (existing) return existing;

  const task = (async () => {
    try {
      const res = await (options.priority
        ? defaultFetchTrack(apiBase, id)
        : runQueued(() => defaultFetchTrack(apiBase, id)));
      if (res.status === 404) {
        record[id] = { sub: 0, dub: 0, ts: Date.now(), missing: true };
        return record[id];
      }
      if (res.status !== 200) throw new Error(`track fetch ${res.status}`);
      const data = res.data as { sub?: unknown; dub?: unknown };
      const sub = Math.max(0, Math.floor(Number(data?.sub) || 0));
      const dub = Math.max(0, Math.floor(Number(data?.dub) || 0));
      record[id] = { sub, dub, ts: Date.now() };
      return record[id];
    } catch {
      return cached ?? null;
    } finally {
      inflight.delete(id);
      writeStore(record);
    }
  })();
  inflight.set(id, task);
  return task;
}

async function defaultFetchTrack(
  apiBase: string,
  id: string,
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(
    `${apiBase.replace(/\/+$/, '')}/api/v1/anime/${encodeURIComponent(id)}/track`,
    {
      headers: { Accept: 'application/json' },
      cache: 'default',
    },
  );
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON error body — status handling below still applies.
  }
  return { status: res.status, data };
}

/**
 * Record a ground-truth observation from the Watch page server pools. Only
 * ever raises the high-water marks — a dub-less episode must not retract dub
 * knowledge for earlier episodes (and vice versa).
 */
export function recordAudioTrackEpisode(
  animeId: string,
  episodeNumber: number,
  hasSub: boolean,
  hasDub: boolean,
): void {
  const id = String(animeId || '');
  const ep = Math.floor(Number(episodeNumber) || 0);
  if (!id || ep <= 0 || (!hasSub && !hasDub)) return;
  const record = ensureCache();
  const prev = record[id];
  const base: TrackCounts = prev
    ? { ...prev, missing: false }
    : { sub: 0, dub: 0, ts: Date.now() };
  record[id] = {
    ...base,
    sub: hasSub ? Math.max(base.sub, ep) : base.sub,
    dub: hasDub ? Math.max(base.dub, ep) : base.dub,
    ts: Date.now(),
  };
  writeStore(record);
}

/** Subscribe to store changes (same-tab writes + cross-tab via storage). */
export function subscribeToTrackCounts(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== 'undefined') {
    window.addEventListener('storage', onStorageEvent);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorageEvent);
    }
  };
}

function onStorageEvent(e: StorageEvent): void {
  if (e.key !== STORAGE_KEY) return;
  cache = null;
  emit();
}

/**
 * True when this episode can be skipped for the dub /servers fan-out (the
 * slowest call in the watch boot path): the stored counts prove the dub
 * track is lower than the requested episode — from the backend snapshot or
 * a recent local pool observation. A `missing` entry (movies / titles the
 * endpoint has no data for) NEVER counts as absence — those use the default
 * path and most movies carry both tracks.
 */
const LOCAL_MARK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isDubProvenAbsent(
  animeId: string,
  episodeNumber: number,
): boolean {
  const id = String(animeId || '');
  const ep = Math.floor(Number(episodeNumber) || 0);
  if (!id || ep <= 0) return false;
  const counts = getTrackCounts(id);
  if (!counts || counts.missing) return false;
  if (counts.dub > 0) return counts.dub < ep;
  // dub === 0: only trust it when the entry is fresh enough that a newly
  // announced dub release would have been re-fetched.
  return Date.now() - counts.ts <= LOCAL_MARK_TTL_MS;
}

/** Same contract for subs (subs are effectively always present when > 0). */
export function isSubProvenAbsent(
  animeId: string,
  episodeNumber: number,
): boolean {
  const id = String(animeId || '');
  const ep = Math.floor(Number(episodeNumber) || 0);
  if (!id || ep <= 0) return false;
  const counts = getTrackCounts(id);
  if (!counts || counts.missing) return false;
  if (counts.sub > 0) return counts.sub < ep;
  return Date.now() - counts.ts <= LOCAL_MARK_TTL_MS;
}

// — React binding (localStorage-backed external store) —

import { useSyncExternalStore } from 'react';

const EMPTY: TrackCounts = { sub: 0, dub: 0, ts: 0, missing: true };

/** Local track counts for one AniList anime id (read-only, reactive). */
export function useTrackCounts(animeId: string): TrackCounts | null {
  const id = String(animeId || '');
  return useSyncExternalStore(
    subscribeToTrackCounts,
    () => (id ? ensureCache()[id] ?? null : null),
    () => null,
  );
}

/**
 * Display counts for one anime: the local store value when present, else a
 * zero-missing placeholder — callers treat sub 0 + missing as "unknown, use
 * the AniList aired count".
 */
export function useTrackCountsOrDefault(animeId: string): TrackCounts {
  const id = String(animeId || '');
  return useSyncExternalStore(
    subscribeToTrackCounts,
    () => {
      if (!id) return EMPTY;
      return ensureCache()[id] ?? EMPTY;
    },
    () => EMPTY,
  );
}
