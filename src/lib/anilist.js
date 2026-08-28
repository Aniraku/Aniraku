const ANILIST_STATUS_EVENT = 'aniraku:anilist-status'
const CLIENT_REQUEST_INTERVAL_MS = 2100
const REQUEST_CACHE_TTL_MS = 5 * 60_000
const responseCache = new Map()
const inFlightRequests = new Map()
let nextAniListRequestAt = 0
let blockedUntil = 0

export class AniListRateLimitError extends Error {
  constructor(retryAfterMs = null) {
    const seconds = retryAfterMs === null ? null : Math.max(1, Math.ceil(retryAfterMs / 1000))
    super(seconds ? `AniList is busy. Try again in ${seconds} seconds.` : 'AniList is busy. Try again in a moment.')
    this.name = 'AniListRateLimitError'
    this.retryAfterMs = retryAfterMs
  }
}

export class AniListUnavailableError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AniListUnavailableError'
  }
}

export const isAniListRateLimitError = (error) => error instanceof AniListRateLimitError
export const isAniListUnavailableError = (error) => error instanceof AniListUnavailableError

function reportAniListStatus(unavailable) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ANILIST_STATUS_EVENT, { detail: { unavailable } }))
}

function getRetryAfterMs(headers) {
  const retryAfter = headers.get('retry-after')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000)
    const dateMs = Date.parse(retryAfter)
    if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now())
  }
  const reset = Number(headers.get('x-ratelimit-reset'))
  return Number.isFinite(reset) && reset > 0 ? Math.max(0, reset * 1000 - Date.now()) : null
}

function updateAniListRateState(headers) {
  const remaining = Number(headers.get('x-ratelimit-remaining'))
  const limit = Number(headers.get('x-ratelimit-limit'))
  if (Number.isFinite(remaining) && remaining <= 2) {
    nextAniListRequestAt = Math.max(nextAniListRequestAt, Date.now() + (Number.isFinite(limit) && limit <= 30 ? 2500 : 1200))
  }
  const retryAfter = getRetryAfterMs(headers)
  if (retryAfter !== null && remaining === 0) blockedUntil = Math.max(blockedUntil, Date.now() + retryAfter)
}

function sleep(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

async function waitForAniListSlot() {
  const now = Date.now()
  const scheduledAt = Math.max(now, nextAniListRequestAt, blockedUntil)
  nextAniListRequestAt = scheduledAt + CLIENT_REQUEST_INTERVAL_MS
  if (scheduledAt > now) await sleep(scheduledAt - now)
}

export async function anilistQuery(query, variables = {}) {
  const body = JSON.stringify({ query, variables })
  const existingRequest = inFlightRequests.get(body)
  if (existingRequest) return existingRequest
  const cached = responseCache.get(body)
  if (cached && cached.expiresAt > Date.now()) return cached.value
  if (cached) responseCache.delete(body)

  const requestPromise = (async () => {
    await waitForAniListSlot()
    const apiUrl = (import.meta.env.VITE_ANILIST_GRAPHQL_URL || 'https://graphql.anilist.co').replace(/\/$/, '')
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    })
    const json = await res.json().catch(() => ({}))
    updateAniListRateState(res.headers)
    if (res.ok && json.data) {
      reportAniListStatus(false)
      responseCache.set(body, { expiresAt: Date.now() + REQUEST_CACHE_TTL_MS, value: json })
      return json
    }
    const message = json?.errors?.[0]?.message || json?.error || `AniList is unavailable (${res.status}).`
    if (res.status === 429 || /anilist circuit open|rate limited/i.test(message)) {
      reportAniListStatus(true)
      throw new AniListRateLimitError(getRetryAfterMs(res.headers))
    }
    if (res.status === 403 && /temporarily disabled|severe stability issues/i.test(message)) {
      reportAniListStatus(true)
      throw new AniListUnavailableError('AniList is temporarily unavailable due to an upstream stability issue. Try again shortly.')
    }
    throw new Error(message)
  })()
  inFlightRequests.set(body, requestPromise)
  try {
    return await requestPromise
  } finally {
    inFlightRequests.delete(body)
  }
}

export function resetAniListRequestStateForTests() {
  responseCache.clear()
  inFlightRequests.clear()
  nextAniListRequestAt = 0
  blockedUntil = 0
}

export async function getAnirakuSchedule({ page = 1, perPage = 50, startAt, endAt } = {}) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1))
  const safePerPage = Math.min(100, Math.max(1, Math.floor(Number(perPage) || 50)))
  const now = Math.floor(Date.now() / 1000)
  const safeStartAt = Number.isInteger(Math.floor(Number(startAt))) ? Math.floor(Number(startAt)) : now
  const safeEndAt = Number.isInteger(Math.floor(Number(endAt))) ? Math.floor(Number(endAt)) : safeStartAt + (7 * 24 * 60 * 60)
  const { data } = await anilistQuery(`
    query ($page: Int!, $perPage: Int!, $startAt: Int!, $endAt: Int!) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage total }
        airingSchedules(notYetAired: true, airingAt_greater: $startAt, airingAt_lesser: $endAt, sort: [TIME]) {
          airingAt episode
          media { id idMal title { romaji english native userPreferred } coverImage { extraLarge large medium color } format }
        }
      }
    }
  `, { page: safePage, perPage: safePerPage, startAt: safeStartAt, endAt: safeEndAt })
  const pageData = data?.Page || {}
  const schedule = (pageData.airingSchedules || []).flatMap((item) => {
    const media = item?.media
    const id = Number(media?.id)
    const episode = Number(item?.episode)
    const airingAt = Number(item?.airingAt)
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(episode) || episode < 1 || !Number.isInteger(airingAt) || airingAt < 1) return []
    return [{
      id,
      idMal: Number.isInteger(Number(media?.idMal)) ? Number(media.idMal) : null,
      title: media?.title || {},
      coverImage: media?.coverImage || {},
      format: media?.format || null,
      nextAiringEpisode: { episode, airingAt },
    }]
  })
  return { schedule, pageInfo: pageData.pageInfo || { currentPage: safePage, perPage: safePerPage, hasNextPage: false, total: schedule.length } }
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
      recommendations(perPage: 12) { nodes { mediaRecommendation { id title { romaji english userPreferred } coverImage { extraLarge large medium color } format episodes averageScore status genres isAdult } } }
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
