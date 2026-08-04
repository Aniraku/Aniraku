import React, { Suspense, lazy, Component, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { AuthProvider } from "./hooks/useAuth"
import NavBar from "./components/NavBar/NavBar"
import MobileBottomNav from "./components/MobileBottomNav"
import Error from "./pages/Error"
import Home from "./pages/Home"
import Skeleton from "./components/Loader/Skeleton"

class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", background: "#000", color: "#e2e8f0" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>Something went wrong</h2>
          <p style={{ marginBottom: "1rem", color: "#8c8c8c" }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={this.reset}
            style={{ padding: "0.5rem 1.5rem", background: "var(--accent)", color: "#000", border: "none", borderRadius: "9999px", cursor: "pointer", fontSize: "1rem", fontWeight: 600 }}
          >
            Back to Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const Watch = lazy(() => import("./pages/Watch"))
const Dmca = lazy(() => import("./pages/Dmca"))
const Privacy = lazy(() => import("./pages/Privacy"))
const License = lazy(() => import("./pages/License"))
const Terms = lazy(() => import("./pages/Terms"))

const AnimeDetail = lazy(() => import("./pages/AnimeDetail"))
const Auth = lazy(() => import("./pages/Auth"))
const Profile = lazy(() => import("./pages/Profile"))
const Settings = lazy(() => import("./pages/Settings"))
const Catalog = lazy(() => import("./pages/Catalog"))
const Schedule = lazy(() => import("./pages/Schedule"))
const Admin = lazy(() => import("./pages/Admin"))
const Random = lazy(() => import("./pages/Random"))

const GenreRedirect = () => {
  const params = new URLSearchParams(window.location.search)
  const genre = window.location.pathname.replace('/genre/', '')
  return <Navigate to={`/catalog?genre=${encodeURIComponent(genre)}`} replace />
}

// ScrollToTop + SEO meta reset on route change
const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    // Remove any previous structured data scripts added by page components
    const existing = document.querySelectorAll('script[data-aniraku-seo="true"]')
    existing.forEach(el => el.remove())
  }, [pathname])
  return null
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <NavBar />
          <MobileBottomNav />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/catalog" element={<Suspense fallback={<Skeleton />}><Catalog /></Suspense>} />
            <Route path="/schedule" element={<Suspense fallback={<Skeleton />}><Schedule /></Suspense>} />
            <Route path="/watch/:slugId" element={<Suspense fallback={<Skeleton />}><Watch /></Suspense>} />
            <Route path="/anime/:slugId" element={<Suspense fallback={<Skeleton />}><AnimeDetail /></Suspense>} />
            <Route path="/dmca" element={<Suspense fallback={<Skeleton />}><Dmca /></Suspense>} />
            <Route path="/privacy" element={<Suspense fallback={<Skeleton />}><Privacy /></Suspense>} />
            <Route path="/license" element={<Suspense fallback={<Skeleton />}><License /></Suspense>} />
            <Route path="/terms" element={<Suspense fallback={<Skeleton />}><Terms /></Suspense>} />

            <Route path="/login" element={<Suspense fallback={<Skeleton />}><Auth mode="login" /></Suspense>} />
            <Route path="/signup" element={<Suspense fallback={<Skeleton />}><Auth mode="signup" /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<Skeleton />}><Profile /></Suspense>} />
            <Route path="/profile/settings" element={<Suspense fallback={<Skeleton />}><Settings /></Suspense>} />
            <Route path="/settings" element={<Navigate to="/profile/settings" replace />} />
            <Route path="/admin" element={<Suspense fallback={<Skeleton />}><Admin /></Suspense>} />
            {/* Redirect aliases for sidebar nav */}
            <Route path="/top-airing" element={<Navigate to="/catalog?status=RELEASING" replace />} />
            <Route path="/most-popular" element={<Navigate to="/catalog?sort=POPULARITY_DESC" replace />} />
            <Route path="/movies" element={<Navigate to="/catalog?format=MOVIE" replace />} />
            <Route path="/tv-series" element={<Navigate to="/catalog?format=TV" replace />} />
            <Route path="/genre/:genre" element={<GenreRedirect />} />
            <Route path="/random" element={<Suspense fallback={<Skeleton />}><Random /></Suspense>} />
            <Route path="/*" element={<Error />} />
          </Routes>
          <Analytics />
          <SpeedInsights />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
