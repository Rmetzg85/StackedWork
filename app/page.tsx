"use client";
import { useState, useEffect, useRef } from "react";
const G = "#C8E64A";
const GD = "#A8C435";
const FEATURES = [
  { icon: "🏗️", title: "AI-Powered CRM", desc: "Track every job, client, and dollar. Voice-to-job entry means you log work from the truck, not a desk.", link: "dashboard" },
  { icon: "🌐", title: "AI Website Service", desc: "Need a website built or updated? We offer AI-powered website services for contractors — inquire for pricing.", link: "dashboard" },
  { icon: "📸", title: "AI Photo Mockups", desc: "Snap a photo on-site, get a realistic rendering of the finished job in seconds. Close deals on the spot.", link: "mockups" },
  { icon: "📊", title: "Revenue Dashboard", desc: "See what you've earned this week, this month, this year. Know which jobs are profitable and which aren't.", link: "dashboard" },
  { icon: "📲", title: "Lead Management", deshc: "Track every lead, follow up on time, and never let a job slip through the cracks.", link: "jobs" },
  { icon: "💬", title: "Text Us To Update Anything", desc: "Need your phone number changed on your site? New photo? Just text us. We handle it.", link: "dashboard" },
];
const COMPARISONS = [
  { item: "CRM software", them: "$50-100/mo", us: "Included" },
  { item: "AI design mockup tools", them: "$30-50/mo", us: "Included" },
  { item: "Lead management", them: "$30/mo plugin", us: "Included" },
  { item: "Revenue tracking", them: "$20-40/mo", us: "Included" },
  { item: "AI website build/updates", them: "$75/hr freelancer", us: "Add-on" },
  { item: "Total", them: "$200+/mo", us: "$49.99/mo" },
];
const JOBS = [ { id:1, customer:"John Smith", phone:"(410) 555-0122", type:"Plumbing", value:450, status:"quoted", date:"2026-02-20", completed:null }, { id:2, customer:"Sarah Johnson", phone:"(410) 555-0188", type:"Drywall", value:1200, status:"scheduled", date:"2026-02-25", completed:null }, { id:3, customer:"Mike Davis", phone:"(443) 555-0301", type:"Electrical", value:650, status:"in-progress", date:"2026-02-18", completed:null }, { id:4, customer:"Lisa Brown", phone:"(410) 555-0445", type:"General", value:300, status:"complete", date:"2026-02-10", completed:"2026-02-14" }, { id:5, customer:"Tom Wilson", phone:"(443) 555-0567", type:"Plumbing", value:890, status:"complete", date:"2026-02-08", completed:"2026-02-12" }, { id:6, customer:"Emma Davis", phone:"(410) 555-0678", type:"Painting", value:1250, status:"complete", date:"2026-02-05", completed:"2026-02-09" }, { id:7, customer:"Robert Garcia", phone:"(443) 555-0789", type:"HVAC", value:2100, status:"complete", date:"2026-01-28", completed:"2026-02-02" }, { id:8, customer:"Angela White", phone:"(410) 555-0890", type:"Roofing", value:3500, status:"complete", date:"2026-01-20", completed:"2026-01-26" }, ];
const LEADS = [ { id:1, name:"Chris Mitchell", phone:"(410) 555-2211", email:"chris.m@gmail.com", msg:"Need a quote for bathroom remodel - 2 bath, gut job. Available weekends.", time:"2 hours ago", ts:"2h", urgent:false }, { id:2, name:"Tanya Washington", phone:"(443) 555-3344", email:"tanya.w@yahoo.com", msg:"Do you do commercial HVAC? We have a 3-unit strip mall that needs service.", time:"1 day ago", ts:"1d", urgent:false }, { id:3, name:"Derek Johnson", phone:"(410) 555-9087", email:"djohnson88@gmail.com", msg:"Emergency pipe burst in basement - need help ASAP. Water everywhere.", time:"3 days ago", ts:"3d", urgent:true }, { id:4, name:"Maria Santos", phone:"(443) 555-6712", email:"maria.santos@outlook.com", msg:"Looking for someone to finish my deck before summer. About 400 sq ft.", time:"5 days ago", ts:"5d", urgent:false }, ];
const FOLLOW_UPS = [ { customer:"Diana Ross", lastJob:"Kitchen remodel - $4,200", months:4 }, { customer:"James Carter", lastJob:"Bathroom plumbing - $1,100", months:5 }, { customer:"Patricia Neal", lastJob:"Deck repair - $2,800", months:6 }, ];
const STC: Record<string, {bg:string;text:string;label:string}> = { quoted:{ bg:"#FEF3C7", text:"#92400E", label:"Quoted" }, scheduled:{ bg:"#DBEAFE", text:"#1E40AF", label:"Scheduled" }, "in-progress":{ bg:"#E0E7FF", text:"#3730A3", label:"In Progress" }, complete:{ bg:"#D1FAE5", text:"#065F46", label:"Complete" }, };
const Badge = ({ s }: {s:string}) => <span style={{ display:"inline-block", padding:"4px 10px", borderRadius:100, fontSize:11, fontWeight:600, background:STC[s].bg, color:STC[s].text }}>{STC[s].label}</span>;
const Btn = ({ children, onClick, style }: any) => <button onClick={onClick} style={{ padding:"8px 18px", background:G, color:"#132440", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans'", ...style }}>{children}</button>;
const BtnO = ({ children, onClick, style }: any) => <button onClick={onClick} style={{ padding:"8px 18px", background:"#fff", color:"#64748B", border:"1px solid #E2E8F0", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'DM Sans'", ...style }}>{children}</button>;
const Card = ({ children, style }: any) => <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, ...style }}>{children}</div>;
const Divider = () => <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(200,230,74,0.25),transparent)", margin:"0 auto", maxWidth:600 }} />;
export default function StackedWork() {
  const [page, setPage] = useState("landing");
  const [authMode, setAuthMode] = useState<"login"|"signup"|"forgot"|null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authError, setAuthError] = useState<string|null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState<string|null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [af, setAf] = useState(0);
  const [vw, setVw] = useState("dashboard");
  const [jf, setJf] = useState("all");
  const [ms, setMs] = useState("gallery");
  const [mSt, setMSt] = useState<string|null>(null);
  const [mGn, setMGn] = useState(false);
  const [mDn, setMDn] = useState(false);
  const [ntf, setNtf] = useState(false);
  const [sms, setSms] = useState(false);
  const [spv, setSpv] = useState(false);
  const [tst, setTst] = useState<any>(null);
  const [td, setTd] = useState(false);
  const [mPh, setMPh] = useState<string|null>(null);
  const [mFile, setMFile] = useState<File|null>(null);
  const [mJt, setMJt] = useState<string>("other");
  const [mErr, setMErr] = useState<string|null>(null);
  const [mResult, setMResult] = useState<{beforeUrl:string,afterUrl:string}|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleMockupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setMPh(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerateMockup = async () => {
    if (!mFile) return;
    setMGn(true); setMErr(null);
    try {
      const fd = new FormData();
      fd.append("image", mFile); fd.append("jobType", mJt); fd.append("style", mSt || "Modern Minimalist");
      const res = await fetch("/api/generate-mockup", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) { setMResult({ beforeUrl: data.mockup.beforeUrl, afterUrl: data.mockup.afterUrl }); setMGn(false); setMDn(true); }
      else { throw new Error(data.error || "Generation failed"); }
    } catch { setMGn(false); setMErr("Generation failed. Please try again."); }
  };

  const handleAuth = async () => {
    setAuthLoading(true); setAuthError(null); setAuthSuccess(null);
    try {
      if (authMode === "forgot") {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setAuthSuccess("Password reset email sent! Check your inbox.");
      } else if (authMode === "signup") {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { username: authUsername } } });
        if (error) throw error;
        setAuthSuccess("Account created! Check your email to verify your account.");
      } else {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        setAuthMode(null); setPage("app");
      }
    } catch (err: any) { setAuthError(err.message || "Something went wrong"); }
    setAuthLoading(false);
  };

  useEffect(() => { const h = () => setScrollY(window.scrollY); window.addEventListener("scroll",h); return () => window.removeEventListener("scroll",h); }, []);
  useEffect(() => { const i = setInterval(() => setAf(p=>(p+1)%FEATURES.length),4000); return () => clearInterval(i); }, []);
  useEffect(() => { if(page==="app"&&vw==="dashboard"&&!td){ const t=setTimeout(()=>setTst({name:"Chris Mitchell",msg:"Need a quote for bathroom remodel"}),3000); return()=>clearTimeout(t); }}, [page,vw,td]);
  useEffect(() => {
    import("@supabase/supabase-js").then(({ createClient }) => {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      supabase.auth.getSession().then(({ data: { session } }) => { if (session) setPage("app"); });
    });
  }, []);

  const done = JOBS.filter(j=>j.status==="complete");
  const moR = done.filter(j=>{const d=new Date(j.completed!);return d.getMonth()===1&&d.getFullYear()===2026}).reduce((a,j)=>a+j.value,0);
  const wkR = done.filter(j=>new Date(j.completed!)>=new Date("2026-02-20")).reduce((a,j)=>a+j.value,0);
  const ytd = done.reduce((a,j)=>a+j.value,0);
  const gl = 12000;
  const fJ = jf==="all"?JOBS:JOBS.filter(j=>j.status===jf);

  const handleSubscribe = () => {
    window.location.href = "/login";
  };
  if(page==="app"){
    const nv=[{id:"dashboard",ic:"📊",lb:"Home"},{id:"jobs",ic:"🔨",lb:"Jobs"},{id:"mockups",ic:"📸",lb:"Mockups"},{id:"customers",ic:"👥",lb:"Clients"},{id:"followups",ic:"🔔",lb:"Alerts"}];
    return(
      <div style={{fontFamily:"'DM Sans',sans-serif",background:"#132440",minHeight:"100vh"}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
          *{margin:0;padding:0;box-sizing:border-box}
          @keyframes toastSlide{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
          @keyframes pulseMk{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
          @keyframes barLoad{from{width:0}to{width:100%}}
          .sw-bn{position:fixed;bottom:0;left:0;right:0;background:#0F1D32;border-top:1px solid rgba(255,255,255,0.08);display:flex;z-index:50;padding:4px 0 env(safe-area-inset-bottom,6px)}
          .sw-bi{flex:1;display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 2px;cursor:pointer;border:none;background:none;font-family:'DM Sans'}
          .sw-bi .sw-ic{font-size:18px}.sw-bi .sw-lb{font-size:9px;font-weight:500;color:#94A3B8}
          .sw-bi.sw-a .sw-lb{color:${GD};font-weight:700}
          .sw-sd{display:none}
          @media(min-width:768px){.sw-sd{display:flex;flex-direction:column;gap:4px;width:220px;background:#0F1D32;border-right:1px solid rgba(255,255,255,0.08);padding:24px 12px;flex-shrink:0}.sw-bn{display:none}
          .sw-sl{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;transition:all .2s;color:#94A3B8}
          .sw-sl:hover{background:rgba(255,255,255,0.08);color:#fff}.sw-sl.sw-a{background:${G};color:#132440;font-weight:700}}
          .sw-sg{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
          @media(min-width:768px){.sw-sg{grid-template-columns:repeat(4,1fr)}}
          .sw-jm{padding:14px 16px;border-bottom:1px solid #F1F5F9}.sw-jd{display:none}
          @media(min-width:768px){.sw-jm{display:none}.sw-jd{display:grid;grid-template-columns:1.5fr 1fr .8fr .8fr .8fr;padding:14px 20px;border-bottom:1px solid #F1F5F9;align-items:center;font-size:14px}.sw-jd:hover{background:#FAFBFC}}
          .sw-fb{padding:6px 14px;border-radius:100px;border:1px solid #E2E8F0;background:#fff;font-size:12px;cursor:pointer;font-family:'DM Sans';color:#64748B;transition:all .2s}
          .sw-fb:hover{border-color:${G};color:${GD}}.sw-fb.sw-a{background:${G};color:#132440;border-color:${G};font-weight:600}
        `}</style>
        <div style={{background:"#0F1D32",borderBottom:"1px solid rgba(255,255,255,0.08)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:40}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,background:"#4A82C4",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:"#fff",fontFamily:"'DM Sans'",letterSpacing:"-0.03em"}}>SW</div>
            <span style={{fontWeight:700,fontSize:15,color:"#fff"}}>StackedWork</span>
            <span style={{background:"#FEF3C7",color:"#92400E",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:100,fontFamily:"'Space Mono'"}}>DEMO</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{position:"relative"}}>
              <button onClick={()=>setNtf(!ntf)} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 9px",cursor:"pointer",fontSize:16,lineHeight:1}}>🔔<span style={{position:"absolute",top:-4,right:-4,width:18,height:18,background:"#EF4444",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",border:"2px solid #0F1D32"}}>{LEADS.length}</span></button>
              {ntf&&<div style={{position:"absolute",top:50,right:0,width:360,maxWidth:"calc(100vw - 32px)",background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,boxShadow:"0 12px 40px rgba(0,0,0,0.15)",zIndex:60,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:"2px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>New Leads</span><span style={{fontSize:12,color:GD,fontWeight:600,cursor:"pointer"}} onClick={()=>{setNtf(false)}}>View All</span></div>
                {LEADS.slice(0,3).map((l,i)=><div key={i} style={{padding:"14px 16px",borderBottom:i<2?"1px solid #F1F5F9":"none",cursor:"pointer"}} onClick={()=>{setNtf(false)}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontWeight:600,fontSize:13,color:"#0F172A"}}>{l.name}</span><span style={{fontSize:11,color:"#94A3B8"}}>{l.ts}</span></div>
                  <div style={{fontSize:12,color:"#64748B"}}>{l.msg.slice(0,55)}...</div>
                  {l.urgent&&<span style={{display:"inline-block",marginTop:4,fontSize:10,fontWeight:700,color:"#EF4444",background:"#FEE2E2",padding:"2px 8px",borderRadius:100}}>URGENT</span>}
                </div>)}
              </div>}
            </div>
            <button onClick={()=>setSms(true)} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 9px",cursor:"pointer",fontSize:16,lineHeight:1}}>📱</button>
            <button onClick={()=>setPage("landing")} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"#94A3B8",padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>Back</button>
          </div>
        </div>
        {tst&&!td&&<div style={{position:"fixed",top:70,right:16,zIndex:60,background:"#fff",border:"1px solid #E2E8F0",borderLeft:`4px solid ${G}`,borderRadius:12,padding:16,boxShadow:"0 8px 30px rgba(0,0,0,0.12)",maxWidth:340,width:"calc(100% - 32px)",animation:"toastSlide .5s ease forwards"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:G}}/><span style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>New Lead!</span></div><button onClick={()=>{setTd(true);setTst(null)}} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:18,padding:0}}>x</button></div>
          <div style={{fontWeight:600,fontSize:13,color:"#0F172A",marginBottom:2}}>{tst.name}</div><div style={{fontSize:12,color:"#64748B",marginBottom:10}}>{tst.msg}</div>
          <div style={{display:"flex",gap:8}}><Btn onClick={()=>{setTd(true);setTst(null)}} style={{flex:1,fontSize:11,padding:6}}>View Lead</Btn><BtnO onClick={()=>{setTd(true);setSms(true)}} style={{flex:1,fontSize:11,padding:6}}>SMS Alert</BtnO></div>
        </div>}
        {sms&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:70,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setSms(false)}>
          <div style={{background:"#1A1A1A",borderRadius:32,padding:12,maxWidth:320,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}} onClick={(e: React.MouseEvent)=>e.stopPropagation()}>
            <div style={{background:"#fff",borderRadius:24,overflow:"hidden"}}>
              <div style={{background:"#F2F2F7",padding:"12px 20px 8px",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:600}}>9:41 AM</span><span style={{fontSize:12}}>📶 🔋</span></div>
              <div style={{background:"#F2F2F7",padding:"8px 20px 12px",borderBottom:"1px solid #D1D1D6",textAlign:"center"}}><div style={{fontWeight:700,fontSize:16}}>StackedWork</div><div style={{fontSize:11,color:"#8E8E93"}}>Text Message</div></div>
              <div style={{padding:16,minHeight:280,display:"flex",flexDirection:"column",gap:12}}>
                <div style={{background:"#E9E9EB",borderRadius:18,padding:"10px 14px",maxWidth:"85%",fontSize:14,lineHeight:1.5}}><div style={{fontWeight:600,marginBottom:4}}>🔔 New Lead!</div><div><strong>Chris Mitchell</strong></div><div style={{marginTop:4}}>(410) 555-2211</div><div style={{marginTop:4}}>&quot;Bathroom remodel - 2 bath, gut job.&quot;</div><div style={{marginTop:8,fontSize:12,color:"#666"}}>Reply CALL to auto-schedule</div></div>
                <div style={{background:"#34C759",color:"#fff",borderRadius:18,padding:"10px 14px",maxWidth:"85%",fontSize:14,marginLeft:"auto",textAlign:"right"}}>CALL</div>
                <div style={{background:"#E9E9EB",borderRadius:18,padding:"10px 14px",maxWidth:"85%",fontSize:14,lineHeight:1.5}}>Callback scheduled for Chris Mitchell.</div>
              </div>
              <div style={{padding:12,background:"#F2F2F7",textAlign:"center",borderTop:"1px solid #D1D1D6"}}><span style={{fontSize:12,color:"#8E8E93"}}>Tap outside to close</span></div>
            </div>
          </div>
        </div>}
        <div style={{display:"flex",minHeight:"calc(100vh - 53px)"}}>
          <aside className="sw-sd"><div style={{marginBottom:20}}/>{nv.map(n=><div key={n.id} className={`sw-sl ${vw===n.id?"sw-a":""}`} onClick={()=>setVw(n.id)}><span>{n.ic}</span> {n.lb}</div>)}</aside>
          <main style={{flex:1,padding:"20px 16px 100px",maxWidth:960,overflow:"auto"}}>
            {vw==="dashboard"&&<>
              <h1 style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:18}}>Revenue Dashboard</h1>
              <div className="sw-sg">{[{l:"Today",v:"$0",s:"0 jobs"},{l:"This Week",v:`$${wkR.toLocaleString()}`,s:"last 7 days"},{l:"This Month",v:`$${moR.toLocaleString()}`,s:`$${gl.toLocaleString()} goal`},{l:"YTD 2026",v:`$${ytd.toLocaleString()}`,s:`${done.length} jobs`}].map((s,i)=>
                <div key={i} style={{background:"linear-gradient(135deg,#0F172A,#1E293B)",borderRadius:12,padding:16,color:"#fff"}}><div style={{fontSize:10,color:"#94A3B8",fontFamily:"'Space Mono'",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>{s.l}</div><div style={{fontSize:22,fontWeight:700,marginBottom:2}}>{s.v}</div><div style={{fontSize:11,color:"#94A3B8"}}>{s.s}</div></div>
              )}</div>
              <Card style={{padding:20,marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:14,fontWeight:600,color:"#0F172A"}}>Monthly Goal</span><span style={{fontSize:13,fontWeight:600,color:GD}}>{Math.round((moR/gl)*100)}%</span></div>
                <div style={{height:8,background:"#1E293B",borderRadius:100,overflow:"hidden"}}><div style={{height:"100%",background:`linear-gradient(90deg,${G},${GD})`,borderRadius:100,width:`${Math.min((moR/gl)*100,100)}%`,transition:"width .6s"}}/></div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:11,color:"#94A3B8"}}>${moR.toLocaleString()} earned</span><span style={{fontSize:11,color:"#94A3B8"}}>${(gl-moR).toLocaleString()} to go</span></div>
              </Card>
              <Card style={{overflow:"hidden",marginBottom:20}}>
                <div style={{padding:"14px 18px",borderBottom:"1px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:14,fontWeight:600,color:"#0F172A"}}>Recent Jobs</span><Btn onClick={()=>setVw("jobs")} style={{fontSize:11,padding:"5px 12px"}}>View All</Btn></div>
                {JOBS.slice(0,4).map((j,i)=><div key={i} style={{padding:"12px 18px",borderBottom:i<3?"1px solid #F1F5F9":"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13,color:"#0F172A"}}>{j.customer}</div><div style={{fontSize:11,color:"#94A3B8"}}>{j.type} - {j.date}</div></div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontWeight:600,fontSize:13}}>${j.value.toLocaleString()}</span><Badge s={j.status}/></div></div>)}
              </Card>
            </>}
            {vw==="jobs"&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:"#fff"}}>Jobs</h1><Btn>+ New Job</Btn></div>
              <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{["all","quoted","scheduled","in-progress","complete"].map(f=><button key={f} className={`sw-fb ${jf===f?"sw-a":""}`} onClick={()=>setJf(f)}>{f==="all"?"All":STC[f]?.label||f}</button>)}</div>
              <Card style={{overflow:"hidden"}}>{fJ.map(j=><div key={j.id} className="sw-jm"><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div><div style={{fontWeight:600,fontSize:14,color:"#0F172A"}}>{j.customer}</div><div style={{fontSize:11,color:"#94A3B8"}}>{j.type} - {j.date}</div></div><div style={{fontWeight:700,fontSize:15,color:"#0F172A"}}>${j.value.toLocaleString()}</div></div><Badge s={j.status}/></div>)}</Card>
            </>}
            {vw==="mockups"&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
                <div><h1 style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:2}}>AI Photo Mockups</h1><p style={{fontSize:13,color:"#94A3B8"}}>Show customers the finished job before you start.</p></div>
                <Btn onClick={()=>{setMs("upload");setMDn(false);setMSt(null);setMGn(false);setMPh(null);setMFile(null);setMJt("other");setMErr(null);setMResult(null)}}>+ New Mockup</Btn>
              </div>
              {ms==="gallery"&&<Card style={{overflow:"hidden"}}>
                <div style={{padding:"14px 18px",borderBottom:"2px solid #F1F5F9"}}><span style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>Recent Mockups</span></div>
                {[{c:"Sarah Johnson",p:"Bathroom Remodel",t:"Modern White Tile",d:"Feb 24",x:"Sent",e:"🚿"},{c:"John Smith",p:"Kitchen Backsplash",t:"Herringbone Marble",d:"Feb 22",x:"Closed",e:"🍳"},{c:"Angela White",p:"Deck Addition",t:"Composite Cedar",d:"Feb 18",x:"Closed",e:"🏡"}].map((m,i)=>
                  <div key={i} style={{padding:"14px 18px",borderBottom:i<2?"1px solid #F1F5F9":"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:48,height:36,borderRadius:8,background:"linear-gradient(135deg,#E0E7FF,#DBEAFE)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{m.e}</div><div><div style={{fontWeight:600,fontSize:13,color:"#0F172A"}}>{m.c} - {m.p}</div><div style={{fontSize:11,color:"#94A3B8"}}>{m.t} - {m.d}</div></div></div>
                    <span style={{fontSize:11,color:m.x==="Closed"?"#16A34A":"#64748B",fontWeight:500}}>{m.x}</span>
                  </div>
                )}
              </Card>}
              {ms==="upload"&&!mGn&&!mDn&&<Card style={{padding:24}}>
                <div onClick={()=>fileRef.current?.click()} style={{border:mPh?`2px solid ${G}`:"2px dashed #D1D5DB",borderRadius:16,padding:mPh?"12px":"40px 20px",textAlign:"center",marginBottom:20,background:mPh?"rgba(200,230,74,0.06)":"#FAFBFC",cursor:"pointer"}}><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMockupFile} style={{display:"none"}}/>{mPh?<div><img src={mPh} alt="Preview" style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:10,marginBottom:8}}/><div style={{fontSize:12,color:"#64748B",fontWeight:500}}>Photo uploaded — tap to change</div></div>:<><div style={{fontSize:44,marginBottom:10}}>📸</div><div style={{fontWeight:600,fontSize:15,color:"#0F172A",marginBottom:4}}>Take a photo or upload</div><div style={{fontSize:12,color:"#94A3B8"}}>Snap a pic of the room or area</div></>}</div>
                <div style={{marginBottom:20}}><div style={{fontWeight:600,fontSize:13,color:"#0F172A",marginBottom:10}}>Job type</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{[["🚿 Bath","bathroom"],["🍳 Kitchen","kitchen"],["🎨 Paint","paint"],["🏡 Exterior","exterior"],["🪵 Deck","deck"],["🔧 Other","other"]].map(([label,key],i)=><div key={i} onClick={()=>setMJt(key)} style={{padding:"10px 6px",textAlign:"center",border:mJt===key?`2px solid ${G}`:"1px solid #E2E8F0",borderRadius:8,fontSize:12,fontWeight:500,color:mJt===key?"#132440":"#475569",background:mJt===key?"rgba(200,230,74,0.1)":"#fff",cursor:"pointer"}}>{label}</div>)}</div></div>
                <div style={{marginBottom:20}}><div style={{fontWeight:600,fontSize:13,color:"#0F172A",marginBottom:10}}>Style</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[{n:"Modern Minimalist",d:"Clean lines, neutral"},{n:"Classic Traditional",d:"Warm wood, timeless"},{n:"Industrial",d:"Exposed, dark metals"},{n:"Farmhouse",d:"Shiplap, rustic"}].map((x,i)=><div key={i} onClick={()=>setMSt(x.n)} style={{padding:12,border:mSt===x.n?`2px solid ${G}`:"1px solid #E2E8F0",borderRadius:10,cursor:"pointer",background:mSt===x.n?"rgba(200,230,74,0.08)":"#fff"}}><div style={{fontWeight:600,fontSize:12,color:"#0F172A",marginBottom:2}}>{x.n}</div><div style={{fontSize:11,color:"#94A3B8"}}>{x.d}</div></div>)}</div></div>
                {mErr&&<div style={{marginBottom:12,padding:"10px 14px",background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,fontSize:12,color:"#991B1B"}}>{mErr}</div>}
                <Btn onClick={handleGenerateMockup} style={{width:"100%",padding:14,fontSize:15,opacity:mFile?1:0.5,cursor:mFile?"pointer":"not-allowed"}}>Generate Mockup</Btn>
              </Card>}
              {mGn&&<Card style={{padding:48,textAlign:"center"}}><div style={{fontSize:44,marginBottom:14,animation:"pulseMk 1.5s infinite"}}>🎨</div><div style={{fontWeight:700,fontSize:18,color:"#0F172A",marginBottom:6}}>Generating mockup...</div><div style={{fontSize:13,color:"#94A3B8",marginBottom:20}}>AI is rendering a realistic preview</div><div style={{width:"100%",maxWidth:280,margin:"0 auto",height:6,background:"#E2E8F0",borderRadius:100,overflow:"hidden"}}><div style={{height:"100%",background:`linear-gradient(90deg,${G},${GD})`,borderRadius:100,animation:"barLoad 3s ease forwards"}}/></div></Card>}
              {mDn&&<Card style={{overflow:"hidden"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:200}}><div style={{background:"linear-gradient(135deg,#94A3B8,#CBD5E1)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:0,borderRight:"2px solid #fff",position:"relative",overflow:"hidden"}}>{(mResult?.beforeUrl||mPh)?<><img src={mResult?.beforeUrl||mPh!} alt="Before" style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/><div style={{position:"relative",zIndex:2,fontWeight:700,fontSize:13,color:"#fff",textShadow:"0 1px 6px rgba(0,0,0,0.5)",background:"rgba(0,0,0,0.4)",padding:"4px 14px",borderRadius:100}}>BEFORE</div></>:<><div style={{fontSize:36,marginBottom:6}}>🏚️</div><div style={{fontWeight:700,fontSize:13,color:"#fff",textShadow:"0 1px 3px rgba(0,0,0,0.3)"}}>BEFORE</div></>}</div><div style={{background:`linear-gradient(135deg,${GD},${G})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:0,position:"relative",overflow:"hidden"}}>{mResult?.afterUrl?<><img src={mResult.afterUrl} alt="After" style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/><div style={{position:"relative",zIndex:2,fontWeight:700,fontSize:13,color:"#132440",background:`${G}dd`,padding:"4px 14px",borderRadius:100}}>AFTER ✨</div></>:mPh?<><img src={mPh} alt="After" style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0,filter:"brightness(1.15) contrast(1.1) saturate(1.3) hue-rotate(15deg)"}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(200,230,74,0.25),rgba(168,196,53,0.15))",mixBlendMode:"overlay"}}/><div style={{position:"relative",zIndex:2,fontWeight:700,fontSize:13,color:"#132440",background:`${G}dd`,padding:"4px 14px",borderRadius:100}}>AFTER ✨</div></>:<><div style={{fontSize:36,marginBottom:6}}>✨</div><div style={{fontWeight:700,fontSize:13,color:"#132440"}}>AFTER</div></>}</div></div><div style={{padding:18}}><div style={{fontWeight:600,fontSize:14,color:"#0F172A",marginBottom:3}}>Mockup - {mSt||"Modern Minimalist"}</div><div style={{fontSize:12,color:"#94A3B8",marginBottom:14}}>Generated just now</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Btn style={{fontSize:12}}>Send to Customer</Btn><BtnO style={{fontSize:12}}>Save to Job</BtnO><BtnO onClick={()=>{setMs("gallery");setMDn(false);setMPh(null);setMResult(null)}} style={{fontSize:12}}>Gallery</BtnO></div></div></Card>}
            </>}
            {vw==="customers"&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:"#fff"}}>Customers</h1><Btn>+ Add</Btn></div>
              <Card style={{overflow:"hidden"}}>{[...new Map(JOBS.map(j=>[j.customer,j])).values()].map((job,i)=>{const cj=JOBS.filter(j=>j.customer===job.customer);const tot=cj.reduce((a,j)=>a+j.value,0);return<div key={i} style={{padding:"14px 18px",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:"50%",background:`hsl(${i*45},60%,90%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:`hsl(${i*45},60%,35%)`}}>{job.customer.charAt(0)}</div><div><div style={{fontWeight:600,fontSize:13,color:"#0F172A"}}>{job.customer}</div><div style={{fontSize:11,color:"#94A3B8"}}>{job.phone}</div></div></div><div style={{textAlign:"right"}}><div style={{fontWeight:600,fontSize:13}}>${tot.toLocaleString()}</div><div style={{fontSize:11,color:"#94A3B8"}}>{cj.length} job{cj.length!==1?"s":""}</div></div></div>})}</Card>
            </>}
            {vw==="followups"&&<>
              <h1 style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:4}}>Follow-up Reminders</h1><p style={{fontSize:13,color:"#94A3B8",marginBottom:18}}>Don&apos;t leave money on the table.</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>{FOLLOW_UPS.map((f,i)=><Card key={i} style={{padding:16}}><div style={{marginBottom:10}}><div style={{fontWeight:600,fontSize:14,color:"#0F172A",marginBottom:3}}>{f.customer}</div><div style={{fontSize:12,color:"#64748B"}}>{f.lastJob}</div><div style={{fontSize:11,color:GD,fontWeight:500,marginTop:4}}>{f.months} months since last job</div></div><div style={{display:"flex",gap:8}}><BtnO style={{flex:1}}>Skip</BtnO><Btn style={{flex:1}}>Contacted</Btn></div></Card>)}</div>
            </>}
          </main>
        </div>
        <div className="sw-bn">{nv.map(n=><button key={n.id} className={`sw-bi ${vw===n.id?"sw-a":""}`} onClick={()=>setVw(n.id)}><span className="sw-ic">{n.ic}</span><span className="sw-lb">{n.lb}</span></button>)}</div>
      </div>
    );
  }
  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#132440",color:"#F5F0EB",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        .sw-f0{animation:fadeUp .8s ease forwards}
        .sw-f1{animation:fadeUp .8s ease .1s forwards;opacity:0}
        .sw-f2{animation:fadeUp .8s ease .2s forwards;opacity:0}
        .sw-f3{animation:fadeUp .8s ease .3s forwards;opacity:0}
        .sw-f4{animation:fadeUp .8s ease .4s forwards;opacity:0}
        @media(max-width:768px){.sw-price{font-size:56px !important}.sw-comp{grid-template-columns:1.5fr 1fr 1fr !important;padding:14px 16px !important;font-size:13px !important}}
        .feature-box{cursor:pointer;transition:all .3s;} 
        .feature-box:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(200,230,74,0.15);}
      `}</style>
      {authMode&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>{setAuthMode(null);setAuthError(null);setAuthSuccess(null)}}>
        <div style={{background:"#fff",borderRadius:16,padding:36,maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={(e:React.MouseEvent)=>e.stopPropagation()}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:40,height:40,background:"#4A82C4",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#fff",margin:"0 auto 12px"}}>SW</div>
            <h2 style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:4}}>
              {authMode==="login"?"Welcome back":authMode==="signup"?"Create your account":"Reset your password"}
            </h2>
            <p style={{fontSize:13,color:"#64748B"}}>
              {authMode==="login"?"Sign in to your StackedWork account":authMode==="signup"?"Start your 14-day free trial today":"Enter your email and we'll send a reset link"}
            </p>
          </div>
          {authSuccess ? (
            <div style={{background:"#D1FAE5",border:"1px solid #6EE7B7",borderRadius:10,padding:16,textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:24,marginBottom:8}}>✅</div>
              <p style={{fontSize:14,color:"#065F46",fontWeight:500}}>{authSuccess}</p>
            </div>
          ) : (
            <>
              {authMode==="signup"&&(
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Username</label>
                  <input value={authUsername} onChange={e=>setAuthUsername(e.target.value)} placeholder="yourname" style={{width:"100%",padding:"10px 14px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:14,fontFamily:"'DM Sans'",outline:"none",boxSizing:"border-box"}}/>
                </div>
              )}
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Email address</label>
                <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com" style={{width:"100%",padding:"10px 14px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:14,fontFamily:"'DM Sans'",outline:"none",boxSizing:"border-box"}}/>
              </div>
              {authMode!=="forgot"&&(
                <div style={{marginBottom:authMode==="login"?8:20}}>
                  <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Password</label>
                  <input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="••••••••" style={{width:"100%",padding:"10px 14px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:14,fontFamily:"'DM Sans'",outline:"none",boxSizing:"border-box"}}/>
                </div>
              )}
              {authMode==="login"&&(
                <div style={{textAlign:"right",marginBottom:20}}>
                  <span onClick={()=>{setAuthMode("forgot");setAuthError(null);}} style={{fontSize:12,color:"#4A82C4",cursor:"pointer",fontWeight:500}}>Forgot password?</span>
                </div>
              )}
              {authError&&<div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#991B1B"}}>{authError}</div>}
              <button onClick={handleAuth} disabled={authLoading} style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",border:"none",borderRadius:8,fontSize:15,fontWeight:700,cursor:authLoading?"not-allowed":"pointer",fontFamily:"'DM Sans'",opacity:authLoading?0.7:1}}>
                {authLoading?"Please wait...":(authMode==="login"?"Sign In":authMode==="signup"?"Create Account":"Send Reset Link")}
              </button>
            </>
          )}
          <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"#64748B"}}>
            {authMode==="login"&&<>Don&apos;t have an account? <span onClick={()=>{setAuthMode("signup");setAuthError(null);setAuthSuccess(null);}} style={{color:"#4A82C4",cursor:"pointer",fontWeight:600}}>Sign up</span></>}
            {authMode==="signup"&&<>Already have an account? <span onClick={()=>{setAuthMode("login");setAuthError(null);setAuthSuccess(null);}} style={{color:"#4A82C4",cursor:"pointer",fontWeight:600}}>Sign in</span></>}
            {authMode==="forgot"&&<><span onClick={()=>{setAuthMode("login");setAuthError(null);setAuthSuccess(null);}} style={{color:"#4A82C4",cursor:"pointer",fontWeight:600}}>Back to sign in</span></>}
          </div>
        </div>
      </div>}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:scrollY>50?"rgba(19,36,64,0.92)":"transparent",backdropFilter:scrollY>50?"blur(20px)":"none",transition:"all .3s",borderBottom:scrollY>50?"1px solid rgba(255,255,255,0.05)":"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,background:"#4A82C4",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#fff",fontFamily:"'DM Sans'",letterSpacing:"-0.03em"}}>SW</div><span style={{fontWeight:700,fontSize:17,letterSpacing:"-0.02em"}}>StackedWork</span></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span onClick={()=>setPage("app")} style={{color:G,fontSize:14,fontWeight:500,cursor:"pointer"}}>Demo</span>
          <button onClick={()=>{setAuthMode("login");setAuthError(null);setAuthSuccess(null);}} style={{background:"transparent",color:"#fff",border:"1px solid rgba(255,255,255,0.3)",padding:"8px 18px",fontSize:13,fontWeight:600,fontFamily:"'DM Sans'",borderRadius:6,cursor:"pointer"}}>Sign In</button>
          <button onClick={handleSubscribe} style={{background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",border:"none",padding:"10px 20px",fontSize:13,fontWeight:700,fontFamily:"'DM Sans'",borderRadius:6,cursor:"pointer"}}>Get Started</button>
        </div>
      </nav>
      <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"120px 24px 80px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80)",backgroundSize:"cover",backgroundPosition:"center",filter:"brightness(0.3)"}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(19,36,64,0.7) 0%,rgba(19,36,64,0.9) 70%,#132440 100%)"}} />
        <div className="sw-f0" style={{position:"relative",zIndex:1}}><div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(200,230,74,0.15)",border:"1px solid rgba(200,230,74,0.35)",borderRadius:100,padding:"8px 20px",fontSize:13,fontWeight:500,color:G,fontFamily:"'Space Mono'",marginBottom:32}}>Built for contractors</div></div>
        <h1 className="sw-f1" style={{position:"relative",zIndex:1,fontSize:"clamp(38px,6vw,72px)",fontWeight:700,lineHeight:1.05,letterSpacing:"-0.03em",maxWidth:800,marginBottom:24}}>Your CRM. <span style={{color:G}}>Your AI.</span><br/>One price.</h1>
        <p className="sw-f2" style={{position:"relative",zIndex:1,fontSize:18,lineHeight:1.7,color:"rgba(245,240,235,0.6)",maxWidth:560,marginBottom:16}}>Stop juggling spreadsheets and apps you never open. StackedWork runs your contracting business in one place — CRM, AI mockups, lead tracking, and revenue dashboards.</p>
        <div className="sw-f3" style={{position:"relative",zIndex:1,marginBottom:48}}>
          <div className="sw-price" style={{fontFamily:"'Space Mono'",fontSize:72,fontWeight:700,color:G,lineHeight:1,marginBottom:4}}>$49.99<span style={{fontSize:24,color:"rgba(245,240,235,0.4)"}}>/mo</span></div>
          <p style={{fontFamily:"'Space Mono'",fontSize:13,color:"rgba(245,240,235,0.4)",letterSpacing:"0.05em"}}>CRM + AI MOCKUPS + LEAD TRACKING. NO SETUP FEES.</p>
          <p style={{fontFamily:"'DM Sans'",fontSize:13,color:"rgba(245,240,235,0.35)",marginTop:10}}>Need a website? Ask us about our AI website building services.</p>
        </div>
        <div className="sw-f4" style={{position:"relative",zIndex:1,display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={handleSubscribe} style={{background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",border:"none",padding:"18px 40px",fontSize:17,fontWeight:700,fontFamily:"'DM Sans'",borderRadius:6,cursor:"pointer"}}>Start Free Trial</button>
          <button onClick={()=>setPage("app")} style={{background:"transparent",color:G,border:"2px solid rgba(200,230,74,0.25)",padding:"16px 38px",fontSize:17,fontWeight:600,fontFamily:"'DM Sans'",borderRadius:6,cursor:"pointer"}}>See Live Demo</button>
        </div>
      </section>
      <section style={{padding:"100px 24px",maxWidth:1100,margin:"0 auto",position:"relative"}}>
        <div style={{position:"absolute",top:0,right:0,width:"50%",height:"100%",backgroundImage:"url(/living.jpg)",backgroundSize:"cover",backgroundPosition:"center",opacity:0.1,maskImage:"linear-gradient(to left,rgba(0,0,0,0.5),transparent)",WebkitMaskImage:"linear-gradient(to left,rgba(0,0,0,0.5),transparent)"}} />
        <div style={{fontFamily:"'Space Mono'",fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",color:G,marginBottom:16}}>What you get</div>
        <h2 style={{fontSize:"clamp(30px,4vw,48px)",fontWeight:700,letterSpacing:"-0.02em",marginBottom:56,maxWidth:500}}>Everything a contractor needs. <span style={{color:"rgba(245,240,235,0.3)"}}>Nothing you don&apos;t.</span></h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
          {FEATURES.map((f,i)=>(
            <div key={i} className="feature-box" onMouseEnter={()=>setAf(i)} onClick={()=>{setPage("app"); setVw(f.link);}}
              style={{background:i===af?"rgba(200,230,74,0.08)":"rgba(255,255,255,0.03)",border:i===af?"1px solid rgba(200,230,74,0.25)":"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:32,transition:"all .4s",position:"relative"}}>
              <div style={{position:"absolute",top:12,right:12,fontSize:10,color:"rgba(200,230,74,0.5)",fontFamily:"'Space Mono'"}}>CLICK TO TRY →</div>
              <div style={{fontSize:30,marginBottom:14}}>{f.icon}</div>
              <h3 style={{fontSize:18,fontWeight:600,marginBottom:8}}>{f.title}</h3>
              <p style={{fontSize:14,lineHeight:1.7,color:"rgba(245,240,235,0.5)"}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <Divider/>
      <section style={{padding:"100px 24px",maxWidth:800,margin:"0 auto"}}>
        <div style={{fontFamily:"'Space Mono'",fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",color:G,marginBottom:16}}>The math</div>
        <h2 style={{fontSize:"clamp(30px,4vw,48px)",fontWeight:700,letterSpacing:"-0.02em",marginBottom:14}}>You are already overpaying.</h2>
        <p style={{fontSize:16,color:"rgba(245,240,235,0.5)",marginBottom:44,maxWidth:500}}>What contractors pay cobbling together tools vs. StackedWork.</p>
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
          <div className="sw-comp" style={{display:"grid",gridTemplateColumns:"2fr 1.2fr 1.2fr",padding:"18px 24px",background:"rgba(255,255,255,0.03)",fontFamily:"'Space Mono'",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(245,240,235,0.4)",fontWeight:700}}><div></div><div>Without Us</div><div style={{color:G}}>StackedWork</div></div>
          {COMPARISONS.map((c,i)=><div key={i} className="sw-comp" style={{display:"grid",gridTemplateColumns:"2fr 1.2fr 1.2fr",padding:"18px 24px",borderBottom:i<COMPARISONS.length-1?"1px solid rgba(255,255,255,0.06)":"none",...(i===COMPARISONS.length-1?{background:"rgba(200,230,74,0.08)",fontSize:17,fontWeight:700}:{})}}><div style={{fontWeight:i===COMPARISONS.length-1?700:400}}>{c.item}</div><div style={{color:"rgba(245,240,235,0.4)",textDecoration:i<COMPARISONS.length-1?"line-through":"none"}}>{c.them}</div><div style={{color:G,fontWeight:600}}>{c.us}</div></div>)}
        </div>
      </section>
      <Divider/>
      <section style={{padding:"80px 24px",maxWidth:1100,margin:"0 auto",position:"relative"}}>
        <div style={{fontFamily:"'Space Mono'",fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",color:G,marginBottom:16}}>From the field</div>
        <h2 style={{fontSize:"clamp(30px,4vw,48px)",fontWeight:700,letterSpacing:"-0.02em",marginBottom:40}}>Built for the trades.</h2>
        <div style={{borderRadius:16,overflow:"hidden",maxHeight:500,position:"relative"}}>
          <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80" alt="Contractor on the job" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}} />
          <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 50%,rgba(19,36,64,0.85) 100%)"}}/>
          <div style={{position:"absolute",bottom:32,left:32,right:32}}>
            <p style={{fontSize:"clamp(16px,2.5vw,22px)",fontWeight:600,color:"#fff",lineHeight:1.5,maxWidth:600,textShadow:"0 2px 8px rgba(0,0,0,0.5)"}}>The tools built for how you actually work — from the truck, on the job, closing deals on the spot.</p>
          </div>
        </div>
      </section>
      <Divider/>
      <section style={{padding:"100px 24px",maxWidth:800,margin:"0 auto",textAlign:"center"}}>
        <div style={{fontFamily:"'Space Mono'",fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",color:G,marginBottom:16}}>How it works</div>
        <h2 style={{fontSize:"clamp(30px,4vw,48px)",fontWeight:700,letterSpacing:"-0.02em",marginBottom:56}}>Live in <span style={{color:G}}>48 hours.</span></h2>
        <div style={{display:"flex",flexDirection:"column",gap:40,textAlign:"left"}}>
          {[{s:"01",t:"Sign up in 5 minutes",d:"Create your username and password, add your trade and service area. That's it."},{s:"02",t:"Your CRM is ready",d:"AI sets up your dashboard, job tracking, and lead management instantly."},{s:"03",t:"Start closing jobs",d:"CRM. AI mockups. Revenue tracking. Follow-up reminders. All live."}].map((x,i)=>(
            <div key={i} style={{display:"flex",gap:20,alignItems:"flex-start"}}>
              <div style={{fontFamily:"'Space Mono'",fontSize:14,color:G,fontWeight:700,minWidth:36,paddingTop:3}}>{x.s}</div>
              <div><h3 style={{fontSize:20,fontWeight:600,marginBottom:6}}>{x.t}</h3><p style={{fontSize:15,lineHeight:1.7,color:"rgba(245,240,235,0.5)"}}>{x.d}</p></div>
            </div>
          ))}
        </div>
      </section>
      <Divider/>
      <section style={{padding:"100px 24px 140px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80)",backgroundSize:"cover",backgroundPosition:"center top",filter:"brightness(0.2)"}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#132440 0%,rgba(19,36,64,0.85) 50%,#132440 100%)"}} />
        <h2 style={{position:"relative",zIndex:1,fontSize:"clamp(34px,5vw,56px)",fontWeight:700,letterSpacing:"-0.03em",maxWidth:600,margin:"0 auto 16px"}}>Ready to stop hustling backwards?</h2>
        <p style={{position:"relative",zIndex:1,fontSize:17,color:"rgba(245,240,235,0.5)",maxWidth:480,margin:"0 auto 44px"}}>$49.99/month. CRM + AI mockups + lead tracking. Cancel anytime. No contracts. No setup fees.</p>
        <button onClick={handleSubscribe} style={{position:"relative",zIndex:1,background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",border:"none",padding:"20px 48px",fontSize:18,fontWeight:700,fontFamily:"'DM Sans'",borderRadius:6,cursor:"pointer"}}>Start Your Free Trial</button>
        <p style={{position:"relative",zIndex:1,marginTop:22,fontSize:12,color:"rgba(245,240,235,0.3)",fontFamily:"'Space Mono'"}}>14-DAY FREE TRIAL — CREDIT CARD REQUIRED</p>
      </section>
      <footer style={{padding:"40px 24px",borderTop:"1px solid rgba(255,255,255,0.05)",maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:20,marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:26,height:26,background:"#4A82C4",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:9,color:"#fff",fontFamily:"'DM Sans'",letterSpacing:"-0.03em"}}>SW</div>
            <span style={{fontSize:13,color:"rgba(245,240,235,0.3)"}}>StackedWork — A <span style={{color:"rgba(245,240,235,0.5)"}}>REM Ventures</span> product</span>
          </div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"center"}}>
            <a href="mailto:Rmetzgar@REMVentures.Tech" style={{color:"rgba(245,240,235,0.6)",fontSize:12,cursor:"pointer",textDecoration:"none"}}>Contact: Rmetzgar@REMVentures.Tech</a>
            {["Privacy","Terms"].map(l=><span key={l} style={{color:"rgba(245,240,235,0.6)",fontSize:12,cursor:"pointer"}}>{l}</span>)}
          </div>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:20}}>
          <p style={{fontSize:11,color:"rgba(245,240,235,0.25)",lineHeight:1.7,maxWidth:800}}>
            <strong style={{color:"rgba(245,240,235,0.35)"}}>Privacy Policy:</strong> StackedWork, a REM Ventures product, collects information you provide when signing up and using our services, including name, email, business details, and usage data. We use this information solely to provide and improve our services. We do not sell your personal information to third parties. Your data is secured using industry-standard encryption. By using StackedWork, you agree to this policy. For questions, contact Rmetzgar@REMVentures.Tech. StackedWork uses Stripe for payment processing — your payment information is handled securely by Stripe and never stored on our servers.
          </p>
        </div>
      </footer>
    </div>
  );
}
