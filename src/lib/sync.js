import { supabase } from './supabase'
import { API_BASE } from '../config'

// Thin client for the backend MAL / AniList watch-progress sync.
// The backend authenticates these endpoints with the Supabase JWT, so
// every call attaches the current session's access token.

async function authHeaders(extra = {}) {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function getSyncStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sync`, {
      cache: 'no-store',
      headers: await authHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// Fetch the provider's authorize URL, then hand the browser off to it.
// A plain location redirect can't carry the auth header, so the URL must
// be requested first.
export async function syncAuthorize(provider) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sync/${provider}/authorize`, {
      headers: await authHeaders(),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.url || null
  } catch {
    return null
  }
}

export async function completeSyncCallback(provider, code, state) {
  try {
    // Provider-agnostic callback: MAL / AniList redirect back with only
    // ?code=&state= (no provider), and the backend resolves the provider
    // from its pending OAuth state store.
    const res = await fetch(`${API_BASE}/api/v1/sync/callback`, {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ code, state }),
    })
    return res.json().catch(() => ({}))
  } catch {
    return { error: 'network' }
  }
}

export async function syncDisconnect(provider) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sync/${provider}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function updateSyncProgress({
  provider,
  animeId,
  episode,
  progress,
  status,
}) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sync/update`, {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ provider, animeId, episode, progress, status }),
    })
    return res.ok
  } catch {
    return false
  }
}

export const PROVIDER_LABELS = {
  mal: 'MyAnimeList',
  anilist: 'AniList',
}
