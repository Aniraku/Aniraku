const MEBIBYTE = 1024 * 1024
const TERMINAL_HLS_HTTP_STATUSES = new Set([401, 403, 404, 410, 429])

// hls.js and dash.js default forward/backward buffer targets. We deliberately
// do NOT pin maxBufferLength / maxMaxBufferLength / backBufferLength here —
// the player manages its own MediaSource reserve based on the live segment
// cadence, the connection profile, and the device's MSE budget. Pinning a
// fixed ceiling either throttles smooth playback on fast links or lets a
// slow stream blow past the intended reserve.
const HLS_DEFAULT_FORWARD_BUFFER_SECONDS = 30
const HLS_DEFAULT_BACK_BUFFER_SECONDS = 90

/**
 * Returns the hls.js buffering settings we still want to control explicitly.
 * Forward / max / back buffer length are intentionally left to hls.js
 * defaults so the player can grow its MediaSource reserve freely; this
 * function only pins the byte-level cap that protects device RAM.
 */
export function getHlsBufferPolicy(_connection = {}, { kiwi = false } = {}) {
  if (kiwi) {
    return {
      // Kiwi's proxy can expose the whole VOD through video.buffered while
      // only a few HLS fragments have arrived. Give hls.js enough forward
      // reserve to survive transient CDN/proxy delays without stalling, but
      // keep it bounded so the MediaSource eviction can still protect device
      // RAM on slow connections.
      maxBufferLength: 60,
      maxMaxBufferLength: 120,
      backBufferLength: 60,
      frontBufferFlushThreshold: 20,
      maxBufferSize: 256 * MEBIBYTE,
    }
  }

  return {
    // Byte cap only. No time-based cap here for non-Kiwi providers: hls.js
    // manages their reserve using its normal adaptive behavior.
    maxBufferSize: 128 * MEBIBYTE,
  }
}

/**
 * HLS fragments are immutable media chunks for a specific tokenized URL. Ask
 * the browser to reuse a matching HTTP-cache entry when the origin permits it.
 * Manifests retain the normal cache policy so token refresh and ABR updates are
 * not served from a stale playlist.
 */
export function getHlsRequestCacheMode(context = {}) {
  // MSE provides its own playback reserve. Forcing all VOD fragments into the
  // browser HTTP cache made the full episode look buffered and could retain
  // far more media than the player target. Normal caching honors the origin's
  // headers and allows browser eviction.
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
 * Express the same no-fixed-cap policy through dash.js's forward and backward
 * buffer settings. dash.js does not have a "default reserve" the way hls.js
 * does, so we hand it the same forward/back values the hls.js default would
 * have used and otherwise let it manage the MediaSource freely.
 */
export function getDashBufferPolicy(_connection = {}) {
  return {
    initialBufferLevel: Math.min(6, HLS_DEFAULT_FORWARD_BUFFER_SECONDS),
    bufferTimeDefault: HLS_DEFAULT_FORWARD_BUFFER_SECONDS,
    bufferTimeAtTopQuality: HLS_DEFAULT_FORWARD_BUFFER_SECONDS,
    bufferTimeAtTopQualityLongForm: HLS_DEFAULT_FORWARD_BUFFER_SECONDS,
    longFormContentDurationThreshold: 600,
    bufferToKeep: HLS_DEFAULT_BACK_BUFFER_SECONDS,
    bufferPruningInterval: 15,
    fastSwitchEnabled: true,
  }
}
