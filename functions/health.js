// Cloudflare Pages Function — /health passthrough (status pages, monitors).

// Backend origin is a deployment-time secret (Cloudflare Pages env var,
// encrypted; `.dev.vars` locally) — never a literal in this public repo.
// See docs/backend-api-lockdown.md. Fail closed when unset.
export async function onRequest(context) {
  const backendOrigin = (context.env.BACKEND_ORIGIN || '').replace(
    /\/+$/,
    '',
  );
  if (!backendOrigin) {
    return new Response(JSON.stringify({ error: 'proxy_misconfigured' }), {
      status: 503,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  const url = new URL(context.request.url);
  const headers = new Headers({ Accept: 'application/json' });
  // The backend's edge rejects requests without a browser UA. Health is for
  // status pages and uptime monitors, which often run curl or send no UA, so
  // present one here rather than forwarding a UA the backend will reject.
  headers.set(
    'user-agent',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  );
  if (context.env.BACKEND_INTERNAL_TOKEN) {
    headers.set('x-aniraku-internal', context.env.BACKEND_INTERNAL_TOKEN);
  }
  return fetch(`${backendOrigin}${url.pathname}${url.search}`, { headers });
}