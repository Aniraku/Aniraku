import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiSearch,
  FiBell,
  FiClock,
  FiUser,
} from 'react-icons/fi';
// IconType lives on the react-icons root (re-exported from ./lib/iconBase);
// react-icons/fi only imports it — not re-exported (fi/index.d.ts:2).
import type { IconType } from 'react-icons';
import { GiPerspectiveDiceSixFacesRandom } from 'react-icons/gi';
import { useNotifications } from '../Notifications';
import { useRandomAnime } from '../../utils/randomAnime';
import './BottomNav.css';

// ---------------------------------------------------------------------------
// BottomNav — PORT of Aniraku `src/components/MobileBottomNav.jsx`:
//   - geometry/visibility: Bar :5-25 (fixed pill, ≤768px display, ≤360px
//     compact — BottomNav.css, declarations mapped line-for-line);
//   - Item :27-53 (flex 1, min-height 48px, ellipsized label, press scale);
//   - show/hide rules :60-78 — Aniraku's `focusedRoutes` set remapped to OUR
//     auth/legal routes, plus the spec-mandated hide on /watch/* (route check
//     lives HERE, in the nav layer — Watch files stay untouched). Aniraku's
//     compact Back bar on /anime|/watch is superseded by that hide mandate;
//     we render no second variant.
//   - tab set :80-87 mapped per spec (its /catalog /schedule /support slots
//     map to our Search/Notifications/Random/History surfaces — see report).
//
// Wiring (spec Step 2):
//   - Notifications tab dispatches the EXISTING bus event
//     `global-shortcuts:open-notifications`, which Navbar.tsx:206 already
//     listens to — the bell and the tab toggle the SAME
//     `showNotificationsDropdown` state and the SAME portal drawer
//     (Notifications.tsx). No second drawer, no new event, no Navbar state
//     lifted. Badge = useNotifications().unreadCount (store fed by the single
//     30s lib/sync poll — a second hook instance adds NO new poll).
//   - Random tab runs the shared useRandomAnime() helper (utils/randomAnime)
//     — byte-identical to the Navbar dice (same module, no drift).
//   - Profile tab → /profile for everyone: guests already get a login CTA
//     there (Profile.tsx:1141 guest branch → <Link to='/login'>Log In</Link>),
//     so no /login redirect is needed.
//
// Shell clearance: body.has-bottom-nav toggled below; padding rule scoped to
// ≤768px in BottomNav.css so the footer/last row is never covered.
// ---------------------------------------------------------------------------

// Aniraku MobileBottomNav.jsx:60 `focusedRoutes`, remapped 1:1 onto our route
// set (App.tsx auth/legal routes) — focused surfaces show no dock there.
const FOCUSED_ROUTES = new Set([
  '/login',
  '/signup',
  '/auth/forgot-password',
  '/auth/new-password',
  '/privacy',
  '/terms',
  '/dmca',
  '/license',
  '/community-guidelines',
]);

const isHiddenRoute = (path: string): boolean =>
  // spec Step 3: player immersion — never over /watch/*
  path === '/watch' ||
  path.startsWith('/watch/') ||
  FOCUSED_ROUTES.has(path);

interface BottomTab {
  key: string;
  label: string;
  icon: IconType;
  to?: string;
  action?: () => void;
  badge?: number;
}

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Badge hook — shared store subscriber (Navbar.tsx:56 uses the same one).
  const { unreadCount } = useNotifications();
  // Shared dice logic with the Navbar (extracted this wave).
  const randomAnime = useRandomAnime();

  const hidden = isHiddenRoute(path);

  // Shell clearance while the dock can render (CSS scopes it to ≤768px).
  useEffect(() => {
    document.body.classList.toggle('has-bottom-nav', !hidden);
    return () => {
      document.body.classList.remove('has-bottom-nav');
    };
  }, [hidden]);

  if (hidden) return null;

  const items: BottomTab[] = [
    { key: 'home', label: 'Home', icon: FiHome, to: '/' },
    { key: 'search', label: 'Search', icon: FiSearch, to: '/search' },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: FiBell,
      // existing bus → Navbar.tsx:207-222 listener toggles the drawer state
      action: () =>
        window.dispatchEvent(
          new Event('global-shortcuts:open-notifications'),
        ),
      badge: unreadCount,
    },
    {
      key: 'random',
      label: 'Random',
      icon: GiPerspectiveDiceSixFacesRandom,
      action: randomAnime,
    },
    { key: 'history', label: 'History', icon: FiClock, to: '/history' },
    { key: 'profile', label: 'Profile', icon: FiUser, to: '/profile' },
  ];

  return (
    <nav className='bottomNav' aria-label='Mobile navigation'>
      {items.map(({ key, label, icon: Icon, to, action, badge }) => {
        const active = Boolean(
          to && (path === to || (to !== '/' && path.startsWith(`${to}/`))),
        );
        const ariaLabel =
          key === 'notifications' && badge
            ? `Notifications, ${badge} unread`
            : label;
        return (
          <button
            key={key}
            type='button'
            className='bottomNavTab'
            data-active={active}
            onClick={action || (() => navigate(to!))}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={16} aria-hidden='true' />
            <span>{label}</span>
            {Boolean(badge) && (
              <span className='bottomNavBadge' aria-hidden='true'>
                {badge! > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
