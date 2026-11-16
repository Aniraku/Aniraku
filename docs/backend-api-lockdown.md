# Backend API Lockdown — anti-tracing + shared-secret enforcement

Status: implemented on the frontend (this repo). The backend side is
yours to deploy — follow the rollout order below and the site never
breaks during the transition.

## Threat model (what "trackable" means, verified 2026-11-15)

| Vector | Status |
| --- | --- |
| Visitor's Network tab / shipped JS bundle | **Clean** — the client only calls same-origin `/api/v1/*`; no host literal or base64 host in `dist/` or the live HTML/chunks |
| Public repo (AGPL source) | **Was leaked** — `vercel.json`, `vite.config.ts`, `functions/health.js`, `functions/api/v1/[[path]].js` all named the host. **Fixed:** every origin now comes from deployment env vars; no literal remains in the repo |
| Direct hits on the backend host | **Open by design until Phase 3** — the proxy guard cannot protect a host someone learned elsewhere. The shared secret below is what closes this |

## Deployment-time configuration (never in the repo)

Set these in Cloudflare Pages → your project → **Settings → Environment
variables** (Production *and* Preview), encrypted:

| Variable | Value |
| --- | --- |
| `BACKEND_ORIGIN` | Your backend origin, e.g. `https://api.<your-backend-host>` |
| `BACKEND_INTERNAL_TOKEN` | `openssl rand -hex 32` (same value on the backend) |
| `PROXY_LINK_KEY` | `openssl rand -hex 32` (media shield key; optional — unset = shield off, site still works) |

Locally: copy `.dev.vars.example` → `.dev.vars` (gitignored) for
`wrangler pages dev`, and mirror `BACKEND_ORIGIN` into `.env` as
`VITE_BACKEND_ORIGIN` for the Vite dev proxy.

If `BACKEND_ORIGIN` is unset the proxy functions return `503
proxy_misconfigured` — they fail closed rather than guess.

## Rollout order (zero downtime)

1. **Backend: ship the check, inactive.** Add middleware that only
   enforces when its env var is present (snippet below). Deploy —
   nothing changes yet.
2. **Frontend: set `BACKEND_ORIGIN` + `BACKEND_INTERNAL_TOKEN`** in CF
   Pages and deploy. The proxy now sends `x-aniraku-internal` on every
   forwarded request. (Browsers can't send it themselves — it's added
   server-side from an encrypted env var.)
3. **Backend: set the same token** in the backend's env and redeploy.
   The middleware (already shipped in step 1) now requires it. From this
   moment, direct hits on the backend host get `403` — including from
   people who read this public repo.
4. **Verify:**
   ```sh
   # must 403 (locked)
   curl -s -o /dev/null -w '%{http_code}\n' https://<backend>/api/v1/servers
   # must 200 (site path unchanged for real visitors)
   curl -s -o /dev/null -w '%{http_code}\n' \
     -A "Mozilla/5.0" -H "Origin: https://www.aniraku.tech" \
     https://www.aniraku.tech/api/v1/servers
   ```

## Backend middleware snippet (Express)

```js
// require when configured; keep /health exempt for uptime monitors
const INTERNAL_TOKEN = process.env.BACKEND_INTERNAL_TOKEN;
app.use('/api/v1', (req, res, next) => {
  if (!INTERNAL_TOKEN) return next(); // inactive until Phase 3
  if (req.get('x-aniraku-internal') !== INTERNAL_TOKEN) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
});
```

Compare with `crypto.timingSafeEqual` if you want constant-time
comparison (low risk either way — the token is high-entropy random, not
a password a human chose).

## Media shield — hiding stream sources from the Network tab (PROXY_LINK_KEY)

With `PROXY_LINK_KEY` set, the Pages Function rewrites what the browser
sees (`shared/mediaShield.js`):

- **`POST /api/v1/stream` + `GET /api/v1/servers`** — every upstream media
  URL in the JSON is replaced with an opaque `/api/v1/proxy?k=<token>`
  link; the provider's required `Referer`/`User-Agent` headers are sealed
  INSIDE the token (AES-GCM, 6h TTL) and the visible `headers` fields are
  removed. Poster/cover CDNs (AniList/TMDB/…) are deliberately left alone.
- **Playlists (m3u8)** — served through the k-route or the legacy
  `?url=` passthrough — are rewritten so every segment, variant, key and
  subtitle URI becomes its own opaque token, resolved server-side.
- **The k-route is served by the function itself**: decrypt → fetch
  upstream with sealed headers → stream back (Range requests preserved).
  Forged or expired tokens get `404` with zero upstream calls.
- Every rewrite is best-effort: any failure returns the untouched
  response, so shielding can never break playback. Without the key the
  site behaves exactly as before.

Honest limits: the same-origin calls themselves (`/api/v1/…`) remain
visible in the Network tab — browsers always show requests they make, and
that cannot be changed. What this shield removes is every upstream
destination, provider header, and copyable media link. The backend still
sees raw URLs (it must, to fetch them); the browser never does. Full
server-side minting (backend returns already-opaque links) would close
the last gap — a follow-up if you want it.

## Belt-and-suspenders: Cloudflare WAF on the backend zone

On the `api.<host>` zone, add a WAF custom rule: **Block** when
`http.request.headers["x-aniraku-internal"] ne <token>` (the token lives
in the WAF expression, visible only to zone admins). This drops
token-less traffic at the edge before it ever reaches your backend
process, and covers the `x-aniraku-internal` header case even if the
backend app is ever exposed without its middleware.

Also enable, on the same zone: Bot Fight Mode / the managed "Block AI
Bots" toggle — the frontend `robots.txt` only binds polite crawlers.

## What this does NOT do (honest limits)

- A scraper that fully controls a TLS client can still replay the
  `Origin`/UA the proxy expects — that is what the token (Phase 3) and
  the backend rate limiting are for. The token is the part that matters:
  it is never browser-visible, so it cannot be replayed without breaking
  into your CF project or backend.
- Keep the AGPL frontend public with env-based config — see below.

## License note (AGPL-3.0)

AGPL-3.0 **supports** this design and no relicense is needed:
§13 (network source requirement) obligates you to offer the **source of
the covered work** — this repo, published, which now names no host and
holds no token. Production deployment values (origins, keys, tokens)
are runtime configuration, not source; AGPL does not require you to
publish them. The only route AGPL actually forbids is *un-publishing
the source while still serving the site publicly*. If you ever want
that route (private repo / anti-competitor), relicense first — the
repo's copyright is effectively single-holder, so a switch to a
source-available license (PolyForm Strict/Noncommercial, BSL 1.1) or a
permissive one (MIT/Apache-2.0) is legally clean — and then update the
"open-source" claims in `index.html` JSON-LD and `README.md` for
honesty.
