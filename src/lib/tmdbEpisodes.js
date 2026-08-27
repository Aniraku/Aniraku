const TMDB_BATCH_SIZE = 100

function positiveInteger(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function neutralEpisode(episode, index) {
  const number = positiveInteger(episode?.number) || index + 1
  return {
    ...episode,
    number,
    // Aniraku keeps authority for availability, filler/recap flags, and
    // playback identifiers. TMDB is the sole authority for episode display
    // metadata, so stale provider titles and thumbnails are never retained.
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
  return (Array.isArray(availability) ? availability : []).filter(Boolean).map((episode, index) => {
    const neutral = neutralEpisode(episode, index)
    const tmdb = byNumber.get(neutral.number)
    if (!tmdb) return neutral
    return {
      ...neutral,
      title: typeof tmdb.title === 'string' && tmdb.title.trim() ? tmdb.title.trim() : null,
      thumbnail: typeof tmdb.thumbnail === 'string' && tmdb.thumbnail.startsWith('https://image.tmdb.org/') ? tmdb.thumbnail : null,
      description: typeof tmdb.description === 'string' && tmdb.description.trim() ? tmdb.description.trim() : null,
    }
  })
}

export async function enrichEpisodesWithTmdb(anilistId, availability, { fetchImpl = fetch, signal, baseUrl = '' } = {}) {
  const id = positiveInteger(anilistId)
  const neutral = mergeTmdbEpisodeMetadata(availability, [])
  if (!id || !neutral.length) return neutral

  const metadata = []
  for (let offset = 0; offset < neutral.length; offset += TMDB_BATCH_SIZE) {
    const numbers = neutral.slice(offset, offset + TMDB_BATCH_SIZE).map((episode) => episode.number)
    const target = `${baseUrl}/api/tmdb-episodes?anilistId=${encodeURIComponent(id)}&episodes=${encodeURIComponent(numbers.join(','))}`
    try {
      const response = await fetchImpl(target, { headers: { Accept: 'application/json' }, signal })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || Number(payload?.anilistId) !== id || payload?.source !== 'tmdb') return neutral
      if (Array.isArray(payload.episodes)) metadata.push(...payload.episodes)
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      return neutral
    }
  }
  return mergeTmdbEpisodeMetadata(availability, metadata)
}
