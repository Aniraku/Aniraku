import assert from 'node:assert/strict'
import { enrichEpisodesWithTmdb, mergeTmdbEpisodeMetadata } from '../src/lib/tmdbEpisodes.js'

const availability = [
  { number: 1, title: 'Dissection - Rebirth Of Dissection', thumbnail: 'https://image.tmdb.org/t/p/original/bad.jpg', description: 'Wrong provider description', filler: false, serverId: 'keep-1' },
  { number: 2, title: 'Dissection - Rebirth Of Dissection', thumbnail: 'https://image.tmdb.org/t/p/original/bad.jpg', filler: true, serverId: 'keep-2' },
]

const merged = mergeTmdbEpisodeMetadata(availability, [{
  number: 1,
  title: 'GOD OF THUNDER',
  thumbnail: 'https://image.tmdb.org/t/p/w780/pShnxXXD1CrHyLbbTu8nAaLczHP.jpg',
  description: 'Verified TMDB description',
}])
assert.deepEqual(merged, [
  { number: 1, title: 'GOD OF THUNDER', thumbnail: 'https://image.tmdb.org/t/p/w780/pShnxXXD1CrHyLbbTu8nAaLczHP.jpg', description: 'Verified TMDB description', filler: false, serverId: 'keep-1' },
  { number: 2, title: null, thumbnail: null, description: null, filler: true, serverId: 'keep-2' },
])

const requests = []
const enriched = await enrichEpisodesWithTmdb(185874, availability, {
  fetchImpl: async (url) => {
    requests.push(url)
    return new Response(JSON.stringify({ anilistId: 185874, source: 'tmdb', episodes: [{ number: 1, title: 'GOD OF THUNDER', thumbnail: 'https://image.tmdb.org/t/p/w780/still.jpg' }] }), { status: 200 })
  },
})
assert.equal(requests.length, 1)
assert.match(requests[0], /anilistId=185874/)
assert.equal(enriched[0].title, 'GOD OF THUNDER')
assert.equal(enriched[1].title, null)

const fallback = await enrichEpisodesWithTmdb(185874, availability, {
  fetchImpl: async () => new Response('{}', { status: 503 }),
})
assert.equal(fallback[0].title, null)
assert.equal(fallback[0].thumbnail, null)
console.log('TMDB episode merge contract passed.')
