import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { FaPlay, FaFire, FaStar, FaTv, FaFilm } from 'react-icons/fa'
import Hero from '../components/Hero/Hero'
import ContinueWatching from '../components/ContinueWatching'
import Trending from '../components/Trending/Trending'
import Card from '../components/Card/Card'
import Footer from '../components/Footer/Footer'
import { useAiring, useMovies, useSeries } from '../hooks/useAnime'
import { setHomepageSEO } from '../lib/seo'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { anilistQuery, ANIME_DETAIL_QUERY } from '../lib/anilist'

const Section = styled.section`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    padding: 0 12px;
    margin-bottom: 1rem;
  }
`

const SectionTitle = styled.h2`
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &::before {
    content: '';
    width: 4px;
    height: 1.1em;
    background: var(--accent);
    border-radius: 2px;
  }
  a {
    margin-left: auto;
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
    &:hover { color: var(--accent); }
  }
  @media (max-width: 480px) {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
  }
`

const ScrollRow = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-bottom: 4px;
  &::-webkit-scrollbar { display: none; }
  > div { scroll-snap-align: start; flex: 0 0 auto; width: 150px; }
  @media (max-width: 480px) {
    gap: 10px;
    > div { width: 130px; }
  }
`

const GenreChip = styled(Link)`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3px 10px;
  text-decoration: none;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
  min-height: unset !important;
  min-width: unset !important;
  transition: all 0.2s;
  &:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }
  @media (max-width: 480px) {
    padding: 2px 8px;
    font-size: 10px;
    border-radius: 6px;
  }
`

const GenreRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  @media (max-width: 480px) {
    gap: 4px;
  }
`

const QuickLinks = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding: 0 1rem;
  padding-bottom: 6px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  @media (max-width: 480px) {
    gap: 6px;
    margin-bottom: 1rem;
    padding: 0 12px;
  }
`

const QuickLink = styled(Link)`
  flex: 0 0 auto;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  text-decoration: none;
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  &:active {
    transform: scale(0.97);
    background: var(--bg-elevated);
  }
  &:hover {
    border-color: var(--accent);
    background: var(--bg-elevated);
  }
  svg { color: var(--accent); }
  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 0.8rem;
  }
`

const skeletonRow = Array.from({ length: 6 }, (_, i) => i)

const Home = () => {
  const genres = [
    'Action', 'Romance', 'Comedy', 'Sci-Fi', 'Horror',
    'Slice of Life', 'Sports', 'Supernatural', 'Mystery', 'Drama',
  ]

  const { data: airing = [], isFetched: airingDone } = useAiring()
  const { data: movies = [], isFetched: moviesDone } = useMovies()
  const { data: topTV = [], isFetched: tvDone } = useSeries()

  const { user } = useAuth()

  // Set homepage SEO metadata on mount
  React.useEffect(() => {
    setHomepageSEO()
  }, [])

  // Check bookmarked anime for new episodes (only notify when Miruro has them)
  React.useEffect(() => {
    if (!user) return
    const bm = JSON.parse(localStorage.getItem('aniraku-bookmarks') || '[]')
    if (!bm.length) return
    const lastKnown = JSON.parse(localStorage.getItem('aniraku-episode-track') || '{}')
    const now = Date.now()
    const api = import.meta.env.VITE_API_URL || ''

    bm.forEach(b => {
      if (lastKnown[b.id] && now - lastKnown[b.id].t < 21600000) return
      anilistQuery(ANIME_DETAIL_QUERY, { id: b.id }).then(({ data }) => {
        const m = data?.Media
        if (!m || m.status !== 'RELEASING') return
        const eps = m.episodes || 0
        if (eps <= (lastKnown[b.id]?.e || 0)) return
        // Verify Miruro has this episode before notifying
        if (api) {
          fetch(`${api}/api/v1/miruro/episodes/${b.id}`)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => {
              const providers = d?.providers || {}
              let hasEp = false
              Object.values(providers).forEach(p => {
                const subs = p?.episodes?.sub || []
                subs.forEach(e => { if (e.number === eps) hasEp = true })
              })
              if (!hasEp) return
              lastKnown[b.id] = { e: eps, t: now }
              localStorage.setItem('aniraku-episode-track', JSON.stringify(lastKnown))
              supabase.from('notifications').insert({
                user_id: user.id, type: 'new_episode',
                message: `Episode ${eps} of ${b.title} is now available`,
                anime_id: b.id,
              }).then()
            })
            .catch(() => {})
        }
      }).catch(() => {})
    })
  }, [user])

  return (
    <>
      <main>
      <Hero />
      <ContinueWatching />

      <QuickLinks>
        <QuickLink to="/catalog?sort=POPULARITY_DESC"><FaFire /> Most Popular</QuickLink>
        <QuickLink to="/catalog?status=RELEASING"><FaPlay /> Airing Now</QuickLink>
        <QuickLink to="/catalog?sort=SCORE_DESC"><FaStar /> Top Rated</QuickLink>
      </QuickLinks>

      <Trending />

      {/* Airing Now */}
      <Section>
        <SectionTitle>
          <FaTv size={16} /> Airing Now
          <Link to="/catalog?status=RELEASING">View All</Link>
        </SectionTitle>
        <ScrollRow>
          {airingDone ? airing.slice(0, 15).map(item => (
            <Card key={item.id} data={item} />
          )) : skeletonRow.map(i => (
            <div key={`sk-air-${i}`} className="card-skeleton" style={{ width: 150, flex: '0 0 auto' }}>
              <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--bg-card)', borderRadius: 8 }} />
              <div style={{ height: 12, background: 'var(--bg-card)', borderRadius: 4, marginTop: 8, width: '70%' }} />
            </div>
          ))}
        </ScrollRow>
      </Section>

      {/* Top Movies */}
      <Section>
        <SectionTitle>
          <FaFilm size={16} /> Top Movies
          <Link to="/catalog?format=MOVIE&sort=SCORE_DESC">View All</Link>
        </SectionTitle>
        <ScrollRow>
          {moviesDone ? movies.slice(0, 15).map(item => (
            <Card key={item.id} data={item} />
          )) : skeletonRow.map(i => (
            <div key={`sk-mov-${i}`} className="card-skeleton" style={{ width: 150, flex: '0 0 auto' }}>
              <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--bg-card)', borderRadius: 8 }} />
              <div style={{ height: 12, background: 'var(--bg-card)', borderRadius: 4, marginTop: 8, width: '70%' }} />
            </div>
          ))}
        </ScrollRow>
      </Section>

      {/* Top Rated TV */}
      <Section>
        <SectionTitle>
          <FaStar size={16} /> Top Rated TV
          <Link to="/catalog?format=TV&sort=SCORE_DESC">View All</Link>
        </SectionTitle>
        <ScrollRow>
          {tvDone ? topTV.slice(0, 15).map(item => (
            <Card key={item.id} data={item} />
          )) : skeletonRow.map(i => (
            <div key={`sk-tv-${i}`} className="card-skeleton" style={{ width: 150, flex: '0 0 auto' }}>
              <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--bg-card)', borderRadius: 8 }} />
              <div style={{ height: 12, background: 'var(--bg-card)', borderRadius: 4, marginTop: 8, width: '70%' }} />
            </div>
          ))}
        </ScrollRow>
      </Section>

      <Section>
        <SectionTitle>Browse by Tags</SectionTitle>
        <GenreRow>
          {genres.map(g => (
            <GenreChip key={g} to={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</GenreChip>
          ))}
        </GenreRow>
      </Section>

      </main>
      <Footer />
      <div className="bottom-nav-spacer" />
      <style>{`@media(max-width:480px){.card-skeleton{width:130px!important}}`}</style>
    </>
  )
}

export default Home
