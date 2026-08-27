import assert from 'node:assert/strict'
import handler from '../api/tmdb-episodes.js'

const episodeNumbers = Array.from({ length: 21 }, (_, index) => 1156 + index)
const responseState = { statusCode: null, headers: {}, body: null }
const response = {
  status(status) { responseState.statusCode = status },
  setHeader(name, value) { responseState.headers[name] = value },
  json(payload) { responseState.body = payload },
}

await handler({
  method: 'GET',
  query: { anilistId: '21', episodes: episodeNumbers.join(',') },
}, response)

assert.equal(responseState.statusCode, 200)
assert.match(responseState.headers['Cache-Control'], /s-maxage=300/)
const result = responseState.body

assert.deepEqual(result.missing, [])
assert.equal(result.episodes.length, episodeNumbers.length)
assert.deepEqual(result.episodes.map((episode) => episode.number), episodeNumbers)
assert.ok(result.episodes.every((episode) => typeof episode.title === 'string' && episode.title.length > 0))
assert.ok(result.episodes.every((episode) => typeof episode.thumbnail === 'string' && episode.thumbnail.startsWith('https://image.tmdb.org/t/p/w780/')))

console.log(`Verified exact One Piece continuation metadata for episodes ${episodeNumbers[0]}-${episodeNumbers.at(-1)}.`)
