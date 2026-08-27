const TMDB_BATCH_SIZE = 100
const TMDB_BATCH_CONCURRENCY = 3

function positiveInteger(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function hasVerifiedTmdbThumbnail(value) {
  return /^https:\/\/image\.tmdb\.org\/t\/p\/(?:original|[wh]\d+)\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(text(value))
}

function hasSourceProvidedPoster(value) {
  return /^https:\/\/[^\s]+$/i.test(text(value))
}

function isGenericEpisodeLabel(value) {
  return /^(?:(?:episode|ep)\s*)?\d+(?:\s*(?:[·.-]\s*\d+\s*[ps]))?$/i.test(text(value))
}

function isPublishedEpisodeTitle(value) {
  const title = text(value)
  return Boolean(title)
    && !isGenericEpisodeLabel(title)
    && !/^(?:tba|tbd|untitled|unknown)$/i.test(title)
}

function trustedAvailability(availability) {
  const entries = Array.isArray(availability) ? availability.filter(Boolean) : []
  const titleCounts = new Map()
  entries.forEach((episode) => {
    const title = text(episode?.title)
    if (title) titleCounts.set(title, (titleCounts.get(title) || 0) + 1)
  })

  return entries.map((episode, index) => {
    const number = positiveInteger(episode?.number) || index + 1
    const title = text(episode?.title)
    const verifiedTitle = title && !isGenericEpisodeLabel(title) && titleCounts.get(title) === 1
    return {
      ...episode,
      number,
    // Aniraku remains authoritative for availability, filler/recap flags, and
    // playback IDs. Its title is retained only when it is one-to-one and
    // non-placeholder; a thumbnail also needs an exact TMDB image host/path.
      title: verifiedTitle ? title : null,
      thumbnail: verifiedTitle && hasVerifiedTmdbThumbnail(episode?.thumbnail) ? text(episode.thumbnail) : null,
      description: null,
    }
  })
}

function neutralEpisode(episode, index) {
  const number = positiveInteger(episode?.number) || index + 1
  return {
    ...episode,
    number,
    // Aniraku keeps authority for availability, filler/recap flags, and
    // playback identifiers. Untrusted source display metadata remains neutral
    // until an exact TMDB mapping provides a safe replacement.
    title: null,
    thumbnail: null,
    description: null,
  }
}

export function mergeTmdbEpisodeMetadata(availability, metadata, { fallbackThumbnail = '', fallbackTitle = '', isMovie = false, mappedNumbers = [] } = {}) {
  const verifiedFallbackThumbnail = hasSourceProvidedPoster(fallbackThumbnail) ? text(fallbackThumbnail) : null
  const normalizedFallbackTitle = text(fallbackTitle)
  const verifiedMovieFallbackTitle = isMovie && normalizedFallbackTitle && !isGenericEpisodeLabel(normalizedFallbackTitle)
    ? normalizedFallbackTitle
    : null
  const exactMappedNumbers = new Set((Array.isArray(mappedNumbers) ? mappedNumbers : [])
    .map(positiveInteger)
    .filter(Boolean))
  const entriesByNumber = new Map()
  ;(Array.isArray(metadata) ? metadata : [])
    .filter((entry) => positiveInteger(entry?.number) && isPublishedEpisodeTitle(entry?.title))
    .forEach((entry) => {
      const number = Number(entry.number)
      const entries = entriesByNumber.get(number) || []
      entries.push(entry)
      entriesByNumber.set(number, entries)
    })
  // A correctly formed resolver payload has one record for each canonical
  // source position. If a malformed response supplies several candidates, do
  // not choose one by order; treat it as unresolved and preserve safety.
  const byNumber = new Map([...entriesByNumber.entries()]
    .filter(([, entries]) => entries.length === 1)
    .map(([number, [entry]]) => [number, entry]))
  return trustedAvailability(availability).map((episode, index) => {
    const neutral = neutralEpisode(episode, index)
    const tmdb = byNumber.get(neutral.number)
    if (!tmdb) {
      const exactMappingHadNoRecord = exactMappedNumbers.has(neutral.number)
      return {
        ...(exactMappingHadNoRecord ? neutral : episode),
        // A one-row movie uses its already loaded, source-provided movie name
        // only when no exact TMDB movie mapping can supply a title. TV rows
        // remain neutral rather than borrowing a series title as episode data.
        title: exactMappingHadNoRecord ? verifiedMovieFallbackTitle : (episode.title || verifiedMovieFallbackTitle),
        thumbnail: exactMappingHadNoRecord ? verifiedFallbackThumbnail : (episode.thumbnail || verifiedFallbackThumbnail),
      }
    }
    return {
      ...neutral,
      title: text(tmdb.title) || episode.title,
      // Once exact TMDB metadata exists, do not retain a possibly copied
      // provider still from another related season. Use only its verified
      // still or the already authoritative title-level art fallback.
      thumbnail: hasVerifiedTmdbThumbnail(tmdb.thumbnail) ? text(tmdb.thumbnail) : verifiedFallbackThumbnail,
      description: text(tmdb.description) || null,
    }
  })
}

export async function enrichEpisodesWithTmdb(anilistId, availability, {
  fetchImpl = fetch,
  signal,
  baseUrl = '',
  fallbackThumbnail = '',
  fallbackTitle = '',
  isMovie = false,
} = {}) {
  const id = positiveInteger(anilistId)
  const fallback = { fallbackThumbnail, fallbackTitle, isMovie }
  const baseline = mergeTmdbEpisodeMetadata(availability, [], fallback)
  if (!id || !baseline.length) return baseline

  const metadata = []
  const mappedNumbers = []
  // All positions are checked, not merely visibly incomplete source rows. A
  // source can contain a unique but wrong label copied from a related season;
  // exact TMDB data is the authoritative display replacement when mapped.
  // Each request remains bounded by the server's 100-number contract, with no
  // fixed total-episode or fixed-season ceiling.
  const batches = []
  for (let offset = 0; offset < baseline.length; offset += TMDB_BATCH_SIZE) {
    batches.push(baseline.slice(offset, offset + TMDB_BATCH_SIZE).map((episode) => episode.number))
  }
  const requestBatch = async (numbers) => {
    const target = `${baseUrl}/api/tmdb-episodes?anilistId=${encodeURIComponent(id)}&episodes=${encodeURIComponent(numbers.join(','))}`
    try {
      const response = await fetchImpl(target, { headers: { Accept: 'application/json' }, signal })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || Number(payload?.anilistId) !== id || payload?.source !== 'tmdb') return null
      return payload
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      return null
    }
  }
  for (let offset = 0; offset < batches.length; offset += TMDB_BATCH_CONCURRENCY) {
    const payloads = await Promise.all(batches.slice(offset, offset + TMDB_BATCH_CONCURRENCY).map(requestBatch))
    if (payloads.some((payload) => !payload)) return baseline
    for (const payload of payloads) {
      if (Array.isArray(payload.episodes)) metadata.push(...payload.episodes)
      if (Array.isArray(payload.mapped)) mappedNumbers.push(...payload.mapped)
    }
  }
  return mergeTmdbEpisodeMetadata(availability, metadata, { ...fallback, mappedNumbers })
}
