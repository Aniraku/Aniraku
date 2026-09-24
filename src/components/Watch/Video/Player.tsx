import { useCallback, useEffect, useRef, useState } from 'react';
import HomemadeAppleUrl from './fonts/Homemade-Apple.ttf';
import ButterflyKidsUrl from './fonts/Butterfly-Kids.ttf';
import './PlayerStyles.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../client/useAuth';
import { showToast } from '../../Toaster';
import { createTimelineHoverPreview } from '../lib/watchTimelineHover';
import { shouldPreferNativeHls } from '../lib/watchProviderPlayer';
import {
  isKiwiEmbedUrl,
  isSandboxBlockedEmbed,
} from '../lib/watchEmbedFallback';
import { infoPathFor, type LinkableTitle } from '../../../utils/animePaths';
import {
  getHlsBufferPolicy,
  getHlsLoadPolicies,
  getHlsRequestCacheMode,
} from '../lib/watchBufferPolicy';
import {
  attemptSkipSegment,
  shouldShowManualSkipOverlay,
} from '../lib/skipOverlayPolicy';
// Recovery-position data sources (READ-ONLY consumption of the history
// layer): Wave B's sync engine owns the `watch_history` server reads, the
// watchHistory lib owns the documented local stores.
import {
  fetchServerHistoryRows,
  getSessionUserId,
  publishHistoryNow,
} from '../../../lib/sync';
import {
  LOCAL_HISTORY_KEYS,
  readLocalHistoryRows,
} from '../../../lib/watchHistory';
import styled from 'styled-components';
import {
  fetchSkipTimes,
  fetchAnirakuStream,
  proxiedMediaUrl,
  pickHighestDownload,
  useSettings,
} from '../../../index';
import { TbPlayerTrackPrev, TbPlayerTrackNext } from 'react-icons/tb';
import { FaCheck } from 'react-icons/fa6';
import { RiCheckboxBlankFill } from 'react-icons/ri';
import { FaCheckCircle, FaRedo, FaStepForward, FaUndo } from 'react-icons/fa';

type ArtInstance = import('artplayer').default;
type HlsInstance = import('hls.js').default;

// Resume discard threshold — ported verbatim from Aniraku
// `Watch.jsx:87` (`RESUME_MIN_TIME = 30`): a stored position only restores
// playback when it is strictly greater than 30s; 0 / absent / short values
// are ignored. The reference has NO near-end restart rule (a completed
// episode simply restores near its end), so none is added here.
const RESUME_MIN_TIME = 30;

// History-paused gate — byte-for-byte mirror of Watch.tsx:435's
// isHistoryPaused (Player cannot import it: pages/Watch imports this
// module, so importing back would create a cycle). Reads the same
// `miruro:watching` record and legacy `miruro:watching:history-paused`
// key. Used by the Item 3 ended-progress save.
const isHistoryPaused = (): boolean => {
  try {
    const record = localStorage.getItem('miruro:watching');
    if (record) {
      const parsed = JSON.parse(record);
      if (parsed && typeof parsed.historyPaused === 'boolean') {
        return parsed.historyPaused;
      }
    }
    const legacy = localStorage.getItem('miruro:watching:history-paused');
    if (legacy !== null) return JSON.parse(legacy) === true;
  } catch {
    // Malformed record — treat as not paused.
  }
  return false;
};

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.25rem;
  font-size: 0.8rem;
  color: var(--global-text-muted);
  cursor: pointer;
  background-color: var(--global-div-tr);
  border: none;
  border-radius: var(--global-border-radius);
  svg {
    margin-bottom: -0.1rem;
    color: inherit;
  }
  @media (max-width: 500px) {
    font-size: 0.7rem;
  }

  &:hover,
  &:focus-visible {
    color: var(--global-text);
    background-color: var(--global-div);
  }
  &:active {
    background-color: var(--global-div);
    transform: scale(0.9);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
  &.active {
    background-color: var(--primary-accent);
  }
`;

// ─── Zenime player chrome (ported verbatim from ~/Zenime Player.tsx) ─────────
// 16:9 black viewport around the ArtPlayer mount; $aspect lets theater mode
// stretch it to 21/9.
const PlayerViewport = styled.div<{ $aspect?: string }>`
  width: 100%;
  aspect-ratio: ${({ $aspect }) => $aspect ?? '16 / 9'};
  min-height: 12rem;
  position: relative;
  overflow: hidden;
  background-color: black;
  border-radius: var(--global-border-radius);

  > .player,
  > iframe {
    width: 100%;
    height: 100%;
  }
`;

const EmbeddedPlayerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .player-menu {
    position: static !important;
    width: 100%;
    z-index: 1;
  }
`;

const EmbeddedIframeWrapper = styled.div<{ $aspect?: string }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${({ $aspect }) => $aspect ?? '16 / 9'};
  min-height: 12rem;
  background-color: black;
  overflow: hidden;
`;

const EmbeddedIframe = styled.iframe`
  width: 100%;
  height: 100%;
  display: block;
  border: none;
  border-radius: var(--global-border-radius);
  background-color: black;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

type PlayerProps = {
  animeId: number;
  episode: number;
  lang?: 'sub' | 'dub';
  banner?: string;
  // MAL id — used ONLY for AniSkip (episode skip times). Never for streaming.
  malId?: string | number;
  // Optional server-picker override: direct HLS URL (+ subs + headers) from
  // the user-selected Aniraku server. When set, /stream is not called.
  srcOverride?: string | null;
  subsOverride?: { url: string; lang: string; label: string }[] | null;
  headersOverride?: Record<string, string> | null;
  updateDownloadLink: (link: string) => void;
  onEpisodeEnd: () => Promise<void>;
  onPrevEpisode: () => void;
  onNextEpisode: () => void;
  // GAP 4 (Item 1) — fired ONCE when playback genuinely starts for the
  // current episode (HLS: first `video:timeupdate` with t>0; embed: first
  // postMessage progress). Watch records the episode through its
  // EpisodeList-style dual-write history path — a direct-URL first visit
  // never runs handleEpisodeSelect, so without this a first-ever session
  // uploaded nothing until a click/auto-next.
  onPlaybackStart?: () => void;
  animeTitle?: string;
  // Real title object behind the poster's /info link — feeds infoPathFor so
  // the slug matches Info.tsx's own infoPathFor(animeInfo) byte for byte.
  animeTitleInfo?: LinkableTitle;
  // Whether a previous/next episode exists — drives the epNav labels
  // (`EP n` / `Episode n` vs the `Prev` / `Next` fallbacks) + disabled state.
  hasPrev?: boolean;
  hasNext?: boolean;
  // Live "Lights" toggle state (owned by Watch — the button below only
  // dispatches `miruro:shortcut` {action:'lights'}; Watch's single listener
  // performs the toggle).
  lightsOn?: boolean;
  // Zenime composition: embedded (FlixCloud) servers render INSIDE Player as
  // an iframe + control bar instead of a sibling <EmbedPlayer> component.
  embedded?: boolean;
  embeddedUrl?: string;
  // Viewport aspect — theater mode stretches the frame to 21/9.
  aspectRatio?: string;
  // Server pools + active selection for KeyD/KeyS source cycling (Aniraku
  // Watch.jsx:1406-1438). Watch owns these; Player reads them through a
  // render-assigned ref so the once-registered keydown never goes stale.
  serversSub?: any[];
  serversDub?: any[];
  selectedServer?: string;
  onSelectServer?: (key: string, serverLang: 'sub' | 'dub') => void;
};

type SkipTime = {
  interval: {
    startTime: number;
    endTime: number;
  };
  skipType: string;
};

type FetchSkipTimesResponse = {
  results: SkipTime[];
};

// Deduplicate subtitle tracks by (lang + normalized label): the stream API
// often returns the same track twice, and Vidstack builds track ids from
// lang (`:subtitles-english`) so duplicates collide.
function dedupeSubtitles(
  tracks: { url: string; lang: string; label?: string }[],
): { url: string; lang: string; label: string }[] {
  const seen = new Set<string>();
  return tracks
    .filter((t) => {
      const key = `${(t.lang || '').toLowerCase()}|${(t.label || '').trim().toLowerCase()}|${t.url}`;
      const langKey = `lang:${(t.lang || '').toLowerCase()}`;
      // Prefer dropping exact dupes first, then same-lang dupes (keep first).
      if (seen.has(key)) return false;
      if (seen.has(langKey)) return false;
      seen.add(key);
      seen.add(langKey);
      return true;
    })
    .map((t) => ({ url: t.url, lang: t.lang, label: t.label ?? '' }));
}


// ─── Subtitle customization system (ported from the reference ArtPlayer build) ───
// size              → percent scale of the 20px base (50%–200%)
// position          → pixel offset from the player bottom (0–400px)
// color             → text color, one of SUBTITLE_COLOR_OPTIONS
// outlineThickness  → 0–4 stroke weight
// outlineColor      → stroke color, one of SUBTITLE_COLOR_OPTIONS
// background        → caption box style
// font              → font family key, one of SUBTITLE_FONT_OPTIONS
export const SUBTITLE_PREFERENCES_LS_KEY = 'aniraku-subtitle-preferences-v1';
export const PLAYER_PREFERENCES_LS_KEY = 'aniraku-player-preferences-v1';

export interface SubtitlePreferences {
  track: string;
  size: string;
  color: string;
  outlineThickness: string;
  outlineColor: string;
  background: string;
  position: string;
  font: string;
  weight: string;
  opacity: string;
}

export const DEFAULT_SUBTITLE_PREFERENCES: SubtitlePreferences = Object.freeze({
  track: 'auto',
  size: '100',
  color: '#ffffff',
  outlineThickness: '4',
  outlineColor: '#000000',
  background: 'transparent',
  position: '100',
  font: 'helvetica',
  weight: '600',
  opacity: '100',
});

export const SUBTITLE_COLOR_OPTIONS = [
  { value: '#ffffff', label: 'White' },
  { value: '#d4d4d4', label: 'Light Gray' },
  { value: '#a3a3a3', label: 'Gray' },
  { value: '#5f5f5f', label: 'Dark Gray' },
  { value: '#000000', label: 'Black' },
  { value: '#ffe14d', label: 'Yellow' },
  { value: '#ffd700', label: 'Gold' },
  { value: '#ffa500', label: 'Orange' },
  { value: '#ff4d4d', label: 'Red' },
  { value: '#ff85a2', label: 'Pink' },
  { value: '#b57edc', label: 'Purple' },
  { value: '#61a5ff', label: 'Blue' },
  { value: '#4dd9ff', label: 'Cyan' },
  { value: '#4ade80', label: 'Green' },
];

export const SUBTITLE_BACKGROUND_OPTIONS = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export const SUBTITLE_FONT_OPTIONS = [
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'arial', label: 'Arial' },
  { value: 'verdana', label: 'Verdana' },
  { value: 'tahoma', label: 'Tahoma' },
  { value: 'times-new-roman', label: 'Times New Roman' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'courier-new', label: 'Courier New' },
  { value: 'homemade-apple', label: 'Homemade Apple' },
  { value: 'butterfly-kids', label: 'Butterfly Kids' },
];

export const SUBTITLE_SIZE_RANGE = [100, 50, 200, 5];
export const SUBTITLE_POSITION_RANGE = [100, 0, 400, 10];
export const SUBTITLE_OUTLINE_RANGE = [4, 0, 4, 1];

// Legacy preference keys (pre–player redesign) were named/valued differently.
// Migrate them in-place so old saves keep their intent.
export function normalizeSubtitlePreferences(stored: any): SubtitlePreferences {
  const legacySize: Record<string, string> = { small: '80', medium: '100', large: '130', xl: '160' };
  const legacyPosition: Record<string, string> = { bottom: '100', middle: '200', top: '300' };
  const legacyOutline: Record<string, string> = { soft: '3', strong: '4', none: '0' };
  const legacyFont: Record<string, string> = { system: 'helvetica', serif: 'georgia', mono: 'courier-new', rounded: 'verdana' };
  const legacyBackground: Record<string, string> = { none: 'transparent', solid: 'dark' };
  const isHex = (value: any) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || ''));
  const numeric = (value: any, fallback: string, min: number, max: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? String(Math.min(max, Math.max(min, parsed))) : fallback;
  };
  const size = legacySize[stored?.size] || numeric(stored?.size, '100', 50, 200);
  const position = legacyPosition[stored?.position] || numeric(stored?.position, '100', 0, 400);
  const outlineThickness = legacyOutline[stored?.outline] || numeric(stored?.outlineThickness, '4', 0, 4);
  return {
    ...DEFAULT_SUBTITLE_PREFERENCES,
    ...(stored && typeof stored === 'object' ? stored : {}),
    size,
    position,
    outlineThickness,
    outlineColor: isHex(stored?.outlineColor) ? stored.outlineColor : '#000000',
    color: isHex(stored?.color) ? stored.color : '#ffffff',
    background:
      legacyBackground[stored?.background] ||
      (['transparent', 'dark', 'light'].includes(stored?.background) ? stored.background : 'transparent'),
    font:
      legacyFont[stored?.font] ||
      (SUBTITLE_FONT_OPTIONS.some((option) => option.value === stored?.font) ? stored.font : 'helvetica'),
  };
}

export function readCookie(name: string): string {
  try {
    const match = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
  } catch {
    return '';
  }
}

export function writeCookie(name: string, value: string): void {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
  } catch {
    // Cookies can be disabled; localStorage remains the fallback.
  }
}

export interface PlayerPreferences {
  volume: number;
  muted: boolean;
  playbackRate: number;
  qualityMode: string | null;
  qualityTarget: number | null;
}

export function readPlayerPreferences(): PlayerPreferences {
  try {
    const raw = readCookie(PLAYER_PREFERENCES_LS_KEY) || localStorage.getItem(PLAYER_PREFERENCES_LS_KEY) || '{}';
    const stored = JSON.parse(raw);
    return {
      volume: Number.isFinite(Number(stored?.volume)) ? Math.max(0, Math.min(1, Number(stored.volume))) : 0.7,
      muted: Boolean(stored?.muted),
      playbackRate: Number.isFinite(Number(stored?.playbackRate))
        ? Math.max(0.5, Math.min(2, Number(stored.playbackRate)))
        : 1,
      qualityMode: stored?.qualityMode === 'auto' ? 'auto' : stored?.qualityMode === 'adaptive' ? 'adaptive' : null,
      // Accept any sane rendition height (144–4320), not a fixed 360–1080 ladder —
      // sources expose 1440p/2160p masters and the menu lists real levels.
      qualityTarget:
        Number.isFinite(Number(stored?.qualityTarget)) &&
        Number(stored.qualityTarget) >= 144 &&
        Number(stored.qualityTarget) <= 4320
          ? Number(stored.qualityTarget)
          : null,
    };
  } catch {
    return { volume: 0.7, muted: false, playbackRate: 1, qualityMode: null, qualityTarget: null };
  }
}

export function persistPlayerPreferences(preferences: PlayerPreferences): void {
  const serialized = JSON.stringify(preferences);
  writeCookie(PLAYER_PREFERENCES_LS_KEY, serialized);
  try {
    localStorage.setItem(PLAYER_PREFERENCES_LS_KEY, serialized);
  } catch {
    // Cookies are the primary persistence layer when storage is disabled.
  }
}

export function readSubtitlePreferences(): SubtitlePreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(SUBTITLE_PREFERENCES_LS_KEY) || '{}');
    return normalizeSubtitlePreferences(stored);
  } catch {
    return { ...DEFAULT_SUBTITLE_PREFERENCES };
  }
}

export function persistSubtitlePreferences(preferences: SubtitlePreferences): void {
  try {
    localStorage.setItem(SUBTITLE_PREFERENCES_LS_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can be disabled in private browsing; captions must still work.
  }
}

export function normalizeSubtitleType(url: string): string {
  const extension = String(url || '')
    .split('?')[0]
    .split('#')[0]
    .split('.')
    .pop()
    ?.toLowerCase();
  return extension === 'srt' || extension === 'ass' || extension === 'vtt' ? extension : 'vtt';
}

export interface SubtitleTrack {
  id: string;
  url: string;
  lang: string;
  label: string;
  type: string;
}

export function normalizeSubtitleTracks(subtitles: any): SubtitleTrack[] {
  const seen = new Set<string>();
  return (Array.isArray(subtitles) ? subtitles : [])
    .map((track: any, index: number) => {
      const url = String(track?.url || '').trim();
      if (!url || seen.has(url)) return null;
      seen.add(url);
      const lang = String(track?.lang || '')
        .trim()
        .toLowerCase();
      const label =
        String(track?.label || '').trim() ||
        (lang === 'en' || lang === 'eng' || lang === 'english'
          ? 'English'
          : lang === 'th'
            ? 'Thai'
            : lang === 'vi'
              ? 'Vietnamese'
              : lang === 'id'
                ? 'Indonesian'
                : lang
                  ? lang.toUpperCase()
                  : `Subtitle ${index + 1}`);
      return { id: `${index}:${url}`, url, lang, label, type: normalizeSubtitleType(url) };
    })
    .filter(Boolean) as SubtitleTrack[];
}

export function getDefaultSubtitleTrack(tracks: SubtitleTrack[]): SubtitleTrack | null {
  return (
    tracks.find(
      (track) => /^(en|eng|english)(?:[-_].*)?$/i.test(track.lang) || /english/i.test(track.label),
    ) || tracks[0] || null
  );
}

export function getSubtitleStyle(preferences: SubtitlePreferences): Record<string, string> {
  const clampNumber = (value: any, fallback: number, min: number, max: number) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  };
  const sizePercent = clampNumber(preferences?.size, 100, 50, 200);
  const positionPx = clampNumber(preferences?.position, 100, 0, 400);
  const thickness = clampNumber(preferences?.outlineThickness, 4, 0, 4);
  const outlineColor = preferences?.outlineColor || '#000000';
  const color = preferences?.color || '#ffffff';
  const background = (
    {
      dark: 'rgba(0, 0, 0, 0.72)',
      light: 'rgba(255, 255, 255, 0.92)',
      transparent: 'transparent',
    } as Record<string, string>
  )[preferences?.background] || 'transparent';
  const fontFamily = (
    {
      helvetica: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
      arial: 'Arial, "Helvetica Neue", sans-serif',
      verdana: 'Verdana, Geneva, sans-serif',
      tahoma: 'Tahoma, Geneva, sans-serif',
      'times-new-roman': '"Times New Roman", Times, serif',
      georgia: 'Georgia, "Times New Roman", serif',
      'courier-new': '"Courier New", Courier, monospace',
      'homemade-apple': '"Homemade Apple", cursive',
      'butterfly-kids': '"Butterfly Kids", cursive',
    } as Record<string, string>
  )[preferences?.font] || 'Helvetica, "Helvetica Neue", Arial, sans-serif';
  // Outline renders like the reference player: a solid colored stroke built
  // from -webkit-text-stroke plus layered shadows so non-WebKit browsers keep
  // a visible edge. Thickness 0 disables both.
  const strokeWidth = thickness > 0 ? (thickness * 0.45).toFixed(2) : null;
  const textShadow =
    thickness > 0
      ? [
          `0 0 ${thickness}px ${outlineColor}`,
          `0 0 ${thickness * 2}px ${outlineColor}`,
          `1px 1px ${outlineColor}`,
          `-1px -1px ${outlineColor}`,
          `1px -1px ${outlineColor}`,
          `-1px 1px ${outlineColor}`,
        ].join(', ')
      : 'none';
  return {
    top: 'auto',
    bottom: `${positionPx}px`,
    left: '4%',
    right: '4%',
    width: '92%',
    color,
    fontSize: `${Math.round((20 * sizePercent) / 100)}px`,
    fontFamily,
    fontWeight: preferences?.weight || '600',
    lineHeight: '1.35',
    backgroundColor: background,
    borderRadius: background === 'transparent' ? '0' : '5px',
    padding: background === 'transparent' ? '2px 0' : '4px 10px',
    WebkitTextStroke: strokeWidth ? `${strokeWidth}px ${outlineColor}` : 'unset',
    textShadow,
    opacity: `${clampNumber(preferences?.opacity, 100, 0, 100) / 100}`,
    boxSizing: 'border-box',
    textAlign: 'center',
    letterSpacing: ['homemade-apple', 'butterfly-kids'].includes(preferences?.font)
      ? '0.015em'
      : 'normal',
  };
}

export function applySubtitleStyle(art: any, preferences: SubtitlePreferences): void {
  const subtitle = art?.template?.$subtitle;
  if (!subtitle) return;
  const style = getSubtitleStyle(preferences);
  Object.assign(subtitle.style, style);
  subtitle.querySelectorAll('.art-subtitle-line').forEach((line: any) => {
    Object.assign(line.style, {
      color: style.color,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      WebkitTextStroke: style.WebkitTextStroke,
      textShadow: style.textShadow,
      letterSpacing: style.letterSpacing,
    });
  });
}

export function safelyUpdateSubtitle(art: any): boolean {
  const subtitle = art?.subtitle;
  const textTrack = subtitle?.textTrack;
  // ArtPlayer 5.4 can temporarily expose a textTrack whose `cues` is null
  // while switching captions off or while a new source is loading. Its
  // Subtitle.update() calls Array.from(activeCues), which throws in that
  // state. Wait until the browser has populated the cue list.
  if (!subtitle?.update || !textTrack || textTrack.cues == null) return false;
  try {
    const pending = subtitle.update();
    if (pending && typeof pending.catch === 'function') pending.catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export function escapeHtml(value: any): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Settings-row icons — exact Material Design filled paths (24×24 grid) so
// every glyph renders identically crisp at any DPI. Auto Skip / Auto Next /
// Subtitle Settings / Quality share the classic "tune" sliders icon from the
// reference build.
export const SETTING_ICON_PLAY_SPEED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:100%;height:100%" shape-rendering="geometricPrecision"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.1 8.2v7.6l6.1-3.8z" fill="currentColor"/></svg>`;
export const SETTING_ICON_ASPECT_RATIO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:100%;height:100%"><path d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16.01H3V4.99h18v14.02z" fill="currentColor"/></svg>`;
export const SETTING_ICON_CAPTIONS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:100%;height:100%"><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1z" fill="currentColor"/></svg>`;
export const SETTING_ICON_TUNE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:100%;height:100%"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" fill="currentColor"/></svg>`;
// Invisible spacer that keeps slider rows on the same label grid as every
// other row, without drawing a decorative gear inside the sub-menu.
export const SETTING_ICON_BLANK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:100%;height:100%"></svg>`;

// Full-buffer cache indicator (ported from the reference build): paints every
// video.buffered range into the progress bar as translucent segments. It reads
// video.buffered directly, so the same wiring covers hls.js/MSE and native
// loaders; segment keys are deduped and the DOM only updates inside a rAF
// frame. Returns a cleanup that unbinds and removes the layer.
function createFullBufferIndicator(
  video: HTMLVideoElement | null | undefined,
  container: Element | null | undefined,
): () => void {
  if (!video || !container) return () => {};
  const layer = document.createElement('div');
  layer.className = 'watch-buffer-indicator';
  layer.setAttribute('aria-hidden', 'true');
  container.appendChild(layer);
  let frame = 0;
  let lastKey = '';
  const draw = () => {
    frame = 0;
    const duration = Number(video.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      if (lastKey) {
        layer.innerHTML = '';
        lastKey = '';
      }
      return;
    }
    const buffered = video.buffered;
    let key = '';
    for (let index = 0; index < buffered.length; index += 1) {
      key += `${Math.round(buffered.start(index) * 10)},${Math.round(
        buffered.end(index) * 10,
      )};`;
    }
    if (key === lastKey) return;
    lastKey = key;
    let html = '';
    for (let index = 0; index < buffered.length; index += 1) {
      const start = buffered.start(index);
      const end = buffered.end(index);
      const left = Math.min(100, Math.max(0, (start / duration) * 100));
      const width = Math.min(
        100 - left,
        Math.max(0, ((end - start) / duration) * 100),
      );
      if (width < 0.25) continue;
      html += `<span class="watch-buffer-indicator-segment" style="left:${left}%;width:${width}%"></span>`;
    }
    layer.innerHTML = html;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };
  const events = [
    'loadedmetadata',
    'progress',
    'timeupdate',
    'canplay',
    'playing',
    'seeked',
    'seeking',
  ];
  events.forEach((name) => video.addEventListener(name, schedule));
  schedule();
  return () => {
    events.forEach((name) => video.removeEventListener(name, schedule));
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    layer.remove();
  };
}

// ── Chapter segments on the progress bar: Intro │ Main episode │ Outro ──────
// Data comes from the same skipSegmentsRef the auto-skip and hover layers
// read (AniSkip op/ed + provider windows) — chapters are DERIVED, not
// fetched. Null guards: no intro → Main starts at 0; no outro → Main runs to
// duration; neither → render nothing at all (a lone full-width "Main
// episode" bar would be noise). Corpus note: live miruro's bundle has no
// progress-bar chapter UI at all (its only Intro/Outro strings are the
// "Auto Skip Intro/Outro" setting row and the shortcuts-popup row), so the
// labels follow the requested wording verbatim.
type ChapterSegment = {
  id: 'intro' | 'main' | 'outro';
  label: string;
  start: number;
  end: number;
};

type SkipWindows = {
  intro: { start: number; end: number } | null;
  outro: { start: number; end: number } | null;
};

function deriveChapterSegments(
  segments: SkipWindows | null | undefined,
  duration: number,
): ChapterSegment[] {
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const clamp = (value: number) => Math.min(duration, Math.max(0, value));
  const normalize = (
    window: { start: number; end: number } | null | undefined,
  ) => {
    if (!window) return null;
    const start = clamp(Number(window.start));
    const end = clamp(Number(window.end));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return null;
    }
    return { start, end };
  };
  const intro = normalize(segments?.intro);
  const outro = normalize(segments?.outro);
  if (!intro && !outro) return [];

  const chapters: ChapterSegment[] = [];
  if (intro) {
    chapters.push({
      id: 'intro',
      label: 'Intro',
      start: intro.start,
      end: intro.end,
    });
  }
  const mainStart = intro ? intro.end : 0;
  const mainEnd = outro ? outro.start : duration;
  if (mainEnd > mainStart) {
    chapters.push({
      id: 'main',
      label: 'Main episode',
      start: mainStart,
      end: mainEnd,
    });
  }
  if (outro) {
    chapters.push({
      id: 'outro',
      label: 'Outro',
      start: outro.start,
      end: outro.end,
    });
  }
  return chapters;
}

/**
 * Overlay layer for the chapter spans, mounted into the same
 * `.art-control-progress-inner` stack as the buffer indicator. Decorative
 * boundary dividers are pointer-events:none; each segment start (>0) gets a
 * narrow transparent hit strip whose click seeks to THAT segment's start —
 * the rest of the bar keeps ArtPlayer's native click-to-position seek.
 * Hover labels come from the timeline tooltip (lib: body-level, escapes
 * this inner track's overflow:hidden clip, and now labels all three spans).
 * Returns { refresh, cleanup } so the [anirakuSkip] mirror effect can
 * redraw at every segment write/reset.
 */
function createChapterSegmentsLayer(
  video: HTMLVideoElement | null | undefined,
  container: Element | null | undefined,
  getSegments: () => SkipWindows,
): { refresh: () => void; cleanup: () => void } {
  if (!video || !container) {
    return { refresh: () => {}, cleanup: () => {} };
  }

  const layer = document.createElement('div');
  layer.className = 'watch-chapter-segments';
  layer.setAttribute('aria-hidden', 'true');
  container.appendChild(layer);

  const refresh = () => {
    const duration = Number(video.duration);
    layer.replaceChildren();
    if (!Number.isFinite(duration) || duration <= 0) return;
    const chapters = deriveChapterSegments(getSegments(), duration);
    if (!chapters.length) return; // hidden when no segments

    const drawnDividers = new Set<number>();
    for (const chapter of chapters) {
      const leftPercent = (chapter.start / duration) * 100;

      // Thin dividers at every chapter boundary (shared intro-end /
      // main-start boundaries deduped; the bar's own edges are implied).
      for (const boundary of [chapter.start, chapter.end]) {
        const percent = (boundary / duration) * 100;
        if (percent <= 0.01 || percent >= 99.99) continue;
        const bucket = Math.round(percent * 10);
        if (drawnDividers.has(bucket)) continue;
        drawnDividers.add(bucket);
        const divider = document.createElement('span');
        divider.className = 'watch-chapter-segment__divider';
        divider.style.left = `${percent}%`;
        layer.appendChild(divider);
      }

      // Narrow 14px seek strip centred on the segment START — clicks inside
      // it land exactly on the boundary; clicks anywhere else on the bar
      // fall through to ArtPlayer's native click-to-position seek. A start
      // of 0 is skipped (that's the bar's left edge — native seek already
      // gets you there).
      if (chapter.start > 0) {
        const hit = document.createElement('div');
        hit.className = 'watch-chapter-segment__hit';
        hit.dataset.chapter = chapter.id;
        hit.style.left = `calc(${leftPercent}% - 7px)`;
        // ArtPlayer seeks on mousedown — swallow it here so a boundary tap
        // is ONE seek, to the exact segment start, not to the cursor.
        hit.addEventListener('mousedown', (event) => {
          event.stopPropagation();
        });
        hit.addEventListener('touchstart', (event) => {
          event.stopPropagation();
        }, { passive: true });
        hit.addEventListener('click', (event) => {
          video.currentTime = Math.min(duration, Math.max(0, chapter.start));
          event.preventDefault();
          // One seek per click — ArtPlayer's own bar handler must not also run.
          event.stopPropagation();
        });
        layer.appendChild(hit);
      }
    }
  };

  const onMetadata = () => refresh();
  video.addEventListener('loadedmetadata', onMetadata);
  video.addEventListener('durationchange', onMetadata);
  refresh();

  return {
    refresh,
    cleanup: () => {
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('durationchange', onMetadata);
      layer.remove();
    },
  };
}

export function findOptionLabel(
  options: readonly { value: any; label: string }[],
  value: any,
): string | undefined {
  return options.find((option) => String(option.value) === String(value))?.label;
}

export function makeSubtitleSelectorSetting(
  name: string,
  label: string,
  key: keyof SubtitlePreferences,
  options: readonly { value: string; label: string }[],
  getPrefs: () => SubtitlePreferences,
  setPref: (key: string, value: string) => void,
) {
  return {
    name,
    width: 232,
    html: label,
    tooltip: findOptionLabel(options, getPrefs()[key]) || options[0]?.label || '',
    selector: options.map((option) => ({
      default: String(getPrefs()[key]) === String(option.value),
      html: escapeHtml(option.label),
      value: option.value,
    })),
    onSelect: (item: any) => {
      setPref(key, item.value);
      return findOptionLabel(options, item.value) || item.html;
    },
  };
}

export function makeSubtitleRangeSetting(
  name: string,
  label: string,
  key: keyof SubtitlePreferences,
  range: number[],
  format: (value: number) => string,
  getPrefs: () => SubtitlePreferences,
  setPref: (key: string, value: string) => void,
) {
  const current = () => {
    const parsed = Number(getPrefs()[key]);
    if (!Number.isFinite(parsed)) return range[0];
    return Math.min(range[2], Math.max(range[1], parsed));
  };
  return {
    name,
    width: 232,
    html: label,
    icon: SETTING_ICON_BLANK,
    range: [current(), range[1], range[2], range[3]],
    tooltip: format(current()),
    onChange: (item: any) => {
      const value = Number(item.range[0]) || 0;
      setPref(key, String(value));
      return format(value);
    },
    onRange: (item: any) => {
      const value = Number(item.range[0]) || 0;
      setPref(key, String(value));
      return format(value);
    },
  };
}

export function buildSubtitleStyleSettings(
  getPrefs: () => SubtitlePreferences,
  setPref: (key: string, value: string) => void,
) {
  return [
    makeSubtitleRangeSetting('subtitleSize', 'Font Size', 'size', SUBTITLE_SIZE_RANGE, (v) => `${v}%`, getPrefs, setPref),
    makeSubtitleRangeSetting('subtitlePosition', 'Position', 'position', SUBTITLE_POSITION_RANGE, (v) => `${v}px`, getPrefs, setPref),
    makeSubtitleSelectorSetting('subtitleFont', 'Font Family', 'font', SUBTITLE_FONT_OPTIONS, getPrefs, setPref),
    makeSubtitleSelectorSetting('subtitleColor', 'Text Color', 'color', SUBTITLE_COLOR_OPTIONS, getPrefs, setPref),
    makeSubtitleSelectorSetting('subtitleBackground', 'Background', 'background', SUBTITLE_BACKGROUND_OPTIONS, getPrefs, setPref),
    makeSubtitleRangeSetting('subtitleOutlineThickness', 'Thickness', 'outlineThickness', SUBTITLE_OUTLINE_RANGE, (v) => `${v}`, getPrefs, setPref),
    makeSubtitleSelectorSetting('subtitleOutlineColor', 'Outline Color', 'outlineColor', SUBTITLE_COLOR_OPTIONS, getPrefs, setPref),
  ];
}

export function buildSubtitleSettingsSetting(
  getPrefs: () => SubtitlePreferences,
  setPref: (key: string, value: string) => void,
) {
  return {
    name: 'subtitleSettings',
    width: 232,
    html: 'Subtitle Settings',
    icon: SETTING_ICON_TUNE,
    selector: buildSubtitleStyleSettings(getPrefs, setPref),
  };
}

// ─── ArtPlayer engine helpers (ported from the reference build) ────────────
const UA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const IS_IOS = /iPad|iPhone|iPod/.test(UA) && !('MSStream' in window);
const IS_MOBILE =
  IS_IOS ||
  /Android/i.test(UA) ||
  /webOS|BlackBerry|IEMobile|Opera Mini|Mobile Safari/i.test(UA);
const IS_TV =
  /Smart-TV|Apple-TV|GoogleTV|AndroidTV|HbbTV|NetCast|VIERA|SMART-TV/i.test(UA);

const SEEK_SECONDS = 15;
const UNLIMITED_CACHE_SECONDS = 21600;
const UNLIMITED_CACHE_MAX_BYTES = 8 * 1024 * 1024 * 1024;
// hls.js engines: unlimited forward/backward cache — the forward buffer may
// grow for the whole title and nothing behind the playhead is evicted, so
// every seek plays from cache instead of re-downloading.
const UNLIMITED_HLS_CACHE = {
  maxBufferLength: UNLIMITED_CACHE_SECONDS,
  maxMaxBufferLength: UNLIMITED_CACHE_SECONDS,
  maxBufferSize: UNLIMITED_CACHE_MAX_BYTES,
  backBufferLength: Infinity,
};

function seekVideoBy(art: ArtInstance | null, seconds: number): number | null {
  const video = art?.video;
  if (!video) return null;
  const duration =
    Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : Infinity;
  const nextTime = Math.min(
    duration,
    Math.max(0, (video.currentTime || 0) + seconds),
  );
  video.currentTime = nextTime;
  return nextTime;
}

function seekControlHtml(direction: number): string {
  // Official Material Design "replay" / "forward" glyph geometry — the
  // seek amount sits optically centered in the ring on the player's UI
  // font stack for crisp rendering.
  const label = String(SEEK_SECONDS);
  const body =
    direction < 0
      ? 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z'
      : 'M12 5V1L17 6l-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z';
  return `<span class="watch-art-seek-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" shape-rendering="geometricPrecision"><path d="${body}" fill="currentColor"/><text x="12" y="15.35" text-anchor="middle" font-family="-apple-system, 'Segoe UI', Roboto, Arial, sans-serif" font-size="6.6" font-weight="800" letter-spacing="-0.2" fill="currentColor">${label}</text></svg></span>`;
}

function prevEpisodeControlHtml(): string {
  // Exact Material Design "skip_previous" glyph — solid geometry: bar on
  // the left, triangle pointing into it.
  return `<span class="watch-art-prev-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" width="22" height="22" shape-rendering="geometricPrecision"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" fill="currentColor"/></svg></span>`;
}

function nextEpisodeControlHtml(): string {
  // Exact Material Design "skip_next" glyph — the mirrored twin: bar on
  // the right, triangle pointing into it.
  return `<span class="watch-art-next-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" width="22" height="22" shape-rendering="geometricPrecision"><path d="M16 6h2v12h-2zM6 6v12l8.5-6z" fill="currentColor"/></svg></span>`;
}

function chromecastControlHtml(): string {
  // Exact Material Design "cast" glyph: rounded screen with the signal
  // waves emanating from the bottom-left corner.
  return `<span class="watch-art-cast-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" width="22" height="22" shape-rendering="geometricPrecision"><path d="M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z" fill="currentColor"/></svg></span>`;
}

function getQualityPresentation(value: unknown) {
  const raw = String(value ?? '').trim();
  const normalized = raw.toLowerCase();
  if (/2160|4k|uhd/.test(normalized)) {
    return { label: '4K', badge: 'Ultra HD', rank: 2160, key: '2160p', isAuto: false };
  }
  if (/1440|2k|qhd/.test(normalized)) {
    return { label: '1440p', badge: 'QHD', rank: 1440, key: '1440p', isAuto: false };
  }
  if (/1080|full.?hd|fhd/.test(normalized)) {
    return { label: '1080p', badge: 'Full HD', rank: 1080, key: '1080p', isAuto: false };
  }
  if (/720|hd/.test(normalized)) {
    return { label: '720p', badge: 'HD', rank: 720, key: '720p', isAuto: false };
  }
  if (/480/.test(normalized)) {
    return { label: '480p', badge: 'SD', rank: 480, key: '480p', isAuto: false };
  }
  if (/360/.test(normalized)) {
    return { label: '360p', badge: 'Low', rank: 360, key: '360p', isAuto: false };
  }
  if (/auto|adaptive|master|original|default/.test(normalized) || !raw) {
    return { label: 'Auto', badge: 'Adaptive', rank: 0, key: 'auto', isAuto: true };
  }
  return {
    label: raw.length > 12 ? `${raw.slice(0, 12)}…` : raw,
    badge: 'Source',
    rank: 0,
    key: normalized,
    isAuto: false,
  };
}

function qualityOptionHtml(
  presentation: ReturnType<typeof getQualityPresentation>,
): string {
  const badge = presentation.badge
    ? `<span class="watch-quality-badge">${escapeHtml(presentation.badge)}</span>`
    : '';
  return `<span class="watch-quality-option"><span class="watch-quality-name">${escapeHtml(presentation.label)}</span>${badge}</span>`;
}

// Presentation for a concrete manifest rendition height (e.g. 1080 →
// "1080p / Full HD"). Heights outside the well-known ladder keep a clean
// numeric label without the "Source" badge.
function getHeightPresentation(height: number) {
  const presentation = getQualityPresentation(`${Number(height)}p`);
  return presentation.rank > 0 ? presentation : { ...presentation, badge: '' };
}

// Row labels for the settings panel. Speeds render like the reference
// player: "0.5 / 0.8 / Normal / 1.3 / 1.5 / 2.0"; quality names collapse
// provider labels such as "1080P" to the familiar "1080p".
function playSpeedSettingLabel(rate: number): string {
  const numeric = Number(rate);
  if (!Number.isFinite(numeric) || numeric === 1) return 'Normal';
  return numeric.toFixed(1);
}

function qualitySettingLabel(entry: { label?: string; html?: string }): string {
  const label = String(entry?.label || entry?.html || '')
    .replace(/<[^>]*>/g, '')
    .trim();
  if (!label) return 'Auto';
  return label.replace(/(\d+)\s*p\b/gi, '$1p');
}

function syncArtPlayerSetting(
  art: ArtInstance | null,
  name: string,
  value: unknown,
  label?: string,
): void {
  const setting = art?.setting?.find?.(name);
  if (!setting) return;
  if (label) {
    // Only the gray value chip updates — the row keeps its fixed title
    // ("Captions", "Quality"…) so the menu never turns into a stack of
    // mismatched labels.
    setting.tooltip = label;
  }
  if (Array.isArray(setting.selector)) {
    setting.selector.forEach((option) => {
      const selected = String(option.value) === String(value);
      option.default = selected;
      const controlItem = option.$control_item || option.$item;
      if (controlItem) controlItem.classList.toggle('art-current', selected);
    });
    const selectedOption = setting.selector.find(
      (option) => String(option.value) === String(value),
    );
    if (selectedOption) {
      try {
        (art?.setting as { check?: (o: unknown) => void } | undefined)?.check?.(
          selectedOption,
        );
      } catch {
        // check() is best-effort
      }
    }
  }
}

function getHlsLevelLabel(level?: {
  height?: number;
  bitrate?: number;
}): string {
  const height = Number(level?.height || 0);
  const bitrate = Number(level?.bitrate || 0);
  if (height > 0) return `${height}p`;
  if (bitrate > 0) return `${Math.round(bitrate / 1000)}kbps`;
  return 'Source';
}

function selectLevelForQualityTarget(
  levels: Array<{ index: number; height: number; bitrate: number }>,
  targetHeight: number,
  maxBitrate = Infinity,
) {
  const usable = levels.filter((level) => Number(level?.height) > 0);
  if (!usable.length) return null;
  const target = Number(targetHeight);
  const underBudget = usable.filter((level) => {
    const bitrate = Number(level?.bitrate || 0);
    return bitrate <= 0 || bitrate <= Number(maxBitrate);
  });
  const candidates = underBudget.length ? underBudget : usable;
  // Rank by (1) at-or-under the requested height first, (2) closest to the
  // requested height, (3) higher bitrate as the final tie-break. The previous
  // comparator sorted distances in descending order, which silently picked
  // the FARTHEST rendition — choosing 1080p could pin 480p.
  return [...candidates].sort((a, b) => {
    const aHeight = Number(a.height);
    const bHeight = Number(b.height);
    const aUnderTarget = aHeight <= target;
    const bUnderTarget = bHeight <= target;
    if (aUnderTarget !== bUnderTarget) return aUnderTarget ? -1 : 1;
    return (
      Math.abs(aHeight - target) - Math.abs(bHeight - target)
    ) || (bHeight - aHeight);
  })[0];
}

// Ended-overlay actions (ported): card-styled text buttons. Aniraku's var
// names lead; Miruro's theme name then a literal cover other themes.
const navBtnStyle = {
  background: 'var(--bg-card, var(--global-card-bg, rgba(255,255,255,0.07)))',
  padding: '10px 18px',
  borderRadius: 8,
  color: 'var(--text-secondary, #cbd5e1)',
  textDecoration: 'none',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontWeight: 500,
  minHeight: 44,
  border: '1px solid var(--border, rgba(255,255,255,0.16))',
  transition: 'all 0.15s',
  cursor: 'pointer',
};

export function Player({
  animeId,
  episode,
  lang = 'sub',
  banner,
  malId,
  srcOverride,
  subsOverride,
  headersOverride,
  updateDownloadLink,
  onEpisodeEnd,
  onPrevEpisode,
  onNextEpisode,
  onPlaybackStart,
  animeTitle,
  animeTitleInfo,
  hasPrev = true,
  hasNext = true,
  lightsOn = false,
  embedded = false,
  embeddedUrl = '',
  aspectRatio,
  serversSub = [],
  serversDub = [],
  selectedServer = '',
  onSelectServer,
}: PlayerProps) {
  // ── Zenime bridge state (ported): embedded-iframe progress/ended machine
  // + single-transition lock so double-ended events can't stack auto-next.
  const [builtEmbeddedUrl, setBuiltEmbeddedUrl] = useState<string>('');
  const playbackTransitionRef = useRef(false);
  const playbackTransitionLockUntilRef = useRef(0);
  const iframeProgressRef = useRef({
    currentTime: 0,
    duration: 0,
    hasTriggeredEnd: false,
  });
  // AniList progress sync: Miruro has no auth bridge (no syncWatchProgress /
  // getAniListIdFromMalId in this build) — stays null so every guarded call
  // is a structural no-op (reported gap).
  const saveAniListProgressRef = useRef<
    ((episodeNumber: number) => Promise<void>) | null
  >(null);
  const { isLoggedIn } = useAuth();
  const [src, setSrc] = useState<string>('');
  const [srcType, setSrcType] = useState<'hls' | 'mp4'>('hls');
  const [subTracks, setSubTracks] = useState<
    { url: string; lang: string; label: string }[]
  >([]);
  const [streamHeaders, setStreamHeaders] = useState<Record<string, string>>(
    {},
  );
  // Playback fallback chain: every fetch records its playable
  // candidates; on a media error we advance to the next candidate, and if
  // the user-selected override itself is dead we fall back to the POST
  // /stream path exactly once (overrideFailedRef) instead of dying on a
  // black screen.
  const candidatesRef = useRef<
    {
      url: string;
      type?: string;
      subs: { url: string; lang: string; label: string }[];
      headers: Record<string, string>;
    }[]
  >([]);
  const candidateIndexRef = useRef(-1);
  const overrideFailedRef = useRef(false);
  const fetchFnRef = useRef<() => void>(() => {});
  // ── No-source UI (task) ───────────────────────────────────────────────────
  // `streamRetry` rides the discovery effect's deps so the overlay's Retry
  // button re-runs the SAME /stream fetch path; `sourceFailed` flips when
  // that discovery errors or yields zero playable sources (HLS mode);
  // `embedMissing` covers embedded=true with an empty embeddedUrl —
  // grace-gated below so Watch's one-paint-late URL never flashes it.
  const [streamRetry, setStreamRetry] = useState(0);
  const [sourceFailed, setSourceFailed] = useState(false);
  const [embedMissing, setEmbedMissing] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [anirakuSkip, setAnirakuSkip] = useState<{
    intro?: { start: number; end: number };
    outro?: { start: number; end: number };
  }>({});
  // Human track labels + English default (mirrors Aniraku track picking).
  const prettySubLabel = (t: { url: string; lang: string; label: string }, i: number) => {
    if (t.label) return t.label;
    const lang = (t.lang || '').toLowerCase();
    if (['en', 'eng', 'english'].includes(lang)) return 'English';
    if (lang === 'th') return 'Thai';
    if (lang === 'vi') return 'Vietnamese';
    if (lang === 'id') return 'Indonesian';
    if (lang) return lang.toUpperCase();
    return `Subtitle ${i + 1}`;
  };
  const episodeNumber = String(episode);
  const episodeKey = `${animeId}-episode-${episode}`;
  const animeVideoTitle = animeTitle;

  const { settings, setSettings } = useSettings();
  const { autoPlay } = settings;
  // ── Settings-page AUTHORITY for auto-skip/auto-next (mission rule) ────────
  // The `miruro:settings` record (written by SettingsProvider + the Settings
  // page) is the SINGLE source of truth. Per-elsewhere local values (flat
  // `autoSkip`/`autoNext`, legacy `aniraku-auto-*`) never win — the old
  // mount-time `aniraku-auto-*` seed below was removed for this reason.
  // MISSING KEY = ON: a field absent from `record.settings` means "never
  // configured" → enabled. When the field is present, the reactive context
  // value (same record) wins, so both toggles stay live in both directions.
  const settingsToggleMissing = (field: 'autoSkip' | 'autoNext'): boolean => {
    try {
      const raw = localStorage.getItem('miruro:settings');
      const stored = raw ? JSON.parse(raw)?.settings : null;
      return !(stored && typeof stored === 'object' && field in stored);
    } catch {
      // Unreadable record ≡ missing key → ON.
      return true;
    }
  };
  const autoSkip = settingsToggleMissing('autoSkip')
    ? true
    : settings.autoSkip;
  const autoNext = settingsToggleMissing('autoNext')
    ? true
    : settings.autoNext;
  const navigate = useNavigate();

  // Stale-closure guards (Zenime parity): callbacks/refs always see fresh
  // values even when registered once (bridge effect, media events).
  const onEpisodeEndRef = useRef(onEpisodeEnd);
  const autoNextRef = useRef(autoNext);
  useEffect(() => {
    onEpisodeEndRef.current = onEpisodeEnd;
    autoNextRef.current = autoNext;
  }, [onEpisodeEnd, autoNext]);

  // (Removed: the mount-time `aniraku-auto-skip`/`aniraku-auto-next` seed —
  // under the Settings-authority rule those legacy keys are per-elsewhere
  // values that must YIELD to the Settings record, so nothing reads or
  // writes them anymore. See `settingsToggleMissing` above.)

  // Caption fonts: inject the bundled @font-face rules once and warm both
  // faces so subtitle style changes apply without a reflow flash.
  useEffect(() => {
    const style = document.createElement('style');
    style.dataset.anirakuCaptionFont = 'custom-google-fonts';
    style.textContent = `
      @font-face {
        font-family: 'Homemade Apple';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('${HomemadeAppleUrl}') format('truetype');
      }
      @font-face {
        font-family: 'Butterfly Kids';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('${ButterflyKidsUrl}') format('truetype');
      }
    `;
    document.head.appendChild(style);
    document.fonts?.load('400 32px "Homemade Apple"');
    document.fonts?.load('400 32px "Butterfly Kids"');
    return () => style.remove();
  }, []);

  // ── ArtPlayer engine refs (ported): mount node, instance, hls, build guard ──
  const artMountRef = useRef<HTMLDivElement | null>(null);
  const artInstanceRef = useRef<ArtInstance | null>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const buildIdRef = useRef(0);
  const hlsPreloadPromiseRef = useRef<Promise<unknown> | null>(null);
  const bufferIndicatorCleanupRef = useRef<(() => void) | null>(null);
  const timelineHoverCleanupRef = useRef<{
    refresh: () => void;
    cleanup: () => void;
  } | null>(null);
  // Chapter-segment layer controller (Intro │ Main episode │ Outro) — same
  // { refresh, cleanup } shape as the hover layer above it.
  const chapterLayerRef = useRef<{
    refresh: () => void;
    cleanup: () => void;
  } | null>(null);
  const pendingResumeRef = useRef<number | null>(null);
  // Recovery-position bookkeeping: the token identifies the current episode
  // load (Aniraku keys its resume fetch on [animeId, epNumber]); the applied
  // flag enforces SEEK-ONCE per episode load so a late server row can never
  // yank a playing video or loop against the skip-mirror/chapter effects;
  // the instance token ties a live ArtPlayer build to its episode load so a
  // seed can only direct-seek an instance built for the same episode.
  const resumeTokenRef = useRef(0);
  const resumeAppliedRef = useRef(false);
  const instanceEpisodeTokenRef = useRef(0);
  // ── Item 2 — resume countdown overlay (Aniraku Watch.jsx:1593-1594) ──────
  // `resumeTarget` mirrors the reference's `resumePos` (seconds; null =
  // hidden), `resumeCountdown` its `resumeCountdown` (3 → 0). The seed no
  // longer seeks silently: it opens the dialog, and the seek happens from
  // commitResume when the countdown hits zero or the user presses Resume.
  // "Start Over" dismisses WITHOUT a seek (reference semantics) — the seed
  // stays consumed (resumeAppliedRef) so no late server row can re-open it.
  const [resumeTarget, setResumeTarget] = useState<number | null>(null);
  const [resumeCountdown, setResumeCountdown] = useState(0);
  const resumeTargetRef = useRef<number | null>(null);
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const clearResumeCountdown = useCallback(() => {
    if (resumeIntervalRef.current != null) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }
  }, []);
  // The one guarded seek (token + seek-once kept intact). Direct seek when
  // THIS episode's instance is live; otherwise hand the position to
  // pendingResumeRef for the build's readyState/`loadedmetadata` block —
  // the exact two paths the silent resume used.
  const commitResume = useCallback(
    (token: number) => {
      const seconds = resumeTargetRef.current;
      if (resumeTokenRef.current !== token || seconds == null) return;
      if (!(seconds > RESUME_MIN_TIME)) return;
      resumeAppliedRef.current = true; // SEEK-ONCE guard (see refs above)
      resumeTargetRef.current = null;
      clearResumeCountdown();
      setResumeTarget(null);
      setResumeCountdown(0);
      const video = artInstanceRef.current?.video;
      if (
        video &&
        video.readyState >= 1 &&
        instanceEpisodeTokenRef.current === token
      ) {
        try {
          video.currentTime = seconds;
        } catch {
          // Detached video — nothing to seek.
        }
      } else if (video && instanceEpisodeTokenRef.current === token) {
        // Metadata still loading when the countdown ends — seek the moment
        // it lands. Token-guarded; a detached/rebuilt element never fires
        // again, so this can never seek after destroy.
        video.addEventListener(
          'loadedmetadata',
          () => {
            if (resumeTokenRef.current !== token) return;
            try {
              video.currentTime = seconds;
            } catch {
              // Detached video — nothing to seek.
            }
          },
          { once: true },
        );
      } else {
        // Not built yet, or a stale instance is still mounted: the current
        // build's loadedmetadata block consumes this exactly once.
        pendingResumeRef.current = seconds;
      }
    },
    [clearResumeCountdown],
  );
  // "Start Over" (Aniraku Watch.jsx:6112-6119): drop the dialog, no seek.
  const dismissResume = useCallback(() => {
    resumeTargetRef.current = null;
    resumeAppliedRef.current = true; // decision consumed for this load
    clearResumeCountdown();
    setResumeTarget(null);
    setResumeCountdown(0);
  }, [clearResumeCountdown]);
  const sessionQualityTargetRef = useRef<number | null>(null);
  const subtitleSwitchGenerationRef = useRef(0);
  const subtitlePreferencesRef = useRef<SubtitlePreferences>(
    readSubtitlePreferences(),
  );
  const playerPreferencesRef = useRef<PlayerPreferences>(
    readPlayerPreferences(),
  );
  const skipSegmentsRef = useRef<{
    intro: { start: number; end: number } | null;
    outro: { start: number; end: number } | null;
  }>({ intro: null, outro: null });
  // The player's ONE `document` keydown (capture) — kept in a ref so both
  // teardown paths (build-effect cleanup + destroyPlayer) detach the exact
  // same function reference. Registration lives with the ArtPlayer build.
  const playerKeydownHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(
    null,
  );
  const removePlayerKeydown = useCallback(() => {
    const handler = playerKeydownHandlerRef.current;
    if (handler) {
      document.removeEventListener('keydown', handler, true);
      playerKeydownHandlerRef.current = null;
    }
  }, []);
  const [forceMse, setForceMse] = useState(false);
  const [posterHidden, setPosterHidden] = useState(false);
  // Auto-skip attempt machine (ported): per-segment handled/failed flags so
  // the manual overlay only appears as a fallback (or after seeking back).
  const autoSkipRef = useRef(autoSkip);
  const autoSkippedRef = useRef({ intro: false, outro: false });
  const [autoSkipFailures, setAutoSkipFailures] = useState({
    intro: false,
    outro: false,
  });
  const autoSkipFailuresRef = useRef(autoSkipFailures);
  autoSkipFailuresRef.current = autoSkipFailures;
  useEffect(() => {
    autoSkipRef.current = autoSkip;
  }, [autoSkip]);
  // "Episode finished" overlay — shown when auto-next is off or ended.
  const [showEndedOverlay, setShowEndedOverlay] = useState(false);
  const onPrevEpisodeRef = useRef(onPrevEpisode);
  const onNextEpisodeRef = useRef(onNextEpisode);
  // Item 1 — first-playback reporter (Watch's dual-write trigger), mirrored
  // like the episode refs so the once-built timeupdate/embed listeners
  // never hold a stale prop. `playbackStartRecordedRef` fires it at most
  // once per episode load; Watch dedupes per `${animeId}:${episode.id}` on
  // top, covering ref resets when isLoggedIn flips mid-episode.
  const onPlaybackStartRef = useRef(onPlaybackStart);
  const playbackStartRecordedRef = useRef(false);
  onPlaybackStartRef.current = onPlaybackStart;
  const handlePlaybackEndedRef = useRef<() => Promise<void>>(
    () => Promise.resolve(),
  );
  onPrevEpisodeRef.current = onPrevEpisode;
  onNextEpisodeRef.current = onNextEpisode;
  // Latest-props mirrors for the keydown handler (registered once per
  // build): theater aspect — the Escape branch's web-fs/theater tier — and
  // the sub/dub pools behind KeyD/KeyS. Direct render assignment, same
  // house style as the two episode refs above; NOT build deps, so server or
  // theater flips never rebuild ArtPlayer (src changes do that themselves).
  const aspectRatioRef = useRef(aspectRatio);
  aspectRatioRef.current = aspectRatio;
  const sourceCycleRef = useRef({
    serversSub,
    serversDub,
    selectedServer,
    onSelectServer,
  });
  sourceCycleRef.current = {
    serversSub,
    serversDub,
    selectedServer,
    onSelectServer,
  };

  // Subtitle preference setter (ref-only state): persists, then restyles the
  // live captions immediately — no React re-render needed for styling.
  const setSubtitlePreference = useCallback((key: string, value: string) => {
    const next = {
      ...subtitlePreferencesRef.current,
      [key]: value,
    } as SubtitlePreferences;
    subtitlePreferencesRef.current = next;
    persistSubtitlePreferences(next);
    const art = artInstanceRef.current;
    if (art?.subtitle?.style) {
      art.subtitle.style(getSubtitleStyle(next));
      safelyUpdateSubtitle(art);
      applySubtitleStyle(art, next);
    }
    return next;
  }, []);

  const destroyPlayer = useCallback(() => {
    // Release the page scroll lock during teardown — ArtPlayer may not emit
    // its fullscreen=false event when destroyed while fullscreen.
    document.documentElement.classList.remove('body-hidden');
    document.body.classList.remove('body-hidden');
    // Keyboard listener dies with the player it was registered for (the
    // unmount effect routes through here; the build effect also calls this
    // before constructing a replacement instance).
    removePlayerKeydown();
    bufferIndicatorCleanupRef.current?.();
    bufferIndicatorCleanupRef.current = null;
    timelineHoverCleanupRef.current?.cleanup();
    timelineHoverCleanupRef.current = null;
    chapterLayerRef.current?.cleanup();
    chapterLayerRef.current = null;
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // engine already gone
      }
      hlsRef.current = null;
    }
    const art = artInstanceRef.current;
    if (art) {
      try {
        art.video?.pause?.();
      } catch {
        // detached video
      }
      try {
        art.destroy(false);
      } catch {
        // already destroyed
      }
      artInstanceRef.current = null;
      if (artMountRef.current) {
        try {
          artMountRef.current
            .querySelectorAll('.art-video-player')
            .forEach((node) => node.remove());
        } catch {
          // template already gone
        }
      }
    }
  }, []);

  useEffect(
    () => () => {
      destroyPlayer();
    },
    [destroyPlayer],
  );

  // Zenime: ONE Player owns both modes — iframe for embedded servers.
  // Degrade rule (no-source task): when the embed URL never arrived AND the
  // visitor's Retry re-ran discovery which found a direct HLS source, drop
  // to direct playback — a working player beats an empty iframe. Otherwise
  // keep the embed shell.
  const isEmbedded =
    embedded && !(embedMissing && streamRetry > 0 && Boolean(src));
  const isFlixcloudEmbed =
    isEmbedded && Boolean(embeddedUrl?.includes('flixcloud.cc'));
  // Stable iframe key: changes only when episode/server/URL change.
  const stableIframeKey = `${animeId}-${episode}-${embeddedUrl || ''}`;

  // Embedded-with-no-URL grace: Watch fills embeddedUrl from its sync
  // effect one paint after this component mounts (and a settled embed
  // server may genuinely carry no playable URL). Only declare it missing
  // after a short window of continued emptiness; an arriving URL — or the
  // URL being cleared on an episode/server switch — resets the check.
  useEffect(() => {
    if (!embedded || embeddedUrl) {
      setEmbedMissing(false);
      return undefined;
    }
    setEmbedMissing(false);
    const timer = window.setTimeout(() => setEmbedMissing(true), 1200);
    return () => window.clearTimeout(timer);
  }, [embedded, embeddedUrl]);

  useEffect(() => {
    // Zenime parity: embedded servers own their fetch path — never hit
    // Aniraku /stream while the iframe is up (and clear stale HLS state).
    // Exception (no-source task): the embed URL never arrived AND the
    // visitor pressed Retry — fall through to /stream discovery so the
    // frame isn't a permanent black box.
    if (embedded && !(embedMissing && streamRetry > 0)) {
      setSrc('');
      setSubTracks([]);
      return;
    }
    // (Recovery position seeding moved to the dedicated per-episode resume
    // effect below — the old read of the legacy global `currentTime` key was
    // dead code: nothing in this build ever writes that key.)

    // Fresh fetch trigger (episode/server switch) — give an active override
    // a new chance before the /stream fallback engages.
    overrideFailedRef.current = false;
    // New episode: clear stale skip windows before either source lands
    // (provider /stream or the AniSkip cache/refresh).
    setAnirakuSkip({});
    skipSegmentsRef.current = { intro: null, outro: null };
    autoSkippedRef.current = { intro: false, outro: false };
    const clearedFailures = { intro: false, outro: false };
    autoSkipFailuresRef.current = clearedFailures;
    setAutoSkipFailures(clearedFailures);
    setShowEndedOverlay(false);

    fetchAndSetAnimeSource();
    fetchAndProcessSkipTimes();
  }, [
    animeId,
    episode,
    lang,
    malId,
    srcOverride,
    subsOverride,
    headersOverride,
    updateDownloadLink,
    embedded,
    embedMissing,
    streamRetry,
  ]);

  // ── Recovery position (ported: Aniraku Watch.jsx:2616-2707) ───────────────
  // One lookup per episode load, keyed like Aniraku's [animeId, epNumber]:
  //  - signed-in → server-first: Wave B's `watch_history` reader
  //    (fetchServerHistoryRows), local fills gaps / leads — Wave B's merge
  //    precedence is max(progress); the native store carries no timestamp,
  //    so Aniraku's newest-timestamp tiebreak can't be ported literally.
  //  - guest → the documented local stores only (`all_episode_times` +
  //    watchHistory's merged rows, which also fold `aniraku-watch-history`).
  // Discard rule: only Aniraku's RESUME_MIN_TIME (>30s) — stored=0 / short
  // positions never seek; the reference has NO near-end restart rule.
  // Apply paths (seed consumed once per episode load via resumeAppliedRef):
  //  - Item 2: a valid seed now OPENS the 3-second countdown dialog instead
  //    of seeking silently (Aniraku Watch.jsx:2616-2632 + 2704-2707); the
  //    seek runs from commitResume when the countdown hits zero or the
  //    user presses Resume. Start Over dismisses without seeking.
  //  - commitResume keeps the original two seek paths: direct when this
  //    episode's instance is live, else pendingResumeRef for the build's
  //    readyState/`loadedmetadata` block.
  useEffect(() => {
    const token = ++resumeTokenRef.current;
    resumeAppliedRef.current = false;
    pendingResumeRef.current = null;
    // Item 2 — drop any countdown carried over from the previous load.
    resumeTargetRef.current = null;
    clearResumeCountdown();
    setResumeTarget(null);
    setResumeCountdown(0);
    // Item 1 — the first-playback record fires once per episode load.
    playbackStartRecordedRef.current = false;
    // One cleanup for every exit — the countdown interval must never
    // outlive this episode load (also runs on unmount).
    const stopCountdown = () => {
      clearResumeCountdown();
      resumeTargetRef.current = null;
    };
    if (embedded) return stopCountdown; // iframes own their progress path (postMessage)

    const applySeed = (seconds: number) => {
      // Episode changed again, or the seed was already consumed (shown).
      if (resumeTokenRef.current !== token || resumeAppliedRef.current) return;
      if (!(seconds > RESUME_MIN_TIME)) return; // 0 / <30s → no dialog
      resumeAppliedRef.current = true; // consumed ONCE per episode load
      // Item 2 — Aniraku Watch.jsx:2621-2631: show the dialog, count
      // 3 → 2 → 1; at zero the auto-resume effect below performs the
      // guarded seek.
      resumeTargetRef.current = seconds;
      setResumeTarget(seconds);
      let count = 3;
      setResumeCountdown(count);
      resumeIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearResumeCountdown();
          setResumeCountdown(0);
        } else {
          setResumeCountdown(count);
        }
      }, 1000);
    };

    let localSeconds = 0;
    try {
      const playback = JSON.parse(
        localStorage.getItem(LOCAL_HISTORY_KEYS.EPISODE_PLAYBACK) || '{}',
      );
      const entry = playback[`${animeId}-episode-${episode}`];
      const t = Number(entry?.currentTime);
      if (Number.isFinite(t) && t > localSeconds) {
        localSeconds = Math.floor(t);
      }
    } catch {
      // Corrupt playback store — the merged-row read below still applies.
    }
    try {
      const row = readLocalHistoryRows().find(
        (r) =>
          r.anime_id === Number(animeId) &&
          r.episode_number === Number(episode),
      );
      if (row && Number(row.progress) > localSeconds) {
        localSeconds = Math.floor(Number(row.progress));
      }
    } catch {
      // Merged-row read failed — raw store value already captured.
    }

    if (!isLoggedIn) {
      applySeed(localSeconds);
      return stopCountdown;
    }
    // Server-first for signed-in users (mission rule), then max(server,
    // local) so a fresher local session never rewinds. Errors fall back to
    // the local value captured above.
    void (async () => {
      let serverSeconds = 0;
      try {
        const userId = await getSessionUserId();
        if (userId) {
          const rows = await fetchServerHistoryRows(userId);
          const row = rows.find(
            (r) =>
              r.anime_id === Number(animeId) &&
              r.episode_number === Number(episode),
          );
          if (row) serverSeconds = Math.floor(Number(row.progress) || 0);
        }
      } catch {
        // Offline / unconfigured client — local fallback below.
      }
      applySeed(Math.max(serverSeconds, localSeconds));
    })();
    return stopCountdown;
  }, [animeId, episode, embedded, isLoggedIn]);

  // Item 2 — countdown reached zero with a target still open → perform the
  // guarded seek now (Aniraku Watch.jsx:2704-2707: `if (resumeCountdown > 0
  // || !resumePos) return; handleResume()`). Resume and Start Over both
  // clear the target first, so only the interval hitting 0 can fire this.
  useEffect(() => {
    if (resumeCountdown > 0 || resumeTarget == null) return;
    commitResume(resumeTokenRef.current);
  }, [resumeCountdown, resumeTarget, commitResume]);

  // Playback error → advance candidates → fall back to /stream once.
  // Shared by ArtPlayer's video:error handler and the hls.js fatal path
  // (ported from the former vidstack vds-error listener).
  function advanceOnError() {
    const candidates = candidatesRef.current;
    const nextIndex = candidateIndexRef.current + 1;
    if (nextIndex < candidates.length) {
      candidateIndexRef.current = nextIndex;
      applyCandidate(candidates[nextIndex]);
      return;
    }
    if (srcOverride && !overrideFailedRef.current) {
      // Selected server is dead — retry through POST /stream once.
      overrideFailedRef.current = true;
      candidatesRef.current = [];
      candidateIndexRef.current = -1;
      fetchFnRef.current();
      return;
    }
    console.error('[Player] media error with no candidates left');
  }

  // AniSkip results are cached per (MAL id, episode) for 24h. The provider's
  // own intro/outro (from /stream) always wins when present: the merge below
  // only fills slots that are still empty, and the /stream handler overwrites
  // non-null slots when it lands — correct in either arrival order.
  async function fetchAndProcessSkipTimes() {
    if (!malId || !episode) return;
    type SkipWindow = { start: number; end: number };
    type SkipWindows = { intro?: SkipWindow; outro?: SkipWindow };
    const merge = (incoming: SkipWindows) =>
      setAnirakuSkip((prev) => ({
        intro: prev.intro ?? incoming.intro,
        outro: prev.outro ?? incoming.outro,
      }));
    const cacheKey = `aniraku-skip-v2:${malId}:${episode}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { ts: number; data: SkipWindows };
        if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
          merge(parsed.data ?? {});
          return;
        }
        localStorage.removeItem(cacheKey);
      }
    } catch {
      // Corrupt cache entry — fall through to a fresh fetch.
    }
    try {
      // AniSkip is keyed by MAL id + episode number — never the AniList id.
      const response: FetchSkipTimesResponse = await fetchSkipTimes({
        malId: malId.toString(),
        episodeNumber: String(episode),
      });
      const intro = response.results.find(({ skipType }) => skipType === 'op');
      const outro = response.results.find(({ skipType }) => skipType === 'ed');
      const data: SkipWindows = {
        intro: intro
          ? { start: intro.interval.startTime, end: intro.interval.endTime }
          : undefined,
        outro: outro
          ? { start: outro.interval.startTime, end: outro.interval.endTime }
          : undefined,
      };
      merge(data);
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
      } catch {
        // Storage disabled — playback must continue.
      }
    } catch (error) {
      console.error('Failed to fetch skip times', error);
    }
  }

  // Proxied Aniraku URLs (/api/v1/proxy?...) carry no file extension, so
  // vidstack cannot infer the loader — declare HLS explicitly or it falls
  // back to video/mp4 and playback fails ("could not find a loader").
  function detectHls(url: string, declared?: string) {
    return (
      declared === 'hls' || /m3u8/i.test(url) || /\.m3u8($|\?)/i.test(url)
    );
  }

  // Apply one source candidate (URL + subtitle tracks + proxy headers).
  function applyCandidate(c: {
    url: string;
    type?: string;
    subs: { url: string; lang: string; label: string }[];
    headers: Record<string, string>;
  }) {
    setSrc(c.url);
    setSrcType(detectHls(c.url, c.type) ? 'hls' : 'mp4');
    setSubTracks(dedupeSubtitles(Array.isArray(c.subs) ? c.subs : []));
    // Headers MUST survive every path — the subtitle proxy answers
    // 502 CDN_BLOCKED without them.
    setStreamHeaders(c.headers ?? {});
  }

  async function fetchAndSetAnimeSource() {
    setSourceFailed(false);
    try {
      // Server-picker override: play the selected server's HLS directly
      // (unless that override already errored — then fall through to /stream).
      if (srcOverride && !overrideFailedRef.current) {
        const candidate = {
          url: srcOverride,
          type: detectHls(srcOverride) ? 'hls' : undefined,
          subs: Array.isArray(subsOverride) ? subsOverride : [],
          headers: headersOverride ?? {},
        };
        candidatesRef.current = [candidate];
        candidateIndexRef.current = 0;
        applyCandidate(candidate);
        return;
      }
      // Directly-playable HLS via Aniraku. Embed-only servers are handled by
      // Watch.tsx + EmbedPlayer (FlixCloud Yuta/Syota/Mike), never here.
      const res = await fetchAnirakuStream({ animeId, episode, lang });
      const sources = res?.sources ?? [];
      const pickRank = (s: any) => {
        if (s?.type === 'hls') return 3;
        if (s?.verification === 'proxy') return 2;
        if (s?.verification === 'direct') return 1;
        return 0;
      };
      const playable = sources
        .filter((s: any) => s?.type === 'hls' || s?.verification === 'proxy' || s?.verification === 'direct')
        .sort((a: any, b: any) => pickRank(b) - pickRank(a));
      // Record every playable source — a dead first pick advances to the
      // next candidate on media error instead of leaving a black screen.
      candidatesRef.current = playable
        .filter((s: any) => s?.url)
        .map((s: any) => ({
          url: s.url as string,
          type: s.type as string | undefined,
          subs: Array.isArray(s.subtitles) ? s.subtitles : [],
          headers: res?.headers ?? {},
        }));
      candidateIndexRef.current = candidatesRef.current.length > 0 ? 0 : -1;
      const chosen = candidatesRef.current[0] ?? sources.find((s: any) => s?.url);
      if (chosen?.url) {
        applyCandidate(chosen);
        // Provider-wins merge: /stream's verified windows overwrite the
        // AniSkip/cache values when present; null slots keep what's there.
        setAnirakuSkip((prev) => ({
          intro: res?.intro ?? prev.intro,
          outro: res?.outro ?? prev.outro,
        }));
        // Always the highest-quality download the backend offers.
        updateDownloadLink(pickHighestDownload(res?.downloads));
      } else {
        console.error('No directly-playable source (all embed-only?)', res);
        setSourceFailed(true);
      }
    } catch (error) {
      console.error('Failed to fetch anime streaming links', error);
      setSourceFailed(true);
    }
  }
  fetchFnRef.current = fetchAndSetAnimeSource;

  // No-source overlay Retry — bumping streamRetry re-runs the discovery
  // effect above (it is in the deps); in embed-missing mode that fall-through
  // also lets a found HLS source replace the empty iframe.
  const retryStreamFetch = () => setStreamRetry((n) => n + 1);

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Manual skip (ported): seek to the verified segment end (duration-capped)
  // and report whether the media accepted the target.
  const skipSegmentNow = (type: 'intro' | 'outro') => {
    const segment = skipSegmentsRef.current[type];
    const art = artInstanceRef.current;
    if (!segment || !art?.video) {
      showToast(
        type === 'intro'
          ? 'Intro skip data is unavailable'
          : 'Outro skip data is unavailable',
        { type: 'warning' },
      );
      return false;
    }
    if (!attemptSkipSegment(art.video, segment)) {
      showToast(
        type === 'intro'
          ? 'Intro could not be skipped'
          : 'Outro could not be skipped',
        { type: 'warning' },
      );
      return false;
    }
    autoSkippedRef.current[type] = true;
    showToast(
      type === 'intro' ? 'Intro skipped' : 'Outro skipped',
      { type: 'success' },
    );
    return true;
  };

  const toggleAutoPlay = () => {
    const next = !autoPlay;
    setSettings({ ...settings, autoPlay: next });
    // Turned ON: kick the live ArtPlayer instance immediately — the old
    // vidstack readiness effect that handled this died with the player swap.
    if (next) {
      const played = artInstanceRef.current?.play() as unknown;
      if (played && typeof (played as Promise<void>).catch === 'function') {
        (played as Promise<void>).catch(() => {});
      }
    }
  };
  const toggleAutoNext = () => {
    // Settings record only — both this menu and the Settings page read the
    // same `miruro:settings` field (authority rule: no second store).
    setSettings({ autoNext: !autoNext });
  };
  const toggleAutoSkip = () => {
    const next = !autoSkip;
    // Arming/disarming re-arms the per-segment attempt state (Aniraku parity).
    autoSkipRef.current = next;
    autoSkippedRef.current = { intro: false, outro: false };
    const clearedFailures = { intro: false, outro: false };
    autoSkipFailuresRef.current = clearedFailures;
    setAutoSkipFailures(clearedFailures);
    setSettings({ autoSkip: next });
  };

  // ─── Zenime builtEmbeddedUrl (ported) ─────────────────────────────────────
  // FlixCloud reads its own autoPlay/skI/skO params — autoSkip rides along so
  // embeds honor the same setting as HLS playback. (Zenime's animePahe/kwik
  // iframe proxy is N/A: Miruro embeds are FlixCloud via Aniraku.)
  useEffect(() => {
    if (!embeddedUrl) {
      setBuiltEmbeddedUrl('');
      return;
    }
    try {
      const u = new URL(embeddedUrl);
      if (u.hostname.includes('flixcloud.cc')) {
        u.searchParams.set('autoPlay', autoPlay ? 'true' : 'false');
        u.searchParams.set('skI', autoSkip ? 'true' : 'false');
        u.searchParams.set('skO', autoSkip ? 'true' : 'false');
      } else if (autoPlay) {
        u.searchParams.set('autoplay', '1');
      } else {
        u.searchParams.delete('autoplay');
      }
      setBuiltEmbeddedUrl(u.toString());
    } catch (err) {
      console.warn('[Player] Failed to build embedded URL:', err, embeddedUrl);
      setBuiltEmbeddedUrl(embeddedUrl);
    }
  }, [embeddedUrl, autoPlay, autoSkip]);

  // ─── Embed ad-guard (ported: Aniraku Watch.jsx:1611-1676) ─────────────────
  // Cross-origin providers can't be inspected by the parent, so popups are
  // restricted by the iframe `sandbox` attr and this same-origin pass adds
  // overlay cleanup + window.open blocking without touching the video.
  const embedFrameRef = useRef<HTMLIFrameElement | null>(null);
  useEffect(() => {
    const frame = embedFrameRef.current;
    if (!builtEmbeddedUrl || !frame) return undefined;

    let observer: MutationObserver | null = null;
    let originalOpen: typeof window.open | null = null;
    const adPattern =
      /(^|[-_])(?:ad|ads|advert|advertisement|banner|popup|popunder|sponsor)([-_]|$)/i;

    const cleanSameOriginEmbed = () => {
      try {
        const doc = frame.contentDocument;
        const win = frame.contentWindow;
        if (!doc || !win) return;

        if (!doc.getElementById('aniraku-embed-ad-guard')) {
          const style = doc.createElement('style');
          style.id = 'aniraku-embed-ad-guard';
          style.textContent = `
            [id*="advert"], [class*="advert"], [id*="popup"], [class*="popup"],
            [id*="popunder"], [class*="popunder"], [id*="banner-ad"], [class*="banner-ad"],
            [data-ad], [data-ad-slot], iframe[src*="ad" i], iframe[src*="popup" i] {
              display: none !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
          `;
          doc.head?.appendChild(style);
        }

        originalOpen = win.open;
        try {
          win.open = (url?: any, target?: any, features?: any) => {
            const destination = String(url || '');
            if (!destination || adPattern.test(destination)) return null;
            return originalOpen
              ? originalOpen.call(win, url, target, features)
              : null;
          };
        } catch {
          // Sandboxed frames reject patching; sandbox still blocks popups.
        }

        const removeAdNodes = () => {
          doc
            .querySelectorAll<HTMLElement>(
              '[id], [class], [data-ad], [data-ad-slot]',
            )
            .forEach((node) => {
              if (
                node === doc.body ||
                node.matches('video, audio, source, track, canvas')
              )
                return;
              const token = `${node.id || ''} ${node.className || ''}`;
              if (adPattern.test(token)) {
                node.style.setProperty('display', 'none', 'important');
              }
            });
        };
        removeAdNodes();
        observer = new window.MutationObserver(removeAdNodes);
        observer.observe(doc.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['id', 'class', 'data-ad', 'data-ad-slot'],
        });
      } catch {
        // Cross-origin frames intentionally reject DOM access; sandbox still
        // blocks popup/new-window behavior without breaking normal playback.
      }
    };

    frame.addEventListener('load', cleanSameOriginEmbed);
    cleanSameOriginEmbed();
    return () => {
      frame.removeEventListener('load', cleanSameOriginEmbed);
      observer?.disconnect();
      try {
        if (originalOpen && frame.contentWindow)
          frame.contentWindow.open = originalOpen;
      } catch {
        // Frame already gone.
      }
    };
  }, [builtEmbeddedUrl]);

  // ─── Zenime iframe postMessage bridge (ported) ────────────────────────────
  // Progress → all_episode_times; ended (ArtPlayer/FlixCloud/MegaCloud/
  // watching-log/generic) → transition-locked auto-next. AniList sync stays
  // structurally present but gated on the missing auth bridge.
  useEffect(() => {
    if (!isEmbedded) return;

    const endViaBridge = async () => {
      if (
        playbackTransitionRef.current ||
        Date.now() < playbackTransitionLockUntilRef.current
      ) {
        return;
      }
      // Item 3 — embed end record (Aniraku saves completion at embed end:
      // Watch.jsx:4540-4553 and :4594-4607 upsert time=duration before
      // navigating). Saved BEFORE the auto-next gate too, so an embed
      // finished with auto-next OFF still reflects completion — a strict
      // superset of the reference, same native `all_episode_times` shape.
      saveEpisodeCompletion(iframeProgressRef.current.duration);
      playbackTransitionRef.current = true;
      playbackTransitionLockUntilRef.current = Date.now() + 2_000;
      try {
        if (!autoNextRef.current) return;
        await new Promise((resolve) => setTimeout(resolve, 200));
        await onEpisodeEndRef.current();
      } catch (err) {
        console.error('[Player] auto-next error:', err);
      } finally {
        window.setTimeout(() => {
          playbackTransitionRef.current = false;
          playbackTransitionLockUntilRef.current = 0;
        }, 2_200);
      }
    };

    const saveIframeProgress = (time: number, duration: number) => {
      if (!episodeKey || duration <= 0) return;
      const playbackPercentage = (time / duration) * 100;
      iframeProgressRef.current = {
        ...iframeProgressRef.current,
        currentTime: time,
        duration,
      };
      try {
        const all = JSON.parse(
          localStorage.getItem('all_episode_times') || '{}',
        );
        all[episodeKey] = { currentTime: time, playbackPercentage };
        localStorage.setItem('all_episode_times', JSON.stringify(all));
      } catch {
        // localStorage unavailable — ignore
      }
      // Item 1 — first GENUINE embed playback: postMessage progress only
      // arrives while the iframe is actually playing, so t>0 here is the
      // embed twin of the HLS first-timeupdate trigger (Aniraku
      // Watch.jsx:4327 `lastSave = 0` + :4381). Watch runs its dual-write
      // record once per episode; publishHistoryNow (inside Watch) uploads
      // it immediately for signed-in users.
      if (time > 0 && !playbackStartRecordedRef.current) {
        playbackStartRecordedRef.current = true;
        onPlaybackStartRef.current?.();
      }
      if ((settings as any).aniListSync && isLoggedIn) {
        // GAP: no auth progress bridge in this build — call no-ops.
        void saveAniListProgressRef.current?.(episode);
      }
      // FlixCloud time-based ended detection (Zenime parity).
      if (isFlixcloudEmbed) {
        const remaining = duration - time;
        if (
          !iframeProgressRef.current.hasTriggeredEnd &&
          (remaining < 2 || playbackPercentage > 99)
        ) {
          iframeProgressRef.current.hasTriggeredEnd = true;
          void endViaBridge();
        }
      }
    };

    const saveIframeProgressOnUnload = () => {
      const { currentTime, duration } = iframeProgressRef.current;
      if (duration > 0) saveIframeProgress(currentTime, duration);
    };

    const handleMessage = (event: MessageEvent) => {
      let data: any = event.data;
      if (typeof data === 'string') {
        if (data.trim().toLowerCase() === 'ended') {
          void endViaBridge();
          return;
        }
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== 'object') return;

      // Some ArtPlayer bridges wrap the event in `detail`/`data` — flatten.
      if (data.detail && typeof data.detail === 'object') data = data.detail;
      if (data.data && typeof data.data === 'object') data = data.data;

      const normalized: {
        source: string;
        type: string;
        event: string;
        query: string;
        action: string;
        name: string;
        playerStatus: string;
        channel: string;
        currentTime?: number;
        duration?: number;
        [key: string]: any;
      } = {
        ...data,
        source: String(data.source || '').toLowerCase(),
        type: String(data.type || '').toLowerCase(),
        event: String(data.event || '').toLowerCase(),
        query: String(data.query || '').toLowerCase(),
        action: String(data.action || '').toLowerCase(),
        name: String(data.name || '').toLowerCase(),
        playerStatus: String(data.playerStatus || '').toLowerCase(),
        channel: String(data.channel || '').toLowerCase(),
        currentTime:
          typeof data.currentTime === 'number'
            ? data.currentTime
            : typeof data.currentTime === 'string' &&
                data.currentTime.trim() !== ''
              ? Number(data.currentTime)
              : undefined,
        duration:
          typeof data.duration === 'number'
            ? data.duration
            : typeof data.duration === 'string' && data.duration.trim() !== ''
              ? Number(data.duration)
              : undefined,
      };

      // FlixCloud's ArtPlayer bridge reports completion as playerStatus Ended.
      if (isFlixcloudEmbed && normalized.playerStatus === 'ended') {
        void endViaBridge();
        return;
      }

      // MegaCloud channel
      if (normalized.channel === 'megacloud') {
        if (normalized.event === 'complete') void endViaBridge();
        else if (
          typeof normalized.time === 'number' &&
          typeof normalized.duration === 'number'
        ) {
          saveIframeProgress(normalized.time, normalized.duration);
        }
        return;
      }

      // watching-log (MegaPlay / HiAnime style)
      if (normalized.type === 'watching-log') {
        if (
          typeof normalized.currentTime === 'number' &&
          typeof normalized.duration === 'number'
        ) {
          saveIframeProgress(normalized.currentTime, normalized.duration);
        }
        return;
      }

      // ArtPlayer (flixcloud)
      if (normalized.source === 'artplayer') {
        const artEnded =
          normalized.query === 'ended' ||
          normalized.type === 'ended' ||
          normalized.event === 'ended' ||
          normalized.type === 'video:ended';
        if (artEnded) {
          void endViaBridge();
          return;
        }
        if (
          typeof normalized.currentTime === 'number' &&
          typeof normalized.duration === 'number'
        ) {
          saveIframeProgress(normalized.currentTime, normalized.duration);
        }
        return;
      }

      // FlixCloud direct channel
      if (
        normalized.channel === 'flixcloud' ||
        normalized.source === 'flixcloud'
      ) {
        const fcEnded =
          normalized.event === 'ended' ||
          normalized.event === 'complete' ||
          normalized.type === 'ended';
        if (fcEnded) {
          void endViaBridge();
          return;
        }
        if (
          typeof normalized.currentTime === 'number' &&
          typeof normalized.duration === 'number'
        ) {
          saveIframeProgress(normalized.currentTime, normalized.duration);
        }
        return;
      }

      // Generic player progress fallback
      if (
        typeof normalized.currentTime === 'number' &&
        typeof normalized.duration === 'number'
      ) {
        saveIframeProgress(normalized.currentTime, normalized.duration);
      }

      // Generic ended fallback
      const isEnded =
        normalized.event === 'ended' ||
        normalized.type === 'ended' ||
        normalized.type === 'video:ended' ||
        normalized.query === 'ended' ||
        normalized.action === 'ended' ||
        normalized.name === 'ended';
      if (isEnded) void endViaBridge();
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('pagehide', saveIframeProgressOnUnload);
    window.addEventListener('beforeunload', saveIframeProgressOnUnload);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('pagehide', saveIframeProgressOnUnload);
      window.removeEventListener('beforeunload', saveIframeProgressOnUnload);
    };
  }, [isEmbedded, isFlixcloudEmbed, episodeKey, settings, isLoggedIn]);

  const handlePlaybackEnded = async () => {
    // Zenime transition lock — double-fires (vidstack ended + bridge) can't
    // stack two auto-next jumps.
    const lockUntil = playbackTransitionLockUntilRef.current;
    if (
      playbackTransitionRef.current ||
      (lockUntil > 0 && Date.now() < lockUntil)
    ) {
      return;
    }
    playbackTransitionRef.current = true;
    playbackTransitionLockUntilRef.current = Date.now() + 2_000;
    try {
      // Structural AniList slot — no-op until the auth bridge exists.
      void saveAniListProgressRef.current?.(episode);
      if (!autoNextRef.current || !hasNext) {
        // Auto-next off (or final episode): show the "ended" overlay instead
        // of a black screen so the user knows to press Next or Replay.
        setShowEndedOverlay(true);
        return;
      }
      artInstanceRef.current?.video?.pause();
      await new Promise((resolve) => setTimeout(resolve, 250));
      await onEpisodeEndRef.current();
    } catch (error) {
      console.error('Error moving to the next episode:', error);
    } finally {
      window.setTimeout(() => {
        playbackTransitionRef.current = false;
        playbackTransitionLockUntilRef.current = 0;
      }, 2_200);
    }
  };
  handlePlaybackEndedRef.current = handlePlaybackEnded;

  const replayEpisode = () => {
    const art = artInstanceRef.current;
    if (art?.video) {
      art.video.currentTime = 0;
      art.play();
    }
    setShowEndedOverlay(false);
  };

  // ── Item 3 — ended-progress save (Aniraku Watch.jsx:4264-4294) ──────────
  // On `video:ended` (HLS) and on every embed end signal, persist position
  // = duration → 100% in `all_episode_times` — NO schema change: the
  // native {currentTime, playbackPercentage} shape the reconcile /
  // flushHistorySync already read. A finished episode therefore reflects
  // completion in history, and the next open restores at its end → walks
  // straight into the auto-next path (Aniraku's restore-at-duration).
  // Idempotent: an already-complete entry is NOT rewritten (no double-write
  // against the 10s `video:timeupdate` saver; a double `ended` fire is a
  // no-op); a REWATCH re-qualifies once intermediate saves make the entry
  // incomplete again. Gated by the same history-paused pref Watch's
  // dual-write honors (mirror at the top of this file), then published
  // immediately via Wave B's `publishHistoryNow` (guests no-op) instead of
  // waiting for the 10s engine tick.
  const saveEpisodeCompletion = (durationSeconds: number | undefined) => {
    const duration = Math.floor(Number(durationSeconds) || 0);
    if (!episodeKey || duration <= 0) return;
    if (isHistoryPaused()) return;
    try {
      const all = JSON.parse(localStorage.getItem('all_episode_times') || '{}');
      const current = all[episodeKey];
      if (
        Number(current?.currentTime) >= duration &&
        Number(current?.playbackPercentage) >= 100
      ) {
        return; // already recorded complete — don't double-write
      }
      all[episodeKey] = { currentTime: duration, playbackPercentage: 100 };
      localStorage.setItem('all_episode_times', JSON.stringify(all));
    } catch {
      // localStorage unavailable — nothing to record into.
    }
    void publishHistoryNow().catch(() => {});
  };

  // Skip windows mirror whatever the provider/AniSkip merge produced — the
  // timeline hover preview reads the ref on every pointer move.
  useEffect(() => {
    skipSegmentsRef.current = {
      intro: anirakuSkip.intro ?? null,
      outro: anirakuSkip.outro ?? null,
    };
    // Both segment consumers redraw from the same mirror — this is the
    // single choke point: every write (cache merge, AniSkip result, provider
    // overwrite) and the per-episode reset lands in this state. The hover
    // layer refreshes HERE too, not just on metadata events, so a late
    // AniSkip response repaints the intro/outro/main bands + tooltip ranges
    // immediately; the chapter layer follows with the bar's Intro │ Main
    // episode │ Outro.
    timelineHoverCleanupRef.current?.refresh();
    chapterLayerRef.current?.refresh();
  }, [anirakuSkip]);

  // ─── ArtPlayer construction (ported from the reference build) ─────────────
  // Replaces the former direct-video vidstack branch: config assembly, the
  // async artplayer import, subtitle mounting and the full control/settings
  // registry live here. The embed-iframe branch above never reaches this.
  useEffect(() => {
    if (isEmbedded || !src) {
      destroyPlayer();
      return;
    }
    const container = artMountRef.current;
    if (!container) return;
    const myBuildId = ++buildIdRef.current;
    let disposed = false;

    // hls.js pre-warm: the dynamic import is the single biggest startup cost
    // on the HLS path — kick it off in parallel with the ArtPlayer mount.
    if (!hlsPreloadPromiseRef.current) {
      hlsPreloadPromiseRef.current = import('hls.js')
        .then((mod) => (mod as { default?: unknown } | null)?.default ?? null)
        .catch(() => null);
    }

    void (async () => {
      const proxied = (u: string) => proxiedMediaUrl(u, streamHeaders);

      // ── Subtitle tracks: dedupe + language numbering, then normalize ──
      const numberedTracks = subTracks.map((t, i, list) => {
        const language = t.lang || 'Unknown';
        const dupBefore = list.slice(0, i).filter((x) => x.lang === language)
          .length;
        const dupTotal = list.filter((x) => x.lang === language).length;
        // Two same-language tracks become `English 1` / `English 2`.
        const base = prettySubLabel(t, i);
        const label = dupTotal > 1 ? `${base} ${dupBefore + 1}` : base;
        return { url: proxied(t.url), lang: language, label };
      });
      const subtitleTracks = normalizeSubtitleTracks(numberedTracks);
      const savedSubtitleTrack = subtitlePreferencesRef.current.track;
      // Subtitles are ON by default (English or the first track) until the
      // user picks Off; a persisted 'off' hides them right after mount while
      // the source stays mounted so Off → On keeps working.
      const preferredSubtitleTrack =
        subtitleTracks.find((track) => track.url === savedSubtitleTrack) ||
        getDefaultSubtitleTrack(subtitleTracks);
      const captionsDisabled = savedSubtitleTrack === 'off';
      const initialSubtitleTrack =
        preferredSubtitleTrack || subtitleTracks[0] || null;

      // ── Caption switching (ported): generation guard + flags BEFORE prefs ──
      const switchSubtitleTrack = async (
        track: SubtitleTrack | null,
      ): Promise<unknown> => {
        const switchGeneration = ++subtitleSwitchGenerationRef.current;
        const art = artInstanceRef.current;
        const nextTrack =
          track &&
          subtitleTracks.some((candidate) => candidate.url === track.url)
            ? track
            : null;
        // Update the authoritative flag before setSubtitlePreference() — that
        // setter refreshes ArtPlayer's cue layer synchronously, and the old
        // enabled state could otherwise render one more cue after Off.
        if (art) {
          const flags = art as unknown as Record<string, unknown>;
          flags._anirakuActiveSubtitleUrl = nextTrack?.url || null;
          flags._anirakuSubtitleEnabled = Boolean(nextTrack);
        }
        setSubtitlePreference('track', nextTrack ? nextTrack.url : 'off');
        if (!art?.subtitle) return null;
        if (!nextTrack) {
          // Keep the subtitle source mounted. Clearing art.subtitle.url can
          // permanently remove the track in some ArtPlayer versions and make
          // the next Off → On transition fail.
          if (art.template.$subtitle) {
            art.template.$subtitle.style.display = 'none';
            art.template.$subtitle.innerHTML = '';
          }
          if (art.subtitle.textTrack) {
            try {
              art.subtitle.textTrack.mode = 'disabled';
            } catch {
              // track already gone
            }
          }
          showToast('Subtitles Off');
          return null;
        }
        const flagsOn = art as unknown as Record<string, unknown>;
        flagsOn._anirakuSubtitleEnabled = true;
        if (art.template.$subtitle) art.template.$subtitle.style.display = '';
        const result = await art.subtitle
          .switch(proxied(nextTrack.url), {
            type: nextTrack.type,
            name: nextTrack.label,
            encoding: 'utf-8',
            style: getSubtitleStyle(subtitlePreferencesRef.current),
          })
          .catch(() => null);
        if (
          result &&
          switchGeneration === subtitleSwitchGenerationRef.current &&
          artInstanceRef.current === art
        ) {
          try {
            if (art.subtitle.textTrack) {
              art.subtitle.textTrack.mode = 'showing';
            }
          } catch {
            // track already gone
          }
          applySubtitleStyle(art, subtitlePreferencesRef.current);
          safelyUpdateSubtitle(art);
          applySubtitleStyle(art, subtitlePreferencesRef.current);
          showToast(`Subtitles: ${nextTrack.label}`, { type: 'success' });
        }
        return result;
      };

      const subtitleSettingOptions =
        subtitleTracks.length > 0
          ? [
              { default: false, html: 'Off', value: 'off' },
              ...subtitleTracks.map((track) => ({
                default: track.url === preferredSubtitleTrack?.url,
                html: escapeHtml(track.label),
                value: track.url,
              })),
            ]
          : [];
      const subtitleSetting =
        subtitleTracks.length > 0
          ? {
              name: 'subtitleTrack',
              width: 232,
              html: 'Captions',
              icon: SETTING_ICON_CAPTIONS,
              tooltip: captionsDisabled
                ? 'Off'
                : preferredSubtitleTrack?.label || 'Off',
              selector: subtitleSettingOptions.map((option) => ({
                ...option,
                // A persisted Off hides captions at mount — the checkmark
                // must reflect the ACTUAL state, not the preferred track.
                default: captionsDisabled
                  ? option.value === 'off'
                  : option.default,
              })),
              onSelect: (item: { value?: string; html?: string }) => {
                const track =
                  subtitleTracks.find(
                    (candidate) => candidate.url === item.value,
                  ) || null;
                const subtitleLabel =
                  item.value === 'off' ? 'Off' : track?.label || 'Track';
                void switchSubtitleTrack(track);
                syncArtPlayerSetting(
                  artInstanceRef.current,
                  'subtitleTrack',
                  item.value,
                  subtitleLabel,
                );
                return subtitleLabel;
              },
            }
          : null;

      const playerConfig: any = {
        container,
        url: src,
        type: srcType === 'hls' ? 'm3u8' : 'native',
        // Autoplay tracks the persisted preference (the reference build
        // hard-coded true); muted fallback happens post-create below.
        autoplay: autoPlay,
        // iOS Safari has no requestPictureInPicture — the attempt throws and
        // ArtPlayer logs noise; Android TV / Smart TV apps handle PiP at the
        // OS level, so the button is pointless there too.
        pip: !IS_IOS && !IS_TV,
        autoSize: false,
        // Minimizing into a floating corner fights the mobile UI (and iOS
        // scroll-locking); on desktop it is a nice touch.
        autoMini: !IS_MOBILE,
        fullscreen: true,
        fullscreenWeb: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: true,
        // TV remotes have no rotation sensor; keep the player orientation
        // locked so Android TV never flips it.
        autoOrientation: !IS_TV,
        // Casting is exposed through the custom "Chromecast" control below;
        // art.airplay() opens Safari's playback target picker and ArtPlayer
        // raises its own notice on browsers without one.
        airplay: false,
        screenshot: !IS_TV,
        setting: true,
        // Top-level gear: exact Material Design "settings" filled glyph on
        // the24×24 grid — the reference build's icon philosophy ("exact
        // Material Design filled paths … renders identically crisp at any
        // DPI"). Aniraku itself registers no override (its control bar at
        // Watch.jsx:3317-3324 relies on ArtPlayer's built-in setting
        // control, icons.setting); this pins that same built-in control's
        // glyph to the official MD path instead of art's internal sketch.
        icons: {
          setting:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:100%;height:100%" shape-rendering="geometricPrecision" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>',
        },
        hotkey: false,
        // Theme resolved at runtime from the app accent (the reference build
        // pinned a hardcoded brand violet); falls back to the soft accent.
        theme:
          getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-accent')
            .trim() || '#b5a8ff',
        volume: playerPreferencesRef.current.volume,
        isLive: false,
        lang:
          (navigator.language || 'en').toLowerCase() === 'zh-cn'
            ? 'zh-cn'
            : 'en',
        moreVideoAttr: {
          crossOrigin: 'anonymous',
          preload: 'auto',
          playsInline: true,
          'webkit-playsinline': 'true',
        },
        controls: [
          {
            name: 'prevEpisode',
            position: 'left',
            index: 15,
            html: prevEpisodeControlHtml(),
            tooltip: 'Previous Episode',
            style: { width: '36px', margin: '0' },
            click: function () {
              if (hasPrev) {
                onPrevEpisodeRef.current();
              } else {
                showToast('This is the first episode');
              }
            },
          },
          ...(hasNext
            ? [
                {
                  name: 'nextEpisode',
                  position: 'left',
                  index: 16,
                  html: nextEpisodeControlHtml(),
                  tooltip: 'Next Episode',
                  style: { width: '36px', margin: '0' },
                  click: function () {
                    onNextEpisodeRef.current();
                  },
                },
              ]
            : []),
          {
            name: 'seekBackward15',
            position: 'left',
            index: 17,
            html: seekControlHtml(-1),
            tooltip: `Rewind ${SEEK_SECONDS}s`,
            style: { width: '36px', margin: '0' },
            click: function () {
              const nextTime = seekVideoBy(
                artInstanceRef.current,
                -SEEK_SECONDS,
              );
              if (nextTime !== null) {
                showToast(`−${SEEK_SECONDS}s · ${formatTime(nextTime)}`);
              }
            },
          },
          {
            name: 'seekForward15',
            position: 'left',
            index: 18,
            html: seekControlHtml(1),
            tooltip: `Forward ${SEEK_SECONDS}s`,
            style: { width: '36px', margin: '0' },
            click: function () {
              const nextTime = seekVideoBy(artInstanceRef.current, SEEK_SECONDS);
              if (nextTime !== null) {
                showToast(`+${SEEK_SECONDS}s · ${formatTime(nextTime)}`);
              }
            },
          },
          {
            name: 'chromecast',
            position: 'right',
            index: 15,
            html: chromecastControlHtml(),
            tooltip: 'Chromecast',
            style: { width: '36px', margin: '0' },
            click: function () {
              try {
                artInstanceRef.current?.airplay();
              } catch {
                showToast('AirPlay is not available in this browser', {
                  type: 'warning',
                });
              }
            },
          },
        ],
        settings: [
          {
            name: 'playSpeed',
            width: 232,
            html: 'Play Speed',
            icon: SETTING_ICON_PLAY_SPEED,
            tooltip: playSpeedSettingLabel(
              playerPreferencesRef.current.playbackRate,
            ),
            selector: [0.5, 0.8, 1, 1.3, 1.5, 2].map((rate) => ({
              default:
                Number(playerPreferencesRef.current.playbackRate) === rate,
              html: playSpeedSettingLabel(rate),
              value: rate,
            })),
            onSelect: (item: any) => {
              const video = artInstanceRef.current?.video;
              if (video && Number.isFinite(Number(item.value))) {
                const playbackRate = Number(item.value);
                video.playbackRate = playbackRate;
                playerPreferencesRef.current = {
                  ...playerPreferencesRef.current,
                  playbackRate,
                };
                persistPlayerPreferences(playerPreferencesRef.current);
                showToast(`Speed ${item.value}x`, { type: 'success' });
              }
              return playSpeedSettingLabel(item.value);
            },
          },
          {
            name: 'aspectRatio',
            width: 232,
            html: 'Aspect Ratio',
            icon: SETTING_ICON_ASPECT_RATIO,
            tooltip: 'Default',
            selector: [
              { default: true, html: 'Default', value: 'default' },
              { html: '4:3', value: '4:3' },
              { html: '16:9', value: '16:9' },
            ],
            onSelect: (item: any) => {
              const art = artInstanceRef.current;
              if (art) {
                try {
                  art.aspectRatio = item.value;
                } catch {
                  // aspect ratio is best-effort
                }
              }
              return item.html;
            },
          },
          ...(subtitleSetting ? [subtitleSetting] : []),
          buildSubtitleSettingsSetting(
            () => subtitlePreferencesRef.current,
            setSubtitlePreference,
          ),
          {
            name: 'quality',
            width: 232,
            html: 'Quality',
            icon: SETTING_ICON_TUNE,
            tooltip: 'Auto',
            selector: [
              {
                default: true,
                html: qualityOptionHtml(getQualityPresentation('auto')),
                value: 'auto',
              },
            ],
            onSelect: (item: any) => {
              if (String(item.value) !== 'auto') return item.html;
              sessionQualityTargetRef.current = null;
              playerPreferencesRef.current = {
                ...playerPreferencesRef.current,
                qualityMode: 'auto',
                qualityTarget: null,
              };
              persistPlayerPreferences(playerPreferencesRef.current);
              const hls = hlsRef.current;
              if (hls) {
                hls.autoLevelCapping = -1;
                hls.startLevel = -1;
                hls.loadLevel = -1;
                hls.currentLevel = -1;
                hls.nextLevel = -1;
              }
              return 'Auto';
            },
          },
        ],
        customType: {
          m3u8: async (
            video: HTMLVideoElement,
            url: string,
            art: ArtInstance,
          ) => {
            const proxiedUrl = proxied(url);
            // Proxy first; an already-proxied backend URL collapses to a
            // single-entry plan (never re-wrap, never dial the raw CDN leg
            // twice) — same shape as the reference transport plan.
            const hlsTransportPlan = Array.from(
              new Set([proxiedUrl, url]).values(),
            ).filter(Boolean);
            let hlsTransportIndex = 0;

            const updateNativeHlsQualities = async () => {
              try {
                const response = await fetch(
                  hlsTransportPlan[hlsTransportIndex],
                  { cache: 'no-store' },
                );
                if (!response.ok) return;
                const lines = (await response.text()).split(/\r?\n/);
                const variants: { height: number }[] = [];
                for (let index = 0; index < lines.length; index += 1) {
                  const streamInfo = lines[index];
                  if (!streamInfo.startsWith('#EXT-X-STREAM-INF:')) continue;
                  const child = lines
                    .slice(index + 1)
                    .find((line) => line && !line.startsWith('#'));
                  const height = Number(
                    streamInfo.match(/RESOLUTION=\d+x(\d+)/i)?.[1] || 0,
                  );
                  if (!child || !height) continue;
                  if (!variants.some((item) => item.height === height)) {
                    variants.push({ height });
                  }
                }
                variants.sort((a, b) => b.height - a.height);
                if (variants.length < 1 || !art?.setting?.update) return;
                const currentTarget =
                  Number(sessionQualityTargetRef.current) || null;
                art.setting.update({
                  name: 'quality',
                  width: 232,
                  icon: SETTING_ICON_TUNE,
                  html: 'Quality',
                  tooltip: qualitySettingLabel(
                    currentTarget
                      ? { label: `${currentTarget}P` }
                      : { label: '' },
                  ),
                  selector: [
                    {
                      default: !currentTarget,
                      html: qualityOptionHtml(getQualityPresentation('auto')),
                      value: 'auto',
                    },
                    ...variants.map((variant) => ({
                      default: currentTarget === variant.height,
                      html: qualityOptionHtml(
                        getHeightPresentation(variant.height),
                      ),
                      value: `target:${variant.height}`,
                    })),
                  ],
                  onSelect: (item: any) => {
                    const targetHeight = String(item.value).startsWith(
                      'target:',
                    )
                      ? Number(String(item.value).replace('target:', ''))
                      : null;
                    sessionQualityTargetRef.current = targetHeight;
                    playerPreferencesRef.current = {
                      ...playerPreferencesRef.current,
                      qualityMode: 'auto',
                      qualityTarget: targetHeight,
                    };
                    persistPlayerPreferences(playerPreferencesRef.current);
                    if (targetHeight) {
                      // A pinned rendition must be FORCED — the native engine
                      // has no level pinning, so rebuild through hls.js/MSE
                      // (the resume position survives the rebuild).
                      if (pendingResumeRef.current == null) {
                        pendingResumeRef.current =
                          Number(video.currentTime) || null;
                      }
                      setForceMse(true);
                      return `${targetHeight}P`;
                    }
                    return 'Auto';
                  },
                });
              } catch {
                // The master-playlist ladder probe is best-effort.
              }
            };

            const startNativeHlsAttempt = () => {
              video.preload = 'auto';
              video.src = hlsTransportPlan[hlsTransportIndex];
              const played = video.play() as unknown;
              if (
                played &&
                typeof (played as Promise<void>).catch === 'function'
              ) {
                (played as Promise<void>).catch(() => {});
              }
              void updateNativeHlsQualities();
            };

            const startHlsJsEngine = async () => {
              video.onerror = null;
              if (disposed || buildIdRef.current !== myBuildId) return;
              let HlsCtor: typeof import('hls.js').default;
              try {
                const preloaded = (await (hlsPreloadPromiseRef.current ||
                  import('hls.js'))) as any;
                HlsCtor = (preloaded?.default || preloaded) as typeof import('hls.js').default;
              } catch {
                showToast('HLS engine failed to load — try another server.', {
                  duration: 6000,
                });
                return;
              }
              if (!HlsCtor.isSupported()) {
                // Last resort: hand the URL to the browser's native loader.
                try {
                  video.preload = 'auto';
                  video.src = proxiedUrl;
                  const played = video.play() as unknown;
                  if (
                    played &&
                    typeof (played as Promise<void>).catch === 'function'
                  ) {
                    (played as Promise<void>).catch(() => {});
                  }
                } catch {
                  // video:error takes over from here.
                }
                return;
              }
              if (hlsRef.current) {
                try {
                  hlsRef.current.destroy();
                } catch {
                  // engine already gone
                }
                hlsRef.current = null;
              }
              const bufferPolicy = getHlsBufferPolicy(
                {},
                { kiwi: shouldPreferNativeHls(url) },
              );
              const hlsConfig: any = {
                enableWorker: false,
                // User-selected bandwidth caps must not be replaced by the
                // viewport-size cap. The quality menu owns this policy.
                capLevelToPlayerSize: false,
                minAutoBitrate: 0,
                // Shared buffer policy first, then the unlimited overrides —
                // they always win: forward cache may grow for the whole
                // title, nothing behind the playhead is evicted, so every
                // seek replays from cache instead of re-downloading.
                ...bufferPolicy,
                ...UNLIMITED_HLS_CACHE,
                startFragPrefetch: true,
                lowLatencyMode: false,
                appendInSequenceGaps: true,
                forceKeyFrameOnDiscontinuity: true,
                ...getHlsLoadPolicies(),
                defaultAudioCodec: 'mp4a.40.2',
                fetchSetup: (context: { url: string }, init: any = {}) => {
                  const requestInit: any = {
                    ...init,
                    cache: getHlsRequestCacheMode(context),
                  };
                  return new Request(context.url, requestInit);
                },
              };
              const hls = new HlsCtor(hlsConfig);
              let mediaRetries = 0;
              let playbackStarted = false;
              let forcedLevel: number | null = null;
              let forcedQualityLabel: string | null = null;
              video.addEventListener(
                'playing',
                () => {
                  playbackStarted = true;
                },
                { once: true },
              );
              const fail = () => {
                if (disposed || buildIdRef.current !== myBuildId) return;
                advanceOnError();
              };
              hls.on(HlsCtor.Events.ERROR, (_event: unknown, data: any) => {
                if (disposed || buildIdRef.current !== myBuildId) return;
                if (!data?.fatal) return;
                if (
                  data.details ===
                  HlsCtor.ErrorDetails.MANIFEST_PARSING_ERROR
                ) {
                  // An MP4 misclassified as HLS: hand the raw URL to the
                  // browser and let video:error judge it. (The reference
                  // build compared against ErrorTypes.MANIFEST_ERROR, which
                  // hls.js never defined — this is that intent wired to the
                  // real detail code.)
                  try {
                    hls.destroy();
                  } catch {
                    // engine already gone
                  }
                  hlsRef.current = null;
                  try {
                    video.preload = 'auto';
                    video.src = url;
                    video.load();
                  } catch {
                    // video:error takes over
                  }
                  return;
                }
                if (data.type === HlsCtor.ErrorTypes.MEDIA_ERROR) {
                  if (mediaRetries < 1) {
                    mediaRetries += 1;
                    try {
                      hls.recoverMediaError();
                      if (forcedLevel !== null && forcedLevel >= 0) {
                        hls.autoLevelCapping = -1;
                        hls.startLevel = forcedLevel;
                        hls.loadLevel = forcedLevel;
                        hls.currentLevel = forcedLevel;
                        hls.nextLevel = forcedLevel;
                      }
                    } catch {
                      fail();
                    }
                    return;
                  }
                  fail();
                  return;
                }
                if (data.type === HlsCtor.ErrorTypes.NETWORK_ERROR) {
                  if (
                    !playbackStarted &&
                    hlsTransportIndex + 1 < hlsTransportPlan.length
                  ) {
                    hlsTransportIndex += 1;
                    try {
                      mediaRetries = 0;
                      hls.loadSource(hlsTransportPlan[hlsTransportIndex]);
                      return;
                    } catch {
                      // fall through to fail()
                    }
                  }
                  fail();
                  return;
                }
                fail();
              });
              hls.on(HlsCtor.Events.MANIFEST_PARSED, () => {
                if (disposed || buildIdRef.current !== myBuildId) return;
                const levels = (hls.levels || [])
                  .map((level: any, index: number) => ({
                    index,
                    height: Number(level?.height || 0),
                    bitrate: Number(
                      level?.bitrate ||
                        level?.averageBitrate ||
                        level?.bandwidth ||
                        0,
                    ),
                  }))
                  .filter((level: any, index: number, list: any[]) => {
                    if (level.height <= 0 && level.bitrate <= 0) return false;
                    const key =
                      level.height > 0
                        ? `height:${level.height}`
                        : `bitrate:${level.bitrate}`;
                    return (
                      list.findIndex((item: any) => {
                        const itemKey =
                          item.height > 0
                            ? `height:${item.height}`
                            : `bitrate:${item.bitrate}`;
                        return itemKey === key;
                      }) === index
                    );
                  })
                  .sort(
                    (a: any, b: any) =>
                      b.height - a.height || b.bitrate - a.bitrate,
                  );
                if (levels.length > 0 && art?.setting?.update) {
                  const auto = getQualityPresentation('auto');
                  // Real renditions from the manifest, highest first — no
                  // phantom options.
                  const renditionHeights = [
                    ...new Set(
                      levels
                        .map((level: any) => Number(level.height))
                        .filter((height: number) => height > 0),
                    ),
                  ].sort((a: number, b: number) => b - a);
                  const sessionQualityTarget =
                    Number(sessionQualityTargetRef.current) || null;
                  if (sessionQualityTarget) {
                    const startupLevel = selectLevelForQualityTarget(
                      levels,
                      sessionQualityTarget,
                    );
                    if (startupLevel) {
                      forcedLevel = startupLevel.index;
                      forcedQualityLabel = `${startupLevel.height}P`;
                      hls.autoLevelCapping = -1;
                      hls.startLevel = forcedLevel;
                      hls.loadLevel = forcedLevel;
                      hls.currentLevel = forcedLevel;
                      hls.nextLevel = forcedLevel;
                    } else {
                      forcedLevel = null;
                      forcedQualityLabel = null;
                      hls.autoLevelCapping = -1;
                    }
                  } else {
                    // ADAPTATION: no session pick — start from the top of
                    // the ladder but stay ADAPTIVE (currentLevel = -1)
                    // instead of hard-pinning rendition 0 like the reference
                    // build.
                    forcedLevel = null;
                    forcedQualityLabel = null;
                    hls.autoLevelCapping = -1;
                    hls.startLevel = 0;
                    hls.currentLevel = -1;
                    hls.nextLevel = -1;
                  }
                  const getSpeedCappedDisplay = (level: number) => {
                    const rawLabel = forcedQualityLabel
                      ? forcedQualityLabel
                      : Number(level) === -1
                        ? 'Auto'
                        : getHlsLevelLabel(
                            levels.find(
                              (candidate: any) =>
                                Number(candidate.index) === Number(level),
                            ),
                          );
                    return {
                      label: qualitySettingLabel({ label: rawLabel }),
                      title: 'Quality',
                    };
                  };
                  const syncHlsQualitySetting = (
                    level: number = hls.currentLevel,
                  ) => {
                    const display = getSpeedCappedDisplay(level);
                    const qualitySetting = art.setting.find('quality');
                    if (qualitySetting) {
                      qualitySetting.html = display.title;
                      qualitySetting.tooltip = display.label;
                      const selectedValue = forcedQualityLabel
                        ? `target:${String(forcedQualityLabel).replace(
                            'P',
                            '',
                          )}`
                        : 'auto';
                      if (Array.isArray(qualitySetting.selector)) {
                        qualitySetting.selector.forEach((option) => {
                          const selected = option.value === selectedValue;
                          option.default = selected;
                          const controlItem =
                            option.$control_item || option.$item;
                          if (controlItem) {
                            controlItem.classList.toggle(
                              'art-current',
                              selected,
                            );
                          }
                        });
                        const selectedOption = qualitySetting.selector.find(
                          (option) => option.value === selectedValue,
                        );
                        if (selectedOption) {
                          try {
                            (art.setting as any).check?.(selectedOption);
                          } catch {
                            // check() is best-effort
                          }
                        }
                      }
                    }
                    return display;
                  };
                  const buildHlsQualitySetting = (activeLevel: number) => {
                    const activeDisplay = getSpeedCappedDisplay(activeLevel);
                    return {
                      name: 'quality',
                      width: 232,
                      icon: SETTING_ICON_TUNE,
                      html: activeDisplay.title,
                      tooltip: activeDisplay.label,
                      selector: [
                        {
                          default:
                            !forcedQualityLabel && Number(activeLevel) === -1,
                          html: qualityOptionHtml(auto),
                          value: 'auto',
                        },
                        ...renditionHeights.map((height: number) => ({
                          default: forcedQualityLabel === `${height}P`,
                          html: qualityOptionHtml(
                            getHeightPresentation(height),
                          ),
                          value: `target:${height}`,
                        })),
                      ],
                      onSelect: (item: any) => {
                        const targetHeight = String(item.value).startsWith(
                          'target:',
                        )
                          ? Number(String(item.value).replace('target:', ''))
                          : null;
                        const selectedTarget = targetHeight
                          ? selectLevelForQualityTarget(levels, targetHeight)
                          : null;
                        const nextLevel = selectedTarget
                          ? selectedTarget.index
                          : -1;
                        forcedQualityLabel =
                          targetHeight && selectedTarget
                            ? `${selectedTarget.height}P`
                            : null;
                        // Session-scoped: a fresh episode or reload starts
                        // back on Auto (adaptive).
                        sessionQualityTargetRef.current = selectedTarget
                          ? selectedTarget.height
                          : null;
                        playerPreferencesRef.current = {
                          ...playerPreferencesRef.current,
                          qualityMode: 'auto',
                          qualityTarget: selectedTarget
                            ? selectedTarget.height
                            : null,
                        };
                        persistPlayerPreferences(playerPreferencesRef.current);
                        forcedLevel = targetHeight ? nextLevel : null;
                        hls.autoLevelCapping = -1;
                        hls.startLevel = nextLevel;
                        hls.loadLevel = nextLevel;
                        // The currentLevel assignment makes hls.js switch
                        // now — no player rebuild (adaptation: the reference
                        // build re-created the whole player here).
                        hls.currentLevel = nextLevel;
                        hls.nextLevel = nextLevel;
                        return syncHlsQualitySetting().label;
                      },
                    };
                  };
                  art.setting.update(buildHlsQualitySetting(hls.currentLevel));
                  hls.on(HlsCtor.Events.LEVEL_SWITCHED, () => {
                    if (disposed || buildIdRef.current !== myBuildId) return;
                    syncHlsQualitySetting();
                  });
                }
                const played = video.play() as unknown;
                if (
                  played &&
                  typeof (played as Promise<void>).catch === 'function'
                ) {
                  (played as Promise<void>).catch(() => {});
                }
              });
              try {
                hls.loadSource(hlsTransportPlan[hlsTransportIndex]);
                hls.attachMedia(video);
                hlsRef.current = hls;
              } catch {
                fail();
              }
            };

            // Native HLS branch: hosts verified on the direct path (the
            // reference build's CDN rule) — MSE only on failure or when a
            // rendition has been pinned (forceMse).
            if (
              !forceMse &&
              shouldPreferNativeHls(url) &&
              video.canPlayType('application/vnd.apple.mpegurl')
            ) {
              video.onerror = () => {
                if (disposed || buildIdRef.current !== myBuildId) return;
                if (hlsTransportIndex + 1 < hlsTransportPlan.length) {
                  hlsTransportIndex += 1;
                  try {
                    startNativeHlsAttempt();
                  } catch {
                    video.onerror = null;
                    void startHlsJsEngine();
                  }
                  return;
                }
                void startHlsJsEngine();
              };
              try {
                startNativeHlsAttempt();
              } catch {
                video.onerror = null;
                await startHlsJsEngine();
              }
              return;
            }
            await startHlsJsEngine();
          },
        },
      };
      if (initialSubtitleTrack) {
        playerConfig.subtitle = {
          url: proxied(initialSubtitleTrack.url),
          type: initialSubtitleTrack.type,
          name: initialSubtitleTrack.label,
          encoding: 'utf-8',
          style: getSubtitleStyle(subtitlePreferencesRef.current),
        };
      }

      let Artplayer: typeof import('artplayer').default;
      try {
        const mod = await import('artplayer');
        Artplayer = mod.default;
      } catch {
        showToast('Player failed to load — check your connection.', {
          duration: 6000,
        });
        return;
      }
      if (disposed || buildIdRef.current !== myBuildId) return;
      destroyPlayer();
      const art = new Artplayer(playerConfig);

      // ── Preferences restore + live persistence (ported) ──
      const savedPlayerPreferences = playerPreferencesRef.current;
      art.volume = savedPlayerPreferences.volume;
      art.muted = savedPlayerPreferences.muted;
      if (art.video) art.video.playbackRate = savedPlayerPreferences.playbackRate;
      const persistCurrentPlayerPreferences = () => {
        playerPreferencesRef.current = {
          ...playerPreferencesRef.current,
          volume: Number.isFinite(Number(art.volume))
            ? Number(art.volume)
            : playerPreferencesRef.current.volume,
          muted: Boolean(art.muted),
          playbackRate: Number.isFinite(Number(art.video?.playbackRate))
            ? Number(art.video.playbackRate)
            : playerPreferencesRef.current.playbackRate,
        };
        persistPlayerPreferences(playerPreferencesRef.current);
      };
      art.video?.addEventListener(
        'volumechange',
        persistCurrentPlayerPreferences,
      );
      art.video?.addEventListener(
        'ratechange',
        persistCurrentPlayerPreferences,
      );

      // Autoplay with the browser's unmuted → muted fallback chain (the old
      // vidstack readiness effect's exact behavior).
      if (autoPlay) {
        const tryPlay = (muted: boolean) => {
          const video = art.video;
          if (!video) return;
          if (muted) video.muted = true;
          const played = video.play() as unknown;
          if (played && typeof (played as Promise<void>).catch === 'function') {
            (played as Promise<void>).catch(() => {
              if (!muted) tryPlay(true);
            });
          }
        };
        if (art.video && art.video.readyState >= 1) tryPlay(false);
        else
          art.video?.addEventListener('canplay', () => tryPlay(false), {
            once: true,
          });
      }

      // Resume position: episode progress on mount, preserved position
      // across quality-engine rebuilds.
      if (pendingResumeRef.current != null && pendingResumeRef.current > 0) {
        const resumeAt = pendingResumeRef.current;
        pendingResumeRef.current = null;
        const applyResume = () => {
          // Never seek after destroy/rebuild — the listener may outlive it.
          if (disposed || buildIdRef.current !== myBuildId) return;
          try {
            art.video.currentTime = resumeAt;
            resumeAppliedRef.current = true; // seek-once per episode load
          } catch {
            // metadata not ready yet
          }
        };
        if (art.video && art.video.readyState >= 1) applyResume();
        else
          art.video?.addEventListener('loadedmetadata', applyResume, {
            once: true,
          });
      }

      // Timeline hover preview + intro/outro markers + full-buffer cache
      // indicator (ported) — both mount into the progress-bar inner layer.
      const progressInner =
        art.video
          ?.closest('.art-video-player')
          ?.querySelector('.art-control-progress-inner') ?? null;
      bufferIndicatorCleanupRef.current = createFullBufferIndicator(
        art.video,
        progressInner,
      );
      timelineHoverCleanupRef.current = createTimelineHoverPreview(
        art.video,
        progressInner,
        () => skipSegmentsRef.current,
      );
      // Chapter segments (Intro │ Main episode │ Outro) — same mount point
      // as the buffer indicator, appended after it + the hover-marker layer
      // so DOM order fixes the stacking (see PlayerStyles.css z-index note).
      // The [anirakuSkip] mirror effect calls .refresh() on every segment
      // write/reset; duration events refresh the percentages inside.
      chapterLayerRef.current = createChapterSegmentsLayer(
        art.video,
        progressInner,
        () => skipSegmentsRef.current,
      );

      // ArtPlayer retries a video error by re-assigning art.url, which
      // flushes the MediaSource buffer. hls.js owns HLS recovery — remove
      // only ArtPlayer's internal retry and keep the candidate-advance
      // fallback for non-HLS media.
      art.off('video:error');
      art.on('video:error', () => {
        if (hlsRef.current) return;
        advanceOnError();
      });

      // ── Subtitle flags + mount state (ported) ──
      const artFlags = art as unknown as Record<string, unknown>;
      artFlags._anirakuSubtitles = subtitleTracks;
      artFlags._anirakuSwitchSubtitle = switchSubtitleTrack;
      artFlags._anirakuActiveSubtitleUrl = preferredSubtitleTrack?.url || null;
      artFlags._anirakuSubtitleEnabled =
        Boolean(preferredSubtitleTrack) && !captionsDisabled;
      if (!preferredSubtitleTrack || captionsDisabled) {
        // Persisted Off (or no tracks): hide the cue layer but keep the
        // source mounted so Off → On switching keeps working.
        const el = art.template.$subtitle;
        if (el) {
          el.style.display = 'none';
          el.innerHTML = '';
        }
        const textTrack = art.subtitle.textTrack;
        if (textTrack) {
          try {
            textTrack.mode = 'disabled';
          } catch {
            // track already gone
          }
        }
      }
      art.on('subtitleLoad', () => {
        const enabled = artFlags._anirakuSubtitleEnabled === true;
        try {
          const textTrack = art.subtitle.textTrack;
          if (textTrack) {
            textTrack.mode = enabled ? 'showing' : 'disabled';
          }
        } catch {
          // track already gone
        }
        if (enabled) {
          applySubtitleStyle(art, subtitlePreferencesRef.current);
        }
      });
      art.on('subtitleAfterUpdate', () => {
        if (artFlags._anirakuSubtitleEnabled !== true) {
          const el = art.template.$subtitle;
          if (el) {
            el.style.display = 'none';
            el.innerHTML = '';
          }
          return;
        }
        applySubtitleStyle(art, subtitlePreferencesRef.current);
      });

      art.on('video:ended', () => {
        // Item 3 — completion record runs FIRST, before the transition
        // lock/auto-next below can swallow or delay anything; it is
        // idempotent, so a locked-out second ended never double-writes.
        saveEpisodeCompletion(art.video?.duration);
        void handlePlaybackEndedRef.current();
      });

      // Lock page scroll while fullscreen (also iOS native fullscreen, which
      // re-scrolls the page behind it).
      let scrollY = 0;
      art.on('fullscreen', (state: boolean) => {
        if (state) {
          scrollY = window.scrollY;
          document.documentElement.classList.add('body-hidden');
        } else {
          document.documentElement.classList.remove('body-hidden');
          window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
        }
      });

      // P0: the banner poster must never trap the control strip. Hide the
      // moment playback starts (both events — `playing` alone never fires
      // while autoplay is blocked/stalled), on the first pointer contact
      // with the exposed strip (mousemove/tap), and whenever the settings
      // panel opens (its popup renders above the strip into the poster's
      // area). The CSS bottom-cut on `.watch-art-poster` is what lets these
      // pointer events reach ArtPlayer in the first place.
      art.on('video:play', () => setPosterHidden(true));
      art.on('video:playing', () => setPosterHidden(true));
      art.on('mousemove', () => setPosterHidden(true));
      art.on('setting', (show) => {
        if (show) setPosterHidden(true);
      });

      // Throttled clock (re-renders the Skip Intro/Outro prompt overlay) + watch
      // progress persistence — same 500ms / 10s cadence as the reference.
      let lastSave = 0;
      let lastRender = 0;
      art.on('video:timeupdate', () => {
        const now = Date.now();
        const position = Number(art.video?.currentTime) || 0;

        // Item 1 (GAP 4) — first GENUINE playback of this episode → Watch
        // records it through its dual-write history path (a direct-URL
        // first visit never runs handleEpisodeSelect, so a first-ever
        // session had no history entry until a click/auto-next). Reference
        // trigger: Aniraku Watch.jsx:4327 (`let lastSave = 0`) + :4381 —
        // its history upsert fires on the FIRST `video:timeupdate`, never
        // on page load, so a page you never play is never marked watched.
        // Runs before the 10s throttle; publishHistoryNow's first await
        // yields past this handler, so the position write below lands
        // before the flush reads it.
        if (position > 0 && !playbackStartRecordedRef.current) {
          playbackStartRecordedRef.current = true;
          onPlaybackStartRef.current?.();
        }

        // Auto-skip only once per segment and only when playback is actually
        // inside a verified interval. This prevents repeated jumps, false
        // positives at the beginning of an episode, and seek-loop behavior.
        if (autoSkipRef.current) {
          const latestSegments = skipSegmentsRef.current;
          for (const type of ['intro', 'outro'] as const) {
            const segment = latestSegments[type];
            if (!segment) continue;
            if (position < segment.start - 3) {
              autoSkippedRef.current[type] = false;
              if (autoSkipFailuresRef.current[type]) {
                const cleared = {
                  ...autoSkipFailuresRef.current,
                  [type]: false,
                };
                autoSkipFailuresRef.current = cleared;
                setAutoSkipFailures(cleared);
              }
            }
            if (
              !autoSkippedRef.current[type] &&
              !autoSkipFailuresRef.current[type] &&
              position >= segment.start - 0.25 &&
              position < segment.end - 0.5
            ) {
              if (attemptSkipSegment(art.video, segment)) {
                autoSkippedRef.current[type] = true;
              } else {
                const failures = {
                  ...autoSkipFailuresRef.current,
                  [type]: true,
                };
                autoSkipFailuresRef.current = failures;
                setAutoSkipFailures(failures);
                showToast(
                  type === 'intro'
                    ? 'Automatic intro skip failed — use Skip Intro'
                    : 'Automatic outro skip failed — use Skip Outro',
                  { type: 'warning' },
                );
              }
              break;
            }
          }
        }

        if (now - lastRender > 500) {
          lastRender = now;
          setCurrentTime(position);
        }
        if (now - lastSave < 10_000) return;
        lastSave = now;
        const allPlaybackInfo = JSON.parse(
          localStorage.getItem('all_episode_times') || '{}',
        );
        allPlaybackInfo[episodeKey] = {
          currentTime: Math.floor(position),
          playbackPercentage:
            (position / (Number(art.video?.duration) || 1)) * 100,
        };
        localStorage.setItem(
          'all_episode_times',
          JSON.stringify(allPlaybackInfo),
        );
      });

      artInstanceRef.current = art;
      // Tie this instance to the episode load that requested it — a resume
      // seed may only direct-seek an instance built for the same token.
      instanceEpisodeTokenRef.current = resumeTokenRef.current;

      // ── Keyboard controls (ported: Aniraku Watch.jsx:1292-1473) ──────────
      // ONE `document` keydown in the CAPTURE phase, owned by the player and
      // registered only while an ArtPlayer instance exists: this effect's
      // cleanup AND destroyPlayer() both call removePlayerKeydown() (proof of
      // removal below), and the attach idempotently detaches any previous
      // handler first — the double-fire class of bug that once removed the
      // legacy Watch.tsx handler (see Watch.tsx:782-784). ArtPlayer's own
      // hotkeys are disabled (`hotkey: false` in playerConfig) so nothing
      // double-fires from inside art either.
      //
      // Plain unmodified keys only: Aniraku declares `ctrl` at Watch.jsx:1300
      // but never reads it — we implement that guard and extend it to
      // shift/alt because useGlobalShortcuts owns every modified chord
      // (Shift+D/M/N/P/B/T/V/?, Ctrl/Cmd+S, Ctrl/Cmd/Meta+, …); with it the
      // two key tables can never both match one event.
      // Ownership notes (full table in the report): KeyT stays skipped —
      // theater belongs to useGlobalShortcuts' unmodified-t contract (a
      // player-side KeyT would double-toggle through Watch's single
      // `miruro:shortcut` listener). KeyD/KeyS cycle the pools Watch hands
      // down via sourceCycleRef (ported from Aniraku Watch.jsx:1406-1438).
      // KeyK is our one addition — Aniraku has no K, but the app's own
      // ShortcutsPopup advertises "K / Space". Aniraku's handler contains
      // no download key, so there is nothing to skip there.
      const handlePlayerKeydown = (e: KeyboardEvent) => {
        const liveArt = artInstanceRef.current;
        if (!liveArt) return;
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        // Aniraku guard (Watch.jsx:1295-1297): typing targets, buttons and
        // links keep native behavior — comments box, search, and any focused
        // control (also keeps DropSearch's ArrowUp/Down/Enter result
        // navigation intact, which only runs while its input/links hold
        // focus).
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (tag === 'BUTTON' || tag === 'A' || target?.isContentEditable)
          return;
        // Additive hardening (same pattern useGlobalShortcuts applies to its
        // synthetic events): role-based text hosts that aren't natively
        // editable still keep their keys. Nothing in today's player tree
        // uses these roles — ArtPlayer ships no ARIA roles at all — so this
        // only guards future/comment widgets.
        if (
          target?.closest?.(
            '[contenteditable=""], [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]',
          )
        )
          return;
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

        const key = e.code;
        const video = liveArt.video;
        if (!video) return;

        if (key === 'Space' || key === 'KeyK') {
          // K is not an Aniraku key — it exists so the popup's advertised
          // "K / Space" row stays truthful.
          e.preventDefault();
          liveArt.toggle();
          return;
        }
        if (key === 'ArrowLeft' || key === 'KeyJ' || key === 'Home') {
          // Home/End are OUR addition (in Aniraku and the live corpus alike):
          // relative seek mapped to the SAME step, clamps and toast as the
          // ArrowLeft/KeyJ branch above/below — Home ≡ −SEEK_SECONDS,
          // End ≡ +SEEK_SECONDS.
          e.preventDefault();
          const nextTime = seekVideoBy(liveArt, -SEEK_SECONDS);
          if (nextTime !== null) {
            showToast(`−${SEEK_SECONDS}s · ${formatTime(nextTime)}`);
          }
          return;
        }
        if (key === 'ArrowRight' || key === 'KeyL' || key === 'End') {
          e.preventDefault();
          const nextTime = seekVideoBy(liveArt, SEEK_SECONDS);
          if (nextTime !== null) {
            showToast(`+${SEEK_SECONDS}s · ${formatTime(nextTime)}`);
          }
          return;
        }
        if (key === 'ArrowUp') {
          e.preventDefault();
          const vol = Math.min(1, liveArt.volume + 0.05);
          liveArt.volume = vol;
          showToast(`Volume ${Math.round(vol * 100)}%`);
          return;
        }
        if (key === 'ArrowDown') {
          e.preventDefault();
          const vol = Math.max(0, liveArt.volume - 0.05);
          liveArt.volume = vol;
          showToast(`Volume ${Math.round(vol * 100)}%`);
          return;
        }
        if (key === 'KeyF') {
          e.preventDefault();
          e.stopImmediatePropagation();
          // Aniraku's `fsRequest` fallback is unneeded: this listener only
          // exists while an ArtPlayer instance is mounted.
          liveArt.fullscreen = !liveArt.fullscreen;
          return;
        }
        if (key === 'KeyP') {
          e.preventDefault();
          try {
            liveArt.pip = !liveArt.pip;
          } catch {
            /* not supported */
          }
          return;
        }
        if (key === 'KeyM') {
          e.preventDefault();
          liveArt.muted = !liveArt.muted;
          showToast(
            liveArt.muted
              ? 'Muted'
              : `Volume ${Math.round(liveArt.volume * 100)}%`,
          );
          return;
        }
        if (key === 'KeyC') {
          e.preventDefault();
          const flags = liveArt as unknown as {
            _anirakuSubtitles?: SubtitleTrack[];
            _anirakuSwitchSubtitle?: (track: SubtitleTrack | null) => unknown;
            _anirakuActiveSubtitleUrl?: string | null;
            _anirakuSubtitleEnabled?: boolean;
          };
          const subtitles = flags._anirakuSubtitles || [];
          if (
            subtitles.length > 0 &&
            typeof flags._anirakuSwitchSubtitle === 'function'
          ) {
            // Our switch keeps the subtitle SOURCE mounted when captions are
            // Off (switchSubtitleTrack), so Aniraku's `art.subtitle.url`
            // fallback would report a stale track — when the enabled flag is
            // off, start the cycle from Off instead (C is a true toggle for
            // single-track episodes, a track cycle + Off otherwise).
            const subtitleApi = liveArt.subtitle as unknown as
              | { option?: { url?: string }; url?: string }
              | undefined;
            const currentSub =
              flags._anirakuSubtitleEnabled === true
                ? flags._anirakuActiveSubtitleUrl ||
                  subtitleApi?.option?.url ||
                  subtitleApi?.url ||
                  null
                : null;
            const currentIdx = subtitles.findIndex(
              (s) => s.url === currentSub,
            );
            const nextIdx = (currentIdx + 1) % (subtitles.length + 1);
            void flags._anirakuSwitchSubtitle(
              nextIdx >= subtitles.length ? null : subtitles[nextIdx],
            );
          } else {
            showToast('No subtitles available');
          }
          return;
        }
        if (key === 'KeyN') {
          // Aniraku (Watch.jsx:1396-1399) is silent at the end of the list —
          // no such toast exists anywhere in its source.
          e.preventDefault();
          if (hasNext) onNextEpisodeRef.current();
          return;
        }
        if (key === 'KeyB') {
          // Aniraku (Watch.jsx:1401-1404) is silent at the start too; its
          // "This is the first episode" string belongs to the prev BUTTON
          // (Watch.jsx:3342), which our own button keeps — body-by-body the
          // key handler carries no toast.
          e.preventDefault();
          if (hasPrev) onPrevEpisodeRef.current();
          return;
        }
        // ── Source cycle (Aniraku Watch.jsx:1406-1438) ──────────────────────
        // Pool = SUB servers then DUB servers, keyed `${lang}:${name}` — byte
        // for byte with Watch's keyOf (Watch.tsx:632) and MediaSource's
        // serverKey, so a selection always lands on a real handleSelectServer
        // entry. Both keys no-op below 2 candidates (Aniraku's own guard); a
        // missed findIndex (-1) rolls to entry 0. Toasts follow Aniraku.
        if (key === 'KeyD' || key === 'KeyS') {
          e.preventDefault();
          const { serversSub, serversDub, selectedServer, onSelectServer } =
            sourceCycleRef.current;
          if (!onSelectServer) return;
          type SourceChoice = {
            key: string;
            lang: 'sub' | 'dub';
            label: string;
          };
          const allSources: SourceChoice[] = [
            ...serversSub
              .filter((s: any) => s?.name)
              .map((s: any) => ({
                key: `sub:${s.name}`,
                lang: 'sub' as const,
                label: String(s.name),
              })),
            ...serversDub
              .filter((s: any) => s?.name)
              .map((s: any) => ({
                key: `dub:${s.name}`,
                lang: 'dub' as const,
                label: String(s.name),
              })),
          ];
          if (allSources.length < 2) return;
          const currentIdx = allSources.findIndex(
            (s) => s.key === selectedServer,
          );
          if (key === 'KeyD') {
            const nextSource =
              allSources[(currentIdx + 1) % allSources.length];
            if (nextSource) {
              onSelectServer(nextSource.key, nextSource.lang);
              showToast(
                `${nextSource.lang.toUpperCase()} via ${nextSource.label}`,
              );
            }
            return;
          }
          // KeyS walks past entries equal to the active one first — a no-op
          // over our unique `${lang}:${name}` keys, kept verbatim so pools
          // with colliding names behave exactly like Aniraku's.
          let nextIdx = (currentIdx + 1) % allSources.length;
          let attempts = 0;
          while (
            allSources[nextIdx]?.key === selectedServer &&
            attempts < allSources.length
          ) {
            nextIdx = (nextIdx + 1) % allSources.length;
            attempts++;
          }
          const nextSource = allSources[nextIdx];
          if (nextSource) {
            onSelectServer(nextSource.key, nextSource.lang);
            showToast(`${nextSource.label} (${nextSource.lang.toUpperCase()})`);
          }
          return;
        }
        if (key === 'Comma') {
          e.preventDefault();
          const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
          const current = video.playbackRate;
          const idx = speeds.findIndex((s) => s >= current);
          const next = idx > 0 ? speeds[idx - 1] : speeds[0];
          video.playbackRate = next; // `ratechange` listener persists it
          showToast(`Speed ${next}x`);
          return;
        }
        if (key === 'Period') {
          e.preventDefault();
          const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
          const current = video.playbackRate;
          const idx = speeds.findIndex((s) => s > current);
          const next = idx >= 0 ? speeds[idx] : speeds[speeds.length - 1];
          video.playbackRate = next;
          showToast(`Speed ${next}x`);
          return;
        }
        if (key === 'Escape') {
          // Tiered port of Aniraku (Watch.jsx:1464-1470, which consumes
          // Escape unconditionally): take the key ONLY for state the player
          // owns — native fullscreen, ArtPlayer web-fs (config sets
          // fullscreenWeb: true), or theater (21/9 aspect mirror) — and pass
          // it through untouched otherwise, so overlayStack's Escape and the
          // other bubble-phase owners (MediaSource dropdowns, trailer modal,
          // navbar search) keep their key whenever the player is in none of
          // those states. Theater-off rides Watch's single
          // `miruro:shortcut` listener (case 'theater' toggles it off);
          // Escape is in neither useGlobalShortcuts' table nor overlayStack's
          // contract, so no double-fire. Known tiering edge: with theater on
          // AND an overlay open, the first Escape drops theater and the
          // second closes the overlay — overlayStack exposes no open-state
          // query we could consult from here.
          const inNativeFs = Boolean(
            liveArt.fullscreen || document.fullscreenElement,
          );
          const inWebFs = liveArt.fullscreenWeb === true;
          const inTheater = aspectRatioRef.current === '21/9';
          if (!inNativeFs && !inWebFs && !inTheater) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          if (document.fullscreenElement) {
            void document.exitFullscreen().catch(() => {});
          } else if (liveArt.fullscreen) {
            liveArt.fullscreen = false;
          }
          if (liveArt.fullscreenWeb) liveArt.fullscreenWeb = false;
          if (inTheater) {
            window.dispatchEvent(
              new CustomEvent('miruro:shortcut', {
                detail: { action: 'theater' },
              }),
            );
          }
          return;
        }
      };
      if (playerKeydownHandlerRef.current) {
        document.removeEventListener(
          'keydown',
          playerKeydownHandlerRef.current,
          true,
        );
      }
      document.addEventListener('keydown', handlePlayerKeydown, true);
      playerKeydownHandlerRef.current = handlePlayerKeydown;
    })();

    return () => {
      disposed = true;
      // Rebuild/unmount: drop this build's keyboard listener — the next
      // build re-attaches only after its own ArtPlayer instance exists, so
      // there is never a listener without a player nor a stacked second one.
      removePlayerKeydown();
    };
  }, [
    isEmbedded,
    src,
    srcType,
    subTracks,
    streamHeaders,
    hasNext,
    hasPrev,
    forceMse,
    episode,
    animeId,
    destroyPlayer,
    removePlayerKeydown,
    setSubtitlePreference,
  ]);

  // Manual skip overlay inputs (ported): prompt window start-2..end-0.5;
  // hidden while auto-skip is armed unless the attempt already ran or failed.
  const showSkipIntro = shouldShowManualSkipOverlay({
    segment: anirakuSkip.intro,
    currentTime,
    autoSkip,
    autoSkipFailed: autoSkipFailures.intro,
    autoSkipHandled: autoSkippedRef.current.intro,
  });
  const showSkipOutro = shouldShowManualSkipOverlay({
    segment: anirakuSkip.outro,
    currentTime,
    autoSkip,
    autoSkipFailed: autoSkipFailures.outro,
    autoSkipHandled: autoSkippedRef.current.outro,
  });
  const handleSkipSegment = (type: 'intro' | 'outro') => {
    skipSegmentNow(type);
  };

  // ── No-source overlay (task): a discovery dead-end instead of a dead
  // black box. Same panel conventions as the ended overlay above (absolute
  // inset, rgba backdrop, navBtnStyle actions); shown per mode — HLS mode
  // when /stream failed or returned no sources, embed mode when the URL
  // never arrived.
  const noSourceMissing = isEmbedded ? embedMissing : sourceFailed;
  const noSourceOverlay = noSourceMissing ? (
    <div
      className='watch-no-source'
      role='status'
      aria-label='No streaming source available'
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(4px)',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#f1f5f9',
            marginBottom: 6,
          }}
        >
          No streaming source for this anime yet
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          {isEmbedded
            ? 'This server returned no playable embed for this episode — retry, or pick another server.'
            : 'No provider returned a playable source for this episode right now — try again in a moment.'}
        </div>
      </div>
      <button
        type='button'
        onClick={retryStreamFetch}
        style={{
          ...navBtnStyle,
          background: 'var(--accent, var(--primary-accent, #b5a8ff))',
          color: '#0f172a',
        }}
      >
        <FaRedo /> Retry
      </button>
    </div>
  ) : null;

  // Shared control bar: Autoplay, Auto Skip, Auto Next, Lights (both modes)
  // plus embed-only Prev/Next — direct mode navigates through the ArtPlayer
  // controls, and the Lights dispatcher feeds the single `miruro:shortcut`
  // listener in Watch.
  const controlBar = (
    <div className='player-menu'>
      <Button onClick={toggleAutoPlay} title='Self Explanatory'>
        {autoPlay ? <FaCheck /> : <RiCheckboxBlankFill />} Autoplay
      </Button>
      <Button
        onClick={toggleAutoSkip}
        title='Auto skip intros/outros.'
        data-autoskip={autoSkip}
      >
        {autoSkip ? <FaCheck /> : <RiCheckboxBlankFill />} Auto Skip
      </Button>
      {/* Embed-only: direct mode navigates via the ArtPlayer controls. */}
      {isEmbedded && (
        <>
          <Button
            className='epNav'
            onClick={onPrevEpisode}
            title='Previous Episode'
            disabled={!hasPrev}
          >
            <TbPlayerTrackPrev />
            {hasPrev ? (
              <>
                <span className='epShort'>{`EP ${episode - 1}`}</span>
                <span className='epLong'>{`Episode ${episode - 1}`}</span>
              </>
            ) : (
              'Prev'
            )}
          </Button>
          <Button
            onClick={onNextEpisode}
            title='Next Episode'
            disabled={!hasNext}
          >
            <TbPlayerTrackNext />
            {hasNext ? (
              <>
                <span className='epShort'>{`EP ${episode + 1}`}</span>
                <span className='epLong'>{`Episode ${episode + 1}`}</span>
              </>
            ) : (
              'Next'
            )}
          </Button>
        </>
      )}
      <Button onClick={toggleAutoNext} title='Auto next episode on end.'>
        {autoNext ? <FaCheck /> : <RiCheckboxBlankFill />} Auto Next
      </Button>
      <Button
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent('miruro:shortcut', {
              detail: { action: 'lights' },
            }),
          )
        }
        title='Dim background for immersion.'
      >
        {lightsOn ? <FaCheck /> : <RiCheckboxBlankFill />}{' '}
        {lightsOn ? 'Lights Off' : 'Lights On'}
      </Button>
    </div>
  );

  return (
    <div
      style={{
        animation: 'popIn 0.25s ease-in-out',
        position: 'relative',
      }}
      className='player-cc'
    >
      {/* Zenime composition — embedded: iframe shell + shared control bar */}
      {isEmbedded ? (
        <EmbeddedPlayerWrapper>
          <EmbeddedIframeWrapper key={stableIframeKey} $aspect={aspectRatio}>
            {builtEmbeddedUrl && (
              <EmbeddedIframe
                ref={embedFrameRef}
                src={builtEmbeddedUrl}
                allowFullScreen
                allow='accelerometer; gyroscope; magnetometer; autoplay; fullscreen; picture-in-picture; screen-wake-lock'
                title={`${animeVideoTitle || 'Anime'} - Episode ${episodeNumber}`}
                sandbox={
                  isKiwiEmbedUrl(builtEmbeddedUrl) ||
                  isSandboxBlockedEmbed(builtEmbeddedUrl)
                    ? undefined
                    : 'allow-forms allow-modals allow-pointer-lock allow-presentation allow-popups allow-same-origin allow-scripts'
                }
                referrerPolicy='no-referrer-when-downgrade'
              />
            )}
            {noSourceOverlay}
          </EmbeddedIframeWrapper>
          {controlBar}
        </EmbeddedPlayerWrapper>
      ) : (
        <>
          {/* ArtPlayer mount — black 16:9 chrome frame. The poster overlay
              keeps the original click-through-to-info behavior until the
              first play. */}
          <PlayerViewport $aspect={aspectRatio}>
            <div
              className='watch-art-mount'
              ref={artMountRef}
              style={{ width: '100%', height: '100%' }}
            />
            {banner && !posterHidden && (
              <div
                className='watch-art-poster'
                onClick={() =>
                  navigate(infoPathFor({ id: animeId, title: animeTitleInfo }))
                }
                style={{
                  cursor: 'pointer',
                  background: `url(${banner}) center / cover no-repeat`,
                }}
                aria-hidden='true'
              />
            )}
            {/* Item 2 — Resume countdown (Aniraku Watch.jsx:6069-6130):
                shown only for a >30s stored position; seeks on zero or the
                Resume button, "Start Over" dismisses without seeking.
                Bottom-center above the control strip — clears the
                chapters/buffer layers (z25 inside the progress inner) and
                the poster (z2), below the skip prompt (z100). Pointer
                events stay on this panel only; the once-registered
                document keydown keeps its BUTTON pass-through, so the
                overlay never swallows player keys. */}
            {resumeTarget != null && (
              <div
                className='watch-resume'
                role='dialog'
                aria-label='Resume playback'
                style={{
                  position: 'absolute',
                  bottom: 'calc(46px + env(safe-area-inset-bottom, 0px))',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 90,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  maxWidth: '92vw',
                  background: 'rgba(6,10,20,0.92)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  pointerEvents: 'auto',
                }}
              >
                <div style={{ fontSize: 13 }}>
                  Resume from{' '}
                  <strong style={{ color: '#a5b4fc' }}>
                    {formatTime(resumeTarget)}
                  </strong>
                  ?
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                    Auto-resuming in {resumeCountdown}s
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => commitResume(resumeTokenRef.current)}
                  style={{
                    background:
                      'var(--accent, var(--primary-accent, #b5a8ff))',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: 40,
                  }}
                >
                  Resume
                </button>
                <button
                  type='button'
                  onClick={dismissResume}
                  style={{
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                    minHeight: 40,
                  }}
                >
                  Start Over
                </button>
              </div>
            )}
            {/* Episode ended (auto-next off or final episode): Replay / Next
                instead of a black screen */}
            {showEndedOverlay && (
              <div
                className='watch-ended'
                role='dialog'
                aria-label='Episode finished'
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 7,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 18,
                  background: 'rgba(0,0,0,0.82)',
                  backdropFilter: 'blur(4px)',
                  textAlign: 'center',
                  padding: 24,
                }}
              >
                <FaCheckCircle
                  size={44}
                  color='#22c55e'
                  style={{ opacity: 0.9 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#f1f5f9',
                      marginBottom: 6,
                    }}
                  >
                    Episode {episodeNumber} finished
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>
                    {hasNext
                      ? 'Auto-next is off — press Next to continue watching.'
                      : "You've watched every released episode."}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  <button
                    type='button'
                    onClick={replayEpisode}
                    style={{
                      ...navBtnStyle,
                      background:
                        'var(--accent, var(--primary-accent, #b5a8ff))',
                      color: '#0f172a',
                    }}
                  >
                    <FaRedo /> Replay
                  </button>
                  {hasNext && (
                    <button
                      type='button'
                      onClick={() => onNextEpisode()}
                      style={navBtnStyle}
                    >
                      Next <FaStepForward />
                    </button>
                  )}
                  <button
                    type='button'
                    onClick={() => setShowEndedOverlay(false)}
                    style={navBtnStyle}
                    aria-label='Close'
                  >
                    <FaUndo /> Continue
                  </button>
                </div>
              </div>
            )}
            {noSourceOverlay}
            {/* Manual skip prompt: above the bottom-right ArtPlayer controls */}
            {(showSkipIntro || showSkipOutro) && (
              <div
                className='watch-skip-overlay'
                aria-label='Episode skip controls'
                style={{
                  position: 'absolute',
                  right: 'clamp(8px, 2.2vw, 18px)',
                  bottom: 'calc(42px + env(safe-area-inset-bottom, 0px))',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexWrap: 'wrap',
                  maxWidth: 'calc(100% - 16px)',
                  padding: 5,
                  background: 'rgba(6,10,20,0.38)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
                  pointerEvents: 'auto',
                }}
              >
                {showSkipIntro && (
                  <button
                    type='button'
                    className='watch-skip-btn'
                    onClick={() => handleSkipSegment('intro')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.12)',
                      color: '#f8fafc',
                      border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: 40,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <FaStepForward />
                    Skip Intro
                  </button>
                )}
                {showSkipOutro && (
                  <button
                    type='button'
                    className='watch-skip-btn'
                    onClick={() => handleSkipSegment('outro')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.12)',
                      color: '#f8fafc',
                      border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: 40,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <FaStepForward />
                    Skip Outro
                  </button>
                )}
              </div>
            )}
          </PlayerViewport>
          {controlBar}
        </>
      )}
    </div>
  );
}
