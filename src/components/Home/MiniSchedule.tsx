import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { fetchAiringDay, type AiringEntry } from '../../index';
import { infoPathFor } from '../../utils/animePaths';
import { resolveDisplayTitle } from '../../lib/displayLanguage';

// ---------------------------------------------------------------------------
// MiniSchedule (the live site 1:1) — "Estimated Airing Schedule" widget in the
// home side rail: big Sun–Sat day selector with date under the selection,
// fixed-height list with progress bar, hover poster, max 10 rows + View More.
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_ROWS = 10;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TitleBlock = styled.div`
  width: max-content;
`;

const Subtitle = styled.span`
  display: inline-block;
  width: 100%;
  margin: 0;
  font-size: 1rem;
  font-weight: 400;
  color: var(--global-text-muted);
`;

const HeaderLink = styled(Link)`
  position: relative;
  display: flex;
  align-items: center;
  max-width: max-content;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--global-text);
  text-decoration: none;
  border-radius: var(--global-border-radius);
  transition: all 0.2s ease-out;

  &:hover {
    padding-left: 0.25rem;
    color: var(--primary-accent);
  }
`;

const DayScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  /* mobile pass: the Sun–Sat row is wider than ~375px and scrolls (swipe).
       Centered + overflowing would park half of "Sun" LEFT of the scroll
       origin (unreachable in LTR); safe center start-aligns on overflow
       only — non-supporting browsers ignore this line and keep plain center */
  align-items: safe center;
  justify-content: center;
  width: 100%;
  overflow: auto hidden;
  text-align: center;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const DayWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  width: auto;
  margin: 0 auto;
  font-size: 2rem;
  font-weight: 700;
  color: var(--global-text);
  text-align: center;
  user-select: none;
`;

const DayItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: max-content;
`;

const WeekDay = styled.p<{ $active: boolean }>`
  margin: 0;
  font-size: 2.5rem;
  color: ${({ $active }) =>
    $active ? 'var(--global-text)' : 'var(--global-text-muted)'};
  cursor: pointer;

  @media (max-width: 700px) {
    font-size: 2rem;
  }
`;

const WeekDaySub = styled.p`
  margin-top: -0.25rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1;
  color: var(--global-text-muted);
`;

const Separator = styled.span`
  cursor: default;
`;

const List = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 28.875rem;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  &::before {
    position: absolute;
    top: var(--global-border-radius);
    left: 0;
    z-index: 1;
    width: 2px;
    height: var(--progress, 0%);
    max-height: calc(100% - 2 * var(--global-border-radius));
    content: '';
    background-color: var(--primary-accent);
    border-radius: 0 1px 1px 0;
  }
`;

const Row = styled(Link)<{ $aired: boolean }>`
  position: relative;
  box-sizing: border-box;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  height: 2.625rem;
  padding: 0 0.75rem;
  text-decoration: none;
  border-bottom: 1px solid var(--global-border-color);
  --time-color: var(--global-text-muted);
  --title-color: ${({ $aired }) =>
    $aired ? 'var(--global-text)' : 'var(--global-text-muted)'};

  &:nth-child(2n) {
    background-color: var(--global-div);
  }
  &:first-child {
    border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
  }
  &:last-child {
    border-bottom: none;
    border-radius: 0 0 var(--global-border-radius) var(--global-border-radius);
  }
  &:hover {
    background-color: var(--global-div);
    --time-color: var(--primary-accent);
    --title-color: var(--primary-accent);
  }
`;

const RowTime = styled.span`
  flex-shrink: 0;
  width: 3rem;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--time-color, var(--global-text-muted));
`;

const RowTitle = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 0.85rem;
  color: var(--title-color, var(--global-text-muted));
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowEpisode = styled.span`
  flex-shrink: 0;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  color: var(--title-color, var(--global-text-muted));
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const HoverCard = styled.img`
  position: absolute;
  right: 5rem;
  bottom: 50%;
  z-index: 1000;
  width: 7rem;
  pointer-events: none;
  border: 2px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  transform: translateY(50%);

  @media (max-width: 650px) {
    display: none;
  }
`;

const ViewMore = styled(Link)`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 2.625rem;
  font-size: 0.8rem;
  color: var(--global-text-muted);
  text-decoration: none;
  border-radius: 0 0 var(--global-border-radius) var(--global-border-radius);

  &:hover {
    color: var(--primary-accent);
    background-color: var(--global-div);
  }
`;

const Empty = styled.div`
  padding: 1.5rem;
  font-size: 0.8rem;
  color: var(--global-text-muted);
  text-align: center;
`;

const SkeletonRow = styled.div`
  height: 2.625rem;
  border-bottom: 1px solid var(--global-border-color);
  background-color: var(--global-primary-skeleton);
  opacity: 0.5;
`;

const formatTime = (airingAt: number) =>
  new Date(airingAt * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const sameDay = (airingAt: number, day: Date) =>
  new Date(airingAt * 1000).toDateString() === day.toDateString();

export const MiniSchedule: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [entries, setEntries] = useState<AiringEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);
  const selectedRef = useRef<HTMLParagraphElement>(null);

  // Week starts Sunday (the live site parity).
  const weekDays = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selectedDay]);

  // Local fetches per day (same output as the live week-fetch; reported as a
  // mechanism difference only).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const start = new Date(selectedDay);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        const { entries: list } = await fetchAiringDay(
          Math.floor(start.getTime() / 1000),
          Math.floor(end.getTime() / 1000),
          1,
          40,
        );
        if (!cancelled) setEntries(list);
      } catch (e) {
        console.error('Failed to load airing schedule', 'Please try again later.', e);
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedDay]);

  const dayEntries = useMemo(
    () =>
      entries
        .filter((e) => e.anime && sameDay(e.airingAt, selectedDay))
        .sort((a, b) => a.airingAt - b.airingAt),
    [entries, selectedDay],
  );

  const nowSec = Math.floor(Date.now() / 1000);
  const airedCount = dayEntries.filter((e) => e.airingAt <= nowSec).length;
  const progress =
    dayEntries.length > 0
      ? `${Math.round((airedCount / dayEntries.length) * 100)}%`
      : '0%';

  const visible = dayEntries.slice(0, MAX_ROWS);

  return (
    <Section aria-label='Airing schedule'>
      <TitleBlock>
        <Subtitle>Estimated</Subtitle>
        <HeaderLink to='/schedule'>Airing Schedule</HeaderLink>
      </TitleBlock>
      <DayScroll>
        <DayWrapper role='tablist' aria-label='Schedule day'>
          {weekDays.map((d, i) => {
            const active = sameDay(d.getTime() / 1000, selectedDay);
            const label = DAY_NAMES[d.getDay()];
            return (
              <React.Fragment key={label}>
                {i > 0 && <Separator aria-hidden='true'>/</Separator>}
                <DayItem role='tab' aria-selected={active}>
                  <WeekDay
                    $active={active}
                    ref={active ? selectedRef : undefined}
                    onClick={() => setSelectedDay(new Date(d))}
                  >
                    {label}
                  </WeekDay>
                  {active && (
                    <WeekDaySub>
                      {d.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </WeekDaySub>
                  )}
                </DayItem>
              </React.Fragment>
            );
          })}
        </DayWrapper>
      </DayScroll>
      {loading ? (
        <List>
          {Array.from({ length: 11 }, (_, i) => (
            <SkeletonRow key={i} />
          ))}
        </List>
      ) : (
        <List
          style={{ ['--progress' as string]: progress } as React.CSSProperties}
          key={selectedDay.toDateString()}
        >
          {dayEntries.length === 0 ? (
            <Empty>No anime airing on this day.</Empty>
          ) : (
            <>
              {visible.map((e, i) => {
                const aired = e.airingAt <= nowSec;
                const time = formatTime(e.airingAt);
                const prevTime =
                  i > 0 ? formatTime(dayEntries[i - 1].airingAt) : null;
                const name = resolveDisplayTitle(e.anime.title);
                return (
                  <Row
                    key={`${e.anime.id}-${e.episode}-${e.airingAt}`}
                    to={infoPathFor(e.anime)}
                    title={name}
                    $aired={aired}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <RowTime>{time === prevTime ? '' : time}</RowTime>
                    <RowTitle>{name}</RowTitle>
                    <RowEpisode>EP {e.episode}</RowEpisode>
                    {hovered === i && (
                      <HoverCard
                        src={e.anime.image || e.anime.coverImage?.large || ''}
                        alt=''
                      />
                    )}
                  </Row>
                );
              })}
              {dayEntries.length > MAX_ROWS && (
                <ViewMore to='/schedule'>View More</ViewMore>
              )}
            </>
          )}
        </List>
      )}
    </Section>
  );
};
