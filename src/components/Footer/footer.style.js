import styled from 'styled-components'
import { Link } from 'react-router-dom'

export const F = {}

F.Footer = styled.footer`
  margin-top: clamp(32px, 7vw, 88px);
  padding: clamp(28px, 5vw, 64px) var(--page-gutter) calc(24px + var(--safe-bottom));
  border-top: 1px solid rgba(255,255,255,.09);
  background: linear-gradient(180deg, rgba(15,15,17,.82), #0a0a0b 60%);
  color-scheme: dark;

  @media (max-width: 768px) {
    margin-top: 32px;
    padding-bottom: calc(96px + var(--safe-bottom));
  }
`

F.DesktopGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1.55fr) repeat(3, minmax(130px, 1fr));
  gap: clamp(24px, 4vw, 58px);
  width: min(100%, 1240px);
  margin: 0 auto;

  @media (max-width: 1024px) {
    grid-template-columns: minmax(220px, 1.6fr) repeat(2, minmax(150px, 1fr));
    gap: 30px;
  }

  @media (max-width: 680px) {
    display: none;
  }
`

F.MobileFooter = styled.div`
  display: none;

  @media (max-width: 680px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: min(100%, 420px);
    margin: 0 auto;
    text-align: center;
  }
`

F.MobileTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`

F.MobileLinks = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
  flex-wrap: wrap;
`

F.MobileLink = styled(Link)`
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: .78rem;
  font-weight: 650;
  text-decoration: none;
  &:hover { color: #fff; }
`

F.MobileDot = styled.span`
  color: rgba(255,255,255,.32);
`

F.Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`

F.ColTitle = styled.h4`
  margin: 0;
  color: #fff;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
`

F.ColLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

F.Disclaimer = styled.p`
  max-width: 360px;
  margin: 0;
  color: var(--text-muted);
  font-size: .78rem;
  line-height: 1.65;
`

F.Socials = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

F.TrustLine = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  color: var(--text-muted);
  font-size: .72rem;
  line-height: 1.55;

  a { color: var(--text-secondary); text-decoration: none; }
  a:hover { color: #fff; }
`

F.SocialLink = styled.a`
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 11px;
  color: var(--text-secondary);
  background: rgba(255,255,255,.045);
  transition: color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);

  &:hover { color: #fff; background: rgba(255,255,255,.1); transform: translateY(-1px); }
`

F.LinkItem = styled.p`
  min-height: 30px;
  display: flex;
  align-items: center;
  margin: 0;
  color: var(--text-secondary);
  font-size: .82rem;
  cursor: pointer;
  &:hover { color: #fff; }
`

F.AzGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`

F.AzLink = styled(Link)`
  display: grid;
  place-items: center;
  min-width: 28px;
  min-height: 28px;
  padding: 2px 6px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 7px;
  color: var(--text-secondary);
  background: rgba(255,255,255,.035);
  font-size: .72rem;
  text-decoration: none;
  transition: color var(--transition-fast), background var(--transition-fast);
  &:hover { color: #fff; background: rgba(255,255,255,.09); }
`

F.Bottom = styled.div`
  width: min(100%, 1240px);
  margin: clamp(26px, 4vw, 42px) auto 0;
  padding-top: 18px;
  border-top: 1px solid rgba(255,255,255,.08);
  text-align: center;

  @media (max-width: 680px) { display: none; }
`

F.Copyright = styled.p`
  margin: 0;
  color: var(--text-muted);
  font-size: .72rem;
`
