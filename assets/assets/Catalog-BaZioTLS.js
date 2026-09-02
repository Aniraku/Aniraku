import{r as p,j as e}from"./react-BDLNM8R1.js";import{ad as Ne,ae as se,af as Te,ag as Me,ah as Le,ai as _e,aj as De,c as Be,J as ie,ak as Ye,n as He,al as Ue,am as Ge,an as Ve,ao as B,ap as Qe,F as Ke,S as ne,aq as qe,ar as le,as as We,b as Je,G as Ze,g as Xe,at as er,L as ve,a4 as rr,au as tr,av as ar,f as ce,aw as or,ax as sr}from"./index-CbwXtSbX.js";import{a as be}from"./Skeletons-DiNrHJeY.js";import{g as i,E as fe}from"./styling-nw0auVTP.js";import{d as ir,u as nr,L as I}from"./router-jK2CEO6W.js";import"./supabase-CG6S1lgy.js";class lr extends Ne{constructor(r,n){super(r,n)}bindMethods(){super.bindMethods(),this.fetchNextPage=this.fetchNextPage.bind(this),this.fetchPreviousPage=this.fetchPreviousPage.bind(this)}setOptions(r,n){super.setOptions({...r,behavior:se()},n)}getOptimisticResult(r){return r.behavior=se(),super.getOptimisticResult(r)}fetchNextPage({pageParam:r,...n}={}){return this.fetch({...n,meta:{fetchMore:{direction:"forward",pageParam:r}}})}fetchPreviousPage({pageParam:r,...n}={}){return this.fetch({...n,meta:{fetchMore:{direction:"backward",pageParam:r}}})}createResult(r,n){var l,x,h,g,u,m;const{state:w}=r,C=super.createResult(r,n),{isFetching:s,isRefetching:y}=C,b=s&&((l=w.fetchMeta)==null||(x=l.fetchMore)==null?void 0:x.direction)==="forward",P=s&&((h=w.fetchMeta)==null||(g=h.fetchMore)==null?void 0:g.direction)==="backward";return{...C,fetchNextPage:this.fetchNextPage,fetchPreviousPage:this.fetchPreviousPage,hasNextPage:Me(n,(u=w.data)==null?void 0:u.pages),hasPreviousPage:Te(n,(m=w.data)==null?void 0:m.pages),isFetchingNextPage:b,isFetchingPreviousPage:P,isRefetching:y&&!b&&!P}}}function cr(t,r,n){const l=Le(t,r,n);return _e(l,lr)}const dr=24,pr=500,xr=new Date().getFullYear(),S=(t="")=>t.replace(/_/g," "),O=t=>{var r,n,l;return((r=t==null?void 0:t.title)==null?void 0:r.english)||((n=t==null?void 0:t.title)==null?void 0:n.romaji)||((l=t==null?void 0:t.title)==null?void 0:l.userPreferred)||"Unknown title"},Q=t=>{var r,n,l;return[...new Set([(r=t==null?void 0:t.coverImage)==null?void 0:r.extraLarge,(n=t==null?void 0:t.coverImage)==null?void 0:n.large,(l=t==null?void 0:t.coverImage)==null?void 0:l.medium].filter(Boolean))]},gr=t=>Q(t)[0],K=t=>`/anime/${Xe(O(t))}-${t.id}`,hr=(t="")=>t.replace(/<[^>]*>/g," ").replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,"&").replace(/\s+/g," ").trim(),de=[{value:"POPULARITY_DESC",label:"Most popular",icon:Ye},{value:"SCORE_DESC",label:"Top rated",icon:He},{value:"START_DATE_DESC",label:"Newest releases",icon:Ue},{value:"TITLE_ROMAJI",label:"A–Z",icon:Ge}],pe=[{value:"",label:"All formats"},{value:"TV",label:"TV series"},{value:"MOVIE",label:"Movies"},{value:"OVA",label:"OVA"},{value:"ONA",label:"ONA"},{value:"SPECIAL",label:"Specials"}],xe=[{value:"",label:"Any status"},{value:"RELEASING",label:"Airing now"},{value:"FINISHED",label:"Finished"},{value:"NOT_YET_RELEASED",label:"Upcoming"}],ur=[{value:"",label:"All genres"},...["Action","Adventure","Comedy","Drama","Ecchi","Fantasy","Horror","Mahou Shoujo","Mecha","Music","Mystery","Psychological","Romance","Sci-Fi","Slice of Life","Sports","Supernatural","Thriller"].map(t=>({value:t,label:t}))],vr=[{value:"",label:"Any year"},...Array.from({length:30},(t,r)=>{const n=xr-r;return{value:String(n),label:String(n)}})],q=fe`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`,br=fe`
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
`,fr=i.div`
  min-height: 100vh;
  overflow: clip;
  background: var(--bg);
  color: var(--text-primary);
`,Y=i.div`
  width: min(100%, 1600px);
  margin: 0 auto;
  padding: 0 var(--content-pad);
`,mr=i.section`
  position: relative;
  isolation: isolate;
  min-height: clamp(470px, 64vw, 690px);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: var(--bg-secondary);

  @media (max-width: 640px) { min-height: clamp(430px, 126vw, 520px); }
`,wr=i.div`
  position: absolute;
  inset: 0;
  z-index: -2;
  background-position: center 24%;
  background-size: cover;
  filter: saturate(0.92) contrast(1.04);
  transform: scale(1.02);
  transition: background-image 260ms ease-out;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(7,7,8,0.98) 0%, rgba(7,7,8,0.83) 34%, rgba(7,7,8,0.16) 72%, rgba(7,7,8,0.48) 100%),
      linear-gradient(0deg, #070708 0%, rgba(7,7,8,0.1) 48%, rgba(7,7,8,0.44) 100%);
  }

  @media (max-width: 720px) {
    background-position: 62% center;
    &::after {
      background:
        linear-gradient(90deg, rgba(7,7,8,0.96) 0%, rgba(7,7,8,0.52) 100%),
        linear-gradient(0deg, #070708 0%, rgba(7,7,8,0.1) 60%, rgba(7,7,8,0.38) 100%);
    }
  }
`,yr=i.div`
  position: absolute;
  inset: 0;
  z-index: -3;
  background:
    radial-gradient(circle at 76% 22%, rgba(139,92,246,0.24), transparent 28%),
    radial-gradient(circle at 42% 80%, var(--accent-glow), transparent 35%),
    linear-gradient(120deg, var(--bg-elevated) 0%, var(--bg) 55%, #101019 100%);
`,jr=i.div`
  width: min(100%, 780px);
  padding: clamp(126px, 16vw, 190px) 0 clamp(54px, 7vw, 96px);
  animation: ${q} 460ms cubic-bezier(0.23, 1, 0.32, 1) both;
`,kr=i.p`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  color: var(--text-primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;

  svg { color: var(--accent); }
`,Sr=i.h1`
  max-width: 16ch;
  margin: 0 0 14px;
  color: var(--text-primary);
  font-size: clamp(40px, 6vw, 76px);
  font-weight: 850;
  line-height: 0.98;
  letter-spacing: -0.055em;
  text-wrap: balance;
`,Cr=i.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 650;

  .score { color: var(--success); }
  .rating { padding: 2px 6px; border: 1px solid var(--border-hover); font-size: 11px; }
  .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text-muted); }
`,Pr=i.p`
  display: -webkit-box;
  max-width: 62ch;
  margin: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: clamp(14px, 1.5vw, 16px);
  line-height: 1.58;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
`,Er=i.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
`,Rr=i(I)`
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 20px;
  border-radius: 7px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 800;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms ease, border-color 160ms ease;

  &:active { transform: scale(0.97); }

  &.primary { background: var(--accent); color: var(--bg); }
  &.primary:hover { background: var(--accent-dim); }
  &.secondary { border: 1px solid var(--border-hover); background: var(--bg-elevated); color: var(--text-primary); }
  &.secondary:hover { background: var(--bg-card); border-color: var(--text-muted); }

  @media (max-width: 480px) { width: 100%; }
`,Ar=i.section`
  position: relative;
  z-index: 2;
  margin-top: -24px;
`,Fr=i.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 2px 0;

  > span {
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`,$=i.button`
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--bg-card);
  color: var(--text-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, color 160ms ease;
  &:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 11%, var(--bg-card)); color: var(--text-primary); }
  &:active { transform: scale(0.97); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  @media (max-width: 480px) { flex: 1 1 calc(50% - 6px); }
`,zr=i.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  box-shadow: 0 16px 44px rgba(0,0,0,0.24);
  backdrop-filter: blur(18px);

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 9px;
  }
`,$r=i.div`
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 46px;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: var(--bg-card);
  transition: border-color 160ms ease, background 160ms ease;

  &:focus-within { border-color: var(--accent); background: var(--bg-elevated); }
  svg { flex: 0 0 auto; color: rgba(255,255,255,0.64); }

  input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text-primary);
    font: inherit;
    font-size: 14px;
    &::placeholder { color: var(--text-muted); }
  }
`,Ir=i.kbd`
  flex: 0 0 auto;
  padding: 3px 6px;
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 4px;
  color: rgba(255,255,255,0.52);
  background: rgba(0,0,0,0.16);
  font-size: 10px;
  font-family: inherit;

  @media (max-width: 520px) { display: none; }
`,Or=i.button`
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  &:hover { background: var(--bg-elevated); color: var(--text-primary); }
`,Nr=i.button`
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 15px;
  border: 1px solid ${({$open:t})=>t?"var(--accent)":"var(--border)"};
  border-radius: 9px;
  background: ${({$open:t})=>t?"var(--accent)":"var(--bg-card)"};
  color: ${({$open:t})=>t?"var(--bg)":"var(--text-primary)"};
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms ease;
  &:active { transform: scale(0.97); }
  &:hover { background: ${({$open:t})=>t?"var(--accent-dim)":"var(--bg-elevated)"}; }

  @media (max-width: 680px) { width: 100%; }
`,Tr=i.span`
  display: inline-grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 999px;
  background: ${({$open:t})=>t?"var(--bg)":"var(--accent)"};
  color: ${({$open:t})=>t?"var(--accent)":"var(--bg)"};
  font-size: 11px;
  font-weight: 850;
`,Mr=i.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 2px 0;
`,Lr=i.span`
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`,_r=i.button`
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--accent) 46%, var(--border));
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--accent) 11%, var(--bg-card));
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  &:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 17%, var(--bg-card)); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
`,Dr=i.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) auto;
  gap: 10px;
  margin-top: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-elevated);
  box-shadow: 0 16px 40px rgba(0,0,0,0.24);
  animation: ${q} 180ms cubic-bezier(0.23, 1, 0.32, 1) both;

  @media (max-width: 1020px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 10px;
  }
`,Br=i.label`
  position: relative;
  display: block;
  min-width: 0;

  > span {
    position: absolute;
    top: 8px;
    left: 11px;
    z-index: 1;
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 750;
    pointer-events: none;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  select {
    width: 100%;
    min-height: 48px;
    padding: 20px 29px 6px 11px;
    appearance: none;
    border: 1px solid var(--border);
    border-radius: 8px;
    outline: 0;
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    &:focus { border-color: var(--accent); }
    option { color: var(--text-primary); background: var(--bg-elevated); }
  }

  svg { position: absolute; right: 10px; bottom: 11px; pointer-events: none; color: rgba(255,255,255,0.55); }
`,ge=i.button`
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  &:hover { border-color: var(--border-hover); color: var(--text-primary); }
  @media (max-width: 640px) { grid-column: span 2; }
`,Yr=i.main`
  padding: clamp(28px, 4vw, 48px) 0 calc(76px + env(safe-area-inset-bottom));
`,me=i.section`
  position: relative;
  margin-bottom: clamp(34px, 5vw, 64px);
`,we=i.div`
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 13px;

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 10px;
  }
`,ye=i.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;

  svg { flex: 0 0 auto; color: var(--accent); }

  h2 {
    margin: 0;
    overflow: hidden;
    color: var(--text-primary);
    font-size: clamp(18px, 2vw, 24px);
    font-weight: 800;
    letter-spacing: -0.025em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p { margin: 2px 0 0; color: var(--text-secondary); font-size: 12px; }

  @media (max-width: 560px) {
    align-items: flex-start;
    h2 { white-space: normal; }
    p { line-height: 1.4; }
  }
`,Hr=i.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
`,Ur=i(I)`
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
  &:hover { color: var(--text-primary); }
  @media (max-width: 720px) { display: none; }
`,he=i.button`
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms ease;
  &:hover { background: var(--bg-elevated); border-color: var(--border-hover); }
  &:active { transform: scale(0.94); }
  @media (hover: none), (max-width: 720px) { display: none; }
`,Gr=i.div`
  display: flex;
  gap: clamp(10px, 1.25vw, 16px);
  overflow-x: auto;
  overflow-y: visible;
  padding: 6px 4px 18px;
  margin: 0 -4px -18px;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`,Vr=i(I)`
  display: block;
  width: clamp(138px, 13.5vw, 202px);
  flex: 0 0 auto;
  min-width: 0;
  color: var(--text-primary);
  text-decoration: none;
  scroll-snap-align: start;
  outline: none;

  &:focus-visible .poster { outline: 3px solid var(--accent); outline-offset: 3px; }
  &:hover .poster { transform: scale(1.055); box-shadow: 0 16px 34px rgba(0,0,0,0.48); }
  &:active .poster { transform: scale(0.98); }

  @media (hover: none) {
    &:active .poster { transform: scale(0.975); }
  }

  @media (max-width: 520px) { width: clamp(128px, 40vw, 158px); }
`,je=i.div`
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 6px;
  background: var(--bg-card);
  box-shadow: 0 8px 20px rgba(0,0,0,0.32);
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms ease;

  img { width: 100%; height: 100%; object-fit: cover; display: block; }

  &::after {
    content: '';
    position: absolute;
    inset: 40% 0 0;
    pointer-events: none;
    background: linear-gradient(to top, rgba(0,0,0,0.82), transparent);
  }
`,Qr=i.div`
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--text-muted);
  background: linear-gradient(135deg, var(--bg-elevated), var(--bg-secondary));
`,ke=p.memo(function({anime:r,title:n}){const l=Q(r),[x,h]=p.useState(0),g=l[x];return g?e.jsx("img",{src:g,alt:n,loading:"lazy",onError:()=>h(u=>u+1)}):e.jsx(Qr,{"aria-label":`${n} poster unavailable`,children:"No poster"})}),Se=i.div`
  position: absolute;
  z-index: 1;
  right: 8px;
  bottom: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  color: rgba(255,255,255,0.9);
  font-size: 10px;
  font-weight: 750;

  .score { color: var(--success); }
  .play { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 50%; background: var(--accent); color: var(--bg); }
`,Kr=i.div`
  padding: 9px 2px 0;

  h3 {
    display: -webkit-box;
    min-height: 34px;
    margin: 0;
    overflow: hidden;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  p { margin: 4px 0 0; color: var(--text-secondary); font-size: 11px; font-weight: 600; }
`,qr=i.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;

  h2 { margin: 0; color: var(--text-primary); font-size: clamp(24px, 3vw, 34px); font-weight: 830; letter-spacing: -0.04em; }
  p { margin: 7px 0 0; color: var(--text-secondary); font-size: 13px; }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    p { line-height: 1.45; }
  }
`,Wr=i.div`
  flex: 0 0 auto;
  padding: 8px 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-secondary);
  background: var(--bg-card);
  font-size: 12px;
  font-weight: 700;

  @media (max-width: 560px) { align-self: flex-start; }
`,ue=i.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(16px, 2vw, 28px) clamp(12px, 1.35vw, 20px);
  animation: ${q} 240ms cubic-bezier(0.23, 1, 0.32, 1) both;

  @media (max-width: 1180px) { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  @media (max-width: 900px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 640px) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 12px; }
`,Jr=i(I)`
  display: block;
  min-width: 0;
  color: var(--text-primary);
  text-decoration: none;
  outline: none;
  &:focus-visible .poster { outline: 3px solid var(--accent); outline-offset: 3px; }
  &:hover .poster { transform: translateY(-5px); box-shadow: 0 17px 34px rgba(0,0,0,0.48); }
  &:active .poster { transform: scale(0.975); }
`,Zr=i(je)`
  border-radius: 7px;
`,Xr=i.div`
  padding: 10px 2px 0;
  h3 { display: -webkit-box; min-height: 34px; margin: 0; overflow: hidden; color: var(--text-primary); font-size: 13px; font-weight: 720; line-height: 1.3; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  p { margin: 5px 0 0; color: var(--text-secondary); font-size: 11px; font-weight: 600; }
`,et=i.div`
  display: flex;
  min-height: 102px;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 13px;
`,H=i.div`
  padding: 88px 20px;
  text-align: center;
  h2 { margin: 0 0 10px; color: var(--text-primary); font-size: 24px; }
  p { margin: 0 0 22px; color: var(--text-secondary); }
`,U=i.button`
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 7px;
  background: var(--accent);
  color: var(--bg);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  &:hover { background: var(--accent-dim); }
  &:active { transform: scale(0.97); }
`,rt=i.div`
  display: flex;
  gap: 14px;
  overflow: hidden;
  > div { width: clamp(138px, 13.5vw, 202px); flex: 0 0 auto; }
  .card-skeleton { width: 100%; }
`,tt=i(ar)`
  animation: ${br} 1s ease-in-out infinite;
`;function A({label:t,options:r,value:n,onChange:l}){return e.jsxs(Br,{children:[e.jsx("span",{children:t}),e.jsx("select",{value:n,onChange:x=>l(x.target.value),"aria-label":t,children:r.map(x=>e.jsx("option",{value:x.value,children:x.label},x.value))}),e.jsx(er,{size:10})]})}const at=p.memo(function({anime:r}){const n=O(r),l=[r!=null&&r.episodes?`${r.episodes} eps`:(r==null?void 0:r.format)==="MOVIE"?"Movie":r!=null&&r.status?S(r.status):"Details pending",r==null?void 0:r.seasonYear,r!=null&&r.format&&(r==null?void 0:r.format)!=="MOVIE"?S(r.format):null].filter(Boolean).join(" • ");return e.jsxs(Vr,{to:K(r),"aria-label":`Open ${n}`,children:[e.jsxs(je,{className:"poster",children:[e.jsx(ke,{anime:r,title:n}),e.jsxs(Se,{children:[e.jsx("span",{className:"score",children:r!=null&&r.averageScore?`${r.averageScore}% match`:"Explore"}),e.jsx("span",{className:"play",children:e.jsx(ve,{size:9})})]})]}),e.jsxs(Kr,{children:[e.jsx("h3",{children:n}),l&&e.jsx("p",{children:l})]})]})}),ot=p.memo(function({anime:r}){const n=O(r),l=[r!=null&&r.episodes?`${r.episodes} eps`:(r==null?void 0:r.format)==="MOVIE"?"Movie":r!=null&&r.status?S(r.status):"Details pending",r==null?void 0:r.seasonYear,r!=null&&r.format&&(r==null?void 0:r.format)!=="MOVIE"?S(r.format):null].filter(Boolean).join(" • ");return e.jsxs(Jr,{to:K(r),"aria-label":`Open ${n}`,children:[e.jsxs(Zr,{className:"poster",children:[e.jsx(ke,{anime:r,title:n}),e.jsxs(Se,{children:[e.jsx("span",{className:"score",children:r!=null&&r.averageScore?`${r.averageScore}% match`:"Explore"}),e.jsx("span",{className:"play",children:e.jsx(ve,{size:9})})]})]}),e.jsxs(Xr,{children:[e.jsx("h3",{children:n}),l&&e.jsx("p",{children:l})]})]})});function G({title:t,description:r,icon:n,items:l,to:x}){const h=p.useRef(null),g=u=>{var m;(m=h.current)==null||m.scrollBy({left:h.current.clientWidth*.82*u,behavior:"smooth"})};return l!=null&&l.length?e.jsxs(me,{children:[e.jsxs(we,{children:[e.jsxs(ye,{children:[e.jsx(n,{size:17}),e.jsxs("div",{children:[e.jsx("h2",{children:t}),r&&e.jsx("p",{children:r})]})]}),e.jsxs(Hr,{children:[e.jsx(Ur,{to:x,children:"View all"}),e.jsx(he,{type:"button","aria-label":`Scroll ${t} left`,onClick:()=>g(-1),children:e.jsx(rr,{size:12})}),e.jsx(he,{type:"button","aria-label":`Scroll ${t} right`,onClick:()=>g(1),children:e.jsx(tr,{size:12})})]})]}),e.jsx(Gr,{ref:h,"aria-label":`${t} titles`,children:l.map(u=>e.jsx(at,{anime:u},u.id))})]}):null}function V({title:t,icon:r}){return e.jsxs(me,{"aria-busy":"true","aria-label":`Loading ${t}`,children:[e.jsx(we,{children:e.jsxs(ye,{children:[e.jsx(r,{size:17}),e.jsxs("div",{children:[e.jsx("h2",{children:t}),e.jsx("p",{children:"Loading titles…"})]})]})}),e.jsx(rt,{children:Array.from({length:7}).map((n,l)=>e.jsx(be,{},l))})]})}function pt(){var ee,re,te;const[t]=ir(),r=nr(),[n,l]=p.useState(t.get("search")||""),[x,h]=p.useState(t.get("search")||""),[g,u]=p.useState(!1),m=p.useRef(null),w=p.useRef(null),C=p.useRef(!1),s=p.useMemo(()=>({genre:t.get("genre")||"",format:t.get("format")||"",status:t.get("status")||"",year:t.get("year")||"",sort:t.get("sort")||"POPULARITY_DESC",view:t.get("view")||"",search:x}),[t,x]),y=!!(s.search||s.format||s.status||s.genre||s.year||s.sort!=="POPULARITY_DESC"||s.view==="all"),{data:b,fetchNextPage:P,hasNextPage:N,isFetchingNextPage:T,isLoading:M,isError:Ce,refetch:W}=cr({queryKey:["catalog-infinite",s],queryFn:async({pageParam:a=1})=>{const o={page:a,perPage:dr,sort:[s.sort||"POPULARITY_DESC"]};s.search&&(o.search=s.search),s.genre&&(o.genre=s.genre),s.format&&(o.format=s.format),s.status&&(o.status=s.status),s.year&&(o.year=Number.parseInt(s.year,10));const d=await ce(or,o);return{media:d.data.Page.media,pageInfo:d.data.Page.pageInfo}},getNextPageParam:a=>a.pageInfo.hasNextPage?a.pageInfo.currentPage+1:void 0,staleTime:3e5}),{data:F,isLoading:Pe,isError:Ee,refetch:Re}=De({queryKey:["catalog-shelves"],queryFn:async()=>(await ce(sr)).data,staleTime:3e5}),{nsfwEnabled:z}=Be(),E=p.useMemo(()=>b?ie(b.pages.flatMap(a=>a.media),z):[],[b,z]),v=p.useMemo(()=>{const a=o=>{var d;return ie(((d=F==null?void 0:F[o])==null?void 0:d.media)||[],z)};return{trending:a("trending"),airing:a("airing"),popular:a("popular"),movies:a("movies"),topRated:a("topRated")}},[F,z]),Ae=p.useMemo(()=>{const a=new Map;return[...v.topRated,...v.popular,...v.trending].forEach(o=>{o!=null&&o.id&&!a.has(o.id)&&a.set(o.id,o)}),[...a.values()].filter(o=>Number(o.averageScore)>=75).sort((o,d)=>(Number(d.averageScore)||0)-(Number(o.averageScore)||0)).slice(0,14)},[v]),j=p.useMemo(()=>{const a=new Map;return[...v.popular,...v.topRated].forEach(o=>{o!=null&&o.id&&!a.has(o.id)&&a.set(o.id,o)}),[...a.values()].filter(o=>Q(o).length>0).slice(0,10)},[v]),[Fe,J]=p.useState(0),c=y?E[0]:j[Fe]||v.trending[0]||E[0],Z=((te=(re=(ee=b==null?void 0:b.pages)==null?void 0:ee[0])==null?void 0:re.pageInfo)==null?void 0:te.total)||0,L=!!(s.search||s.format||s.status||s.genre||s.year||s.sort!=="POPULARITY_DESC"||s.view),_=p.useMemo(()=>{var a,o,d;return[s.search&&{key:"search",label:`Search: ${s.search}`},s.genre&&{key:"genre",label:`Genre: ${s.genre}`},s.format&&{key:"format",label:`Format: ${((a=pe.find(k=>k.value===s.format))==null?void 0:a.label)||s.format}`},s.status&&{key:"status",label:`Status: ${((o=xe.find(k=>k.value===s.status))==null?void 0:o.label)||S(s.status)}`},s.year&&{key:"year",label:`Year: ${s.year}`},s.sort!=="POPULARITY_DESC"&&{key:"sort",label:`Sort: ${((d=de.find(k=>k.value===s.sort))==null?void 0:d.label)||S(s.sort)}`},s.view&&{key:"view",label:"View: Every title"}].filter(Boolean)},[s]),R=_.length;p.useEffect(()=>{J(a=>j.length?a%j.length:0)},[j.length]),p.useEffect(()=>{if(y||j.length<2)return;const a=window.setInterval(()=>{J(o=>(o+1)%j.length)},7e3);return()=>window.clearInterval(a)},[j.length,y]),p.useEffect(()=>{Ve(t)},[t]),p.useEffect(()=>{const a=t.get("search")||"";l(o=>o===a?o:a),h(o=>o===a?o:a)},[t]),p.useEffect(()=>{if(!C.current){C.current=!0;return}const a=window.setTimeout(()=>{const o=n.trim();if(o===x)return;h(o);const d=new URLSearchParams(t);o?d.set("search",o):d.delete("search"),d.delete("view"),r(`/catalog${d.toString()?`?${d.toString()}`:""}`,{replace:!0})},pr);return()=>window.clearTimeout(a)},[n,x,t,r]);const f=p.useCallback((a,o)=>{const d=new URLSearchParams(t);o?d.set(a,o):d.delete(a),d.delete("view"),r(`/catalog${d.toString()?`?${d.toString()}`:""}`)},[r,t]),D=p.useCallback(()=>{l(""),h(""),u(!1),r("/catalog")},[r]),ze=p.useCallback(()=>{l(""),h("");const a=new URLSearchParams(t);a.delete("search"),a.delete("view"),r(`/catalog${a.toString()?`?${a.toString()}`:""}`,{replace:!0})},[r,t]),$e=p.useCallback(a=>{a==="search"&&(l(""),h(""));const o=new URLSearchParams(t);o.delete(a),r(`/catalog${o.toString()?`?${o.toString()}`:""}`)},[r,t]);p.useEffect(()=>{const a=o=>{var ae,oe;const d=o.target,k=(ae=d==null?void 0:d.closest)==null?void 0:ae.call(d,'input, textarea, select, [contenteditable="true"]');(o.metaKey||o.ctrlKey)&&o.key.toLowerCase()==="k"&&!k&&(o.preventDefault(),(oe=m.current)==null||oe.focus())};return window.addEventListener("keydown",a),()=>window.removeEventListener("keydown",a)},[]),p.useEffect(()=>{if(!y||M||!N||T||!w.current)return;const a=new window.IntersectionObserver(o=>{var d;(d=o[0])!=null&&d.isIntersecting&&P()},{threshold:.1,rootMargin:"260px"});return a.observe(w.current),()=>a.disconnect()},[P,N,y,T,M]);const Ie=hr(c==null?void 0:c.description)||"Explore the all-time anime favourites that audiences return to again and again.",X=(c==null?void 0:c.bannerImage)||gr(c),Oe=[c!=null&&c.averageScore?`${c.averageScore}% match`:null,c==null?void 0:c.seasonYear,c!=null&&c.episodes?`${c.episodes} episodes`:null,c!=null&&c.format?S(c.format):null].filter(Boolean);return e.jsxs(fr,{className:"catalog-page",children:[e.jsxs(mr,{children:[e.jsx(yr,{}),X&&e.jsx(wr,{style:{backgroundImage:`url(${X})`}}),e.jsx(Y,{children:e.jsxs(jr,{children:[e.jsxs(kr,{children:[e.jsx(B,{size:12})," All-time popular"]}),e.jsx(Sr,{children:c?O(c):"Find your next obsession."}),e.jsx(Cr,{children:Oe.map((a,o)=>e.jsxs("span",{className:o===0&&(c!=null&&c.averageScore)?"score":o===3?"rating":"",children:[o>0&&e.jsx("span",{className:"dot","aria-hidden":"true"})," ",a]},a))}),e.jsx(Pr,{children:Ie}),e.jsx(Er,{children:c&&e.jsxs(Rr,{className:"primary",to:K(c),children:[e.jsx(Qe,{size:14})," Explore title"]})})]},(c==null?void 0:c.id)||"catalog-featured")})]}),e.jsx(Ar,{children:e.jsxs(Y,{children:[e.jsxs(zr,{children:[e.jsxs($r,{children:[e.jsx(Ke,{size:16}),e.jsx("input",{ref:m,value:n,onChange:a=>l(a.target.value),placeholder:"Titles, genres, studios…","aria-label":"Search anime"}),n?e.jsx(Or,{type:"button","aria-label":"Clear search",onClick:ze,children:e.jsx(ne,{size:13})}):e.jsx(Ir,{children:"⌘ K"})]}),e.jsxs(Nr,{type:"button",$open:g,"aria-expanded":g,"aria-controls":"catalog-filter-panel","aria-label":`${g?"Close filters":"Browse filters"}${R?`, ${R} active`:""}`,onClick:()=>u(a=>!a),children:[e.jsx(qe,{size:14})," ",g?"Close filters":"Browse filters",R>0&&e.jsx(Tr,{$open:g,"aria-hidden":"true",children:R})]})]}),e.jsxs(Fr,{"aria-label":"Popular catalog views",children:[e.jsx("span",{children:"Explore"}),e.jsx($,{type:"button",onClick:()=>f("view","all"),children:"Popular in Aniraku"}),e.jsx($,{type:"button",onClick:()=>f("status","RELEASING"),children:"Airing now"}),e.jsx($,{type:"button",onClick:()=>f("sort","SCORE_DESC"),children:"Top rated"}),e.jsx($,{type:"button",onClick:()=>f("format","MOVIE"),children:"Movie night"})]}),g&&e.jsxs(Dr,{id:"catalog-filter-panel",role:"region","aria-label":"Catalog filters",children:[e.jsx(A,{label:"Sort",options:de,value:s.sort,onChange:a=>f("sort",a)}),e.jsx(A,{label:"Genre",options:ur,value:s.genre,onChange:a=>f("genre",a)}),e.jsx(A,{label:"Format",options:pe,value:s.format,onChange:a=>f("format",a)}),e.jsx(A,{label:"Status",options:xe,value:s.status,onChange:a=>f("status",a)}),e.jsx(A,{label:"Year",options:vr,value:s.year,onChange:a=>f("year",a)}),L&&e.jsx(ge,{type:"button",onClick:D,children:"Reset all"})]}),L&&e.jsxs(Mr,{"aria-label":"Applied catalog filters",children:[e.jsxs(Lr,{children:[R," active"]}),_.map(a=>e.jsxs(_r,{type:"button",onClick:()=>$e(a.key),"aria-label":`Remove ${a.label} filter`,children:[a.label," ",e.jsx(ne,{size:11,"aria-hidden":"true"})]},a.key)),e.jsx(ge,{type:"button",onClick:D,children:"Reset all"})]})]})}),e.jsx(Y,{children:e.jsx(Yr,{children:y?e.jsxs(e.Fragment,{children:[e.jsxs(qr,{children:[e.jsxs("div",{children:[e.jsx("h2",{children:s.search?`Results for “${s.search}”`:"Browse every title"}),e.jsx("p",{children:L?`Filtered by ${_.map(a=>a.label.replace(/^[^:]+: /,"")).join(" · ")}.`:"Open a title to view its episodes, streaming options, and full details."})]}),Z>0&&e.jsxs(Wr,{children:[Z.toLocaleString()," titles"]})]}),M?e.jsx(ue,{children:Array.from({length:18}).map((a,o)=>e.jsx(be,{},o))}):Ce?e.jsxs(H,{role:"alert",children:[e.jsx("h2",{children:"We could not load the catalog"}),e.jsx("p",{children:"Please check your connection and try again."}),e.jsx(U,{type:"button",onClick:()=>W(),children:"Try again"})]}):E.length?e.jsxs(e.Fragment,{children:[e.jsx(ue,{children:E.map(a=>e.jsx(ot,{anime:a},a.id))}),e.jsx(et,{ref:w,children:T?e.jsxs(e.Fragment,{children:[e.jsx(tt,{}),"  Loading more titles…"]}):N?"Keep scrolling for more titles":"You reached the end of this collection"})]}):e.jsxs(H,{role:"status",children:[e.jsx("h2",{children:"No titles found"}),e.jsx("p",{children:"Try a different search or reset your filters."}),e.jsx(U,{type:"button",onClick:D,children:"Reset catalog"})]})]}):Ee&&!E.length?e.jsxs(H,{role:"alert",children:[e.jsx("h2",{children:"Catalog is taking longer than usual"}),e.jsx("p",{children:"The anime shelves could not load right now. Please try again."}),e.jsx(U,{type:"button",onClick:()=>{W(),Re()},children:"Try again"})]}):Pe?e.jsxs(e.Fragment,{children:[e.jsx(V,{title:"Trending now",icon:B}),e.jsx(V,{title:"Airing this week",icon:le}),e.jsx(V,{title:"Popular in Aniraku",icon:We})]}):e.jsxs(e.Fragment,{children:[e.jsx(G,{title:"Trending now",description:"The stories everyone is talking about",icon:B,items:v.trending,to:"/catalog?sort=POPULARITY_DESC"}),e.jsx(G,{title:"Airing this week",description:"Fresh episodes from ongoing series",icon:le,items:v.airing,to:"/catalog?status=RELEASING"}),e.jsx(G,{title:"Popular in Aniraku",description:"Underrated, highly rated titles worth adding to your watchlist",icon:Je,items:Ae,to:"/catalog?sort=SCORE_DESC"})]})})}),e.jsx(Ze,{}),e.jsx("div",{className:"bottom-nav-spacer"})]})}export{pt as default};
