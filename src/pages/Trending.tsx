import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  CardGrid,
  StyledCardGrid,
  SkeletonCard,
  fetchAdvancedSearch,
} from '../index';
import { Anime } from '../index';
// NSFW gate (Wave C) — Aniraku Catalog.jsx:970-974 shelf filtering: browse
// results run through filterAdult (Hentai-genre rule, default OFF → hidden).
import { filterAdult, useNsfw } from '../hooks/useNsfw';
import { useSeo, breadcrumbLd } from '../utils/seo';

// Same order as the live bundle (`ys` / `qt` season list).
const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'] as const;
const PER_PAGE = 21;

const CURRENT_YEAR = new Date().getFullYear();

const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1979 + 1 },
  (_, i) => CURRENT_YEAR - i,
); // current year down to 1980

// Live `Eg` season helper: months 1-3 Winter, 4-6 Spring, 7-9 Summer, 10-12 Fall.
const currentSeason = (): (typeof SEASONS)[number] => {
  const m = new Date().getMonth() + 1;
  if (m >= 1 && m <= 3) return 'WINTER';
  if (m >= 4 && m <= 6) return 'SPRING';
  if (m >= 7 && m <= 9) return 'SUMMER';
  return 'FALL';
};

const capitalizeSeason = (season: string) =>
  season.charAt(0) + season.slice(1).toLowerCase();

// Centers an item inside its rail scroller without moving the page
// (`scrollIntoView` also bubbles to every scrollable ancestor, which
// yanked the whole page on load/change with two stacked rails).
const centerRailItem = (
  rail: HTMLElement | null,
  el: HTMLElement | null,
): void => {
  if (!rail || !el) return;
  const railRect = rail.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  rail.scrollTo({
    left:
      rail.scrollLeft +
      (elRect.left - railRect.left) -
      rail.clientWidth / 2 +
      elRect.width / 2,
    behavior: 'smooth',
  });
};

// Initial state from URL params (season, year, page), like live.
const readUrlState = () => {
  const params = new URLSearchParams(window.location.search);
  const seasonParam = params.get('season')?.toUpperCase();
  return {
    season:
      seasonParam && (SEASONS as readonly string[]).includes(seasonParam)
        ? seasonParam
        : currentSeason(),
    year: Number(params.get('year')) || CURRENT_YEAR,
    page: Math.max(1, Number(params.get('page')) || 1),
  };
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 125rem;
  margin: 0 auto;
  --animation-duration: 0.4s;
  --animation-timing: ease-in-out;
  --animation-easing: ease-in-out;
`;

// Visually-hidden heading, same as live `.vh`.
const VisuallyHiddenH1 = styled.h1`
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

const TrendingFilters = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  /* mobile pass: same safe-center pattern as MiniSchedule DayScroll —
     overflow (season row / pager at ~375px) starts at the scroll origin */
  align-items: safe center;
  justify-content: center;
  width: 100%;
  overflow: auto hidden;
  text-align: center;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SeasonWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  /* safe center: plain center clips the overflowing edge where no scroll
     can reach it — with 4 big-text seasons overflowing phones, Winter was
     cut off and unreachable. Falls back to start when overflowing. */
  justify-content: safe center;
  width: auto;
  max-width: 100%;
  margin: 0 auto;
  overflow-x: auto;
  font-size: 2rem;
  font-weight: 700;
  color: var(--global-text);
  text-align: center;
  user-select: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SeasonButton = styled.button`
  flex-shrink: 0;
  padding: 0;
  margin: 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--global-text-muted);
  cursor: pointer;
  background: none;
  border: none;
  transition: color 0.2s ease-in-out;

  &[data-selected='true'] {
    color: var(--global-text);
  }

  @media (max-width: 700px) {
    font-size: 2rem;
  }
`;

const SeasonDivider = styled.span`
  flex-shrink: 0;
  margin: 0.5rem 0;
  font-size: 2.5rem;
  color: var(--global-text-muted);

  @media (max-width: 700px) {
    font-size: 2rem;
  }
`;

const YearRail = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  overflow-x: auto;
  font-size: 2rem;
  font-weight: 700;
  color: var(--global-text);
  text-align: center;
  user-select: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const PaginationContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
`;

const PaginationInfo = styled.div`
  color: var(--global-text);

  strong {
    font-weight: 700;
  }
`;

const PaginationControls = styled.div`
  margin-left: auto;
`;

// Pagination — ported from the live `_wrapper_1xyro` module.
const PagerWrapper = styled.div`
  display: flex;
  width: 100%;
  max-width: max-content;
  overflow: hidden;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const PagerButton = styled.button`
  padding: 0.5rem 1rem;
  color: var(--global-text);
  cursor: pointer;
  background-color: var(--global-div);
  border: none;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  &:not(:disabled):hover {
    filter: brightness(1.5);
  }

  @media (max-width: 700px) {
    /* mobile pass: pager buttons ~35px → 44px tap target */
    min-height: 2.75rem;
  }
`;

const PagerInput = styled.input`
  width: 1.5rem;
  padding: 0.5rem;
  color: var(--global-text);
  text-align: center;
  background-color: var(--global-div);
  border: none;
  outline: none;
  opacity: 0.5;

  &::placeholder {
    color: var(--global-text-muted);
  }
`;

const PagerEllipsis = styled.span`
  padding: 0.5rem 1rem;
`;

const ErrorToast = styled.div`
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: var(--z-index-modal);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 20rem;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: var(--global-text);
  background-color: var(--global-card-bg);
  border: 1px solid var(--global-border-color);
  border-radius: 0.75rem;
  box-shadow: var(--global-card-shadow);
  animation: fadeIn 0.3s ease-in-out;
`;

const TOAST_DISMISS_MS = 4000;

interface PageInfoState {
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
}

interface PagerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Numbered pagination with page input (live Pagination component markup).
const Pagination: React.FC<PagerProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [inputValue, setInputValue] = useState(currentPage.toString());

  useEffect(() => {
    setInputValue(currentPage.toString());
  }, [currentPage]);

  const goTo = (target: number) => {
    if (target >= 1 && target <= totalPages) {
      onPageChange(target);
      setInputValue(target.toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value.replace(/[^0-9]/g, ''));
  };

  const commitInput = () => {
    const target = parseInt(inputValue, 10);
    if (Number.isNaN(target)) setInputValue(currentPage.toString());
    else goTo(target);
  };

  const items: number[] = [];
  items.push(1);
  if (currentPage > 2) items.push(-1);
  if (currentPage > 1 && currentPage < totalPages) items.push(currentPage);
  if (currentPage < totalPages - 1) items.push(-1);
  if (totalPages > 1) items.push(totalPages);

  return (
    <PagerWrapper>
      <PagerButton
        type='button'
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        title='Previous Page'
        aria-label='Previous Page'
      >
        <FiChevronLeft />
      </PagerButton>
      {items.map((item, index) => {
        const key = `${item}-${index}`;
        if (item === -1) {
          return <PagerEllipsis key={key}>...</PagerEllipsis>;
        }
        if (item === currentPage) {
          return (
            <PagerInput
              key={key}
              type='text'
              inputMode='numeric'
              value={inputValue}
              onChange={handleInputChange}
              onBlur={commitInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitInput();
              }}
              title='Go to page'
              aria-label='Go to page'
            />
          );
        }
        return (
          <PagerButton
            key={key}
            type='button'
            onClick={() => goTo(item)}
            disabled={item === currentPage}
          >
            {item}
          </PagerButton>
        );
      })}
      <PagerButton
        type='button'
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        title='Next Page'
        aria-label='Next Page'
      >
        <FiChevronRight />
      </PagerButton>
    </PagerWrapper>
  );
};

const Trending = () => {
  const [initial] = useState(readUrlState);
  const [season, setSeason] = useState<string>(initial.season);
  const [year, setYear] = useState<number>(initial.year);
  const [page, setPage] = useState<number>(initial.page);

  const [anime, setAnime] = useState<Anime[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfoState>({
    totalPages: 1,
    totalResults: 0,
    hasNextPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seasonButtonsRef = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );
  const yearButtonsRef = useRef<Record<number, HTMLButtonElement | null>>({});
  const seasonRailRef = useRef<HTMLDivElement | null>(null);
  const yearRailRef = useRef<HTMLDivElement | null>(null);
  const didScrollToSeason = useRef(true);
  const fetchSeq = useRef(0);

  // NSFW (Aniraku Catalog.jsx:970): filter at render derivation.
  const { nsfwEnabled } = useNsfw();
  const visibleAnime = useMemo(
    () => filterAdult(anime, nsfwEnabled),
    [anime, nsfwEnabled],
  );

  // SEO (ported from Aniraku's lib/seo.js page SEO pattern).
  useSeo({
    title: 'Trending Anime — Most Popular This Season | Aniraku',
    description:
      'Browse the top trending anime by season and year on Aniraku. Discover the most popular airing, upcoming, and classic titles — watch online free in HD with subtitles and dubs.',
    canonicalPath: '/trending',
    jsonLd: breadcrumbLd('Trending', '/trending'),
  });

  // Sync URL via replaceState (season/year/page only when non-default).
  useEffect(() => {
    const params = new URLSearchParams();
    if (season !== currentSeason()) params.set('season', season);
    if (year !== CURRENT_YEAR) params.set('year', String(year));
    if (page !== 1) params.set('page', String(page));
    const qs = params.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `?${qs}` : window.location.pathname,
    );
  }, [season, year, page]);

  // Fetch the current season/year/page (replace, not append — paginated page).
  useEffect(() => {
    const seq = ++fetchSeq.current;
    setIsLoading(true);
    const load = async () => {
      try {
        const data = await fetchAdvancedSearch('', page, PER_PAGE, {
          season,
          year: String(year),
          sort: ['TRENDING_DESC'],
        });
        if (seq !== fetchSeq.current) return;
        setAnime(data.results);
        setPageInfo({
          totalPages: data.totalPages,
          totalResults: data.totalResults,
          hasNextPage: data.hasNextPage,
        });
        setError(null);
      } catch (e) {
        if (seq !== fetchSeq.current) return;
        console.error('Trending failed:', e);
        setError('Failed to load trending anime');
      } finally {
        if (seq === fetchSeq.current) setIsLoading(false);
      }
    };
    load();
  }, [season, year, page]);

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(null), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [error]);

  // Keep the selected season button in view on first load, like live.
  useEffect(() => {
    if (didScrollToSeason.current) {
      centerRailItem(
        seasonRailRef.current,
        seasonButtonsRef.current[season],
      );
      didScrollToSeason.current = false;
    }
  }, [season]);

  // The year rail is long — keep the selected year in view on mount and
  // whenever it changes (the 4-item season rail only needs first-load).
  useEffect(() => {
    centerRailItem(yearRailRef.current, yearButtonsRef.current[year]);
  }, [year]);

  const handleSeasonChange = useCallback(
    (next: string) => {
      if (next === season) return;
      setPage(1);
      setSeason(next);
    },
    [season],
  );

  const handleYearChange = useCallback(
    (next: number) => {
      if (next === year) return;
      setPage(1);
      setYear(next);
    },
    [year],
  );

  const handlePageChange = useCallback((next: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPage(next);
  }, []);

  const showLoading = isLoading && anime.length === 0;
  const lastPage =
    pageInfo.totalPages ||
    (pageInfo.hasNextPage ? page + 1 : page) ||
    1;
  const total = pageInfo.totalResults || 0;
  const rangeStart = total ? (page - 1) * PER_PAGE + 1 : 0;
  const rangeEnd = total ? Math.min(page * PER_PAGE, total) : anime.length;

  return (
    <Container className='animFadeIn'>
      <VisuallyHiddenH1>
        {`Trending Anime ${capitalizeSeason(season)} ${year}`}
      </VisuallyHiddenH1>

      <TrendingFilters>
        <SeasonWrapper ref={seasonRailRef}>
          {SEASONS.map((s, index) => (
            <span key={s} style={{ display: 'contents' }}>
              <SeasonButton
                type='button'
                ref={(el) => {
                  seasonButtonsRef.current[s] = el;
                }}
                data-selected={String(season === s)}
                onClick={() => handleSeasonChange(s)}
                aria-pressed={season === s}
              >
                {capitalizeSeason(s)}
              </SeasonButton>
              {index < SEASONS.length - 1 && (
                <SeasonDivider aria-hidden='true'>/</SeasonDivider>
              )}
            </span>
          ))}
        </SeasonWrapper>
        {/* Year rail — same treatment as the season rail: big text options
            with "/" dividers, horizontal scroll, selected highlighted. */}
        <YearRail ref={yearRailRef} role='group' aria-label='Choose year'>
          {YEAR_OPTIONS.map((y, index) => (
            <span key={y} style={{ display: 'contents' }}>
              <SeasonButton
                type='button'
                ref={(el) => {
                  yearButtonsRef.current[y] = el;
                }}
                data-selected={String(year === y)}
                onClick={() => handleYearChange(y)}
                aria-pressed={year === y}
              >
                {y}
              </SeasonButton>
              {index < YEAR_OPTIONS.length - 1 && (
                <SeasonDivider aria-hidden='true'>/</SeasonDivider>
              )}
            </span>
          ))}
        </YearRail>
      </TrendingFilters>

      <ContentColumn>
        {showLoading ? (
          <StyledCardGrid>
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </StyledCardGrid>
        ) : (
          <CardGrid
            animeData={visibleAnime}
            hasNextPage={false}
            onLoadMore={() => {
              /* paginated page — live has no infinite scroll here */
            }}
          />
        )}
      </ContentColumn>

      <PaginationContainer>
        {total > 0 ? (
          <PaginationInfo>
            Showing <strong>{rangeStart}</strong> to{' '}
            <strong>{rangeEnd}</strong> out of <strong>{total}</strong>{' '}
            results
          </PaginationInfo>
        ) : (
          <PaginationInfo>&nbsp;</PaginationInfo>
        )}
        {lastPage > 1 && (
          <PaginationControls>
            <Pagination
              currentPage={page}
              totalPages={lastPage}
              onPageChange={handlePageChange}
            />
          </PaginationControls>
        )}
      </PaginationContainer>

      {error && (
        <ErrorToast role='alert'>
          <strong>{error}</strong>
          <span>Please try again later.</span>
        </ErrorToast>
      )}
    </Container>
  );
};

export default Trending;
