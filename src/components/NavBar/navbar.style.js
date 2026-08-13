import styled from 'styled-components'
import { Link } from 'react-router-dom'

export const N = {}

N.Nav = styled.nav`
  position: ${({ $isHome }) => ($isHome ? 'fixed' : 'sticky')};
  inset: 0 0 auto;
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: calc(var(--header-h) + env(safe-area-inset-top, 0px));
  padding: env(safe-area-inset-top, 0px) clamp(16px, 3vw, 40px) 0;
  gap: clamp(10px, 2vw, 24px);
  background: ${({ $isScrolled, $isHome }) => ($isHome && !$isScrolled ? 'linear-gradient(180deg, rgba(0,0,0,.78), rgba(0,0,0,0))' : 'rgba(8,8,10,.92)')};
  border-bottom: 1px solid ${({ $isScrolled, $isHome }) => ($isHome && !$isScrolled ? 'transparent' : 'rgba(255,255,255,.08)')};
  backdrop-filter: ${({ $isScrolled, $isHome }) => ($isScrolled || !$isHome ? 'blur(18px) saturate(120%)' : 'none')};
  -webkit-backdrop-filter: ${({ $isScrolled, $isHome }) => ($isScrolled || !$isHome ? 'blur(18px) saturate(120%)' : 'none')};
  transition: background var(--transition-normal), border-color var(--transition-normal), backdrop-filter var(--transition-normal);

  @media (max-width: 768px) {
    display: none;
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    padding-inline: 20px;
    gap: 12px;
  }
`

N.Left = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.5vw, 16px);
  min-width: 0;
  flex: 1 1 auto;
`

N.MenuBtn = styled.button`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: 10px;
  color: var(--text-primary);
  transition: background var(--transition-fast), color var(--transition-fast);

  &:hover { background: rgba(255,255,255,.08); color: #fff; }

  @media (max-width: 768px) { display: none; }
  @media (min-width: 769px) and (max-width: 1024px) { width: 38px; height: 38px; }
`

N.SearchForm = styled.form`
  display: flex;
  align-items: center;
  gap: 8px;
  width: clamp(170px, 19vw, 280px);
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  background: rgba(255,255,255,.055);
  color: var(--text-muted);
  transition: border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);

  &:focus-within {
    border-color: rgba(255,255,255,.45);
    background: rgba(255,255,255,.08);
    box-shadow: 0 0 0 3px rgba(255,255,255,.06);
  }

  @media (max-width: 900px) { width: min(26vw, 220px); }
  @media (max-width: 768px) { display: none; }
`

N.SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: .82rem;

  &::placeholder { color: var(--text-muted); }
`

N.NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;

  @media (max-width: 768px) { display: none; }
`

N.NavLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 9px;
  color: var(--text-secondary);
  font-size: .82rem;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
  transition: color var(--transition-fast), background var(--transition-fast);

  &:hover { color: #fff; background: rgba(255,255,255,.075); }
  &.active { color: #fff; background: rgba(255,255,255,.11); }

  @media (max-width: 1024px) { padding-inline: 9px; }
`

N.Right = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
`

N.RightBtn = styled.button`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: var(--text-secondary);
  transition: color var(--transition-fast), background var(--transition-fast);

  &:hover { color: #fff; background: rgba(255,255,255,.08); }

  @media (max-width: 768px) { display: none; }
`

N.Divider = styled.div`
  width: 1px;
  height: 24px;
  margin: 0 4px;
  background: rgba(255,255,255,.13);
`

N.Avatar = styled.img`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255,255,255,.28);
  transition: transform var(--transition-fast), border-color var(--transition-fast);

  &:hover { transform: translateY(-1px); border-color: #fff; }
`

N.SignIn = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 15px;
  border-radius: 10px;
  background: var(--accent);
  color: #080808;
  font-size: .82rem;
  font-weight: 800;
  white-space: nowrap;
  transition: transform var(--transition-fast), opacity var(--transition-fast);

  &:hover { transform: translateY(-1px); opacity: .94; }

  @media (min-width: 769px) and (max-width: 900px) { padding-inline: 11px; }
`

N.LayoutBg = styled.div`
  position: fixed;
  inset: 0;
  z-index: 250;
  display: ${({ open }) => (open ? 'block' : 'none')};
  background: rgba(0,0,0,.7);
  backdrop-filter: blur(2px);
`
