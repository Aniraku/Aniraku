import styled from 'styled-components';
import { useState } from 'react';
import { FaCheckCircle, FaCopy } from 'react-icons/fa';
import {
  BINANCE_PAY_LABEL,
  BINANCE_PAY_UID,
  BINANCE_PAY_USERNAME,
  BINANCE_QR_SRC,
  PATREON_URL,
} from '../lib/support';
import { useSeo, breadcrumbLd } from '../utils/seo';
const SplashContainer = styled.div`
  margin-top: -2rem;
`;

const Keyword = styled.span`
  font-weight: bold;
  color: var(--your-custom-color);
  position: relative;
  margin-right: 0.2rem;

  ::before {
    content: '\u25A0';
    font-size: 0.8rem;
    position: absolute;
    top: 0;
    left: -0.5rem;
    color: var(--your-custom-color);
  }
`;

const Paragraph = styled.p`
  font-size: 1rem;
  margin-bottom: 1rem;
  line-height: 1.6;
  color: var(--global-text);
`;

const MainContent = styled.div`
  max-width: 50rem;
  margin: 0 auto;
  padding: 1rem;
  color: var(--global-text);
  font-size: 1rem;
  line-height: 1.6;
`;

const DonateCard = styled.div`
  display: grid; gap: 12px; justify-items: center; margin: 1rem 0; padding: 1.25rem;
  text-align: center; background: var(--global-div); border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const DonateQr = styled.div`
  width: min(100%, 220px); overflow: hidden; border-radius: var(--global-border-radius); background: #fff;
  img { display: block; width: 100%; height: auto; }
`;

const DonateUid = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .8rem;
  code { color: var(--global-text-muted); letter-spacing: .05em; }
  button { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; color: var(--global-text); background: var(--global-secondary-bg); border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius); cursor: pointer; font-size: .72rem; }
  button:hover { border-color: var(--primary-accent); color: var(--primary-accent); }
`;

const DonateLink = styled.a`
  color: var(--primary-accent); font-weight: 700;
`;

function DonateBlock() {
  const [copied, setCopied] = useState(false);
  const [qrOk, setQrOk] = useState(true);
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(BINANCE_PAY_UID);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <DonateCard>
      {qrOk && (
        <DonateQr>
          <img
            src={BINANCE_QR_SRC}
            alt='Binance Pay QR — SHO_WAIB21'
            loading='lazy'
            decoding='async'
            onError={() => setQrOk(false)}
          />
        </DonateQr>
      )}
      <Paragraph style={{ marginBottom: 0 }}>
        <strong>{BINANCE_PAY_LABEL} · {BINANCE_PAY_USERNAME}</strong>
      </Paragraph>
      <DonateUid>
        <code>UID {BINANCE_PAY_UID}</code>
        <button type='button' onClick={() => void copy()}>
          <FaCopy /> {copied ? 'UID COPIED' : 'COPY UID'}
        </button>
      </DonateUid>
      <Paragraph style={{ marginBottom: 0 }}>
        Open Binance &gt; Pay &gt; scan the QR or enter the UID. Prefer
        Patreon? <DonateLink href={PATREON_URL} target='_blank' rel='noreferrer'>Support us there</DonateLink>.
      </Paragraph>
      <Paragraph style={{ marginBottom: 0 }}>
        Want an anime added to the library? Mail us at{' '}
        <DonateLink href='mailto:sho.islam0311@proton.me'>sho.islam0311@proton.me</DonateLink>{' '}
        and we will add it.
      </Paragraph>
    </DonateCard>
  );
}

const sections = [
  {
    title: 'About',
    title2: "What's Aniraku?",
    content: (
      <Paragraph>
        Aniraku is an anime streaming site where you can watch anime online in HD
        quality with English subtitles or dubbing. You can also download any
        anime you want without registration.
      </Paragraph>
    ),
  },
  {
    title2: 'Is Aniraku safe?',
    content: (
      <Paragraph>
        Yes. We started this site to improve UX and are committed to keeping our
        users safe. We encourage all our users to notify us if anything looks
        suspicious. Aniraku serves no pop-up / redirect ads — playback embeds
        run sandboxed with popup blocking.
      </Paragraph>
    ),
  },
  {
    title2: 'Why Aniraku?',
    content: (
      <>
        <Paragraph>
          <strong>
            <FaCheckCircle /> Content Library:
          </strong>{' '}
          We have a vast collection of both old and new anime, making us one of
          the largest anime libraries on the web.
        </Paragraph>
        <Paragraph>
          <strong>
            <FaCheckCircle /> Streaming Experience:
          </strong>{' '}
          Enjoy <Keyword>fast and reliable</Keyword> streaming with our{' '}
          <Keyword>top-of-the-line servers</Keyword>.
        </Paragraph>
        <Paragraph>
          <strong>
            <FaCheckCircle /> Quality/Resolution:
          </strong>{' '}
          Our videos are available in <Keyword>high resolution</Keyword>, and we
          offer quality settings to suit your internet speed.
        </Paragraph>
        <Paragraph>
          <strong>
            <FaCheckCircle /> Frequent Updates:
          </strong>{' '}
          Our content is updated hourly to provide you with the{' '}
          <Keyword>latest releases</Keyword>.
        </Paragraph>
        <Paragraph>
          <strong>
            <FaCheckCircle /> User-Friendly Interface:
          </strong>{' '}
          We focus on <Keyword>simplicity and ease of use</Keyword>.
        </Paragraph>
        <Paragraph>
          <strong>
            <FaCheckCircle /> Device Compatibility:
          </strong>{' '}
          Aniraku works seamlessly on both{' '}
          <Keyword>desktop and mobile devices</Keyword>.
        </Paragraph>
        <Paragraph>
          <strong>
            <FaCheckCircle /> Community:
          </strong>{' '}
          Join our active <Keyword>community of anime lovers</Keyword>.
        </Paragraph>
      </>
    ),
  },
  {
    title2: 'Support Us',
    content: (
      <>
        <Paragraph>
          Hosting, streaming servers and sync all run on paid infrastructure
          with monthly limits — and we are running out soon. If you want
          Aniraku to stay alive, please consider donating. Every
          contribution keeps the episodes playing.
        </Paragraph>
        <DonateBlock />
      </>
    ),
  },
];

function About() {
  // Canonical + social tags via the shared SEO helper (replaces the old
  // document.title-only effect).
  useSeo({
    title: 'About Aniraku — Open-Source Anime Streaming',
    description:
      'What Aniraku is, how it works, and the open-source project behind it. A free anime streaming client powered by AniList metadata.',
    canonicalPath: '/about',
    jsonLd: breadcrumbLd('About', '/about'),
  });

  return (
    <SplashContainer>
      <MainContent>
        <br />
        {sections.map((section, index) => (
          <span key={index}>
            {section.title && <h1 className='title-style'>{section.title}</h1>}
            {section.title2 && (
              <h3 className='title-style'>{section.title2}</h3>
            )}
            {section.content}
          </span>
        ))}
      </MainContent>
    </SplashContainer>
  );
}

export default About;
