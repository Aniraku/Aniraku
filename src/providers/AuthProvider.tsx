// TS port of Aniraku's src/hooks/useAuth.jsx (provider half) — verbatim
// semantics: server revalidation via getUser(access_token) with transient
// network tolerance, email-verification enforcement + PASSWORD_RECOVERY /
// recovery-marker exception, race-safe profile seed (insert-once, 23505
// re-read, never overwrite an existing name/username/bio), is_admin rpc,
// updateProfile with auth user_metadata mirror, signUp/signIn guards, and a
// best-effort signOut local-storage clear contract.
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { defaultAvatar } from '../lib/avatars';
import { buildProfileSeed, isUnverifiedEmailUser } from '../lib/accountSessionPolicy';

const PROFILE_COLUMNS =
  'id, username, display_name, bio, avatar_url, banner_url, location, socials, created_at';

export interface ProfileRow {
  id?: string | null;
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  location?: string | null;
  socials?: unknown;
  created_at?: string | null;
}

export interface ProfileUpdates {
  id?: string;
  username?: string;
  display_name?: string;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  location?: string | null;
  socials?: unknown;
}

export interface AuthContextValue {
  user: User | null;
  profile: ProfileRow | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    username?: string
  ) => Promise<{
    user: User | null;
    session: unknown;
    requiresEmailConfirmation: boolean;
  }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ user: User; session: unknown }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: ProfileUpdates) => Promise<void>;
  isSupabaseConfigured: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function sanitizeUsername(raw?: string): string {
  const base = (raw || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const clipped = base.slice(0, 20);
  return clipped.length >= 3 ? clipped : `user_${Math.random().toString(36).slice(2, 6)}`;
}

function hasRecoveryMarker(): boolean {
  if (typeof window === 'undefined' || window.location.pathname !== '/auth/new-password') return false;
  const url = new URL(window.location.href);
  return url.searchParams.get('type') === 'recovery' || /(?:^|&)type=recovery(?:&|$)/.test(url.hash.replace(/^#/, ''));
}

function isAllowedRecoverySession(event: string): boolean {
  return event === 'PASSWORD_RECOVERY' || hasRecoveryMarker();
}

interface AuthErrorLike {
  message?: string;
  code?: string;
  error_description?: string;
  error?: string;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setLoading(false);
  }, []);

  const rejectUnverifiedSession = useCallback(() => {
    clearAuthState();
    // Defer the Supabase call so it never runs inside onAuthStateChange's callback stack.
    window.setTimeout(() => {
      supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }, 0);
  }, [clearAuthState]);

  const fetchProfile = useCallback(async (authenticatedUser: User) => {
    const seed = buildProfileSeed(authenticatedUser);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', authenticatedUser.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile(data as ProfileRow);
      } else {
        // Never upsert a fallback over a pre-existing profile. A missing row is
        // created once; a uniqueness race is then re-read without overwriting
        // the name, username, or bio the account already saved.
        const fallbackAvatar = defaultAvatar(seed.username.charCodeAt(0)).url;
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authenticatedUser.id,
            username: seed.username,
            display_name: seed.display_name,
            avatar_url: fallbackAvatar,
          })
          .select(PROFILE_COLUMNS)
          .maybeSingle();
        if (createError && createError.code !== '23505') throw createError;
        if (created) {
          setProfile(created as ProfileRow);
        } else {
          const { data: existing, error: retryError } = await supabase
            .from('profiles')
            .select(PROFILE_COLUMNS)
            .eq('id', authenticatedUser.id)
            .maybeSingle();
          if (retryError) throw retryError;
          setProfile((existing as ProfileRow | null) || { ...seed, avatar_url: fallbackAvatar });
        }
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      setProfile({ ...seed, avatar_url: defaultAvatar(seed.username.charCodeAt(0)).url });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let mounted = true;

    let sessionRevision = 0;
    const applySession = async (session: { user?: User | null; access_token?: string } | null, event = '') => {
      const revision = ++sessionRevision;
      if (!mounted) return;
      const claimedUser = session?.user || null;

      if (!claimedUser) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (isUnverifiedEmailUser(claimedUser) && !isAllowedRecoverySession(event)) {
        rejectUnverifiedSession();
        return;
      }

      // A persisted browser session is only a local cache. Ask Supabase Auth
      // for the current user before allowing the app to retain a session, so a
      // deleted, stale, or unconfirmed account cannot appear signed in.
      const { data: serverUserData, error: serverUserError } = await supabase.auth.getUser(session?.access_token);
      if (!mounted || revision !== sessionRevision) return;
      const nextUser = serverUserData?.user || null;

      // Transient network failures should not sign the user out — keep the
      // cached session so deploys and flaky connections don't force re-login.
      const isTransient = Boolean(serverUserError && (
        serverUserError.message?.includes('Failed to fetch') ||
        serverUserError.message?.includes('NetworkError') ||
        serverUserError.message?.includes('timeout') ||
        (serverUserError as AuthErrorLike).code === 'network_request_failed'
      ));
      if (isTransient && claimedUser) {
        setUser(claimedUser);
        fetchProfile(claimedUser);
        return;
      }

      if (
        serverUserError ||
        !nextUser ||
        nextUser.id !== claimedUser.id ||
        (isUnverifiedEmailUser(nextUser) && !isAllowedRecoverySession(event))
      ) {
        rejectUnverifiedSession();
        return;
      }

      setLoading(true);
      setUser(nextUser);
      fetchProfile(nextUser);
      supabase.rpc('is_admin').then(
        ({ data }) => { if (mounted) setIsAdmin(Boolean(data)); },
        () => { if (mounted) setIsAdmin(false); },
      );
    };

    supabase.auth.getSession().then(({ data: { session } }) => { void applySession(session); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      void applySession(session, event);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchProfile, rejectUnverifiedSession]);

  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    const clean = sanitizeUsername(username || email.split('@')[0]);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: clean, display_name: clean },
        // Confirm link returns to the CURRENT host — dev (localhost:3000) and
        // prod (https://www.aniraku.tech) both land signed-in, instead of
        // always bouncing to the Site URL and stranding localhost sessions.
        // Requires those two URLs in Supabase Auth → URL Configuration →
        // Additional Redirect URLs.
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    if (!data.user?.identities?.length) {
      throw new Error('This email is already registered. Try signing in instead.');
    }
    if (data.user && isUnverifiedEmailUser(data.user) && data.session) {
      clearAuthState();
      await supabase.auth.signOut({ scope: 'local' });
    }
    return { ...data, requiresEmailConfirmation: isUnverifiedEmailUser(data.user) };
  }, [clearAuthState]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // A failed login must never leave a previous local session active. This
      // prevents an invalid attempt from appearing to succeed after navigation
      // or refresh, including sessions created before email verification.
      clearAuthState();
      await supabase.auth.signOut({ scope: 'local' });
      throw error;
    }
    if (data.user && isUnverifiedEmailUser(data.user)) {
      clearAuthState();
      await supabase.auth.signOut({ scope: 'local' });
      throw new Error('Please verify your email address before signing in. Check your inbox for the confirmation link.');
    }
    const { data: verifiedUserData, error: verifiedUserError } = await supabase.auth.getUser(data.session?.access_token);
    const verifiedUser = verifiedUserData?.user || null;
    if (verifiedUserError || !verifiedUser || verifiedUser.id !== data.user?.id || isUnverifiedEmailUser(verifiedUser)) {
      clearAuthState();
      await supabase.auth.signOut({ scope: 'local' });
      throw new Error('Your account must be verified before signing in.');
    }
    return { ...data, user: verifiedUser };
  }, [clearAuthState]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // The local Supabase session is already cleared when this request fails.
    }
    try {
      localStorage.removeItem('aniraku:bookmarks');
      localStorage.removeItem('aniraku:watching');
      localStorage.removeItem('aniraku:episode-track');
      localStorage.removeItem('aniraku:notifications-read');
      localStorage.removeItem('aniraku-bookmarks');
      localStorage.removeItem('aniraku-watch-history');
      localStorage.removeItem('aniraku-episode-track');
      localStorage.removeItem('aniraku-nsfw-enabled');
    } catch {
      // Local cleanup is best effort and must not block the auth state reset.
    }
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const updateProfile = useCallback(async (updates: ProfileUpdates) => {
    if (!user) return;
    const { id: _id, ...fields } = updates;
    if (fields.username) fields.username = sanitizeUsername(fields.username);
    // Use .update() to avoid NOT NULL violation on username when only updating avatar/bio
    const { error } = await supabase.from('profiles').update(fields).eq('id', user.id);
    if (error) throw error;
    if (fields.username || fields.display_name) {
      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          username: fields.username || user.user_metadata?.username,
          display_name: fields.display_name || user.user_metadata?.display_name,
        },
      });
      if (metaErr) throw metaErr;
    }
    setProfile(prev => ({ ...prev, ...fields }));
  }, [user]);

  const ctx = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isSupabaseConfigured,
  }), [user, profile, isAdmin, loading, signUp, signIn, signOut, updateProfile]);

  return (
    <AuthContext.Provider value={ctx}>
      {children}
    </AuthContext.Provider>
  );
};

// Re-exported for source parity with Aniraku's useAuth.jsx exports.
export type { AuthErrorLike };
