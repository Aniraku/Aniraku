import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaHome, FaThLarge, FaCalendarAlt, FaRandom, FaUser, FaArrowLeft } from 'react-icons/fa'
import styled from 'styled-components'

const Bar = styled.nav`
  display: none;
  position: fixed;
  bottom: calc(12px + env(safe-area-inset-bottom, 0));
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

  @media (max-width: 420px) {
    padding: 8px 9px;
    min-width: 44px;
  }

  @media (max-width: 360px) {
    padding: 8px 7px;
  }
`

const MobileBottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  const isAnimeDetail = path.startsWith('/anime/') || path.startsWith('/watch/')

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
