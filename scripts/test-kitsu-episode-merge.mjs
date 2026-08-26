import assert from 'node:assert/strict'
import { mergeKitsuEpisodeMetadata } from '../src/lib/kitsuEpisodes.js'

const availability = [
  { number: 1, title: 'Wrong provider title', thumbnail: 'https://wrong.test/one.jpg', description: 'Wrong description', filler: false },
  { number: 2, title: 'Wrong provider title', thumbnail: 'https://wrong.test/two.jpg', filler: true },
]
const merged = mergeKitsuEpisodeMetadata(availability, [{
  number: 1,
  title: 'GOD OF THUNDER',
  thumbnail: 'https://media.kitsu.app/episode/376928/thumbnail/medium.jpg',
  description: 'Verified episode synopsis.',
}])

assert.deepEqual(merged, [
  { number: 1, title: 'GOD OF THUNDER', thumbnail: 'https://media.kitsu.app/episode/376928/thumbnail/medium.jpg', description: 'Verified episode synopsis.', filler: false },
  { number: 2, title: null, thumbnail: null, description: null, filler: true },
])
assert.equal(mergeKitsuEpisodeMetadata(availability, [])[0].title, null)
assert.equal(mergeKitsuEpisodeMetadata(availability, [{ number: 1, title: 'Safe', thumbnail: 'http://wrong.test/image.jpg' }])[0].thumbnail, null)

console.log('Kitsu episode merge contract passed.')
