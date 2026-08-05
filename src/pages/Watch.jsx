import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FaStepForward, FaStepBackward, FaSearch, FaCommentDots } from 'react-icons/fa'
import { API_BASE, PROXY_BASE } from '../config'
import { anilistQuery, ANIME_DETAIL_QUERY } from '../lib/anilist'
import Footer from '../components/Footer/Footer'
import Comments from '../components/Comments/Comments'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { isNsfw, useNsfw } from '../hooks/useNsfw'
import { setWatchSEO } from '../lib/seo'
import { extractIdFromSlug, generateSlug } from '../lib/slug'

const EPISODES_PER_PAGE = 50

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
          const subtitles = art._anirakuSubtitles || []
          if (subtitles.length > 0) {
            const currentSub = art.subtitle?.url
            const currentIdx = subtitles.findIndex(s => s.url === currentSub)
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
                art.subtitle = {
                  url: sub.url,
                  type: 'srt',
                }
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
  const { slugId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { nsfwEnabled } = useNsfw()

  const artRef = useRef(null)
  const artInstance = useRef(null)
  const hlsInstance = useRef(null)
  const loadingRef = useRef(false)
  const playerContainerRef = useRef(null)
  const touchSeekTimer = useRef(null)
  const buildIdRef = useRef(0)
  const mountedRef = useRef(true)
  const requestSeqRef = useRef(0)
  const pendingRequestRef = useRef(null)
  const toastTimerRef = useRef(null)

  const [anime, setAnime] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [streamLoading, setStreamLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSource, setActiveSource] = useState('')
  const [epSearch, setEpSearch] = useState('')
  const [toast, setToast] = useState('')
  const [servers, setServers] = useState({ sub: [], dub: [] })
  const [embedUrl, setEmbedUrl] = useState('')
  const [theaterMode, setTheaterMode] = useState(false)
  const [resumePos, setResumePos] = useState(null)
  const [resumeCountdown, setResumeCountdown] = useState(0)
  const [showEpSidebar, setShowEpSidebar] = useState(true)
  const [touchSeekVisible, setTouchSeekVisible] = useState(false)

  const slugParts = slugId?.match(/^(.+)-episode-(\d+)$/)
  const baseName = slugParts?.[1] || slugId || ''
  const epNumber = parseInt(slugParts?.[2] || '1', 10)
  const animeId = extractIdFromSlug(baseName)
  const isMovie = anime?.format === 'MOVIE'

  const routeRef = useRef(slugId)
  routeRef.current = slugId
  const epNumberRef = useRef(epNumber)
  epNumberRef.current = epNumber
  const episodesRef = useRef(episodes)
  episodesRef.current = episodes

  const activeSourceRef = useRef(activeSource)
  activeSourceRef.current = activeSource
  const blockedSourcesRef = useRef(new Set())
  const lastBlockCycleRef = useRef(0)
  const forceRefreshUsedRef = useRef(false)
  const handleProviderBlockedRef = useRef(null)

  // Reset per-episode block tracking when the anime or episode changes
  useEffect(() => {
    blockedSourcesRef.current = new Set()
    lastBlockCycleRef.current = 0
    forceRefreshUsedRef.current = false
    streamRetries.current = {}
  }, [animeId, epNumber])

  const showToast = useCallback((msg, icon) => {
    setToast({ msg, icon })
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 2500)
  }, [])

  const SOURCES = useMemo(() => {
    const dedupe = (arr) => {
      const seen = new Set()
      return arr.filter(s => {
        const key = `${s.name}:${s.lang}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).map(s => ({
        id: `${s.name}-${s.lang}`,
        label: s.name,
        provider: s.provider,
        lang: s.lang,
      }))
    }
    return {
      sub: dedupe(servers.sub),
      dub: dedupe(servers.dub),
    }
  }, [servers])

  const currentSource = useMemo(() => {
    const all = [...SOURCES.sub, ...SOURCES.dub]
    return all.find(s => s.id === activeSource) || all[0] || null
  }, [SOURCES, activeSource])

  const hasSub = servers.sub.length > 0
  const hasDub = servers.dub.length > 0

  // Auto-select first working SUB source when servers load
  useEffect(() => {
    if (SOURCES.sub.length > 0 && !SOURCES.sub.find(s => s.id === activeSource)) {
      setActiveSource(SOURCES.sub[0].id)
    } else if (SOURCES.sub.length === 0 && SOURCES.dub.length > 0 && !SOURCES.dub.find(s => s.id === activeSource)) {
      setActiveSource(SOURCES.dub[0].id)
    }
  }, [SOURCES])

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

  // Fetch anime + episodes (fallback to AniList if backend down)
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/v1/anime/${animeId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/v1/anime/${animeId}/episodes`).then(r => r.ok ? r.json() : { episodes: [] }).catch(() => ({ episodes: [] })),
    ]).then(async ([animeData, epData]) => {
      if (!animeData) {
        const { data } = await anilistQuery(ANIME_DETAIL_QUERY, { id: parseInt(animeId, 10) }).catch(() => ({ data: null }))
        if (data?.Media) {
          animeData = { ...data.Media, id: animeId }
          if (!epData?.episodes?.length && data.Media.episodes) {
            epData = { episodes: Array.from({ length: data.Media.episodes }, (_, i) => ({
              number: i + 1,
              title: `Episode ${i + 1}`,
              thumbnail: data.Media.coverImage?.medium || '',
            })) }
          }
        }
      }
      setAnime(animeData)
      setEpisodes(epData?.episodes || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [animeId])

  // Dynamic SEO metadata
  useEffect(() => {
    if (anime) {
      setWatchSEO(anime, epNumber)
    }
  }, [anime?.id, epNumber])

  // Check for resume position on mount. Prefer the newer of the remote
  // (cross-device) row and the local row so progress follows the user
  // between devices instead of only this browser's localStorage.
  useEffect(() => {
    if (!animeId || !epNumber) return
    let cancelled = false
    let interval = null

    const applyResume = (entry) => {
      if (cancelled || !entry || !(entry.time > 30)) return
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
      applyResume(local.find(h => String(h.animeId) === String(animeId) && h.episode === epNumber))
      return () => { cancelled = true; if (interval) clearInterval(interval) }
    }

    supabase.from('watch_history')
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
        const localEntry = local.find(h => String(h.animeId) === String(animeId) && h.episode === epNumber) || null
        const sources = [remote, localEntry].filter(Boolean)
        sources.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        applyResume(sources[0])
      })
      .catch(() => {
        if (!cancelled) {
          applyResume(local.find(h => String(h.animeId) === String(animeId) && h.episode === epNumber))
        }
      })
    return () => { cancelled = true; if (interval) clearInterval(interval) }
  }, [animeId, epNumber, user?.id])

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
      if (artRef.current) artRef.current.__artplayer = null
    }
  }, [])

  useEffect(() => () => destroyPlayer(), [destroyPlayer])

  const buildPlayer = useCallback(async (streamUrl, sourceType, qualityList, subtitles, headers, onBlocked) => {
    destroyPlayer()
    const container = artRef.current
    if (!container) return

    const headersParam = headers ? `&headers=${encodeURIComponent(JSON.stringify(headers))}` : ''
    const proxied = (u) => `${PROXY_BASE}/proxy?url=${encodeURIComponent(u)}${headersParam}`

    const playAsMp4 = (video, url, art) => {
      // Native MP4 through the backend proxy — the proxy adds the provider
      // referer and streams with CORS headers, so the video element loads
      // first try with no failed-request noise in the console. If the proxy
      // stream itself errors, move to the next server.
      video.src = proxied(url)
      video.load()
      video.play().catch(() => {})
      video.onerror = () => {
        if (onBlocked) {
          onBlocked()
        } else {
          setError('Stream playback error. Try a different server.')
        }
      }
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
        mp4: function (video, url, art) {
          playAsMp4(video, url, art)
        },
        m3u8: async function (video, url, art) {
          const proxied = (u) => `${PROXY_BASE}/proxy?url=${encodeURIComponent(u)}${headersParam}`
          const referer = (headers && headers.Referer) || ''
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = proxied(url)
            return
          }
          const { default: Hls } = await import('hls.js')
          if (!Hls.isSupported()) return
          if (art.hls) {
            art.hls.destroy()
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
            // Direct fallback: some CDNs (uwucdn, koto CDNs) only serve video
            // to browsers that present the provider referer. hls.js fetches
            // via fetch(); the `referrer` option is the sanctioned way for a
            // browser to send a cross-origin Referer.
            fetchSetup: referer
              ? (context, init) => {
                  try {
                    init.referrer = referer
                  } catch {}
                  return new Request(context.url, init)
                }
              : undefined,
          })

          // Proxy first — the backend injects the provider referer and speaks
          // the CDN's language, and it is the only path that works for CDNs
          // which are referer-gated from browsers (vidtub etc.). If the proxy
          // is rejected (datacenter-blocked host like uwucdn/owocdn), fall
          // back to a direct browser fetch, then next server. Failover is
          // fast: manifest retries are capped at 2.
          let triedDirect = false
          let netRetries = 0
          let mediaRetries = 0

          const fail = () => {
            if (!triedDirect) {
              triedDirect = true
              hls.loadSource(url)
              return
            }
            if (onBlocked) {
              onBlocked()
            } else {
              setError('Stream playback error. Try a different server.')
            }
          }

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return
            // Backend types tokenized MP4 URLs as HLS when the path has no
            // extension — if the manifest is actually MP4, play it natively.
            if (data.type === Hls.ErrorTypes.MANIFEST_ERROR && data.details === Hls.ErrorDetails.MANIFEST_PARSE_ERROR) {
              hls.destroy()
              art.hls = null
              playAsMp4(video, url, art)
              return
            }
            // Dead CDNs (vidtub) serve real playlists but 1x1 PNG "segments" —
            // demuxing fails repeatedly, so recover only a couple of times
            // before failing over to the next server.
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              if (mediaRetries < 2) {
                mediaRetries += 1
                hls.recoverMediaError()
                return
              }
              fail()
              return
            }
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !triedDirect) {
              if (netRetries < 2) {
                netRetries += 1
                hls.startLoad()
                return
              }
              fail()
              return
            }
            fail()
          })

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {})
          })

          hls.loadSource(proxied(url))
          hls.attachMedia(video)
          art.hls = hls
          art.on('destroy', () => hls.destroy())
        }
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

    const [{ default: Artplayer }] = await Promise.all([import('artplayer')])
    const art = new Artplayer(playerConfig)

    // Keep Artplayer's built-in "Video Failed" layer out of sight — fallbacks
    // (proxy switch, next server) handle real failures, and the error flash on
    // a transient issue is worse than a silent transition.
    art.on('video:error', () => {
      try { art.layers.error.show = false } catch {}
    })

    if (subtitles && subtitles.length > 1) {
      art._anirakuSubtitles = subtitles
    }

    // Auto next episode
    art.on('video:ended', () => {
      if (!isMovie && epNumber < episodes.length) {
        const slug = generateSlug(anime?.title?.english || anime?.title?.romaji || '')
        navigate(`/watch/${slug}-${animeId}-episode-${epNumber + 1}`)
      }
    })

    // Lock page scroll while fullscreen so the page never scrolls behind the
    // video (also covers iOS native fullscreen, which re-scrolls on exit).
    let scrollY = 0
    art.on('fullscreen', (state) => {
      if (state) {
        scrollY = window.scrollY
        document.documentElement.classList.add('body-hidden')
      } else {
        document.documentElement.classList.remove('body-hidden')
        window.scrollTo({ top: scrollY, left: 0 })
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
        const raw = JSON.parse(localStorage.getItem('aniraku-watch-history') || '[]')
        const filtered = raw.filter(h => !(String(h.animeId) === String(animeId) && h.episode === epNumber))
        filtered.unshift(entry)
        localStorage.setItem('aniraku-watch-history', JSON.stringify(filtered.slice(0, 100)))
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
    if (artRef.current) artRef.current.__artplayer = art
  }, [animeId, anime?.id, epNumber, episodes, anime, navigate, destroyPlayer])

  const streamRetries = useRef({})
  const streamAbortRef = useRef(null)
  const [slowStream, setSlowStream] = useState(false)

  useEffect(() => {
    if (!streamLoading) {
      setSlowStream(false)
      return
    }
    const t = setTimeout(() => setSlowStream(true), 10000)
    return () => clearTimeout(t)
  }, [streamLoading])

  const loadStream = useCallback(async (sourceId, forceRefresh = false) => {
    // Switching servers mid-load must cancel the in-flight scrape, or the
    // new source's load bails on the loadingRef guard and nothing happens.
    if (streamAbortRef.current) {
      streamAbortRef.current.abort()
      streamAbortRef.current = null
      loadingRef.current = false
    }
    if (loadingRef.current && !forceRefresh) return
    loadingRef.current = true
    setStreamLoading(true)
    setError('')
    setEmbedUrl('')
    setResumePos(null)

    const retryKey = sourceId
    if (forceRefresh) {
      streamRetries.current[retryKey] = (streamRetries.current[retryKey] || 0) + 1
      if (streamRetries.current[retryKey] > 3) {
        setError('All providers blocked. Try again later or use a different server.')
        setStreamLoading(false)
        loadingRef.current = false
        return
      }
      showToast(`Refreshing source (${streamRetries.current[retryKey]}/3)...`)
    }

    // Find the source to play
    const source = [...SOURCES.sub, ...SOURCES.dub].find(s => s.id === sourceId) || SOURCES.sub[0] || { provider: 'miruro', lang: 'sub' }

    const controller = new AbortController()
    streamAbortRef.current = controller
    try {
      // Resolving a stream means scraping a provider, and the backend runs on
      // a Render instance that cold-starts. Measured: ~3s warm, ~9s on a
      // cache-bypassing refresh, and longer still after a spin-down. A 15s
      // budget aborted those slow-but-successful requests, and an aborted
      // fetch surfaces in the console as a CORS error ("No
      // 'Access-Control-Allow-Origin' header"), which points debugging at the
      // wrong layer entirely — the backend does send the header.
      const timeoutId = setTimeout(() => controller.abort(), 60000)
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
      })
      clearTimeout(timeoutId)
      if (streamAbortRef.current === controller) streamAbortRef.current = null
      const data = await res.json()

      if (data.error || !data.sources?.[0]?.url) {
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

      const qualityList = data.sources.map((src, idx) => ({
        default: idx === 0,
        html: src.quality || 'Auto',
        url: src.url,
        type: src.type || 'hls',
      }))

      const defaultUrl = qualityList[0]?.url || ''
      const defaultType = qualityList[0]?.type || 'hls'

      const subs = firstSource.subtitles || []
      const onBlocked = () => handleProviderBlockedRef.current?.()
      buildPlayer(defaultUrl, defaultType, qualityList, subs, data.headers, onBlocked)
      setStreamLoading(false)
      loadingRef.current = false
      return
    } catch (err) {
      const superseded = streamAbortRef.current !== controller
      if (streamAbortRef.current === controller) streamAbortRef.current = null
      if (superseded) {
        // A newer load took over — its loading state is authoritative, so
        // don't touch streamLoading or loadingRef here.
        return
      }
      if (err.name === 'AbortError') {
        setError('Stream timed out. The backend server may be waking up — try again.')
      } else {
        setError('Failed to load stream. Check your connection and try again.')
      }
      setStreamLoading(false)
      loadingRef.current = false
      return
    }
  }, [animeId, epNumber, SOURCES, showToast, buildPlayer, destroyPlayer])

  // Fetch servers when episode changes. Miruro's dub endpoints 502
  // transiently, so retry (with backoff) when a lang list comes back empty —
  // a 12s-later retry usually recovers the list.
  useEffect(() => {
    if (!animeId || !epNumber) return
    let cancelled = false
    let retries = 0
    const fetchServers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/servers?animeId=${animeId}&episode=${epNumber}&lang=sub`)
        if (!res.ok) return
        const subServers = await res.json()
        if (cancelled) return
        let dubServers = []
        try {
          const dubRes = await fetch(`${API_BASE}/api/v1/servers?animeId=${animeId}&episode=${epNumber}&lang=dub`)
          dubServers = dubRes.ok ? await dubRes.json() : []
        } catch {}
        if (cancelled) return
        const subs = Array.isArray(subServers) ? subServers : []
        const dubs = Array.isArray(dubServers) ? dubServers : []
        setServers(prev => ({
          sub: subs.length > 0 ? subs : prev.sub,
          dub: dubs.length > 0 ? dubs : prev.dub,
        }))
        if (subs.length === 0 && dubs.length === 0) {
          setError('No video source found')
        }
        if ((subs.length === 0 || dubs.length === 0) && retries < 2) {
          retries += 1
          setTimeout(fetchServers, 12000)
        }
      } catch {}
    }
    fetchServers()
    return () => { cancelled = true }
  }, [animeId, epNumber])

  // Load stream on active source / episode change
  const loadStreamRef = useRef(loadStream)
  loadStreamRef.current = loadStream

  // When a server's CDN blocks playback, switch to the next available server
  // instead of re-scraping the same one. The next server's sources are already
  // cached by the backend (FindAllSources), so the switch is instant.
  // Force-refreshed re-scraping happens only as a last resort, once per episode.
  const handleProviderBlocked = useCallback(() => {
    const all = [...SOURCES.sub, ...SOURCES.dub]
    const current = activeSourceRef.current
    const now = Date.now()
    if (now - lastBlockCycleRef.current < 3000) return
    lastBlockCycleRef.current = now

    if (current) blockedSourcesRef.current.add(current)

    const next = all.find(s => !blockedSourcesRef.current.has(s.id))
    if (next) {
      showToast(`Server blocked — switching to ${next.label} (${next.lang.toUpperCase()})...`)
      setActiveSource(next.id)
      return
    }
    if (!forceRefreshUsedRef.current && current) {
      forceRefreshUsedRef.current = true
      showToast('All servers blocked — retrying once...')
      loadStreamRef.current(current, true)
      return
    }
    setError('All providers blocked. Try again later or use a different server.')
  }, [SOURCES, showToast])

  handleProviderBlockedRef.current = handleProviderBlocked
  useEffect(() => {
    loadStreamRef.current(activeSource)
  }, [activeSource, epNumber])

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
      if (e.target.closest && e.target.closest('.watch-touch-seek')) return

      setTouchSeekVisible(true)
      clearTimeout(touchSeekTimer.current)
      touchSeekTimer.current = setTimeout(() => setTouchSeekVisible(false), 3000)

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
      clearTimeout(touchSeekTimer.current)
    }
  }, [showToast])

  if (loading) {
    return (
      <>
        <div style={{ background: 'var(--bg)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0' }}>
            <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            </div>
          </div>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
              <div style={{ height: 28, width: '60%', background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%)', backgroundSize: '200% 100%', borderRadius: 6, marginBottom: 12, animation: 'shimmer 1.5s infinite' }} />
              <div style={{ height: 16, width: '40%', background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%)', backgroundSize: '200% 100%', borderRadius: 6, marginBottom: 20, animation: 'shimmer 1.5s infinite' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ height: 44, width: 120, background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%)', backgroundSize: '200% 100%', borderRadius: 8, animation: 'shimmer 1.5s infinite' }} />
                <div style={{ height: 44, width: 120, background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%)', backgroundSize: '200% 100%', borderRadius: 8, animation: 'shimmer 1.5s infinite' }} />
              </div>
            </div>
        </div>
      </>
    )
  }

  if (isNsfw(anime) && !nsfwEnabled) {
    return (
      <>
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
          <div style={{
            textAlign: 'center', padding: 40, maxWidth: 400,
            background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>18+</div>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Mature Content</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
              This anime contains adult content. Enable NSFW content in your settings to view it.
            </p>
            <Link to="/profile/settings" style={{
              background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 10,
              padding: '10px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>Open Settings</Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', paddingBottom: 80 }}>
      <main>

      {/* Toast notification */}
      {toast && (
        <div className="aniraku-toast" style={{
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
        maxWidth: theaterMode ? '100%' : 1200,
        margin: '0 auto', background: '#000',
        position: 'relative',
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
          <>
            <div ref={artRef} data-aniraku-player aria-label="Video player" role="region" style={{ width: '100%', aspectRatio: '16/9', maxHeight: '80vh' }} />

            {/* Touch seek buttons */}
            <div className={touchSeekVisible ? 'watch-touch-seek visible' : 'watch-touch-seek'}>
              <button
                className="watch-touch-seek-btn watch-touch-seek-back"
                aria-label="Rewind 10 seconds"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  const art = artInstance.current
                  if (art) {
                    art.video.currentTime = Math.max(0, art.video.currentTime - 10)
                    showToast('−10s')
                  }
                }}
              >
                <FaStepBackward size={20} />
              </button>
              <button
                className="watch-touch-seek-btn watch-touch-seek-fwd"
                aria-label="Forward 10 seconds"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  const art = artInstance.current
                  if (art) {
                    art.video.currentTime = Math.min(art.video.duration || Infinity, art.video.currentTime + 10)
                    showToast('+10s')
                  }
                }}
              >
                <FaStepForward size={20} />
              </button>
            </div>
          </>
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
              {slowStream && (
                <>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 12, maxWidth: 320, lineHeight: 1.5 }}>
                    Stream is taking a while — try switching to another server.
                  </p>
                  <button onClick={handleProviderBlocked} style={{
                    marginTop: 14, padding: '10px 24px', background: 'rgba(99,102,241,0.2)',
                    color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>Try another server</button>
                </>
              )}
            </div>
          </div>
        )}

        {error && !streamLoading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: '#000',
            padding: 24, textAlign: 'center', zIndex: 50,
          }}>
            <img src="/no-source.svg" alt="" style={{ width: 160, height: 160, marginBottom: 16, opacity: 0.6 }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 500, maxWidth: 400, lineHeight: 1.5 }}>
              {error}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 10, maxWidth: 400, lineHeight: 1.5 }}>
              Streaming taking too long? Switch to a different server to start playing.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={handleProviderBlocked} style={{
                padding: '10px 24px', background: 'rgba(99,102,241,0.2)',
                color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Switch Server</button>
              <button onClick={() => loadStream(activeSource, true)} style={{
                padding: '10px 24px', background: 'rgba(226,232,240,0.12)',
                color: '#e2e8f0', border: '1px solid rgba(226,232,240,0.2)', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Retry</button>
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
        {['sub', 'dub'].filter(lang => (lang === 'sub' ? hasSub : hasDub)).map(lang => (
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
                      background: isActive ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)',
                      color: isActive ? '#a5b4fc' : 'var(--text-secondary)',
                      border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                      borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      position: 'relative', transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    {source.label}
                    {isActive && (
                      <div style={{
                        position: 'absolute', bottom: -1, left: '15%', right: '15%',
                        height: 2, background: '#6366f1', borderRadius: 1,
                      }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Episode sidebar toggle for mobile */}
      {!isMovie && (
      <button onClick={() => setShowEpSidebar(p => !p)} className="watch-ep-toggle" style={{
        display: 'none', width: '100%', padding: '10px 14px', margin: '12px auto 0',
        maxWidth: 1200, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>Episodes ({episodes.length})</span>
        <span style={{ transform: showEpSidebar ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      )}

      {/* Info + Episodes */}
      <div className="watch-info-section" style={{
        maxWidth: 1200, margin: '0 auto', padding: '20px 16px',
        display: 'flex', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, wordBreak: 'break-word' }}>
            {anime?.title?.english || anime?.title?.romaji || 'Loading...'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            {isMovie ? 'Movie' : `Episode ${epNumber} of ${episodes.length || '?'}`} · {currentSource?.lang?.toUpperCase() || 'SUB'} via {currentSource?.label || 'Server 1'}
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {!isMovie && epNumber > 1 && (
              <Link to={`/watch/${generateSlug(anime?.title?.english || anime?.title?.romaji || '')}-${animeId}-episode-${epNumber - 1}`} style={navBtnStyle}>
                <FaStepBackward size={12} /> Previous
              </Link>
            )}
            {!isMovie && epNumber < episodes.length && (
              <Link to={`/watch/${generateSlug(anime?.title?.english || anime?.title?.romaji || '')}-${animeId}-episode-${epNumber + 1}`} style={navBtnStyle}>
                Next <FaStepForward size={12} />
              </Link>
            )}
            <Link to={`/anime/${generateSlug(anime?.title?.english || anime?.title?.romaji || '')}-${animeId}`} style={navBtnStyle}>Details</Link>
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
              <h2 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Synopsis</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, maxHeight: 120, overflow: 'hidden' }}>
                {anime.description.replace(/<[^>]*>/g, '')}
              </p>
            </div>
          )}

          {anime && (
            <div id="watch-comments">
              <Comments animeId={anime.id} episodeNumber={epNumber} label={`Episode ${epNumber}${episodes?.length ? ` of ${episodes.length}` : ''}`} />
            </div>
          )}
        </div>

        {/* Episode sidebar */}
        {!isMovie && (
        <div className="watch-episode-sidebar" style={{
          width: 340, flexShrink: 0, minWidth: 0, maxWidth: '100%',
          display: showEpSidebar ? 'block' : 'none',
        }}>
          <h2 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>
            Episodes ({episodes.length})
          </h2>

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
                  to={`/watch/${generateSlug(anime?.title?.english || anime?.title?.romaji || '')}-${animeId}-episode-${num}`}
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
        )}
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

        /* Touch seek buttons */
        .watch-touch-seek {
          display: none;
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .watch-touch-seek.visible { opacity: 1; }
        .watch-touch-seek.visible .watch-touch-seek-btn { pointer-events: auto; }
        .watch-touch-seek-btn {
          pointer-events: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.15);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          touch-action: manipulation;
        }
        .watch-touch-seek-back { left: 12px; }
        .watch-touch-seek-fwd { right: 12px; }

        @media (hover: none) and (pointer: coarse) {
          .watch-touch-seek { display: flex; }
        }

        @media (max-width: 768px) {
          .watch-player-wrapper { max-width: 100% !important; }
          .watch-info-section { flex-direction: column !important; gap: 16px !important; padding: 16px !important; }
          .watch-episode-sidebar { width: 100% !important; flex-shrink: 1 !important; max-height: none !important; }
          .watch-ep-toggle { display: flex !important; }
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

        /* Touch-friendly nav buttons on watch page */
        @media (max-width: 768px) {
          a[style*="var(--bg-card)"] { min-height: 44px; padding: 10px 16px !important; }
        }

        @media (max-width: 640px) {
          .watch-source-btn { flex: 1 1 auto !important; min-width: 0 !important; padding: 14px 10px !important; font-size: 13px !important; min-height: 48px !important; }
        }
        @media (max-width: 400px) {
          .watch-source-btn { font-size: 11px !important; padding: 12px 6px !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .watch-source-btn { padding: 10px 18px !important; }
        }
      `}</style>

      {anime && (
        <button
          onClick={() => document.getElementById('watch-comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 60,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--accent)', color: 'var(--bg)', border: 'none',
            borderRadius: 999, padding: '12px 18px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          }}
          title="Jump to episode comments"
        >
          <FaCommentDots size={15} /> Comments
        </button>
      )}

    </main>
    </div>
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
}
