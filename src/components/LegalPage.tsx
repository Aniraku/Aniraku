// TS port of Aniraku's src/components/LegalPage/LegalPage.jsx — shared shell
// for the static legal pages, kept verbatim in the source's own wording
// (final brand: Aniraku); source/issue GitHub links restored.
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import { FaArrowLeft, FaExternalLinkAlt, FaGithub, FaShieldAlt } from 'react-icons/fa';

const Page = styled.main`
  min-height: 100dvh;
  padding: calc(4.5rem + 26px) 1rem 80px;
  background:
    radial-gradient(circle at 82% 0%, rgba(181, 168, 255, 0.13), transparent 28rem),
    var(--global-primary-bg);

  @media (max-width: 768px) {
    padding: calc(4.5rem + 14px) 1rem 2rem;
  }
`;

const Shell = styled.div`
  width: min(100%, 940px);
  margin: 0 auto;
`;

const Header = styled.header`
  padding: clamp(22px, 4vw, 42px);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: linear-gradient(130deg, var(--global-div), var(--global-secondary-bg));

  h1 { margin: 20px 0 10px; color: var(--global-text); font-size: clamp(30px, 5vw, 48px); letter-spacing: -0.06em; line-height: 1; }
  p { max-width: 66ch; margin: 0; color: var(--global-text-muted-strong); font-size: 13px; line-height: 1.65; }

  @media (max-width: 480px) {
    padding: 20px 16px;
    border-radius: var(--global-border-radius);
    h1 { font-size: clamp(29px, 10vw, 39px); line-height: 1.04; letter-spacing: -0.045em; }
    p { font-size: 12.5px; line-height: 1.6; }
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--global-text-muted-strong);
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
  &:hover { color: var(--primary-accent); }
`;

const Eyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--primary-accent);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  svg { color: var(--primary-accent); }
`;

const Revision = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
  color: var(--global-text-muted);
  font-size: 11px;
  span { display: inline-flex; min-height: 24px; align-items: center; padding: 0 8px; border: 1px solid var(--global-border-color); border-radius: 9999px; background: var(--global-primary-bg); }
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  margin-top: 18px;

  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;

const Contents = styled.nav`
  position: sticky;
  top: calc(4.5rem + 16px);
  padding: 14px;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-div);
  h2 { margin: 0 0 10px; color: var(--global-text); font-size: 12px; }
  a { display: block; padding: 5px 0; color: var(--global-text-muted-strong); font-size: 11px; text-decoration: none; }
  a:hover { color: var(--primary-accent); }

  @media (max-width: 760px) {
    position: static;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    padding: 10px;
    scrollbar-width: none;
    h2 { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    a { flex: 0 0 auto; padding: 8px 10px; border: 1px solid var(--global-border-color); border-radius: 9999px; background: var(--global-secondary-bg); white-space: nowrap; }
    &::-webkit-scrollbar { display: none; }
  }
`;

const Article = styled.article`
  padding: clamp(20px, 4vw, 38px);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-div);
  color: var(--global-text-muted-strong);
  font-size: 14px;
  line-height: 1.75;

  h2 { margin: 30px 0 8px; color: var(--global-text); font-size: 20px; letter-spacing: -0.025em; scroll-margin-top: 80px; }
  h2:first-child { margin-top: 0; }
  h3 { margin: 22px 0 7px; color: var(--global-text); font-size: 15px; }
  p { margin: 10px 0; }
  ul, ol { margin: 10px 0; padding-left: 22px; }
  li { margin: 5px 0; }
  strong { color: var(--global-text); }
  a { color: var(--primary-accent); }
  code { padding: 2px 5px; border-radius: 4px; background: var(--global-secondary-bg); color: var(--primary-accent); font-size: 0.92em; }

  @media (max-width: 480px) {
    padding: 20px 16px;
    border-radius: var(--global-border-radius);
    font-size: 13px;
    line-height: 1.7;
    h2 { font-size: 18px; scroll-margin-top: 16px; }
    h3 { font-size: 14px; }
  }
`;

const Callout = styled.aside`
  display: flex;
  gap: 10px;
  margin: 0 0 24px;
  padding: 13px 14px;
  border: 1px solid var(--global-border-color);
  border-radius: 10px;
  background: var(--global-primary-bg);
  color: var(--global-text-muted-strong);
  font-size: 12px;
  line-height: 1.55;
  svg { flex: 0 0 auto; margin-top: 2px; color: var(--primary-accent); }
`;

const Support = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--global-border-color);
  a { display: inline-flex; min-height: 40px; align-items: center; gap: 7px; padding: 0 10px; border: 1px solid var(--global-border-color); border-radius: 8px; color: var(--global-text-muted-strong); font-size: 11px; font-weight: 750; text-decoration: none; }
  a:hover { border-color: var(--primary-accent); color: var(--global-text); }

  @media (max-width: 480px) {
    display: grid;
    grid-template-columns: 1fr;
    a { justify-content: center; text-align: center; }
  }
`;

export interface LegalSection {
  id: string;
  label: string;
}

interface LegalPageProps {
  title: string;
  eyebrow?: string;
  revision?: string;
  intro: string;
  sections?: LegalSection[];
  children?: ReactNode;
}

const LegalPage = ({ title, eyebrow = 'Trust & transparency', revision = 'August 29, 2026', intro, sections = [], children }: LegalPageProps) => (
  <>
    <Page>
      <Shell>
        <Header>
          <Eyebrow><FaShieldAlt size={10} /> {eyebrow}</Eyebrow>
          <BackLink to='/'><FaArrowLeft size={11} /> Back to Aniraku</BackLink>
          <h1>{title}</h1>
          <p>{intro}</p>
          <Revision><span>{revision}</span><span>Plain-language working draft</span><span>Open-source project</span></Revision>
        </Header>
        <Body>
          <Contents aria-label='Page contents'>
            <h2>On this page</h2>
            {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
          </Contents>
          <Article>
            <Callout><FaShieldAlt size={14} /> <span>Aniraku is an open-source client and community service. We aim to describe what the product actually does, what third parties control, and how users can ask for help or removal.</span></Callout>
            {children}
            <Support>
              <Link to='/privacy'>Privacy</Link>
              <Link to='/terms'>Terms</Link>
              <Link to='/dmca'>DMCA & content reports</Link>
              <Link to='/license'>AGPL-3.0 license</Link>
              <a href='https://github.com/Aniraku/Aniraku/issues' target='_blank' rel='noreferrer'><FaGithub size={12} /> Report a product issue</a>
              <a href='https://github.com/Aniraku/Aniraku' target='_blank' rel='noreferrer'><FaExternalLinkAlt size={10} /> Source repository</a>
            </Support>
          </Article>
        </Body>
      </Shell>
    </Page>
  </>
);

export default LegalPage;
