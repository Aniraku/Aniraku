import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { anilistQuery, BROWSE_QUERY } from '../lib/anilist'
import { filterAdult, useNsfw } from '../hooks/useNsfw'
import Footer from '../components/Footer/Footer'
import { setCatalogSEO } from '../lib/seo'
import { generateSlug } from '../lib/slug'
import { 
  FaSearch, FaFilter, FaSortAmountDown, FaLayerGroup, 
  FaCheckCircle, FaCalendarDay, FaTimes, FaChevronDown,
  FaThLarge, FaSlidersH, FaSyncAlt, FaPlay, FaEye, FaChevronRight
} from 'react-icons/fa'
import { AnimeCardSkeleton } from '../components/Skeletons/Skeletons'
import styled, { keyframes, css } from 'styled-components'

const PER_PAGE = 24
const SEARCH_DEBOUNCE_MS = 600
const CURRENT_YEAR = new Date().getFullYear()

const fmt = v => v.replace(/_/g, ' ')

const SORT_OPTIONS = [
  { value: 'POPULARITY_DESC', label: 'Popularity', icon: FaSortAmountDown },
  { value: 'SCORE_DESC', label: 'Top Rated', icon: FaCheckCircle },
  { value: 'START_DATE_DESC', label: 'Newest', icon: FaCalendarDay },
  { value: 'TITLE_ROMAJI', label: 'A–Z', icon: FaLayerGroup },
]

const FORMAT_OPTIONS = [
  { value: '', label: 'All Formats' },
  { value: 'TV', label: 'TV Series' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'SPECIAL', label: 'Specials' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'RELEASING', label: 'Releasing' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
]

const GENRE_OPTIONS = [
  { value: '', label: 'All Genres' },
  ...[
    'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
    'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
    'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  ].map(g => ({ value: g, label: g })),
]

const YEAR_OPTIONS = [
  { value: '', label: 'All Years' },
  ...Array.from({ length: 30 }, (_, i) => {
    const y = CURRENT_YEAR - i
    return { value: String(y), label: String(y) }
  }),
]

// --- Styled Components ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`

const PageWrapper = styled.div`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
`

const HeroSection = styled.div`
  position: relative;
  padding: 86px 0 42px;
  background:
    radial-gradient(circle at 12% 18%, rgba(56,189,248,0.12), transparent 28%),
    radial-gradient(circle at 86% 4%, rgba(167,139,250,0.15), transparent 30%),
    linear-gradient(180deg, rgba(10,12,28,0.96) 0%, var(--bg) 100%);
  border-bottom: 1px solid rgba(167,139,250,0.14);
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.13;
    pointer-events: none;
    background-image: linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px);
    background-size: 36px 36px;
    mask-image: linear-gradient(to bottom, black, transparent 72%);
  }


  @media (max-width: 768px) {
    padding: 60px 0 30px;
  }
`

const HeroGlow = styled.div`
  position: absolute;
  top: -150px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: var(--accent);
  filter: blur(180px);
  opacity: 0.08;
  pointer-events: none;
  z-index: 0;
`

const Container = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`

const TitleGroup = styled.div`
    h1 {
    font-size: clamp(34px, 5vw, 56px);
    font-weight: 850;
    letter-spacing: -0.045em;
    margin: 0 0 10px;
    background: linear-gradient(105deg, #f8fafc 18%, #b7a6ff 66%, #75e6ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p {
    font-size: 16px;
    color: var(--text-secondary);
    max-width: 500px;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    h1 { font-size: 32px; }
    p { font-size: 14px; }
  }
`

const StatsPill = styled.div`
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;

  span { color: var(--text-primary); }
`

const SearchSection = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const SearchBarModern = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  height: 56px;
  padding: 0 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus-within {
    border-color: var(--accent);
    background: var(--bg-card);
    box-shadow: 0 0 0 4px rgba(226, 232, 240, 0.05);
  }

  svg { color: var(--text-muted); transition: color 0.3s; }
  &:focus-within svg { color: var(--accent); }

  input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 500;
    &::placeholder { color: var(--text-muted); font-weight: 400; }
  }
`

const SearchKbd = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  background: rgba(255,255,255,0.03);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
`

const FilterToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 24px;
  background: ${p => p.$active ? 'var(--text-primary)' : 'var(--bg-elevated)'};
  color: ${p => p.$active ? 'var(--bg)' : 'var(--text-primary)'};
  border: 1px solid ${p => p.$active ? 'var(--text-primary)' : 'var(--border)'};
  border-radius: 16px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${p => p.$active ? 'var(--text-primary)' : 'var(--text-muted)'};
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 24px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${p => p.$show ? css`
    max-height: 500px;
    opacity: 1;
    margin-bottom: 20px;
  ` : css`
    max-height: 0;
    opacity: 0;
    margin-top: 0;
  `}
`

const SelectWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg.icon-left {
    position: absolute;
    left: 14px;
    color: var(--text-muted);
    pointer-events: none;
    font-size: 12px;
  }

  select {
    appearance: none;
    width: 100%;
    height: 48px;
    padding: 0 36px 0 38px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { border-color: var(--text-muted); }
    &:focus { outline: none; border-color: var(--accent); color: var(--text-primary); }
  }

  svg.chevron {
    position: absolute;
    right: 14px;
    color: var(--text-muted);
    pointer-events: none;
    font-size: 10px;
  }
`

const ClearAllBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  background: rgba(229, 9, 20, 0.05);
  border: 1px solid rgba(229, 9, 20, 0.2);
  border-radius: 12px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: rgba(229, 9, 20, 0.1); border-color: #ef4444; }
`

const MainContent = styled.div`
  padding: 48px 0 100px;
`

const AnimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
  gap: 24px;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  @media (min-width: 641px) and (max-width: 980px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }
`

const CatalogCard = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  text-decoration: none;
  transition: transform 0.28s cubic-bezier(0.23, 1, 0.32, 1);

  &:hover, &:focus-within { transform: translateY(-8px); }
  @media (hover: none) { &:active { transform: scale(0.985); } }
`

const CardMedia = styled.div`
  position: relative;
  aspect-ratio: 2/3;
  background: var(--bg-card);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: ${({ $preview }) => ($preview
    ? '0 18px 46px rgba(0,0,0,0.5), 0 0 30px rgba(124,58,237,0.18)'
    : '0 10px 30px rgba(0,0,0,0.3)')};
  transition: box-shadow 0.28s ease, border-color 0.28s ease;
  border: 1px solid ${({ $preview }) => ($preview ? 'rgba(167,139,250,0.58)' : 'transparent')};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), filter 0.28s ease;
    ${({ $preview }) => $preview && 'transform: scale(1.06); filter: brightness(0.72) saturate(1.15);'}
  }

  ${CatalogCard}:hover & img { transform: scale(1.06); }
`

const CardOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(2,3,13,0.94) 0%, rgba(2,3,13,0.32) 58%, transparent 100%);
  opacity: ${({ $preview }) => ($preview ? 1 : 0)};
  transition: opacity 0.22s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  pointer-events: ${({ $preview }) => ($preview ? 'auto' : 'none')};

  ${CatalogCard}:hover &, ${CatalogCard}:focus-within & { opacity: 1; pointer-events: auto; }
  @media (hover: none) { opacity: ${({ $preview }) => ($preview ? 1 : 0)}; }
`

const PreviewEyebrow = styled.span`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  color: #b9a8ff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`

const PreviewText = styled.p`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  margin: 0 0 14px;
  color: rgba(241,245,249,0.82);
  font-size: 11px;
  line-height: 1.5;
`

const PreviewActions = styled.div`
  display: flex;
  gap: 7px;
  align-items: center;
`

const PreviewAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 11px;
  border-radius: 999px;
  background: #f8fafc;
  color: #0b0d1c;
  font-size: 11px;
  font-weight: 800;
  text-decoration: none;
  &:hover { background: #c4b5fd; }
`

const PreviewToggle = styled.button`
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 11px;
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 999px;
  background: rgba(8,10,26,0.72);
  color: #f8fafc;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
  transition: opacity 0.18s ease, transform 0.18s ease, background 0.18s ease;
  &:hover { background: rgba(124,58,237,0.8); }
  &:active { transform: scale(0.96); }
  @media (hover: hover) and (pointer: fine) {
    opacity: 0;
    ${CatalogCard}:hover &, ${CatalogCard}:focus-within & { opacity: 1; }
  }
`


const CardBadges = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 2;
`

const Badge = styled.span`
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255,255,255,0.1);

  &.score { color: #ffc107; }
  &.score.is-high { color: #22c55e; }
`

const CardInfo = styled.div`
  padding: 14px 4px 0;
  h3 {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.2s;
  }
  ${CatalogCard}:hover h3 { color: var(--accent); }
`

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;

  span.dot { width: 3px; height: 3px; border-radius: 50%; background: var(--border); }
`

const LoadingTrigger = styled.div`
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 40px;
  color: var(--text-muted);
`

const EmptyState = styled.div`
  text-align: center;
  padding: 100px 20px;
  h2 { font-size: 24px; color: var(--text-primary); margin-bottom: 12px; }
  p { color: var(--text-secondary); margin-bottom: 24px; }
`

const ResetBtn = styled.button`
  padding: 14px 32px;
  background: var(--accent);
  color: #000;
  border-radius: 14px;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { transform: scale(1.05); opacity: 0.9; }
`

const Spinner = styled(FaSyncAlt)`
  animation: spin 1s linear infinite;
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`

// --- Components ---

const CardMemo = memo(function Card({ a }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const title = a.title?.english || a.title?.romaji || a.title?.userPreferred || 'Unknown'
  const img = a.coverImage?.extraLarge || a.coverImage?.large || a.coverImage?.medium
  const previewImg = a.bannerImage || img
  const highScore = typeof a.averageScore === 'number' && a.averageScore >= 75
  const detailHref = `/anime/${generateSlug(title)}-${a.id}`
  const synopsis = (a.description || 'A quick look at this title, its format, and where your next watch could begin.')
    .replace(/\s+/g, ' ')
    .trim()
  const handleMediaPointerUp = (event) => {
    if (event.pointerType === 'touch') setPreviewOpen((open) => !open)
  }

  return (
    <CatalogCard>
      <CardMedia
        $preview={previewOpen}
        onPointerUp={handleMediaPointerUp}
        aria-label={`${previewOpen ? 'Close' : 'Open'} preview for ${title}`}
      >
        {previewImg ? (
          <img src={previewOpen ? previewImg : img} alt={title} loading="lazy" />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No image</div>
        )}
        <CardBadges>
          {typeof a.averageScore === 'number' && (
            <Badge className={`score${highScore ? ' is-high' : ''}`}>
              {a.averageScore}%
            </Badge>
          )}
          {a.format && <Badge>{fmt(a.format)}</Badge>}
        </CardBadges>
        <PreviewToggle
          type="button"
          aria-expanded={previewOpen}
          aria-label={`${previewOpen ? 'Close' : 'Open'} preview for ${title}`}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            setPreviewOpen((open) => !open)
          }}
        >
          <FaEye size={12} /> {previewOpen ? 'Close' : 'Preview'}
        </PreviewToggle>
        <CardOverlay $preview={previewOpen}>
          <PreviewEyebrow><FaEye size={10} /> Quick preview</PreviewEyebrow>
          <PreviewText>{synopsis}</PreviewText>
          <PreviewActions>
            <PreviewAction
              to={detailHref}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <FaPlay size={10} /> Open title
            </PreviewAction>
            <PreviewAction
              as="button"
              type="button"
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                setPreviewOpen(false)
              }}
              style={{ background: 'rgba(255,255,255,0.12)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              Close <FaChevronRight size={9} style={{ transform: 'rotate(90deg)' }} />
            </PreviewAction>
          </PreviewActions>
        </CardOverlay>
      </CardMedia>
      <CardInfo>
        <Link to={detailHref} style={{ textDecoration: 'none' }}>
          <h3>{title}</h3>
        </Link>
        <CardMeta>
          {a.episodes && <span>{a.episodes} Ep</span>}
          {a.episodes && a.seasonYear && <span className="dot" />}
          {a.seasonYear && <span>{a.seasonYear}</span>}
          {a.trailer?.site === 'youtube' && <span className="dot" />}
          {a.trailer?.site === 'youtube' && <span>Trailer</span>}
        </CardMeta>
      </CardInfo>
    </CatalogCard>
  )
})

function FilterSelect({ options, value, onChange, ariaLabel, icon: Icon }) {
  return (
    <SelectWrapper>
      {Icon && <Icon className="icon-left" />}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={ariaLabel}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <FaChevronDown className="chevron" />
    </SelectWrapper>
  )
}

export default function Catalog() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  
  // State
  const [searchInput, setSearchInput] = useState(sp.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(sp.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)
  
  const searchRef = useRef(null)
  const observerRef = useRef(null)
  const didMount = useRef(false)

  // Memoized filters
  const f = useMemo(() => ({
    genre: sp.get('genre') || '',
    format: sp.get('format') || '',
    status: sp.get('status') || '',
    year: sp.get('year') || '',
    sort: sp.get('sort') || 'POPULARITY_DESC',
    search: debouncedSearch,
  }), [sp, debouncedSearch])

  // Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['catalog-infinite', f],
    queryFn: async ({ pageParam = 1 }) => {
      const variables = { 
        page: pageParam, 
        perPage: PER_PAGE, 
        sort: [f.sort || 'POPULARITY_DESC'] 
      }
      if (f.search) variables.search = f.search
      if (f.genre) variables.genre = f.genre
      if (f.format) variables.format = f.format
      if (f.status) variables.status = f.status
      if (f.year) variables.year = parseInt(f.year, 10)
      
      const { data } = await anilistQuery(BROWSE_QUERY, variables)
      return { 
        media: data.Page.media, 
        pageInfo: data.Page.pageInfo 
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.currentPage + 1 : undefined
    },
    staleTime: 300000,
  })

  const { nsfwEnabled } = useNsfw()
  
  // Flatten media pages
  const allMedia = useMemo(() => {
    if (!data) return []
    const flat = data.pages.flatMap(page => page.media)
    return filterAdult(flat, nsfwEnabled)
  }, [data, nsfwEnabled])

  const totalResults = data?.pages[0]?.pageInfo?.total || 0

  // SEO
  useEffect(() => {
    setCatalogSEO(sp)
  }, [sp])

  // Search Debounce Logic (Fixed: only updates when searchInput changes)
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return }
    
    const t = setTimeout(() => {
      const val = searchInput.trim()
      if (val !== debouncedSearch) {
        setDebouncedSearch(val)
        const n = new URLSearchParams(sp)
        val ? n.set('search', val) : n.delete('search')
        // No need to set page=1 anymore as useInfiniteQuery handles resets via queryKey
        navigate(`/catalog?${n.toString()}`, { replace: true })
      }
    }, SEARCH_DEBOUNCE_MS)
    
    return () => clearTimeout(t)
  }, [searchInput, debouncedSearch, sp, navigate])

  // URL Sync for Filters
  const setFilter = useCallback((k, v) => {
    const n = new URLSearchParams(sp)
    v ? n.set(k, v) : n.delete(k)
    navigate(`/catalog?${n.toString()}`)
  }, [sp, navigate])

  const clearAll = useCallback(() => {
    setSearchInput('')
    setDebouncedSearch('')
    navigate('/catalog')
  }, [navigate])

  // Keyboard shortcut
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Infinite Scroll Observer
  useEffect(() => {
    if (isLoading || !hasNextPage || isFetchingNextPage) return

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    const currentTarget = observerRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isLoading])

  const hasActiveFilters = !!(f.search || f.format || f.status || f.genre || f.year)

  return (
    <PageWrapper className="catalog-page">
      <HeroSection>
        <HeroGlow />
        <Container>
          <HeaderContent>
            <TitleGroup>
              <h1>Explore Catalog</h1>
              <p>Dive into our vast collection of anime. Use filters to find your next favorite series or movie.</p>
            </TitleGroup>
            {totalResults > 0 && (
              <StatsPill>
                <span>{totalResults.toLocaleString()}</span> Results Found
              </StatsPill>
            )}
          </HeaderContent>

          <SearchSection>
            <SearchBarModern>
              <FaSearch size={18} />
              <input
                ref={searchRef}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by title, genre, or studio..."
                aria-label="Search anime"
              />
              {searchInput ? (
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  onClick={() => setSearchInput('')}
                >
                  <FaTimes size={16} />
                </button>
              ) : (
                <SearchKbd>⌘K</SearchKbd>
              )}
            </SearchBarModern>
            
            <FilterToggle 
              $active={showFilters}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaSlidersH size={16} />
              <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
            </FilterToggle>
          </SearchSection>

          <FilterGrid $show={showFilters}>
            <FilterSelect ariaLabel="Sort by" options={SORT_OPTIONS} value={f.sort} onChange={v => setFilter('sort', v)} icon={FaSortAmountDown} />
            <FilterSelect ariaLabel="Filter by genre" options={GENRE_OPTIONS} value={f.genre} onChange={v => setFilter('genre', v)} icon={FaFilter} />
            <FilterSelect ariaLabel="Filter by format" options={FORMAT_OPTIONS} value={f.format} onChange={v => setFilter('format', v)} icon={FaThLarge} />
            <FilterSelect ariaLabel="Filter by status" options={STATUS_OPTIONS} value={f.status} onChange={v => setFilter('status', v)} icon={FaCheckCircle} />
            <FilterSelect ariaLabel="Filter by year" options={YEAR_OPTIONS} value={f.year} onChange={v => setFilter('year', v)} icon={FaCalendarDay} />
            {hasActiveFilters && (
              <ClearAllBtn onClick={clearAll}>
                <FaTimes size={12} /> Clear All
              </ClearAllBtn>
            )}
          </FilterGrid>
        </Container>
      </HeroSection>

      <Container>
        <MainContent>
          {isLoading ? (
            <AnimeGrid>
              {Array.from({ length: 12 }).map((_, i) => <AnimeCardSkeleton key={i} />)}
            </AnimeGrid>
          ) : isError ? (
            <EmptyState>
              <h2>Something went wrong</h2>
              <p>We couldn't load the catalog right now. Please try again later.</p>
              <ResetBtn onClick={() => refetch()}>Try Again</ResetBtn>
            </EmptyState>
          ) : allMedia.length > 0 ? (
            <>
              <AnimeGrid>
                {allMedia.map((a, i) => <CardMemo key={`${a.id}-${i}`} a={a} />)}
              </AnimeGrid>

              <LoadingTrigger ref={observerRef}>
                {isFetchingNextPage ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Spinner />
                    <span>Loading more...</span>
                  </div>
                ) : hasNextPage ? (
                  <span>Scroll for more</span>
                ) : (
                  <span>You've reached the end</span>
                )}
              </LoadingTrigger>
            </>
          ) : (
            <EmptyState>
              <h2>No results found</h2>
              <p>We couldn't find any anime matching your current filters. Try adjusting them!</p>
              <ResetBtn onClick={clearAll}>Reset all filters</ResetBtn>
            </EmptyState>
          )}
        </MainContent>
      </Container>

      <Footer />
      <div className="bottom-nav-spacer" />
    </PageWrapper>
  )
}
