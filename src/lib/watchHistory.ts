import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Local watch-history shape + merge helpers — TS port of Aniraku
// `src/lib/watchHistory.js` (entry keys, local upsert/remove/clear/subscribe,
// server row deletes) re-based onto Aniraku's LIVE localStorage contract:
//
//  Native keys (written by Watch/EpisodeList, read by History/Continue
//  Watching — unchanged by this port):
//   - `watched-episodes`        -> Record<animeId, Episode[]>
//   - `last-anime-visited`      -> Record<animeId, {timestamp, titleEnglish, titleRomaji}>
//   - `all_episode_times`       -> Record<episodeId, {currentTime, playbackPercentage, timestamp?}>
//                                  (`timestamp` = epoch ms stamped by THIS lib
//                                  on every entry it writes — Delta 2(b))
//
//  Imported keys (merged on login, read-only here):
//   - `aniraku-watch-history`   -> Aniraku's legacy entry array
//   - `aniraku:watching`         -> pref record (array/entries read
//                                  defensively; prefs fields ignored)
//
// Normalized unit everywhere is `HistoryRow` (1:1 with a `watch_history`
// table row minus user_id). Merge precedence: max(progress) wins, ties go to
// the newest timestamp.
// ---------------------------------------------------------------------------

export const LOCAL_HISTORY_KEYS = {
  WATCHED_EPISODES: 'watched-episodes',
  LAST_ANIME_VISITED: 'last-anime-visited',
  EPISODE_PLAYBACK: 'all_episode_times',
} as const;

/** Legacy stores whose rows are folded in during merge-on-login. */
export const LEGACY_HISTORY_KEYS = ['aniraku-watch-history'];

/** Window event broadcast on local history writes. */
export const WATCH_HISTORY_EVENT = 'aniraku:watch-history-changed';

/** Hard cap on locally-derived rows (Aniraku caps its local list at 100). */
const LOCAL_ROW_LIMIT = 200;

/** Normalized history row — maps 1:1 onto `watch_history` columns. */
export interface HistoryRow {
  anime_id: number;
  anime_title: string;
  anime_image: string;
  episode_number: number;
  progress: number;
  duration: number;
  timestamp: number;
}

interface LastVisitedEntry {
  timestamp?: number;
  titleEnglish?: string;
  titleRomaji?: string;
}

interface PlaybackEntry {
  currentTime?: number;
  playbackPercentage?: number;
  /** Epoch ms stamped by this lib when it writes the entry (Delta 2(b)). */
  timestamp?: number;
}

/** Minimal Episode shape needed by the native stores (see animeInterface). */
interface NativeEpisode {
  id: string;
  title: string;
  description: string | null;
  number: number;
  image: string;
  imageHash: string;
  airDate: string | null;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — local mirror simply isn't persisted
  }
}

const toCount = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

// ---------------------------------------------------------------------------
// Keys + merge precedence (ports Aniraku `historyEntryKey` + mission rules)
// ---------------------------------------------------------------------------

/** Server/native merge key: `animeId:episodeNumber`. */
export const historyRowKey = (row: HistoryRow): string =>
  `${row.anime_id}:${row.episode_number}`;

/** Aniraku entry key (`animeId:episode`) for legacy-shaped objects. */
export const historyEntryKey = (entry: {
  animeId?: unknown;
  anime_id?: unknown;
  episode?: unknown;
  episode_number?: unknown;
}): string =>
  `${String(entry?.animeId ?? entry?.anime_id ?? '')}:${Number(
    entry?.episode ?? entry?.episode_number ?? 0,
  )}`;

/** Prefer max(progress); on a tie the newest timestamp wins. */
export const mergeHistoryRow = (a: HistoryRow, b: HistoryRow): HistoryRow => {
  if (a.progress !== b.progress) return a.progress > b.progress ? a : b;
  return a.timestamp >= b.timestamp ? a : b;
};

/** Field-level equality used to decide whether an upload is needed. */
export const historyRowEquals = (a: HistoryRow, b: HistoryRow): boolean =>
  a.anime_title === b.anime_title &&
  a.anime_image === b.anime_image &&
  a.progress === b.progress &&
  a.duration === b.duration &&
  a.timestamp === b.timestamp;

// ---------------------------------------------------------------------------
// Row builders
// ---------------------------------------------------------------------------

/** Shape-map one Aniraku legacy entry (`aniraku-watch-history` element). */
function legacyEntryToRow(item: unknown): HistoryRow | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, unknown>;
  const animeId = Number(raw.animeId ?? raw.anime_id);
  if (!Number.isFinite(animeId) || animeId <= 0) return null;
  const episode = Number(raw.episode ?? raw.episode_number ?? 0);
  if (!Number.isFinite(episode) || episode <= 0) return null;
  const rawTitle = raw.title ?? raw.anime_title;
  const title =
    typeof rawTitle === 'object' && rawTitle !== null
      ? String(
          (rawTitle as Record<string, unknown>).english ??
            (rawTitle as Record<string, unknown>).romaji ??
            (rawTitle as Record<string, unknown>).userPreferred ??
            '',
        )
      : String(rawTitle ?? '');
  return {
    anime_id: animeId,
    anime_title: title,
    anime_image: String(raw.image ?? raw.anime_image ?? ''),
    episode_number: episode,
    progress: toCount(raw.time ?? raw.progress),
    duration: toCount(raw.duration),
    timestamp: toCount(raw.timestamp),
  };
}

/** Rows derived from the LIVE native stores (one row per watched episode). */
function readNativeRows(): HistoryRow[] {
  const watched = readJSON<Record<string, NativeEpisode[]>>(
    LOCAL_HISTORY_KEYS.WATCHED_EPISODES,
    {},
  );
  const lastVisited = readJSON<Record<string, LastVisitedEntry>>(
    LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED,
    {},
  );
  const playback = readJSON<Record<string, PlaybackEntry>>(
    LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK,
    {},
  );

  const rows: HistoryRow[] = [];
  for (const [animeId, episodes] of Object.entries(watched)) {
    const numericId = Number(animeId);
    if (!Number.isFinite(numericId) || numericId <= 0) continue;
    if (!Array.isArray(episodes) || episodes.length === 0) continue;

    const visit = lastVisited[animeId] ?? {};
    const title = visit.titleEnglish || visit.titleRomaji || '';
    const timestamp = toCount(visit.timestamp);

    for (const episode of episodes) {
      if (!episode || typeof episode !== 'object') continue;
      const number = Number(episode.number);
      if (!Number.isFinite(number) || number <= 0) continue;
      const pb =
        playback[episode.id] ??
        playback[`${animeId}-episode-${number}`] ??
        null;
      const current = Math.floor(Number(pb?.currentTime ?? 0)) || 0;
      const pct = Number(pb?.playbackPercentage ?? 0);
      // `duration` is not stored natively — recover it from the percentage
      // when both values are known, else 0 (row still records the visit).
      const duration =
        current > 0 && pct > 0 ? Math.round(current / (pct / 100)) : 0;
      rows.push({
        anime_id: numericId,
        anime_title: title,
        anime_image: String(episode.image ?? ''),
        episode_number: number,
        progress: current,
        duration,
        timestamp,
      });
    }
  }
  return rows;
}

/** Rows imported from `aniraku-watch-history` (+ defensive `aniraku:watching`). */
function readLegacyRows(): HistoryRow[] {
  const rows: HistoryRow[] = [];

  const aniraku = readJSON<unknown[]>('aniraku-watch-history', []);
  if (Array.isArray(aniraku)) {
    for (const item of aniraku) {
      const row = legacyEntryToRow(item);
      if (row) rows.push(row);
    }
  }

  // `aniraku:watching` is a preference record today; if a build ever stores
  // history entries there (array or `entries`/`history` fields), fold them in.
  const watching = readJSON<unknown>('aniraku:watching', null);
  const candidates: unknown[] = Array.isArray(watching)
    ? watching
    : watching && typeof watching === 'object'
      ? [
          ...(Array.isArray((watching as Record<string, unknown>).entries)
            ? ((watching as Record<string, unknown>).entries as unknown[])
            : []),
          ...(Array.isArray((watching as Record<string, unknown>).history)
            ? ((watching as Record<string, unknown>).history as unknown[])
            : []),
        ]
      : [];
  for (const item of candidates) {
    const row = legacyEntryToRow(item);
    if (row) rows.push(row);
  }

  return rows;
}

/**
 * All local history rows (native + legacy), deduped by `animeId:episode`
 * with the shared merge precedence.
 */
export function readLocalHistoryRows(): HistoryRow[] {
  const byKey = new Map<string, HistoryRow>();
  const add = (row: HistoryRow) => {
    const key = historyRowKey(row);
    const existing = byKey.get(key);
    byKey.set(key, existing ? mergeHistoryRow(existing, row) : row);
  };
  for (const row of readNativeRows()) add(row);
  for (const row of readLegacyRows()) add(row);
  return [...byKey.values()]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, LOCAL_ROW_LIMIT);
}

// ---------------------------------------------------------------------------
// Local reconciliation — server ∪ local written back into the native stores
// ---------------------------------------------------------------------------

function synthEpisode(animeId: string, row: HistoryRow): NativeEpisode {
  return {
    id: `${animeId}-episode-${row.episode_number}`,
    title: '',
    description: null,
    number: row.episode_number,
    image: row.anime_image,
    imageHash: '',
    airDate: null,
  };
}

/**
 * Fold merged rows back into the LIVE native stores so every local reader
 * (History page, Continue Watching, resume) sees max(server, local):
 *  - `watched-episodes` gains server-only anime/episodes (synthesized Episode)
 *  - `last-anime-visited[animeId].timestamp` = max(local, server)
 *  - `all_episode_times[episodeId]` = max(progress) + derived percentage
 * Never lowers anything already stored locally.
 */
export function reconcileLocalHistory(rows: HistoryRow[]): void {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const watched = readJSON<Record<string, NativeEpisode[]>>(
    LOCAL_HISTORY_KEYS.WATCHED_EPISODES,
    {},
  );
  const lastVisited = readJSON<Record<string, LastVisitedEntry>>(
    LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED,
    {},
  );
  const playback = readJSON<Record<string, PlaybackEntry>>(
    LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK,
    {},
  );

  let watchedDirty = false;
  let visitedDirty = false;
  let playbackDirty = false;

  for (const row of rows) {
    if (!Number.isFinite(row.anime_id) || row.anime_id <= 0) continue;
    const animeId = String(row.anime_id);
    const eps = Array.isArray(watched[animeId]) ? watched[animeId] : null;

    // --- episode list -----------------------------------------------------
    let episodeId: string;
    const existing = eps?.find((e) => Number(e.number) === row.episode_number);
    if (existing) {
      episodeId = existing.id;
      // Server art wins only when the local episode has none.
      if (!existing.image && row.anime_image) {
        existing.image = row.anime_image;
        watchedDirty = true;
      }
    } else {
      const synth = synthEpisode(animeId, row);
      episodeId = synth.id;
      if (!eps) {
        watched[animeId] = [synth];
      } else if (
        !eps.some((e) => Number(e.number) === row.episode_number) &&
        row.episode_number > Math.max(...eps.map((e) => Number(e.number) || 0))
      ) {
        // keep the "last element = most recently watched" invariant
        eps.push(synth);
      } else if (!eps.some((e) => e.id === synth.id)) {
        eps.push(synth);
      }
      watchedDirty = true;
    }

    // --- last visit -------------------------------------------------------
    const visit = lastVisited[animeId] ?? {};
    const nextVisit: LastVisitedEntry = { ...visit };
    if (toCount(visit.timestamp) < row.timestamp) {
      nextVisit.timestamp = row.timestamp;
      visitedDirty = true;
    }
    if (!nextVisit.titleEnglish && !nextVisit.titleRomaji && row.anime_title) {
      nextVisit.titleEnglish = row.anime_title;
      visitedDirty = true;
    }
    if (visitedDirty) lastVisited[animeId] = nextVisit;

    // --- playback / resume ------------------------------------------------
    const pb =
      playback[episodeId] ??
      playback[`${animeId}-episode-${row.episode_number}`] ??
      null;
    const localCurrent = Math.floor(Number(pb?.currentTime ?? 0)) || 0;
    if (row.progress > localCurrent) {
      const percentage =
        row.duration > 0
          ? Math.min(100, Math.round((row.progress / row.duration) * 100))
          : Number(pb?.playbackPercentage ?? 0);
      // Delta 2(b) — ONLY `all_episode_times` write site in this lib: stamp
      // epoch-ms on the entry (server event time when the row carries one,
      // write time otherwise) so mergeHistoryRow's newest-timestamp tiebreak
      // has data to work with.
      playback[episodeId] = {
        currentTime: row.progress,
        playbackPercentage: percentage,
        timestamp: row.timestamp || Date.now(),
      };
      playbackDirty = true;
    }
  }

  if (watchedDirty) writeJSON(LOCAL_HISTORY_KEYS.WATCHED_EPISODES, watched);
  if (visitedDirty) writeJSON(LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED, lastVisited);
  if (playbackDirty) writeJSON(LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK, playback);
  if (watchedDirty || visitedDirty || playbackDirty) {
    publishWatchHistory({ type: 'reconcile', keys: rows.map(historyRowKey) });
  }
}

// ---------------------------------------------------------------------------
// Episode resume query (Delta 2 — Player resume path)
// ---------------------------------------------------------------------------

/** Winning resume values for one (anime, episode). */
export interface EpisodeProgress {
  /** Seconds — the same unit `all_episode_times.currentTime` uses. */
  currentTime: number;
  /** 0-100; 0 when the winner has no percentage (durationless server row). */
  playbackPercentage: number;
  /** Epoch ms of the winning candidate (0 = unknown). */
  timestamp: number;
  /** Which store produced the winning values. */
  source: 'server' | 'local';
}

/** Local candidate: native `watched-episodes` id lookup, then canonical key. */
function readLocalEpisodeProgress(
  animeId: number,
  episode: number,
): EpisodeProgress | null {
  const watched = readJSON<Record<string, NativeEpisode[]>>(
    LOCAL_HISTORY_KEYS.WATCHED_EPISODES,
    {},
  );
  const native =
    watched[String(animeId)]?.find(
      (entry) => Number(entry.number) === episode,
    ) ?? null;
  const playback = readJSON<Record<string, PlaybackEntry>>(
    LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK,
    {},
  );
  const entry =
    (native ? playback[native.id] : undefined) ??
    playback[`${animeId}-episode-${episode}`] ??
    null;
  if (!entry) return null;
  return {
    currentTime: Math.floor(Number(entry.currentTime ?? 0)) || 0,
    playbackPercentage: Number(entry.playbackPercentage ?? 0),
    timestamp: toCount(entry.timestamp),
    source: 'local',
  };
}

/** Server candidate: scoped `watch_history` row (RLS enforces ownership). */
async function readServerEpisodeProgress(
  userId: string,
  animeId: number,
  episode: number,
): Promise<EpisodeProgress | null> {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .select('progress,duration,timestamp')
      .eq('user_id', userId)
      .eq('anime_id', animeId)
      .eq('episode_number', episode)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { progress?: unknown; duration?: unknown; timestamp?: unknown };
    const progress = toCount(row.progress);
    const duration = toCount(row.duration);
    return {
      currentTime: progress,
      playbackPercentage:
        duration > 0
          ? Math.min(100, Math.round((progress / duration) * 100))
          : 0,
      timestamp: toCount(row.timestamp),
      source: 'server',
    };
  } catch {
    // offline / unconfigured client — treated as "no server row"
    return null;
  }
}

/**
 * RESUME POINT for one episode (Delta 2).
 *
 * - Signed in → SERVER-FIRST: a scoped `watch_history` row
 *   (eq user_id + anime_id + episode_number) is the primary source; the local
 *   `all_episode_times` entry fills the gap when the server has none (and is
 *   returned if the server query fails).
 * - Guest → local `all_episode_times` only (no session probe when `userId`
 *   is passed as `null`).
 * - Both present → THIS LIB'S EXISTING MERGE PRECEDENCE: max(progress) wins,
 *   ties go to the newest timestamp (identical to `mergeHistoryRow`).
 * - `null` when neither store knows the episode.
 *
 * @param animeId numeric AniList id (string accepted, coerced)
 * @param episode episode number (1-based)
 * @param userId  optional: omit → auto-detect via `supabase.auth.getSession()`;
 *                pass a userId to skip the probe; pass `null` to force
 *                local-only (guest). Documented as "your call" per Delta 2.
 */
export async function getEpisodeProgress(
  animeId: string | number,
  episode: number,
  userId?: string | null,
): Promise<EpisodeProgress | null> {
  const numericId = Number(animeId);
  const numericEpisode = Number(episode);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;
  if (!Number.isFinite(numericEpisode) || numericEpisode <= 0) return null;

  const local = readLocalEpisodeProgress(numericId, numericEpisode);

  let uid = userId;
  if (uid === undefined) {
    try {
      const { data } = await supabase.auth.getSession();
      uid = data.session?.user?.id ?? null;
    } catch {
      uid = null;
    }
  }
  if (!uid) return local; // guest → local as today

  const server = await readServerEpisodeProgress(uid, numericId, numericEpisode);
  if (!server) return local;
  if (!local) return server;
  // max(progress), tie → newest timestamp (same rule as mergeHistoryRow)
  if (server.currentTime !== local.currentTime) {
    return server.currentTime > local.currentTime ? server : local;
  }
  return server.timestamp >= local.timestamp ? server : local;
}

// ---------------------------------------------------------------------------
// Events (ports Aniraku subscribeToWatchHistory / publish)
// ---------------------------------------------------------------------------

export interface WatchHistoryChange {
  type: 'upsert' | 'remove' | 'clear' | 'reconcile' | 'sync';
  keys?: string[];
}

export function publishWatchHistory(detail: WatchHistoryChange): void {
  try {
    window.dispatchEvent(new CustomEvent(WATCH_HISTORY_EVENT, { detail }));
  } catch {
    // window unavailable (SSR/test) — nothing to notify
  }
}

/** Local (same-tab CustomEvent) + cross-tab `storage` subscription. */
export function subscribeToWatchHistory(
  listener: (detail: WatchHistoryChange) => void,
): () => void {
  const handleChange = (event: Event) =>
    listener((event as CustomEvent<WatchHistoryChange>).detail || { type: 'sync' });
  const handleStorage = (event: StorageEvent) => {
    const watched = Object.values(LOCAL_HISTORY_KEYS);
    if (
      event.key === null ||
      watched.includes(event.key as (typeof watched)[number]) ||
      LEGACY_HISTORY_KEYS.includes(event.key)
    ) {
      listener({ type: 'sync', keys: [] });
    }
  };
  window.addEventListener(WATCH_HISTORY_EVENT, handleChange);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(WATCH_HISTORY_EVENT, handleChange);
    window.removeEventListener('storage', handleStorage);
  };
}

// ---------------------------------------------------------------------------
// Server row deletes (Aniraku removeWatchHistoryEntries / clearWatchHistory)
// ---------------------------------------------------------------------------

/** Remove one anime's rows locally (whole-anime removal, History semantics). */
export function removeAnimeLocal(animeId: string | number): void {
  const watched = readJSON<Record<string, NativeEpisode[]>>(
    LOCAL_HISTORY_KEYS.WATCHED_EPISODES,
    {},
  );
  delete watched[String(animeId)];
  writeJSON(LOCAL_HISTORY_KEYS.WATCHED_EPISODES, watched);

  const lastVisited = readJSON<Record<string, LastVisitedEntry>>(
    LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED,
    {},
  );
  delete lastVisited[String(animeId)];
  writeJSON(LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED, lastVisited);
  publishWatchHistory({ type: 'remove', keys: [`${animeId}`] });
}

/** Best-effort server delete scoped to `user_id` (RLS enforces ownership). */
export async function removeAnimeFromServer(
  userId: string,
  animeId: string | number,
): Promise<void> {
  try {
    await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', userId)
      .eq('anime_id', Number(animeId));
  } catch {
    // offline / unconfigured client — local removal already happened
  }
}

/** Clear local history and (optionally) every server row for the user. */
export async function clearWatchHistory(
  { userId }: { userId?: string | null } = {},
): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_HISTORY_KEYS.WATCHED_EPISODES);
    localStorage.removeItem(LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED);
    localStorage.removeItem(LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK);
  } catch {
    // storage unavailable
  }
  publishWatchHistory({ type: 'clear', keys: [] });
  if (userId) {
    try {
      await supabase.from('watch_history').delete().eq('user_id', userId);
    } catch {
      // server unreachable
    }
  }
}
