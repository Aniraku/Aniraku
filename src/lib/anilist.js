const ANILIST_URL = 'https://graphql.anilist.co'

export async function anilistQuery(query, variables = {}) {
  const body = JSON.stringify({ query, variables })

  // ponytail: try direct first (works with extensions/CORS)
  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body,
    })
    if (res.ok) {
      const json = await res.json()
      if (json.data) return json
    }
  } catch {}

  // ponytail: corsproxy.io — raw URL, no encoding
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(ANILIST_URL)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(ANILIST_URL)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ANILIST_URL)}`,
  ]

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body,
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) return json
      }
    } catch {}
  }

  throw new Error('AniList: all methods failed')
}

// --- Queries ---

export const BROWSE_QUERY = `
  query ($page: Int, $perPage: Int, $search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $season: MediaSeason, $year: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total lastPage hasNextPage currentPage perPage }
      media(search: $search, genre: $genre, format: $format, status: $status, season: $season, seasonYear: $year, type: ANIME, sort: $sort, isAdult: false) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
  }
`

export const TRENDING_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING, isAdult: false) {
        id title { romaji english userPreferred }
        coverImage { extraLarge large }
        format episodes averageScore status
      }
    }
  }
`

export const ANIME_DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id title { romaji english native userPreferred }
      coverImage { extraLarge large medium color }
      bannerImage format status episodes duration genres averageScore popularity description season seasonYear
      nextAiringEpisode { episode airingAt }
      relations { edges { relationType node { id title { romaji english } format type } } }
    }
  }
`

export const SCHEDULE_QUERY = `
  query ($weekStart: Int, $weekEnd: Int) {
    Page(perPage: 50) {
      media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
        id title { romaji english userPreferred }
        coverImage { large }
        format
        airingSchedule(notYetAired: true, greaterThan: $weekStart, lessThan: $weekEnd) {
          nodes { episode airingAt timeUntilAiring }
        }
      }
    }
  }
`
