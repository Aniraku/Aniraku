import assert from 'node:assert/strict'
import {
  formatTimelineTime,
  getTimelineHoverState,
  getTimelineMarkers,
} from '../src/lib/watchTimelineHover.js'

assert.equal(formatTimelineTime(0), '0:00')
assert.equal(formatTimelineTime(89.9), '1:29')
assert.equal(formatTimelineTime(3661), '1:01:01')

const segments = {
  intro: { start: 12, end: 82 },
  outro: { start: 1180, end: 1235 },
}
const markers = getTimelineMarkers(segments, 1200)
assert.deepEqual(markers.map(({ type }) => type), ['intro', 'outro'])
assert.equal(markers[1].end, 1200)

const introHover = getTimelineHoverState({ ratio: 0.04, duration: 1200, segments })
assert.equal(introHover.marker.type, 'intro')
assert.equal(introHover.time, 48)

const neutralHover = getTimelineHoverState({ ratio: 0.5, duration: 1200, segments })
assert.equal(neutralHover.marker, null)
assert.equal(neutralHover.time, 600)

assert.equal(getTimelineHoverState({ ratio: 0.5, duration: 0, segments }), null)
assert.equal(getTimelineHoverState({ ratio: 2, duration: 100, segments }).time, 100)

console.log('watch timeline hover tests passed')
