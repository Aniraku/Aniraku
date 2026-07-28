import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../config'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import useDebounce from '../hooks/useDebounce'
import useMediaQuery from '../hooks/useMediaQuery'
import { FaTimes, FaSearch, FaList, FaThLarge, FaArrowUp, FaStar } from 'react-icons/fa'
import styled from 'styled-components'

const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'NSFW']
const FORMATS = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']
const SORTS = [
  { label: 'Popular', value: 'POPULARITY_DESC' },
  { label: 'Score', value: 'SCORE_DESC' },
  { label: 'Newest', value: 'START_DATE_DESC' },
  { label: 'A-Z', value: 'TITLE_ROMAJI' },
]
const STATUSES = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED', 'CANCELLED']
const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL']
const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i)
const RESULTS_PER_PAGE = { mobile: 24, desktop: 36 }

const Page = styled.div`
  min-height: 100vh;
  background: var(--bg);
`
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  padding-top: calc(var(--header-h) + 1.5rem);
  @media (max-width: 480px) {
    padding: 1rem 12px;
    padding-top: calc(var(--header-h) + 1rem);
  }
`
const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  @media (max-width: 480px) {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
`
const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-elevated);
  border: 1px solid ${p => p.$focused ? 'var(--accent)' : 'var(--border)'};
  border-radius: var(--radius-full);
  padding: 8px 14px;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
`
const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  &::placeholder { color: var(--text-muted); }
`
const SuggestionDropdown = styled.div`
  position: absolute;
  top: 100%; left: 0; right: 0;
  z-index: 100;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-top: 4px;
  max-height: 420px;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
`
const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
  &:hover { background: rgba(226,232,240,0.04); }
  &:last-child { border-bottom: none; }
`
const SuggestionImg = styled.img`
  width: 36px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  background: #222;
`
const SuggestionInfo = styled.div`
  flex: 1;
  min-width: 0;
`
const SuggestionTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`
const SuggestionMeta = styled.p`
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
`
const SuggestionGenre = styled.span`
  display: inline-block;
  background: rgba(99,102,241,0.12);
  color: #818cf8;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  margin-right: 4px;
  margin-top: 4px;
`
const FiltersRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  margin-bottom: 1rem;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  @media (max-width: 480px) {
    gap: 8px;
    margin-bottom: 0.75rem;
  }
`
const Select = styled.select`
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 8px 32px 8px 14px;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
  appearance: none;
  -webkit-appearance: none;
  flex-shrink: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238c8c8c' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  &:hover { border-color: var(--text-muted); }
  &:focus { border-color: var(--accent); }
  @media (max-width: 480px) {
    padding: 6px 28px 6px 10px;
    font-size: 12px;
  }
`
const GenreChipsRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  -webkit-overflow-scrolling: touch;
  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`
const GenreChip = styled.button`
  flex: 0 0 auto;
  background: ${p => p.$active ? 'var(--accent)' : 'var(--bg-elevated)'};
  color: ${p => p.$active ? '#000' : 'var(--text-secondary)'};
  border: 1px solid ${p => p.$active ? 'var(--accent)' : 'var(--border)'};
  border-radius: var(--radius-full);
  padding: 6px 16px;
  font-size: 13px;
  font-weight: ${p => p.$active ? 600 : 500};
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  min-height: 36px;
  -webkit-tap-highlight-color: transparent;
  &:hover { border-color: var(--accent); }
  &:active { transform: scale(0.96); }
  @media (max-width: 480px) {
    padding: 5px 12px;
    font-size: 12px;
    min-height: 34px;
  }
`
const ClearBtn = styled.button`
  flex: 0 0 auto;
  background: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  padding: 6px 14px;
  white-space: nowrap;
  min-height: 36px;
  transition: border-color 0.15s;
  &:hover { border-color: var(--accent); }
  @media (max-width: 480px) {
    padding: 5px 10px;
    font-size: 12px;
    min-height: 34px;
  }
`
const ResultMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 13px;
  color: var(--text-muted);
  @media (max-width: 480px) {
    font-size: 12px;
    margin-bottom: 0.75rem;
  }
`
const ViewToggle = styled.button`
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover { border-color: var(--accent); color: var(--accent); }
  @media (max-width: 600px) { display: none; }
`
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 1.5rem;
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  @media (min-width: 601px) and (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  @media (min-width: 901px) and (max-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  @media (min-width: 1201px) {
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
  }
  @media (min-width: 1600px) {
    grid-template-columns: repeat(6, 1fr);
    gap: 14px;
  }
`
const ListView = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 1.5rem;
`
const ListItem = styled(Link)`
  display: flex;
  gap: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px;
  text-decoration: none;
  color: var(--text-primary);
  transition: background 0.15s, border-color 0.15s;
  &:hover {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
  }
`
const ListPoster = styled.img`
  width: 60px;
  height: 85px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  background: var(--bg-elevated);
`
const ListInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
`
const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
`
const EmptyTitle = styled.p`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
`
const EmptyDesc = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
`
const EmptyBtn = styled.button`
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: var(--radius-full);
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin: 0 6px;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`
const PaginationWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 1.5rem 0;
  flex-wrap: wrap;
`
const PageBtn = styled.button`
  min-width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid ${p => p.$active ? 'var(--accent)' : 'var(--border)'};
  background: ${p => p.$active ? 'var(--accent)' : 'transparent'};
  color: ${p => p.$active ? '#000' : 'var(--text-secondary)'};
  font-size: 13px;
  font-weight: ${p => p.$active ? 700 : 500};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0 10px;
  &:hover:not(:disabled) {
    border-color: var(--accent);
    color: ${p => p.$active ? '#000' : 'var(--accent)'};
  }
  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  @media (max-width: 480px) {
    min-width: 32px;
    height: 32px;
    font-size: 12px;
    padding: 0 6px;
  }
`
const PageEllipsis = styled.span`
  color: var(--text-muted);
  font-size: 13px;
  padding: 0 4px;
`
const PageInfo = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 0.5rem;
`
const BackToTop = styled.button`
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent);
  color: #000;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  opacity: ${p => p.$visible ? 1 : 0};
  pointer-events: ${p => p.$visible ? 'auto' : 'none'};
  transform: ${p => p.$visible ? 'scale(1)' : 'scale(0.85)'};
  transition: opacity 0.25s, transform 0.25s;
  z-index: 50;
  &:active { transform: ${p => p.$visible ? 'scale(0.92)' : 'scale(0.85)'}; }
  @media (max-width: 480px) {
    bottom: 70px;
    right: 14px;
    width: 40px;
    height: 40px;
  }
`
const TrendingSection = styled.div`
  margin-bottom: 2rem;
`
const TrendingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  @media (max-width: 360px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
`

function useCatalogQuery(filters, page, perPage) {
  return useQuery(['catalog', filters, page, perPage], async () => {
    const params = new URLSearchParams()
    params.set('page', page)
    params.set('perPage', perPage)
    if (filters.genre) params.append('genre', filters.genre)
    if (filters.format) params.append('format', filters.format)
    if (filters.status) params.append('status', filters.status)
    if (filters.season) params.set('season', filters.season)
    if (filters.year) params.set('year', filters.year)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.search) params.set('search', filters.search)
    const { data } = await axios.get(`${API_BASE}/api/v1/browse?${params.toString()}`)
    return data
  }, { keepPreviousData: true })
}

function useTrending() {
  return useQuery(['catalog-trending'], async () => {
    const { data } = await axios.get(`${API_BASE}/api/v1/trending?perPage=12`)
    return Array.isArray(data) ? data : []
  })
}

function useSearchSuggestions(query, currentFilters) {
  return useQuery(['search-suggestions', query, currentFilters.genre, currentFilters.format, currentFilters.status], async () => {
    if (!query || query.length < 2) return []
    const params = new URLSearchParams()
    params.set('q', query)
    if (currentFilters.genre) params.append('genre', currentFilters.genre)
    if (currentFilters.format) params.append('format', currentFilters.format)
    if (currentFilters.status) params.append('status', currentFilters.status)
    const { data } = await axios.get(`${API_BASE}/api/v1/search?${params.toString()}`)
    return data.results || []
  }, { enabled: !!query && query.length >= 2, staleTime: 60000 })
}

function Pagination({ currentPage, lastPage, onPageChange }) {
  if (lastPage <= 1) return null
  const pages = []
  const range = 2
  pages.push(1)
  const start = Math.max(2, currentPage - range)
  const end = Math.min(lastPage - 1, currentPage + range)
  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < lastPage - 1) pages.push('...')
  if (lastPage > 1) pages.push(lastPage)
  return (
    <PaginationWrap>
      <PageBtn disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>‹ Prev</PageBtn>
      {pages.map((p, i) =>
        p === '...' ? <PageEllipsis key={`e${i}`}>…</PageEllipsis> : (
          <PageBtn key={p} $active={p === currentPage} onClick={() => onPageChange(p)}>{p}</PageBtn>
        )
      )}
      <PageBtn disabled={currentPage >= lastPage} onClick={() => onPageChange(currentPage + 1)}>Next ›</PageBtn>
    </PaginationWrap>
  )
}

function formatLabel(v) { return v.replace(/_/g, ' ') }

const Catalog = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [viewMode, setViewMode] = useState('grid')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const perPage = isDesktop ? RESULTS_PER_PAGE.desktop : RESULTS_PER_PAGE.mobile
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSearchFocused(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const filters = useMemo(() => ({
    genre: searchParams.get('genre') || '',
    format: searchParams.get('format') || '',
    status: searchParams.get('status') || '',
    season: searchParams.get('season') || '',
    year: searchParams.get('year') || '',
    sort: searchParams.get('sort') || 'POPULARITY_DESC',
    search: debouncedSearch || '',
  }), [searchParams, debouncedSearch])

  const hasActiveFilters = filters.genre || filters.format || filters.status || filters.season || filters.year || filters.search
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  const { data, isLoading, isFetching } = useCatalogQuery(filters, currentPage, perPage)
  const { data: trending } = useTrending()
  const { data: suggestions } = useSearchSuggestions(
    searchFocused && searchInput.length >= 2 ? searchInput : '',
    filters
  )

  const media = data?.media || []
  const total = data?.pageInfo?.total || 0
  const lastPage = data?.pageInfo?.lastPage || 1
  const showSuggestions = searchFocused && searchInput.length >= 2 && suggestions && suggestions.length > 0

  const updateFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      next.set('page', '1')
      return next
    })
  }, [setSearchParams])

  const handlePageChange = useCallback((newPage) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('page', String(newPage))
      return next
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setSearchParams])

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setSearchParams({})
  }, [setSearchParams])

  const handleSuggestionClick = useCallback((suggestion) => {
    navigate(`/anime/${suggestion.id}`)
  }, [navigate])

  const showTrending = !hasActiveFilters && !isLoading

  const searchPlaceholder = filters.genre
    ? `Search in ${filters.genre}...`
    : filters.format
      ? `Search in ${formatLabel(filters.format)}...`
      : 'Search anime by title...'

  return (
    <Page>
      <NavBar />
      <Container>
        <Title>Browse Anime</Title>
        <main>
        <div style={{ position: 'relative' }} ref={searchRef}>
          <SearchBar $focused={searchFocused}>
            <FaSearch size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <SearchInput
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setSearchFocused(false)
                  updateFilter('search', searchInput)
                }
              }}
              placeholder={searchPlaceholder}
            />
            {searchInput && (
              <button onClick={() => {
                setSearchInput('')
                setSearchParams(prev => {
                  const n = new URLSearchParams(prev)
                  n.delete('search')
                  n.set('page', '1')
                  return n
                })
              }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                <FaTimes size={12} />
              </button>
            )}
          </SearchBar>

          {showSuggestions && (
            <SuggestionDropdown>
              {suggestions.slice(0, 8).map((item) => {
                const id = item.id
                const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown'
                const poster = item.coverImage?.large || ''
                return (
                  <SuggestionItem key={id} onClick={() => handleSuggestionClick(item)}>
                    {poster ? <SuggestionImg src={poster} alt="" /> : <div style={{ width: 36, height: 50, background: '#222', borderRadius: 4, flexShrink: 0 }} />}
                    <SuggestionInfo>
                      <SuggestionTitle>{title}</SuggestionTitle>
                      <SuggestionMeta>
                        {item.format ? formatLabel(item.format) : 'Anime'}
                        {item.averageScore ? ` · ${item.averageScore}%` : ''}
                        {item.episodes ? ` · ${item.episodes} ep` : ''}
                      </SuggestionMeta>
                      {item.genres && item.genres.length > 0 && (
                        <div style={{ marginTop: 2 }}>
                          {item.genres.slice(0, 3).map(g => (
                            <SuggestionGenre key={g}>{g}</SuggestionGenre>
                          ))}
                        </div>
                      )}
                    </SuggestionInfo>
                  </SuggestionItem>
                )
              })}
            </SuggestionDropdown>
          )}
        </div>

        <FiltersRow>
          <Select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Select value={filters.format} onChange={(e) => updateFilter('format', e.target.value)}>
            <option value="">Format</option>
            {FORMATS.map(f => <option key={f} value={f}>{formatLabel(f)}</option>)}
          </Select>
          <Select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </Select>
          <Select value={filters.season} onChange={(e) => updateFilter('season', e.target.value)}>
            <option value="">Season</option>
            {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={filters.year} onChange={(e) => updateFilter('year', e.target.value)}>
            <option value="">Year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <ViewToggle onClick={() => setViewMode(p => p === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <FaList size={12} /> : <FaThLarge size={12} />}
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </ViewToggle>
        </FiltersRow>

        <GenreChipsRow>
          {GENRES.map(g => (
            <GenreChip key={g} $active={filters.genre === g} onClick={() => updateFilter('genre', filters.genre === g ? '' : g)}>
              {g}
            </GenreChip>
          ))}
          {hasActiveFilters && (
            <ClearBtn onClick={clearFilters}>
              <FaTimes /> Clear All
            </ClearBtn>
          )}
        </GenreChipsRow>

        {showTrending && trending && trending.length > 0 && (
          <TrendingSection>
            <h2 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>Trending Now</h2>
            <TrendingGrid>
              {trending.map((item) => {
                const id = item.id
                const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown'
                const poster = item.coverImage?.large || ''
                const score = item.averageScore || item.score
                return (
                  <Link key={id} to={`/anime/${id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '2/3', background: 'var(--bg-card)' }}>
                      {poster ? (
                        <img src={poster} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 11 }}>No Image</div>
                      )}
                      {score && (
                        <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', color: '#e2e8f0', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                          {score}%
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, marginTop: 4, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                  </Link>
                )
              })}
            </TrendingGrid>
          </TrendingSection>
        )}

        {hasActiveFilters && total > 0 && !isLoading && (
          <ResultMeta>
            <ResultCount>{total} result{total !== 1 ? 's' : ''}</ResultCount>
          </ResultMeta>
        )}

        {isLoading && currentPage === 1 ? (
          <Grid>
            {Array.from({ length: perPage > 30 ? 18 : 12 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', aspectRatio: '2/3', animation: 'pulse 1.5s infinite' }} />
            ))}
          </Grid>
        ) : media.length === 0 && hasActiveFilters ? (
          <EmptyState>
            <EmptyTitle>No results found</EmptyTitle>
            <EmptyDesc>
              {filters.search
                ? `No anime matching "${filters.search}" with the selected filters.`
                : 'No anime match the selected filters.'}
            </EmptyDesc>
            <div>
              <EmptyBtn onClick={clearFilters}>Clear All Filters</EmptyBtn>
              <EmptyBtn onClick={() => navigate('/catalog?sort=POPULARITY_DESC')}>Browse Popular</EmptyBtn>
            </div>
            {trending && trending.length > 0 && (
              <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>Try Trending</h3>
                <TrendingGrid>
                  {trending.slice(0, 6).map((item) => {
                    const id = item.id
                    const title = item.title?.english || item.title?.romaji || 'Unknown'
                    const poster = item.coverImage?.large || ''
                    const score = item.averageScore || item.score
                    return (
                      <Link key={id} to={`/anime/${id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '2/3', background: 'var(--bg-card)' }}>
                          {poster ? <img src={poster} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 11 }}>No Image</div>}
                          {score && <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', color: '#e2e8f0', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{score}%</span>}
                        </div>
                        <p style={{ fontSize: 12, marginTop: 4, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                      </Link>
                    )
                  })}
                </TrendingGrid>
              </div>
            )}
          </EmptyState>
        ) : media.length === 0 ? null : viewMode === 'grid' ? (
          <>
            <Grid>
              {media.map((item) => (
                <CardWithOverlay key={item.id} item={item} />
              ))}
            </Grid>
            {total > 0 && <PageInfo>Page {currentPage} of {lastPage}</PageInfo>}
            <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={handlePageChange} />
          </>
        ) : (
          <>
            <ListView>
              {media.map((item) => {
                const id = item.id
                const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || item.title || 'Unknown'
                const poster = item.coverImage?.large || ''
                const score = item.averageScore || item.score
                return (
                  <ListItem key={id} to={`/anime/${id}`}>
                    {poster ? <ListPoster src={poster} alt={title} loading="lazy" /> : <div style={{ width: 60, height: 85, background: '#222', borderRadius: 6, flexShrink: 0 }} />}
                    <ListInfo>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{title}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {[item.format ? formatLabel(item.format) : '', item.status ? formatLabel(item.status) : '', score ? `${score}%` : ''].filter(Boolean).join(' · ')}
                      </p>
                      {item.genres && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {item.genres.slice(0, 3).map(g => (
                            <span key={g} style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>{g}</span>
                          ))}
                        </div>
                      )}
                      {item.description && (
                        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                          {item.description.replace(/<[^>]*>/g, '').slice(0, 200)}
                        </p>
                      )}
                    </ListInfo>
                  </ListItem>
                )
              })}
            </ListView>
            {total > 0 && <PageInfo>Page {currentPage} of {lastPage}</PageInfo>}
            <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={handlePageChange} />
          </>
        )}
        </main>
      </Container>
      <Footer />
      <MobileBottomNav />
      <div className="bottom-nav-spacer" />
      <BackToTop $visible={showBackToTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <FaArrowUp size={16} />
      </BackToTop>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </Page>
  )
}

function CardWithOverlay({ item }) {
  const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown'
  const score = item.averageScore
  const format = item.format
  return (
    <Link to={`/anime/${item.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '2/3', background: 'var(--bg-card)' }}>
        {item.coverImage?.large ? (
          <img src={item.coverImage.large} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 11 }}>No Image</div>
        )}
        {score && (
          <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.8)', color: '#ffc107', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
            {score}%
          </span>
        )}
        {format && (
          <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(99,102,241,0.85)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase' }}>
            {format.replace('_', ' ')}
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, marginTop: 4, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
    </Link>
  )
}

export default Catalog
