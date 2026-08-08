import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { FaChevronLeft, FaEye, FaEyeSlash, FaTrash, FaSignOutAlt, FaLink, FaUnlink, FaCheck } from 'react-icons/fa'
import { useAuth } from '../hooks/useAuth'
import { useNsfw } from '../hooks/useNsfw'
import { supabase } from '../lib/supabase'
import Footer from '../components/Footer/Footer'
import { getSyncStatus, syncAuthorize, syncDisconnect, PROVIDER_LABELS } from '../lib/sync'

// Clear only this site's data. localStorage.clear() wipes every other app
// on the same origin scope — and on the deployed site that origin is shared
// with the whole site, so wipe only what Aniraku owns.
const clearAnirakuStorage = () => {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('aniraku-') || k.startsWith('sb-'))) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
  } catch {}
}

const Page = styled.main`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  padding: 40px 20px calc(40px + env(safe-area-inset-bottom, 0));

  @media (max-width: 480px) {
    padding: 24px 16px calc(32px + env(safe-area-inset-bottom, 0));
  }
`

const Container = styled.div`
  max-width: 640px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`

const BackBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  color: var(--text-primary);
  transition: border-color var(--transition-fast), background var(--transition-fast);
  &:hover {
    border-color: var(--border-hover);
    background: var(--bg-elevated);
  }
`

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
`

const Subtitle = styled.p`
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 24px;
`

const Card = styled.section`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    padding: 16px;
  }
`

const CardTitle = styled.h2`
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  margin-bottom: 16px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const RowLabel = styled.div`
  min-width: 0;
  h3 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  p {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
  }
`

const Switch = styled.button`
  position: relative;
  flex: 0 0 auto;
  width: 52px;
  height: 30px;
  min-height: 44px;
  border-radius: var(--radius-full);
  background: ${({ active }) => (active ? 'var(--accent)' : 'var(--border)')};
  transition: background var(--transition-fast);
  cursor: pointer;
  border: none;
  padding: 0;
  &:disabled { opacity: 0.55; cursor: wait; }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    margin-top: -12px;
    left: ${({ active }) => (active ? '25px' : '3px')};
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${({ active }) => (active ? '#000' : '#fff')};
    transition: left var(--transition-fast);
  }
`

const Hint = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
`

const DangerBtn = styled.button`
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #ef4444;
  border-radius: var(--radius-md);
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: ${p => p.$disabled ? 'wait' : 'pointer'};
  opacity: ${p => p.$disabled ? 0.6 : 1};
  &:hover { background: rgba(239, 68, 68, 0.2); }
`

const DangerInput = styled.input`
  width: 100%;
  max-width: 220px;
  padding: 10px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #ef4444; }

  @media (max-width: 480px) {
    max-width: 100%;
  }
`

const DangerMsg = styled.p`
  font-size: 13px;
  color: #ef4444;
  margin-top: 10px;
`

const SyncRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;

  &:last-child { border-bottom: none; }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const SyncBadge = styled.span`
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  margin-left: 6px;
  vertical-align: 2px;
  background: ${({ ok }) => (ok ? 'rgba(34,197,94,0.15)' : 'var(--bg-elevated)')};
  color: ${({ ok }) => (ok ? '#86efac' : 'var(--text-muted)')};
`

const SyncBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${({ primary }) => (primary ? 'var(--accent)' : 'var(--bg-elevated)')};
  color: ${({ primary }) => (primary ? 'var(--bg)' : 'var(--text-primary)')};
  border: 1px solid ${({ primary }) => (primary ? 'var(--accent)' : 'var(--border)')};
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: ${({ $busy }) => ($busy ? 'wait' : 'pointer')};
  opacity: ${({ $busy }) => ($busy ? 0.6 : 1)};
  min-height: 44px;
  justify-content: center;
`

const Settings = () => {
  const { user, loading, signOut } = useAuth()
  const { nsfwEnabled, updateNsfw } = useNsfw()
  const navigate = useNavigate()
  const [confirmArmed, setConfirmArmed] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState('')
  const [nsfwSaving, setNsfwSaving] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 2500)
  }, [])

  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  const handleNsfwToggle = async (next) => {
    if (nsfwSaving) return
    setNsfwSaving(true)
    try {
      await updateNsfw(next)
      showToast(next ? 'NSFW content enabled' : 'NSFW content hidden')
    } catch (err) {
      console.error('Save NSFW setting:', err)
      showToast('Could not save — check your connection and try again')
    } finally {
      setNsfwSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || confirmText !== 'DELETE' || deleting) return
    setDeleting(true)
    setDeleteErr('')
    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      console.error('Delete account:', error)
      setDeleteErr(error.message || 'Failed to delete account')
      setDeleting(false)
      return
    }
    clearAnirakuStorage()
    navigate('/home')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      showToast('Signed out')
      navigate('/home')
    } catch (err) {
      console.error('Sign out:', err)
      showToast('Could not sign out — try again')
    }
  }

  // ── MAL / AniList watch-progress sync ───────────────────────
  const [syncStatus, setSyncStatus] = useState(null)
  const [syncBusy, setSyncBusy] = useState({})
  const [syncVersion, setSyncVersion] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getSyncStatus().then((data) => {
      if (!cancelled && data) setSyncStatus(data)
    })
    return () => { cancelled = true }
  }, [user, syncVersion])

  const syncProviderStatus = (provider) => {
    const p = syncStatus?.[provider]
    return {
      connected: !!(p && p.connected),
      username: p?.username || '',
      reason: p?.reason || '',
    }
  }

  const handleConnect = async (provider) => {
    if (syncBusy[provider]) return
    setSyncBusy((b) => ({ ...b, [provider]: true }))
    try {
      const url = await syncAuthorize(provider)
      if (!url) {
        showToast('Sync is not set up on the server yet')
        return
      }
      window.location.href = url
    } finally {
      setSyncBusy((b) => ({ ...b, [provider]: false }))
    }
  }

  const handleDisconnect = async (provider) => {
    if (syncBusy[provider]) return
    setSyncBusy((b) => ({ ...b, [provider]: true }))
    const ok = await syncDisconnect(provider)
    setSyncBusy((b) => ({ ...b, [provider]: false }))
    if (ok) {
      setSyncVersion((v) => v + 1)
      showToast(`${PROVIDER_LABELS[provider]} disconnected`)
    } else {
      showToast('Could not disconnect — try again')
    }
  }

  const renderSyncCard = () => (
    <Card>
      <CardTitle>Library Sync</CardTitle>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
        Keep Aniraku in step with your MyAnimeList and AniList libraries.
        When you finish an episode here, your progress is pushed to every
        connected service automatically.
      </p>
      {['mal', 'anilist'].map((provider) => {
        const { connected, username, reason } = syncProviderStatus(provider)
        const busy = !!syncBusy[provider]
        return (
          <SyncRow key={provider}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {PROVIDER_LABELS[provider]}
              <SyncBadge ok={connected}>{connected ? 'Connected' : 'Off'}</SyncBadge>
              {connected && username && (
                <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>
                  Syncing as <strong style={{ color: 'var(--text-secondary)' }}>{username}</strong>
                </div>
              )}
              {!connected && reason && (
                <div style={{ fontSize: 12, fontWeight: 400, color: '#fca5a5', marginTop: 2 }}>
                  {reason}
                </div>
              )}
            </div>
            {connected ? (
              <SyncBtn $busy={busy} onClick={() => handleDisconnect(provider)}>
                <FaUnlink size={13} /> {busy ? 'Disconnecting…' : 'Disconnect'}
              </SyncBtn>
            ) : (
              <SyncBtn primary $busy={busy} onClick={() => handleConnect(provider)}>
                <FaLink size={13} /> Connect
              </SyncBtn>
            )}
          </SyncRow>
        )
      })}
      <Hint>
        Connecting opens {`${PROVIDER_LABELS.mal}`} / {`${PROVIDER_LABELS.anilist}`} in a new tab
        and asks only for permission to update your library list — no password is
        ever shared with Aniraku.
      </Hint>
    </Card>
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Page id="main">
          {toast && (
            <div role="status" aria-live="polite" style={{
              position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.88)', color: '#e2e8f0', padding: '8px 20px',
              borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999,
              border: '1px solid rgba(226,232,240,0.12)', backdropFilter: 'blur(8px)',
              pointerEvents: 'none', whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 32px)',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{toast}</div>
          )}
          <Container>
            <Title>Settings</Title>
            <Subtitle>
              Guest preferences are stored on this device only.{' '}
              <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link> to sync them to your account.
            </Subtitle>
            <Card>
              <CardTitle>Content</CardTitle>
              <Row>
                <RowLabel>
                  <h3>{nsfwEnabled ? <><FaEye size={13} /> NSFW content shown</> : <><FaEyeSlash size={13} /> NSFW content hidden</>}</h3>
                  <p>Show adult-rated titles in browsing and search results.</p>
                </RowLabel>
                <Switch active={nsfwEnabled} disabled={nsfwSaving} onClick={() => handleNsfwToggle(!nsfwEnabled)} aria-label="Toggle NSFW content" role="switch" aria-checked={nsfwEnabled} />
              </Row>
            </Card>
          </Container>
        </Page>
        <Footer />
        <div className="bottom-nav-spacer" />
      </>
    )
  }

  return (
    <>
      <Page id="main">
        {toast && (
          <div role="status" aria-live="polite" style={{
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.88)', color: '#e2e8f0', padding: '8px 20px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999,
            border: '1px solid rgba(226,232,240,0.12)', backdropFilter: 'blur(8px)',
            pointerEvents: 'none', whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 32px)',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{toast}</div>
        )}
        <Container>
          <Header>
            <BackBtn to="/profile" aria-label="Back to profile"><FaChevronLeft size={16} /></BackBtn>
            <Title>Settings</Title>
          </Header>
          <Subtitle>Preferences are saved to your account and follow you across devices.</Subtitle>

          <Card>
            <CardTitle>Content</CardTitle>
            <Row>
              <RowLabel>
                <h3>{nsfwEnabled ? <><FaEye size={13} /> NSFW content shown</> : <><FaEyeSlash size={13} /> NSFW content hidden</>}</h3>
                <p>Show adult-rated titles in browsing, search and recommendations.</p>
              </RowLabel>
              <Switch active={nsfwEnabled} disabled={nsfwSaving} onClick={() => handleNsfwToggle(!nsfwEnabled)} aria-label="Toggle NSFW content" role="switch" aria-checked={nsfwEnabled} />
            </Row>
            <Hint>
              When disabled, adult titles are filtered from lists and their pages show a block screen. You can change this at any time.
            </Hint>
            {nsfwSaving && (
              <Hint style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                Saving to your account…
              </Hint>
            )}
          </Card>

          {renderSyncCard()}

          <Card>
            <CardTitle>Account</CardTitle>
            <Row>
              <RowLabel>
                <h3>Profile</h3>
                <p>Username, display name, avatar, bookmarks and watch history.</p>
              </RowLabel>
              <button onClick={() => navigate('/profile')} className="settings-row-btn" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Open Profile</button>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <RowLabel>
                <h3>Sign out</h3>
                <p>End this session on this device.</p>
              </RowLabel>
              <button onClick={handleSignOut} className="settings-row-btn" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <FaSignOutAlt size={13} /> Sign Out
              </button>
            </Row>
          </Card>

          <Card style={{ borderColor: 'rgba(239, 68, 68, 0.35)' }}>
            <CardTitle style={{ color: '#ef4444' }}>Danger Zone</CardTitle>
            <Row>
              <RowLabel>
                <h3>Delete account</h3>
                <p>Permanently removes your profile, watch history, bookmarks, comments and settings. This cannot be undone.</p>
              </RowLabel>
              {!confirmArmed ? (
                <DangerBtn onClick={() => setConfirmArmed(true)}><FaTrash size={13} /> Delete Account</DangerBtn>
              ) : (
                <div className="settings-confirm" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <DangerInput
                    type="text"
                    aria-label="Type DELETE to confirm"
                    placeholder='Type "DELETE" to confirm'
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    autoFocus
                  />
                  <DangerBtn $disabled={deleting || confirmText !== 'DELETE'} onClick={handleDelete}>
                    {deleting ? 'Deleting…' : 'Permanently Delete'}
                  </DangerBtn>
                </div>
              )}
            </Row>
            {deleteErr && <DangerMsg>{deleteErr}</DangerMsg>}
          </Card>
        </Container>
      </Page>
        <Footer />
        <div className="bottom-nav-spacer" />
        <style>{`
          @media (max-width: 480px) {
            .settings-row-btn { width: 100% !important; justify-content: center; }
            .settings-confirm { width: 100% !important; align-items: stretch !important; }
          }
        `}</style>
      </>
    )
}

export default Settings
