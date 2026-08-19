import assert from 'node:assert/strict'
import {
  getHlsProviderRecoveryReason,
  getHlsLoadPolicies,
  isTerminalHlsStatus,
} from '../src/lib/watchBufferPolicy.js'

for (const status of [401, 403, 404, 410, 429]) {
  assert.equal(isTerminalHlsStatus(status), true, `${status} must stop same-URL retries`)
}

for (const status of [0, 408, 500, 502, 503]) {
  assert.equal(isTerminalHlsStatus(status), false, `${status} must remain recoverable`)
}

const policies = getHlsLoadPolicies()
assert.equal(policies.fragLoadPolicy.default.errorRetry.maxNumRetry, 3)
assert.equal(policies.fragLoadPolicy.default.timeoutRetry.maxNumRetry, 2)
assert.equal(policies.playlistLoadPolicy.default.errorRetry.maxNumRetry, 2)
assert.equal(policies.manifestLoadPolicy.default.errorRetry.maxNumRetry, 1)

const retryFragment = policies.fragLoadPolicy.default.errorRetry.shouldRetry
assert.equal(retryFragment(null, 0, false, { code: 403 }), false)
assert.equal(retryFragment(null, 0, false, { status: 429 }), false)
assert.equal(retryFragment(null, 0, false, { code: 502 }), true)
assert.equal(retryFragment(null, 0, true, undefined), true)

assert.equal(getHlsProviderRecoveryReason(401), 'refresh-source')
assert.equal(getHlsProviderRecoveryReason(403), 'refresh-source')
assert.equal(getHlsProviderRecoveryReason(404), 'permanent-cdn')
assert.equal(getHlsProviderRecoveryReason(429), 'permanent-cdn')
assert.equal(getHlsProviderRecoveryReason(502), 'native-hls-error')

console.log('watch playback recovery policy tests passed')
