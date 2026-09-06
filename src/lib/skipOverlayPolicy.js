/**
 * The manual prompt is deliberately separate from segment detection. When
 * automatic skipping is active, detection alone must not expose a manual
 * control; a prompt is only a fallback if the automatic seek cannot start.
 */
export function isSkipPromptWindow(segment, currentTime) {
  const start = Number(segment?.start)
  const end = Number(segment?.end)
  const time = Number(currentTime)
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    Number.isFinite(time) &&
    time >= start - 2 &&
    time < end - 0.5
  )
}

export function shouldShowManualSkipOverlay({
  segment,
  currentTime,
  autoSkip,
  autoSkipFailed,
  autoSkipHandled,
}) {
  if (!isSkipPromptWindow(segment, currentTime)) return false
  // While auto-skip is armed the prompt stays hidden ONLY until the automatic
  // seek has actually happened for this pass. If the viewer seeks back into
  // the segment afterwards (autoSkippedRef stays true), the manual button
  // must come back — otherwise both skip paths are dead inside the window.
  if (autoSkipHandled === true) return true
  return !autoSkip || autoSkipFailed === true
}

export function getSkipTarget(segment, duration) {
  const end = Number(segment?.end)
  if (!Number.isFinite(end) || end <= 0) return null

  const mediaDuration = Number(duration)
  const target = Math.min(
    end,
    Math.max(0, mediaDuration > 0 && Number.isFinite(mediaDuration) ? mediaDuration - 0.5 : end)
  )
  return Number.isFinite(target) ? target : null
}

/**
 * Seek to a verified segment end and explicitly report whether the media
 * element accepted the target. A failed automatic seek keeps the manual
 * fallback available instead of silently hiding both paths.
 */
export function attemptSkipSegment(video, segment) {
  if (!video) return false
  const target = getSkipTarget(segment, video.duration)
  if (target === null) return false

  try {
    video.currentTime = target
    const appliedTime = Number(video.currentTime)
    return Number.isFinite(appliedTime) && Math.abs(appliedTime - target) < 1
  } catch {
    return false
  }
}
