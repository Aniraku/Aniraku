import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Footer from '../components/Footer/Footer'
import { AVATAR_LIST, avatarUrl, defaultAvatar } from '../lib/avatars'
import { supabase } from '../lib/supabase'
import { API_BASE } from '../config'
import { generateSlug } from '../lib/slug'

const Profile = () => {
  const { user, profile, loading, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [bookmarks, setBookmarks] = useState([])
  const [history, setHistory] = useState([])
  const [anilistUser, setAnilistUser] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
    }
    const bm = JSON.parse(localStorage.getItem('aniraku-bookmarks') || '[]')
    const hx = JSON.parse(localStorage.getItem('aniraku-watch-history') || '[]')
    setBookmarks(bm)
    setHistory(hx)

    if (user) {
      supabase.from('bookmarks').select('*').eq('user_id', user.id).then(({ data }) => {
        if (data?.length) {
          const mapped = data.map(b => ({
            id: b.anime_id,
            title: b.title,
            image: b.image,
          }))
          setBookmarks(prev => {
            const ids = new Set(mapped.map(m => m.id))
            return [...mapped, ...prev.filter(p => !ids.has(p.id))]
          })
        }
      }).catch(err => console.error('bookmarks fetch error:', err))

      supabase.from('watch_history').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(50).then(({ data }) => {
        if (data?.length) {
          const mapped = data.map(h => ({
            animeId: h.anime_id,
            title: h.anime_title,
            image: h.anime_image,
            episode: h.episode_number,
            time: h.progress,
            timestamp: h.timestamp,
          }))
          setHistory(prev => {
            const merged = [...mapped]
            prev.forEach(p => {
              if (!merged.find(m => m.animeId === p.animeId && m.episode === p.episode)) {
                merged.push(p)
              }
            })
            return merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 50)
          })
        }
      }).catch(err => console.error('watch history fetch error:', err))
    }
  }, [user?.id])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await updateProfile({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim() || username.trim(),
        bio: bio.trim() || null,
      })
      setMessage('Profile updated')
    } catch (err) {
      setMessage(err.message || 'Failed to update')
    }
    setSaving(false)
  }

  const selectAvatar = async (av) => {
    try {
      await updateProfile({ avatar_url: av.url })
      setMessage('Avatar updated')
    } catch (err) {
      setMessage(err.message || 'Failed to set avatar')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/home')
  }

  const removeBookmark = async (id) => {
    const updated = bookmarks.filter(b => b.id !== id)
    setBookmarks(updated)
    localStorage.setItem('aniraku-bookmarks', JSON.stringify(updated))
    if (user) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('anime_id', id)
    }
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('aniraku-watch-history')
    if (user) {
      supabase.from('watch_history').delete().eq('user_id', user.id).then()
    }
  }

  const importAniList = async () => {
    if (!anilistUser.trim()) return
    setImporting(true)
    setMessage('')
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      const res = await fetch(`${API_BASE}/api/v1/import/anilist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ username: anilistUser.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setMessage(data.message || 'AniList import started. Check favorites after a moment.')
    } catch (err) {
      setMessage(err.message || 'Import failed — backend may need auth')
    }
    setImporting(false)
  }

  if (loading) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!user) {
    return (
      <>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-primary)' }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>You are not logged in</h2>
            <Link to="/login" style={{ color: 'var(--bg)', background: 'var(--accent)', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Log In</Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const avatarSrc = avatarUrl(profile?.avatar_url) || defaultAvatar((username || 'u').charCodeAt(0)).url

  return (
    <>
      <div className="profile-page" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', padding: '40px 20px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
            <img src={avatarSrc} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>{displayName || username || 'User'}</h1>
                {user.email_confirmed_at && (
                  <span style={{ background: 'var(--accent)', color: 'var(--bg)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>VERIFIED</span>
                )}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>@{username}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user.email}</p>
            </div>
          </div>

          <div className="profile-tabs" style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto' }}>
            {['profile', 'avatars', 'bookmarks', 'history', 'badges', 'import'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {message && (
            <div style={{ background: 'rgba(var(--accent-rgb, 226,232,240), 0.1)', border: '1px solid rgba(var(--accent-rgb, 226,232,240), 0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: 'var(--accent)', fontSize: 13 }}>
              {message}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-card" style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Edit Profile</h3>
              <label style={labelStyle}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} maxLength={20} />
              <label style={labelStyle}>Display name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} />
              <label style={labelStyle}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              <div className="profile-actions" style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={handleSave} disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <Link to="/settings" style={ghostBtn}>Settings</Link>
                <button onClick={handleSignOut} style={ghostBtn}>Sign Out</button>
              </div>
            </div>
          )}

          {activeTab === 'avatars' && (
            <div className="profile-card" style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>Choose an avatar</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Community presets from the Aniraku avatar library.</p>
              <div className="profile-avatar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 12 }}>
                {AVATAR_LIST.map(av => {
                  const selected = profile?.avatar_url === av.url || profile?.avatar_url?.endsWith(av.name)
                  return (
                    <button
                      key={av.id}
                      onClick={() => selectAvatar(av)}
                      title={av.name}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: selected ? '3px solid var(--accent)' : '3px solid transparent',
                        padding: 0,
                        cursor: 'pointer',
                        background: 'var(--bg-elevated)',
                      }}
                    >
                      <img src={av.url} alt="" onError={(e) => { e.target.src = defaultAvatar(av.id).url }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div>
              {bookmarks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <p>No bookmarks yet</p>
                  <Link to="/home" style={{ color: 'var(--accent)', fontSize: 14, marginTop: 8, display: 'inline-block' }}>Browse Anime</Link>
                </div>
              ) : (
                <div className="profile-bookmark-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                  {bookmarks.map(b => (
                    <div key={b.id} style={{ background: 'var(--bg-card)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <Link to={`/anime/${generateSlug(b.title)}-${b.id}`}>
                        <img src={b.image} alt={b.title} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                      </Link>
                      <div style={{ padding: 10 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</p>
                        <button onClick={() => removeBookmark(b.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', marginTop: 4, padding: 0 }}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <p>No watch history yet</p>
                  <Link to="/home" style={{ color: 'var(--accent)', fontSize: 14, marginTop: 8, display: 'inline-block' }}>Start Watching</Link>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button onClick={clearHistory} style={ghostBtn}>Clear History</button>
                  </div>
                  {history.map(h => (
                    <Link key={h.animeId + '-' + h.episode} to={`/watch/${generateSlug(h.title)}-${h.animeId}-episode-${h.episode}`} className="profile-history-item" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 8, textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                      {h.image && <img src={h.image} alt="" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4 }} />}
                      <span style={{ color: 'var(--text-muted)', fontSize: 13, minWidth: 50 }}>Ep {h.episode}</span>
                      <span style={{ fontSize: 14, flex: 1 }}>{h.title || `Anime ${h.animeId}`}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{h.time ? `${Math.floor(h.time / 60)}m` : ''}</span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="profile-card" style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Achievements</h3>
              <div className="profile-badge-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { icon: '🎬', name: 'First Watch', desc: 'Watch your first episode', unlocked: history.length >= 1 },
                  { icon: '🔥', name: '5 Episodes', desc: 'Watch 5 episodes', unlocked: history.length >= 5 },
                  { icon: '⭐', name: '25 Episodes', desc: 'Watch 25 episodes', unlocked: history.length >= 25 },
                  { icon: '🏆', name: '100 Episodes', desc: 'Watch 100 episodes', unlocked: history.length >= 100 },
                  { icon: '📚', name: 'Bookworm', desc: 'Bookmark 5 anime', unlocked: bookmarks.length >= 5 },
                  { icon: '🎯', name: 'Collector', desc: 'Bookmark 20 anime', unlocked: bookmarks.length >= 20 },
                ].map(b => (
                  <div key={b.name} style={{
                    padding: 16, borderRadius: 10, textAlign: 'center',
                    background: b.unlocked ? 'rgba(var(--accent-rgb, 226,232,240), 0.08)' : 'var(--bg-elevated)',
                    border: `1px solid ${b.unlocked ? 'var(--accent)' : 'var(--border)'}`,
                    opacity: b.unlocked ? 1 : 0.5,
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{b.icon}</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{b.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="profile-card" style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>Import from AniList</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                Import your AniList username to sync favorites and list data into Aniraku.
                Catalog metadata is always live from AniList — this only imports your personal lists.
              </p>
              <label style={labelStyle}>AniList username</label>
              <input type="text" value={anilistUser} onChange={e => setAnilistUser(e.target.value)} placeholder="your_anilist_username" style={inputStyle} />
              <button onClick={importAniList} disabled={importing || !anilistUser.trim()} style={primaryBtn}>
                {importing ? 'Importing…' : 'Import AniList'}
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .profile-header { flex-direction: column; text-align: center; gap: 12px !important; }
          .profile-header img { width: 64px !important; height: 64px !important; }
          .profile-header h1 { font-size: 20px !important; }
          .profile-tabs { gap: 0 !important; }
          .profile-tabs button { padding: 10px 12px !important; font-size: 13px !important; }
          .profile-card { padding: 16px !important; }
          .profile-avatar-grid { grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)) !important; gap: 8px !important; }
          .profile-bookmark-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; gap: 10px !important; }
          .profile-badge-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .profile-badge-grid > div { padding: 12px !important; }
          .profile-badge-grid > div > div:first-child { font-size: 22px !important; }
          .profile-history-item { padding: 8px 10px !important; gap: 10px !important; }
          .profile-history-item img { width: 32px !important; height: 44px !important; }
          .profile-actions { flex-direction: column; }
          .profile-actions button { width: 100%; }
        }
        @media (max-width: 480px) {
          .profile-page { padding: 20px 12px !important; }
          .profile-avatar-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </>
  )
}

const labelStyle = { display: 'block', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }
const inputStyle = {
  width: '100%', maxWidth: 420, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box',
}
const primaryBtn = {
  padding: '10px 24px', background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 8,
  fontWeight: 600, fontSize: 14, cursor: 'pointer',
}
const ghostBtn = {
  padding: '10px 24px', background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: 'none', borderRadius: 8,
  fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}

export default Profile
