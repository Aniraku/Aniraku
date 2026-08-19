/**
 * Returns a safe position to hand from a failed player to a refreshed source.
 * A tiny end cushion avoids treating a completed VOD as a recovery seek.
 */
export function getRecoveryResumePosition(currentTime, duration) {
  const position = Number(currentTime)
  if (!Number.isFinite(position) || position <= 1) return null

  const total = Number(duration)
  if (!Number.isFinite(total) || total <= 0) return position

  return Math.min(position, Math.max(0, total - 0.5))
}
