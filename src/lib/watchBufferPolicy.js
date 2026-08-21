const MEBIBYTE = 1024 * 1024
const TERMINAL_HLS_HTTP_STATUSES = new Set([401, 403, 404, 410, 429])

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

/**
 * Signed-URL and throttling responses cannot be repaired by repeating the
 * exact same request. Gateway failures are deliberately not terminal: they
 * are commonly transient while a proxy or upstream is recovering.
 */
export function isTerminalHlsStatus(status) {
  return TERMINAL_HLS_HTTP_STATUSES.has(Number(status))
}

/**
 * A terminal status must stop same-URL retries and send the player to an
 * eligible alternate server. The Watch page deliberately does not ask the
 * resolver to refresh an actively playing provider because that rebuilds the
 * player and discards its earned MediaSource buffer.
 */
export function getHlsProviderRecoveryReason(status) {
  return isTerminalHlsStatus(status) ? 'permanent-cdn' : 'native-hls-error'
}

/**
 * hls.js owns transient segment, playlist, and manifest retry. Letting the
 * outer player reload the source at the first recoverable failure discards
 * the MediaSource buffer and creates visible ArtPlayer reconnect loops.
 */
export function getHlsLoadPolicies() {
  const retryTransientResponse = (_config, _retryCount, _isTimeout, response) =>
    !isTerminalHlsStatus(response?.code ?? response?.status)

  const retry = (maxNumRetry, retryDelayMs, maxRetryDelayMs) => ({
    maxNumRetry,
    retryDelayMs,
    maxRetryDelayMs,
    backoff: 'exponential',
    shouldRetry: retryTransientResponse,
  })

  return {
    manifestLoadPolicy: {
      default: {
        maxTimeToFirstByteMs: 15_000,
        maxLoadTimeMs: 30_000,
        timeoutRetry: retry(1, 750, 2_000),
        errorRetry: retry(1, 1_000, 3_000),
      },
    },
    playlistLoadPolicy: {
      default: {
        maxTimeToFirstByteMs: 15_000,
        maxLoadTimeMs: 30_000,
        timeoutRetry: retry(2, 750, 3_000),
        errorRetry: retry(2, 1_000, 4_000),
      },
    },
    fragLoadPolicy: {
      default: {
        maxTimeToFirstByteMs: 15_000,
        maxLoadTimeMs: 90_000,
        timeoutRetry: retry(2, 750, 3_000),
        errorRetry: retry(3, 1_000, 6_000),
      },
    },
  }
}
