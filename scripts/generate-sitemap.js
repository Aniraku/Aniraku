import fs from 'fs'
import path from 'path'

const API = 'https://aniraku-backend.onrender.com/api/v1'
const SITE = 'https://aniraku.vercel.app'
const OUTPUT = path.resolve('public/sitemap.xml')
const PER_PAGE = 50
const MAX_RETRIES = 3

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
    console.error('Could not fetch first page. Backend may be waking up. Using static routes only.')
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

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildSitemap(media) {
  const seen = new Set()
  const urls = []
  const today = new Date().toISOString().slice(0, 10)

  urls.push(`  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`)
  urls.push(`  <url><loc>${SITE}/catalog</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`)
  urls.push(`  <url><loc>${SITE}/schedule</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`)

  const staticPages = [
    { path: '/privacy', freq: 'monthly', priority: '0.3' },
    { path: '/terms', freq: 'monthly', priority: '0.3' },
    { path: '/dmca', freq: 'monthly', priority: '0.3' },
    { path: '/license', freq: 'yearly', priority: '0.2' },
  ]
  for (const p of staticPages) {
    urls.push(`  <url><loc>${SITE}${p.path}</loc><lastmod>${today}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`)
  }

  for (const item of media) {
    if (!item.id || seen.has(item.id)) continue
    seen.add(item.id)
    urls.push(`  <url><loc>${SITE}/anime/${item.id}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`
}

console.log(`Fetching anime catalog from ${API}/browse ...`)
const media = await fetchAllPages()
console.log(`Fetched ${media.length} anime entries`)

const xml = buildSitemap(media)
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
fs.writeFileSync(OUTPUT, xml, 'utf-8')
console.log(`Wrote ${OUTPUT} (${xml.length} bytes, ${media.length} anime pages)`)
