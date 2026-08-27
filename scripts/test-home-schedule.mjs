import assert from 'node:assert/strict'
import {
  createHomeScheduleDays,
  groupHomeScheduleRows,
  initialPopulatedScheduleDayIndex,
} from '../src/lib/homeSchedule.js'

const days = createHomeScheduleDays(new Date(2026, 7, 27, 13, 45))
const at = (dayOffset, hour, minute) => Math.floor(new Date(2026, 7, 27 + dayOffset, hour, minute).getTime() / 1000)
const grouped = groupHomeScheduleRows([
  { id: 10, nextAiringEpisode: { airingAt: at(1, 19, 0) } },
  { id: 11, nextAiringEpisode: { airingAt: at(1, 14, 0) } },
  { id: 12, nextAiringEpisode: { airingAt: at(2, 10, 0) } },
  { id: 13, nextAiringEpisode: { airingAt: 'invalid' } },
  { id: 99, nextAiringEpisode: { airingAt: at(0, 18, 0) } },
], days, 99)

assert.equal(grouped[0].length, 0)
assert.deepEqual(grouped[1].map((item) => item.id), [11, 10])
assert.deepEqual(grouped[2].map((item) => item.id), [12])
assert.equal(initialPopulatedScheduleDayIndex(grouped), 1)
assert.equal(initialPopulatedScheduleDayIndex([[], [], []]), 0)
assert.equal(initialPopulatedScheduleDayIndex([[{ id: 1 }], []]), 0)
console.log('Home schedule grouping contract passed.')
