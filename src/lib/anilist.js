const DEFAULT_API_BASE = 'https://api.aniraku.tech'
const METADATA_RESOLVER_PATH = '/api/kitsu'
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

function anirakuApiBase() {
  return (import.meta.env.VITE_API_URL || DEFAULT_API_BASE).replace(/\/$/, '')
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

async function mapScheduleMalIdsToAniList(apiBase, malIds) {
  const ids = [...new Set(malIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 50)
  if (!ids.length) return new Map()

  const response = await fetch(`${apiBase}/api/v1/anilist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      query: 'query ($ids: [Int]) { Page(perPage: 50) { media(idMal_in: $ids, type: ANIME) { id idMal } } }',
      variables: { ids },
    }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`Schedule ID mapping is unavailable (${response.status}).`)
  return new Map((payload?.data?.Page?.media || []).flatMap((media) => {
    const malId = Number(media?.idMal)
    const anilistId = Number(media?.id)
    return Number.isInteger(malId) && malId > 0 && Number.isInteger(anilistId) && anilistId > 0 ? [[malId, anilistId]] : []
  }))
}

async function getAnirakuAiringScheduleFallback(apiBase, page, perPage, { startAt, endAt } = {}) {
  const response = await fetch(`${apiBase}/api/v1/anilist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: ANIRAKU_AIRING_SCHEDULE_QUERY, variables: { page, perPage, startAt, endAt } }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`Schedule fallback is unavailable (${response.status}).`)
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

async function getAnirakuCalendarWeek(apiBase, page, perPage, { startAt, endAt }) {
  const response = await fetch(`${apiBase}/api/v1/anilist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: ANIRAKU_CALENDAR_WEEK_QUERY, variables: { page, perPage } }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`Weekly Schedule is unavailable (${response.status}).`)
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
    pageInfo: pageData?.pageInfo && typeof pageData.pageInfo === 'object'
      ? pageData.pageInfo
      : { currentPage: page, perPage, hasNextPage: false, total: schedule.length },
  }
}

/**
 * Schedule and displayed next-airing data are intentionally sourced from the
 * existing Aniraku API. The Preview branch retains MAL-first discovery and
 * detail metadata; the mapping step only converts the API schedule's MAL IDs
 * into the verified AniList IDs already used by route and playback contracts.
 */
export async function getAnirakuSchedule({ page = 1, perPage = 50, startAt, endAt } = {}) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1))
  const safePerPage = Math.min(100, Math.max(1, Math.floor(Number(perPage) || 50)))
  const apiBase = anirakuApiBase()
  const safeStartAt = Math.floor(Number(startAt))
  const safeEndAt = Math.floor(Number(endAt))
  const boundedWindow = Number.isInteger(safeStartAt) && Number.isInteger(safeEndAt) && safeStartAt > 0 && safeEndAt > safeStartAt

  // Mirror production Schedule: its seven-day rail uses Aniraku's
  // popular-releasing titles and each title's next confirmed airing event.
  // This excludes previously released rows without direct AniList browser traffic.
  if (boundedWindow) return getAnirakuCalendarWeek(apiBase, safePage, safePerPage, { startAt: safeStartAt, endAt: safeEndAt })

  const response = await fetch(`${apiBase}/api/v1/schedule?page=${safePage}&perPage=${safePerPage}`, {
    headers: { Accept: 'application/json' },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`Schedule is unavailable (${response.status}).`)

  const source = Array.isArray(payload?.schedule) ? payload.schedule : []
  let idMap = new Map()
  try {
    idMap = await mapScheduleMalIdsToAniList(apiBase, source.map((item) => item?.id))
  } catch (error) {
    console.warn('Preview Schedule MAL-ID mapping is unavailable; trying Aniraku schedule fallback:', error)
  }
  const schedule = source.flatMap((item) => {
    const malId = Number(item?.id)
    const id = idMap.get(malId)
    const episode = Number(item?.episode)
    const airingAt = Number(item?.airingAt)
    if (!id || !Number.isInteger(episode) || episode < 1 || !Number.isInteger(airingAt) || airingAt < 1) return []
    return [{
      id,
      idMal: malId,
      title: titleFromSchedule(item?.title),
      coverImage: item?.coverImage && typeof item.coverImage === 'object' ? item.coverImage : {},
      format: String(item?.format || '').trim() || null,
      nextAiringEpisode: { episode, airingAt },
    }]
  })

  if (schedule.length) {
    return {
      schedule,
      pageInfo: payload?.pageInfo && typeof payload.pageInfo === 'object'
        ? payload.pageInfo
        : { currentPage: safePage, perPage: safePerPage, hasNextPage: false, total: schedule.length },
    }
  }

  return getAnirakuAiringScheduleFallback(apiBase, safePage, safePerPage)
}

export async function anilistQuery(query, variables = {}) {
  const body = JSON.stringify({ query, variables })
  const resolverBase = (import.meta.env.VITE_METADATA_RESOLVER_URL || '').replace(/\/$/, '')
  const resolverEndpoint = `${resolverBase}${METADATA_RESOLVER_PATH}`
  const apiBase = anirakuApiBase()

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
    throw new Error(json?.error?.message || `Kitsu metadata resolver returned ${res.status}.`)
  } catch (error) {
    // Kitsu is Preview's primary metadata source and maps every displayed
    // record back onto its verified AniList ID. Preserve the deployed Aniraku
    // API proxy as a recovery path if Kitsu is temporarily unavailable.
    console.warn('Kitsu metadata resolver failed; using Aniraku API fallback:', error)
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
