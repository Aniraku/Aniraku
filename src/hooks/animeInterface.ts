export interface Title {
  romaji: string;
  english: string;
  native: string;
  userPreferred: string;
}

export interface Trailer {
  id: string;
  site: string;
  thumbnail: string;
  thumbnailHash: string;
}

export interface VoiceActor {
  id: string;
  language: string;
  name: Title;
  image: string;
  imageHash: string;
}

export interface Recommendation {
  id: string;
  malId: string;
  title: Title;
  status: string;
  episodes: number;
  image: string;
  imageHash: string;
  cover: string;
  coverHash: string;
  rating: number;
  type: string;
  /** AniList genres — NSFW gate (Hentai-genre rule) reads this (Wave C). */
  genres?: string[];
}

export interface Character {
  id: string;
  role: string;
  name: Title;
  image: string;
  imageHash: string;
  voiceActors: VoiceActor[];
}

export interface Relation {
  id: string;
  malId: string;
  relationType: string;
  title: Title;
  status: string;
  episodes: number;
  image: string;
  imageHash: string;
  cover: string;
  coverHash: string;
  rating: number;
  type: string;
}

export interface Mapping {
  id: string;
  providerId: string;
  similarity: number;
  providerType: string;
}

export interface Artwork {
  img: string;
  type: string;
  providerId: string;
}

/** AniList `Media.tags` entry (live Info Tags section). ADDITIVE. */
export interface Tag {
  id: string;
  name: string;
  rank: number;
  isMediaSpoiler: boolean;
  isGeneralSpoiler: boolean;
}

/** AniList `Media.externalLinks` entry. ADDITIVE. */
export interface ExternalLink {
  site: string;
  url: string;
}

export interface Episode {
  id: string;
  title: string;
  description: string | null;
  number: number;
  image: string;
  imageHash: string;
  airDate: string | null;
  /** ADDITIVE (Info page): live tags filler episodes with the tag icon +
   *  the #B9986D state color (AniList mapper never sets it). */
  filler?: boolean;
}

export interface Anime {
  id: string;
  title: Title;
  malId: string;
  trailer: Trailer;
  synonyms: string[];
  isLicensed: boolean;
  isAdult: boolean;
  countryOfOrigin: string;
  image: string;
  imageHash: string;
  cover: string;
  coverHash: string;
  description: string;
  status: string;
  releaseDate: number;
  totalEpisodes: number;
  currentEpisode: number;
  rating: number;
  duration: number;
  genres: string[];
  studios: string[];
  subOrDub: string;
  season: string;
  popularity: number;
  type: string;
  startDate: {
    year: number;
    month: number;
    day: number;
  };
  endDate: {
    year: number;
    month: number;
    day: number;
  };
  recommendations: Recommendation[];
  characters: Character[];
  relations: Relation[];
  mappings: Mapping[];
  artwork: Artwork[];
  episodes: Episode[];
  color: string;
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
    airingTime: number;
    timeUntilAiring: number;
  };
  // --- ADDITIVE (Info page enrichment; mapper never sets/removes these) ---
  /** AniList tags — shown in the live Info Tags section. */
  tags?: Tag[];
  /** AniList `Media.source` enum (e.g. ORIGINAL) — shown in the Details dl. */
  source?: string;
  /** Raw AniList banner (nullable) so a missing banner can use the placeholder. */
  bannerImage?: string;
  /** Unix seconds of the last AniList edit (live "Last Update"). */
  updatedAt?: number;
  /** AniList external links (live "Official Site"). */
  externalLinks?: ExternalLink[];
}

export interface Paging {
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
  totalResults: number;
  results: Anime[];
}
