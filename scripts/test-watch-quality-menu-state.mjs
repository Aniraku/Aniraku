import assert from 'node:assert/strict'
import {
	createHlsQualitySelection,
	getHlsDataSaverCap,
	getHlsQualitySettingDisplay,
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

const hlsLevels = [
  { index: 0, height: 1080 },
  { index: 1, height: 720 },
  { index: 2, height: 480 },
]
assert.deepEqual(getHlsQualitySettingDisplay(hlsLevels, -1), {
  label: 'Auto',
  title: 'Quality · Auto',
})
assert.deepEqual(getHlsQualitySettingDisplay(hlsLevels, 1), {
	label: '720p',
	title: 'Quality · 720p',
})
assert.deepEqual(getHlsDataSaverCap(hlsLevels), { index: 2, height: 480 })
assert.deepEqual(getHlsQualitySettingDisplay(hlsLevels, -1, 2), {
	label: 'Data Saver · ≤480p',
	title: 'Quality · Data Saver · ≤480p',
})
assert.equal(getHlsDataSaverCap([{ index: 0, height: 720 }]), null)

const hlsQualitySelection = createHlsQualitySelection(-1)
assert.equal(hlsQualitySelection.getSelectedLevel(), -1)
assert.equal(hlsQualitySelection.selectLevel(1), 1)
assert.equal(
  hlsQualitySelection.getSelectedLevel(),
  1,
  'a later hls.js level event must retain the user-selected 720p index'
)
assert.equal(hlsQualitySelection.selectLevel('-1'), -1)

console.log('watch quality menu state tests passed')
