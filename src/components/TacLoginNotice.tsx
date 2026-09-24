// TacLoginNotice — one-per-device popup explaining TAC's separate sign-in.
//
// Comments are powered by The Anime Community (third-party widget). Its login
// lives in TAC's own per-browser cookies, so an Aniraku login does NOT carry
// over — on a new device the user must sign in to TAC again to post and see
// their comment history. This notice tells logged-in users that, once.
//
// Dismissal persists in localStorage, which is itself per-device: a new
// device has fresh storage, so the notice correctly reappears there.
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FaComments, FaTimes } from 'react-icons/fa';
import { useAuth as useSupabaseAuth } from '../hooks/useAuth';
import { registerOverlayHandler } from './overlayStack';

const DISMISS_KEY = 'aniraku:tac-login-notice-dismissed';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.65);
`;

const Card = styled.div`
  position: relative;
  width: min(26rem, 100%);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-card-bg);
  color: var(--global-text);
  padding: 1.25rem 1.25rem 1rem;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
`;

const Close = styled.button`
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--global-text-muted);
  cursor: pointer;
  &:hover {
    color: var(--global-text);
  }
`;

const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 2rem 0.6rem 0;
  font-size: 1.05rem;
  line-height: 1.3;
`;

const Body = styled.p`
  margin: 0 0 1rem;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--global-text-muted);
  & strong {
    color: var(--global-text);
    font-weight: 600;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
`;

const GotIt = styled.button`
  border: 0;
  border-radius: var(--global-border-radius);
  background: var(--primary-accent);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.55rem 1.2rem;
  cursor: pointer;
`;

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    // Storage unavailable (private mode) — treat as dismissed so we never
    // nag in a loop the device cannot remember.
    return true;
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // Private mode — dismissal simply won't stick; harmless.
  }
}

export default function TacLoginNotice() {
  const supabaseAuth = useSupabaseAuth();
  const loggedIn = supabaseAuth?.user != null;
  const [open, setOpen] = useState(false);

  // Show once per device, shortly after a logged-in user reaches comments.
  useEffect(() => {
    if (!loggedIn || readDismissed()) return undefined;
    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [loggedIn]);

  // Escape closes the top-most overlay via the shared stack (no persist —
  // explicit Got it / X is what records the dismissal).
  useEffect(() => {
    if (!open) return undefined;
    return registerOverlayHandler(() => setOpen(false));
  }, [open ]);

  if (!open) return null;

  const dismiss = () => {
    writeDismissed();
    setOpen(false);
  };

  return (
    <Overlay onClick={() => setOpen(false)}>
      <Card
        role="dialog"
        aria-modal="true"
        aria-label="Comments sign-in notice"
        onClick={(e) => e.stopPropagation()}
      >
        <Close type="button" onClick={dismiss} aria-label="Dismiss">
          <FaTimes />
        </Close>
        <Title>
          <FaComments aria-hidden="true" /> Comments need a separate sign-in
        </Title>
        <Body>
          You&apos;re logged in to <strong>Aniraku</strong>, but comments are
          powered by <strong>The Anime Community</strong> — sign in there once
          on <strong>this device</strong> to post and get your comment history
          back. You&apos;ll need to do it again on any new device.
        </Body>
        <Actions>
          <GotIt type="button" onClick={dismiss}>
            Got it
          </GotIt>
        </Actions>
      </Card>
    </Overlay>
  );
}
