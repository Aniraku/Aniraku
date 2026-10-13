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
  getSyncStatus,
  updateSyncProgress,
  type SyncStatus,
} from './sync';
import {
  averageRating,
  updateSyncScore,
} from './episodeRatings';

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
