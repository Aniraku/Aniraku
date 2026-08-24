import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import {
  FaArrowRight,
  FaBolt,
  FaClock,
  FaFilm,
  FaFire,
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
import { getAnimeMetadata } from '../lib/anirakuMetadata'
import { generateSlug } from '../lib/slug'

const Page = styled.main`
  min-height: 100vh;
  overflow: clip;
  background:
    radial-gradient(circle at 8% 16%, color-mix(in srgb, var(--accent) 11%, transparent), transparent 24rem),
    radial-gradient(circle at 94% 38%, rgba(125, 92, 232, 0.11), transparent 30rem),
    var(--bg);
`

const Shell = styled.div`
  width: min(100%, 1480px);
  margin: 0 auto;
  padding: calc(var(--header-h) + clamp(8px, 1.6vw, 20px)) var(--content-pad) clamp(36px, 5vw, 68px);

  @media (max-width: 640px) { padding-top: calc(var(--header-h) + 8px); }
`

const Hero = styled.article`
  position: relative;
  display: flex;
  min-height: clamp(360px, 38vw, 500px);
  align-items: flex-end;
  overflow: hidden;
  border-radius: clamp(18px, 2.4vw, 30px);
  background: var(--bg-elevated);
  box-shadow: 0 20px 70px rgba(0,0,0,0.3);
  isolation: isolate;

  &::before {
    position: absolute;
    inset: 0;
    z-index: -2;
    background-image: ${({ $image }) => $image ? `url(${$image})` : 'none'};
    background-position: center;
    background-size: cover;
    content: '';
    transform: scale(1.025);
  }

  &::after {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(90deg, rgba(6,6,8,0.96) 0%, rgba(6,6,8,0.83) 38%, rgba(6,6,8,0.28) 72%, rgba(6,6,8,0.16) 100%),
      linear-gradient(0deg, rgba(6,6,8,0.94) 0%, transparent 62%);
    content: '';
  }

  @media (max-width: 680px) {
    min-height: clamp(385px, 112vw, 445px);
    &::before {
      background-image: ${({ $mobileImage, $image }) => $mobileImage ? `url(${$mobileImage})` : ($image ? `url(${$image})` : 'none')};
      background-position: center top;
      background-size: auto 100%;
      background-repeat: no-repeat;
      transform: none;
    }
    &::after { background: linear-gradient(0deg, rgba(6,6,8,0.98) 0%, rgba(6,6,8,0.78) 48%, rgba(6,6,8,0.08) 100%); }
  }
`

const HeroCopy = styled.div`
  width: min(100%, 640px);
  padding: clamp(20px, 3.4vw, 44px);

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 14px;
    color: var(--accent);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  h1 {
    display: -webkit-box;
    max-width: min(100%, 16ch);
    margin: 0;
    overflow: hidden;
    color: #fff;
    font-size: clamp(32px, 4.8vw, 56px);
    font-weight: 880;
    letter-spacing: -0.065em;
    line-height: 0.92;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .summary {
    display: -webkit-box;
    max-width: 61ch;
    margin: 12px 0 0;
    overflow: hidden;
    color: rgba(255,255,255,0.75);
    font-size: 13px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  @media (max-width: 680px) {
    padding: 18px;
    h1 { max-width: min(100%, 15ch); font-size: clamp(27px, 8vw, 34px); -webkit-line-clamp: 3; }
    .summary { font-size: 12px; -webkit-line-clamp: 2; }
  }
`

const HeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;

  span {
    display: inline-flex;
    min-height: 26px;
    align-items: center;
    gap: 5px;
    padding: 0 9px;
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: var(--radius-full);
    background: rgba(0,0,0,0.32);
    color: rgba(255,255,255,0.9);
    font-size: 10px;
    font-weight: 760;
  }
  svg { color: var(--accent); }
`

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 16px;
`

const HeroAction = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid ${({ $secondary }) => ($secondary ? 'rgba(255,255,255,0.2)' : 'var(--accent)')};
  border-radius: 9px;
  background: ${({ $secondary }) => ($secondary ? 'rgba(0,0,0,0.24)' : 'var(--accent)')};
  color: ${({ $secondary }) => ($secondary ? '#fff' : 'var(--bg)')};
  font-size: 12px;
  font-weight: 850;
  text-decoration: none;
  transition: transform 160ms var(--ease-out, ease-out), background 160ms var(--ease-out, ease-out);
  &:hover { background: ${({ $secondary }) => ($secondary ? 'rgba(255,255,255,0.14)' : 'var(--accent-dim)')}; }
  &:active { transform: scale(0.97); }

  @media (max-width: 430px) {
    flex: 1 1 calc(50% - 5px);
    &:first-child { flex-basis: 100%; }
  }
`

const Section = styled.section`
  margin-top: clamp(26px, 3.7vw, 48px);
`

const SectionHeading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;

  .eyebrow { display: flex; align-items: center; gap: 7px; margin: 0 0 6px; color: var(--accent); font-size: 10px; font-weight: 850; letter-spacing: 0.14em; text-transform: uppercase; }
  h2 { margin: 0; color: var(--text-primary); font-size: clamp(23px, 2.6vw, 32px); font-weight: 840; letter-spacing: -0.055em; line-height: 0.98; }
  p { margin: 7px 0 0; color: var(--text-muted); font-size: 12px; }
  a { display: inline-flex; align-items: center; gap: 7px; color: var(--text-secondary); font-size: 12px; font-weight: 780; text-decoration: none; white-space: nowrap; }
  a:hover { color: var(--text-primary); }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 13px;
    h2 { font-size: 25px; }
  }
`

const PosterRail = styled.div`
  display: grid;
  grid-auto-columns: minmax(146px, 1fr);
  grid-auto-flow: column;
  gap: 13px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  padding: 2px 0 14px;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }

  @media (min-width: 900px) { grid-auto-columns: minmax(158px, 1fr); }
  @media (max-width: 560px) { grid-auto-columns: minmax(120px, 39vw); gap: 10px; }
`

const PosterCard = styled(Link)`
  min-width: 0;
  color: inherit;
  scroll-snap-align: start;
  text-decoration: none;

  .poster {
    position: relative;
    overflow: hidden;
    aspect-ratio: 0.69;
    border-radius: 12px;
    background: var(--bg-elevated);
    box-shadow: 0 10px 28px rgba(0,0,0,0.16);
  }
  .poster::after { position: absolute; inset: 45% 0 0; background: linear-gradient(transparent, rgba(0,0,0,0.58)); content: ''; pointer-events: none; }
  img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 260ms var(--ease-out, ease-out); }
  h3 { margin: 9px 2px 3px; overflow: hidden; color: var(--text-primary); font-size: 13px; font-weight: 790; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 0 2px; overflow: hidden; color: var(--text-muted); font-size: 10px; font-weight: 740; text-overflow: ellipsis; white-space: nowrap; }
  &:hover img { transform: scale(1.045); }
  &:hover h3 { color: var(--accent); }
  &:active { transform: scale(0.98); }
`

const PosterBadge = styled.span`
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 1;
  padding: 4px 6px;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 6px;
  background: rgba(0,0,0,0.56);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
`

const SchedulePanel = styled.section`
  display: grid;
  grid-template-columns: minmax(170px, 0.36fr) minmax(0, 1fr);
  gap: clamp(18px, 3vw, 44px);
  align-items: start;
  margin-top: clamp(26px, 3.7vw, 48px);
  padding-top: clamp(20px, 2.5vw, 30px);
  border-top: 1px solid var(--border);

  @media (max-width: 860px) { grid-template-columns: 1fr; gap: 18px; }
`

const ScheduleIntro = styled.div`
  .eyebrow { display: flex; align-items: center; gap: 7px; margin: 0 0 7px; color: var(--accent); font-size: 10px; font-weight: 850; letter-spacing: 0.14em; text-transform: uppercase; }
  h2 { max-width: 10ch; margin: 0; color: var(--text-primary); font-size: clamp(25px, 2.8vw, 34px); font-weight: 850; letter-spacing: -0.06em; line-height: 0.95; }
  p { margin: 9px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
  a { display: inline-flex; align-items: center; gap: 7px; margin-top: 12px; color: var(--text-primary); font-size: 12px; font-weight: 800; text-decoration: none; }
  a:hover { color: var(--accent); }
`

const ScheduleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  @media (max-width: 670px) { grid-template-columns: 1fr; }
`

const ScheduleItem = styled(Link)`
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 10px;
  min-height: 88px;
  padding: 9px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: color-mix(in srgb, var(--bg-card) 90%, transparent);
  color: inherit;
  text-decoration: none;
  transition: transform 160ms var(--ease-out, ease-out), border-color 160ms var(--ease-out, ease-out), background 160ms var(--ease-out, ease-out);

  img { width: 46px; height: 64px; border-radius: 6px; object-fit: cover; background: var(--bg-elevated); }
  h3 { margin: 2px 0 0; overflow: hidden; color: var(--text-primary); font-size: 12px; font-weight: 780; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 6px 0 0; color: var(--text-muted); font-size: 10px; }
  strong { display: block; margin-top: 7px; color: var(--accent); font-size: 10px; font-weight: 850; }
  &:hover { transform: translateY(-2px); border-color: var(--border-hover); background: var(--bg-elevated); }
  &:active { transform: scale(0.985); }
`

const PersonalSection = styled.section`
  margin-top: clamp(26px, 3.7vw, 48px);
`

const FeatureGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: clamp(22px, 4vw, 58px);
  margin-top: clamp(26px, 3.7vw, 48px);

  @media (max-width: 920px) { grid-template-columns: 1fr; }
`

const MovieFeature = styled.section`
  position: relative;
  overflow: hidden;
  min-height: 100%;
  padding: clamp(22px, 3.5vw, 40px);
  border: 1px solid var(--border);
  border-radius: 18px;
  background:
    radial-gradient(circle at 100% 0%, rgba(125,92,232,0.2), transparent 16rem),
    var(--bg-card);

  h2 { max-width: 10ch; margin: 8px 0 0; color: var(--text-primary); font-size: clamp(30px, 3.4vw, 46px); font-weight: 850; letter-spacing: -0.06em; line-height: 0.94; }
  > p { max-width: 38ch; margin: 14px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.55; }
  .eyebrow { display: flex; align-items: center; gap: 7px; margin: 0; color: var(--accent); font-size: 10px; font-weight: 850; letter-spacing: 0.14em; text-transform: uppercase; }
`

const MovieStack = styled.div`
  display: grid;
  gap: 9px;
  margin-top: 24px;
`

const MovieItem = styled(Link)`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
  color: inherit;
  text-decoration: none;
  &:last-child { border-bottom: 0; }
  img { width: 32px; height: 42px; border-radius: 5px; object-fit: cover; background: var(--bg-elevated); }
  h3 { margin: 0; overflow: hidden; color: var(--text-primary); font-size: 12px; font-weight: 760; text-overflow: ellipsis; white-space: nowrap; }
  span { color: var(--text-muted); font-size: 10px; font-weight: 750; }
  &:hover h3 { color: var(--accent); }
`

const MoodPanel = styled.section`
  margin-top: clamp(26px, 3.7vw, 48px);
  padding-top: 20px;
  border-top: 1px solid var(--border);
  .label { margin: 0 0 12px; color: var(--text-secondary); font-size: 12px; font-weight: 780; }
`

const MoodLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const MoodLink = styled(Link)`
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 760;
  text-decoration: none;
  transition: transform 160ms var(--ease-out, ease-out), color 160ms var(--ease-out, ease-out), border-color 160ms var(--ease-out, ease-out), background 160ms var(--ease-out, ease-out);
  &:hover { border-color: var(--accent); background: var(--bg-elevated); color: var(--text-primary); }
  &:active { transform: scale(0.97); }
`

const EmptyHero = styled.div`
  min-height: clamp(360px, 38vw, 500px);
  display: grid;
  place-items: center;
  padding: 28px;
  border-radius: clamp(18px, 2.4vw, 30px);
  background: linear-gradient(110deg, var(--bg-card) 28%, var(--bg-elevated) 42%, var(--bg-card) 55%);
  background-size: 220% 100%;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
  animation: homeShimmer 1.35s linear infinite;
  @keyframes homeShimmer { to { background-position: -220% 0; } }
`

const titleFor = (item) => item?.title?.english || item?.title?.romaji || item?.title?.userPreferred || 'Unknown title'
const imageFor = (item) => item?.bannerImage || item?.coverImage?.extraLarge || item?.coverImage?.large || ''
const posterFor = (item) => item?.coverImage?.extraLarge || item?.coverImage?.large || item?.coverImage?.medium || ''
const detailHref = (item) => `/anime/${generateSlug(titleFor(item))}-${item.id}`
const watchHref = (item) => `/watch/${generateSlug(titleFor(item))}-${item.id}-episode-1`
const stripHtml = (text = '') => text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const mediaSummary = (item) => item?.format === 'MOVIE'
  ? 'Movie'
  : `${item?.format || 'Anime'}${item?.episodes ? ` · ${item.episodes} eps` : ''}`
const releaseTiming = (timestamp) => {
  if (!timestamp) return null
  const release = new Date(timestamp * 1000)
  const now = new Date()
  const releaseDay = new Date(release.getFullYear(), release.getMonth(), release.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysAway = Math.round((releaseDay - today) / 86400000)
  const relative = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : daysAway > 1 ? `In ${daysAway} days` : 'Recently aired'
  const stamp = `${release.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${release.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  return { relative, stamp }
}

function PosterRailSection({ items, meta }) {
  return (
    <PosterRail>
      {items.slice(0, 14).map((item) => (
        <PosterCard key={item.id} to={detailHref(item)} title={`Open ${titleFor(item)}`}>
          <div className="poster">
            <img src={posterFor(item)} alt="" loading="lazy" />
            {item.averageScore && <PosterBadge>{item.averageScore}%</PosterBadge>}
          </div>
          <h3>{titleFor(item)}</h3>
          <p>{meta(item)}</p>
        </PosterCard>
      ))}
    </PosterRail>
  )
}

function Home() {
  const { data: homeData = {}, isFetched: homeDone } = useHomePageData()
  const { trending = [], airing = [], movies = [], topTV = [] } = homeData
  const { user } = useAuth()
  const { nsfwEnabled } = useNsfw()
  const trendingList = useStreamable(filterAdult(trending, nsfwEnabled))
  const airingList = useStreamable(filterAdult(airing, nsfwEnabled))
  const moviesList = useStreamable(filterAdult(movies, nsfwEnabled))
  const tvList = useStreamable(filterAdult(topTV, nsfwEnabled))
  const unifiedTrending = useMemo(() => [...trendingList, ...moviesList]
    .filter((item, index, list) => item?.id && list.findIndex((candidate) => candidate.id === item.id) === index), [trendingList, moviesList])
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const heroTrending = useMemo(() => unifiedTrending.slice(0, 10), [unifiedTrending])
  const featured = heroTrending[featuredIndex] || heroTrending[0] || airingList[0] || tvList[0] || null
  const freshAiring = useMemo(() => airingList.filter((item) => item?.id && item.id !== featured?.id).slice(0, 14), [airingList, featured])
  const scheduleItems = useMemo(() => airingList
    .filter((item) => item?.id && item.id !== featured?.id && Number(item?.nextAiringEpisode?.airingAt) * 1000 >= Date.now())
    .sort((a, b) => Number(a.nextAiringEpisode.airingAt) - Number(b.nextAiringEpisode.airingAt))
    .slice(0, 3), [airingList, featured])
  const weeklyFavorites = useMemo(() => [...tvList, ...trendingList]
    .filter((item, index, list) => item?.id && item.id !== featured?.id && list.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => (Number(b.averageScore) || 0) - (Number(a.averageScore) || 0))
    .slice(0, 14), [tvList, trendingList, featured])

  useEffect(() => { setHomepageSEO() }, [])

  useEffect(() => {
    setFeaturedIndex((index) => heroTrending.length ? index % heroTrending.length : 0)
  }, [heroTrending.length])

  useEffect(() => {
    if (heroTrending.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const rotation = window.setInterval(() => {
      setFeaturedIndex((index) => (index + 1) % heroTrending.length)
    }, 8500)
    return () => window.clearInterval(rotation)
  }, [heroTrending.length])

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    const checkForNewEpisodes = async () => {
      let bookmarks = []
      try { bookmarks = JSON.parse(localStorage.getItem('aniraku-bookmarks') || '[]') } catch { /* stale local storage is non-fatal */ }
      try {
        const { data } = await supabase.from('bookmarks').select('anime_id,title').eq('user_id', user.id)
        if (data?.length) bookmarks = data.map((bookmark) => ({ id: bookmark.anime_id, title: bookmark.title }))
      } catch { /* server bookmarks are optional for this notification */ }
      if (!bookmarks.length || cancelled) return

      let lastKnown = {}
      try { lastKnown = JSON.parse(localStorage.getItem('aniraku-episode-track') || '{}') || {} } catch { /* stale local storage is non-fatal */ }
      const now = Date.now()
      const api = import.meta.env.VITE_API_URL || ''
      bookmarks.forEach((bookmark) => {
        if (lastKnown[bookmark.id] && now - lastKnown[bookmark.id].t < 21600000) return
        getAnimeMetadata(bookmark.id).then((media) => {
          if (!media || media.status !== 'RELEASING' || !api || cancelled) return
          const episode = media.nextAiringEpisode?.episode ? media.nextAiringEpisode.episode - 1 : (media.episodes || 0)
          if (episode <= (lastKnown[bookmark.id]?.e || 0)) return
          fetch(`${api}/api/v1/miruro/episodes/${bookmark.id}`)
            .then((response) => response.ok ? response.json() : Promise.reject())
            .then(async (payload) => {
              const hasEpisode = Object.values(payload?.providers || {}).some((provider) => (provider?.episodes?.sub || []).some((item) => item.number === episode))
              if (!hasEpisode || cancelled) return
              const message = `Episode ${episode} of ${bookmark.title} is now available`
              const { data: existing, error: lookupError } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', user.id)
                .eq('type', 'new_episode')
                .eq('anime_id', bookmark.id)
                .eq('message', message)
                .limit(1)
                .maybeSingle()
              if (cancelled || lookupError || existing) return
              lastKnown[bookmark.id] = { e: episode, t: now }
              localStorage.setItem('aniraku-episode-track', JSON.stringify(lastKnown))
              const { error: insertError } = await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'new_episode',
                message,
                anime_id: bookmark.id,
              })
              if (insertError && insertError.code !== '23505') return
            })
            .catch(() => {})
        }).catch(() => {})
      })
    }
    checkForNewEpisodes()
    return () => { cancelled = true }
  }, [user])

  const spotlightEpisode = featured?.nextAiringEpisode?.episode
  return (
    <>
      <Page>
        <Shell>
          {!homeDone ? <EmptyHero>Finding what to watch next.</EmptyHero> : featured ? (
            <Hero key={featured.id} $image={imageFor(featured)} $mobileImage={posterFor(featured)}>
              <HeroCopy>
                <p className="eyebrow"><FaFire size={10} /> Trending now</p>
                <h1>{titleFor(featured)}</h1>
                <HeroMeta>
                  {featured.format && <span><FaTv size={9} /> {featured.format}</span>}
                  {featured.averageScore && <span><FaStar size={9} /> {featured.averageScore}%</span>}
                  {featured.episodes && <span>{featured.episodes} episodes</span>}
                  {spotlightEpisode && <span><FaBolt size={9} /> Episode {spotlightEpisode} next</span>}
                </HeroMeta>
                <p className="summary">{stripHtml(featured.description) || 'Explore a title currently moving through Aniraku’s discovery feed.'}</p>
                <HeroActions>
                  <HeroAction to={watchHref(featured)}><FaPlay size={11} /> Watch now</HeroAction>
                  <HeroAction $secondary to={detailHref(featured)}>Details <FaArrowRight size={10} /></HeroAction>
                </HeroActions>
              </HeroCopy>
            </Hero>
          ) : <EmptyHero>Trending metadata is temporarily unavailable. Please try again shortly.</EmptyHero>}

          <Section>
            <SectionHeading>
              <div><p className="eyebrow"><FaBolt size={10} /> Fresh from the season</p><h2>Now airing.</h2><p>New episodes, ready when you are.</p></div>
              <Link to="/catalog?status=RELEASING">All airing <FaArrowRight size={11} /></Link>
            </SectionHeading>
            <PosterRailSection items={freshAiring} meta={(item) => item.nextAiringEpisode?.episode ? `Episode ${item.nextAiringEpisode.episode} next` : (item.format || 'Airing')} />
          </Section>

          <SchedulePanel aria-label="Upcoming episode schedule">
            <ScheduleIntro>
              <p className="eyebrow"><FaClock size={10} /> Airing next</p>
              <h2>Keep your queue moving.</h2>
              <p>Upcoming episodes in your local time.</p>
              <Link to="/schedule">Full schedule <FaArrowRight size={11} /></Link>
            </ScheduleIntro>
            <ScheduleGrid>
              {scheduleItems.map((item) => {
                const timing = releaseTiming(item.nextAiringEpisode?.airingAt)
                return <ScheduleItem key={item.id} to={detailHref(item)} title={`Open ${titleFor(item)} · ${timing?.stamp || 'Upcoming release'}`}>
                  <img src={posterFor(item)} alt="" loading="lazy" />
                  <div><h3>{titleFor(item)}</h3><p>Episode {item.nextAiringEpisode?.episode || '?'} next</p><strong>{timing?.relative || 'Upcoming'}{timing?.stamp ? ` · ${timing.stamp}` : ''}</strong></div>
                </ScheduleItem>
              })}
            </ScheduleGrid>
          </SchedulePanel>

          <PersonalSection aria-label="Continue watching"><ContinueWatching /></PersonalSection>

          <Section>
            <SectionHeading>
              <div><p className="eyebrow"><FaFire size={10} /> Trending right now</p><h2>All eyes here.</h2><p>Fan favorites across series and movies.</p></div>
              <Link to="/catalog?sort=TRENDING_DESC">Explore trends <FaArrowRight size={11} /></Link>
            </SectionHeading>
            <PosterRailSection items={unifiedTrending.filter((item) => item.id !== featured?.id)} meta={mediaSummary} />
          </Section>

          <FeatureGrid>
            <div>
              <SectionHeading>
                <div><p className="eyebrow"><FaStar size={10} /> Top series</p><h2>Worth the binge.</h2><p>Top-rated series worth your time.</p></div>
                <Link to="/catalog?sort=SCORE_DESC">Top rated <FaArrowRight size={11} /></Link>
              </SectionHeading>
              <PosterRailSection items={weeklyFavorites} meta={(item) => item.averageScore ? `${item.averageScore}% audience score` : (item.format || 'Series')} />
            </div>

            <MovieFeature>
              <p className="eyebrow"><FaFilm size={10} /> Movie night</p>
              <h2>One story. One sitting.</h2>
              <p>Top-rated movies for one great sitting.</p>
              <MovieStack>
                {moviesList.slice(0, 5).map((item) => (
                  <MovieItem key={item.id} to={detailHref(item)} title={`Open ${titleFor(item)} movie`}>
                    <img src={posterFor(item)} alt="" loading="lazy" />
                    <h3>{titleFor(item)}</h3>
                    <span>{item.averageScore ? `${item.averageScore}%` : 'Movie'}</span>
                  </MovieItem>
                ))}
              </MovieStack>
            </MovieFeature>
          </FeatureGrid>

          <MoodPanel>
            <p className="label">Browse by mood</p>
            <MoodLinks>
              {['Action', 'Romance', 'Comedy', 'Fantasy', 'Mystery', 'Slice of Life', 'Sports', 'Supernatural', 'Drama'].map((genre) => <MoodLink key={genre} to={`/catalog?genre=${encodeURIComponent(genre)}`}>{genre}</MoodLink>)}
            </MoodLinks>
          </MoodPanel>
        </Shell>
      </Page>
      <Footer />
      <div className="bottom-nav-spacer" />
    </>
  )
}

export default Home
