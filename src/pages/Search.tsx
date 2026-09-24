import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import {
  SearchFilters,
  parseFilterValues,
  serializeFilterValues,
  type SearchFilterValues,
} from '../components/Navigation/SearchFilters';
import {
  CardGrid,
  StyledCardGrid,
  fetchAdvancedSearch,
  SkeletonCard,
} from '../index';
import { Paging } from '../index';
import { Anime } from '../index';
// NSFW gate (Wave C) — Aniraku Catalog.jsx:966-974: browse results run
// through filterAdult (Hentai-genre rule, default OFF → hidden).
import { filterAdult, useNsfw } from '../hooks/useNsfw';
import { useSeo, breadcrumbLd } from '../utils/seo';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  font-size: 0.9rem;
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

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const LoadMoreSentinel = styled.div`
  width: 100%;
`;

// Inline error toast (live uses sonner: title + description).
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

// Simple keyword box (mobile-first; mirrors the navbar input's look).
const SearchBox = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  color: var(--global-text);
  background-color: var(--global-card-bg);
  border: 1px solid var(--global-border-color);
  border-radius: 0.75rem;
  outline: none;

  &::placeholder {
    color: var(--global-text-muted);
  }

  &:focus {
    border-color: var(--primary-accent);
  }
`;

const TOAST_DISMISS_MS = 4000;

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven state: every filter lives in the query string.
  const query = searchParams.get('query') || '';

  // Mobile wave: the navbar keyword box is display:none at ≤500px and this
  // page is exactly what the bottom-nav Search tab opens — so the page owns a
  // simple keyword input ("just simple search"). Local state + 350ms debounce
  // writes the same ?query= the navbar path uses; skipSync stops the echo-back
  // from clobbering mid-typing text; spRef keeps concurrent filter edits safe.
  const [inputValue, setInputValue] = useState(query);
  const queryRef = useRef(query);
  queryRef.current = query;
  const spRef = useRef(searchParams);
  spRef.current = searchParams;
  const skipSync = useRef(false);
  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false;
      return;
    }
    setInputValue(query);
  }, [query]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed === queryRef.current) return;
      skipSync.current = true;
      const next = new URLSearchParams(spRef.current);
      if (trimmed) next.set('query', trimmed);
      else next.delete('query');
      setSearchParams(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [inputValue, setSearchParams]);
  const filters = useMemo(
    () => parseFilterValues(searchParams),
    [searchParams],
  );
  const filtersKey = JSON.stringify(filters);

  const [animeData, setAnimeData] = useState<Anime[]>([]);
  const [pageInfo, setPageInfo] = useState<Paging | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);

  const fetchSeq = useRef(0);
  const loadingMoreRef = useRef(false);

  // NSFW (Aniraku Catalog.jsx:966-970): filter at render derivation.
  const { nsfwEnabled } = useNsfw();
  const visibleResults = useMemo(
    () => filterAdult(animeData, nsfwEnabled),
    [animeData, nsfwEnabled],
  );

  // SEO (ported from Aniraku's lib/seo.js setCatalogSEO search branch;
  // re-runs when the ?query= changes, jsonLD/meta replaced in place).
  useSeo({
    title: query
      ? `Search: ${query} — Anime Results | Aniraku`
      : 'Search Anime — Browse the Catalog | Aniraku',
    description: query
      ? `Search results for "${query}" on Aniraku. Find and watch anime online for free with subtitles and dubs.`
      : 'Search the Aniraku anime catalog by title, genre, season, and year. Watch anime online for free in HD with subtitles and dubs.',
    canonicalPath: '/search',
    jsonLd: breadcrumbLd('Search', '/search'),
  });

  // Scroll to top when the query (or filters) change; reset pagination.
  useEffect(() => {
    setPage(1);
    const timeout = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [query, filtersKey]);

  const initiateFetchAdvancedSearch = useCallback(async () => {
    const seq = ++fetchSeq.current;
    if (page === 1) setIsLoading(true);
    else setIsFetchingNextPage(true);
    try {
      const fetchedData = await fetchAdvancedSearch(query, page, 15, {
        genres: filters.genres,
        year: filters.startDate_like
          ? String(filters.startDate_like).replace(/[^0-9]/g, '')
          : '',
        season: filters.season,
        format: filters.format,
        status: filters.status,
        sort: filters.sort.length ? filters.sort : ['POPULARITY_DESC'],
        // NOTE: tags, source, countryOfOrigin, isAdult, dubLanguage and
        // averageScore are URL-synced but not supported by the local API
        // layer (useApi.ts fetchAdvancedSearch) — see report.
      });
      if (seq !== fetchSeq.current) return; // stale response
      setAnimeData((prev) =>
        page === 1 ? fetchedData.results : [...prev, ...fetchedData.results],
      );
      setPageInfo({
        currentPage: fetchedData.currentPage,
        hasNextPage: fetchedData.hasNextPage,
        totalPages: fetchedData.totalPages,
        totalResults: fetchedData.totalResults,
        results: fetchedData.results,
      });
      setError(null);
    } catch (err) {
      if (seq !== fetchSeq.current) return;
      console.error('Error fetching data:', err);
      setError('Failed to load search results');
    } finally {
      if (seq === fetchSeq.current) {
        setIsLoading(false);
        setIsFetchingNextPage(false);
      }
    }
  }, [query, page, filters]);

  // Hide the toast automatically, like a toast library would.
  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(
      () => setError(null),
      TOAST_DISMISS_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    initiateFetchAdvancedSearch();
  }, [initiateFetchAdvancedSearch]);

  // Infinite scroll: sentinel observed with IntersectionObserver (rootMargin
  // 20px, threshold 1) exactly like the live Search route.
  const handleLoadMore = useCallback(() => {
    if (!pageInfo?.hasNextPage) return;
    if (isLoading || isFetchingNextPage) return;
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setPage((prevPage) => prevPage + 1);
  }, [pageInfo?.hasNextPage, isLoading, isFetchingNextPage]);

  useEffect(() => {
    loadingMoreRef.current = false;
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore();
      },
      { root: null, rootMargin: '20px', threshold: 1 },
    );
    const sentinel = document.getElementById('load-more');
    if (sentinel) observer.observe(sentinel);
    return () => {
      if (sentinel) observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [handleLoadMore]);

  const handleFiltersChange = useCallback(
    (nextFilters: SearchFilterValues) => {
      setSearchParams(serializeFilterValues(query, nextFilters), {
        replace: true,
      });
    },
    [query, setSearchParams],
  );

  const hasNextPage = !!pageInfo?.hasNextPage;
  const showLoading =
    (isLoading && page === 1) || (!!error && animeData.length === 0);

  return (
    <Container>
      <VisuallyHiddenH1>
        {query ? `Search Results for "${query}"` : 'Search Anime'}
      </VisuallyHiddenH1>
      <SearchBox
        type='search'
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder='Search anime…'
        aria-label='Search anime'
      />
      <SearchFilters
        currentFilters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <ResultsContainer>
        {showLoading ? (
          <StyledCardGrid>
            {Array.from({ length: 15 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </StyledCardGrid>
        ) : (
          <CardGrid
            animeData={visibleResults}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMore}
          />
        )}
        {hasNextPage && <LoadMoreSentinel id='load-more' />}
      </ResultsContainer>

      {error && (
        <ErrorToast role='alert'>
          <strong>{error}</strong>
          <span>Please try again later.</span>
        </ErrorToast>
      )}
    </Container>
  );
};

export default Search;
