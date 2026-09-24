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
          globPatterns: ['**/*.{js,css,html,woff2,svg}'],
          navigateFallback: 'index.html', // SPA offline shell
        },
      }),
    ],

    build: {
      chunkSizeWarningLimit: 2000, // Control the size before showing a warning for chunk size
      outDir: 'dist', // Specify your desired output directory
      rollupOptions: {
        output: {
          manualChunks: {
            lodash: ['lodash'], // Manually define chunk for lodash
            vendor: ['react', 'react-dom'], // Manually define chunk for React and ReactDOM
          },
        },
      },
    },

    server: {
      port: parseInt(process.env.VITE_PORT || '3000'), // Dev on :3000 (Aniraku CORS allowlist)
      open: true, // Automatically open the default browser when starting the server
      cors: true,
    },
    preview: {
      port: parseInt(process.env.VITE_PORT || '3000'),
    },
  });
};
