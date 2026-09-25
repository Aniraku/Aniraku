// ---------------------------------------------------------------------------
// Backend API base — TS port of Aniraku `src/config.js:1-18` API_BASE
// resolution, re-based onto Aniraku's env:
//   - primary: `VITE_BACKEND_URL` (trailing slash stripped) — .env.local
//     ships `https://api.aniraku.tech/`, so API_BASE resolves to
//     `https://api.aniraku.tech` and endpoints mount at
//     `${API_BASE}/api/v1/...`.
//   - fallback: dev → `window.location.origin` (same-origin proxying like
//     Aniraku's dev default), prod without config → `''` (empty string keeps
//     fetch() URLs relative — Aniraku `DEFAULT_API_BASE`, config.js:7).
//   - https: production pages are served over HTTPS, so a mistakenly
//     configured `http://` API URL is upgraded before fetch() sees it,
//     otherwise CSP / mixed-content rules reject every backend request
//     (config.js:11-16, verbatim rule).
// ---------------------------------------------------------------------------

const DEFAULT_API_BASE = '';
const developmentApiBase =
  typeof window !== 'undefined' ? window.location.origin : '';

const configuredApiBase =
  ((import.meta.env.VITE_BACKEND_URL as string | undefined) || '').replace(
    /\/+$/,
    '',
  ) || (import.meta.env.DEV ? developmentApiBase : DEFAULT_API_BASE);

const secureApiBase =
  typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? configuredApiBase.replace(/^http:\/\//i, 'https://')
    : configuredApiBase;

export const API_BASE = secureApiBase.replace(/\/+$/, '');
