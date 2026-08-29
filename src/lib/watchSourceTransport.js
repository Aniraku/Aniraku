function usableUrl(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : ''
}

export function createMediaTransportPlan({ verification, directUrl, proxyUrl, proxyFirst = false }) {
  const direct = usableUrl(directUrl) ? { mode: 'direct', url: usableUrl(directUrl) } : null
  const proxy = usableUrl(proxyUrl) ? { mode: 'proxy', url: usableUrl(proxyUrl) } : null
  void verification
  return (proxyFirst ? [proxy, direct] : [direct, proxy]).filter(Boolean)
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
