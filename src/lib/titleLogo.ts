// Anime title artwork (logo wordmarks) for hero/banner surfaces.
//
// Primary source — the Aniraku backend's fast logo endpoint:
//   GET {API_BASE}api/v1/anime/{anilistId}/logo
//     → 200 {"logo": "https://image.tmdb.org/t/p/w780/....png"}
//     → 404 {"error":"anime not found"} (no logo for this title)
// TMDB-hosted stylized wordmarks, keyed directly by AniList id.
//
// Fallback source — AniZip's free TVDB mirror (api.ani.zip/mappings), whose
// `images` array carries a `coverType: "Clearlogo"` entry. It covers titles
// the backend dataset doesn't have yet; the app already preconnects to
// artworks.thetvdb.com for exactly this kind of artwork.
//
// One lightweight GET per anime per source at most; every result (hit or
// miss) is cached in localStorage so the hero only ever resolves once.

import { useSyncExternalStore } from 'react';
import { ANIRAKU_API_BASE } from '../hooks/useApi';

const STORAGE_KEY = 'aniraku:title-logos';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // artwork is static — 30 days
const MAX_ENTRIES = 300;

export interface LogoEntry {
  url: string;
  ts: number;
}

type LogoRecord = Record<string, LogoEntry>;

const listeners = new Set<() => void>();
const inflight = new Map<string, Promise<string | null>>();
let cache: LogoRecord | null = null;

function emit(): void {
  listeners.forEach((listener) => listener());
}

function readStore(): LogoRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as LogoRecord) : {};
  } catch {
    return {};
  }
}

function ensureCache(): LogoRecord {
  if (cache === null) cache = readStore();
  return cache;
}

function persist(record: LogoRecord): void {
  cache = record;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Quota — trim oldest entries and retry once.
    const entries = Object.entries(record).sort((a, b) => a[1].ts - b[1].ts);
    const trimmed = Object.fromEntries(
      entries.slice(-Math.floor(MAX_ENTRIES / 2)),
    );
    cache = trimmed;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Give up silently — the in-session map still serves.
    }
  }
  emit();
}

export function getTitleLogo(animeId: string): string | null {
  const id = String(animeId || '');
  if (!id) return null;
  const entry = ensureCache()[id];
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) return null;
  return entry.url || null;
}

async function fetchFromBackend(id: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${ANIRAKU_API_BASE.replace(/\/+$/, '')}/api/v1/anime/${encodeURIComponent(id)}/logo`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { logo?: unknown };
    return typeof data?.logo === 'string' && data.logo ? data.logo : null;
  } catch {
    return null;
  }
}

async function fetchFromAniZip(id: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.ani.zip/mappings?anilist_id=${encodeURIComponent(id)}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      images?: { coverType?: string; url?: string }[];
    };
    const hit = (data.images ?? []).find(
      (img) => /clearlogo/i.test(img?.coverType ?? '') && img?.url,
    );
    return hit?.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve the logo for one AniList id: backend endpoint first, AniZip
 * clearlogo as fallback. Cached; misses are remembered too and retried
 * after the TTL. Never throws.
 */
export function ensureTitleLogo(animeId: string): Promise<string | null> {
  const id = String(animeId || '');
  if (!id || typeof window === 'undefined') return Promise.resolve(null);
  const record = ensureCache();
  const cached = record[id];
  if (cached && Date.now() - cached.ts <= TTL_MS) {
    return Promise.resolve(cached.url || null);
  }
  const existing = inflight.get(id);
  if (existing) return existing;

  const task = (async () => {
    const url = (await fetchFromBackend(id)) ?? (await fetchFromAniZip(id));
    // Cap the store before persisting.
    const entries = Object.entries(record);
    if (entries.length >= MAX_ENTRIES) {
      entries.sort((a, b) => a[1].ts - b[1].ts);
      for (const [oldId] of entries.slice(0, entries.length - MAX_ENTRIES + 1)) {
        delete record[oldId];
      }
    }
    record[id] = { url: url ?? '', ts: Date.now() };
    persist(record);
    return url;
  })();
  inflight.set(id, task);
  return task.finally(() => inflight.delete(id));
}

function subscribe(listener: () => void): () => void {
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

/** Logo URL for one AniList id (null while unknown — fires the fetch). */
export function useTitleLogo(animeId: string): string | null {
  const id = String(animeId || '');
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!id) return null;
      void ensureTitleLogo(id);
      return getTitleLogo(id);
    },
    () => null,
  );
}
