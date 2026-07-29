import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { FaPlay, FaFire, FaStar, FaTv, FaFilm } from 'react-icons/fa'
import NavBar from '../components/NavBar/NavBar'
import Hero from '../components/Hero/Hero'
import ContinueWatching from '../components/ContinueWatching'
import Trending from '../components/Trending/Trending'
import Card from '../components/Card/Card'
import Footer from '../components/Footer/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import { useAiring, useMovies, useSeries } from '../hooks/useAnime'

const Section = styled.section`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    padding: 0 12px;
    margin-bottom: 1.5rem;
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
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 14px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
  &:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }
`

const GenreRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

  return (
    <>
      <NavBar />
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
        <SectionTitle>Browse by Genre</SectionTitle>
        <GenreRow>
          {genres.map(g => (
            <GenreChip key={g} to={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</GenreChip>
          ))}
        </GenreRow>
      </Section>

      </main>
      <Footer />
      <MobileBottomNav />
      <div className="bottom-nav-spacer" />
      <style>{`@media(max-width:480px){.card-skeleton{width:130px!important}}`}</style>
    </>
  )
}

export default Home
