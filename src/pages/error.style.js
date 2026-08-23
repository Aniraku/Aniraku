import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const E = {}

E.Container = styled.main`
  position: relative;
  min-height: min(680px, calc(100dvh - var(--header-h)));
  box-sizing: border-box;
  overflow: hidden;
  padding: calc(var(--header-h) + clamp(24px, 5vw, 70px)) var(--content-pad) clamp(36px, 7vw, 88px);
  background:
    radial-gradient(circle at 16% 22%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 22rem),
    radial-gradient(circle at 87% 8%, rgba(125, 92, 232, 0.15), transparent 27rem),
    var(--bg);

  @media (max-width: 768px) {
    min-height: calc(100dvh - var(--header-h));
    padding-top: calc(var(--header-h) + 22px);
    padding-bottom: var(--mobile-dock-clearance);
  }
`

E.Shell = styled.div`
  position: relative;
  z-index: 0;
  display: grid;
  width: min(100%, 860px);
  min-height: min(500px, calc(100dvh - var(--header-h) - 110px));
  margin: 0 auto;
  place-content: center;

  @media (max-width: 768px) {
    min-height: 0;
  }
`

E.Card = styled.section`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(28px, 6vw, 58px);
  border: 1px solid color-mix(in srgb, var(--accent) 24%, var(--border));
  border-radius: clamp(20px, 3.2vw, 34px);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 97%, transparent), color-mix(in srgb, var(--bg-elevated) 84%, transparent)),
    var(--bg-card);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.32);
  text-align: center;

  &::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    border: 1px solid rgba(255,255,255,0.025);
    border-radius: inherit;
    background-image: linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 26px 26px;
    content: '';
    mask-image: linear-gradient(to bottom, black, transparent 88%);
  }
`

E.AmbientMark = styled.div`
  position: absolute;
  z-index: -1;
  top: -0.2em;
  left: 50%;
  color: color-mix(in srgb, var(--accent) 8%, transparent);
  font-size: clamp(170px, 32vw, 340px);
  font-weight: 900;
  letter-spacing: -0.13em;
  line-height: 0.8;
  pointer-events: none;
  transform: translateX(-51%);
  user-select: none;
`

E.Status = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 27px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--accent) 42%, var(--border));
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--accent) 9%, transparent);
  color: var(--accent);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;
`

E.Code = styled.div`
  margin: clamp(16px, 3vw, 24px) 0 4px;
  color: var(--text-primary);
  font-size: clamp(72px, 13vw, 132px);
  font-weight: 900;
  letter-spacing: -0.11em;
  line-height: 0.78;
  text-indent: -0.09em;
`

E.Title = styled.h1`
  max-width: 16ch;
  margin: 18px auto 10px;
  color: var(--text-primary);
  font-size: clamp(27px, 5vw, 48px);
  font-weight: 850;
  letter-spacing: -0.055em;
  line-height: 1.02;
`

E.Text = styled.p`
  max-width: 48ch;
  margin: 0 auto;
  color: var(--text-secondary);
  font-size: clamp(13px, 2.6vw, 15px);
  line-height: 1.65;
`

E.Path = styled.div`
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 7px;
  margin: 18px auto 0;
  padding: 7px 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg) 72%, transparent);
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;

  svg { flex: 0 0 auto; color: var(--accent); }
`

E.Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px;
  margin-top: 24px;

  @media (max-width: 480px) {
    display: grid;
    grid-template-columns: 1fr;
  }
`

const ActionLink = styled(Link)`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease;

  &:hover { transform: translateY(-1px); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
`

E.PrimaryLink = styled(ActionLink)`
  border-color: var(--accent);
  background: var(--accent);
  color: #111;

  &:hover { background: color-mix(in srgb, var(--accent) 88%, white); }
`

E.SecondaryLink = styled(ActionLink)`
  background: color-mix(in srgb, var(--bg-elevated) 76%, transparent);
  color: var(--text-primary);

  &:hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--border)); color: var(--accent); }
`

E.UtilityLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 17px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 750;
  text-decoration: none;

  &:hover { color: var(--accent); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
`

E.Note = styled.p`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  margin: 16px auto 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.5;
  text-align: center;

  @media (max-width: 420px) {
    font-size: 10.5px;
  }
`
