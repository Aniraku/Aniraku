import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const E = {}

E.Container = styled.main`
  width: 100%;
  min-height: 100dvh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: max(24px, env(safe-area-inset-top)) var(--content-pad) max(24px, env(safe-area-inset-bottom));
  background: hsl(228, 7%, 14%);
  text-align: center;

  @media (max-width: 768px) {
    justify-content: flex-start;
    padding-top: calc(var(--header-h) + 52px);
    padding-bottom: var(--mobile-dock-clearance);
  }
`

E.Img = styled.img`
  width: min(100%, 320px);
  max-height: min(42dvh, 300px);
  object-fit: contain;
`

E.ErrorText = styled.h1`
  max-width: 28ch;
  margin: 2px 0 0;
  color: #fff;
  font-size: clamp(23px, 5vw, 32px);
  font-weight: 700;
  line-height: 1.16;
`

E.Text = styled.p`
  max-width: 54ch;
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.74);
  font-size: clamp(13px, 2.7vw, 15px);
  font-weight: 400;
  line-height: 1.55;
`

E.BtnLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  min-height: 44px;
  max-width: 100%;
  padding: 0 18px;
  border: 1px solid var(--accent);
  border-radius: var(--radius-full);
  background: var(--accent);
  color: #111;
  font-weight: 750;
  text-decoration: none;

  @media (max-width: 420px) {
    width: min(100%, 300px);
  }
`
