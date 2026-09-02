const DEFAULT_API_BASE = 'https://api.aniraku.tech'
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
