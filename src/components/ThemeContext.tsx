import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'anilist' | 'catppuccin' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_META_COLORS: Record<string, string> = {
  dark: '#080808',
  light: '#f5f5f5',
  anilist: '#0b1622',
  catppuccin: '#1e1e2e',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Storage parity with live
//
// The theme lives in the unified record written by both this context and
// SettingsProvider (merge-writes, so neither clobbers the other):
//
//   localStorage['aniraku:settings'] = { schemaVersion, theme, settings }
//
// Read chain (presence-based, mirroring the live pre-paint bootstrap and
// runtime `Et` context):
//   1. record field `theme`            (aniraku:settings JSON)
//   2. legacy live key                 (aniraku:settings:theme, JSON-encoded)
//   3. legacy local key                (themePreference, {"mode": ...})
//   4. live default                    ('dark' — live `Ct`)
//
// Valid stored values mirror live's theme list `St`: system | light | dark |
// anilist | catppuccin ('system' is a first-class stored value resolved via
// prefers-color-scheme at runtime). Anything else falls back to 'dark' like
// live's runtime; the pre-paint matchMedia resolution for invalid/'system'
// values stays in index.html's bootstrap.
// ---------------------------------------------------------------------------

const SETTINGS_RECORD = 'aniraku:settings';
const LEGACY_LIVE_THEME_KEY = 'aniraku:settings:theme';
const LEGACY_LOCAL_THEME_KEY = 'themePreference';
const DEFAULT_THEME: Theme = 'dark'; // live `Ct`
const VALID_THEMES: string[] = [
  'system',
  'light',
  'dark',
  'anilist',
  'catppuccin',
]; // live `St` names

function readRecordTheme(): string | undefined {
  try {
    const raw = localStorage.getItem(SETTINGS_RECORD);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    const value =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed.theme
        : undefined;
    return typeof value === 'string' && value ? value : undefined;
  } catch {
    return undefined;
  }
}

function readLegacyTheme(): string | undefined {
  try {
    // live legacy key: JSON-encoded string, e.g. `"dark"`
    const raw = localStorage.getItem(LEGACY_LIVE_THEME_KEY);
    if (raw !== null) {
      const value = JSON.parse(raw);
      if (typeof value === 'string' && value) return value;
    }
  } catch {
    // ignore malformed legacy value
  }
  try {
    // local legacy key: {"mode":"dark"}
    const raw = localStorage.getItem(LEGACY_LOCAL_THEME_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      const mode =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? parsed.mode
          : undefined;
      if (typeof mode === 'string' && mode) return mode;
    }
  } catch {
    // ignore malformed legacy value
  }
  return undefined;
}

/** Presence chain first, then live's validity check with live's default. */
function resolveStoredTheme(): Theme {
  const candidate = readRecordTheme() ?? readLegacyTheme();
  return candidate && VALID_THEMES.includes(candidate)
    ? (candidate as Theme)
    : DEFAULT_THEME;
}

/** Merge-write `theme` into `aniraku:settings`, preserving settings/schemaVersion. */
function writeRecordTheme(theme: Theme) {
  try {
    let record: Record<string, unknown> = {};
    try {
      const raw = localStorage.getItem(SETTINGS_RECORD);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          record = parsed;
        }
      }
    } catch {
      // corrupt record — start clean
    }
    record.theme = theme;
    localStorage.setItem(SETTINGS_RECORD, JSON.stringify(record));
  } catch {
    // storage unavailable
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(resolveStoredTheme);

  useEffect(() => {
    const applyTheme = (t: Theme) => {
      const root = document.documentElement;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = t === 'dark' || (t === 'system' && prefersDark);

      root.setAttribute('data-theme', t === 'system' ? (isDark ? 'dark' : 'light') : t);
      root.classList.toggle('dark-mode', isDark);
      root.classList.remove('light-mode', 'dark-mode-lit', 'anilist-mode', 'catppuccin-mode');
      root.classList.add(`${t === 'system' ? (isDark ? 'dark' : 'light') : t}-mode`);

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        const key = t === 'system' ? (isDark ? 'dark' : 'light') : t;
        meta.setAttribute('content', THEME_META_COLORS[key] || '#080808');
      }
    };

    applyTheme(theme);
    // Persist like live (`useEffect(() => O.setTheme(i.name), [i.name])`):
    // runs on mount too, so legacy-only values (themePreference / flat keys)
    // land in the record for the pre-paint bootstrap to read next load.
    writeRecordTheme(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const toggleTheme = () => {
    const order: Theme[] = ['system', 'light', 'dark', 'anilist', 'catppuccin'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
