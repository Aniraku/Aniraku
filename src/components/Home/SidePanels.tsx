import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { IoChevronForward, IoChevronDown } from 'react-icons/io5';
import { TbCards } from 'react-icons/tb';
import { resolveDisplayTitle } from '../../lib/displayLanguage';
import { FaStar } from 'react-icons/fa';
import type { Anime } from '../../hooks/animeInterface';
import StatusIndicator from '../shared/StatusIndicator';
import { infoPathFor } from '../../utils/animePaths';

// SidePanels — side-list sections: TOP AIRING, UPCOMING, JUST FINISHED, TOP
// MOVIES. Bordered wrapper contains the header, the 6rem cards (poster +
// optional grayscale banner + title/status + detail chips), and a boxed
// chevron-down link at the bottom that navigates to the full list page
// (`listPath`) rather than expanding in place. Renders nothing when empty.

// Same format whitelist as the side list (matched case-insensitively
// because the API may report "Movie" rather than "MOVIE").
const FORMATS = ['OVA', 'SPECIAL', 'TV', 'TV_SHORT', 'MOVIE', 'ONA', 'MUSIC'];
const DEFAULT_VISIBLE = 5;

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 22rem;
  overflow: hidden;
`;

const PanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const PanelHeader = styled.header`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  padding: 0.25rem 0 1rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--global-text);

  svg {
    font-size: 1.05rem;
    color: var(--global-text-muted);
    flex-shrink: 0;
  }
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  scrollbar-width: none;
  border-radius: var(--global-border-radius);

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Card = styled(Link)`
  position: relative;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  height: 6rem;
  overflow: hidden;
  cursor: pointer;
  color: inherit;
  text-decoration: none;
  background-color: var(--global-div);
  border-radius: var(--global-border-radius);
  transition:
    background-color 0s ease-in-out,
    margin-left 0.2s ease-in-out,
    filter 0.2s ease-in-out;

  &:hover,
  &:active,
  &:focus {
    margin-left: 0.35rem;
    color: var(--side-list-accent, var(--primary-accent));
    filter: brightness(1.1);
  }
`;

const BannerWrap = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-base, 0);
  width: 60%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(100%);
    transition: filter 0.3s ease-in-out;
  }

  ${Card}:hover & img,
  ${Card}:focus & img {
    filter: grayscale(0);
  }
`;

const GradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(-70deg, transparent -200%, var(--global-div) 80%);
`;

const CardImage = styled.div`
  position: relative;
  z-index: var(--z-index-above, 1);
  width: 4.25rem;
  min-width: 4.25rem;
  height: 6rem;
  overflow: hidden;
  background-color: var(--global-primary-skeleton);
  border-radius: var(--global-border-radius);
  box-shadow: 0 0 10px var(--global-shadow);

  img {
    width: 4.25rem;
    height: 6rem;
    object-fit: cover;
  }
`;

const CardContent = styled.div`
  position: relative;
  z-index: var(--z-index-above, 1);
  min-width: 0;
  flex: 1;
`;

const TitleRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: var(--global-border-radius);
`;

const Title = styled.span`
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.25;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

// Big rank numeral over the poster's bottom-left corner (Re:Anime's
// Top-Trending look) — index+1 of the visible list.
const RankNumeral = styled.span`
  position: absolute;
  bottom: -0.2rem;
  left: 0.15rem;
  z-index: var(--z-index-above, 2);
  font-size: 1.9rem;
  font-weight: 800;
  font-style: italic;
  line-height: 1;
  color: #fff;
  pointer-events: none;
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.85),
    0 0 12px rgba(0, 0, 0, 0.55);
`;

const Details = styled.div`
  display: flex;
  gap: 0.3rem;
  align-items: center;
  margin: 0.2rem 1.25rem 0 0.5rem;
  font-size: 0.75rem;
  color: var(--global-text-muted);

  svg {
    color: var(--side-list-accent, var(--primary-accent));
  }
`;

const Detail = styled.span`
  display: flex;
  flex-shrink: 0;
  gap: 0.15rem;
  align-items: center;
  padding: 0.1rem 0.2rem;
  font-weight: 500;
  background-color: var(--global-primary-skeleton);
  border-radius: var(--global-border-radius);

  svg {
    color: var(--global-text-muted);
  }
`;

// Boxed chevron-down at the bottom of the panel; it navigates to the
// panel's full list page (placement bottom-of-panel).
const ViewMoreButton = styled(Link)`
  display: block;
  padding: 0.5rem;
  color: var(--global-text-muted);
  text-align: center;
  cursor: pointer;
  background-color: var(--global-div);
  border: 1px solid transparent;
  border-radius: var(--global-border-radius);
  font-family: var(--app-font-family);
  text-decoration: none;
  transition: 0.15s ease;

  &:hover {
    color: var(--primary-accent);
    filter: brightness(1.1);
  }
  &:active {
    transform: scale(0.95);
  }
`;

// 96px skeleton rows matching the content-loader rects.
const SkeletonRow = styled.div`
  height: 6rem;
  overflow: hidden;
  background-color: var(--global-div);
  border-radius: var(--global-border-radius);

  svg {
    display: block;
    background-color: var(--global-primary-skeleton);
  }

  rect {
    fill: var(--global-secondary-skeleton);
  }
`;

export const SidePanel: React.FC<{
  title: string;
  animeData: Anime[];
  defaultVisible?: number;
  loading?: boolean;
  icon?: React.ReactNode;
  /** Full-list page the bottom chevron opens (e.g. `/search?status=...`). */
  listPath: string;
}> = ({
  title,
  animeData,
  defaultVisible = DEFAULT_VISIBLE,
  loading = false,
  icon,
  listPath,
}) => {
  const filtered = animeData.filter((a) =>
    FORMATS.includes((a.type || '').toUpperCase()),
  );

  // Renders the whole panel only when loading or non-empty.
  if (!loading && filtered.length === 0) return null;

  const visible = filtered.slice(0, defaultVisible);

  return (
    <Panel>
      <PanelWrapper>
        <PanelHeader>
          {icon ?? <IoChevronForward />}
          {title}
        </PanelHeader>
        <CardList>
          {loading
            ? Array.from({ length: DEFAULT_VISIBLE }, (_, i) => (
                <SkeletonRow key={i}>
                  <svg
                    width='100%'
                    height='96'
                    viewBox='0 0 400 96'
                    preserveAspectRatio='xMinYMin slice'
                  >
                    <rect x='0' y='0' width='68' height='96' rx='5' ry='5' />
                    <rect x='85' y='23' width='220' height='13' rx='5' ry='5' />
                    <rect x='95' y='45' width='180' height='10' rx='5' ry='5' />
                    <rect x='95' y='65' width='140' height='10' rx='5' ry='5' />
                  </svg>
                </SkeletonRow>
              ))
            : visible.map((anime, index) => {
                const name =
                  resolveDisplayTitle(anime.title) || 'Untitled';
                const eps =
                  anime.totalEpisodes || Number(anime.episodes) || null;
                const isPartial =
                  anime.currentEpisode != null &&
                  eps != null &&
                  anime.currentEpisode > 0 &&
                  anime.currentEpisode < eps;
                return (
                  <Card
                    key={anime.id}
                    to={infoPathFor(anime)}
                    title={name}
                    aria-label={`Watch ${name}`}
                    style={
                      {
                        ['--side-list-accent' as string]: anime.color || undefined,
                        animationDelay: `${index * 0.1}s`,
                      } as React.CSSProperties
                    }
                  >
                    {anime.cover && anime.cover !== anime.image && (
                      <BannerWrap>
                        <img src={anime.cover} alt='' loading='lazy' />
                        <GradientOverlay />
                      </BannerWrap>
                    )}
                    <CardImage>
                      <img
                        src={anime.thumbnail || anime.image}
                        alt={name}
                        loading='lazy'
                        decoding='async'
                      />
                      <StatusIndicator
                        status={anime.status}
                        className='statusBadge'
                      />
                      <RankNumeral>{index + 1}</RankNumeral>
                    </CardImage>
                    <CardContent>
                      <TitleRow>
                        <Title>{name}</Title>
                      </TitleRow>
                      <Details>
                        {!!anime.rating && (
                          <Detail>
                            <FaStar />
                            {Math.round(anime.rating * 10)}
                          </Detail>
                        )}
                        {anime.type && <Detail>{anime.type}</Detail>}
                        {eps != null && eps > 0 && (
                          <Detail>
                            <TbCards />
                            {isPartial
                              ? `${anime.currentEpisode} / ${eps}`
                              : ` ${eps}`}
                          </Detail>
                        )}
                      </Details>
                    </CardContent>
                  </Card>
                );
              })}
        </CardList>
        <ViewMoreButton
          to={listPath}
          aria-label={`View all ${title.toLowerCase()}`}
          title={`View all ${title.toLowerCase()}`}
        >
          <IoChevronDown size={20} />
        </ViewMoreButton>
      </PanelWrapper>
    </Panel>
  );
};
