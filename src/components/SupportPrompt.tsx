// SupportPrompt — verbatim port of the old Aniraku `components/SupportPrompt.jsx`
// (Patreon + Binance panel, 30-min active-time auto-prompt, 7-day dismissal,
// `/watch/*` exclusion, `aniraku:open-support` open event from the navbar heart).
// Copy/brand/IDs kept byte-identical; only TS types added.
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaCopy, FaExternalLinkAlt, FaHeart, FaTimes } from 'react-icons/fa';
import {
  BINANCE_PAY_LABEL,
  BINANCE_PAY_UID,
  PATREON_URL,
  SUPPORT_FUNDING_COPY,
  SUPPORT_PROMPT_DISMISS_KEY,
  dismissSupportPrompt,
  isSupportPromptExcluded,
  shouldShowSupportPrompt,
} from '../lib/support';

const TICK_MS = 15_000;

function copyUid(): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(BINANCE_PAY_UID);
  const input = document.createElement('textarea');
  input.value = BINANCE_PAY_UID;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
  return Promise.resolve();
}

const SupportPrompt = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const activeMsRef = useRef(0);
  const activeStartedAtRef = useRef(Date.now());
  const dismissedUntilRef = useRef(0);
  const visibleRef = useRef(typeof document === 'undefined' ? false : document.visibilityState === 'visible');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    dismissedUntilRef.current = Number(window.localStorage.getItem(SUPPORT_PROMPT_DISMISS_KEY) || 0) || 0;

    const openOnRequest = () => setOpen(true);

    const updateVisibility = () => {
      const now = Date.now();
      const isVisible = document.visibilityState === 'visible';
      if (visibleRef.current && !isVisible) activeMsRef.current += now - activeStartedAtRef.current;
      if (!visibleRef.current && isVisible) activeStartedAtRef.current = now;
      visibleRef.current = isVisible;
    };

    document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('aniraku:open-support', openOnRequest);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      window.removeEventListener('aniraku:open-support', openOnRequest);
    };
  }, []);

  useEffect(() => {
    if (isSupportPromptExcluded(pathname)) setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const evaluate = () => {
      if (open || !visibleRef.current) return;
      const now = Date.now();
      const elapsed = activeMsRef.current + (now - activeStartedAtRef.current);
      if (shouldShowSupportPrompt({ activeMs: elapsed, pathname, dismissedUntil: dismissedUntilRef.current, now })) setOpen(true);
    };
    evaluate();
    const interval = window.setInterval(evaluate, TICK_MS);
    return () => window.clearInterval(interval);
  }, [open, pathname]);

  const dismiss = () => {
    dismissedUntilRef.current = dismissSupportPrompt(window.localStorage);
    setOpen(false);
  };

  const handleCopy = async () => {
    try {
      await copyUid();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (!open) return null;

  return <Backdrop role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss() }}>
    <Sheet role="dialog" aria-modal="true" aria-labelledby="support-prompt-title" aria-describedby="support-prompt-copy">
      <Top><Signal aria-hidden="true"><i /><i /><i /><i /></Signal><span>ANIRAKU / COMMUNITY SUPPORT</span><CloseButton type="button" onClick={dismiss} aria-label="Dismiss support prompt"><FaTimes /></CloseButton></Top>
      <Mark aria-hidden="true"><FaHeart /></Mark>
      <h2 id="support-prompt-title">Keep Aniraku<br /><em>moving.</em></h2>
      <p id="support-prompt-copy">If Aniraku has helped you find something to watch, voluntary support funds {SUPPORT_FUNDING_COPY.toLowerCase()}</p>
      <PrimaryLink href={PATREON_URL} target="_blank" rel="noreferrer" onClick={dismiss}><span><FaHeart /> SUPPORT ON PATREON</span><FaExternalLinkAlt /></PrimaryLink>
      <BinancePanel>
        <BinanceHeading><span>{BINANCE_PAY_LABEL} · UID</span><b>OPTIONAL</b></BinanceHeading>
        <BinanceBody><div><strong>Send via {BINANCE_PAY_LABEL}</strong><code>{BINANCE_PAY_UID}</code><button type="button" onClick={() => void handleCopy()}><FaCopy /> {copied ? 'UID COPIED' : 'COPY UID'}</button></div></BinanceBody>
        <BinanceNote>OPEN BINANCE &gt; PAY &gt; ENTER UID &gt; SEND. NO NETWORK FEES.</BinanceNote>
      </BinancePanel>
      <LaterButton type="button" onClick={dismiss}>NOT NOW · ASK AGAIN IN 7 DAYS</LaterButton>
    </Sheet>
  </Backdrop>
};

const Backdrop = styled.div`
  position: fixed; z-index: 1450; inset: 0; display: grid; align-items: end; justify-items: center; padding: 16px;
  background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px); animation: supportFadeIn 180ms cubic-bezier(0.23, 1, 0.32, 1);
  @keyframes supportFadeIn { from { opacity: 0; } to { opacity: 1; } }
`

const Sheet = styled.section`
  position: relative; width: min(100%, 440px); padding: 14px; overflow: hidden; color: var(--global-text);
  border: 1px solid var(--global-border-color); border-bottom: 3px solid var(--primary-accent); border-radius: var(--global-border-radius);
  background: var(--global-card-bg); box-shadow: 0 24px 70px rgba(0,0,0,.62);
  animation: supportSheetIn 240ms cubic-bezier(.23,1,.32,1);
  &::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .3; background-image: linear-gradient(var(--global-border-color) 1px, transparent 1px), linear-gradient(90deg, var(--global-border-color) 1px, transparent 1px); background-size: 30px 30px; mask-image: linear-gradient(145deg, black, transparent 62%); }
  > * { position: relative; z-index: 1; }
  h2 { margin: 16px 0 8px; max-width: 350px; font-size: clamp(1.9rem, 8vw, 2.6rem); font-weight: 800; letter-spacing: -.05em; line-height: .95; }
  h2 em { color: var(--primary-accent); font-style: normal; }
  > p { margin: 0; color: var(--global-text-muted); font-size: .85rem; line-height: 1.55; }
  @keyframes supportSheetIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
`

const Top = styled.div`
  display: flex; align-items: center; gap: 8px; color: var(--global-text-muted); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .61rem; letter-spacing: .08em;
  > span { flex: 1; }
`

const Signal = styled.span`
  display: grid; grid-template-columns: repeat(2,4px); gap: 3px; width: 11px;
  i { width: 4px; height: 4px; border-radius: 50%; background: var(--primary-accent); }
`

const CloseButton = styled.button`
  display: grid; width: 32px; height: 32px; place-items: center; color: var(--global-text-muted); border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius); background: var(--global-div); transition: color 150ms ease, border-color 150ms ease;
  &:hover { color: var(--global-text); border-color: var(--global-text); }
`

const Mark = styled.div`
  display: grid; width: 44px; height: 44px; place-items: center; margin-top: 20px; color: #fff; background: var(--primary-accent); border-radius: var(--global-border-radius); font-size: 1.2rem;
`

const PrimaryLink = styled.a`
  display: flex; width: 100%; min-height: 48px; align-items: center; justify-content: space-between; margin-top: 14px; padding: 0 14px; box-sizing: border-box; color: #fff; background: var(--primary-accent); border-radius: var(--global-border-radius); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .7rem; font-weight: 700; letter-spacing: .035em; transition: transform 150ms ease, filter 150ms ease;
  span { display: inline-flex; gap: 8px; align-items: center; } &:hover { filter: brightness(1.1); } &:active { transform: scale(.98); }
`

const BinancePanel = styled.div`
  margin-top: 10px; padding: 10px; border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius); background: var(--global-div);
`

const BinanceHeading = styled.div`
  display: flex; align-items: center; justify-content: space-between; color: var(--global-text); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .62rem; letter-spacing: .06em;
  b { color: #96d37b; font-size: .54rem; }
`

const BinanceBody = styled.div`
  display: grid; gap: 10px; margin-top: 10px; align-items: center;
  div { min-width: 0; display: grid; gap: 7px; }
  strong { color: var(--global-text); font-size: .72rem; }
  code { overflow-wrap: anywhere; color: var(--global-text-muted); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .68rem; line-height: 1.45; letter-spacing: .06em; }
  button { display: inline-flex; width: fit-content; align-items: center; gap: 6px; padding: 0; color: var(--global-text); background: transparent; border: none; cursor: pointer; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .58rem; letter-spacing: .04em; } button:hover { color: var(--primary-accent); }
`

const BinanceNote = styled.p`
  margin: 10px 0 0; color: var(--global-text-muted); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .52rem; font-weight: 700; line-height: 1.45; letter-spacing: .035em;
`

const LaterButton = styled.button`
  display: block; width: 100%; margin-top: 7px; padding: 10px; color: var(--global-text-muted); background: transparent; border: none; cursor: pointer; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .61rem; letter-spacing: .06em; &:hover { color: var(--global-text); }
`

export default SupportPrompt;
