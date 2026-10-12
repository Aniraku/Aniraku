// apolloClient.ts
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloProvider,
  makeVar,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { buildAuthUrl, fetchUserData, generateCsrfToken, UserData } from '../index';
import { ReactNode, useEffect } from 'react';

// Reactive variables for user authentication state
const isLoggedInVar = makeVar<boolean>(false);
const userDataVar = makeVar<UserData | null>(null);

const httpLink = createHttpLink({
  // Authenticated AniList traffic stays on the official API on both branches
  // (docs/ARCHITECTURE §1): the mirror is metadata-only and carries no user
  // data. Public metadata reads use the mirror via hooks/useApi instead.
  uri: 'https://graphql.anilist.co',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );
  }

  if (networkError) console.error(`[Network error]: ${networkError}`);
});

const client = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
});

// Functions for handling authentication (legacy direct-AniList flow,
// retired — library sync uses the backend OAuth in lib/sync `syncAuthorize`).
// `login` keeps the local CSRF redirect for source parity but no longer
// calls the non-existent GET /get-csrf-token (which made every login fail).
function login() {
  try {
    const csrfToken = generateCsrfToken();
    window.location.href = buildAuthUrl(csrfToken);
  } catch (error) {
    console.error('Error building auth URL:', error);
  }
}

function logout() {
  localStorage.removeItem('accessToken');
  isLoggedInVar(false);
  userDataVar(null);
  window.location.href = '/profile'; // Adjust as necessary
  window.dispatchEvent(new CustomEvent('authUpdate'));
}

function handleAuthUpdate() {
  const token = localStorage.getItem('accessToken');
  if (token) {
    fetchUserData(token)
      .then((data) => {
        userDataVar(data);
        isLoggedInVar(true);
      })
      .catch((err) => {
        console.error('Failed to fetch user data:', err);
        logout(); // Ensures clean state on failure
      });
  } else {
    isLoggedInVar(false);
    userDataVar(null);
  }
}

export const ApolloClientProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    window.addEventListener('authUpdate', handleAuthUpdate);
    handleAuthUpdate();
    return () => {
      window.removeEventListener('authUpdate', handleAuthUpdate);
    };
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export {
  client as defaultApolloClient,
  login,
  logout,
  isLoggedInVar,
  userDataVar,
};
