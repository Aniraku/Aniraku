import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../config'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import useDebounce from '../hooks/useDebounce'
import useMediaQuery from '../hooks/useMediaQuery'
import { FaSearch, FaArrowUp, FaFire, FaStar, FaClock, FaList, FaTh } from 'react-icons/fa'
import styled from 'styled-components'

const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'NSFW']
const FORMATS = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']
const SORTS = [
  { label: 'Most Popular', value: 'POPULARITY_DESC', icon: FaFire },
  { label: 'Top Rated', value: 'SCORE_DESC', icon: FaStar },
  { label: 'Newest', value: 'START_DATE_DESC', icon: FaClock },
  { label: 'A-Z', value: 'TITLE_ROMAJI' },
]
const STATUSES = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED']
const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL']
const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i)
const PER_PAGE = 36
const fmt = v => v.replace(/_/g, ' ')

const Page = styled.div`min-height:100vh;background:var(--bg);`

const Wrap = styled.div`
  max-width:1400px;margin:0 auto;
  padding:0.75rem 12px calc(var(--header-h,60px)+2rem);
  @media(min-width:768px){padding:1.5rem 24px calc(var(--header-h,60px)+2rem);}
`

const Title = styled.h1`
  font-size:1.125rem;font-weight:700;color:var(--text-primary);margin-bottom:0.75rem;
  @media(min-width:768px){font-size:1.5rem;margin-bottom:1.25rem;}
`

const Search = styled.div`
  display:flex;align-items:center;gap:8px;
  background:var(--bg-elevated);
  border:1px solid ${p=>p.$f?'var(--accent)':'var(--border)'};
  border-radius:12px;padding:10px 14px;margin-bottom:0.75rem;
  transition:border-color 0.2s,box-shadow 0.2s;
  ${p=>p.$f&&'box-shadow:0 0 0 3px rgba(99,102,241,0.15);'}
  @media(min-width:768px){padding:12px 18px;border-radius:14px;margin-bottom:1rem;}
`

const Input = styled.input`
  flex:1;background:none;border:none;color:var(--text-primary);
  font-size:15px;outline:none;min-width:0;
  &::placeholder{color:var(--text-muted);}
  @media(min-width:768px){font-size:16px;}
`

const Bars = styled.div`
  display:flex;gap:8px;margin-bottom:0.75rem;
  overflow-x:auto;padding-bottom:6px;scrollbar-width:none;-webkit-overflow-scrolling:touch;
  &::-webkit-scrollbar{display:none;}
  @media(min-width:768px){margin-bottom:1rem;gap:10px;}
`

const Sel = styled.select`
  background:var(--bg-elevated);color:var(--text-primary);
  border:1px solid var(--border);border-radius:10px;
  padding:8px 30px 8px 12px;font-size:13px;cursor:pointer;outline:none;
  flex-shrink:0;appearance:none;min-height:36px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%238c8c8c' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 10px center;
  @media(min-width:768px){font-size:14px;padding:10px 34px 10px 14px;border-radius:12px;min-height:40px;}
`

const Chips = styled.div`
  display:flex;gap:6px;margin-bottom:0.75rem;
  overflow-x:auto;padding-bottom:6px;scrollbar-width:none;-webkit-overflow-scrolling:touch;
  &::-webkit-scrollbar{display:none;}
  @media(min-width:768px){margin-bottom:1rem;gap:8px;}
`

const Chip = styled.button`
  flex-shrink:0;min-height:34px;
  background:${p=>p.$on?'var(--accent)':'var(--bg-elevated)'};
  color:${p=>p.$on?'#000':'var(--text-secondary)'};
  border:1px solid ${p=>p.$on?'var(--accent)':'var(--border)'};
  border-radius:999px;padding:6px 16px;font-size:13px;
  font-weight:${p=>p.$on?600:500};cursor:pointer;white-space:nowrap;
  -webkit-tap-highlight-color:transparent;transition:all 0.15s;
  &:active{transform:scale(0.96);}
  @media(min-width:768px){padding:8px 20px;font-size:14px;min-height:38px;&:hover{background:${p=>p.$on?'var(--accent)':'rgba(255,255,255,0.06)'};}}
`

const ClearBtn = styled(Chip)`background:none;color:var(--accent);border-color:transparent;display:flex;align-items:center;gap:4px;`

const Meta = styled.div`
  display:flex;justify-content:space-between;align-items:center;
  margin-bottom:0.75rem;font-size:13px;color:var(--text-muted);
  @media(min-width:768px){margin-bottom:1rem;font-size:14px;}
`

const Grid = styled.div`
  display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:1rem;
  @media(min-width:500px){grid-template-columns:repeat(3,1fr);gap:12px;}
  @media(min-width:768px){grid-template-columns:repeat(4,1fr);gap:14px;}
  @media(min-width:1024px){grid-template-columns:repeat(5,1fr);gap:16px;}
  @media(min-width:1280px){grid-template-columns:repeat(6,1fr);gap:18px;}
`

const Card = styled(Link)`
  text-decoration:none;display:flex;flex-direction:column;
  border-radius:10px;overflow:hidden;background:var(--bg-card);
  transition:transform 0.25s,box-shadow 0.25s;
  -webkit-tap-highlight-color:transparent;
  @media(min-width:768px){border-radius:12px;&:hover{transform:translateY(-4px);box-shadow:0 8px 25px rgba(0,0,0,0.35);}}
`

const Poster = styled.div`
  position:relative;aspect-ratio:2/3;overflow:hidden;background:var(--bg-card);
`

const PosterImg = styled.img`
  width:100%;height:100%;object-fit:cover;display:block;
  transition:transform 0.35s;
  ${Card}:hover &{transform:scale(1.06);}
`

const Badge = styled.span`
  position:absolute;z-index:2;
  ${p=>p.$tr?'top:6px;right:6px;':'top:6px;left:6px;'}
  background:${p=>p.$bg||'rgba(0,0,0,0.8)'};color:#fff;
  font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;line-height:1.4;
  @media(min-width:768px){font-size:11px;padding:3px 7px;top:8px;${p=>p.$tr?'right:8px;':'left:8px;'}}
`

const Info = styled.div`
  padding:8px 8px 10px;display:flex;flex-direction:column;gap:4px;
  @media(min-width:768px){padding:10px 10px 12px;gap:5px;}
`

const CardTitle = styled.p`
  font-size:12px;font-weight:600;color:var(--text-primary);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.3;
  @media(min-width:768px){font-size:13px;}
`

const Tags = styled.div`display:flex;gap:4px;flex-wrap:wrap;align-items:center;`

const Tag = styled.span`
  font-size:10px;color:var(--text-muted);background:var(--bg-elevated);padding:1px 5px;border-radius:3px;line-height:1.4;
  @media(min-width:768px){font-size:11px;padding:2px 6px;}
`

const Empty = styled.div`text-align:center;padding:4rem 1rem;`

const Pager = styled.div`
  display:flex;align-items:center;justify-content:center;gap:6px;
  padding:1.25rem 0;flex-wrap:wrap;
`

const PBtn = styled.button`
  min-width:36px;height:36px;border-radius:10px;
  border:1px solid ${p=>p.$on?'var(--accent)':'var(--border)'};
  background:${p=>p.$on?'var(--accent)':'transparent'};
  color:${p=>p.$on?'#000':'var(--text-secondary)'};
  font-size:13px;font-weight:${p=>p.$on?700:500};cursor:pointer;
  display:flex;align-items:center;justify-content:center;padding:0 10px;
  -webkit-tap-highlight-color:transparent;transition:all 0.15s;
  &:disabled{opacity:0.3;cursor:not-allowed;}
  &:active:not(:disabled){transform:scale(0.95);}
  @media(min-width:768px){min-width:40px;height:40px;font-size:14px;padding:0 12px;}
`

const PageInfo = styled.p`font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:0.5rem;`

const UpBtn = styled.button`
  position:fixed;bottom:${p=>p.$m?'80px':'24px'};right:16px;
  width:44px;height:44px;border-radius:50%;background:var(--accent);color:#000;
  border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(0,0,0,0.4);
  opacity:${p=>p.$s?1:0};pointer-events:${p=>p.$s?'auto':'none'};
  transform:${p=>p.$s?'scale(1)':'scale(0.8)'};transition:all 0.25s;z-index:50;
`

const ViewBtn = styled.button`
  flex-shrink:0;min-height:36px;border-radius:10px;
  background:var(--bg-elevated);color:var(--text-secondary);
  border:1px solid var(--border);cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  padding:0 10px;gap:4px;font-size:12px;
  @media(min-width:768px){min-height:40px;padding:0 12px;font-size:13px;}
`

function useBrowse(f, p) {
  return useQuery(['cat', f, p], async()=>{
    const q = new URLSearchParams()
    q.set('page',p);q.set('perPage',PER_PAGE)
    if(f.genre)q.append('genre',f.genre)
    if(f.format)q.append('format',f.format)
    if(f.status)q.append('status',f.status)
    if(f.season)q.set('season',f.season)
    if(f.year)q.set('year',f.year)
    if(f.sort)q.set('sort',f.sort)
    if(f.search)q.set('search',f.search)
    const {data} = await axios.get(`${API_BASE}/api/v1/browse?${q}`)
    return data
  },{keepPreviousData:true,staleTime:30000})
}

function Pg({cur,last,go}){
  if(last<=1)return null
  const p=[1],s=Math.max(2,cur-2),e=Math.min(last-1,cur+2)
  if(s>2)p.push('…')
  for(let i=s;i<=e;i++)p.push(i)
  if(e<last-1)p.push('…')
  if(last>1)p.push(last)
  return (
    <Pager>
      <PBtn disabled={cur<=1} onClick={()=>go(cur-1)}>Prev</PBtn>
      {p.map((x,i)=>x==='…'?<span key={i} style={{color:'var(--text-muted)',fontSize:13}}>…</span>:<PBtn key={x} $on={x===cur} onClick={()=>go(x)}>{x}</PBtn>)}
      <PBtn disabled={cur>=last} onClick={()=>go(cur+1)}>Next</PBtn>
    </Pager>
  )
}

function ACard({a}:{a:any}){
  const t=a.title?.english||a.title?.romaji||a.title?.userPreferred||'Unknown'
  return (
    <Card to={`/anime/${a.id}`}>
      <Poster>
        {a.coverImage?.large?<PosterImg src={a.coverImage.large} alt={t} loading="lazy"/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#555',fontSize:11}}>No Image</div>}
        {a.averageScore&&<Badge $tr $bg="rgba(0,0,0,0.75)">{a.averageScore}%</Badge>}
        {a.format&&<Badge $bg="rgba(99,102,241,0.85)">{a.format.replace('_',' ')}</Badge>}
      </Poster>
      <Info>
        <CardTitle>{t}</CardTitle>
        <Tags>
          {a.season&&a.seasonYear&&<Tag>{a.season} {a.seasonYear}</Tag>}
          {a.episodes&&<Tag>{a.episodes} ep</Tag>}
        </Tags>
      </Info>
    </Card>
  )
}

const Skel = ()=>(
  <Grid>
    {Array.from({length:12}).map((_,i)=>(
      <div key={i}>
        <div style={{borderRadius:10,background:'var(--bg-card)',aspectRatio:'2/3',animation:'pulse 1.5s infinite'}}/>
        <div style={{marginTop:8,height:12,background:'var(--bg-card)',borderRadius:4,animation:'pulse 1.5s infinite'}}/>
        <div style={{marginTop:5,height:10,background:'var(--bg-card)',borderRadius:4,width:'60%',animation:'pulse 1.5s infinite'}}/>
      </div>
    ))}
  </Grid>
)

export default function Catalog(){
  const [sp,ss]= useSearchParams()
  const [q,sq]= useState(sp.get('search')||'')
  const [vw,sv]= useState('grid')
  const [foc,sf]= useState(false)
  const [sc,sSc]= useState(false)
  const ref= useRef(null)
  const mob= !useMediaQuery('(min-width:768px)')
  const db= useDebounce(q,200)

  useEffect(()=>{const h=()=>sSc(window.scrollY>400);window.addEventListener('scroll',h,{passive:true});return ()=>window.removeEventListener('scroll',h)},[])
  useEffect(()=>{const h=e=>{if(e.key==='Escape')sf(false)};document.addEventListener('keydown',h);return ()=>document.removeEventListener('keydown',h)},[])
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))sf(false)};document.addEventListener('mousedown',h);return ()=>document.removeEventListener('mousedown',h)},[])

  const f= useMemo(()=>({
    genre: sp.get('genre')||'', format: sp.get('format')||'', status: sp.get('status')||'',
    season: sp.get('season')||'', year: sp.get('year')||'',
    sort: sp.get('sort')||'POPULARITY_DESC', search: db||'',
  }),[sp,db])

  const act= f.genre||f.format||f.status||f.season||f.year||f.search
  const pg= parseInt(sp.get('page')||'1',10)
  const {data, isLoading}= useBrowse(f, pg)
  const media= data?.media||[]
  const total= data?.pageInfo?.total||0
  const last= data?.pageInfo?.lastPage||1

  const set= useCallback((k,v)=>{ss(p=>{const n=new URLSearchParams(p);v?n.set(k,v):n.delete(k);n.set('page','1');return n})},[ss])
  const go= useCallback(p=>{ss(pv=>{const n=new URLSearchParams(pv);n.set('page',String(p));return n});window.scrollTo({top:0,behavior:'smooth'})},[ss])
  const clr= useCallback(()=>{sq('');ss({})},[ss])
  const load= isLoading&&pg===1

  return (
    <Page>
      <NavBar/>
      <Wrap>
        <Title>Browse Anime</Title>

        <Search $f={foc} ref={ref}>
          <FaSearch size={15} style={{color:'var(--text-muted)',flexShrink:0}}/>
          <Input
            value={q} onChange={e=>sq(e.target.value)}
            onFocus={()=>sf(true)}
            onKeyDown={e=>{if(e.key==='Enter'){sf(false);set('search',q)}}}
            placeholder='Search anime by title...'
          />
        </Search>

        <Bars>
          <Sel value={f.sort} onChange={e=>set('sort',e.target.value)}>
            {SORTS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
          </Sel>
          <Sel value={f.format} onChange={e=>set('format',e.target.value)}>
            <option value="">Format</option>
            {FORMATS.map(v=><option key={v} value={v}>{fmt(v)}</option>)}
          </Sel>
          <Sel value={f.status} onChange={e=>set('status',e.target.value)}>
            <option value="">Status</option>
            {STATUSES.map(v=><option key={v} value={v}>{fmt(v)}</option>)}
          </Sel>
          <Sel value={f.season} onChange={e=>set('season',e.target.value)}>
            <option value="">Season</option>
            {SEASONS.map(v=><option key={v} value={v}>{v}</option>)}
          </Sel>
          <Sel value={f.year} onChange={e=>set('year',e.target.value)}>
            <option value="">Year</option>
            {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
          </Sel>
          {!mob&&<ViewBtn onClick={()=>sv(v=>v==='grid'?'list':'grid')}>{vw==='grid'?<><FaList size={12}/> List</>:<><FaTh size={12}/> Grid</>}</ViewBtn>}
        </Bars>

        <Chips>
          {GENRES.map(g=><Chip key={g} $on={f.genre===g} onClick={()=>set('genre',f.genre===g?'':g)}>{g}</Chip>)}
          {act&&<ClearBtn onClick={clr}>Clear filters</ClearBtn>}
        </Chips>

        {act&&total>0&&!load&&<Meta><span>{total} result{total!==1?'s':''}</span></Meta>}

        {load?<Skel/>:media.length===0&&act?(
          <Empty>
            <p style={{fontSize:16,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>No results found</p>
            <p style={{fontSize:14,color:'var(--text-muted)',marginBottom:20}}>{f.search?`"${f.search}" not found`:'No match for current filters'}</p>
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={clr} style={{background:'var(--accent)',color:'#000',border:'none',borderRadius:999,padding:'10px 24px',fontSize:14,fontWeight:600,cursor:'pointer'}}>Clear Filters</button>
            </div>
          </Empty>
        ):media.length===0?null:vw==='grid'?(
          <>
            <Grid>{media.map(a=><ACard key={a.id} a={a}/>)}</Grid>
            {total>0&&<PageInfo>Page {pg} of {last}</PageInfo>}
            <Pg cur={pg} last={last} go={go}/>
          </>
        ):(
          <>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:'1rem'}}>
              {media.map(a=>{
                const t=a.title?.english||a.title?.romaji||a.title?.userPreferred||'Unknown'
                return (
                  <Link key={a.id} to={`/anime/${a.id}`} style={{
                    display:'flex',gap:12,background:'var(--bg-card)',border:'1px solid var(--border)',
                    borderRadius:10,padding:10,textDecoration:'none',color:'var(--text-primary)'
                  }}>
                    {a.coverImage?.large?<img src={a.coverImage.large} alt="" style={{width:56,height:80,objectFit:'cover',borderRadius:8,flexShrink:0}}/>:<div style={{width:56,height:80,background:'#222',borderRadius:8,flexShrink:0}}/>}
                    <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',justifyContent:'center',gap:4}}>
                      <p style={{fontWeight:600,fontSize:14}}>{t}</p>
                      <p style={{color:'var(--text-muted)',fontSize:12}}>{[a.format?fmt(a.format):'',a.averageScore?`${a.averageScore}%`:'',a.episodes?`${a.episodes} ep`:''].filter(Boolean).join(' · ')}</p>
                      {a.genres?.length>0&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:2}}>{a.genres.slice(0,3).map(g=><span key={g} style={{background:'var(--bg-elevated)',color:'var(--text-muted)',fontSize:10,padding:'2px 6px',borderRadius:3}}>{g}</span>)}</div>}
                    </div>
                  </Link>
                )
              })}
            </div>
            {total>0&&<PageInfo>Page {pg} of {last}</PageInfo>}
            <Pg cur={pg} last={last} go={go}/>
          </>
        )}
      </Wrap>
      <Footer/>
      <MobileBottomNav/>
      <div className="bottom-nav-spacer"/>
      <UpBtn $m={mob} $s={sc} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}><FaArrowUp size={18}/></UpBtn>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </Page>
  )
}
