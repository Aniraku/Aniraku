import { useState } from 'react';
import styled from 'styled-components';
import { useAuth, useUserAnimeList, MediaListStatus } from '../../index';
import CardGrid from '../Cards/CardGrid';

const Container = styled.div`
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

// Live heading row (_headingRow_76nxj_1 / _title_76nxj_27)
const HeadingRow = styled.div`
  position: sticky;
  top: 3.5rem;
  z-index: var(--z-index-sticky, var(--z-index-above));
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const HeadingTitle = styled.h2`
  display: flex;
  flex: 1;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  margin: 0;
  overflow: hidden;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
`;

// Muted message for loading / error / empty states
const StateMessage = styled.div`
  margin: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  font-weight: 400;
  text-align: center;
  color: var(--global-text-muted);
`;

// Live login prompt (_loginPromptBox_76nxj_202 / _loginPromptText_76nxj_210)
const LoginPromptBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const LoginPromptText = styled.span`
  padding: 0.5rem;
  text-align: center;
`;

// Placed like the live view-toggle control in the heading row
const StatusDropdown = styled.select`
  padding: 0.5rem;
  font-family: var(--app-font-family);
  color: var(--global-text);
  cursor: pointer;
  background-color: var(--global-secondary-bg);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: var(--global-button-hover-bg);
  }
`;

// Live status labels (AniList list names used by the live site)
const statusLabels: Record<string, string> = {
  CURRENT: 'Watching',
  PLANNING: 'Planning',
  COMPLETED: 'Completed',
  REPEATING: 'Re-watching',
  PAUSED: 'Paused',
  DROPPED: 'Dropped',
};

const apiStatusToUserFriendly = {
  FINISHED: 'Completed',
  RELEASING: 'Ongoing',
  NOT_YET_RELEASED: 'Not yet aired',
  CANCELLED: 'Cancelled',
  HIATUS: 'Hiatus',
};

export const WatchingAnilist = () => {
  const { isLoggedIn, userData } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>(
    localStorage.getItem('selectedStatus') || 'CURRENT',
  );

  const { animeList, loading, error } = useUserAnimeList(
    userData?.name ?? '',
    selectedStatus as MediaListStatus,
  );

  // Shape entries like the shared `mapAnilistMediaToAnime` adapter so the
  // cards layer (CardGrid/CardItem) receives the canonical Anime fields.
  const animeData = animeList
    ? animeList.lists.flatMap((list: { entries: any[] }) =>
        list.entries.map((entry: any) => {
          const media = entry.media;
          const coverImage = media.coverImage?.large ?? '';
          const displayTitle = media.title?.english ?? media.title?.romaji ?? '';
          return {
            id: String(media.id),
            malId: '',
            image: coverImage,
            cover: coverImage,
            title: {
              romaji: media.title?.romaji ?? '',
              english: media.title?.english ?? '',
              native: '',
              userPreferred: displayTitle,
            },
            description: '',
            status:
              apiStatusToUserFriendly[
                media.status as keyof typeof apiStatusToUserFriendly
              ] || 'Unknown',
            releaseDate: media.startDate?.year ?? 0,
            totalEpisodes: media.episodes ?? 0,
            color: media.coverImage?.color,
            type: media.format ?? 'TV',
            rating:
              typeof media.averageScore === 'number'
                ? media.averageScore / 10
                : 0,
            subOrDub: 'sub',
            genres: media.genres ?? [],
          };
        }),
      )
    : [];

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);
    localStorage.setItem('selectedStatus', newStatus);
  };

  if (!isLoggedIn)
    return (
      <LoginPromptBox>
        <LoginPromptText>
          Log in to view your <b>AniList</b> or <b>MyAnimeList</b> :)
        </LoginPromptText>
      </LoginPromptBox>
    );

  return (
    <Container>
      <HeadingRow>
        <HeadingTitle>
          {animeData.length} {statusLabels[selectedStatus] || 'Watching'}
        </HeadingTitle>
        <StatusDropdown
          value={selectedStatus}
          onChange={handleStatusChange}
          aria-label='List status'
        >
          {Object.values(MediaListStatus).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status] || status}
            </option>
          ))}
        </StatusDropdown>
      </HeadingRow>
      {loading ? (
        <StateMessage>Loading...</StateMessage>
      ) : error ? (
        <StateMessage>
          <span>Failed to load anime list</span>
          <span>Please try again later.</span>
        </StateMessage>
      ) : animeData.length > 0 ? (
        <CardGrid animeList={animeData} />
      ) : (
        <StateMessage>No Results</StateMessage>
      )}
    </Container>
  );
};
