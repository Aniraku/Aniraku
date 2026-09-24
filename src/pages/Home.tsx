import { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { FaBullhorn } from 'react-icons/fa';
import {
  HomeCarousel,
  CardGrid,
  StyledCardGrid,
  SkeletonSlide,
  SkeletonCard,
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
  EpisodeCard,
  GenreRail,
  HomeBanner,
  HomeTabs,
  MiniSchedule,
  SidePanel,
  type Anime,
  type Paging,
} from '../index';
import { runNewEpisodeNotifications, subscribeToSession } from '../lib/sync';
import { useSeo } from '../utils/seo';
// NSFW gate (Wave C) — Aniraku Home.jsx:544-550 / Hero.jsx:33: every browse
// row + the hero carousel run through filterAdult (Hentai-genre rule, default
// OFF → hidden). Sync payloads stay unfiltered (user decision).
import { filterAdult, useNsfw } from '../hooks/useNsfw';

// ---------------------------------------------------------------------------
// Home (miruro.to 1:1 page structure):
//   sr-only h1 → simpleLayout [hero, genre rail, continue watching,
//   contentSidebarLayout [mainContent: tabs block (banner + tabs + grid),
//   sidelist row (JUST FINISHED / TOP MOVIES); side: TOP AIRING, ad slot,
//   UPCOMING (megaphone), schedule slot (MiniSchedule)]]
// ---------------------------------------------------------------------------

const SimpleLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  margin: 0 auto;
  border-radius: var(--global-border-radius);
`;

// Live uses class `vh` (visually-hidden h1); can't edit shared CSS.
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
// matching what the live site shows; falls back to trending on failure.
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
    `/search?season=${justFinishedSeason.season}` +
    `&startDate_like=${justFinishedSeason.year}%25` +
    `&status=FINISHED&sort=POPULARITY_DESC`;

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
    `&status=NOT_YET_RELEASED&sort=POPULARITY_DESC`;

  // NSFW (Aniraku Home.jsx:544): rows are filtered at render derivation.
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

  // Side data (+ hero — TOP AIRING is shared with the carousel, live `n`).
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

  // Hero / TOP AIRING (live `k({page:1, perPage:12})` feeds both).
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

  // UPCOMING.
  useEffect(() => {
    let cancelled = false;
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
    return () => {
      cancelled = true;
    };
  }, []);

  // TOP MOVIES (format=MOVIE, sort=SCORE_DESC — live `A(...)`).
  useEffect(() => {
    let cancelled = false;
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
    return () => {
      cancelled = true;
    };
  }, []);

  // JUST FINISHED — popular shows from the season that just ended (local
  // season/year query vs live endDate_greater; reported as a difference).
  // The listPath carries the same season/year (see justFinishedSeason above)
  // so "view all" shows just-finished titles, not every old FINISHED title.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdvancedSearch('', 1, 12, {
          season: justFinishedSeason.season,
          year: justFinishedSeason.year,
          status: 'FINISHED',
          sort: ['POPULARITY_DESC'],
        });
        if (!cancelled) setJustFinished(data.results);
      } catch {
        if (!cancelled) setFinishedError(true);
      } finally {
        if (!cancelled) setFinishedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
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

  // SEO (ported from Aniraku's lib/seo.js setHomepageSEO + index.html copy).
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

  // Wave B — NEW-EPISODE NOTIFICATION LOOP (mount point = Aniraku's Home,
  // Home.jsx:589-614): logged-in only, once per session user. For each
  // bookmarked anime it compares the last-known episode (LS
  // `miruro:episode-track`, 6h cooldown), dedupes against the
  // `notifications` table, then inserts {user_id, type:'new_episode',
  // message, anime_id}. Session detection goes through lib/sync
  // (supabase.auth directly — no auth-hook import).
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeToSession((userId) => {
      if (!userId || cancelled) return;
      runNewEpisodeNotifications(userId).catch(() => {
        // best-effort: AniList/Supabase unreachable → no notifications
      });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Live toast texts → console (no toast system locally; reported).
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

  // Live `g = loading || (error && empty)`.
  const heroLoading =
    topAiringLoading || (topAiringError && topAiring.length === 0);
  const upcomingPanelLoading =
    upcomingLoading || (upcomingError && upcoming.length === 0);
  const moviesPanelLoading =
    topMoviesLoading || (topMoviesError && topMovies.length === 0);
  const finishedPanelLoading =
    finishedLoading || (finishedError && justFinished.length === 0);

  // NSFW-derived views (Aniraku Home.jsx:545-550 filterAdult per row +
  // Hero.jsx:33 for the carousel): Hentai titles drop out while the
  // preference is OFF (default).
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
