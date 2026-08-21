import assert from 'node:assert/strict'
import { createMediaTransportPlan } from '../src/lib/watchSourceTransport.js'

const common = {
  directUrl: 'https://vault-02.uwucdn.top/stream/example/uwu.m3u8',
  proxyUrl: 'https://api.aniraku.tech/proxy?url=example',
}

assert.deepEqual(createMediaTransportPlan({ ...common, verification: 'unverified' }), [
  { mode: 'direct', url: common.directUrl },
  { mode: 'proxy', url: common.proxyUrl },
])
assert.deepEqual(createMediaTransportPlan({ ...common, verification: 'proxy' }), [
  { mode: 'proxy', url: common.proxyUrl },
  { mode: 'direct', url: common.directUrl },
])
assert.deepEqual(createMediaTransportPlan({ ...common, verification: '' }), [
  { mode: 'proxy', url: common.proxyUrl },
  { mode: 'direct', url: common.directUrl },
])

console.log('watch source transport tests passed')
