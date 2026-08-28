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

// ────────────────────────────────────────────────────────────────
// Buffered timeline indicator
// ────────────────────────────────────────────────────────────────
// Watch.jsx mounts this on the ArtPlayer progress bar to visualize the
// continuous playback cache. It renders one cue segment per browser-reported
// buffered range through getPlayableBufferedTimelineSegments above, so the
// timeline always mirrors the real MediaSource buffer (back ranges included,
// never clipped to a short artificial cache window). The DOM contract matches
// the page CSS: a .watch-buffer-indicator layer containing
// .watch-buffer-indicator-segment children positioned by percentage.

function timeRangesToArray(ranges) {
  const list = []
  if (!ranges) return list
  const count = Number(ranges.length)
  if (!Number.isFinite(count) || count <= 0) return list
  for (let index = 0; index < count; index += 1) {
    const start = finite(typeof ranges.start === 'function' ? ranges.start(index) : NaN)
    const end = finite(typeof ranges.end === 'function' ? ranges.end(index) : NaN)
    if (end > start) list.push({ start, end })
  }
  return list
}

/**
 * Attach a buffered-range indicator to an ArtPlayer progress bar.
 *
 * @param {HTMLVideoElement|null} video media element whose buffer is shown
 * @param {HTMLElement|null} progressInner ArtPlayer .art-control-progress-inner
 * @returns {() => void} idempotent cleanup that removes listeners and DOM
 */
export function createBufferedTimelineIndicator(video, progressInner) {
  if (
    !video ||
    !progressInner ||
    typeof video.addEventListener !== 'function' ||
    typeof progressInner.appendChild !== 'function' ||
    typeof document === 'undefined'
  ) {
    return () => {}
  }

  let layer = null
  try {
    layer = progressInner.querySelector('.watch-buffer-indicator')
  } catch {}
  if (!layer) {
    layer = document.createElement('div')
    layer.className = 'watch-buffer-indicator'
    progressInner.appendChild(layer)
  }

  let frame = 0
  let disposed = false

  const render = () => {
    frame = 0
    if (disposed) return
    const segments = getPlayableBufferedTimelineSegments(
      timeRangesToArray(video.buffered),
      {
        currentTime: video.currentTime,
        duration: video.duration,
        readyState: video.readyState,
      }
    )
    while (layer.firstChild) layer.removeChild(layer.firstChild)
    for (const segment of segments) {
      const node = document.createElement('div')
      node.className = 'watch-buffer-indicator-segment'
      node.style.left = `${segment.leftPercent}%`
      node.style.width = `${segment.widthPercent}%`
      layer.appendChild(node)
    }
  }

  const scheduleRender = () => {
    if (disposed || frame) return
    frame = requestAnimationFrame(render)
  }

  const events = [
    'progress',
    'timeupdate',
    'loadedmetadata',
    'durationchange',
    'seeking',
    'seeked',
    'canplay',
    'playing',
  ]
  events.forEach((event) =>
    video.addEventListener(event, scheduleRender, { passive: true })
  )

  scheduleRender()

  return () => {
    if (disposed) return
    disposed = true
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    events.forEach((event) => video.removeEventListener(event, scheduleRender))
    if (layer.parentNode) layer.parentNode.removeChild(layer)
  }
}
