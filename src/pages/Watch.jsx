import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Artplayer from 'artplayer'
import Hls from 'hls.js'
import { FaStepForward, FaStepBackward, FaSearch, FaExclamationTriangle } from 'react-icons/fa'
import { API_BASE, PROXY_BASE } from '../config'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const EPISODES_PER_PAGE = 50

let toastTimer = null

function formatAiringDate(unixTimestamp) {
  if (!unixTimestamp) return ''
  const date = new Date(unixTimestamp * 1000)
  const now = new Date()
  const diffMs = date - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
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
    if (diffDays > 0) {
      countdown = `— in ${diffDays}d ${diffHours}h`
    } else if (diffHours > 0) {
      countdown = `— in ${diffHours}h ${diffMins}m`
    } else {
      countdown = `— in ${diffMins}m`
    }
    return `${formattedDate} ${countdown}`
  }
  return formattedDate
}

function useKeyboardShortcuts(playerRef, videoRef, options) {
  const { onNext, onPrev, sources, activeSource, setActiveSource, showToast, theaterMode, setTheaterMode, containerRef } = options
  const toastTimeoutRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      const art = playerRef.current
      const video = videoRef?.current
      if (!art && e.code !== 'KeyN' && e.code !== 'KeyB') return

      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

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
          art.video.currentTime = Math.min(art.video.duration || Infinity, art.video.currentTime + 10)
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
        if (art) art.pip = !art.pip
        return
      }

      if (key === 'KeyT') {
        e.preventDefault()
        setTheaterMode(p => {
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
          showToast(art.muted ? 'Muted' : `Volume ${Math.round(art.volume * 100)}%`)
        }
        return
      }

      if (key === 'KeyC') {
        e.preventDefault()
        if (art) {
          const subtitles = art._aureliaSubtitles || []
          if (subtitles.length > 0) {
            const currentSub = art.subtitle?.url
            const currentIdx = subtitles.findIndex(s => s.url === currentSub)
            const nextIdx = (currentIdx + 1) % (subtitles.length + 1)
            if (nextIdx === 0 || nextIdx >= subtitles.length) {
              art.subtitle = null
              showToast('Subtitles Off')
            } else {
              const sub = subtitles[nextIdx]
              art.subtitle = {
                url: `${PROXY_BASE}/proxy?url=${encodeURIComponent(sub.url)}`,
                type: 'srt',
              }
              showToast(`Subtitles: ${sub.label || 'Track ' + nextIdx}`)
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
        const currentIdx = allSources.findIndex(s => s.id === activeSource)
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
        const currentIdx = allSources.findIndex(s => s.id === activeSource)
        let nextIdx = (currentIdx + 1) % allSources.length
        let attempts = 0
        while (allSources[nextIdx]?.id === activeSource && attempts < allSources.length) {
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
          const idx = speeds.findIndex(s => s >= current)
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
          const idx = speeds.findIndex(s => s > current)
          const next = idx >= 0 ? speeds[idx] : speeds[speeds.length - 1]
          art.video.playbackRate = next
          showToast(`Speed ${next}x`)
        }
        return
      }

      if (key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        }
        setTheaterMode(false)
        return
      }
    }

    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [playerRef, videoRef, onNext, onPrev, sources, activeSource, setActiveSource, showToast, theaterMode, setTheaterMode])
}

function formatTime(s) {
  if (typeof s !== 'number' || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Watch() {
  const { animeName } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const artRef = useRef(null)
  const artInstance = useRef(null)
  const hlsInstance = useRef(null)
  const loadingRef = useRef(false)
  const playerContainerRef = useRef(null)

  const [anime, setAnime] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [streamLoading, setStreamLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSource, setActiveSource] = useState('miruro-sub')
  const [epSearch, setEpSearch] = useState('')
  const [toast, setToast] = useState('')
  const [hasDub, setHasDub] = useState(false)
  const [embedUrl, setEmbedUrl] = useState('')
  const [theaterMode, setTheaterMode] = useState(false)
  const [resumePos, setResumePos] = useState(null)
  const [resumeCountdown, setResumeCountdown] = useState(0)

  const epNumber = parseInt(animeName?.split('-episode-')?.[1] || '1', 10)
  const animeId = animeName?.split('-episode-')?.[0] || animeName?.split('-')?.[0] || '1'
  const baseName = animeName?.replace(/-episode-\d+$/, '') || animeId

  const showToast = useCallback((msg, icon) => {
    setToast({ msg, icon })
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => setToast(''), 2500)
  }, [])

  const SOURCES = useMemo(() => ({
    sub: [
      { id: 'miruro-sub', label: 'Miruro', provider: 'miruro', lang: 'sub' },
      { id: 'senshi-sub', label: 'Senshi', provider: 'senshi', lang: 'sub' },
    ],
    dub: hasDub ? [
      { id: 'miruro-dub', label: 'Miruro', provider: 'miruro', lang: 'dub' },
    ] : [],
  }), [hasDub])

  const filteredEps = useMemo(() => {
    if (!epSearch) return episodes
    const q = epSearch.toLowerCase()
    return episodes.filter(ep =>
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

  const goNext = useCallback(() => {
    if (epNumber < episodes.length) {
      navigate(`/watch/${baseName}-episode-${epNumber + 1}`)
    }
  }, [epNumber, episodes, baseName, navigate])

  const goPrev = useCallback(() => {
    if (epNumber > 1) {
      navigate(`/watch/${baseName}-episode-${epNumber - 1}`)
    }
  }, [epNumber, baseName, navigate])

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

  // Fetch anime + episodes + hasDub
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/v1/anime/${animeId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/v1/anime/${animeId}/episodes`).then(r => r.ok ? r.json() : { episodes: [] }).catch(() => ({ episodes: [] })),
      fetch(`${API_BASE}/api/v1/miruro/has-dub/${animeId}`).then(r => r.ok ? r.json() : { hasDub: false }).catch(() => ({ hasDub: false })),
    ]).then(([animeData, epData, dubData]) => {
      setAnime(animeData)
      setEpisodes(epData.episodes || [])
      setHasDub(dubData.hasDub || false)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [animeId])

  // Check for resume position on mount
  useEffect(() => {
    if (!animeId || !epNumber) return
    try {
      const raw = JSON.parse(localStorage.getItem('aurelia-watch-history') || '[]')
      const entry = raw.find(h => String(h.animeId) === String(animeId) && h.episode === epNumber)
      if (entry && entry.time > 30) {
        setResumePos(entry.time)
        let count = 3
        setResumeCountdown(count)
        const interval = setInterval(() => {
          count--
          if (count <= 0) {
            clearInterval(interval)
            setResumeCountdown(0)
          } else {
            setResumeCountdown(count)
          }
        }, 1000)
        return () => clearInterval(interval)
      }
    } catch {}
  }, [animeId, epNumber])

  const handleResume = useCallback(() => {
    const art = artInstance.current
    if (art && resumePos) {
      art.video.currentTime = resumePos
    }
    setResumePos(null)
    setResumeCountdown(0)
  }, [resumePos])

  // Auto-resume countdown handler
  useEffect(() => {
    if (resumeCountdown > 0 || !resumePos) return
    handleResume()
  }, [resumeCountdown, resumePos, handleResume])

  const destroyPlayer = useCallback(() => {
    if (hlsInstance.current) {
      hlsInstance.current.destroy()
      hlsInstance.current = null
    }
    if (artInstance.current) {
      artInstance.current.destroy(false)
      artInstance.current = null
    }
  }, [])

  useEffect(() => () => destroyPlayer(), [destroyPlayer])

  const getFallbackChain = useCallback((sourceId) => {
    for (const lang of ['sub', 'dub']) {
      const idx = SOURCES[lang].findIndex(s => s.id === sourceId)
      if (idx !== -1) return SOURCES[lang].slice(idx)
    }
    return [SOURCES.sub[0]]
  }, [SOURCES])

  const buildPlayer = useCallback((streamUrl, qualityList, subtitles, headers) => {
    destroyPlayer()
    const container = artRef.current
    if (!container) return

    const headersParam = headers ? `&headers=${encodeURIComponent(JSON.stringify(headers))}` : ''

    const playerConfig = {
      container,
      url: streamUrl,
      type: 'm3u8',
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
      lang: navigator.language.toLowerCase() === 'zh-cn' ? 'zh-cn' : 'en',
      moreVideoAttr: {
        crossOrigin: 'anonymous',
        preload: 'auto',
        playsInline: true,
      },
      settings: [
        {
          width: 200,
          html: 'Subtitle Size',
          selector: [
            { default: true, html: '<span style="font-size:12px">Small</span>', style: { color: '#fff' }, callback: () => { document.querySelectorAll('.art-subtitle-wrap span').forEach(el => el.style.fontSize = '14px') } },
            { html: '<span style="font-size:14px">Medium</span>', style: { color: '#fff' }, callback: () => { document.querySelectorAll('.art-subtitle-wrap span').forEach(el => el.style.fontSize = '18px') } },
            { html: '<span style="font-size:16px">Large</span>', style: { color: '#fff' }, callback: () => { document.querySelectorAll('.art-subtitle-wrap span').forEach(el => el.style.fontSize = '22px') } },
          ],
          onSelect: function (item) { return item.html }
        }
      ],
      playbackRate: true,
      quality: qualityList,
      customType: {
        m3u8: function (video, url, art) {
          if (Hls.isSupported()) {
            if (art.hls) {
              art.hls.destroy()
            }
            const hls = new Hls({
              enableWorker: true,
              maxBufferLength: 30,
              maxMaxBufferLength: 120,
              startFragPrefetch: true,
              lowLatencyMode: false,
              backBufferLength: 30,
              appendInSequenceGaps: true,
              maxBufferHole: 1.0,
              forceKeyFrameOnDiscontinuity: true,
              maxRecoveryAttempts: 10,
              manifestLoadingMaxRetry: 10,
              levelLoadingMaxRetry: 10,
              fragLoadingMaxRetry: 10,
            })

            let recoveryAttempts = 0
            const maxRecoveryAttempts = 5

            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (!data.fatal) return
              if (recoveryAttempts >= maxRecoveryAttempts) return
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad()
                recoveryAttempts++
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.swapAudioCodec()
                hls.recoverMediaError()
                recoveryAttempts++
              }
            })

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {})
            })

            hls.loadSource(url)
            hls.attachMedia(video)
            art.hls = hls
            art.on('destroy', () => hls.destroy())
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url
          }
        }
      },
    }

    if (subtitles && subtitles.length > 0) {
      playerConfig.subtitle = {
        url: `${PROXY_BASE}/proxy?url=${encodeURIComponent(subtitles[0].url)}${headersParam}`,
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

    const art = new Artplayer(playerConfig)

    if (subtitles && subtitles.length > 1) {
      art._aureliaSubtitles = subtitles
    }

    // Auto next episode
    art.on('video:ended', () => {
      if (epNumber < episodes.length) {
        navigate(`/watch/${baseName}-episode-${epNumber + 1}`)
      }
    })

    // Save watch history
    let lastSave = 0
    art.on('video:timeupdate', () => {
      const now = Date.now()
      if (now - lastSave < 10000) return
      lastSave = now
      const title = anime?.title?.english || anime?.title?.romaji || animeId
      try {
        const entry = {
          animeId, title, episode: epNumber,
          time: Math.floor(art.video.currentTime),
          timestamp: now,
          image: anime?.coverImage?.large || '',
        }
        const raw = JSON.parse(localStorage.getItem('aurelia-watch-history') || '[]')
        const filtered = raw.filter(h => !(String(h.animeId) === String(animeId) && h.episode === epNumber))
        filtered.unshift(entry)
        localStorage.setItem('aurelia-watch-history', JSON.stringify(filtered.slice(0, 100)))
      } catch {}

      if (user) {
        Promise.resolve(supabase.from('watch_history').upsert({
          user_id: user.id,
          anime_id: parseInt(animeId, 10),
          anime_title: anime?.title?.english || anime?.title?.romaji || '',
          anime_image: anime?.coverImage?.large || '',
          episode_number: epNumber,
          progress: Math.floor(art.video.currentTime),
          duration: art.video.duration || 0,
          timestamp: now,
        }, { onConflict: 'user_id,anime_id,episode_number' })).catch(() => {})
      }
    })

    artInstance.current = art
  }, [animeId, anime, epNumber, episodes, baseName, navigate, destroyPlayer])

  const loadStream = useCallback(async (sourceId) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setStreamLoading(true)
    setError('')
    setEmbedUrl('')
    setResumePos(null)

    const chain = getFallbackChain(sourceId)

    for (let i = 0; i < chain.length; i++) {
      const source = chain[i]
      if (i > 0) showToast('Loading stream...')

      try {
        const res = await fetch(`${API_BASE}/api/v1/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animeId: parseInt(animeId, 10),
            episode: epNumber,
            provider: source.provider,
            lang: source.lang,
            quality: 'auto',
          }),
        })
        const data = await res.json()

        if (data.error || !data.sources?.[0]?.url) {
          if (i < chain.length - 1) continue
          setError(data.error || 'No video source found')
          setStreamLoading(false)
          loadingRef.current = false
          return
        }

        const firstSource = data.sources[0]

        if (firstSource.type === 'embed') {
          destroyPlayer()
          setEmbedUrl(firstSource.url)
          setStreamLoading(false)
          loadingRef.current = false
          return
        }

        const headersParam = data.headers ? `&headers=${encodeURIComponent(JSON.stringify(data.headers))}` : ''
        
        const qualityList = data.sources.map((src, idx) => ({
          default: idx === 0,
          html: src.quality || 'Auto',
          url: `${PROXY_BASE}/proxy?url=${encodeURIComponent(src.url)}${headersParam}`,
        }))

        const defaultUrl = qualityList[0]?.url || ''

        const subs = firstSource.subtitles || []
        buildPlayer(defaultUrl, qualityList, subs, data.headers)
        setStreamLoading(false)
        loadingRef.current = false
        return
      } catch (err) {
        if (i < chain.length - 1) continue
        setError('Failed to load stream')
        setStreamLoading(false)
        loadingRef.current = false
        return
      }
    }
    setStreamLoading(false)
    loadingRef.current = false
  }, [animeId, epNumber, getFallbackChain, showToast, buildPlayer, destroyPlayer])

  // Load stream on episode/source change
  useEffect(() => {
    loadStream(activeSource)
  }, [activeSource, epNumber, loadStream])

  const handleSourceSwitch = useCallback((sourceId) => {
    if (sourceId === activeSource) return
    const source = [...SOURCES.sub, ...SOURCES.dub].find(s => s.id === sourceId)
    if (source) showToast(`Switching to ${source.lang.toUpperCase()}...`)
    setActiveSource(sourceId)
    setError('')
  }, [activeSource, SOURCES, showToast])

  // Mobile gestures
  const touchState = useRef({ lastTap: 0, lastTapX: 0, touchStartX: 0, touchStartY: 0, touchStartTime: 0 })
  useEffect(() => {
    const container = playerContainerRef.current
    if (!container) return

    const onTouchStart = (e) => {
      const touch = e.touches[0]
      const rect = container.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const w = rect.width
      const now = Date.now()

      touchState.current.touchStartX = x
      touchState.current.touchStartY = y
      touchState.current.touchStartTime = now

      // Double-tap detection
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
            art.video.currentTime = Math.min(art.video.duration || Infinity, art.video.currentTime + 10)
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
          // Brightness control - just show feedback
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
    }
  }, [showToast])

  const currentSource = SOURCES.sub.find(s => s.id === activeSource)
    || SOURCES.dub.find(s => s.id === activeSource)
    || SOURCES.sub[0]

  if (loading) {
    return (
      <>
        <NavBar />
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff' }}>
      <NavBar />

      {/* Toast notification */}
      {toast && (
        <div className="aurelia-toast" style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.88)', color: '#e2e8f0', padding: '8px 20px',
          borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999,
          border: '1px solid rgba(226,232,240,0.12)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          pointerEvents: 'none', transition: 'opacity 0.2s',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Player Container */}
      <div ref={playerContainerRef} className="watch-player-wrapper" style={{
        position: 'relative', maxWidth: theaterMode ? '100%' : 1200,
        margin: '0 auto', background: '#000',
        transition: 'max-width 0.3s ease',
      }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            style={{ width: '100%', aspectRatio: '16/9', maxHeight: '80vh', border: 'none' }}
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups"
            title="Embedded player"
          />
        ) : (
          <div ref={artRef} style={{ width: '100%', aspectRatio: '16/9', maxHeight: '80vh' }} />
        )}

        {streamLoading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', zIndex: 50, backdropFilter: 'blur(4px)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, border: '3px solid rgba(226,232,240,0.2)',
                borderTopColor: '#e2e8f0', borderRadius: '50%',
                animation: 'spin 1s linear infinite', margin: '0 auto 16px',
              }} />
              <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>Loading stream...</p>
            </div>
          </div>
        )}

        {error && !streamLoading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)',
            padding: 24, textAlign: 'center', zIndex: 50,
          }}>
            <FaExclamationTriangle size={32} color="#f59e0b" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{error}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20, maxWidth: 360 }}>
              Aniraku does not host video. Try another server or check your connection.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { loadingRef.current = false; loadStream(activeSource) }} style={{
                background: 'rgba(226,232,240,0.15)', color: '#e2e8f0', border: '1px solid rgba(226,232,240,0.2)',
                borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Retry</button>
              <Link to={`/anime/${animeId}`} style={{
                background: 'transparent', color: 'var(--accent)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>Anime Details</Link>
            </div>
          </div>
        )}

        {/* Resume overlay */}
        {resumePos && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)',
            zIndex: 60, backdropFilter: 'blur(4px)',
          }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Resume from {formatTime(resumePos)}?
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
              Auto-resuming in {resumeCountdown}s
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleResume} style={{
                background: 'rgba(226,232,240,0.15)', color: '#e2e8f0',
                border: '1px solid rgba(226,232,240,0.2)', borderRadius: 8,
                padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Resume</button>
              <button onClick={() => setResumePos(null)} style={{
                background: 'transparent', color: 'var(--text-muted)',
                border: '1px solid var(--border)', borderRadius: 8,
                padding: '10px 24px', fontSize: 13, cursor: 'pointer',
              }}>Start Over</button>
            </div>
          </div>
        )}

      </div>

      {/* Source selector */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 0' }}>
        {['sub', 'dub'].filter(lang => lang !== 'dub' || hasDub).map(lang => (
          <div key={lang} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700,
            }}>
              {lang === 'sub' ? 'SUB' : 'DUB'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {SOURCES[lang].map(source => {
                const isActive = activeSource === source.id
                return (
                  <button
                    key={source.id}
                    onClick={() => handleSourceSwitch(source.id)}
                    className="watch-source-btn"
                    style={{
                      padding: '10px 20px',
                      background: isActive ? 'rgba(226,232,240,0.1)' : 'var(--bg-elevated)',
                      color: isActive ? '#e2e8f0' : 'var(--text-secondary)',
                      border: `1px solid ${isActive ? 'rgba(226,232,240,0.2)' : 'var(--border)'}`,
                      borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      position: 'relative', transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    {source.label}
                    {isActive && (
                      <div style={{
                        position: 'absolute', bottom: -1, left: '15%', right: '15%',
                        height: 2, background: '#e2e8f0', borderRadius: 1,
                      }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Info + Episodes */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '20px 16px',
        display: 'flex', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
            {anime?.title?.english || anime?.title?.romaji || 'Loading...'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            Episode {epNumber} of {episodes.length || '?'} · {currentSource?.lang?.toUpperCase() || 'SUB'} via {currentSource?.label || 'Server 1'}
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {epNumber > 1 && (
              <Link to={`/watch/${baseName}-episode-${epNumber - 1}`} style={navBtnStyle}>
                <FaStepBackward size={12} /> Previous
              </Link>
            )}
            {epNumber < episodes.length && (
              <Link to={`/watch/${baseName}-episode-${epNumber + 1}`} style={navBtnStyle}>
                Next <FaStepForward size={12} />
              </Link>
            )}
            <Link to={`/anime/${animeId}`} style={navBtnStyle}>Details</Link>
          </div>

          {anime?.nextAiringEpisode && anime.nextAiringEpisode.airingAt && (
            <div style={{
              marginTop: 16, padding: '10px 16px', borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))',
              border: '1px solid rgba(34,197,94,0.2)',
            }}>
              <p style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
                Next Episode: Ep {anime.nextAiringEpisode.episode}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                {formatAiringDate(anime.nextAiringEpisode.airingAt)}
              </p>
            </div>
          )}
          {anime?.status === 'FINISHED' && (
            <div style={{
              marginTop: 16, padding: '10px 16px', borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Completed</p>
            </div>
          )}

          {anime?.description && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Synopsis</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, maxHeight: 120, overflow: 'hidden' }}>
                {anime.description.replace(/<[^>]*>/g, '')}
              </p>
            </div>
          )}
        </div>

        {/* Episode sidebar */}
        <div className="watch-episode-sidebar" style={{ width: 340, flexShrink: 0, minWidth: 0 }}>
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>
            Episodes ({episodes.length})
          </h3>

          {episodes.length > EPISODES_PER_PAGE && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={epSearch}
                  onChange={e => { setEpSearch(e.target.value); setEpPage(0) }}
                  placeholder="Search episodes..."
                  style={{
                    width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 10px 8px 30px', color: 'var(--text-primary)',
                    fontSize: 12, boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>
              {totalEpPages > 1 && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setEpPage(p => Math.max(0, p - 1))} disabled={epPage === 0}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-secondary)', fontSize: 11, cursor: epPage === 0 ? 'default' : 'pointer', opacity: epPage === 0 ? 0.4 : 1 }}>←</button>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>{epPage + 1}/{totalEpPages}</span>
                  <button onClick={() => setEpPage(p => Math.min(totalEpPages - 1, p + 1))} disabled={epPage >= totalEpPages - 1}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-secondary)', fontSize: 11, cursor: epPage >= totalEpPages - 1 ? 'default' : 'pointer', opacity: epPage >= totalEpPages - 1 ? 0.4 : 1 }}>→</button>
                </div>
              )}
            </div>
          )}

          <div style={{
            maxHeight: 500, overflowY: 'auto',
            background: 'var(--bg-elevated)', borderRadius: 10,
            border: '1px solid var(--border)',
          }}>
            {pagedEps.map((ep, i) => {
              const num = ep.number || i + 1
              const isActive = num === epNumber
              return (
                <Link
                  key={num}
                  to={`/watch/${baseName}-episode-${num}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border)',
                    textDecoration: 'none',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(226,232,240,0.06)' : 'transparent',
                    fontSize: 13, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(226,232,240,0.03)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  {ep.thumbnail ? (
                    <img
                      src={ep.thumbnail}
                      alt={`Episode ${num}`}
                      style={{
                        width: 48, height: 28, borderRadius: 4, objectFit: 'cover',
                        flexShrink: 0, background: 'var(--bg-card)',
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <span style={{ width: 28, textAlign: 'right', fontWeight: 700, fontSize: 12, color: isActive ? '#e2e8f0' : 'var(--text-muted)' }}>{num}</span>
                  )}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ep.title || `Episode ${num}`}
                  </span>
                  {ep.filler && <span style={{ background: '#f59e0b', color: '#000', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>FILLER</span>}
                  {ep.recap && <span style={{ background: '#6366f1', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>RECAP</span>}
                  {isActive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />}
                </Link>
              )
            })}
            {pagedEps.length === 0 && (
              <p style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                {epSearch ? 'No episodes match your search' : 'No episodes listed'}
              </p>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .watch-source-btn:hover { background: rgba(226,232,240,0.06) !important; border-color: rgba(226,232,240,0.2) !important; }
        .art-bottom { padding: 0 12px !important; }
        .art-settings { border-radius: 10px !important; overflow: hidden !important; }
        .art-settings .art-settings-build { max-height: 50vh; overflow-y: auto; }
        .art-video-player { border-radius: 0; }
        .art-subtitle-wrap span { line-height: 1.4 !important; }

        @media (max-width: 768px) {
          .watch-player-wrapper { max-width: 100% !important; }
          .watch-episode-sidebar { width: 100% !important; flex-shrink: 1 !important; max-height: none !important; }
          .art-bottom { padding: 0 8px 4px !important; }
          .art-control-progress .art-control-progress-inner { height: 20px !important; top: -8px !important; }
          .art-setting-panel { border-radius: 8px !important; max-height: 60vh !important; overflow-y: auto !important; }
          .art-contextmenus { border-radius: 8px !important; max-height: 60vh !important; overflow-y: auto !important; }
          .art-subtitle-wrap span { font-size: 18px !important; }
        }

        @media (min-width: 769px) {
          .watch-player-wrapper { max-width: 1200px !important; }
          .watch-episode-sidebar { max-height: 600px !important; overflow-y: auto !important; }
        }

        @media (max-width: 640px) {
          .watch-source-btn { flex: 1 1 auto !important; min-width: 0 !important; }
        }
      `}</style>
    </div>
  )
}

const navBtnStyle = {
  background: 'var(--bg-card)',
  padding: '8px 16px',
  borderRadius: 8,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontWeight: 500,
  border: '1px solid var(--border)',
  transition: 'all 0.15s',
}
