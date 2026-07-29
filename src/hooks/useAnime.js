import { useQuery } from '@tanstack/react-query'
import { anilistQuery, BROWSE_QUERY, ANIME_DETAIL_QUERY } from '../lib/anilist'

async function browse(variables) {
  const { data } = await anilistQuery(BROWSE_QUERY, variables)
  return data.Page.media || []
}

export function useTrendingAnime() {
  return useQuery(['trending'], async () => {
    return browse({ page: 1, perPage: 10, sort: ['TRENDING'] })
  }, { staleTime: 300000 })
}

export function usePopular() {
  return useQuery(['popular'], async () => {
    return browse({ page: 1, perPage: 20, sort: ['POPULARITY_DESC'] })
  }, { staleTime: 300000 })
}

export function useAiring() {
  return useQuery(['airing'], async () => {
    return browse({ page: 1, perPage: 20, status: 'RELEASING', sort: ['POPULARITY_DESC'] })
  }, { staleTime: 300000 })
}

export function useMovies() {
  return useQuery(['movies'], async () => {
    return browse({ page: 1, perPage: 20, format: 'MOVIE', sort: ['SCORE_DESC'] })
  }, { staleTime: 300000 })
}

export function useSeries() {
  return useQuery(['series'], async () => {
    return browse({ page: 1, perPage: 20, format: 'TV', sort: ['SCORE_DESC'] })
  }, { staleTime: 300000 })
}

export function useGenre({ genre }) {
  return useQuery(['genres', genre], async () => {
    return browse({ page: 1, perPage: 20, genre })
  }, { staleTime: 300000 })
}

export function useAnimeDetails(id) {
  return useQuery(['anime', id], async () => {
    const { data } = await anilistQuery(ANIME_DETAIL_QUERY, { id: parseInt(id) })
    return data.Media
  }, { enabled: !!id, staleTime: 300000 })
}

export function useAnimeEpisodes(id) {
  return useQuery(['episodes', id], async () => {
    const { data } = await anilistQuery(ANIME_DETAIL_QUERY, { id: parseInt(id) })
    const media = data.Media
    if (!media) return []
    const count = media.episodes || 12
    return Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      title: `Episode ${i + 1}`,
      thumbnail: media.coverImage?.medium || '',
    }))
  }, { enabled: !!id, staleTime: 300000 })
}
