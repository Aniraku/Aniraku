import assert from 'node:assert/strict'
import { __test__ } from '../api/kitsu.js'

const mapping = __test__.mappingByKitsuAnime([
  { id: '49444', relationships: { mappings: { data: [{ id: '343091', type: 'mappings' }] } } },
], [
  { id: '343091', type: 'mappings', attributes: { externalSite: 'anilist/anime', externalId: '185874' } },
])
assert.equal(mapping.get('49444'), 185874)

const media = __test__.toAniListMedia({
  id: '49444',
  attributes: {
    canonicalTitle: 'BLEACH: Thousand-Year Blood War - The Calamity',
    titles: { en: 'Bleach: The Calamity', en_jp: 'BLEACH: Sennen Kessen-hen - Kashin-tan' },
    posterImage: { medium: 'https://media.kitsu.app/anime/49444/poster_image/medium.jpg' },
    coverImage: { large: 'https://media.kitsu.app/anime/49444/cover_image/large.jpg' },
    synopsis: 'Verified Kitsu synopsis.', subtype: 'TV', status: 'current', episodeCount: 10, episodeLength: 24, averageRating: '84.92', userCount: 1200, startDate: '2026-07-25', nsfw: false,
  },
}, 185874)
assert.equal(media.id, 185874)
assert.equal(media.title.english, 'Bleach: The Calamity')
assert.equal(media.coverImage.medium, 'https://media.kitsu.app/anime/49444/poster_image/medium.jpg')
assert.equal(media.bannerImage, 'https://media.kitsu.app/anime/49444/cover_image/large.jpg')
assert.equal(media.artwork.source, 'kitsu')
assert.equal(media.status, 'RELEASING')
assert.equal(media.averageScore, 85)

console.log('Kitsu Preview metadata resolver contract passed.')
