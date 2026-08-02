import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../config'

const api = (path) => fetch(`${API_BASE}${path}`).then(r => {
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
})

export function useTrendingAnime() {
  return useQuery(['trending'], () => api('/api/v1/trending?page=1&perPage=10'), { staleTime: 300000 })
}

export function usePopular() {
  return useQuery(['popular'], () => api('/api/v1/browse?sort=POPULARITY_DESC&page=1&perPage=20').then(d => d.media || []), { staleTime: 300000 })
}

export function useAiring() {
  return useQuery(['airing'], () => api('/api/v1/browse?status=RELEASING&sort=POPULARITY_DESC&page=1&perPage=20').then(d => d.media || []), { staleTime: 300000 })
}

export function useMovies() {
  return useQuery(['movies'], () => api('/api/v1/browse?format=MOVIE&sort=SCORE_DESC&page=1&perPage=20').then(d => d.media || []), { staleTime: 300000 })
}

export function useSeries() {
  return useQuery(['series'], () => api('/api/v1/browse?format=TV&sort=SCORE_DESC&page=1&perPage=20').then(d => d.media || []), { staleTime: 300000 })
}

export function useGenre({ genre }) {
  return useQuery(['genres', genre], () => api(`/api/v1/browse?genre=${encodeURIComponent(genre)}&page=1&perPage=20`).then(d => d.media || []), { staleTime: 300000 })
}

export function useAnimeDetails(id) {
  return useQuery(['anime', id], () => api(`/api/v1/anime/${id}`), { enabled: !!id, staleTime: 300000 })
}

export function useSimilar(id) {
  return useQuery(['similar', id], () => api(`/api/v1/anime/${id}/similar?page=1&perPage=12`).then(d => d.media || []), { enabled: !!id, staleTime: 300000 })
}

export function useAnimeEpisodes(id) {
  return useQuery(['episodes', id], () => api(`/api/v1/anime/${id}/episodes`).then(d => d.episodes || []), { enabled: !!id, staleTime: 300000 })
}
