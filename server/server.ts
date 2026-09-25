import express from 'express';
import path from 'path';
import os from 'os';
import bodyParser from 'body-parser';

const app = express();

// Environment Configuration (frontend on :3000)
const PORT = process.env.VITE_PORT || process.env.PORT || 3000;

// Directory paths for static assets
const DIST_DIR = path.join(__dirname, '../dist');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');

// Middleware for static assets and JSON parsing
// CORS for Aniraku API usage: Local dev (:3000) calls https://api.aniraku.tech
// cross-origin, so the *backend* allowlists local dev. Here we set our own
// serving headers + security headers for the local dev origin.
const ANIRAKU_ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://api.aniraku.tech',
]);
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && ANIRAKU_ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Range',
  );
  res.setHeader('Vary', 'Origin');
  // Basic hardening (mirrors Aniraku SecurityHeaders intent)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});
app.use(express.static(DIST_DIR));
app.use(express.json());
app.use(bodyParser.json());

// the live site 1:1: same-origin health endpoint
// live returns {"status":"ok","timestamp":"...","version":"1.14.2"}
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.14.2',
  });
});

// Serve the main index.html for any non-API requests
app.get('*', (req, res) => {
  res.sendFile(INDEX_FILE, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('An error occurred while serving the application');
    }
  });
});

// Utility to get the first non-internal IPv4 address
function getLocalIpAddress() {
  const networkInterfaces = os.networkInterfaces();
  for (const networkInterface of Object.values(networkInterfaces)) {
    const found = networkInterface?.find(
      (net) => net.family === 'IPv4' && !net.internal,
    );
    if (found) return found.address;
  }
  return 'localhost';
}

// Starting the server
app.listen(PORT, () => {
  const ipAddress = getLocalIpAddress();
  console.log(
    `Server is running at:\n- Localhost: http://localhost:${PORT}\n- Local IP: http://${ipAddress}:${PORT}`,
  );
});
