import assert from 'node:assert/strict'
import {
  filterBrowserProviders,
  PROVIDER_DISCOVERY_RETRY_DELAYS_MS,
  mergeProviderServers,
} from '../src/lib/watchProviderDiscovery.js'

assert.deepEqual(PROVIDER_DISCOVERY_RETRY_DELAYS_MS, [0, 4_000, 8_000, 12_000])

assert.deepEqual(
  mergeProviderServers(
    [{ name: 'bonk', provider: 'miruro', lang: 'sub', sources: ['old'] }],
    [
      { name: 'ally', provider: 'miruro', lang: 'sub', sources: ['ally'] },
      { name: 'bonk', provider: 'miruro', lang: 'sub', sources: ['fresh'] },
    ]
  ),
  [
    { name: 'bonk', provider: 'miruro', lang: 'sub', sources: ['fresh'] },
    { name: 'ally', provider: 'miruro', lang: 'sub', sources: ['ally'] },
  ]
)

assert.deepEqual(
  filterBrowserProviders([
    { name: 'bonk', lang: 'sub' },
    { name: 'Ally', lang: 'sub' },
    { name: 'kiwi', lang: 'sub' },
  ]),
  [
    { name: 'bonk', lang: 'sub' },
    { name: 'kiwi', lang: 'sub' },
  ]
)

console.log('watch provider discovery tests passed')
