// Cloudflare Pages Function — server-side SEO for /info/* pages.
//
// The SPA serves one generic index.html for every URL, so Search Console
// piled up Soft 404s (dead ids), "Alternate page with proper canonical tag"
// (client canonical /info/{id} without slug), and Crawled-not-indexed on
// 23K identical JS-only pages. This function runs before the
// `/* /index.html 200` rewrite (same mechanism as functions/api/v1) and
// rewrites the SPA template's head for each /info URL.
//
// Slug form: byte-exact port of src/hooks/useApi.ts animeSlug() — that is
// what scripts/generate-sitemap.mjs emits, so canonical == sitemap URL.
// Other link helpers (utils/animePaths slugify) produce variant slugs;
// the 301 below consolidates them onto this canonical form.

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
    genres
    startDate { year month day }
    endDate { year month day }
  }
}`;

// GraphQL Int upper bound — larger ids can never exist.
const MAX_INT = 2147483647;

// Byte-exact port of src/hooks/useApi.ts animeSlug() (sitemap algorithm).
function animeSlug(title, fallback = 'anime') {
  const raw = title?.english || title?.romaji || fallback;
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// JSON inside <script> — escape "<" so "</script>" can never terminate it.
const ld = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

// Port of Info.tsx sanitizeText + metaDescription (tags, parentheticals,
// common entities; collapse whitespace; truncate to 154).
const metaDescription = (html) => {
  const text = (typeof html === 'string' ? html : '')
    .replace(/<[^>]+>/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 154 ? `${text.slice(0, 154)}…` : text;
};

// Port of Info.tsx seoDate.
const dateFmt = (d) =>
  d?.year && d.month && d.day
    ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
    : '';

// Replace the first match, or append the tag before </head> when the
// deployed template lacks it (template may drift from this repo's copy).
// The () => tag form avoids $-pattern interpretation in user titles.
const upsert = (html, pattern, tag) =>
  pattern.test(html) ? html.replace(pattern, () => tag) : html.replace('</head>', `  ${tag}\n  </head>`);

const HTML = { 'content-type': 'text/html;charset=UTF-8' };

function notFoundPage() {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
      `<title>Not Found — Aniraku</title>` +
      `<meta name="robots" content="noindex, nofollow">` +
      `</head><body><p>Page not found. <a href="https://www.aniraku.tech/">Go to Aniraku</a></p></body></html>`,
    { status: 404, headers: { ...HTML, 'cache-control': 'public, max-age=3600' } },
  );
}

function htmlPage(html, status = 200) {
  return new Response(html, {
    status,
    headers: { ...HTML, 'cache-control': 'public, max-age=3600' },
  });
}

async function getTemplate(env, url) {
  try {
    const res = await env.ASSETS.fetch(new URL('/index.html', url.origin));
    if (res.ok) return await res.text();
  } catch {
    // fall through to the minimal page below
  }
  return null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/info\/(\d+)(?:\/([^/]*))?\/?$/);
  if (!match || Number(match[1]) > MAX_INT) return notFoundPage();

  const id = Number(match[1]);
  const slugIn = match[2] || '';

  let media = null; // AniList answer (null = id does not exist)
  let failed = false; // AniList unreachable / rate-limited
  try {
    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { id } }),
    });
    // AniList answers a nonexistent id with HTTP 404 (data.Media: null) —
    // that is definitive, not an outage; only other failures degrade.
    if (res.ok) media = (await res.json())?.data?.Media ?? null;
    else if (res.status === 404) media = null;
    else failed = true;
  } catch {
    failed = true;
  }

  // AniList outage → degrade to the old behavior: serve the SPA shell.
  // Google renders the client app; indexing waits for a healthy re-crawl.
  if (failed) {
    const html = await getTemplate(env, url);
    return html
      ? htmlPage(html)
      : htmlPage(
          `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Aniraku</title></head><body><p>Loading…</p></body></html>`,
        );
  }

  if (!media) return notFoundPage();

  const slug = animeSlug(media.title);
  const title = media.title.english || media.title.romaji || 'No Title';

  // Hentai titles sit behind the client's mature-content gate → noindex.
  const nsfw = (media.genres || []).includes('Hentai');

  // Wrong, missing, or trailing-slash slug → consolidate onto the
  // sitemap-form URL. Client-side SPA navigation is unaffected; only
  // direct URL loads (Googlebot) are redirected.
  if (slugIn !== slug) {
    return new Response(null, {
      status: 301,
      headers: {
        location: `${url.origin}/info/${media.id}/${slug}`,
        'cache-control': 'public, max-age=86400',
      },
    });
  }

  const canonical = `${SITE_URL}/info/${media.id}/${slug}`;
  const format = media.format || 'TV';
  const image = `https://img.anili.st/media/${media.id}`;
  const plot = metaDescription(media.description);
  const docTitle = `${title} — Watch ${format} Online Free | Aniraku`;
  const desc = `Watch ${title} online for free on Aniraku. ${format}${
    media.episodes ? ` · ${media.episodes} episodes` : ''
  }${media.genres?.length ? ` · ${media.genres.join(', ')}` : ''}. Stream in HD with subtitles and dub.`;

  // Mirrors Info.tsx useSeo JSON-LD (TVSeries|Movie + breadcrumb).
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': format === 'MOVIE' ? 'Movie' : 'TVSeries',
      name: title,
      url: canonical,
      description: plot || `Watch ${title} online for free on Aniraku.`,
      image,
      genre: media.genres || [],
      startDate: dateFmt(media.startDate),
      endDate: dateFmt(media.endDate),
      numberOfEpisodes: media.episodes || 0,
      inLanguage: 'Japanese',
      contentRating: 'PG-13',
      provider: { '@type': 'Organization', name: 'Aniraku', url: SITE_URL },
      isPartOf: { '@type': 'WebSite', name: 'Aniraku', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Search', item: `${SITE_URL}/search` },
        { '@type': 'ListItem', position: 3, name: title, item: canonical },
      ],
    },
  ];

  let html = await getTemplate(env, url);
  if (!html) return notFoundPage(); // broken deployment — don't fake 200

  html = upsert(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(docTitle)}</title>`);
  html = upsert(html, /<meta\s+name="title"\s+content="[^"]*"\s*\/?>/, `<meta name="title" content="${esc(docTitle)}" />`);
  html = upsert(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(desc)}" />`);
  html = upsert(html, /<meta\s+name="keywords"[\s\S]*?\/>/, `<meta name="keywords" content="${esc(`${title}, watch ${title}, ${title} streaming, ${title} online free, ${title} sub, ${title} dub, ${format} anime, ${media.genres?.join(', ') || ''}, anime streaming, aniraku`)}" />`);

  if (nsfw) {
    html = upsert(html, /<meta\s+name="robots"[\s\S]*?\/>/, `<meta name="robots" content="noindex, nofollow" />`);
    html = upsert(html, /<meta\s+name="googlebot"[\s\S]*?\/>/, `<meta name="googlebot" content="noindex, nofollow" />`);
  }

  html = upsert(html, /<meta\s+property="og:type"[\s\S]*?\/>/, `<meta property="og:type" content="video.tv_show" />`);
  html = upsert(html, /<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = upsert(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(plot || desc)}" />`);
  html = upsert(html, /<meta\s+property="og:image"[\s\S]*?\/>/, `<meta property="og:image" content="${esc(image)}" />`);
  html = upsert(html, /<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  html = upsert(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${esc(plot || desc)}" />`);

  // Canonical + og:url don't exist in the template → always appended.
  const inject =
    `  <link rel="canonical" href="${esc(canonical)}" />\n` +
    `  <meta property="og:url" content="${esc(canonical)}" />\n` +
    jsonLd
      .map((j) => `  <script type="application/ld+json">\n  ${ld(j)}\n  </script>`)
      .join('\n') +
    `\n  </head>`;
  html = html.replace('</head>', inject);

  return htmlPage(html);
}
