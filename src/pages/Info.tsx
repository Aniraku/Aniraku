import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import {
  FaPlay,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaTh,
  FaImage,
  FaUsers,
  FaEye,
  FaEyeSlash,
  FaMicrophone,
  FaBookmark,
  FaRegBookmark,
  FaStar,
} from 'react-icons/fa';
import { SiAnilist, SiMyanimelist } from 'react-icons/si';
import {
  SkeletonPlayer,
  SkeletonCard,
  StyledCardGrid,
  CardItem,
  fetchAnimeData,
  fetchAnimeEpisodes,
  Episode,
  Anime,
  Character,
  Tag,
  ExternalLink,
} from '../index';
import InfoComments from '../components/Info/Comments';
import { showToast } from '../components/Toaster';
import { useBookmarks } from '../hooks/useBookmarks';
// NSFW gate (Wave C) — Aniraku AnimeDetail.jsx:632/658/878: Hentai titles
// gate the page when OFF (default) and recommendations run through
// filterAdult. Sync payloads stay unfiltered (user decision).
import { filterAdult, isNsfw, useNsfw } from '../hooks/useNsfw';
// Episode ratings (Wave C) — Aniraku AnimeDetail.jsx:748-758 fetch + the
// per-episode RatingBadge (AnimeDetail.jsx:224/1070) in the episode grid.
// Session id comes from lib/sync's bridge (no auth-hook import — cross-wave
// rule, same as useNsfw/lib consumers).
import { getSessionUserId } from '../lib/sync';
import {
  EPISODE_RATINGS_LS_KEY,
  fetchEpisodeRatings,
} from '../lib/episodeRatings';
// Runtime SEO (SEO layer) — old setAnimeDetailSEO (seo.js:108) via the
// shared helper: title/desc/keywords/og/twitter/canonical/JSON-LD + cleanup.
import { SITE_URL, useSeo } from '../utils/seo';
import { infoPathFor } from '../utils/animePaths';

// ---------------------------------------------------------------------------
// Info page — the live site 1:1, hydrated tabbed rebuild.
//
// Structure follows the live InfoRoute `zt` layout:
//   banner → infoDataWrapper (side column: poster + details `ht` rows |
//   main column: h1 + stat chips + tab bar + section panel) → related/
//   recommendations → The Anime Community comments.
//
// Tabs follow live `st = e => e === 'watch' ? ot : B` with
// `ot = [Overview, Characters, Artwork, Episodes]` (accessMode defaults to
// 'watch'). The active section is persisted per media id in the
// `aniraku:navigation` record under `infoSection` (live INFO_SECTION key
// `aniraku:navigation:info-section`, legacy standalone key migrated).
//
// Overview = the trailer box only (double-details fix: the details block
// that used to sit below it is gone — ONE details copy per breakpoint: the
// click-to-reveal hero card ≤950, the sidebar rows ≥951). Genres/Tags live
// only as sidebar genreTag pills (live's visible copy) and Related/
// Recommendations render as the always-on `ulm8c` drag lists below the
// two-column block. Characters/Artwork/Episodes are the live tab bodies.
//
// Link targets use the live links chunk verbatim (`slugify`/`pickTitle`/
// `watchPathFor` = Q/$/At). Supplementary AniList GraphQL
// fills tags / source / bannerImage / characters + voiceActors that
// MEDIA_DETAIL_QUERY drops.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Live link helpers (links-DAv5tLmw.js) — verbatim behavior
// ---------------------------------------------------------------------------

// live Q(e) — slugify (NFD-strip → lowercase → strip non-slug → spaces to '-').
const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

interface LinkableTitle {
  english?: string | null;
  romaji?: string | null;
  native?: string | null;
  userPreferred?: string | null;
}

// live $(title, id) — shortest of trimmed [english, romaji], else native,
// else String(id).
const pickTitle = (title: LinkableTitle | undefined, fallbackId: string): string => {
  const candidates = [title?.english, title?.romaji]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  if (candidates.length > 0) {
    return [...candidates].sort((a, b) => a.length - b.length)[0];
  }
  return title?.native ?? String(fallbackId);
};

interface Linkable {
  id: string | number;
  title?: LinkableTitle;
}

// live At(media, ep?) — /watch/{id}/{slug} (+ ?ep= only when ep != null).
const watchPathFor = (item: Linkable, episode?: number | null): string => {
  const id = String(item.id);
  const slug = slugify(pickTitle(item.title, id));
  const base =
    slug && slug !== id
      ? `/watch/${item.id}/${slug}`
      : `/watch/${item.id}`;
  return episode == null ? base : `${base}?ep=${episode}`;
};

// SSR query values space-encode as '+' (e.g. ?genres=Slice+of+Life).
const plusEncode = (value: string): string =>
  encodeURIComponent(value).replace(/%20/g, '+');

// ---------------------------------------------------------------------------
// Sanitizers / labels (live tt / nt / Qe equivalents)
// ---------------------------------------------------------------------------

const sanitizeText = (html: string): string =>
  typeof html === 'string'
    ? html.replace(/<[^>]+>/g, '').replace(/\([^)]*\)/g, '')
    : '';

const metaDescription = (html: string): string => {
  const text = sanitizeText(html).replace(/\s+/g, ' ').trim();
  return text.length > 154 ? `${text.slice(0, 154)}…` : text;
};

// Display title for h1 / document.title / og:title (English || Romaji || Native).
const displayTitle = (anime: Anime): string =>
  anime.title?.english ||
  anime.title?.romaji ||
  anime.title?.native ||
  'No Title';

const capitalize = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';

// live Qe(): known statuses -> live labels, otherwise the raw value.
const displayStatus = (status?: string): string => {
  switch (status) {
    case 'Ongoing':
      return 'Airing';
    case 'Completed':
      return 'Finished';
    case 'Not yet aired':
      return 'Not Yet Released';
    case 'Cancelled':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
};

// Consumet-style status -> AniList enum for /search?status= links.
const STATUS_PARAMS: Record<string, string> = {
  Ongoing: 'RELEASING',
  Completed: 'FINISHED',
  'Not yet aired': 'NOT_YET_RELEASED',
  Cancelled: 'CANCELLED',
  Hiatus: 'HIATUS',
};

const COUNTRY_NAMES: Record<string, string> = {
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  SG: 'Singapore',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
  MY: 'Malaysia',
  ID: 'Indonesia',
  IN: 'India',
  FR: 'France',
  DE: 'Germany',
  IT: 'Italy',
  ES: 'Spain',
  GB: 'United Kingdom',
  RU: 'Russia',
  US: 'United States',
  CA: 'Canada',
  BR: 'Brazil',
  AU: 'Australia',
};

const countryName = (code: string): string => COUNTRY_NAMES[code] || code;

// live genreTag component custom properties (`Ze` in the live chunk).
const genreTagVars = (color: string): React.CSSProperties =>
  ({
    '--genre-tag-bg': color || 'grey',
    '--genre-tag-color': `color-mix(in srgb, ${color || 'grey'}, black 55%)`,
    '--genre-tag-hover-color': `color-mix(in srgb, ${color || 'grey'}, black 70%)`,
  }) as React.CSSProperties;

// Link text uses the display title (english-first), unlike slug pickTitle.
const listTitleOf = (title: LinkableTitle): string =>
  title.english || title.romaji || title.userPreferred || title.native || 'No Title';

// Relation/Recommendation node → CardItem's Anime shape for the `ulm8c` drag
// lists. The relations GraphQL (useApi, read-only) has no releaseDate, so the
// card year renders '?' (flagged); episodes maps onto totalEpisodes.
const toCardAnime = (
  item:
    | NonNullable<Anime['relations']>[number]
    | NonNullable<Anime['recommendations']>[number],
): Anime =>
  ({
    ...item,
    totalEpisodes: (item as { episodes?: number }).episodes ?? 0,
  }) as unknown as Anime;

// live ut(): YouTube search URL for the trailer fallback.
const trailerSearchUrl = (anime: Anime): string | null => {
  const title =
    anime.title?.english || anime.title?.romaji || anime.title?.native;
  if (!title) return null;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${title} ${anime.startDate?.year || ''} anime trailer`,
  )}`;
};

// (upsertMeta removed with the manual SEO effect — utils/seo.ts owns every
// meta tag now.)
// ---------------------------------------------------------------------------
// Tab set + per-media persistence (live `st` / INFO_SECTION record)
// ---------------------------------------------------------------------------

type InfoTab = 'Overview' | 'Characters' | 'Artwork' | 'Episodes';

// live `ot = [...B, 'Episodes']` gated by `st = e => e === 'watch' ? ot : B`
// with accessMode defaulting to `watch` → the four hydrated tabs, in order.
const INFO_TABS: InfoTab[] = ['Overview', 'Characters', 'Artwork', 'Episodes'];

// live `c.INFO_SECTION` = `${c.NAVIGATION}:info-section`, stored through the
// record map as `localStorage['aniraku:navigation'].infoSection[mediaId]`.
const NAVIGATION_KEY = 'aniraku:navigation';
const LEGACY_INFO_SECTION_KEY = 'aniraku:navigation:info-section';

const isInfoTab = (value: unknown): value is InfoTab =>
  typeof value === 'string' && (INFO_TABS as string[]).includes(value);

const readInfoSection = (mediaId: string): InfoTab => {
  try {
    const raw = localStorage.getItem(NAVIGATION_KEY);
    if (raw) {
      const record = JSON.parse(raw);
      const stored = record?.infoSection?.[mediaId];
      if (isInfoTab(stored)) return stored;
    }
    const legacyRaw = localStorage.getItem(LEGACY_INFO_SECTION_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const stored = legacy?.[mediaId];
      if (isInfoTab(stored)) return stored;
    }
  } catch {
    // corrupted / unavailable storage → Overview
  }
  return 'Overview';
};

const writeInfoSection = (mediaId: string, section: InfoTab): void => {
  try {
    let record: Record<string, unknown> = {};
    try {
      record = JSON.parse(localStorage.getItem(NAVIGATION_KEY) || '{}') || {};
    } catch {
      record = {};
    }
    const existing =
      record.infoSection && typeof record.infoSection === 'object'
        ? (record.infoSection as Record<string, unknown>)
        : {};
    record.infoSection = { ...existing, [mediaId]: section };
    localStorage.setItem(NAVIGATION_KEY, JSON.stringify(record));
  } catch {
    // storage unavailable → in-memory state still applies
  }
};

// ---------------------------------------------------------------------------
// Sidebar / artwork / episode-toolbar helpers (live `ht` `Tt` `Sg` `Nt`,
// Watch EpisodeList `listLayout-[{animeId}]`)
// ---------------------------------------------------------------------------

// live settings default `langTitle: 'English'` (SettingsProvider not required
// on this page — read the persisted record like Comments does).
const readLangTitle = (): string => {
  try {
    const raw = localStorage.getItem('aniraku:settings');
    if (!raw) return 'English';
    const value = JSON.parse(raw)?.settings?.langTitle;
    return typeof value === 'string' && value ? value : 'English';
  } catch {
    return 'English';
  }
};

// live `U({month, day, year})` — month name + `d,` + year, in that order.
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatDateValue = (
  date:
    | { month?: number | null; day?: number | null; year?: number | null }
    | undefined,
): string | null => {
  if (!date) return null;
  const parts: string[] = [];
  if (date.month) {
    const month = MONTH_NAMES[date.month - 1];
    if (month) parts.push(month);
  }
  if (date.day) parts.push(`${date.day},`);
  if (date.year) parts.push(String(date.year));
  const text = parts.join(' ');
  return text || null;
};

const startDateSearchPath = (year: number): string =>
  `/search?startDate_like=${encodeURIComponent(String(year))}%25` +
  '&sort=POPULARITY_DESC&type=ANIME';

// live `Tt(title, langTitle)` — title-variant rows minus the preferred one.
type VariantRow = { label: string; value: string };

const titleVariantRows = (
  title: Anime['title'] | undefined,
  preferred: string,
): VariantRow[] => {
  if (!title) return [];
  const excluded =
    preferred === 'Romaji' ? 'romaji' : preferred === 'Native' ? 'native' : 'english';
  return [
    { key: 'english', label: 'English', value: title.english },
    { key: 'romaji', label: 'Romaji', value: title.romaji },
    { key: 'native', label: 'Native', value: title.native },
  ]
    .filter((row) => row.key !== excluded && !!row.value)
    .map((row) => ({ label: row.label, value: row.value }));
};

// live `Sg(updatedAt)` — unix seconds → "YYYY-MM-DD HH:MM:SS".
const formatLastUpdate = (seconds: number | undefined | null): string | null => {
  if (!seconds) return null;
  try {
    return new Date(seconds * 1e3).toISOString().replace('T', ' ').split('.')[0];
  } catch {
    return null;
  }
};

// live `Nt` artwork category labels.
const ARTWORK_LABELS: Record<string, string> = {
  all: 'All',
  background: 'Backgrounds',
  banner: 'Banners',
  cinemagraph: 'Cinemagraphs',
  clearart: 'Clear Arts',
  clearlogo: 'Clear Logos',
  icon: 'Icons',
  poster: 'Posters',
  other: 'Others',
};

type ArtworkItem = { img: string; type: string };

// Live artwork comes from `tvdbArtwork` via the site's own
// `anilist.merged(id)` backend (see info-BnlMMjW_.js error string) — not
// reachable from this client. Flatten what we DO have into the same
// `{img, type}` shape live's `Pt` renders.
const collectArtwork = (
  animeInfo: Anime,
  bannerImage: string | null | undefined,
): ArtworkItem[] => {
  const items: ArtworkItem[] = [];
  const seen = new Set<string>();
  const push = (img: string | null | undefined, type: string) => {
    if (!img || seen.has(img)) return;
    seen.add(img);
    items.push({ img, type: ARTWORK_LABELS[type] ? type : 'other' });
  };
  for (const entry of animeInfo.artwork || []) {
    push(entry.img, entry.type);
  }
  push(bannerImage, 'banner');
  push(animeInfo.cover, 'background');
  push(animeInfo.image, 'poster');
  return items;
};

// Watch EpisodeList layout preference (read-only reference): list ⇄ grid ⇄
// imageList, persisted per media id. Returns the stored mode or null so the
// caller can fall back to EpisodeList's own default heuristic once episodes
// have loaded (`episodes.every(e => e.title) ? 'list' : 'grid'`).
type EpisodeMode = 'list' | 'grid' | 'imageList';

const readListLayout = (mediaId: string | undefined): EpisodeMode | null => {
  if (!mediaId) return null;
  try {
    const stored = localStorage.getItem(`listLayout-[${mediaId}]`);
    if (stored === 'list' || stored === 'grid' || stored === 'imageList') {
      return stored;
    }
  } catch {
    // storage unavailable
  }
  return null;
};

// live `qt` cycle: grid→list, list→imageList, imageList→grid — i.e.
// list → imageList → grid → list.
const nextListLayout = (mode: EpisodeMode): EpisodeMode =>
  mode === 'list' ? 'imageList' : mode === 'imageList' ? 'grid' : 'list';

// live `$t` default-mode memo `C` (its `loading ||` arm collapses to the
// length===1 case here — this tab only renders with loaded episodes).
const episodeHeuristic = (episodes: Episode[]): EpisodeMode => {
  const images = new Set(episodes.map((episode) => episode.image));
  const titles = new Set(episodes.map((episode) => episode.title));
  if (episodes.length === 1) return 'imageList';
  if (episodes.length > 26) return 'grid';
  if (images.size > 1) return 'imageList';
  if (titles.size > 1) return 'list';
  return 'grid';
};

// live airDate formatter (index chunk `Ag`) — verbatim semantics.
const formatAirDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
};

// live `Yt(isSelected, isWatched, filler)` → the root's CSS-var bag (applied
// as inline style). Info never renders the selected state (no episodeId on
// this route) — the branch is kept for declaration parity (flagged).
const episodeVars = (
  isSelected: boolean,
  isWatched: boolean,
  isFiller: boolean,
  row: boolean,
  mode: EpisodeMode,
): React.CSSProperties => {
  const state = isSelected
    ? {
        backgroundColor: isWatched
          ? 'var(--primary-accent)'
          : 'var(--primary-accent-bg)',
        color: 'white',
        outline: isFiller
          ? '1px solid #FFC171'
          : '1px solid var(--primary-accent-bg)',
        hoverFilter: 'brightness(1.1)',
        descriptionColor: 'var(--primary-accent-bg)',
        descriptionFilter: 'brightness(0.5)',
      }
    : isWatched
      ? {
          backgroundColor: 'var(--primary-accent-bg)',
          color: 'var(--primary-accent)',
          outline: '1px solid var(--primary-accent)',
          hoverFilter: 'brightness(1.1)',
          descriptionColor: 'var(--primary-accent)',
          descriptionFilter: 'brightness(0.8)',
        }
      : isFiller
        ? {
            backgroundColor: '#B9986D',
            color: '#FFFFFF90',
            outline: '1px solid #FFC171',
            hoverFilter: 'brightness(1.2)',
            descriptionColor: '#4E5334',
            descriptionFilter: 'brightness(0)',
          }
        : {
            backgroundColor: 'var(--global-div)',
            color: 'var(--global-text-muted)',
            outline: '1px solid var(--global-border-color)',
            hoverFilter: 'brightness(1.05)',
            descriptionColor: 'var(--global-text-muted)',
            descriptionFilter: 'none',
          };
  return {
    '--episode-item-background': state.backgroundColor,
    '--episode-item-color': state.color,
    '--episode-item-outline': row ? state.outline : 'none',
    '--episode-item-padding':
      mode === 'imageList' ? '0' : row ? '0.5rem' : '0.4rem 0',
    '--episode-item-text-align': row ? 'left' : 'center',
    '--episode-item-hover-filter': state.hoverFilter,
    '--episode-description-color': state.descriptionColor,
    '--episode-description-filter': state.descriptionFilter,
  } as React.CSSProperties;
};

// Live icon-factory glyphs with no exact react-icons match — paths verbatim
// from the live chunks (links `oe` list-mode, bi `f` CC badge, Seasons `Jt`
// filler tag).
const ListModeIcon: React.FC<{ size?: string }> = ({ size = '1rem' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 512 512'
    fill='currentColor'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M149.333 216v80c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24v-80c0-13.255 10.745-24 24-24h101.333c13.255 0 24 10.745 24 24zM0 376v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H24c-13.255 0-24 10.745-24 24zM125.333 32H24C10.745 32 0 42.745 0 56v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24V56c0-13.255-10.745-24-24-24zm80 448H488c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24zm-24-424v80c0 13.255 10.745 24 24 24H488c13.255 0 24-10.745 24-24V56c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24zm24 264H488c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24z' />
  </svg>
);

const CcMetaIcon: React.FC<{ size?: string }> = ({ size = '0.9rem' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='currentColor'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M20 4H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zm-9 6H8v4h3v2H8c-1.103 0-2-.897-2-2v-4c0-1.103.897-2 2-2h3v2zm7 0h-3v4h3v2h-3c-1.103 0-2-.897-2-2v-4c0-1.103.897-2 2-2h3v2z' />
  </svg>
);

const FillerTagIcon: React.FC<{ size?: string }> = ({ size = '0.9rem' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 16 16'
    fill='currentColor'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z' />
  </svg>
);

// ---------------------------------------------------------------------------
// Live no-image placeholders (no_image_banner chunk + InfoRoute inline poster)
// ---------------------------------------------------------------------------

const BANNER_PLACEHOLDER =
  'data:image/webp;base64,UklGRvYIAABXRUJQVlA4WAoAAAAIAAAAbwMA7QEAVlA4TGQIAAAvb0N7AA9wlZmbnDxpaf5jCXYmYHIkS+m+jhd1AmjrArMt7LOw+7m4BKfVD0D8AdWFNuEfgKk94b5Gu1qr9k7ftXcVXL/KiO3ML3Mms9CwEf2nxUiSEFcKSyUxb2cPMAwwDPi+u8Z+bv1367//HffVJ5pyl2hqyUFEQ8xf1Rv0GFOJXpQy3ZhD2omIIaJFKifqo+p1lUkRFQxNs8mokQQSNm6JLFe0WIWjPqhRnahCilgsZDSRSRiDxqTFKs1BzZpdWoIj8En5wZgWLSowxEQaAlJQPZaRsQUrMgUktosMbMgckNwuqskSGEkFoaBGsZ8b9DFNuPiAhqDwRIVSTDNG0BjOy2ybh3Js+4WmmAhasTmoHtmwJZytMYXvz8jOvPhB3ogFjaS705WYdgys5AX8amMakUM2apFNkGyXa8gG+mWFXLgHzl8lEzNmFdhuU8xYENB0rayBjhmEgGY5x6ctW2S9IoGThylmMQ3SyvbuuHYz8VVzUEkhLrtasKHj23YKWjyq5I6+BI0Jm+ObpR3tAPkfhkUFGrGgCBv/4eiFAg+mNaCX5TVbI/ZGJQmeBB2BjWZ9UFPljkbM9ghabSEUfQNBuLgRpC5ZaSGCT7wMtFPtbRwNTLzVWLzUWLWfNuaL+kTwaskcNWKYJHyki6heFFE1dD6UDmSHKOpE0WKMbofRrkxRi7cbrVztSNbrRgopW4WN9Ybpev8UsrhTBe/LGCRtIykhsaiaviXgcFAj9nhtTCFSevPiKjYjb8Lixk7UUC/soJDb5BYTi01D6L5xTCtS5VcdMfvqmaxK4PZHyOIz9Ds6KzExJzoVgbtVQVWgyF7ZmDbMcJFM8e5pcgewaYJGoUbu1+6S9c53VLvVFA/fmTcgK2IWYx2WolZbkYpFjUytjKK5UB9VR9bRT2FVYIeNSmBgFW5NOBoZkfeyUFoZbSgZR1IGJbfJTv2qIa4NRUHf1YQ9PHm92MjI5aR2XIDvisw24jz62H19NH1kFcUuPxnQJh0NPQUBOkGVfxhDK+ehRpkcok7cOf3sLXpMWtmTOY09dfSIWdA1fa9r6eflF/uusZ9b/93y5PE7TSlETb201HmQxN3HH2e/ki9/6PH3g6EQH3v8Uek7f3zi1/ooS5K+9o1vPPHRZz/83T8886jDKK4Fjk2YJXUsS1YG7tTrD8Ldzt+I+K/YDXA2+TJZXHWEmqqqem1IBlr799GoQI/opUtCDpRznygQIVmzyiGHfuDEgCx4sZLlaXrX4lFC63G2KnKoaIhqyU77JHz7jd9EQVbdCD+pfJB8Y7Q8W7cpMhqZ6hU7Bt9pY7QiavHkUW0ym9SaYL7uO+7nyA7tLGBNWdF7P980i8QC1lQqHr4xm0JZhAp5F8ORvFBR4OcFPONqMubZPmsO6CCtsUa/sgBHOrrYhnmGpuoI7eZosZyLX2ZtPGcIKVIgyhkPjoKxcC4ezHrRqESppsgY4ajB9nNKZj0GZ4Wc4nKDoQmjzrn4ZXCQWaGMIyuPw3kXaxZFUhaZHxQ9ixWbJQbZYIJHUscQMekHtxUFeBKUrcrkXnwV8E0Lvf4KCZeYzUbt/GEF57GIS/GiH0o3BVi94BzdOy6hvKy0zp1LwPPXgh4Phna87RXUmoy+AdYeOriZHEjyIwOoplDPJfYBWDyLqbea1aP73b5zrXaBIoKDXTS+1RRksRgEiQFAi3FfzoXlESdyDfG8qcmCujWiRLFbwKLgB6rcq23SKoBNRD4MlJkIkdAj/xZLwdFp1Rw/Im2qWfZOZauFPbHm9JFJRTdYXIJcyRlYBBxodgzXyIPTxAxmAJhk79RqUX0krHCoN2qDZvuE036+qFhgcUI6JLFgI5szqPz1e49/9J17KUIxmazQhFZkcoxrQityVFy/WG5mFdqk8eLovaKXL3pCM5VPpnAulrNLxpBzGKPYbpcxxSqGsoIttyQXTQgRySCxGwWWYPu5YxsmrFg5g4ka4yU2NXzssFi0j/C1G3LPX0zhuJ9jIlSmVsV3P39ZnI3vV3DEKLapoMWWxx7/FlMrns3whH9AxapHcfgXw+saBTqLkDex4oRwmIhQORZDsv8Mg3/xC7Yq/vGO0vMIluuAYPi1z0l7u/I9iK00VZgj3dvipd8a5RLPMvHkBx7ovn7lN7JoviKt2quQTjD8r/dfEu2YyYiuUsvH3/e3cz93viZGvmSSlCvwLUb8VHsRfbfBMEj+V6k/hIHBNZgixRfFb0sHDwMjmlnnvkPki6A/VnOgHlL/2NCbowc70Pe1exeLRpj77EXmKLGj+DR4kSFsr+ULoJQ4fA0VmM0InHGO/l+UuGyyKLcGD0uxy9iPQ3OYDEyMagPvyrbbSH4VxdjPE7Lo9/mkib3/FcY3v3H++HykoDBZlZWbtLtVLh/hNzwuAO5Wmbjs57uGtDumWR4X0HmsbwzcaoRuFReKEnz7y5f6K7mT7TPft6Qsgb+op8xIgLjYocyIzz3NHRevl0i6PkDwEXHSqiuKANUycxdbiL4t7fptfXKObIgFHNhUi3ov+urVQAzSBo544M4IXokBijurXURWBKjGT/pXYT/nXsYEoSOed9RThuYO9j51igDV+EkAO66C1Y1XboWNijpGzicOaQYDEJXNFHKOwkM3IvCrwN0y52Av3rNYTRcknRo+1Q5Anj8y+I3LSq9RgJh5F4lRh5aKcyxm9huo+wcjzRghBi5DA7y/qHWoBdjP0zkXk0XHKBX7EKEhizXWiPPTCIh1p8wBGE0fI9YL4Q7fEMVGaMuBt9BixPnZxPdzeadbtYp/8SgGsz0AHfvjyGIdwdHFdXlWrEaxl+sTY9hHnMxvLY0qV6L3tvW/SPJi19jPrf9u/ffvQx1FWElGbAAAAE1NACoAAAAQRXhpZk1ldGEABQEaAAUAAAABAAAAUgEbAAUAAAABAAAAWgEoAAMAAAABAAIAAAExAAIAAAAKAAAAYgITAAMAAAABAAEAAAAAAAAAAABIAAAAAQAAAEgAAAABZXpnaWYuY29tAA==';

const POSTER_PLACEHOLDER =
  'data:image/webp;base64,UklGRuwBAABXRUJQVlA4TOABAAAv5QBWAA9wlZmbnDxpaf5jCXJc25Ik5QXRUpgf4WF9i3WECztgBawBL5LZRayBJSDsRO2yBaRgNgnmRHz+M7I685fw5oj+TwD+l5spaMlD0VmiylAs1CjpAmMLGwIno3QoGFe7TCRT1JCZ75iDWteZYAnikN5gx6hYJOq5dj3CRxmCEfZ21cO+6kqjKKMcR9Al6CN1pUFvKUMw5Gc4pXaNu0fpFcsxGqwEZepMeFRxmXnKHDeRYdl0lYLKInASRzC2qDwUC2tU6YJOCbqeZ8HEHHT4PH5lfIpHwNWE+ydAr8C1xxe3eLIES1gKYEwgdUeGZ5gAZAFZt3mGp9VECkjdZhk8MJMaUFau6GQFWYMGqSB1m8vEDK5M9plMTGDFonNBw2ZPpvMZMiUwZGKDFQBtj9fONLUGywC4x2pnnupZz87tGUxzJTytmHe0DU6QZZu3hWlWPytvMy5MXT1FGXOc8wdTF0uWI4xkGo3ZsjfwwZ4ftDS4mghisyf/Rs8HCoi2x77T00KWRULeNzukM8E9/r55MrKMNhrIus1e1gMyyIjn1bLlIZ2sIHWbP1dPnofOh+o2O12lrhMpAU/UDsBZQOo2vyWemXrFwgSybrmMy0gP8QDTCXoDLl25sOV/tAE=';

// ---------------------------------------------------------------------------
// Supplementary AniList GraphQL (fields MEDIA_DETAIL_QUERY drops)
// ---------------------------------------------------------------------------

interface SupplementaryInfo {
  tags?: Tag[];
  source?: string;
  bannerImage?: string;
  updatedAt?: number;
  externalLinks?: ExternalLink[];
  characters?: Character[];
}

const SUPPLEMENTARY_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    tags { id name rank isMediaSpoiler isGeneralSpoiler }
    source
    bannerImage
    updatedAt
    externalLinks { site url }
    characters(perPage: 50, sort: [ROLE, RELEVANCE, ID]) {
      edges {
        role
        node { id name { full native } image { large medium } }
        voiceActors { id languageV2 name { full native } image { large medium } }
      }
    }
  }
}`;

const fetchSupplementary = async (
  id: string,
): Promise<SupplementaryInfo | null> => {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: SUPPLEMENTARY_QUERY,
        variables: { id: parseInt(id, 10) },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.errors?.length) return null;
    const media = json?.data?.Media;
    if (!media) return null;
    return {
      tags: Array.isArray(media.tags)
        ? media.tags
            .filter(Boolean)
            .map(
              (t: {
                id?: number;
                name?: string;
                rank?: number;
                isMediaSpoiler?: boolean;
                isGeneralSpoiler?: boolean;
              }) => ({
                id: String(t?.id ?? ''),
                name: t?.name ?? '',
                rank: t?.rank ?? 0,
                isMediaSpoiler: !!t?.isMediaSpoiler,
                isGeneralSpoiler: !!t?.isGeneralSpoiler,
              }),
            )
        : [],
      source: media.source ?? '',
      bannerImage: media.bannerImage ?? '',
      updatedAt:
        typeof media.updatedAt === 'number' ? media.updatedAt : undefined,
      externalLinks: Array.isArray(media.externalLinks)
        ? media.externalLinks
            .filter(Boolean)
            .map((l: { site?: string; url?: string }) => ({
              site: l?.site ?? '',
              url: l?.url ?? '',
            }))
        : [],
      characters: Array.isArray(media.characters?.edges)
        ? media.characters.edges
            .filter(
              (e: {
                role?: string;
                node?: {
                  id?: number;
                  name?: { full?: string; native?: string };
                  image?: { large?: string; medium?: string };
                };
              }) => e?.node,
            )
            .map(
              (e: {
                role?: string;
                node: {
                  id?: number;
                  name?: { full?: string; native?: string };
                  image?: { large?: string; medium?: string };
                };
                voiceActors?: {
                  id?: number;
                  languageV2?: string;
                  name?: { full?: string; native?: string };
                  image?: { large?: string; medium?: string };
                }[];
              }) => ({
                id: String(e.node.id ?? ''),
                role: e.role ?? '',
                name: {
                  romaji: e.node.name?.full ?? '',
                  english: '',
                  native: e.node.name?.native ?? '',
                  userPreferred: e.node.name?.full ?? '',
                },
                image: e.node.image?.large ?? e.node.image?.medium ?? '',
                imageHash: '',
                // ADDITIVE: live `Ft` renders `voiceActors` from the character
                // edge (`languageV2` → VoiceActor.language).
                voiceActors: Array.isArray(e.voiceActors)
                  ? e.voiceActors
                      .filter((v) => !!v?.id)
                      .map((v) => ({
                        id: String(v?.id ?? ''),
                        language: v?.languageV2 ?? '',
                        name: {
                          romaji: v?.name?.full ?? '',
                          english: '',
                          native: v?.name?.native ?? '',
                          userPreferred: v?.name?.full ?? '',
                        },
                        image: v?.image?.large ?? v?.image?.medium ?? '',
                        imageHash: '',
                      }))
                  : [],
              }),
            )
        : [],
    };
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Styles (live style.css class text: aojp4 / 1vmn8 / 4yc5g / vni8n / 1tk52 /
// llxst / p7i3w)
// ---------------------------------------------------------------------------

// _infoContainer_aojp4_1
// _infoContainer_aojp4_1 — carries `animFadeIn` (live mount class) via attrs
// + the live .4s/ease-in-out animation vars (--animation-timing = our
// animations.css consumer for live's --animation-easing).
// max-width/margin = our shell's page container (live constrains in `.shell`).
const InfoContainer = styled.div.attrs({ className: 'animFadeIn' })`
  --animation-duration: 0.4s;
  --animation-timing: ease-in-out;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 125rem;
  margin: 0 auto;
`;

// _infoBannerImage_aojp4_115
const BannerImg = styled.img`
  display: block;
  width: 100%;
  height: 20rem;
  object-fit: cover;
  background-color: var(--global-div-tr);
  border-radius: var(--global-border-radius);
  -webkit-mask-image: linear-gradient(to bottom, #000, #0000);
  mask-image: linear-gradient(to bottom, #000, #0000);
  transition: opacity 0.3s ease-in-out;

  @media (max-width: 950px) {
    height: 15rem;
  }
  @media (min-width: 951px) {
    margin-bottom: -11rem;
  }
`;

// gradient hero panel (<=950px) — banner overlaps upward on desktop
const HeroPanel = styled.div`
  @media (max-width: 950px) {
    width: 100%;
    box-sizing: border-box;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--global-div-tr) 50%
    );
    border: 1px solid var(--global-border-color);
    border-top: none;
    border-radius: var(--global-border-radius);
  }
`;

// _infoRow_aojp4_43 — poster row (live carries a transform transition)
const HeroRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: flex-start;
  transition: transform 0.2s ease-in-out;

  @media (max-width: 950px) {
    margin-top: -10rem;
    padding-left: 1rem;
  }
  @media (max-width: 500px) {
    padding-left: 0.75rem;
  }
`;

const PosterCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 14rem;
  flex-shrink: 0;
  min-width: 0;

  @media (max-width: 950px) {
    width: 12rem;
  }
  @media (max-width: 500px) {
    width: 10rem;
  }
`;

// _infoCoverCard_aojp4_285
const CoverCard = styled.div`
  overflow: hidden;
  background-color: var(--global-div-tr);
  border-radius: var(--global-border-radius);
  box-shadow: 0 0 10px var(--global-shadow);
`;

// _infoImage_aojp4_125
const Poster = styled.img`
  display: block;
  width: 100%;
  background-color: var(--global-div-tr);
  border-radius: var(--global-border-radius);
  transition:
    opacity 0.3s ease-in-out,
    filter 0.3s ease-in-out;
`;

// _watchNowButton_4yc5g_32 (+ search trailer shares it)
const watchNowCss = css`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  padding: 0.45rem 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  color: var(--global-text);
  text-decoration: none;
  cursor: pointer;
  background-color: var(--global-div);
  border: none;
  border-radius: var(--global-border-radius);
  outline: 1px solid var(--global-border-color);

  &:hover {
    color: var(--primary-accent);
    background-color: var(--primary-accent-tr);
    outline: 1px solid var(--primary-accent);
  }
  &:active {
    transform: scale(0.95);
  }
  @media (max-width: 500px) {
    font-size: 0.8rem;
  }
`;

const WatchNow = styled(Link)`
  ${watchNowCss}
`;

// Wave B — sidebar bookmark toggle (Aniraku AnimeDetail.jsx:167-185 +
// 981-983 BookmarkBtn, restyled onto Aniraku's watchNow chrome / CSS vars).
// Guest = LS-only; signed-in = LS optimistic + server upsert/delete.
const BookmarkToggle = styled.button<{ $active?: boolean }>`
  ${watchNowCss}
  color: ${({ $active }) =>
    $active ? 'var(--primary-accent)' : 'var(--global-text)'};

  svg {
    color: ${({ $active }) =>
      $active ? 'var(--primary-accent)' : 'inherit'};
  }

  &:hover {
    color: ${({ $active }) =>
      $active ? 'var(--primary-accent)' : 'var(--primary-accent)'};
  }
`;

const SearchTrailerBtn = styled.a`
  ${watchNowCss}
  width: auto;
`;

const WatchLabelWide = styled.span`
  @media (max-width: 500px) {
    display: none;
  }
`;

const WatchLabelNarrow = styled.span`
  display: none;
  @media (max-width: 500px) {
    display: inline;
  }
`;

const BookmarkLabelWide = styled.span`
  @media (max-width: 500px) {
    display: none;
  }
`;

const BookmarkLabelNarrow = styled.span`
  display: none;
  @media (max-width: 500px) {
    display: inline;
  }
`;

// Mobile (≤500px) action row: WATCH + BOOKMARK share one compact row instead
// of stacking full-width (the stack made the poster column overflow-tall and
// squeezed the synopsis). display:contents on larger screens keeps the
// existing stacked full-width layout untouched.
const PosterActions = styled.div`
  display: contents;

  @media (max-width: 500px) {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;

    > * {
      flex: 1 1 0;
      min-width: 0;
      width: auto;
      white-space: nowrap;
    }
  }
`;

// _infoFlexWithGap_aojp4_215
const StatsRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

// _malAnilistSvg_vni8n_1 (live has no transition — hover flips instantly)
const StatsLink = styled.a`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 2rem;
  color: var(--global-text);
  background-color: var(--global-div);
  border: none;
  border-radius: var(--global-border-radius);
  outline: 1px solid var(--global-border-color);

  &:hover {
    color: var(--primary-accent);
    background-color: var(--primary-accent-tr);
    outline: 1px solid var(--primary-accent);
  }
  &:active {
    transform: scale(0.95);
  }
  @media (max-width: 500px) {
    width: 4rem;
    height: 2rem;
  }
`;

// ---------------------------------------------------------------------------
// Two-column data wrapper (live infoDataWrapper + side/main columns)
// ---------------------------------------------------------------------------

// _infoDataWrapper_aojp4_15 — row of side + main column, stacked on mobile
const DataWrapper = styled.div`
  --info-desktop-side-column-width: 14rem;
  --info-desktop-side-column-inset: 1rem;
  --info-desktop-side-column-outer-width: calc(
    var(--info-desktop-side-column-width) +
      (var(--info-desktop-side-column-inset) * 2)
  );

  /* P0 (unclickable tabs): BannerImg's inline filter: grayscale(...)
     (both branches — any non-none filter) and the opacity: .2 fallback
     unconditionally create a stacking context, so the banner paints in the
     z-index:0 group (CSS 2.1 App. E step 8) — ABOVE the normal-flow content
     that its ≥951px margin-bottom: -11rem pulls into its 20rem box: the
     title, chips and the ENTIRE tab strip. Its border box then hit-tests
     every click over the strip (mask/opacity never affect hit-testing), so
     the Tab buttons never receive them. Live zt avoids this with
     zIndex:-1 on the banner, which we can't use here (it would resolve at
     the root stacking context, behind body's opaque background). Isolating
     this wrapper puts it in the same z-index:0 painting group as the banner
     but LATER in tree order → content (and clicks) sit above the banner
     again; the lightbox stays outside this wrapper, so its root-level
     z-index still clears the navbar. */
  isolation: isolate;

  display: flex;
  flex-direction: row;
  gap: 1rem;
  // Equal-height columns: the sidebar details panel is JS-capped to the
  // main column height (internal scroll), so both columns end together —
  // no blank void beside a long sidebar.
  align-items: stretch;
  min-width: 0;

  @media (max-width: 950px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

// _infoDesktopSideColumn_aojp4_27 — poster + details sidebar. Live insets the
// poster/details wrappers by `side-column-inset` margin + padding (content
// 2rem…16rem inside the 16rem basis); one `border-box` padding reproduces it.
const SideColumn = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 0 0 var(--info-desktop-side-column-outer-width);
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  min-height: 0;

  @media (min-width: 951px) {
    padding-left: calc(var(--info-desktop-side-column-inset) * 2);
  }
  @media (max-width: 950px) {
    flex: 1 1 auto;
    width: 100%;
  }
`;

// _infoDesktopMainColumn_aojp4_35 — title + chips + tab bar + panel.
// ≤950 the panel-height var feeds `infoScrollableSection` (live scopes it on
// `infoButtonGroupWrapper` — same descendant resolution on this layout).
const MainColumn = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  min-height: 0;

  @media (max-width: 950px) {
    --info-mobile-panel-height: 22.5rem;
  }
`;

// _infoDesktopTitle_aojp4_185 / _infoMobileTitle_aojp4_171 — dual h1: the
// desktop one lives in the main column (hidden ≤950), the mobile one sits
// beside the poster (hidden ≥951), exactly as live `Qe` + `Ze`.
// Live puts `padding-right` (1rem desktop / .5rem mobile) + the mobile
// `overflow: hidden` chip-clip on the h1 itself; our h1 and chips share
// TitleBlock, so those declarations live there for identical widths/clip.
const Title = styled.h1<{ $mobile?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.6rem;
  /* Long single-word titles (no spaces) wrap instead of clipping under the
     mobile title block's overflow: hidden — mobile polish pass. */
  overflow-wrap: anywhere;

  @media (max-width: 950px) {
    font-size: 1.25rem;
  }
  @media (max-width: 500px) {
    font-size: 1.1rem;
  }
  ${({ $mobile }) =>
    $mobile
      ? '@media (min-width: 951px) { display: none; }'
      : '@media (max-width: 950px) { display: none; }'}
`;

// h1 + stat chips (+ mobile description) wrapper — one instance per
// breakpoint so the chips group with the title on both (live renders `_t`
// inside both `Ze` and `vt`).
const TitleBlock = styled.div<{ $mobile?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
  ${({ $mobile }) =>
    $mobile
      ? `
    position: relative;
    top: 0;
    padding-right: 0.5rem;
    overflow: visible;
    flex: 1;
    min-width: 0;
    width: auto;
    @media (min-width: 951px) { display: none; }`
      : `
    padding-right: 1rem;
    @media (max-width: 950px) { display: none; }`}
`;

// _infoTagsContainer_aojp4_241 — chip row (live renders links as direct
// children of a div; live clips with nowrap ≤950 inside the mobile h1 — that
// hard clip read as broken/overflowing on phones, so chips wrap instead)
const ChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  line-height: 1.1rem;

  @media (max-width: 500px) {
    line-height: unset;
  }
`;

// _genreTag_1tk52_1
const Chip = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--genre-tag-color);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  background-color: var(--genre-tag-bg);
  border-radius: 0.8rem;

  &:hover {
    color: var(--genre-tag-hover-color);
    transform: scale(0.95);
  }
`;

// _borderVariant_1tk52_20 (stat chips)
const StatChip = styled(Chip)`
  padding: 0.15rem 0.4rem;
  font-size: 0.8rem;
  border-radius: var(--global-border-radius);

  @media (max-width: 500px) {
    font-size: 0.65rem;
  }
`;

// _trailerContainer_1vmn8_1
const TrailerBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

// _infoDescription_aojp4_200 (+ collapsed/expanded overflow, live `yt`)
// `$desktopOnly` = `_descDesktopOnly_1vmn8_14` (hidden ≤950 — the mobile
// breakpoint renders its own description inside the poster-side title block).
const DescriptionText = styled.div<{
  $expanded: boolean;
  $desktopOnly?: boolean;
}>`
  position: relative;
  max-height: 10rem;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 400;
  line-height: 1.3rem;
  color: var(--global-text-muted);

  ${({ $expanded }) =>
    $expanded ? 'overflow-y: auto;' : 'overflow: hidden;'}
  ${({ $desktopOnly }) =>
    $desktopOnly ? '@media (max-width: 950px) { display: none; }' : ''}
`;

// _infoTrailerIframe_1vmn8 — 16/9 (<=950) → 21/9 (>=951)
const TrailerFrame = styled.iframe`
  position: relative;
  width: 100%;
  max-height: 35rem;
  aspect-ratio: 16 / 9;
  border: none;
  border-radius: var(--global-border-radius);

  @media (min-width: 951px) {
    aspect-ratio: 21 / 9;
  }
`;

// (live has NO show-more on the description — `yt` expands via its own click;
//  the only `infoShowMoreBtn` lives in the sidebar details → DetailsToggle.)

// _emptyState_1jdkw_21 — episodes empty (padding/color/center + ≤950 fill)
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: var(--global-text-muted);
  text-align: center;

  p {
    margin: 0;
  }
  @media (max-width: 950px) {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
  }
`;

// _listContainer_llxst_1 (+ max-height:100%, min-width reset ≤1199)
const EpisodeListContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
  min-width: 24rem;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  color: var(--global-text);
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  @media (max-width: 1199px) {
    min-width: 100%;
  }
`;

// _episodeGrid_llxst_18 + _rowLayout_llxst_27 (list/imageList) /
// _gridLayout_llxst_30 (grid)
const EpisodeGrid = styled.div<{ $mode: EpisodeMode }>`
  display: grid;
  flex-grow: 1;
  gap: 0.24rem;
  align-content: start;
  min-height: 0;
  padding: 0.4rem;
  overflow-y: auto;
  /* min(20rem,100%): a fixed 20rem track overflowed the panel below ~344px
     of content width — body clips horizontal scroll ≤768, so the right edge
     of episode rows just looked cut off ("overflowing"). */
  grid-template-columns: ${({ $mode }) =>
    $mode === 'grid'
      ? 'repeat(auto-fill, minmax(4rem, 1fr))'
      : 'repeat(auto-fill, minmax(min(20rem, 100%), 1fr))'};
`;

// _root_p7i3w_1 (live's class string carries `animFadeIn`) + _rowLayout_p7i3w_25
// via $row (justify space-between + svg -0.15rem). State colors/outline/padding/
// text-align arrive as CSS vars from `episodeVars` (live Yt) — no local color
// logic. Anchor adaptation: live root is <button onClick>, ours is the
// mandated /watch Link (text-decoration: none) — decls otherwise verbatim.
const EpisodeButton = styled(Link).attrs({ className: 'animFadeIn' })<{
  $row: boolean;
}>`
  --animation-duration: 0.3s;
  --animation-timing: ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 100px;
  padding: var(--episode-item-padding);
  color: var(--episode-item-color);
  text-align: var(--episode-item-text-align);
  cursor: pointer;
  text-decoration: none;
  background-color: var(--episode-item-background);
  border: none;
  border-radius: var(--global-border-radius);
  outline: var(--episode-item-outline);
  transition:
    padding 0.25s ease-in-out,
    background-color 0.25s ease-in-out,
    box-shadow 0.25s ease-in-out,
    transform 0.25s ease-in-out,
    filter 0.25s ease-in-out;
  transform: scale(0.98);
  ${({ $row }) =>
    $row
      ? `
      justify-content: space-between;
      svg {
        margin-bottom: -0.15rem;
      }
  `
      : ''}

  &:hover,
  &:active,
  &:focus {
    filter: var(--episode-item-hover-filter);
    outline: 1px solid rgb(255 255 255 / 100%);
    box-shadow: 0 0 5px var(--global-shadow);
    transform: scale(1);
  }
  @media (max-width: 500px) {
    max-height: 80px;
  }
`;

// _link_p7i3w_40
const EpLink = styled.div`
  width: 100%;
  color: inherit;
  text-decoration: none;
`;

// _imageListContent_p7i3w_45
const EpImageListContent = styled.div`
  display: flex;
  gap: 0;
`;

// _imageListHeader_p7i3w_46 (align/justify + gap rules)
const EpImageListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
`;

// _metaIcons_p7i3w_47
const EpMetaIcons = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 0.25rem;
  align-items: center;
  margin-bottom: 0.1rem;
`;

// _gridContent_p7i3w_48
const EpGridContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

// _listContent_p7i3w_49
const EpListContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

// _listTitleGroup_p7i3w_79
const EpListTitleGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

// _imageWrapper_p7i3w_84 (+ ≤500 120×80)
const EpImageWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 150px;
  height: 100px;
  margin: 0;
  overflow: hidden;
  background-color: var(--global-card-bg);
  border-radius: var(--global-border-radius);
  box-shadow: 0 0 10px var(--global-shadow);

  @media (max-width: 500px) {
    width: 120px;
    height: 80px;
  }
`;

// _image_p7i3w_45 (+ _spoilerHidden_p7i3w_116 via $spoiler; ≤500 120×80)
const EpImage = styled.img<{ $spoiler?: boolean }>`
  display: block;
  width: 150px;
  height: 100px;
  object-fit: cover;
  object-position: center;
  border-radius: var(--global-border-radius);
  transition:
    opacity 0.3s ease-in-out,
    filter 0.3s ease-in-out;
  ${({ $spoiler }) =>
    $spoiler ? 'filter: blur(8px) brightness(1.5);' : ''}

  @media (max-width: 500px) {
    width: 120px;
    height: 80px;
  }
`;

// _imageFallback_p7i3w_106
const EpImageFallback = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--global-text-muted);
`;

// _spoilerOverlay_p7i3w_119 (+ _isVisible_p7i3w_134 via $visible)
const EpSpoilerOverlay = styled.div<{ $visible?: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  pointer-events: none;
  background: transparent;
  mix-blend-mode: difference;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
`;

// _label_p7i3w_137
const EpLabel = styled.span`
  position: absolute;
  bottom: 0.25rem;
  left: 0.25rem;
  padding: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #ffffffd9;
  background-color: #000000bf;
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: var(--global-border-radius);
`;

// _episodeNumber_p7i3w_149 (+ _episodeNumberStrong_p7i3w_157 via $strong)
const EpEpisodeNumber = styled.span<{ $strong?: boolean }>`
  display: -webkit-box;
  overflow: hidden;
  line-height: 1rem;
  text-overflow: ellipsis;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  ${({ $strong }) => ($strong ? 'font-weight: 500;' : '')}
`;

// _descriptionWrapper_p7i3w_160 (+ ≤500 gap/padding)
const EpDescriptionWrapper = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100%;
  padding: 0.5rem;

  @media (max-width: 500px) {
    gap: 0.15rem;
    padding: 0.25rem 0.5rem;
  }
`;

// _description_p7i3w_160 (+ ≤500)
const EpDescription = styled.div`
  display: -webkit-box;
  height: 100%;
  overflow: hidden;
  font-size: 0.65rem;
  line-height: 0.8rem;
  color: var(--episode-description-color);
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  word-break: break-word;
  filter: var(--episode-description-filter);
  transition:
    color 0.25s ease-in-out,
    filter 0.25s ease-in-out;
  -webkit-box-orient: vertical;

  @media (max-width: 500px) {
    font-size: 0.6rem;
    -webkit-line-clamp: 3;
  }
`;

// _imageListFooter_p7i3w_184
const EpImageListFooter = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
`;

// _airDate_p7i3w_190 (+ ≤500)
const EpAirDate = styled.div`
  font-size: 0.65rem;
  text-align: end;

  @media (max-width: 500px) {
    font-size: 0.6rem;
  }
`;

// toolbar range select — live `qt` applies `Gt` inline:
// {padding:.5rem, bg global-div, color global-text, border, radius, center}
const EpInterval = styled.select`
  padding: 0.5rem;
  color: var(--global-text);
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  text-align: center;
`;

// single-interval fallback: `{...Gt, alignContent: 'center'}`
const EpIntervalBox = styled.div`
  padding: 0.5rem;
  color: var(--global-text);
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  text-align: center;
  align-content: center;
`;

const ErrorBox = styled.div`
  padding: 1rem;
  background-color: rgba(244, 67, 54, 0.1);
  border-left: 4px solid #f44336;
  color: #f44336;
  border-radius: var(--global-border-radius);
  font-weight: bold;
`;

// ---------------------------------------------------------------------------
// Tab bar + sidebar details + tab-body sections
// ---------------------------------------------------------------------------

// _rowSlideButtonContainer_1vfm3_1 + _infoButtonContainer_aojp4_367
const TabBar = styled.div`
  box-sizing: border-box;
  display: flex;
  gap: 0.25rem;
  align-items: stretch;
  min-height: 2.6rem;
  padding: 0.25rem;
  overflow-x: auto;
  white-space: nowrap;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 950px) {
    width: auto;
    max-width: 100%;
  }
`;

// _rowSlideButton_4yc5g_1 + _rowSlideButtonActive_4yc5g_16
const Tab = styled.button<{ $active?: boolean }>`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.6rem 2rem;
  line-height: 1.2;
  color: ${({ $active }) =>
    $active ? 'var(--primary-accent)' : 'var(--global-text-muted)'};
  cursor: pointer;
  background-color: ${({ $active }) =>
    $active ? 'var(--primary-accent-tr)' : 'var(--global-div)'};
  border: none;
  border-radius: var(--global-border-radius);

  &:hover {
    color: var(--primary-accent);
    background: var(--primary-accent-tr);
  }
  @media (max-width: 550px) {
    padding: 0.6rem 1rem;
  }
`;

// Panel wrapper under the tab bar (live `He > b` → _infoDesktopPanelContent_
// aojp4_90 — no gap, no animation in live; children flex to fill).
const TabPanel = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  > * {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }
`;

// _infoOverviewContainer_aojp4_160 — Overview body column (live `Xe` in `Lt`)
const OverviewBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  font-size: 0.9rem;
  border-radius: var(--global-border-radius);

  @media (max-width: 950px) {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
  }
`;

// _infoScrollableSection_aojp4_71 — scroll box for Characters/Artwork/
// Episodes: base = display:flex + min-w/h0 + `>*` fill; ≥951 adds
// flex:1 1 auto + overflow:hidden (live also sets `height:0`, which needs the
// app shell's definite-height chain our shell lacks → omitted, residual
// flagged); ≤950 = height var + overflow:hidden.
const TabScroll = styled.div`
  display: flex;
  min-width: 0;
  min-height: 0;

  > * {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }
  @media (min-width: 951px) {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  @media (max-width: 950px) {
    height: var(--info-mobile-panel-height, 22.5rem);
    overflow: hidden;
  }
`;

// _infoDetailsWrapper_aojp4_196
const DetailsWrapper = styled.div`
  width: 100%;
  overflow: hidden;
  border-radius: var(--global-border-radius);
`;

// _infoDataContainer_aojp4_143 — sidebar rows; horizontal scroller ≤950px
const DetailsPanel = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--global-text);
  background-color: var(--global-div-tr);
  border-radius: var(--global-border-radius);

  @media (min-width: 951px) {
    flex: 1 1 auto;
    height: auto;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    border: 1px solid var(--global-border-color);
  }
  @media (max-width: 950px) {
    /* Mobile screencast complaint: the hidden x-scroller cut every row at
       the viewport edge ("Seaso[n]", tag chips floating mid-scroll). Rows
       now stack full-width — page length instead of cut edges
       (the user's chosen trade-off). */
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem;
    width: 100%;
    max-width: 100%;
    overflow: visible;
  }
`;

// _infoLabelValuePair_aojp4_212 — label above value; value nowrap/scrollable
// ≥951 only (live `>span` rule), weight-300 muted from `infoDataContainer span`
const DetailRow = styled.div<{
  $hideOnDesktop?: boolean;
  $hideOnMobile?: boolean;
}>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 0.5rem;
  justify-content: space-between;

  span {
    display: block;
    flex-shrink: 0;
    font-weight: 300;
    color: var(--global-text-muted);
  }
  strong,
  b {
    font-weight: 700;
  }
  /* Mobile: rows stack full-width (genres block, then tags block) so chip
     groups never sit side-by-side in cramped uneven columns */
  @media (max-width: 950px) {
    flex: 1 1 100%;
    min-width: 0;
  }

  a {
    color: var(--global-text);
    text-decoration: none;

    &:hover {
      color: var(--primary-accent);
    }
  }

  @media (min-width: 951px) {
    width: 100%;
    min-width: 0;

    span {
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }
  ${({ $hideOnDesktop }) =>
    $hideOnDesktop ? '@media (min-width: 951px) { display: none; }' : ''}
  ${({ $hideOnMobile }) =>
    $hideOnMobile ? '@media (max-width: 950px) { display: none; }' : ''}
`;

// Mobile synopsis (≤950): full-width block under the poster/title row.
// The old narrow-column synopsis (capped to the poster height, clipped
// mid-sentence beside the buttons) read as broken — this clamps to 4 lines
// collapsed, tap expands to full text.
const MobileSynopsis = styled.div`
  display: none;

  @media (max-width: 950px) {
    display: block;
    margin: 0.5rem 0.75rem 0;
  }
`;

const MobileSynopsisText = styled.p<{ $expanded: boolean }>`
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.35rem;
  color: var(--global-text-muted);
  cursor: pointer;
  overflow-wrap: break-word;

  ${({ $expanded }) =>
    $expanded
      ? ''
      : `
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
  `}
`;

// ONE details block ≤950 (double-details fix): full-width card under the
// poster/title row (NOT squeezed into the narrow title column beside the
// poster — that cramped layout read as messy on phones). Collapsed by
// default; expands to natural height with page scroll. Hidden ≥951 —
// desktop keeps its details rows in the sidebar panel only.
const HeroDetailsCard = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  @media (min-width: 951px) {
    display: none;
  }
  @media (max-width: 950px) {
    margin: 0.5rem 0.75rem 0.75rem;
  }
`;

const HeroDetailsToggle = styled.button`
  display: flex;
  flex-shrink: 0;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.6rem 0.75rem;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--global-text);
  cursor: pointer;
  background: transparent;
  border: none;

  svg {
    font-size: 1rem;
    color: var(--global-text-muted);
    transition: transform 0.2s ease;
  }
  &[aria-expanded='true'] svg {
    transform: rotate(180deg);
  }
`;

const HeroDetailsList = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
  padding: 0 0.75rem 0.75rem;
  overflow-y: auto;
  font-size: 0.85rem;
  line-height: 1.3rem;
  scrollbar-width: thin;

  a {
    color: var(--global-text);
    text-decoration: none;

    &:hover {
      color: var(--primary-accent);
    }
  }
`;

// inline `Label: value` row (one column; values wrap with the text)
const HeroDetailRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: baseline;

  > span:first-child {
    flex-shrink: 0;
    color: var(--global-text-muted);
    font-weight: 500;
  }
  b,
  strong {
    font-weight: 700;
  }
`;

// SEASONS strip (user spec): prequel/sequel cards under the trailer in the
// main column, each marked with a PREQUEL/SEQUEL badge, linking to that
// anime's info page.
const SeasonsBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const SeasonsTitle = styled.h2`
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
`;

const SeasonsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SeasonCard = styled(Link)`
  display: flex;
  flex: 1 1 14rem;
  gap: 0.5rem;
  align-items: center;
  min-width: 0;
  padding: 0.5rem;
  color: inherit;
  text-decoration: none;
  background-color: var(--global-div);
  border-radius: var(--global-border-radius);
  outline: 1px solid var(--global-border-color);

  &:hover {
    color: var(--primary-accent);
    outline: 1px solid var(--primary-accent);
  }
  &:active {
    transform: scale(0.98);
  }
`;

const SeasonPoster = styled.img`
  width: 3rem;
  height: 4.25rem;
  flex-shrink: 0;
  object-fit: cover;
  background-color: var(--global-card-bg);
  border-radius: var(--global-border-radius);
`;

const SeasonMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
  min-width: 0;
`;

const SeasonBadge = styled.span<{ $kind: 'PREQUEL' | 'SEQUEL' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.4rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04rem;
  white-space: nowrap;
  border-radius: var(--global-border-radius);
  ${({ $kind }) =>
    $kind === 'SEQUEL'
      ? 'color: #7bd88a; background-color: rgba(76, 175, 80, 0.15); outline: 1px solid rgba(76, 175, 80, 0.4);'
      : 'color: #82b4ff; background-color: rgba(76, 140, 255, 0.15); outline: 1px solid rgba(76, 140, 255, 0.4);'}
`;

const SeasonTitle = styled.span`
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1rem;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const SeasonSub = styled.span`
  font-size: 0.7rem;
  color: var(--global-text-muted);
`;

// Genres + Tags rows: always visible ≤950, collapsed behind the desktop
// show-more toggle (live `ht` with `desktop` + `$e`).
const DetailsExtra = styled.div<{ $expanded: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
  width: 100%;

  @media (min-width: 951px) {
    display: ${({ $expanded }) => ($expanded ? 'flex' : 'none')};
  }
`;

// _infoShowMoreBtn_aojp4_249 — full-bleed footer bar (desktop only)
const DetailsToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% + 2rem);
  padding: 0.6rem;
  margin: 0.25rem -1rem -1rem;
  font-size: 0.9rem;
  color: var(--global-text-muted);
  cursor: pointer;
  background-color: transparent;
  border: none;
  border-top: 1px solid var(--global-border-color);
  border-radius: 0 0 var(--global-border-radius) var(--global-border-radius);
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  svg {
    font-size: 1.1rem;
    transition: transform 0.2s ease;
  }
  &[aria-expanded='true'] svg {
    transform: rotate(180deg);
  }
  @media (max-width: 950px) {
    display: none;
  }
  @media (hover: hover) {
    &:hover {
      color: var(--global-text);
      background-color: var(--global-div);
    }
  }
  &:focus-visible {
    color: var(--global-text);
    background-color: var(--global-div);
  }
`;

// Shared tab-section shell — _container_hsaph_1 / _container_1lfbt_1
// (both carry `animFadeIn` + the live .4s/ease-in-out animation vars)
const TabSection = styled.div.attrs({ className: 'animFadeIn' })`
  --animation-duration: 0.4s;
  --animation-timing: ease-in-out;
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  flex-shrink: 1;
  font-size: 0.9rem;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  @media (min-width: 951px) {
    min-height: 0;
  }
  @media (max-width: 950px) {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
  }
`;

// _sectionTitle_hsaph_14 / _sectionTitle_1lfbt_14
const SectionBar = styled.h2`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  width: auto;
  padding: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  background-color: var(--global-div-tr);
  border-bottom: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

// _sectionTitleLabel_hsaph_25
const SectionBarLabel = styled.span`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  min-width: 0;

  svg {
    flex-shrink: 0;
  }
`;

// _filterSelectBox_hsaph_39
const BarSelect = styled.select`
  padding: 0.5rem;
  color: var(--global-text);
  text-align: center;
  background-color: var(--global-tertiary-bg);
  border: none;
  border-radius: var(--global-border-radius);
`;

// _scrollWrapper_hsaph_46 / _scrollWrapper_1lfbt_79 — position/overflow base;
// live adds the same flex fill under both ≥951 and ≤950 → unconditional here.
const SectionScroll = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--global-border-radius);
`;

// _fadeTop_hsaph_48 / _fadeBottom_hsaph_49 (+ _isVisible → opacity 1)
const SectionFade = styled.div<{ $bottom?: boolean; $visible?: boolean }>`
  position: absolute;
  right: 0;
  left: 0;
  z-index: var(--z-index-above);
  height: 2rem;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
  ${({ $bottom }) =>
    $bottom
      ? 'bottom: 0; background: linear-gradient(to top, var(--global-primary-bg) 10%, transparent);'
      : 'top: 0; background: linear-gradient(to bottom, var(--global-primary-bg) 10%, transparent);'}
`;

// _emptyState_hsaph_137 / _emptyState_1lfbt_97 — chars/art empty (centered
// only; ≤950 fills the shell) vs EmptyState below = live _emptyState_1jdkw_21
const SectionEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;

  @media (max-width: 950px) {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
  }
`;

// _infoRelatedContentContainer_aojp4_102 — related + recs below the columns
const RelatedContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-left: 2rem;

  @media (max-width: 950px) {
    margin-left: 0;
  }
`;

// ---------------------------------------------------------------------------
// Related / Recommendations — live `Et` → `Tt` (ulm8c drag list)
// ---------------------------------------------------------------------------

// _scrollButton_ulm8c_55 (+ data-side / data-visible + container-hover reveal)
const DragListScrollBtn = styled.button<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 42.5%;
  z-index: var(--z-index-sticky);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  font-size: 1.5rem;
  color: var(--global-text);
  pointer-events: none;
  cursor: pointer;
  background: var(--global-button-shadow);
  border: none;
  border-radius: 50%;
  opacity: 0;
  transition:
    opacity 0.3s ease-in-out,
    color 0.3s ease-in-out,
    background 0.3s ease-in-out;
  transform: translateY(-50%);
  --animation-duration: 0.4s;
  --animation-timing: ease-in-out;

  ${({ $side }) => ($side === 'left' ? 'left: 1rem;' : 'right: 1rem;')}
  &[data-visible='true'] {
    pointer-events: auto;
  }
  &:hover {
    background: var(--global-div);
    filter: brightness(1.5);
  }
  &:active {
    color: var(--primary-accent);
  }
`;

// _dragListContainer_ulm8c_1 (+ `_dragListContainer:hover
// ._scrollButton[data-visible=true]{opacity:1}`)
const DragListBox = styled.div`
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  user-select: none;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border-radius: var(--global-border-radius);
  transition: 0.4s ease-in-out;
  --drag-list-item-width: 12rem;

  &::-webkit-scrollbar {
    display: none;
  }
  &:hover ${DragListScrollBtn}[data-visible='true'] {
    opacity: 1;
  }
`;

// _listTitle_ulm8c_99
const DragListTitle = styled.h2`
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  transition: 0.4s ease-in-out;

  @media (max-width: 600px) {
    font-size: 1.25rem;
  }
`;

// _relativeWrapper_ulm8c_107
const DragListRelative = styled.div`
  position: relative;
`;

// _dragListWrapper_ulm8c_12 — horizontal scroller
const DragListWrapper = styled.ul`
  position: relative;
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding: 1rem 0 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border-radius: var(--global-border-radius);
  transition: 0.4s ease-in-out;
  list-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

// _dragListItemWrapper_ulm8c_27
const DragListItem = styled.li`
  width: var(--drag-list-item-width);
  min-width: var(--drag-list-item-width);
  transition: 0.5s ease-in-out;

  @media (max-width: 1000px) {
    width: calc(var(--drag-list-item-width) - 2rem);
    min-width: calc(var(--drag-list-item-width) - 2rem);
  }
  @media (max-width: 600px) {
    width: calc(var(--drag-list-item-width) - 4.5rem);
    min-width: calc(var(--drag-list-item-width) - 4.5rem);
  }
`;

// _fadeLeft_ulm8c_32 / _fadeRight_ulm8c_33 (+ [data-visible=true] → opacity 1)
const DragListFade = styled.div<{ $side: 'left' | 'right'; $visible?: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: var(--z-index-above);
  width: 2rem;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.4s ease-in-out;
  ${({ $side }) =>
    $side === 'left'
      ? 'left: 0; background: linear-gradient(to right, var(--global-primary-bg) 10%, transparent 100%);'
      : 'right: 0; background: linear-gradient(to left, var(--global-primary-bg) 10%, transparent 100%);'}
`;

// _iconNudgeLeft_ulm8c_110 / _iconNudgeRight_ulm8c_114
const DragNudge = styled.span<{ $left?: boolean }>`
  position: relative;
  ${({ $left }) => ($left ? 'right: 0.065rem;' : 'left: 0.065rem;')}
`;

// _icon_dlwq6_58 — episodes filter magnifier wrapper
const EpFilterIcon = styled.span`
  display: flex;
  font-size: 0.8rem;
  color: var(--global-text);
  opacity: 0.5;
  transition: opacity 0.2s;

  @media (max-width: 500px) {
    display: none;
  }
`;

// Characters — _gridContainer_hsaph_38 (base 3 cols; ≤1400 → 2; ≤1100 → 1;
// ≤500 → 1fr; flex fill under ≥951 and ≤950 resets the 53rem cap)
const CharGrid = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  align-content: start;
  max-height: 53rem;
  padding: 0.5rem;
  overflow-y: auto;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
    padding: 0.5rem;
  }
  @media (max-width: 1100px) {
    grid-template-columns: repeat(1, 1fr);
  }
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
  @media (min-width: 951px) {
    flex: 1;
    min-height: 0;
    max-height: none;
  }
  @media (max-width: 950px) {
    flex: 1;
    min-height: 0;
    max-height: none;
  }
`;

// _cardWrapper_hsaph_64
const CharCardWrap = styled.div`
  height: 4.5rem;
  transition: padding 0.2s ease-in-out;

  &:hover {
    padding-left: 0.25rem;
  }
`;

// _card_hsaph_70
const CharCard = styled.div`
  z-index: var(--z-index-base);
  display: flex;
  gap: 1rem;
  align-items: center;
  height: 100%;
  overflow: hidden;
  color: var(--global-text);
  text-decoration: none;
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  &:hover {
    border-color: var(--global-text);
  }
`;

// _image_hsaph_93
const CharImage = styled.img`
  width: 4rem;
  height: 4.5rem;
  object-fit: cover;
  background-color: var(--global-div);
  box-shadow: 0 0 10px var(--global-shadow);
`;

// _details_hsaph_100 + _alignRight_hsaph_117 (live: no ellipsis, no min-width)
const CharDetails = styled.div<{ $right?: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;

  b {
    font-size: 1rem;
  }
  a {
    color: var(--global-text);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  ${({ $right }) =>
    $right
      ? 'align-items: flex-end; text-align: right;'
      : ''}
`;

// _mutedText_hsaph_121
const CharMuted = styled.span`
  color: var(--global-text-muted);
`;

// _actorImageLink_hsaph_124
const CharActorLink = styled.a`
  height: 100%;
  padding: 0;
  margin: 0;
`;

// Artwork — CSS-column masonry standing in for react-masonry-css (no new deps):
// live `breakpointCols { default: 3, 1100: 2 }` → 3 → 2 only (no 1-col step);
// live `_flexContainer_1lfbt_38` = flex-wrap container (masonry children adapt)
// with max-height 53rem / padding .5rem / overflow-y auto
const ArtGrid = styled.div`
  position: relative;
  column-count: 3;
  column-gap: 1rem;
  max-height: 53rem;
  padding: 0.5rem;
  overflow-y: auto;

  @media (max-width: 1100px) {
    column-count: 2;
    padding: 0.5rem;
  }
  @media (min-width: 951px) {
    flex: 1;
    min-height: 0;
    max-height: none;
  }
  @media (max-width: 950px) {
    flex: 1;
    min-height: 0;
    max-height: none;
  }
`;

// _artworkImage_1lfbt_117 (column child → break-inside/margin-bottom stand in
// for live's `masonryGridColumn > div { margin-bottom: 1rem }`)
const ArtImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  margin-bottom: 1rem;
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  cursor: pointer;
  border-radius: var(--global-border-radius);
  box-shadow: 8px 8px 8px rgb(0 0 0 / 20%);
  transition: opacity 0.3s ease-in-out;

  &:hover {
    filter: brightness(0.75);
  }
`;

// Artwork lightbox — _overlayContainer_1bzcd_1 + _overlayContent_1uu4r_12 /
// _overlayImage_1uu4r_24 / _navigationContainer_1uu4r_31 /
// _navigationButton_1uu4r_41 (live `Dt`). Live mounts already-shown end state
// (its .4s opacity/visibility transition only plays on property changes —
// none occur at mount) → we render visible with the same declarations.
const Lightbox = styled.div`
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
  pointer-events: auto;
  visibility: visible;
  background-color: #0000007f;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  opacity: 1;
  transition:
    opacity 0.4s ease-in-out,
    visibility 0.4s ease-in-out;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

// _overlayContent_1uu4r_12
const LightboxContent = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// _overlayImage_1uu4r_24 (animPopIn class; live --animation-easing → our
// --animation-timing)
const LightboxImg = styled.img.attrs({ className: 'animPopIn' })`
  max-width: 60%;
  border-radius: var(--global-border-radius);
  --animation-duration: 0.4s;
  --animation-timing: ease-in-out;

  @media (max-width: 500px) {
    max-width: 90%;
  }
`;

// _navigationContainer_1uu4r_31 (animFadeIn class, .2s)
const LightboxNav = styled.div.attrs({ className: 'animFadeIn' })`
  position: absolute;
  bottom: 1rem;
  z-index: var(--z-index-above);
  display: flex;
  gap: 2rem;
  justify-content: center;
  width: 100%;
  --animation-duration: 0.2s;
  --animation-timing: ease-in-out;

  @media (max-width: 500px) {
    bottom: 20%;
  }
`;

// _navigationButton_1uu4r_41
const LightboxBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2rem;
  font-size: 3rem;
  color: var(--global-text);
  cursor: pointer;
  background-color: var(--global-primary-bg-tr);
  border: 2px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  &:hover {
    background-color: var(--global-primary-bg);
  }
  &:active {
    transform: scale(0.975);
  }
`;

// Episodes toolbar — _container_dlwq6_1 family (no radius/align on the bar;
// ≤500 container/buttonBase get padding .5rem from live's media rule)
const EpToolbar = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background-color: var(--global-div-tr);
  border-bottom: 1px solid var(--global-border-color);

  @media (max-width: 500px) {
    padding: 0.5rem;
  }
`;

// _filterContainer_dlwq6_30 (magnifier styling lives in EpFilterIcon — live
// scopes it to its own `_icon_dlwq6_58` wrapper, not the container)
const EpFilter = styled.div`
  display: flex;
  flex: 1;
  gap: 0.25rem;
  align-items: center;
  padding: 0.5rem;
  background-color: var(--global-secondary-bg);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover,
  &:active,
  &:focus-within {
    background-color: var(--global-button-hover-bg);
  }
`;

// _filterInput_dlwq6_48 (incl. ≤500 gray placeholder)
const EpFilterInput = styled.input`
  width: 100%;
  color: var(--global-text);
  background-color: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: var(--global-text-muted);
  }
  @media (max-width: 500px) {
    &::placeholder {
      color: gray;
    }
  }
`;

// _buttonBase_dlwq6_8 (live :hover ungated; ≤500 padding .5rem)
const EpToolBtn = styled.button`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  color: var(--global-text);
  cursor: pointer;
  background-color: var(--global-secondary-bg);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background-color: var(--global-button-hover-bg);
  }
  &:active {
    transform: scale(0.9);
  }
  @media (max-width: 500px) {
    padding: 0.5rem;
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// NSFW gate card (Aniraku AnimeDetail.jsx:553-590 NsfwCard/NsfwBtn/
// OutlineLink — copy verbatim, chrome on our CSS vars).
const NsfwCard = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 40px;
  text-align: center;
  background: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: 16px;

  @media (max-width: 480px) {
    padding: 28px 20px;
    border-radius: 12px;
    margin: 0 12px;
  }
`;

const NsfwTitle = styled.p`
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--global-text);
`;

const NsfwText = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--global-text-muted);
`;

const NsfwActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`;

const NsfwBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--primary-accent);
  color: var(--global-primary-bg);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`;

const NsfwOutline = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: transparent;
  color: var(--global-text-muted);
  border: 1px solid var(--global-border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
`;

// Own 1-10 rating badge on an episode row (Aniraku AnimeDetail.jsx:224
// RatingBadge, verbatim colors) — shown when the user has rated the episode.
const RatingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
`;

const Info: React.FC = () => {
  const { animeId } = useParams<{ animeId?: string }>();
  // Wave B — bookmark store (module singleton; supabase session bridge, no
  // auth-hook import). Declared with the other hooks, above every early
  // return, so the hook order stays stable.
  const { isBookmarked, toggleBookmark } = useBookmarks();
  // NSFW (Aniraku AnimeDetail.jsx:632) + own episode ratings (AnimeDetail
  // :641) — both hooks sit above every early return.
  const { nsfwEnabled } = useNsfw();
  const [episodeRatings, setEpisodeRatings] = useState<Record<number, number>>(
    {},
  );
  const [animeInfo, setAnimeInfo] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  // Hero details card (≤950, full-width under the poster/title row):
  // collapsed by default; open state expands to natural height.
  const [heroDetailsOpen, setHeroDetailsOpen] = useState(false);
  // Desktop (≥951px) details cap: max-height so the sidebar panel ends
  // where the main column (trailer/tab panel) ends, with internal scroll.
  // Null = uncapped (mobile stack, or before first measure).
  const [detailsMaxHeight, setDetailsMaxHeight] = useState<number | null>(
    null,
  );
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const mainColRef = useRef<HTMLDivElement>(null);
  const dataWrapperRef = useRef<HTMLDivElement>(null);
  const trailerBoxRef = useRef<HTMLDivElement>(null);
  const trailerFrameRef = useRef<HTMLIFrameElement>(null);
  // Scroll-visibility for the fade edges: [startFade, endFade] per scroller.
  const [charVis, setCharVis] = useState<[boolean, boolean]>([false, false]);
  const [artVis, setArtVis] = useState<[boolean, boolean]>([false, false]);
  const [relatedVis, setRelatedVis] = useState<[boolean, boolean]>([
    false,
    false,
  ]);
  const [recsVis, setRecsVis] = useState<[boolean, boolean]>([false, false]);
  const charGridRef = useRef<HTMLDivElement>(null);
  const artGridRef = useRef<HTMLDivElement>(null);
  const relatedScrollRef = useRef<HTMLUListElement>(null);
  const recsScrollRef = useRef<HTMLUListElement>(null);

  // Tab state — effective localStorage record `aniraku:navigation`
  // `.infoSection[mediaId]` (live `INFO_SECTION`), defaulting to Overview.
  // No query-param read: the stored section (or Overview) is the entry tab.
  const [activeSection, setActiveSection] = useState<InfoTab>('Overview');
  // Stored `listLayout-[{animeId}]`; null → EpisodeList's default heuristic,
  // resolved in the render body once `episodes` has loaded.
  const [storedEpisodeMode, setStoredEpisodeMode] = useState<EpisodeMode | null>(
    () => readListLayout(animeId),
  );
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [artFilter, setArtFilter] = useState('all');
  const [artIndex, setArtIndex] = useState<number | null>(null);
  const [characterLanguage, setCharacterLanguage] = useState('Japanese');
  // Episodes toolbar — spoiler toggle persists in the live `aniraku:settings`
  // record (our useSettings subset has no hideSpoiler), default false.
  const [hideSpoiler, setHideSpoiler] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('aniraku:settings');
      const record = raw ? JSON.parse(raw) : null;
      return !!record?.settings?.hideSpoiler;
    } catch {
      return false;
    }
  });
  // live `$t` interval state — [start, end] bounds of the 100-page slice.
  const [episodeInterval, setEpisodeInterval] = useState<[number, number]>([
    0,
    99,
  ]);

  // live `qt` spoiler toggle: flips `settings.hideSpoiler` in the unified
  // `aniraku:settings` record with a merge-write preserving theme and
  // schemaVersion (our useSettings subset doesn't expose hideSpoiler —
  // pattern copied from SettingsProvider's record writer).
  const toggleSpoilers = () => {
    const next = !hideSpoiler;
    setHideSpoiler(next);
    try {
      const raw = localStorage.getItem('aniraku:settings');
      const record: Record<string, unknown> = raw ? JSON.parse(raw) : {};
      const base =
        record && typeof record === 'object' ? (record as Record<string, unknown>) : {};
      const settings =
        base.settings && typeof base.settings === 'object'
          ? { ...(base.settings as Record<string, unknown>) }
          : {};
      localStorage.setItem(
        'aniraku:settings',
        JSON.stringify({
          ...base,
          settings: { ...settings, hideSpoiler: next },
          // seed only when missing — SettingsProvider stamps SCHEMA_VERSION 3
          schemaVersion:
            typeof base.schemaVersion === 'number' ? base.schemaVersion : 3,
        }),
      );
    } catch {
      // storage unavailable — in-session toggle still applies
    }
  };

  // live `zt` mount: read the stored section, validate it against the tab
  // set (readInfoSection falls back to Overview) and write the resolution
  // back so stale/legacy values normalise into the record map.
  useEffect(() => {
    if (!animeId) return;
    const stored = readInfoSection(animeId);
    setActiveSection(stored);
    writeInfoSection(animeId, stored);
    setDetailsExpanded(false);
    setHeroDetailsOpen(false);
    setStoredEpisodeMode(readListLayout(animeId));
    setEpisodeSearch('');
    setArtFilter('all');
    setArtIndex(null);
    setCharacterLanguage('Japanese');
  }, [animeId]);

  // Load media + episodes + supplementary AniList fields together.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!animeId) return;
      setLoading(true);
      setError(null);
      setDescExpanded(false);
      try {
        const [info, eps, supp] = await Promise.all([
          fetchAnimeData(animeId),
          fetchAnimeEpisodes(animeId).catch(() => []),
          fetchSupplementary(animeId),
        ]);
        if (mounted) {
          const merged: Anime = supp ? { ...info, ...supp } : info;
          setAnimeInfo(merged);
          setEpisodes(Array.isArray(eps) ? eps : []);
        }
      } catch (e) {
        console.error('Failed to load anime info:', e);
        if (mounted) {
          setError('Something went wrong');
          // D9 — live failure toast (mandate error string still renders below).
          showToast('Failed to load anime info', {
            description: 'Please try again later.',
            type: 'error',
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [animeId]);

  // Own episode ratings (Aniraku AnimeDetail.jsx:748-758): signed-in →
  // backend (`GET /api/v1/anime/{id}/ratings`); guest → LS
  // `aniraku-episode-ratings-{animeId}`.
  useEffect(() => {
    if (!animeId) return;
    let cancelled = false;
    setEpisodeRatings({});
    getSessionUserId()
      .then((userId) => {
        if (cancelled) return;
        if (userId) {
          fetchEpisodeRatings(animeId).then((ratings) => {
            if (!cancelled && ratings) setEpisodeRatings(ratings);
          });
        } else {
          try {
            const stored = JSON.parse(
              localStorage.getItem(`${EPISODE_RATINGS_LS_KEY}-${animeId}`) ||
                '{}',
            );
            if (!cancelled) setEpisodeRatings(stored || {});
          } catch {
            if (!cancelled) setEpisodeRatings({});
          }
        }
      })
      .catch(() => {
        // offline / unconfigured — no ratings to show
      });
    return () => {
      cancelled = true;
    };
  }, [animeId]);

  // Runtime SEO — old Aniraku setAnimeDetailSEO (seo.js:108-185) through the
  // shared useSeo helper. Replaces the live-parity manual effect: same
  // og/twitter/image/video.tv_show behavior, plus canonical on the canonical
  // domain (the old effect used window.location.origin → localhost
  // canonicals), per-page keywords, and JSON-LD (TVSeries|Movie + breadcrumb)
  // with helper-managed cleanup. Anime-shape notes: format lives in `type`,
  // episode count in `totalEpisodes` (`.episodes` is the episode list).
  const seoTitle = animeInfo ? displayTitle(animeInfo) : '';
  const seoFormat = animeInfo ? animeInfo.type || 'TV' : 'TV';
  const seoGenres = (animeInfo?.genres || []).join(', ');
  const seoImage = animeInfo
    ? `https://img.anili.st/media/${animeInfo.id}`
    : undefined;
  const seoPath = animeId ? `/info/${animeId}` : undefined;
  const seoPlot = animeInfo
    ? metaDescription(animeInfo.description || '')
    : undefined;
  const seoDate = (d?: { year?: number; month?: number; day?: number }) =>
    d?.year && d.month && d.day
      ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(
          d.day,
        ).padStart(2, '0')}`
      : '';
  useSeo({
    title: animeInfo
      ? `${seoTitle} — Watch ${seoFormat} Online Free | Aniraku`
      : 'Anime — Aniraku',
    description: animeInfo
      ? `Watch ${seoTitle} online for free on Aniraku. ${seoFormat}${
          animeInfo.totalEpisodes
            ? ` · ${animeInfo.totalEpisodes} episodes`
            : ''
        }${seoGenres ? ` · ${seoGenres}` : ''}. Stream in HD with subtitles and dub.`
      : undefined,
    ogDescription: seoPlot,
    keywords: animeInfo
      ? `${seoTitle}, watch ${seoTitle}, ${seoTitle} streaming, ${seoTitle} online free, ${seoTitle} sub, ${seoTitle} dub, ${seoFormat} anime, ${seoGenres}, anime streaming, aniraku`
      : undefined,
    canonicalPath: seoPath,
    image: seoImage,
    ogType: 'video.tv_show',
    jsonLd:
      animeInfo && seoPath
        ? [
            {
              '@context': 'https://schema.org',
              '@type': seoFormat === 'MOVIE' ? 'Movie' : 'TVSeries',
              name: seoTitle,
              url: `${SITE_URL}${seoPath}`,
              description:
                seoPlot || `Watch ${seoTitle} online for free on Aniraku.`,
              image: seoImage,
              genre: animeInfo.genres || [],
              startDate: seoDate(animeInfo.startDate),
              endDate: seoDate(animeInfo.endDate),
              numberOfEpisodes: animeInfo.totalEpisodes || 0,
              inLanguage: 'Japanese',
              contentRating: 'PG-13',
              provider: {
                '@type': 'Organization',
                name: 'Aniraku',
                url: SITE_URL,
              },
              isPartOf: {
                '@type': 'WebSite',
                name: 'Aniraku',
                url: SITE_URL,
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: `${SITE_URL}/`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Search',
                  item: `${SITE_URL}/search`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: seoTitle,
                  item: `${SITE_URL}${seoPath}`,
                },
              ],
            },
          ]
        : undefined,
  });

  // Watched episodes (localStorage `watched-episodes-{animeId}`), read once.
  const watchedSet = useMemo<Set<string>>(() => {
    try {
      const raw = animeId
        ? localStorage.getItem(`watched-episodes-${animeId}`)
        : null;
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return new Set<string>();
      return new Set<string>(
        arr
          .map((e: { id?: string }) => e?.id)
          .filter((v): v is string => typeof v === 'string'),
      );
    } catch {
      return new Set<string>();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId, episodes]);

  // D10 — fade-edge initial state + window-resize updates for all four
  // scrollers (chars/art grids, related/recs drag lists). Each tuple is
  // [startVisible, endVisible] = [!atStart, !atEnd] = live's
  // `!atTop`/`!atBottom`; runs on [animeInfo] so the DOM exists.
  useEffect(() => {
    const horizontal = (el: HTMLUListElement | null) =>
      el
        ? ([
            el.scrollLeft > 0,
            el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
          ] as [boolean, boolean])
        : null;
    const vertical = (el: HTMLDivElement | null) =>
      el
        ? ([
            el.scrollTop > 0,
            el.scrollTop + el.clientHeight < el.scrollHeight - 1,
          ] as [boolean, boolean])
        : null;
    const sync = () => {
      const c = vertical(charGridRef.current);
      if (c) setCharVis(c);
      const a = vertical(artGridRef.current);
      if (a) setArtVis(a);
      const r = horizontal(relatedScrollRef.current);
      if (r) setRelatedVis(r);
      const s = horizontal(recsScrollRef.current);
      if (s) setRecsVis(s);
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [animeInfo]);

  // Desktop details cap (≥951px): panel max-height = main column height
  // minus the poster block minus the row gap, so the details END where the
  // trailer/tab panel ends (internal scroll handles the overflow). Mobile
  // stacks naturally → uncapped. Re-measures on content/resize changes;
  // ResizeObservers catch late image/iframe loads.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 951px)');
    const compute = () => {
      if (!mq.matches) {
        setDetailsMaxHeight(null);
        return;
      }
      const main = mainColRef.current;
      const hero = heroPanelRef.current;
      const wrap = dataWrapperRef.current;
      if (!main || !hero) return;
      const gap = wrap
        ? parseFloat(getComputedStyle(wrap).rowGap || '0') || 0
        : 0;
      const cap =
        main.getBoundingClientRect().height -
        hero.getBoundingClientRect().height -
        gap;
      setDetailsMaxHeight(Math.max(128, Math.round(cap)));
    };
    compute();
    window.addEventListener('resize', compute);
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(compute)
        : null;
    if (observer) {
      if (mainColRef.current) observer.observe(mainColRef.current);
      if (heroPanelRef.current) observer.observe(heroPanelRef.current);
    }
    const onMqChange = () => compute();
    if (mq.addEventListener) mq.addEventListener('change', onMqChange);
    return () => {
      window.removeEventListener('resize', compute);
      observer?.disconnect();
      if (mq.removeEventListener) mq.removeEventListener('change', onMqChange);
    };
  }, [animeInfo, activeSection, descExpanded]);

  if (loading) {
    return (
      <InfoContainer>
        <SkeletonPlayer />
        <StyledCardGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </StyledCardGrid>
      </InfoContainer>
    );
  }

  if (error || !animeInfo) {
    return (
      <InfoContainer>
        <ErrorBox>{error ?? 'Something went wrong'}</ErrorBox>
      </InfoContainer>
    );
  }

  // NSFW gate (Aniraku AnimeDetail.jsx:878-895): a Hentai-genre title stays
  // behind the settings gate while the preference is OFF (default).
  if (isNsfw(animeInfo) && !nsfwEnabled) {
    return (
      <InfoContainer>
        <NsfwCard>
          <div style={{ fontSize: 48, marginBottom: 16 }}>18+</div>
          <NsfwTitle>Mature Content</NsfwTitle>
          <NsfwText>
            This title contains adult content. Enable NSFW content in your
            settings to view it.
          </NsfwText>
          <NsfwActions>
            <NsfwBtn to='/profile/settings'>Open Settings</NsfwBtn>
            <NsfwOutline to='/'>Go Back</NsfwOutline>
          </NsfwActions>
        </NsfwCard>
      </InfoContainer>
    );
  }

  const title = displayTitle(animeInfo);
  const fullDesc = sanitizeText(animeInfo.description || '');
  // Wave B — bookmark state for the sidebar toggle (id = AniList id, else MAL).
  const bookmarkId = Number(animeInfo.id || animeInfo.malId);
  const hasBookmarkId = Number.isFinite(bookmarkId) && bookmarkId > 0;
  const bookmarked = hasBookmarkId && isBookmarked(bookmarkId);
  const accentColor = animeInfo.color || 'grey';
  const score = animeInfo.rating ? Math.round(animeInfo.rating * 10) : 0;
  const statusParam = STATUS_PARAMS[animeInfo.status];
  const genres = animeInfo.genres || [];
  const tags = animeInfo.tags || [];
  const characters = animeInfo.characters || [];
  const source = animeInfo.source || '';
  const searchTrailerUrl = trailerSearchUrl(animeInfo);
  const trailerId =
    animeInfo.trailer?.id &&
    (!animeInfo.trailer.site || animeInfo.trailer.site === 'youtube')
      ? animeInfo.trailer.id
      : '';
  // Banner: raw bannerImage when supplementary loaded; else detect from
  // cover (bannerImage||poster) differing from the poster (image).
  const bannerImage =
    animeInfo.bannerImage ??
    (animeInfo.cover && animeInfo.cover !== animeInfo.image
      ? animeInfo.cover
      : '');
  const hasBanner = !!bannerImage;
  // WATCH NOW / Watch free use live At(media) with NO episode param.
  const watchPath = watchPathFor(animeInfo);
  // Seasons strip (user spec): PREQUEL/SEQUEL anime relations only,
  // prequels first. Drives the details compaction (cut at End Date when
  // seasons exist, at Episodes otherwise) + the SEASONS strip itself.
  const seasonList = (animeInfo.relations || [])
    .filter(
      (rel) =>
        ['PREQUEL', 'SEQUEL'].includes(
          (rel.relationType || '').toUpperCase(),
        ) && !['manga', 'novel'].includes((rel.type || '').toLowerCase()),
    )
    .sort(
      (a, b) =>
        (a.relationType === 'PREQUEL' ? 0 : 1) -
        (b.relationType === 'PREQUEL' ? 0 : 1),
    );
  const hasSeasons = seasonList.length > 0;
  // live ft(): relations exclude source links and manga/novel nodes.
  const relatedList = (animeInfo.relations || []).filter(
    (rel) =>
      (rel.relationType || '').toLowerCase() !== 'source' &&
      !['manga', 'novel'].includes((rel.type || '').toLowerCase()),
  );
  // live pt(): recommendations exclude manga/novel nodes. NSFW (Aniraku
  // AnimeDetail.jsx:658): recommendations additionally run through
  // filterAdult — Hentai-genre entries drop while the preference is OFF.
  const recsList = filterAdult(
    (animeInfo.recommendations || []).filter(
      (rec) => !['manga', 'novel'].includes((rec.type || '').toLowerCase()),
    ),
    nsfwEnabled,
  );

  // ---- sidebar `ht` rows ---------------------------------------------------
  const officialSite = (animeInfo.externalLinks || []).find(
    (link) => link?.site === 'Official Site' && link?.url,
  );
  const startText = formatDateValue(animeInfo.startDate);
  const endText = formatDateValue(animeInfo.endDate);
  // live labels the start row "Release Date" when both dates are identical.
  const sameDate =
    !!animeInfo.startDate?.year &&
    !!animeInfo.endDate?.year &&
    animeInfo.startDate.month === animeInfo.endDate.month &&
    animeInfo.startDate.day === animeInfo.endDate.day &&
    animeInfo.startDate.year === animeInfo.endDate.year;
  const lastUpdate = formatLastUpdate(animeInfo.updatedAt);
  const studioNames = (animeInfo.studios || []).join(', ') || 'Unknown';
  const variantRows = titleVariantRows(animeInfo.title, readLangTitle());

  // Stat chips are rendered into both breakpoint title blocks — live mounts
  // `_t` inside `Ze` (mobile, beside the poster, NO season chip) and again
  // inside `vt` (desktop, showSeason: !0), each gated by its wrapper's
  // display rule.
  const chipList = (showSeason: boolean) => (
    <ChipList>
      {animeInfo.type && (
        <StatChip
          to={`/search?format=${encodeURIComponent(
            animeInfo.type,
          )}&sort=POPULARITY_DESC&type=ANIME`}
          style={genreTagVars(accentColor)}
        >
          {animeInfo.type}
        </StatChip>
      )}
      {!!animeInfo.startDate?.year && (
        <StatChip
          to={`/search?startDate_like=${encodeURIComponent(
            String(animeInfo.startDate.year),
          )}%25&sort=POPULARITY_DESC&type=ANIME`}
          style={genreTagVars(accentColor)}
        >
          {animeInfo.startDate.year}
        </StatChip>
      )}
      {statusParam && (
        <StatChip
          to={`/search?status=${encodeURIComponent(
            statusParam,
          )}&sort=POPULARITY_DESC&type=ANIME`}
          style={genreTagVars(accentColor)}
        >
          {displayStatus(animeInfo.status)}
        </StatChip>
      )}
      {!!score && (
        <StatChip
          to={`/search?averageScoreMax=${encodeURIComponent(
            String(score),
          )}&sort=POPULARITY_DESC&type=ANIME`}
          style={genreTagVars(accentColor)}
        >
          {score}%
        </StatChip>
      )}
      {showSeason && !!animeInfo.season && (
        <StatChip
          to={`/search?season=${encodeURIComponent(
            animeInfo.season,
          )}&sort=POPULARITY_DESC&type=ANIME`}
          style={genreTagVars(accentColor)}
        >
          {capitalize(animeInfo.season)}
        </StatChip>
      )}
    </ChipList>
  );

  // Characters tab — languages gathered from `voiceActors[].language` (live
  // `Ft` collects `languageV2` the same way).
  const languageSet = new Set<string>();
  characters.forEach((character) =>
    (character.voiceActors || []).forEach((actor) => {
      if (actor.language) languageSet.add(actor.language);
    }),
  );
  const characterLanguages = Array.from(languageSet);

  // Artwork tab — live `Nt` labels over whatever artwork rows we can source
  // (live itself reads `tvdbArtwork` from its own `anilist.merged` backend).
  const artworkItems = collectArtwork(animeInfo, bannerImage);
  const artworkTypes = Array.from(
    new Set(['all', ...artworkItems.map((item) => item.type)]),
  );
  const filteredArtwork =
    artFilter === 'all'
      ? artworkItems
      : artworkItems.filter((item) => item.type === artFilter);
  const lightboxItem =
    artIndex !== null ? filteredArtwork[artIndex] ?? null : null;

  // Episodes tab — stored preference wins, else live's `C` heuristic
  // (episodes are loaded by this point — the `loading` arm can't trigger).
  const episodeMode: EpisodeMode =
    storedEpisodeMode ?? episodeHeuristic(episodes);
  const episodeQuery = episodeSearch.trim().toLowerCase();
  // live `A`: 100-episode interval options for the toolbar range box.
  const intervalOptions = episodes.reduce<{ start: number; end: number }[]>(
    (acc, _, index) => {
      if (index % 100 === 0) {
        acc.push({
          start: index,
          end: Math.min(index + 99, episodes.length - 1),
        });
      }
      return acc;
    },
    [],
  );
  // live `ee`: a search shows every match; otherwise slice the selected
  // 100-page interval.
  const visibleEpisodes = episodeQuery
    ? episodes.filter(
        (ep) =>
          String(ep.number).includes(episodeQuery) ||
          (ep.title || '').toLowerCase().includes(episodeQuery),
      )
    : episodes.slice(episodeInterval[0], episodeInterval[1] + 1);
  // live `$t` dubCount — passed from Watch's context there; the Info route
  // has no progress/dub source → the dub meta icon stays hidden (flagged).
  const dubCount: number | null = null;

  // Compact-details middle rows (Duration → End Date): rendered inline when
  // the anime has prequel/sequel (cut at End Date), otherwise parked inside
  // DetailsExtra behind the Show-more toggle (cut at Episodes). Single
  // definition — only one branch ever mounts. All desktop-only rows
  // ($hideOnMobile); mobile keeps its full hero-card copy.
  const midRows = (
    <>
      <DetailRow key='duration' $hideOnMobile>
        Duration
        <span>
          {animeInfo.duration ? `${animeInfo.duration} min` : 'Unknown'}
        </span>
      </DetailRow>
      <DetailRow key='season' $hideOnMobile>
        Season
        <span>
          {animeInfo.season && animeInfo.releaseDate ? (
            <Link
              to={`/search?season=${encodeURIComponent(
                animeInfo.season,
              )}&startDate_like=${animeInfo.releaseDate}%25`}
            >
              {`${capitalize(animeInfo.season)} ${animeInfo.releaseDate}`}
            </Link>
          ) : animeInfo.season ? (
            capitalize(animeInfo.season)
          ) : animeInfo.releaseDate ? (
            String(animeInfo.releaseDate)
          ) : (
            'Unknown'
          )}
        </span>
      </DetailRow>
      <DetailRow key='rating' $hideOnMobile>
        Rating
        <span>{score ? `${score}/100` : 'Unknown'}</span>
      </DetailRow>
      <DetailRow key='source' $hideOnMobile>
        Source
        <span>
          {source ? (
            <Link to={`/search?source=${encodeURIComponent(source)}`}>
              {capitalize(source)}
            </Link>
          ) : (
            'Unknown'
          )}
        </span>
      </DetailRow>
      <DetailRow key='start-date' $hideOnMobile>
        {sameDate ? 'Release Date' : 'Start Date'}
        <span>
          {startText ? (
            animeInfo.startDate?.year ? (
              <Link to={startDateSearchPath(animeInfo.startDate.year)}>
                {startText}
              </Link>
            ) : (
              startText
            )
          ) : (
            'Unknown'
          )}
        </span>
      </DetailRow>
      {!sameDate && (
        <DetailRow key='end-date' $hideOnMobile>
          End Date
          <span>
            {endText ? (
              animeInfo.endDate?.year ? (
                <Link to={startDateSearchPath(animeInfo.endDate.year)}>
                  {endText}
                </Link>
              ) : (
                endText
              )
            ) : (
              'Unknown'
            )}
          </span>
        </DetailRow>
      )}
    </>
  );

  return (
    <InfoContainer>
      {/* live `zt`: banner sits behind (zIndex:-1), infoDataWrapper below */}
      <BannerImg
        src={hasBanner ? bannerImage : BANNER_PLACEHOLDER}
        alt='Banner'
        style={{
          filter: hasBanner ? 'grayscale(0%)' : 'grayscale(100%)',
          opacity: hasBanner ? 1 : 0.2,
        }}
      />
      <DataWrapper ref={dataWrapperRef}>
        {/* side column — poster block (`bt`) + details rows (`Ve > ht`) */}
        <SideColumn>
          <HeroPanel ref={heroPanelRef}>
            <HeroRow>
              <PosterCol>
                <CoverCard>
                  <Poster
                    src={animeInfo.image || POSTER_PLACEHOLDER}
                    alt='Cover'
                  />
                </CoverCard>
                <PosterActions>
                  <WatchNow to={watchPath} title={`Watch ${title} Now`}>
                    <FaPlay />
                    <WatchLabelWide>WATCH NOW</WatchLabelWide>
                    <WatchLabelNarrow>WATCH</WatchLabelNarrow>
                  </WatchNow>
                  {hasBookmarkId && (
                    <BookmarkToggle
                      type='button'
                      $active={bookmarked}
                      aria-pressed={bookmarked}
                      aria-label={
                        bookmarked
                          ? `Remove ${title} from bookmarks`
                          : `Bookmark ${title}`
                      }
                      title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                      onClick={() => {
                        void toggleBookmark({
                          id: bookmarkId,
                          title,
                          image: animeInfo.image || '',
                        });
                      }}
                    >
                      {bookmarked ? (
                        <FaBookmark aria-hidden='true' />
                      ) : (
                        <FaRegBookmark aria-hidden='true' />
                      )}
                      <BookmarkLabelWide>
                        {bookmarked ? 'BOOKMARKED' : 'BOOKMARK'}
                      </BookmarkLabelWide>
                      <BookmarkLabelNarrow>
                        {bookmarked ? 'SAVED' : 'SAVE'}
                      </BookmarkLabelNarrow>
                    </BookmarkToggle>
                  )}
                </PosterActions>
                {(animeInfo.id || animeInfo.malId) && (
                  <StatsRow>
                    {animeInfo.id && (
                      <StatsLink
                        href={`https://anilist.co/anime/${animeInfo.id}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        title='AniList'
                      >
                        <SiAnilist size='1.2rem' />
                      </StatsLink>
                    )}
                    {animeInfo.malId && (
                      <StatsLink
                        href={`https://myanimelist.net/anime/${animeInfo.malId}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        title='MyAnimeList'
                      >
                        <SiMyanimelist size='2.4rem' />
                      </StatsLink>
                    )}
                  </StatsRow>
                )}
              </PosterCol>
              {/* live `Ze` (infoMobileTitle): h1 + chips beside the poster;
                  the synopsis lives full-width below this row
                  (MobileSynopsis) instead of squeezed into this column */}
              <TitleBlock $mobile>
                <Title $mobile>{title}</Title>
                {chipList(false)}
              </TitleBlock>
            </HeroRow>
            {/* Mobile synopsis — full-width, 4-line clamp collapsed, tap to
                expand to full text */}
            {fullDesc && (
              <MobileSynopsis>
                <MobileSynopsisText
                  $expanded={descExpanded}
                  onClick={() => setDescExpanded((v) => !v)}
                >
                  {fullDesc}
                </MobileSynopsisText>
              </MobileSynopsis>
            )}
            {/* ONE details block ≤950 (double-details fix): full-width card
                under the poster/title row — roomier than the old narrow
                2nd-column card. Collapsed by default, natural height when
                open (page scrolls). Hidden ≥951 by its own styles;
                desktop keeps its details rows in the sidebar panel. */}
            <HeroDetailsCard>
                  <HeroDetailsToggle
                    type='button'
                    aria-expanded={heroDetailsOpen}
                    aria-label={heroDetailsOpen ? 'Hide details' : 'Show details'}
                    onClick={() => setHeroDetailsOpen((v) => !v)}
                  >
                    Details
                    <FaChevronDown />
                  </HeroDetailsToggle>
                  {heroDetailsOpen && (
                    <HeroDetailsList>
                      <HeroDetailRow>
                        <span>Format:</span>
                        {animeInfo.type ? (
                          <Link
                            to={`/search?format=${encodeURIComponent(
                              animeInfo.type,
                            )}&type=ANIME`}
                          >
                            {capitalize(animeInfo.type)}
                          </Link>
                        ) : (
                          'Unknown'
                        )}
                      </HeroDetailRow>
                      <HeroDetailRow>
                        <span>Status:</span>
                        {displayStatus(animeInfo.status)}
                      </HeroDetailRow>
                      <HeroDetailRow>
                        <span>Episodes:</span>
                        {animeInfo.totalEpisodes || episodes.length || 'Unknown'}
                      </HeroDetailRow>
                      <HeroDetailRow>
                        <span>Rating:</span>
                        {score ? `${score}/100` : 'Unknown'}
                      </HeroDetailRow>
                      <HeroDetailRow>
                        <span>Duration:</span>
                        {animeInfo.duration
                          ? `${animeInfo.duration} min`
                          : 'Unknown'}
                      </HeroDetailRow>
                      <HeroDetailRow>
                        <span>Season:</span>
                        {animeInfo.season && animeInfo.releaseDate ? (
                          <Link
                            to={`/search?season=${encodeURIComponent(
                              animeInfo.season,
                            )}&startDate_like=${animeInfo.releaseDate}%25`}
                          >
                            {`${capitalize(animeInfo.season)} ${animeInfo.releaseDate}`}
                          </Link>
                        ) : animeInfo.season ? (
                          capitalize(animeInfo.season)
                        ) : animeInfo.releaseDate ? (
                          String(animeInfo.releaseDate)
                        ) : (
                          'Unknown'
                        )}
                      </HeroDetailRow>
                      <HeroDetailRow>
                        <span>{sameDate ? 'Release Date:' : 'Start Date:'}</span>
                        {startText ? (
                          animeInfo.startDate?.year ? (
                            <Link
                              to={startDateSearchPath(animeInfo.startDate.year)}
                            >
                              {startText}
                            </Link>
                          ) : (
                            startText
                          )
                        ) : (
                          'Unknown'
                        )}
                      </HeroDetailRow>
                      {!sameDate && (
                        <HeroDetailRow>
                          <span>End Date:</span>
                          {endText ? (
                            animeInfo.endDate?.year ? (
                              <Link
                                to={startDateSearchPath(animeInfo.endDate.year)}
                              >
                                {endText}
                              </Link>
                            ) : (
                              endText
                            )
                          ) : (
                            'Unknown'
                          )}
                        </HeroDetailRow>
                      )}
                      <HeroDetailRow>
                        <span>Country:</span>
                        {animeInfo.countryOfOrigin ? (
                          <Link
                            to={`/search?countryOfOrigin=${encodeURIComponent(
                              animeInfo.countryOfOrigin,
                            )}`}
                          >
                            {countryName(animeInfo.countryOfOrigin)}
                          </Link>
                        ) : (
                          'Unknown'
                        )}
                      </HeroDetailRow>
                      <HeroDetailRow>
                        <span>Adult:</span>
                        {animeInfo.isAdult ? 'Yes' : 'No'}
                      </HeroDetailRow>
                      <HeroDetailRow>
                        <span>Studios:</span>
                        {studioNames}
                      </HeroDetailRow>
                      {variantRows.map((row) => (
                        <HeroDetailRow key={`hero-variant-${row.label}`}>
                          <span>{row.label}:</span>
                          {row.value}
                        </HeroDetailRow>
                      ))}
                      {lastUpdate && (
                        <HeroDetailRow>
                          <span>Last Update:</span>
                          {lastUpdate}
                        </HeroDetailRow>
                      )}
                      {officialSite && (
                        <HeroDetailRow>
                          <span>Official Site:</span>
                          <a
                            href={officialSite.url}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            {officialSite.url
                              .replace(/^https?:\/\//, '')
                              .replace(/\/$/, '')}
                          </a>
                        </HeroDetailRow>
                      )}
                      <HeroDetailRow>
                        <span>Source:</span>
                        {source ? (
                          <Link
                            to={`/search?source=${encodeURIComponent(source)}`}
                          >
                            {capitalize(source)}
                          </Link>
                        ) : (
                          'Unknown'
                        )}
                      </HeroDetailRow>
                    </HeroDetailsList>
                  )}
                </HeroDetailsCard>
          </HeroPanel>

          <DetailsWrapper>
            <DetailsPanel
              style={
                detailsMaxHeight == null
                  ? undefined
                  : { maxHeight: detailsMaxHeight, overflowY: 'auto' as const }
              }
            >
              {!!officialSite && (
                <DetailRow key='official-site' $hideOnMobile>
                  Official Site
                  <span>
                    <strong>
                      <a
                        href={officialSite.url}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {officialSite.url
                          .replace(/^https?:\/\//, '')
                          .replace(/\/$/, '')}
                      </a>
                    </strong>
                  </span>
                </DetailRow>
              )}
              <DetailRow key='format' $hideOnMobile>
                Format
                <span>
                  {animeInfo.type ? (
                    <Link
                      to={`/search?format=${encodeURIComponent(
                        animeInfo.type,
                      )}&type=ANIME`}
                    >
                      {capitalize(animeInfo.type)}
                    </Link>
                  ) : (
                    'Unknown'
                  )}
                </span>
              </DetailRow>
              <DetailRow key='status' $hideOnMobile>
                Status
                <span>{displayStatus(animeInfo.status)}</span>
              </DetailRow>
              <DetailRow key='episodes' $hideOnMobile>
                Episodes
                <span>
                  {animeInfo.totalEpisodes || episodes.length || 'Unknown'}
                </span>
              </DetailRow>
              {/* Compact details (user spec): without prequel/sequel the
                  panel ends at Episodes; with seasons it ends at End Date
                  (midRows). Everything after lives in DetailsExtra behind
                  the Show-more toggle. ≤950 the hero card carries the full
                  copy — one details block per breakpoint. */}
              {hasSeasons && midRows}
              {/* Genres + Tags — visible ≤950, behind the desktop show-more
                  toggle (live `ht` + `$e`); values = genreTag pills in an
                  `_infoTagsContainer` row (live's only visible copy) */}
              <DetailsExtra $expanded={detailsExpanded}>
                {/* Compacted rows (user spec): without seasons, midRows +
                    the rows below hide here behind Show more; with seasons,
                    only the rows below do. Desktop-only ($hideOnMobile);
                    mobile keeps its hero-card copy. */}
                {!hasSeasons && midRows}
                <DetailRow key='country' $hideOnMobile>
                  Country
                  <span>
                    {animeInfo.countryOfOrigin ? (
                      <Link
                        to={`/search?countryOfOrigin=${encodeURIComponent(
                          animeInfo.countryOfOrigin,
                        )}&sort=POPULARITY_DESC&type=ANIME`}
                      >
                        <b>{animeInfo.countryOfOrigin}</b>
                      </Link>
                    ) : (
                      'Unknown'
                    )}
                  </span>
                </DetailRow>
                <DetailRow key='adult' $hideOnMobile>
                  Adult
                  <span>{animeInfo.isAdult ? 'Yes' : 'No'}</span>
                </DetailRow>
                {variantRows.map((row) => (
                  <DetailRow key={`variant-${row.label}`} $hideOnMobile>
                    {row.label}
                    <span>{row.value}</span>
                  </DetailRow>
                ))}
                {lastUpdate && (
                  <DetailRow key='updated' $hideOnMobile>
                    Last Update
                    <span>{lastUpdate}</span>
                  </DetailRow>
                )}
                <DetailRow key='studios' $hideOnMobile>
                  Studios
                  <span>{studioNames}</span>
                </DetailRow>
                {genres.length > 0 && (
                  <DetailRow key='genres'>
                    Genres
                    <span>
                      <nav aria-label='Genres'>
                        <ChipList>
                          {genres.map((genre) => (
                            <Chip
                              key={genre}
                              to={`/search?genres=${plusEncode(genre)}`}
                              style={genreTagVars(accentColor)}
                            >
                              {genre}
                            </Chip>
                          ))}
                        </ChipList>
                      </nav>
                    </span>
                  </DetailRow>
                )}
                {tags.length > 0 && (
                  <DetailRow key='tags'>
                    Tags
                    <span>
                      <nav aria-label='Tags'>
                        <ChipList>
                          {tags.map((tag) => (
                            <Chip
                              key={tag.id}
                              to={`/search?tags=${plusEncode(tag.name)}`}
                              style={genreTagVars(accentColor)}
                            >
                              {tag.name}
                            </Chip>
                          ))}
                        </ChipList>
                      </nav>
                    </span>
                  </DetailRow>
                )}
              </DetailsExtra>

              <DetailsToggle
                type='button'
                aria-expanded={detailsExpanded}
                aria-label={detailsExpanded ? 'Show less' : 'Show more'}
                onClick={() => setDetailsExpanded((v) => !v)}
              >
                <FaChevronDown />
              </DetailsToggle>
            </DetailsPanel>
          </DetailsWrapper>
        </SideColumn>

        {/* main column — h1 + chips (`Qe`) + tab bar (`Rt`) + active panel */}
        <MainColumn ref={mainColRef}>
          <TitleBlock>
            <Title>{title}</Title>
            {chipList(true)}
          </TitleBlock>

          <TabBar role='tablist' aria-label='Anime info sections'>
            {INFO_TABS.map((tab) => (
              <Tab
                key={tab}
                id={`info-tab-${tab}`}
                type='button'
                role='tab'
                $active={activeSection === tab}
                aria-selected={activeSection === tab}
                aria-controls={`info-panel-${tab}`}
                onClick={() => {
                  setActiveSection(tab);
                  if (animeId) writeInfoSection(animeId, tab);
                }}
              >
                {tab}
              </Tab>
            ))}
          </TabBar>

          <TabPanel
            key={activeSection}
            id={`info-panel-${activeSection}`}
            role='tabpanel'
            aria-labelledby={`info-tab-${activeSection}`}
          >
            {activeSection === 'Overview' && (
              <OverviewBox>
                {(fullDesc || trailerId || searchTrailerUrl) && (
                  <TrailerBox ref={trailerBoxRef}>
                    {fullDesc && (
                      <DescriptionText
                        $expanded={descExpanded}
                        $desktopOnly
                        style={
                          descExpanded ? { maxHeight: 'none' } : undefined
                        }
                        onClick={() => setDescExpanded((v) => !v)}
                      >
                        {fullDesc}
                      </DescriptionText>
                    )}
                    {trailerId ? (
                      <TrailerFrame
                        ref={trailerFrameRef}
                        src={`https://www.youtube-nocookie.com/embed/${trailerId}`}
                        title={`${title} trailer`}
                        referrerPolicy='strict-origin-when-cross-origin'
                        allowFullScreen
                      />
                    ) : searchTrailerUrl ? (
                      <SearchTrailerBtn
                        href={searchTrailerUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        SEARCH TRAILER
                      </SearchTrailerBtn>
                    ) : null}
                    {/* live has NO description show-more here — `yt` expands
                        by click; the only show-more is the sidebar `$e` */}
                  </TrailerBox>
                )}
                {/* SEASONS strip (user spec): prequel/sequel cards with
                    PREQUEL/SEQUEL badges under the trailer, filling the
                    main-column space freed by the compacted details */}
                {seasonList.length > 0 && (
                  <SeasonsBox>
                    <SeasonsTitle>SEASONS</SeasonsTitle>
                    <SeasonsRow>
                      {seasonList.map((rel) => {
                        const kind =
                          (rel.relationType || '').toUpperCase() === 'SEQUEL'
                            ? 'SEQUEL'
                            : 'PREQUEL';
                        const card = toCardAnime(rel);
                        const sub =
                          card.totalEpisodes > 0
                            ? `${card.type} · ${card.totalEpisodes} EP`
                            : card.type;
                        return (
                          <SeasonCard
                            key={`${rel.relationType}-${rel.id}`}
                            to={infoPathFor(rel)}
                            title={listTitleOf(rel.title)}
                            aria-label={`${kind === 'SEQUEL' ? 'Sequel' : 'Prequel'}: ${listTitleOf(rel.title)}`}
                          >
                            <SeasonPoster
                              src={card.image || POSTER_PLACEHOLDER}
                              alt={listTitleOf(rel.title)}
                              loading='lazy'
                            />
                            <SeasonMeta>
                              <SeasonBadge $kind={kind}>{kind}</SeasonBadge>
                              <SeasonTitle>
                                {listTitleOf(rel.title)}
                              </SeasonTitle>
                              {sub && <SeasonSub>{sub}</SeasonSub>}
                            </SeasonMeta>
                          </SeasonCard>
                        );
                      })}
                    </SeasonsRow>
                  </SeasonsBox>
                )}
              </OverviewBox>
            )}


            {activeSection === 'Characters' &&
              (characters.length > 0 ? (
                <TabScroll>
                <TabSection>
                  <SectionBar>
                    <SectionBarLabel>
                      <FaUsers />
                      Characters & Voice Actors
                    </SectionBarLabel>
                    {characterLanguages.length > 0 && (
                      <BarSelect
                        value={
                          characterLanguages.includes(characterLanguage)
                            ? characterLanguage
                            : characterLanguages[0]
                        }
                        aria-label='Voice actor language'
                        onChange={(event) =>
                          setCharacterLanguage(event.target.value)
                        }
                      >
                        {characterLanguages.map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </BarSelect>
                    )}
                  </SectionBar>
                  <SectionScroll>
                    <SectionFade $visible={charVis[0]} />
                    <CharGrid
                      ref={charGridRef}
                      onScroll={(event) => {
                        const el = event.currentTarget;
                        setCharVis([
                          el.scrollTop > 0,
                          el.scrollTop + el.clientHeight < el.scrollHeight - 1,
                        ]);
                      }}
                    >
                      {characters.map((character) => {
                        const actor = (character.voiceActors || []).find(
                          (voice) =>
                            voice.language ===
                            (characterLanguages.includes(characterLanguage)
                              ? characterLanguage
                              : characterLanguages[0]),
                        );
                        const characterName = listTitleOf(character.name);
                        const characterUrl = `https://anilist.co/character/${character.id}`;
                        const staffUrl = actor
                          ? `https://anilist.co/staff/${actor.id}`
                          : '';
                        return (
                          <CharCardWrap key={character.id}>
                            <CharCard>
                              <CharImage
                                src={character.image || POSTER_PLACEHOLDER}
                                alt={characterName}
                              />
                              <CharDetails>
                                <b>
                                  <a
                                    href={characterUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  >
                                    {characterName}
                                  </a>
                                </b>
                                {character.role && (
                                  <CharMuted>{character.role}</CharMuted>
                                )}
                              </CharDetails>
                              {actor && (
                                <>
                                  <CharDetails $right>
                                    <a
                                      href={staffUrl}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                    >
                                      {listTitleOf(actor.name) ||
                                        'Unknown Voice Actor'}
                                    </a>
                                    <CharMuted>{actor.language}</CharMuted>
                                  </CharDetails>
                                  <CharActorLink
                                    href={staffUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    aria-label={listTitleOf(actor.name)}
                                  >
                                    <CharImage
                                      src={actor.image || POSTER_PLACEHOLDER}
                                      alt={
                                        listTitleOf(actor.name) ||
                                        'Voice Actor Image'
                                      }
                                    />
                                  </CharActorLink>
                                </>
                              )}
                            </CharCard>
                          </CharCardWrap>
                        );
                      })}
                    </CharGrid>
                    <SectionFade $bottom $visible={charVis[1]} />
                  </SectionScroll>
                </TabSection>
                </TabScroll>
              ) : (
                <TabScroll>
                  <SectionEmpty>
                    <p>Characters not found</p>
                  </SectionEmpty>
                </TabScroll>
              ))}

            {activeSection === 'Artwork' &&
              (artworkItems.length > 0 ? (
                <TabScroll>
                <TabSection>
                  <SectionBar>
                    <SectionBarLabel>
                      <FaImage />
                      Artwork & Posters
                    </SectionBarLabel>
                    {artworkTypes.length > 0 && (
                      <BarSelect
                        value={artFilter}
                        aria-label='Artwork category'
                        onChange={(event) => {
                          setArtFilter(event.target.value);
                          setArtIndex(null);
                        }}
                      >
                        {artworkTypes.map((type) => (
                          <option key={type} value={type}>
                            {ARTWORK_LABELS[type] ?? type}
                          </option>
                        ))}
                      </BarSelect>
                    )}
                  </SectionBar>
                  <SectionScroll>
                    <SectionFade $visible={artVis[0]} />
                    <ArtGrid
                      ref={artGridRef}
                      onScroll={(event) => {
                        const el = event.currentTarget;
                        setArtVis([
                          el.scrollTop > 0,
                          el.scrollTop + el.clientHeight < el.scrollHeight - 1,
                        ]);
                      }}
                    >
                      {filteredArtwork.map((art, index) => (
                        <ArtImage
                          key={`${art.type}-${index}`}
                          src={art.img}
                          alt={`Art ${index + 1}`}
                          onClick={() => setArtIndex(index)}
                        />
                      ))}
                    </ArtGrid>
                    <SectionFade $bottom $visible={artVis[1]} />
                  </SectionScroll>
                </TabSection>
                </TabScroll>
              ) : (
                <TabScroll>
                  <SectionEmpty>
                    <p>Artwork not found</p>
                  </SectionEmpty>
                </TabScroll>
              ))}

            {activeSection === 'Episodes' &&
              (episodes.length > 0 ? (
                <TabScroll>
                <EpisodeListContainer>
                  <EpToolbar>
                    {intervalOptions.length > 1 ? (
                      <EpInterval
                        aria-label='Episode range'
                        value={`${episodeInterval[0]}-${episodeInterval[1]}`}
                        onChange={(event) => {
                          const [start, end] = event.target.value
                            .split('-')
                            .map(Number);
                          setEpisodeInterval([start, end]);
                          document
                            .getElementById('episodes-list-container')
                            ?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        {intervalOptions.map((option) => (
                          <option
                            key={`${option.start}-${option.end}`}
                            value={`${option.start}-${option.end}`}
                          >
                            {`${option.start + 1} - ${option.end + 1}`}
                          </option>
                        ))}
                      </EpInterval>
                    ) : (
                      /* live `m` label — quirk kept: shows the raw interval
                         bounds (e.g. "1 - 100") even with fewer episodes */
                      <EpIntervalBox>
                        {`${episodeInterval[0] + 1} - ${episodeInterval[1] + 1}`}
                      </EpIntervalBox>
                    )}
                    <EpFilter>
                      <EpFilterIcon>
                        <FaSearch />
                      </EpFilterIcon>
                      <EpFilterInput
                        type='text'
                        placeholder='Filter episodes...'
                        aria-label='Filter episodes'
                        value={episodeSearch}
                        onChange={(event) => setEpisodeSearch(event.target.value)}
                      />
                    </EpFilter>
                    <EpToolBtn
                      type='button'
                      title='Toggle Spoilers'
                      onClick={toggleSpoilers}
                    >
                      {hideSpoiler ? <FaEyeSlash /> : <FaEye />}
                    </EpToolBtn>
                    <EpToolBtn
                      type='button'
                      onClick={() => {
                        const next = nextListLayout(episodeMode);
                        setStoredEpisodeMode(next);
                        try {
                          if (animeId) {
                            localStorage.setItem(
                              `listLayout-[${animeId}]`,
                              next,
                            );
                          }
                        } catch {
                          // storage unavailable — mode still applies
                        }
                      }}
                    >
                      {episodeMode === 'list' && <ListModeIcon />}
                      {episodeMode === 'grid' && <FaTh />}
                      {episodeMode === 'imageList' && <FaImage />}
                    </EpToolBtn>
                  </EpToolbar>
                  {/* live renders the grid even for an empty interval/search
                      slice; "Episodes not found" shows only when the source
                      list itself is empty (outer branch) */}
                  <EpisodeGrid $mode={episodeMode} id='episodes-list-container'>
                    {visibleEpisodes.map((ep) => {
                      const row =
                        episodeMode === 'list' || episodeMode === 'imageList';
                      const isFiller = !!ep.filler;
                      // Your rating for this episode (Aniraku AnimeDetail
                      // :1049/1070 — `rated > 0` renders the star badge).
                      const rated = Number(episodeRatings[ep.number]) || 0;
                      return (
                        <EpisodeButton
                          key={ep.id}
                          $row={row}
                          data-episode-id={ep.id}
                          title={`EP ${ep.number}: ${ep.title}`}
                          aria-label={`EP ${ep.number}: ${ep.title}`}
                          aria-describedby={`episode-description-${ep.id}`}
                          tabIndex={0}
                          style={episodeVars(
                            /* isSelected — Info never highlights (no
                               episodeId on this route; live branch kept in
                               episodeVars for parity) */
                            false,
                            watchedSet.has(ep.id),
                            isFiller,
                            row,
                            episodeMode,
                          )}
                          to={watchPathFor(animeInfo, ep.number)}
                        >
                          <EpLink>
                            {episodeMode === 'imageList' ? (
                              <EpImageListContent>
                                <EpImageWrapper>
                                  {!ep.image ? (
                                    <EpImageFallback>
                                      {ep.number}
                                    </EpImageFallback>
                                  ) : (
                                    <>
                                      <EpImage
                                        $spoiler={hideSpoiler}
                                        src={ep.image}
                                        alt={
                                          hideSpoiler
                                            ? `EP ${ep.number}`
                                            : `EP ${ep.number} titled '${ep.title}'`
                                        }
                                      />
                                      <EpSpoilerOverlay $visible={hideSpoiler}>
                                        HIDDEN SPOILER
                                      </EpSpoilerOverlay>
                                      <EpLabel>EP {ep.number}</EpLabel>
                                    </>
                                  )}
                                </EpImageWrapper>
                                <EpDescriptionWrapper>
                                  <EpImageListHeader>
                                    <EpEpisodeNumber $strong>
                                      {ep.title}
                                    </EpEpisodeNumber>
                                  </EpImageListHeader>
                                  <EpDescription
                                    id={`episode-description-${ep.id}`}
                                  >
                                    {ep.description}
                                  </EpDescription>
                                  <EpImageListFooter>
                                    <EpMetaIcons>
                                      <CcMetaIcon size='0.9rem' />
                                      {dubCount !== null &&
                                        ep.number <= dubCount && (
                                          <FaMicrophone size='0.75rem' />
                                        )}
                                      {isFiller && (
                                        <FillerTagIcon size='0.9rem' />
                                      )}
                                      {rated > 0 && (
                                        <RatingBadge
                                          title={`You rated this episode ${rated}/10`}
                                        >
                                          <FaStar size={8} /> {rated}/10
                                        </RatingBadge>
                                      )}
                                    </EpMetaIcons>
                                    {ep.airDate && (
                                      <EpAirDate>
                                        {formatAirDate(ep.airDate)}
                                      </EpAirDate>
                                    )}
                                  </EpImageListFooter>
                                </EpDescriptionWrapper>
                              </EpImageListContent>
                            ) : episodeMode === 'grid' ? (
                              <EpGridContent>
                                <EpEpisodeNumber>{ep.number}</EpEpisodeNumber>
                                {rated > 0 && (
                                  <RatingBadge
                                    title={`You rated this episode ${rated}/10`}
                                  >
                                    <FaStar size={8} /> {rated}/10
                                  </RatingBadge>
                                )}
                              </EpGridContent>
                            ) : (
                              <EpListContent>
                                <EpListTitleGroup>
                                  <div>
                                    <EpEpisodeNumber $strong>
                                      {ep.number}.
                                    </EpEpisodeNumber>
                                  </div>
                                  <EpEpisodeNumber>
                                    {ep.title || `EP ${ep.number}`}
                                  </EpEpisodeNumber>
                                </EpListTitleGroup>
                                <EpMetaIcons>
                                  <CcMetaIcon size='0.9rem' />
                                  {dubCount !== null && ep.number <= dubCount && (
                                    <FaMicrophone size='0.75rem' />
                                  )}
                                  {isFiller && <FillerTagIcon size='0.9rem' />}
                                  {rated > 0 && (
                                    <RatingBadge
                                      title={`You rated this episode ${rated}/10`}
                                    >
                                      <FaStar size={8} /> {rated}/10
                                    </RatingBadge>
                                  )}
                                </EpMetaIcons>
                              </EpListContent>
                            )}
                          </EpLink>
                        </EpisodeButton>
                      );
                    })}
                  </EpisodeGrid>
                </EpisodeListContainer>
                </TabScroll>
              ) : (
                <TabScroll>
                  <EmptyState>
                    <p>Episodes not found</p>
                  </EmptyState>
                </TabScroll>
              ))}
          </TabPanel>
        </MainColumn>
      </DataWrapper>

      {/* live `Et` + `Tt` — RELATED / RECOMMENDATIONS drag lists
          (`_infoRelatedContentContainer`, margin-left 2rem ≥951) */}
      {(relatedList.length > 0 || recsList.length > 0) && (
        <RelatedContent>
          {relatedList.length > 0 && (
            <DragListBox>
              <DragListTitle>RELATED</DragListTitle>
              <DragListRelative>
                <DragListWrapper
                  ref={relatedScrollRef}
                  onScroll={(event) => {
                    const el = event.currentTarget;
                    setRelatedVis([
                      el.scrollLeft > 0,
                      el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
                    ]);
                  }}
                >
                  {relatedList.map((rel) => (
                    <DragListItem key={`${rel.relationType}-${rel.id}`}>
                      <CardItem anime={toCardAnime(rel)} />
                    </DragListItem>
                  ))}
                </DragListWrapper>
                <DragListFade $side='left' $visible={relatedVis[0]} />
                <DragListFade $side='right' $visible={relatedVis[1]} />
                <DragListScrollBtn
                  $side='left'
                  type='button'
                  aria-label='Scroll related backwards'
                  data-visible={relatedVis[0] ? 'true' : 'false'}
                  onClick={() =>
                    relatedScrollRef.current?.scrollBy({
                      left: window.innerWidth < 600 ? -350 : -800,
                      behavior: 'smooth',
                    })
                  }
                >
                  <DragNudge $left>
                    <FaChevronLeft />
                  </DragNudge>
                </DragListScrollBtn>
                <DragListScrollBtn
                  $side='right'
                  type='button'
                  aria-label='Scroll related forwards'
                  data-visible={relatedVis[1] ? 'true' : 'false'}
                  onClick={() =>
                    relatedScrollRef.current?.scrollBy({
                      left: window.innerWidth < 600 ? 350 : 800,
                      behavior: 'smooth',
                    })
                  }
                >
                  <DragNudge>
                    <FaChevronRight />
                  </DragNudge>
                </DragListScrollBtn>
              </DragListRelative>
            </DragListBox>
          )}

          {recsList.length > 0 && (
            <DragListBox>
              <DragListTitle>RECOMMENDATIONS</DragListTitle>
              <DragListRelative>
                <DragListWrapper
                  ref={recsScrollRef}
                  onScroll={(event) => {
                    const el = event.currentTarget;
                    setRecsVis([
                      el.scrollLeft > 0,
                      el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
                    ]);
                  }}
                >
                  {recsList.map((rec) => (
                    <DragListItem key={rec.id}>
                      <CardItem anime={toCardAnime(rec)} />
                    </DragListItem>
                  ))}
                </DragListWrapper>
                <DragListFade $side='left' $visible={recsVis[0]} />
                <DragListFade $side='right' $visible={recsVis[1]} />
                <DragListScrollBtn
                  $side='left'
                  type='button'
                  aria-label='Scroll recommendations backwards'
                  data-visible={recsVis[0] ? 'true' : 'false'}
                  onClick={() =>
                    recsScrollRef.current?.scrollBy({
                      left: window.innerWidth < 600 ? -350 : -800,
                      behavior: 'smooth',
                    })
                  }
                >
                  <DragNudge $left>
                    <FaChevronLeft />
                  </DragNudge>
                </DragListScrollBtn>
                <DragListScrollBtn
                  $side='right'
                  type='button'
                  aria-label='Scroll recommendations forwards'
                  data-visible={recsVis[1] ? 'true' : 'false'}
                  onClick={() =>
                    recsScrollRef.current?.scrollBy({
                      left: window.innerWidth < 600 ? 350 : 800,
                      behavior: 'smooth',
                    })
                  }
                >
                  <DragNudge>
                    <FaChevronRight />
                  </DragNudge>
                </DragListScrollBtn>
              </DragListRelative>
            </DragListBox>
          )}
        </RelatedContent>
      )}

      {/* live `Dt` — overlay (close) > content(img, stop) + nav(prev/next,
          stop): no close button, no count — close = overlay click only */}
      {lightboxItem && (
        <Lightbox
          role='dialog'
          aria-modal='true'
          aria-label='Artwork preview'
          onClick={() => setArtIndex(null)}
        >
          <LightboxContent onClick={(event) => event.stopPropagation()}>
            <LightboxImg src={lightboxItem.img} alt='Selected Artwork' />
          </LightboxContent>
          <LightboxNav>
            <LightboxBtn
              type='button'
              aria-label='Previous artwork'
              onClick={(event) => {
                event.stopPropagation();
                setArtIndex(
                  (artIndex! - 1 + filteredArtwork.length) %
                    filteredArtwork.length,
                );
              }}
            >
              <FaChevronLeft />
            </LightboxBtn>
            <LightboxBtn
              type='button'
              aria-label='Next artwork'
              onClick={(event) => {
                event.stopPropagation();
                setArtIndex(((artIndex ?? 0) + 1) % filteredArtwork.length);
              }}
            >
              <FaChevronRight />
            </LightboxBtn>
          </LightboxNav>
        </Lightbox>
      )}

      <InfoComments media={animeInfo} loading={loading} />
    </InfoContainer>
  );
};

export default Info;
