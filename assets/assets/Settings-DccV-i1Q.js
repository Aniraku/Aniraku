import{r as s,j as e}from"./react-BDLNM8R1.js";import{g as o}from"./styling-nw0auVTP.js";import{u as Ue,c as Oe,G as xe,a4 as He,a5 as _e,R as Me,a6 as Xe,a7 as Ke,a8 as Ve,a9 as Ge,aa as qe,X as N,M as Ye,ab as Ze,a as Je,ac as Qe,a3 as et,s as I}from"./index-CbwXtSbX.js";import{g as tt,P as b,c as rt,h as nt}from"./sync-DKRuGEJV.js";import{P as ot}from"./ProviderIcon-Jyl0-Eth.js";import{P as st}from"./Skeletons-DiNrHJeY.js";import{u as at,L as O}from"./router-jK2CEO6W.js";import"./supabase-CG6S1lgy.js";const it=()=>{try{const r=[];for(let a=0;a<localStorage.length;a++){const d=localStorage.key(a);d&&(d.startsWith("aniraku-")||d.startsWith("sb-"))&&r.push(d)}r.forEach(a=>localStorage.removeItem(a))}catch{}},pe=r=>{try{localStorage.removeItem(r)}catch{}},ue=o.main`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  padding: 40px 20px calc(40px + env(safe-area-inset-bottom, 0));

  @media (max-width: 480px) {
    padding: 24px 16px calc(32px + env(safe-area-inset-bottom, 0));
  }
`,ge=o.div`
  max-width: 640px;
  margin: 0 auto;
`,ct=o.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`,lt=o(O)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  color: var(--text-primary);
  transition: border-color var(--transition-fast), background var(--transition-fast);
  &:hover {
    border-color: var(--border-hover);
    background: var(--bg-elevated);
  }
`,me=o.h1`
  font-size: 22px;
  font-weight: 700;
`,fe=o.p`
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 24px;
`,m=o.section`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    padding: 16px;
  }
`,f=o.h2`
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  margin-bottom: 16px;
`,dt=o.button`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 44px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  &:disabled { opacity: 0.55; cursor: wait; }
`,ht=o.span`
  position: relative;
  display: block;
  width: 64px;
  height: 34px;
  border-radius: 999px;
  box-sizing: border-box;
  background: ${({active:r})=>r?"#fff":"#0c0c0c"};
  border: 1px solid ${({active:r})=>r?"#fff":"#3f3f46"};
  box-shadow: ${({active:r})=>r?"0 0 14px rgba(255, 255, 255, 0.25)":"none"};
  transition: background var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
`,xt=o.span`
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: ${({active:r})=>r?"#000":"#71717a"};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.45);
  transform: translateX(${({active:r})=>r?"30px":"0"});
  transition: transform var(--transition-normal), background var(--transition-normal);
`,pt=({icon:r,title:a,desc:d,checked:h,disabled:y,onChange:D})=>e.jsxs(c,{children:[e.jsxs(l,{children:[e.jsxs("h3",{children:[r&&e.jsx("span",{className:"row-icon",style:{color:"var(--text-muted)"},children:r}),a]}),d&&e.jsx("p",{children:d})]}),e.jsx(dt,{active:h,disabled:y,onClick:()=>D(!h),"aria-label":a,role:"switch","aria-checked":h,children:e.jsx(ht,{active:h,children:e.jsx(xt,{active:h})})})]}),j=o.div`
  & > *:not(:last-child) {
    border-bottom: 1px solid var(--border);
  }
`,c=o.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 0;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`,l=o.div`
  min-width: 0;
  h3 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  p {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
  }
`,p=o.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 10px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: ${({$busy:r})=>r?"wait":"pointer"};
  opacity: ${({$busy:r,$disabled:a})=>r||a?.6:1};
  pointer-events: ${({$disabled:r})=>r?"none":"auto"};
  min-height: 44px;

  &:hover { border-color: var(--border-hover); }

  @media (max-width: 480px) {
    width: 100%;
  }
`,ut=o(O)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 10px 16px;
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  color: var(--bg);
  font-size: 13px;
  font-weight: 600;
  min-height: 44px;
  text-decoration: none;

  @media (max-width: 480px) {
    width: 100%;
  }
`,gt=o(p)`
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
  &:hover { border-color: var(--accent); }
`,U=o.span`
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  margin-left: 6px;
  vertical-align: 2px;
  background: ${({ok:r})=>r?"rgba(34,197,94,0.15)":"var(--bg-elevated)"};
  color: ${({ok:r})=>r?"#86efac":"var(--text-muted)"};
`,T=o.p`
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
`,E=o.button`
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #ef4444;
  border-radius: var(--radius-md);
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: ${r=>r.$disabled?"wait":"pointer"};
  opacity: ${r=>r.$disabled?.6:1};
  &:hover { background: rgba(239, 68, 68, 0.2); }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`,mt=o.input`
  width: 100%;
  max-width: 220px;
  padding: 10px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #ef4444; }

  @media (max-width: 480px) {
    max-width: 100%;
  }
`,ft=o.p`
  font-size: 13px;
  color: #ef4444;
  margin-top: 10px;
`,yt=o.p`
  font-size: 13px;
  color: #fca5a5;
  margin-top: 8px;
`,ye=o.input`
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: var(--accent); }
`,bt=o.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;

  &:last-child { border-bottom: none; }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`,be=o(p)`
  background: ${({primary:r})=>r?"var(--accent)":"var(--bg-elevated)"};
  color: ${({primary:r})=>r?"var(--bg)":"var(--text-primary)"};
  border-color: ${({primary:r})=>r?"var(--accent)":"var(--border)"};
`,je=({message:r})=>r?e.jsx("div",{role:"status","aria-live":"polite",style:{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.88)",color:"#e2e8f0",padding:"8px 20px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:9999,border:"1px solid rgba(226,232,240,0.12)",backdropFilter:"blur(8px)",pointerEvents:"none",whiteSpace:"nowrap",maxWidth:"calc(100vw - 32px)",overflow:"hidden",textOverflow:"ellipsis"},children:r}):null,Et=()=>{const{user:r,profile:a,loading:d,signOut:h}=Ue(),{nsfwEnabled:y,updateNsfw:D}=Oe(),W=at(),[ve,we]=s.useState(!1),[$,ke]=s.useState(""),[L,H]=s.useState(!1),[_,M]=s.useState(""),[P,X]=s.useState(!1),[K,V]=s.useState(""),A=s.useRef(null),i=s.useCallback(t=>{V(t),clearTimeout(A.current),A.current=setTimeout(()=>V(""),2500)},[]);s.useEffect(()=>()=>clearTimeout(A.current),[]);const Se=async t=>{if(!P){X(!0);try{await D(t),i(t?"NSFW content enabled":"NSFW content hidden")}catch(n){console.error("Save NSFW setting:",n),i("Could not save — check your connection and try again")}finally{X(!1)}}},Ce=async()=>{if(!(!r||$!=="DELETE"||L)){H(!0),M("");try{const{error:t}=await I.rpc("delete_my_account");if(t)throw t;await h(),it(),W("/")}catch(t){console.error("Delete account:",t),M((t==null?void 0:t.message)||"We could not delete your account. Please try again."),H(!1)}}},ze=async()=>{try{await h(),i("Signed out"),W("/")}catch(t){console.error("Sign out:",t),i("Could not sign out — try again")}},[v,Te]=s.useState(null),[F,w]=s.useState({}),[Ee,G]=s.useState(0),[q,De]=s.useState(null);s.useEffect(()=>{if(!r)return;let t=!1;return tt().then(n=>{t||(n&&Te(n),De(Date.now()))}),()=>{t=!0}},[r,Ee]);const Y=t=>{const n=v==null?void 0:v[t];return{connected:!!(n&&n.connected),username:(n==null?void 0:n.username)||"",reason:(n==null?void 0:n.reason)||"",expiresAt:(n==null?void 0:n.expires_at)||0}},B=v?Object.keys(b).filter(t=>Y(t).connected):[],We=t=>{if(!t)return"";const n=Math.floor((t-Date.now()/1e3)/86400);return n>30?`token valid ~${Math.floor(n/30)}mo`:n>0?`token expires in ${n}d`:"token expired — progress will refresh it automatically"},$e=async t=>{if(!F[t]){w(n=>({...n,[t]:!0}));try{const n=await nt(t);if(!n){i("Sync is not set up on the server yet");return}window.location.href=n}finally{w(n=>({...n,[t]:!1}))}}},Le=async t=>{if(F[t])return;w(x=>({...x,[t]:!0}));const n=await rt(t);w(x=>({...x,[t]:!1})),n?(G(x=>x+1),i(`${b[t]} disconnected`)):i("Could not disconnect — try again")},Pe=!!(r&&r.email),[Z,J]=s.useState(!1),[k,Q]=s.useState(""),[ee,te]=s.useState(""),[re,ne]=s.useState(!1),[oe,S]=s.useState(""),Ae=async()=>{if(k.length<6){S("Password must be at least 6 characters");return}if(k!==ee){S("Passwords do not match");return}ne(!0),S("");try{const{error:t}=await I.auth.updateUser({password:k});if(t)throw t;J(!1),Q(""),te(""),i("Password updated")}catch(t){console.error("Update password:",t),S(t.message||"Could not update password")}finally{ne(!1)}},[g,C]=s.useState(""),[u,se]=s.useState(null),Fe=async()=>{if(!g){C("history");try{const t=localStorage.getItem("aniraku-watch-history");await et({userId:r==null?void 0:r.id}),pe("aniraku-episode-track"),t&&se({type:"history",data:t}),z(n=>({...n,history:!1})),i("Watch history cleared (Undo available)")}catch(t){console.error("Clear watch history:",t),i("Could not clear history — try again")}finally{C("")}}},ae=()=>{u&&(u.type==="history"?(localStorage.setItem("aniraku-watch-history",u.data),window.dispatchEvent(new CustomEvent("aniraku:watch-history-changed",{detail:{type:"storage",keys:[]}})),i("Watch history restored")):u.type==="bookmarks"&&(localStorage.setItem("aniraku-bookmarks",u.data),i("Bookmarks restored")),se(null))},Be=async()=>{if(!g){C("bookmarks");try{if(r){const{error:t}=await I.from("bookmarks").delete().eq("user_id",r.id);if(t)throw t}pe("aniraku-bookmarks"),z(t=>({...t,bookmarks:!1})),i("Bookmarks cleared")}catch(t){console.error("Clear bookmarks:",t),i("Could not clear bookmarks — try again")}finally{C("")}}},[ie,z]=s.useState({history:!1,bookmarks:!1}),ce=()=>e.jsxs(m,{children:[e.jsx(f,{children:"Content"}),e.jsx(j,{children:e.jsx(pt,{icon:y?e.jsx(_e,{size:13}):e.jsx(Me,{size:13}),title:y?"NSFW content shown":"NSFW content hidden",desc:"Show adult-rated titles in browsing, search and recommendations.",checked:y,disabled:P,onChange:Se})}),e.jsx(T,{children:"When disabled, adult titles are filtered from lists and their pages show a block screen. You can change this at any time."}),P&&e.jsx(T,{style:{borderTop:"none",paddingTop:0,marginTop:0},children:"Saving to your account…"})]}),le=()=>r?e.jsxs(m,{children:[e.jsx(f,{children:"Library Sync"}),e.jsx("p",{style:{fontSize:13,color:"var(--text-muted)",lineHeight:1.5,marginBottom:8},children:"Keep Aniraku in step with your MyAnimeList and AniList libraries. When you finish an episode here, your progress is pushed to every connected service automatically."}),["mal","anilist"].map(t=>{const{connected:n,username:x,reason:he,expiresAt:Ie}=Y(t),R=!!F[t];return e.jsxs(bt,{children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx(ot,{provider:t,size:16}),e.jsx("span",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)"},children:b[t]}),e.jsx(U,{ok:n,children:n?"Connected":"Off"})]}),n&&x&&e.jsxs("div",{style:{fontSize:12,fontWeight:400,color:"var(--text-muted)",marginTop:2},children:["Syncing as ",e.jsx("strong",{style:{color:"var(--text-secondary)"},children:x})]}),n&&e.jsx("div",{style:{fontSize:11,fontWeight:400,color:"var(--text-muted)",marginTop:1,opacity:.8},children:We(Ie)}),!n&&he&&e.jsx("div",{style:{fontSize:12,fontWeight:400,color:"#fca5a5",marginTop:2},children:he}),n?e.jsxs(be,{$busy:R,onClick:()=>Le(t),children:[e.jsx(Ke,{size:13})," ",R?"Disconnecting…":"Disconnect"]}):e.jsxs(be,{primary:!0,$busy:R,onClick:()=>$e(t),children:[e.jsx(Ve,{size:13})," Connect"]})]},t)}),e.jsxs(c,{style:{borderTop:"1px solid var(--border)",marginTop:8},children:[e.jsxs(l,{children:[e.jsx("h3",{style:{fontSize:13,fontWeight:500},children:B.length?`${B.length} service${B.length>1?"s":""} connected`:"No services connected yet"}),e.jsx("p",{children:q?`Checked ${new Date(q).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`:"Checking status…"})]}),e.jsxs(p,{onClick:()=>{G(t=>t+1)},children:[e.jsx(Ge,{size:13})," Refresh"]})]}),e.jsxs(T,{children:["Connecting opens ",`${b.mal}`," / ",`${b.anilist}`," in a new tab and asks only for permission to update your library list — no password is ever shared with Aniraku."]})]}):e.jsxs(m,{children:[e.jsx(f,{children:"Library Sync"}),e.jsx("p",{style:{fontSize:13,color:"var(--text-muted)",lineHeight:1.5,marginBottom:4},children:"Keep Aniraku in step with your MyAnimeList and AniList libraries. When you finish an episode here, your progress is pushed to every connected service."}),e.jsx(j,{children:e.jsxs(c,{children:[e.jsxs(l,{children:[e.jsxs("h3",{children:[e.jsx(Xe,{size:13})," Sync needs an account"]}),e.jsx("p",{children:"Log in to connect your library and push watch progress automatically."})]}),e.jsx(ut,{to:"/login",children:"Log in"})]})})]}),Re=()=>e.jsxs(m,{children:[e.jsx(f,{children:"Account"}),e.jsxs(j,{children:[e.jsxs(c,{children:[e.jsxs(l,{children:[e.jsx("h3",{style:{fontSize:13,fontWeight:500},children:"Email"}),e.jsx("p",{children:r.email||"No email on this account"})]}),r.email_confirmed_at?e.jsx(U,{ok:!0,children:"Verified"}):e.jsx(U,{ok:!1,children:"Unverified"})]}),(a==null?void 0:a.created_at)&&e.jsx(c,{children:e.jsxs(l,{children:[e.jsx("h3",{style:{fontSize:13,fontWeight:500},children:"Member since"}),e.jsx("p",{children:new Date(a.created_at).toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"})})]})}),Pe&&e.jsxs(e.Fragment,{children:[e.jsxs(c,{children:[e.jsxs(l,{children:[e.jsx("h3",{style:{fontSize:13,fontWeight:500},children:"Password"}),e.jsx("p",{children:"Update the password you use to sign in."})]}),e.jsxs(p,{onClick:()=>J(t=>!t),children:[e.jsx(Ze,{size:13})," ",Z?"Cancel":"Change"]})]}),Z&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:8},children:[e.jsx(ye,{type:"password","aria-label":"New password",placeholder:"New password",value:k,onChange:t=>Q(t.target.value),autoComplete:"new-password"}),e.jsx(ye,{type:"password","aria-label":"Confirm new password",placeholder:"Confirm new password",value:ee,onChange:t=>te(t.target.value),autoComplete:"new-password"}),oe&&e.jsx(yt,{children:oe}),e.jsx("div",{children:e.jsxs(gt,{$busy:re,onClick:Ae,children:[e.jsx(Je,{size:13})," ",re?"Saving…":"Update Password"]})})]})]}),e.jsxs(c,{children:[e.jsxs(l,{children:[e.jsx("h3",{style:{fontSize:13,fontWeight:500},children:"Profile"}),e.jsx("p",{children:"Username, display name, avatar, bookmarks and watch history."})]}),e.jsx(p,{onClick:()=>W("/profile"),children:"Open Profile"})]}),e.jsxs(c,{children:[e.jsxs(l,{children:[e.jsx("h3",{style:{fontSize:13,fontWeight:500},children:"Sign out"}),e.jsx("p",{children:"End this session on this device."})]}),e.jsxs(p,{onClick:ze,children:[e.jsx(Qe,{size:13})," Sign Out"]})]})]})]}),de=t=>e.jsxs(m,{children:[e.jsx(f,{children:"Data"}),e.jsx("p",{style:{fontSize:13,color:"var(--text-muted)",lineHeight:1.5,marginBottom:8},children:t?"Clearing removes this data from this device only. Log in to manage account-wide data.":"Clearing removes this data from your account everywhere you are signed in."}),e.jsxs(j,{children:[e.jsxs(c,{children:[e.jsxs(l,{children:[e.jsxs("h3",{style:{fontSize:13,fontWeight:500},children:[e.jsx(qe,{size:12})," Watch history"]}),e.jsx("p",{children:"Episodes you have watched, and where you left off."})]}),ie.history?e.jsxs(E,{$disabled:!!g,onClick:Fe,children:[e.jsx(N,{size:12})," ",g==="history"?"Clearing…":"Confirm clear"]}):e.jsx(p,{onClick:()=>z(n=>({...n,history:!0})),children:"Clear"})]}),e.jsxs(c,{children:[e.jsxs(l,{children:[e.jsxs("h3",{style:{fontSize:13,fontWeight:500},children:[e.jsx(Ye,{size:12})," Bookmarks"]}),e.jsx("p",{children:"Anime you have saved to your library."})]}),ie.bookmarks?e.jsxs(E,{$disabled:!!g,onClick:Be,children:[e.jsx(N,{size:12})," ",g==="bookmarks"?"Clearing…":"Confirm clear"]}):e.jsx(p,{onClick:()=>z(n=>({...n,bookmarks:!0})),children:"Clear"})]})]}),e.jsx(T,{children:"These actions cannot be undone. The buttons disarm themselves after clearing."})]}),Ne=()=>e.jsxs(m,{style:{borderColor:"rgba(239, 68, 68, 0.35)"},children:[e.jsx(f,{style:{color:"#ef4444"},children:"Danger Zone"}),e.jsx(j,{children:e.jsxs(c,{children:[e.jsxs(l,{children:[e.jsx("h3",{children:"Delete account"}),e.jsx("p",{children:"Permanently removes your profile, watch history, bookmarks, comments and settings. This cannot be undone."})]}),ve?e.jsxs("div",{className:"settings-confirm",style:{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"},children:[e.jsx(mt,{type:"text","aria-label":"Type DELETE to confirm",placeholder:'Type "DELETE" to confirm',value:$,onChange:t=>ke(t.target.value),autoFocus:!0}),e.jsx(E,{$disabled:L||$!=="DELETE",onClick:Ce,children:L?"Deleting…":"Permanently Delete"})]}):e.jsxs(E,{onClick:()=>we(!0),children:[e.jsx(N,{size:13})," Delete Account"]})]})}),_&&e.jsx(ft,{children:_})]});return d?e.jsx(st,{label:"Loading settings"}):r?e.jsx(e.Fragment,{children:e.jsxs(ue,{id:"main",children:[e.jsx(je,{message:K}),u&&e.jsxs("div",{role:"status","aria-live":"polite",style:{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1e293b",color:"#fff",padding:"12px 20px",borderRadius:12,display:"flex",alignItems:"center",gap:16,zIndex:9999,border:"1px solid rgba(255,255,255,0.15)",boxShadow:"0 10px 25px rgba(0,0,0,0.5)"},children:[e.jsx("span",{children:"Action completed. Changed your mind?"}),e.jsx("button",{type:"button",onClick:ae,style:{background:"var(--accent)",color:"#fff",border:"none",padding:"6px 14px",borderRadius:8,fontWeight:600,cursor:"pointer"},children:"Undo"})]}),e.jsxs(ge,{children:[e.jsxs(ct,{children:[e.jsx(lt,{to:"/profile","aria-label":"Back to profile",children:e.jsx(He,{size:16})}),e.jsx(me,{children:"Settings"})]}),e.jsx(fe,{children:"Preferences are saved to your account and follow you across devices."}),ce(),le(),Re(),de(!1),Ne()]}),e.jsx(xe,{}),e.jsx("div",{className:"bottom-nav-spacer"}),e.jsx("style",{children:`
          @media (max-width: 480px) {
            .settings-confirm { width: 100% !important; align-items: stretch !important; }
          }
        `})]})}):e.jsxs(e.Fragment,{children:[e.jsxs(ue,{id:"main",children:[e.jsx(je,{message:K}),u&&e.jsxs("div",{role:"status","aria-live":"polite",style:{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1e293b",color:"#fff",padding:"12px 20px",borderRadius:12,display:"flex",alignItems:"center",gap:16,zIndex:9999,border:"1px solid rgba(255,255,255,0.15)",boxShadow:"0 10px 25px rgba(0,0,0,0.5)"},children:[e.jsx("span",{children:"Action completed. Changed your mind?"}),e.jsx("button",{type:"button",onClick:ae,style:{background:"var(--accent)",color:"#fff",border:"none",padding:"6px 14px",borderRadius:8,fontWeight:600,cursor:"pointer"},children:"Undo"})]}),e.jsxs(ge,{children:[e.jsx(me,{children:"Settings"}),e.jsxs(fe,{children:["Guest preferences are stored on this device only."," ",e.jsx(O,{to:"/login",style:{color:"var(--accent)"},children:"Log in"})," to sync them to your account."]}),ce(),le(),de(!0)]})]}),e.jsx(xe,{}),e.jsx("div",{className:"bottom-nav-spacer"})]})};export{Et as default};
