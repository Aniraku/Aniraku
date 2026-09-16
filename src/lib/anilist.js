const ANILIST_STATUS_EVENT = 'aniraku:anilist-status'
// Zero-rate-limit offline mirror (drop-in GraphQL clone of graphql.anilist.co).
// Override with VITE_ANILIST_ENDPOINT to point back at the official API.
const OFFLINE_ANILIST_ENDPOINT = 'https://anilist-offline-db-phi.vercel.app/'
const ANILIST_GRAPHQL_ENDPOINT = import.meta.env.VITE_ANILIST_ENDPOINT || OFFLINE_ANILIST_ENDPOINT
const IS_OFFLINE_API = !/anilist\.co/i.test(ANILIST_GRAPHQL_ENDPOINT)
const ANILIST_MAX_RETRIES = 2

// Sliding-window rate limiter.  AniList allows 30 requests per minute per IP.
// We cap at 20 with a 3-second minimum gap so bursts of page navigations
// never crowd the ceiling.  The window tracks timestamps of recent requests
// and enforces the budget before each fetch.
const ANILIST_RATE_LIMIT = 20
const ANILIST_WINDOW_MS = 60_000
const ANILIST_MIN_GAP_MS = 1_500
const requestTimestamps = []

const anilistInFlight = new Map()
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

// Prune timestamps older than the window, then wait until a slot opens.
async function acquireRequestSlot() {
  const now = Date.now()
  // Drop entries outside the sliding window
  while (requestTimestamps.length && requestTimestamps[0] <= now - ANILIST_WINDOW_MS) {
    requestTimestamps.shift()
  }
  // If at budget, wait for the oldest entry to expire
  if (requestTimestamps.length >= ANILIST_RATE_LIMIT) {
    const oldest = requestTimestamps[0]
    const waitMs = oldest + ANILIST_WINDOW_MS - now + 50
    if (waitMs > 0) await wait(waitMs)
  }
  // Enforce minimum gap between consecutive requests
  if (requestTimestamps.length) {
    const last = requestTimestamps[requestTimestamps.length - 1]
    const gapMs = last + ANILIST_MIN_GAP_MS - Date.now()
    if (gapMs > 0) await wait(gapMs)
  }
  requestTimestamps.push(Date.now())
}

async function requestAniListEndpoint(body) {
  // The offline mirror has no rate limits — skip the strict throttle entirely.
  if (!IS_OFFLINE_API) await acquireRequestSlot()
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

// In-memory response cache with 2-minute TTL.  Prevents identical queries
// from hitting AniList when React re-renders or the user navigates back.
const ANILIST_CACHE_TTL_MS = 120_000
const responseCache = new Map()

async function directAniListRequest(query, variables = {}) {
  const patchedQuery = patchQueryForOfflineApi(query)
  const body = JSON.stringify({ query: patchedQuery, variables })
  const requestKey = JSON.stringify({ query: patchedQuery, variables })

  // Return cached response if still fresh
  const cached = responseCache.get(requestKey)
  if (cached && Date.now() - cached.ts < ANILIST_CACHE_TTL_MS) return cached.data

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
    const result = normalizeOfflinePayload(await request)
    await hydrateMediaDetails(result?.data?.Media)
    responseCache.set(requestKey, { data: result, ts: Date.now() })
    // Evict stale entries when cache grows large
    if (responseCache.size > 200) {
      const now = Date.now()
      for (const [key, entry] of responseCache) {
        if (now - entry.ts > ANILIST_CACHE_TTL_MS) responseCache.delete(key)
      }
    }
    return result
  } finally {
    anilistInFlight.delete(requestKey)
  }
}

// --- Offline-mirror compatibility -------------------------------------------
// The offline API stores airing data as flat scalars (next_airing_episode /
// next_airing_at) instead of AniList's nextAiringEpisode object, and omits
// userPreferred / extraLarge / idMal plus the AiringSchedule root. Patch
// outgoing queries to also fetch the raw scalars (official AniList has no
// such fields, so this only runs against the offline endpoint), then rebuild
// the expected shapes on the way back so every consumer keeps working.
const NEXT_AIRING_OBJECT_RE = /nextAiringEpisode\s*\{\s*episode\s+airingAt\s*\}/g
const RECS_NODES_RE = /recommendations(\s*\([^)]*\))?\s*\{\s*nodes/g
const RELS_EDGES_RE = /relations(\s*\([^)]*\))?\s*\{\s*edges/g

function patchQueryForOfflineApi(query) {
  if (!IS_OFFLINE_API || typeof query !== 'string') return query
  let out = query
  if (NEXT_AIRING_OBJECT_RE.test(out)) {
    NEXT_AIRING_OBJECT_RE.lastIndex = 0
    out = out.replace(NEXT_AIRING_OBJECT_RE, (m) => `${m} next_airing_episode next_airing_at`)
  }
  // The mirror stores recs/relations as flat rows — also select the raw
  // scalars so hydrateMediaDetails can rebuild the nested shapes below.
  // Official AniList has none of these fields, so this is offline-only.
  if (RECS_NODES_RE.test(out)) {
    RECS_NODES_RE.lastIndex = 0
    out = out.replace(RECS_NODES_RE, (m, args) => `recommendations${args || ''} { id title rating nodes`)
  }
  if (RELS_EDGES_RE.test(out)) {
    RELS_EDGES_RE.lastIndex = 0
    out = out.replace(RELS_EDGES_RE, (m, args) => `relations${args || ''} { relationType id title type edges`)
  }
  return out
}

function normalizeMedia(m) {
  if (!m || typeof m !== 'object') return m
  const t = m.title
  if (t && typeof t === 'object' && t.userPreferred == null) {
    t.userPreferred = t.english || t.romaji || t.native || 'Unknown title'
  }
  const c = m.coverImage
  if (c && typeof c === 'object' && c.extraLarge == null && c.large) {
    c.extraLarge = c.large
  }
  // Rebuild nextAiringEpisode from the raw scalars when the object is absent.
  const na = m.nextAiringEpisode
  const looksBare = na == null || typeof na === 'number'
  if (looksBare && (m.next_airing_episode != null || m.next_airing_at != null)) {
    const episode = Number(m.next_airing_episode)
    const airingAt = Number(m.next_airing_at)
    m.nextAiringEpisode = {
      episode: Number.isInteger(episode) && episode > 0 ? episode : null,
      airingAt: Number.isInteger(airingAt) && airingAt > 0 ? airingAt : null,
    }
  } else if (looksBare) {
    m.nextAiringEpisode = null
  }
  delete m.next_airing_episode
  delete m.next_airing_at
  // Unmappable nested selections come back as placeholder junk — collapse them
  // to the empty shapes consumers already handle. Flat rows carrying ids are
  // kept: hydrateMediaDetails rebuilds them into real nodes below.
  const hasFlatRecs = Array.isArray(m.recommendations) && m.recommendations.some((r) => r && Number.isInteger(r.id))
  const hasFlatRels = Array.isArray(m.relations) && m.relations.some((r) => r && Number.isInteger(r.id))
  if (Array.isArray(m.recommendations) && !hasFlatRecs) m.recommendations = { nodes: [] }
  if (Array.isArray(m.relations) && !hasFlatRels) m.relations = { edges: [] }
  if (!Array.isArray(m.streamingEpisodes)) m.streamingEpisodes = m.streamingEpisodes ?? []
  const recNodes = m.recommendations?.nodes
  if (Array.isArray(recNodes)) recNodes.forEach((n) => normalizeMedia(n?.mediaRecommendation))
  const relEdges = m.relations?.edges
  if (Array.isArray(relEdges)) relEdges.forEach((e) => normalizeMedia(e?.node))
  return m
}

function normalizeOfflinePayload(payload) {
  if (!IS_OFFLINE_API || !payload || typeof payload !== 'object' || !payload.data) return payload
  const data = payload.data
  const visitPage = (page) => {
    if (page && Array.isArray(page.media)) page.media.forEach(normalizeMedia)
  }
  for (const [key, value] of Object.entries(data)) {
    if (!value || typeof value !== 'object') continue
    if (/^m\d+$/.test(key)) normalizeMedia(value) // anilistBatchDetail aliases
    else if (key === 'Media') normalizeMedia(value)
    else if (Array.isArray(value.media)) value.media.forEach(normalizeMedia) // Page + aliased Pages
  }
  return payload
}

// Rebuild recommendations/relations nodes from the mirror's flat rows.
// Runs only when flat rows survived (offline mirror); official responses
// already carry real nodes and skip this entirely.
const HYDRATE_CARD_FIELDS = 'id title { romaji english userPreferred } coverImage { extraLarge large medium color } format episodes averageScore status genres isAdult'

async function hydrateMediaDetails(media) {
  if (!media || typeof media !== 'object') return media
  const flatRecs = (Array.isArray(media.recommendations) ? media.recommendations : [])
    .filter((r) => r && Number.isInteger(r.id) && r.id > 0)
    .slice(0, 12)
  const flatRels = (Array.isArray(media.relations) ? media.relations : [])
    .filter((r) => r && Number.isInteger(r.id) && r.id > 0)
  if (!flatRecs.length && !flatRels.length) return media
  const ids = [...new Set([...flatRecs.map((r) => r.id), ...flatRels.map((r) => r.id)])]
  const fields = ids.map((id, i) => `h${i}: Media(id: ${id}) { ${HYDRATE_CARD_FIELDS} }`).join('\n')
  const byId = new Map()
  try {
    const payload = await requestAniListEndpoint(JSON.stringify({ query: `{ ${fields} }`, variables: {} }))
    ids.forEach((id, i) => {
      const item = payload?.data?.[`h${i}`]
      if (item?.id) byId.set(id, normalizeMedia(item))
    })
  } catch (error) {
    console.warn('Recommendation hydration failed:', error?.message || error)
  }
  if (flatRecs.length) {
    const nodes = flatRecs
      .map((r) => (byId.has(r.id) ? { mediaRecommendation: byId.get(r.id), rating: r.rating ?? null } : null))
      .filter(Boolean)
    if (nodes.length) media.recommendations = { nodes }
    else media.recommendations = { nodes: [] }
  }
  if (flatRels.length) {
    const edges = flatRels
      .map((r) => (byId.has(r.id) ? { relationType: r.relationType || null, node: byId.get(r.id) } : null))
      .filter(Boolean)
    if (edges.length) media.relations = { edges }
    else media.relations = { edges: [] }
  }
  return media
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
  if (IS_OFFLINE_API) {
    // The offline mirror has no AiringSchedule root — use the media-based
    // calendar path with a next-7-days window instead.
    const nowSec = Math.floor(Date.now() / 1000)
    return getAnirakuCalendarWeek(safePage, safePerPage, { startAt: nowSec, endAt: nowSec + (7 * 24 * 60 * 60) })
  }
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

// Fetch multiple anime by ID in a single request.  AniList caps perPage at 50,
// but bookmark lists rarely exceed that.  Each ID produces its own alias so the
// response shape mirrors ANIME_DETAIL_QUERY per entry.
export async function anilistBatchDetail(ids) {
  const safeIds = (Array.isArray(ids) ? ids : []).filter((id) => Number.isInteger(id) && id > 0).slice(0, 50)
  if (!safeIds.length) return {}
  const variables = {}
  const fields = safeIds.map((id, i) => {
    variables[`id${i}`] = id
    return `m${i}: Media(id: $id${i}, type: ANIME) {
      id status episodes nextAiringEpisode { episode airingAt }
    }`
  })
  const query = `query (${safeIds.map((_, i) => `$id${i}: Int!`).join(', ')}) { ${fields.join('\n')} }`
  try {
    const json = await directAniListRequest(query, variables)
    reportAniListStatus(false)
    const result = {}
    safeIds.forEach((id, i) => {
      result[id] = json?.data?.[`m${i}`] || null
    })
    return result
  } catch (error) {
    console.warn('AniList batch detail failed:', error)
    return {}
  }
}
