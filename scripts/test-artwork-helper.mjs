import { strict as assert } from 'node:assert'
import { artworkTone, artworkVars, bannerSource, posterSource, posterSources } from '../src/lib/artwork.js'

const media = {
  id: 185874,
  idMal: 60636,
  title: { english: 'Bleach: Thousand-Year Blood War - The Calamity' },
  coverImage: { large: 'https://example.test/selected.jpg', medium: 'https://example.test/selected-medium.jpg' },
  bannerImage: 'https://example.test/banner.jpg',
  artwork: {
    provider: 'myanimelist',
    posterOptions: [
      'https://example.test/selected.jpg',
      'https://example.test/alternate.jpg',
      'http://example.test/rejected.jpg',
      'javascript:alert(1)',
    ],
  },
}

assert.deepEqual(posterSources(media), [
  'https://example.test/selected.jpg',
  'https://example.test/selected-medium.jpg',
  'https://example.test/alternate.jpg',
])
assert.equal(posterSource(media), 'https://example.test/selected.jpg')
assert.equal(bannerSource(media), 'https://example.test/banner.jpg')
assert.equal(bannerSource({ ...media, bannerImage: 'http://example.test/rejected.jpg' }), 'https://example.test/selected.jpg')
assert.equal(artworkTone(media), artworkTone(media))
assert.equal(artworkVars(media)['--art-tone'], artworkTone(media))

console.log('Shared artwork helper regression passed.')
