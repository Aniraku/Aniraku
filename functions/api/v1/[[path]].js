// Cloudflare Pages Function — same-origin API proxy + media shield.
//
// The client calls https://<site>/api/v1/* (same-origin); this function
// forwards the request to the real backend server-side. The backend host
// lives ONLY in deployment env vars (Cloudflare Pages → Settings →
// Environment variables, encrypted; `.dev.vars` locally) — the client
// bundle, the HTML, and the user's Network tab all show just the site's
// own domain.
//
// Before anything is forwarded, shared/apiGuard.js screens the request
// (scripted user-agents, cross-origin callers, casual scrape floods). See
// shared/apiGuard.js for the threat model and thresholds.
//
// Media shield (shared/mediaShield.js, enabled by PROXY_LINK_KEY):
//   • POST /api/v1/stream + GET /api/v1/servers JSON bodies are rewritten
//     in-flight — every upstream media URL becomes an opaque
//     `/api/v1/proxy?k=<token>` link (upstream URL + required provider
//     headers sealed inside, AES-GCM, TTL-limited), `headers` fields are
//     removed. The Network tab can no longer reveal where streams come
//     from.
//   • Playlists (m3u8) — served through either the k-route or the legacy
//     ?url= passthrough — are rewritten so every segment/variant/key URI
//     is itself an opaque link, resolved server-side.
//   • The k-route (/api/v1/proxy/k/<token>[/<rel-path>]) is served BY this
//     function: decrypt → fetch upstream with sealed headers → stream back.
//   • Every rewrite is best-effort: any failure returns the untouched
//     response, so shielding can never break playback.
//
// [[path]] = catch-all — everything else is forwarded verbatim.

import {
  guardApiRequest,
  scrubUpstreamHeaders,
} from '../../../shared/apiGuard.js';
import {
  K_PATH_RE,
  looksLikeJson,
  looksLikeM3u8,
  openK,
  shieldEnabled,
  shieldJsonText,
  shieldM3u8Text,
} from '../../../shared/mediaShield.js';

const SHIELDED_JSON_RE = /^\/api\/v1\/(stream|servers)$/;

function jsonResponse(status, code) {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function misconfigured() {
  return jsonResponse(503, 'proxy_misconfigured');
}

// Headers to keep when we replaced the body (its length changed, and fetch
// already decompressed any transfer encoding for us).
function rewrittenHeaders(upstream) {
  const out = new Headers();
  for (const [name, value] of upstream.headers) {
    if (
      name.toLowerCase() === 'content-length' ||
      name.toLowerCase() === 'content-encoding' ||
      name.toLowerCase() === 'transfer-encoding'
    ) {
      continue;
    }
    out.set(name, value);
  }
  scrubUpstreamHeaders(out);
  return out;
}

// Serve one opaque media link. `suffix` (everything after the token) is a
// relative path fragment — resolved server-side against the sealed
// upstream URL, so playlists can reference "sub/segment.ts" without ever
// exposing that path to the client.
async function serveK(token, suffix, request, env, origin) {
  const opened = await openK(token, env);
  if (!opened) return jsonResponse(404, 'link_expired');

  let target = opened.url;
  if (suffix) {
    try {
      target = new URL(suffix, new URL('.', opened.url)).href;
    } catch {
      // fall back to the sealed URL itself
    }
  }

  // FlixCloud masters are fetched by the BACKEND, never from the edge.
  // Two hard reasons: their master URLs embed a JWT bound to the backend's
  // egress IP (an edge fetch fails the CDN's client_ip check with 403), and
  // every flixcloud m3u8 body is wrapped in base64(XOR(_, pk)) which only
  // the backend unwraps — served raw, ExoPlayer cannot even parse it. The
  // backend's k-route accepts the SAME token format (shared key), fetches
  // from its own IP, unwraps and rewrites, and this function then shields
  // the result like any other playlist.
  const targetHost = safeHostname(target);
  // FlixCloud masters are fetched by the BACKEND, never from the edge.
  // Two hard reasons: their master URLs embed a JWT bound to the backend's
  // egress IP (an edge fetch fails the CDN's client_ip check with 403), and
  // every flixcloud m3u8 body is wrapped in base64(XOR(_, pk)) which only
  // the backend unwraps — served raw, the player cannot even parse it.
  if (!suffix && /(^|\.)flixcloud\.cc$/i.test(targetHost)) {
    return serveKViaBackend(
      token,
      request,
      env,
      origin,
      target,
      opened,
      `/api/v1/proxy?k=${encodeURIComponent(token)}`,
    );
  }
  // Backend-rewritten child URIs (playlist variants, segments, keys) name
  // the backend host itself. Fetching them THROUGH the backend with the
  // internal header keeps one authenticated path; a bare edge fetch would
  // die at the backend's gate with 403 unauthorized client.
  const backendHost = safeHostname(env.BACKEND_ORIGIN || '');
  if (!suffix && backendHost && targetHost === backendHost) {
    const childUrl = new URL(target);
    return serveKViaBackend(
      token,
      request,
      env,
      origin,
      target,
      opened,
      `${childUrl.pathname}${childUrl.search}`,
    );
  }


  // Range/I-Range keep video seeking working; sealed provider headers
  // (Referer / User-Agent / …) are required by the upstream host.
  const headers = {};
  for (const name of ['range', 'if-range', 'accept', 'accept-language']) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  Object.assign(headers, opened.headers);

  const upstream = await fetch(target, { headers, redirect: 'follow' });
  const contentType = (
    upstream.headers.get('content-type') || ''
  ).toLowerCase();
  const pathOnly = target.split(/[?#]/)[0].toLowerCase();

  if (contentType.includes('mpegurl') || pathOnly.endsWith('.m3u8')) {
    const text = await upstream.text();
    try {
      const shielded = await shieldM3u8Text(
        text,
        env,
        origin,
        target,
        opened.headers,
      );
      return new Response(shielded, {
        status: upstream.status,
        headers: rewrittenHeaders(upstream),
      });
    } catch {
      return new Response(text, {
        status: upstream.status,
        headers: rewrittenHeaders(upstream),
      });
    }
  }

  const out = new Response(upstream.body, upstream);
  scrubUpstreamHeaders(out.headers);
  return out;
}

// Fetch a k-token through the backend's own k-route (the backend egresses
// from its own IP and runs its provider-side unwraps), then shield the
// playlist exactly like a direct fetch. There is no working direct-edge
// fallback for these hosts, so a backend failure answers 502 cleanly.
async function serveKViaBackend(token, request, env, origin, target, opened, backendPathAndQuery) {
  const backendOrigin = (env.BACKEND_ORIGIN || '').replace(/\/+$/, '');
  if (backendOrigin && backendPathAndQuery) {
    try {
      const headers = { 'x-aniraku-internal': env.BACKEND_INTERNAL_TOKEN || '' };
      for (const name of ['range', 'if-range', 'accept', 'accept-language']) {
        const value = request.headers.get(name);
        if (value) headers[name] = value;
      }
      const backend = await fetch(`${backendOrigin}${backendPathAndQuery}`, {
        headers,
        redirect: 'follow',
      });
      const contentType = (
        backend.headers.get('content-type') || ''
      ).toLowerCase();
      if (
        contentType.includes('mpegurl') ||
        target.split(/[?#]/)[0].toLowerCase().endsWith('.m3u8')
      ) {
        const text = await backend.text();
        try {
          const shielded = await shieldM3u8Text(
            text,
            env,
            origin,
            target,
            opened.headers,
          );
          return new Response(shielded, {
            status: backend.status,
            headers: rewrittenHeaders(backend),
          });
        } catch {
          return new Response(text, {
            status: backend.status,
            headers: rewrittenHeaders(backend),
          });
        }
      }
      // Non-playlist (unexpected for flixcloud masters): stream it back.
      const out = new Response(backend.body, backend);
      scrubUpstreamHeaders(out.headers);
      return out;
    } catch {
      // fall through to nothing — the caller has no direct path left that
      // could succeed for flixcloud, so answer cleanly.
      return jsonResponse(502, 'upstream_rejected');
    }
  }
  return null;
}

function safeHostname(u) {
  try {
    return new URL(u).hostname;
  } catch {
    return '';
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const backendOrigin = (env.BACKEND_ORIGIN || '').replace(/\/+$/, '');
  // Fail closed: a deploy without the env var must not silently fall back
  // to anything browser- or repo-visible.
  if (!backendOrigin) return misconfigured();

  // Anti-tracing gate: blocks scripted/cross-origin/flood clients BEFORE
  // any upstream request is made (rejected callers learn nothing about the
  // backend and cost it nothing).
  const blocked = guardApiRequest(request, url);
  if (blocked) return blocked;

  const origin = url.origin;
  const shielding = shieldEnabled(env);

  // --- opaque media route -----------------------------------------------
  // Two spellings are served identically: the path form
  // /api/v1/proxy/k/<token>[/<rel-path>] and the query form ?k=<token>
  // (the client's existing proxy-link skip-check matches the query form).
  const km = url.pathname.match(K_PATH_RE);
  if (km) return serveK(km[1], km[2], request, env, origin);
  if (url.pathname === '/api/v1/proxy') {
    const qk = url.searchParams.get('k');
    if (qk) return serveK(qk, null, request, env, origin);
  }

  // --- shielded JSON endpoints (/stream, /servers) -----------------------
  if (shielding && SHIELDED_JSON_RE.test(url.pathname)) {
    const response = await fetch(
      `${backendOrigin}${url.pathname}${url.search}`,
      forwarded(request, env),
    );
    const contentType = (
      response.headers.get('content-type') || ''
    ).toLowerCase();
    if (
      !contentType.startsWith('application/json') &&
      !contentType.startsWith('text/')
    ) {
      const out = new Response(response.body, response);
      scrubUpstreamHeaders(out.headers);
      return out;
    }
    const text = await response.text();
    let body = text;
    try {
      if (looksLikeJson(body)) body = await shieldJsonText(body, env, origin);
    } catch {
      body = text; // never let the shield break playback
    }
    return new Response(body, {
      status: response.status,
      headers: rewrittenHeaders(response),
    });
  }

  // --- legacy media proxy passthrough (backend does the fetching) --------
  // Playlists are rewritten so segment URIs don't leak the upstream host;
  // the client's &headers=<json> param is sealed into the minted tokens.
  if (shielding && url.pathname.startsWith('/api/v1/proxy')) {
    const rawUrl = url.searchParams.get('url') || '';
    let sealedHeaders = null;
    try {
      sealedHeaders = JSON.parse(url.searchParams.get('headers') || 'null');
    } catch {
      sealedHeaders = null;
    }
    const pathOnly = rawUrl.split(/[?#]/)[0].toLowerCase();
    const maybePlaylist = pathOnly.endsWith('.m3u8') || sealedHeaders !== null;

    const response = await fetch(
      `${backendOrigin}${url.pathname}${url.search}`,
      forwarded(request, env),
    );
    const out = new Response(response.body, response);
    scrubUpstreamHeaders(out.headers);

    if (!maybePlaylist) return out;
    const text = await out.clone().text();
    if (!looksLikeM3u8(text)) return out;
    try {
      const shielded = await shieldM3u8Text(
        text,
        env,
        origin,
        rawUrl,
        sealedHeaders,
      );
      return new Response(shielded, {
        status: response.status,
        headers: rewrittenHeaders(response),
      });
    } catch {
      return out; // untouched passthrough
    }
  }

  // --- everything else: verbatim ------------------------------------------
  const response = await fetch(
    `${backendOrigin}${url.pathname}${url.search}`,
    forwarded(request, env),
  );
  const out = new Response(response.body, response);
  scrubUpstreamHeaders(out.headers);
  return out;
}

// A Host header mismatch would break the backend's routing — delete it and
// let fetch set the destination's own Host. The client's Origin points at
// the site; the backend's CORS layer expects the site origin — keep it.
function forwarded(request, env) {
  const forwarded = new Request(request.url, request);
  forwarded.headers.delete('host');
  // Shared-secret proof-of-provenance: browsers CANNOT get this header
  // (it is added here, server-side, from an encrypted env var), so once
  // the backend enforces it, direct hits on the backend host — including
  // from people who read this public repo — die at the backend.
  if (env.BACKEND_INTERNAL_TOKEN) {
    forwarded.headers.set('x-aniraku-internal', env.BACKEND_INTERNAL_TOKEN);
  }
  return forwarded;
}
