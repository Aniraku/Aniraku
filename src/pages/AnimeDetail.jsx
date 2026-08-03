import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaPlay, FaStar, FaBookmark, FaRegBookmark } from 'react-icons/fa'
import Footer from '../components/Footer/Footer'
import Comments from '../components/Comments/Comments'
import useLocalStorage from '../hooks/useLocalStorage'
import { useAnimeDetails, useSimilar } from '../hooks/useAnime'
import { useAuth } from '../hooks/useAuth'
import { filterAdult, isNsfw, useNsfw } from '../hooks/useNsfw'
import { supabase } from '../lib/supabase'
import { API_BASE } from '../config'
import { extractIdFromSlug, generateSlug } from '../lib/slug'
import styled from 'styled-components'

const Page = styled.div`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
`

const Banner = styled.div`
  position: relative;
  height: 350px;
  overflow: hidden;
  @media (max-width: 768px) { height: 260px; }
  @media (max-width: 480px) { height: 220px; }
`

const BannerImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(20px) brightness(0.3);
  transform: scale(1.2);
`

const BannerOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 0%, var(--bg) 100%);
`

const BannerContent = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 24px;
  align-items: flex-end;
  @media (max-width: 768px) { gap: 16px; padding: 0 16px; }
  @media (max-width: 480px) { gap: 12px; padding: 0 12px; }
`

const Cover = styled.img`
  width: 150px;
  height: 210px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  flex-shrink: 0;
  @media (max-width: 768px) { width: 110px; height: 155px; }
  @media (max-width: 480px) { width: 90px; height: 127px; border-radius: 6px; }
`

const Info = styled.div`
  flex: 1;
  padding-bottom: 8px;
  min-width: 0;
`

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  @media (max-width: 768px) { font-size: 22px; }
  @media (max-width: 480px) { font-size: 18px; }
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
  @media (max-width: 480px) { padding: 8px 18px; font-size: 13px; min-height: 40px; }
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
  @media (max-width: 480px) { padding: 8px 14px; font-size: 13px; min-height: 40px; }
`

const Content = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 20px;
  @media (max-width: 768px) { padding: 20px 16px; }
  @media (max-width: 480px) { padding: 16px 12px; }
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

const EpisodeRow = styled(Link)`
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
  @media (max-width: 480px) { padding: 6px 12px; gap: 10px; font-size: 12px; min-height: 40px; }
`

const EpThumb = styled.img`
  width: 60px;
  height: 34px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  background: var(--bg-card);
  @media (max-width: 480px) { width: 50px; height: 28px; }
`

const EpNum = styled.span`
  width: 24px;
  text-align: right;
  font-weight: 600;
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
`

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`

const Center = styled.div`
  min-height: 80vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
`

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
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
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
  const id = extractIdFromSlug(slugId)
  const { user } = useAuth()
  const { nsfwEnabled } = useNsfw()
  const [bookmarks, setBookmarks] = useLocalStorage('aniraku-bookmarks', [])
  const [activeTab, setActiveTab] = useState('episodes')
  const [episodes, setEpisodes] = useState([])

  const { data: anime, isLoading } = useAnimeDetails(id)
  const { data: similar } = useSimilar(id)
  const isBookmarked = bookmarks.some(b => b.id === parseInt(id))

  // Merge server-side bookmarks into local state when signed in, so a
  // bookmark made on another device is visible here immediately.
  React.useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase.from('bookmarks').select('anime_id,title,image').eq('user_id', user.id)
      .then(({ data }) => {
        if (cancelled || !data?.length) return
        setBookmarks(prev => {
          const mapped = data.map(b => ({ id: b.anime_id, title: b.title, image: b.image }))
          const ids = new Set(mapped.map(m => m.id))
          const merged = [...mapped, ...prev.filter(p => !ids.has(p.id))]
          return merged
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user, setBookmarks])

  const relations = React.useMemo(() => {
    if (!anime?.relations?.edges) return []
    return anime.relations.edges
      .filter(e => e.node?.id && ['ADAPTATION', 'SEQUEL', 'PREQUEL', 'SPIN_OFF', 'SIDE_STORY'].includes(e.relationType))
      .map(e => ({ ...e.node, relationType: e.relationType }))
  }, [anime])

  React.useEffect(() => {
    if (!anime) return
    fetch(`${API_BASE}/api/v1/anime/${id}/episodes`)
      .then(r => r.ok ? r.json() : { episodes: [] })
      .then(epData => {
        const eps = epData?.episodes
        if (eps?.length > 0) {
          setEpisodes(eps)
        } else if (anime?.episodes) {
          setEpisodes(Array.from({ length: anime.episodes }, (_, i) => ({
            number: i + 1,
            title: `Episode ${i + 1}`,
            thumbnail: anime.coverImage?.medium || '',
          })))
        }
      })
      .catch(() => {
        if (anime?.episodes) {
          setEpisodes(Array.from({ length: anime.episodes }, (_, i) => ({
            number: i + 1,
            title: `Episode ${i + 1}`,
            thumbnail: anime.coverImage?.medium || '',
          })))
        }
      })
    setActiveTab('episodes')
  }, [anime, id])

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
        supabase.from('bookmarks').insert({
          user_id: user.id,
          anime_id: numericId,
          title: anime.title?.english || anime.title?.romaji || 'Unknown',
          image: anime.coverImage?.large || '',
          added_at: Date.now(),
        }).then()
      }
    }
  }

  if (isLoading) return (
    <>
      <Center><Spinner /></Center>
    </>
  )

  if (!anime) return (
    <>
      <Center>
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <p style={{ fontSize: 18, marginBottom: 12, color: 'var(--text-muted)' }}>Anime not found</p>
          <Link to="/home" style={{ color: 'var(--accent)', fontSize: 14 }}>Back to Home</Link>
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
            <NsfwBtn as={Link} to="/settings">Open Settings</NsfwBtn>
            <OutlineLink to="/home">Go Back</OutlineLink>
          </div>
        </NsfwCard>
      </Center>
    </>
  )

  const title = anime.title?.english || anime.title?.romaji || 'Unknown'
  const desc = (anime.description || '').replace(/<[^>]*>/g, '').slice(0, 500)
  const isMovie = anime.format === 'MOVIE'
  const hasEpisodes = episodes.length > 0
  const hasRelations = relations.length > 0
  const tabs = []
  if (hasEpisodes && !isMovie) tabs.push({ key: 'episodes', label: `Episodes (${episodes.length})` })
  if (hasRelations) tabs.push({ key: 'relations', label: 'Relations' })

  return (
    <Page>
      <main>
      <Banner>
        <BannerImg src={anime.coverImage?.extraLarge || anime.coverImage?.large || ''} alt="" />
        <BannerOverlay />
        <BannerContent>
          <Cover src={anime.coverImage?.large || ''} alt={title} />
          <Info>
            <Title>{title}</Title>
            <Meta>
              {anime.averageScore && <Score><FaStar /> {anime.averageScore}%</Score>}
              {anime.format && <span>{anime.format}</span>}
              {!isMovie && anime.episodes && <span>{anime.episodes} episodes</span>}
              {anime.status && <span>{anime.status}</span>}
            </Meta>
            <Actions>
              {hasEpisodes && (
                <WatchBtn to={`/watch/${generateSlug(title)}-${id}-episode-1`}><FaPlay /> Watch Now</WatchBtn>
              )}
              <BookmarkBtn $active={isBookmarked} onClick={toggleBookmark}>
                {isBookmarked ? <FaBookmark /> : <FaRegBookmark />} {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </BookmarkBtn>
            </Actions>
          </Info>
        </BannerContent>
      </Banner>

      <Content>
        {desc && (
          <Section>
            <SectionTitle>Synopsis</SectionTitle>
            <Desc>{desc}{(anime.description || '').length > 500 ? '...' : ''}</Desc>
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

            {activeTab === 'episodes' && hasEpisodes && (
              <EpisodeList>
                {episodes.map((ep, i) => {
                  const num = ep.number || i + 1
                  return (
                    <EpisodeRow key={num} to={`/watch/${generateSlug(title)}-${id}-episode-${num}`}>
                      <EpThumb src={ep.thumbnail || ''} alt="" loading="lazy" />
                      <EpNum>{num}</EpNum>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.title || `Episode ${num}`}</span>
                      <FaPlay size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </EpisodeRow>
                  )
                })}
              </EpisodeList>
            )}

            {activeTab === 'relations' && hasRelations && (
              <Grid>
                {relations.map(r => <RelationCard key={r.id} r={{ node: r, relationType: r.relationType || '' }} />)}
              </Grid>
            )}
          </Section>
        )}

        {filterAdult(similar, nsfwEnabled)?.length > 0 && (
          <Section>
            <SectionTitle>Similar Anime</SectionTitle>
            <Grid>
              {filterAdult(similar, nsfwEnabled).map(item => <RecCard key={item.id} item={item} />)}
            </Grid>
          </Section>
        )}

        <Comments animeId={anime.id} />
      </Content>
      </main>
      <Footer />
    </Page>
  )
}

export default AnimeDetail
