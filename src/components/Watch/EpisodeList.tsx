import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faThList,
  faTh,
  faSearch,
  faImage,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { Episode } from '../../index';

// Live `hideSpoiler` pref ("Hide Spoilers" — blocks episode images behind a
// HIDDEN SPOILER overlay). StoredSettings keeps it internal to the settings
// record (the public useSettings shape doesn't expose it), so EpisodeList
// reads/merge-writes `aniraku:settings` → .settings.hideSpoiler directly —
// same record, same key the provider persists.
function readHideSpoilerPref(): boolean {
  try {
    const raw = localStorage.getItem('aniraku:settings');
    if (raw) {
      const record = JSON.parse(raw);
      const value = record?.settings?.hideSpoiler;
      if (typeof value === 'boolean') return value;
    }
  } catch {
    // Malformed record — fall through to the live default.
  }
  return false; // LIVE_DEFAULTS.hideSpoiler = !1
}

function writeHideSpoilerPref(value: boolean): void {
  try {
    const raw = localStorage.getItem('aniraku:settings');
    const record = (raw ? JSON.parse(raw) : {}) || {};
    if (typeof record !== 'object') return;
    const settings =
      record.settings && typeof record.settings === 'object'
        ? record.settings
        : {};
    record.settings = { ...settings, hideSpoiler: value };
    localStorage.setItem('aniraku:settings', JSON.stringify(record));
  } catch {
    // Storage unavailable — the toggle still applies in-session.
  }
}

// Live local-history gate: when the user paused history recording, skip
// persisting watched-episodes (checkmark state still updates in-session).
// Pref is written by useWatchHistory's writePref as either the
// `historyPaused` field of the `aniraku:watching` record or (legacy) as a
// JSON boolean under `aniraku:watching:history-paused`.
const isHistoryPaused = (): boolean => {
  try {
    const record = localStorage.getItem('aniraku:watching');
    if (record) {
      const parsed = JSON.parse(record);
      if (parsed && typeof parsed.historyPaused === 'boolean') {
        return parsed.historyPaused;
      }
    }
    const legacy = localStorage.getItem('aniraku:watching:history-paused');
    if (legacy !== null) return JSON.parse(legacy) === true;
  } catch {
    // Malformed record — treat as not paused.
  }
  return false;
};

interface Props {
  animeId: string | undefined;
  episodes: Episode[];
  selectedEpisodeId: string;
  onEpisodeSelect: (id: string) => void;
  maxListHeight: string;
}

// Styled components for the episode list
const ListContainer = styled.div<{ $maxHeight: string }>`
  background-color: var(--global-secondary-bg);
  color: var(--global-text);
  border-radius: var(--global-border-radius);
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  max-height: ${({ $maxHeight }) => $maxHeight};
  @media (max-width: 1000px) {
    /* phones/tablets share the same bounded scroller: the old ≤500px block
       re-applied the measured player height here (~193px = 2.5 episodes,
       torn mid-item per the mobile screencast) */
    max-height: 18rem;
  }
`;

const EpisodeGrid = styled.div<{ $isRowLayout: boolean }>`
  display: grid;
  grid-template-columns: ${({ $isRowLayout }) =>
    $isRowLayout ? '1fr' : 'repeat(auto-fill, minmax(4rem, 1fr))'};
  gap: 0.29rem;
  padding: 0.4rem;
  overflow-y: auto;
  flex-grow: 1;
`;

// p7i3w — image wrapper with the live spoiler treatment: the image is
// blurred (`spoilerHidden`: blur(8px) brightness(1.5)) while the overlay
// (`spoilerOverlay` + `isVisible`: opacity 1, mix-blend difference) shows
// `HIDDEN SPOILER`.
const EpisodeImageWrap = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 0.5rem;
  max-width: 250px;
  @media (max-width: 500px) {
    max-width: 125px;
  }
`;

const EpisodeImage = styled.img`
  display: block;
  max-width: 250px;
  max-height: 150px;
  height: auto;
  border-radius: var(--global-border-radius);
  &.spoiler-hidden {
    filter: blur(8px) brightness(1.5);
  }
  @media (max-width: 500px) {
    max-width: 125px;
    max-height: 80px;
  }
`;

const SpoilerOverlay = styled.div`
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
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  &.visible {
    opacity: 1;
  }
`;

const ListItem = styled.button<{
  $isSelected: boolean;
  $isRowLayout: boolean;
  $isWatched: boolean;
}>`
  transition:
    padding 0.3s ease-in-out,
    transform 0.3s ease-in-out;
  animation: popIn 0.3s ease-in-out;
  background-color: ${({ $isSelected, $isWatched }) =>
    $isSelected
      ? $isWatched
        ? 'var(--primary-accent)' // Selected and watched
        : 'var(--primary-accent-bg)' // Selected but not watched
      : $isWatched
        ? 'var(--primary-accent-bg); filter: brightness(0.8);' // Not selected but watched
        : 'var(--global-tertiary-bg)'};

  border: none;
  border-radius: var(--global-border-radius);
  color: ${({ $isSelected, $isWatched }) =>
    $isSelected
      ? $isWatched
        ? 'var(--global-text)' // Selected and watched
        : 'var(--global-text)' // Selected but not watched
      : $isWatched
        ? 'var(--primary-accent); filter: brightness(0.8);' // Not selected but watched
        : 'grey'}; // Not selected and not watched

  padding: ${({ $isRowLayout }) =>
    $isRowLayout ? '0.6rem 0.5rem' : '0.4rem 0'};
  text-align: ${({ $isRowLayout }) => ($isRowLayout ? 'left' : 'center')};
  cursor: pointer;
  justify-content: ${({ $isRowLayout }) =>
    $isRowLayout ? 'space-between' : 'center'};
  align-items: center;

  &:hover,
  &:active,
  &:focus {
    ${({ $isSelected, $isWatched }) =>
      $isSelected
        ? $isWatched
          ? 'filter: brightness(1.1)' // Selected and watched
          : 'filter: brightness(1.1)' // Selected but not watched
        : $isWatched
          ? 'filter: brightness(1.1)' // Not selected but watched
          : 'background-color: var(--global-button-hover-bg); filter: brightness(1.05); color: #FFFFFF'};
    padding-left: ${({ $isRowLayout }) => ($isRowLayout ? '1rem' : '')};
  }
`;

// dlwq6 — episode controls bar: flex, gap .5rem, padding .5rem, div-tr
// background, border-bottom.
const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--global-div-tr);
  border-bottom: 1px solid var(--global-border-color);
  padding: 0.5rem;
`;

const SelectInterval = styled.select`
  height: 2.25rem;
  box-sizing: border-box;
  padding: 0.35rem 0.5rem;
  background-color: var(--global-secondary-bg);
  color: var(--global-text);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const LayoutToggle = styled.button`
  width: 2.25rem;
  height: 2.25rem;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 0;
  background-color: var(--global-secondary-bg);
  border: 1px solid var(--global-border-color);
  cursor: pointer;
  color: var(--global-text);
  border-radius: var(--global-border-radius);
  transition:
    background-color 0.15s,
    color 0.15s;

  &:hover,
  &:active,
  &:focus {
    background-color: var(--global-button-hover-bg);
  }
  &:active {
    transform: scale(0.9);
  }
`;

// dlwq6 — filter container: flex-1, gap .25rem, padding .5rem,
// secondary-bg, border, radius.
const SearchContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  background-color: var(--global-secondary-bg);
  border: 1px solid var(--global-border-color);
  padding: 0.5rem;
  gap: 0.25rem;
  border-radius: var(--global-border-radius);
`;

const SearchInput = styled.input`
  border: none;
  background-color: transparent;
  color: var(--global-text);
  outline: none;
  width: 100%;

  &::placeholder {
    color: var(--global-text-muted);
  }
`;

const Icon = styled.div`
  color: var(--global-text);
  opacity: 0.5;
  font-size: 0.8rem;
  transition: opacity 0.2s;

  @media (max-width: 768px) {
    display: none; /* Hide on mobile */
  }
`;

const EpisodeNumber = styled.span``;
const EpisodeTitle = styled.span`
  padding: 0.5rem;
`;

// The updated EpisodeList component
export const EpisodeList: React.FC<Props> = ({
  animeId,
  episodes,
  selectedEpisodeId,
  onEpisodeSelect,
  maxListHeight,
}) => {
  // State for interval, layout, user layout preference, search term, and watched episodes
  const episodeGridRef = useRef<HTMLDivElement>(null);
  const episodeRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [interval, setInterval] = useState<[number, number]>([0, 99]);
  // Persisted user layout preference (listLayout-[{animeId}]) — read on
  // init, updated + persisted by toggleLayoutPreference below.
  const [userLayoutPreference, setUserLayoutPreference] = useState<
    boolean | null
  >(() => {
    const savedMode = animeId
      ? localStorage.getItem(`listLayout-[${animeId}]`)
      : null;
    if (savedMode === null) return null;
    return savedMode !== 'grid';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [watchedEpisodes, setWatchedEpisodes] = useState<Episode[]>([]);
  const defaultLayoutMode = episodes.every((episode) => episode.title)
    ? 'list'
    : 'grid';
  const [displayMode, setDisplayMode] = useState<'list' | 'grid' | 'imageList'>(
    () => {
      const savedMode = animeId
        ? localStorage.getItem(`listLayout-[${animeId}]`)
        : null;
      if (savedMode) return savedMode as 'list' | 'grid' | 'imageList';
      if (userLayoutPreference !== null) {
        return userLayoutPreference ? 'list' : 'grid';
      }
      return defaultLayoutMode;
    },
  );
  // Row vs grid view — the live row/grid toggle is driven purely by
  // displayMode (grid ⇄ everything else).
  const isRowLayout = displayMode !== 'grid';

  const [selectionInitiatedByUser, setSelectionInitiatedByUser] =
    useState(false);
  // Update local storage when watched episodes change (skipped while the
  // user's history recording is paused).
  useEffect(() => {
    if (animeId && watchedEpisodes.length > 0 && !isHistoryPaused()) {
      localStorage.setItem(
        `watched-episodes-${animeId}`,
        JSON.stringify(watchedEpisodes),
      );
    }
  }, [animeId, watchedEpisodes]);
  // Load watched episodes from local storage when animeId changes
  useEffect(() => {
    if (animeId) {
      localStorage.setItem(`listLayout-[${animeId}]`, displayMode);
      const watched = localStorage.getItem('watched-episodes');
      if (watched) {
        const watchedEpisodesObject = JSON.parse(watched);
        const watchedEpisodesForAnime = watchedEpisodesObject[animeId];
        if (watchedEpisodesForAnime) {
          setWatchedEpisodes(watchedEpisodesForAnime);
        }
      }
    }
  }, [animeId]);

  // Function to handle episode selection
  // Function to mark an episode as watched
  const markEpisodeAsWatched = useCallback(
    (id: string) => {
      if (animeId) {
        setWatchedEpisodes((prevWatchedEpisodes) => {
          const updatedWatchedEpisodes = [...prevWatchedEpisodes];
          const selectedEpisodeIndex = updatedWatchedEpisodes.findIndex(
            (episode) => episode.id === id,
          );
          if (selectedEpisodeIndex === -1) {
            const selectedEpisode = episodes.find(
              (episode) => episode.id === id,
            );
            if (selectedEpisode) {
              updatedWatchedEpisodes.push(selectedEpisode);
              // Update the watched episodes object in local storage
              // (skipped while history recording is paused).
              if (!isHistoryPaused()) {
                localStorage.setItem(
                  'watched-episodes',
                  JSON.stringify({
                    ...JSON.parse(
                      localStorage.getItem('watched-episodes') || '{}',
                    ),
                    [animeId]: updatedWatchedEpisodes,
                  }),
                );
              }
              return updatedWatchedEpisodes;
            }
          }
          return prevWatchedEpisodes;
        });
      }
    },
    [episodes, animeId],
  );
  const handleEpisodeSelect = useCallback(
    (id: string) => {
      setSelectionInitiatedByUser(true);
      markEpisodeAsWatched(id); // Mark the episode as watched
      onEpisodeSelect(id);
    },
    [onEpisodeSelect, markEpisodeAsWatched],
  );

  // Update watched episodes when a new episode is selected or visited
  useEffect(() => {
    if (selectedEpisodeId && !selectionInitiatedByUser) {
      markEpisodeAsWatched(selectedEpisodeId);
    }
  }, [selectedEpisodeId, selectionInitiatedByUser, markEpisodeAsWatched]);

  // Generate interval options
  const intervalOptions = useMemo(() => {
    return episodes.reduce<{ start: number; end: number }[]>(
      (options, _, index) => {
        if (index % 100 === 0) {
          const start = index;
          const end = Math.min(index + 99, episodes.length - 1);
          options.push({ start, end });
        }
        return options;
      },
      [],
    );
  }, [episodes]);

  // Handle interval change
  const handleIntervalChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const [start, end] = e.target.value.split('-').map(Number);
      setInterval([start, end]);
    },
    [],
  );

  // Live controls-bar spoiler toggle (`title="Toggle Spoilers"`): blocks
  // episode images behind the HIDDEN SPOILER overlay.
  const [hideSpoiler, setHideSpoiler] = useState(readHideSpoilerPref);
  const toggleHideSpoiler = useCallback(() => {
    setHideSpoiler((prev) => {
      const next = !prev;
      writeHideSpoilerPref(next);
      return next;
    });
  }, []);

  // Toggle layout preference — persists both displayMode and the derived
  // boolean user preference under listLayout-[{animeId}].
  const toggleLayoutPreference = useCallback(() => {
    const nextMode =
      displayMode === 'list'
        ? 'grid'
        : displayMode === 'grid'
          ? 'imageList'
          : 'list';
    setDisplayMode(nextMode);
    setUserLayoutPreference(nextMode !== 'grid');
    if (animeId) {
      localStorage.setItem(`listLayout-[${animeId}]`, nextMode);
    }
  }, [displayMode, animeId]);

  // Filter episodes based on search input
  const filteredEpisodes = useMemo(() => {
    const searchQuery = searchTerm.toLowerCase();
    return episodes.filter(
      (episode) =>
        episode.title?.toLowerCase().includes(searchQuery) ||
        episode.number.toString().includes(searchQuery),
    );
  }, [episodes, searchTerm]);

  // Apply the interval to the filtered episodes
  const displayedEpisodes = useMemo(() => {
    if (!searchTerm) {
      // If there's no search term, apply interval to all episodes
      return episodes.slice(interval[0], interval[1] + 1);
    }
    // If there is a search term, display filtered episodes without applying interval
    return filteredEpisodes;
  }, [episodes, filteredEpisodes, interval, searchTerm]);

  // Determine the interval containing the selected episode
  useEffect(() => {
    if (!selectionInitiatedByUser) {
      const selectedEpisode = episodes.find(
        (episode) => episode.id === selectedEpisodeId,
      );
      if (selectedEpisode) {
        // Find the interval containing the selected episode
        for (let i = 0; i < intervalOptions.length; i++) {
          const { start, end } = intervalOptions[i];
          if (
            selectedEpisode.number >= start + 1 &&
            selectedEpisode.number <= end + 1
          ) {
            setInterval([start, end]);
            break;
          }
        }
      }
    }
  }, [episodes, selectedEpisodeId, intervalOptions, selectionInitiatedByUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        selectedEpisodeId &&
        episodeRefs.current[selectedEpisodeId] &&
        episodeGridRef.current &&
        !selectionInitiatedByUser
      ) {
        const episodeElement = episodeRefs.current[selectedEpisodeId];
        const container = episodeGridRef.current;

        // Ensure episodeElement is not null before proceeding
        if (episodeElement && container) {
          // Calculate episode's top position relative to the container
          const episodeTop =
            episodeElement.getBoundingClientRect().top -
            container.getBoundingClientRect().top;

          // Calculate the desired scroll position to center the episode in the container
          const episodeHeight = episodeElement.offsetHeight;
          const containerHeight = container.offsetHeight;
          const desiredScrollPosition =
            episodeTop + episodeHeight / 2 - containerHeight / 2;

          container.scrollTo({
            top: desiredScrollPosition,
            behavior: 'smooth',
          });

          setSelectionInitiatedByUser(false);
        }
      }
    }, 100); // A delay ensures the layout has stabilized, especially after dynamic content loading.

    return () => clearTimeout(timer);
  }, [selectedEpisodeId, episodes, displayMode, selectionInitiatedByUser]);

  // Render the EpisodeList component
  return (
    <ListContainer $maxHeight={maxListHeight}>
      <ControlsContainer>
        <SelectInterval
          onChange={handleIntervalChange}
          value={`${interval[0]}-${interval[1]}`}
        >
          {intervalOptions.map(({ start, end }, index) => (
            <option key={index} value={`${start}-${end}`}>
              {`${start + 1} - ${end + 1}`}
            </option>
          ))}
        </SelectInterval>

        <SearchContainer>
          <Icon>
            <FontAwesomeIcon icon={faSearch} />
          </Icon>
          <SearchInput
            type='text'
            placeholder='Filter episodes...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
        <LayoutToggle
          onClick={toggleHideSpoiler}
          title='Toggle Spoilers'
          aria-label={hideSpoiler ? 'Show spoilers' : 'Hide spoilers'}
        >
          <FontAwesomeIcon icon={hideSpoiler ? faEyeSlash : faEye} />
        </LayoutToggle>
        <LayoutToggle
          onClick={toggleLayoutPreference}
          aria-label={
            displayMode === 'grid'
              ? 'Switch to list view'
              : 'Switch to grid view'
          }
        >
          {displayMode === 'list' && <FontAwesomeIcon icon={faThList} />}
          {displayMode === 'grid' && <FontAwesomeIcon icon={faTh} />}
          {displayMode === 'imageList' && <FontAwesomeIcon icon={faImage} />}
        </LayoutToggle>
      </ControlsContainer>
      <EpisodeGrid
        key={`episode-grid-${displayMode}`}
        $isRowLayout={isRowLayout}
        ref={episodeGridRef}
      >
        {displayedEpisodes.map((episode) => {
          const $isSelected = episode.id === selectedEpisodeId;
          const $isWatched = watchedEpisodes.some((e) => e.id === episode.id);
          // List/image modes paint the episode thumbnail behind the title
          // (blocked entirely while hideSpoiler is on — live `s` gate).
          const thumbBg =
            isRowLayout && episode.image && !hideSpoiler
              ? {
                  backgroundImage: `linear-gradient(rgba(8, 8, 8, 0.72), rgba(8, 8, 8, 0.72)), url("${episode.image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined;
          const onThumbStyle =
            thumbBg !== undefined
              ? { color: '#fff', textShadow: '0 1px 3px #000' }
              : undefined;

          return (
            <ListItem
              key={episode.id}
              $isSelected={$isSelected}
              $isRowLayout={isRowLayout}
              $isWatched={$isWatched}
              onClick={() => handleEpisodeSelect(episode.id)}
              aria-selected={$isSelected}
              aria-label={`EP ${episode.number}: ${episode.title}`}
              title={`EP ${episode.number}: ${episode.title}`}
              style={thumbBg}
              ref={(el) => (episodeRefs.current[episode.id] = el)} // Reference to each episode's button
            >
              {displayMode === 'imageList' ? (
                <>
                  <div>
                    <EpisodeNumber>{episode.number}. </EpisodeNumber>
                    <EpisodeTitle>{episode.title}</EpisodeTitle>
                  </div>
                  <EpisodeImageWrap>
                    <EpisodeImage
                      className={hideSpoiler ? 'spoiler-hidden' : undefined}
                      src={episode.image}
                      // Live `s` gate: hidden alt drops the title entirely.
                      alt={
                        hideSpoiler
                          ? `EP ${episode.number}`
                          : `EP ${episode.number} titled '${episode.title}'`
                      }
                    />
                    <SpoilerOverlay
                      className={hideSpoiler ? 'visible' : undefined}
                    >
                      HIDDEN SPOILER
                    </SpoilerOverlay>
                  </EpisodeImageWrap>
                </>
              ) : displayMode === 'grid' ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                    }}
                  >
                    {$isSelected ? (
                      <FontAwesomeIcon icon={faPlay} />
                    ) : (
                      <EpisodeNumber>{episode.number}</EpisodeNumber>
                    )}
                  </div>
                </>
              ) : (
                // Render for 'list' layout
                <>
                  <EpisodeNumber style={onThumbStyle}>
                    {episode.number}.{' '}
                  </EpisodeNumber>
                  <EpisodeTitle style={onThumbStyle}>
                    {episode.title}
                  </EpisodeTitle>
                  {$isSelected && <FontAwesomeIcon icon={faPlay} />}
                </>
              )}
            </ListItem>
          );
        })}
      </EpisodeGrid>
    </ListContainer>
  );
};
