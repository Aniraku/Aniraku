import assert from 'node:assert/strict'
import { __test__ } from '../api/kitsu-episodes.js'

const numbers = __test__.parseEpisodeNumbers('3,1,3,2')
assert.deepEqual(numbers, [1, 2, 3])
assert.throws(() => __test__.parseEpisodeNumbers('0,nope'), /positive episode numbers/)
assert.throws(() => __test__.parseEpisodeNumbers(Array.from({ length: 101 }, (_, index) => index + 1).join(',')), /at most 100/)

const anime = __test__.extractMappedAnime({
  data: [{ attributes: { externalSite: 'anilist/anime', externalId: '185874' } }],
  included: [{ id: '49444', type: 'anime', attributes: { status: 'current' } }],
}, 185874)
assert.equal(anime.id, '49444')
assert.throws(() => __test__.extractMappedAnime({ data: [], included: [] }, 185874), /verified AniList mapping/)

const episode = __test__.toKitsuEpisodeMetadata({
  attributes: {
    number: 1,
    canonicalTitle: 'GOD OF THUNDER',
    synopsis: 'A verified Kitsu synopsis.',
    airdate: '2026-07-25',
    thumbnail: { medium: 'https://media.kitsu.app/episode/376928/thumbnail/medium.jpg' },
  },
}, new Set([1]))
assert.deepEqual(episode, {
  number: 1,
  title: 'GOD OF THUNDER',
  thumbnail: 'https://media.kitsu.app/episode/376928/thumbnail/medium.jpg',
  description: 'A verified Kitsu synopsis.',
  airdate: '2026-07-25',
})
assert.equal(__test__.toKitsuEpisodeMetadata({ attributes: { number: 99 } }, new Set([1])), null)
assert.equal(__test__.safeImage('http://example.test/image.jpg'), '')

console.log('Kitsu episode resolver contract passed.')
