import{j as r}from"./react-BDLNM8R1.js";import{g as a}from"./styling-nw0auVTP.js";import{B as t,C as c,D as x,E as g,G as h}from"./index-CbwXtSbX.js";import{L as e}from"./router-jK2CEO6W.js";const m=a.main`
  min-height: 100dvh;
  padding: calc(var(--header-h) + 26px) var(--content-pad) 80px;
  background:
    radial-gradient(circle at 82% 0%, rgba(125, 92, 232, 0.13), transparent 28rem),
    var(--bg);

  @media (max-width: 768px) {
    padding: calc(var(--header-h) + 14px) var(--content-pad) var(--mobile-dock-clearance);
  }
`,v=a.div`
  width: min(100%, 940px);
  margin: 0 auto;
`,u=a.header`
  padding: clamp(22px, 4vw, 42px);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: linear-gradient(130deg, color-mix(in srgb, var(--bg-card) 95%, transparent), color-mix(in srgb, var(--bg-elevated) 82%, transparent));

  h1 { margin: 20px 0 10px; color: var(--text-primary); font-size: clamp(30px, 5vw, 48px); letter-spacing: -0.06em; line-height: 1; }
  p { max-width: 66ch; margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.65; }

  @media (max-width: 480px) {
    padding: 20px 16px;
    border-radius: var(--radius-lg);
    h1 { font-size: clamp(29px, 10vw, 39px); line-height: 1.04; letter-spacing: -0.045em; }
    p { font-size: 12.5px; line-height: 1.6; }
  }
`,b=a(e)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
  &:hover { color: var(--accent); }
`,f=a.div`
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  svg { color: var(--accent); }
`,j=a.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
  color: var(--text-muted);
  font-size: 11px;
  span { display: inline-flex; min-height: 24px; align-items: center; padding: 0 8px; border: 1px solid var(--border); border-radius: var(--radius-full); background: var(--bg); }
`,y=a.div`
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  margin-top: 18px;

  @media (max-width: 760px) { grid-template-columns: 1fr; }
`,w=a.nav`
  position: sticky;
  top: calc(var(--header-h) + 16px);
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  h2 { margin: 0 0 10px; color: var(--text-primary); font-size: 12px; }
  a { display: block; padding: 5px 0; color: var(--text-secondary); font-size: 11px; text-decoration: none; }
  a:hover { color: var(--accent); }

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
    a { flex: 0 0 auto; padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--radius-full); background: var(--bg-elevated); white-space: nowrap; }
    &::-webkit-scrollbar { display: none; }
  }
`,k=a.article`
  padding: clamp(20px, 4vw, 38px);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.75;

  h2 { margin: 30px 0 8px; color: var(--text-primary); font-size: 20px; letter-spacing: -0.025em; scroll-margin-top: 80px; }
  h2:first-child { margin-top: 0; }
  h3 { margin: 22px 0 7px; color: var(--text-primary); font-size: 15px; }
  p { margin: 10px 0; }
  ul, ol { margin: 10px 0; padding-left: 22px; }
  li { margin: 5px 0; }
  strong { color: var(--text-primary); }
  a { color: var(--accent); }
  code { padding: 2px 5px; border-radius: 4px; background: var(--bg-elevated); color: var(--accent); font-size: 0.92em; }

  @media (max-width: 480px) {
    padding: 20px 16px;
    border-radius: var(--radius-lg);
    font-size: 13px;
    line-height: 1.7;
    h2 { font-size: 18px; scroll-margin-top: 16px; }
    h3 { font-size: 14px; }
  }
`,z=a.aside`
  display: flex;
  gap: 10px;
  margin: 0 0 24px;
  padding: 13px 14px;
  border: 1px solid color-mix(in srgb, var(--accent) 32%, var(--border));
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 8%, var(--bg));
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.55;
  svg { flex: 0 0 auto; margin-top: 2px; color: var(--accent); }
`,A=a.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  a { display: inline-flex; min-height: 40px; align-items: center; gap: 7px; padding: 0 10px; border: 1px solid var(--border); border-radius: 8px; color: var(--text-secondary); font-size: 11px; font-weight: 750; text-decoration: none; }
  a:hover { border-color: var(--accent); color: var(--text-primary); }

  @media (max-width: 480px) {
    display: grid;
    grid-template-columns: 1fr;
    a { justify-content: center; text-align: center; }
  }
`,C=({title:n,eyebrow:o="Trust & transparency",revision:s="August 29, 2026",intro:p,sections:d=[],children:l})=>r.jsxs(r.Fragment,{children:[r.jsx(m,{children:r.jsxs(v,{children:[r.jsxs(u,{children:[r.jsxs(f,{children:[r.jsx(t,{size:10})," ",o]}),r.jsxs(b,{to:"/",children:[r.jsx(c,{size:11})," Back to Aniraku"]}),r.jsx("h1",{children:n}),r.jsx("p",{children:p}),r.jsxs(j,{children:[r.jsx("span",{children:s}),r.jsx("span",{children:"Plain-language working draft"}),r.jsx("span",{children:"Open-source project"})]})]}),r.jsxs(y,{children:[r.jsxs(w,{"aria-label":"Page contents",children:[r.jsx("h2",{children:"On this page"}),d.map(i=>r.jsx("a",{href:`#${i.id}`,children:i.label},i.id))]}),r.jsxs(k,{children:[r.jsxs(z,{children:[r.jsx(t,{size:14})," ",r.jsx("span",{children:"Aniraku is an open-source client and community service. We aim to describe what the product actually does, what third parties control, and how users can ask for help or removal."})]}),l,r.jsxs(A,{children:[r.jsx(e,{to:"/privacy",children:"Privacy"}),r.jsx(e,{to:"/terms",children:"Terms"}),r.jsx(e,{to:"/dmca",children:"DMCA & content reports"}),r.jsx(e,{to:"/license",children:"AGPL-3.0 license"}),r.jsxs("a",{href:"https://github.com/Aniraku/Aniraku/issues",target:"_blank",rel:"noreferrer",children:[r.jsx(x,{size:12})," Report a product issue"]}),r.jsxs("a",{href:"https://github.com/Aniraku/Aniraku",target:"_blank",rel:"noreferrer",children:[r.jsx(g,{size:10})," Source repository"]})]})]})]})]})}),r.jsx(h,{compact:!0})]});export{C as L};
