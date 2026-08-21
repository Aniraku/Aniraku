const MEBIBYTE = 1024 * 1024
const TERMINAL_HLS_HTTP_STATUSES = new Set([401, 403, 404, 410, 429])

/**
 * Returns bounded hls.js buffering settings. Media Source data is held in the
 * browser, so these values deliberately reserve meaningful forward playback
 * without allowing a low-bitrate stream to grow memory usage indefinitely.
 */
export function getHlsBufferPolicy(_connection = {}) {
  return {
    // A predictable VOD reserve: 120 seconds forward and 120 seconds behind
    // the playhead. hls.js treats these as targets and still obeys browser MSE
    // limits when a device cannot retain the complete target.
    maxBufferLength: 120,
    maxMaxBufferLength: 120,
    maxBufferSize: 128 * MEBIBYTE,
    backBufferLength: 120,
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
  // MSE provides the explicit 120-second playback reserve. Forcing all VOD
  // fragments into the browser HTTP cache made the full episode look buffered
  // and could retain far more media than the player target. Normal caching
  // honors the origin's headers and allows browser eviction.
  return 'default'
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

/**
 * Native media elements do not expose a portable byte or second buffer target.
 * `auto` is the strongest standards-based hint: direct and proxied files may
 * prefetch as their network, cache headers, and local storage permit.
 */
export function getNativeMediaBufferPolicy() {
  return { preload: 'auto' }
}

/**
 * Express the same bounded connection-aware reserve through dash.js's forward
 * and backward buffer settings. Startup stays prompt while VOD keeps building
 * a meaningful reserve for smooth playback.
 */
export function getDashBufferPolicy(connection = {}) {
  const hls = getHlsBufferPolicy(connection)
  return {
    initialBufferLevel: Math.min(6, hls.maxBufferLength),
    bufferTimeDefault: hls.maxBufferLength,
    bufferTimeAtTopQuality: hls.maxBufferLength,
    bufferTimeAtTopQualityLongForm: hls.maxBufferLength,
    longFormContentDurationThreshold: 600,
    bufferToKeep: hls.backBufferLength,
    bufferPruningInterval: 15,
    fastSwitchEnabled: true,
  }
}
