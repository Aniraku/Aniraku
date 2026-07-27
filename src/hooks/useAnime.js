import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../config'

const API = API_BASE

export function useLatestEpisode() {
  return useQuery(['episodes'], async () => {
    const { data } = await axios.get(`${API}/api/v1/trending?perPage=20`)
    return Array.isArray(data) ? data : []
  })
}

export function useSeries() {
  return useQuery(['series'], async () => {
    const { data } = await axios.get(`${API}/api/v1/browse?format=TV&sort=SCORE_DESC&perPage=20`)
    return data.media || []
  })
}

export function usePopular() {
  return useQuery(['popular'], async () => {
    const { data } = await axios.get(`${API}/api/v1/browse?sort=POPULARITY_DESC&perPage=20`)
    return data.media || []
  })
}

export function useAiring() {
  return useQuery(['airing'], async () => {
    const { data } = await axios.get(`${API}/api/v1/browse?status=RELEASING&sort=POPULARITY_DESC&perPage=20`)
    return data.media || []
  })
}

export function useMovies() {
  return useQuery(['movies'], async () => {
    const { data } = await axios.get(`${API}/api/v1/browse?format=MOVIE&sort=SCORE_DESC&perPage=20`)
    return data.media || []
  })
}

export function useGenre({ genre }) {
  return useQuery(['genres', genre], async () => {
    const { data } = await axios.get(`${API}/api/v1/browse?genre=${genre}&perPage=20`)
    return data.media || []
  })
}

export const useSearchAnime = (filter) => {
  return useQuery(['searchAnime', filter], async () => {
    if (!filter || filter.length < 2) return []
    const { data } = await axios.get(`${API}/api/v1/search?q=${encodeURIComponent(filter)}`)
    return data.results || []
  }, { enabled: !!filter && filter.length > 1 })
}

export function useTrendingAnime() {
  return useQuery(['trending'], async () => {
    const { data } = await axios.get(`${API}/api/v1/trending?perPage=10`)
    return Array.isArray(data) ? data : []
  })
}

export function useAnimeDetails(id) {
  return useQuery(['anime', id], async () => {
    const { data } = await axios.get(`${API}/api/v1/anime/${id}`)
    return data
  }, { enabled: !!id })
}

export function useAnimeEpisodes(id) {
  return useQuery(['episodes', id], async () => {
    const { data } = await axios.get(`${API}/api/v1/anime/${id}/episodes`)
    return data.episodes || []
  }, { enabled: !!id })
}
