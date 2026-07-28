import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../config'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'
import MobileBottomNav from '../components/MobileBottomNav'

const PER_PAGE = 20
const fmt = v => v.replace(/_/g, ' ')

const SORTS = [
  { label: 'Popular', value: 'POPULARITY_DESC' },
  { label: 'Top Rated', value: 'SCORE_DESC' },
  { label: 'Newest', value: 'START_DATE_DESC' },
  { label: 'A-Z', value: 'TITLE_ROMAJI' },
]
const FORMATS = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL']
const STATUSES = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED']

function useBrowse(f, p) {
  return useQuery(['cat', f, p], async () => {
    const q = new URLSearchParams()
    q.set('page', p); q.set('perPage', PER_PAGE)
    if (f.genre) q.append('genre', f.genre)
    if (f.format) q.append('format', f.format)
    if (f.status) q.append('status', f.status)
    if (f.year) q.set('year', f.year)
    if (f.sort) q.set('sort', f.sort)
    if (f.search) q.set('search', f.search)
    const { data } = await axios.get(`${API_BASE}/api/v1/browse?${q}`)
    return data
  }, { keepPreviousData: true, staleTime: 30000 })
}

function useRow(sort, perPage = 14) {
  return useQuery(['row', sort], async () => {
    const { data } = await axios.get(`${API_BASE}/api/v1/browse?sort=${sort}&perPage=${perPage}`)
    return data?.media || []
  }, { staleTime: 300000 })
}

function Row({ title, sort }) {
  const { data: items = [], isLoading } = useRow(sort)
  const ref = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const checkScroll = () => {
    if (!ref.current) return
    const { scrollLeft, scrollWidth, clientWidth } = ref.current
    setCanLeft(scrollLeft > 10)
    setCanRight(scrollLeft + clientWidth < scrollWidth - 10)
  }

  useEffect(() => { checkScroll() }, [items])

  const scroll = dir => {
    if (!ref.current) return
    const w = ref.current.clientWidth * 0.75
    ref.current.scrollBy({ left: dir * w, behavior: 'smooth' })
    setTimeout(checkScroll, 350)
  }

  if (isLoading) return null
  if (!items.length) return null

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => scroll(-1)} disabled={!canLeft} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: canLeft ? 'var(--text-primary)' : 'var(--text-muted)', cursor: canLeft ? 'pointer' : 'default', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <button onClick={() => scroll(1)} disabled={!canRight} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: canRight ? 'var(--text-primary)' : 'var(--text-muted)', cursor: canRight ? 'pointer' : 'default', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>
      </div>
      <div ref={ref} onScroll={checkScroll} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {items.map(a => <RowCard key={a.id} a={a} />)}
      </div>
    </div>
  )
}

function RowCard({ a }) {
  const t = a.title?.english || a.title?.romaji || a.title?.userPreferred || 'Unknown'
  const img = a.coverImage?.extraLarge || a.coverImage?.large || a.coverImage?.medium
  return (
    <Link to={`/anime/${a.id}`} style={{ textDecoration: 'none', flex: '0 0 auto', width: 155, scrollSnapAlign: 'start' }}>
      <div className="cat-card">
        <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {img ? (
            <img src={img} alt={t} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 11 }}>No Image</div>
          )}
          <div className="cat-card-gradient" />
          {a.averageScore && <span className="cat-badge cat-badge-score">{a.averageScore}%</span>}
          {a.format && <span className="cat-badge cat-badge-format">{a.format.replace('_', ' ')}</span>}
        </div>
        <div style={{ padding: '6px 2px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{t}</p>
          {a.episodes && <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>{a.episodes} ep</p>}
        </div>
      </div>
    </Link>
  )
}

function GridCard({ a }) {
  const t = a.title?.english || a.title?.romaji || a.title?.userPreferred || 'Unknown'
  const img = a.coverImage?.extraLarge || a.coverImage?.large || a.coverImage?.medium
  return (
    <Link to={`/anime/${a.id}`} style={{ textDecoration: 'none' }}>
      <div className="cat-card">
        <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {img ? (
            <img src={img} alt={t} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 11 }}>No Image</div>
          )}
          <div className="cat-card-gradient" />
          {a.averageScore && <span className="cat-badge cat-badge-score">{a.averageScore}%</span>}
          {a.format && <span className="cat-badge cat-badge-format">{a.format.replace('_', ' ')}</span>}
        </div>
        <div style={{ padding: '6px 2px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{t}</p>
          {a.episodes && <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>{a.episodes} ep</p>}
        </div>
      </div>
    </Link>
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', aspectRatio: '2/3', animation: 'shimmer 1.5s infinite' }} />
      ))}
    </div>
  )
}

function SkeletonRow() {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ height: 18, width: 120, background: 'var(--bg-card)', borderRadius: 6, marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 12 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ flex: '0 0 155px', height: 260, borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', animation: 'shimmer 1.5s infinite' }} />
        ))}
      </div>
    </div>
  )
}

export default function Catalog() {
  const [sp, ss] = useSearchParams()
  const [q, sq] = useState(sp.get('search') || '')
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef(null)

  const f = useMemo(() => ({
    genre: sp.get('genre') || '', format: sp.get('format') || '', status: sp.get('status') || '',
    year: sp.get('year') || '', sort: sp.get('sort') || 'POPULARITY_DESC', search: q || '',
  }), [sp, q])

  const pg = parseInt(sp.get('page') || '1', 10)
  const { data, isLoading } = useBrowse(f, pg)
  const media = data?.media || []
  const total = data?.pageInfo?.total || 0
  const last = data?.pageInfo?.lastPage || 1
  const isSearchMode = !!f.search || !!f.genre || !!f.format || !!f.status || !!f.year

  const set = useCallback((k, v) => { ss(p => { const n = new URLSearchParams(p); v ? n.set(k, v) : n.delete(k); n.set('page', '1'); return n }) }, [ss])
  const go = useCallback(p => { ss(pv => { const n = new URLSearchParams(pv); n.set('page', String(p)); return n }); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [ss])
  const clr = useCallback(() => { sq(''); ss({}) }, [ss])

  // Cmd+K
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') setShowSearch(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />

      {/* Search overlay */}
      {showSearch && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }} onClick={() => setShowSearch(false)}>
          <div style={{ width: '100%', maxWidth: 560, padding: '0 20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 16px' }}>
              <svg width="18" height="18" fill="var(--text-muted)" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <input ref={searchRef} value={q} onChange={e => sq(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { set('search', q); setShowSearch(false) } }} placeholder="Search anime..." style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 16, outline: 'none' }} />
              <kbd style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>ESC</kbd>
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>Press Enter to search • ESC to close</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px 80px' }}>
        {/* Sticky search trigger */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 0', background: 'var(--bg)' }}>
          <div onClick={() => { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer' }}>
            <svg width="16" height="16" fill="var(--text-muted)" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--text-muted)' }}>Search anime...</span>
            <kbd style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>⌘K</kbd>
          </div>
        </div>

        {/* Pill filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {SORTS.map(s => (
            <button key={s.value} onClick={() => set('sort', s.value)} style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid', borderColor: f.sort === s.value ? 'var(--accent)' : 'var(--border)', background: f.sort === s.value ? 'var(--accent)' : 'transparent', color: f.sort === s.value ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s' }}>{s.label}</button>
          ))}
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px', flexShrink: 0, alignSelf: 'center' }} />
          {FORMATS.map(v => (
            <button key={v} onClick={() => set('format', f.format === v ? '' : v)} style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid', borderColor: f.format === v ? 'var(--accent)' : 'var(--border)', background: f.format === v ? 'var(--accent)' : 'transparent', color: f.format === v ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s' }}>{fmt(v)}</button>
          ))}
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px', flexShrink: 0, alignSelf: 'center' }} />
          {STATUSES.map(v => (
            <button key={v} onClick={() => set('status', f.status === v ? '' : v)} style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid', borderColor: f.status === v ? 'var(--accent)' : 'var(--border)', background: f.status === v ? 'var(--accent)' : 'transparent', color: f.status === v ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s' }}>{fmt(v)}</button>
          ))}
        </div>

        {/* Rows mode or Search mode */}
        {isSearchMode ? (
          <>
            {total > 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{total} result{total !== 1 ? 's' : ''}</p>}
            {isLoading && pg === 1 ? <Skeleton /> : media.length > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {media.map(a => <GridCard key={a.id} a={a} />)}
                </div>
                {last > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '1.5rem 0' }}>
                    <button disabled={pg <= 1} onClick={() => go(pg - 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: pg <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: pg <= 1 ? 'default' : 'pointer', fontSize: 13 }}>‹</button>
                    {Array.from({ length: Math.min(last, 7) }, (_, i) => {
                      const p = i + 1
                      return <button key={p} onClick={() => go(p)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${p === pg ? 'var(--accent)' : 'var(--border)'}`, background: p === pg ? 'var(--accent)' : 'transparent', color: p === pg ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: p === pg ? 700 : 500 }}>{p}</button>
                    })}
                    <button disabled={pg >= last} onClick={() => go(pg + 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: pg >= last ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: pg >= last ? 'default' : 'pointer', fontSize: 13 }}>›</button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <p style={{ fontSize: 48, marginBottom: 8 }}>🔍</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Nothing found</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Try different keywords or filters</p>
                <button onClick={clr} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Clear filters</button>
              </div>
            )}
          </>
        ) : (
          <>
            {isLoading ? (
              <>
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </>
            ) : (
              <>
                <Row title="Trending Now" sort="POPULARITY_DESC" />
                <Row title="Top Rated" sort="SCORE_DESC" />
                <Row title="New Releases" sort="START_DATE_DESC" />
                <Row title="Recently Updated" sort="START_DATE_DESC" />
              </>
            )}
          </>
        )}
      </div>

      <Footer />
      <MobileBottomNav />
      <div className="bottom-nav-spacer" />
      <style>{`
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:.3}}
        .cat-card{transition:transform .2s ease,box-shadow .2s ease}
        .cat-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(99,102,241,0.2)}
        .cat-card-gradient{position:absolute;bottom:0;left:0;right:0;height:40%;background:linear-gradient(transparent,rgba(0,0,0,.7));pointer-events:none}
        .cat-badge{position:absolute;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;color:#fff;z-index:1}
        .cat-badge-score{top:6px;right:6px;background:rgba(0,0,0,.75)}
        .cat-badge-format{top:6px;left:6px;background:rgba(99,102,241,.85)}
        ::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  )
}
