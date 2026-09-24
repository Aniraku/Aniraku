import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiX, FiHome, FiTrendingUp, FiCalendar, FiClock, FiSettings, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../../client/useAuth';
// Wave A Supabase auth (aliased — `useAuth` above is the AniList client hook)
import { useAuth as useSupabaseAuth } from '../../hooks/useAuth';
import { avatarUrl, defaultAvatar } from '../../lib/avatars';
import { BRAND_LOGO } from '../../lib/brand';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEMES = ['system', 'light', 'dark', 'anilist', 'catppuccin'] as const;
type ThemeName = (typeof THEMES)[number];

const THEME_LABELS: Record<ThemeName, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
  anilist: 'AniList',
  catppuccin: 'Catppuccin',
};

const NAV_ITEMS = [
  { name: 'Home', path: '/', icon: FiHome },
  { name: 'Trending', path: '/trending', icon: FiTrendingUp },
  { name: 'Schedule', path: '/schedule', icon: FiCalendar },
  { name: 'History', path: '/history', icon: FiClock },
];

const SideMenu = ({ isOpen, onClose }: SideMenuProps) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { isLoggedIn, userData } = useAuth();
  // Wave A: Supabase account state (null outside provider = guest)
  const supabaseAuth = useSupabaseAuth();
  const supabaseUser = supabaseAuth?.user ?? null;
  const supabaseProfile = supabaseAuth?.profile ?? null;
  const supabaseAvatar: string | null =
    supabaseUser &&
    (avatarUrl(supabaseProfile?.avatar_url) ||
      defaultAvatar(supabaseUser.id).url);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <>
      {mounted && (
        <div
          className={`sideMenuBackdrop ${isOpen ? 'open' : ''}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div className={`sideMenu ${isOpen ? 'open' : ''}`} role="dialog" aria-label="Side Menu">
        <div className="sideMenuHeader">
          <Link to="/" className="sideMenuLogo" onClick={onClose} title="Aniraku">
            <img src={BRAND_LOGO} alt="Aniraku" />
          </Link>
          <button
            className="sideMenuClose"
            onClick={onClose}
            aria-label="Close Menu"
            tabIndex={-1}
          >
            <FiX />
          </button>
        </div>

        <nav className="sideMenuNav" aria-label="Side navigation">
          <div className="navList">
            {(supabaseUser
              ? NAV_ITEMS
              : [
                  ...NAV_ITEMS,
                  { name: 'Login', path: '/login', icon: FiLogIn },
                  { name: 'Sign-up', path: '/signup', icon: FiUserPlus },
                ]
            ).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`navItem ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Icon className="navIcon" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="themeSection">
          <div className="themeButtons">
            {THEMES.map((t) => (
              <button
                key={t}
                className="themeBtn"
                onClick={() => setTheme(t)}
                title={THEME_LABELS[t].toUpperCase()}
                aria-label={`Switch to ${THEME_LABELS[t]} theme`}
                data-current={theme === t ? 'true' : 'false'}
              >
                {THEME_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="bottomSection">
          <div className="profileRow">
            <Link
              to="/profile"
              className="profileLink"
              onClick={onClose}
              aria-label="Profile"
            >
              {supabaseAvatar ? (
                <img
                  src={supabaseAvatar}
                  alt={
                    supabaseProfile?.display_name ||
                    supabaseProfile?.username ||
                    'Profile'
                  }
                  className="profileAvatar"
                  referrerPolicy="no-referrer"
                />
              ) : isLoggedIn && userData?.avatar ? (
                <img
                  src={userData.avatar.large}
                  alt={userData.name || 'Profile'}
                  className="profileAvatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img src={BRAND_LOGO} alt="" className="profileFallback" />
              )}
              <div className="profileNameGroup">
                <span className="profileName">
                  {supabaseUser
                    ? supabaseProfile?.display_name ||
                      supabaseProfile?.username ||
                      'Profile'
                    : userData?.name || 'Profile'}
                </span>
                {supabaseUser && (
                  <span className="profileMeta">Signed in to Aniraku</span>
                )}
              </div>
            </Link>
            <Link
              to="/profile/settings"
              className="settingsBtn"
              onClick={onClose}
              aria-label="Settings"
              title="Settings"
            >
              <FiSettings />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
