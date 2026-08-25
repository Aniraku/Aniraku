import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Footer from '../components/Footer/Footer'
import { AVATAR_LIST, avatarUrl, defaultAvatar } from '../lib/avatars'
import { supabase } from '../lib/supabase'
import { generateSlug, titleText } from '../lib/slug'
import {
  getSyncStatus,
  importProviderList,
  exportProviderList,
  describeImport,
  describeExport,
  PROVIDER_LABELS,
} from '../lib/sync'
import ProviderIcon from '../components/ProviderIcon'
import { PageLoader } from '../components/Skeletons/Skeletons'
import {
  clearWatchHistory,
  historyEntryKey,
  removeWatchHistoryEntries,
  subscribeToWatchHistory,
} from '../lib/watchHistory'

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
  const [selectedHistory, setSelectedHistory] = useState(() => new Set())
  const [historyBusy, setHistoryBusy] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  const [syncBusy, setSyncBusy] = useState('') // 'mal-import' | 'mal-export' | ...
  const [syncResult, setSyncResult] = useState({}) // provider -> { type, text, error }
  const [confirmExport, setConfirmExport] = useState('') // provider being confirmed

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  // Load server-side bookmarks (the same table import writes to) as the
  // source of truth, migrating any guest-only local bookmarks up first and
  // keeping localStorage as a mirror.
  const loadServerBookmarks = async () => {
    if (!user) return
    try {
      const { data } = await supabase.from('bookmarks').select('*').eq('user_id', user.id)
      const mapped = (data || []).map(b => ({
        id: b.anime_id,
        title: b.title,
        image: b.image,
      }))
      const cloudIds = new Set(mapped.map(m => m.id))
      let local = []
      try {
        local = JSON.parse(localStorage.getItem('aniraku-bookmarks') || '[]')
      } catch {}
      const localOnly = local.filter(l => !cloudIds.has(l.id))
      if (localOnly.length) {
        await supabase.from('bookmarks').upsert(localOnly.map(l => ({
          user_id: user.id,
          anime_id: l.id,
          title: l.title || '',
          image: l.image || '',
          added_at: Date.now(),
        })), { onConflict: 'user_id,anime_id' })
      }
      const merged = [...mapped, ...localOnly]
      setBookmarks(merged)
      localStorage.setItem('aniraku-bookmarks', JSON.stringify(merged))
    } catch (err) {
      console.error('bookmarks fetch error:', err)
    }
  }

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
      loadServerBookmarks()

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
            const byKey = new Map()
            const merge = (h) => {
              const key = `${h.animeId}-${h.episode}`
              const existing = byKey.get(key)
              if (!existing || (h.timestamp || 0) > (existing.timestamp || 0)) byKey.set(key, h)
            }
            mapped.forEach(merge)
            prev.forEach(merge)
            return [...byKey.values()].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 50)
          })
        }
      }).catch(err => console.error('watch history fetch error:', err))
    }
  }, [user?.id, profile])

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
    navigate('/')
  }

  const removeBookmark = async (id) => {
    const updated = bookmarks.filter(b => b.id !== id)
    setBookmarks(updated)
    localStorage.setItem('aniraku-bookmarks', JSON.stringify(updated))
    if (user) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('anime_id', id)
    }
  }

  const removeHistoryEntries = async (entries) => {
    if (!entries.length || historyBusy) return
    setHistoryBusy(true)
    const keys = new Set(entries.map(historyEntryKey))
    setHistory((prev) => prev.filter((entry) => !keys.has(historyEntryKey(entry))))
    setSelectedHistory((prev) => new Set([...prev].filter((key) => !keys.has(key))))
    try {
      await removeWatchHistoryEntries({ entries, userId: user?.id })
      setMessage(entries.length === 1 ? 'History entry removed' : `${entries.length} history entries removed`)
    } catch (err) {
      console.error('watch history delete error:', err)
      setMessage('Removed from this device; cloud sync will retry when available')
    } finally {
      setHistoryBusy(false)
    }
  }

  const clearHistory = async () => {
    if (historyBusy) return
    setHistoryBusy(true)
    setHistory([])
    setSelectedHistory(new Set())
    try {
      await clearWatchHistory({ userId: user?.id })
      setMessage('Watch history cleared')
    } catch (err) {
      console.error('watch history clear error:', err)
      setMessage('Cleared on this device; cloud sync will retry when available')
    } finally {
      setHistoryBusy(false)
    }
  }

  const toggleHistorySelection = (entry) => {
    const key = historyEntryKey(entry)
    setSelectedHistory((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  useEffect(() => subscribeToWatchHistory((detail) => {
    if (detail.type === 'clear') {
      setHistory([])
      setSelectedHistory(new Set())
      return
    }
    if (detail.type === 'remove' && detail.keys?.length) {
      const keys = new Set(detail.keys)
      setHistory((prev) => prev.filter((entry) => !keys.has(historyEntryKey(entry))))
      setSelectedHistory((prev) => new Set([...prev].filter((key) => !keys.has(key))))
    }
  }), [])

  // ── Library import / export (requires the provider connected in Settings) ──
  const refreshSyncStatus = () => {
    if (!user) return
    getSyncStatus().then((data) => {
      if (data) setSyncStatus(data)
    })
  }

  useEffect(() => {
    if (activeTab === 'import') refreshSyncStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const providerConnected = (provider) => {
    const p = syncStatus?.[provider]
    return !!(p && p.connected)
  }
  const providerUsername = (provider) => syncStatus?.[provider]?.username || ''

  const runImport = async (provider) => {
    const key = `${provider}-import`
    if (syncBusy) return
    setSyncBusy(key)
    setSyncResult((r) => ({ ...r, [provider]: null }))
    const data = await importProviderList(provider)
    setSyncBusy('')
    if (data.error) {
      setSyncResult((r) => ({ ...r, [provider]: { type: 'error', text: data.error } }))
      return
    }
    setSyncResult((r) => ({ ...r, [provider]: { type: 'ok', text: describeImport(data) } }))
    refreshSyncStatus()
    loadServerBookmarks()
  }

  const runExport = async (provider) => {
    const key = `${provider}-export`
    if (syncBusy) return
    setConfirmExport('')
    setSyncBusy(key)
    setSyncResult((r) => ({ ...r, [provider]: null }))
    const data = await exportProviderList(provider)
    setSyncBusy('')
    if (data.error) {
      setSyncResult((r) => ({ ...r, [provider]: { type: 'error', text: data.error } }))
      return
    }
    setSyncResult((r) => ({ ...r, [provider]: { type: 'ok', text: describeExport(data) } }))
  }

  if (loading) return <PageLoader label="Loading profile" />

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
      <main className="profile-page" id="main">
        <div className="profile-shell">
          <header className="profile-header">
            <img className="profile-portrait" src={avatarSrc} alt="" />
            <div className="profile-identity">
              <div className="profile-name-row">
                <h1>{displayName || username || 'User'}</h1>
                {user.email_confirmed_at && (
                  <span style={{ background: 'var(--accent)', color: 'var(--bg)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>VERIFIED</span>
                )}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>@{username}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user.email}</p>
            </div>
          </header>

          <nav className="profile-tabs" aria-label="Profile sections">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'avatars', label: 'Avatars' },
              { id: 'bookmarks', label: 'Bookmarks' },
              { id: 'history', label: 'History' },
              { id: 'badges', label: 'Badges' },
              { id: 'import', label: 'Library' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'is-active' : undefined}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>

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
                <Link to="/profile/settings" style={ghostBtn}>Settings</Link>
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
                  <Link to="/" style={{ color: 'var(--accent)', fontSize: 14, marginTop: 8, display: 'inline-block' }}>Browse Anime</Link>
                </div>
              ) : (
                <div className="profile-bookmark-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
	                  {bookmarks.map(b => {
	                    const bookmarkTitle = titleText(b?.title) || `Anime ${b?.id || ''}`.trim()
	                    return (
	                    <div key={b.id} style={{ background: 'var(--bg-card)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
	                      <Link to={`/anime/${generateSlug(bookmarkTitle)}-${b.id}`}>
	                        <img src={b.image} alt={bookmarkTitle} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
	                      </Link>
	                      <div style={{ padding: 10 }}>
	                        <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookmarkTitle}</p>
	                        <button onClick={() => removeBookmark(b.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', marginTop: 4, padding: 0 }}>Remove</button>
	                      </div>
	                    </div>
	                    )
	                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <p>No watch history yet</p>
                  <Link to="/" style={{ color: 'var(--accent)', fontSize: 14, marginTop: 8, display: 'inline-block' }}>Start Watching</Link>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={history.length > 0 && selectedHistory.size === history.length}
                        onChange={() => setSelectedHistory(selectedHistory.size === history.length ? new Set() : new Set(history.map(historyEntryKey)))}
                        aria-label="Select all Watch History entries"
                      />
                      Select all
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {selectedHistory.size > 0 && (
                        <button
                          onClick={() => removeHistoryEntries(history.filter((entry) => selectedHistory.has(historyEntryKey(entry))))}
                          disabled={historyBusy}
                          style={{ ...ghostBtn, color: '#fca5a5', borderColor: 'rgba(248,113,113,0.35)' }}
                        >
                          Remove {selectedHistory.size}
                        </button>
                      )}
                      <button onClick={clearHistory} disabled={historyBusy} style={ghostBtn}>Clear History</button>
                    </div>
                  </div>
	                  {history.map(h => {
	                    const key = historyEntryKey(h)
	                    const selected = selectedHistory.has(key)
	                    const historyTitle = titleText(h?.title) || `Anime ${h?.animeId || ''}`.trim()
	                    return (
                      <div key={key} className="profile-history-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: selected ? 'rgba(var(--accent-rgb, 226,232,240), 0.09)' : 'var(--bg-card)', borderRadius: 8, marginBottom: 8, color: 'var(--text-primary)', border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}` }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleHistorySelection(h)}
	                          aria-label={`Select ${historyTitle} episode ${h.episode}`}
	                          style={{ flexShrink: 0 }}
	                        />
	                        <Link to={`/watch/${generateSlug(historyTitle)}-${h.animeId}-episode-${h.episode}`} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, textDecoration: 'none', color: 'inherit' }}>
                          {h.image && <img src={h.image} alt="" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
                          <span style={{ color: 'var(--text-muted)', fontSize: 13, minWidth: 42, flexShrink: 0 }}>Ep {h.episode}</span>
	                          <span style={{ fontSize: 14, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{historyTitle}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>{h.time ? `${Math.floor(h.time / 60)}m` : ''}</span>
                        </Link>
                        <button
                          onClick={() => removeHistoryEntries([h])}
                          disabled={historyBusy}
	                          aria-label={`Remove ${historyTitle} episode ${h.episode} from Watch History`}
                          title="Remove this history entry"
                          style={{ background: 'none', border: '1px solid rgba(248,113,113,0.28)', borderRadius: 6, color: '#fca5a5', padding: '6px 8px', fontSize: 12, cursor: historyBusy ? 'wait' : 'pointer', flexShrink: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
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
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>Library</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Move your list between Aniraku and your streaming accounts. Import pulls a
                provider's library into your Aniraku favorites; export writes your favorites
                there as <em>Completed</em>. Both use the connection from{' '}
                <Link to="/profile/settings" style={{ color: 'var(--accent)' }}>Settings → Library Sync</Link>.
              </p>

              {['mal', 'anilist'].map(provider => {
                const connected = providerConnected(provider)
                const result = syncResult[provider]
                const busy = syncBusy === `${provider}-import` || syncBusy === `${provider}-export`
                const confirming = confirmExport === provider
                return (
                  <div
                    key={provider}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: 16,
                      marginBottom: 12,
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: connected ? 'var(--accent)' : 'var(--border)',
                      }}>
                        <ProviderIcon
                          provider={provider}
                          size={22}
                          color={connected ? '#fff' : 'var(--text-muted)'}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 600 }}>{PROVIDER_LABELS[provider]}</span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                            background: connected ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.12)',
                            color: connected ? '#34d399' : 'var(--text-muted)',
                          }}>
                            {connected ? 'Connected' : 'Off'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                          {connected
                            ? `Ready as ${providerUsername(provider) || 'your account'}`
                            : 'Connect this account in Settings to import or export'}
                        </div>
                      </div>
                      {connected && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => runImport(provider)}
                            disabled={busy}
                            style={smallBtn(true)}
                          >
                            {syncBusy === `${provider}-import` ? 'Importing…' : 'Import list'}
                          </button>
                          <button
                            onClick={() => setConfirmExport(provider)}
                            disabled={busy}
                            style={smallBtn(false)}
                          >
                            {syncBusy === `${provider}-export` ? 'Exporting…' : 'Export'}
                          </button>
                        </div>
                      )}
                      {!connected && (
                        <Link to="/profile/settings" style={ghostBtn}>Connect in Settings</Link>
                      )}
                    </div>

                    {result && (
                      <div style={{
                        marginTop: 12, fontSize: 13, lineHeight: 1.5, borderRadius: 8, padding: '8px 12px',
                        background: result.type === 'error'
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(34,197,94,0.08)',
                        border: `1px solid ${result.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.25)'}`,
                        color: result.type === 'error' ? '#fca5a5' : '#86efac',
                      }}>
                        {result.type === 'error' ? '⚠ ' : '✓ '}{result.text}
                      </div>
                    )}

                    {confirming && (
                      <div style={{
                        marginTop: 12, borderRadius: 8, padding: '12px 14px',
                        background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)',
                        fontSize: 13, lineHeight: 1.5,
                      }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
                          Add your Aniraku favorites to your {PROVIDER_LABELS[provider]} library as
                          <strong> Completed</strong>? Already-completed titles are skipped.
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => runExport(provider)} disabled={busy} style={smallBtn(true)}>
                            {syncBusy === `${provider}-export` ? 'Exporting…' : 'Yes, export'}
                          </button>
                          <button onClick={() => setConfirmExport('')} disabled={busy} style={smallBtn(false)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .profile-page {
          width: 100%;
          min-height: calc(100dvh - var(--header-h)) !important;
          padding: clamp(18px, 4vw, 48px) var(--content-pad) clamp(24px, 4vw, 52px) !important;
          background: var(--bg);
          color: var(--text-primary);
          box-sizing: border-box;
        }
        .profile-shell { width: min(100%, 920px); margin: 0 auto; }
        .profile-header {
          display: grid;
          grid-template-columns: 88px minmax(0, 1fr);
          align-items: center;
          gap: clamp(14px, 2.5vw, 24px);
          margin: 0 0 24px;
        }
        .profile-portrait {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--accent);
          background: var(--bg-elevated);
        }
        .profile-identity { min-width: 0; }
        .profile-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .profile-name-row h1 { margin: 0; font-size: clamp(1.3rem, 2.8vw, 1.7rem); line-height: 1.15; }
        .profile-identity p { margin: 4px 0 0; overflow-wrap: anywhere; }
        .profile-tabs {
          display: flex;
          align-items: end;
          gap: 2px;
          margin: 0 0 20px;
          overflow-x: auto;
          border-bottom: 1px solid var(--border);
          scrollbar-width: none;
        }
        .profile-tabs::-webkit-scrollbar { display: none; }
        .profile-tabs button {
          flex: 0 0 auto;
          min-height: 42px;
          padding: 10px 15px;
          border: 0;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: var(--text-muted);
          font-size: .86rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .profile-tabs button:hover, .profile-tabs button:focus-visible { color: var(--text-primary); }
        .profile-tabs button.is-active { color: var(--text-primary); border-bottom-color: var(--accent); }
        .profile-card { min-width: 0; }

        @media (max-width: 768px) {
          .profile-page { padding: 16px 12px 20px !important; }
          .profile-header { grid-template-columns: 64px minmax(0, 1fr); gap: 13px; margin-bottom: 18px; text-align: left; }
          .profile-portrait { width: 64px; height: 64px; }
          .profile-name-row h1 { font-size: 1.25rem; }
          .profile-tabs { margin-inline: -12px; padding-inline: 12px; margin-bottom: 16px; }
          .profile-tabs button { padding: 9px 12px; font-size: .8rem; min-height: 40px; }
          .profile-card { padding: 16px !important; }
          .profile-avatar-grid { grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)) !important; gap: 8px !important; }
          .profile-bookmark-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; gap: 10px !important; }
          .profile-badge-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .profile-badge-grid > div { padding: 12px !important; }
          .profile-badge-grid > div > div:first-child { font-size: 22px !important; }
          .profile-history-item { padding: 8px 10px !important; gap: 10px !important; }
          .profile-history-item img { width: 32px !important; height: 44px !important; }
          .profile-actions { flex-direction: column; }
          .profile-actions > * { width: 100%; }
        }
        @media (max-width: 380px) {
          .profile-header { grid-template-columns: 52px minmax(0, 1fr); }
          .profile-portrait { width: 52px; height: 52px; }
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
const smallBtn = (primary) => ({
  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
  background: primary ? 'var(--accent)' : 'var(--bg-card)',
  color: primary ? 'var(--bg)' : 'var(--text-secondary)',
  borderColor: primary ? 'transparent' : '1px solid var(--border)',
  opacity: 1,
  ...(primary ? {} : { border: '1px solid var(--border)' }),
})

export default Profile
