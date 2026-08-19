import assert from 'node:assert/strict'
import { getRecoveryResumePosition } from '../src/lib/watchRecoveryPosition.js'

assert.equal(getRecoveryResumePosition(681.86, 1540.99), 681.86)
assert.equal(getRecoveryResumePosition(0, 1540.99), null)
assert.equal(getRecoveryResumePosition(Number.NaN, 1540.99), null)
assert.equal(getRecoveryResumePosition(120, Number.NaN), 120)
assert.equal(getRecoveryResumePosition(100, 100), 99.5)

console.log('watch recovery position tests passed')
