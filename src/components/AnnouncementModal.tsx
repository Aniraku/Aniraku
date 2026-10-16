// AnnouncementModal — popup for repo-driven site notices
// (`src/data/announcements.json` via lib/announcements). Shows the first
// active, not-yet-dismissed entry shortly after mount (once per id —
// dismissal persists), skipped on /watch/* like the support prompt so
// playback is never interrupted.
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaBullhorn, FaTimes } from 'react-icons/fa';
import {
  dismissAnnouncement,
  nextAnnouncement,
  type Announcement,
} from '../lib/announcements';

const SHOW_DELAY_MS = 1500;

const AnnouncementModal = () => {
  const { pathname } = useLocation();
  const [item, setItem] = useState<Announcement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (pathname.startsWith('/watch/')) return undefined;
    const timer = window.setTimeout(() => {
      setItem(nextAnnouncement());
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!item) return null;

  const close = () => {
    dismissAnnouncement(item.id);
    setItem(null);
  };

  return (
    <Backdrop
      role='presentation'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <Sheet role='dialog' aria-modal='true' aria-labelledby='announcement-title'>
        <Top>
          <Signal aria-hidden='true'>
            <i />
            <i />
            <i />
            <i />
          </Signal>
          <span>ANIRAKU / ANNOUNCEMENT</span>
          <CloseButton type='button' onClick={close} aria-label='Dismiss announcement'>
            <FaTimes />
          </CloseButton>
        </Top>
        <Mark aria-hidden='true'>
          <FaBullhorn />
        </Mark>
        <h2 id='announcement-title'>{item.title}</h2>
        <p>{item.message}</p>
        {item.link && (
          <ActionLink to={item.link} onClick={close}>
            {item.linkLabel || 'Learn more'}
          </ActionLink>
        )}
        <LaterButton type='button' onClick={close}>
          GOT IT · DON&apos;T SHOW AGAIN
        </LaterButton>
      </Sheet>
    </Backdrop>
  );
};

const Backdrop = styled.div`
  position: fixed; z-index: 1450; inset: 0; display: grid; align-items: end; justify-items: center; padding: 16px;
  background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px); animation: announcementFadeIn 180ms cubic-bezier(0.23, 1, 0.32, 1);
  @keyframes announcementFadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

const Sheet = styled.section`
  position: relative; width: min(100%, 440px); padding: 14px; overflow: hidden; color: var(--global-text);
  border: 1px solid var(--global-border-color); border-bottom: 3px solid var(--primary-accent); border-radius: var(--global-border-radius);
  background: var(--global-card-bg); box-shadow: 0 24px 70px rgba(0,0,0,.62);
  animation: announcementSheetIn 240ms cubic-bezier(.23,1,.32,1);
  h2 { margin: 16px 0 8px; max-width: 350px; font-size: clamp(1.6rem, 7vw, 2.2rem); font-weight: 800; letter-spacing: -.04em; line-height: 1; }
  > p { margin: 0; color: var(--global-text-muted); font-size: .85rem; line-height: 1.55; }
  @keyframes announcementSheetIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
`;

const Top = styled.div`
  display: flex; align-items: center; gap: 8px; color: var(--global-text-muted); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .61rem; letter-spacing: .08em;
  > span { flex: 1; }
`;

const Signal = styled.span`
  display: grid; grid-template-columns: repeat(2,4px); gap: 3px; width: 11px;
  i { width: 4px; height: 4px; border-radius: 50%; background: var(--primary-accent); }
`;

const CloseButton = styled.button`
  display: grid; width: 32px; height: 32px; place-items: center; color: var(--global-text-muted); border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius); background: var(--global-div); transition: color 150ms ease, border-color 150ms ease;
  &:hover { color: var(--global-text); border-color: var(--global-text); }
`;

const Mark = styled.div`
  display: grid; width: 44px; height: 44px; place-items: center; margin-top: 20px; color: #fff; background: var(--primary-accent); border-radius: var(--global-border-radius); font-size: 1.2rem;
`;

const ActionLink = styled(Link)`
  display: flex; width: 100%; min-height: 48px; align-items: center; justify-content: center; margin-top: 14px; padding: 0 14px; box-sizing: border-box; color: #fff; background: var(--primary-accent); border-radius: var(--global-border-radius); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .7rem; font-weight: 700; letter-spacing: .035em; text-decoration: none; transition: transform 150ms ease, filter 150ms ease;
  &:hover { filter: brightness(1.1); } &:active { transform: scale(.98); }
`;

const LaterButton = styled.button`
  display: block; width: 100%; margin-top: 7px; padding: 10px; color: var(--global-text-muted); background: transparent; border: none; cursor: pointer; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .61rem; letter-spacing: .06em; &:hover { color: var(--global-text); }
`;

export default AnnouncementModal;
