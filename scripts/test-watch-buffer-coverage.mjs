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

console.log('watch all-source buffer coverage tests passed')
