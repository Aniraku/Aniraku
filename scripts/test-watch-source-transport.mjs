import assert from 'node:assert/strict'
import {
  createMediaTransportPlan,
  shouldPreferNativeHls,
  shouldTryHlsFallback,
} from '../src/lib/watchSourceTransport.js'

const common = {
  directUrl: 'https://vault-02.uwucdn.top/stream/example/uwu.m3u8',
  proxyUrl: 'https://api.aniraku.tech/proxy?url=example',
}

assert.deepEqual(createMediaTransportPlan({ ...common, verification: 'unverified' }), [
  { mode: 'proxy', url: common.proxyUrl },
  { mode: 'direct', url: common.directUrl },
])
assert.deepEqual(createMediaTransportPlan({ ...common, verification: 'proxy' }), [
  { mode: 'proxy', url: common.proxyUrl },
  { mode: 'direct', url: common.directUrl },
])
assert.deepEqual(createMediaTransportPlan({ ...common, verification: '' }), [
  { mode: 'proxy', url: common.proxyUrl },
  { mode: 'direct', url: common.directUrl },
])
assert.deepEqual(createMediaTransportPlan({ ...common, proxyOnly: true }), [
  { mode: 'proxy', url: common.proxyUrl },
])

assert.equal(shouldTryHlsFallback('https://cdn.example/video/master.m3u8?token=one'), true)
assert.equal(shouldTryHlsFallback('https://a1.mp4upload.com/video.mp4'), false)
assert.equal(shouldPreferNativeHls('https://vault-02.uwucdn.top/stream/kiwi/uwu.m3u8'), true)
assert.equal(shouldPreferNativeHls('https://vault-13.owocdn.top/stream/kiwi/uwu.m3u8'), true)
assert.equal(shouldPreferNativeHls('https://repackager.wixmp.com/video/master.m3u8'), false)

console.log('watch source transport tests passed')
