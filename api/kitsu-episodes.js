const KITSU_API_BASE = 'https://kitsu.io/api/edge'
const KITSU_MAPPING_SITE = 'anilist/anime'
const MAX_EPISODES_PER_REQUEST = 100
const KITSU_QUERY_CHUNK_SIZE = 20
const AIRING_TTL_MS = 5 * 60_000
const CATALOG_TTL_MS = 7 * 24 * 60 * 60_000

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
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function parseEpisodeNumbers(value) {
  const raw = Array.isArray(value) ? value.join(',') : text(value)
  const numbers = [...new Set(raw.split(',').map((item) => positiveInteger(item.trim())).filter(Boolean))]
    .sort((left, right) => left - right)
  if (!numbers.length) throw new ResolverError('INVALID_EPISODES', 'Provide one or more positive episode numbers.', 400)
  if (numbers.length > MAX_EPISODES_PER_REQUEST) {
    throw new ResolverError('TOO_MANY_EPISODES', `Request at most ${MAX_EPISODES_PER_REQUEST} episode numbers at once.`, 400)
  }
  return numbers
}

function safeImage(value) {
  try {
    const image = new URL(text(value))
    return image.protocol === 'https:' ? image.toString() : ''
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
      const code = response.status === 429 ? 'KITSU_RATE_LIMITED' : 'KITSU_UNAVAILABLE'
      throw new ResolverError(code, `Kitsu returned ${response.status}.`, response.status === 429 ? 429 : 502, retryAfter)
    }
    return payload
  } catch (error) {
    if (error instanceof ResolverError) throw error
    const timedOut = error instanceof Error && error.name === 'AbortError'
    throw new ResolverError('KITSU_UNAVAILABLE', timedOut ? 'Kitsu timed out.' : 'Kitsu episode metadata is unavailable.')
  } finally {
    clearTimeout(timeout)
  }
}

function extractMappedAnime(payload, anilistId) {
  const mappings = Array.isArray(payload?.data) ? payload.data : []
  const mapping = mappings.find((entry) => (
    text(entry?.attributes?.externalSite) === KITSU_MAPPING_SITE
    && Number(entry?.attributes?.externalId) === anilistId
  ))
  const anime = (Array.isArray(payload?.included) ? payload.included : [])
    .find((entry) => entry?.type === 'anime' && positiveInteger(entry?.id))
  if (!mapping || !anime) {
    throw new ResolverError('KITSU_MAPPING_NOT_FOUND', 'Kitsu does not have a verified AniList mapping for this anime.', 404)
  }
  return anime
}

function toKitsuEpisodeMetadata(entry, requestedNumbers) {
  const attributes = entry?.attributes || {}
  const number = positiveInteger(attributes.number)
  if (!number || !requestedNumbers.has(number)) return null
  const titles = attributes.titles || {}
  const title = text(attributes.canonicalTitle) || text(titles.en) || text(titles.en_jp) || text(titles.ja_jp)
  const thumbnail = safeImage(attributes.thumbnail?.medium)
    || safeImage(attributes.thumbnail?.large)
    || safeImage(attributes.thumbnail?.original)
  return {
    number,
    title: title || null,
    thumbnail: thumbnail || null,
    description: text(attributes.synopsis) || text(attributes.description) || null,
    airdate: text(attributes.airdate) || null,
  }
}

async function resolveEpisodes(anilistId, episodeNumbers) {
  const mappingPath = `/mappings?filter%5BexternalSite%5D=${encodeURIComponent(KITSU_MAPPING_SITE)}&filter%5BexternalId%5D=${anilistId}&include=item&page%5Blimit%5D=20`
  const mappingPayload = await cached(cacheKey('kitsu-mapping', anilistId), CATALOG_TTL_MS, () => kitsuRequest(mappingPath))
  const anime = extractMappedAnime(mappingPayload, anilistId)
  const kitsuId = positiveInteger(anime.id)
  const status = text(anime?.attributes?.status).toLowerCase()
  const ttlMs = status === 'current' ? AIRING_TTL_MS : CATALOG_TTL_MS
  const requested = new Set(episodeNumbers)
  const rows = []
  for (let offset = 0; offset < episodeNumbers.length; offset += KITSU_QUERY_CHUNK_SIZE) {
    const numbers = episodeNumbers.slice(offset, offset + KITSU_QUERY_CHUNK_SIZE)
    const episodePath = `/anime/${kitsuId}/episodes?filter%5Bnumber%5D=${encodeURIComponent(numbers.join(','))}&page%5Blimit%5D=${KITSU_QUERY_CHUNK_SIZE}`
    const payload = await cached(cacheKey('kitsu-episodes', { kitsuId, numbers }), ttlMs, () => kitsuRequest(episodePath))
    rows.push(...(Array.isArray(payload?.data) ? payload.data : []))
  }
  const episodes = rows
    .map((entry) => toKitsuEpisodeMetadata(entry, requested))
    .filter(Boolean)
    .sort((left, right) => left.number - right.number)
  const found = new Set(episodes.map((episode) => episode.number))
  return {
    anilistId,
    source: 'kitsu',
    cacheSeconds: Math.floor(ttlMs / 1000),
    episodes,
    missing: episodeNumbers.filter((number) => !found.has(number)),
  }
}

function writeJSON(response, status, payload, cacheSeconds = 0) {
  response.status(status)
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', status === 200 && cacheSeconds > 0
    ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`
    : 'no-store')
  response.json(payload)
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return writeJSON(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET.' } })
  }
  try {
    const anilistId = positiveInteger(request.query?.anilistId)
    if (!anilistId) throw new ResolverError('INVALID_ANILIST_ID', 'Provide a positive AniList ID.', 400)
    const episodes = parseEpisodeNumbers(request.query?.episodes)
    const result = await resolveEpisodes(anilistId, episodes)
    return writeJSON(response, 200, result, result.cacheSeconds)
  } catch (error) {
    const safe = error instanceof ResolverError ? error : new ResolverError('KITSU_RESOLVER_FAILED', 'Kitsu episode metadata resolution failed.')
    if (safe.retryAfter) response.setHeader('Retry-After', String(safe.retryAfter))
    return writeJSON(response, safe.status, { error: { code: safe.code, message: safe.message, retryAfter: safe.retryAfter } })
  }
}

export const __test__ = { extractMappedAnime, parseEpisodeNumbers, safeImage, toKitsuEpisodeMetadata }
