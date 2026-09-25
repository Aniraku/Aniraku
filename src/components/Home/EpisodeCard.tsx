import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import { Episode } from '../../index';
import { IoIosCloseCircleOutline } from 'react-icons/io';
import { watchPathFor } from '../../utils/animePaths';
import {
  type HistoryRow,
  removeAnimeFromServer,
  subscribeToWatchHistory,
} from '../../lib/watchHistory';
import {
  ensureDataSync,
  fetchServerHistoryRows,
  forgetSyncedAnime,
  getSessionUserId,
  subscribeToSession,
} from '../../lib/sync';

// Wave B — one rendered Continue Watching card (local native row or a
// `watch_history` server row), normalized to Aniraku's ContinueWatching
// candidate shape.
interface ContinueCard {
  /** `animeId:episodeNumber` — Aniraku merge key (`${animeId}-${episode}`). */
  key: string;
  animeId: string;
  number: number;
  image: string;
  animeTitle: string;
  /** `' - ' + episode.title` fragment lives separately (native cards only). */
  episodeTitle: string;
  percentage: number;
  timestamp: number;
  local: boolean;
  watchPath: string;
}

const LOCAL_STORAGE_KEYS = {
  WATCHED_EPISODES: 'watched-episodes',
  LAST_ANIME_VISITED: 'last-anime-visited',
};

interface LastVisitedData {
  [key: string]: {
    timestamp?: number;
    titleEnglish?: string;
    titleRomaji?: string;
  };
}

const StyledSwiperContainer = styled(Swiper)`
  position: relative;
  max-width: 100%;
  height: auto;
  border-radius: var(--global-border-radius);
  cursor: grab;
`;

const StyledSwiperSlide = styled(SwiperSlide)``;

const PlayIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ffffff;
  font-size: 2.5rem;
  opacity: 0;
  z-index: 1;
  transition: opacity 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AnimeEpisodeCard = styled(Link)`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0;
  border-radius: var(--global-border-radius);
  overflow: hidden;
  transition: 0.2s ease-in-out;

  &:hover,
  &:active,
  &:focus {
    box-shadow: 2px 2px 14px var(--global-card-shadow);
    ${PlayIcon} {
      opacity: 1;
    }

    img {
      filter: brightness(0.5);
    }
  }

  img {
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    transition: filter 0.2s ease-in-out;
  }

  .episode-info {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 0.5rem;
    background: linear-gradient(
      360deg,
      rgba(8, 8, 8, 0.9) -15%,
      transparent 100%
    );
    color: var(--opposite);
    .episode-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.95rem;
      font-weight: bold;
      margin: 0.25rem 0;
    }
    .episode-number {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.65);
      margin: 0;
    }
  }
`;

const Section = styled.section`
  padding: 0rem;
  margin-bottom: 0.5rem;
  border-radius: var(--global-border-radius);
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 0.25rem;
  border-radius: var(--global-border-radius);
  background-color: var(--primary-accent);
  transition: width 0.3s ease-in-out;
`;

const TitleBlock = styled.div`
  width: max-content;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.span`
  display: inline-block;
  width: 100%;
  margin: 0;
  font-size: 1rem;
  font-weight: 400;
  color: var(--global-text-muted);
`;

const HeaderLink = styled(Link)`
  position: relative;
  display: flex;
  align-items: center;
  max-width: max-content;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--global-text);
  text-decoration: none;
  border-radius: var(--global-border-radius);
  transition: all 0.2s ease-out;

  &:hover {
    padding-left: 0.25rem;
    color: var(--primary-accent);
  }
`;

const FullHeightSlide = styled(SwiperSlide)`
  height: 100%;
`;

const ButtonCard = styled(Link)`
  display: flex;
  height: 100%;
  aspect-ratio: 16 / 9;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 400;
  color: var(--global-text-muted);
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  transition: 0.2s ease-in-out;

  &:hover {
    border: 1px solid var(--global-text);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  right: 0;
  top: 0;
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  opacity: 0;
  transition: 0.2s ease-in-out;
  padding: 0.35rem;

  svg {
    transition: 0.2s ease-in-out;
    transform: scale(0.95);
    font-size: 1.5rem;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6));
    &:hover,
    &:active,
    &:focus {
      transform: scale(1);
    }
  }

  ${AnimeEpisodeCard}:hover & {
    opacity: 1;
  }

  @media (max-width: 500px) {
    opacity: 1;
    /* mobile pass: always-visible close button grows 35px → ~46px tap target */
    padding: 0.7rem;
  }
`;

// Live `Zn` breakpoints: how many 16:9 cards fit at each viewport width.
const calculateSlidesPerView = (windowWidth: number): number => {
  if (windowWidth >= 1750) return 5;
  if (windowWidth >= 1400) return 4;
  if (windowWidth >= 1200) return 3.5;
  if (windowWidth >= 1000) return 3;
  if (windowWidth >= 800) return 2.5;
  if (windowWidth >= 600) return 2;
  return 1.65;
};

export const EpisodeCard: React.FC = () => {
  const [watchedEpisodesData, setWatchedEpisodesData] = useState(
    localStorage.getItem('watched-episodes'),
  );
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // Live loads 10 slides, +5 on reach-end, capped at 14 (Xn). Wave B starts
  // at 12: Aniraku's Continue Watching merges server ∪ local and takes the
  // top 12 (ContinueWatching.jsx:144-145); the +5 growth/cap 14 is kept.
  const [limit, setLimit] = useState(12);
  // Wave B — server side of the merge + invalidation revision.
  const [serverRows, setServerRows] = useState<HistoryRow[]>([]);
  const [historyRevision, setHistoryRevision] = useState(0);

  const lastVisitedData = useMemo<LastVisitedData>(() => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_ANIME_VISITED);
    try {
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }, [historyRevision]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Session-scoped server fetch (supabase.auth via lib/sync — no auth hook),
  // mirroring Aniraku's `if (!user) return` + fetch-on-user effect.
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeToSession((userId) => {
      if (!userId) {
        if (!cancelled) setServerRows([]);
        return;
      }
      ensureDataSync(userId);
      fetchServerHistoryRows(userId)
        .then((rows) => {
          if (!cancelled) setServerRows(rows);
        })
        .catch(() => {
          // offline / unconfigured client — local cards stay visible
        });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Same-tab history events (merge-on-login reconcile, throttled flushes)
  // refresh both native sources; cross-tab `storage` is handled by the
  // shared subscribeToWatchHistory helper.
  useEffect(
    () =>
      subscribeToWatchHistory(() => {
        setWatchedEpisodesData(localStorage.getItem('watched-episodes'));
        setHistoryRevision((value) => value + 1);
      }),
    [],
  );

  const episodesToRender = useMemo<ContinueCard[]>(() => {
    // --- local native cards (unchanged derivation, one per anime) --------
    const localByAnime = new Map<string, ContinueCard>();
    if (watchedEpisodesData) {
      try {
        const allEpisodes: Record<string, Episode[]> = JSON.parse(
          watchedEpisodesData,
        );
        const playbackInfo = JSON.parse(
          localStorage.getItem('all_episode_times') || '{}',
        ) as {
          [key: string]: { playbackPercentage: number };
        };

        for (const [animeId, episodes] of Object.entries(allEpisodes)) {
          const lastEpisode = episodes[episodes.length - 1];
          if (!lastEpisode) continue;

          const visit = lastVisitedData[animeId] ?? {};
          const animeTitle = visit.titleEnglish || visit.titleRomaji || '';
          const playbackPercentage =
            playbackInfo[lastEpisode.id]?.playbackPercentage ||
            playbackInfo[`${animeId}-episode-${lastEpisode.number}`]
              ?.playbackPercentage ||
            0;

          localByAnime.set(animeId, {
            key: `${animeId}:${lastEpisode.number}`,
            animeId,
            number: lastEpisode.number,
            image: lastEpisode.image || '',
            animeTitle,
            episodeTitle: lastEpisode.title ? ` - ${lastEpisode.title}` : '',
            percentage: playbackPercentage,
            timestamp: Number(visit.timestamp) || 0,
            local: true,
            watchPath: watchPathFor(
              {
                id: animeId,
                title: {
                  english: visit.titleEnglish,
                  romaji: visit.titleRomaji,
                },
              },
              lastEpisode.number,
            ),
          });
        }
      } catch (error) {
        console.error('Failed to parse watched episodes data:', error);
        return [];
      }
    }

    // --- server ∪ local, merged by key, newer write wins -----------------
    // (Aniraku ContinueWatching.jsx:112-161: byKey map, candidate wins when
    // `candidate.timestamp > existing.timestamp`, sort ts desc, top 12.)
    const mergedByKey = new Map<string, ContinueCard>();
    for (const card of localByAnime.values()) mergedByKey.set(card.key, card);
    for (const row of serverRows) {
      if (!Number.isFinite(row.anime_id) || row.anime_id <= 0) continue;
      const key = `${row.anime_id}:${row.episode_number}`;
      const candidate: ContinueCard = {
        key,
        animeId: String(row.anime_id),
        number: row.episode_number,
        image: row.anime_image || '',
        animeTitle: row.anime_title || '',
        episodeTitle: '',
        percentage:
          row.duration > 0
            ? Math.min(
                100,
                Math.round((row.progress / row.duration) * 100),
              )
            : 0,
        timestamp: Number(row.timestamp) || 0,
        local: false,
        watchPath: watchPathFor(
          {
            id: String(row.anime_id),
            title: { english: row.anime_title },
          },
          row.episode_number,
        ),
      };
      const existing = mergedByKey.get(key);
      if (!existing || candidate.timestamp > existing.timestamp) {
        mergedByKey.set(key, candidate);
      }
    }

    // Keep ONE card per anime (native invariant) — collapse to the
    // newest candidate, then sort timestamp desc and take the top `limit`
    // (12 default per Aniraku).
    const byAnime = new Map<string, ContinueCard>();
    for (const card of mergedByKey.values()) {
      const existing = byAnime.get(card.animeId);
      if (!existing || card.timestamp > existing.timestamp) {
        byAnime.set(card.animeId, card);
      }
    }

    return [...byAnime.values()]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [watchedEpisodesData, lastVisitedData, serverRows, limit]);

  // Close = drop the anime from Continue Watching: native local removal
  // (unchanged) + the anime's server rows (state + `watch_history`) so the
  // merged card cannot resurrect on the next fetch.
  const handleRemoveCard = (card: ContinueCard) => {
    if (card.local && watchedEpisodesData) {
      try {
        const updatedEpisodes = JSON.parse(watchedEpisodesData || '{}');
        delete updatedEpisodes[card.animeId];
        const newWatchedEpisodesData = JSON.stringify(updatedEpisodes);
        localStorage.setItem('watched-episodes', newWatchedEpisodesData);
        setWatchedEpisodesData(newWatchedEpisodesData);
      } catch {
        // stale storage is non-fatal
      }
    }
    setServerRows((rows) =>
      rows.filter((row) => String(row.anime_id) !== card.animeId),
    );
    forgetSyncedAnime(card.animeId);
    getSessionUserId()
      .then((userId) => (userId ? removeAnimeFromServer(userId, card.animeId) : undefined))
      .catch(() => {
        // offline / unconfigured client — local removal already applied
      });
  };

  const cardsToRender = episodesToRender.map((card, index) => {
    const displayTitle = `${card.animeTitle}${card.episodeTitle}`;
    return (
      <StyledSwiperSlide key={`${card.key}-${index}`}>
        <AnimeEpisodeCard
          to={card.watchPath}
          style={{ textDecoration: 'none' }}
          title={`Continue Watching ${displayTitle}`}
        >
          <img src={card.image} alt={`Cover for ${card.animeTitle}`} />
          <PlayIcon aria-label='Play Episode'>
            <FaPlay />
          </PlayIcon>
          <div className='episode-info'>
            <p className='episode-title'>{displayTitle}</p>
            <p className='episode-number'>{`Episode ${card.number}`}</p>
          </div>
          <ProgressBar
            style={{ width: `${Math.max(card.percentage, 5)}%` }}
          />
          <CloseButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemoveCard(card);
            }}
            aria-label='Remove from Continue Watching'
          >
            <IoIosCloseCircleOutline />
          </CloseButton>
        </AnimeEpisodeCard>
      </StyledSwiperSlide>
    );
  });

  const hasItems = cardsToRender.length > 0;

  const swiperSettings = useMemo(
    () => ({
      spaceBetween: 20,
      slidesPerView: calculateSlidesPerView(windowWidth),
      cssMode: windowWidth < 600,
      loop: false,
      freeMode: true,
      grabCursor: true,
      keyboard: { enabled: true },
      onReachEnd: () => setLimit((l) => Math.min(l + 5, 14)),
    }),
    [windowWidth],
  );

  if (!hasItems) return null;

  return (
    <Section aria-labelledby='continueWatchingTitle'>
      <TitleBlock>
        <Subtitle id='continueWatchingTitle'>Your Watchlist</Subtitle>
        <HeaderLink to='/history'>Watch History</HeaderLink>
      </TitleBlock>
      <StyledSwiperContainer {...swiperSettings} aria-label='Episodes carousel'>
        {cardsToRender}
        <FullHeightSlide key='more'>
          <ButtonCard to='/history'>View More</ButtonCard>
        </FullHeightSlide>
      </StyledSwiperContainer>
    </Section>
  );
};
