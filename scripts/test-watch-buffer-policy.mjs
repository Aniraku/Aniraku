import assert from 'node:assert/strict'
import {
  CONTINUOUS_BUFFER_SECONDS,
  DASH_CONTINUOUS_BUFFER_SECONDS,
  getDashBufferPolicy,
  getHlsBufferPolicy,
  getHlsRequestCacheMode,
  getNativeMediaBufferPolicy,
} from '../src/lib/watchBufferPolicy.js'

const hls = getHlsBufferPolicy({ effectiveType: '4g', downlink: 12 })
assert.equal(CONTINUOUS_BUFFER_SECONDS, Number.POSITIVE_INFINITY)
assert.equal(hls.maxBufferLength, Number.POSITIVE_INFINITY)
assert.equal(hls.maxMaxBufferLength, Number.POSITIVE_INFINITY)
assert.equal(hls.maxBufferSize, Number.POSITIVE_INFINITY)
assert.equal(hls.backBufferLength, Number.POSITIVE_INFINITY)
assert.equal(hls.frontBufferFlushThreshold, Number.POSITIVE_INFINITY)

assert.equal(getHlsRequestCacheMode({ frag: {} }), 'force-cache')
assert.equal(getHlsRequestCacheMode({ part: {} }), 'force-cache')
assert.equal(getHlsRequestCacheMode({ type: 'fragment' }), 'force-cache')
assert.equal(getHlsRequestCacheMode({ type: 'manifest' }), 'default')
assert.equal(getHlsRequestCacheMode({ type: 'level' }), 'default')
assert.equal(getHlsRequestCacheMode({}), 'default')

assert.deepEqual(getNativeMediaBufferPolicy(), { preload: 'auto' })

const dash = getDashBufferPolicy({ effectiveType: '3g', downlink: 2.5 })
assert.equal(dash.initialBufferLevel, 6)
assert.equal(dash.bufferTimeDefault, DASH_CONTINUOUS_BUFFER_SECONDS)
assert.equal(dash.bufferTimeAtTopQuality, DASH_CONTINUOUS_BUFFER_SECONDS)
assert.equal(dash.bufferTimeAtTopQualityLongForm, DASH_CONTINUOUS_BUFFER_SECONDS)
assert.equal(dash.bufferToKeep, DASH_CONTINUOUS_BUFFER_SECONDS)

console.log('watch buffer policy tests passed')
