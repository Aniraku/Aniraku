import assert from 'node:assert/strict'
import {
  ANDROID_FALLBACK_DISMISS_KEY,
  ANDROID_APP_INTENT,
  ANDROID_APP_RELEASE_VERSION,
  ANDROID_APP_RELEASE_URL,
  isAndroidAppCompatible,
  isFallbackDismissed,
  isFallbackExcludedPath,
  parseAndroidMajorVersion,
  dismissFallback,
} from '../src/lib/androidAppFallback.js'

const androidChrome = 'Mozilla/5.0 (Linux; Android 15; SM-A145F) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36'
const storage = new Map()
const localStorageLike = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }

assert.equal(parseAndroidMajorVersion(androidChrome), 15)
assert.equal(ANDROID_APP_RELEASE_VERSION, 'V4.2.3')
assert.equal(ANDROID_APP_RELEASE_URL, 'https://github.com/Aniraku/Aniraku-App/releases/tag/v4.2.3')
assert.equal(ANDROID_APP_INTENT, `intent://auth#Intent;scheme=aniraku;package=aniraku.anime.app;S.browser_fallback_url=${encodeURIComponent(ANDROID_APP_RELEASE_URL)};end`)
assert.equal(parseAndroidMajorVersion('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)'), null)
assert.equal(isAndroidAppCompatible({ userAgent: androidChrome, maxTouchPoints: 5, viewportWidth: 412, coarsePointer: true }), true)
assert.equal(isAndroidAppCompatible({ userAgent: androidChrome, maxTouchPoints: 0, viewportWidth: 412, coarsePointer: false }), true)
assert.equal(isAndroidAppCompatible({ userAgent: 'Mozilla/5.0 (Linux; Android 8.1; Pixel)', maxTouchPoints: 5, viewportWidth: 412, coarsePointer: true }), false)
assert.equal(isAndroidAppCompatible({ userAgent: 'Mozilla/5.0 (Linux; Android 15; AndroidTV)', maxTouchPoints: 5, viewportWidth: 960, coarsePointer: true }), false)
assert.equal(isFallbackExcludedPath('/login'), true)
assert.equal(isFallbackExcludedPath('/home'), false)
assert.equal(isFallbackDismissed(localStorageLike, 1_000), false)
dismissFallback(localStorageLike, 30, 1_000)
assert.equal(isFallbackDismissed(localStorageLike, 1_001), true)
assert.ok(Number(storage.get(ANDROID_FALLBACK_DISMISS_KEY)) > 1_001)
console.log('Android app fallback logic checks passed.')
