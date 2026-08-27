import assert from 'node:assert/strict'
import handler, { __test__ } from '../api/tmdb-episodes.js'

const numbers = __test__.parseEpisodeNumbers('3,1,3,2')
assert.deepEqual(numbers, [1, 2, 3])
assert.throws(() => __test__.parseEpisodeNumbers('0,nope'), /positive episode numbers/)
assert.throws(() => __test__.parseEpisodeNumbers(Array.from({ length: 101 }, (_, index) => index + 1).join(',')), /at most 100/)
assert.match(__test__.mappingRequestUrl(21), /provider=anilist&id=21&limit=100$/)

const [mapping] = __test__.extractTmdbShowMappings({
  data: {
    'anilist:185874': {
      'tmdb_show:30984:s2': { '1-': '41-' },
    },
  },
}, 185874)
assert.deepEqual(mapping, { type: 'tv', showId: 30984, seasonNumber: 2, ranges: { '1-': '41-' } })
assert.equal(__test__.mapEpisodeNumber(mapping.ranges, 1), 41)
assert.equal(__test__.mapEpisodeNumber(mapping.ranges, 5), 45)
assert.equal(__test__.mapEpisodeNumber({ '1-12': '1-6,8-13' }, 7), 8)
assert.equal(__test__.mapEpisodeNumber({ '1-12': '1-24|2' }, 1), null)
assert.throws(() => __test__.extractTmdbShowMappings({ data: {} }, 185874), /verified AniList-to-TMDB mapping/)
const longRunningMappings = __test__.extractTmdbShowMappings({
  data: {
    'anilist:21': {
      'tmdb_show:37854:s1': { '1-61': '1-61' },
      'tmdb_show:37854:s2': { '62-77': '62-77' },
      'tmdb_show:37854:s19': { '804-877': '1-74' },
      'tmdb_show:37854:s20': { '878-891': '1-14' },
      'tmdb_show:37854:s21': { '892-1088': '1-197' },
      'tmdb_show:37854:s22': { '1089-': '1089-' },
    },
  },
}, 21)
assert.equal(longRunningMappings.length, 6)
assert.equal(__test__.mapEpisodeNumber(longRunningMappings[0].ranges, 1), 1)
assert.equal(__test__.mapEpisodeNumber(longRunningMappings[1].ranges, 70), 70)
assert.deepEqual(__test__.selectTmdbMappingForEpisode(longRunningMappings, 1), {
  type: 'tv', showId: 37854, seasonNumber: 1, ranges: { '1-61': '1-61' }, tmdbNumber: 1,
})
assert.deepEqual(__test__.selectTmdbMappingForEpisode(longRunningMappings, 70), {
  type: 'tv', showId: 37854, seasonNumber: 2, ranges: { '62-77': '62-77' }, tmdbNumber: 70,
})
assert.deepEqual(__test__.selectTmdbMappingForEpisode(longRunningMappings, 878), {
  type: 'tv', showId: 37854, seasonNumber: 20, ranges: { '878-891': '1-14' }, tmdbNumber: 1,
})
assert.deepEqual(__test__.selectTmdbMappingForEpisode(longRunningMappings, 892), {
  type: 'tv', showId: 37854, seasonNumber: 21, ranges: { '892-1088': '1-197' }, tmdbNumber: 1,
})
assert.deepEqual(__test__.selectTmdbMappingForEpisode(longRunningMappings, 1089), {
  type: 'tv', showId: 37854, seasonNumber: 22, ranges: { '1089-': '1089-' }, tmdbNumber: 1089,
})
assert.deepEqual(__test__.selectTmdbMappingForEpisode(longRunningMappings, 1156), {
  type: 'tv', showId: 37854, seasonNumber: 22, ranges: { '1089-': '1089-' }, tmdbNumber: 1156,
})
assert.equal(__test__.hasOpenEndedSourceRange({ '1089-': '1089-' }, 1089), true)
assert.equal(__test__.hasOpenEndedSourceRange({ '1089-': '1089-' }, 1156), true)
assert.equal(__test__.hasOpenEndedSourceRange({ '878-891': '878-891' }, 891), false)
assert.deepEqual(__test__.continuationSeasonNumbers({
  seasons: [
    { season_number: 0 }, { season_number: 22 }, { season_number: 23 }, { season_number: 24 },
  ],
}, 22), [23, 24])

const originalFetch = globalThis.fetch
const originalToken = process.env.TMDB_READ_ACCESS_TOKEN
process.env.TMDB_READ_ACCESS_TOKEN = 'deterministic-test-token'
globalThis.fetch = async (url) => {
  const target = String(url)
  if (target.includes('mappings.anibridge.eliasbenb.dev')) {
    return new Response(JSON.stringify({
      data: {
        'anilist:21': { 'tmdb_show:37854:s22': { '1089-': '1089-' } },
        'anilist:22': { 'tmdb_show:37854:s22': { '1089-': '1089-' } },
      },
    }), { status: 200 })
  }
  if (target.includes('/tv/37854/season/22')) {
    return new Response(JSON.stringify({ season_number: 22, episodes: [{ episode_number: 1089, name: 'A Season 22 Episode' }] }), { status: 200 })
  }
  if (target.includes('/tv/37854?language=en-US')) {
    return new Response(JSON.stringify({ seasons: [{ season_number: 22 }, { season_number: 23 }] }), { status: 200 })
  }
  if (target.includes('/tv/37854/season/23')) {
    return new Response(JSON.stringify({
      season_number: 23,
      episodes: [
        { episode_number: 1156, name: 'The Long-sought Elbaph!', still_path: '/season-23-still.jpg', overview: 'Verified season 23 metadata.' },
        { episode_number: 1176, name: 'The Admiral and the Giants', still_path: '/season-23-later-still.jpg', overview: 'Verified later season 23 metadata.' },
      ],
    }), { status: 200 })
  }
  throw new Error(`Unexpected deterministic TMDB request: ${target}`)
}
try {
  const season23Result = await __test__.resolveEpisodes(21, [1156])
  assert.deepEqual(season23Result.episodes, [{
    number: 1156,
    title: 'The Long-sought Elbaph!',
    thumbnail: 'https://image.tmdb.org/t/p/w780/season-23-still.jpg',
    description: 'Verified season 23 metadata.',
    airdate: null,
  }])
  assert.deepEqual(season23Result.mapped, [1156])
  assert.deepEqual(season23Result.missing, [])

  const responseState = { statusCode: null, headers: {}, body: null }
  const response = {
    status(status) { responseState.statusCode = status },
    setHeader(name, value) { responseState.headers[name] = value },
    json(payload) { responseState.body = payload },
  }
  await handler({ method: 'GET', query: { anilistId: '22', episodes: '1156,1176' } }, response)
  assert.equal(responseState.statusCode, 200)
  assert.match(responseState.headers['Cache-Control'], /s-maxage=300/)
  assert.deepEqual(responseState.body.episodes, [
    {
      number: 1156,
      title: 'The Long-sought Elbaph!',
      thumbnail: 'https://image.tmdb.org/t/p/w780/season-23-still.jpg',
      description: 'Verified season 23 metadata.',
      airdate: null,
    },
    {
      number: 1176,
      title: 'The Admiral and the Giants',
      thumbnail: 'https://image.tmdb.org/t/p/w780/season-23-later-still.jpg',
      description: 'Verified later season 23 metadata.',
      airdate: null,
    },
  ])
  assert.deepEqual(responseState.body.missing, [])
  assert.deepEqual(responseState.body.mapped, [1156, 1176])
} finally {
  globalThis.fetch = originalFetch
  if (originalToken === undefined) delete process.env.TMDB_READ_ACCESS_TOKEN
  else process.env.TMDB_READ_ACCESS_TOKEN = originalToken
}
assert.equal(__test__.selectTmdbMappingForEpisode([
  { showId: 1, seasonNumber: 1, ranges: { '1-10': '1-10' } },
  { showId: 2, seasonNumber: 1, ranges: { '5-15': '1-11' } },
], 5), null)

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
assert.equal(__test__.toTmdbEpisodeMetadata({ episode_number: 42, name: 'A Different Episode' }, 1, 41), null)

const [movieMapping] = __test__.extractTmdbMovieMappings({
  data: {
    'anilist:199': {
      'tmdb_movie:129': { '1': '1' },
    },
  },
}, 199)
assert.deepEqual(movieMapping, { type: 'movie', movieId: 129, ranges: { 1: '1' } })
assert.deepEqual(__test__.selectTmdbMappingForEpisode([movieMapping], 1), {
  type: 'movie', movieId: 129, ranges: { 1: '1' }, tmdbNumber: 1,
})
assert.deepEqual(__test__.toTmdbMovieMetadata({
  title: 'Spirited Away', overview: 'A verified movie synopsis.', release_date: '2001-07-20', backdrop_path: '/abcde.jpg',
}, 1, 1), {
  number: 1, title: 'Spirited Away', thumbnail: 'https://image.tmdb.org/t/p/w780/abcde.jpg', description: 'A verified movie synopsis.', airdate: '2001-07-20',
})
assert.deepEqual(__test__.toTmdbMovieMetadata({
  title: 'Poster-only Movie', poster_path: '/poster.jpg',
}, 1, 1), {
  number: 1, title: 'Poster-only Movie', thumbnail: 'https://image.tmdb.org/t/p/w780/poster.jpg', description: null, airdate: null,
})
assert.equal(__test__.toTmdbMovieMetadata({ title: 'Spirited Away' }, 1, 2), null)
assert.equal(__test__.safeStillUrl('https://untrusted.example/image.jpg'), '')
console.log('TMDB episode resolver contract passed.')
