import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { FaPlay, FaFire, FaCalendarAlt, FaStar } from 'react-icons/fa'
import NavBar from '../components/NavBar/NavBar'
import Hero from '../components/Hero/Hero'
import ContinueWatching from '../components/ContinueWatching'
import Trending from '../components/Trending/Trending'
import Featured from '../components/Featured/Featured'
import Footer from '../components/Footer/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import { useLatestEpisode, useAiring, useGenre } from '../hooks/useAnime'

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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
`

const ScheduleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
`

const DayCard = styled(Link)`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  text-decoration: none;
  color: var(--text-primary);
  text-align: center;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
  &:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  @media (hover: none) and (pointer: coarse) {
    &:active { opacity: 0.7; transform: scale(0.96); }
  }
  @media (max-width: 480px) {
    padding: 10px 8px;
    border-radius: 8px;
  }
`

const DayLabel = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 4px;
`

const DayCount = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
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
  gap: 10px;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding: 0 1rem;
  padding-bottom: 8px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  @media (max-width: 480px) {
    gap: 8px;
    margin-bottom: 1.5rem;
    padding: 0 12px;
  }
`

const QuickLink = styled(Link)`
  flex: 0 0 auto;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 18px;
  text-decoration: none;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
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

const Home = () => {
  const { data: latest = [] } = useLatestEpisode()
  const { data: airing = [] } = useAiring()

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date().getDay()

  const genres = [
    'Action', 'Romance', 'Comedy', 'Sci-Fi', 'Horror',
    'Slice of Life', 'Sports', 'Supernatural', 'Mystery', 'Drama',
    'NSFW'
  ]

  return (
    <>
      <NavBar />
      <Hero />
      <ContinueWatching />

      <QuickLinks>
        <QuickLink to="/catalog?sort=POPULARITY_DESC"><FaFire /> Most Popular</QuickLink>
        <QuickLink to="/catalog?status=RELEASING"><FaPlay /> Airing Now</QuickLink>
        <QuickLink to="/schedule"><FaCalendarAlt /> Schedule</QuickLink>
        <QuickLink to="/catalog?sort=SCORE_DESC"><FaStar /> Top Rated</QuickLink>
      </QuickLinks>

      <Section>
        <SectionTitle>
          Upcoming
          <Link to="/schedule">View All</Link>
        </SectionTitle>
        <ScheduleGrid>
          {days.map((day, i) => (
            <DayCard key={day} to={`/schedule?day=${day.toLowerCase()}`}>
              <DayLabel>{day}</DayLabel>
              <DayCount>{i === today ? 'Today' : (7 + i - today) % 7 || 7}</DayCount>
            </DayCard>
          ))}
        </ScheduleGrid>
      </Section>

      <Trending />
      <Featured />

      <Section>
        <SectionTitle>Browse by Genre</SectionTitle>
        <GenreRow>
          {genres.map(g => (
            <GenreChip key={g} to={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</GenreChip>
          ))}
        </GenreRow>
      </Section>

      <Footer />
      <MobileBottomNav />
      <div className="bottom-nav-spacer" />
    </>
  )
}

export default Home
