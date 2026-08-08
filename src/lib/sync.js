import { API_BASE } from '../config'

// Thin client for the backend MAL / AniList watch-progress sync.
// All endpoints are session-cookie based (same-site backend), so no
// auth headers are needed here.

export async function getSyncStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sync`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function syncAuthorizeUrl(provider) {
  return `${API_BASE}/api/v1/sync/${provider}/authorize`
}

export async function syncDisconnect(provider) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sync/${provider}`, {
      method: 'DELETE',
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
      headers: { 'Content-Type': 'application/json' },
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
