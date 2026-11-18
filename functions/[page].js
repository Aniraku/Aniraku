// Cloudflare Pages Function — server-side SEO for single-segment static
// routes (/trending, /schedule, /faq, /about, and the legal pages).
//
// Completes the /info + /watch head-injection pattern: those two cover the
// dynamic catalog surfaces, but first-fetch crawlers and JS-less AI agents
// still saw the generic homepage head on every static route. This function
// matches ONLY one-segment paths ([page] dynamic route); multi-segment
// paths (/assets/*, /info/*, /watch/*, /api/*, /sitemaps/…) never hit it.
//
// Titles/descriptions are byte-identical to each page's useSeo call, so the
// served head and the hydrated DOM never disagree. Any path not in the
// table falls through with context.next() — static assets (favicon,
// manifest, robots.txt, llms.txt, bundles) keep their normal pipeline, and
// unknown routes continue to the `/* /index.html 200` rewrite.

const SITE_URL = 'https://www.aniraku.tech';

// path (no trailing slash) → title + description + og:image override
// (undefined = keep the template's og-image.png).
const PAGES = {
  '/trending': {
    title: 'Trending Anime — Most Popular This Season | Aniraku',
    description:
      'Browse the top trending anime by season and year on Aniraku. Discover the most popular airing, upcoming, and classic titles — watch online free in HD with subtitles and dubs.',
  },
  '/schedule': {
    title: 'Anime Schedule — Airing Calendar | Aniraku',
    description:
      'Check the latest anime airing schedule on Aniraku. Find out what anime episodes are airing today and this season.',
  },
  '/faq': {
    title: 'Frequently Asked Questions — Aniraku',
    description:
      'Answers to common questions about Aniraku: what it is, whether it is free and safe, English sub and dub support, where the data comes from, devices, privacy and how to report a broken video.',
  },
  '/about': {
    title: 'About Aniraku — Open-Source Anime Streaming',
    description:
      'What Aniraku is, how it works, and the open-source project behind it. A free anime streaming client powered by AniList metadata.',
  },
  '/privacy': {
    title: 'Privacy Policy | Aniraku',
    description:
      'Privacy policy for Aniraku — what information the client may handle, why it is needed, which parts stay in your browser, and the choices you have.',
  },
  '/terms': {
    title: 'Terms of Service | Aniraku',
    description:
      'Terms of service for Aniraku — how the open-source anime client, account features, community tools, and third-party metadata sources fit together.',
  },
  '/dmca': {
    title: 'Copyright & DMCA Notices | Aniraku',
    description:
      'Copyright and DMCA notices for Aniraku — how to submit a copyright concern or community-content report, and how reviews and counter-notices work.',
  },
  '/license': {
    title: 'AGPL-3.0 License | Aniraku',
    description:
      'Aniraku is free software under the GNU AGPL-3.0 — what the license permits, how network use applies, and third-party notices.',
  },
  '/community-guidelines': {
    title: 'Community Guidelines | Aniraku',
    description:
      'Community guidelines for Aniraku — how to take part in comments, replies, profiles, and ratings, what is not allowed, and how reports work.',
  },
};

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// JSON inside <script> — escape "<" so "</script>" can never terminate it.
const ld = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

// Replace the first match, or append the tag before </head> when the
// deployed template lacks it. The () => tag form avoids $-pattern
// interpretation in title strings.
const upsert = (html, pattern, tag) =>
  pattern.test(html) ? html.replace(pattern, () => tag) : html.replace('</head>', () => `  ${tag}\n  </head>`);

const SECURITY_HEADERS = [
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
];

// Pages does not apply `_headers` to a Pages Function response, so the
// function must copy the template's security headers itself.
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

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // One segment, no trailing slash; never a dot-path (assets) — the
  // [page] route shape already guarantees this, checked defensively.
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const meta = PAGES[path];
  if (!meta || path.includes('.')) return next();

  let html;
  let templateHeaders = null;
  try {
    const res = await env.ASSETS.fetch(new URL('/index.html', url.origin));
    if (!res.ok) return next();
    templateHeaders = res.headers;
    html = await res.text();
  } catch {
    return next();
  }

  const title = meta.title;
  const pageLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      url: `${SITE_URL}${path}`,
      description: meta.description,
      isPartOf: { '@type': 'WebSite', name: 'Aniraku', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: title.split(' — ')[0].split(' | ')[0],
          item: `${SITE_URL}${path}`,
        },
      ],
    },
  ];

  html = upsert(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = upsert(html, /<meta\s+name="title"\s+content="[^"]*"\s*\/?>/, `<meta name="title" content="${esc(title)}" />`);
  html = upsert(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(meta.description)}" />`);
  html = upsert(html, /<meta\s+property="og:type"[\s\S]*?\/>/, `<meta property="og:type" content="website" />`);
  html = upsert(html, /<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = upsert(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(meta.description)}" />`);
  html = upsert(html, /<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  html = upsert(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${esc(meta.description)}" />`);

  // Canonical + og:url + JSON-LD appended (the template never carries
  // per-route values).
  const inject =
    `  <link rel="canonical" href="${esc(`${SITE_URL}${path}`)}" />\n` +
    `  <meta property="og:url" content="${esc(`${SITE_URL}${path}`)}" />\n` +
    pageLd
      .map((j) => `  <script type="application/ld+json">\n  ${ld(j)}\n  </script>`)
      .join('\n') +
    `\n  </head>`;
  html = html.replace('</head>', () => inject);

  return new Response(html, { status: 200, headers: htmlHeaders(templateHeaders) });
}
