export const PLAYBACK_CACHE_SECONDS = 120

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

/**
 * Clamp the visible cache indication to the requested playback window instead
 * of drawing an unrestricted browser HTTP cache as if it were seekable media.
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
    const segments = getBufferedTimelineSegments(getVideoRanges(video), {
      currentTime: video.currentTime,
      duration: video.duration,
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

  const events = ['progress', 'loadedmetadata', 'durationchange', 'timeupdate', 'seeking']
  events.forEach((event) => video.addEventListener(event, render))
  render()

  return () => {
    events.forEach((event) => video.removeEventListener(event, render))
    layer.remove()
  }
}
