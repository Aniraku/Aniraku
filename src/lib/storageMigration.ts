// One-time storage migration: pre-swap `miruro:*` keys → `aniraku:*`.
//
// Runs once at boot (main.tsx, before any provider reads localStorage).
// Copies every legacy key to its new name ONLY when the new slot is empty,
// so existing users keep bookmarks, history, settings, theme and filters.
// Legacy keys are intentionally LEFT in place as an inert backup (and the
// Settings wipe still clears them). This module is the single remaining
// intentional `miruro:` reference in the codebase — safe to delete entirely
// once pre-swap installs are extinct.
const LEGACY_PREFIX = 'miruro:';
const CURRENT_PREFIX = 'aniraku:';

export function migrateLegacyStorage(): void {
  try {
    const moves: Array<[string, string]> = [];
    const storage = window.localStorage;
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key || key.indexOf(LEGACY_PREFIX) !== 0) continue;
      const next = CURRENT_PREFIX + key.slice(LEGACY_PREFIX.length);
      if (storage.getItem(next) == null) moves.push([key, next]);
    }
    for (const [from, to] of moves) {
      const value = storage.getItem(from);
      if (value != null) storage.setItem(to, value);
    }
  } catch {
    // Storage unavailable (private mode) — app boots with defaults.
  }
}
