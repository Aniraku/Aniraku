import{r as u,R as w,j as t}from"./react-BDLNM8R1.js";import{e as st,u as dt,c as lt,H as pt,I as ct,J as xt,s as R,g as C,K as mt,d as gt,j as ht,b as Ce,L as Ne,M as ut,N as ft,a as bt,G as vt,A as wt,y as kt}from"./index-CbwXtSbX.js";import{C as yt,e as jt}from"./tmdbEpisodes-322jEti5.js";import{f as Et}from"./sync-DKRuGEJV.js";import{g as n}from"./styling-nw0auVTP.js";import{A as St}from"./Skeletons-DiNrHJeY.js";import{c as $t,u as It,L as $}from"./router-jK2CEO6W.js";import"./supabase-CG6S1lgy.js";const At=(e,p)=>{const[o,d]=u.useState(()=>{let x;try{x=JSON.parse(localStorage.getItem(e)||String(p))}catch{x=p}return x});return u.useEffect(()=>{localStorage.setItem(e,JSON.stringify(o))},[o,e]),[o,d]},zt=1500,Rt=15e3,Tt=n.div`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  position: relative;
  overflow-x: clip;
`,Ct=n.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.34;
  background-image:
    linear-gradient(to bottom, rgba(4, 7, 14, 0.16) 0%, rgba(4, 7, 14, 0.72) 58%, var(--bg) 94%),
    url(${e=>e.$src});
  background-size: cover;
  background-position: center 18%;
  filter: blur(28px) saturate(1.18) brightness(0.72);
  transform: scale(1.08);
  transition: opacity 240ms ease, filter 240ms ease;
  @media (max-width: 768px) {
    opacity: 0.27;
    background-position: center top;
    filter: blur(22px) saturate(1.1) brightness(0.68);
  }
`,Nt=n.div`
  position: relative;
  height: 400px;
  overflow: hidden;
  z-index: 1;
  @media (max-width: 768px) { height: 300px; }
  @media (max-width: 480px) { height: 260px; }
`,_t=n.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.5);
`,Mt=n.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 50%, var(--bg) 100%);
`,Bt=n.div`
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--content-pad);
  display: flex;
  gap: 32px;
  align-items: flex-end;
  @media (max-width: 768px) { gap: 20px; padding: 0 var(--content-pad); bottom: 20px; }
  @media (max-width: 480px) { gap: 14px; padding: 0 var(--content-pad); bottom: 14px; }
`,Pt=n.img`
  width: 150px;
  height: 210px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  flex-shrink: 0;
  @media (max-width: 768px) { width: 110px; height: 155px; }
  @media (max-width: 480px) { width: 82px; height: 116px; border-radius: 6px; }
`,Lt=n.div`
  flex: 1;
  padding-bottom: 8px;
  min-width: 0;
`,Ot=n.h1`
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  @media (max-width: 768px) { font-size: 22px; }
  @media (max-width: 480px) { font-size: clamp(18px, 5.6vw, 22px); line-height: 1.14; }
`,Ft=n.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted);
  @media (max-width: 480px) { font-size: 12px; gap: 8px; }
`,Dt=n.span`
  color: #ffc107;
  display: flex;
  align-items: center;
  gap: 4px;
`,Ut=n.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
  }
`,Wt=n($)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--accent);
  color: var(--bg);
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: opacity 0.2s;
  min-height: 44px;
  &:hover { opacity: 0.9; }
  @media (max-width: 480px) { padding: 8px 12px; font-size: 13px; min-height: 42px; width: 100%; justify-content: center; }
`,Ht=n.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-elevated);
  color: ${e=>e.$active?"var(--accent)":"var(--text-muted)"};
  border: 1px solid var(--border);
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  &:hover { border-color: var(--accent); }
  @media (max-width: 480px) { padding: 8px 14px; font-size: 13px; min-height: 42px; }
`,qt=n.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;

  @media (max-width: 480px) { grid-column: 1 / -1; font-size: 11px; }
`,S=n.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  color: ${({$rated:e})=>e?"#fbbf24":"#86efac"};
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
`,Gt=n.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: rgba(255,255,255,0.14);
  span {
    display: block;
    height: 100%;
    width: ${({$value:e})=>`${Math.max(0,Math.min(100,e||0))}%`};
    background: ${({$complete:e})=>e?"#4ade80":"var(--accent)"};
  }
`,F=n.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(251,191,36,0.15);
  color: #fbbf24;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
`,Yt=n.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 40px) var(--content-pad) calc(68px + env(safe-area-inset-bottom));
  @media (max-width: 768px) { padding-top: 24px; }
  @media (max-width: 480px) { padding-top: 20px; }
`,T=n.section`
  margin-bottom: 28px;
  @media (max-width: 480px) { margin-bottom: 20px; }
`,_e=n.h2`
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
`,Jt=n.p`
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
  @media (max-width: 480px) { font-size: 13px; line-height: 1.6; }
`,Vt=n.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`,Qt=n($)`
  padding: 3px 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  &:hover { border-color: var(--accent); color: var(--text-primary); }
  @media (max-width: 480px) { padding: 2px 8px; font-size: 10px; border-radius: 6px; min-height: 26px; }
`,Kt=n.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  -webkit-overflow-scrolling: touch;
`,Xt=n.button`
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid ${e=>e.$active?"var(--accent)":"transparent"};
  color: ${e=>e.$active?"var(--text-primary)":"var(--text-muted)"};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  &:hover { color: var(--text-primary); }
  @media (max-width: 480px) { padding: 8px 14px; font-size: 13px; min-height: 40px; }
`,Zt=n.div`
  max-height: 500px;
  overflow-y: auto;
  background: var(--bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--border);
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  @media (max-width: 480px) { max-height: 400px; border-radius: 6px; }
`,X=n.span`
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
  background: ${({$type:e})=>e==="filler"?"rgba(234,179,8,0.15)":"rgba(99,102,241,0.15)"};
  color: ${({$type:e})=>e==="filler"?"#fde68a":"#a5b4fc"};
`,ei=n($)`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  text-decoration: none;
  color: var(--text-muted);
  font-size: 13px;
  transition: background 0.15s;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  &:hover { background: rgba(255,255,255,0.03); }
  &:last-child { border-bottom: none; }
  &:active { background: rgba(255,255,255,0.05); }
  @media (max-width: 560px) {
    padding: 9px 10px;
    gap: 8px;
    font-size: 12px;
    min-height: 48px;
    flex-wrap: wrap;
    align-content: center;
    > span:nth-of-type(2) { flex: 1 1 calc(100% - 108px) !important; min-width: 110px !important; }
    ${S}, ${F}, ${X} { margin-left: 54px; }
    ${S} + ${S}, ${S} + ${F}, ${F} + ${S} { margin-left: 0; }
  }
`,ti=n.img`
  width: 60px;
  height: 34px;
  object-fit: contain;
  border-radius: 4px;
  flex-shrink: 0;
  background: var(--bg-card);
  @media (max-width: 560px) { width: 46px; height: 28px; }
`,ii=n.span`
  width: 24px;
  text-align: right;
  font-weight: 600;
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
`,ai=n.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  margin-bottom: 12px;
  background: ${({$active:e})=>e?"rgba(99,102,241,0.18)":"var(--bg-elevated)"};
  color: ${({$active:e})=>e?"#a5b4fc":"var(--text-muted)"};
  border: 1px solid ${({$active:e})=>e?"rgba(99,102,241,0.45)":"var(--border)"};
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  min-height: 30px;
  -webkit-tap-highlight-color: transparent;
  &:hover { border-color: var(--accent); }
`,Me=n.div`
  min-height: 80vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
`,ni="aniraku-episode-ratings";function oi(e){const p=(e==null?void 0:e.episode)??(e==null?void 0:e.episode_number),o=Number(p);if(!Number.isInteger(o)||o<1)return null;const d=(e==null?void 0:e.time)??(e==null?void 0:e.progress)??0,x=(e==null?void 0:e.duration)??0,f=Math.max(0,Number(d)||0),g=Math.max(0,Number(x)||0),h=e==null?void 0:e.timestamp,k=typeof h=="number"?h:Number(h)||Date.parse(h||"")||0;return{animeId:(e==null?void 0:e.animeId)??(e==null?void 0:e.anime_id),episode:o,time:f,duration:g,timestamp:k,completed:(e==null?void 0:e.completed)===!0||(e==null?void 0:e.status)==="completed"||g<=0||g>0&&f>=Math.max(g-5,g*.9)}}function ri(e){const p=new Map;return e.forEach(o=>{const d=oi(o);if(!d)return;const x=p.get(d.episode);(!x||d.timestamp>=x.timestamp)&&p.set(d.episode,d)}),[...p.values()].sort((o,d)=>d.timestamp-o.timestamp)}const si={PREQUEL:"Prequel",SEQUEL:"Sequel",SIDE_STORY:"Side Story",SPIN_OFF:"Spin Off",SUMMARY:"Summary",ALTERNATIVE:"Alternative",ADAPTATION:"Adaptation",CHARACTER:"Character",OTHER:"Other",PARENT:"Parent",COMPANION:"Companion",INCLUDES:"Includes",GIFTED_FROM:"Based On"},Z=n($)`
  text-decoration: none;
  display: block;
  -webkit-tap-highlight-color: transparent;
`,Pe=n.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-card);
  aspect-ratio: 16/10;
  @media (max-width: 480px) { border-radius: 6px; }
`,Le=n.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: filter 0.3s;
  ${Z}:hover & { filter: brightness(1.15); }
  @media (hover: none) { transition: none; }
`,Oe=n.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%);
`,Fe=n.span`
  position: absolute;
  top: 6px;
  left: 6px;
  background: ${e=>e.$variant==="score"?"rgba(0,0,0,0.8)":"rgba(99,102,241,0.9)"};
  color: ${e=>e.$variant==="score"?"#ffc107":"#fff"};
  font-size: ${e=>e.$variant==="score"?"10px":"9px"};
  font-weight: 700;
  padding: ${e=>e.$variant==="score"?"2px 6px":"2px 7px"};
  border-radius: 3px;
  ${e=>e.$variant==="score"?"":"text-transform: uppercase; letter-spacing: 0.3px;"}
  z-index: 1;
  @media (max-width: 480px) {
    font-size: ${e=>e.$variant==="score"?"9px":"8px"};
    padding: ${e=>(e.$variant==="score","1px 5px")};
  }
`,De=n.p`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 8px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
  margin: 0;
  @media (max-width: 480px) { font-size: 11px; padding: 16px 6px 6px; }
`,di=n.div`
  position: absolute;
  bottom: 28px;
  left: 8px;
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: rgba(255,255,255,0.7);
  @media (max-width: 480px) { bottom: 24px; left: 6px; font-size: 9px; gap: 4px; }
`,Be=n.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  @media (min-width: 768px) and (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  @media (min-width: 1025px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
`,li=n.div`
  text-align: center;
  padding: 40px;
  max-width: 400px;
  background: var(--bg-elevated);
  border-radius: 16px;
  border: 1px solid var(--border);
  margin: 0 16px;
  @media (max-width: 480px) { padding: 28px 20px; border-radius: 12px; margin: 0 12px; }
`,pi=n.button`
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
`,ci=n($)`
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
`,xi=({r:e})=>{var x,f,g,h,k;const p=(e==null?void 0:e.node)||e;if(!(p!=null&&p.id))return null;const o=((x=p.title)==null?void 0:x.english)||((f=p.title)==null?void 0:f.romaji)||((g=p.title)==null?void 0:g.userPreferred)||"Unknown",d=si[e==null?void 0:e.relationType]||((h=e==null?void 0:e.relationType)==null?void 0:h.replace("_"," "))||"";return t.jsx(Z,{to:`/anime/${C(o)}-${p.id}`,children:t.jsxs(Pe,{children:[t.jsx(Le,{src:((k=p.coverImage)==null?void 0:k.large)||"",alt:o,loading:"lazy"}),t.jsx(Oe,{}),t.jsx(Fe,{children:d}),t.jsx(De,{children:o})]})})},mi=({item:e})=>{var o,d,x;const p=((o=e.title)==null?void 0:o.english)||((d=e.title)==null?void 0:d.romaji)||"Unknown";return t.jsx(Z,{to:`/anime/${C(p)}-${e.id}`,children:t.jsxs(Pe,{children:[t.jsx(Le,{src:((x=e.coverImage)==null?void 0:x.large)||"",alt:p,loading:"lazy"}),t.jsx(Oe,{}),e.averageScore>0&&t.jsxs(Fe,{$variant:"score",children:["★ ",e.averageScore,"%"]}),t.jsx(De,{children:p}),t.jsxs(di,{children:[e.format&&t.jsx("span",{children:e.format.replace("_"," ")}),e.episodes&&t.jsxs("span",{children:[e.episodes," ep"]})]})]})})},Ei=()=>{var ge,he,ue,fe,be,ve,we,ke,ye,je,Ee,Se,$e,Ie,Ae,ze;const{slugId:e}=$t(),p=It(),o=st(e),{user:d}=dt(),{nsfwEnabled:x}=lt(),[f,g]=At("aniraku-bookmarks",[]),[h,k]=u.useState("episodes"),[b,ee]=u.useState([]),[Ue,te]=u.useState(!1),[ie,We]=u.useState([]),[ae,He]=u.useState(!1),[N,qe]=u.useState(!1),[I,D]=u.useState([]),[Ge,_]=u.useState({}),[U,Ye]=u.useState(!1),{data:a,isLoading:Je,isError:W,refetch:Ve}=pt(o),H=(a==null?void 0:a.format)==="MOVIE",Qe=H?(a==null?void 0:a.bannerImage)||((ge=a==null?void 0:a.coverImage)==null?void 0:ge.large)||((he=a==null?void 0:a.coverImage)==null?void 0:he.medium)||"":((ue=a==null?void 0:a.coverImage)==null?void 0:ue.large)||((fe=a==null?void 0:a.coverImage)==null?void 0:fe.medium)||(a==null?void 0:a.bannerImage)||"",Ke=H&&(((be=a==null?void 0:a.title)==null?void 0:be.english)||((ve=a==null?void 0:a.title)==null?void 0:ve.romaji)||((we=a==null?void 0:a.title)==null?void 0:we.userPreferred))||"",ne=w.useRef({thumbnail:"",title:"",isMovie:!1});ne.current={thumbnail:Qe,title:Ke,isMovie:H};const M=ct(xt((((ke=a==null?void 0:a.recommendations)==null?void 0:ke.nodes)||[]).map(i=>i==null?void 0:i.mediaRecommendation).filter(Boolean),x)),B=f.some(i=>i.id===parseInt(o));w.useEffect(()=>{if(!d)return;let i=!1;return R.from("bookmarks").select("anime_id,title,image").eq("user_id",d.id).then(async({data:s})=>{if(i)return;const r=(s||[]).map(c=>({id:c.anime_id,title:c.title,image:c.image})),l=new Set(r.map(c=>c.id));let m=[];try{m=JSON.parse(localStorage.getItem("aniraku-bookmarks")||"[]")}catch{}const v=m.filter(c=>!l.has(c.id));v.length&&await R.from("bookmarks").upsert(v.map(c=>({user_id:d.id,anime_id:c.id,title:c.title||"",image:c.image||"",added_at:Date.now()})),{onConflict:"user_id,anime_id"}),!i&&g([...r,...v])}).catch(()=>{}),()=>{i=!0}},[d,g]),w.useEffect(()=>{var r,l,m;if(!a)return;const i=((r=a.title)==null?void 0:r.english)||((l=a.title)==null?void 0:l.romaji)||((m=a.title)==null?void 0:m.userPreferred)||"Unknown Anime",s=`/anime/${C(i)}-${a.id}`;mt(a),window.location.pathname!==s&&p(s,{replace:!0})},[a,p]),w.useEffect(()=>gt(i=>{var s;if(i.type==="clear"){D([]);return}if(i.type==="remove"&&((s=i.keys)!=null&&s.length)){const r=new Set(i.keys);D(l=>l.filter(m=>!r.has(kt({animeId:o,episode:m.episode}))))}}),[o]),w.useEffect(()=>{if(!o)return;let i=!1,s=[];try{s=JSON.parse(localStorage.getItem("aniraku-watch-history")||"[]").filter(l=>String(l.animeId??l.anime_id)===String(o))}catch{}return(async()=>{let l=[];if(d)try{const{data:m}=await R.from("watch_history").select("episode_number, progress, duration, timestamp").eq("user_id",d.id).eq("anime_id",parseInt(o,10));l=m||[]}catch{}i||D(ri([...s,...l]))})(),()=>{i=!0}},[o,d]),w.useEffect(()=>{if(!o)return;let i=!1;if(_({}),d)Et(o).then(s=>{i||_(s||{})});else try{const s=JSON.parse(localStorage.getItem(`${ni}-${o}`)||"{}");i||_(s||{})}catch{i||_({})}return()=>{i=!0}},[o,d]),w.useEffect(()=>{var s;const i=(Array.isArray((s=a==null?void 0:a.relations)==null?void 0:s.edges)?a.relations.edges:[]).filter(r=>{var l;return((l=r==null?void 0:r.node)==null?void 0:l.id)&&r.node.type==="ANIME"&&["SEQUEL","PREQUEL","SPIN_OFF","SIDE_STORY","ADAPTATION"].includes(r.relationType)}).map(r=>({...r.node,relationType:r.relationType}));We(i),He(!1)},[a]),w.useEffect(()=>{if(!o)return;const i=new AbortController;let s=!1,r=null,l=0;ee([]),te(!0);const m=()=>{const c=Math.min(zt*2**Math.min(l,4),Rt);l+=1,r=window.setTimeout(v,c)},v=async()=>{try{const c=await fetch(`${wt}/api/v1/anime/${encodeURIComponent(o)}/episodes`,{signal:i.signal,headers:{Accept:"application/json"}});if(!c.ok)throw new Error(`Aniraku episode API returned ${c.status}`);const j=await c.json(),Re=Array.isArray(j)?j:j==null?void 0:j.episodes;if(!Array.isArray(Re))throw new Error("Aniraku episode API returned an invalid response");const Te=Re.filter(Boolean).map((E,rt)=>({...E,number:rt+1,originalNumber:E.number,thumbnail:E.thumbnail||E.image||"",filler:!!(E.filler??E.isFiller),recap:!!E.recap}));if(!Te.length)throw new Error("Aniraku episode API returned no episodes");const K=ne.current,ot=await jt(o,Te,{signal:i.signal,fallbackThumbnail:K.thumbnail,fallbackTitle:K.title,isMovie:K.isMovie});s||(l=0,ee(ot),te(!1))}catch(c){if((c==null?void 0:c.name)==="AbortError"||s)return;m()}};return v(),k("episodes"),()=>{s=!0,r&&window.clearTimeout(r),i.abort()}},[o]);const Xe=()=>{var s,r,l,m,v,c;const i=parseInt(o);B?(g(f.filter(j=>j.id!==i)),d&&R.from("bookmarks").delete().eq("user_id",d.id).eq("anime_id",i).then()):a&&(g([...f,{id:i,title:((s=a.title)==null?void 0:s.english)||((r=a.title)==null?void 0:r.romaji)||"Unknown",image:((l=a.coverImage)==null?void 0:l.large)||""}]),d&&R.from("bookmarks").upsert({user_id:d.id,anime_id:i,title:((m=a.title)==null?void 0:m.english)||((v=a.title)==null?void 0:v.romaji)||"Unknown",image:((c=a.coverImage)==null?void 0:c.large)||"",added_at:Date.now()},{onConflict:"user_id,anime_id"}).then())};if(Je)return t.jsx(St,{});if(!a)return t.jsx(t.Fragment,{children:t.jsx(Me,{children:t.jsxs("div",{style:{textAlign:"center",padding:"0 20px"},children:[t.jsx("p",{style:{fontSize:18,marginBottom:12,color:"var(--text)"},children:W?"Anime metadata is temporarily unavailable":"Anime not found"}),t.jsx("p",{style:{maxWidth:460,margin:"0 auto 18px",color:"var(--text-muted)",lineHeight:1.5},children:W?"AniList is busy or temporarily rejecting requests. Please retry shortly; this does not mean the anime is missing.":"This title could not be found in AniList."}),W&&t.jsx("button",{type:"button",onClick:()=>Ve(),style:{marginRight:10,padding:"10px 16px",border:0,borderRadius:999,background:"var(--accent)",color:"var(--bg)",fontWeight:750,cursor:"pointer"},children:"Retry AniList"}),t.jsx($,{to:"/",style:{color:"var(--accent)",fontSize:14},children:"Back to Home"})]})})});if(ht(a)&&!x)return t.jsx(t.Fragment,{children:t.jsx(Me,{children:t.jsxs(li,{children:[t.jsx("div",{style:{fontSize:48,marginBottom:16},children:"18+"}),t.jsx("p",{style:{fontSize:18,fontWeight:700,marginBottom:8,color:"var(--text)"},children:"Mature Content"}),t.jsx("p",{style:{fontSize:14,color:"var(--text-muted)",marginBottom:24},children:"This title contains adult content. Enable NSFW content in your settings to view it."}),t.jsxs("div",{style:{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"},children:[t.jsx(pi,{as:$,to:"/profile/settings",children:"Open Settings"}),t.jsx(ci,{to:"/",children:"Go Back"})]})]})})});const P=((ye=a.title)==null?void 0:ye.english)||((je=a.title)==null?void 0:je.romaji)||"Unknown",q=(a.description||"").replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim(),oe=q.length>500,re=U||!oe?q:`${q.slice(0,500).trimEnd()}…`,G=a.format==="MOVIE",A=b.length>0,se=ie.length>0,Ze=new Map(I.map(i=>[i.episode,i])),Y=new Set(I.map(i=>i.episode)),de=new Set(I.filter(i=>i.completed).map(i=>i.episode)),et=I.some(i=>i.time>0)||Y.size>0,tt=G?1:Number(a.episodes)||b.length,J=b.find(i=>!Y.has(Number(i.number))),le=Math.max(0,...[...Y].map(Number)),V=Math.max(0,...[...de].map(Number)),pe=Math.max(0,...I.filter(i=>!i.completed&&i.time>0).map(i=>i.episode)),ce=(J==null?void 0:J.number)||1,it=V>0?V+1:le>0?le+1:ce,xe=pe>V?pe:it,z=I.find(i=>i.episode===xe&&!i.completed&&i.time>0),y=A&&b.length>=tt&&b.every(i=>de.has(Number(i.number)))?"rewatch":et?"continue":"watch",L=y==="continue"?xe:y==="rewatch"?1:ce,at=y==="rewatch"?"Rewatch":y==="continue"?`Continue Episode ${L}`:"Watch Now",me=y==="rewatch"?"You completed this title. Start again from Episode 1.":y==="continue"?`Resume from Episode ${L}${z!=null&&z.time?` at ${Math.floor(z.time/60)}:${String(Math.floor(z.time%60)).padStart(2,"0")}`:""}.`:"",nt=b.filter(i=>i.filler||i.recap).length,Q=N?b.filter(i=>!i.filler&&!i.recap):b,O=[];return(A||Ue)&&O.push({key:"episodes",label:G?"Movie":`Episodes (${Q.length}${N?` of ${b.length}`:""})`}),(se||ae)&&O.push({key:"relations",label:"Relations"}),t.jsxs(Tt,{className:"anime-detail-page",children:[t.jsx(Ct,{$src:a.bannerImage||((Ee=a.coverImage)==null?void 0:Ee.extraLarge)||((Se=a.coverImage)==null?void 0:Se.large)||""}),t.jsxs("main",{style:{position:"relative",zIndex:1},children:[t.jsxs(Nt,{children:[t.jsx(_t,{src:a.bannerImage||(($e=a.coverImage)==null?void 0:$e.extraLarge)||((Ie=a.coverImage)==null?void 0:Ie.large)||"",alt:""}),t.jsx(Mt,{}),t.jsxs(Bt,{children:[t.jsx(Pt,{src:((Ae=a.coverImage)==null?void 0:Ae.large)||"",alt:P}),t.jsxs(Lt,{children:[t.jsx(Ot,{children:P}),t.jsxs(Ft,{children:[!!a.averageScore&&t.jsxs(Dt,{children:[t.jsx(Ce,{})," ",a.averageScore,"%"]}),!!a.format&&t.jsx("span",{children:a.format}),!G&&!!a.episodes&&t.jsxs("span",{children:[a.episodes," episodes"]}),!!a.status&&t.jsx("span",{children:a.status})]}),t.jsxs(Ut,{children:[A&&t.jsxs(Wt,{to:`/watch/${C(P)}-${o}-episode-${L}`,children:[t.jsx(Ne,{})," ",at]}),t.jsxs(Ht,{$active:B,onClick:Xe,children:[B?t.jsx(ut,{}):t.jsx(ft,{})," ",B?"Bookmarked":"Bookmark"]}),me&&t.jsx(qt,{children:me})]})]})]})]}),t.jsxs(Yt,{children:[re&&t.jsxs(T,{children:[t.jsx(_e,{children:"Synopsis"}),t.jsx(Jt,{id:"synopsis-content",children:re}),oe&&t.jsx("button",{type:"button","aria-expanded":U,"aria-controls":"synopsis-content",onClick:()=>Ye(i=>!i),style:{marginTop:10,padding:0,border:0,background:"transparent",color:"var(--accent)",fontSize:13,fontWeight:750,cursor:"pointer"},children:U?"Show less":"Read full synopsis"})]}),((ze=a.genres)==null?void 0:ze.length)>0&&t.jsx(T,{children:t.jsx(Vt,{children:a.genres.map(i=>t.jsx(Qt,{to:`/catalog?genre=${encodeURIComponent(i)}`,children:i},i))})}),O.length>0&&t.jsxs(T,{children:[t.jsx(Kt,{children:O.map(i=>t.jsx(Xt,{$active:h===i.key,onClick:()=>k(i.key),children:i.label},i.key))}),h==="episodes"&&t.jsxs(t.Fragment,{children:[A&&nt>0&&t.jsx(ai,{$active:N,onClick:()=>qe(i=>!i),children:N?"✓ Showing canon only":"Hide filler & recap"}),A&&t.jsx(Zt,{children:Q.map(i=>{const s=Number(i.number),r=Ze.get(s),l=Number(Ge[s])||0,m=r?r.duration>0?Math.min(100,r.time/r.duration*100):r.completed?100:0:0;return t.jsxs(ei,{to:`/watch/${C(P)}-${o}-episode-${s}`,"data-watched":r?"true":"false",children:[t.jsx(ti,{src:i.thumbnail||"",alt:"",loading:"lazy"}),t.jsx(ii,{children:s}),t.jsx("span",{style:{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:i.title||"Untitled episode"}),!!i.filler&&t.jsx(X,{$type:"filler",children:"FILLER"}),!!i.recap&&t.jsx(X,{$type:"recap",children:"RECAP"}),y==="continue"&&s===L&&t.jsx(S,{title:"Recommended continuation",children:"Up next"}),r&&t.jsxs(S,{title:r.completed?"Completed":"In progress",children:[t.jsx(bt,{size:9})," ",r.completed?"Watched":"In progress"]}),l>0&&t.jsxs(F,{title:`You rated this episode ${l}/10`,children:[t.jsx(Ce,{size:8})," ",l,"/10"]}),t.jsx(Ne,{size:10,style:{color:"var(--text-muted)",flexShrink:0}}),r&&t.jsx(Gt,{$value:m,$complete:r.completed,children:t.jsx("span",{})})]},s)})}),A&&Q.length===0&&t.jsx("p",{style:{fontSize:13,color:"var(--text-muted)",padding:"12px 0"},children:"No canon episodes listed. Switch back to see all episodes."})]}),h==="relations"&&(ae?t.jsx("div",{style:{padding:"12px 0",color:"var(--text-muted)",fontSize:13},role:"status",children:"Loading related anime…"}):se?t.jsx(Be,{children:ie.map(i=>t.jsx(xi,{r:{node:i,relationType:i.relationType||""}},i.id))}):null)]}),t.jsx(T,{children:t.jsx(yt,{animeId:a.id})}),(M==null?void 0:M.length)>0&&t.jsxs(T,{children:[t.jsx(_e,{children:"Similar Anime"}),t.jsx(Be,{children:M.map(i=>t.jsx(mi,{item:i},i.id))})]})]})]}),t.jsx(vt,{})]})};export{Ei as default};
