import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaHome, FaThLarge, FaCalendarAlt, FaUser, FaArrowLeft, FaTimes, FaSearch } from 'react-icons/fa'
import styled from 'styled-components'

const Bar = styled.nav`
  position: fixed;
  inset: auto 12px calc(10px + env(safe-area-inset-bottom, 0px));
  z-index: var(--z-nav);
  display: none;
  align-items: stretch;
  justify-content: center;
  width: auto;
  max-width: 520px;
  margin: 0 auto;
  padding: 5px;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 18px;
  background: rgba(18,18,21,.94);
  box-shadow: 0 14px 42px rgba(0,0,0,.48);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);

  @media (max-width: 768px) { display: flex; }
  @media (max-width: 360px) { inset-inline: 8px; border-radius: 16px; }
`

const Item = styled.button`
  display: grid;
  place-items: center;
  align-content: center;
  gap: 3px;
  flex: 1 1 0;
  min-width: 0;
  min-height: 48px;
  padding: 6px 4px;
  border-radius: 13px;
  color: ${({ $active }) => ($active ? '#fff' : 'var(--text-muted)')};
  background: ${({ $active }) => ($active ? 'rgba(255,255,255,.12)' : 'transparent')};
  font-size: 10px;
  font-weight: ${({ $active }) => ($active ? 750 : 600)};
  line-height: 1;
  transition: color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);

  &:active { transform: scale(.96); }
  &:hover { color: #fff; }

  span { overflow: hidden; max-width: 100%; text-overflow: ellipsis; white-space: nowrap; }

  @media (max-width: 360px) {
    min-height: 46px;
    font-size: 9px;
  }
`

const CompactBar = styled(Bar)`
  max-width: 280px;
  justify-content: center;
`

const SearchOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  align-items: end;
  padding: max(16px, env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px));
  background: rgba(0,0,0,.74);
  backdrop-filter: blur(9px);
  -webkit-backdrop-filter: blur(9px);
`

const SearchSheet = styled.section`
  width: min(100%, 560px);
  margin: 0 auto;
  padding: clamp(18px, 5vw, 28px);
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 22px;
  background: #141417;
  box-shadow: 0 22px 70px rgba(0,0,0,.52);
`

const SearchHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h2 { margin: 0; color: #fff; font-size: clamp(1.1rem, 5vw, 1.35rem); }
  p { margin: 4px 0 0; color: var(--text-muted); font-size: .82rem; }
`

const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 12px;
  color: #fff;
`

const SearchForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;

  input {
    min-width: 0;
    min-height: 50px;
    padding: 0 14px;
    border: 1px solid rgba(255,255,255,.17);
    border-radius: 12px;
    background: rgba(255,255,255,.07);
    color: #fff;
  }

  button {
    min-width: 50px;
    min-height: 50px;
    padding: 0 16px;
    border-radius: 12px;
    background: var(--accent);
    color: #080808;
    font-weight: 800;
  }

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
    button { width: 100%; }
  }
`

const focusedRoutes = new Set(['/login', '/signup', '/auth/forgot-password', '/auth/new-password', '/privacy', '/terms', '/dmca', '/license', '/community-guidelines'])

const MobileBottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleSearchSubmit = event => {
    event.preventDefault()
    const cleanQuery = query.trim()
    if (!cleanQuery) return
    navigate(`/catalog?search=${encodeURIComponent(cleanQuery)}`)
    setQuery('')
    setSearchOpen(false)
  }

  if (focusedRoutes.has(path)) return null

  const detailRoute = path.startsWith('/anime/') || path.startsWith('/watch/')
  if (detailRoute) {
    return (
      <CompactBar aria-label="Focused page navigation">
        <Item type="button" onClick={() => navigate(-1)} aria-label="Go back"><FaArrowLeft size={16} /><span>Back</span></Item>
        <Item type="button" $active={false} onClick={() => navigate('/home')} aria-label="Go to Home"><FaHome size={16} /><span>Home</span></Item>
        <Item type="button" $active={false} onClick={() => navigate('/catalog')} aria-label="Go to Catalog"><FaThLarge size={16} /><span>Catalog</span></Item>
      </CompactBar>
    )
  }

  const items = [
    { icon: FaHome, label: 'Home', to: '/home' },
    { icon: FaThLarge, label: 'Catalog', to: '/catalog' },
    { icon: FaCalendarAlt, label: 'Schedule', to: '/schedule' },
    { icon: FaSearch, label: 'Search', action: () => setSearchOpen(true) },
    { icon: FaUser, label: 'Profile', to: '/profile' },
  ]

  return (
    <>
      <Bar aria-label="Mobile navigation">
        {items.map(({ icon: Icon, label, to, action }) => {
          const active = Boolean(to && (path === to || path.startsWith(`${to}/`) || (to === '/home' && path === '/')))
          return (
            <Item key={label} type="button" $active={active} onClick={action || (() => navigate(to))} aria-label={label} aria-current={active ? 'page' : undefined}>
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </Item>
          )
        })}
      </Bar>

      {searchOpen && (
        <SearchOverlay role="dialog" aria-modal="true" aria-label="Search Aniraku">
          <SearchSheet>
            <SearchHeader>
              <div><h2>Find your next anime</h2><p>Search titles, characters, or genres.</p></div>
              <CloseButton type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><FaTimes size={16} /></CloseButton>
            </SearchHeader>
            <SearchForm onSubmit={handleSearchSubmit}>
              <input ref={inputRef} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search anime" aria-label="Search anime" />
              <button type="submit"><FaSearch size={14} aria-hidden="true" /><span>Search</span></button>
            </SearchForm>
          </SearchSheet>
        </SearchOverlay>
      )}
    </>
  )
}

export default MobileBottomNav
