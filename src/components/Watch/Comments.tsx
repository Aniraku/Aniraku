import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { FaPlay, FaTimes, FaTv } from 'react-icons/fa';
import { useMediaQuery } from './useMediaQuery';
import TacLoginNotice from '../TacLoginNotice';

// ---------------------------------------------------------------------------
// TheAnimeCommunity comments embed — 1:1 port of the live `Ye` component
// (chunks/Seasons-O6-NO94x.js). The embed CONTRACT is byte-for-byte:
//   - <script id="anime-community-script" src="https://theanimecommunity.com/embed.js">
//   - <div id="anime-community-comment-section">
//   - window.theAnimeCommunityConfig = {AniList_ID, episodeChapterNumber,
//     mediaType, colorScheme, removeBorder:'true', removePadding:'true'}
//   - loader promise + window.theAnimeCommunity.reload()
//   - count API https://theanimecommunity.com/api/v1/comments/count
//   - message TAC-TIMESTAMP-CLICK -> window 'comments:timestamp-click'
// Surrounding chrome (title bar, ANIME/EP tabs, compact button + drag sheet)
// replicates live markup and live CSS rules verbatim below.
// ---------------------------------------------------------------------------

const CONTAINER_ID = `anime-community-comment-section`;
const SCRIPT_ID = `anime-community-script`;
const SCRIPT_SRC = `https://theanimecommunity.com/embed.js`;
const COUNT_URL = `https://theanimecommunity.com/api/v1/comments/count`;
const COMPACT_BREAKPOINT = 768;
const PRIMARY_MIX = `color-mix(in srgb, var(--primary-accent) 65%, black)`;

// Live class map (CSS-module hashes kept verbatim so markup matches byte-for-byte).
const z = {
  commentButton: `_commentButton_qywzu_1`,
  commentButtonCompact: `_commentButtonCompact_qywzu_28`,
  commentButtonWrapper: `_commentButtonWrapper_qywzu_47`,
  commentButtonWrapperCompact: `_commentButtonWrapperCompact_qywzu_54`,
  commentSectionContainer: `_commentSectionContainer_qywzu_61`,
  titleContainer: `_titleContainer_qywzu_70`,
  titleWrapper: `_titleWrapper_qywzu_87`,
  label: `_label_qywzu_92`,
  framePad: `_framePad_qywzu_97`,
  frame: `_frame_qywzu_97`,
  hidden: `_hidden_qywzu_105`,
} as const;

const H = {
  commentsButton: `_commentsButton_7nuxx_1`,
  commentsButtonHeader: `_commentsButtonHeader_7nuxx_27`,
  commentsButtonIcon: `_commentsButtonIcon_7nuxx_32`,
  commentsButtonTitle: `_commentsButtonTitle_7nuxx_36`,
  commentsButtonSubtitle: `_commentsButtonSubtitle_7nuxx_40`,
  sheet: `_sheet_7nuxx_79`,
  sheetOpen: `_sheetOpen_7nuxx_102`,
  sheetExpanded: `_sheetExpanded_7nuxx_105`,
  dragging: `_dragging_7nuxx_117`,
  sheetHeader: `_sheetHeader_7nuxx_121`,
  handleBar: `_handleBar_7nuxx_133`,
  headerRow: `_headerRow_7nuxx_143`,
  closeBtn: `_closeBtn_7nuxx_150`,
  scroller: `_scroller_7nuxx_174`,
} as const;

// Live CSS rules for modules qywzu + 7nuxx, copied verbatim from
// /tmp/opencode/live/style.css (values and class hashes unchanged).
const LIVE_COMMENTS_CSS = `
._commentButton_qywzu_1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;gap:.5rem;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;justify-content:center;padding:.75rem 1rem;font-size:.75rem;color:var(--global-text);cursor:pointer;background-color:transparent;border:1px solid var(--global-border-color);border-radius:var(--global-border-radius)}
._commentButton_qywzu_1[data-active=true]{color:var(--primary-accent);background-color:var(--primary-accent-tr);border-color:var(--primary-accent)}
._commentButton_qywzu_1:hover{background-color:var(--global-div)}
._commentButton_qywzu_1[data-active=true]:hover{background-color:var(--primary-accent-tr)}
._commentButton_qywzu_1:active{-webkit-transform:scale(.95);-moz-transform:scale(.95);transform:scale(.95)}
._commentButtonCompact_qywzu_28{-webkit-box-flex:1;-webkit-flex:1 1 0;-moz-box-flex:1;flex:1 1 0;gap:.3rem;padding:.5rem .65rem;font-size:.75rem;background-color:var(--global-div-tr);transition:flex-grow .3s cubic-bezier(.2,.9,.25,1),background-color .2s ease,color .2s ease,border-color .2s ease}
._commentButtonCompact_qywzu_28[data-active=true]{-webkit-box-flex:3;-webkit-flex-grow:3;-moz-box-flex:3;flex-grow:3;background-color:var(--primary-accent-tr)}
._commentButtonCompact_qywzu_28 svg{font-size:.8rem}
._commentButtonWrapper_qywzu_47{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;-webkit-flex-wrap:wrap;flex-wrap:wrap;gap:.5rem;margin-left:auto;overflow:hidden}
._commentButtonWrapperCompact_qywzu_54{-webkit-box-flex:1;-webkit-flex:1 1 0;-moz-box-flex:1;flex:1 1 0;-webkit-flex-wrap:nowrap;flex-wrap:nowrap;gap:.4rem;margin-left:0;overflow:visible}
._commentSectionContainer_qywzu_61{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-moz-box-orient:vertical;-moz-box-direction:normal;flex-direction:column;overflow:hidden;color:var(--global-text);background-color:var(--global-div);border:1px solid var(--global-border-color);border-radius:var(--global-border-radius)}
._titleContainer_qywzu_70{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;-webkit-flex-wrap:wrap;flex-wrap:wrap;gap:.5rem;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;align-items:center;background-color:var(--global-div-tr);-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;justify-content:space-between;padding:.75rem;font-size:1.25rem;font-weight:700;color:var(--global-text);cursor:pointer;-webkit-user-select:none;-moz-user-select:none;user-select:none}
._titleContainer_qywzu_70:hover:not(:has(._commentButtonWrapper_qywzu_47:hover)){background-color:var(--global-div)}
._titleWrapper_qywzu_87{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;gap:.5rem;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;align-items:center}
._label_qywzu_92{margin:0;font-size:.95rem;color:var(--global-text)}
._framePad_qywzu_97{padding:1.25rem}
._frame_qywzu_97{width:100%;overflow:hidden;border-radius:var(--global-border-radius)}
._hidden_qywzu_105{display:none}
@media(max-width:500px){._framePad_qywzu_97{padding:0 .5rem .5rem}}
._commentsButton_7nuxx_1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-moz-box-orient:vertical;-moz-box-direction:normal;flex-direction:column;gap:.3rem;-webkit-box-align:stretch;-webkit-align-items:stretch;-moz-box-align:stretch;align-items:stretch;width:100%;padding:.65rem 1rem;font:inherit;color:var(--global-text);text-align:left;cursor:pointer;background-color:var(--global-div);border:1px solid var(--global-border-color);border-radius:var(--global-border-radius);transition:background-color .15s ease,transform .15s ease,box-shadow .15s ease}
._commentsButton_7nuxx_1:hover,._commentsButton_7nuxx_1:focus-visible{border-color:var(--global-text-muted)}
._commentsButton_7nuxx_1:active{-webkit-transform:scale(.99);-moz-transform:scale(.99);transform:scale(.99)}
._commentsButtonHeader_7nuxx_27{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;gap:.5rem;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;align-items:center}
._commentsButtonIcon_7nuxx_32{font-size:1.1rem;color:var(--global-text)}
._commentsButtonTitle_7nuxx_36{font-size:1.1rem;font-weight:700}
._commentsButtonSubtitle_7nuxx_40{margin:0;font-size:.8rem;color:var(--global-text-muted)}
._sheet_7nuxx_79{position:fixed;right:.6rem;bottom:0;left:.6rem;z-index:var(--z-index-popup);display:grid;grid-template-rows:auto 1fr;overflow:hidden;color:var(--global-text);background-color:var(--global-div);border:1px solid var(--global-border-color);border-bottom:none;border-radius:var(--global-border-radius) var(--global-border-radius) 0 0;box-shadow:0 -8px 32px #0003;transition:height .22s cubic-bezier(.2,.9,.25,1),border-radius .22s cubic-bezier(.2,.9,.25,1),left .22s cubic-bezier(.2,.9,.25,1),right .22s cubic-bezier(.2,.9,.25,1),transform .22s cubic-bezier(.2,.9,.25,1);-webkit-transform:translateY(100%);-moz-transform:translateY(100%);transform:translateY(100%)}
._sheetOpen_7nuxx_102{-webkit-transform:translateY(0);-moz-transform:translateY(0);transform:translateY(0)}
._sheetExpanded_7nuxx_105{right:0;left:0;border:none;border-radius:0}
@media(max-width:500px){._sheet_7nuxx_79{right:.45rem;left:.45rem}}
._dragging_7nuxx_117{-webkit-transition:none;-moz-transition:none;transition:none}
._sheetHeader_7nuxx_121{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-moz-box-orient:vertical;-moz-box-direction:normal;flex-direction:column;gap:.5rem;padding:.6rem .75rem .75rem;touch-action:none;cursor:grab;-webkit-user-select:none;-moz-user-select:none;user-select:none}
._sheetHeader_7nuxx_121:active{cursor:grabbing}
._handleBar_7nuxx_133{display:block;width:2.75rem;height:.3rem;margin:0 auto;pointer-events:none;background-color:var(--global-text-muted);border-radius:999px;opacity:.6}
._headerRow_7nuxx_143{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;-webkit-flex-wrap:nowrap;flex-wrap:nowrap;gap:.5rem;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;align-items:center;width:100%}
._closeBtn_7nuxx_150{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:inline-flex;-webkit-flex-shrink:0;flex-shrink:0;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;justify-content:center;width:2.25rem;height:2.25rem;margin-left:auto;font-size:1.1rem;color:var(--global-text-muted);cursor:pointer;background-color:transparent;border:none;border-radius:var(--global-border-radius);transition:color .15s ease,background-color .15s ease}
._closeBtn_7nuxx_150:hover,._closeBtn_7nuxx_150:focus-visible{color:var(--global-text);background-color:var(--global-div-tr)}
._scroller_7nuxx_174{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
html.overlay-open{overflow:hidden!important}
`;

// ---------------------------------------------------------------------------
// Live helpers
// ---------------------------------------------------------------------------

// Ee — AniList id must be a finite positive number (or numeric string here).
function anilistIdOf(media: { id?: unknown } | null | undefined): string | null {
  if (!media) return null;
  const id = Number(media.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return String(id);
}

// De — episodeChapterNumber: `0` for overall/movie/unreleased, else String(ep).
function chapterOf(args: {
  overall: boolean;
  isMovie: boolean;
  isUnreleased: boolean;
  episodeNumber: number;
}): string | null {
  if (args.overall || args.isMovie || args.isUnreleased) return `0`;
  if (!Number.isFinite(args.episodeNumber) || args.episodeNumber < 0)
    return null;
  return String(args.episodeNumber);
}

// He — count payload: {count} | {data:{count}}.
function parseCount(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as { count?: unknown; data?: { count?: unknown } };
  if (typeof p.count === 'number' && Number.isFinite(p.count)) return p.count;
  if (typeof p.data?.count === 'number' && Number.isFinite(p.data.count))
    return p.data.count;
  return null;
}

// qe — resolve a CSS color() expression through a detached element.
function resolveCssColor(expr: string): string {
  const el = document.createElement('div');
  el.style.color = expr;
  el.style.display = `none`;
  document.documentElement.appendChild(el);
  const value = getComputedStyle(el).color;
  el.remove();
  return value;
}

type ColorScheme = {
  primaryColor: string;
  backgroundColor: string;
  strongTextColor: string;
  primaryTextColor: string;
  dropDownTextColor: string;
  secondaryTextColor: string;
  iconColor: string;
  accentColor: string;
};

const EMPTY_SCHEME: ColorScheme = {
  primaryColor: ``,
  backgroundColor: ``,
  strongTextColor: ``,
  primaryTextColor: ``,
  dropDownTextColor: ``,
  secondaryTextColor: ``,
  iconColor: ``,
  accentColor: ``,
};

// Je — colorScheme for the embed, sampled from the page's own CSS vars.
function computeColorScheme(): ColorScheme {
  if (typeof document === `undefined`) return EMPTY_SCHEME;
  const rootStyle = getComputedStyle(document.documentElement);
  const value = (name: string) => rootStyle.getPropertyValue(name).trim();
  const text = value(`--global-text`);
  return {
    primaryColor: resolveCssColor(PRIMARY_MIX),
    backgroundColor: value(`--global-div`),
    strongTextColor: text,
    primaryTextColor: text,
    dropDownTextColor: text,
    secondaryTextColor: value(`--global-text-muted`),
    iconColor: value(`--global-text-muted-strong`),
    accentColor: value(`--global-border-color`),
  };
}

function sameScheme(a: ColorScheme, b: ColorScheme): boolean {
  return (
    a.primaryColor === b.primaryColor &&
    a.backgroundColor === b.backgroundColor &&
    a.strongTextColor === b.strongTextColor &&
    a.primaryTextColor === b.primaryTextColor &&
    a.dropDownTextColor === b.dropDownTextColor &&
    a.secondaryTextColor === b.secondaryTextColor &&
    a.iconColor === b.iconColor &&
    a.accentColor === b.accentColor
  );
}

// Ue — singleton embed.js loader (same id/src/onload semantics as live).
let tacScriptPromise: Promise<void> | null = null;
function loadTacScript(): Promise<void> {
  if (typeof document === `undefined` || window.theAnimeCommunity?.reload)
    return Promise.resolve();
  if (tacScriptPromise) return tacScriptPromise;
  tacScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener(`load`, () => resolve(), { once: true });
      existing.addEventListener(
        `error`,
        () => {
          tacScriptPromise = null;
          reject(new Error(`TAC script load failed`));
        },
        { once: true },
      );
      return;
    }
    const script = document.createElement(`script`);
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      tacScriptPromise = null;
      reject(new Error(`TAC script load failed`));
    };
    document.head.appendChild(script);
  });
  return tacScriptPromise;
}

declare global {
  interface Window {
    theAnimeCommunityConfig?: Record<string, unknown>;
    theAnimeCommunity?: { reload?: () => void };
  }
}

// ---------------------------------------------------------------------------
// Oe — ANIME / EP n tab buttons (qywzu markup)
// ---------------------------------------------------------------------------

type TabButtonsProps = {
  animeActive: boolean;
  episodeActive: boolean;
  canShowEpisode: boolean;
  episodeNumber: number;
  onAnimeClick: () => void;
  onEpisodeClick: () => void;
  compact: boolean;
};

const TabButtons: React.FC<TabButtonsProps> = ({
  animeActive,
  episodeActive,
  canShowEpisode,
  episodeNumber,
  onAnimeClick,
  onEpisodeClick,
  compact,
}) => {
  const buttonClass = [z.commentButton, compact && z.commentButtonCompact]
    .filter(Boolean)
    .join(` `);
  const wrapperClass = [
    z.commentButtonWrapper,
    compact && z.commentButtonWrapperCompact,
  ]
    .filter(Boolean)
    .join(` `);
  return (
    <div className={wrapperClass}>
      <button
        className={buttonClass}
        data-active={animeActive ? `true` : undefined}
        onClick={(e) => {
          e.stopPropagation();
          onAnimeClick();
        }}
      >
        <FaTv aria-hidden='true' /> ANIME
      </button>
      {canShowEpisode && (
        <button
          className={buttonClass}
          data-active={episodeActive ? `true` : undefined}
          onClick={(e) => {
            e.stopPropagation();
            onEpisodeClick();
          }}
        >
          <FaPlay aria-hidden='true' /> EP {episodeNumber}
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Te — compact comments button
// ---------------------------------------------------------------------------

const CompactCommentsButton: React.FC<{
  onOpen: () => void;
  subtitle?: string;
}> = ({ onOpen, subtitle }) => (
  <button
    id='comments-button'
    type='button'
    className={H.commentsButton}
    onClick={onOpen}
    aria-label='Open comments'
  >
    <div className={H.commentsButtonHeader}>
      <FaTv className={H.commentsButtonIcon} aria-hidden='true' />
      <span className={H.commentsButtonTitle}>Comments</span>
    </div>
    <p className={H.commentsButtonSubtitle}>
      {subtitle ?? `Tap to join the discussion`}
    </p>
  </button>
);

// ---------------------------------------------------------------------------
// Fe — compact bottom sheet with drag physics (ported from live)
// ---------------------------------------------------------------------------

const CLOSE_AFTER_DRAG = 80;
const EXPAND_AFTER_DRAG = 60;
const DRAG_THRESHOLD = 6;
const MIN_SHEET_HEIGHT = 280;

function sheetSizesFromPlayer(): { default: number; expanded: number } {
  const player = document.getElementById(`player-container`)?.getBoundingClientRect();
  const viewport = window.innerHeight;
  const bottom = player ? Math.max(0, player.bottom) : 0;
  return {
    default: Math.max(MIN_SHEET_HEIGHT, viewport - bottom),
    expanded: viewport,
  };
}

function initialSheetSizes(): { default: number; expanded: number } {
  if (typeof window === `undefined`)
    return { default: MIN_SHEET_HEIGHT, expanded: MIN_SHEET_HEIGHT };
  return {
    default: Math.max(MIN_SHEET_HEIGHT, Math.round(window.innerHeight * 0.7)),
    expanded: window.innerHeight,
  };
}

type SheetProps = {
  opened: boolean;
  onClose: () => void;
  tabButtons: React.ReactNode;
  children: React.ReactNode;
};

const CommentsSheet: React.FC<SheetProps> = ({
  opened,
  onClose,
  tabButtons,
  children,
}) => {
  const [dragOffset, setDragOffset] = useState(0); // i
  const [dragging, setDragging] = useState(false); // o
  const pointerStartRef = useRef<number | null>(null); // c
  const didDragRef = useRef(false); // l
  const [mode, setMode] = useState<'default' | 'expanded'>('default'); // u
  const prevModeRef = useRef<'default' | 'expanded'>('default'); // p
  const [sizes, setSizes] = useState(initialSheetSizes); // m
  const location = useLocation(); // v
  const pinnedPathRef = useRef<string | null>(null); // y

  useEffect(() => {
    if (opened) setSizes(sheetSizesFromPlayer());
  }, [opened]);

  useEffect(() => {
    prevModeRef.current = mode;
  }, [mode]);

  const close = useCallback(() => {
    setDragOffset(0);
    setDragging(false);
    didDragRef.current = false;
    pointerStartRef.current = null;
    setMode('default');
    onClose();
  }, [onClose]);

  // Close when the route changes underneath the open sheet.
  useEffect(() => {
    if (!opened) {
      pinnedPathRef.current = null;
      return;
    }
    if (pinnedPathRef.current === null) {
      pinnedPathRef.current = location.pathname;
      return;
    }
    if (location.pathname !== pinnedPathRef.current) close();
  }, [opened, location.pathname, close]);

  // Escape closes; lock the page scroll while open.
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === `Escape`) close();
    };
    document.addEventListener(`keydown`, onKey);
    document.documentElement.classList.add(`overlay-open`);
    const pinnedScroll = window.scrollY;
    const keepPinned = () => {
      if (window.scrollY !== pinnedScroll) window.scrollTo(0, pinnedScroll);
    };
    window.addEventListener(`scroll`, keepPinned, {
      capture: true,
      passive: false,
    });
    return () => {
      document.removeEventListener(`keydown`, onKey);
      document.documentElement.classList.remove(`overlay-open`);
      window.removeEventListener(`scroll`, keepPinned, { capture: true });
    };
  }, [opened, close]);

  const onPointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = e.clientY;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (pointerStartRef.current === null) return;
    const delta = e.clientY - pointerStartRef.current;
    if (!didDragRef.current) {
      if (Math.abs(delta) <= DRAG_THRESHOLD) return;
      didDragRef.current = true;
      setDragging(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* pointer capture unsupported — drag still works */
      }
    }
    const range = sizes.expanded - sizes.default;
    const base = prevModeRef.current === 'expanded' ? 0 : -range;
    setDragOffset(Math.max(base, delta));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerStartRef.current === null) return;
    const offset = dragOffset;
    const wasDrag = didDragRef.current;
    didDragRef.current = false;
    setDragging(false);
    pointerStartRef.current = null;
    if (!wasDrag) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const range = sizes.expanded - sizes.default;
    if (prevModeRef.current === 'default') {
      if (offset > CLOSE_AFTER_DRAG) {
        close();
        return;
      }
      if (offset < -60) setMode('expanded');
      setDragOffset(0);
      return;
    }
    if (offset - range > CLOSE_AFTER_DRAG) {
      close();
      return;
    }
    if (offset > EXPAND_AFTER_DRAG) setMode('default');
    setDragOffset(0);
  };

  // Live height/transform math (Fe return).
  const range = sizes.expanded - sizes.default;
  let height: number;
  let translate: number;
  if (mode === 'default') {
    if (dragOffset < 0) {
      height = Math.min(sizes.expanded, sizes.default - dragOffset);
      translate = 0;
    } else {
      height = sizes.default;
      translate = dragOffset;
    }
  } else if (dragOffset <= 0) {
    height = sizes.expanded;
    translate = 0;
  } else if (dragOffset <= range) {
    height = sizes.expanded - dragOffset;
    translate = 0;
  } else {
    height = sizes.default;
    translate = dragOffset - range;
  }
  const transform = opened ? `translateY(${translate}px)` : undefined;

  const sheetClass = [
    H.sheet,
    opened && H.sheetOpen,
    mode === 'expanded' && H.sheetExpanded,
    dragging && H.dragging,
  ]
    .filter(Boolean)
    .join(` `);

  return createPortal(
    <div
      className={sheetClass}
      style={{ height: `${height}px`, transform }}
      role='dialog'
      aria-modal='true'
      aria-label='Comments'
    >
      <header
        className={H.sheetHeader}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className={H.handleBar} aria-hidden='true' />
        <div className={H.headerRow}>
          {tabButtons}
          <button
            type='button'
            className={H.closeBtn}
            onClick={close}
            aria-label='Close comments'
          >
            <FaTimes aria-hidden='true' />
          </button>
        </div>
      </header>
      <div className={H.scroller}>{children}</div>
    </div>,
    document.body,
  );
};

// ---------------------------------------------------------------------------
// Ye — the comments component itself
// ---------------------------------------------------------------------------

export type CommentsProps = {
  loading?: boolean;
  // AniList media id (number or string — coerced exactly like live's Ee).
  mediaId?: string | number | null;
  episodeNumber?: number;
  // AniList format (`MOVIE`) + status (`Not yet aired`) + episode availability.
  mediaFormat?: string;
  mediaStatus?: string;
  episodeCount?: number;
  mediaType?: string;
  forceInline?: boolean;
};

// Live initializes its `f` state from `settings.comments` (StoredSettings
// field, default true). The provider's public useSettings() shape does not
// expose it, so read the same persisted record the provider writes
// (`aniraku:settings` → .settings.comments) — same source, same snapshot-at-
// mount semantics as live's useState(a.comments).
function readCommentsPref(): boolean {
  try {
    const raw = localStorage.getItem('aniraku:settings');
    if (raw) {
      const record = JSON.parse(raw);
      const value = record?.settings?.comments;
      if (typeof value === 'boolean') return value;
    }
  } catch {
    // Malformed record — fall through to the live default.
  }
  return true; // LIVE_DEFAULTS.comments
}

export const Comments: React.FC<CommentsProps> = ({
  loading = false,
  mediaId,
  episodeNumber = 0,
  mediaFormat,
  mediaStatus,
  episodeCount = 0,
  mediaType = `anime`,
  forceInline = false,
}) => {
  const compact = useMediaQuery(`(max-width: ${COMPACT_BREAKPOINT}px)`) && !forceInline;

  const media = { id: mediaId, format: mediaFormat, status: mediaStatus };
  const isMovie = (mediaFormat || ``).toUpperCase() === `MOVIE`;
  const hasEpisodes = episodeCount > 0;
  const isUnreleased = mediaStatus === `Not yet aired` && !hasEpisodes;
  const canShowEpisode = episodeNumber > 0 && !isMovie && !isUnreleased;

  // f — local copy of the `comments` accessibility setting (live useState(a.comments)).
  const [commentsEnabled, setCommentsEnabled] = useState(readCommentsPref);
  // m — overall (ANIME scope) vs episode scope.
  const [overall, setOverall] = useState(!canShowEpisode);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() =>
    computeColorScheme(),
  );
  // v — compact sheet opened (gates embed config + count fetch on mobile).
  const [sheetOpened, setSheetOpened] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setOverall(!canShowEpisode);
  }, [canShowEpisode]);

  // Keep scheme in sync with theme changes (live re-samples on theme name change).
  useEffect(() => {
    let disposed = false;
    const frame = requestAnimationFrame(() => {
      if (disposed) return;
      const next = computeColorScheme();
      setColorScheme((prev) => (sameScheme(prev, next) ? prev : next));
    });
    const observer = new MutationObserver(() => {
      const next = computeColorScheme();
      setColorScheme((prev) => (sameScheme(prev, next) ? prev : next));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [`class`, `data-theme`, `style`],
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [compact]);

  const anilistId = anilistIdOf(media);
  const chapter = chapterOf({
    overall,
    isMovie,
    isUnreleased,
    episodeNumber,
  });
  const isValid = anilistId !== null && chapter !== null;

  const animeActive = overall || (commentsEnabled && (isMovie || isUnreleased));
  const episodeActive = !overall && commentsEnabled;
  const frameClass =
    !loading && isValid && (compact || commentsEnabled)
      ? z.framePad
      : `${z.framePad} ${z.hidden}`;

  // Config + embed loader (live effect: skip on compact until the sheet opens).
  useEffect(() => {
    if (anilistId === null || chapter === null) return;
    if (compact && !sheetOpened) return;
    window.theAnimeCommunityConfig = {
      AniList_ID: anilistId,
      episodeChapterNumber: chapter,
      mediaType: (mediaType || `anime`).toLowerCase(),
      colorScheme,
      removeBorder: `true`,
      removePadding: `true`,
    };
    let disposed = false;
    loadTacScript()
      .then(() => {
        if (!disposed) window.theAnimeCommunity?.reload?.();
      })
      .catch(() => {
        /* embed.js failed to load — frame stays empty */
      });
    return () => {
      disposed = true;
    };
  }, [anilistId, chapter, mediaType, colorScheme, compact, sheetOpened]);

  // Comment count — fetched only in compact mode, exactly like live.
  useEffect(() => {
    if (!compact) return;
    if (anilistId === null || chapter === null) return;
    const controller = new AbortController();
    const url =
      `${COUNT_URL}?aniListID=${encodeURIComponent(anilistId)}` +
      `&episodeChapterNumber=${encodeURIComponent(chapter)}` +
      `&mediaType=${encodeURIComponent((mediaType || `anime`).toLowerCase())}`;
    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const parsed = parseCount(payload);
        if (parsed !== null) setCount(parsed);
      })
      .catch(() => {
        /* count is decorative only */
      });
    return () => controller.abort();
  }, [compact, anilistId, chapter, mediaType]);

  // TAC-TIMESTAMP-CLICK -> local `comments:timestamp-click` event (live verbatim).
  // Origin-checked: only the TAC embed frame may drive player seeks.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://theanimecommunity.com') return;
      if (
        event.data?.type === `TAC-TIMESTAMP-CLICK` &&
        typeof event.data?.time === `number`
      ) {
        window.dispatchEvent(
          new CustomEvent(`comments:timestamp-click`, {
            detail: { time: event.data.time },
          }),
        );
      }
    };
    window.addEventListener(`message`, onMessage);
    return () => window.removeEventListener(`message`, onMessage);
  }, []);

  const openSheet = useCallback(() => {
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: `smooth` });
      window.setTimeout(() => setSheetOpened(true), 320);
    } else {
      setSheetOpened(true);
    }
  }, []);
  const closeSheet = useCallback(() => setSheetOpened(false), []);

  const tabButtons = (
    <TabButtons
      animeActive={animeActive}
      episodeActive={episodeActive}
      canShowEpisode={canShowEpisode}
      episodeNumber={episodeNumber}
      onAnimeClick={() => {
        setCommentsEnabled(true);
        setOverall(true);
      }}
      onEpisodeClick={() => {
        setCommentsEnabled(true);
        setOverall(false);
      }}
      compact={compact}
    />
  );

  const frame = (
    <div className={frameClass}>
      <div id={CONTAINER_ID} className={z.frame} />
    </div>
  );

  // Live gate: nothing to show without a valid AniList id / chapter.
  if (anilistId === null || chapter === null) return null;

  if (compact) {
    // Live compact branch: button + drag sheet (settings + ids must be present).
    if (!commentsEnabled || !isValid) return null;
    const subtitleParts: string[] = [];
    if (!overall && !isMovie && !isUnreleased && episodeNumber > 0)
      subtitleParts.push(`EP ${episodeNumber}`);
    if (count !== null)
      subtitleParts.push(
        `${count.toLocaleString()} ${count === 1 ? `comment` : `comments`}`,
      );
    subtitleParts.push(`Tap to join the discussion`);
    return (
      <>
        <TacLoginNotice />
        <CompactCommentsButton
          onOpen={openSheet}
          subtitle={subtitleParts.join(` · `)}
        />
        <CommentsSheet opened={sheetOpened} onClose={closeSheet} tabButtons={tabButtons}>
          {frame}
        </CommentsSheet>
      </>
    );
  }

  // Wide branch — live markup: commentSectionContainer > titleContainer >
  // titleWrapper > (label + `Comments`), tab buttons, then framePad > frame.
  return (
    <>
      <TacLoginNotice />
      <div className={z.commentSectionContainer}>
      <div
        className={z.titleContainer}
        onClick={() => setOverall((value) => !value)}
      >
        <div className={z.titleWrapper}>
          <div>
            <p className={z.label}>The Anime Community</p>
            Comments
          </div>
        </div>
        {tabButtons}
      </div>
      {frame}
    </div>
    </>
  );
};

// Inject the live CSS rules exactly once at module load (client-only SPA).
if (typeof document !== `undefined` && !document.getElementById(`live-comments-css`)) {
  const style = document.createElement(`style`);
  style.id = `live-comments-css`;
  style.textContent = LIVE_COMMENTS_CSS;
  document.head.appendChild(style);
}

export default Comments;
