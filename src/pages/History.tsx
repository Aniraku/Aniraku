import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import { IoArrowDown, IoArrowUp, IoClose } from 'react-icons/io5';
import useWatchHistory, {
  LOCAL_STORAGE_KEYS,
  SortValue,
  WatchHistoryEntry,
} from '../hooks/useWatchHistory';
import type { Episode } from '../hooks/animeInterface';
import { clearWatchHistory, publishWatchHistory } from '../lib/watchHistory';
import {
  forgetSyncedAnime,
  getSessionUserId,
  publishHistoryNow,
} from '../lib/sync';

/* ------------------------------------------------------------------ *
 * Constants & helpers (ported from the live v1.14.x History route)   *
 * ------------------------------------------------------------------ */

const PAGE_SIZE = 20;
const HOUR_MS = 36e5;
const DAY_MS = 864e5;

type SortDirection = 'asc' | 'desc';

const SORT_OPTIONS: { label: string; value: SortValue }[] = [
  { label: 'Last watched', value: 'last-watched' },
  { label: 'A-Z', value: 'a-z' },
  { label: 'Progress', value: 'episode' },
  { label: 'Air date', value: 'air-date' },
];

function startOfDay(time: number): number {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Relative "Last watched" label (same buckets as the live site's relative time). */
function relativeLastWatched(timestamp: number, now: number = Date.now()): string {
  if (!timestamp) return '';
  const diff = Math.max(0, now - timestamp);
  if (diff < HOUR_MS) return 'Just now';
  const dayDiff = Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY_MS);
  if (dayDiff === 0) return 'Today';
  if (dayDiff === 1) return 'Yesterday';
  if (diff < 7 * DAY_MS) return 'This week';
  if (diff < 30 * DAY_MS) return 'Last 30 days';
  if (diff < 182.5 * DAY_MS) return 'Over 1 month ago';
  if (diff < 365 * DAY_MS) return 'Over 6 months ago';
  return 'Over 1 year ago';
}

/** Date-group heading used when sorting by "Last watched" (Today / Yesterday / long date). */
function dateGroupLabel(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (dayStart.getTime() === todayStart.getTime()) return 'Today';
  if (dayStart.getTime() === yesterdayStart.getTime()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { dateStyle: 'long' });
}

function groupByDate(
  items: WatchHistoryEntry[],
): Map<string, WatchHistoryEntry[]> {
  const groups = new Map<string, WatchHistoryEntry[]>();
  for (const item of items) {
    const label = item.lastWatched
      ? dateGroupLabel(item.lastWatched)
      : 'Unknown date';
    const group = groups.get(label);
    if (group) {
      group.push(item);
    } else {
      groups.set(label, [item]);
    }
  }
  return groups;
}

interface SortFields {
  title: string;
  episode: number;
  airTime: number;
  lastWatched: number;
}

function sortFieldsOf(entry: WatchHistoryEntry): SortFields {
  return {
    title: entry.displayTitle,
    episode: entry.episode.number ?? 0,
    airTime: entry.airTime,
    lastWatched: entry.lastWatched,
  };
}

/** Comparator ported from the live route: last-watched / a-z / episode / air-date. */
function compareBy(
  a: SortFields,
  b: SortFields,
  order: SortValue,
  direction: SortDirection,
): number {
  const i = direction === 'asc' ? 1 : -1;
  switch (order) {
    case 'a-z':
      return i * a.title.localeCompare(b.title);
    case 'episode':
      return i * (a.episode - b.episode);
    case 'air-date':
      return i * (a.airTime - b.airTime);
    default:
      return i * (a.lastWatched - b.lastWatched);
  }
}

function matchesFilter(entry: WatchHistoryEntry, filter: string): boolean {
  if (!filter) return true;
  const needle = filter.toLowerCase();
  return (
    entry.titleEnglish.toLowerCase().includes(needle) ||
    entry.titleRomaji.toLowerCase().includes(needle) ||
    entry.displayTitle.toLowerCase().includes(needle)
  );
}

/* ------------------------------------------------------------------ *
 * Bulk operations (ported from Aniraku Profile's history tab:        *
 * Select all / Remove N / Clear History + Settings' undoSnapshot bar)*
 * ------------------------------------------------------------------ */

/** Page-local undo bar window. */
const UNDO_WINDOW_MS = 8000;
/** Two-step confirm auto-revert (Clear History / bulk remove). */
const CONFIRM_REVERT_MS = 4000;
/** Delay before re-pushing restored rows so the server delete lands first. */
const UNDO_REPUSH_DELAY_MS = 1500;

/** `watched-episodes` shape: Record<animeId, Episode[]>. */
type WatchedMap = Record<string, Episode[]>;

/**
 * In-memory snapshot of exactly what a bulk action removed. Restoring it
 * re-writes the same localStorage keys the page reads and re-pushes the
 * mirrored `watch_history` rows through the existing sync engine — no
 * parallel persistence.
 */
type UndoSnapshot =
  | { kind: 'bulk'; count: number; watched: WatchedMap }
  | {
      kind: 'clear';
      count: number;
      raw: {
        watched: string | null;
        visited: string | null;
        playback: string | null;
      };
    };

function readLocalJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ *
 * Styles — exact values ported from the production style.css          *
 * (modules cmums = page, 1wtl4 = history card, e6kfs = switch)        *
 * ------------------------------------------------------------------ */

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

/* live `.vh` utility */
const VisuallyHiddenHeading = styled.h1`
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

const TwoColumnLayout = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  height: 100%;

  @media (max-width: 1000px) {
    flex-direction: column;
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
`;

const SideColumn = styled.div`
  position: sticky;
  top: 4.5rem;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 0.75rem;
  align-self: flex-start;
  width: 21rem;

  @media (max-width: 1000px) {
    position: static;
    order: -1;
    width: 100%;
  }
`;

const SidePanel = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const SidePanelSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const CompactControl = styled.div`
  display: flex;
  flex: 0 1 calc(50% - 0.25rem);
  min-width: 0;

  @media (max-width: 1000px) {
    flex-basis: 100%;
  }
`;

const FullRowControl = styled(CompactControl)`
  flex-basis: 100%;
`;

const SortRow = styled(FullRowControl)`
  gap: 0.5rem;
`;

const SortSelect = styled.select`
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--global-text);
  cursor: pointer;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  option {
    background-color: var(--global-div);
    color: var(--global-text);
  }

  &:hover,
  &:focus {
    border-color: var(--global-text);
    outline: none;
  }
`;

const DirectionButton = styled.button`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  font-family: inherit;
  color: var(--global-text);
  cursor: pointer;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  &:hover {
    border-color: var(--global-text);
  }

  &:active {
    transform: scale(0.9);
  }
`;

/* Switch (live module e6kfs: row/track/thumb) */
const PauseRow = styled(FullRowControl)`
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.8rem;
  color: var(--global-text);
  background: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const PauseLabel = styled.span`
  text-align: start;
`;

const SwitchTrack = styled.span<{ $checked: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 2.25rem;
  height: 1.25rem;
  background: ${({ $checked }) =>
    $checked ? 'var(--primary-accent)' : 'var(--global-div)'};
  border: 1px solid
    ${({ $checked }) =>
      $checked ? 'var(--primary-accent-bg)' : 'var(--global-border-color)'};
  border-radius: 1rem;
  transition: background-color 0.2s ease;
`;

const SwitchThumb = styled.span<{ $checked: boolean }>`
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1rem;
  height: 1rem;
  background-color: ${({ $checked }) =>
    $checked ? 'var(--primary-accent-bg)' : 'var(--global-text)'};
  border-radius: 50%;
  transition: 0.2s ease;
  transform: ${({ $checked }) =>
    $checked ? 'translate(0.975rem)' : 'translate(0)'};
`;

const SwitchButton = styled.button`
  display: inline-flex;
  justify-content: center;
  padding: 0.5rem;
  font-family: inherit;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--global-border-radius);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:active ${SwitchTrack} {
    transform: scale(0.95);
  }
`;

const SearchInput = styled.input`
  box-sizing: border-box;
  width: 100%;
  padding: 0.7rem;
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--global-text);
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  &:focus,
  &:hover,
  &:active {
    background-color: var(--global-secondary-bg);
    border: 1px solid var(--global-text);
    outline: none;
  }
`;

/* Help */
const HelpSection = styled.details`
  overflow: hidden;
  font-size: 0.8rem;
  color: var(--global-text-muted);
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const HelpToggle = styled.summary`
  padding: 0.7rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--global-text);
  list-style: none;
  cursor: pointer;
  user-select: none;
  background-color: var(--global-div-tr);

  &::marker,
  &::-webkit-details-marker {
    display: none;
  }

  &:hover {
    background-color: var(--global-div);
  }

  &::after {
    float: right;
    font-weight: 400;
    color: var(--global-text-muted);
    content: '+';
  }
`;

const HelpContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.7rem;
`;

const HelpBlock = styled.p`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  line-height: 1.5;

  strong,
  svg {
    color: var(--global-text);
  }

  > span > svg {
    margin-right: 0.25rem;
    vertical-align: -0.125em;
  }
`;

/* List / grid / grouping */
const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17.5rem, 1fr));
  gap: 1rem;
  align-items: start;

  @media (max-width: 600px) {
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  }
`;

const DateGroupSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DateGroupHeader = styled.div`
  position: sticky;
  top: 3.5rem;
  z-index: 1;
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
  width: max-content;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  margin-bottom: -2.75rem;
  margin-left: 0.5rem;
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const DateGroupTitle = styled.h2`
  display: flex;
  align-items: center;
  max-width: max-content;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--global-text);
`;

const DateGroupSubtitle = styled.span`
  display: inline-block;
  width: 100%;
  max-width: max-content;
  padding: 0.25rem 0.5rem;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--global-text-muted);
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const LoadingContainer = styled.div`
  margin: auto;
`;

/* Live wraps empty/error/login content in `_prompt_1xdbq_1` (prompt panel). */
const PromptWrapper = styled.div`
  --animation-duration: 0.3s;
  --animation-easing: ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: auto;
  text-align: center;

  img {
    max-width: 22.5rem;
    border-bottom-right-radius: var(--global-border-radius);
    border-bottom-left-radius: var(--global-border-radius);

    @media (max-width: 700px) {
      max-width: 100%;
    }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const EmptyLabel = styled.span`
  padding: 0.5rem;
`;

/* Live `_image_1r2hh_1`: fades in via `data-loaded`. */
const EmptyStateImage = styled.img`
  display: block;
  image-rendering: auto;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;

  &[data-loaded='true'] {
    opacity: 1;
  }
`;

const ItemCount = styled.span`
  font-size: 0.8rem;
  opacity: 0.5;
`;

const Sentinel = styled.div`
  height: 1px;
`;

/* History card (live module 1wtl4) */
const VerticalCardShell = styled.div<{ $selected?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'var(--primary-accent)' : 'var(--global-border-color)'};
  border-radius: var(--global-border-radius);
  transition: border-color 0.15s ease-in-out;
`;

const CardWrapper = styled(Link)`
  --card-overlay-inline-inset: 0.25rem;
  --card-overlay-top-inset: 0.25rem;
  --card-overlay-bottom-inset: 0.5rem;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  border-top-left-radius: var(--global-border-radius);
  border-top-right-radius: var(--global-border-radius);
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  transition:
    transform 0.35s ease,
    filter 0.25s ease;
`;

const PlayButton = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: var(--z-index-above);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #fff;
  border: 2px solid var(--global-border-color);
  border-radius: 50%;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
  transition:
    opacity 0.2s ease-in-out,
    transform 0.2s ease-in-out;
`;

const CardProgressBar = styled.div`
  position: absolute;
  bottom: -0.05rem;
  left: 0;
  display: flex;
  align-items: center;
  width: 100%;
  height: 0.25rem;
`;

const FullProgressBar = styled.div`
  width: 100%;
  height: 100%;
  background-color: #ffffff4d;
`;

const PlaybackProgressBar = styled.div`
  position: absolute;
  left: 0;
  height: 100%;
  background-color: red;
`;

const CardInfoTop = styled.div`
  position: absolute;
  top: var(--card-overlay-top-inset);
  right: var(--card-overlay-inline-inset);
  left: var(--card-overlay-inline-inset);
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const CardInfoBottom = styled.div`
  position: absolute;
  right: var(--card-overlay-inline-inset);
  bottom: var(--card-overlay-bottom-inset);
  left: var(--card-overlay-inline-inset);
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
`;

const CardLabel = styled.span`
  padding: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  background-color: #000000bf;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const CardRemoveIcon = styled(IoClose)`
  display: block;
  padding: 0.15rem;
  font-size: 1rem;
  color: #000;
  background-color: #fff;
  border-radius: var(--global-border-radius);
  box-shadow: 1px 1px 5px #000;
  transition: transform 0.2s ease-in-out;
`;

const CardRemoveButton = styled.button`
  padding: 0.5rem;
  margin-top: -0.25rem;
  margin-right: -0.25rem;
  margin-left: auto;
  color: #fff;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--global-border-radius);
  opacity: 0.2;
  transform: scale(0.95);
  transition:
    opacity 0.2s ease-in-out,
    transform 0.2s ease-in-out;

  &:hover ${CardRemoveIcon} {
    color: #fff;
    background-color: #000;
    border: 1px solid white;
    transform: scale(0.95);
  }
`;

/* Bulk-selection checkbox (Aniraku Profile history rows, always-on).
 * Rendered as a sibling of the card Link so ticking it never navigates. */
const CardSelectBox = styled.input`
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  z-index: 2;
  box-sizing: border-box;
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
  cursor: pointer;
  accent-color: var(--primary-accent);
  box-shadow: 0 1px 3px #000000a6;
`;

const CardTitleBelow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.35rem;
  overflow: hidden;
  font-size: 0.8rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: var(--global-div-tr);
  border-bottom-right-radius: var(--global-border-radius);
  border-bottom-left-radius: var(--global-border-radius);

  @media (max-width: 500px) {
    font-size: 0.75rem;
  }
`;

const CardTitleText = styled.p`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const WrapperWithHover = styled(CardWrapper)`
  &:hover {
    ${PlayButton} {
      box-shadow: 0 4px 8px #0000004d;
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    ${CardImage} {
      filter: brightness(0.5);
      transform: scale(1.1);
    }

    ${CardRemoveButton} {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

/* Toast (live uses a toast lib; no toast dependency exists locally) */
const Toast = styled.div`
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  z-index: var(--z-index-modal);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.1rem;
  font-size: 0.85rem;
  color: var(--global-text);
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  box-shadow: 0 4px 8px #0000004d;
  transform: translateX(-50%);
`;

/* Bulk toolbar (Aniraku Profile history tab header row) */
const BulkToolbar = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--global-text);
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const BulkSelectLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
`;

const BulkCheckbox = styled.input`
  box-sizing: border-box;
  width: 1rem;
  height: 1rem;
  margin: 0;
  cursor: pointer;
  accent-color: var(--primary-accent);
`;

const BulkActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: auto;
`;

/* Ghost button (DirectionButton parity) with Aniraku DangerBtn danger mode */
const BulkButton = styled.button<{ $danger?: boolean; $armed?: boolean }>`
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $danger }) =>
    $danger ? '#ef4444' : 'var(--global-text)'};
  cursor: pointer;
  background-color: ${({ $danger, $armed }) =>
    $danger
      ? $armed
        ? 'rgba(239, 68, 68, 0.2)'
        : 'rgba(239, 68, 68, 0.12)'
      : 'var(--global-div-tr)'};
  border: 1px solid
    ${({ $danger, $armed }) =>
      $danger
        ? $armed
          ? '#ef4444'
          : 'rgba(239, 68, 68, 0.4)'
        : 'var(--global-border-color)'};
  border-radius: var(--global-border-radius);

  &:hover {
    background-color: ${({ $danger }) =>
      $danger ? 'rgba(239, 68, 68, 0.2)' : 'var(--global-div-tr)'};
    border-color: ${({ $danger }) =>
      $danger ? '#ef4444' : 'var(--global-text)'};
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

/* Page-local undo bar (Aniraku Settings undoSnapshot bar, inline variant) */
const UndoBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.85rem;
  color: var(--global-text);
  background-color: var(--global-div);
  border: 1px solid var(--primary-accent);
  border-radius: var(--global-border-radius);
  box-shadow: 0 4px 8px #0000004d;
`;

const UndoText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UndoButton = styled.button`
  flex-shrink: 0;
  padding: 0.4rem 0.9rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary-accent);
  cursor: pointer;
  background-color: var(--primary-accent-bg);
  border: 1px solid var(--primary-accent);
  border-radius: var(--global-border-radius);

  &:hover {
    color: var(--global-div);
    background-color: var(--primary-accent);
  }

  &:active {
    transform: scale(0.95);
  }
`;

/* ------------------------------------------------------------------ *
 * Card                                                                *
 * ------------------------------------------------------------------ */

interface HistoryCardProps {
  entry: WatchHistoryEntry;
  onRemove: (animeId: string) => void;
  /** Bulk-selection state (Aniraku Profile history rows — always-on). */
  selected: boolean;
  onToggleSelect: (animeId: string) => void;
}

const HistoryCard = ({
  entry,
  onRemove,
  selected,
  onToggleSelect,
}: HistoryCardProps) => {
  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove(entry.animeId);
  };

  const episodeNumber = entry.episode.number ?? 0;
  const lastWatchedLabel = relativeLastWatched(entry.lastWatched);
  const progressWidth = `min(100%, max(${Math.max(entry.playback.percentage, 5)}%, 3%))`;

  return (
    <VerticalCardShell $selected={selected}>
      <WrapperWithHover to={entry.watchPath} title={entry.displayTitle}>
        <CardImage src={entry.poster} alt={`Cover for ${entry.displayTitle}`} />
        <PlayButton aria-label='Play Episode'>
          <FaPlay />
        </PlayButton>
        <CardProgressBar>
          <FullProgressBar />
          <PlaybackProgressBar style={{ width: progressWidth }} />
        </CardProgressBar>
        <CardInfoTop>
          <CardRemoveButton
            type='button'
            onClick={handleRemove}
            title='Remove from history'
            aria-label='Remove from history'
          >
            <CardRemoveIcon aria-hidden={true} />
          </CardRemoveButton>
        </CardInfoTop>
        <CardInfoBottom>
          <CardLabel>EP {episodeNumber}</CardLabel>
          {lastWatchedLabel ? <CardLabel>{lastWatchedLabel}</CardLabel> : null}
        </CardInfoBottom>
      </WrapperWithHover>
      <CardSelectBox
        type='checkbox'
        checked={selected}
        onChange={() => onToggleSelect(entry.animeId)}
        aria-label={`Select ${entry.displayTitle}`}
      />
      <CardTitleBelow>
        <CardTitleText>{entry.displayTitle}</CardTitleText>
      </CardTitleBelow>
    </VerticalCardShell>
  );
};

/* ------------------------------------------------------------------ *
 * Page                                                                *
 * ------------------------------------------------------------------ */

const History = () => {
  const {
    entries,
    removeEntry,
    refresh,
    historyPaused,
    setHistoryPaused,
    order,
    setOrder,
  } = useWatchHistory();

  const [filter, setFilter] = useState('');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [emptyImageLoaded, setEmptyImageLoaded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lockRef = useRef(false);

  // Bulk operations (Aniraku Profile history tab port). Selection lives only
  // in this component — it resets automatically on route leave/unmount.
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [removeArmed, setRemoveArmed] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [undo, setUndo] = useState<UndoSnapshot | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const removeArmTimerRef = useRef<number | null>(null);
  const clearArmTimerRef = useRef<number | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const repushTimerRef = useRef<number | null>(null);

  // Live route sets `document.title = 'History · Aniraku'` (Wave B brand).
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'History · Aniraku';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const allItems = useMemo(() => {
    const filtered = entries.filter((entry) => matchesFilter(entry, filter));
    return filtered
      .map((entry) => ({ entry, fields: sortFieldsOf(entry) }))
      .sort((a, b) => compareBy(a.fields, b.fields, order, direction))
      .map(({ entry }) => entry);
  }, [entries, filter, order, direction]);

  // Reset paging whenever the result set changes shape (live does the same).
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, order, direction]);

  const hasMore = visibleCount < allItems.length;
  const visibleItems = useMemo(
    () => allItems.slice(0, visibleCount),
    [allItems, visibleCount],
  );
  const groupedItems = useMemo(
    () => (order === 'last-watched' ? groupByDate(visibleItems) : null),
    [order, visibleItems],
  );

  // --- Bulk selection derived state ------------------------------------
  const entryIdSet = useMemo(
    () => new Set(entries.map((entry) => entry.animeId)),
    [entries],
  );
  // Keep only selections whose entry still exists (removed elsewhere, etc.).
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (entryIdSet.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [entryIdSet]);
  const selectedAnimeIds = useMemo(
    () => [...selectedIds].filter((animeId) => entryIdSet.has(animeId)),
    [selectedIds, entryIdSet],
  );
  const selectedCount = selectedAnimeIds.length;
  const allSelected =
    allItems.length > 0 &&
    allItems.every((entry) => selectedIds.has(entry.animeId));
  const someSelected = allItems.some((entry) =>
    selectedIds.has(entry.animeId),
  );
  // React has no `indeterminate` prop — set the DOM property directly.
  useEffect(() => {
    const node = selectAllRef.current;
    if (node) node.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  // Clear confirm/undo timers on unmount (state resets with the component;
  // the server repush timer is intentionally left — it never touches state).
  useEffect(
    () => () => {
      if (removeArmTimerRef.current !== null) {
        window.clearTimeout(removeArmTimerRef.current);
      }
      if (clearArmTimerRef.current !== null) {
        window.clearTimeout(clearArmTimerRef.current);
      }
      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (observed) => {
        const inView = observed.some((item) => item.isIntersecting);
        if (inView && hasMore && !lockRef.current) {
          lockRef.current = true;
          setVisibleCount((count) =>
            Math.min(count + PAGE_SIZE, allItems.length),
          );
          requestAnimationFrame(() => {
            lockRef.current = false;
          });
        }
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, allItems.length]);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFilter(event.target.value.toLowerCase());
    },
    [],
  );

  const handleDirectionToggle = useCallback(() => {
    setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handlePauseChange = useCallback(() => {
    const next = !historyPaused;
    setHistoryPaused(next);
    setToast({
      id: Date.now(),
      message: next ? 'Watch history paused' : 'Watch history resumed',
    });
  }, [historyPaused, setHistoryPaused]);

  const handleRemove = useCallback(
    (animeId: string) => {
      removeEntry(animeId);
    },
    [removeEntry],
  );

  // --- Bulk operations --------------------------------------------------

  const armRemoveConfirm = useCallback(() => {
    if (removeArmTimerRef.current !== null) {
      window.clearTimeout(removeArmTimerRef.current);
    }
    setRemoveArmed(true);
    removeArmTimerRef.current = window.setTimeout(() => {
      removeArmTimerRef.current = null;
      setRemoveArmed(false);
    }, CONFIRM_REVERT_MS);
  }, []);

  const disarmRemoveConfirm = useCallback(() => {
    if (removeArmTimerRef.current !== null) {
      window.clearTimeout(removeArmTimerRef.current);
      removeArmTimerRef.current = null;
    }
    setRemoveArmed(false);
  }, []);

  const armClearConfirm = useCallback(() => {
    if (clearArmTimerRef.current !== null) {
      window.clearTimeout(clearArmTimerRef.current);
    }
    setClearArmed(true);
    clearArmTimerRef.current = window.setTimeout(() => {
      clearArmTimerRef.current = null;
      setClearArmed(false);
    }, CONFIRM_REVERT_MS);
  }, []);

  const disarmClearConfirm = useCallback(() => {
    if (clearArmTimerRef.current !== null) {
      window.clearTimeout(clearArmTimerRef.current);
      clearArmTimerRef.current = null;
    }
    setClearArmed(false);
  }, []);

  const showUndoBar = useCallback((snapshot: UndoSnapshot) => {
    setUndo(snapshot);
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = window.setTimeout(() => {
      undoTimerRef.current = null;
      setUndo(null);
    }, UNDO_WINDOW_MS);
  }, []);

  /**
   * After an Undo restores localStorage, force the mirrored `watch_history`
   * rows back to the server: the removal already deleted them server-side
   * (and called forgetSyncedAnime), so re-forget the fingerprints after a
   * short grace period (lets the in-flight delete land) and flush — the
   * existing sync engine treats them as changed and re-upserts.
   */
  const scheduleServerRepush = useCallback((animeIds: string[]) => {
    if (!animeIds.length) return;
    if (repushTimerRef.current !== null) {
      window.clearTimeout(repushTimerRef.current);
    }
    repushTimerRef.current = window.setTimeout(() => {
      repushTimerRef.current = null;
      for (const animeId of animeIds) forgetSyncedAnime(animeId);
      getSessionUserId()
        .then((userId) => (userId ? publishHistoryNow(userId) : undefined))
        .catch(() => {
          // offline / unconfigured — local restore already applied; the next
          // session's merge-on-login uploads the local-only rows anyway
        });
    }, UNDO_REPUSH_DELAY_MS);
  }, []);

  const handleSelectAllToggle = useCallback(() => {
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(allItems.map((entry) => entry.animeId)),
    );
  }, [allSelected, allItems]);

  const handleToggleSelect = useCallback((animeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(animeId)) {
        next.delete(animeId);
      } else {
        next.add(animeId);
      }
      return next;
    });
  }, []);

  /** Two-step confirm (armed label → executes on second click). */
  const handleBulkRemove = useCallback(() => {
    if (selectedAnimeIds.length === 0) return;
    if (!removeArmed) {
      armRemoveConfirm();
      return;
    }
    disarmRemoveConfirm();

    // Snapshot the exact `watched-episodes` slice being removed BEFORE the
    // removal (removeEntry is the page's own persistence path: local write +
    // forgetSyncedAnime + server `watch_history` delete per anime).
    const watched = readLocalJSON<WatchedMap>(
      LOCAL_STORAGE_KEYS.WATCHED_EPISODES,
      {},
    );
    const snapshot: WatchedMap = {};
    for (const animeId of selectedAnimeIds) {
      const episodes = watched[animeId];
      if (episodes) snapshot[animeId] = episodes;
    }
    for (const animeId of selectedAnimeIds) removeEntry(animeId);
    setSelectedIds(new Set());
    showUndoBar({
      kind: 'bulk',
      count: selectedAnimeIds.length,
      watched: snapshot,
    });
  }, [
    selectedAnimeIds,
    removeArmed,
    armRemoveConfirm,
    disarmRemoveConfirm,
    removeEntry,
    showUndoBar,
  ]);

  /** Two-step confirm (red armed label → clears everything on 2nd click). */
  const handleClear = useCallback(async () => {
    if (clearing) return;
    if (!clearArmed) {
      armClearConfirm();
      return;
    }
    disarmClearConfirm();
    setClearing(true);
    try {
      // Snapshot all three native history keys raw, then clear through the
      // same layer Settings uses (`clearWatchHistory`: local keys + every
      // server `watch_history` row for the session user).
      const snapshot: UndoSnapshot = {
        kind: 'clear',
        count: entries.length,
        raw: {
          watched: localStorage.getItem(LOCAL_STORAGE_KEYS.WATCHED_EPISODES),
          visited: localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_ANIME_VISITED),
          playback: localStorage.getItem(LOCAL_STORAGE_KEYS.EPISODE_PLAYBACK),
        },
      };
      const userId = await getSessionUserId();
      await clearWatchHistory({ userId });
      refresh();
      setSelectedIds(new Set());
      if (snapshot.count > 0) showUndoBar(snapshot);
    } catch {
      // clearWatchHistory already swallows storage/server failures
    } finally {
      setClearing(false);
    }
  }, [clearArmed, clearing, armClearConfirm, disarmClearConfirm, entries.length, refresh, showUndoBar]);

  /** Page-local Undo: re-write the snapshot through the same keys. */
  const handleUndo = useCallback(() => {
    if (!undo) return;
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndo(null);

    if (undo.kind === 'bulk') {
      const watched = readLocalJSON<WatchedMap>(
        LOCAL_STORAGE_KEYS.WATCHED_EPISODES,
        {},
      );
      for (const [animeId, episodes] of Object.entries(undo.watched)) {
        watched[animeId] = episodes;
      }
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.WATCHED_EPISODES,
          JSON.stringify(watched),
        );
      } catch {
        // storage unavailable — restore simply isn't persisted
      }
      refresh();
      publishWatchHistory({ type: 'upsert', keys: [] });
      scheduleServerRepush(Object.keys(undo.watched));
      return;
    }

    const { raw } = undo;
    try {
      if (raw.watched !== null) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.WATCHED_EPISODES, raw.watched);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.WATCHED_EPISODES);
      }
      if (raw.visited !== null) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_ANIME_VISITED, raw.visited);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_ANIME_VISITED);
      }
      if (raw.playback !== null) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.EPISODE_PLAYBACK, raw.playback);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.EPISODE_PLAYBACK);
      }
    } catch {
      // storage unavailable — restore simply isn't persisted
    }
    refresh();
    publishWatchHistory({ type: 'upsert', keys: [] });
    const restored = readLocalJSON<WatchedMap>(
      LOCAL_STORAGE_KEYS.WATCHED_EPISODES,
      {},
    );
    scheduleServerRepush(Object.keys(restored));
  }, [undo, refresh, scheduleServerRepush]);

  return (
    <PageContainer>
      <VisuallyHiddenHeading>Watch History</VisuallyHiddenHeading>
      <TwoColumnLayout>
        <MainColumn>
          <ContentContainer>
            {undo ? (
              <UndoBar role='status' aria-live='polite'>
                <UndoText>Removed {undo.count} items —</UndoText>
                <UndoButton
                  type='button'
                  onClick={handleUndo}
                  aria-label={`Undo: restore ${undo.count} removed history items`}
                >
                  Undo
                </UndoButton>
              </UndoBar>
            ) : null}
            {allItems.length > 0 ? (
              <BulkToolbar>
                <BulkSelectLabel>
                  <BulkCheckbox
                    ref={selectAllRef}
                    type='checkbox'
                    checked={allSelected}
                    onChange={handleSelectAllToggle}
                    aria-label='Select all Watch History entries'
                  />
                  <span>Select all</span>
                </BulkSelectLabel>
                <BulkActions>
                  {selectedCount > 0 ? (
                    <BulkButton
                      type='button'
                      $danger
                      $armed={removeArmed}
                      onClick={handleBulkRemove}
                      disabled={clearing}
                      aria-label={`Remove selected (${selectedCount}) history entries`}
                    >
                      {removeArmed
                        ? `Yes, remove ${selectedCount} — click again`
                        : `Remove selected (${selectedCount})`}
                    </BulkButton>
                  ) : null}
                  <BulkButton
                    type='button'
                    $danger
                    $armed={clearArmed}
                    onClick={handleClear}
                    disabled={clearing}
                    aria-label='Clear History'
                  >
                    {clearArmed
                      ? 'Yes, clear everything — click again'
                      : 'Clear History'}
                  </BulkButton>
                </BulkActions>
              </BulkToolbar>
            ) : null}
            {allItems.length === 0 ? (
              <LoadingContainer>
                <PromptWrapper>
                  <EmptyState>
                    <EmptyLabel>Nothing to see ...</EmptyLabel>
                    <EmptyStateImage
                      src='/assets/wotah-CPaFDXZ8.webp'
                      alt='running water'
                      loading='lazy'
                      decoding='async'
                      data-loaded={emptyImageLoaded ? 'true' : 'false'}
                      onLoad={() => setEmptyImageLoaded(true)}
                    />
                  </EmptyState>
                </PromptWrapper>
              </LoadingContainer>
            ) : groupedItems ? (
              <ListContainer>
                {Array.from(groupedItems.entries()).map(([label, group]) => (
                  <DateGroupSection key={label}>
                    <DateGroupHeader>
                      <DateGroupTitle>{label}</DateGroupTitle>
                      <DateGroupSubtitle>{group.length}</DateGroupSubtitle>
                    </DateGroupHeader>
                    <CardGrid>
                      {group.map((entry) => (
                        <HistoryCard
                          key={entry.id}
                          entry={entry}
                          onRemove={handleRemove}
                          selected={selectedIds.has(entry.animeId)}
                          onToggleSelect={handleToggleSelect}
                        />
                      ))}
                    </CardGrid>
                  </DateGroupSection>
                ))}
              </ListContainer>
            ) : (
              <CardGrid>
                {visibleItems.map((entry) => (
                  <HistoryCard
                    key={entry.id}
                    entry={entry}
                    onRemove={handleRemove}
                    selected={selectedIds.has(entry.animeId)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </CardGrid>
            )}
          </ContentContainer>
          {hasMore ? <Sentinel ref={sentinelRef} /> : null}
          {allItems.length > 0 ? (
            <ItemCount>
              Showing {Math.min(visibleCount, allItems.length)} of{' '}
              {allItems.length}
            </ItemCount>
          ) : null}
        </MainColumn>

        <SideColumn>
          <SidePanel>
            <SidePanelSection>
              <SortRow>
                <SortSelect
                  value={order}
                  onChange={(event) => setOrder(event.target.value as SortValue)}
                  aria-label='Sort'
                >
                  <optgroup label='Sort'>
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                </SortSelect>
                <DirectionButton
                  type='button'
                  onClick={handleDirectionToggle}
                  title={direction === 'asc' ? 'Ascending' : 'Descending'}
                  aria-label={direction === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {direction === 'asc' ? <IoArrowUp /> : <IoArrowDown />}
                </DirectionButton>
              </SortRow>
              <PauseRow>
                <PauseLabel>Pause history</PauseLabel>
                <SwitchButton
                  type='button'
                  role='switch'
                  aria-checked={historyPaused}
                  aria-label='Pause history'
                  onClick={handlePauseChange}
                >
                  <SwitchTrack $checked={historyPaused}>
                    <SwitchThumb $checked={historyPaused} />
                  </SwitchTrack>
                </SwitchButton>
              </PauseRow>
            </SidePanelSection>
            <SearchInput
              type='text'
              placeholder='Search history'
              value={filter}
              onChange={handleFilterChange}
            />
            <HelpSection>
              <HelpToggle>What's all this?</HelpToggle>
              <HelpContent>
                <HelpBlock>
                  <span>
                    <strong>Local</strong> browser watch history, tracked
                    automatically as you watch.
                  </span>
                </HelpBlock>
                <HelpBlock>
                  <span>
                    Use the dropdown to sort by{' '}
                    <strong>last watched</strong>, <strong>A-Z</strong>,{' '}
                    <strong>progress</strong>, or <strong>air date</strong>.
                  </span>
                  <span>
                    <IoArrowUp />
                    <IoArrowDown /> Toggle between ascending and descending
                    order.
                  </span>
                </HelpBlock>
                <HelpBlock>
                  <span>
                    <strong>Pause history</strong> temporarily stops recording
                    local watch history.
                  </span>
                </HelpBlock>
                <HelpBlock>
                  <span>
                    <strong>Search history</strong> by anime title.
                  </span>
                </HelpBlock>
                <HelpBlock>
                  <span>
                    Tick a card's checkbox (or <strong>Select all</strong>)
                    to pick entries, then <strong>Remove selected</strong> or{' '}
                    <strong>Clear History</strong> — both ask once more
                    before doing anything, and offer <strong>Undo</strong>{' '}
                    right after.
                  </span>
                </HelpBlock>
              </HelpContent>
            </HelpSection>
          </SidePanel>
        </SideColumn>
      </TwoColumnLayout>
      {toast ? (
        <Toast key={toast.id} role='status'>
          {toast.message}
        </Toast>
      ) : null}
    </PageContainer>
  );
};

export default History;
