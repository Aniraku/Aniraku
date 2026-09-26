// src/pages/About.tsx — /about (SEO/GEO page).
//
// Rewrite of the previously unrouted About page (the live site 404s /about;
// App.tsx now routes it). Restructure only: every sentence of the original
// copy is kept verbatim — the change is structure (one H1, one H2 per
// question, real heading styles instead of the non-existent `title-style`
// class) plus two new blocks the original lacked: a quick-facts table and an
// internal-link list, both of which answer engines and crawlers lean on.
// useSeo supplies title/description/canonical/AboutPage JSON-LD (the old
// page only set document.title).
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaGithub } from 'react-icons/fa';
import { useSeo, breadcrumbLd, SITE_URL } from '../utils/seo';
// Donation methods shared with the navbar-heart SupportPrompt modal — one
// source of truth for Patreon/Binance so copy can't drift between surfaces.
import {
  PATREON_URL,
  SUPPORT_FUNDING_COPY,
  BINANCE_PAY_UID,
} from '../lib/support';

const GITHUB_URL = 'https://github.com/Aniraku/Aniraku';

const Keyword = styled.span`
  font-weight: bold;
  color: var(--primary-accent);
  position: relative;
  margin-right: 0.2rem;

  ::before {
    content: '\u25A0';
    font-size: 0.8rem;
    position: absolute;
    top: 0;
    left: -0.5rem;
    color: var(--primary-accent);
  }
`;

const Paragraph = styled.p`
  font-size: 1rem;
  margin-bottom: 1rem;
  line-height: 1.6;
  color: var(--global-text);
`;

const MainContent = styled.main`
  max-width: 56rem;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  color: var(--global-text);
  font-size: 1rem;
  line-height: 1.6;

  h1 {
    margin: 0 0 0.75rem;
    font-size: clamp(28px, 5vw, 42px);
    letter-spacing: -0.05em;
    line-height: 1.1;
  }
  h2 {
    margin: 2rem 0 0.75rem;
    font-size: clamp(20px, 3vw, 26px);
    letter-spacing: -0.03em;
    scroll-margin-top: 6rem;
  }
`;

const Lead = styled.p`
  max-width: 68ch;
  margin: 0 0 1.5rem;
  color: var(--global-text-muted-strong);
  font-size: 15px;
  line-height: 1.75;
`;

const Bullet = styled.p`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  margin-bottom: 0.85rem;
  line-height: 1.6;
  color: var(--global-text);

  svg {
    flex: 0 0 auto;
    margin-top: 0.28rem;
    color: var(--primary-accent);
  }
  strong {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
  }
`;

const FactTable = styled.table`
  width: 100%;
  margin: 0.5rem 0 1rem;
  border-collapse: collapse;
  font-size: 14.5px;

  th,
  td {
    padding: 10px 12px;
    border: 1px solid var(--global-border-color);
    text-align: left;
    vertical-align: top;
    line-height: 1.55;
  }
  th {
    width: 34%;
    background: var(--global-div);
    color: var(--global-text);
    font-weight: 700;
  }
  td {
    background: var(--global-primary-bg);
    color: var(--global-text-muted-strong);
  }

  @media (max-width: 560px) {
    th {
      width: 40%;
    }
    th,
    td {
      padding: 8px 9px;
      font-size: 13.5px;
    }
  }
`;

const LinkGrid = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0.5rem 0 1rem;
  padding: 0;
  list-style: none;

  a {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    border: 1px solid var(--global-border-color);
    border-radius: 8px;
    background: var(--global-div);
    color: var(--global-text-muted-strong);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;

    &:hover {
      border-color: var(--primary-accent);
      color: var(--global-text);
    }
  }
`;

// Quick-facts table — every value is something the site's own pages already
// state (Privacy / Terms / DMCA / README), so it is safe to assert.
const FACTS: Array<[string, string]> = [
  ['What it is', 'Free anime streaming website — subtitled and dubbed (sub & dub), in HD'],
  ['Price', 'Free. No subscription, and no sign-up required to browse or watch'],
  ['Metadata source', 'AniList, with TMDB-backed enrichment for some episode details'],
  ['Languages', 'Japanese audio with English subtitles and English dubs'],
  ['Devices', 'Any modern browser on desktop, mobile and tablet; installable as a PWA'],
  ['Source code', 'Public on GitHub under the GNU AGPL-3.0 license'],
  ['Founded', '2025'],
  ['Contact', 'sho.islam0311@proton.me — copyright & content reports'],
];

const About = () => {
  useSeo({
    title: 'About Aniraku — Free Open-Source Anime Streaming Site',
    description:
      'Aniraku is a free, open-source anime streaming website for watching subtitled and dubbed anime in HD. See what it is, how it works, what it costs and who runs it.',
    canonicalPath: '/about',
    jsonLd: [
      breadcrumbLd('About', '/about'),
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About Aniraku',
        url: `${SITE_URL}/about`,
        inLanguage: 'en-US',
        about: {
          '@type': 'Organization',
          name: 'Aniraku',
          url: SITE_URL,
        },
        mainEntity: {
          '@type': 'Organization',
          name: 'Aniraku',
          url: SITE_URL,
          description:
            'Aniraku is a free, open-source anime streaming website for watching subtitled and dubbed anime in HD.',
        },
      },
    ],
  });

  return (
    <MainContent>
      <h1>About Aniraku</h1>
      <Lead>
        Aniraku is a free anime streaming site with subtitles and dubs, built
        as an open-source project and powered by AniList metadata. This page
        explains what the site is, how it stays free and where to go next.
      </Lead>

      <h2 id='what-is-aniraku'>What&apos;s Aniraku?</h2>
      <Paragraph>
        Aniraku is an anime streaming site where you can watch anime online in
        HD quality with English subtitles or dubbing. You can also download any
        anime you want without registration.
      </Paragraph>

      <h2 id='is-aniraku-safe'>Is Aniraku safe?</h2>
      <Paragraph>
        Yes. We do not share or sell your personal information with anyone for
        marketing, advertising, or data-broker purposes. We started this site
        to improve UX and are committed to keeping our users safe. We
        encourage all our users to notify us if anything looks suspicious.
        Aniraku runs no advertising — voluntary support funds{' '}
        {SUPPORT_FUNDING_COPY.toLowerCase()} — so if Aniraku has helped you
        find something to watch, you can{' '}
        <a href={PATREON_URL} target='_blank' rel='noreferrer'>
          support us on Patreon
        </a>{' '}
        or send Binance Pay to UID {BINANCE_PAY_UID}.
      </Paragraph>

      <h2 id='why-aniraku'>Why Aniraku?</h2>
      <Bullet>
        <strong>
          <FaCheckCircle /> Content Library:
        </strong>
        We have a vast collection of both old and new anime, making us one of
        the largest anime libraries on the web.
      </Bullet>
      <Bullet>
        <strong>
          <FaCheckCircle /> Streaming Experience:
        </strong>
        Enjoy <Keyword>fast and reliable</Keyword> streaming with our{' '}
        <Keyword>top-of-the-line servers</Keyword>.
      </Bullet>
      <Bullet>
        <strong>
          <FaCheckCircle /> Quality/Resolution:
        </strong>
        Our videos are available in <Keyword>high resolution</Keyword>, and we
        offer quality settings to suit your internet speed.
      </Bullet>
      <Bullet>
        <strong>
          <FaCheckCircle /> Frequent Updates:
        </strong>
        Our content is updated hourly to provide you with the{' '}
        <Keyword>latest releases</Keyword>.
      </Bullet>
      <Bullet>
        <strong>
          <FaCheckCircle /> User-Friendly Interface:
        </strong>
        We focus on <Keyword>simplicity and ease of use</Keyword>.
      </Bullet>
      <Bullet>
        <strong>
          <FaCheckCircle /> Device Compatibility:
        </strong>
        Aniraku works seamlessly on both{' '}
        <Keyword>desktop and mobile devices</Keyword>.
      </Bullet>
      <Bullet>
        <strong>
          <FaCheckCircle /> Community:
        </strong>
        Join our active <Keyword>community of anime lovers</Keyword>.
      </Bullet>

      <h2 id='quick-facts'>Quick facts</h2>
      <FactTable>
        <tbody>
          {FACTS.map(([label, value]) => (
            <tr key={label}>
              <th scope='row'>{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </FactTable>

      <h2 id='explore'>Explore Aniraku</h2>
      <Paragraph>
        Start with what is airing right now, or jump straight to the full
        catalog. Everything below works without an account.
      </Paragraph>
      <LinkGrid>
        <li>
          <Link to='/trending'>Trending anime</Link>
        </li>
        <li>
          <Link to='/schedule'>Weekly schedule</Link>
        </li>
        <li>
          <Link to='/search'>Search the catalog</Link>
        </li>
        <li>
          <Link to='/faq'>Frequently asked questions</Link>
        </li>
      </LinkGrid>

      <h2 id='project'>Project &amp; policies</h2>
      <Paragraph>
        Aniraku is an open-source project: the code, the issue tracker and every
        policy page are public.
      </Paragraph>
      <LinkGrid>
        <li>
          <a href={GITHUB_URL} target='_blank' rel='noreferrer'>
            <FaGithub /> Source code
          </a>
        </li>
        <li>
          <Link to='/license'>AGPL-3.0 license</Link>
        </li>
        <li>
          <Link to='/privacy'>Privacy policy</Link>
        </li>
        <li>
          <Link to='/terms'>Terms</Link>
        </li>
        <li>
          <Link to='/dmca'>DMCA &amp; copyright</Link>
        </li>
        <li>
          <Link to='/community-guidelines'>Community guidelines</Link>
        </li>
        <li>
          <Link to='/faq'>FAQ</Link>
        </li>
      </LinkGrid>
    </MainContent>
  );
};

export default About;
