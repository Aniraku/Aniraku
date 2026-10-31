import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { showToast } from '../components/Toaster';

/**
 * Email-confirmation relay for the Aniraku Android app.
 *
 * Supabase's confirmation link lands here when the app's deep link is not
 * followed (older installs, browsers, desktop). This page verifies the
 * token server-side (so the account is confirmed no matter what), then
 * bounces the user back into the app via the aniraku:// deep link.
 */

const AuthConfirm: React.FC = () => {
  const [state, setState] = useState<'verifying' | 'verified' | 'error'>('verifying');
  const [relayQuery, setRelayQuery] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Supabase also delivers tokens in the URL hash for some templates.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const tokenHash = params.get('token_hash') || hash.get('token_hash') || '';
    const type = (params.get('type') || hash.get('type') || 'signup') as 'signup' | 'email' | 'recovery';
    // Relay everything the app's auth screen knows how to handle.
    const relay = new URLSearchParams({ type });
    if (tokenHash) relay.set('token_hash', tokenHash);
    const code = params.get('code') || hash.get('code');
    if (code) relay.set('code', code);
    setRelayQuery(relay.toString());

    if (!isSupabaseConfigured || (!tokenHash && !code)) {
      setState('error');
      return;
    }
    void (async () => {
      try {
        const callback = code
          ? supabase.auth.exchangeCodeForSession(code)
          : supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'signup' | 'email' | 'recovery' });
        const { error } = await callback;
        setState(error ? 'error' : 'verified');
        if (!error) showToast('Email verified. You can sign in now.', { type: 'success' });
      } catch {
        setState('error');
      }
    })();
  }, []);

  const openApp = () => {
    window.location.href = `aniraku://auth${relayQuery ? `?${relayQuery}` : ''}`;
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>
        {state === 'verifying' && 'Verifying your email…'}
        {state === 'verified' && 'Email verified ✓'}
        {state === 'error' && 'We could not verify this link'}
      </h1>
      <p style={{ color: '#9a9a9a', maxWidth: 480, lineHeight: 1.5 }}>
        {state === 'verifying' && 'One moment — confirming your account with the server.'}
        {state === 'verified' && 'Your account is confirmed on the server. You can sign in on the web right now, or open the Aniraku app and sign in with your email and password.'}
        {state === 'error' && 'This confirmation link is invalid or has expired. Open the latest email from Aniraku and try again, or request a new verification email from the app.'}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={openApp}
          style={{ padding: '12px 22px', borderRadius: 8, background: '#FF4D4D', color: '#fff', fontWeight: 900, border: 'none', cursor: 'pointer' }}
        >
          Open in the Aniraku app
        </button>
        <Link to='/login' style={{ padding: '12px 22px', borderRadius: 8, border: '1px solid #333', color: '#fff', fontWeight: 800, textDecoration: 'none' }}>
          Go to sign in
        </Link>
      </div>
    </div>
  );
};

export default AuthConfirm;
