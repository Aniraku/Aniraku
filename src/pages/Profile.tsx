// Profile — Aniraku src/pages/Profile.jsx SUBSET port, scope reduced per
// coordinator delta 3: ships ONLY (a) Profile Overview and (b) Bookmarks.
//   • Overview: identity card (avatar/username/display/email/verified),
//     sign-out, guest = login prompt, and the edit card — avatar preset
//     picker (Aniraku Profile.jsx:188-193 selectAvatar → updateProfile
//     immediately) + username/display_name/bio edit (Profile.jsx:333-394)
//   • Bookmarks: server bookmarks select anime_id,title,image → cards
//     (AnimeDetail.jsx:669-674 pattern)
// REMOVED per delta 3: the watch-history section (history has its own page)
// and ALL banner_url UI (column unused; no upload/edit/preview). Preserved:
// settings-as-modal (?settings=1 + <Settings />) + gear — required by the
// App /settings routes and GlobalShortcutsBridge.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IoClose, IoLogOutOutline } from 'react-icons/io5';
import { CgProfile } from 'react-icons/cg';
import { FiSettings } from 'react-icons/fi';
import { FaLock } from 'react-icons/fa';
import { Settings } from '../index';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  AVATAR_BUCKET,
  AVATAR_LIST,
  avatarUrl,
  defaultAvatar,
  listAvatars,
  type Avatar,
} from '../lib/avatars';
// Library tab (Wave C) — Aniraku Profile.jsx:8-15 sync import/export + the
// provider row/status copy (:554-672). Transport lives in lib/sync.ts.
import {
  describeExport,
  describeImport,
  getExportJobs,
  getSyncStatus,
  importProviderList,
  PROVIDER_LABELS,
  startExportJob,
  subscribeExportJobs,
  type ExportJobs,
  type ExportJobStatus,
  type SyncStatus,
} from '../lib/sync';
import ProviderIcon from '../components/ProviderIcon';
import { showToast } from '../components/Toaster';
import { infoPathFor } from '../utils/animePaths';

// Same as the live .vh helper (visually hidden heading)
const VisuallyHidden = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// _userProfileContainer_y1j45_47: profile details column (banner UI removed
// per delta 3 — no banner_url upload/edit/preview anywhere on Profile)
const ProfileShell = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  text-align: center;
  border-radius: var(--global-border-radius);
`;

// Settings gear — kept from the banner's _bannerSettingsButton_y1j45_87
// (banner wrapper/image removed per delta 3; the gear still opens
// /profile?settings=1 from both guest and authed states)
const HeaderBar = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const BannerSettingsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: var(--global-text);
  cursor: pointer;
  background: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  &:hover {
    background-color: var(--global-button-hover-bg);
    border: 1px solid var(--global-text);
  }
  &:active {
    transform: scale(0.95);
  }
`;

const TopContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  gap: 1rem;

  @media (min-width: 1000px) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const ProfileContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
  padding: 1rem;
  background-color: var(--global-div-tr);
  border-radius: var(--global-border-radius);
  text-align: center;
  font-size: 0.9rem;
  flex: 1;

  img {
    border-radius: 50%;
    width: 7rem;
    height: 7rem;
    object-fit: cover;
    border: 3px solid var(--primary-accent);
    background-color: var(--global-div);
  }
`;

// _usernameText_y1j45_166
const Username = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
`;

const IdentityLine = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: var(--global-text-muted);
  overflow-wrap: anywhere;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const VerifiedBadge = styled.span`
  background: var(--primary-accent);
  color: var(--global-primary-bg);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: stretch;
  justify-content: center;
  width: 100%;
  margin-top: 0.5rem;
`;

const PreferencesContainer = styled.div`
  max-width: 80rem;
  margin: auto;
  padding: 0.25rem;
`;

const Loginbutton = styled.div`
  border-radius: var(--global-border-radius);
  display: flex;
  cursor: pointer;
  padding: 0.6rem 0.9rem;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  background-color: var(--global-div);
  color: var(--global-text);
  border: 1px solid var(--global-border-color);
  transition: 0.1s ease-in-out;
  width: 10rem; // Fixed width
  margin: 0 auto; // Center horizontally
  &:hover,
  &:active,
  &:focus {
    color: var(--primary-accent);
    background-color: var(--primary-accent-bg);
    transform: scale(1.025);
  }
  &:active {
    transform: scale(0.975);
  }

  .svg-wrapper {
    margin-bottom: -0.2rem;
    margin-left: 0.5rem;
    font-size: 1.25rem;
  }
`;

// ── Aniraku Profile edit card / list sections ──────────────────────────────
const EditCard = styled.section`
  width: 100%;
  padding: 24px;
  background: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  text-align: left;

  h3 {
    font-size: 16px;
    margin: 0 0 16px;
    color: var(--global-text);
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ListSection = styled.section`
  width: 100%;
  margin-top: 1.5rem;
  padding: 24px;
  background: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  text-align: left;

  h3 {
    font-size: 16px;
    margin: 0 0 16px;
    color: var(--global-text);
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

// ── Profile section tabs (Wave C) ─────────────────────────────────────────
// Aniraku Profile.jsx:353-371 `.profile-tabs` (Profile / Avatars / Bookmarks
// / Library; History + Badges stay out of scope — history has its own page),
// restyled onto our CSS vars.
const TabBar = styled.nav`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  width: 100%;
  overflow-x: auto;
  border-bottom: 1px solid var(--global-border-color);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button`
  flex: 0 0 auto;
  min-height: 42px;
  padding: 10px 15px;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--global-text-muted);
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: var(--global-text);
  }

  &[data-active='true'] {
    color: var(--global-text);
    border-bottom-color: var(--primary-accent);
  }
`;

// Avatars tab grid — same tile interaction as Aniraku Profile.jsx:396-429
// (3px accent ring while selected), on our card vars.
const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
  padding: 2px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
    gap: 8px;
  }
`;

const AvatarTile = styled.button<{ $selected: boolean }>`
  width: 100%;
  aspect-ratio: 1 / 1;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--global-secondary-bg);
  border: ${(p) =>
    p.$selected
      ? '3px solid var(--primary-accent)'
      : '3px solid var(--global-border-color)'};
  border-radius: 12px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

// ── Library tab (Wave C) ──────────────────────────────────────────────────
// Aniraku Profile.jsx:554-672 provider rows / result box / export confirm,
// on our card chrome (ListSection above supplies the surrounding card).
const LibraryRow = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  margin-bottom: 12px;
  background: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: 10px;
`;

const LibraryRowHead = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const ProviderGlyphBox = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${(p) =>
    p.$connected ? 'var(--primary-accent)' : 'var(--global-border-color)'};
`;

const ProviderInfo = styled.div`
  flex: 1;
  min-width: 140px;
`;

const ProviderHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ProviderName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: var(--global-text);
`;

const ProviderBadge = styled.span<{ $connected: boolean }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  background: ${(p) =>
    p.$connected ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.12)'};
  color: ${(p) => (p.$connected ? '#34d399' : 'var(--global-text-muted)')};
`;

const ProviderMeta = styled.div`
  margin-top: 3px;
  font-size: 12px;
  color: var(--global-text-muted);
`;

const BtnRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SmallBtn = styled.button<{ $primary: boolean }>`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid
    ${(p) => (p.$primary ? 'transparent' : 'var(--global-border-color)')};
  background: ${(p) =>
    p.$primary ? 'var(--primary-accent)' : 'var(--global-div)'};
  color: ${(p) =>
    p.$primary ? 'var(--global-primary-bg)' : 'var(--global-text)'};
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`;

const GhostLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--global-border-color);
  background: var(--global-div);
  color: var(--global-text-muted);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
`;

// Result box — Aniraku Profile.jsx:634-645 (✓ / ⚠ + tone colors verbatim).
const ResultBox = styled.div<{ $tone: 'ok' | 'error' }>`
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid
    ${(p) =>
      p.$tone === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.25)'};
  background: ${(p) =>
    p.$tone === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.08)'};
  color: ${(p) => (p.$tone === 'error' ? '#fca5a5' : '#86efac')};
  font-size: 13px;
  line-height: 1.5;
`;

// Export confirm — Aniraku Profile.jsx:647-667 (amber box, copy verbatim).
const ConfirmBox = styled.div`
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.3);
  font-size: 13px;
  line-height: 1.5;

  p {
    margin: 0 0 10px;
    color: var(--global-text);
  }
`;

// Guest "Sync needs an account" row (Aniraku Settings.jsx:650-655 copy).
const AccountNeededRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 14px 16px;
  margin-top: 8px;
  background: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: 10px;

  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 4px;
    font-size: 14px;
    color: var(--global-text);
  }

  p {
    margin: 0;
    font-size: 13px;
    color: var(--global-text-muted);
  }
`;

const SaveMessage = styled.div<{ $tone: 'ok' | 'error' }>`
  background: ${p => (p.$tone === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(229,9,20,0.1)')};
  border: 1px solid ${p => (p.$tone === 'ok' ? 'rgba(34,197,94,0.35)' : 'rgba(229,9,20,0.35)')};
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  color: ${p => (p.$tone === 'ok' ? '#4ade80' : '#f87171')};
  font-size: 13px;
  line-height: 1.55;
`;

const PrimaryBtn = styled.button`
  padding: 10px 24px;
  background: var(--primary-accent);
  color: var(--global-primary-bg);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: var(--global-text-muted);

  a {
    color: var(--primary-accent);
    font-size: 14px;
    margin-top: 8px;
    display: inline-block;
  }
`;

const BookmarkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
  }
`;

const BookmarkCard = styled(Link)`
  overflow: hidden;
  background: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: 8px;
  color: var(--global-text);
  text-decoration: none;

  &:hover {
    border-color: var(--primary-accent);
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }

  p {
    padding: 10px;
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const GuestPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 2.5rem 1rem;
  background: var(--global-div-tr);
  border-radius: var(--global-border-radius);
  color: var(--global-text);

  h2 {
    margin: 0;
    font-size: 22px;
  }

  a {
    color: var(--global-primary-bg);
    background: var(--primary-accent);
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;
  }
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 3rem 0;
  color: var(--global-text-muted);
  font-size: 0.85rem;

  span {
    width: 0.5rem;
    height: 0.5rem;
    background-color: var(--primary-accent);
    border-radius: 50%;
    animation: profileDotPulse 1.2s ease-in-out infinite;
  }
  span:nth-child(2) {
    animation-delay: 0.2s;
  }
  span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes profileDotPulse {
    0%,
    100% {
      opacity: 0.4;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

// Settings-as-modal (_overlayContainer_1bzcd_1 + _modal_8w0d1_1)
const popIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(0.75rem) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-index-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  background-color: #0000007f;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: fadeIn 0.4s ease-in-out;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalPanel = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(64rem, calc(100vw - 2rem));
  height: min(44rem, calc(100vh - 2rem));
  overflow: hidden;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  animation: ${popIn} 0.4s ease-out;

  @media (max-width: 640px) {
    width: calc(100% - 1rem);
    height: calc(100% - 1rem);
    margin: 0.5rem;
  }
`;

// _closeButton_8w0d1_46
const ModalCloseButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: var(--z-index-above);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--global-text);
  cursor: pointer;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  outline: none;

  &:hover {
    color: var(--primary-accent);
    background-color: var(--primary-accent-tr);
    border-color: var(--primary-accent);
  }
  &:active {
    transform: scale(0.95);
  }
`;

// _body_8w0d1_68 / _content_8w0d1_138
const ModalBody = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: 3rem 1rem 1rem;
  overflow-y: auto;
  background-color: var(--global-primary-bg);
`;

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--global-text-muted-strong)',
  fontSize: 13,
  marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  padding: '10px 14px',
  background: 'var(--global-secondary-bg)',
  border: '1px solid var(--global-border-color)',
  borderRadius: 8,
  color: 'var(--global-text)',
  fontSize: 14,
  outline: 'none',
  marginBottom: 16,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

// Library tab intro paragraph (Aniraku Profile.jsx:557-563 copy + colors).
const libraryDescStyle: React.CSSProperties = {
  color: 'var(--global-text-muted)',
  fontSize: 13,
  marginBottom: 20,
  lineHeight: 1.6,
};

// Avatars tab intro (Aniraku Profile.jsx:399).
const avatarDescStyle: React.CSSProperties = {
  color: 'var(--global-text-muted)',
  fontSize: 13,
  marginBottom: 16,
  lineHeight: 1.6,
};

interface BookmarkEntry {
  id: number | string;
  title: string | null;
  image: string | null;
}

// Wave C — tab set (Aniraku Profile.jsx:354-360; History + Badges stay out
// of scope — history has its own page, badges not in this port). Guests get
// Profile + Library only: Library shows the account-needed row instead of
// the import/export rows (Aniraku Settings.jsx:650).
type ProfileTab = 'profile' | 'avatars' | 'bookmarks' | 'library';

const TABS: Array<{ id: ProfileTab; label: string; authedOnly?: boolean }> = [
  { id: 'profile', label: 'Profile' },
  { id: 'avatars', label: 'Avatars', authedOnly: true },
  { id: 'bookmarks', label: 'Bookmarks', authedOnly: true },
  { id: 'library', label: 'Library' },
];

// Profile component
export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.user ?? null;
  const profile = auth?.profile ?? null;
  const loading = auth?.loading ?? true;
  const signOut = auth?.signOut;
  const updateProfile = auth?.updateProfile;

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'ok' | 'error'>('ok');
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [avatars, setAvatars] = useState<Avatar[]>(AVATAR_LIST);

  // Wave C — section tabs (Aniraku Profile.jsx:33 activeTab) + Library
  // import/export state (Profile.jsx:38-41) + avatar-library readiness
  // (Profile.jsx:43).
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncBusy, setSyncBusy] = useState(''); // 'mal-import' | 'mal-export' | ...
  const [syncResult, setSyncResult] = useState<
    Record<string, { type: 'ok' | 'error'; text: string } | null>
  >({});
  const [confirmExport, setConfirmExport] = useState(''); // provider being confirmed
  const [avatarLibraryReady, setAvatarLibraryReady] = useState(false);
  // Background export jobs (lib/sync.ts runner): progress renders below,
  // terminal transitions toast + fill the result slot. Seen-statuses ref
  // keeps toasts to genuine running→done/error edges (no stale toasts).
  const [exportJobs, setExportJobs] = useState<ExportJobs>(() => getExportJobs());
  const exportSeenRef = useRef<Record<string, ExportJobStatus>>({});

  useEffect(
    () =>
      subscribeExportJobs((jobs) => {
        setExportJobs({ ...jobs });
        for (const [provider, job] of Object.entries(jobs)) {
          const prev = exportSeenRef.current[provider];
          exportSeenRef.current[provider] = job.status;
          if (prev !== 'running') continue;
          if (job.status === 'done') {
            const text =
              job.message ??
              describeExport({
                exported: job.exported,
                scores: job.scores,
                skipped: job.skipped,
                failed: job.failed,
                limited: false,
              });
            setSyncResult((r) => ({ ...r, [provider]: { type: 'ok', text } }));
            showToast(text, { type: 'success' });
          } else if (job.status === 'error') {
            const text = job.message ?? 'Export failed';
            setSyncResult((r) => ({ ...r, [provider]: { type: 'error', text } }));
            showToast(text, { type: 'error' });
          }
        }
      }),
    [],
  );

  const guest = !user;

  const resolvedUsername = profile?.username || username || '';
  const resolvedDisplayName = profile?.display_name || profile?.username || 'User';

  // Profile Page Document Title (Aniraku convention: `… · Aniraku`)
  useEffect(() => {
    document.title = guest ? 'Profile · Aniraku' : `${resolvedDisplayName} · Profile · Aniraku`;
  }, [guest, resolvedDisplayName]);

  // Seed the edit form from the loaded profile (Aniraku Profile.jsx:132-137).
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  // Server bookmark rows — one loader shared by the Bookmarks tab effect
  // and the Library import flow (Aniraku Profile.jsx:100-130
  // loadServerBookmarks; our merge-on-login lives in lib/sync).
  const loadBookmarks = useCallback(() => {
    if (!user) {
      setBookmarks([]);
      return;
    }
    supabase
      .from('bookmarks')
      .select('anime_id,title,image')
      .eq('user_id', user.id)
      .then(
        ({ data }) => {
          const mapped: BookmarkEntry[] = (data || []).map(
            (b: { anime_id: number; title: string; image: string }) => ({
              id: b.anime_id,
              title: b.title,
              image: b.image,
            }),
          );
          setBookmarks(mapped);
        },
        (err: unknown) => console.error('bookmarks fetch error:', err),
      );
  }, [user]);

  // Bookmarks list (AnimeDetail.jsx:669-674) — cloud rows are the source of
  // truth; local mirrors are owned by the Watch scope, never written here.
  // Watch history intentionally absent: history has its own page (delta 3).
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Avatar library: the storage bucket is the source of truth (Aniraku
  // Profile.jsx:49-77, minus the 15s poll + realtime channel — one load per
  // signed-in user; static AVATAR_LIST remains the fallback).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listAvatars()
      .then((list) => {
        if (!cancelled && list.length) setAvatars(list);
      })
      .catch(() => {
        // offline / unconfigured storage — static presets stay visible
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Avatars tab (Wave C) — Aniraku Profile.jsx:52-95: while the tab is open
  // the bucket is polled every 15s AND a storage.objects realtime channel
  // reloads on changes for AVATAR_BUCKET (realtime covers projects with
  // storage in their publication; the poll covers the rest). A public object
  // can be readable while Storage list permissions are restricted — keep the
  // supplied catalog visible in that case (Aniraku :60-64).
  // NOTE: Aniraku has NO avatar upload flow anywhere in its source (verified
  // by grep — avatars.js only lists/links); this tab mirrors the reference:
  // list + select + live refresh. See report for bucket/RLS findings.
  useEffect(() => {
    if (activeTab !== 'avatars' || !user) return undefined;
    let cancelled = false;

    const loadAvatarLibrary = async () => {
      try {
        const next = await listAvatars();
        if (!cancelled) {
          setAvatars(next.length ? next : AVATAR_LIST);
          setAvatarLibraryReady(true);
        }
      } catch (err) {
        console.error('avatar library fetch error:', err);
        if (!cancelled) {
          setAvatars(AVATAR_LIST);
          setAvatarLibraryReady(true);
        }
      }
    };

    void loadAvatarLibrary();
    const interval = window.setInterval(loadAvatarLibrary, 15000);
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`avatar-library-${user.id || 'public'}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'storage', table: 'objects' },
          (payload) => {
            const row = (payload.new ?? payload.old) as {
              bucket_id?: string;
            } | null;
            if (row?.bucket_id === AVATAR_BUCKET) void loadAvatarLibrary();
          },
        )
        .subscribe();
    } catch {
      // realtime unavailable — the 15s poll still refreshes the list
    }

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // channel already closed
        }
      }
    };
  }, [activeTab, user?.id]);

  const handleSave = async () => {
    if (!updateProfile) return;
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim() || username.trim(),
        bio: bio.trim() || null,
      });
      setMessageTone('ok');
      setMessage('Profile updated');
    } catch (err) {
      setMessageTone('error');
      setMessage((err as Error).message || 'Failed to update');
    }
    setSaving(false);
  };

  // Aniraku Profile.jsx:188-193 — a preset click saves immediately
  const selectAvatar = async (av: Avatar) => {
    if (!updateProfile) return;
    try {
      await updateProfile({ avatar_url: av.url });
      setMessageTone('ok');
      setMessage('Avatar updated');
    } catch (err) {
      setMessageTone('error');
      setMessage((err as Error).message || 'Failed to set avatar');
    }
  };

  // ── Library import / export (Aniraku Profile.jsx:267-315) ──────────────
  // Requires the provider connected in Settings; results render through
  // describeImport/describeExport AND toast (Wave C — Aniraku copy).
  const refreshSyncStatus = useCallback(() => {
    if (!user) return;
    getSyncStatus().then((data) => {
      if (data) setSyncStatus(data);
    });
  }, [user]);

  // Refresh the provider status when the Library tab opens (Aniraku :275-278).
  useEffect(() => {
    if (activeTab === 'library' && user) refreshSyncStatus();
  }, [activeTab, user, refreshSyncStatus]);

  const providerConnected = (provider: string): boolean =>
    !!(syncStatus?.[provider]?.connected);
  const providerUsername = (provider: string): string =>
    syncStatus?.[provider]?.username || '';

  const runImport = async (provider: string) => {
    const key = `${provider}-import`;
    if (syncBusy) return;
    setSyncBusy(key);
    setSyncResult((r) => ({ ...r, [provider]: null }));
    const data = await importProviderList(provider);
    setSyncBusy('');
    if (data.error) {
      const text = data.error;
      setSyncResult((r) => ({ ...r, [provider]: { type: 'error', text } }));
      showToast(text, { type: 'error' });
      return;
    }
    const text = describeImport(data);
    setSyncResult((r) => ({ ...r, [provider]: { type: 'ok', text } }));
    showToast(text, { type: 'success' });
    refreshSyncStatus();
    loadBookmarks();
  };

  // Background export: fire-and-forget paced chunk loop (lib/sync.ts runner,
  // ~30 entries/min). Progress renders below; completion lands in the bell.
  const runExport = (provider: string) => {
    if (syncBusy) return;
    setConfirmExport('');
    const job = getExportJobs()[provider];
    if (job?.status === 'running') {
      showToast(
        `Export to ${PROVIDER_LABELS[provider]} is already running in the background`,
        { type: 'warning' },
      );
      return;
    }
    setSyncResult((r) => ({ ...r, [provider]: null }));
    startExportJob(provider);
  };

  const handleSignOut = async () => {
    if (!signOut) return;
    await signOut();
    navigate('/');
  };

  // Settings-as-modal: /profile?settings=1 opens the overlay
  const settingsOpen =
    new URLSearchParams(location.search).get('settings') === '1';

  const openSettings = () => navigate('/profile?settings=1');
  const closeSettings = () => navigate('/profile', { replace: true });

  useEffect(() => {
    if (!settingsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSettings();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen, navigate]);

  const avatarSrc =
    avatarUrl(profile?.avatar_url) ||
    defaultAvatar((resolvedUsername || 'u').charCodeAt(0)).url ||
    undefined;

  return (
    <PreferencesContainer>
      <VisuallyHidden>Profile</VisuallyHidden>
      <ProfileShell>
        <HeaderBar>
          <BannerSettingsButton
            type='button'
            onClick={openSettings}
            aria-label='Settings'
          >
            <FiSettings size={18} />
          </BannerSettingsButton>
        </HeaderBar>

        {/* Section tabs (Aniraku Profile.jsx:353-371). Guests only get
            Profile + Library — Library renders the account-needed row. */}
        <TabBar role='tablist' aria-label='Profile sections'>
          {TABS.filter((tab) => !tab.authedOnly || !guest).map((tab) => (
            <TabButton
              key={tab.id}
              type='button'
              role='tab'
              data-active={String(activeTab === tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </TabButton>
          ))}
        </TabBar>

        {/* Status message (Aniraku Profile.jsx:373-377 — global under tabs). */}
        {message && (
          <SaveMessage $tone={messageTone} role='status'>
            {message}
          </SaveMessage>
        )}

        {activeTab === 'profile' &&
          (loading ? (
          <LoadingDots aria-label='Loading profile'>
            <span />
            <span />
            <span />
          </LoadingDots>
        ) : guest ? (
          <GuestPrompt>
            <CgProfile size={'3rem'} aria-hidden='true' />
            <h2>You are not logged in</h2>
            <Link to='/login'>Log In</Link>
          </GuestPrompt>
        ) : (
          <TopContainer>
            <ProfileContainer>
              <img src={avatarSrc} alt={`${resolvedDisplayName}'s avatar`} />
              <NameRow>
                <Username>{resolvedDisplayName}</Username>
                {user.email_confirmed_at && (
                  <VerifiedBadge>VERIFIED</VerifiedBadge>
                )}
              </NameRow>
              <IdentityLine>@{resolvedUsername}</IdentityLine>
              <IdentityLine>{user.email}</IdentityLine>
              <ActionsRow>
                <Loginbutton onClick={handleSignOut} role='button'>
                  Sign Out
                  <span className='svg-wrapper'>
                    <IoLogOutOutline />
                  </span>
                </Loginbutton>
              </ActionsRow>
            </ProfileContainer>

            <EditCard>
              <h3>Edit Profile</h3>
              <label style={labelStyle}>Avatar</label>
              <p style={{ ...labelStyle, marginTop: 0 }}>
                Choose an avatar — community presets from the Aniraku avatar
                library.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                  gap: 12,
                  maxHeight: 200,
                  overflowY: 'auto',
                  marginBottom: 16,
                  padding: 2,
                }}
              >
                {avatars.map((av) => {
                  const selected =
                    profile?.avatar_url === av.url ||
                    Boolean(profile?.avatar_url?.endsWith(av.name));
                  return (
                    <button
                      key={av.name}
                      type='button'
                      onClick={() => selectAvatar(av)}
                      aria-label={`Use avatar ${av.name}`}
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                        aspectRatio: '1 / 1',
                        cursor: 'pointer',
                        background: 'var(--global-secondary-bg)',
                        border: selected
                          ? '2px solid var(--primary-accent)'
                          : '1px solid var(--global-border-color)',
                        borderRadius: 8,
                      }}
                    >
                      <img
                        src={av.url ?? undefined}
                        alt=''
                        onError={(e) => {
                          const fallback = defaultAvatar(av.id).url;
                          if (fallback) e.currentTarget.src = fallback;
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
              <label style={labelStyle} htmlFor='profile-username'>
                Username
              </label>
              <input
                id='profile-username'
                type='text'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
                maxLength={20}
              />
              <label style={labelStyle} htmlFor='profile-display-name'>
                Display name
              </label>
              <input
                id='profile-display-name'
                type='text'
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle} htmlFor='profile-bio'>
                Bio
              </label>
              <textarea
                id='profile-bio'
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <PrimaryBtn onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </PrimaryBtn>
              </div>
            </EditCard>
          </TopContainer>
        ))}

        {activeTab === 'bookmarks' && !guest && (
          <ListSection>
            <h3>Bookmarks</h3>
            {bookmarks.length === 0 ? (
              <EmptyState>
                <p>No bookmarks yet</p>
                <Link to='/'>Browse Anime</Link>
              </EmptyState>
            ) : (
              <BookmarkGrid>
                {bookmarks.map((b) => {
                  const bookmarkTitle = b.title || `Anime ${b.id ?? ''}`.trim();
                  return (
                    <BookmarkCard
                      key={String(b.id)}
                      to={infoPathFor({
                        id: b.id,
                        title: { romaji: b.title || undefined },
                      })}
                    >
                      {b.image && <img src={b.image} alt={bookmarkTitle} />}
                      <p>{bookmarkTitle}</p>
                    </BookmarkCard>
                  );
                })}
              </BookmarkGrid>
            )}
          </ListSection>
        )}

        {/* Avatars tab (Aniraku Profile.jsx:396-429) — the bucket list is
            live (15s poll + storage realtime while the tab is open); select
            saves immediately via updateProfile (Profile.jsx:188-193).
            No upload control: Aniraku has no avatar upload flow in its
            source (grep-verified), so none is invented here. */}
        {activeTab === 'avatars' && !guest && (
          <ListSection>
            <h3>Choose an avatar</h3>
            <p style={avatarDescStyle}>
              Community presets from the Aniraku avatar library.
            </p>
            {avatarLibraryReady && avatars.length === 0 ? (
              <EmptyState>
                <p>No avatars are currently available.</p>
              </EmptyState>
            ) : (
              <AvatarGrid>
                {avatars.map((av) => {
                  const selected =
                    profile?.avatar_url === av.url ||
                    Boolean(profile?.avatar_url?.endsWith(av.name));
                  return (
                    <AvatarTile
                      key={av.name}
                      type='button'
                      $selected={selected}
                      title={av.name}
                      aria-label={`Use avatar ${av.name}`}
                      aria-pressed={selected}
                      onClick={() => selectAvatar(av)}
                    >
                      <img
                        src={av.url ?? undefined}
                        alt=''
                        onError={(e) => {
                          const fallback = defaultAvatar(av.id).url;
                          if (fallback) e.currentTarget.src = fallback;
                        }}
                      />
                    </AvatarTile>
                  );
                })}
              </AvatarGrid>
            )}
          </ListSection>
        )}

        {/* Library tab — import/export (Aniraku Profile.jsx:554-672); guest
            gets the account-needed row (Settings.jsx:644-660 copy). */}
        {activeTab === 'library' &&
          (guest ? (
            <ListSection>
              <h3>Library</h3>
              <p style={{ ...libraryDescStyle, marginBottom: 8 }}>
                Keep Aniraku in step with your MyAnimeList and AniList
                libraries. When you finish an episode here, your progress is
                pushed to every connected service.
              </p>
              <AccountNeededRow>
                <div>
                  <h4>
                    <FaLock size={13} aria-hidden='true' /> Sync needs an
                    account
                  </h4>
                  <p>
                    Log in to connect your library and push watch progress
                    automatically.
                  </p>
                </div>
                <GhostLink to='/login'>Log in</GhostLink>
              </AccountNeededRow>
            </ListSection>
          ) : (
            <ListSection>
              <h3>Library</h3>
              <p style={libraryDescStyle}>
                Move your list between Aniraku and your streaming accounts.
                Import pulls a provider's library into Aniraku — favorites,
                episode progress and scores (progress only advances, existing
                ratings are kept). Export writes each title's current Aniraku
                watch progress, completed status and average score there. Both
                use the connection from{' '}
                <Link
                  to='/profile/settings'
                  style={{ color: 'var(--primary-accent)' }}
                >
                  Settings → Library Sync
                </Link>
                .
              </p>

              {['mal', 'anilist'].map((provider) => {
                const connected = providerConnected(provider);
                const result = syncResult[provider];
                const job = exportJobs[provider];
                const jobRunning = job?.status === 'running';
                const busy =
                  syncBusy === `${provider}-import` ||
                  syncBusy === `${provider}-export` ||
                  jobRunning;
                const confirming = confirmExport === provider;
                return (
                  <LibraryRow key={provider}>
                    <LibraryRowHead>
                      <ProviderGlyphBox $connected={connected}>
                        <ProviderIcon
                          provider={provider}
                          size={22}
                          color={connected ? '#fff' : 'var(--global-text-muted)'}
                        />
                      </ProviderGlyphBox>
                      <ProviderInfo>
                        <ProviderHead>
                          <ProviderName>{PROVIDER_LABELS[provider]}</ProviderName>
                          <ProviderBadge $connected={connected}>
                            {connected ? 'Connected' : 'Off'}
                          </ProviderBadge>
                        </ProviderHead>
                        <ProviderMeta>
                          {connected
                            ? `Ready as ${providerUsername(provider) || 'your account'}`
                            : 'Connect this account in Settings to import or export'}
                        </ProviderMeta>
                      </ProviderInfo>
                      {connected ? (
                        <BtnRow>
                          <SmallBtn
                            $primary
                            type='button'
                            disabled={busy}
                            onClick={() => void runImport(provider)}
                          >
                            {syncBusy === `${provider}-import`
                              ? 'Importing…'
                              : 'Import list'}
                          </SmallBtn>
                          <SmallBtn
                            $primary={false}
                            type='button'
                            disabled={busy}
                            onClick={() => setConfirmExport(provider)}
                          >
                            {jobRunning ? 'Exporting…' : 'Export'}
                          </SmallBtn>
                        </BtnRow>
                      ) : (
                        <GhostLink to='/profile/settings'>
                          Connect in Settings
                        </GhostLink>
                      )}
                    </LibraryRowHead>

                    {result && (
                      <ResultBox $tone={result.type} role='status'>
                        {result.type === 'error' ? '⚠ ' : '✓ '}
                        {result.text}
                      </ResultBox>
                    )}

                    {jobRunning && (
                      <ResultBox $tone='ok' role='status'>
                        Exporting to {PROVIDER_LABELS[provider]} in the
                        background… {job.exported} titles so far (chunk{' '}
                        {job.chunks}) — you can leave this page, the bell will
                        notify you when it finishes.
                        {job.note ? (
                          <>
                            <br />
                            {job.note}
                          </>
                        ) : null}
                      </ResultBox>
                    )}

                    {confirming && (
                      <ConfirmBox>
                        <p>
                          Add your Aniraku favorites to your{' '}
                          {PROVIDER_LABELS[provider]} library, preserving watch
                          progress, completed status and scores?
                          Already-completed titles are skipped.
                        </p>
                        <BtnRow>
                          <SmallBtn
                            $primary
                            type='button'
                            disabled={busy}
                            onClick={() => void runExport(provider)}
                          >
                            {jobRunning ? 'Exporting…' : 'Yes, export'}
                          </SmallBtn>
                          <SmallBtn
                            $primary={false}
                            type='button'
                            disabled={busy}
                            onClick={() => setConfirmExport('')}
                          >
                            Cancel
                          </SmallBtn>
                        </BtnRow>
                      </ConfirmBox>
                    )}
                  </LibraryRow>
                );
              })}
            </ListSection>
          ))}
      </ProfileShell>
      {settingsOpen && (
        <Overlay
          role='dialog'
          aria-modal='true'
          aria-label='Settings'
          onClick={closeSettings}
        >
          <ModalPanel onClick={(event) => event.stopPropagation()}>
            <ModalCloseButton
              type='button'
              aria-label='Close settings'
              onClick={closeSettings}
            >
              <IoClose size={18} />
            </ModalCloseButton>
            <ModalBody>
              <Settings />
            </ModalBody>
          </ModalPanel>
        </Overlay>
      )}
    </PreferencesContainer>
  );
};

export default Profile;
