import React, { useEffect, useState, useRef, useCallback } from 'react'
import { FaBars, FaSearch, FaRandom, FaBell, FaRegBell, FaTimes } from 'react-icons/fa'
import { N } from './navbar.style'
import SideBar from './SideBar'
import Logo from '../Logo'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { avatarUrl, defaultAvatar } from '../../lib/avatars'
import axios from 'axios'
import { API_BASE } from '../../config'
import { supabase } from '../../lib/supabase'

const NavBar = () => {
  const [searchValue, setSearchValue] = useState('')
  const [open, setOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const suggestTimer = useRef(null)
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchValue.trim())}`)
      setSearchValue('')
      setSearchFocused(false)
      setShowSuggestions(false)
    }
  }, [searchValue, navigate])

  // Debounced search suggestions
  useEffect(() => {
    if (searchValue.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    clearTimeout(suggestTimer.current)
    setSuggestLoading(true)
    suggestTimer.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/v1/search?q=${encodeURIComponent(searchValue)}`)
        const results = data.results || []
        setSuggestions(results.slice(0, 8))
        setShowSuggestions(results.length > 0)
      } catch {} finally {
        setSuggestLoading(false)
      }
    }, 300)
    return () => clearTimeout(suggestTimer.current)
  }, [searchValue])

  const handleSuggestionClick = useCallback((item) => {
    const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || ''
    if (title) {
      navigate(`/catalog?search=${encodeURIComponent(title)}`)
    } else {
      navigate(`/anime/${item.id}`)
    }
    setSearchValue('')
    setSearchFocused(false)
    setShowSuggestions(false)
  }, [navigate])

  const fetchRandomAnime = useCallback(async () => {
    try {
      const page = Math.floor(Math.random() * 10) + 1
      const { data } = await axios.get(`${API_BASE}/api/v1/browse?page=${page}&perPage=20&sort=POPULARITY_DESC`)
      const items = data?.media || []
      if (items.length > 0) {
        const random = items[Math.floor(Math.random() * items.length)]
        navigate(`/anime/${random.id}`)
      }
    } catch (err) {
      console.error('Failed to fetch random anime:', err)
    }
  }, [navigate])

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false)
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const location = useLocation()
  const isHome = location.pathname === '/home'

  useEffect(() => {
    if (open) {
      document.body.classList.add('body-hidden')
    } else {
      document.body.classList.remove('body-hidden')
    }
  }, [open])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchNotifs = async () => {
      try {
        const { data, error } = await supabase.from('notifications')
          .select('id, type, message, anime_id, created_at, read')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
        if (error) return
        setNotifications(data || [])
      } catch {}
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <N.Nav isScrolled={isScrolled} isHome={isHome}>
      <N.LayoutBg open={open} onClick={() => setOpen(false)} />
      <N.MobileSearchOverlay open={searchFocused} onClick={() => { setSearchFocused(false); setSearchValue('') }} />
      <N.Left>
        <N.MenuBtn onClick={() => setOpen(true)}>
          <FaBars size={20} />
        </N.MenuBtn>
        <SideBar open={open} setOpen={setOpen} />
        <Logo to="/home" height={36} showText />
      </N.Left>

      <N.Center ref={searchRef} focused={searchFocused}>
        <N.SearchWrapper focused={searchFocused} as="form" onSubmit={handleSearchSubmit}>
          <N.SearchIconInner><FaSearch size={14} /></N.SearchIconInner>
          <N.SearchInput
            placeholder="Search anime..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => { setSearchFocused(true); if (suggestions.length > 0) setShowSuggestions(true) }}
          />
        </N.SearchWrapper>

        {/* Search suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <N.Dropdown onClick={() => setShowSuggestions(false)}>
            {suggestions.map(item => {
              const id = item.id
              const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Unknown'
              const poster = item.coverImage?.large || item.images?.jpg?.image_url || ''
              return (
                <N.DropdownItem key={id} onClick={() => handleSuggestionClick(item)}>
                  {poster ? (
                    <N.DropdownImg src={poster} alt="" />
                  ) : (
                    <div style={{ width: 45, height: 63, background: '#222', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                  )}
                  <N.DropdownInfo>
                    <N.DropdownTitle>{title}</N.DropdownTitle>
                    <N.DropdownSub>
                      {item.format || item.type || 'Anime'}
                      {item.averageScore ? ` · ${item.averageScore}%` : ''}
                    </N.DropdownSub>
                    <N.DropdownMeta>
                      {item.episodes ? `Ep ${item.episodes}` : ''}
                      {item.status ? ` · ${item.status}` : ''}
                    </N.DropdownMeta>
                  </N.DropdownInfo>
                </N.DropdownItem>
              )
            })}
          </N.Dropdown>
        )}
      </N.Center>

      <N.Right>
        {!searchFocused && (
          <N.NavItem onClick={() => { setSearchFocused(true); setSearchValue('') }} className="mobile-search-btn" title="Search">
            <FaSearch size={16} />
          </N.NavItem>
        )}
        {searchFocused && (
          <N.NavItem onClick={() => { setSearchFocused(false); setSearchValue('') }} className="mobile-search-btn" title="Close search">
            <FaTimes size={16} />
          </N.NavItem>
        )}
        <N.NavItem onClick={() => navigate('/schedule')} title="Schedule">
          <FaRegBell size={16} />
          <span>Schedule</span>
        </N.NavItem>
        {user && (
          <div ref={notifRef} style={{ position: 'relative' }}>
            <N.NavItem onClick={() => setShowNotifs(!showNotifs)} title="Notifications" style={{ position: 'relative' }}>
              <FaBell size={16} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -4, background: 'var(--accent)', color: 'var(--bg)', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </N.NavItem>
            {showNotifs && (
              <div style={{ position: 'absolute', top: '100%', right: 0, width: 300, maxHeight: 400, overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 1000, marginTop: 8 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>Notifications</div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notifications yet</div>
                ) : notifications.map(n => (
                  <div key={n.id} onClick={() => { setShowNotifs(false); if (n.anime_id) navigate(`/anime/${n.anime_id}`) }} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(var(--accent-rgb, 226,232,240), 0.05)', fontSize: 13, color: 'var(--text-primary)' }}>
                    <p style={{ margin: 0 }}>{n.message}</p>
                    <p style={{ margin: 0, marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <N.NavItem onClick={fetchRandomAnime} title="Random">
          <FaRandom size={16} />
          <span>Random</span>
        </N.NavItem>
        <N.Divider />

        {user ? (
          <Link to="/profile" title={profile?.username || 'Profile'}>
            {profile?.avatar_url ? (
              <N.Avatar src={avatarUrl(profile.avatar_url)} alt="" />
            ) : (
              <N.Avatar src={defaultAvatar((profile?.username || 'u').charCodeAt(0)).url} alt="" />
            )}
          </Link>
        ) : (
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <N.SignIn>Sign In</N.SignIn>
          </Link>
        )}
      </N.Right>
    </N.Nav>
  )
}

export default NavBar
