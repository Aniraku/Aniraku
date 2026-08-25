import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('..', import.meta.url)
const read = (relativePath) => readFile(new URL(relativePath, root), 'utf8')

const [app, seoHelper, indexHtml, animeHook, animeDetail, home] = await Promise.all([
  read('src/App.jsx'),
  read('public/seo.js'),
  read('index.html'),
  read('src/hooks/useAnime.js'),
  read('src/pages/AnimeDetail.jsx'),
  read('src/pages/Home.jsx'),
])

assert.match(app, /<Route path="\/" element={<Home\s*\/>}\s*\/>/)
assert.doesNotMatch(app, /path="\/home"/)
assert.doesNotMatch(seoHelper, /['"]\/home['"]/)
assert.doesNotMatch(indexHtml, /graphql\.anilist\.co/)

assert.doesNotMatch(animeHook, /ANIME_DETAIL_QUERY/)
assert.doesNotMatch(animeHook, /useAnimeEpisodes/)
assert.match(animeHook, /https:\/\/miruro-api-v3\.onrender\.com\/info/)
assert.match(animeHook, /\$\{MIRURO_INFO_BASE\}\/\$\{encodeURIComponent\(id\)\}/)
assert.doesNotMatch(animeHook, /RECOMMEND_QUERY/)
assert.match(animeDetail, /anime\?\.recommendations\?\.nodes/)
assert.match(animeDetail, /\$\{API_BASE\}\/api\/v1\/anime\/\$\{encodeURIComponent\(id\)\}\/episodes/)
assert.match(animeDetail, /Array\.isArray\(payload\) \? payload : payload\?\.episodes/)
assert.match(animeDetail, /https:\/\/miruro-api-v3\.onrender\.com\/anime/)
assert.match(animeDetail, /\$\{MIRURO_RELATIONS_BASE\}\/\$\{encodeURIComponent\(id\)\}\/relations/)
assert.match(animeDetail, /label: 'Relations'/)
assert.match(animeDetail, /Aniraku’s episode list is unavailable right now/)
assert.match(animeDetail, /Aniraku will not create a guessed episode list/)
assert.doesNotMatch(animeDetail, /MIRURO_EPISODES_BASE/)
assert.doesNotMatch(animeDetail, /payload\?\.providers/)
assert.doesNotMatch(animeDetail, /Array\.from\(\{ length: count \}/)
assert.match(home, /const unifiedTrending = useMemo/)
assert.match(home, /Trending now/)
assert.doesNotMatch(home, /Trending anime/)
assert.doesNotMatch(home, /Trending movies/)
assert.match(home, /\$\{API_BASE\}\/api\/v1\/anime\/\$\{bookmark\.id\}\/episodes/)
assert.doesNotMatch(home, /\/api\/v1\/miruro\/episodes/)

console.log('Canonical Home route and backend-only Anime Detail checks passed.')
