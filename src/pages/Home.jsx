import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import {
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
  FaCalendarAlt,
  FaClock,
  FaPlay,
  FaStar,
  FaTv,
} from 'react-icons/fa'
import ContinueWatching from '../components/ContinueWatching'
import Footer from '../components/Footer/Footer'
import { useHomePageData } from '../hooks/useAnime'
import { filterAdult, useNsfw, useStreamable } from '../hooks/useNsfw'
import { setHomepageSEO } from '../lib/seo'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { anilistBatchDetail } from '../lib/anilist'
import { generateSlug } from '../lib/slug'
import { createHomeScheduleDays, groupHomeScheduleRows, initialPopulatedScheduleDayIndex } from '../lib/homeSchedule'
import { API_BASE } from '../config'

const Page = styled.main`
  min-height: 100vh;
  overflow: clip;
  background:
    radial-gradient(circle at 82% 11%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 34rem),
    var(--bg);
`

const Shell = styled.div`
  width: min(100%, 1440px);
  margin: 0 auto;
  padding: calc(var(--header-h) + 12px) var(--content-pad) clamp(30px, 5vw, 60px);

  @media (max-width: 640px) { padding-top: calc(var(--header-h) + 8px); }
`

const StatusStrip = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 36px;
  margin-bottom: 10px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--accent) 24%, var(--border));
  border-radius: 9px;
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-card));
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 720;

  svg { color: var(--accent); }
`

const Hero = styled.article`
  position: relative;
  display: grid;
  min-height: clamp(390px, 38vw, 500px);
  align-items: end;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--bg-elevated);
  isolation: isolate;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .26);

  &::before {
    position: absolute;
    inset: 0;
    z-index: -2;
    background: ${({ $image }) => $image ? `url(${$image}) center / cover no-repeat` : 'var(--bg-elevated)'};
    content: '';
    transform: scale(1.015);
  }

  &::after {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(90deg, rgba(7, 7, 9, .96) 0%, rgba(7, 7, 9, .85) 36%, rgba(7, 7, 9, .36) 68%, rgba(7, 7, 9, .16) 100%),
      linear-gradient(0deg, rgba(7, 7, 9, .9) 0%, rgba(7, 7, 9, .05) 65%);
    content: '';
  }

  @media (max-width: 680px) {
    min-height: 480px;
    &::before { background-position: center top; background-size: auto 100%; transform: none; }
    &::after { background: linear-gradient(0deg, rgba(7, 7, 9, .98) 0%, rgba(7, 7, 9, .82) 47%, rgba(7, 7, 9, .12) 100%); }
  }
`

const HeroCopy = styled.div`
  width: min(100%, 720px);
  padding: clamp(24px, 4vw, 54px);

  .status {
    display: inline-flex;
    min-height: 28px;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    border: 1px solid rgba(255,255,255,.17);
    border-radius: 8px;
    background: rgba(0,0,0,.3);
    color: rgba(255,255,255,.9);
    font-size: 10px;
    font-weight: 800;
  }

  .status svg { color: var(--accent); }

  h1 {
    display: -webkit-box;
    max-width: 22ch;
    margin: 16px 0 0;
    overflow: hidden;
    color: #fff;
    font-size: clamp(32px, 4.5vw, 56px);
    font-weight: 880;
    letter-spacing: -.065em;
    line-height: .93;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .summary {
    display: -webkit-box;
    max-width: 65ch;
    margin: 14px 0 0;
    overflow: hidden;
    color: rgba(255,255,255,.72);
    font-size: 13px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  @media (max-width: 680px) {
    padding: 20px;
    h1 { max-width: 16ch; font-size: clamp(29px, 8vw, 40px); }
    .summary { font-size: 12px; -webkit-line-clamp: 2; }
  }
`

const HeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 13px;

  span {
    display: inline-flex;
    min-height: 25px;
    align-items: center;
    gap: 5px;
    padding: 0 9px;
    border: 1px solid rgba(255,255,255,.15);
    border-radius: var(--radius-full);
    background: rgba(0,0,0,.26);
    color: rgba(255,255,255,.9);
    font-size: 10px;
    font-weight: 760;
  }
`

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 18px;
`

const HeroAction = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 15px;
  border: 1px solid ${({ $quiet }) => $quiet ? 'rgba(255,255,255,.18)' : 'var(--accent)'};
  border-radius: 8px;
  background: ${({ $quiet }) => $quiet ? 'rgba(0,0,0,.28)' : 'var(--accent)'};
  color: ${({ $quiet }) => $quiet ? '#fff' : 'var(--bg)'};
  font-size: 12px;
  font-weight: 850;
  text-decoration: none;
  transition: transform 160ms var(--ease-out, ease-out), background 160ms var(--ease-out, ease-out);

  &:hover { background: ${({ $quiet }) => $quiet ? 'rgba(255,255,255,.14)' : 'var(--accent-dim)'}; }
  &:active { transform: scale(.97); }
`

const HeroControls = styled.div`
  position: absolute;
  right: clamp(16px, 2.6vw, 28px);
  bottom: clamp(18px, 3vw, 30px);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2;

  span { min-width: 44px; color: rgba(255,255,255,.78); font-size: 10px; font-weight: 800; text-align: center; }
  button {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 8px;
    background: rgba(0,0,0,.32);
    color: #fff;
    cursor: pointer;
    transition: transform 150ms var(--ease-out, ease-out), background 150ms var(--ease-out, ease-out);
  }
  button:hover { background: rgba(255,255,255,.14); }
  button:active { transform: scale(.95); }

  @media (max-width: 680px) { top: 15px; right: 15px; bottom: auto; }
`

const GenreRail = styled.nav`
  display: flex;
  gap: 8px;
  margin: 12px -2px 0;
  overflow-x: auto;
  padding: 3px 2px 11px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  a {
    display: inline-flex;
    min-height: 31px;
    flex: 0 0 auto;
    align-items: center;
    padding: 0 11px;
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--bg-card) 88%, transparent);
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 760;
    text-decoration: none;
    transition: color 150ms var(--ease-out, ease-out), border-color 150ms var(--ease-out, ease-out), background 150ms var(--ease-out, ease-out), transform 150ms var(--ease-out, ease-out);
  }
  a:hover { border-color: color-mix(in srgb, var(--accent) 60%, var(--border)); background: var(--bg-elevated); color: var(--text-primary); }
  a:active { transform: scale(.97); }
`

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(275px, .37fr);
  align-items: start;
  gap: clamp(16px, 2vw, 28px);
  margin-top: clamp(22px, 3vw, 38px);

  @media (max-width: 980px) { grid-template-columns: 1fr; }
`

const Surface = styled.section`
  min-width: 0;
  padding: clamp(14px, 1.8vw, 22px);
  border: 1px solid var(--border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-card) 93%, transparent);
`

const SectionTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h2 { margin: 0; color: var(--text-primary); font-size: clamp(18px, 2vw, 24px); font-weight: 840; letter-spacing: -.045em; }
  a { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 11px; font-weight: 760; text-decoration: none; white-space: nowrap; }
  a:hover { color: var(--text-primary); }
`

const TabList = styled.div`
  display: flex;
  gap: 4px;
  overflow-x: auto;
  margin-bottom: 15px;
  padding-bottom: 2px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  button {
    min-height: 30px;
    flex: 0 0 auto;
    padding: 0 9px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .07em;
    text-transform: uppercase;
  }
  button[aria-selected='true'] { border-bottom-color: var(--accent); color: var(--text-primary); }
`

const PosterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(10px, 1.5vw, 15px);

  @media (max-width: 700px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 430px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`

const PosterCard = styled(Link)`
  min-width: 0;
  color: inherit;
  text-decoration: none;

  .art {
    position: relative;
    overflow: hidden;
    aspect-ratio: .68;
    border-radius: 9px;
    background: var(--bg-elevated);
  }
  .art::after { position: absolute; inset: 48% 0 0; background: linear-gradient(transparent, rgba(0,0,0,.72)); content: ''; pointer-events: none; }
  img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 240ms var(--ease-out, ease-out); }
  .score { position: absolute; right: 7px; bottom: 7px; z-index: 1; padding: 3px 5px; border-radius: 5px; background: rgba(0,0,0,.6); color: #fff; font-size: 9px; font-weight: 820; }
  h3 { margin: 7px 1px 3px; overflow: hidden; color: var(--text-primary); font-size: 12px; font-weight: 790; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 0 1px; overflow: hidden; color: var(--text-muted); font-size: 9px; font-weight: 740; text-overflow: ellipsis; white-space: nowrap; }
  &:hover img { transform: scale(1.05); }
  &:hover h3 { color: var(--accent); }
  &:active { transform: scale(.98); }
`

const ListStack = styled.div`
  display: grid;
  gap: 7px;
`

const ListItem = styled(Link)`
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  min-height: 64px;
  padding: 7px;
  border: 1px solid transparent;
  border-radius: 9px;
  color: inherit;
  text-decoration: none;
  transition: background 150ms var(--ease-out, ease-out), border-color 150ms var(--ease-out, ease-out), transform 150ms var(--ease-out, ease-out);

  img { width: 42px; height: 56px; border-radius: 5px; background: var(--bg-elevated); object-fit: cover; }
  h3 { margin: 2px 0 5px; overflow: hidden; color: var(--text-primary); font-size: 11px; font-weight: 790; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 0; color: var(--text-muted); font-size: 9px; font-weight: 720; }
  .live { display: inline-flex; align-items: center; gap: 5px; color: var(--text-secondary); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  &:hover { border-color: var(--border); background: var(--bg-elevated); transform: translateX(2px); }
`

const SubGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(12px, 1.8vw, 22px);
  margin-top: clamp(16px, 2.2vw, 28px);

  @media (max-width: 950px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`

const MiniPanel = styled(Surface)`
  padding: 14px;
  .panel-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 11px; }
  h2 { margin: 0; color: var(--text-primary); font-size: 14px; font-weight: 830; letter-spacing: -.02em; }
  a.more { color: var(--text-muted); font-size: 10px; font-weight: 760; text-decoration: none; }
  a.more:hover { color: var(--accent); }
`

const ScheduleSection = styled.section`
  margin-top: clamp(16px, 2.2vw, 28px);
  padding: clamp(16px, 2.2vw, 28px);
  border: 1px solid var(--border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-card) 93%, transparent);
`

const ScheduleHeading = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 15px;

  p { display: flex; align-items: center; gap: 7px; margin: 0 0 5px; color: var(--accent); font-size: 10px; font-weight: 840; letter-spacing: .11em; text-transform: uppercase; }
  h2 { margin: 0; color: var(--text-primary); font-size: clamp(20px, 2.5vw, 28px); font-weight: 850; letter-spacing: -.055em; }
  a { display: inline-flex; align-items: center; gap: 7px; color: var(--text-secondary); font-size: 11px; font-weight: 760; text-decoration: none; white-space: nowrap; }
  a:hover { color: var(--text-primary); }
`

const ScheduleDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 9px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  button {
    display: grid;
    min-width: 76px;
    min-height: 44px;
    place-items: center;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 10px;
    font-weight: 750;
    transition: background 150ms var(--ease-out, ease-out), color 150ms var(--ease-out, ease-out), transform 150ms var(--ease-out, ease-out);
  }
  button:hover { background: var(--bg-elevated); color: var(--text-primary); }
  button:active { transform: scale(.97); }
  button[aria-pressed='true'] { background: var(--accent); color: var(--bg); font-weight: 860; }
`

const EpisodeFeed = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 820px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`

const EpisodeItem = styled(Link)`
  display: grid;
  grid-template-columns: 45px minmax(0, 1fr) auto;
  gap: 9px;
  min-width: 0;
  align-items: center;
  padding: 7px;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  transition: background 150ms var(--ease-out, ease-out), transform 150ms var(--ease-out, ease-out);

  img { width: 45px; height: 58px; border-radius: 5px; background: var(--bg-elevated); object-fit: cover; }
  h3 { margin: 0; overflow: hidden; color: var(--text-primary); font-size: 11px; font-weight: 770; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 4px 0 0; color: var(--text-muted); font-size: 9px; font-weight: 720; }
  span { padding: 4px 5px; border: 1px solid var(--border); border-radius: 5px; color: var(--text-secondary); font-size: 9px; font-weight: 820; white-space: nowrap; }
  &:hover { background: var(--bg-elevated); transform: translateY(-1px); }
`

const ScheduleEmpty = styled.p`
  display: grid;
  min-height: 88px;
  margin: 0;
  place-items: center;
  border: 1px dashed var(--border);
  border-radius: 9px;
  color: var(--text-muted);
  font-size: 12px;
`

const EmptyHero = styled.div`
  display: grid;
  min-height: 430px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 13px;
`

const titleFor = (item) => item?.title?.english || item?.title?.romaji || item?.title?.userPreferred || 'Unknown title'
const bannerFor = (item) => item?.bannerImage || item?.coverImage?.extraLarge || item?.coverImage?.large || ''
const posterFor = (item) => item?.coverImage?.extraLarge || item?.coverImage?.large || item?.coverImage?.medium || ''
const mediaKey = (item) => {
  const id = Number(item?.id)
  return Number.isInteger(id) && id > 0 ? `media:${id}` : `media:${titleFor(item)}`
}
const uniqueMedia = (items) => {
  const seen = new Set()
  return (Array.isArray(items) ? items : []).filter((item) => {
    const key = mediaKey(item)
    if (!item?.id || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
const detailHref = (item) => `/anime/${generateSlug(titleFor(item))}-${item.id}`
const watchHref = (item) => `/watch/${generateSlug(titleFor(item))}-${item.id}-episode-1`
const stripHtml = (text = '') => text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const mediaMeta = (item) => `${item?.format || 'TV'}${item?.episodes ? ` · ${item.episodes} eps` : ''}${item?.averageScore ? ` · ${item.averageScore}%` : ''}`

function PosterCollection({ items, limit = 12 }) {
  return (
    <PosterGrid>
      {items.slice(0, limit).map((item) => (
        <PosterCard key={mediaKey(item)} to={detailHref(item)} title={`Open ${titleFor(item)}`}>
          <div className="art">
            <img src={posterFor(item)} alt="" loading="lazy" />
            {item.averageScore && <span className="score">{item.averageScore}</span>}
          </div>
          <h3>{titleFor(item)}</h3>
          <p>{mediaMeta(item)}</p>
        </PosterCard>
      ))}
    </PosterGrid>
  )
}

function CompactList({ items, label, emptyLabel = 'More titles will appear here shortly.' }) {
  return (
    <ListStack>
      {items.slice(0, 6).map((item) => (
        <ListItem key={mediaKey(item)} to={detailHref(item)} title={`Open ${titleFor(item)}`}>
          <img src={posterFor(item)} alt="" loading="lazy" />
          <div>
            <h3>{titleFor(item)}</h3>
            <p className="live"><span className="dot" />{label === 'Airing' && item?.nextAiringEpisode?.episode ? `Episode ${item.nextAiringEpisode.episode} next` : label === 'Airing' ? 'Airing now' : mediaMeta(item)}</p>
          </div>
        </ListItem>
      ))}
      {!items.length && <p style={{ margin: '8px 0', color: 'var(--text-muted)', fontSize: '11px' }}>{emptyLabel}</p>}
    </ListStack>
  )
}

function Home() {
  const { data: homeData = {}, isFetched: homeDone } = useHomePageData()
  const { trending = [], airing = [], upcoming = [], movies = [], finished = [], topTV = [], schedule = [] } = homeData
  const { user } = useAuth()
  const { nsfwEnabled } = useNsfw()
  const trendingList = useStreamable(filterAdult(trending, nsfwEnabled))
  const airingList = useStreamable(filterAdult(airing, nsfwEnabled))
  const unreleasedList = useStreamable(filterAdult(upcoming, nsfwEnabled))
  const moviesList = useStreamable(filterAdult(movies, nsfwEnabled))
  const tvList = useStreamable(filterAdult(topTV, nsfwEnabled))
  const finishedList = useStreamable(filterAdult(finished, nsfwEnabled)).slice(0, 6)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('newest')
  const [activeScheduleDay, setActiveScheduleDay] = useState(0)
  const initialScheduleDaySet = useRef(false)
  const userSelectedScheduleDay = useRef(false)

  const heroItems = useMemo(() => uniqueMedia([...trendingList, ...airingList]).slice(0, 8), [trendingList, airingList])
  const featured = heroItems[featuredIndex] || null
  // Featured rotation affects only the hero. Discovery and supporting shelves
  // retain stable item order and identity so titles, art, keys, and links
  // never appear to swap as the hero advances.
  const upcomingList = useMemo(() => uniqueMedia(unreleasedList)
    .filter((item) => item?.status === 'NOT_YET_RELEASED')
    .slice(0, 6), [unreleasedList])
  const freshAiring = useMemo(() => uniqueMedia(airingList), [airingList])
  const popularItems = useMemo(() => uniqueMedia([...trendingList, ...moviesList]), [trendingList, moviesList])
  const topItems = useMemo(() => uniqueMedia(tvList), [tvList])
  const primaryItems = activeTab === 'popular' ? popularItems : activeTab === 'top' ? topItems : freshAiring
  useEffect(() => { setHomepageSEO() }, [])
  useEffect(() => { setFeaturedIndex((index) => heroItems.length ? index % heroItems.length : 0) }, [heroItems.length])
  useEffect(() => {
    if (heroItems.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const rotation = window.setInterval(() => setFeaturedIndex((index) => (index + 1) % heroItems.length), 8500)
    return () => window.clearInterval(rotation)
  }, [heroItems.length])

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    const checkForNewEpisodes = async () => {
      let bookmarks = []
      try { bookmarks = JSON.parse(localStorage.getItem('aniraku-bookmarks') || '[]') } catch { /* stale storage is non-fatal */ }
      try {
        const { data } = await supabase.from('bookmarks').select('anime_id,title').eq('user_id', user.id)
        if (data?.length) bookmarks = data.map((bookmark) => ({ id: bookmark.anime_id, title: bookmark.title }))
      } catch { /* server bookmarks are optional for this notification */ }
      if (!bookmarks.length || cancelled) return
      let lastKnown = {}
      try { lastKnown = JSON.parse(localStorage.getItem('aniraku-episode-track') || '{}') || {} } catch { /* stale storage is non-fatal */ }
      const now = Date.now()
      const toCheck = bookmarks.filter((bookmark) => !lastKnown[bookmark.id] || now - lastKnown[bookmark.id].t >= 21600000)
      if (toCheck.length) {
        const idsToFetch = toCheck.map((b) => b.id)
        const batchResult = await anilistBatchDetail(idsToFetch)
        for (const bookmark of toCheck) {
          if (cancelled) return
          const media = batchResult[bookmark.id]
          if (!media || media.status !== 'RELEASING') continue
          const episode = media.nextAiringEpisode?.episode ? media.nextAiringEpisode.episode - 1 : (media.episodes || 0)
          if (episode <= (lastKnown[bookmark.id]?.e || 0)) continue
          fetch(`${API_BASE}/api/v1/anime/${bookmark.id}/episodes`)
            .then((response) => response.ok ? response.json() : Promise.reject())
            .then(async (payload) => {
              const episodes = Array.isArray(payload) ? payload : payload?.episodes
              const hasEpisode = Array.isArray(episodes) && episodes.some((item, index) => Number(item?.number ?? index + 1) === episode)
              if (!hasEpisode || cancelled) return
              const message = `Episode ${episode} of ${bookmark.title} is now available`
              const { data: existing, error: lookupError } = await supabase.from('notifications').select('id').eq('user_id', user.id).eq('type', 'new_episode').eq('anime_id', bookmark.id).eq('message', message).limit(1).maybeSingle()
              if (cancelled || lookupError || existing) return
              lastKnown[bookmark.id] = { e: episode, t: now }
              localStorage.setItem('aniraku-episode-track', JSON.stringify(lastKnown))
              const { error: insertError } = await supabase.from('notifications').insert({ user_id: user.id, type: 'new_episode', message, anime_id: bookmark.id })
              if (insertError && insertError.code !== '23505') return
            })
            .catch(() => {})
        }
      }
    }
    checkForNewEpisodes()
    return () => { cancelled = true }
  }, [user])

  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']
  const days = useMemo(() => createHomeScheduleDays(), [])
  const scheduleRowsByDay = useMemo(() => groupHomeScheduleRows(schedule, days, featured?.id), [schedule, days, featured?.id])
  useEffect(() => {
    if (initialScheduleDaySet.current || userSelectedScheduleDay.current || !schedule.length) return
    const nextDay = initialPopulatedScheduleDayIndex(scheduleRowsByDay)
    if (nextDay !== activeScheduleDay) setActiveScheduleDay(nextDay)
    initialScheduleDaySet.current = true
  }, [activeScheduleDay, schedule.length, scheduleRowsByDay])
  const selectedSchedule = scheduleRowsByDay[activeScheduleDay] || []

  return (
    <>
      <Page>
        <Shell>
          <StatusStrip><FaBolt size={10} /> Browse trending series, movies, and the latest Aniraku schedule in one place.</StatusStrip>
          {!homeDone ? <EmptyHero>Finding something to watch.</EmptyHero> : featured ? (
            <Hero key={featured.id} $image={bannerFor(featured)}>
              <HeroCopy>
                <span className="status"><FaClock size={9} /> {featured?.nextAiringEpisode?.episode ? `Episode ${featured.nextAiringEpisode.episode} next` : 'Featured now'}</span>
                <h1>{titleFor(featured)}</h1>
                <HeroMeta>
                  {featured.format && <span><FaTv size={9} /> {featured.format}</span>}
                  {featured.episodes && <span>{featured.episodes} episodes</span>}
                  {featured.averageScore && <span><FaStar size={9} /> {featured.averageScore}</span>}
                  <span><FaClock size={9} /> 24 mins</span>
                </HeroMeta>
                {stripHtml(featured.description) && <p className="summary">{stripHtml(featured.description)}</p>}
                <HeroActions>
                  <HeroAction $quiet to={detailHref(featured)}>Details <FaArrowRight size={10} /></HeroAction>
                  <HeroAction to={watchHref(featured)}><FaPlay size={10} /> Watch now</HeroAction>
                </HeroActions>
              </HeroCopy>
              <HeroControls aria-label="Featured anime controls">
                <button type="button" aria-label="Previous featured title" onClick={() => setFeaturedIndex((current) => (current - 1 + heroItems.length) % heroItems.length)}><FaArrowLeft size={10} /></button>
                <span>{featuredIndex + 1} / {heroItems.length}</span>
                <button type="button" aria-label="Next featured title" onClick={() => setFeaturedIndex((current) => (current + 1) % heroItems.length)}><FaArrowRight size={10} /></button>
              </HeroControls>
            </Hero>
          ) : <EmptyHero>Trending metadata is temporarily unavailable. Please try again shortly.</EmptyHero>}

          <GenreRail aria-label="Browse genres">
            {genres.map((genre) => <Link key={genre} to={`/catalog?genre=${encodeURIComponent(genre)}`}>{genre}</Link>)}
          </GenreRail>

          <ContentGrid>
            <Surface aria-label="Browse anime">
              <SectionTop><h2>Discover anime</h2><Link to="/catalog">View all <FaArrowRight size={10} /></Link></SectionTop>
              <TabList role="tablist" aria-label="Anime collection">
                <button type="button" role="tab" aria-selected={activeTab === 'newest'} onClick={() => setActiveTab('newest')}>Newest</button>
                <button type="button" role="tab" aria-selected={activeTab === 'popular'} onClick={() => setActiveTab('popular')}>Popular</button>
                <button type="button" role="tab" aria-selected={activeTab === 'top'} onClick={() => setActiveTab('top')}>Top rated</button>
              </TabList>
              <PosterCollection items={primaryItems} />
            </Surface>

            <Surface aria-label="Top airing anime">
              <SectionTop><h2>Top airing</h2><Link to="/catalog?status=RELEASING">All <FaArrowRight size={10} /></Link></SectionTop>
              <CompactList items={freshAiring} label="Airing" />
            </Surface>
          </ContentGrid>

          <SubGrid>
            <MiniPanel aria-label="Recently completed anime">
              <div className="panel-title"><h2>Just finished</h2><Link className="more" to="/catalog?status=FINISHED">More</Link></div>
              <CompactList items={finishedList} label="Finished" />
            </MiniPanel>
            <MiniPanel aria-label="Top anime movies">
              <div className="panel-title"><h2>Top movies</h2><Link className="more" to="/catalog?format=MOVIE">More</Link></div>
              <CompactList items={moviesList} label="Movie" />
            </MiniPanel>
            <MiniPanel aria-label="Upcoming anime">
              <div className="panel-title"><h2>Upcoming</h2><Link className="more" to="/catalog?status=NOT_YET_RELEASED">More</Link></div>
              <CompactList items={upcomingList} label="Upcoming" />
            </MiniPanel>
          </SubGrid>

          <ContinueWatching />

          <ScheduleSection aria-label="Airing schedule">
            <ScheduleHeading>
              <div><p><FaCalendarAlt size={10} /> Airing schedule</p><h2>Keep up with every episode.</h2></div>
              <Link to="/schedule">Full schedule <FaArrowRight size={10} /></Link>
            </ScheduleHeading>
            <ScheduleDays aria-label="Upcoming days">
              {days.map((day, index) => (
                <button
                  key={day.key}
                  type="button"
                  aria-pressed={index === activeScheduleDay}
                  aria-label={`Show releases for ${index === 0 ? 'today' : day.date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}`}
                  onClick={() => {
                    userSelectedScheduleDay.current = true
                    setActiveScheduleDay(index)
                  }}
                >
                  {day.label}
                </button>
              ))}
            </ScheduleDays>
            <EpisodeFeed>
              {selectedSchedule.map((item) => (
                <EpisodeItem key={item.id} to={detailHref(item)} title={`Open ${titleFor(item)}`}>
                  <img src={posterFor(item)} alt="" loading="lazy" />
                  <div><h3>{titleFor(item)}</h3><p>{item?.nextAiringEpisode?.airingAt ? new Date(item.nextAiringEpisode.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Upcoming'}</p></div>
                  <span>EP {item?.nextAiringEpisode?.episode || '?'}</span>
                </EpisodeItem>
              ))}
            </EpisodeFeed>
            {!selectedSchedule.length && <ScheduleEmpty>No scheduled releases for this day.</ScheduleEmpty>}
          </ScheduleSection>
        </Shell>
      </Page>
      <Footer compact />
      <div className="bottom-nav-spacer" />
    </>
  )
}

export default Home
