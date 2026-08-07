import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useLayoutEffect,
} from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FaStepForward,
  FaStepBackward,
  FaSearch,
  FaCommentDots,
  FaWifi,
  FaExclamationTriangle,
  FaRedo,
  FaCheckCircle,
  FaSpinner,
  FaSignal,
} from 'react-icons/fa'
import { API_BASE, PROXY_BASE } from '../config'
import { anilistQuery, ANIME_DETAIL_QUERY } from '../lib/anilist'
import Footer from '../components/Footer/Footer'
import Comments from '../components/Comments/Comments'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { isNsfw, useNsfw } from '../hooks/useNsfw'
import { setWatchSEO } from '../lib/seo'
import { extractIdFromSlug, generateSlug } from '../lib/slug'

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────
const EPISODES_PER_PAGE = 50
const STREAM_CACHE_TTL_MS = 30_000       // 30s — short so a "switch server"
const SLOW_THRESHOLD_MS = 10_000         //   refresh on the same server
const RESUME_MIN_TIME = 30               //   after a token expires is cheap
const PLAYER_RECONNECT_MAX = 8           // ArtPlayer built-in retries
const MAX_SERVER_RETRIES = 3             // refresh cap per source per ep
const HEALTH_CHECK_TIMEOUT = 4_000
const STREAM_FETCH_TIMEOUT = 60_000

// ────────────────────────────────────────────────────────────────
// Device / environment detection
// ────────────────────────────────────────────────────────────────
const UA = typeof navigator !== 'undefined' ? navigator.userAgent : ''
const IS_IOS =
  /iPad|iPhone|iPod/.test(UA) && !window.MSStream
const IS_ANDROID = /Android/i.test(UA)
const IS_MOBILE =
  IS_IOS ||
  IS_ANDROID ||
  /webOS|BlackBerry|IEMobile|Opera Mini|Mobile Safari/i.test(UA)
const IS_TV =
  /Smart-TV|Apple-TV|GoogleTV|AndroidTV|HbbTV|NetCast|VIERA|SMART-TV/i.test(UA)
const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
const PREFERS_HIGH_CONTRAST =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-contrast: more)').matches

// Cross-browser fullscreen API helpers
const fsElement =
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.msFullscreenElement
const fsRequest =
  document.documentElement.requestFullscreen ||
  document.documentElement.webkitRequestFullscreen ||
  document.documentElement.msRequestFullscreen
const fsExit =
  document.exitFullscreen ||
  document.webkitExitFullscreen ||
  document.msExitFullscreen

// ────────────────────────────────────────────────────────────────
// Error classification
// ────────────────────────────────────────────────────────────────
// `no-source`        → backend explicitly said no provider had a stream
//                      for this anime/episode (give up, don't loop)
// `expired`          → tokenized CDN URL is dead (refresh the same
//                      source once before giving up on it)
// `blocked`          → geo / referer / network block from CDN
//                      (try next server of same lang)
// `network`          → fetch itself failed (retry with backoff)
// `timeout`          → fetch or proxy never returned in time
// `backend`          → backend 5xx, cold start, or no upstream
//                      response (retry with backoff, show "backend
//                      is waking up")
// `cdn-unreachable`  → proxy or CDN host itself is unreachable
// `unknown`          → anything else (treat as retryable)
function classifyStreamError(err, data) {
  const msg = (err?.message || data?.error || '').toString()
  const lc = msg.toLowerCase()
  if (/no streaming source|no video source|not available|no source/i.test(lc))
    return { type: 'no-source', retryable: false }
  if (/expired|invalid.*token|token.*expired/i.test(lc))
    return { type: 'expired', retryable: true }
  if (/blocked|forbidden|geo|country|region/i.test(lc))
    return { type: 'blocked', retryable: false }
  if (/unreachable|cors|origin/i.test(lc))
    return { type: 'cdn-unreachable', retryable: true }
  if (/timeout|timed out|aborted/i.test(lc))
    return { type: 'timeout', retryable: true }
  if (/backend|server|upstream|render|cold/i.test(lc))
    return { type: 'backend', retryable: true }
  if (/network|fetch failed|failed to fetch/i.test(lc))
    return { type: 'network', retryable: true }
  return { type: 'unknown', retryable: true }
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
function formatTime(s) {
  if (typeof s !== 'number' || !isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function formatAiringDate(unixTimestamp) {
  if (!unixTimestamp) return ''
  const date = new Date(unixTimestamp * 1000)
  const now = new Date()
  const diffMs = date - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  )
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday',
  ]
  const dd = String(date.getDate()).padStart(2, '0')
  const mon = months[date.getMonth()]
  const yyyy = date.getFullYear()
  const day = days[date.getDay()]
  let hours = date.getHours()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const mins = String(date.getMinutes()).padStart(2, '0')
  const formattedDate = `${dd} ${mon} ${yyyy} (${day}) ${hours}:${mins} ${ampm}`
  if (diffMs > 0) {
    let countdown = ''
    if (diffDays > 0) countdown = `— in ${diffDays}d ${diffHours}h`
    else if (diffHours > 0) countdown = `— in ${diffHours}h ${diffMins}m`
    else countdown = `— in ${diffMins}m`
    return `${formattedDate} ${countdown}`
  }
  return formattedDate
}

// Sleep w/ abort
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(t)
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true }
      )
    }
  })
}

// Exponential backoff with jitter
async function backoff(attempt, { base = 600, cap = 8_000, factor = 2, jitter = 0.3 } = {}) {
  const delay = Math.min(cap, base * Math.pow(factor, attempt))
  const jitterMs = delay * jitter * (Math.random() * 2 - 1)
  await sleep(Math.max(0, delay + jitterMs))
}

// Health check: backend reachable?
async function checkBackendHealth() {
  const candidates = [`${API_BASE}/health`, `${API_BASE}/api/v1/health`, API_BASE]
  for (const url of candidates) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), HEALTH_CHECK_TIMEOUT)
      const res = await fetch(url, {
        method: url.endsWith('/health') ? 'GET' : 'HEAD',
        signal: ctrl.signal,
        cache: 'no-store',
      })
      clearTimeout(t)
      if (res.ok || res.status === 404) return true
    } catch {
      // try next candidate
    }
  }
  return false
}

// Detect connection speed (best-effort)
function getConnectionHint() {
  const c =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection
  if (!c) return { effectiveType: 'unknown', downlink: 0, rtt: 0 }
  return {
    effectiveType: c.effectiveType || 'unknown',
    downlink: c.downlink || 0,
    rtt: c.rtt || 0,
    saveData: !!c.saveData,
  }
}

// ────────────────────────────────────────────────────────────────
// Keyboard shortcuts hook
// ────────────────────────────────────────────────────────────────
function useKeyboardShortcuts(playerRef, videoRef, options) {
  const {
    onNext,
    onPrev,
    sources,
    activeSource,
    setActiveSource,
    showToast,
    setTheaterMode,
  } = options
  const toastTimeoutRef = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      const art = playerRef.current
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (tag === 'BUTTON' || tag === 'A' || e.target.isContentEditable) return

      const key = e.code
      const ctrl = e.ctrlKey || e.metaKey

      if (key === 'Space') {
        e.preventDefault()
        if (art) art.toggle()
        return
      }
      if (key === 'ArrowLeft' || key === 'KeyJ') {
        e.preventDefault()
        if (art) {
          art.video.currentTime = Math.max(0, art.video.currentTime - 10)
          showToast(`−10s ${formatTime(art.video.currentTime)}`)
        }
        return
      }
      if (key === 'ArrowRight' || key === 'KeyL') {
        e.preventDefault()
        if (art) {
          art.video.currentTime = Math.min(
            art.video.duration || Infinity,
            art.video.currentTime + 10
          )
          showToast(`+10s ${formatTime(art.video.currentTime)}`)
        }
        return
      }
      if (key === 'ArrowUp') {
        e.preventDefault()
        if (art) {
          const vol = Math.min(1, art.volume + 0.05)
          art.volume = vol
          showToast(`Volume ${Math.round(vol * 100)}%`)
        }
        return
      }
      if (key === 'ArrowDown') {
        e.preventDefault()
        if (art) {
          const vol = Math.max(0, art.volume - 0.05)
          art.volume = vol
          showToast(`Volume ${Math.round(vol * 100)}%`)
        }
        return
      }
      if (key === 'KeyF') {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (art) art.fullscreen = !art.fullscreen
        return
      }
      if (key === 'KeyP') {
        e.preventDefault()
        if (art) {
          try {
            art.pip = !art.pip
          } catch {
            /* not supported */
          }
        }
        return
      }
      if (key === 'KeyT') {
        e.preventDefault()
        setTheaterMode((p) => {
          const next = !p
          showToast(next ? 'Theater Mode On' : 'Theater Mode Off')
          return next
        })
        return
      }
      if (key === 'KeyM') {
        e.preventDefault()
        if (art) {
          art.muted = !art.muted
          showToast(
            art.muted ? 'Muted' : `Volume ${Math.round(art.volume * 100)}%`
          )
        }
        return
      }
      if (key === 'KeyC') {
        e.preventDefault()
        if (art) {
          const subtitles = art._anirakuSubtitles || []
          if (subtitles.length > 0) {
            const currentSub = art.subtitle?.url
            const currentIdx = subtitles.findIndex((s) => s.url === currentSub)
            const nextIdx = (currentIdx + 1) % (subtitles.length + 1)
            if (nextIdx === 0 || nextIdx >= subtitles.length) {
              art.subtitle = null
              showToast('Subtitles Off')
            } else {
              const sub = subtitles[nextIdx]
              if (!sub.url) {
                art.subtitle = null
                showToast('Subtitles Off')
              } else {
                art.subtitle = { url: sub.url, type: 'srt' }
                showToast(`Subtitles: ${sub.label || 'Track ' + nextIdx}`)
              }
            }
          } else {
            showToast('No subtitles available')
          }
        }
        return
      }
      if (key === 'KeyN') {
        e.preventDefault()
        if (onNext) onNext()
        return
      }
      if (key === 'KeyB') {
        e.preventDefault()
        if (onPrev) onPrev()
        return
      }
      if (key === 'KeyD') {
        e.preventDefault()
        const allSources = [...sources.sub, ...sources.dub]
        if (allSources.length < 2) return
        const currentIdx = allSources.findIndex((s) => s.id === activeSource)
        const nextIdx = (currentIdx + 1) % allSources.length
        const nextSource = allSources[nextIdx]
        if (nextSource) {
          setActiveSource(nextSource.id)
          showToast(`${nextSource.lang.toUpperCase()} via ${nextSource.label}`)
        }
        return
      }
      if (key === 'KeyS') {
        e.preventDefault()
        const allSources = [...sources.sub, ...sources.dub]
        if (allSources.length < 2) return
        const currentIdx = allSources.findIndex((s) => s.id === activeSource)
        let nextIdx = (currentIdx + 1) % allSources.length
        let attempts = 0
        while (
          allSources[nextIdx]?.id === activeSource &&
          attempts < allSources.length
        ) {
          nextIdx = (nextIdx + 1) % allSources.length
          attempts++
        }
        const nextSource = allSources[nextIdx]
        if (nextSource) {
          setActiveSource(nextSource.id)
          showToast(`${nextSource.label} (${nextSource.lang.toUpperCase()})`)
        }
        return
      }
      if (key === 'Comma') {
        e.preventDefault()
        if (art) {
          const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
          const current = art.video.playbackRate
          const idx = speeds.findIndex((s) => s >= current)
          const next = idx > 0 ? speeds[idx - 1] : speeds[0]
          art.video.playbackRate = next
          showToast(`Speed ${next}x`)
        }
        return
      }
      if (key === 'Period') {
        e.preventDefault()
        if (art) {
          const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
          const current = art.video.playbackRate
          const idx = speeds.findIndex((s) => s > current)
          const next = idx >= 0 ? speeds[idx] : speeds[speeds.length - 1]
          art.video.playbackRate = next
          showToast(`Speed ${next}x`)
        }
        return
      }
      if (key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (fsElement) fsExit.call(document).catch(() => {})
        setTheaterMode(false)
        return
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [
    playerRef,
    videoRef,
    onNext,
    onPrev,
    sources,
    activeSource,
    setActiveSource,
    showToast,
    setTheaterMode,
  ])
}

// ────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────
export default function Watch() {
  const { slugId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { nsfwEnabled } = useNsfw()

  // Refs
  const artRef = useRef(null)
  const artInstance = useRef(null)
  const hlsInstance = useRef(null)
  const loadingRef = useRef(false)
  const playerContainerRef = useRef(null)
  const touchSeekTimer = useRef(null)
  const buildIdRef = useRef(0)              // bumped on every buildPlayer
  const mountedRef = useRef(true)
  const toastTimerRef = useRef(null)
  const streamAbortRef = useRef(null)
  const recoveryBusyRef = useRef(false)
  const streamRetries = useRef({})
  const blockedSourcesRef = useRef(new Set())
  const lastBlockCycleRef = useRef(0)
  const forceRefreshUsedRef = useRef(false)
  const refreshAttemptedRef = useRef(new Set())
  const handleProviderBlockedRef = useRef(null)
  const visibilityRef = useRef(true)
  const streamCacheRef = useRef(new Map())   // short-TTL working streams
  const netHintRef = useRef(getConnectionHint())

  // State
  const [anime, setAnime] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [streamLoading, setStreamLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSource, setActiveSource] = useState('')
  const [epSearch, setEpSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [servers, setServers] = useState({ sub: [], dub: [] })
  const [noStreamError, setNoStreamError] = useState(false)
  const [theaterMode, setTheaterMode] = useState(false)
  const [resumePos, setResumePos] = useState(null)
  const [resumeCountdown, setResumeCountdown] = useState(0)
  const [showEpSidebar, setShowEpSidebar] = useState(true)
  const [touchSeekVisible, setTouchSeekVisible] = useState(false)
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [backendHealthy, setBackendHealthy] = useState(true)
  const [errorType, setErrorType] = useState('') // for actionable UI
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [buffering, setBuffering] = useState(false)

  // Derived
  const slugParts = slugId?.match(/^(.+)-episode-(\d+)$/)
  const baseName = slugParts?.[1] || slugId || ''
  const epNumber = parseInt(slugParts?.[2] || '1', 10)
  const animeId = extractIdFromSlug(baseName)
  const isMovie = anime?.format === 'MOVIE'

  // Refs to latest values (avoid stale closures)
  const routeRef = useRef(slugId)
  routeRef.current = slugId
  const epNumberRef = useRef(epNumber)
  epNumberRef.current = epNumber
  const episodesRef = useRef(episodes)
  episodesRef.current = episodes
  const activeSourceRef = useRef(activeSource)
  activeSourceRef.current = activeSource

  // ────────────────────────────────────────────────────────────
  // Online / offline detection
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      showToast('Back online — resuming…', { icon: 'wifi' })
      // If a stream load had been failed, kick it again.
      if (errorType === 'network' || errorType === 'timeout') {
        retryLastStream()
      }
    }
    const onOffline = () => {
      setIsOnline(false)
      setError('You appear to be offline. Reconnect to continue streaming.')
      setErrorType('network')
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorType])

  // Visibility change — pause heavy work when tab is hidden
  useEffect(() => {
    const onVis = () => {
      visibilityRef.current = !document.hidden
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Page lifecycle — save & pause on hide, resume on show
  useEffect(() => {
    const onHide = () => {
      const art = artInstance.current
      if (art && !art.video.paused) art.video.pause()
    }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [])

  // Reset per-episode block tracking
  useEffect(() => {
    blockedSourcesRef.current = new Set()
    lastBlockCycleRef.current = 0
    forceRefreshUsedRef.current = false
    recoveryBusyRef.current = false
    streamRetries.current = {}
    refreshAttemptedRef.current = new Set()
  }, [animeId, epNumber])

  // Toast
  const showToast = useCallback((msg, opts = {}) => {
    setToast({ msg, ...opts })
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), opts.long ? 4000 : 2500)
  }, [])

  // ────────────────────────────────────────────────────────────
  // Sources (deduped)
  // ────────────────────────────────────────────────────────────
  const SOURCES = useMemo(() => {
    const dedupe = (arr) => {
      const seen = new Set()
      return arr
        .filter((s) => {
          const key = `${s.name}:${s.lang}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .map((s) => ({
          id: `${s.name}-${s.lang}`,
          label: s.name,
          provider: s.name,
          lang: s.lang,
        }))
    }
    return { sub: dedupe(servers.sub), dub: dedupe(servers.dub) }
  }, [servers])

  const currentSource = useMemo(() => {
    const all = [...SOURCES.sub, ...SOURCES.dub]
    return all.find((s) => s.id === activeSource) || all[0] || null
  }, [SOURCES, activeSource])

  const hasSub = servers.sub.length > 0
  const hasDub = servers.dub.length > 0

  // Auto-select first working SUB source
  useEffect(() => {
    if (SOURCES.sub.length > 0 && !SOURCES.sub.find((s) => s.id === activeSource)) {
      setActiveSource(SOURCES.sub[0].id)
    } else if (
      SOURCES.sub.length === 0 &&
      SOURCES.dub.length > 0 &&
      !SOURCES.dub.find((s) => s.id === activeSource)
    ) {
      setActiveSource(SOURCES.dub[0].id)
    }
  }, [SOURCES])

  // Filtered / paged episodes
  const filteredEps = useMemo(() => {
    if (!epSearch) return episodes
    const q = epSearch.toLowerCase()
    return episodes.filter(
      (ep) =>
        String(ep.number).includes(q) ||
        (ep.title && ep.title.toLowerCase().includes(q))
    )
  }, [episodes, epSearch])

  const [epPage, setEpPage] = useState(0)
  const pagedEps = useMemo(() => {
    const start = epPage * EPISODES_PER_PAGE
    return filteredEps.slice(start, start + EPISODES_PER_PAGE)
  }, [filteredEps, epPage])
  const totalEpPages = Math.ceil(filteredEps.length / EPISODES_PER_PAGE)

  // Prev/next
  const goNext = useCallback(() => {
    if (epNumber < episodes.length) {
      const slug = generateSlug(anime?.title?.english || anime?.title?.romaji || '')
      navigate(`/watch/${slug}-${animeId}-episode-${epNumber + 1}`)
    }
  }, [epNumber, episodes, anime, animeId, navigate])

  const goPrev = useCallback(() => {
    if (epNumber > 1) {
      const slug = generateSlug(anime?.title?.english || anime?.title?.romaji || '')
      navigate(`/watch/${slug}-${animeId}-episode-${epNumber - 1}`)
    }
  }, [epNumber, anime, animeId, navigate])

  // Global keyboard shortcuts
  useKeyboardShortcuts(artInstance, null, {
    onNext: goNext,
    onPrev: goPrev,
    sources: SOURCES,
    activeSource,
    setActiveSource,
    showToast,
    theaterMode,
    setTheaterMode,
    containerRef: playerContainerRef,
  })

  // ────────────────────────────────────────────────────────────
  // Fetch anime + episodes (with retry + fallback to AniList)
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    let cancelled = false
    let attempts = 0

    const run = async () => {
      try {
        const [animeRes, epRes] = await Promise.all([
          fetchWithRetry(
            `${API_BASE}/api/v1/anime/${animeId}`,
            { method: 'GET' },
            { maxRetries: 2, timeoutMs: 12_000 }
          ).then((r) => (r ? r.json() : null)),
          fetchWithRetry(
            `${API_BASE}/api/v1/anime/${animeId}/episodes`,
            { method: 'GET' },
            { maxRetries: 2, timeoutMs: 12_000 }
          ).then((r) => (r ? r.json() : { episodes: [] })),
        ])
        if (cancelled) return
        let animeData = animeRes
        let epData = epRes
        if (!animeData) {
          const { data } = await anilistQuery(ANIME_DETAIL_QUERY, {
            id: parseInt(animeId, 10),
          }).catch(() => ({ data: null }))
          if (data?.Media) {
            animeData = { ...data.Media, id: animeId }
            if (
              !epData?.episodes?.length &&
              data.Media.episodes
            ) {
              epData = {
                episodes: Array.from(
                  { length: data.Media.episodes },
                  (_, i) => ({
                    number: i + 1,
                    title: `Episode ${i + 1}`,
                    thumbnail: data.Media.coverImage?.medium || '',
                  })
                ),
              }
            }
          }
        }
        if (cancelled) return
        setAnime(animeData)
        setEpisodes(epData?.episodes || [])
        setBackendHealthy(true)
      } catch (e) {
        if (cancelled) return
        setBackendHealthy(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [animeId])

  // SEO metadata
  useEffect(() => {
    if (anime) setWatchSEO(anime, epNumber)
  }, [anime?.id, epNumber])

  // ────────────────────────────────────────────────────────────
  // Resume position
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!animeId || !epNumber) return
    let cancelled = false
    let interval = null
    const applyResume = (entry) => {
      if (cancelled || !entry || !(entry.time > RESUME_MIN_TIME)) return
      setResumePos(entry.time)
      let count = 3
      setResumeCountdown(count)
      interval = setInterval(() => {
        count--
        if (count <= 0) {
          clearInterval(interval)
          setResumeCountdown(0)
        } else {
          setResumeCountdown(count)
        }
      }, 1000)
    }
    const local = []
    try {
      local.push(...JSON.parse(localStorage.getItem('aniraku-watch-history') || '[]'))
    } catch {}
    if (!user) {
      applyResume(
        local.find(
          (h) => String(h.animeId) === String(animeId) && h.episode === epNumber
        )
      )
      return () => {
        cancelled = true
        if (interval) clearInterval(interval)
      }
    }
    supabase
      .from('watch_history')
      .select('progress,timestamp')
      .eq('user_id', user.id)
      .eq('anime_id', parseInt(animeId, 10))
      .eq('episode_number', epNumber)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const remote = data
          ? { time: data.progress, timestamp: data.timestamp || 0 }
          : null
        const localEntry =
          local.find(
            (h) =>
              String(h.animeId) === String(animeId) && h.episode === epNumber
          ) || null
        const sources = [remote, localEntry].filter(Boolean)
        sources.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        applyResume(sources[0])
      })
      .catch(() => {
        if (!cancelled) {
          applyResume(
            local.find(
              (h) =>
                String(h.animeId) === String(animeId) && h.episode === epNumber
            )
          )
        }
      })
    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [animeId, epNumber, user?.id])

  const handleResume = useCallback(() => {
    const art = artInstance.current
    if (art && resumePos) art.video.currentTime = resumePos
    setResumePos(null)
    setResumeCountdown(0)
  }, [resumePos])

  useEffect(() => {
    if (resumeCountdown > 0 || !resumePos) return
    handleResume()
  }, [resumeCountdown, resumePos, handleResume])

  // ────────────────────────────────────────────────────────────
  // fetch with retry + timeout
  // ────────────────────────────────────────────────────────────
  async function fetchWithRetry(url, init = {}, opts = {}) {
    const {
      maxRetries = 3,
      timeoutMs = STREAM_FETCH_TIMEOUT,
      base = 600,
      cap = 6_000,
    } = opts
    let lastErr
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (!mountedRef.current) return null
      if (!navigator.onLine) {
        lastErr = new Error('offline')
        break
      }
      const ctrl = new AbortController()
      // chain to outer abort if present
      if (streamAbortRef.current) {
        // we don't want to bind two aborts — rely on cleanup
      }
      const t = setTimeout(() => ctrl.abort(), timeoutMs)
      try {
        const res = await fetch(url, {
          ...init,
          signal: ctrl.signal,
          cache: 'no-store',
        })
        clearTimeout(t)
        if (!res.ok) {
          // 5xx → retry; 4xx → don't
          if (res.status >= 500 && attempt < maxRetries) {
            await backoff(attempt, { base, cap })
            continue
          }
          // Read body for classified message, but don't throw
          return res
        }
        return res
      } catch (e) {
        clearTimeout(t)
        lastErr = e
        if (attempt < maxRetries) await backoff(attempt, { base, cap })
      }
    }
    throw lastErr || new Error('network')
  }

  // ────────────────────────────────────────────────────────────
  // Player build / destroy
  // ────────────────────────────────────────────────────────────
  const destroyPlayer = useCallback(() => {
    if (hlsInstance.current) {
      try {
        hlsInstance.current.destroy()
      } catch {}
      hlsInstance.current = null
    }
    if (artInstance.current) {
      try {
        artInstance.current.destroy(false)
      } catch {}
      artInstance.current = null
      if (artRef.current) artRef.current.__artplayer = null
    }
    recoveryBusyRef.current = false
  }, [])

  useEffect(
    () => () => {
      mountedRef.current = false
      if (streamAbortRef.current) {
        try {
          streamAbortRef.current.abort()
        } catch {}
      }
      clearTimeout(toastTimerRef.current)
      clearTimeout(touchSeekTimer.current)
      destroyPlayer()
    },
    [destroyPlayer]
  )

  const buildPlayer = useCallback(
    async (streamUrl, sourceType, qualityList, subtitles, headers, onBlocked) => {
      destroyPlayer()
      const container = artRef.current
      if (!container) return

      const myBuildId = ++buildIdRef.current
      const headersParam = headers
        ? `&headers=${encodeURIComponent(JSON.stringify(headers))}`
        : ''
      const proxied = (u) =>
        `${PROXY_BASE}/proxy?url=${encodeURIComponent(u)}${headersParam}`

      // MP4 playback — proxy first, direct as fallback
      const playAsMp4 = (video, url, art) => {
        let directTried = false
        const tryUrl = (target, withCors) => {
          try {
            video.crossOrigin = withCors ? 'anonymous' : null
            video.src = target
            video.load()
            const p = video.play()
            if (p && typeof p.catch === 'function') p.catch(() => {})
          } catch {
            // continue to fallback below
          }
        }
        tryUrl(proxied(url), true)
        video.onerror = () => {
          if (buildIdRef.current !== myBuildId) return
          if (!directTried) {
            directTried = true
            showToast('Trying direct playback…')
            tryUrl(url, false)
            return
          }
          showToast('Stream unavailable — switching server…')
          if (onBlocked) onBlocked()
          else setError('Stream playback error. Try a different server.')
        }
      }

      // Recovery step after ArtPlayer's built-in reconnect loop has
      // exhausted itself: try the next quality, then fall through to
      // the next server via onBlocked. Build-id guard ensures stale
      // work never touches a newer player.
      const recoverPlayback = () => {
        if (buildIdRef.current !== myBuildId) return
        if (recoveryBusyRef.current) return
        recoveryBusyRef.current = true
        const art = artInstance.current
        const cur = art ? art.option.url : streamUrl
        const idx = qualityList.findIndex((q) => q.url === cur)
        const next =
          idx >= 0 && idx + 1 < qualityList.length
            ? qualityList[idx + 1]
            : null
        if (next) {
          showToast('Stream issue — trying the next quality…')
          let switching = null
          try {
            switching = art.switchQuality(next.url)
          } catch {
            recoveryBusyRef.current = false
            destroyPlayer()
            buildPlayer(next.url, next.type || 'hls', qualityList, subtitles, headers, onBlocked)
            return
          }
          switching.then(
            () => {
              if (buildIdRef.current === myBuildId) recoveryBusyRef.current = false
            },
            () => {
              if (buildIdRef.current !== myBuildId) return
              recoveryBusyRef.current = false
              recoverPlayback()
            }
          )
          return
        }
        recoveryBusyRef.current = false
        showToast('Stream unavailable — switching server…')
        if (onBlocked) onBlocked()
        else setError('Stream playback error. Try a different server.')
      }

      const playerConfig = {
        container,
        url: streamUrl,
        type: sourceType === 'mp4' ? 'mp4' : 'm3u8',
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: true,
        fullscreen: true,
        fullscreenWeb: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: true,
        autoOrientation: true,
        airplay: true,
        hotkey: false,
        theme: '#e2e8f0',
        volume: 0.7,
        isLive: false,
        lang:
          (navigator.language || 'en').toLowerCase() === 'zh-cn' ? 'zh-cn' : 'en',
        moreVideoAttr: {
          crossOrigin: 'anonymous',
          preload: 'auto',
          playsInline: true,
          'webkit-playsinline': 'true',
          'x5-playsinline': 'true',
        },
        settings: [
          {
            width: 200,
            html: 'Subtitle Size',
            selector: [
              {
                default: true,
                html: 'Small',
                style: { color: '#fff' },
                callback: () => {
                  document
                    .querySelectorAll('.art-subtitle-wrap span')
                    .forEach((el) => (el.style.fontSize = '14px'))
                },
              },
              {
                html: 'Medium',
                style: { color: '#fff' },
                callback: () => {
                  document
                    .querySelectorAll('.art-subtitle-wrap span')
                    .forEach((el) => (el.style.fontSize = '18px'))
                },
              },
              {
                html: 'Large',
                style: { color: '#fff' },
                callback: () => {
                  document
                    .querySelectorAll('.art-subtitle-wrap span')
                    .forEach((el) => (el.style.fontSize = '22px'))
                },
              },
            ],
            onSelect: (item) => item.html,
          },
        ],
        playbackRate: true,
        quality: qualityList,
        customType: {
          mp4: (video, url, art) => playAsMp4(video, url, art),
          m3u8: async (video, url, art) => {
            const proxiedH = (u) =>
              `${PROXY_BASE}/proxy?url=${encodeURIComponent(u)}${headersParam}`
            const referer = (headers && headers.Referer) || ''
            // iOS Safari has native HLS support — use it directly.
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
              try {
                video.src = proxiedH(url)
                const p = video.play()
                if (p && typeof p.catch === 'function') p.catch(() => {})
              } catch {
                // fall through to hls.js
              }
              return
            }
            let Hls
            try {
              const mod = await import('hls.js')
              Hls = mod.default
            } catch (e) {
              if (buildIdRef.current === myBuildId) {
                showToast('HLS engine failed to load — try another server.', { long: true })
              }
              return
            }
            if (!Hls.isSupported()) {
              // last-resort native
              try {
                video.src = proxiedH(url)
                video.play().catch(() => {})
              } catch {}
              return
            }
            if (art.hls) {
              try {
                art.hls.destroy()
              } catch {}
            }
            const hls = new Hls({
              enableWorker: false,
              maxBufferLength: 15,
              maxMaxBufferLength: 60,
              startFragPrefetch: true,
              lowLatencyMode: false,
              backBufferLength: 5,
              appendInSequenceGaps: true,
              maxBufferHole: 1.0,
              forceKeyFrameOnDiscontinuity: true,
              maxRecoveryAttempts: 3,
              manifestLoadingMaxRetry: 2,
              levelLoadingMaxRetry: 2,
              fragLoadingMaxRetry: 2,
              defaultAudioCodec: 'mp4a.40.2',
              fetchSetup: referer
                ? (context, init) => {
                    try {
                      init.referrer = referer
                    } catch {}
                    return new Request(context.url, init)
                  }
                : undefined,
            })
            let triedDirect = false
            let netRetries = 0
            let mediaRetries = 0
            const fail = (reason) => {
              if (buildIdRef.current !== myBuildId) return
              // Distinguish "no upstream response" → backend/CDN issue
              // vs real playback error.
              if (!triedDirect) {
                triedDirect = true
                showToast('No upstream response — retrying direct…', { long: true })
                hls.loadSource(url)
                return
              }
              if (reason === 'backend' || reason === 'cdn-unreachable') {
                showToast(
                  'Stream source is unreachable — switching server…',
                  { long: true }
                )
              } else {
                showToast('Stream unavailable — switching server…')
              }
              if (onBlocked) onBlocked()
              else setError('Stream playback error. Try a different server.')
            }
            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (buildIdRef.current !== myBuildId) return
              if (!data.fatal) return
              // MP4 mis-classified as HLS
              if (
                data.type === Hls.ErrorTypes.MANIFEST_ERROR &&
                data.details === Hls.ErrorDetails.MANIFEST_PARSE_ERROR
              ) {
                try {
                  hls.destroy()
                } catch {}
                art.hls = null
                playAsMp4(video, url, art)
                return
              }
              if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                if (mediaRetries < 2) {
                  mediaRetries += 1
                  try {
                    hls.recoverMediaError()
                  } catch {}
                  return
                }
                fail('media')
                return
              }
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                if (netRetries < 2) {
                  netRetries += 1
                  try {
                    hls.startLoad()
                  } catch {}
                  return
                }
                fail('backend')
                return
              }
              fail('unknown')
            })
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              const p = video.play()
              if (p && typeof p.catch === 'function') p.catch(() => {})
            })
            hls.on(Hls.Events.BUFFER_APPENDING, () => {
              // could be used to show buffering indicator if needed
            })
            try {
              hls.loadSource(proxiedH(url))
              hls.attachMedia(video)
              art.hls = hls
              hlsInstance.current = hls
            } catch {
              fail('backend')
            }
          },
        },
      }

      if (subtitles && subtitles.length > 0 && subtitles[0].url) {
        const subtitleUrl = subtitles[0].url
        playerConfig.subtitle = {
          url: `${PROXY_BASE}/proxy?url=${encodeURIComponent(subtitleUrl)}${headersParam}`,
          type: 'srt',
          encoding: 'utf-8',
          style: {
            color: '#fff',
            fontSize: window.innerWidth <= 768 ? '18px' : '16px',
            backgroundColor: 'rgba(0,0,0,0.65)',
            borderRadius: '4px',
            padding: '2px 8px',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          },
        }
      }

      let Artplayer
      try {
        const mod = await import('artplayer')
        Artplayer = mod.default
      } catch (e) {
        showToast('Player failed to load — check your connection.', { long: true })
        return
      }

      if (buildIdRef.current !== myBuildId) return
      destroyPlayer()
      const art = new Artplayer(playerConfig)

      // ArtPlayer built-in reconnect loop. We only step in once it
      // has given up.
      let reconnectCount = 0
      art.on('error', (_err, count) => {
        reconnectCount = count || 0
      })
      art.on('video:canplay', () => {
        reconnectCount = 0
        setBuffering(false)
      })
      art.on('video:waiting', () => setBuffering(true))
      art.on('video:playing', () => setBuffering(false))
      art.on('video:error', () => {
        if (reconnectCount >= PLAYER_RECONNECT_MAX) {
          try {
            art.layers.error.show = false
          } catch {}
          recoverPlayback()
        }
      })

      if (subtitles && subtitles.length > 1) {
        art._anirakuSubtitles = subtitles
      }

      // Auto next episode
      art.on('video:ended', () => {
        if (!isMovie && epNumber < episodes.length) {
          const slug = generateSlug(
            anime?.title?.english || anime?.title?.romaji || ''
          )
          navigate(`/watch/${slug}-${animeId}-episode-${epNumber + 1}`)
        }
      })

      // Lock page scroll while fullscreen so the page never scrolls
      // behind the video (also covers iOS native fullscreen, which
      // re-scrolls on exit).
      let scrollY = 0
      art.on('fullscreen', (state) => {
        if (state) {
          scrollY = window.scrollY
          document.documentElement.classList.add('body-hidden')
        } else {
          document.documentElement.classList.remove('body-hidden')
          window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' })
        }
      })

      // Save watch history
      let lastSave = 0
      art.on('video:timeupdate', () => {
        const now = Date.now()
        if (now - lastSave < 10_000) return
        lastSave = now
        const title =
          anime?.title?.english || anime?.title?.romaji || animeId
        try {
          const entry = {
            animeId,
            title,
            episode: epNumber,
            time: Math.floor(art.video.currentTime),
            timestamp: now,
            image: anime?.coverImage?.large || '',
          }
          const raw = JSON.parse(
            localStorage.getItem('aniraku-watch-history') || '[]'
          )
          const filtered = raw.filter(
            (h) =>
              !(String(h.animeId) === String(animeId) && h.episode === epNumber)
          )
          filtered.unshift(entry)
          localStorage.setItem(
            'aniraku-watch-history',
            JSON.stringify(filtered.slice(0, 100))
          )
        } catch {}
        if (user) {
          Promise.resolve(
            supabase.from('watch_history').upsert(
              {
                user_id: user.id,
                anime_id: parseInt(animeId, 10),
                anime_title:
                  anime?.title?.english || anime?.title?.romaji || '',
                anime_image: anime?.coverImage?.large || '',
                episode_number: epNumber,
                progress: Math.floor(art.video.currentTime),
                duration: art.video.duration || 0,
                timestamp: now,
              },
              { onConflict: 'user_id,anime_id,episode_number' }
            )
          ).catch(() => {})
        }
      })

      artInstance.current = art
      if (artRef.current) artRef.current.__artplayer = art
    },
    [
      animeId,
      anime?.id,
      epNumber,
      episodes,
      anime,
      navigate,
      destroyPlayer,
      showToast,
    ]
  )

  // Slow-stream timer
  const [slowStream, setSlowStream] = useState(false)
  useEffect(() => {
    if (!streamLoading) {
      setSlowStream(false)
      return
    }
    const t = setTimeout(() => setSlowStream(true), SLOW_THRESHOLD_MS)
    return () => clearTimeout(t)
  }, [streamLoading])

  // ────────────────────────────────────────────────────────────
  // Stream cache
  // ────────────────────────────────────────────────────────────
  const cacheKey = (source) =>
    `${source?.provider || ''}-${source?.lang || ''}-${epNumber}`
  const getCachedStream = (source) => {
    if (!source) return null
    const e = streamCacheRef.current.get(cacheKey(source))
    if (!e) return null
    if (Date.now() - e.t > STREAM_CACHE_TTL_MS) {
      streamCacheRef.current.delete(cacheKey(source))
      return null
    }
    return e.data
  }
  const setCachedStream = (source, data) => {
    if (!source) return
    streamCacheRef.current.set(cacheKey(source), { data, t: Date.now() })
  }

  // ────────────────────────────────────────────────────────────
  // Load stream
  // ────────────────────────────────────────────────────────────
  const lastStreamAttemptRef = useRef(null)
  const loadStream = useCallback(
    async (sourceId, forceRefresh = false) => {
      if (streamAbortRef.current) {
        try {
          streamAbortRef.current.abort()
        } catch {}
        streamAbortRef.current = null
      }
      loadingRef.current = false
      if (loadingRef.current && !forceRefresh) return

      const source = [...SOURCES.sub, ...SOURCES.dub].find(
        (s) => s.id === sourceId
      )
      if (!source) {
        return
      }
      loadingRef.current = true
      lastStreamAttemptRef.current = { sourceId, forceRefresh }
      setStreamLoading(true)
      setError('')
      setNoStreamError(false)
      setErrorType('')
      setRetryAttempt(0)
      setResumePos(null)

      // Stale-while-revalidate: if we have a recent good stream for
      // this source, play it now, then refresh in the background.
      if (!forceRefresh) {
        const cached = getCachedStream(source)
        if (cached && cached.sources?.[0]?.url) {
          const firstSource = cached.sources[0]
          const mediaSources = cached.sources.filter(
            (src) => src.type !== 'embed'
          )
          if (mediaSources.length > 0) {
            const qualityList = mediaSources.map((src, idx) => ({
              default: idx === 0,
              html: src.quality || 'Auto',
              url: src.url,
              type: src.type || 'hls',
            }))
            const onBlocked = () => handleProviderBlockedRef.current?.()
            buildPlayer(
              qualityList[0].url,
              qualityList[0].type,
              qualityList,
              firstSource.subtitles || [],
              cached.headers,
              onBlocked
            )
            setStreamLoading(false)
            loadingRef.current = false
            // background refresh
            setTimeout(() => {
              if (
                activeSourceRef.current === sourceId &&
                mountedRef.current
              ) {
                loadStream(sourceId, true)
              }
            }, 5_000)
            return
          }
        }
      }

      // Retry budget per source
      const retryKey = sourceId
      if (forceRefresh) {
        streamRetries.current[retryKey] =
          (streamRetries.current[retryKey] || 0) + 1
        if (streamRetries.current[retryKey] > MAX_SERVER_RETRIES) {
          setNoStreamError(true)
          setErrorType('no-source')
          setError("We don't have streaming for this anime.")
          setStreamLoading(false)
          loadingRef.current = false
          return
        }
        showToast(
          `Refreshing source (${streamRetries.current[retryKey]}/${MAX_SERVER_RETRIES})…`
        )
      }

      const controller = new AbortController()
      streamAbortRef.current = controller

      try {
        // Backend cold-starts are real (~3s warm, ~9s cache-bypass,
        // longer after a spin-down). Generous timeout, with a healthy
        // "backend waking up" message if it actually times out.
        const timeoutId = setTimeout(
          () => controller.abort(),
          STREAM_FETCH_TIMEOUT
        )

        const res = await fetch(`${API_BASE}/api/v1/stream`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animeId: parseInt(animeId, 10),
            episode: epNumber,
            provider: source.provider,
            lang: source.lang,
            quality: 'auto',
            refresh: forceRefresh,
          }),
          cache: 'no-store',
        })
        clearTimeout(timeoutId)
        if (streamAbortRef.current === controller) streamAbortRef.current = null

        if (res.status >= 500) {
          // Backend explicitly says "no upstream response".
          setErrorType('backend')
          setError(
            "Backend is having trouble reaching an upstream source. Retrying automatically…"
          )
          // try one more time with backoff
          if (!forceRefresh) {
            await backoff(0, { base: 1_500, cap: 4_000 })
            if (activeSourceRef.current === sourceId && mountedRef.current) {
              loadingRef.current = false
              loadStream(sourceId, true)
              return
            }
          }
          setStreamLoading(false)
          loadingRef.current = false
          return
        }

        const data = await res.json().catch(() => ({}))
        if (!mountedRef.current) return

        if (data.error || !data.sources?.[0]?.url) {
          const cls = classifyStreamError(null, data)
          setErrorType(cls.type)
          setNoStreamError(cls.type === 'no-source' || !data.sources?.[0]?.url)
          setError(
            cls.type === 'no-source'
              ? "We don't have streaming for this anime."
              : cls.type === 'expired'
              ? 'Stream expired — try a different server.'
              : cls.type === 'blocked'
              ? 'This server is blocked in your region. Try a different server.'
              : data.error || 'No video source found'
          )
          setStreamLoading(false)
          loadingRef.current = false
          return
        }

        const firstSource = data.sources[0]
        const mediaSources = data.sources.filter((src) => src.type !== 'embed')
        if (mediaSources.length === 0) {
          setNoStreamError(true)
          setErrorType('no-source')
          setError('No video source found for this server.')
          setStreamLoading(false)
          loadingRef.current = false
          return
        }
        const qualityList = mediaSources.map((src, idx) => ({
          default: idx === 0,
          html: src.quality || 'Auto',
          url: src.url,
          type: src.type || 'hls',
        }))
        const subs = firstSource.subtitles || []
        const onBlocked = () => handleProviderBlockedRef.current?.()
        buildPlayer(
          qualityList[0].url,
          qualityList[0].type,
          qualityList,
          subs,
          data.headers,
          onBlocked
        )
        setCachedStream(source, data)
        setStreamLoading(false)
        loadingRef.current = false
        setRetryAttempt(0)
        return
      } catch (err) {
        const superseded = streamAbortRef.current !== controller
        if (streamAbortRef.current === controller) streamAbortRef.current = null
        if (superseded) return
        if (!mountedRef.current) return
        const cls = classifyStreamError(err, null)
        setErrorType(cls.type)
        if (err.name === 'AbortError') {
          setError(
            cls.type === 'timeout'
              ? 'The backend is taking too long to respond. It may be waking up — try again.'
              : 'Request cancelled.'
          )
        } else {
          setError(
            cls.type === 'network'
              ? 'Network error. Check your connection and try again.'
              : cls.type === 'backend'
              ? "Backend is having trouble reaching an upstream source. Retrying automatically…"
              : 'Failed to load stream. Check your connection and try again.'
          )
          // Auto-retry once on network/backend errors
          if (
            (cls.type === 'network' || cls.type === 'backend' || cls.type === 'timeout') &&
            streamRetries.current[retryKey] < MAX_SERVER_RETRIES
          ) {
            await backoff(streamRetries.current[retryKey] || 0, { base: 1_500, cap: 5_000 })
            if (activeSourceRef.current === sourceId && mountedRef.current) {
              loadingRef.current = false
              loadStream(sourceId, forceRefresh || true)
              return
            }
          }
        }
        setStreamLoading(false)
        loadingRef.current = false
        return
      }
    },
    [
      animeId,
      epNumber,
      SOURCES,
      showToast,
      buildPlayer,
    ]
  )

  // Helper: retry whatever was last attempted
  const retryLastStream = useCallback(() => {
    const last = lastStreamAttemptRef.current
    if (last) loadStream(last.sourceId, true)
    else if (activeSource) loadStream(activeSource, true)
  }, [loadStream, activeSource])

  // ────────────────────────────────────────────────────────────
  // Server list (with backoff retry, language fallback)
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!animeId || !epNumber) return
    let cancelled = false
    let retries = 0
    const base = `${API_BASE}/api/v1/servers?animeId=${animeId}&episode=${epNumber}`

    const fetchServers = async () => {
      try {
        const res = await fetch(`${base}&lang=sub`, { cache: 'no-store' })
        if (cancelled) return
        if (!res.ok) {
          if (retries < 2) {
            retries += 1
            setTimeout(fetchServers, 12_000)
          }
          return
        }
        const subServers = await res.json()
        if (cancelled) return
        let dubServers = []
        try {
          const dubRes = await fetch(`${base}&lang=dub`, { cache: 'no-store' })
          dubServers = dubRes.ok ? await dubRes.json() : []
        } catch {}
        if (cancelled) return
        const subs = Array.isArray(subServers) ? subServers : []
        const dubs = Array.isArray(dubServers) ? dubServers : []
        setServers((prev) => ({
          sub: subs.length > 0 ? subs : prev.sub,
          dub: dubs.length > 0 ? dubs : prev.dub,
        }))
        if (subs.length === 0 && dubs.length === 0) {
          setNoStreamError(true)
          setErrorType('no-source')
          setError("We don't have streaming for this anime.")
          setStreamLoading(false)
        }
        if ((subs.length === 0 || dubs.length === 0) && retries < 2) {
          retries += 1
          setTimeout(fetchServers, 12_000)
        }
      } catch {
        if (!cancelled && retries < 2) {
          retries += 1
          setTimeout(fetchServers, 12_000)
        }
      }
    }
    fetchServers()
    return () => {
      cancelled = true
    }
  }, [animeId, epNumber])

  // Load stream on active source / episode change
  const loadStreamRef = useRef(loadStream)
  loadStreamRef.current = loadStream

  // When a server's CDN blocks playback, try ONE cache-bypassing
  // refresh of that same server first — expired CDN tokens renew in
  // place this way, exactly like a fresh page load. Only if the
  // refreshed stream also fails does the source get marked blocked
  // and the switch to the next server happens.
  const handleProviderBlocked = useCallback(() => {
    const all = [...SOURCES.sub, ...SOURCES.dub]
    const current = activeSourceRef.current
    const now = Date.now()
    if (now - lastBlockCycleRef.current < 3_000) return
    lastBlockCycleRef.current = now
    if (current && !refreshAttemptedRef.current.has(current)) {
      refreshAttemptedRef.current.add(current)
      showToast('Stream expired — refreshing this server once…')
      loadStreamRef.current(current, true)
      return
    }
    if (current) blockedSourcesRef.current.add(current)
    // Stay within the selected language.
    const currentLang = current
      ? all.find((s) => s.id === current)?.lang
      : null
    const pool = currentLang ? all.filter((s) => s.lang === currentLang) : all
    const next = pool.find((s) => !blockedSourcesRef.current.has(s.id))
    if (next) {
      showToast(
        `Server blocked — switching to ${next.label} (${next.lang.toUpperCase()})…`
      )
      setActiveSource(next.id)
      return
    }
    if (!forceRefreshUsedRef.current && current) {
      forceRefreshUsedRef.current = true
      showToast('All servers blocked — retrying once…')
      loadStreamRef.current(current, true)
      return
    }
    destroyPlayer()
    setNoStreamError(true)
    setErrorType('no-source')
    setError("We don't have streaming for this anime.")
  }, [SOURCES, showToast, destroyPlayer])

  handleProviderBlockedRef.current = handleProviderBlocked

  useEffect(() => {
    if (!activeSource) return
    loadStreamRef.current(activeSource)
  }, [activeSource, epNumber])

  const handleSourceSwitch = useCallback(
    (sourceId) => {
      if (sourceId === activeSource) return
      const source = [...SOURCES.sub, ...SOURCES.dub].find(
        (s) => s.id === sourceId
      )
      if (source)
        showToast(`Switching to ${source.lang.toUpperCase()}…`)
      setActiveSource(sourceId)
      setError('')
      setNoStreamError(false)
      setErrorType('')
    },
    [activeSource, SOURCES, showToast]
  )

  // ────────────────────────────────────────────────────────────
  // Mobile gestures
  // ────────────────────────────────────────────────────────────
  const touchState = useRef({
    lastTap: 0,
    lastTapX: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
  })
  useEffect(() => {
    const container = playerContainerRef.current
    if (!container) return
    const onTouchStart = (e) => {
      if (e.target.closest && e.target.closest('.watch-touch-seek')) return
      setTouchSeekVisible(true)
      clearTimeout(touchSeekTimer.current)
      touchSeekTimer.current = setTimeout(
        () => setTouchSeekVisible(false),
        3_000
      )
      const touch = e.touches[0]
      const rect = container.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const w = rect.width
      const now = Date.now()
      touchState.current.touchStartX = x
      touchState.current.touchStartY = y
      touchState.current.touchStartTime = now
      const timeSince = now - touchState.current.lastTap
      const distFrom = Math.abs(x - touchState.current.lastTapX)
      if (timeSince < 300 && distFrom < 60) {
        e.preventDefault()
        const art = artInstance.current
        if (art) {
          const side = touchState.current.lastTapX < w / 2 ? 'left' : 'right'
          if (side === 'left') {
            art.video.currentTime = Math.max(0, art.video.currentTime - 10)
            showToast('−10s')
          } else {
            art.video.currentTime = Math.min(
              art.video.duration || Infinity,
              art.video.currentTime + 10
            )
            showToast('+10s')
          }
        }
        touchState.current.lastTap = 0
        touchState.current.lastTapX = 0
        return
      }
      touchState.current.lastTap = now
      touchState.current.lastTapX = x
    }
    const onTouchMove = (e) => {
      const touch = e.touches[0]
      const rect = container.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const w = rect.width
      const dx = x - touchState.current.touchStartX
      const dy = y - touchState.current.touchStartY
      if (Math.abs(dy) > 30 && Math.abs(dx) < Math.abs(dy) * 0.5) {
        e.preventDefault()
        const art = artInstance.current
        if (!art) return
        const isLeftSide = touchState.current.touchStartX < w / 2
        const delta = -dy / rect.height
        if (isLeftSide) {
          // Brightness control
          showToast(`Brightness ${Math.round((0.5 + delta * 0.5) * 100)}%`)
        } else {
          const newVol = Math.max(0, Math.min(1, art.volume + delta))
          art.volume = newVol
          if (artInstance.current) artInstance.current.muted = newVol === 0
          showToast(`Volume ${Math.round(newVol * 100)}%`)
        }
      }
    }
    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      clearTimeout(touchSeekTimer.current)
    }
  }, [showToast])

  // ────────────────────────────────────────────────────────────
  // Loading / NSFW gates
  // ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <div
          className="watch-skeleton"
          role="status"
          aria-label="Loading watch page"
          style={{ padding: '16px', maxWidth: 1280, margin: '0 auto' }}
        >
          <div className="watch-skel-player" />
          <div className="watch-skel-row">
            <div className="watch-skel-line w70" />
            <div className="watch-skel-line w40" />
          </div>
          <div className="watch-skel-row" style={{ gap: 12 }}>
            <div className="watch-skel-pill" />
            <div className="watch-skel-pill" />
            <div className="watch-skel-pill" />
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (isNsfw(anime) && !nsfwEnabled) {
    return (
      <>
        <div
          className="nsfw-gate"
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ fontSize: 60, marginBottom: 16 }}>18+</div>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Mature Content</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 460, margin: '0 auto 24px' }}>
            This anime contains adult content. Enable NSFW content in your
            settings to view it.
          </p>
          <Link
            to="/settings"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'var(--accent)',
              color: 'var(--bg)',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 600,
              minHeight: 44,
              lineHeight: '20px',
            }}
          >
            Open Settings
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Network banner */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="watch-offline-banner"
          style={{
            background: 'rgba(239,68,68,0.15)',
            color: '#fca5a5',
            textAlign: 'center',
            padding: '8px 12px',
            fontSize: 13,
            borderBottom: '1px solid rgba(239,68,68,0.3)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <FaExclamationTriangle style={{ verticalAlign: 'middle', marginRight: 6 }} />
          You are offline. Reconnect to continue streaming.
        </div>
      )}

      {/* Backend health banner (only when explicitly down) */}
      {!backendHealthy && isOnline && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: 'rgba(234,179,8,0.12)',
            color: '#fde68a',
            textAlign: 'center',
            padding: '8px 12px',
            fontSize: 13,
            borderBottom: '1px solid rgba(234,179,8,0.3)',
          }}
        >
          <FaSpinner
            className={PREFERS_REDUCED_MOTION ? '' : 'spin-anim'}
            style={{ verticalAlign: 'middle', marginRight: 6 }}
          />
          Some features may be limited — the backend is warming up.
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="watch-toast"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15,23,42,0.92)',
            color: '#e2e8f0',
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 80,
            boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
            animation: PREFERS_REDUCED_MOTION
              ? 'none'
              : 'watch-toast-in 200ms ease-out',
            maxWidth: '92vw',
            textAlign: 'center',
          }}
        >
          {toast.icon === 'wifi' && <FaWifi />}
          {toast.icon === 'ok' && (
            <FaCheckCircle style={{ color: '#34d399' }} />
          )}
          {toast.icon === 'warn' && (
            <FaExclamationTriangle style={{ color: '#fbbf24' }} />
          )}
          {toast.icon === 'signal' && <FaSignal />}
          {toast.msg}
        </div>
      )}

      <div
        className={`watch-page ${theaterMode ? 'theater' : ''}`}
        style={{
          maxWidth: theaterMode ? '100%' : 1280,
          margin: '0 auto',
          padding: theaterMode ? '0' : '16px',
          transition: PREFERS_REDUCED_MOTION
            ? 'none'
            : 'max-width 250ms ease, padding 250ms ease',
        }}
      >
        {/* Player container */}
        <div
          ref={playerContainerRef}
          className="watch-player"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            background: '#000',
            borderRadius: theaterMode ? 0 : 12,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div
            ref={artRef}
            className="watch-art-mount"
            style={{ width: '100%', height: '100%' }}
            aria-label="Anime video player"
            role="region"
          />

          {/* Touch-seek buttons (mobile) */}
          <button
            type="button"
            aria-label="Seek backward 10 seconds"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              const art = artInstance.current
              if (art) {
                art.video.currentTime = Math.max(0, art.video.currentTime - 10)
                showToast('−10s')
              }
            }}
            className="watch-touch-seek watch-touch-seek-left"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '30%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              opacity: touchSeekVisible ? 0.18 : 0,
              transition: PREFERS_REDUCED_MOTION
                ? 'none'
                : 'opacity 200ms ease',
              cursor: 'pointer',
              zIndex: 2,
              color: '#fff',
              fontSize: 28,
              display: IS_MOBILE ? 'block' : 'none',
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Seek forward 10 seconds"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              const art = artInstance.current
              if (art) {
                art.video.currentTime = Math.min(
                  art.video.duration || Infinity,
                  art.video.currentTime + 10
                )
                showToast('+10s')
              }
            }}
            className="watch-touch-seek watch-touch-seek-right"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '30%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              opacity: touchSeekVisible ? 0.18 : 0,
              transition: PREFERS_REDUCED_MOTION
                ? 'none'
                : 'opacity 200ms ease',
              cursor: 'pointer',
              zIndex: 2,
              color: '#fff',
              fontSize: 28,
              display: IS_MOBILE ? 'block' : 'none',
            }}
          >
            ›
          </button>

          {/* Buffering indicator */}
          {buffering && !streamLoading && (
            <div
              aria-live="polite"
              role="status"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                background: 'rgba(0,0,0,0.55)',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              <FaSpinner
                className={PREFERS_REDUCED_MOTION ? '' : 'spin-anim'}
              />
              Buffering…
            </div>
          )}

          {/* Loading */}
          {streamLoading && (
            <div
              className="watch-loading"
              role="status"
              aria-live="polite"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.55)',
                color: '#e2e8f0',
                zIndex: 4,
                textAlign: 'center',
                padding: 20,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 44,
                  height: 44,
                  border: '3px solid rgba(226,232,240,0.25)',
                  borderTopColor: '#e2e8f0',
                  borderRadius: '50%',
                  animation: PREFERS_REDUCED_MOTION
                    ? 'none'
                    : 'watch-spin 800ms linear infinite',
                  marginBottom: 12,
                }}
              />
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                Loading stream…
              </div>
              {slowStream && (
                <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
                  Stream is taking a while — try switching to another server.
                </div>
              )}
              {slowStream && (
                <button
                  type="button"
                  onClick={() => {
                    const sources = [...SOURCES.sub, ...SOURCES.dub]
                    const others = sources.filter(
                      (s) => s.id !== activeSource
                    )
                    if (others.length > 0) {
                      handleSourceSwitch(others[0].id)
                    } else {
                      loadStream(activeSource, true)
                    }
                  }}
                  style={{
                    marginTop: 12,
                    padding: '8px 16px',
                    background: 'rgba(226,232,240,0.12)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(226,232,240,0.2)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: 40,
                  }}
                >
                  Try another server
                </button>
              )}
            </div>
          )}

          {/* Error */}
          {error && !streamLoading && (
            <div
              className="watch-error"
              role="alert"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)',
                color: '#e2e8f0',
                zIndex: 4,
                textAlign: 'center',
                padding: 24,
              }}
            >
              <img
                src="/no-source.svg"
                alt=""
                aria-hidden="true"
                style={{ width: 84, height: 84, marginBottom: 16, opacity: 0.9 }}
              />
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  marginBottom: 8,
                  maxWidth: 460,
                }}
              >
                {error}
              </div>
              {errorType === 'backend' && (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    marginBottom: 12,
                    maxWidth: 460,
                  }}
                >
                  This usually clears up in a few seconds — the backend
                  cold-starts after idle.
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {!noStreamError && (
                  <button
                    type="button"
                    onClick={retryLastStream}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--accent)',
                      color: 'var(--bg)',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      minHeight: 44,
                    }}
                  >
                    <FaRedo /> Retry
                  </button>
                )}
                {!noStreamError && (
                  <button
                    type="button"
                    onClick={() => loadStream(activeSource, true)}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(226,232,240,0.12)',
                      color: '#e2e8f0',
                      border: '1px solid rgba(226,232,240,0.2)',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    Force refresh
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const sources = [...SOURCES.sub, ...SOURCES.dub]
                    const other = sources.find((s) => s.id !== activeSource)
                    if (other) handleSourceSwitch(other.id)
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(226,232,240,0.12)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(226,232,240,0.2)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Switch Server
                </button>
              </div>
            </div>
          )}

          {/* Resume */}
          {resumePos && (
            <div
              className="watch-resume"
              role="dialog"
              aria-label="Resume playback"
              style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(15,23,42,0.95)',
                color: '#e2e8f0',
                padding: '14px 18px',
                borderRadius: 12,
                zIndex: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                maxWidth: '92vw',
              }}
            >
              <div style={{ fontSize: 13 }}>
                Resume from{' '}
                <strong style={{ color: '#a5b4fc' }}>
                  {formatTime(resumePos)}
                </strong>
                ?
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                  Auto-resuming in {resumeCountdown}s
                </div>
              </div>
              <button
                type="button"
                onClick={handleResume}
                style={{
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 40,
                }}
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => {
                  setResumePos(null)
                  setResumeCountdown(0)
                }}
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 13,
                  cursor: 'pointer',
                  minHeight: 40,
                }}
              >
                Start Over
              </button>
            </div>
          )}
        </div>

        {/* Source selector */}
        <div
          className="watch-sources"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 14,
            marginBottom: 4,
            alignItems: 'center',
          }}
        >
          {['sub', 'dub']
            .filter((lang) => (lang === 'sub' ? hasSub : hasDub))
            .map((lang) => (
              <div
                key={lang}
                className="watch-source-group"
                style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    color: 'var(--text-muted)',
                    padding: '4px 8px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 6,
                  }}
                >
                  {lang === 'sub' ? 'SUB' : 'DUB'}
                </span>
                {SOURCES[lang].map((source) => {
                  const isActive = activeSource === source.id
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => handleSourceSwitch(source.id)}
                      className="watch-source-btn"
                      aria-pressed={isActive}
                      style={{
                        padding: '10px 16px',
                        background: isActive
                          ? 'rgba(99,102,241,0.15)'
                          : 'var(--bg-elevated)',
                        color: isActive ? '#a5b4fc' : 'var(--text-secondary)',
                        border: `1px solid ${
                          isActive ? 'rgba(99,102,241,0.4)' : 'var(--border)'
                        }`,
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        position: 'relative',
                        transition: PREFERS_REDUCED_MOTION
                          ? 'none'
                          : 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        minHeight: 40,
                      }}
                    >
                      {source.label}
                      {isActive && (
                        <span
                          aria-hidden="true"
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 99,
                            background: '#a5b4fc',
                            boxShadow: '0 0 6px rgba(165,180,252,0.6)',
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
        </div>

        {/* Mobile episode toggle */}
        {!isMovie && (
          <button
            type="button"
            onClick={() => setShowEpSidebar((p) => !p)}
            className="watch-ep-toggle"
            aria-expanded={showEpSidebar}
            style={{
              display: IS_MOBILE ? 'flex' : 'none',
              width: '100%',
              padding: '12px 14px',
              margin: '12px auto 0',
              maxWidth: 1200,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 44,
            }}
          >
            Episodes ({episodes.length}) {showEpSidebar ? '▲' : '▼'}
          </button>
        )}

        {/* Info + Episodes */}
        <div
          className="watch-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: showEpSidebar && !isMovie ? '1fr 320px' : '1fr',
            gap: 24,
            marginTop: 16,
            alignItems: 'flex-start',
          }}
        >
          <div className="watch-info">
            <h1
              style={{
                fontSize: 'clamp(20px, 4vw, 28px)',
                fontWeight: 700,
                margin: '8px 0 6px',
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              {anime?.title?.english || anime?.title?.romaji || 'Loading…'}
            </h1>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                marginBottom: 12,
              }}
            >
              {isMovie
                ? 'Movie'
                : `Episode ${epNumber} of ${episodes.length || '?'}`}{' '}
              · {currentSource?.lang?.toUpperCase() || 'SUB'} via{' '}
              {currentSource?.label || 'Server 1'}
            </div>

            <div
              className="watch-nav"
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}
            >
              {!isMovie && epNumber > 1 && (
                <button
                  type="button"
                  onClick={goPrev}
                  style={navBtnStyle}
                  aria-label="Previous episode"
                >
                  <FaStepBackward /> Previous
                </button>
              )}
              {!isMovie && epNumber < episodes.length && (
                <button
                  type="button"
                  onClick={goNext}
                  style={navBtnStyle}
                  aria-label="Next episode"
                >
                  Next <FaStepForward />
                </button>
              )}
            </div>

            <section className="watch-details" style={{ marginTop: 8 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Details
              </h3>
              {anime?.nextAiringEpisode && anime.nextAiringEpisode.airingAt && (
                <div
                  className="watch-detail-row"
                  style={{ marginBottom: 8, fontSize: 13 }}
                >
                  <strong style={{ color: 'var(--text-secondary)' }}>
                    Next Episode: Ep {anime.nextAiringEpisode.episode}
                  </strong>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {formatAiringDate(anime.nextAiringEpisode.airingAt)}
                  </div>
                </div>
              )}
              {anime?.status === 'FINISHED' && (
                <div
                  style={{
                    display: 'inline-block',
                    background: 'rgba(34,197,94,0.15)',
                    color: '#86efac',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  Completed
                </div>
              )}
              {anime?.description && (
                <div
                  className="watch-synopsis"
                  style={{ marginTop: 12, lineHeight: 1.6, fontSize: 14 }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 8,
                    }}
                  >
                    Synopsis
                  </h3>
                  <div
                    style={{ color: 'var(--text-primary)' }}
                    dangerouslySetInnerHTML={{
                      __html: anime.description.replace(/<[^>]*>/g, ''),
                    }}
                  />
                </div>
              )}
            </section>

            {anime && (
              <div id="watch-comments" style={{ marginTop: 32 }}>
                <Comments animeId={animeId} episodeNumber={epNumber} animeTitle={anime?.title?.english || anime?.title?.romaji || ''} />
              </div>
            )}
          </div>

          {/* Episode sidebar */}
          {!isMovie && (
            <aside
              className="watch-episodes"
              aria-label="Episode list"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 12,
                padding: 14,
                position: 'sticky',
                top: 16,
                maxHeight: 'calc(100vh - 32px)',
                overflowY: 'auto',
                display:
                  !showEpSidebar && IS_MOBILE ? 'none' : 'block',
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Episodes ({episodes.length})
              </h3>

              {episodes.length > EPISODES_PER_PAGE && (
                <div
                  className="watch-ep-search"
                  style={{ position: 'relative', marginBottom: 8 }}
                >
                  <FaSearch
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                    }}
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={epSearch}
                    onChange={(e) => {
                      setEpSearch(e.target.value)
                      setEpPage(0)
                    }}
                    placeholder="Search episodes…"
                    aria-label="Search episodes"
                    style={{
                      width: '100%',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 10px 8px 30px',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      boxSizing: 'border-box',
                      outline: 'none',
                      minHeight: 36,
                    }}
                  />
                </div>
              )}

              {totalEpPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    fontSize: 11,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEpPage((p) => Math.max(0, p - 1))}
                    disabled={epPage === 0}
                    aria-label="Previous page"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      cursor: epPage === 0 ? 'default' : 'pointer',
                      opacity: epPage === 0 ? 0.4 : 1,
                      minHeight: 32,
                    }}
                  >
                    ←
                  </button>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {epPage + 1}/{totalEpPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEpPage((p) => Math.min(totalEpPages - 1, p + 1))
                    }
                    disabled={epPage >= totalEpPages - 1}
                    aria-label="Next page"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      cursor:
                        epPage >= totalEpPages - 1 ? 'default' : 'pointer',
                      opacity: epPage >= totalEpPages - 1 ? 0.4 : 1,
                      minHeight: 32,
                    }}
                  >
                    →
                  </button>
                </div>
              )}

              <div className="watch-ep-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pagedEps.map((ep, i) => {
                  const num = ep.number || i + 1
                  const isActive = num === epNumber
                  const slug = generateSlug(
                    anime?.title?.english || anime?.title?.romaji || ''
                  )
                  return (
                    <Link
                      key={num}
                      to={`/watch/${slug}-${animeId}-episode-${num}`}
                      aria-current={isActive ? 'true' : 'false'}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = 'rgba(226,232,240,0.05)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = 'transparent'
                      }}
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        padding: 8,
                        borderRadius: 8,
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        background: isActive
                          ? 'rgba(99,102,241,0.12)'
                          : 'transparent',
                        border: isActive
                          ? '1px solid rgba(99,102,241,0.35)'
                          : '1px solid transparent',
                        minHeight: 44,
                      }}
                    >
                      {ep.thumbnail ? (
                        <img
                          src={ep.thumbnail}
                          alt={`Episode ${num}`}
                          loading="lazy"
                          style={{
                            width: 80,
                            height: 45,
                            objectFit: 'cover',
                            borderRadius: 6,
                            flexShrink: 0,
                            background: 'var(--bg-elevated)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 80,
                            height: 45,
                            borderRadius: 6,
                            background: 'var(--bg-elevated)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            flexShrink: 0,
                          }}
                        >
                          {num}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ep.title || `Episode ${num}`}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 2,
                          }}
                        >
                          EP {num}
                          {ep.filler && (
                            <span
                              style={{
                                background: 'rgba(234,179,8,0.15)',
                                color: '#fde68a',
                                padding: '1px 5px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              FILLER
                            </span>
                          )}
                          {ep.recap && (
                            <span
                              style={{
                                background: 'rgba(99,102,241,0.15)',
                                color: '#a5b4fc',
                                padding: '1px 5px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              RECAP
                            </span>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 99,
                            background: '#a5b4fc',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Link>
                  )
                })}
                {pagedEps.length === 0 && (
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      padding: 16,
                      fontSize: 12,
                    }}
                  >
                    {epSearch
                      ? 'No episodes match your search'
                      : 'No episodes listed'}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Comments FAB */}
      {anime && (
        <button
          type="button"
          onClick={() =>
            document
              .getElementById('watch-comments')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          aria-label="Jump to comments"
          className="watch-comments-fab"
          style={{
            position: 'fixed',
            bottom: `calc(20px + env(safe-area-inset-bottom, 0px))`,
            right: `calc(20px + env(safe-area-inset-right, 0px))`,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: 999,
            padding: '12px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            minHeight: 48,
          }}
        >
          <FaCommentDots /> Comments
        </button>
      )}

      <Footer />

      {/* Inject keyframes (only once, via global CSS this duplicates
          only when the user navigates back; harmless either way) */}
      <style>{`
        @keyframes watch-toast-in {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes watch-spin {
          to { transform: rotate(360deg); }
        }
        .spin-anim { animation: watch-spin 1s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .spin-anim, [style*="watch-toast-in"], [style*="watch-spin"] {
            animation: none !important;
          }
        }
        .watch-page { word-break: break-word; }
        .watch-art-mount video {
          background: #000;
        }
        /* High-contrast support */
        @media (prefers-contrast: more) {
          .watch-source-btn { border-width: 2px !important; }
        }
      `}</style>
    </>
  )
}

const navBtnStyle = {
  background: 'var(--bg-card)',
  padding: '10px 18px',
  borderRadius: 8,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontWeight: 500,
  minHeight: 44,
  border: '1px solid var(--border)',
  transition: 'all 0.15s',
  cursor: 'pointer',
}
