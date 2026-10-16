// ---------------------------------------------------------------------------
// Backend API base — TS port of Aniraku `src/config.js:1-18` API_BASE
// resolution, re-based onto Aniraku's env:
//   - primary: `VITE_BACKEND_URL` (trailing slash stripped) — .env.local
//     ships `https://api-host.redacted.invalid/`, so API_BASE resolves to
//     `https://api-host.redacted.invalid` and endpoints mount at
//     `${API_BASE}/api/v1/...`. `VITE_API_URL` (vercel.json's name for the
//     same value) is accepted as a fallback — without either, production
//     builds silently degrade to same-origin URLs, routing every stream
//     through Vercel rewrites and burning Fluid Active CPU.
//   - fallback: dev → `window.location.origin` (same-origin proxying like
//     Aniraku's dev default), prod without config → `https://api-host.redacted.invalid`
//     directly. Never relative in prod: same-origin URLs route every stream
//     through Vercel rewrites and burn Fluid Active CPU (Oct 2026 pause).
//     (Aniraku used `''` here; we deliberately differ.)
//   - https: production pages are served over HTTPS, so a mistakenly
//     configured `http://` API URL is upgraded before fetch() sees it,
//     otherwise CSP / mixed-content rules reject every backend request
//     (config.js:11-16, verbatim rule).
// ---------------------------------------------------------------------------

const DEFAULT_API_BASE = 'https://api-host.redacted.invalid';
const developmentApiBase =
  typeof window !== 'undefined' ? window.location.origin : '';

const configuredApiBase =
  (
    (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
    // vercel.json ships VITE_API_URL (same value, legacy name) — accept
    // both so production builds never silently fall back to same-origin
    // proxying through Vercel rewrites (which burns Fluid Active CPU on
    // every streamed byte).
    (import.meta.env.VITE_API_URL as string | undefined) ||
    ''
  ).replace(/\/+$/, '') || (import.meta.env.DEV ? developmentApiBase : DEFAULT_API_BASE);

const secureApiBase =
  typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? configuredApiBase.replace(/^http:\/\//i, 'https://')
    : configuredApiBase;

export const API_BASE = secureApiBase.replace(/\/+$/, '');
