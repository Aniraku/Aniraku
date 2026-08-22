import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { FaCopy, FaExternalLinkAlt, FaHeart, FaTimes } from 'react-icons/fa'
import {
  PATREON_URL,
  SUPPORT_FUNDING_COPY,
  SUPPORT_PROMPT_DISMISS_KEY,
  USDT_ASSET,
  USDT_BEP20_ADDRESS,
  USDT_NETWORK,
  USDT_NETWORK_SHORT,
  dismissSupportPrompt,
  isSupportPromptExcluded,
  shouldShowSupportPrompt,
} from '../lib/support'

const TICK_MS = 15_000

function copyAddress() {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(USDT_BEP20_ADDRESS)
  const input = document.createElement('textarea')
  input.value = USDT_BEP20_ADDRESS
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  input.remove()
  return Promise.resolve()
}

const SupportPrompt = () => {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const activeMsRef = useRef(0)
  const activeStartedAtRef = useRef(Date.now())
  const dismissedUntilRef = useRef(0)
  const visibleRef = useRef(typeof document === 'undefined' ? false : document.visibilityState === 'visible')

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    dismissedUntilRef.current = Number(window.localStorage.getItem(SUPPORT_PROMPT_DISMISS_KEY) || 0) || 0

    const openOnRequest = () => setOpen(true)

    const updateVisibility = () => {
      const now = Date.now()
      const isVisible = document.visibilityState === 'visible'
      if (visibleRef.current && !isVisible) activeMsRef.current += now - activeStartedAtRef.current
      if (!visibleRef.current && isVisible) activeStartedAtRef.current = now
      visibleRef.current = isVisible
    }

    document.addEventListener('visibilitychange', updateVisibility)
    window.addEventListener('aniraku:open-support', openOnRequest)
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility)
      window.removeEventListener('aniraku:open-support', openOnRequest)
    }
  }, [])

  useEffect(() => {
    if (isSupportPromptExcluded(pathname)) setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const evaluate = () => {
      if (open || !visibleRef.current) return
      const now = Date.now()
      const elapsed = activeMsRef.current + (now - activeStartedAtRef.current)
      if (shouldShowSupportPrompt({ activeMs: elapsed, pathname, dismissedUntil: dismissedUntilRef.current, now })) setOpen(true)
    }
    evaluate()
    const interval = window.setInterval(evaluate, TICK_MS)
    return () => window.clearInterval(interval)
  }, [open, pathname])

  const dismiss = () => {
    dismissedUntilRef.current = dismissSupportPrompt(window.localStorage)
    setOpen(false)
  }

  const handleCopy = async () => {
    try {
      await copyAddress()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  if (!open) return null

  return <Backdrop role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss() }}>
    <Sheet role="dialog" aria-modal="true" aria-labelledby="support-prompt-title" aria-describedby="support-prompt-copy">
      <Top><Signal aria-hidden="true"><i /><i /><i /><i /></Signal><span>ANIRAKU / COMMUNITY SUPPORT</span><CloseButton type="button" onClick={dismiss} aria-label="Dismiss support prompt"><FaTimes /></CloseButton></Top>
      <Mark aria-hidden="true"><FaHeart /></Mark>
      <h2 id="support-prompt-title">Keep Aniraku<br /><em>moving.</em></h2>
      <p id="support-prompt-copy">If Aniraku has helped you find something to watch, voluntary support funds {SUPPORT_FUNDING_COPY.toLowerCase()}</p>
      <PrimaryLink href={PATREON_URL} target="_blank" rel="noreferrer" onClick={dismiss}><span><FaHeart /> SUPPORT ON PATREON</span><FaExternalLinkAlt /></PrimaryLink>
      <CryptoPanel>
        <CryptoHeading><span>{USDT_ASSET} · {USDT_NETWORK_SHORT}</span><b>OPTIONAL</b></CryptoHeading>
        <CryptoBody><img src="/assets/usdt-bep20-support-qr.png" alt="USDT BNB Smart Chain payment QR code" /><div><strong>{USDT_NETWORK}</strong><code>{USDT_BEP20_ADDRESS}</code><button type="button" onClick={() => void handleCopy()}><FaCopy /> {copied ? 'ADDRESS COPIED' : 'COPY ADDRESS'}</button></div></CryptoBody>
        <CryptoWarning>SEND USDT ON BNB SMART CHAIN (BEP20) ONLY. VERIFY THE NETWORK BEFORE SENDING.</CryptoWarning>
      </CryptoPanel>
      <LaterButton type="button" onClick={dismiss}>NOT NOW · ASK AGAIN IN 7 DAYS</LaterButton>
    </Sheet>
  </Backdrop>
}

const Backdrop = styled.div`
  position: fixed; z-index: 1450; inset: 0; display: grid; align-items: end; justify-items: center; padding: 16px;
  background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px); animation: supportFadeIn 180ms cubic-bezier(0.23, 1, 0.32, 1);
  @keyframes supportFadeIn { from { opacity: 0; } to { opacity: 1; } }
`

const Sheet = styled.section`
  position: relative; width: min(100%, 480px); padding: 16px; overflow: hidden; color: #f6f6f2;
  border: 1px solid #343434; border-bottom: 3px solid #ff4d4d; background: #141414; box-shadow: 0 24px 70px rgba(0,0,0,.62);
  animation: supportSheetIn 240ms cubic-bezier(.23,1,.32,1);
  &::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .35; background-image: linear-gradient(#2a2a2a 1px, transparent 1px), linear-gradient(90deg, #2a2a2a 1px, transparent 1px); background-size: 30px 30px; mask-image: linear-gradient(145deg, black, transparent 62%); }
  > * { position: relative; z-index: 1; }
  h2 { margin: 22px 0 10px; max-width: 350px; font-size: clamp(2.15rem, 8.5vw, 3.1rem); font-weight: 800; letter-spacing: -.075em; line-height: .88; }
  h2 em { color: #ff4d4d; font-style: normal; }
  > p { margin: 0; color: #a2a2a0; font-size: .86rem; line-height: 1.58; }
  @keyframes supportSheetIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
`

const Top = styled.div`
  display: flex; align-items: center; gap: 8px; color: #a2a2a0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .61rem; letter-spacing: .08em;
  > span { flex: 1; }
`

const Signal = styled.span`
  display: grid; grid-template-columns: repeat(2,4px); gap: 3px; width: 11px;
  i { width: 4px; height: 4px; border-radius: 50%; background: #ff4d4d; }
`

const CloseButton = styled.button`
  display: grid; width: 34px; height: 34px; place-items: center; color: #a2a2a0; border: 1px solid #343434; background: #0d0d0d; transition: color 150ms ease, border-color 150ms ease;
  &:hover { color: #f6f6f2; border-color: #f6f6f2; }
`

const Mark = styled.div`
  display: grid; width: 50px; height: 50px; place-items: center; margin-top: 28px; color: #090909; background: #f6f6f2; font-size: 1.35rem;
`

const PrimaryLink = styled.a`
  display: flex; width: 100%; min-height: 54px; align-items: center; justify-content: space-between; margin-top: 17px; padding: 0 15px; color: #090909; background: #f6f6f2; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .7rem; font-weight: 700; letter-spacing: .035em; transition: transform 150ms ease, background 150ms ease;
  span { display: inline-flex; gap: 8px; align-items: center; } &:hover { background: #ff4d4d; } &:active { transform: scale(.98); }
`

const CryptoPanel = styled.div`
  margin-top: 10px; padding: 11px; border: 1px solid #343434; background: #0d0d0d;
`

const CryptoHeading = styled.div`
  display: flex; align-items: center; justify-content: space-between; color: #f6f6f2; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .62rem; letter-spacing: .06em;
  b { color: #96d37b; font-size: .54rem; }
`

const CryptoBody = styled.div`
  display: grid; grid-template-columns: 92px 1fr; gap: 10px; margin-top: 10px; align-items: center;
  img { width: 92px; height: 92px; background: #fff; }
  div { min-width: 0; display: grid; gap: 7px; }
  strong { color: #f6f6f2; font-size: .72rem; }
  code { overflow-wrap: anywhere; color: #a2a2a0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .58rem; line-height: 1.45; }
  button { display: inline-flex; width: fit-content; align-items: center; gap: 6px; padding: 0; color: #f6f6f2; background: transparent; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .58rem; letter-spacing: .04em; } button:hover { color: #ff4d4d; }
  @media (max-width: 360px) { grid-template-columns: 72px 1fr; img { width: 72px; height: 72px; } }
`

const CryptoWarning = styled.p`
  margin: 10px 0 0; color: #ff7777; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .52rem; font-weight: 700; line-height: 1.45; letter-spacing: .035em;
`

const LaterButton = styled.button`
  display: block; width: 100%; margin-top: 7px; padding: 10px; color: #a2a2a0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .61rem; letter-spacing: .06em; &:hover { color: #f6f6f2; }
`

export default SupportPrompt
