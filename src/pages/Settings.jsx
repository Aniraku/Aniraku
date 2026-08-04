import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { FaChevronLeft, FaEye, FaEyeSlash, FaTrash, FaSignOutAlt } from 'react-icons/fa'
import { useAuth } from '../hooks/useAuth'
import { useNsfw } from '../hooks/useNsfw'
import { supabase } from '../lib/supabase'
import Footer from '../components/Footer/Footer'

const Page = styled.div`
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
  min-height: 30px;
  border-radius: var(--radius-full);
  background: ${({ active }) => (active ? 'var(--accent)' : 'var(--border)')};
  transition: background var(--transition-fast);
  cursor: pointer;
  border: none;
  padding: 0;

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

const Settings = () => {
  const { user, loading, signOut } = useAuth()
  const { nsfwEnabled, updateNsfw } = useNsfw()
  const navigate = useNavigate()
  const [confirmArmed, setConfirmArmed] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState('')

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
    localStorage.clear()
    navigate('/home')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/home')
  }

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
        <Page>
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
                <Switch active={nsfwEnabled} onClick={() => updateNsfw(!nsfwEnabled)} aria-label="Toggle NSFW content" role="switch" aria-checked={nsfwEnabled} />
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
      <Page>
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
              <Switch active={nsfwEnabled} onClick={() => updateNsfw(!nsfwEnabled)} aria-label="Toggle NSFW content" role="switch" aria-checked={nsfwEnabled} />
            </Row>
            <Hint>
              When disabled, adult titles are filtered from lists and their pages show a block screen. You can change this at any time.
            </Hint>
          </Card>

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
