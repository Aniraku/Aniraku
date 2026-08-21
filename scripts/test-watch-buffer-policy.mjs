import assert from 'node:assert/strict'
import {
  getDashBufferPolicy,
  getHlsBufferPolicy,
  getHlsRequestCacheMode,
  getNativeMediaBufferPolicy,
} from '../src/lib/watchBufferPolicy.js'

const MEBIBYTE = 1024 * 1024

const slow = getHlsBufferPolicy({ effectiveType: '2g' })
assert.equal(slow.maxBufferLength, 45)
assert.equal(slow.maxMaxBufferLength, 90)
assert.equal(slow.maxBufferSize, 32 * MEBIBYTE)

const mobile = getHlsBufferPolicy({ effectiveType: '3g', downlink: 2.5 })
assert.equal(mobile.maxBufferLength, 75)
assert.equal(mobile.maxMaxBufferLength, 150)
assert.equal(mobile.backBufferLength, 45)

const fast = getHlsBufferPolicy({ effectiveType: '4g', downlink: 12 })
assert.equal(fast.maxBufferLength, 120)
assert.equal(fast.maxMaxBufferLength, 180)
assert.equal(fast.maxBufferSize, 96 * MEBIBYTE)
assert.ok(fast.maxBufferLength > mobile.maxBufferLength)

assert.equal(getHlsRequestCacheMode({ frag: {} }), 'force-cache')
assert.equal(getHlsRequestCacheMode({ type: 'fragment' }), 'force-cache')
assert.equal(getHlsRequestCacheMode({ type: 'manifest' }), 'default')

assert.deepEqual(getNativeMediaBufferPolicy(), { preload: 'auto' })

const dashMobile = getDashBufferPolicy({ effectiveType: '3g', downlink: 2.5 })
assert.equal(dashMobile.initialBufferLevel, 6)
assert.equal(dashMobile.bufferTimeDefault, 75)
assert.equal(dashMobile.bufferTimeAtTopQuality, 75)
assert.equal(dashMobile.bufferTimeAtTopQualityLongForm, 150)
assert.equal(dashMobile.bufferToKeep, 45)

const dashFast = getDashBufferPolicy({ effectiveType: '4g', downlink: 12 })
assert.equal(dashFast.bufferTimeDefault, 120)
assert.equal(dashFast.bufferTimeAtTopQualityLongForm, 180)

console.log('watch buffer policy tests passed')
