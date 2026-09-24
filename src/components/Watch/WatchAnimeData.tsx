import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Anime } from '../../index';
import { SiMyanimelist, SiAnilist } from 'react-icons/si';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const AnimeDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1000px) {
    margin-bottom: 0rem;
  }
`;
// 2wrhc_9 — details card: row, gap .75rem, padding .75rem, div-tr bg,
// border, radius.
const AnimeDataContainerTop = styled.div`
  border-radius: var(--global-border-radius);
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  margin: 0;
  padding: 0.75rem;
  gap: 0.75rem;
  color: var(--global-text);
  flex-direction: row;
  align-items: flex-start;
  display: flex;
`;
const AnimeDataContainerMiddle = styled.div`
  border-radius: var(--global-border-radius);
  padding-top: 0.6rem;
  color: var(--global-text);
  align-items: center;
  flex-direction: row;
  align-items: flex-start;
  display: flex;
  @media (max-width: 500px) {
    padding-top: 0.4rem;
  }
`;

const AnimeDataContainerBottom = styled.div`
  margin-top: 0.6rem;
  @media (max-width: 750px) {
    margin-top: 0rem;
  }
`;

const ParentContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr; // Default to single column for narrow screens
  @media (min-width: 750px) {
    grid-template-columns: 1.2fr 1fr; // Switch to two columns on wider screens
  }
  @media (min-width: 1500px) {
    grid-template-columns: 1.25fr 1fr; // Switch to two columns on wider screens
  }
`;

const AnimeDataText = styled.div`
  text-align: left;
  font-size: 0.8rem;
  .anime-title {
    line-height: 1.6rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--global-text);
    margin: 0 0 0.5rem;
    @media (max-width: 500px) {
      font-size: 1.25rem;
      margin-bottom: 0.2rem;
    }
  }
  .anime-title-romaji {
    font-style: italic;
    margin-top: 0rem;
    line-height: 0.6rem;
    margin-bottom: 0.5rem;
    @media (max-width: 500px) {
      line-height: 1rem;
      margin-bottom: 0.25rem;
    }
  }
  p {
    color: var(--global-text-muted);
    margin-top: 0rem;
    margin-bottom: 0.2rem;
    line-height: 1.3rem;
    @media (max-width: 500px) {
      line-height: 1rem;
    }
  }
  .Description {
    line-height: 1rem;
    max-width: 50rem;
    font-size: 0.9rem;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    &.expanded {
      display: block;
      -webkit-line-clamp: unset;
    }
  }
  strong {
    color: var(--global-text);
  }
`;

const GenreRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.25rem 0 0.5rem;
`;

const GenreTag = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  color: var(--global-text);
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  text-decoration: none;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease;
  &:hover,
  &:active,
  &:focus {
    color: var(--primary-accent);
    background-color: var(--primary-accent-tr);
    border-color: var(--primary-accent);
  }
`;

const AnimeInfoImage = styled.img`
  border-radius: var(--global-border-radius);
  max-height: 15rem;
  width: 10.5rem;
  margin-right: 1rem;
  margin-bottom: 0.5rem;
  @media (max-width: 500px) {
    max-height: 12rem;
    width: 8.5rem;
  }
`;

const Button = styled.button`
  padding: 0.5rem 0.6rem;
  background-color: var(--primary-accent);
  color: white;
  border: none;
  border-radius: var(--global-border-radius);
  cursor: pointer;
  transition: background-color 0.3s ease;
  outline: none;

  &:hover,
  &:active,
  &:focus {
    background-color: var(--primary-accent-bg);
  }

  @media (max-width: 1000px) {
    display: block;
    margin: 0 auto;
    margin-bottom: 0.5rem;
  }
`;

const ShowTrailerButton = styled(Button)`
  margin-right: 1rem;
  padding: 0rem;
  width: 10.5rem; //same as anime picture width.
  background-color: var(--global-div);
  transition:
    background-color 0.3s ease,
    transform 0.2s ease-in-out;
  color: var(--global-text);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  &:hover,
  &:active,
  &:focus {
    background-color: var(--primary-accent);
    z-index: 2;
  }
  @media (max-width: 500px) {
    font-size: 0.8rem;
    width: 8.5rem;
  }
`;
const MalAniContainer = styled.div`
  display: flex; /* or grid */
  gap: 0.5rem;
  margin-right: 1rem;
`;

const MalAnilistSvg = styled.div`
  height: 2.5rem;
  width: 5rem;
  border-radius: var(--global-border-radius);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--global-div);
  color: var(--global-text);
  transition: 0.1s ease-in-out;

  &:hover,
  &:active,
  &:focus {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.975);
  }

  @media (max-width: 500px) {
    width: 4rem;
    height: 2rem;
  }
`;

// Live show-more button: full-width, muted, icon-only with the
// `Show more` / `Show less` aria-labels.
const ShowMoreButton = styled.button`
  background-color: var(--global-div);
  color: var(--global-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  border: none;
  padding: 0.5rem;
  font-size: 0.75rem;
  border-radius: var(--global-border-radius);
  margin: 0.5rem 0;
  cursor: pointer;
  &:hover,
  &:active,
  &:focus {
    background-color: var(--global-div);
    color: var(--global-text);
  }
  transition:
    color 0.3s ease,
    transform 0.2s ease-in-out;
  @media (max-width: 500px) {
    margin: 0rem;
    margin-top: 1rem;
  }
`;

const IframeTrailer = styled.iframe`
  aspect-ratio: 16/9;
  margin-bottom: 2rem;
  position: relative;
  border: none;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  @media (max-width: 1000px) {
    width: 100%;
    height: 100%;
  }
`;

const TrailerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease-in-out;
  animation: slideUp 0.3s ease-in-out;
  aspect-ratio: 16 / 9; // Maintain a 16:9 aspect ratio
`;

const TrailerOverlayContent = styled.div`
  width: 60%; // Adjusted width for better visibility
  aspect-ratio: 16 / 9; // Maintain a 16:9 aspect ratio
  background: white;
  border-radius: var(--global-border-radius);
  overflow: hidden;
  background-color: var(--global-div);
  @media (max-width: 500px) {
    width: 95%;
  }
`;

// Live status labels (Qe): Finished / Airing / Not Yet Released / Cancelled.
const statusLabel = (status?: string): string => {
  if (!status) return '—';
  if (status === 'Completed') return 'Finished';
  if (status === 'Ongoing') return 'Airing';
  if (status === 'Not yet aired') return 'Not Yet Released';
  if (status === 'Cancelled') return 'Cancelled';
  return status;
};

// Live date formatter (Un): "Sep 15, 2023" — month, `day,`, year.
const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
type DateParts = { year?: number; month?: number; day?: number } | null;
const fmtDate = (d: DateParts): string => {
  if (!d?.year) return '—';
  const parts: string[] = [];
  if (d.month) parts.push(MONTH_ABBR[d.month - 1] ?? '');
  if (d.day) parts.push(`${d.day},`);
  parts.push(String(d.year));
  return parts.filter(Boolean).join(' ');
};

export const WatchAnimeData: React.FC<{ animeData: Anime }> = ({
  animeData,
}) => {
  const [isDescriptionExpanded, setDescriptionExpanded] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const getAnimeIdFromUrl = () => {
    const pathParts = window.location.pathname.split('/');
    return pathParts[2];
  };

  const toggleDescription = () => {
    setDescriptionExpanded(!isDescriptionExpanded);
  };

  useEffect(() => {
    setDescriptionExpanded(false);
  }, [getAnimeIdFromUrl()]);

  const removeHTMLTags = (description: string): string => {
    return description.replace(/<[^>]+>/g, '').replace(/\([^)]*\)/g, '');
  };

  const cleanDescription = animeData.description
    ? removeHTMLTags(animeData.description)
    : '';

  const toggleTrailer = () => {
    setShowTrailer(!showTrailer);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showTrailer) {
        setShowTrailer(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTrailer]);

  function capitalizeFirstLetter(str: string) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Live stats (Wn): Format, Status, Episodes, Rating/100, Duration, Season,
  // Release/Start Date, End Date, Country, Adult, Studios — missing → `—`.
  const startDate = animeData.startDate ?? null;
  const endDate = animeData.endDate ?? null;
  const singleYearRelease = !!(
    endDate?.day &&
    startDate?.year &&
    endDate.year === startDate.year
  );
  const startValue = singleYearRelease
    ? startDate?.month && startDate?.day
      ? fmtDate(startDate)
      : fmtDate(endDate)
    : fmtDate(startDate);
  const statRows: React.ReactNode[] = [
    <p key='format'>
      Format: <strong>{animeData.type || '—'}</strong>
    </p>,
    <p key='status'>
      Status: <strong>{statusLabel(animeData.status)}</strong>
    </p>,
    <p key='episodes'>
      Episodes:{' '}
      <strong>{animeData.totalEpisodes ? animeData.totalEpisodes : '—'}</strong>
    </p>,
    <p key='rating'>
      Rating:{' '}
      <strong>{animeData.rating ? Math.round(animeData.rating * 10) : '—'}</strong>
      /100
    </p>,
    <p key='duration'>
      Duration:{' '}
      <strong>{animeData.duration ? `${animeData.duration} min` : '—'}</strong>
    </p>,
    <p key='season'>
      Season:{' '}
      <strong>
        {animeData.season ? capitalizeFirstLetter(animeData.season) : '—'}
      </strong>
    </p>,
    <p key='start'>
      {singleYearRelease ? 'Release Date:' : 'Start Date:'}{' '}
      <strong>{startValue}</strong>
    </p>,
    ...(!singleYearRelease
      ? [
          <p key='end'>
            End Date: <strong>{fmtDate(endDate)}</strong>
          </p>,
        ]
      : []),
    <p key='country'>
      Country: <strong>{animeData.countryOfOrigin || '—'}</strong>
    </p>,
    <p key='adult'>
      Adult: <strong>{animeData.isAdult ? 'Yes' : 'No'}</strong>
    </p>,
    <p key='studios'>
      Studios:{' '}
      <strong>
        {animeData.studios && animeData.studios.length > 0
          ? animeData.studios.join(', ')
          : '—'}
      </strong>
    </p>,
    // Live details card (Wn): `Official Site: <link>` — picks the
    // externalLinks entry whose site is exactly `Official Site`; missing →
    // the row is omitted entirely (same as live).
    ...(() => {
      const links: { site?: string; url?: string }[] = Array.isArray(
        (animeData as any).externalLinks,
      )
        ? (animeData as any).externalLinks
        : [];
      const official = links.find(
        (l) => l?.site === 'Official Site' && l?.url,
      );
      if (!official?.url) return [];
      const display = official.url
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');
      return [
        <p key='official-site'>
          Official Site:{' '}
          <strong>
            <a
              href={official.url}
              target='_blank'
              rel='noopener noreferrer'
              style={{
                color: 'var(--primary-accent)',
                textDecoration: 'none',
              }}
            >
              {display}
            </a>
          </strong>
        </p>,
      ];
    })(),
  ];
  const statsHalf = Math.ceil(statRows.length / 2);

  return (
    <>
      {animeData && (
        <AnimeDataContainer>
          <AnimeDataContainerTop>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <AnimeInfoImage src={animeData.image} alt='Anime Title Image' />
              {animeData.trailer && animeData.status !== 'Not yet aired' && (
                <ShowTrailerButton onClick={toggleTrailer}>
                  <p>
                    <strong>TRAILER</strong>
                  </p>
                </ShowTrailerButton>
              )}
              {showTrailer && (
                <TrailerOverlay onClick={toggleTrailer}>
                  <TrailerOverlayContent onClick={(e) => e.stopPropagation()}>
                    <IframeTrailer
                      src={`https://www.youtube.com/embed/${animeData.trailer.id}`}
                      allowFullScreen
                    />
                  </TrailerOverlayContent>
                </TrailerOverlay>
              )}
              <MalAniContainer>
                {animeData.id && (
                  <a
                    href={`https://anilist.co/${!animeData.type ? 'anime' : animeData.type.toLowerCase() === 'manga' || animeData.type.toLowerCase() === 'novel' ? 'manga' : 'anime'}/${animeData.id}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <MalAnilistSvg>
                      <SiAnilist size={'1.5rem'} />
                    </MalAnilistSvg>
                  </a>
                )}
                {animeData.malId && (
                  <a
                    href={`https://myanimelist.net/${!animeData.type ? 'anime' : animeData.type.toLowerCase() === 'manga' || animeData.type.toLowerCase() === 'novel' ? 'manga' : 'anime'}/${animeData.malId}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <MalAnilistSvg>
                      <SiMyanimelist size={'2.75rem'} />
                    </MalAnilistSvg>
                  </a>
                )}
              </MalAniContainer>
            </div>
            <AnimeDataText>
              <h1 className='anime-title'>
                {animeData.title.english
                  ? animeData.title.english
                  : animeData.title.romaji}
              </h1>
              <p
                className='anime-title-romaji'
                style={{ color: animeData.color }}
              >
                {animeData.title.romaji ||
                  animeData.title.native ||
                  'No Romaji/Native Title'}
              </p>
              {animeData.genres && animeData.genres.length > 0 && (
                <GenreRow>
                  {animeData.genres.map((genre: string) => (
                    <GenreTag
                      key={genre}
                      to={`/search?&genres=${encodeURIComponent(genre)}&sort=POPULARITY_DESC&type=ANIME`}
                    >
                      {genre}
                    </GenreTag>
                  ))}
                </GenreRow>
              )}
              {cleanDescription && (
                <>
                  <p
                    className={`Description${isDescriptionExpanded ? ' expanded' : ''}`}
                  >
                    {cleanDescription}
                  </p>
                  {cleanDescription.length > 150 && (
                    <ShowMoreButton
                      type='button'
                      onClick={toggleDescription}
                      aria-label={
                        isDescriptionExpanded ? 'Show less' : 'Show more'
                      }
                      aria-expanded={isDescriptionExpanded}
                    >
                      {isDescriptionExpanded ? (
                        <FaChevronUp aria-hidden='true' />
                      ) : (
                        <FaChevronDown aria-hidden='true' />
                      )}
                    </ShowMoreButton>
                  )}
                </>
              )}
              <ParentContainer>
                <AnimeDataContainerMiddle>
                  <AnimeDataText>
                    {statRows.slice(0, statsHalf)}
                  </AnimeDataText>
                </AnimeDataContainerMiddle>
                <AnimeDataContainerBottom>
                  <AnimeDataText>{statRows.slice(statsHalf)}</AnimeDataText>
                </AnimeDataContainerBottom>
              </ParentContainer>
            </AnimeDataText>
          </AnimeDataContainerTop>
        </AnimeDataContainer>
      )}
    </>
  );
};
