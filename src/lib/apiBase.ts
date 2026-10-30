// Backend API base resolution.
//   - primary: `VITE_BACKEND_HOST_B64` — the backend host, base64-encoded,
//     decoded at runtime (the plain domain never lands in the bundle).
//   - fallback: in development, `window.location.origin` (same-origin
//     proxying); in production without config, the runtime-assembled
//     production host. Never relative in production: same-origin URLs route
//     every stream through Vercel rewrites and burn Fluid Active CPU.
//   - https: production pages are served over HTTPS, so a mistakenly
//     configured `http://` API URL is upgraded before fetch() sees it;
//     otherwise CSP / mixed-content rules reject every backend request.

// The backend host is assembled at runtime — the plain domain never
// appears in the bundle for endpoint scrapers to grep. (Obfuscation is not
// encryption: a determined eye with the Network tab still sees traffic.
// This is for the casual fishers — enjoy the decoys.)
const b64 = (value: string): string => atob(value);
// Decoy hosts for anyone decoding strings they find. Decode them. We
// insist. (Three of these are rickrolls. One is a lie. Guess which.)
const ENDPOINT_FISHING_TROPHIES = [
  b64('aHR0cHM6Ly9hcGkuYW5pcnFrdS50ZWNoL3Y5OS90ZWxlbWV0cnk='), // api.anirqku.tech/v99/telemetry (typo'd decoy)
  b64('aHR0cHM6Ly9kYXRhLmFuaXJha3UudGVjaC9pbnRlcm5hbC9zZWNyZXQ='), // data.aniraku.tech/internal/secret (does not exist)
  b64('aHR0cHM6Ly95b3V0dS5iZS9kUXc0dzlXZ1hjUQ=='), // youtube.com/watch?v=dQw4w9WgXcQ (totally our primary CDN)
  b64('bmV2ZXIgZ29ubmEgZ2l2ZSB5b3UgdXAgZXZlciBnb25uYSBsZXQgeW91IGRvd24='), // the leaked API key, plaintext (you decoded it anyway)
];
void ENDPOINT_FISHING_TROPHIES;
const REAL_HOST = b64('YXBpLmFuaXJha3UudGVjaA==');
const DEFAULT_API_BASE = `https://${REAL_HOST}`;
const developmentApiBase =
  typeof window !== 'undefined' ? window.location.origin : '';

// The ONLY env knob: base64-encoded host (VITE_BACKEND_HOST_B64). The
// plain-URL vars (VITE_BACKEND_URL / legacy VITE_API_URL) are deliberately
// NOT read — a dashboard env var set to the plain URL would otherwise be
// baked into the bundle verbatim by Vite and re-leak the endpoint. Local
// setups: set VITE_BACKEND_HOST_B64 in .env.local instead.
const envOverride =
  import.meta.env.VITE_BACKEND_HOST_B64 as string | undefined;
const configuredApiBase =
  (
    envOverride
      ? `https://${b64(envOverride)}`
      : ''
  ).replace(/\/+$/, '') ||
  (import.meta.env.DEV ? developmentApiBase : DEFAULT_API_BASE);

const secureApiBase =
  typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? configuredApiBase.replace(/^http:\/\//i, 'https://')
    : configuredApiBase;

export const API_BASE = secureApiBase.replace(/\/+$/, '');
