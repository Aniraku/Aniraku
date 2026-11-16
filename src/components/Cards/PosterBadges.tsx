import React from 'react';
import type { Anime } from '../../hooks/animeInterface';

// Poster-bottom badge row (reference look): aired episode on the left;
// on the right a next-episode countdown while airing, else the AniList
// last update as a relative "ago". Renders nothing without values.
const compactDuration = (sec: number) => {
  if (sec >= 86400) return `${Math.round(sec / 86400)}d`;
  if (sec >= 3600) return `${Math.round(sec / 3600)}h`;
  return `${Math.max(Math.round(sec / 60), 1)}m`;
};

const relativeAgo = (unixSec: number, nowSec: number) => {
  const diff = nowSec - unixSec;
  if (diff >= 86400) return `${Math.round(diff / 86400)}d ago`;
  if (diff >= 3600) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.max(Math.round(diff / 60), 1)}m ago`;
};

interface PosterBadgesProps {
  anime: Anime;
  /** Aired episode number — omit to hide the left badge (side list rows). */
  ep?: number;
}

const PosterBadges: React.FC<PosterBadgesProps> = ({ anime, ep }) => {
  const nowSec = Math.floor(Date.now() / 1000);
  const next = anime.nextAiringEpisode;
  const time =
    next && next.airingAt > nowSec
      ? compactDuration(next.timeUntilAiring)
      : anime.updatedAt && anime.updatedAt > 0 && anime.updatedAt < nowSec
        ? relativeAgo(anime.updatedAt, nowSec)
        : '';
  if (!ep && !time) return null;
  // Empty left slot keeps the right badge pinned right via space-between.
  return (
    <div className='posterBadges' aria-hidden='true'>
      <span className='posterBadge'>{ep ? `EP ${ep}` : ''}</span>
      <span className='posterBadge'>{time}</span>
    </div>
  );
};

export default PosterBadges;
