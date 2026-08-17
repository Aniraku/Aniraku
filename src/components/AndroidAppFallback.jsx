import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { FaAndroid, FaArrowRight, FaDownload, FaExternalLinkAlt, FaGlobe, FaTimes } from 'react-icons/fa'
import {
  ANDROID_APP_INTENT,
  ANDROID_APP_ORION_URL,
  ANDROID_APP_PACKAGE,
  ANDROID_APP_RELEASE_URL,
  dismissFallback,
  isAndroidAppCompatible,
  isFallbackDismissed,
  isFallbackExcludedPath,
} from '../lib/androidAppFallback'

const APP_OPEN_TIMEOUT_MS = 1250

function getCompatibility() {
  if (typeof window === 'undefined') return false

  return isAndroidAppCompatible({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    viewportWidth: window.innerWidth,
    coarsePointer: window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches ?? false,
  })
}

const AndroidAppFallback = () => {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [showInstallHint, setShowInstallHint] = useState(false)
  const appButtonRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined' || isFallbackExcludedPath(pathname) || !getCompatibility() || isFallbackDismissed(window.localStorage)) {
      setOpen(false)
      return undefined
    }

    const timer = window.setTimeout(() => setOpen(true), 850)
    return () => window.clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') dismiss()
    }

    document.body.classList.add('body-hidden')
    window.addEventListener('keydown', handleKeyDown)
    window.setTimeout(() => appButtonRef.current?.focus(), 0)

    return () => {
      document.body.classList.remove('body-hidden')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const dismiss = () => {
    dismissFallback(window.localStorage)
    setOpen(false)
  }

  const noteAppOpenAttempt = () => {
    setShowInstallHint(false)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') setShowInstallHint(true)
    }, APP_OPEN_TIMEOUT_MS)
  }

  if (!open) return null

  return (
    <Backdrop onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss() }} role="presentation">
      <Sheet role="dialog" aria-modal="true" aria-labelledby="android-app-fallback-title" aria-describedby="android-app-fallback-description">
        <SheetTop>
          <Signal aria-label="Aniraku signal"><i /><i /><i /><i /></Signal>
          <span>ANIRAKU / ANDROID READY</span>
          <CloseButton type="button" onClick={dismiss} aria-label="Continue using Aniraku on the web"><FaTimes /></CloseButton>
        </SheetTop>

        <AppMark aria-hidden="true"><FaAndroid /></AppMark>
        <h2 id="android-app-fallback-title">Use the<br /><em>Aniraku app.</em></h2>
        <p id="android-app-fallback-description">This Android device can run the native Aniraku experience with direct playback controls, a synced library, quality selection, and fullscreen viewing.</p>

        <StatusLine><i /> Android 9+ / native app available</StatusLine>

        <PrimaryButton ref={appButtonRef} as="a" href={ANDROID_APP_INTENT} onClick={noteAppOpenAttempt}>
          <span><FaAndroid /> USE ANIRAKU APP</span><FaArrowRight />
        </PrimaryButton>

        {showInstallHint && (
          <InstallHint role="status">
            <span>The app did not open. Install the current build, then try again.</span>
            <a href={ANDROID_APP_RELEASE_URL} target="_blank" rel="noreferrer">GET APK <FaExternalLinkAlt /></a>
          </InstallHint>
        )}

        <ActionRow>
          <a href={ANDROID_APP_RELEASE_URL}><FaDownload /> GET ANDROID APP</a>
          <a href={ANDROID_APP_ORION_URL} target="_blank" rel="noreferrer"><FaGlobe /> ORION STORE</a>
        </ActionRow>

        <WebButton type="button" onClick={dismiss}>CONTINUE ON WEB</WebButton>
        <Footnote>PACKAGE / <code>{ANDROID_APP_PACKAGE}</code> · YOUR CHOICE IS REMEMBERED FOR 30 DAYS.</Footnote>
      </Sheet>
    </Backdrop>
  )
}

const Backdrop = styled.div`
  position: fixed;
  z-index: 1400;
  inset: 0;
  display: grid;
  align-items: end;
  justify-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  animation: appFallbackIn 180ms cubic-bezier(0.23, 1, 0.32, 1);

  @keyframes appFallbackIn { from { opacity: 0; } to { opacity: 1; } }
`

const Sheet = styled.section`
  position: relative;
  width: min(100%, 460px);
  padding: 16px;
  overflow: hidden;
  color: #f6f6f2;
  border: 1px solid #343434;
  border-bottom: 3px solid #ff4d4d;
  background: #141414;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.62);
  animation: appFallbackSheetIn 240ms cubic-bezier(0.23, 1, 0.32, 1);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.35;
    background-image: linear-gradient(#2a2a2a 1px, transparent 1px), linear-gradient(90deg, #2a2a2a 1px, transparent 1px);
    background-size: 30px 30px;
    mask-image: linear-gradient(145deg, black, transparent 62%);
  }

  > * { position: relative; z-index: 1; }

  h2 {
    margin: 22px 0 10px;
    max-width: 350px;
    color: #f6f6f2;
    font-size: clamp(2.15rem, 8.5vw, 3.1rem);
    font-weight: 800;
    letter-spacing: -0.075em;
    line-height: 0.88;
  }

  h2 em { color: #ff4d4d; font-style: normal; }

  > p {
    max-width: 390px;
    margin: 0;
    color: #a2a2a0;
    font-size: 0.86rem;
    line-height: 1.58;
  }

  @keyframes appFallbackSheetIn {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

const SheetTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a2a2a0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.61rem;
  letter-spacing: 0.08em;

  > span { flex: 1; }
`

const Signal = styled.span`
  display: grid;
  grid-template-columns: repeat(2, 4px);
  gap: 3px;
  width: 11px;
  i { width: 4px; height: 4px; border-radius: 50%; background: #ff4d4d; }
`

const CloseButton = styled.button`
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #a2a2a0;
  border: 1px solid #343434;
  background: #0d0d0d;
  transition: color 150ms ease, border-color 150ms ease;
  &:hover { color: #f6f6f2; border-color: #f6f6f2; }
`

const AppMark = styled.div`
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  margin-top: 28px;
  color: #090909;
  background: #f6f6f2;
  font-size: 1.6rem;
`

const StatusLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 18px 0 14px;
  color: #a2a2a0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.61rem;
  letter-spacing: 0.04em;
  i { width: 7px; height: 7px; border-radius: 50%; background: #96d37b; box-shadow: 0 0 0 3px rgba(150, 211, 123, 0.13); }
`

const PrimaryButton = styled.button`
  display: flex;
  width: 100%;
  min-height: 54px;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  color: #090909;
  background: #f6f6f2;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.035em;
  transition: transform 150ms ease, background 150ms ease;
  span { display: inline-flex; gap: 8px; align-items: center; }
  &:hover { background: #ff4d4d; }
  &:active { transform: scale(0.98); }
`

const InstallHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding: 10px;
  color: #d4c1c1;
  border: 1px solid #3f2c2c;
  background: #1a1010;
  font-size: 0.72rem;
  line-height: 1.4;
  a { display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; color: #ff4d4d; font-family: ui-monospace, monospace; font-size: 0.58rem; }
`

const ActionRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 9px;
  a {
    display: inline-flex;
    min-height: 43px;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: #f6f6f2;
    border: 1px solid #343434;
    background: #0d0d0d;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.57rem;
    letter-spacing: 0.035em;
    transition: border-color 150ms ease, color 150ms ease;
  }
  a:hover { color: #ff4d4d; border-color: #ff4d4d; }
`

const WebButton = styled.button`
  display: block;
  width: 100%;
  margin-top: 13px;
  padding: 10px;
  color: #a2a2a0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.61rem;
  letter-spacing: 0.06em;
  &:hover { color: #f6f6f2; }
`

const Footnote = styled.p`
  margin: 0;
  padding-top: 11px;
  color: #666664;
  border-top: 1px solid #2a2a2a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.5rem;
  letter-spacing: 0.045em;
  code { color: #a2a2a0; font-family: inherit; }
`

export default AndroidAppFallback
