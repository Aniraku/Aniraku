const TERMINAL_HLS_HTTP_STATUSES = new Set([401, 403, 404, 410, 429])

export const CONTINUOUS_BUFFER_SECONDS = Number.POSITIVE_INFINITY
// dash.js performs ABR utility math with its target, so use a finite target
// large enough to cover any normal VOD episode instead of feeding it Infinity.
export const DASH_CONTINUOUS_BUFFER_SECONDS = 24 * 60 * 60

/**
 * Return continuous VOD buffering settings for hls.js. A MediaSource has no
 * portable "cache this entire episode" switch, so Infinity tells hls.js not to
 * stop loading or intentionally prune by a short time/byte window. The browser
 * and MediaSource implementation may still evict data under memory pressure.
 */
export function getHlsBufferPolicy(_connection = {}) {
  return {
    maxBufferLength: CONTINUOUS_BUFFER_SECONDS,
    maxMaxBufferLength: CONTINUOUS_BUFFER_SECONDS,
    maxBufferSize: Number.POSITIVE_INFINITY,
    backBufferLength: CONTINUOUS_BUFFER_SECONDS,
    frontBufferFlushThreshold: CONTINUOUS_BUFFER_SECONDS,
    maxBufferHole: 0.75,
  }
}

/**
 * HLS media fragments are immutable chunks for a specific tokenized URL. Ask
 * the browser to reuse them when the current playback session requests the
 * same URL again. Playlists and manifests stay fresh because signed URLs and
 * adaptive-bitrate updates must not be served from stale cache entries.
 */
export function getHlsRequestCacheMode(context = {}) {
  const isFragment = Boolean(context?.frag || context?.part) || context?.type === 'fragment'
  return isFragment ? 'force-cache' : 'default'
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
 * Express continuous VOD buffering through dash.js. Startup remains prompt,
 * then the scheduler keeps loading until the media timeline is complete. The
 * browser may still evict old ranges if the device is under memory pressure.
 */
export function getDashBufferPolicy(connection = {}) {
  const hls = getHlsBufferPolicy(connection)
  return {
    initialBufferLevel: 6,
    bufferTimeDefault: DASH_CONTINUOUS_BUFFER_SECONDS,
    bufferTimeAtTopQuality: DASH_CONTINUOUS_BUFFER_SECONDS,
    bufferTimeAtTopQualityLongForm: DASH_CONTINUOUS_BUFFER_SECONDS,
    longFormContentDurationThreshold: 600,
    bufferToKeep: DASH_CONTINUOUS_BUFFER_SECONDS,
    bufferPruningInterval: 15,
    fastSwitchEnabled: true,
  }
}
