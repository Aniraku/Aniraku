// Announcements — repo-driven site notices (no backend needed).
//
// To publish: append an entry to `src/data/announcements.json` and deploy:
//   { "id": "migrate-cloudflare-1", "title": "...", "message": "...",
//     "link": "/profile", "linkLabel": "Open profile",
//     "start": "2026-10-20T00:00:00Z", "end": "2026-10-27T00:00:00Z" }
// `link`/`linkLabel`/`start`/`end` are optional; no `end` = runs forever.
// Dismissal is session-scoped: closing hides it until the next visit, when
// every active announcement shows again.
import raw from '../data/announcements.json';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
  /** ISO date — hidden before. */
  start?: string;
  /** ISO date — hidden after. */
  end?: string;
}

const DISMISSED_KEY = 'aniraku:announcements:dismissed-session';

// In-memory fallback when sessionStorage is unavailable (private mode);
// still session-scoped — a reload re-shows, same as closing rules below.
const memoryDismissed = new Set<string>();

function sessionStore(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    // storage blocked — fall through to memory
  }
  return null;
}

function asAnnouncement(item: unknown): Announcement | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, unknown>;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  if (typeof raw.title !== 'string' || !raw.title) return null;
  if (typeof raw.message !== 'string' || !raw.message) return null;
  const out: Announcement = {
    id: raw.id,
    title: raw.title,
    message: raw.message,
  };
  if (typeof raw.link === 'string' && raw.link) out.link = raw.link;
  if (typeof raw.linkLabel === 'string' && raw.linkLabel) {
    out.linkLabel = raw.linkLabel;
  }
  if (typeof raw.start === 'string' && raw.start) out.start = raw.start;
  if (typeof raw.end === 'string' && raw.end) out.end = raw.end;
  return out;
}

/** All valid entries (malformed rows skipped, never throw). */
export function getAnnouncements(): Announcement[] {
  if (!Array.isArray(raw)) return [];
  const out: Announcement[] = [];
  for (const item of raw) {
    const parsed = asAnnouncement(item);
    if (parsed) out.push(parsed);
  }
  return out;
}

function timeOf(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const t = Date.parse(value);
  return Number.isNaN(t) ? fallback : t;
}

/** Entries whose date window contains `now` (open-ended when unset). */
export function getActiveAnnouncements(now: number = Date.now()): Announcement[] {
  return getAnnouncements().filter(
    (a) => timeOf(a.start, 0) <= now && now <= timeOf(a.end, Infinity),
  );
}

export function readDismissedIds(): Set<string> {
  const store = sessionStore();
  if (!store) return new Set(memoryDismissed);
  try {
    const parsed = JSON.parse(store.getItem(DISMISSED_KEY) || '[]');
    return new Set(
      Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [],
    );
  } catch {
    return new Set(memoryDismissed);
  }
}

export function dismissAnnouncement(id: string): void {
  memoryDismissed.add(id);
  const store = sessionStore();
  if (!store) return;
  try {
    const next = readDismissedIds();
    next.add(id);
    store.setItem(DISMISSED_KEY, JSON.stringify([...next]));
  } catch {
    // storage blocked — memory set above still covers this session
  }
}

/** First active, not-yet-dismissed announcement (null = nothing to show). */
export function nextAnnouncement(now: number = Date.now()): Announcement | null {
  const dismissed = readDismissedIds();
  return getActiveAnnouncements(now).find((a) => !dismissed.has(a.id)) ?? null;
}
