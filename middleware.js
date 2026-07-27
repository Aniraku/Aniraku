const BACKEND = 'https://aniraku-backend.onrender.com'
const SITE = 'https://aniraku.vercel.app'
const FALLBACK_IMAGE = `${SITE}/favicon.svg`

const BOT_RE = /bot|crawler|spider|googlebot|bingbot|yandex|facebookexternalhit|twitterbot|whatsapp|linkedin|slack|telegram|discord|pinterest|slurp|duckduckbot|baiduspider|youtube|embedly|preview|headless|ia_archiver|applebot|curl|wget|validator|facebook|twitter/i

function htmlShell({ title, description, image, url, type }) {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<link rel="canonical" href="${url}"/>
<meta property="og:type" content="${type}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:image" content="${image}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:locale" content="en_US"/>
<meta property="og:site_name" content="Aniraku"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:url" content="${url}"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${description}"/>
<meta name="twitter:image" content="${image}"/>
<meta name="twitter:site" content="@sho_islam0311"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"${title}","description":"${description}","url":"${url}","image":"${image}"}</script>
<script>location.href="${url}"</script>
</head><body><h1>${title}</h1><p>${description}</p></body></html>`
}

function escape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, ' ')
}

async function fetchAnime(id) {
  const res = await fetch(`${BACKEND}/api/v1/anime/${id}`, {
    headers: { 'User-Agent': 'AnirakuBot/1.0' }
  })
  if (!res.ok) return null
  return res.json()
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  if (!BOT_RE.test(ua)) return

  const url = new URL(request.url)
  const path = url.pathname

  // /anime/:id
  let m = path.match(/^\/anime\/(\d+)$/)
  if (m) {
    const anime = await fetchAnime(m[1])
    if (anime) {
      const title = escape(anime.title?.english || anime.title?.romaji || anime.title?.userPreferred || `Anime #${m[1]}`)
      const rawDesc = (anime.description || '').replace(/<[^>]*>/g, '').slice(0, 320)
      const desc = escape(rawDesc || `Watch ${title} online — Sub & Dub available.`)
      const image = escape(anime.coverImage?.large || anime.coverImage?.extraLarge || FALLBACK_IMAGE)
      return new Response(htmlShell({ title: `${title} | Aniraku`, description: desc, image, url: `${SITE}/anime/${m[1]}`, type: 'website' }), {
        headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'public,max-age=3600,s-maxage=3600' }
      })
    }
  }

  // /watch/:animeName-episode-:ep
  m = path.match(/^\/watch\/(\d+)-episode-(\d+)$/)
  if (m) {
    const anime = await fetchAnime(m[1])
    if (anime) {
      const ep = m[2]
      const title = escape(anime.title?.english || anime.title?.romaji || anime.title?.userPreferred || `Anime #${m[1]}`)
      const rawDesc = (anime.description || '').replace(/<[^>]*>/g, '').slice(0, 320)
      const desc = escape(rawDesc || `Watch ${title} Episode ${ep} online — Sub & Dub available.`)
      const image = escape(anime.coverImage?.large || anime.coverImage?.extraLarge || FALLBACK_IMAGE)
      return new Response(htmlShell({ title: `${title} — Episode ${ep} | Aniraku`, description: desc, image, url: `${SITE}/watch/${m[1]}-episode-${ep}`, type: 'video.episode' }), {
        headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'public,max-age=3600,s-maxage=3600' }
      })
    }
  }
}
