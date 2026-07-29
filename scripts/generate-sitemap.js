import fs from 'fs'
import path from 'path'

const API = 'https://aniraku-backend.onrender.com/api/v1'
const SITE = 'https://aniraku.vercel.app'
const OUT_DIR = path.resolve('public')
const PER_PAGE = 50
const MAX_RETRIES = 3
const CHUNK_SIZE = 1000

const STATIC_URLS = [
  { loc: '/', freq: 'daily', priority: '1.0' },
  { loc: '/home', freq: 'daily', priority: '0.95' },
  { loc: '/catalog', freq: 'daily', priority: '0.8' },
  { loc: '/schedule', freq: 'weekly', priority: '0.7' },
  { loc: '/top-airing', freq: 'daily', priority: '0.75' },
  { loc: '/most-popular', freq: 'daily', priority: '0.75' },
  { loc: '/movies', freq: 'daily', priority: '0.7' },
  { loc: '/tv-series', freq: 'daily', priority: '0.7' },
  { loc: '/random', freq: 'monthly', priority: '0.3' },
  { loc: '/privacy', freq: 'monthly', priority: '0.3' },
  { loc: '/terms', freq: 'monthly', priority: '0.3' },
  { loc: '/dmca', freq: 'monthly', priority: '0.3' },
  { loc: '/license', freq: 'yearly', priority: '0.2' },
]

// Genre pages for SEO discovery
const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi',
  'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music',
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
  'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
]

const GENRE_URLS = GENRES.map(g => ({
  loc: `/catalog?genre=${encodeURIComponent(g)}`,
  freq: 'weekly',
  priority: '0.65',
}))

// Format/Status filtered pages
const FILTER_URLS = [
  { loc: '/catalog?format=MOVIE&sort=SCORE_DESC', freq: 'daily', priority: '0.7' },
  { loc: '/catalog?format=TV&sort=SCORE_DESC', freq: 'daily', priority: '0.7' },
  { loc: '/catalog?format=OVA&sort=SCORE_DESC', freq: 'weekly', priority: '0.5' },
  { loc: '/catalog?format=ONA&sort=SCORE_DESC', freq: 'weekly', priority: '0.5' },
  { loc: '/catalog?format=SPECIAL&sort=SCORE_DESC', freq: 'weekly', priority: '0.5' },
  { loc: '/catalog?status=RELEASING', freq: 'daily', priority: '0.7' },
  { loc: '/catalog?status=FINISHED', freq: 'weekly', priority: '0.6' },
  { loc: '/catalog?status=NOT_YET_RELEASED', freq: 'weekly', priority: '0.6' },
  { loc: '/catalog?sort=POPULARITY_DESC', freq: 'daily', priority: '0.75' },
  { loc: '/catalog?sort=SCORE_DESC', freq: 'daily', priority: '0.75' },
  { loc: '/catalog?sort=START_DATE_DESC', freq: 'daily', priority: '0.65' },
  { loc: '/catalog?sort=TITLE_ROMAJI', freq: 'weekly', priority: '0.4' },
]

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function urlEntry(loc, lastmod, freq, priority) {
  return `  <url><loc>${SITE}${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`
}

function writeSitemap(filePath, urls) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, xml, 'utf-8')
  return Buffer.byteLength(xml, 'utf-8')
}

function writeSitemapIndex(filePath, children) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children.join('\n')}
</sitemapindex>`
  fs.writeFileSync(filePath, xml, 'utf-8')
}

async function fetchPage(page) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30000)
      const res = await fetch(`${API}/browse?page=${page}&perPage=${PER_PAGE}&sort=POPULARITY_DESC`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AnirakuSitemap/1.0' }
      })
      clearTimeout(timer)
      if (res.ok) return res.json()
      if (attempt < MAX_RETRIES) {
        console.error(`  browse?page=${page} ${res.status}, retry ${attempt}/${MAX_RETRIES}...`)
        await new Promise(r => setTimeout(r, 3000 * attempt))
      } else {
        console.error(`  browse?page=${page} ${res.status} after ${MAX_RETRIES} attempts, skipping`)
        return null
      }
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.error(`  browse?page=${page} error: ${err.message}, retry ${attempt}/${MAX_RETRIES}...`)
        await new Promise(r => setTimeout(r, 3000 * attempt))
      } else {
        console.error(`  browse?page=${page} error: ${err.message} after ${MAX_RETRIES} attempts, skipping`)
        return null
      }
    }
  }
  return null
}

async function fetchAllPages() {
  const first = await fetchPage(1)
  if (!first || !first.media) {
    console.error('Could not fetch first page. Backend may be waking up.')
    return []
  }

  const media = [...first.media]
  const lastPage = first.pageInfo?.lastPage || 1
  console.log(`  page 1/${lastPage} — ${first.media.length} items, total ${first.pageInfo?.total || '?'}`)

  for (let page = 2; page <= lastPage; page++) {
    const data = await fetchPage(page)
    if (data && data.media) {
      media.push(...data.media)
    }
    if (page % 10 === 0) console.log(`  page ${page}/${lastPage} — ${media.length} items so far`)
  }

  return media
}

const today = new Date().toISOString().slice(0, 10)

console.log('Generating sitemaps...')
console.log(`Fetching anime catalog from ${API}/browse ...`)
const media = await fetchAllPages()
console.log(`Fetched ${media.length} anime entries`)

// Write static sitemap
const staticUrls = STATIC_URLS.map(u => urlEntry(u.loc, today, u.freq, u.priority))
const staticSize = writeSitemap(path.join(OUT_DIR, 'sitemaps', 'static.xml'), staticUrls)
console.log(`  sitemaps/static.xml — ${staticUrls.length} URLs, ${staticSize} bytes`)

// Write genre/filter sitemap
const genreUrls = [
  ...GENRE_URLS.map(u => urlEntry(u.loc, today, u.freq, u.priority)),
  ...FILTER_URLS.map(u => urlEntry(u.loc, today, u.freq, u.priority)),
]
const genreSize = writeSitemap(path.join(OUT_DIR, 'sitemaps', 'genres.xml'), genreUrls)
console.log(`  sitemaps/genres.xml — ${genreUrls.length} URLs, ${genreSize} bytes`)

// Write anime chunk sitemaps
const seen = new Set()
const uniqueMedia = media.filter(item => {
  if (!item.id || seen.has(item.id)) return false
  seen.add(item.id)
  return true
})

const chunks = []
for (let i = 0; i < uniqueMedia.length; i += CHUNK_SIZE) {
  chunks.push(uniqueMedia.slice(i, i + CHUNK_SIZE))
}

const childIndexes = [
  { loc: '/sitemaps/static.xml', lastmod: today },
  { loc: '/sitemaps/genres.xml', lastmod: today },
]

for (let i = 0; i < chunks.length; i++) {
  const name = `anime-${i + 1}.xml`
  const urls = chunks[i].map(item =>
    urlEntry(`/anime/${item.id}`, today, 'monthly', '0.6')
  )
  const size = writeSitemap(path.join(OUT_DIR, 'sitemaps', name), urls)
  console.log(`  sitemaps/${name} — ${urls.length} URLs, ${size} bytes`)
  childIndexes.push({ loc: `/sitemaps/${name}`, lastmod: today })
}

// Write sitemap index
const indexChildren = childIndexes.map(c =>
  `  <sitemap><loc>${SITE}${c.loc}</loc><lastmod>${c.lastmod}</lastmod></sitemap>`
)
writeSitemapIndex(path.join(OUT_DIR, 'sitemap.xml'), indexChildren)
console.log(`  sitemap.xml (index) — ${childIndexes.length} children`)
console.log(`Done. ${uniqueMedia.length} anime across ${chunks.length} chunk(s).`)
