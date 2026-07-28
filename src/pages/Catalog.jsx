import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../config'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import styled from 'styled-components'

const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']
const PER_PAGE = 36
const fmt = v => v.replace(/_/g, ' ')

const W = styled.div`max-width:1400px;margin:0 auto;padding:12px 12px 80px;@media(min-width:768px){padding:24px 24px 80px;min-height:100vh;}`
const Title = styled.h1`font-size:20px;font-weight:700;margin-bottom:12px;@media(min-width:768px){font-size:24px;margin-bottom:16px;}`
const IW = styled.div`display:flex;align-items:center;gap:8px;background:var(--bg-elevated);border:1px solid ${p=>p.$f?'var(--accent)':'var(--border)'};border-radius:12px;padding:10px 14px;margin-bottom:10px;transition:border-color .2s;@media(min-width:768px){padding:12px 18px;margin-bottom:14px;}`
const I = styled.input`flex:1;background:none;border:none;color:var(--text-primary);font-size:15px;outline:none;&::placeholder{color:var(--text-muted);}`
const B = styled.div`display:flex;gap:6px;margin-bottom:10px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px;&::-webkit-scrollbar{display:none;}@media(min-width:768px){margin-bottom:14px;gap:8px;}`
const Sel = styled.select`background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border);border-radius:10px;padding:8px 28px 8px 10px;font-size:13px;cursor:pointer;outline:none;flex-shrink:0;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%238c8c8c' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;@media(min-width:768px){font-size:14px;padding:10px 32px 10px 12px;min-height:36px;}`
const Chip = styled.button`flex-shrink:0;min-height:34px;background:${p=>p.$on?'var(--accent)':'var(--bg-elevated)'};color:${p=>p.$on?'#000':'var(--text-secondary)'};border:1px solid ${p=>p.$on?'var(--accent)':'var(--border)'};border-radius:999px;padding:6px 16px;font-size:13px;font-weight:${p=>p.$on?600:500};cursor:pointer;white-space:nowrap;transition:all .15s;-webkit-tap-highlight-color:transparent;@media(min-width:768px){padding:8px 20px;min-height:38px;&:hover{background:${p=>p.$on?'var(--accent)':'rgba(255,255,255,.06)'};}}`
const CC = styled.button`flex-shrink:0;min-height:34px;background:none;color:var(--accent);border:1px solid transparent;border-radius:999px;padding:6px 16px;font-size:13px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px;`
const M = styled.p`font-size:13px;color:var(--text-muted);margin-bottom:10px;@media(min-width:768px){margin-bottom:14px;font-size:14px;}`
const G = styled.div`display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:1rem;@media(min-width:500px){grid-template-columns:repeat(3,1fr);gap:12px;}@media(min-width:768px){grid-template-columns:repeat(4,1fr);gap:14px;}@media(min-width:1024px){grid-template-columns:repeat(5,1fr);gap:16px;}@media(min-width:1280px){grid-template-columns:repeat(6,1fr);gap:18px;}`
const A = styled(Link)`text-decoration:none;display:flex;flex-direction:column;border-radius:10px;overflow:hidden;background:var(--bg-card);transition:transform .25s,box-shadow .25s;@media(min-width:768px){border-radius:12px;&:hover{transform:translateY(-4px);box-shadow:0 8px 25px rgba(0,0,0,.35);}}`
const P = styled.div`position:relative;aspect-ratio:2/3;overflow:hidden;background:var(--bg-card);`
const PI = styled.img`width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s;${A}:hover &{transform:scale(1.06);}`
const Bdg = styled.span`position:absolute;z-index:2;${p=>p.$tr?'top:6px;right:6px;':'top:6px;left:6px;'}background:${p=>p.$bg||'rgba(0,0,0,.8)'};color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;`
const Inf = styled.div`padding:8px;display:flex;flex-direction:column;gap:4px;`
const CT = styled.p`font-size:12px;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0;`
const Tg = styled.div`display:flex;gap:4px;flex-wrap:wrap;`
const Tag = styled.span`font-size:10px;color:var(--text-muted);background:var(--bg-elevated);padding:1px 5px;border-radius:3px;`
const E = styled.div`text-align:center;padding:4rem 1rem;`
const Pr = styled.div`display:flex;align-items:center;justify-content:center;gap:6px;padding:1rem 0;flex-wrap:wrap;`
const PB = styled.button`min-width:36px;height:36px;border-radius:10px;border:1px solid ${p=>p.$on?'var(--accent)':'var(--border)'};background:${p=>p.$on?'var(--accent)':'transparent'};color:${p=>p.$on?'#000':'var(--text-secondary)'};font-size:13px;font-weight:${p=>p.$on?700:500};cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0 10px;transition:all .15s;&:disabled{opacity:.3;cursor:not-allowed;}`

function useBrowse(f, p) {
  return useQuery(['cat', f, p], async () => {
    const q = new URLSearchParams()
    q.set('page', p); q.set('perPage', PER_PAGE)
    if (f.genre) q.append('genre', f.genre)
    if (f.format) q.append('format', f.format)
    if (f.status) q.append('status', f.status)
    if (f.season) q.set('season', f.season)
    if (f.year) q.set('year', f.year)
    if (f.sort) q.set('sort', f.sort)
    if (f.search) q.set('search', f.search)
    const { data } = await axios.get(`${API_BASE}/api/v1/browse?${q}`)
    return data
  }, { keepPreviousData: true, staleTime: 30000 })
}

function Pg({ cur, last, go }) {
  if (last <= 1) return null
  const p = [1], s = Math.max(2, cur - 2), e = Math.min(last - 1, cur + 2)
  if (s > 2) p.push('…')
  for (let i = s; i <= e; i++) p.push(i)
  if (e < last - 1) p.push('…')
  if (last > 1) p.push(last)
  return (
    <Pr>
      <PB disabled={cur <= 1} onClick={() => go(cur - 1)}>‹</PB>
      {p.map((x, i) => x === '…' ? <span key={i} style={{ color: 'var(--text-muted)', fontSize: 13 }}>…</span> : <PB key={x} $on={x === cur} onClick={() => go(x)}>{x}</PB>)}
      <PB disabled={cur >= last} onClick={() => go(cur + 1)}>›</PB>
    </Pr>
  )
}

function ACard(a) {
  const t = a.title?.english || a.title?.romaji || a.title?.userPreferred || 'Unknown'
  return (
    <A to={`/anime/${a.id}`}>
      <P>
        {a.coverImage?.large ? <PI src={a.coverImage.large} alt={t} loading="lazy" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 11 }}>No Image</div>}
        {a.averageScore ? <Bdg $tr $bg="rgba(0,0,0,.75)">{a.averageScore}%</Bdg> : null}
        {a.format ? <Bdg $bg="rgba(99,102,241,.85)">{a.format.replace('_', ' ')}</Bdg> : null}
      </P>
      <Inf>
        <CT>{t}</CT>
        <Tg>
          {a.season && a.seasonYear ? <Tag>{a.season} {a.seasonYear}</Tag> : null}
          {a.episodes ? <Tag>{a.episodes} ep</Tag> : null}
        </Tg>
      </Inf>
    </A>
  )
}

const SORTS = [
  { label: 'Popular', value: 'POPULARITY_DESC' },
  { label: 'Top Rated', value: 'SCORE_DESC' },
  { label: 'Newest', value: 'START_DATE_DESC' },
  { label: 'A-Z', value: 'TITLE_ROMAJI' },
]
const FORMATS = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']
const STATUSES = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED']
const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL']
const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i)

function Skel() {
  return (
    <G>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <div style={{ borderRadius: 10, background: 'var(--bg-card)', aspectRatio: '2/3', animation: 'p 1.5s infinite' }} />
          <div style={{ marginTop: 8, height: 12, background: 'var(--bg-card)', borderRadius: 4, animation: 'p 1.5s infinite' }} />
        </div>
      ))}
    </G>
  )
}

export default function Catalog() {
  const [sp, ss] = useSearchParams()
  const [q, sq] = useState(sp.get('search') || '')
  const [foc, sf] = useState(false)

  const f = useMemo(() => ({
    genre: sp.get('genre') || '', format: sp.get('format') || '', status: sp.get('status') || '',
    season: sp.get('season') || '', year: sp.get('year') || '',
    sort: sp.get('sort') || 'POPULARITY_DESC', search: q || '',
  }), [sp, q])

  const act = f.genre || f.format || f.status || f.season || f.year || f.search
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
      <W>
        <Title>Browse</Title>

        <IW $f={foc}>
          <svg width="15" height="15" fill="var(--text-muted)" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <I value={q} onChange={e => sq(e.target.value)} onFocus={() => sf(true)} onKeyDown={e => { if (e.key === 'Enter') set('search', q) }} placeholder="Search..." />
        </IW>

        <B>
          <Sel value={f.sort} onChange={e => set('sort', e.target.value)}>{SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</Sel>
          <Sel value={f.format} onChange={e => set('format', e.target.value)}><option value="">Format</option>{FORMATS.map(v => <option key={v} value={v}>{fmt(v)}</option>)}</Sel>
          <Sel value={f.status} onChange={e => set('status', e.target.value)}><option value="">Status</option>{STATUSES.map(v => <option key={v} value={v}>{fmt(v)}</option>)}</Sel>
          <Sel value={f.season} onChange={e => set('season', e.target.value)}><option value="">Season</option>{SEASONS.map(v => <option key={v} value={v}>{v}</option>)}</Sel>
          <Sel value={f.year} onChange={e => set('year', e.target.value)}><option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</Sel>
        </B>

        <B>
          {GENRES.map(g => <Chip key={g} $on={f.genre === g} onClick={() => set('genre', f.genre === g ? '' : g)}>{g}</Chip>)}
          {act ? <CC onClick={clr}><svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>Clear</CC> : null}
        </B>

        {act && total > 0 && !isLoading ? <M>{total} result{total !== 1 ? 's' : ''}</M> : null}
        {act && total === 0 && !isLoading ? (
          <E>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Nothing found</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>{f.search ? `“${f.search}” — no matches` : 'Try different filters'}</p>
            <button onClick={clr} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Clear</button>
          </E>
        ) : null}

        {isLoading && pg === 1 ? <Skel /> : null}

        {media.length > 0 ? (
          <>
            <G>{media.map(a => <ACard key={a.id} {...a} />)}</G>
            <Pg cur={pg} last={last} go={go} />
          </>
        ) : (!isLoading && !act ? <Skel /> : null)}
      </W>
      <Footer />
      <MobileBottomNav />
      <div className="bottom-nav-spacer" />
      <style>{`@keyframes p{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
