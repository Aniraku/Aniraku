import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaHome, FaThLarge, FaCalendarAlt, FaUser, FaArrowLeft, FaRandom } from 'react-icons/fa'
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

const focusedRoutes = new Set(['/login', '/signup', '/auth/forgot-password', '/auth/new-password', '/privacy', '/terms', '/dmca', '/license', '/community-guidelines'])

const MobileBottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  if (focusedRoutes.has(path)) return null

  const detailRoute = path.startsWith('/anime/') || path.startsWith('/watch/')
  if (detailRoute) {
    return (
      <CompactBar aria-label="Focused page navigation">
        <Item type="button" onClick={() => navigate(-1)} aria-label="Go back"><FaArrowLeft size={16} /><span>Back</span></Item>
        <Item type="button" $active={false} onClick={() => navigate('/')} aria-label="Go to Home"><FaHome size={16} /><span>Home</span></Item>
        <Item type="button" $active={false} onClick={() => navigate('/catalog')} aria-label="Go to Catalog"><FaThLarge size={16} /><span>Catalog</span></Item>
      </CompactBar>
    )
  }

  const items = [
    { icon: FaHome, label: 'Home', to: '/' },
    { icon: FaThLarge, label: 'Catalog', to: '/catalog' },
    { icon: FaCalendarAlt, label: 'Schedule', to: '/schedule' },
    { icon: FaRandom, label: 'Random', to: '/random', ariaLabel: 'Open Random Anime Pick' },
    { icon: FaUser, label: 'Profile', to: '/profile' },
  ]

  return (
    <>
      <Bar aria-label="Mobile navigation">
        {items.map(({ icon: Icon, label, to, action, ariaLabel }) => {
          const active = Boolean(to && (path === to || (to !== '/' && path.startsWith(`${to}/`))))
          return (
            <Item key={label} type="button" $active={active} onClick={action || (() => navigate(to))} aria-label={ariaLabel || label} aria-current={active ? 'page' : undefined}>
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </Item>
          )
        })}
      </Bar>
    </>
  )
}

export default MobileBottomNav
