// src/pages/Faq.tsx — Aniraku FAQ (SEO/GEO page).
//
// Why this page exists: AI answer engines (AI Overviews, Perplexity,
// ChatGPT Search, Gemini) quote definitional sentences and Q/A pairs
// almost verbatim, and they can only quote what they can fetch. This
// page is the site's canonical Q/A surface:
//   * one H1 + a short intro that restates the entity definition,
//   * each question is its own H2 with an id (anchor = internal link
//     target for the on-page contents list and for future deep links),
//   * every answer opens with the answer itself, so a 1-sentence
//     extraction is already complete and self-contained,
//   * FAQPage JSON-LD mirrors the visible question/answer pairs.
// The wording is grounded in the project's own Privacy / Terms / DMCA
// pages so the schema and the visible copy can never contradict policy.
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useSeo, breadcrumbLd } from '../utils/seo';
// Donation methods shared with the navbar-heart SupportPrompt modal.
import { PATREON_URL } from '../lib/support';

const GITHUB_URL = 'https://github.com/Aniraku/Aniraku';
const GITHUB_ISSUES_URL = 'https://github.com/Aniraku/Aniraku/issues';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'what-is-aniraku',
    question: 'What is Aniraku?',
    answer:
      'Aniraku is a free, open-source anime streaming website where you can watch subtitled and dubbed (sub and dub) anime online in HD. It uses AniList for titles, cover art, scores and airing schedules, and its client source code is public on GitHub under the GNU AGPL-3.0 license.',
  },
  {
    id: 'is-aniraku-free',
    question: 'Is Aniraku free to use?',
    answer:
      'Yes. Aniraku is completely free — there is no subscription and no payment required to browse the catalog or watch episodes. An optional free account only exists for syncing watch history, bookmarks, ratings and comments across devices.',
  },
  {
    id: 'do-i-need-an-account',
    question: 'Do I need an account to watch anime on Aniraku?',
    answer:
      'No. You can search the catalog, open any title and play episodes as a guest. An account is only needed for account-backed features such as cloud sync, ratings, comments and your profile.',
  },
  {
    id: 'sub-and-dub',
    question: 'Does Aniraku have English subtitles and English dubs?',
    answer:
      'Yes. Aniraku lists both subtitled and English-dubbed versions whenever a source provides them, and Settings lets you choose your preferred title and character language. Availability still differs between titles and between episodes of the same title.',
  },
  {
    id: 'new-episodes',
    question: 'How often are new episodes added?',
    answer:
      'Catalog and metadata refresh continuously from AniList, so newly released episodes normally appear shortly after they air. The homepage rails and the schedule page are the fastest way to see the latest additions.',
  },
  {
    id: 'is-aniraku-safe',
    question: 'Is Aniraku safe?',
    answer:
      'Aniraku does not ask for payment details or identity documents, browsing works without signing in, and the site runs no advertising. It stays free because the community supports it voluntarily — Patreon or Binance Pay — which covers hosting, releases, and open-source development. Report anything that looks suspicious through the issue tracker or the contact address on the DMCA page.',
  },
  {
    id: 'where-does-data-come-from',
    question: 'Where does Aniraku get its anime data?',
    answer:
      'Titles, images, descriptions, scores, genres and airing information are requested from AniList, with TMDB-backed enrichment for some episode details. Playback resolution may use public third-party sources whose availability Aniraku does not control.',
  },
  {
    id: 'does-aniraku-host-video',
    question: 'Does Aniraku host the video files itself?',
    answer:
      'No. Aniraku is an open-source discovery and playback client: it does not intentionally host or maintain a permanent library of episode files on its own servers, which is why the DMCA page explains exactly what the project can and cannot remove.',
  },
  {
    id: 'is-aniraku-open-source',
    question: 'Is Aniraku open source? Can I self-host it?',
    answer:
      'Yes. The client source code is published on GitHub under the GNU Affero General Public License v3.0, so anyone can read it, report problems, or fork and run their own copy under the license terms.',
  },
  {
    id: 'devices',
    question: 'Can I watch Aniraku on my phone, tablet or TV?',
    answer:
      'Yes. Aniraku runs in any modern browser on phones, tablets, desktops and most TV browsers, and it can be installed as a Progressive Web App without going through an app store.',
  },
  {
    id: 'report-a-problem',
    question: 'How do I report a broken video or a copyright issue?',
    answer:
      'Broken videos, wrong subtitles and bad sources belong in the project issue tracker. Copyright notices go to the DMCA & copyright page (sho.islam0311@proton.me) and must include the exact URL, title and episode reference.',
  },
  {
    id: 'does-aniraku-track-me',
    question: 'Does Aniraku track my watch history?',
    answer:
      'Aniraku does not share or sell your personal information with anyone for marketing, advertising, or data-broker purposes. Guest watch history and bookmarks are stored in your own browser’s local storage, the site runs no advertising, and metadata requests go directly from your browser to AniList.',
  },
];

const Page = styled.main`
  width: min(100%, 60rem);
  margin: 0 auto;
  padding: 0 0 2rem;
  color: var(--global-text);
`;

const HeaderCard = styled.header`
  padding: clamp(20px, 4vw, 34px);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: linear-gradient(
    130deg,
    var(--global-div),
    var(--global-secondary-bg)
  );

  h1 {
    margin: 0 0 10px;
    font-size: clamp(26px, 4.5vw, 40px);
    letter-spacing: -0.05em;
    line-height: 1.1;
  }
  p {
    max-width: 68ch;
    margin: 0;
    color: var(--global-text-muted-strong);
    font-size: 14px;
    line-height: 1.7;
  }

  @media (max-width: 480px) {
    padding: 18px 16px;
  }
`;

const Contents = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  margin-top: 16px;

  a {
    padding: 5px 10px;
    border: 1px solid var(--global-border-color);
    border-radius: 9999px;
    background: var(--global-primary-bg);
    color: var(--global-text-muted-strong);
    font-size: 11.5px;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      border-color: var(--primary-accent);
      color: var(--global-text);
    }
  }
`;

const FaqList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
`;

const FaqItemCard = styled.section`
  padding: clamp(16px, 3vw, 26px);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-div);

  h2 {
    margin: 0 0 8px;
    color: var(--global-text);
    font-size: clamp(16px, 2.4vw, 20px);
    letter-spacing: -0.02em;
    line-height: 1.35;
    scroll-margin-top: 6rem;
  }
  p {
    margin: 0;
    color: var(--global-text-muted-strong);
    font-size: 14px;
    line-height: 1.75;

    a {
      color: var(--primary-accent);
    }
  }
`;

const Support = styled.footer`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
  padding: clamp(16px, 3vw, 24px);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-primary-bg);

  p {
    width: 100%;
    margin: 0 0 4px;
    color: var(--global-text-muted-strong);
    font-size: 13.5px;
    line-height: 1.7;
  }
  a {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    padding: 0 12px;
    border: 1px solid var(--global-border-color);
    border-radius: 8px;
    color: var(--global-text-muted-strong);
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;

    &:hover {
      border-color: var(--primary-accent);
      color: var(--global-text);
    }
  }
`;

const Faq = () => {
  useSeo({
    title: 'Frequently Asked Questions — Aniraku',
    description:
      'Answers to common questions about Aniraku: what it is, whether it is free and safe, English sub and dub support, where the data comes from, devices, privacy and how to report a broken video.',
    canonicalPath: '/faq',
    jsonLd: [
      breadcrumbLd('Frequently Asked Questions', '/faq'),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  });

  return (
    <Page>
      <HeaderCard>
        <h1>Frequently Asked Questions</h1>
        <p>
          Quick answers about Aniraku — what the site is, how it stays free,
          which languages it streams, where the data comes from and how to
          report a problem. Everything below applies to the whole site; the
          <Link to='/about'> About page</Link> has the longer version.
        </p>
        <Contents aria-label='FAQ contents'>
          {FAQS.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.question}
            </a>
          ))}
        </Contents>
      </HeaderCard>

      <FaqList>
        {FAQS.map((item) => (
          <FaqItemCard key={item.id} id={item.id}>
            <h2>{item.question}</h2>
            <p>{item.answer}</p>
          </FaqItemCard>
        ))}
      </FaqList>

      <Support>
        <p>
          Still stuck? Product bugs and broken sources are tracked publicly, and
          copyright notices have their own process.
        </p>
        <a href={GITHUB_ISSUES_URL} target='_blank' rel='noreferrer'>
          Report a product issue
        </a>
        <Link to='/dmca'>DMCA &amp; copyright</Link>
        <Link to='/privacy'>Privacy policy</Link>
        <Link to='/terms'>Terms</Link>
        <a href={PATREON_URL} target='_blank' rel='noreferrer'>
          Support Aniraku
        </a>
        <a href={GITHUB_URL} target='_blank' rel='noreferrer'>
          Source code
        </a>
      </Support>
    </Page>
  );
};

export default Faq;
