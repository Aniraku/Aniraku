import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import {
  Profile,
  Navbar,
  ThemeProvider,
  Footer,
  Home,
  Watch,
  Info,
  Trending,
  Schedule,
  Search,
  History,
  ShortcutsPopup,
  ScrollToTop,
  usePreserveScrollOnReload,
  ApolloClientProvider,
  SettingsProvider,
} from './index';
import { register } from 'swiper/element/bundle';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './client/useAuth';
// Wave A (Supabase auth layer) — mounted at the top of the router tree, wrapping
// the existing AniList AuthProvider (src/client/* hosts that one and is off-limits).
import { AuthProvider as SupabaseAuthProvider } from './providers/AuthProvider';
import ReactGA from 'react-ga4';
import { Toaster } from './components/Toaster';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
// Mobile wave — Aniraku MobileBottomNav port (mounts next to the Navbar in
// the router tree; route-based hide rules live inside the component).
import BottomNav from './components/Navigation/BottomNav';
// Aniraku parity: support modal behind the navbar heart (event-driven via
// `aniraku:open-support`; also auto-prompts after 30 min active time).
import SupportPrompt from './components/SupportPrompt';
import './components/global-chrome.css';
// Task wave — global crash boundary (wraps everything below the nav so a
// caught crash still leaves the navbar alive for the resetKey route change),
// AniList outage banner (Aniraku AniListAvailabilityBanner port) and the
// rich 404 (Aniraku Error.jsx port) that replaces the minimal Page404 on the
// catch-all route.
import { AppErrorBoundary } from './components/ErrorBoundary';
import { AniListStatusBanner } from './components/AniListStatusBanner';
import NotFound from './pages/NotFound';

register();

// Wave A routes are lazy so the auth/legal chunks stay out of the initial
// bundle (no prior lazy/Suspense pattern in this repo — see report deviations).
const Auth = lazy(() => import('./pages/Auth'));
const NewPassword = lazy(() => import('./pages/NewPassword'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Dmca = lazy(() => import('./pages/Dmca'));
const License = lazy(() => import('./pages/License'));
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines'));
// Wave C — MAL/AniList OAuth landing page (Aniraku `SyncCallback.jsx` port;
// providers redirect to /sync/callback with ?code=&state=).
const SyncCallback = lazy(() => import('./pages/SyncCallback'));

function RouteFallback() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '40vh',
      }}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--primary-accent, #b5a8ff)',
            animation: 'routeFallbackPulse 1s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`@keyframes routeFallbackPulse { 0%,100% { opacity:.3; transform:scale(.85); } 50% { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}

function App() {
  usePreserveScrollOnReload();
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  // the live site 1:1: Shift+? is owned by useGlobalShortcuts — the hook matches
  // the key (real presses AND the Settings row's synthetic window keydown,
  // Settings.tsx:422) and dispatches global-shortcuts:toggle-shortcuts-popup;
  // ShortcutsPopup listens for that event itself, so no local keydown state
  // lives here anymore.

  useEffect(() => {
    if (measurementId) {
      ReactGA.initialize(measurementId);
    }
  }, [measurementId]);

  return (
    <ApolloClientProvider>
      <Router>
        <SupabaseAuthProvider>
        <AuthProvider>
          <ThemeProvider>
            <SettingsProvider>
              <Navbar />
              {/* Aniraku AniListAvailabilityBanner port — slim outage strip
                  under the navbar (in flow, so the fixed header keeps
                  painting over it while scrolling). */}
              <AniListStatusBanner />
              <BottomNav />
              {/* Global crash boundary (Aniraku App.jsx ErrorBoundary port):
                  wraps everything below the nav — Navbar/BottomNav stay
                  outside so navigation remains possible and the pathname
                  resetKey can clear a caught crash without a reload. */}
              <AppErrorBoundary>
              <GlobalShortcutsBridge />
              <ShortcutsPopup />
              <SupportPrompt />
              <ScrollToTop />
              <TrackPageViews />
              <div style={{ minHeight: '35rem' }}>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path='/' element={<Home />} />
                  {/* the live site 1:1: /home redirects to / */}
                  <Route path='/home' element={<Navigate to='/' replace />} />
                  {/* the live site 1:1: /airing-schedule redirects to /schedule */}
                  <Route
                    path='/airing-schedule'
                    element={<Navigate to='/schedule' replace />}
                  />
                  <Route path='/search' element={<Search />} />
                  <Route path='/trending' element={<Trending />} />
                  <Route path='/schedule' element={<Schedule />} />
                  {/* the live site 1:1: dedicated watch-history route */}
                  <Route path='/history' element={<History />} />
                  <Route path='/info/:animeId' element={<Info />} />
                  <Route path='/info/:animeId/:slug' element={<Info />} />
                  <Route path='/watch/:animeId' element={<Watch />} />
                  {/* live 2-segment scheme: /watch/{id}/{slug} with episode
                      in ?ep=N (Watch reads the query first, legacy params as
                      fallback) */}
                  <Route path='/watch/:animeId/:slug' element={<Watch />} />
                  {/* legacy 3-segment entry kept so old links/history keep
                      resolving (exact 3-param route scores 25 — it outranks
                      every splat candidate) */}
                  <Route
                    path='/watch/:animeId/:animeTitle/:episodeNumber'
                    element={<Watch />}
                  />
                  {/* live's extra-segment bounce (live `watch/:id/:slug/*`):
                      surplus segments pop '..' off the splat base and land on
                      /watch/:id/:slug. A literal `watch/:animeId/:slug/*`
                      entry would score 20 and lose every surplus URL to this
                      route's 24, so this single splat carries the semantics */}
                  <Route
                    path='/watch/:animeId/:animeTitle/:episodeNumber/*'
                    element={<Navigate to='..' replace />}
                  />
                  <Route path='/profile' element={<Profile />} />
                  {/* the live site 1:1: settings is a modal inside Profile (?settings=1) */}
                  <Route
                    path='/profile/settings'
                    element={<Navigate to='/profile?settings=1' replace />}
                  />
                  <Route
                    path='/settings'
                    element={<Navigate to='/profile?settings=1' replace />}
                  />
                  {/* the live site 1:1: /about and /pptos do not exist — they 404 */}
                  {/* Wave C — Library Sync OAuth return (Aniraku
                      /sync/callback, App.jsx:187) */}
                  <Route path='/sync/callback' element={<SyncCallback />} />
                  {/* Wave A auth routes (Aniraku Supabase layer port) */}
                  <Route path='/login' element={<Auth mode='login' />} />
                  <Route path='/signup' element={<Auth mode='signup' />} />
                  <Route
                    path='/auth/forgot-password'
                    element={<Auth mode='forgot' />}
                  />
                  <Route path='/auth/new-password' element={<NewPassword />} />
                  {/* Wave A legal routes */}
                  <Route path='/privacy' element={<Privacy />} />
                  <Route path='/terms' element={<Terms />} />
                  <Route path='/dmca' element={<Dmca />} />
                  <Route path='/license' element={<License />} />
                  <Route
                    path='/community-guidelines'
                    element={<CommunityGuidelines />}
                  />
                  {/* Catch-all — the historically "frozen" single `*` route
                      (previously the minimal Page404): the user-ordered
                      Aniraku Error.jsx port replaces its element in place,
                      staying LAST in the table. */}
                  <Route path='*' element={<NotFound />} />
                </Routes>
              </Suspense>
              </div>
              <Footer />
              {/* sonner-compatible toast host (live `ty` config baked in) */}
              <Toaster />
              </AppErrorBoundary>
            </SettingsProvider>
          </ThemeProvider>
        </AuthProvider>
        </SupabaseAuthProvider>
      </Router>
      <Analytics />
    </ApolloClientProvider>
  );
}

// Live's shortcut hook (`Uh`) lives inside its navbar shell; here it needs
// router access so ⌃/⌘/⇧+, can toggle Profile's settings modal (?settings=1)
// — the same route App already uses for /settings and /profile/settings.
// Navigation toggles: being on /profile?settings=1 closes it, anything else
// opens it (live `Vh.toggle` semantics).
function GlobalShortcutsBridge() {
  useGlobalShortcuts();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const toggleSettings = () => {
      const settingsOpen =
        location.pathname === '/profile' &&
        new URLSearchParams(location.search).get('settings') === '1';
      navigate(settingsOpen ? '/profile' : '/profile?settings=1');
    };
    window.addEventListener('global-shortcuts:toggle-settings', toggleSettings);
    return () =>
      window.removeEventListener('global-shortcuts:toggle-settings', toggleSettings);
  }, [navigate, location]);

  return null;
}

function TrackPageViews() {
  const { pathname } = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: pathname });
  }, [pathname]);

  return null;
}

export default App;
