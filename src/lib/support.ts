// Support prompt rules — verbatim port of the old Aniraku `lib/support.js`
// (SupportPrompt + NavBar heart). The LS key is a legacy `aniraku.*` key kept
// verbatim per the internal-key mandate.
export const PATREON_URL = 'https://patreon.com/ShoIslam';
export const SUPPORT_FUNDING_COPY =
  'Hosting, releases, and open-source development.';

export const BINANCE_PAY_UID = '1098400042';
export const BINANCE_PAY_LABEL = 'Binance Pay';

export const SUPPORT_PROMPT_ACTIVE_MS = 30 * 60 * 1000;
export const SUPPORT_PROMPT_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
export const SUPPORT_PROMPT_DISMISS_KEY = 'aniraku.support.dismissed-until';

export function isSupportPromptExcluded(pathname: string): boolean {
  return String(pathname || '').startsWith('/watch/');
}

export function supportDismissedUntil(now: number = Date.now()): number {
  return now + SUPPORT_PROMPT_DISMISS_MS;
}

export function isSupportPromptDismissed(
  storage: Pick<Storage, 'getItem'> | null | undefined,
  now: number = Date.now()
): boolean {
  return Number(storage?.getItem(SUPPORT_PROMPT_DISMISS_KEY) || 0) > now;
}

export function dismissSupportPrompt(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined,
  now: number = Date.now()
): number {
  const until = supportDismissedUntil(now);
  storage?.setItem(SUPPORT_PROMPT_DISMISS_KEY, String(until));
  return until;
}

export function shouldShowSupportPrompt({
  activeMs,
  pathname,
  dismissedUntil,
  now = Date.now(),
}: {
  activeMs: number;
  pathname: string;
  dismissedUntil: number;
  now?: number;
}): boolean {
  return (
    activeMs >= SUPPORT_PROMPT_ACTIVE_MS &&
    !isSupportPromptExcluded(pathname) &&
    Number(dismissedUntil || 0) <= now
  );
}
