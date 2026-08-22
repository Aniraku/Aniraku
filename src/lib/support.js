export const PATREON_URL = 'https://patreon.com/ShoIslam'
export const SUPPORT_FUNDING_COPY = 'Hosting, releases, and open-source development.'

export const USDT_ASSET = 'USDT'
export const USDT_NETWORK = 'BNB Smart Chain (BEP20)'
export const USDT_NETWORK_SHORT = 'BEP20'
export const USDT_BEP20_ADDRESS = '0x0dc085fc880f2f67b4e200f125bc0de352da904e'

export const SUPPORT_PROMPT_ACTIVE_MS = 30 * 60 * 1000
export const SUPPORT_PROMPT_DISMISS_MS = 7 * 24 * 60 * 60 * 1000
export const SUPPORT_PROMPT_DISMISS_KEY = 'aniraku.support.dismissed-until'

export function isSupportPromptExcluded(pathname) {
  return String(pathname || '').startsWith('/watch/')
}

export function supportDismissedUntil(now = Date.now()) {
  return now + SUPPORT_PROMPT_DISMISS_MS
}

export function isSupportPromptDismissed(storage, now = Date.now()) {
  return Number(storage?.getItem(SUPPORT_PROMPT_DISMISS_KEY) || 0) > now
}

export function dismissSupportPrompt(storage, now = Date.now()) {
  const until = supportDismissedUntil(now)
  storage?.setItem(SUPPORT_PROMPT_DISMISS_KEY, String(until))
  return until
}

export function shouldShowSupportPrompt({ activeMs, pathname, dismissedUntil, now = Date.now() }) {
  return activeMs >= SUPPORT_PROMPT_ACTIVE_MS && !isSupportPromptExcluded(pathname) && Number(dismissedUntil || 0) <= now
}
