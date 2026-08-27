const TMDB_BATCH_SIZE = 100

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

function isGenericEpisodeLabel(value) {
  return /^(?:(?:episode|ep)\s*)?\d+(?:\s*(?:[·.-]\s*\d+\s*[ps]))?$/i.test(text(value))
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

export function mergeTmdbEpisodeMetadata(availability, metadata) {
  const byNumber = new Map(
    (Array.isArray(metadata) ? metadata : [])
      .filter((entry) => positiveInteger(entry?.number))
      .map((entry) => [Number(entry.number), entry]),
  )
  return trustedAvailability(availability).map((episode, index) => {
    const neutral = neutralEpisode(episode, index)
    const tmdb = byNumber.get(neutral.number)
    if (!tmdb) return episode
    return {
      ...neutral,
      title: text(tmdb.title) || episode.title,
      thumbnail: hasVerifiedTmdbThumbnail(tmdb.thumbnail) ? text(tmdb.thumbnail) : episode.thumbnail,
      description: text(tmdb.description) || null,
    }
  })
}

export async function enrichEpisodesWithTmdb(anilistId, availability, { fetchImpl = fetch, signal, baseUrl = '' } = {}) {
  const id = positiveInteger(anilistId)
  const baseline = mergeTmdbEpisodeMetadata(availability, [])
  if (!id || !baseline.length) return baseline

  // Query TMDB only for display fields that the source payload cannot prove are
  // trustworthy. This retains One Piece's verified catalog and avoids a 100+
  // chunk resolver fan-out on every long-running title page.
  const unresolved = baseline.filter((episode) => !episode.title || !episode.thumbnail)
  if (!unresolved.length) return baseline

  const metadata = []
  for (let offset = 0; offset < unresolved.length; offset += TMDB_BATCH_SIZE) {
    const numbers = unresolved.slice(offset, offset + TMDB_BATCH_SIZE).map((episode) => episode.number)
    const target = `${baseUrl}/api/tmdb-episodes?anilistId=${encodeURIComponent(id)}&episodes=${encodeURIComponent(numbers.join(','))}`
    try {
      const response = await fetchImpl(target, { headers: { Accept: 'application/json' }, signal })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || Number(payload?.anilistId) !== id || payload?.source !== 'tmdb') return baseline
      if (Array.isArray(payload.episodes)) metadata.push(...payload.episodes)
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      return baseline
    }
  }
  return mergeTmdbEpisodeMetadata(availability, metadata)
}
