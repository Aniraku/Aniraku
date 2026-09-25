// ---------------------------------------------------------------------------
// Episode ratings transport — TS port of the rating trio in Aniraku
// `src/lib/sync.js` (fetchEpisodeRatings :115-130, saveEpisodeRating
// :132-146, updateSyncScore :98-113), based on the live reference:
//   - Bearer via the Supabase session (same semantics as lib/sync.ts
//     authHeaders :8-15; duplicated here so lib/sync.ts's export surface and
//     internals stay untouched — this is a NEW Wave C file).
//   - GET  ${API_BASE}/api/v1/anime/{id}/ratings           (own ratings)
//   - POST ${API_BASE}/api/v1/anime/{id}/episode/{ep}/rating  {score}
//   - PUT  ${API_BASE}/api/v1/sync/score  {provider, animeId, score}
//     (both MAL and AniList only support an anime-level score, so the
//     episode rating becomes the score pushed to connected providers).
// Guests keep ratings in localStorage under Aniraku's
// `aniraku-episode-ratings-{animeId}` key (AnimeDetail.jsx:414, Watch.jsx:91).
// ---------------------------------------------------------------------------
import { supabase } from './supabase';
import { API_BASE } from './apiBase';

export const EPISODE_RATINGS_LS_KEY = 'aniraku-episode-ratings';

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
 * Push a 1-10 anime score to a connected provider (Aniraku sync.js:97-113).
 * Both MAL and AniList only support an anime-level score, so the rating the
 * user just set becomes that score.
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
