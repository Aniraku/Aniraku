import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ─────────────────────────────────────────────────────────────────────────────
// Modulepreload hygiene
//
// Two related Chrome warnings used to spam the console on every page load:
//
//   1. "A preload for '…' is found, but is not used because it is a cross-world
//      service worker resource mismatch."
//      The /sw.js service worker runs in a different "world" than the page.
//      A <link rel="modulepreload"> without crossorigin lands in a third world
//      that the SW can never reach, so the SW never sees the preloaded bytes
//      and the browser warns. Vite 5+ already emits crossorigin on the
//      modulepreload tags, and we re-assert it via a tiny post-transform so a
//      future Vite regression can't silently regress this.
//
//   2. "The resource <URL> was preloaded using link preload but not used
//      within a few seconds from the window's load event."
//      Vite's default behavior preloads every dependency of the entry chunk,
//      including any vendor code that ends up only used by routes the viewer
//      never visits. We narrow the preload list to the four vendor chunks
//      that are used on every page (react, router, supabase, styling). Page-
//      specific chunks (Watch, Catalog, Home, AnimeDetail, …) already load
//      on demand via React.lazy, so the preloaded-but-unused warning has
//      nothing left to complain about.
// ─────────────────────────────────────────────────────────────────────────────

// Core vendor chunks that every page consumes. Anything not in this set is
// either the entry (loaded via <script type=module>) or a route-specific
// chunk that should load on demand.
const ALWAYS_PRELOAD_VENDOR_CHUNKS = [
  'react-',
  'router-',
  'supabase-',
  'styling-',
  'swiper-',
]

function ensureModulePreloadCrossorigin(html) {
  return html.replace(
    /<link rel="modulepreload"((?![^>]*\bcrossorigin\b)[^>]*)>/g,
    '<link rel="modulepreload"$1 crossorigin>'
  )
}

export default defineConfig({
  plugins: [
    react(),
    {
      // Defensive: Vite 5+ already adds crossorigin, but if a future Vite
      // release changes that, the service worker "cross-world" warning
      // returns immediately. Belt-and-suspenders for a known-stable fix.
      name: 'aniraku:ensure-modulepreload-crossorigin',
      enforce: 'post',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return ensureModulePreloadCrossorigin(html)
        },
      },
    },
  ],
  server: {
    host: true,
    port: 3000,
    proxy: {
      // Development requests remain server-backed. This avoids local-browser
      // CORS failure without allowing a direct AniList fallback in the app.
      '/api': {
        target: 'https://api.aniraku.tech',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    host: true,
    allowedHosts: ['4176-irag0uotfadg17vn3lvv9-e2d1ec02.us4.manus.computer'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router-dom')) return 'router'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('swiper')) return 'swiper'
          if (id.includes('styled-components')) return 'styling'
          if (/\/(react|react-dom)\//.test(id)) return 'react'
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    modulePreload: {
      // Modern browsers (Chrome 66+, Firefox 115+, Safari 17+) all support
      // <link rel="modulepreload"> natively. The polyfill is a no-op for
      // those browsers and just adds an extra network round-trip on cold
      // loads while generating the "preloaded but not used" warning when
      // the polyfill script's own bytes never get executed as a module.
      polyfill: false,
      // Only preload the four core vendor chunks. Page-specific chunks
      // (Watch, Catalog, Home, AnimeDetail, Settings, Profile, …) load
      // on demand via React.lazy and are intentionally NOT preloaded so
      // a home-page visit doesn't warm bytes for routes the viewer may
      // never open.
      resolveDependencies: (filename, deps) => {
        return deps.filter((dep) => {
          if (typeof dep !== 'string') return true
          return ALWAYS_PRELOAD_VENDOR_CHUNKS.some((prefix) => dep.includes(`/${prefix}`))
        })
      },
    },
  },
})
