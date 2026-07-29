import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaPlay, FaStar, FaBookmark, FaRegBookmark } from 'react-icons/fa'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'
import useLocalStorage from '../hooks/useLocalStorage'
import { anilistQuery, ANIME_DETAIL_QUERY, BROWSE_QUERY } from '../lib/anilist'
import { API_BASE } from '../config'
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
  @media (max-width: 768px) { padding: 0 16px; gap: 16px; }
  @media (max-width: 480px) { padding: 0 12px; gap: 12px; }
`

const Cover = styled.img`
  width: 150px;
  height: 210px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  flex-shrink: 0;
  @media (max-width: 768px) { width: 110px; height: 155px; }
  @media (max-width: 480px) { width: 90px; height: 127px; }
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
  &:hover { opacity: 0.9; }
  @media (max-width: 480px) { padding: 8px 18px; font-size: 13px; }
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
  &:hover { border-color: var(--accent); }
  @media (max-width: 480px) { padding: 8px 14px; font-size: 13px; }
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
  gap: 8px;
  flex-wrap: wrap;
`

const GenreTag = styled(Link)`
  padding: 3px 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 11px;
  text-decoration: none;
  transition: all 0.2s;
  &:hover { border-color: var(--accent); color: var(--text-primary); }
  @media (max-width: 480px) { padding: 2px 8px; font-size: 10px; }
`

const Tabs = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
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
  &:hover { color: var(--text-primary); }
  @media (max-width: 480px) { padding: 8px 14px; font-size: 13px; }
`

const EpisodeList = styled.div`
  max-height: 500px;
  overflow-y: auto;
  background: var(--bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--border);
  scrollbar-width: thin;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
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
  &:hover { background: rgba(255,255,255,0.03); }
  &:last-child { border-bottom: none; }
  @media (max-width: 480px) { padding: 6px 12px; gap: 10px; font-size: 12px; }
`

const EpThumb = styled.img`
  width: 60px;
  height: 34px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  background: var(--bg-card);
`

const EpNum = styled.span`
  width: 24px;
  text-align: right;
  font-weight: 600;
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
`

const RelationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
  }
`

const RecGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
  }
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

const RelationCard = ({ r }) => {
  const item = r?.node || r
  if (!item?.id) return null
  const t = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown'
  const label = RELATION_LABELS[r?.relationType] || r?.relationType?.replace('_', ' ') || ''
  return (
    <Link to={`/anime/${item.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: 'var(--bg-card)', aspectRatio: '16/10' }}>
        <img src={item.coverImage?.large || ''} alt={t} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)' }} />
        <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(99,102,241,0.9)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          {label}
        </span>
        <p style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 8px 8px', fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
          {t}
        </p>
      </div>
    </Link>
  )
}

const RecCard = ({ item }) => {
  const t = item.title?.english || item.title?.romaji || 'Unknown'
  return (
    <Link to={`/anime/${item.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: 'var(--bg-card)', aspectRatio: '16/10' }}>
        <img src={item.coverImage?.large || ''} alt={t} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'filter 0.3s' }} loading="lazy" onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.15)'} onMouseOut={e => e.currentTarget.style.filter = ''} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)' }} />
        {item.averageScore > 0 && (
          <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.8)', color: '#ffc107', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3 }}>
            ★ {item.averageScore}%
          </span>
        )}
        <p style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 8px 8px', fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
          {t}
        </p>
        <div style={{ position: 'absolute', bottom: 28, left: 8, display: 'flex', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
          {item.format && <span>{item.format.replace('_', ' ')}</span>}
          {item.episodes && <span>{item.episodes} ep</span>}
        </div>
      </div>
    </Link>
  )
}

const AnimeDetail = () => {
  const { id } = useParams()
  const [anime, setAnime] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useLocalStorage('aniraku-bookmarks', [])
  const [similar, setSimilar] = useState([])
  const [relations, setRelations] = useState([])
  const [activeTab, setActiveTab] = useState('episodes')
  const [nsfwConfirmed, setNsfwConfirmed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aniraku-nsfw-confirmed') || '{}')[String(id)] || false } catch { return false }
  })
  const isBookmarked = bookmarks.some(b => b.id === parseInt(id))

  useEffect(() => {
    setLoading(true)
    setActiveTab('episodes')
    Promise.all([
      anilistQuery(ANIME_DETAIL_QUERY, { id: parseInt(id) }).then(r => r.data.Media).catch(() => null),
      fetch(`${API_BASE}/api/v1/anime/${id}/episodes`).then(r => r.ok ? r.json() : { episodes: [] }).catch(() => ({ episodes: [] })),
      anilistQuery(ANIME_DETAIL_QUERY, { id: parseInt(id) }).then(r => {
        const edges = r.data.Media?.relations?.edges || []
        return edges.filter(e => e.node?.id && (e.relationType === 'ADAPTATION' || e.relationType === 'SEQUEL' || e.relationType === 'PREQUEL' || e.relationType === 'SPIN_OFF' || e.relationType === 'SIDE_STORY'))
          .map(e => ({ ...e.node, relationType: e.relationType }))
      }).catch(() => []),
      anilistQuery(BROWSE_QUERY, { page: 1, perPage: 12, sort: ['SCORE_DESC'] }).then(r => r.data.Page.media).catch(() => []),
    ]).then(([data, epData, relData, simData]) => {
      setAnime(data)
      const eps = epData?.episodes
      if (eps && eps.length > 0) {
        setEpisodes(eps)
      } else if (data?.episodes) {
        setEpisodes(Array.from({ length: data.episodes }, (_, i) => ({
          number: i + 1,
          title: `Episode ${i + 1}`,
          thumbnail: data.coverImage?.medium || '',
        })))
      }
      setSimilar(simData || [])
      setRelations(relData || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const confirmNsfw = () => {
    setNsfwConfirmed(true)
    try {
      const raw = JSON.parse(localStorage.getItem('aniraku-nsfw-confirmed') || '{}')
      raw[String(id)] = true
      localStorage.setItem('aniraku-nsfw-confirmed', JSON.stringify(raw))
    } catch {}
  }

  const toggleBookmark = () => {
    if (isBookmarked) {
      setBookmarks(bookmarks.filter(b => b.id !== parseInt(id)))
    } else {
      setBookmarks([...bookmarks, {
        id: parseInt(id),
        title: anime?.title?.english || anime?.title?.romaji || 'Unknown',
        image: anime?.coverImage?.large || '',
      }])
    }
  }

  if (loading) return (
    <>
      <NavBar />
      <Center><Spinner /></Center>
    </>
  )

  if (!anime) return (
    <>
      <NavBar />
      <Center>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, marginBottom: 12, color: 'var(--text-muted)' }}>Anime not found</p>
          <Link to="/home" style={{ color: 'var(--accent)', fontSize: 14 }}>Back to Home</Link>
        </div>
      </Center>
    </>
  )

  if (anime.isAdult && !nsfwConfirmed) return (
    <>
      <NavBar />
      <Center>
        <div style={{
          textAlign: 'center', padding: 40, maxWidth: 400,
          background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>18+</div>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
            Age-Restricted Content
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            This anime contains adult content. You must be at least 18 years old to view it.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={confirmNsfw} style={{
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>I am 18+ — Continue</button>
            <Link to="/home" style={{
              background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 24px', fontSize: 14, textDecoration: 'none',
            }}>Go Back</Link>
          </div>
        </div>
      </Center>
    </>
  )

  const title = anime.title?.english || anime.title?.romaji || 'Unknown'
  const desc = (anime.description || '').replace(/<[^>]*>/g, '').slice(0, 500)
  const hasEpisodes = episodes.length > 0
  const hasRelations = relations.length > 0
  const tabs = []
  if (hasEpisodes) tabs.push({ key: 'episodes', label: `Episodes (${episodes.length})` })
  if (hasRelations) tabs.push({ key: 'relations', label: 'Relations' })

  return (
    <Page>
      <NavBar />
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
              {anime.episodes && <span>{anime.episodes} episodes</span>}
              {anime.status && <span>{anime.status}</span>}
            </Meta>
            <Actions>
              {hasEpisodes && (
                <WatchBtn to={`/watch/${id}-episode-1`}><FaPlay /> Watch Now</WatchBtn>
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
                    <EpisodeRow key={num} to={`/watch/${id}-episode-${num}`}>
                      <EpThumb src={ep.thumbnail || ''} alt="" loading="lazy" />
                      <EpNum>{num}</EpNum>
                      <span style={{ flex: 1 }}>{ep.title || `Episode ${num}`}</span>
                      <FaPlay size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </EpisodeRow>
                  )
                })}
              </EpisodeList>
            )}

            {activeTab === 'relations' && hasRelations && (
              <RelationsGrid>
                {relations.map((r, i) => <RelationCard key={r?.id || i} r={{ node: r, relationType: r.relationType || '' }} />)}
              </RelationsGrid>
            )}
          </Section>
        )}

        {similar.length > 0 && (
          <Section>
            <SectionTitle>Similar Anime</SectionTitle>
            <RecGrid>
              {similar.map((item, idx) => <RecCard key={item.id || idx} item={item} />)}
            </RecGrid>
          </Section>
        )}
      </Content>
      </main>
      <Footer />
    </Page>
  )
}

export default AnimeDetail
