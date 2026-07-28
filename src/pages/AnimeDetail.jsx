import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaPlay, FaStar, FaBookmark, FaRegBookmark, FaChevronRight, FaChevronLeft } from 'react-icons/fa'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'
import Card from '../components/Card/Card'
import useLocalStorage from '../hooks/useLocalStorage'
import { API_BASE } from '../config'
import styled, { keyframes } from 'styled-components'

const Page = styled.div`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
`

const Banner = styled.div`
  position: relative;
  height: 350px;
  overflow: hidden;
  @media (max-width: 768px) { height: 280px; }
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
  @media (max-width: 600px) { gap: 16px; }
`

const Cover = styled.img`
  width: 150px;
  height: 210px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  flex-shrink: 0;
  @media (max-width: 600px) { width: 100px; height: 140px; }
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
  @media (max-width: 600px) { font-size: 20px; }
`

const Meta = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted);
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
`

const Content = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;

  @media (max-width: 480px) {
    padding: 1.25rem 12px;
  }
`

const Section = styled.section`
  margin-bottom: 30px;

  @media (max-width: 480px) { margin-bottom: 1.5rem; }
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
`

const GenreRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const GenreTag = styled(Link)`
  padding: 6px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 13px;
  text-decoration: none;
  transition: all 0.2s;
  &:hover { border-color: var(--accent); color: var(--text-primary); }
`

const EpisodeList = styled.div`
  max-height: 400px;
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
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  text-decoration: none;
  color: var(--text-muted);
  font-size: 13px;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.03); }
  &:last-child { border-bottom: none; }
`

const EpNum = styled.span`
  width: 28px;
  text-align: right;
  font-weight: 600;
  font-size: 12px;
  color: var(--text-muted);
`

const RecsSection = styled.section`
  margin-bottom: 30px;
`

const RecsScroll = styled.div`
  position: relative;
`

const RecsRow = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  padding: 4px 0 20px;
  &::-webkit-scrollbar { display: none; }
`

const RecsCard = styled(Link)`
  flex: 0 0 200px;
  text-decoration: none;
  color: inherit;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-card);
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
  }
  @media (max-width: 600px) { flex: 0 0 140px; }
`

const RecsImg = styled.img`
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
  transition: filter 0.3s;
  ${RecsCard}:hover & { filter: brightness(1.1) saturate(1.15); }
`

const RecsOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 40%, rgba(0,0,0,0.85) 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px;
`

const RecsTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const RecsMeta = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: rgba(255,255,255,0.7);
`

const RecsScore = styled.span`
  color: #ffc107;
  font-weight: 600;
`

const ScrollBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  transition: background 0.2s;
  &:hover { background: var(--accent); color: var(--bg); }
  @media (max-width: 600px) { display: none; }
`

const glowPulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`

const RecsBadge = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--accent);
  color: #000;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  z-index: 3;
  animation: ${glowPulse} 2s ease-in-out infinite;
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

const AnimeDetail = () => {
  const { id } = useParams()
  const [anime, setAnime] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useLocalStorage('aniraku-bookmarks', [])
  const [similar, setSimilar] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [relations, setRelations] = useState([])
  const [nsfwConfirmed, setNsfwConfirmed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aniraku-nsfw-confirmed') || '{}')[String(id)] || false } catch { return false }
  })
  const recsRef = useRef(null)
  const similarRef = useRef(null)
  const isBookmarked = bookmarks.some(b => b.id === parseInt(id))

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/v1/anime/${id}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/v1/anime/${id}/episodes`).then(r => r.ok ? r.json() : { episodes: [] }).catch(() => ({ episodes: [] })),
      fetch(`${API_BASE}/api/v1/anime/${id}/similar`).then(r => r.ok ? r.json() : { media: [] }).catch(() => ({ media: [] })),
      fetch(`${API_BASE}/api/v1/anime/${id}/relations`).then(r => r.ok ? r.json() : { relations: [] }).catch(() => ({ relations: [] })),
    ]).then(([data, epData, simData, relData]) => {
      setAnime(data)
      setEpisodes(epData.episodes || [])
      const allSimilar = simData.media || []
      setRecommendations(allSimilar.slice(0, 12))
      setSimilar(allSimilar.slice(0, 12))
      setRelations(relData.relations || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const scrollRow = (ref, dir) => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir * 400, behavior: 'smooth' })
    }
  }

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
              <span>{anime.format || ''}</span>
              <span>{anime.episodes ? `${anime.episodes} episodes` : ''}</span>
              <span>{anime.status || ''}</span>
            </Meta>
            <Actions>
              {episodes.length > 0 && (
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

        {relations.length > 0 && (() => {
          const RELATION_ORDER = ['PREQUEL', 'SEQUEL', 'SIDE_STORY', 'SPIN_OFF', 'SUMMARY', 'ALTERNATIVE', 'ADAPTATION', 'CHARACTER', 'OTHER', 'PARENT', 'COMPANION', 'INCLUDES', 'GIFTED_FROM']
          const RELATION_LABELS = {
            PREQUEL: 'Prequel', SEQUEL: 'Sequel', SIDE_STORY: 'Side Story',
            SPIN_OFF: 'Spin Off', SUMMARY: 'Summary', ALTERNATIVE: 'Alternative',
            ADAPTATION: 'Adaptation', CHARACTER: 'Character', OTHER: 'Other',
            PARENT: 'Parent', COMPANION: 'Companion', INCLUDES: 'Includes', GIFTED_FROM: 'Based On',
          }
          const grouped = {}
          relations.forEach(r => {
            if (!grouped[r.relationType]) grouped[r.relationType] = []
            grouped[r.relationType].push(r.node)
          })
          const ordered = RELATION_ORDER.filter(t => grouped[t]?.length > 0)
          if (ordered.length === 0) return null
          return (
            <Section>
              <SectionTitle>Relations</SectionTitle>
              {ordered.map(relType => (
                <div key={relType} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {RELATION_LABELS[relType] || relType}
                  </p>
                  <div className="scroll-row" style={{ gap: 10 }}>
                    {grouped[relType].map(item => {
                      const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown'
                      const epText = item.episodes ? `${item.episodes} ep` : ''
                      const score = item.averageScore
                      return (
                        <Link key={item.id} to={`/anime/${item.id}`} style={{ textDecoration: 'none', flex: '0 0 140px' }}>
                          <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-card)' }}>
                            <img src={item.coverImage?.large || ''} alt={title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} loading="lazy" />
                            {score && (
                              <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', color: '#e2e8f0', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                                {score}%
                              </span>
                            )}
                            {item.format && (
                              <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(99,102,241,0.85)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                                {item.format.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, marginTop: 6, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {title}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {[item.status, epText].filter(Boolean).join(' · ')}
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </Section>
          )
        })()}

        {anime.genres?.length > 0 && (
          <Section>
            <SectionTitle>Genres</SectionTitle>
            <GenreRow>
              {anime.genres.map(g => (
                <GenreTag key={g} to={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</GenreTag>
              ))}
            </GenreRow>
          </Section>
        )}

        {episodes.length > 0 && (
          <Section>
            <SectionTitle>Episodes ({episodes.length})</SectionTitle>
            <EpisodeList>
              {episodes.map((ep, i) => {
                const num = ep.number || i + 1
                return (
                  <EpisodeRow key={num} to={`/watch/${id}-episode-${num}`}>
                    <EpNum>{num}</EpNum>
                    <span style={{ flex: 1 }}>{ep.title || `Episode ${num}`}</span>
                    <FaPlay size={10} style={{ color: 'var(--text-muted)' }} />
                  </EpisodeRow>
                )
              })}
            </EpisodeList>
          </Section>
        )}

        {recommendations.length > 0 && (
          <RecsSection>
            <SectionTitle style={{ marginBottom: '14px' }}>Recommended For You</SectionTitle>
            <RecsScroll>
              <ScrollBtn style={{ left: '-8px' }} onClick={() => scrollRow(recsRef, -1)}>
                <FaChevronLeft size={14} />
              </ScrollBtn>
              <RecsRow ref={recsRef}>
                {recommendations.map((item, idx) => (
                  <RecsCard to={`/anime/${item.id}`} key={item.id || idx}>
                    <RecsImg src={item.coverImage?.large || ''} alt={item.title?.english || item.title?.romaji || 'Recommended anime'} loading="lazy" />
                    <RecsBadge>★ {(item.averageScore || 0)}%</RecsBadge>
                    <RecsOverlay>
                      <RecsTitle>{item.title?.english || item.title?.romaji || 'Unknown'}</RecsTitle>
                      <RecsMeta>
                        <span>{item.format || ''}</span>
                        <span>{item.episodes ? `${item.episodes} ep` : ''}</span>
                      </RecsMeta>
                    </RecsOverlay>
                  </RecsCard>
                ))}
              </RecsRow>
              <ScrollBtn style={{ right: '-8px' }} onClick={() => scrollRow(recsRef, 1)}>
                <FaChevronRight size={14} />
              </ScrollBtn>
            </RecsScroll>
          </RecsSection>
        )}

        {similar.length > 0 && (
          <RecsSection>
            <SectionTitle style={{ marginBottom: '14px' }}>Similar Anime</SectionTitle>
            <RecsScroll>
              <ScrollBtn style={{ left: '-8px' }} onClick={() => scrollRow(similarRef, -1)}>
                <FaChevronLeft size={14} />
              </ScrollBtn>
              <RecsRow ref={similarRef}>
                {similar.map((item, idx) => (
                  <RecsCard to={`/anime/${item.id}`} key={item.id || idx}>
                    <RecsImg src={item.coverImage?.large || ''} alt={item.title?.english || item.title?.romaji || 'Similar anime'} loading="lazy" />
                    {item.averageScore && <RecsBadge>★ {item.averageScore}%</RecsBadge>}
                    <RecsOverlay>
                      <RecsTitle>{item.title?.english || item.title?.romaji || 'Unknown'}</RecsTitle>
                      <RecsMeta>
                        <span>{item.format || ''}</span>
                        <span>{item.episodes ? `${item.episodes} ep` : ''}</span>
                      </RecsMeta>
                    </RecsOverlay>
                  </RecsCard>
                ))}
              </RecsRow>
              <ScrollBtn style={{ right: '-8px' }} onClick={() => scrollRow(similarRef, 1)}>
                <FaChevronRight size={14} />
              </ScrollBtn>
            </RecsScroll>
          </RecsSection>
        )}
      </Content>
      </main>
      <Footer />
    </Page>
  )
}

export default AnimeDetail
