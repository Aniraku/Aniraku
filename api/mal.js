const MAL_API_BASE = 'https://api.myanimelist.net/v2'
const ANILIST_API = 'https://graphql.anilist.co'
const MAL_SAFE_REQUESTS_PER_MINUTE = 50
const MAL_MIN_INTERVAL_MS = 1_200
const DEFAULT_TTL_MS = 5 * 60_000

const responseCache = new Map()
const inFlight = new Map()
const malRequestTimes = []
let lastMalRequestAt = 0

class ResolverError extends Error {
  constructor(code, message, status = 502, retryAfter = null) {
    super(message)
    this.code = code
    this.status = status
    this.retryAfter = retryAfter
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function text(value) {
  return String(value || '').trim()
}

function cacheKey(prefix, value) {
  return `${prefix}:${JSON.stringify(value)}`
}

async function cached(key, ttlMs, loader) {
  const now = Date.now()
  const stored = responseCache.get(key)
  if (stored && stored.expiresAt > now) return stored.value
  if (stored) responseCache.delete(key)
  if (inFlight.has(key)) return inFlight.get(key)

  const request = Promise.resolve()
    .then(loader)
    .then((value) => {
      responseCache.set(key, { value, expiresAt: Date.now() + ttlMs })
      return value
    })
    .finally(() => inFlight.delete(key))
  inFlight.set(key, request)
  return request
}

async function reserveMalRequest() {
  const now = Date.now()
  while (malRequestTimes.length && now - malRequestTimes[0] >= 60_000) malRequestTimes.shift()
  if (malRequestTimes.length >= MAL_SAFE_REQUESTS_PER_MINUTE) {
    const retryAfter = Math.max(1, Math.ceil((60_000 - (now - malRequestTimes[0])) / 1000))
    throw new ResolverError('MAL_RATE_LIMITED', 'MyAnimeList is busy. Please try again shortly.', 429, retryAfter)
  }
  const waitMs = Math.max(0, lastMalRequestAt + MAL_MIN_INTERVAL_MS - now)
  if (waitMs) await delay(waitMs)
  lastMalRequestAt = Date.now()
  malRequestTimes.push(lastMalRequestAt)
}

async function malRequest(path, ttlMs = DEFAULT_TTL_MS) {
  const clientId = text(process.env.MAL_CLIENT_ID)
  if (!clientId) throw new ResolverError('MAL_NOT_CONFIGURED', 'MyAnimeList metadata is not configured for this preview.', 503)
  return cached(cacheKey('mal', path), ttlMs, async () => {
    await reserveMalRequest()
    const response = await fetch(`${MAL_API_BASE}${path}`, {
      headers: { Accept: 'application/json', 'X-MAL-CLIENT-ID': clientId },
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const retryAfter = Number(response.headers.get('retry-after')) || null
      const status = response.status === 429 ? 429 : 502
      throw new ResolverError(response.status === 429 ? 'MAL_RATE_LIMITED' : 'MAL_UNAVAILABLE', payload?.message || `MyAnimeList returned ${response.status}.`, status, retryAfter)
    }
    return payload
  })
}

async function aniListRequest(query, variables, ttlMs = 10 * 60_000) {
  return cached(cacheKey('anilist', { query, variables }), ttlMs, async () => {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
    const payload = await response.json().catch(() => ({}))
    const message = payload?.errors?.[0]?.message || `AniList returned ${response.status}.`
    if (!response.ok || payload?.errors?.length) throw new ResolverError('ANILIST_MAPPING_UNAVAILABLE', message, 502)
    return payload.data
  })
}

async function mapMalIdsToAniList(malIds) {
  const ids = [...new Set(malIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 50)
  if (!ids.length) return new Map()
  const data = await aniListRequest(
    'query ($ids: [Int]) { Page(perPage: 50) { media(idMal_in: $ids, type: ANIME) { id idMal } } }',
    { ids },
    24 * 60 * 60_000,
  )
  return new Map((data?.Page?.media || []).filter((item) => item?.id && item?.idMal).map((item) => [item.idMal, item.id]))
}

async function getMalIdForAniListId(anilistId) {
  const data = await aniListRequest(
    'query ($id: Int) { Media(id: $id, type: ANIME) { id idMal } }',
    { id: Number(anilistId) },
    24 * 60 * 60_000,
  )
  const malId = Number(data?.Media?.idMal)
  if (!Number.isInteger(malId) || malId <= 0) throw new ResolverError('MAL_MAPPING_NOT_FOUND', 'This title does not have a verified MyAnimeList mapping.', 404)
  return malId
}

function malStatus(status) {
  return ({ currently_airing: 'RELEASING', finished_airing: 'FINISHED', not_yet_aired: 'NOT_YET_RELEASED' })[status] || 'FINISHED'
}

function malFormat(type) {
  return ({ tv: 'TV', movie: 'MOVIE', ova: 'OVA', ona: 'ONA', special: 'SPECIAL', tv_special: 'TV_SPECIAL', music: 'MUSIC' })[type] || 'TV'
}

function toAniListMedia(node, anilistId) {
  const malId = Number(node?.id)
  const mean = Number(node?.mean)
  const title = text(node?.title) || 'Unknown Anime'
  const large = node?.main_picture?.large || node?.main_picture?.medium || ''
  return {
    id: anilistId,
    idMal: malId,
    title: {
      romaji: text(node?.alternative_titles?.ja) || title,
      english: text(node?.alternative_titles?.en) || title,
      native: text(node?.alternative_titles?.ja) || title,
      userPreferred: title,
    },
    coverImage: { extraLarge: large, large, medium: node?.main_picture?.medium || large, color: null },
    bannerImage: node?.pictures?.[0]?.large || null,
    description: text(node?.synopsis),
    format: malFormat(node?.media_type),
    status: malStatus(node?.status),
    episodes: Number(node?.num_episodes) || null,
    duration: Number(node?.average_episode_duration) ? Math.round(Number(node.average_episode_duration) / 60) : null,
    genres: Array.isArray(node?.genres) ? node.genres.map((genre) => text(genre?.name)).filter(Boolean) : [],
    averageScore: Number.isFinite(mean) ? Math.round(mean * 10) : null,
    popularity: Number(node?.num_list_users) || Number(node?.popularity) || null,
    season: text(node?.start_season?.season).toUpperCase() || null,
    seasonYear: Number(node?.start_season?.year) || null,
    isAdult: String(node?.rating || '').toLowerCase() === 'rx',
    nextAiringEpisode: null,
    relations: { edges: [] },
    streamingEpisodes: [],
  }
}

async function normalizeMalNodes(nodes) {
  const mapping = await mapMalIdsToAniList(nodes.map((node) => node?.id))
  return nodes
    .map((node) => {
      const anilistId = mapping.get(Number(node?.id))
      return anilistId ? toAniListMedia(node, anilistId) : null
    })
    .filter(Boolean)
}

async function getMediaByAniListId(anilistId) {
  const malId = await getMalIdForAniListId(anilistId)
  const fields = 'alternative_titles,start_date,synopsis,mean,rank,popularity,num_list_users,nsfw,media_type,status,num_episodes,start_season,average_episode_duration,rating,pictures,genres'
  const node = await malRequest(`/anime/${malId}?fields=${encodeURIComponent(fields)}`, 15 * 60_000)
  return toAniListMedia(node, Number(anilistId))
}

function pageInfo(page, perPage, total) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePerPage = Math.max(1, Number(perPage) || 20)
  return { total, lastPage: Math.max(1, Math.ceil(total / safePerPage)), hasNextPage: total > safePage * safePerPage, currentPage: safePage, perPage: safePerPage }
}

async function browseMal(variables = {}) {
  const page = Math.max(1, Number(variables.page) || 1)
  const perPage = Math.min(50, Math.max(1, Number(variables.perPage) || 20))
  const limit = variables.format ? Math.min(50, perPage * 2) : perPage
  const offset = (page - 1) * limit
  const fields = 'alternative_titles,mean,popularity,num_list_users,media_type,status,num_episodes,start_season,genres,rating'
  let path
  if (text(variables.search)) {
    path = `/anime?q=${encodeURIComponent(text(variables.search))}&limit=${limit}&offset=${offset}&fields=${encodeURIComponent(fields)}`
  } else {
    const sort = Array.isArray(variables.sort) ? variables.sort.join(',') : text(variables.sort)
    const rankingType = variables.status === 'RELEASING' || /TRENDING|AIRING/.test(sort) ? 'airing' : /POPULARITY/.test(sort) ? 'bypopularity' : 'all'
    path = `/anime/ranking?ranking_type=${rankingType}&limit=${limit}&offset=${offset}&fields=${encodeURIComponent(fields)}`
  }
  const payload = await malRequest(path)
  let nodes = (payload?.data || []).map((item) => item?.node).filter(Boolean)
  if (variables.format) nodes = nodes.filter((node) => malFormat(node?.media_type) === variables.format)
  const media = await normalizeMalNodes(nodes.slice(0, perPage))
  if (nodes.length && !media.length) {
    throw new ResolverError('ANILIST_MAPPING_UNAVAILABLE', 'MyAnimeList results could not be mapped to verified AniList IDs yet.', 502)
  }
  return { Page: { pageInfo: pageInfo(page, perPage, Number(payload?.paging?.next ? offset + perPage + 1 : offset + media.length)), media } }
}

async function homeShelves(query) {
  const shelf = async (variables) => browseMal({ page: 1, perPage: 20, ...variables })
  const [trending, airing, popular, movies, topTV] = await Promise.all([
    shelf({ sort: ['TRENDING_DESC'] }),
    shelf({ status: 'RELEASING', sort: ['POPULARITY_DESC'] }),
    shelf({ sort: ['POPULARITY_DESC'] }),
    shelf({ format: 'MOVIE', sort: ['SCORE_DESC'] }),
    shelf({ format: 'TV', sort: ['SCORE_DESC'] }),
  ])
  if (query.includes('topTV:')) return { trending: trending.Page, airing: airing.Page, movies: movies.Page, topTV: topTV.Page }
  return { trending: trending.Page, airing: airing.Page, popular: popular.Page, movies: movies.Page, topRated: topTV.Page }
}

async function resolveGraphQL(query, variables = {}) {
  if (!text(query)) throw new ResolverError('INVALID_REQUEST', 'A metadata query is required.', 400)
  if (/Media\s*\(\s*id\s*:\s*\$id/.test(query)) return { Media: await getMediaByAniListId(variables.id) }
  if (query.includes('trending: Page')) return homeShelves(query)
  if (query.includes('airingSchedule') || query.includes('relations') || query.includes('recommendation')) {
    throw new ResolverError('MAL_UNSUPPORTED_OPERATION', 'This metadata shape is not available from MyAnimeList.', 501)
  }
  return browseMal(variables)
}

function writeJSON(response, status, payload) {
  response.status(status)
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', status === 200 ? 'public, s-maxage=300, stale-while-revalidate=600' : 'no-store')
  response.json(payload)
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return writeJSON(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } })
  }
  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body || {}
    const data = await resolveGraphQL(body.query, body.variables || {})
    return writeJSON(response, 200, { data, source: 'myanimelist', idContract: 'anilist' })
  } catch (error) {
    const safe = error instanceof ResolverError ? error : new ResolverError('MAL_RESOLVER_FAILED', 'Metadata resolver failed.', 502)
    if (safe.retryAfter) response.setHeader('Retry-After', String(safe.retryAfter))
    return writeJSON(response, safe.status, { error: { code: safe.code, message: safe.message, retryAfter: safe.retryAfter } })
  }
}

export const __test__ = { ResolverError, malFormat, malStatus, toAniListMedia, pageInfo, resolveGraphQL }
