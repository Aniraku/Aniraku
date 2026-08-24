const DEFAULT_API_BASE = 'https://api.aniraku.tech'
const METADATA_RESOLVER_PATH = '/api/mal'
const ANILIST_STATUS_EVENT = 'aniraku:anilist-status'

export class AniListUnavailableError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AniListUnavailableError'
  }
}

export const isAniListUnavailableError = (error) => error instanceof AniListUnavailableError

function reportAniListStatus(unavailable) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ANILIST_STATUS_EVENT, { detail: { unavailable } }))
}

export async function anilistQuery(query, variables = {}) {
  const body = JSON.stringify({ query, variables })
  const resolverBase = (import.meta.env.VITE_METADATA_RESOLVER_URL || '').replace(/\/$/, '')
  const resolverEndpoint = `${resolverBase}${METADATA_RESOLVER_PATH}`
  const apiBase = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE).replace(/\/$/, '')

  try {
    const res = await fetch(resolverEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body,
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json.data) {
      reportAniListStatus(false)
      return json
    }
    throw new Error(json?.error?.message || `MyAnimeList metadata resolver returned ${res.status}.`)
  } catch (error) {
    // MAL does not permit browser CORS. The Vercel resolver owns the primary
    // MAL request and maps its records back onto AniList IDs. Preserve the
    // deployed Aniraku API proxy as the recovery path if that resolver or its
    // mapping service is temporarily unavailable.
    console.warn('MAL metadata resolver failed; using Aniraku API fallback:', error)
    const fallback = await fetch(`${apiBase}/api/v1/anilist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body,
    })
    const json = await fallback.json().catch(() => ({}))
    if (fallback.ok && json.data) {
      reportAniListStatus(false)
      return json
    }
    const message = json?.errors?.[0]?.message || json?.error || `Metadata fallback is unavailable (${fallback.status}).`
    if ((fallback.status === 403 && /temporarily disabled|severe stability issues/i.test(message)) || /anilist circuit open|rate limited|mapping unavailable/i.test(message)) {
      reportAniListStatus(true)
      throw new AniListUnavailableError('AniList is temporarily unavailable due to an upstream stability issue. Try again shortly.')
    }
    throw new Error(message)
  }
}

// --- Queries ---

export const BROWSE_QUERY = `
  query ($page: Int, $perPage: Int, $search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $season: MediaSeason, $year: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total lastPage hasNextPage currentPage perPage }
      media(search: $search, genre: $genre, format: $format, status: $status, season: $season, seasonYear: $year, type: ANIME, sort: $sort) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail } format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
  }
`

export const CATALOG_SHELVES_QUERY = `
  query {
    trending: Page(page: 1, perPage: 18) {
      media(type: ANIME, sort: TRENDING_DESC) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail }
        format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
    airing: Page(page: 1, perPage: 18) {
      media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail }
        format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
    popular: Page(page: 1, perPage: 18) {
      media(type: ANIME, sort: POPULARITY_DESC) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail }
        format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
    movies: Page(page: 1, perPage: 18) {
      media(type: ANIME, format: MOVIE, sort: POPULARITY_DESC) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail }
        format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
    topRated: Page(page: 1, perPage: 18) {
      media(type: ANIME, sort: SCORE_DESC) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail }
        format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
  }
`

export const TRENDING_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING) {
        id title { romaji english userPreferred }
        coverImage { extraLarge large }
        format episodes averageScore status genres isAdult
      }
    }
  }
`

export const ANIME_DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id idMal title { romaji english native userPreferred }
      coverImage { extraLarge large medium color }
      bannerImage format status episodes duration genres averageScore popularity description season seasonYear
      nextAiringEpisode { episode airingAt }
      relations { edges { relationType node { id title { romaji english } coverImage { large medium } format type } } }
      streamingEpisodes { title thumbnail url }
    }
  }
`

export const RECOMMEND_QUERY = `
  query ($id: Int, $genres: [String], $page: Int, $perPage: Int) {
    Media(id: $id, type: ANIME) { id genres }
    Page(page: $page, perPage: $perPage) {
      media(genre_in: $genres, type: ANIME, sort: SCORE_DESC, id_not: $id) {
        id title { romaji english userPreferred }
        coverImage { extraLarge large medium color }
        format episodes averageScore status genres isAdult
      }
    }
  }
`

export const SCHEDULE_QUERY = `
  query ($weekStart: Int, $weekEnd: Int) {
    Page(perPage: 50) {
      media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
        id title { romaji english userPreferred }
        coverImage { large }
        format genres isAdult
        airingSchedule(notYetAired: true, greaterThan: $weekStart, lessThan: $weekEnd) {
          nodes { episode airingAt timeUntilAiring }
        }
      }
    }
  }
`
