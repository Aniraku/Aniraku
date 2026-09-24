// * ==== Components ====
// TODO Shared components
export { default as StatusIndicator } from './components/shared/StatusIndicator';

// TODO Basic UI Components
export { default as Navbar } from './components/Navigation/Navbar';
export { default as SideMenu } from './components/Navigation/SideMenu';
export { default as Footer } from './components/Navigation/Footer';
export { default as DropDownSearch } from './components/Navigation/DropSearch';
export { SearchFilters } from './components/Navigation/SearchFilters';
export { default as ShortcutsPopup } from './components/ShortcutsPopup';
export { ThemeProvider, useTheme } from './components/ThemeContext';

// TODO Cards
export { default as CardGrid, StyledCardGrid } from './components/Cards/CardGrid';
export { default as CardItem } from './components/Cards/CardItem';

// TODO Home Page Specific
export { EpisodeCard } from './components/Home/EpisodeCard';
export { HomeCarousel } from './components/Home/HomeCarousel';
export { GenreRail } from './components/Home/GenreRail';
export { HomeBanner } from './components/Home/HomeBanner';
export { HomeTabs } from './components/Home/HomeTabs';
export { MiniSchedule } from './components/Home/MiniSchedule';
export { SidePanel } from './components/Home/SidePanels';

// TODO Skeletons for Loading States
export {
  SkeletonCard,
  SkeletonSlide,
  SkeletonPlayer,
} from './components/Skeletons/Skeletons';

// TODO Watching Anime Functionality
export { EpisodeList } from './components/Watch/EpisodeList';
// RelationsCompact retired: live's Watch page has no RELATED block (relations
// live on the Info page); component file kept on disk, re-export removed so it
// stays out of the bundle.
export { EmbedPlayer } from './components/Watch/Video/EmbedPlayer';
export { Player } from './components/Watch/Video/Player'; // Notice: This is not a default export
export { MediaSource } from './components/Watch/Video/MediaSource';
export { WatchAnimeData } from './components/Watch/WatchAnimeData';
export { AnimeDataList } from './components/Watch/AnimeDataList';
export { Seasons } from './components/Watch/Seasons';

// TODO User Components
// Settings completeness bundle: the superset page (Data card w/ Clear
// Bookmarks + inline Undo, two-step Clear History, Danger Zone delete
// account, Account rows) replaces the Profile-modal component. Same export
// shape (named Settings, zero props) — Profile's `?settings=1` modal picks
// it up through this barrel unchanged.
export { Settings } from './pages/Settings';
export {
  SettingsProvider,
  useSettings,
} from './components/Profile/SettingsProvider';
export { WatchingAnilist } from './components/Profile/WatchingAnilist';

// * ==== Hooks ====
// TODO Utilizing API and Other Functionalities
export * from './hooks/useApi';
export * from './hooks/animeInterface';
export * from './hooks/useScroll';
export * from './hooks/useTIme';
export * from './hooks/useFilters';
export * from './hooks/useCountdown';

// * ==== Client ====
export { ApolloClientProvider } from './client/ApolloClient';
export * from './client/userInfoTypes';
export * from './client/authService';
export * from './client/useAuth';

// * ==== Pages ====
// TODO Main Pages of the Application
export { default as Home } from './pages/Home';
export { default as Search } from './pages/Search';
export { default as Watch } from './pages/Watch';
export { default as Info } from './pages/Info';
export { default as Trending } from './pages/Trending';
export { default as Schedule } from './pages/Schedule';
export { default as History } from './pages/History';
export { default as Profile } from './pages/Profile';
export { default as About } from './pages/About';
export { default as PolicyTerms } from './pages/PolicyTerms';
export { default as Page404 } from './pages/404';
