// Show a useful YouTube-style cache window instead of painting the entire
// browser-reported VOD range. Some Kiwi proxy sessions report the complete VOD
// as buffered after hls.js has opened the manifest, which otherwise makes the
// cache layer indistinguishable from the progress track.
export const PLAYBACK_CACHE_SECONDS = 180
export const MIN_PLAYABLE_BUFFER_SECONDS = 0.5

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

/**
 * Clamp the visible cache indication to a useful playback window instead of
 * drawing an unrestricted browser HTTP/MSE range across the entire episode.
 */
export function getBufferedTimelineSegments(
  ranges = [],
  { currentTime = 0, duration = 0, cacheSeconds = PLAYBACK_CACHE_SECONDS } = {}
) {
  const total = finite(duration)
  if (total <= 0) return []

  const current = Math.min(total, Math.max(0, finite(currentTime)))
  const limit = cacheSeconds === Number.POSITIVE_INFINITY
    ? Number.POSITIVE_INFINITY
    : Math.max(1, finite(cacheSeconds, PLAYBACK_CACHE_SECONDS))
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
 * future decodable data at the current position.
 */
export function getPlayableBufferedTimelineSegments(
  ranges = [],
  { currentTime = 0, duration = 0, readyState = 0, cacheSeconds = PLAYBACK_CACHE_SECONDS } = {}
) {
  if (finite(readyState) < 2) return []
  const current = finite(currentTime)
  const hasForwardPlayableRange = (Array.isArray(ranges) ? ranges : []).some((range) => {
    const start = finite(range?.start)
    const end = finite(range?.end)
    return start <= current + 0.1 && end - current >= MIN_PLAYABLE_BUFFER_SECONDS
  })
  if (!hasForwardPlayableRange) return []
  return getBufferedTimelineSegments(ranges, { currentTime, duration, cacheSeconds })
}

function getVideoRanges(video) {
  const ranges = []
  const buffered = video?.buffered
  if (!buffered) return ranges
  for (let index = 0; index < buffered.length; index += 1) {
    ranges.push({ start: buffered.start(index), end: buffered.end(index) })
  }
  return ranges
}

/**
 * Install a passive visual cache layer behind ArtPlayer's played position and
 * seek marker. It never changes the video buffer or intercepts pointer input.
 */
export function createBufferedTimelineIndicator(video, progressInner) {
  if (!video || !progressInner || typeof document === 'undefined') return () => {}

  const layer = document.createElement('div')
  layer.className = 'watch-buffer-indicator'
  layer.setAttribute('aria-hidden', 'true')
  progressInner.append(layer)

  const render = () => {
    const ranges = getVideoRanges(video)
    const lastBufferedEnd = ranges.reduce((end, range) => Math.max(end, range.end), 0)
    const seekable = video.seekable
    const lastSeekableEnd = seekable && seekable.length
      ? seekable.end(seekable.length - 1)
      : 0
    const reportedDuration = Number(video.duration)
    const duration = Number.isFinite(reportedDuration) && reportedDuration > 0
      ? reportedDuration
      : Math.max(lastBufferedEnd, Number.isFinite(lastSeekableEnd) ? lastSeekableEnd : 0)
    const segments = getPlayableBufferedTimelineSegments(ranges, {
      currentTime: video.currentTime,
      duration,
      readyState: video.readyState,
    })
    layer.replaceChildren(
      ...segments.map((segment) => {
        const bar = document.createElement('span')
        bar.className = 'watch-buffer-indicator-segment'
        bar.style.left = `${segment.leftPercent}%`
        bar.style.width = `${segment.widthPercent}%`
        return bar
      })
    )
  }

  const events = [
    'progress',
    'loadedmetadata',
    'durationchange',
    'timeupdate',
    'seeking',
    'waiting',
    'stalled',
    'canplay',
    'playing',
  ]
  events.forEach((event) => video.addEventListener(event, render))
  const refreshTimer = window.setInterval(render, 500)
  render()

  return () => {
    events.forEach((event) => video.removeEventListener(event, render))
    window.clearInterval(refreshTimer)
    layer.remove()
  }
}
