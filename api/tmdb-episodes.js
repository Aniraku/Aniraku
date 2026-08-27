const TMDB_API_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780'
const ANIBRIDGE_MAPPINGS_API = 'https://mappings.anibridge.eliasbenb.dev/api/v3/mappings'
const MAX_EPISODE_NUMBERS = 100
const REQUEST_TIMEOUT_MS = 10_000
const MAPPING_TTL_MS = 24 * 60 * 60_000
const EPISODE_TTL_MS = 5 * 60_000

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

function parseEpisodeNumbers(value) {
  const raw = Array.isArray(value) ? value.join(',') : String(value || '')
  const numbers = [...new Set(raw.split(',').map((item) => positiveInteger(item)).filter(Boolean))].sort((left, right) => left - right)
  if (!numbers.length) throw new ResolverError('INVALID_EPISODES', 'Provide one or more positive episode numbers.', 400)
  if (numbers.length > MAX_EPISODE_NUMBERS) throw new ResolverError('TOO_MANY_EPISODES', `Request at most ${MAX_EPISODE_NUMBERS} episode numbers.`, 400)
  return numbers
}

function safeStillUrl(path) {
  const normalized = text(path)
  if (!/^\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(normalized)) return ''
  return `${TMDB_IMAGE_BASE}${normalized}`
}

function isPublishedTitle(value) {
  const title = text(value)
  return Boolean(title)
    && !/^episode\s+\d+$/i.test(title)
    && !/^(?:tba|tbd|untitled|unknown)$/i.test(title)
}

function parseRange(value) {
  const match = text(value).match(/^(\d+)(?:-(\d*)?)?$/)
  if (!match) return null
  const start = positiveInteger(match[1])
  const end = match[2] === undefined || match[2] === '' ? null : positiveInteger(match[2])
  if (!start || (end && end < start)) return null
  return { start, end }
}

function mapEpisodeNumber(rangeMap, anilistEpisode) {
  const number = positiveInteger(anilistEpisode)
  if (!number || !rangeMap || typeof rangeMap !== 'object') return null

  for (const [sourceRangeValue, targetRangeValue] of Object.entries(rangeMap)) {
    const sourceRange = parseRange(sourceRangeValue)
    if (!sourceRange || number < sourceRange.start || (sourceRange.end && number > sourceRange.end)) continue

    const [targetRangesValue, ratioValue] = text(targetRangeValue).split('|')
    // One AniList episode may map to many TMDB episodes (or vice versa). A
    // single display title would be ambiguous, so return neutral metadata.
    if (ratioValue && Number(ratioValue) !== 1) return null

    let offset = number - sourceRange.start
    const targetRanges = text(targetRangesValue).split(',').map(parseRange).filter(Boolean)
    for (const targetRange of targetRanges) {
      const length = targetRange.end ? targetRange.end - targetRange.start + 1 : Infinity
      if (offset < length) return targetRange.start + offset
      offset -= length
    }
    return null
  }
  return null
}

function extractMappingSource(payload, anilistId) {
  const source = payload?.data?.[`anilist:${anilistId}`]
  if (!source || typeof source !== 'object') {
    throw new ResolverError('TMDB_MAPPING_NOT_FOUND', 'No verified AniList-to-TMDB mapping exists for this anime.', 404)
  }
  return source
}

function extractTmdbShowMappings(payload, anilistId) {
  const source = extractMappingSource(payload, anilistId)

  const matches = Object.entries(source)
    .map(([descriptor, ranges]) => {
      const match = descriptor.match(/^tmdb_show:(\d+):s(\d+)$/)
      return match && ranges && typeof ranges === 'object'
        ? { type: 'tv', showId: Number(match[1]), seasonNumber: Number(match[2]), ranges }
        : null
    })
    .filter(Boolean)

  return matches
}

function extractTmdbMovieMappings(payload, anilistId) {
  const source = extractMappingSource(payload, anilistId)
  const matches = Object.entries(source)
    .map(([descriptor, ranges]) => {
      const match = descriptor.match(/^tmdb_movie:(\d+)$/)
      return match && ranges && typeof ranges === 'object'
        ? { type: 'movie', movieId: Number(match[1]), ranges }
        : null
    })
    .filter(Boolean)
  return matches
}

function selectTmdbMappingForEpisode(mappings, anilistEpisode) {
  const candidates = (Array.isArray(mappings) ? mappings : [])
    .map((mapping) => ({ ...mapping, tmdbNumber: mapEpisodeNumber(mapping?.ranges, anilistEpisode) }))
    .filter((candidate) => candidate.tmdbNumber)
  // Multiple season rules may exist for one anime (for example long-running
  // series). They are valid when only one covers the requested position. If
  // two rules cover that position, withhold metadata rather than guessing.
  return candidates.length === 1 ? candidates[0] : null
}

async function requestJson(url, options, unavailableCode, unavailableMessage) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const retryAfter = Number(response.headers.get('retry-after')) || null
      const code = response.status === 429 ? 'TMDB_RATE_LIMITED' : unavailableCode
      throw new ResolverError(code, response.status === 429 ? 'TMDB is busy. Please try again shortly.' : unavailableMessage, response.status === 429 ? 429 : 502, retryAfter)
    }
    return payload
  } catch (error) {
    if (error instanceof ResolverError) throw error
    const timedOut = error instanceof Error && error.name === 'AbortError'
    throw new ResolverError(unavailableCode, timedOut ? `${unavailableMessage} Request timed out.` : unavailableMessage)
  } finally {
    clearTimeout(timeout)
  }
}

async function getMapping(anilistId) {
  const url = `${ANIBRIDGE_MAPPINGS_API}?provider=anilist&id=${encodeURIComponent(anilistId)}&limit=20`
  return cached(cacheKey('anibridge-mapping', anilistId), MAPPING_TTL_MS, () => requestJson(
    url,
    { headers: { Accept: 'application/json' } },
    'MAPPING_UNAVAILABLE',
    'The verified episode mapping service is unavailable.',
  ))
}

async function getTmdbSeason(showId, seasonNumber) {
  const token = text(process.env.TMDB_READ_ACCESS_TOKEN)
  if (!token) throw new ResolverError('TMDB_NOT_CONFIGURED', 'TMDB episode metadata is not configured for this preview.', 503)
  const url = `${TMDB_API_BASE}/tv/${encodeURIComponent(showId)}/season/${encodeURIComponent(seasonNumber)}?language=en-US`
  return cached(cacheKey('tmdb-season', { showId, seasonNumber }), EPISODE_TTL_MS, () => requestJson(
    url,
    { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } },
    'TMDB_UNAVAILABLE',
    'TMDB episode metadata is unavailable.',
  ))
}

async function getTmdbMovie(movieId) {
  const token = text(process.env.TMDB_READ_ACCESS_TOKEN)
  if (!token) throw new ResolverError('TMDB_NOT_CONFIGURED', 'TMDB episode metadata is not configured for this preview.', 503)
  const url = `${TMDB_API_BASE}/movie/${encodeURIComponent(movieId)}?language=en-US`
  return cached(cacheKey('tmdb-movie', movieId), EPISODE_TTL_MS, () => requestJson(
    url,
    { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } },
    'TMDB_UNAVAILABLE',
    'TMDB episode metadata is unavailable.',
  ))
}

function toTmdbEpisodeMetadata(entry, anilistNumber, tmdbNumber) {
  if (Number(entry?.episode_number) !== tmdbNumber || !isPublishedTitle(entry?.name)) return null
  return {
    number: anilistNumber,
    title: text(entry.name),
    thumbnail: safeStillUrl(entry.still_path) || null,
    description: text(entry.overview) || null,
    airdate: text(entry.air_date) || null,
  }
}

function toTmdbMovieMetadata(entry, anilistNumber, tmdbNumber) {
  // A movie is represented by its one canonical episode position. Any mapping
  // to another position is intentionally withheld rather than fabricated.
  if (tmdbNumber !== 1 || !isPublishedTitle(entry?.title)) return null
  return {
    number: anilistNumber,
    title: text(entry.title),
    thumbnail: safeStillUrl(entry.backdrop_path) || null,
    description: text(entry.overview) || null,
    airdate: text(entry.release_date) || null,
  }
}

async function resolveEpisodes(anilistId, episodeNumbers) {
  const mappingPayload = await getMapping(anilistId)
  const mappings = [
    ...extractTmdbShowMappings(mappingPayload, anilistId),
    ...extractTmdbMovieMappings(mappingPayload, anilistId),
  ]
  if (!mappings.length) {
    throw new ResolverError('TMDB_MEDIA_MAPPING_NOT_FOUND', 'No verified TMDB television or movie mapping exists for this anime.', 404)
  }
  const requestedMappings = new Map(episodeNumbers.map((number) => [number, selectTmdbMappingForEpisode(mappings, number)]))
  const activeMappings = [...new Map(
    [...requestedMappings.values()]
      .filter(Boolean)
      .map((mapping) => [mapping.type === 'tv'
        ? `tv:${mapping.showId}:${mapping.seasonNumber}`
        : `movie:${mapping.movieId}`, mapping]),
  ).values()]
  if (!activeMappings.length) {
    return { anilistId, source: 'tmdb', cacheSeconds: Math.floor(EPISODE_TTL_MS / 1000), episodes: [], missing: episodeNumbers }
  }

  const tmdbMetadata = new Map()
  for (const mapping of activeMappings) {
    if (mapping.type === 'movie') {
      tmdbMetadata.set(`movie:${mapping.movieId}:1`, await getTmdbMovie(mapping.movieId))
      continue
    }
    const season = await getTmdbSeason(mapping.showId, mapping.seasonNumber)
    if (Number(season?.season_number) !== mapping.seasonNumber) {
      throw new ResolverError('TMDB_SEASON_MISMATCH', 'TMDB returned an unexpected season for the verified mapping.', 502)
    }
    for (const entry of Array.isArray(season?.episodes) ? season.episodes : []) {
      tmdbMetadata.set(`tv:${mapping.showId}:${mapping.seasonNumber}:${Number(entry?.episode_number)}`, entry)
    }
  }
  const episodes = episodeNumbers
    .map((number) => {
      const mapping = requestedMappings.get(number)
      if (!mapping) return null
      return mapping.type === 'movie'
        ? toTmdbMovieMetadata(tmdbMetadata.get(`movie:${mapping.movieId}:1`), number, mapping.tmdbNumber)
        : toTmdbEpisodeMetadata(tmdbMetadata.get(`tv:${mapping.showId}:${mapping.seasonNumber}:${mapping.tmdbNumber}`), number, mapping.tmdbNumber)
    })
    .filter(Boolean)
  const found = new Set(episodes.map((episode) => episode.number))

  return {
    anilistId,
    source: 'tmdb',
    mapping: {
      provider: 'anibridge',
      segments: activeMappings.map((mapping) => (mapping.type === 'movie'
        ? { type: 'movie', movieId: mapping.movieId }
        : { type: 'tv', showId: mapping.showId, seasonNumber: mapping.seasonNumber })),
    },
    cacheSeconds: Math.floor(EPISODE_TTL_MS / 1000),
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
    const safe = error instanceof ResolverError ? error : new ResolverError('TMDB_RESOLVER_FAILED', 'TMDB episode metadata resolution failed.')
    if (safe.retryAfter) response.setHeader('Retry-After', String(safe.retryAfter))
    return writeJSON(response, safe.status, { error: { code: safe.code, message: safe.message, retryAfter: safe.retryAfter } })
  }
}

export const __test__ = { extractTmdbMovieMappings, extractTmdbShowMappings, isPublishedTitle, mapEpisodeNumber, parseEpisodeNumbers, safeStillUrl, selectTmdbMappingForEpisode, toTmdbEpisodeMetadata, toTmdbMovieMetadata }
