import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  FaArrowLeft,
  FaCompass,
  FaFire,
  FaHome,
  FaSearch,
} from 'react-icons/fa';

// ---------------------------------------------------------------------------
// Rich 404 — port of Aniraku pages/Error.jsx + pages/error.style.js (the
// ambient 404 mark, "Route unavailable" status chip, big code, card, path
// row, actions and the bottom note). Deltas vs the reference:
//  - Copy merges the reference's "This story is off the map." line into the
//    body text and uses "Page not found" as the heading (task wording; the
//    document title stays byte-identical to Error.jsx:11).
//  - Actions target THIS app's routes: Home (/), Search (/search), Trending
//    (/trending) — the reference's /catalog and /random don't exist here.
//  - error.style.js's theme vars (--accent/--bg/--text-*) map onto this
//    build's tokens (--primary-accent/--global-*) and the fixed-header
//    offset (--header-h/--content-pad) is dropped: App already renders this
//    below the fixed navbar with body top padding (globals.css:12).
//  - Error.jsx mounts its own <Footer compact />; App.tsx renders the global
//    Footer for every route, so no second footer is added here.
// ---------------------------------------------------------------------------

const Container = styled.main`
  position: relative;
  min-height: min(680px, calc(100dvh - 7rem));
  box-sizing: border-box;
  overflow: hidden;
  padding: clamp(24px, 5vw, 70px) clamp(8px, 3vw, 24px)
    clamp(36px, 7vw, 88px);
  background:
    radial-gradient(
      circle at 16% 22%,
      color-mix(in srgb, var(--primary-accent) 14%, transparent),
      transparent 22rem
    ),
    radial-gradient(
      circle at 87% 8%,
      rgba(125, 92, 232, 0.15),
      transparent 27rem
    ),
    var(--global-primary-bg);
`;

const Shell = styled.div`
  position: relative;
  z-index: 0;
  display: grid;
  width: min(100%, 860px);
  min-height: min(500px, calc(100dvh - 10rem));
  margin: 0 auto;
  place-content: center;
`;

const Card = styled.section`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(28px, 6vw, 58px);
  border: 1px solid
    color-mix(in srgb, var(--primary-accent) 24%, var(--global-border-color));
  border-radius: clamp(20px, 3.2vw, 34px);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--global-card-bg) 97%, transparent),
      color-mix(in srgb, var(--global-tertiary-bg) 84%, transparent)
    ),
    var(--global-card-bg);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.32);
  text-align: center;

  &::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    border: 1px solid rgba(255, 255, 255, 0.025);
    border-radius: inherit;
    background-image:
      linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.018) 1px,
        transparent 1px
      ),
      linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px);
    background-size: 26px 26px;
    content: '';
    mask-image: linear-gradient(to bottom, black, transparent 88%);
  }
`;

const AmbientMark = styled.div`
  position: absolute;
  z-index: -1;
  top: -0.2em;
  left: 50%;
  color: color-mix(in srgb, var(--primary-accent) 8%, transparent);
  font-size: clamp(170px, 32vw, 340px);
  font-weight: 900;
  letter-spacing: -0.13em;
  line-height: 0.8;
  pointer-events: none;
  transform: translateX(-51%);
  user-select: none;
`;

const Status = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 27px;
  padding: 0 10px;
  border: 1px solid
    color-mix(in srgb, var(--primary-accent) 42%, var(--global-border-color));
  border-radius: 9999px;
  background: color-mix(in srgb, var(--primary-accent) 9%, transparent);
  color: var(--primary-accent);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;
`;

const Code = styled.div`
  margin: clamp(16px, 3vw, 24px) 0 4px;
  color: var(--global-text);
  font-size: clamp(72px, 13vw, 132px);
  font-weight: 900;
  letter-spacing: -0.11em;
  line-height: 0.78;
  text-indent: -0.09em;
`;

const Title = styled.h1`
  max-width: 16ch;
  margin: 18px auto 10px;
  color: var(--global-text);
  font-size: clamp(27px, 5vw, 48px);
  font-weight: 850;
  letter-spacing: -0.055em;
  line-height: 1.02;
`;

const Text = styled.p`
  max-width: 48ch;
  margin: 0 auto;
  color: var(--global-text-muted-strong);
  font-size: clamp(13px, 2.6vw, 15px);
  line-height: 1.65;
`;

const Path = styled.div`
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 7px;
  margin: 18px auto 0;
  padding: 7px 10px;
  overflow: hidden;
  border: 1px solid var(--global-border-color);
  border-radius: 8px;
  background: color-mix(in srgb, var(--global-primary-bg) 72%, transparent);
  color: var(--global-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;

  svg {
    flex: 0 0 auto;
    color: var(--primary-accent);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px;
  margin-top: 24px;

  @media (max-width: 480px) {
    display: grid;
    grid-template-columns: 1fr;
  }
`;

const ActionLink = styled(Link)`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--global-border-color);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease;

  &:hover {
    transform: translateY(-1px);
  }
  &:focus-visible {
    outline: 2px solid var(--primary-accent);
    outline-offset: 3px;
  }
`;

const PrimaryLink = styled(ActionLink)`
  border-color: var(--primary-accent);
  background: var(--primary-accent);
  color: #111;

  &:hover {
    background: color-mix(in srgb, var(--primary-accent) 88%, white);
  }
`;

const SecondaryLink = styled(ActionLink)`
  background: color-mix(in srgb, var(--global-tertiary-bg) 76%, transparent);
  color: var(--global-text);

  &:hover {
    border-color: color-mix(
      in srgb,
      var(--primary-accent) 55%,
      var(--global-border-color)
    );
    color: var(--primary-accent);
  }
`;

const Note = styled.p`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  margin: 16px auto 0;
  color: var(--global-text-muted);
  font-size: 11px;
  line-height: 1.5;
  text-align: center;

  @media (max-width: 420px) {
    font-size: 10.5px;
  }
`;

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = 'Page Not Found — Aniraku';
    // Error.jsx:12-14 — keep the description meta honest for crawlers.
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Page not found on Aniraku — Free Anime Streaming. Browse our catalog to find anime.',
    );
  }, []);

  return (
    <Container id='main'>
      <Shell>
        <Card>
          <AmbientMark aria-hidden='true'>404</AmbientMark>
          <Status>
            <FaCompass size={12} /> Route unavailable
          </Status>
          <Code aria-label='Error code 404'>404</Code>
          <Title>Page not found.</Title>
          <Text>
            This story is off the map — the page you requested is not part of
            Aniraku. Return home or keep exploring the catalog.
          </Text>
          <Path aria-label='Unavailable route'>
            <FaSearch size={11} /> {location.pathname || '/'}
          </Path>
          <Actions>
            <PrimaryLink to='/'>
              <FaHome size={13} /> Back to Home
            </PrimaryLink>
            <SecondaryLink to='/search'>
              <FaSearch size={13} /> Search
            </SecondaryLink>
            <SecondaryLink to='/trending'>
              <FaFire size={13} /> Trending
            </SecondaryLink>
          </Actions>
          <Note>
            <FaArrowLeft size={11} /> The Home route lives at{' '}
            <strong>/</strong>.
          </Note>
        </Card>
      </Shell>
    </Container>
  );
};

export default NotFound;
