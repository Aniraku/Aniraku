// Per-episode last-watched timestamps.
//
// `last-anime-visited[animeId].timestamp` is per-ANIME (bumped on every
// Watch page visit), so it cannot tell which episode was watched last —
// History and Continue Watching fell back to "array tail", which breaks
// on rewatch and on merge-order. This map (`{animeId}-episode-{n}` →
// epoch ms) records every genuine watch event and is the authority for
// "most recently watched". Server row timestamps fold in via
// reconcileLocalHistory, so cross-device ordering works too.

const KEY = 'aniraku:episode-watch-times';

function readAll(): Record<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const n = Math.floor(Number(value));
      if (key && Number.isFinite(n) && n > 0) out[key] = n;
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, number>): void {
  try {
    // Cap the map (5k entries ≈ 120KB) — oldest timestamps evicted first.
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries.slice(0, 5000))));
  } catch {
    // storage unavailable — timestamps simply aren't persisted
  }
}

export const episodeTimeKey = (
  animeId: string | number,
  episodeNumber: number,
): string => `${String(animeId)}-episode-${Math.floor(Number(episodeNumber))}`;

/** Stamp "watched now" for one episode. Never lowers an existing stamp. */
export function stampEpisodeWatch(
  animeId: string | number,
  episodeNumber: number,
  at: number = Date.now(),
): void {
  const n = Math.floor(Number(episodeNumber));
  if (!animeId || !Number.isFinite(n) || n <= 0) return;
  const time = Math.floor(Number(at));
  if (!Number.isFinite(time) || time <= 0) return;
  const map = readAll();
  const key = episodeTimeKey(animeId, n);
  if ((map[key] ?? 0) >= time) return;
  map[key] = time;
  writeAll(map);
}

/** Last-watched ms for one episode (0 = unknown). */
export function episodeWatchTime(
  animeId: string | number,
  episodeNumber: number,
): number {
  const n = Math.floor(Number(episodeNumber));
  if (!animeId || !Number.isFinite(n) || n <= 0) return 0;
  try {
    return readAll()[episodeTimeKey(animeId, n)] ?? 0;
  } catch {
    return 0;
  }
}

/** Most-recently-watched episode number from a list, or null. */
export function mostRecentEpisode(
  animeId: string | number,
  episodeNumbers: number[],
): number | null {
  let best: number | null = null;
  let bestTime = 0;
  for (const n of episodeNumbers) {
    const t = episodeWatchTime(animeId, n);
    if (t > bestTime) {
      bestTime = t;
      best = n;
    }
  }
  return best;
}

/** Remove every stamp for one anime (history removal path). */
export function forgetEpisodeWatches(animeId: string | number): void {
  const prefix = `${String(animeId)}-episode-`;
  const map = readAll();
  let dirty = false;
  for (const key of Object.keys(map)) {
    if (key.startsWith(prefix)) {
      delete map[key];
      dirty = true;
    }
  }
  if (dirty) writeAll(map);
}

/** Clear the whole map (history wipe path). */
export function clearEpisodeWatches(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // storage unavailable
  }
}

export const EPISODE_WATCH_TIMES_KEY = KEY;
