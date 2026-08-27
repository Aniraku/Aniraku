import assert from 'node:assert/strict'
import { __test__ } from '../api/tmdb-episodes.js'

const numbers = __test__.parseEpisodeNumbers('3,1,3,2')
assert.deepEqual(numbers, [1, 2, 3])
assert.throws(() => __test__.parseEpisodeNumbers('0,nope'), /positive episode numbers/)
assert.throws(() => __test__.parseEpisodeNumbers(Array.from({ length: 101 }, (_, index) => index + 1).join(',')), /at most 100/)

const mapping = __test__.extractTmdbShowMapping({
  data: {
    'anilist:185874': {
      'tmdb_show:30984:s2': { '1-': '41-' },
    },
  },
}, 185874)
assert.deepEqual(mapping, { showId: 30984, seasonNumber: 2, ranges: { '1-': '41-' } })
assert.equal(__test__.mapEpisodeNumber(mapping.ranges, 1), 41)
assert.equal(__test__.mapEpisodeNumber(mapping.ranges, 5), 45)
assert.equal(__test__.mapEpisodeNumber({ '1-12': '1-6,8-13' }, 7), 8)
assert.equal(__test__.mapEpisodeNumber({ '1-12': '1-24|2' }, 1), null)
assert.throws(() => __test__.extractTmdbShowMapping({ data: {} }, 185874), /verified AniList-to-TMDB mapping/)
assert.throws(() => __test__.extractTmdbShowMapping({ data: { 'anilist:1': { 'tmdb_show:1:s1': {}, 'tmdb_show:2:s1': {} } } }, 1), /multiple TMDB television mappings/)

const episode = __test__.toTmdbEpisodeMetadata({
  episode_number: 41,
  name: 'GOD OF THUNDER',
  overview: 'A verified TMDB synopsis.',
  air_date: '2026-07-25',
  still_path: '/pShnxXXD1CrHyLbbTu8nAaLczHP.jpg',
}, 1, 41)
assert.deepEqual(episode, {
  number: 1,
  title: 'GOD OF THUNDER',
  thumbnail: 'https://image.tmdb.org/t/p/w780/pShnxXXD1CrHyLbbTu8nAaLczHP.jpg',
  description: 'A verified TMDB synopsis.',
  airdate: '2026-07-25',
})
assert.equal(__test__.toTmdbEpisodeMetadata({ episode_number: 46, name: 'Episode 46' }, 6, 46), null)
assert.equal(__test__.safeStillUrl('https://untrusted.example/image.jpg'), '')
console.log('TMDB episode resolver contract passed.')
