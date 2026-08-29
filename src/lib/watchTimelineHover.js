// Intro and outro markers share a single yellow hue so the timeline stays
// easy to scan: a single consistent color signals "this is a skip segment"
// regardless of which side of the episode it sits on. Yellow was chosen for
// high contrast against ArtPlayer's dark progress track and the Nothing-style
// red played line. The alpha (~0.55) keeps the marker visible without
// overpowering the buffered-range indicator layered behind it.
export const TIMELINE_MARKER_DEFINITIONS = Object.freeze({
  intro: Object.freeze({ label: 'Intro', color: 'rgba(234, 179, 8, 0.55)' }),
  outro: Object.freeze({ label: 'Outro', color: 'rgba(234, 179, 8, 0.55)' }),
})

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function formatTimelineTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(finite(seconds)))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainder = safeSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

export function getTimelineMarkers(segments = {}, duration = 0) {
  const total = finite(duration)
  if (total <= 0) return []

  return Object.keys(TIMELINE_MARKER_DEFINITIONS)
    .map((type) => {
      const start = Math.max(0, finite(segments?.[type]?.start, -1))
      const end = Math.min(total, finite(segments?.[type]?.end, -1))
      if (start < 0 || end <= start) return null
      return {
        type,
        label: TIMELINE_MARKER_DEFINITIONS[type].label,
        start,
        end,
        leftPercent: (start / total) * 100,
        widthPercent: ((end - start) / total) * 100,
      }
    })
    .filter(Boolean)
}

export function getTimelineHoverState({ ratio = 0, duration = 0, segments = {} } = {}) {
  const total = finite(duration)
  if (total <= 0) return null
  const normalizedRatio = Math.min(1, Math.max(0, finite(ratio)))
  const time = normalizedRatio * total
  const marker = getTimelineMarkers(segments, total).find(
    (item) => time >= item.start && time <= item.end
  )
  return { ratio: normalizedRatio, time, marker: marker || null }
}

function createMarkerElement(marker) {
  const element = document.createElement('span')
  element.className = `watch-timeline-marker watch-timeline-marker-${marker.type}`
  element.setAttribute('aria-hidden', 'true')
  element.style.position = 'absolute'
  element.style.top = '0'
  element.style.bottom = '0'
  element.style.pointerEvents = 'none'
  element.style.background = TIMELINE_MARKER_DEFINITIONS[marker.type].color
  element.style.left = `${marker.leftPercent}%`
  element.style.width = `${marker.widthPercent}%`
  return element
}

function updateTooltip(tooltip, state) {
  tooltip.replaceChildren()

  const timestamp = document.createElement('strong')
  timestamp.className = 'watch-timeline-tooltip-time'
  timestamp.textContent = formatTimelineTime(state.time)
  tooltip.append(timestamp)

  if (state.marker) {
    const range = document.createElement('span')
    range.className = 'watch-timeline-tooltip-range'
    range.textContent = `${state.marker.label} · ${formatTimelineTime(state.marker.start)}–${formatTimelineTime(state.marker.end)}`
    tooltip.append(range)
  }
}

/**
 * Add a passive hover preview to an Artplayer progress track. Seeking remains
 * owned by Artplayer; this layer only displays the hovered timestamp and any
 * verified marked range (currently intro/outro).
 */
export function createTimelineHoverPreview(video, progressInner, getSegments = () => ({})) {
  if (!video || !progressInner || typeof document === 'undefined') {
    return { cleanup: () => {}, refresh: () => {} }
  }

  progressInner.classList.add('watch-timeline-track')

  const markers = document.createElement('div')
  markers.className = 'watch-timeline-markers'
  markers.setAttribute('aria-hidden', 'true')

  const tooltip = document.createElement('div')
  tooltip.className = 'watch-timeline-hover-tooltip'
  tooltip.setAttribute('role', 'status')
  Object.assign(tooltip.style, {
    position: 'fixed',
    zIndex: '1000',
    transform: 'translateX(-50%)',
    padding: '6px 9px',
    borderRadius: '6px',
    background: 'rgba(15, 23, 42, 0.96)',
    color: '#f8fafc',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    boxShadow: '0 5px 18px rgba(0, 0, 0, 0.35)',
    fontSize: '11px',
    lineHeight: '1.35',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  })
  tooltip.setAttribute('aria-live', 'polite')
  tooltip.hidden = true

  progressInner.append(markers)
  document.body.append(tooltip)

  const refresh = () => {
    const nextMarkers = getTimelineMarkers(getSegments(), video.duration)
    markers.replaceChildren(...nextMarkers.map(createMarkerElement))
  }

  const hide = () => {
    tooltip.hidden = true
  }

  const update = (event) => {
    if (event.pointerType === 'touch') return
    const rect = progressInner.getBoundingClientRect()
    const duration = finite(video.duration)
    if (!rect.width || duration <= 0) {
      hide()
      return
    }

    const ratio = (event.clientX - rect.left) / rect.width
    const state = getTimelineHoverState({
      ratio,
      duration,
      segments: getSegments(),
    })
    if (!state) {
      hide()
      return
    }

    updateTooltip(tooltip, state)
    tooltip.hidden = false
    const viewportPadding = 8
    const tooltipHalfWidth = Math.min(110, Math.max(42, tooltip.offsetWidth / 2))
    const left = Math.min(
      window.innerWidth - viewportPadding - tooltipHalfWidth,
      Math.max(viewportPadding + tooltipHalfWidth, event.clientX)
    )
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${Math.max(viewportPadding + tooltip.offsetHeight, rect.top - 8)}px`
  }

  const events = [
    ['pointerenter', update],
    ['pointermove', update],
    ['pointerleave', hide],
    ['loadedmetadata', refresh],
    ['durationchange', refresh],
  ]
  events.forEach(([event, handler]) => {
    if (event.startsWith('pointer')) progressInner.addEventListener(event, handler)
    else video.addEventListener(event, handler)
  })
  refresh()

  return {
    refresh,
    cleanup: () => {
      events.forEach(([event, handler]) => {
        if (event.startsWith('pointer')) progressInner.removeEventListener(event, handler)
        else video.removeEventListener(event, handler)
      })
      markers.remove()
      tooltip.remove()
      progressInner.classList.remove('watch-timeline-track')
    },
  }
}
