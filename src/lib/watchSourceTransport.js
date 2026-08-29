function usableUrl(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : ''
}

export function createMediaTransportPlan({ verification, directUrl, proxyUrl, proxyOnly = false }) {
  const direct = usableUrl(directUrl) ? { mode: 'direct', url: usableUrl(directUrl) } : null
  const proxy = usableUrl(proxyUrl) ? { mode: 'proxy', url: usableUrl(proxyUrl) } : null
  if (proxyOnly) return proxy ? [proxy] : direct ? [direct] : []

  // Fastest verified startup rule: the resolver's first proxy URL is the
  // primary transport because it preserves provider headers and avoids an
  // extra browser CORS negotiation. The direct URL is a single bounded
  // fallback, never a second parallel player or an embed detour.
  // `verification` is intentionally accepted for the resolver contract; the
  // first proxy remains authoritative when it is present, including Bonk.
  void verification
  return [proxy, direct].filter(Boolean)
}

export function shouldTryHlsFallback(url) {
  return /\.m3u8(?:[?#]|$)/i.test(String(url || ''))
}

// Kiwi's uwucdn manifests are verified on browsers that expose native HLS
// support. Other HLS providers remain on hls.js so its bounded-buffer and
// recovery path can handle their provider-specific manifests and fragments.
export function shouldPreferNativeHls(url) {
  return /(?:^|\/\/)(?:[^/]+\.)?(?:uwucdn|owocdn)\.top\//i.test(String(url || ''))
}
