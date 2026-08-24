const DEFAULT_API_BASE = 'https://api.aniraku.tech'

function apiBase() {
  return (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : DEFAULT_API_BASE)).replace(/\/$/, '')
}

function queryPath(path, options = {}) {
  const params = new URLSearchParams()
  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => params.append(key, item))
      return
    }
    params.set(key, String(value))
  })
  const suffix = params.toString()
  return `${path}${suffix ? `?${suffix}` : ''}`
}

export class AnirakuMetadataError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'AnirakuMetadataError'
    this.status = status
  }
}

export async function anirakuMetadataRequest(path) {
  let response
  try {
    response = await fetch(`${apiBase()}${path}`, { headers: { Accept: 'application/json' } })
  } catch {
    throw new AnirakuMetadataError('Aniraku metadata is unavailable. Check your connection and try again.')
  }
  const raw = await response.text()
  let payload = {}
  try { payload = raw ? JSON.parse(raw) : {} } catch { throw new AnirakuMetadataError('Aniraku returned an unreadable metadata response.', response.status) }
  if (!response.ok) throw new AnirakuMetadataError(payload.error || payload.message || 'Aniraku metadata is unavailable right now.', response.status)
  return payload
}

export async function getAnimeMetadata(id) {
  return anirakuMetadataRequest(`/api/v1/anime/${encodeURIComponent(id)}`)
}

export async function getTrendingAnime({ page = 1, perPage = 20 } = {}) {
  const payload = await anirakuMetadataRequest(queryPath('/api/v1/trending', { page, perPage }))
  return Array.isArray(payload) ? payload : (payload.media || [])
}

export async function browseAnime(options = {}) {
  const payload = await anirakuMetadataRequest(queryPath('/api/v1/browse', options))
  return {
    media: Array.isArray(payload?.media) ? payload.media : [],
    pageInfo: payload?.pageInfo || { currentPage: Number(options.page || 1), hasNextPage: false, lastPage: 1, perPage: Number(options.perPage || 20), total: 0 },
  }
}

export async function searchAnime(query, options = {}) {
  const payload = await anirakuMetadataRequest(queryPath('/api/v1/search', { q: query, ...options }))
  return {
    media: Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload?.media) ? payload.media : []),
    pageInfo: payload?.pageInfo || { currentPage: Number(options.page || 1), hasNextPage: false, lastPage: 1, perPage: Number(options.perPage || 20), total: 0 },
  }
}

export async function getAnimeRelations(id) {
  const payload = await anirakuMetadataRequest(`/api/v1/anime/${encodeURIComponent(id)}/relations`)
  return Array.isArray(payload?.relations) ? payload.relations : (Array.isArray(payload) ? payload : [])
}

export async function getGenres() {
  const payload = await anirakuMetadataRequest('/api/v1/genres')
  return Array.isArray(payload) ? payload : (payload?.genres || [])
}

export async function getSchedule(options = {}) {
  return anirakuMetadataRequest(queryPath('/api/v1/schedule', options))
}
