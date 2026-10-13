import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { migrateLegacyStorage } from './lib/storageMigration';
import { healUnifiedHistory, purgeUnplayedSelectionsLocal } from './lib/watchHistory';

// One-time `miruro:*` → `aniraku:*` copy for pre-swap installs. Runs before
// any provider reads localStorage so returning users keep their data.
migrateLegacyStorage();

// One-time union of the suffixed `watched-episodes-{animeId}` keys into the
// unified `watched-episodes` record History reads. Heals watches recorded
// before the unified writer existed (Info-checked but History-missing).
healUnifiedHistory();

// One-time purge of "selected but never played" entries left by older
// builds that recorded on episode select/navigation. Local only here —
// signed-in users get the server-side half at merge-on-login.
purgeUnplayedSelectionsLocal();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
