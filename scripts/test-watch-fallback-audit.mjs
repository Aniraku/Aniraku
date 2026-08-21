import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const watchSource = await readFile(
  new URL('../src/pages/Watch.jsx', import.meta.url),
  'utf8'
)

// Retained, browser-useful fallbacks.
assert.match(watchSource, /createMediaTransportPlan/)
assert.match(watchSource, /transportIndex \+ 1 < transportPlan\.length/)
assert.match(watchSource, /!manifestReady && hlsTransportIndex \+ 1 < hlsTransportPlan\.length/)
assert.match(watchSource, /if \(await tryHls\(\)\) return/)
assert.match(watchSource, /playAsNative\(video, url, art\)/)
assert.match(watchSource, /isBrowserPlayableEmbedSource/)
assert.match(watchSource, /hls\.recoverMediaError\(\)/)

// Removed, misleading recovery loops.
assert.doesNotMatch(watchSource, /failoverToNextSource/)
assert.doesNotMatch(watchSource, /trying the next quality/i)
assert.doesNotMatch(watchSource, /Retrying automatically/)
assert.doesNotMatch(watchSource, /isKiwiProvider/)
assert.doesNotMatch(watchSource, /blockedSourcesRef/)
assert.doesNotMatch(watchSource, /Server blocked — switching/)

console.log('watch fallback audit tests passed')
