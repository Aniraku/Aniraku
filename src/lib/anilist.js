const ANILIST_STATUS_EVENT = 'aniraku:anilist-status'
const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co'
const ANILIST_MIN_INTERVAL_MS = 2_200
const ANILIST_MAX_RETRIES = 2
const anilistInFlight = new Map()
let nextAniListRequestAt = 0
let directAniListBlockedUntil = 0

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

function retryAfterMs(response) {
  const seconds = Number(response?.headers?.get?.('Retry-After'))
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 60_000) : 60_000
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function requestAniListEndpoint(body) {
  const now = Date.now()
  const waitForSlot = Math.max(0, nextAniListRequestAt - now)
  if (waitForSlot) await wait(waitForSlot)
  nextAniListRequestAt = Date.now() + ANILIST_MIN_INTERVAL_MS
  const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.errors?.length) {
    const error = new Error(payload?.errors?.[0]?.message || `AniList is unavailable (${response.status}).`)
    error.status = response.status || Number(payload?.errors?.[0]?.status) || 0
    error.retryAfterMs = retryAfterMs(response)
    throw error
  }
  return payload
}

async function directAniListRequest(query, variables = {}) {
  const body = JSON.stringify({ query, variables })
  const requestKey = body
  const existing = anilistInFlight.get(requestKey)
  if (existing) return existing

  const request = (async () => {
    for (let attempt = 0; attempt <= ANILIST_MAX_RETRIES; attempt += 1) {
      const cooldown = Math.max(0, directAniListBlockedUntil - Date.now())
      if (cooldown) await wait(cooldown)
      try {
        return await requestAniListEndpoint(body)
      } catch (error) {
        const corsLike = error?.name === 'TypeError' || /failed to fetch|cors/i.test(error?.message || '')
        const rateLimited = Number(error?.status) === 429
        const retryable = rateLimited || corsLike || Number(error?.status) >= 500
        if (!retryable || attempt === ANILIST_MAX_RETRIES) throw error
        // A browser often surfaces AniList's rate-limited response as a
        // CORS-like TypeError because the 429 response may omit CORS headers.
        // Wait patiently instead of turning a temporary limit into "not found".
        const delay = rateLimited || corsLike
          ? Math.max(error.retryAfterMs || 60_000, 60_000)
          : Math.min(2_000 * (attempt + 1), 8_000)
        if (rateLimited || corsLike) directAniListBlockedUntil = Date.now() + delay
        await wait(delay)
      }
    }
    throw new Error('AniList request exhausted its retry budget.')
  })()
  anilistInFlight.set(requestKey, request)
  try {
    return await request
  } finally {
    anilistInFlight.delete(requestKey)
  }
}

function titleFromSchedule(value) {
  if (value && typeof value === 'object') {
    const romaji = String(value.romaji || value.english || value.native || '').trim()
    const english = String(value.english || romaji || '').trim()
    const native = String(value.native || romaji || '').trim()
    return { romaji, english, native, userPreferred: english || romaji || native || 'Unknown title' }
  }
  const title = String(value || '').trim() || 'Unknown title'
  return { romaji: title, english: title, native: title, userPreferred: title }
}

const ANIRAKU_AIRING_SCHEDULE_QUERY = `
  query ($page: Int!, $perPage: Int!, $startAt: Int, $endAt: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage total }
      airingSchedules(airingAt_greater: $startAt, airingAt_lesser: $endAt, sort: [TIME]) {
        airingAt
        episode
        media { id idMal title { romaji english native userPreferred } coverImage { extraLarge large medium color } format }
      }
    }
  }
`

const ANIRAKU_CALENDAR_WEEK_QUERY = `
  query ($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage total }
      media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
        id idMal
        title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        format
        nextAiringEpisode { episode airingAt }
      }
    }
  }
`

async function getAnirakuAiringScheduleFallback(page, perPage, { startAt, endAt } = {}) {
  const payload = await directAniListRequest(ANIRAKU_AIRING_SCHEDULE_QUERY, { page, perPage, startAt, endAt })
  const pageData = payload?.data?.Page
  const schedule = (pageData?.airingSchedules || []).flatMap((item) => {
    const media = item?.media
    const id = Number(media?.id)
    const episode = Number(item?.episode)
    const airingAt = Number(item?.airingAt)
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(episode) || episode < 1 || !Number.isInteger(airingAt) || airingAt < 1) return []
    return [{
      id,
      idMal: Number.isInteger(Number(media?.idMal)) ? Number(media.idMal) : null,
      title: titleFromSchedule(media?.title),
      coverImage: media?.coverImage && typeof media.coverImage === 'object' ? media.coverImage : {},
      format: String(media?.format || '').trim() || null,
      nextAiringEpisode: { episode, airingAt },
    }]
  })
  return {
    schedule,
    pageInfo: pageData?.pageInfo && typeof pageData.pageInfo === 'object'
      ? pageData.pageInfo
      : { currentPage: page, perPage, hasNextPage: false, total: schedule.length },
  }
}

async function getAnirakuCalendarWeek(page, perPage, { startAt, endAt }) {
  const payload = await directAniListRequest(ANIRAKU_CALENDAR_WEEK_QUERY, { page, perPage })
  const pageData = payload?.data?.Page
  const schedule = (pageData?.media || []).flatMap((media) => {
    const id = Number(media?.id)
    const episode = Number(media?.nextAiringEpisode?.episode)
    const airingAt = Number(media?.nextAiringEpisode?.airingAt)
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(episode) || episode < 1 || !Number.isInteger(airingAt) || airingAt < startAt || airingAt >= endAt) return []
    return [{
      id,
      idMal: Number.isInteger(Number(media?.idMal)) ? Number(media.idMal) : null,
      title: titleFromSchedule(media?.title),
      coverImage: media?.coverImage && typeof media.coverImage === 'object' ? media.coverImage : {},
      format: String(media?.format || '').trim() || null,
      nextAiringEpisode: { episode, airingAt },
    }]
  })
  return {
    schedule,
    pageInfo: pageData?.pageInfo && typeof pageData?.pageInfo === 'object'
      ? pageData.pageInfo
      : { currentPage: page, perPage, hasNextPage: false, total: schedule.length },
  }
}

export async function getAnirakuSchedule({ page = 1, perPage = 50, startAt, endAt } = {}) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1))
  const safePerPage = Math.min(100, Math.max(1, Math.floor(Number(perPage) || 50)))
  const safeStartAt = Math.floor(Number(startAt))
  const safeEndAt = Math.floor(Number(endAt))
  const boundedWindow = Number.isInteger(safeStartAt) && Number.isInteger(safeEndAt) && safeStartAt > 0 && safeEndAt > safeStartAt
  if (boundedWindow) return getAnirakuCalendarWeek(safePage, safePerPage, { startAt: safeStartAt, endAt: safeEndAt })
  return getAnirakuAiringScheduleFallback(safePage, safePerPage, {
    startAt: Math.floor(Date.now() / 1000),
    endAt: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
  })
}

export async function anilistQuery(query, variables = {}) {
  try {
    const json = await directAniListRequest(query, variables)
    reportAniListStatus(false)
    return json
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AniList is unavailable.'
    if (/rate limit|too many requests|temporarily unavailable|stability/i.test(message)) {
      reportAniListStatus(true)
      throw new AniListUnavailableError('AniList is rate-limited or temporarily unavailable. Please try again shortly.')
    }
    console.warn('AniList fetch failed after direct-first fallback:', error)
    throw error instanceof Error ? error : new Error(message)
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
