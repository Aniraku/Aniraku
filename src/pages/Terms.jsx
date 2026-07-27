import React from 'react'
import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'

const Terms = () => {
  return (
    <>
      <NavBar />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', padding: '40px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link to="/home" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14 }}>&larr; Back to Home</Link>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginTop: 20, marginBottom: 12 }}>Terms of Use</h1>
          <p style={{ color: '#888', marginBottom: 28, fontSize: 14 }}>Last updated: July 16, 2026</p>

          <div style={{ color: '#ccc', lineHeight: 1.8, fontSize: 14 }}>
            <h2 style={h2}>1. Service description</h2>
            <p>
              Aniraku is an open-source, community-oriented anime client. It provides a UI for browsing AniList
              metadata, tracking progress, community features, and resolving publicly available stream links
              for playback. <strong>Aniraku does not host video content.</strong>
            </p>

            <h2 style={h2}>2. Accounts</h2>
            <p>
              You may create an account via Supabase Auth. You are responsible for keeping credentials secure
              and for activity under your account. Community features (comments, profiles) must not include
              illegal, abusive, or spam content.
            </p>

            <h2 style={h2}>3. No media hosting</h2>
            <p>
              Stream links are obtained from third-party public sources. We do not claim ownership of anime titles,
              artwork, or episode files. Metadata may come from AniList under their API terms.
            </p>

            <h2 style={h2}>4. Acceptable use</h2>
            <ul style={{ paddingLeft: 20 }}>
              <li>Do not abuse the API, scrape aggressively, or attack infrastructure</li>
              <li>Do not upload malware or attempt to compromise other users</li>
              <li>Do not use the service where doing so violates your local law</li>
            </ul>

            <h2 style={h2}>5. Disclaimer</h2>
            <p>
              THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND. Playback quality and availability
              depend entirely on third-party sources outside our control.
            </p>

            <h2 style={h2}>6. License</h2>
            <p>
              Source code is licensed under <Link to="/license" style={{ color: 'var(--accent)' }}>AGPL-3.0</Link>.
              See also <Link to="/dmca" style={{ color: 'var(--accent)' }}>DMCA</Link> and{' '}
              <Link to="/privacy" style={{ color: 'var(--accent)' }}>Privacy</Link>.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

const h2 = { color: '#fff', fontSize: 18, marginTop: 24, marginBottom: 8 }

export default Terms
