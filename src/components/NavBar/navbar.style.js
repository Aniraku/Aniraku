import styled from 'styled-components'

export const N = {}

N.Nav = styled.nav`
  position: ${({ isHome }) => (isHome ? 'fixed' : 'sticky')};
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-h);
  padding: 0 1.5rem;
  background: ${({ isScrolled, isHome }) =>
    isHome
      ? isScrolled
        ? 'rgba(0,0,0,0.85)'
        : 'transparent'
      : 'rgba(0,0,0,0.95)'};
  backdrop-filter: ${({ isScrolled, isHome }) => (isHome && isScrolled) ? 'blur(12px)' : 'none'};
  -webkit-backdrop-filter: ${({ isScrolled, isHome }) => (isHome && isScrolled) ? 'blur(12px)' : 'none'};
  border-bottom: 1px solid ${({ isScrolled, isHome }) =>
    isHome && isScrolled ? 'rgba(255,255,255,0.06)' : 'transparent'};
  transition: background 0.3s, backdrop-filter 0.3s, border-color 0.3s;
  z-index: 100;
  gap: 1rem;

  @media (max-width: 768px) {
    padding: 0 0.75rem;
    height: 56px;
  }
`

N.Left = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
`

N.MenuBtn = styled.button`
  display: none;
  background: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:hover {
    color: var(--accent);
  }
`

N.Center = styled.div`
  position: relative;
  flex: 1;
  max-width: 480px;
  margin: 0 auto;

  @media (max-width: 768px) {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    max-width: 100%;
    padding: 0 12px;
    z-index: 270;
    display: ${({ focused }) => (focused ? 'block' : 'none')};
  }
`

N.SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  background: ${({ focused }) => (focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)')};
  border: 1px solid ${({ focused }) => (focused ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)')};
  border-radius: var(--radius-full);
  padding: 0 1rem;
  height: 40px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.12);
  }
`

N.SearchIconInner = styled.span`
  color: var(--text-secondary);
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
`

N.SearchInput = styled.input`
  flex: 1;
  background: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  height: 100%;

  &::placeholder {
    color: var(--text-muted);
  }
`

N.Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-height: 400px;
  overflow-y: auto;
  z-index: 200;
`

N.DropdownItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(255,255,255,0.05); }
`

N.DropdownImg = styled.img`
  width: 45px;
  height: 63px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
`

N.DropdownInfo = styled.div`
  flex: 1;
  min-width: 0;
`

N.DropdownTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  ${N.DropdownItem}:hover & {
    color: var(--accent);
  }
`

N.DropdownSub = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

N.DropdownMeta = styled.div`
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
`

N.DropdownEmpty = styled.div`
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
`

N.Right = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    gap: 0;
  }
`

N.NavItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  transition: color var(--transition-fast);

  span {
    font-size: 10px;
    white-space: nowrap;
  }

  &:hover {
    color: var(--accent);
  }

  @media (max-width: 768px) {
    padding: 10px 12px;
    span { display: none; }
  }

  &.mobile-search-btn {
    @media (min-width: 769px) {
      display: none;
    }
  }
`

N.Divider = styled.div`
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 4px;

  @media (max-width: 768px) {
    display: none;
  }
`

N.MobileSearchOverlay = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: ${({ open }) => open ? 'block' : 'none'};
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 260;
    top: 56px;
  }
`

N.Avatar = styled.img`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent);
  cursor: pointer;
  transition: transform var(--transition-fast);

  &:hover {
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    width: 30px;
    height: 30px;
  }
`

N.SignIn = styled.span`
  padding: 6px 16px;
  background: var(--accent);
  color: #000;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity var(--transition-fast);

  &:hover {
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    padding: 5px 12px;
    font-size: 12px;
  }
`

N.LayoutBg = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 250;
  display: ${({ open }) => (open ? 'block' : 'none')};
`
