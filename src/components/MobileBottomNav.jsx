import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaHome, FaThLarge, FaCalendarAlt, FaRandom, FaUser, FaArrowLeft, FaTimes, FaSearch } from 'react-icons/fa'
import styled from 'styled-components'

const Bar = styled.nav`
  display: none;
  position: fixed;
  bottom: calc(12px + env(safe-area-inset-bottom, 0));
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 9999px;
  padding: 6px 10px;
  gap: 4px;
  z-index: 80;
  box-shadow: 0 6px 28px rgba(0,0,0,0.6);

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
  }

  @media (max-width: 1024px) and (hover: none) and (pointer: coarse) {
    display: flex;
    align-items: center;
  }
`

const Item = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  color: ${({ active }) => (active ? '#fff' : 'var(--text-muted)')};
  cursor: pointer;
  padding: 8px 10px;
  min-height: 44px;
  min-width: 44px;
  border-radius: 9999px;
  font-size: 10px;
  transition: all 0.2s;

  ${({ active }) => active && `
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
  `}

  &:hover { color: #fff; }

  span {
    font-size: 9px;
    font-weight: 500;
  }

  @media (max-width: 420px) {
    padding: 6px 8px;
    min-width: 40px;
  }
`

const SearchOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 24px;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

const MobileBottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const isAnimeDetail = path.startsWith('/anime/') || path.startsWith('/watch/')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchOpen(false)
      navigate(`/catalog?search=${encodeURIComponent(query.trim())}`)
      setQuery('')
    }
  }

  if (isAnimeDetail) {
    return (
      <Bar style={{ borderRadius: 16, padding: '6px 12px' }}>
        <Item onClick={() => navigate(-1)} aria-label="Go back">
          <FaArrowLeft size={16} />
          <span>Back</span>
        </Item>
        <Item active={path === '/home' ? 1 : 0} onClick={() => navigate('/home')} aria-label="Home">
          <FaHome size={16} />
          <span>Home</span>
        </Item>
        <Item active={path === '/catalog' ? 1 : 0} onClick={() => navigate('/catalog')} aria-label="Catalog">
          <FaThLarge size={16} />
          <span>Catalog</span>
        </Item>
      </Bar>
    )
  }

  const items = [
    { icon: FaHome, label: 'Home', to: '/home' },
    { icon: FaThLarge, label: 'Catalog', to: '/catalog' },
    { icon: FaCalendarAlt, label: 'Schedule', to: '/schedule' },
    { icon: FaRandom, label: 'Random', to: '/random' },
    { icon: FaUser, label: 'Profile', to: '/profile' },
  ]

  return (
    <>
      <Bar>
        {items.map(({ icon: Icon, label, to, action }) => (
          <Item
            key={label}
            active={to && (path === to || path.startsWith(`${to}/`)) ? 1 : 0}
            onClick={action || (() => navigate(to))}
            aria-label={label}
            aria-current={to && (path === to || path.startsWith(`${to}/`)) ? 'page' : undefined}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Item>
        ))}
      </Bar>

      {searchOpen && (
        <SearchOverlay role="dialog" aria-modal="true" aria-label="Mobile search">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Search Aniraku</h3>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              title="Close search"
              style={{ display: 'grid', placeItems: 'center', background: 'none', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 999, color: '#fff', cursor: 'pointer', padding: 8, minHeight: 44, minWidth: 44 }}
            >
              <FaTimes size={15} />
            </button>
          </div>
          <form onSubmit={handleSearchSubmit} aria-label="Search anime" style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime, characters, genres..."
              aria-label="Search anime, characters, and genres"
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: '14px 16px',
                color: '#fff',
                fontSize: 16,
                outline: 'none',
                minHeight: 48,
              }}
            />
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                background: 'var(--accent, #6366f1)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '0 20px',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                minHeight: 48,
                minWidth: 48,
              }}
            >
              <FaSearch size={14} aria-hidden="true" />
              <span>Search</span>
            </button>
          </form>
        </SearchOverlay>
      )}
    </>
  )
}

export default MobileBottomNav
