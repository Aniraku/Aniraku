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
const nativePreloadAssignments = watchSource.match(/video\.preload = getNativeMediaBufferPolicy\(\)\.preload/g) || []
assert.ok(nativePreloadAssignments.length >= 3)
assert.match(watchSource, /video\.preload = getNativeMediaBufferPolicy\(\)\.preload\s+video\.src = hlsTransportPlan\[hlsTransportIndex\]\.url/)
assert.match(watchSource, /video\.preload = getNativeMediaBufferPolicy\(\)\.preload\s+video\.src = proxiedH\(url\)/)
assert.match(watchSource, /buffer: getDashBufferPolicy\(netHintRef\.current\)/)

const hlsPrefetches = watchSource.match(/startFragPrefetch: true/g) || []
assert.equal(hlsPrefetches.length, 2)
assert.match(watchSource, /art-control-progress-inner \.art-progress-loaded/)
assert.match(watchSource, /background: rgba\(148, 163, 184, 0\.72\) !important/)
assert.doesNotMatch(watchSource, /watch-buffer-indicator-label|watch-buffer-indicator-endpoint/)
assert.match(watchSource, /shouldPreferNativeHls\(url\) && video\.canPlayType\('application\/vnd\.apple\.mpegurl'\)/)
assert.match(watchSource, /video\.removeAttribute\('crossorigin'\)/)

console.log('watch all-source buffer coverage tests passed')
