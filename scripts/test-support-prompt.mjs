import assert from 'node:assert/strict'
import {
  PATREON_URL,
  SUPPORT_PROMPT_ACTIVE_MS,
  SUPPORT_PROMPT_DISMISS_KEY,
  SUPPORT_PROMPT_DISMISS_MS,
  USDT_ASSET,
  USDT_BEP20_ADDRESS,
  USDT_NETWORK_SHORT,
  dismissSupportPrompt,
  isSupportPromptDismissed,
  isSupportPromptExcluded,
  shouldShowSupportPrompt,
} from '../src/lib/support.js'

const storageValues = new Map()
const storage = { getItem: (key) => storageValues.get(key) ?? null, setItem: (key, value) => storageValues.set(key, value) }
const now = 1_000_000

assert.equal(PATREON_URL, 'https://patreon.com/ShoIslam')
assert.equal(USDT_ASSET, 'USDT')
assert.equal(USDT_NETWORK_SHORT, 'BEP20')
assert.equal(USDT_BEP20_ADDRESS, '0x0dc085fc880f2f67b4e200f125bc0de352da904e')
assert.equal(isSupportPromptExcluded('/watch/attack-on-titan-1'), true)
assert.equal(isSupportPromptExcluded('/catalog'), false)
assert.equal(shouldShowSupportPrompt({ activeMs: SUPPORT_PROMPT_ACTIVE_MS - 1, pathname: '/catalog', now }), false)
assert.equal(shouldShowSupportPrompt({ activeMs: SUPPORT_PROMPT_ACTIVE_MS, pathname: '/watch/attack-on-titan-1', now }), false)
assert.equal(shouldShowSupportPrompt({ activeMs: SUPPORT_PROMPT_ACTIVE_MS, pathname: '/catalog', now }), true)
assert.equal(isSupportPromptDismissed(storage, now), false)
const until = dismissSupportPrompt(storage, now)
assert.equal(until - now, SUPPORT_PROMPT_DISMISS_MS)
assert.equal(storageValues.get(SUPPORT_PROMPT_DISMISS_KEY), String(until))
assert.equal(isSupportPromptDismissed(storage, now + 1), true)
assert.equal(shouldShowSupportPrompt({ activeMs: SUPPORT_PROMPT_ACTIVE_MS, pathname: '/catalog', dismissedUntil: until, now }), false)
assert.equal(shouldShowSupportPrompt({ activeMs: SUPPORT_PROMPT_ACTIVE_MS, pathname: '/catalog', dismissedUntil: until, now: until + 1 }), true)
console.log('Support prompt logic checks passed.')
