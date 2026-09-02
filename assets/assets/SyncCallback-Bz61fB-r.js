import{r as a,j as e}from"./react-BDLNM8R1.js";import{g as c}from"./styling-nw0auVTP.js";import{l as u,n as j,k as v,a4 as y,G as b}from"./index-CbwXtSbX.js";import{j as k,P as h}from"./sync-DKRuGEJV.js";import{P as S}from"./ProviderIcon-Jyl0-Eth.js";import{d as C,L as F}from"./router-jK2CEO6W.js";import"./supabase-CG6S1lgy.js";const z=c.main`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  padding: 40px 20px calc(40px + env(safe-area-inset-bottom, 0));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`,E=c.section`
  max-width: 420px;
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  text-align: center;
`,p=c.div`
  font-size: 15px;
  font-weight: 600;
  margin-top: 16px;
`,m=c.p`
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-top: 8px;
`,P=c(F)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 20px;
  background: var(--accent);
  color: var(--bg);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
`;function A(){const[x]=C(),i=x.get("code"),s=x.get("state"),[n,g]=a.useState(!1),[r,f]=a.useState(""),[d,l]=a.useState("");return a.useEffect(()=>{if(!i&&!s&&!n){const t=sessionStorage.getItem("aniraku-sync-connected");t&&(f(t),g(!0))}},[i,s,n]),a.useEffect(()=>{if(n)return;if(!i||!s){l("This link is incomplete or has expired. Open it from Settings instead.");return}let t=!1;return k("",i,s).then(o=>{t||(!o.error&&o.connected?(f(o.provider||""),g(!0),sessionStorage.setItem("aniraku-sync-connected",o.provider||""),window.history.replaceState({},"","/sync/callback")):l(o.error||"The provider rejected the connection. Try again."))}).catch(()=>{t||l("Could not reach the server. Try again from Settings.")}),()=>{t=!0}},[i,s,n]),e.jsxs(e.Fragment,{children:[e.jsx(z,{id:"main",children:e.jsxs(E,{role:"status","aria-live":"polite",children:[!n&&!d&&e.jsxs(e.Fragment,{children:[e.jsx(u,{size:40,color:"var(--accent)",className:"sync-spin"}),e.jsx(p,{children:"Connecting your library…"}),e.jsx(m,{children:"Finishing the handshake. This only takes a moment."})]}),n&&e.jsxs(e.Fragment,{children:[r?e.jsx(S,{provider:r,size:46}):e.jsx(j,{size:44,color:"#34d399"}),e.jsxs(p,{children:["Connected to ",r?h[r]||r:"your library"]}),e.jsxs(m,{children:["From now on, finishing episodes on Aniraku updates your"," ",r?h[r]||r:"external"," library."]})]}),d&&e.jsxs(e.Fragment,{children:[e.jsx(v,{size:44,color:"#fbbf24"}),e.jsx(p,{children:"Connection failed"}),e.jsx(m,{children:d})]}),e.jsxs(P,{to:"/profile/settings",children:[e.jsx(y,{size:13})," Back to Settings"]})]})}),e.jsx(b,{}),e.jsx("div",{className:"bottom-nav-spacer"}),e.jsx("style",{children:`
        @keyframes sync-cb-spin { to { transform: rotate(360deg); } }
        .sync-spin { animation: sync-cb-spin 1s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .sync-spin { animation: none; } }
      `})]})}export{A as default};
