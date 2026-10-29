import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  FaChevronDown,
  FaCheck,
  FaClosedCaptioning,
  FaDownload,
  FaFlag,
  FaMicrophone,
  FaServer,
  FaShare,
  FaVolumeUp,
} from 'react-icons/fa';
import { FaFilm } from 'react-icons/fa6';
import { ReportModal } from '../ReportModal';
import DownloadDialog from './DownloadDialog';

// MediaSource — episode bar plus server/language dropdowns.
// Server/language selection is keyed `${lang}:${name}` so the SAME backend
// name (Niko/Momo exist in BOTH sub and dub) can never collide — that name
// collision was the core server-selection bug (Dub always snapped back to
// Sub because `serverLangOf` preferred the sub pool).

interface MediaSourceProps {
  sourceType: string;
  setSourceType: (sourceType: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  episodeId?: string;
  episodeTitle?: string;
  episodeAirDate?: string | null;
  episodeDescription?: string | null;
  airingTime?: string;
  nextEpisodenumber?: string;
  /** Series display name — labels the download pill. */
  seriesTitle?: string;
  // All Aniraku servers for this episode (direct HLS + embed providers).
  serversSub?: any[];
  serversDub?: any[];
  /** `${lang}:${name}` selection key (never a bare name — see above). */
  selectedServer?: string;
  onSelectServer?: (key: string, lang: 'sub' | 'dub') => void;
  /** Total episodes — drives the per-language count pills. */
  totalEpisodes?: number;
  /**
   * Whole-anime sub count (lib/audioTracks): aired episodes once any pool
   * proved subs exist. Never fabricated — 0 stays 0.
   */
  subEpisodeCount?: number;
  /**
   * Whole-anime dub count (lib/audioTracks): the proven high-water mark of
   * episodes with real dub servers. Never the series total, never assumed.
   */
  dubEpisodeCount?: number;
  /** Per-episode filler flag. */
  episodeFiller?: boolean;
  /** AniList id — required by the report modal (it disables without it). */
  anilistId?: string | number | null;
  /** Slugified series title — file name for the internal MKV download. */
  titleSlug?: string;
  /**
   * True once the server pools settled for THIS episode. Until then both
   * language options render (today's behaviour) so the menu never looks
   * empty mid-load; after that, absent languages are hidden, not greyed.
   */
  serversReady?: boolean;
  /**
   * Actually-playing server key (fallback tracking, display-only): the
   * picker highlights this instead of the manual selection while set.
   * Null = follow the selection.
   */
  activeServerKey?: string | null;
  /** True when playback arrived via automatic fallback — shows AUTO. */
  autoPlaying?: boolean;
}

// lyfa9_1 — container: flex row, gap 1rem, centered; column under 1000px.
const UpdatedContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  width: 100%;
  @media (max-width: 1000px) {
    flex-direction: column;
  }
`;

// lyfa9_7 — infoColumn.
const EpisodeInfoColumn = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 0.5rem;
  padding: 0.75rem;
  color: var(--global-text);
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  --animation-duration: 0.4s;
  --animation-easing: ease-in-out;
`;

// lyfa9_21 — titleRow: wrap, space-between, 1.15rem.
const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
  justify-content: space-between;
  margin: 0;
  font-size: 1.15rem;
  @media (max-width: 500px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

// lyfa9_30 — titleContainer.
const TitleContainer = styled.div`
  display: inline;
  flex: 1;
  margin: auto 0;
  .ep-number {
    font-weight: 700;
  }
`;

// lyfa9_38 — tagRowGroup (space-between) + tagRow (wrapped chips).
const TagRowGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  flex-wrap: wrap;
  @media (max-width: 500px) {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  align-self: flex-start;
  @media (max-width: 500px) {
    align-self: stretch;
  }
`;

const ActionsRow = styled(TagRow)`
  margin-left: auto;
  justify-content: flex-end;
  @media (max-width: 500px) {
    margin-left: 0;
    align-self: stretch;
    width: 100%;
    box-sizing: border-box;
    flex-wrap: nowrap;
    gap: 0.5rem;
    > button,
    > a {
      flex: 1 1 0;
      justify-content: center;
      min-width: 0;
      white-space: nowrap;
    }
  }
`;

const CopyStatus = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: var(--global-text-muted);
`;

// lyfa9_96/120 — linkButton + dateButton (non-interactive chip).
const LinkButton = styled.button`
  display: inline-flex;
  align-items: center;
  flex: 0;
  gap: 0.25rem;
  padding: 0.4rem;
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--global-text);
  text-decoration: none;
  cursor: pointer;
  background-color: var(--global-primary-bg);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  svg {
    flex-shrink: 0;
    font-size: 0.85rem;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  &:hover:not(:disabled):not(.dateButton),
  &:active:not(:disabled):not(.dateButton) {
    color: var(--primary-accent);
    background-color: var(--primary-accent-tr);
    border-color: var(--primary-accent);
  }
  &:active:not(:disabled):not(.dateButton) {
    transform: scale(0.95);
  }
`;

const DateButton = styled(LinkButton).attrs({ className: 'dateButton' })`
  flex: 1 0 max-content;
  max-width: max-content;
  pointer-events: none;
  cursor: default;
`;

// lyfa9_135 — fillerTag (amber border/icon).
const FillerTag = styled.span`
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
  padding: 0.4rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--global-text);
  pointer-events: none;
  cursor: default;
  background-color: var(--global-primary-bg);
  border: 1px solid #b9986d;
  border-radius: var(--global-border-radius);
  svg {
    color: #b9986d;
  }
`;

// lyfa9_152/157/173 — per-language count pills.
const LangCountGroup = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  gap: 0.5rem;
`;

const LangCountPill = styled.span<{ $unavailable?: boolean }>`
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  padding: 0.4rem 0.55rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ $unavailable }) =>
    $unavailable ? 'var(--global-text-muted)' : 'var(--global-text)'};
  opacity: ${({ $unavailable }) => ($unavailable ? 0.6 : 1)};
  background-color: var(--global-primary-bg);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  svg {
    flex-shrink: 0;
    font-size: 0.9rem;
  }
`;

// lyfa9_49/56/81/91 — dropdown stack with AUDIO / SERVER (n) labels.
const ServerColumn = styled.div`
  display: inline-grid;
  grid-template-columns: auto auto auto;
  grid-template-rows: auto auto;
  row-gap: 0.25rem;
  margin: 0 auto;
  @media (max-width: 500px) {
    width: 100%;
    box-sizing: border-box;
    margin: 0;
    /* AUDIO column hugs "Sub/Dub"; the SERVER column takes everything else
       so long provider names (FlixCloud, etc.) get room instead of being
       truncated to nothing in an even split. */
    grid-template-columns: minmax(4.5rem, auto) auto minmax(0, 1fr);
  }
`;

const DropdownLabels = styled.div`
  display: contents;
  > :nth-child(1) {
    grid-area: 1 / 1;
    justify-self: start;
  }
  > :nth-child(2) {
    grid-area: 1 / 3;
    justify-self: start;
  }
`;

const DropdownLabel = styled.span`
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--global-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
`;

const DropdownLabelIcon = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.85rem;
`;

const DropdownGroup = styled.div`
  position: relative;
  display: grid;
  grid-area: 2 / 1 / 3 / 4;
  grid-template-columns: subgrid;
  align-items: center;
  background-color: var(--global-primary-bg);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  --z-index-dropdown: 500;
`;

const RowDivider = styled.span`
  width: 1px;
  height: 1.5rem;
  background-color: var(--global-border-color);
`;

// lyfa9_177/183/190 — description, divider, airing row.
const DescriptionText = styled.p`
  margin: 0;
  overflow: hidden;
  font-size: 0.8rem;
  line-height: 1rem;
  color: var(--global-text-muted);
`;

const DescriptionDivider = styled.hr`
  width: 100%;
  margin: 0.5rem 0 0;
  color: var(--global-border-color);
  border: none;
  border-top: 1px solid var(--global-border-color);
`;

const AiringInfoRow = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-grow: 0;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 0.9rem;
`;

// Dropdown: trigger + fading menu + touch native fallback.

type SelectOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  tags?: React.ReactNode;
  disabled?: boolean;
};

const DropdownRoot = styled.div`
  display: inline-flex;
  align-items: center;
  height: 100%;
  @media (max-width: 500px) {
    justify-content: flex-start;
    min-width: 0;
    width: 100%;
  }
`;

const Trigger = styled.button`
  position: relative;
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
  height: 100%;
  min-height: 2.4rem;
  padding: 0.6rem 0.6rem 0.6rem 0.1rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--global-text);
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
  @media (max-width: 500px) {
    width: 100%;
    min-width: 0;
    /* 44px tap target (mobile pass) */
    min-height: 2.75rem;
    padding: 0.65rem 0.5rem;
  }
`;

const TriggerIcon = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: 0.5rem;
  font-size: 1.15rem;
  @media (max-width: 500px) {
    margin-left: 0;
  }
`;

const TriggerName = styled.span`
  display: inline-block;
  max-width: 9rem;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (max-width: 500px) {
    flex: 1 1 auto;
    min-width: 0;
    max-width: none;
    text-align: left;
  }
`;

const Caret = styled.span`
  display: inline-flex;
  font-size: 0.7rem;
  opacity: 0.65;
`;

const Menu = styled.div<{ $open: boolean; $align: 'left' | 'right' }>`
  position: absolute;
  top: calc(100% + 0.375rem);
  right: 0;
  left: 0;
  z-index: var(--z-index-dropdown);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.25rem;
  max-height: min(60vh, 320px);
  overflow-y: auto;
  overscroll-behavior: contain;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  background-color: var(--global-primary-bg);
  border: 1px solid var(--global-border-color);
  border-radius: 0.65rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.2),
    0 10px 25px -5px rgba(0, 0, 0, 0.35);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: ${({ $open }) =>
    $open ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.96)'};
  transform-origin: ${({ $align }) =>
    $align === 'left' ? 'top left' : 'top right'};
  transition: ${({ $open }) =>
    $open
      ? 'opacity .16s cubic-bezier(.16,1,.3,1), transform .16s cubic-bezier(.16,1,.3,1)'
      : 'opacity .12s ease-in, transform .12s ease-in'};
`;

const MenuItem = styled.button`
  position: relative;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 2.5rem;
  padding: 0.5rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--global-text);
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 0.4rem;
  &:hover,
  &:focus-visible {
    color: var(--primary-accent);
    background-color: var(--primary-accent-tr);
    outline: none;
  }
  &[data-active='true'] {
    color: var(--primary-accent);
  }
`;

const MenuItemLead = styled.span`
  display: inline-flex;
  flex: 1 1 auto;
  gap: 0.4rem;
  align-items: center;
  min-width: 0;
`;

const MenuItemIcon = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
  color: var(--global-text-muted);
  button[data-active='true'] & {
    color: var(--primary-accent);
  }
`;

const MenuItemName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemTagRow = styled.span`
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
`;

// 1uhbb_140 base tag + hsub/ssub/dl variants.
const ItemTag = styled.span<{ $variant?: 'hsub' | 'ssub' | 'dl' | 'embed' }>`
  padding: 0.1rem 0.35rem;
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
  border: 1px solid var(--global-border-color);
  border-radius: 999px;
  ${({ $variant }) =>
    $variant === 'hsub'
      ? 'color:#b38476;background-color:#b3847614;border-color:#b3847640;'
      : $variant === 'ssub'
        ? 'color:#8aa8c0;background-color:#8aa8c014;border-color:#8aa8c040;'
        : $variant === 'dl'
          ? 'color:#7aa37a;background-color:#7aa37a14;border-color:#7aa37a40;'
          : 'color:var(--global-text-muted);background-color:var(--global-div);'}
`;

const ItemCheck = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.9rem;
  height: 0.9rem;
  font-size: 0.7rem;
  color: var(--primary-accent);
`;

// Fallback-tracking badge: shown beside the server picker while playback
// arrived via automatic fallback (silent by user choice — badge only).
const AutoTag = styled.span`
  align-self: center;
  padding: 0.1rem 0.35rem;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.4;
  text-transform: uppercase;
  color: var(--primary-accent);
  border: 1px solid var(--primary-accent);
  border-radius: 999px;
  white-space: nowrap;
`;

const isEmbedServer = (s: any) =>
  (s?.sources ?? []).some((src: any) => src?.type === 'embed');

type DropdownProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  triggerIcon?: React.ReactNode;
  triggerWidth?: string;
  menuAlign?: 'left' | 'right';
  ariaLabel?: string;
};

/** Trigger menu with icons/tags/check + touch native fallback. */
const SelectDropdown: React.FC<DropdownProps> = ({
  value,
  options,
  onChange,
  triggerIcon,
  triggerWidth,
  menuAlign = 'right',
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const icon = triggerIcon ?? selected?.icon;

  // Menu closes whenever the value changes.
  useEffect(() => {
    setOpen(false);
  }, [value]);

  // Outside tap/click + Escape close. Uses `pointerdown` (not mousedown) so a
  // touch outside the menu closes it too — the themed menu is now used on EVERY
  // device. The old touch path swapped in a native <select> (OS picker) that
  // dropped all icons/tags/checks and looked nothing like the site.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <DropdownRoot ref={rootRef}>
      <Trigger
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {icon && <TriggerIcon>{icon}</TriggerIcon>}
        <TriggerName style={triggerWidth ? { width: triggerWidth } : undefined}>
          {selected?.label ?? value.split(':')[0]}
        </TriggerName>
        <Caret>
          <FaChevronDown />
        </Caret>
      </Trigger>
      <Menu $open={open} $align={menuAlign} role='listbox' aria-label={ariaLabel}>
        {options.map((o) => (
          <MenuItem
            key={o.value}
            type='button'
            role='option'
            aria-selected={o.value === value}
            data-active={o.value === value ? 'true' : undefined}
            disabled={o.disabled}
            onClick={() => {
              onChange(o.value);
              setOpen(false);
            }}
          >
            <MenuItemLead>
              {o.icon && <MenuItemIcon>{o.icon}</MenuItemIcon>}
              <MenuItemName>{o.label}</MenuItemName>
            </MenuItemLead>
            {o.tags && <ItemTagRow>{o.tags}</ItemTagRow>}
            {o.value === value && (
              <ItemCheck>
                <FaCheck />
              </ItemCheck>
            )}
          </MenuItem>
        ))}
      </Menu>
    </DropdownRoot>
  );
};

export const MediaSource: React.FC<MediaSourceProps> = ({
  language,
  episodeId,
  episodeTitle,
  episodeAirDate,
  episodeDescription,
  airingTime,
  nextEpisodenumber,
  seriesTitle,
  serversSub = [],
  serversDub = [],
  selectedServer = '',
  onSelectServer,
  totalEpisodes = 0,
  subEpisodeCount,
  dubEpisodeCount,
  episodeFiller = false,
  anilistId,
  titleSlug,
  serversReady = true,
  activeServerKey = null,
  autoPlaying = false,
}) => {
  const [copyState, setCopyState] = useState<
    'idle' | 'copying' | 'copied' | 'error'
  >('idle');
  const [reportOpen, setReportOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const directSub = serversSub.filter((s: any) => !isEmbedServer(s));
  const directDub = serversDub.filter((s: any) => !isEmbedServer(s));
  const embedSub = serversSub.filter((s: any) => isEmbedServer(s));
  const embedDub = serversDub.filter((s: any) => isEmbedServer(s));

  // Per-language availability for the current episode: disable a language
  // option when it has no servers here (no dead clicks).
  const subAvailable = serversSub.length > 0;
  const dubAvailable = serversDub.length > 0;
  const langAvailable: Record<string, boolean> = {
    sub: subAvailable,
    dub: dubAvailable,
  };

  // LangCountPill — whole-anime counts, computed in Watch.tsx from
  // lib/audioTracks (the server pools this page already fetched — no extra
  // backend calls). Sub = aired episodes once any pool proved subs exist;
  // dub = ONLY the proven high-water mark (never the series total, never
  // assumed — a language that hasn't released stays 0 and hidden).
  const subCount =
    subEpisodeCount ?? (subAvailable ? totalEpisodes : 0);
  const dubCount = dubEpisodeCount ?? 0;

  const serverKey = (lang: string, name: string) => `${lang}:${name}`;
  const currentLang: 'sub' | 'dub' = language === 'dub' ? 'dub' : 'sub';
  const langServers =
    currentLang === 'dub'
      ? [...directDub, ...embedDub]
      : [...directSub, ...embedSub];

  const badgesFor = (s: any) => {
    const badges: React.ReactNode[] = [];
    if (isEmbedServer(s)) badges.push(<ItemTag key='embed'>embed</ItemTag>);
    if ((s?.downloads ?? []).length > 0)
      badges.push(<ItemTag key='dl' $variant='dl'>dl</ItemTag>);
    // Quality of the row's best direct source (e.g. "1080p") when the
    // backend reports one.
    const quality = (s?.sources ?? [])
      .map((x: any) => (typeof x?.quality === 'string' ? x.quality : ''))
      .find((q: string) => /^\d{3,4}p?$/i.test(q));
    if (quality)
      badges.push(
        <ItemTag key='q' $variant='ssub'>
          {quality.toLowerCase()}
        </ItemTag>,
      );
    // Soft-sub = subtitle files ship with the source; hard-sub = burned-in
    // subs on a sub-track server without files.
    if ((s?.sources ?? []).some((x: any) => (x?.subtitles ?? []).length > 0))
      badges.push(<ItemTag key='ssub' $variant='ssub'>s-sub</ItemTag>);
    else if (!isEmbedServer(s))
      badges.push(<ItemTag key='hsub' $variant='hsub'>h-sub</ItemTag>);
    return badges;
  };

  // Language options (Sub/Dub) — once the pools settle for this episode,
  // absent languages are hidden outright (sub-only shows Sub, dub-only
  // shows Dub). While loading, or when neither side has servers, both
  // render (disabled as needed) so the trigger never goes empty.
  const languageOptions: SelectOption[] = [
    {
      value: 'sub',
      label: 'Sub',
      icon: <FaClosedCaptioning />,
      disabled: !langAvailable.sub,
    },
    {
      value: 'dub',
      label: 'Dub',
      icon: <FaMicrophone />,
      disabled: !langAvailable.dub,
    },
  ];
  const visibleLanguageOptions = (() => {
    if (!serversReady) return languageOptions;
    const shown = languageOptions.filter((o) => langAvailable[o.value]);
    return shown.length > 0 ? shown : languageOptions;
  })();

  // Server options for the CURRENT language (direct first, embed after),
  // values keyed `${lang}:${name}` so selection can never flip pools.
  const serverOptions: SelectOption[] = langServers.map((s: any) => ({
    value: serverKey(currentLang, s.name),
    label: s.name ?? '?',
    icon: <FaServer />,
    tags: badgesFor(s),
  }));

  // Picker display truth: the manual selection, unless fallback tracking
  // reports something actually playing. The check mark + trigger both read
  // this key, so an auto-switched server visibly takes over the list.
  const fallbackServerKey =
    selectedServer && selectedServer.startsWith(`${currentLang}:`)
      ? selectedServer
      : serverKey(currentLang, langServers[0]?.name ?? '');
  const displayServerKey = activeServerKey ?? fallbackServerKey;

  // The download follows playback: the direct HLS URL of the server the
  // user is actually watching (first non-embed source of the active row),
  // per language so the dialog's Sub/Dub radio can offer both pools.
  const activeRowFor = (l: 'sub' | 'dub'): any => {
    const poolRows = l === 'dub' ? serversDub : serversSub;
    const directRows = poolRows.filter((s: any) => !isEmbedServer(s));
    return (
      poolRows.find(
        (s: any) => serverKey(l, s?.name) === displayServerKey,
      ) ?? directRows[0]
    );
  };
  const watchedSourceFor = (l: 'sub' | 'dub'): string | null => {
    return (
      (activeRowFor(l)?.sources ?? []).find(
        (x: any) => x?.url && x?.type !== 'embed',
      )?.url ?? null
    );
  };
  const qualityOptionsFor = (l: 'sub' | 'dub'): { url: string; label: string }[] => {
    const byQuality = new Map<string, string>();
    for (const x of activeRowFor(l)?.sources ?? []) {
      if (!x?.url || x?.type === 'embed') continue;
      const label = String(x?.quality || '').toLowerCase();
      if (!/^\d{3,4}p?$/.test(label)) continue;
      if (!byQuality.has(label)) byQuality.set(label, x.url);
    }
    return [...byQuality.entries()].map(([label, url]) => ({ url, label }));
  };
  // Same subtitle list the player mounts — these are the files that actually
  // resolve for the watched server.
  const subtitlesFor = (
    l: 'sub' | 'dub',
  ): { label: string; language?: string; url: string }[] => {
    const seen = new Set<string>();
    const out: { label: string; language?: string; url: string }[] = [];
    for (const x of activeRowFor(l)?.sources ?? []) {
      for (const sub of x?.subtitles ?? []) {
        if (!sub?.url || /thumbnail|preview/i.test(sub.url)) continue;
        if (seen.has(sub.url)) continue;
        seen.add(sub.url);
        out.push({
          label: sub.label || sub.lang || 'Subtitles',
          language:
            typeof sub.lang === 'string' && sub.lang.length <= 3
              ? sub.lang
              : undefined,
          url: sub.url,
        });
      }
    }
    return out;
  };
  const headersFor = (
    l: 'sub' | 'dub',
  ): Record<string, string> | null => activeRowFor(l)?.headers ?? null;
  const preferredSource = {
    sub: watchedSourceFor('sub'),
    dub: watchedSourceFor('dub'),
  };
  const qualitySources = {
    sub: qualityOptionsFor('sub'),
    dub: qualityOptionsFor('dub'),
  };
  const downloadHeaders = {
    sub: headersFor('sub'),
    dub: headersFor('dub'),
  };
  const downloadSubtitles = {
    sub: subtitlesFor('sub'),
    dub: subtitlesFor('dub'),
  };

  const handleLanguageChange = (value: string) => {
    const next = value === 'dub' ? 'dub' : 'sub';
    if (!langAvailable[next]) return;
    const list = next === 'dub' ? directDub : directSub;
    const first = list.find((s: any) => s?.name);
    if (first?.name && onSelectServer) {
      // A language change also switches to the first usable provider.
      onSelectServer(serverKey(next, first.name), next);
    }
  };

  const handleServerChange = (key: string) => {
    if (!key) return;
    const idx = key.indexOf(':');
    const lang = (idx > 0 ? key.slice(0, idx) : currentLang) as
      | 'sub'
      | 'dub';
    onSelectServer?.(key, lang);
  };

  const handleShareClick = async () => {
    setCopyState('copying');
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
    setTimeout(() => setCopyState('idle'), 2000);
  };

  const cleanDescription = episodeDescription
    ? episodeDescription.replace(/<[^>]+>/g, '')
    : '';

  // Report modal provider lists (provider key = backend `provider`).
  const providerKeys = Array.from(
    new Set(
      [...serversSub, ...serversDub]
        .map((s: any) => s?.provider ?? s?.name)
        .filter(Boolean) as string[],
    ),
  );
  const downloadProviderKeys = Array.from(
    new Set(
      [...serversSub, ...serversDub]
        .filter((s: any) => (s?.downloads ?? []).length > 0)
        .map((s: any) => s?.provider ?? s?.name)
        .filter(Boolean) as string[],
    ),
  );

  return (
    <UpdatedContainer>
      <EpisodeInfoColumn>
        {episodeId ? (
          <>
            <TitleRow>
              <TitleContainer>
                <span className='ep-number'>{`${episodeId}.\xA0`}</span>
                <span className='ep-title'>{episodeTitle}</span>
              </TitleContainer>
              <ServerColumn>
                <DropdownLabels>
                  <DropdownLabel>
                    <DropdownLabelIcon>
                      <FaVolumeUp aria-hidden='true' />
                    </DropdownLabelIcon>
                    AUDIO
                  </DropdownLabel>
                  <DropdownLabel>
                    <DropdownLabelIcon>
                      <FaServer aria-hidden='true' />
                    </DropdownLabelIcon>
                    {langServers.length > 0
                      ? `SERVER (${langServers.length})`
                      : 'SERVER'}
                  </DropdownLabel>
                </DropdownLabels>
                <DropdownGroup>
                  <SelectDropdown
                    value={currentLang}
                    options={visibleLanguageOptions}
                    onChange={handleLanguageChange}
                    ariaLabel='Language'
                    menuAlign='left'
                  />
                  <RowDivider />
                  <SelectDropdown
                    value={displayServerKey}
                    options={serverOptions}
                    onChange={handleServerChange}
                    ariaLabel='Server'
                  />
                  {autoPlaying && (
                    <AutoTag
                      title={
                        activeServerKey
                          ? 'Playing via automatic fallback'
                          : 'Playing via automatic fallback (source not listed)'
                      }
                    >
                      AUTO
                    </AutoTag>
                  )}
                </DropdownGroup>
              </ServerColumn>
            </TitleRow>
            <TagRowGroup>
              <TagRow>
                {episodeAirDate && <DateButton>{episodeAirDate}</DateButton>}
                <LangCountGroup>
                  <LangCountPill
                    $unavailable={subCount <= 0}
                    aria-label={`${subCount} subbed episodes`}
                    title={`${subCount} episodes with sub`}
                  >
                    <FaClosedCaptioning aria-hidden='true' />
                    <span>{subCount}</span>
                  </LangCountPill>
                  <LangCountPill
                    $unavailable={dubCount <= 0}
                    aria-label={`${dubCount} dubbed episodes`}
                    title={`${dubCount} episodes with dub`}
                  >
                    <FaMicrophone aria-hidden='true' />
                    <span>{dubCount}</span>
                  </LangCountPill>
                </LangCountGroup>
                {episodeFiller && (
                  <FillerTag>
                    <FaFilm aria-hidden='true' />
                    Filler
                  </FillerTag>
                )}
              </TagRow>
              <ActionsRow>
                {(copyState === 'copying' ||
                  copyState === 'copied' ||
                  copyState === 'error') && (
                  <CopyStatus>
                    {copyState === 'copying'
                      ? 'Copying link...'
                      : copyState === 'copied'
                        ? 'Link copied to clipboard!'
                        : 'Failed to copy link'}
                  </CopyStatus>
                )}
                <LinkButton
                  type='button'
                  onClick={() => setReportOpen(true)}
                  disabled={!anilistId}
                  title='Report'
                >
                  <FaFlag aria-hidden='true' />
                  Report
                </LinkButton>
                <LinkButton
                  type='button'
                  onClick={() => setDownloadOpen(true)}
                  disabled={!anilistId || !episodeId}
                  title='Download this episode'
                >
                  <FaDownload aria-hidden='true' />
                  Download
                </LinkButton>
                <LinkButton type='button' onClick={handleShareClick} title='Share'>
                  <FaShare aria-hidden='true' />
                  Share
                </LinkButton>
              </ActionsRow>
            </TagRowGroup>
            {cleanDescription && (
              <>
                <DescriptionText>{cleanDescription}</DescriptionText>
                <DescriptionDivider />
              </>
            )}
            {airingTime && (
              <AiringInfoRow>
                <span>
                  <FaFlag aria-hidden='true' />{' '}
                  <strong>
                    {nextEpisodenumber
                      ? `Episode ${nextEpisodenumber}`
                      : 'Next episode'}
                  </strong>{' '}
                  in <strong>{airingTime}</strong>
                </span>
              </AiringInfoRow>
            )}
          </>
        ) : (
          <CopyStatus>Loading episode information...</CopyStatus>
        )}
      </EpisodeInfoColumn>
      <ReportModal
        isVisible={reportOpen}
        onClose={() => setReportOpen(false)}
        episode={episodeId ? Number(episodeId) : undefined}
        providers={providerKeys}
        downloadProviders={downloadProviderKeys}
        anilistId={anilistId}
      />
      <DownloadDialog
        isVisible={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        anilistId={anilistId}
        episodeNumber={episodeId ? Number(episodeId) : undefined}
        titleSlug={titleSlug || 'anime'}
        seriesTitle={seriesTitle}
        currentLang={currentLang}
        preferredSource={preferredSource}
        headers={downloadHeaders}
        subtitles={downloadSubtitles}
        qualitySources={qualitySources}
      />
    </UpdatedContainer>
  );
};

export default MediaSource;
