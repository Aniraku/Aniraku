import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useUserAnimeList } from '../../client/authService';
import { MediaListStatus } from '../../client/userInfoTypes';
import { useAuth as useSupabaseAuth } from '../../hooks/useAuth';
import { getSyncStatus } from '../../lib/sync';
import CardGrid from '../Cards/CardGrid';
import ThemedSelect from '../ThemedSelect';

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
  // Supabase session is the real auth (the legacy client/useAuth
  // `accessToken` flow is retired — nothing writes it). The AniList
  // username comes from the backend sync status (OAuth-owned), not from a
  // direct Viewer query.
  const supabaseAuth = useSupabaseAuth();
  const isLoggedIn = Boolean(supabaseAuth?.user);
  const [anilistUsername, setAnilistUsername] = useState<string>('');
  const [usernameLoaded, setUsernameLoaded] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    localStorage.getItem('selectedStatus') || 'CURRENT',
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setUsernameLoaded(true);
      return;
    }
    let cancelled = false;
    getSyncStatus()
      .then((data) => {
        if (cancelled) return;
        const username = String(data?.anilist?.username ?? '');
        setAnilistUsername(username);
        setUsernameLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setUsernameLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const { animeList, loading, error } = useUserAnimeList(
    anilistUsername,
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

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    localStorage.setItem('selectedStatus', newStatus);
  };

  if (!isLoggedIn)
    return (
      <LoginPromptBox>
        <LoginPromptText>
          Log in to view your <b>AniList</b> list :)
        </LoginPromptText>
      </LoginPromptBox>
    );

  if (usernameLoaded && !anilistUsername)
    return (
      <LoginPromptBox>
        <LoginPromptText>
          Connect <b>AniList</b> in Settings → Library Sync to see your list
          here. MyAnimeList browsing lives in Settings import/export.
        </LoginPromptText>
      </LoginPromptBox>
    );

  return (
    <Container>
      <HeadingRow>
        <HeadingTitle>
          {animeData.length} {statusLabels[selectedStatus] || 'Watching'}
        </HeadingTitle>
        <ThemedSelect
          value={selectedStatus}
          onChange={handleStatusChange}
          ariaLabel='List status'
          align='right'
          options={Object.values(MediaListStatus).map((status: string) => ({
            value: status,
            label: statusLabels[status] || status,
          }))}
        />
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
