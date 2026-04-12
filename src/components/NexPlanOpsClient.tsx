"use client";

/**
 * src/components/NexPlanOpsClient.tsx
 *
 * NexPlan internal ops tools — added as a single new tab inside
 * the existing AdminClient (src/components/AdminClient.tsx).
 *
 * Contains 3 sub-tabs:
 *   1. DC Setup Wizard  — 6-step server/DB/email/SSO/LLM/review
 *   2. ROI Calculator   — sliders + savings + market comparison
 *   3. CIO Pitch Deck   — 10-slide viewer + PPTX download
 *
 * NO imports from admin/ folder. No page.tsx changes needed.
 * Self-contained — only uses useState from React.
 */

import { useState } from "react";

/* ── data ─────────────────────────────────────────────────────────────────── */
const AI_ENDPOINTS = [
  { name: "AI Project Manager",  model: "Sonnet 4.6", cost: 14.8 },
  { name: "Generate Insights",   model: "Sonnet 4.6", cost: 14.4 },
  { name: "Status Report",       model: "Haiku 4.5",  cost: 0.8  },
  { name: "Risk Mitigation",     model: "Haiku 4.5",  cost: 0.4  },
  { name: "AI Text",             model: "Haiku 4.5",  cost: 0.3  },
  { name: "AI Follow-up",        model: "Haiku 4.5",  cost: 0.2  },
  { name: "Network Diagram",     model: "Sonnet 4.6", cost: 3.1  },
  { name: "PCR Generation",      model: "Haiku 4.5",  cost: 0.3  },
  { name: "Infra Impact",        model: "Sonnet 4.6", cost: 3.5  },
];
const TOTAL_AI = AI_ENDPOINTS.reduce((a, e) => a + e.cost, 0);

const MARKET = [
  { name: "Microsoft Project", price: 30000, ai: false, infra: false },
  { name: "Jira + Confluence", price: 18000, ai: false, infra: false },
  { name: "ServiceNow PPM",    price: 85000, ai: false, infra: true  },
  { name: "Monday.com",        price: 24000, ai: false, infra: false },
  { name: "NexPlan",           price: 6000,  ai: true,  infra: true  },
];

const WIZARD_STEPS = [
  { label: "Server",   icon: "🖥" },
  { label: "Database", icon: "🗄" },
  { label: "Email",    icon: "📧" },
  { label: "SSO",      icon: "🔐" },
  { label: "AI / LLM", icon: "🤖" },
  { label: "Review",   icon: "✅" },
];

const PITCH_SLIDES = [
  "Title", "Problem", "Solution", "PM Grades",
  "ROI", "Market", "Deploy", "AI Cost", "Pricing", "Close"
];

const fmt = (n: number) => {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr";
  if (n >= 100000)   return "₹" + (n / 100000).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN");
};

type OpsTab = "setup" | "roi" | "pitch";

/* ── styles (scoped with .ops- prefix to avoid clashing with existing admin CSS) ── */
const CSS = `
.ops-wrap{font-family:system-ui,sans-serif;}
.ops-tabs{display:flex;gap:0;background:#fff;border:0.5px solid rgba(0,0,0,.09);border-radius:10px;overflow:hidden;margin-bottom:18px;}
.ops-tab{flex:1;padding:10px 6px;border:none;background:transparent;cursor:pointer;font-size:12px;font-weight:500;color:#73726C;transition:all .13s;border-right:0.5px solid rgba(0,0,0,.09);}
.ops-tab:last-child{border-right:none;}
.ops-tab.on{background:#085041;color:#fff;}
.ops-card{background:#fff;border:0.5px solid rgba(0,0,0,.09);border-radius:12px;padding:18px;margin-bottom:14px;}
.ops-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
.ops-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
.ops-kpi{background:#F4F3EF;border-radius:8px;padding:11px 13px;}
.ops-kpi-l{font-size:10px;color:#73726C;margin-bottom:3px;}
.ops-kpi-v{font-family:monospace;font-size:16px;font-weight:700;}
.ops-slbl{font-family:monospace;font-size:9px;letter-spacing:.07em;color:#73726C;text-transform:uppercase;margin-bottom:8px;}
.ops-fl{display:flex;align-items:center;}
.ops-bar-l{font-size:11px;color:#73726C;width:180px;flex-shrink:0;}
.ops-bar-t{flex:1;height:6px;background:rgba(0,0,0,.06);border-radius:3px;overflow:hidden;margin:0 8px;}
.ops-bar-f{height:100%;border-radius:3px;}
.ops-bar-v{font-family:monospace;font-size:11px;width:55px;text-align:right;flex-shrink:0;}
.ops-save{background:#E1F5EE;border:1.5px solid #1D9E75;border-radius:12px;padding:18px;text-align:center;margin-bottom:12px;}
.ops-save-n{font-family:monospace;font-size:34px;font-weight:700;color:#085041;}
.ops-sl{margin-bottom:11px;}
.ops-sl-t{display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;}
.ops-sl-v{font-family:monospace;font-weight:600;color:#0F6E56;}
.ops-range{width:100%;accent-color:#0F6E56;}
.ops-fld{margin-bottom:12px;}
.ops-fld-l{font-size:11px;font-weight:500;color:#1A1A18;margin-bottom:3px;}
.ops-fld-n{font-size:10px;color:#73726C;margin-top:2px;}
.ops-inp{width:100%;padding:7px 9px;border-radius:6px;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;color:#1A1A18;font-size:12px;font-family:monospace;box-sizing:border-box;}
.ops-sel{width:100%;padding:7px 9px;border-radius:6px;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;color:#1A1A18;font-size:12px;}
.ops-txa{width:100%;padding:7px 9px;border-radius:6px;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;color:#1A1A18;font-size:12px;font-family:monospace;resize:vertical;min-height:65px;box-sizing:border-box;}
.ops-tog-row{display:flex;align-items:center;gap:9px;margin-bottom:10px;font-size:12px;cursor:pointer;user-select:none;}
.ops-tog{width:30px;height:16px;border-radius:8px;background:#ccc;position:relative;transition:background .18s;flex-shrink:0;}
.ops-tog.on{background:#0F6E56;}
.ops-tog-t{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:left .18s;}
.ops-tog.on .ops-tog-t{left:16px;}
.ops-step-bar{display:flex;background:#fff;border:0.5px solid rgba(0,0,0,.09);border-radius:8px;overflow:hidden;margin-bottom:16px;}
.ops-step{flex:1;padding:8px 3px;text-align:center;cursor:pointer;border:none;background:transparent;border-right:0.5px solid rgba(0,0,0,.09);}
.ops-step:last-child{border-right:none;}
.ops-step.done{background:#E1F5EE;}
.ops-step.cur{background:#0F6E56;}
.ops-step .si{font-size:12px;}
.ops-step .sl{font-size:9px;font-weight:500;margin-top:1px;}
.ops-step.cur .sl{color:#fff;}
.ops-step.done .sl{color:#085041;}
.ops-step:not(.cur):not(.done) .sl{color:#73726C;}
.ops-footer{display:flex;justify-content:space-between;margin-top:16px;align-items:center;}
.ops-btn-back{padding:7px 13px;border-radius:6px;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;color:#73726C;cursor:pointer;font-size:11px;}
.ops-btn-next{padding:8px 18px;border-radius:6px;border:none;background:#0F6E56;color:#fff;font-weight:500;cursor:pointer;font-size:12px;}
.ops-btn-save{padding:9px 22px;border-radius:6px;border:none;background:#0F6E56;color:#fff;font-weight:600;cursor:pointer;font-size:13px;}
.ops-btn-test{padding:5px 10px;border-radius:5px;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;color:#73726C;cursor:pointer;font-size:10px;font-family:monospace;}
.ops-btn-test.ok{background:#E1F5EE;color:#085041;}
.ops-btn-test.fail{background:#FCEBEB;color:#791F1F;}
.ops-prov{padding:9px 12px;border-radius:7px;cursor:pointer;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.ops-prov.sel{border:2px solid #0F6E56;background:#E1F5EE;}
.ops-sso{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;}
.ops-sso-opt{padding:8px 10px;border-radius:7px;cursor:pointer;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;display:flex;align-items:center;gap:7px;font-size:11px;}
.ops-sso-opt.sel{border:2px solid #0F6E56;background:#E1F5EE;font-weight:600;color:#085041;}
.ops-info{background:#E6F1FB;border-radius:7px;padding:9px 11px;font-size:11px;color:#0C447C;margin-top:9px;line-height:1.6;}
.ops-warn{background:#FAEEDA;border-radius:7px;padding:9px 11px;font-size:11px;color:#633806;margin-bottom:12px;}
.ops-grn-box{background:#E1F5EE;border-radius:7px;padding:9px 11px;font-size:11px;color:#085041;line-height:1.7;margin-bottom:11px;}
.ops-rev-sec{margin-bottom:9px;border:0.5px solid rgba(0,0,0,.09);border-radius:8px;overflow:hidden;}
.ops-rev-hdr{padding:6px 10px;background:#F4F3EF;font-size:11px;font-weight:600;color:#1A1A18;border-bottom:0.5px solid rgba(0,0,0,.09);}
.ops-rev-row{display:flex;justify-content:space-between;padding:5px 10px;border-bottom:0.5px solid rgba(0,0,0,.09);font-size:11px;}
.ops-rev-row:last-child{border-bottom:none;}
.ops-tbl{width:100%;border-collapse:collapse;}
.ops-tbl th{text-align:left;font-size:9px;font-family:monospace;text-transform:uppercase;color:#73726C;padding:6px 8px;border-bottom:0.5px solid rgba(0,0,0,.09);letter-spacing:.05em;}
.ops-tbl td{padding:7px 8px;font-size:11px;border-bottom:0.5px solid rgba(0,0,0,.09);vertical-align:middle;}
.ops-tbl tr:last-child td{border-bottom:none;}
.ops-tbl tr.nr td{background:#E1F5EE;font-weight:600;}
.ops-tbl tr.tr td{background:#E1F5EE;font-weight:700;color:#085041;}
.ops-snav{display:flex;gap:3px;flex-wrap:wrap;margin-bottom:14px;}
.ops-sn{padding:5px 10px;border-radius:6px;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;cursor:pointer;font-size:10px;font-weight:500;color:#73726C;}
.ops-sn.on{background:#085041;color:#fff;}
.ops-pitch{background:#fff;border:0.5px solid rgba(0,0,0,.09);border-radius:11px;padding:18px;min-height:320px;}
.ops-dl{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:6px;border:none;background:#0F6E56;color:#fff;font-weight:600;cursor:pointer;font-size:12px;text-decoration:none;}
.ops-badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:600;font-family:monospace;}
@media(max-width:700px){.ops-grid2,.ops-grid4{grid-template-columns:1fr;}}
`;

export default function NexPlanOpsClient() {
  const [tab, setTab] = useState<OpsTab>("setup");

  /* wizard */
  const [wstep,     setWstep]  = useState(0);
  const [airGap,    setAirGap] = useState(false);
  const [whiteLabel, setWL]    = useState(false);
  const [sso,       setSso]    = useState("none");
  const [llm,       setLlm]    = useState("anthropic_cloud");
  const [testRes,   setTest]   = useState<Record<string,string>>({});
  const [saving,    setSaving] = useState(false);
  const [saved,     setSaved]  = useState(false);

  /* roi */
  const [users,   setUsers]  = useState(50);
  const [ftes,    setFtes]   = useState(10);
  const [gradeI,  setGI]     = useState(2);
  const [projPA,  setProjPA] = useState(30);
  const GRADES = [500000, 900000, 1700000, 2700000, 4100000, 7000000];
  const avgCTC   = GRADES[gradeI];
  const tradCost = avgCTC * ftes;
  const nexLic   = users * 6000;
  const nexFTEs  = Math.max(1, Math.ceil(ftes / 3));
  const nexTotal = nexLic + avgCTC * nexFTEs;
  const saving$  = tradCost - nexTotal;
  const roiPct   = Math.round((saving$ / tradCost) * 100);
  const payback  = saving$ > 0 ? Math.round(nexLic / (saving$ / 12)) : 0;

  /* pitch */
  const [pslide, setPslide] = useState(0);

  /* helpers */
  const runTest = (id: string) => {
    setTest(p => ({ ...p, [id]: "testing" }));
    setTimeout(() => setTest(p => ({ ...p, [id]: Math.random() > 0.1 ? "ok" : "fail" })), 1400);
  };
  const doSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setWstep(6); }, 1800);
  };

  const TBtn = ({ id, lbl }: { id: string; lbl: string }) => {
    const s = testRes[id];
    return <button className={`ops-btn-test ${s==="ok"?"ok":s==="fail"?"fail":""}`} onClick={()=>runTest(id)}>
      {s==="testing"?"⏳…":s==="ok"?`✓ ${lbl}`:s==="fail"?"✗ Failed":`Test ${lbl}`}
    </button>;
  };

  const Tog = ({ on, flip, lbl }: { on: boolean; flip: ()=>void; lbl: string }) => (
    <div className="ops-tog-row" onClick={flip}>
      <div className={`ops-tog ${on?"on":""}`}><div className="ops-tog-t"/></div>{lbl}
    </div>
  );

  const F = ({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) => (
    <div className="ops-fld">
      <div className="ops-fld-l">{label}</div>
      {children}
      {note && <div className="ops-fld-n">{note}</div>}
    </div>
  );

  /* ── DC SETUP WIZARD ─────────────────────────────────────────────────── */
  const SetupWizard = () => {
    if (saved && wstep === 6) return (
      <div className="ops-card" style={{textAlign:"center",padding:28}}>
        <div style={{width:48,height:48,borderRadius:"50%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:22,color:"#0F6E56"}}>✓</div>
        <div style={{fontSize:16,fontWeight:600,marginBottom:6}}>NexPlan is configured</div>
        <div style={{fontSize:12,color:"#73726C",marginBottom:16}}>All settings saved. Service restarting (~30 seconds).</div>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          <a href="#" className="ops-dl" style={{padding:"8px 16px",fontSize:12}}>Open NexPlan →</a>
          <button className="ops-btn-back" onClick={()=>{setSaved(false);setWstep(0);}}>Edit Config</button>
        </div>
      </div>
    );

    return (<>
      {/* Step bar */}
      <div className="ops-step-bar">
        {WIZARD_STEPS.map((s,i)=>(
          <div key={i} className={`ops-step ${i<wstep?"done":""} ${i===wstep?"cur":""}`} onClick={()=>i<=wstep&&setWstep(i)}>
            <div className="si">{i<wstep?"✓":s.icon}</div>
            <div className="sl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Step 0: Server */}
      {wstep===0&&<div className="ops-card">
        <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>🖥 Server configuration</div>
        <div style={{fontSize:11,color:"#73726C",marginBottom:14}}>Configure your Data Center server address and SSL settings.</div>
        <div className="ops-grid2">
          <F label="Application URL" note="e.g. https://nexplan.citibank.net"><input className="ops-inp" placeholder="https://nexplan.citibank.net"/></F>
          <F label="Server IP address"><input className="ops-inp" placeholder="10.20.30.40"/></F>
          <F label="HTTPS port"><input className="ops-inp" defaultValue="443"/></F>
          <div/>
          <F label="SSL certificate path"><input className="ops-inp" defaultValue="/etc/nexplan/ssl/cert.pem"/></F>
          <F label="SSL private key path"><input className="ops-inp" defaultValue="/etc/nexplan/ssl/key.pem"/></F>
        </div>
        <div style={{borderTop:"0.5px solid rgba(0,0,0,.09)",paddingTop:12,marginTop:4}}>
          <Tog on={airGap} flip={()=>setAirGap(!airGap)} lbl="Enable air-gap mode (no internet — disables cloud AI)"/>
          <Tog on={whiteLabel} flip={()=>setWL(!whiteLabel)} lbl="Enable white-label (show your organisation's branding)"/>
          {whiteLabel&&<div className="ops-grid2" style={{marginTop:6}}>
            <F label="Brand name"><input className="ops-inp" placeholder="CITI BANK IT Hub"/></F>
            <F label="Logo URL"><input className="ops-inp" placeholder="https://nexplan.citibank.net/logo.png"/></F>
          </div>}
        </div>
        <div className="ops-footer"><TBtn id="server" lbl="Connection"/><button className="ops-btn-next" onClick={()=>setWstep(1)}>Next: Database →</button></div>
      </div>}

      {/* Step 1: Database */}
      {wstep===1&&<div className="ops-card">
        <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>🗄 Database configuration</div>
        <div style={{fontSize:11,color:"#73726C",marginBottom:14}}>Connect NexPlan to your PostgreSQL. Creates its own schema, does not modify others.</div>
        <div className="ops-grid2">
          <F label="PostgreSQL host" note="IP or hostname of DB server"><input className="ops-inp" placeholder="10.20.30.41"/></F>
          <F label="Port"><input className="ops-inp" defaultValue="5432"/></F>
          <F label="Database name"><input className="ops-inp" defaultValue="nexplan"/></F>
          <F label="Username"><input className="ops-inp" defaultValue="nexplan"/></F>
          <F label="Password"><input className="ops-inp" type="password" placeholder="••••••••"/></F>
          <F label="Connection pool size"><input className="ops-inp" defaultValue="10"/></F>
        </div>
        <Tog on={true} flip={()=>{}} lbl="Require SSL for database connection (recommended)"/>
        <div className="ops-info">💡 <strong>Migrations run automatically</strong> on first start. NexPlan creates the <code>nexplan</code> schema. No manual SQL required.</div>
        <div className="ops-footer">
          <div style={{display:"flex",gap:7}}><button className="ops-btn-back" onClick={()=>setWstep(0)}>← Back</button><TBtn id="db" lbl="DB Connection"/></div>
          <button className="ops-btn-next" onClick={()=>setWstep(2)}>Next: Email →</button>
        </div>
      </div>}

      {/* Step 2: Email */}
      {wstep===2&&<div className="ops-card">
        <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>📧 Email / SMTP configuration</div>
        <div style={{fontSize:11,color:"#73726C",marginBottom:14}}>Configure your internal SMTP. All email stays inside your network.</div>
        <div className="ops-grid2">
          <F label="SMTP host" note="Your internal mail server"><input className="ops-inp" placeholder="smtp.citibank.net"/></F>
          <F label="SMTP port"><input className="ops-inp" defaultValue="587"/></F>
          <F label="SMTP username"><input className="ops-inp" placeholder="nexplan-svc@citibank.net"/></F>
          <F label="SMTP password"><input className="ops-inp" type="password" placeholder="••••••••"/></F>
          <F label="From email address"><input className="ops-inp" placeholder="nexplan@citibank.net"/></F>
          <F label="From display name"><input className="ops-inp" defaultValue="NexPlan"/></F>
        </div>
        <Tog on={true} flip={()=>{}} lbl="Enable STARTTLS encryption"/>
        <div className="ops-footer">
          <div style={{display:"flex",gap:7}}><button className="ops-btn-back" onClick={()=>setWstep(1)}>← Back</button><TBtn id="email" lbl="Test Email"/></div>
          <button className="ops-btn-next" onClick={()=>setWstep(3)}>Next: SSO →</button>
        </div>
      </div>}

      {/* Step 3: SSO */}
      {wstep===3&&<div className="ops-card">
        <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>🔐 Identity & SSO configuration</div>
        <div style={{fontSize:11,color:"#73726C",marginBottom:14}}>Connect to your existing identity provider.</div>
        <div className="ops-sso">
          {[{id:"none",lbl:"Email & password only",icon:"📧"},{id:"azure_ad",lbl:"Azure AD / Entra ID",icon:"🔵"},{id:"saml",lbl:"SAML 2.0 (Okta, ADFS)",icon:"🔐"},{id:"ldap",lbl:"LDAP / Active Directory",icon:"📁"},{id:"okta",lbl:"Okta",icon:"🟣"}]
            .map(o=><div key={o.id} className={`ops-sso-opt ${sso===o.id?"sel":""}`} onClick={()=>setSso(o.id)}><span>{o.icon}</span>{o.lbl}</div>)}
        </div>
        {sso==="azure_ad"&&<div className="ops-grid2"><F label="Client ID"><input className="ops-inp" placeholder="xxxxxxxx-xxxx-…"/></F><F label="Tenant ID"><input className="ops-inp" placeholder="xxxxxxxx-xxxx-…"/></F><F label="Client secret"><input className="ops-inp" type="password"/></F></div>}
        {sso==="saml"&&<div className="ops-grid2"><F label="SAML entry point"><input className="ops-inp" placeholder="https://sso.citibank.net/saml/sso"/></F><F label="Issuer / SP entity ID"><input className="ops-inp" placeholder="nexplan.citibank.net"/></F></div>}
        {sso==="ldap"&&<div className="ops-grid2"><F label="LDAP URL"><input className="ops-inp" placeholder="ldap://dc01.citibank.net:389"/></F><F label="Base DN"><input className="ops-inp" placeholder="ou=IT,dc=citibank,dc=net"/></F><F label="Service account DN"><input className="ops-inp" placeholder="cn=nexplan-svc,…"/></F><F label="Password"><input className="ops-inp" type="password"/></F><F label="User filter"><input className="ops-inp" defaultValue="(sAMAccountName={{username}})"/></F></div>}
        {sso==="okta"&&<div className="ops-grid2"><F label="Okta domain"><input className="ops-inp" placeholder="citibank.okta.com"/></F><F label="Client ID"><input className="ops-inp"/></F><F label="Client secret"><input className="ops-inp" type="password"/></F></div>}
        <div className="ops-footer">
          <div style={{display:"flex",gap:7}}><button className="ops-btn-back" onClick={()=>setWstep(2)}>← Back</button>{sso!=="none"&&<TBtn id="sso" lbl="SSO Connection"/>}</div>
          <button className="ops-btn-next" onClick={()=>setWstep(4)}>Next: AI / LLM →</button>
        </div>
      </div>}

      {/* Step 4: LLM */}
      {wstep===4&&<div className="ops-card">
        <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>🤖 AI / LLM configuration</div>
        <div style={{fontSize:11,color:"#73726C",marginBottom:10}}>NexPlan's AI features require an LLM. For air-gap, Ollama runs entirely inside your network.</div>
        {airGap&&<div className="ops-info" style={{marginBottom:12}}>🔒 Air-gap mode enabled. Cloud providers unavailable. <strong>Ollama</strong> recommended.</div>}
        {[
          {id:"anthropic_cloud",lbl:"Anthropic Cloud (Claude)",badge:"Recommended · Internet required",bc:"#E1F5EE",bt:"#085041"},
          {id:"ollama",lbl:"Ollama (Local LLM)",badge:"Best for air-gap · No internet",bc:"#E6F1FB",bt:"#0C447C"},
          {id:"openai_compatible",lbl:"OpenAI-compatible endpoint",badge:"vLLM, LM Studio, LiteLLM…",bc:"#FAEEDA",bt:"#633806"},
          {id:"azure_openai",lbl:"Azure OpenAI",badge:"Microsoft cloud · Enterprise SLA",bc:"#E6F1FB",bt:"#0C447C"},
          {id:"disabled",lbl:"Disable AI features",badge:"No AI — PM only",bc:"#F1EFE8",bt:"#5F5E5A"},
        ].filter(p=>!airGap||["ollama","openai_compatible","disabled"].includes(p.id))
         .map(p=><div key={p.id} className={`ops-prov ${llm===p.id?"sel":""}`} onClick={()=>setLlm(p.id)}>
           <span style={{fontSize:12,fontWeight:llm===p.id?600:400,color:llm===p.id?"#085041":"#1A1A18"}}>{p.lbl}</span>
           <span className="ops-badge" style={{background:p.bc,color:p.bt}}>{p.badge}</span>
         </div>)}
        {llm==="anthropic_cloud"&&<F label="Anthropic API key" note="Get from console.anthropic.com"><input className="ops-inp" type="password" placeholder="sk-ant-api03-…"/></F>}
        {llm==="ollama"&&<><div className="ops-grn-box"><strong>Ollama setup (~10 min):</strong><br/>1. Install: <code>curl -fsSL https://ollama.ai/install.sh | sh</code><br/>2. Pull: <code>ollama pull llama3.2:8b</code><br/>3. Start: <code>OLLAMA_HOST=0.0.0.0 ollama serve</code></div><div className="ops-grid2"><F label="Ollama URL"><input className="ops-inp" defaultValue="http://localhost:11434"/></F><F label="Model"><select className="ops-sel"><option>llama3.2:8b</option><option>llama3.1:8b</option><option>llama3.1:70b</option><option>mistral:7b</option><option>gemma2:9b</option></select></F></div></>}
        {llm==="openai_compatible"&&<div className="ops-grid2"><F label="API base URL" note="vLLM, LM Studio, LiteLLM, etc."><input className="ops-inp" placeholder="http://10.x.x.x:8000/v1"/></F><F label="Model name"><input className="ops-inp" placeholder="llama3-8b"/></F><F label="API key (if required)"><input className="ops-inp" type="password" placeholder="Leave blank if no auth"/></F></div>}
        {llm==="azure_openai"&&<div className="ops-grid2"><F label="Azure OpenAI endpoint"><input className="ops-inp" placeholder="https://myinstance.openai.azure.com"/></F><F label="Deployment name"><input className="ops-inp" placeholder="gpt-4o"/></F><F label="API key"><input className="ops-inp" type="password"/></F></div>}
        {llm!=="disabled"&&<F label="Test prompt" note="Verifies the LLM responds correctly"><textarea className="ops-txa" defaultValue="Summarise the key steps to migrate a server to cloud in 3 bullet points."/></F>}
        <div className="ops-footer">
          <div style={{display:"flex",gap:7}}><button className="ops-btn-back" onClick={()=>setWstep(3)}>← Back</button>{llm!=="disabled"&&<TBtn id="llm" lbl="LLM Connection"/>}</div>
          <button className="ops-btn-next" onClick={()=>setWstep(5)}>Review & Save →</button>
        </div>
      </div>}

      {/* Step 5: Review */}
      {wstep===5&&<div className="ops-card">
        <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>✅ Review configuration</div>
        <div style={{fontSize:11,color:"#73726C",marginBottom:14}}>Review all settings before saving. Changes take effect after restart.</div>
        {[
          {title:"🖥 Server",  rows:[["Air-gap",airGap?"Enabled":"Disabled"],["White-label",whiteLabel?"Enabled":"Disabled"]]},
          {title:"🗄 Database",rows:[["Database","nexplan"],["SSL","Required"]]},
          {title:"📧 Email",   rows:[["Port","587"],["TLS","Enabled"]]},
          {title:"🔐 SSO",     rows:[["Provider",sso==="none"?"Email & password":sso.replace("_"," ").toUpperCase()]]},
          {title:"🤖 AI / LLM",rows:[["Provider",llm.replace(/_/g," ").toUpperCase()]]},
        ].map(s=>(
          <div key={s.title} className="ops-rev-sec">
            <div className="ops-rev-hdr">{s.title}</div>
            {s.rows.map(([k,v])=><div key={k} className="ops-rev-row"><span style={{color:"#73726C"}}>{k}</span><span style={{fontFamily:"monospace",fontSize:10}}>{v}</span></div>)}
          </div>
        ))}
        <div className="ops-warn">⚠ Saving will restart NexPlan. Sessions briefly interrupted (~30 seconds).</div>
        <div className="ops-footer">
          <button className="ops-btn-back" onClick={()=>setWstep(4)}>← Back</button>
          <button className="ops-btn-save" onClick={doSave} disabled={saving} style={{background:saving?"#888":"#0F6E56"}}>
            {saving?"⏳ Saving…":"💾 Save Configuration"}
          </button>
        </div>
      </div>}
    </>);
  };

  /* ── ROI CALCULATOR ──────────────────────────────────────────────────── */
  const ROICalc = () => (
    <>
      <div className="ops-grid2">
        <div className="ops-card">
          <div className="ops-slbl">organisation inputs</div>
          <div className="ops-sl"><div className="ops-sl-t"><span>NexPlan users</span><span className="ops-sl-v">{users}</span></div><input type="range" className="ops-range" min={10} max={500} step={10} value={users} onChange={e=>setUsers(+e.target.value)}/><div style={{fontSize:10,color:"#73726C",marginTop:2}}>Licence: {fmt(users*6000)}/yr at ₹6,000/user</div></div>
          <div className="ops-sl"><div className="ops-sl-t"><span>PM FTE headcount</span><span className="ops-sl-v">{ftes} FTEs</span></div><input type="range" className="ops-range" min={1} max={100} step={1} value={ftes} onChange={e=>setFtes(+e.target.value)}/></div>
          <div className="ops-sl"><div className="ops-sl-t"><span>Avg PM grade (L1–L6)</span><span className="ops-sl-v">L{gradeI+1}</span></div><input type="range" className="ops-range" min={0} max={5} step={1} value={gradeI} onChange={e=>setGI(+e.target.value)}/><div style={{fontSize:10,color:"#73726C",marginTop:2}}>Avg CTC: {fmt(avgCTC)}</div></div>
          <div className="ops-sl"><div className="ops-sl-t"><span>IT projects/year</span><span className="ops-sl-v">{projPA}</span></div><input type="range" className="ops-range" min={5} max={200} step={5} value={projPA} onChange={e=>setProjPA(+e.target.value)}/></div>
          <div style={{background:"#F4F3EF",borderRadius:7,padding:"9px 11px",fontSize:10,color:"#73726C",marginTop:6,lineHeight:1.6}}>💡 AI enables each PM to handle <strong style={{color:"#0F6E56"}}>3× more projects</strong>. {ftes} FTEs → {Math.max(1,Math.ceil(ftes/3))} needed.</div>
        </div>
        <div className="ops-card">
          <div className="ops-slbl">cost comparison</div>
          {[
            {lbl:`Traditional (${ftes} PMs)`,val:tradCost,color:"#E24B4A"},
            {lbl:"NexPlan licence",val:nexLic,color:"#1D9E75"},
            {lbl:`Reduced PMs (${Math.max(1,Math.ceil(ftes/3))})`,val:avgCTC*Math.max(1,Math.ceil(ftes/3)),color:"#BA7517"},
            {lbl:"NexPlan total",val:nexTotal,color:"#378ADD"},
          ].map(r=>(
            <div key={r.lbl} className="ops-fl" style={{marginBottom:8}}>
              <div className="ops-bar-l">{r.lbl}</div>
              <div className="ops-bar-t"><div className="ops-bar-f" style={{width:`${Math.max(4,Math.round((r.val/tradCost)*100))}%`,background:r.color}}/></div>
              <div className="ops-bar-v">{fmt(r.val)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ops-save">
        <div className="ops-save-n">{fmt(saving$)}</div>
        <div style={{fontSize:12,color:"#0F6E56",marginTop:4}}>Annual cost saving with NexPlan</div>
        <div style={{display:"flex",gap:18,justifyContent:"center",marginTop:14,flexWrap:"wrap"}}>
          {[{v:`${roiPct}%`,l:"ROI",c:"#085041"},{v:`${payback} mo`,l:"Payback",c:"#0C447C"},{v:`${ftes-Math.max(1,Math.ceil(ftes/3))} FTE`,l:"Headcount saved",c:"#791F1F"},{v:fmt(saving$*3),l:"3-year saving",c:"#633806"}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"monospace",fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:"#73726C"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ops-card">
        <div className="ops-slbl">market comparison</div>
        <table className="ops-tbl">
          <thead><tr><th>Tool</th><th>₹/user/yr</th><th>AI</th><th>Infra PM</th><th>vs NexPlan ({users} users)</th></tr></thead>
          <tbody>
            {MARKET.map(t=>(
              <tr key={t.name} className={t.name==="NexPlan"?"nr":""}>
                <td style={{fontWeight:t.name==="NexPlan"?700:400,color:t.name==="NexPlan"?"#0F6E56":"#1A1A18"}}>{t.name==="NexPlan"?"⭐ ":""}{t.name}</td>
                <td style={{fontFamily:"monospace",fontSize:10,color:t.name==="NexPlan"?"#0F6E56":"#1A1A18"}}>₹{t.price.toLocaleString("en-IN")}</td>
                <td><span style={{color:t.ai?"#1D9E75":"#E24B4A"}}>{t.ai?"✓":"✗"}</span></td>
                <td><span style={{color:t.infra?"#1D9E75":"#E24B4A"}}>{t.infra?"✓":"✗"}</span></td>
                <td style={{fontFamily:"monospace",fontSize:10,color:t.name==="NexPlan"?"#085041":"#A32D2D",fontWeight:600}}>{t.name==="NexPlan"?"baseline":`+${fmt((t.price-6000)*users)}/yr`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ops-grid4">
        {[
          {l:"AI COGS worst case/mo",v:`₹${TOTAL_AI.toFixed(1)}`,c:"#A32D2D"},
          {l:"AI COGS optimised/mo", v:"~₹5",      c:"#085041"},
          {l:"What you charge/yr",   v:"₹500",     c:"#0C447C"},
          {l:"Gross margin on AI",   v:"97%",       c:"#085041"},
        ].map(k=>(
          <div key={k.l} className="ops-kpi">
            <div className="ops-kpi-l">{k.l}</div>
            <div className="ops-kpi-v" style={{color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>
    </>
  );

  /* ── CIO PITCH DECK ──────────────────────────────────────────────────── */
  const PitchDeck = () => (
    <>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{fontSize:12,color:"#73726C"}}>10-slide CIO pitch deck · Click a slide to preview</div>
        <a href="/downloads/NexPlan-CIO-Pitch.pptx" download className="ops-dl">⬇ Download PPTX</a>
      </div>
      <div className="ops-snav">
        {PITCH_SLIDES.map((s,i)=>(
          <button key={i} className={`ops-sn ${pslide===i?"on":""}`} onClick={()=>setPslide(i)}>{i+1}. {s}</button>
        ))}
      </div>

      {pslide===0&&<div className="ops-pitch" style={{background:"linear-gradient(135deg,#085041,#0F6E56 60%,#1D9E75)",color:"#fff"}}>
        <div style={{fontSize:11,color:"#9FE1CB",marginBottom:6,fontFamily:"monospace"}}>SLIDE 1 — TITLE</div>
        <div style={{fontSize:28,fontWeight:800,marginBottom:8}}>AI-Powered IT<br/>Project Management</div>
        <div style={{fontSize:15,color:"#9FE1CB",marginBottom:22}}>for Enterprise Infrastructure Teams</div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {[{v:"14×",l:"cheaper than ServiceNow"},{v:"3×",l:"more projects per PM"},{v:"40-65%",l:"PM labour cost reduction"}].map(s=>(
            <div key={s.l} style={{background:"rgba(255,255,255,.1)",borderRadius:9,padding:"10px 14px",textAlign:"center",minWidth:110}}>
              <div style={{fontFamily:"monospace",fontSize:20,fontWeight:700,color:"#E1F5EE"}}>{s.v}</div>
              <div style={{fontSize:9,color:"#9FE1CB",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>}

      {pslide===1&&<div className="ops-pitch">
        <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>The Problem Every CIO Faces</div>
        <div style={{fontSize:11,color:"#73726C",marginBottom:12}}>Three persistent and expensive problems in IT delivery organisations</div>
        {[{t:"Grade inflation cost",b:"Projects get assigned senior PMs (Band 7–9) even when complexity doesn't warrant it — because junior PMs lack domain knowledge to plan independently."},{t:"Knowledge bottleneck",b:"Complex infra projects (SD-WAN, DC migration, ERP) need scarce, expensive specialists. Hiring takes months. Projects stall."},{t:"Portfolio blindspot",b:"CIOs have no real-time view of RAG status, budget vs EAC — without paying ₹85,000/user/yr for ServiceNow."}].map(p=>(
          <div key={p.t} style={{background:"#fff",border:"0.5px solid #FECACA",borderRadius:9,padding:12,borderLeft:"3px solid #E24B4A",marginBottom:9}}>
            <div style={{fontWeight:600,fontSize:12,marginBottom:4}}>{p.t}</div>
            <div style={{fontSize:11,color:"#73726C",lineHeight:1.6}}>{p.b}</div>
          </div>
        ))}
      </div>}

      {pslide===4&&<div className="ops-pitch">
        <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>ROI — {users} users, {ftes} PMs</div>
        <div style={{fontSize:11,color:"#73726C",marginBottom:12}}>Live from your ROI calculator inputs above</div>
        <div className="ops-save">
          <div className="ops-save-n">{fmt(saving$)}</div>
          <div style={{fontSize:11,color:"#0F6E56",marginTop:4}}>Annual saving · ROI: {roiPct}% · Payback: {payback} months</div>
        </div>
        <div style={{display:"flex",gap:16,justifyContent:"center",fontSize:12,color:"#73726C"}}>
          <span>Traditional: <strong style={{color:"#E24B4A"}}>{fmt(tradCost)}/yr</strong></span>
          <span>NexPlan total: <strong style={{color:"#0F6E56"}}>{fmt(nexTotal)}/yr</strong></span>
        </div>
      </div>}

      {pslide===7&&<div className="ops-pitch">
        <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>AI Cost — What NexPlan Pays Anthropic</div>
        <div style={{fontSize:11,color:"#73726C",marginBottom:12}}>All 9 endpoints · ₹{TOTAL_AI.toFixed(1)} worst case · ~₹5 optimised · 97% margin</div>
        <table className="ops-tbl">
          <thead><tr><th>AI Feature</th><th>Model</th><th>Cost/user/mo</th></tr></thead>
          <tbody>
            {AI_ENDPOINTS.map(e=><tr key={e.name}><td>{e.name}</td><td style={{fontFamily:"monospace",fontSize:10}}>{e.model}</td><td style={{fontFamily:"monospace",fontSize:10}}>₹{e.cost}</td></tr>)}
            <tr className="tr"><td colSpan={2}><strong>TOTAL worst case</strong></td><td style={{fontFamily:"monospace"}}><strong>₹{TOTAL_AI.toFixed(1)}</strong></td></tr>
          </tbody>
        </table>
      </div>}

      {![0,1,4,7].includes(pslide)&&<div className="ops-pitch" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
        <div style={{fontSize:32}}>📊</div>
        <div style={{fontWeight:600,fontSize:14}}>Slide {pslide+1}: {PITCH_SLIDES[pslide]}</div>
        <div style={{fontSize:12,color:"#73726C",textAlign:"center",maxWidth:380,lineHeight:1.6}}>Full slide content is in the downloadable PPTX. Download to present to a CIO or CTO.</div>
        <a href="/downloads/NexPlan-CIO-Pitch.pptx" download className="ops-dl" style={{marginTop:8,padding:"8px 16px",fontSize:12}}>⬇ Download Full PPTX</a>
      </div>}
    </>
  );

  /* ── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <div className="ops-wrap">
      <style>{CSS}</style>

      {/* Sub-tab bar */}
      <div className="ops-tabs">
        {[
          {id:"setup" as OpsTab, label:"🖥 DC Setup Wizard"},
          {id:"roi"   as OpsTab, label:"💰 ROI Calculator"},
          {id:"pitch" as OpsTab, label:"📊 CIO Pitch Deck"},
        ].map(t=>(
          <button key={t.id} className={`ops-tab ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="setup" && <SetupWizard/>}
      {tab==="roi"   && <ROICalc/>}
      {tab==="pitch" && <PitchDeck/>}
    </div>
  );
}
