import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
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
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const isLogin = mode === 'login'

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
      } else {
        await signUp(email, password, username)
      }
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Something went wrong')
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

  return (
    <Wrapper>
      <Box>
        <Back to="/home">&larr; Back to Home</Back>
        <Card>
          <Title>{isLogin ? 'Welcome Back' : 'Create Account'}</Title>
          <Subtitle>{isLogin ? 'Sign in to your Aniraku account' : 'Join Aniraku to start watching'}</Subtitle>

          {error && <Error>{error}</Error>}
          {sent && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#22c55e', fontSize: 13 }}>Reset link sent! Check your email.</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <Field>
                <Label>Username</Label>
                <Input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Choose a username" />
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
          </form>

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
