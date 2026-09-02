import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('..', import.meta.url)
const read = (relativePath) => readFile(new URL(relativePath, root), 'utf8')

const [app, seoHelper, indexHtml, animeHook, animeDetail, home, middleware, sitemap, config] = await Promise.all([
  read('src/App.jsx'),
  read('public/seo.js'),
  read('index.html'),
  read('src/hooks/useAnime.js'),
  read('src/pages/AnimeDetail.jsx'),
  read('src/pages/Home.jsx'),
  read('middleware.js'),
  read('scripts/generate-sitemap.js'),
  read('src/config.js'),
])

assert.match(app, /<Route path="\/" element={<Home\s*\/>}\s*\/>/)
assert.doesNotMatch(app, /path="\/home"/)
assert.doesNotMatch(seoHelper, /['"]\/home['"]/)
assert.doesNotMatch(indexHtml, /graphql\.anilist\.co/)

assert.match(animeHook, /anilistQuery\(ANIME_DETAIL_QUERY, \{ id: Number\(id\) \}\)/)
assert.doesNotMatch(animeHook, /useAnimeEpisodes/)
assert.doesNotMatch(animeHook, /miruro-api-v3\.onrender\.com/)
assert.doesNotMatch(animeHook, /MIRURO_INFO_BASE/)
assert.doesNotMatch(animeHook, /RECOMMEND_QUERY/)
assert.match(animeDetail, /anime\?\.recommendations\?\.nodes/)
assert.match(animeDetail, /fetchAnimeEpisodes\(id, \{ signal: controller\.signal \}\)/)
assert.match(animeDetail, /thumbnail: episode\.thumbnail \|\| episode\.image \|\| ''/)
assert.match(middleware, /https:\/\/graphql\.anilist\.co/)
assert.match(middleware, /ANIME_SEO_QUERY/)
assert.doesNotMatch(middleware, /api\.aniraku\.tech\/api\/v1\/anime/)
assert.match(sitemap, /const ANILIST_ENDPOINT = 'https:\/\/graphql\.anilist\.co'/)
assert.doesNotMatch(sitemap, /ANILIST_PROXY|api\.aniraku\.tech\/api\/v1\/anilist/)
assert.match(config, /configuredApiBase/)
assert.match(config, /window\.location\.protocol === 'https:'/)
assert.match(config, /secureApiBase/)
assert.match(config, /configuredApiBase\.replace\(/)
assert.doesNotMatch(animeDetail, /miruro-api-v3\.onrender\.com/)
assert.match(animeDetail, /label: 'Relations'/)
assert.match(animeDetail, /const EPISODE_RETRY_BASE_MS = 1_500/)
assert.match(animeDetail, /retryTimer = window\.setTimeout\(loadEpisodes, delay\)/)
assert.doesNotMatch(animeDetail, /MIRURO_EPISODES_BASE/)
assert.doesNotMatch(animeDetail, /payload\?\.providers/)
assert.doesNotMatch(animeDetail, /episodesFallback/)
assert.doesNotMatch(animeDetail, /episode list is unavailable right now/)
assert.doesNotMatch(animeDetail, /Array\.from\(\{ length: count \}/)
assert.match(home, /const heroItems = useMemo/)
assert.match(home, /const freshAiring = useMemo/)
assert.match(home, /retain stable item order and identity/)
assert.match(home, /fetchAnimeEpisodes\(bookmark\.id\)/)
assert.doesNotMatch(home, /\/api\/v1\/miruro\/episodes/)

console.log('Canonical Home, direct AniList SEO, and backend episode-contract checks passed.')
