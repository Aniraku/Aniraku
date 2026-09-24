import {
  useState,
  useEffect,
  useMemo,
  useRef,
  Fragment,
  type CSSProperties,
  type TouchEvent,
} from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { fetchAiringDay, type AiringEntry } from '../index';
import { useNsfw, filterAdult } from '../hooks/useNsfw';
import { watchPathFor } from '../utils/animePaths';
import { useSeo, breadcrumbLd } from '../utils/seo';

const PageWrapper = styled.div`
  --animation-duration: 0.4s;
  --animation-timing: ease-in-out;
  --animation-easing: ease-in-out;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 125rem;
  margin: 0 auto;
`;

// Visually-hidden heading, same as live `.vh`.
const VisuallyHiddenH1 = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/* ---------------------------------------------------------- quick nav --- */

const QuickNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.5rem;
`;

const QuickNavGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
`;

const QuickNavButton = styled.button`
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--global-text);
  cursor: pointer;
  background: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  &:hover {
    border-color: var(--global-text);
  }
  &:active {
    transform: scale(0.98);
  }
  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

/* ------------------------------------------------------------ day strip -- */

const DayStripScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: auto hidden;
  text-align: center;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const DayStripWrapper = styled.div`
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

const DayName = styled.p<{ $selected: boolean }>`
  margin: 0;
  font-size: 2.5rem;
  color: ${({ $selected }) =>
    $selected ? 'var(--global-text)' : 'var(--global-text-muted)'};
  cursor: pointer;

  @media (max-width: 700px) {
    font-size: 2rem;
  }
`;

const DaySeparator = styled.span`
  margin: 0;
  font-size: 2.5rem;
  color: var(--global-text-muted);
  cursor: default;

  @media (max-width: 700px) {
    font-size: 2rem;
  }
`;

const DaySub = styled.span`
  margin-top: -0.25rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1;
  color: var(--global-text-muted);
`;

/* --------------------------------------------------------- airing slots -- */

const AiringContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  border-radius: var(--global-border-radius);
`;

const TimeSlot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AiringTime = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--global-text);

  svg {
    color: var(--schedule-airing-color);
  }
`;

const EntriesContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
`;

const VerticalLine = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 0.15rem;
  margin-left: 0.375rem;
  background-color: var(--schedule-airing-color);
  border-radius: 0.1rem;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
`;

const EmptyState = styled.div`
  color: var(--global-text);
`;

/* ---------------------------------------------------------- slot card --- */
/* Live `_cardWrapper/_watchNow/_cardContainer_1t2k2` schedule card port. */

// Slug/watch URL construction moved to the shared live helpers
// (utils/animePaths — live `Q/$` = slugify/pickTitle, used by watchPathFor).

// Live `R()`: Sunday-based week start (midnight) containing `day`.
const weekStartOf = (day: Date): Date => {
  const start = new Date(day);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
};

const SlotBanner = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  z-index: var(--z-index-base);
  width: 80%;
  height: 100%;
  overflow: hidden;
`;

const SlotBannerImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(100%);
  transition: filter 0.3s ease-in-out;
`;

const SlotTag = styled.div`
  position: absolute;
  z-index: var(--z-index-sticky);
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--global-text);
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  transition: color 0.1s ease-in-out;
`;

const SlotEpisodeTag = styled(SlotTag)`
  bottom: 0.25rem;
  left: 4rem;
`;

const SlotTimeTag = styled(SlotTag)`
  right: 0.25rem;
  bottom: 0.25rem;
`;

const SlotCardContainer = styled.div`
  position: relative;
  display: grid;
  flex-grow: 1;
  grid-template-columns: 3.5rem minmax(0, 1fr);
  gap: 0.5rem;
  align-items: stretch;
  overflow: hidden;
  color: var(--global-text);
  background-color: var(--global-div);
  border-radius: var(--global-border-radius);
  outline: 1px solid
    var(--schedule-card-base-outline-color, var(--global-border-color));
  transition:
    color 0.1s ease-in-out,
    margin-left 0.2s ease-in-out;
  --animation-duration: 0.6s;
  --animation-timing: ease-in-out;
  --animation-easing: ease-in-out;

  &:hover {
    margin-left: 0.25rem;
    color: var(--schedule-card-hover-color, var(--primary-accent));
    outline: 1px solid
      var(
        --schedule-card-hover-outline-color,
        var(--schedule-card-hover-color, var(--global-text))
      );

    ${SlotTag} {
      color: var(--schedule-card-hover-color, var(--primary-accent));
    }
    ${SlotBannerImg} {
      filter: grayscale(0);
    }
  }
`;

const SlotThumb = styled.div`
  position: relative;
  z-index: var(--z-index-above);
  align-self: stretch;
  width: 3.5rem;
  min-width: 3.5rem;
  height: 4.5rem;
  min-height: 4.5rem;
  overflow: hidden;
  border-radius: var(--global-border-radius);
  box-shadow: 0 0 10px var(--global-shadow, rgba(0, 0, 0, 0.35));
`;

const SlotThumbImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SlotDetails = styled.div`
  position: relative;
  z-index: var(--z-index-above);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-content: flex-start;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: 0.5rem 0.25rem 0.25rem 0;
`;

const SlotTitle = styled.strong`
  display: -webkit-box;
  width: 100%;
  overflow: hidden;
  font-size: 0.95rem;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

const SlotWatchLink = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  text-decoration: none;
`;

const SlotWrapper = styled.div`
  flex: 1;
  min-width: 20rem;
  max-width: 50%;
  transition: width 0.4s ease-in-out;

  @media (max-width: 1000px) {
    width: 50%;
  }
  @media (max-width: 800px) {
    width: 100%;
    max-width: unset;
  }
`;

const ScheduleSlotCard = ({ entry }: { entry: AiringEntry }) => {
  const anime = entry.anime;
  const id = String(anime?.id ?? '');
  const title = anime?.title;
  const hoverStyle =
    anime?.color && anime.color !== '#999999'
      ? ({
          '--schedule-card-hover-color': anime.color,
          '--schedule-card-hover-outline-color': anime.color,
        } as CSSProperties)
      : undefined;
  // Normalized from the legacy 3-seg `/watch/{id}/{slug}/{ep}` to the
  // canonical slug+`?ep=` form (Watch reads ?ep first — trivially safe).
  const to = watchPathFor({ id, title }, entry.episode);
  const displayTitle = title?.english || title?.romaji || title?.native;
  const tooltip = [title?.english, title?.romaji, title?.native]
    .filter((value, index, list) => value && list.indexOf(value) === index)
    .join(' — ');
  return (
    <SlotWrapper>
      <SlotWatchLink to={to}>
        <SlotCardContainer className='animFadeIn' style={hoverStyle}>
          {anime?.cover && (
            <SlotBanner>
              <SlotBannerImg src={anime.cover} alt='' />
              <SkeletonOverlay />
            </SlotBanner>
          )}
          <SlotEpisodeTag>{`EP ${entry.episode}`}</SlotEpisodeTag>
          <SlotTimeTag>
            {new Date(entry.airingAt * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </SlotTimeTag>
          {anime?.image && (
            <SlotThumb>
              <SlotThumbImg src={anime.image} alt={title?.english || ''} />
            </SlotThumb>
          )}
          <SlotDetails>
            <SlotTitle title={tooltip}>{displayTitle}</SlotTitle>
          </SlotDetails>
        </SlotCardContainer>
      </SlotWatchLink>
    </SlotWrapper>
  );
};

/* ------------------------------------------------------------- skeleton -- */

const skeletonPulse = keyframes`
  0%,
  100% {
    background-color: var(--global-primary-skeleton);
  }
  25%,
  75% {
    background-color: var(--global-secondary-skeleton);
  }
  50% {
    background-color: var(--global-primary-skeleton);
  }
`;

const pulse = css`
  background-color: var(--global-primary-skeleton);
  animation: ${skeletonPulse} 2.5s ease-in-out infinite;
`;

const SkeletonCardFlex = styled.div`
  flex: 1;
  min-width: 20rem;
  max-width: 50%;
  transition:
    width 0.4s ease-in-out,
    padding 0.2s ease-in-out;

  &:hover {
    padding-left: 0.25rem;
  }

  @media (max-width: 1000px) {
    width: 50%;
  }
  @media (max-width: 800px) {
    width: 100%;
    max-width: unset;
  }
`;

const SkeletonSurface = styled.div`
  position: relative;
  display: flex;
  gap: 0.5rem;
  min-height: 4.5rem;
  overflow: hidden;
  background-color: var(--global-div);
  border-radius: var(--global-border-radius);
  outline: 1px solid var(--global-border-color);
`;

const SkeletonBanner = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 80%;
  height: 100%;
  opacity: 0.9;
  ${pulse}
`;

const SkeletonOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(-70deg, transparent -200%, var(--global-div) 80%);
`;

const SkeletonTag = styled.div`
  position: absolute;
  right: 0.25rem;
  bottom: 0.25rem;
  z-index: var(--z-index-sticky);
  width: 3.1rem;
  height: 1.25rem;
  border-radius: var(--global-border-radius);
  ${pulse}
`;

const SkeletonThumb = styled.div`
  position: relative;
  z-index: var(--z-index-above);
  width: 3.5rem;
  min-width: 3.5rem;
  height: 4.5rem;
  min-height: 4.5rem;
  border-radius: var(--global-border-radius);
  box-shadow: 0 0 10px var(--global-shadow, rgba(0, 0, 0, 0.35));
  ${pulse}
`;

const SkeletonDetails = styled.div`
  position: relative;
  z-index: var(--z-index-above);
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.45rem;
  justify-content: center;
`;

const SkeletonTitle = styled.div`
  width: 72%;
  height: 0.95rem;
  border-radius: var(--global-border-radius);
  ${pulse}
`;

const SkeletonSubtitle = styled.div`
  width: 50%;
  height: 0.75rem;
  border-radius: var(--global-border-radius);
  ${pulse}
`;

const ScheduleSkeletonCard = () => (
  <SkeletonCardFlex>
    <SkeletonSurface>
      <SkeletonBanner />
      <SkeletonOverlay />
      <SkeletonTag />
      <SkeletonThumb />
      <SkeletonDetails>
        <SkeletonTitle />
        <SkeletonSubtitle />
      </SkeletonDetails>
    </SkeletonSurface>
  </SkeletonCardFlex>
);

/* ---------------------------------------------------------------- toast -- */

// Inline error toast (live uses sonner: title + description).
const ErrorToast = styled.div`
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: var(--z-index-modal);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 20rem;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: var(--global-text);
  background-color: var(--global-card-bg);
  border: 1px solid var(--global-border-color);
  border-radius: 0.75rem;
  box-shadow: var(--global-card-shadow);
  animation: fadeIn 0.3s ease-in-out;
`;

const TOAST_DISMISS_MS = 4000;
const HOME_TAB_STATE_KEY = 'HOME_TAB_STATE';

/* ------------------------------------------------------------- helpers --- */

interface HomeTabState {
  activeTab?: string;
  pages?: number;
  selectedDay?: string | null;
  timestamp?: number;
}

const readHomeTabState = (): HomeTabState | null => {
  try {
    const raw = sessionStorage.getItem(HOME_TAB_STATE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as HomeTabState;
    return null;
  } catch {
    return null;
  }
};

const dayFromState = (state: HomeTabState | null): Date => {
  const stored = state?.selectedDay;
  if (typeof stored !== 'string') return new Date();
  const parsed = new Date(stored);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

// Parse a slot label like "07:00 PM" or "19:00" into minutes past midnight.
const parseTimeLabel = (label: string): number | null => {
  const match = label.match(/(\d{1,2})[:\s](\d{2})/);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const isPM = /PM/i.test(label);
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return hour * 60 + minute;
};

const sortTimeLabels = (labels: string[]): string[] =>
  [...labels].sort((a, b) => {
    const minutesA = parseTimeLabel(a);
    const minutesB = parseTimeLabel(b);
    if (minutesA === null || minutesB === null) return a.localeCompare(b);
    return minutesA - minutesB;
  });

const timeLabelToDate = (label: string, day: Date): Date => {
  const [timePart, meridiem] = label.split(' ');
  const [hourStr, minuteStr] = (timePart ?? '').split(':');
  let hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return new Date(day);
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  const date = new Date(day);
  date.setHours(hour, minute, 0, 0);
  return date;
};

// Live schedule renders 5 fake time slots while loading.
const generateFakeTimes = (count: number): string[] =>
  Array.from({ length: count }, () => {
    const hour = Math.floor(Math.random() * 12) + 1;
    const minute = Math.floor(Math.random() * 60);
    const meridiem = Math.random() < 0.5 ? 'AM' : 'PM';
    return `${hour}:${String(minute).padStart(2, '0')} ${meridiem}`;
  });

// The `--schedule-airing-color` custom property is set per slot (inline).
const airingColorVar = (value: string): CSSProperties =>
  ({ '--schedule-airing-color': value }) as CSSProperties;

/* ------------------------------------------------------------- component - */

const Schedule = () => {
  const [initialState] = useState(readHomeTabState);
  const [selectedDay, setSelectedDay] = useState<Date>(() =>
    dayFromState(initialState),
  );
  const [weekData, setWeekData] = useState<{
    key: string;
    entries: AiringEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [fakeTimes, setFakeTimes] = useState<string[]>([]);

  const fetchSeq = useRef(0);
  const dayRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchActiveRef = useRef(false);

  // NSFW gate (Aniraku Schedule.jsx:511): Hentai-genre titles are dropped
  // from the visible week while NSFW is off; flips live with the setting.
  const { nsfwEnabled } = useNsfw();

  // SEO (ported from Aniraku's lib/seo.js setScheduleSEO).
  useSeo({
    title: 'Anime Schedule — Airing Calendar | Aniraku',
    description:
      'Check the latest anime airing schedule on Aniraku. Find out what anime episodes are airing today and this season.',
    canonicalPath: '/schedule',
    jsonLd: breadcrumbLd('Schedule', '/schedule'),
  });

  const persistState = (overrides: Partial<HomeTabState>) => {
    const prev = readHomeTabState();
    const next: HomeTabState = {
      activeTab: prev?.activeTab ?? 'newest',
      pages: prev?.pages,
      selectedDay: prev?.selectedDay ?? null,
      timestamp: Date.now(),
      ...overrides,
    };
    try {
      sessionStorage.setItem(HOME_TAB_STATE_KEY, JSON.stringify(next));
    } catch {
      // sessionStorage unavailable — ignore.
    }
  };

  const selectDay = (day: Date) => {
    setSelectedDay(day);
    persistState({ selectedDay: day.toISOString() });
  };

  // Rewrite an invalid stored day on mount (live behavior).
  useEffect(() => {
    const stored = initialState?.selectedDay;
    if (typeof stored !== 'string') return;
    if (Number.isNaN(new Date(stored).getTime())) {
      persistState({ selectedDay: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Midnight rollover: if the selected day is today, advance it at midnight.
  useEffect(() => {
    const nowDate = new Date();
    const msUntilMidnight =
      new Date(
        nowDate.getFullYear(),
        nowDate.getMonth(),
        nowDate.getDate() + 1,
      ).getTime() - nowDate.getTime();
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const selectedMidnight = new Date(selectedDay);
    selectedMidnight.setHours(0, 0, 0, 0);
    const timer = window.setTimeout(() => {
      if (selectedMidnight.getTime() === todayMidnight.getTime()) {
        setSelectedDay(new Date());
      }
    }, Math.max(0, msUntilMidnight + 50));
    return () => window.clearTimeout(timer);
  }, [selectedDay]);

  // Ticker for the current-time slot highlight (live updates every 60s).
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  // Fetch the Sunday-based week containing the selected day — one week-range
  // query with client-side day filtering, like live; AniList caps perPage at
  // 50, so paginate until the range is exhausted (guarded by fetchSeq).
  const weekKey = weekStartOf(selectedDay).toDateString();
  useEffect(() => {
    if (weekData && weekData.key === weekKey) return; // cached week
    const seq = ++fetchSeq.current;
    const start = weekStartOf(selectedDay);
    const startSec = Math.floor(start.getTime() / 1000);
    const endSec = startSec + 604800;
    setLoading(true);
    (async () => {
      try {
        const all: AiringEntry[] = [];
        for (let pageNum = 1; pageNum <= 40; pageNum++) {
          const { entries: batch, hasNextPage } = await fetchAiringDay(
            startSec,
            endSec,
            pageNum,
            50,
          );
          if (seq !== fetchSeq.current) return; // stale response
          all.push(...batch);
          if (!hasNextPage || batch.length === 0) break;
        }
        if (seq !== fetchSeq.current) return;
        setWeekData({ key: weekKey, entries: all });
        setError(null);
      } catch (err) {
        if (seq !== fetchSeq.current) return;
        console.error('Schedule failed:', err);
        setError('Failed to load airing schedule');
        setToastVisible(true);
      } finally {
        if (seq === fetchSeq.current) setLoading(false);
      }
    })();
  }, [weekKey, selectedDay, weekData]);

  // Hide the toast automatically, like a toast library would. The error
  // itself stays so the skeleton/empty-state logic matches the live route.
  useEffect(() => {
    if (!toastVisible) return;
    const timeout = window.setTimeout(
      () => setToastVisible(false),
      TOAST_DISMISS_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [toastVisible]);

  // Entries of the selected day, filtered from the cached week (live `P`).
  // NSFW gate (Aniraku Schedule.jsx:511): `filterAdult` runs over the week's
  // anime payloads first — Hentai titles vanish while the setting is off and
  // reappear the moment it flips — then the day filter picks from survivors.
  const weekReady = !!weekData && weekData.key === weekKey;
  const dayEntries = useMemo(() => {
    if (!weekReady || !weekData) return [];
    const keptAnime = new Set(
      filterAdult(
        weekData.entries.map((entry) => entry.anime),
        nsfwEnabled,
      ).map((anime) => anime?.id),
    );
    return weekData.entries.filter(
      (entry) =>
        keptAnime.has(entry.anime?.id) &&
        new Date(entry.airingAt * 1000).toDateString() ===
          selectedDay.toDateString(),
    );
  }, [weekReady, weekData, selectedDay, nsfwEnabled]);

  // Live: loading/error only show the skeleton while the day has no entries.
  const showSkeleton = error
    ? dayEntries.length === 0
    : (!weekReady || loading) && dayEntries.length === 0;

  useEffect(() => {
    if (showSkeleton && fakeTimes.length === 0) {
      setFakeTimes(generateFakeTimes(5));
    }
  }, [showSkeleton, fakeTimes.length]);

  // Group entries by floored hour, e.g. "07:00 PM".
  const grouped = useMemo(() => {
    const map: Record<string, AiringEntry[]> = {};
    for (const entry of dayEntries) {
      const date = new Date(entry.airingAt * 1000);
      const floored = new Date(date);
      floored.setMinutes(0, 0, 0);
      const key = floored.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    return map;
  }, [dayEntries]);

  const sortedTimes = useMemo(
    () => sortTimeLabels(Object.keys(grouped)),
    [grouped],
  );

  // Accent when the slot's first airing has already started, else muted.
  const slotColor = (label: string): string => {
    const firstAiring = grouped[label]?.[0]?.airingAt;
    const time =
      firstAiring != null
        ? new Date(firstAiring * 1000)
        : timeLabelToDate(label, selectedDay);
    return time <= now ? 'var(--primary-accent)' : 'var(--global-text-muted)';
  };

  // Quick-nav targets are computed relative to *today* (live behavior).
  const nav = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dow = today.getDay();
    const nextWeekend = new Date(today);
    const toSaturday = (6 - dow + 7) % 7;
    const isWeekend = dow === 6 || dow === 0;
    nextWeekend.setDate(
      nextWeekend.getDate() + toSaturday + (isWeekend ? 7 : 0),
    );
    const prevWeek = new Date(today);
    const mondayIndex = (dow + 6) % 7;
    prevWeek.setDate(prevWeek.getDate() - mondayIndex - 7);
    const selectedStr = selectedDay.toDateString();
    return {
      nextWeekend,
      isYesterday: selectedStr === yesterday.toDateString(),
      isToday: selectedStr === today.toDateString(),
      isTomorrow: selectedStr === tomorrow.toDateString(),
      isNextWeekend: selectedStr === nextWeekend.toDateString(),
      isPreviousWeek: selectedStr === prevWeek.toDateString(),
    };
  }, [selectedDay]);

  const goYesterday = () => {
    const day = new Date();
    day.setDate(day.getDate() - 1);
    selectDay(day);
  };
  const goTomorrow = () => {
    const day = new Date();
    day.setDate(day.getDate() + 1);
    selectDay(day);
  };
  const goPreviousWeek = () => {
    const day = new Date();
    const mondayIndex = (day.getDay() + 6) % 7;
    day.setDate(day.getDate() - mondayIndex - 7);
    selectDay(day);
  };
  const goNextWeekend = () => selectDay(new Date(nav.nextWeekend));

  const changeDay = (delta: number) => {
    const day = new Date(selectedDay);
    day.setDate(day.getDate() + delta);
    selectDay(day);
  };

  // Touch swipe: horizontal swipes (|dx| > 60, dominant) change the day.
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchActiveRef.current = true;
  };
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchActiveRef.current || !touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.abs(dy) > Math.abs(dx) * 1.2) touchActiveRef.current = false;
  };
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!touchActiveRef.current || !start) {
      touchActiveRef.current = false;
      touchStartRef.current = null;
      return;
    }
    const touch = e.changedTouches[0];
    touchActiveRef.current = false;
    touchStartRef.current = null;
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) changeDay(1);
      else changeDay(-1);
    }
  };

  // Sunday-based week containing the selected day.
  const weekDays = useMemo(() => {
    const start = new Date(selectedDay);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(day.getDate() + index);
      return day;
    });
  }, [selectedDay]);

  // Keep the selected day visible in the strip (scroll into view, centered).
  useEffect(() => {
    const index = weekDays.findIndex(
      (day) => day.toDateString() === selectedDay.toDateString(),
    );
    const element = dayRefs.current[index];
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [weekDays, selectedDay]);

  return (
    <PageWrapper className='animFadeIn'>
      <VisuallyHiddenH1>Anime Airing Schedule</VisuallyHiddenH1>

      <QuickNav aria-label='Schedule navigation'>
        <QuickNavGroup>
          <QuickNavButton
            onClick={goYesterday}
            disabled={nav.isYesterday}
            title='Yesterday'
          >
            Yesterday
          </QuickNavButton>
          <QuickNavButton
            onClick={() => selectDay(new Date())}
            disabled={nav.isToday}
            title='Today'
          >
            Today
          </QuickNavButton>
          <QuickNavButton
            onClick={goTomorrow}
            disabled={nav.isTomorrow}
            title='Tomorrow'
          >
            Tomorrow
          </QuickNavButton>
        </QuickNavGroup>
        <QuickNavGroup>
          <QuickNavButton
            onClick={goPreviousWeek}
            disabled={nav.isPreviousWeek}
            title='Previous week (Monday)'
          >
            Previous week
          </QuickNavButton>
          <QuickNavButton
            onClick={goNextWeekend}
            disabled={nav.isNextWeekend}
            title='Next weekend (Saturday)'
          >
            Next weekend
          </QuickNavButton>
        </QuickNavGroup>
      </QuickNav>

      <DayStripScroll>
        <DayStripWrapper>
          {weekDays.map((day, index) => {
            const selected = day.toDateString() === selectedDay.toDateString();
            return (
              <Fragment key={day.toISOString()}>
                <DayItem>
                  <DayName
                    ref={(element) => {
                      dayRefs.current[index] = element;
                    }}
                    $selected={selected}
                    onClick={() => selectDay(day)}
                  >
                    {day.toLocaleDateString('en-US', { weekday: 'long' })}
                  </DayName>
                  {selected && (
                    <DaySub>
                      {day.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                      })}
                    </DaySub>
                  )}
                </DayItem>
                {index < weekDays.length - 1 && (
                  <DaySeparator aria-hidden>/</DaySeparator>
                )}
              </Fragment>
            );
          })}
        </DayStripWrapper>
      </DayStripScroll>

      <AiringContainer
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {showSkeleton ? (
          fakeTimes.map((label, index) => (
            <TimeSlot key={`${label}-${index}`}>
              <AiringTime style={airingColorVar('var(--global-text-muted)')}>
                <FiChevronRight />
                {label}
              </AiringTime>
              <EntriesContainer>
                <VerticalLine
                  style={airingColorVar('var(--global-text-muted)')}
                />
                <CardsContainer>
                  {Array.from({ length: 3 }).map((_, cardIndex) => (
                    <ScheduleSkeletonCard key={cardIndex} />
                  ))}
                </CardsContainer>
              </EntriesContainer>
            </TimeSlot>
          ))
        ) : sortedTimes.length > 0 ? (
          sortedTimes.map((label) => {
            const color = slotColor(label);
            return (
              <TimeSlot key={label}>
                <AiringTime style={airingColorVar(color)}>
                  <FiChevronRight />
                  {label}
                </AiringTime>
                <EntriesContainer>
                  <VerticalLine style={airingColorVar(color)} />
                  <CardsContainer>
                    {grouped[label].map((entry) => (
                      <ScheduleSlotCard
                        key={`${entry.anime.id}-${entry.episode}-${entry.airingAt}`}
                        entry={entry}
                      />
                    ))}
                  </CardsContainer>
                </EntriesContainer>
              </TimeSlot>
            );
          })
        ) : (
          <EmptyState>No anime airing on this day.</EmptyState>
        )}
      </AiringContainer>

      {toastVisible && error && (
        <ErrorToast role='alert'>
          <strong>{error}</strong>
          <span>Please try again later.</span>
        </ErrorToast>
      )}
    </PageWrapper>
  );
};

export default Schedule;
