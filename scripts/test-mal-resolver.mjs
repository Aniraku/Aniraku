import { strict as assert } from 'node:assert'
import { __test__ } from '../api/mal.js'

const media = __test__.toAniListMedia({
  id: 38000,
  title: 'Kimetsu no Yaiba',
  alternative_titles: { en: 'Demon Slayer', ja: '鬼滅の刃' },
  main_picture: { medium: 'https://example.test/medium.jpg', large: 'https://example.test/large.jpg' },
  pictures: [
    { medium: 'https://example.test/alternate-one.jpg', large: 'https://example.test/alternate-one-large.jpg' },
    { medium: 'https://example.test/alternate-two.jpg', large: 'https://example.test/alternate-two-large.jpg' },
    { medium: 'http://example.test/not-secure.jpg', large: 'javascript:alert(1)' },
  ],
  mean: 8.7,
  media_type: 'tv',
  status: 'finished_airing',
  num_episodes: 26,
  start_season: { year: 2019, season: 'spring' },
  genres: [{ name: 'Action' }],
}, 101922, 'https://example.test/anilist-banner.jpg')

assert.equal(media.id, 101922)
assert.equal(media.idMal, 38000)
assert.equal(media.title.english, 'Demon Slayer')
assert.equal(media.averageScore, 87)
assert.equal(media.format, 'TV')
assert.equal(media.status, 'FINISHED')
assert.equal(media.episodes, 26)
assert.deepEqual(media.genres, ['Action'])
assert.equal(media.bannerImage, 'https://example.test/anilist-banner.jpg')
assert.equal(media.artwork.provider, 'myanimelist')
assert.equal(media.artwork.posterOptions.length, 3)
assert.equal(media.artwork.posterOptions.includes(media.coverImage.large), true)
assert.equal(media.coverImage.color.startsWith('hsl('), true)
assert.equal(media.artwork.hasOfficialBanner, true)
assert.equal(__test__.httpsImage('http://example.test/unsafe.jpg'), '')
assert.equal(__test__.posterOptions({ pictures: [{ large: 'https://example.test/a.jpg' }, { large: 'https://example.test/a.jpg' }] }).length, 1)
assert.equal(__test__.stableIndex('same-title', 4), __test__.stableIndex('same-title', 4))
assert.deepEqual(__test__.pageInfo(1, 20, 45), { total: 45, lastPage: 3, hasNextPage: true, currentPage: 1, perPage: 20 })

const originalFetch = global.fetch
const originalClientId = process.env.MAL_CLIENT_ID
process.env.MAL_CLIENT_ID = 'test-client-id'
global.fetch = async (url) => {
  if (String(url).startsWith('https://api.myanimelist.net/')) {
    return new Response(JSON.stringify({ data: [{ node: { id: 38000, title: 'Kimetsu no Yaiba', alternative_titles: { en: 'Demon Slayer' }, main_picture: { medium: 'https://example.test/cover.jpg' }, media_type: 'tv', status: 'finished_airing', num_episodes: 26 } }] }), { status: 200 })
  }
  if (String(url) === 'https://graphql.anilist.co') {
    return new Response(JSON.stringify({ data: { Page: { media: [{ id: 101922, idMal: 38000, bannerImage: 'https://example.test/banner.jpg' }] } } }), { status: 200 })
  }
  throw new Error(`Unexpected resolver request: ${url}`)
}

const resolved = await __test__.resolveGraphQL('query MediaPage { Page { media { id } } }', { page: 1, perPage: 1, search: 'Demon Slayer' })
assert.equal(resolved.Page.media[0].id, 101922)
assert.equal(resolved.Page.media[0].idMal, 38000)
assert.equal(resolved.Page.media[0].episodes, 26)

global.fetch = originalFetch
if (originalClientId === undefined) delete process.env.MAL_CLIENT_ID
else process.env.MAL_CLIENT_ID = originalClientId

console.log('MAL resolver normalization regression passed.')
