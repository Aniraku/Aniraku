import{r as n,j as e}from"./react-BDLNM8R1.js";import{c as U,f as B,aw as W,J as Q,aC as F,b as V,L as q,ap as J,p as O,G as X,g as L}from"./index-CbwXtSbX.js";import{g as r}from"./styling-nw0auVTP.js";import{L as T}from"./router-jK2CEO6W.js";import"./supabase-CG6S1lgy.js";const m=[{id:"any",label:"ANY",sort:"POPULARITY_DESC"},{id:"action",label:"ACTION",genre:"Action",sort:"TRENDING_DESC"},{id:"movie",label:"MOVIE",format:"MOVIE",sort:"SCORE_DESC"}],c=i=>{var o,p,t;return((o=i==null?void 0:i.title)==null?void 0:o.english)||((p=i==null?void 0:i.title)==null?void 0:p.romaji)||((t=i==null?void 0:i.title)==null?void 0:t.userPreferred)||"Untitled title"},K=(i="")=>i.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),P=i=>`/anime/${L(c(i))}-${i.id}`,Z=i=>`/watch/${L(c(i))}-${i.id}-episode-1`,ee=i=>(i||"ANIME").replace(/_/g," "),te=r.main`
  min-height: 100vh;
  background:
    radial-gradient(circle at 88% 2%, rgba(255, 255, 255, 0.06), transparent 25rem),
    var(--bg);
  color: var(--text-primary);
`,ie=r.div`
  width: min(960px, calc(100% - 32px));
  margin: 0 auto;
  padding: clamp(28px, 6vw, 74px) 0 52px;

  @media (max-width: 480px) { width: min(100% - 24px, 960px); }
`,l=r.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`,re=r.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 13px;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 10px;

  .signal { display: inline-flex; align-items: center; gap: 7px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px var(--accent); }
`,ae=r.section`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding: clamp(28px, 6vw, 62px) 0 clamp(22px, 4vw, 36px);

  h1 {
    max-width: 650px;
    margin: 0;
    font-size: clamp(38px, 7vw, 80px);
    font-weight: 850;
    letter-spacing: -0.07em;
    line-height: 0.86;
  }

  p { max-width: 220px; margin: 0 0 4px; color: var(--text-muted); font-size: 12px; line-height: 1.55; }

  @media (max-width: 600px) {
    display: block;
    h1 { font-size: clamp(42px, 14vw, 64px); }
    p { margin-top: 18px; }
  }
`,ne=r.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;

  @media (max-width: 570px) { align-items: stretch; flex-direction: column; }
`,oe=r.div`
  display: inline-grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
`,se=r.button`
  min-width: 86px;
  min-height: 38px;
  border: 0;
  border-right: 1px solid var(--border);
  background: ${({$active:i})=>i?"var(--text-primary)":"transparent"};
  color: ${({$active:i})=>i?"var(--bg)":"var(--text-muted)"};
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.09em;
  transition: background 160ms ease, color 160ms ease;

  &:last-child { border-right: 0; }
  &:hover { color: ${({$active:i})=>i?"var(--bg)":"var(--text-primary)"}; }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
`,A=r.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 39px;
  padding: 10px 13px;
  border: 1px solid var(--accent);
  border-radius: 10px;
  background: var(--accent);
  color: #090909;
  cursor: pointer;
  font-size: 12px;
  font-weight: 850;
  transition: transform 150ms var(--ease-out, ease-out), filter 150ms ease;

  &:hover { filter: brightness(1.06); }
  &:active { transform: scale(0.97); }
  &:disabled { cursor: wait; opacity: 0.62; }
  &:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; }
`,le=r.section`
  position: relative;
  display: grid;
  grid-template-columns: minmax(190px, 0.34fr) minmax(0, 0.66fr);
  min-height: 410px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--bg-card);

  @media (max-width: 650px) {
    grid-template-columns: 122px minmax(0, 1fr);
    min-height: 360px;
    border-radius: 13px;
  }
`,$=r(T)`
  position: relative;
  min-height: 100%;
  overflow: hidden;
  background: #15161a;

  &::after {
    position: absolute;
    inset: auto 0 0;
    height: 38%;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.66));
    content: '';
  }

  &:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
`,ce=r.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 260ms var(--ease-out, ease-out);
  ${$}:hover & { transform: scale(1.035); }
`,pe=r.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  padding: clamp(20px, 4vw, 38px);

  @media (max-width: 650px) { padding: 18px; }
`,de=r(l)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 10px;

  b { color: var(--accent); font-weight: 900; }
`,xe=r.h2`
  margin: 18px 0 0;
  font-size: clamp(26px, 4vw, 48px);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.98;
  text-wrap: balance;
`,ge=r.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  span { display: inline-flex; align-items: center; gap: 5px; }
  span + span::before { color: var(--border-hover); content: '/'; }
  svg { color: var(--accent); }
`,me=r.p`
  display: -webkit-box;
  max-width: 570px;
  margin: 20px 0 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.68;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;

  @media (max-width: 650px) { -webkit-line-clamp: 4; font-size: 12px; }
`,fe=r.div`
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 24px;
`,D=r(T)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 10px 13px;
  border: 1px solid var(--text-primary);
  border-radius: 9px;
  background: var(--text-primary);
  color: var(--bg);
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  transition: transform 150ms var(--ease-out, ease-out), filter 150ms ease;

  &:hover { filter: brightness(0.9); }
  &:active { transform: scale(0.97); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
`,he=r(D)`
  border-color: var(--border-hover);
  background: transparent;
  color: var(--text-primary);

  &:hover { border-color: var(--text-primary); background: rgba(255, 255, 255, 0.06); filter: none; }
`,ue=r.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  background: rgba(10, 11, 13, 0.6);
  backdrop-filter: blur(3px);

  span { display: inline-flex; align-items: center; gap: 9px; padding: 9px 11px; border: 1px solid var(--border-hover); border-radius: 999px; background: var(--bg); color: var(--text-primary); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; letter-spacing: 0.07em; }
  svg { color: var(--accent); animation: spin 800ms linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`,be=r.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 26px;
  text-align: center;

  h2 { margin: 13px 0 7px; font-size: 24px; letter-spacing: -0.04em; }
  p { max-width: 360px; margin: 0; color: var(--text-muted); font-size: 13px; line-height: 1.6; }
`,ve=r.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  @media (max-width: 520px) { flex-direction: column; gap: 5px; }
`;function ze(){var z,S,E;const{nsfwEnabled:i}=U(),[o,p]=n.useState("any"),[t,G]=n.useState(null),[d,j]=n.useState(!1),[f,y]=n.useState(""),x=n.useRef(0),w=n.useRef(null),k=n.useRef(!1),g=m.find(a=>a.id===o)||m[0],s=n.useCallback(async(a=g)=>{var R;const h=++x.current;j(!0),y("");try{const u={page:Math.floor(Math.random()*14)+1,perPage:24,sort:[a.sort]};a.genre&&(u.genre=a.genre),a.format&&(u.format=a.format);const{data:b}=await B(W,u);if(h!==x.current)return;const C=Q(((R=b==null?void 0:b.Page)==null?void 0:R.media)||[],i),I=C.filter(H=>H.id!==w.current),v=I.length?I:C;if(!v.length)throw new Error("No candidates");const N=v[Math.floor(Math.random()*v.length)];w.current=N.id,G(N)}catch{h===x.current&&y("No signal right now. Try one more time.")}finally{h===x.current&&j(!1)}},[g,i]);n.useEffect(()=>{k.current||(k.current=!0,s(m[0]))},[s]);const Y=a=>{p(a.id),s(a)},M=((z=t==null?void 0:t.coverImage)==null?void 0:z.extraLarge)||((S=t==null?void 0:t.coverImage)==null?void 0:S.large)||((E=t==null?void 0:t.coverImage)==null?void 0:E.medium)||"",_=K(t==null?void 0:t.description)||"Open the title to see its full synopsis, release information, and available episodes.";return e.jsxs(te,{id:"main",children:[e.jsxs(ie,{children:[e.jsxs(re,{children:[e.jsxs(l,{className:"signal",children:[e.jsx("i",{className:"dot"})," Random discovery"]}),e.jsx(l,{children:i?"Expanded mode":"Safe mode"})]}),e.jsxs(ae,{children:[e.jsxs("h1",{children:["WHAT",e.jsx("br",{}),"NEXT?"]}),e.jsx("p",{children:"One title. One decision. Roll again whenever the signal is not right."})]}),e.jsxs(ne,{children:[e.jsx(oe,{"aria-label":"Random discovery mode",children:m.map(a=>e.jsx(se,{type:"button",$active:a.id===o,onClick:()=>Y(a),"aria-pressed":a.id===o,children:a.label},a.id))}),e.jsxs(A,{type:"button",onClick:()=>s(),disabled:d,children:[e.jsx(F,{size:12})," New pick"]})]}),e.jsxs(le,{"aria-live":"polite","aria-busy":d,children:[t&&e.jsxs(e.Fragment,{children:[e.jsx($,{to:P(t),"aria-label":`Open ${c(t)} details`,children:M&&e.jsx(ce,{src:M,alt:c(t)})}),e.jsxs(pe,{children:[e.jsxs("div",{children:[e.jsxs(de,{children:[e.jsx("b",{children:"●"})," Pick / ",g.label]}),e.jsx(xe,{children:c(t)}),e.jsxs(ge,{children:[t.averageScore&&e.jsxs("span",{children:[e.jsx(V,{size:10})," ",t.averageScore,"%"]}),e.jsx("span",{children:ee(t.format)}),t.episodes&&e.jsxs("span",{children:[t.episodes," ",t.episodes===1?"EP":"EPS"]}),t.seasonYear&&e.jsx("span",{children:t.seasonYear})]}),e.jsx(me,{children:_})]}),e.jsxs(fe,{children:[e.jsxs(D,{to:Z(t),children:[e.jsx(q,{size:11})," Watch"]}),e.jsxs(he,{to:P(t),children:[e.jsx(J,{size:12})," Details"]})]})]})]}),!t&&!d&&e.jsx(be,{children:e.jsxs("div",{children:[e.jsx(F,{size:28,style:{color:"var(--accent)"}}),e.jsx("h2",{children:f?"No result yet.":"Finding a title."}),e.jsx("p",{children:f||"The next recommendation is being selected."}),f&&e.jsxs(A,{type:"button",style:{marginTop:18},onClick:()=>s(),children:[e.jsx(O,{size:11})," Try again"]})]})}),d&&e.jsx(ue,{children:e.jsxs("span",{children:[e.jsx(O,{size:11})," TUNING SIGNAL"]})})]}),e.jsxs(ve,{children:[e.jsx("span",{children:e.jsxs(l,{children:["Mode // ",g.label]})}),e.jsx("span",{children:e.jsx(l,{children:t?"Open details or continue watching":"Loading selection"})})]})]}),e.jsx(X,{}),e.jsx("div",{className:"bottom-nav-spacer"})]})}export{ze as default};
