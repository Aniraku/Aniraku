export const ANDROID_APP_PACKAGE = 'aniraku.anime.app'
export const ANDROID_APP_INTENT = `intent://open#Intent;scheme=aniraku;package=${ANDROID_APP_PACKAGE};end`
export const ANDROID_APP_RELEASE_URL = 'https://github.com/Aniraku/Aniraku-App/releases/download/v2.0.Alpha/app-release.apk'
export const ANDROID_APP_ORION_URL = 'https://rookieenough.github.io/Orion-Data/redirect.html?id=aniraku'
export const ANDROID_FALLBACK_DISMISS_KEY = 'aniraku:android-app-fallback:hide-until'

const EXCLUDED_PATHS = new Set([
  '/login',
  '/signup',
  '/auth/forgot-password',
  '/auth/new-password',
  '/privacy',
  '/terms',
  '/dmca',
  '/license',
  '/community-guidelines',
  '/admin',
])

export function parseAndroidMajorVersion(userAgent = '') {
  const match = userAgent.match(/Android\s+(\d+)(?:\.\d+)?/i)
  return match ? Number.parseInt(match[1], 10) : null
}

export function isAndroidAppCompatible({
  userAgent = '',
  maxTouchPoints = 0,
  viewportWidth = 0,
  coarsePointer = false,
} = {}) {
  const androidMajor = parseAndroidMajorVersion(userAgent)
  const excludedEnvironment = /Android\s*TV|AndroidTV|Smart-TV|AFT[A-Z0-9]+|GoogleTV|HeadlessChrome|bot\b|crawler|spider/i.test(userAgent)
  // Some Android browsers and in-app web views under-report touch points.
  // The Android mobile UA remains a reliable fallback after TV and bot
  // environments have already been excluded above.
  const touchCapable = coarsePointer || maxTouchPoints > 0 || /Mobile/i.test(userAgent)
  const compactViewport = viewportWidth > 0 && viewportWidth <= 1280

  return Boolean(androidMajor && androidMajor >= 9 && !excludedEnvironment && touchCapable && compactViewport)
}

export function isFallbackDismissed(storage, now = Date.now()) {
  if (!storage) return false

  try {
    const hideUntil = Number(storage.getItem(ANDROID_FALLBACK_DISMISS_KEY))
    return Number.isFinite(hideUntil) && hideUntil > now
  } catch {
    return false
  }
}

export function dismissFallback(storage, days = 30, now = Date.now()) {
  if (!storage) return

  try {
    storage.setItem(ANDROID_FALLBACK_DISMISS_KEY, String(now + days * 24 * 60 * 60 * 1000))
  } catch {
    // Private browsing can reject storage; the fallback remains functional.
  }
}

export function isFallbackExcludedPath(pathname = '') {
  return EXCLUDED_PATHS.has(pathname)
}
