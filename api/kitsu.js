const KITSU_API_BASE = 'https://kitsu.io/api/edge'
const ANILIST_MAPPING_SITE = 'anilist/anime'
const DEFAULT_TTL_MS = 10 * 60_000
const DETAIL_TTL_MS = 24 * 60 * 60_000

const responseCache = new Map()
const inFlight = new Map()

class ResolverError extends Error {
  constructor(code, message, status = 502, retryAfter = null) {
    super(message)
    this.code = code
    this.status = status
    this.retryAfter = retryAfter
  }
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function positiveInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function safeImage(value) {
  try {
    const url = new URL(text(value))
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function cacheKey(prefix, value) {
  return `${prefix}:${JSON.stringify(value)}`
}

async function cached(key, ttlMs, loader) {
  const now = Date.now()
  const stored = responseCache.get(key)
  if (stored?.expiresAt > now) return stored.value
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

async function kitsuRequest(path) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)
  try {
    const response = await fetch(`${KITSU_API_BASE}${path}`, {
      headers: { Accept: 'application/vnd.api+json' },
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const retryAfter = Number(response.headers.get('retry-after')) || null
      throw new ResolverError(response.status === 429 ? 'KITSU_RATE_LIMITED' : 'KITSU_UNAVAILABLE', `Kitsu returned ${response.status}.`, response.status === 429 ? 429 : 502, retryAfter)
    }
    return payload
  } catch (error) {
    if (error instanceof ResolverError) throw error
    throw new ResolverError('KITSU_UNAVAILABLE', error instanceof Error && error.name === 'AbortError' ? 'Kitsu timed out.' : 'Kitsu metadata is unavailable.')
  } finally {
    clearTimeout(timeout)
  }
}

function imageSet(images = {}) {
  const large = safeImage(images.large) || safeImage(images.original) || safeImage(images.medium) || safeImage(images.small)
  const medium = safeImage(images.medium) || safeImage(images.small) || large
  return { extraLarge: large, large, medium, color: null }
}

function formatKitsu(value) {
  return ({ TV: 'TV', movie: 'MOVIE', OVA: 'OVA', ONA: 'ONA', special: 'SPECIAL', music: 'MUSIC' })[text(value)] || 'TV'
}

function statusKitsu(value) {
  return ({ current: 'RELEASING', finished: 'FINISHED', upcoming: 'NOT_YET_RELEASED', tba: 'NOT_YET_RELEASED', unreleased: 'NOT_YET_RELEASED' })[text(value).toLowerCase()] || 'FINISHED'
}

function mappingByKitsuAnime(animeRows = [], included = []) {
  const anilistByMappingId = new Map()
  for (const mapping of included) {
    if (mapping?.type !== 'mappings' || text(mapping?.attributes?.externalSite) !== ANILIST_MAPPING_SITE) continue
    const anilistId = positiveInteger(mapping?.attributes?.externalId)
    const mappingId = text(mapping?.id)
    if (anilistId && mappingId) anilistByMappingId.set(mappingId, anilistId)
  }
  const ids = new Map()
  for (const anime of animeRows) {
    const kitsuId = text(anime?.id)
    const mappingId = (anime?.relationships?.mappings?.data || [])
      .find((entry) => entry?.type === 'mappings' && anilistByMappingId.has(text(entry?.id)))?.id
    const anilistId = anilistByMappingId.get(text(mappingId))
    if (kitsuId && anilistId) ids.set(kitsuId, anilistId)
  }
  return ids
}

function toAniListMedia(anime, anilistId) {
  const attributes = anime?.attributes || {}
  const titles = attributes.titles || {}
  const title = text(attributes.canonicalTitle) || text(titles.en) || text(titles.en_jp) || text(titles.ja_jp) || 'Unknown Anime'
  const poster = imageSet(attributes.posterImage)
  const banner = imageSet(attributes.coverImage)
  const rating = Number(attributes.averageRating)
  const startYear = Number(String(attributes.startDate || '').slice(0, 4)) || null
  return {
    id: anilistId,
    idMal: null,
    title: {
      romaji: text(titles.en_jp) || text(titles.ja_jp) || title,
      english: text(titles.en) || title,
      native: text(titles.ja_jp) || text(titles.en_jp) || title,
      userPreferred: title,
    },
    coverImage: poster,
    // Kitsu provides a separate cover image, so Preview can use a fresh,
    // landscape banner instead of recycling the poster as a hero background.
    bannerImage: banner.extraLarge || null,
    description: text(attributes.synopsis) || text(attributes.description) || null,
    format: formatKitsu(attributes.subtype || attributes.showType),
    status: statusKitsu(attributes.status),
    episodes: positiveInteger(attributes.episodeCount),
    duration: positiveInteger(attributes.episodeLength),
    genres: [],
    averageScore: Number.isFinite(rating) ? Math.round(rating) : null,
    popularity: positiveInteger(attributes.userCount) || positiveInteger(attributes.favoritesCount),
    season: null,
    seasonYear: startYear,
    isAdult: attributes.nsfw === true,
    nextAiringEpisode: null,
    relations: { edges: [] },
    streamingEpisodes: [],
    artwork: { poster: poster.extraLarge || null, banner: banner.extraLarge || null, source: 'kitsu' },
  }
}

async function getMediaByAniListId(anilistId) {
  const path = `/mappings?filter%5BexternalSite%5D=${encodeURIComponent(ANILIST_MAPPING_SITE)}&filter%5BexternalId%5D=${anilistId}&include=item&page%5Blimit%5D=20`
  const payload = await cached(cacheKey('kitsu-detail', anilistId), DETAIL_TTL_MS, () => kitsuRequest(path))
  const mapping = (payload?.data || []).find((entry) => text(entry?.attributes?.externalSite) === ANILIST_MAPPING_SITE && Number(entry?.attributes?.externalId) === anilistId)
  const anime = (payload?.included || []).find((entry) => entry?.type === 'anime' && positiveInteger(entry?.id))
  if (!mapping || !anime) throw new ResolverError('KITSU_MAPPING_NOT_FOUND', 'Kitsu does not have a verified AniList mapping for this anime.', 404)
  return toAniListMedia(anime, anilistId)
}

async function browseKitsu(variables = {}) {
  const page = Math.max(1, Math.floor(Number(variables.page) || 1))
  const perPage = Math.min(50, Math.max(1, Math.floor(Number(variables.perPage) || 20)))
  const params = new URLSearchParams({
    include: 'mappings',
    'page[limit]': String(perPage),
    'page[offset]': String((page - 1) * perPage),
    sort: '-userCount',
  })
  const search = text(variables.search)
  if (search) params.set('filter[text]', search)
  const payload = await cached(cacheKey('kitsu-browse', { page, perPage, search }), DEFAULT_TTL_MS, () => kitsuRequest(`/anime?${params.toString()}`))
  const animeRows = Array.isArray(payload?.data) ? payload.data : []
  const idMap = mappingByKitsuAnime(animeRows, payload?.included || [])
  const media = animeRows
    .flatMap((anime) => {
      const anilistId = idMap.get(String(anime?.id))
      return anilistId ? [toAniListMedia(anime, anilistId)] : []
    })
  const total = Number(payload?.meta?.count) || media.length
  return { Page: { pageInfo: { total, lastPage: Math.max(1, Math.ceil(total / perPage)), hasNextPage: page * perPage < total, currentPage: page, perPage }, media } }
}

async function resolveGraphQL(query, variables = {}) {
  if (!text(query)) throw new ResolverError('INVALID_REQUEST', 'A metadata query is required.', 400)
  if (/Media\s*\(\s*id\s*:\s*\$id/.test(query)) return { Media: await getMediaByAniListId(positiveInteger(variables.id) || 0) }
  if (query.includes('trending: Page')) {
    const page = await browseKitsu({ page: 1, perPage: 20 })
    return { trending: page.Page, airing: page.Page, popular: page.Page, movies: page.Page, topRated: page.Page, topTV: page.Page }
  }
  return browseKitsu(variables)
}

function writeJSON(response, status, payload, cacheSeconds = 0) {
  response.status(status)
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', status === 200 && cacheSeconds > 0 ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}` : 'no-store')
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
    return writeJSON(response, 200, { data, source: 'kitsu', idContract: 'anilist' }, DEFAULT_TTL_MS)
  } catch (error) {
    const safe = error instanceof ResolverError ? error : new ResolverError('KITSU_RESOLVER_FAILED', 'Kitsu metadata resolution failed.')
    if (safe.retryAfter) response.setHeader('Retry-After', String(safe.retryAfter))
    return writeJSON(response, safe.status, { error: { code: safe.code, message: safe.message, retryAfter: safe.retryAfter } })
  }
}

export const __test__ = { imageSet, mappingByKitsuAnime, toAniListMedia, formatKitsu, statusKitsu }
