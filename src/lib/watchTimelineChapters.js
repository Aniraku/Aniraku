// Chapter track for the player timeline: Intro / Episode / Outro segments
// rendered as an always-visible, clickable strip just above ArtPlayer's
// progress bar. Chapters are derived from the same skip segments that power
// Skip Intro/Outro (provider payloads + AniSkip), so a chapter only appears
// when verified timestamp data exists for it.

// Chapter boundaries. The Intro chapter spans the cold-open plus the detected
// opening (0 → intro.end); the Outro chapter spans the detected ending to the
// end of the episode. What remains in between is the episode itself.
export function buildTimelineChapters(segments = {}, duration = 0) {
  const total = Number(duration)
  if (!Number.isFinite(total) || total <= 0) return []

  const introEnd = Number(segments?.intro?.end)
  const outroStart = Number(segments?.outro?.start)
  const hasIntro = Number.isFinite(introEnd) && introEnd > 1 && introEnd < total
  const hasOutro = Number.isFinite(outroStart) && outroStart > 1 && outroStart < total

  const chapters = []
  if (hasIntro) {
    chapters.push({ key: 'intro', label: 'Intro', start: 0, end: introEnd })
  }
  const mainStart = hasIntro ? introEnd : 0
  const mainEnd = hasOutro ? outroStart : total
  if (mainEnd - mainStart > 1) {
    chapters.push({ key: 'main', label: 'Episode', start: mainStart, end: mainEnd })
  }
  if (hasOutro) {
    chapters.push({ key: 'outro', label: 'Outro', start: outroStart, end: total })
  }
  return chapters.map((chapter) => ({
    ...chapter,
    leftPercent: (chapter.start / total) * 100,
    widthPercent: ((chapter.end - chapter.start) / total) * 100,
  }))
}

export function createTimelineChapters(video, container, getSegments) {
  if (!video || !container || typeof getSegments !== 'function') return () => {}

  const track = document.createElement('div')
  track.className = 'watch-chapter-track'
  container.appendChild(track)

  let frame = 0
  let signature = ''

  const render = () => {
    frame = 0
    const chapters = buildTimelineChapters(getSegments() || {}, video.duration)
    const key = chapters
      .map((chapter) => `${chapter.key}:${Math.round(chapter.start)}-${Math.round(chapter.end)}`)
      .join('|')
    if (key === signature) return
    signature = key
    track.replaceChildren()
    for (const chapter of chapters) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = `watch-chapter-segment watch-chapter-${chapter.key}`
      el.textContent = chapter.label
      el.title = chapter.label
      el.style.left = `${chapter.leftPercent}%`
      el.style.width = `${chapter.widthPercent}%`
      el.addEventListener('click', (event) => {
        // Don't let the click fall through to ArtPlayer's seek handler.
        event.stopPropagation()
        event.preventDefault()
        try {
          video.currentTime = chapter.start
        } catch {}
      })
      track.appendChild(el)
    }
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render)
  }
  // durationchange/loadedmetadata cover episode loads; timeupdate covers
  // segments arriving late (AniSkip fetch resolves after playback started).
  const events = ['loadedmetadata', 'durationchange', 'timeupdate']
  events.forEach((name) => video.addEventListener(name, schedule))
  schedule()

  return () => {
    events.forEach((name) => video.removeEventListener(name, schedule))
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    track.remove()
  }
}
