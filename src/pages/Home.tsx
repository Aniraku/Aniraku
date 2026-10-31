import { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { FaBullhorn } from 'react-icons/fa';
import {
  fetchTrendingAnime,
  fetchPopularAnime,
  fetchTopAnime,
  fetchTopAiringAnime,
  fetchUpcomingSeasons,
  fetchRecentEpisodes,
  fetchAdvancedSearch,
  getCurrentSeason,
  getNextSeason,
  year,
  type Anime,
  type Paging,
} from '../index';
import { HomeCarousel } from '../components/Home/HomeCarousel';
import CardGrid, { StyledCardGrid } from '../components/Cards/CardGrid';
import {
  SkeletonSlide,
  SkeletonCard,
} from '../components/Skeletons/Skeletons';
import { EpisodeCard } from '../components/Home/EpisodeCard';
import { GenreRail } from '../components/Home/GenreRail';
import { HomeBanner } from '../components/Home/HomeBanner';
import { HomeTabs } from '../components/Home/HomeTabs';
import { MiniSchedule } from '../components/Home/MiniSchedule';
import { SidePanel } from '../components/Home/SidePanels';

import { useSeo } from '../utils/seo';
// NSFW gate: every browse row and the hero carousel run through filterAdult
// (Hentai-genre rule, default OFF → hidden). Sync payloads stay unfiltered.
import { filterAdult, useNsfw } from '../hooks/useNsfw';

//   sr-only h1 → simpleLayout [hero, genre rail, continue watching,
//   contentSidebarLayout [mainContent: tabs block (banner + tabs + grid),
//   sidelist row (JUST FINISHED / TOP MOVIES); side: TOP AIRING, ad slot,
//   UPCOMING (megaphone), schedule slot (MiniSchedule)]]

const SimpleLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  margin: 0 auto;
  border-radius: var(--global-border-radius);
`;

// Uses class `vh` (visually-hidden h1); can't edit shared CSS.
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

const TabsRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GridSection = styled.section`
  padding: 0;
  border-radius: var(--global-border-radius);
`;

const ContentSidebarLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;

  @media (max-width: 1450px) {
    gap: 1.5rem;
  }
  @media (max-width: 1199px) {
    gap: 1rem;
  }
  @media (min-width: 1200px) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
`;

// JUST FINISHED / TOP MOVIES: row of equal panels ≥1200, hidden below.
const SideListRow = styled.div`
  display: flex;
  flex-flow: row wrap;
  gap: 1rem;
  width: 100%;

  & > * {
    flex: 1;
    min-width: 22rem;
  }

  @media (max-width: 1199px) {
    display: none;
  }
`;

const Side = styled.aside`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 1rem;
  width: 100%;

  @media (max-width: 1199px) {
    flex-flow: row wrap;
    width: 100%;
    min-width: 0;

    & > * {
      flex: 1;
      order: 0;
      /* mobile pass: min(22rem, 100%) — the fixed 22rem (352px) clipped the
         side-rail panels below ~368px viewports (body padding eats 16px);
         identical rendering at ≥375px */
      min-width: min(22rem, 100%);
    }
  }
  @media (min-width: 1200px) {
    width: 24rem;
  }
`;

// Full-width, first row when the side becomes a wrapped row (≤1199).
const ScheduleSlot = styled.div`
  width: 100%;
  min-width: 0;

  @media (max-width: 1199px) {
    flex: 0 0 100%;
    max-width: 100%;
    min-width: 0;
    order: -2;
  }
`;

const MegaPhone = styled(FaBullhorn)`
  font-size: 1.2rem;
  transform: rotate(-25deg);
`;

// NEWEST tab = latest episodes (AniList airingSchedules, deduped by anime),
// Matching what the app shows; falls back to trending on failure.
const TAB_FETCHERS: Record<
  string,
  (page: number, perPage: number) => Promise<Paging>
> = {
  newest: async (page, perPage) => {
    try {
      return await fetchRecentEpisodes(page, perPage);
    } catch (e) {
      console.error('Newest failed, falling back to trending:', e);
      return fetchTrendingAnime(page, perPage);
    }
  },
  popular: (page, perPage) => fetchPopularAnime(page, perPage),
  topRated: (page, perPage) => fetchTopAnime(page, perPage),
};

const TAB_KEYS = ['newest', 'popular', 'topRated'];
const TAB_TTL = 900000; // live tab cache window: 15 minutes

// Below-fold rails + background loops never block first paint: idle
// first, 2.5s fallback (devices without rIC), cancelled on unmount.
// Mount fan-out drops from ~8 request chains to hero + tab grid.
function deferNonCritical(work: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const ric = (
    window as unknown as {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
    }
  ).requestIdleCallback;
  if (ric) {
    const id = ric(work, { timeout: 2500 });
    return () => {
      try {
        (
          window as unknown as {
            clearIdleCallback?: (id: number) => void;
          }
        ).clearIdleCallback?.(id);
      } catch {
        // scheduler unavailable — nothing to cancel
      }
    };
  }
  const id = window.setTimeout(work, 600);
  return () => window.clearTimeout(id);
}

const Home = () => {
  const perPage = window.innerWidth > 1604 ? 18 : 12;

  // JUST FINISHED season/year (shared by the panel query + its listPath so
  // the "view all" page shows the same just-finished season — not every
  // old FINISHED title).
  const justFinishedSeason = useMemo(() => {
    const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
    const cur = getCurrentSeason().toUpperCase();
    const curIdx = SEASONS.indexOf(cur);
    const prevSeason = curIdx <= 0 ? 'FALL' : SEASONS[curIdx - 1];
    const prevYear =
      prevSeason === 'FALL' && cur === 'WINTER'
        ? Number(year) - 1
        : Number(year);
    return { season: prevSeason, year: String(prevYear) };
  }, []);
  const justFinishedPath =
    `/search?status=FINISHED&sort=END_DATE_DESC`;

  // UPCOMING season/year (same treatment — the panel queries next season,
  // so its listPath must too instead of every NOT_YET_RELEASED title).
  const upcomingSeason = useMemo(() => {
    const season = getNextSeason().toUpperCase();
    const y =
      Number(year) +
      (season === 'WINTER' && getCurrentSeason().toUpperCase() === 'FALL'
        ? 1
        : 0);
    return { season, year: String(y) };
  }, []);
  const upcomingPath =
    `/search?season=${upcomingSeason.season}` +
    `&startDate_like=${upcomingSeason.year}%25` +
    `&status=NOT_YET_RELEASED&sort=START_DATE`;

  // NSFW: rows are filtered at render derivation.
  const { nsfwEnabled } = useNsfw();

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('home tab');
      if (saved) {
        const { tab, timestamp } = JSON.parse(saved);
        if (
          TAB_KEYS.includes(tab) &&
          Date.now() - timestamp < TAB_TTL
        ) {
          return tab;
        }
      }
    } catch {
      /* ignore corrupt entry */
    }
    return 'newest';
  });
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Tabbed grid.
  const [tabAnime, setTabAnime] = useState<Anime[]>([]);
  const [tabLoading, setTabLoading] = useState(true);
  const [tabError, setTabError] = useState(false);

  const [topAiring, setTopAiring] = useState<Anime[]>([]);
  const [topAiringLoading, setTopAiringLoading] = useState(true);
  const [topAiringError, setTopAiringError] = useState(false);
  const [upcoming, setUpcoming] = useState<Anime[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState(false);
  const [topMovies, setTopMovies] = useState<Anime[]>([]);
  const [topMoviesLoading, setTopMoviesLoading] = useState(true);
  const [topMoviesError, setTopMoviesError] = useState(false);
  const [justFinished, setJustFinished] = useState<Anime[]>([]);
  const [finishedLoading, setFinishedLoading] = useState(true);
  const [finishedError, setFinishedError] = useState(false);

  // Hero / TOP AIRING share one query (page 1, 12 per page).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchTopAiringAnime(1, 12);
        if (!cancelled) setTopAiring(data.results);
      } catch {
        if (!cancelled) setTopAiringError(true);
      } finally {
        if (!cancelled) setTopAiringLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // UPCOMING (below the fold — deferred).
  useEffect(() => {
    let cancelled = false;
    const cancelDeferred = deferNonCritical(() => {
      (async () => {
        try {
          const data = await fetchUpcomingSeasons(1, 12);
          if (!cancelled) setUpcoming(data.results);
        } catch {
          if (!cancelled) setUpcomingError(true);
        } finally {
          if (!cancelled) setUpcomingLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
      cancelDeferred();
    };
  }, []);

  // TOP MOVIES (below the fold — deferred; format=MOVIE, sort=SCORE_DESC).
  useEffect(() => {
    let cancelled = false;
    const cancelDeferred = deferNonCritical(() => {
      (async () => {
        try {
          const data = await fetchAdvancedSearch('', 1, 12, {
            format: 'MOVIE',
            sort: ['SCORE_DESC'],
          });
          if (!cancelled) setTopMovies(data.results);
        } catch {
          if (!cancelled) setTopMoviesError(true);
        } finally {
          if (!cancelled) setTopMoviesLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
      cancelDeferred();
    };
  }, []);

  // JUST FINISHED (below the fold — deferred) — the titles that ENDED most
  // recently (AniList END_DATE_DESC across all FINISHED shows), so the
  // panel reflects "just finished" literally instead of a popular show from
  // a season that may have ended months ago. ListPath shares the same sort
  // so "view all" matches the panel.
  useEffect(() => {
    let cancelled = false;
    const cancelDeferred = deferNonCritical(() => {
      (async () => {
        try {
          const data = await fetchAdvancedSearch('', 1, 12, {
            status: 'FINISHED',
            sort: ['END_DATE_DESC'],
          });
          if (!cancelled) setJustFinished(data.results);
        } catch {
          if (!cancelled) setFinishedError(true);
        } finally {
          if (!cancelled) setFinishedLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
      cancelDeferred();
    };
  }, [justFinishedSeason]);

  // Tabbed grid — refetch on tab/page change.
  useEffect(() => {
    let cancelled = false;
    setTabLoading(true);
    setTabError(false);
    (async () => {
      try {
        const data = await TAB_FETCHERS[activeTab](page, perPage);
        if (cancelled) return;
        setTabAnime(data.results);
        setHasNextPage(data.hasNextPage);
      } catch {
        if (!cancelled) {
          setTabAnime([]);
          setTabError(true);
        }
      } finally {
        if (!cancelled) setTabLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, page, perPage]);

  useSeo({
    title: 'Aniraku — Free Anime Streaming | Watch Sub & Dub Online',
    description:
      'Watch anime online for free on Aniraku. Stream the latest anime episodes in HD with subtitles and dubs. Browse top airing, most popular, and trending anime series and movies.',
    canonicalPath: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Aniraku — Free Anime Streaming | Watch Sub & Dub Online',
      url: 'https://www.aniraku.tech/',
      inLanguage: 'en-US',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Aniraku',
        url: 'https://www.aniraku.tech',
      },
    },
  });

  // Toast texts → console (no toast system locally; reported).
  useEffect(() => {
    if (topAiringError)
      console.error('Failed to load top airing anime', 'Please try again later.');
  }, [topAiringError]);
  useEffect(() => {
    if (upcomingError)
      console.error('Failed to load upcoming anime', 'Please try again later.');
  }, [upcomingError]);
  useEffect(() => {
    if (topMoviesError)
      console.error('Failed to load top movies', 'Please try again later.');
  }, [topMoviesError]);
  useEffect(() => {
    if (finishedError)
      console.error(
        'Failed to load just-finished anime',
        'Please try again later.',
      );
  }, [finishedError]);
  useEffect(() => {
    if (tabError)
      console.error('Failed to load anime list', 'Please try again later.');
  }, [tabError]);

  useEffect(() => {
    localStorage.setItem(
      'home tab',
      JSON.stringify({ tab: activeTab, timestamp: Date.now() }),
    );
  }, [activeTab]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  const heroLoading =
    topAiringLoading || (topAiringError && topAiring.length === 0);
  const upcomingPanelLoading =
    upcomingLoading || (upcomingError && upcoming.length === 0);
  const moviesPanelLoading =
    topMoviesLoading || (topMoviesError && topMovies.length === 0);
  const finishedPanelLoading =
    finishedLoading || (finishedError && justFinished.length === 0);

  // NSFW-derived views (filterAdult per row and for the carousel): Hentai
  // titles drop out while the preference is OFF (default).
  const heroList = useMemo(
    () => filterAdult(topAiring, nsfwEnabled),
    [topAiring, nsfwEnabled],
  );
  const tabList = useMemo(
    () => filterAdult(tabAnime, nsfwEnabled),
    [tabAnime, nsfwEnabled],
  );
  const upcomingList = useMemo(
    () => filterAdult(upcoming, nsfwEnabled),
    [upcoming, nsfwEnabled],
  );
  const moviesList = useMemo(
    () => filterAdult(topMovies, nsfwEnabled),
    [topMovies, nsfwEnabled],
  );
  const finishedList = useMemo(
    () => filterAdult(justFinished, nsfwEnabled),
    [justFinished, nsfwEnabled],
  );

  return (
    <>
      <VisuallyHidden>Aniraku - Watch Anime Online Free</VisuallyHidden>
      <SimpleLayout>
        {heroLoading ? (
          <SkeletonSlide />
        ) : (
          <HomeCarousel data={heroList} loading={heroLoading} />
        )}

        <GenreRail />

        {/* Live gates this on settings.watchOnHome === 'Show' (setting not
            available locally — always rendered, reported). */}
        <EpisodeCard />

        <ContentSidebarLayout>
          <MainContent>
            <TabsRoot>
              <HomeBanner />
              <HomeTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                page={page}
                onPageChange={setPage}
                hasNextPage={hasNextPage}
              />
              <GridSection>
                {tabLoading ? (
                  <StyledCardGrid>
                    {Array.from({ length: perPage }, (_, index) => (
                      <SkeletonCard key={index} />
                    ))}
                  </StyledCardGrid>
                ) : tabList.length > 0 ? (
                  <CardGrid
                    animeData={tabList}
                    hasNextPage={hasNextPage}
                    onLoadMore={() => {}}
                  />
                ) : null}
              </GridSection>
            </TabsRoot>

            <SideListRow>
              <SidePanel
                title='JUST FINISHED'
                animeData={finishedList}
                loading={finishedPanelLoading}
                listPath={justFinishedPath}
              />
              <SidePanel
                title='TOP MOVIES'
                animeData={moviesList}
                loading={moviesPanelLoading}
                listPath='/search?format=MOVIE&sort=SCORE_DESC'
              />
            </SideListRow>
          </MainContent>

          <Side>
            <SidePanel
              title='TOP AIRING'
              animeData={heroList}
              loading={heroLoading}
              listPath='/search?status=RELEASING&sort=POPULARITY_DESC'
            />
            {/* Live renders a "monkey" ad component here — no local ad
                component (reported). */}
            <SidePanel
              title='UPCOMING'
              animeData={upcomingList}
              loading={upcomingPanelLoading}
              icon={<MegaPhone />}
              listPath={upcomingPath}
            />
            <ScheduleSlot>
              <MiniSchedule />
            </ScheduleSlot>
          </Side>
        </ContentSidebarLayout>
      </SimpleLayout>
    </>
  );
};

export default Home;
