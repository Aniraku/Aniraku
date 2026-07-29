import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FaRandom, FaPlay, FaRedo } from 'react-icons/fa'
import { anilistQuery, BROWSE_QUERY } from '../lib/anilist'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import styled from 'styled-components'

const Page = styled.div`min-height:100vh;background:var(--bg);`
const Container = styled.div`max-width:600px;margin:0 auto;padding:4rem 1rem;text-align:center;`
const Title = styled.h1`font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;`
const Subtitle = styled.p`color:var(--text-secondary);font-size:14px;margin-bottom:2rem;`
const Card = styled.div`background:var(--bg-elevated);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:1.5rem;`
const Cover = styled.img`width:100%;aspect-ratio:16/9;object-fit:cover;display:block;`
const Info = styled.div`padding:1rem;`
const AnimeTitle = styled.h2`font-size:1.2rem;font-weight:700;margin-bottom:0.5rem;`
const Meta = styled.p`font-size:13px;color:var(--text-secondary);margin-bottom:0.75rem;`
const Actions = styled.div`display:flex;gap:10px;justify-content:center;flex-wrap:wrap;`
const WatchBtn = styled(Link)`display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:var(--accent);color:#000;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;`
const TryBtn = styled.button`display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border);border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s;&:hover{border-color:var(--accent);}`
const Spinner = styled.div`width:48px;height:48px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1rem;@keyframes spin{to{transform:rotate(360deg);}}`

export default function Random() {
  const [anime, setAnime] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchRandom = useCallback(async () => {
    setLoading(true)
    setError('')
    setAnime(null)
    try {
      const page = Math.floor(Math.random() * 10) + 1
      const { data } = await anilistQuery(BROWSE_QUERY, { page, perPage: 20, sort: ['POPULARITY_DESC'] })
      const items = data?.Page?.media || []
      if (items.length > 0) {
        const random = items[Math.floor(Math.random() * items.length)]
        setAnime(random)
      } else {
        setError('Could not find any anime. Try again.')
      }
    } catch {
      setError('Failed to fetch. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <Page>
      <NavBar />
      <Container>
        <Title>Discover Random Anime</Title>
        <Subtitle>Not sure what to watch? Let fate decide.</Subtitle>

        {!anime && !loading && !error && (
          <div style={{ padding: '3rem 0' }}>
            <FaRandom size={48} style={{ color: 'var(--accent)', marginBottom: '1rem', opacity: 0.5 }} />
            <div><TryBtn onClick={fetchRandom}><FaRedo size={16} /> Discover Random Anime</TryBtn></div>
          </div>
        )}

        {loading && (
          <div style={{ padding: '3rem 0' }}>
            <Spinner />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Finding a surprise...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '2rem 0' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{error}</p>
            <TryBtn onClick={fetchRandom}><FaRedo size={16} /> Try Again</TryBtn>
          </div>
        )}

        {anime && !loading && (
          <>
            <Card>
              <Link to={`/anime/${anime.id}`}>
                <Cover src={anime.coverImage?.extraLarge || anime.coverImage?.large || ''} alt={anime.title?.english || anime.title?.romaji || 'Anime'} />
              </Link>
              <Info>
                <AnimeTitle>{anime.title?.english || anime.title?.romaji || 'Unknown'}</AnimeTitle>
                <Meta>
                  {anime.averageScore && <span>Score: {anime.averageScore}%</span>}
                  {anime.averageScore && anime.format && <span> · </span>}
                  {anime.format && <span>{anime.format}</span>}
                  {anime.episodes && <span> · {anime.episodes} ep</span>}
                </Meta>
                <Actions>
                  <WatchBtn to={`/watch/${anime.id}-episode-1`}><FaPlay size={14} /> Watch Now</WatchBtn>
                  <TryBtn onClick={fetchRandom}><FaRedo size={14} /> Try Another</TryBtn>
                </Actions>
              </Info>
            </Card>
            {anime.genres && anime.genres.length > 0 && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {anime.genres.map(g => (
                  <Link key={g} to={`/catalog?genre=${encodeURIComponent(g)}`} style={{ padding: '3px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: 11, textDecoration: 'none', transition: 'all 0.2s' }}>{g}</Link>
                ))}
              </div>
            )}
          </>
        )}
      </Container>
      <Footer />
      <MobileBottomNav />
      <div className="bottom-nav-spacer" />
    </Page>
  )
}
