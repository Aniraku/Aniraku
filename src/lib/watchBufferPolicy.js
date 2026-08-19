const MEBIBYTE = 1024 * 1024

/**
 * Returns bounded hls.js buffering settings. Media Source data is held in the
 * browser, so these values deliberately reserve meaningful forward playback
 * without allowing a low-bitrate stream to grow memory usage indefinitely.
 */
export function getHlsBufferPolicy(connection = {}) {
  const effectiveType = String(connection?.effectiveType || '').toLowerCase()
  const downlink = Number(connection?.downlink || 0)
  const saveData = connection?.saveData === true

  if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
    return {
      maxBufferLength: 45,
      maxMaxBufferLength: 90,
      maxBufferSize: 32 * MEBIBYTE,
      backBufferLength: 20,
      maxBufferHole: 0.75,
    }
  }

  if (effectiveType === '3g' || (downlink > 0 && downlink < 4)) {
    return {
      maxBufferLength: 75,
      maxMaxBufferLength: 150,
      maxBufferSize: 64 * MEBIBYTE,
      backBufferLength: 45,
      maxBufferHole: 0.75,
    }
  }

  return {
    maxBufferLength: 120,
    maxMaxBufferLength: 180,
    maxBufferSize: 96 * MEBIBYTE,
    backBufferLength: 60,
    maxBufferHole: 0.75,
  }
}

/**
 * HLS fragments are immutable media chunks for a specific tokenized URL. Ask
 * the browser to reuse a matching HTTP-cache entry when the origin permits it.
 * Manifests retain the normal cache policy so token refresh and ABR updates are
 * not served from a stale playlist.
 */
export function getHlsRequestCacheMode(context = {}) {
  const kind = String(context?.type || '').toLowerCase()
  return context?.frag || kind.includes('fragment') || kind.includes('part')
    ? 'force-cache'
    : 'default'
}
