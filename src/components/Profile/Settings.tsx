import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import {
  FaDesktop,
  FaSun,
  FaMoon,
  FaLeaf,
  FaCat,
} from 'react-icons/fa6';
import {
  FaCheck,
  FaKey,
  FaLink,
  FaLock,
  FaSync,
  FaUnlink,
} from 'react-icons/fa';
import { useAuth, useSettings, useTheme } from '../../index';
import { supabase } from '../../lib/supabase';
import { showToast } from '../Toaster';
import { useNsfw } from '../../hooks/useNsfw';
import ProviderIcon from '../ProviderIcon';
import { clearWatchHistory } from '../../lib/watchHistory';
import {
  getSyncStatus,
  syncAuthorize,
  syncDisconnect,
  subscribeToSession,
  PROVIDER_LABELS,
  type SyncStatus,
} from '../../lib/sync';

// Local mirror of ThemeContext's theme union — the shared ThemeContext was
// refactored concurrently and no longer exports its `ThemeMode`/`mode` API.
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
`;

// Live settings modal title (_title_8w0d1_24): 1.5rem / 700 / muted
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

// Live section heading (_sectionTitle_8w0d1_170): uppercase / 1rem / 700 / muted
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

// Live row label block (_rowLabel_8w0d1_204 / _rowTitle_8w0d1_211 /
// _rowDescription_8w0d1_217)
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

// Mission 2 — change-password fields (Aniraku `Input`, Settings.jsx:773-788)
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

// Mission 2 — provider connection badge (Aniraku `Badge`, ok/off variants)
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

// Yes/No toggle labels with Enabled/Disabled values (live `oh` option set)
const YES_NO: Option[] = [
  { value: 'Disabled', label: 'No' },
  { value: 'Enabled', label: 'Yes' },
];

// Labels and descriptions extracted from the live settings modal
// (Wave B: the local-only `Default Servers` row was removed — old Aniraku
// has no default-server concept, so the preference is no longer rendered
// or written from this page.)
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

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { settings, setSettings } = useSettings();
  const { theme: themeMode, setTheme } = useTheme();
  const { isLoggedIn, userData } = useAuth();

  // ── Mission 2: NSFW toggle / Library Sync / change password ──────────────
  // NSFW preference (Aniraku useNsfw.js + Settings Content card :611-634):
  // account-backed `user_settings.key = nsfw_enabled` for signed-in users,
  // device key `aniraku-nsfw-enabled` for guests, DEFAULT OFF/hidden. Gates
  // browse/display ONLY — it never influences sync payloads.
  const { nsfwEnabled, updateNsfw } = useNsfw();
  const [nsfwSaving, setNsfwSaving] = useState(false);

  // Supabase session user (email/password identity) — detection goes through
  // lib/sync's `supabase.auth` bridge (getSession / onAuthStateChange); no
  // auth-hook import (cross-wave rule). Gates the password section and the
  // signed-in sync card, and supplies the userId for server-side clears.
  const [sessionUser, setSessionUser] = useState<{
    id: string;
    email?: string;
  } | null>(null);

  useEffect(
    () =>
      subscribeToSession((userId) => {
        if (!userId) {
          setSessionUser(null);
          return;
        }
        supabase.auth
          .getSession()
          .then(({ data }) => setSessionUser(data.session?.user ?? null))
          .catch(() => {
            // client unavailable — gated sections stay hidden
          });
      }),
    [],
  );

  // ── MAL / AniList watch-progress sync (Aniraku Settings.jsx:455-521) ──
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncBusy, setSyncBusy] = useState<Record<string, boolean>>({});
  const [syncVersion, setSyncVersion] = useState(0);
  const [syncCheckedAt, setSyncCheckedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionUser) return;
    let cancelled = false;
    void getSyncStatus().then((data) => {
      if (cancelled) return;
      if (data) setSyncStatus(data);
      setSyncCheckedAt(Date.now());
    });
    return () => {
      cancelled = true;
    };
  }, [sessionUser, syncVersion]);

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
  // Bearer header), then hands the browser off — SAME TAB (location.href,
  // Aniraku :504).
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
  // Session + email required (Aniraku `canChangePassword`): updateUser needs
  // a live session, and only email/password accounts have a password to set.
  const canChangePassword = Boolean(sessionUser?.email);
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

  // Aniraku handleNsfwToggle (Settings.jsx:408-420): saving guard + account
  // upsert via updateNsfw (optimistic publish) + success/error toasts.
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

  // Signed-in clear must also delete the server `watch_history` rows (Aniraku
  // handleClearHistory, Settings.jsx:556-575 — server + local) or the rows
  // repopulate the History page on the next mount. `clearWatchHistory` removes
  // the same three native keys this handler used to clear inline, publishes the
  // local change event, then deletes every server row for the userId. (Aniraku's
  // undo snapshot is not ported — out of mission scope.)
  const handleClearWatchHistory = async (): Promise<void> => {
    try {
      await clearWatchHistory({ userId: sessionUser?.id ?? null });
    } catch {
      // clearWatchHistory already swallows server/storage failures
    }
  };

  const handleRestoreDefaults = () => {
    setSettings({
      // DECIDED DEFAULT (Delta 2 / Player mission): auto-skip + auto-next
      // are ON when their keys are missing — matches LIVE_DEFAULTS
      // `autoSkip/autoNext: true` seeded in SettingsProvider.tsx (coordinator
      // owns that file). Every other reset field keeps its old value.
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

  // Settings doesn't change the document title on live (the profile title
  // stays while the preferences modal is open)
  useEffect(() => {
    document.title =
      isLoggedIn && userData ? `${userData.name} · Profile` : 'Profile';
  }, [isLoggedIn, userData]);

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
          onChange={(e) =>
            handlePreferenceChange(row.key as keyof Preferences, e.target.value)
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

      {/* Mission 2 — Content card (Aniraku Settings.jsx:611-634): NSFW toggle
          over user_settings `nsfw_enabled`, default hidden/off */}
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
            aria-label="NSFW content"
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

      {/* Mission 2 — Library Sync card (Aniraku Settings.jsx:636-731):
          connect/disconnect/status/refresh over /api/v1/sync*; guests get the
          login pointer instead of dead Connect buttons */}
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
        {!sessionUser ? (
          <Row>
            <RowLabel>
              <RowTitle>
                <FaLock size={12} aria-hidden="true" /> Sync needs an account
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
                      <FaUnlink size={11} aria-hidden="true" />{' '}
                      {busy ? 'Disconnecting…' : 'Disconnect'}
                    </StyledButton>
                  ) : (
                    <StyledButton
                      disabled={busy}
                      onClick={() => handleConnect(provider)}
                    >
                      <FaLink size={11} aria-hidden="true" /> Connect
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
              <StyledButton onClick={() => setSyncVersion((v) => v + 1)}>
                <FaSync size={11} aria-hidden="true" /> Refresh
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

      {/* Mission 2 — Account card, password block only (Aniraku
          Settings.jsx:523-549 + :760-796): visible only when the Supabase
          session carries an email */}
      {canChangePassword && (
        <PreferencesTable>
          <SectionTitle>Account</SectionTitle>
          <Row>
            <RowLabel>
              <RowTitle>Password</RowTitle>
              <RowDescription>
                Update the password you use to sign in.
              </RowDescription>
            </RowLabel>
            <StyledButton onClick={() => setPwOpen((open) => !open)}>
              <FaKey size={11} aria-hidden="true" />{' '}
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
                type="password"
                aria-label="New password"
                placeholder="New password"
                value={pw}
                onChange={(event) => setPw(event.target.value)}
                autoComplete="new-password"
              />
              <StyledInput
                type="password"
                aria-label="Confirm new password"
                placeholder="Confirm new password"
                value={pw2}
                onChange={(event) => setPw2(event.target.value)}
                autoComplete="new-password"
              />
              {pwErr && (
                <RowDescription style={{ color: '#e5484d' }}>
                  {pwErr}
                </RowDescription>
              )}
              <div>
                <StyledButton disabled={pwBusy} onClick={handlePassword}>
                  <FaCheck size={11} aria-hidden="true" />{' '}
                  {pwBusy ? 'Saving…' : 'Update Password'}
                </StyledButton>
              </div>
            </div>
          )}
        </PreferencesTable>
      )}

      <PreferencesTable>
        <SectionTitle>Other Settings</SectionTitle>
        {OTHER_ROWS.map(renderRow)}
        <Row>
          <RowLabel>
            <RowTitle>Clear Watch History</RowTitle>
            <RowDescription>
              Remove all watching entries from this device and your Aniraku
              account. This won&apos;t affect your AniList account.
            </RowDescription>
          </RowLabel>
          <StyledButton onClick={handleClearWatchHistory}>Clear</StyledButton>
        </Row>
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
    </SettingsDiv>
  );
};
