import { useQuery } from '@tanstack/react-query'
import { browseAnime, getAnimeMetadata, getTrendingAnime } from '../lib/anirakuMetadata'

async function browse(variables) {
  const { media } = await browseAnime(variables)
  return media
}

async function fetchHomePageData() {
  const [trending, airing, movies, topTV] = await Promise.all([
    getTrendingAnime({ page: 1, perPage: 20 }),
    browse({ page: 1, perPage: 20, status: 'RELEASING', sort: 'POPULARITY_DESC' }),
    browse({ page: 1, perPage: 20, format: 'MOVIE', sort: 'TRENDING_DESC' }),
    browse({ page: 1, perPage: 20, format: 'TV', sort: 'SCORE_DESC' }),
  ])
  return {
    trending,
    airing,
    movies,
    topTV,
  }
}

export function useTrendingAnime() {
  return useQuery(['trending'], async () => {
    return browse({ page: 1, perPage: 10, sort: ['TRENDING'] })
  }, { staleTime: 300000, cacheTime: Infinity })
}

export function usePopular() {
  return useQuery(['popular'], async () => {
    return browse({ page: 1, perPage: 20, sort: ['POPULARITY_DESC'] })
  }, { staleTime: 300000, cacheTime: Infinity })
}

export function useAiring() {
  return useQuery(['airing'], async () => {
    return browse({ page: 1, perPage: 20, status: 'RELEASING', sort: ['POPULARITY_DESC'] })
  }, { staleTime: 300000, cacheTime: Infinity })
}

export function useMovies() {
  return useQuery(['movies'], async () => {
    return browse({ page: 1, perPage: 20, format: 'MOVIE', sort: ['SCORE_DESC'] })
  }, { staleTime: 300000, cacheTime: Infinity })
}

export function useSeries() {
  return useQuery(['series'], async () => {
    return browse({ page: 1, perPage: 20, format: 'TV', sort: ['SCORE_DESC'] })
  }, { staleTime: 300000, cacheTime: Infinity })
}

// Combined home page data - single request for all sections
export function useHomePageData() {
  return useQuery(['homepage'], fetchHomePageData, { 
    staleTime: 300000, 
    cacheTime: Infinity,
    // Prefetch next pages for instant navigation
    // onSuccess: () => {
    //   queryClient.prefetchQuery(['popular', 2], () => browse({ page: 2, perPage: 20, sort: ['POPULARITY_DESC'] }))
    // }
  })
}

export function useGenre({ genre }) {
  return useQuery(['genres', genre], async () => {
    return browse({ page: 1, perPage: 20, genre })
  }, { staleTime: 300000, cacheTime: Infinity })
}

export function useAnimeDetails(id) {
  return useQuery(['anime', id], async () => {
    const anime = await getAnimeMetadata(id)
    if (!anime?.id) throw new Error('Aniraku metadata returned no anime')
    return anime
  }, { enabled: !!id, staleTime: 300000 })
}
