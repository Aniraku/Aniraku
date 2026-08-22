export const PROVIDER_DISCOVERY_RETRY_DELAYS_MS = [0, 4_000, 8_000, 12_000]

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
