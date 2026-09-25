import { supabase } from './supabase';
import { fetchAnimeEpisodes } from '../hooks/useApi';
import { API_BASE } from './apiBase';
import {
  type HistoryRow,
  historyRowKey,
  historyRowEquals,
  readLocalHistoryRows,
  mergeHistoryRow,
  reconcileLocalHistory,
  publishWatchHistory,
} from './watchHistory';

// ---------------------------------------------------------------------------
// Data-sync layer — TS port of the Supabase-touching halves of Aniraku's
// `src/lib/sync.js` / `useNsfw`-style shared state, re-based onto Miruro:
//
//  - Session bridge via `supabase.auth` ONLY (no auth hook import — Wave A
//    owns those files; this module keeps its own user state).
//  - bookmarks          → table `bookmarks`,    LS `miruro:bookmarks`
//                         (+ legacy `aniraku-bookmarks` merged on login)
//  - watch_history      → throttled 10s diff-upsert engine + merge-on-login
//  - notifications      → backend API `${API_BASE}/api/v1/notifications`
//                         (Aniraku NavBar.jsx:32-69 mechanism: Bearer fetch,
//                         30s session poll, PUT `/notifications/{id}/read`;
//                         server `read` column = authority — the LS key
//                         `miruro:notifications-read` is retired as
//                         authority and no longer read/written here), plus
//                         the new-episode insert loop with LS tracker
//                         `miruro:episode-track`
//  - provider sync      → MAL/AniList grant endpoints (`/api/v1/sync*`,
//                         `/api/v1/import|export/{provider}`) — UNFILTERED
//                         payloads (no NSFW/rating filter anywhere, per
//                         user decision; the nsfw_enabled toggle only gates
//                         browse/display)
//
// Every network call is best-effort: the client may be a placeholder when
// VITE_SUPABASE_* is unset, so all paths swallow errors and local-first UX
// keeps working.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Session bridge (supabase.auth.getSession / onAuthStateChange)
// ---------------------------------------------------------------------------

type SessionListener = (userId: string | null) => void;

let bridgeStarted = false;
let currentUserId: string | null = null;
const sessionListeners = new Set<SessionListener>();

function setUserId(next: string | null): void {
  if (currentUserId === next) return;
  currentUserId = next;
  if (!next) {
    // fresh login later must re-run the merges
    mergedBookmarksUsers.clear();
    mergedHistoryUsers.clear();
  }
  sessionListeners.forEach((listener) => {
    try {
      listener(next);
    } catch {
      // a broken listener must not break the bridge
    }
  });
}

function startBridge(): void {
  if (bridgeStarted) return;
  bridgeStarted = true;
  supabase.auth
    .getSession()
    .then(({ data }) => setUserId(data.session?.user?.id ?? null))
    .catch(() => {});
  try {
    supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
  } catch {
    // client unavailable — bridge stays idle
  }
}

/** Current Supabase user id (also refreshed opportunistically). */
export async function getSessionUserId(): Promise<string | null> {
  startBridge();
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? currentUserId;
  } catch {
    return currentUserId;
  }
}

/**
 * Subscribe to session changes; the listener fires immediately with the
 * last-known id. Safe to call from any component (auth-hook free).
 */
export function subscribeToSession(listener: SessionListener): () => void {
  startBridge();
  sessionListeners.add(listener);
  try {
    listener(currentUserId);
  } catch {
    // ignore listener errors
  }
  return () => {
    sessionListeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// Bookmarks — LS store + server passthrough (Aniraku Card.jsx:37-45,
// AnimeDetail.jsx:663-693)
// ---------------------------------------------------------------------------

export const BOOKMARKS_KEY = 'miruro:bookmarks';
export const ANIRAKU_BOOKMARKS_KEY = 'aniraku-bookmarks';

export interface BookmarkEntry {
  id: number;
  title: string;
  image: string;
  added_at?: number;
}

function readArray<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeBookmarksLocal(list: BookmarkEntry[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable
  }
}

const toBookmark = (raw: unknown): BookmarkEntry | null => {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const id = Number(item.id ?? item.anime_id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    title: String(item.title ?? ''),
    image: String(item.image ?? ''),
    added_at:
      typeof item.added_at === 'number' ? item.added_at : undefined,
  };
};

/** Union of `miruro:bookmarks` and legacy `aniraku-bookmarks` (Miruro wins). */
export function readLocalBookmarks(): BookmarkEntry[] {
  const byId = new Map<number, BookmarkEntry>();
  for (const raw of readArray<unknown>(ANIRAKU_BOOKMARKS_KEY)) {
    const entry = toBookmark(raw);
    if (entry) byId.set(entry.id, entry);
  }
  for (const raw of readArray<unknown>(BOOKMARKS_KEY)) {
    const entry = toBookmark(raw);
    if (entry) byId.set(entry.id, entry);
  }
  return [...byId.values()];
}

export function writeLocalBookmarks(list: BookmarkEntry[]): void {
  writeBookmarksLocal(list);
}

/** Server rows for `bookmarks` (RLS-scoped by user_id). */
export async function fetchServerBookmarks(
  userId: string,
): Promise<BookmarkEntry[]> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('anime_id,title,image,added_at')
      .eq('user_id', userId)
      .limit(2000);
    if (error || !data) return [];
    return data
      .map((row) => toBookmark({ ...row, id: row.anime_id }))
      .filter((row): row is BookmarkEntry => row !== null);
  } catch {
    return [];
  }
}

const mergedBookmarksUsers = new Set<string>();

/**
 * Merge-on-login (AnimeDetail.jsx:663-693 pattern): read cloud, upsert the
 * local-only rows (from `miruro:bookmarks` AND `aniraku-bookmarks`), then
 * store the union locally. Runs once per user per session.
 */
export async function mergeBookmarksOnLogin(
  userId: string,
): Promise<BookmarkEntry[]> {
  const cloud = await fetchServerBookmarks(userId);
  const local = readLocalBookmarks();
  const cloudIds = new Set(cloud.map((entry) => entry.id));
  const localOnly = local.filter((entry) => !cloudIds.has(entry.id));

  if (localOnly.length) {
    try {
      await supabase.from('bookmarks').upsert(
        localOnly.map((entry) => ({
          user_id: userId,
          anime_id: entry.id,
          title: entry.title || '',
          image: entry.image || '',
          added_at: entry.added_at ?? Date.now(),
        })),
        { onConflict: 'user_id,anime_id' },
      );
    } catch {
      // cloud unreachable — union still lands locally below
    }
  }

  const union = [...cloud, ...localOnly];
  writeLocalBookmarks(union);
  mergedBookmarksUsers.add(userId);
  return union;
}

/** Idempotent wrapper (first call per session does the merge). */
export async function ensureBookmarksMerged(
  userId: string,
): Promise<BookmarkEntry[]> {
  if (mergedBookmarksUsers.has(userId)) return readLocalBookmarks();
  return mergeBookmarksOnLogin(userId);
}

/** Authed add — LS optimistic write happens in the hook; this is the passthrough. */
export async function upsertBookmarkRow(
  userId: string,
  entry: BookmarkEntry,
): Promise<void> {
  try {
    await supabase.from('bookmarks').upsert(
      {
        user_id: userId,
        anime_id: entry.id,
        title: entry.title || '',
        image: entry.image || '',
        added_at: entry.added_at ?? Date.now(),
      },
      { onConflict: 'user_id,anime_id' },
    );
  } catch {
    // keep the local mirror usable when the cloud request is unavailable
  }
}

export async function deleteBookmarkRow(
  userId: string,
  animeId: number,
): Promise<void> {
  try {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('anime_id', animeId);
  } catch {
    // ditto
  }
}

// ---------------------------------------------------------------------------
// Watch history — server transport + merge-on-login + throttled upserts
// ---------------------------------------------------------------------------

const HISTORY_SYNC_INTERVAL_MS = 10000; // Aniraku's save cadence (10 ticks/s)
const UPsert_CHUNK = 100;

const mergedHistoryUsers = new Set<string>();
let historySyncTimer: ReturnType<typeof setInterval> | null = null;
let historySyncUser: string | null = null;
const syncedFingerprint = new Map<string, string>();

const rowFingerprint = (row: HistoryRow): string =>
  `${row.progress}|${row.duration}|${row.timestamp}|${row.anime_title}|${row.anime_image}`;

/** Full server history for the user (single page — table is per-account). */
export async function fetchServerHistoryRows(
  userId: string,
): Promise<HistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .select(
        'anime_id,anime_title,anime_image,episode_number,progress,duration,timestamp',
      )
      .eq('user_id', userId)
      .limit(1000);
    if (error || !Array.isArray(data)) return [];
    return data
      .map((row) => ({
        anime_id: Number(row.anime_id),
        anime_title: String(row.anime_title ?? ''),
        anime_image: String(row.anime_image ?? ''),
        episode_number: Number(row.episode_number),
        progress: Number(row.progress ?? 0) || 0,
        duration: Number(row.duration ?? 0) || 0,
        timestamp: Number(row.timestamp ?? 0) || 0,
      }))
      .filter(
        (row) =>
          Number.isFinite(row.anime_id) &&
          row.anime_id > 0 &&
          Number.isFinite(row.episode_number) &&
          row.episode_number > 0,
      );
  } catch {
    return [];
  }
}

/** Chunked upsert, `onConflict: user_id,anime_id,episode_number`. */
export async function upsertHistoryRows(
  userId: string,
  rows: HistoryRow[],
): Promise<void> {
  for (let i = 0; i < rows.length; i += UPsert_CHUNK) {
    const chunk = rows.slice(i, i + UPsert_CHUNK);
    try {
      await supabase.from('watch_history').upsert(
        chunk.map((row) => ({
          user_id: userId,
          anime_id: row.anime_id,
          anime_title: row.anime_title,
          anime_image: row.anime_image,
          episode_number: row.episode_number,
          progress: row.progress,
          duration: row.duration,
          timestamp: row.timestamp,
        })),
        { onConflict: 'user_id,anime_id,episode_number' },
      );
    } catch {
      // offline / unconfigured — retried by the next engine tick
    }
  }
}

/**
 * MERGE-ON-LOGIN (history):
 *  1. local = readLocalHistoryRows()  (`miruro:watching`-native + `aniraku-watch-history`)
 *  2. server = fetchServerHistoryRows(userId)
 *  3. union by `anime_id:episode_number` → max(progress), tie → newest timestamp
 *  4. upload every row the server lacks or loses (local winner only)
 *  5. reconcile local from the union (resume prefers max(server, local))
 * Runs once per user per session.
 */
export async function mergeHistoryOnLogin(userId: string): Promise<void> {
  const localRows = readLocalHistoryRows();
  const serverRows = await fetchServerHistoryRows(userId);

  const serverByKey = new Map(serverRows.map((row) => [historyRowKey(row), row]));
  const merged = new Map<string, HistoryRow>();
  const union = (row: HistoryRow) => {
    const key = historyRowKey(row);
    const existing = merged.get(key);
    merged.set(key, existing ? mergeHistoryRow(existing, row) : row);
  };
  for (const row of localRows) union(row);
  for (const row of serverRows) union(row);

  const toUpload = [...merged.values()].filter((row) => {
    const server = serverByKey.get(historyRowKey(row));
    return !server || !historyRowEquals(server, row);
  });
  if (toUpload.length) await upsertHistoryRows(userId, toUpload);

  reconcileLocalHistory([...merged.values()]);
  for (const row of merged.values()) {
    syncedFingerprint.set(historyRowKey(row), rowFingerprint(row));
  }
  mergedHistoryUsers.add(userId);
  publishWatchHistory({ type: 'sync', keys: [...merged.keys()] });
}

/** Diff-flush the local rows against the last synced snapshot (throttled). */
async function flushHistorySync(userId: string): Promise<void> {
  const rows = readLocalHistoryRows();
  const changed = rows.filter((row) => {
    const key = historyRowKey(row);
    return syncedFingerprint.get(key) !== rowFingerprint(row);
  });
  if (!changed.length) return;
  await upsertHistoryRows(userId, changed);
  for (const row of changed) {
    syncedFingerprint.set(historyRowKey(row), rowFingerprint(row));
  }
  publishWatchHistory({ type: 'upsert', keys: changed.map(historyRowKey) });
}

/**
 * DELTA 2(c) — same-tab progress publish: push the rows the server is
 * missing/stale RIGHT NOW instead of waiting for the 10s engine tick.
 * Thin wrapper over the private `flushHistorySync` (diff-upsert against the
 * synced fingerprint — semantics unchanged, idempotent, unfiltered). No-op
 * for guests (uid resolves null); safe to call at any time from Watch/Player
 * save paths.
 */
export async function publishHistoryNow(
  userId?: string | null,
): Promise<void> {
  const uid = userId ?? (await getSessionUserId());
  if (!uid) return;
  await flushHistorySync(uid);
}

/** Drop an anime's synced snapshot after a local/server removal, so the
 *  throttled engine cannot re-upload rows the user just deleted. */
export function forgetSyncedAnime(animeId: string | number): void {
  const prefix = `${String(animeId)}:`;
  for (const key of [...syncedFingerprint.keys()]) {
    if (key.startsWith(prefix)) syncedFingerprint.delete(key);
  }
}

function stopHistorySync(): void {
  if (historySyncTimer !== null) {
    clearInterval(historySyncTimer);
    historySyncTimer = null;
  }
  historySyncUser = null;
  syncedFingerprint.clear();
}

/**
 * Start (or keep) the throttled `watch_history` upsert engine for a user.
 * Idempotent — safe to call from every hook instance.
 */
export function ensureDataSync(userId: string | null): void {
  if (!userId) {
    stopHistorySync();
    return;
  }
  void ensureBookmarksMerged(userId);
  if (!mergedHistoryUsers.has(userId)) void mergeHistoryOnLogin(userId);
  if (historySyncUser === userId && historySyncTimer !== null) return;
  stopHistorySync();
  historySyncUser = userId;
  historySyncTimer = setInterval(() => {
    if (!historySyncUser) return;
    void flushHistorySync(historySyncUser);
  }, HISTORY_SYNC_INTERVAL_MS);
}

// Module-level bridge: importing this file arms the session bridge + engine
// for guests → the timer only starts once a session user exists.
startBridge();

// ---------------------------------------------------------------------------
// Backend Bearer helper — every `/api/v1/*` call authenticates with the
// Supabase JWT (Aniraku sync.js `authHeaders`, :8-15, verbatim semantics).
// ---------------------------------------------------------------------------

async function authHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      ...extra,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  } catch {
    return { ...extra };
  }
}

// ---------------------------------------------------------------------------
// Notifications — Aniraku's EXACT mechanism (NavBar.jsx:32-69 / :57-70):
//   GET  ${API_BASE}/api/v1/notifications          (Bearer, poll every 30s)
//   PUT  ${API_BASE}/api/v1/notifications/{id}/read (Bearer, on click)
// Payload = array; server `read` column is the authority. Module-level store
// + session-driven shared poller; `useNotifications()` (Notifications.tsx)
// subscribes here. The LS key `miruro:notifications-read` is retired as
// authority (no reads/writes below) — `readNotificationReadIds()` now derives
// from the server rows so Wave A's Navbar badge shim stays correct.
// ---------------------------------------------------------------------------

export const NOTIFICATIONS_READ_KEY = 'miruro:notifications-read'; // legacy key — AuthProvider still clears it on sign-out; no longer read/written
export const EPISODE_TRACK_KEY = 'miruro:episode-track';

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  animeId: number | null;
  createdAt: string | null;
  /** Server `read` column (authority). */
  read: boolean;
}

let notificationItems: NotificationItem[] = [];
const notificationListeners = new Set<(items: NotificationItem[]) => void>();

function setNotificationItems(next: NotificationItem[]): void {
  notificationItems = next;
  notificationListeners.forEach((listener) => {
    try {
      listener(next);
    } catch {
      // a broken listener must not break the store
    }
  });
}

/** Snapshot of the current server-backed rows. */
export function getNotifications(): NotificationItem[] {
  return notificationItems;
}

/** Subscribe to the store; fires immediately with the current rows. */
export function subscribeNotifications(
  listener: (items: NotificationItem[]) => void,
): () => void {
  notificationListeners.add(listener);
  try {
    listener(notificationItems);
  } catch {
    // ignore listener errors
  }
  return () => {
    notificationListeners.delete(listener);
  };
}

/** Map one API row (`id, read, message, created_at, anime_id, type?`). */
const mapApiNotification = (row: unknown): NotificationItem | null => {
  if (!row || typeof row !== 'object') return null;
  const raw = row as Record<string, unknown>;
  if (raw.id === undefined || raw.id === null) return null;
  return {
    id: String(raw.id),
    type: String(raw.type ?? 'new_episode'),
    message: String(raw.message ?? ''),
    animeId:
      raw.anime_id === null || raw.anime_id === undefined
        ? null
        : Number(raw.anime_id),
    createdAt:
      raw.created_at === undefined || raw.created_at === null
        ? null
        : String(raw.created_at),
    read: raw.read === true || raw.read === 'true' || raw.read === 1,
  };
};

const EPISODE_CHECK_COOLDOWN_MS = 21600000; // 6h (Aniraku Home.jsx:599)

/**
 * FETCH (Aniraku NavBar fetchNotifs, :34-51): GET the notifications array
 * with the session Bearer; only an `res.ok` payload replaces the store
 * (failures keep the last-known rows — Aniraku only setState inside
 * `if (res.ok)`). Returns the rows the store now holds.
 *
 * Export-compat shims (Wave A's Navbar badge depends on these names):
 * the legacy `(userId, limit)` parameters are accepted but ignored — the
 * endpoint is session-scoped (Bearer), so callers stay source-compatible.
 */
export async function fetchNotifications(
  _userId?: string,
  _limit?: number,
): Promise<NotificationItem[]> {
  try {
    const headers = await authHeaders();
    if (!headers.Authorization) return notificationItems; // guest — bridge clears the store
    const res = await fetch(`${API_BASE}/api/v1/notifications`, { headers });
    if (!res.ok) return notificationItems;
    const payload: unknown = await res.json();
    const backendRows = (Array.isArray(payload) ? payload : [])
      .map(mapApiNotification)
      .filter((row): row is NotificationItem => row !== null);
    // Own Supabase rows first (episode alerts, export receipts — user-
    // actionable), then backend rows; id spaces are disjoint, deduped anyway.
    const rows = [...(await fetchOwnSupabaseNotifications()), ...backendRows];
    const seen = new Set<string>();
    const merged = rows.filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
    setNotificationItems(merged);
    return merged;
  } catch {
    // offline / unconfigured — keep last-known rows
    return notificationItems;
  }
}

/**
 * Own Supabase `notifications` rows. Same shape the backend serves
 * (`id, type, message, anime_id, read, created_at`), so mapApiNotification
 * parses them unchanged. RLS scopes to the signed-in user automatically.
 */
async function fetchOwnSupabaseNotifications(): Promise<NotificationItem[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('id,type,message,anime_id,read,created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !Array.isArray(data)) return [];
    return data
      .map(mapApiNotification)
      .filter((row): row is NotificationItem => row !== null);
  } catch {
    return [];
  }
}

/** Manual refresh for `useNotifications().refresh` / the drawer reload. */
export async function refreshNotifications(): Promise<void> {
  await fetchNotifications();
}

/**
 * Read ids derived from the server `read` column (shim over the new layer —
 * the LS read-set is no longer consulted; authority = backend).
 */
export function readNotificationReadIds(): Set<string> {
  return new Set(
    notificationItems.filter((item) => item.read).map((item) => item.id),
  );
}

/** PUT /notifications/{id}/read with the session Bearer (Aniraku markRead). */
async function putNotificationRead(id: string): Promise<void> {
  try {
    const headers = await authHeaders();
    if (!headers.Authorization) return;
    await fetch(`${API_BASE}/api/v1/notifications/${id}/read`, {
      method: 'PUT',
      headers,
    });
  } catch {
    // offline — the next 30s poll reconciles the row with the server
  }
  // Supabase-owned rows (episode alerts, export receipts) live outside the
  // backend — flip them directly; backend-owned ids match nothing here.
  try {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  } catch {
    // RLS/offline — row stays unread until the next successful pass
  }
}

/**
 * MARK READ (Aniraku NavBar markRead, :57-70): optimistic store flip, then
 * the PUT — only for a row that is currently unread (the drawer triggers it
 * on clicking an unread row, Aniraku :159). Export-compat: keeps the legacy
 * sync signature returning the updated read-id set.
 */
export function markNotificationRead(id: string): Set<string> {
  const target = notificationItems.find((item) => item.id === id);
  if (target && !target.read) {
    setNotificationItems(
      notificationItems.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
    void putNotificationRead(id);
  }
  return readNotificationReadIds();
}

/** Mark several rows read (drawer "Mark all read" — one PUT per unread id). */
export function markAllNotificationsRead(ids: string[]): Set<string> {
  const wanted = new Set(ids);
  const unread = notificationItems.filter(
    (item) => wanted.has(item.id) && !item.read,
  );
  if (unread.length) {
    setNotificationItems(
      notificationItems.map((item) =>
        wanted.has(item.id) ? { ...item, read: true } : item,
      ),
    );
    for (const item of unread) void putNotificationRead(item.id);
  }
  return readNotificationReadIds();
}

const NOTIFICATION_POLL_MS = 30000; // Aniraku NavBar.jsx:53
let notificationPollTimer: ReturnType<typeof setInterval> | null = null;

function stopNotificationPoll(): void {
  if (notificationPollTimer !== null) {
    clearInterval(notificationPollTimer);
    notificationPollTimer = null;
  }
}

// Session-driven poll (Aniraku NavBar effect, :32-55 — immediate fetch +
// interval while the user exists, cleared on cleanup / user change):
// the bridge fires on module load (via getSession), on sign-in/out and on
// user switch, so the interval always tracks the live session.
subscribeToSession((userId) => {
  stopNotificationPoll();
  if (!userId) {
    setNotificationItems([]); // sign-out / guest — drawer & badge reset
    return;
  }
  void fetchNotifications();
  notificationPollTimer = setInterval(() => {
    void fetchNotifications();
  }, NOTIFICATION_POLL_MS);
});

/** Direct AniList request (port of Aniraku `anilistBatchDetail`, ≤50 ids). */
async function anilistBatchDetail(
  ids: number[],
): Promise<
  Record<
    string,
    {
      status: string;
      episodes: number | null;
      nextAiringEpisode?: { episode?: number } | null;
    }
  >
> {
  const safeIds = ids
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 50);
  if (!safeIds.length) return {};
  const variables: Record<string, number> = {};
  const fields = safeIds.map((id, index) => {
    variables[`id${index}`] = id;
    return `m${index}: Media(id: $id${index}, type: ANIME) {
      id status episodes nextAiringEpisode { episode airingAt }
    }`;
  });
  const query = `query (${safeIds
    .map((_, index) => `$id${index}: Int!`)
    .join(', ')}) { ${fields.join('\n')} }`;
  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const json = await response.json();
    const result: Record<
      string,
      {
        status: string;
        episodes: number | null;
        nextAiringEpisode?: { episode?: number } | null;
      }
    > = {};
    safeIds.forEach((id, index) => {
      result[id] = (json?.data?.[`m${index}`] ?? null) as never;
    });
    for (const key of Object.keys(result)) {
      if (!result[key]) delete result[key];
    }
    return result;
  } catch {
    return {};
  }
}

let episodeCheckInFlight = false;

/**
 * NEW-EPISODE NOTIFICATION LOOP — port of Aniraku Home.jsx:589-614
 * (logged-in only; mounted from Miruro `pages/Home.tsx`):
 *  bookmarks (LS union, server rows override) → 6h-cooled tracker
 *  `miruro:episode-track` → AniList batch (RELEASING only, last aired ep)
 *  → episode-availability check → dedupe lookup on
 *  (user_id, type='new_episode', anime_id, message) → insert
 *  `{user_id, type, message, anime_id}` (unique-violation 23505 ignored).
 */
export async function runNewEpisodeNotifications(
  userId: string,
): Promise<{ checked: number; inserted: number }> {
  if (episodeCheckInFlight) return { checked: 0, inserted: 0 };
  episodeCheckInFlight = true;
  const summary = { checked: 0, inserted: 0 };
  try {
    let bookmarks = readLocalBookmarks().map((entry) => ({
      id: entry.id,
      title: entry.title,
    }));
    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('anime_id,title')
        .eq('user_id', userId);
      if (data?.length) {
        bookmarks = data.map((bookmark) => ({
          id: Number(bookmark.anime_id),
          title: String(bookmark.title ?? ''),
        }));
      }
    } catch {
      // server bookmarks are optional for this notification
    }
    if (!bookmarks.length) return summary;

    let lastKnown: Record<string, { e?: number; t?: number }> = {};
    try {
      lastKnown =
        JSON.parse(localStorage.getItem(EPISODE_TRACK_KEY) || '{}') || {};
    } catch {
      // stale storage is non-fatal
    }

    const now = Date.now();
    const toCheck = bookmarks.filter(
      (bookmark) =>
        !lastKnown[bookmark.id] ||
        now - (lastKnown[bookmark.id].t ?? 0) >= EPISODE_CHECK_COOLDOWN_MS,
    );
    summary.checked = toCheck.length;
    if (!toCheck.length) return summary;

    const batch = await anilistBatchDetail(toCheck.map((b) => b.id));
    for (const bookmark of toCheck) {
      const media = batch[bookmark.id];
      if (!media || media.status !== 'RELEASING') continue;
      const episode = media.nextAiringEpisode?.episode
        ? media.nextAiringEpisode.episode - 1
        : media.episodes || 0;
      if (episode <= (lastKnown[bookmark.id]?.e || 0)) continue;

      let episodes: { number?: unknown }[] = [];
      try {
        episodes = (await fetchAnimeEpisodes(String(bookmark.id))) as {
          number?: unknown;
        }[];
      } catch {
        continue;
      }
      const hasEpisode = Array.isArray(episodes)
        ? episodes.some(
            (item, index) => Number(item?.number ?? index + 1) === episode,
          )
        : false;
      if (!hasEpisode) continue;

      const message = `Episode ${episode} of ${bookmark.title} is now available`;
      let existing: { id?: unknown } | null = null;
      let lookupError: unknown = null;
      try {
        const result = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'new_episode')
          .eq('anime_id', bookmark.id)
          .eq('message', message)
          .limit(1)
          .maybeSingle();
        existing = (result.data as { id?: unknown } | null) ?? null;
        lookupError = result.error ?? null;
      } catch (error) {
        lookupError = error;
      }
      if (lookupError || existing) continue;

      lastKnown[bookmark.id] = { e: episode, t: now };
      try {
        localStorage.setItem(EPISODE_TRACK_KEY, JSON.stringify(lastKnown));
      } catch {
        // storage unavailable
      }

      try {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'new_episode',
            message,
            anime_id: bookmark.id,
          });
        if (!insertError) summary.inserted += 1;
        else if ((insertError as { code?: string }).code !== '23505') continue;
      } catch {
        continue;
      }
    }
  } finally {
    episodeCheckInFlight = false;
  }
  return summary;
}

// ---------------------------------------------------------------------------
// MAL / AniList watch-progress sync — verbatim TS port of Aniraku
// `src/lib/sync.js` (authHeaders :8-15, getSyncStatus :17-28,
// syncAuthorize :33-44, completeSyncCallback :46-60, syncDisconnect :62-72,
// PROVIDER_LABELS :148-151, PROVIDER_LOGO :153-156, importProviderList
// :162-175, exportProviderList :177-195, describeImport :198-209,
// describeExport :211-221). Bearer via authHeaders above; base = API_BASE.
// UNFILTERED: no NSFW/rating filter exists anywhere in this chain (sync =
// unfiltered, per user decision — Aniraku's sync.js has none either).
// `updateSyncProgress`/`updateSyncScore`/ratings are Watch-scope and not
// part of this mission's port list.
// ---------------------------------------------------------------------------

export interface SyncProviderStatus {
  connected?: boolean;
  username?: string;
  reason?: string;
  expires_at?: number;
}

/** Payload of GET /api/v1/sync — keyed by provider (`mal`, `anilist`). */
export type SyncStatus = Record<string, SyncProviderStatus>;

export async function getSyncStatus(): Promise<SyncStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sync`, {
      cache: 'no-store',
      headers: await authHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as SyncStatus;
  } catch {
    return null;
  }
}

// Fetch the provider's authorize URL, then hand the browser off to it.
// A plain location redirect can't carry the auth header, so the URL must
// be requested first.
export async function syncAuthorize(provider: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sync/${provider}/authorize`, {
      headers: await authHeaders(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string } | null;
    return data?.url || null;
  } catch {
    return null;
  }
}

export async function completeSyncCallback(
  _provider: string, // kept for Aniraku signature parity; backend resolves the provider from its OAuth state store
  code: string,
  state: string,
): Promise<Record<string, unknown>> {
  try {
    // Provider-agnostic callback: MAL / AniList redirect back with only
    // ?code=&state= (no provider), and the backend resolves the provider
    // from its pending OAuth state store.
    const res = await fetch(`${API_BASE}/api/v1/sync/callback`, {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ code, state }),
    });
    return (await res.json().catch(() => ({}))) as Record<string, unknown>;
  } catch {
    return { error: 'network' };
  }
}

export async function syncDisconnect(provider: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sync/${provider}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const PROVIDER_LABELS: Record<string, string> = {
  mal: 'MyAnimeList',
  anilist: 'AniList',
};

export const PROVIDER_LOGO: Record<string, string> = {
  mal: 'M',
  anilist: 'A',
};

// ── Import / Export (provider library ↔ Aniraku favorites) ──
// These reuse the OAuth tokens stored by the sync feature, so the
// provider must be connected in Settings first. UNFILTERED — the full
// library pushes/pulls with no rating filter (per user decision).

export interface ImportResult {
  error?: string;
  imported?: number;
  already?: number;
  episodes?: number;
  scores?: number;
  unmapped?: number;
  limited?: boolean;
}

export interface ExportResult {
  error?: string;
  exported?: number;
  scores?: number;
  skipped?: number;
  failed?: number;
  limited?: boolean;
}

export async function importProviderList(
  provider: string,
): Promise<ImportResult> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/import/${provider}`, {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({}),
    });
    const data = (await res.json().catch(() => ({}))) as ImportResult;
    if (!res.ok) return { error: data.error || 'Import failed' };
    return data;
  } catch {
    return { error: 'Could not reach the server' };
  }
}

/** True when an export error payload/status smells like provider throttling. */
export function isRateLimitError(message: string | undefined): boolean {
  if (!message) return false;
  return /429|too many requests|rate[\s-_]*limit/i.test(message);
}

/** Parse a `Retry-After` header (delta-seconds or HTTP-date) into ms. */
function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const when = Date.parse(trimmed);
  if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  return null;
}

const EXPORT_ATTEMPTS = 5;
const EXPORT_RETRY_MAX_MS = 120000;

export async function exportProviderList(
  provider: string,
): Promise<ExportResult> {
  for (let attempt = 0; attempt < EXPORT_ATTEMPTS; attempt += 1) {
    const last = attempt === EXPORT_ATTEMPTS - 1;
    try {
      const res = await fetch(`${API_BASE}/api/v1/export/${provider}`, {
        method: 'POST',
        headers: await authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({}),
      });
      const data = (await res.json().catch(() => ({}))) as ExportResult;
      if (res.ok) return data;
      const retryable =
        res.status === 408 || res.status === 429 || res.status >= 500;
      if (!retryable || last) {
        return { error: data.error || 'Export failed' };
      }
      // Honor the server's Retry-After on 429 (AniList window); otherwise
      // exponential backoff. Caps keep a background job from stalling forever.
      const headerWait =
        res.status === 429
          ? parseRetryAfterMs(res.headers.get('Retry-After'))
          : null;
      const backoff = 1000 * 2 ** attempt;
      await sleepMs(
        Math.min(EXPORT_RETRY_MAX_MS, Math.max(0, headerWait ?? backoff)),
      );
    } catch {
      if (last) return { error: 'Could not reach the server' };
      await sleepMs(Math.min(EXPORT_RETRY_MAX_MS, 1000 * 2 ** attempt));
    }
  }
  return { error: 'Export failed' };
}

// Human-readable count summary for import/export results.
export function describeImport(r: ImportResult | null | undefined): string {
  if (!r) return '';
  if (r.error) return r.error;
  const parts: string[] = [];
  if ((r.imported ?? 0) > 0) parts.push(`${r.imported} imported`);
  if ((r.already ?? 0) > 0) parts.push(`${r.already} already in your library`);
  if ((r.episodes ?? 0) > 0) parts.push(`${r.episodes} episodes of progress`);
  if ((r.scores ?? 0) > 0) parts.push(`${r.scores} scores`);
  if ((r.unmapped ?? 0) > 0) parts.push(`${r.unmapped} had no Aniraku match`);
  if (r.limited) parts.push('more episodes remain — import again to continue');
  return parts.join(' · ') || 'Nothing new to import';
}

export function describeExport(r: ExportResult | null | undefined): string {
  if (!r) return '';
  if (r.error) return r.error;
  const parts: string[] = [];
  if ((r.exported ?? 0) > 0) parts.push(`${r.exported} titles updated`);
  if ((r.scores ?? 0) > 0) parts.push(`${r.scores} scores`);
  if ((r.skipped ?? 0) > 0) parts.push(`${r.skipped} already completed`);
  if ((r.failed ?? 0) > 0) parts.push(`${r.failed} failed`);
  if (r.limited) parts.push('more titles remain — export again to continue');
  return parts.join(' · ') || 'Nothing to export';
}

// ── Background export runner (rate-limited, Supabase-notified) ──
// The provider mutations themselves run inside the backend
// (`POST /api/v1/export/{provider}`), which processes one chunk per call and
// answers `limited: true` while titles remain. This runner loops those chunk
// calls WITHOUT blocking the UI and paces them so provider-side writes stay
// at/below ~30 entries/min (AniList's documented write limit): after each
// chunk it waits `entries/30min`, clamped to 4s..120s. True per-mutation
// pacing inside a chunk lives in the Go backend; this spaces chunk requests.
// On terminal state it inserts a Supabase `notifications` row (type
// `export_complete` / `export_failed`) so the bell badge + drawer — which
// merge Supabase rows in fetchNotifications — notify the user even if they
// navigated away. Job state persists in LS (one slot per provider); a reload
// marks a mid-flight job `interrupted` (chunks are idempotent server-side
// via skipped/already handling, so re-running is safe).

export type ExportJobStatus = 'running' | 'done' | 'error' | 'interrupted';

export interface ExportJobState {
  provider: string;
  status: ExportJobStatus;
  startedAt: number;
  updatedAt: number;
  chunks: number;
  exported: number;
  scores: number;
  skipped: number;
  failed: number;
  /** Final human-readable line (terminal states only). */
  message?: string;
  /** Transient progress line (e.g. rate-limit waits). Cleared on progress. */
  note?: string;
}

export type ExportJobs = Record<string, ExportJobState>;

const EXPORT_JOB_KEY = 'aniraku:export-job';
const EXPORT_PACE_MIN_MS = 4000;
const EXPORT_PACE_MAX_MS = 120000;
const EXPORT_ENTRIES_PER_MINUTE = 30;
// AniList's documented window is 60s; wait a full window + margin when the
// provider throttles us, then retry the SAME chunk (up to the cap below).
const EXPORT_RATE_WAIT_MS = 65000;
const EXPORT_RATE_RETRIES = 8;

let exportJobInFlight = false;
let exportJobs: ExportJobs = {};
const exportJobListeners = new Set<(jobs: ExportJobs) => void>();

function readExportJobs(): void {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(EXPORT_JOB_KEY);
  } catch {
    return; // storage unavailable — jobs stay memory-only
  }
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Record<string, ExportJobState>;
    for (const [provider, job] of Object.entries(parsed)) {
      if (!job || typeof job !== 'object') continue;
      exportJobs[provider] = {
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

readExportJobs();

function persistExportJobs(): void {
  try {
    window.localStorage.setItem(EXPORT_JOB_KEY, JSON.stringify(exportJobs));
  } catch {
    // storage unavailable — memory-only
  }
}

function setExportJob(next: ExportJobState): void {
  exportJobs = { ...exportJobs, [next.provider]: next };
  persistExportJobs();
  exportJobListeners.forEach((listener) => {
    try {
      listener(exportJobs);
    } catch {
      // a broken listener must not break the store
    }
  });
}

/** Snapshot of the background export jobs, keyed by provider. */
export function getExportJobs(): ExportJobs {
  return exportJobs;
}

/** Subscribe to export-job updates; fires immediately with current jobs. */
export function subscribeExportJobs(
  listener: (jobs: ExportJobs) => void,
): () => void {
  exportJobListeners.add(listener);
  try {
    listener(exportJobs);
  } catch {
    // ignore listener errors
  }
  return () => {
    exportJobListeners.delete(listener);
  };
}

function exportPaceDelayMs(entries: number): number {
  const paced = Math.round(
    (Math.max(0, entries) / EXPORT_ENTRIES_PER_MINUTE) * 60000,
  );
  return Math.min(EXPORT_PACE_MAX_MS, Math.max(EXPORT_PACE_MIN_MS, paced));
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function notifyExportFinished(
  provider: string,
  totals: { exported: number; scores: number; skipped: number; failed: number },
  error?: string,
): Promise<string> {
  const label = PROVIDER_LABELS[provider] ?? provider;
  const message = error
    ? `Export to ${label} stopped after ${totals.exported} titles: ${error} — run export again to continue`
    : `Export to ${label} finished: ${describeExport({ ...totals, limited: false })}`;
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
    // notification insert is best-effort; the bell refresh below still runs
  }
  try {
    await fetchNotifications();
  } catch {
    // store keeps last-known rows
  }
  return message;
}

/**
 * Run the provider export in the background: loops chunk POSTs while the
 * backend answers `limited`, pacing chunk requests at ~30 entries/min.
 * Non-blocking — resolves with the terminal snapshot; progress flows through
 * subscribeExportJobs and completion lands in the notifications bell.
 */
export async function runExportJob(provider: string): Promise<ExportJobState> {
  const current = exportJobs[provider];
  if (exportJobInFlight || current?.status === 'running') {
    return (
      current ?? {
        provider,
        status: 'running',
        startedAt: Date.now(),
        updatedAt: Date.now(),
        chunks: 0,
        exported: 0,
        scores: 0,
        skipped: 0,
        failed: 0,
      }
    );
  }
  exportJobInFlight = true;
  const startedAt = Date.now();
  const totals = { exported: 0, scores: 0, skipped: 0, failed: 0 };
  let chunks = 0;
  let rateWaits = 0;
  const progress = (note?: string): ExportJobState => ({
    provider,
    status: 'running',
    startedAt,
    updatedAt: Date.now(),
    chunks,
    ...totals,
    ...(note ? { note } : {}),
  });
  setExportJob(progress());
  try {
    for (;;) {
      const chunk = await exportProviderList(provider);
      chunks += 1;
      if (chunk.error) {
        // Provider throttling is transient: wait out the rate window and
        // retry the same chunk instead of failing the whole job.
        if (isRateLimitError(chunk.error) && rateWaits < EXPORT_RATE_RETRIES) {
          rateWaits += 1;
          setExportJob(
            progress(
              `Rate limited by ${PROVIDER_LABELS[provider] ?? provider} — ` +
                `waiting ${Math.round(EXPORT_RATE_WAIT_MS / 1000)}s before ` +
                `retrying (attempt ${rateWaits}/${EXPORT_RATE_RETRIES})…`,
            ),
          );
          await sleepMs(EXPORT_RATE_WAIT_MS);
          continue;
        }
        const message = await notifyExportFinished(
          provider,
          totals,
          chunk.error,
        );
        const terminal: ExportJobState = {
          ...progress(),
          status: 'error',
          message,
        };
        setExportJob(terminal);
        return terminal;
      }
      rateWaits = 0; // a clean chunk resets the throttle budget
      totals.exported += chunk.exported ?? 0;
      totals.scores += chunk.scores ?? 0;
      totals.skipped += chunk.skipped ?? 0;
      totals.failed += chunk.failed ?? 0;
      if (!chunk.limited) {
        const message = await notifyExportFinished(provider, totals);
        const terminal: ExportJobState = {
          ...progress(),
          status: 'done',
          message,
        };
        setExportJob(terminal);
        return terminal;
      }
      setExportJob(progress());
      await sleepMs(
        exportPaceDelayMs(chunk.exported ?? EXPORT_ENTRIES_PER_MINUTE),
      );
    }
  } finally {
    exportJobInFlight = false;
  }
}

/** Fire-and-forget wrapper for UI handlers. */
export function startExportJob(provider: string): ExportJobState {
  void runExportJob(provider);
  const snapshot = getExportJobs()[provider];
  return (
    snapshot ?? {
      provider,
      status: 'running',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      chunks: 0,
      exported: 0,
      scores: 0,
      skipped: 0,
      failed: 0,
    }
  );
}
