import { useQuery } from '@tanstack/react-query'
import { anilistQuery, ANIME_DETAIL_QUERY, BROWSE_QUERY, getAnirakuSchedule } from '../lib/anilist'

async function browse(variables) {
  const { data } = await anilistQuery(BROWSE_QUERY, variables)
  return data.Page.media || []
}

async function fetchHomePageData() {
  const [metadata, scheduleData] = await Promise.all([
    anilistQuery(`
    query {
      trending: Page(page: 1, perPage: 10) {
        media(type: ANIME, sort: TRENDING_DESC) {
          id title { romaji english native userPreferred }
          coverImage { extraLarge large medium color }
          bannerImage description(asHtml: false) nextAiringEpisode { episode airingAt }
          format status episodes averageScore popularity genres isAdult
        }
      }
      airing: Page(page: 1, perPage: 20) {
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
          id title { romaji english native userPreferred }
          coverImage { extraLarge large medium color }
          bannerImage description(asHtml: false) nextAiringEpisode { episode airingAt }
          format status episodes averageScore popularity genres isAdult
        }
      }
      movies: Page(page: 1, perPage: 20) {
        media(type: ANIME, format: MOVIE, sort: TRENDING_DESC) {
          id title { romaji english native userPreferred }
          coverImage { extraLarge large medium color }
          bannerImage description(asHtml: false) nextAiringEpisode { episode airingAt }
          format status episodes averageScore popularity genres isAdult
        }
      }
      topTV: Page(page: 1, perPage: 20) {
        media(type: ANIME, format: TV, sort: SCORE_DESC) {
          id title { romaji english native userPreferred }
          coverImage { extraLarge large medium color }
          bannerImage description(asHtml: false) nextAiringEpisode { episode airingAt }
          format status episodes averageScore popularity genres isAdult
        }
      }
    }
  `, {}),
    getAnirakuSchedule({ page: 1, perPage: 12 }).catch((error) => {
      console.warn('Preview next-airing schedule is unavailable:', error)
      return { schedule: [] }
    }),
  ])
  const { data } = metadata
  const schedule = Array.isArray(scheduleData?.schedule) ? scheduleData.schedule : []
  const nextAiringById = new Map(schedule.map((item) => [item.id, item.nextAiringEpisode]))
  const withScheduledNextAiring = (media) => (media || []).map((item) => {
    const nextAiringEpisode = nextAiringById.get(item?.id)
    return nextAiringEpisode ? { ...item, nextAiringEpisode } : item
  })
  return {
    trending: withScheduledNextAiring(data.trending.media),
    airing: withScheduledNextAiring(data.airing.media),
    movies: withScheduledNextAiring(data.movies.media),
    topTV: withScheduledNextAiring(data.topTV.media),
    schedule,
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
    const response = await anilistQuery(ANIME_DETAIL_QUERY, { id: Number(id) })
    const anime = response?.data?.Media
    if (!anime?.id) throw new Error('Metadata resolver returned no anime')
    return anime
  }, { enabled: !!id, staleTime: 300000 })
}
