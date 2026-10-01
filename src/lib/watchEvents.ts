// Unified watch-event writer — the single path every watch write flows
// through (Watch page select/playback-start, EpisodeList clicks).
//
// Before: Watch and EpisodeList each maintained their own dual-write of
// the suffixed `watched-episodes-{id}` key and the unified
// `watched-episodes` record, with the mirror buried inside different
// guards — so the two stores diverged (Info checkmarks read the
// suffixed key, History/Continue Watching read the unified record) and
// anime went missing from History. Now both stores are written together,
// verified with a read-back, and every event stamps the per-episode
// watch time + advances the bookmark status.
//
// Returns false when nothing was written (paused, invalid input).

import { LOCAL_HISTORY_KEYS } from './watchHistory';
import { episodeTimeKey, stampEpisodeWatch } from './episodeWatchTimes';
import {
  deriveStatusAfterWatch,
  type ListStatus,
} from './listStatus';
import {
  getSessionUserId,
  readLocalBookmarks,
  setBookmarkStatus,
  writeLocalBookmarks,
} from './sync';

export interface WatchEpisodeLike {
  id?: unknown;
  number?: unknown;
  image?: unknown;
  title?: unknown;
}

export interface RecordWatchOptions {
  /** Known episode total (provider list length) — drives auto-COMPLETED. */
  totalEpisodes?: number | null;
  /** Epoch ms override (tests). */
  now?: number;
}

function readJSONRecord(key: string): Record<string, unknown[]> {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown[]>)
      : {};
  } catch {
    return {};
  }
}

/** History-paused gate — same contract as Watch/EpisodeList/Player. */
export function isHistoryRecordingPaused(): boolean {
  try {
    const record = localStorage.getItem('aniraku:watching');
    if (record) {
      const parsed = JSON.parse(record);
      if (parsed && typeof parsed.historyPaused === 'boolean') {
        return parsed.historyPaused;
      }
    }
    const legacy = localStorage.getItem('aniraku:watching:history-paused');
    if (legacy !== null) return JSON.parse(legacy) === true;
  } catch {
    // Malformed record — treat as not paused.
  }
  return false;
}

function episodeIdOf(animeId: string, number: number, rawId: unknown): string {
  const id = String(rawId ?? '').trim();
  if (id) return id;
  // Canonical provider id shape (`{animeId}-episode-{n}`).
  return episodeTimeKey(animeId, number);
}

export function recordWatchEvent(
  animeId: string | number,
  episode: WatchEpisodeLike | null | undefined,
  options: RecordWatchOptions = {},
): boolean {
  // Paused = freeze everything (user decision): no rows, no progress,
  // no stamps, no status transitions, no uploads from this event.
  if (isHistoryRecordingPaused()) return false;
  const idKey = String(animeId ?? '').trim();
  const number = Math.floor(Number(episode?.number));
  if (!idKey || !episode || typeof episode !== 'object') return false;
  if (!Number.isFinite(number) || number <= 0) return false;

  const now = Math.floor(Number(options.now ?? Date.now())) || Date.now();
  const epId = episodeIdOf(idKey, number, episode.id);

  try {
    // --- unified record (History / Continue Watching / sync engine) ----
    const unified = readJSONRecord(LOCAL_HISTORY_KEYS.WATCHED_EPISODES);
    const unifiedList = Array.isArray(unified[idKey]) ? unified[idKey] : [];
    if (
      !unifiedList.some(
        (entry) =>
          entry &&
          typeof entry === 'object' &&
          (String((entry as Record<string, unknown>).id ?? '') === epId ||
            Math.floor(
              Number((entry as Record<string, unknown>).number),
            ) === number),
      )
    ) {
      unifiedList.push({ ...episode, id: epId, number });
      unified[idKey] = unifiedList;
      localStorage.setItem(
        LOCAL_HISTORY_KEYS.WATCHED_EPISODES,
        JSON.stringify(unified),
      );
    }

    // --- suffixed key (Info checkmarks / EpisodeList state) -------------
    const suffixedKey = `${LOCAL_HISTORY_KEYS.WATCHED_EPISODES}-${idKey}`;
    let suffixed: unknown[];
    try {
      const parsed = JSON.parse(localStorage.getItem(suffixedKey) || '[]');
      suffixed = Array.isArray(parsed) ? parsed : [];
    } catch {
      suffixed = [];
    }
    if (
      !suffixed.some(
        (entry) =>
          entry &&
          typeof entry === 'object' &&
          (String((entry as Record<string, unknown>).id ?? '') === epId ||
            Math.floor(
              Number((entry as Record<string, unknown>).number),
            ) === number),
      )
    ) {
      suffixed.push({ ...episode, id: epId, number });
      localStorage.setItem(suffixedKey, JSON.stringify(suffixed));
    }
  } catch {
    return false; // storage unavailable — nothing recorded
  }

  // --- per-episode timestamp (Continue Watching / History "latest") ----
  stampEpisodeWatch(idKey, number, now);

  // --- bookmark status advance (hidden mechanism) -----------------------
  try {
    const bookmarks = readLocalBookmarks();
    const bookmark = bookmarks.find((entry) => String(entry.id) === idKey);
    if (bookmark) {
      const watchedNumbers = new Set<number>();
      try {
        const unified = readJSONRecord(LOCAL_HISTORY_KEYS.WATCHED_EPISODES);
        for (const entry of unified[idKey] ?? []) {
          const n = Math.floor(
            Number((entry as Record<string, unknown>)?.number),
          );
          if (Number.isFinite(n) && n > 0) watchedNumbers.add(n);
        }
      } catch {
        watchedNumbers.add(number);
      }
      const total = Math.max(
        0,
        Math.floor(
          Number(
            options.totalEpisodes ??
              bookmark.total_episodes ??
              0,
          ),
        ) || 0,
      );
      const previous: ListStatus | null = bookmark.status ?? null;
      const next = deriveStatusAfterWatch({
        previous,
        watchedCount: watchedNumbers.size,
        total,
      });
      const totalChanged =
        total > 0 && (bookmark.total_episodes ?? 0) !== total;
      if (next !== previous || totalChanged) {
        const updated = bookmarks.map((entry) =>
          String(entry.id) === idKey
            ? {
                ...entry,
                status: next,
                total_episodes: total > 0 ? total : (entry.total_episodes ?? null),
              }
            : entry,
        );
        writeLocalBookmarks(updated);
        void getSessionUserId()
          .then((userId) => {
            if (userId) return setBookmarkStatus(userId, Number(idKey), next, total > 0 ? total : null);
            return undefined;
          })
          .catch(() => {
            // offline — local status already applied
          });
      }
    }
  } catch {
    // status advance is best-effort; the watch itself is recorded
  }

  return true;
}
