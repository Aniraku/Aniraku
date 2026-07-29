import React from 'react'
import { F } from './footer.style'
import { Link } from 'react-router-dom'
import Logo from '../Logo'
import { FaGithub, FaDiscord } from 'react-icons/fa'

const letters = [
  'All', '#', '0-9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
]

const browseLinks = [
  { label: 'Home', to: '/home' },
  { label: 'Catalog', to: '/catalog' },
  { label: 'Schedule', to: '/schedule' },
  { label: 'Most Popular', to: '/catalog?sort=POPULARITY_DESC' },
  { label: 'Top Airing', to: '/catalog?status=RELEASING' },
]

const resourceLinks = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'DMCA', to: '/dmca' },
  { label: 'AGPL License', to: '/license' },
]

const Footer = () => {
  return (
    <F.Footer>
      <F.Grid>
        <F.Col>
          <Logo to="/home" height={36} showText />
          <F.Disclaimer>
            Aniraku is an open-source media client. We do not host, store, or upload video files.
            Stream links are resolved from publicly available third-party sources at playback time.
          </F.Disclaimer>
          <F.Socials>
            <F.SocialLink href="https://github.com/Aniraku/Aniraku" target="_blank" rel="noreferrer"><FaGithub size={18} /></F.SocialLink>
            <F.SocialLink href="https://discord.gg/aniraku" target="_blank" rel="noreferrer"><FaDiscord size={18} /></F.SocialLink>
          </F.Socials>
        </F.Col>

        <F.Col>
          <F.MobileDetails>
            <summary><F.ColTitle as="span">Browse</F.ColTitle></summary>
            <F.ColLinks>
              {browseLinks.map(l => (
                <F.LinkItem key={l.to} as={Link} to={l.to}>{l.label}</F.LinkItem>
              ))}
            </F.ColLinks>
          </F.MobileDetails>
        </F.Col>

        <F.Col>
          <F.MobileDetails>
            <summary><F.ColTitle as="span">Resources</F.ColTitle></summary>
            <F.ColLinks>
              {resourceLinks.map(l => (
                <F.LinkItem key={l.to} as={Link} to={l.to}>{l.label}</F.LinkItem>
              ))}
            </F.ColLinks>
          </F.MobileDetails>
        </F.Col>

        <F.Col className="az-col">
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
      </F.Grid>

      <F.Bottom>
        <F.Copyright>&copy; 2026 Aniraku Contributors · AGPL-3.0 · Not affiliated with AniList or any studio</F.Copyright>
      </F.Bottom>
    </F.Footer>
  )
}

export default Footer
