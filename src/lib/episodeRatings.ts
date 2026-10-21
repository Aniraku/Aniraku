// Episode ratings transport: fetch own ratings, save an episode rating, and
// update the provider-level score.
//   - Bearer auth uses the Supabase session. The auth helper is duplicated
//     from lib/sync.ts so that module's export surface stays untouched;
//     this is a new file.
//   - GET  ${API_BASE}/api/v1/anime/{id}/ratings           (own ratings)
//   - POST ${API_BASE}/api/v1/anime/{id}/episode/{ep}/rating  {score}
//   - PUT  ${API_BASE}/api/v1/sync/score  {provider, animeId, score}
//     (both MAL and AniList only support an anime-level score, so the
//     average of the user's episode ratings becomes the pushed score).
// Guests keep ratings in localStorage under the
// `aniraku-episode-ratings-{animeId}` key.
import { supabase } from './supabase';
import { API_BASE } from './apiBase';

export const EPISODE_RATINGS_LS_KEY = 'aniraku-episode-ratings';

export function episodeRatingsKey(animeId: string | number): string {
  return `${EPISODE_RATINGS_LS_KEY}-${String(animeId)}`;
}

/** Clamp to a valid 1-10 integer score, or null when invalid. */
export function normalizeScore(score: unknown): number | null {
  const n = Math.round(Number(score));
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  return n;
}

/** Mean of a ratings map, rounded to the nearest integer (provider score). */
export function averageRating(ratings: Record<number | string, number>): number | null {
  const scores = Object.values(ratings)
    .map((s) => Math.round(Number(s)))
    .filter((s) => Number.isInteger(s) && s >= 1 && s <= 10);
  if (!scores.length) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function readGuestRatings(
  animeId: string | number,
): Record<number, number> {
  try {
    const raw = localStorage.getItem(episodeRatingsKey(animeId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<number, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const ep = Math.floor(Number(k));
      const score = normalizeScore(v);
      if (Number.isFinite(ep) && ep > 0 && score !== null) out[ep] = score;
    }
    return out;
  } catch {
    return {};
  }
}

export function writeGuestRatings(
  animeId: string | number,
  ratings: Record<number, number>,
): void {
  try {
    localStorage.setItem(episodeRatingsKey(animeId), JSON.stringify(ratings));
  } catch {
    // storage unavailable
  }
}

/**
 * Merge guest ratings into the server on login: server wins per-episode,
 * guest-only episodes upload. Returns the merged map.
 */
export async function mergeGuestRatingsOnLogin(
  animeId: string | number,
): Promise<Record<number, number>> {
  const guest = readGuestRatings(animeId);
  const server = await fetchEpisodeRatings(animeId);
  if (!server) return guest;
  const merged: Record<number, number> = { ...guest, ...server };
  const guestOnly = Object.entries(guest).filter(([ep]) => !(ep in server));
  for (const [ep, score] of guestOnly) {
    await saveEpisodeRating(animeId, Number(ep), score);
  }
  if (guestOnly.length) {
    try {
      localStorage.removeItem(episodeRatingsKey(animeId));
    } catch {
      // storage unavailable
    }
  }
  return merged;
}

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

/** Own ratings for one anime: `{ [episode_number]: score }` or null. */
export async function fetchEpisodeRatings(
  animeId: string | number,
): Promise<Record<number, number> | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/anime/${animeId}/ratings`, {
      cache: 'no-store',
      headers: await authHeaders(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      ratings?: Array<{ episode_number: number; score: number }>;
    } | null;
    if (!data?.ratings) return null;
    return Object.fromEntries(
      data.ratings.map((r) => [Number(r.episode_number), Number(r.score)]),
    );
  } catch {
    return null;
  }
}

/** Persist one episode rating (1-10) server-side. Returns success. */
export async function saveEpisodeRating(
  animeId: string | number,
  episode: number,
  score: number,
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/anime/${animeId}/episode/${episode}/rating`,
      {
        method: 'POST',
        headers: await authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ score }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Push a 1-10 anime score to a connected provider. Both MAL and AniList only
 * support an anime-level score — callers pass the average of the user's
 * episode ratings (see `averageRating`).
 */
export async function updateSyncScore({
  provider,
  animeId,
  score,
}: {
  provider: string;
  animeId: number;
  score: number;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sync/score`, {
      method: 'PUT',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ provider, animeId, score }),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as { error?: string } | null;
    return { ok: false, error: data?.error || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: (err as Error)?.message || 'network error' };
  }
}
