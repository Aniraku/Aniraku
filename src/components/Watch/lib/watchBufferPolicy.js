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
      // only a few HLS fragments have arrived. Give hls.js a large forward
      // reserve to survive transient CDN/proxy delays without stalling.
      // The player manages its own MediaSource budget, so these ceilings
      // protect device RAM without choking the adaptive reserve.
      maxBufferLength: 120,
      maxMaxBufferLength: 300,
      backBufferLength: 90,
      frontBufferFlushThreshold: 30,
      maxBufferSize: 512 * MEBIBYTE,
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
export function getHlsRequestCacheMode(_context = {}) {
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

/**
 * Bandwidth-saver preference (the "Limit video caching" toggle in the player
 * menu). ON by default: the forward buffer is capped at 90s, the back buffer
 * at 60s and the byte reserve at 128 MiB, so an idle tab stops pulling
 * segments long before it used to. OFF restores the legacy unlimited-cache
 * behavior (whole-title forward buffer, no back-buffer eviction) that makes
 * every seek replay from cache instead of re-downloading — at the cost of
 * real bandwidth and memory.
 */
const BANDWIDTH_SAVER_KEY = 'aniraku:data-saver'

export function getBandwidthSaverPref() {
  try {
    const raw = localStorage.getItem(BANDWIDTH_SAVER_KEY)
    // Absent = default ON. Only an explicit '0' disables it.
    return raw !== '0'
  } catch {
    return true
  }
}

export function setBandwidthSaverPref(enabled) {
  try {
    localStorage.setItem(BANDWIDTH_SAVER_KEY, enabled ? '1' : '0')
  } catch {
    // Storage unavailable — the toggle still applies for this session.
  }
}

const SAVER_FORWARD_BUFFER_SECONDS = 90
const SAVER_MAX_BUFFER_SECONDS = 180
const SAVER_BACK_BUFFER_SECONDS = 60
const SAVER_MAX_BUFFER_BYTES = 128 * MEBIBYTE

/**
 * Merge the bandwidth-saver caps into an hls.js config fragment. Kiwi
 * (proxied) sources keep their larger reserve even in saver mode — the
 * proxy's buffering quirk makes a tight cap stall visibly.
 */
export function applyBandwidthSaverPolicy(config, { kiwi = false } = {}) {
  if (!getBandwidthSaverPref() || kiwi) return config
  return {
    ...config,
    maxBufferLength: Math.min(
      config.maxBufferLength ?? SAVER_FORWARD_BUFFER_SECONDS,
      SAVER_FORWARD_BUFFER_SECONDS,
    ),
    maxMaxBufferLength: Math.min(
      config.maxMaxBufferLength ?? SAVER_MAX_BUFFER_SECONDS,
      SAVER_MAX_BUFFER_SECONDS,
    ),
    backBufferLength: Math.min(
      config.backBufferLength ?? SAVER_BACK_BUFFER_SECONDS,
      SAVER_BACK_BUFFER_SECONDS,
    ),
    maxBufferSize: Math.min(
      config.maxBufferSize ?? SAVER_MAX_BUFFER_BYTES,
      SAVER_MAX_BUFFER_BYTES,
    ),
  }
}
