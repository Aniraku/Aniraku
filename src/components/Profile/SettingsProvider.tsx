import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Storage parity with live
//
// Live centralizes every preference in ONE namespaced JSON record:
//
//   localStorage['aniraku:settings'] = {
//     schemaVersion: 3,          // live `se`
//     theme: <ThemeName>,        // written by ThemeContext (not this provider)
//     settings: { ...user settings, live field names/defaults },
//   }
//
// Legacy keys are read once by migration (live `we()` semantics: a field is
// only filled while it's still `undefined` in the record):
//   - live:   'aniraku:settings:user' (JSON) -> record.settings
//   - local:  autoSkip / autoPlay / autoNext / defaultLanguage / defaultServers
//
// The public `useSettings()` shape is unchanged for consumers; the mapping
// between local names and live storage names happens here:
//   defaultLanguage <-> settings.langDefault   (live field name)
//   defaultServers  <-> settings.defaultServers (local-only extension)
// ---------------------------------------------------------------------------

const SETTINGS_RECORD = 'aniraku:settings';
const LEGACY_LIVE_USER_SETTINGS = 'aniraku:settings:user';
const SCHEMA_VERSION = 3; // live `se`

/** Exact live settings payload (`ne`/`Ge` in the bundle) + one local-only field. */
type StoredSettings = {
  langDefault: string;
  langTitle: string;
  langCharacter: string;
  ratingSource: string;
  watchOnHome: string;
  hideSpoiler: boolean;
  syncThreshold: number;
  autoSync: boolean;
  autoSyncList: boolean;
  autoSkip: boolean;
  autoPlay: boolean;
  autoNext: boolean;
  defaultProvider: string;
  watchOrInfo: string;
  accentColor: string;
  borderRadius: number;
  cardLayout: string;
  cardSize: string;
  listLayout: string;
  comments: boolean;
  /** Local-only extension: live has no default-server preference. */
  defaultServers: string;
};

// live `c()` — coarse-pointer check used for the borderRadius default
const isCoarsePointer =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches;

/** Exact live defaults (borderRadius: c() ? 1 : .5). */
const LIVE_DEFAULTS: StoredSettings = {
  langDefault: 'sub',
  langTitle: 'English',
  langCharacter: 'Romaji',
  ratingSource: 'Anilist',
  watchOnHome: 'Show',
  hideSpoiler: false,
  syncThreshold: 80,
  autoSync: true,
  autoSyncList: false,
  autoSkip: true,
  autoPlay: false,
  autoNext: true,
  defaultProvider: '',
  watchOrInfo: 'watch',
  accentColor: '#b5a8ff',
  borderRadius: isCoarsePointer ? 1 : 0.5,
  cardLayout: 'classic',
  cardSize: 'medium',
  listLayout: 'auto',
  comments: true,
  defaultServers: 'Default',
};

// Valid value sets enforced live-side (index.js `xt` provider validation)
const CARD_LAYOUTS = ['classic', 'anichart', 'cardlist'];
const CARD_SIZES = ['large', 'medium'];
const LIST_LAYOUTS = ['auto', 'list', 'grid', 'imageList'];

function readRecord(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(SETTINGS_RECORD);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** live `$m` boolean coercion ('Enabled'/'true' -> true). */
function normBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  return value === 'Enabled' || value === 'true';
}

/** Flat local keys from builds that predate the unified record. */
function readLegacyFlatSettings(): Record<string, unknown> {
  const legacy: Record<string, unknown> = {};
  const boolKey = (key: string, field: keyof StoredSettings) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) legacy[field] = raw === 'true';
    } catch {
      // storage unavailable
    }
  };
  boolKey('autoSkip', 'autoSkip');
  boolKey('autoPlay', 'autoPlay');
  boolKey('autoNext', 'autoNext');
  try {
    const lang = localStorage.getItem('defaultLanguage');
    if (lang) legacy.langDefault = lang;
    const servers = localStorage.getItem('defaultServers');
    if (servers) legacy.defaultServers = servers;
  } catch {
    // storage unavailable
  }
  return legacy;
}

/**
 * Mirrors live's `we()` migration for the settings record: fill `settings`
 * from legacy sources only while the field is undefined (`live W` semantics),
 * stamp `schemaVersion`, persist once. `theme` is left untouched — ThemeContext
 * owns it and both writers merge into the same record.
 */
function migrateSettingsRecord(): Record<string, unknown> {
  const record = readRecord();
  if (record.schemaVersion !== SCHEMA_VERSION) {
    if (record.settings === undefined) {
      const liveLegacy = readJson(LEGACY_LIVE_USER_SETTINGS);
      const base: Record<string, unknown> = isPlainObject(liveLegacy)
        ? { ...liveLegacy }
        : {};
      // local flat keys only fill fields the live legacy payload didn't provide
      const flat = readLegacyFlatSettings();
      for (const [field, value] of Object.entries(flat)) {
        if (base[field] === undefined) base[field] = value;
      }
      record.settings = base;
    }
    record.schemaVersion = SCHEMA_VERSION;
    try {
      localStorage.setItem(SETTINGS_RECORD, JSON.stringify(record));
    } catch {
      // storage unavailable — keep going with in-memory defaults
    }
  }
  return record;
}

/** Merge record payload over live defaults with live's validation rules. */
function buildStoredSettings(): StoredSettings {
  const record = migrateSettingsRecord();
  const stored: Partial<StoredSettings> = isPlainObject(record.settings)
    ? (record.settings as Partial<StoredSettings>)
    : {};

  // live `xt` validation of enum-ish fields + accentColor fallback
  const cardLayout =
    typeof stored.cardLayout === 'string' &&
    CARD_LAYOUTS.includes(stored.cardLayout)
      ? stored.cardLayout
      : LIVE_DEFAULTS.cardLayout;
  const cardSize =
    typeof stored.cardSize === 'string' && CARD_SIZES.includes(stored.cardSize)
      ? stored.cardSize
      : LIVE_DEFAULTS.cardSize;
  const listLayout =
    typeof stored.listLayout === 'string' &&
    LIST_LAYOUTS.includes(stored.listLayout)
      ? stored.listLayout
      : LIVE_DEFAULTS.listLayout;
  const borderRadius =
    typeof stored.borderRadius === 'number' &&
    stored.borderRadius >= 0 &&
    stored.borderRadius <= 1
      ? stored.borderRadius
      : LIVE_DEFAULTS.borderRadius;
  const accentColor =
    (typeof stored.accentColor === 'string' && stored.accentColor) ||
    LIVE_DEFAULTS.accentColor;

  const threshold = Number(stored.syncThreshold);

  return {
    ...LIVE_DEFAULTS,
    ...stored,
    // validated / coerced fields win over the raw spread
    langDefault: stored.langDefault === 'dub' ? 'dub' : 'sub',
    accentColor,
    borderRadius,
    cardLayout,
    cardSize,
    listLayout,
    syncThreshold: Number.isFinite(threshold)
      ? threshold
      : LIVE_DEFAULTS.syncThreshold,
    hideSpoiler: normBool(stored.hideSpoiler, LIVE_DEFAULTS.hideSpoiler),
    autoSync: normBool(stored.autoSync, LIVE_DEFAULTS.autoSync),
    autoSyncList: normBool(stored.autoSyncList, LIVE_DEFAULTS.autoSyncList),
    autoSkip: normBool(stored.autoSkip, LIVE_DEFAULTS.autoSkip),
    autoPlay: normBool(stored.autoPlay, LIVE_DEFAULTS.autoPlay),
    autoNext: normBool(stored.autoNext, LIVE_DEFAULTS.autoNext),
    comments: normBool(stored.comments, LIVE_DEFAULTS.comments),
    defaultServers:
      typeof stored.defaultServers === 'string' && stored.defaultServers
        ? stored.defaultServers
        : LIVE_DEFAULTS.defaultServers,
  } as StoredSettings;
}

/** Local (public) settings names -> live storage field names. */
function toStoredPatch(
  patch: Partial<SettingsContextType['settings']>,
): Partial<StoredSettings> {
  const stored: Partial<StoredSettings> = {};
  if ('autoSkip' in patch)
    stored.autoSkip = normBool(patch.autoSkip, LIVE_DEFAULTS.autoSkip);
  if ('autoPlay' in patch)
    stored.autoPlay = normBool(patch.autoPlay, LIVE_DEFAULTS.autoPlay);
  if ('autoNext' in patch)
    stored.autoNext = normBool(patch.autoNext, LIVE_DEFAULTS.autoNext);
  if ('defaultLanguage' in patch)
    stored.langDefault = patch.defaultLanguage === 'dub' ? 'dub' : 'sub';
  if ('defaultServers' in patch)
    stored.defaultServers = patch.defaultServers || 'Default';
  return stored;
}

// Define the type for the context state
interface SettingsContextType {
  settings: {
    autoSkip: boolean;
    autoPlay: boolean;
    autoNext: boolean;
    defaultLanguage: string;
    defaultServers: string;
  };
  setSettings: (settings: Partial<SettingsContextType['settings']>) => void;
}

// Create the context with a default value
const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  // full live-shaped payload kept in state; the exposed value is mapped below
  const [stored, setStored] = useState<StoredSettings>(buildStoredSettings);

  useEffect(() => {
    // Persist into the unified record (live `O.set(A.USER_SETTINGS, r)`):
    // merge-write over the FRESH record (not a blind replace) so unknown
    // fields written by a newer bundle (or another tab) survive — a stale
    // writer must never delete settings it doesn't know about. Runs on
    // mount too, so a fresh install lands `aniraku:settings` for the
    // pre-paint bootstrap to read next load.
    try {
      const record = readRecord();
      const prevSettings = isPlainObject(record.settings)
        ? (record.settings as Record<string, unknown>)
        : {};
      record.settings = { ...prevSettings, ...stored };
      if (record.schemaVersion === undefined) {
        record.schemaVersion = SCHEMA_VERSION;
      }
      localStorage.setItem(SETTINGS_RECORD, JSON.stringify(record));
    } catch {
      // storage unavailable
    }
  }, [stored]);

  const setSettings = (
    newSettings: Partial<SettingsContextType['settings']>,
  ) => {
    const patch = toStoredPatch(newSettings);
    setStored((prev) => ({ ...prev, ...patch }));
  };

  const settings: SettingsContextType['settings'] = {
    autoSkip: stored.autoSkip,
    autoPlay: stored.autoPlay,
    autoNext: stored.autoNext,
    defaultLanguage: stored.langDefault,
    defaultServers: stored.defaultServers,
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
