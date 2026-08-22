export const PROVIDER_DISCOVERY_RETRY_DELAYS_MS = [0, 4_000, 8_000, 12_000]

// Ally's currently returned browser sources have been independently verified
// to fail: its proxy HLS route falls through and its Byse recovery page is a
// 404. Keep backend/native availability intact, but do not advertise this
// unusable server in browser Watch controls until a playable web source exists.
const BROWSER_DISABLED_PROVIDER_NAMES = new Set(['ally'])

export function filterBrowserProviders(servers = []) {
  return (Array.isArray(servers) ? servers : []).filter((server) => {
    const name = String(server?.name || '').trim().toLowerCase()
    return name && !BROWSER_DISABLED_PROVIDER_NAMES.has(name)
  })
}

export function mergeProviderServers(existing = [], incoming = []) {
  const merged = new Map()
  for (const server of [...existing, ...incoming]) {
    if (!server?.name) continue
    const key = `${server.provider || 'miruro'}:${server.name}:${server.lang || ''}`
    // A later resolver response supersedes the older payload for the same
    // provider while retaining every provider already found for this episode.
    merged.set(key, server)
  }
  return [...merged.values()]
}
