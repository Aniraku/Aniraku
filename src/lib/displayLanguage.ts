// Display-language resolution — backs the Settings → Display Language rows
// (Title Language / Character Name Language), which otherwise write to
// local component state and change nothing on screen.
//
// Reads the persisted `aniraku:settings` record synchronously (same pattern
// as the pre-paint theme bootstrap), so plain function calls — no hook —
// stay correct everywhere, including outside React render. Slugs must NEVER
// use these (link stability): slugs keep `pickTitle` in utils/animePaths.

export type TitleLanguage = 'english' | 'romaji' | 'native';
export type CharacterNameLanguage = 'romaji' | 'native';

const TITLE_VALUES: TitleLanguage[] = ['english', 'romaji', 'native'];
const CHARACTER_VALUES: CharacterNameLanguage[] = ['romaji', 'native'];

interface TitleLike {
  english?: string | null;
  romaji?: string | null;
  native?: string | null;
  userPreferred?: string | null;
}

function readStored(key: 'langTitle' | 'langCharacter'): string | null {
  try {
    const raw = window.localStorage.getItem('aniraku:settings');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      settings?: Record<string, unknown> | null;
    };
    const value = parsed?.settings?.[key];
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}

/** Stored title preference; defaults to English (live default). */
export function getTitleLanguage(): TitleLanguage {
  const stored = readStored('langTitle');
  const normalized = stored?.trim().toLowerCase();
  return TITLE_VALUES.includes(normalized as TitleLanguage)
    ? (normalized as TitleLanguage)
    : 'english';
}

/** Stored character-name preference; defaults to Romaji (live default). */
export function getCharacterNameLanguage(): CharacterNameLanguage {
  const stored = readStored('langCharacter');
  const normalized = stored?.trim().toLowerCase();
  return CHARACTER_VALUES.includes(normalized as CharacterNameLanguage)
    ? (normalized as CharacterNameLanguage)
    : 'romaji';
}

function firstNonEmpty(values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

/**
 * Display title honoring the stored Title Language preference.
 * Empty string when nothing usable — keep each call site's own fallback.
 */
export function resolveDisplayTitle(
  title: TitleLike | null | undefined,
): string {
  if (!title) return '';
  switch (getTitleLanguage()) {
    case 'native':
      return firstNonEmpty([title.native, title.english, title.romaji, title.userPreferred]);
    case 'romaji':
      return firstNonEmpty([title.romaji, title.english, title.native, title.userPreferred]);
    case 'english':
    default:
      return firstNonEmpty([title.english, title.romaji, title.native, title.userPreferred]);
  }
}

export interface CharacterNameLike {
  romaji?: string | null;
  full?: string | null;
  native?: string | null;
  userPreferred?: string | null;
}

/**
 * Character/staff display name honoring the stored Character Name Language
 * preference. AniList `full` is the romaji form.
 */
export function resolveCharacterName(
  name: CharacterNameLike | null | undefined,
): string {
  if (!name) return '';
  const romaji = name.romaji ?? name.full ?? name.userPreferred;
  if (getCharacterNameLanguage() === 'native') {
    return firstNonEmpty([name.native, romaji]);
  }
  return firstNonEmpty([romaji, name.native]);
}
