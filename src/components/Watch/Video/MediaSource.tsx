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
import { useMediaQuery } from '../useMediaQuery';

// ---------------------------------------------------------------------------
// MediaSource — live lyfa9 module (episode bar) + live 1uhbb dropdowns.
// Server/language selection is keyed `${lang}:${name}` so the SAME backend
// name (Niko/Momo exist in BOTH sub and dub) can never collide — that name
// collision was the core server-selection bug (Dub always snapped back to
// Sub because `serverLangOf` preferred the sub pool).
// ---------------------------------------------------------------------------

interface MediaSourceProps {
  sourceType: string;
  setSourceType: (sourceType: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  downloadLink: string;
  episodeId?: string;
  episodeTitle?: string;
  episodeAirDate?: string | null;
  episodeDescription?: string | null;
  airingTime?: string;
  nextEpisodenumber?: string;
  // All Aniraku servers for this episode (direct HLS + embed providers).
  serversSub?: any[];
  serversDub?: any[];
  /** `${lang}:${name}` selection key (never a bare name — see above). */
  selectedServer?: string;
  onSelectServer?: (key: string, lang: 'sub' | 'dub') => void;
  /** Total episodes — drives the per-language count pills. */
  totalEpisodes?: number;
  /** Per-episode filler flag (live fillerTag). */
  episodeFiller?: boolean;
  /** AniList id — required by the report modal (live disables without it). */
  anilistId?: string | number | null;
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
    /* Equal halves so AUDIO/SERVER labels sit centered over their own
       dropdown instead of a floating auto-width island. */
    grid-template-columns: 1fr auto 1fr;
  }
`;

const DropdownLabels = styled.div`
  display: contents;
  > :nth-child(1) {
    grid-area: 1 / 1;
    justify-self: center;
  }
  > :nth-child(2) {
    grid-area: 1 / 3;
    justify-self: center;
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

// ---------------------------------------------------------------------------
// 1uhbb — live dropdown (`At`): trigger + fading menu + touch native fallback.
// ---------------------------------------------------------------------------

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
    justify-content: center;
    min-width: 0;
  }
`;

const NativeSelect = styled.select`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: inherit;
  color: transparent;
  cursor: pointer;
  background: transparent;
  border: 0;
  opacity: 0;
  appearance: none;
  &:focus-visible {
    outline: none;
  }
`;

const Trigger = styled.button`
  position: relative;
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
  height: 100%;
  padding: 0.6rem 0.6rem 0.6rem 0.1rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--global-text);
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
`;

const TriggerIcon = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: 0.5rem;
  font-size: 1.15rem;
`;

const TriggerName = styled.span`
  display: inline-block;
  width: 2.5rem;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  padding: 0.25rem;
  overflow: hidden;
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
  padding: 0.45rem 0.55rem;
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

// 1uhbb_140 base tag + hsub/ssub/dl variants (verbatim colors).
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

/** Live `At` — trigger menu with icons/tags/check + touch native fallback. */
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
  const isTouch = useMediaQuery('(pointer: coarse)');
  const selected = options.find((o) => o.value === value);
  const icon = triggerIcon ?? selected?.icon;

  // Live: menu closes whenever the value changes.
  useEffect(() => {
    setOpen(false);
  }, [value]);

  // Outside click + Escape close (live).
  useEffect(() => {
    if (isTouch || !open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, isTouch]);

  if (isTouch) {
    return (
      <DropdownRoot ref={rootRef}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', height: '100%' }}>
          {icon && <TriggerIcon>{icon}</TriggerIcon>}
          <TriggerName style={triggerWidth ? { width: triggerWidth } : undefined}>
            {selected?.label ?? value.split(':')[0]}
          </TriggerName>
          <Caret>
            <FaChevronDown />
          </Caret>
        </div>
        <NativeSelect
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </DropdownRoot>
    );
  }

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

// ---------------------------------------------------------------------------

export const MediaSource: React.FC<MediaSourceProps> = ({
  language,
  downloadLink,
  episodeId,
  episodeTitle,
  episodeAirDate,
  episodeDescription,
  airingTime,
  nextEpisodenumber,
  serversSub = [],
  serversDub = [],
  selectedServer = '',
  onSelectServer,
  totalEpisodes = 0,
  episodeFiller = false,
  anilistId,
}) => {
  const [copyState, setCopyState] = useState<
    'idle' | 'copying' | 'copied' | 'error'
  >('idle');
  const [reportOpen, setReportOpen] = useState(false);

  const directSub = serversSub.filter((s: any) => !isEmbedServer(s));
  const directDub = serversDub.filter((s: any) => !isEmbedServer(s));
  const embedSub = serversSub.filter((s: any) => isEmbedServer(s));
  const embedDub = serversDub.filter((s: any) => isEmbedServer(s));

  // Per-language availability for the CURRENT episode (live disables a
  // language option when it has no servers here — no dead clicks).
  const subAvailable = serversSub.length > 0;
  const dubAvailable = serversDub.length > 0;
  const langAvailable: Record<string, boolean> = {
    sub: subAvailable,
    dub: dubAvailable,
  };

  // Live langCountPill — `${count} episodes` aria-label; 0 → unavailable.
  const subCount = subAvailable ? totalEpisodes : 0;
  const dubCount = dubAvailable ? totalEpisodes : 0;

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
    // Soft-sub = subtitle files ship with the source; hard-sub = burned-in
    // subs on a sub-track server without files.
    if ((s?.sources ?? []).some((x: any) => (x?.subtitles ?? []).length > 0))
      badges.push(<ItemTag key='ssub' $variant='ssub'>s-sub</ItemTag>);
    else if (!isEmbedServer(s))
      badges.push(<ItemTag key='hsub' $variant='hsub'>h-sub</ItemTag>);
    return badges;
  };

  // Language options (Sub/Dub) — disabled when this episode has no servers.
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

  // Server options for the CURRENT language (direct first, embed after),
  // values keyed `${lang}:${name}` so selection can never flip pools.
  const serverOptions: SelectOption[] = langServers.map((s: any) => ({
    value: serverKey(currentLang, s.name),
    label: s.name ?? '?',
    icon: <FaServer />,
    tags: badgesFor(s),
  }));

  const handleLanguageChange = (value: string) => {
    const next = value === 'dub' ? 'dub' : 'sub';
    if (!langAvailable[next]) return;
    const list = next === 'dub' ? directDub : directSub;
    const first = list.find((s: any) => s?.name);
    if (first?.name && onSelectServer) {
      // Live: language change also switches to the first usable provider.
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

  // Live report modal provider lists (provider key = backend `provider`).
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
                    options={languageOptions}
                    onChange={handleLanguageChange}
                    ariaLabel='Language'
                    menuAlign='left'
                  />
                  <RowDivider />
                  <SelectDropdown
                    value={
                      selectedServer &&
                      selectedServer.startsWith(`${currentLang}:`)
                        ? selectedServer
                        : serverKey(currentLang, langServers[0]?.name ?? '')
                    }
                    options={serverOptions}
                    onChange={handleServerChange}
                    ariaLabel='Server'
                  />
                </DropdownGroup>
              </ServerColumn>
            </TitleRow>
            <TagRowGroup>
              <TagRow>
                {episodeAirDate && <DateButton>{episodeAirDate}</DateButton>}
                <LangCountGroup>
                  <LangCountPill
                    $unavailable={subCount <= 0}
                    aria-label={`${subCount} episodes`}
                  >
                    <FaClosedCaptioning aria-hidden='true' />
                    <span>{subCount}</span>
                  </LangCountPill>
                  <LangCountPill
                    $unavailable={dubCount <= 0}
                    aria-label={`${dubCount} episodes`}
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
                  as='a'
                  href={downloadLink || undefined}
                  target='_blank'
                  rel='noopener noreferrer'
                  disabled={!downloadLink}
                  title='Download'
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
    </UpdatedContainer>
  );
};

export default MediaSource;
