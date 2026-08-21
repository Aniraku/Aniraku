import assert from 'node:assert/strict'
import {
  beginQuietProviderSwitch,
  settleQuietProviderSwitch,
} from '../src/lib/watchQuietSwitchState.js'

assert.equal(beginQuietProviderSwitch({ from: 'bonk-sub', to: 'bonk-sub', episode: 3 }), null)

const pending = beginQuietProviderSwitch({
  from: 'bonk-sub',
  to: 'kiwi-sub',
  episode: 3,
})

assert.deepEqual(pending, { from: 'bonk-sub', to: 'kiwi-sub', episode: 3 })
assert.deepEqual(
  settleQuietProviderSwitch({ pending, sourceId: 'kiwi-sub', episode: 3, succeeded: false }),
  { pending: null, restoreSourceId: 'bonk-sub', skipSourceLoad: true }
)
assert.deepEqual(
  settleQuietProviderSwitch({ pending, sourceId: 'kiwi-sub', episode: 3, succeeded: true }),
  { pending: null, restoreSourceId: null, skipSourceLoad: false }
)
assert.deepEqual(
  settleQuietProviderSwitch({ pending, sourceId: 'ally-sub', episode: 3, succeeded: false }),
  { pending, restoreSourceId: null, skipSourceLoad: false }
)

console.log('watch quiet switch state tests passed')
