// ---------------------------------------------------------------------------
// Embed source eligibility — ported verbatim from Aniraku Watch.jsx:766-857.
// The backend's `verification` field is an ADVISORY snapshot; only a
// definitive `dead` verdict or an expired signed token removes an embed row.
// (The old app shipped all of this; it had been dropped here, which let
// dead/Kiwi-framed embeds render as blank iframes — it looked like the
// "Embed server" was removed when it was really just broken.)
// ---------------------------------------------------------------------------

// Some upstreams embed UTC expiry stamps such as 20260808014918 in the
// stream URL. A token whose newest valid timestamp is already in the past is
// definitively dead; mounting it only creates repeated proxy 401/direct 404
// noise before the normal provider failover can begin.
export function hasExpiredEmbeddedToken(url) {
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
  if (newest > 0 && Date.now() > newest + 30_000) return true

  // Several CDNs expose UNIX expiry values instead of a readable timestamp.
  // Treat only clearly named, valid epoch values as definitive expiry; unknown
  // query parameters never remove a potentially playable source.
  try {
    const params = new URL(String(url || '')).searchParams
    for (const [key, raw] of params.entries()) {
      if (!/^(?:exp|expires|expiry|token_expiry|tokenexpires)$/i.test(key)) continue
      const value = Number(raw)
      if (!Number.isFinite(value)) continue
      const timestamp = value >= 1e12 ? value : value >= 1e9 ? value * 1000 : 0
      if (timestamp > 0 && Date.now() > timestamp + 30_000) return true
    }
  } catch {
    // Not an absolute URL — no epoch params to inspect.
  }
  return false
}

export function getSourcePlaybackType(source) {
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

export function isKiwiEmbedUrl(url) {
  return /^https?:\/\/(?:www\.)?kwik\.cx\//i.test(String(url || ''))
}

export function isSandboxBlockedEmbed(url) {
  return /megaplay\.(buzz|site|top|xyz|pro|club|cc|live)/i.test(String(url || ''))
}

function getSourceVerification(source) {
  return String(source?.verification || source?.Verification || '').trim().toLowerCase()
}

// Embed verification is normally supplied by the API. Some provider responses
// omit the advisory field, so an otherwise valid embed URL should remain
// selectable instead of removing the whole provider row. A definitive dead
// verdict or an expired signed token is still rejected.
export function isPlayableEmbedSource(source) {
  if (getSourcePlaybackType(source) !== 'embed' || !source?.url) return false
  return getSourceVerification(source) !== 'dead' && !hasExpiredEmbeddedToken(source.url)
}

export function isKiwiEmbedSource(source) {
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
export function isBrowserPlayableEmbedSource(source) {
  return isPlayableEmbedSource(source) && !isKiwiEmbedSource(source)
}

// Pick the first embed that will actually run in a browser iframe; callers
// pass the predicate so tests (and non-browser hosts) can swap the rule.
export function chooseBrowserPlayableEmbed(sources, isPlayableEmbed) {
  const candidates = (Array.isArray(sources) ? sources : [])
    .filter((source) => source?.url && isPlayableEmbed(source))

  // mp4upload currently redirects repeatedly in the browser. Prefer another
  // eligible same-provider embed when one is supplied, but retain it as the
  // final fallback so this helper does not silently drop a usable provider.
  return candidates.find((source) => !/mp4upload\.com\/embed/i.test(source.url)) || candidates[0] || null
}
