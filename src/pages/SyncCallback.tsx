import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaChevronLeft,
} from 'react-icons/fa';
import { completeSyncCallback, PROVIDER_LABELS } from '../lib/sync';
import ProviderIcon from '../components/ProviderIcon';

// ---------------------------------------------------------------------------
// SyncCallback — TS port of Aniraku `src/pages/SyncCallback.jsx` (behavior +
// copy verbatim; chrome restyled onto our CSS vars). Landing page for the
// OAuth redirect from MAL / AniList. The providers append only
// ?code=&state= to the registered redirect URI, so the provider is resolved
// server-side from the pending OAuth state. The "Back to Settings" link
// completes the loop (ours resolves to /profile?settings=1 via App).
// ---------------------------------------------------------------------------

const Page = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  padding: 40px 20px;
  text-align: center;
`;

const Card = styled.section`
  max-width: 420px;
  width: 100%;
  padding: 32px 24px;
  text-align: center;
  background: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const State = styled.div`
  margin-top: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--global-text);
`;

const Detail = styled.p`
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--global-text-muted);
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 20px;
  background: var(--primary-accent);
  color: var(--global-primary-bg);
  border-radius: var(--global-border-radius);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
`;

const SYNC_CONNECTED_KEY = 'aniraku-sync-connected';

const SyncCallback: React.FC = () => {
  const [params] = useSearchParams();
  const code = params.get('code');
  const state = params.get('state');
  const [done, setDone] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState('');
  const [error, setError] = useState('');

  // Aniraku App.jsx:145 title map for '/sync/callback'.
  useEffect(() => {
    document.title = 'Library Sync — Aniraku';
  }, []);

  useEffect(() => {
    // Already connected in this session (e.g. page refresh after success).
    if (!code && !state && !done) {
      const provider = sessionStorage.getItem(SYNC_CONNECTED_KEY);
      if (provider) {
        setConnectedProvider(provider);
        setDone(true);
      }
    }
  }, [code, state, done]);

  useEffect(() => {
    if (done) return;
    if (!code || !state) {
      setError(
        'This link is incomplete or has expired. Open it from Settings instead.',
      );
      return;
    }
    let cancelled = false;
    completeSyncCallback('', code, state)
      .then((data) => {
        if (cancelled) return;
        if (!data.error && data.connected) {
          setConnectedProvider(String(data.provider || ''));
          setDone(true);
          // Drop the one-time code from the URL and remember the success so
          // a refresh doesn't re-POST the already-consumed code.
          sessionStorage.setItem(SYNC_CONNECTED_KEY, String(data.provider || ''));
          window.history.replaceState({}, '', '/sync/callback');
        } else {
          setError(
            String(data.error || 'The provider rejected the connection. Try again.'),
          );
        }
      })
      .catch(() => {
        if (!cancelled)
          setError('Could not reach the server. Try again from Settings.');
      });
    return () => {
      cancelled = true;
    };
  }, [code, state, done]);

  return (
    <Page id='main'>
      <Card role='status' aria-live='polite'>
        {!done && !error && (
          <>
            <FaSpinner size={40} color='var(--primary-accent)' className='sync-spin' />
            <State>Connecting your library…</State>
            <Detail>Finishing the handshake. This only takes a moment.</Detail>
          </>
        )}
        {done && (
          <>
            {connectedProvider ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ProviderIcon provider={connectedProvider} size={46} />
              </div>
            ) : (
              <FaCheckCircle size={44} color='#34d399' />
            )}
            <State>
              Connected to{' '}
              {connectedProvider
                ? PROVIDER_LABELS[connectedProvider] || connectedProvider
                : 'your library'}
            </State>
            <Detail>
              From now on, finishing episodes on Aniraku updates your{' '}
              {connectedProvider
                ? PROVIDER_LABELS[connectedProvider] || connectedProvider
                : 'external'}{' '}
              library.
            </Detail>
          </>
        )}
        {error && (
          <>
            <FaExclamationTriangle size={44} color='#fbbf24' />
            <State>Connection failed</State>
            <Detail>{error}</Detail>
          </>
        )}
        <BackLink to='/profile/settings'>
          <FaChevronLeft size={13} /> Back to Settings
        </BackLink>
      </Card>
      <style>{`
        @keyframes sync-cb-spin { to { transform: rotate(360deg); } }
        .sync-spin { animation: sync-cb-spin 1s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .sync-spin { animation: none; } }
      `}</style>
    </Page>
  );
};

export default SyncCallback;
