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

const verifiedAvailability = [
  { number: 1, title: "I'm Luffy! The Man Who Will Become the Pirate King!", thumbnail: 'https://image.tmdb.org/t/p/original/one-piece-1.jpg', filler: false, serverId: 'retain-1' },
  { number: 2, title: 'EP 1162 · 1P', thumbnail: 'https://image.tmdb.org/t/p/original/one-piece-2.jpg', filler: false, serverId: 'resolve-2' },
]
const retained = mergeTmdbEpisodeMetadata(verifiedAvailability, [])
assert.equal(retained[0].title, "I'm Luffy! The Man Who Will Become the Pirate King!")
assert.equal(retained[0].thumbnail, 'https://image.tmdb.org/t/p/original/one-piece-1.jpg')
assert.equal(retained[1].title, null)
assert.equal(retained[1].thumbnail, null)

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

const selectiveRequests = []
const selectivelyEnriched = await enrichEpisodesWithTmdb(21, verifiedAvailability, {
  fetchImpl: async (url) => {
    selectiveRequests.push(url)
    return new Response(JSON.stringify({ anilistId: 21, source: 'tmdb', episodes: [{ number: 2, title: 'A Verified One Piece Title', thumbnail: 'https://image.tmdb.org/t/p/w780/one-piece-2.jpg' }] }), { status: 200 })
  },
})
assert.equal(selectiveRequests.length, 1)
assert.match(selectiveRequests[0], /episodes=2/)
assert.equal(selectivelyEnriched[0].title, "I'm Luffy! The Man Who Will Become the Pirate King!")
assert.equal(selectivelyEnriched[1].title, 'A Verified One Piece Title')

const fallback = await enrichEpisodesWithTmdb(185874, availability, {
  fetchImpl: async () => new Response('{}', { status: 503 }),
})
assert.equal(fallback[0].title, null)
assert.equal(fallback[0].thumbnail, null)

const retainedFallback = await enrichEpisodesWithTmdb(21, verifiedAvailability, {
  fetchImpl: async () => new Response('{}', { status: 503 }),
})
assert.equal(retainedFallback[0].title, "I'm Luffy! The Man Who Will Become the Pirate King!")
assert.equal(retainedFallback[1].title, null)
console.log('TMDB episode merge contract passed.')
