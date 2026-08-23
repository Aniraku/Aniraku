const DEFAULT_API_BASE = 'https://api.aniraku.tech'
const developmentApiBase = typeof window !== 'undefined' ? window.location.origin : ''

// In development, keep every API request same-origin so Vite can relay it to
// Aniraku's backend. Production keeps the configured API URL, or the public
// Aniraku backend when no deployment variable is present.
export const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? developmentApiBase : DEFAULT_API_BASE)
).replace(/\/$/, '')
export const PROXY_BASE = import.meta.env.VITE_PROXY_URL || `${API_BASE}/api/v1`
