import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { UserData } from './userInfoTypes'; // Adjust the path as necessary
import {
  fetchUserData,
  buildAuthUrl,
  generateCsrfToken,
} from './authService'; // Adjust the path as necessary

type AuthContextType = {
  isLoggedIn: boolean;
  userData: UserData | null;
  username: string | null; // This property must be handled
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Stale-while-revalidate snapshot of the AniList user. Rendering the whole
// app used to be BLOCKED (`return null`) until fetchUserData resolved —
// every signed-in page load stared at a blank screen for the full AniList
// round trip. Now the cached snapshot renders immediately and the network
// refresh lands on top of it.
const AUTH_USER_CACHE_KEY = 'aniraku:anilist-user';

function readCachedUser(): UserData | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(data: UserData): void {
  try {
    localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable — SWR cache is best-effort
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Lazy init reads localStorage once, synchronously (cheap, single keys):
  // token + cached snapshot → render signed-in UI immediately;
  // token without snapshot (first boot after login) → keep the brief
  // blocking load rather than flashing logged-out chrome.
  const [boot] = useState(() => {
    const token = localStorage.getItem('accessToken');
    const cached = token ? readCachedUser() : null;
    return {
      hasToken: Boolean(token),
      cached,
    };
  });
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(boot.cached));
  const [userData, setUserData] = useState<UserData | null>(boot.cached);
  const [authLoading, setAuthLoading] = useState(
    boot.hasToken && !boot.cached,
  ); // Add a loading state for auth status

  // Calculate username from userData
  const username = userData ? userData.name : null; // Assuming 'username' is a property of UserData

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserData(token)
        .then((data) => {
          setUserData(data);
          setIsLoggedIn(true);
          writeCachedUser(data);
          setAuthLoading(false); // Set loading to false once user data is fetched
        })
        .catch((err) => {
          console.error('Failed to fetch user data:', err);
          logout(); // Ensures clean state on failure (also clears the snapshot)
          setAuthLoading(false); // Ensure loading state is handled even in error
        });
    } else {
      setAuthLoading(false); // If no token, ensure loading state is set to false
    }
  }, []);

  const login = async () => {
    // No server-side CSRF roundtrip: the state token is generated locally and
    // the browser is redirected straight to AniList. (The old flow called
    // GET /get-csrf-token, an endpoint that does not exist, which made every
    // login attempt fail.)
    try {
      const csrfToken = generateCsrfToken();
      const authUrl = buildAuthUrl(csrfToken);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error building auth URL:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem(AUTH_USER_CACHE_KEY);
    setIsLoggedIn(false);
    setUserData(null);
    setAuthLoading(true); // Reset auth loading state on logout
    window.location.href = '/profile';
    window.dispatchEvent(new CustomEvent('authUpdate'));
  };

  // Block only when the status is genuinely unknown (token exists but no
  // snapshot — one-time window right after login). Returning signed-in
  // visitors render instantly from the snapshot.
  if (authLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, userData, username, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
