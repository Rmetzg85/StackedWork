"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vyqbhpuqduaugxmhbtbk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWJocHVxZHVhdWd4bWhidGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDQ0MzUsImV4cCI6MjA4ODc4MDQzNX0.wW4uaZJwIvl6TGZYkVZo9EuG2Ek713Y8F4jACuMxwSI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const G = "#C8E64A";
const GD = "#A8C435";
const FEATURES = [
  { icon: "🏗️", title: "AI-Powered CRM", desc: "Track every job, client, and dollar. Voice-to-job entry means you log work from the truck, not a desk.", link: "dashboard" },
  { icon: "🌐", title: "AI Website Service", desc: "Need a website built or updated? We offer AI-powered website services for contractors — inquire for pricing.", link: "https://REMVentures.Tech" },
  { icon: "📸", title: "Before & After Portfolio", desc: "Upload job photos, build your portfolio, and push before & after shots straight to Facebook, Instagram, and TikTok.", link: "photos" },
  { icon: "📊", title: "Revenue Dashboard", desc: "See what you've earned this week, this month, this year. Know which jobs are profitable and which aren't.", link: "dashboard" },
  { icon: "📲", title: "Lead Management", desc: "Track every lead, follow up on time, and never let a job slip through the cracks.", link: "leads" },
  { icon: "💬", title: "Text Us To Update Anything", desc: "Need your phone number changed on your site? New photo? Just text us. We handle it.", link: "sms:+14105306456" },
];
const COMPARISONS = [
  { item: "CRM software", them: "$50-100/mo", us: "Included" },
  { item: "Before & after portfolio + social sharing", them: "$20-40/mo", us: "Included" },
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
  const [ntf, setNtf] = useState(false);
  const [sms, setSms] = useState(false);
  const [spv, setSpv] = useState(false);
  const [tst, setTst] = useState<any>(null);
  const [td, setTd] = useState(false);
  const [userId, setUserId] = useState<string|null>(null);
  const [userEmail, setUserEmail] = useState<string|null>(null);
  const [subStatus, setSubStatus] = useState<string|null>(null);
  const [dbLeads, setDbLeads] = useState<any[]>([]);
  const [dbJobs, setDbJobs] = useState<any[]>([]);
  const [dbHomeownerLeads, setDbHomeownerLeads] = useState<any[]>([]);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [njCustomer, setNjCustomer] = useState("");
  const [njPhone, setNjPhone] = useState("");
  const [njType, setNjType] = useState("General");
  const [njValue, setNjValue] = useState("");
  const [njStatus, setNjStatus] = useState("quoted");
  const [njDate, setNjDate] = useState(new Date().toISOString().split("T")[0]);
  const [njNotes, setNjNotes] = useState("");
  const [njLoading, setNjLoading] = useState(false);
  const [njError, setNjError] = useState<string|null>(null);
  const [dbPhotos, setDbPhotos] = useState<any[]>([]);
  const [photoView, setPhotoView] = useState<"gallery"|"upload">("gallery");
  const [phBefore, setPhBefore] = useState<string|null>(null);
  const [phAfter, setPhAfter] = useState<string|null>(null);
  const [phBeforeFile, setPhBeforeFile] = useState<File|null>(null);
  const [phAfterFile, setPhAfterFile] = useState<File|null>(null);
  const [phCaption, setPhCaption] = useState("");
  const [phJobType, setPhJobType] = useState("other");
  const [phUploading, setPhUploading] = useState(false);
  const [phErr, setPhErr] = useState<string|null>(null);
  const [sharePhoto, setSharePhoto] = useState<any|null>(null);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const checkSub = async (email: string) => {
    const { data } = await supabase.from("subscriptions").select("status").eq("email", email).maybeSingle();
    setSubStatus(data?.status ?? "none");
  };

  const handlePhotoFile = (file: File, side: "before"|"after") => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (side === "before") { setPhBefore(ev.target?.result as string); setPhBeforeFile(file); }
      else { setPhAfter(ev.target?.result as string); setPhAfterFile(file); }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!userId || !phBeforeFile || !phAfterFile) return;
    setPhUploading(true); setPhErr(null);
    try {
      const ts = Date.now();
      const up = async (file: File, path: string) => {
        const bytes = await file.arrayBuffer();
        const { error } = await supabase.storage.from("stackedwork-images").upload(path, bytes, { contentType: file.type, upsert: true });
        if (error) throw error;
        return supabase.storage.from("stackedwork-images").getPublicUrl(path).data.publicUrl;
      };
      const beforeUrl = await up(phBeforeFile, `portfolio/${ts}-before.jpg`);
      const afterUrl = await up(phAfterFile, `portfolio/${ts}-after.jpg`);
      const { data, error } = await supabase.from("portfolio").insert({ contractor_id: userId, before_url: beforeUrl, after_url: afterUrl, job_type: phJobType, caption: phCaption }).select().single();
      if (error) throw error;
      if (data) setDbPhotos(prev => [data, ...prev]);
      setPhBefore(null); setPhAfter(null); setPhBeforeFile(null); setPhAfterFile(null); setPhCaption(""); setPhJobType("other");
      setPhotoView("gallery");
    } catch (err: any) { setPhErr(err.message || "Upload failed. Please try again."); }
    finally { setPhUploading(false); }
  };

  const shareToSocial = async (platform: string, photo: any) => {
    const url = photo.after_url || photo.before_url;
    const caption = photo.caption || "Check out this project!";
    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    } else {
      // Instagram & TikTok: use Web Share API on mobile, else download
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const file = new File([blob], "stackedwork-photo.jpg", { type: blob.type });
          await navigator.share({ files: [file], title: "StackedWork", text: caption });
        } catch { /* user cancelled or not supported */ }
      } else {
        const a = document.createElement("a");
        a.href = url; a.download = "stackedwork-photo.jpg"; a.click();
      }
    }
  };

  const deletePhoto = async (photo: any) => {
    if (!confirm("Delete this photo?")) return;
    await supabase.from("portfolio").delete().eq("id", photo.id);
    setDbPhotos(prev => prev.filter(p => p.id !== photo.id));
  };

  const withTimeout = <T,>(promise: Promise<T>, ms = 10000): Promise<T> =>
    Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timed out. Check your connection and try again.")), ms))]);

  const handleAuth = async () => {
    setAuthLoading(true); setAuthError(null); setAuthSuccess(null);
    try {
      if (authMode === "forgot") {
        const { error } = await withTimeout(supabase.auth.resetPasswordForEmail(authEmail, { redirectTo: window.location.origin + "/reset-password" }));
        if (error) throw error;
        setAuthSuccess("Password reset email sent! Check your inbox.");
      } else if (authMode === "signup") {
        window.location.href = "/login";
        return;
      } else {
        const { data: signInData, error } = await withTimeout(supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }));
        if (error) throw error;
        if (signInData?.user) { setUserId(signInData.user.id); setUserEmail(signInData.user.email ?? null); checkSub(signInData.user.email!).catch(() => {}); }
        setAuthMode(null); setPage("app");
      }
    } catch (err: any) { setAuthError(err.message || "Something went wrong. Please try again."); }
    finally { setAuthLoading(false); }
  };

  useEffect(() => { const h = () => setScrollY(window.scrollY); window.addEventListener("scroll",h); return () => window.removeEventListener("scroll",h); }, []);
  useEffect(() => { const i = setInterval(() => setAf(p=>(p+1)%FEATURES.length),4000); return () => clearInterval(i); }, []);
  useEffect(() => { /* demo toast removed */ }, [page,vw,td]);
  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on mount and catches redirects from /login
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setPage("app");
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
        checkSub(session.user.email!);
      }
    });
    return () => authSub.unsubscribe();
  }, []);
  const handleNewJob = async () => {
    if (!userId || !njCustomer.trim() || !njValue) return;
    setNjLoading(true); setNjError(null);
    const { data, error } = await supabase.from("jobs").insert({
      contractor_id: userId,
      customer: njCustomer.trim(),
      phone: njPhone.trim() || null,
      type: njType,
      value: parseFloat(njValue),
      status: njStatus,
      date: njDate,
      notes: njNotes.trim() || null,
    }).select().single();
    setNjLoading(false);
    if (error) { setNjError(error.message); return; }
    setDbJobs(prev => [data, ...prev]);
    setNewJobOpen(false);
    setNjCustomer(""); setNjPhone(""); setNjType("General"); setNjValue(""); setNjStatus("quoted"); setNjDate(new Date().toISOString().split("T")[0]); setNjNotes(""); setNjError(null);
  };

  const updateJobStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "complete") updates.completed = new Date().toISOString().split("T")[0];
    await supabase.from("jobs").update(updates).eq("id", id);
    setDbJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  useEffect(() => {
    if (!userId) return;
    supabase.from("leads").select("*").eq("contractor_id", userId).order("created_at", { ascending: false }).then(({ data }) => { if (data) setDbLeads(data); });
    supabase.from("jobs").select("*").eq("contractor_id", userId).order("date", { ascending: false }).then(({ data }) => { if (data) setDbJobs(data); });
    supabase.from("homeowner_leads").select("*").order("created_at", { ascending: false }).limit(50).then(({ data }) => { if (data) setDbHomeownerLeads(data); });
    supabase.from("portfolio").select("*").eq("contractor_id", userId).order("created_at", { ascending: false }).then(({ data }) => { if (data) setDbPhotos(data); });
    const ch = supabase.channel("leads_" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads", filter: `contractor_id=eq.${userId}` }, (payload) => {
        setDbLeads(prev => [payload.new as any, ...prev]);
        setTst({ name: (payload.new as any).name, msg: (payload.new as any).message || "New lead received" });
        setTd(false);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  const activeJobs = userId ? dbJobs : JOBS;
  const now = new Date();
  const done = activeJobs.filter((j:any)=>j.status==="complete");
  const moR = done.filter((j:any)=>{if(!j.completed)return false;const d=new Date(j.completed);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).reduce((a:number,j:any)=>a+Number(j.value),0);
  const wkAgo = new Date(now.getTime()-7*24*60*60*1000);
  const wkR = done.filter((j:any)=>j.completed&&new Date(j.completed)>=wkAgo).reduce((a:number,j:any)=>a+Number(j.value),0);
  const ytd = done.filter((j:any)=>j.completed&&new Date(j.completed).getFullYear()===now.getFullYear()).reduce((a:number,j:any)=>a+Number(j.value),0);
  const gl = 12000;
  const fJ = jf==="all"?activeJobs:activeJobs.filter((j:any)=>j.status===jf);
  const activeLeads = userId ? dbLeads : LEADS;
  const lMsg = (l: any) => l.msg || l.message || "";
  const lTs = (l: any) => l.ts || (l.created_at ? new Date(l.created_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) : "");
  const markRead = async (id: any) => {
    if (userId) await supabase.from("leads").update({ read: true }).eq("id", id);
    setDbLeads(prev => prev.map(l => l.id === id ? { ...l, read: true } : l));
  };

  const handleSubscribe = () => {
    window.location.href = "/login";
  };
  const BLOCKED = ["cancelled","incomplete_expired","unpaid","past_due"];
  if(page==="app" && subStatus && BLOCKED.includes(subStatus)){
    return(
      <div style={{fontFamily:"'DM Sans',sans-serif",background:"#132440",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center",color:"#F5F0EB"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');*{margin:0;padding:0;box-sizing:border-box}`}</style>
        <div style={{fontSize:48,marginBottom:24}}>🔒</div>
        <h1 style={{fontSize:28,fontWeight:700,marginBottom:12}}>Subscription {subStatus === "cancelled" ? "Cancelled" : "Inactive"}</h1>
        <p style={{fontSize:15,color:"rgba(245,240,235,0.5)",maxWidth:420,marginBottom:32,lineHeight:1.7}}>
          {subStatus === "past_due"
            ? "Your last payment failed. Please update your billing info to continue."
            : "Your StackedWork subscription is no longer active. Reactivate to get back in."}
        </p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={handleSubscribe} style={{background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",border:"none",padding:"14px 32px",fontSize:15,fontWeight:700,borderRadius:6,cursor:"pointer",fontFamily:"'DM Sans'"}}>Reactivate Subscription</button>
          <button onClick={async()=>{await supabase.auth.signOut();setPage("landing");setUserId(null);setUserEmail(null);setSubStatus(null);}} style={{background:"transparent",color:"rgba(245,240,235,0.5)",border:"1px solid rgba(255,255,255,0.15)",padding:"14px 32px",fontSize:15,fontWeight:600,borderRadius:6,cursor:"pointer",fontFamily:"'DM Sans'"}}>Sign Out</button>
        </div>
      </div>
    );
  }

  if(page==="app"){
    const nv=[{id:"dashboard",ic:"📊",lb:"Home"},{id:"jobs",ic:"🔨",lb:"Jobs"},{id:"leads",ic:"📥",lb:"Leads"},{id:"photos",ic:"📸",lb:"Photos"},{id:"customers",ic:"👥",lb:"Clients"},{id:"followups",ic:"🔔",lb:"Alerts"}];
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
            {!userId&&<span style={{background:"#FEF3C7",color:"#92400E",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:100,fontFamily:"'Space Mono'"}}>DEMO</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{position:"relative"}}>
              <button onClick={()=>setNtf(!ntf)} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 9px",cursor:"pointer",fontSize:16,lineHeight:1}}>🔔<span style={{position:"absolute",top:-4,right:-4,width:18,height:18,background:"#EF4444",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",border:"2px solid #0F1D32"}}>{activeLeads.filter((l:any)=>!l.read).length||activeLeads.length}</span></button>
              {ntf&&<div style={{position:"absolute",top:50,right:0,width:360,maxWidth:"calc(100vw - 32px)",background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,boxShadow:"0 12px 40px rgba(0,0,0,0.15)",zIndex:60,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:"2px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>New Leads</span><span style={{fontSize:12,color:GD,fontWeight:600,cursor:"pointer"}} onClick={()=>{setNtf(false);setVw("leads")}}>View All</span></div>
                {activeLeads.slice(0,3).map((l:any,i:number)=><div key={i} style={{padding:"14px 16px",borderBottom:i<2?"1px solid #F1F5F9":"none",cursor:"pointer"}} onClick={()=>{setNtf(false);setVw("leads")}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontWeight:600,fontSize:13,color:"#0F172A"}}>{l.name}</span><span style={{fontSize:11,color:"#94A3B8"}}>{lTs(l)}</span></div>
                  <div style={{fontSize:12,color:"#64748B"}}>{lMsg(l).slice(0,55)}{lMsg(l).length>55?"...":""}</div>
                  {l.urgent&&<span style={{display:"inline-block",marginTop:4,fontSize:10,fontWeight:700,color:"#EF4444",background:"#FEE2E2",padding:"2px 8px",borderRadius:100}}>URGENT</span>}
                </div>)}
              </div>}
            </div>
            <button onClick={()=>setSms(true)} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 9px",cursor:"pointer",fontSize:16,lineHeight:1}}>📱</button>
            {userId
              ? <button onClick={async()=>{await supabase.auth.signOut();setPage("landing");setUserId(null);setUserEmail(null);setSubStatus(null);}} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"#94A3B8",padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>Sign Out</button>
              : <button onClick={()=>setPage("landing")} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"#94A3B8",padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>Back</button>
            }
          </div>
        </div>
        {tst&&!td&&<div style={{position:"fixed",top:70,right:16,zIndex:60,background:"#fff",border:"1px solid #E2E8F0",borderLeft:`4px solid ${G}`,borderRadius:12,padding:16,boxShadow:"0 8px 30px rgba(0,0,0,0.12)",maxWidth:340,width:"calc(100% - 32px)",animation:"toastSlide .5s ease forwards"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:G}}/><span style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>New Lead!</span></div><button onClick={()=>{setTd(true);setTst(null)}} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:18,padding:0}}>x</button></div>
          <div style={{fontWeight:600,fontSize:13,color:"#0F172A",marginBottom:2}}>{tst.name}</div><div style={{fontSize:12,color:"#64748B",marginBottom:10}}>{tst.msg}</div>
          <div style={{display:"flex",gap:8}}><Btn onClick={()=>{setTd(true);setTst(null);setVw("leads")}} style={{flex:1,fontSize:11,padding:6}}>View Lead</Btn><BtnO onClick={()=>{setTd(true);setSms(true)}} style={{flex:1,fontSize:11,padding:6}}>SMS Alert</BtnO></div>
        </div>}
        {newJobOpen&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:70,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setNewJobOpen(false)}>
          <div style={{background:"#fff",borderRadius:16,padding:28,maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={(e:React.MouseEvent)=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h2 style={{fontSize:18,fontWeight:700,color:"#0F172A"}}>New Job</h2><button onClick={()=>setNewJobOpen(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94A3B8"}}>×</button></div>
            {[
              {label:"Customer Name *",val:njCustomer,set:setNjCustomer,placeholder:"John Smith",type:"text"},
              {label:"Phone",val:njPhone,set:setNjPhone,placeholder:"(410) 555-0100",type:"tel"},
            ].map((f,i)=><div key={i} style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{f.label}</label><input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder} style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:14,fontFamily:"'DM Sans'",outline:"none",boxSizing:"border-box"}}/></div>)}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Job Type</label><select value={njType} onChange={e=>setNjType(e.target.value)} style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:14,fontFamily:"'DM Sans'",outline:"none",background:"#fff"}}>{["General","Plumbing","Electrical","HVAC","Roofing","Drywall","Painting","Deck","Flooring","Other"].map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Status</label><select value={njStatus} onChange={e=>setNjStatus(e.target.value)} style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:14,fontFamily:"'DM Sans'",outline:"none",background:"#fff"}}><option value="quoted">Quoted</option><option value="scheduled">Scheduled</option><option value="in-progress">In Progress</option><option value="complete">Complete</option></select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Job Value ($) *</label><input type="number" min="0" step="0.01" value={njValue} onChange={e=>setNjValue(e.target.value)} placeholder="0.00" style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:14,fontFamily:"'DM Sans'",outline:"none",boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Date</label><input type="date" value={njDate} onChange={e=>setNjDate(e.target.value)} style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:14,fontFamily:"'DM Sans'",outline:"none",boxSizing:"border-box"}}/></div>
            </div>
            <div style={{marginBottom:20}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Notes</label><textarea value={njNotes} onChange={e=>setNjNotes(e.target.value)} placeholder="Job details..." rows={3} style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:14,fontFamily:"'DM Sans'",outline:"none",resize:"vertical",boxSizing:"border-box"}}/></div>
            {njError&&<div style={{marginBottom:14,padding:"10px 14px",background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,fontSize:13,color:"#991B1B"}}>{njError}</div>}
            <button onClick={handleNewJob} disabled={njLoading||!njCustomer.trim()||!njValue} style={{width:"100%",padding:13,background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",border:"none",borderRadius:8,fontSize:15,fontWeight:700,cursor:njLoading||!njCustomer.trim()||!njValue?"not-allowed":"pointer",opacity:njLoading||!njCustomer.trim()||!njValue?0.6:1,fontFamily:"'DM Sans'"}}>{njLoading?"Saving...":"Save Job"}</button>
          </div>
        </div>}
        {sms&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:70,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setSms(false)}>
          <div style={{background:"#1A1A1A",borderRadius:32,padding:12,maxWidth:320,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}} onClick={(e: React.MouseEvent)=>e.stopPropagation()}>
            <div style={{background:"#fff",borderRadius:24,overflow:"hidden"}}>
              <div style={{background:"#F2F2F7",padding:"12px 20px 8px",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:600}}>9:41 AM</span><span style={{fontSize:12}}>📶 🔋</span></div>
              <div style={{background:"#F2F2F7",padding:"8px 20px 12px",borderBottom:"1px solid #D1D1D6",textAlign:"center"}}><div style={{fontWeight:700,fontSize:16}}>StackedWork</div><div style={{fontSize:11,color:"#8E8E93"}}>Text Message</div></div>
              <div style={{padding:16,minHeight:280,display:"flex",flexDirection:"column",gap:12}}>
                <div style={{background:"#E9E9EB",borderRadius:18,padding:"10px 14px",maxWidth:"85%",fontSize:14,lineHeight:1.5}}><div style={{fontWeight:600,marginBottom:4}}>🔔 New Lead!</div><div>When a new lead comes in, you&apos;ll get a text like this with their name, number, and message.</div><div style={{marginTop:8,fontSize:12,color:"#666"}}>Reply CALL to auto-schedule</div></div>
                <div style={{background:"#34C759",color:"#fff",borderRadius:18,padding:"10px 14px",maxWidth:"85%",fontSize:14,marginLeft:"auto",textAlign:"right"}}>CALL</div>
                <div style={{background:"#E9E9EB",borderRadius:18,padding:"10px 14px",maxWidth:"85%",fontSize:14,lineHeight:1.5}}>Callback scheduled!</div>
              </div>
              <div style={{padding:12,background:"#F2F2F7",textAlign:"center",borderTop:"1px solid #D1D1D6"}}><span style={{fontSize:12,color:"#8E8E93"}}>Tap outside to close</span></div>
            </div>
          </div>
        </div>}
        {sharePhoto&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:80,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}} onClick={()=>setSharePhoto(null)}>
          <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:480,overflow:"hidden",marginBottom:8}} onClick={(e:React.MouseEvent)=>e.stopPropagation()}>
            <div style={{position:"relative",background:"#000"}}>
              {sharePhoto.after_url
                ? <img src={sharePhoto.after_url} alt="After" style={{width:"100%",maxHeight:260,objectFit:"cover",display:"block"}}/>
                : <div style={{height:180,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48}}>📸</div>}
              <div style={{position:"absolute",bottom:10,left:12,background:"rgba(0,0,0,0.55)",borderRadius:100,padding:"3px 12px",fontSize:11,fontWeight:700,color:"#fff"}}>
                {sharePhoto.job_type?.toUpperCase()||"PROJECT"}
              </div>
            </div>
            <div style={{padding:"18px 20px"}}>
              <div style={{fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:4}}>Share to Social Media</div>
              {sharePhoto.caption&&<div style={{fontSize:13,color:"#64748B",marginBottom:16}}>{sharePhoto.caption}</div>}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={()=>shareToSocial("facebook",sharePhoto)} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 16px",background:"#1877F2",color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                  Share on Facebook
                </button>
                <button onClick={()=>shareToSocial("instagram",sharePhoto)} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 16px",background:"linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  Share to Instagram
                </button>
                <button onClick={()=>shareToSocial("tiktok",sharePhoto)} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 16px",background:"#000",color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
                  Share to TikTok
                </button>
              </div>
              <div style={{fontSize:11,color:"#94A3B8",marginTop:12,textAlign:"center"}}>Instagram & TikTok: saves photo to your device to upload</div>
              <button onClick={()=>setSharePhoto(null)} style={{marginTop:14,width:"100%",padding:"11px",background:"#F1F5F9",border:"none",borderRadius:10,fontSize:14,fontWeight:600,color:"#64748B",cursor:"pointer",fontFamily:"'DM Sans'"}}>Cancel</button>
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
                {activeJobs.length===0?<div style={{padding:"28px 18px",textAlign:"center",color:"#94A3B8",fontSize:13}}>No jobs yet — <span style={{color:GD,cursor:"pointer",fontWeight:600}} onClick={()=>setVw("jobs")}>add your first job</span></div>:activeJobs.slice(0,4).map((j:any,i:number)=><div key={j.id||i} style={{padding:"12px 18px",borderBottom:i<3?"1px solid #F1F5F9":"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13,color:"#0F172A"}}>{j.customer}</div><div style={{fontSize:11,color:"#94A3B8"}}>{j.type} · {j.date}</div></div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontWeight:600,fontSize:13}}>${Number(j.value).toLocaleString()}</span><Badge s={j.status}/></div></div>)}
              </Card>
            </>}
            {vw==="jobs"&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:"#fff"}}>Jobs</h1><Btn onClick={()=>userId?setNewJobOpen(true):setAuthMode("login")}>+ New Job</Btn></div>
              <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{["all","quoted","scheduled","in-progress","complete"].map(f=><button key={f} className={`sw-fb ${jf===f?"sw-a":""}`} onClick={()=>setJf(f)}>{f==="all"?"All":STC[f]?.label||f}</button>)}</div>
              {fJ.length===0?<Card style={{padding:40,textAlign:"center"}}><div style={{fontSize:36,marginBottom:12}}>🔨</div><div style={{fontWeight:600,fontSize:16,color:"#0F172A",marginBottom:6}}>No jobs yet</div><div style={{fontSize:13,color:"#94A3B8",marginBottom:16}}>Add your first job to start tracking revenue.</div><Btn onClick={()=>userId?setNewJobOpen(true):setAuthMode("login")}>+ Add First Job</Btn></Card>
              :<Card style={{overflow:"hidden"}}>{fJ.map((j:any)=><div key={j.id} className="sw-jm"><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div><div style={{fontWeight:600,fontSize:14,color:"#0F172A"}}>{j.customer}</div><div style={{fontSize:11,color:"#94A3B8"}}>{j.type} · {j.date}{j.phone?` · ${j.phone}`:""}</div></div><div style={{fontWeight:700,fontSize:15,color:"#0F172A"}}>${Number(j.value).toLocaleString()}</div></div><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><Badge s={j.status}/>{userId&&j.status!=="complete"&&<select value={j.status} onChange={e=>updateJobStatus(j.id,e.target.value)} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"1px solid #E2E8F0",background:"#fff",color:"#475569",cursor:"pointer",fontFamily:"'DM Sans'"}}><option value="quoted">→ Quoted</option><option value="scheduled">→ Scheduled</option><option value="in-progress">→ In Progress</option><option value="complete">→ Complete</option></select>}</div></div>)}</Card>}
            </>}
            {vw==="photos"&&<>
              <input ref={beforeRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handlePhotoFile(f,"before");e.target.value="";}}/>
              <input ref={afterRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handlePhotoFile(f,"after");e.target.value="";}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
                <div><h1 style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:2}}>Before & After Photos</h1><p style={{fontSize:13,color:"#94A3B8"}}>Document your work. Share it anywhere.</p></div>
                {userId&&<Btn onClick={()=>{setPhotoView("upload");setPhBefore(null);setPhAfter(null);setPhBeforeFile(null);setPhAfterFile(null);setPhCaption("");setPhJobType("other");setPhErr(null);}}>+ Add Photos</Btn>}
              </div>
              {photoView==="upload"&&<Card style={{padding:24,marginBottom:20}}>
                <div style={{fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:16}}>Upload Before & After</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                  <div onClick={()=>beforeRef.current?.click()} style={{border:phBefore?`2px solid ${G}`:"2px dashed #D1D5DB",borderRadius:14,overflow:"hidden",background:phBefore?"#000":"#FAFBFC",cursor:"pointer",minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
                    {phBefore
                      ? <><img src={phBefore} alt="Before" style={{width:"100%",height:140,objectFit:"cover"}}/><div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:100,whiteSpace:"nowrap"}}>BEFORE</div></>
                      : <><div style={{fontSize:30,marginBottom:6}}>📷</div><div style={{fontSize:12,fontWeight:600,color:"#475569"}}>Before</div><div style={{fontSize:10,color:"#94A3B8"}}>tap to add</div></>}
                  </div>
                  <div onClick={()=>afterRef.current?.click()} style={{border:phAfter?`2px solid ${G}`:"2px dashed #D1D5DB",borderRadius:14,overflow:"hidden",background:phAfter?"#000":"#FAFBFC",cursor:"pointer",minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
                    {phAfter
                      ? <><img src={phAfter} alt="After" style={{width:"100%",height:140,objectFit:"cover"}}/><div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",background:`${G}dd`,color:"#132440",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:100,whiteSpace:"nowrap"}}>AFTER ✨</div></>
                      : <><div style={{fontSize:30,marginBottom:6}}>✨</div><div style={{fontSize:12,fontWeight:600,color:"#475569"}}>After</div><div style={{fontSize:10,color:"#94A3B8"}}>tap to add</div></>}
                  </div>
                </div>
                <div style={{marginBottom:14}}><div style={{fontWeight:600,fontSize:12,color:"#374151",marginBottom:8}}>Job Type</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>{[["🚿 Bath","bathroom"],["🍳 Kitchen","kitchen"],["🎨 Paint","paint"],["🏡 Exterior","exterior"],["🪵 Deck","deck"],["🔧 Other","other"]].map(([lb,k],i)=><div key={i} onClick={()=>setPhJobType(k)} style={{padding:"8px 4px",textAlign:"center",border:phJobType===k?`2px solid ${G}`:"1px solid #E2E8F0",borderRadius:8,fontSize:11,fontWeight:500,color:phJobType===k?"#132440":"#475569",background:phJobType===k?"rgba(200,230,74,0.1)":"#fff",cursor:"pointer"}}>{lb}</div>)}</div></div>
                <div style={{marginBottom:16}}><div style={{fontWeight:600,fontSize:12,color:"#374151",marginBottom:6}}>Caption (optional)</div><input value={phCaption} onChange={e=>setPhCaption(e.target.value)} placeholder="Bathroom gut remodel — Owings Mills, MD" style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:13,fontFamily:"'DM Sans'",outline:"none",boxSizing:"border-box"}}/></div>
                {phErr&&<div style={{marginBottom:12,padding:"10px 14px",background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,fontSize:12,color:"#991B1B"}}>{phErr}</div>}
                <div style={{display:"flex",gap:10}}>
                  <Btn onClick={handlePhotoUpload} style={{flex:1,padding:13,fontSize:14,opacity:(phBeforeFile&&phAfterFile&&!phUploading)?1:0.5,cursor:(phBeforeFile&&phAfterFile&&!phUploading)?"pointer":"not-allowed"}}>{phUploading?"Uploading...":"Save Photos"}</Btn>
                  <BtnO onClick={()=>setPhotoView("gallery")} style={{padding:13}}>Cancel</BtnO>
                </div>
              </Card>}
              {dbPhotos.length===0&&photoView==="gallery"
                ? <Card style={{padding:"48px 20px",textAlign:"center"}}><div style={{fontSize:44,marginBottom:14}}>📸</div><div style={{fontWeight:700,fontSize:16,color:"#0F172A",marginBottom:6}}>No photos yet</div><div style={{fontSize:13,color:"#94A3B8",marginBottom:20}}>Upload before & after photos to build your portfolio and share to social media.</div>{userId&&<Btn onClick={()=>setPhotoView("upload")}>+ Add First Photos</Btn>}</Card>
                : <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {dbPhotos.map((p,i)=>{
                      const d=p.created_at?new Date(p.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"";
                      const jtEmoji:any={"bathroom":"🚿","kitchen":"🍳","paint":"🎨","exterior":"🏡","deck":"🪵","other":"🔧"};
                      return<Card key={p.id||i} style={{overflow:"hidden"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
                          <div style={{position:"relative",background:"#000",minHeight:160}}>
                            {p.before_url?<img src={p.before_url} alt="Before" style={{width:"100%",height:160,objectFit:"cover",display:"block"}}/>:<div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,background:"#E2E8F0"}}>{jtEmoji[p.job_type]||"🔧"}</div>}
                            <div style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:100}}>BEFORE</div>
                          </div>
                          <div style={{position:"relative",background:"#000",minHeight:160}}>
                            {p.after_url?<img src={p.after_url} alt="After" style={{width:"100%",height:160,objectFit:"cover",display:"block"}}/>:<div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,background:"#F0FDF4"}}>{jtEmoji[p.job_type]||"🔧"}</div>}
                            <div style={{position:"absolute",top:8,left:8,background:`${G}ee`,color:"#132440",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:100}}>AFTER ✨</div>
                          </div>
                        </div>
                        <div style={{padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                          <div><div style={{fontWeight:600,fontSize:13,color:"#0F172A",textTransform:"capitalize"}}>{jtEmoji[p.job_type]||"🔧"} {p.job_type}{p.caption?` — ${p.caption}`:""}</div><div style={{fontSize:11,color:"#94A3B8"}}>{d}</div></div>
                          <div style={{display:"flex",gap:8}}>
                            <Btn onClick={()=>setSharePhoto(p)} style={{fontSize:12,padding:"7px 16px"}}>Share ↗</Btn>
                            <BtnO onClick={()=>deletePhoto(p)} style={{fontSize:12,padding:"7px 14px",color:"#EF4444",borderColor:"#FECACA"}}>Delete</BtnO>
                          </div>
                        </div>
                      </Card>;
                    })}
                  </div>}
            </>}
            {vw==="customers"&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:"#fff"}}>Customers</h1><Btn>+ Add</Btn></div>
              {activeJobs.length===0
                ? <Card style={{padding:"40px 20px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:12}}>👥</div><div style={{fontWeight:600,fontSize:16,color:"#0F172A",marginBottom:6}}>No clients yet</div><div style={{fontSize:13,color:"#94A3B8"}}>Clients will appear here once you add jobs.</div></Card>
                : <Card style={{overflow:"hidden"}}>{[...new Map(activeJobs.map((j:any)=>[j.customer,j])).values()].map((job:any,i:number)=>{const cj=activeJobs.filter((j:any)=>j.customer===job.customer);const tot=cj.reduce((a:number,j:any)=>a+Number(j.value),0);return<div key={i} style={{padding:"14px 18px",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:"50%",background:`hsl(${i*45},60%,90%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:`hsl(${i*45},60%,35%)`}}>{job.customer.charAt(0)}</div><div><div style={{fontWeight:600,fontSize:13,color:"#0F172A"}}>{job.customer}</div><div style={{fontSize:11,color:"#94A3B8"}}>{job.phone||"—"}</div></div></div><div style={{textAlign:"right"}}><div style={{fontWeight:600,fontSize:13}}>${tot.toLocaleString()}</div><div style={{fontSize:11,color:"#94A3B8"}}>{cj.length} job{cj.length!==1?"s":""}</div></div></div>})}</Card>}
            </>}
            {vw==="leads"&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <h1 style={{fontSize:22,fontWeight:700,color:"#fff"}}>Leads</h1>
              </div>
              <p style={{fontSize:13,color:"#94A3B8",marginBottom:18}}>{activeLeads.filter((l:any)=>!l.read).length} unread from your site</p>
              {activeLeads.length===0?<Card style={{padding:40,textAlign:"center",marginBottom:24}}><div style={{fontSize:36,marginBottom:12}}>📥</div><div style={{fontWeight:600,fontSize:16,color:"#0F172A",marginBottom:6}}>No leads yet</div><div style={{fontSize:13,color:"#94A3B8"}}>Leads submitted through your website will appear here in real time.</div></Card>
              :<div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
                {activeLeads.map((l:any,i:number)=>(
                  <Card key={l.id||i} style={{padding:16,borderLeft:l.urgent?`4px solid #EF4444`:`4px solid ${G}`,opacity:l.read?0.6:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:15,color:"#0F172A"}}>{l.name}</div>
                        <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{[l.phone,l.email].filter(Boolean).join(" · ")}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <span style={{fontSize:11,color:"#94A3B8"}}>{lTs(l)}</span>
                        {l.urgent&&<span style={{fontSize:10,fontWeight:700,color:"#EF4444",background:"#FEE2E2",padding:"2px 8px",borderRadius:100}}>URGENT</span>}
                      </div>
                    </div>
                    {lMsg(l)&&<div style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:12,background:"#F8FAFC",borderRadius:8,padding:"8px 12px"}}>{lMsg(l)}</div>}
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {l.phone&&<a href={`tel:${l.phone}`} style={{textDecoration:"none"}}><Btn style={{fontSize:12,padding:"7px 16px"}}>Call</Btn></a>}
                      {l.email&&<a href={`mailto:${l.email}`} style={{textDecoration:"none"}}><BtnO style={{fontSize:12,padding:"7px 16px"}}>Email</BtnO></a>}
                      {!l.read&&<BtnO onClick={()=>markRead(l.id)} style={{fontSize:12,padding:"7px 16px"}}>Mark Read</BtnO>}
                    </div>
                  </Card>
                ))}
              </div>}
              {/* Homeowner requests from /find-contractor */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div>
                  <h2 style={{fontSize:17,fontWeight:700,color:"#fff",marginBottom:2}}>Maryland Homeowner Requests</h2>
                  <p style={{fontSize:12,color:"#94A3B8"}}>Project requests submitted by homeowners at letstaystacked.com/find-contractor</p>
                </div>
                <a href="/find-contractor" target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:G,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>View Page ↗</a>
              </div>
              {dbHomeownerLeads.length===0
                ? <Card style={{padding:"28px 20px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:10}}>🏡</div><div style={{fontWeight:600,fontSize:14,color:"#0F172A",marginBottom:4}}>No homeowner requests yet</div><div style={{fontSize:12,color:"#94A3B8"}}>Share letstaystacked.com/find-contractor to start receiving project leads from Maryland homeowners.</div></Card>
                : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {dbHomeownerLeads.map((l:any,i:number)=>{
                      const d=l.created_at?new Date(l.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}):"";
                      const jtEmoji:any={"bathroom":"🚿","kitchen":"🍳","paint":"🎨","exterior":"🏡","deck":"🪵","electrical":"⚡","plumbing":"🔧","hvac":"❄️","general":"🏗️","other":"🛠️"};
                      return(
                        <Card key={l.id||i} style={{padding:16,borderLeft:`4px solid #4A82C4`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                            <div>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                                <span style={{fontSize:16}}>{jtEmoji[l.job_type]||"🛠️"}</span>
                                <span style={{fontWeight:700,fontSize:15,color:"#0F172A"}}>{l.name}</span>
                                <span style={{fontSize:10,fontWeight:700,color:"#4A82C4",background:"#EFF6FF",padding:"2px 8px",borderRadius:100,textTransform:"uppercase"}}>{l.job_type}</span>
                              </div>
                              <div style={{fontSize:12,color:"#64748B"}}>{[l.phone,l.email].filter(Boolean).join(" · ")}{l.zip_code?` · ${l.zip_code}`:""}</div>
                            </div>
                            <span style={{fontSize:11,color:"#94A3B8",whiteSpace:"nowrap"}}>{d}</span>
                          </div>
                          {l.description&&<div style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:12,background:"#F8FAFC",borderRadius:8,padding:"8px 12px"}}>{l.description}</div>}
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            {l.phone&&<a href={`tel:${l.phone}`} style={{textDecoration:"none"}}><Btn style={{fontSize:12,padding:"7px 16px"}}>Call</Btn></a>}
                            {l.email&&<a href={`mailto:${l.email}`} style={{textDecoration:"none"}}><BtnO style={{fontSize:12,padding:"7px 16px"}}>Email</BtnO></a>}
                          </div>
                        </Card>
                      );
                    })}
                  </div>}
            </>}
            {vw==="followups"&&<>
              <h1 style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:4}}>Follow-up Reminders</h1><p style={{fontSize:13,color:"#94A3B8",marginBottom:18}}>Don&apos;t leave money on the table.</p>
              <div style={{padding:"40px 20px",textAlign:"center",color:"#94A3B8"}}><div style={{fontSize:36,marginBottom:12}}>🔔</div><div style={{fontWeight:600,fontSize:15,color:"#0F172A",marginBottom:4}}>No follow-ups yet</div><div style={{fontSize:12}}>Completed jobs will appear here as reminders to re-engage past clients.</div></div>
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
        <p className="sw-f2" style={{position:"relative",zIndex:1,fontSize:18,lineHeight:1.7,color:"rgba(245,240,235,0.6)",maxWidth:560,marginBottom:16}}>Stop juggling spreadsheets and apps you never open. StackedWork runs your contracting business in one place — CRM, lead tracking, before & after portfolio, and revenue dashboards.</p>
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
            <div key={i} className="feature-box" onMouseEnter={()=>setAf(i)} onClick={()=>{ if(f.link.startsWith("http")){window.open(f.link,"_blank");} else {setPage("app"); setVw(f.link);} }}
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
          {[{s:"01",t:"Sign up in 5 minutes",d:"Create your username and password, add your trade and service area. That's it."},{s:"02",t:"Your CRM is ready",d:"AI sets up your dashboard, job tracking, and lead management instantly."},{s:"03",t:"Start closing jobs",d:"CRM. Photo portfolio. Revenue tracking. Follow-up reminders. All live."}].map((x,i)=>(
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
        <p style={{position:"relative",zIndex:1,fontSize:17,color:"rgba(245,240,235,0.5)",maxWidth:480,margin:"0 auto 44px"}}>$49.99/month. CRM + photo portfolio + lead tracking. Cancel anytime. No contracts. No setup fees.</p>
        <button onClick={handleSubscribe} style={{position:"relative",zIndex:1,background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",border:"none",padding:"20px 48px",fontSize:18,fontWeight:700,fontFamily:"'DM Sans'",borderRadius:6,cursor:"pointer"}}>Start Your Free Trial</button>
        <p style={{position:"relative",zIndex:1,marginTop:22,fontSize:12,color:"rgba(245,240,235,0.3)",fontFamily:"'Space Mono'"}}>14-DAY FREE TRIAL — CREDIT CARD REQUIRED — CANCEL ANYTIME</p>
      </section>
      <div style={{background:"rgba(200,230,74,0.06)",border:"1px solid rgba(200,230,74,0.15)",borderRadius:0,padding:"48px 24px",textAlign:"center"}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <div style={{fontSize:32,marginBottom:12}}>🏡</div>
          <h3 style={{fontSize:22,fontWeight:800,marginBottom:8}}>Looking for a Contractor in Maryland?</h3>
          <p style={{fontSize:15,color:"rgba(245,240,235,0.6)",marginBottom:24,lineHeight:1.7}}>Describe your project and get connected with MHIC-licensed contractors in your area — free, fast, and no obligation.</p>
          <a href="/find-contractor" style={{display:"inline-block",background:`linear-gradient(135deg,${G},${GD})`,color:"#132440",textDecoration:"none",padding:"14px 36px",borderRadius:10,fontSize:15,fontWeight:800}}>Find a Licensed Contractor →</a>
        </div>
      </div>
      <footer style={{padding:"40px 24px",borderTop:"1px solid rgba(255,255,255,0.05)",maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:20,marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:26,height:26,background:"#4A82C4",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:9,color:"#fff",fontFamily:"'DM Sans'",letterSpacing:"-0.03em"}}>SW</div>
            <span style={{fontSize:13,color:"rgba(245,240,235,0.3)"}}>StackedWork — A <span style={{color:"rgba(245,240,235,0.5)"}}>REM Ventures</span> product</span>
          </div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"center"}}>
            <a href="/find-contractor" style={{color:"rgba(200,230,74,0.8)",fontSize:12,fontWeight:600,textDecoration:"none"}}>🏡 Find a Contractor</a>
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
