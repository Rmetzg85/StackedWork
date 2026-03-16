"use client";
import { useState, useEffect, useRef } from "react";

const G = "#C8E64A";
const GD = "#A8C435";
const DARK = "#132440";

const MODES = {
  meatloaf: {
    emoji: "🍖",
    label: "Meatloaf Mode",
    hero: "You're 30. Mom's making meatloaf downstairs.",
    sub: "You didn't plan to end up here. Rent got too high, the credit score was too low, and the basement was \"temporary\" — three years ago. 44% of adults 25–34 live at home or can't afford to rent alone. You're not failing. You're just missing the roadmap.",
    callout: "The meatloaf hits different when you know you should have your own place by now.",
    pains: [
      { icon: "🏠", stat: "44%", label: "of adults 25–34 live at home or can't afford to rent alone" },
      { icon: "📈", stat: "30%", label: "rent increase since 2020 — your paycheck didn't follow" },
      { icon: "😓", stat: "71%", label: "of Millennials & Gen Z feel behind on homeownership" },
    ],
    cta: "Get Out of the Basement",
    accent: "#E8A87C",
  },
  mimosa: {
    emoji: "🥂",
    label: "Mimosa Mode",
    hero: "Hungover in your childhood bedroom. Dad's already awake.",
    sub: "Brunch was great. Four mimosas, his credit card, a little too much fun. Now you're 24, staring at a statement on your dresser, and the disappointment coming from downstairs is louder than your headache. One in three young adults is right there with you.",
    callout: "The mimosa was $18. Living rent-free at 24 costs more than you think.",
    pains: [
      { icon: "💳", stat: "1 in 3", label: "adults under 35 moved back home between 2020–2024" },
      { icon: "🎓", stat: "$28K", label: "average student loan debt for adults under 30" },
      { icon: "📉", stat: "26%", label: "of adults under 35 own a home — down from 40% a generation ago" },
    ],
    cta: "Start the Glow-Up",
    accent: "#F5C6D0",
  },
} as const;

type ModeKey = keyof typeof MODES;

const WHY_NOW = [
  { icon: "🤖", t: "AI is reshaping the job market", d: "Automation is eliminating middle-income jobs faster than any generation has seen. The people who own assets — real estate, equity — will build wealth. The people who rent will pay someone else's mortgage. The window to get in is right now." },
  { icon: "🎓", t: "Higher ed isn't the guarantee it was", d: "A diploma doesn't buy a house anymore. But a 720 credit score, 3.5% down FHA loan, and a first-gen homeowner program? That still works. Always has. We show you exactly how to get there." },
  { icon: "🎮", t: "Your credit score is a game — play it", d: "We gamify the roadmap. Daily streaks, milestone unlocks, score projections. Watching your credit climb from 580 to 720 hits like leveling up. Because it is leveling up — just with real-world consequences." },
  { icon: "🗝️", t: "Homeownership by 22 is real", d: "House hacking. FHA loans at 3.5% down. First-gen buyer programs. USDA zero-down rural loans. We map every available path to keys in your hand — whether you're 22 or 32, starting now beats starting later." },
];

const STEPS = [
  { n: "1", t: "Build Credit", d: "Connect your accounts and start building your credit profile today. Gamified milestones, real progress. No judgment on where you start — only on where you're going." },
  { n: "2", t: "Level Up", d: "Hit score milestones and unlock better rates, higher limits, and real financial tools. Every point is XP toward your own front door. We show you exactly what moves the needle." },
  { n: "3", t: "Buy a House", d: "We map your exact path to a mortgage you can actually afford — AI-powered, personalized to your income and credit. Keys in hand. Done paying someone else's mortgage." },
];

const STATS_BAR = [
  { n: "44M+", l: "Americans renting" },
  { n: "1 in 3", l: "young adults live at home" },
  { n: "$412K", l: "median home price (2024)" },
  { n: "26%", l: "of under-35s own a home" },
];

const JOBS = [
  { id:1, customer:"John Smith", phone:"(410) 555-0122", type:"Plumbing", value:450, status:"quoted", date:"2026-02-20", completed:null },
  { id:2, customer:"Sarah Johnson", phone:"(410) 555-0188", type:"Drywall", value:1200, status:"scheduled", date:"2026-02-25", completed:null },
  { id:3, customer:"Mike Davis", phone:"(443) 555-0301", type:"Electrical", value:650, status:"in-progress", date:"2026-02-18", completed:null },
  { id:4, customer:"Lisa Brown", phone:"(410) 555-0445", type:"General", value:300, status:"complete", date:"2026-02-10", completed:"2026-02-14" },
  { id:5, customer:"Tom Wilson", phone:"(443) 555-0567", type:"Plumbing", value:890, status:"complete", date:"2026-02-08", completed:"2026-02-12" },
  { id:6, customer:"Emma Davis", phone:"(410) 555-0678", type:"Painting", value:1250, status:"complete", date:"2026-02-05", completed:"2026-02-09" },
  { id:7, customer:"Robert Garcia", phone:"(443) 555-0789", type:"HVAC", value:2100, status:"complete", date:"2026-01-28", completed:"2026-02-02" },
  { id:8, customer:"Angela White", phone:"(410) 555-0890", type:"Roofing", value:3500, status:"complete", date:"2026-01-20", completed:"2026-01-26" },
];

const LEADS = [
  { id:1, name:"Chris Mitchell", phone:"(410) 555-2211", email:"chris.m@gmail.com", msg:"Need a quote for bathroom remodel - 2 bath, gut job. Available weekends.", time:"2 hours ago", ts:"2h", urgent:false },
  { id:2, name:"Tanya Washington", phone:"(443) 555-3344", email:"tanya.w@yahoo.com", msg:"Do you do commercial HVAC? We have a 3-unit strip mall that needs service.", time:"1 day ago", ts:"1d", urgent:false },
  { id:3, name:"Derek Johnson", phone:"(410) 555-9087", email:"djohnson88@gmail.com", msg:"Emergency pipe burst in basement - need help ASAP. Water everywhere.", time:"3 days ago", ts:"3d", urgent:true },
  { id:4, name:"Maria Santos", phone:"(443) 555-6712", email:"maria.santos@outlook.com", msg:"Looking for someone to finish my deck before summer. About 400 sq ft.", time:"5 days ago", ts:"5d", urgent:false },
];

const FOLLOW_UPS = [
  { customer:"Diana Ross", lastJob:"Kitchen remodel - $4,200", months:4 },
  { customer:"James Carter", lastJob:"Bathroom plumbing - $1,100", months:5 },
  { customer:"Patricia Neal", lastJob:"Deck repair - $2,800", months:6 },
];

const STC: Record<string, {bg:string;text:string;label:string}> = {
  quoted:{ bg:"#FEF3C7", text:"#92400E", label:"Quoted" },
  scheduled:{ bg:"#DBEAFE", text:"#1E40AF", label:"Scheduled" },
  "in-progress":{ bg:"#E0E7FF", text:"#3730A3", label:"In Progress" },
  complete:{ bg:"#D1FAE5", text:"#065F46", label:"Complete" },
};

const Badge = ({ s }: {s:string}) => <span style={{ display:"inline-block", padding:"4px 10px", borderRadius:100, fontSize:11, fontWeight:600, background:STC[s].bg, color:STC[s].text }}>{STC[s].label}</span>;
const Btn = ({ children, onClick, style }: any) => <button onClick={onClick} style={{ padding:"8px 18px", background:G, color:"#132440", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans'", ...style }}>{children}</button>;
const BtnO = ({ children, onClick, style }: any) => <button onClick={onClick} style={{ padding:"8px 18px", background:"#fff", color:"#64748B", border:"1px solid #E2E8F0", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'DM Sans'", ...style }}>{children}</button>;
const Card = ({ children, style }: any) => <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, ...style }}>{children}</div>;
const Divider = () => <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(200,230,74,0.25),transparent)", margin:"0 auto", maxWidth:600 }} />;

export default function StackedWork() {
  const [page, setPage] = useState("landing");
  const [mode, setMode] = useState<ModeKey>("meatloaf");
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
  const fileRef = useRef<HTMLInputElement>(null);

  const handleMockupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMPh(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => { const h = () => setScrollY(window.scrollY); window.addEventListener("scroll",h); return () => window.removeEventListener("scroll",h); }, []);
  useEffect(() => { const i = setInterval(() => setAf(p=>(p+1)%WHY_NOW.length),4000); return () => clearInterval(i); }, []);
  useEffect(() => { if(page==="app"&&vw==="dashboard"&&!td){ const t=setTimeout(()=>setTst({name:"Chris Mitchell",msg:"Need a quote for bathroom remodel"}),3000); return()=>clearTimeout(t); }}, [page,vw,td]);

  const done = JOBS.filter(j=>j.status==="complete");
  const moR = done.filter(j=>{const d=new Date(j.completed!);return d.getMonth()===1&&d.getFullYear()===2026}).reduce((a,j)=>a+j.value,0);
  const wkR = done.filter(j=>new Date(j.completed!)>=new Date("2026-02-20")).reduce((a,j)=>a+j.value,0);
  const ytd = done.reduce((a,j)=>a+j.value,0);
  const gl = 12000;
  const fJ = jf==="all"?JOBS:JOBS.filter(j=>j.status===jf);

  const handleSubscribe = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "", name: "" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
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
                <Btn onClick={()=>{setMs("upload");setMDn(false);setMSt(null);setMGn(false);setMPh(null)}}>+ New Mockup</Btn>
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
                <div style={{marginBottom:20}}><div style={{fontWeight:600,fontSize:13,color:"#0F172A",marginBottom:10}}>Job type</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{["🚿 Bath","🍳 Kitchen","🎨 Paint","🏡 Exterior","🪵 Deck","🔧 Other"].map((t,i)=><div key={i} style={{padding:"10px 6px",textAlign:"center",border:"1px solid #E2E8F0",borderRadius:8,fontSize:12,fontWeight:500,color:"#475569",background:"#fff"}}>{t}</div>)}</div></div>
                <div style={{marginBottom:20}}><div style={{fontWeight:600,fontSize:13,color:"#0F172A",marginBottom:10}}>Style</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[{n:"Modern Minimalist",d:"Clean lines, neutral"},{n:"Classic Traditional",d:"Warm wood, timeless"},{n:"Industrial",d:"Exposed, dark metals"},{n:"Farmhouse",d:"Shiplap, rustic"}].map((x,i)=><div key={i} onClick={()=>setMSt(x.n)} style={{padding:12,border:mSt===x.n?`2px solid ${G}`:"1px solid #E2E8F0",borderRadius:10,cursor:"pointer",background:mSt===x.n?"rgba(200,230,74,0.08)":"#fff"}}><div style={{fontWeight:600,fontSize:12,color:"#0F172A",marginBottom:2}}>{x.n}</div><div style={{fontSize:11,color:"#94A3B8"}}>{x.d}</div></div>)}</div></div>
                <Btn onClick={()=>{setMGn(true);setTimeout(()=>{setMGn(false);setMDn(true)},3500)}} style={{width:"100%",padding:14,fontSize:15}}>Generate Mockup</Btn>
              </Card>}
              {mGn&&<Card style={{padding:48,textAlign:"center"}}><div style={{fontSize:44,marginBottom:14,animation:"pulseMk 1.5s infinite"}}>🎨</div><div style={{fontWeight:700,fontSize:18,color:"#0F172A",marginBottom:6}}>Generating mockup...</div><div style={{fontSize:13,color:"#94A3B8",marginBottom:20}}>AI is rendering a realistic preview</div><div style={{width:"100%",maxWidth:280,margin:"0 auto",height:6,background:"#E2E8F0",borderRadius:100,overflow:"hidden"}}><div style={{height:"100%",background:`linear-gradient(90deg,${G},${GD})`,borderRadius:100,animation:"barLoad 3s ease forwards"}}/></div></Card>}
              {mDn&&<Card style={{overflow:"hidden"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:200}}><div style={{background:"linear-gradient(135deg,#94A3B8,#CBD5E1)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:mPh?0:20,borderRight:"2px solid #fff",position:"relative",overflow:"hidden"}}>{mPh?<><img src={mPh} alt="Before" style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0,filter:"brightness(0.85)"}}/><div style={{position:"relative",zIndex:2,fontWeight:700,fontSize:13,color:"#fff",textShadow:"0 1px 6px rgba(0,0,0,0.5)",background:"rgba(0,0,0,0.4)",padding:"4px 14px",borderRadius:100}}>BEFORE</div></>:<><div style={{fontSize:36,marginBottom:6}}>🏚️</div><div style={{fontWeight:700,fontSize:13,color:"#fff",textShadow:"0 1px 3px rgba(0,0,0,0.3)"}}>BEFORE</div></>}</div><div style={{background:`linear-gradient(135deg,${GD},${G})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:mPh?0:20,position:"relative",overflow:"hidden"}}>{mPh?<><img src={mPh} alt="After" style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0,filter:"brightness(1.15) contrast(1.1) saturate(1.3) hue-rotate(15deg)"}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(200,230,74,0.25),rgba(168,196,53,0.15))",mixBlendMode:"overlay"}}/><div style={{position:"relative",zIndex:2,fontWeight:700,fontSize:13,color:"#132440",background:`${G}dd`,padding:"4px 14px",borderRadius:100}}>AFTER ✨</div></>:<><div style={{fontSize:36,marginBottom:6}}>✨</div><div style={{fontWeight:700,fontSize:13,color:"#132440"}}>AFTER</div></>}</div></div><div style={{padding:18}}><div style={{fontWeight:600,fontSize:14,color:"#0F172A",marginBottom:3}}>Mockup - {mSt||"Modern Minimalist"}</div><div style={{fontSize:12,color:"#94A3B8",marginBottom:14}}>Generated just now</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Btn style={{fontSize:12}}>Send to Customer</Btn><BtnO style={{fontSize:12}}>Save to Job</BtnO><BtnO onClick={()=>{setMs("gallery");setMDn(false);setMPh(null)}} style={{fontSize:12}}>Gallery</BtnO></div></div></Card>}
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

  const M = MODES[mode];

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:DARK,color:"#F5F0EB",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modeSwitch{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .sw-f0{animation:fadeUp .8s ease forwards}
        .sw-f1{animation:fadeUp .8s ease .1s forwards;opacity:0}
        .sw-f2{animation:fadeUp .8s ease .2s forwards;opacity:0}
        .sw-f3{animation:fadeUp .8s ease .3s forwards;opacity:0}
        .sw-f4{animation:fadeUp .8s ease .4s forwards;opacity:0}
        .mode-content{animation:modeSwitch .35s ease forwards}
        .mode-pill{display:flex;align-items:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:100px;padding:5px;gap:4px}
        .mode-btn{padding:9px 22px;border-radius:100px;border:none;font-family:'DM Sans';font-size:14px;font-weight:600;cursor:pointer;transition:all .25s}
        .mode-btn-active{background:${G};color:#132440}
        .mode-btn-inactive{background:transparent;color:rgba(245,240,235,0.5)}
        .mode-btn-inactive:hover{color:rgba(245,240,235,0.85)}
        .stats-bar{display:grid;grid-template-columns:repeat(4,1fr)}
        @media(max-width:640px){.stats-bar{grid-template-columns:repeat(2,1fr)}}
        .why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
      `}</style>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:scrollY>50?"rgba(19,36,64,0.95)":"transparent",backdropFilter:scrollY>50?"blur(20px)":"none",transition:"all .3s",borderBottom:scrollY>50?"1px solid rgba(255,255,255,0.05)":"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,background:"#4A82C4",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#fff",letterSpacing:"-0.03em"}}>SW</div>
          <span style={{fontWeight:700,fontSize:17,letterSpacing:"-0.02em"}}>StackedWork</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span onClick={()=>setPage("app")} style={{color:G,fontSize:13,fontWeight:500,cursor:"pointer"}}>Demo</span>
          <button onClick={handleSubscribe} style={{background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",border:"none",padding:"10px 20px",fontSize:13,fontWeight:700,fontFamily:"'DM Sans'",borderRadius:6,cursor:"pointer"}}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"130px 24px 80px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 60%,rgba(200,230,74,0.06) 0%,transparent 70%)`}}/>

        {/* Mode toggle */}
        <div className="sw-f0" style={{position:"relative",zIndex:1,marginBottom:40}}>
          <div className="mode-pill">
            {(Object.keys(MODES) as ModeKey[]).map(k=>(
              <button key={k} className={`mode-btn ${mode===k?"mode-btn-active":"mode-btn-inactive"}`} onClick={()=>setMode(k)}>
                {MODES[k].emoji} {MODES[k].label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero copy — switches with mode */}
        <div key={mode} className="mode-content" style={{position:"relative",zIndex:1,maxWidth:780}}>
          <h1 style={{fontSize:"clamp(36px,6vw,70px)",fontWeight:700,lineHeight:1.05,letterSpacing:"-0.03em",marginBottom:24}}>
            {M.hero.split(".")[0]}.<br/><span style={{color:G}}>{M.hero.split(".").slice(1).join(".").trim()}</span>
          </h1>
          <p style={{fontSize:18,lineHeight:1.75,color:"rgba(245,240,235,0.6)",maxWidth:600,margin:"0 auto 16px"}}>{M.sub}</p>
          <p style={{fontSize:14,fontStyle:"italic",color:M.accent,marginBottom:44,fontFamily:"'Space Mono'"}}>&ldquo;{M.callout}&rdquo;</p>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center"}}>
            <button onClick={handleSubscribe} style={{background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",border:"none",padding:"18px 40px",fontSize:17,fontWeight:700,fontFamily:"'DM Sans'",borderRadius:6,cursor:"pointer"}}>{M.cta}</button>
            <button onClick={()=>setPage("app")} style={{background:"transparent",color:G,border:"2px solid rgba(200,230,74,0.25)",padding:"16px 38px",fontSize:17,fontWeight:600,fontFamily:"'DM Sans'",borderRadius:6,cursor:"pointer"}}>See How It Works</button>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{background:"rgba(255,255,255,0.03)",borderTop:"1px solid rgba(255,255,255,0.06)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div className="stats-bar" style={{maxWidth:900,margin:"0 auto"}}>
          {STATS_BAR.map((s,i)=>(
            <div key={i} style={{padding:"32px 24px",textAlign:"center",borderRight:i<3?"1px solid rgba(255,255,255,0.06)":"none"}}>
              <div style={{fontFamily:"'Space Mono'",fontSize:"clamp(22px,3vw,36px)",fontWeight:700,color:G,marginBottom:6}}>{s.n}</div>
              <div style={{fontSize:12,color:"rgba(245,240,235,0.45)",lineHeight:1.5}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PAIN POINTS — mode specific */}
      <section style={{padding:"90px 24px",maxWidth:1000,margin:"0 auto"}}>
        <div key={`pain-${mode}`} className="mode-content">
          <div style={{fontFamily:"'Space Mono'",fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",color:M.accent,marginBottom:16}}>The reality</div>
          <h2 style={{fontSize:"clamp(28px,4vw,46px)",fontWeight:700,letterSpacing:"-0.02em",marginBottom:56,maxWidth:560}}>
            {mode==="meatloaf" ? <>None of us planned to still be here.<br/><span style={{color:"rgba(245,240,235,0.3)"}}>But 44% of us are.</span></> : <>You&apos;re not broke. You&apos;re just<br/><span style={{color:"rgba(245,240,235,0.3)"}}>missing the roadmap.</span></>}
          </h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20}}>
            {M.pains.map((p,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:32}}>
                <div style={{fontSize:28,marginBottom:12}}>{p.icon}</div>
                <div style={{fontFamily:"'Space Mono'",fontSize:"clamp(28px,3vw,42px)",fontWeight:700,color:M.accent,marginBottom:8}}>{p.stat}</div>
                <p style={{fontSize:14,lineHeight:1.65,color:"rgba(245,240,235,0.55)"}}>{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider/>

      {/* WHY NOW */}
      <section style={{padding:"90px 24px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{fontFamily:"'Space Mono'",fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",color:G,marginBottom:16}}>Why right now</div>
        <h2 style={{fontSize:"clamp(28px,4vw,46px)",fontWeight:700,letterSpacing:"-0.02em",marginBottom:56,maxWidth:560}}>
          The rules changed.<br/><span style={{color:"rgba(245,240,235,0.3)"}}>Most people don&apos;t know yet.</span>
        </h2>
        <div className="why-grid">
          {WHY_NOW.map((w,i)=>(
            <div key={i} onMouseEnter={()=>setAf(i)} style={{background:i===af?"rgba(200,230,74,0.07)":"rgba(255,255,255,0.03)",border:i===af?"1px solid rgba(200,230,74,0.22)":"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:32,transition:"all .4s",cursor:"default"}}>
              <div style={{fontSize:28,marginBottom:14}}>{w.icon}</div>
              <h3 style={{fontSize:17,fontWeight:600,marginBottom:8}}>{w.t}</h3>
              <p style={{fontSize:13,lineHeight:1.75,color:"rgba(245,240,235,0.5)"}}>{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider/>

      {/* HOW IT WORKS — 1. Build Credit, 2. Level Up, 3. Buy a House */}
      <section style={{padding:"90px 24px",maxWidth:800,margin:"0 auto",textAlign:"center"}}>
        <div style={{fontFamily:"'Space Mono'",fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",color:G,marginBottom:16}}>How it works</div>
        <h2 style={{fontSize:"clamp(28px,4vw,46px)",fontWeight:700,letterSpacing:"-0.02em",marginBottom:56}}>
          Three steps.<br/><span style={{color:G}}>One front door.</span>
        </h2>
        <div style={{display:"flex",flexDirection:"column",gap:0,textAlign:"left"}}>
          {STEPS.map((x,i)=>(
            <div key={i} style={{display:"flex",gap:24,alignItems:"flex-start",padding:"36px 0",borderBottom:i<STEPS.length-1?"1px solid rgba(255,255,255,0.06)":"none"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,flexShrink:0}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${G},${GD})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono'",fontSize:18,fontWeight:700,color:"#132440"}}>{x.n}</div>
              </div>
              <div style={{paddingTop:10}}>
                <h3 style={{fontSize:22,fontWeight:700,marginBottom:8,letterSpacing:"-0.01em"}}>{x.t}</h3>
                <p style={{fontSize:15,lineHeight:1.75,color:"rgba(245,240,235,0.55)"}}>{x.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider/>

      {/* FINAL CTA */}
      <section style={{padding:"100px 24px 140px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 100%,rgba(200,230,74,0.08) 0%,transparent 60%)`}}/>
        <div key={`cta-${mode}`} className="mode-content" style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:48,marginBottom:20}}>{M.emoji}</div>
          <h2 style={{fontSize:"clamp(32px,5vw,54px)",fontWeight:700,letterSpacing:"-0.03em",maxWidth:620,margin:"0 auto 16px",lineHeight:1.1}}>
            {mode==="meatloaf" ? "Stop eating meatloaf in the basement." : "Last brunch on his credit card."}
          </h2>
          <p style={{fontSize:17,color:"rgba(245,240,235,0.5)",maxWidth:480,margin:"0 auto 44px",lineHeight:1.7}}>
            Build your credit. Level up your score. Buy your house.<br/>The roadmap is right here.
          </p>
          <button onClick={handleSubscribe} style={{background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",border:"none",padding:"20px 52px",fontSize:18,fontWeight:700,fontFamily:"'DM Sans'",borderRadius:6,cursor:"pointer"}}>{M.cta}</button>
          <p style={{marginTop:20,fontSize:12,color:"rgba(245,240,235,0.25)",fontFamily:"'Space Mono'"}}>FREE TO START — NO CREDIT CARD REQUIRED</p>
        </div>
      </section>

      <footer style={{padding:"40px 24px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:26,background:"#4A82C4",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:9,color:"#fff",letterSpacing:"-0.03em"}}>SW</div>
          <span style={{fontSize:13,color:"rgba(245,240,235,0.3)"}}>StackedWork — A <span style={{color:"rgba(245,240,235,0.5)"}}>REM Ventures</span> product</span>
        </div>
        <div style={{display:"flex",gap:20}}>{["Privacy","Terms","Contact"].map(l=><span key={l} style={{color:"rgba(245,240,235,0.5)",fontSize:12,cursor:"pointer"}}>{l}</span>)}</div>
      </footer>
    </div>
  );
}
