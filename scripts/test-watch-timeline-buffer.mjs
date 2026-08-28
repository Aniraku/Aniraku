import assert from 'node:assert/strict'
import {
  PLAYBACK_CACHE_SECONDS,
  getBufferedTimelineSegments,
  getPlayableBufferedTimelineSegments,
} from '../src/lib/watchTimelineBuffer.js'

assert.equal(PLAYBACK_CACHE_SECONDS, Number.POSITIVE_INFINITY)

assert.deepEqual(
  getBufferedTimelineSegments([{ start: 0, end: 1_540 }], {
    currentTime: 300,
    duration: 1_540,
  }),
  [{ leftPercent: 0, widthPercent: 100 }]
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
  [{ leftPercent: 0, widthPercent: 420 / 1540 * 100 }]
)

assert.deepEqual(
  getBufferedTimelineSegments(
    [{ start: 0, end: 120 }, { start: 300, end: 420 }],
    { currentTime: 350, duration: 1_000 }
  ),
  [
    { leftPercent: 0, widthPercent: 12 },
    { leftPercent: 30, widthPercent: 12 },
  ]
)

console.log('watch timeline buffer tests passed')
