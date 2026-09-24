import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiBell, FiX, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { GiPerspectiveDiceSixFacesRandom } from 'react-icons/gi';
import { MdOutlineKeyboard } from 'react-icons/md';
import DropSearch from './DropSearch';
import SideMenu from './SideMenu';
import Notifications, { useNotifications } from '../Notifications';
import type { Anime } from '../../hooks/animeInterface';
import { fetchAdvancedSearch } from '../../hooks/useApi';
import { useAuth } from '../../client/useAuth';
// Wave A Supabase auth (aliased — `useAuth` above is the AniList client hook)
import { useAuth as useSupabaseAuth } from '../../hooks/useAuth';
import { avatarUrl, defaultAvatar } from '../../lib/avatars';
import { BRAND_LOGO } from '../../lib/brand';
// Mobile wave: dice logic extracted to a shared helper so the bottom-nav
// Random tab runs byte-identical behavior (no logic drift).
import { useRandomAnime } from '../../utils/randomAnime';

// Bell badge (Wave C delta): unread count now comes from Wave B's blessed
// `useNotifications()` hook — the shared 30s session poll in lib/sync feeds
// the store, the server `read` column is the authority, and the store clears
// on sign-out. The lib/sync shim pair (fetchNotifications /
// readNotificationReadIds) is no longer read from here.

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] =
    useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, userData } = useAuth();
  // Wave A: Supabase account state (null outside provider = guest)
  const supabaseAuth = useSupabaseAuth();
  const supabaseUser = supabaseAuth?.user ?? null;
  const supabaseProfile = supabaseAuth?.profile ?? null;
  const supabaseAvatar: string | null =
    supabaseUser &&
    (avatarUrl(supabaseProfile?.avatar_url) ||
      defaultAvatar(supabaseUser.id).url);
  // Delta 4 → Wave C: the badge hook is live. `unreadCount` derives from
  // the store's rows minus the server `read` column; `refresh` re-polls the
  // endpoint (drawer toggle — close re-reads marks-made inside the drawer).
  // No AniList auth anywhere here (Supabase session only).
  const { unreadCount, refresh: refreshUnread } = useNotifications();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile wave — shared Random action (utils/randomAnime.ts). The helper
  // holds the former inline body verbatim: trending fetch → filterAdult
  // NSFW pool (explicit <Anime> type arg) → navigate(infoPathFor(pick)).
  const fetchRandomAnime = useRandomAnime();

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      setIsSearching(true);
      setShowResults(true);
      try {
        const searchResults = await fetchAdvancedSearch(searchQuery, 1, 15);
        setResults(searchResults.results ?? []);
        setSearchError(false);
      } catch (error) {
        console.error('Error searching anime:', error);
        setResults([]);
        setSearchError(true);
      } finally {
        setIsSearching(false);
      }
    } else {
      setResults([]);
      setShowResults(false);
      setSearchError(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setShowNotificationsDropdown(false);
  };

  const toggleNotificationsDropdown = () => {
    // refresh the unread badge on open AND close (close re-reads marks-made
    // inside the drawer)
    refreshUnread();
    setShowNotificationsDropdown(!showNotificationsDropdown);
    setShowProfileDropdown(false);
  };

  const toggleSideMenu = () => {
    setShowSideMenu(!showSideMenu);
  };

  // stable close handler for the portaled Notifications drawer
  const onCloseNotifications = useCallback(
    () => setShowNotificationsDropdown(false),
    []
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleGlobalSearch = () => {
      inputRef.current?.focus();
    };

    // live event name (was local 'focusSearch'); dispatched by
    // useGlobalShortcuts for / and ⌃/⌘S
    window.addEventListener('global-shortcuts:focus-search', handleGlobalSearch);
    return () =>
      window.removeEventListener('global-shortcuts:focus-search', handleGlobalSearch);
  }, []);

  useEffect(() => {
    setShowProfileDropdown(false);
    setShowNotificationsDropdown(false);
    setShowResults(false);
    setShowMobileSearch(false);
  }, [location]);

  // live `Gv`: Escape blurs the search box, clears the query and closes the
  // results dropdown (DropSearch additionally handles its own visible-state
  // Escape through onClear/onClose — idempotent with this)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inputRef.current) {
        inputRef.current.blur();
        setIsSearchFocused(false);
        setQuery('');
        setShowResults(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // live `sv`/`Kv`: open-* toggles the surface, close-* force-closes it.
  // useGlobalShortcuts dispatches these for Shift+M / Shift+T|V with mutual
  // exclusion (open one → close the other).
  useEffect(() => {
    const openNotifications = () => {
      // Mobile wave parity: the bottom-nav Notifications tab rides this same
      // bus event, so refresh the unread badge on every toggle — identical
      // semantics to toggleNotificationsDropdown (the bell), open AND close.
      // `refreshUnread` is a stable useCallback([]) (Notifications.tsx:107).
      refreshUnread();
      setShowNotificationsDropdown((v) => !v);
    };
    const closeNotifications = () => setShowNotificationsDropdown(false);
    const openSideMenu = () => setShowSideMenu((v) => !v);
    const closeSideMenu = () => setShowSideMenu(false);
    window.addEventListener('global-shortcuts:open-notifications', openNotifications);
    window.addEventListener('global-shortcuts:close-notifications', closeNotifications);
    window.addEventListener('global-shortcuts:open-sidemenu', openSideMenu);
    window.addEventListener('global-shortcuts:close-sidemenu', closeSideMenu);
    return () => {
      window.removeEventListener('global-shortcuts:open-notifications', openNotifications);
      window.removeEventListener('global-shortcuts:close-notifications', closeNotifications);
      window.removeEventListener('global-shortcuts:open-sidemenu', openSideMenu);
      window.removeEventListener('global-shortcuts:close-sidemenu', closeSideMenu);
    };
  }, []);

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navContainer">
          <div className="topContainer">
            <div className="leftGroup">
              <button
                className="hamburger"
                onClick={toggleSideMenu}
                aria-label="Toggle menu"
                aria-expanded={showSideMenu}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <Link to="/" className="navLogo" title="Aniraku">
                <img
                  src={BRAND_LOGO}
                  alt="Aniraku"
                  aria-label="Aniraku"
                  width="32"
                  height="32"
                />
              </Link>
            </div>

            {/* live `Dv` search section: [input container box, action
                buttons] as siblings; the slash hint is the last child INSIDE
                the box (live `Tv`), driven by isSearchFocused */}
            <div className="searchSection" ref={searchRef}>
              <div
                className={`navSearchBar ${showMobileSearch ? 'mobileShow' : ''}`}
                data-has-query={hasQuery}
              >
                <div className="searchInputContainer">
                  <FiSearch className="searchIcon" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search Anime"
                    aria-label="Search Anime"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      if (query) setShowResults(true);
                    }}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                  {hasQuery && (
                    <button
                      className="searchClearBtn"
                      onClick={handleClear}
                      aria-label="Clear search"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <DropSearch
                  results={results}
                  isVisible={showResults}
                  isLoading={isSearching}
                  error={searchError}
                  query={query}
                  onClear={handleClear}
                  onClose={handleCloseResults}
                />
                <button
                  type="button"
                  className="slashToggleBtn"
                  data-focused={isSearchFocused ? 'true' : 'false'}
                  onClick={() => inputRef.current?.focus()}
                  aria-label="Keyboard shortcuts"
                  title="Keyboard shortcuts"
                >
                  <MdOutlineKeyboard />
                </button>
              </div>
              <div className="actionButtons">
                <button
                  type="button"
                  className="searchSubmitBtn"
                  onClick={() =>
                    query && navigate(`/search?query=${encodeURIComponent(query)}`)
                  }
                  aria-label="Submit search"
                >
                  <FiSearch />
                </button>
                <button
                  type="button"
                  className="randomBtn"
                  onClick={fetchRandomAnime}
                  aria-label="Random Anime"
                  title="Random Anime"
                >
                  <GiPerspectiveDiceSixFacesRandom />
                </button>
              </div>
            </div>

            <div className="rightContent">
              <button
                className="toggleSearchBtn"
                onClick={toggleMobileSearch}
                aria-label="Toggle search"
              >
                <FiSearch />
              </button>
              {/* Aniraku parity: Support heart (old NavBar `RightBtn`) — opens
                  the SupportPrompt modal via the app-wide event. Reuses the
                  shared icon-button class so no stylesheet edit is needed. */}
              <button
                type="button"
                className="notificationBtn"
                onClick={() =>
                  window.dispatchEvent(new Event('aniraku:open-support'))
                }
                title="Support Aniraku"
                aria-label="Support Aniraku"
              >
                <FaHeart size={14} />
              </button>
              {/* live `sv`: bell always visible (default anilist provider);
                  `show` + badge only when unread > 0; drawer replaces the old
                  inline dropdown and portals to document.body */}
              <div className="notificationContainer">
                <button
                  className={`notificationBtn ${unreadCount > 0 ? 'show' : ''}`}
                  onClick={toggleNotificationsDropdown}
                  aria-label="Notifications"
                  aria-expanded={showNotificationsDropdown}
                >
                  <FiBell />
                  {unreadCount > 0 && (
                    <span className="notificationBadge">{unreadCount}</span>
                  )}
                </button>
                <Notifications
                  isOpen={showNotificationsDropdown}
                  onClose={onCloseNotifications}
                />
              </div>
              <div className="profileContainer" ref={profileDropdownRef}>
                <button
                  className="profileBtn"
                  onClick={toggleProfileDropdown}
                  aria-label="Profile menu"
                  aria-expanded={showProfileDropdown}
                  aria-controls="rightDropdownMenu"
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
                    <span className="profileIcon">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                  )}
                </button>
                <div
                  className={`profileDropdown ${showProfileDropdown ? 'show' : ''}`}
                  id="rightDropdownMenu"
                  role="menu"
                >
                  {supabaseUser ? (
                    <Link
                      to="/profile"
                      className="profileMenuItem"
                      role="menuitem"
                    >
                      <span className="menuLabel">
                        {supabaseProfile?.display_name ||
                          supabaseProfile?.username ||
                          'Profile'}
                      </span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="profileMenuItem login"
                        role="menuitem"
                      >
                        <FiLogIn aria-hidden="true" />
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className="profileMenuItem login"
                        role="menuitem"
                      >
                        <FiUserPlus aria-hidden="true" />
                        Sign-up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <SideMenu isOpen={showSideMenu} onClose={() => setShowSideMenu(false)} />
    </>
  );
};

export default Navbar;
