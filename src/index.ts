// * ==== Components ====
// SHELL-ONLY barrel: only modules reachable from the eager app shell
// (Navbar/Footer/menus/popups/providers) may be re-exported here.
// Page-specific components (cards, Home sections, Watch player tree,
// skeletons) MUST be imported directly by path inside lazy pages —
// re-exporting them pins their subtrees (swiper, player engine) into the
// initial bundle. See App.tsx route-split note.
// Shared components
export { default as StatusIndicator } from './components/shared/StatusIndicator';

// Basic UI components
export { default as Navbar } from './components/Navigation/Navbar';
export { default as SideMenu } from './components/Navigation/SideMenu';
export { default as Footer } from './components/Navigation/Footer';
export { default as DropDownSearch } from './components/Navigation/DropSearch';
export { SearchFilters } from './components/Navigation/SearchFilters';
export { default as ShortcutsPopup } from './components/ShortcutsPopup';
export { ThemeProvider, useTheme } from './components/ThemeContext';

// User components
// Settings completeness bundle: the superset page (Data card w/ Clear
// Bookmarks + inline Undo, two-step Clear History, Danger Zone delete
// account, Account rows). Import it directly from './pages/Settings' —
// NOT through this barrel (see Pages note below).
export {
  SettingsProvider,
  useSettings,
} from './components/Profile/SettingsProvider';
export { WatchingAnilist } from './components/Profile/WatchingAnilist';

// * ==== Hooks ====
// API and other functionality
export * from './hooks/useApi';
export * from './hooks/animeInterface';
export * from './hooks/useScroll';
export * from './hooks/useTIme';
export * from './hooks/useFilters';
export * from './hooks/useCountdown';

// * ==== Client ====
// NOTE: Apollo GraphQL (client/*) is intentionally NOT re-exported here —
// @apollo/client is ~110KB and only the (currently unmounted)
// WatchingAnilist list view needs it. Import client modules directly by
// path so the library never lands in the initial bundle.

// * ==== Pages ====
// NOTE: pages are intentionally NOT re-exported here. Every page is loaded
// via React.lazy direct-module imports in App.tsx; routing page modules
// through this barrel collapses all route splits back into the main chunk
// (the barrel is in the eager graph via shared components, so a page
// re-export statically links it). Import pages directly by path.
// (Settings page lives at ./pages/Settings — Profile imports it directly.)
