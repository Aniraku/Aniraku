import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('..', import.meta.url)
const read = (relativePath) => readFile(new URL(relativePath, root), 'utf8')

const [app, seoHelper, indexHtml, animeHook, animeDetail] = await Promise.all([
  read('src/App.jsx'),
  read('public/seo.js'),
  read('index.html'),
  read('src/hooks/useAnime.js'),
  read('src/pages/AnimeDetail.jsx'),
])

assert.match(app, /<Route path="\/" element={<Home\s*\/>}\s*\/>/)
assert.match(app, /<Route path="\/home" element={<Navigate to="\/" replace\s*\/>}\s*\/>/)
assert.match(seoHelper, /window\.location\.pathname === '\/home' \? '\/'/)
assert.doesNotMatch(indexHtml, /graphql\.anilist\.co/)

assert.doesNotMatch(animeHook, /ANIME_DETAIL_QUERY/)
assert.doesNotMatch(animeHook, /useAnimeEpisodes/)
assert.match(animeHook, /\/api\/v1\/anime\/\$\{encodeURIComponent\(id\)\}/)
assert.match(animeDetail, /verified backend episode list/i)
assert.doesNotMatch(animeDetail, /Array\.from\(\{ length: count \}/)

console.log('Canonical Home route and backend-only Anime Detail checks passed.')
