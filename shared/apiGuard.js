// shared/apiGuard.js — same-origin API anti-tracing guard.
//
// The client only ever calls https://<site>/api/v1/*; a server-side proxy
// forwards those paths to the real backend. That proxy is ALSO a free
// public API for anyone who discovers it — scripted clients (curl,
// python-requests, okhttp, …) get the backend without ever visiting the
// site. This guard runs in the proxy before any upstream request is made
// and closes the cheap vectors, in order of certainty:
//
//   1. Scripted user-agents → 403. Real visitors always send a browser UA;
//      the SPA never originates a scripted one (axios in-browser inherits
//      the browser UA).
//   2. Cross-origin attribution → 403. Browsers attach Origin to fetch/XHR
//      and Referer to media/img/subresource requests. If one IS present and
//      its host is not ours, the caller is not this site. If BOTH are
//      absent we allow (nothing to attribute — layer 1 still applies), so
//      nothing here can break a legitimate browser path.
//   3. Best-effort per-isolate rate limit → 429. Generous (media playback
//      streams HLS segments through /api/v1/proxy, so thresholds sit far
//      above human usage) — this absorbs casual scrapes; durable limiting
//      belongs in the backend or the Cloudflare WAF, not here.
//
// The site host is never hardcoded: requests are compared against the
// request's own host, so custom domains and *.pages.dev previews work
// unchanged.

const SCRIPTED_UA_RE =
  /\b(curl\/|curl |wget|python-requests?|python-urllib|python-httpx|httpx|aiohttp|go-http-client|okhttp|libcurl|postman|insomnia|httpie|scrapy|phantomjs|selenium|puppeteer|headlesschrome|node-fetch|undici|axios\/|got\/|superagent|java\/|apache-httpclient|httpclient|mechanize|dart\/|php\/|guzzle|restclient)\b/i;

const RATE_WINDOW_MS = 60_000;
// ~15 requests/sec sustained. HLS playback streams every segment through
// the proxy and offline downloads fetch in parallel chunks, so thresholds
// sit well above both; scrapers doing token-exhaustion sweeps do not.
const RATE_MAX_REQUESTS = 900;

const rateBuckets = new Map();

function deny(status, code, extraHeaders) {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
      ...extraHeaders,
    },
  });
}

function clientIp(request) {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}

function rateLimit(request) {
  const ip = clientIp(request);
  const now = Date.now();

  // Shed stale state occasionally so the Map can't grow unbounded.
  if (rateBuckets.size > 10_000) {
    for (const [key, bucket] of rateBuckets) {
      if (now - bucket.reset >= RATE_WINDOW_MS) rateBuckets.delete(key);
    }
    if (rateBuckets.size > 10_000) rateBuckets.clear();
  }

  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.reset >= RATE_WINDOW_MS) {
    rateBuckets.set(ip, { count: 1, reset: now });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_MAX_REQUESTS;
}

/**
 * Returns a Response to send instead of proxying, or null to pass through.
 * @param {Request} request
 * @param {URL} url the parsed request URL (same object the caller builds)
 */
export function guardApiRequest(request, url) {
  const userAgent = request.headers.get('user-agent') ?? '';
  if (!userAgent.trim() || SCRIPTED_UA_RE.test(userAgent)) {
    return deny(403, 'forbidden');
  }

  const host = url.host;
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  try {
    if (origin) {
      if (new URL(origin).host !== host) return deny(403, 'forbidden');
    } else if (referer) {
      if (new URL(referer).host !== host) return deny(403, 'forbidden');
    }
  } catch {
    return deny(403, 'forbidden');
  }

  if (!rateLimit(request)) {
    return deny(429, 'rate_limited', { 'retry-after': '30' });
  }
  return null;
}

// Upstream response headers that fingerprint the stack behind the proxy
// (engine identity, backend CORS policy, platform ids). Same-origin
// clients ignore CORS headers entirely, so removing them costs nothing.
const UPSTREAM_HEADER_DENYLIST = [
  'server',
  'x-powered-by',
  'x-backend',
  'x-upstream',
  'x-runtime',
  'x-original-url',
  'x-vercel-id',
  'x-vercel-cache',
  'x-amzn-requestid',
  'x-amzn-trace-id',
  'x-aniraku-proxy', // legacy debug marker
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-allow-headers',
  'access-control-allow-methods',
  'access-control-expose-headers',
  'access-control-max-age',
];

/**
 * Strips fingerprinting headers from an upstream response's Headers object
 * (mutates in place) and marks API responses non-indexable.
 * @param {Headers} headers
 */
export function scrubUpstreamHeaders(headers) {
  for (const name of UPSTREAM_HEADER_DENYLIST) headers.delete(name);
  headers.set('x-robots-tag', 'noindex');
}
