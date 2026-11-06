import { defineConfig, loadEnv, UserConfigExport, ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// This is a TypeScript Vite Config file.
// Comments are retained from both original configurations for clarity.
export default ({ mode }: ConfigEnv): UserConfigExport => {
  // Load environment variables and merge them with process.env
  // You can access Vite specific env variables here like VITE_NAME using process.env.VITE_NAME
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [
      react(), // Using React plugin from Vite
      // Aniraku dev-server plugin: same-origin /health for local dev
      // (production serves it from server/server.ts)
      {
        name: 'aniraku-health-endpoint',
        configureServer(server) {
          server.middlewares.use('/health', (_req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                status: 'ok',
                timestamp: new Date().toISOString(),
                version: '1.14.2',
              }),
            );
          });
        },
      },
      // Service worker + PWA registration (/sw.js + registerSW.js)
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script', // emits <script id="vite-plugin-pwa:register-sw" src="/registerSW.js">
        filename: 'sw.js', // live registers '/sw.js' with scope '/'
        manifest: false, // public/manifest.json is hand-maintained (Aniraku branding)
        workbox: {
          // Precache the SHELL only (html/css/fonts/svg). Precaching every
          // JS chunk made a first visit download ~2.5MB of lazy player code
          // in the background, competing with the page's own API calls and
          // images on slow connections. Lazy chunks are runtime-cached
          // CacheFirst instead — they're content-hashed immutable URLs, so
          // a cache hit is always correct.
          globPatterns: ['**/*.{css,html,woff2,svg}'],
          navigateFallback: 'index.html', // SPA offline shell
          runtimeCaching: [
            {
              urlPattern: ({ url }: { url: URL }) =>
                url.pathname.startsWith('/assets/') ||
                url.pathname === '/registerSW.js',
              handler: 'CacheFirst',
              options: {
                cacheName: 'aniraku-assets',
                expiration: { maxEntries: 80, maxAgeSeconds: 365 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [200] },
              },
            },
          ],
          // Take control ASAP: without clientsClaim, tabs opened before a
          // deploy keep running the old bundle for hours (SPA navigation
          // never reloads), so stale code keeps reading/writing stale
          // shapes. skipWaiting activates the new worker immediately,
          // clientsClaim hands existing tabs over on next navigation.
          skipWaiting: true,
          clientsClaim: true,
          // Explicit denylist so the SW NEVER serves the app shell for
          // non-HTML URLs (SEO files, manifests, PWA internals). Without
          // this, a navigation to /sitemap.xml could render the SPA 404
          // page from cache instead of the real XML.
          navigateFallbackDenylist: [
            /^\/_/,
            /\/[^/?]+\.[^/]+$/,
            /^\/sitemap\.xml$/,
            /^\/sitemaps\//,
            /^\/robots\.txt$/,
            /^\/manifest\.json$/,
            /^\/sw\.js$/,
            /^\/registerSW\.js$/,
            /^\/workbox-.*\.js$/,
          ],
        },
      }),
    ],

    build: {
      chunkSizeWarningLimit: 2000, // Control the size before showing a warning for chunk size
      outDir: 'dist', // Specify your desired output directory
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'], // Manually define chunk for React and ReactDOM
          },
        },
      },
    },

    server: {
    // Same-origin API in dev: mirrors the production rewrite.
    proxy: {
      '/api/v1': { target: 'https://api.aniraku.tech', changeOrigin: true },
      '/health': { target: 'https://api.aniraku.tech', changeOrigin: true },
    },
      port: parseInt(process.env.VITE_PORT || '3000'), // Dev on :3000 (Aniraku CORS allowlist)
      open: true, // Automatically open the default browser when starting the server
      cors: true,
    },
    preview: {
      port: parseInt(process.env.VITE_PORT || '3000'),
    },
  });
};
