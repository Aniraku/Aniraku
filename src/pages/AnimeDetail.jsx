import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FaPlay, FaStar, FaBookmark, FaRegBookmark, FaCheck } from 'react-icons/fa'
import Footer from '../components/Footer/Footer'
import Comments from '../components/Comments/Comments'
import useLocalStorage from '../hooks/useLocalStorage'
import { useAnimeDetails } from '../hooks/useAnime'
import { useAuth } from '../hooks/useAuth'
import { filterAdult, isNsfw, useNsfw, useStreamable } from '../hooks/useNsfw'
import { supabase } from '../lib/supabase'
import { extractIdFromSlug, generateSlug } from '../lib/slug'
import { fetchEpisodeRatings } from '../lib/sync'
import styled from 'styled-components'
import { AnimeDetailSkeleton } from '../components/Skeletons/Skeletons'
import { setAnimeDetailSEO } from '../lib/seo'
import { historyEntryKey, subscribeToWatchHistory } from '../lib/watchHistory'
import { API_BASE } from '../config'
import { enrichEpisodesWithTmdb } from '../lib/tmdbEpisodes'

const MIRURO_RELATIONS_BASE = 'https://miruro-api-v3.onrender.com/anime'
const EPISODE_RETRY_BASE_MS = 1_500
const EPISODE_RETRY_MAX_MS = 15_000

const Page = styled.div`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  position: relative;
  overflow-x: clip;
`

const PageBackground = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.34;
  background-image:
    linear-gradient(to bottom, rgba(4, 7, 14, 0.16) 0%, rgba(4, 7, 14, 0.72) 58%, var(--bg) 94%),
    url(${p => p.$src});
  background-size: cover;
  background-position: center 18%;
  filter: blur(28px) saturate(1.18) brightness(0.72);
  transform: scale(1.08);
  transition: opacity 240ms ease, filter 240ms ease;
  @media (max-width: 768px) {
    opacity: 0.27;
    background-position: center top;
    filter: blur(22px) saturate(1.1) brightness(0.68);
  }
`

const Banner = styled.div`
  position: relative;
  height: 400px;
  overflow: hidden;
  z-index: 1;
  @media (max-width: 768px) { height: 300px; }
  @media (max-width: 480px) { height: 260px; }
`

const BannerImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.5);
`

const BannerOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 50%, var(--bg) 100%);
`

const BannerContent = styled.div`
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--content-pad);
  display: flex;
  gap: 32px;
  align-items: flex-end;
  @media (max-width: 768px) { gap: 20px; padding: 0 var(--content-pad); bottom: 20px; }
  @media (max-width: 480px) { gap: 14px; padding: 0 var(--content-pad); bottom: 14px; }
`

const Cover = styled.img`
  width: 150px;
  height: 210px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  flex-shrink: 0;
  @media (max-width: 768px) { width: 110px; height: 155px; }
  @media (max-width: 480px) { width: 82px; height: 116px; border-radius: 6px; }
`

const Info = styled.div`
  flex: 1;
  padding-bottom: 8px;
  min-width: 0;
`

const Title = styled.h1`
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  @media (max-width: 768px) { font-size: 22px; }
  @media (max-width: 480px) { font-size: clamp(18px, 5.6vw, 22px); line-height: 1.14; }
`

const Meta = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted);
  @media (max-width: 480px) { font-size: 12px; gap: 8px; }
`

const Score = styled.span`
  color: #ffc107;
  display: flex;
  align-items: center;
  gap: 4px;
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
  }
`

const WatchBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--accent);
  color: var(--bg);
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: opacity 0.2s;
  min-height: 44px;
  &:hover { opacity: 0.9; }
  @media (max-width: 480px) { padding: 8px 12px; font-size: 13px; min-height: 42px; width: 100%; justify-content: center; }
`

const BookmarkBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-elevated);
  color: ${p => p.$active ? 'var(--accent)' : 'var(--text-muted)'};
  border: 1px solid var(--border);
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  &:hover { border-color: var(--accent); }
  @media (max-width: 480px) { padding: 8px 14px; font-size: 13px; min-height: 42px; }
`

const ProgressHint = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;

  @media (max-width: 480px) { grid-column: 1 / -1; font-size: 11px; }
`

const EpisodeState = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  color: ${({ $rated }) => ($rated ? '#fbbf24' : '#86efac')};
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
`

const EpisodeProgress = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: rgba(255,255,255,0.14);
  span {
    display: block;
    height: 100%;
    width: ${({ $value }) => `${Math.max(0, Math.min(100, $value || 0))}%`};
    background: ${({ $complete }) => ($complete ? '#4ade80' : 'var(--accent)')};
  }
`

const RatingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(251,191,36,0.15);
  color: #fbbf24;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
`

const Content = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 40px) var(--content-pad) calc(68px + env(safe-area-inset-bottom));
  @media (max-width: 768px) { padding-top: 24px; }
  @media (max-width: 480px) { padding-top: 20px; }
`

const Section = styled.section`
  margin-bottom: 28px;
  @media (max-width: 480px) { margin-bottom: 20px; }
`

const SectionTitle = styled.h2`
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
`

const Desc = styled.p`
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
  @media (max-width: 480px) { font-size: 13px; line-height: 1.6; }
`

const GenreRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`

const GenreTag = styled(Link)`
  padding: 3px 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  &:hover { border-color: var(--accent); color: var(--text-primary); }
  @media (max-width: 480px) { padding: 2px 8px; font-size: 10px; border-radius: 6px; min-height: 26px; }
`

const Tabs = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  -webkit-overflow-scrolling: touch;
`

const Tab = styled.button`
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid ${p => p.$active ? 'var(--accent)' : 'transparent'};
  color: ${p => p.$active ? 'var(--text-primary)' : 'var(--text-muted)'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  &:hover { color: var(--text-primary); }
  @media (max-width: 480px) { padding: 8px 14px; font-size: 13px; min-height: 40px; }
`

const EpisodeList = styled.div`
  max-height: 500px;
  overflow-y: auto;
  background: var(--bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--border);
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  @media (max-width: 480px) { max-height: 400px; border-radius: 6px; }
`

const EpBadge = styled.span`
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
  background: ${({ $type }) => ($type === 'filler' ? 'rgba(234,179,8,0.15)' : 'rgba(99,102,241,0.15)')};
  color: ${({ $type }) => ($type === 'filler' ? '#fde68a' : '#a5b4fc')};
`

const EpisodeRow = styled(Link)`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  text-decoration: none;
  color: var(--text-muted);
  font-size: 13px;
  transition: background 0.15s;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  &:hover { background: rgba(255,255,255,0.03); }
  &:last-child { border-bottom: none; }
  &:active { background: rgba(255,255,255,0.05); }
  @media (max-width: 560px) {
    padding: 9px 10px;
    gap: 8px;
    font-size: 12px;
    min-height: 48px;
    flex-wrap: wrap;
    align-content: center;
    > span:nth-of-type(2) { flex: 1 1 calc(100% - 108px) !important; min-width: 110px !important; }
    ${EpisodeState}, ${RatingBadge}, ${EpBadge} { margin-left: 54px; }
    ${EpisodeState} + ${EpisodeState}, ${EpisodeState} + ${RatingBadge}, ${RatingBadge} + ${EpisodeState} { margin-left: 0; }
  }
`

const EpThumb = styled.img`
  width: 60px;
  height: 34px;
  object-fit: contain;
  border-radius: 4px;
  flex-shrink: 0;
  background: var(--bg-card);
  @media (max-width: 560px) { width: 46px; height: 28px; }
`

const EpNum = styled.span`
  width: 24px;
  text-align: right;
  font-weight: 600;
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
`

const FilterBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  margin-bottom: 12px;
  background: ${({ $active }) => ($active ? 'rgba(99,102,241,0.18)' : 'var(--bg-elevated)')};
  color: ${({ $active }) => ($active ? '#a5b4fc' : 'var(--text-muted)')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(99,102,241,0.45)' : 'var(--border)')};
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  min-height: 30px;
  -webkit-tap-highlight-color: transparent;
  &:hover { border-color: var(--accent); }
`

const Center = styled.div`
  min-height: 80vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
`

const EPISODE_RATINGS_LS_KEY = 'aniraku-episode-ratings'

function normalizeActivityRow(row) {
  const rawEpisode = row?.episode ?? row?.episode_number
  const episode = Number(rawEpisode)
  if (!Number.isInteger(episode) || episode < 1) return null
  const rawTime = row?.time ?? row?.progress ?? 0
  const rawDuration = row?.duration ?? 0
  const time = Math.max(0, Number(rawTime) || 0)
  const duration = Math.max(0, Number(rawDuration) || 0)
  const timestampValue = row?.timestamp
  const timestamp = typeof timestampValue === 'number'
    ? timestampValue
    : Number(timestampValue) || Date.parse(timestampValue || '') || 0
  return {
    animeId: row?.animeId ?? row?.anime_id,
    episode,
    time,
    duration,
    timestamp,
    completed: row?.completed === true || row?.status === 'completed' || duration <= 0 || (duration > 0 && time >= Math.max(duration - 5, duration * 0.9)),
  }
}

function mergeActivityRows(rows) {
  const byEpisode = new Map()
  rows.forEach((row) => {
    const normalized = normalizeActivityRow(row)
    if (!normalized) return
    const previous = byEpisode.get(normalized.episode)
    if (!previous || normalized.timestamp >= previous.timestamp) {
      byEpisode.set(normalized.episode, normalized)
    }
  })
  return [...byEpisode.values()].sort((a, b) => b.timestamp - a.timestamp)
}

const RELATION_LABELS = {
  PREQUEL: 'Prequel', SEQUEL: 'Sequel', SIDE_STORY: 'Side Story',
  SPIN_OFF: 'Spin Off', SUMMARY: 'Summary', ALTERNATIVE: 'Alternative',
  ADAPTATION: 'Adaptation', CHARACTER: 'Character', OTHER: 'Other',
  PARENT: 'Parent', COMPANION: 'Companion', INCLUDES: 'Includes', GIFTED_FROM: 'Based On',
}

const CardLink = styled(Link)`
  text-decoration: none;
  display: block;
  -webkit-tap-highlight-color: transparent;
`

const CardInner = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-card);
  aspect-ratio: 16/10;
  @media (max-width: 480px) { border-radius: 6px; }
`

const CardImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: filter 0.3s;
  ${CardLink}:hover & { filter: brightness(1.15); }
  @media (hover: none) { transition: none; }
`

const CardGradient = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%);
`

const CardBadge = styled.span`
  position: absolute;
  top: 6px;
  left: 6px;
  background: ${p => p.$variant === 'score' ? 'rgba(0,0,0,0.8)' : 'rgba(99,102,241,0.9)'};
  color: ${p => p.$variant === 'score' ? '#ffc107' : '#fff'};
  font-size: ${p => p.$variant === 'score' ? '10px' : '9px'};
  font-weight: 700;
  padding: ${p => p.$variant === 'score' ? '2px 6px' : '2px 7px'};
  border-radius: 3px;
  ${p => p.$variant === 'score' ? '' : 'text-transform: uppercase; letter-spacing: 0.3px;'}
  z-index: 1;
  @media (max-width: 480px) {
    font-size: ${p => p.$variant === 'score' ? '9px' : '8px'};
    padding: ${p => p.$variant === 'score' ? '1px 5px' : '1px 5px'};
  }
`

const CardTitle = styled.p`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 8px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
  margin: 0;
  @media (max-width: 480px) { font-size: 11px; padding: 16px 6px 6px; }
`

const CardMeta = styled.div`
  position: absolute;
  bottom: 28px;
  left: 8px;
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: rgba(255,255,255,0.7);
  @media (max-width: 480px) { bottom: 24px; left: 6px; font-size: 9px; gap: 4px; }
`

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  @media (min-width: 768px) and (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  @media (min-width: 1025px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
`

const NsfwCard = styled.div`
  text-align: center;
  padding: 40px;
  max-width: 400px;
  background: var(--bg-elevated);
  border-radius: 16px;
  border: 1px solid var(--border);
  margin: 0 16px;
  @media (max-width: 480px) { padding: 28px 20px; border-radius: 12px; margin: 0 12px; }
`

const NsfwBtn = styled.button`
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
`

const OutlineLink = styled(Link)`
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
`

const RelationCard = ({ r }) => {
  const item = r?.node || r
  if (!item?.id) return null
  const t = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown'
  const label = RELATION_LABELS[r?.relationType] || r?.relationType?.replace('_', ' ') || ''
  return (
    <CardLink to={`/anime/${generateSlug(t)}-${item.id}`}>
      <CardInner>
        <CardImg src={item.coverImage?.large || ''} alt={t} loading="lazy" />
        <CardGradient />
        <CardBadge>{label}</CardBadge>
        <CardTitle>{t}</CardTitle>
      </CardInner>
    </CardLink>
  )
}

const RecCard = ({ item }) => {
  const t = item.title?.english || item.title?.romaji || 'Unknown'
  return (
    <CardLink to={`/anime/${generateSlug(t)}-${item.id}`}>
      <CardInner>
        <CardImg src={item.coverImage?.large || ''} alt={t} loading="lazy" />
        <CardGradient />
        {item.averageScore > 0 && (
          <CardBadge $variant="score">★ {item.averageScore}%</CardBadge>
        )}
        <CardTitle>{t}</CardTitle>
        <CardMeta>
          {item.format && <span>{item.format.replace('_', ' ')}</span>}
          {item.episodes && <span>{item.episodes} ep</span>}
        </CardMeta>
      </CardInner>
    </CardLink>
  )
}

const AnimeDetail = () => {
  const { slugId } = useParams()
  const navigate = useNavigate()
  const id = extractIdFromSlug(slugId)
  const { user } = useAuth()
  const { nsfwEnabled } = useNsfw()
  const [bookmarks, setBookmarks] = useLocalStorage('aniraku-bookmarks', [])
  const [activeTab, setActiveTab] = useState('episodes')
  const [episodes, setEpisodes] = useState([])
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [relations, setRelations] = useState([])
  const [relationsLoading, setRelationsLoading] = useState(false)
  const [hideFillers, setHideFillers] = useState(false)
  const [watchHistory, setWatchHistory] = useState([])
  const [episodeRatings, setEpisodeRatings] = useState({})
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  const { data: anime, isLoading } = useAnimeDetails(id)
  const isMovieFormat = anime?.format === 'MOVIE'
  const episodeFallbackThumbnail = isMovieFormat
    ? anime?.bannerImage || anime?.coverImage?.large || anime?.coverImage?.medium || ''
    : anime?.coverImage?.large || anime?.coverImage?.medium || anime?.bannerImage || ''
  const episodeFallbackTitle = isMovieFormat
    ? anime?.title?.english || anime?.title?.romaji || anime?.title?.userPreferred || ''
    : ''
  const episodeFallbackRef = React.useRef({ thumbnail: '', title: '', isMovie: false })
  episodeFallbackRef.current = {
    thumbnail: episodeFallbackThumbnail,
    title: episodeFallbackTitle,
    isMovie: isMovieFormat,
  }
  const similarList = useStreamable(filterAdult((anime?.recommendations?.nodes || [])
    .map((entry) => entry?.mediaRecommendation)
    .filter(Boolean), nsfwEnabled))
  const isBookmarked = bookmarks.some(b => b.id === parseInt(id))

  // Bookmarks live in Supabase when signed in (cloud source of truth);
  // localStorage only mirrors them. On login, push any guest-only local
  // bookmarks up to the cloud once, then load cloud data as truth.
  React.useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase.from('bookmarks').select('anime_id,title,image').eq('user_id', user.id)
      .then(async ({ data }) => {
        if (cancelled) return
        const mapped = (data || []).map(b => ({ id: b.anime_id, title: b.title, image: b.image }))
        const cloudIds = new Set(mapped.map(m => m.id))
        let local = []
        try {
          local = JSON.parse(localStorage.getItem('aniraku-bookmarks') || '[]')
        } catch {}
        const localOnly = local.filter(l => !cloudIds.has(l.id))
        if (localOnly.length) {
          await supabase.from('bookmarks').upsert(localOnly.map(l => ({
            user_id: user.id,
            anime_id: l.id,
            title: l.title || '',
            image: l.image || '',
            added_at: Date.now(),
          })), { onConflict: 'user_id,anime_id' })
        }
        if (cancelled) return
        setBookmarks([...mapped, ...localOnly])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user, setBookmarks])

  React.useEffect(() => {
    if (!anime) return undefined
    const title = anime.title?.english || anime.title?.romaji || anime.title?.userPreferred || 'Unknown Anime'
    const canonicalPath = `/anime/${generateSlug(title)}-${anime.id}`
    setAnimeDetailSEO(anime)
    if (window.location.pathname !== canonicalPath) {
      navigate(canonicalPath, { replace: true })
    }
    return undefined
  }, [anime, navigate])

  React.useEffect(() => subscribeToWatchHistory((detail) => {
    if (detail.type === 'clear') {
      setWatchHistory([])
      return
    }
    if (detail.type === 'remove' && detail.keys?.length) {
      const removed = new Set(detail.keys)
      setWatchHistory((prev) => prev.filter((row) => !removed.has(historyEntryKey({ animeId: id, episode: row.episode }))))
    }
  }), [id])

  React.useEffect(() => {
    if (!id) return undefined
    let cancelled = false
    let localRows = []
    try {
      localRows = JSON.parse(localStorage.getItem('aniraku-watch-history') || '[]')
        .filter((row) => String(row.animeId ?? row.anime_id) === String(id))
    } catch {}

    const loadHistory = async () => {
      let cloudRows = []
      if (user) {
        try {
          const { data } = await supabase
            .from('watch_history')
            .select('episode_number, progress, duration, timestamp')
            .eq('user_id', user.id)
            .eq('anime_id', parseInt(id, 10))
          cloudRows = data || []
        } catch {}
      }
      if (!cancelled) setWatchHistory(mergeActivityRows([...localRows, ...cloudRows]))
    }

    loadHistory()
    return () => { cancelled = true }
  }, [id, user])

  React.useEffect(() => {
    if (!id) return undefined
    let cancelled = false
    setEpisodeRatings({})
    if (user) {
      fetchEpisodeRatings(id).then((ratings) => {
        if (!cancelled) setEpisodeRatings(ratings || {})
      })
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem(`${EPISODE_RATINGS_LS_KEY}-${id}`) || '{}')
        if (!cancelled) setEpisodeRatings(stored || {})
      } catch {
        if (!cancelled) setEpisodeRatings({})
      }
    }
    return () => { cancelled = true }
  }, [id, user])

  React.useEffect(() => {
    // Relations accept the route ID directly. Start alongside metadata so a
    // fast response is not delayed behind unrelated detail rendering or SEO.
    if (!id) return undefined
    const controller = new AbortController()
    let cancelled = false

    const loadRelations = async () => {
      setRelations([])
      setRelationsLoading(true)
      try {
        const response = await fetch(`${MIRURO_RELATIONS_BASE}/${encodeURIComponent(id)}/relations`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`Miruro relations API returned ${response.status}`)
        const payload = await response.json()
        const directRelations = (Array.isArray(payload?.relations) ? payload.relations : [])
          .filter((entry) => entry?.node?.id && entry.node.type === 'ANIME' && ['SEQUEL', 'PREQUEL', 'SPIN_OFF', 'SIDE_STORY', 'ADAPTATION'].includes(entry.relationType))
          .map((entry) => ({ ...entry.node, relationType: entry.relationType }))
        if (!cancelled) setRelations(directRelations)
      } catch (error) {
        if (error?.name === 'AbortError' || cancelled) return
        setRelations([])
      } finally {
        if (!cancelled) setRelationsLoading(false)
      }
    }

    loadRelations()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [id])

  React.useEffect(() => {
    // Episode availability accepts the route ID directly. Resolve it in
    // parallel with metadata so it is ready when the hero leaves its skeleton.
    if (!id) return undefined
    const controller = new AbortController()
    let cancelled = false
    let retryTimer = null
    let retryAttempt = 0

    setEpisodes([])
    setEpisodesLoading(true)

    const scheduleRetry = () => {
      const delay = Math.min(
        EPISODE_RETRY_BASE_MS * (2 ** Math.min(retryAttempt, 4)),
        EPISODE_RETRY_MAX_MS
      )
      retryAttempt += 1
      retryTimer = window.setTimeout(loadEpisodes, delay)
    }

    const loadEpisodes = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/anime/${encodeURIComponent(id)}/episodes`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`Aniraku episode API returned ${response.status}`)
        const payload = await response.json()
        const sourceEpisodes = Array.isArray(payload) ? payload : payload?.episodes
        if (!Array.isArray(sourceEpisodes)) throw new Error('Aniraku episode API returned an invalid response')
        const directEpisodes = sourceEpisodes.filter(Boolean).map((episode, index) => ({
          ...episode,
          number: index + 1,
          originalNumber: episode.number,
          thumbnail: episode.thumbnail || episode.image || '',
          filler: Boolean(episode.filler ?? episode.isFiller),
          recap: Boolean(episode.recap),
        }))
        if (!directEpisodes.length) throw new Error('Aniraku episode API returned no episodes')
        // Preserve canonical availability data and request exact TMDB display
        // metadata in bounded batches. This ref avoids serializing episode
        // availability behind general metadata while retaining source artwork
        // and the verified movie-title fallback.
        const fallback = episodeFallbackRef.current
        const verifiedEpisodes = await enrichEpisodesWithTmdb(id, directEpisodes, {
          signal: controller.signal,
          fallbackThumbnail: fallback.thumbnail,
          fallbackTitle: fallback.title,
          isMovie: fallback.isMovie,
        })
        if (!cancelled) {
          retryAttempt = 0
          setEpisodes(verifiedEpisodes)
          setEpisodesLoading(false)
        }
      } catch (error) {
        if (error?.name === 'AbortError' || cancelled) return
        scheduleRetry()
      }
    }

    loadEpisodes()
    setActiveTab('episodes')
    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
      controller.abort()
    }
  }, [id])

  const toggleBookmark = () => {
    const numericId = parseInt(id)
    if (isBookmarked) {
      setBookmarks(bookmarks.filter(b => b.id !== numericId))
      if (user) {
        supabase.from('bookmarks').delete().eq('user_id', user.id).eq('anime_id', numericId).then()
      }
    } else if (anime) {
      setBookmarks([...bookmarks, {
        id: numericId,
        title: anime.title?.english || anime.title?.romaji || 'Unknown',
        image: anime.coverImage?.large || '',
      }])
      if (user) {
        supabase.from('bookmarks').upsert({
          user_id: user.id,
          anime_id: numericId,
          title: anime.title?.english || anime.title?.romaji || 'Unknown',
          image: anime.coverImage?.large || '',
          added_at: Date.now(),
        }, { onConflict: 'user_id,anime_id' }).then()
      }
    }
  }

  if (isLoading) return <AnimeDetailSkeleton />

  if (!anime) return (
    <>
      <Center>
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <p style={{ fontSize: 18, marginBottom: 12, color: 'var(--text-muted)' }}>Anime not found</p>
          <Link to="/" style={{ color: 'var(--accent)', fontSize: 14 }}>Back to Home</Link>
        </div>
      </Center>
    </>
  )

  if (isNsfw(anime) && !nsfwEnabled) return (
    <>
      <Center>
        <NsfwCard>
          <div style={{ fontSize: 48, marginBottom: 16 }}>18+</div>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
            Mature Content
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            This title contains adult content. Enable NSFW content in your settings to view it.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <NsfwBtn as={Link} to="/profile/settings">Open Settings</NsfwBtn>
            <OutlineLink to="/">Go Back</OutlineLink>
          </div>
        </NsfwCard>
      </Center>
    </>
  )

  const title = anime.title?.english || anime.title?.romaji || 'Unknown'
  const fullDescription = (anime.description || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const descriptionIsLong = fullDescription.length > 500
  const desc = descriptionExpanded || !descriptionIsLong ? fullDescription : `${fullDescription.slice(0, 500).trimEnd()}…`
  const isMovie = anime.format === 'MOVIE'
  const hasEpisodes = episodes.length > 0
  const hasRelations = relations.length > 0
  const activityByEpisode = new Map(watchHistory.map((row) => [row.episode, row]))
  const watchedEpisodes = new Set(watchHistory.map((row) => row.episode))
  const completedEpisodes = new Set(
    watchHistory.filter((row) => row.completed).map((row) => row.episode)
  )
  const hasProgress = watchHistory.some((row) => row.time > 0)
  const hasWatchActivity = hasProgress || watchedEpisodes.size > 0
  const expectedEpisodeCount = isMovie ? 1 : Number(anime.episodes) || episodes.length
  const nextUnwatched = episodes.find((ep) => !watchedEpisodes.has(Number(ep.number)))
  const highestWatched = Math.max(0, ...[...watchedEpisodes].map(Number))
  const highestCompleted = Math.max(0, ...[...completedEpisodes].map(Number))
  const latestPartial = Math.max(
    0,
    ...watchHistory.filter((row) => !row.completed && row.time > 0).map((row) => row.episode)
  )
  const firstEpisodeNumber = nextUnwatched?.number || 1
  const nextEpisodeNumber = highestCompleted > 0
    ? highestCompleted + 1
    : (highestWatched > 0 ? highestWatched + 1 : firstEpisodeNumber)
  const resumeEpisode = latestPartial > highestCompleted ? latestPartial : nextEpisodeNumber
  const partialEpisode = watchHistory.find((row) => row.episode === resumeEpisode && !row.completed && row.time > 0)
  const allEpisodesComplete = hasEpisodes && episodes.length >= expectedEpisodeCount && episodes.every((ep) => completedEpisodes.has(Number(ep.number)))
  const actionMode = allEpisodesComplete ? 'rewatch' : hasWatchActivity ? 'continue' : 'watch'
  const actionEpisode = actionMode === 'continue'
    ? resumeEpisode
    : actionMode === 'rewatch'
      ? 1
      : firstEpisodeNumber
  const actionLabel = actionMode === 'rewatch'
    ? 'Rewatch'
    : actionMode === 'continue'
      ? `Continue Episode ${actionEpisode}`
      : 'Watch Now'
  const actionHint = actionMode === 'rewatch'
    ? 'You completed this title. Start again from Episode 1.'
    : actionMode === 'continue'
      ? `Resume from Episode ${actionEpisode}${partialEpisode?.time ? ` at ${Math.floor(partialEpisode.time / 60)}:${String(Math.floor(partialEpisode.time % 60)).padStart(2, '0')}` : ''}.`
      : ''
  const hiddenEpCount = episodes.filter(ep => ep.filler || ep.recap).length
  const visibleEps = hideFillers
    ? episodes.filter(ep => !ep.filler && !ep.recap)
    : episodes
  const tabs = []
  if (hasEpisodes || episodesLoading) {
    tabs.push({
      key: 'episodes',
      label: isMovie
        ? 'Movie'
        : `Episodes (${visibleEps.length}${hideFillers ? ` of ${episodes.length}` : ''})`,
    })
  }
  if (hasRelations || relationsLoading) tabs.push({ key: 'relations', label: 'Relations' })

  return (
    <Page className="anime-detail-page">
      <PageBackground $src={anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large || ''} />
      <main style={{ position: 'relative', zIndex: 1 }}>
      <Banner>
        <BannerImg src={anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large || ''} alt="" />
        <BannerOverlay />
        <BannerContent>
          <Cover src={anime.coverImage?.large || ''} alt={title} />
          <Info>
            <Title>{title}</Title>
            <Meta>
              {!!anime.averageScore && <Score><FaStar /> {anime.averageScore}%</Score>}
              {!!anime.format && <span>{anime.format}</span>}
              {!isMovie && !!anime.episodes && <span>{anime.episodes} episodes</span>}
              {!!anime.status && <span>{anime.status}</span>}
            </Meta>
            <Actions>
              {hasEpisodes && (
                <WatchBtn to={`/watch/${generateSlug(title)}-${id}-episode-${actionEpisode}`}>
                  <FaPlay /> {actionLabel}
                </WatchBtn>
              )}
              <BookmarkBtn $active={isBookmarked} onClick={toggleBookmark}>
                {isBookmarked ? <FaBookmark /> : <FaRegBookmark />} {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </BookmarkBtn>
              {actionHint && <ProgressHint>{actionHint}</ProgressHint>}
            </Actions>
          </Info>
        </BannerContent>
      </Banner>

      <Content>
        {desc && (
          <Section>
            <SectionTitle>Synopsis</SectionTitle>
            <Desc id="synopsis-content">{desc}</Desc>
            {descriptionIsLong && (
              <button
                type="button"
                aria-expanded={descriptionExpanded}
                aria-controls="synopsis-content"
                onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                style={{
                  marginTop: 10,
                  padding: 0,
                  border: 0,
                  background: 'transparent',
                  color: 'var(--accent)',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                {descriptionExpanded ? 'Show less' : 'Read full synopsis'}
              </button>
            )}
          </Section>
        )}

        {anime.genres?.length > 0 && (
          <Section>
            <GenreRow>
              {anime.genres.map(g => (
                <GenreTag key={g} to={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</GenreTag>
              ))}
            </GenreRow>
          </Section>
        )}

        {tabs.length > 0 && (
          <Section>
            <Tabs>
              {tabs.map(t => (
                <Tab key={t.key} $active={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
                  {t.label}
                </Tab>
              ))}
            </Tabs>

            {activeTab === 'episodes' && (
              <>
                {hasEpisodes && hiddenEpCount > 0 && (
                  <FilterBtn $active={hideFillers} onClick={() => setHideFillers(p => !p)}>
                    {hideFillers ? '✓ Showing canon only' : 'Hide filler & recap'}
                  </FilterBtn>
                )}
                {hasEpisodes && <EpisodeList>
                  {visibleEps.map((ep) => {
                    const num = Number(ep.number)
                    const activity = activityByEpisode.get(num)
                    const rated = Number(episodeRatings[num]) || 0
                    const progress = activity
                      ? activity.duration > 0
                        ? Math.min(100, (activity.time / activity.duration) * 100)
                        : activity.completed ? 100 : 0
                      : 0
                    return (
                      <EpisodeRow
                        key={num}
                        to={`/watch/${generateSlug(title)}-${id}-episode-${num}`}
                        data-watched={activity ? 'true' : 'false'}
                      >
                        <EpThumb src={ep.thumbnail || ''} alt="" loading="lazy" />
                        <EpNum>{num}</EpNum>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ep.title || 'Untitled episode'}
                        </span>
                        {!!ep.filler && <EpBadge $type="filler">FILLER</EpBadge>}
                        {!!ep.recap && <EpBadge $type="recap">RECAP</EpBadge>}
                        {actionMode === 'continue' && num === actionEpisode && <EpisodeState title="Recommended continuation">Up next</EpisodeState>}
                        {activity && <EpisodeState title={activity.completed ? 'Completed' : 'In progress'}><FaCheck size={9} /> {activity.completed ? 'Watched' : 'In progress'}</EpisodeState>}
                        {rated > 0 && <RatingBadge title={`You rated this episode ${rated}/10`}><FaStar size={8} /> {rated}/10</RatingBadge>}
                        <FaPlay size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        {activity && <EpisodeProgress $value={progress} $complete={activity.completed}><span /></EpisodeProgress>}
                      </EpisodeRow>
                    )
                  })}
                </EpisodeList>}
                {hasEpisodes && visibleEps.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>
                    No canon episodes listed. Switch back to see all episodes.
                  </p>
                )}
              </>
            )}

            {activeTab === 'relations' && (relationsLoading ? (
              <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }} role="status">Loading related anime…</div>
            ) : hasRelations ? (
              <Grid>
                {relations.map(r => <RelationCard key={r.id} r={{ node: r, relationType: r.relationType || '' }} />)}
              </Grid>
            ) : null)}
          </Section>
        )}

        <Section>
          <Comments animeId={anime.id} />
        </Section>

        {similarList?.length > 0 && (
          <Section>
            <SectionTitle>Similar Anime</SectionTitle>
            <Grid>
              {similarList.map(item => <RecCard key={item.id} item={item} />)}
            </Grid>
          </Section>
        )}
      </Content>
      </main>
      <Footer />
    </Page>
  )
}

export default AnimeDetail
