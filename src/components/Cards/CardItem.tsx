import React, { memo, useEffect, useMemo } from 'react';
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
import { resolveDisplayTitle } from '../../lib/displayLanguage';
import { useBookmarks } from '../../hooks/useBookmarks';
// Whole-anime sub/dub chips: the backend's fast /track endpoint cached
// locally (lib/audioTracks) — one cheap request per visible card, deduped.
import {
  ensureTrackCounts,
  useTrackCounts,
  type TrackCounts,
} from '../../lib/audioTracks';
import { ANIRAKU_API_BASE } from '../../hooks/useApi';
import { showToast } from '../Toaster';

// Card corner bookmark control. Styled to fit the card chrome: hover reveal
// plus CSS variables, sitting top-left. Guests toggle in localStorage;
// signed-in users get an optimistic local update plus a server
// upsert/delete through useBookmarks.
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

// Miruro-style audio chips: rounded pills with the CC/mic icon + the exact
// whole-anime episode count. Bordered, translucent, theme-aware.
const AudioChip = styled.span`
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
  padding: 0.1rem 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--global-text);
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: 999px;
  white-space: nowrap;

  svg {
    font-size: 0.72rem;
    color: var(--global-text-muted);
  }
`;

const CardItem: React.FC<CardItemProps> = ({ anime }) => {
  const displayTitle = resolveDisplayTitle(anime.title);

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(anime.id);

  const year = anime.releaseDate || '?';
  const format = anime.type || '?';
  const rawScore = anime.rating;
  const score = rawScore ? Math.round(rawScore * 10) : '?';

  // Parity: show the aired episode count until airing finishes,
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

  // Numeric aired count — the sub fallback when the /track endpoint has no
  // entry for this title (providers subtitle every aired episode).
  const airedCount = useMemo(() => {
    const Y = Math.floor(Number(anime.totalEpisodes) || 0);
    const next = anime.nextAiringEpisode;
    if (next?.airingAt && next.airingAt > Math.floor(Date.now() / 1000)) {
      return Math.max((next.episode ?? 1) - 1, 0);
    }
    return Y;
  }, [anime.totalEpisodes, anime.nextAiringEpisode]);

  // Fire the (cached, deduped) /track fetch once per card mount.
  useEffect(() => {
    if (anime.id) void ensureTrackCounts(String(anime.id), ANIRAKU_API_BASE);
  }, [anime.id]);
  const trackCounts: TrackCounts | null = useTrackCounts(String(anime.id));

  const subCount = trackCounts && !trackCounts.missing
    ? Math.max(trackCounts.sub, 0)
    : airedCount;
  const dubCount = trackCounts && !trackCounts.missing ? trackCounts.dub : 0;

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
            src={anime.thumbnail || anime.image}
            alt={`Play ${displayTitle}`}
            loading="lazy"
            decoding="async"
            className="cardImg"
          />
          <div className="playIcon" aria-label="Play">
            <FaPlay />
          </div>
          <div className="statusBadge">
            <StatusIndicator status={anime.status} />
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
              <AudioChip title={`${subCount} episodes with sub`}>
                <FaClosedCaptioning aria-hidden='true' />
                {subCount > 0 ? subCount : currentEpisode}
              </AudioChip>
              {dubCount > 0 && (
                <AudioChip title={`${dubCount} episodes with dub`}>
                  <MdRecordVoiceOver aria-hidden='true' />
                  {dubCount}
                </AudioChip>
              )}
            </div>
            <div className="cardDetail score">
              <FaStar aria-label="Score" />
              {score}
            </div>
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
          const willBeBookmarked = !bookmarked;
          void toggleBookmark({
            id: anime.id,
            title: displayTitle,
            image: anime.thumbnail || anime.image,
          })
            .then(() => {
              showToast(
                willBeBookmarked
                  ? `Bookmarked ${displayTitle}`
                  : `Removed ${displayTitle} from bookmarks`,
                { type: 'success' },
              );
            })
            .catch((err: unknown) => {
              showToast('Could not update bookmark', {
                description:
                  err instanceof Error ? err.message : 'Please try again.',
                type: 'error',
              });
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
