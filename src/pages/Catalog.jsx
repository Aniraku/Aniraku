import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { anilistQuery, BROWSE_QUERY, CATALOG_SHELVES_QUERY } from '../lib/anilist'
import { filterAdult, useNsfw } from '../hooks/useNsfw'
import Footer from '../components/Footer/Footer'
import { setCatalogSEO } from '../lib/seo'
import { generateSlug } from '../lib/slug'
import {
  FaSearch, FaSortAmountDown, FaLayerGroup, FaCheckCircle,
  FaCalendarDay, FaTimes, FaChevronDown, FaSlidersH,
  FaSyncAlt, FaPlay, FaInfoCircle, FaChevronLeft, FaChevronRight,
  FaFire, FaStar, FaTv, FaCompass,
} from 'react-icons/fa'
import { AnimeCardSkeleton } from '../components/Skeletons/Skeletons'
import styled, { keyframes } from 'styled-components'
import { artworkVars, posterSources } from '../lib/artwork'

const PER_PAGE = 24
const SEARCH_DEBOUNCE_MS = 500
const CURRENT_YEAR = new Date().getFullYear()

const fmt = (value = '') => value.replace(/_/g, ' ')
const titleOf = (anime) => anime?.title?.english || anime?.title?.romaji || anime?.title?.userPreferred || 'Unknown title'
const imageOf = (anime) => posterSources(anime)[0]
const detailHref = (anime) => `/anime/${generateSlug(titleOf(anime))}-${anime.id}`
const cleanDescription = (value = '') => value
  .replace(/<[^>]*>/g, ' ')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim()

const SORT_OPTIONS = [
  { value: 'POPULARITY_DESC', label: 'Most popular', icon: FaSortAmountDown },
  { value: 'SCORE_DESC', label: 'Top rated', icon: FaCheckCircle },
  { value: 'START_DATE_DESC', label: 'Newest releases', icon: FaCalendarDay },
  { value: 'TITLE_ROMAJI', label: 'A–Z', icon: FaLayerGroup },
]

const FORMAT_OPTIONS = [
  { value: '', label: 'All formats' },
  { value: 'TV', label: 'TV series' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'SPECIAL', label: 'Specials' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'RELEASING', label: 'Airing now' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
]

const GENRE_OPTIONS = [
  { value: '', label: 'All genres' },
  ...[
    'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
    'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
    'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  ].map((genre) => ({ value: genre, label: genre })),
]

const YEAR_OPTIONS = [
  { value: '', label: 'Any year' },
  ...Array.from({ length: 30 }, (_, index) => {
    const year = CURRENT_YEAR - index
    return { value: String(year), label: String(year) }
  }),
]

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`

const pulse = keyframes`
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
`

const PageWrapper = styled.div`
  min-height: 100vh;
  overflow: clip;
  background: var(--bg);
  color: var(--text-primary);
`

const Container = styled.div`
  width: min(100%, 1600px);
  margin: 0 auto;
  padding: 0 var(--content-pad);
`

const Hero = styled.section`
  position: relative;
  isolation: isolate;
  min-height: clamp(470px, 64vw, 690px);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: var(--bg-secondary);

  @media (max-width: 640px) { min-height: clamp(430px, 126vw, 520px); }
`

const HeroBackdrop = styled.div`
  position: absolute;
  inset: 0;
  z-index: -2;
  background-position: center 24%;
  background-size: cover;
  filter: saturate(0.92) contrast(1.04);
  transform: scale(1.02);
  transition: background-image 260ms ease-out;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(7,7,8,0.98) 0%, rgba(7,7,8,0.83) 34%, rgba(7,7,8,0.16) 72%, rgba(7,7,8,0.48) 100%),
      linear-gradient(0deg, #070708 0%, rgba(7,7,8,0.1) 48%, rgba(7,7,8,0.44) 100%);
  }

  @media (max-width: 720px) {
    background-position: 62% center;
    &::after {
      background:
        linear-gradient(90deg, rgba(7,7,8,0.96) 0%, rgba(7,7,8,0.52) 100%),
        linear-gradient(0deg, #070708 0%, rgba(7,7,8,0.1) 60%, rgba(7,7,8,0.38) 100%);
    }
  }
`

const HeroFallback = styled.div`
  position: absolute;
  inset: 0;
  z-index: -3;
  background:
    radial-gradient(circle at 76% 22%, rgba(139,92,246,0.24), transparent 28%),
    radial-gradient(circle at 42% 80%, var(--accent-glow), transparent 35%),
    linear-gradient(120deg, var(--bg-elevated) 0%, var(--bg) 55%, #101019 100%);
`

const HeroContent = styled.div`
  width: min(100%, 780px);
  padding: clamp(126px, 16vw, 190px) 0 clamp(54px, 7vw, 96px);
  animation: ${fadeUp} 460ms cubic-bezier(0.23, 1, 0.32, 1) both;
`

const HeroKicker = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  color: var(--text-primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;

  svg { color: var(--accent); }
`

const HeroTitle = styled.h1`
  max-width: 16ch;
  margin: 0 0 14px;
  color: var(--text-primary);
  font-size: clamp(40px, 6vw, 76px);
  font-weight: 850;
  line-height: 0.98;
  letter-spacing: -0.055em;
  text-wrap: balance;
`

const HeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 650;

  .score { color: var(--success); }
  .rating { padding: 2px 6px; border: 1px solid var(--border-hover); font-size: 11px; }
  .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text-muted); }
`

const HeroDescription = styled.p`
  display: -webkit-box;
  max-width: 62ch;
  margin: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: clamp(14px, 1.5vw, 16px);
  line-height: 1.58;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
`

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
`

const HeroAction = styled(Link)`
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 20px;
  border-radius: 7px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 800;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms ease, border-color 160ms ease;

  &:active { transform: scale(0.97); }

  &.primary { background: var(--accent); color: var(--bg); }
  &.primary:hover { background: var(--accent-dim); }
  &.secondary { border: 1px solid var(--border-hover); background: var(--bg-elevated); color: var(--text-primary); }
  &.secondary:hover { background: var(--bg-card); border-color: var(--text-muted); }

  @media (max-width: 480px) { width: 100%; }
`

const DiscoverBar = styled.section`
  position: relative;
  z-index: 2;
  margin-top: -24px;
`

const QuickBrowse = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 2px 0;

  > span {
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`

const QuickBrowseButton = styled.button`
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--bg-card);
  color: var(--text-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, color 160ms ease;
  &:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 11%, var(--bg-card)); color: var(--text-primary); }
  &:active { transform: scale(0.97); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  @media (max-width: 480px) { flex: 1 1 calc(50% - 6px); }
`

const DiscoverInner = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  box-shadow: 0 16px 44px rgba(0,0,0,0.24);
  backdrop-filter: blur(18px);

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 9px;
  }
`

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 46px;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: var(--bg-card);
  transition: border-color 160ms ease, background 160ms ease;

  &:focus-within { border-color: var(--accent); background: var(--bg-elevated); }
  svg { flex: 0 0 auto; color: rgba(255,255,255,0.64); }

  input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text-primary);
    font: inherit;
    font-size: 14px;
    &::placeholder { color: var(--text-muted); }
  }
`

const SearchHint = styled.kbd`
  flex: 0 0 auto;
  padding: 3px 6px;
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 4px;
  color: rgba(255,255,255,0.52);
  background: rgba(0,0,0,0.16);
  font-size: 10px;
  font-family: inherit;

  @media (max-width: 520px) { display: none; }
`

const SearchClear = styled.button`
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  &:hover { background: var(--bg-elevated); color: var(--text-primary); }
`

const FilterToggle = styled.button`
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 15px;
  border: 1px solid ${({ $open }) => ($open ? 'var(--accent)' : 'var(--border)')};
  border-radius: 9px;
  background: ${({ $open }) => ($open ? 'var(--accent)' : 'var(--bg-card)')};
  color: ${({ $open }) => ($open ? 'var(--bg)' : 'var(--text-primary)')};
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms ease;
  &:active { transform: scale(0.97); }
  &:hover { background: ${({ $open }) => ($open ? 'var(--accent-dim)' : 'var(--bg-elevated)')}; }

  @media (max-width: 680px) { width: 100%; }
`

const FilterCount = styled.span`
  display: inline-grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 999px;
  background: ${({ $open }) => ($open ? 'var(--bg)' : 'var(--accent)')};
  color: ${({ $open }) => ($open ? 'var(--accent)' : 'var(--bg)')};
  font-size: 11px;
  font-weight: 850;
`

const AppliedFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 2px 0;
`

const AppliedFiltersLabel = styled.span`
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const AppliedFilter = styled.button`
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--accent) 46%, var(--border));
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--accent) 11%, var(--bg-card));
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  &:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 17%, var(--bg-card)); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
`

const FilterPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) auto;
  gap: 10px;
  margin-top: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-elevated);
  box-shadow: 0 16px 40px rgba(0,0,0,0.24);
  animation: ${fadeUp} 180ms cubic-bezier(0.23, 1, 0.32, 1) both;

  @media (max-width: 1020px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 10px;
  }
`

const SelectWrapper = styled.label`
  position: relative;
  display: block;
  min-width: 0;

  > span {
    position: absolute;
    top: 8px;
    left: 11px;
    z-index: 1;
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 750;
    pointer-events: none;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  select {
    width: 100%;
    min-height: 48px;
    padding: 20px 29px 6px 11px;
    appearance: none;
    border: 1px solid var(--border);
    border-radius: 8px;
    outline: 0;
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    &:focus { border-color: var(--accent); }
    option { color: var(--text-primary); background: var(--bg-elevated); }
  }

  svg { position: absolute; right: 10px; bottom: 11px; pointer-events: none; color: rgba(255,255,255,0.55); }
`

const ClearAllButton = styled.button`
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  &:hover { border-color: var(--border-hover); color: var(--text-primary); }
  @media (max-width: 640px) { grid-column: span 2; }
`

const Main = styled.main`
  padding: clamp(28px, 4vw, 48px) 0 calc(76px + env(safe-area-inset-bottom));
`

const ShelfSection = styled.section`
  position: relative;
  margin-bottom: clamp(34px, 5vw, 64px);
`

const ShelfHeader = styled.div`
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 13px;

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 10px;
  }
`

const ShelfHeading = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;

  svg { flex: 0 0 auto; color: var(--accent); }

  h2 {
    margin: 0;
    overflow: hidden;
    color: var(--text-primary);
    font-size: clamp(18px, 2vw, 24px);
    font-weight: 800;
    letter-spacing: -0.025em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p { margin: 2px 0 0; color: var(--text-secondary); font-size: 12px; }

  @media (max-width: 560px) {
    align-items: flex-start;
    h2 { white-space: normal; }
    p { line-height: 1.4; }
  }
`

const ShelfTools = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
`

const ViewAllLink = styled(Link)`
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
  &:hover { color: var(--text-primary); }
  @media (max-width: 720px) { display: none; }
`

const RailButton = styled.button`
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms ease;
  &:hover { background: var(--bg-elevated); border-color: var(--border-hover); }
  &:active { transform: scale(0.94); }
  @media (hover: none), (max-width: 720px) { display: none; }
`

const Rail = styled.div`
  display: flex;
  gap: clamp(10px, 1.25vw, 16px);
  overflow-x: auto;
  overflow-y: visible;
  padding: 6px 4px 18px;
  margin: 0 -4px -18px;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`

const RailCard = styled(Link)`
  display: block;
  width: clamp(138px, 13.5vw, 202px);
  flex: 0 0 auto;
  min-width: 0;
  color: var(--text-primary);
  text-decoration: none;
  scroll-snap-align: start;
  outline: none;

  &:focus-visible .poster { outline: 3px solid var(--accent); outline-offset: 3px; }
  &:hover .poster { transform: scale(1.055); box-shadow: 0 16px 34px rgba(0,0,0,0.48); }
  &:active .poster { transform: scale(0.98); }

  @media (hover: none) {
    &:active .poster { transform: scale(0.975); }
  }

  @media (max-width: 520px) { width: clamp(128px, 40vw, 158px); }
`

const Poster = styled.div`
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--art-tone, var(--accent)) 30%, var(--border));
  background: var(--bg-card);
  box-shadow: 0 8px 20px rgba(0,0,0,0.32);
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms ease;

  img { width: 100%; height: 100%; object-fit: cover; display: block; }

  &::after {
    content: '';
    position: absolute;
    inset: 40% 0 0;
    pointer-events: none;
    background: linear-gradient(to top, rgba(0,0,0,0.82), transparent);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(145deg, color-mix(in srgb, var(--art-tone, var(--accent)) 26%, transparent), transparent 48%);
  }
`

const PosterFallback = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--text-muted);
  background: linear-gradient(135deg, var(--bg-elevated), var(--bg-secondary));
`

const PosterArtwork = memo(function PosterArtwork({ anime, title }) {
  const sources = posterSources(anime)
  const [sourceIndex, setSourceIndex] = useState(0)
  const source = sources[sourceIndex]

  if (!source) return <PosterFallback aria-label={`${title} poster unavailable`}>No poster</PosterFallback>

  return (
    <img
      src={source}
      alt={title}
      loading="lazy"
      onError={() => setSourceIndex((current) => current + 1)}
    />
  )
})

const PosterMeta = styled.div`
  position: absolute;
  z-index: 1;
  right: 8px;
  bottom: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  color: rgba(255,255,255,0.9);
  font-size: 10px;
  font-weight: 750;

  .score { color: var(--success); }
  .play { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 50%; background: var(--accent); color: var(--bg); }
`

const RailCardInfo = styled.div`
  padding: 9px 2px 0;

  h3 {
    display: -webkit-box;
    min-height: 34px;
    margin: 0;
    overflow: hidden;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  p { margin: 4px 0 0; color: var(--text-secondary); font-size: 11px; font-weight: 600; }
`

const BrowseHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;

  h2 { margin: 0; color: var(--text-primary); font-size: clamp(24px, 3vw, 34px); font-weight: 830; letter-spacing: -0.04em; }
  p { margin: 7px 0 0; color: var(--text-secondary); font-size: 13px; }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    p { line-height: 1.45; }
  }
`

const ResultCount = styled.div`
  flex: 0 0 auto;
  padding: 8px 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-secondary);
  background: var(--bg-card);
  font-size: 12px;
  font-weight: 700;

  @media (max-width: 560px) { align-self: flex-start; }
`

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(16px, 2vw, 28px) clamp(12px, 1.35vw, 20px);
  animation: ${fadeUp} 240ms cubic-bezier(0.23, 1, 0.32, 1) both;

  @media (max-width: 1180px) { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  @media (max-width: 900px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 640px) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 12px; }
`

const GridCard = styled(Link)`
  display: block;
  min-width: 0;
  color: var(--text-primary);
  text-decoration: none;
  outline: none;
  &:focus-visible .poster { outline: 3px solid var(--accent); outline-offset: 3px; }
  &:hover .poster { transform: translateY(-5px); box-shadow: 0 17px 34px rgba(0,0,0,0.48); }
  &:active .poster { transform: scale(0.975); }
`

const GridPoster = styled(Poster)`
  border-radius: 7px;
`

const GridInfo = styled.div`
  padding: 10px 2px 0;
  h3 { display: -webkit-box; min-height: 34px; margin: 0; overflow: hidden; color: var(--text-primary); font-size: 13px; font-weight: 720; line-height: 1.3; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  p { margin: 5px 0 0; color: var(--text-secondary); font-size: 11px; font-weight: 600; }
`

const LoadingTrigger = styled.div`
  display: flex;
  min-height: 102px;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 13px;
`

const EmptyState = styled.div`
  padding: 88px 20px;
  text-align: center;
  h2 { margin: 0 0 10px; color: var(--text-primary); font-size: 24px; }
  p { margin: 0 0 22px; color: var(--text-secondary); }
`

const ResetButton = styled.button`
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 7px;
  background: var(--accent);
  color: var(--bg);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  &:hover { background: var(--accent-dim); }
  &:active { transform: scale(0.97); }
`

const RailSkeleton = styled.div`
  display: flex;
  gap: 14px;
  overflow: hidden;
  > div { width: clamp(138px, 13.5vw, 202px); flex: 0 0 auto; }
  .card-skeleton { width: 100%; }
`

const Spinner = styled(FaSyncAlt)`
  animation: ${pulse} 1s ease-in-out infinite;
`

function FilterSelect({ label, options, value, onChange }) {
  return (
    <SelectWrapper>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <FaChevronDown size={10} />
    </SelectWrapper>
  )
}

const CatalogRailCard = memo(function CatalogRailCard({ anime }) {
  const title = titleOf(anime)
  const meta = [
    anime?.episodes ? `${anime.episodes} eps` : (anime?.format === 'MOVIE' ? 'Movie' : (anime?.status ? fmt(anime.status) : 'Details pending')),
    anime?.seasonYear,
    anime?.format && anime?.format !== 'MOVIE' ? fmt(anime.format) : null,
  ].filter(Boolean).join(' • ')

  return (
    <RailCard to={detailHref(anime)} aria-label={`Open ${title}`} style={artworkVars(anime)}>
      <Poster className="poster">
        <PosterArtwork anime={anime} title={title} />
        <PosterMeta>
          <span className="score">{anime?.averageScore ? `${anime.averageScore}% match` : 'Explore'}</span>
          <span className="play"><FaPlay size={9} /></span>
        </PosterMeta>
      </Poster>
      <RailCardInfo>
        <h3>{title}</h3>
        {meta && <p>{meta}</p>}
      </RailCardInfo>
    </RailCard>
  )
})

const CatalogGridCard = memo(function CatalogGridCard({ anime }) {
  const title = titleOf(anime)
  const meta = [
    anime?.episodes ? `${anime.episodes} eps` : (anime?.format === 'MOVIE' ? 'Movie' : (anime?.status ? fmt(anime.status) : 'Details pending')),
    anime?.seasonYear,
    anime?.format && anime?.format !== 'MOVIE' ? fmt(anime.format) : null,
  ].filter(Boolean).join(' • ')

  return (
    <GridCard to={detailHref(anime)} aria-label={`Open ${title}`} style={artworkVars(anime)}>
      <GridPoster className="poster">
        <PosterArtwork anime={anime} title={title} />
        <PosterMeta>
          <span className="score">{anime?.averageScore ? `${anime.averageScore}% match` : 'Explore'}</span>
          <span className="play"><FaPlay size={9} /></span>
        </PosterMeta>
      </GridPoster>
      <GridInfo>
        <h3>{title}</h3>
        {meta && <p>{meta}</p>}
      </GridInfo>
    </GridCard>
  )
})

function Shelf({ title, description, icon: Icon, items, to }) {
  const railRef = useRef(null)
  const scrollRail = (direction) => {
    railRef.current?.scrollBy({ left: railRef.current.clientWidth * 0.82 * direction, behavior: 'smooth' })
  }

  if (!items?.length) return null

  return (
    <ShelfSection>
      <ShelfHeader>
        <ShelfHeading>
          <Icon size={17} />
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
        </ShelfHeading>
        <ShelfTools>
          <ViewAllLink to={to}>View all</ViewAllLink>
          <RailButton type="button" aria-label={`Scroll ${title} left`} onClick={() => scrollRail(-1)}><FaChevronLeft size={12} /></RailButton>
          <RailButton type="button" aria-label={`Scroll ${title} right`} onClick={() => scrollRail(1)}><FaChevronRight size={12} /></RailButton>
        </ShelfTools>
      </ShelfHeader>
      <Rail ref={railRef} aria-label={`${title} titles`}>
        {items.map((anime) => <CatalogRailCard key={anime.id} anime={anime} />)}
      </Rail>
    </ShelfSection>
  )
}

function ShelfLoading({ title, icon: Icon }) {
  return (
    <ShelfSection aria-busy="true" aria-label={`Loading ${title}`}>
      <ShelfHeader>
        <ShelfHeading><Icon size={17} /><div><h2>{title}</h2><p>Loading titles…</p></div></ShelfHeading>
      </ShelfHeader>
      <RailSkeleton>
        {Array.from({ length: 7 }).map((_, index) => <AnimeCardSkeleton key={index} />)}
      </RailSkeleton>
    </ShelfSection>
  )
}

export default function Catalog() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)
  const searchRef = useRef(null)
  const observerRef = useRef(null)
  const didMount = useRef(false)

  const filters = useMemo(() => ({
    genre: searchParams.get('genre') || '',
    format: searchParams.get('format') || '',
    status: searchParams.get('status') || '',
    year: searchParams.get('year') || '',
    sort: searchParams.get('sort') || 'POPULARITY_DESC',
    view: searchParams.get('view') || '',
    search: debouncedSearch,
  }), [searchParams, debouncedSearch])

  const isBrowseMode = Boolean(
    filters.search || filters.format || filters.status || filters.genre || filters.year ||
    filters.sort !== 'POPULARITY_DESC' || filters.view === 'all'
  )

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['catalog-infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const variables = { page: pageParam, perPage: PER_PAGE, sort: [filters.sort || 'POPULARITY_DESC'] }
      if (filters.search) variables.search = filters.search
      if (filters.genre) variables.genre = filters.genre
      if (filters.format) variables.format = filters.format
      if (filters.status) variables.status = filters.status
      if (filters.year) variables.year = Number.parseInt(filters.year, 10)
      const response = await anilistQuery(BROWSE_QUERY, variables)
      return { media: response.data.Page.media, pageInfo: response.data.Page.pageInfo }
    },
    getNextPageParam: (lastPage) => (lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.currentPage + 1 : undefined),
    staleTime: 300000,
  })

  const { data: shelfData, isLoading: shelvesLoading, isError: shelvesError, refetch: refetchShelves } = useQuery({
    queryKey: ['catalog-shelves'],
    queryFn: async () => {
      const response = await anilistQuery(CATALOG_SHELVES_QUERY)
      return response.data
    },
    staleTime: 300000,
  })

  const { nsfwEnabled } = useNsfw()

  const allMedia = useMemo(() => {
    if (!data) return []
    return filterAdult(data.pages.flatMap((page) => page.media), nsfwEnabled)
  }, [data, nsfwEnabled])

  const shelves = useMemo(() => {
    const getShelf = (name) => filterAdult(shelfData?.[name]?.media || [], nsfwEnabled)
    return {
      trending: getShelf('trending'),
      airing: getShelf('airing'),
      popular: getShelf('popular'),
      movies: getShelf('movies'),
      topRated: getShelf('topRated'),
    }
  }, [shelfData, nsfwEnabled])

  const underratedPopular = useMemo(() => {
    const byId = new Map()
    ;[...shelves.topRated, ...shelves.popular, ...shelves.trending].forEach((anime) => {
      if (anime?.id && !byId.has(anime.id)) byId.set(anime.id, anime)
    })
    return [...byId.values()]
      .filter((anime) => Number(anime.averageScore) >= 75)
      .sort((left, right) => (Number(right.averageScore) || 0) - (Number(left.averageScore) || 0))
      .slice(0, 14)
  }, [shelves])

  const featuredPool = useMemo(() => {
    const unique = new Map()
    ;[...shelves.popular, ...shelves.topRated].forEach((anime) => {
      if (anime?.id && !unique.has(anime.id)) unique.set(anime.id, anime)
    })
    return [...unique.values()].filter((anime) => posterSources(anime).length > 0).slice(0, 10)
  }, [shelves])
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const featured = isBrowseMode ? allMedia[0] : featuredPool[featuredIndex] || shelves.trending[0] || allMedia[0]
  const totalResults = data?.pages?.[0]?.pageInfo?.total || 0
  const hasActiveFilters = Boolean(filters.search || filters.format || filters.status || filters.genre || filters.year || filters.sort !== 'POPULARITY_DESC' || filters.view)
  const activeFilters = useMemo(() => [
    filters.search && { key: 'search', label: `Search: ${filters.search}` },
    filters.genre && { key: 'genre', label: `Genre: ${filters.genre}` },
    filters.format && { key: 'format', label: `Format: ${FORMAT_OPTIONS.find((option) => option.value === filters.format)?.label || filters.format}` },
    filters.status && { key: 'status', label: `Status: ${STATUS_OPTIONS.find((option) => option.value === filters.status)?.label || fmt(filters.status)}` },
    filters.year && { key: 'year', label: `Year: ${filters.year}` },
    filters.sort !== 'POPULARITY_DESC' && { key: 'sort', label: `Sort: ${SORT_OPTIONS.find((option) => option.value === filters.sort)?.label || fmt(filters.sort)}` },
    filters.view && { key: 'view', label: 'View: Every title' },
  ].filter(Boolean), [filters])
  const activeFilterCount = activeFilters.length

  useEffect(() => {
    setFeaturedIndex((current) => featuredPool.length ? current % featuredPool.length : 0)
  }, [featuredPool.length])

  useEffect(() => {
    if (isBrowseMode || featuredPool.length < 2) return undefined
    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % featuredPool.length)
    }, 7000)
    return () => window.clearInterval(timer)
  }, [featuredPool.length, isBrowseMode])

  useEffect(() => { setCatalogSEO(searchParams) }, [searchParams])

  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    setSearchInput((current) => current === urlSearch ? current : urlSearch)
    setDebouncedSearch((current) => current === urlSearch ? current : urlSearch)
  }, [searchParams])

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return undefined }
    const timer = window.setTimeout(() => {
      const value = searchInput.trim()
      if (value === debouncedSearch) return
      setDebouncedSearch(value)
      const next = new URLSearchParams(searchParams)
      value ? next.set('search', value) : next.delete('search')
      next.delete('view')
      navigate(`/catalog${next.toString() ? `?${next.toString()}` : ''}`, { replace: true })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput, debouncedSearch, searchParams, navigate])

  const setFilter = useCallback((key, value) => {
    const next = new URLSearchParams(searchParams)
    value ? next.set(key, value) : next.delete(key)
    next.delete('view')
    navigate(`/catalog${next.toString() ? `?${next.toString()}` : ''}`)
  }, [navigate, searchParams])

  const clearAll = useCallback(() => {
    setSearchInput('')
    setDebouncedSearch('')
    setShowFilters(false)
    navigate('/catalog')
  }, [navigate])

  const clearSearch = useCallback(() => {
    setSearchInput('')
    setDebouncedSearch('')
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    next.delete('view')
    navigate(`/catalog${next.toString() ? `?${next.toString()}` : ''}`, { replace: true })
  }, [navigate, searchParams])

  const removeFilter = useCallback((key) => {
    if (key === 'search') {
      setSearchInput('')
      setDebouncedSearch('')
    }
    const next = new URLSearchParams(searchParams)
    next.delete(key)
    navigate(`/catalog${next.toString() ? `?${next.toString()}` : ''}`)
  }, [navigate, searchParams])

  useEffect(() => {
    const handler = (event) => {
      const target = event.target
      const editable = target?.closest?.('input, textarea, select, [contenteditable="true"]')
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !editable) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!isBrowseMode || isLoading || !hasNextPage || isFetchingNextPage || !observerRef.current) return undefined
    const observer = new window.IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) fetchNextPage()
    }, { threshold: 0.1, rootMargin: '260px' })
    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isBrowseMode, isFetchingNextPage, isLoading])

  const featuredDescription = cleanDescription(featured?.description) || 'Explore the all-time anime favourites that audiences return to again and again.'
  const featuredBackdrop = featured?.bannerImage || imageOf(featured)
  const featuredMeta = [
    featured?.averageScore ? `${featured.averageScore}% match` : null,
    featured?.seasonYear,
    featured?.episodes ? `${featured.episodes} episodes` : null,
    featured?.format ? fmt(featured.format) : null,
  ].filter(Boolean)

  return (
    <PageWrapper className="catalog-page">
      <Hero>
        <HeroFallback />
        {featuredBackdrop && <HeroBackdrop style={{ backgroundImage: `url(${featuredBackdrop})` }} />}
        <Container>
          <HeroContent key={featured?.id || 'catalog-featured'}>
            <HeroKicker><FaFire size={12} /> All-time popular</HeroKicker>
            <HeroTitle>{featured ? titleOf(featured) : 'Find your next obsession.'}</HeroTitle>
            <HeroMeta>
              {featuredMeta.map((meta, index) => (
                <span key={meta} className={index === 0 && featured?.averageScore ? 'score' : index === 3 ? 'rating' : ''}>
                  {index > 0 && <span className="dot" aria-hidden="true" />} {meta}
                </span>
              ))}
            </HeroMeta>
            <HeroDescription>{featuredDescription}</HeroDescription>
            <HeroActions>
              {featured && <HeroAction className="primary" to={detailHref(featured)}><FaInfoCircle size={14} /> Explore title</HeroAction>}
            </HeroActions>
          </HeroContent>
        </Container>
      </Hero>

      <DiscoverBar>
        <Container>
          <DiscoverInner>
            <SearchBox>
              <FaSearch size={16} />
              <input
                ref={searchRef}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Titles, genres, studios…"
                aria-label="Search anime"
              />
              {searchInput ? <SearchClear type="button" aria-label="Clear search" onClick={clearSearch}><FaTimes size={13} /></SearchClear> : <SearchHint>⌘ K</SearchHint>}
            </SearchBox>
            <FilterToggle
              type="button"
              $open={showFilters}
              aria-expanded={showFilters}
              aria-controls="catalog-filter-panel"
              aria-label={`${showFilters ? 'Close filters' : 'Browse filters'}${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
              onClick={() => setShowFilters((open) => !open)}
            >
              <FaSlidersH size={14} /> {showFilters ? 'Close filters' : 'Browse filters'}
              {activeFilterCount > 0 && <FilterCount $open={showFilters} aria-hidden="true">{activeFilterCount}</FilterCount>}
            </FilterToggle>
          </DiscoverInner>
          <QuickBrowse aria-label="Popular catalog views">
            <span>Explore</span>
            <QuickBrowseButton type="button" onClick={() => setFilter('view', 'all')}>Popular in Aniraku</QuickBrowseButton>
            <QuickBrowseButton type="button" onClick={() => setFilter('status', 'RELEASING')}>Airing now</QuickBrowseButton>
            <QuickBrowseButton type="button" onClick={() => setFilter('sort', 'SCORE_DESC')}>Top rated</QuickBrowseButton>
            <QuickBrowseButton type="button" onClick={() => setFilter('format', 'MOVIE')}>Movie night</QuickBrowseButton>
          </QuickBrowse>
          {showFilters && (
            <FilterPanel id="catalog-filter-panel" role="region" aria-label="Catalog filters">
              <FilterSelect label="Sort" options={SORT_OPTIONS} value={filters.sort} onChange={(value) => setFilter('sort', value)} />
              <FilterSelect label="Genre" options={GENRE_OPTIONS} value={filters.genre} onChange={(value) => setFilter('genre', value)} />
              <FilterSelect label="Format" options={FORMAT_OPTIONS} value={filters.format} onChange={(value) => setFilter('format', value)} />
              <FilterSelect label="Status" options={STATUS_OPTIONS} value={filters.status} onChange={(value) => setFilter('status', value)} />
              <FilterSelect label="Year" options={YEAR_OPTIONS} value={filters.year} onChange={(value) => setFilter('year', value)} />
              {hasActiveFilters && <ClearAllButton type="button" onClick={clearAll}>Reset all</ClearAllButton>}
            </FilterPanel>
          )}
          {hasActiveFilters && (
            <AppliedFilters aria-label="Applied catalog filters">
              <AppliedFiltersLabel>{activeFilterCount} active</AppliedFiltersLabel>
              {activeFilters.map((filter) => (
                <AppliedFilter key={filter.key} type="button" onClick={() => removeFilter(filter.key)} aria-label={`Remove ${filter.label} filter`}>
                  {filter.label} <FaTimes size={11} aria-hidden="true" />
                </AppliedFilter>
              ))}
              <ClearAllButton type="button" onClick={clearAll}>Reset all</ClearAllButton>
            </AppliedFilters>
          )}
        </Container>
      </DiscoverBar>

      <Container>
        <Main>
          {isBrowseMode ? (
            <>
              <BrowseHeader>
                <div>
                  <h2>{filters.search ? `Results for “${filters.search}”` : 'Browse every title'}</h2>
                  <p>{hasActiveFilters ? `Filtered by ${activeFilters.map((filter) => filter.label.replace(/^[^:]+: /, '')).join(' · ')}.` : 'Open a title to view its episodes, streaming options, and full details.'}</p>
                </div>
                {totalResults > 0 && <ResultCount>{totalResults.toLocaleString()} titles</ResultCount>}
              </BrowseHeader>
              {isLoading ? (
                <ResultGrid>{Array.from({ length: 18 }).map((_, index) => <AnimeCardSkeleton key={index} />)}</ResultGrid>
              ) : isError ? (
                <EmptyState role="alert">
                  <h2>We could not load the catalog</h2>
                  <p>Please check your connection and try again.</p>
                  <ResetButton type="button" onClick={() => refetch()}>Try again</ResetButton>
                </EmptyState>
              ) : allMedia.length ? (
                <>
                  <ResultGrid>{allMedia.map((anime) => <CatalogGridCard key={anime.id} anime={anime} />)}</ResultGrid>
                  <LoadingTrigger ref={observerRef}>
                    {isFetchingNextPage ? <><Spinner />&nbsp;&nbsp;Loading more titles…</> : hasNextPage ? 'Keep scrolling for more titles' : 'You reached the end of this collection'}
                  </LoadingTrigger>
                </>
              ) : (
                <EmptyState role="status">
                  <h2>No titles found</h2>
                  <p>Try a different search or reset your filters.</p>
                  <ResetButton type="button" onClick={clearAll}>Reset catalog</ResetButton>
                </EmptyState>
              )}
            </>
          ) : shelvesError && !allMedia.length ? (
            <EmptyState role="alert">
              <h2>Catalog is taking longer than usual</h2>
              <p>The anime shelves could not load right now. Please try again.</p>
              <ResetButton type="button" onClick={() => { refetch(); refetchShelves() }}>Try again</ResetButton>
            </EmptyState>
          ) : shelvesLoading ? (
            <>
              <ShelfLoading title="Trending now" icon={FaFire} />
              <ShelfLoading title="Airing this week" icon={FaTv} />
              <ShelfLoading title="Popular in Aniraku" icon={FaCompass} />
            </>
          ) : (
            <>
              <Shelf title="Trending now" description="The stories everyone is talking about" icon={FaFire} items={shelves.trending} to="/catalog?sort=POPULARITY_DESC" />
              <Shelf title="Airing this week" description="Fresh episodes from ongoing series" icon={FaTv} items={shelves.airing} to="/catalog?status=RELEASING" />
              <Shelf title="Popular in Aniraku" description="Underrated, highly rated titles worth adding to your watchlist" icon={FaStar} items={underratedPopular} to="/catalog?sort=SCORE_DESC" />
            </>
          )}
        </Main>
      </Container>
      <Footer />
      <div className="bottom-nav-spacer" />
    </PageWrapper>
  )
}
