import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  FaStar,
  FaClosedCaptioning,
  FaPlay,
  FaBookmark,
  FaRegBookmark,
} from 'react-icons/fa';
import { MdRecordVoiceOver } from 'react-icons/md';
import StatusIndicator from '../shared/StatusIndicator';
import type { Anime } from '../../hooks/animeInterface';
import { SkeletonBox } from '../Skeletons/Skeletons';
import { infoPathFor } from '../../utils/animePaths';
import { useBookmarks } from '../../hooks/useBookmarks';

// Card corner bookmark control (Wave B) — Aniraku Card.jsx:37-45 toggle
// semantics restyled onto Miruro's card chrome (live corpus has no bookmark
// UI): mirrors `.editListButton`'s hover reveal + CSS vars, sits top-left.
// Guest = LS-only toggle; signed-in = LS optimistic + server upsert/delete
// via useBookmarks. (The miruro.to EditList control that used to sit
// top-right is gone — AniList sign-in surface, no AniList auth here.)
const CardBookmarkBtn = styled.button`
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  z-index: var(--z-index-above);
  display: flex;
  padding: 0.25rem 0.2rem;
  box-sizing: border-box;
  cursor: pointer;
  background-color: var(--global-div-tr);
  backdrop-filter: blur(10px);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  opacity: 0;
  transform: scale(0.85);
  transition:
    transform 0.2s ease-in-out,
    opacity 0.2s ease-in-out;

  svg {
    font-size: 1rem;
    color: var(--global-text);
    transition: 0.2s ease-in-out;
  }

  &:hover,
  &:active,
  &:focus {
    border-color: var(--primary-accent);
    transform: scale(0.9);
  }

  /* bookmarked = always shown, accent tinted */
  &[data-bookmarked='true'] {
    opacity: 1;
    transform: scale(1);
  }

  &[data-bookmarked='true'] svg {
    color: var(--primary-accent);
  }

  .cardItem:hover &,
  .cardItem:focus-within & {
    opacity: 1;
    transform: scale(1);
  }
`;


interface CardItemProps {
  anime: Anime;
}

const CardItem: React.FC<CardItemProps> = ({ anime }) => {
  const displayTitle =
    anime.title.romaji || anime.title.english || anime.title.native;

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(anime.id);

  const year = anime.releaseDate || '?';
  const format = anime.type || '?';
  const rawScore = anime.rating;
  const score = rawScore ? Math.round(rawScore * 10) : '?';

  // Live parity: show the aired episode count until airing finishes,
  // then switch to the final total.
  const currentEpisode = useMemo(() => {
    const Y = anime.totalEpisodes ?? 0;
    if (anime.nextAiringEpisode?.airingAt) {
      const airingAt = anime.nextAiringEpisode.airingAt;
      const ep = anime.nextAiringEpisode.episode;
      const J = airingAt > Math.floor(Date.now() / 1000) ? ep - 1 : ep;
      if (J > 0) return Y > 0 && J !== Y ? `${J} / ${Y}` : `${J}`;
    }
    return Y > 0 ? `${Y}` : '?';
  }, [anime.nextAiringEpisode, anime.totalEpisodes]);

  const isDub = anime.subOrDub && /dub/i.test(anime.subOrDub);

  const hoverColor = anime.color
    ? ({ '--card-title-hover-color': anime.color } as React.CSSProperties)
    : undefined;

  return (
    <div className="cardItem">
      <Link
        to={infoPathFor(anime)}
        className="card"
        aria-label={`Play ${displayTitle}`}
        style={hoverColor}
      >
        <div
          className="cardImgContainer"
          style={{ '--img-ratio': '184 / 133' } as React.CSSProperties}
        >
          <img
            src={anime.image}
            alt={`Play ${displayTitle}`}
            loading="lazy"
            className="cardImg"
          />
          <div className="playIcon" aria-label="Play">
            <FaPlay />
          </div>
        </div>
        <div className="titleContainer">
          <div className="titleWrapper">
            <span className="title">{displayTitle}</span>
          </div>
          <div className="cardDetails">
            <div className="cardDetail">{year}</div>
            <div className="cardDetail">{format}</div>
            <div className="cardDetail">
              {isDub && <MdRecordVoiceOver aria-label="Dub" />}
              <FaClosedCaptioning aria-label="Sub" />
              {currentEpisode}
            </div>
            <div className="cardDetail score">
              <FaStar aria-label="Score" />
              {score}
            </div>
          </div>
          <div className="statusBadge">
            <StatusIndicator status={anime.status} />
          </div>
        </div>
      </Link>
      <CardBookmarkBtn
        type="button"
        data-bookmarked={String(bookmarked)}
        aria-pressed={bookmarked}
        aria-label={
          bookmarked
            ? `Remove ${displayTitle} from bookmarks`
            : `Bookmark ${displayTitle}`
        }
        title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void toggleBookmark({
            id: anime.id,
            title: displayTitle,
            image: anime.image,
          });
        }}
      >
        {bookmarked ? (
          <FaBookmark aria-hidden="true" />
        ) : (
          <FaRegBookmark aria-hidden="true" />
        )}
      </CardBookmarkBtn>
    </div>
  );
};

export const CardItemSkeleton: React.FC = () => {
  return (
    <div className="cardItem">
      <div className="card">
        <div
          className="cardImgContainer"
          style={{ '--img-ratio': '184 / 133' } as React.CSSProperties}
        >
          <SkeletonBox style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="titleContainer">
          <div className="titleWrapper">
            <SkeletonBox style={{ width: '80%', height: '1rem' }} />
          </div>
          <div className="cardDetails">
            <SkeletonBox style={{ width: '2rem', height: '1rem' }} />
            <SkeletonBox style={{ width: '3rem', height: '1rem' }} />
            <SkeletonBox style={{ width: '4rem', height: '1rem' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CardItem);
