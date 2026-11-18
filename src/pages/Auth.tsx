// Login / signup / forgot-password screen, selected by `mode`. Every
// user-visible brand string says "Aniraku". UI availability honours
// isSupabaseConfigured (username check and recovery request gate);
// login/signup attempts surface the transport error from the placeholder
// client when env vars are missing.
//
// Presentation: split layout — brand aside (logo, one-line promise, the
// three sync features an account actually buys) beside the form card on
// ≥960px; a compact brand row above the card below that. All motion is a
// self-running CSS entrance gated on prefers-reduced-motion (no JS
// dependency, content never hidden if scripts fail).
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useSeo } from '../utils/seo';
import { BRAND_LOGO } from '../lib/brand';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClockRotateLeft,
  faBookmark,
  faStar,
  faEye,
  faEyeSlash,
  faCircleExclamation,
  faCircleCheck,
  faEnvelopeOpenText,
} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

type UsernameState =
  | 'idle'
  | 'short'
  | 'checking'
  | 'available'
  | 'taken'
  | 'unavailable';

const Wrapper = styled.main`
  box-sizing: border-box;
  min-height: 100dvh;
  background: var(--global-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(4.5rem + 24px) 1.5rem max(24px, env(safe-area-inset-bottom));

  @media (max-width: 768px) {
    align-items: flex-start;
    padding: calc(4.5rem + 18px) 1rem max(20px, env(safe-area-inset-bottom));
  }
`;

const Panel = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: clamp(2.5rem, 5vw, 4.5rem);
  align-items: start;

  @media (max-width: 959px) {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: min(100%, 420px);
    margin: 0 auto;
  }
`;

const Inner = styled.div`
  width: min(100%, 980px);
  display: flex;
  flex-direction: column;

  @media (max-width: 959px) {
    width: min(100%, 420px);
  }
`;

/* ---- Brand aside (vertical panel on desktop, brand row on mobile) ---- */

const Aside = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
  background: var(--global-secondary-bg);
  border: 1px solid var(--global-border-color);
  border-radius: calc(var(--global-border-radius) + 6px);
  padding: 2.25rem;

  @media (max-width: 959px) {
    flex-direction: row;
    align-items: center;
    gap: 0.875rem;
    background: none;
    border: none;
    border-radius: 0;
    padding: 0.25rem 0 1rem;
  }
`;

const BrandRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  @media (max-width: 959px) {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
  }
`;

const BrandLogo = styled.img`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  object-fit: cover;
  align-self: flex-start;

  @media (max-width: 959px) {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    align-self: center;
  }
`;

const BrandName = styled.span`
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--global-text);

  @media (max-width: 959px) {
    font-size: 1.15rem;
  }
`;

const BrandNameRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  @media (max-width: 959px) {
    gap: 0;
  }
`;

const BrandTagline = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--global-text-muted-strong);
  max-width: 34ch;

  @media (max-width: 959px) {
    display: none;
  }
`;

const BenefitList = styled.ul`
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;

  @media (max-width: 959px) {
    display: none;
  }
`;

const Benefit = styled.li`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  font-size: 0.925rem;
  line-height: 1.4;
  color: var(--global-text);
`;

const BenefitIcon = styled.span`
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--primary-accent-tr);
  color: var(--primary-accent);
  font-size: 0.95rem;
`;

const AsideFootnote = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--global-text-muted);

  @media (max-width: 959px) {
    display: none;
  }
`;

/* ---- Form card ---- */

const Box = styled.div`
  width: 100%;
  min-width: 0;
`;

const Card = styled.section`
  background: var(--global-div);
  border-radius: calc(var(--global-border-radius) + 6px);
  padding: clamp(1.625rem, 4vw, 2.5rem);
  border: 1px solid var(--global-border-color);
  box-shadow: 0 8px 16px 0 rgb(0 0 0 / 30%);
`;

const Title = styled.h1`
  font-size: clamp(1.625rem, 6.5vw, 1.875rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  color: var(--global-text);
  line-height: 1.12;
`;

const Subtitle = styled.p`
  color: var(--global-text-muted-strong);
  font-size: 0.925rem;
  line-height: 1.55;
  margin: 0 0 1.75rem;
`;

const Message = styled.div<{ $tone: 'error' | 'success' }>`
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
  background: ${p => p.$tone === 'error' ? 'rgba(229,9,20,0.1)' : 'rgba(34,197,94,0.1)'};
  border: 1px solid ${p => p.$tone === 'error' ? 'rgba(229,9,20,0.35)' : 'rgba(34,197,94,0.35)'};
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
  color: ${p => p.$tone === 'error' ? '#f87171' : '#4ade80'};
  font-size: 13px;
  line-height: 1.55;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 14px;
  }
`;

const Notice = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 12px;
  padding: 20px 18px;
  margin-bottom: 16px;
  text-align: left;
  color: var(--global-text-muted-strong);
  font-size: 14px;
  line-height: 1.6;
  strong { color: #4ade80; overflow-wrap: anywhere; }

  svg {
    flex-shrink: 0;
    margin-top: 3px;
    color: #4ade80;
    font-size: 18px;
  }
`;

const Field = styled.div`
  margin-bottom: 16px;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const Label = styled.label`
  display: block;
  color: var(--global-text);
  font-size: 13px;
  font-weight: 500;
`;

const ForgotLink = styled(Link)`
  color: var(--primary-accent);
  text-decoration: none;
  font-size: 13px;
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  &:hover { text-decoration: underline; }
`;

const InputWrap = styled.div`
  position: relative;
`;

const Input = styled.input<{ $state?: UsernameState }>`
  width: 100%;
  min-height: 50px;
  padding: 12px 46px 12px 14px;
  background: var(--global-secondary-bg);
  border: 1px solid ${p => p.$state === 'available' ? 'rgba(34,197,94,0.8)' : p.$state === 'taken' ? 'rgba(229,9,20,0.8)' : 'var(--global-border-color)'};
  border-radius: 10px;
  color: var(--global-text);
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
  &:focus { border-color: var(--primary-accent); }
`;

const PasswordInput = styled(Input)`
  padding-right: 52px;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 40px;
  height: 38px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--global-text-muted);
  font-size: 15px;
  cursor: pointer;
  &:hover { color: var(--global-text); }
`;

const InputStatus = styled.span<{ $state: UsernameState }>`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${p => p.$state === 'available' ? '#4ade80' : p.$state === 'taken' ? '#f87171' : 'var(--global-text-muted)'};
  font-size: ${p => p.$state === 'checking' ? '12px' : '17px'};
  line-height: 1;
  pointer-events: none;
`;

const FieldHint = styled.p<{ $state: UsernameState }>`
  min-height: 17px;
  margin: 6px 0 0;
  color: ${p => p.$state === 'available' ? '#4ade80' : p.$state === 'taken' ? '#f87171' : 'var(--global-text-muted)'};
  font-size: 12px;
  line-height: 1.4;
`;

const PasswordHint = styled.p<{ $tone: 'idle' | 'error' | 'ok' }>`
  min-height: 17px;
  margin: 6px 0 0;
  color: ${p => p.$tone === 'error' ? '#f87171' : p.$tone === 'ok' ? '#4ade80' : 'var(--global-text-muted)'};
  font-size: 12px;
  line-height: 1.4;
`;

const Submit = styled.button<{ $loading: boolean }>`
  width: 100%;
  min-height: 50px;
  padding: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  background: var(--primary-accent);
  color: var(--global-primary-bg);
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: ${p => p.$loading ? 'wait' : 'pointer'};
  opacity: ${p => p.$loading ? 0.7 : 1};
`;

const Spinner = styled.span`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: auth-spin 0.7s linear infinite;

  @keyframes auth-spin {
    to { transform: rotate(360deg); }
  }
`;

const TermsNote = styled.p`
  margin: 14px 0 0;
  text-align: center;
  color: var(--global-text-muted);
  font-size: 12px;
  line-height: 1.5;
  a {
    color: var(--global-text-muted-strong);
    text-decoration: underline;
    text-underline-offset: 2px;
    &:hover { color: var(--global-text); }
  }
`;

const AuthFooter = styled.p`
  text-align: center;
  margin: 20px 0 0;
  color: var(--global-text-muted-strong);
  font-size: 13px;
  line-height: 1.5;
  a {
    color: var(--primary-accent);
    text-decoration: none;
    font-weight: 600;
    &:hover { text-decoration: underline; }
  }
`;

const Back = styled(Link)`
  color: var(--global-text-muted-strong);
  text-decoration: none;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  margin-bottom: 10px;
  align-self: flex-start;

  @media (min-width: 960px) {
    align-self: flex-end;
  }

  &:hover { color: var(--global-text); }
`;

/* Self-running entrance (rare surface — the one delight spend). CSS-only:
   no JS dependency, and reduced-motion keeps the resting state. */
const Entrance = styled.div<{ $delay?: string }>`
  min-width: 0;

  @media (prefers-reduced-motion: no-preference) {
    animation: auth-rise 0.26s cubic-bezier(0.23, 1, 0.32, 1) both;
    animation-delay: ${p => p.$delay || '0s'};
  }

  @keyframes auth-rise {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const cleanUsername = (raw: string): string => raw
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '')
  .slice(0, 20);

const passwordIssue = (password: string): string => {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one uppercase letter and one number.';
  }
  return '';
};

interface AuthErrorLike {
  message?: string;
  error_description?: string;
  error?: string;
}

const BENEFITS = [
  { icon: faClockRotateLeft, text: 'Watch history that follows you to every device' },
  { icon: faBookmark, text: 'Bookmarks kept in sync, everywhere you sign in' },
  { icon: faStar, text: 'Rate and track everything you have seen' },
];

const Auth = ({ mode }: { mode: 'login' | 'signup' | 'forgot' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentKind, setSentKind] = useState('');
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const requestId = useRef(0);
  const { signIn, signUp } = useAuth() ?? {};
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = mode === 'login';
  const isForgot = mode === 'forgot';
  const isSignup = !isLogin && !isForgot;

  // SEO metas/canonical for the public auth routes. Title strings are kept
  // byte-identical to the route-title effect below (which still owns the
  // previousTitle restore on unmount), so the two writes never disagree.
  useSeo({
    title: isForgot
      ? 'Reset Password · Aniraku'
      : isLogin
        ? 'Sign In · Aniraku'
        : 'Create Account · Aniraku',
    description: isForgot
      ? 'Reset your Aniraku account password. A secure reset link is sent to your email so you can choose a new one.'
      : isLogin
        ? 'Sign in to Aniraku to sync bookmarks, watch history, ratings, and community activity across devices.'
        : 'Create a free Aniraku account to sync bookmarks, watch history, ratings, and community activity across devices.',
    canonicalPath: isForgot
      ? '/auth/forgot-password'
      : isLogin
        ? '/login'
        : '/signup',
    noindex: true,
  });

  // Aniraku route titles.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = isForgot
      ? 'Reset Password · Aniraku'
      : isLogin
        ? 'Sign In · Aniraku'
        : 'Create Account · Aniraku';
    return () => {
      document.title = previousTitle;
    };
  }, [isForgot, isLogin]);

  useEffect(() => {
    if (!isSignup || !username) {
      setUsernameState('idle');
      return undefined;
    }

    const clean = cleanUsername(username);
    if (clean.length < 3) {
      setUsernameState('short');
      return undefined;
    }
    if (!isSupabaseConfigured) {
      setUsernameState('unavailable');
      return undefined;
    }

    const current = ++requestId.current;
    setUsernameState('checking');
    const timer = window.setTimeout(async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc('check_username_available', { username: clean });
        if (requestId.current !== current) return;
        if (rpcError || typeof data !== 'boolean') {
          console.warn('Username availability check failed:', rpcError);
          setUsernameState('unavailable');
          return;
        }
        setUsernameState(data ? 'available' : 'taken');
      } catch (checkError) {
        if (requestId.current === current) {
          console.warn('Username availability check failed:', checkError);
          setUsernameState('unavailable');
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      requestId.current += 1;
    };
  }, [isSignup, username]);

  useEffect(() => {
    if (isLogin && new URLSearchParams(location.search).get('password') === 'updated') {
      setSentKind('passwordUpdated');
    }
  }, [isLogin, location.search]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (isSignup) {
      const issue = passwordIssue(password);
      if (issue) { setError(issue); return; }
      if (usernameState === 'taken') { setError('That username is already taken. Choose another one.'); return; }
      if (usernameState === 'checking') { setError('Please wait while we check your username.'); return; }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn?.(email, password);
        navigate('/');
      } else {
        await signUp?.(email, password, cleanUsername(username));
        setSentKind('signup');
        setPassword('');
      }
    } catch (authError) {
      console.error('Auth error:', authError);
      const err = authError as AuthErrorLike | undefined;
      const message = err?.message
        ? (typeof err.message === 'string' ? err.message : JSON.stringify(err.message))
        : err?.error_description || err?.error || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryRequest = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email) {
      setError('Enter the email address associated with your Aniraku account.');
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Password recovery is not configured yet. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/new-password`,
      });
      if (recoveryError) throw recoveryError;
      setSentKind('recovery');
    } catch (recoveryError) {
      const err = recoveryError as AuthErrorLike | undefined;
      setError(err?.message || 'We could not send the recovery email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const title = isForgot ? 'Reset your password' : isLogin ? 'Welcome back' : 'Create account';
  const subtitle = isForgot
    ? 'Enter your email and we’ll send you a secure recovery link.'
    : isLogin
      ? 'Sign in to continue watching on Aniraku.'
      : 'Join Aniraku to keep your watch history, ratings, and bookmarks in sync.';

  return (
    <Wrapper id='main'>
      <Inner>
        <Back to={isForgot ? '/login' : '/'}>
          &larr; {isForgot ? 'Back to sign in' : 'Back to Home'}
        </Back>
        <Panel>
          <Entrance>
            <Aside aria-label='About Aniraku accounts'>
              <BrandRow>
                <BrandLogo src={BRAND_LOGO} alt='Aniraku logo' width='52' height='52' />
                <BrandNameRow>
                  <BrandName>Aniraku</BrandName>
                  <BrandTagline>
                    One account keeps your anime life in sync — history, bookmarks, and ratings travel with you.
                  </BrandTagline>
                </BrandNameRow>
              </BrandRow>
              <BenefitList>
                {BENEFITS.map((b) => (
                  <Benefit key={b.text}>
                    <BenefitIcon>
                      <FontAwesomeIcon icon={b.icon} aria-hidden='true' />
                    </BenefitIcon>
                    {b.text}
                  </Benefit>
                ))}
              </BenefitList>
              <AsideFootnote>
                Free and open source. An account is optional — you can browse and watch without one.
              </AsideFootnote>
            </Aside>
          </Entrance>

          <Entrance $delay='0.06s'>
            <Box>
              <Card>
              <Title>{title}</Title>
              <Subtitle>{subtitle}</Subtitle>

              {error && (
                <Message $tone='error' role='alert'>
                  <FontAwesomeIcon icon={faCircleExclamation} aria-hidden='true' />
                  <span>{error}</span>
                </Message>
              )}
              {sentKind === 'passwordUpdated' && (
                <Message $tone='success'>
                  <FontAwesomeIcon icon={faCircleCheck} aria-hidden='true' />
                  <span>Your password was updated. Sign in with your new password.</span>
                </Message>
              )}

              {sentKind === 'signup' ? (
                <Notice>
                  <FontAwesomeIcon icon={faEnvelopeOpenText} aria-hidden='true' />
                  <span>
                    <strong>Check your inbox</strong><br />
                    We sent an activation link to <strong>{email}</strong>.<br />
                    Check spam or junk if it does not arrive within a few minutes.
                  </span>
                </Notice>
              ) : sentKind === 'recovery' ? (
                <Notice>
                  <FontAwesomeIcon icon={faEnvelopeOpenText} aria-hidden='true' />
                  <span>
                    <strong>Recovery link sent</strong><br />
                    If an Aniraku account exists for <strong>{email}</strong>, a secure password-reset link is on its way.<br />
                    The link opens the dedicated new-password screen and can be used once.
                  </span>
                </Notice>
              ) : isForgot ? (
                <form onSubmit={handleRecoveryRequest} noValidate>
                  <Field>
                    <Label htmlFor='recovery-email'>Email address</Label>
                    <InputWrap>
                      <Input id='recovery-email' type='email' autoComplete='email' value={email} onChange={event => setEmail(event.target.value)} placeholder='you@example.com' required />
                    </InputWrap>
                  </Field>
                  <Submit type='submit' $loading={loading} disabled={loading}>
                    {loading && <Spinner aria-hidden='true' />}
                    {loading ? 'Sending recovery link…' : 'Send recovery link'}
                  </Submit>
                </form>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  {isSignup && (
                    <Field>
                      <LabelRow>
                        <Label htmlFor='signup-username'>Username</Label>
                      </LabelRow>
                      <InputWrap>
                        <Input id='signup-username' type='text' value={username} onChange={event => setUsername(event.target.value)} required placeholder='Choose a username' autoComplete='username' autoCapitalize='none' autoCorrect='off' spellCheck={false} $state={usernameState} aria-describedby='username-status' />
                        {usernameState === 'checking' && <InputStatus $state='checking'>checking…</InputStatus>}
                        {usernameState === 'available' && <InputStatus $state='available'>✓</InputStatus>}
                        {usernameState === 'taken' && <InputStatus $state='taken'>×</InputStatus>}
                      </InputWrap>
                      <FieldHint id='username-status' $state={usernameState} aria-live='polite'>
                        {usernameState === 'short' ? 'Use 3–20 letters, numbers, or underscores.' : ''}
                        {usernameState === 'available' ? `@${cleanUsername(username)} is available.` : ''}
                        {usernameState === 'taken' ? `@${cleanUsername(username)} is already taken.` : ''}
                        {usernameState === 'unavailable' ? 'Availability check is unavailable. You can still continue; we will verify on signup.' : ''}
                      </FieldHint>
                    </Field>
                  )}

                  <Field>
                    <Label htmlFor='auth-email'>Email address</Label>
                    <InputWrap>
                      <Input id='auth-email' type='email' autoComplete='email' value={email} onChange={event => setEmail(event.target.value)} required placeholder='you@example.com' />
                    </InputWrap>
                  </Field>

                  <Field>
                    <LabelRow>
                      <Label htmlFor='auth-password'>Password</Label>
                      {isLogin && <ForgotLink to='/auth/forgot-password'>Forgot password?</ForgotLink>}
                    </LabelRow>
                    <InputWrap>
                      <PasswordInput id='auth-password' type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} required placeholder={isSignup ? 'Create a password' : 'Your password'} />
                      <PasswordToggle
                        type='button'
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} aria-hidden='true' />
                      </PasswordToggle>
                    </InputWrap>
                    {isSignup && (
                      <PasswordHint
                        $tone={password ? (passwordIssue(password) ? 'error' : 'ok') : 'idle'}
                        aria-live='polite'
                      >
                        {password
                          ? passwordIssue(password) || 'Looks good.'
                          : '8+ characters, with at least one uppercase letter and a number.'}
                      </PasswordHint>
                    )}
                  </Field>

                  <Submit type='submit' $loading={loading} disabled={loading}>
                    {loading && <Spinner aria-hidden='true' />}
                    {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
                  </Submit>

                  {isSignup && (
                    <TermsNote>
                      By creating an account you agree to our{' '}
                      <Link to='/terms'>Terms</Link> and{' '}
                      <Link to='/privacy'>Privacy Policy</Link>.
                    </TermsNote>
                  )}
                </form>
              )}

              <AuthFooter>
                {isForgot ? 'Remember your password? ' : isLogin ? 'Don’t have an account? ' : 'Already have an account? '}
                <Link to={isForgot ? '/login' : isLogin ? '/signup' : '/login'}>
                  {isForgot ? 'Sign in' : isLogin ? 'Sign up' : 'Sign in'}
                </Link>
              </AuthFooter>
              </Card>
            </Box>
          </Entrance>
        </Panel>
      </Inner>
    </Wrapper>
  );
};

export default Auth;
