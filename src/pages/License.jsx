import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import Footer from '../components/Footer/Footer'
import { setStaticPageSEO } from '../lib/seo'

const License = () => {
  useEffect(() => {
    setStaticPageSEO('AGPL-3.0 License', '/license')
  }, [])

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', padding: '40px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link to="/home" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14 }}>&larr; Back to Home</Link>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginTop: 20, marginBottom: 12 }}>Open Source License</h1>
          <p style={{ color: '#888', marginBottom: 28, fontSize: 14 }}>GNU Affero General Public License v3.0 (AGPL-3.0)</p>

          <div style={{ color: '#ccc', lineHeight: 1.8, fontSize: 14 }}>
            <p>
              Copyright (C) 2026 Aniraku Contributors
            </p>
            <p style={{ marginTop: 12 }}>
              This program is free software: you can redistribute it and/or modify it under the terms of the
              GNU Affero General Public License as published by the Free Software Foundation, either version 3
              of the License, or (at your option) any later version.
            </p>
            <p style={{ marginTop: 12 }}>
              This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
              even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
              Affero General Public License for more details.
            </p>

            <h2 style={{ color: '#fff', marginTop: 28, fontSize: 20 }}>What AGPL means for you</h2>
            <ul style={{ paddingLeft: 20, marginTop: 10 }}>
              <li><strong>Use freely</strong> — run Aniraku locally or on your own server</li>
              <li><strong>Study &amp; modify</strong> — the full source is available</li>
              <li><strong>Share</strong> — redistribute under the same license</li>
              <li><strong>Network copyleft</strong> — if you offer a modified Aniraku over a network, you must
                offer the corresponding source code to users of that service</li>
            </ul>

            <h2 style={{ color: '#fff', marginTop: 28, fontSize: 20 }}>Content disclaimer (not a license term)</h2>
            <p style={{ marginTop: 10 }}>
              Aniraku is a client that resolves public stream links and AniList metadata. It does not host
              copyrighted media libraries. See the <Link to="/dmca" style={{ color: 'var(--accent)' }}>DMCA page</Link> and
              {' '}<Link to="/terms" style={{ color: 'var(--accent)' }}>Terms</Link>.
            </p>

            <h2 style={{ color: '#fff', marginTop: 28, fontSize: 20 }}>Full license text</h2>
            <p style={{ marginTop: 10 }}>
              The complete AGPL-3.0 text is in the repository <code style={{ color: 'var(--accent)' }}>LICENSE</code> file
              and at{' '}
              <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                gnu.org/licenses/agpl-3.0.html
              </a>.
            </p>

            <h2 style={{ color: '#fff', marginTop: 28, fontSize: 20 }}>Third-party notices</h2>
            <p style={{ marginTop: 10 }}>
              AniList, Jikan/MAL, and any third-party stream hosts remain the property of their respective owners.
              Aniraku is not affiliated with or endorsed by them.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default License
