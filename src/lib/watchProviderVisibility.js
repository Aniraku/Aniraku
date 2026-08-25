const TERMINAL_FAILURE_REASONS = new Set([
  'hls-terminal-before-playback',
  'native-media-error',
  'csp-blocked',
  'stream-no-source',
  'all-source-urls-failed',
])

/**
 * A provider response with an HTTP error is a confirmed provider-specific
 * failure for the selected episode. Network failures and timeouts have no
 * trustworthy status and remain visible for manual retry.
 */
export function isTerminalProviderHttpStatus(status) {
  const code = Number(status)
  return Number.isInteger(code) && code >= 400 && code < 600
}

/**
 * The stream resolver is the only safe preflight boundary. It can confirm a
 * provider-specific HTTP failure or a missing source payload without probing
 * cross-origin media fragments, embeds, or advertising subresources.
 */
export function isProviderProbeUsable({ status, payload, transportFailed = false } = {}) {
  if (transportFailed) return true
  if (isTerminalProviderHttpStatus(status)) return false
  if (!payload) return false
  if (payload.error) return false
  if (!Array.isArray(payload.sources)) return true
  return payload.sources.some((source) => Boolean(String(source?.url || '').trim()))
}

/**
 * Preserve a provider while another real media URL can still be selected.
 * The caller supplies media-only URLs, after any compatible embed fallback
 * has already been considered.
 */
export function shouldHideProviderAfterFailure({
  reason,
  status,
  mediaUrls = [],
  failedUrl = '',
  suppressedUrls = new Set(),
} = {}) {
  const terminal = TERMINAL_FAILURE_REASONS.has(reason) || isTerminalProviderHttpStatus(status)
  if (!terminal) return false

  return !mediaUrls.some((url) => {
    const value = String(url || '')
    return value && value !== failedUrl && !suppressedUrls.has(value)
  })
}
