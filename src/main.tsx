import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { migrateLegacyStorage } from './lib/storageMigration';

// One-time `miruro:*` → `aniraku:*` copy for pre-swap installs. Runs before
// any provider reads localStorage so returning users keep their data.
migrateLegacyStorage();

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
