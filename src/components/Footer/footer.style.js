import styled from 'styled-components'
import { Link } from 'react-router-dom'

export const F = {}

F.Footer = styled.footer`
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 3rem 1.5rem 1.5rem;
  margin-top: 4rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem 4rem;
    margin-top: 2rem;
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
    gap: 1rem;
  }
`

F.Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

F.ColTitle = styled.h4`
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
`

F.ColLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

F.MobileDetails = styled.details`
  @media (min-width: 769px) {
    &[open] { display: contents; }
  }
  @media (max-width: 768px) {
    summary { list-style: none; cursor: pointer; display: flex; align-items: center; padding: 8px 0; }
    summary::-webkit-details-marker { display: none; }
    summary::after { content: '+'; font-size: 14px; color: var(--text-muted); margin-left: auto; }
    &[open] summary::after { content: '−'; }
  }
`

F.Disclaimer = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 320px;
  margin: 0;
`

F.Socials = styled.div`
  display: flex;
  gap: 8px;
`

F.SocialLink = styled.a`
  width: 32px;
  height: 32px;
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

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`

F.LinkItem = styled.p`
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
  margin: 0;

  &:hover { color: var(--accent); }

  @media (max-width: 768px) {
    font-size: 12px;
  }
`

F.AzGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  @media (max-width: 768px) {
    display: none;
  }
`

F.AzLink = styled(Link)`
  padding: 2px 5px;
  font-size: 11px;
  color: var(--text-secondary);
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
  }
`

F.Bottom = styled.div`
  max-width: 1200px;
  margin: 1.5rem auto 0;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  text-align: center;
`

F.Copyright = styled.p`
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
`
