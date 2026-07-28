import { useState, useCallback, useMemo } from 'react'
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
const YEARS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i)

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

function Pg({ cur, last, go }) {
  if (last <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '1.5rem 0' }}>
      <button disabled={cur <= 1} onClick={() => go(cur - 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>‹</button>
      {Array.from({ length: Math.min(last, 7) }, (_, i) => {
        const pg = i + 1
        return <button key={pg} onClick={() => go(pg)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${pg === cur ? 'var(--accent)' : 'var(--border)'}`, background: pg === cur ? 'var(--accent)' : 'transparent', color: pg === cur ? '#000' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: pg === cur ? 700 : 500 }}>{pg}</button>
      })}
      <button disabled={cur >= last} onClick={() => go(cur + 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>›</button>
    </div>
  )
}

function Card({ a }) {
  const t = a.title?.english || a.title?.romaji || a.title?.userPreferred || 'Unknown'
  const img = a.coverImage?.extraLarge || a.coverImage?.large || a.coverImage?.medium
  return (
    <Link to={`/anime/${a.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, overflow: 'hidden', transition: 'transform .2s' }}>
        <div style={{ position: 'relative', aspectRatio: '2/3', background: 'var(--bg-card)' }}>
          {img ? (
            <img src={img} alt={t} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 11 }}>No Image</div>
          )}
          {a.averageScore && <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.75)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{a.averageScore}%</span>}
          {a.format && <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(99,102,241,.85)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{a.format.replace('_', ' ')}</span>}
        </div>
        <div style={{ padding: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{t}</p>
          {a.episodes && <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>{a.episodes} ep</p>}
        </div>
      </div>
    </Link>
  )
}

export default function Catalog() {
  const [sp, ss] = useSearchParams()
  const [q, sq] = useState(sp.get('search') || '')

  const f = useMemo(() => ({
    genre: sp.get('genre') || '', format: sp.get('format') || '', status: sp.get('status') || '',
    year: sp.get('year') || '', sort: sp.get('sort') || 'POPULARITY_DESC', search: q || '',
  }), [sp, q])

  const pg = parseInt(sp.get('page') || '1', 10)
  const { data, isLoading } = useBrowse(f, pg)
  const media = data?.media || []
  const total = data?.pageInfo?.total || 0
  const last = data?.pageInfo?.lastPage || 1

  const set = useCallback((k, v) => { ss(p => { const n = new URLSearchParams(p); v ? n.set(k, v) : n.delete(k); n.set('page', '1'); return n }) }, [ss])
  const go = useCallback(p => { ss(pv => { const n = new URLSearchParams(pv); n.set('page', String(p)); return n }); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [ss])
  const clr = useCallback(() => { sq(''); ss({}) }, [ss])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 12px 80px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Browse</h1>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
          <svg width="15" height="15" fill="var(--text-muted)" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input value={q} onChange={e => sq(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') set('search', q) }} placeholder="Search..." style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 15, outline: 'none' }} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <select value={f.sort} onChange={e => set('sort', e.target.value)} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={f.format} onChange={e => set('format', e.target.value)} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
            <option value="">Format</option>
            {FORMATS.map(v => <option key={v} value={v}>{fmt(v)}</option>)}
          </select>
          <select value={f.status} onChange={e => set('status', e.target.value)} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
            <option value="">Status</option>
            {STATUSES.map(v => <option key={v} value={v}>{fmt(v)}</option>)}
          </select>
          <select value={f.year} onChange={e => set('year', e.target.value)} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
            <option value="">Year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Results */}
        {total > 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{total} result{total !== 1 ? 's' : ''}</p>}

        {isLoading && pg === 1 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {Array.from({ length: 10 }).map((_, i) => <div key={i} style={{ borderRadius: 10, background: 'var(--bg-card)', aspectRatio: '2/3', animation: 'p 1.5s infinite' }} />)}
          </div>
        ) : media.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {media.map(a => <Card key={a.id} a={a} />)}
            </div>
            <Pg cur={pg} last={last} go={go} />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Nothing found</p>
            <button onClick={clr} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Clear</button>
          </div>
        )}
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="bottom-nav-spacer" />
      <style>{`@keyframes p{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
