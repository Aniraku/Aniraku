import{r as h,j as t,R as Ie}from"./react-BDLNM8R1.js";import{u as $e,s as R,O as Ae,Q as Fe,R as ue,S as ie,T as ze,U as Te,V as Re,W as Ee,X as Pe}from"./index-CbwXtSbX.js";import{g as o}from"./styling-nw0auVTP.js";import{L as X}from"./router-jK2CEO6W.js";const Be=/^(?:media\d*|i)\.giphy\.com$/i;function M(e){if(typeof e!="string"||!e.trim())return!1;try{const n=new URL(e);return n.protocol==="https:"&&Be.test(n.hostname)}catch{return!1}}function Le(e,n){const r="||GIF:",a=typeof e=="string"?e:"",i=a.indexOf(r),u=i===-1?a:a.slice(0,i).trimEnd(),l=i===-1?"":a.slice(i+r.length).trim(),w=M(n)?n:M(l)?l:"";return{text:u,gifUrl:w}}function xe(e,n){return!!(String(e||"").trim()||M(n))}function Me(e){var y;const n=(e==null?void 0:e.images)||{},r=n.original||{},a=r.url||"",i=((y=n.original)==null?void 0:y.url)||a;if(!M(a)||!M(i))return null;const u=Number(r.width),l=Number(r.height),w=Number.isFinite(u)&&Number.isFinite(l)&&u>0&&l>0?u/l:1;return{id:(e==null?void 0:e.id)||a,url:a,previewUrl:i,label:String((e==null?void 0:e.title)||(e==null?void 0:e.slug)||"Animated reaction").trim()||"Animated reaction",width:Number.isFinite(u)&&u>0?u:null,height:Number.isFinite(l)&&l>0?l:null,aspectRatio:w}}const Q="IMLN0hP4pbhAz5mrkT4iFqjktLzmiGNW".trim(),ae="https://api.giphy.com/v1/gifs",Ne=e=>{const n=[];for(const r of String(e||"")){const a=r.codePointAt(0);if(!(a>=55296&&a<=57343)&&(n.push(r),n.length>=2e3))break}return n.join("")},Ue=o.section`
  margin-top: 40px;
`,Oe=o.h2`
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
`,De=o.p`
  color: var(--text-muted);
  font-size: 13px;
  margin: 0 0 16px;
  max-width: 100%;
  overflow-wrap: anywhere;
`,He=o.form`
  background: transparent;
  border: none;
  border-radius: 0;
  box-sizing: border-box;
  display: flex;
  gap: 8px;
  margin: ${e=>e.$compact?"8px 0 0":"0 0 16px"};
  max-width: 100%;
  min-width: 0;
  overflow: visible;
  padding: 0;
  position: relative;

  > * { min-width: 0; }

  @media (max-width: 480px) {
    gap: 7px;
  }
`,qe=o.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 8px 9px;
`,Ye=o.div`
  align-items: flex-start;
  display: flex;
  gap: 6px;
  min-width: 0;

  @media (max-width: 480px) {
    align-items: center;
    flex-wrap: nowrap;
  }
`,We=o.div`
  align-items: center;
  border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
  padding-top: 6px;
`,Qe=o.img`
  background: var(--bg-elevated);
  border-radius: 50%;
  flex-shrink: 0;
  height: 32px;
  object-fit: cover;
  width: 32px;
`,Ve=o.div`
  align-items: center;
  background: var(--accent);
  border-radius: 50%;
  color: var(--bg);
  display: flex;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  height: 32px;
  justify-content: center;
  text-transform: uppercase;
  width: 32px;
`,Ze=o.textarea`
  background: transparent;
  border: none;
  box-sizing: border-box;
  color: var(--text-primary);
  flex: 1 1 auto;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.45;
  min-height: 30px;
  min-width: 0;
  outline: none;
  padding: 0;
  resize: vertical;
`,Ke=o.button`
  align-items: center;
  background: var(--accent);
  border: none;
  border-radius: 7px;
  color: var(--bg);
  cursor: ${e=>e.$disabled?"wait":"pointer"};
  display: inline-flex;
  flex: 0 0 auto;
  height: 28px;
  justify-content: center;
  opacity: ${e=>e.$disabled?.6:1};
  padding: 0;
  transition: transform 160ms ease, opacity 160ms ease;
  width: 30px;

  &:not(:disabled):hover { transform: translateY(-1px); }
  &:not(:disabled):active { transform: scale(0.97); }

  @media (max-width: 480px) {
    margin-left: auto;
    min-height: 28px;
  }
`,oe=o.button`
  align-items: center;
  background: ${e=>e.$active?"color-mix(in srgb, var(--accent) 14%, transparent)":"var(--bg-elevated)"};
  border: 1px solid ${e=>e.$active?"color-mix(in srgb, var(--accent) 45%, var(--border))":"transparent"};
  border-radius: 7px;
  color: ${e=>e.$active?"var(--accent)":"var(--text-secondary)"};
  cursor: pointer;
  display: inline-flex;
  gap: 5px;
  height: 26px;
  justify-content: center;
  min-height: 26px;
  padding: 0 7px;
  transition: border-color 160ms ease, color 160ms ease, transform 160ms ease;

  &:hover { border-color: var(--accent); color: var(--accent); }
  &:active { transform: scale(0.96); }
  width: auto;
`,se=o.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
`,Xe=o.div`
  align-items: flex-start;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: inline-flex;
  gap: 6px;
  max-width: min(190px, 100%);
  overflow: hidden;
  padding: 4px;

  img { border-radius: 5px; display: block; height: 48px; max-width: 120px; object-fit: cover; width: auto; }
`,Je=o.button`
  align-items: center;
  align-self: stretch;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  padding: 4px;
  &:hover { color: var(--accent); }
`,et=o.div`
  background: color-mix(in srgb, var(--bg-elevated) 94%, #000);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
  max-width: 368px;
  padding: 8px;
  width: 100%;

  @media (max-width: 480px) {
    max-height: none;
    max-width: 100%;
    position: static;
    width: 100%;
  }
`,tt=o.div`
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
`,nt=o.strong`
  color: var(--text-primary);
  font-size: 12px;
`,rt=o.input`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 7px;
  box-sizing: border-box;
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  min-width: 0;
  outline: none;
  padding: 7px 8px;
  width: 100%;
  &:focus { border-color: var(--accent); }
`,it=o.button`
  align-items: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  padding: 4px;
  &:hover { color: var(--accent); }
`,at=o.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;

  @media (max-width: 480px) {
    max-height: 420px;
  }
`,ot=o.button`
  align-items: center;
  background: var(--bg-elevated);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  min-width: 0;
  min-height: 124px;
  overflow: hidden;
  padding: 0;
  position: relative;
  width: 100%;
  aspect-ratio: ${e=>e.$aspectRatio};
  &:hover, &:focus-visible { border-color: var(--accent); outline: none; }
  img { display: block; height: 100%; max-height: none; object-fit: contain; width: 100%; }
`,V=o.p`
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.45;
  margin: 0;
`,st=o.a`
  align-self: flex-end;
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
  &:hover { color: var(--accent); }
`,lt=o.p`
  color: #ef4444;
  font-size: 13px;
  margin: 0;
`,ct=o.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 100%;
  min-width: 0;
`,he=o.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 12px 14px;
`,dt=o(he)`
  margin-left: 46px;
  @media (max-width: 480px) { margin-left: 20px; max-width: calc(100% - 20px); }
  @media (max-width: 380px) { margin-left: 12px; max-width: calc(100% - 12px); }
`,pt=o.div`
  align-items: center;
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  min-width: 0;
`,mt=o(X)`
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`,ut=o.span`
  color: var(--text-muted);
  font-size: 12px;
  white-space: nowrap;
`,xt=o.div`
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 10px;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  word-break: break-word;
`,ht=o.img`
  border-radius: 8px;
  display: block;
  margin-top: 8px;
  max-height: 200px;
  max-width: min(300px, 100%);
  width: auto;
  @media (max-width: 480px) { max-width: 100%; }
`,gt=o.button`
  align-items: center;
  background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--bg-elevated)) 0 9px, var(--bg-elevated) 9px 18px);
  border: 1px dashed color-mix(in srgb, var(--accent) 55%, var(--border));
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 12px;
  gap: 8px;
  justify-content: center;
  margin: 0 0 10px;
  min-height: 54px;
  padding: 10px;
  text-align: center;
  width: 100%;
  &:hover { border-color: var(--accent); color: var(--accent); }
`,ft=o.div`
  align-items: center;
  color: var(--text-muted);
  display: inline-flex;
  font-size: 11px;
  font-weight: 700;
  gap: 6px;
  letter-spacing: 0.04em;
  margin: 0 0 8px;
  text-transform: uppercase;
`,bt=o.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  max-width: 100%;
  min-width: 0;
`,Z=o.button`
  align-items: center;
  background: none;
  border: none;
  color: ${e=>e.$active?"var(--accent)":"var(--text-muted)"};
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  gap: 6px;
  min-height: 32px;
  padding: 2px 4px;
  white-space: nowrap;
  &:hover { color: var(--accent); }
`,le=o.p`
  color: var(--text-muted);
  font-size: 14px;
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 24px 0;
  text-align: center;
`,vt=o.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-sizing: border-box;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.8;
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 24px;
  text-align: center;
  a { color: var(--accent); font-weight: 600; text-decoration: none; }
  a:hover { text-decoration: underline; }
`,wt=e=>{const n=Math.floor((Date.now()-new Date(e).getTime())/1e3);return n<60?"just now":n<3600?`${Math.floor(n/60)}m ago`:n<86400?`${Math.floor(n/3600)}h ago`:n<604800?`${Math.floor(n/86400)}d ago`:new Date(e).toLocaleDateString()},K=(e,n)=>{const r=e[n];return(r==null?void 0:r.display_name)||(r==null?void 0:r.username)||"Anonymous"},yt=(e,n)=>{var r;return((r=e[n])==null?void 0:r.avatar_url)||null},ge=({url:e,name:n})=>e?t.jsx(Qe,{src:e,alt:""}):t.jsx(Ve,{children:(n||"A").charAt(0)});function fe({avatar:e,placeholder:n,value:r,onChange:a,gifUrl:i,onGifChange:u,spoiler:l,onSpoilerChange:w,onSubmit:y,busy:d,error:j,compact:G=!1}){const[c,b]=h.useState(!1),[g,m]=h.useState(""),[v,x]=h.useState([]),[k,E]=h.useState(!1),[T,$]=h.useState(""),A=xe(r,i);h.useEffect(()=>{if(!c)return;if(!Q){x([]),$("GIF search is temporarily unavailable.");return}const p=new AbortController,q=window.setTimeout(async()=>{E(!0),$("");try{const _=new URL(g.trim()?`${ae}/search`:`${ae}/trending`);_.searchParams.set("api_key",Q),_.searchParams.set("limit","20"),_.searchParams.set("rating","g"),g.trim()&&(_.searchParams.set("q",g.trim()),_.searchParams.set("lang","en"));const N=await fetch(_,{signal:p.signal});if(!N.ok)throw new Error(`GIF service returned ${N.status}`);const B=await N.json();if(!Array.isArray(B==null?void 0:B.data))throw new Error("GIF service returned an invalid response");x(B.data.map(Me).filter(Boolean))}catch(_){(_==null?void 0:_.name)!=="AbortError"&&(x([]),$("Could not load GIFs. Please try again."))}finally{p.signal.aborted||E(!1)}},g.trim()?260:0);return()=>{p.abort(),window.clearTimeout(q)}},[c,g]);const P=p=>{u(p.url),b(!1)};return t.jsxs(He,{$compact:G,onSubmit:p=>{p.preventDefault(),A&&y()},children:[e&&t.jsx(ge,{url:e.url,name:e.name}),t.jsxs(qe,{children:[t.jsxs(Ye,{children:[t.jsx(Ze,{placeholder:n,value:r,onChange:p=>a(p.target.value),maxLength:2e3,rows:G?1:2}),t.jsx(Ke,{type:"submit",$disabled:d||!A,disabled:d||!A,"aria-label":"Post comment",title:"Post comment",children:t.jsx(Ae,{size:13})})]}),t.jsxs(We,{children:[Q&&t.jsxs(oe,{type:"button",onClick:()=>b(p=>!p),$active:c||!!i,"aria-expanded":c,"aria-controls":"comment-gif-picker","aria-label":"Choose a GIF",title:"Choose a GIF",children:[t.jsx(Fe,{size:13})," ",t.jsx(se,{children:"GIF"})]}),t.jsxs(oe,{type:"button",onClick:()=>w(!l),$active:l,"aria-pressed":l,"aria-label":l?"Spoiler protection on":"Mark comment as a spoiler",title:l?"Spoiler protection on":"Mark as spoiler",children:[t.jsx(ue,{size:13})," ",t.jsx(se,{children:"Spoiler"})]})]}),c&&t.jsxs(et,{id:"comment-gif-picker",role:"dialog","aria-label":"Choose a reaction GIF",children:[t.jsxs(tt,{children:[t.jsx(nt,{children:"Reaction GIFs"}),t.jsx(it,{type:"button",onClick:()=>b(!1),"aria-label":"Close GIF picker",children:t.jsx(ie,{size:12})})]}),t.jsx(rt,{value:g,onChange:p=>m(p.target.value),placeholder:"Search reactions","aria-label":"Search G-rated GIFs",autoFocus:!0}),k?t.jsx(V,{children:"Loading…"}):T?t.jsx(V,{children:T}):v.length?t.jsx(at,{children:v.map(p=>t.jsx(ot,{$aspectRatio:p.aspectRatio,type:"button",onClick:()=>P(p),title:`Use GIF: ${p.label}`,"aria-label":`Use GIF: ${p.label}`,children:t.jsx("img",{src:p.previewUrl,alt:"",loading:"lazy",width:p.width||void 0,height:p.height||void 0})},p.id))}):t.jsx(V,{children:"No G-rated GIFs found."}),t.jsx(st,{href:"https://giphy.com",target:"_blank",rel:"noreferrer",children:"Powered by GIPHY"})]}),i&&t.jsxs(Xe,{children:[t.jsx("img",{src:i,alt:"Selected reaction GIF"}),t.jsx(Je,{type:"button",onClick:()=>u(""),"aria-label":"Remove selected GIF",children:t.jsx(ie,{})})]}),j&&t.jsx(lt,{children:j})]})]})}const ce=(e,n,{profiles:r,likedIds:a,replyTo:i,replyText:u,replyGifUrl:l,replySpoiler:w,busy:y,user:d,revealedIds:j,toggleLike:G,remove:c,submitReply:b,setReplyTo:g,setReplyText:m,setReplyGifUrl:v,setReplySpoiler:x,setPostError:k,toggleReveal:E})=>{const T=n?dt:he,{text:$,gifUrl:A}=Le(e.content,e.gif_url),P=!!e.is_spoiler&&!j.has(e.id);return t.jsxs(T,{children:[t.jsxs(pt,{children:[t.jsx(ge,{url:yt(r,e.user_id),name:K(r,e.user_id)}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",minWidth:0},children:[t.jsx(mt,{to:"/profile",children:K(r,e.user_id)}),t.jsx(ut,{children:wt(e.created_at)})]})]}),P?t.jsxs(gt,{type:"button",onClick:()=>E(e.id),"aria-label":"Spoiler hidden. Activate to reveal this comment.",children:[t.jsx(ue,{})," Spoiler hidden · tap to reveal"]}):t.jsxs(t.Fragment,{children:[e.is_spoiler&&t.jsxs(ft,{children:[t.jsx(ze,{})," Spoiler revealed"]}),t.jsxs(xt,{children:[$&&t.jsx("p",{style:{margin:0},children:$}),A&&t.jsx(ht,{src:A,alt:"Animated reaction GIF",loading:"lazy",onError:p=>{p.currentTarget.style.display="none"}})]})]}),t.jsxs(bt,{children:[t.jsxs(Z,{$active:a.has(e.id),onClick:()=>G(e.id),title:"Like",children:[a.has(e.id)?t.jsx(Te,{size:13}):t.jsx(Re,{size:13}),e.likes||0]}),t.jsxs(Z,{onClick:()=>{const p=i!==e.id;g(p?e.id:null),m(""),v(""),x(!1),k("")},children:[t.jsx(Ee,{size:12})," Reply"]}),d&&d.id===e.user_id&&t.jsxs(Z,{onClick:()=>c(e.id),title:"Delete",style:{marginLeft:"auto"},children:[t.jsx(Pe,{size:12})," Delete"]})]}),i===e.id&&t.jsx(fe,{compact:!0,placeholder:`Reply to ${K(r,e.user_id)}…`,value:u,onChange:m,gifUrl:l,onGifChange:v,spoiler:w,onSpoilerChange:x,onSubmit:()=>b(e.id),busy:y})]},e.id)},Ft=({animeId:e,episodeNumber:n,label:r})=>{const{user:a}=$e(),i=a,[u,l]=h.useState([]),[w,y]=h.useState({}),[d,j]=h.useState(null),[G,c]=h.useState(new Set),[b,g]=h.useState(""),[m,v]=h.useState(""),[x,k]=h.useState(!1),[E,T]=h.useState(null),[$,A]=h.useState(""),[P,p]=h.useState(""),[q,_]=h.useState(!1),[N,B]=h.useState(new Set),[Y,ee]=h.useState(!1),[ve,W]=h.useState(!0),[we,L]=h.useState("");h.useEffect(()=>{let s=!1;return(async()=>{W(!0);const F=R.from("comments").select("*").eq("anime_id",e).order("created_at",{ascending:!0}).limit(200);n&&F.eq("episode_number",n);const{data:I,error:S}=await F;if(s)return;if(S){console.error("Comments load:",S),W(!1);return}const U=I||[];l(U);const O=[...new Set(U.map(z=>z.user_id).filter(Boolean))];if(O.length){const{data:z}=await R.from("profiles").select("id, username, display_name, avatar_url").in("id",O);if(s)return;z&&y(Object.fromEntries(z.map(D=>[D.id,D])))}if(i){const{data:z}=await R.from("profiles").select("id, username, display_name, avatar_url").eq("id",i.id).maybeSingle();if(s)return;z&&j(z);const{data:D}=await R.from("comment_likes").select("comment_id").eq("user_id",i.id);if(s)return;D&&c(new Set(D.map(Ge=>Ge.comment_id)))}W(!1)})(),()=>{s=!0}},[e,n,i]);const ye=()=>{i&&y(s=>{var f;return{...s,[i.id]:s[i.id]||{username:(d==null?void 0:d.username)||((f=i.user_metadata)==null?void 0:f.username),display_name:(d==null?void 0:d.display_name)||null,avatar_url:(d==null?void 0:d.avatar_url)||null}}})},te=async({text:s,mediaUrl:f,spoiler:F,parentId:I=null})=>{const S=Ne(s);if(!xe(S,f)||!i||Y)return null;if(f&&!M(f))return L("Only GIFs selected from the picker can be attached."),null;ee(!0);const{data:U,error:O}=await R.from("comments").insert({user_id:i.id,anime_id:e,episode_number:n||null,content:S,gif_url:f||null,is_spoiler:!!F,parent_id:I}).select().single();return ee(!1),O?(console.error("Comment post:",O),L("Could not post your comment. Please try again."),null):(L(""),l(z=>[...z,U]),ye(),U)},je=async()=>{await te({text:b,mediaUrl:m,spoiler:x})&&(g(""),v(""),k(!1))},ke=async s=>{await te({text:$,mediaUrl:P,spoiler:q,parentId:s})&&(T(null),A(""),p(""),_(!1))},Se=async s=>{if(!i)return;const{data:f,error:F}=await R.rpc("toggle_comment_like",{p_comment_id:s});if(F){console.error("Like toggle:",F);return}l(I=>I.map(S=>S.id===s?{...S,likes:f}:S)),c(I=>{const S=new Set(I);return S.has(s)?S.delete(s):S.add(s),S})},_e=async s=>{if(!i)return;const{error:f}=await R.from("comments").delete().or(`id.eq.${s},parent_id.eq.${s}`);if(f){console.error("Comment delete:",f);return}l(F=>F.filter(I=>I.id!==s&&I.parent_id!==s))},ne=u.filter(s=>!s.parent_id),Ce=s=>u.filter(f=>f.parent_id===s),re={profiles:w,likedIds:G,replyTo:E,replyText:$,replyGifUrl:P,replySpoiler:q,busy:Y,user:i,revealedIds:N,toggleLike:Se,remove:_e,submitReply:ke,setReplyTo:T,setReplyText:A,setReplyGifUrl:p,setReplySpoiler:_,setPostError:L,toggleReveal:s=>B(f=>new Set(f).add(s))};return t.jsxs(Ue,{id:"comments",children:[t.jsxs(Oe,{children:["Comments (",u.length,")"]}),r&&t.jsx(De,{children:r}),i?t.jsx(fe,{avatar:{url:d==null?void 0:d.avatar_url,name:(d==null?void 0:d.display_name)||(d==null?void 0:d.username)||i.email||"You"},placeholder:"Share your thoughts…",value:b,onChange:s=>{g(s),L("")},gifUrl:m,onGifChange:s=>{v(s),L("")},spoiler:x,onSpoilerChange:k,onSubmit:je,busy:Y,error:we}):t.jsxs(vt,{children:[t.jsx(X,{to:"/login",children:"Log in"})," or ",t.jsx(X,{to:"/signup",children:"create an account"})," to join the discussion."]}),ve?t.jsx(le,{children:"Loading comments…"}):ne.length===0?t.jsx(le,{children:"No comments yet. Be the first to share your thoughts!"}):t.jsx(ct,{children:ne.map(s=>t.jsxs(Ie.Fragment,{children:[ce(s,!1,re),Ce(s.id).map(f=>ce(f,!0,re))]},s.id))})]})},de=100,pe=3;function H(e){const n=Number(e);return Number.isInteger(n)&&n>0?n:null}function C(e){return typeof e=="string"?e.trim():""}function be(e){return/^https:\/\/image\.tmdb\.org\/t\/p\/(?:original|[wh]\d+)\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(C(e))}function jt(e){return/^https:\/\/[^\s]+$/i.test(C(e))}function J(e){return/^(?:(?:episode|ep)\s*)?\d+(?:\s*(?:[·.-]\s*\d+\s*[ps]))?$/i.test(C(e))}function kt(e){const n=C(e);return!!n&&!J(n)&&!/^(?:tba|tbd|untitled|unknown)$/i.test(n)}function St(e){const n=Array.isArray(e)?e.filter(Boolean):[],r=new Map;return n.forEach(a=>{const i=C(a==null?void 0:a.title);i&&r.set(i,(r.get(i)||0)+1)}),n.map((a,i)=>{const u=H(a==null?void 0:a.number)||i+1,l=C(a==null?void 0:a.title),w=l&&!J(l)&&r.get(l)===1;return{...a,number:u,title:w?l:null,thumbnail:w&&be(a==null?void 0:a.thumbnail)?C(a.thumbnail):null,description:null}})}function _t(e,n){const r=H(e==null?void 0:e.number)||n+1;return{...e,number:r,title:null,thumbnail:null,description:null}}function me(e,n,{fallbackThumbnail:r="",fallbackTitle:a="",isMovie:i=!1,mappedNumbers:u=[]}={}){const l=jt(r)?C(r):null,w=C(a),y=i&&w&&!J(w)?w:null,d=new Set((Array.isArray(u)?u:[]).map(H).filter(Boolean)),j=new Map;(Array.isArray(n)?n:[]).filter(c=>H(c==null?void 0:c.number)&&kt(c==null?void 0:c.title)).forEach(c=>{const b=Number(c.number),g=j.get(b)||[];g.push(c),j.set(b,g)});const G=new Map([...j.entries()].filter(([,c])=>c.length===1).map(([c,[b]])=>[c,b]));return St(e).map((c,b)=>{const g=_t(c,b),m=G.get(g.number);if(!m){const v=d.has(g.number);return{...v?g:c,title:v?y:c.title||y,thumbnail:v?l:c.thumbnail||l}}return{...g,title:C(m.title)||c.title,thumbnail:be(m.thumbnail)?C(m.thumbnail):l,description:C(m.description)||null}})}async function zt(e,n,{fetchImpl:r=fetch,signal:a,baseUrl:i="",fallbackThumbnail:u="",fallbackTitle:l="",isMovie:w=!1}={}){const y=H(e),d={fallbackThumbnail:u,fallbackTitle:l,isMovie:w},j=me(n,[],d);if(!y||!j.length)return j;const G=[],c=[],b=[];for(let m=0;m<j.length;m+=de)b.push(j.slice(m,m+de).map(v=>v.number));const g=async m=>{const v=`${i}/api/tmdb-episodes?anilistId=${encodeURIComponent(y)}&episodes=${encodeURIComponent(m.join(","))}`;try{const x=await r(v,{headers:{Accept:"application/json"},signal:a}),k=await x.json().catch(()=>({}));return!x.ok||Number(k==null?void 0:k.anilistId)!==y||(k==null?void 0:k.source)!=="tmdb"?null:k}catch(x){if((x==null?void 0:x.name)==="AbortError")throw x;return null}};for(let m=0;m<b.length;m+=pe){const v=await Promise.all(b.slice(m,m+pe).map(g));if(v.some(x=>!x))return j;for(const x of v)Array.isArray(x.episodes)&&G.push(...x.episodes),Array.isArray(x.mapped)&&c.push(...x.mapped)}return me(n,G,{...d,mappedNumbers:c})}export{Ft as C,zt as e};
