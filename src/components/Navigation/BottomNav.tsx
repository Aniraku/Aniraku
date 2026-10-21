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

// Mobile bottom navigation (≤768px, compact ≤360px).
//
// Five tabs: Home, Search, Notifications, Random, and Profile. The
// notifications tab dispatches the existing
// `global-shortcuts:open-notifications` bus event, so the bell and the tab
// share one drawer and one 30s poll. The random tab uses the shared
// `useRandomAnime` helper, and the profile tab always goes to /profile
// (guests see a login CTA there).
//
// Hidden on auth/legal routes and anywhere under /watch (player immersion).
// `body.has-bottom-nav` adds the scoped bottom padding so the footer and the
// last row are never covered.

// Auth and legal routes hide the dock.
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
  // Never over the player.
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

  // Badge hook — shares the same store subscriber as the navbar.
  const { unreadCount } = useNotifications();
  // Shared dice logic with the navbar.
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
      // Existing bus: the navbar listener toggles the drawer state.
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
