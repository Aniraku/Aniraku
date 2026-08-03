import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import styled from 'styled-components'

const Wrapper = styled.div`
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`

const Box = styled.div`
  width: 100%;
  max-width: 420px;
`

const Back = styled(Link)`
  color: var(--accent);
  text-decoration: none;
  font-size: 14px;
  display: block;
  margin-bottom: 24px;
  &:hover { text-decoration: underline; }
`

const Card = styled.div`
  background: var(--bg-card);
  border-radius: 16px;
  padding: 40px 32px;
  border: 1px solid var(--border);
  @media (max-width: 480px) {
    padding: 28px 20px;
    border-radius: 12px;
  }
`

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
  color: var(--text-primary);
`

const Subtitle = styled.p`
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  margin-bottom: 28px;
`

const Error = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  color: #ef4444;
  font-size: 13px;
`

const Field = styled.div`
  margin-bottom: 16px;
`

const Label = styled.label`
  display: block;
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 6px;
`

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  &:focus { border-color: var(--accent); }
`

const Submit = styled.button`
  width: 100%;
  padding: 12px;
  background: var(--accent);
  color: var(--bg);
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: ${p => p.$loading ? 'wait' : 'pointer'};
  opacity: ${p => p.$loading ? 0.7 : 1};
`

const Footer = styled.p`
  text-align: center;
  margin-top: 20px;
  color: var(--text-muted);
  font-size: 13px;
  a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    &:hover { text-decoration: underline; }
  }
`

const ForgotLink = styled.button`
  background: none;
  border: none;
  color: var(--accent);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  float: right;
  margin-top: -10px;
  margin-bottom: 16px;
  &:hover { text-decoration: underline; }
`

const Auth = ({ mode }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [usernameAvail, setUsernameAvail] = useState(null)
  const [checkingName, setCheckingName] = useState(false)
  const timer = useRef(null)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  // Password recovery: the reset email links back to /login carrying a
  // recovery session. Detect it (event, or hash on a fresh load) and swap
  // the form for a "set new password" screen.
  useEffect(() => {
    if (!isLogin) return
    let mounted = true
    const params = new URLSearchParams(window.location.hash.replace(/^#/, '?'))
    if (params.get('type') === 'recovery') setRecovering(true)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY' && session) setRecovering(true)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [isLogin])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!username || !isSupabaseConfigured) { setUsernameAvail(null); setCheckingName(false); return }
    const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 20)
    if (clean.length < 3) { setUsernameAvail(null); setCheckingName(false); return }
    setCheckingName(true)
    timer.current = setTimeout(async () => {
      const { data } = await supabase.rpc('check_username_available', { username: clean })
      setUsernameAvail(data)
      setCheckingName(false)
    }, 400)
  }, [username])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
        navigate('/home')
      } else {
        await signUp(email, password, username)
        setSent(true)
        setPassword('')
      }
    } catch (err) {
      console.error('Auth error:', err)
      const msg = err?.message
        ? (typeof err.message === 'string' ? err.message : JSON.stringify(err.message))
        : err?.error_description || err?.error || err?.status || (err?.__isAuthError ? 'Auth API error' : null)
      setError(msg || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async () => {
    if (!email) { setError('Enter your email first'); return }
    setError('')
    setLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      navigate('/home')
    } catch (err) {
      console.error('Reset error:', err)
      setError(err?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Wrapper>
      <Box>
        <Back to="/home">&larr; Back to Home</Back>
        <Card>
          <Title>{isLogin ? 'Welcome Back' : 'Create Account'}</Title>
          <Subtitle>{isLogin ? 'Sign in to your Aniraku account' : 'Join Aniraku to start watching'}</Subtitle>

          {error && <Error>{error}</Error>}
          {sent && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 12, padding: '24px 20px', marginBottom: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
              <p style={{ color: '#22c55e', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                Verify your email
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                We sent a verification link to <strong style={{ color: '#22c55e' }}>{email}</strong>.<br />
                Click the link in the email to activate your account.
              </p>
              <p style={{ color: '#eab308', fontSize: 13, lineHeight: 1.5, marginTop: 12, padding: '8px 10px', background: 'rgba(234,179,8,0.1)', borderRadius: 8, border: '1px solid rgba(234,179,8,0.2)' }}>
                ⚠️ Check your spam or junk folder if you don't see the email.
              </p>
            </div>
          )}

          {!sent && recovering && isLogin && (
            <form onSubmit={handleResetPassword}>
              <Field>
                <Label>New Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} autoFocus />
              </Field>
              <Submit type="submit" $loading={loading}>
                {loading ? 'Please wait...' : 'Set New Password'}
              </Submit>
            </form>
          )}

          {!sent && !recovering && <form onSubmit={handleSubmit}>
            {!isLogin && (
              <Field>
                <Label>Username</Label>
                <div style={{ position: 'relative' }}>
                  <Input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Choose a username" />
                  {username.length >= 3 && (checkingName
                    ? <span style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-muted)', fontSize: 12 }}>checking…</span>
                    : usernameAvail === true
                      ? <span style={{ position: 'absolute', right: 12, top: 10, color: '#22c55e', fontSize: 16 }}>✓</span>
                      : usernameAvail === false
                        ? <span style={{ position: 'absolute', right: 12, top: 10, color: '#ef4444', fontSize: 16, cursor: 'default' }} title="Username taken">✕</span>
                        : null)}
                </div>
              </Field>
            )}

            <Field>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </Field>

            <Field>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} />
            </Field>

            {isLogin && <ForgotLink type="button" onClick={handleForgot} disabled={loading}>Forgot password?</ForgotLink>}

            <Submit type="submit" $loading={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Submit>
          </form>}

          <Footer>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link to={isLogin ? '/signup' : '/login'}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Link>
          </Footer>
        </Card>
      </Box>
    </Wrapper>
  )
}

export default Auth
