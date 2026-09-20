// Backend proxy URL hygiene for HLS/MP4 playback.
//
// The backend proxy is reachable as `<PROXY_BASE>/proxy?url=<target>&headers=<json>`.
// Provider payloads sometimes hand us URLs that are ALREADY in that shape (either
// our own proxy from a legacy playback path, or a lookalike upstream proxy). When
// such a URL is fed back through the wrapper a second time, the result is a
// double-wrapped request — `proxy?url=proxy?url=cdn` — which the proxy gate
// rejects with 403 (observed as
// `/api/v1/proxy?url=https%3A%2F%2Fapi.aniraku.tech%2Fapi%2Fv1%2Fproxy%3Furl%3D…`
// in the browser console).

const PATHNAME_RE = /\/proxy\/?$/

// Detects the proxy-shaped URL `https://<origin>/proxy?url=<encoded>&headers=<json>`
// and returns the inner CDN URL plus the exact upstream headers the wrapper
// attached. Handles MULTIPLE layers of wrapping (a legacy double-wrapped URL is
// unwrapped completely, not left half-proxy-shaped). Non-proxy URLs return null.
export function unwrapProxyShapedStreamUrl(url) {
  let inner = String(url || '').trim()
  if (!inner) return null
  let headers = null
  try {
    // One pass peels one layer; loop until the URL is no longer proxy-shaped.
    // Headers from the OUTERMOST layer win: those are the ones the original
    // wrapper attached for the CDN, and each additional wrap would only carry
    // its own copy of the same value.
    for (let depth = 0; depth < 4; depth += 1) {
      const parsed = new URL(inner)
      if (!PATHNAME_RE.test(parsed.pathname)) break
      const candidate = parsed.searchParams.get('url')
      if (!candidate || !/^https?:\/\//i.test(candidate)) break
      inner = candidate
      const rawHeaders = parsed.searchParams.get('headers')
      if (rawHeaders) {
        try { headers = JSON.parse(rawHeaders) } catch { headers = null }
      }
    }
  } catch {
    // Malformed URL — if we already peeled at least one layer, the peeled
    // result is still more useful than the input; otherwise fail cleanly.
    if (inner === String(url || '').trim()) return null
  }
  if (inner === String(url || '').trim()) return null
  return { innerUrl: inner, headers }
}

// True when the URL would need re-wrapping through our proxy: not already
// carrying our own proxy marker. Uses the query marker rather than a prefix
// test so proxies mounted under any base path are recognized.
export function isOwnProxyUrl(url) {
  try {
    const parsed = new URL(String(url || ''))
    return PATHNAME_RE.test(parsed.pathname) && parsed.searchParams.has('url')
  } catch {
    return false
  }
}

// Builds a proxy URL for `target` without ever double-wrapping. A target that
// is already proxy-shaped is returned untouched (it already carries its own
// headers param); everything else gets wrapped with the supplied headers and a
// per-session nonce. `proxyBase` is the deployment's PROXY_BASE value.
export function buildProxyUrl({ target, headers, nonce, proxyBase }) {
  const base = String(proxyBase || '').replace(/\/$/, '')
  if (typeof target !== 'string' || !target.trim()) return ''
  if (isOwnProxyUrl(target)) return target
  let params = `url=${encodeURIComponent(target)}`
  if (headers && typeof headers === 'object' && Object.keys(headers).length > 0) {
    params += `&headers=${encodeURIComponent(JSON.stringify(headers))}`
  }
  if (nonce) params += `&rn=${encodeURIComponent(nonce)}`
  return `${base}/proxy?${params}`
}
