import assert from 'node:assert/strict'
import { shouldPreferProviderPlayer } from '../src/lib/watchProviderPlayer.js'

assert.equal(shouldPreferProviderPlayer({ provider: 'bonk' }), true)
assert.equal(shouldPreferProviderPlayer({ label: 'BONK', id: 'sub:bonk' }), true)
assert.equal(shouldPreferProviderPlayer({ provider: 'pewe', label: 'Pewe' }), false)
assert.equal(shouldPreferProviderPlayer({ provider: 'kiwi', label: 'Kiwi' }), false)

console.log('watch provider-player preference tests passed')
