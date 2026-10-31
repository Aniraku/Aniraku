// Cloudflare Pages Function — same-origin API proxy.
//
// The client calls https://<site>/api/v1/* (same-origin); this function
// forwards the request to the real backend server-side. The backend host
// lives ONLY here (server config, never served to browsers) — the client
// bundle, the HTML, and the user's Network tab all show just the site's
// own domain.
//
// [[path]] = catch-all: /api/v1/anime/154587/track, /api/v1/stream (POST),
// /api/v1/proxy?... (Range requests for media) — everything is forwarded
// verbatim: method, headers, body, and the response streams straight back.

const BACKEND_ORIGIN = 'https://api.aniraku.tech';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = `${BACKEND_ORIGIN}${url.pathname}${url.search}`;

  const forwarded = new Request(target, request);
  // A Host header mismatch would break the backend's routing — delete it
  // and let fetch set the destination's own Host.
  forwarded.headers.delete('host');
  // The client's Origin points at the site; the backend's CORS layer
  // expects the site origin — keep it as-is (it already is).

  const response = await fetch(forwarded);

  // Same-origin request → no CORS headers needed, but the backend may
  // include them; pass everything through untouched.
  const out = new Response(response.body, response);
  out.headers.set('x-aniraku-proxy', 'pages-function');
  return out;
}
