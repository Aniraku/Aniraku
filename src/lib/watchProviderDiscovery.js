export const PROVIDER_DISCOVERY_RETRY_DELAYS_MS = [0, 4_000, 8_000, 12_000]

// Ally is a degraded browser fallback. Do not offer it while another non-Bonk
// server has a source, but retain it if it is the sole source-bearing option
// or the only alternative is Bonk.
// This is deliberately a control-list decision, not source filtering: an
// actively playing server is never rebuilt or switched by this helper.
const BROWSER_DEPRIORITIZED_PROVIDER_NAMES = new Set(['ally'])

function serverName(server) {
  return String(server?.name || '').trim().toLowerCase()
}

export function isBonkProvider(server) {
  const values = [server?.name, server?.provider, server?.label, server?.id]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
  return values.some((value) => /(^|[:\s_-])bonk($|[:\s_-])/.test(value))
}

function isNativeBonkSource(source) {
  const rawUrl = typeof source === 'string' ? source : source?.url
  const url = String(rawUrl || '').trim()
  if (!url) return false
  const rawType = String(typeof source === 'string' ? '' : source?.type || source?.mime || '').toLowerCase()
  const verification = String(typeof source === 'string' ? '' : source?.verification || source?.Verification || '').toLowerCase()
  if (verification === 'dead') return false
  return !/(^|\s)(embed|iframe|page)(\s|$)/.test(rawType)
    && !/(?:\/embed(?:[/?]|$)|\/e\/|iframe)/i.test(url)
}

export function bonkHasDirectOrProxySource(server) {
  return Array.isArray(server?.sources) && server.sources.some(isNativeBonkSource)
}

function serverHasSource(server) {
  return Array.isArray(server?.sources) && server.sources.some((source) => {
    if (typeof source === 'string') return Boolean(source.trim())
    return Boolean(String(source?.url || '').trim())
  })
}

export function filterBrowserProviders(servers = []) {
  const candidates = (Array.isArray(servers) ? servers : [])
    .filter((server) => serverName(server))
    // Bonk's embedded player is unreliable. A Bonk row is meaningful only
    // when its resolver supplied direct or proxy-capable media; every other
    // provider retains the established Direct → Proxy → Embed behavior.
    .filter((server) => !isBonkProvider(server) || bonkHasDirectOrProxySource(server))
  // Bonk may expose a direct/proxy source but still be unable to start for a
  // particular episode. Do not let Bonk alone hide Ally: the user can then
  // manually choose Ally's verified embedded fallback. Ally is still hidden
  // when another non-Bonk, non-deprioritized provider has a real source.
  const hasNonBonkPlayableAlternative = candidates.some((server) => (
    !isBonkProvider(server)
      && !BROWSER_DEPRIORITIZED_PROVIDER_NAMES.has(serverName(server))
      && serverHasSource(server)
  ))
  if (!hasNonBonkPlayableAlternative) return candidates
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
