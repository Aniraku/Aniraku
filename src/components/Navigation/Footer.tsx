// Footer — the ORIGINAL live-parity footer, adapted per the user's delta-2
// correction ("update the OLD footer with adaption — NOT completely change
// it"). Structure kept: footerPageWrapper → footer → Main Footer block
// (disclaimer + easter-egg logo img) → Sub Footer block (copyright + theme
// buttons), all on the existing globals.css framework.
// REMOVED per mandate: the Schedule link, Status link, Domains link, the
// Trending/Search page-redirect links, and the site-credit link.
// RESTORED (user's later approval, supersedes delta-2 for these three only):
// the GitHub social link, the "Report an issue" link, and the embedded TMDB
// logo + attribution block. Discord stays out (not requested).
// KEPT: the logo img (footerLogoImage + app-icon classes — the user's custom
// logo has landed: img src = BRAND_LOGO import, mask = its public copy), the
// live `Zh.i`
// easter-egg click handler (verbatim semantics), the disclaimer line, the
// version badge, and the theme buttons (controls, not links).
// BRAND: copyright line carries the verbatim Aniraku source wording — zero
// user-visible brand outside "Aniraku" (final brand).
// COMPACT: paddings tightened inline only (no stylesheet edits).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import { BRAND_LOGO } from '../../lib/brand';
import { useTheme } from '../ThemeContext';
import { showToast } from '../Toaster';

// old Footer.jsx constant — TMDB's official v4 long logo (external SVG).
const TMDB_LOGO_URL =
  'https://www.themoviedb.org/assets/v4/logos/v2/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg';

// old footer external links (GitHub + issues), verbatim targets.
const GITHUB_URL = 'https://github.com/Aniraku/Aniraku';
const GITHUB_ISSUES_URL = 'https://github.com/Aniraku/Aniraku/issues';

const THEMES = ['system', 'light', 'dark', 'anilist', 'catppuccin'] as const;
type ThemeName = (typeof THEMES)[number];

// live renders icon glyphs here (We/Ye/qh/Jh/Wh svgs); text labels are kept
// as the local presentation (reported divergence) while every attribute —
// title, aria-label, data-current, setTheme(name) — matches live verbatim.
const THEME_LABELS: Record<ThemeName, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
  anilist: 'AniList',
  catppuccin: 'Catppuccin',
};

// live `Zh.i` toast-type ring: ['success','error','warning','info','default']
const TOAST_TYPES = ['success', 'error', 'warning', 'info', 'default'] as const;

const Footer = () => {
  const { theme, setTheme } = useTheme();
  const [clickCount, setClickCount] = useState(0);
  const [isPWA] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches
  );

  // live `Zh.i` — footer-logo easter egg, verbatim semantics: the increment
  // is functional but the check reads the PRE-increment closure value (fires
  // on the click AFTER the count hits a positive multiple of 50), and the
  // toast type is TYPES[count % 5] (always 'success' at multiples of 50 —
  // 50 % 5 === 0), message `You clicked ${count} times!`.
  const handleLogoClick = () => {
    setClickCount((count) => count + 1);
    if (clickCount > 0 && clickCount % 50 === 0) {
      const type = TOAST_TYPES[clickCount % TOAST_TYPES.length];
      showToast(`You clicked ${clickCount} times!`, { type });
    }
  };

  return (
    <div className="footerPageWrapper" data-is-pwa={String(isPWA)}>
      <footer>
        {/* live Main Footer: brand row (logo easter egg + copyright) +
            disclaimer — one compact centered stack */}
        <div
          className="footerBaseContainer"
          data-sub="false"
          aria-label="Main Footer"
          style={{
            padding: '0.75rem 0 0.5rem',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '0.4rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {/* plain img on purpose: the user's custom logo is a full-color
                portrait — the old app-icon mask+tint pipeline (built for the
                monochrome glyph) hid it */}
            <img
              className="footerLogoImage"
              src={BRAND_LOGO}
              alt=""
              onClick={handleLogoClick}
              style={{ width: '2rem', height: '2rem' }}
            />
            <p
              className="footerText"
              data-issub="true"
              style={{ padding: 0, flex: '0 1 auto' }}
            >
              &copy; 2026 Aniraku Contributors &middot; AGPL-3.0 &middot; Not
              affiliated with AniList or any studio
            </p>
          </div>
          <p className="footerText" data-issub="false" style={{ padding: 0 }}>
            <span style={{ maxWidth: '62ch', fontSize: '0.7rem' }}>
              This website does not retain any files on its server. Rather, it
              solely provides links to media content hosted by third-party
              services.
            </span>
          </p>
        </div>

        {/* live Sub Footer: verbatim Aniraku copyright + version badge +
            theme buttons (setTheme, not toggle); site-credit line removed
            (delta-2). RESTORED: legal nav + GitHub/issues + TMDB (user's
            later approval). The base stylesheet flips this container to a
            ROW ≥601px — with five children that scattered copyright into a
            crushed word-column beside stray link groups (mobile screencast).
            The inline rule keeps the sub block a centered STACK at every
            width; only the single-child main block stays row-mode. */}
        <div
          className="footerBaseContainer"
          data-sub="true"
          aria-label="Sub Footer"
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '0.45rem',
            textAlign: 'center',
            marginTop: '0.25rem',
            padding: '0.5rem 0 1rem',
          }}
        >
          {/* user mandate: the legal-links block lives in the GLOBAL footer,
              at the bottom of every page (page-level strips retired).
              Single wrapped row: legal + project links share one line. */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px 14px',
            }}
          >
            <nav
              className='footerLegalNav'
              aria-label='Legal links'
              style={{ padding: 0 }}
            >
              <Link to='/privacy'>Privacy</Link>
              <Link to='/terms'>Terms</Link>
              <Link to='/dmca'>DMCA</Link>
              <Link to='/license'>AGPL License</Link>
              <Link to='/community-guidelines'>Community Guidelines</Link>
            </nav>
            {/* restored per user approval: GitHub + Report an issue (old footer
                socials/issues links), same styling class as the legal nav */}
            <nav
              className='footerLegalNav'
              aria-label='Project links'
              style={{ padding: 0 }}
            >
              <a href={GITHUB_URL} target='_blank' rel='noreferrer'>
                <FaGithub
                  size={12}
                  style={{ verticalAlign: '-1px', marginRight: '4px' }}
                />
                GitHub
              </a>
              <a href={GITHUB_ISSUES_URL} target='_blank' rel='noreferrer'>
                Report an issue
              </a>
            </nav>
          </div>
          <div
            className="socialThemeContainer"
            style={{ padding: 0, justifyContent: 'center' }}
          >
            {/* wrap: five theme buttons overflowed 360px screens with
                "Catppuccin" cut at the edge (screencast); compact sizing
                keeps the whole strip on one line at most widths */}
            <div
              className="footerThemeButtons"
              style={{ flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="footerThemeBtn"
                  onClick={() => setTheme(t)}
                  title={t.toUpperCase()}
                  aria-label={`Switch to ${t} theme`}
                  data-current={theme === t ? 'true' : 'false'}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                >
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          {/* restored per user approval: embedded TMDB logo + attribution —
              compact micro-row (small logo, single short caption) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              maxWidth: 'min(430px, 100%)',
              margin: '0 auto',
              fontSize: '0.62rem',
              lineHeight: 1.4,
              color: 'var(--global-text-muted)',
              textAlign: 'left',
            }}
          >
            <a
              href='https://www.themoviedb.org/'
              target='_blank'
              rel='noreferrer'
              aria-label='Visit the official TMDB website'
              style={{ flex: '0 0 auto' }}
            >
              <img
                src={TMDB_LOGO_URL}
                alt='TMDB'
                style={{ display: 'block', width: '72px', height: 'auto' }}
              />
            </a>
            <span style={{ minWidth: 0 }}>
              This product uses TMDB and the TMDB APIs but is not endorsed,
              certified, or otherwise approved by TMDB.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
