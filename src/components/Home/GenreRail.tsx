import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { TbCircleChevronLeft } from 'react-icons/tb';
import { FaChevronRight } from 'react-icons/fa';

// ---------------------------------------------------------------------------
// GenreRail (the live site 1:1) — horizontally scrollable genre chips below hero.
// Dynamic edge mask + fade-in scroll buttons, centered on mount, 200px steps.
// ---------------------------------------------------------------------------

const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

// Exact per-genre hover colors from the live site.
const GENRE_HOVER_COLOR: Record<string, string> = {
  Action: '#FF4500',
  Adventure: '#FFD700',
  Comedy: '#FF69B4',
  Drama: '#FF6347',
  Ecchi: '#FF00FF',
  Fantasy: '#8A2BE2',
  Horror: '#DC143C',
  'Mahou Shoujo': '#FF1493',
  Mecha: '#00CED1',
  Music: '#1E90FF',
  Mystery: '#9400D3',
  Psychological: '#FF8C00',
  Romance: '#FF69B4',
  'Sci-Fi': '#00FF7F',
  'Slice of Life': '#32CD32',
  Sports: '#1E90FF',
  Supernatural: '#FF00FF',
  Thriller: '#FF6347',
};

const Slider = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.75rem 2.25rem;
`;

const ScrollableContainer = styled.div`
  display: flex;
  padding: 0;
  margin: 0 auto;
  overflow: auto;
  scrollbar-width: none;
  mask-image: var(--genre-mask);
  -webkit-mask-image: var(--genre-mask);

  &::-webkit-scrollbar {
    display: none;
  }
`;

const InnerContainer = styled.div`
  margin: 0 auto;
`;

const Rail = styled.div`
  display: flex;
  gap: 0.5rem;
  width: max-content;
  margin: 0 auto;
  overflow: hidden;
  border-radius: var(--global-border-radius);
`;

const GenreChip = styled(Link)`
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.75rem;
  margin: 0;
  overflow: hidden;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--global-text);
  text-decoration: none;
  cursor: pointer;
  background: var(--global-div);
  border: none;
  border-radius: var(--global-border-radius);
  transition: color 0.3s ease-in-out;

  &:hover {
    color: var(--genre-hover-color, var(--global-text));
  }
  &:active {
    color: var(--primary-accent);
  }
`;

const ScrollButton = styled.button<{ $visible: boolean; $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 0;' : 'right: 0;')}
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  font-size: 1rem;
  color: var(--global-text);
  cursor: ${({ $visible }) => ($visible ? 'pointer' : 'default')};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  background: var(--global-div-tr);
  border: none;
  border-radius: 50%;
  transform: translateY(-50%);
  transition: opacity 0.3s ease-in-out;

  &:hover,
  &:active {
    color: var(--primary-accent);
  }
`;

const INITIAL_MASK = 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)';

export const GenreRail: React.FC = () => {
  const railRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [mask, setMask] = useState<string>(INITIAL_MASK);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Live `br` helper: edge-aware mask + button visibility, rAF-throttled.
  const update = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = railRef.current;
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollWidth <= clientWidth) {
        setMask('none');
        setCanLeft(false);
        setCanRight(false);
      } else if (scrollLeft <= 0) {
        setMask('linear-gradient(to right, black, black 10%, black 90%, transparent)');
        setCanLeft(false);
        setCanRight(true);
      } else if (scrollLeft + clientWidth >= scrollWidth) {
        setMask('linear-gradient(to right, transparent, black 10%, black 90%, black)');
        setCanLeft(true);
        setCanRight(false);
      } else {
        setMask('linear-gradient(to right, transparent, black 10%, black 90%, transparent)');
        setCanLeft(true);
        setCanRight(true);
      }
    });
  }, []);

  // Center the rail on mount (live centers the selected genre).
  useEffect(() => {
    const el = railRef.current;
    if (el) {
      const { scrollWidth, clientWidth } = el;
      el.scrollLeft = (scrollWidth - clientWidth) / 2;
      update();
    }
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      cancelAnimationFrame(rafRef.current);
    };
  }, [update]);

  const scroll = (side: 'left' | 'right') => {
    railRef.current?.scrollBy({ left: side === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <Slider>
      <ScrollButton
        type='button'
        $side='left'
        $visible={canLeft}
        onClick={() => scroll('left')}
        aria-label='Scroll genres left'
      >
        <TbCircleChevronLeft />
      </ScrollButton>
      <ScrollableContainer
        ref={railRef}
        style={{ ['--genre-mask' as string]: mask } as React.CSSProperties}
        onScroll={update}
        role='region'
        aria-label='Scrollable genres list'
      >
        <InnerContainer>
          <Rail role='list'>
            {GENRES.map((g) => (
              <GenreChip
                key={g}
                role='listitem'
                style={
                  {
                    ['--genre-hover-color' as string]: GENRE_HOVER_COLOR[g],
                  } as React.CSSProperties
                }
                to={`/search?&genres=${encodeURIComponent(g)}&sort=POPULARITY_DESC&type=ANIME`}
              >
                {g}
              </GenreChip>
            ))}
          </Rail>
        </InnerContainer>
      </ScrollableContainer>
      <ScrollButton
        type='button'
        $side='right'
        $visible={canRight}
        onClick={() => scroll('right')}
        aria-label='Scroll genres right'
      >
        <FaChevronRight />
      </ScrollButton>
    </Slider>
  );
};
