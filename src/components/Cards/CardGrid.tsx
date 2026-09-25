import React from "react";
import styled from "styled-components";
import CardItem from "./CardItem";
import { Anime } from "../../hooks/animeInterface";

// Styled grid container matching live card grid metrics.
// Exported as StyledCardGrid so pages can wrap grid + skeletons in one
// centered container (matches original app pattern).
export const StyledCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
  gap: 2rem;
  width: 100%;
  padding: 0 0 2rem;
  margin-inline: auto;

  @media (max-width: 1350px) {
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: 1.5rem;
  }

  @media (max-width: 800px) {
    grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
    gap: 1rem;
  }

  @media (max-width: 450px) {
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    gap: 0.8rem;
  }
`;

interface CardGridProps {
  /** Anime array (new API-style call sites pass animeData) */
  animeData?: Anime[];
  /** Alias kept for legacy call sites (WatchingAnilist etc.) */
  animeList?: Anime[];
  /** Whether more pages are available (infinite scroll) */
  hasNextPage?: boolean;
  /** Callback fired when the sentinel enters the viewport */
  onLoadMore?: () => void;
  /** Optional children (skeletons) rendered inside the grid container */
  children?: React.ReactNode;
}

/**
 * Renders a responsive grid of CardItems. Infinite scrolling is handled
 * by the caller (Trending/Home already set up IntersectionObserver sentinels).
 */
const CardGrid: React.FC<CardGridProps> = ({
  animeData,
  animeList,
  children,
}) => {
  const list = animeData ?? animeList ?? [];

  return (
    <StyledCardGrid>
      {list.map((anime) => (
        <CardItem key={anime.id} anime={anime} />
      ))}
      {children}
    </StyledCardGrid>
  );
};

export default CardGrid;
