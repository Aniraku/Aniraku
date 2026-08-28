// Keep this as an explicit full-range policy for callers that need to project
// browser-reported media ranges onto the timeline. The browser/MediaSource may
// still evict ranges under memory pressure, but the player does not impose a
// short artificial cache window.
export const PLAYBACK_CACHE_SECONDS = Number.POSITIVE_INFINITY
export const MIN_PLAYABLE_BUFFER_SECONDS = 0.5

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

/**
 * Convert browser-reported buffered ranges into timeline percentages. With
 * the default infinite window, every valid buffered range is shown; callers can
 * still pass a finite cacheSeconds value when a bounded view is explicitly
 * desired.
 */
export function getBufferedTimelineSegments(
  ranges = [],
  { currentTime = 0, duration = 0, cacheSeconds = PLAYBACK_CACHE_SECONDS } = {}
) {
  const total = finite(duration)
  if (total <= 0) return []

  const current = Math.min(total, Math.max(0, finite(currentTime)))
  const limit = Math.max(1, finite(cacheSeconds, PLAYBACK_CACHE_SECONDS))
  const windowStart = Math.max(0, current - limit)
  const windowEnd = Math.min(total, current + limit)

  return ranges
    .map((range) => ({ start: finite(range?.start), end: finite(range?.end) }))
    .filter((range) => range.end > range.start)
    .map((range) => ({
      start: Math.max(windowStart, range.start),
      end: Math.min(windowEnd, range.end),
    }))
    .filter((range) => range.end > range.start)
    .map((range) => ({
      leftPercent: (range.start / total) * 100,
      widthPercent: ((range.end - range.start) / total) * 100,
    }))
}

/**
 * A downloaded TimeRanges entry is not sufficient proof that a stalled video
 * can resume. Only show the cache layer while the media element reports
 * future decodable data at the current position, while retaining every
 * browser-reported range instead of clipping it to a short cache window.
 */
export function getPlayableBufferedTimelineSegments(
  ranges = [],
  { currentTime = 0, duration = 0, readyState = 0, cacheSeconds = PLAYBACK_CACHE_SECONDS } = {}
) {
  if (finite(readyState) < 3) return []
  const current = finite(currentTime)
  const hasForwardPlayableRange = (Array.isArray(ranges) ? ranges : []).some((range) => {
    const start = finite(range?.start)
    const end = finite(range?.end)
    return start <= current + 0.1 && end - current >= MIN_PLAYABLE_BUFFER_SECONDS
  })
  if (!hasForwardPlayableRange) return []
  return getBufferedTimelineSegments(ranges, { currentTime, duration, cacheSeconds })
}
