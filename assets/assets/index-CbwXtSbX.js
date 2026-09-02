const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/react-BDLNM8R1.js","assets/styling-nw0auVTP.js","assets/router-jK2CEO6W.js","assets/supabase-CG6S1lgy.js"])))=>i.map(i=>d[i]);
var Ji=Object.defineProperty;var Xi=(e,t,r)=>t in e?Ji(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var mt=(e,t,r)=>Xi(e,typeof t!="symbol"?t+"":t,r);import{r as g,j as a,R as ye,a as Zi,A as ea,S as ta,b as ra}from"./react-BDLNM8R1.js";import{c as Nr}from"./supabase-CG6S1lgy.js";import{g as x,E as na}from"./styling-nw0auVTP.js";import{L as F,u as Nn,a as De,B as ia,R as aa,b as H,N as He}from"./router-jK2CEO6W.js";const sa=(function(){const t=typeof document<"u"&&document.createElement("link").relList;return t&&t.supports&&t.supports("modulepreload")?"modulepreload":"preload"})(),oa=function(e){return"/"+e},Br={},ne=function(t,r,n){let i=Promise.resolve();if(r&&r.length>0){let o=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const c=document.querySelector("meta[property=csp-nonce]"),l=(c==null?void 0:c.nonce)||(c==null?void 0:c.getAttribute("nonce"));i=o(r.map(d=>{if(d=oa(d),d in Br)return;Br[d]=!0;const u=d.endsWith(".css"),h=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${h}`))return;const m=document.createElement("link");if(m.rel=u?"stylesheet":sa,u||(m.as="script"),m.crossOrigin="",m.href=d,l&&m.setAttribute("nonce",l),document.head.appendChild(m),u)return new Promise((b,S)=>{m.addEventListener("load",b),m.addEventListener("error",()=>S(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(o){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=o,window.dispatchEvent(c),!c.defaultPrevented)throw o}return i.then(o=>{for(const c of o||[])c.status==="rejected"&&s(c.reason);return t().catch(s)})},ca="https://sbjdrjaovcgvttfnpfsz.supabase.co",Bn="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiamRyamFvdmNndnR0Zm5wZnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjMzMTksImV4cCI6MjA5ODQ5OTMxOX0.L099PD4jk1Q2GtwZiE61Jp8eCnpSEVbXAE7L37MUsCE",nr=!!Bn,B=nr?Nr(ca,Bn,{auth:{persistSession:!0,autoRefreshToken:!0,detectSessionInUrl:!0}}):Nr("https://placeholder.supabase.co","placeholder",{auth:{persistSession:!1,autoRefreshToken:!1}}),$n="https://sbjdrjaovcgvttfnpfsz.supabase.co",Un="Anixen Avatars",la=["01.png","02.png","03.png","06.png","07.png","avatar-02.png","avatar-04.png","avatar-12.png","avatar-17.png","avatar-18.png","avatar-20.png","avatar-22.png","avatar-23.png","avatar2-08.png","avatar2-10.png","beerus.png","vegeta.png","File2.jpg","File4.png","File6.png","File9.jpg","user-00.jpeg","user-01.jpeg","user-02.jpeg","user-04.jpeg","user-07.jpeg","user-08.jpeg"];function Hn(e){return e.split("/").map(t=>encodeURIComponent(t)).join("/")}const $r=la.map((e,t)=>({id:t,name:e,url:`${$n}/storage/v1/object/public/${Hn(Un+"/"+e)}`}));function ua(e){return e?e.startsWith("http")?e:`${$n}/storage/v1/object/public/${Hn(Un+"/"+e)}`:null}function ir(e=0){return $r[Math.abs(e)%$r.length]}function da(e,t="user"){const r=String(e||t).toLowerCase().replace(/[^a-z0-9_]/g,"_").replace(/_+/g,"_").replace(/^_|_$/g,"").slice(0,20);return r.length>=3?r:t}function ha(e){var t,r,n,i;return!!(e!=null&&e.email&&(((t=e==null?void 0:e.app_metadata)==null?void 0:t.provider)==="email"||(r=e==null?void 0:e.identities)!=null&&r.some(s=>s.provider==="email")||!((n=e==null?void 0:e.app_metadata)!=null&&n.provider)&&!((i=e==null?void 0:e.identities)!=null&&i.length)))}function Ne(e){return ha(e)&&!(e!=null&&e.email_confirmed_at)&&!(e!=null&&e.confirmed_at)}function pa(e){const t=(e==null?void 0:e.user_metadata)||{},r=String((e==null?void 0:e.email)||"").split("@")[0],n=`user_${String((e==null?void 0:e.id)||"account").slice(0,6)}`,i=da(t.username||r,n),s=String(t.display_name||i).trim()||i;return{id:e==null?void 0:e.id,username:i,display_name:s,bio:null,avatar_url:null}}const qn=g.createContext(null),Dt=()=>g.useContext(qn);function Ur(e){const r=(e||"user").toLowerCase().replace(/[^a-z0-9_]/g,"_").replace(/_+/g,"_").replace(/^_|_$/g,"").slice(0,20);return r.length>=3?r:`user_${Math.random().toString(36).slice(2,6)}`}function fa(){if(typeof window>"u"||window.location.pathname!=="/auth/new-password")return!1;const e=new URL(window.location.href);return e.searchParams.get("type")==="recovery"||/(?:^|&)type=recovery(?:&|$)/.test(e.hash.replace(/^#/,""))}function Hr(e){return e==="PASSWORD_RECOVERY"||fa()}const ma=({children:e})=>{const[t,r]=g.useState(null),[n,i]=g.useState(null),[s,o]=g.useState(!1),[c,l]=g.useState(!0),d=g.useCallback(()=>{r(null),i(null),o(!1),l(!1)},[]),u=g.useCallback(()=>{d(),window.setTimeout(()=>{B.auth.signOut({scope:"local"}).catch(()=>{})},0)},[d]),h=g.useCallback(async f=>{const A=pa(f);try{const{data:y,error:k}=await B.from("profiles").select("id, username, display_name, bio, avatar_url, banner_url, location, socials, created_at").eq("id",f.id).maybeSingle();if(k)throw k;if(y)i(y);else{const w=ir(A.username.charCodeAt(0)).url,{data:E,error:C}=await B.from("profiles").insert({id:f.id,username:A.username,display_name:A.display_name,avatar_url:w}).select("id, username, display_name, bio, avatar_url, banner_url, location, socials, created_at").maybeSingle();if(C&&C.code!=="23505")throw C;if(E)i(E);else{const{data:O,error:L}=await B.from("profiles").select("id, username, display_name, bio, avatar_url, banner_url, location, socials, created_at").eq("id",f.id).maybeSingle();if(L)throw L;i(O||{...A,avatar_url:w})}}}catch(y){console.error("fetchProfile error:",y),i({...A,avatar_url:ir(A.username.charCodeAt(0)).url})}finally{l(!1)}},[]);g.useEffect(()=>{if(!nr){l(!1);return}let f=!0,A=0;const y=async(w,E="")=>{var le,ie,we;const C=++A;if(!f)return;const O=(w==null?void 0:w.user)||null;if(!O){r(null),i(null),o(!1),l(!1);return}if(Ne(O)&&!Hr(E)){u();return}const{data:L,error:T}=await B.auth.getUser(w==null?void 0:w.access_token);if(!f||C!==A)return;const q=(L==null?void 0:L.user)||null;if(T&&(((le=T.message)==null?void 0:le.includes("Failed to fetch"))||((ie=T.message)==null?void 0:ie.includes("NetworkError"))||((we=T.message)==null?void 0:we.includes("timeout"))||T.code==="network_request_failed")&&O){r(O),h(O);return}if(T||!q||q.id!==O.id||Ne(q)&&!Hr(E)){u();return}l(!0),r(q),q?(h(q),B.rpc("is_admin").then(({data:Se})=>{f&&o(!!Se)}).catch(()=>{f&&o(!1)})):(i(null),o(!1),l(!1))};B.auth.getSession().then(({data:{session:w}})=>{y(w)});const{data:{subscription:k}}=B.auth.onAuthStateChange((w,E)=>{y(E,w)});return()=>{f=!1,k.unsubscribe()}},[h,u]);const m=g.useCallback(async(f,A,y)=>{var C,O;const k=Ur(y||f.split("@")[0]),{data:w,error:E}=await B.auth.signUp({email:f,password:A,options:{data:{username:k,display_name:k}}});if(E)throw E;if(!((O=(C=w.user)==null?void 0:C.identities)!=null&&O.length))throw new Error("This email is already registered. Try signing in instead.");return w.user&&Ne(w.user)&&w.session&&(d(),await B.auth.signOut({scope:"local"})),{...w,requiresEmailConfirmation:Ne(w.user)}},[d]),b=g.useCallback(async(f,A)=>{var O,L;const{data:y,error:k}=await B.auth.signInWithPassword({email:f,password:A});if(k)throw d(),await B.auth.signOut({scope:"local"}),k;if(y.user&&Ne(y.user))throw d(),await B.auth.signOut({scope:"local"}),new Error("Please verify your email address before signing in. Check your inbox for the confirmation link.");const{data:w,error:E}=await B.auth.getUser((O=y.session)==null?void 0:O.access_token),C=(w==null?void 0:w.user)||null;if(E||!C||C.id!==((L=y.user)==null?void 0:L.id)||Ne(C))throw d(),await B.auth.signOut({scope:"local"}),new Error("Your account must be verified before signing in.");return{...y,user:C}},[d]),S=g.useCallback(async()=>{try{await B.auth.signOut({scope:"local"})}catch{}try{localStorage.removeItem("aniraku-bookmarks"),localStorage.removeItem("aniraku-watch-history"),localStorage.removeItem("aniraku-episode-track"),localStorage.removeItem("aniraku-nsfw-enabled")}catch{}r(null),i(null),o(!1)},[]),j=g.useCallback(async f=>{var w,E;if(!t)return;const{id:A,...y}=f;y.username&&(y.username=Ur(y.username));const{error:k}=await B.from("profiles").update(y).eq("id",t.id);if(k)throw k;if(y.username||y.display_name){const{error:C}=await B.auth.updateUser({data:{username:y.username||((w=t.user_metadata)==null?void 0:w.username),display_name:y.display_name||((E=t.user_metadata)==null?void 0:E.display_name)}});if(C)throw C}i(C=>({...C,...y}))},[t]),v=g.useMemo(()=>({user:t,profile:n,isAdmin:s,loading:c,signUp:m,signIn:b,signOut:S,updateProfile:j,isSupabaseConfigured:nr}),[t,n,s,c,m,b,S,j]);return a.jsx(qn.Provider,{value:v,children:e})};function ga(e){return typeof e=="string"?e:typeof e=="number"?String(e):!e||typeof e!="object"||Array.isArray(e)?"":[e.userPreferred,e.english,e.romaji,e.native,e.title].find(r=>typeof r=="string"&&r.trim())||""}function ct(e){return ga(e).toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").slice(0,60).replace(/^-|-$/g,"")}function ld(e){if(!e)return null;const t=String(e);if(/^\d+$/.test(t))return parseInt(t,10);const r=t.lastIndexOf("-");if(r===-1)return/^\d+$/.test(t)?parseInt(t,10):null;const n=t.slice(r+1);return/^\d+$/.test(n)?parseInt(n,10):null}const U="https://www.aniraku.tech";function ze(e){document.title=e;const t=document.querySelector("title");t&&(t.textContent=e)}function X(e,t){let r=document.querySelector(`meta[name="${e}"]`);r||(r=document.createElement("meta"),r.setAttribute("name",e),document.head.appendChild(r)),r.setAttribute("content",t)}function M(e,t){let r=document.querySelector(`meta[property="${e}"]`);r||(r=document.createElement("meta"),r.setAttribute("property",e),document.head.appendChild(r)),r.setAttribute("content",t)}function Qe(e){const t=`${U}${e}`,r=document.getElementById("canonical-link")||document.querySelector('link[rel="canonical"]');r&&(r.href=t)}function Vn(e){document.querySelectorAll('script[data-aniraku-seo="true"]').forEach(r=>r.remove()),!(!e||e.length===0)&&e.forEach(r=>{const n=document.createElement("script");n.type="application/ld+json",n.setAttribute("data-aniraku-seo","true"),n.textContent=JSON.stringify(r),document.head.appendChild(n)})}function xa(){ze("Aniraku — Free Anime Streaming | Watch Sub & Dub Online"),X("description","Watch anime online for free on Aniraku. Stream the latest anime episodes in HD with subtitles and dubs. Browse top airing, most popular, and trending anime series and movies."),X("keywords","anime, anime streaming, watch anime free, anime online, anime sub, anime dub, anime HD, free anime streaming, aniraku, anime catalog, anime schedule, top anime, popular anime, airing anime, anime movies, anime series"),X("robots","index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"),Qe("/"),M("og:title","Aniraku — Free Anime Streaming | Watch Sub & Dub Online"),M("og:description","Watch anime online for free on Aniraku. Stream the latest anime episodes in HD with subtitles and dubs."),M("og:url",`${U}/`),M("og:type","website"),M("og:image",`${U}/og-image.png`),M("twitter:title","Aniraku — Free Anime Streaming | Watch Sub & Dub Online"),M("twitter:description","Watch anime online for free on Aniraku. Stream the latest anime episodes in HD with subtitles and dubs."),M("twitter:url",`${U}/`)}function ud(e){var m,b,S,j,v,f,A,y,k,w;if(!e)return;const t=((m=e.title)==null?void 0:m.english)||((b=e.title)==null?void 0:b.romaji)||"Unknown Anime",r=ct(t),n=(e.description||"").replace(/<[^>]*>/g,"").slice(0,280),i=e.format||"TV",s=e.episodes||"",o=(e.genres||[]).join(", "),c=/^\d{4}-\d{2}-\d{2}$/.test(((S=e.startDate)==null?void 0:S.fuzzy)||"")?e.startDate.fuzzy:"";ze(`${t} — Watch ${i} Online Free | Aniraku`),X("description",`Watch ${t} online for free on Aniraku. ${i}${s?` · ${s} episodes`:""}${o?` · ${o}`:""}. Stream in HD with subtitles and dub.`),X("keywords",`${t}, watch ${t}, ${t} streaming, ${t} online free, ${t} sub, ${t} dub, ${i} anime, ${o}, anime streaming, aniraku`),X("robots","index, follow, max-image-preview:large");const l=`/anime/${r}-${e.id}`;Qe(l),M("og:title",`${t} — Watch ${i} Online Free | Aniraku`),M("og:description",`${n||`Watch ${t} online for free.`}`),M("og:url",`${U}${l}`),M("og:type","video.tv_show"),M("og:image",((j=e.coverImage)==null?void 0:j.large)||((v=e.coverImage)==null?void 0:v.medium)||`${U}/og-image.png`),M("og:image:width","500"),M("og:image:height","750"),M("twitter:title",`${t} — Watch ${i} Online Free`),M("twitter:description",`${n||`Watch ${t} online for free.`}`),M("twitter:url",`${U}${l}`),M("twitter:image",((f=e.coverImage)==null?void 0:f.medium)||`${U}/og-image.png`);const u={"@context":"https://schema.org","@type":i==="MOVIE"?"Movie":"TVSeries",name:t,url:`${U}${l}`,description:n||`Watch ${t} online for free on Aniraku.`,image:((A=e.coverImage)==null?void 0:A.large)||((y=e.coverImage)==null?void 0:y.medium)||`${U}/og-image.png`,genre:e.genres||[],...c?{datePublished:c}:{},startDate:((k=e.startDate)==null?void 0:k.fuzzy)||"",endDate:((w=e.endDate)==null?void 0:w.fuzzy)||"",numberOfEpisodes:e.episodes||0,inLanguage:"Japanese",contentRating:"PG-13",provider:{"@type":"Organization",name:"Aniraku",url:U},isPartOf:{"@type":"WebSite",name:"Aniraku",url:U}},h={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:`${U}/`},{"@type":"ListItem",position:2,name:"Catalog",item:`${U}/catalog`},{"@type":"ListItem",position:3,name:t}]};Vn([u,h])}function dd(e,t){var l,d,u,h,m,b,S;if(!e)return;const r=((l=e.title)==null?void 0:l.english)||((d=e.title)==null?void 0:d.romaji)||"Unknown Anime",n=t||1;(e.description||"").replace(/<[^>]*>/g,"").slice(0,280),ze(`Watch ${r} Episode ${n} Online Free — Aniraku`),X("description",`Watch ${r} Episode ${n} online for free on Aniraku. Stream in HD with subtitles and dub support.`),X("keywords",`${r}, ${r} episode ${n}, watch ${r} episode ${n} online, ${r} streaming, anime streaming, watch anime free, aniraku`),X("robots","index, follow");const i=ct(r),s=`/watch/${i}-${e.id}-episode-${n}`;Qe(s),M("og:title",`Watch ${r} Episode ${n} Online Free — Aniraku`),M("og:description",`Watch ${r} Episode ${n} online for free. Stream in HD with subtitles and dub support.`),M("og:url",`${U}${s}`),M("og:type","video.episode"),M("og:image",((u=e.coverImage)==null?void 0:u.large)||((h=e.coverImage)==null?void 0:h.medium)||`${U}/og-image.png`),M("og:image:width","500"),M("og:image:height","750"),M("twitter:title",`Watch ${r} Episode ${n} Online Free`),M("twitter:description",`Watch ${r} Episode ${n} online for free. Stream in HD with subtitles and dub support.`),M("twitter:url",`${U}${s}`),M("twitter:image",((m=e.coverImage)==null?void 0:m.medium)||`${U}/og-image.png`);const o={"@context":"https://schema.org","@type":"VideoObject",name:`${r} — Episode ${n}`,description:`Watch ${r} Episode ${n} online on Aniraku. Free anime streaming with subtitles and dub support.`,thumbnailUrl:((b=e.coverImage)==null?void 0:b.large)||((S=e.coverImage)==null?void 0:S.medium)||`${U}/og-image.png`,...e.duration?{duration:`PT${e.duration}M`}:{},interactionStatistic:{"@type":"InteractionCounter",interactionType:"https://schema.org/WatchAction"},provider:{"@type":"Organization",name:"Aniraku",url:U},isPartOf:{"@type":"TVSeries",name:r,url:`${U}/anime/${i}-${e.id}`}},c={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:`${U}/`},{"@type":"ListItem",position:2,name:"Catalog",item:`${U}/catalog`},{"@type":"ListItem",position:3,name:r,item:`${U}/anime/${i}-${e.id}`},{"@type":"ListItem",position:4,name:`Episode ${n}`}]};Vn([o,c])}function hd(e){const t=e.get("genre"),r=e.get("format"),n=e.get("status"),i=e.get("sort"),s=e.get("search");e.get("page");let o="Anime Catalog — Browse & Watch Free | Aniraku",c="Browse the complete anime catalog on Aniraku. Watch anime online for free with subtitles and dubs.",l="anime catalog, browse anime, anime streaming, watch anime free, aniraku";t?(o=`${t} Anime — Watch Free Online | Aniraku`,c=`Browse and watch ${t} anime online for free on Aniraku. Stream the best ${t.toLowerCase()} anime series and movies in HD.`,l=`${t}, ${t} anime, watch ${t} anime, ${t} anime online, ${t} anime streaming, anime catalog, aniraku`):r==="MOVIE"?(o="Anime Movies — Watch Free Online | Aniraku",c="Browse and watch anime movies online for free on Aniraku. Stream the best anime films in HD.",l="anime movies, watch anime movies, anime films, anime movies online free, aniraku"):r==="TV"?(o="Anime TV Series — Watch Free Online | Aniraku",c="Browse and watch anime TV series online for free on Aniraku.",l="anime tv series, anime shows, watch anime series, anime series online free, aniraku"):n==="RELEASING"?(o="Airing Anime — Currently Airing This Season | Aniraku",c="Check what anime is currently airing this season on Aniraku. Watch the latest episodes in HD.",l="airing anime, currently airing anime, anime this season, new anime episodes, aniraku"):i==="POPULARITY_DESC"?(o="Most Popular Anime — Top Anime of All Time | Aniraku",c="Discover the most popular anime of all time on Aniraku. Browse top-rated anime series and movies.",l="popular anime, top anime, best anime, most popular anime series, aniraku"):i==="SCORE_DESC"?(o="Top Rated Anime — Highest Scored Anime | Aniraku",c="Browse the highest rated anime on Aniraku. Watch the best anime series and movies ranked by score.",l="top rated anime, highest rated anime, best anime, anime rankings, aniraku"):s&&(o=`Search: ${s} — Anime Results | Aniraku`,c=`Search results for "${s}" on Aniraku. Find and watch anime online for free.`,l=`${s}, anime search, ${s} anime, watch anime, aniraku`),ze(o),X("description",c),X("keywords",l),X("robots","index, follow");const d=window.location.pathname+window.location.search;Qe(d),M("og:title",o),M("og:description",c),M("og:url",`${U}${d}`),M("og:type","website"),M("twitter:title",o),M("twitter:description",c)}function pd(){ze("Anime Airing Schedule — What's On This Season | Aniraku"),X("description","Check the latest anime airing schedule on Aniraku. Find out what anime episodes are airing today and this season."),X("keywords","anime schedule, anime airing, anime calendar, what anime is airing, anime today, anime this season, aniraku"),X("robots","index, follow"),Qe("/schedule"),M("og:title","Anime Airing Schedule — What's On This Season | Aniraku"),M("og:description","Check the latest anime airing schedule on Aniraku."),M("og:url",`${U}/schedule`),M("og:type","website")}function fd(e,t){ze(`${e} | Aniraku`),X("description",`${e} page for Aniraku — Free Anime Streaming Platform.`),X("robots","index, follow"),Qe(t),M("og:title",`${e} | Aniraku`),M("og:description",`${e} page for Aniraku.`),M("og:url",`${U}${t}`),M("og:type","website")}var Wn={color:void 0,size:void 0,className:void 0,style:void 0,attr:void 0},qr=ye.createContext&&ye.createContext(Wn),ba=["attr","size","title"];function ya(e,t){if(e==null)return{};var r,n,i=va(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(n=0;n<s.length;n++)r=s[n],t.indexOf(r)===-1&&{}.propertyIsEnumerable.call(e,r)&&(i[r]=e[r])}return i}function va(e,t){if(e==null)return{};var r={};for(var n in e)if({}.hasOwnProperty.call(e,n)){if(t.indexOf(n)!==-1)continue;r[n]=e[n]}return r}function Et(){return Et=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)({}).hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e},Et.apply(null,arguments)}function Vr(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(i){return Object.getOwnPropertyDescriptor(e,i).enumerable})),r.push.apply(r,n)}return r}function jt(e){for(var t=1;t<arguments.length;t++){var r=arguments[t]!=null?arguments[t]:{};t%2?Vr(Object(r),!0).forEach(function(n){wa(e,n,r[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):Vr(Object(r)).forEach(function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(r,n))})}return e}function wa(e,t,r){return(t=Sa(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function Sa(e){var t=Aa(e,"string");return typeof t=="symbol"?t:t+""}function Aa(e,t){if(typeof e!="object"||!e)return e;var r=e[Symbol.toPrimitive];if(r!==void 0){var n=r.call(e,t);if(typeof n!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function Qn(e){return e&&e.map((t,r)=>ye.createElement(t.tag,jt({key:r},t.attr),Qn(t.child)))}function P(e){return t=>ye.createElement(Ea,Et({attr:jt({},e.attr)},t),Qn(e.child))}function Ea(e){var t=r=>{var n=e.attr,i=e.size,s=e.title,o=ya(e,ba),c=i||r.size||"1em",l;return r.className&&(l=r.className),e.className&&(l=(l?l+" ":"")+e.className),ye.createElement("svg",Et({stroke:"currentColor",fill:"currentColor",strokeWidth:"0"},r.attr,n,o,{className:l,style:jt(jt({color:e.color||r.color},r.style),e.style),height:c,width:c,xmlns:"http://www.w3.org/2000/svg"}),s&&ye.createElement("title",null,s),e.children)};return qr!==void 0?ye.createElement(qr.Consumer,null,r=>t(r)):t(Wn)}function Wr(e){return P({attr:{viewBox:"0 0 496 512"},child:[{tag:"path",attr:{d:"M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"},child:[]}]})(e)}function Qr(e){return P({attr:{viewBox:"0 0 640 512"},child:[{tag:"path",attr:{d:"M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"},child:[]}]})(e)}function Kr(e){return P({attr:{viewBox:"0 0 576 512"},child:[{tag:"path",attr:{d:"M420.55,301.93a24,24,0,1,1,24-24,24,24,0,0,1-24,24m-265.1,0a24,24,0,1,1,24-24,24,24,0,0,1-24,24m273.7-144.48,47.94-83a10,10,0,1,0-17.27-10h0l-48.54,84.07a301.25,301.25,0,0,0-246.56,0L116.18,64.45a10,10,0,1,0-17.27,10h0l47.94,83C64.53,202.22,8.24,285.55,0,384H576c-8.24-98.45-64.54-181.78-146.85-226.55"},child:[]}]})(e)}function md(e){return P({attr:{viewBox:"0 0 640 512"},child:[{tag:"path",attr:{d:"M634.91 154.88C457.74-8.99 182.19-8.93 5.09 154.88c-6.66 6.16-6.79 16.59-.35 22.98l34.24 33.97c6.14 6.1 16.02 6.23 22.4.38 145.92-133.68 371.3-133.71 517.25 0 6.38 5.85 16.26 5.71 22.4-.38l34.24-33.97c6.43-6.39 6.3-16.82-.36-22.98zM320 352c-35.35 0-64 28.65-64 64s28.65 64 64 64 64-28.65 64-64-28.65-64-64-64zm202.67-83.59c-115.26-101.93-290.21-101.82-405.34 0-6.9 6.1-7.12 16.69-.57 23.15l34.44 33.99c6 5.92 15.66 6.32 22.05.8 83.95-72.57 209.74-72.41 293.49 0 6.39 5.52 16.05 5.13 22.05-.8l34.44-33.99c6.56-6.46 6.33-17.06-.56-23.15z"},child:[]}]})(e)}function ja(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"},child:[]}]})(e)}function gd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M304.083 405.907c4.686 4.686 4.686 12.284 0 16.971l-44.674 44.674c-59.263 59.262-155.693 59.266-214.961 0-59.264-59.265-59.264-155.696 0-214.96l44.675-44.675c4.686-4.686 12.284-4.686 16.971 0l39.598 39.598c4.686 4.686 4.686 12.284 0 16.971l-44.675 44.674c-28.072 28.073-28.072 73.75 0 101.823 28.072 28.072 73.75 28.073 101.824 0l44.674-44.674c4.686-4.686 12.284-4.686 16.971 0l39.597 39.598zm-56.568-260.216c4.686 4.686 12.284 4.686 16.971 0l44.674-44.674c28.072-28.075 73.75-28.073 101.824 0 28.072 28.073 28.072 73.75 0 101.823l-44.675 44.674c-4.686 4.686-4.686 12.284 0 16.971l39.598 39.598c4.686 4.686 12.284 4.686 16.971 0l44.675-44.675c59.265-59.265 59.265-155.695 0-214.96-59.266-59.264-155.695-59.264-214.961 0l-44.674 44.674c-4.686 4.686-4.686 12.284 0 16.971l39.597 39.598zm234.828 359.28l22.627-22.627c9.373-9.373 9.373-24.569 0-33.941L63.598 7.029c-9.373-9.373-24.569-9.373-33.941 0L7.029 29.657c-9.373 9.373-9.373 24.569 0 33.941l441.373 441.373c9.373 9.372 24.569 9.372 33.941 0z"},child:[]}]})(e)}function xd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M212.333 224.333H12c-6.627 0-12-5.373-12-12V12C0 5.373 5.373 0 12 0h48c6.627 0 12 5.373 12 12v78.112C117.773 39.279 184.26 7.47 258.175 8.007c136.906.994 246.448 111.623 246.157 248.532C504.041 393.258 393.12 504 256.333 504c-64.089 0-122.496-24.313-166.51-64.215-5.099-4.622-5.334-12.554-.467-17.42l33.967-33.967c4.474-4.474 11.662-4.717 16.401-.525C170.76 415.336 211.58 432 256.333 432c97.268 0 176-78.716 176-176 0-97.267-78.716-176-176-176-58.496 0-110.28 28.476-142.274 72.333h98.274c6.627 0 12 5.373 12 12v48c0 6.627-5.373 12-12 12z"},child:[]}]})(e)}function Ra(e){return P({attr:{viewBox:"0 0 640 512"},child:[{tag:"path",attr:{d:"M592 0H48A48 48 0 0 0 0 48v320a48 48 0 0 0 48 48h240v32H112a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H352v-32h240a48 48 0 0 0 48-48V48a48 48 0 0 0-48-48zm-16 352H64V64h512z"},child:[]}]})(e)}function bd(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"},child:[]}]})(e)}function Kn(e){return P({attr:{viewBox:"0 0 352 512"},child:[{tag:"path",attr:{d:"M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"},child:[]}]})(e)}function yd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M104 224H24c-13.255 0-24 10.745-24 24v240c0 13.255 10.745 24 24 24h80c13.255 0 24-10.745 24-24V248c0-13.255-10.745-24-24-24zM64 472c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zM384 81.452c0 42.416-25.97 66.208-33.277 94.548h101.723c33.397 0 59.397 27.746 59.553 58.098.084 17.938-7.546 37.249-19.439 49.197l-.11.11c9.836 23.337 8.237 56.037-9.308 79.469 8.681 25.895-.069 57.704-16.382 74.757 4.298 17.598 2.244 32.575-6.148 44.632C440.202 511.587 389.616 512 346.839 512l-2.845-.001c-48.287-.017-87.806-17.598-119.56-31.725-15.957-7.099-36.821-15.887-52.651-16.178-6.54-.12-11.783-5.457-11.783-11.998v-213.77c0-3.2 1.282-6.271 3.558-8.521 39.614-39.144 56.648-80.587 89.117-113.111 14.804-14.832 20.188-37.236 25.393-58.902C282.515 39.293 291.817 0 312 0c24 0 72 8 72 81.452z"},child:[]}]})(e)}function Gr(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M296 32h192c13.255 0 24 10.745 24 24v160c0 13.255-10.745 24-24 24H296c-13.255 0-24-10.745-24-24V56c0-13.255 10.745-24 24-24zm-80 0H24C10.745 32 0 42.745 0 56v160c0 13.255 10.745 24 24 24h192c13.255 0 24-10.745 24-24V56c0-13.255-10.745-24-24-24zM0 296v160c0 13.255 10.745 24 24 24h192c13.255 0 24-10.745 24-24V296c0-13.255-10.745-24-24-24H24c-13.255 0-24 10.745-24 24zm296 184h192c13.255 0 24-10.745 24-24V296c0-13.255-10.745-24-24-24H296c-13.255 0-24 10.745-24 24v160c0 13.255 10.745 24 24 24z"},child:[]}]})(e)}function vd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M440.65 12.57l4 82.77A247.16 247.16 0 0 0 255.83 8C134.73 8 33.91 94.92 12.29 209.82A12 12 0 0 0 24.09 224h49.05a12 12 0 0 0 11.67-9.26 175.91 175.91 0 0 1 317-56.94l-101.46-4.86a12 12 0 0 0-12.57 12v47.41a12 12 0 0 0 12 12H500a12 12 0 0 0 12-12V12a12 12 0 0 0-12-12h-47.37a12 12 0 0 0-11.98 12.57zM255.83 432a175.61 175.61 0 0 1-146-77.8l101.8 4.87a12 12 0 0 0 12.57-12v-47.4a12 12 0 0 0-12-12H12a12 12 0 0 0-12 12V500a12 12 0 0 0 12 12h47.35a12 12 0 0 0 12-12.6l-4.15-82.57A247.17 247.17 0 0 0 255.83 504c121.11 0 221.93-86.92 243.55-201.82a12 12 0 0 0-11.8-14.18h-49.05a12 12 0 0 0-11.67 9.26A175.86 175.86 0 0 1 255.83 432z"},child:[]}]})(e)}function wd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M370.72 133.28C339.458 104.008 298.888 87.962 255.848 88c-77.458.068-144.328 53.178-162.791 126.85-1.344 5.363-6.122 9.15-11.651 9.15H24.103c-7.498 0-13.194-6.807-11.807-14.176C33.933 94.924 134.813 8 256 8c66.448 0 126.791 26.136 171.315 68.685L463.03 40.97C478.149 25.851 504 36.559 504 57.941V192c0 13.255-10.745 24-24 24H345.941c-21.382 0-32.09-25.851-16.971-40.971l41.75-41.749zM32 296h134.059c21.382 0 32.09 25.851 16.971 40.971l-41.75 41.75c31.262 29.273 71.835 45.319 114.876 45.28 77.418-.07 144.315-53.144 162.787-126.849 1.344-5.363 6.122-9.15 11.651-9.15h57.304c7.498 0 13.194 6.807 11.807 14.176C478.067 417.076 377.187 504 256 504c-66.448 0-126.791-26.136-171.315-68.685L48.97 471.03C33.851 486.149 8 475.441 8 454.059V320c0-13.255 10.745-24 24-24z"},child:[]}]})(e)}function Sd(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M384 44v424c0 6.6-5.4 12-12 12h-48c-6.6 0-12-5.4-12-12V291.6l-195.5 181C95.9 489.7 64 475.4 64 448V64c0-27.4 31.9-41.7 52.5-24.6L312 219.3V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12z"},child:[]}]})(e)}function Ad(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M64 468V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12v176.4l195.5-181C352.1 22.3 384 36.6 384 64v384c0 27.4-31.9 41.7-52.5 24.6L136 292.7V468c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12z"},child:[]}]})(e)}function ka(e){return P({attr:{viewBox:"0 0 576 512"},child:[{tag:"path",attr:{d:"M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"},child:[]}]})(e)}function Ed(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"},child:[]}]})(e)}function jd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M304 416h-64a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm-128-64h-48V48a16 16 0 0 0-16-16H80a16 16 0 0 0-16 16v304H16c-14.19 0-21.37 17.24-11.29 27.31l80 96a16 16 0 0 0 22.62 0l80-96C197.35 369.26 190.22 352 176 352zm256-192H240a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h192a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm-64 128H240a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM496 32H240a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h256a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z"},child:[]}]})(e)}function Rd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M496 384H160v-16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h80v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h336c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-160h-80v-16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h336v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h80c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-160H288V48c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16C7.2 64 0 71.2 0 80v32c0 8.8 7.2 16 16 16h208v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h208c8.8 0 16-7.2 16-16V80c0-8.8-7.2-16-16-16z"},child:[]}]})(e)}function kd(e){return P({attr:{viewBox:"0 0 640 512"},child:[{tag:"path",attr:{d:"M216 288h-48c-8.84 0-16 7.16-16 16v192c0 8.84 7.16 16 16 16h48c8.84 0 16-7.16 16-16V304c0-8.84-7.16-16-16-16zM88 384H40c-8.84 0-16 7.16-16 16v96c0 8.84 7.16 16 16 16h48c8.84 0 16-7.16 16-16v-96c0-8.84-7.16-16-16-16zm256-192h-48c-8.84 0-16 7.16-16 16v288c0 8.84 7.16 16 16 16h48c8.84 0 16-7.16 16-16V208c0-8.84-7.16-16-16-16zm128-96h-48c-8.84 0-16 7.16-16 16v384c0 8.84 7.16 16 16 16h48c8.84 0 16-7.16 16-16V112c0-8.84-7.16-16-16-16zM600 0h-48c-8.84 0-16 7.16-16 16v480c0 8.84 7.16 16 16 16h48c8.84 0 16-7.16 16-16V16c0-8.84-7.16-16-16-16z"},child:[]}]})(e)}function Cd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z"},child:[]}]})(e)}function Od(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z"},child:[]}]})(e)}function Gn(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"},child:[]}]})(e)}function Pd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M8.309 189.836L184.313 37.851C199.719 24.546 224 35.347 224 56.015v80.053c160.629 1.839 288 34.032 288 186.258 0 61.441-39.581 122.309-83.333 154.132-13.653 9.931-33.111-2.533-28.077-18.631 45.344-145.012-21.507-183.51-176.59-185.742V360c0 20.7-24.3 31.453-39.687 18.164l-176.004-152c-11.071-9.562-11.086-26.753 0-36.328z"},child:[]}]})(e)}function _d(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M500.33 0h-47.41a12 12 0 0 0-12 12.57l4 82.76A247.42 247.42 0 0 0 256 8C119.34 8 7.9 119.53 8 256.19 8.1 393.07 119.1 504 256 504a247.1 247.1 0 0 0 166.18-63.91 12 12 0 0 0 .48-17.43l-34-34a12 12 0 0 0-16.38-.55A176 176 0 1 1 402.1 157.8l-101.53-4.87a12 12 0 0 0-12.57 12v47.41a12 12 0 0 0 12 12h200.33a12 12 0 0 0 12-12V12a12 12 0 0 0-12-12z"},child:[]}]})(e)}function Ar(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M504.971 359.029c9.373 9.373 9.373 24.569 0 33.941l-80 79.984c-15.01 15.01-40.971 4.49-40.971-16.971V416h-58.785a12.004 12.004 0 0 1-8.773-3.812l-70.556-75.596 53.333-57.143L352 336h32v-39.981c0-21.438 25.943-31.998 40.971-16.971l80 79.981zM12 176h84l52.781 56.551 53.333-57.143-70.556-75.596A11.999 11.999 0 0 0 122.785 96H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12zm372 0v39.984c0 21.46 25.961 31.98 40.971 16.971l80-79.984c9.373-9.373 9.373-24.569 0-33.941l-80-79.981C409.943 24.021 384 34.582 384 56.019V96h-58.785a12.004 12.004 0 0 0-8.773 3.812L96 336H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h110.785c3.326 0 6.503-1.381 8.773-3.812L352 176h32z"},child:[]}]})(e)}function Ca(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"},child:[]}]})(e)}function Id(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z"},child:[]}]})(e)}function Td(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"},child:[]}]})(e)}function Ld(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M326.612 185.391c59.747 59.809 58.927 155.698.36 214.59-.11.12-.24.25-.36.37l-67.2 67.2c-59.27 59.27-155.699 59.262-214.96 0-59.27-59.26-59.27-155.7 0-214.96l37.106-37.106c9.84-9.84 26.786-3.3 27.294 10.606.648 17.722 3.826 35.527 9.69 52.721 1.986 5.822.567 12.262-3.783 16.612l-13.087 13.087c-28.026 28.026-28.905 73.66-1.155 101.96 28.024 28.579 74.086 28.749 102.325.51l67.2-67.19c28.191-28.191 28.073-73.757 0-101.83-3.701-3.694-7.429-6.564-10.341-8.569a16.037 16.037 0 0 1-6.947-12.606c-.396-10.567 3.348-21.456 11.698-29.806l21.054-21.055c5.521-5.521 14.182-6.199 20.584-1.731a152.482 152.482 0 0 1 20.522 17.197zM467.547 44.449c-59.261-59.262-155.69-59.27-214.96 0l-67.2 67.2c-.12.12-.25.25-.36.37-58.566 58.892-59.387 154.781.36 214.59a152.454 152.454 0 0 0 20.521 17.196c6.402 4.468 15.064 3.789 20.584-1.731l21.054-21.055c8.35-8.35 12.094-19.239 11.698-29.806a16.037 16.037 0 0 0-6.947-12.606c-2.912-2.005-6.64-4.875-10.341-8.569-28.073-28.073-28.191-73.639 0-101.83l67.2-67.19c28.239-28.239 74.3-28.069 102.325.51 27.75 28.3 26.872 73.934-1.155 101.96l-13.087 13.087c-4.35 4.35-5.769 10.79-3.783 16.612 5.864 17.194 9.042 34.999 9.69 52.721.509 13.906 17.454 20.446 27.294 10.606l37.106-37.106c59.271-59.259 59.271-155.699.001-214.959z"},child:[]}]})(e)}function Md(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M12.41 148.02l232.94 105.67c6.8 3.09 14.49 3.09 21.29 0l232.94-105.67c16.55-7.51 16.55-32.52 0-40.03L266.65 2.31a25.607 25.607 0 0 0-21.29 0L12.41 107.98c-16.55 7.51-16.55 32.53 0 40.04zm487.18 88.28l-58.09-26.33-161.64 73.27c-7.56 3.43-15.59 5.17-23.86 5.17s-16.29-1.74-23.86-5.17L70.51 209.97l-58.1 26.33c-16.55 7.5-16.55 32.5 0 40l232.94 105.59c6.8 3.08 14.49 3.08 21.29 0L499.59 276.3c16.55-7.5 16.55-32.5 0-40zm0 127.8l-57.87-26.23-161.86 73.37c-7.56 3.43-15.59 5.17-23.86 5.17s-16.29-1.74-23.86-5.17L70.29 337.87 12.41 364.1c-16.55 7.5-16.55 32.5 0 40l232.94 105.59c6.8 3.08 14.49 3.08 21.29 0L499.59 404.1c16.55-7.5 16.55-32.5 0-40z"},child:[]}]})(e)}function Dd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M512 176.001C512 273.203 433.202 352 336 352c-11.22 0-22.19-1.062-32.827-3.069l-24.012 27.014A23.999 23.999 0 0 1 261.223 384H224v40c0 13.255-10.745 24-24 24h-40v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24v-78.059c0-6.365 2.529-12.47 7.029-16.971l161.802-161.802C163.108 213.814 160 195.271 160 176 160 78.798 238.797.001 335.999 0 433.488-.001 512 78.511 512 176.001zM336 128c0 26.51 21.49 48 48 48s48-21.49 48-48-21.49-48-48-48-48 21.49-48 48z"},child:[]}]})(e)}function zd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"},child:[]}]})(e)}function ar(e){return P({attr:{viewBox:"0 0 576 512"},child:[{tag:"path",attr:{d:"M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"},child:[]}]})(e)}function Fd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M504 255.531c.253 136.64-111.18 248.372-247.82 248.468-59.015.042-113.223-20.53-155.822-54.911-11.077-8.94-11.905-25.541-1.839-35.607l11.267-11.267c8.609-8.609 22.353-9.551 31.891-1.984C173.062 425.135 212.781 440 256 440c101.705 0 184-82.311 184-184 0-101.705-82.311-184-184-184-48.814 0-93.149 18.969-126.068 49.932l50.754 50.754c10.08 10.08 2.941 27.314-11.313 27.314H24c-8.837 0-16-7.163-16-16V38.627c0-14.254 17.234-21.393 27.314-11.314l49.372 49.372C129.209 34.136 189.552 8 256 8c136.81 0 247.747 110.78 248 247.531zm-180.912 78.784l9.823-12.63c8.138-10.463 6.253-25.542-4.21-33.679L288 256.349V152c0-13.255-10.745-24-24-24h-16c-13.255 0-24 10.745-24 24v135.651l65.409 50.874c10.463 8.137 25.541 6.253 33.679-4.21z"},child:[]}]})(e)}function Rt(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"},child:[]}]})(e)}function Oa(e){return P({attr:{viewBox:"0 0 496 512"},child:[{tag:"path",attr:{d:"M336.5 160C322 70.7 287.8 8 248 8s-74 62.7-88.5 152h177zM152 256c0 22.2 1.2 43.5 3.3 64h185.3c2.1-20.5 3.3-41.8 3.3-64s-1.2-43.5-3.3-64H155.3c-2.1 20.5-3.3 41.8-3.3 64zm324.7-96c-28.6-67.9-86.5-120.4-158-141.6 24.4 33.8 41.2 84.7 50 141.6h108zM177.2 18.4C105.8 39.6 47.8 92.1 19.3 160h108c8.7-56.9 25.5-107.8 49.9-141.6zM487.4 192H372.7c2.1 21 3.3 42.5 3.3 64s-1.2 43-3.3 64h114.6c5.5-20.5 8.6-41.8 8.6-64s-3.1-43.5-8.5-64zM120 256c0-21.5 1.2-43 3.3-64H8.6C3.2 212.5 0 233.8 0 256s3.2 43.5 8.6 64h114.6c-2-21-3.2-42.5-3.2-64zm39.5 96c14.5 89.3 48.7 152 88.5 152s74-62.7 88.5-152h-177zm159.3 141.6c71.4-21.2 129.4-73.7 158-141.6h-108c-8.8 56.9-25.6 107.8-50 141.6zM19.3 352c28.6 67.9 86.5 120.4 158 141.6-24.4-33.8-41.2-84.7-50-141.6h-108z"},child:[]}]})(e)}function Nd(e){return P({attr:{viewBox:"0 0 384 512"},child:[{tag:"path",attr:{d:"M216 23.86c0-23.8-30.65-32.77-44.15-13.04C48 191.85 224 200 224 288c0 35.63-29.11 64.46-64.85 63.99-35.17-.45-63.15-29.77-63.15-64.94v-85.51c0-21.7-26.47-32.23-41.43-16.5C27.8 213.16 0 261.33 0 320c0 105.87 86.13 192 192 192s192-86.13 192-192c0-170.29-168-193-168-296.14z"},child:[]}]})(e)}function Bd(e){return P({attr:{viewBox:"0 0 576 512"},child:[{tag:"path",attr:{d:"M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"},child:[]}]})(e)}function $d(e){return P({attr:{viewBox:"0 0 640 512"},child:[{tag:"path",attr:{d:"M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"},child:[]}]})(e)}function Yn(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z"},child:[]}]})(e)}function Ud(e){return P({attr:{viewBox:"0 0 576 512"},child:[{tag:"path",attr:{d:"M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"},child:[]}]})(e)}function Pa(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"},child:[]}]})(e)}function _a(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M320 448v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V120c0-13.255 10.745-24 24-24h72v296c0 30.879 25.121 56 56 56h168zm0-344V0H152c-13.255 0-24 10.745-24 24v368c0 13.255 10.745 24 24 24h272c13.255 0 24-10.745 24-24V128H344c-13.2 0-24-10.8-24-24zm120.971-31.029L375.029 7.029A24 24 0 0 0 358.059 0H352v96h96v-6.059a24 24 0 0 0-7.029-16.97z"},child:[]}]})(e)}function Yr(e){return P({attr:{viewBox:"0 0 496 512"},child:[{tag:"path",attr:{d:"M225.38 233.37c-12.5 12.5-12.5 32.76 0 45.25 12.49 12.5 32.76 12.5 45.25 0 12.5-12.5 12.5-32.76 0-45.25-12.5-12.49-32.76-12.49-45.25 0zM248 8C111.03 8 0 119.03 0 256s111.03 248 248 248 248-111.03 248-248S384.97 8 248 8zm126.14 148.05L308.17 300.4a31.938 31.938 0 0 1-15.77 15.77l-144.34 65.97c-16.65 7.61-33.81-9.55-26.2-26.2l65.98-144.35a31.938 31.938 0 0 1 15.77-15.77l144.34-65.97c16.65-7.6 33.8 9.55 26.19 26.2z"},child:[]}]})(e)}function Hd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4 32.7 12.3 69 19.4 107.4 19.4 141.4 0 256-93.1 256-208S397.4 32 256 32zM128 272c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"},child:[]}]})(e)}function Jr(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M256,8C119,8,8,119,8,256S119,504,256,504,504,393,504,256,393,8,256,8Zm92.49,313h0l-20,25a16,16,0,0,1-22.49,2.5h0l-67-49.72a40,40,0,0,1-15-31.23V112a16,16,0,0,1,16-16h32a16,16,0,0,1,16,16V256l58,42.5A16,16,0,0,1,348.49,321Z"},child:[]}]})(e)}function qd(e){return P({attr:{viewBox:"0 0 320 512"},child:[{tag:"path",attr:{d:"M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"},child:[]}]})(e)}function Vd(e){return P({attr:{viewBox:"0 0 320 512"},child:[{tag:"path",attr:{d:"M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z"},child:[]}]})(e)}function Wd(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"},child:[]}]})(e)}function Qd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"},child:[]}]})(e)}function Kd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"},child:[]}]})(e)}function Gd(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm64-192c0-8.8 7.2-16 16-16h96c8.8 0 16 7.2 16 16v96c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16v-96zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z"},child:[]}]})(e)}function Jn(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z"},child:[]}]})(e)}function Yd(e){return P({attr:{viewBox:"0 0 384 512"},child:[{tag:"path",attr:{d:"M0 512V48C0 21.49 21.49 0 48 0h288c26.51 0 48 21.49 48 48v464L192 400 0 512z"},child:[]}]})(e)}function Ia(e){return P({attr:{viewBox:"0 0 320 512"},child:[{tag:"path",attr:{d:"M296 160H180.6l42.6-129.8C227.2 15 215.7 0 200 0H56C44 0 33.8 8.9 32.2 20.8l-32 240C-1.7 275.2 9.5 288 24 288h118.7L96.6 482.5c-3.6 15.2 8 29.5 23.3 29.5 8.4 0 16.4-4.4 20.8-12l176-304c9.3-15.9-2.2-36-20.7-36z"},child:[]}]})(e)}function Ta(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M224 512c35.32 0 63.97-28.65 63.97-64H160.03c0 35.35 28.65 64 63.97 64zm215.39-149.71c-19.32-20.76-55.47-51.99-55.47-154.29 0-77.7-54.48-139.9-127.94-155.16V32c0-17.67-14.32-32-31.98-32s-31.98 14.33-31.98 32v20.84C118.56 68.1 64.08 130.3 64.08 208c0 102.3-36.15 133.53-55.47 154.29-6 6.45-8.66 14.16-8.61 21.71.11 16.4 12.98 32 32.1 32h383.8c19.12 0 32-15.6 32.1-32 .05-7.55-2.61-15.27-8.61-21.71z"},child:[]}]})(e)}function qe(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"},child:[]}]})(e)}function Er(e){return P({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"},child:[]}]})(e)}function Jd(e){return P({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M466.27 286.69C475.04 271.84 480 256 480 236.85c0-44.015-37.218-85.58-85.82-85.58H357.7c4.92-12.81 8.85-28.13 8.85-46.54C366.55 31.936 328.86 0 271.28 0c-61.607 0-58.093 94.933-71.76 108.6-22.747 22.747-49.615 66.447-68.76 83.4H32c-17.673 0-32 14.327-32 32v240c0 17.673 14.327 32 32 32h64c14.893 0 27.408-10.174 30.978-23.95 44.509 1.001 75.06 39.94 177.802 39.94 7.22 0 15.22.01 22.22.01 77.117 0 111.986-39.423 112.94-95.33 13.319-18.425 20.299-43.122 17.34-66.99 9.854-18.452 13.664-40.343 8.99-62.99zm-61.75 53.83c12.56 21.13 1.26 49.41-13.94 57.57 7.7 48.78-17.608 65.9-53.12 65.9h-37.82c-71.639 0-118.029-37.82-171.64-37.82V240h10.92c28.36 0 67.98-70.89 94.54-97.46 28.36-28.36 18.91-75.63 37.82-94.54 47.27 0 47.27 32.98 47.27 56.73 0 39.17-28.36 56.72-28.36 94.54h103.99c21.11 0 37.73 18.91 37.82 37.82.09 18.9-12.82 37.81-22.27 37.81 13.489 14.555 16.371 45.236-5.21 65.62zM88 432c0 13.255-10.745 24-24 24s-24-10.745-24-24 10.745-24 24-24 24 10.745 24 24z"},child:[]}]})(e)}function Xd(e){return P({attr:{viewBox:"0 0 576 512"},child:[{tag:"path",attr:{d:"M480 416v16c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V176c0-26.51 21.49-48 48-48h16v48H54a6 6 0 0 0-6 6v244a6 6 0 0 0 6 6h372a6 6 0 0 0 6-6v-10h48zm42-336H150a6 6 0 0 0-6 6v244a6 6 0 0 0 6 6h372a6 6 0 0 0 6-6V86a6 6 0 0 0-6-6zm6-48c26.51 0 48 21.49 48 48v256c0 26.51-21.49 48-48 48H144c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h384zM264 144c0 22.091-17.909 40-40 40s-40-17.909-40-40 17.909-40 40-40 40 17.909 40 40zm-72 96l39.515-39.515c4.686-4.686 12.284-4.686 16.971 0L288 240l103.515-103.515c4.686-4.686 12.284-4.686 16.971 0L480 208v80H192v-48z"},child:[]}]})(e)}function Zd(e){return P({attr:{viewBox:"0 0 576 512"},child:[{tag:"path",attr:{d:"M288 144a110.94 110.94 0 0 0-31.24 5 55.4 55.4 0 0 1 7.24 27 56 56 0 0 1-56 56 55.4 55.4 0 0 1-27-7.24A111.71 111.71 0 1 0 288 144zm284.52 97.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400c-98.65 0-189.09-55-237.93-144C98.91 167 189.34 112 288 112s189.09 55 237.93 144C477.1 345 386.66 400 288 400z"},child:[]}]})(e)}function e1(e){return P({attr:{viewBox:"0 0 384 512"},child:[{tag:"path",attr:{d:"M336 0H48C21.49 0 0 21.49 0 48v464l192-112 192 112V48c0-26.51-21.49-48-48-48zm0 428.43l-144-84-144 84V54a6 6 0 0 1 6-6h276c3.314 0 6 2.683 6 5.996V428.43z"},child:[]}]})(e)}const N={};N.Nav=x.nav`
  position: ${({$isHome:e})=>e?"fixed":"sticky"};
  inset: 0 0 auto;
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: calc(var(--header-h) + env(safe-area-inset-top, 0px));
  padding: env(safe-area-inset-top, 0px) clamp(16px, 3vw, 40px) 0;
  gap: clamp(10px, 2vw, 24px);
  background: ${({$isScrolled:e,$isHome:t})=>t&&!e?"linear-gradient(180deg, rgba(0,0,0,.78), rgba(0,0,0,0))":"rgba(8,8,10,.92)"};
  border-bottom: 1px solid ${({$isScrolled:e,$isHome:t})=>t&&!e?"transparent":"rgba(255,255,255,.08)"};
  backdrop-filter: ${({$isScrolled:e,$isHome:t})=>e||!t?"blur(18px) saturate(120%)":"none"};
  -webkit-backdrop-filter: ${({$isScrolled:e,$isHome:t})=>e||!t?"blur(18px) saturate(120%)":"none"};
  transition: background var(--transition-normal), border-color var(--transition-normal), backdrop-filter var(--transition-normal);

  @media (max-width: 768px) {
    display: none;
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    padding-inline: 20px;
    gap: 12px;
  }
`;N.Left=x.div`
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.5vw, 16px);
  min-width: 0;
  flex: 1 1 auto;
`;N.SearchForm=x.form`
  display: flex;
  align-items: center;
  gap: 8px;
  width: clamp(170px, 19vw, 280px);
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  background: rgba(255,255,255,.055);
  color: var(--text-muted);
  transition: border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);

  &:focus-within {
    border-color: rgba(255,255,255,.45);
    background: rgba(255,255,255,.08);
    box-shadow: 0 0 0 3px rgba(255,255,255,.06);
  }

  @media (max-width: 900px) { width: min(26vw, 220px); }
  @media (max-width: 768px) { display: none; }
`;N.SearchInput=x.input`
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: .82rem;

  &::placeholder { color: var(--text-muted); }
`;N.NavLinks=x.div`
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;

  @media (max-width: 768px) { display: none; }
`;N.NavLink=x(F)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 9px;
  color: var(--text-secondary);
  font-size: .82rem;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
  transition: color var(--transition-fast), background var(--transition-fast);

  &:hover { color: #fff; background: rgba(255,255,255,.075); }
  &.active { color: #fff; background: rgba(255,255,255,.11); }

  @media (max-width: 1024px) { padding-inline: 9px; }
`;N.Right=x.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
`;N.RightBtn=x.button`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: var(--text-secondary);
  transition: color var(--transition-fast), background var(--transition-fast);

  &:hover { color: #fff; background: rgba(255,255,255,.08); }

  @media (max-width: 768px) { display: none; }
`;N.Divider=x.div`
  width: 1px;
  height: 24px;
  margin: 0 4px;
  background: rgba(255,255,255,.13);
`;N.Avatar=x.img`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255,255,255,.28);
  transition: transform var(--transition-fast), border-color var(--transition-fast);

  &:hover { transform: translateY(-1px); border-color: #fff; }
`;N.SignIn=x.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 15px;
  border-radius: 10px;
  background: var(--accent);
  color: #080808;
  font-size: .82rem;
  font-weight: 800;
  white-space: nowrap;
  transition: transform var(--transition-fast), opacity var(--transition-fast);

  &:hover { transform: translateY(-1px); opacity: .94; }

  @media (min-width: 769px) and (max-width: 900px) { padding-inline: 11px; }
`;const at=({to:e="/",height:t=40,showText:r=!1,style:n={}})=>a.jsx(F,{to:e,style:{display:"inline-flex",alignItems:"center",textDecoration:"none",fontFamily:"'Agbalumo', cursive",...n},"aria-label":"Aniraku home",children:a.jsx("span",{style:{fontSize:t>36?"1.5rem":"1.2rem",fontWeight:800,letterSpacing:1,color:"var(--accent)",fontFamily:"'Agbalumo', cursive"},children:"ANIRAKU"})}),Ve="http://127.0.0.1:43211".replace(/\/$/,""),t1=`${Ve}/api/v1`,Xn=()=>{const[e,t]=g.useState(!1),[r,n]=g.useState([]),[i,s]=g.useState(!1),[o,c]=g.useState(""),l=g.useRef(null),d=g.useRef(null),{user:u,profile:h,isAdmin:m}=Dt(),b=Nn(),S=De(),j=S.pathname==="/",v=["/login","/signup","/auth/forgot-password","/auth/new-password","/privacy","/terms","/dmca","/license","/community-guidelines"].includes(S.pathname),f=g.useRef(null);g.useEffect(()=>{const w=()=>t(window.scrollY>20);return window.addEventListener("scroll",w,{passive:!0}),()=>window.removeEventListener("scroll",w)},[]),g.useEffect(()=>{if(!u)return;const w=async()=>{try{const{data:{session:C}}=await B.auth.getSession();if(!C)return;const O=await fetch(`${Ve}/api/v1/notifications`,{headers:{Authorization:`Bearer ${C.access_token}`}});if(O.ok){const L=await O.json();n(L||[])}}catch(C){console.error("[NavBar] fetchNotifs error:",C)}};w();const E=setInterval(w,3e4);return()=>clearInterval(E)},[u]);const A=async w=>{try{const{data:{session:E}}=await B.auth.getSession();if(!E)return;await fetch(`${Ve}/api/v1/notifications/${w}/read`,{method:"PUT",headers:{Authorization:`Bearer ${E.access_token}`}}),n(C=>C.map(O=>O.id===w?{...O,read:!0}:O))}catch{}};g.useEffect(()=>{const w=E=>{l.current&&!l.current.contains(E.target)&&s(!1)};return document.addEventListener("mousedown",w),document.addEventListener("touchstart",w,{passive:!0}),()=>{document.removeEventListener("mousedown",w),document.removeEventListener("touchstart",w)}},[]),g.useEffect(()=>{const w=E=>{var O,L,T,q,oe,le;const C=(L=(O=E.target)==null?void 0:O.closest)==null?void 0:L.call(O,'input, textarea, select, [contenteditable="true"]');(E.metaKey||E.ctrlKey)&&E.key.toLowerCase()==="k"&&!C&&(f.current=document.activeElement,E.preventDefault(),(T=d.current)==null||T.focus()),E.key==="Escape"&&document.activeElement===d.current&&((q=d.current)==null||q.blur(),(le=(oe=f.current)==null?void 0:oe.focus)==null||le.call(oe))};return window.addEventListener("keydown",w),()=>window.removeEventListener("keydown",w)},[]);const y=r.filter(w=>!w.read).length;if(v)return a.jsxs(N.Nav,{$isScrolled:e,$isHome:!1,"aria-label":"Focused page navigation",children:[a.jsx(N.Left,{children:a.jsx(at,{to:"/",height:32,showText:!0})}),a.jsxs(N.Right,{children:[a.jsx(F,{to:"/",style:{color:"var(--text-secondary)",fontSize:13,fontWeight:750,textDecoration:"none"},children:"Home"}),a.jsx(F,{to:"/dmca",style:{color:"var(--text-secondary)",fontSize:13,fontWeight:750,textDecoration:"none"},children:"Help"})]})]});const k=w=>{w.preventDefault();const E=o.trim();E&&b(`/catalog?search=${encodeURIComponent(E)}`),c("")};return a.jsxs(N.Nav,{$isScrolled:e,$isHome:j,"aria-label":"Primary navigation",children:[a.jsxs(N.Left,{children:[a.jsx(at,{to:"/",height:36,showText:!0}),a.jsxs(N.NavLinks,{children:[a.jsx(N.NavLink,{to:"/",className:S.pathname==="/"?"active":"",children:"Home"}),a.jsx(N.NavLink,{to:"/catalog",className:S.pathname==="/catalog"?"active":"",children:"Catalog"}),a.jsx(N.NavLink,{to:"/schedule",className:S.pathname==="/schedule"?"active":"",children:"Schedule"})]})]}),a.jsxs(N.SearchForm,{onSubmit:k,children:[a.jsx(Gn,{size:13}),a.jsx(N.SearchInput,{ref:d,value:o,onChange:w=>c(w.target.value),placeholder:"Search..."})]}),a.jsxs(N.Right,{children:[a.jsx(N.RightBtn,{type:"button",onClick:()=>b("/random"),title:"Random Anime","aria-label":"Find a random anime",children:a.jsx(Ar,{size:15})}),a.jsx(N.RightBtn,{type:"button",onClick:()=>window.dispatchEvent(new Event("aniraku:open-support")),title:"Support Aniraku","aria-label":"Support Aniraku",children:a.jsx(Rt,{size:14})}),u&&a.jsxs("div",{ref:l,style:{position:"relative"},children:[a.jsxs(N.RightBtn,{type:"button",onClick:()=>s(!i),title:"Notifications","aria-label":"Notifications",style:{position:"relative"},"aria-expanded":i,"aria-controls":"notifications-panel",children:[a.jsx(Ta,{size:15}),y>0&&a.jsx("span",{style:{position:"absolute",top:-2,right:-2,background:"var(--accent)",color:"var(--bg)",fontSize:9,fontWeight:700,borderRadius:"50%",width:15,height:15,display:"flex",alignItems:"center",justifyContent:"center"},children:y>9?"9+":y})]}),i&&a.jsxs("div",{id:"notifications-panel",style:{position:"absolute",top:"100%",right:0,width:300,maxHeight:400,overflowY:"auto",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:1e3,marginTop:8},children:[a.jsx("div",{style:{padding:"12px 16px",borderBottom:"1px solid var(--border)",fontSize:14,fontWeight:600},children:"Notifications"}),r.length===0?a.jsx("div",{style:{padding:24,textAlign:"center",color:"var(--text-muted)",fontSize:13},children:"No notifications yet"}):r.map(w=>a.jsxs("button",{type:"button",onClick:()=>{s(!1),w.read||A(w.id),w.anime_id&&b(`/anime/${w.anime_id}`)},style:{display:"block",width:"100%",textAlign:"left",padding:"10px 16px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:w.read?"transparent":"rgba(var(--accent-rgb, 226,232,240), 0.05)",fontSize:13,color:"var(--text-primary)"},children:[a.jsx("p",{style:{margin:0},children:w.message}),a.jsx("p",{style:{margin:0,marginTop:4,fontSize:11,color:"var(--text-muted)"},children:w.created_at?new Date(w.created_at).toLocaleDateString():""})]},w.id))]})]}),a.jsx(N.Divider,{}),u?a.jsx(F,{to:"/profile",title:(h==null?void 0:h.username)||"Profile",children:h!=null&&h.avatar_url?a.jsx(N.Avatar,{src:ua(h.avatar_url),alt:""}):a.jsx(N.Avatar,{src:ir(((h==null?void 0:h.username)||"u").charCodeAt(0)).url,alt:""})}):a.jsx(F,{to:"/login",style:{textDecoration:"none"},children:a.jsx(N.SignIn,{children:"Sign In"})})]})]})},Zn=x.nav`
  position: fixed;
  inset: auto 12px calc(10px + env(safe-area-inset-bottom, 0px));
  z-index: var(--z-nav);
  display: none;
  align-items: stretch;
  justify-content: center;
  width: auto;
  max-width: 520px;
  margin: 0 auto;
  padding: 5px;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 18px;
  background: rgba(18,18,21,.94);
  box-shadow: 0 14px 42px rgba(0,0,0,.48);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);

  @media (max-width: 768px) { display: flex; }
  @media (max-width: 360px) { inset-inline: 8px; border-radius: 16px; }
`,gt=x.button`
  display: grid;
  place-items: center;
  align-content: center;
  gap: 3px;
  flex: 1 1 0;
  min-width: 0;
  min-height: 48px;
  padding: 6px 4px;
  border-radius: 13px;
  color: ${({$active:e})=>e?"#fff":"var(--text-muted)"};
  background: ${({$active:e})=>e?"rgba(255,255,255,.12)":"transparent"};
  font-size: 10px;
  font-weight: ${({$active:e})=>e?750:600};
  line-height: 1;
  transition: color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);

  &:active { transform: scale(.96); }
  &:hover { color: #fff; }

  span { overflow: hidden; max-width: 100%; text-overflow: ellipsis; white-space: nowrap; }

  @media (max-width: 360px) {
    min-height: 46px;
    font-size: 9px;
  }
`,La=x(Zn)`
  max-width: 280px;
  justify-content: center;
`,Ma=new Set(["/login","/signup","/auth/forgot-password","/auth/new-password","/privacy","/terms","/dmca","/license","/community-guidelines"]),Da=()=>{const e=De(),t=Nn(),r=e.pathname;if(Ma.has(r))return null;if(r.startsWith("/anime/")||r.startsWith("/watch/"))return a.jsxs(La,{"aria-label":"Focused page navigation",children:[a.jsxs(gt,{type:"button",onClick:()=>t(-1),"aria-label":"Go back",children:[a.jsx(Er,{size:16}),a.jsx("span",{children:"Back"})]}),a.jsxs(gt,{type:"button",$active:!1,onClick:()=>t("/"),"aria-label":"Go to Home",children:[a.jsx(ar,{size:16}),a.jsx("span",{children:"Home"})]}),a.jsxs(gt,{type:"button",$active:!1,onClick:()=>t("/catalog"),"aria-label":"Go to Catalog",children:[a.jsx(Gr,{size:16}),a.jsx("span",{children:"Catalog"})]})]});const i=[{icon:ar,label:"Home",to:"/"},{icon:Gr,label:"Catalog",to:"/catalog"},{icon:Jn,label:"Schedule",to:"/schedule"},{icon:Ar,label:"Random",to:"/random",ariaLabel:"Open Random Anime Pick"},{icon:Rt,label:"Support",action:()=>window.dispatchEvent(new Event("aniraku:open-support")),ariaLabel:"Support Aniraku"},{icon:ja,label:"Profile",to:"/profile"}];return a.jsx(a.Fragment,{children:a.jsx(Zn,{"aria-label":"Mobile navigation",children:i.map(({icon:s,label:o,to:c,action:l,ariaLabel:d})=>{const u=!!(c&&(r===c||c!=="/"&&r.startsWith(`${c}/`)));return a.jsxs(gt,{type:"button",$active:u,onClick:l||(()=>t(c)),"aria-label":d||o,"aria-current":u?"page":void 0,children:[a.jsx(s,{size:16,"aria-hidden":"true"}),a.jsx("span",{children:o})]},o)})})})},ei="aniraku.anime.app",za="V4.6",sr="https://github.com/Aniraku/Aniraku-App/releases/tag/v4.6",Fa=`intent://auth#Intent;scheme=aniraku;package=${ei};S.browser_fallback_url=${encodeURIComponent(sr)};end`,Na="https://rookieenough.github.io/Orion-Data/redirect.html?id=aniraku",ti="aniraku:android-app-fallback:hide-until",Ba=new Set(["/login","/signup","/auth/forgot-password","/auth/new-password","/privacy","/terms","/dmca","/license","/community-guidelines","/admin"]);function $a(e=""){const t=e.match(/Android\s+(\d+)(?:\.\d+)?/i);return t?Number.parseInt(t[1],10):null}function Ua({userAgent:e="",maxTouchPoints:t=0,viewportWidth:r=0,coarsePointer:n=!1}={}){const i=$a(e),s=/Android\s*TV|AndroidTV|Smart-TV|AFT[A-Z0-9]+|GoogleTV|HeadlessChrome|bot\b|crawler|spider/i.test(e),o=n||t>0||/Mobile/i.test(e),c=r>0&&r<=1280;return!!(i&&i>=9&&!s&&o&&c)}function Ha(e,t=Date.now()){if(!e)return!1;try{const r=Number(e.getItem(ti));return Number.isFinite(r)&&r>t}catch{return!1}}function qa(e,t=30,r=Date.now()){if(e)try{e.setItem(ti,String(r+t*24*60*60*1e3))}catch{}}function Va(e=""){return Ba.has(e)}const Wa=1250;function Qa(){var e,t;return typeof window>"u"?!1:Ua({userAgent:navigator.userAgent,maxTouchPoints:navigator.maxTouchPoints,viewportWidth:window.innerWidth,coarsePointer:((t=(e=window.matchMedia)==null?void 0:e.call(window,"(hover: none) and (pointer: coarse)"))==null?void 0:t.matches)??!1})}const Ka=()=>{const{pathname:e}=De(),[t,r]=g.useState(!1),[n,i]=g.useState(!1),s=za,o=g.useRef(null);g.useEffect(()=>{if(typeof window>"u"||Va(e)||!Qa()||Ha(window.localStorage)){r(!1);return}const d=window.setTimeout(()=>r(!0),850);return()=>window.clearTimeout(d)},[e]),g.useEffect(()=>{if(!t)return;const d=u=>{u.key==="Escape"&&c()};return document.body.classList.add("body-hidden"),window.addEventListener("keydown",d),window.setTimeout(()=>{var u;return(u=o.current)==null?void 0:u.focus()},0),()=>{document.body.classList.remove("body-hidden"),window.removeEventListener("keydown",d)}},[t]);const c=()=>{qa(window.localStorage),r(!1)},l=()=>{i(!1),window.setTimeout(()=>{document.visibilityState==="visible"&&i(!0)},Wa)};return t?a.jsx(Ga,{onMouseDown:d=>{d.target===d.currentTarget&&c()},role:"presentation",children:a.jsxs(Ya,{role:"dialog","aria-modal":"true","aria-labelledby":"android-app-fallback-title","aria-describedby":"android-app-fallback-description",children:[a.jsxs(Ja,{children:[a.jsxs(Xa,{"aria-label":"Aniraku signal",children:[a.jsx("i",{}),a.jsx("i",{}),a.jsx("i",{}),a.jsx("i",{})]}),a.jsx("span",{children:"ANIRAKU / ANDROID READY"}),a.jsx(Za,{type:"button",onClick:c,"aria-label":"Continue using Aniraku on the web",children:a.jsx(Kn,{})})]}),a.jsx(es,{"aria-hidden":"true",children:a.jsx(Kr,{})}),a.jsxs("h2",{id:"android-app-fallback-title",children:["Use the",a.jsx("br",{}),a.jsx("em",{children:"Aniraku app."})]}),a.jsx("p",{id:"android-app-fallback-description",children:"This Android device can run the native Aniraku experience with direct playback controls, a synced library, quality selection, and fullscreen viewing."}),a.jsxs(ts,{children:[a.jsx("i",{})," Android 9+ / native app available",` · ${s}`]}),a.jsxs(rs,{children:[a.jsx("b",{children:"WHAT’S NEW"}),a.jsx("span",{children:"Future releases now stop before provider search, with a clear availability message for upcoming episodes and movies."})]}),a.jsxs(ns,{ref:o,as:"a",href:Fa,onClick:l,children:[a.jsxs("span",{children:[a.jsx(Kr,{})," USE ANIRAKU APP"]}),a.jsx(qe,{})]}),n&&a.jsxs(is,{role:"status",children:[a.jsx("span",{children:"The app did not open. Get the latest stable build, then try again."}),a.jsxs("a",{href:sr,target:"_blank",rel:"noreferrer",children:["VIEW ",s," NOTES ",a.jsx(Yn,{})]})]}),a.jsxs(as,{children:[a.jsxs("a",{href:sr,target:"_blank",rel:"noreferrer",children:[a.jsx(Pa,{})," ",s," NOTES"]}),a.jsxs("a",{href:Na,target:"_blank",rel:"noreferrer",children:[a.jsx(Oa,{})," ORION STORE"]})]}),a.jsx(ss,{type:"button",onClick:c,children:"CONTINUE ON WEB"}),a.jsxs(os,{children:["PACKAGE / ",a.jsx("code",{children:ei})," · YOUR CHOICE IS REMEMBERED FOR 30 DAYS."]})]})}):null},Ga=x.div`
  position: fixed;
  z-index: 1400;
  inset: 0;
  display: grid;
  align-items: end;
  justify-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  animation: appFallbackIn 180ms cubic-bezier(0.23, 1, 0.32, 1);

  @keyframes appFallbackIn { from { opacity: 0; } to { opacity: 1; } }
`,Ya=x.section`
  position: relative;
  width: min(100%, 460px);
  padding: 16px;
  overflow: hidden;
  color: #f6f6f2;
  border: 1px solid #343434;
  border-bottom: 3px solid #ff4d4d;
  background: #141414;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.62);
  animation: appFallbackSheetIn 240ms cubic-bezier(0.23, 1, 0.32, 1);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.35;
    background-image: linear-gradient(#2a2a2a 1px, transparent 1px), linear-gradient(90deg, #2a2a2a 1px, transparent 1px);
    background-size: 30px 30px;
    mask-image: linear-gradient(145deg, black, transparent 62%);
  }

  > * { position: relative; z-index: 1; }

  h2 {
    margin: 22px 0 10px;
    max-width: 350px;
    color: #f6f6f2;
    font-size: clamp(2.15rem, 8.5vw, 3.1rem);
    font-weight: 800;
    letter-spacing: -0.075em;
    line-height: 0.88;
  }

  h2 em { color: #ff4d4d; font-style: normal; }

  > p {
    max-width: 390px;
    margin: 0;
    color: #a2a2a0;
    font-size: 0.86rem;
    line-height: 1.58;
  }

  @keyframes appFallbackSheetIn {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
`,Ja=x.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a2a2a0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.61rem;
  letter-spacing: 0.08em;

  > span { flex: 1; }
`,Xa=x.span`
  display: grid;
  grid-template-columns: repeat(2, 4px);
  gap: 3px;
  width: 11px;
  i { width: 4px; height: 4px; border-radius: 50%; background: #ff4d4d; }
`,Za=x.button`
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #a2a2a0;
  border: 1px solid #343434;
  background: #0d0d0d;
  transition: color 150ms ease, border-color 150ms ease;
  &:hover { color: #f6f6f2; border-color: #f6f6f2; }
`,es=x.div`
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  margin-top: 28px;
  color: #090909;
  background: #f6f6f2;
  font-size: 1.6rem;
`,ts=x.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 18px 0 14px;
  color: #a2a2a0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.61rem;
  letter-spacing: 0.04em;
  i { width: 7px; height: 7px; border-radius: 50%; background: #96d37b; box-shadow: 0 0 0 3px rgba(150, 211, 123, 0.13); }
`,rs=x.div`
  display: grid;
  gap: 4px;
  margin: 0 0 14px;
  padding: 10px;
  color: #bdbdb8;
  border: 1px solid #343434;
  background: #0d0d0d;
  font-size: 0.72rem;
  line-height: 1.45;
  b { color: #ff4d4d; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.57rem; letter-spacing: 0.08em; }
`,ns=x.button`
  display: flex;
  width: 100%;
  min-height: 54px;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  color: #090909;
  background: #f6f6f2;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.035em;
  transition: transform 150ms ease, background 150ms ease;
  span { display: inline-flex; gap: 8px; align-items: center; }
  &:hover { background: #ff4d4d; }
  &:active { transform: scale(0.98); }
`,is=x.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding: 10px;
  color: #d4c1c1;
  border: 1px solid #3f2c2c;
  background: #1a1010;
  font-size: 0.72rem;
  line-height: 1.4;
  a { display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; color: #ff4d4d; font-family: ui-monospace, monospace; font-size: 0.58rem; }
`,as=x.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 9px;
  a {
    display: inline-flex;
    min-height: 43px;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: #f6f6f2;
    border: 1px solid #343434;
    background: #0d0d0d;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.57rem;
    letter-spacing: 0.035em;
    transition: border-color 150ms ease, color 150ms ease;
  }
  a:hover { color: #ff4d4d; border-color: #ff4d4d; }
`,ss=x.button`
  display: block;
  width: 100%;
  margin-top: 13px;
  padding: 10px;
  color: #a2a2a0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.61rem;
  letter-spacing: 0.06em;
  &:hover { color: #f6f6f2; }
`,os=x.p`
  margin: 0;
  padding-top: 11px;
  color: #666664;
  border-top: 1px solid #2a2a2a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.5rem;
  letter-spacing: 0.045em;
  code { color: #a2a2a0; font-family: inherit; }
`,cs="https://patreon.com/ShoIslam",ls="Hosting, releases, and open-source development.",us="USDT",ds="BNB Smart Chain (BEP20)",hs="BEP20",or="0x0dc085fc880f2f67b4e200f125bc0de352da904e",ps=1800*1e3,fs=10080*60*1e3,ri="aniraku.support.dismissed-until";function ni(e){return String(e||"").startsWith("/watch/")}function ms(e=Date.now()){return e+fs}function gs(e,t=Date.now()){const r=ms(t);return e==null||e.setItem(ri,String(r)),r}function xs({activeMs:e,pathname:t,dismissedUntil:r,now:n=Date.now()}){return e>=ps&&!ni(t)&&Number(r||0)<=n}const bs=15e3;function ys(){var t;if((t=navigator.clipboard)!=null&&t.writeText)return navigator.clipboard.writeText(or);const e=document.createElement("textarea");return e.value=or,e.style.position="fixed",e.style.opacity="0",document.body.appendChild(e),e.select(),document.execCommand("copy"),e.remove(),Promise.resolve()}const vs=()=>{const{pathname:e}=De(),[t,r]=g.useState(!1),[n,i]=g.useState(!1),s=g.useRef(0),o=g.useRef(Date.now()),c=g.useRef(0),l=g.useRef(typeof document>"u"?!1:document.visibilityState==="visible");g.useEffect(()=>{if(typeof window>"u")return;c.current=Number(window.localStorage.getItem(ri)||0)||0;const h=()=>r(!0),m=()=>{const b=Date.now(),S=document.visibilityState==="visible";l.current&&!S&&(s.current+=b-o.current),!l.current&&S&&(o.current=b),l.current=S};return document.addEventListener("visibilitychange",m),window.addEventListener("aniraku:open-support",h),()=>{document.removeEventListener("visibilitychange",m),window.removeEventListener("aniraku:open-support",h)}},[]),g.useEffect(()=>{ni(e)&&r(!1)},[e]),g.useEffect(()=>{if(typeof window>"u")return;const h=()=>{if(t||!l.current)return;const b=Date.now(),S=s.current+(b-o.current);xs({activeMs:S,pathname:e,dismissedUntil:c.current,now:b})&&r(!0)};h();const m=window.setInterval(h,bs);return()=>window.clearInterval(m)},[t,e]);const d=()=>{c.current=gs(window.localStorage),r(!1)},u=async()=>{try{await ys(),i(!0),window.setTimeout(()=>i(!1),1800)}catch{i(!1)}};return t?a.jsx(ws,{role:"presentation",onMouseDown:h=>{h.target===h.currentTarget&&d()},children:a.jsxs(Ss,{role:"dialog","aria-modal":"true","aria-labelledby":"support-prompt-title","aria-describedby":"support-prompt-copy",children:[a.jsxs(As,{children:[a.jsxs(Es,{"aria-hidden":"true",children:[a.jsx("i",{}),a.jsx("i",{}),a.jsx("i",{}),a.jsx("i",{})]}),a.jsx("span",{children:"ANIRAKU / COMMUNITY SUPPORT"}),a.jsx(js,{type:"button",onClick:d,"aria-label":"Dismiss support prompt",children:a.jsx(Kn,{})})]}),a.jsx(Rs,{"aria-hidden":"true",children:a.jsx(Rt,{})}),a.jsxs("h2",{id:"support-prompt-title",children:["Keep Aniraku",a.jsx("br",{}),a.jsx("em",{children:"moving."})]}),a.jsxs("p",{id:"support-prompt-copy",children:["If Aniraku has helped you find something to watch, voluntary support funds ",ls.toLowerCase()]}),a.jsxs(ks,{href:cs,target:"_blank",rel:"noreferrer",onClick:d,children:[a.jsxs("span",{children:[a.jsx(Rt,{})," SUPPORT ON PATREON"]}),a.jsx(Yn,{})]}),a.jsxs(Cs,{children:[a.jsxs(Os,{children:[a.jsxs("span",{children:[us," · ",hs]}),a.jsx("b",{children:"OPTIONAL"})]}),a.jsxs(Ps,{children:[a.jsx("img",{src:"/assets/usdt-bep20-support-qr.png",alt:"USDT BNB Smart Chain payment QR code"}),a.jsxs("div",{children:[a.jsx("strong",{children:ds}),a.jsx("code",{children:or}),a.jsxs("button",{type:"button",onClick:()=>void u(),children:[a.jsx(_a,{})," ",n?"ADDRESS COPIED":"COPY ADDRESS"]})]})]}),a.jsx(_s,{children:"SEND USDT ON BNB SMART CHAIN (BEP20) ONLY. VERIFY THE NETWORK BEFORE SENDING."})]}),a.jsx(Is,{type:"button",onClick:d,children:"NOT NOW · ASK AGAIN IN 7 DAYS"})]})}):null},ws=x.div`
  position: fixed; z-index: 1450; inset: 0; display: grid; align-items: end; justify-items: center; padding: 16px;
  background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px); animation: supportFadeIn 180ms cubic-bezier(0.23, 1, 0.32, 1);
  @keyframes supportFadeIn { from { opacity: 0; } to { opacity: 1; } }
`,Ss=x.section`
  position: relative; width: min(100%, 480px); padding: 16px; overflow: hidden; color: #f6f6f2;
  border: 1px solid #343434; border-bottom: 3px solid #ff4d4d; background: #141414; box-shadow: 0 24px 70px rgba(0,0,0,.62);
  animation: supportSheetIn 240ms cubic-bezier(.23,1,.32,1);
  &::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .35; background-image: linear-gradient(#2a2a2a 1px, transparent 1px), linear-gradient(90deg, #2a2a2a 1px, transparent 1px); background-size: 30px 30px; mask-image: linear-gradient(145deg, black, transparent 62%); }
  > * { position: relative; z-index: 1; }
  h2 { margin: 22px 0 10px; max-width: 350px; font-size: clamp(2.15rem, 8.5vw, 3.1rem); font-weight: 800; letter-spacing: -.075em; line-height: .88; }
  h2 em { color: #ff4d4d; font-style: normal; }
  > p { margin: 0; color: #a2a2a0; font-size: .86rem; line-height: 1.58; }
  @keyframes supportSheetIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
`,As=x.div`
  display: flex; align-items: center; gap: 8px; color: #a2a2a0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .61rem; letter-spacing: .08em;
  > span { flex: 1; }
`,Es=x.span`
  display: grid; grid-template-columns: repeat(2,4px); gap: 3px; width: 11px;
  i { width: 4px; height: 4px; border-radius: 50%; background: #ff4d4d; }
`,js=x.button`
  display: grid; width: 34px; height: 34px; place-items: center; color: #a2a2a0; border: 1px solid #343434; background: #0d0d0d; transition: color 150ms ease, border-color 150ms ease;
  &:hover { color: #f6f6f2; border-color: #f6f6f2; }
`,Rs=x.div`
  display: grid; width: 50px; height: 50px; place-items: center; margin-top: 28px; color: #090909; background: #f6f6f2; font-size: 1.35rem;
`,ks=x.a`
  display: flex; width: 100%; min-height: 54px; align-items: center; justify-content: space-between; margin-top: 17px; padding: 0 15px; color: #090909; background: #f6f6f2; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .7rem; font-weight: 700; letter-spacing: .035em; transition: transform 150ms ease, background 150ms ease;
  span { display: inline-flex; gap: 8px; align-items: center; } &:hover { background: #ff4d4d; } &:active { transform: scale(.98); }
`,Cs=x.div`
  margin-top: 10px; padding: 11px; border: 1px solid #343434; background: #0d0d0d;
`,Os=x.div`
  display: flex; align-items: center; justify-content: space-between; color: #f6f6f2; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .62rem; letter-spacing: .06em;
  b { color: #96d37b; font-size: .54rem; }
`,Ps=x.div`
  display: grid; grid-template-columns: 92px 1fr; gap: 10px; margin-top: 10px; align-items: center;
  img { width: 92px; height: 92px; background: #fff; }
  div { min-width: 0; display: grid; gap: 7px; }
  strong { color: #f6f6f2; font-size: .72rem; }
  code { overflow-wrap: anywhere; color: #a2a2a0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .58rem; line-height: 1.45; }
  button { display: inline-flex; width: fit-content; align-items: center; gap: 6px; padding: 0; color: #f6f6f2; background: transparent; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .58rem; letter-spacing: .04em; } button:hover { color: #ff4d4d; }
  @media (max-width: 360px) { grid-template-columns: 72px 1fr; img { width: 72px; height: 72px; } }
`,_s=x.p`
  margin: 10px 0 0; color: #ff7777; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .52rem; font-weight: 700; line-height: 1.45; letter-spacing: .035em;
`,Is=x.button`
  display: block; width: 100%; margin-top: 7px; padding: 10px; color: #a2a2a0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .61rem; letter-spacing: .06em; &:hover { color: #f6f6f2; }
`,$={};$.Container=x.main`
  position: relative;
  min-height: min(680px, calc(100dvh - var(--header-h)));
  box-sizing: border-box;
  overflow: hidden;
  padding: calc(var(--header-h) + clamp(24px, 5vw, 70px)) var(--content-pad) clamp(36px, 7vw, 88px);
  background:
    radial-gradient(circle at 16% 22%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 22rem),
    radial-gradient(circle at 87% 8%, rgba(125, 92, 232, 0.15), transparent 27rem),
    var(--bg);

  @media (max-width: 768px) {
    min-height: calc(100dvh - var(--header-h));
    padding-top: calc(var(--header-h) + 22px);
    padding-bottom: var(--mobile-dock-clearance);
  }
`;$.Shell=x.div`
  position: relative;
  z-index: 0;
  display: grid;
  width: min(100%, 860px);
  min-height: min(500px, calc(100dvh - var(--header-h) - 110px));
  margin: 0 auto;
  place-content: center;

  @media (max-width: 768px) {
    min-height: 0;
  }
`;$.Card=x.section`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(28px, 6vw, 58px);
  border: 1px solid color-mix(in srgb, var(--accent) 24%, var(--border));
  border-radius: clamp(20px, 3.2vw, 34px);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 97%, transparent), color-mix(in srgb, var(--bg-elevated) 84%, transparent)),
    var(--bg-card);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.32);
  text-align: center;

  &::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    border: 1px solid rgba(255,255,255,0.025);
    border-radius: inherit;
    background-image: linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 26px 26px;
    content: '';
    mask-image: linear-gradient(to bottom, black, transparent 88%);
  }
`;$.AmbientMark=x.div`
  position: absolute;
  z-index: -1;
  top: -0.2em;
  left: 50%;
  color: color-mix(in srgb, var(--accent) 8%, transparent);
  font-size: clamp(170px, 32vw, 340px);
  font-weight: 900;
  letter-spacing: -0.13em;
  line-height: 0.8;
  pointer-events: none;
  transform: translateX(-51%);
  user-select: none;
`;$.Status=x.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 27px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--accent) 42%, var(--border));
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--accent) 9%, transparent);
  color: var(--accent);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;
`;$.Code=x.div`
  margin: clamp(16px, 3vw, 24px) 0 4px;
  color: var(--text-primary);
  font-size: clamp(72px, 13vw, 132px);
  font-weight: 900;
  letter-spacing: -0.11em;
  line-height: 0.78;
  text-indent: -0.09em;
`;$.Title=x.h1`
  max-width: 16ch;
  margin: 18px auto 10px;
  color: var(--text-primary);
  font-size: clamp(27px, 5vw, 48px);
  font-weight: 850;
  letter-spacing: -0.055em;
  line-height: 1.02;
`;$.Text=x.p`
  max-width: 48ch;
  margin: 0 auto;
  color: var(--text-secondary);
  font-size: clamp(13px, 2.6vw, 15px);
  line-height: 1.65;
`;$.Path=x.div`
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 7px;
  margin: 18px auto 0;
  padding: 7px 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg) 72%, transparent);
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;

  svg { flex: 0 0 auto; color: var(--accent); }
`;$.Actions=x.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px;
  margin-top: 24px;

  @media (max-width: 480px) {
    display: grid;
    grid-template-columns: 1fr;
  }
`;const ii=x(F)`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease;

  &:hover { transform: translateY(-1px); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
`;$.PrimaryLink=x(ii)`
  border-color: var(--accent);
  background: var(--accent);
  color: #111;

  &:hover { background: color-mix(in srgb, var(--accent) 88%, white); }
`;$.SecondaryLink=x(ii)`
  background: color-mix(in srgb, var(--bg-elevated) 76%, transparent);
  color: var(--text-primary);

  &:hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--border)); color: var(--accent); }
`;$.UtilityLink=x(F)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 17px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 750;
  text-decoration: none;

  &:hover { color: var(--accent); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
`;$.Note=x.p`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  margin: 16px auto 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.5;
  text-align: center;

  @media (max-width: 420px) {
    font-size: 10.5px;
  }
`;const I={};I.Footer=x.footer`
  margin-top: ${({$compact:e})=>e?"clamp(12px, 2vw, 22px)":"clamp(16px, 2.5vw, 32px)"};
  padding: ${({$compact:e})=>e?"0 var(--page-gutter) calc(14px + var(--safe-bottom))":"clamp(28px, 5vw, 64px) var(--page-gutter) calc(24px + var(--safe-bottom))"};
  border-top: 1px solid rgba(255,255,255,.09);
  background: linear-gradient(180deg, rgba(15,15,17,.82), #0a0a0b 60%);
  color-scheme: dark;

  @media (max-width: 768px) {
    margin-top: 20px;
    padding-bottom: ${({$compact:e})=>e?"calc(74px + var(--safe-bottom))":"calc(96px + var(--safe-bottom))"};
  }
`;I.DesktopGrid=x.div`
  display: grid;
  grid-template-columns: minmax(220px, 1.55fr) repeat(3, minmax(130px, 1fr));
  gap: clamp(24px, 4vw, 58px);
  width: min(100%, 1240px);
  margin: 0 auto;

  @media (max-width: 1024px) {
    grid-template-columns: minmax(220px, 1.6fr) repeat(2, minmax(150px, 1fr));
    gap: 30px;
  }

  @media (max-width: 680px) {
    display: none;
  }
`;I.MobileFooter=x.div`
  display: none;

  @media (max-width: 680px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: min(100%, 420px);
    margin: 0 auto;
    text-align: center;
  }
`;I.MobileTop=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;I.MobileLinks=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
  flex-wrap: wrap;
`;I.MobileLink=x(F)`
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: .78rem;
  font-weight: 650;
  text-decoration: none;
  &:hover { color: #fff; }
`;I.MobileDot=x.span`
  color: rgba(255,255,255,.32);
`;I.Col=x.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;I.ColTitle=x.h4`
  margin: 0;
  color: #fff;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
`;I.ColLinks=x.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;I.Disclaimer=x.p`
  max-width: 360px;
  margin: 0;
  color: var(--text-muted);
  font-size: .78rem;
  line-height: 1.65;
`;I.TmdbAttribution=x.p`
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 360px;
  margin: 0;
  color: var(--text-muted);
  font-size: .67rem;
  line-height: 1.45;

  img {
    width: 44px;
    height: auto;
    flex: 0 0 auto;
  }

  @media (max-width: 680px) {
    justify-content: center;
    max-width: 340px;
  }
`;I.Socials=x.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;I.TrustLine=x.p`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  color: var(--text-muted);
  font-size: .72rem;
  line-height: 1.55;

  a { color: var(--text-secondary); text-decoration: none; }
  a:hover { color: #fff; }
`;I.SocialLink=x.a`
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 11px;
  color: var(--text-secondary);
  background: rgba(255,255,255,.045);
  transition: color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);

  &:hover { color: #fff; background: rgba(255,255,255,.1); transform: translateY(-1px); }
`;I.LinkItem=x.p`
  min-height: 30px;
  display: flex;
  align-items: center;
  margin: 0;
  color: var(--text-secondary);
  font-size: .82rem;
  cursor: pointer;
  &:hover { color: #fff; }
`;I.AzGrid=x.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;I.AzLink=x(F)`
  display: grid;
  place-items: center;
  min-width: 28px;
  min-height: 28px;
  padding: 2px 6px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 7px;
  color: var(--text-secondary);
  background: rgba(255,255,255,.035);
  font-size: .72rem;
  text-decoration: none;
  transition: color var(--transition-fast), background var(--transition-fast);
  &:hover { color: #fff; background: rgba(255,255,255,.09); }
`;I.Bottom=x.div`
  width: min(100%, 1240px);
  margin: clamp(26px, 4vw, 42px) auto 0;
  padding-top: 18px;
  border-top: 1px solid rgba(255,255,255,.08);
  text-align: center;

  @media (max-width: 680px) { display: none; }
`;I.Copyright=x.p`
  margin: 0;
  color: var(--text-muted);
  font-size: .72rem;
`;const Ht="https://www.themoviedb.org/assets/v4/logos/v2/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg",Ts=["All","#","0-9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"],Ls=[{label:"Home",to:"/"},{label:"Catalog",to:"/catalog"},{label:"Schedule",to:"/schedule"},{label:"Most Popular",to:"/catalog?sort=POPULARITY_DESC"},{label:"Top Airing",to:"/catalog?status=RELEASING"},{label:"Top Rated",to:"/catalog?sort=SCORE_DESC"},{label:"Anime Movies",to:"/catalog?format=MOVIE"},{label:"TV Series",to:"/catalog?format=TV"}],Ms=[{label:"Action",to:"/catalog?genre=Action"},{label:"Romance",to:"/catalog?genre=Romance"},{label:"Comedy",to:"/catalog?genre=Comedy"},{label:"Fantasy",to:"/catalog?genre=Fantasy"},{label:"Sci-Fi",to:"/catalog?genre=Sci-Fi"},{label:"Horror",to:"/catalog?genre=Horror"},{label:"Slice of Life",to:"/catalog?genre=Slice%20of%20Life"},{label:"Sports",to:"/catalog?genre=Sports"},{label:"Supernatural",to:"/catalog?genre=Supernatural"},{label:"Mystery",to:"/catalog?genre=Mystery"},{label:"Drama",to:"/catalog?genre=Drama"},{label:"Adventure",to:"/catalog?genre=Adventure"}],xt=[{label:"Privacy",to:"/privacy"},{label:"Terms",to:"/terms"},{label:"DMCA",to:"/dmca"},{label:"AGPL License",to:"/license"},{label:"Community Guidelines",to:"/community-guidelines"}],Ds=x.div`
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr) auto;
  width: min(100%, 920px);
  margin: 0 auto;
  padding: 14px clamp(4px, 2vw, 14px);
  align-items: center;
  gap: 16px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 12px;
  @media (max-width: 720px) { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px 10px; }
  a { color: var(--text-secondary); text-decoration: none; }
  a:hover { color: var(--text-primary); }
`,zs=x.div`
  display: flex;
  align-items: center;
  gap: 9px;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 700;

  @media (max-width: 720px) { flex-direction: column; gap: 4px; }
`,Fs=x.p`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  max-width: 390px;
  margin: 0;
  color: var(--text-muted);
  font-size: 9px;
  line-height: 1.35;
  text-align: left;

  img { width: 42px; height: auto; flex: 0 0 auto; }
  @media (max-width: 720px) { text-align: center; }
`,ai=({compact:e=!0})=>e?a.jsx(I.Footer,{id:"footer",$compact:!0,children:a.jsxs(Ds,{children:[a.jsxs(zs,{children:[a.jsx(at,{to:"/",height:25,showText:!0}),a.jsx("span",{children:"© 2026 Aniraku"})]}),a.jsxs(Fs,{children:[a.jsx("a",{href:"https://www.themoviedb.org/",target:"_blank",rel:"noreferrer","aria-label":"Visit the official TMDB website",children:a.jsx("img",{src:Ht,alt:"TMDB"})}),a.jsx("span",{children:"This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB."})]}),a.jsxs("nav",{"aria-label":"Legal and support links",children:[a.jsx(F,{to:"/catalog",children:"Catalog"}),a.jsx(F,{to:"/schedule",children:"Schedule"}),a.jsx(F,{to:"/privacy",children:"Privacy"}),a.jsx(F,{to:"/terms",children:"Terms"}),a.jsx(F,{to:"/dmca",children:"DMCA"}),a.jsx("a",{href:"https://github.com/Aniraku/Aniraku/issues",target:"_blank",rel:"noreferrer",children:"Support"})]})]})}):a.jsxs(I.Footer,{id:"footer",$compact:!1,children:[a.jsxs(I.DesktopGrid,{children:[a.jsxs(I.Col,{children:[a.jsx(at,{to:"/",height:36,showText:!0}),a.jsx(I.Disclaimer,{children:"Aniraku is an open-source media client. We do not host, store, or upload video files. Stream links are resolved from publicly available third-party sources at playback time."}),a.jsxs(I.TmdbAttribution,{children:[a.jsx("a",{href:"https://www.themoviedb.org/",target:"_blank",rel:"noreferrer","aria-label":"Visit the official TMDB website",children:a.jsx("img",{src:Ht,alt:"TMDB"})}),a.jsx("span",{children:"This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB."})]}),a.jsxs(I.Socials,{children:[a.jsx(I.SocialLink,{href:"https://github.com/Aniraku/Aniraku",target:"_blank",rel:"noreferrer","aria-label":"GitHub",children:a.jsx(Wr,{size:18})}),a.jsx(I.SocialLink,{href:"https://discord.gg/aniraku",target:"_blank",rel:"noreferrer","aria-label":"Discord",children:a.jsx(Qr,{size:18})})]}),a.jsxs(I.TrustLine,{children:[xt.map((t,r)=>a.jsxs(ye.Fragment,{children:[a.jsx(F,{to:t.to,children:t.label}),r<xt.length-1&&a.jsx("span",{children:"·"})]},t.to)),a.jsx("span",{children:"·"}),a.jsx("a",{href:"https://github.com/Aniraku/Aniraku/issues",target:"_blank",rel:"noreferrer",children:"Report an issue"})]})]}),a.jsxs(I.Col,{children:[a.jsx(I.ColTitle,{children:"Browse"}),a.jsx(I.ColLinks,{children:Ls.map(t=>a.jsx(I.LinkItem,{as:F,to:t.to,children:t.label},t.to))})]}),a.jsxs(I.Col,{children:[a.jsx(I.ColTitle,{children:"Genres"}),a.jsx(I.ColLinks,{children:Ms.map(t=>a.jsx(I.LinkItem,{as:F,to:t.to,children:t.label},t.to))})]}),a.jsxs(I.Col,{children:[a.jsx(I.ColTitle,{children:"A-Z List"}),a.jsx(I.AzGrid,{children:Ts.map((t,r)=>a.jsx(I.AzLink,{as:F,to:t==="All"?"/catalog":`/catalog?search=${encodeURIComponent(t)}`,children:t},r))})]})]}),a.jsxs(I.MobileFooter,{children:[a.jsxs(I.MobileTop,{children:[a.jsx(at,{to:"/",height:28,showText:!0}),a.jsxs(I.Socials,{children:[a.jsx(I.SocialLink,{href:"https://github.com/Aniraku/Aniraku",target:"_blank",rel:"noreferrer","aria-label":"GitHub",children:a.jsx(Wr,{size:16})}),a.jsx(I.SocialLink,{href:"https://discord.gg/aniraku",target:"_blank",rel:"noreferrer","aria-label":"Discord",children:a.jsx(Qr,{size:16})})]})]}),a.jsxs(I.MobileLinks,{children:[xt.map((t,r)=>a.jsxs(ye.Fragment,{children:[a.jsx(I.MobileLink,{as:F,to:t.to,children:t.label}),r<xt.length-1&&a.jsx(I.MobileDot,{children:"·"})]},t.to)),a.jsx(I.MobileDot,{children:"·"}),a.jsx(I.MobileLink,{as:"a",href:"https://github.com/Aniraku/Aniraku/issues",target:"_blank",rel:"noreferrer",children:"Report an issue"})]}),a.jsxs(I.TmdbAttribution,{children:[a.jsx("a",{href:"https://www.themoviedb.org/",target:"_blank",rel:"noreferrer","aria-label":"Visit the official TMDB website",children:a.jsx("img",{src:Ht,alt:"TMDB"})}),a.jsx("span",{children:"This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB."})]}),a.jsx(I.Copyright,{children:"© 2026 Aniraku · AGPL-3.0 · No media hosting"})]}),a.jsx(I.Bottom,{children:a.jsx(I.Copyright,{children:"© 2026 Aniraku Contributors · AGPL-3.0 · Not affiliated with AniList or any studio"})})]}),Ns=()=>{const e=De();return g.useEffect(()=>{document.title="Page Not Found — Aniraku";let t=document.querySelector('meta[name="description"]');t&&t.setAttribute("content","Page not found on Aniraku — Free Anime Streaming. Browse our catalog to find anime.")},[]),a.jsxs(a.Fragment,{children:[a.jsx($.Container,{id:"main",children:a.jsxs($.Shell,{children:[a.jsxs($.Card,{children:[a.jsx($.AmbientMark,{"aria-hidden":"true",children:"404"}),a.jsxs($.Status,{children:[a.jsx(Yr,{size:12})," Route unavailable"]}),a.jsx($.Code,{"aria-label":"Error code 404",children:"404"}),a.jsx($.Title,{children:"This story is off the map."}),a.jsx($.Text,{children:"The page you requested is not part of Aniraku. Return home or keep exploring the catalog."}),a.jsxs($.Path,{"aria-label":"Unavailable route",children:[a.jsx(Gn,{size:11})," ",e.pathname||"/"]}),a.jsxs($.Actions,{children:[a.jsxs($.PrimaryLink,{to:"/",children:[a.jsx(ar,{size:13})," Back to Home"]}),a.jsxs($.SecondaryLink,{to:"/catalog",children:[a.jsx(Yr,{size:13})," Browse catalog"]})]}),a.jsxs($.UtilityLink,{to:"/random",children:[a.jsx(Ar,{size:12})," Find a random anime"]})]}),a.jsxs($.Note,{children:[a.jsx(Er,{size:11})," The Home route lives at ",a.jsx("strong",{children:"/"}),"."]})]})}),a.jsx(ai,{compact:!0})]})};function si(e,t){return function(){return e.apply(t,arguments)}}const{toString:Bs}=Object.prototype,{getPrototypeOf:We}=Object,{iterator:lt,toStringTag:oi}=Symbol,kt=(({hasOwnProperty:e})=>(t,r)=>e.call(t,r))(Object.prototype),st=(e,t)=>{let r=e;const n=[];for(;r!=null&&r!==Object.prototype;){if(n.indexOf(r)!==-1)return!1;if(n.push(r),kt(r,t))return!0;r=We(r)}return!1},$s=(e,t)=>e!=null&&st(e,t)?e[t]:void 0,jr=(e=>t=>{const r=Bs.call(t);return e[r]||(e[r]=r.slice(8,-1).toLowerCase())})(Object.create(null)),ge=e=>(e=e.toLowerCase(),t=>jr(t)===e),zt=e=>t=>typeof t===e,{isArray:Te}=Array,Le=zt("undefined");function Ke(e){return e!==null&&!Le(e)&&e.constructor!==null&&!Le(e.constructor)&&ce(e.constructor.isBuffer)&&e.constructor.isBuffer(e)}const ci=ge("ArrayBuffer");function Us(e){let t;return typeof ArrayBuffer<"u"&&ArrayBuffer.isView?t=ArrayBuffer.isView(e):t=e&&e.buffer&&ci(e.buffer),t}const Hs=zt("string"),ce=zt("function"),li=zt("number"),Ge=e=>e!==null&&typeof e=="object",qs=e=>e===!0||e===!1,vt=e=>{if(!Ge(e))return!1;const t=We(e);return(t===null||t===Object.prototype||We(t)===null)&&!st(e,oi)&&!st(e,lt)},Vs=e=>{if(!Ge(e)||Ke(e))return!1;try{return Object.keys(e).length===0&&Object.getPrototypeOf(e)===Object.prototype}catch{return!1}},Ws=ge("Date"),Qs=ge("File"),Ks=e=>!!(e&&typeof e.uri<"u"),Gs=e=>e&&typeof e.getParts<"u",Ys=ge("Blob"),Js=ge("FileList"),Xs=ge("Set"),Zs=e=>Ge(e)&&ce(e.pipe);function eo(){return typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{}}const Xr=eo(),Zr=typeof Xr.FormData<"u"?Xr.FormData:void 0,to=e=>{if(!e)return!1;if(Zr&&e instanceof Zr)return!0;const t=We(e);if(!t||t===Object.prototype||!ce(e.append))return!1;const r=jr(e);return r==="formdata"||r==="object"&&ce(e.toString)&&e.toString()==="[object FormData]"},ro=ge("URLSearchParams"),[no,io,ao,so]=["ReadableStream","Request","Response","Headers"].map(ge),oo=e=>e.trim?e.trim():e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,"");function ut(e,t,{allOwnKeys:r=!1}={}){if(e===null||typeof e>"u")return;let n,i;if(typeof e!="object"&&(e=[e]),Te(e))for(n=0,i=e.length;n<i;n++)t.call(null,e[n],n,e);else{if(Ke(e))return;const s=r?Object.getOwnPropertyNames(e):Object.keys(e),o=s.length;let c;for(n=0;n<o;n++)c=s[n],t.call(null,e[c],c,e)}}function ui(e,t){if(Ke(e))return null;t=t.toLowerCase();const r=Object.keys(e);let n=r.length,i;for(;n-- >0;)if(i=r[n],t===i.toLowerCase())return i;return null}const Pe=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:global,di=e=>!Le(e)&&e!==Pe;function cr(...e){const{caseless:t,skipUndefined:r}=di(this)&&this||{},n={},i=(s,o)=>{if(o==="__proto__"||o==="constructor"||o==="prototype")return;const c=t&&typeof o=="string"&&ui(n,o)||o,l=kt(n,c)?n[c]:void 0;vt(l)&&vt(s)?n[c]=cr(l,s):vt(s)?n[c]=cr({},s):Te(s)?n[c]=s.slice():(!r||!Le(s))&&(n[c]=s)};for(let s=0,o=e.length;s<o;s++){const c=e[s];if(!c||Ke(c)||(ut(c,i),typeof c!="object"||Te(c)))continue;const l=Object.getOwnPropertySymbols(c);for(let d=0;d<l.length;d++){const u=l[d];vo.call(c,u)&&i(c[u],u)}}return n}const co=(e,t,r,{allOwnKeys:n}={})=>(ut(t,(i,s)=>{r&&ce(i)?Object.defineProperty(e,s,{__proto__:null,value:si(i,r),writable:!0,enumerable:!0,configurable:!0}):Object.defineProperty(e,s,{__proto__:null,value:i,writable:!0,enumerable:!0,configurable:!0})},{allOwnKeys:n}),e),lo=e=>(e.charCodeAt(0)===65279&&(e=e.slice(1)),e),uo=(e,t,r,n)=>{e.prototype=Object.create(t.prototype,n),Object.defineProperty(e.prototype,"constructor",{__proto__:null,value:e,writable:!0,enumerable:!1,configurable:!0}),Object.defineProperty(e,"super",{__proto__:null,value:t.prototype}),r&&Object.assign(e.prototype,r)},ho=(e,t,r,n)=>{let i,s,o;const c={};if(t=t||{},e==null)return t;do{for(i=Object.getOwnPropertyNames(e),s=i.length;s-- >0;)o=i[s],(!n||n(o,e,t))&&!c[o]&&(t[o]=e[o],c[o]=!0);e=r!==!1&&We(e)}while(e&&(!r||r(e,t))&&e!==Object.prototype);return t},po=(e,t,r)=>{e=String(e),(r===void 0||r>e.length)&&(r=e.length),r-=t.length;const n=e.indexOf(t,r);return n!==-1&&n===r},fo=e=>{if(!e)return null;if(Te(e))return e;let t=e.length;if(!li(t))return null;const r=new Array(t);for(;t-- >0;)r[t]=e[t];return r},mo=(e=>t=>e&&t instanceof e)(typeof Uint8Array<"u"&&We(Uint8Array)),go=(e,t)=>{const n=(e&&e[lt]).call(e);let i;for(;(i=n.next())&&!i.done;){const s=i.value;t.call(e,s[0],s[1])}},xo=(e,t)=>{let r;const n=[];for(;(r=e.exec(t))!==null;)n.push(r);return n},bo=ge("HTMLFormElement"),yo=e=>e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,function(r,n,i){return n.toUpperCase()+i}),{propertyIsEnumerable:vo}=Object.prototype,wo=ge("RegExp"),hi=(e,t)=>{const r=Object.getOwnPropertyDescriptors(e),n={};ut(r,(i,s)=>{let o;(o=t(i,s,e))!==!1&&(n[s]=o||i)}),Object.defineProperties(e,n)},So=e=>{hi(e,(t,r)=>{if(ce(e)&&["arguments","caller","callee"].includes(r))return!1;const n=e[r];if(ce(n)){if(t.enumerable=!1,"writable"in t){t.writable=!1;return}t.set||(t.set=()=>{throw Error("Can not rewrite read-only method '"+r+"'")})}})},Ao=(e,t)=>{const r={},n=i=>{i.forEach(s=>{r[s]=!0})};return Te(e)?n(e):n(String(e).split(t)),r},Eo=()=>{},jo=(e,t)=>e!=null&&Number.isFinite(e=+e)?e:t;function Ro(e){return!!(e&&ce(e.append)&&e[oi]==="FormData"&&e[lt])}const ko=e=>{const t=new WeakSet,r=n=>{if(Ge(n)){if(t.has(n))return;if(Ke(n))return n;if(!("toJSON"in n)){t.add(n);let i;if(Xs(n)){i=[];for(const s of n){const o=r(s);!Le(o)&&i.push(o)}}else i=Te(n)?[]:{},ut(n,(s,o)=>{const c=r(s);!Le(c)&&(i[o]=c)});return t.delete(n),i}}return n};return r(e)},Co=ge("AsyncFunction"),Oo=e=>e&&(Ge(e)||ce(e))&&ce(e.then)&&ce(e.catch),pi=((e,t)=>e?setImmediate:t?((r,n)=>(Pe.addEventListener("message",({source:i,data:s})=>{i===Pe&&s===r&&n.length&&n.shift()()},!1),i=>{n.push(i),Pe.postMessage(r,"*")}))(`axios@${Math.random()}`,[]):r=>setTimeout(r))(typeof setImmediate=="function",ce(Pe.postMessage)),Po=typeof queueMicrotask<"u"?queueMicrotask.bind(Pe):typeof process<"u"&&process.nextTick||pi,fi=e=>e!=null&&ce(e[lt]),_o=e=>e!=null&&st(e,lt)&&fi(e),p={isArray:Te,isArrayBuffer:ci,isBuffer:Ke,isFormData:to,isArrayBufferView:Us,isString:Hs,isNumber:li,isBoolean:qs,isObject:Ge,isPlainObject:vt,isEmptyObject:Vs,isReadableStream:no,isRequest:io,isResponse:ao,isHeaders:so,isUndefined:Le,isDate:Ws,isFile:Qs,isReactNativeBlob:Ks,isReactNative:Gs,isBlob:Ys,isRegExp:wo,isFunction:ce,isStream:Zs,isURLSearchParams:ro,isTypedArray:mo,isFileList:Js,forEach:ut,merge:cr,extend:co,trim:oo,stripBOM:lo,inherits:uo,toFlatObject:ho,kindOf:jr,kindOfTest:ge,endsWith:po,toArray:fo,forEachEntry:go,matchAll:xo,isHTMLForm:bo,hasOwnProperty:kt,hasOwnProp:kt,hasOwnInPrototypeChain:st,getSafeProp:$s,reduceDescriptors:hi,freezeMethods:So,toObjectSet:Ao,toCamelCase:yo,noop:Eo,toFiniteNumber:jo,findKey:ui,global:Pe,isContextDefined:di,isSpecCompliantForm:Ro,toJSONObject:ko,isAsyncFn:Co,isThenable:Oo,setImmediate:pi,asap:Po,isIterable:fi,isSafeIterable:_o},Io=p.toObjectSet(["age","authorization","content-length","content-type","etag","expires","from","host","if-modified-since","if-unmodified-since","last-modified","location","max-forwards","proxy-authorization","referer","retry-after","user-agent"]),To=e=>{const t={};let r,n,i;return e&&e.split(`
`).forEach(function(o){i=o.indexOf(":"),r=o.substring(0,i).trim().toLowerCase(),n=o.substring(i+1).trim();const c=p.hasOwnProp(t,r);!r||c&&p.hasOwnProp(Io,r)||(r==="set-cookie"?c?t[r].push(n):t[r]=[n]:t[r]=c?t[r]+", "+n:n)}),t};function Lo(e){let t=0,r=e.length;for(;t<r;){const n=e.charCodeAt(t);if(n!==9&&n!==32)break;t+=1}for(;r>t;){const n=e.charCodeAt(r-1);if(n!==9&&n!==32)break;r-=1}return t===0&&r===e.length?e:e.slice(t,r)}const Mo=new RegExp("[\\u0000-\\u0008\\u000a-\\u001f\\u007f]+","g"),Do=new RegExp("[^\\u0009\\u0020-\\u007e\\u0080-\\u00ff]+","g");function Rr(e,t){return p.isArray(e)?e.map(r=>Rr(r,t)):Lo(String(e).replace(t,""))}const zo=e=>Rr(e,Mo),Fo=e=>Rr(e,Do);function mi(e){const t=Object.create(null);return p.forEach(e.toJSON(),(r,n)=>{t[n]=Fo(r)}),t}const en=Symbol("internals");function tt(e){return e&&String(e).trim().toLowerCase()}function wt(e){return e===!1||e==null?e:p.isArray(e)?e.map(wt):zo(String(e))}function No(e){const t=Object.create(null),r=/([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;let n;for(;n=r.exec(e);)t[n[1]]=n[2];return t}const Bo=/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;function qt(e){let t=0,r=e.length;for(;t<r;){const n=e.charCodeAt(t);if(n!==9&&n!==32)break;t+=1}for(;r>t;){const n=e.charCodeAt(r-1);if(n!==9&&n!==32)break;r-=1}return t===0&&r===e.length?e:e.slice(t,r)}function $o(e){const t=e.length-1;if(t<1||e.charCodeAt(0)!==34||e.charCodeAt(t)!==34)return e;let r="";for(let n=1;n<t;n++){const i=e.charCodeAt(n);if(i===34||i===92&&(n+=1,n>=t))return e;r+=e[n]}return r}function Uo(e){const t=Object.create(null),r=String(e);let n=0,i=!1,s=!1;function o(c){const l=qt(r.slice(n,c)),d=l.indexOf("=");if(d<1)return;const u=qt(l.slice(0,d));if(!Bo.test(u))return;const h=u.toLowerCase();if(h==="__proto__"||h==="constructor"||h==="prototype")return;const m=qt(l.slice(d+1));t[h]=$o(m)}for(let c=0;c<r.length;c++){const l=r.charCodeAt(c);i?s?s=!1:l===92?s=!0:l===34&&(i=!1):l===34?i=!0:(l===44||l===59)&&(o(c),n=c+1)}return o(r.length),t}const Ho=e=>/^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim());function Vt(e,t,r,n,i){if(p.isFunction(n))return n.call(this,t,r);if(i&&(t=r),!!p.isString(t)){if(p.isString(n))return t.indexOf(n)!==-1;if(p.isRegExp(n))return n.test(t)}}function qo(e){return e.trim().toLowerCase().replace(/([a-z\d])(\w*)/g,(t,r,n)=>r.toUpperCase()+n)}function Vo(e,t){const r=p.toCamelCase(" "+t);["get","set","has"].forEach(n=>{Object.defineProperty(e,n+r,{__proto__:null,value:function(i,s,o){return this[n].call(this,t,i,s,o)},configurable:!0})})}let re=class{constructor(t){t&&this.set(t)}set(t,r,n){const i=this;function s(c,l,d){const u=tt(l);if(!u)return;const h=p.findKey(i,u);(!h||i[h]===void 0||d===!0||d===void 0&&i[h]!==!1)&&(i[h||l]=wt(c))}const o=(c,l)=>p.forEach(c,(d,u)=>s(d,u,l));if(p.isPlainObject(t)||t instanceof this.constructor)o(t,r);else if(p.isString(t)&&(t=t.trim())&&!Ho(t))o(To(t),r);else if(p.isObject(t)&&p.isSafeIterable(t)){let c=Object.create(null),l,d;for(const u of t){if(!p.isArray(u))throw new TypeError("Object iterator must return a key-value pair");d=u[0],p.hasOwnProp(c,d)?(l=c[d],c[d]=p.isArray(l)?[...l,u[1]]:[l,u[1]]):c[d]=u[1]}o(c,r)}else t!=null&&s(r,t,n);return this}get(t,r){if(t=tt(t),t){const n=p.findKey(this,t);if(n){const i=this[n];if(!r)return i;if(r===!0)return No(i);if(p.isFunction(r))return r.call(this,i,n);if(p.isRegExp(r))return r.exec(i);throw new TypeError("parser must be boolean|regexp|function")}}}has(t,r){if(t=tt(t),t){const n=p.findKey(this,t);return!!(n&&this[n]!==void 0&&(!r||Vt(this,this[n],n,r)))}return!1}delete(t,r){const n=this;let i=!1;function s(o){if(o=tt(o),o){const c=p.findKey(n,o);c&&(!r||Vt(n,n[c],c,r))&&(delete n[c],i=!0)}}return p.isArray(t)?t.forEach(s):s(t),i}clear(t){const r=Object.keys(this);let n=r.length,i=!1;for(;n--;){const s=r[n];(!t||Vt(this,this[s],s,t,!0))&&(delete this[s],i=!0)}return i}normalize(t){const r=this,n={};return p.forEach(this,(i,s)=>{const o=p.findKey(n,s);if(o){r[o]=wt(i),delete r[s];return}const c=t?qo(s):String(s).trim();c!==s&&delete r[s],r[c]=wt(i),n[c]=!0}),this}concat(...t){return this.constructor.concat(this,...t)}toJSON(t){const r=Object.create(null);return p.forEach(this,(n,i)=>{n!=null&&n!==!1&&(r[i]=t&&p.isArray(n)?n.join(", "):n)}),r}[Symbol.iterator](){return Object.entries(this.toJSON())[Symbol.iterator]()}toString(){return Object.entries(this.toJSON()).map(([t,r])=>t+": "+r).join(`
`)}getSetCookie(){const t=this.get("set-cookie");return p.isArray(t)?t:t==null||t===!1?[]:[t]}get[Symbol.toStringTag](){return"AxiosHeaders"}static from(t){return t instanceof this?t:new this(t)}static parseParameters(t){return Uo(t)}static concat(t,...r){const n=new this(t);return r.forEach(i=>n.set(i)),n}static accessor(t){const n=(this[en]=this[en]={accessors:{}}).accessors,i=this.prototype;function s(o){const c=tt(o);n[c]||(Vo(i,o),n[c]=!0)}return p.isArray(t)?t.forEach(s):s(t),this}};re.accessor(["Content-Type","Content-Length","Accept","Accept-Encoding","User-Agent","Authorization"]);p.reduceDescriptors(re.prototype,({value:e},t)=>{let r=t[0].toUpperCase()+t.slice(1);return{get:()=>e,set(n){this[r]=n}}});p.freezeMethods(re);const Ct="[REDACTED ****]";function Wo(e){if(p.hasOwnProp(e,"toJSON"))return!0;let t=Object.getPrototypeOf(e);for(;t&&t!==Object.prototype;){if(p.hasOwnProp(t,"toJSON"))return!0;t=Object.getPrototypeOf(t)}return!1}function Qo(e,t){const r=new Set(t.map(s=>String(s).toLowerCase())),n=[],i=s=>{if(s===null||typeof s!="object"||p.isBuffer(s))return s;if(n.indexOf(s)!==-1)return;s instanceof re&&(s=s.toJSON()),n.push(s);let o;if(p.isArray(s))o=[],s.forEach((c,l)=>{const d=i(c);p.isUndefined(d)||(o[l]=d)});else{if(!p.isPlainObject(s)&&Wo(s))return n.pop(),s;o=Object.create(null);for(const[c,l]of Object.entries(s)){const d=r.has(c.toLowerCase())?Ct:i(l);p.isUndefined(d)||(o[c]=d)}}return n.pop(),o};return i(e)}function tn(e){try{return String(e)}catch{return""}}function Ko(e){return e.errors.map(r=>{try{return r&&r.message?tn(r.message):tn(r)}catch{return""}}).filter(Boolean).join("; ")||e.name||"AggregateError"}let R=class gi extends Error{static from(t,r,n,i,s,o){let c=t.message;!c&&p.isArray(t.errors)&&t.errors.length&&(c=Ko(t));const l=new gi(c,r||t.code,n,i,s);return Object.defineProperty(l,"cause",{__proto__:null,value:t,writable:!0,enumerable:!1,configurable:!0}),l.name=t.name,t.status!=null&&l.status==null&&(l.status=t.status),o&&Object.assign(l,o),l}constructor(t,r,n,i,s){super(t),Object.defineProperty(this,"message",{__proto__:null,value:t,enumerable:!0,writable:!0,configurable:!0}),this.name="AxiosError",this.isAxiosError=!0,r&&(this.code=r),n&&(this.config=n),i&&(this.request=i),s&&(this.response=s,this.status=s.status)}toJSON(){const t=this.config,r=t&&p.hasOwnProp(t,"redact")?t.redact:void 0,n=p.isArray(r)&&r.length>0?Qo(t,r):p.toJSONObject(t);return{message:this.message,name:this.name,description:this.description,number:this.number,fileName:this.fileName,lineNumber:this.lineNumber,columnNumber:this.columnNumber,stack:this.stack,config:n,code:this.code,status:this.status}}};R.ERR_BAD_OPTION_VALUE="ERR_BAD_OPTION_VALUE";R.ERR_BAD_OPTION="ERR_BAD_OPTION";R.ECONNABORTED="ECONNABORTED";R.ETIMEDOUT="ETIMEDOUT";R.ECONNREFUSED="ECONNREFUSED";R.ERR_NETWORK="ERR_NETWORK";R.ERR_FR_TOO_MANY_REDIRECTS="ERR_FR_TOO_MANY_REDIRECTS";R.ERR_DEPRECATED="ERR_DEPRECATED";R.ERR_BAD_RESPONSE="ERR_BAD_RESPONSE";R.ERR_BAD_REQUEST="ERR_BAD_REQUEST";R.ERR_CANCELED="ERR_CANCELED";R.ERR_NOT_SUPPORT="ERR_NOT_SUPPORT";R.ERR_INVALID_URL="ERR_INVALID_URL";R.ERR_FORM_DATA_DEPTH_EXCEEDED="ERR_FORM_DATA_DEPTH_EXCEEDED";const Go=null,xi=100;function lr(e){return p.isPlainObject(e)||p.isArray(e)}function bi(e){return p.endsWith(e,"[]")?e.slice(0,-2):e}function Wt(e,t,r){return e?e.concat(t).map(function(i,s){return i=bi(i),!r&&s?"["+i+"]":i}).join(r?".":""):t}function Yo(e){return p.isArray(e)&&!e.some(lr)}const Jo=p.toFlatObject(p,{},null,function(t){return/^is[A-Z]/.test(t)});function Ft(e,t,r){if(!p.isObject(e))throw new TypeError("target must be an object");t=t||new FormData,r=p.toFlatObject(r,{metaTokens:!0,dots:!1,indexes:!1},!1,function(A,y){return!p.isUndefined(y[A])});const n=r.metaTokens,i=r.visitor||S,s=r.dots,o=r.indexes,c=r.Blob||typeof Blob<"u"&&Blob,l=r.maxDepth===void 0?xi:r.maxDepth,d=c&&p.isSpecCompliantForm(t),u=[];if(!p.isFunction(i))throw new TypeError("visitor must be a function");function h(f){if(f===null)return"";if(p.isDate(f))return f.toISOString();if(p.isBoolean(f))return f.toString();if(!d&&p.isBlob(f))throw new R("Blob is not supported. Use a Buffer instead.");if(p.isArrayBuffer(f)||p.isTypedArray(f)){if(d&&typeof c=="function")return new c([f]);throw new R("Blob is not supported. Use a Buffer instead.",R.ERR_NOT_SUPPORT)}return f}function m(f){if(f>l)throw new R("Object is too deeply nested ("+f+" levels). Max depth: "+l,R.ERR_FORM_DATA_DEPTH_EXCEEDED)}function b(f,A){if(l===1/0)return JSON.stringify(f);const y=[];return JSON.stringify(f,function(w,E){if(!p.isObject(E))return E;for(;y.length&&y[y.length-1]!==this;)y.pop();return y.push(E),m(A+y.length-1),E})}function S(f,A,y){let k=f;if(p.isReactNative(t)&&p.isReactNativeBlob(f))return t.append(Wt(y,A,s),h(f)),!1;if(f&&!y&&typeof f=="object"){if(p.endsWith(A,"{}"))A=n?A:A.slice(0,-2),f=b(f,1);else if(p.isArray(f)&&Yo(f)||(p.isFileList(f)||p.endsWith(A,"[]"))&&(k=p.toArray(f)))return A=bi(A),k.forEach(function(E,C){!(p.isUndefined(E)||E===null)&&t.append(o===!0?Wt([A],C,s):o===null?A:A+"[]",h(E))}),!1}return lr(f)?!0:(t.append(Wt(y,A,s),h(f)),!1)}const j=Object.assign(Jo,{defaultVisitor:S,convertValue:h,isVisitable:lr});function v(f,A,y=0){if(!p.isUndefined(f)){if(m(y),u.indexOf(f)!==-1)throw new Error("Circular reference detected in "+A.join("."));u.push(f),p.forEach(f,function(w,E){(!(p.isUndefined(w)||w===null)&&i.call(t,w,p.isString(E)?E.trim():E,A,j))===!0&&v(w,A?A.concat(E):[E],y+1)}),u.pop()}}if(!p.isObject(e))throw new TypeError("data must be an object");return v(e),t}function rn(e){const t={"!":"%21","'":"%27","(":"%28",")":"%29","~":"%7E","%20":"+"};return encodeURIComponent(e).replace(/[!'()~]|%20/g,function(n){return t[n]})}function kr(e,t){this._pairs=[],e&&Ft(e,this,t)}const yi=kr.prototype;yi.append=function(t,r){this._pairs.push([t,r])};yi.toString=function(t){const r=t?n=>t.call(this,n,rn):rn;return this._pairs.map(function(i){return r(i[0])+"="+r(i[1])},"").join("&")};function Xo(e){return encodeURIComponent(e).replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"+")}function vi(e,t,r){if(!t)return e;e=e||"";const n=p.isFunction(r)?{serialize:r}:r,i=p.getSafeProp(n,"encode")||Xo,s=p.getSafeProp(n,"serialize");let o;if(s?o=s(t,n):o=p.isURLSearchParams(t)?t.toString():new kr(t,n).toString(i),o){const c=e.indexOf("#");c!==-1&&(e=e.slice(0,c)),e+=(e.indexOf("?")===-1?"?":"&")+o}return e}class nn{constructor(){this.handlers=[]}use(t,r,n){return this.handlers.push({fulfilled:t,rejected:r,synchronous:n?n.synchronous:!1,runWhen:n?n.runWhen:null}),this.handlers.length-1}eject(t){this.handlers[t]&&(this.handlers[t]=null)}clear(){this.handlers&&(this.handlers=[])}forEach(t){p.forEach(this.handlers,function(n){n!==null&&t(n)})}}const Cr={silentJSONParsing:!0,forcedJSONParsing:!0,clarifyTimeoutError:!1,legacyInterceptorReqResOrdering:!0,advertiseZstdAcceptEncoding:!1,validateStatusUndefinedResolves:!0},Zo=typeof URLSearchParams<"u"?URLSearchParams:kr,ec=typeof FormData<"u"?FormData:null,tc=typeof Blob<"u"?Blob:null,rc={isBrowser:!0,classes:{URLSearchParams:Zo,FormData:ec,Blob:tc},protocols:["http","https","file","blob","url","data"]},Or=typeof window<"u"&&typeof document<"u",ur=typeof navigator=="object"&&navigator||void 0,nc=Or&&(!ur||["ReactNative","NativeScript","NS"].indexOf(ur.product)<0),ic=typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope&&typeof self.importScripts=="function",ac=Or&&window.location.href||"http://localhost",sc=Object.freeze(Object.defineProperty({__proto__:null,hasBrowserEnv:Or,hasStandardBrowserEnv:nc,hasStandardBrowserWebWorkerEnv:ic,navigator:ur,origin:ac},Symbol.toStringTag,{value:"Module"})),J={...sc,...rc};function oc(e,t){return Ft(e,new J.classes.URLSearchParams,{visitor:function(r,n,i,s){return J.isNode&&p.isBuffer(r)?(this.append(n,r.toString("base64")),!1):s.defaultVisitor.apply(this,arguments)},...t})}const an=xi;function wi(e){if(e>an)throw new R("FormData field is too deeply nested ("+e+" levels). Max depth: "+an,R.ERR_FORM_DATA_DEPTH_EXCEEDED)}function cc(e){const t=[],r=/[^.[\]]+|\[([^.[\]]*)]/g;let n;for(;(n=r.exec(e))!==null;)wi(t.length),t.push(n[0]==="[]"?"":n[1]||n[0]);return t}function lc(e){const t={},r=Object.keys(e);let n;const i=r.length;let s;for(n=0;n<i;n++)s=r[n],t[s]=e[s];return t}function Si(e){function t(r,n,i,s){wi(s);let o=r[s++];if(o==="__proto__")return!0;const c=Number.isFinite(+o),l=s>=r.length;return o=!o&&p.isArray(i)?i.length:o,l?(p.hasOwnProp(i,o)?i[o]=p.isArray(i[o])?i[o].concat(n):[i[o],n]:i[o]=n,!c):((!p.hasOwnProp(i,o)||!p.isObject(i[o]))&&(i[o]=[]),t(r,n,i[o],s)&&p.isArray(i[o])&&(i[o]=lc(i[o])),!c)}if(p.isFormData(e)&&p.isFunction(e.entries)){const r={};return p.forEachEntry(e,(n,i)=>{t(cc(n),i,r,0)}),r}return null}const Be=(e,t)=>e!=null&&p.hasOwnProp(e,t)?e[t]:void 0;function uc(e,t,r){if(p.isString(e))try{return(t||JSON.parse)(e),p.trim(e)}catch(n){if(n.name!=="SyntaxError")throw n}return(r||JSON.stringify)(e)}const dt={transitional:Cr,adapter:["xhr","http","fetch"],transformRequest:[function(t,r){const n=r.getContentType()||"",i=n.indexOf("application/json")>-1,s=p.isObject(t);if(s&&p.isHTMLForm(t)&&(t=new FormData(t)),p.isFormData(t))return i?JSON.stringify(Si(t)):t;if(p.isArrayBuffer(t)||p.isBuffer(t)||p.isStream(t)||p.isFile(t)||p.isBlob(t)||p.isReadableStream(t))return t;if(p.isArrayBufferView(t))return t.buffer;if(p.isURLSearchParams(t))return r.setContentType("application/x-www-form-urlencoded;charset=utf-8",!1),t.toString();let c;if(s){const l=Be(this,"formSerializer");if(n.indexOf("application/x-www-form-urlencoded")>-1)return oc(t,l).toString();if((c=p.isFileList(t))||n.indexOf("multipart/form-data")>-1){const d=Be(this,"env"),u=d&&d.FormData;return Ft(c?{"files[]":t}:t,u&&new u,l)}}return s||i?(r.setContentType("application/json",!1),uc(t)):t}],transformResponse:[function(t){const r=Be(this,"transitional")||dt.transitional,n=r&&r.forcedJSONParsing,i=Be(this,"responseType"),s=i==="json";if(p.isResponse(t)||p.isReadableStream(t))return t;if(t&&p.isString(t)&&(n&&!i||s)){const c=!(r&&r.silentJSONParsing)&&s;try{return JSON.parse(t,Be(this,"parseReviver"))}catch(l){if(c)throw l.name==="SyntaxError"?R.from(l,R.ERR_BAD_RESPONSE,this,null,Be(this,"response")):l}}return t}],timeout:0,xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN",maxContentLength:-1,maxBodyLength:-1,env:{FormData:J.classes.FormData,Blob:J.classes.Blob},validateStatus:function(t){return t>=200&&t<300},headers:{common:{Accept:"application/json, text/plain, */*","Content-Type":void 0}}};p.forEach(["delete","get","head","post","put","patch","query"],e=>{dt.headers[e]={}});function Qt(e,t){const r=this||dt,n=t||r,i=re.from(n.headers);let s=n.data;return p.forEach(e,function(c){s=c.call(r,s,i.normalize(),t?t.status:void 0)}),i.normalize(),s}function Ai(e){return!!(e&&e.__CANCEL__)}let ht=class extends R{constructor(t,r,n){super(t??"canceled",R.ERR_CANCELED,r,n),this.name="CanceledError",this.__CANCEL__=!0}};function Ei(e,t,r){const n=r.config.validateStatus;!r.status||!n||n(r.status)?e(r):t(new R("Request failed with status code "+r.status,r.status>=400&&r.status<500?R.ERR_BAD_REQUEST:R.ERR_BAD_RESPONSE,r.config,r.request,r))}function dc(e){const t=/^([-+\w]{1,25}):(?:\/\/)?/.exec(e);return t&&t[1]||""}function hc(e,t){e=e||10;const r=new Array(e),n=new Array(e);let i=0,s=0,o;return t=t!==void 0?t:1e3,function(l){const d=Date.now(),u=n[s];o||(o=d),r[i]=l,n[i]=d;let h=s,m=0;for(;h!==i;)m+=r[h++],h=h%e;if(i=(i+1)%e,i===s&&(s=(s+1)%e),d-o<t)return;const b=u&&d-u;return b?Math.round(m*1e3/b):void 0}}function pc(e,t){let r=0,n=1e3/t,i,s;const o=(d,u=Date.now())=>{r=u,i=null,s&&(clearTimeout(s),s=null),e(...d)};return[(...d)=>{const u=Date.now(),h=u-r;h>=n?o(d,u):(i=d,s||(s=setTimeout(()=>{s=null,o(i)},n-h)))},()=>i&&o(i)]}const Ot=(e,t,r=3)=>{let n=0;const i=hc(50,250);return pc(s=>{if(!s||typeof s.loaded!="number")return;const o=s.loaded,c=s.lengthComputable?s.total:void 0,l=Math.max(0,c!=null?Math.min(o,c):o),d=Math.max(0,l-n),u=i(d);n=Math.max(n,l);const h={loaded:l,total:c,progress:c?l/c:void 0,bytes:d,rate:u||void 0,estimated:u&&c?(c-l)/u:void 0,event:s,lengthComputable:c!=null,[t?"download":"upload"]:!0};e(h)},r)},sn=(e,t)=>{const r=e!=null;return[n=>t[0]({lengthComputable:r,total:e,loaded:n}),t[1]]},on=(e,t=p.asap)=>(...r)=>t(()=>e(...r)),fc=J.hasStandardBrowserEnv?((e,t)=>r=>(r=new URL(r,J.origin),e.protocol===r.protocol&&e.host===r.host&&(t||e.port===r.port)))(new URL(J.origin),J.navigator&&/(msie|trident)/i.test(J.navigator.userAgent)):()=>!0,mc=J.hasStandardBrowserEnv?{write(e,t,r,n,i,s,o){if(typeof document>"u")return;const c=[`${e}=${encodeURIComponent(t)}`];p.isNumber(r)&&c.push(`expires=${new Date(r).toUTCString()}`),p.isString(n)&&c.push(`path=${n}`),p.isString(i)&&c.push(`domain=${i}`),s===!0&&c.push("secure"),p.isString(o)&&c.push(`SameSite=${o}`),document.cookie=c.join("; ")},read(e){if(typeof document>"u")return null;const t=document.cookie.split(";");for(let r=0;r<t.length;r++){const n=t[r].replace(/^\s+/,""),i=n.indexOf("=");if(i!==-1&&n.slice(0,i)===e)try{return decodeURIComponent(n.slice(i+1))}catch{return n.slice(i+1)}}return null},remove(e){this.write(e,"",Date.now()-864e5,"/")}}:{write(){},read(){return null},remove(){}};function gc(e){return typeof e!="string"?!1:/^([a-z][a-z\d+\-.]*:)?\/\//i.test(e)}function xc(e,t){if(!t)return e;let r=e.length;for(;r>0&&e.charCodeAt(r-1)===47;)r--;return e.slice(0,r)+"/"+t.replace(/^\/+/,"")}const bc=/^https?:(?!\/\/)/i,yc=/[\t\n\r]/g;function vc(e){let t=0;for(;t<e.length&&e.charCodeAt(t)<=32;)t++;return e.slice(t)}function wc(e){return vc(e).replace(yc,"")}function Sc(e){return e&&e.replace(/(^|&)([^=&]*=)?[^&]+/g,(t,r,n="")=>`${r}${n}${Ct}`)}function Ac(e){const t=e.replace(/^(https?:\/{0,2})[^/?#]*@/i,`$1${Ct}@`),r=t.indexOf("#"),i=(r===-1?t:t.slice(0,r)).replace(/([?&][^=&#]*=)[^&#]*/g,`$1${Ct}`);return r===-1?i:`${i}#${Sc(t.slice(r+1))}`}function cn(e,t){if(typeof e=="string"){const r=wc(e);if(bc.test(r))throw new R(`Invalid URL ${JSON.stringify(Ac(r))}: missing "//" after protocol`,R.ERR_INVALID_URL,t)}}function ji(e,t,r,n){cn(t,n);let i=!gc(t);return e&&(i||r===!1)?(cn(e,n),xc(e,t)):t}const ln=e=>e instanceof re?{...e}:e,Ec=e=>Object.getOwnPropertySymbols&&Object.getOwnPropertyDescriptor?Object.keys(e).concat(Object.getOwnPropertySymbols(e).filter(t=>Object.getOwnPropertyDescriptor(e,t).enumerable)):Object.keys(e);function Me(e,t){e=e||{},t=t||{};const r=Object.create(null);Object.defineProperty(r,"hasOwnProperty",{__proto__:null,value:Object.prototype.hasOwnProperty,enumerable:!1,writable:!0,configurable:!0});function n(u,h,m,b){return p.isPlainObject(u)&&p.isPlainObject(h)?p.merge.call({caseless:b},u,h):p.isPlainObject(h)?p.merge({},h):p.isArray(h)?h.slice():h}function i(u,h,m,b){if(p.isUndefined(h)){if(!p.isUndefined(u))return n(void 0,u,m,b)}else return n(u,h,m,b)}function s(u,h){if(!p.isUndefined(h))return n(void 0,h)}function o(u,h){if(p.isUndefined(h)){if(!p.isUndefined(u))return n(void 0,u)}else return n(void 0,h)}function c(u){const h=p.hasOwnProp(t,"transitional")?t.transitional:void 0;if(!p.isUndefined(h))if(p.isPlainObject(h)){if(p.hasOwnProp(h,u))return h[u]}else return;const m=p.hasOwnProp(e,"transitional")?e.transitional:void 0;if(p.isPlainObject(m)&&p.hasOwnProp(m,u))return m[u]}function l(u,h,m){if(p.hasOwnProp(t,m))return n(u,h);if(p.hasOwnProp(e,m))return n(void 0,u)}const d={url:s,method:s,data:s,baseURL:o,transformRequest:o,transformResponse:o,paramsSerializer:o,timeout:o,timeoutMessage:o,withCredentials:o,withXSRFToken:o,adapter:o,responseType:o,xsrfCookieName:o,xsrfHeaderName:o,onUploadProgress:o,onDownloadProgress:o,decompress:o,maxContentLength:o,maxBodyLength:o,beforeRedirect:o,transport:o,httpAgent:o,httpsAgent:o,cancelToken:o,socketPath:o,allowedSocketPaths:o,responseEncoding:o,validateStatus:l,headers:(u,h,m)=>i(ln(u),ln(h),m,!0)};return p.forEach(Ec({...e,...t}),function(h){if(h==="__proto__"||h==="constructor"||h==="prototype")return;const m=p.hasOwnProp(d,h)?d[h]:i,b=p.hasOwnProp(e,h)?e[h]:void 0,S=p.hasOwnProp(t,h)?t[h]:void 0,j=m(b,S,h);p.isUndefined(j)&&m!==l||(r[h]=j)}),p.hasOwnProp(t,"validateStatus")&&p.isUndefined(t.validateStatus)&&c("validateStatusUndefinedResolves")===!1&&(p.hasOwnProp(e,"validateStatus")?r.validateStatus=n(void 0,e.validateStatus):delete r.validateStatus),r}const jc=["content-type","content-length"];function Rc(e,t,r){if(r!=="content-only"){e.set(t);return}Object.entries(t||{}).forEach(([n,i])=>{jc.includes(n.toLowerCase())&&e.set(n,i)})}const kc=e=>encodeURIComponent(e).replace(/%([0-9A-F]{2})/gi,(t,r)=>String.fromCharCode(parseInt(r,16)));function Ri(e){const t=Me({},e),r=m=>p.hasOwnProp(t,m)?t[m]:void 0,n=r("data");let i=r("withXSRFToken");const s=r("xsrfHeaderName"),o=r("xsrfCookieName");let c=r("headers");const l=r("auth"),d=r("baseURL"),u=r("allowAbsoluteUrls"),h=r("url");if(t.headers=c=re.from(c),t.url=vi(ji(d,h,u,t),r("params"),r("paramsSerializer")),l){const m=p.getSafeProp(l,"username")||"",b=p.getSafeProp(l,"password")||"";try{c.set("Authorization","Basic "+btoa(m+":"+(b?kc(b):"")))}catch(S){throw R.from(S,R.ERR_BAD_OPTION_VALUE,e)}}if(p.isFormData(n)&&(J.hasStandardBrowserEnv||J.hasStandardBrowserWebWorkerEnv||p.isReactNative(n)?c.setContentType(void 0):p.isFunction(n.getHeaders)&&Rc(c,n.getHeaders(),r("formDataHeaderPolicy"))),J.hasStandardBrowserEnv&&(p.isFunction(i)&&(i=i(t)),i===!0||i==null&&fc(t.url))){const b=s&&o&&mc.read(o);b&&c.set(s,b)}return t}const Cc=typeof XMLHttpRequest<"u",Oc=Cc&&function(e){return new Promise(function(r,n){const i=Ri(e);let s=i.data;const o=re.from(i.headers).normalize();let{responseType:c,onUploadProgress:l,onDownloadProgress:d}=i,u,h,m,b,S;function j(){b&&b(),S&&S(),i.cancelToken&&i.cancelToken.unsubscribe(u),i.signal&&i.signal.removeEventListener("abort",u)}let v=new XMLHttpRequest;v.open(i.method.toUpperCase(),i.url,!0),v.timeout=i.timeout;function f(){if(!v)return;const y=re.from("getAllResponseHeaders"in v&&v.getAllResponseHeaders()),w={data:!c||c==="text"||c==="json"?v.responseText:v.response,status:v.status,statusText:v.statusText,headers:y,config:e,request:v};Ei(function(C){r(C),j()},function(C){n(C),j()},w),v=null}"onloadend"in v?v.onloadend=f:v.onreadystatechange=function(){!v||v.readyState!==4||v.status===0&&!(v.responseURL&&v.responseURL.startsWith("file:"))||setTimeout(f)},v.onabort=function(){v&&(n(new R("Request aborted",R.ECONNABORTED,e,v)),j(),v=null)},v.onerror=function(k){const w=k&&k.message?k.message:"Network Error",E=new R(w,R.ERR_NETWORK,e,v);E.event=k||null,n(E),j(),v=null},v.ontimeout=function(){let k=i.timeout?"timeout of "+i.timeout+"ms exceeded":"timeout exceeded";const w=i.transitional||Cr;i.timeoutErrorMessage&&(k=i.timeoutErrorMessage),n(new R(k,w.clarifyTimeoutError?R.ETIMEDOUT:R.ECONNABORTED,e,v)),j(),v=null},s===void 0&&o.setContentType(null),"setRequestHeader"in v&&p.forEach(mi(o),function(k,w){v.setRequestHeader(w,k)}),p.isUndefined(i.withCredentials)||(v.withCredentials=!!i.withCredentials),c&&c!=="json"&&(v.responseType=i.responseType),d&&([m,S]=Ot(d,!0),v.addEventListener("progress",m)),l&&v.upload&&([h,b]=Ot(l),v.upload.addEventListener("progress",h),v.upload.addEventListener("loadend",b)),(i.cancelToken||i.signal)&&(u=y=>{v&&(n(!y||y.type?new ht(null,e,v):y),v.abort(),j(),v=null)},i.cancelToken&&i.cancelToken.subscribe(u),i.signal&&(i.signal.aborted?u():i.signal.addEventListener("abort",u)));const A=dc(i.url);if(A&&!J.protocols.includes(A)){n(new R("Unsupported protocol "+A+":",R.ERR_BAD_REQUEST,e)),j();return}v.send(s||null)})},Pc=(e,t)=>{if(e=e?e.filter(Boolean):[],!t&&!e.length)return;const r=new AbortController;let n=!1;const i=function(l){if(!n){n=!0,o();const d=l instanceof Error?l:this.reason;r.abort(d instanceof R?d:new ht(d instanceof Error?d.message:d))}};let s=t&&setTimeout(()=>{s=null,i(new R(`timeout of ${t}ms exceeded`,R.ETIMEDOUT))},t);const o=()=>{e&&(s&&clearTimeout(s),s=null,e.forEach(l=>{l.unsubscribe?l.unsubscribe(i):l.removeEventListener("abort",i)}),e=null)};e.forEach(l=>{if(!n){if(l.aborted){i.call(l);return}l.addEventListener("abort",i,{once:!0})}});const{signal:c}=r;return c.unsubscribe=()=>p.asap(o),c},_c=function*(e,t){let r=e.byteLength;if(r<t){yield e;return}let n=0,i;for(;n<r;)i=n+t,yield e.slice(n,i),n=i},Ic=async function*(e,t){for await(const r of Tc(e))yield*_c(r,t)},Tc=async function*(e){if(e[Symbol.asyncIterator]){yield*e;return}const t=e.getReader();try{for(;;){const{done:r,value:n}=await t.read();if(r)break;yield n}}finally{await t.cancel()}},un=(e,t,r,n)=>{const i=Ic(e,t);let s=0,o,c=l=>{o||(o=!0,n&&n(l))};return new ReadableStream({async pull(l){try{const{done:d,value:u}=await i.next();if(d){c(),l.close();return}let h=u.byteLength;if(r){let m=s+=h;r(m)}l.enqueue(new Uint8Array(u))}catch(d){throw c(d),d}},cancel(l){return c(l),i.return()}},{highWaterMark:2})},dn=e=>e>=48&&e<=57||e>=65&&e<=70||e>=97&&e<=102,ki=(e,t,r)=>t+2<r&&dn(e.charCodeAt(t+1))&&dn(e.charCodeAt(t+2)),hn=e=>e<=57?e-48:(e&223)-55,Lc=e=>e>=65&&e<=90||e>=97&&e<=122||e>=48&&e<=57||e===43||e===47||e===45||e===95,Mc=e=>e===9||e===10||e===12||e===13||e===32,Dc=e=>{const t=Math.floor(e/4),r=e%4;return t*3+(r===2?1:r===3?2:0)},zc=e=>{const t=e.length;let r=0;return t>0&&e.charCodeAt(t-1)===61&&(r++,t>1&&e.charCodeAt(t-2)===61&&r++),Math.floor((t-r)*3/4)},Fc=e=>{const t=e.length;let r=0,n=0,i=!1;for(let s=0;s<t;s++){let o=e.charCodeAt(s);if(o===37&&ki(e,s,t)&&(o=hn(e.charCodeAt(s+1))*16+hn(e.charCodeAt(s+2)),s+=2),!Mc(o)){if(o===61){n++;continue}if(!Lc(o)||n>0){i=!0;continue}r++}}return i||n>2||n>0&&(r+n)%4!==0||r%4===1?zc(e):Dc(r)},Nc=(e,t)=>{if(!e||typeof e!="string"||!e.startsWith("data:"))return 0;const r=e.indexOf(",");if(r<0)return 0;const n=e.slice(5,r),i=e.slice(r+1);if(/;base64/i.test(n))return t(i);let o=0;for(let c=0,l=i.length;c<l;c++){const d=i.charCodeAt(c);if(d===37&&ki(i,c,l))o+=1,c+=2;else if(d<128)o+=1;else if(d<2048)o+=2;else if(d>=55296&&d<=56319&&c+1<l){const u=i.charCodeAt(c+1);u>=56320&&u<=57343?(o+=4,c++):o+=3}else o+=3}return o};function Bc(e){const t=typeof e=="string"?e.indexOf("#"):-1;return Nc(t===-1?e:e.slice(0,t),Fc)}const Pr="1.19.0",pn=64*1024,{isFunction:bt}=p,$c=e=>encodeURIComponent(e).replace(/%([0-9A-F]{2})/gi,(t,r)=>String.fromCharCode(parseInt(r,16))),fn=e=>{if(!p.isString(e))return e;try{return decodeURIComponent(e)}catch{return e}},mn=(e,...t)=>{try{return!!e(...t)}catch{return!1}},Uc=e=>{const t=e.indexOf("://");let r=e;return t!==-1&&(r=r.slice(t+3)),r.includes("@")||r.includes(":")},Hc=e=>{const t=p.global!==void 0&&p.global!==null?p.global:globalThis,{ReadableStream:r,TextEncoder:n}=t;e=p.merge.call({skipUndefined:!0},{Request:t.Request,Response:t.Response},e);const{fetch:i,Request:s,Response:o}=e,c=i?bt(i):typeof fetch=="function",l=bt(s),d=bt(o);if(!c)return!1;const u=c&&bt(r),h=c&&(typeof n=="function"?(f=>A=>f.encode(A))(new n):async f=>new Uint8Array(await new s(f).arrayBuffer())),m=l&&u&&mn(()=>{let f=!1;const A=new s(J.origin,{body:new r,method:"POST",get duplex(){return f=!0,"half"}}),y=A.headers.has("Content-Type");return A.body!=null&&A.body.cancel(),f&&!y}),b=d&&u&&mn(()=>p.isReadableStream(new o("").body)),S={stream:b&&(f=>f.body)};c&&["text","arrayBuffer","blob","formData","stream"].forEach(f=>{!S[f]&&(S[f]=(A,y)=>{let k=A&&A[f];if(k)return k.call(A);throw new R(`Response type '${f}' is not supported`,R.ERR_NOT_SUPPORT,y)})});const j=async f=>{if(f==null)return 0;if(p.isBlob(f))return f.size;if(p.isSpecCompliantForm(f))return(await new s(J.origin,{method:"POST",body:f}).arrayBuffer()).byteLength;if(p.isArrayBufferView(f)||p.isArrayBuffer(f))return f.byteLength;if(p.isURLSearchParams(f)&&(f=f+""),p.isString(f))return(await h(f)).byteLength},v=async(f,A)=>{const y=p.toFiniteNumber(f.getContentLength());return y??j(A)};return async f=>{let{url:A,method:y,data:k,signal:w,cancelToken:E,timeout:C,onDownloadProgress:O,onUploadProgress:L,responseType:T,headers:q,withCredentials:oe="same-origin",fetchOptions:le,maxContentLength:ie,maxBodyLength:we}=Ri(f);const Se=p.isNumber(ie)&&ie>-1,Re=p.isNumber(we)&&we>-1,Ye=z=>p.hasOwnProp(f,z)?f[z]:void 0;let Je=i||fetch;T=T?(T+"").toLowerCase():"text";let xe=Pc([w,E&&E.toAbortSignal()],C),_=null;const K=xe&&xe.unsubscribe&&(()=>{xe.unsubscribe()});let Z,ue=null;const Xe=()=>new R("Request body larger than maxBodyLength limit",R.ERR_BAD_REQUEST,f,_);try{let z;const ae=Ye("auth");if(ae){const D=p.getSafeProp(ae,"username")||"",ee=p.getSafeProp(ae,"password")||"";z={username:D,password:ee}}if(Uc(A)){const D=new URL(A,J.origin);if(!z&&(D.username||D.password)){const ee=fn(D.username),be=fn(D.password);z={username:ee,password:be}}(D.username||D.password)&&(D.username="",D.password="",A=D.href)}if(z&&(q.delete("authorization"),q.set("Authorization","Basic "+btoa($c((z.username||"")+":"+(z.password||""))))),Se&&typeof A=="string"&&A.startsWith("data:")&&Bc(A)>ie)throw new R("maxContentLength size of "+ie+" exceeded",R.ERR_BAD_RESPONSE,f,_);if(Re&&y!=="get"&&y!=="head"){const D=await j(k);if(typeof D=="number"&&isFinite(D)&&(Z=D,D>we))throw Xe()}const ke=Re&&(p.isReadableStream(k)||p.isStream(k)),de=(D,ee,be)=>un(D,pn,Ae=>{if(Re&&Ae>we)throw ue=Xe();ee&&ee(Ae)},be);if(m&&y!=="get"&&y!=="head"&&(L||ke)){if(Z=Z??await v(q,k),Z!==0||ke){let D=new s(A,{method:"POST",body:k,duplex:"half"}),ee;if(p.isFormData(k)&&(ee=D.headers.get("content-type"))&&q.setContentType(ee),D.body){const[be,Ae]=L&&sn(Z,Ot(on(L)))||[];k=de(D.body,be,Ae)}}}else if(ke&&!l&&u&&y!=="get"&&y!=="head")k=de(k);else if(ke&&l&&!m&&y!=="get"&&y!=="head")throw new R("Stream request bodies are not supported by the current fetch implementation",R.ERR_NOT_SUPPORT,f,_);p.isString(oe)||(oe=oe?"include":"omit");const Fe=l&&"credentials"in s.prototype;if(p.isFormData(k)){const D=q.getContentType();D&&/^multipart\/form-data/i.test(D)&&!/boundary=/i.test(D)&&q.delete("content-type")}q.set("User-Agent","axios/"+Pr,!1);const he={...le,signal:xe,method:y.toUpperCase(),headers:mi(q.normalize()),body:k,duplex:"half",credentials:Fe?oe:void 0};_=l&&new s(A,he);let se=await(l?Je(_,le):Je(A,he));const Ce=re.from(se.headers);if(Se){const D=p.toFiniteNumber(Ce.getContentLength());if(D!=null&&D>ie)throw new R("maxContentLength size of "+ie+" exceeded",R.ERR_BAD_RESPONSE,f,_)}const pe=b&&(T==="stream"||T==="response");if(b&&se.body&&(O||Se||pe&&K)){const D={};["status","statusText","headers"].forEach(Oe=>{D[Oe]=se[Oe]});const ee=p.toFiniteNumber(Ce.getContentLength()),[be,Ae]=O&&sn(ee,Ot(on(O),!0))||[];let Ze=0;const et=Oe=>{if(Se&&(Ze=Oe,Ze>ie))throw new R("maxContentLength size of "+ie+" exceeded",R.ERR_BAD_RESPONSE,f,_);be&&be(Oe)};se=new o(un(se.body,pn,et,()=>{Ae&&Ae(),K&&K()}),D)}T=T||"text";let fe=await S[p.findKey(S,T)||"text"](se,f);if(Se&&!b&&!pe){let D;if(fe!=null&&(typeof fe.byteLength=="number"?D=fe.byteLength:typeof fe.size=="number"?D=fe.size:typeof fe=="string"&&(D=typeof n=="function"?new n().encode(fe).byteLength:fe.length)),typeof D=="number"&&D>ie)throw new R("maxContentLength size of "+ie+" exceeded",R.ERR_BAD_RESPONSE,f,_)}return!pe&&K&&K(),await new Promise((D,ee)=>{Ei(D,ee,{data:fe,headers:re.from(se.headers),status:se.status,statusText:se.statusText,config:f,request:_})})}catch(z){if(K&&K(),xe&&xe.aborted&&xe.reason instanceof R){const ae=xe.reason;throw ae.config=f,_&&(ae.request=_),z!==ae&&Object.defineProperty(ae,"cause",{__proto__:null,value:z,writable:!0,enumerable:!1,configurable:!0}),ae}if(ue)throw _&&!ue.request&&(ue.request=_),ue;if(z instanceof R)throw _&&!z.request&&(z.request=_),z;if(z&&z.name==="TypeError"&&/Load failed|fetch/i.test(z.message)){const ae=new R("Network Error",R.ERR_NETWORK,f,_,z&&z.response);throw Object.defineProperty(ae,"cause",{__proto__:null,value:z.cause||z,writable:!0,enumerable:!1,configurable:!0}),ae}throw R.from(z,z&&z.code,f,_,z&&z.response)}}},qc=new Map,Ci=e=>{let t=e&&e.env||{};const{fetch:r,Request:n,Response:i}=t,s=[n,i,r];let o=s.length,c=o,l,d,u=qc;for(;c--;)l=s[c],d=u.get(l),d===void 0&&u.set(l,d=c?new Map:Hc(t)),u=d;return d};Ci();const _r={http:Go,xhr:Oc,fetch:{get:Ci}};p.forEach(_r,(e,t)=>{if(e){try{Object.defineProperty(e,"name",{__proto__:null,value:t})}catch{}Object.defineProperty(e,"adapterName",{__proto__:null,value:t})}});const gn=e=>`- ${e}`,Vc=e=>p.isFunction(e)||e===null||e===!1;function Wc(e,t){e=p.isArray(e)?e:[e];const{length:r}=e;let n,i;const s={};for(let o=0;o<r;o++){n=e[o];let c;if(i=n,!Vc(n)&&(i=_r[(c=String(n)).toLowerCase()],i===void 0))throw new R(`Unknown adapter '${c}'`);if(i&&(p.isFunction(i)||(i=i.get(t))))break;s[c||"#"+o]=i}if(!i){const o=Object.entries(s).map(([l,d])=>`adapter ${l} `+(d===!1?"is not supported by the environment":"is not available in the build"));let c=r?o.length>1?`since :
`+o.map(gn).join(`
`):" "+gn(o[0]):"as no adapter specified";throw new R("There is no suitable adapter to dispatch the request "+c,R.ERR_NOT_SUPPORT)}return i}const Oi={getAdapter:Wc,adapters:_r};function Kt(e){if(e.cancelToken&&e.cancelToken.throwIfRequested(),e.signal&&e.signal.aborted)throw new ht(null,e)}function Gt(e){return Kt(e),e.headers=re.from(e.headers),e.data=Qt.call(e,e.transformRequest),["post","put","patch"].indexOf(e.method)!==-1&&e.headers.setContentType("application/x-www-form-urlencoded",!1),Oi.getAdapter(e.adapter||dt.adapter,e)(e).then(function(n){Kt(e),e.response=n;try{n.data=Qt.call(e,e.transformResponse,n)}finally{delete e.response}return n.headers=re.from(n.headers),n},function(n){if(!Ai(n)&&(Kt(e),n&&n.response)){e.response=n.response;try{n.response.data=Qt.call(e,e.transformResponse,n.response)}finally{delete e.response}n.response.headers=re.from(n.response.headers)}return Promise.reject(n)})}const Nt={};["object","boolean","number","function","string","symbol"].forEach((e,t)=>{Nt[e]=function(n){return typeof n===e||"a"+(t<1?"n ":" ")+e}});const xn={};Nt.transitional=function(t,r,n){function i(s,o){return"[Axios v"+Pr+"] Transitional option '"+s+"'"+o+(n?". "+n:"")}return(s,o,c)=>{if(t===!1)throw new R(i(o," has been removed"+(r?" in "+r:"")),R.ERR_DEPRECATED);return r&&!xn[o]&&(xn[o]=!0,console.warn(i(o," has been deprecated since v"+r+" and will be removed in the near future"))),t?t(s,o,c):!0}};Nt.spelling=function(t){return(r,n)=>(console.warn(`${n} is likely a misspelling of ${t}`),!0)};function Qc(e,t,r){if(typeof e!="object"||e===null)throw new R("options must be an object",R.ERR_BAD_OPTION_VALUE);const n=Object.keys(e);let i=n.length;for(;i-- >0;){const s=n[i],o=Object.prototype.hasOwnProperty.call(t,s)?t[s]:void 0;if(o){const c=e[s],l=c===void 0||o(c,s,e);if(l!==!0)throw new R("option "+s+" must be "+l,R.ERR_BAD_OPTION_VALUE);continue}if(r!==!0)throw new R("Unknown option "+s,R.ERR_BAD_OPTION)}}const St={assertOptions:Qc,validators:Nt},te=St.validators;let Ie=class{constructor(t){this.defaults=t||{},this.interceptors={request:new nn,response:new nn}}async request(t,r){try{return await this._request(t,r)}catch(n){if(n instanceof Error){let i={};Error.captureStackTrace?Error.captureStackTrace(i):i=new Error;const s=(()=>{if(!i.stack)return"";const o=i.stack.indexOf(`
`);return o===-1?"":i.stack.slice(o+1)})();try{if(!n.stack)n.stack=s;else if(s){const o=s.indexOf(`
`),c=o===-1?-1:s.indexOf(`
`,o+1),l=c===-1?"":s.slice(c+1);String(n.stack).endsWith(l)||(n.stack+=`
`+s)}}catch{}}throw n}}_request(t,r){typeof t=="string"?(r=r||{},r.url=t):r=t||{},r=Me(this.defaults,r);const{transitional:n,paramsSerializer:i,headers:s}=r;n!==void 0&&St.assertOptions(n,{silentJSONParsing:te.transitional(te.boolean),forcedJSONParsing:te.transitional(te.boolean),clarifyTimeoutError:te.transitional(te.boolean),legacyInterceptorReqResOrdering:te.transitional(te.boolean),advertiseZstdAcceptEncoding:te.transitional(te.boolean),validateStatusUndefinedResolves:te.transitional(te.boolean)},!1),i!=null&&(p.isFunction(i)?r.paramsSerializer={serialize:i}:St.assertOptions(i,{encode:te.function,serialize:te.function},!0)),r.allowAbsoluteUrls!==void 0||(this.defaults.allowAbsoluteUrls!==void 0?r.allowAbsoluteUrls=this.defaults.allowAbsoluteUrls:r.allowAbsoluteUrls=!0),St.assertOptions(r,{baseUrl:te.spelling("baseURL"),withXsrfToken:te.spelling("withXSRFToken")},!0),r.method=(r.method||this.defaults.method||"get").toLowerCase();let o=s&&p.merge(s.common,s[r.method]);s&&p.forEach(["delete","get","head","post","put","patch","query","common"],S=>{delete s[S]}),r.headers=re.concat(o,s);const c=[];let l=!0;this.interceptors.request.forEach(function(j){if(typeof j.runWhen=="function"&&j.runWhen(r)===!1)return;l=l&&j.synchronous;const v=r.transitional||Cr;v&&v.legacyInterceptorReqResOrdering?c.unshift(j.fulfilled,j.rejected):c.push(j.fulfilled,j.rejected)});const d=[];this.interceptors.response.forEach(function(j){d.push(j.fulfilled,j.rejected)});let u,h=0,m;if(!l){const S=[Gt.bind(this),void 0];for(S.unshift(...c),S.push(...d),m=S.length,u=Promise.resolve(r);h<m;)u=u.then(S[h++],S[h++]);return u}m=c.length;let b=r;for(;h<m;){const S=c[h++],j=c[h++];try{b=S?S(b):b}catch(v){if(!j){u=Promise.reject(v);break}try{const f=j.call(this,v);p.isThenable(f)&&(u=Promise.resolve(f).then(()=>Gt.call(this,b)))}catch(f){u=Promise.reject(f)}break}}if(!u)try{u=Gt.call(this,b)}catch(S){u=Promise.reject(S)}for(h=0,m=d.length;h<m;)u=u.then(d[h++],d[h++]);return u}getUri(t){t=Me(this.defaults,t);const r=ji(t.baseURL,t.url,t.allowAbsoluteUrls,t);return vi(r,t.params,t.paramsSerializer)}};p.forEach(["delete","get","head","options"],function(t){Ie.prototype[t]=function(r,n){return this.request(Me(n||{},{method:t,url:r,data:n&&p.hasOwnProp(n,"data")?n.data:void 0}))}});p.forEach(["post","put","patch","query"],function(t){function r(n){return function(s,o,c){return this.request(Me(c||{},{method:t,headers:n?{"Content-Type":"multipart/form-data"}:{},url:s,data:o}))}}Ie.prototype[t]=r(),t!=="query"&&(Ie.prototype[t+"Form"]=r(!0))});let Kc=class Pi{constructor(t){if(typeof t!="function")throw new TypeError("executor must be a function.");let r;this.promise=new Promise(function(s){r=s});const n=this;this.promise.then(i=>{if(!n._listeners)return;let s=n._listeners.length;for(;s-- >0;)n._listeners[s](i);n._listeners=null}),this.promise.then=i=>{let s;const o=new Promise(c=>{n.subscribe(c),s=c}).then(i);return o.cancel=function(){n.unsubscribe(s)},o},t(function(s,o,c){n.reason||(n.reason=new ht(s,o,c),r(n.reason))})}throwIfRequested(){if(this.reason)throw this.reason}subscribe(t){if(this.reason){t(this.reason);return}this._listeners?this._listeners.push(t):this._listeners=[t]}unsubscribe(t){if(!this._listeners)return;const r=this._listeners.indexOf(t);r!==-1&&this._listeners.splice(r,1)}toAbortSignal(){const t=new AbortController,r=n=>{t.abort(n)};return this.subscribe(r),t.signal.unsubscribe=()=>this.unsubscribe(r),t.signal}static source(){let t;return{token:new Pi(function(i){t=i}),cancel:t}}};function Gc(e){return function(r){return e.apply(null,r)}}function Yc(e){return p.isObject(e)&&e.isAxiosError===!0}const dr={Continue:100,SwitchingProtocols:101,Processing:102,EarlyHints:103,Ok:200,Created:201,Accepted:202,NonAuthoritativeInformation:203,NoContent:204,ResetContent:205,PartialContent:206,MultiStatus:207,AlreadyReported:208,ImUsed:226,MultipleChoices:300,MovedPermanently:301,Found:302,SeeOther:303,NotModified:304,UseProxy:305,Unused:306,TemporaryRedirect:307,PermanentRedirect:308,BadRequest:400,Unauthorized:401,PaymentRequired:402,Forbidden:403,NotFound:404,MethodNotAllowed:405,NotAcceptable:406,ProxyAuthenticationRequired:407,RequestTimeout:408,Conflict:409,Gone:410,LengthRequired:411,PreconditionFailed:412,PayloadTooLarge:413,UriTooLong:414,UnsupportedMediaType:415,RangeNotSatisfiable:416,ExpectationFailed:417,ImATeapot:418,MisdirectedRequest:421,UnprocessableEntity:422,Locked:423,FailedDependency:424,TooEarly:425,UpgradeRequired:426,PreconditionRequired:428,TooManyRequests:429,RequestHeaderFieldsTooLarge:431,UnavailableForLegalReasons:451,InternalServerError:500,NotImplemented:501,BadGateway:502,ServiceUnavailable:503,GatewayTimeout:504,HttpVersionNotSupported:505,VariantAlsoNegotiates:506,InsufficientStorage:507,LoopDetected:508,NotExtended:510,NetworkAuthenticationRequired:511,WebServerReturnsAnUnknownError:520,WebServerIsDown:521,ConnectionTimedOut:522,OriginIsUnreachable:523,TimeoutOccurred:524,SslHandshakeFailed:525,InvalidSslCertificate:526};Object.entries(dr).forEach(([e,t])=>{dr[t]=e});function _i(e){const t=new Ie(e),r=si(Ie.prototype.request,t);return p.extend(r,Ie.prototype,t,{allOwnKeys:!0}),p.extend(r,t,null,{allOwnKeys:!0}),r.create=function(i){return _i(Me(e,i))},r}const W=_i(dt);W.Axios=Ie;W.CanceledError=ht;W.CancelToken=Kc;W.isCancel=Ai;W.VERSION=Pr;W.toFormData=Ft;W.AxiosError=R;W.Cancel=W.CanceledError;W.all=function(t){return Promise.all(t)};W.spread=Gc;W.isAxiosError=Yc;W.mergeConfig=Me;W.AxiosHeaders=re;W.formToJSON=e=>Si(p.isHTMLForm(e)?new FormData(e):e);W.getAdapter=Oi.getAdapter;W.HttpStatusCode=dr;W.default=W;const{Axios:a1,AxiosError:s1,CanceledError:o1,isCancel:c1,CancelToken:l1,VERSION:u1,all:d1,Cancel:h1,isAxiosError:p1,spread:f1,toFormData:m1,AxiosHeaders:g1,HttpStatusCode:x1,formToJSON:b1,getAdapter:y1,mergeConfig:v1,create:w1}=W,pt="aniraku-watch-history",hr="aniraku:watch-history-changed",Pt=e=>`${String((e==null?void 0:e.animeId)??(e==null?void 0:e.anime_id)??"")}:${Number((e==null?void 0:e.episode)??(e==null?void 0:e.episode_number)??0)}`,Ii=()=>{try{const e=JSON.parse(localStorage.getItem(pt)||"[]");return Array.isArray(e)?e:[]}catch{return[]}},Ir=e=>{window.dispatchEvent(new CustomEvent(hr,{detail:e}))},S1=e=>{const t=Ii(),r=Pt(e),n=[e,...t.filter(i=>Pt(i)!==r)].slice(0,100);return localStorage.setItem(pt,JSON.stringify(n)),Ir({type:"upsert",entries:[e],keys:[r]}),n},A1=async({entries:e,userId:t})=>{const r=new Set((e||[]).map(Pt));if(!r.size)return[];const n=Ii().filter(i=>!r.has(Pt(i)));return localStorage.setItem(pt,JSON.stringify(n)),Ir({type:"remove",keys:[...r]}),t&&await Promise.all((e||[]).map(i=>B.from("watch_history").delete().eq("user_id",t).eq("anime_id",Number(i.animeId??i.anime_id)).eq("episode_number",Number(i.episode??i.episode_number)))),n},E1=async({userId:e}={})=>{localStorage.removeItem(pt),Ir({type:"clear",keys:[]}),e&&await B.from("watch_history").delete().eq("user_id",e)},Jc=e=>{const t=n=>e(n.detail||{}),r=n=>{n.key===pt&&e({type:"storage",keys:[]})};return window.addEventListener(hr,t),window.addEventListener("storage",r),()=>{window.removeEventListener(hr,t),window.removeEventListener("storage",r)}},Xc=x.section`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 1rem 0.5rem;
`,Zc=x.h2`
  color: #fff;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &::before {
    content: '';
    width: 4px;
    height: 1.1em;
    background: var(--accent);
    border-radius: 2px;
  }
`,el=x.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
`,tl=x(F)`
  flex: 0 0 160px;
  background: var(--bg-card);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  text-decoration: none;
  color: var(--text-primary);
  transition: transform 0.15s, border-color 0.15s;
  &:hover {
    transform: translateY(-3px);
    border-color: var(--accent);
  }
  @media (max-width: 480px) {
    flex: 0 0 130px;
  }
`,rl=x.div`
  position: relative;
  height: 100px;
  background: var(--bg-elevated);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`,nl=x.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: rgba(255,255,255,0.15);
  span {
    display: block;
    height: 100%;
    background: var(--accent);
    width: ${e=>e.value||0}%;
  }
`,il=x.div`
  padding: 8px 10px 10px;
  p {
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  small {
    color: #888;
    font-size: 11px;
  }
`,al=()=>{const{user:e}=Dt(),[t,r]=g.useState([]),[n,i]=g.useState(0);g.useEffect(()=>{if(!e)return;let o=!1;return B.auth.getSession().then(({data:{session:c}})=>{o||!(c!=null&&c.access_token)||W.get(`${Ve}/api/v1/continue-watching`,{headers:{Authorization:`Bearer ${c.access_token}`}}).then(l=>{!o&&Array.isArray(l.data)&&r(l.data)}).catch(()=>{})}),()=>{o=!0}},[e]),g.useEffect(()=>Jc(()=>{i(o=>o+1)}),[]);const s=g.useMemo(()=>{const o=[];try{o.push(...JSON.parse(localStorage.getItem("aniraku-watch-history")||"[]"))}catch{}const c=new Map,l=u=>{const h=`${u.animeId}-${u.episode||u.episode_number}`,m=u.title??u.anime_title??`Anime ${u.animeId}`,b=typeof m=="object"&&m!==null?m.english||m.romaji||m.userPreferred||m.native||`Anime ${u.animeId}`:String(m),S={animeId:u.animeId,title:b,image:u.image||u.anime_image||"",episode:u.episode||u.episode_number,time:u.time??u.progress??0,duration:u.duration||0,timestamp:u.timestamp||0},j=c.get(h);(!j||S.timestamp>j.timestamp)&&c.set(h,S)};t.forEach(l),o.forEach(l);const d=[...c.values()];return d.sort((u,h)=>h.timestamp-u.timestamp),d.slice(0,12)},[t,n]);return s.length?a.jsxs(Xc,{children:[a.jsx(Zc,{children:"Continue Watching"}),a.jsx(el,{children:s.map((o,c)=>a.jsxs(tl,{to:`/watch/${ct(o.title)}-${o.animeId}-episode-${o.episode}`,children:[a.jsxs(rl,{children:[o.image?a.jsx("img",{src:o.image,alt:"",loading:"lazy"}):a.jsx("div",{style:{height:"100%",background:"#222"}}),a.jsx(nl,{value:o.duration?Math.min(100,o.time/o.duration*100):30,children:a.jsx("span",{})})]}),a.jsxs(il,{children:[a.jsx("p",{children:o.title||`Anime ${o.animeId}`}),a.jsxs("small",{children:["Ep ",o.episode]})]})]},`${o.animeId}-${o.episode}-${c}`))})]}):null};class ft{constructor(){this.listeners=new Set,this.subscribe=this.subscribe.bind(this)}subscribe(t){const r={listener:t};return this.listeners.add(r),this.onSubscribe(),()=>{this.listeners.delete(r),this.onUnsubscribe()}}hasListeners(){return this.listeners.size>0}onSubscribe(){}onUnsubscribe(){}}const ot=typeof window>"u"||"Deno"in window;function me(){}function sl(e,t){return typeof e=="function"?e(t):e}function pr(e){return typeof e=="number"&&e>=0&&e!==1/0}function Ti(e,t){return Math.max(e+(t||0)-Date.now(),0)}function it(e,t,r){return Bt(e)?typeof t=="function"?{...r,queryKey:e,queryFn:t}:{...t,queryKey:e}:e}function je(e,t,r){return Bt(e)?[{...t,queryKey:e},r]:[e||{},t]}function bn(e,t){const{type:r="all",exact:n,fetchStatus:i,predicate:s,queryKey:o,stale:c}=e;if(Bt(o)){if(n){if(t.queryHash!==Tr(o,t.options))return!1}else if(!_t(t.queryKey,o))return!1}if(r!=="all"){const l=t.isActive();if(r==="active"&&!l||r==="inactive"&&l)return!1}return!(typeof c=="boolean"&&t.isStale()!==c||typeof i<"u"&&i!==t.state.fetchStatus||s&&!s(t))}function yn(e,t){const{exact:r,fetching:n,predicate:i,mutationKey:s}=e;if(Bt(s)){if(!t.options.mutationKey)return!1;if(r){if(_e(t.options.mutationKey)!==_e(s))return!1}else if(!_t(t.options.mutationKey,s))return!1}return!(typeof n=="boolean"&&t.state.status==="loading"!==n||i&&!i(t))}function Tr(e,t){return((t==null?void 0:t.queryKeyHashFn)||_e)(e)}function _e(e){return JSON.stringify(e,(t,r)=>mr(r)?Object.keys(r).sort().reduce((n,i)=>(n[i]=r[i],n),{}):r)}function _t(e,t){return Li(e,t)}function Li(e,t){return e===t?!0:typeof e!=typeof t?!1:e&&t&&typeof e=="object"&&typeof t=="object"?!Object.keys(t).some(r=>!Li(e[r],t[r])):!1}function Mi(e,t,r=0){if(e===t)return e;if(r>500)return t;const n=vn(e)&&vn(t);if(n||mr(e)&&mr(t)){const i=n?e.length:Object.keys(e).length,s=n?t:Object.keys(t),o=s.length,c=n?[]:{};let l=0;for(let d=0;d<o;d++){const u=n?d:s[d];c[u]=Mi(e[u],t[u],r+1),c[u]===e[u]&&l++}return i===o&&l===i?e:c}return t}function fr(e,t){if(e&&!t||t&&!e)return!1;for(const r in e)if(e[r]!==t[r])return!1;return!0}function vn(e){return Array.isArray(e)&&e.length===Object.keys(e).length}function mr(e){if(!wn(e))return!1;const t=e.constructor;if(typeof t>"u")return!0;const r=t.prototype;return!(!wn(r)||!r.hasOwnProperty("isPrototypeOf"))}function wn(e){return Object.prototype.toString.call(e)==="[object Object]"}function Bt(e){return Array.isArray(e)}function Di(e){return new Promise(t=>{setTimeout(t,e)})}function Sn(e){Di(0).then(e)}function ol(){if(typeof AbortController=="function")return new AbortController}function gr(e,t,r){return r.isDataEqual!=null&&r.isDataEqual(e,t)?e:typeof r.structuralSharing=="function"?r.structuralSharing(e,t):r.structuralSharing!==!1?Mi(e,t):t}class cl extends ft{constructor(){super(),this.setup=t=>{if(!ot&&window.addEventListener){const r=()=>t();return window.addEventListener("visibilitychange",r,!1),window.addEventListener("focus",r,!1),()=>{window.removeEventListener("visibilitychange",r),window.removeEventListener("focus",r)}}}}onSubscribe(){this.cleanup||this.setEventListener(this.setup)}onUnsubscribe(){if(!this.hasListeners()){var t;(t=this.cleanup)==null||t.call(this),this.cleanup=void 0}}setEventListener(t){var r;this.setup=t,(r=this.cleanup)==null||r.call(this),this.cleanup=t(n=>{typeof n=="boolean"?this.setFocused(n):this.onFocus()})}setFocused(t){this.focused!==t&&(this.focused=t,this.onFocus())}onFocus(){this.listeners.forEach(({listener:t})=>{t()})}isFocused(){return typeof this.focused=="boolean"?this.focused:typeof document>"u"?!0:[void 0,"visible","prerender"].includes(document.visibilityState)}}const It=new cl,An=["online","offline"];class ll extends ft{constructor(){super(),this.setup=t=>{if(!ot&&window.addEventListener){const r=()=>t();return An.forEach(n=>{window.addEventListener(n,r,!1)}),()=>{An.forEach(n=>{window.removeEventListener(n,r)})}}}}onSubscribe(){this.cleanup||this.setEventListener(this.setup)}onUnsubscribe(){if(!this.hasListeners()){var t;(t=this.cleanup)==null||t.call(this),this.cleanup=void 0}}setEventListener(t){var r;this.setup=t,(r=this.cleanup)==null||r.call(this),this.cleanup=t(n=>{typeof n=="boolean"?this.setOnline(n):this.onOnline()})}setOnline(t){this.online!==t&&(this.online=t,this.onOnline())}onOnline(){this.listeners.forEach(({listener:t})=>{t()})}isOnline(){return typeof this.online=="boolean"?this.online:typeof navigator>"u"||typeof navigator.onLine>"u"?!0:navigator.onLine}}const Tt=new ll;function ul(e){return Math.min(1e3*2**e,3e4)}function $t(e){return(e??"online")==="online"?Tt.isOnline():!0}class zi{constructor(t){this.revert=t==null?void 0:t.revert,this.silent=t==null?void 0:t.silent}}function At(e){return e instanceof zi}function Fi(e){let t=!1,r=0,n=!1,i,s,o;const c=new Promise((v,f)=>{s=v,o=f}),l=v=>{n||(b(new zi(v)),e.abort==null||e.abort())},d=()=>{t=!0},u=()=>{t=!1},h=()=>!It.isFocused()||e.networkMode!=="always"&&!Tt.isOnline(),m=v=>{n||(n=!0,e.onSuccess==null||e.onSuccess(v),i==null||i(),s(v))},b=v=>{n||(n=!0,e.onError==null||e.onError(v),i==null||i(),o(v))},S=()=>new Promise(v=>{i=f=>{const A=n||!h();return A&&v(f),A},e.onPause==null||e.onPause()}).then(()=>{i=void 0,n||e.onContinue==null||e.onContinue()}),j=()=>{if(n)return;let v;try{v=e.fn()}catch(f){v=Promise.reject(f)}Promise.resolve(v).then(m).catch(f=>{var A,y;if(n)return;const k=(A=e.retry)!=null?A:3,w=(y=e.retryDelay)!=null?y:ul,E=typeof w=="function"?w(r,f):w,C=k===!0||typeof k=="number"&&r<k||typeof k=="function"&&k(r,f);if(t||!C){b(f);return}r++,e.onFail==null||e.onFail(r,f),Di(E).then(()=>{if(h())return S()}).then(()=>{t?b(f):j()})})};return $t(e.networkMode)?j():S().then(j),{promise:c,cancel:l,continue:()=>(i==null?void 0:i())?c:Promise.resolve(),cancelRetry:d,continueRetry:u}}const Lr=console;function dl(){let e=[],t=0,r=u=>{u()},n=u=>{u()};const i=u=>{let h;t++;try{h=u()}finally{t--,t||c()}return h},s=u=>{t?e.push(u):Sn(()=>{r(u)})},o=u=>(...h)=>{s(()=>{u(...h)})},c=()=>{const u=e;e=[],u.length&&Sn(()=>{n(()=>{u.forEach(h=>{r(h)})})})};return{batch:i,batchCalls:o,schedule:s,setNotifyFunction:u=>{r=u},setBatchNotifyFunction:u=>{n=u}}}const Q=dl();class Ni{destroy(){this.clearGcTimeout()}scheduleGc(){this.clearGcTimeout(),pr(this.cacheTime)&&(this.gcTimeout=setTimeout(()=>{this.optionalRemove()},this.cacheTime))}updateCacheTime(t){this.cacheTime=Math.max(this.cacheTime||0,t??(ot?1/0:300*1e3))}clearGcTimeout(){this.gcTimeout&&(clearTimeout(this.gcTimeout),this.gcTimeout=void 0)}}class hl extends Ni{constructor(t){super(),this.abortSignalConsumed=!1,this.defaultOptions=t.defaultOptions,this.setOptions(t.options),this.observers=[],this.cache=t.cache,this.logger=t.logger||Lr,this.queryKey=t.queryKey,this.queryHash=t.queryHash,this.initialState=t.state||pl(this.options),this.state=this.initialState,this.scheduleGc()}get meta(){return this.options.meta}setOptions(t){this.options={...this.defaultOptions,...t},this.updateCacheTime(this.options.cacheTime)}optionalRemove(){!this.observers.length&&this.state.fetchStatus==="idle"&&this.cache.remove(this)}setData(t,r){const n=gr(this.state.data,t,this.options);return this.dispatch({data:n,type:"success",dataUpdatedAt:r==null?void 0:r.updatedAt,manual:r==null?void 0:r.manual}),n}setState(t,r){this.dispatch({type:"setState",state:t,setStateOptions:r})}cancel(t){var r;const n=this.promise;return(r=this.retryer)==null||r.cancel(t),n?n.then(me).catch(me):Promise.resolve()}destroy(){super.destroy(),this.cancel({silent:!0})}reset(){this.destroy(),this.setState(this.initialState)}isActive(){return this.observers.some(t=>t.options.enabled!==!1)}isDisabled(){return this.getObserversCount()>0&&!this.isActive()}isStale(){return this.state.isInvalidated||!this.state.dataUpdatedAt||this.observers.some(t=>t.getCurrentResult().isStale)}isStaleByTime(t=0){return this.state.isInvalidated||!this.state.dataUpdatedAt||!Ti(this.state.dataUpdatedAt,t)}onFocus(){var t;const r=this.observers.find(n=>n.shouldFetchOnWindowFocus());r&&r.refetch({cancelRefetch:!1}),(t=this.retryer)==null||t.continue()}onOnline(){var t;const r=this.observers.find(n=>n.shouldFetchOnReconnect());r&&r.refetch({cancelRefetch:!1}),(t=this.retryer)==null||t.continue()}addObserver(t){this.observers.includes(t)||(this.observers.push(t),this.clearGcTimeout(),this.cache.notify({type:"observerAdded",query:this,observer:t}))}removeObserver(t){this.observers.includes(t)&&(this.observers=this.observers.filter(r=>r!==t),this.observers.length||(this.retryer&&(this.abortSignalConsumed?this.retryer.cancel({revert:!0}):this.retryer.cancelRetry()),this.scheduleGc()),this.cache.notify({type:"observerRemoved",query:this,observer:t}))}getObserversCount(){return this.observers.length}invalidate(){this.state.isInvalidated||this.dispatch({type:"invalidate"})}fetch(t,r){var n,i;if(this.state.fetchStatus!=="idle"){if(this.state.dataUpdatedAt&&r!=null&&r.cancelRefetch)this.cancel({silent:!0});else if(this.promise){var s;return(s=this.retryer)==null||s.continueRetry(),this.promise}}if(t&&this.setOptions(t),!this.options.queryFn){const b=this.observers.find(S=>S.options.queryFn);b&&this.setOptions(b.options)}const o=ol(),c={queryKey:this.queryKey,pageParam:void 0,meta:this.meta},l=b=>{Object.defineProperty(b,"signal",{enumerable:!0,get:()=>{if(o)return this.abortSignalConsumed=!0,o.signal}})};l(c);const d=()=>this.options.queryFn?(this.abortSignalConsumed=!1,this.options.queryFn(c)):Promise.reject("Missing queryFn for queryKey '"+this.options.queryHash+"'"),u={fetchOptions:r,options:this.options,queryKey:this.queryKey,state:this.state,fetchFn:d};if(l(u),(n=this.options.behavior)==null||n.onFetch(u),this.revertState=this.state,this.state.fetchStatus==="idle"||this.state.fetchMeta!==((i=u.fetchOptions)==null?void 0:i.meta)){var h;this.dispatch({type:"fetch",meta:(h=u.fetchOptions)==null?void 0:h.meta})}const m=b=>{if(At(b)&&b.silent||this.dispatch({type:"error",error:b}),!At(b)){var S,j,v,f;(S=(j=this.cache.config).onError)==null||S.call(j,b,this),(v=(f=this.cache.config).onSettled)==null||v.call(f,this.state.data,b,this)}this.isFetchingOptimistic||this.scheduleGc(),this.isFetchingOptimistic=!1};return this.retryer=Fi({fn:u.fetchFn,abort:o==null?void 0:o.abort.bind(o),onSuccess:b=>{var S,j,v,f;if(typeof b>"u"){m(new Error(this.queryHash+" data is undefined"));return}this.setData(b),(S=(j=this.cache.config).onSuccess)==null||S.call(j,b,this),(v=(f=this.cache.config).onSettled)==null||v.call(f,b,this.state.error,this),this.isFetchingOptimistic||this.scheduleGc(),this.isFetchingOptimistic=!1},onError:m,onFail:(b,S)=>{this.dispatch({type:"failed",failureCount:b,error:S})},onPause:()=>{this.dispatch({type:"pause"})},onContinue:()=>{this.dispatch({type:"continue"})},retry:u.options.retry,retryDelay:u.options.retryDelay,networkMode:u.options.networkMode}),this.promise=this.retryer.promise,this.promise}dispatch(t){const r=n=>{var i,s;switch(t.type){case"failed":return{...n,fetchFailureCount:t.failureCount,fetchFailureReason:t.error};case"pause":return{...n,fetchStatus:"paused"};case"continue":return{...n,fetchStatus:"fetching"};case"fetch":return{...n,fetchFailureCount:0,fetchFailureReason:null,fetchMeta:(i=t.meta)!=null?i:null,fetchStatus:$t(this.options.networkMode)?"fetching":"paused",...!n.dataUpdatedAt&&{error:null,status:"loading"}};case"success":return{...n,data:t.data,dataUpdateCount:n.dataUpdateCount+1,dataUpdatedAt:(s=t.dataUpdatedAt)!=null?s:Date.now(),error:null,isInvalidated:!1,status:"success",...!t.manual&&{fetchStatus:"idle",fetchFailureCount:0,fetchFailureReason:null}};case"error":const o=t.error;return At(o)&&o.revert&&this.revertState?{...this.revertState,fetchStatus:"idle"}:{...n,error:o,errorUpdateCount:n.errorUpdateCount+1,errorUpdatedAt:Date.now(),fetchFailureCount:n.fetchFailureCount+1,fetchFailureReason:o,fetchStatus:"idle",status:"error"};case"invalidate":return{...n,isInvalidated:!0};case"setState":return{...n,...t.state}}};this.state=r(this.state),Q.batch(()=>{this.observers.forEach(n=>{n.onQueryUpdate(t)}),this.cache.notify({query:this,type:"updated",action:t})})}}function pl(e){const t=typeof e.initialData=="function"?e.initialData():e.initialData,r=typeof t<"u",n=r?typeof e.initialDataUpdatedAt=="function"?e.initialDataUpdatedAt():e.initialDataUpdatedAt:0;return{data:t,dataUpdateCount:0,dataUpdatedAt:r?n??Date.now():0,error:null,errorUpdateCount:0,errorUpdatedAt:0,fetchFailureCount:0,fetchFailureReason:null,fetchMeta:null,isInvalidated:!1,status:r?"success":"loading",fetchStatus:"idle"}}class fl extends ft{constructor(t){super(),this.config=t||{},this.queries=[],this.queriesMap={}}build(t,r,n){var i;const s=r.queryKey,o=(i=r.queryHash)!=null?i:Tr(s,r);let c=this.get(o);return c||(c=new hl({cache:this,logger:t.getLogger(),queryKey:s,queryHash:o,options:t.defaultQueryOptions(r),state:n,defaultOptions:t.getQueryDefaults(s)}),this.add(c)),c}add(t){this.queriesMap[t.queryHash]||(this.queriesMap[t.queryHash]=t,this.queries.push(t),this.notify({type:"added",query:t}))}remove(t){const r=this.queriesMap[t.queryHash];r&&(t.destroy(),this.queries=this.queries.filter(n=>n!==t),r===t&&delete this.queriesMap[t.queryHash],this.notify({type:"removed",query:t}))}clear(){Q.batch(()=>{this.queries.forEach(t=>{this.remove(t)})})}get(t){return this.queriesMap[t]}getAll(){return this.queries}find(t,r){const[n]=je(t,r);return typeof n.exact>"u"&&(n.exact=!0),this.queries.find(i=>bn(n,i))}findAll(t,r){const[n]=je(t,r);return Object.keys(n).length>0?this.queries.filter(i=>bn(n,i)):this.queries}notify(t){Q.batch(()=>{this.listeners.forEach(({listener:r})=>{r(t)})})}onFocus(){Q.batch(()=>{this.queries.forEach(t=>{t.onFocus()})})}onOnline(){Q.batch(()=>{this.queries.forEach(t=>{t.onOnline()})})}}class ml extends Ni{constructor(t){super(),this.defaultOptions=t.defaultOptions,this.mutationId=t.mutationId,this.mutationCache=t.mutationCache,this.logger=t.logger||Lr,this.observers=[],this.state=t.state||gl(),this.setOptions(t.options),this.scheduleGc()}setOptions(t){this.options={...this.defaultOptions,...t},this.updateCacheTime(this.options.cacheTime)}get meta(){return this.options.meta}setState(t){this.dispatch({type:"setState",state:t})}addObserver(t){this.observers.includes(t)||(this.observers.push(t),this.clearGcTimeout(),this.mutationCache.notify({type:"observerAdded",mutation:this,observer:t}))}removeObserver(t){this.observers=this.observers.filter(r=>r!==t),this.scheduleGc(),this.mutationCache.notify({type:"observerRemoved",mutation:this,observer:t})}optionalRemove(){this.observers.length||(this.state.status==="loading"?this.scheduleGc():this.mutationCache.remove(this))}continue(){var t,r;return(t=(r=this.retryer)==null?void 0:r.continue())!=null?t:this.execute()}async execute(){const t=()=>{var C;return this.retryer=Fi({fn:()=>this.options.mutationFn?this.options.mutationFn(this.state.variables):Promise.reject("No mutationFn found"),onFail:(O,L)=>{this.dispatch({type:"failed",failureCount:O,error:L})},onPause:()=>{this.dispatch({type:"pause"})},onContinue:()=>{this.dispatch({type:"continue"})},retry:(C=this.options.retry)!=null?C:0,retryDelay:this.options.retryDelay,networkMode:this.options.networkMode}),this.retryer.promise},r=this.state.status==="loading";try{var n,i,s,o,c,l,d,u;if(!r){var h,m,b,S;this.dispatch({type:"loading",variables:this.options.variables}),await((h=(m=this.mutationCache.config).onMutate)==null?void 0:h.call(m,this.state.variables,this));const O=await((b=(S=this.options).onMutate)==null?void 0:b.call(S,this.state.variables));O!==this.state.context&&this.dispatch({type:"loading",context:O,variables:this.state.variables})}const C=await t();return await((n=(i=this.mutationCache.config).onSuccess)==null?void 0:n.call(i,C,this.state.variables,this.state.context,this)),await((s=(o=this.options).onSuccess)==null?void 0:s.call(o,C,this.state.variables,this.state.context)),await((c=(l=this.mutationCache.config).onSettled)==null?void 0:c.call(l,C,null,this.state.variables,this.state.context,this)),await((d=(u=this.options).onSettled)==null?void 0:d.call(u,C,null,this.state.variables,this.state.context)),this.dispatch({type:"success",data:C}),C}catch(C){try{var j,v,f,A,y,k,w,E;throw await((j=(v=this.mutationCache.config).onError)==null?void 0:j.call(v,C,this.state.variables,this.state.context,this)),await((f=(A=this.options).onError)==null?void 0:f.call(A,C,this.state.variables,this.state.context)),await((y=(k=this.mutationCache.config).onSettled)==null?void 0:y.call(k,void 0,C,this.state.variables,this.state.context,this)),await((w=(E=this.options).onSettled)==null?void 0:w.call(E,void 0,C,this.state.variables,this.state.context)),C}finally{this.dispatch({type:"error",error:C})}}}dispatch(t){const r=n=>{switch(t.type){case"failed":return{...n,failureCount:t.failureCount,failureReason:t.error};case"pause":return{...n,isPaused:!0};case"continue":return{...n,isPaused:!1};case"loading":return{...n,context:t.context,data:void 0,failureCount:0,failureReason:null,error:null,isPaused:!$t(this.options.networkMode),status:"loading",variables:t.variables};case"success":return{...n,data:t.data,failureCount:0,failureReason:null,error:null,status:"success",isPaused:!1};case"error":return{...n,data:void 0,error:t.error,failureCount:n.failureCount+1,failureReason:t.error,isPaused:!1,status:"error"};case"setState":return{...n,...t.state}}};this.state=r(this.state),Q.batch(()=>{this.observers.forEach(n=>{n.onMutationUpdate(t)}),this.mutationCache.notify({mutation:this,type:"updated",action:t})})}}function gl(){return{context:void 0,data:void 0,error:null,failureCount:0,failureReason:null,isPaused:!1,status:"idle",variables:void 0}}class xl extends ft{constructor(t){super(),this.config=t||{},this.mutations=[],this.mutationId=0}build(t,r,n){const i=new ml({mutationCache:this,logger:t.getLogger(),mutationId:++this.mutationId,options:t.defaultMutationOptions(r),state:n,defaultOptions:r.mutationKey?t.getMutationDefaults(r.mutationKey):void 0});return this.add(i),i}add(t){this.mutations.push(t),this.notify({type:"added",mutation:t})}remove(t){this.mutations=this.mutations.filter(r=>r!==t),this.notify({type:"removed",mutation:t})}clear(){Q.batch(()=>{this.mutations.forEach(t=>{this.remove(t)})})}getAll(){return this.mutations}find(t){return typeof t.exact>"u"&&(t.exact=!0),this.mutations.find(r=>yn(t,r))}findAll(t){return this.mutations.filter(r=>yn(t,r))}notify(t){Q.batch(()=>{this.listeners.forEach(({listener:r})=>{r(t)})})}resumePausedMutations(){var t;return this.resuming=((t=this.resuming)!=null?t:Promise.resolve()).then(()=>{const r=this.mutations.filter(n=>n.state.isPaused);return Q.batch(()=>r.reduce((n,i)=>n.then(()=>i.continue().catch(me)),Promise.resolve()))}).then(()=>{this.resuming=void 0}),this.resuming}}function bl(){return{onFetch:e=>{e.fetchFn=()=>{var t,r,n,i,s,o;const c=(t=e.fetchOptions)==null||(r=t.meta)==null?void 0:r.refetchPage,l=(n=e.fetchOptions)==null||(i=n.meta)==null?void 0:i.fetchMore,d=l==null?void 0:l.pageParam,u=(l==null?void 0:l.direction)==="forward",h=(l==null?void 0:l.direction)==="backward",m=((s=e.state.data)==null?void 0:s.pages)||[],b=((o=e.state.data)==null?void 0:o.pageParams)||[];let S=b,j=!1;const v=E=>{Object.defineProperty(E,"signal",{enumerable:!0,get:()=>{var C;if((C=e.signal)!=null&&C.aborted)j=!0;else{var O;(O=e.signal)==null||O.addEventListener("abort",()=>{j=!0})}return e.signal}})},f=e.options.queryFn||(()=>Promise.reject("Missing queryFn for queryKey '"+e.options.queryHash+"'")),A=(E,C,O,L)=>(S=L?[C,...S]:[...S,C],L?[O,...E]:[...E,O]),y=(E,C,O,L)=>{if(j)return Promise.reject("Cancelled");if(typeof O>"u"&&!C&&E.length)return Promise.resolve(E);const T={queryKey:e.queryKey,pageParam:O,meta:e.options.meta};v(T);const q=f(T);return Promise.resolve(q).then(le=>A(E,O,le,L))};let k;if(!m.length)k=y([]);else if(u){const E=typeof d<"u",C=E?d:xr(e.options,m);k=y(m,E,C)}else if(h){const E=typeof d<"u",C=E?d:Bi(e.options,m);k=y(m,E,C,!0)}else{S=[];const E=typeof e.options.getNextPageParam>"u";k=(c&&m[0]?c(m[0],0,m):!0)?y([],E,b[0]):Promise.resolve(A([],b[0],m[0]));for(let O=1;O<m.length;O++)k=k.then(L=>{if(c&&m[O]?c(m[O],O,m):!0){const q=E?b[O]:xr(e.options,L);return y(L,E,q)}return Promise.resolve(A(L,b[O],m[O]))})}return k.then(E=>({pages:E,pageParams:S}))}}}}function xr(e,t){return e.getNextPageParam==null?void 0:e.getNextPageParam(t[t.length-1],t)}function Bi(e,t){return e.getPreviousPageParam==null?void 0:e.getPreviousPageParam(t[0],t)}function j1(e,t){if(e.getNextPageParam&&Array.isArray(t)){const r=xr(e,t);return typeof r<"u"&&r!==null&&r!==!1}}function R1(e,t){if(e.getPreviousPageParam&&Array.isArray(t)){const r=Bi(e,t);return typeof r<"u"&&r!==null&&r!==!1}}class yl{constructor(t={}){this.queryCache=t.queryCache||new fl,this.mutationCache=t.mutationCache||new xl,this.logger=t.logger||Lr,this.defaultOptions=t.defaultOptions||{},this.queryDefaults=[],this.mutationDefaults=[],this.mountCount=0}mount(){this.mountCount++,this.mountCount===1&&(this.unsubscribeFocus=It.subscribe(()=>{It.isFocused()&&(this.resumePausedMutations(),this.queryCache.onFocus())}),this.unsubscribeOnline=Tt.subscribe(()=>{Tt.isOnline()&&(this.resumePausedMutations(),this.queryCache.onOnline())}))}unmount(){var t,r;this.mountCount--,this.mountCount===0&&((t=this.unsubscribeFocus)==null||t.call(this),this.unsubscribeFocus=void 0,(r=this.unsubscribeOnline)==null||r.call(this),this.unsubscribeOnline=void 0)}isFetching(t,r){const[n]=je(t,r);return n.fetchStatus="fetching",this.queryCache.findAll(n).length}isMutating(t){return this.mutationCache.findAll({...t,fetching:!0}).length}getQueryData(t,r){var n;return(n=this.queryCache.find(t,r))==null?void 0:n.state.data}ensureQueryData(t,r,n){const i=it(t,r,n),s=this.getQueryData(i.queryKey);return s?Promise.resolve(s):this.fetchQuery(i)}getQueriesData(t){return this.getQueryCache().findAll(t).map(({queryKey:r,state:n})=>{const i=n.data;return[r,i]})}setQueryData(t,r,n){const i=this.queryCache.find(t),s=i==null?void 0:i.state.data,o=sl(r,s);if(typeof o>"u")return;const c=it(t),l=this.defaultQueryOptions(c);return this.queryCache.build(this,l).setData(o,{...n,manual:!0})}setQueriesData(t,r,n){return Q.batch(()=>this.getQueryCache().findAll(t).map(({queryKey:i})=>[i,this.setQueryData(i,r,n)]))}getQueryState(t,r){var n;return(n=this.queryCache.find(t,r))==null?void 0:n.state}removeQueries(t,r){const[n]=je(t,r),i=this.queryCache;Q.batch(()=>{i.findAll(n).forEach(s=>{i.remove(s)})})}resetQueries(t,r,n){const[i,s]=je(t,r,n),o=this.queryCache,c={type:"active",...i};return Q.batch(()=>(o.findAll(i).forEach(l=>{l.reset()}),this.refetchQueries(c,s)))}cancelQueries(t,r,n){const[i,s={}]=je(t,r,n);typeof s.revert>"u"&&(s.revert=!0);const o=Q.batch(()=>this.queryCache.findAll(i).map(c=>c.cancel(s)));return Promise.all(o).then(me).catch(me)}invalidateQueries(t,r,n){const[i,s]=je(t,r,n);return Q.batch(()=>{var o,c;if(this.queryCache.findAll(i).forEach(d=>{d.invalidate()}),i.refetchType==="none")return Promise.resolve();const l={...i,type:(o=(c=i.refetchType)!=null?c:i.type)!=null?o:"active"};return this.refetchQueries(l,s)})}refetchQueries(t,r,n){const[i,s]=je(t,r,n),o=Q.batch(()=>this.queryCache.findAll(i).filter(l=>!l.isDisabled()).map(l=>{var d;return l.fetch(void 0,{...s,cancelRefetch:(d=s==null?void 0:s.cancelRefetch)!=null?d:!0,meta:{refetchPage:i.refetchPage}})}));let c=Promise.all(o).then(me);return s!=null&&s.throwOnError||(c=c.catch(me)),c}fetchQuery(t,r,n){const i=it(t,r,n),s=this.defaultQueryOptions(i);typeof s.retry>"u"&&(s.retry=!1);const o=this.queryCache.build(this,s);return o.isStaleByTime(s.staleTime)?o.fetch(s):Promise.resolve(o.state.data)}prefetchQuery(t,r,n){return this.fetchQuery(t,r,n).then(me).catch(me)}fetchInfiniteQuery(t,r,n){const i=it(t,r,n);return i.behavior=bl(),this.fetchQuery(i)}prefetchInfiniteQuery(t,r,n){return this.fetchInfiniteQuery(t,r,n).then(me).catch(me)}resumePausedMutations(){return this.mutationCache.resumePausedMutations()}getQueryCache(){return this.queryCache}getMutationCache(){return this.mutationCache}getLogger(){return this.logger}getDefaultOptions(){return this.defaultOptions}setDefaultOptions(t){this.defaultOptions=t}setQueryDefaults(t,r){const n=this.queryDefaults.find(i=>_e(t)===_e(i.queryKey));n?n.defaultOptions=r:this.queryDefaults.push({queryKey:t,defaultOptions:r})}getQueryDefaults(t){if(!t)return;const r=this.queryDefaults.find(n=>_t(t,n.queryKey));return r==null?void 0:r.defaultOptions}setMutationDefaults(t,r){const n=this.mutationDefaults.find(i=>_e(t)===_e(i.mutationKey));n?n.defaultOptions=r:this.mutationDefaults.push({mutationKey:t,defaultOptions:r})}getMutationDefaults(t){if(!t)return;const r=this.mutationDefaults.find(n=>_t(t,n.mutationKey));return r==null?void 0:r.defaultOptions}defaultQueryOptions(t){if(t!=null&&t._defaulted)return t;const r={...this.defaultOptions.queries,...this.getQueryDefaults(t==null?void 0:t.queryKey),...t,_defaulted:!0};return!r.queryHash&&r.queryKey&&(r.queryHash=Tr(r.queryKey,r)),typeof r.refetchOnReconnect>"u"&&(r.refetchOnReconnect=r.networkMode!=="always"),typeof r.useErrorBoundary>"u"&&(r.useErrorBoundary=!!r.suspense),r}defaultMutationOptions(t){return t!=null&&t._defaulted?t:{...this.defaultOptions.mutations,...this.getMutationDefaults(t==null?void 0:t.mutationKey),...t,_defaulted:!0}}clear(){this.queryCache.clear(),this.mutationCache.clear()}}class vl extends ft{constructor(t,r){super(),this.client=t,this.options=r,this.trackedProps=new Set,this.selectError=null,this.bindMethods(),this.setOptions(r)}bindMethods(){this.remove=this.remove.bind(this),this.refetch=this.refetch.bind(this)}onSubscribe(){this.listeners.size===1&&(this.currentQuery.addObserver(this),En(this.currentQuery,this.options)&&this.executeFetch(),this.updateTimers())}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return br(this.currentQuery,this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return br(this.currentQuery,this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,this.clearStaleTimeout(),this.clearRefetchInterval(),this.currentQuery.removeObserver(this)}setOptions(t,r){const n=this.options,i=this.currentQuery;if(this.options=this.client.defaultQueryOptions(t),fr(n,this.options)||this.client.getQueryCache().notify({type:"observerOptionsUpdated",query:this.currentQuery,observer:this}),typeof this.options.enabled<"u"&&typeof this.options.enabled!="boolean")throw new Error("Expected enabled to be a boolean");this.options.queryKey||(this.options.queryKey=n.queryKey),this.updateQuery();const s=this.hasListeners();s&&jn(this.currentQuery,i,this.options,n)&&this.executeFetch(),this.updateResult(r),s&&(this.currentQuery!==i||this.options.enabled!==n.enabled||this.options.staleTime!==n.staleTime)&&this.updateStaleTimeout();const o=this.computeRefetchInterval();s&&(this.currentQuery!==i||this.options.enabled!==n.enabled||o!==this.currentRefetchInterval)&&this.updateRefetchInterval(o)}getOptimisticResult(t){const r=this.client.getQueryCache().build(this.client,t),n=this.createResult(r,t);return Sl(this,n,t)&&(this.currentResult=n,this.currentResultOptions=this.options,this.currentResultState=this.currentQuery.state),n}getCurrentResult(){return this.currentResult}trackResult(t){const r={};return Object.keys(t).forEach(n=>{Object.defineProperty(r,n,{configurable:!1,enumerable:!0,get:()=>(this.trackedProps.add(n),t[n])})}),r}getCurrentQuery(){return this.currentQuery}remove(){this.client.getQueryCache().remove(this.currentQuery)}refetch({refetchPage:t,...r}={}){return this.fetch({...r,meta:{refetchPage:t}})}fetchOptimistic(t){const r=this.client.defaultQueryOptions(t),n=this.client.getQueryCache().build(this.client,r);return n.isFetchingOptimistic=!0,n.fetch().then(()=>this.createResult(n,r))}fetch(t){var r;return this.executeFetch({...t,cancelRefetch:(r=t.cancelRefetch)!=null?r:!0}).then(()=>(this.updateResult(),this.currentResult))}executeFetch(t){this.updateQuery();let r=this.currentQuery.fetch(this.options,t);return t!=null&&t.throwOnError||(r=r.catch(me)),r}updateStaleTimeout(){if(this.clearStaleTimeout(),ot||this.currentResult.isStale||!pr(this.options.staleTime))return;const r=Ti(this.currentResult.dataUpdatedAt,this.options.staleTime)+1;this.staleTimeoutId=setTimeout(()=>{this.currentResult.isStale||this.updateResult()},r)}computeRefetchInterval(){var t;return typeof this.options.refetchInterval=="function"?this.options.refetchInterval(this.currentResult.data,this.currentQuery):(t=this.options.refetchInterval)!=null?t:!1}updateRefetchInterval(t){this.clearRefetchInterval(),this.currentRefetchInterval=t,!(ot||this.options.enabled===!1||!pr(this.currentRefetchInterval)||this.currentRefetchInterval===0)&&(this.refetchIntervalId=setInterval(()=>{(this.options.refetchIntervalInBackground||It.isFocused())&&this.executeFetch()},this.currentRefetchInterval))}updateTimers(){this.updateStaleTimeout(),this.updateRefetchInterval(this.computeRefetchInterval())}clearStaleTimeout(){this.staleTimeoutId&&(clearTimeout(this.staleTimeoutId),this.staleTimeoutId=void 0)}clearRefetchInterval(){this.refetchIntervalId&&(clearInterval(this.refetchIntervalId),this.refetchIntervalId=void 0)}createResult(t,r){const n=this.currentQuery,i=this.options,s=this.currentResult,o=this.currentResultState,c=this.currentResultOptions,l=t!==n,d=l?t.state:this.currentQueryInitialState,u=l?this.currentResult:this.previousQueryResult,{state:h}=t;let{dataUpdatedAt:m,error:b,errorUpdatedAt:S,fetchStatus:j,status:v}=h,f=!1,A=!1,y;if(r._optimisticResults){const O=this.hasListeners(),L=!O&&En(t,r),T=O&&jn(t,n,r,i);(L||T)&&(j=$t(t.options.networkMode)?"fetching":"paused",m||(v="loading")),r._optimisticResults==="isRestoring"&&(j="idle")}if(r.keepPreviousData&&!h.dataUpdatedAt&&u!=null&&u.isSuccess&&v!=="error")y=u.data,m=u.dataUpdatedAt,v=u.status,f=!0;else if(r.select&&typeof h.data<"u")if(s&&h.data===(o==null?void 0:o.data)&&r.select===this.selectFn)y=this.selectResult;else try{this.selectFn=r.select,y=r.select(h.data),y=gr(s==null?void 0:s.data,y,r),this.selectResult=y,this.selectError=null}catch(O){this.selectError=O}else y=h.data;if(typeof r.placeholderData<"u"&&typeof y>"u"&&v==="loading"){let O;if(s!=null&&s.isPlaceholderData&&r.placeholderData===(c==null?void 0:c.placeholderData))O=s.data;else if(O=typeof r.placeholderData=="function"?r.placeholderData():r.placeholderData,r.select&&typeof O<"u")try{O=r.select(O),this.selectError=null}catch(L){this.selectError=L}typeof O<"u"&&(v="success",y=gr(s==null?void 0:s.data,O,r),A=!0)}this.selectError&&(b=this.selectError,y=this.selectResult,S=Date.now(),v="error");const k=j==="fetching",w=v==="loading",E=v==="error";return{status:v,fetchStatus:j,isLoading:w,isSuccess:v==="success",isError:E,isInitialLoading:w&&k,data:y,dataUpdatedAt:m,error:b,errorUpdatedAt:S,failureCount:h.fetchFailureCount,failureReason:h.fetchFailureReason,errorUpdateCount:h.errorUpdateCount,isFetched:h.dataUpdateCount>0||h.errorUpdateCount>0,isFetchedAfterMount:h.dataUpdateCount>d.dataUpdateCount||h.errorUpdateCount>d.errorUpdateCount,isFetching:k,isRefetching:k&&!w,isLoadingError:E&&h.dataUpdatedAt===0,isPaused:j==="paused",isPlaceholderData:A,isPreviousData:f,isRefetchError:E&&h.dataUpdatedAt!==0,isStale:Mr(t,r),refetch:this.refetch,remove:this.remove}}updateResult(t){const r=this.currentResult,n=this.createResult(this.currentQuery,this.options);if(this.currentResultState=this.currentQuery.state,this.currentResultOptions=this.options,fr(n,r))return;this.currentResult=n;const i={cache:!0},s=()=>{if(!r)return!0;const{notifyOnChangeProps:o}=this.options,c=typeof o=="function"?o():o;if(c==="all"||!c&&!this.trackedProps.size)return!0;const l=new Set(c??this.trackedProps);return this.options.useErrorBoundary&&l.add("error"),Object.keys(this.currentResult).some(d=>{const u=d;return this.currentResult[u]!==r[u]&&l.has(u)})};(t==null?void 0:t.listeners)!==!1&&s()&&(i.listeners=!0),this.notify({...i,...t})}updateQuery(){const t=this.client.getQueryCache().build(this.client,this.options);if(t===this.currentQuery)return;const r=this.currentQuery;this.currentQuery=t,this.currentQueryInitialState=t.state,this.previousQueryResult=this.currentResult,this.hasListeners()&&(r==null||r.removeObserver(this),t.addObserver(this))}onQueryUpdate(t){const r={};t.type==="success"?r.onSuccess=!t.manual:t.type==="error"&&!At(t.error)&&(r.onError=!0),this.updateResult(r),this.hasListeners()&&this.updateTimers()}notify(t){Q.batch(()=>{if(t.onSuccess){var r,n,i,s;(r=(n=this.options).onSuccess)==null||r.call(n,this.currentResult.data),(i=(s=this.options).onSettled)==null||i.call(s,this.currentResult.data,null)}else if(t.onError){var o,c,l,d;(o=(c=this.options).onError)==null||o.call(c,this.currentResult.error),(l=(d=this.options).onSettled)==null||l.call(d,void 0,this.currentResult.error)}t.listeners&&this.listeners.forEach(({listener:u})=>{u(this.currentResult)}),t.cache&&this.client.getQueryCache().notify({query:this.currentQuery,type:"observerResultsUpdated"})})}}function wl(e,t){return t.enabled!==!1&&!e.state.dataUpdatedAt&&!(e.state.status==="error"&&t.retryOnMount===!1)}function En(e,t){return wl(e,t)||e.state.dataUpdatedAt>0&&br(e,t,t.refetchOnMount)}function br(e,t,r){if(t.enabled!==!1){const n=typeof r=="function"?r(e):r;return n==="always"||n!==!1&&Mr(e,t)}return!1}function jn(e,t,r,n){return r.enabled!==!1&&(e!==t||n.enabled===!1)&&(!r.suspense||e.state.status!=="error")&&Mr(e,r)}function Mr(e,t){return e.isStaleByTime(t.staleTime)}function Sl(e,t,r){return r.keepPreviousData?!1:r.placeholderData!==void 0?t.isPlaceholderData:!fr(e.getCurrentResult(),t)}var Yt={exports:{}},Jt={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Rn;function Al(){if(Rn)return Jt;Rn=1;var e=Zi();function t(h,m){return h===m&&(h!==0||1/h===1/m)||h!==h&&m!==m}var r=typeof Object.is=="function"?Object.is:t,n=e.useState,i=e.useEffect,s=e.useLayoutEffect,o=e.useDebugValue;function c(h,m){var b=m(),S=n({inst:{value:b,getSnapshot:m}}),j=S[0].inst,v=S[1];return s(function(){j.value=b,j.getSnapshot=m,l(j)&&v({inst:j})},[h,b,m]),i(function(){return l(j)&&v({inst:j}),h(function(){l(j)&&v({inst:j})})},[h]),o(b),b}function l(h){var m=h.getSnapshot;h=h.value;try{var b=m();return!r(h,b)}catch{return!0}}function d(h,m){return m()}var u=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?d:c;return Jt.useSyncExternalStore=e.useSyncExternalStore!==void 0?e.useSyncExternalStore:u,Jt}var kn;function El(){return kn||(kn=1,Yt.exports=Al()),Yt.exports}var jl=El();const Rl=jl.useSyncExternalStore,Cn=g.createContext(void 0),$i=g.createContext(!1);function Ui(e,t){return e||(t&&typeof window<"u"?(window.ReactQueryClientContext||(window.ReactQueryClientContext=Cn),window.ReactQueryClientContext):Cn)}const Hi=({context:e}={})=>{const t=g.useContext(Ui(e,g.useContext($i)));if(!t)throw new Error("No QueryClient set, use QueryClientProvider to set one");return t},kl=({client:e,children:t,context:r,contextSharing:n=!1})=>{g.useEffect(()=>(e.mount(),()=>{e.unmount()}),[e]);const i=Ui(r,n);return g.createElement($i.Provider,{value:!r&&n},g.createElement(i.Provider,{value:e},t))},qi=g.createContext(!1),Cl=()=>g.useContext(qi);qi.Provider;function Ol(){let e=!1;return{clearReset:()=>{e=!1},reset:()=>{e=!0},isReset:()=>e}}const Pl=g.createContext(Ol()),_l=()=>g.useContext(Pl);function Il(e,t){return typeof e=="function"?e(...t):!!e}const Tl=(e,t)=>{(e.suspense||e.useErrorBoundary)&&(t.isReset()||(e.retryOnMount=!1))},Ll=e=>{g.useEffect(()=>{e.clearReset()},[e])},Ml=({result:e,errorResetBoundary:t,useErrorBoundary:r,query:n})=>e.isError&&!t.isReset()&&!e.isFetching&&Il(r,[e.error,n]),Dl=e=>{e.suspense&&(typeof e.staleTime!="number"&&(e.staleTime=1e3),typeof e.cacheTime=="number"&&(e.cacheTime=Math.max(e.cacheTime,1e3)))},zl=(e,t)=>e.isLoading&&e.isFetching&&!t,Fl=(e,t,r)=>(e==null?void 0:e.suspense)&&zl(t,r),Nl=(e,t,r)=>t.fetchOptimistic(e).then(({data:n})=>{e.onSuccess==null||e.onSuccess(n),e.onSettled==null||e.onSettled(n,null)}).catch(n=>{r.clearReset(),e.onError==null||e.onError(n),e.onSettled==null||e.onSettled(void 0,n)});function Bl(e,t){const r=Hi({context:e.context}),n=Cl(),i=_l(),s=r.defaultQueryOptions(e);s._optimisticResults=n?"isRestoring":"optimistic",s.onError&&(s.onError=Q.batchCalls(s.onError)),s.onSuccess&&(s.onSuccess=Q.batchCalls(s.onSuccess)),s.onSettled&&(s.onSettled=Q.batchCalls(s.onSettled)),Dl(s),Tl(s,i),Ll(i);const[o]=g.useState(()=>new t(r,s)),c=o.getOptimisticResult(s);if(Rl(g.useCallback(l=>{const d=n?()=>{}:o.subscribe(Q.batchCalls(l));return o.updateResult(),d},[o,n]),()=>o.getCurrentResult(),()=>o.getCurrentResult()),g.useEffect(()=>{o.setOptions(s,{listeners:!1})},[s,o]),Fl(s,c,n))throw Nl(s,o,i);if(Ml({result:c,errorResetBoundary:i,useErrorBoundary:s.useErrorBoundary,query:o.getCurrentQuery()}))throw c.error;return s.notifyOnChangeProps?c:o.trackResult(c)}function Vi(e,t,r){const n=it(e,t,r);return Bl(n,vl)}const $l="aniraku:anilist-status",Ul="https://graphql.anilist.co",On=2,Hl=20,Pn=6e4,ql=1500,Ee=[],Xt=new Map;let _n=0;class Vl extends Error{constructor(t){super(t),this.name="AniListUnavailableError"}}function yr(e){typeof window>"u"||window.dispatchEvent(new CustomEvent($l,{detail:{unavailable:e}}))}function Wl(e){var r,n;const t=Number((n=(r=e==null?void 0:e.headers)==null?void 0:r.get)==null?void 0:n.call(r,"Retry-After"));return Number.isFinite(t)&&t>0?Math.min(t*1e3,6e4):6e4}const Lt=e=>new Promise(t=>setTimeout(t,e));async function Ql(){const e=Date.now();for(;Ee.length&&Ee[0]<=e-Pn;)Ee.shift();if(Ee.length>=Hl){const r=Ee[0]+Pn-e+50;r>0&&await Lt(r)}if(Ee.length){const r=Ee[Ee.length-1]+ql-Date.now();r>0&&await Lt(r)}Ee.push(Date.now())}async function Kl(e){var n,i,s,o,c;await Ql();const t=await fetch(Ul,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:e}),r=await t.json().catch(()=>({}));if(!t.ok||(n=r==null?void 0:r.errors)!=null&&n.length){const l=new Error(((s=(i=r==null?void 0:r.errors)==null?void 0:i[0])==null?void 0:s.message)||`AniList is unavailable (${t.status}).`);throw l.status=t.status||Number((c=(o=r==null?void 0:r.errors)==null?void 0:o[0])==null?void 0:c.status)||0,l.retryAfterMs=Wl(t),l}return r}const In=12e4,rt=new Map;async function Ut(e,t={}){const r=JSON.stringify({query:e,variables:t}),n=r,i=rt.get(n);if(i&&Date.now()-i.ts<In)return i.data;const s=Xt.get(n);if(s)return s;const o=(async()=>{for(let c=0;c<=On;c+=1){const l=Math.max(0,_n-Date.now());l&&await Lt(l);try{return await Kl(r)}catch(d){const u=(d==null?void 0:d.name)==="TypeError"||/failed to fetch|cors/i.test((d==null?void 0:d.message)||""),h=Number(d==null?void 0:d.status)===429;if(!(h||u||Number(d==null?void 0:d.status)>=500)||c===On)throw d;const b=h||u?Math.max(d.retryAfterMs||6e4,6e4):Math.min(2e3*(c+1),8e3);(h||u)&&(_n=Date.now()+b),await Lt(b)}}throw new Error("AniList request exhausted its retry budget.")})();Xt.set(n,o);try{const c=await o;if(rt.set(n,{data:c,ts:Date.now()}),rt.size>200){const l=Date.now();for(const[d,u]of rt)l-u.ts>In&&rt.delete(d)}return c}finally{Xt.delete(n)}}function Wi(e){if(e&&typeof e=="object"){const r=String(e.romaji||e.english||e.native||"").trim(),n=String(e.english||r||"").trim(),i=String(e.native||r||"").trim();return{romaji:r,english:n,native:i,userPreferred:n||r||i||"Unknown title"}}const t=String(e||"").trim()||"Unknown title";return{romaji:t,english:t,native:t,userPreferred:t}}const Gl=`
  query ($page: Int!, $perPage: Int!, $startAt: Int, $endAt: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage total }
      airingSchedules(airingAt_greater: $startAt, airingAt_lesser: $endAt, sort: [TIME]) {
        airingAt
        episode
        media { id idMal title { romaji english native userPreferred } coverImage { extraLarge large medium color } format }
      }
    }
  }
`,Yl=`
  query ($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage total }
      media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
        id idMal
        title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        format
        nextAiringEpisode { episode airingAt }
      }
    }
  }
`;async function Jl(e,t,{startAt:r,endAt:n}={}){var c;const i=await Ut(Gl,{page:e,perPage:t,startAt:r,endAt:n}),s=(c=i==null?void 0:i.data)==null?void 0:c.Page,o=((s==null?void 0:s.airingSchedules)||[]).flatMap(l=>{const d=l==null?void 0:l.media,u=Number(d==null?void 0:d.id),h=Number(l==null?void 0:l.episode),m=Number(l==null?void 0:l.airingAt);return!Number.isInteger(u)||u<1||!Number.isInteger(h)||h<1||!Number.isInteger(m)||m<1?[]:[{id:u,idMal:Number.isInteger(Number(d==null?void 0:d.idMal))?Number(d.idMal):null,title:Wi(d==null?void 0:d.title),coverImage:d!=null&&d.coverImage&&typeof d.coverImage=="object"?d.coverImage:{},format:String((d==null?void 0:d.format)||"").trim()||null,nextAiringEpisode:{episode:h,airingAt:m}}]});return{schedule:o,pageInfo:s!=null&&s.pageInfo&&typeof s.pageInfo=="object"?s.pageInfo:{currentPage:e,perPage:t,hasNextPage:!1,total:o.length}}}async function Xl(e,t,{startAt:r,endAt:n}){var c;const i=await Ut(Yl,{page:e,perPage:t}),s=(c=i==null?void 0:i.data)==null?void 0:c.Page,o=((s==null?void 0:s.media)||[]).flatMap(l=>{var m,b;const d=Number(l==null?void 0:l.id),u=Number((m=l==null?void 0:l.nextAiringEpisode)==null?void 0:m.episode),h=Number((b=l==null?void 0:l.nextAiringEpisode)==null?void 0:b.airingAt);return!Number.isInteger(d)||d<1||!Number.isInteger(u)||u<1||!Number.isInteger(h)||h<r||h>=n?[]:[{id:d,idMal:Number.isInteger(Number(l==null?void 0:l.idMal))?Number(l.idMal):null,title:Wi(l==null?void 0:l.title),coverImage:l!=null&&l.coverImage&&typeof l.coverImage=="object"?l.coverImage:{},format:String((l==null?void 0:l.format)||"").trim()||null,nextAiringEpisode:{episode:u,airingAt:h}}]});return{schedule:o,pageInfo:s!=null&&s.pageInfo&&typeof(s==null?void 0:s.pageInfo)=="object"?s.pageInfo:{currentPage:e,perPage:t,hasNextPage:!1,total:o.length}}}async function Zl({page:e=1,perPage:t=50,startAt:r,endAt:n}={}){const i=Math.max(1,Math.floor(Number(e)||1)),s=Math.min(100,Math.max(1,Math.floor(Number(t)||50))),o=Math.floor(Number(r)),c=Math.floor(Number(n));return Number.isInteger(o)&&Number.isInteger(c)&&o>0&&c>o?Xl(i,s,{startAt:o,endAt:c}):Jl(i,s,{startAt:Math.floor(Date.now()/1e3),endAt:Math.floor(Date.now()/1e3)+10080*60})}async function Qi(e,t={}){try{const r=await Ut(e,t);return yr(!1),r}catch(r){const n=r instanceof Error?r.message:"AniList is unavailable.";throw/rate limit|too many requests|temporarily unavailable|stability/i.test(n)?(yr(!0),new Vl("AniList is rate-limited or temporarily unavailable. Please try again shortly.")):(console.warn("AniList fetch failed after direct-first fallback:",r),r instanceof Error?r:new Error(n))}}const k1=`
  query ($page: Int, $perPage: Int, $search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $season: MediaSeason, $year: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total lastPage hasNextPage currentPage perPage }
      media(search: $search, genre: $genre, format: $format, status: $status, season: $season, seasonYear: $year, type: ANIME, sort: $sort) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail } format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
  }
`,C1=`
  query {
    trending: Page(page: 1, perPage: 18) {
      media(type: ANIME, sort: TRENDING_DESC) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail }
        format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
    airing: Page(page: 1, perPage: 18) {
      media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail }
        format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
    popular: Page(page: 1, perPage: 18) {
      media(type: ANIME, sort: POPULARITY_DESC) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail }
        format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
    movies: Page(page: 1, perPage: 18) {
      media(type: ANIME, format: MOVIE, sort: POPULARITY_DESC) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail }
        format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
    topRated: Page(page: 1, perPage: 18) {
      media(type: ANIME, sort: SCORE_DESC) {
        id title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage description(asHtml: false) trailer { id site thumbnail }
        format status episodes averageScore popularity season seasonYear genres isAdult
        nextAiringEpisode { episode airingAt }
      }
    }
  }
`,eu=`
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id idMal title { romaji english native userPreferred }
      coverImage { extraLarge large medium color }
      bannerImage format status episodes duration genres averageScore popularity description season seasonYear
      nextAiringEpisode { episode airingAt }
      relations { edges { relationType node { id title { romaji english } coverImage { large medium } format type } } }
      recommendations(perPage: 12) { nodes { mediaRecommendation { id title { romaji english userPreferred } coverImage { extraLarge large medium color } format episodes averageScore status genres isAdult } } }
      streamingEpisodes { title thumbnail url }
    }
  }
`;async function tu(e){const t=(Array.isArray(e)?e:[]).filter(s=>Number.isInteger(s)&&s>0).slice(0,50);if(!t.length)return{};const r={},n=t.map((s,o)=>(r[`id${o}`]=s,`m${o}: Media(id: $id${o}, type: ANIME) {
      id status episodes nextAiringEpisode { episode airingAt }
    }`)),i=`query (${t.map((s,o)=>`$id${o}: Int!`).join(", ")}) { ${n.join(`
`)} }`;try{const s=await Ut(i,r);yr(!1);const o={};return t.forEach((c,l)=>{var d;o[c]=((d=s==null?void 0:s.data)==null?void 0:d[`m${l}`])||null}),o}catch(s){return console.warn("AniList batch detail failed:",s),{}}}async function ru(){var u,h;const e=Math.floor(Date.now()/1e3),t=e+10080*60,r=new Date;r.setMonth(r.getMonth()-3);const n=r.getFullYear()*1e4+(r.getMonth()+1)*100+r.getDate(),[i,s]=await Promise.all([Qi(`
    query ($finishedAfter: FuzzyDateInt) {
      trending: Page(page: 1, perPage: 10) {
        media(type: ANIME, sort: TRENDING_DESC) {
          id title { romaji english native userPreferred }
          coverImage { extraLarge large medium color }
          bannerImage description(asHtml: false) nextAiringEpisode { episode airingAt }
          format status episodes averageScore popularity genres isAdult
        }
      }
      airing: Page(page: 1, perPage: 20) {
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
          id title { romaji english native userPreferred }
          coverImage { extraLarge large medium color }
          bannerImage description(asHtml: false) nextAiringEpisode { episode airingAt }
          format status episodes averageScore popularity genres isAdult
        }
      }
      upcoming: Page(page: 1, perPage: 20) {
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
          id title { romaji english native userPreferred }
          coverImage { extraLarge large medium color }
          bannerImage description(asHtml: false) nextAiringEpisode { episode airingAt }
          format status episodes averageScore popularity genres isAdult
        }
      }
      movies: Page(page: 1, perPage: 20) {
        media(type: ANIME, format: MOVIE, sort: TRENDING_DESC) {
          id title { romaji english native userPreferred }
          coverImage { extraLarge large medium color }
          bannerImage description(asHtml: false) nextAiringEpisode { episode airingAt }
          format status episodes averageScore popularity genres isAdult
        }
      }
      finished: Page(page: 1, perPage: 20) {
        media(type: ANIME, status: FINISHED, sort: POPULARITY_DESC, endDate_greater: $finishedAfter) {
          id title { romaji english native userPreferred }
          coverImage { extraLarge large medium color }
          bannerImage description(asHtml: false) nextAiringEpisode { episode airingAt }
          format status episodes averageScore popularity genres isAdult endDate { year month day }
        }
      }
      topTV: Page(page: 1, perPage: 20) {
        media(type: ANIME, format: TV, sort: SCORE_DESC) {
          id title { romaji english native userPreferred }
          coverImage { extraLarge large medium color }
          bannerImage description(asHtml: false) nextAiringEpisode { episode airingAt }
          format status episodes averageScore popularity genres isAdult
        }
      }
    }
  `,{finishedAfter:n}),Zl({page:1,perPage:100,startAt:e,endAt:t}).catch(m=>(console.warn("Preview next-airing schedule is unavailable:",m),{schedule:[]}))]),{data:o}=i,c=Array.isArray(s==null?void 0:s.schedule)?s.schedule:[],l=new Map(c.map(m=>[m.id,m.nextAiringEpisode])),d=m=>(m||[]).map(b=>{const S=l.get(b==null?void 0:b.id);return S?{...b,nextAiringEpisode:S}:b});return{trending:d(o.trending.media),airing:d(o.airing.media),upcoming:((u=o.upcoming)==null?void 0:u.media)||[],movies:d(o.movies.media),finished:((h=o.finished)==null?void 0:h.media)||[],topTV:d(o.topTV.media),schedule:c}}function nu(){return Vi(["homepage"],ru,{staleTime:3e5,cacheTime:1/0})}function O1(e){return Vi(["anime",e],async()=>{var n;const t=await Qi(eu,{id:Number(e)}),r=(n=t==null?void 0:t.data)==null?void 0:n.Media;if(!(r!=null&&r.id))throw new Error("Metadata resolver returned no anime");return r},{enabled:!!e,staleTime:3e5,retry:!1,refetchOnWindowFocus:!1,refetchOnReconnect:!1})}const vr="aniraku-nsfw-enabled",Tn=()=>{try{return localStorage.getItem(vr)==="true"}catch{return!1}},V={userId:null,value:null,pending:null,listeners:new Set},Zt=e=>{V.value=e,V.listeners.forEach(t=>t(e))},Ki=()=>{const{user:e,loading:t}=Dt(),[r,n]=g.useState(()=>V.userId===((e==null?void 0:e.id)||null)&&V.value!==null?V.value:!e&&!t?Tn():!1);g.useEffect(()=>{const o=(e==null?void 0:e.id)||null;V.userId!==o&&(V.userId=o,V.value=null,V.pending=null);const c=u=>n(u);if(V.listeners.add(c),V.value!==null)return n(V.value),()=>{V.listeners.delete(c)};if(!e&&!t)return Zt(Tn()),()=>{V.listeners.delete(c)};if(!e)return()=>{V.listeners.delete(c)};let l=!1;const d=V.pending||B.from("user_settings").select("value").eq("user_id",e.id).eq("key","nsfw_enabled").maybeSingle();return V.pending=d,d.then(({data:u})=>{l||V.userId!==o||Zt((u==null?void 0:u.value)===!0)}).catch(()=>{}).finally(()=>{V.pending===d&&(V.pending=null)}),()=>{l=!0,V.listeners.delete(c)}},[e,t]);const i=g.useCallback(async o=>{if(Zt(o),e){try{localStorage.removeItem(vr)}catch{}await B.from("user_settings").upsert({user_id:e.id,key:"nsfw_enabled",value:o},{onConflict:"user_id,key"})}else try{localStorage.setItem(vr,String(o))}catch{}},[e]),s=g.useCallback(()=>i(!r),[r,i]);return{nsfwEnabled:r,toggleNsfw:s,updateNsfw:i}},wr=e=>Array.isArray(e==null?void 0:e.genres)&&e.genres.some(t=>t.toLowerCase()==="hentai"),$e=(e,t)=>t||!Array.isArray(e)?e:e.filter(r=>!wr(r)),er=new Map,iu=1800*1e3,au=300*1e3;function su(e){if(!e)return Promise.resolve(!1);const t=Date.now(),r=er.get(e);if(r){const i=r.playable?iu:au;if(t-r.at<i)return Promise.resolve(r.playable);er.delete(e)}const n={promise:null,playable:!1,at:t};return n.promise=(async()=>{try{const i=await fetch(`${Ve}/api/v1/miruro/probe/${e}`);if(!i.ok)return!1;const s=await i.json();return(s==null?void 0:s.playable)===!0}catch{return!1}})().then(i=>(n.playable=!!i,!!i)),er.set(e,n),n.promise}const Ue=e=>{const{nsfwEnabled:t}=Ki(),r=g.useMemo(()=>Array.isArray(e)?e:[],[e]),n=g.useMemo(()=>r.filter(c=>!wr(c)),[r]),i=g.useMemo(()=>r.filter(wr),[r]),[s,o]=g.useState([]);return g.useEffect(()=>{if(!t||i.length===0){o(l=>l.length?[]:l);return}let c=!1;return Promise.all(i.map(async l=>await su(l.id)?l:null)).then(l=>{if(c)return;const d=l.filter(Boolean);o(u=>u.length===d.length&&u.every((h,m)=>h.id===d[m].id)?u:d)}).catch(()=>{}),()=>{c=!0}},[t,i]),t?[...n,...s]:n};function ou(e){const t=Number(e);return Number.isInteger(t)&&t>0?t:null}function cu(e=new Date){const t=new Date(e);return t.setHours(0,0,0,0),Array.from({length:7},(r,n)=>{const i=new Date(t);return i.setDate(t.getDate()+n),{label:n===0?"Today":i.toLocaleDateString([],{weekday:"short"}),key:i.toDateString(),date:i}})}function lu(e,t,r=null){const n=Array.isArray(e)?e:[];return(Array.isArray(t)?t:[]).map(s=>n.filter(o=>(o==null?void 0:o.id)&&o.id!==r).filter(o=>{var l;const c=ou((l=o==null?void 0:o.nextAiringEpisode)==null?void 0:l.airingAt);return c&&new Date(c*1e3).toDateString()===(s==null?void 0:s.key)}).sort((o,c)=>Number(o.nextAiringEpisode.airingAt)-Number(c.nextAiringEpisode.airingAt)))}function uu(e){var r;if(!Array.isArray(e)||!e.length||(r=e[0])!=null&&r.length)return 0;const t=e.findIndex(n=>Array.isArray(n)&&n.length>0);return t>=0?t:0}const du=x.main`
  min-height: 100vh;
  overflow: clip;
  background:
    radial-gradient(circle at 82% 11%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 34rem),
    var(--bg);
`,hu=x.div`
  width: min(100%, 1440px);
  margin: 0 auto;
  padding: calc(var(--header-h) + 12px) var(--content-pad) clamp(30px, 5vw, 60px);

  @media (max-width: 640px) { padding-top: calc(var(--header-h) + 8px); }
`,pu=x.div`
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 36px;
  margin-bottom: 10px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--accent) 24%, var(--border));
  border-radius: 9px;
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-card));
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 720;

  svg { color: var(--accent); }
`,fu=x.article`
  position: relative;
  display: grid;
  min-height: clamp(390px, 38vw, 500px);
  align-items: end;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--bg-elevated);
  isolation: isolate;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .26);

  &::before {
    position: absolute;
    inset: 0;
    z-index: -2;
    background: ${({$image:e})=>e?`url(${e}) center / cover no-repeat`:"var(--bg-elevated)"};
    content: '';
    transform: scale(1.015);
  }

  &::after {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(90deg, rgba(7, 7, 9, .96) 0%, rgba(7, 7, 9, .85) 36%, rgba(7, 7, 9, .36) 68%, rgba(7, 7, 9, .16) 100%),
      linear-gradient(0deg, rgba(7, 7, 9, .9) 0%, rgba(7, 7, 9, .05) 65%);
    content: '';
  }

  @media (max-width: 680px) {
    min-height: 480px;
    &::before { background-position: center top; background-size: auto 100%; transform: none; }
    &::after { background: linear-gradient(0deg, rgba(7, 7, 9, .98) 0%, rgba(7, 7, 9, .82) 47%, rgba(7, 7, 9, .12) 100%); }
  }
`,mu=x.div`
  width: min(100%, 720px);
  padding: clamp(24px, 4vw, 54px);

  .status {
    display: inline-flex;
    min-height: 28px;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    border: 1px solid rgba(255,255,255,.17);
    border-radius: 8px;
    background: rgba(0,0,0,.3);
    color: rgba(255,255,255,.9);
    font-size: 10px;
    font-weight: 800;
  }

  .status svg { color: var(--accent); }

  h1 {
    display: -webkit-box;
    max-width: 22ch;
    margin: 16px 0 0;
    overflow: hidden;
    color: #fff;
    font-size: clamp(32px, 4.5vw, 56px);
    font-weight: 880;
    letter-spacing: -.065em;
    line-height: .93;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .summary {
    display: -webkit-box;
    max-width: 65ch;
    margin: 14px 0 0;
    overflow: hidden;
    color: rgba(255,255,255,.72);
    font-size: 13px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  @media (max-width: 680px) {
    padding: 20px;
    h1 { max-width: 16ch; font-size: clamp(29px, 8vw, 40px); }
    .summary { font-size: 12px; -webkit-line-clamp: 2; }
  }
`,gu=x.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 13px;

  span {
    display: inline-flex;
    min-height: 25px;
    align-items: center;
    gap: 5px;
    padding: 0 9px;
    border: 1px solid rgba(255,255,255,.15);
    border-radius: var(--radius-full);
    background: rgba(0,0,0,.26);
    color: rgba(255,255,255,.9);
    font-size: 10px;
    font-weight: 760;
  }
`,xu=x.div`
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 18px;
`,Ln=x(F)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 15px;
  border: 1px solid ${({$quiet:e})=>e?"rgba(255,255,255,.18)":"var(--accent)"};
  border-radius: 8px;
  background: ${({$quiet:e})=>e?"rgba(0,0,0,.28)":"var(--accent)"};
  color: ${({$quiet:e})=>e?"#fff":"var(--bg)"};
  font-size: 12px;
  font-weight: 850;
  text-decoration: none;
  transition: transform 160ms var(--ease-out, ease-out), background 160ms var(--ease-out, ease-out);

  &:hover { background: ${({$quiet:e})=>e?"rgba(255,255,255,.14)":"var(--accent-dim)"}; }
  &:active { transform: scale(.97); }
`,bu=x.div`
  position: absolute;
  right: clamp(16px, 2.6vw, 28px);
  bottom: clamp(18px, 3vw, 30px);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2;

  span { min-width: 44px; color: rgba(255,255,255,.78); font-size: 10px; font-weight: 800; text-align: center; }
  button {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 8px;
    background: rgba(0,0,0,.32);
    color: #fff;
    cursor: pointer;
    transition: transform 150ms var(--ease-out, ease-out), background 150ms var(--ease-out, ease-out);
  }
  button:hover { background: rgba(255,255,255,.14); }
  button:active { transform: scale(.95); }

  @media (max-width: 680px) { top: 15px; right: 15px; bottom: auto; }
`,yu=x.nav`
  display: flex;
  gap: 8px;
  margin: 12px -2px 0;
  overflow-x: auto;
  padding: 3px 2px 11px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  a {
    display: inline-flex;
    min-height: 31px;
    flex: 0 0 auto;
    align-items: center;
    padding: 0 11px;
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--bg-card) 88%, transparent);
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 760;
    text-decoration: none;
    transition: color 150ms var(--ease-out, ease-out), border-color 150ms var(--ease-out, ease-out), background 150ms var(--ease-out, ease-out), transform 150ms var(--ease-out, ease-out);
  }
  a:hover { border-color: color-mix(in srgb, var(--accent) 60%, var(--border)); background: var(--bg-elevated); color: var(--text-primary); }
  a:active { transform: scale(.97); }
`,vu=x.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(275px, .37fr);
  align-items: start;
  gap: clamp(16px, 2vw, 28px);
  margin-top: clamp(22px, 3vw, 38px);

  @media (max-width: 980px) { grid-template-columns: 1fr; }
`,Sr=x.section`
  min-width: 0;
  padding: clamp(14px, 1.8vw, 22px);
  border: 1px solid var(--border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-card) 93%, transparent);
`,Mn=x.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h2 { margin: 0; color: var(--text-primary); font-size: clamp(18px, 2vw, 24px); font-weight: 840; letter-spacing: -.045em; }
  a { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 11px; font-weight: 760; text-decoration: none; white-space: nowrap; }
  a:hover { color: var(--text-primary); }
`,wu=x.div`
  display: flex;
  gap: 4px;
  overflow-x: auto;
  margin-bottom: 15px;
  padding-bottom: 2px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  button {
    min-height: 30px;
    flex: 0 0 auto;
    padding: 0 9px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .07em;
    text-transform: uppercase;
  }
  button[aria-selected='true'] { border-bottom-color: var(--accent); color: var(--text-primary); }
`,Su=x.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(10px, 1.5vw, 15px);

  @media (max-width: 700px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 430px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`,Au=x(F)`
  min-width: 0;
  color: inherit;
  text-decoration: none;

  .art {
    position: relative;
    overflow: hidden;
    aspect-ratio: .68;
    border-radius: 9px;
    background: var(--bg-elevated);
  }
  .art::after { position: absolute; inset: 48% 0 0; background: linear-gradient(transparent, rgba(0,0,0,.72)); content: ''; pointer-events: none; }
  img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 240ms var(--ease-out, ease-out); }
  .score { position: absolute; right: 7px; bottom: 7px; z-index: 1; padding: 3px 5px; border-radius: 5px; background: rgba(0,0,0,.6); color: #fff; font-size: 9px; font-weight: 820; }
  h3 { margin: 7px 1px 3px; overflow: hidden; color: var(--text-primary); font-size: 12px; font-weight: 790; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 0 1px; overflow: hidden; color: var(--text-muted); font-size: 9px; font-weight: 740; text-overflow: ellipsis; white-space: nowrap; }
  &:hover img { transform: scale(1.05); }
  &:hover h3 { color: var(--accent); }
  &:active { transform: scale(.98); }
`,Eu=x.div`
  display: grid;
  gap: 7px;
`,ju=x(F)`
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  min-height: 64px;
  padding: 7px;
  border: 1px solid transparent;
  border-radius: 9px;
  color: inherit;
  text-decoration: none;
  transition: background 150ms var(--ease-out, ease-out), border-color 150ms var(--ease-out, ease-out), transform 150ms var(--ease-out, ease-out);

  img { width: 42px; height: 56px; border-radius: 5px; background: var(--bg-elevated); object-fit: cover; }
  h3 { margin: 2px 0 5px; overflow: hidden; color: var(--text-primary); font-size: 11px; font-weight: 790; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 0; color: var(--text-muted); font-size: 9px; font-weight: 720; }
  .live { display: inline-flex; align-items: center; gap: 5px; color: var(--text-secondary); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  &:hover { border-color: var(--border); background: var(--bg-elevated); transform: translateX(2px); }
`,Ru=x.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(12px, 1.8vw, 22px);
  margin-top: clamp(16px, 2.2vw, 28px);

  @media (max-width: 950px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`,tr=x(Sr)`
  padding: 14px;
  .panel-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 11px; }
  h2 { margin: 0; color: var(--text-primary); font-size: 14px; font-weight: 830; letter-spacing: -.02em; }
  a.more { color: var(--text-muted); font-size: 10px; font-weight: 760; text-decoration: none; }
  a.more:hover { color: var(--accent); }
`,ku=x.section`
  margin-top: clamp(16px, 2.2vw, 28px);
  padding: clamp(16px, 2.2vw, 28px);
  border: 1px solid var(--border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-card) 93%, transparent);
`,Cu=x.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 15px;

  p { display: flex; align-items: center; gap: 7px; margin: 0 0 5px; color: var(--accent); font-size: 10px; font-weight: 840; letter-spacing: .11em; text-transform: uppercase; }
  h2 { margin: 0; color: var(--text-primary); font-size: clamp(20px, 2.5vw, 28px); font-weight: 850; letter-spacing: -.055em; }
  a { display: inline-flex; align-items: center; gap: 7px; color: var(--text-secondary); font-size: 11px; font-weight: 760; text-decoration: none; white-space: nowrap; }
  a:hover { color: var(--text-primary); }
`,Ou=x.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 9px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  button {
    display: grid;
    min-width: 76px;
    min-height: 44px;
    place-items: center;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 10px;
    font-weight: 750;
    transition: background 150ms var(--ease-out, ease-out), color 150ms var(--ease-out, ease-out), transform 150ms var(--ease-out, ease-out);
  }
  button:hover { background: var(--bg-elevated); color: var(--text-primary); }
  button:active { transform: scale(.97); }
  button[aria-pressed='true'] { background: var(--accent); color: var(--bg); font-weight: 860; }
`,Pu=x.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 820px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`,_u=x(F)`
  display: grid;
  grid-template-columns: 45px minmax(0, 1fr) auto;
  gap: 9px;
  min-width: 0;
  align-items: center;
  padding: 7px;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  transition: background 150ms var(--ease-out, ease-out), transform 150ms var(--ease-out, ease-out);

  img { width: 45px; height: 58px; border-radius: 5px; background: var(--bg-elevated); object-fit: cover; }
  h3 { margin: 0; overflow: hidden; color: var(--text-primary); font-size: 11px; font-weight: 770; text-overflow: ellipsis; white-space: nowrap; }
  p { margin: 4px 0 0; color: var(--text-muted); font-size: 9px; font-weight: 720; }
  span { padding: 4px 5px; border: 1px solid var(--border); border-radius: 5px; color: var(--text-secondary); font-size: 9px; font-weight: 820; white-space: nowrap; }
  &:hover { background: var(--bg-elevated); transform: translateY(-1px); }
`,Iu=x.p`
  display: grid;
  min-height: 88px;
  margin: 0;
  place-items: center;
  border: 1px dashed var(--border);
  border-radius: 9px;
  color: var(--text-muted);
  font-size: 12px;
`,Dn=x.div`
  display: grid;
  min-height: 430px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 13px;
`,ve=e=>{var t,r,n;return((t=e==null?void 0:e.title)==null?void 0:t.english)||((r=e==null?void 0:e.title)==null?void 0:r.romaji)||((n=e==null?void 0:e.title)==null?void 0:n.userPreferred)||"Unknown title"},Tu=e=>{var t,r;return(e==null?void 0:e.bannerImage)||((t=e==null?void 0:e.coverImage)==null?void 0:t.extraLarge)||((r=e==null?void 0:e.coverImage)==null?void 0:r.large)||""},Dr=e=>{var t,r,n;return((t=e==null?void 0:e.coverImage)==null?void 0:t.extraLarge)||((r=e==null?void 0:e.coverImage)==null?void 0:r.large)||((n=e==null?void 0:e.coverImage)==null?void 0:n.medium)||""},zr=e=>{const t=Number(e==null?void 0:e.id);return Number.isInteger(t)&&t>0?`media:${t}`:`media:${ve(e)}`},nt=e=>{const t=new Set;return(Array.isArray(e)?e:[]).filter(r=>{const n=zr(r);return!(r!=null&&r.id)||t.has(n)?!1:(t.add(n),!0)})},Mt=e=>`/anime/${ct(ve(e))}-${e.id}`,Lu=e=>`/watch/${ct(ve(e))}-${e.id}-episode-1`,zn=(e="")=>e.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(),Gi=e=>`${(e==null?void 0:e.format)||"TV"}${e!=null&&e.episodes?` · ${e.episodes} eps`:""}${e!=null&&e.averageScore?` · ${e.averageScore}%`:""}`;function Mu({items:e,limit:t=12}){return a.jsx(Su,{children:e.slice(0,t).map(r=>a.jsxs(Au,{to:Mt(r),title:`Open ${ve(r)}`,children:[a.jsxs("div",{className:"art",children:[a.jsx("img",{src:Dr(r),alt:"",loading:"lazy"}),r.averageScore&&a.jsx("span",{className:"score",children:r.averageScore})]}),a.jsx("h3",{children:ve(r)}),a.jsx("p",{children:Gi(r)})]},zr(r)))})}function yt({items:e,label:t,emptyLabel:r="More titles will appear here shortly."}){return a.jsxs(Eu,{children:[e.slice(0,6).map(n=>{var i;return a.jsxs(ju,{to:Mt(n),title:`Open ${ve(n)}`,children:[a.jsx("img",{src:Dr(n),alt:"",loading:"lazy"}),a.jsxs("div",{children:[a.jsx("h3",{children:ve(n)}),a.jsxs("p",{className:"live",children:[a.jsx("span",{className:"dot"}),t==="Airing"&&((i=n==null?void 0:n.nextAiringEpisode)!=null&&i.episode)?`Episode ${n.nextAiringEpisode.episode} next`:t==="Airing"?"Airing now":Gi(n)]})]})]},zr(n))}),!e.length&&a.jsx("p",{style:{margin:"8px 0",color:"var(--text-muted)",fontSize:"11px"},children:r})]})}function Du(){var xe;const{data:e={},isFetched:t}=nu(),{trending:r=[],airing:n=[],upcoming:i=[],movies:s=[],finished:o=[],topTV:c=[],schedule:l=[]}=e,{user:d}=Dt(),{nsfwEnabled:u}=Ki(),h=Ue($e(r,u)),m=Ue($e(n,u)),b=Ue($e(i,u)),S=Ue($e(s,u)),j=Ue($e(c,u)),v=Ue($e(o,u)).slice(0,6),[f,A]=g.useState(0),[y,k]=g.useState("newest"),[w,E]=g.useState(0),C=g.useRef(!1),O=g.useRef(!1),L=g.useMemo(()=>nt([...h,...m]).slice(0,8),[h,m]),T=L[f]||null,q=g.useMemo(()=>nt(b).filter(_=>(_==null?void 0:_.status)==="NOT_YET_RELEASED").slice(0,6),[b]),oe=g.useMemo(()=>nt(m),[m]),le=g.useMemo(()=>nt([...h,...S]),[h,S]),ie=g.useMemo(()=>nt(j),[j]),we=y==="popular"?le:y==="top"?ie:oe;g.useEffect(()=>{xa()},[]),g.useEffect(()=>{A(_=>L.length?_%L.length:0)},[L.length]),g.useEffect(()=>{var K;if(L.length<2||(K=window.matchMedia)!=null&&K.call(window,"(prefers-reduced-motion: reduce)").matches)return;const _=window.setInterval(()=>A(Z=>(Z+1)%L.length),8500);return()=>window.clearInterval(_)},[L.length]),g.useEffect(()=>{if(!d)return;let _=!1;return(async()=>{var ae,ke;let Z=[];try{Z=JSON.parse(localStorage.getItem("aniraku-bookmarks")||"[]")}catch{}try{const{data:de}=await B.from("bookmarks").select("anime_id,title").eq("user_id",d.id);de!=null&&de.length&&(Z=de.map(Fe=>({id:Fe.anime_id,title:Fe.title})))}catch{}if(!Z.length||_)return;let ue={};try{ue=JSON.parse(localStorage.getItem("aniraku-episode-track")||"{}")||{}}catch{}const Xe=Date.now(),z=Z.filter(de=>!ue[de.id]||Xe-ue[de.id].t>=216e5);if(z.length){const de=z.map(he=>he.id),Fe=await tu(de);for(const he of z){if(_)return;const se=Fe[he.id];if(!se||se.status!=="RELEASING")continue;const Ce=(ae=se.nextAiringEpisode)!=null&&ae.episode?se.nextAiringEpisode.episode-1:se.episodes||0;Ce<=(((ke=ue[he.id])==null?void 0:ke.e)||0)||fetch(`${Ve}/api/v1/anime/${he.id}/episodes`).then(pe=>pe.ok?pe.json():Promise.reject()).then(async pe=>{const fe=Array.isArray(pe)?pe:pe==null?void 0:pe.episodes;if(!(Array.isArray(fe)&&fe.some((et,Oe)=>Number((et==null?void 0:et.number)??Oe+1)===Ce))||_)return;const ee=`Episode ${Ce} of ${he.title} is now available`,{data:be,error:Ae}=await B.from("notifications").select("id").eq("user_id",d.id).eq("type","new_episode").eq("anime_id",he.id).eq("message",ee).limit(1).maybeSingle();if(_||Ae||be)return;ue[he.id]={e:Ce,t:Xe},localStorage.setItem("aniraku-episode-track",JSON.stringify(ue));const{error:Ze}=await B.from("notifications").insert({user_id:d.id,type:"new_episode",message:ee,anime_id:he.id});Ze&&Ze.code}).catch(()=>{})}}})(),()=>{_=!0}},[d]);const Se=["Action","Adventure","Comedy","Drama","Ecchi","Fantasy","Horror","Mystery","Psychological","Romance","Sci-Fi","Slice of Life","Sports","Supernatural","Thriller"],Re=g.useMemo(()=>cu(),[]),Ye=g.useMemo(()=>lu(l,Re,T==null?void 0:T.id),[l,Re,T==null?void 0:T.id]);g.useEffect(()=>{if(C.current||O.current||!l.length)return;const _=uu(Ye);_!==w&&E(_),C.current=!0},[w,l.length,Ye]);const Je=Ye[w]||[];return a.jsxs(a.Fragment,{children:[a.jsx(du,{children:a.jsxs(hu,{children:[a.jsxs(pu,{children:[a.jsx(Ia,{size:10})," Browse trending series, movies, and the latest Aniraku schedule in one place."]}),t?T?a.jsxs(fu,{$image:Tu(T),children:[a.jsxs(mu,{children:[a.jsxs("span",{className:"status",children:[a.jsx(Jr,{size:9})," ",(xe=T==null?void 0:T.nextAiringEpisode)!=null&&xe.episode?`Episode ${T.nextAiringEpisode.episode} next`:"Featured now"]}),a.jsx("h1",{children:ve(T)}),a.jsxs(gu,{children:[T.format&&a.jsxs("span",{children:[a.jsx(Ra,{size:9})," ",T.format]}),T.episodes&&a.jsxs("span",{children:[T.episodes," episodes"]}),T.averageScore&&a.jsxs("span",{children:[a.jsx(ka,{size:9})," ",T.averageScore]}),a.jsxs("span",{children:[a.jsx(Jr,{size:9})," 24 mins"]})]}),zn(T.description)&&a.jsx("p",{className:"summary",children:zn(T.description)}),a.jsxs(xu,{children:[a.jsxs(Ln,{$quiet:!0,to:Mt(T),children:["Details ",a.jsx(qe,{size:10})]}),a.jsxs(Ln,{to:Lu(T),children:[a.jsx(Ca,{size:10})," Watch now"]})]})]}),a.jsxs(bu,{"aria-label":"Featured anime controls",children:[a.jsx("button",{type:"button","aria-label":"Previous featured title",onClick:()=>A(_=>(_-1+L.length)%L.length),children:a.jsx(Er,{size:10})}),a.jsxs("span",{children:[f+1," / ",L.length]}),a.jsx("button",{type:"button","aria-label":"Next featured title",onClick:()=>A(_=>(_+1)%L.length),children:a.jsx(qe,{size:10})})]})]},T.id):a.jsx(Dn,{children:"Trending metadata is temporarily unavailable. Please try again shortly."}):a.jsx(Dn,{children:"Finding something to watch."}),a.jsx(yu,{"aria-label":"Browse genres",children:Se.map(_=>a.jsx(F,{to:`/catalog?genre=${encodeURIComponent(_)}`,children:_},_))}),a.jsxs(vu,{children:[a.jsxs(Sr,{"aria-label":"Browse anime",children:[a.jsxs(Mn,{children:[a.jsx("h2",{children:"Discover anime"}),a.jsxs(F,{to:"/catalog",children:["View all ",a.jsx(qe,{size:10})]})]}),a.jsxs(wu,{role:"tablist","aria-label":"Anime collection",children:[a.jsx("button",{type:"button",role:"tab","aria-selected":y==="newest",onClick:()=>k("newest"),children:"Newest"}),a.jsx("button",{type:"button",role:"tab","aria-selected":y==="popular",onClick:()=>k("popular"),children:"Popular"}),a.jsx("button",{type:"button",role:"tab","aria-selected":y==="top",onClick:()=>k("top"),children:"Top rated"})]}),a.jsx(Mu,{items:we})]}),a.jsxs(Sr,{"aria-label":"Top airing anime",children:[a.jsxs(Mn,{children:[a.jsx("h2",{children:"Top airing"}),a.jsxs(F,{to:"/catalog?status=RELEASING",children:["All ",a.jsx(qe,{size:10})]})]}),a.jsx(yt,{items:oe,label:"Airing"})]})]}),a.jsxs(Ru,{children:[a.jsxs(tr,{"aria-label":"Recently completed anime",children:[a.jsxs("div",{className:"panel-title",children:[a.jsx("h2",{children:"Just finished"}),a.jsx(F,{className:"more",to:"/catalog?status=FINISHED",children:"More"})]}),a.jsx(yt,{items:v,label:"Finished"})]}),a.jsxs(tr,{"aria-label":"Top anime movies",children:[a.jsxs("div",{className:"panel-title",children:[a.jsx("h2",{children:"Top movies"}),a.jsx(F,{className:"more",to:"/catalog?format=MOVIE",children:"More"})]}),a.jsx(yt,{items:S,label:"Movie"})]}),a.jsxs(tr,{"aria-label":"Upcoming anime",children:[a.jsxs("div",{className:"panel-title",children:[a.jsx("h2",{children:"Upcoming"}),a.jsx(F,{className:"more",to:"/catalog?status=NOT_YET_RELEASED",children:"More"})]}),a.jsx(yt,{items:q,label:"Upcoming"})]})]}),a.jsx(al,{}),a.jsxs(ku,{"aria-label":"Airing schedule",children:[a.jsxs(Cu,{children:[a.jsxs("div",{children:[a.jsxs("p",{children:[a.jsx(Jn,{size:10})," Airing schedule"]}),a.jsx("h2",{children:"Keep up with every episode."})]}),a.jsxs(F,{to:"/schedule",children:["Full schedule ",a.jsx(qe,{size:10})]})]}),a.jsx(Ou,{"aria-label":"Upcoming days",children:Re.map((_,K)=>a.jsx("button",{type:"button","aria-pressed":K===w,"aria-label":`Show releases for ${K===0?"today":_.date.toLocaleDateString([],{weekday:"long",month:"short",day:"numeric"})}`,onClick:()=>{O.current=!0,E(K)},children:_.label},_.key))}),a.jsx(Pu,{children:Je.map(_=>{var K,Z;return a.jsxs(_u,{to:Mt(_),title:`Open ${ve(_)}`,children:[a.jsx("img",{src:Dr(_),alt:"",loading:"lazy"}),a.jsxs("div",{children:[a.jsx("h3",{children:ve(_)}),a.jsx("p",{children:(K=_==null?void 0:_.nextAiringEpisode)!=null&&K.airingAt?new Date(_.nextAiringEpisode.airingAt*1e3).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"Upcoming"})]}),a.jsxs("span",{children:["EP ",((Z=_==null?void 0:_.nextAiringEpisode)==null?void 0:Z.episode)||"?"]})]},_.id)})}),!Je.length&&a.jsx(Iu,{children:"No scheduled releases for this day."})]})]})}),a.jsx(ai,{compact:!0}),a.jsx("div",{className:"bottom-nav-spacer"})]})}const zu=na`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`,Fr=x.div`
  background: linear-gradient(
    100deg,
    var(--bg-elevated) 35%,
    var(--bg-card) 50%,
    var(--bg-elevated) 65%
  );
  background-size: 200% 100%;
  animation: ${zu} 1.1s ease-in-out infinite;
  border-radius: var(--radius-md, 8px);
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`,Y={};Y.Skeleton=Fr;Y.Hero=x.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2em;
  justify-content: center;
  padding: 0 2em;
  width: 100%;
  height: 600px;
  align-items: start;
  @media screen and (max-width: 1400px) {
    height: 570px;
  }
  @media screen and (max-width: 1299px) {
    height: 500px;
  }
  @media screen and (max-width: 768px) {
    height: 380px;
    padding: 0 1.25em;
  }
`;Y.Group=x.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
  width: min(460px, 80%);
`;Y.Rank=x.div`
  width: 44px;
  height: 18px;
  border-radius: var(--radius-full, 999px);
`;Y.Title=x.div`
  width: min(420px, 70%);
  height: 36px;
  border-radius: var(--radius-md, 8px);
`;Y.Desc=x.div`
  width: 100%;
  height: 12px;
  border-radius: var(--radius-md, 8px);
`;Y.DescShort=x(Y.Desc)`
  width: 60%;
`;Y.CTA=x.div`
  width: 150px;
  height: 46px;
  border-radius: var(--radius-full, 999px);
`;Y.SectionTitle=x.div`
  width: 160px;
  height: 22px;
  border-radius: var(--radius-md, 8px);
`;Y.Wrapper=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.5em;
  margin: 1.5em 2em 2em;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    margin: 1.25em;
    gap: 1em;
  }
`;Y.Card=x(Fr)`
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-lg, 12px);
`;Y.CardBar=x(Fr)`
  width: 70%;
  height: 12px;
  margin-top: 10px;
  border-radius: var(--radius-md, 8px);
`;Y.CardBlock=x.div`
  display: flex;
  flex-direction: column;
`;function G(){return a.jsxs(a.Fragment,{children:[a.jsx(Xn,{}),a.jsx(Y.Wrapper,{children:Array.from({length:8}).map((e,t)=>a.jsxs(Y.CardBlock,{children:[a.jsx(Y.Card,{}),a.jsx(Y.CardBar,{})]},t))})]})}class Yi extends g.Component{constructor(){super(...arguments);mt(this,"state",{hasError:!1,error:null});mt(this,"retry",()=>{this.setState({hasError:!1,error:null})});mt(this,"home",()=>{window.location.href="/"})}static getDerivedStateFromError(r){return{hasError:!0,error:r}}componentDidUpdate(r){this.props.resetKey!==r.resetKey&&this.state.hasError&&this.setState({hasError:!1,error:null})}render(){var r;return this.state.hasError?a.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",fontFamily:"sans-serif",background:"#000",color:"#e2e8f0",padding:"1rem",textAlign:"center"},children:[a.jsx("h2",{style:{marginBottom:"0.5rem"},children:"Something went wrong"}),a.jsx("p",{style:{maxWidth:520,marginBottom:"1rem",color:"var(--text-muted, #8c8c8c)",lineHeight:1.6},children:((r=this.state.error)==null?void 0:r.message)||"An unexpected error occurred."}),a.jsx("p",{style:{maxWidth:520,marginBottom:"1rem",color:"var(--text-muted, #8c8c8c)",fontSize:"0.85rem",lineHeight:1.5},children:"No account or playback data was changed. You can retry, return home, or report this diagnostic to the Aniraku project."}),a.jsxs("div",{style:{display:"flex",gap:"0.75rem",flexWrap:"wrap",justifyContent:"center"},children:[a.jsx("button",{onClick:this.retry,style:{padding:"0.5rem 1.5rem",background:"var(--accent)",color:"#000",border:"none",borderRadius:"9999px",cursor:"pointer",fontSize:"1rem",fontWeight:600},children:"Try again"}),a.jsx("button",{onClick:this.home,style:{padding:"0.5rem 1.5rem",background:"transparent",color:"var(--text-muted, #8c8c8c)",border:"1px solid var(--border, #333)",borderRadius:"9999px",cursor:"pointer",fontSize:"1rem"},children:"Back to Home"}),a.jsx("a",{href:"https://github.com/Aniraku/Aniraku/issues/new?template=bug_report.md",target:"_blank",rel:"noreferrer",style:{padding:"0.5rem 1.5rem",color:"var(--text-muted, #8c8c8c)",border:"1px solid var(--border, #333)",borderRadius:"9999px",fontSize:"1rem",textDecoration:"none"},children:"Report a problem"})]})]}):this.props.children}}const Fn=({children:e})=>{const{pathname:t}=De();return a.jsx(Yi,{resetKey:t,children:e})},Fu=()=>{const[e,t]=g.useState(!1),r=Hi();return g.useEffect(()=>{const n=i=>{var s;return t(!!((s=i.detail)!=null&&s.unavailable))};return window.addEventListener("aniraku:anilist-status",n),()=>window.removeEventListener("aniraku:anilist-status",n)},[]),e?a.jsxs("div",{role:"status","aria-live":"polite",style:{position:"relative",zIndex:1200,background:"#251717",borderBottom:"1px solid rgba(248,113,113,0.48)",color:"#fee2e2",padding:"10px var(--content-pad)",display:"flex",alignItems:"center",justifyContent:"center",gap:12,flexWrap:"wrap",fontSize:13,lineHeight:1.45},children:[a.jsxs("span",{children:[a.jsx("strong",{children:"AniList is temporarily unavailable."})," Discovery, search, and some metadata will recover automatically when the upstream service responds."]}),a.jsx("button",{type:"button",onClick:()=>r.refetchQueries({type:"active"}),style:{minHeight:32,padding:"0 11px",border:"1px solid rgba(254,226,226,0.55)",borderRadius:6,background:"transparent",color:"#fff",fontWeight:700,cursor:"pointer"},children:"Try again"})]}):null},Nu=g.lazy(()=>ne(()=>import("./Watch-B5Q6Lnp4.js"),__vite__mapDeps([0,1,2,3]))),Bu=g.lazy(()=>ne(()=>import("./Dmca-BaTUNIuf.js"),__vite__mapDeps([0,1,2,3]))),$u=g.lazy(()=>ne(()=>import("./Privacy-CQ8re58j.js"),__vite__mapDeps([0,1,2,3]))),Uu=g.lazy(()=>ne(()=>import("./License-R5VRTUuD.js"),__vite__mapDeps([0,1,2,3]))),Hu=g.lazy(()=>ne(()=>import("./Terms-CGLOaHWs.js"),__vite__mapDeps([0,1,2,3]))),qu=g.lazy(()=>ne(()=>import("./CommunityGuidelines-CERLjkf4.js"),__vite__mapDeps([0,1,2,3]))),Vu=g.lazy(()=>ne(()=>import("./AnimeDetail-S38Ap1nf.js"),__vite__mapDeps([0,1,2,3]))),rr=g.lazy(()=>ne(()=>import("./Auth-DSuoXZ4v.js"),__vite__mapDeps([0,1,2,3]))),Wu=g.lazy(()=>ne(()=>import("./NewPassword-opABT-d4.js"),__vite__mapDeps([0,1,2,3]))),Qu=g.lazy(()=>ne(()=>import("./Profile-9b3SF-r7.js"),__vite__mapDeps([0,2,3,1]))),Ku=g.lazy(()=>ne(()=>import("./Settings-DccV-i1Q.js"),__vite__mapDeps([0,1,2,3]))),Gu=g.lazy(()=>ne(()=>import("./Catalog-BaZioTLS.js"),__vite__mapDeps([0,1,2,3]))),Yu=g.lazy(()=>ne(()=>import("./Schedule-B1Rycvs7.js"),__vite__mapDeps([0,1,2,3]))),Ju=g.lazy(()=>ne(()=>import("./Admin-CcW-YUDb.js"),__vite__mapDeps([0,1,2,3]))),Xu=g.lazy(()=>ne(()=>import("./Random-CsSMy6_-.js"),__vite__mapDeps([0,1,2,3]))),Zu=g.lazy(()=>ne(()=>import("./SyncCallback-Bz61fB-r.js"),__vite__mapDeps([0,1,2,3]))),ed=()=>{const e=window.location.pathname.replace("/genre/","");return a.jsx(He,{to:`/catalog?genre=${encodeURIComponent(e)}`,replace:!0})},td=()=>{const{pathname:e,search:t}=De();return g.useEffect(()=>{window.scrollTo(0,0),document.querySelectorAll('script[data-aniraku-seo="true"]').forEach(n=>n.remove())},[e]),g.useEffect(()=>{if(e.startsWith("/watch/")||e.startsWith("/anime/")||e==="/catalog"||e==="/schedule"||e==="/")return;ze({"/profile":"Profile — Aniraku","/profile/settings":"Settings — Aniraku","/login":"Sign In — Aniraku","/signup":"Create Account — Aniraku","/auth/forgot-password":"Reset Password — Aniraku","/auth/new-password":"Choose a New Password — Aniraku","/admin":"Admin — Aniraku","/random":"Random Anime — Aniraku","/sync/callback":"Library Sync — Aniraku","/dmca":"DMCA — Aniraku","/privacy":"Privacy Policy — Aniraku","/license":"AGPL-3.0 License — Aniraku","/terms":"Terms of Service — Aniraku","/community-guidelines":"Community Guidelines — Aniraku"}[e]||(t?"Aniraku":"Aniraku — Free Anime Streaming"))},[e,t]),null},rd=()=>a.jsxs(ia,{children:[a.jsx("a",{className:"skip-link",href:"#main",children:"Skip to content"}),a.jsx(ma,{children:a.jsxs(Yi,{children:[a.jsx(td,{}),a.jsx(Xn,{}),a.jsx(Fu,{}),a.jsx(Da,{}),a.jsx(Ka,{}),a.jsx(vs,{}),a.jsxs(aa,{children:[a.jsx(H,{path:"/",element:a.jsx(Du,{})}),a.jsx(H,{path:"/catalog",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Gu,{})})}),a.jsx(H,{path:"/schedule",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Yu,{})})}),a.jsx(H,{path:"/watch/:slugId",element:a.jsx(Fn,{children:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Nu,{})})})}),a.jsx(H,{path:"/anime/:slugId",element:a.jsx(Fn,{children:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Vu,{})})})}),a.jsx(H,{path:"/dmca",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Bu,{})})}),a.jsx(H,{path:"/privacy",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx($u,{})})}),a.jsx(H,{path:"/license",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Uu,{})})}),a.jsx(H,{path:"/terms",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Hu,{})})}),a.jsx(H,{path:"/community-guidelines",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(qu,{})})}),a.jsx(H,{path:"/login",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(rr,{mode:"login"})})}),a.jsx(H,{path:"/signup",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(rr,{mode:"signup"})})}),a.jsx(H,{path:"/auth/forgot-password",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(rr,{mode:"forgot"})})}),a.jsx(H,{path:"/auth/new-password",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Wu,{})})}),a.jsx(H,{path:"/profile",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Qu,{})})}),a.jsx(H,{path:"/profile/settings",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Ku,{})})}),a.jsx(H,{path:"/sync/callback",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Zu,{})})}),a.jsx(H,{path:"/settings",element:a.jsx(He,{to:"/profile/settings",replace:!0})}),a.jsx(H,{path:"/admin",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Ju,{})})}),a.jsx(H,{path:"/top-airing",element:a.jsx(He,{to:"/catalog?status=RELEASING",replace:!0})}),a.jsx(H,{path:"/most-popular",element:a.jsx(He,{to:"/catalog?sort=POPULARITY_DESC",replace:!0})}),a.jsx(H,{path:"/movies",element:a.jsx(He,{to:"/catalog?format=MOVIE",replace:!0})}),a.jsx(H,{path:"/tv-series",element:a.jsx(He,{to:"/catalog?format=TV",replace:!0})}),a.jsx(H,{path:"/genre/:genre",element:a.jsx(ed,{})}),a.jsx(H,{path:"/random",element:a.jsx(g.Suspense,{fallback:a.jsx(G,{}),children:a.jsx(Xu,{})})}),a.jsx(H,{path:"/*",element:a.jsx(Ns,{})})]}),a.jsx(ea,{}),a.jsx(ta,{})]})})]}),nd=new yl({defaultOptions:{queries:{retry:!1,refetchOnWindowFocus:!1,refetchOnReconnect:!1}}});ra.createRoot(document.getElementById("root")).render(a.jsx(ye.StrictMode,{children:a.jsx(kl,{client:nd,children:a.jsx(rd,{})})}));"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js?v=5").catch(()=>{})});export{ir as $,Ve as A,Od as B,Er as C,Wr as D,Yn as E,Gn as F,ai as G,O1 as H,Ue as I,$e as J,ud as K,Ca as L,Yd as M,e1 as N,Id as O,t1 as P,Xd as Q,$d as R,Kn as S,Zd as T,yd as U,Jd as V,Pd as W,bd as X,nr as Y,ua as Z,ne as _,Qd as a,$r as a0,ga as a1,A1 as a2,E1 as a3,Vd as a4,Bd as a5,Td as a6,gd as a7,Ld as a8,vd as a9,Jr as aA,qe as aB,Ar as aC,P as aD,Fd as aa,Dd as ab,Cd as ac,vl as ad,bl as ae,R1 as af,j1 as ag,it as ah,Bl as ai,Vi as aj,jd as ak,Gd as al,Md as am,hd as an,Nd as ao,zd as ap,Rd as aq,Ra as ar,Yr as as,Wd as at,qd as au,wd as av,k1 as aw,C1 as ax,pd as ay,Jn as az,ka as b,Ki as c,Jc as d,ld as e,Qi as f,ct as g,dd as h,ze as i,wr as j,Ud as k,Ed as l,md as m,Kd as n,kd as o,_d as p,Sd as q,xd as r,B as s,Ad as t,Dt as u,Hd as v,eu as w,S1 as x,Pt as y,fd as z};
