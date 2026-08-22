import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const watchSource = readFileSync(
  new URL('../src/pages/Watch.jsx', import.meta.url),
  'utf8'
)

assert.match(
  watchSource,
  /getDashBufferPolicy,[\s\S]*getNativeMediaBufferPolicy,[\s\S]*from '\.\.\/lib\/watchBufferPolicy'/
)
assert.match(watchSource, /video\.preload = getNativeMediaBufferPolicy\(\)\.preload/)
assert.match(watchSource, /preload: getNativeMediaBufferPolicy\(\)\.preload/)
assert.match(watchSource, /buffer: getDashBufferPolicy\(netHintRef\.current\)/)

const hlsPrefetches = watchSource.match(/startFragPrefetch: true/g) || []
assert.equal(hlsPrefetches.length, 2)
assert.match(watchSource, /createBufferedTimelineIndicator/)
assert.match(watchSource, /bufferIndicatorCleanupRef/)
assert.match(watchSource, /if \(video\.canPlayType\('application\/vnd\.apple\.mpegurl'\)\)/)
assert.match(watchSource, /watch-buffer-indicator-segment/)
assert.match(watchSource, /video\.removeAttribute\('crossorigin'\)/)

console.log('watch all-source buffer coverage tests passed')
