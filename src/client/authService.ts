// src/services/authService.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is installed via npm or yarn
import type { UserData, MediaListStatus } from './userInfoTypes'; // Adjust the path as necessary
import { useQuery, gql } from '@apollo/client';

// Constants for AniList OAuth — backend-owned flow.
// Library sync OAuth is owned by the Aniraku Backend
// (`GET /api/v1/sync/{provider}/authorize` → provider → `POST
// /api/v1/sync/callback`). The browser NEVER holds the client secret and
// never POSTs to anilist.co/oauth/token directly. VITE_CLIENT_ID /
// VITE_REDIRECT_URI below are only for building the legacy direct URL
// (deprecated — prefer lib/sync `syncAuthorize`).
const clientId = import.meta.env.VITE_CLIENT_ID || 'default_client_id';
const redirectUri = import.meta.env.VITE_REDIRECT_URI || 'default_redirect_uri';

// Aniraku GraphQL mirror: public AniList metadata only, unlimited (no
// 30/min cap). Public metadata reads (search, lists, anime info, batch
// detail) go to the mirror — see hooks/useApi + lib/sync `anilistBatchDetail`.
// AUTHENTICATED reads (Viewer with Bearer) stay on the official API on both
// branches per docs/ARCHITECTURE §1-2: the offline mirror is read-only,
// rejects mutations and carries no user data.
const ANILIST_OFFICIAL = 'https://graphql.anilist.co';

/**
 * Generates a new CSRF token for each session
 * @returns {string} A UUID v4 CSRF token
 */
export const generateCsrfToken = (): string => {
  return uuidv4();
};

/**
 * Builds the authorization URL with CSRF protection
 * @param {string} csrfToken CSRF token for state parameter
 * @returns {string} URL to redirect user to AniList OAuth login page
 */

// authService.ts
export const buildAuthUrl = (csrfToken: string): string => {
  const scope = encodeURIComponent('');
  const state = encodeURIComponent(csrfToken);
  const encodedRedirectUri = encodeURIComponent(redirectUri);

  return `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&scope=${scope}&response_type=code&redirect_uri=${encodedRedirectUri}&state=${state}`;
};

/**
 * Requests an access token from AniList using the authorization code
 * @param {string} code The authorization code received from AniList after user consent
 * @returns {Promise<string>} A promise that resolves to the access token
 * @deprecated Backend-owned flow — use `syncAuthorize` /
 * `completeSyncCallback` in lib/sync.ts. The client secret must never ship
 * to the browser; this stub throws instead of POSTing with a secret.
 */
export const getAccessToken = async (_code: string): Promise<string> => {
  throw new Error(
    'Direct AniList token exchange is disabled — library sync uses the backend OAuth flow (syncAuthorize / completeSyncCallback).',
  );
};

// src/services/authService.js — authenticated Viewer read stays on the
// OFFICIAL API (mirror carries no user data). Bearer from the caller.
export const fetchUserData = async (accessToken: string): Promise<UserData> => {
  try {
    const response = await axios.post(
      ANILIST_OFFICIAL,
      {
        query: `
          query {
              Viewer {
                  id
                  name
                  avatar {
                      large
                  }
                  createdAt
                  about
                  bannerImage
                  statistics {
                      anime {
                          count
                          episodesWatched
                          meanScore
                          minutesWatched
                      }
                  }
              }
          }
      `,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    return response.data.data.Viewer; // Ensure the structure matches UserData interface
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw new Error('Failed to fetch user data');
  }
};

const GET_USER_ANIME_LIST = gql`
  query GetUserAnimeList($username: String!, $status: MediaListStatus!) {
    MediaListCollection(
      userName: $username
      type: ANIME
      status: $status
      sort: UPDATED_TIME_DESC
    ) {
      lists {
        entries {
          media {
            id
            format
            title {
              romaji
              english
            }
            coverImage {
              large
              color
            }
            status
            episodes
            startDate {
              year
              month
              day
            }
            averageScore
            genres
          }
        }
      }
    }
  }
`;

export const useUserAnimeList = (username: string, status: MediaListStatus) => {
  const { data, loading, error } = useQuery(GET_USER_ANIME_LIST, {
    variables: { username, status },
    skip: !username || !status, // Ensuring not to proceed without necessary variables
  });

  return {
    animeList: data?.MediaListCollection,
    loading,
    error,
  };
};
