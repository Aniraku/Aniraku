// Same-origin API in production: Vercel rewrites /api/v1/* (and /health) to
// the backend, so JSON calls are same-origin and immune to the backend's
// CORS origin whitelist (which does not cover every domain the site is
// served from). Heavy media traffic is unaffected — the backend returns
// already-proxied stream URLs (Access-Control-Allow-Origin: *) that the
// browser loads directly from api.aniraku.tech.
const DEFAULT_API_BASE = '' // same-origin; empty string keeps fetch() URLs relative
const developmentApiBase = typeof window !== 'undefined' ? window.location.origin : ''
const configuredApiBase = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? developmentApiBase : DEFAULT_API_BASE)

// Production pages are served over HTTPS. Upgrade a mistakenly configured
// HTTP API URL before fetch() sees it, otherwise CSP and mixed-content rules
// reject every backend request before the API can redirect to HTTPS.
const secureApiBase = typeof window !== 'undefined' && window.location.protocol === 'https:'
  ? configuredApiBase.replace(/^http:\/\//i, 'https://')
  : configuredApiBase

export const API_BASE = secureApiBase.replace(/\/$/, '')
export const PROXY_BASE = import.meta.env.VITE_PROXY_URL || `${API_BASE}/api/v1`
