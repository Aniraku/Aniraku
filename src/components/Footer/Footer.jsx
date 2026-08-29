import React from 'react'
import styled from 'styled-components'
import { F } from './footer.style'
import { Link } from 'react-router-dom'
import Logo from '../Logo'
import { FaGithub, FaDiscord } from 'react-icons/fa'

const TMDB_LOGO_URL = 'https://www.themoviedb.org/assets/v4/logos/v2/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg'

const letters = [
  'All', '#', '0-9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
]

const browseLinks = [
  { label: 'Home', to: '/' },
  { label: 'Catalog', to: '/catalog' },
  { label: 'Schedule', to: '/schedule' },
  { label: 'Most Popular', to: '/catalog?sort=POPULARITY_DESC' },
  { label: 'Top Airing', to: '/catalog?status=RELEASING' },
  { label: 'Top Rated', to: '/catalog?sort=SCORE_DESC' },
  { label: 'Anime Movies', to: '/catalog?format=MOVIE' },
  { label: 'TV Series', to: '/catalog?format=TV' },
]

const popularGenres = [
  { label: 'Action', to: '/catalog?genre=Action' },
  { label: 'Romance', to: '/catalog?genre=Romance' },
  { label: 'Comedy', to: '/catalog?genre=Comedy' },
  { label: 'Fantasy', to: '/catalog?genre=Fantasy' },
  { label: 'Sci-Fi', to: '/catalog?genre=Sci-Fi' },
  { label: 'Horror', to: '/catalog?genre=Horror' },
  { label: 'Slice of Life', to: '/catalog?genre=Slice%20of%20Life' },
  { label: 'Sports', to: '/catalog?genre=Sports' },
  { label: 'Supernatural', to: '/catalog?genre=Supernatural' },
  { label: 'Mystery', to: '/catalog?genre=Mystery' },
  { label: 'Drama', to: '/catalog?genre=Drama' },
  { label: 'Adventure', to: '/catalog?genre=Adventure' },
]

const resourceLinks = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'DMCA', to: '/dmca' },
  { label: 'AGPL License', to: '/license' },
  { label: 'Community Guidelines', to: '/community-guidelines' },
]

const CompactContent = styled.div`
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr) auto;
  width: min(100%, 920px);
  margin: 0 auto;
  padding: 14px clamp(4px, 2vw, 14px);
  align-items: center;
  gap: 16px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 12px;
  @media (max-width: 720px) { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px 10px; }
  a { color: var(--text-secondary); text-decoration: none; }
  a:hover { color: var(--text-primary); }
`

const CompactBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 700;

  @media (max-width: 720px) { flex-direction: column; gap: 4px; }
`

const CompactAttribution = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  max-width: 390px;
  margin: 0;
  color: var(--text-muted);
  font-size: 9px;
  line-height: 1.35;
  text-align: left;

  img { width: 42px; height: auto; flex: 0 0 auto; }
  @media (max-width: 720px) { text-align: center; }
`

const Footer = ({ compact = true }) => {
  if (compact) {
    return (
      <F.Footer id="footer" $compact>
          <CompactContent>
            <CompactBrand><Logo to="/" height={25} showText /><span>© 2026 Aniraku</span></CompactBrand>
            <CompactAttribution>
              <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" aria-label="Visit the official TMDB website"><img src={TMDB_LOGO_URL} alt="TMDB" /></a>
              <span>This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.</span>
            </CompactAttribution>
            <nav aria-label="Legal and support links">
            <Link to="/catalog">Catalog</Link>
            <Link to="/schedule">Schedule</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/dmca">DMCA</Link>
            <a href="https://github.com/Aniraku/Aniraku/issues" target="_blank" rel="noreferrer">Support</a>
          </nav>
        </CompactContent>
      </F.Footer>
    )
  }
  return (
    <F.Footer id="footer" $compact={false}>
      {/* Desktop grid */}
      <F.DesktopGrid>
          <F.Col>
            <Logo to="/" height={36} showText />
            <F.Disclaimer>
              Aniraku is an open-source media client. We do not host, store, or upload video files.
              Stream links are resolved from publicly available third-party sources at playback time.
            </F.Disclaimer>
            <F.TmdbAttribution>
              <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" aria-label="Visit the official TMDB website"><img src={TMDB_LOGO_URL} alt="TMDB" /></a>
              <span>This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.</span>
            </F.TmdbAttribution>
          <F.Socials>
            <F.SocialLink href="https://github.com/Aniraku/Aniraku" target="_blank" rel="noreferrer" aria-label="GitHub"><FaGithub size={18} /></F.SocialLink>
            <F.SocialLink href="https://discord.gg/aniraku" target="_blank" rel="noreferrer" aria-label="Discord"><FaDiscord size={18} /></F.SocialLink>
          </F.Socials>
          <F.TrustLine>
            {resourceLinks.map((resource, index) => <React.Fragment key={resource.to}><Link to={resource.to}>{resource.label}</Link>{index < resourceLinks.length - 1 && <span>·</span>}</React.Fragment>)}
            <span>·</span><a href="https://github.com/Aniraku/Aniraku/issues" target="_blank" rel="noreferrer">Report an issue</a>
          </F.TrustLine>
        </F.Col>

        <F.Col>
          <F.ColTitle>Browse</F.ColTitle>
          <F.ColLinks>
            {browseLinks.map(l => (
              <F.LinkItem key={l.to} as={Link} to={l.to}>{l.label}</F.LinkItem>
            ))}
          </F.ColLinks>
        </F.Col>

        <F.Col>
          <F.ColTitle>Genres</F.ColTitle>
          <F.ColLinks>
            {popularGenres.map(l => (
              <F.LinkItem key={l.to} as={Link} to={l.to}>{l.label}</F.LinkItem>
            ))}
          </F.ColLinks>
        </F.Col>

        <F.Col>
          <F.ColTitle>A-Z List</F.ColTitle>
          <F.AzGrid>
            {letters.map((item, idx) => (
              <F.AzLink
                key={idx}
                as={Link}
                to={item === 'All' ? '/catalog' : `/catalog?search=${encodeURIComponent(item)}`}
              >
                {item}
              </F.AzLink>
            ))}
          </F.AzGrid>
        </F.Col>
      </F.DesktopGrid>

      {/* Mobile layout */}
      <F.MobileFooter>
        <F.MobileTop>
          <Logo to="/" height={28} showText />
          <F.Socials>
            <F.SocialLink href="https://github.com/Aniraku/Aniraku" target="_blank" rel="noreferrer" aria-label="GitHub"><FaGithub size={16} /></F.SocialLink>
            <F.SocialLink href="https://discord.gg/aniraku" target="_blank" rel="noreferrer" aria-label="Discord"><FaDiscord size={16} /></F.SocialLink>
          </F.Socials>
        </F.MobileTop>
        <F.MobileLinks>
          {resourceLinks.map((resource, index) => <React.Fragment key={resource.to}><F.MobileLink as={Link} to={resource.to}>{resource.label}</F.MobileLink>{index < resourceLinks.length - 1 && <F.MobileDot>·</F.MobileDot>}</React.Fragment>)}
          <F.MobileDot>·</F.MobileDot>
          <F.MobileLink as="a" href="https://github.com/Aniraku/Aniraku/issues" target="_blank" rel="noreferrer">Report an issue</F.MobileLink>
        </F.MobileLinks>
        <F.TmdbAttribution>
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" aria-label="Visit the official TMDB website"><img src={TMDB_LOGO_URL} alt="TMDB" /></a>
          <span>This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.</span>
        </F.TmdbAttribution>
        <F.Copyright>&copy; 2026 Aniraku · AGPL-3.0 · No media hosting</F.Copyright>
      </F.MobileFooter>

      <F.Bottom>
        <F.Copyright>&copy; 2026 Aniraku Contributors · AGPL-3.0 · Not affiliated with AniList or any studio</F.Copyright>
      </F.Bottom>
    </F.Footer>
  )
}

export default Footer
