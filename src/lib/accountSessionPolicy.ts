// TS port of Aniraku's src/lib/accountSessionPolicy.js — byte-equivalent logic.
import type { User } from '@supabase/supabase-js';

function normalizeUsername(value: unknown, fallback = 'user'): string {
  const clean = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20);

  return clean.length >= 3 ? clean : fallback;
}

export function isEmailIdentity(user: User | null | undefined): boolean {
  return Boolean(
    user?.email &&
    (
      user?.app_metadata?.provider === 'email' ||
      user?.identities?.some((identity) => identity.provider === 'email') ||
      (!user?.app_metadata?.provider && !user?.identities?.length)
    )
  );
}

export function isUnverifiedEmailUser(user: User | null | undefined): boolean {
  return isEmailIdentity(user) && !user?.email_confirmed_at && !user?.confirmed_at;
}

export interface ProfileSeed {
  id: string | undefined;
  username: string;
  display_name: string;
  bio: null;
  avatar_url: null;
}

export function buildProfileSeed(user: User | null | undefined): ProfileSeed {
  const metadata = user?.user_metadata || {};
  const emailPrefix = String(user?.email || '').split('@')[0];
  const fallback = `user_${String(user?.id || 'account').slice(0, 6)}`;
  const username = normalizeUsername(metadata.username || emailPrefix, fallback);
  const displayName = String(metadata.display_name || username).trim() || username;

  return {
    id: user?.id,
    username,
    display_name: displayName,
    bio: null,
    avatar_url: null,
  };
}
