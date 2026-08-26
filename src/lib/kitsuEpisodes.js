const KITSU_BATCH_SIZE = 100

function positiveInteger(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function neutralEpisode(episode, index) {
  const number = positiveInteger(episode?.number) || index + 1
  return {
    ...episode,
    number,
    // Aniraku remains the availability authority, but Kitsu is the sole
    // authority for user-visible episode metadata. Never retain a stale or
    // foreign title/thumbnail while a Kitsu request is pending or unavailable.
    title: null,
    thumbnail: null,
    description: null,
  }
}

export function mergeKitsuEpisodeMetadata(availability, metadata) {
  const byNumber = new Map(
    (Array.isArray(metadata) ? metadata : [])
      .filter((entry) => positiveInteger(entry?.number))
      .map((entry) => [Number(entry.number), entry]),
  )
  return (Array.isArray(availability) ? availability : []).filter(Boolean).map((episode, index) => {
    const neutral = neutralEpisode(episode, index)
    const kitsu = byNumber.get(neutral.number)
    if (!kitsu) return neutral
    return {
      ...neutral,
      title: typeof kitsu.title === 'string' && kitsu.title.trim() ? kitsu.title.trim() : null,
      thumbnail: typeof kitsu.thumbnail === 'string' && kitsu.thumbnail.startsWith('https://') ? kitsu.thumbnail : null,
      description: typeof kitsu.description === 'string' && kitsu.description.trim() ? kitsu.description.trim() : null,
    }
  })
}

export async function enrichEpisodesWithKitsu(anilistId, availability, { fetchImpl = fetch, signal, baseUrl = '' } = {}) {
  const id = positiveInteger(anilistId)
  const neutral = mergeKitsuEpisodeMetadata(availability, [])
  if (!id || !neutral.length) return neutral

  const metadata = []
  for (let offset = 0; offset < neutral.length; offset += KITSU_BATCH_SIZE) {
    const numbers = neutral.slice(offset, offset + KITSU_BATCH_SIZE).map((episode) => episode.number)
    const target = `${baseUrl}/api/kitsu-episodes?anilistId=${encodeURIComponent(id)}&episodes=${encodeURIComponent(numbers.join(','))}`
    try {
      const response = await fetchImpl(target, { headers: { Accept: 'application/json' }, signal })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || Number(payload?.anilistId) !== id || payload?.source !== 'kitsu') return neutral
      if (Array.isArray(payload.episodes)) metadata.push(...payload.episodes)
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      return neutral
    }
  }
  return mergeKitsuEpisodeMetadata(availability, metadata)
}
