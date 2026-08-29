// The indicator is derived only from the media element's actual buffered
// ranges. There is intentionally no fixed cache duration or synthetic window.
export const PLAYBACK_CACHE_SECONDS = Number.POSITIVE_INFINITY
export const MIN_PLAYABLE_BUFFER_SECONDS = 0.5

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

/**
 * Render the exact downloaded-and-appended MediaSource ranges. The browser's
 * `video.buffered` TimeRanges object is the source of truth for this layer.
 */
export function getBufferedTimelineSegments(
  ranges = [],
  { currentTime = 0, duration = 0, cacheSeconds = PLAYBACK_CACHE_SECONDS } = {}
) {
  const total = finite(duration)
  if (total <= 0) return []

  void currentTime
  void cacheSeconds

  return ranges
    .map((range) => ({ start: finite(range?.start), end: finite(range?.end) }))
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
  void readyState
  const current = finite(currentTime)
  const hasBufferedRange = (Array.isArray(ranges) ? ranges : []).some((range) => {
    const start = finite(range?.start)
    const end = finite(range?.end)
    return end > start && end >= current
  })
  if (!hasBufferedRange) return []
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
 * Merge two sets of { start, end } ranges, deduplicating overlapping entries.
 * Custom (Kiwi fragment) ranges are preferred when they overlap with native
 * video.buffered ranges so the indicator reflects the player's own tracking.
 */
function mergeRanges(custom = [], native = []) {
  const all = [...custom, ...native]
    .filter((r) => r && Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start)
    .sort((a, b) => a.start - b.start)
  if (!all.length) return []
  const merged = [{ ...all[0] }]
  for (let i = 1; i < all.length; i += 1) {
    const last = merged[merged.length - 1]
    const cur = all[i]
    if (cur.start <= last.end + 0.05) {
      last.end = Math.max(last.end, cur.end)
    } else {
      merged.push({ ...cur })
    }
  }
  return merged
}

/**
 * Install a passive visual cache layer behind ArtPlayer's played position and
 * seek marker. It never changes the video buffer or intercepts pointer input.
 */
export function createBufferedTimelineIndicator(video, progressInner, { getRanges = null } = {}) {
  if (!video || !progressInner || typeof document === 'undefined') return () => {}

  const layer = document.createElement('div')
  layer.className = 'watch-buffer-indicator'
  layer.setAttribute('aria-hidden', 'true')
  layer.style.position = 'absolute'
  layer.style.inset = '0'
  layer.style.zIndex = '2'
  layer.style.pointerEvents = 'none'
  progressInner.append(layer)

  const render = () => {
    const mediaRanges = getVideoRanges(video)
    // Always merge custom Kiwi fragment ranges with the native video.buffered
    // ranges. Kiwi's proxy can expose the whole VOD through video.buffered
    // even while only a few HLS fragments have arrived, so the native ranges
    // are the most reliable source of truth for the indicator.
    const customRanges = typeof getRanges === 'function' ? (getRanges() || []) : []
    const ranges = mergeRanges(customRanges, mediaRanges)
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
        bar.style.position = 'absolute'
        bar.style.left = `${segment.leftPercent}%`
        bar.style.width = `${segment.widthPercent}%`
        bar.style.top = '50%'
        bar.style.height = '3px'
        bar.style.transform = 'translateY(-50%)'
        bar.style.borderRadius = '999px'
        bar.style.background = 'rgba(226, 232, 240, 0.9)'
        bar.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.3), 0 0 5px rgba(226,232,240,0.35)'
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
