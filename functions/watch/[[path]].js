// Cloudflare Pages Function — server-side SEO for /watch/* pages.
//
// Mirror of functions/info/[[path]].js for the /watch route surface: the SPA
// serves one generic index.html for every URL, so first-fetch crawlers and
// JS-less AI agents saw the homepage head on the site's largest URL group.
// This function rewrites the SPA template's head per /watch URL before the
// `/* /index.html 200` rewrite.
//
// Route shapes (src/App.tsx):
//   /watch/:animeId
//   /watch/:animeId/:slug
//   /watch/:animeId/:animeTitle/:episodeNumber
//   /watch/:animeId/:animeTitle/:episodeNumber/*
// Canonical mirrors the client (Watch.tsx useSeo canonicalPath = pathname):
// the incoming path minus any trailing slash — /watch has no slug-301 scheme.

const ANILIST_API = 'https://graphql.anilist.co';
const SITE_URL = 'https://www.aniraku.tech';

const QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { english romaji }
    description
    format
    episodes
    duration
    genres
    startDate { year month day }
  }
}`;

// GraphQL Int upper bound — larger ids can never exist.
const MAX_INT = 2147483647;

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// JSON inside <script> — escape "<" so "</script>" can never terminate it.
const ld = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

// Port of Info.tsx seoDate.
const dateFmt = (d) =>
  d?.year && d.month && d.day
    ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
    : '';

// Replace the first match, or append the tag before </head> when the
// deployed template lacks it. The () => tag form avoids $-pattern
// interpretation in user titles.
const upsert = (html, pattern, tag) =>
  pattern.test(html) ? html.replace(pattern, () => tag) : html.replace('</head>', () => `  ${tag}\n  </head>`);

const SECURITY_HEADERS = [
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
];

// Pages does not apply `_headers` to a Pages Function response, so copy the
// template's security headers onto the constructed HTML response.
function htmlHeaders(source) {
  const h = new Headers();
  for (const name of SECURITY_HEADERS) {
    const value = source?.get(name);
    if (value) h.set(name, value);
  }
  if (!h.has('content-security-policy'))
    h.set('content-security-policy', "default-src 'none'; frame-ancestors 'none'");
  if (!h.has('x-content-type-options')) h.set('x-content-type-options', 'nosniff');
  if (!h.has('x-frame-options')) h.set('x-frame-options', 'DENY');
  if (!h.has('referrer-policy')) h.set('referrer-policy', 'strict-origin-when-cross-origin');
  h.set('content-type', 'text/html;charset=UTF-8');
  h.set('cache-control', 'public, max-age=3600');
  return h;
}

function notFoundPage() {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
      `<title>Not Found — Aniraku</title>` +
      `<meta name="robots" content="noindex, nofollow">` +
      `</head><body><p>Page not found. <a href="https://www.aniraku.tech/">Go to Aniraku</a></p></body></html>`,
    { status: 404, headers: htmlHeaders() },
  );
}

function htmlPage(html, status = 200, source = null) {
  return new Response(html, { status, headers: htmlHeaders(source) });
}

async function getTemplate(env, url) {
  try {
    const res = await env.ASSETS.fetch(new URL('/index.html', url.origin));
    if (res.ok) return { html: await res.text(), headers: res.headers };
  } catch {
    // fall through to the minimal page below
  }
  return null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // /watch/{id}[/anything] — one id segment, optional trailing parts.
  const match = url.pathname.match(/^\/watch\/(\d+)(?:\/.*)?\/?$/);
  if (!match || Number(match[1]) > MAX_INT) return notFoundPage();

  const id = Number(match[1]);
  // Canonical = incoming path without a trailing slash (mirrors Watch.tsx
  // canonicalPath = location.pathname, which never carries a trailing slash).
  const canonical = `${SITE_URL}/watch/${id}${url.pathname.replace(/^\/watch\/\d+/, '').replace(/\/+$/, '')}`;

  let media = null; // AniList answer (null = id does not exist)
  let failed = false; // AniList unreachable / rate-limited
  try {
    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { id } }),
    });
    // AniList answers a nonexistent id with HTTP 404 (data.Media: null) —
    // definitive, not an outage; only other failures degrade.
    if (res.ok) media = (await res.json())?.data?.Media ?? null;
    else if (res.status === 404) media = null;
    else failed = true;
  } catch {
    failed = true;
  }

  // AniList outage → degrade to the old behavior: serve the SPA shell.
  // The client app renders and sets head tags after hydration.
  if (failed) {
    const template = await getTemplate(env, url);
    return template
      ? htmlPage(template.html, 200, template.headers)
      : htmlPage(
          `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Aniraku</title></head><body><p>Loading…</p></body></html>`,
        );
  }

  if (!media) return notFoundPage();

  const title = media.title.english || media.title.romaji || 'No Title';

  // Hentai titles sit behind the client's mature-content gate → noindex,
  // same policy as the /info function.
  const nsfw = (media.genres || []).includes('Hentai');

  // The client names unknown episode numbers "1" until an episode is chosen;
  // the server does the same so first-fetch and hydrated DOM agree.
  // Episode number from /watch/{id}/{title}/{episodeNumber} when present.
  const epMatch = url.pathname.match(/^\/watch\/\d+\/[^/]+\/(\d+)/);
  const epNum = epMatch ? Number(epMatch[1]) : 1;

  const image = `https://img.anili.st/media/${media.id}`;
  const docTitle = `Watch ${title} Episode ${epNum} Online Free — Aniraku`;
  const desc = `Watch ${title} Episode ${epNum} online for free on Aniraku. Stream in HD with subtitles and dub support.`;

  // Mirrors Watch.tsx useSeo JSON-LD (VideoObject + breadcrumb). Adds the
  // two fields Google's video rich-result spec expects that the client omits:
  // uploadDate (series start date is the best static proxy for episode 1;
  // omitted when AniList has no date) and a publisher with logo.
  const videoLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `${title} — Episode ${epNum}`,
    description: `Watch ${title} Episode ${epNum} online on Aniraku. Free anime streaming with subtitles and dub support.`,
    thumbnailUrl: [image],
    uploadDate: dateFmt(media.startDate) || undefined,
    ...(media.duration ? { duration: `PT${media.duration}M` } : {}),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/WatchAction',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Aniraku',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` },
    },
    provider: {
      '@type': 'Organization',
      name: 'Aniraku',
      url: SITE_URL,
    },
    // Slug-consolidated series URL (the /info function 301s the bare-id form
    // onto /info/{id}/{slug}, so link the slug form's target).
    isPartOf: {
      '@type': 'TVSeries',
      name: title,
      url: `${SITE_URL}/info/${media.id}`,
    },
  };
  if (!videoLd.uploadDate) delete videoLd.uploadDate;

  const jsonLd = [
    videoLd,
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: title, item: `${SITE_URL}/info/${media.id}` },
        { '@type': 'ListItem', position: 3, name: `Episode ${epNum}`, item: canonical },
      ],
    },
  ];

  const template = await getTemplate(env, url);
  if (!template) return notFoundPage(); // broken deployment — don't fake 200
  let html = template.html;

  html = upsert(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(docTitle)}</title>`);
  html = upsert(html, /<meta\s+name="title"\s+content="[^"]*"\s*\/?>/, `<meta name="title" content="${esc(docTitle)}" />`);
  html = upsert(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(desc)}" />`);

  if (nsfw) {
    html = upsert(html, /<meta\s+name="robots"[\s\S]*?\/>/, `<meta name="robots" content="noindex, nofollow" />`);
    html = upsert(html, /<meta\s+name="googlebot"[\s\S]*?\/>/, `<meta name="googlebot" content="noindex, nofollow" />`);
  }

  html = upsert(html, /<meta\s+property="og:type"[\s\S]*?\/>/, `<meta property="og:type" content="video.episode" />`);
  html = upsert(html, /<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${esc(docTitle)}" />`);
  html = upsert(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(desc)}" />`);
  html = upsert(html, /<meta\s+property="og:image"[\s\S]*?\/>/, `<meta property="og:image" content="${esc(image)}" />`);
  html = upsert(html, /<meta\s+name="twitter:card"[\s\S]*?\/>/, `<meta name="twitter:card" content="summary_large_image" />`);
  html = upsert(html, /<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${esc(docTitle)}" />`);
  html = upsert(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${esc(desc)}" />`);
  html = upsert(html, /<meta\s+name="twitter:image"[\s\S]*?\/>/, `<meta name="twitter:image" content="${esc(image)}" />`);

  // Canonical + og:url + JSON-LD appended before </head> (the template never
  // carries per-route values, so the /info pattern of upsert-first does not
  // apply here).
  const inject =
    `  <link rel="canonical" href="${esc(canonical)}" />\n` +
    `  <meta property="og:url" content="${esc(canonical)}" />\n` +
    jsonLd
      .map((j) => `  <script type="application/ld+json">\n  ${ld(j)}\n  </script>`)
      .join('\n') +
    `\n  </head>`;
  html = html.replace('</head>', () => inject);

  return htmlPage(html, 200, template.headers);
}
