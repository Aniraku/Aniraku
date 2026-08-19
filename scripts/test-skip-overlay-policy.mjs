import assert from 'node:assert/strict'
import {
  attemptSkipSegment,
  getSkipTarget,
  shouldShowManualSkipOverlay,
} from '../src/lib/skipOverlayPolicy.js'

const intro = { start: 90, end: 120 }

assert.equal(
  shouldShowManualSkipOverlay({
    segment: intro,
    currentTime: 91,
    autoSkip: true,
    autoSkipFailed: false,
  }),
  false,
  'auto-skip must remain silent while an automatic jump is available'
)
assert.equal(
  shouldShowManualSkipOverlay({
    segment: intro,
    currentTime: 91,
    autoSkip: false,
    autoSkipFailed: false,
  }),
  true,
  'manual prompt must remain available when auto-skip is disabled'
)
assert.equal(
  shouldShowManualSkipOverlay({
    segment: intro,
    currentTime: 91,
    autoSkip: true,
    autoSkipFailed: true,
  }),
  true,
  'manual prompt must become the fallback after a failed automatic jump'
)
assert.equal(
  shouldShowManualSkipOverlay({
    segment: intro,
    currentTime: 121,
    autoSkip: false,
    autoSkipFailed: false,
  }),
  false,
  'manual prompt must disappear outside the segment window'
)

const playableVideo = { duration: 900, currentTime: 0 }
assert.equal(attemptSkipSegment(playableVideo, intro), true)
assert.equal(playableVideo.currentTime, 120)
assert.equal(getSkipTarget({ start: 800, end: 950 }, 900), 899.5)

const blockedVideo = { duration: 900 }
Object.defineProperty(blockedVideo, 'currentTime', {
  get: () => 0,
  set: () => {
    throw new Error('seek blocked')
  },
})
assert.equal(attemptSkipSegment(blockedVideo, intro), false)

console.log('skip overlay policy tests passed')
