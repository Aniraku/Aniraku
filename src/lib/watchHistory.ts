import { supabase } from './supabase';
import {
  stampEpisodeWatch,
  clearEpisodeWatches,
  forgetEpisodeWatches,
  episodeWatchTime,
} from './episodeWatchTimes';

// Local watch-history shape + merge helpers — TS port of Aniraku
// `src/lib/watchHistory.js` (entry keys, local upsert/remove/clear/subscribe,
// Server row deletes) re-based onto the LIVE localStorage contract:
//
//  Native keys (written by Watch/EpisodeList, read by History/Continue
//  Watching — unchanged by this port):
//   - `watched-episodes`        -> Record<animeId, Episode[]>
//   - `last-anime-visited`      -> Record<animeId, {timestamp, titleEnglish, titleRomaji}>
//   - `all_episode_times`       -> Record<episodeId, {currentTime, playbackPercentage, timestamp?}>
//                                  (`timestamp` = epoch ms stamped by THIS lib
//                                  on every entry it writes — (b))
//
//  Imported keys (merged on login, read-only here):
//   - `aniraku-watch-history` -> the legacy entry array
//   - `aniraku:watching`         -> pref record (array/entries read
//                                  defensively; prefs fields ignored)
//
// Normalized unit everywhere is `HistoryRow` (1:1 with a `watch_history`
// table row minus user_id). Merge precedence: max(progress) wins, ties go to
// the newest timestamp.

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

// Keys + merge precedence (ports Aniraku `historyEntryKey` + mission rules)

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

/** Prefer max(progress); on a tie the newest timestamp wins.
 * Empty titles/images never clobber good ones — the winner keeps the
 * loser's non-empty title/image when its own is blank. */
export const mergeHistoryRow = (a: HistoryRow, b: HistoryRow): HistoryRow => {
  const winner =
    a.progress !== b.progress
      ? a.progress > b.progress
        ? a
        : b
      : a.timestamp >= b.timestamp
        ? a
        : b;
  const loser = winner === a ? b : a;
  const anime_title = winner.anime_title || loser.anime_title || '';
  const anime_image = winner.anime_image || loser.anime_image || '';
  if (anime_title === winner.anime_title && anime_image === winner.anime_image)
    return winner;
  return { ...winner, anime_title, anime_image };
};

/** Episode counts as completed: >=90% or within 5s of the end. */
export function isEpisodeCompleted(progress: number, duration: number): boolean {
  const p = Math.floor(Number(progress) || 0);
  const d = Math.floor(Number(duration) || 0);
  if (p <= 0 || d <= 0) return p > 0 && d <= 0 ? false : false;
  if (p >= d) return true;
  return p >= Math.max(d - 5, Math.floor(d * 0.9));
}

/** Field-level equality used to decide whether an upload is needed.
 * Duration allows ±2s tolerance: native rows reconstruct duration from
 * current/(pct/100) with rounding error vs the server's exact value. */
export const historyRowEquals = (a: HistoryRow, b: HistoryRow): boolean => {
  if (a.anime_title !== b.anime_title) return false;
  if (a.anime_image !== b.anime_image) return false;
  if (a.progress !== b.progress) return false;
  if (Math.abs((a.duration || 0) - (b.duration || 0)) > 2) return false;
  if (a.timestamp !== b.timestamp) return false;
  return true;
};

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
      // Row timestamp = per-EPISODE watch time (genuine watch event), NOT
      // the per-anime visit time. The visit time only seeds rows that were
      // never stamped (pre-timestamp installs). This stops every page visit
      // from changing the fingerprint and triggering an upload loop.
      const episodeStamp = episodeWatchTime(animeId, number);
      const timestamp =
        episodeStamp > 0 ? episodeStamp : toCount(visit.timestamp);
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
/**
 * Heal the unified `watched-episodes` record from the suffixed
 * `watched-episodes-{animeId}` keys.
 *
 * History / Continue Watching / the sync engine read ONLY the unified
 * record, while Info checkmarks and older write paths also maintained
 * per-anime suffixed keys — any episode present in a suffixed key but
 * missing from the unified record made its anime vanish from History.
 * This unions every suffixed key into the unified record (dedupe by
 * episode id, then number), so pre-heal watches reappear. Runs once at
 * boot (main.tsx) and at the start of merge-on-login. Returns the
 * number of episodes healed.
 */
export function healUnifiedHistory(): number {
  let healed = 0;
  try {
    const unified = readJSON<Record<string, NativeEpisode[]>>(
      LOCAL_HISTORY_KEYS.WATCHED_EPISODES,
      {},
    );
    let dirty = false;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith(`${LOCAL_HISTORY_KEYS.WATCHED_EPISODES}-`) &&
        key !== LOCAL_HISTORY_KEYS.WATCHED_EPISODES
      ) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      const animeId = key.slice(LOCAL_HISTORY_KEYS.WATCHED_EPISODES.length + 1);
      if (!animeId) continue;
      let suffixed: unknown;
      try {
        suffixed = JSON.parse(localStorage.getItem(key) || '[]');
      } catch {
        continue;
      }
      if (!Array.isArray(suffixed) || suffixed.length === 0) continue;
      const list = Array.isArray(unified[animeId]) ? unified[animeId] : [];
      const seenIds = new Set(
        list
          .map((e) => String(e?.id ?? ''))
          .filter((id) => id.length > 0),
      );
      const seenNumbers = new Set(
        list
          .map((e) => Math.floor(Number(e?.number)) || 0)
          .filter((n) => n > 0),
      );
      for (const raw of suffixed) {
        if (!raw || typeof raw !== 'object') continue;
        const entry = raw as Record<string, unknown>;
        const number = Math.floor(Number(entry.number));
        if (!Number.isFinite(number) || number <= 0) continue;
        const id = String(entry.id ?? '').trim() || `${animeId}-episode-${number}`;
        if (seenIds.has(id) || seenNumbers.has(number)) continue;
        seenIds.add(id);
        seenNumbers.add(number);
        list.push({
          id,
          title: String(entry.title ?? ''),
          description:
            typeof entry.description === 'string' ? entry.description : null,
          number,
          image: String(entry.image ?? ''),
          imageHash: String(entry.imageHash ?? ''),
          airDate: typeof entry.airDate === 'string' ? entry.airDate : null,
        });
        healed += 1;
        dirty = true;
      }
      if (Array.isArray(unified[animeId]) === false && list.length > 0) {
        unified[animeId] = list;
        dirty = true;
      }
    }
    if (dirty) writeJSON(LOCAL_HISTORY_KEYS.WATCHED_EPISODES, unified);
  } catch {
    // storage unavailable — nothing to heal
  }
  return healed;
}

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

    // --- per-episode watch time (History / Continue Watching "latest") --
    // Server rows carry per-episode timestamps: fold them in so the
    // most-recently-watched pick works cross-device. Never lowers a
    // newer local stamp (stampEpisodeWatch is max-only).
    if (row.timestamp > 0) {
      stampEpisodeWatch(animeId, row.episode_number, row.timestamp);
    }

    // --- last visit -------------------------------------------------------
    // Per-anime guard (not the loop-global flag): each row decides its own
    // visit write so a future per-row condition can't mis-fire siblings.
    const visit = lastVisited[animeId] ?? {};
    const nextVisit: LastVisitedEntry = { ...visit };
    let visitChanged = false;
    if (toCount(visit.timestamp) < row.timestamp) {
      nextVisit.timestamp = row.timestamp;
      visitChanged = true;
    }
    if (!nextVisit.titleEnglish && !nextVisit.titleRomaji && row.anime_title) {
      nextVisit.titleEnglish = row.anime_title;
      visitChanged = true;
    }
    if (visitChanged) {
      lastVisited[animeId] = nextVisit;
      visitedDirty = true;
    }

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

/** Remove one anime's rows locally (whole-anime removal, History semantics).
 * Full cleanup: unified + suffixed episode lists, visit record, per-episode
 * playback entries (canonical + provider-id keys), per-episode watch-time
 * stamps. Publishes per-episode keys so exact-key subscribers also fire. */
export function removeAnimeLocal(animeId: string | number): void {
  const key = String(animeId);
  const watched = readJSON<Record<string, NativeEpisode[]>>(
    LOCAL_HISTORY_KEYS.WATCHED_EPISODES,
    {},
  );
  const episodes = Array.isArray(watched[key]) ? watched[key] : [];
  const numbers = episodes
    .map((e) => Math.floor(Number(e?.number)) || 0)
    .filter((n) => n > 0);
  const ids = episodes.map((e) => String(e?.id ?? '')).filter(Boolean);
  delete watched[key];
  writeJSON(LOCAL_HISTORY_KEYS.WATCHED_EPISODES, watched);

  try {
    localStorage.removeItem(`${LOCAL_HISTORY_KEYS.WATCHED_EPISODES}-${key}`);
  } catch {
    // storage unavailable
  }

  const lastVisited = readJSON<Record<string, LastVisitedEntry>>(
    LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED,
    {},
  );
  delete lastVisited[key];
  writeJSON(LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED, lastVisited);

  try {
    const playback = readJSON<Record<string, PlaybackEntry>>(
      LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK,
      {},
    );
    let dirty = false;
    for (const n of numbers) {
      for (const k of [`${key}-episode-${n}`]) {
        if (k in playback) {
          delete playback[k];
          dirty = true;
        }
      }
    }
    for (const id of ids) {
      if (id in playback) {
        delete playback[id];
        dirty = true;
      }
    }
    if (dirty) writeJSON(LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK, playback);
  } catch {
    // storage unavailable
  }
  forgetEpisodeWatches(key);

  const keys = numbers.map((n) => `${key}:${n}`);
  publishWatchHistory({ type: 'remove', keys: keys.length ? keys : [key] });
}

/** Remove a single episode locally (per-episode removal, upgraded History).
 * Drops the episode from unified + suffixed lists, its playback entries and
 * its watch-time stamp. When the anime has no episodes left the visit record
 * is also dropped so the card vanishes. */
export function removeEpisodeLocal(
  animeId: string | number,
  episodeNumber: number,
): void {
  const key = String(animeId);
  const ep = Math.floor(Number(episodeNumber));
  if (!key || !Number.isFinite(ep) || ep <= 0) return;
  const watched = readJSON<Record<string, NativeEpisode[]>>(
    LOCAL_HISTORY_KEYS.WATCHED_EPISODES,
    {},
  );
  const list = Array.isArray(watched[key]) ? watched[key] : [];
  const target = list.find((e) => Math.floor(Number(e?.number)) === ep);
  const targetId = target ? String(target.id ?? '') : '';
  const next = list.filter((e) => Math.floor(Number(e?.number)) !== ep);
  if (next.length) watched[key] = next;
  else delete watched[key];
  writeJSON(LOCAL_HISTORY_KEYS.WATCHED_EPISODES, watched);

  try {
    const suffixedKey = `${LOCAL_HISTORY_KEYS.WATCHED_EPISODES}-${key}`;
    const parsed = JSON.parse(localStorage.getItem(suffixedKey) || '[]');
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter(
        (e) =>
          e &&
          typeof e === 'object' &&
          Math.floor(Number((e as Record<string, unknown>).number)) !== ep,
      );
      if (filtered.length) localStorage.setItem(suffixedKey, JSON.stringify(filtered));
      else localStorage.removeItem(suffixedKey);
    }
  } catch {
    // storage unavailable
  }

  try {
    const playback = readJSON<Record<string, PlaybackEntry>>(
      LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK,
      {},
    );
    let dirty = false;
    for (const k of [`${key}-episode-${ep}`, targetId]) {
      if (k && k in playback) {
        delete playback[k];
        dirty = true;
      }
    }
    if (dirty) writeJSON(LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK, playback);
  } catch {
    // storage unavailable
  }

  try {
    const map = JSON.parse(
      localStorage.getItem('aniraku:episode-watch-times') || '{}',
    );
    const stampKey = `${key}-episode-${ep}`;
    if (map && typeof map === 'object' && stampKey in map) {
      delete map[stampKey];
      localStorage.setItem('aniraku:episode-watch-times', JSON.stringify(map));
    }
  } catch {
    // storage unavailable
  }

  if (!next.length) {
    const lastVisited = readJSON<Record<string, LastVisitedEntry>>(
      LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED,
      {},
    );
    delete lastVisited[key];
    writeJSON(LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED, lastVisited);
  }
  publishWatchHistory({ type: 'remove', keys: [`${key}:${ep}`] });
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

/** Best-effort single-episode server delete (per-episode removal path). */
export async function removeEpisodeFromServer(
  userId: string,
  animeId: string | number,
  episodeNumber: number,
): Promise<void> {
  const ep = Math.floor(Number(episodeNumber));
  if (!Number.isFinite(ep) || ep <= 0) return;
  try {
    await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', userId)
      .eq('anime_id', Number(animeId))
      .eq('episode_number', ep);
  } catch {
    // offline / unconfigured client — local removal already happened
  }
}

export interface PurgedEpisode {
  animeId: string;
  episode: number;
}

/**
 * Purge "selected but never played" episodes from the local stores.
 *
 * Older builds recorded a watch event on mere episode SELECT/navigation,
 * so browsing inflated watch counts — and the server rows uploaded from
 * them (progress 0) made bulk export report full progress for half-watched
 * series. Selection no longer records; this removes the leftovers: unified
 * entries with NO `all_episode_times` playback record (genuine playback —
 * HLS ticks, completions, embed progress — always leaves one, even at 0s).
 * Also drops their suffixed-list copies and watch-time stamps, and (via
 * the sync engine) their 0-progress server rows. Returns what was purged.
 */
export function purgeUnplayedSelectionsLocal(): PurgedEpisode[] {
  const purged: PurgedEpisode[] = [];
  try {
    const watched = readJSON<Record<string, NativeEpisode[]>>(
      LOCAL_HISTORY_KEYS.WATCHED_EPISODES,
      {},
    );
    const playback = readJSON<Record<string, PlaybackEntry>>(
      LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK,
      {},
    );
    let dirty = false;
    for (const [animeId, eps] of Object.entries(watched)) {
      if (!Array.isArray(eps) || eps.length === 0) continue;
      const kept = eps.filter((entry) => {
        const n = Math.floor(Number(entry?.number)) || 0;
        if (!(n > 0)) {
          dirty = true;
          return false;
        }
        const id = String(entry?.id ?? '');
        if (
          (id && id in playback) ||
          `${animeId}-episode-${n}` in playback
        ) {
          return true;
        }
        purged.push({ animeId, episode: n });
        dirty = true;
        return false;
      });
      if (kept.length) watched[animeId] = kept;
      else delete watched[animeId];
    }
    if (!dirty) return purged;
    writeJSON(LOCAL_HISTORY_KEYS.WATCHED_EPISODES, watched);
    try {
      for (const { animeId, episode } of purged) {
        const key = `${LOCAL_HISTORY_KEYS.WATCHED_EPISODES}-${animeId}`;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;
        const filtered = parsed.filter(
          (entry) =>
            !entry ||
            typeof entry !== 'object' ||
            Math.floor(
              Number((entry as Record<string, unknown>).number),
            ) !== episode,
        );
        if (filtered.length) localStorage.setItem(key, JSON.stringify(filtered));
        else localStorage.removeItem(key);
      }
    } catch {
      // storage unavailable — suffixed copies simply remain
    }
    try {
      const mapKey = 'aniraku:episode-watch-times';
      const map: unknown = JSON.parse(
        localStorage.getItem(mapKey) || '{}',
      );
      if (map && typeof map === 'object' && !Array.isArray(map)) {
        const record = map as Record<string, unknown>;
        let stampDirty = false;
        for (const { animeId, episode } of purged) {
          const stampKey = `${animeId}-episode-${episode}`;
          if (stampKey in record) {
            delete record[stampKey];
            stampDirty = true;
          }
        }
        if (stampDirty) localStorage.setItem(mapKey, JSON.stringify(record));
      }
    } catch {
      // storage unavailable — stamps simply remain
    }
    publishWatchHistory({
      type: 'remove',
      keys: purged.map((p) => `${p.animeId}:${p.episode}`),
    });
  } catch {
    // storage unavailable — nothing purged
  }
  return purged;
}

/** Clear local history and (optionally) every server row for the user. */
export async function clearWatchHistory(
  { userId }: { userId?: string | null } = {},
): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_HISTORY_KEYS.WATCHED_EPISODES);
    localStorage.removeItem(LOCAL_HISTORY_KEYS.LAST_ANIME_VISITED);
    localStorage.removeItem(LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK);
    // Suffixed per-anime keys (Info checkmarks) + per-episode timestamps:
    // leaving them would resurrect History cards on the next heal/read.
    const suffixed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith(`${LOCAL_HISTORY_KEYS.WATCHED_EPISODES}-`) &&
        key !== LOCAL_HISTORY_KEYS.WATCHED_EPISODES
      ) {
        suffixed.push(key);
      }
    }
    for (const key of suffixed) localStorage.removeItem(key);
    clearEpisodeWatches();
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
