import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaHome, FaThLarge, FaCalendarAlt, FaRandom, FaUser, FaSearch, FaStepBackward, FaStepForward, FaArrowLeft } from 'react-icons/fa'
import styled from 'styled-components'

const Bar = styled.nav`
  display: none;
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 20, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 9999px;
  padding: 6px 8px;
  gap: 2px;
  z-index: 999;
  box-shadow: 0 4px 24px rgba(0,0,0,0.5);

  @media (max-width: 768px) {
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
  padding: 10px 14px;
  min-height: 48px;
  min-width: 48px;
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
`

const MobileBottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  const isWatch = path.startsWith('/watch/')
  const isAnimeDetail = path.startsWith('/anime/')

  if (isWatch) {
    return (
      <Bar style={{ borderRadius: 16, padding: '6px 12px', gap: 4 }}>
        <Item onClick={() => navigate(-1)}>
          <FaArrowLeft size={16} />
          <span>Back</span>
        </Item>
        <Item onClick={() => {
          const art = document.querySelector('[data-aniraku-player]')?.__artplayer
          if (art) art.backward && art.backward(10)
        }}>
          <FaStepBackward size={16} />
          <span>-10s</span>
        </Item>
        <Item onClick={() => {
          const art = document.querySelector('[data-aniraku-player]')?.__artplayer
          if (art) {
            if (art.playing) art.pause()
            else art.play()
          }
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>▶</span>
          <span>Play</span>
        </Item>
        <Item onClick={() => {
          const art = document.querySelector('[data-aniraku-player]')?.__artplayer
          if (art) art.forward && art.forward(10)
        }}>
          <FaStepForward size={16} />
          <span>+10s</span>
        </Item>
      </Bar>
    )
  }

  if (isAnimeDetail) {
    return (
      <Bar style={{ borderRadius: 16, padding: '6px 12px' }}>
        <Item onClick={() => navigate(-1)}>
          <FaArrowLeft size={16} />
          <span>Back</span>
        </Item>
        <Item active={path === '/home' ? 1 : 0} onClick={() => navigate('/home')}>
          <FaHome size={16} />
          <span>Home</span>
        </Item>
        <Item active={path === '/catalog' ? 1 : 0} onClick={() => navigate('/catalog')}>
          <FaThLarge size={16} />
          <span>Catalog</span>
        </Item>
      </Bar>
    )
  }

  const items = [
    { icon: FaHome, label: 'Home', to: '/home' },
    { icon: FaSearch, label: 'Search', to: '/catalog?search=' },
    { icon: FaThLarge, label: 'Catalog', to: '/catalog' },
    { icon: FaCalendarAlt, label: 'Schedule', to: '/schedule' },
    { icon: FaRandom, label: 'Random', to: '/random' },
    { icon: FaUser, label: 'Profile', to: '/profile' },
  ]

  return (
    <Bar>
      {items.map(({ icon: Icon, label, to }) => (
        <Item
          key={to}
          active={path === to ? 1 : 0}
          onClick={() => navigate(to)}
        >
          <Icon size={18} />
          <span>{label}</span>
        </Item>
      ))}
    </Bar>
  )
}

export default MobileBottomNav
