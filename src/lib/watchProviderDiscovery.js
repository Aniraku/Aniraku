export const PROVIDER_DISCOVERY_RETRY_DELAYS_MS = [0, 4_000, 8_000, 12_000]

// Ally is a degraded browser fallback. Do not offer it while another returned
// server has a source, but retain it if it is the sole source-bearing option.
// This is deliberately a control-list decision, not source filtering: an
// actively playing server is never rebuilt or switched by this helper.
const BROWSER_DEPRIORITIZED_PROVIDER_NAMES = new Set(['ally'])

function serverName(server) {
  return String(server?.name || '').trim().toLowerCase()
}

function serverHasSource(server) {
  return Array.isArray(server?.sources) && server.sources.some((source) => {
    if (typeof source === 'string') return Boolean(source.trim())
    return Boolean(String(source?.url || '').trim())
  })
}

export function filterBrowserProviders(servers = []) {
  const candidates = (Array.isArray(servers) ? servers : []).filter((server) => serverName(server))
  const hasPlayableAlternative = candidates.some((server) => (
    !BROWSER_DEPRIORITIZED_PROVIDER_NAMES.has(serverName(server)) && serverHasSource(server)
  ))
  if (!hasPlayableAlternative) return candidates
  return candidates.filter((server) => !BROWSER_DEPRIORITIZED_PROVIDER_NAMES.has(serverName(server)))
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
