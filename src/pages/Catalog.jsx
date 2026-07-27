import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../config'
import Card from '../components/Card/Card'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import { FaTimes, FaSearch, FaList, FaThLarge, FaBookmark, FaHistory } from 'react-icons/fa'
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
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 8px 14px;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
  &:focus-within { border-color: var(--accent); }
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
const Filters = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  @media (max-width: 480px) {
    gap: 8px;
    margin-bottom: 1.5rem;
  }
`
const Select = styled.select`
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
  appearance: none;
  -webkit-appearance: none;
  padding-right: 32px;
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
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  @media (max-width: 360px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
`
const ListView = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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
const LoadMore = styled.button`
  display: block;
  margin: 2rem auto;
  padding: 12px 32px;
  background: var(--accent);
  color: var(--bg);
  border: none;
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`
const Empty = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-muted);
  font-size: 15px;
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
`
const Chip = styled.button`
  background: ${p => p.$active ? 'var(--accent)' : 'var(--bg-elevated)'};
  color: ${p => p.$active ? 'var(--bg)' : 'var(--text-secondary)'};
  border: 1px solid ${p => p.$active ? 'var(--accent)' : 'var(--border)'};
  border-radius: var(--radius-full);
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  &:hover { border-color: var(--accent); }
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

function useCatalogQuery(filters, page) {
  return useQuery(['catalog', filters, page], async () => {
    const params = new URLSearchParams()
    params.set('page', page)
    params.set('perPage', 24)
    if (filters.genre) params.append('genre', filters.genre)
    if (filters.format) params.append('format', filters.format)
    if (filters.status) params.append('status', filters.status)
    if (filters.season) params.set('season', filters.season)
    if (filters.year) params.set('year', filters.year)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.search) params.set('search', filters.search)
    const { data } = await axios.get(`${API_BASE}/api/v1/browse?${params.toString()}`)
    return data
  })
}

function useTrending() {
  return useQuery(['catalog-trending'], async () => {
    const { data } = await axios.get(`${API_BASE}/api/v1/trending?perPage=12`)
    return Array.isArray(data) ? data : []
  })
}

function useSearchSuggestions(query) {
  return useQuery(['search-suggestions', query], async () => {
    if (!query || query.length < 2) return []
    const { data } = await axios.get(`${API_BASE}/api/v1/search?q=${encodeURIComponent(query)}`)
    return data.results || []
  }, { enabled: !!query && query.length >= 2 })
}

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [viewMode, setViewMode] = useState('grid')
  const [showHistory, setShowHistory] = useState(false)
  const [watchHistory, setWatchHistory] = useState([])
  const searchRef = useRef(null)
  const sentinelRef = useRef(null)

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('aurelia-watch-history') || '[]')
      setWatchHistory(raw)
    } catch {}
  }, [])

  const filters = useMemo(() => ({
    genre: searchParams.get('genre') || '',
    format: searchParams.get('format') || '',
    status: searchParams.get('status') || '',
    season: searchParams.get('season') || '',
    year: searchParams.get('year') || '',
    sort: searchParams.get('sort') || 'POPULARITY_DESC',
    search: searchParams.get('search') || '',
  }), [searchParams])

  const hasActiveFilters = filters.genre || filters.format || filters.status || filters.season || filters.year || filters.search

  const { data, isLoading, isFetching } = useCatalogQuery(filters, page)
  const { data: trending } = useTrending()
  const { data: suggestions } = useSearchSuggestions(
    hasActiveFilters ? '' : (searchInput && searchInput.length >= 2 ? searchInput : '')
  )

  const media = data?.media || []
  const hasNext = data?.pageInfo?.hasNextPage

  const historyIds = useMemo(() => new Set(watchHistory.map(h => String(h.animeId))), [watchHistory])

  const filteredMedia = useMemo(() => {
    if (!showHistory) return media
    return media.filter(m => historyIds.has(String(m.id)))
  }, [media, showHistory, historyIds])

  const updateFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
    setPage(1)
  }, [setSearchParams])

  const handleSearch = useCallback((e) => {
    e.preventDefault()
    updateFilter('search', searchInput.trim())
  }, [searchInput, updateFilter])

  const clearFilters = useCallback(() => {
    setSearchParams({})
    setSearchInput('')
    setPage(1)
  }, [setSearchParams])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNext) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetching) {
          setPage(p => p + 1)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNext])

  const handleSuggestionClick = useCallback((suggestion) => {
    setSearchInput(suggestion.title?.english || suggestion.title?.romaji || '')
    updateFilter('search', suggestion.title?.english || suggestion.title?.romaji || '')
  }, [updateFilter])

  const showTrending = !hasActiveFilters && !searchInput

  return (
    <Page>
      <NavBar />
      <Container>
        <Title>Browse Anime</Title>
        <main>

        <form onSubmit={handleSearch} ref={searchRef} style={{ position: 'relative' }}>
          <SearchBar>
            <FaSearch size={14} style={{ color: 'var(--text-muted)' }} />
            <SearchInput
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search anime..."
            />
          </SearchBar>

          {/* Search suggestions dropdown */}
          {searchInput.length >= 2 && suggestions && suggestions.length > 0 && !hasActiveFilters && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', marginTop: 4, maxHeight: 360, overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
            }}>
              {suggestions.slice(0, 8).map((item) => {
                const id = item.id
                const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown'
                const poster = item.coverImage?.large || item.images?.jpg?.image_url || ''
                return (
                  <div
                    key={id}
                    onClick={() => handleSuggestionClick(item)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(226,232,240,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {poster ? (
                      <img src={poster} alt="" style={{ width: 32, height: 45, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 45, background: '#222', borderRadius: 4, flexShrink: 0 }} />
 )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {item.format || item.type || 'Anime'} {item.averageScore ? `· ${item.averageScore}%` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </form>

        <Filters>
          <Select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Select value={filters.genre} onChange={(e) => updateFilter('genre', e.target.value)}>
            <option value="">Genre</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </Select>
          <Select value={filters.format} onChange={(e) => updateFilter('format', e.target.value)}>
            <option value="">Format</option>
            {FORMATS.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
          </Select>
          <Select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </Select>
          <Select value={filters.season} onChange={(e) => updateFilter('season', e.target.value)}>
            <option value="">Season</option>
            {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={filters.year} onChange={(e) => updateFilter('year', e.target.value)}>
            <option value="">Year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>

          {/* History filter chip */}
          <Chip $active={showHistory} onClick={() => setShowHistory(p => !p)} title="Show only watched anime">
            <FaHistory size={11} style={{ marginRight: 4 }} />
            Watched
          </Chip>

          {/* View toggle */}
          <ViewToggle onClick={() => setViewMode(p => p === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <FaList size={12} /> : <FaThLarge size={12} />}
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </ViewToggle>

          {hasActiveFilters && (
            <button onClick={clearFilters} style={{ background: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, border: 'none', flexShrink: 0 }}>
              <FaTimes /> Clear
            </button>
          )}
        </Filters>

        {/* Trending section when no search */}
        {showTrending && trending && trending.length > 0 && !isLoading && (
          <TrendingSection>
            <h2 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>Trending Now</h2>
            <TrendingGrid>
              {trending.slice(0, 6).map((item, idx) => {
                const id = item.id
                const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown'
                const poster = item.coverImage?.large || item.images?.jpg?.image_url || ''
                const score = item.averageScore || item.score
                return (
                  <Link key={id || idx} to={`/anime/${id}`} style={{ textDecoration: 'none' }}>
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

        {isLoading && page === 1 ? (
          <Grid>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', aspectRatio: '2/3', animation: 'pulse 1.5s infinite' }} />
            ))}
          </Grid>
        ) : filteredMedia.length === 0 ? (
          <Empty>
            {showHistory ? 'No watched anime match your filters.' : 'No anime found matching your filters.'}
          </Empty>
        ) : viewMode === 'grid' ? (
          <>
            <Grid>
              {filteredMedia.map((item, idx) => (
                <CardWithTooltip key={item.id || idx} item={item}>
                  <Card data={item} />
                </CardWithTooltip>
              ))}
            </Grid>
            {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
            {isFetching && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            )}
            {!hasNext && filteredMedia.length > 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '1rem' }}>All results loaded</p>
            )}
            {/* Fallback load more button */}
            {hasNext && !isFetching && (
              <LoadMore onClick={() => setPage(p => p + 1)}>
                Load More
              </LoadMore>
            )}
          </>
        ) : (
          <>
            <ListView>
              {filteredMedia.map((item, idx) => {
                const id = item.id || item.mal_id
                const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || item.title || 'Unknown'
                const poster = item.coverImage?.large || item.images?.jpg?.image_url || ''
                const score = item.averageScore || item.score
                return (
                  <ListItem key={id || idx} to={`/anime/${id}`}>
                    {poster ? (
                      <ListPoster src={poster} alt={title} loading="lazy" />
                    ) : (
                      <div style={{ width: 60, height: 85, background: '#222', borderRadius: 6, flexShrink: 0 }} />
                    )}
                    <ListInfo>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{title}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {[item.format, item.status, score ? `${score}%` : ''].filter(Boolean).join(' · ')}
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
            <div ref={sentinelRef} style={{ height: 1 }} />
            {isFetching && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            )}
            {!hasNext && filteredMedia.length > 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '1rem' }}>All results loaded</p>
            )}
            {hasNext && !isFetching && (
              <LoadMore onClick={() => setPage(p => p + 1)}>
                Load More
              </LoadMore>
            )}
          </>
        )}
      </main>
      </Container>
      <Footer />
      <MobileBottomNav />
      <div className="bottom-nav-spacer" />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </Page>
  )
}

function CardWithTooltip({ item, children }) {
  const [show, setShow] = useState(false)
  const ref = useRef(null)

  const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown'
  const synopsis = item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 250) : ''

  return (
    <div ref={ref} style={{ position: 'relative' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && synopsis && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
          padding: '10px 14px', width: 260, zIndex: 50, marginBottom: 8,
          pointerEvents: 'none', boxShadow: 'var(--shadow-lg)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{title}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{synopsis}...</p>
          {item.averageScore && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              Score: {item.averageScore}% · {item.format || item.type || ''} · {item.episodes ? `Ep ${item.episodes}` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default Catalog
