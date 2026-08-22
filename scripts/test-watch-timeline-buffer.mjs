import assert from 'node:assert/strict'
import {
  PLAYBACK_CACHE_SECONDS,
  getBufferedTimelineSegments,
  getPlayableBufferedTimelineSegments,
} from '../src/lib/watchTimelineBuffer.js'

assert.equal(PLAYBACK_CACHE_SECONDS, 120)

assert.deepEqual(
  getBufferedTimelineSegments([{ start: 0, end: 1_540 }], {
    currentTime: 300,
    duration: 1_540,
  }),
  [{ leftPercent: 180 / 1540 * 100, widthPercent: 240 / 1540 * 100 }]
)

const partialRange = getBufferedTimelineSegments([{ start: 0, end: 70 }], {
  currentTime: 20,
  duration: 1_000,
})
assert.equal(partialRange[0].leftPercent, 0)
assert.ok(Math.abs(partialRange[0].widthPercent - 7) < Number.EPSILON * 8)

assert.deepEqual(getBufferedTimelineSegments([], { currentTime: 20, duration: 100 }), [])

assert.deepEqual(
  getPlayableBufferedTimelineSegments([{ start: 0, end: 1_540 }], {
    currentTime: 300,
    duration: 1_540,
    readyState: 2,
  }),
  []
)

assert.deepEqual(
  getPlayableBufferedTimelineSegments([{ start: 0, end: 420 }], {
    currentTime: 300,
    duration: 1_540,
    readyState: 4,
  }),
  [{ leftPercent: 180 / 1540 * 100, widthPercent: 240 / 1540 * 100 }]
)

console.log('watch timeline buffer tests passed')
