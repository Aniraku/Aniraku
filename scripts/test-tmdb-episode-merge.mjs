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
    return new Response(JSON.stringify({ anilistId: 185874, source: 'tmdb', mapped: [1, 2], episodes: [{ number: 1, title: 'GOD OF THUNDER', thumbnail: 'https://image.tmdb.org/t/p/w780/still.jpg' }] }), { status: 200 })
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
    return new Response(JSON.stringify({ anilistId: 21, source: 'tmdb', mapped: [1, 2], episodes: [{ number: 2, title: 'A Verified One Piece Title', thumbnail: 'https://image.tmdb.org/t/p/w780/one-piece-2.jpg' }] }), { status: 200 })
  },
})
assert.equal(selectiveRequests.length, 1)
assert.match(selectiveRequests[0], /episodes=1%2C2/)
assert.equal(selectivelyEnriched[0].title, null)
assert.equal(selectivelyEnriched[1].title, 'A Verified One Piece Title')

const reportedBleachRequests = []
const correctedReportedBleach = await enrichEpisodesWithTmdb(169755, [{
  number: 1,
  title: 'GOD OF THUNDER',
  thumbnail: 'https://image.tmdb.org/t/p/w780/wrong-related-season.jpg',
  serverId: 'bleach-conflict-1',
}], {
  fallbackThumbnail: 'https://cdn.myanimelist.net/images/anime/bleach-conflict.jpg',
  fetchImpl: async (url) => {
    reportedBleachRequests.push(url)
    return new Response(JSON.stringify({
      anilistId: 169755,
      source: 'tmdb',
      mapped: [1],
      episodes: [{ number: 1, title: 'A', thumbnail: 'https://image.tmdb.org/t/p/w780/conflict-episode-14.jpg' }],
    }), { status: 200 })
  },
})
assert.equal(reportedBleachRequests.length, 1)
assert.match(reportedBleachRequests[0], /episodes=1/)
assert.equal(correctedReportedBleach[0].serverId, 'bleach-conflict-1')
assert.equal(correctedReportedBleach[0].title, 'A')
assert.equal(correctedReportedBleach[0].thumbnail, 'https://image.tmdb.org/t/p/w780/conflict-episode-14.jpg')

const mappedButUnavailable = await enrichEpisodesWithTmdb(169755, [{ number: 2, title: 'KILL THE KING', thumbnail: 'https://image.tmdb.org/t/p/w780/wrong-related-season.jpg' }], {
  fallbackThumbnail: 'https://cdn.myanimelist.net/images/anime/bleach-conflict.jpg',
  fetchImpl: async () => new Response(JSON.stringify({ anilistId: 169755, source: 'tmdb', mapped: [2], episodes: [] }), { status: 200 }),
})
assert.equal(mappedButUnavailable[0].title, null)
assert.equal(mappedButUnavailable[0].thumbnail, 'https://cdn.myanimelist.net/images/anime/bleach-conflict.jpg')

const exactTitleWithoutStill = mergeTmdbEpisodeMetadata([{
  number: 1,
  title: 'Copied Related Season Title',
  thumbnail: 'https://image.tmdb.org/t/p/w780/copied-related-season.jpg',
}], [{ number: 1, title: 'Exact Episode Title', thumbnail: '' }], {
  mappedNumbers: [1],
  fallbackThumbnail: 'https://cdn.myanimelist.net/images/anime/title-poster.jpg',
})
assert.equal(exactTitleWithoutStill[0].title, 'Exact Episode Title')
assert.equal(exactTitleWithoutStill[0].thumbnail, 'https://cdn.myanimelist.net/images/anime/title-poster.jpg')

const duplicateTmdbRecords = mergeTmdbEpisodeMetadata([{ number: 1, title: 'Provider Title', thumbnail: 'https://image.tmdb.org/t/p/w780/provider.jpg' }], [
  { number: 1, title: 'First conflicting exact candidate', thumbnail: 'https://image.tmdb.org/t/p/w780/first.jpg' },
  { number: 1, title: 'Second conflicting exact candidate', thumbnail: 'https://image.tmdb.org/t/p/w780/second.jpg' },
], {
  mappedNumbers: [1],
  fallbackThumbnail: 'https://cdn.myanimelist.net/images/anime/title-poster.jpg',
})
assert.equal(duplicateTmdbRecords[0].title, null)
assert.equal(duplicateTmdbRecords[0].thumbnail, 'https://cdn.myanimelist.net/images/anime/title-poster.jpg')

const fallback = await enrichEpisodesWithTmdb(185874, availability, {
  fallbackThumbnail: 'https://cdn.myanimelist.net/images/anime/poster.jpg',
  fetchImpl: async () => new Response('{}', { status: 503 }),
})
assert.equal(fallback[0].title, null)
assert.equal(fallback[0].thumbnail, 'https://cdn.myanimelist.net/images/anime/poster.jpg')
assert.equal(fallback[1].title, null)
assert.equal(fallback[1].thumbnail, 'https://cdn.myanimelist.net/images/anime/poster.jpg')

const retainedFallback = await enrichEpisodesWithTmdb(21, verifiedAvailability, {
  fetchImpl: async () => new Response('{}', { status: 503 }),
})
assert.equal(retainedFallback[0].title, "I'm Luffy! The Man Who Will Become the Pirate King!")
assert.equal(retainedFallback[1].title, null)

const missingMovieMetadata = await enrichEpisodesWithTmdb(199, [{
  number: 1,
  title: 'Episode 1',
  thumbnail: '',
  serverId: 'movie-episode',
}], {
  isMovie: true,
  fallbackTitle: 'Spirited Away',
  fallbackThumbnail: 'https://cdn.myanimelist.net/images/anime/movie-banner.jpg',
  fetchImpl: async () => new Response('{}', { status: 503 }),
})
assert.equal(missingMovieMetadata[0].number, 1)
assert.equal(missingMovieMetadata[0].serverId, 'movie-episode')
assert.equal(missingMovieMetadata[0].title, 'Spirited Away')
assert.equal(missingMovieMetadata[0].thumbnail, 'https://cdn.myanimelist.net/images/anime/movie-banner.jpg')

const missingTvMetadata = await enrichEpisodesWithTmdb(185874, [{ number: 1, title: 'Episode 1', thumbnail: '' }], {
  isMovie: false,
  fallbackTitle: 'Not an episode title',
  fallbackThumbnail: 'https://cdn.myanimelist.net/images/anime/tv-poster.jpg',
  fetchImpl: async () => new Response('{}', { status: 503 }),
})
assert.equal(missingTvMetadata[0].title, null)
assert.equal(missingTvMetadata[0].thumbnail, 'https://cdn.myanimelist.net/images/anime/tv-poster.jpg')

const longListRequests = []
const longAvailability = Array.from({ length: 205 }, (_, index) => ({ number: index + 1, title: `Episode ${index + 1}`, thumbnail: '' }))
const longList = await enrichEpisodesWithTmdb(999, longAvailability, {
  fetchImpl: async (url) => {
    longListRequests.push(url)
    const numbers = new URL(url, 'https://aniraku.local').searchParams.get('episodes').split(',').map(Number)
    return new Response(JSON.stringify({
      anilistId: 999,
      source: 'tmdb',
      mapped: numbers,
      episodes: numbers.map((number) => ({ number, title: `Verified ${number}`, thumbnail: `https://image.tmdb.org/t/p/w780/long-${number}.jpg` })),
    }), { status: 200 })
  },
})
assert.equal(longListRequests.length, 3)
assert.ok(longListRequests.every((url) => new URL(url, 'https://aniraku.local').searchParams.get('episodes').split(',').length <= 100))
assert.equal(longList.length, 205)
assert.equal(longList[0].title, 'Verified 1')
assert.equal(longList[204].title, 'Verified 205')
console.log('TMDB episode merge contract passed.')
