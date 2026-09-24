import { useEffect } from 'react';
import { useTheme } from '../components/ThemeContext';

// ---------------------------------------------------------------------------
// Global keyboard shortcuts — direct port of live miruro.to's matcher map
// (`Os`) and dispatcher (`Uh`, live/index.js @227066–227900).
//
// Listener target: live attaches to `document`; this port attaches to
// `window` because the local Settings page dispatches its synthetic Shift+?
// keydown on `window` (Settings.tsx:422) with bubbles:false, which a document
// listener can never see. Real keydowns bubble up to window and no local
// keydown handler calls stopPropagation(), so both targets are equivalent for
// physical keys while window additionally catches that synthetic event. The
// `strmcx-keydown` relay follows the same placement (live: document; no local
// dispatcher exists yet).
//
// Page-scoped actions use the mission contract: `miruro:shortcut` CustomEvents
// (`next-ep`, `prev-ep`, `theater`). `lights` has NO key on live (button
// only), so it is never dispatched here.
// ---------------------------------------------------------------------------

/** Mission contract event emitted for page-scoped (Watch) shortcuts. */
export const MIRURO_SHORTCUT_EVENT = 'miruro:shortcut';

export type MiruroShortcutAction = 'prev-ep' | 'next-ep' | 'theater' | 'lights';

type Matcher = (e: KeyboardEvent) => boolean;

const hasNoBlockingModifier = (e: KeyboardEvent): boolean =>
  !e.ctrlKey && !e.altKey && !e.metaKey;

// live `Os` — matcher map, one entry per ShortcutsPopup row (order of keys
// mirrors the popup; theme/settings modifiers match live verbatim, including
// theme having no modifier exclusions).
const Os: Record<string, Matcher> = {
  theme: (e) => e.shiftKey && e.key.toLowerCase() === 'd',
  openShortcuts: (e) => e.shiftKey && e.key === '?',
  settings: (e) => (e.metaKey || e.ctrlKey || e.shiftKey) && e.key === ',',
  search: (e) =>
    e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'),
  notifications: (e) =>
    e.shiftKey && e.key.toLowerCase() === 'm' && hasNoBlockingModifier(e),
  sidemenu: (e) =>
    e.shiftKey &&
    ['t', 'v'].includes(e.key.toLowerCase()) &&
    hasNoBlockingModifier(e),
  watchNext: (e) =>
    e.shiftKey && e.key.toLowerCase() === 'n' && hasNoBlockingModifier(e),
  watchPrev: (e) =>
    e.shiftKey &&
    ['p', 'b'].includes(e.key.toLowerCase()) &&
    hasNoBlockingModifier(e),
  // Contract-only extension (no global matcher on live): unmodified t →
  // theater for Watch pages. Player keys (k/j/l/f/m/space/arrows/,/./0-9 and
  // Shift+S / Shift+Enter) are not global on live — they live inside the
  // player, which is out of scope here.
  theater: (e) =>
    e.key === 't' &&
    !e.shiftKey &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.metaKey,
};

// live `Uh` typing guard — same conditions, hardened so synthetic events
// whose target is window/document (Settings' Shift+? dispatch) return false
// instead of crashing on a missing `.closest` (live would throw there).
const isTypingTarget = (e: KeyboardEvent): boolean => {
  const t = e.target as Element | null;
  if (!t || typeof t.tagName !== 'string') return false;

  const tag = t.tagName.toLowerCase();
  if (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    ('isContentEditable' in t &&
      (t as HTMLElement).isContentEditable) ||
    t.closest(`[contenteditable=''], [contenteditable='true']`)
  ) {
    return true;
  }

  const role = t.getAttribute('role');
  if (
    (role && ['textbox', 'combobox', 'searchbox'].includes(role)) ||
    t.closest(`#anime-community-comment-section`)
  ) {
    return true;
  }

  const active = document.activeElement;
  return !!(
    active &&
    active.tagName?.toLowerCase() === `iframe` &&
    active.closest(`#anime-community-comment-section`)
  );
};

const emitWindowEvent = (name: string): void => {
  window.dispatchEvent(new Event(name));
};

const emitShortcut = (action: MiruroShortcutAction): void => {
  window.dispatchEvent(
    new CustomEvent(MIRURO_SHORTCUT_EVENT, { detail: { action } })
  );
};

/**
 * Installs the single global keydown listener set (live `Uh`): one window
 * `keydown` listener plus the `strmcx-keydown` relay, both removed on
 * unmount / theme change (deps `[toggleTheme]`, like live).
 */
export function useGlobalShortcuts(): void {
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (isTypingTarget(e)) return;

      // live `Uh` dispatch order: theme → openShortcuts → settings → search →
      // notifications → sidemenu → watchNext → watchPrev (+ contract theater)
      if (Os.theme(e)) {
        e.preventDefault();
        toggleTheme();
        return;
      }
      if (Os.openShortcuts(e)) {
        e.preventDefault();
        emitWindowEvent('global-shortcuts:toggle-shortcuts-popup');
        return;
      }
      if (Os.settings(e)) {
        e.preventDefault();
        emitWindowEvent('global-shortcuts:toggle-settings');
        return;
      }
      if (Os.search(e)) {
        e.preventDefault();
        emitWindowEvent('global-shortcuts:focus-search');
        return;
      }
      if (Os.notifications(e)) {
        e.preventDefault();
        // live: open toggles, sidemenu force-closes (mutual exclusion)
        emitWindowEvent('global-shortcuts:open-notifications');
        emitWindowEvent('global-shortcuts:close-sidemenu');
        return;
      }
      if (Os.sidemenu(e)) {
        e.preventDefault();
        emitWindowEvent('global-shortcuts:open-sidemenu');
        emitWindowEvent('global-shortcuts:close-notifications');
        return;
      }
      if (Os.watchNext(e)) {
        e.preventDefault();
        emitShortcut('next-ep');
        return;
      }
      if (Os.watchPrev(e)) {
        e.preventDefault();
        emitShortcut('prev-ep');
        return;
      }
      if (Os.theater(e)) {
        e.preventDefault();
        emitShortcut('theater');
      }
    };

    // live relays `strmcx-keydown` CustomEvents (detail = KeyboardEventInit)
    // through the exact same dispatcher
    const handleRelay = (ev: Event) => {
      const detail = (ev as CustomEvent<KeyboardEventInit>).detail ?? {};
      const synthetic = new KeyboardEvent('keydown', {
        ...detail,
        bubbles: true,
        cancelable: true,
      });
      handleKeydown(synthetic);
      if (synthetic.defaultPrevented) ev.preventDefault();
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('strmcx-keydown', handleRelay);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('strmcx-keydown', handleRelay);
    };
  }, [toggleTheme]);
}
