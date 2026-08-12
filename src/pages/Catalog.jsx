import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { anilistQuery, BROWSE_QUERY } from '../lib/anilist'
import { filterAdult, useNsfw, useStreamable } from '../hooks/useNsfw'
import Footer from '../components/Footer/Footer'
import { setCatalogSEO } from '../lib/seo'
import { generateSlug } from '../lib/slug'
import { FaChevronDown, FaTimes, FaSearch, FaFilter, FaSortAmountDown, FaLayerGroup, FaCheckCircle, FaCalendarDay } from 'react-icons/fa'
import { AnimeCardSkeleton } from '../components/Skeletons/Skeletons'

const PER_PAGE = 24
const SEARCH_DEBOUNCE_MS = 500
const CURRENT_YEAR = new Date().getFullYear()

const fmt = v => v.replace(/_/g, ' ')

const SORT_OPTIONS = [
  { value: 'POPULARITY_DESC', label: 'Popularity', icon: FaSortAmountDown },
  { value: 'SCORE_DESC', label: 'Top Rated', icon: FaCheckCircle },
  { value: 'START_DATE_DESC', label: 'Newest', icon: FaCalendarDay },
  { value: 'TITLE_ROMAJI', label: 'A–Z', icon: FaLayerGroup },
]

const FORMAT_OPTIONS = [
  { value: '', label: 'All Formats' },
  { value: 'TV', label: 'TV Series' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'SPECIAL', label: 'Specials' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'RELEASING', label: 'Releasing' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
]

const GENRE_OPTIONS = [
  { value: '', label: 'All Genres' },
  ...[
    'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
    'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
    'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  ].map(g => ({ value: g, label: g })),
]

const YEAR_OPTIONS = [
  { value: '', label: 'All Years' },
  ...Array.from({ length: 20 }, (_, i) => {
    const y = CURRENT_YEAR - i
    return { value: String(y), label: String(y) }
  }),
]

function useBrowse(f, p) {
  return useQuery(['cat', f, p], async () => {
    const variables = { page: p, perPage: PER_PAGE, sort: [f.sort || 'POPULARITY_DESC'] }
    if (f.search) variables.search = f.search
    if (f.genre) variables.genre = f.genre
    if (f.format) variables.format = f.format
    if (f.status) variables.status = f.status
    if (f.year) variables.year = parseInt(f.year, 10)
    const { data } = await anilistQuery(BROWSE_QUERY, variables)
    return { media: data.Page.media, pageInfo: data.Page.pageInfo }
  }, { keepPreviousData: true, staleTime: 300000 })
}

const Card = memo(function Card({ a }) {
  const title = a.title?.english || a.title?.romaji || a.title?.userPreferred || 'Unknown'
  const img = a.coverImage?.extraLarge || a.coverImage?.large || a.coverImage?.medium
  const highScore = typeof a.averageScore === 'number' && a.averageScore >= 75

  return (
    <Link to={`/anime/${generateSlug(title)}-${a.id}`} className="catalog-card">
      <div className="card-media">
        {img ? (
          <img src={img} alt={title} loading="lazy" />
        ) : (
          <div className="card-noimg">No image</div>
        )}
        <div className="card-scrim" />
        <div className="card-badges">
          {typeof a.averageScore === 'number' && (
            <span className={`card-badge card-badge-score${highScore ? ' is-high' : ''}`}>
              {a.averageScore}%
            </span>
          )}
          {a.format && <span className="card-badge card-badge-format">{fmt(a.format)}</span>}
        </div>
      </div>
      <div className="card-info">
        <h3 className="card-title">{title}</h3>
        <div className="card-meta">
          {a.episodes && <span>{a.episodes} Episodes</span>}
          {a.seasonYear && <span>{a.seasonYear}</span>}
        </div>
      </div>
    </Link>
  )
})

function FilterSelect({ options, value, onChange, ariaLabel, icon: Icon }) {
  return (
    <div className="filter-select-wrapper">
      {Icon && <Icon className="filter-icon" size={12} />}
      <select
        className="filter-select"
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={ariaLabel}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <FaChevronDown className="filter-chevron" size={10} />
    </div>
  )
}

export default function Catalog() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(sp.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(sp.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)
  const searchRef = useRef(null)
  const didMount = useRef(false)

  const f = useMemo(() => ({
    genre: sp.get('genre') || '',
    format: sp.get('format') || '',
    status: sp.get('status') || '',
    year: sp.get('year') || '',
    sort: sp.get('sort') || 'POPULARITY_DESC',
    search: debouncedSearch,
  }), [sp, debouncedSearch])

  const pg = parseInt(sp.get('page') || '1', 10)
  const { data, isLoading, isFetching } = useBrowse(f, pg)
  const { nsfwEnabled } = useNsfw()
  const media = useStreamable(filterAdult(data?.media || [], nsfwEnabled))
  const total = data?.pageInfo?.total || 0
  const last = data?.pageInfo?.lastPage || 1

  useEffect(() => {
    setCatalogSEO(sp)
  }, [sp])

  const mkUrl = useCallback((overrides) => {
    const n = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(overrides)) {
      v ? n.set(k, v) : n.delete(k)
    }
    return `/catalog?${n.toString()}`
  }, [sp])

  const set = useCallback((k, v) => {
    navigate(mkUrl({ [k]: v, page: '1' }))
  }, [navigate, mkUrl])

  const go = useCallback(p => {
    navigate(mkUrl({ page: String(p) }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [navigate, mkUrl])

  const clr = useCallback(() => {
    setSearchInput('')
    setDebouncedSearch('')
    navigate('/catalog')
  }, [navigate])

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return }
    const t = setTimeout(() => {
      const val = searchInput.trim()
      setDebouncedSearch(val)
      const n = new URLSearchParams(sp)
      val ? n.set('search', val) : n.delete('search')
      n.set('page', '1')
      navigate(`/catalog?${n.toString()}`, { replace: true })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput, sp, navigate])

  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (sp.get('search') === '') searchRef.current?.focus()
  }, [sp])

  const hasActiveFilters = !!(f.search || f.format || f.status || f.genre || f.year)

  return (
    <div className="catalog-page">
      <div className="catalog-hero">
        <div className="catalog-hero-bg" />
        <div className="catalog-container">
          <header className="catalog-header">
            <div>
              <h1 className="catalog-title">Explore Catalog</h1>
              <p className="catalog-subtitle">Discover thousands of anime titles, movies, and specials.</p>
            </div>
            {total > 0 && <div className="catalog-count-pill">{total.toLocaleString()} Titles</div>}
          </header>

          <div className="search-section">
            <div className="search-bar-modern">
              <FaSearch className="search-icon" size={18} />
              <input
                ref={searchRef}
                className="search-input"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search anime titles, genres, years..."
                aria-label="Search anime"
              />
              {searchInput ? (
                <button className="search-clear" onClick={() => setSearchInput('')} aria-label="Clear search">
                  <FaTimes size={14} />
                </button>
              ) : (
                <div className="search-kbd">⌘K</div>
              )}
            </div>
            
            <button 
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter size={14} />
              <span>Filters</span>
            </button>
          </div>

          <div className={`filter-grid ${showFilters ? 'show' : ''}`}>
            <FilterSelect ariaLabel="Sort by" options={SORT_OPTIONS} value={f.sort} onChange={v => set('sort', v)} icon={FaSortAmountDown} />
            <FilterSelect ariaLabel="Filter by genre" options={GENRE_OPTIONS} value={f.genre} onChange={v => set('genre', v)} />
            <FilterSelect ariaLabel="Filter by format" options={FORMAT_OPTIONS} value={f.format} onChange={v => set('format', v)} />
            <FilterSelect ariaLabel="Filter by status" options={STATUS_OPTIONS} value={f.status} onChange={v => set('status', v)} />
            <FilterSelect ariaLabel="Filter by year" options={YEAR_OPTIONS} value={f.year} onChange={v => set('year', v)} />
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clr}>
                <FaTimes size={10} /> Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="catalog-container content-section">
        {isLoading && pg === 1 ? (
          <div className="anime-grid">
            {Array.from({ length: 12 }).map((_, i) => <AnimeCardSkeleton key={i} />)}
          </div>
        ) : media.length > 0 ? (
          <>
            <div className={`anime-grid ${isFetching ? 'is-fetching' : ''}`}>
              {media.map(a => <Card key={a.id} a={a} />)}
            </div>

            {last > 1 && (
              <nav className="pagination-modern" aria-label="Pagination">
                <button 
                  className="page-nav-btn" 
                  disabled={pg <= 1} 
                  onClick={() => go(pg - 1)}
                >
                  Previous
                </button>
                <div className="page-indicator">
                  <span>Page</span>
                  <span className="current">{pg}</span>
                  <span>of</span>
                  <span>{last.toLocaleString()}</span>
                </div>
                <button 
                  className="page-nav-btn" 
                  disabled={pg >= last} 
                  onClick={() => go(pg + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="empty-catalog">
            <div className="empty-icon"><FaSearch size={48} /></div>
            <h2>No results found</h2>
            <p>We couldn't find any anime matching your current filters.</p>
            <button className="reset-btn" onClick={clr}>Reset all filters</button>
          </div>
        )}
      </div>

      <Footer />
      <div className="bottom-nav-spacer" />

      <style>{`
        .catalog-page { min-height: 100vh; background: var(--bg); }
        .catalog-container { max-width: 1400px; margin: 0 auto; padding: 0 20px; }
        
        .catalog-hero {
          position: relative;
          padding: 40px 0 30px;
          background: linear-gradient(to bottom, rgba(20,20,20,0.8), var(--bg));
          border-bottom: 1px solid var(--border);
          overflow: hidden;
        }
        
        .catalog-hero-bg {
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: var(--accent);
          filter: blur(150px);
          opacity: 0.05;
          pointer-events: none;
        }

        .catalog-header { 
          display: flex; 
          align-items: flex-start; 
          justify-content: space-between; 
          gap: 20px; 
          margin-bottom: 30px; 
        }
        
        .catalog-title { 
          font-size: 32px; 
          font-weight: 800; 
          color: var(--text-primary); 
          margin: 0 0 8px; 
          letter-spacing: -0.02em; 
        }
        
        .catalog-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          margin: 0;
        }

        .catalog-count-pill {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .search-section {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .search-bar-modern { 
          flex: 1;
          display: flex; 
          align-items: center; 
          gap: 12px; 
          height: 52px; 
          padding: 0 18px; 
          border-radius: 14px; 
          border: 1px solid var(--border); 
          background: var(--bg-elevated); 
          transition: all 0.2s ease; 
        }
        
        .search-bar-modern:focus-within { 
          border-color: var(--accent); 
          box-shadow: 0 0 0 3px rgba(226, 232, 240, 0.1);
          background: var(--bg-card);
        }
        
        .search-icon { color: var(--text-muted); flex-shrink: 0; }
        
        .search-input { 
          flex: 1; 
          min-width: 0; 
          height: 100%; 
          border: none; 
          background: none; 
          outline: none; 
          color: var(--text-primary); 
          font-size: 16px; 
          font-weight: 500;
        }
        
        .search-input::placeholder { color: var(--text-muted); font-weight: 400; }
        
        .search-clear { 
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
        }
        
        .search-clear:hover { color: var(--text-primary); background: rgba(255,255,255,0.1); }
        
        .search-kbd { 
          font-size: 11px; 
          color: var(--text-muted); 
          background: var(--bg-card); 
          padding: 3px 8px; 
          border-radius: 6px; 
          border: 1px solid var(--border); 
          font-weight: 600;
        }

        .filter-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px;
          height: 52px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 14px;
          color: var(--text-primary);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-toggle-btn:hover { border-color: var(--text-muted); }
        .filter-toggle-btn.active { background: var(--text-primary); color: var(--bg); border-color: var(--text-primary); }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          max-height: 0;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
        }

        .filter-grid.show {
          max-height: 300px;
          opacity: 1;
          margin-top: 20px;
          padding-bottom: 10px;
        }

        .filter-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .filter-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .filter-select {
          appearance: none;
          width: 100%;
          height: 44px;
          padding: 0 32px 0 32px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-select:hover { border-color: var(--text-muted); }
        .filter-select:focus { outline: none; border-color: var(--accent); color: var(--text-primary); }

        .filter-chevron {
          position: absolute;
          right: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .clear-filters-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: none;
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--danger);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 0 16px;
          height: 44px;
          transition: all 0.2s;
        }
        .clear-filters-btn:hover { background: rgba(229, 9, 20, 0.1); border-color: var(--danger); }

        .content-section { padding-top: 40px; padding-bottom: 80px; }

        .anime-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
          gap: 20px; 
          transition: opacity 0.3s ease; 
        }
        
        .anime-grid.is-fetching { opacity: 0.6; pointer-events: none; }

        .catalog-card { 
          display: flex;
          flex-direction: column;
          text-decoration: none; 
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .card-media { 
          position: relative; 
          aspect-ratio: 2/3; 
          background: var(--bg-card); 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
        
        .card-scrim { 
          position: absolute; 
          inset: 0; 
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%); 
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .card-badges {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: space-between;
          pointer-events: none;
        }

        .card-badge {
          padding: 4px 8px;
          border-radius: 8px;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .card-badge-score.is-high { color: #22c55e; }

        .card-info { padding: 12px 4px 0; }
        
        .card-title { 
          font-size: 14px; 
          font-weight: 700; 
          color: var(--text-primary); 
          margin: 0 0 4px; 
          overflow: hidden; 
          text-overflow: ellipsis; 
          white-space: nowrap; 
        }
        
        .card-meta { 
          display: flex;
          gap: 8px;
          font-size: 12px; 
          color: var(--text-secondary); 
          font-weight: 500;
        }

        .catalog-card:hover { transform: translateY(-8px); }
        .catalog-card:hover .card-media img { transform: scale(1.1); }
        .catalog-card:hover .card-scrim { opacity: 1; }

        .pagination-modern {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-top: 60px;
        }

        .page-nav-btn {
          padding: 10px 24px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text-primary);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-nav-btn:hover:not(:disabled) { border-color: var(--text-muted); background: var(--bg-card); }
        .page-nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .page-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .page-indicator .current {
          color: var(--text-primary);
          font-weight: 800;
        }

        .empty-catalog {
          text-align: center;
          padding: 80px 20px;
          color: var(--text-secondary);
        }

        .empty-icon { color: var(--border); margin-bottom: 20px; }
        .empty-catalog h2 { color: var(--text-primary); margin-bottom: 10px; }
        .reset-btn {
          margin-top: 20px;
          padding: 12px 24px;
          background: var(--accent);
          color: #000;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .catalog-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .catalog-title { font-size: 26px; }
          .search-section { flex-direction: column; }
          .filter-toggle-btn { width: 100%; justify-content: center; }
          .anime-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }
          .catalog-hero { padding: 30px 0 20px; }
        }
      `}</style>
    </div>
  )
}
