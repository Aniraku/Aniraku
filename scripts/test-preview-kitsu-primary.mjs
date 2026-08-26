import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [metadataClient, animeHook, detailPage] = await Promise.all([
  readFile(new URL('../src/lib/anilist.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/hooks/useAnime.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/AnimeDetail.jsx', import.meta.url), 'utf8'),
])

assert.match(metadataClient, /METADATA_RESOLVER_PATH = '\/api\/kitsu'/)
assert.doesNotMatch(metadataClient, /METADATA_RESOLVER_PATH = '\/api\/mal'/)
assert.match(animeHook, /anilistQuery\(ANIME_DETAIL_QUERY/)
assert.doesNotMatch(animeHook, /miruro-api-v3\.onrender\.com\/info/)
assert.match(detailPage, /enrichEpisodesWithKitsu/)
assert.match(detailPage, /bannerImage \|\| anime\.coverImage/)

console.log('Preview Kitsu-primary client contract passed.')
