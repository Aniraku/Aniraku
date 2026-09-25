import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaBell, FaSpinner, FaStar } from 'react-icons/fa';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import Image404URL from '/src/assets/404.webp';
import {
  chooseBrowserPlayableEmbed,
  getSourcePlaybackType,
  hasExpiredEmbeddedToken,
  isBrowserPlayableEmbedSource,
} from '../components/Watch/lib/watchEmbedFallback';
import {
  EpisodeList,
  Player,
  WatchAnimeData as AnimeData,
  AnimeDataList,
  MediaSource,
  Seasons,
  fetchAnirakuServers,
  fetchAnimeEpisodes,
  fetchAnimeData,
  fetchAnimeInfo,
  pickHighestDownload,
  SkeletonPlayer,
  useCountdown,
} from '../index';
import { Episode } from '../index';
import { Comments } from '../components/Watch/Comments';
// Item 1 (GAP 4) — immediate history upload after the first-playback
// record: thin wrapper over Wave B's 10s flush engine (guests no-op,
// idempotent diff-upsert). Import-only — sync.ts stays Wave B's file.
import {
  publishHistoryNow,
  getSessionUserId,
  getSyncStatus,
  PROVIDER_LABELS,
} from '../lib/sync';
import { showToast } from '../components/Toaster';
// Unreleased-title/episode fallback copy (old Aniraku voice).
import {
  UNRELEASED_ANIME_MESSAGE,
  UNRELEASED_MOVIE_MESSAGE,
  UPCOMING_EPISODE_MESSAGE,
  isMovieFormat,
  isUnreleasedStatus,
} from '../lib/upcomingMessages';
// Item 2 (episode ratings) — transport trio + LS key from Wave C's
// lib/episodeRatings (verbatim Aniraku sync.js ports) — import-only.
import {
  EPISODE_RATINGS_LS_KEY,
  fetchEpisodeRatings,
  saveEpisodeRating,
  updateSyncScore,
} from '../lib/episodeRatings';
// Item 1 (NSFW gate) — Aniraku Watch.jsx:1520/:5578.
import { isNsfw, useNsfw } from '../hooks/useNsfw';
// Runtime SEO (SEO layer) — old setWatchSEO (seo.js:190-260) via shared helper.
import { SITE_URL, useSeo } from '../utils/seo';

// ---------------------------------------------------------------------------
// Live local-storage keys (per-anime prefs moved from the legacy
// `source-[id]` / `subOrDub-[id]` names to `aniraku:anime:source:{id}` /
// `aniraku:anime:language:{id}`; legacy keys stay readable/writable).
// ---------------------------------------------------------------------------
const getSourceTypeKey = (animeId: string | undefined) =>
  `aniraku:anime:source:${animeId}`;
const getLanguageKey = (animeId: string | undefined) =>
  `aniraku:anime:language:${animeId}`;
const legacySourceTypeKey = (animeId: string | undefined) =>
  `source-[${animeId}]`;
const legacyLanguageKey = (animeId: string | undefined) =>
  `subOrDub-[${animeId}]`;

const readStoredPref = (key: string, legacyKey: string): string | null =>
  localStorage.getItem(key) ?? localStorage.getItem(legacyKey);

// Live theater prefs: `aniraku:ui:theater` (legacy) + `aniraku:ui` record
// field `theaterMode`. Both are kept in sync.
const readUiRecord = (): Record<string, unknown> => {
  try {
    const raw = localStorage.getItem('aniraku:ui');
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Malformed record — start fresh.
  }
  return {};
};

const readTheaterPref = (): boolean => {
  try {
    const legacy = localStorage.getItem('aniraku:ui:theater');
    if (legacy !== null) {
      const parsed = JSON.parse(legacy);
      if (typeof parsed === 'boolean') return parsed;
      if (typeof parsed === 'string') return parsed === 'true';
      if (typeof parsed === 'number') return parsed === 1;
    }
  } catch {
    const legacy = localStorage.getItem('aniraku:ui:theater');
    if (legacy === 'true') return true;
  }
  return readUiRecord().theaterMode === true;
};

// An embed server is one that carries ANY type:"embed" source (FlixCloud
// etc) — such rows take the embed path (no direct override).
const serverIsEmbed = (s: any) =>
  (s?.sources ?? []).some((src: any) => src?.type === 'embed');

// Load-time server sanitation (Aniraku parity): dedupe backend name repeats
// (a name can repeat within a pool — duplicates would collide as duplicate
// `${lang}:${name}` picker keys) and drop rows with NOTHING mountable:
// direct sources whose signed token is expired, and embeds that are
// verification:"dead", token-expired, or Kiwi-framed (kwik.cx refuses
// third-party iframes — OLD isBrowserPlayableEmbedSource).
const sanitizeServers = (list: any[]): any[] => {
  const seen = new Set<string>();
  return (Array.isArray(list) ? list : []).filter((s: any) => {
    const name = s?.name;
    if (!name || seen.has(name)) return false;
    seen.add(name);
    return (s?.sources ?? []).some((x: any) => {
      if (!x?.url) return false;
      return getSourcePlaybackType(x) === 'embed'
        ? isBrowserPlayableEmbedSource(x)
        : !hasExpiredEmbeddedToken(x.url);
    });
  });
};

// ---------------------------------------------------------------------------
// Live episode-in-query-string contract (links `At`/`Q`/`$`, Seasons `ht`/`_t`):
//   READ  `?ep=N` from the query string FIRST (float > 0; `latest` → last
//         episode), then the legacy `:episodeNumber` path param so old
//         3-segment links keep working.
//   WRITE ALWAYS the live 2-segment + `?ep=N` format
//         `/watch/{id}[/{slug}][?ep={N}]` — with REPLACE semantics (live's
//         episode-select does `history.replaceState` +
//         `setSearchParams({replace:true})`, never a push).
// ---------------------------------------------------------------------------

// live links `Q` — slugify a title.
const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// live links `$` — pick the title: shortest of english/romaji, else native,
// else String(id).
type WatchUrlMedia = {
  id: string | number;
  title?: { english?: string; romaji?: string; native?: string };
};
const pickSlugTitle = (title: WatchUrlMedia['title'], id: WatchUrlMedia['id']): string => {
  const candidates = [title?.english, title?.romaji]
    .map((entry) => entry?.trim())
    .filter(Boolean) as string[];
  if (candidates.length) {
    return [...candidates].sort((a, b) => a.length - b.length)[0];
  }
  return title?.native ?? String(id);
};

// live links `At(media, ep)` — the watch URL builder. Slug empty or equal to
// the id → bare `/watch/{id}` (live's `n && n !== String(id)` guard).
const buildWatchUrl = (
  media: WatchUrlMedia,
  episodeNumber?: number | null,
): string => {
  const slug = slugify(pickSlugTitle(media.title, media.id));
  const path =
    slug && slug !== String(media.id)
      ? `/watch/${media.id}/${slug}`
      : `/watch/${media.id}`;
  return episodeNumber == null ? path : `${path}?ep=${episodeNumber}`;
};

// live Seasons `ht` — read `?ep` from a search string: parsed episode
// (float > 0), `latest` verbatim (resolved by live `_t`), or null when
// absent/invalid (caller falls back to the legacy path param).
const parseRequestedEpisode = (search: string): number | 'latest' | null => {
  const raw = new URLSearchParams(search).get('ep');
  if (!raw) return null;
  if (raw === 'latest') return 'latest';
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// live Seasons `_t` — resolve a request against the loaded list: exact
// number match → closest episode ≤ requested → first. `latest` → last.
const resolveRequestedEpisode = <T extends { number: number }>(
  list: T[],
  requested: number | 'latest',
): T | undefined => {
  if (requested === 'latest') return list[list.length - 1];
  const exact = list.find((ep) => Number(ep.number) === requested);
  if (exact) return exact;
  const atOrBelow = list.filter((ep) => Number(ep.number) <= requested);
  return atOrBelow[atOrBelow.length - 1] ?? list[0];
};

// Module-level EMPTY identities: directOverride is a useMemo — these make
// its `subs`/`headers` stable across renders so the Player's source-fetch
// effect (deps include subsOverride/headersOverride) never re-fires on an
// unrelated re-render (that restart loop was one of the playback bugs).
const EMPTY_SUBS: { url: string; lang: string; label: string }[] = [];
const EMPTY_HEADERS: Record<string, string> = {};

const WatchContainer = styled.div``;

// Live lights-out veil (.dimmed-background / .dimmed-overlay): a fixed
// #000000ec backdrop at --z-index-modal-backdrop, the player lifted to
// --z-index-modal, and a dismiss layer above the veil but below the player.
const LightsGlobalStyle = createGlobalStyle`
  .dimmed-background::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    z-index: var(--z-index-modal-backdrop);
    width: 100%;
    height: 100%;
    pointer-events: auto;
    background: #000000ec;
  }
  .dimmed-background .player {
    position: relative;
    z-index: var(--z-index-modal);
  }
  .dimmed-overlay {
    position: fixed;
    top: 0;
    left: 0;
    z-index: var(--z-index-modal-backdrop);
    width: 100%;
    height: 100%;
  }
`;

const WatchWrapper = styled.div`
  font-size: 0.9rem;
  gap: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--global-primary-bg);
  color: var(--global-text);

  @media (min-width: 1000px) {
    flex-direction: row;
    align-items: flex-start;
  }

  /* Live data-theater-mode: video row becomes a full-width column. */
  &[data-theater-mode='true'] {
    flex-direction: column;
    align-items: stretch;
  }
`;

// Zenime DataWrapper (verbatim rules): 2-col grid below the player row —
// left = source/comments/details sized to the player, right = relations +
// recommendations. Collapses to one column under 1000px.
const DataWrapper = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
    max-width: 100%;
  }
`;

// Zenime SourceAndData — grid col 1 width tracks the measured player width,
// 100% under 1000px. Slot order: [mediaSource, comments, details].
const SourceAndData = styled.div<{ $videoPlayerWidth: string }>`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  width: ${({ $videoPlayerWidth }) => $videoPlayerWidth};
  @media (max-width: 1000px) {
    width: 100%;
  }
`;

// Zenime RalationsTable (verbatim rules) + column gap so the SEASONS stack
// sits above RELATED / RECOMMENDATIONS (Aniraku feature parity).
const RalationsTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
  margin-top: 1rem;
  @media (max-width: 1000px) {
    margin-top: 0rem;
  }
`;

const VideoPlayerContainer = styled.div`
  position: relative;
  width: 100%;
  border-radius: var(--global-border-radius);
  transition: opacity 0.2s ease-in-out;

  // Dim + block interaction while the episode is being swapped out.
  &[data-episode-changing='true'] {
    opacity: 0.55;
    pointer-events: none;
  }

  @media (min-width: 1000px) {
    flex: 3 1 0;
    min-width: 0;
  }
`;

const EpisodeListContainer = styled.div`
  width: 100%;
  /* The player-height cap (--ep-list-max carries the measured px) only
     makes sense when the list sits BESIDE the player (≥1000px). Below that
     it capped the phone list to ~2.5 episodes, torn mid-item (screencast):
     ≤999 the list flows and the inner ListContainer bounds it (18rem). */
  max-height: none;

  @media (min-width: 1000px) {
    flex: 1 1 320px;
    max-width: 380px;
    max-height: var(--ep-list-max, 100%);
  }

  @media (max-width: 1000px) {
    padding-left: 0rem;
  }
`;

const NoEpsFoundDiv = styled.div`
  text-align: center;
  margin-top: 7.5rem;
  margin-bottom: 10rem;
  @media (max-width: 1000px) {
    margin-top: 2.5rem;
    margin-bottom: 6rem;
  }
`;

const NoEpsMessage = styled.p`
  color: var(--global-text-muted);
  max-width: 34rem;
  margin: 0 auto 1.5rem;
  line-height: 1.6;
`;

// In-player upcoming notice: same slot/chrome as the player (16:9 box) for
// an explicitly requested future episode (old Aniraku destroyed the player
// and showed the line instead of silently playing an older episode).
const UpcomingPanel = styled.div`
  aspect-ratio: 16 / 9;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  text-align: center;
  padding: 2rem;
  background: var(--global-primary-bg);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  h2 {
    margin: 0;
    font-size: 1.3rem;
  }
  p {
    margin: 0;
    max-width: 34rem;
    color: var(--global-text-muted);
    line-height: 1.6;
    font-size: 0.95rem;
  }
`;

const UpcomingCta = styled.button`
  margin-top: 0.4rem;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: transparent;
  color: var(--global-text);
  font-size: 0.9rem;
  padding: 0.55rem 1.1rem;
  cursor: pointer;
  &:hover {
    border-color: var(--primary-accent);
    color: var(--primary-accent);
  }
`;

const NoEpsImage = styled.div`
  margin-bottom: 3rem;
  max-width: 100%;

  img {
    border-radius: var(--global-border-radius);
    max-width: 100%;
    @media (max-width: 500px) {
      max-width: 70%;
    }
  }
`;

const StyledHomeButton = styled.button`
  color: white;
  border-radius: var(--global-border-radius);
  border: none;
  background-color: var(--primary-accent);
  margin-top: 0.5rem;
  font-weight: bold;
  padding: 1rem;
  position: absolute;
  transform: translate(-50%, -50%);
  transition: transform 0.2s ease-in-out;
  &:hover,
  &:active,
  &:focus {
    transform: translate(-50%, -50%) scale(1.05);
  }
  &:active {
    transform: translate(-50%, -50%) scale(0.95);
  }
`;

const IframeTrailer = styled.iframe`
  position: relative;
  border-radius: var(--global-border-radius);
  border: none;
  top: 0;
  left: 0;
  width: 70%;
  height: 100%;
  text-items: center;
  @media (max-width: 1000px) {
    width: 100%;
    height: 100%;
  }
`;

// Live error boundary (yn): "Playback unavailable" + Retry / Go Home,
// resetKey = pathname so navigating away clears the error state.
const BoundaryBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 2rem;
  text-align: center;
  color: var(--global-text);
  background-color: var(--global-primary-bg);
`;

const BoundaryButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const BoundaryButton = styled.button`
  padding: 0.75rem 1.25rem;
  font-weight: 700;
  color: var(--global-text);
  cursor: pointer;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  &:hover {
    background-color: var(--global-div);
  }
`;

type WatchErrorBoundaryProps = {
  resetKey: string;
  onGoHome: () => void;
  children: React.ReactNode;
};

type WatchErrorBoundaryState = {
  hasError: boolean;
};

class WatchErrorBoundary extends React.Component<
  WatchErrorBoundaryProps,
  WatchErrorBoundaryState
> {
  state: WatchErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WatchErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: WatchErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <BoundaryBox>
          <h2>Playback unavailable</h2>
          <BoundaryButtons>
            <BoundaryButton onClick={() => this.setState({ hasError: false })}>
              Retry
            </BoundaryButton>
            <BoundaryButton onClick={this.props.onGoHome}>
              Go Home
            </BoundaryButton>
          </BoundaryButtons>
        </BoundaryBox>
      );
    }
    return this.props.children;
  }
}

const LOCAL_STORAGE_KEYS = {
  LAST_WATCHED_EPISODE: 'last-watched-',
  WATCHED_EPISODES: 'watched-episodes-',
  LAST_ANIME_VISITED: 'last-anime-visited',
};

// Live local-history gate: while the user paused history recording, skip
// persisting watched-episodes. The pref is written by useWatchHistory's
// writePref as either the `historyPaused` field of the `aniraku:watching`
// record or (legacy) as a JSON boolean under
// `aniraku:watching:history-paused`.
const isHistoryPaused = (): boolean => {
  try {
    const record = localStorage.getItem('aniraku:watching');
    if (record) {
      const parsed = JSON.parse(record);
      if (parsed && typeof parsed.historyPaused === 'boolean') {
        return parsed.historyPaused;
      }
    }
    const legacy = localStorage.getItem('aniraku:watching:history-paused');
    if (legacy !== null) return JSON.parse(legacy) === true;
  } catch {
    // Malformed record — treat as not paused.
  }
  return false;
};

// ---------------------------------------------------------------------------
// NSFW gate chrome — Info.tsx NsfwCard pattern (Aniraku AnimeDetail.jsx:553-590
// card, copy/buttons structure), carrying Aniraku's WATCH-variant paragraph
// (Watch.jsx:5578-5614 says "This anime contains adult content…", the
// AnimeDetail variant says "This title contains…").
// ---------------------------------------------------------------------------
const NsfwGateCard = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 40px;
  text-align: center;
  background: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: 16px;

  @media (max-width: 480px) {
    padding: 28px 20px;
    border-radius: 12px;
    margin: 0 12px;
  }
`;

const NsfwTitle = styled.p`
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--global-text);
`;

const NsfwText = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--global-text-muted);
`;

const NsfwActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`;

const NsfwBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--primary-accent);
  color: var(--global-primary-bg);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`;

const NsfwOutline = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: transparent;
  color: var(--global-text-muted);
  border: 1px solid var(--global-border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
`;

// ---------------------------------------------------------------------------
// Episode rating row — Aniraku Watch.jsx:6512-6564 `.watch-rating`: label
// ("Rated n/10" | "Rate this episode") + ten 1-10 star buttons + saving
// spinner + 2s "Saved" flag. Sits right under the current-episode meta bar
// (MediaSource), above the details column — the Watch-page slot Aniraku
// fills between `watch-current-meta` and `watch-nav`.
// ---------------------------------------------------------------------------
const WatchRatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const spinKeyframes = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Aniraku pairs FaSpinner with a `.watch-spin` class that doesn't exist in
// this repo's stylesheets — animate the icon itself instead (same visual).
const RatingSpinner = styled(FaSpinner)`
  animation: ${spinKeyframes} 1s linear infinite;
`;

// Main Component
const WatchInner: React.FC = () => {
  const videoPlayerContainerRef = useRef<HTMLDivElement>(null);
  const [videoPlayerWidth, setVideoPlayerWidth] = useState('100%');
  const updateVideoPlayerWidth = useCallback(() => {
    if (videoPlayerContainerRef.current) {
      const width = `${videoPlayerContainerRef.current.offsetWidth}px`;
      setVideoPlayerWidth(width);
    }
  }, [setVideoPlayerWidth, videoPlayerContainerRef]);
  const [maxEpisodeListHeight, setMaxEpisodeListHeight] =
    useState<string>('100%');
  const { animeId, animeTitle, episodeNumber } = useParams<{
    animeId?: string;
    animeTitle?: string;
    episodeNumber?: string;
  }>();
  const navigate = useNavigate();
  // Aniraku Watch.jsx:1520 — reactive NSFW preference (shared per-account
  // state via useNsfw, default OFF). Flipping it anywhere re-renders this
  // page, so the gate below lifts/drops live without a reload.
  const { nsfwEnabled } = useNsfw();
  const [selectedBackgroundImage, setSelectedBackgroundImage] =
    useState<string>('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode>({
    id: '0',
    number: 1,
    title: '',
    image: '',
    description: '',
    imageHash: '',
    airDate: '',
  });
  const [animeInfo, setAnimeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // NSFW gate guard: true once the title-detail fetch has SETTLED (success
  // or failure). The player slot stays on the skeleton until then, so a
  // Hentai title can never boot <Player> in the window where episodes have
  // resolved but `animeInfo` (the only genre source) has not — the gate
  // must PREVENT player initialization, not cover an already-booted player.
  const [infoResolved, setInfoResolved] = useState(false);
  const [isEpisodeChanging, setIsEpisodeChanging] = useState(false);
  const [showNoEpisodesMessage, setShowNoEpisodesMessage] = useState(false);
  const [sourceType, setSourceType] = useState(
    () =>
      readStoredPref(
        getSourceTypeKey(animeId),
        legacySourceTypeKey(animeId),
      ) || 'default',
  );
  const [embeddedVideoUrl, setEmbeddedVideoUrl] = useState('');
  // Aniraku servers for BOTH langs — SUB and DUB pools, rows keyed by the
  // backend's own server names (Niko/Momo/Yuta/...), embed rows tagged
  // `embed` in the picker. '' = none yet.
  // selectedServer is keyed `${lang}:${name}` — backend names repeat across
  // sub/dub, so a bare name could never distinguish the two pools.
  const [serversSub, setServersSub] = useState<any[]>([]);
  const [serversDub, setServersDub] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState('');
  // Episode stamp for the pools above: `poolEpKey` is written only when a
  // fetch SETTLES, so the player gate can never boot off another episode's
  // stale server list (the reported wrong-source/restart race).
  const [poolEpKey, setPoolEpKey] = useState('');
  const [serversSettled, setServersSettled] = useState(false);
  const lastServerFetchKeyRef = useRef('');
  const [language, setLanguage] = useState(
    () =>
      readStoredPref(getLanguageKey(animeId), legacyLanguageKey(animeId)) ||
      'sub',
  );
  const [downloadLink, setDownloadLink] = useState('');
  // Live theater + lights state (toggled ONLY through the single
  // `aniraku:shortcut` listener below, plus the player menu Lights button
  // which dispatches the same contract event).
  const [theaterMode, setTheaterMode] = useState<boolean>(readTheaterPref);
  const [lightsOn, setLightsOn] = useState(false);
  // Responsive slots are pure CSS now (Zenime parity — @1000px media
  // queries on WatchWrapper/DataWrapper); no JS breakpoint needed.
  const nextEpisodeAiringTime =
    animeInfo && animeInfo.nextAiringEpisode
      ? animeInfo.nextAiringEpisode.airingTime * 1000
      : null;
  const nextEpisodenumber = animeInfo?.nextAiringEpisode?.episode;
  const countdown = useCountdown(nextEpisodeAiringTime);
  // Unreleased fallback routing (old Aniraku voice): explicit status only.
  // Title-level (movie vs series) wins; otherwise an explicit future `?ep=N`
  // request at/after the next airing number gets the episode line. A
  // merely-missing list keeps the generic empty copy below.
  // Legacy `:episodeNumber` path param as a fallback request source.
  const pathEpNumber =
    episodeNumber !== undefined &&
    episodeNumber !== '' &&
    Number.isFinite(Number(episodeNumber))
      ? Number(episodeNumber)
      : null;
  const requestedEpNumber = (() => {
    try {
      const parsed = parseRequestedEpisode(window.location.search);
      if (typeof parsed === 'number') return parsed;
    } catch {
      // fall through to the path param below
    }
    return pathEpNumber;
  })();
  const titleUnreleased = isUnreleasedStatus(animeInfo?.status);
  const movieUnreleased =
    titleUnreleased && isMovieFormat(animeInfo?.type);
  const maxListedEpNumber = episodes.reduce(
    (max, ep) => Math.max(max, Number(ep.number) || 0),
    0,
  );
  const releasingTitle =
    animeInfo?.status === 'Ongoing' || animeInfo?.status === 'RELEASING';
  const futureEpisodeRequested =
    !titleUnreleased &&
    requestedEpNumber !== null &&
    (nextEpisodenumber !== null && nextEpisodenumber !== undefined
      ? requestedEpNumber >= nextEpisodenumber
      : releasingTitle &&
        maxListedEpNumber > 0 &&
        requestedEpNumber > maxListedEpNumber);
  const currentEpisodeIndex = episodes.findIndex(
    (ep) => ep.id === currentEpisode.id,
  );
  const [languageChanged, setLanguageChanged] = useState(false);

  // ── Episode ratings (own, 1-10) — Aniraku Watch.jsx:2079-2176 ──
  // Transport = lib/episodeRatings (import-only): authed saves go to the
  // backend, guests keep LS `aniraku-episode-ratings-{animeId}`; after a
  // successful save the score push below fires for every CONNECTED sync
  // provider. Display = the `.watch-rating` row in the slot content.
  const [epRatings, setEpRatings] = useState<Record<number, number>>({});
  const [epRatingSaving, setEpRatingSaving] = useState(false);
  const [epRatingSaved, setEpRatingSaved] = useState(false);
  const epRatingSaveTimerRef = useRef<number | null>(null);
  // null = sync status not fetched yet this page session
  // (Aniraku Watch.jsx:1899).
  const syncConnectedRef = useRef<string[] | null>(null);

  //----------------------------------------------MORE VARIABLES----------------------------------------------
  const GoToHomePageButton = () => {
    const navigate = useNavigate();

    const handleClick = () => {
      navigate('/home');
    };

    return (
      <StyledHomeButton onClick={handleClick}>Go back Home</StyledHomeButton>
    );
  };
  // Stable genre key — the effect must not refire on every animeInfo update.
  const genreKey = React.useMemo(
    () => (Array.isArray(animeInfo?.genres) ? animeInfo.genres.join(',') : ''),
    [animeInfo?.genres],
  );
  // TODO FETCH EMBED URL FROM ANIRAKU SERVERS
  // Aniraku returns direct HLS servers + 1-2 embed servers (FlixCloud
  // Yuta/Syota/Mike, type:"embed"). Embed is kept as fallback, never dropped.
  // The full server list also feeds the provider picker (multiple providers).
  // No Auto mode: the first direct server of the current lang is pre-selected.
  // Identity of the episode the pools below belong to — stamped on settle;
  // the player gate below refuses to boot off a different episode's list.
  const serverEpKey = `${animeId}:${Number(currentEpisode.number) || 0}`;
  useEffect(() => {
    // GATED on infoResolved: by the time this runs, animeInfo (→ genreKey)
    // is final, so the ONE fetch already carries the genres. The old ungated
    // run fetched once bare and again when animeInfo landed — that mid-flight
    // pool swap re-resolved the selection and restarted playback.
    if (!infoResolved) return;
    let cancelled = false;
    // Episode changed → drop the previous episode's pools IMMEDIATELY so its
    // stale source URLs can never feed the new episode, and close the gate.
    if (lastServerFetchKeyRef.current !== serverEpKey) {
      lastServerFetchKeyRef.current = serverEpKey;
      setServersSub([]);
      setServersDub([]);
      setServersSettled(false);
      setPoolEpKey('');
    }
    if (!animeId || !currentEpisode.number) {
      setPoolEpKey(serverEpKey);
      setServersSettled(true);
      return;
    }
    const loadServers = async () => {
      try {
        const ep = Number(currentEpisode.number);
        const id = Number(animeId);
        // Current lang first (fast path for playback), other lang after so a
        // slow provider on one side never blocks the visible player.
        const first = await fetchAnirakuServers(
          id,
          ep,
          language,
          genreKey || undefined,
        ).catch((e) => {
          console.error('Error fetching Aniraku servers:', e);
          return [];
        });
        if (!cancelled && Array.isArray(first)) {
          const clean = sanitizeServers(first);
          if (language === 'dub') setServersDub(clean);
          else setServersSub(clean);
        }
        const other = language === 'dub' ? 'sub' : 'dub';
        const second = await fetchAnirakuServers(
          id,
          ep,
          other,
          genreKey || undefined,
        ).catch((e) => {
          console.error('Error fetching Aniraku servers:', e);
          return [];
        });
        if (!cancelled && Array.isArray(second)) {
          const clean = sanitizeServers(second);
          if (other === 'dub') setServersDub(clean);
          else setServersSub(clean);
        }
      } catch (error) {
        console.error('Error fetching Aniraku servers:', error);
      }
      // Both languages settled → stamp the episode key; the gate may now
      // open (the auto-select effect below resolves the selection first).
      if (!cancelled) {
        setPoolEpKey(serverEpKey);
        setServersSettled(true);
      }
    };
    loadServers();
    return () => {
      cancelled = true;
    };
    // `language` is a dep: flipping Sub/Dub re-fetches so the other pool is
    // always present too (the missing dep left stale empty pools).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId, currentEpisode.number, genreKey, language, infoResolved]);

  const servers = language === 'dub' ? serversDub : serversSub;
  const allServers = [...serversSub, ...serversDub];

  // Selection resolved from the `${lang}:${name}` key — pools never mix, so
  // Dub can't snap back to a same-named Sub server.
  const selectedServerObj = useMemo(() => {
    if (!selectedServer) return null;
    const idx = selectedServer.indexOf(':');
    const lang = idx > 0 ? selectedServer.slice(0, idx) : language;
    const name = idx > 0 ? selectedServer.slice(idx + 1) : selectedServer;
    const pool = lang === 'dub' ? serversDub : serversSub;
    return pool.find((s: any) => s?.name === name) ?? null;
  }, [selectedServer, serversSub, serversDub, language]);

  const firstEmbedUrl = (() => {
    // Playable embeds only (Aniraku parity): dead/expired-token/Kiwi-framed
    // sources were never selectable in the old app — picking one here left a
    // blank iframe and looked like the embed server had been "removed".
    const pick = (s: any) =>
      chooseBrowserPlayableEmbed(
        s?.sources ?? [],
        isBrowserPlayableEmbedSource,
      )?.url ?? '';
    if (selectedServerObj && serverIsEmbed(selectedServerObj)) {
      const chosen = pick(selectedServerObj);
      if (chosen) return chosen;
    }
    for (const s of [...servers, ...allServers]) {
      const chosen = pick(s);
      if (chosen) return chosen;
    }
    return '';
  })();

  // No Auto provider mode: always resolve to an explicit backend server.
  // Pre-select the first direct server of the current lang; re-resolve when
  // the episode changes and the stored key no longer exists.
  useEffect(() => {
    const list = language === 'dub' ? serversDub : serversSub;
    if (list.length === 0) return;
    const keyOf = (lang: string, s: any) => `${lang}:${s?.name}`;
    const stillThere = list.some(
      (s: any) => keyOf(language, s) === selectedServer,
    );
    if (selectedServer && stillThere) {
      // Reconcile the playback MODE with the (possibly refreshed) row — a
      // direct server that comes back embed-typed must flip the shell, and
      // vice versa, instead of leaving iframe/direct pointed at the wrong one.
      const srv = list.find((s: any) => keyOf(language, s) === selectedServer);
      if (srv) {
        const wantEmbed = serverIsEmbed(srv);
        if (wantEmbed && sourceType !== 'embed') setSourceType('embed');
        else if (!wantEmbed && sourceType === 'embed')
          setSourceType('default');
      }
      return;
    }
    const first =
      list.find((s: any) => !serverIsEmbed(s) && s?.name) ??
      list.find((s: any) => s?.name);
    if (first?.name) {
      setSelectedServer(keyOf(language, first));
      setSourceType(serverIsEmbed(first) ? 'embed' : 'default');
      const dl = pickHighestDownload(first?.downloads);
      if (dl) setDownloadLink(dl);
    }
  }, [serversSub, serversDub, language, selectedServer, sourceType]);

  // Keep the iframe URL in sync whenever the embed path is active.
  useEffect(() => {
    if (
      sourceType === 'embed' ||
      sourceType === 'vidstreaming' ||
      sourceType === 'gogo'
    ) {
      if (firstEmbedUrl) setEmbeddedVideoUrl(firstEmbedUrl);
      // Embed guard: never keep a stale iframe URL — if the active embed
      // path resolves no playable embed source (episode/server change),
      // clear it so the shell renders empty instead of the previous
      // episode's player.
      else setEmbeddedVideoUrl('');
    }
  }, [sourceType, firstEmbedUrl]);

  // Direct-play override when the picker selects a specific HLS server.
  // useMemo + module-level EMPTY constants → stable identity across renders
  // (the old inline IIFE created fresh []/{} objects every render, which
  // re-triggered the Player source effect and restarted playback).
  const directOverride = useMemo(() => {
    if (!selectedServerObj || serverIsEmbed(selectedServerObj)) return null;
    const srcs = selectedServerObj.sources ?? [];
    const hls =
      srcs.find((x: any) => x?.type === 'hls' && x?.url) ??
      srcs.find((x: any) => x?.url);
    if (!hls?.url) return null;
    return {
      url: hls.url as string,
      subs: Array.isArray(hls.subtitles) ? hls.subtitles : EMPTY_SUBS,
      headers: selectedServerObj.headers ?? EMPTY_HEADERS,
    };
  }, [selectedServerObj]);

  // `${lang}:${name}` key — also updates the language + download link, and
  // flips default ↔ embed when the chosen server type differs.
  const handleSelectServer = useCallback(
    (key: string, serverLang: 'sub' | 'dub') => {
      if (!key) return;
      const idx = key.indexOf(':');
      const name = idx > 0 ? key.slice(idx + 1) : key;
      if (!name) return;
      setSelectedServer(key);
      setLanguage(serverLang);
      const pool = serverLang === 'dub' ? serversDub : serversSub;
      const srv = pool.find((s: any) => s?.name === name);
      if (!srv) return;
      if (serverIsEmbed(srv)) {
        setSourceType('embed');
      } else {
        setSourceType('default');
        const dl = pickHighestDownload(srv?.downloads);
        if (dl) setDownloadLink(dl);
      }
    },
    [serversSub, serversDub],
  );

  // TODO SAVE TO LOCAL STORAGE NAVIGATED/CLICKED EPISODES
  // Skipped entirely while history recording is paused — resume keys
  // (last-watched-*) stay ungated so playback position still resumes.
  const updateWatchedEpisodes = (episode: Episode) => {
    if (isHistoryPaused()) return;
    const watchedEpisodesJson = localStorage.getItem(
      LOCAL_STORAGE_KEYS.WATCHED_EPISODES + animeId,
    );
    const watchedEpisodes: Episode[] = watchedEpisodesJson
      ? JSON.parse(watchedEpisodesJson)
      : [];
    if (!watchedEpisodes.some((ep) => ep.id === episode.id)) {
      watchedEpisodes.push(episode);
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.WATCHED_EPISODES + animeId,
        JSON.stringify(watchedEpisodes),
      );
      // Mirror into the UNIFIED `watched-episodes` record (EpisodeList's
      // dual-write shape). The history row builder + the watch_history
      // upload engine only see anime present in THAT store — without this
      // key the playback position saved by the player never reaches
      // Supabase, so server-first resume stays stale on other devices.
      try {
        const idKey = String(animeId); // mirrors the suffixed-key coercion
        const record = JSON.parse(
          localStorage.getItem('watched-episodes') || '{}',
        );
        const list = Array.isArray(record[idKey]) ? record[idKey] : [];
        if (!list.some((ep: Episode) => ep.id === episode.id)) {
          list.push(episode);
          record[idKey] = list;
          localStorage.setItem('watched-episodes', JSON.stringify(record));
        }
      } catch {
        // Unified record unreadable — the suffixed store is already written.
      }
    }
  };

  // GAP 4 (Item 1) — record the CURRENT episode on first GENUINE playback.
  // A direct-URL first visit never runs handleEpisodeSelect, so a
  // first-ever session uploaded nothing until a click or auto-next. Player
  // calls this once per episode load from its first `video:timeupdate`
  // (t>0) — the same first-timeupdate trigger Aniraku records at
  // (Watch.jsx:4327 `lastSave = 0` + :4381), NEVER on mere page load, so
  // pages you never play are never marked watched; the embed path fires it
  // from the first postMessage progress (t>0). Routes through
  // updateWatchedEpisodes — the EpisodeList-style dual-write,
  // `isHistoryPaused()` gated at :711 — so Wave B's flushHistorySync sees
  // the anime; `publishHistoryNow` then pushes the row immediately for
  // signed-in users (guests no-op).
  const playbackRecordedKeyRef = useRef('');
  const handlePlaybackStarted = () => {
    if (!animeId || !currentEpisode.id) return;
    const key = `${animeId}:${currentEpisode.id}`;
    if (playbackRecordedKeyRef.current === key) return; // once per episode
    playbackRecordedKeyRef.current = key;
    updateWatchedEpisodes(currentEpisode);
    if (!isHistoryPaused()) {
      void publishHistoryNow().catch(() => {});
    }
  };

  // TODO UPDATES CURRENT EPISODE INFORMATION, UPDATES WATCHED EPISODES AND NAVIGATES TO NEW URL
  const handleEpisodeSelect = useCallback(
    async (selectedEpisode: Episode) => {
      setIsEpisodeChanging(true);
      setCurrentEpisode({
        id: selectedEpisode.id,
        number: selectedEpisode.number,
        image: selectedEpisode.image,
        title: selectedEpisode.title,
        description: selectedEpisode.description,
        imageHash: selectedEpisode.imageHash,
        airDate: selectedEpisode.airDate,
      });

      localStorage.setItem(
        LOCAL_STORAGE_KEYS.LAST_WATCHED_EPISODE + animeId,
        JSON.stringify({
          id: selectedEpisode.id,
          title: selectedEpisode.title,
          number: selectedEpisode.number,
        }),
      );
      updateWatchedEpisodes(selectedEpisode);

      // Live episode write: `/watch/{id}/{slug}?ep={N}` with REPLACE (live's
      // `history.replaceState` + `setSearchParams({replace:true})` — never a
      // push, never the legacy 3-segment path).
      navigate(
        buildWatchUrl(
          { id: animeId ?? '', title: animeInfo?.title },
          selectedEpisode.number,
        ),
        { replace: true },
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsEpisodeChanging(false);
    },
    [animeId, animeInfo, navigate],
  );

  // TODO UPDATE DOWNLOAD LINK WHEN EPISODE ID CHANGES
  const updateDownloadLink = useCallback((link: string) => {
    setDownloadLink(link);
  }, []);

  // TODO AUTOPLAY BUTTON TOGGLE PROPS
  const handleEpisodeEnd = async () => {
    const nextEpisodeIndex = currentEpisodeIndex + 1;
    if (nextEpisodeIndex >= episodes.length) {
      console.log('No more episodes.');
      return;
    }
    handleEpisodeSelect(episodes[nextEpisodeIndex]);
  };

  // Episode nav — driven by the single `aniraku:shortcut` listener below
  // (another agent dispatches Shift+P/B/N as CustomEvents; the legacy
  // Shift+N/P document keydown handler was removed to avoid double-firing).
  const onPrevEpisode = () => {
    const prevIndex = currentEpisodeIndex - 1;
    if (prevIndex >= 0) {
      handleEpisodeSelect(episodes[prevIndex]);
    }
  };
  const onNextEpisode = () => {
    const nextIndex = currentEpisodeIndex + 1;
    if (nextIndex < episodes.length) {
      handleEpisodeSelect(episodes[nextIndex]);
    }
  };
  const toggleTheater = useCallback(
    () => setTheaterMode((value) => !value),
    [],
  );
  const toggleLights = useCallback(() => setLightsOn((value) => !value), []);

  //----------------------------------------------USEFFECTS----------------------------------------------
  // THE one `aniraku:shortcut` listener (contract: detail.action ∈
  // prev-ep | next-ep | theater | lights). Registered on mount, cleaned on
  // unmount; latest handlers are read through a ref so the listener never
  // goes stale and never fires twice.
  const shortcutHandlersRef = useRef({
    onPrevEpisode,
    onNextEpisode,
    toggleTheater,
    toggleLights,
  });
  useEffect(() => {
    shortcutHandlersRef.current = {
      onPrevEpisode,
      onNextEpisode,
      toggleTheater,
      toggleLights,
    };
  });
  useEffect(() => {
    const onShortcut = (event: Event) => {
      const detail = (event as CustomEvent<{ action?: string }>)?.detail;
      const handlers = shortcutHandlersRef.current;
      switch (detail?.action) {
        case 'prev-ep':
          handlers.onPrevEpisode();
          break;
        case 'next-ep':
          handlers.onNextEpisode();
          break;
        case 'theater':
          handlers.toggleTheater();
          break;
        case 'lights':
          handlers.toggleLights();
          break;
        default:
          break;
      }
    };
    window.addEventListener('aniraku:shortcut', onShortcut);
    return () => window.removeEventListener('aniraku:shortcut', onShortcut);
  }, []);

  // Own episode ratings (Aniraku Watch.jsx:2088-2109): authed → backend
  // (`GET /api/v1/anime/{id}/ratings`), guest → LS
  // `aniraku-episode-ratings-{animeId}`. Session identity resolves through
  // lib/sync's bridge (Info.tsx pattern) — no auth-hook import.
  useEffect(() => {
    if (!animeId) return;
    let cancelled = false;
    setEpRatings({});
    getSessionUserId()
      .then((userId) => {
        if (cancelled) return;
        if (userId) {
          fetchEpisodeRatings(animeId).then((ratings) => {
            if (!cancelled) setEpRatings(ratings || {});
          });
        } else {
          try {
            const stored = JSON.parse(
              localStorage.getItem(`${EPISODE_RATINGS_LS_KEY}-${animeId}`) ||
                '{}',
            );
            if (!cancelled) setEpRatings(stored || {});
          } catch {
            if (!cancelled) setEpRatings({});
          }
        }
      })
      .catch(() => {
        // offline / unconfigured — no ratings to show
      });
    return () => {
      cancelled = true;
    };
  }, [animeId]);

  // Theater persistence: `aniraku:ui:theater` (legacy) + `aniraku:ui`
  // record `theaterMode` — both written, both read.
  useEffect(() => {
    localStorage.setItem('aniraku:ui:theater', JSON.stringify(theaterMode));
    try {
      const record = readUiRecord();
      record.theaterMode = theaterMode;
      localStorage.setItem('aniraku:ui', JSON.stringify(record));
    } catch {
      // Storage full/blocked — theater still works for this session.
    }
  }, [theaterMode]);

  // TODO SETS DEFAULT SOURCE TYPE AND LANGUGAE TO DEFAULT AND SUB
  // Legacy 'vidstreaming'/'gogo' stored prefs now mean 'embed' (kept fallback).
  useEffect(() => {
    const defaultSourceType = 'default';
    const defaultLanguage = 'sub';
    const storedSource =
      readStoredPref(
        getSourceTypeKey(animeId || ''),
        legacySourceTypeKey(animeId || ''),
      ) || defaultSourceType;
    setSourceType(
      storedSource === 'vidstreaming' || storedSource === 'gogo'
        ? 'embed'
        : storedSource,
    );
    setLanguage(
      readStoredPref(
        getLanguageKey(animeId || ''),
        legacyLanguageKey(animeId || ''),
      ) || defaultLanguage,
    );
  }, [animeId]);

  // TODO SAVES LANGUAGE PREFERENCE TO LOCAL STORAGE (live + legacy keys)
  useEffect(() => {
    localStorage.setItem(getLanguageKey(animeId), language);
    localStorage.setItem(legacyLanguageKey(animeId), language);
  }, [language, animeId]);

  //FETCHES ANIME DATA AND ANIME INFO AS BACKUP
  useEffect(() => {
    let isMounted = true;
    setInfoResolved(false); // re-arm the NSFW gate guard per title
    const fetchInfo = async () => {
      if (!animeId) {
        console.error('Anime ID is null.');
        setLoading(false);
        setInfoResolved(true); // nothing to gate — keep the old boot path
        return;
      }
      setLoading(true);
      try {
        const info = await fetchAnimeData(animeId);
        if (isMounted) {
          setAnimeInfo(info);
        }
      } catch (error) {
        console.error(
          'Failed to fetch anime data, trying fetchAnimeInfo as a fallback:',
          error,
        );
        try {
          const fallbackInfo = await fetchAnimeInfo(animeId);
          if (isMounted) {
            setAnimeInfo(fallbackInfo);
          }
        } catch (fallbackError) {
          console.error(
            'Also failed to fetch anime info as a fallback:',
            fallbackError,
          );
        } finally {
          if (isMounted) setLoading(false);
        }
      } finally {
        // Settled (success, fallback success, or both failed): the NSFW
        // gate decision is now possible, so the player slot may boot.
        if (isMounted) setInfoResolved(true);
      }
    };

    fetchInfo();

    return () => {
      isMounted = false;
    };
  }, [animeId]);

  // TODO FETCHES ANIME EPISODES BASED ON LANGUAGE, ANIME ID AND UPDATES COMPONENTS
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      if (!animeId) {
        // Old code returned here with loading stuck at true forever.
        setLoading(false);
        return;
      }
      try {
        const animeData = await fetchAnimeEpisodes(animeId);
        if (isMounted && animeData) {
          const transformedEpisodes = animeData
            .filter((ep: any) => String(ep.id).includes('-episode-'))
            .map((ep: any) => ({
              ...ep,
              // Aniraku ids are already `${animeId}-episode-${number}`;
              // keep the string id for watched-history compat.
              number: Number(ep.number),
              id: String(ep.id),
              title: ep.title,
              image: ep.image,
            }));
          setEpisodes(transformedEpisodes);
          // Episode resolution order (live parity): `?ep=N` from the query
          // string FIRST, then the legacy `:episodeNumber` path param, then
          // the saved-episode fallback for bare /watch/{id}[/slug] URLs.
          const queryEpisode = parseRequestedEpisode(window.location.search);
          const pathEpisode =
            episodeNumber !== undefined &&
            episodeNumber !== '' &&
            Number.isFinite(Number(episodeNumber))
              ? Number(episodeNumber)
              : null;
          const requestedEpisode = queryEpisode ?? pathEpisode;
          const navigateToEpisode = (() => {
            if (languageChanged) {
              const currentEpisodeNumber =
                Number(episodeNumber || currentEpisode.number);
              return (
                transformedEpisodes.find(
                  (ep: any) => Number(ep.number) === currentEpisodeNumber,
                ) || transformedEpisodes[transformedEpisodes.length - 1]
              );
            } else if (requestedEpisode !== null) {
              // Exact → closest ≤ requested → first; `latest` → last
              // (live `_t` semantics).
              return resolveRequestedEpisode(
                transformedEpisodes,
                requestedEpisode,
              );
            } else {
              const savedEpisodeData = localStorage.getItem(
                LOCAL_STORAGE_KEYS.LAST_WATCHED_EPISODE + animeId,
              );
              const savedEpisode = savedEpisodeData
                ? JSON.parse(savedEpisodeData)
                : null;
              return savedEpisode
                ? transformedEpisodes.find(
                    (ep: any) => ep.number === savedEpisode.number,
                  ) || transformedEpisodes[0]
                : transformedEpisodes[0];
            }
          })();

          if (navigateToEpisode) {
            setCurrentEpisode({
              id: navigateToEpisode.id,
              number: navigateToEpisode.number,
              image: navigateToEpisode.image,
              title: navigateToEpisode.title,
              description: navigateToEpisode.description,
              imageHash: navigateToEpisode.imageHash,
              airDate: navigateToEpisode.airDate,
            });

            // Initial normalization: always land (or stay) on the live
            // 2-segment + `?ep=N` format — REPLACE, so a legacy 3-segment
            // deep link (`/watch/21/title/5`) rewrites to
            // `/watch/21/slug?ep=5` without adding a history entry.
            navigate(
              buildWatchUrl(
                { id: animeId, title: animeInfo?.title },
                navigateToEpisode.number,
              ),
              { replace: true },
            );
            setLanguageChanged(false); // TODO Reset the languageChanged flag after handling the navigation
          }
        }
      } catch (error) {
        console.error('Failed to fetch episodes:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // TODO Last visited cache to order continue watching
    const updateLastVisited = () => {
      if (!animeInfo || !animeId) return; // TODO Ensure both animeInfo and animeId are available

      const lastVisited = localStorage.getItem(
        LOCAL_STORAGE_KEYS.LAST_ANIME_VISITED,
      );
      const lastVisitedData = lastVisited ? JSON.parse(lastVisited) : {};
      lastVisitedData[animeId] = {
        timestamp: Date.now(),
        titleEnglish: animeInfo.title.english, // TODO Assuming animeInfo contains the title in English
        titleRomaji: animeInfo.title.romaji, // TODO Assuming animeInfo contains the title in Romaji
      };

      localStorage.setItem(
        LOCAL_STORAGE_KEYS.LAST_ANIME_VISITED,
        JSON.stringify(lastVisitedData),
      );
    };

    if (animeId) {
      updateLastVisited();
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [
    animeId,
    animeTitle,
    episodeNumber,
    navigate,
    language,
    languageChanged,
    currentEpisode.number,
    // Re-normalizes the URL once the media title loads so the slug in
    // `?ep=N` writes matches live's `At` builder.
    animeInfo?.title,
  ]);

  // TODO UPDATE BACKGROUND IMAGE TO ANIME BANNER IF WIDTH IS UNDER 500PX / OR USE ANIME COVER IF NO BANNER FOUND
  useEffect(() => {
    if (!animeInfo || currentEpisode.id === '0') return;
    const updateBackgroundImage = () => {
      const episodeImage = currentEpisode.image;
      // mapAnilistMedia builds artwork as a ≤1-entry banner array, so the
      // old `artwork[3].img` ALWAYS threw a TypeError here and took the
      // whole page down — guard every link of the chain.
      const bannerImage =
        animeInfo.cover ||
        animeInfo.bannerImage ||
        animeInfo.artwork?.[3]?.img ||
        animeInfo.image ||
        '';
      if (episodeImage && episodeImage !== animeInfo.image) {
        const img = new Image();
        img.onload = () => {
          if (img.width > 500) {
            setSelectedBackgroundImage(episodeImage);
          } else {
            setSelectedBackgroundImage(bannerImage);
          }
        };
        img.onerror = () => {
          setSelectedBackgroundImage(bannerImage);
        };
        img.src = episodeImage;
      } else {
        setSelectedBackgroundImage(bannerImage);
      }
    };
    updateBackgroundImage();
  }, [animeInfo, currentEpisode]);

  // TODO UPDATES VIDEOPLAYER WIDTH WHEN WINDOW GETS RESIZED
  useEffect(() => {
    updateVideoPlayerWidth();
    const handleResize = () => {
      updateVideoPlayerWidth();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateVideoPlayerWidth]);

  // TODO UPDATES EPISODE LIST MAX HEIGHT BASED ON VIDEO PLAYER CURRENT HEIGHT
  useEffect(() => {
    const updateMaxHeight = () => {
      if (videoPlayerContainerRef.current) {
        const height = videoPlayerContainerRef.current.offsetHeight;
        setMaxEpisodeListHeight(`${height}px`);
      }
    };
    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
    return () => window.removeEventListener('resize', updateMaxHeight);
  }, []);

  // TODO SAVES SOURCE TYPE PREFERENCE TO LOCAL STORAGE (live + legacy keys)
  useEffect(() => {
    localStorage.setItem(getSourceTypeKey(animeId), sourceType);
    localStorage.setItem(legacySourceTypeKey(animeId), sourceType);
  }, [sourceType, animeId]);

  // Runtime SEO — old setWatchSEO (seo.js:190-260) through useSeo: per-episode
  // title/description/keywords, canonical on the canonical domain (pathname
  // strips ?ep=/server/language query churn — per-episode whenever the route
  // carries the number), og/twitter image + video.episode type, and JSON-LD
  // (VideoObject + 4-level breadcrumb, old's Catalog mapped to our /search)
  // with helper-managed cleanup. (Replaces the rebrand-sweep title effect.)
  const { pathname: seoPathname } = useLocation();
  const watchSeoTitle =
    animeInfo?.title?.english || animeInfo?.title?.romaji || 'Unknown Anime';
  const watchEpNum = Number(currentEpisode.number) || Number(episodeNumber) || 1;
  const watchImage = `https://img.anili.st/media/${animeId}`;
  useSeo({
    title: animeInfo
      ? `Watch ${watchSeoTitle} Episode ${watchEpNum} Online Free — Aniraku`
      : 'Anime — Aniraku',
    description: animeInfo
      ? `Watch ${watchSeoTitle} Episode ${watchEpNum} online for free on Aniraku. Stream in HD with subtitles and dub support.`
      : undefined,
    keywords: animeInfo
      ? `${watchSeoTitle}, ${watchSeoTitle} episode ${watchEpNum}, watch ${watchSeoTitle} episode ${watchEpNum} online, ${watchSeoTitle} streaming, anime streaming, watch anime free, aniraku`
      : undefined,
    canonicalPath: seoPathname,
    image: watchImage,
    ogType: 'video.episode',
    jsonLd: animeInfo
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: `${watchSeoTitle} — Episode ${watchEpNum}`,
            description: `Watch ${watchSeoTitle} Episode ${watchEpNum} online on Aniraku. Free anime streaming with subtitles and dub support.`,
            thumbnailUrl: watchImage,
            ...(animeInfo.duration
              ? { duration: `PT${animeInfo.duration}M` }
              : {}),
            interactionStatistic: {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/WatchAction',
            },
            provider: {
              '@type': 'Organization',
              name: 'Aniraku',
              url: SITE_URL,
            },
            isPartOf: {
              '@type': 'TVSeries',
              name: watchSeoTitle,
              url: `${SITE_URL}/info/${animeId}`,
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${SITE_URL}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Search',
                item: `${SITE_URL}/search`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: watchSeoTitle,
                item: `${SITE_URL}/info/${animeId}`,
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: `Episode ${watchEpNum}`,
                item: `${SITE_URL}${seoPathname}`,
              },
            ],
          },
        ]
      : undefined,
  });

  // TODO SHOW NO EPISODES DIV IF NO RESPONSE AFTER 10 SECONDS
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!episodes || episodes.length === 0) {
        setShowNoEpisodesMessage(true);
      }
    }, 10000);
    return () => clearTimeout(timeoutId);
  }, [loading, episodes]);

  // TODO SHOW NO EPISODES DIV IF NOT LOADING AND NO EPISODES FOUND
  useEffect(() => {
    if (!loading && episodes.length === 0) {
      setShowNoEpisodesMessage(true);
    } else {
      setShowNoEpisodesMessage(false);
    }
  }, [loading, episodes]);

  // ── saveRating — Aniraku Watch.jsx:2111-2177 (verbatim flow) ──
  // authed → saveEpisodeRating (server); guest → LS `…-{animeId}` (the
  // reference's unauthenticated behavior — local persistence, still fully
  // interactive). On success, push the score to every CONNECTED provider
  // (GET /sync cached in syncConnectedRef, then PUT /sync/score each) and
  // toast with the reference's dynamic provider-label construction.
  const saveRating = useCallback(
    async (score: number) => {
      if (epRatingSaving || !animeId || !currentEpisode.number) return;
      const selectedScore = Math.round(Number(score));
      if (!Number.isInteger(selectedScore) || selectedScore < 1 || selectedScore > 10)
        return;
      const epNumber = Number(currentEpisode.number);
      setEpRatingSaving(true);
      setEpRatingSaved(false);
      const next = { ...epRatings, [epNumber]: selectedScore };
      setEpRatings(next);
      let ok = false;
      const userId = await getSessionUserId().catch(() => null);
      if (userId) {
        ok = await saveEpisodeRating(animeId, epNumber, selectedScore);
      } else {
        try {
          localStorage.setItem(
            `${EPISODE_RATINGS_LS_KEY}-${animeId}`,
            JSON.stringify(next),
          );
          ok = true;
        } catch {
          // storage unavailable
        }
      }
      if (ok) {
        if (syncConnectedRef.current === null) {
          const data = await getSyncStatus();
          if (data) {
            syncConnectedRef.current = ['mal', 'anilist'].filter((p) => {
              // Reference predicate `configured && connected`
              // (Watch.jsx:2137-2139); `configured` ships from the backend
              // (api/v1/sync.go:154) but isn't on SyncProviderStatus — read
              // it through a local shape (lib/sync.ts is read-only here).
              const status = data[p] as
                | { configured?: boolean; connected?: boolean }
                | undefined;
              return status?.configured && status?.connected;
            });
          }
        }
        const providers = syncConnectedRef.current || [];
        if (providers.length > 0) {
          Promise.allSettled(
            providers.map((p) =>
              updateSyncScore({
                provider: p,
                animeId: parseInt(animeId, 10),
                score: selectedScore,
              }),
            ),
          ).then((results) => {
            // Aniraku counts truthy fulfilled values; our port resolves
            // `{ ok }`, so a fulfilled-but-failed PUT must not count.
            const done = results.filter(
              (r) => r.status === 'fulfilled' && r.value?.ok,
            ).length;
            if (done > 0) {
              showToast(
                `Score ${selectedScore}/10 synced to ${providers
                  .map((p) => PROVIDER_LABELS[p])
                  .join(' & ')}`,
                { type: 'success' },
              );
            }
          });
        }
      }
      setEpRatingSaving(false);
      setEpRatingSaved(true);
      if (epRatingSaveTimerRef.current !== null) {
        window.clearTimeout(epRatingSaveTimerRef.current);
      }
      epRatingSaveTimerRef.current = window.setTimeout(
        () => setEpRatingSaved(false),
        2000,
      );
    },
    [epRatingSaving, epRatings, animeId, currentEpisode.number],
  );

  // ── NSFW gate — Aniraku Watch.jsx:5578-5614 ──
  // Hentai-genre title (isNsfw, genre rule) + NSFW preference OFF
  // (useNsfw default) → the page returns the gate INSTEAD of the player
  // row, so <Player> never mounts for the blocked title: no source fetch,
  // no keydown layer, no resume/first-play records — prevention, not a
  // post-boot overlay. The `infoResolved` hold above guarantees the gate
  // decision always precedes the player mount; flipping the setting
  // re-renders through useNsfw's shared state and lifts the gate live.
  // Copy: Info.tsx NsfwCard pattern (Open Settings → /profile/settings,
  // Go Back → /) + Aniraku's WATCH-variant paragraph, verbatim.
  if (animeInfo && isNsfw(animeInfo) && !nsfwEnabled) {
    return (
      <WatchContainer className='nsfw-gate' style={{ padding: '80px 20px' }}>
        <NsfwGateCard>
          <div style={{ fontSize: 48, marginBottom: 16 }}>18+</div>
          <NsfwTitle>Mature Content</NsfwTitle>
          <NsfwText>
            This anime contains adult content. Enable NSFW content in your
            settings to view it.
          </NsfwText>
          <NsfwActions>
            <NsfwBtn to='/profile/settings'>Open Settings</NsfwBtn>
            <NsfwOutline to='/'>Go Back</NsfwOutline>
          </NsfwActions>
        </NsfwGateCard>
      </WatchContainer>
    );
  }

  //----------------------------------------------SLOT CONTENT----------------------------------------------
  const mediaSourceEl =
    animeInfo && animeInfo.status !== 'Not yet aired' ? (
      <MediaSource
        sourceType={sourceType}
        setSourceType={setSourceType}
        language={language}
        setLanguage={setLanguage}
        downloadLink={downloadLink}
        episodeId={currentEpisode.number.toString()}
        episodeTitle={currentEpisode.title}
        episodeAirDate={currentEpisode.airDate}
        episodeDescription={currentEpisode.description}
        serversSub={serversSub}
        serversDub={serversDub}
        selectedServer={selectedServer}
        onSelectServer={handleSelectServer}
        airingTime={
          animeInfo && animeInfo.status === 'Ongoing' ? countdown : undefined
        }
        nextEpisodenumber={nextEpisodenumber}
        totalEpisodes={episodes.length}
        episodeFiller={(currentEpisode as any)?.filler === true}
        anilistId={animeInfo?.id}
      />
    ) : null;

  // `.watch-rating` row (Aniraku Watch.jsx:6512-6564) — placed directly
  // under the current-episode meta bar (mediaSourceEl), matching Aniraku's
  // meta → rating order inside `watch-info`. Renders once the title is
  // known; `loading` is NOT part of the condition (it re-toggles on every
  // episode/language refetch and would flicker the row).
  const ratingRowEl = animeInfo ? (
    <WatchRatingRow>
      <span style={{ fontSize: 13, color: 'var(--global-text-muted)' }}>
        {epRatings[currentEpisode.number]
          ? `Rated ${epRatings[currentEpisode.number]}/10`
          : 'Rate this episode'}
      </span>
      <span
        role='group'
        aria-label='Episode rating'
        style={{ display: 'inline-flex', gap: 3 }}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type='button'
            disabled={epRatingSaving}
            aria-label={`Rate ${n} out of 10`}
            title={`Rate ${n} out of 10`}
            onClick={() => saveRating(n)}
            style={{
              background: 'none',
              border: 'none',
              padding: 2,
              minWidth: 22,
              minHeight: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color:
                (epRatings[currentEpisode.number] || 0) >= n
                  ? '#fbbf24'
                  : 'var(--global-text-muted)',
              opacity: (epRatings[currentEpisode.number] || 0) >= n ? 1 : 0.35,
              fontSize: 14,
            }}
          >
            <FaStar size={14} />
          </button>
        ))}
      </span>
      {epRatingSaving && <RatingSpinner size={12} />}
      {epRatingSaved && (
        <span style={{ fontSize: 12, color: '#86efac' }}>Saved</span>
      )}
    </WatchRatingRow>
  ) : null;

  const commentsEl = animeInfo ? (
    <Comments
      loading={loading}
      mediaId={animeInfo.id}
      episodeNumber={Number(currentEpisode.number) || 0}
      mediaFormat={animeInfo.type}
      mediaStatus={animeInfo.status}
      episodeCount={episodes.length}
      mediaType='anime'
    />
  ) : null;

  const episodeListEl = (
    <EpisodeListContainer
      style={
        { '--ep-list-max': maxEpisodeListHeight } as React.CSSProperties
      }
    >
      {loading ? (
        <SkeletonPlayer />
      ) : (
        <EpisodeList
          animeId={animeId}
          episodes={episodes}
          selectedEpisodeId={currentEpisode.id}
          onEpisodeSelect={(episodeId: string) => {
            const episode = episodes.find((e) => e.id === episodeId);
            if (episode) {
              handleEpisodeSelect(episode);
            }
          }}
          maxListHeight={maxEpisodeListHeight}
        />
      )}
    </EpisodeListContainer>
  );

  const detailsEl = animeInfo ? <AnimeData animeData={animeInfo} /> : null;

  // Server gate: pools stamped for THIS episode AND a resolved selection
  // (or genuinely no selectable server — then the player's own /stream path
  // owns discovery, the old no-Auto fallback).
  const gatePool = language === 'dub' ? serversDub : serversSub;
  const serverGateOpen =
    poolEpKey === serverEpKey &&
    serversSettled &&
    (Boolean(selectedServerObj) || !gatePool.some((s: any) => s?.name));

  const playerEl = (
    <VideoPlayerContainer
      id='player-container'
      ref={videoPlayerContainerRef}
      data-episode-changing={isEpisodeChanging}
    >
      {/* Player boots only when: episodes are ready, the title detail has
          settled (infoResolved — the NSFW gate above always gets its
          decision first, so a blocked title never initializes the player),
          AND the server pools are stamped for THIS episode with a resolved
          selection (serverGateOpen). Without that third gate the player
          started on its own /stream discovery and the arriving Sub/Dub list
          then forced srcOverride onto it — the reported restart bug. */}
      {loading || !infoResolved || !serverGateOpen ? (
        <SkeletonPlayer />
      ) : futureEpisodeRequested ? (
        <UpcomingPanel role='status'>
          <h2>
            Episode {requestedEpNumber} isn&apos;t out yet
          </h2>
          <p>{UPCOMING_EPISODE_MESSAGE}</p>
          {countdown && countdown !== 'Airing now or aired' ? (
            <p>Next episode airs in {countdown}.</p>
          ) : null}
          <UpcomingCta
            type='button'
            onClick={() => navigate(window.location.pathname)}
          >
            Watch the latest aired episode
          </UpcomingCta>
        </UpcomingPanel>
      ) : (
        // Zenime composition: ONE Player owns both render modes — HLS chrome
        // (PlayerViewport) or the embedded FlixCloud iframe + control bar —
        // chosen inside the player from `embedded`/`embeddedUrl`.
        <Player
          animeId={Number(animeId)}
          episode={Number(currentEpisode.number)}
          lang={(language as 'sub' | 'dub') || 'sub'}
          malId={animeInfo?.malId}
          banner={selectedBackgroundImage}
          srcOverride={directOverride?.url ?? null}
          subsOverride={directOverride?.subs ?? null}
          headersOverride={directOverride?.headers ?? null}
          updateDownloadLink={updateDownloadLink}
          onEpisodeEnd={handleEpisodeEnd}
          onPrevEpisode={onPrevEpisode}
          onNextEpisode={onNextEpisode}
          onPlaybackStart={handlePlaybackStarted}
          animeTitle={
            animeInfo?.title?.english || animeInfo?.title?.romaji
          }
          animeTitleInfo={animeInfo?.title}
          hasPrev={currentEpisodeIndex > 0}
          hasNext={
            currentEpisodeIndex >= 0 &&
            currentEpisodeIndex < episodes.length - 1
          }
          lightsOn={lightsOn}
          embedded={sourceType !== 'default'}
          embeddedUrl={embeddedVideoUrl}
          aspectRatio={theaterMode ? '21/9' : '16/9'}
          serversSub={serversSub}
          serversDub={serversDub}
          selectedServer={selectedServer}
          onSelectServer={handleSelectServer}
        />
      )}
    </VideoPlayerContainer>
  );

  return (
    <WatchContainer className={lightsOn ? 'dimmed-background' : undefined}>
      <LightsGlobalStyle />
      {lightsOn && (
        <div
          className='dimmed-overlay'
          role='presentation'
          onClick={() => setLightsOn(false)}
        />
      )}
      {animeInfo &&
      animeInfo.status === 'Not yet aired' &&
      animeInfo.trailer ? (
        <div style={{ textAlign: 'center' }}>
          <strong>
            <h2>Time Remaining:</h2>
          </strong>
          {animeInfo &&
          animeInfo.nextAiringEpisode &&
          countdown !== 'Airing now or aired' ? (
            <p>
              <FaBell /> {countdown}
            </p>
          ) : (
            <p>Unknown</p>
          )}
          {animeInfo.trailer && (
            <IframeTrailer
              src={`https://www.youtube.com/embed/${animeInfo.trailer.id}`}
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
              allowFullScreen
            />
          )}
        </div>
      ) : showNoEpisodesMessage ? (
        <NoEpsFoundDiv>
          <h2>
            {movieUnreleased
              ? 'This movie has not premiered yet'
              : titleUnreleased
                ? 'This anime has not started airing yet'
                : futureEpisodeRequested
                  ? 'That episode is not out yet'
                  : (
                    <>
                      No episodes found {':('}
                    </>
                  )}
          </h2>
          {(movieUnreleased || titleUnreleased || futureEpisodeRequested) && (
            <NoEpsMessage>
              {movieUnreleased
                ? UNRELEASED_MOVIE_MESSAGE
                : titleUnreleased
                  ? UNRELEASED_ANIME_MESSAGE
                  : UPCOMING_EPISODE_MESSAGE}
            </NoEpsMessage>
          )}
          <NoEpsImage>
            <img src={Image404URL} alt='404 Error'></img>
          </NoEpsImage>
          <GoToHomePageButton />
        </NoEpsFoundDiv>
      ) : (
        // Zenime structure (ported from ~/Zenime Watch.tsx): ONE player row
        // [player(3fr) | episode list(1fr, ≤380px)], then the 2-col data
        // grid [mediaSource + comments + details | seasons + related].
        // CSS handles the <1000px collapse; theater forces the row to a
        // full-width column via [data-theater-mode].
        <>
          <WatchWrapper data-theater-mode={theaterMode ? 'true' : 'false'}>
            {!showNoEpisodesMessage && (
              <>
                {playerEl}
                {episodeListEl}
              </>
            )}
          </WatchWrapper>
          <DataWrapper>
            <SourceAndData $videoPlayerWidth={videoPlayerWidth}>
              {mediaSourceEl}
              {ratingRowEl}
              {detailsEl}
              {commentsEl}
            </SourceAndData>
            <RalationsTable>
              {animeInfo && animeInfo.relations && (
                <Seasons relations={animeInfo.relations} />
              )}
              {animeInfo && <AnimeDataList animeData={animeInfo} />}
            </RalationsTable>
          </DataWrapper>
        </>
      )}
    </WatchContainer>
  );
};

// Route-level wrapper: live error boundary (yn) with resetKey=pathname.
const Watch: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <WatchErrorBoundary
      resetKey={location.pathname}
      onGoHome={() => navigate('/home')}
    >
      <WatchInner />
    </WatchErrorBoundary>
  );
};

export default Watch;
