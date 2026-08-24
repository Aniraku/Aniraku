import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FaStepForward,
  FaStepBackward,
  FaCommentDots,
  FaWifi,
  FaExclamationTriangle,
  FaRedo,
  FaCheckCircle,
  FaSpinner,
  FaSignal,
  FaUndo,
  FaStar,
} from 'react-icons/fa'
import { API_BASE, PROXY_BASE } from '../config'
import { anilistQuery, ANIME_DETAIL_QUERY } from '../lib/anilist'
import Comments from '../components/Comments/Comments'
import EpisodeSidebar from '../components/Watch/EpisodeSidebar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { isNsfw, useNsfw } from '../hooks/useNsfw'
import { setTitle, setWatchSEO } from '../lib/seo'
import { extractIdFromSlug, generateSlug } from '../lib/slug'
import {
  getSyncStatus,
  updateSyncProgress,
  updateSyncScore,
  fetchEpisodeRatings,
  saveEpisodeRating,
  PROVIDER_LABELS,
} from '../lib/sync'
import { WatchPageSkeleton } from '../components/Skeletons/Skeletons'
import { historyEntryKey, subscribeToWatchHistory, upsertWatchHistory } from '../lib/watchHistory'
import {
  getDashBufferPolicy,
  getHlsBufferPolicy,
  getHlsLoadPolicies,
  getHlsRequestCacheMode,
  getNativeMediaBufferPolicy,
} from '../lib/watchBufferPolicy'
import { attemptSkipSegment, shouldShowManualSkipOverlay } from '../lib/skipOverlayPolicy'
import {
  createHlsQualitySelection,
  getHlsDataSaverCap,
  getHlsQualitySettingDisplay,
  getQualitySettingTitle,
  selectQualityInList,
} from '../lib/watchQualityMenuState'
import {
  beginQuietProviderSwitch,
  settleQuietProviderSwitch,
} from '../lib/watchQuietSwitchState'
import {
  createMediaTransportPlan,
  shouldPreferNativeHls,
  shouldTryHlsFallback,
} from '../lib/watchSourceTransport'
import { chooseBrowserPlayableEmbed } from '../lib/watchEmbedFallback'
import { shouldPreferProviderPlayer } from '../lib/watchProviderPlayer'
import { createBufferedTimelineIndicator } from '../lib/watchTimelineBuffer'
import {
  filterBrowserProviders,
  PROVIDER_DISCOVERY_RETRY_DELAYS_MS,
  mergeProviderServers,
} from '../lib/watchProviderDiscovery'

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────
const EPISODES_PER_PAGE = 50
const STREAM_CACHE_TTL_MS = 30_000       // recent working source cache
const SLOW_THRESHOLD_MS = 10_000
const RESUME_MIN_TIME = 30
const MAX_SERVER_RETRIES = 3             // manual Retry cap per source per ep
const HEALTH_CHECK_TIMEOUT = 4_000
const STREAM_FETCH_TIMEOUT = 60_000
const EPISODE_RATINGS_LS_KEY = 'aniraku-episode-ratings'

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

function getCompactWatchLayout() {
  if (typeof window === 'undefined') return IS_MOBILE
  const narrow = window.matchMedia?.('(max-width: 768px)')?.matches
  const touch = window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches
  return Boolean(narrow || touch || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024))
}

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
// `expired`          → tokenized CDN URL is dead (offer manual retry)
// `blocked`          → geo / referer / network block from CDN (offer a
//                      manual server choice; never switch automatically)
// `network`          → fetch itself failed (offer manual retry)
// `timeout`          → fetch or proxy never returned in time
// `backend`          → backend 5xx, cold start, or no upstream response
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
const SEEK_SECONDS = 10

// Some older episode payloads were serialized as 10, 20, 30, ... instead of
// 1, 2, 3, .... Correct only that unmistakable sequence; valid provider
// episode numbers such as 10, 11, 12 remain unchanged.
// Canonical episode numbering: derive number from position in the list
// to permanently fix the "10x" multiplication bug from providers.
function normalizeEpisodeList(list) {
  const rows = Array.isArray(list) ? list.filter(Boolean) : []
  return rows.map((ep, i) => ({
    ...ep,
    // Permanent fix: always use the 1-based index as the canonical episode number.
    // This prevents provider-level "10, 20, 30" bugs from reaching the UI.
    number: i + 1,
    originalNumber: ep.number,
    // If the title is just "Episode X" and X is the bugged number, fix it too.
    title: (ep.title && ep.title.toLowerCase() === `episode ${ep.number}`) 
      ? `Episode ${i + 1}` 
      : ep.title,
  }))
}

const ANISKIP_API_BASE = 'https://api.aniskip.com/v2'
const ANISKIP_TIMEOUT_MS = 8_000
const SKIP_CACHE_TTL_MS = 24 * 60 * 60 * 1000

function normalizeSkipInterval(value, type, source = 'unknown') {
  const interval = value?.interval || value
  const start = Number(interval?.startTime ?? interval?.start_time ?? interval?.start)
  const end = Number(interval?.endTime ?? interval?.end_time ?? interval?.end)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  if (start < 0 || end <= start + 1) return null
  return {
    start,
    end,
    type,
    source,
  }
}

function normalizeProviderSkipSegments(payload) {
  if (!payload || typeof payload !== 'object') return { intro: null, outro: null }
  const intro = normalizeSkipInterval(
    payload.intro || payload.opening || payload.op || payload.skipIntro,
    'intro',
    'provider'
  )
  const outro = normalizeSkipInterval(
    payload.outro || payload.ending || payload.ed || payload.skipOutro || payload.credits,
    'outro',
    'provider'
  )
  return { intro, outro }
}

function normalizeAniSkipSegments(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : []
  const segments = { intro: null, outro: null }
  for (const result of results) {
    const skipType = String(result?.skipType || '').toLowerCase()
    const type = skipType === 'op' || skipType === 'mixed_op'
      ? 'intro'
      : skipType === 'ed' || skipType === 'mixed_ed'
        ? 'outro'
        : null
    if (!type || segments[type]) continue
    segments[type] = normalizeSkipInterval(result, type, 'aniskip')
  }
  return segments
}

function getMalId(meta) {
  const value = meta?.idMal ?? meta?.malId ?? meta?.mal_id ?? meta?.myAnimeListId
  const malId = Number(value)
  return Number.isInteger(malId) && malId > 0 ? malId : null
}

function mergeSkipSegments(current, incoming) {
  const pick = (existing, next) => {
    if (next?.source === 'provider') return next
    if (existing?.source === 'provider') return existing
    return next || existing || null
  }
  return {
    intro: pick(current?.intro, incoming?.intro),
    outro: pick(current?.outro, incoming?.outro),
  }
}

function skipCacheKey(malId, episode) {
  return `aniraku-skip-v2:${malId}:${episode}`
}

function readSkipCache(malId, episode) {
  try {
    const raw = localStorage.getItem(skipCacheKey(malId, episode))
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (!cached?.savedAt || Date.now() - cached.savedAt > SKIP_CACHE_TTL_MS) return null
    return {
      segments: cached.segments || null,
      notFound: cached.notFound === true,
    }
  } catch {
    return null
  }
}

function writeSkipCache(malId, episode, segments, notFound = false) {
  try {
    localStorage.setItem(
      skipCacheKey(malId, episode),
      JSON.stringify({ savedAt: Date.now(), segments, notFound })
    )
  } catch {
    // Storage can be disabled in private browsing; playback must continue.
  }
}

const upsertLocalWatchHistory = upsertWatchHistory

function formatTime(s) {
  if (typeof s !== 'number' || !isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function seekVideoBy(art, seconds) {
  const video = art?.video
  if (!video) return null
  const duration = Number.isFinite(video.duration) && video.duration > 0
    ? video.duration
    : Infinity
  const nextTime = Math.min(
    duration,
    Math.max(0, (video.currentTime || 0) + seconds)
  )
  video.currentTime = nextTime
  return nextTime
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getQualityPresentation(value) {
  const raw = String(value || '').trim()
  const normalized = raw.toLowerCase()
  if (/2160|4k|uhd/.test(normalized)) {
    return { label: '4K', badge: 'Ultra HD', rank: 2160, key: '2160p', isAuto: false }
  }
  if (/1440|2k|qhd/.test(normalized)) {
    return { label: '1440p', badge: 'QHD', rank: 1440, key: '1440p', isAuto: false }
  }
  if (/1080|full.?hd|fhd/.test(normalized)) {
    return { label: '1080p', badge: 'Full HD', rank: 1080, key: '1080p', isAuto: false }
  }
  if (/720|hd/.test(normalized)) {
    return { label: '720p', badge: 'HD', rank: 720, key: '720p', isAuto: false }
  }
  if (/480/.test(normalized)) {
    return { label: '480p', badge: 'SD', rank: 480, key: '480p', isAuto: false }
  }
  if (/360/.test(normalized)) {
    return { label: '360p', badge: 'Low', rank: 360, key: '360p', isAuto: false }
  }
  if (/auto|adaptive|master|original|default/.test(normalized) || !raw) {
    return { label: 'Auto', badge: 'Adaptive', rank: 0, key: 'auto', isAuto: true }
  }
  return {
    label: raw.length > 12 ? `${raw.slice(0, 12)}…` : raw,
    badge: 'Source',
    rank: 0,
    key: normalized,
    isAuto: false,
  }
}

function qualityOptionHtml(presentation) {
	const badge = presentation.badge
		? `<span class="watch-quality-badge">${escapeHtml(presentation.badge)}</span>`
		: ''
	return `<span class="watch-quality-option"><span class="watch-quality-name">${escapeHtml(presentation.label)}</span>${badge}</span>`
}

const streamCacheKey = (source, episode) => `${source?.id || `${source?.provider || ''}:${source?.lang || ''}`}:${episode}`
// Some upstreams embed UTC expiry stamps such as 20260808014918 in the
// stream URL. A token whose newest valid timestamp is already in the past is
// definitively dead; mounting it only creates repeated proxy 401/direct 404
// noise before the normal provider failover can begin.
function hasExpiredEmbeddedToken(url) {
  const matches = String(url || '').matchAll(/(?:^|[^0-9])(20\d{12})(?!\d)/g)
  let newest = 0
  for (const match of matches) {
    const value = match[1]
    const year = Number(value.slice(0, 4))
    const month = Number(value.slice(4, 6))
    const day = Number(value.slice(6, 8))
    const hour = Number(value.slice(8, 10))
    const minute = Number(value.slice(10, 12))
    const second = Number(value.slice(12, 14))
    const timestamp = Date.UTC(year, month - 1, day, hour, minute, second)
    if (
      year >= 2020 && year <= 2100 &&
      month >= 1 && month <= 12 && day >= 1 && day <= 31 &&
      hour <= 23 && minute <= 59 && second <= 59 &&
      Number.isFinite(timestamp)
    ) newest = Math.max(newest, timestamp)
  }
  // The small grace period avoids rejecting a token while a provider clock is
  // only seconds ahead; multi-day-old URLs such as the reported source fail.
  return newest > 0 && Date.now() > newest + 30_000
}

function getSourcePlaybackType(source) {
	const rawType = String(source?.type || source?.mime || '').trim().toLowerCase()
	const url = String(source?.url || '').toLowerCase()
	if (rawType === 'embed' || rawType === 'iframe' || rawType === 'page' || rawType.includes('embed')) return 'embed'
	if (rawType === 'hls' || rawType === 'm3u8' || rawType.includes('mpegurl') || /\.m3u8(?:$|[?#])/.test(url)) return 'hls'
	if (rawType === 'dash' || rawType === 'mpd' || rawType.includes('dash+xml') || /\.mpd(?:$|[?#])/.test(url)) return 'dash'
	if (rawType === 'mp4' || rawType === 'm4v' || rawType.includes('video/mp4') || /\.(?:mp4|m4v)(?:$|[?#])/.test(url)) return 'mp4'
	if (rawType === 'webm' || rawType.includes('video/webm') || /\.webm(?:$|[?#])/.test(url)) return 'webm'
	if (rawType === 'ogg' || rawType === 'ogv' || rawType.includes('video/ogg') || rawType.includes('audio/ogg') || /\.(?:ogg|ogv)(?:$|[?#])/.test(url)) return 'ogg'
	if (rawType === 'mpeg' || rawType === 'mpg' || rawType.includes('video/mpeg') || /\.(?:mpeg|mpg)(?:$|[?#])/.test(url)) return 'mpeg'
	// A live URL with no reliable extension is still attempted through the
	// browser's native media element; the backend has already probed it.
	return 'native'
}

function isKiwiEmbedUrl(url) {
	return /^https?:\/\/(?:www\.)?kwik\.cx\//i.test(String(url || ''))
}

function getSourceVerification(source) {
	return String(source?.verification || source?.Verification || '').trim().toLowerCase()
}

// Embed verification is normally supplied by the API. Some provider responses
// omit the advisory field, so an otherwise valid embed URL should remain
// selectable instead of removing the whole provider row. A definitive dead
// verdict or an expired signed token is still rejected.
function isPlayableEmbedSource(source) {
	if (getSourcePlaybackType(source) !== 'embed' || !source?.url) return false
	return getSourceVerification(source) !== 'dead' && !hasExpiredEmbeddedToken(source.url)
}

function isKiwiEmbedSource(source) {
	if (!isPlayableEmbedSource(source)) return false
	try {
		const target = new URL(source.url)
		return target.protocol === 'https:' && target.hostname === 'kwik.cx' && /^\/e\/[A-Za-z0-9_-]{6,128}$/.test(target.pathname)
	} catch {
		return false
	}
}

// Kwik denies being framed by third-party pages. Do not turn a recoverable
// Kiwi direct-source failure into a browser iframe that must be rejected.
function isBrowserPlayableEmbedSource(source) {
	return isPlayableEmbedSource(source) && !isKiwiEmbedSource(source)
}

function buildQualityList(sources) {
	const seenUrls = new Set()
	const entries = (Array.isArray(sources) ? sources : [])
		// Backend verification tags are advisory snapshots, not a playback
		// permission model. Keep every non-embed media URL so providers such as
		// Kiwi remain playable when their current CDN verdict is stale.
		.filter((src) => getSourcePlaybackType(src) !== 'embed' && src?.url)
		.map((src, sourceIndex) => {
			const presentation = getQualityPresentation(src.quality)
			return {
				src,
				sourceIndex,
					presentation,
					html: qualityOptionHtml(presentation),
					url: src.url,
				// Provider metadata and URL classification are both considered so
				// mislabeled streams use the correct ArtPlayer loader.
				type: getSourcePlaybackType(src),
				verification: getSourceVerification(src),
					expiredToken: hasExpiredEmbeddedToken(src.url),
			}
		})
    .filter((entry) => {
      if (seenUrls.has(entry.url)) return false
      seenUrls.add(entry.url)
      return true
    })

  // Backend verification is a soft snapshot; the stream endpoint can return a
  // usable URL after the list endpoint has marked it stale. Only an expired
  // signed token is definitive enough to omit before playback/failover.
  return entries
    .filter((entry) => !entry.expiredToken)
    // Prefer the provider's own Auto/adaptive
    // URL and then the highest numeric quality without inventing a new URL.
    .sort((a, b) => {
      if (a.presentation.isAuto !== b.presentation.isAuto) {
        return a.presentation.isAuto ? -1 : 1
      }
      if (a.presentation.rank !== b.presentation.rank) {
        return b.presentation.rank - a.presentation.rank
      }
      return a.sourceIndex - b.sourceIndex
    })
	    .map((entry, index) => ({
	      default: index === 0,
	      html: entry.html,
	      url: entry.url,
	      type: entry.type,
			verification: entry.verification,
			label: entry.presentation.label,
		qualityKey: entry.presentation.key,
		qualityRank: entry.presentation.rank,
		isAuto: entry.presentation.isAuto,
	}))
}

function seekControlHtml(direction) {
  // Material-style replay-10 / forward-10 artwork: a single bold loop and
  // arrow with the number set directly inside, avoiding the previous
  // overlapping text chip that made the control look like undo/redo.
  const path = direction < 0
    ? 'M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8'
    : 'M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8z'
  return `<span class="watch-art-seek-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="${path}" fill="currentColor"/><text x="12" y="15.35" text-anchor="middle" font-family="Arial, sans-serif" font-size="5.6" font-weight="800" fill="currentColor">10</text></svg></span>`
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

// Live countdown to the next airing episode. Ticks every second in a
// tabular display font; the glow pulse is disabled for reduced-motion
// users (the ticking itself is data, not motion, so it stays).
function NextEpisodeCountdown({ episode, airingAt }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000
  const pad = (n) => String(n).padStart(2, '0')
  const diffMs = airingAt * 1000 - now
  let d = 0
  let h = 0
  let m = 0
  let s = 0
  if (diffMs > 0) {
    d = Math.floor(diffMs / 86400000)
    h = Math.floor((diffMs % 86400000) / 3600000)
    m = Math.floor((diffMs % 3600000) / 60000)
    s = Math.floor((diffMs % 60000) / 1000)
  }
  // Most anime air weekly — the bar fills across a 7-day cycle.
  const progress = Math.min(
    100,
    Math.max(0, ((WEEK_MS - Math.max(diffMs, 0)) / WEEK_MS) * 100)
  )
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  parts.push(`${pad(h)}h`, `${pad(m)}m`, `${pad(s)}s`)
  return (
    <div
      className="watch-countdown"
      role="timer"
      aria-label={`Next episode ${episode} in ${d} days, ${h} hours, ${m} minutes and ${s} seconds`}
      style={{
        marginTop: 16,
        padding: '14px 16px',
        borderRadius: 12,
        background:
          'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(16,185,129,0.04))',
        border: '1px solid rgba(34,197,94,0.25)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            letterSpacing: 2,
            fontWeight: 700,
            color: '#4ade80',
            textTransform: 'uppercase',
          }}
        >
          Next Episode · Ep {episode}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date(airingAt * 1000).toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div
        className="watch-count-digits"
        style={{
          fontFamily: "'Orbitron', 'Rajdhani', monospace",
          fontSize: 'clamp(20px, 5vw, 30px)',
          fontWeight: 600,
          color: '#86efac',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: 2,
          marginTop: 8,
          animation: PREFERS_REDUCED_MOTION
            ? 'none'
            : 'watch-count-glow 2.4s ease-in-out infinite',
        }}
      >
        {parts.join(' ')}
      </div>
      <div
        style={{
          marginTop: 10,
          height: 4,
          borderRadius: 2,
          background: 'rgba(34,197,94,0.12)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #22c55e, #4ade80)',
            transition: PREFERS_REDUCED_MOTION ? 'none' : 'width 1s linear',
          }}
        />
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        {diffMs > 0 ? `Airing ${formatAiringDate(airingAt)}` : 'Airing now — refresh for the new episode'}
      </div>
    </div>
  )
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
        else if (fsRequest) fsRequest.call(document.documentElement)
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
  const [compactWatchLayout, setCompactWatchLayout] = useState(getCompactWatchLayout)
  const compactWatchLayoutRef = useRef(compactWatchLayout)
  compactWatchLayoutRef.current = compactWatchLayout

  useEffect(() => {
    const updateLayout = () => setCompactWatchLayout(getCompactWatchLayout())
    updateLayout()
    window.addEventListener('resize', updateLayout, { passive: true })
    const mediaQueries = [
      window.matchMedia?.('(max-width: 768px)'),
      window.matchMedia?.('(hover: none) and (pointer: coarse)'),
    ].filter(Boolean)
    mediaQueries.forEach((query) => query.addEventListener?.('change', updateLayout))
    return () => {
      window.removeEventListener('resize', updateLayout)
      mediaQueries.forEach((query) => query.removeEventListener?.('change', updateLayout))
    }
  }, [])

  // Refs
  const artRef = useRef(null)
  const artInstance = useRef(null)
  const hlsInstance = useRef(null)
  const dashInstance = useRef(null)
  const bufferIndicatorCleanupRef = useRef(null)
  const loadingRef = useRef(false)
  const playerContainerRef = useRef(null)
  const epSidebarRef = useRef(null)
  const buildIdRef = useRef(0)              // bumped on every buildPlayer
  const mountedRef = useRef(true)
  const toastTimerRef = useRef(null)
  const streamAbortRef = useRef(null)
  const prevEpisodeRef = useRef(null)
  const recoveryBusyRef = useRef(false)
  const streamRetries = useRef({})
  const quietProviderSwitchRef = useRef(null)
  const skipQuietProviderReloadRef = useRef(null)
  const lastBlockCycleRef = useRef(0)
  const handleProviderBlockedRef = useRef(null)
  const streamCacheRef = useRef(new Map())   // short-TTL working streams
  const providerWarmRequestsRef = useRef(new Map())
  const embedFrameRef = useRef(null)
  const netHintRef = useRef(getConnectionHint())

  // State
  const [anime, setAnime] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [streamLoading, setStreamLoading] = useState(false)
  const [activeEmbedUrl, setActiveEmbedUrl] = useState('')
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
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [backendHealthy, setBackendHealthy] = useState(true)
  const [errorType, setErrorType] = useState('') // for actionable UI

  // Embedded providers are cross-origin, so the parent page cannot inspect or
  // block their network requests. We still apply safe browser-level defenses:
  // popup/new-window attempts are restricted by sandbox, and same-origin
  // embeds get lightweight overlay cleanup without touching the video element.
  useEffect(() => {
    const frame = embedFrameRef.current
    if (!activeEmbedUrl || !frame) return undefined

    let observer = null
    let originalOpen = null
    const adPattern = /(^|[-_])(?:ad|ads|advert|advertisement|banner|popup|popunder|sponsor)([-_]|$)/i

    const cleanSameOriginEmbed = () => {
      try {
        const doc = frame.contentDocument
        const win = frame.contentWindow
        if (!doc || !win) return

        if (!doc.getElementById('aniraku-embed-ad-guard')) {
          const style = doc.createElement('style')
          style.id = 'aniraku-embed-ad-guard'
          style.textContent = `
            [id*="advert"], [class*="advert"], [id*="popup"], [class*="popup"],
            [id*="popunder"], [class*="popunder"], [id*="banner-ad"], [class*="banner-ad"],
            [data-ad], [data-ad-slot], iframe[src*="ad" i], iframe[src*="popup" i] {
              display: none !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
          `
          doc.head?.appendChild(style)
        }

        originalOpen = win.open
        try {
          win.open = (url, target, features) => {
            const destination = String(url || '')
            if (!destination || adPattern.test(destination)) return null
            return originalOpen.call(win, url, target, features)
          }
        } catch {}

        const removeAdNodes = () => {
          doc.querySelectorAll('[id], [class], [data-ad], [data-ad-slot]').forEach((node) => {
            if (node === doc.body || node.matches('video, audio, source, track, canvas')) return
            const token = `${node.id || ''} ${typeof node.className === 'string' ? node.className : ''}`
            if (adPattern.test(token)) {
              node.style.setProperty('display', 'none', 'important')
            }
          })
        }
        removeAdNodes()
        observer = new window.MutationObserver(removeAdNodes)
        observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['id', 'class', 'data-ad', 'data-ad-slot'] })
      } catch {
        // Cross-origin frames intentionally reject DOM access; sandbox still
        // blocks popup/new-window behavior without breaking normal playback.
      }
    }

    frame.addEventListener('load', cleanSameOriginEmbed)
    cleanSameOriginEmbed()
    return () => {
      frame.removeEventListener('load', cleanSameOriginEmbed)
      observer?.disconnect()
      try {
        if (originalOpen && frame.contentWindow) frame.contentWindow.open = originalOpen
      } catch {}
    }
  }, [activeEmbedUrl])
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [buffering, setBuffering] = useState(false)

  // Verified skip intervals from the provider and AniSkip. Provider data
  // wins when present; AniSkip supplies anime-wide coverage by MAL ID.
  const [skipSegments, setSkipSegments] = useState({ intro: null, outro: null })
  const skipSegmentsRef = useRef({ intro: null, outro: null })
  const [currentTime, setCurrentTime] = useState(0)
  const [autoSkip, setAutoSkip] = useState(() => {
    try {
      return localStorage.getItem('aniraku-auto-skip') !== 'off'
    } catch {
      return true
    }
  })
  const autoSkipRef = useRef(autoSkip)
  autoSkipRef.current = autoSkip
  const autoSkippedRef = useRef({ intro: false, outro: false })
  const [autoSkipFailures, setAutoSkipFailures] = useState({ intro: false, outro: false })
  const autoSkipFailuresRef = useRef(autoSkipFailures)
  autoSkipFailuresRef.current = autoSkipFailures
  const [hideFillers, setHideFillers] = useState(false)

  // Auto-play next episode when the current one ends (user-toggleable).
  const [autoNext, setAutoNext] = useState(() => {
    try {
      return localStorage.getItem('aniraku-auto-next') !== 'off'
    } catch {
      return true
    }
  })
  const autoNextRef = useRef(autoNext)
  autoNextRef.current = autoNext
  const setAutoNextPreference = useCallback((value) => {
    const next = Boolean(value)
    autoNextRef.current = next
    setAutoNext(next)
    try {
      localStorage.setItem('aniraku-auto-next', next ? 'on' : 'off')
    } catch {}
    return next
  }, [])

  const applySkipSegments = useCallback((incoming) => {
    const merged = mergeSkipSegments(skipSegmentsRef.current, incoming)
    skipSegmentsRef.current = merged
    setSkipSegments(merged)
    return merged
  }, [])

  const setAutoSkipPreference = useCallback((value) => {
    const next = Boolean(value)
    autoSkipRef.current = next
    autoSkippedRef.current = { intro: false, outro: false }
    const clearedFailures = { intro: false, outro: false }
    autoSkipFailuresRef.current = clearedFailures
    setAutoSkipFailures(clearedFailures)
    setAutoSkip(next)
    try {
      localStorage.setItem('aniraku-auto-skip', next ? 'on' : 'off')
    } catch {}
    return next
  }, [])

  // "Episode finished" overlay — shown when auto-next is off.
  const [showEndedOverlay, setShowEndedOverlay] = useState(false)

  // Comments FAB: hide once the comments section is on screen; show a
  // live count so the button is worth the thumb-tap.
  const [commentsVisible, setCommentsVisible] = useState(false)
  const [commentCount, setCommentCount] = useState(null)

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

  // Comments FAB: hide once the comments section is on screen; show a
  // live count so the button is worth the thumb-tap.
  useEffect(() => {
    const el = document.getElementById('watch-comments')
    if (!el || !window.IntersectionObserver) return
    const updateVisibility = () => {
      const rect = el.getBoundingClientRect()
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const isVisible = rect.top < viewportHeight * 0.88 && rect.bottom > 0
      setCommentsVisible((previous) => previous === isVisible ? previous : isVisible)
    }
    const obs = new window.IntersectionObserver(
      () => updateVisibility(),
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 }
    )
    obs.observe(el)
    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.visualViewport?.addEventListener('resize', updateVisibility)
    return () => {
      obs.disconnect()
      window.removeEventListener('scroll', updateVisibility)
      window.visualViewport?.removeEventListener('resize', updateVisibility)
    }
  }, [anime?.id, epNumber])
  useEffect(() => {
    if (!animeId) return
    let cancelled = false
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('anime_id', parseInt(animeId, 10))
      .eq('episode_number', epNumber)
      .then(({ count }) => {
        if (!cancelled) setCommentCount(count ?? 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [animeId, epNumber])

  // ────────────────────────────────────────────────────────────
  // MAL / AniList progress sync
  // ────────────────────────────────────────────────────────────
  const syncConnectedRef = useRef(null) // null = not fetched yet
  const syncProgressRef = useRef(null)
  const skipSwitchSyncRef = useRef(false) // episode already synced on 'ended'
  const syncWatchProgress = useCallback(async (mode = 'completed') => {
    if (!user) return
    // Only sync when something actually played: no player, no stream, or a
    // 0-duration source (empty/upcoming episodes) must never mark progress.
    const art = artInstance.current
    if (!art?.video) return
    const el = art.video
    const dur = Math.floor(el.duration || 0)
    if (noStreamError || dur <= 0) return
    const played = Math.floor(el.currentTime || 0)
    if (played <= 0) return
    let synced = []
    let failed = []
    try {
      if (syncConnectedRef.current === null) {
        const data = await getSyncStatus()
        if (!data) return
        syncConnectedRef.current = ['mal', 'anilist'].filter(
          (p) => data[p]?.configured && data[p]?.connected
        )
      }
      const providers = syncConnectedRef.current
      if (providers.length === 0) return
      const results = await Promise.allSettled(
        providers.map((p) =>
          updateSyncProgress({
            provider: p,
            animeId: parseInt(animeId, 10),
            episode: epNumber,
            progress: mode === 'completed' ? dur : played,
            status: mode === 'completed' ? 'completed' : 'watching',
          })
        )
      )
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value?.ok) {
          synced.push(PROVIDER_LABELS[providers[i]])
        } else {
          failed.push(
            PROVIDER_LABELS[providers[i]] +
              (r.status === 'fulfilled' && r.value?.error ? ` (${r.value.error})` : '')
          )
        }
      })
    } catch {}
    if (synced.length > 0 && failed.length === 0) {
      showToast(`Progress synced to ${synced.join(' & ')}`, { icon: 'check' })
    } else if (failed.length > 0) {
      showToast(`Sync to ${failed.join(', ')} failed — will retry next episode`, {
        icon: 'warn',
        long: true,
      })
    }
  }, [user, animeId, epNumber, noStreamError])
  syncProgressRef.current = syncWatchProgress

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      showToast('Back online — resuming…', { icon: 'wifi' })
      // Verify the backend is actually up after reconnecting; Render may
      // still be cold-starting while the browser is already back online.
      checkBackendHealth().then((ok) => {
        if (!ok && mountedRef.current) {
          showToast('Backend is still warming up — retrying shortly…', {
            icon: 'warn',
            long: true,
          })
        }
      })
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

  // Page lifecycle — save & pause on hide, resume on show
  useEffect(() => {
    const onHide = () => {
      const art = artInstance.current
      if (art && !art.video.paused) art.video.pause()
    }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [])

  // Reset per-episode recovery state.
  useEffect(() => {
    lastBlockCycleRef.current = 0
    recoveryBusyRef.current = false
    streamRetries.current = {}
	}, [animeId, epNumber])

  // Keep the active episode row visible in the sidebar.
  useEffect(() => {
    const list = epSidebarRef.current
    const active = list?.querySelector('[data-active="true"]')
    if (active && list) {
      const elRect = active.getBoundingClientRect()
      const listRect = list.getBoundingClientRect()
      if (elRect.top < listRect.top || elRect.bottom > listRect.bottom) {
        active.scrollIntoView({ block: 'center' })
      }
    }
  }, [epNumber, showEpSidebar])

  // Toast
  const showToast = useCallback((msg, opts = {}) => {
    setToast({ msg, ...opts })
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), opts.long ? 4000 : 2500)
  }, [])

  const skipSegmentNow = useCallback((type) => {
    const segment = skipSegmentsRef.current[type]
    const art = artInstance.current
    if (!segment || !art?.video) {
      showToast(type === 'intro' ? 'Intro skip data is unavailable' : 'Outro skip data is unavailable', { icon: 'warn' })
      return false
    }
    if (!attemptSkipSegment(art.video, segment)) {
      showToast(type === 'intro' ? 'Intro could not be skipped' : 'Outro could not be skipped', { icon: 'warn' })
      return false
    }
    autoSkippedRef.current[type] = true
    showToast(type === 'intro' ? 'Intro skipped' : 'Outro skipped', { icon: 'ok' })
    return true
  }, [showToast])

  // ────────────────────────────────────────────────────────────
  // Episode ratings (own, 1-10) — the average of your episode
  // ratings is pushed to MAL / AniList as the anime score.
  // ────────────────────────────────────────────────────────────
  const [epRatings, setEpRatings] = useState({})
  const [epRatingSaving, setEpRatingSaving] = useState(false)
  const [epRatingSaved, setEpRatingSaved] = useState(false)
  const epRatingSaveTimerRef = useRef(null)

  useEffect(() => {
    if (!animeId) return
    let cancelled = false
    setEpRatings({})
    if (user) {
      fetchEpisodeRatings(animeId).then((ratings) => {
        if (cancelled) return
        setEpRatings(ratings || {})
      })
    } else {
      try {
        const stored = JSON.parse(
          localStorage.getItem(`${EPISODE_RATINGS_LS_KEY}-${animeId}`) || '{}'
        )
        if (!cancelled) setEpRatings(stored)
      } catch {}
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId, user])

  const saveRating = useCallback(
    async (score) => {
      if (epRatingSaving || !animeId || !epNumber) return
      setEpRatingSaving(true)
      setEpRatingSaved(false)
      const next = { ...epRatings, [epNumber]: score }
      setEpRatings(next)
      let ok = false
      if (user) {
        ok = await saveEpisodeRating(animeId, epNumber, score)
      } else {
        try {
          localStorage.setItem(
            `${EPISODE_RATINGS_LS_KEY}-${animeId}`,
            JSON.stringify(next)
          )
          ok = true
        } catch {}
      }
      if (ok) {
        const scores = Object.values(next).filter((s) => typeof s === 'number')
        const avg = scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0
        if (avg >= 1 && avg <= 10) {
          if (syncConnectedRef.current === null) {
            const data = await getSyncStatus()
            if (data) {
              syncConnectedRef.current = ['mal', 'anilist'].filter(
                (p) => data[p]?.configured && data[p]?.connected
              )
            }
          }
          const providers = syncConnectedRef.current || []
          if (providers.length > 0) {
            Promise.allSettled(
              providers.map((p) =>
                updateSyncScore({
                  provider: p,
                  animeId: parseInt(animeId, 10),
                  score: avg,
                })
              )
            ).then((results) => {
              const done = results.filter(
                (r) => r.status === 'fulfilled' && r.value
              ).length
              if (done > 0) {
                showToast(
                  `Score ${avg}/10 synced to ${providers
                    .map((p) => PROVIDER_LABELS[p])
                    .join(' & ')}`,
                  { icon: 'check' }
                )
              }
            })
          }
        }
      }
      setEpRatingSaving(false)
      setEpRatingSaved(true)
      clearTimeout(epRatingSaveTimerRef.current)
      epRatingSaveTimerRef.current = setTimeout(
        () => setEpRatingSaved(false),
        2000
      )
    },
    [epRatingSaving, epRatings, user, animeId, epNumber, showToast]
  )

  // ────────────────────────────────────────────────────────────
  // Watched episodes (per-anime) — merged from local history and
  // the cloud watch_history so the sidebar can show checkmarks.
  // ────────────────────────────────────────────────────────────
  const [watchedEps, setWatchedEps] = useState(() => new Set())
  useEffect(() => {
    if (!animeId) return
    let cancelled = false
    const localEps = []
    try {
      localEps.push(
        ...JSON.parse(
          localStorage.getItem('aniraku-watch-history') || '[]'
        ).filter((h) => String(h.animeId) === String(animeId))
      )
    } catch {}
    const merge = (rows) => {
      if (cancelled) return
      const eps = new Set(localEps.map((h) => h.episode))
      rows.forEach((r) => eps.add(r.episode_number))
      setWatchedEps(eps)
    }
    if (user) {
      supabase
        .from('watch_history')
        .select('episode_number')
        .eq('user_id', user.id)
        .eq('anime_id', parseInt(animeId, 10))
        .then(({ data }) => merge(data || []))
        .catch(() => merge([]))
    } else {
      merge([])
    }
    return () => {
      cancelled = true
    }
  }, [animeId, user])

  // Mark the current episode watched so the sidebar updates live.
  useEffect(() => {
    if (!epNumber) return
    setWatchedEps((prev) => {
      if (prev.has(epNumber)) return prev
      const next = new Set(prev)
      next.add(epNumber)
      return next
    })
  }, [epNumber])

  useEffect(() => subscribeToWatchHistory((detail) => {
    const currentKey = historyEntryKey({ animeId, episode: epNumber })
    if (detail.type === 'clear' || (detail.type === 'remove' && detail.keys?.includes(currentKey))) {
      setWatchedEps((prev) => {
        const next = new Set(prev)
        next.delete(epNumber)
        return next
      })
    }
  }), [animeId, epNumber])

  // ────────────────────────────────────────────────────────────
  // Online / offline detection
  // ────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────
  // Sources (deduped)
  // ────────────────────────────────────────────────────────────
  const SOURCES = useMemo(() => {
    const normalize = (arr, fallbackLang) => {
      const seen = new Set()
      return (Array.isArray(arr) ? arr : []).map((server, index) => {
        const family = String(server?.provider || 'miruro')
        const name = String(server?.name || server?.provider || `source-${index + 1}`)
        const lang = server?.lang || fallbackLang
        const key = `${family}:${name}:${lang}`
        if (seen.has(key)) return null
        seen.add(key)
        const initialSources = Array.isArray(server?.sources) ? server.sources : []
        const mediaSources = initialSources.filter((source) => {
          // Verification is an advisory snapshot. Keep usable non-embed URLs
          // even when the list response says "dead" so the provider remains
          // available for the stream endpoint's fresh response and failover.
          return getSourcePlaybackType(source) !== 'embed' && source?.url && !hasExpiredEmbeddedToken(source.url)
        })
        const embedSources = initialSources.filter(isPlayableEmbedSource)
		const playableSources = [...mediaSources, ...embedSources]
		if (playableSources.length === 0) return null
		return {
			id: key,
			label: name,
			provider: name,
			providerFamily: family,
			lang,
			initialSources: playableSources,
			headers: server?.headers || {},
		}
      }).filter(Boolean)
    }
    return { sub: normalize(servers.sub, 'sub'), dub: normalize(servers.dub, 'dub') }
  }, [servers])


	const currentSource = useMemo(() => {
    const all = [...SOURCES.sub, ...SOURCES.dub]
    return all.find((s) => s.id === activeSource) || all[0] || null
  }, [SOURCES, activeSource])

  const hasSub = SOURCES.sub.length > 0
  const hasDub = SOURCES.dub.length > 0

  // Auto-select only when there is no valid current choice. SUB remains the
  // preferred first start, but a user-selected DUB source must stay selected
  // rather than being reset on the next render.
  useEffect(() => {
    const allSources = [...SOURCES.sub, ...SOURCES.dub]
    if (allSources.some((source) => source.id === activeSource)) return
    const preferred = SOURCES.sub[0] || SOURCES.dub[0]
    if (preferred) setActiveSource(preferred.id)
  }, [SOURCES, activeSource])

  // Filtered / paged episodes
  const filteredEps = useMemo(() => {
    let eps = episodes
    if (hideFillers) eps = eps.filter((ep) => !ep.filler && !ep.recap)
    if (epSearch) {
      const q = epSearch.toLowerCase()
      eps = eps.filter(
        (ep) =>
          String(ep.number).includes(q) ||
          (ep.title && ep.title.toLowerCase().includes(q))
      )
    }
    return eps
  }, [episodes, epSearch, hideFillers])

  const hiddenEpCount = useMemo(
    () => episodes.length - episodes.filter((ep) => !ep.filler && !ep.recap).length,
    [episodes]
  )

  const [epPage, setEpPage] = useState(0)
  const pagedEps = useMemo(() => {
    const start = epPage * EPISODES_PER_PAGE
    return filteredEps.slice(start, start + EPISODES_PER_PAGE)
  }, [filteredEps, epPage])
  const totalEpPages = Math.ceil(filteredEps.length / EPISODES_PER_PAGE)

  // Prev/next
  const goNext = useCallback(() => {
    const total = episodes.length || anime?.episodes || 0
    if (epNumber < total) {
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

  // Replay the finished episode from the start (used by the
  // "episode ended" overlay when auto-next is off).
  const replayEpisode = useCallback(() => {
    const art = artInstance.current
    if (art?.video) {
      art.video.currentTime = 0
      art.play()
    }
    setShowEndedOverlay(false)
  }, [])

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
        // The episode endpoint can be temporarily unavailable during an
        // upstream AniList throttle even when anime metadata succeeded. Keep a
        // navigable chooser in that case instead of rendering an empty Watch
        // sidebar until the backend recovers.
        if (!epData?.episodes?.length && animeData?.episodes) {
          epData = {
            episodes: Array.from(
              { length: animeData.episodes },
              (_, i) => ({
                number: i + 1,
                title: `Episode ${i + 1}`,
                thumbnail: animeData.coverImage?.medium || animeData.coverImage?.large || '',
              })
            ),
          }
        }
        if (cancelled) return
        setAnime(animeData)
        setEpisodes(normalizeEpisodeList(epData?.episodes))
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

  // The stream backend may omit the MAL mapping. Hydrate it from AniList so
  // AniSkip can still serve timestamps for the same title.
  const malId = getMalId(anime)
  useEffect(() => {
    if (!animeId || !anime || malId) return
    let cancelled = false
    anilistQuery(ANIME_DETAIL_QUERY, { id: parseInt(animeId, 10) })
      .then(({ data }) => {
        const nextMalId = getMalId(data?.Media)
        if (!cancelled && nextMalId) {
          setAnime((prev) => prev ? { ...prev, idMal: nextMalId } : prev)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [animeId, anime, malId])

  useEffect(() => {
    skipSegmentsRef.current = { intro: null, outro: null }
    setSkipSegments(skipSegmentsRef.current)
    autoSkippedRef.current = { intro: false, outro: false }
    const clearedFailures = { intro: false, outro: false }
    autoSkipFailuresRef.current = clearedFailures
    setAutoSkipFailures(clearedFailures)
  }, [animeId, epNumber])

  // AniSkip is the anime-specific, verified timestamp source. It requires a
  // MAL ID and episode length; `0` is accepted and lets the lookup start
  // before media metadata is available. Provider timestamps remain higher
  // priority through applySkipSegments().
  useEffect(() => {
    if (!malId || !epNumber) return
    let cancelled = false
    const controller = new AbortController()
    const load = async () => {
      const cached = readSkipCache(malId, epNumber)
      if (cached) {
        if (!cancelled && cached.segments) applySkipSegments(cached.segments)
        return
      }
      const params = new URLSearchParams()
      ;['op', 'ed'].forEach((type) => params.append('types[]', type))
      const duration = Number(artInstance.current?.video?.duration)
      params.set('episodeLength', String(Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 0))
      try {
        const response = await fetch(`${ANISKIP_API_BASE}/skip-times/${malId}/${epNumber}?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })
        if (response.status === 404) {
          writeSkipCache(malId, epNumber, null, true)
          return
        }
        if (!response.ok) return
        const payload = await response.json()
        const segments = normalizeAniSkipSegments(payload)
        if (cancelled) return
        if (!segments.intro && !segments.outro) {
          writeSkipCache(malId, epNumber, null, true)
          return
        }
        writeSkipCache(malId, epNumber, segments)
        applySkipSegments(segments)
      } catch (error) {
        if (error?.name !== 'AbortError') console.warn('AniSkip lookup failed:', error)
      }
    }
    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [malId, epNumber, applySkipSegments])

  // SEO metadata. Reset immediately on URL changes so a previous episode
  // title cannot remain in the browser tab while the next anime is loading.
  useEffect(() => {
    const isCurrentAnime = anime && String(anime.id) === String(animeId)
    if (isCurrentAnime) {
      setWatchSEO(anime, epNumber)
    } else {
      setTitle(`Watch Episode ${epNumber || 1} Online Free — Aniraku`)
    }
  }, [anime?.id, animeId, epNumber, slugId])

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

  const pendingResumeRef = useRef(null)
  const pendingHandoffRef = useRef(null)
  const handleResume = useCallback(() => {
    const art = artInstance.current
    if (art && resumePos) {
      art.video.currentTime = resumePos
    } else if (resumePos && !art) {
      // Player not built yet — apply the position once it can play.
      pendingResumeRef.current = resumePos
    }
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
    // A native media event may have raised the indicator immediately before an
    // iframe handoff. Never allow that stale event to cover the next player.
    setBuffering(false)
    bufferIndicatorCleanupRef.current?.()
    bufferIndicatorCleanupRef.current = null
    if (dashInstance.current) {
      try {
        dashInstance.current.reset()
      } catch {}
      dashInstance.current = null
    }
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

  useEffect(() => {
    // Provider players are cross-origin frames. Their playback events are not
    // observable from the page, so a prior native `waiting` event must not
    // leave the page-owned buffering badge above the frame.
    if (activeEmbedUrl) setBuffering(false)
  }, [activeEmbedUrl])

  useEffect(
    () => () => {
      mountedRef.current = false
      if (streamAbortRef.current) {
        try {
          streamAbortRef.current.abort()
        } catch {}
      }
      clearTimeout(toastTimerRef.current)
      destroyPlayer()
    },
    [destroyPlayer]
  )

  const buildPlayer = useCallback(
    async (streamUrl, sourceType, qualityList, subtitles, headers, onBlocked) => {
      destroyPlayer()
      setActiveEmbedUrl('')
      const container = artRef.current
      if (!container) return

      const myBuildId = ++buildIdRef.current
      const headersParam = headers
        ? `&headers=${encodeURIComponent(JSON.stringify(headers))}`
        : ''
      // Per-build nonce: every playback session gets fresh proxy URLs, so
      // stale edge-cache variants can never be served to the browser.
      // The backend strips "rn" before dialing the CDN.
      const nonce =
        Math.random().toString(36).slice(2) + Date.now().toString(36)
	      const proxied = (u) =>
	        `${PROXY_BASE}/proxy?url=${encodeURIComponent(u)}${headersParam}&rn=${nonce}`
			const activeQuality = Array.isArray(qualityList)
				? qualityList.find((quality) => quality?.url === streamUrl)
				: null
			const sourceVerification = String(activeQuality?.verification || '').trim().toLowerCase()

      // Browser-native media playback — proxy first, direct as fallback.
      // This covers MP4, WebM, Ogg, MPEG and extensionless URLs whose
      // Content-Type is a format the browser can decode.
	      const playAsNative = async (video, url, art) => {
			const transportPlan = createMediaTransportPlan({
				verification: sourceVerification,
				directUrl: url,
				proxyUrl: proxied(url),
			})
	        let transportIndex = 0
	        let hlsTried = false
        const tryUrl = (target, withCors) => {
          try {
            if (withCors) {
              video.crossOrigin = 'anonymous'
            } else {
              // Some direct media hosts omit ACAO but permit ordinary video
              // playback. Removing the attribute prevents this fallback from
              // being rejected in CORS mode before its same-provider embed is
              // considered.
              video.removeAttribute('crossorigin')
            }
            video.preload = getNativeMediaBufferPolicy().preload
            video.src = target
            video.load()
            const p = video.play()
            if (p && typeof p.catch === 'function') p.catch(() => {})
            return true
          } catch {
            return false
          }
        }
        const tryHls = async () => {
          if (hlsTried || buildIdRef.current !== myBuildId) return false
          hlsTried = true
          let Hls
          try {
            const mod = await import('hls.js')
            Hls = mod.default
          } catch {
            return false
          }
          if (!Hls?.isSupported?.() || buildIdRef.current !== myBuildId) return false
          const hls = new Hls({
            enableWorker: false,
            ...getHlsBufferPolicy(netHintRef.current),
            ...getHlsLoadPolicies(),
            startFragPrefetch: true,
            lowLatencyMode: false,
          })
          hlsInstance.current = hls
          art.hls = hls
          hls.loadSource(proxied(url))
          hls.attachMedia(video)
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (buildIdRef.current !== myBuildId) return
            if (pendingHandoffRef.current?.shouldPlay !== false) video.play().catch(() => {})
          })
          let lastMediaRecoveryAt = 0
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (buildIdRef.current !== myBuildId || !data?.fatal) return
            if (
              data.type === Hls.ErrorTypes.MEDIA_ERROR &&
              Date.now() - lastMediaRecoveryAt >= 5_000
            ) {
              lastMediaRecoveryAt = Date.now()
              try {
                hls.recoverMediaError()
                return
              } catch {}
            }
	            if (onBlocked) onBlocked('playback-error')
          })
          return true
        }

	        tryUrl(transportPlan[transportIndex].url, transportPlan[transportIndex].mode === 'proxy')
	        video.onerror = async () => {
	          if (buildIdRef.current !== myBuildId) return
	          if (transportIndex + 1 < transportPlan.length) {
	            transportIndex += 1
	            showToast(
					transportPlan[transportIndex].mode === 'direct'
						? 'Trying direct playback…'
						: 'Trying the media proxy…'
				)
	            tryUrl(
					transportPlan[transportIndex].url,
					transportPlan[transportIndex].mode === 'proxy'
				)
	            return
	          }
          if (shouldTryHlsFallback(url) && await tryHls()) return
	          showToast('Direct playback failed — choose another server if needed.', { long: true })
          if (onBlocked) onBlocked('native-media-error')
          else setError('Stream playback error. Try a different server.')
        }
      }

	      // Recovery after ArtPlayer's reconnect loop is intentionally manual.
	      // Auto-changing a representation or provider made healthy servers look
	      // blocked and replaced a viewer's selected playback path unexpectedly.
	      const recoverPlayback = () => {
	        if (buildIdRef.current !== myBuildId) return
	        if (recoveryBusyRef.current) return
	        recoveryBusyRef.current = true
	        recoveryBusyRef.current = false
	        showToast('Playback interrupted — choose another server manually.', {
	          long: true,
	        })
	        if (onBlocked) onBlocked('playback-error')
        else setError('Stream playback error. Try a different server.')
      }

      const playerConfig = {
        container,
        url: streamUrl,
        type:
          sourceType === 'hls'
            ? 'm3u8'
            : sourceType === 'dash'
            ? 'mpd'
            : 'native',
        autoplay: true,
        // iOS Safari has no requestPictureInPicture — the attempt throws and
        // ArtPlayer logs noise; Android TV / Smart TV apps handle PiP at the
        // OS level, so the button is pointless there too.
        pip: !IS_IOS && !IS_TV,
        autoSize: false,
        // Minimizing into a floating corner fights the mobile UI (and iOS
        // scroll-locking); on desktop it is a nice touch.
        autoMini: !IS_MOBILE && !compactWatchLayoutRef.current,
        fullscreen: true,
        fullscreenWeb: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: true,
        // TV remotes have no rotation sensor; keep the player orientation
        // locked so Android TV never flips it.
        autoOrientation: !IS_TV,
        airplay: true,
        setting: true,
        hotkey: false,
        theme: '#e2e8f0',
        volume: 0.7,
        isLive: false,
        lang:
          (navigator.language || 'en').toLowerCase() === 'zh-cn' ? 'zh-cn' : 'en',
        moreVideoAttr: {
          crossOrigin: 'anonymous',
          preload: getNativeMediaBufferPolicy().preload,
          playsInline: true,
          'webkit-playsinline': 'true',
          'x5-playsinline': 'true',
        },
        // Artplayer inserts these between Play and Sound (the built-in
        // volume control uses index 20). They remain visible on desktop,
        // keyboard-accessible, and use the same seek helper as touch UI.
        controls: [
          {
            name: 'seekBackward10',
            position: 'left',
            index: 15,
            html: seekControlHtml(-1),
            tooltip: 'Back 10 seconds',
            style: { width: '42px', margin: '0 1px' },
            click: function () {
              const nextTime = seekVideoBy(this, -SEEK_SECONDS)
              if (nextTime !== null) {
                showToast(`−10s · ${formatTime(nextTime)}`)
              }
            },
          },
          {
            name: 'seekForward10',
            position: 'left',
            index: 16,
            html: seekControlHtml(1),
            tooltip: 'Forward 10 seconds',
            style: { width: '42px', margin: '0 1px' },
            click: function () {
              const nextTime = seekVideoBy(this, SEEK_SECONDS)
              if (nextTime !== null) {
                showToast(`+10s · ${formatTime(nextTime)}`)
              }
            },
          },
        ],
        settings: [
          {
            name: 'quality',
            width: 220,
            html: getQualitySettingTitle(qualityList.find((item) => item.default) || qualityList[0]),
            selector: qualityList.map((item) => ({
              default: Boolean(item.default),
              html: item.html,
              value: item.url,
            })),
            onSelect: (item) => {
              const selected = qualityList.find((quality) => quality.url === item.value)
              const art = artInstance.current
              if (selected && art && selected.url !== art.option.url) {
                const resumeAt = Number(art.video?.currentTime || 0)
                if (resumeAt > 0) pendingResumeRef.current = resumeAt
                buildPlayer(
                  selected.url,
                  selected.type || 'hls',
                  selectQualityInList(qualityList, selected.url),
                  subtitles,
                  headers,
                  onBlocked
                )
              }
              return getQualitySettingTitle(selected)
            },
          },
          {
            name: 'autoSkip',
            width: 220,
            html: 'Auto-skip intro & outro',
            switch: autoSkipRef.current,
            onSwitch: (item) => {
              const next = setAutoSkipPreference(!autoSkipRef.current)
              item.switch = next
              return next
            },
          },
          {
            name: 'autoNext',
            width: 220,
            html: 'Auto-next episode',
            switch: autoNextRef.current,
            onSwitch: (item) => {
              const next = setAutoNextPreference(!autoNextRef.current)
              item.switch = next
              return next
            },
          },

          {
            name: 'playbackSpeed',
            width: 180,
            html: 'Playback speed',
            selector: [
              { html: '0.5×', value: 0.5 },
              { html: '0.75×', value: 0.75 },
              { default: true, html: 'Normal (1×)', value: 1 },
              { html: '1.25×', value: 1.25 },
              { html: '1.5×', value: 1.5 },
              { html: '1.75×', value: 1.75 },
              { html: '2×', value: 2 },
            ],
            onSelect: (item) => {
              const video = artInstance.current?.video
              if (video && Number.isFinite(Number(item.value))) {
                video.playbackRate = Number(item.value)
                showToast(`Speed ${item.value}x`, { icon: 'ok' })
              }
              return item.html
            },
          },
        ],
        customType: {
          native: (video, url, art) => playAsNative(video, url, art),
          mp4: (video, url, art) => playAsNative(video, url, art),
          mpd: async (video, url, art) => {
            let dash
            try {
              const mod = await import('dashjs')
              dash = mod.default || mod
            } catch {
              if (buildIdRef.current === myBuildId) {
                showToast('DASH engine failed to load — trying another server.', { long: true })
                onBlocked?.('unsupported-format')
              }
              return
            }
            if (buildIdRef.current !== myBuildId) return
            try {
              const player = dash.MediaPlayer().create()
              player.updateSettings?.({
                streaming: {
                  buffer: getDashBufferPolicy(netHintRef.current),
                },
              })
              const dashProxy = (request) => {
                if (!request?.url || request.url.startsWith(PROXY_BASE) || request.url.startsWith('data:')) {
                  return Promise.resolve(request)
                }
                request.url = proxied(request.url)
                return Promise.resolve(request)
              }
              if (typeof player.addRequestInterceptor === 'function') {
                player.addRequestInterceptor(dashProxy)
                player.initialize(video, url, true)
              } else {
                player.initialize(video, proxied(url), true)
              }
              dashInstance.current = player
              player.on?.(dash.MediaPlayer.events.ERROR, (event) => {
                if (buildIdRef.current !== myBuildId) return
                if (event?.error || event?.event?.error) onBlocked?.('dash-error')
              })
            } catch {
              if (buildIdRef.current === myBuildId) onBlocked?.('dash-error')
            }
          },
	          m3u8: async (video, url, art) => {
	            const proxiedH = proxied
	            const referer = (headers && headers.Referer) || ''
				const hlsTransportPlan = createMediaTransportPlan({
					verification: sourceVerification,
					directUrl: url,
					proxyUrl: proxiedH(url),
				})
				let hlsTransportIndex = 0
		          const updateNativeHlsQualities = async () => {
		            try {
		              const response = await fetch(hlsTransportPlan[hlsTransportIndex].url, { cache: 'no-store' })
	              if (!response.ok) return
	              const lines = (await response.text()).split(/\r?\n/)
	              const variants = []
	              for (let index = 0; index < lines.length; index += 1) {
	                const streamInfo = lines[index]
	                if (!streamInfo.startsWith('#EXT-X-STREAM-INF:')) continue
	                const child = lines.slice(index + 1).find((line) => line && !line.startsWith('#'))
	                const height = Number(streamInfo.match(/RESOLUTION=\d+x(\d+)/i)?.[1] || 0)
	                if (!child || !height) continue
	                const childCandidate = new URL(child, window.location.origin)
	                const childUrl = childCandidate.origin === new URL(PROXY_BASE).origin && childCandidate.pathname.endsWith('/proxy')
	                  ? childCandidate.searchParams.get('url') || new URL(child, url).toString()
	                  : new URL(child, url).toString()
	                if (!variants.some((item) => item.height === height)) variants.push({ height, url: childUrl })
	              }
	              variants.sort((a, b) => b.height - a.height)
	              if (variants.length < 2 || !art?.setting?.update) return
	              const nativeQualityList = [
	                {
	                  default: true,
	                  html: qualityOptionHtml(getQualityPresentation('auto')),
	                  url,
	                  type: 'hls',
	                },
	                ...variants.map((variant) => ({
	                  default: false,
	                  html: qualityOptionHtml(getQualityPresentation(`${variant.height}p`)),
	                  url: variant.url,
	                  type: 'hls',
	                })),
	              ]
	              art.setting.update({
	                name: 'quality',
	                width: 220,
	                html: 'Quality',
	                selector: [
	                  { default: true, html: qualityOptionHtml(getQualityPresentation('auto')), value: 'auto' },
	                  ...variants.map((variant) => ({
	                    default: false,
	                    html: qualityOptionHtml(getQualityPresentation(`${variant.height}p`)),
	                    value: variant.url,
	                  })),
	                ],
	                onSelect: (item) => {
	                  const selected = item.value === 'auto'
	                    ? nativeQualityList[0]
	                    : variants.find((variant) => item.html.includes(`${variant.height}p`))
	                  const next = selected?.url || url
	                  const resumeAt = Number(video.currentTime || 0)
	                  if (resumeAt > 0) pendingResumeRef.current = resumeAt
	                  buildPlayer(next, 'hls', nativeQualityList, subtitles, headers, onBlocked)
	                  return item.html
	                },
	              })
	            } catch {}
	          }
            // Kiwi is verified on the native proxy-first HLS branch. Ally and
            // other manifests remain on hls.js, whose bounded buffer and media
            // recovery avoid falling through to an expired embed page.
            if (shouldPreferNativeHls(url) && video.canPlayType('application/vnd.apple.mpegurl')) {
	              try {
	                video.src = hlsTransportPlan[hlsTransportIndex].url
	                if (pendingHandoffRef.current?.shouldPlay !== false) {
	                  const p = video.play()
	                  if (p && typeof p.catch === 'function') p.catch(() => {})
	                }
	              void updateNativeHlsQualities()
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
	                if (pendingHandoffRef.current?.shouldPlay !== false) video.play().catch(() => {})
	              } catch {}
              return
            }
            if (art.hls) {
              try {
                art.hls.destroy()
              } catch {}
            }
            const bufferPolicy = getHlsBufferPolicy(netHintRef.current)
            const hls = new Hls({
              enableWorker: false,
              // Hold a substantial forward reserve for VOD playback. The
              // policy scales down on constrained networks and remains bounded
              // to let the browser's MediaSource eviction protect device RAM.
              ...bufferPolicy,
              startFragPrefetch: true,
              lowLatencyMode: false,
              appendInSequenceGaps: true,

              forceKeyFrameOnDiscontinuity: true,
              // hls.js retains the active MediaSource and its forward buffer
              // while it performs these bounded per-request retries. ArtPlayer
              // must not reload the source during that recovery window.
              ...getHlsLoadPolicies(),
              defaultAudioCodec: 'mp4a.40.2',
              fetchSetup: (context, init = {}) => {
                const requestInit = {
                  ...init,
                  // Reuse a browser-cached VOD fragment when the source allows
                  // it; manifests stay fresh so signed URLs and ABR updates are
                  // never masked by a stale playlist response.
                  cache: getHlsRequestCacheMode(context),
                }
                if (referer) {
                  try {
                    requestInit.referrer = referer
                  } catch {}
                }
                return new Request(context.url, requestInit)
              },
            })
	            let mediaRetries = 0
				let manifestReady = false
	            const fail = () => {
	              if (buildIdRef.current !== myBuildId) return
	              showToast('Stream issue — keeping the selected server.', { long: true })
	              if (onBlocked) {
	                onBlocked('playback-error')
              }
              else setError('Stream playback error. Try a different server.')
            }
	            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (buildIdRef.current !== myBuildId) return
              if (!data.fatal) return
              // Signed URL and throttle responses are terminal. Every other
              // transient request has already used hls.js' bounded retry policy;
              // do not call startLoad() here because that restarts loading and
              // can discard the buffer the viewer already earned.
	              // MP4 mis-classified as HLS
              if (
                data.type === Hls.ErrorTypes.MANIFEST_ERROR &&
                data.details === Hls.ErrorDetails.MANIFEST_PARSE_ERROR
              ) {
                try {
                  hls.destroy()
                } catch {}
                art.hls = null
                playAsNative(video, url, art)
                return
              }
              if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                if (mediaRetries < 1) {
                  mediaRetries += 1
                  try {
                    hls.recoverMediaError()
                  } catch {}
                  return
                }
	                fail()
                return
              }
	              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
						if (!manifestReady && hlsTransportIndex + 1 < hlsTransportPlan.length) {
							hlsTransportIndex += 1
							try {
								hls.loadSource(hlsTransportPlan[hlsTransportIndex].url)
								return
							} catch {}
						}
		                fail()
		                return
              }
	              fail()
            })
	            hls.on(Hls.Events.MANIFEST_PARSED, () => {
						manifestReady = true
	              const levels = (hls.levels || [])
	                .map((level, index) => ({
	                  index,
	                  height: Number(level?.height || 0),
	                  bitrate: Number(level?.bitrate || 0),
	                }))
	                .filter((level, index, list) =>
	                  level.height > 0 && list.findIndex((item) => item.height === level.height) === index
	                )
	                .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate)
	              if (levels.length > 1 && art?.setting?.update) {
	                const auto = getQualityPresentation('auto')
	                const hlsQualitySelection = createHlsQualitySelection(hls.currentLevel)
	                const dataSaver = getHlsDataSaverCap(levels)
	                let dataSaverCap = null
	                const syncHlsQualitySetting = (level = hlsQualitySelection.getSelectedLevel()) => {
	                  const display = getHlsQualitySettingDisplay(levels, level, dataSaverCap)
	                  const qualitySetting = art.setting.find('quality')
	                  if (qualitySetting) {
	                    qualitySetting.html = display.title
	                    qualitySetting.tooltip = display.label
	                  }
	                  return display
	                }
	                const buildHlsQualitySetting = (activeLevel) => {
	                  const activeDisplay = getHlsQualitySettingDisplay(levels, activeLevel, dataSaverCap)
	                  return {
	                    name: 'quality',
	                    width: 220,
	                    html: activeDisplay.title,
	                    tooltip: activeDisplay.label,
	                    selector: [
	                      {
	                        default: activeLevel === -1 && dataSaverCap === null,
	                        html: qualityOptionHtml(auto),
	                        value: 'auto',
	                      },
	                      ...(dataSaver ? [{
	                        default: dataSaverCap === dataSaver.index,
	                        html: qualityOptionHtml(getQualityPresentation(`Data Saver · ≤${dataSaver.height}p`)),
	                        value: 'saver',
	                      }] : []),
	                      ...levels.map((level) => ({
	                        default: dataSaverCap === null && activeLevel === level.index,
	                        html: qualityOptionHtml(getQualityPresentation(`${level.height}p`)),
	                        value: `level:${level.index}`,
	                      })),
	                    ],
	                    onSelect: (item) => {
	                      if (item.value === 'saver' && dataSaver) {
	                        dataSaverCap = dataSaver.index
	                        hlsQualitySelection.selectLevel(-1)
	                        hls.autoLevelCapping = dataSaver.index
	                        hls.currentLevel = -1
	                        hls.nextLevel = -1
	                      } else {
	                        const nextLevel = item.value === 'auto'
	                          ? -1
	                          : hlsQualitySelection.selectLevel(String(item.value).replace('level:', ''))
	                        dataSaverCap = null
	                        hls.autoLevelCapping = -1
	                        hls.currentLevel = nextLevel
	                        hls.nextLevel = nextLevel
	                        hlsQualitySelection.selectLevel(nextLevel)
	                      }
	                      const nextDisplay = syncHlsQualitySetting()
	                      return nextDisplay.label
	                    },
	                  }
	                }
	                art.setting.update(buildHlsQualitySetting(hls.currentLevel))
	                hls.on(Hls.Events.LEVEL_SWITCHED, () => {
	                  if (buildIdRef.current !== myBuildId) return
	                  // hls.js can publish a transient adaptive currentLevel
	                  // while a manually selected rendition is settling. Keep
	                  // the displayed setting tied to the explicit user choice.
	                  syncHlsQualitySetting()
	                })
	              }
	              if (pendingHandoffRef.current?.shouldPlay !== false) {
	                const p = video.play()
	                if (p && typeof p.catch === 'function') p.catch(() => {})
	              }
	            })
	            hls.on(Hls.Events.BUFFER_APPENDING, () => {
              // could be used to show buffering indicator if needed
            })
	            try {
	              hls.loadSource(hlsTransportPlan[hlsTransportIndex].url)
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
          url: proxied(subtitleUrl),
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

      const progressInner = art.video
        ?.closest('.art-video-player')
        ?.querySelector('.art-control-progress-inner')
      bufferIndicatorCleanupRef.current = createBufferedTimelineIndicator(
        art.video,
        progressInner
      )

      // ArtPlayer retries a video error by assigning art.url again. That
      // recreates the custom HLS source and flushes the MediaSource buffer.
      // hls.js owns HLS recovery above, so remove only ArtPlayer's internal
      // source-reset listener and retain a direct-media fallback for streams
      // not managed by hls.js.
      art.off('video:error')
      art.on('video:canplay', () => {
        setBuffering(false)
        if (pendingResumeRef.current) {
          art.video.currentTime = pendingResumeRef.current
          pendingResumeRef.current = null
        }
        const handoff = pendingHandoffRef.current
        if (handoff) {
          if (handoff.shouldPlay === false) art.video.pause()
          else art.video.play().catch(() => {})
          pendingHandoffRef.current = null
        }
      })
      art.on('video:waiting', () => setBuffering(true))
      art.on('video:playing', () => setBuffering(false))
      art.on('video:error', () => {
        if (art.hls || hlsInstance.current) return
        recoverPlayback()
      })

      if (subtitles && subtitles.length > 1) {
        art._anirakuSubtitles = subtitles
      }

      // Auto next episode (only when the user hasn't turned it off)
      art.on('video:ended', () => {
        const completedAt = Date.now()
        const completedDuration = Math.floor(art.video.duration || 0)
        const completedTitle = anime?.title?.english || anime?.title?.romaji || animeId
        upsertLocalWatchHistory({
          animeId,
          title: completedTitle,
          episode: epNumber,
          time: completedDuration,
          duration: completedDuration,
          completed: true,
          timestamp: completedAt,
          image: anime?.coverImage?.large || '',
        })
        if (user) {
          Promise.resolve(
            supabase.from('watch_history').upsert(
              {
                user_id: user.id,
                anime_id: parseInt(animeId, 10),
                anime_title: completedTitle,
                anime_image: anime?.coverImage?.large || '',
                episode_number: epNumber,
                progress: completedDuration,
                duration: completedDuration,
                timestamp: completedAt,
              },
              { onConflict: 'user_id,anime_id,episode_number' }
            )
          ).catch(() => {})
        }
        // Push completion to connected MAL/AniList accounts (fire-and-forget)
        syncProgressRef.current?.()
        // The ended event already synced this episode; the upcoming
        // episode-change sync must not send it again as 'watching'.
        skipSwitchSyncRef.current = true
        if (autoNextRef.current && !isMovie && epNumber < episodes.length) {
          const slug = generateSlug(
            anime?.title?.english || anime?.title?.romaji || ''
          )
          navigate(`/watch/${slug}-${animeId}-episode-${epNumber + 1}`)
        } else if (!autoNextRef.current && !isMovie) {
          // Auto-next off: show the "ended" overlay instead of a black
          // screen so the user knows to press Next or Replay.
          setShowEndedOverlay(true)
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
      let lastRender = 0
      art.on('video:timeupdate', () => {
        const now = Date.now()
        const position = Number(art.video.currentTime) || 0
        const latestSegments = skipSegmentsRef.current

        // Auto-skip only once per segment and only when playback is actually
        // inside a verified interval. This prevents repeated jumps, false
        // positives at the beginning of an episode, and seek-loop behavior.
        if (autoSkipRef.current) {
          for (const type of ['intro', 'outro']) {
            const segment = latestSegments[type]
            if (!segment) continue
            if (position < segment.start - 3) {
              autoSkippedRef.current[type] = false
              if (autoSkipFailuresRef.current[type]) {
                const clearedFailures = { ...autoSkipFailuresRef.current, [type]: false }
                autoSkipFailuresRef.current = clearedFailures
                setAutoSkipFailures(clearedFailures)
              }
            }
            if (
              !autoSkippedRef.current[type] &&
              !autoSkipFailuresRef.current[type] &&
              position >= segment.start - 0.25 &&
              position < segment.end - 0.5
            ) {
              if (attemptSkipSegment(art.video, segment)) {
                autoSkippedRef.current[type] = true
                // Successful automatic skips remain silent; the manual overlay
                // stays hidden unless the media seek actually fails.
              } else {
                const failures = { ...autoSkipFailuresRef.current, [type]: true }
                autoSkipFailuresRef.current = failures
                setAutoSkipFailures(failures)
                showToast(
                  type === 'intro'
                    ? 'Automatic intro skip failed — use Skip Intro'
                    : 'Automatic outro skip failed — use Skip Outro',
                  { icon: 'warn' }
                )
              }
              break
            }
          }
        }

        // Throttled re-render so the Skip Intro/Outro buttons track the
        // playback position without hammering React every second.
        if (now - lastRender > 500) {
          lastRender = now
          setCurrentTime(position)
        }
        if (now - lastSave < 10_000) return
        lastSave = now
        const title =
          anime?.title?.english || anime?.title?.romaji || animeId
        upsertLocalWatchHistory({
          animeId,
          title,
          episode: epNumber,
          time: Math.floor(art.video.currentTime),
          duration: Math.floor(art.video.duration || 0),
          completed: false,
          timestamp: now,
          image: anime?.coverImage?.large || '',
        })
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
      user,
      navigate,
      destroyPlayer,
      showToast,
      applySkipSegments,
      setAutoNextPreference,
      setAutoSkipPreference,
      skipSegmentNow,
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
  const cacheKey = (source) => streamCacheKey(source, epNumber)
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

  const warmProviderStream = useCallback((sourceId) => {
    const source = [...SOURCES.sub, ...SOURCES.dub].find((candidate) => candidate.id === sourceId)
    if (!source || source.id === activeSourceRef.current || getCachedStream(source)) return null

    const key = cacheKey(source)
    const existing = providerWarmRequestsRef.current.get(key)
    if (existing) return existing

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 8_000)
    const targetEpisode = epNumber
    const request = fetch(`${API_BASE}/api/v1/stream`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        animeId: parseInt(animeId, 10),
        episode: targetEpisode,
        provider: source.provider,
        lang: source.lang,
        quality: 'auto',
        refresh: false,
      }),
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok || targetEpisode !== epNumberRef.current) return null
        const data = await response.json().catch(() => null)
        if (data?.sources?.[0]?.url) setCachedStream(source, data)
        return data?.sources?.[0]?.url ? data : null
      })
      .catch(() => null)
      .finally(() => {
        window.clearTimeout(timeoutId)
        if (providerWarmRequestsRef.current.get(key) === request) {
          providerWarmRequestsRef.current.delete(key)
        }
      })

    providerWarmRequestsRef.current.set(key, request)
    return request
  }, [animeId, epNumber, SOURCES])

  // ────────────────────────────────────────────────────────────
  // Load stream
  // ────────────────────────────────────────────────────────────
  const lastStreamAttemptRef = useRef(null)

  const loadStream = useCallback(
    async (sourceId, forceRefresh = false, quiet = false) => {
      // A fresh stream load means any 'ended' sync flag from a previous
      // player is stale (e.g. the user replayed the same episode).
      skipSwitchSyncRef.current = false
      if (streamAbortRef.current) {
        try {
          streamAbortRef.current.abort()
        } catch {}
        streamAbortRef.current = null
      }
      loadingRef.current = false
      if (loadingRef.current && !forceRefresh) return

      // Capture the target episode NOW. If the user navigates while the
      // request is in flight, the stale response must never touch the
      // player (would replay the old episode and look like the click
      // "did nothing").
      const targetEpisode = epNumber

      const source = [...SOURCES.sub, ...SOURCES.dub].find(
        (s) => s.id === sourceId
      )
      if (!source) {
        return
      }

      const reportQuietSwitchFailure = (fallbackMessage) => {
        if (!quiet) return
        const settled = settleQuietProviderSwitch({
          pending: quietProviderSwitchRef.current,
          sourceId,
          episode: targetEpisode,
          succeeded: false,
        })
        quietProviderSwitchRef.current = settled.pending
        pendingResumeRef.current = null
        const previous = [...SOURCES.sub, ...SOURCES.dub].find(
          (candidate) => candidate.id === settled.restoreSourceId
        )
        if (previous && activeSourceRef.current === sourceId) {
          if (settled.skipSourceLoad) {
            skipQuietProviderReloadRef.current = {
              sourceId: previous.id,
              episode: targetEpisode,
            }
          }
          activeSourceRef.current = previous.id
          setActiveSource(previous.id)
        }
        showToast(
          previous
            ? `${source.label} is unavailable — still playing ${previous.label}.`
            : fallbackMessage,
          { icon: 'warn' }
        )
      }
      loadingRef.current = true
      lastStreamAttemptRef.current = { sourceId, forceRefresh }
      // Quiet mode (provider switch with a live player): keep the old
      // video playing and only swap once the new stream is ready. No
      // loading overlay, no error takeover on failure.
      if (!quiet) {
        setStreamLoading(true)
      }
      setError('')
      setNoStreamError(false)
      setErrorType('')
      // A quiet switch can keep an old media player alive, but an old embed
      // must be removed before mounting a different provider or it will keep
      // hiding the ArtPlayer mount.
      setActiveEmbedUrl((current) => (current ? '' : current))
      setRetryAttempt(0)
      setResumePos(null)
      // An explicit user retry can set a handoff position before rebuilding a
      // source. Episode changes explicitly clear it below.
      setShowEndedOverlay(false)

      const createSameProviderFailureHandler = (payload) => {
        const embedFallback = chooseBrowserPlayableEmbed(
          payload?.sources,
          isBrowserPlayableEmbedSource
        )
        let fallbackUsed = false
        return (reason) => {
          if (embedFallback && !fallbackUsed) {
            fallbackUsed = true
            destroyPlayer()
            setActiveEmbedUrl(embedFallback.url)
            applySkipSegments(normalizeProviderSkipSegments(payload))
            setStreamLoading(false)
            loadingRef.current = false
            setError('')
            showToast(`${source.label} direct media is unavailable — using its compatible player.`, { long: true })
            return
          }
          handleProviderBlockedRef.current?.(reason)
        }
      }

      // Stale-while-revalidate: if we have a recent good stream for
      // this source, play it now, then refresh in the background.
      if (!forceRefresh) {
        const cached = getCachedStream(source)
        if (cached && cached.sources?.[0]?.url) {
          if (targetEpisode !== epNumberRef.current) return
          const cachedProviderPlayer = shouldPreferProviderPlayer(source)
            ? chooseBrowserPlayableEmbed(cached.sources, isBrowserPlayableEmbedSource)
            : null
          if (cachedProviderPlayer) {
            destroyPlayer()
            setBuffering(false)
            setActiveEmbedUrl(cachedProviderPlayer.url)
            applySkipSegments(normalizeProviderSkipSegments(cached))
            setStreamLoading(false)
            loadingRef.current = false
            return
          }
          if (shouldPreferProviderPlayer(source)) {
            setErrorType('no-source')
            setError(`${source.label} player is unavailable for this episode.`)
            setStreamLoading(false)
            loadingRef.current = false
            return
          }
          const firstSource = cached.sources[0]
          const qualityList = buildQualityList(cached.sources)
          if (qualityList.length > 0) {
            const onBlocked = createSameProviderFailureHandler(cached)
            buildPlayer(
              qualityList[0].url,
              qualityList[0].type,
              qualityList,
              firstSource.subtitles || [],
              cached.headers,
              onBlocked
            )
            applySkipSegments(normalizeProviderSkipSegments(cached))
            setStreamLoading(false)
            loadingRef.current = false
            // A playable source is stable until the viewer explicitly changes
            // it, changes episode, retries, or HLS reports a terminal failure.
            // Do not refresh a source after playback begins: rebuilding ArtPlayer
            // here destroys active playback and caused Pewe/Bonk/Kiwi loops.
            return
          }
          const cachedEmbed = chooseBrowserPlayableEmbed(cached.sources, isBrowserPlayableEmbedSource)
	          if (cachedEmbed) {
	            destroyPlayer()
	            setActiveEmbedUrl(cachedEmbed.url)
	            applySkipSegments(normalizeProviderSkipSegments(cached))
	            setStreamLoading(false)
	            loadingRef.current = false
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

        const requestStream = (refresh) => fetch(`${API_BASE}/api/v1/stream`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animeId: parseInt(animeId, 10),
            episode: epNumber,
            provider: source.provider,
            lang: source.lang,
            quality: 'auto',
            refresh,
          }),
          cache: 'no-store',
        })
        const warmedRequest = !forceRefresh
          ? providerWarmRequestsRef.current.get(cacheKey(source))
          : null
        let data = warmedRequest ? await warmedRequest : null
        let res = null
        if (!data) res = await requestStream(forceRefresh)
        clearTimeout(timeoutId)
        if (streamAbortRef.current === controller) streamAbortRef.current = null

        if (res?.status >= 500) {
          // Backend explicitly says "no upstream response".
          if (quiet) {
            setStreamLoading(false)
            loadingRef.current = false
            reportQuietSwitchFailure('Could not switch server right now — try again')
            return
          }
          setErrorType('backend')
          setError('Backend is having trouble reaching this source. Try again or choose another server.')
          setStreamLoading(false)
          loadingRef.current = false
          return
        }

        if (!data) data = await res?.json().catch(() => ({}))
        if (!mountedRef.current) return
        // Navigation may have happened while the stream was fetching —
        // never build a player for an episode the user has left.
        if (targetEpisode !== epNumberRef.current) return

        if (data.error || !data.sources?.[0]?.url) {
          if (quiet) {
            setStreamLoading(false)
            loadingRef.current = false
            reportQuietSwitchFailure('No stream on that server — staying on the current one')
            return
          }
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
        const providerPlayer = shouldPreferProviderPlayer(source)
          ? chooseBrowserPlayableEmbed(data.sources, isBrowserPlayableEmbedSource)
          : null
        if (providerPlayer) {
          destroyPlayer()
          setBuffering(false)
          setActiveEmbedUrl(providerPlayer.url)
          applySkipSegments(normalizeProviderSkipSegments(data))
          setCachedStream(source, data)
          setStreamLoading(false)
          loadingRef.current = false
          setRetryAttempt(0)
          return
        }
        if (shouldPreferProviderPlayer(source)) {
          if (quiet) {
            setStreamLoading(false)
            loadingRef.current = false
            reportQuietSwitchFailure(`${source.label} player is unavailable — staying on the current one`)
            return
          }
          setNoStreamError(true)
          setErrorType('no-source')
          setError(`${source.label} player is unavailable for this episode.`)
          setStreamLoading(false)
          loadingRef.current = false
          return
        }
        const qualityList = buildQualityList(data.sources)
        if (qualityList.length === 0) {
          const verifiedEmbed = chooseBrowserPlayableEmbed(data.sources, isBrowserPlayableEmbedSource)
          if (verifiedEmbed) {
            destroyPlayer()
            setActiveEmbedUrl(verifiedEmbed.url)
            applySkipSegments(normalizeProviderSkipSegments(data))
            setCachedStream(source, data)
            setStreamLoading(false)
            loadingRef.current = false
            setRetryAttempt(0)
            return
          }
          if (quiet) {
            setStreamLoading(false)
            loadingRef.current = false
            reportQuietSwitchFailure('No stream on that server — staying on the current one')
            return
          }
          setNoStreamError(true)
          setErrorType('no-source')
          setError('No video source found for this server.')
          setStreamLoading(false)
          loadingRef.current = false
	          return
        }
        const subs = firstSource.subtitles || []
        const onBlocked = createSameProviderFailureHandler(data)
        buildPlayer(
          qualityList[0].url,
          qualityList[0].type,
          qualityList,
          subs,
	          data.headers,
	          onBlocked
	        )
        applySkipSegments(normalizeProviderSkipSegments(data))
        setCachedStream(source, data)
        quietProviderSwitchRef.current = settleQuietProviderSwitch({
          pending: quietProviderSwitchRef.current,
          sourceId,
          episode: targetEpisode,
          succeeded: true,
        }).pending
        setStreamLoading(false)
        loadingRef.current = false
        setRetryAttempt(0)
        return
      } catch (err) {
        const superseded = streamAbortRef.current !== controller
        if (streamAbortRef.current === controller) streamAbortRef.current = null
        if (superseded) return
        if (!mountedRef.current) return
        if (quiet) {
          setStreamLoading(false)
          loadingRef.current = false
          reportQuietSwitchFailure('Could not switch server right now — try again')
          return
        }
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
              ? 'Backend is having trouble reaching this source. Try again or choose another server.'
              : 'Failed to load stream. Check your connection and try again.'
          )
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
      applySkipSegments,
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
    let attempt = 0
    let retryTimer = null
    const requestControllers = new Set()
    let discovered = { sub: [], dub: [] }
    // Clear both language groups before this episode's parallel requests begin.
    // A previous episode's DUB list must never remain selectable while its new
    // SUB response is already available.
    setServers({ sub: [], dub: [] })
    const base = `${API_BASE}/api/v1/servers?animeId=${animeId}&episode=${epNumber}`

    const fetchServers = async () => {
      const fetchLanguage = async (lang) => {
        const controller = new AbortController()
        requestControllers.add(controller)
        const timeout = setTimeout(() => controller.abort(), 50_000)
        try {
          const response = await fetch(`${base}&lang=${lang}`, {
            cache: 'no-store',
            signal: controller.signal,
          })
          if (!response.ok) return []
          const payload = await response.json()
          return Array.isArray(payload) ? payload : []
        } catch {
          return []
        } finally {
          clearTimeout(timeout)
          requestControllers.delete(controller)
        }
      }

      // Resolve both languages in parallel, but retain any providers discovered
      // in prior attempts. A slow resolver must never make already-approved
      // servers disappear or cause an early “no source” state.
      const [subs, dubs] = await Promise.all([
        fetchLanguage('sub'),
        fetchLanguage('dub'),
      ])
      if (cancelled) return

      discovered = {
        // Re-apply the conditional Ally rule after merging late resolver
        // responses so Ally remains available only until an actual alternative
        // source arrives; it never triggers a player/source replacement.
        sub: filterBrowserProviders(mergeProviderServers(discovered.sub, subs)),
        dub: filterBrowserProviders(mergeProviderServers(discovered.dub, dubs)),
      }
      setServers(discovered)

      const nextDelay = PROVIDER_DISCOVERY_RETRY_DELAYS_MS[attempt + 1]
      if (nextDelay !== undefined) {
        attempt += 1
        retryTimer = setTimeout(fetchServers, nextDelay)
        return
      }

      if (discovered.sub.length === 0 && discovered.dub.length === 0) {
        setNoStreamError(true)
        setErrorType('no-source')
        setError("We don't have streaming for this anime.")
        setStreamLoading(false)
      }
    }
    fetchServers()
    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      requestControllers.forEach((controller) => controller.abort())
    }
  }, [animeId, epNumber])

  // Load stream on active source / episode change
  const loadStreamRef = useRef(loadStream)
  loadStreamRef.current = loadStream

	  // A playback issue never changes the selected provider. The visible server
	  // controls remain the only way to select another provider.
	  const handleProviderBlocked = useCallback(() => {
	    const now = Date.now()
	    if (now - lastBlockCycleRef.current < 3_000) return
	    lastBlockCycleRef.current = now
	    showToast('Stream issue — choose another server manually if needed.', { long: true })
	  }, [showToast])

  handleProviderBlockedRef.current = handleProviderBlocked

  useEffect(() => {
    if (!activeSource) return
    const epChanged = epNumber !== prevEpisodeRef.current
    prevEpisodeRef.current = epNumber
    if (epChanged) {
      // Push partial progress to connected MAL/AniList accounts before
      // leaving the episode, so switching mid-watch still counts — but only
      // when a decent chunk was actually seen and the episode wasn't already
      // synced by the 'ended' event.
      const art = artInstance.current
      const el = art?.video
      const skipSync = skipSwitchSyncRef.current
      skipSwitchSyncRef.current = false
      pendingResumeRef.current = null
      if (
        !skipSync &&
        el &&
        el.duration > 0 &&
        el.currentTime >= el.duration * 0.6
      ) {
        syncProgressRef.current?.('watching')
      }
      // New episode: kill the current player FIRST so the old video can
      // never keep playing, then load the stream for the new episode.
      destroyPlayer()
      loadStreamRef.current(activeSource)
      return
    }
    const skippedReload = skipQuietProviderReloadRef.current
    if (
      skippedReload &&
      skippedReload.sourceId === activeSource &&
      skippedReload.episode === epNumber
    ) {
      skipQuietProviderReloadRef.current = null
      return
    }
    // Same episode, server switch: keep the old video playing and only
    // swap when the new stream is ready.
    loadStreamRef.current(activeSource, false, Boolean(artInstance.current))
  }, [activeSource, epNumber, destroyPlayer])

  const handleSourceSwitch = useCallback(
    (sourceId) => {
      if (sourceId === activeSource) return
      const source = [...SOURCES.sub, ...SOURCES.dub].find(
        (s) => s.id === sourceId
      )
      if (source)
        showToast(`Switching to ${source.lang.toUpperCase()}…`)
      const video = artInstance.current?.video
      const resumeAt = Number(video?.currentTime || 0)
      if (resumeAt > 0) pendingResumeRef.current = resumeAt
      quietProviderSwitchRef.current = artInstance.current
        ? beginQuietProviderSwitch({
            from: activeSourceRef.current || activeSource,
            to: sourceId,
            episode: epNumber,
            resumeAt,
            shouldPlay: Boolean(video && !video.paused && !video.ended),
          })
        : null
      setActiveSource(sourceId)
      setError('')
      setNoStreamError(false)
      setErrorType('')
    },
    [activeSource, SOURCES, epNumber, showToast]
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
    swipeX: 0,
    swipeToastShown: false,
  })
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
      touchState.current.swipeX = 0
      touchState.current.swipeToastShown = false
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
      // Horizontal swipe → scrubbing seek (backward/forward)
      if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        e.preventDefault()
        touchState.current.swipeX = dx
        if (!touchState.current.swipeToastShown) {
          touchState.current.swipeToastShown = true
          const secs = Math.max(
            10,
            Math.min(60, Math.round((Math.abs(dx) / w) * 120))
          )
          showToast(`${dx < 0 ? '−' : '+'}${secs}s`)
        }
        return
      }
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
    const onTouchEnd = (e) => {
      const st = touchState.current
      if (Math.abs(st.swipeX) > 48) {
        e.preventDefault()
        const art = artInstance.current
        if (art) {
          const rect = container.getBoundingClientRect()
          const secs = Math.max(
            10,
            Math.min(60, Math.round((Math.abs(st.swipeX) / rect.width) * 120))
          )
          if (st.swipeX < 0) {
            art.video.currentTime = Math.max(0, art.video.currentTime - secs)
          } else {
            art.video.currentTime = Math.min(
              art.video.duration || Infinity,
              art.video.currentTime + secs
            )
          }
          showToast(`${st.swipeX < 0 ? '−' : '+'}${secs}s`)
        }
      }
      st.swipeX = 0
      st.swipeToastShown = false
    }
    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
  }, [showToast])

  // ────────────────────────────────────────────────────────────
  // Loading / NSFW gates
  // ────────────────────────────────────────────────────────────
  if (loading) {
    return <WatchPageSkeleton />
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
      </>
    )
  }

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────
  const t = currentTime
  const intro = skipSegments?.intro
  const outro = skipSegments?.outro
  const showSkipIntro = shouldShowManualSkipOverlay({
    segment: intro,
    currentTime: t,
    autoSkip,
    autoSkipFailed: autoSkipFailures.intro,
  })
  const showSkipOutro = shouldShowManualSkipOverlay({
    segment: outro,
    currentTime: t,
    autoSkip,
    autoSkipFailed: autoSkipFailures.outro,
  })
  const handleSkipSegment = (type) => {
    skipSegmentNow(type)
  }
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
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
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
            border: PREFERS_HIGH_CONTRAST
              ? '2px solid rgba(255,255,255,0.5)'
              : '1px solid rgba(255,255,255,0.1)',
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

      {/* Banner backdrop ambiance */}
      {anime?.bannerImage && (
        <div
          aria-hidden="true"
          className="watch-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: `linear-gradient(to bottom, rgba(5,8,16,0.45) 0%, rgba(5,8,16,0.85) 60%, var(--bg) 92%), url(${anime.bannerImage})`,
            backgroundSize: compactWatchLayout ? 'cover, 100% auto' : 'cover',
            backgroundPosition: compactWatchLayout ? 'center, center top' : 'center 30%',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'var(--bg)',
          }}
        />
      )}

      <div
        className={`watch-page ${theaterMode ? 'theater' : ''}`}
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: theaterMode ? '100%' : 1280,
          margin: '0 auto',
          padding: theaterMode ? '0' : 'clamp(8px, 2vw, 16px)',
          transition: PREFERS_REDUCED_MOTION
            ? 'none'
            : 'max-width 250ms ease, padding 250ms ease',
          boxSizing: 'border-box',
          width: '100%',
          overflow: 'hidden',
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
            style={{ width: '100%', height: '100%', display: activeEmbedUrl ? 'none' : 'block' }}
            aria-label="Anime video player"
            role="region"
          />
          {activeEmbedUrl && (
            <iframe
              src={activeEmbedUrl}
              ref={embedFrameRef}
              title="Anime embedded player"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              sandbox={isKiwiEmbedUrl(activeEmbedUrl) ? undefined : 'allow-forms allow-modals allow-pointer-lock allow-presentation allow-popups allow-same-origin allow-scripts'}
              referrerPolicy="no-referrer-when-downgrade"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 0,
                background: '#000',
              }}
            />
          )}


          {/* Buffering indicator */}
          {buffering && !streamLoading && !activeEmbedUrl && (
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
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                {slowStream ? 'Stream taking longer than expected…' : 'Preparing playback and finding available servers…'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
                {slowStream ? 'Server is waking up or network is congested.' : 'Establishing secure stream connection.'}
              </div>
              {slowStream && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '6px 12px', borderRadius: 8 }}>
                  Tip: Switch servers or use the recovery options below if playback does not start.
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
              {(errorType === 'backend' || errorType === 'timeout') && (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    marginBottom: 12,
                    maxWidth: 460,
                  }}
                >
                  The streaming backend cold-starts after idle — this usually
                  clears up in a few seconds. Retry in a moment.
                </div>
              )}
              {errorType === 'network' && (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    marginBottom: 12,
                    maxWidth: 460,
                  }}
                >
                  The request never reached the backend. Check your Wi-Fi /
                  mobile data, then retry — playback resumes where you left
                  off.
                </div>
              )}
              {errorType === 'cdn-unreachable' && (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    marginBottom: 12,
                    maxWidth: 460,
                  }}
                >
                  This server&apos;s CDN is unreachable right now. Force
                  refresh for a fresh stream link, or switch servers.
                </div>
              )}
              {errorType === 'expired' && (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    marginBottom: 12,
                    maxWidth: 460,
                  }}
                >
                  The stream link expired. Force refresh generates a new one —
                  this usually fixes it.
                </div>
              )}
              {errorType === 'blocked' && (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    marginBottom: 12,
                    maxWidth: 460,
                  }}
                >
                  This server is blocked in your region. Switch to another
                  server — we have several per language.
                </div>
              )}
              {noStreamError && (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    marginBottom: 12,
                    maxWidth: 460,
                  }}
                >
                  No provider is serving this episode right now. Switch
                  servers or check back later — new sources appear as
                  episodes go live.
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
                    {noStreamError ? 'Check availability again' : 'Force refresh'}
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    const sources = [...SOURCES.sub, ...SOURCES.dub]
                    const other = sources.find((s) => s.id !== activeSource)
                    if (other) handleSourceSwitch(other.id)
                    else loadStream(activeSource, true)
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
                  Try another server
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

          {/* Episode ended (auto-next off): Replay / Next instead of a
              black screen */}
          {showEndedOverlay && !streamLoading && !error && (
            <div
              className="watch-ended"
              role="dialog"
              aria-label="Episode finished"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 7,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 18,
                background: 'rgba(0,0,0,0.82)',
                backdropFilter: 'blur(4px)',
                textAlign: 'center',
                padding: 24,
              }}
            >
              <FaCheckCircle
                size={44}
                color="#22c55e"
                style={{ opacity: 0.9 }}
              />
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f1f5f9',
                    marginBottom: 6,
                  }}
                >
                  Episode {epNumber} finished
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>
                  {epNumber < (episodes.length || 0) || isMovie
                    ? 'Auto-next is off — press Next to continue watching.'
                    : "You've watched every released episode."}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={replayEpisode}
                  style={{ ...navBtnStyle, background: 'var(--accent)', color: '#fff' }}
                >
                  <FaRedo /> Replay
                </button>
                {!isMovie && epNumber < episodes.length && (
                  <button type="button" onClick={goNext} style={navBtnStyle}>
                    Next <FaStepForward />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowEndedOverlay(false)}
                  style={{ ...navBtnStyle }}
                  aria-label="Close"
                >
                  <FaUndo /> Continue
                </button>
              </div>
            </div>
          )}

          {/* Manual skip overlay: positioned above the bottom-right
              Artplayer controls, matching the marked player location. */}
          {(showSkipIntro || showSkipOutro) && (
            <div
              className="watch-skip-overlay"
              aria-label="Episode skip controls"
              style={{
                position: 'absolute',
                right: 'clamp(8px, 2.2vw, 18px)',
                bottom: 'calc(42px + env(safe-area-inset-bottom, 0px))',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                maxWidth: 'calc(100% - 16px)',
                padding: 5,
                background: 'rgba(6,10,20,0.38)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
                pointerEvents: 'auto',
              }}
            >
              {showSkipIntro && (
                <button
                  type="button"
                  className="watch-skip-btn"
                  onClick={() => handleSkipSegment('intro')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.12)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: 40,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <FaStepForward />
                  Skip Intro
                </button>
              )}
              {showSkipOutro && (
                <button
                  type="button"
                  className="watch-skip-btn"
                  onClick={() => handleSkipSegment('outro')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.12)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: 40,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <FaStepForward />
                  Skip Outro
                </button>
              )}
            </div>
          )}
        </div>

        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 14,
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 650,
          }}
        >
          <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 99, background: error ? '#f87171' : streamLoading ? '#fbbf24' : '#34d399' }} />
			{error
				? 'Playback needs attention. Choose a recovery option or another server.'
				: streamLoading
				? 'Preparing a stream…'
				: `Playing on ${currentSource?.label || 'the selected server'}.`}
        </div>

        {/* Source selector */}
        <div
          className="watch-sources"
          role="group"
          aria-label="Streaming servers"
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
                  {lang === 'sub' ? `SUB · ${SOURCES.sub.length}` : `DUB · ${SOURCES.dub.length}`}
                </span>
                {SOURCES[lang].map((source) => {
                  const isActive = activeSource === source.id
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => handleSourceSwitch(source.id)}
	                      onPointerEnter={() => warmProviderStream(source.id)}
	                      onFocus={() => warmProviderStream(source.id)}
	                      onTouchStart={() => warmProviderStream(source.id)}
                      className="watch-source-btn"
                      aria-pressed={isActive}
	                      aria-label={`${isActive ? 'Current server: ' : 'Switch to '}${source.label}`}
	                      title={`${isActive ? 'Current server: ' : 'Switch to '}${source.label}`}
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
            display: compactWatchLayout ? 'flex' : 'none',
            width: 'calc(100% - 16px)',
            padding: '12px 14px',
            margin: '12px auto 0',
            maxWidth: 'calc(1200px - 16px)',
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
            boxSizing: 'border-box',
          }}
          >
            Episodes ({filteredEps.length}{hiddenEpCount > 0 && hideFillers ? ` of ${episodes.length}` : ''}) {showEpSidebar ? '▲' : '▼'}
          </button>
        )}

        {/* Info + Episodes */}
        <div
          className="watch-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: showEpSidebar && !isMovie ? '1fr 320px' : '1fr',
            gap: 'clamp(12px, 3vw, 24px)',
            marginTop: 16,
            alignItems: 'flex-start',
            minWidth: 0,
          }}
        >
          <div className="watch-info" style={{ minWidth: 0 }}>
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
              className="watch-current-meta"
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
              className="watch-rating"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 12,
              }}
            >
              <span className="watch-rating-label" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {epRatings[epNumber]
                  ? `Rated ${epRatings[epNumber]}/10`
                  : 'Rate this episode'}
              </span>
              <span className="watch-rating-stars" role="group" aria-label="Episode rating" style={{ display: 'inline-flex', gap: 3 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={epRatingSaving}
                    aria-label={`Rate ${n} out of 10`}
                    title={`Rate ${n} out of 10`}
                    onClick={() => saveRating(n)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 2,
                      minWidth: 22,
                      minHeight: 28,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color:
                        (epRatings[epNumber] || 0) >= n
                          ? '#fbbf24'
                          : 'var(--text-muted)',
                      opacity: (epRatings[epNumber] || 0) >= n ? 1 : 0.35,
                      fontSize: 14,
                    }}
                  >
                    <FaStar size={14} />
                  </button>
                ))}
              </span>
              {epRatingSaving && (
                <FaSpinner size={12} className="watch-spin" />
              )}
              {epRatingSaved && (
                <span style={{ fontSize: 12, color: '#86efac' }}>Saved</span>
              )}
            </div>

            <div
              className="watch-nav"
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, minWidth: 0 }}
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
              {animeId && anime && (
                <Link
                  to={`/anime/${generateSlug(
                    anime.title?.english || anime.title?.romaji || anime.title?.userPreferred || 'anime'
                  )}-${animeId}`}
                  style={{
                    ...navBtnStyle,
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    border: '1px solid rgba(165,180,252,0.45)',
                    boxShadow: '0 6px 18px rgba(99,102,241,0.24)',
                  }}
                  aria-label="Go to anime page"
                >
                  <FaSignal /> Anime Page
                </Link>
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
                <NextEpisodeCountdown
                  episode={anime.nextAiringEpisode.episode}
                  airingAt={anime.nextAiringEpisode.airingAt}
                />
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

            <div
              className="watch-trust-note"
              style={{ marginTop: 18, padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.55 }}
            >
              Playback is resolved from third-party sources; Aniraku does not host episode files. If a source is broken, unsafe, or mislabeled, <a href="https://github.com/Aniraku/Aniraku/issues" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>report the problem</a> and try another server.
            </div>

            {anime && (
              <div id="watch-comments" style={{ marginTop: 32 }}>
                <Comments animeId={animeId} episodeNumber={epNumber} animeTitle={anime?.title?.english || anime?.title?.romaji || ''} />
              </div>
            )}
          </div>

          {/* Episode sidebar (memoized component: watched checkmarks,
              per-episode ratings, filler/recap badges, search & pages) */}
          {!isMovie && (
            <div
              style={{
                display: !showEpSidebar && compactWatchLayout ? 'none' : 'block',
              }}
            >
              <EpisodeSidebar
                filteredEps={filteredEps}
                pagedEps={pagedEps}
                epPage={epPage}
                totalEpPages={totalEpPages}
                epSearch={epSearch}
                hideFillers={hideFillers}
                hiddenEpCount={hiddenEpCount}
                episodeCount={episodes.length}
                epNumber={epNumber}
                animeId={animeId}
                animeTitle={
                  anime?.title?.english || anime?.title?.romaji || ''
                }
                watchedEps={watchedEps}
                epRatings={epRatings}
                onSearch={(e) => {
                  setEpSearch(e.target.value)
                  setEpPage(0)
                }}
                onPageChange={setEpPage}
                onToggleFillers={() => {
                  setHideFillers((p) => !p)
                  setEpPage(0)
                }}
                sidebarRef={epSidebarRef}
              />
            </div>
          )}
        </div>
      </div>

      {/* Comments FAB */}
      {anime && !commentsVisible && (
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
            bottom: compactWatchLayout
              ? `calc(76px + env(safe-area-inset-bottom, 0px))`
              : `calc(20px + env(safe-area-inset-bottom, 0px))`,
            right: compactWatchLayout
              ? `calc(10px + env(safe-area-inset-right, 0px))`
              : `calc(20px + env(safe-area-inset-right, 0px))`,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: 999,
            padding: compactWatchLayout ? '10px 14px' : '12px 18px',
            fontSize: compactWatchLayout ? 12 : 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            minHeight: 44,
            maxWidth: 'calc(100vw - 20px)',
          }}
        >
          <FaCommentDots />
          Comments
          {commentCount !== null && (
            <span
              style={{
                background: 'rgba(255,255,255,0.22)',
                borderRadius: 999,
                padding: '1px 8px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {commentCount}
            </span>
          )}
        </button>
      )}

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
        @keyframes watch-count-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(34,197,94,0.3); }
          50%      { text-shadow: 0 0 22px rgba(34,197,94,0.75); }
        }
        .spin-anim { animation: watch-spin 1s linear infinite; }
        .watch-spin { animation: watch-spin 1s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .spin-anim, [style*="watch-toast-in"], [style*="watch-spin"],
          [style*="watch-count-glow"] {
            animation: none !important;
          }
        }
        .watch-page {
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .watch-page > * { min-width: 0; }
        .watch-art-mount video {
          background: #000;
        }
        /* Quality selector: make the current mode obvious and give every
           option a compact resolution badge instead of a raw source label. */
        .watch-art-mount .art-controls-quality {
          min-width: 78px;
        }
        .watch-art-mount .art-controls-quality .art-selector-value,
        .watch-art-mount .art-controls-quality .art-selector-item {
          font-variant-numeric: tabular-nums;
        }
        .watch-art-mount .watch-quality-option {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          min-width: 92px;
        }
        .watch-art-mount .watch-quality-name {
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .watch-art-mount .watch-quality-badge {
          color: rgba(226, 232, 240, 0.62);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .watch-art-mount .art-selector-list {
          min-width: 170px;
          padding: 6px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          background: rgba(10, 14, 24, 0.96);
          box-shadow: 0 12px 30px rgba(0,0,0,0.42);
        }
        .watch-art-mount .art-selector-item {
          border-radius: 7px;
          padding: 8px 10px;
          transition: background 160ms ease, color 160ms ease;
        }
        .watch-art-mount .art-selector-item:hover,
        .watch-art-mount .art-selector-item.art-current {
          background: rgba(226,232,240,0.14);
          color: #fff;
        }
        .watch-art-mount .art-selector-item.art-current .watch-quality-badge {
          color: #cbd5e1;
        }
        .watch-art-mount .art-control-seekBackward10,
        .watch-art-mount .art-control-seekForward10 {
          color: #e2e8f0;
          opacity: 0.82;
          transition: opacity 160ms ease, background 160ms ease, transform 160ms ease;
        }
        .watch-art-mount .art-control-seekBackward10:hover,
        .watch-art-mount .art-control-seekForward10:hover {
          opacity: 1;
          background: rgba(255,255,255,0.1);
        }
        .watch-art-mount .art-control-seekBackward10:active,
        .watch-art-mount .art-control-seekForward10:active {
          transform: scale(0.94);
        }
        .watch-art-seek-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          width: 36px;
          height: 36px;
          line-height: 1;
          pointer-events: none;
        }
        .watch-art-seek-icon svg {
          position: absolute;
          inset: 1px;
          width: 34px;
          height: 34px;
        }
        .watch-art-seek-icon text {
          pointer-events: none;
          paint-order: stroke;
          stroke: rgba(8, 12, 20, 0.24);
          stroke-width: 0.35px;
        }
        /* Artplayer applies negative side margins on its mobile control groups.
           The player itself clips overflow, so the rightmost settings/fullscreen
           icon can disappear at the edge on narrow phones. */
        .watch-art-mount .art-video-player .art-controls {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding-inline: 4px;
        }
        .watch-art-mount .art-video-player .art-controls-left,
        .watch-art-mount .art-video-player .art-controls-right {
          min-width: 0;
          margin-inline: 0;
        }
        .watch-art-mount .art-video-player .art-controls .art-control {
          min-width: 0;
          flex: 0 0 auto;
        }
        .watch-art-mount .art-video-player .art-control-seekBackward10,
        .watch-art-mount .art-video-player .art-control-seekForward10 {
          width: 38px !important;
          min-width: 38px !important;
          margin-inline: 0 !important;
          padding-inline: 0 !important;
        }
        .watch-art-mount .art-video-player .art-controls-quality {
          min-width: 64px;
        }
        /* A YouTube-like downloaded-range cue, clipped to the intended
           120-second cache window. It sits behind ArtPlayer's red played line
           and thumb, never captures input, and keeps the Nothing-style signal
           red reserved for the actual playback position. */
        .watch-art-mount .art-control-progress-inner {
          overflow: hidden;
        }
        .watch-art-mount .watch-buffer-indicator {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .watch-art-mount .watch-buffer-indicator-segment {
          position: absolute;
          top: 50%;
          height: 3px;
          transform: translateY(-50%);
          border-radius: 999px;
          background: rgba(226, 232, 240, 0.44);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
        }
        .watch-art-mount .art-progress-loaded {
          background: transparent !important;
        }
        .watch-art-mount .art-progress-played,
        .watch-art-mount .art-progress-indicator {
          z-index: 3;
        }
        /* Episode sidebar: never taller than the visible viewport.
           100dvh tracks iOS Safari's collapsing toolbar; 100vh is the
           fallback for older browsers. */
        .watch-episodes { max-height: calc(100vh - 32px); }
        @supports (height: 100dvh) {
          .watch-episodes { max-height: calc(100dvh - 32px); }
        }
        /* Mobile / tablet polish */
        .watch-player { -webkit-touch-callout: none; }
        .watch-player * {
          -webkit-user-select: none;
          user-select: none;
        }
        @media (max-width: 768px) {
          .watch-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .watch-page {
            width: 100% !important;
            max-width: 100vw !important;
            padding: 8px var(--content-pad) var(--mobile-dock-clearance) !important;
            overflow-x: clip !important;
            overflow-y: visible !important;
          }
          .watch-episodes {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            max-height: none !important;
            position: static !important;
            overflow: visible !important;
          }
          .watch-episode-row { min-width: 0 !important; max-width: 100% !important; }
          .watch-episode-title {
            display: -webkit-box !important;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            white-space: normal !important;
            overflow: hidden !important;
            overflow-wrap: anywhere;
            line-height: 1.3;
          }
          .watch-episode-meta { flex-wrap: wrap; min-width: 0; }
          .watch-current-meta,
          .watch-synopsis,
          .watch-trust-note,
          #watch-comments {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
          .watch-nav { gap: 8px !important; }
	          /* Keep page-flow actions independently reachable on Android browsers.
	             Provider controls are already compatible, so this only protects
	             rating, episode navigation, and related outside-player controls. */
	          .watch-info,
	          .watch-details {
	            min-width: 0 !important;
	            overflow: visible !important;
	          }
	          .watch-rating,
	          .watch-nav {
	            position: relative;
	            z-index: 1;
	          }
	          .watch-nav {
	            display: grid !important;
	            grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
	            width: 100%;
	          }
	          .watch-nav button,
	          .watch-nav a {
	            width: 100%;
	            min-width: 0 !important;
	            justify-content: center;
	            white-space: nowrap;
	          }
          .watch-art-mount .art-video-player {
            --art-control-height: 42px;
            --art-control-icon-size: 28px;
            --art-padding: 8px;
          }
          .watch-art-mount .art-video-player .art-controls {
            padding-inline: 2px;
          }
          .watch-art-mount .art-video-player .art-controls .art-control {
            width: 34px;
            padding-inline: 2px;
          }
          .watch-art-mount .art-video-player .art-controls .art-control .art-icon {
            width: 26px;
            height: 26px;
          }
          .watch-art-mount .art-video-player .art-controls-quality {
            width: 60px;
            min-width: 60px;
          }
          .watch-art-mount .art-video-player .art-control-seekBackward10,
          .watch-art-mount .art-video-player .art-control-seekForward10 {
            width: 36px !important;
            min-width: 36px !important;
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .watch-art-mount .art-video-player .art-controls-left .art-control-time {
            display: none !important;
          }
          .watch-nav button { flex: 1 1 auto; min-width: 0; font-size: 12px; padding: 8px 12px; }
          .watch-rating {
            gap: 6px !important;
            min-width: 0;
            overflow: visible;
          }
          .watch-rating-label {
            min-width: 0;
          }
          .watch-rating-stars {
            min-width: 0;
            max-width: 100%;
            flex-wrap: nowrap;
            gap: 2px !important;
	            overflow-x: auto;
	            overflow-y: visible;
	            -webkit-overflow-scrolling: touch;
	            scrollbar-width: none;
          }
	          .watch-rating-stars::-webkit-scrollbar { display: none; }
          .watch-rating-stars button {
            width: 22px !important;
            min-width: 22px !important;
            min-height: 28px !important;
            padding: 2px !important;
          }
          .watch-rating-stars svg { width: 16px !important; height: 16px !important; }
          .watch-skip-overlay { right: 8px !important; max-width: calc(100% - 16px) !important; }
          .watch-skip-btn { min-height: 44px !important; padding: 8px 10px !important; font-size: 12px !important; }
        }
        @media (max-width: 1024px) and (hover: none) and (pointer: coarse) {
          .watch-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .watch-page { padding: 8px var(--content-pad) var(--mobile-dock-clearance) !important; }
          .watch-episodes { width: 100% !important; max-width: 100% !important; max-height: none !important; overflow: visible !important; position: static !important; }
          .watch-art-mount .art-controls { min-height: 42px; }
          .watch-skip-overlay { bottom: calc(44px + env(safe-area-inset-bottom, 0px)) !important; }
        }
        @media (orientation: landscape) and (max-height: 560px) {
          /* Keep the 16:9 ratio when the short landscape viewport limits height.
             A max-height alone leaves the inline width at 100%, which clips the
             bottom of the player on mobile landscape screens. */
          .watch-player {
            width: calc(177.7778vh - 21.3333px) !important;
            max-width: 100%;
            max-height: calc(100vh - 12px);
          }
          @supports (height: 100dvh) {
            .watch-player {
              width: calc(177.7778dvh - 21.3333px) !important;
              max-height: calc(100dvh - 12px);
            }
          }
          .watch-page { padding: 4px 4px var(--mobile-dock-clearance) !important; }
          .watch-comments-fab { bottom: calc(8px + env(safe-area-inset-bottom, 0px)) !important; }
          .watch-skip-overlay { bottom: calc(38px + env(safe-area-inset-bottom, 0px)) !important; }
        }
        @media (max-width: 480px) {
          .watch-nav { grid-template-columns: 1fr !important; }
          .watch-nav button,
          .watch-nav a { min-height: 44px; }
          .watch-rating {
            display: flex !important;
            flex-direction: column;
            align-items: flex-start !important;
            gap: 6px !important;
            flex-wrap: nowrap !important;
            width: 100%;
            max-width: 100%;
          }
          .watch-rating-label {
            width: 100%;
          }
          .watch-rating-stars {
            display: grid !important;
            grid-template-columns: repeat(10, minmax(18px, 1fr));
            width: min(220px, 100%);
            max-width: 100%;
            gap: 0 !important;
            overflow: visible;
          }
          .watch-rating-stars button {
            width: 100% !important;
            min-width: 18px !important;
          }
          .watch-nav { gap: 6px !important; }
          .watch-nav button { padding: 8px 10px; font-size: 11px; }
          .watch-art-mount .art-video-player .art-controls {
            padding-inline: 0;
          }
          .watch-art-mount .art-video-player .art-controls .art-control {
            width: 32px;
            padding-inline: 1px;
          }
          .watch-art-mount .art-video-player .art-controls .art-control .art-icon {
            width: 24px;
            height: 24px;
          }
          .watch-art-mount .art-video-player .art-controls-quality {
            width: 56px;
            min-width: 56px;
          }
        }
        @media (max-width: 360px) {
          /* Quality remains available from settings; remove its duplicate
             compact label only when the essential controls cannot all fit. */
          .watch-art-mount .art-video-player .art-controls-quality {
            display: none !important;
          }
        }
        /* High-contrast support */
        @media (prefers-contrast: more) {
          .watch-source-btn { border-width: 2px !important; }
          .watch-countdown { border-width: 2px !important; }
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
