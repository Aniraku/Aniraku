import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { setStaticPageSEO } from '../lib/seo'

const Privacy = () => {
  useEffect(() => {
    setStaticPageSEO('Privacy Policy', '/privacy')
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Link to="/home" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14 }}>&larr; Back to Home</Link>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginTop: 20, marginBottom: 30 }}>Privacy Policy</h1>
        <div style={{ color: '#ccc', lineHeight: 1.8, fontSize: 14 }}>
          <p style={{ marginTop: 12 }}>Last updated: July 2026</p>

          <h2 style={{ color: '#fff', marginTop: 24 }}>1. Information We Collect</h2>
          <p style={{ marginTop: 8 }}>
            Aniraku collects minimal personal information. When you create an account, we collect your email
            address and username. We do not collect or store payment information, browsing history, or
            personally identifiable information beyond what is necessary for account functionality.
          </p>

          <h3 style={{ color: '#fff', marginTop: 20 }}>2. How We Use Your Information</h3>
          <p style={{ marginTop: 8 }}>
            We use your information solely to provide and improve our services, including:
            maintaining your account, personalizing your experience, and communicating with you about
            service updates. We do not sell or share your personal information with third parties.
          </p>

          <h3 style={{ color: '#fff', marginTop: 20 }}>3. Data Storage</h3>
          <p style={{ marginTop: 8 }}>
            Your data is stored securely using Supabase, a trusted backend-as-a-service provider.
            All data is encrypted at rest and in transit. We implement Row Level Security to ensure
            that only you can access your own data.
          </p>

          <h3 style={{ color: '#fff', marginTop: 20 }}>4. Cookies</h3>
          <p style={{ marginTop: 8 }}>
            Aniraku uses httpOnly cookies for authentication purposes only. These cookies are essential
            for the application to function and are not used for tracking or advertising.
          </p>

          <h3 style={{ color: '#fff', marginTop: 20 }}>5. Third-Party Services</h3>
          <p style={{ marginTop: 8 }}>
            We use Supabase for authentication and data storage. We use AniList for anime metadata.
            We do not share your personal data with these services beyond what is necessary for
            authentication functionality.
          </p>

          <h3 style={{ color: '#fff', marginTop: 20 }}>6. Children's Privacy</h3>
          <p style={{ marginTop: 8 }}>
            Aniraku is not intended for children under 13 years of age. We do not knowingly collect
            personal information from children under 13.
          </p>

          <h3 style={{ color: '#fff', marginTop: 20 }}>7. Changes to This Policy</h3>
          <p style={{ marginTop: 8 }}>
            We may update this privacy policy from time to time. We will notify you of any changes
            by posting the new policy on this page with an updated revision date.
          </p>

          <h3 style={{ color: '#fff', marginTop: 20 }}>8. Contact Us</h3>
          <p style={{ marginTop: 8 }}>
            If you have questions about this Privacy Policy, please contact us at privacy@aniraku.app
          </p>
        </div>
      </div>
    </div>
  )
}

export default Privacy
