import { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { MdInfoOutline } from 'react-icons/md';
import { FaRegCirclePlay, FaRegClock, FaStar } from 'react-icons/fa6';
import { TbCards } from 'react-icons/tb';
import { Swiper, SwiperSlide, useSwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import { Autoplay, EffectFade, Keyboard } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { Anime } from '../../index';
import { infoPathFor, watchPathFor } from '../../utils/animePaths';

// ---------------------------------------------------------------------------
// Hero carousel (the live site 1:1) — fade crossfade swiper with the action
// buttons, airing badge and ‹ n / N › pager rendered outside the swiper.
// Slide content block bottom-left with animated slide transforms; title uses
// the per-anime gradient (--home-carousel-title-*).
// ---------------------------------------------------------------------------

const Wrapper = styled.div`
  position: relative;
  max-width: 100%;
  height: 30rem;
  overflow: hidden;
  user-select: none;
  border-radius: var(--global-border-radius);
  transition: 0.4s ease-in-out;

  @media (max-width: 1400px) {
    height: 26rem;
  }
  @media (max-width: 1000px) {
    height: 22rem;
  }
  @media (max-width: 500px) {
    height: 26rem;
  }
`;

const HeroSwiper = styled(Swiper)`
  height: 100%;
  touch-action: pan-y;
`;

const Slide = styled(SwiperSlide)`
  position: relative;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--global-border-radius);
`;

const SlideImage = styled.img`
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: transparent;
  border-radius: var(--global-border-radius);
  transition: opacity 0.5s ease-in-out;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  pointer-events: none;
`;

const DarkOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: var(--z-index-above, 2);
  pointer-events: none;
  background:
    linear-gradient(45deg, var(--global-primary-bg) 5%, transparent 60%),
    linear-gradient(0deg, var(--global-primary-bg) 1%, transparent 60%),
    linear-gradient(-45deg, var(--global-primary-bg) 5%, transparent 60%);
  border-radius: var(--global-border-radius);
`;

const ContentDetails = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  z-index: var(--z-index-sticky, 4);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 50%;
  padding: 0.5rem;
  overflow: hidden;
  border-radius: 1rem;
  transition:
    transform 0.4s ease-in-out,
    opacity 0.4s ease-in-out;
  will-change: transform;

  @media (max-width: 1000px) {
    right: 1rem;
    bottom: 3.75rem;
    max-width: 90%;
    margin: auto;
  }
  @media (max-width: 500px) {
    right: 1rem;
    /* mobile pass: the hero CTAs grow to 44px (ActionButton ≤500 block), so
       lift the details block to keep the 12px gap above them */
    bottom: 4.5rem;
    max-width: 100%;
    max-height: 18rem;
  }
`;

const DetailsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
`;

const InfoItem = styled.span`
  display: flex;
  flex-shrink: 0;
  gap: 0.25rem;
  align-items: center;
  padding: 0.3rem 0.6rem;
  font-size: clamp(0.75rem, 1.2vw, 0.9rem);
  font-weight: 500;
  color: var(--global-text);
  background: var(--global-div-tr-2);
  border: 1px solid var(--global-border-color);
  border-radius: 1rem;
`;

const TitleText = styled.div`
  font-size: clamp(1.4rem, 3vw, 2.5rem);
  font-weight: 700;
  color: var(--home-carousel-title-color, white);
  text-align: center;
  background: var(--home-carousel-title-gradient, linear-gradient(45deg, var(--global-text), gray));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const DescriptionText = styled.p`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: clamp(0.9rem, 1.5vw, 0.9rem);
  line-height: 1.2;
  color: var(--global-text-muted);
  text-align: center;
  text-overflow: ellipsis;
  white-space: normal;
  border-radius: var(--global-border-radius);
  transition: 0.2s ease-in-out;
  -webkit-box-orient: vertical;
  line-clamp: 3;
  -webkit-line-clamp: 3;

  @media (max-width: 1000px) {
    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
    line-height: 1.2;
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }
  @media (max-width: 800px) {
    display: none;
  }
`;

const ActionButtons = styled.div`
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  z-index: var(--z-index-sticky, 4);
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  @media (max-width: 1000px) {
    left: 1rem;
    gap: 0.5rem;
  }
`;

const ActionButton = styled(Link)`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0.85rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--global-text);
  text-align: center;
  text-decoration: none;
  pointer-events: auto;
  cursor: pointer;
  background: var(--global-div-tr-2);
  backdrop-filter: blur(10px) contrast(125%);
  -webkit-backdrop-filter: blur(10px) contrast(125%);
  border: 1px solid var(--global-border-color);
  border-radius: 2rem;
  transition: transform 0.2s ease-in-out;
  will-change: transform;

  &:hover,
  &:active,
  &:focus {
    border-color: var(--global-text);
    transform: scale(1.05);
  }

  @media (max-width: 1000px) {
    width: 6.5rem;
    height: 2rem;
    padding: 0.15rem 0.25rem;
    font-size: 0.7rem;
  }
  @media (max-width: 500px) {
    flex: 1;
    /* mobile pass: 2rem (32px) → 44px tap target for the hero Watch/Info CTAs */
    height: 2.75rem;
  }
`;

const BadgeWrapper = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: var(--z-index-sticky, 4);
  display: flex;
  gap: 0.5rem;
  align-items: center;
  pointer-events: none;
`;

const Badge = styled.div`
  display: flex;
  gap: 0.35rem;
  align-items: center;
  padding: 0.5rem 0.6rem;
  font-weight: 600;
  color: var(--global-text);
  background: var(--global-div-tr-2);
  backdrop-filter: blur(10px) contrast(125%);
  -webkit-backdrop-filter: blur(10px) contrast(125%);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const Pagination = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: var(--z-index-sticky, 4);
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const NavButton = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  color: var(--global-text);
  cursor: pointer;
  background: var(--global-div-tr-2);
  backdrop-filter: blur(10px) contrast(125%);
  -webkit-backdrop-filter: blur(10px) contrast(125%);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  &:hover {
    border-color: var(--global-text);
    transform: scale(1.05);
  }
  &:active {
    transform: scale(1);
  }

  @media (max-width: 500px) {
    display: none;
  }
`;

const Fraction = styled.div`
  min-width: 3.25rem;
  padding: 0.5rem;
  font-weight: 600;
  color: var(--global-text);
  text-align: center;
  pointer-events: none;
  background: var(--global-div-tr-2);
  backdrop-filter: blur(10px) contrast(125%);
  -webkit-backdrop-filter: blur(10px) contrast(125%);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  .swiper-pagination-current {
    font-size: 1rem;
  }
  .swiper-pagination-total {
    font-size: 0.65rem;
  }
`;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

// Fisher-Yates shuffle (live `nr`).
function shuffle<T>(input: T[]): T[] {
  const list = [...input];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Live `tr`: remaining-ms → "5D 3H" / "3H 5M" / "45s" / "Airing Now".
function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Airing Now';
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}D`);
  if (hours) parts.push(`${hours}H`);
  if (!days && minutes) parts.push(`${minutes}M`);
  return parts.join(' ');
}

const SlideDetails: FC<{ anime: Anime }> = ({ anime }) => {
  const slide = useSwiperSlide();

  const transform = !slide
    ? 'scale(1)'
    : slide.isActive
      ? 'scale(1) translateX(0)'
      : slide.isNext
        ? 'scale(0.95) translateX(10px)'
        : slide.isPrev
          ? 'scale(1.05) translateX(-10px)'
          : 'scale(1)';
  const opacity = !slide || slide.isActive ? 1 : slide.isNext || slide.isPrev ? 0.5 : 1;

  const name = anime.title?.english || anime.title?.romaji || '';
  const colorVars = anime.color
    ? ({
        ['--home-carousel-title-color' as string]: anime.color,
        ['--home-carousel-title-gradient' as string]: `linear-gradient(45deg, ${anime.color}, white)`,
      } as React.CSSProperties)
    : undefined;

  return (
    <ContentDetails style={{ transform, opacity }}>
      <DetailsRow>
        {anime.type && <InfoItem>{anime.type}</InfoItem>}
        {!!anime.totalEpisodes && (
          <InfoItem>
            <TbCards />
            {anime.totalEpisodes}
          </InfoItem>
        )}
        {!!anime.rating && (
          <InfoItem>
            <FaStar />
            {Math.round(anime.rating * 10)}
          </InfoItem>
        )}
        {!!anime.duration && (
          <InfoItem>
            <FaRegClock />
            {anime.duration} mins
          </InfoItem>
        )}
      </DetailsRow>
      <TitleText style={colorVars}>{name}</TitleText>
      <DetailsRow>
        {!!anime.genres?.length && (
          <InfoItem>{anime.genres.slice(0, 3).join(' · ')}</InfoItem>
        )}
        {!!anime.studios?.length && <InfoItem>{anime.studios[0]}</InfoItem>}
      </DetailsRow>
      {anime.description && (
        <DescriptionText>{stripHtml(anime.description)}</DescriptionText>
      )}
    </ContentDetails>
  );
};

interface HomeCarouselProps {
  data: Anime[];
  loading?: boolean;
  error?: string | null;
}

export const HomeCarousel: FC<HomeCarouselProps> = ({ data = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isSmall, setIsSmall] = useState(false);
  const [, setTick] = useState(0);
  const swiperRef = useRef<SwiperClass | null>(null);

  // Badge ticks once a minute (countdown freshness).
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // ≤500px uses the poster-first image selection (live `ir(e, useMedia(500))`).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 500px)');
    const update = () => setIsSmall(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Strict filter first (live `rr`), looser fallback so the hero never
  // disappears; then Fisher-Yates shuffle.
  const slides = useMemo(() => {
    const strict = data.filter(
      (a) =>
        !!a.title?.english &&
        !!a.description &&
        !!a.image &&
        !!a.cover &&
        a.cover !== a.image,
    );
    const base = strict.length
      ? strict
      : data.filter(
          (a) => !!(a.title?.english || a.title?.romaji) && !!(a.cover || a.image),
        );
    return shuffle(base);
  }, [data]);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  const active = slides[activeIndex];
  const nextAiring = active?.nextAiringEpisode;
  let badgeDisplay: string | null = null;
  if (nextAiring?.episode != null && nextAiring.airingAt) {
    const diffMs = nextAiring.airingAt * 1000 - Date.now();
    badgeDisplay =
      diffMs <= 0
        ? `EP ${nextAiring.episode} Airing Now`
        : `EP ${nextAiring.episode} ${formatCountdown(diffMs)}`;
  }

  return (
    <Wrapper>
      <HeroSwiper
        modules={[Autoplay, EffectFade, Keyboard]}
        effect='fade'
        fadeEffect={{ crossFade: true }}
        speed={800}
        autoplay={{ delay: 15000, disableOnInteraction: false }}
        loop={slides.length > 1}
        keyboard={{ enabled: true }}
        slidesPerView='auto'
        watchSlidesProgress
        grabCursor
        onSwiper={(sw) => {
          swiperRef.current = sw;
          setActiveIndex(sw.realIndex ?? 0);
        }}
        onSlideChange={(sw) => setActiveIndex(sw.realIndex)}
      >
        {slides.map((anime, idx) => {
          const name = anime.title?.english || anime.title?.romaji || '';
          const src = isSmall
            ? anime.image || anime.cover
            : anime.cover || anime.image;
          return (
            <Slide key={`${anime.id}-${idx}`}>
              <ImageContainer>
                <SlideImage
                  src={src}
                  alt={name}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  onLoad={() => setLoaded(true)}
                  style={{ opacity: loaded ? 1 : 0 }}
                />
                <ContentContainer>
                  <SlideDetails anime={anime} />
                </ContentContainer>
                <DarkOverlay />
              </ImageContainer>
            </Slide>
          );
        })}
      </HeroSwiper>

      {active && (
        <ActionButtons>
          <ActionButton
            to={infoPathFor(active)}
            title={`Details ${active.title?.english || active.title?.romaji || ''}`}
          >
            <MdInfoOutline size={20} />
            <span>DETAILS</span>
          </ActionButton>
          {/* Explicit Watch-labeled affordance keeps a watch destination —
              now slug-bearing per the shared helper (live's hero has no
              WATCH NOW string at all; see report corpus finding). */}
          <ActionButton
            to={watchPathFor(active)}
            title={`Watch ${active.title?.english || active.title?.romaji || ''}`}
          >
            <FaRegCirclePlay size={18} />
            <span>WATCH NOW</span>
          </ActionButton>
        </ActionButtons>
      )}

      {badgeDisplay && (
        <BadgeWrapper>
          <Badge title={badgeDisplay}>
            <FaRegClock size={14} />
            <span>{badgeDisplay}</span>
          </Badge>
        </BadgeWrapper>
      )}

      <Pagination>
        <NavButton onClick={() => swiperRef.current?.slidePrev()}>
          <IoChevronBack size={20} />
        </NavButton>
        <Fraction aria-label='Carousel position'>
          <span className='swiper-pagination-current'>{activeIndex + 1}</span>
          {' / '}
          <span className='swiper-pagination-total'>{slides.length}</span>
        </Fraction>
        <NavButton onClick={() => swiperRef.current?.slideNext()}>
          <IoChevronForward size={20} />
        </NavButton>
      </Pagination>
    </Wrapper>
  );
};
