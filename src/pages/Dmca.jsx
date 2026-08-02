import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import Footer from '../components/Footer/Footer'
import { setStaticPageSEO } from '../lib/seo'

const Dmca = () => {
  useEffect(() => {
    setStaticPageSEO('DMCA', '/dmca')
  }, [])

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', padding: '40px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link to="/home" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14 }}>&larr; Back to Home</Link>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginTop: 20, marginBottom: 12 }}>DMCA &amp; Content Policy</h1>
          <p style={{ color: '#888', marginBottom: 28, fontSize: 14 }}>Last updated: July 16, 2026</p>

          <div style={{ color: '#ccc', lineHeight: 1.8, fontSize: 14 }}>
            <section style={sectionStyle}>
              <h2 style={h2}>We do not host media</h2>
              <p>
                <strong>Aniraku does not host, store, cache permanently, or upload video or manga image files
                on Aniraku servers.</strong> Aniraku is an open-source client application (similar in spirit to
                self-hosted media clients such as Seanime) that:
              </p>
              <ul style={{ paddingLeft: 20, marginTop: 10 }}>
                <li>Fetches <strong>metadata</strong> from public APIs (primarily AniList)</li>
                <li>Resolves <strong>playback URLs</strong> from publicly available third-party sources at request time</li>
                <li>Optionally proxies short-lived stream requests so the browser player can play HLS/MP4 correctly</li>
              </ul>
              <p style={{ marginTop: 10 }}>
                Aniraku is not a file host, CDN, or piracy warehouse. No copyrighted episode libraries are stored
                in our database.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2}>Public sources &amp; user responsibility</h2>
              <p>
                Stream links are collected from sources that are already publicly reachable on the internet.
                You are solely responsible for ensuring that your use of third-party sources complies with the
                laws that apply to you. If a source is unavailable or restricted in your region, Aniraku cannot
                guarantee playback.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2}>Copyright complaints (DMCA)</h2>
              <p>
                If you are a copyright owner (or an authorized agent) and believe that a specific third-party
                source linked through Aniraku infringes your rights, please send a notice including:
              </p>
              <ol style={{ paddingLeft: 20, marginTop: 10 }}>
                <li>Your contact information</li>
                <li>Description of the copyrighted work</li>
                <li>The exact URL or anime ID / episode reference on Aniraku</li>
                <li>A statement of good-faith belief that the use is not authorized</li>
                <li>A statement under penalty of perjury that the information is accurate</li>
                <li>Your physical or electronic signature</li>
              </ol>
              <p style={{ marginTop: 12 }}>
                Designated contact: <span style={{ color: 'var(--accent)' }}>dmca@aniraku.app</span> (or open an issue
                on the public GitHub repository for self-hosted instances).
              </p>
              <p style={{ marginTop: 10 }}>
                Upon a valid notice we will review and, where appropriate, disable the resolution path for the
                identified source or remove community-generated content (comments, profiles) that we control.
                We cannot remove media hosted by unrelated third parties — only how this client surfaces links.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2}>Counter-notification</h2>
              <p>
                If you believe content or a link was disabled by mistake, you may submit a counter-notification
                with your contact details, identification of the material, and a statement under penalty of
                perjury that the material was removed in error.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2}>Open source</h2>
              <p>
                Aniraku source code is licensed under the <Link to="/license" style={{ color: 'var(--accent)' }}>GNU AGPL v3</Link>.
                Running a modified network service requires sharing corresponding source under AGPL.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

const sectionStyle = { marginBottom: 28 }
const h2 = { color: '#fff', fontSize: 20, marginBottom: 10 }

export default Dmca
