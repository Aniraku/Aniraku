import{r as l,j as e}from"./react-BDLNM8R1.js";import{g as t}from"./styling-nw0auVTP.js";import{aj as Q,ay as Y,c as H,I as V,J as _,az as w,ar as U,F as G,S as J,aA as C,aB as F,g as N,G as X,f as q,aw as K}from"./index-CbwXtSbX.js";import{L as M}from"./router-jK2CEO6W.js";import"./supabase-CG6S1lgy.js";const Z=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],ee=t.main`
  min-height: 100vh;
  padding-top: var(--header-h);
  background:
    radial-gradient(circle at 82% 4%, rgba(139, 92, 246, 0.14), transparent 25%),
    radial-gradient(circle at 5% 46%, rgba(34, 197, 94, 0.05), transparent 18%),
    var(--bg);
`,re=t.div`
  width: min(100%, 1360px);
  margin: 0 auto;
  padding: clamp(24px, 4vw, 48px) clamp(12px, 3vw, 40px) 88px;
`,ae=t.header`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 10px;
    color: var(--accent);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: var(--text-primary);
    font-size: clamp(30px, 4vw, 46px);
    letter-spacing: -0.055em;
    line-height: 0.98;
  }

  p {
    max-width: 60ch;
    margin: 10px 0 0;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.55;
  }

  @media (max-width: 720px) {
    align-items: start;
    flex-direction: column;
    gap: 12px;
  }
`,te=t.div`
  display: inline-flex;
  min-height: 38px;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--bg-card) 90%, transparent);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 750;
  white-space: nowrap;

  svg { color: var(--accent); }
`,ie=t.section`
  display: grid;
  grid-template-columns: minmax(218px, 0.27fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
`,ne=t.aside`
  position: sticky;
  top: calc(var(--header-h) + 16px);
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  box-shadow: var(--shadow-sm);

  @media (max-width: 900px) {
    position: static;
    padding: 10px;
  }
`,oe=t.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  padding: 1px 2px;

  h2 { margin: 0; color: var(--text-primary); font-size: 13px; letter-spacing: -0.01em; }
  span { color: var(--text-muted); font-size: 10px; font-weight: 750; }

  @media (max-width: 900px) { display: none; }
`,se=t.nav`
  display: grid;
  gap: 6px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 5px;
    padding: 1px;
  }
`,de=t.button`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  min-height: 58px;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px;
  border: 1px solid ${({$active:a})=>a?"color-mix(in srgb, var(--accent) 80%, var(--border))":"transparent"};
  border-radius: 11px;
  background: ${({$active:a})=>a?"color-mix(in srgb, var(--accent) 12%, var(--bg-card))":"transparent"};
  color: ${({$active:a})=>a?"var(--text-primary)":"var(--text-secondary)"};
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast), color var(--transition-fast);

  .date {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border-radius: 9px;
    background: ${({$active:a})=>a?"var(--accent)":"var(--bg-card)"};
    color: ${({$active:a})=>a?"var(--bg)":"var(--text-primary)"};
    font-size: 13px;
    font-weight: 850;
  }

  .day { overflow: hidden; font-size: 12px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
  .today { display: block; margin-top: 2px; color: ${({$active:a})=>a?"var(--accent)":"var(--text-muted)"}; font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .count { min-width: 20px; color: ${({$active:a})=>a?"var(--text-primary)":"var(--text-muted)"}; font-size: 11px; font-weight: 800; text-align: right; }

  &:hover { border-color: var(--border-hover); background: var(--bg-card); }
  &:active { transform: scale(0.98); }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    min-width: 0;
    min-height: 58px;
    place-items: center;
    gap: 2px;
    padding: 7px 3px;
    text-align: center;

    .date { width: 26px; height: 26px; border-radius: 7px; font-size: 11px; }
    .day { font-size: 10px; }
    .today { display: none; }
    .count { display: none; }
  }

  @media (max-width: 420px) {
    min-height: 54px;
    padding: 6px 1px;
    .date { width: 24px; height: 24px; font-size: 10px; }
    .day { font-size: 9px; }
  }
`,ce=t.section`
  min-width: 0;
  padding: clamp(14px, 2.2vw, 24px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-elevated) 94%, transparent);
  box-shadow: var(--shadow-sm);
`,le=t.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(210px, 0.74fr) auto;
  align-items: end;
  gap: 12px;

  h2 { margin: 0; color: var(--text-primary); font-size: clamp(20px, 2.5vw, 28px); letter-spacing: -0.045em; }
  p { margin: 5px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.45; }

  @media (max-width: 820px) {
    grid-template-columns: minmax(0, 1fr) auto;
    > :first-child { grid-column: 1 / -1; }
  }
  @media (max-width: 580px) { grid-template-columns: 1fr; align-items: stretch; > :first-child { grid-column: auto; } }
`,pe=t.label`
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 9px;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-card);
  transition: border-color var(--transition-fast), background var(--transition-fast);

  &:focus-within { border-color: var(--accent); background: var(--bg-elevated); }
  > svg { flex: 0 0 auto; color: var(--text-muted); }
  input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text-primary); font: inherit; font-size: 12px; }
  input::placeholder { color: var(--text-muted); }
`,xe=t.button`
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: var(--text-secondary);
  &:hover { background: var(--bg-secondary); color: var(--text-primary); }
`,ge=t.button`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);

  svg { color: var(--accent); }
  &:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--bg-card)); }
  &:active { transform: scale(0.97); }
`,me=t(M)`
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  margin: 18px 0;
  padding: 12px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--accent) 46%, var(--border));
  border-radius: 14px;
  background:
    linear-gradient(100deg, color-mix(in srgb, var(--accent) 12%, var(--bg-card)) 0%, var(--bg-card) 75%);
  color: inherit;
  text-decoration: none;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);

  &:hover { transform: translateY(-2px); border-color: var(--accent); background: linear-gradient(100deg, color-mix(in srgb, var(--accent) 18%, var(--bg-card)) 0%, var(--bg-card) 75%); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

  @media (max-width: 620px) { grid-template-columns: 66px minmax(0, 1fr); gap: 12px; }
`,he=t.div`
  width: 96px;
  height: 108px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--bg-elevated);
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  @media (max-width: 620px) { width: 66px; height: 82px; }
`,ue=t.div`
  min-width: 0;
  .label { display: flex; align-items: center; gap: 6px; color: var(--accent); font-size: 10px; font-weight: 850; letter-spacing: 0.1em; text-transform: uppercase; }
  h3 { margin: 7px 0 0; overflow: hidden; color: var(--text-primary); font-size: clamp(17px, 2.2vw, 22px); letter-spacing: -0.03em; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 7px 0 0; color: var(--text-secondary); font-size: 12px; }
  strong { color: var(--text-primary); }

  @media (max-width: 620px) {
    h3 { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; text-overflow: clip; white-space: normal; }
  }
`,ve=t.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  svg { color: var(--accent); }
  @media (max-width: 620px) { display: none; }
`,fe=t.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 3px;

  h3 { margin: 0; color: var(--text-primary); font-size: 13px; letter-spacing: -0.01em; }
  p { margin: 4px 0 0; color: var(--text-muted); font-size: 11px; }
`,be=t.span`
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 800;
`,I=t.div`
  display: grid;
  gap: 8px;
  margin-top: 12px;
`,ye=t(M)`
  display: grid;
  grid-template-columns: 78px 54px minmax(0, 1fr) auto;
  gap: 12px;
  min-height: 78px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--bg-card);
  color: inherit;
  text-decoration: none;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);

  &:hover { transform: translateX(2px); border-color: var(--border-hover); background: var(--bg-elevated); box-shadow: var(--shadow-sm); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

  @media (max-width: 620px) {
    grid-template-columns: 52px 46px minmax(0, 1fr);
    gap: 9px;
    min-height: 70px;
    padding: 7px;
  }
`,we=t.div`
  display: grid;
  justify-items: start;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 800;
  strong { color: var(--text-primary); font-size: 13px; }
  span { color: var(--text-muted); font-size: 9px; font-weight: 750; }
  @media (max-width: 620px) { strong { font-size: 11px; } }
`,je=t.div`
  width: 54px;
  height: 62px;
  overflow: hidden;
  border-radius: 7px;
  background: var(--bg-elevated);
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  @media (max-width: 620px) { width: 46px; height: 56px; }
`,ke=t.div`
  min-width: 0;
  h3 { margin: 0; overflow: hidden; color: var(--text-primary); font-size: 13px; font-weight: 790; letter-spacing: -0.012em; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 5px 0 0; color: var(--text-secondary); font-size: 11px; }
  .episode { color: var(--accent); font-weight: 800; }

  @media (max-width: 620px) {
    h3 { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-height: 1.25; text-overflow: clip; white-space: normal; }
  }
`,ze=t.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
  svg { color: var(--accent); }
  @media (max-width: 620px) { display: none; }
`,P=t.div`
  display: grid;
  min-height: 240px;
  place-items: center;
  padding: 28px;
  border: 1px dashed var(--border-hover);
  border-radius: 14px;
  color: var(--text-muted);
  text-align: center;

  svg { margin-bottom: 12px; color: var(--accent); }
  h2 { margin: 0; color: var(--text-primary); font-size: 18px; }
  p { margin: 8px 0 0; font-size: 13px; }
  button { margin-top: 16px; min-height: 38px; padding: 0 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card); color: var(--text-primary); font: inherit; font-size: 12px; font-weight: 750; cursor: pointer; }
`,Ae=t.div`
  min-height: 78px;
  border-radius: 11px;
  background: linear-gradient(110deg, var(--bg-card) 28%, var(--bg-elevated) 40%, var(--bg-card) 52%);
  background-size: 220% 100%;
  animation: scheduleShimmer 1.35s linear infinite;

  @keyframes scheduleShimmer { to { background-position: -220% 0; } }
`,j=a=>Z[new Date(a*1e3).getDay()===0?6:new Date(a*1e3).getDay()-1];function Te(){const a=new Date;a.setHours(0,0,0,0);const p=new Date(a);return p.setDate(p.getDate()+7),{start:a,startAt:Math.floor(a.getTime()/1e3),endAt:Math.floor(p.getTime()/1e3)}}const Fe=()=>{var $;const a=l.useMemo(()=>Te(),[]),p=j(a.startAt),[d,k]=l.useState(p),[h,u]=l.useState(""),[x,L]=l.useState(""),{data:z,isLoading:A,error:O,refetch:R}=Q(["schedule",a.startAt,a.endAt],async()=>{var o;const r={page:1,perPage:100,status:"RELEASING",sort:["POPULARITY_DESC"]},{data:i}=await q(K,r);return(((o=i==null?void 0:i.Page)==null?void 0:o.media)||[]).filter(n=>{var E;const c=Number((E=n.nextAiringEpisode)==null?void 0:E.airingAt);return Number.isInteger(c)&&c>=a.startAt&&c<a.endAt}).map(n=>({id:n.id,title:n.title,coverImage:n.coverImage,format:n.format,episode:n.nextAiringEpisode.episode,airingAt:n.nextAiringEpisode.airingAt,day:j(n.nextAiringEpisode.airingAt)})).sort((n,c)=>n.airingAt-c.airingAt)},{staleTime:1800*1e3});l.useEffect(()=>{const r=setTimeout(()=>L(h.trim()),260);return()=>clearTimeout(r)},[h]),l.useEffect(()=>{Y()},[]);const v=l.useMemo(()=>Array.from({length:7},(r,i)=>{const o=new Date(a.start);o.setDate(a.start.getDate()+i);const n=j(Math.floor(o.getTime()/1e3));return{day:n,label:n.slice(0,3),date:o.toLocaleDateString([],{day:"numeric"}),fullDate:o.toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"}),isToday:i===0}}),[a.start]),{nsfwEnabled:B}=H(),f=V(_(Array.isArray(z)?z:[],B)),m=r=>{var i,o,n;return((i=r.title)==null?void 0:i.english)||((o=r.title)==null?void 0:o.romaji)||((n=r.title)==null?void 0:n.userPreferred)||"Unknown title"},T=r=>new Date(r*1e3).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),S=r=>{const i=r*1e3-Date.now(),o=Math.round(Math.abs(i)/6e4);if(o<2)return i>=0?"Airing now":"Aired moments ago";if(o<60)return i>=0?`In ${o} min`:`${o} min ago`;const n=Math.round(o/60);if(n<24)return i>=0?`In ${n}h`:`${n}h ago`;const c=Math.round(n/24);return i>=0?`In ${c}d`:`${c}d ago`},D=r=>r.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),g=f.filter(r=>r.day!==d?!1:!x||D(m(r)).includes(D(x))),b=l.useMemo(()=>Object.fromEntries(v.map(({day:r})=>[r,f.filter(i=>i.day===r).length])),[v,f]),y=v.find(r=>r.day===d),s=g.find(r=>r.airingAt*1e3>=Date.now())||g[0],W=()=>{k(p),u("")};return e.jsxs(e.Fragment,{children:[e.jsx(ee,{children:e.jsxs(re,{children:[e.jsxs(ae,{children:[e.jsxs("div",{children:[e.jsxs("div",{className:"eyebrow",children:[e.jsx(w,{size:12})," Weekly anime planner"]}),e.jsx("h1",{children:"Plan the shows you want to catch."}),e.jsx("p",{children:"Today appears first, followed by the next six local dates and their confirmed upcoming releases."})]}),e.jsxs(te,{children:[e.jsx(U,{size:13})," Your device timezone"]})]}),e.jsxs(ie,{children:[e.jsxs(ne,{children:[e.jsxs(oe,{children:[e.jsx("h2",{children:"Next 7 days"}),e.jsxs("span",{children:[f.length," releases"]})]}),e.jsx(se,{"aria-label":"Select a day of the week",children:v.map(r=>e.jsxs(de,{type:"button",$active:d===r.day,"aria-pressed":d===r.day,onClick:()=>k(r.day),children:[e.jsx("span",{className:"date",children:r.date}),e.jsxs("span",{children:[e.jsx("span",{className:"day",children:r.label}),r.isToday&&e.jsx("span",{className:"today",children:"Today"})]}),e.jsx("span",{className:"count",children:b[r.day]||0})]},r.day))})]}),e.jsxs(ce,{children:[e.jsxs(le,{children:[e.jsxs("div",{children:[e.jsx("h2",{children:(y==null?void 0:y.fullDate)||d}),e.jsx("p",{children:A?"Loading confirmed episode times…":`${b[d]||0} scheduled ${b[d]===1?"episode":"episodes"} · Every time is local to you`})]}),e.jsxs(pe,{children:[e.jsx(G,{size:13}),e.jsx("input",{value:h,onChange:r=>u(r.target.value),placeholder:`Search ${d}'s releases`,"aria-label":"Search releases on the selected day"}),h&&e.jsx(xe,{type:"button",onClick:()=>u(""),"aria-label":"Clear schedule search",children:e.jsx(J,{size:12})})]}),e.jsxs(ge,{type:"button",onClick:W,children:[e.jsx(w,{size:12})," Today"]})]}),A?e.jsx(I,{children:Array.from({length:6},(r,i)=>e.jsx(Ae,{},i))}):O?e.jsx(P,{children:e.jsxs("div",{children:[e.jsx(w,{size:23}),e.jsx("h2",{children:"The planner could not load."}),e.jsx("p",{children:"Please check your connection and try again."}),e.jsx("button",{type:"button",onClick:()=>R(),children:"Try again"})]})}):g.length===0?e.jsx(P,{children:e.jsxs("div",{children:[e.jsx(C,{size:23}),e.jsx("h2",{children:"No matching releases."}),e.jsx("p",{children:x?`Nothing on ${d} matches “${x}”.`:`No release time is listed for ${d} right now.`}),x&&e.jsx("button",{type:"button",onClick:()=>u(""),children:"Clear search"})]})}):e.jsxs(e.Fragment,{children:[s&&e.jsxs(me,{to:`/anime/${N(m(s))}-${s.id}`,title:`Open ${m(s)}`,children:[e.jsx(he,{children:($=s.coverImage)!=null&&$.large?e.jsx("img",{src:s.coverImage.large,alt:"",loading:"eager"}):null}),e.jsxs(ue,{children:[e.jsxs("div",{className:"label",children:[e.jsx(C,{size:10})," ",S(s.airingAt)]}),e.jsx("h3",{children:m(s)}),e.jsxs("p",{children:[e.jsxs("strong",{children:["Episode ",s.episode]})," · ",s.format||"TV"," · ",T(s.airingAt)]})]}),e.jsxs(ve,{children:["Open title ",e.jsx(F,{size:10})]})]}),e.jsxs(fe,{children:[e.jsxs("div",{children:[e.jsx("h3",{children:x?"Matching releases":"Release timeline"}),e.jsx("p",{children:"Ordered by the time each episode becomes available."})]}),e.jsxs(be,{children:[g.length," ",g.length===1?"episode":"episodes"]})]}),e.jsx(I,{children:g.map(r=>{var o;const i=m(r);return e.jsxs(ye,{to:`/anime/${N(i)}-${r.id}`,title:`Open ${i}`,children:[e.jsxs(we,{children:[e.jsx("strong",{children:T(r.airingAt)}),e.jsx("span",{children:S(r.airingAt)})]}),e.jsx(je,{children:(o=r.coverImage)!=null&&o.large?e.jsx("img",{src:r.coverImage.large,alt:"",loading:"lazy"}):null}),e.jsxs(ke,{children:[e.jsx("h3",{children:i}),e.jsxs("p",{children:[e.jsxs("span",{className:"episode",children:["Episode ",r.episode]})," · ",r.format||"TV"]})]}),e.jsxs(ze,{children:["View title ",e.jsx(F,{size:9})]})]},r.id)})})]})]})]})]})}),e.jsx(X,{}),e.jsx("div",{className:"bottom-nav-spacer"})]})};export{Fe as default};
