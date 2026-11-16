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
    // Base64-encoded host only. The plain-URL var (VITE_BACKEND_URL) is
    // deliberately NOT read anywhere — a dashboard env var set to the plain
    // URL would otherwise be baked into the bundle verbatim by Vite and
    // re-leak the endpoint.
    import.meta.env.VITE_BACKEND_HOST_B64 as string | undefined
      ? `https://${b64(import.meta.env.VITE_BACKEND_HOST_B64 as string)}`
      : ''
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

// PLAYBACK BASE — where k-links (`/api/v1/proxy?k=...`) and proxied media
// resolve. Same-origin by default: the Pages function serves playback like
// every other API call. Deployments that want playback to bypass the
// function entirely (function quota: playback is ~95% of request volume)
// set VITE_PLAYBACK_HOST_B64 — base64 of the backend host, the same
// never-a-literal pattern as VITE_BACKEND_HOST_B64 — and every playback URL
// is prefixed with it. The function keeps serving the low-volume metadata
// endpoints (servers, episodes, track, logo); the browser talks to the
// backend directly for streams, where its Origin clears the backend gate's
// trusted-origin check.
const playbackHostB64 = import.meta.env.VITE_PLAYBACK_HOST_B64 as
  | string
  | undefined;
const configuredPlaybackBase = (
  playbackHostB64 ? `https://${b64(playbackHostB64)}` : ''
).replace(/\/+$/, '');

const securePlaybackBase =
  typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? configuredPlaybackBase.replace(/^http:\/\//i, 'https://')
    : configuredPlaybackBase;

export const PLAYBACK_BASE = securePlaybackBase;

/**
 * Prefix a relative API/playback URL with the playback base. Absolute URLs
 * pass through untouched; with no override configured this is an identity
 * function (same-origin playback, exactly as before).
 */
export function playbackUrl(url: string): string {
  if (!url || !PLAYBACK_BASE || PLAYBACK_BASE === API_BASE) return url;
  if (url.startsWith(`${API_BASE}/api/v1/`)) {
    return PLAYBACK_BASE + url.slice(API_BASE.length);
  }
  if (url.startsWith('/api/v1/') || url.startsWith('/ani/v1/')) {
    return PLAYBACK_BASE + url;
  }
  return url;
}
