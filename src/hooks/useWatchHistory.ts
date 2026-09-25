import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Episode } from './animeInterface';
import { watchPathFor } from '../utils/animePaths';
import {
  ensureDataSync,
  fetchServerHistoryRows,
  forgetSyncedAnime,
  getSessionUserId,
  subscribeToSession,
} from '../lib/sync';
import {
  reconcileLocalHistory,
  removeAnimeFromServer,
  subscribeToWatchHistory,
} from '../lib/watchHistory';

/**
 * Local watch-history aggregation for the /history page.
 *
 * Reuses the exact localStorage keys & shapes written by the existing app:
 *  - `watched-episodes`        -> Record<animeId, Episode[]>   (see EpisodeCard / EpisodeList)
 *  - `last-anime-visited`      -> Record<animeId, { timestamp: ms, titleEnglish, titleRomaji }>
 *  - `all_episode_times`       -> Record<episodeId, { currentTime, playbackPercentage }>
 *
 * Preference persistence mirrors the live site v1.14.x keys:
 *  - history paused: localStorage `aniraku:watching:history-paused` (record `aniraku:watching`.historyPaused)
 *  - sort order:     localStorage `aniraku:filters:order`           (record `aniraku:filters`.order)
 */

export const LOCAL_STORAGE_KEYS = {
  WATCHED_EPISODES: 'watched-episodes',
  LAST_ANIME_VISITED: 'last-anime-visited',
  EPISODE_PLAYBACK: 'all_episode_times',
} as const;

const PREF_RECORDS = {
  WATCHING: 'aniraku:watching',
  FILTERS: 'aniraku:filters',
} as const;

const PREF_LEGACY_KEYS = {
  HISTORY_PAUSED: 'aniraku:watching:history-paused',
  ORDER_MODE: 'aniraku:filters:order',
} as const;

export type SortValue = 'last-watched' | 'a-z' | 'episode' | 'air-date';

interface LastVisitedEntry {
  timestamp?: number;
  titleEnglish?: string;
  titleRomaji?: string;
}

interface PlaybackEntry {
  currentTime?: number;
  playbackPercentage?: number;
}

export interface WatchHistoryEntry {
  /** Live id format: `local:${animeId}:${episodeId || 'unknown-ep'}` */
  id: string;
  /** `${animeId}:${episodeNumber}` — one card per anime */
  mergeKey: string;
  animeId: string;
  episodeId: string;
  /** Most recently watched episode for this anime */
  episode: Episode;
  /** english || romaji || animeId */
  displayTitle: string;
  titleEnglish: string;
  titleRomaji: string;
  /** poster comes from the stored episode data (episode.image) */
  poster: string;
  /** ms epoch from `last-anime-visited` (0 when unknown) */
  lastWatched: number;
  /** ms epoch derived from episode.airDate (0 when unknown) */
  airTime: number;
  playback: {
    percentage: number;
    currentTime: number | null;
  };
  /** Route into the Watch page at the exact episode */
  watchPath: string;
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

/**
 * Read a preference the way live v1.14.x does: prefer the namespaced record
 * field (`aniraku:watching` / `aniraku:filters`), fall back to the legacy
 * standalone key.
 */
function readPref<T>(recordKey: string, field: string, legacyKey: string, fallback: T): T {
  const record = readJSON<Record<string, unknown> | null>(recordKey, null);
  if (record && typeof record === 'object' && !Array.isArray(record) && field in record) {
    return record[field] as T;
  }
  return readJSON<T>(legacyKey, fallback);
}

/** Write a preference to both the record field and the legacy standalone key. */
function writePref<T>(recordKey: string, field: string, legacyKey: string, value: T): void {
  try {
    localStorage.setItem(legacyKey, JSON.stringify(value));
    const record = readJSON<Record<string, unknown> | null>(recordKey, null);
    const next =
      record && typeof record === 'object' && !Array.isArray(record) ? { ...record } : {};
    next[field] = value;
    localStorage.setItem(recordKey, JSON.stringify(next));
  } catch {
    // storage unavailable — preference simply isn't persisted
  }
}

function parseAirTime(airDate: string | null | undefined): number {
  if (!airDate) return 0;
  const time = new Date(airDate).getTime();
  return Number.isNaN(time) ? 0 : time;
}

// Resume-intent URL via the shared live helper (utils/animePaths): live
// `At(media, ep)` → /watch/{id}/{slug}?ep={N}; without a stored title it
// degrades to bare /watch/{id}?ep={N} (same id-guard live uses).
function buildWatchPath(
  animeId: string,
  episodeNumber: number,
  visit?: LastVisitedEntry,
): string {
  return watchPathFor(
    {
      id: animeId,
      title: { english: visit?.titleEnglish, romaji: visit?.titleRomaji },
    },
    episodeNumber,
  );
}

function buildEntries(
  watched: Record<string, Episode[]>,
  lastVisited: Record<string, LastVisitedEntry>,
  playback: Record<string, PlaybackEntry>,
): WatchHistoryEntry[] {
  const entries: WatchHistoryEntry[] = [];

  for (const [animeId, episodes] of Object.entries(watched)) {
    if (!Array.isArray(episodes) || episodes.length === 0) continue;
    // Episodes are appended as they are watched, so the last one is the
    // most recently watched (same rule EpisodeCard uses for Continue Watching).
    const episode = episodes[episodes.length - 1] as Episode | undefined;
    if (!episode || typeof episode !== 'object' || typeof episode.id !== 'string') continue;

    const visit = lastVisited[animeId] ?? {};
    const titleEnglish = typeof visit.titleEnglish === 'string' ? visit.titleEnglish : '';
    const titleRomaji = typeof visit.titleRomaji === 'string' ? visit.titleRomaji : '';
    const displayTitle = titleEnglish || titleRomaji || animeId;
    const episodeNumber = typeof episode.number === 'number' ? episode.number : 0;

    const playbackEntry =
      playback[episode.id] ?? playback[`${animeId}-episode-${episodeNumber}`] ?? null;
    const rawPercentage = Number(playbackEntry?.playbackPercentage ?? 0);
    const percentage =
      Number.isFinite(rawPercentage) && rawPercentage > 0 ? rawPercentage : 0;
    const currentTime =
      playbackEntry && typeof playbackEntry.currentTime === 'number'
        ? playbackEntry.currentTime
        : null;

    entries.push({
      id: `local:${animeId}:${episode.id || 'unknown-ep'}`,
      mergeKey: `${animeId}:${episodeNumber}`,
      animeId,
      episodeId: episode.id,
      episode,
      displayTitle,
      titleEnglish,
      titleRomaji,
      poster: episode.image ?? '',
      lastWatched:
        typeof visit.timestamp === 'number' && Number.isFinite(visit.timestamp)
          ? visit.timestamp
          : 0,
      airTime: parseAirTime(episode.airDate),
      playback: { percentage, currentTime },
      watchPath: buildWatchPath(animeId, episodeNumber, visit),
    });
  }

  return entries;
}

export interface UseWatchHistoryResult {
  entries: WatchHistoryEntry[];
  /** Re-read localStorage (also called automatically on cross-tab `storage` events). */
  refresh: () => void;
  /** Removes the anime's whole history entry (same behavior as Continue Watching). */
  removeEntry: (animeId: string) => void;
  /** Persisted like live: `aniraku:watching:history-paused`. */
  historyPaused: boolean;
  setHistoryPaused: (paused: boolean) => void;
  /** Persisted like live: `aniraku:filters:order` (default `last-watched`). */
  order: SortValue;
  setOrder: (order: SortValue) => void;
}

export function useWatchHistory(): UseWatchHistoryResult {
  const [revision, setRevision] = useState(0);
  const [historyPaused, setPausedState] = useState<boolean>(() =>
    readPref<boolean>(PREF_RECORDS.WATCHING, 'historyPaused', PREF_LEGACY_KEYS.HISTORY_PAUSED, false),
  );
  const [order, setOrderState] = useState<SortValue>(() =>
    readPref<SortValue>(PREF_RECORDS.FILTERS, 'order', PREF_LEGACY_KEYS.ORDER_MODE, 'last-watched'),
  );

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  // Keep in sync when another tab writes to localStorage.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === LOCAL_STORAGE_KEYS.WATCHED_EPISODES ||
        event.key === LOCAL_STORAGE_KEYS.LAST_ANIME_VISITED ||
        event.key === LOCAL_STORAGE_KEYS.EPISODE_PLAYBACK ||
        event.key === PREF_LEGACY_KEYS.HISTORY_PAUSED ||
        event.key === PREF_RECORDS.WATCHING
      ) {
        setPausedState(
          readPref<boolean>(
            PREF_RECORDS.WATCHING,
            'historyPaused',
            PREF_LEGACY_KEYS.HISTORY_PAUSED,
            false,
          ),
        );
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  // DATA SYNC (Wave B): arm the session bridge + throttled `watch_history`
  // upsert engine, and run merge-on-login the moment a Supabase session
  // user exists (local `aniraku-watch-history`/native rows → server →
  // reconcile back so resume prefers max(server, local)). Session detection
  // goes through lib/sync (supabase.auth directly — no auth-hook import).
  //
  // MISSION 2 — History source-of-truth: for a signed-in user the server
  // `watch_history` rows are pulled on every session (re)establish / page
  // mount and reconciled into the native stores via watchHistory.ts
  // (`reconcileLocalHistory`): rows the server has land locally (server
  // wins for what it has), local-only rows remain (local fills gaps), and
  // resume/max-progress semantics are unchanged (reconcile never lowers
  // stored progress — max(server, local)). Guests skip the fetch and read
  // local as today. Rendering (watchPathFor/slug links) untouched.
  useEffect(() => subscribeToSession((userId) => {
    if (!userId) return; // guest → local as today
    ensureDataSync(userId); // merge-on-login (uploads local-only) + engine
    fetchServerHistoryRows(userId)
      .then((rows) => {
        if (rows.length) reconcileLocalHistory(rows);
        refresh(); // rebuild entries from the reconciled native stores
      })
      .catch(() => {
        // offline / unconfigured — local entries stay visible
      });
  }), [refresh]);

  // Same-tab sync events (merge-on-login reconcile, throttled flushes from
  // the Watch page's LS writes) — the `storage` listener above only covers
  // cross-tab writes.
  useEffect(() => subscribeToWatchHistory(() => {
    refresh();
  }), [refresh]);

  const entries = useMemo(() => {
    void revision; // recompute whenever refresh() bumps the revision
    const watched = readJSON<Record<string, Episode[]>>(
      LOCAL_STORAGE_KEYS.WATCHED_EPISODES,
      {},
    );
    const lastVisited = readJSON<Record<string, LastVisitedEntry>>(
      LOCAL_STORAGE_KEYS.LAST_ANIME_VISITED,
      {},
    );
    const playback = readJSON<Record<string, PlaybackEntry>>(
      LOCAL_STORAGE_KEYS.EPISODE_PLAYBACK,
      {},
    );
    return buildEntries(watched, lastVisited, playback);
  }, [revision]);

  const removeEntry = useCallback(
    (animeId: string) => {
      const watched = readJSON<Record<string, Episode[]>>(
        LOCAL_STORAGE_KEYS.WATCHED_EPISODES,
        {},
      );
      delete watched[animeId];
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.WATCHED_EPISODES,
          JSON.stringify(watched),
        );
      } catch {
        // ignore quota / availability errors
      }
      refresh();

      // Server mirror (Aniraku removeWatchHistoryEntries): drop the anime's
      // `watch_history` rows for the session user and forget its sync
      // snapshot so the throttled engine cannot re-upload them.
      forgetSyncedAnime(animeId);
      getSessionUserId()
        .then((userId) => {
          if (userId) return removeAnimeFromServer(userId, animeId);
          return undefined;
        })
        .catch(() => {
          // offline / unconfigured client — local removal already applied
        });
    },
    [refresh],
  );

  const setHistoryPaused = useCallback((paused: boolean) => {
    setPausedState(paused);
    writePref<boolean>(
      PREF_RECORDS.WATCHING,
      'historyPaused',
      PREF_LEGACY_KEYS.HISTORY_PAUSED,
      paused,
    );
  }, []);

  const setOrder = useCallback((nextOrder: SortValue) => {
    setOrderState(nextOrder);
    writePref<SortValue>(
      PREF_RECORDS.FILTERS,
      'order',
      PREF_LEGACY_KEYS.ORDER_MODE,
      nextOrder,
    );
  }, []);

  return {
    entries,
    refresh,
    removeEntry,
    historyPaused,
    setHistoryPaused,
    order,
    setOrder,
  };
}

export default useWatchHistory;
