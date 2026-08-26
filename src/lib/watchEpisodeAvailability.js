export const UPCOMING_EPISODE_MESSAGE =
  'Time travel still has not been invented—sorry, we cannot stream an episode from the future. It will appear here the moment it is officially released.'

/**
 * Classify only episodes that are confirmed to be future releases. A missing
 * episode list is not enough evidence: transient metadata failures must retain
 * the normal resolver behavior rather than being misreported as unreleased.
 */
export function isConfirmedUpcomingEpisode({
  episodeNumber,
  episodes,
  status,
  nextAiringEpisode,
  hasConfirmedEpisodeList = false,
}) {
  const target = Number(episodeNumber)
  if (!Number.isInteger(target) || target < 1) return false

  const normalizedStatus = String(status || '').toUpperCase()
  const nextEpisode = Number(nextAiringEpisode?.episode)
  if (Number.isInteger(nextEpisode) && nextEpisode >= 1 && target >= nextEpisode) {
    return true
  }

  if (normalizedStatus === 'NOT_YET_RELEASED') return true
  if (normalizedStatus !== 'RELEASING' || !hasConfirmedEpisodeList) return false

  const latestReleased = (Array.isArray(episodes) ? episodes : []).reduce(
    (latest, episode) => Math.max(latest, Number(episode?.number) || 0),
    0
  )
  return latestReleased > 0 && target > latestReleased
}
