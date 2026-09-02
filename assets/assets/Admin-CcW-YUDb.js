import{r as n,j as e}from"./react-BDLNM8R1.js";import{u as w,s as A,G as g}from"./index-CbwXtSbX.js";import{g as t}from"./styling-nw0auVTP.js";import{u as C,L as E}from"./router-jK2CEO6W.js";import"./supabase-CG6S1lgy.js";const f=t.div`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  padding: 40px 20px;
`,v=t.div`
  max-width: 1000px;
  margin: 0 auto;
`,b=t.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
`,S=t.p`
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 24px;
`,F=t.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`,l=t.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`,a=t.div`
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
`,d=t.div`
  font-size: 13px;
  color: var(--text-muted);
`,x=t.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`,y=t.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
`,R=()=>{const{user:r,isAdmin:o,loading:i}=w(),m=C(),[c,k]=n.useState({users:0,comments:0,bookmarks:0}),[p,z]=n.useState([]),[h,u]=n.useState("");return n.useEffect(()=>{!i&&!r&&m("/login")},[r,i,m]),n.useEffect(()=>{!r||!o||A.rpc("admin_stats").then(({data:s,error:j})=>{if(j){u(j.message||"Failed to load stats");return}k({users:(s==null?void 0:s.users)||0,comments:(s==null?void 0:s.comments)||0,bookmarks:(s==null?void 0:s.bookmarks)||0}),z((s==null?void 0:s.recent_users)||[])}).catch(()=>u("Failed to load stats"))},[r,o]),i||!r?null:o?e.jsxs(e.Fragment,{children:[e.jsx(f,{children:e.jsxs(v,{children:[e.jsx(b,{children:"Admin Dashboard"}),e.jsx(S,{children:"Manage users, content, and system health"}),e.jsxs(F,{children:[h&&e.jsx(x,{children:e.jsx("p",{style:{color:"#ef4444",fontSize:14},children:h})}),e.jsxs(l,{children:[e.jsx(a,{children:c.users}),e.jsx(d,{children:"Total Users"})]}),e.jsxs(l,{children:[e.jsx(a,{children:c.comments}),e.jsx(d,{children:"Comments"})]}),e.jsxs(l,{children:[e.jsx(a,{children:c.bookmarks}),e.jsx(d,{children:"Bookmarks"})]})]}),e.jsxs(x,{children:[e.jsx(y,{children:"Recent Users"}),p.length===0?e.jsx("p",{style:{color:"var(--text-muted)",fontSize:13},children:"No users yet"}):p.map(s=>e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"},children:[e.jsx("span",{style:{fontSize:14},children:s.display_name||s.username||"User"}),e.jsx("span",{style:{fontSize:12,color:"var(--text-muted)"},children:s.created_at?new Date(s.created_at).toLocaleDateString():"—"})]},s.id))]}),e.jsxs(x,{children:[e.jsx(y,{children:"System Health"}),e.jsxs("div",{style:{display:"flex",gap:24,flexWrap:"wrap"},children:[e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:13,color:"var(--text-muted)"},children:"Supabase"}),e.jsx("p",{style:{fontSize:14,color:"#22c55e"},children:"Connected"})]}),e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:13,color:"var(--text-muted)"},children:"API Backend"}),e.jsx("p",{style:{fontSize:14,color:"var(--text-muted)"},children:"Check /api/v1/health"})]})]})]})]})}),e.jsx(g,{})]}):e.jsxs(e.Fragment,{children:[e.jsx(f,{children:e.jsxs(v,{children:[e.jsx(b,{children:"Access Denied"}),e.jsx(S,{children:"You don't have admin access."}),e.jsx(E,{to:"/",style:{color:"var(--accent)",fontSize:14},children:"Back to Home"})]})}),e.jsx(g,{})]})};export{R as default};
