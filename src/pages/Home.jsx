import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import {
  FaArrowRight,
  FaBolt,
  FaCalendarAlt,
  FaCompass,
  FaFilm,
  FaFire,
  FaPlay,
  FaStar,
  FaTv,
} from 'react-icons/fa'
import Hero from '../components/Hero/Hero'
import ContinueWatching from '../components/ContinueWatching'
import Card from '../components/Card/Card'
import Footer from '../components/Footer/Footer'
import { useHomePageData } from '../hooks/useAnime'
import { filterAdult, useNsfw, useStreamable } from '../hooks/useNsfw'
import { setHomepageSEO } from '../lib/seo'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { anilistQuery, ANIME_DETAIL_QUERY } from '../lib/anilist'
import { AnimeCardSkeleton } from '../components/Skeletons/Skeletons'

const Page = styled.main`
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 18%, rgba(139,92,246,0.09), transparent 25%),
    var(--bg);
`

const Shell = styled.div`
  width: min(100%, 1480px);
  margin: 0 auto;
  padding: 0 clamp(14px, 3vw, 48px) 88px;

  @media (max-width: 640px) {
    padding: 0 12px 76px;
  }
`

const DiscoveryDock = styled.section`
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin-top: -25px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-elevated) 94%, transparent);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: -16px;
  }
`

const DockCopy = styled.div`
  min-width: 0;
  padding: 3px 6px;

  p {
    margin: 0 0 4px;
    color: var(--accent);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: clamp(16px, 2vw, 20px);
    letter-spacing: -0.025em;
  }

  span { color: var(--text-secondary); }
`

const DockActions = styled.nav`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 1px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`

const DockLink = styled(Link)`
  display: inline-flex;
  min-height: 40px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 13px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
  transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  touch-action: manipulation;

  svg { color: var(--accent); }
  &:hover { border-color: var(--border-hover); background: var(--bg-elevated); color: var(--text-primary); }
  &:active { transform: scale(0.97); }
`

const Section = styled.section`
  margin-top: clamp(36px, 5vw, 64px);
`

const SectionHead = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
`

const Heading = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;

  > svg { flex: 0 0 auto; color: var(--accent); }

  h2 {
    margin: 0;
    overflow: hidden;
    color: var(--text-primary);
    font-size: clamp(18px, 2.1vw, 25px);
    font-weight: 800;
    letter-spacing: -0.03em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    margin: 3px 0 0;
    color: var(--text-secondary);
    font-size: 12px;
  }
`

const ViewAll = styled(Link)`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
  transition: color var(--transition-fast);
  &:hover { color: var(--text-primary); }
  @media (max-width: 560px) { font-size: 0; gap: 0; }
  @media (max-width: 560px) svg { width: 15px; height: 15px; }
`

const Rail = styled.div`
  display: flex;
  gap: clamp(10px, 1.3vw, 16px);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  padding: 4px 3px 15px;
  margin: 0 -3px -15px;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  > div, > .home-card-skeleton {
    width: clamp(140px, 13.8vw, 202px);
    flex: 0 0 auto;
    scroll-snap-align: start;
  }

  @media (max-width: 640px) {
    gap: 10px;
    > div, > .home-card-skeleton { width: 132px; }
  }
`

const GuestPanel = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(250px, 0.75fr);
  gap: clamp(20px, 4vw, 48px);
  align-items: center;
  margin-top: clamp(32px, 5vw, 62px);
  padding: clamp(22px, 4vw, 46px);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(circle at 88% 18%, rgba(139,92,246,0.15), transparent 35%),
    var(--bg-card);

  @media (max-width: 800px) { grid-template-columns: 1fr; }
`

const GuestCopy = styled.div`
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 10px;
    color: var(--accent);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h2 {
    max-width: 16ch;
    margin: 0;
    color: var(--text-primary);
    font-size: clamp(26px, 4vw, 42px);
    line-height: 1.04;
    letter-spacing: -0.05em;
  }

  p {
    max-width: 58ch;
    margin: 14px 0 0;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.65;
  }
`

const GuestCtas = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 20px;
`

const GuestCta = styled(Link)`
  display: inline-flex;
  min-height: 43px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 15px;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);

  &.primary { background: var(--accent); color: var(--bg); }
  &.secondary { border: 1px solid var(--border-hover); background: var(--bg-elevated); }
  &:hover { background: var(--accent-dim); color: var(--bg); border-color: var(--accent-dim); }
  &:active { transform: scale(0.97); }
`

const BenefitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;

  @media (max-width: 440px) { grid-template-columns: 1fr; }
`

const Benefit = styled.div`
  min-height: 126px;
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);

  svg { color: var(--accent); }
  h3 { margin: 12px 0 5px; color: var(--text-primary); font-size: 13px; }
  p { margin: 0; color: var(--text-muted); font-size: 11px; line-height: 1.45; }
`

const GenreShelf = styled.div`
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 20px;
  align-items: center;
  padding: clamp(18px, 3vw, 28px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);

  h2 { margin: 0; color: var(--text-primary); font-size: clamp(20px, 2.4vw, 30px); letter-spacing: -0.035em; }
  p { margin: 8px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.5; }

  @media (max-width: 760px) { grid-template-columns: 1fr; gap: 16px; }
`

const GenreGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const GenreChip = styled(Link)`
  display: inline-flex;
  min-height: 35px;
  align-items: center;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
  &:hover { border-color: var(--border-hover); background: var(--bg-secondary); color: var(--text-primary); }
  &:active { transform: scale(0.97); }
`

const SkeletonRail = () => (
  <Rail aria-label="Loading anime titles">
    {Array.from({ length: 6 }, (_, index) => <AnimeCardSkeleton key={index} className="home-card-skeleton" />)}
  </Rail>
)

function AnimeRail({ title, subtitle, icon, href, items, ready }) {
  const Icon = icon
  return (
    <Section>
      <SectionHead>
        <Heading>
          <Icon size={16} />
          <div><h2>{title}</h2><p>{subtitle}</p></div>
        </Heading>
        <ViewAll to={href}>View all <FaArrowRight size={12} /></ViewAll>
      </SectionHead>
      {ready ? <Rail>{items.slice(0, 18).map((item) => <Card key={item.id} data={item} />)}</Rail> : <SkeletonRail />}
    </Section>
  )
}

const genres = ['Action', 'Romance', 'Comedy', 'Fantasy', 'Sci-Fi', 'Horror', 'Slice of Life', 'Sports', 'Supernatural', 'Mystery', 'Drama', 'Adventure']

const Home = () => {
  const { data: homeData = {}, isFetched: homeDone } = useHomePageData()
  const { trending = [], airing = [], movies = [], topTV = [] } = homeData
  const { user } = useAuth()
  const { nsfwEnabled } = useNsfw()
  const trendingList = useStreamable(filterAdult(trending, nsfwEnabled))
  const airingList = useStreamable(filterAdult(airing, nsfwEnabled))
  const moviesList = useStreamable(filterAdult(movies, nsfwEnabled))
  const tvList = useStreamable(filterAdult(topTV, nsfwEnabled))

  useEffect(() => { setHomepageSEO() }, [])

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    const check = async () => {
      let bookmarks = []
      try { bookmarks = JSON.parse(localStorage.getItem('aniraku-bookmarks') || '[]') } catch { /* stale local storage is non-fatal */ }
      try {
        const { data } = await supabase.from('bookmarks').select('anime_id,title').eq('user_id', user.id)
        if (data?.length) bookmarks = data.map((bookmark) => ({ id: bookmark.anime_id, title: bookmark.title }))
      } catch { /* server bookmarks are optional for the homepage notice */ }
      if (!bookmarks.length || cancelled) return

      const lastKnown = JSON.parse(localStorage.getItem('aniraku-episode-track') || '{}')
      const now = Date.now()
      const api = import.meta.env.VITE_API_URL || ''
      bookmarks.forEach((bookmark) => {
        if (lastKnown[bookmark.id] && now - lastKnown[bookmark.id].t < 21600000) return
        anilistQuery(ANIME_DETAIL_QUERY, { id: bookmark.id }).then(({ data }) => {
          const media = data?.Media
          if (!media || media.status !== 'RELEASING') return
          const episode = media.nextAiringEpisode?.episode ? media.nextAiringEpisode.episode - 1 : (media.episodes || 0)
          if (episode <= (lastKnown[bookmark.id]?.e || 0) || !api) return
          fetch(`${api}/api/v1/miruro/episodes/${bookmark.id}`)
            .then((response) => response.ok ? response.json() : Promise.reject())
            .then((payload) => {
              const hasEpisode = Object.values(payload?.providers || {}).some((provider) => (provider?.episodes?.sub || []).some((item) => item.number === episode))
              if (!hasEpisode || cancelled) return
              lastKnown[bookmark.id] = { e: episode, t: now }
              localStorage.setItem('aniraku-episode-track', JSON.stringify(lastKnown))
              return supabase.from('notifications').insert({
                user_id: user.id,
                type: 'new_episode',
                message: `Episode ${episode} of ${bookmark.title} is now available`,
                anime_id: bookmark.id,
              })
            })
            .catch(() => {})
        }).catch(() => {})
      })
    }
    check()
    return () => { cancelled = true }
  }, [user])

  return (
    <>
      <Page>
        <Hero />
        <Shell>
          <DiscoveryDock>
            <DockCopy><p>Start here</p><h2>New stories, <span>one tap away.</span></h2></DockCopy>
            <DockActions aria-label="Explore anime">
              <DockLink to="/catalog?status=RELEASING"><FaBolt /> Airing now</DockLink>
              <DockLink to="/catalog?sort=POPULARITY_DESC"><FaFire /> Most popular</DockLink>
              <DockLink to="/schedule"><FaCalendarAlt /> Schedule</DockLink>
              <DockLink to="/catalog?view=all"><FaCompass /> Explore all</DockLink>
            </DockActions>
          </DiscoveryDock>

          {!user && (
            <GuestPanel>
              <GuestCopy>
                <div className="eyebrow"><FaPlay size={11} /> Watch your way</div>
                <h2>Anime discovery without the clutter.</h2>
                <p>Start streaming immediately, then create an account only when you want to sync history, ratings, bookmarks, and progress across your devices.</p>
                <GuestCtas>
                  <GuestCta className="primary" to="/catalog"><FaPlay size={12} /> Browse anime</GuestCta>
                  <GuestCta className="secondary" to="/signup">Create free account</GuestCta>
                </GuestCtas>
              </GuestCopy>
              <BenefitGrid>
                <Benefit><FaPlay size={15} /><h3>No barriers</h3><p>Jump directly into sub and dub streams.</p></Benefit>
                <Benefit><FaTv size={15} /><h3>Built for choice</h3><p>Providers, subtitles, and quality in one player.</p></Benefit>
                <Benefit><FaStar size={15} /><h3>Your history</h3><p>Keep progress and episode ratings where you need them.</p></Benefit>
              </BenefitGrid>
            </GuestPanel>
          )}

          <ContinueWatching />
          <AnimeRail title="Trending now" subtitle="The shows people are watching right now" icon={FaFire} href="/catalog?sort=POPULARITY_DESC" items={trendingList} ready={homeDone} />
          <AnimeRail title="Fresh episodes" subtitle="Current series with new episodes on the way" icon={FaTv} href="/catalog?status=RELEASING" items={airingList} ready={homeDone} />
          <AnimeRail title="Movie night" subtitle="Highly rated anime films for your next watch" icon={FaFilm} href="/catalog?format=MOVIE&sort=SCORE_DESC" items={moviesList} ready={homeDone} />
          <AnimeRail title="Top rated series" subtitle="Fan favourites worth putting on your list" icon={FaStar} href="/catalog?format=TV&sort=SCORE_DESC" items={tvList} ready={homeDone} />

          <Section>
            <GenreShelf>
              <div><h2>Find your next genre.</h2><p>Browse a focused collection, then refine it in the full Catalog when you know exactly what you want.</p></div>
              <GenreGrid>
                {genres.map((genre) => <GenreChip key={genre} to={`/catalog?genre=${encodeURIComponent(genre)}`}>{genre}</GenreChip>)}
              </GenreGrid>
            </GenreShelf>
          </Section>
        </Shell>
      </Page>
      <Footer />
      <div className="bottom-nav-spacer" />
    </>
  )
}

export default Home
