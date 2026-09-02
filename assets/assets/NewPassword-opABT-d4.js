import{r as c,j as e}from"./react-BDLNM8R1.js";import{g as o}from"./styling-nw0auVTP.js";import{Y as q,s as p,G as T}from"./index-CbwXtSbX.js";import{u as E,L as F}from"./router-jK2CEO6W.js";import"./supabase-CG6S1lgy.js";const L=o.main`
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`,U=o.div`
  width: 100%;
  max-width: 440px;
`,A=o(F)`
  color: var(--accent);
  text-decoration: none;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: 16px;
  &:hover { text-decoration: underline; }
`,B=o.section`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
  box-shadow: var(--shadow-lg);
  @media (max-width: 480px) {
    padding: 28px 20px;
    border-radius: var(--radius-md);
  }
`,M=o.div`
  width: 46px;
  height: 46px;
  margin: 0 auto 16px;
  border-radius: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  color: var(--accent);
  font-family: var(--font-brand);
  font-size: 25px;
  line-height: 1;
`,W=o.h1`
  color: var(--text-primary);
  font-size: 28px;
  margin: 0 0 8px;
  text-align: center;
`,Y=o.p`
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 28px;
  text-align: center;
`,k=o.div`
  margin-bottom: 16px;
`,j=o.label`
  color: var(--text-secondary);
  display: block;
  font-size: 13px;
  margin-bottom: 6px;
`,S=o.input`
  box-sizing: border-box;
  width: 100%;
  min-height: 46px;
  padding: 12px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 16px;
  outline: none;
  &:focus { border-color: var(--accent); }
`,R=o.button`
  width: 100%;
  min-height: 46px;
  padding: 12px 16px;
  border: 0;
  border-radius: 8px;
  background: var(--accent);
  color: var(--bg);
  font-size: 15px;
  font-weight: 700;
  cursor: ${r=>r.$loading?"wait":"pointer"};
  opacity: ${r=>r.$loading?.7:1};
`,C=o.div`
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid ${r=>r.$tone==="error"?"rgba(229,9,20,0.45)":"rgba(34,197,94,0.35)"};
  background: ${r=>r.$tone==="error"?"rgba(229,9,20,0.1)":"rgba(34,197,94,0.1)"};
  color: ${r=>r.$tone==="error"?"#f87171":"#4ade80"};
  font-size: 13px;
  line-height: 1.55;
`,I=o.p`
  margin: -6px 0 18px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
`;function N(r,i){return r.length<8?"Use at least 8 characters.":!/[A-Z]/.test(r)||!/[0-9]/.test(r)?"Include at least one uppercase letter and one number.":r!==i?"The two passwords do not match.":""}const Z=()=>{const r=E(),[i,l]=c.useState("verifying"),[h,P]=c.useState(""),[m,$]=c.useState(""),[b,s]=c.useState(""),[g,f]=c.useState(!1),v=c.useMemo(()=>{const t=new URLSearchParams(window.location.hash.replace(/^#/,"")),a=new URLSearchParams(window.location.search);return t.get("type")==="recovery"||a.get("type")==="recovery"},[]);c.useEffect(()=>{if(!q){s("Account recovery is unavailable because Supabase is not configured."),l("invalid");return}let t=!0,a=!1;const n=()=>{!t||a||(a=!0,s(""),l("ready"),window.history.replaceState({},document.title,"/auth/new-password"))},{data:{subscription:y}}=p.auth.onAuthStateChange((d,w)=>{d==="PASSWORD_RECOVERY"&&w&&n()});if(v)p.auth.getSession().then(({data:d,error:w})=>{!t||a||(d!=null&&d.session?n():w&&(s("This recovery link could not be verified. Please request a new link."),l("invalid")))}).catch(()=>{t&&!a&&(a=!0,s("This recovery link could not be verified. Please request a new link."),l("invalid"))});else{const d=window.setTimeout(()=>{t&&!a&&(a=!0,s("This password-reset link is missing or has already been used. Please request a new one."),l("invalid"))},1600);return()=>{t=!1,window.clearTimeout(d),y.unsubscribe()}}return()=>{t=!1,y.unsubscribe()}},[v]);const z=async t=>{t.preventDefault();const a=N(h,m);if(a){s(a);return}f(!0),s("");try{const{error:n}=await p.auth.updateUser({password:h});if(n)throw n;await p.auth.signOut({scope:"local"}),l("complete"),window.setTimeout(()=>r("/login?password=updated",{replace:!0}),1800)}catch(n){s((n==null?void 0:n.message)||"We could not update your password. Request a new recovery link and try again.")}finally{f(!1)}},x=i==="ready",u=i==="complete";return e.jsxs(e.Fragment,{children:[e.jsx(L,{id:"main",children:e.jsxs(U,{children:[e.jsx(A,{to:u?"/login":"/auth/forgot-password",children:"← Back to sign in"}),e.jsxs(B,{"aria-live":"polite",children:[e.jsx(M,{"aria-hidden":"true",children:"A"}),e.jsx(W,{children:u?"Password updated":i==="verifying"?"Verifying reset link":x?"Choose a new password":"Reset link unavailable"}),e.jsx(Y,{children:u?"Your password has been changed. Redirecting you to sign in securely.":i==="verifying"?"We are securely verifying your recovery link.":x?"Create a strong password you have not used elsewhere.":"Recovery links expire and can only be used once."}),b&&e.jsx(C,{$tone:"error",role:"alert",children:b}),u&&e.jsx(C,{$tone:"success",children:"You can now sign in with your new password."}),x&&e.jsxs("form",{onSubmit:z,noValidate:!0,children:[e.jsxs(k,{children:[e.jsx(j,{htmlFor:"new-password",children:"New password"}),e.jsx(S,{id:"new-password",type:"password",autoComplete:"new-password",value:h,onChange:t=>P(t.target.value),autoFocus:!0,required:!0})]}),e.jsxs(k,{children:[e.jsx(j,{htmlFor:"confirm-new-password",children:"Confirm new password"}),e.jsx(S,{id:"confirm-new-password",type:"password",autoComplete:"new-password",value:m,onChange:t=>$(t.target.value),required:!0})]}),e.jsx(I,{children:"Use at least 8 characters, including one uppercase letter and one number."}),e.jsx(R,{type:"submit",$loading:g,disabled:g,children:g?"Updating password…":"Set new password"})]}),i==="invalid"&&e.jsx(R,{type:"button",onClick:()=>r("/auth/forgot-password",{replace:!0}),children:"Request a new link"})]})]})}),e.jsx(T,{compact:!0})]})};export{Z as default};
