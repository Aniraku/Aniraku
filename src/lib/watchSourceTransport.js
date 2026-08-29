function usableUrl(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : ''
}

export function createMediaTransportPlan({ verification, directUrl, proxyUrl, proxyOnly = false }) {
  const direct = usableUrl(directUrl) ? { mode: 'direct', url: usableUrl(directUrl) } : null
  const proxy = usableUrl(proxyUrl) ? { mode: 'proxy', url: usableUrl(proxyUrl) } : null
  if (proxyOnly) return proxy ? [proxy] : direct ? [direct] : []
  // Legacy playback path: use the resolver's proxy first for every provider,
  // then make one bounded direct attempt. This preserves provider headers and
  // avoids direct CORS failures on the initial HLS manifest request.
  void verification
  return [proxy, direct].filter(Boolean)
}

export function shouldTryHlsFallback(url) {
  return /\.m3u8(?:[?#]|$)/i.test(String(url || ''))
}

export function shouldPreferNativeHls(url) {
  return /(?:^|\/\/)(?:[^/]+\.)?(?:uwucdn|owocdn)\.(?:top|net|com)\//i.test(String(url || ''))
}
