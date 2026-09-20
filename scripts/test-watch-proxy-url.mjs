import assert from 'node:assert/strict'
import {
  buildProxyUrl,
  isOwnProxyUrl,
  unwrapProxyShapedStreamUrl,
} from '../src/lib/watchProxyUrl.js'

const PROXY_BASE = 'https://api.aniraku.tech/api/v1'
const CDN = 'https://fetch.nexabloom.top/anime/abc/def/master.m3u8'

// ── unwrapProxyShapedStreamUrl ────────────────────────────────────────────────

// Plain CDN URL is not proxy-shaped.
assert.equal(unwrapProxyShapedStreamUrl(CDN), null)
assert.equal(unwrapProxyShapedStreamUrl(''), null)
assert.equal(unwrapProxyShapedStreamUrl(null), null)

// Single wrap: peels the layer and exposes the upstream headers.
const single = `https://megaplay.buzz/proxy?url=${encodeURIComponent(CDN)}&headers=${encodeURIComponent(JSON.stringify({ Referer: 'https://megaplay.buzz/' }))}`
assert.deepEqual(unwrapProxyShapedStreamUrl(single), {
  innerUrl: CDN,
  headers: { Referer: 'https://megaplay.buzz/' },
})

// Double wrap (the 403 bug): a proxy URL that itself contains a proxy URL.
// The helper must unwrap ALL the way down to the bare CDN URL, never leave a
// half-unwrapped proxy-shaped string behind.
const inner = `https://api.aniraku.tech/api/v1/proxy?url=${encodeURIComponent(CDN)}&headers=${encodeURIComponent(JSON.stringify({ Referer: 'https://megaplay.buzz/' }))}`
const double = `https://api.aniraku.tech/api/v1/proxy?url=${encodeURIComponent(inner)}&headers=${encodeURIComponent(JSON.stringify({ Referer: 'https://megaplay.buzz/' }))}`
assert.equal(unwrapProxyShapedStreamUrl(double).innerUrl, CDN)
assert.deepEqual(unwrapProxyShapedStreamUrl(double).headers, { Referer: 'https://megaplay.buzz/' })

// Malformed input fails cleanly.
assert.equal(unwrapProxyShapedStreamUrl('http://<bad'), null)

// ── isOwnProxyUrl ─────────────────────────────────────────────────────────────

assert.equal(isOwnProxyUrl(`${PROXY_BASE}/proxy?url=${encodeURIComponent(CDN)}&rn=x`), true)
assert.equal(isOwnProxyUrl('https://cdn.example.com/proxy?url=https://a.test/v.m3u8'), true)
assert.equal(isOwnProxyUrl(CDN), false)
assert.equal(isOwnProxyUrl(`${PROXY_BASE}/proxy`), false)
assert.equal(isOwnProxyUrl(''), false)
assert.equal(isOwnProxyUrl(null), false)

// ── buildProxyUrl ─────────────────────────────────────────────────────────────

// Wraps a bare CDN URL with headers and nonce.
const wrapped = buildProxyUrl({
  target: CDN,
  headers: { Referer: 'https://megaplay.buzz/' },
  nonce: 'n1',
  proxyBase: PROXY_BASE,
})
assert.equal(
  wrapped,
  `${PROXY_BASE}/proxy?url=${encodeURIComponent(CDN)}&headers=${encodeURIComponent(JSON.stringify({ Referer: 'https://megaplay.buzz/' }))}&rn=n1`,
)

// Idempotence: an already-proxy-shaped target is passed through untouched —
// never double-wrapped (this is exactly the console-observed 403 bug).
assert.equal(buildProxyUrl({ target: wrapped, proxyBase: PROXY_BASE }), wrapped)
assert.equal(
  buildProxyUrl({ target: `${PROXY_BASE}/proxy?url=${encodeURIComponent(CDN)}`, headers: { Referer: 'x' }, nonce: 'n2', proxyBase: PROXY_BASE }),
  `${PROXY_BASE}/proxy?url=${encodeURIComponent(CDN)}`,
)

// No headers / no nonce → minimal URL.
assert.equal(
  buildProxyUrl({ target: CDN, proxyBase: PROXY_BASE }),
  `${PROXY_BASE}/proxy?url=${encodeURIComponent(CDN)}`,
)

// Empty headers object and non-string targets are handled.
assert.equal(
  buildProxyUrl({ target: CDN, headers: {}, nonce: 'n3', proxyBase: PROXY_BASE }),
  `${PROXY_BASE}/proxy?url=${encodeURIComponent(CDN)}&rn=n3`,
)
assert.equal(buildProxyUrl({ target: '', proxyBase: PROXY_BASE }), '')
assert.equal(buildProxyUrl({ target: 42, proxyBase: PROXY_BASE }), '')

// Trailing slash on the base is normalized.
assert.equal(
  buildProxyUrl({ target: CDN, proxyBase: `${PROXY_BASE}/` }),
  `${PROXY_BASE}/proxy?url=${encodeURIComponent(CDN)}`,
)

console.log('watch proxy url tests passed')
