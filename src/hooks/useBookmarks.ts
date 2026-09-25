import { useCallback, useSyncExternalStore } from 'react';
import {
  ANIRAKU_BOOKMARKS_KEY,
  BOOKMARKS_KEY,
  type BookmarkEntry,
  deleteBookmarkRow,
  ensureBookmarksMerged,
  ensureDataSync,
  readLocalBookmarks,
  subscribeToSession,
  upsertBookmarkRow,
  writeLocalBookmarks,
} from '../lib/sync';

// ---------------------------------------------------------------------------
// useBookmarks — local-first bookmark store with merge-on-login Supabase
// sync (table `bookmarks`, upsert onConflict `user_id,anime_id`).
//
// Local store: `aniraku:bookmarks` (JSON array of {id,title,image,...}).
// Merge-on-login folds in BOTH `aniraku:bookmarks` and the legacy Aniraku
// key `aniraku-bookmarks` (AnimeDetail.jsx:663-693 pattern): read cloud →
// upsert local-only rows → store the union. Guests stay LS-only; signed-in
// toggles are optimistic-LS + server upsert/delete passthrough.
// Sign-out cleanup of these keys is Wave A's contract — not done here.
//
// Module-level singleton so N card instances share one query/subscription.
// Session detection goes through `lib/sync` (supabase.auth directly) — no
// auth-hook import (Wave A owns those files).
// ---------------------------------------------------------------------------

const listeners = new Set<() => void>();

let started = false;
let storeBookmarks: BookmarkEntry[] = [];
let storeUserId: string | null = null;

function publish(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // one broken subscriber must not break the rest
    }
  });
}

function refreshLocal(): void {
  storeBookmarks = readLocalBookmarks();
  publish();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function startStore(): void {
  if (started) return;
  started = true;
  storeBookmarks = readLocalBookmarks();

  subscribeToSession((userId) => {
    storeUserId = userId;
    if (userId) {
      ensureDataSync(userId);
      ensureBookmarksMerged(userId)
        .then((union) => {
          storeBookmarks = union;
          publish();
        })
        .catch(() => {
          publish();
        });
    } else {
      refreshLocal();
    }
  });

  // Cross-tab mirror (another tab toggling a bookmark).
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (
        event.key === null ||
        event.key === BOOKMARKS_KEY ||
        event.key === ANIRAKU_BOOKMARKS_KEY
      ) {
        refreshLocal();
      }
    });
  }
}

export interface ToggleableBookmark {
  id: number | string;
  title?: string;
  image?: string;
}

export interface UseBookmarksResult {
  /** Current union (cloud ∪ local after merge-on-login). */
  bookmarks: BookmarkEntry[];
  /** Session user id driving the server sync (null = guest/local-only). */
  userId: string | null;
  isBookmarked: (id: number | string) => boolean;
  /**
   * Guest: LS-only toggle. Signed-in: LS optimistic write, then server
   * upsert (add) / delete (remove) — Aniraku Card.jsx:37-45 semantics.
   */
  toggleBookmark: (entry: ToggleableBookmark) => Promise<void>;
}

export function useBookmarks(): UseBookmarksResult {
  startStore();
  const bookmarks = useSyncExternalStore(subscribe, () => storeBookmarks);
  const userId = useSyncExternalStore(subscribe, () => storeUserId);

  const isBookmarked = useCallback(
    (id: number | string): boolean => {
      const numericId = Number(id);
      return storeBookmarks.some((entry) => entry.id === numericId);
    },
    // recompute identity per snapshot via `bookmarks` reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    async (entry: ToggleableBookmark): Promise<void> => {
      startStore();
      const numericId = Number(entry.id);
      if (!Number.isFinite(numericId) || numericId <= 0) return;

      const exists = storeBookmarks.some((row) => row.id === numericId);
      const next = exists
        ? storeBookmarks.filter((row) => row.id !== numericId)
        : [
            ...storeBookmarks,
            {
              id: numericId,
              title: entry.title ?? '',
              image: entry.image ?? '',
              added_at: Date.now(),
            },
          ];

      // optimistic local write first
      storeBookmarks = next;
      writeLocalBookmarks(next);
      publish();

      const userIdAtClick = storeUserId;
      if (!userIdAtClick) return; // guest — LS is the whole truth
      try {
        if (exists) {
          await deleteBookmarkRow(userIdAtClick, numericId);
        } else {
          await upsertBookmarkRow(userIdAtClick, {
            id: numericId,
            title: entry.title ?? '',
            image: entry.image ?? '',
            added_at: Date.now(),
          });
        }
      } catch {
        // local mirror stays usable when the cloud request fails
      }
    },
    [],
  );

  return { bookmarks, userId, isBookmarked, toggleBookmark };
}

export default useBookmarks;
