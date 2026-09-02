import{r as o,j as e}from"./react-BDLNM8R1.js";import{u as K,Y as _,s as E,G as V}from"./index-CbwXtSbX.js";import{g as r}from"./styling-nw0auVTP.js";import{u as G,a as M,L as z}from"./router-jK2CEO6W.js";import"./supabase-CG6S1lgy.js";const O=r.main`
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(20px, env(safe-area-inset-top)) var(--content-pad) max(20px, env(safe-area-inset-bottom));

  @media (max-width: 768px) {
    align-items: flex-start;
    padding-top: calc(var(--header-h) + 18px);
    padding-bottom: var(--mobile-dock-clearance);
  }
`,Z=r.div`
  width: min(100%, 420px);
  min-width: 0;
`,Q=r(z)`
  color: var(--accent);
  text-decoration: none;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: 16px;
  &:hover { text-decoration: underline; }
`,X=r.section`
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);

  @media (max-width: 480px) {
    padding: 26px 18px;
    border-radius: var(--radius-md);
  }
`,ee=r.h1`
  font-size: clamp(25px, 7vw, 28px);
  font-weight: 700;
  margin: 0 0 8px;
  text-align: center;
  color: var(--text-primary);
  line-height: 1.12;
`,te=r.p`
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
  margin: 0 0 28px;
`,R=r.div`
  background: ${t=>t.$tone==="error"?"rgba(229,9,20,0.1)":"rgba(34,197,94,0.1)"};
  border: 1px solid ${t=>t.$tone==="error"?"rgba(229,9,20,0.35)":"rgba(34,197,94,0.35)"};
  border-radius: 8px;
  padding: 11px 14px;
  margin-bottom: 16px;
  color: ${t=>t.$tone==="error"?"#f87171":"#4ade80"};
  font-size: 13px;
  line-height: 1.55;
`,I=r.div`
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 12px;
  padding: 22px 18px;
  margin-bottom: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  strong { color: #4ade80; overflow-wrap: anywhere; }
`,f=r.div`
  margin-bottom: 16px;
`,w=r.label`
  display: block;
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 6px;
`,ae=r.div`
  position: relative;
`,y=r.input`
  width: 100%;
  min-height: 46px;
  padding: 12px 42px 12px 14px;
  background: var(--bg-elevated);
  border: 1px solid ${t=>t.$state==="available"?"rgba(34,197,94,0.8)":t.$state==="taken"?"rgba(229,9,20,0.8)":"var(--border)"};
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--transition-fast);
  &:focus { border-color: var(--accent); }
`,C=r.span`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${t=>t.$state==="available"?"#4ade80":t.$state==="taken"?"#f87171":"var(--text-muted)"};
  font-size: ${t=>t.$state==="checking"?"12px":"17px"};
  line-height: 1;
  pointer-events: none;
`,re=r.p`
  min-height: 17px;
  margin: 6px 0 0;
  color: ${t=>t.$state==="available"?"#4ade80":t.$state==="taken"?"#f87171":"var(--text-muted)"};
  font-size: 12px;
  line-height: 1.4;
`,q=r.button`
  width: 100%;
  min-height: 46px;
  padding: 12px;
  background: var(--accent);
  color: var(--bg);
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: ${t=>t.$loading?"wait":"pointer"};
  opacity: ${t=>t.$loading?.7:1};
`,ne=r.p`
  text-align: center;
  margin: 20px 0 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
  a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    &:hover { text-decoration: underline; }
  }
`,se=r(z)`
  color: var(--accent);
  text-decoration: none;
  font-size: 13px;
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  margin: -6px 0 12px;
  &:hover { text-decoration: underline; }
`,k=t=>t.toLowerCase().replace(/[^a-z0-9_]/g,"_").replace(/_+/g,"_").replace(/^_|_$/g,"").slice(0,20),ie=t=>t.length<8?"Password must be at least 8 characters.":!/[A-Z]/.test(t)||!/[0-9]/.test(t)?"Password must include at least one uppercase letter and one number.":"",pe=({mode:t})=>{const[d,F]=o.useState(""),[x,P]=o.useState(""),[u,T]=o.useState(""),[A,c]=o.useState(""),[g,m]=o.useState(!1),[j,$]=o.useState(""),[i,p]=o.useState("idle"),b=o.useRef(0),{signIn:W,signUp:Y}=K(),B=G(),U=M(),s=t==="login",l=t==="forgot",h=!s&&!l;o.useEffect(()=>{if(!h||!u){p("idle");return}const n=k(u);if(n.length<3){p("short");return}if(!_){p("unavailable");return}const a=++b.current;p("checking");const S=window.setTimeout(async()=>{try{const{data:v,error:L}=await E.rpc("check_username_available",{username:n});if(b.current!==a)return;if(L||typeof v!="boolean"){console.warn("Username availability check failed:",L),p("unavailable");return}p(v?"available":"taken")}catch(v){b.current===a&&(console.warn("Username availability check failed:",v),p("unavailable"))}},350);return()=>{window.clearTimeout(S),b.current+=1}},[h,u]),o.useEffect(()=>{s&&new URLSearchParams(U.search).get("password")==="updated"&&$("passwordUpdated")},[s,U.search]);const D=async n=>{if(n.preventDefault(),c(""),h){const a=ie(x);if(a){c(a);return}if(i==="taken"){c("That username is already taken. Choose another one.");return}if(i==="checking"){c("Please wait while we check your username.");return}}m(!0);try{s?(await W(d,x),B("/")):(await Y(d,x,k(u)),$("signup"),P(""))}catch(a){console.error("Auth error:",a);const S=a!=null&&a.message?typeof a.message=="string"?a.message:JSON.stringify(a.message):(a==null?void 0:a.error_description)||(a==null?void 0:a.error)||"Something went wrong. Please try again.";c(S)}finally{m(!1)}},N=async n=>{if(n.preventDefault(),c(""),!d){c("Enter the email address associated with your Aniraku account.");return}if(!_){c("Password recovery is not configured yet. Please try again later.");return}m(!0);try{const{error:a}=await E.auth.resetPasswordForEmail(d,{redirectTo:`${window.location.origin}/auth/new-password`});if(a)throw a;$("recovery")}catch(a){c((a==null?void 0:a.message)||"We could not send the recovery email. Please try again.")}finally{m(!1)}},H=l?"Reset your password":s?"Welcome back":"Create account",J=l?"Enter your email and we’ll send you a secure recovery link.":s?"Sign in to continue watching on Aniraku.":"Join Aniraku to keep your watch history, ratings, and bookmarks in sync.";return e.jsxs(e.Fragment,{children:[e.jsx(O,{id:"main",children:e.jsxs(Z,{children:[e.jsxs(Q,{to:l?"/login":"/",children:["← ",l?"Back to sign in":"Back to Home"]}),e.jsxs(X,{children:[e.jsx(ee,{children:H}),e.jsx(te,{children:J}),A&&e.jsx(R,{$tone:"error",role:"alert",children:A}),j==="passwordUpdated"&&e.jsx(R,{$tone:"success",children:"Your password was updated. Sign in with your new password."}),j==="signup"?e.jsxs(I,{children:[e.jsx("strong",{children:"Check your inbox"}),e.jsx("br",{}),"We sent an activation link to ",e.jsx("strong",{children:d}),".",e.jsx("br",{}),"Check spam or junk if it does not arrive within a few minutes."]}):j==="recovery"?e.jsxs(I,{children:[e.jsx("strong",{children:"Recovery link sent"}),e.jsx("br",{}),"If an Aniraku account exists for ",e.jsx("strong",{children:d}),", a secure password-reset link is on its way.",e.jsx("br",{}),"The link opens the dedicated new-password screen and can be used once."]}):l?e.jsxs("form",{onSubmit:N,noValidate:!0,children:[e.jsxs(f,{children:[e.jsx(w,{htmlFor:"recovery-email",children:"Email address"}),e.jsx(y,{id:"recovery-email",type:"email",autoComplete:"email",value:d,onChange:n=>F(n.target.value),placeholder:"you@example.com",required:!0})]}),e.jsx(q,{type:"submit",$loading:g,disabled:g,children:g?"Sending recovery link…":"Send recovery link"})]}):e.jsxs("form",{onSubmit:D,noValidate:!0,children:[h&&e.jsxs(f,{children:[e.jsx(w,{htmlFor:"signup-username",children:"Username"}),e.jsxs(ae,{children:[e.jsx(y,{id:"signup-username",type:"text",value:u,onChange:n=>T(n.target.value),required:!0,placeholder:"Choose a username",autoComplete:"username",$state:i,"aria-describedby":"username-status"}),i==="checking"&&e.jsx(C,{$state:"checking",children:"checking…"}),i==="available"&&e.jsx(C,{$state:"available",children:"✓"}),i==="taken"&&e.jsx(C,{$state:"taken",children:"×"})]}),e.jsxs(re,{id:"username-status",$state:i,"aria-live":"polite",children:[i==="short"?"Use 3–20 letters, numbers, or underscores.":"",i==="available"?`@${k(u)} is available.`:"",i==="taken"?`@${k(u)} is already taken.`:"",i==="unavailable"?"Availability check is unavailable. You can still continue; we will verify on signup.":""]})]}),e.jsxs(f,{children:[e.jsx(w,{htmlFor:"auth-email",children:"Email address"}),e.jsx(y,{id:"auth-email",type:"email",autoComplete:"email",value:d,onChange:n=>F(n.target.value),required:!0,placeholder:"you@example.com"})]}),e.jsxs(f,{children:[e.jsx(w,{htmlFor:"auth-password",children:"Password"}),e.jsx(y,{id:"auth-password",type:"password",autoComplete:s?"current-password":"new-password",value:x,onChange:n=>P(n.target.value),required:!0,placeholder:h?"8+ characters, uppercase and number":"Your password"})]}),s&&e.jsx(se,{to:"/auth/forgot-password",children:"Forgot password?"}),e.jsx(q,{type:"submit",$loading:g,disabled:g,children:g?"Please wait…":s?"Sign in":"Create account"})]}),e.jsxs(ne,{children:[l?"Remember your password? ":s?"Don’t have an account? ":"Already have an account? ",e.jsx(z,{to:l?"/login":s?"/signup":"/login",children:l?"Sign in":s?"Sign up":"Sign in"})]})]})]})}),e.jsx(V,{})]})};export{pe as default};
