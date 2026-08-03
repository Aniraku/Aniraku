import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { anilistQuery, BROWSE_QUERY } from '../lib/anilist'
import { filterAdult, useNsfw } from '../hooks/useNsfw'
import Footer from '../components/Footer/Footer'
import { setCatalogSEO } from '../lib/seo'
import { generateSlug } from '../lib/slug'

const PER_PAGE = 24
const SEARCH_DEBOUNCE_MS = 400
const CURRENT_YEAR = new Date().getFullYear()

const fmt = v => v.replace(/_/g, ' ')

const SORT_OPTIONS = [
  { value: 'POPULARITY_DESC', label: 'Most popular' },
  { value: 'SCORE_DESC', label: 'Top rated' },
  { value: 'START_DATE_DESC', label: 'Newest' },
  { value: 'TITLE_ROMAJI', label: 'A–Z' },
]

const FORMAT_OPTIONS = [
  { value: '', label: 'Any format' },
  { value: 'TV', label: 'TV' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'SPECIAL', label: 'Special' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'RELEASING', label: 'Releasing' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
]

const GENRE_OPTIONS = [
  { value: '', label: 'Any genre' },
  ...[
    'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
    'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
    'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  ].map(g => ({ value: g, label: g })),
]

const YEAR_OPTIONS = [
  { value: '', label: 'Any year' },
  ...Array.from({ length: 15 }, (_, i) => {
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
  }, { keepPreviousData: true, staleTime: 30000 })
}

function Card({ a }) {
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
        {typeof a.averageScore === 'number' && (
          <span className={`card-chip card-chip-score${highScore ? ' is-high' : ''}`}>{a.averageScore}%</span>
        )}
        {a.format && <span className="card-chip card-chip-format">{fmt(a.format)}</span>}
      </div>
      <div className="card-info">
        <p className="card-title">{title}</p>
        {a.episodes && <p className="card-meta">{a.episodes} ep</p>}
      </div>
    </Link>
  )
}

function FilterSelect({ options, value, onChange, ariaLabel }) {
  return (
    <select
      className="filter-select"
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={ariaLabel}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export default function Catalog() {
  const [sp, ss] = useSearchParams()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(sp.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(sp.get('search') || '')
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
  const media = filterAdult(data?.media || [], nsfwEnabled)
  const total = data?.pageInfo?.total || 0
  const last = data?.pageInfo?.lastPage || 1

  // Dynamic SEO metadata for catalog/search pages
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // Cmd/Ctrl+K focuses the search field
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Focus search when arriving via the nav Search button (/catalog?search=)
  useEffect(() => {
    if (sp.get('search') === '') searchRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasActiveFilters = !!(f.search || f.format || f.status || f.genre || f.year)


  return (
    <div className="catalog-page">

      <div className="catalog-container">
        <header className="catalog-header">
          <h1 className="catalog-title">Browse</h1>
          {total > 0 && <span className="catalog-count">{total.toLocaleString()} title{total !== 1 ? 's' : ''}</span>}
        </header>

        <div className="search-bar">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            className="search-input"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search anime..."
            aria-label="Search anime"
          />
          {searchInput ? (
            <button className="search-clear" onClick={() => setSearchInput('')} aria-label="Clear search">×</button>
          ) : (
            <kbd className="search-kbd">⌘K</kbd>
          )}
        </div>

        <div className="filter-bar">
          <FilterSelect ariaLabel="Sort by" options={SORT_OPTIONS} value={f.sort} onChange={v => set('sort', v)} />
          <FilterSelect ariaLabel="Filter by format" options={FORMAT_OPTIONS} value={f.format} onChange={v => set('format', v)} />
          <FilterSelect ariaLabel="Filter by status" options={STATUS_OPTIONS} value={f.status} onChange={v => set('status', v)} />
          <FilterSelect ariaLabel="Filter by genre" options={GENRE_OPTIONS} value={f.genre} onChange={v => set('genre', v)} />
          <FilterSelect ariaLabel="Filter by year" options={YEAR_OPTIONS} value={f.year} onChange={v => set('year', v)} />
          {hasActiveFilters && <button className="clear-filters" onClick={clr}>Clear all</button>}
        </div>

        {isLoading && pg === 1 ? (
          <div className="grid">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : media.length > 0 ? (
          <>
            <div className={`grid${isFetching ? ' is-fetching' : ''}`}>
              {media.map(a => <Card key={a.id} a={a} />)}
            </div>

            {last > 1 && (
              <nav className="pagination" aria-label="Pagination">
                <button className="page-btn" disabled={pg <= 1} onClick={() => go(pg - 1)} aria-label="Previous page">‹ Prev</button>
                <span className="page-label">Page {pg} of {last.toLocaleString()}</span>
                <button className="page-btn" disabled={pg >= last} onClick={() => go(pg + 1)} aria-label="Next page">Next ›</button>
              </nav>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p className="empty-title">Nothing matches those filters</p>
            <p className="empty-body">Try a different search term or clear your filters.</p>
            <button className="empty-clear" onClick={clr}>Clear all</button>
          </div>
        )}
      </div>

      <Footer />
      <div className="bottom-nav-spacer" />

      <style>{`
        .catalog-page { min-height: 100vh; background: var(--bg); }

        .catalog-container { max-width: 1320px; margin: 0 auto; padding: 16px 16px 88px; }

        .catalog-header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .catalog-title { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.01em; }
        .catalog-count { font-size: 13px; color: var(--text-muted); white-space: nowrap; }

        .search-bar { display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-elevated); margin-bottom: 12px; transition: border-color .15s; }
        .search-bar:focus-within { border-color: var(--accent); }
        .search-icon { color: var(--text-muted); flex-shrink: 0; }
        .search-input { flex: 1; min-width: 0; height: 100%; border: none; background: none; outline: none; color: var(--text-primary); font-size: 16px; }
        .search-input::placeholder { color: var(--text-muted); }
        .search-clear { flex-shrink: 0; width: 24px; height: 24px; border: none; background: var(--bg-card); color: var(--text-muted); border-radius: 50%; font-size: 15px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent; }
        .search-kbd { flex-shrink: 0; font-size: 11px; color: var(--text-muted); background: var(--bg-card); padding: 3px 7px; border-radius: 5px; border: 1px solid var(--border); }

        .filter-bar { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px; }
        .filter-select {
          appearance: none; -webkit-appearance: none;
          width: 100%; height: 40px; padding: 0 30px 0 12px;
          border-radius: 10px; border: 1px solid var(--border);
          background: var(--bg-elevated) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 12px center;
          color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .filter-select:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
        .clear-filters { grid-column: 1 / -1; justify-self: start; background: none; border: none; color: var(--accent); font-size: 13px; font-weight: 600; cursor: pointer; padding: 4px 0; }

        @media (min-width: 640px) {
          .catalog-container { padding: 24px 24px 96px; }
          .filter-bar { grid-template-columns: repeat(5, minmax(0,1fr)) auto; align-items: center; }
          .clear-filters { grid-column: auto; }
        }
        @media (min-width: 1024px) {
          .catalog-container { padding: 32px 32px 100px; }
          .catalog-title { font-size: 24px; }
        }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); gap: 10px; transition: opacity .15s; }
        .grid.is-fetching { opacity: .6; }
        @media (min-width: 640px) { .grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; } }
        @media (min-width: 1024px) { .grid { grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 18px; } }

        .catalog-card { display: block; text-decoration: none; -webkit-tap-highlight-color: transparent; }
        .card-media { position: relative; aspect-ratio: 2/3; background: var(--bg-card); border-radius: 10px; overflow: hidden; transition: transform .2s, box-shadow .2s; }
        .card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .card-noimg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 11px; }
        .card-scrim { position: absolute; inset: auto 0 0 0; height: 45%; background: linear-gradient(transparent, rgba(0,0,0,.75)); pointer-events: none; }
        .card-chip { position: absolute; top: 6px; font-size: 10px; font-weight: 700; letter-spacing: .02em; padding: 3px 7px; border-radius: 6px; background: rgba(0,0,0,.6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); color: #fff; }
        .card-chip-score { right: 6px; }
        .card-chip-score.is-high { color: var(--accent); }
        .card-chip-format { left: 6px; }

        @media (hover: hover) and (pointer: fine) {
          .catalog-card:hover .card-media { transform: translateY(-4px); box-shadow: 0 10px 26px rgba(0,0,0,.45); }
        }
        .catalog-card:active .card-media { transform: scale(.98); }

        .card-info { padding: 8px 2px 4px; }
        .card-title { font-size: 12px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0; }
        .card-meta { font-size: 10px; color: var(--text-muted); margin: 2px 0 0; }

        .skeleton-card { border-radius: 10px; background: var(--bg-card); aspect-ratio: 2/3; animation: shimmer 1.5s ease-in-out infinite; }
        @keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

        .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 28px 0 8px; }
        .page-btn { height: 38px; padding: 0 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .page-btn:disabled { color: var(--text-muted); opacity: .5; cursor: default; }
        .page-label { font-size: 13px; color: var(--text-muted); white-space: nowrap; }

        .empty-state { text-align: center; padding: 4rem 1rem; }
        .empty-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
        .empty-body { font-size: 13px; color: var(--text-muted); margin: 0 0 16px; }
        .empty-clear { background: var(--accent); color: #000; border: none; border-radius: 999px; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; }

        @media (prefers-reduced-motion: reduce) {
          .card-media, .catalog-card, .grid, .search-bar { transition: none !important; }
        }
      `}</style>
    </div>
  )
}
