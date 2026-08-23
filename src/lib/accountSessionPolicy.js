function normalizeUsername(value, fallback = 'user') {
  const clean = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20)

  return clean.length >= 3 ? clean : fallback
}

export function isEmailIdentity(user) {
  return Boolean(
    user?.email && (
      user?.app_metadata?.provider === 'email' ||
      user?.identities?.some((identity) => identity.provider === 'email') ||
      (!user?.app_metadata?.provider && !user?.identities?.length)
    )
  )
}

export function isUnverifiedEmailUser(user) {
  return isEmailIdentity(user) && !user?.email_confirmed_at && !user?.confirmed_at
}

export function buildProfileSeed(user) {
  const metadata = user?.user_metadata || {}
  const emailPrefix = String(user?.email || '').split('@')[0]
  const fallback = `user_${String(user?.id || 'account').slice(0, 6)}`
  const username = normalizeUsername(metadata.username || emailPrefix, fallback)
  const displayName = String(metadata.display_name || username).trim() || username

  return {
    id: user?.id,
    username,
    display_name: displayName,
    bio: null,
    avatar_url: null,
  }
}
