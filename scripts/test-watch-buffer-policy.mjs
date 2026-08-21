import assert from 'node:assert/strict'
import {
  getDashBufferPolicy,
  getHlsBufferPolicy,
  getHlsRequestCacheMode,
  getNativeMediaBufferPolicy,
} from '../src/lib/watchBufferPolicy.js'

const MEBIBYTE = 1024 * 1024

const slow = getHlsBufferPolicy({ effectiveType: '2g' })
assert.equal(slow.maxBufferLength, 120)
assert.equal(slow.maxMaxBufferLength, 120)
assert.equal(slow.maxBufferSize, 128 * MEBIBYTE)
assert.equal(slow.backBufferLength, 120)

const mobile = getHlsBufferPolicy({ effectiveType: '3g', downlink: 2.5 })
assert.equal(mobile.maxBufferLength, 120)
assert.equal(mobile.maxMaxBufferLength, 120)
assert.equal(mobile.backBufferLength, 120)

const fast = getHlsBufferPolicy({ effectiveType: '4g', downlink: 12 })
assert.equal(fast.maxBufferLength, 120)
assert.equal(fast.maxMaxBufferLength, 120)
assert.equal(fast.maxBufferSize, 128 * MEBIBYTE)
assert.equal(fast.backBufferLength, 120)

assert.equal(getHlsRequestCacheMode({ frag: {} }), 'default')
assert.equal(getHlsRequestCacheMode({ type: 'fragment' }), 'default')
assert.equal(getHlsRequestCacheMode({ type: 'manifest' }), 'default')

assert.deepEqual(getNativeMediaBufferPolicy(), { preload: 'auto' })

const dashMobile = getDashBufferPolicy({ effectiveType: '3g', downlink: 2.5 })
assert.equal(dashMobile.initialBufferLevel, 6)
assert.equal(dashMobile.bufferTimeDefault, 120)
assert.equal(dashMobile.bufferTimeAtTopQuality, 120)
assert.equal(dashMobile.bufferTimeAtTopQualityLongForm, 120)
assert.equal(dashMobile.bufferToKeep, 120)

const dashFast = getDashBufferPolicy({ effectiveType: '4g', downlink: 12 })
assert.equal(dashFast.bufferTimeDefault, 120)
assert.equal(dashFast.bufferTimeAtTopQualityLongForm, 120)

console.log('watch buffer policy tests passed')
