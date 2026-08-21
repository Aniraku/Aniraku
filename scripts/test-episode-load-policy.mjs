import assert from 'node:assert/strict'
import { EPISODE_BACKEND_GRACE_MS, getEpisodeBackendAttemptPlan } from '../src/lib/episodeLoadPolicy.js'

assert.equal(EPISODE_BACKEND_GRACE_MS, 8_000)
assert.deepEqual(getEpisodeBackendAttemptPlan(), [
  { delayMs: 0, timeoutMs: 4_000 },
  { delayMs: 500, timeoutMs: 3_500 },
])

console.log('episode load policy tests passed')
