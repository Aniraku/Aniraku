import axios from 'axios';
import { year, getCurrentSeason, getNextSeason } from '../index';

// ---------------------------------------------------------------------------
// Aniraku data layer — post-Consumet wiring
// - Metadata (search, lists, anime info): AniList GraphQL DIRECT from browser
// - Episodes metadata: Aniraku Backend (AniZip + TMDB merge)
// - Streaming: Aniraku Backend (POST /api/v1/stream, GET /api/v1/servers)
// ---------------------------------------------------------------------------

function ensureUrlEndsWithSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

// Aniraku API base (streaming + episode metadata). Full switch: no Consumet.
// Example: VITE_BACKEND_URL="https://api.aniraku.tech/"
const ANIRAKU_BASE = ensureUrlEndsWithSlash(
  (import.meta.env.VITE_BACKEND_URL as string) || 'https://api.aniraku.tech/',
);

export const ANIRAKU_API_BASE = ANIRAKU_BASE;

// Subtitle (and other media) URLs from Aniraku arrive RAW — the backend
// deliberately does not proxy-wrap them (see proxySources in the backend:
// the web client must wrap them itself with headers + cache nonce).
export function proxiedMediaUrl(
  url: string,
  headers?: Record<string, string> | null,
) {
  if (!url || url.includes('/api/v1/proxy?')) return url;
  const h =
    headers && Object.keys(headers).length > 0
      ? `&headers=${encodeURIComponent(JSON.stringify(headers))}`
      : '';
  return `${ANIRAKU_BASE}api/v1/proxy?url=${encodeURIComponent(url)}${h}`;
}

const ANILIST_GRAPHQL = 'https://graphql.anilist.co';
// Module-level AniList availability signal for the global outage banner.
function reportAnilistStatus(unavailable: boolean): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('aniraku:anilist-status', { detail: { unavailable } }));
}

const SKIP_TIMES = ensureUrlEndsWithSlash(
  (import.meta.env.VITE_SKIP_TIMES as string) || 'https://api.aniskip.com/',
);
let PROXY_URL = import.meta.env.VITE_PROXY_URL as string | undefined;
if (PROXY_URL) {
  PROXY_URL = ensureUrlEndsWithSlash(PROXY_URL);
}

// Plain axios for direct calls (no API-key header — AniList + Aniraku public
// endpoints don't use it). Keep a keyed instance only for legacy proxy use.
const directAxios = axios.create({ timeout: 15000 });
// Aniraku /servers fans out to every provider (up to ~90s server-side), so it
// needs its own long-timeout client. /stream gets 55s per request.
const anirakuLongAxios = axios.create({ timeout: 100000 });

// ---------------------------------------------------------------------------
// AniList -> Aniraku shape adapters (keep UI components untouched)
// ---------------------------------------------------------------------------

function mapAnilistStatus(s?: string | null): string {
  switch ((s || '').toUpperCase()) {
    case 'RELEASING':
      return 'Ongoing';
    case 'FINISHED':
      return 'Completed';
    case 'NOT_YET_RELEASED':
      return 'Not yet aired';
    case 'CANCELLED':
      return 'Cancelled';
    case 'HIATUS':
      return 'Hiatus';
    default:
      return s || 'Unknown';
  }
}

function pickImage(coverImage: any, bannerImage?: string) {
  const img =
    coverImage?.extraLarge || coverImage?.large || coverImage?.medium || '';
  const cover = bannerImage || img || '';
  return { img, cover };
}

export function mapAnilistMediaToAnime(m: any) {
  const { img, cover } = pickImage(m?.coverImage, m?.bannerImage);
  const nextAiring = m?.nextAiringEpisode
    ? {
        episode: m.nextAiringEpisode.episode,
        airingAt: m.nextAiringEpisode.airingAt,
        // Consumet compat: Watch.tsx reads nextAiringEpisode.airingTime
        airingTime: m.nextAiringEpisode.airingAt,
        timeUntilAiring: m.nextAiringEpisode.timeUntilAiring,
      }
    : undefined;
  return {
    id: String(m?.id ?? ''),
    malId: m?.idMal != null ? String(m.idMal) : '',
    title: {
      romaji: m?.title?.romaji ?? '',
      english: m?.title?.english ?? '',
      native: m?.title?.native ?? '',
      userPreferred: m?.title?.userPreferred ?? '',
    },
    synonyms: m?.synonyms ?? [],
    isLicensed: false,
    isAdult: !!m?.isAdult,
    countryOfOrigin: m?.countryOfOrigin ?? '',
    image: img,
    imageHash: '',
    cover,
    coverHash: '',
    description: m?.description ?? '',
    status: mapAnilistStatus(m?.status),
    releaseDate: m?.seasonYear ?? m?.startDate?.year ?? 0,
    totalEpisodes: m?.episodes ?? 0,
    currentEpisode: nextAiring
      ? Math.max((nextAiring.episode ?? 1) - 1, 0)
      : (m?.episodes ?? 0),
    rating:
      typeof m?.averageScore === 'number' ? m.averageScore / 10 : 0,
    duration: m?.duration ?? 0,
    genres: m?.genres ?? [],
    studios: Array.isArray(m?.studios?.nodes)
      ? m.studios.nodes.map((s: any) => s?.name).filter(Boolean)
      : Array.isArray(m?.studios)
        ? m.studios
        : [],
    subOrDub: 'sub',
    season: m?.season ?? '',
    popularity: m?.popularity ?? 0,
    type: m?.format ?? 'TV',
    startDate: m?.startDate ?? { year: 0, month: 0, day: 0 },
    endDate: m?.endDate ?? { year: 0, month: 0, day: 0 },
    trailer: m?.trailer ?? { id: '', site: '' },
    nextAiringEpisode: nextAiring,
    // No manga route: drop manga/novel nodes from recommendations.
    recommendations: Array.isArray(m?.recommendations?.nodes)
      ? m.recommendations.nodes
          .map((r: any) => r?.mediaRecommendation ?? r ?? {})
          .filter(
            (media: any) =>
              media?.id && media?.type !== 'MANGA' && media?.format !== 'MANGA' && media?.format !== 'NOVEL',
          )
          .map((media: any) => {
            const { img: rImg, cover: rCover } = pickImage(
              media?.coverImage,
              media?.bannerImage,
            );
            return {
              id: String(media?.id ?? ''),
              malId: media?.idMal != null ? String(media.idMal) : '',
              title: {
                romaji: media?.title?.romaji ?? '',
                english: media?.title?.english ?? '',
                native: media?.title?.native ?? '',
                userPreferred: media?.title?.userPreferred ?? '',
              },
              status: mapAnilistStatus(media?.status),
              episodes: media?.episodes ?? 0,
              image: rImg,
              imageHash: '',
              cover: rCover,
              coverHash: '',
              rating:
                typeof media?.averageScore === 'number'
                  ? media.averageScore / 10
                  : 0,
              type: media?.format ?? '',
              // NSFW gate (Wave C): genres let isNsfw/filterAdult decide the
              // Hentai-genre rule for recommendation cards.
              genres: Array.isArray(media?.genres) ? media.genres : [],
            };
          })
      : [],
    characters: [],
    // No manga route: drop manga/novel nodes from relations.
    relations: Array.isArray(m?.relations?.edges)
      ? m.relations.edges
          .map((e: any) => e ?? {})
          .filter(
            (e: any) =>
              e?.node?.id &&
              e?.node?.type !== 'MANGA' &&
              e?.node?.format !== 'MANGA' &&
              e?.node?.format !== 'NOVEL',
          )
          .map((e: any) => {
          const node = e?.node ?? {};
          const { img: relImg, cover: relCover } = pickImage(
            node?.coverImage,
            node?.bannerImage,
          );
          return {
            id: String(node?.id ?? ''),
            malId: node?.idMal != null ? String(node.idMal) : '',
            relationType: e?.relationType ?? '',
            title: {
              romaji: node?.title?.romaji ?? '',
              english: node?.title?.english ?? '',
              native: node?.title?.native ?? '',
              userPreferred: node?.title?.userPreferred ?? '',
            },
            status: mapAnilistStatus(node?.status),
            episodes: node?.episodes ?? 0,
            image: relImg,
            imageHash: '',
            cover: relCover,
            coverHash: '',
            rating:
              typeof node?.averageScore === 'number'
                ? node.averageScore / 10
                : 0,
            type: node?.format ?? node?.type ?? '',
            genres: Array.isArray(node?.genres) ? node.genres : [],
          };
          })
      : [],
    mappings: [],
    // Live details card row: `Official Site: <link>` reads externalLinks and
    // picks the entry whose site is exactly `Official Site` (WatchRoute Wn).
    externalLinks: Array.isArray(m?.externalLinks)
      ? m.externalLinks.filter((l: any) => l?.site && l?.url)
      : [],
    artwork: cover
      ? [{ img: cover, type: 'banner', providerId: 'anilist' }]
      : [],
    episodes: [],
    color: m?.coverImage?.color ?? '#999999',
  };
}

async function anilistQuery(query: string, variables: Record<string, any>) {
  try {
    const { data } = await directAxios.post(
      ANILIST_GRAPHQL,
      { query, variables },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
    );
    if ((data as any)?.errors?.length) {
      throw new Error(
        `AniList error: ${(data as any).errors[0]?.message || 'unknown'}`,
      );
    }
    reportAnilistStatus(false);
    return (data as any)?.data;
  } catch (err) {
    reportAnilistStatus(true);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Session-storage cache (unchanged behaviour)
// ---------------------------------------------------------------------------

function generateCacheKey(...args: string[]) {
  return args.join('-');
}

interface CacheItem {
  value: any;
  timestamp: number;
}

function createOptimizedSessionStorageCache(
  maxSize: number,
  maxAge: number,
  cacheKey: string,
) {
  const cache = new Map<string, CacheItem>(
    JSON.parse(sessionStorage.getItem(cacheKey) || '[]'),
  );
  const keys = new Set<string>(cache.keys());

  function isItemExpired(item: CacheItem) {
    return Date.now() - item.timestamp > maxAge;
  }

  function updateSessionStorage() {
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify(Array.from(cache.entries())),
      );
    } catch {
      // quota full: drop oldest and retry once
      const oldestKey: string | undefined = keys.values().next().value;
      if (oldestKey === undefined) return;
      cache.delete(oldestKey);
      keys.delete(oldestKey);
    }
  }

  return {
    get(key: string) {
      if (cache.has(key)) {
        const item = cache.get(key);
        if (!isItemExpired(item!)) {
          keys.delete(key);
          keys.add(key);
          return item!.value;
        }
        cache.delete(key);
        keys.delete(key);
      }
      return undefined;
    },
    set(key: string, value: any) {
      if (cache.size >= maxSize) {
        const oldestKey: string | undefined = keys.values().next().value;
        if (oldestKey !== undefined) {
          cache.delete(oldestKey);
          keys.delete(oldestKey);
        }
      }
      keys.add(key);
      cache.set(key, { value, timestamp: Date.now() });
      updateSessionStorage();
    },
  };
}

const CACHE_SIZE = 20;
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

function createCache(cacheKey: string) {
  return createOptimizedSessionStorageCache(
    CACHE_SIZE,
    CACHE_MAX_AGE,
    cacheKey,
  );
}

interface FetchOptions {
  type?: string;
  season?: string;
  format?: string;
  sort?: string[];
  genres?: string[];
  id?: string;
  year?: string;
  status?: string;
}

const advancedSearchCache = createCache('Advanced Search v2');
const animeDataCache = createCache('Data v2');
const animeInfoCache = createCache('Info v2');
const animeEpisodesCache = createCache('Episodes v2');
const anirakuStreamCache = createCache('Aniraku Stream v2');
const anirakuServersCache = createCache('Aniraku Servers v2');

// ---------------------------------------------------------------------------
// AniList GraphQL documents
// ---------------------------------------------------------------------------

const MEDIA_LIST_FIELDS = `
  id idMal
  title { romaji english native userPreferred }
  coverImage { extraLarge large medium color }
  bannerImage format status episodes duration
  genres averageScore popularity
  season seasonYear isAdult
  nextAiringEpisode { episode airingAt timeUntilAiring }
  startDate { year month day }
`;

const MEDIA_DETAIL_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    ${MEDIA_LIST_FIELDS}
    description countryOfOrigin
    trailer { id site }
    synonyms
    externalLinks { site url }
    studios { nodes { name } }
    endDate { year month day }
    relations { edges { relationType node {
      id idMal title { romaji english native userPreferred }
      coverImage { extraLarge large medium } bannerImage
      format type status episodes averageScore genres
    } } }
    recommendations(sort: RATING_DESC, perPage: 10) { nodes {
      mediaRecommendation {
        id idMal title { romaji english native userPreferred }
        coverImage { extraLarge large medium } bannerImage
        format status episodes averageScore genres
      }
    } }
  }
}`;

const MEDIA_PAGE_QUERY = `
query ($page: Int, $perPage: Int, $search: String, $genre_in: [String], $season: MediaSeason, $seasonYear: Int, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total lastPage hasNextPage currentPage perPage }
    media(type: ANIME, search: $search, genre_in: $genre_in, season: $season, seasonYear: $seasonYear, format: $format, status: $status, sort: $sort) {
      ${MEDIA_LIST_FIELDS}
    }
  }
}`;

function toAnilistSort(sort?: string[]): string[] {
  const valid = new Set([
    'POPULARITY_DESC',
    'POPULARITY',
    'SCORE_DESC',
    'SCORE',
    'TRENDING_DESC',
    'TRENDING',
    'START_DATE_DESC',
    'TITLE_ROMAJI',
    'EPISODES_DESC',
    'FAVOURITES_DESC',
  ]);
  if (!sort || sort.length === 0) return ['POPULARITY_DESC'];
  const cleaned = sort
    .map((s) => {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed[0] : parsed;
      } catch {
        return s;
      }
    })
    .map((s) => String(s).replace(/[[\]"]/g, ''))
    .filter((s) => valid.has(s));
  return cleaned.length > 0 ? cleaned : ['POPULARITY_DESC'];
}

function toAnilistStatus(status?: string): string | undefined {
  if (!status) return undefined;
  const s = status.toUpperCase();
  if (['RELEASING', 'FINISHED', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'].includes(s))
    return s;
  // Consumet-style compat
  if (s === 'ONGOING') return 'RELEASING';
  if (s === 'COMPLETED') return 'FINISHED';
  if (s === 'NOT YET AIRED' || s === 'NOT_YET_AIRED') return 'NOT_YET_RELEASED';
  return undefined;
}

function toAnilistFormat(format?: string): string | undefined {
  if (!format) return undefined;
  const f = format.toUpperCase();
  if (['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'].includes(f)) return f;
  return undefined;
}

// ---------------------------------------------------------------------------
// Metadata via AniList GraphQL (direct)
// ---------------------------------------------------------------------------

export async function fetchAdvancedSearch(
  searchQuery: string = '',
  page: number = 1,
  perPage: number = 20,
  options: FetchOptions = {},
) {
  const cacheKey = generateCacheKey(
    'advancedSearch',
    searchQuery,
    String(page),
    String(perPage),
    JSON.stringify(options),
  );
  const cached = advancedSearchCache.get(cacheKey);
  if (cached) return cached;

  const variables: Record<string, any> = {
    page,
    perPage,
    sort: toAnilistSort(options.sort),
  };
  if (searchQuery) variables.search = searchQuery;
  if (options.genres && options.genres.length > 0)
    variables.genre_in = options.genres;
  if (options.season) variables.season = options.season.toUpperCase();
  if (options.year) variables.seasonYear = parseInt(options.year, 10);
  if (options.format) {
    const f = toAnilistFormat(options.format);
    if (f) variables.format = f;
  }
  if (options.status) {
    const st = toAnilistStatus(options.status);
    if (st) variables.status = st;
  }

  const data = await anilistQuery(MEDIA_PAGE_QUERY, variables);
  const media = data?.Page?.media ?? [];
  const pageInfo = data?.Page?.pageInfo ?? {};
  const result = {
    results: media.map(mapAnilistMediaToAnime),
    hasNextPage: !!pageInfo.hasNextPage,
    currentPage: pageInfo.currentPage ?? page,
    totalPages: pageInfo.lastPage ?? 1,
    totalResults: pageInfo.total ?? media.length,
  };
  advancedSearchCache.set(cacheKey, result);
  return result;
}

async function fetchListViaAnilist(
  cacheName: string,
  variables: Record<string, any>,
) {
  const cache = createCache(cacheName);
  const cacheKey = generateCacheKey(cacheName, JSON.stringify(variables));
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const data = await anilistQuery(MEDIA_PAGE_QUERY, variables);
  const media = data?.Page?.media ?? [];
  const pageInfo = data?.Page?.pageInfo ?? {};
  const result = {
    results: media.map(mapAnilistMediaToAnime),
    hasNextPage: !!pageInfo.hasNextPage,
    currentPage: pageInfo.currentPage ?? variables.page,
    totalPages: pageInfo.lastPage ?? 1,
    totalResults: pageInfo.total ?? media.length,
  };
  cache.set(cacheKey, result);
  return result;
}

export const fetchTopAnime = (page: number, perPage: number) =>
  fetchListViaAnilist('TopRated v2', {
    page,
    perPage,
    sort: ['SCORE_DESC'],
  });
export const fetchTrendingAnime = (page: number, perPage: number) =>
  fetchListViaAnilist('Trending v2', {
    page,
    perPage,
    sort: ['TRENDING_DESC'],
  });
export const fetchPopularAnime = (page: number, perPage: number) =>
  fetchListViaAnilist('Popular v2', {
    page,
    perPage,
    sort: ['POPULARITY_DESC'],
  });
export const fetchTopAiringAnime = (page: number, perPage: number) =>
  // NOTE: no season/year filter — AniList season tags only cover shows that
  // *started* in that season, so filtering guts the list (returned 1 anime
  // for FALL 2026). RELEASING alone = everything currently airing.
  fetchListViaAnilist('TopAiring v2', {
    page,
    perPage,
    status: 'RELEASING',
    sort: ['POPULARITY_DESC'],
  });
export const fetchUpcomingSeasons = (page: number, perPage: number) => {
  // Next-season WINTER always belongs to the next calendar year
  // (FALL 2026 -> WINTER 2027), otherwise AniList returns nothing.
  const season = getNextSeason().toUpperCase();
  const y = Number(year) + (season === 'WINTER' && getCurrentSeason().toUpperCase() === 'FALL' ? 1 : 0);
  return fetchListViaAnilist('Upcoming v2', {
    page,
    perPage,
    season,
    seasonYear: y,
    status: 'NOT_YET_RELEASED',
    sort: ['POPULARITY_DESC'],
  });
};

// Fetch Anime DATA / INFO via AniList detail query (provider arg kept for compat)
export async function fetchAnimeData(animeId: string) {
  const cacheKey = generateCacheKey('animeData', animeId);
  const cached = animeDataCache.get(cacheKey);
  if (cached) return cached;
  const data = await anilistQuery(MEDIA_DETAIL_QUERY, {
    id: parseInt(animeId, 10),
  });
  if (!data?.Media) throw new Error('Error fetching data: anime not found');
  const mapped = mapAnilistMediaToAnime(data.Media);
  animeDataCache.set(cacheKey, mapped);
  return mapped;
}

export async function fetchAnimeInfo(animeId: string) {
  const cacheKey = generateCacheKey('animeInfo', animeId);
  const cached = animeInfoCache.get(cacheKey);
  if (cached) return cached;
  const info = await fetchAnimeData(animeId);
  animeInfoCache.set(cacheKey, info);
  return info;
}

// ---------------------------------------------------------------------------
// Episode metadata via Aniraku Backend (AniZip + TMDB merge)
// GET {base}api/v1/anime/{id}/episodes -> { episodes: [{number,title,thumbnail,description,airdate}] }
// Mapped to Aniraku Episode[] so EpisodeList/Watch keep working.
// ---------------------------------------------------------------------------

export async function fetchAnimeEpisodes(
  animeId: string,
  _provider?: string,
  _dub?: boolean,
) {
  const cacheKey = generateCacheKey('animeEpisodes', animeId);
  const cached = animeEpisodesCache.get(cacheKey);
  if (cached) return cached;
  const url = `${ANIRAKU_BASE}api/v1/anime/${encodeURIComponent(animeId)}/episodes`;
  const { data } = await directAxios.get(url);
  const list = Array.isArray(data?.episodes) ? data.episodes : [];
  const mapped = list.map((ep: any) => ({
    id: `${animeId}-episode-${ep?.number}`,
    number: ep?.number,
    title: ep?.title ?? `Episode ${ep?.number}`,
    description: ep?.description ?? null,
    image: ep?.thumbnail ?? '',
    imageHash: '',
    airDate: ep?.airdate ?? ep?.airedAt ?? null,
  }));
  animeEpisodesCache.set(cacheKey, mapped);
  return mapped;
}

// ---------------------------------------------------------------------------
// Streaming via Aniraku Backend (NEW — numeric AniList IDs)
// POST {base}api/v1/stream { animeId, episode, lang, provider?, quality? }
// GET  {base}api/v1/servers?animeId=&episode=&lang=
// Response: { sources: [{url,type,quality,subtitles[]}], headers, intro/outro, downloads, servers }
// NOTE: Watch.tsx / Player.tsx still call the legacy Consumet-style helpers
// below. Migrate them to these functions (see proposed diff in chat).
// ---------------------------------------------------------------------------

export interface AnirakuStreamArgs {
  animeId: number;
  episode: number;
  lang?: 'sub' | 'dub';
  provider?: string;
  quality?: string;
}

export async function fetchAnirakuStream({
  animeId,
  episode,
  lang = 'sub',
  provider,
  quality = 'auto',
}: AnirakuStreamArgs) {
  const cacheKey = generateCacheKey(
    'anirakuStream',
    String(animeId),
    String(episode),
    lang,
    provider ?? 'auto',
  );
  const cached = anirakuStreamCache.get(cacheKey);
  if (cached) return cached;
  const { data } = await directAxios.post(
    `${ANIRAKU_BASE}api/v1/stream`,
    {
      animeId,
      episode,
      lang,
      ...(provider ? { provider } : {}),
      quality,
    },
    { timeout: 55000 },
  );
  anirakuStreamCache.set(cacheKey, data);
  return data;
}

export async function fetchAnirakuServers(
  animeId: number,
  episode: number,
  lang: string = 'sub',
  genres?: string,
) {
  const cacheKey = generateCacheKey(
    'anirakuServers',
    String(animeId),
    String(episode),
    lang,
    genres ?? '',
  );
  const cached = anirakuServersCache.get(cacheKey);
  if (cached) return cached;
  const params = new URLSearchParams({
    animeId: String(animeId),
    episode: String(episode),
    lang,
  });
  if (genres) params.set('genres', genres);
  const { data } = await anirakuLongAxios.get(
    `${ANIRAKU_BASE}api/v1/servers?${params.toString()}`,
  );
  anirakuServersCache.set(cacheKey, data);
  return data;
}

// ---------------------------------------------------------------------------
// Always pick the highest-quality download the backend offers.
// Labels look like "1080p"/"720p"/"mp4" — highest parsed number wins,
// otherwise the last entry (backends order ascending) or first.
export function pickHighestDownload(
  downloads?: { url: string; label: string }[] | null,
): string {
  if (!downloads || downloads.length === 0) return '';
  let best = downloads[0];
  let bestScore = -1;
  for (const d of downloads) {
    const m = /(\d{3,4})/.exec(d?.label ?? '');
    const score = m ? parseInt(m[1], 10) : 0;
    if (score >= bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best?.url ?? '';
}
// ---------------------------------------------------------------------------
// Skip times (AniSkip, keyed by MAL id) — unchanged
// ---------------------------------------------------------------------------
interface FetchSkipTimesParams {
  malId: string;
  episodeNumber: string;
  episodeLength?: string;
}

export async function fetchSkipTimes({
  malId,
  episodeNumber,
  episodeLength = '0',
}: FetchSkipTimesParams) {
  const types = ['ed', 'mixed-ed', 'mixed-op', 'op', 'recap'];
  const url = new URL(`${SKIP_TIMES}v2/skip-times/${malId}/${episodeNumber}`);
  url.searchParams.append('episodeLength', episodeLength.toString());
  types.forEach((type) => url.searchParams.append('types[]', type));
  const cacheKey = generateCacheKey(
    'skipTimes',
    malId,
    episodeNumber,
    episodeLength || '',
  );
  const cache = createCache('SkipTimes v2');
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  try {
    const { data } = await directAxios.get(url.toString());
    cache.set(cacheKey, data);
    return data;
  } catch (err) {
    // 404 = AniSkip has no data for this episode — not an error.
    if (
      (err as { response?: { status?: number } })?.response?.status === 404
    )
      return { results: [] };
    throw err;
  }
}

// Reference-style URL helpers (the live site 1:1): /info/:id/:slug
export function animeSlug(
  title?: { english?: string | null; romaji?: string | null } | null,
  fallback: string = 'anime',
): string {
  const raw = title?.english || title?.romaji || fallback;
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

export function infoPath(
  id: string | number,
  title?: { english?: string | null; romaji?: string | null } | null,
): string {
  return `/info/${id}/${animeSlug(title)}`;
}

// Airing schedule for one day window (AniList direct, no cache — always fresh).
export interface AiringEntry {
  airingAt: number;
  episode: number;
  anime: any;
}

export async function fetchAiringDay(
  greater: number,
  lesser: number,
  page: number = 1,
  perPage: number = 25,
): Promise<{ entries: AiringEntry[]; hasNextPage: boolean }> {
  const query = `
query ($page: Int, $perPage: Int, $greater: Int, $lesser: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    airingSchedules(airingAt_greater: $greater, airingAt_lesser: $lesser, sort: TIME) {
      airingAt episode
      media {
        ${MEDIA_LIST_FIELDS}
      }
    }
  }
}`;
  const data = await anilistQuery(query, {
    page,
    perPage,
    greater,
    lesser,
  });
  const schedules = data?.Page?.airingSchedules ?? [];
  return {
    entries: schedules.map((s: any) => ({
      airingAt: s?.airingAt ?? 0,
      episode: s?.episode ?? 0,
      anime: mapAnilistMediaToAnime(s?.media ?? {}),
    })),
    hasNextPage: !!data?.Page?.pageInfo?.hasNextPage,
  };
}

// Recent / airing schedule via AniList (direct)
export async function fetchRecentEpisodes(
  page: number = 1,
  perPage: number = 18,
) {
  const cache = createCache('RecentEpisodes v2');
  const cacheKey = generateCacheKey(
    'recentEpisodes',
    String(page),
    String(perPage),
  );
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  // "NEWEST" = shows with the freshest episodes. A single short schedule
  // window empties overnight (few airings at once) — and half the entries
  // are adult/RELEASING shorts that get filtered. Sweep BACKWARD from now
  // across up to 7 days per page (2 AniList pages of 50) until perPage
  // unique shows are collected; page N continues where page N-1 stopped.
  const WINDOW = 48 * 60 * 60;
  const now = Math.floor(Date.now() / 1000);
  const seen = new Set<string>();
  const results: any[] = [];
  let cursor = now - (page - 1) * 4 * WINDOW; // pages advance ~4 days
  const BATCH = 50;
  for (let sweep = 0; sweep < 4 && results.length < perPage; sweep++) {
    const greater = cursor - WINDOW;
    const lesser = cursor;
    cursor = greater;
    const query = `
query ($perPage: Int, $greater: Int, $lesser: Int) {
  Page(page: 1, perPage: $perPage) {
    pageInfo { total }
    airingSchedules(airingAt_greater: $greater, airingAt_lesser: $lesser, sort: TIME_DESC) {
      airingAt episode
      media {
        ${MEDIA_LIST_FIELDS}
      }
    }
  }
}`;
    const data = await anilistQuery(query, {
      perPage: BATCH,
      greater,
      lesser,
    });
    const schedules = data?.Page?.airingSchedules ?? [];
    for (const s of schedules) {
      const media = s?.media;
      const id = String(media?.id ?? '');
      if (!id || seen.has(id)) continue;
      if (media?.isAdult) continue;
      if (!media?.title?.english && !media?.title?.romaji) continue;
      seen.add(id);
      results.push(mapAnilistMediaToAnime(media));
      if (results.length >= perPage) break;
    }
    if (schedules.length < BATCH) break; // ran past all scheduled airings
  }
  const result = {
    results,
    hasNextPage: results.length >= perPage && page < 30,
    currentPage: page,
    totalPages: 30,
    totalResults: results.length,
  };
  cache.set(cacheKey, result);
  return result;
}
