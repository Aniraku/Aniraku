import { API_BASE } from '../config'

const DIRECT_API_BASE = 'https://api.aniraku.tech'

function episodeUrl(baseUrl, animeId) {
  return `${baseUrl.replace(/\/$/, '')}/api/v1/anime/${encodeURIComponent(animeId)}/episodes`
}

async function requestEpisodes(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Accept: 'application/json', ...(options.headers || {}) },
  })
  if (!response.ok) throw new Error(`Aniraku episode API returned ${response.status}`)
  const payload = await response.json()
  const episodes = Array.isArray(payload) ? payload : payload?.episodes
  if (!Array.isArray(episodes)) throw new Error('Aniraku episode API returned an invalid response')
  return episodes
}

/**
 * Fetch canonical episode metadata. A broken/missing VITE_API_URL must not
 * prevent episode pages from using the public Aniraku API directly.
 */
export async function fetchAnimeEpisodes(animeId, options = {}) {
  const primaryUrl = episodeUrl(API_BASE, animeId)
  const directUrl = episodeUrl(DIRECT_API_BASE, animeId)
  try {
    return await requestEpisodes(primaryUrl, options)
  } catch (primaryError) {
    if (primaryUrl === directUrl || primaryError?.name === 'AbortError') throw primaryError
    return requestEpisodes(directUrl, options)
  }
}

export { DIRECT_API_BASE }
export default fetchAnimeEpisodes

/** Test-only exports. */
export const __test__ = { episodeUrl }

