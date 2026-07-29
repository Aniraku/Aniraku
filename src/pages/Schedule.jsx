import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { anilistQuery, BROWSE_QUERY } from '../lib/anilist'
import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import styled from 'styled-components'

const Page = styled.div`min-height:100vh;background:var(--bg);`
const Container = styled.div`max-width:1400px;margin:0 auto;padding:1.5rem;padding-top:calc(var(--header-h) + 1.5rem);@media(max-width:480px){padding:1rem 12px;padding-top:calc(var(--header-h) + 1rem);}`
const Title = styled.h1`font-size:1.5rem;font-weight:700;color:var(--text-primary);margin-bottom:0.5rem;@media(max-width:480px){font-size:1.25rem;}`
const Subtitle = styled.p`color:var(--text-secondary);font-size:14px;margin-bottom:2rem;@media(max-width:480px){display:none;}`
const DaysRow = styled.div`display:flex;gap:8px;margin-bottom:2rem;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;&::-webkit-scrollbar{display:none;}@media(max-width:480px){gap:6px;margin-bottom:1.25rem;}`
const DayTab = styled.button`padding:10px 20px;border-radius:var(--radius-full);border:1px solid var(--border);background:${({ active }) => active ? 'var(--accent)' : 'var(--bg-elevated)'};color:${({ active }) => active ? '#000' : 'var(--text-secondary)'};font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all 0.2s;&:hover{border-color:var(--accent);color:${({ active }) => active ? '#000' : 'var(--accent)'};}@media(max-width:480px){padding:8px 14px;font-size:12px;}`
const List = styled.div`display:flex;flex-direction:column;gap:8px;`
const Card = styled(Link)`display:flex;align-items:center;gap:16px;padding:12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);text-decoration:none;color:inherit;transition:border-color 0.2s,transform 0.15s;&:hover{border-color:var(--accent);transform:translateY(-2px);}`
const Thumb = styled.img`width:50px;height:70px;object-fit:cover;border-radius:var(--radius-sm);flex-shrink:0;`
const Info = styled.div`flex:1;min-width:0;`
const Name = styled.p`font-size:14px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${Card}:hover &{color:var(--accent);}`
const Meta = styled.p`font-size:12px;color:var(--text-secondary);margin-top:2px;`
const Time = styled.span`font-size:13px;font-weight:600;color:var(--accent);white-space:nowrap;`
const Empty = styled.div`text-align:center;padding:4rem 1rem;color:var(--text-muted);font-size:15px;`

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const Schedule = () => {
  const [activeDay, setActiveDay] = React.useState(() => {
    const today = new Date().getDay()
    return DAYS[today === 0 ? 6 : today - 1]
  })

  const { data, isLoading, error } = useQuery(['schedule'], async () => {
    const variables = { page: 1, perPage: 100, status: 'RELEASING', sort: ['POPULARITY_DESC'] }
    const { data } = await anilistQuery(BROWSE_QUERY, variables)
    const media = data.Page.media || []

    const scheduled = []
    for (const m of media) {
      if (m.nextAiringEpisode?.airingAt) {
        const airDate = new Date(m.nextAiringEpisode.airingAt * 1000)
        const dayIndex = airDate.getDay()
        const dayName = DAYS[dayIndex === 0 ? 6 : dayIndex - 1]
        scheduled.push({
          id: m.id,
          title: m.title,
          coverImage: m.coverImage,
          format: m.format,
          episode: m.nextAiringEpisode.episode,
          airingAt: m.nextAiringEpisode.airingAt,
          day: dayName,
        })
      }
    }
    return scheduled
  }, { staleTime: 30 * 60 * 1000 })

  const [searchQuery, setSearchQuery] = React.useState('')

  const items = Array.isArray(data) ? data : []
  const dayItems = items.filter(item => {
    if (item.day !== activeDay) return false
    if (!searchQuery.trim()) return true
    const title = (item.title?.english || item.title?.romaji || '').toLowerCase()
    return title.includes(searchQuery.toLowerCase().trim())
  })

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts * 1000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Page>
      <NavBar />
      <Container>
        <Title>Airing Schedule</Title>
        <Subtitle>See when your favorite anime air next</Subtitle>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search schedule..." style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 12, outline: 'none' }} />
        <DaysRow>
          {DAYS.map(day => (
            <DayTab key={day} active={activeDay === day ? 1 : 0} onClick={() => setActiveDay(day)}>
              {day.slice(0, 3)}
            </DayTab>
          ))}
        </DaysRow>
        {isLoading ? (
          <List>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 94, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </List>
        ) : error ? (
          <Empty>Failed to load schedule. Please try again later.</Empty>
        ) : dayItems.length === 0 ? (
          <Empty>No anime scheduled for {activeDay}.</Empty>
        ) : (
          <List>
            {dayItems.map((item, idx) => (
              <Card key={item.id || idx} to={`/anime/${item.id}`}>
                <Thumb src={item.coverImage?.large || ''} alt="" />
                <Info>
                  <Name>{item.title?.english || item.title?.romaji || 'Unknown'}</Name>
                  <Meta>{item.format || 'TV'} · Ep {item.episode}</Meta>
                </Info>
                <Time>{formatTime(item.airingAt)}</Time>
              </Card>
            ))}
          </List>
        )}
      </Container>
      <Footer />
      <MobileBottomNav />
      <div className="bottom-nav-spacer" />
    </Page>
  )
}

export default Schedule
