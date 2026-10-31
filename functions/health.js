// Cloudflare Pages Function — /health passthrough (status pages, monitors).

const BACKEND_ORIGIN = 'https://api.aniraku.tech';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  return fetch(`${BACKEND_ORIGIN}${url.pathname}${url.search}`, {
    headers: { Accept: 'application/json' },
  });
}
