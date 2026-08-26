import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { FaArrowRight, FaCalendarAlt, FaClock, FaSearch, FaTimes, FaTv } from 'react-icons/fa'
import { getAnirakuSchedule } from '../lib/anilist'
import { filterAdult, useNsfw, useStreamable } from '../hooks/useNsfw'
import Footer from '../components/Footer/Footer'
import { setScheduleSEO } from '../lib/seo'
import { generateSlug } from '../lib/slug'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const Page = styled.main`
  min-height: 100vh;
  padding-top: var(--header-h);
  background:
    radial-gradient(circle at 82% 4%, rgba(139, 92, 246, 0.14), transparent 25%),
    radial-gradient(circle at 5% 46%, rgba(34, 197, 94, 0.05), transparent 18%),
    var(--bg);
`

const Container = styled.div`
  width: min(100%, 1360px);
  margin: 0 auto;
  padding: clamp(24px, 4vw, 48px) clamp(12px, 3vw, 40px) 88px;
`

const PlannerHeader = styled.header`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 10px;
    color: var(--accent);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: var(--text-primary);
    font-size: clamp(30px, 4vw, 46px);
    letter-spacing: -0.055em;
    line-height: 0.98;
  }

  p {
    max-width: 60ch;
    margin: 10px 0 0;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.55;
  }

  @media (max-width: 720px) {
    align-items: start;
    flex-direction: column;
    gap: 12px;
  }
`

const TimezonePill = styled.div`
  display: inline-flex;
  min-height: 38px;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--bg-card) 90%, transparent);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 750;
  white-space: nowrap;

  svg { color: var(--accent); }
`

const PlannerLayout = styled.section`
  display: grid;
  grid-template-columns: minmax(218px, 0.27fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
`

const WeekPanel = styled.aside`
  position: sticky;
  top: calc(var(--header-h) + 16px);
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  box-shadow: var(--shadow-sm);

  @media (max-width: 900px) {
    position: static;
    padding: 10px;
  }
`

const WeekPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  padding: 1px 2px;

  h2 { margin: 0; color: var(--text-primary); font-size: 13px; letter-spacing: -0.01em; }
  span { color: var(--text-muted); font-size: 10px; font-weight: 750; }

  @media (max-width: 900px) { display: none; }
`

const DayRail = styled.nav`
  display: grid;
  gap: 6px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 5px;
    padding: 1px;
  }
`

const DayButton = styled.button`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  min-height: 58px;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px;
  border: 1px solid ${({ $active }) => ($active ? 'color-mix(in srgb, var(--accent) 80%, var(--border))' : 'transparent')};
  border-radius: 11px;
  background: ${({ $active }) => ($active ? 'color-mix(in srgb, var(--accent) 12%, var(--bg-card))' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--text-primary)' : 'var(--text-secondary)')};
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast), color var(--transition-fast);

  .date {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border-radius: 9px;
    background: ${({ $active }) => ($active ? 'var(--accent)' : 'var(--bg-card)')};
    color: ${({ $active }) => ($active ? 'var(--bg)' : 'var(--text-primary)')};
    font-size: 13px;
    font-weight: 850;
  }

  .day { overflow: hidden; font-size: 12px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
  .today { display: block; margin-top: 2px; color: ${({ $active }) => ($active ? 'var(--accent)' : 'var(--text-muted)')}; font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .count { min-width: 20px; color: ${({ $active }) => ($active ? 'var(--text-primary)' : 'var(--text-muted)')}; font-size: 11px; font-weight: 800; text-align: right; }

  &:hover { border-color: var(--border-hover); background: var(--bg-card); }
  &:active { transform: scale(0.98); }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    min-width: 0;
    min-height: 58px;
    place-items: center;
    gap: 2px;
    padding: 7px 3px;
    text-align: center;

    .date { width: 26px; height: 26px; border-radius: 7px; font-size: 11px; }
    .day { font-size: 10px; }
    .today { display: none; }
    .count { display: none; }
  }

  @media (max-width: 420px) {
    min-height: 54px;
    padding: 6px 1px;
    .date { width: 24px; height: 24px; font-size: 10px; }
    .day { font-size: 9px; }
  }
`

const ScheduleBoard = styled.section`
  min-width: 0;
  padding: clamp(14px, 2.2vw, 24px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-elevated) 94%, transparent);
  box-shadow: var(--shadow-sm);
`

const BoardTop = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(210px, 0.74fr) auto;
  align-items: end;
  gap: 12px;

  h2 { margin: 0; color: var(--text-primary); font-size: clamp(20px, 2.5vw, 28px); letter-spacing: -0.045em; }
  p { margin: 5px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.45; }

  @media (max-width: 820px) {
    grid-template-columns: minmax(0, 1fr) auto;
    > :first-child { grid-column: 1 / -1; }
  }
  @media (max-width: 580px) { grid-template-columns: 1fr; align-items: stretch; > :first-child { grid-column: auto; } }
`

const SearchBox = styled.label`
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 9px;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-card);
  transition: border-color var(--transition-fast), background var(--transition-fast);

  &:focus-within { border-color: var(--accent); background: var(--bg-elevated); }
  > svg { flex: 0 0 auto; color: var(--text-muted); }
  input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text-primary); font: inherit; font-size: 12px; }
  input::placeholder { color: var(--text-muted); }
`

const ClearSearch = styled.button`
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: var(--text-secondary);
  &:hover { background: var(--bg-secondary); color: var(--text-primary); }
`

const TodayButton = styled.button`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);

  svg { color: var(--accent); }
  &:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--bg-card)); }
  &:active { transform: scale(0.97); }
`

const FeaturedRelease = styled(Link)`
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  margin: 18px 0;
  padding: 12px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--accent) 46%, var(--border));
  border-radius: 14px;
  background:
    linear-gradient(100deg, color-mix(in srgb, var(--accent) 12%, var(--bg-card)) 0%, var(--bg-card) 75%);
  color: inherit;
  text-decoration: none;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);

  &:hover { transform: translateY(-2px); border-color: var(--accent); background: linear-gradient(100deg, color-mix(in srgb, var(--accent) 18%, var(--bg-card)) 0%, var(--bg-card) 75%); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

  @media (max-width: 620px) { grid-template-columns: 66px minmax(0, 1fr); gap: 12px; }
`

const FeaturedPoster = styled.div`
  width: 96px;
  height: 108px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--bg-elevated);
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  @media (max-width: 620px) { width: 66px; height: 82px; }
`

const FeaturedCopy = styled.div`
  min-width: 0;
  .label { display: flex; align-items: center; gap: 6px; color: var(--accent); font-size: 10px; font-weight: 850; letter-spacing: 0.1em; text-transform: uppercase; }
  h3 { margin: 7px 0 0; overflow: hidden; color: var(--text-primary); font-size: clamp(17px, 2.2vw, 22px); letter-spacing: -0.03em; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 7px 0 0; color: var(--text-secondary); font-size: 12px; }
  strong { color: var(--text-primary); }

  @media (max-width: 620px) {
    h3 { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; text-overflow: clip; white-space: normal; }
  }
`

const FeaturedAction = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  svg { color: var(--accent); }
  @media (max-width: 620px) { display: none; }
`

const TimelineHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 3px;

  h3 { margin: 0; color: var(--text-primary); font-size: 13px; letter-spacing: -0.01em; }
  p { margin: 4px 0 0; color: var(--text-muted); font-size: 11px; }
`

const Count = styled.span`
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 800;
`

const Timeline = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 12px;
`

const TimelineCard = styled(Link)`
  display: grid;
  grid-template-columns: 78px 54px minmax(0, 1fr) auto;
  gap: 12px;
  min-height: 78px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--bg-card);
  color: inherit;
  text-decoration: none;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);

  &:hover { transform: translateX(2px); border-color: var(--border-hover); background: var(--bg-elevated); box-shadow: var(--shadow-sm); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

  @media (max-width: 620px) {
    grid-template-columns: 52px 46px minmax(0, 1fr);
    gap: 9px;
    min-height: 70px;
    padding: 7px;
  }
`

const TimelineTime = styled.div`
  display: grid;
  justify-items: start;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 800;
  strong { color: var(--text-primary); font-size: 13px; }
  span { color: var(--text-muted); font-size: 9px; font-weight: 750; }
  @media (max-width: 620px) { strong { font-size: 11px; } }
`

const Poster = styled.div`
  width: 54px;
  height: 62px;
  overflow: hidden;
  border-radius: 7px;
  background: var(--bg-elevated);
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  @media (max-width: 620px) { width: 46px; height: 56px; }
`

const AiringInfo = styled.div`
  min-width: 0;
  h3 { margin: 0; overflow: hidden; color: var(--text-primary); font-size: 13px; font-weight: 790; letter-spacing: -0.012em; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 5px 0 0; color: var(--text-secondary); font-size: 11px; }
  .episode { color: var(--accent); font-weight: 800; }

  @media (max-width: 620px) {
    h3 { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-height: 1.25; text-overflow: clip; white-space: normal; }
  }
`

const ViewDetails = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
  svg { color: var(--accent); }
  @media (max-width: 620px) { display: none; }
`

const EmptyState = styled.div`
  display: grid;
  min-height: 240px;
  place-items: center;
  padding: 28px;
  border: 1px dashed var(--border-hover);
  border-radius: 14px;
  color: var(--text-muted);
  text-align: center;

  svg { margin-bottom: 12px; color: var(--accent); }
  h2 { margin: 0; color: var(--text-primary); font-size: 18px; }
  p { margin: 8px 0 0; font-size: 13px; }
  button { margin-top: 16px; min-height: 38px; padding: 0 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card); color: var(--text-primary); font: inherit; font-size: 12px; font-weight: 750; cursor: pointer; }
`

const SkeletonCard = styled.div`
  min-height: 78px;
  border-radius: 11px;
  background: linear-gradient(110deg, var(--bg-card) 28%, var(--bg-elevated) 40%, var(--bg-card) 52%);
  background-size: 220% 100%;
  animation: scheduleShimmer 1.35s linear infinite;

  @keyframes scheduleShimmer { to { background-position: -220% 0; } }
`

const dayNameFor = (timestamp) => DAYS[new Date(timestamp * 1000).getDay() === 0 ? 6 : new Date(timestamp * 1000).getDay() - 1]

function upcomingScheduleWindow() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start, startAt: Math.floor(start.getTime() / 1000), endAt: Math.floor(end.getTime() / 1000) }
}

const Schedule = () => {
  const week = useMemo(() => upcomingScheduleWindow(), [])
  const todayDay = dayNameFor(week.startAt)
  const [activeDay, setActiveDay] = useState(todayDay)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error, refetch } = useQuery(['schedule', week.startAt, week.endAt], async () => {
    const { schedule } = await getAnirakuSchedule({ page: 1, perPage: 100, startAt: week.startAt, endAt: week.endAt })
    return schedule
      .filter((media) => media.nextAiringEpisode?.airingAt)
      .map((media) => ({
        id: media.id,
        title: media.title,
        coverImage: media.coverImage,
        format: media.format,
        episode: media.nextAiringEpisode.episode,
        airingAt: media.nextAiringEpisode.airingAt,
        day: dayNameFor(media.nextAiringEpisode.airingAt),
      }))
      .sort((a, b) => a.airingAt - b.airingAt)
  }, { staleTime: 30 * 60 * 1000 })

  useEffect(() => {
    const timeout = setTimeout(() => setSearchQuery(searchInput.trim()), 260)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => { setScheduleSEO() }, [])

  const dayOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(week.start)
      date.setDate(week.start.getDate() + index)
      const day = dayNameFor(Math.floor(date.getTime() / 1000))
      return {
        day,
        label: day.slice(0, 3),
        date: date.toLocaleDateString([], { day: 'numeric' }),
        fullDate: date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
        isToday: index === 0,
      }
    })
  }, [week.start])

  const { nsfwEnabled } = useNsfw()
  const streamed = useStreamable(filterAdult(Array.isArray(data) ? data : [], nsfwEnabled))
  const titleFor = (item) => item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown title'
  const formatTime = (timestamp) => new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const relativeTime = (timestamp) => {
    const diff = timestamp * 1000 - Date.now()
    const minutes = Math.round(Math.abs(diff) / 60000)
    if (minutes < 2) return diff >= 0 ? 'Airing now' : 'Aired moments ago'
    if (minutes < 60) return diff >= 0 ? `In ${minutes} min` : `${minutes} min ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return diff >= 0 ? `In ${hours}h` : `${hours}h ago`
    const days = Math.round(hours / 24)
    return diff >= 0 ? `In ${days}d` : `${days}d ago`
  }

  const normalizeSearchText = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const dayItems = streamed.filter((item) => {
    if (item.day !== activeDay) return false
    return !searchQuery || normalizeSearchText(titleFor(item)).includes(normalizeSearchText(searchQuery))
  })
  const dayCounts = useMemo(() => Object.fromEntries(dayOptions.map(({ day }) => [day, streamed.filter((item) => item.day === day).length])), [dayOptions, streamed])
  const activeDate = dayOptions.find((item) => item.day === activeDay)
  const upcomingOnActiveDay = dayItems.find((item) => item.airingAt * 1000 >= Date.now()) || dayItems[0]
  const resetToToday = () => { setActiveDay(todayDay); setSearchInput('') }

  return (
    <>
      <Page>
        <Container>
          <PlannerHeader>
            <div>
              <div className="eyebrow"><FaCalendarAlt size={12} /> Weekly anime planner</div>
              <h1>Plan the shows you want to catch.</h1>
              <p>Today appears first, followed by the next six local dates and their confirmed upcoming releases.</p>
            </div>
            <TimezonePill><FaTv size={13} /> Your device timezone</TimezonePill>
          </PlannerHeader>

          <PlannerLayout>
            <WeekPanel>
              <WeekPanelHeader><h2>Next 7 days</h2><span>{streamed.length} releases</span></WeekPanelHeader>
              <DayRail aria-label="Select a day of the week">
                {dayOptions.map((option) => (
                  <DayButton key={option.day} type="button" $active={activeDay === option.day} aria-pressed={activeDay === option.day} onClick={() => setActiveDay(option.day)}>
                    <span className="date">{option.date}</span>
                    <span><span className="day">{option.label}</span>{option.isToday && <span className="today">Today</span>}</span>
                    <span className="count">{dayCounts[option.day] || 0}</span>
                  </DayButton>
                ))}
              </DayRail>
            </WeekPanel>

            <ScheduleBoard>
              <BoardTop>
                <div>
                  <h2>{activeDate?.fullDate || activeDay}</h2>
                  <p>{isLoading ? 'Loading confirmed episode times…' : `${dayCounts[activeDay] || 0} scheduled ${dayCounts[activeDay] === 1 ? 'episode' : 'episodes'} · Every time is local to you`}</p>
                </div>
                <SearchBox>
                  <FaSearch size={13} />
                  <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={`Search ${activeDay}'s releases`} aria-label="Search releases on the selected day" />
                  {searchInput && <ClearSearch type="button" onClick={() => setSearchInput('')} aria-label="Clear schedule search"><FaTimes size={12} /></ClearSearch>}
                </SearchBox>
                <TodayButton type="button" onClick={resetToToday}><FaCalendarAlt size={12} /> Today</TodayButton>
              </BoardTop>

              {isLoading ? (
                <Timeline>{Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />)}</Timeline>
              ) : error ? (
                <EmptyState>
                  <div><FaCalendarAlt size={23} /><h2>The planner could not load.</h2><p>Please check your connection and try again.</p><button type="button" onClick={() => refetch()}>Try again</button></div>
                </EmptyState>
              ) : dayItems.length === 0 ? (
                <EmptyState>
                  <div><FaClock size={23} /><h2>No matching releases.</h2><p>{searchQuery ? `Nothing on ${activeDay} matches “${searchQuery}”.` : `No release time is listed for ${activeDay} right now.`}</p>{searchQuery && <button type="button" onClick={() => setSearchInput('')}>Clear search</button>}</div>
                </EmptyState>
              ) : (
                <>
                  {upcomingOnActiveDay && (
                    <FeaturedRelease to={`/anime/${generateSlug(titleFor(upcomingOnActiveDay))}-${upcomingOnActiveDay.id}`} title={`Open ${titleFor(upcomingOnActiveDay)}`}>
                      <FeaturedPoster>{upcomingOnActiveDay.coverImage?.large ? <img src={upcomingOnActiveDay.coverImage.large} alt="" loading="eager" /> : null}</FeaturedPoster>
                      <FeaturedCopy>
                        <div className="label"><FaClock size={10} /> {relativeTime(upcomingOnActiveDay.airingAt)}</div>
                        <h3>{titleFor(upcomingOnActiveDay)}</h3>
                        <p><strong>Episode {upcomingOnActiveDay.episode}</strong> · {upcomingOnActiveDay.format || 'TV'} · {formatTime(upcomingOnActiveDay.airingAt)}</p>
                      </FeaturedCopy>
                      <FeaturedAction>Open title <FaArrowRight size={10} /></FeaturedAction>
                    </FeaturedRelease>
                  )}

                  <TimelineHeader>
                    <div><h3>{searchQuery ? 'Matching releases' : 'Release timeline'}</h3><p>Ordered by the time each episode becomes available.</p></div>
                    <Count>{dayItems.length} {dayItems.length === 1 ? 'episode' : 'episodes'}</Count>
                  </TimelineHeader>
                  <Timeline>
                    {dayItems.map((item) => {
                      const title = titleFor(item)
                      return (
                        <TimelineCard key={item.id} to={`/anime/${generateSlug(title)}-${item.id}`} title={`Open ${title}`}>
                          <TimelineTime><strong>{formatTime(item.airingAt)}</strong><span>{relativeTime(item.airingAt)}</span></TimelineTime>
                          <Poster>{item.coverImage?.large ? <img src={item.coverImage.large} alt="" loading="lazy" /> : null}</Poster>
                          <AiringInfo><h3>{title}</h3><p><span className="episode">Episode {item.episode}</span> · {item.format || 'TV'}</p></AiringInfo>
                          <ViewDetails>View title <FaArrowRight size={9} /></ViewDetails>
                        </TimelineCard>
                      )
                    })}
                  </Timeline>
                </>
              )}
            </ScheduleBoard>
          </PlannerLayout>
        </Container>
      </Page>
      <Footer />
      <div className="bottom-nav-spacer" />
    </>
  )
}

export default Schedule
