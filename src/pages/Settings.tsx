import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { FaCat, FaDesktop, FaLeaf, FaMoon, FaSun } from 'react-icons/fa6';
import {
  FaBookmark,
  FaCheck,
  FaHistory,
  FaKey,
  FaLink,
  FaLock,
  FaSignOutAlt,
  FaSync,
  FaTrash,
  FaUnlink,
} from 'react-icons/fa';
import { useSettings } from '../components/Profile/SettingsProvider';
import { useTheme } from '../components/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useNsfw } from '../hooks/useNsfw';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toaster';
import ProviderIcon from '../components/ProviderIcon';
import {
  LOCAL_HISTORY_KEYS,
  clearWatchHistory,
  publishWatchHistory,
  readLocalHistoryRows,
  type HistoryRow,
} from '../lib/watchHistory';
import {
  ANIRAKU_BOOKMARKS_KEY,
  BOOKMARKS_KEY,
  EPISODE_TRACK_KEY,
  PROVIDER_LABELS,
  getSyncStatus,
  readLocalBookmarks,
  syncAuthorize,
  syncDisconnect,
  upsertHistoryRows,
  writeLocalBookmarks,
  type BookmarkEntry,
  type SyncStatus,
} from '../lib/sync';

// ---------------------------------------------------------------------------
// Settings — page module (mirrors the visual language of the settings modal
// in components/Profile/Settings.tsx: same styled shells + `--global-*` vars,
// copy ported from old Aniraku `src/pages/Settings.jsx` where it exists).
//
// Features added here beyond the modal copy:
//  1. Clear Bookmarks (two-step confirm) over the shared bookmark data layer
//     (`aniraku:bookmarks` + legacy `aniraku-bookmarks` locally, `bookmarks`
//     table server-side when signed in).
//  2. Inline page-local Undo (8s) after Clear Bookmarks / Clear Watch History
//     — delete-then-reinsert through the same data layer.
//  3. Two-step confirm on Clear Watch History (red armed label, auto-reverts
//     after ~4s).
//  4. Danger Zone → Delete Account: same `delete_my_account` RPC old Aniraku
//     called on this Supabase project, with an honest best-effort fallback
//     (delete every row this app writes, then sign out) + limitation copy.
//  5. Account rows: email / Email verified yes-no / Member since / Sign Out,
//     sourced from the Supabase session + `profiles`.
// ---------------------------------------------------------------------------

// Local mirror of ThemeContext's theme union (same reason as the modal:
// ThemeContext no longer exports its mode type).
type ThemeMode = 'system' | 'light' | 'dark' | 'anilist' | 'catppuccin';

interface Preferences {
  defaultLanguage: string;
  titleLanguage: string;
  characterNameLanguage: string;
  openKeyboardShortcuts: string;
  autoskipIntroOutro: string;
  autoPlay: string;
  autoNext: string;
  restoreDefaultPreferences: string;
  clearContinueWatching: string;
  openButton: string;
}

interface Option {
  value: string;
  label: string;
}

interface RowConfig {
  key: keyof Preferences;
  label: string;
  description: string;
  options?: Option[];
  action?: 'shortcuts';
}

const Goback = styled.div`
  border-radius: var(--global-border-radius);
  display: flex;
  cursor: pointer;
  justify-content: center;
  align-items: center;
  background-color: var(--global-div);
  color: var(--global-text);
  width: 3rem;
  margin-right: 0.75rem;
  border: 1px solid var(--global-border-color);
  &:hover {
    background-color: var(--global-button-hover-bg);
  }
  &:active {
    transform: scale(0.975);
  }
`;

const SettingsDiv = styled.div`
  gap: 1rem;
  max-width: 45rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto;
  width: 100%;
`;

const Title = styled.h2`
  display: flex;
  align-items: center;
  color: var(--global-text-muted);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0rem;
  margin-top: 1rem;
`;

const PreferencesTable = styled.div`
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  width: 100%;
  padding: 0.5rem 1rem 1rem;
`;

const SectionTitle = styled.h3`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--global-text-muted);
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  margin: 1rem 0 0.5rem;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--global-border-color);

  &:last-child {
    border-bottom: none;
  }
`;

const RowLabel = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
`;

const RowTitle = styled.span`
  color: var(--global-text);
  font-size: 0.9rem;
`;

const RowDescription = styled.span`
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.35;
  color: var(--global-text-muted);
`;

const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr));
  gap: 0.6rem;
  padding: 0.5rem 0;
`;

const ThemeCard = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  background: ${({ $active }) =>
    $active ? 'var(--primary-accent-bg)' : 'var(--global-tertiary-bg)'};
  color: ${({ $active }) =>
    $active ? 'var(--global-text)' : 'var(--global-text-muted)'};
  border: 1px solid
    ${({ $active }) =>
      $active ? 'var(--primary-accent)' : 'var(--global-border-color)'};
  border-radius: var(--global-border-radius);
  font-family: var(--app-font-family);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.8rem 0.4rem;
  cursor: pointer;
  transition: 0.15s ease;

  svg {
    font-size: 1.2rem;
  }

  &:hover {
    background: ${({ $active }) =>
      $active ? 'var(--primary-accent-bg)' : 'var(--global-button-hover-bg)'};
    color: var(--global-text);
  }
  &:active {
    transform: scale(0.97);
  }
`;

const StyledButton = styled.button<{ $danger?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  background: var(--global-tertiary-bg);
  color: ${({ $danger }) => ($danger ? '#e5484d' : 'var(--global-text)')};
  padding: 0.4rem 0.9rem;
  cursor: pointer;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  font-family: var(--app-font-family);
  font-size: 0.8rem;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: var(--global-button-hover-bg);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StyledSelect = styled.select`
  background: var(--global-tertiary-bg);
  color: var(--global-text);
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  font-family: var(--app-font-family);
  transition: background-color 0.2s ease-in-out;
`;

const StyledInput = styled.input`
  background: var(--global-tertiary-bg);
  color: var(--global-text);
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  font-family: var(--app-font-family);
  font-size: 0.8rem;
  transition: background-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
  }
`;

const Badge = styled.span<{ $ok: boolean }>`
  display: inline-block;
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  color: ${({ $ok }) => ($ok ? '#4ade80' : 'var(--global-text-muted)')};
  background: ${({ $ok }) =>
    $ok ? 'rgba(74, 222, 128, 0.12)' : 'var(--global-tertiary-bg)'};
  border: 1px solid
    ${({ $ok }) =>
      $ok ? 'rgba(74, 222, 128, 0.35)' : 'var(--global-border-color)'};
`;

// ── Danger Zone (no --global-danger var exists in themes.css — #e5484d is
// the danger accent already used by the modal's $danger styles) ────────────
const DangerTable = styled(PreferencesTable)`
  border-color: rgba(229, 72, 77, 0.4);
`;

const DangerTitle = styled(SectionTitle)`
  color: #e5484d;
`;

const DangerBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  background: rgba(229, 72, 77, 0.12);
  border: 1px solid rgba(229, 72, 77, 0.45);
  border-radius: var(--global-border-radius);
  color: #e5484d;
  font-family: var(--app-font-family);
  font-size: 0.8rem;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: rgba(229, 72, 77, 0.2);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DangerInput = styled(StyledInput)`
  max-width: 15rem;

  &:focus {
    border-color: #e5484d;
  }
`;

const DangerMsg = styled.span`
  font-size: 0.75rem;
  color: #e5484d;
  line-height: 1.35;
  margin-top: 0.5rem;
`;

// Page-local inline Undo strip (task: undo affordance lives on the page, not
// in a toast action). Appears under the Data rows for the undo window.
const UndoBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
  padding: 0.6rem 0.8rem;
  background: var(--global-tertiary-bg);
  border: 1px solid var(--primary-accent);
  border-radius: var(--global-border-radius);
`;

const UndoText = styled.span`
  font-size: 0.8rem;
  color: var(--global-text);
`;

const THEME_CARDS: {
  mode: ThemeMode;
  icon: React.ReactNode;
  label: string;
}[] = [
  { mode: 'system', icon: <FaDesktop />, label: 'System' },
  { mode: 'light', icon: <FaSun />, label: 'Light' },
  { mode: 'dark', icon: <FaMoon />, label: 'Dark' },
  { mode: 'anilist', icon: <FaLeaf />, label: 'AniList' },
  { mode: 'catppuccin', icon: <FaCat />, label: 'Catppuccin' },
];

const YES_NO: Option[] = [
  { value: 'Disabled', label: 'No' },
  { value: 'Enabled', label: 'Yes' },
];

const DISPLAY_LANGUAGE_ROWS: RowConfig[] = [
  {
    key: 'titleLanguage',
    label: 'Title Language',
    description: 'Choose the language format for titles.',
    options: [
      { value: 'English (Attack on Titan)', label: 'English (Attack on Titan)' },
      {
        value: 'Romaji (Shingeki no Kyojin)',
        label: 'Romaji (Shingeki no Kyojin)',
      },
      { value: 'Native (進撃の巨人)', label: 'Native (進撃の巨人)' },
    ],
  },
  {
    key: 'characterNameLanguage',
    label: 'Character Name Language',
    description: 'Select the language format for character names.',
    options: [
      { value: 'Romaji (Zoldyck Killua)', label: 'Romaji (Zoldyck Killua)' },
      {
        value: 'Native (キルア=ゾルディック)',
        label: 'Native (キルア=ゾルディック)',
      },
    ],
  },
];

const MEDIA_ROWS: RowConfig[] = [
  {
    key: 'defaultLanguage',
    label: 'Default Language',
    description: 'Set the default language for media playback.',
    options: [
      { value: 'sub', label: 'Subtitles' },
      { value: 'dub', label: 'Dubbing' },
    ],
  },
  {
    key: 'autoskipIntroOutro',
    label: 'Auto Skip Intro/Outro',
    description: 'Automatically skip intros and outros.',
    options: YES_NO,
  },
  {
    key: 'autoPlay',
    label: 'Auto Play',
    description: 'Enable auto play for media.',
    options: YES_NO,
  },
  {
    key: 'autoNext',
    label: 'Auto Next Episode',
    description:
      'Automatically advance to the next episode when the current one ends.',
    options: YES_NO,
  },
];

const OTHER_ROWS: RowConfig[] = [
  {
    key: 'openKeyboardShortcuts',
    label: 'Keyboard Shortcuts',
    description: 'Configure keyboard shortcuts for the application.',
    action: 'shortcuts',
    options: [{ value: 'Open', label: 'Open' }],
  },
];

// Undo windows (task spec): ~4s armed confirm, 8s undo, then the deleted
// rows are gone for good (deletes already committed — undo reinserts).
const ARM_WINDOW_MS = 4000;
const UNDO_WINDOW_MS = 8000;

type UndoSnapshot =
  | { kind: 'bookmarks'; entries: BookmarkEntry[]; count: number }
  | { kind: 'history'; rows: HistoryRow[]; raw: Record<string, string | null>; count: number };

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { settings, setSettings } = useSettings();
  const { theme: themeMode, setTheme } = useTheme();

  // Supabase session + profiles row from the Wave A AuthProvider (the same
  // source Aniraku's useAuth exposed: email, verification, created_at,
  // signOut). null context = rendered outside the provider → treat as guest.
  const auth = useAuth();
  const user = auth?.user ?? null;
  const profile = auth?.profile ?? null;

  // ── NSFW toggle (Aniraku Settings Content card) ─────────────────────────
  const { nsfwEnabled, updateNsfw } = useNsfw();
  const [nsfwSaving, setNsfwSaving] = useState(false);

  // ── MAL / AniList watch-progress sync (Aniraku Settings.jsx:455-521) ──
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncBusy, setSyncBusy] = useState<Record<string, boolean>>({});
  const [syncVersion, setSyncVersion] = useState(0);
  const [syncCheckedAt, setSyncCheckedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void getSyncStatus().then((data) => {
      if (cancelled) return;
      if (data) setSyncStatus(data);
      setSyncCheckedAt(Date.now());
    });
    return () => {
      cancelled = true;
    };
  }, [user, syncVersion]);

  const syncProviderStatus = (provider: string) => {
    const status = syncStatus?.[provider];
    return {
      connected: Boolean(status?.connected),
      username: status?.username || '',
      reason: status?.reason || '',
      expiresAt: status?.expires_at || 0,
    };
  };

  const connectedProviders = syncStatus
    ? Object.keys(PROVIDER_LABELS).filter(
        (provider) => syncProviderStatus(provider).connected,
      )
    : [];

  const tokenHealth = (expiresAt: number): string => {
    if (!expiresAt) return '';
    const daysLeft = Math.floor((expiresAt - Date.now() / 1000) / 86400);
    if (daysLeft > 30) return `token valid ~${Math.floor(daysLeft / 30)}mo`;
    if (daysLeft > 0) return `token expires in ${daysLeft}d`;
    return 'token expired — progress will refresh it automatically';
  };

  // Aniraku fetches the authorize URL first (a bare redirect can't carry the
  // Bearer header), then hands the browser off — SAME TAB (location.href).
  const handleConnect = async (provider: string): Promise<void> => {
    if (syncBusy[provider]) return;
    setSyncBusy((busy) => ({ ...busy, [provider]: true }));
    try {
      const url = await syncAuthorize(provider);
      if (!url) {
        showToast('Sync is not set up on the server yet', {
          type: 'warning',
        });
        return;
      }
      window.location.href = url;
    } finally {
      setSyncBusy((busy) => ({ ...busy, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider: string): Promise<void> => {
    if (syncBusy[provider]) return;
    setSyncBusy((busy) => ({ ...busy, [provider]: true }));
    const ok = await syncDisconnect(provider);
    setSyncBusy((busy) => ({ ...busy, [provider]: false }));
    if (ok) {
      setSyncVersion((version) => version + 1);
      showToast(`${PROVIDER_LABELS[provider]} disconnected`, {
        type: 'success',
      });
    } else {
      showToast('Could not disconnect — try again', { type: 'error' });
    }
  };

  // ── Change password (Aniraku Settings.jsx:523-549) ──
  const canChangePassword = Boolean(user?.email);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState('');

  const handlePassword = async (): Promise<void> => {
    if (pw.length < 6) {
      setPwErr('Password must be at least 6 characters');
      return;
    }
    if (pw !== pw2) {
      setPwErr('Passwords do not match');
      return;
    }
    setPwBusy(true);
    setPwErr('');
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setPwOpen(false);
      setPw('');
      setPw2('');
      showToast('Password updated', { type: 'success' });
    } catch (err) {
      console.error('Update password:', err);
      setPwErr(
        err instanceof Error && err.message
          ? err.message
          : 'Could not update password',
      );
    } finally {
      setPwBusy(false);
    }
  };

  // Aniraku handleNsfwToggle (Settings.jsx:408-420).
  const handleNsfwToggle = async (next: boolean): Promise<void> => {
    if (nsfwSaving) return;
    setNsfwSaving(true);
    try {
      await updateNsfw(next);
      showToast(next ? 'NSFW content enabled' : 'NSFW content hidden', {
        type: 'success',
      });
    } catch (err) {
      console.error('Save NSFW setting:', err);
      showToast('Could not save — check your connection and try again', {
        type: 'error',
      });
    } finally {
      setNsfwSaving(false);
    }
  };

  const [preferences, setPreferences] = useState<Preferences>({
    defaultLanguage: settings.defaultLanguage,
    titleLanguage: 'Romaji (Shingeki no Kyojin)',
    characterNameLanguage: 'Romaji (Zoldyck Killua)',
    openKeyboardShortcuts: 'Open',
    autoskipIntroOutro: settings.autoSkip ? 'Enabled' : 'Disabled',
    autoPlay: settings.autoPlay ? 'Enabled' : 'Disabled',
    autoNext: settings.autoNext ? 'Enabled' : 'Disabled',
    restoreDefaultPreferences: 'Restore',
    clearContinueWatching: 'Clear',
    openButton: 'Open',
  });

  useEffect(() => {
    setPreferences((prev) => ({
      ...prev,
      defaultLanguage: settings.defaultLanguage,
      autoskipIntroOutro: settings.autoSkip ? 'Enabled' : 'Disabled',
      autoPlay: settings.autoPlay ? 'Enabled' : 'Disabled',
      autoNext: settings.autoNext ? 'Enabled' : 'Disabled',
    }));
  }, [settings]);

  const handlePreferenceChange = (
    preferenceName: keyof Preferences,
    value: string,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [preferenceName]: value,
    }));

    switch (preferenceName) {
      case 'autoskipIntroOutro':
        setSettings({ autoSkip: value === 'Enabled' });
        break;
      case 'autoPlay':
        setSettings({ autoPlay: value === 'Enabled' });
        break;
      case 'autoNext':
        setSettings({ autoNext: value === 'Enabled' });
        break;
      case 'defaultLanguage':
        setSettings({ defaultLanguage: value });
        break;
    }
  };

  const handleRestoreDefaults = () => {
    setSettings({
      autoSkip: true,
      autoPlay: false,
      autoNext: true,
      defaultLanguage: 'sub',
    });
    setTheme('system');
    setPreferences({
      defaultLanguage: 'sub',
      titleLanguage: 'Romaji (Shingeki no Kyojin)',
      characterNameLanguage: 'Romaji (Zoldyck Killua)',
      openKeyboardShortcuts: 'Open',
      autoskipIntroOutro: 'Enabled',
      autoPlay: 'Disabled',
      autoNext: 'Enabled',
      restoreDefaultPreferences: 'Restore',
      clearContinueWatching: 'Clear',
      openButton: 'Open',
    });
  };

  const handleGoback = () => {
    navigate('/profile');
  };

  const handleSignOut = async (): Promise<void> => {
    if (!auth) return;
    try {
      await auth.signOut();
      showToast('Signed out', { type: 'success' });
      navigate('/');
    } catch (err) {
      console.error('Sign out:', err);
      showToast('Could not sign out — try again', { type: 'error' });
    }
  };

  // ── Data card: two-step confirms + inline Undo ─────────────────────────
  // Undo strategy (task): DELETE-THEN-REINSERT through the same data layer.
  // The clear commits immediately (server rows + localStorage); the removed
  // rows stay in memory for UNDO_WINDOW_MS so the inline Undo button can
  // reinsert them. When the window expires the snapshot is dropped — the
  // delete simply stands.
  const [clearing, setClearing] = useState<'' | 'history' | 'bookmarks'>('');
  const [clearArm, setClearArm] = useState<'' | 'history' | 'bookmarks'>('');
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [undo, setUndo] = useState<UndoSnapshot | null>(null);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  useEffect(
    () => () => {
      if (armTimer.current) clearTimeout(armTimer.current);
    },
    [],
  );

  const disarmClear = (): void => {
    setClearArm('');
    if (armTimer.current) {
      clearTimeout(armTimer.current);
      armTimer.current = null;
    }
  };

  // First click arms the red confirm button; auto-reverts after ~4s.
  const armClear = (target: 'history' | 'bookmarks'): void => {
    if (clearing) return;
    if (armTimer.current) clearTimeout(armTimer.current);
    setClearArm(target);
    armTimer.current = setTimeout(() => {
      setClearArm('');
      armTimer.current = null;
    }, ARM_WINDOW_MS);
  };

  // The bookmark store is a module singleton fed by same-tab `storage`
  // events never fired by this tab's own writes — mirror our writes with a
  // synthetic event so any mounted consumer refreshes immediately.
  const broadcastBookmarks = (): void => {
    try {
      window.dispatchEvent(new StorageEvent('storage', { key: BOOKMARKS_KEY }));
    } catch {
      // StorageEvent constructor unavailable — cross-tab sync still works
      // through the real localStorage writes themselves.
    }
  };

  const handleClearHistory = async (): Promise<void> => {
    if (clearing) return;
    setClearing('history');
    try {
      // Snapshot the native stores (raw strings so restore is byte-exact)
      // plus the normalized rows for the server-side reinsert.
      const snapshotKeys: string[] = [
        ...Object.values(LOCAL_HISTORY_KEYS),
        EPISODE_TRACK_KEY,
        'aniraku-episode-track',
      ];
      const raw: Record<string, string | null> = {};
      for (const key of snapshotKeys) {
        try {
          raw[key] = localStorage.getItem(key);
        } catch {
          raw[key] = null;
        }
      }
      const rows = readLocalHistoryRows();

      await clearWatchHistory({ userId: user?.id ?? null });
      // Aniraku also dropped the episode-progress tracker with history
      // (Settings.jsx:563 removeLocalKey('aniraku-episode-track')).
      try {
        localStorage.removeItem(EPISODE_TRACK_KEY);
        localStorage.removeItem('aniraku-episode-track');
      } catch {
        // storage unavailable
      }

      disarmClear();
      if (rows.length > 0) {
        setUndo({ kind: 'history', rows, raw, count: rows.length });
      }
      showToast('Watch history cleared (Undo available)', { type: 'success' });
    } catch (err) {
      console.error('Clear watch history:', err);
      showToast('Could not clear history — try again', { type: 'error' });
    } finally {
      setClearing('');
    }
  };

  const handleClearBookmarks = async (): Promise<void> => {
    if (clearing) return;
    setClearing('bookmarks');
    try {
      // Union of both local keys — this is exactly what every bookmark
      // reader (cards, Info sidebar, merge-on-login) sees.
      const entries = readLocalBookmarks();
      const userId = user?.id ?? null;
      if (userId) {
        // Server-first, mirroring old Aniraku handleClearBookmarks — a failed
        // server delete aborts before touching local data.
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId);
        if (error) throw error;
      }
      writeLocalBookmarks([]);
      try {
        // Legacy import key too, or the next merge-on-login resurrects rows.
        localStorage.removeItem(ANIRAKU_BOOKMARKS_KEY);
      } catch {
        // storage unavailable
      }
      broadcastBookmarks();

      disarmClear();
      if (entries.length > 0) {
        setUndo({ kind: 'bookmarks', entries, count: entries.length });
      }
      showToast('Bookmarks cleared (Undo available)', { type: 'success' });
    } catch (err) {
      console.error('Clear bookmarks:', err);
      showToast('Could not clear bookmarks — try again', { type: 'error' });
    } finally {
      setClearing('');
    }
  };

  const handleUndo = async (): Promise<void> => {
    if (!undo) return;
    const snapshot = undo;
    setUndo(null);

    if (snapshot.kind === 'bookmarks') {
      try {
        writeLocalBookmarks(snapshot.entries);
        broadcastBookmarks();
        const userId = user?.id ?? null;
        if (userId) {
          // Same batch upsert shape as sync.ts mergeBookmarksOnLogin.
          const { error } = await supabase.from('bookmarks').upsert(
            snapshot.entries.map((entry) => ({
              user_id: userId,
              anime_id: entry.id,
              title: entry.title || '',
              image: entry.image || '',
              added_at: entry.added_at ?? Date.now(),
            })),
            { onConflict: 'user_id,anime_id' },
          );
          if (error) throw error;
        }
        showToast('Bookmarks restored', { type: 'success' });
      } catch (err) {
        console.error('Undo bookmarks:', err);
        showToast('Bookmarks restored on this device only', {
          type: 'warning',
        });
      }
      return;
    }

    // History: byte-exact raw restore, then notify same-tab subscribers and
    // re-upload the normalized rows (next merge-on-login would do it anyway).
    for (const [key, value] of Object.entries(snapshot.raw)) {
      try {
        if (value !== null) localStorage.setItem(key, value);
        else localStorage.removeItem(key);
      } catch {
        // storage unavailable
      }
    }
    publishWatchHistory({ type: 'sync', keys: [] });
    const userId = user?.id ?? null;
    if (userId && snapshot.rows.length > 0) {
      try {
        await upsertHistoryRows(userId, snapshot.rows);
      } catch {
        // upsertHistoryRows swallows per-chunk failures; local restore stands
      }
    }
    showToast('Watch history restored', { type: 'success' });
  };

  // ── Danger Zone: delete account ─────────────────────────────────────────
  const [confirmArmed, setConfirmArmed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  // Old Aniraku clearAnirakuStorage — wipe ONLY what this app owns, never
  // localStorage wholesale (other apps share the origin on the live site).
  const wipeAppLocalStorage = (): void => {
    try {
      const native: string[] = Object.values(LOCAL_HISTORY_KEYS);
      const victims: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (
          key.startsWith('aniraku-') ||
          key.startsWith('aniraku:') ||
          key.startsWith('miruro:') || // legacy pre-swap keys (own backup data)
          key.startsWith('sb-') ||
          native.includes(key)
        ) {
          victims.push(key);
        }
      }
      victims.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage may be unavailable — cleanup remains best effort.
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!auth || !user || confirmText !== 'DELETE' || deleting) return;
    setDeleting(true);
    setDeleteErr('');

    try {
      // Old Aniraku (Settings.jsx:428) called this RPC from the browser with
      // the anon key on this same Supabase project — when the server exposes
      // it, it removes the auth user and everything attached.
      let rpcOk = false;
      try {
        const { error } = await supabase.rpc('delete_my_account');
        rpcOk = !error;
      } catch (err) {
        console.error('delete_my_account rpc:', err);
        rpcOk = false;
      }

      let wipedClean = true;
      if (!rpcOk) {
        // Honest best-effort fallback (browser client cannot delete auth
        // rows): remove every row THIS app writes, then sign out. The
        // confirmation copy already warned that the login record itself may
        // remain when the server function is unavailable.
        const uid = user.id;
        const step = async (
          request: PromiseLike<{ error: { message: string } | null }>,
        ): Promise<string | null> => {
          try {
            const { error } = await request;
            return error ? error.message : null;
          } catch (err) {
            return err instanceof Error ? err.message : 'request failed';
          }
        };
        const failures: string[] = [];
        const attempts = [
          await step(supabase.from('profiles').delete().eq('id', uid)),
          await step(
            supabase.from('watch_history').delete().eq('user_id', uid),
          ),
          await step(supabase.from('bookmarks').delete().eq('user_id', uid)),
          await step(
            supabase.from('user_settings').delete().eq('user_id', uid),
          ),
          await step(
            supabase.from('notifications').delete().eq('user_id', uid),
          ),
        ];
        attempts.forEach((failure) => {
          if (failure) failures.push(failure);
        });
        wipedClean = failures.length === 0;
        if (failures.length) console.error('Delete account fallback:', failures);
      }

      wipeAppLocalStorage();
      // Persistent AuthProvider state must not keep the deleted user looking
      // signed in (Aniraku handleDelete: signOut after the server delete).
      await auth.signOut();

      if (!rpcOk && !wipedClean) {
        showToast(
          'Signed out — some account data could not be removed. Please contact support to finish deleting the account.',
          { type: 'warning', duration: 8000 },
        );
      } else if (!rpcOk) {
        showToast('Account data removed — you have been signed out', {
          type: 'success',
        });
      } else {
        showToast('Account deleted', { type: 'success' });
      }
      navigate('/');
    } catch (error) {
      console.error('Delete account:', error);
      setDeleteErr(
        error instanceof Error && error.message
          ? error.message
          : 'We could not delete your account. Please try again.',
      );
      setDeleting(false);
    }
  };

  const memberSince = profile?.created_at ?? user?.created_at ?? null;
  const emailVerified = Boolean(
    user && (user.email_confirmed_at || user.confirmed_at),
  );

  const renderRow = (row: RowConfig) => (
    <Row key={row.key}>
      <RowLabel>
        <RowTitle>{row.label}</RowTitle>
        {row.description && (
          <RowDescription>{row.description}</RowDescription>
        )}
      </RowLabel>
      {row.action === 'shortcuts' ? (
        <StyledButton
          onClick={() =>
            window.dispatchEvent(
              new KeyboardEvent('keydown', {
                key: '?',
                shiftKey: true,
              }),
            )
          }
        >
          {row.options?.[0]?.label ?? 'Open'}
        </StyledButton>
      ) : (
        <StyledSelect
          value={preferences[row.key as keyof Preferences]}
          onChange={(event) =>
            handlePreferenceChange(row.key as keyof Preferences, event.target.value)
          }
        >
          {row.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </StyledSelect>
      )}
    </Row>
  );

  const renderContentCard = () => (
    <PreferencesTable>
      <SectionTitle>Content</SectionTitle>
      <Row>
        <RowLabel>
          <RowTitle>
            {nsfwEnabled ? 'NSFW content shown' : 'NSFW content hidden'}
          </RowTitle>
          <RowDescription>
            Show adult-rated titles in browsing, search and recommendations.
          </RowDescription>
          <RowDescription>
            When disabled, adult titles are filtered from lists and their
            pages show a block screen. You can change this at any time.
          </RowDescription>
        </RowLabel>
        <StyledSelect
          value={nsfwEnabled ? 'Enabled' : 'Disabled'}
          disabled={nsfwSaving}
          onChange={(event) =>
            handleNsfwToggle(event.target.value === 'Enabled')
          }
          aria-label='NSFW content'
        >
          {YES_NO.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </StyledSelect>
      </Row>
      {nsfwSaving && (
        <Row>
          <RowLabel>
            <RowDescription>Saving to your account…</RowDescription>
          </RowLabel>
        </Row>
      )}
    </PreferencesTable>
  );

  const renderSyncCard = () => (
    <PreferencesTable>
      <SectionTitle>Library Sync</SectionTitle>
      <Row>
        <RowLabel>
          <RowDescription>
            Keep Aniraku in step with your MyAnimeList and AniList libraries.
            When you finish an episode here, your progress is pushed to every
            connected service automatically.
          </RowDescription>
        </RowLabel>
      </Row>
      {!user ? (
        <Row>
          <RowLabel>
            <RowTitle>
              <FaLock size={12} aria-hidden='true' /> Sync needs an account
            </RowTitle>
            <RowDescription>
              Log in to connect your library and push watch progress
              automatically.
            </RowDescription>
          </RowLabel>
          <StyledButton onClick={() => navigate('/login')}>
            Log in
          </StyledButton>
        </Row>
      ) : (
        <>
          {(['mal', 'anilist'] as const).map((provider) => {
            const { connected, username, reason, expiresAt } =
              syncProviderStatus(provider);
            const busy = Boolean(syncBusy[provider]);
            return (
              <Row key={provider}>
                <RowLabel>
                  <RowTitle
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <ProviderIcon provider={provider} size={16} />
                    <span>{PROVIDER_LABELS[provider]}</span>
                    <Badge $ok={connected}>
                      {connected ? 'Connected' : 'Off'}
                    </Badge>
                  </RowTitle>
                  {connected && username && (
                    <RowDescription>Syncing as {username}</RowDescription>
                  )}
                  {connected && (
                    <RowDescription>{tokenHealth(expiresAt)}</RowDescription>
                  )}
                  {!connected && reason && (
                    <RowDescription style={{ color: '#fca5a5' }}>
                      {reason}
                    </RowDescription>
                  )}
                </RowLabel>
                {connected ? (
                  <StyledButton
                    disabled={busy}
                    onClick={() => handleDisconnect(provider)}
                  >
                    <FaUnlink size={11} aria-hidden='true' />{' '}
                    {busy ? 'Disconnecting…' : 'Disconnect'}
                  </StyledButton>
                ) : (
                  <StyledButton
                    disabled={busy}
                    onClick={() => handleConnect(provider)}
                  >
                    <FaLink size={11} aria-hidden='true' /> Connect
                  </StyledButton>
                )}
              </Row>
            );
          })}
          <Row>
            <RowLabel>
              <RowTitle>
                {connectedProviders.length
                  ? `${connectedProviders.length} service${connectedProviders.length > 1 ? 's' : ''} connected`
                  : 'No services connected yet'}
              </RowTitle>
              <RowDescription>
                {syncCheckedAt
                  ? `Checked ${new Date(syncCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Checking status…'}
              </RowDescription>
            </RowLabel>
            <StyledButton onClick={() => setSyncVersion((version) => version + 1)}>
              <FaSync size={11} aria-hidden='true' /> Refresh
            </StyledButton>
          </Row>
        </>
      )}
      <Row>
        <RowLabel>
          <RowDescription>
            Connecting opens {PROVIDER_LABELS.mal} /{' '}
            {PROVIDER_LABELS.anilist} and asks only for permission to update
            your library list — no password is ever shared with Aniraku.
          </RowDescription>
        </RowLabel>
      </Row>
    </PreferencesTable>
  );

  // ── Account rows (task: email / Email verified yes-no / Member since /
  // Sign Out — session + profiles, Aniraku Settings.jsx renderAccountCard) ─
  const renderAccountCard = () => {
    if (!user) {
      return (
        <PreferencesTable>
          <SectionTitle>Account</SectionTitle>
          <Row>
            <RowLabel>
              <RowTitle>
                <FaLock size={12} aria-hidden='true' /> Account details need a
                session
              </RowTitle>
              <RowDescription>
                Log in to see your email, verification status and member date.
              </RowDescription>
            </RowLabel>
            <StyledButton onClick={() => navigate('/login')}>
              Log in
            </StyledButton>
          </Row>
        </PreferencesTable>
      );
    }

    return (
      <PreferencesTable>
        <SectionTitle>Account</SectionTitle>
        <Row>
          <RowLabel>
            <RowTitle>Email</RowTitle>
            <RowDescription>
              {user.email || 'No email on this account'}
            </RowDescription>
          </RowLabel>
          <Badge $ok={emailVerified}>
            {emailVerified ? 'Verified' : 'Unverified'}
          </Badge>
        </Row>
        <Row>
          <RowLabel>
            <RowTitle>Email verified</RowTitle>
            <RowDescription>{emailVerified ? 'Yes' : 'No'}</RowDescription>
          </RowLabel>
        </Row>
        {memberSince && (
          <Row>
            <RowLabel>
              <RowTitle>Member since</RowTitle>
              <RowDescription>
                {new Date(memberSince).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </RowDescription>
            </RowLabel>
          </Row>
        )}
        {canChangePassword && (
          <>
            <Row>
              <RowLabel>
                <RowTitle>Password</RowTitle>
                <RowDescription>
                  Update the password you use to sign in.
                </RowDescription>
              </RowLabel>
              <StyledButton onClick={() => setPwOpen((open) => !open)}>
                <FaKey size={11} aria-hidden='true' />{' '}
                {pwOpen ? 'Cancel' : 'Change'}
              </StyledButton>
            </Row>
            {pwOpen && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingTop: '0.6rem',
                }}
              >
                <StyledInput
                  type='password'
                  aria-label='New password'
                  placeholder='New password'
                  value={pw}
                  onChange={(event) => setPw(event.target.value)}
                  autoComplete='new-password'
                />
                <StyledInput
                  type='password'
                  aria-label='Confirm new password'
                  placeholder='Confirm new password'
                  value={pw2}
                  onChange={(event) => setPw2(event.target.value)}
                  autoComplete='new-password'
                />
                {pwErr && <DangerMsg>{pwErr}</DangerMsg>}
                <div>
                  <StyledButton disabled={pwBusy} onClick={handlePassword}>
                    <FaCheck size={11} aria-hidden='true' />{' '}
                    {pwBusy ? 'Saving…' : 'Update Password'}
                  </StyledButton>
                </div>
              </div>
            )}
          </>
        )}
        <Row>
          <RowLabel>
            <RowTitle>Sign out</RowTitle>
            <RowDescription>End this session on this device.</RowDescription>
          </RowLabel>
          <StyledButton onClick={handleSignOut}>
            <FaSignOutAlt size={11} aria-hidden='true' /> Sign Out
          </StyledButton>
        </Row>
      </PreferencesTable>
    );
  };

  // ── Data card: Clear Watch History (two-step) + Clear Bookmarks ─────────
  const renderDataCard = () => (
    <PreferencesTable>
      <SectionTitle>Data</SectionTitle>
      <Row>
        <RowLabel>
          <RowDescription>
            {user
              ? 'Clearing removes this data from your account everywhere you are signed in.'
              : 'Clearing removes this data from this device only. Log in to manage account-wide data.'}
          </RowDescription>
        </RowLabel>
      </Row>
      <Row>
        <RowLabel>
          <RowTitle>
            <FaHistory size={11} aria-hidden='true' /> Watch history
          </RowTitle>
          <RowDescription>
            Episodes you have watched, and where you left off.
          </RowDescription>
        </RowLabel>
        {clearArm !== 'history' ? (
          <StyledButton
            disabled={Boolean(clearing)}
            onClick={() => armClear('history')}
          >
            Clear watch history
          </StyledButton>
        ) : (
          <DangerBtn
            disabled={Boolean(clearing)}
            onClick={() => void handleClearHistory()}
          >
            <FaTrash size={11} aria-hidden='true' />
            {clearing === 'history'
              ? 'Clearing…'
              : 'Yes, clear everything — click again'}
          </DangerBtn>
        )}
      </Row>
      <Row>
        <RowLabel>
          <RowTitle>
            <FaBookmark size={11} aria-hidden='true' /> Bookmarks
          </RowTitle>
          <RowDescription>
            Anime you have saved to your library.
          </RowDescription>
        </RowLabel>
        {clearArm !== 'bookmarks' ? (
          <StyledButton
            disabled={Boolean(clearing)}
            onClick={() => armClear('bookmarks')}
          >
            Clear Bookmarks
          </StyledButton>
        ) : (
          <DangerBtn
            disabled={Boolean(clearing)}
            onClick={() => void handleClearBookmarks()}
          >
            <FaTrash size={11} aria-hidden='true' />
            {clearing === 'bookmarks'
              ? 'Clearing…'
              : 'Yes, clear bookmarks — click again'}
          </DangerBtn>
        )}
      </Row>
      <Row>
        <RowLabel>
          <RowDescription>
            Clearing takes effect immediately. An inline Undo appears below
            for {UNDO_WINDOW_MS / 1000} seconds afterwards; after that the
            removal is final.
          </RowDescription>
        </RowLabel>
      </Row>
      {undo && (
        <UndoBar role='status' aria-live='polite'>
          <UndoText>
            {undo.kind === 'bookmarks' ? 'Bookmarks' : 'Watch history'}{' '}
            cleared — {undo.count} item{undo.count === 1 ? '' : 's'} removed.
            Changed your mind?
          </UndoText>
          <StyledButton onClick={() => void handleUndo()}>
            Undo — restore {undo.count} item{undo.count === 1 ? '' : 's'}
          </StyledButton>
        </UndoBar>
      )}
    </PreferencesTable>
  );

  // ── Danger Zone (Aniraku renderDangerCard: arm → type DELETE → delete) ──
  const renderDangerCard = () => {
    if (!user) return null;
    return (
      <DangerTable>
        <DangerTitle>Danger Zone</DangerTitle>
        <Row>
          <RowLabel>
            <RowTitle>Delete account</RowTitle>
            <RowDescription>
              Permanently removes your profile, watch history, bookmarks,
              settings and notifications, clears this device&apos;s copy of
              them, and signs you out. This cannot be undone.
            </RowDescription>
            <RowDescription>
              Deleting runs from your browser: if the server&apos;s
              account-deletion function is unavailable, every row this app can
              write is removed and you are signed out — the login record
              itself, and any uploaded avatars, may then need to be removed by
              support.
            </RowDescription>
          </RowLabel>
          {!confirmArmed ? (
            <DangerBtn onClick={() => setConfirmArmed(true)}>
              <FaTrash size={11} aria-hidden='true' /> Delete Account
            </DangerBtn>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                alignItems: 'flex-end',
              }}
            >
              <DangerInput
                type='text'
                aria-label='Type DELETE to confirm'
                placeholder='Type "DELETE" to confirm'
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                autoFocus
              />
              <DangerBtn
                disabled={deleting || confirmText !== 'DELETE'}
                onClick={() => void handleDelete()}
              >
                {deleting ? 'Deleting…' : 'Permanently Delete'}
              </DangerBtn>
            </div>
          )}
        </Row>
        {deleteErr && <DangerMsg>{deleteErr}</DangerMsg>}
      </DangerTable>
    );
  };

  return (
    <SettingsDiv>
      <Title>
        <Goback onClick={handleGoback}>
          <IoArrowBack />
        </Goback>
        Settings
      </Title>

      <PreferencesTable>
        <SectionTitle>Appearance</SectionTitle>
        <Row>
          <RowLabel>
            <RowTitle>Theme</RowTitle>
            <RowDescription>Choose your preferred color scheme.</RowDescription>
          </RowLabel>
        </Row>
        <ThemeGrid>
          {THEME_CARDS.map(({ mode, icon, label }) => (
            <ThemeCard
              key={mode}
              $active={themeMode === mode}
              onClick={() => setTheme(mode)}
              aria-pressed={themeMode === mode}
            >
              {icon}
              {label}
            </ThemeCard>
          ))}
        </ThemeGrid>
      </PreferencesTable>

      <PreferencesTable>
        <SectionTitle>Display Language</SectionTitle>
        {DISPLAY_LANGUAGE_ROWS.map(renderRow)}
      </PreferencesTable>

      <PreferencesTable>
        <SectionTitle>Media Settings</SectionTitle>
        {MEDIA_ROWS.map(renderRow)}
      </PreferencesTable>

      {renderContentCard()}
      {renderSyncCard()}
      {renderAccountCard()}
      {renderDataCard()}

      <PreferencesTable>
        <SectionTitle>Other Settings</SectionTitle>
        {OTHER_ROWS.map(renderRow)}
        <Row>
          <RowLabel>
            <RowTitle>Restore Default Settings</RowTitle>
            <RowDescription>
              Restore all settings to their default values.
            </RowDescription>
          </RowLabel>
          <StyledButton $danger onClick={handleRestoreDefaults}>
            Restore
          </StyledButton>
        </Row>
      </PreferencesTable>

      {renderDangerCard()}
    </SettingsDiv>
  );
};

export default Settings;
