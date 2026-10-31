// Backend API base resolution — SAME-ORIGIN by default.
//
// The browser only ever calls https://<site>/api/v1/*; a server-side
// rewrite (vercel.json on Vercel, _redirects on Cloudflare Pages) forwards
// those paths to the real backend. The backend host exists NOWHERE the
// browser can see: not in the bundle, not in the HTML, not in the Network
// tab. (Server config is the only place the host lives — and that is not
// served to clients.)
//
// Overrides for non-proxied deploys:
//   - VITE_BACKEND_HOST_B64: base64-encoded backend host (never a literal).
//   - VITE_BACKEND_URL: plain URL override (last resort — it WILL be baked
//     into the bundle by Vite and appear in the Network tab).
const b64 = (value: string): string => atob(value);
const developmentApiBase =
  typeof window !== 'undefined' ? window.location.origin : '';

const configuredApiBase =
  (
    (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
    (import.meta.env.VITE_BACKEND_HOST_B64 as string | undefined
      ? `https://${b64(import.meta.env.VITE_BACKEND_HOST_B64 as string)}`
      : undefined) ||
    ''
  ).replace(/\/+$/, '');

void developmentApiBase; // dev uses the vite server proxy (same-origin too)

const secureApiBase =
  typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? configuredApiBase.replace(/^http:\/\//i, 'https://')
    : configuredApiBase;

/**
 * '' = same-origin (the default: server rewrites proxy /api/v1/* to the
 * backend). Templates use `${API_BASE}/api/v1/...` — the leading slash in
 * the template makes empty-base resolve to a same-origin absolute path.
 */
export const API_BASE = secureApiBase;
