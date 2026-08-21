import assert from 'node:assert/strict'
import {
  getQualitySettingTitle,
  selectQualityInList,
} from '../src/lib/watchQualityMenuState.js'

const qualities = [
  { url: 'auto', label: 'Auto', default: true },
  { url: '1080', label: '1080p', default: false },
  { url: '720', label: '720p', default: false },
]

const selected = selectQualityInList(qualities, '720')
assert.deepEqual(selected.map((quality) => quality.default), [false, false, true])
assert.equal(getQualitySettingTitle(selected[2]), 'Quality · 720p')
assert.equal(getQualitySettingTitle({ qualityKey: 'auto' }), 'Quality · auto')

console.log('watch quality menu state tests passed')
