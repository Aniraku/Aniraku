import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import {
  FaArrowRight,
  FaBolt,
  FaCalendarAlt,
  FaClock,
  FaFilm,
  FaFire,
  FaPlay,
  FaRandom,
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
import { anilistQuery, ANIME_DETAIL_QUERY } from '../lib/anilist'
import { generateSlug } from '../lib/slug'

const Page = styled.main`
  min-height: 100vh;
  overflow: clip;
  background:
    radial-gradient(circle at 84% 4%, rgba(125, 92, 232, 0.15), transparent 24rem),
    linear-gradient(180deg, color-mix(in srgb, var(--bg-secondary) 62%, var(--bg)) 0, var(--bg) 37rem);
`

const Shell = styled.div`
  width: min(100%, 1440px);
  margin: 0 auto;
  padding: calc(var(--header-h) + clamp(16px, 3vw, 38px)) var(--content-pad) clamp(28px, 5vw, 64px);

  @media (max-width: 640px) { padding-top: calc(var(--header-h) + 10px); }
`

const SpotlightGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(285px, 0.75fr);
  gap: 14px;
  align-items: stretch;

  @media (max-width: 980px) { grid-template-columns: 1fr; }
`

const Spotlight = styled.article`
  position: relative;
  display: flex;
  min-height: clamp(390px, 43vw, 530px);
  align-items: flex-end;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--bg-elevated);
  isolation: isolate;

  &::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: ${({ $image }) => $image ? `url(${$image})` : 'none'};
    background-position: center;
    background-size: cover;
    content: '';
    transform: scale(1.02);
  }

  &::after {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(90deg, rgba(8,8,12,0.94) 0%, rgba(8,8,12,0.7) 44%, rgba(8,8,12,0.15) 100%),
      linear-gradient(0deg, rgba(8,8,12,0.96) 0%, transparent 62%);
    content: '';
  }

  @media (max-width: 640px) {
    min-height: clamp(430px, 128vw, 520px);
    border-radius: 18px;
    /* Use the portrait cover on phones so the Random pick remains fully
       visible instead of cropping the subject out of the hero frame. */
    &::before {
      background-image: ${({ $mobileImage, $image }) => $mobileImage ? `url(${$mobileImage})` : ($image ? `url(${$image})` : 'none')};
      background-position: center top;
      background-size: auto 100%;
      background-repeat: no-repeat;
      transform: none;
    }
    &::after { background: linear-gradient(0deg, rgba(8,8,12,0.98) 0%, rgba(8,8,12,0.66) 55%, rgba(8,8,12,0.08) 100%); }
  }
`

const SpotlightCopy = styled.div`
  width: min(100%, 630px);
  padding: clamp(22px, 4vw, 46px);

  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 12px;
    color: var(--accent);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  h1 {
    max-width: 15ch;
    margin: 0;
    color: #fff;
    font-size: clamp(31px, 5vw, 58px);
    font-weight: 850;
    letter-spacing: -0.06em;
    line-height: 0.98;
  }

  .summary {
    display: -webkit-box;
    max-width: 56ch;
    margin: 15px 0 0;
    overflow: hidden;
    color: rgba(255,255,255,0.78);
    font-size: 13px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  @media (max-width: 640px) {
    padding: 20px;
    h1 { max-width: 13ch; font-size: clamp(30px, 11vw, 44px); }
    .summary { font-size: 12px; -webkit-line-clamp: 2; }
  }
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 14px;

  span {
    min-height: 24px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0 8px;
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: var(--radius-full);
    background: rgba(0,0,0,0.28);
    color: rgba(255,255,255,0.88);
    font-size: 10px;
    font-weight: 750;
  }
  svg { color: var(--accent); }
`

const SpotlightActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
`

const SpotlightAction = styled(Link)`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid ${({ $secondary }) => ($secondary ? 'rgba(255,255,255,0.2)' : 'var(--accent)')};
  border-radius: 8px;
  background: ${({ $secondary }) => ($secondary ? 'rgba(0,0,0,0.22)' : 'var(--accent)')};
  color: ${({ $secondary }) => ($secondary ? '#fff' : 'var(--bg)')};
  font-size: 12px;
  font-weight: 850;
  text-decoration: none;
  transition: transform var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
  &:hover { background: ${({ $secondary }) => ($secondary ? 'rgba(255,255,255,0.14)' : 'var(--accent-dim)')}; }
  &:active { transform: scale(0.97); }

  @media (max-width: 430px) {
    flex: 1 1 calc(50% - 4px);
    &:first-child { flex-basis: 100%; }
  }
`

const RandomSlideButton = styled.button`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  background: rgba(0,0,0,0.22);
  color: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
  transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
  &:hover { border-color: rgba(255,255,255,0.42); background: rgba(255,255,255,0.14); }
  &:active { transform: scale(0.97); }

  @media (max-width: 430px) { flex: 1 1 calc(50% - 4px); }
`

const OnDeck = styled.aside`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--bg-card);
`

const OnDeckHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--border);

  h2 { margin: 0; color: var(--text-primary); font-size: 15px; letter-spacing: -0.02em; }
  p { display: flex; align-items: center; gap: 6px; margin: 4px 0 0; color: var(--text-muted); font-size: 11px; }
  p svg { color: var(--accent); }
  a { color: var(--text-secondary); font-size: 11px; font-weight: 750; text-decoration: none; }
  a:hover { color: var(--text-primary); }
`

const DeckList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 5px 9px 9px;
`

const DeckGroupLabel = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 8px 2px;
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  svg { color: var(--accent); }
`

const DeckItem = styled(Link)`
  display: grid;
  grid-template-columns: 33px minmax(0, 1fr) minmax(78px, auto);
  gap: 10px;
  align-items: center;
  min-height: 70px;
  padding: 8px;
  border-bottom: 1px solid var(--border);
  color: inherit;
  text-decoration: none;
  transition: background var(--transition-fast), transform var(--transition-fast);

  &:last-child { border-bottom: 0; }
  &:hover { border-radius: 8px; background: var(--bg-elevated); }
  &:active { transform: scale(0.985); }

  img { width: 33px; height: 46px; border-radius: 5px; object-fit: cover; background: var(--bg-elevated); }
  h3 { margin: 0; overflow: hidden; color: var(--text-primary); font-size: 12px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 4px 0 0; overflow: hidden; color: var(--text-muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }

  @media (max-width: 520px) {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 9px;
    img { width: 34px; height: 46px; object-fit: contain; }
    h3 { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  }
`

const DeckTime = styled.div`
  min-width: 0;
  text-align: right;
  strong { display: block; color: var(--accent); font-size: 10px; font-weight: 850; white-space: nowrap; }
  span { display: block; margin-top: 3px; color: var(--text-muted); font-size: 9px; line-height: 1.2; }

  @media (max-width: 520px) {
    grid-column: 2;
    display: flex;
    align-items: baseline;
    gap: 6px;
    text-align: left;
    strong, span { display: inline; }
    span { margin-top: 0; }
  }
`

const EmptyDeck = styled.div`
  display: grid;
  flex: 1;
  place-items: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
`

const PersonalSection = styled.section`
  margin-top: 26px;
`

const StoryGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(270px, 0.6fr);
  gap: 14px;
  margin-top: 30px;

  @media (max-width: 980px) { grid-template-columns: 1fr; }
  @media (max-width: 640px) { margin-top: 22px; gap: 12px; }
`

const StoryPanel = styled.section`
  padding: clamp(18px, 2.8vw, 30px);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--bg-card);
`

const SectionTitle = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;

  .eyebrow { display: flex; align-items: center; gap: 7px; margin: 0 0 6px; color: var(--accent); font-size: 10px; font-weight: 850; letter-spacing: 0.12em; text-transform: uppercase; }
  h2 { margin: 0; color: var(--text-primary); font-size: clamp(21px, 2.5vw, 30px); letter-spacing: -0.04em; }
  a { display: inline-flex; align-items: center; gap: 7px; color: var(--text-secondary); font-size: 12px; font-weight: 750; text-decoration: none; }
  a:hover { color: var(--text-primary); }

  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }
`

const EditorialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`

const EditorialCard = styled(Link)`
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr);
  gap: 12px;
  min-height: 88px;
  align-items: center;
  padding: 9px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: inherit;
  text-decoration: none;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);

  &:hover { transform: translateY(-2px); border-color: var(--border-hover); background: var(--bg-secondary); }
  &:active { transform: scale(0.985); }
  img { width: 62px; height: 72px; border-radius: 6px; object-fit: cover; background: var(--bg-secondary); }
  h3 { margin: 0; overflow: hidden; color: var(--text-primary); font-size: 13px; font-weight: 760; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 6px 0 0; color: var(--text-secondary); font-size: 11px; }
  small { display: block; margin-top: 5px; color: var(--accent); font-size: 10px; font-weight: 800; }
`

const ScreeningRoom = styled.section`
  position: relative;
  display: flex;
  min-height: 100%;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: clamp(20px, 3vw, 30px);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(circle at 100% 0%, rgba(125,92,232,0.2), transparent 15rem),
    var(--bg-card);

  h2 { max-width: 11ch; margin: 8px 0 0; color: var(--text-primary); font-size: clamp(26px, 3vw, 36px); letter-spacing: -0.05em; line-height: 1.02; }
  p { max-width: 34ch; margin: 12px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.55; }
`

const MovieList = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 24px;
`

const MovieItem = styled(Link)`
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
  color: inherit;
  text-decoration: none;
  &:last-child { border-bottom: 0; }
  &:hover h3 { color: var(--accent); }
  img { width: 26px; height: 34px; border-radius: 4px; object-fit: cover; background: var(--bg-elevated); }
  h3 { margin: 0; overflow: hidden; color: var(--text-primary); font-size: 11px; font-weight: 730; text-overflow: ellipsis; white-space: nowrap; transition: color var(--transition-fast); }
  span { color: var(--text-muted); font-size: 10px; font-weight: 700; }
`

const GenreBand = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding: 16px 0 2px;

  p { flex: 0 0 auto; margin: 0; color: var(--text-secondary); font-size: 12px; font-weight: 750; }
  @media (max-width: 720px) { align-items: flex-start; flex-direction: column; }
`

const GenreLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
  @media (max-width: 720px) { justify-content: flex-start; }
`

const GenreLink = styled(Link)`
  min-height: 31px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
  &:hover { border-color: var(--accent); background: var(--bg-elevated); color: var(--text-primary); }
`

const LoadingSpotlight = styled.div`
  min-height: 430px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: linear-gradient(110deg, var(--bg-card) 28%, var(--bg-elevated) 42%, var(--bg-card) 55%);
  background-size: 220% 100%;
  animation: homeShimmer 1.35s linear infinite;
  @keyframes homeShimmer { to { background-position: -220% 0; } }
`

const titleFor = (item) => item?.title?.english || item?.title?.romaji || item?.title?.userPreferred || 'Unknown title'
const imageFor = (item) => item?.bannerImage || item?.coverImage?.extraLarge || item?.coverImage?.large || ''
const posterFor = (item) => item?.coverImage?.extraLarge || item?.coverImage?.large || item?.coverImage?.medium || ''
const detailHref = (item) => `/anime/${generateSlug(titleFor(item))}-${item.id}`
const watchHref = (item) => `/watch/${generateSlug(titleFor(item))}-${item.id}-episode-1`
const stripHtml = (text = '') => text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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

function Home() {
  const { data: homeData = {}, isFetched: homeDone } = useHomePageData()
  const { trending = [], airing = [], movies = [], topTV = [] } = homeData
  const { user } = useAuth()
  const { nsfwEnabled } = useNsfw()
  const trendingList = useStreamable(filterAdult(trending, nsfwEnabled))
  const airingList = useStreamable(filterAdult(airing, nsfwEnabled))
  const moviesList = useStreamable(filterAdult(movies, nsfwEnabled))
  const tvList = useStreamable(filterAdult(topTV, nsfwEnabled))

  const featured = useMemo(() => trendingList[0] || airingList[0] || tvList[0] || moviesList[0] || null, [trendingList, airingList, tvList, moviesList])
  const randomSlides = useMemo(() => {
    const byId = new Map()
    ;[...trendingList, ...airingList, ...tvList, ...moviesList].forEach((item) => {
      if (item?.id && !byId.has(item.id)) byId.set(item.id, item)
    })
    return [...byId.values()].sort(() => Math.random() - 0.5).slice(0, 10)
  }, [trendingList, airingList, tvList, moviesList])
  const [randomIndex, setRandomIndex] = useState(0)
  const upcomingReleases = useMemo(() => airingList
    .filter((item) => item?.id && item.id !== featured?.id && Number(item?.nextAiringEpisode?.airingAt) * 1000 >= Date.now())
    .sort((a, b) => Number(a.nextAiringEpisode.airingAt) - Number(b.nextAiringEpisode.airingAt))
    .slice(0, 3), [airingList, featured])
  const upcomingIds = useMemo(() => new Set(upcomingReleases.map((item) => item.id)), [upcomingReleases])
  const popularUpcoming = useMemo(() => [...trendingList, ...tvList, ...airingList]
    .filter((item, index, list) => item?.id && item.id !== featured?.id && !upcomingIds.has(item.id) && Number(item?.nextAiringEpisode?.airingAt) * 1000 >= Date.now() && list.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => (Number(b.averageScore) || 0) - (Number(a.averageScore) || 0))
    .slice(0, 2), [trendingList, tvList, airingList, featured, upcomingIds])
  const editorialPicks = useMemo(() => [...trendingList, ...tvList]
    .filter((item, index, list) => item?.id && item.id !== featured?.id && list.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 6), [trendingList, tvList, featured])

  useEffect(() => { setHomepageSEO() }, [])

  useEffect(() => {
    setRandomIndex((index) => randomSlides.length ? index % randomSlides.length : 0)
  }, [randomSlides.length])

  useEffect(() => {
    if (randomSlides.length < 2) return undefined
    const timer = window.setInterval(() => setRandomIndex((index) => (index + 1) % randomSlides.length), 10000)
    return () => window.clearInterval(timer)
  }, [randomSlides.length])

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
        anilistQuery(ANIME_DETAIL_QUERY, { id: bookmark.id }).then(({ data }) => {
          const media = data?.Media
          if (!media || media.status !== 'RELEASING' || !api || cancelled) return
          const episode = media.nextAiringEpisode?.episode ? media.nextAiringEpisode.episode - 1 : (media.episodes || 0)
          if (episode <= (lastKnown[bookmark.id]?.e || 0)) return
          fetch(`${api}/api/v1/miruro/episodes/${bookmark.id}`)
            .then((response) => response.ok ? response.json() : Promise.reject())
            .then(async (payload) => {
              const hasEpisode = Object.values(payload?.providers || {}).some((provider) => (provider?.episodes?.sub || []).some((item) => item.number === episode))
              if (!hasEpisode || cancelled) return
              const message = `Episode ${episode} of ${bookmark.title} is now available`
              // The table intentionally deduplicates user/type/anime/message. Check
              // first so normal refreshes do not turn an already-seen release into
              // a visible 409, while the duplicate race remains harmlessly ignored.
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
              // A second tab can win the check between SELECT and INSERT. The
              // unique violation is the expected idempotency race, not an error.
              if (insertError && insertError.code !== '23505') return
            })
            .catch(() => {})
        }).catch(() => {})
      })
    }
    checkForNewEpisodes()
    return () => { cancelled = true }
  }, [user])

  const spotlight = randomSlides.length ? randomSlides[randomIndex % randomSlides.length] : featured
  const spotlightTitle = titleFor(spotlight)
  const spotlightImage = imageFor(spotlight)
  const spotlightPoster = posterFor(spotlight)
  const spotlightEpisode = spotlight?.nextAiringEpisode?.episode
  const showAnotherRandomSlide = () => {
    if (randomSlides.length < 2) return
    setRandomIndex((index) => {
      let next = index
      while (next === index) next = Math.floor(Math.random() * randomSlides.length)
      return next
    })
  }

  return (
    <>
      <Page>
        <Shell>

          {!homeDone || !featured ? <LoadingSpotlight /> : (
            <SpotlightGrid>
              <Spotlight $image={spotlightImage} $mobileImage={spotlightPoster}>
                <SpotlightCopy>
                  <div className="kicker"><FaRandom size={10} /> Random anime pick</div>
                  <h1>{spotlightTitle}</h1>
                  <MetaRow>
                    {spotlight?.format && <span><FaTv size={9} /> {spotlight.format}</span>}
                    {spotlight?.averageScore && <span><FaStar size={9} /> {spotlight.averageScore}%</span>}
                    {spotlight?.episodes && <span>{spotlight.episodes} episodes</span>}
                    {spotlightEpisode && <span><FaBolt size={9} /> Episode {spotlightEpisode} next</span>}
                  </MetaRow>
                  <p className="summary">{stripHtml(spotlight?.description) || 'A hand-picked surprise from the latest anime available on Aniraku.'}</p>
                  <SpotlightActions>
                    {spotlight && <SpotlightAction to={watchHref(spotlight)}><FaPlay size={11} /> Start watching</SpotlightAction>}
                    {spotlight && <SpotlightAction $secondary to={detailHref(spotlight)}>Details <FaArrowRight size={10} /></SpotlightAction>}
                    <RandomSlideButton type="button" onClick={showAnotherRandomSlide} aria-label="Show another random anime"><FaRandom size={11} /> Surprise me</RandomSlideButton>
                  </SpotlightActions>
                </SpotlightCopy>
              </Spotlight>

              <OnDeck>
                <OnDeckHeader>
                  <div><h2>On deck</h2><p><FaClock size={10} /> Confirmed upcoming times · your local timezone</p></div>
                  <Link to="/schedule">Full schedule</Link>
                </OnDeckHeader>
                <DeckList>
                  {upcomingReleases.length || popularUpcoming.length ? (
                    <>
                      {upcomingReleases.length > 0 && <DeckGroupLabel><FaClock size={9} /> Next episode releases</DeckGroupLabel>}
                      {upcomingReleases.map((item) => {
                        const timing = releaseTiming(item.nextAiringEpisode?.airingAt)
                        return <DeckItem key={item.id} to={detailHref(item)} title={`Open ${titleFor(item)} · ${timing?.stamp || 'Upcoming release'}`}>
                          <img src={item.coverImage?.large || ''} alt="" loading="lazy" />
                          <div><h3>{titleFor(item)}</h3><p>Episode {item.nextAiringEpisode?.episode || '?'} next</p></div>
                          <DeckTime><strong>{timing?.relative || 'Upcoming'}</strong><span>{timing?.stamp || 'Time pending'}</span></DeckTime>
                        </DeckItem>
                      })}
                      {popularUpcoming.length > 0 && <DeckGroupLabel><FaStar size={9} /> Popular titles ahead</DeckGroupLabel>}
                      {popularUpcoming.map((item) => {
                        const timing = releaseTiming(item.nextAiringEpisode?.airingAt)
                        return <DeckItem key={item.id} to={detailHref(item)} title={`Open ${titleFor(item)} · ${timing?.stamp || 'Upcoming release'}`}>
                          <img src={item.coverImage?.large || ''} alt="" loading="lazy" />
                          <div><h3>{titleFor(item)}</h3><p>{item.nextAiringEpisode?.episode ? `Episode ${item.nextAiringEpisode.episode} next` : item.format || 'Series'}{item.averageScore ? ` · ${item.averageScore}%` : ''}</p></div>
                          <DeckTime><strong>{timing?.relative || 'Upcoming'}</strong><span>{timing?.stamp || 'Time pending'}</span></DeckTime>
                        </DeckItem>
                      })}
                    </>
                  ) : <EmptyDeck>No confirmed upcoming release times are available right now. Check the weekly schedule for the latest metadata.</EmptyDeck>}
                </DeckList>
              </OnDeck>
            </SpotlightGrid>
          )}


          <PersonalSection aria-label="Continue watching"><ContinueWatching /></PersonalSection>

          <StoryGrid>
            <StoryPanel>
              <SectionTitle>
                <div><p className="eyebrow"><FaFire size={10} /> The conversation</p><h2>Stories worth starting.</h2></div>
                <Link to="/catalog?sort=POPULARITY_DESC">Explore more <FaArrowRight size={11} /></Link>
              </SectionTitle>
              <EditorialGrid>
                {editorialPicks.map((item) => (
                  <EditorialCard key={item.id} to={detailHref(item)} title={`Open ${titleFor(item)}`}>
                    <img src={item.coverImage?.large || ''} alt="" loading="lazy" />
                    <div><h3>{titleFor(item)}</h3><p>{item.format || 'Anime'}{item.episodes ? ` · ${item.episodes} eps` : ''}</p><small>{item.averageScore ? `${item.averageScore}% community score` : 'Open series'}</small></div>
                  </EditorialCard>
                ))}
              </EditorialGrid>
            </StoryPanel>

            <ScreeningRoom>
              <div><p className="eyebrow"><FaFilm size={10} /> Screening room</p><h2>One good movie can reset the night.</h2><p>A concise selection of highly rated films, ready whenever you want a complete story.</p></div>
              <MovieList>
                {moviesList.slice(0, 4).map((item) => (
                  <MovieItem key={item.id} to={detailHref(item)} title={`Open ${titleFor(item)} movie`}>
                    <img src={item.coverImage?.large || ''} alt="" loading="lazy" />
                    <h3>{titleFor(item)}</h3><span>{item.averageScore ? `${item.averageScore}%` : 'Movie'}</span>
                  </MovieItem>
                ))}
              </MovieList>
            </ScreeningRoom>
          </StoryGrid>

          <GenreBand>
            <p>Browse by mood</p>
            <GenreLinks>
              {['Action', 'Romance', 'Comedy', 'Fantasy', 'Mystery', 'Slice of Life', 'Sports', 'Supernatural', 'Drama'].map((genre) => <GenreLink key={genre} to={`/catalog?genre=${encodeURIComponent(genre)}`}>{genre}</GenreLink>)}
            </GenreLinks>
          </GenreBand>
        </Shell>
      </Page>
      <Footer />
      <div className="bottom-nav-spacer" />
    </>
  )
}

export default Home
