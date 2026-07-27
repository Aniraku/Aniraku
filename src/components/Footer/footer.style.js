import styled from 'styled-components'
import { Link } from 'react-router-dom'

export const F = {}

F.Footer = styled.footer`
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 3rem 1.5rem 1.5rem;
  margin-top: 4rem;

  @media (max-width: 768px) {
    padding: 2rem 1rem 1rem;
    margin-top: 2rem;
    padding-bottom: calc(1.5rem + 70px);
  }
`

F.Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

F.Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

F.ColTitle = styled.h4`
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

F.Disclaimer = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 320px;
`

F.Socials = styled.div`
  display: flex;
  gap: 10px;
`

F.SocialLink = styled.a`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.2s;

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--accent-glow);
  }
`

F.ColLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

F.LinkItem = styled.p`
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;

  &:hover { color: var(--accent); }
`

F.AzGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  @media (max-width: 768px) {
    display: none;
  }
`

F.AzLink = styled(Link)`
  padding: 3px 6px;
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: all 0.2s;

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
  }
`

F.Bottom = styled.div`
  max-width: 1200px;
  margin: 2rem auto 0;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  text-align: center;
`

F.Copyright = styled.p`
  font-size: 12px;
  color: var(--text-muted);
`
