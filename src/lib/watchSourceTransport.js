export function createMediaTransportPlan({ verification, directUrl, proxyUrl }) {
  const direct = { mode: 'direct', url: directUrl }
  const proxy = { mode: 'proxy', url: proxyUrl }

  // Keep the established proxy-first startup path for every source, including
  // advisory-unverified Kiwi HLS URLs. Some Kiwi CDNs require the resolver's
  // Referer/header context during the initial manifest request; direct browser
  // playback remains the one bounded fallback if that proxy attempt fails.
  return [proxy, direct]
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
