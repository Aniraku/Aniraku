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
import { FaTimes, FaSearch, FaArrowUp } from 'react-icons/fa'
import styled from 'styled-components'

const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'NSFW']
const FORMATS = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']
const SORTS = [
  { label: 'Popular', value: 'POPULARITY_DESC' },
  { label: 'Score', value: 'SCORE_DESC' },
  { label: 'Newest', value: 'START_DATE_DESC' },
  { label: 'A-Z', value: 'TITLE_ROMAJI' },
]
const STATUSES = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED']
const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL']
const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i)
const RESULTS_PER_PAGE = { mobile: 24, desktop: 36 }
const fmtLabel = v => v.replace(/_/g, ' ')

const Page = styled.div`
  min-height: 100vh;
  background: var(--bg);
`
const Wrap = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 12px calc(var(--header-h, 60px) + 2rem);
  @media (min-width: 768px) { padding: 1.5rem 24px calc(var(--header-h, 60px) + 2rem); }
`
const H1 = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
  @media (min-width: 768px) { font-size: 1.5rem; margin-bottom: 1.5rem; }
`
const SearchBox = styled.div`
  position: relative;
  margin-bottom: 0.75rem;
`
const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-elevated);
  border: 1px solid ${p => p.$focus ? 'var(--accent)' : 'var(--border)'};
  border-radius: 999px;
  padding: 8px 12px;
  transition: border-color 0.2s;
  @media (min-width: 768px) { padding: 10px 16px; }
`
const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  min-width: 0;
  &::placeholder { color: var(--text-muted); }
`
const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  z-index: 100;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  max-height: 360px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
`
const DropItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  &:hover { background: rgba(255,255,255,0.03); }
  &:last-child { border-bottom: none; }
`
const DropImg = styled.img`
  width: 32px; height: 45px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  background: #222;
`
const DropTitle = styled.p`
  font-size: 13px; font-weight: 600;
  color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`
const DropMeta = styled.p`
  font-size: 11px; color: var(--text-muted); margin-top: 1px;
`
const GenreTag = styled.span`
  display: inline-block;
  background: rgba(99,102,241,0.12);
  color: #818cf8;
  font-size: 9px; padding: 1px 5px;
  border-radius: 3px;
  margin-right: 3px; margin-top: 3px;
`
const Filters = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 0.75rem;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  -webkit-overflow-scrolling: touch;
`
const Sel = styled.select`
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 28px 6px 10px;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%238c8c8c' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  @media (min-width: 768px) { font-size: 13px; padding: 8px 32px 8px 14px; }
`
const Chips = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 1rem;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  -webkit-overflow-scrolling: touch;
`
const Chip = styled.button`
  flex-shrink: 0;
  background: ${p => p.$on ? 'var(--accent)' : 'var(--bg-elevated)'};
  color: ${p => p.$on ? '#000' : 'var(--text-secondary)'};
  border: 1px solid ${p => p.$on ? 'var(--accent)' : 'var(--border)'};
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: ${p => p.$on ? 600 : 500};
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  @media (min-width: 768px) { padding: 6px 16px; font-size: 13px; }
`
const ClearBtn = styled(Chip)`
  background: none;
  color: var(--accent);
  border-color: transparent;
  display: flex;
  align-items: center;
  gap: 4px;
`
const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 12px;
  color: var(--text-muted);
`
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 1rem;
  @media (max-width: 480px) { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  @media (min-width: 481px) and (max-width: 767px) { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  @media (min-width: 768px) and (max-width: 1023px) { grid-template-columns: repeat(4, 1fr); gap: 10px; }
  @media (min-width: 1024px) and (max-width: 1279px) { grid-template-columns: repeat(5, 1fr); gap: 12px; }
  @media (min-width: 1280px) { grid-template-columns: repeat(6, 1fr); gap: 12px; }
`
const Card = styled(Link)`
  text-decoration: none;
  display: block;
`
const Poster = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 2/3;
  background: var(--bg-card);
`
const PosterImg = styled.img`
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
`
const Badge = styled.span`
  position: absolute;
  ${p => p.$pos === 'tr' ? 'top:4px;right:4px;' : 'top:4px;left:4px;'}
  background: ${p => p.$bg || 'rgba(0,0,0,0.75)'};
  color: ${p => p.$c || '#fff'};
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
`
const CardTitle = styled.p`
  font-size: 11px;
  font-weight: 500;
  color: var(--text-primary);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (min-width: 768px) { font-size: 12px; }
`
const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 1rem;
`
const ListItem = styled(Link)`
  display: flex;
  gap: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  text-decoration: none;
  color: var(--text-primary);
  &:hover { background: var(--bg-elevated); }
`
const ListImg = styled.img`
  width: 48px; height: 68px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  background: var(--bg-elevated);
`
const ListBody = styled.div`
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; justify-content: center; gap: 2px;
`
const Empty = styled.div`
  text-align: center;
  padding: 3rem 1rem;
`
const Pager = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 1rem 0;
  flex-wrap: wrap;
`
const PBtn = styled.button`
  min-width: 32px; height: 32px;
  border-radius: 8px;
  border: 1px solid ${p => p.$on ? 'var(--accent)' : 'var(--border)'};
  background: ${p => p.$on ? 'var(--accent)' : 'transparent'};
  color: ${p => p.$on ? '#000' : 'var(--text-secondary)'};
  font-size: 12px;
  font-weight: ${p => p.$on ? 700 : 500};
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 0 8px;
  &:disabled { opacity: 0.3; cursor: not-allowed; }
  @media (min-width: 768px) { min-width: 36px; height: 36px; font-size: 13px; padding: 0 10px; }
`
const PageInfo = styled.p`
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 0.5rem;
`
const UpBtn = styled.button`
  position: fixed;
  bottom: ${p => p.$mobile ? '70px' : '24px'};
  right: 16px;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--accent);
  color: #000;
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: ${p => p.$show ? 1 : 0};
  pointer-events: ${p => p.$show ? 'auto' : 'none'};
  transform: ${p => p.$show ? 'scale(1)' : 'scale(0.8)'};
  transition: all 0.2s;
  z-index: 50;
`

function useBrowse(filters, page, perPage) {
  return useQuery(['catalog', filters, page, perPage], async () => {
    const p = new URLSearchParams()
    p.set('page', page)
    p.set('perPage', perPage)
    if (filters.genre) p.append('genre', filters.genre)
    if (filters.format) p.append('format', filters.format)
    if (filters.status) p.append('status', filters.status)
    if (filters.season) p.set('season', filters.season)
    if (filters.year) p.set('year', filters.year)
    if (filters.sort) p.set('sort', filters.sort)
    if (filters.search) p.set('search', filters.search)
    const { data } = await axios.get(`${API_BASE}/api/v1/browse?${p}`)
    return data
  }, { keepPreviousData: true })
}

function useTrending() {
  return useQuery(['trending'], async () => {
    const { data } = await axios.get(`${API_BASE}/api/v1/trending?perPage=10`)
    return Array.isArray(data) ? data : []
  })
}

function useSuggestions(query, f) {
  return useQuery(['suggest', query, f.genre, f.format, f.status], async () => {
    if (!query || query.length < 2) return []
    const p = new URLSearchParams({ q: query })
    if (f.genre) p.append('genre', f.genre)
    if (f.format) p.append('format', f.format)
    if (f.status) p.append('status', f.status)
    const { data } = await axios.get(`${API_BASE}/api/v1/search?${p}`)
    return data.results || []
  }, { enabled: !!query && query.length >= 2, staleTime: 60000 })
}

function PagerNav({ cur, last, go }) {
  if (last <= 1) return null
  const pages = [1]
  const s = Math.max(2, cur - 1)
  const e = Math.min(last - 1, cur + 1)
  if (s > 2) pages.push('...')
  for (let i = s; i <= e; i++) pages.push(i)
  if (e < last - 1) pages.push('...')
  if (last > 1) pages.push(last)
  return (
    <Pager>
      <PBtn disabled={cur <= 1} onClick={() => go(cur - 1)}>Prev</PBtn>
      {pages.map((p, i) => p === '...' ? <span key={i} style={{ color: 'var(--text-muted)', fontSize: 12 }}>…</span> : (
        <PBtn key={p} $on={p === cur} onClick={() => go(p)}>{p}</PBtn>
      ))}
      <PBtn disabled={cur >= last} onClick={() => go(cur + 1)}>Next</PBtn>
    </Pager>
  )
}

export default function Catalog() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [input, setInput] = useState(params.get('search') || '')
  const [view, setView] = useState('grid')
  const [focus, setFocus] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const ref = useRef(null)
  const isMobile = !useMediaQuery('(min-width: 768px)')
  const perPage = isMobile ? RESULTS_PER_PAGE.mobile : RESULTS_PER_PAGE.desktop
  const debounced = useDebounce(input, 300)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 400)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') setFocus(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setFocus(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const f = useMemo(() => ({
    genre: params.get('genre') || '',
    format: params.get('format') || '',
    status: params.get('status') || '',
    season: params.get('season') || '',
    year: params.get('year') || '',
    sort: params.get('sort') || 'POPULARITY_DESC',
    search: debounced || '',
  }), [params, debounced])

  const active = f.genre || f.format || f.status || f.season || f.year || f.search
  const page = parseInt(params.get('page') || '1', 10)
  const { data, isLoading } = useBrowse(f, page, perPage)
  const { data: trending } = useTrending()
  const { data: suggestions } = useSuggestions(focus && input.length >= 2 ? input : '', f)

  const media = data?.media || []
  const total = data?.pageInfo?.total || 0
  const lastPage = data?.pageInfo?.lastPage || 1
  const showDrop = focus && input.length >= 2 && suggestions?.length > 0

  const set = useCallback((k, v) => {
    setParams(p => { const n = new URLSearchParams(p); v ? n.set(k, v) : n.delete(k); n.set('page', '1'); return n })
  }, [setParams])

  const go = useCallback(p => {
    setParams(prev => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setParams])

  const clear = useCallback(() => { setInput(''); setParams({}) }, [setParams])
  const showTrending = !active && !isLoading

  return (
    <Page>
      <NavBar />
      <Wrap>
        <H1>Browse Anime</H1>
        <SearchBox ref={ref}>
          <SearchBar $focus={focus}>
            <FaSearch size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <SearchInput
              value={input}
              onChange={e => setInput(e.target.value)}
              onFocus={() => setFocus(true)}
              onKeyDown={e => { if (e.key === 'Enter') { setFocus(false); set('search', input) } }}
              placeholder={f.genre ? `Search in ${f.genre}...` : 'Search anime...'}
            />
            {input && (
              <button onClick={() => { setInput(''); setParams(p => { const n = new URLSearchParams(p); n.delete('search'); n.set('page', '1'); return n }) }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                <FaTimes size={12} />
              </button>
            )}
          </SearchBar>
          {showDrop && (
            <Dropdown>
              {suggestions.slice(0, 8).map(s => {
                const title = s.title?.english || s.title?.romaji || s.title?.userPreferred || 'Unknown'
                return (
                  <DropItem key={s.id} onClick={() => { setFocus(false); navigate(`/anime/${s.id}`) }}>
                    {s.coverImage?.large ? <DropImg src={s.coverImage.large} alt="" /> : <div style={{ width: 32, height: 45, background: '#222', borderRadius: 4, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <DropTitle>{title}</DropTitle>
                      <DropMeta>
                        {s.format ? fmtLabel(s.format) : 'Anime'}
                        {s.averageScore ? ` · ${s.averageScore}%` : ''}
                        {s.episodes ? ` · ${s.episodes} ep` : ''}
                      </DropMeta>
                      {s.genres?.length > 0 && (
                        <div>{s.genres.slice(0, 3).map(g => <GenreTag key={g}>{g}</GenreTag>)}</div>
                      )}
                    </div>
                  </DropItem>
                )
              })}
            </Dropdown>
          )}
        </SearchBox>

        <Filters>
          <Sel value={f.sort} onChange={e => set('sort', e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Sel>
          <Sel value={f.format} onChange={e => set('format', e.target.value)}>
            <option value="">Format</option>
            {FORMATS.map(v => <option key={v} value={v}>{fmtLabel(v)}</option>)}
          </Sel>
          <Sel value={f.status} onChange={e => set('status', e.target.value)}>
            <option value="">Status</option>
            {STATUSES.map(v => <option key={v} value={v}>{fmtLabel(v)}</option>)}
          </Sel>
          <Sel value={f.season} onChange={e => set('season', e.target.value)}>
            <option value="">Season</option>
            {SEASONS.map(v => <option key={v} value={v}>{v}</option>)}
          </Sel>
          <Sel value={f.year} onChange={e => set('year', e.target.value)}>
            <option value="">Year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Sel>
          {!isMobile && (
            <PBtn onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} style={{ flexShrink: 0, fontSize: 11 }}>
              {view === 'grid' ? 'List' : 'Grid'}
            </PBtn>
          )}
        </Filters>

        <Chips>
          {GENRES.map(g => (
            <Chip key={g} $on={f.genre === g} onClick={() => set('genre', f.genre === g ? '' : g)}>{g}</Chip>
          ))}
          {active && <ClearBtn onClick={clear}><FaTimes /> Clear</ClearBtn>}
        </Chips>

        {showTrending && trending?.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Trending Now</p>
            <Grid>
              {trending.map(a => {
                const t = a.title?.english || a.title?.romaji || a.title?.userPreferred || 'Unknown'
                return (
                  <Card key={a.id} to={`/anime/${a.id}`}>
                    <Poster>
                      {a.coverImage?.large ? <PosterImg src={a.coverImage.large} alt={t} loading="lazy" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 10 }}>No Image</div>}
                      {a.averageScore && <Badge $pos="tl">{a.averageScore}%</Badge>}
                      {a.format && <Badge $pos="tr" $bg="rgba(99,102,241,0.85)">{a.format.replace('_', ' ')}</Badge>}
                    </Poster>
                    <CardTitle>{t}</CardTitle>
                  </Card>
                )
              })}
            </Grid>
          </div>
        )}

        {active && total > 0 && !isLoading && (
          <Meta><span>{total} result{total !== 1 ? 's' : ''}</span></Meta>
        )}

        {isLoading && page === 1 ? (
          <Grid>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 8, background: 'var(--bg-card)', aspectRatio: '2/3', animation: 'pulse 1.5s infinite' }} />
            ))}
          </Grid>
        ) : media.length === 0 && active ? (
          <Empty>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No results found</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {f.search ? `No anime matching "${f.search}"` : 'No match for current filters'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={clear} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear Filters</button>
              <button onClick={() => navigate('/catalog?sort=POPULARITY_DESC')} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 999, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>Browse Popular</button>
            </div>
          </Empty>
        ) : media.length === 0 ? null : view === 'grid' ? (
          <>
            <Grid>
              {media.map(a => {
                const t = a.title?.english || a.title?.romaji || a.title?.userPreferred || 'Unknown'
                return (
                  <Card key={a.id} to={`/anime/${a.id}`}>
                    <Poster>
                      {a.coverImage?.large ? <PosterImg src={a.coverImage.large} alt={t} loading="lazy" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 10 }}>No Image</div>}
                      {a.averageScore && <Badge $pos="tr">{a.averageScore}%</Badge>}
                      {a.format && <Badge $pos="tl" $bg="rgba(99,102,241,0.85)">{a.format.replace('_', ' ')}</Badge>}
                    </Poster>
                    <CardTitle>{t}</CardTitle>
                  </Card>
                )
              })}
            </Grid>
            {total > 0 && <PageInfo>Page {page} of {lastPage}</PageInfo>}
            <PagerNav cur={page} last={lastPage} go={go} />
          </>
        ) : (
          <>
            <List>
              {media.map(a => {
                const t = a.title?.english || a.title?.romaji || a.title?.userPreferred || 'Unknown'
                return (
                  <ListItem key={a.id} to={`/anime/${a.id}`}>
                    {a.coverImage?.large ? <ListImg src={a.coverImage.large} alt={t} loading="lazy" /> : <div style={{ width: 48, height: 68, background: '#222', borderRadius: 6, flexShrink: 0 }} />}
                    <ListBody>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{t}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {[a.format ? fmtLabel(a.format) : '', a.averageScore ? `${a.averageScore}%` : '', a.episodes ? `${a.episodes} ep` : ''].filter(Boolean).join(' · ')}
                      </p>
                      {a.genres?.length > 0 && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                          {a.genres.slice(0, 3).map(g => <span key={g} style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: 9, padding: '1px 5px', borderRadius: 3 }}>{g}</span>)}
                        </div>
                      )}
                    </ListBody>
                  </ListItem>
                )
              })}
            </List>
            {total > 0 && <PageInfo>Page {page} of {lastPage}</PageInfo>}
            <PagerNav cur={page} last={lastPage} go={go} />
          </>
        )}
      </Wrap>
      <Footer />
      <MobileBottomNav />
      <div className="bottom-nav-spacer" />
      <UpBtn $mobile={isMobile} $show={scrolled} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <FaArrowUp size={16} />
      </UpBtn>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </Page>
  )
}
