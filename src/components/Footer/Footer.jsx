import React from 'react'
import { F } from './footer.style'
import { Link } from 'react-router-dom'
import Logo from '../Logo'
import { FaGithub, FaDiscord } from 'react-icons/fa'

const letters = [
  'All', '#', '0-9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
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
            <F.SocialLink href="https://discord.gg/aurelia" target="_blank" rel="noreferrer"><FaDiscord size={18} /></F.SocialLink>
          </F.Socials>
        </F.Col>

        <F.Col>
          <F.ColTitle>Browse</F.ColTitle>
          <F.ColLinks>
            <F.LinkItem as={Link} to="/home">Home</F.LinkItem>
            <F.LinkItem as={Link} to="/catalog">Catalog</F.LinkItem>
            <F.LinkItem as={Link} to="/schedule">Schedule</F.LinkItem>
            <F.LinkItem as={Link} to="/catalog?sort=POPULARITY_DESC">Most Popular</F.LinkItem>
            <F.LinkItem as={Link} to="/catalog?status=RELEASING">Top Airing</F.LinkItem>
          </F.ColLinks>
        </F.Col>

        <F.Col>
          <F.ColTitle>Resources</F.ColTitle>
          <F.ColLinks>
            <F.LinkItem as={Link} to="/privacy">Privacy</F.LinkItem>
            <F.LinkItem as={Link} to="/terms">Terms</F.LinkItem>
            <F.LinkItem as={Link} to="/dmca">DMCA</F.LinkItem>
            <F.LinkItem as={Link} to="/license">AGPL License</F.LinkItem>
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
      </F.Grid>

      <F.Bottom>
        <F.Copyright>&copy; 2026 Aniraku Contributors · AGPL-3.0 · Not affiliated with AniList or any studio</F.Copyright>
      </F.Bottom>
    </F.Footer>
  )
}

export default Footer
