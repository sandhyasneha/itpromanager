"use client";

/**
 * src/app/(app)/admin/AdminClient.tsx
 *
 * ⚠ CORRECT PATH: src/app/(app)/admin/AdminClient.tsx
 *
 * Unified admin panel — all admin tools in one place.
 * Tabs:
 *   1. Overview      — quick stats, links, AI cost summary
 *   2. DC Setup      — full Data Center setup wizard (was /setup)
 *   3. ROI           — ROI calculator + AI token audit (was /roi)
 *   4. Pitch         — CIO pitch deck viewer + download (was /pitch)
 *   5. Audit Log     — existing AdminAuditLog component
 *
 * Accessible only when logged in as info@nexplan.io (enforced in page.tsx)
 */

import { useState } from "react";

/* ─── shared styles ─────────────────────────────────────────────────────── */
const S = `
:root{--bg:#F4F3EF;--sur:#fff;--bdr:rgba(0,0,0,0.09);--txt:#1A1A18;--mut:#73726C;--grn:#0F6E56;--dk:#085041;--mono:monospace;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:system-ui,sans-serif;background:var(--bg);}
.shell{min-height:100vh;background:var(--bg);}
.topbar{background:#085041;padding:11px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
.logo{width:26px;height:26px;border-radius:6px;background:#1D9E75;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;font-weight:700;color:#E1F5EE;flex-shrink:0;}
.main{max-width:1100px;margin:0 auto;padding:24px;}
.tab-bar{display:flex;gap:0;background:var(--sur);border:0.5px solid var(--bdr);border-radius:12px;overflow:hidden;margin-bottom:24px;}
.tab-btn{flex:1;padding:12px 8px;border:none;background:transparent;cursor:pointer;font-size:13px;font-weight:500;color:var(--mut);transition:all .14s;border-right:0.5px solid var(--bdr);display:flex;flex-direction:column;align-items:center;gap:4px;}
.tab-btn:last-child{border-right:none;}
.tab-btn.active{background:#085041;color:#fff;}
.tab-btn .tab-icon{font-size:18px;}
.tab-btn .tab-lbl{font-size:11px;}
.card{background:var(--sur);border:0.5px solid var(--bdr);border-radius:13px;padding:20px;}
.sec-lbl{font-family:var(--mono);font-size:10px;letter-spacing:.08em;color:var(--mut);text-transform:uppercase;margin-bottom:10px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.kpi{background:var(--bg);border:0.5px solid var(--bdr);border-radius:10px;padding:13px 15px;}
.kpi-lbl{font-size:10px;color:var(--mut);margin-bottom:4px;}
.kpi-val{font-family:var(--mono);font-size:18px;font-weight:700;}
.kpi-sub{font-size:10px;color:var(--mut);margin-top:2px;}
input[type=text],input[type=password]{width:100%;padding:8px 10px;border-radius:7px;border:0.5px solid var(--bdr);background:var(--bg);color:var(--txt);font-size:12px;font-family:var(--mono);}
select{width:100%;padding:8px 10px;border-radius:7px;border:0.5px solid var(--bdr);background:var(--bg);color:var(--txt);font-size:12px;}
textarea{width:100%;padding:8px 10px;border-radius:7px;border:0.5px solid var(--bdr);background:var(--bg);color:var(--txt);font-size:12px;font-family:var(--mono);resize:vertical;min-height:70px;}
.field{margin-bottom:14px;}
.field-lbl{font-size:11px;font-weight:500;color:var(--txt);margin-bottom:4px;}
.field-note{font-size:10px;color:var(--mut);margin-top:3px;}
.step-bar{display:flex;gap:0;background:var(--sur);border:0.5px solid var(--bdr);border-radius:10px;overflow:hidden;margin-bottom:20px;}
.step-btn{flex:1;padding:9px 4px;text-align:center;cursor:pointer;border:none;background:transparent;border-right:0.5px solid var(--bdr);transition:background .14s;}
.step-btn:last-child{border-right:none;}
.step-btn.done{background:#E1F5EE;}
.step-btn.cur{background:#0F6E56;}
.step-btn .si{font-size:13px;margin-bottom:2px;}
.step-btn .sl{font-size:10px;font-weight:500;}
.step-btn.cur .sl{color:#fff;}
.step-btn.done .sl{color:#085041;}
.step-btn:not(.cur):not(.done) .sl{color:var(--mut);}
.footer{display:flex;justify-content:space-between;margin-top:20px;align-items:center;}
.btn-back{padding:8px 14px;border-radius:7px;border:0.5px solid var(--bdr);background:var(--bg);color:var(--mut);cursor:pointer;font-size:12px;}
.btn-next{padding:9px 20px;border-radius:7px;border:none;background:#0F6E56;color:#fff;font-weight:500;cursor:pointer;font-size:13px;}
.btn-save{padding:10px 24px;border-radius:7px;border:none;background:#0F6E56;color:#fff;font-weight:600;cursor:pointer;font-size:14px;}
.btn-test{padding:6px 12px;border-radius:6px;border:0.5px solid var(--bdr);background:var(--bg);color:var(--mut);cursor:pointer;font-size:11px;font-family:var(--mono);}
.btn-test.ok{background:#E1F5EE;color:#085041;}
.btn-test.fail{background:#FCEBEB;color:#791F1F;}
.prov-list{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;}
.prov{padding:10px 14px;border-radius:8px;cursor:pointer;border:0.5px solid var(--bdr);background:var(--bg);display:flex;align-items:center;justify-content:space-between;}
.prov.sel{border:2px solid #0F6E56;background:#E1F5EE;}
.sso-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px;}
.sso-opt{padding:9px 12px;border-radius:8px;cursor:pointer;border:0.5px solid var(--bdr);background:var(--bg);display:flex;align-items:center;gap:8px;font-size:12px;}
.sso-opt.sel{border:2px solid #0F6E56;background:#E1F5EE;font-weight:600;color:#085041;}
.toggle-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:12px;color:var(--txt);cursor:pointer;user-select:none;}
.tog{width:32px;height:17px;border-radius:9px;background:#ccc;position:relative;transition:background .2s;flex-shrink:0;}
.tog.on{background:#0F6E56;}
.tog-thumb{position:absolute;top:2px;left:2px;width:13px;height:13px;border-radius:50%;background:#fff;transition:left .2s;}
.tog.on .tog-thumb{left:17px;}
.info-box{background:#E6F1FB;border-radius:8px;padding:10px 12px;font-size:11px;color:#0C447C;margin-top:10px;line-height:1.6;}
.warn-box{background:#FAEEDA;border-radius:8px;padding:10px 12px;font-size:11px;color:#633806;margin-bottom:14px;}
.green-box{background:#E1F5EE;border-radius:8px;padding:10px 12px;font-size:11px;color:#085041;line-height:1.7;margin-bottom:12px;}
.rev-sec{margin-bottom:10px;border:0.5px solid var(--bdr);border-radius:9px;overflow:hidden;}
.rev-hdr{padding:7px 12px;background:var(--bg);font-size:12px;font-weight:600;color:var(--txt);border-bottom:0.5px solid var(--bdr);}
.rev-row{display:flex;justify-content:space-between;padding:6px 12px;border-bottom:0.5px solid var(--bdr);font-size:12px;}
.rev-row:last-child{border-bottom:none;}
.saving-box{background:#E1F5EE;border:1.5px solid #1D9E75;border-radius:12px;padding:20px;text-align:center;margin-bottom:14px;}
.sl-row{margin-bottom:12px;}
.sl-top{display:flex;justify-content:space-between;font-size:12px;color:var(--txt);margin-bottom:4px;}
.sl-val{font-family:var(--mono);font-weight:600;color:#0F6E56;}
input[type=range]{width:100%;accent-color:#0F6E56;}
.tbl{width:100%;border-collapse:collapse;}
.tbl th{text-align:left;font-size:10px;font-family:var(--mono);text-transform:uppercase;color:var(--mut);padding:6px 9px;border-bottom:0.5px solid var(--bdr);letter-spacing:.05em;}
.tbl td{padding:7px 9px;font-size:12px;border-bottom:0.5px solid var(--bdr);vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tr.nexrow td{background:#E1F5EE;font-weight:600;}
.tbl tr.totrow td{background:#E1F5EE;font-weight:700;color:#085041;}
.tbl tr.selrow td{background:#E1F5EE;}
.chk{color:#1D9E75;}
.crs{color:#E24B4A;}
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;font-family:var(--mono);}
.slide-nav{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;}
.snav{padding:6px 12px;border-radius:7px;border:0.5px solid var(--bdr);background:var(--bg);cursor:pointer;font-size:11px;font-weight:500;color:var(--mut);}
.snav.active{background:#085041;color:#fff;}
.prob-card{background:var(--sur);border:0.5px solid #FECACA;border-radius:9px;padding:12px;border-left:3px solid #E24B4A;margin-bottom:10px;}
.sol-card{background:var(--bg);border:0.5px solid var(--bdr);border-radius:9px;padding:12px;}
.bar-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.bar-lbl{font-size:11px;color:var(--mut);width:180px;flex-shrink:0;}
.bar-track{flex:1;height:6px;background:rgba(0,0,0,.06);border-radius:3px;overflow:hidden;}
.bar-fill{height:100%;border-radius:3px;}
.bar-val{font-family:var(--mono);font-size:11px;color:var(--txt);width:55px;text-align:right;flex-shrink:0;}
.pitch-slide{background:var(--sur);border:0.5px solid var(--bdr);border-radius:12px;padding:20px;min-height:380px;}
.dl-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:7px;border:none;background:#0F6E56;color:#fff;font-weight:600;cursor:pointer;font-size:13px;text-decoration:none;}
@media(max-width:700px){.grid2,.grid3,.grid4{grid-template-columns:1fr;}}
`;

/* ─── data ───────────────────────────────────────────────────────────────── */
const AI_ENDPOINTS = [
  { name: "AI Project Manager",       model: "Sonnet 4.6", cost: 14.8 },
  { name: "Generate Insights",        model: "Sonnet 4.6", cost: 14.4 },
  { name: "Status Report",            model: "Haiku 4.5",  cost: 0.8  },
  { name: "Risk Mitigation",          model: "Haiku 4.5",  cost: 0.4  },
  { name: "AI Text",                  model: "Haiku 4.5",  cost: 0.3  },
  { name: "AI Follow-up",             model: "Haiku 4.5",  cost: 0.2  },
  { name: "Network Diagram",          model: "Sonnet 4.6", cost: 3.1  },
  { name: "PCR Generation",           model: "Haiku 4.5",  cost: 0.3  },
  { name: "Infra Impact",             model: "Sonnet 4.6", cost: 3.5  },
];
const totalAI = AI_ENDPOINTS.reduce((a, e) => a + e.cost, 0);

const MARKET = [
  { name: "Microsoft Project", price: 30000, ai: false, infra: false },
  { name: "Jira + Confluence", price: 18000, ai: false, infra: false },
  { name: "ServiceNow PPM",    price: 85000, ai: false, infra: true  },
  { name: "Monday.com",        price: 24000, ai: false, infra: false },
  { name: "NexPlan",           price: 6000,  ai: true,  infra: true  },
];

const fmt = (n: number) => {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr";
  if (n >= 100000)   return "₹" + (n / 100000).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN");
};

const WIZARD_STEPS = [
  { id: "server",   label: "Server",   icon: "🖥" },
  { id: "database", label: "Database", icon: "🗄" },
  { id: "email",    label: "Email",    icon: "📧" },
  { id: "sso",      label: "SSO",      icon: "🔐" },
  { id: "llm",      label: "AI / LLM", icon: "🤖" },
  { id: "review",   label: "Review",   icon: "✅" },
];

type AdminTab = "overview" | "setup" | "roi" | "pitch" | "audit";
type WizStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Slide = "overview" | "problem" | "solution" | "grades" | "roi" | "market" | "deploy" | "aicost" | "pricing" | "close";

const SLIDES: { id: Slide; label: string }[] = [
  { id: "overview", label: "Title" },   { id: "problem",  label: "Problem" },
  { id: "solution", label: "Solution" },{ id: "grades",   label: "PM Grades" },
  { id: "roi",      label: "ROI" },     { id: "market",   label: "Market" },
  { id: "deploy",   label: "Deploy" },  { id: "aicost",   label: "AI Cost" },
  { id: "pricing",  label: "Pricing" }, { id: "close",    label: "Close" },
];

/* ─── component ─────────────────────────────────────────────────────────── */
export default function AdminClient({ auditLog }: { auditLog?: React.ReactNode }) {
  const [tab, setTab]       = useState<AdminTab>("overview");

  /* wizard state */
  const [wstep, setWstep]   = useState<WizStep>(0);
  const [airGap, setAirGap] = useState(false);
  const [whiteLabel, setWL] = useState(false);
  const [sso, setSso]       = useState("none");
  const [llm, setLlm]       = useState("anthropic_cloud");
  const [testRes, setTest]  = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  /* roi state */
  const [users,   setUsers]   = useState(50);
  const [ftes,    setFtes]    = useState(10);
  const [gradeI,  setGradeI]  = useState(2);
  const [projPA,  setProjPA]  = useState(30);
  const GRADES = [500000, 900000, 1700000, 2700000, 4100000, 7000000];
  const avgCTC   = GRADES[gradeI];
  const tradCost = avgCTC * ftes;
  const nexLic   = users * 6000;
  const nexFTEs  = Math.max(1, Math.ceil(ftes / 3));
  const nexPM    = avgCTC * nexFTEs;
  const nexTotal = nexLic + nexPM;
  const saving$  = tradCost - nexTotal;
  const roi      = Math.round((saving$ / tradCost) * 100);
  const payback  = saving$ > 0 ? Math.round(nexLic / (saving$ / 12)) : 0;

  /* pitch state */
  const [slide, setSlide]   = useState<Slide>("overview");

  /* ── helpers ── */
  function runTest(id: string) {
    setTest(p => ({ ...p, [id]: "testing" }));
    setTimeout(() => setTest(p => ({ ...p, [id]: Math.random() > 0.1 ? "ok" : "fail" })), 1400);
  }

  function doSave() {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setWstep(6 as WizStep); }, 1800);
  }

  const TestBtn = ({ id, lbl }: { id: string; lbl: string }) => {
    const st = testRes[id];
    return (
      <button className={`btn-test ${st === "ok" ? "ok" : st === "fail" ? "fail" : ""}`}
        onClick={() => runTest(id)}>
        {st === "testing" ? "⏳ Testing…" : st === "ok" ? `✓ ${lbl}` : st === "fail" ? "✗ Failed" : `Test ${lbl}`}
      </button>
    );
  };

  const Toggle = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
    <div className="toggle-row" onClick={onToggle}>
      <div className={`tog ${on ? "on" : ""}`}><div className="tog-thumb" /></div>
      {label}
    </div>
  );

  const Field = ({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) => (
    <div className="field">
      <div className="field-lbl">{label}</div>
      {children}
      {note && <div className="field-note">{note}</div>}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     TAB 1 — OVERVIEW
  ══════════════════════════════════════════════════════════════════════ */
  const OverviewTab = () => (
    <>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#085041,#0F6E56 60%,#1D9E75)", borderRadius: 14, padding: "24px 28px", marginBottom: 20, color: "#fff" }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>NexPlan Admin Panel</div>
        <div style={{ fontSize: 13, color: "#9FE1CB", marginBottom: 16 }}>info@nexplan.io · Restricted access · April 2026</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { val: "₹37.8", sub: "AI COGS worst case/user/mo" },
            { val: "~₹5",   sub: "AI COGS optimised/user/mo" },
            { val: "97%",   sub: "gross margin on AI" },
            { val: "9",     sub: "active AI endpoints" },
          ].map(s => (
            <div key={s.sub}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: "#E1F5EE" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#9FE1CB" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid3" style={{ marginBottom: 20 }}>
        {[
          { icon: "🖥", title: "DC Setup Wizard",   sub: "Configure server, DB, SSO, LLM", tab: "setup" as AdminTab, color: "#0C447C", bg: "#E6F1FB" },
          { icon: "💰", title: "ROI Calculator",    sub: "Enterprise cost savings analysis", tab: "roi" as AdminTab,   color: "#085041", bg: "#E1F5EE" },
          { icon: "📊", title: "CIO Pitch Deck",    sub: "10-slide deck + PPTX download",   tab: "pitch" as AdminTab, color: "#633806", bg: "#FAEEDA" },
        ].map(c => (
          <div key={c.title} onClick={() => setTab(c.tab)} style={{ background: c.bg, border: `0.5px solid ${c.color}30`, borderRadius: 12, padding: 16, cursor: "pointer" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontWeight: 600, color: c.color, fontSize: 14, marginBottom: 3 }}>{c.title}</div>
            <div style={{ fontSize: 11, color: c.color, opacity: 0.8 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* AI cost summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="sec-lbl">AI token cost summary — 9 endpoints (ai-kb excluded, pure DB)</div>
        <div className="grid4" style={{ marginBottom: 14 }}>
          {[
            { lbl: "Worst case/user/mo",  val: `₹${totalAI.toFixed(1)}`, color: "#A32D2D" },
            { lbl: "Optimised/user/mo",   val: "~₹5",                    color: "#085041" },
            { lbl: "What you charge/yr",  val: "₹500",                   color: "#0C447C" },
            { lbl: "Gross margin on AI",  val: "97%",                    color: "#085041" },
          ].map(k => (
            <div key={k.lbl} className="kpi">
              <div className="kpi-lbl">{k.lbl}</div>
              <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
            </div>
          ))}
        </div>
        <table className="tbl">
          <thead><tr><th>Endpoint</th><th>Model</th><th>Cost/user/mo</th></tr></thead>
          <tbody>
            {AI_ENDPOINTS.map(e => (
              <tr key={e.name}>
                <td>{e.name}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{e.model}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>₹{e.cost}</td>
              </tr>
            ))}
            <tr className="totrow">
              <td colSpan={2}><strong>TOTAL worst case</strong></td>
              <td style={{ fontFamily: "var(--mono)" }}><strong>₹{totalAI.toFixed(1)}/mo</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pricing tiers summary */}
      <div className="card">
        <div className="sec-lbl">pricing tiers — gross margin overview</div>
        <table className="tbl">
          <thead><tr><th>Tier</th><th>Users</th><th>Annual price</th><th>AI COGS/yr</th><th>Gross margin</th></tr></thead>
          <tbody>
            {[
              ["Starter",    "≤25",      "₹1,00,000", "₹4,500",   "95.5%"],
              ["Business",   "≤100",     "₹3,50,000", "₹18,000",  "94.9%"],
              ["Enterprise", "Unlimited","₹8,00,000+","₹90,000",  "86.3%"],
              ["Data Center","Any",      "₹5,00,000+","₹0",       "~100%"],
            ].map(([t, u, p, c, m]) => (
              <tr key={t}>
                <td style={{ fontWeight: 600, color: "#0F6E56" }}>{t}</td>
                <td style={{ color: "var(--mut)" }}>{u}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{p}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#A32D2D" }}>{c}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#085041", fontWeight: 600 }}>{m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ══════════════════════════════════════════════════════════════════════
     TAB 2 — DC SETUP WIZARD
  ══════════════════════════════════════════════════════════════════════ */
  const SetupTab = () => {
    if (saved && wstep === 6) return (
      <div className="card" style={{ textAlign: "center", padding: 36 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: "#0F6E56" }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "var(--txt)", marginBottom: 8 }}>NexPlan is configured</div>
        <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 20, lineHeight: 1.6 }}>
          All settings saved. Service restarting — available in ~30 seconds.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <a href="#" style={{ padding: "9px 18px", borderRadius: 7, background: "#0F6E56", color: "#fff", textDecoration: "none", fontWeight: 500, fontSize: 13 }}>Open NexPlan →</a>
          <button onClick={() => { setSaved(false); setWstep(0); }} style={{ padding: "9px 18px", borderRadius: 7, border: "0.5px solid var(--bdr)", background: "var(--bg)", color: "var(--mut)", cursor: "pointer", fontSize: 13 }}>Edit Configuration</button>
        </div>
      </div>
    );

    return (
      <>
        {/* Step progress bar */}
        <div className="step-bar">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.id} className={`step-btn ${i < wstep ? "done" : ""} ${i === wstep ? "cur" : ""}`}
              onClick={() => i <= wstep && setWstep(i as WizStep)}>
              <div className="si">{i < wstep ? "✓" : s.icon}</div>
              <div className="sl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Step 1: Server */}
        {wstep === 0 && (
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 3 }}>🖥 Server configuration</div>
            <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 18 }}>Configure your Data Center server address and SSL settings.</div>
            <div className="grid2">
              <Field label="Application URL" note="e.g. https://nexplan.citibank.net"><input type="text" placeholder="https://nexplan.citibank.net" /></Field>
              <Field label="Server IP address" note="Internal server IP"><input type="text" placeholder="10.20.30.40" /></Field>
              <Field label="HTTPS port"><input type="text" defaultValue="443" /></Field>
              <div />
              <Field label="SSL certificate path"><input type="text" defaultValue="/etc/nexplan/ssl/cert.pem" /></Field>
              <Field label="SSL private key path"><input type="text" defaultValue="/etc/nexplan/ssl/key.pem" /></Field>
            </div>
            <div style={{ borderTop: "0.5px solid var(--bdr)", paddingTop: 14, marginTop: 4 }}>
              <Toggle on={airGap} onToggle={() => setAirGap(!airGap)} label="Enable air-gap mode (no internet — disables cloud AI)" />
              <Toggle on={whiteLabel} onToggle={() => setWL(!whiteLabel)} label="Enable white-label (show your organisation's branding)" />
              {whiteLabel && (
                <div className="grid2" style={{ marginTop: 6 }}>
                  <Field label="Brand name"><input type="text" placeholder="CITI BANK IT Hub" /></Field>
                  <Field label="Logo URL" note="Hosted inside your network"><input type="text" placeholder="https://nexplan.citibank.net/logo.png" /></Field>
                </div>
              )}
            </div>
            <div className="footer">
              <TestBtn id="server" lbl="Connection" />
              <button className="btn-next" onClick={() => setWstep(1)}>Next: Database →</button>
            </div>
          </div>
        )}

        {/* Step 2: Database */}
        {wstep === 1 && (
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 3 }}>🗄 Database configuration</div>
            <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 18 }}>Connect to your PostgreSQL. NexPlan creates its own schema, does not modify others.</div>
            <div className="grid2">
              <Field label="PostgreSQL host" note="IP or hostname of DB server"><input type="text" placeholder="10.20.30.41" /></Field>
              <Field label="Port"><input type="text" defaultValue="5432" /></Field>
              <Field label="Database name"><input type="text" defaultValue="nexplan" /></Field>
              <Field label="Username"><input type="text" defaultValue="nexplan" /></Field>
              <Field label="Password"><input type="password" placeholder="••••••••" /></Field>
              <Field label="Connection pool size"><input type="text" defaultValue="10" /></Field>
            </div>
            <Toggle on={true} onToggle={() => {}} label="Require SSL for database connection (recommended)" />
            <div className="info-box" style={{ marginTop: 10 }}>💡 <strong>Migrations run automatically</strong> on first start. NexPlan creates the <code>nexplan</code> schema. No manual SQL required.</div>
            <div className="footer">
              <div style={{ display: "flex", gap: 8 }}><button className="btn-back" onClick={() => setWstep(0)}>← Back</button><TestBtn id="db" lbl="DB Connection" /></div>
              <button className="btn-next" onClick={() => setWstep(2)}>Next: Email →</button>
            </div>
          </div>
        )}

        {/* Step 3: Email */}
        {wstep === 2 && (
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 3 }}>📧 Email / SMTP configuration</div>
            <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 18 }}>Configure your internal SMTP. All email stays inside your network.</div>
            <div className="grid2">
              <Field label="SMTP host" note="Your internal mail server"><input type="text" placeholder="smtp.citibank.net" /></Field>
              <Field label="SMTP port"><input type="text" defaultValue="587" /></Field>
              <Field label="SMTP username"><input type="text" placeholder="nexplan-svc@citibank.net" /></Field>
              <Field label="SMTP password"><input type="password" placeholder="••••••••" /></Field>
              <Field label="From email address"><input type="text" placeholder="nexplan@citibank.net" /></Field>
              <Field label="From display name"><input type="text" defaultValue="NexPlan" /></Field>
            </div>
            <Toggle on={true} onToggle={() => {}} label="Enable STARTTLS encryption" />
            <div className="footer">
              <div style={{ display: "flex", gap: 8 }}><button className="btn-back" onClick={() => setWstep(1)}>← Back</button><TestBtn id="email" lbl="Test Email" /></div>
              <button className="btn-next" onClick={() => setWstep(3)}>Next: SSO →</button>
            </div>
          </div>
        )}

        {/* Step 4: SSO */}
        {wstep === 3 && (
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 3 }}>🔐 Identity & SSO configuration</div>
            <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 16 }}>Choose how users log in. Connect to your existing identity provider.</div>
            <div className="sso-grid">
              {[
                { id: "none",     lbl: "Email & password only",       icon: "📧" },
                { id: "azure_ad", lbl: "Azure AD / Entra ID",         icon: "🔵" },
                { id: "saml",     lbl: "SAML 2.0 (Okta, ADFS, Ping)", icon: "🔐" },
                { id: "ldap",     lbl: "LDAP / Active Directory",     icon: "📁" },
                { id: "okta",     lbl: "Okta",                        icon: "🟣" },
              ].map(o => (
                <div key={o.id} className={`sso-opt ${sso === o.id ? "sel" : ""}`} onClick={() => setSso(o.id)}>
                  <span style={{ fontSize: 16 }}>{o.icon}</span>{o.lbl}
                </div>
              ))}
            </div>
            {sso === "azure_ad" && (
              <div className="grid2">
                <Field label="Client ID"><input type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></Field>
                <Field label="Tenant ID"><input type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></Field>
                <Field label="Client secret"><input type="password" placeholder="••••••••" /></Field>
              </div>
            )}
            {sso === "saml" && (
              <div className="grid2">
                <Field label="SAML entry point"><input type="text" placeholder="https://sso.citibank.net/saml/sso" /></Field>
                <Field label="Issuer / SP entity ID"><input type="text" placeholder="nexplan.citibank.net" /></Field>
                <Field label="IdP certificate (base64)" note="From your IdP metadata XML"><textarea placeholder="MIICpDCCAYwCCQD…" /></Field>
              </div>
            )}
            {sso === "ldap" && (
              <div className="grid2">
                <Field label="LDAP URL"><input type="text" placeholder="ldap://dc01.citibank.net:389" /></Field>
                <Field label="Base DN"><input type="text" placeholder="ou=IT,dc=citibank,dc=net" /></Field>
                <Field label="Service account DN"><input type="text" placeholder="cn=nexplan-svc,ou=ServiceAccounts,…" /></Field>
                <Field label="Service account password"><input type="password" /></Field>
                <Field label="User filter"><input type="text" defaultValue="(sAMAccountName={{username}})" /></Field>
              </div>
            )}
            {sso === "okta" && (
              <div className="grid2">
                <Field label="Okta domain"><input type="text" placeholder="citibank.okta.com" /></Field>
                <Field label="Client ID"><input type="text" /></Field>
                <Field label="Client secret"><input type="password" /></Field>
              </div>
            )}
            <div className="footer">
              <div style={{ display: "flex", gap: 8 }}><button className="btn-back" onClick={() => setWstep(2)}>← Back</button>{sso !== "none" && <TestBtn id="sso" lbl="SSO Connection" />}</div>
              <button className="btn-next" onClick={() => setWstep(4)}>Next: AI / LLM →</button>
            </div>
          </div>
        )}

        {/* Step 5: LLM */}
        {wstep === 4 && (
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 3 }}>🤖 AI / LLM configuration</div>
            <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 12 }}>NexPlan's AI features require an LLM. For air-gap environments, use Ollama — free and runs entirely inside your network.</div>
            {airGap && <div className="info-box" style={{ marginBottom: 14 }}>🔒 Air-gap mode is enabled. Cloud providers unavailable. <strong>Ollama (local LLM)</strong> recommended.</div>}
            <div className="prov-list">
              {[
                { id: "anthropic_cloud",  lbl: "Anthropic Cloud (Claude)",  badge: "Recommended · Internet required",    bc: "#E1F5EE", bt: "#085041" },
                { id: "ollama",           lbl: "Ollama (Local LLM)",        badge: "Best for air-gap · No internet",      bc: "#E6F1FB", bt: "#0C447C" },
                { id: "openai_compatible",lbl: "OpenAI-compatible endpoint",badge: "vLLM, LM Studio, LiteLLM…",           bc: "#FAEEDA", bt: "#633806" },
                { id: "azure_openai",     lbl: "Azure OpenAI",              badge: "Microsoft cloud · Enterprise SLA",    bc: "#E6F1FB", bt: "#0C447C" },
                { id: "disabled",         lbl: "Disable AI features",       badge: "No AI — project management only",     bc: "#F1EFE8", bt: "#5F5E5A" },
              ].filter(p => !airGap || ["ollama","openai_compatible","disabled"].includes(p.id))
               .map(p => (
                <div key={p.id} className={`prov ${llm === p.id ? "sel" : ""}`} onClick={() => setLlm(p.id)}>
                  <span style={{ fontSize: 13, fontWeight: llm === p.id ? 600 : 400, color: llm === p.id ? "#085041" : "var(--txt)" }}>{p.lbl}</span>
                  <span style={{ fontSize: 10, background: p.bc, color: p.bt, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>{p.badge}</span>
                </div>
              ))}
            </div>
            {llm === "anthropic_cloud" && <Field label="Anthropic API key" note="Get from console.anthropic.com"><input type="password" placeholder="sk-ant-api03-…" /></Field>}
            {llm === "ollama" && (
              <>
                <div className="green-box">
                  <strong>Ollama setup (~10 min):</strong><br />
                  1. Install: <code style={{ background: "rgba(0,0,0,.08)", padding: "1px 5px", borderRadius: 3 }}>curl -fsSL https://ollama.ai/install.sh | sh</code><br />
                  2. Pull: <code style={{ background: "rgba(0,0,0,.08)", padding: "1px 5px", borderRadius: 3 }}>ollama pull llama3.2:8b</code><br />
                  3. Start: <code style={{ background: "rgba(0,0,0,.08)", padding: "1px 5px", borderRadius: 3 }}>OLLAMA_HOST=0.0.0.0 ollama serve</code>
                </div>
                <div className="grid2">
                  <Field label="Ollama URL" note="Inside your network"><input type="text" defaultValue="http://localhost:11434" /></Field>
                  <Field label="Model"><select><option>llama3.2:8b</option><option>llama3.1:8b</option><option>llama3.1:70b</option><option>mistral:7b</option><option>gemma2:9b</option></select></Field>
                </div>
              </>
            )}
            {llm === "openai_compatible" && (
              <div className="grid2">
                <Field label="API base URL" note="vLLM, LM Studio, LiteLLM, etc."><input type="text" placeholder="http://10.20.30.50:8000/v1" /></Field>
                <Field label="Model name"><input type="text" placeholder="llama3-8b" /></Field>
                <Field label="API key (if required)"><input type="password" placeholder="Leave blank if no auth" /></Field>
              </div>
            )}
            {llm === "azure_openai" && (
              <div className="grid2">
                <Field label="Azure OpenAI endpoint"><input type="text" placeholder="https://myinstance.openai.azure.com" /></Field>
                <Field label="Deployment name"><input type="text" placeholder="gpt-4o" /></Field>
                <Field label="API key"><input type="password" /></Field>
              </div>
            )}
            {llm !== "disabled" && <Field label="Test prompt" note="To verify LLM is responding correctly"><textarea defaultValue="Summarise the key steps to migrate a server to cloud in 3 bullet points." /></Field>}
            <div className="footer">
              <div style={{ display: "flex", gap: 8 }}><button className="btn-back" onClick={() => setWstep(3)}>← Back</button>{llm !== "disabled" && <TestBtn id="llm" lbl="LLM Connection" />}</div>
              <button className="btn-next" onClick={() => setWstep(5)}>Review & Save →</button>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {wstep === 5 && (
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 3 }}>✅ Review configuration</div>
            <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 16 }}>Review all settings before saving. Changes take effect after restart.</div>
            {[
              { title: "🖥 Server",  rows: [["Air-gap", airGap ? "Enabled" : "Disabled"], ["White-label", whiteLabel ? "Enabled" : "Disabled"]] },
              { title: "🗄 Database",rows: [["Database", "nexplan"], ["SSL", "Required"]] },
              { title: "📧 Email",   rows: [["Port", "587"], ["TLS", "Enabled"]] },
              { title: "🔐 SSO",     rows: [["Provider", sso === "none" ? "Email & password" : sso.replace("_", " ").toUpperCase()]] },
              { title: "🤖 AI / LLM",rows: [["Provider", llm.replace("_", " ").toUpperCase()]] },
            ].map(s => (
              <div key={s.title} className="rev-sec">
                <div className="rev-hdr">{s.title}</div>
                {s.rows.map(([k, v]) => (
                  <div key={k} className="rev-row">
                    <span style={{ color: "var(--mut)" }}>{k}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="warn-box">⚠ Saving will restart NexPlan. Active sessions will be briefly interrupted (~30 seconds).</div>
            <div className="footer">
              <button className="btn-back" onClick={() => setWstep(4)}>← Back</button>
              <button className="btn-save" onClick={doSave} disabled={saving} style={{ background: saving ? "#888" : "#0F6E56" }}>
                {saving ? "⏳ Saving & restarting…" : "💾 Save Configuration"}
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     TAB 3 — ROI CALCULATOR
  ══════════════════════════════════════════════════════════════════════ */
  const ROITab = () => (
    <>
      <div className="grid2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="sec-lbl">organisation inputs</div>
          <div className="sl-row"><div className="sl-top"><span>NexPlan users</span><span className="sl-val">{users}</span></div><input type="range" min={10} max={500} step={10} value={users} onChange={e => setUsers(+e.target.value)} /></div>
          <div className="sl-row"><div className="sl-top"><span>PM FTE headcount</span><span className="sl-val">{ftes}</span></div><input type="range" min={1} max={100} step={1} value={ftes} onChange={e => setFtes(+e.target.value)} /></div>
          <div className="sl-row">
            <div className="sl-top"><span>Avg PM grade (L1–L6)</span><span className="sl-val">L{gradeI + 1}</span></div>
            <input type="range" min={0} max={5} step={1} value={gradeI} onChange={e => setGradeI(+e.target.value)} />
            <div style={{ fontSize: 10, color: "var(--mut)", marginTop: 2 }}>Avg CTC: {fmt(avgCTC)}</div>
          </div>
          <div className="sl-row"><div className="sl-top"><span>IT projects/year</span><span className="sl-val">{projPA}</span></div><input type="range" min={5} max={200} step={5} value={projPA} onChange={e => setProjPA(+e.target.value)} /></div>
          <div style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "var(--mut)", marginTop: 6, lineHeight: 1.6 }}>
            💡 AI enables each PM to handle <strong style={{ color: "#0F6E56" }}>3× more projects</strong>. {ftes} FTEs → {nexFTEs} needed.
          </div>
        </div>
        <div className="card">
          <div className="sec-lbl">cost comparison</div>
          {[
            { lbl: `Traditional (${ftes} PMs)`, val: tradCost, color: "#E24B4A" },
            { lbl: "NexPlan licence",            val: nexLic,   color: "#1D9E75" },
            { lbl: `Reduced PMs (${nexFTEs})`,   val: nexPM,    color: "#BA7517" },
            { lbl: "NexPlan total",              val: nexTotal, color: "#378ADD" },
          ].map(r => (
            <div key={r.lbl} className="bar-row">
              <div className="bar-lbl">{r.lbl}</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(4, Math.round((r.val / tradCost) * 100))}%`, background: r.color }} /></div>
              <div className="bar-val">{fmt(r.val)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="saving-box">
        <div style={{ fontFamily: "var(--mono)", fontSize: 38, fontWeight: 700, color: "#085041" }}>{fmt(saving$)}</div>
        <div style={{ fontSize: 12, color: "#0F6E56", marginTop: 4 }}>Annual cost saving with NexPlan</div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          {[
            { val: `${roi}%`, lbl: "ROI", color: "#085041" },
            { val: `${payback} mo`, lbl: "Payback period", color: "#0C447C" },
            { val: `${ftes - nexFTEs} FTE`, lbl: "Headcount saved", color: "#791F1F" },
            { val: fmt(saving$ * 3), lbl: "3-year saving", color: "#633806" },
          ].map(s => (
            <div key={s.lbl} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "var(--mut)" }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="sec-lbl">market comparison</div>
        <table className="tbl">
          <thead><tr><th>Tool</th><th>₹/user/yr</th><th>AI Insights</th><th>Infra PM</th><th>vs NexPlan ({users} users)</th></tr></thead>
          <tbody>
            {MARKET.map(t => (
              <tr key={t.name} className={t.name === "NexPlan" ? "nexrow" : ""}>
                <td style={{ fontWeight: t.name === "NexPlan" ? 700 : 400, color: t.name === "NexPlan" ? "#0F6E56" : "var(--txt)" }}>{t.name === "NexPlan" ? "⭐ " : ""}{t.name}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: t.name === "NexPlan" ? "#0F6E56" : "var(--txt)" }}>₹{t.price.toLocaleString("en-IN")}</td>
                <td><span className={t.ai ? "chk" : "crs"}>{t.ai ? "✓" : "✗"}</span></td>
                <td><span className={t.infra ? "chk" : "crs"}>{t.infra ? "✓" : "✗"}</span></td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: t.name === "NexPlan" ? "#085041" : "#A32D2D", fontWeight: 600 }}>
                  {t.name === "NexPlan" ? "baseline" : `+${fmt((t.price - 6000) * users)}/yr more`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ══════════════════════════════════════════════════════════════════════
     TAB 4 — CIO PITCH
  ══════════════════════════════════════════════════════════════════════ */
  const PitchTab = () => (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 14, color: "var(--mut)" }}>10-slide interactive CIO pitch deck · Click a slide to preview</div>
        <a href="/downloads/NexPlan-CIO-Pitch.pptx" download className="dl-btn">⬇ Download PPTX</a>
      </div>
      <div className="slide-nav">
        {SLIDES.map((s, i) => (
          <button key={s.id} className={`snav ${slide === s.id ? "active" : ""}`} onClick={() => setSlide(s.id)}>
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {slide === "overview" && (
        <div className="pitch-slide" style={{ background: "linear-gradient(135deg,#085041,#0F6E56 60%,#1D9E75)", color: "#fff" }}>
          <div style={{ fontSize: 13, color: "#9FE1CB", marginBottom: 8, fontFamily: "var(--mono)" }}>SLIDE 1 — TITLE</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>AI-Powered IT<br/>Project Management</div>
          <div style={{ fontSize: 17, color: "#9FE1CB", marginBottom: 28 }}>for Enterprise Infrastructure Teams</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {[{ v: "14×", l: "cheaper than ServiceNow" }, { v: "3×", l: "more projects per PM" }, { v: "40-65%", l: "PM labour cost reduction" }].map(s => (
              <div key={s.l} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 18px", textAlign: "center", minWidth: 130 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700, color: "#E1F5EE" }}>{s.v}</div>
                <div style={{ fontSize: 10, color: "#9FE1CB", marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, fontSize: 11, color: "#5DCAA5" }}>nexplan.io · CONFIDENTIAL — For authorised CIO / CTO presentation only</div>
        </div>
      )}
      {slide === "problem" && (
        <div className="pitch-slide">
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)", marginBottom: 4 }}>The Problem Every CIO Faces</div>
          <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 16 }}>Slide 2 — Three persistent and expensive problems</div>
          {[
            { t: "Grade inflation cost", b: "Projects assigned senior PMs (Band 7–9) even when complexity doesn't warrant it — because junior PMs lack domain knowledge to plan independently." },
            { t: "Knowledge bottleneck", b: "Complex infra projects (SD-WAN, DC migration, ERP) need scarce, expensive specialists. Hiring takes months. Projects stall." },
            { t: "Portfolio blindspot",  b: "CIOs have no real-time view of RAG status, budget vs EAC — without paying ₹85,000/user/yr for ServiceNow." },
          ].map(p => <div key={p.t} className="prob-card"><div style={{ fontWeight: 600, color: "var(--txt)", marginBottom: 5 }}>{p.t}</div><div style={{ fontSize: 12, color: "var(--mut)", lineHeight: 1.6 }}>{p.b}</div></div>)}
        </div>
      )}
      {slide === "solution" && (
        <div className="pitch-slide">
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)", marginBottom: 4 }}>How NexPlan Solves This</div>
          <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 16 }}>Slide 3 — Four core capabilities</div>
          <div className="grid2">
            {[
              { n: "01", t: "AI-Generated Project Plans",  b: "PM enters scope → NexPlan generates pre-requisite steps, tasks, and post-implementation tests. Any PM, any complexity." },
              { n: "02", t: "Auto-populated Kanban Board", b: "Tasks created by AI go straight to Kanban. PMs coordinate — not plan from scratch. 40% non-billable time saved." },
              { n: "03", t: "Grade Downlevelling",         b: "Band 5 PM delivers Band 7–8 outcomes with AI guidance. ₹8–13L saved per PM per year." },
              { n: "04", t: "CIO Governance Dashboard",    b: "Live RAG, health scores, budget vs EAC, milestones across all workspaces. Replaces ₹85K/user ServiceNow at ₹6K/user." },
            ].map(s => (
              <div key={s.n} className="sol-card">
                <div style={{ display: "flex", gap: 10, marginBottom: 7, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{s.n}</div>
                  <div style={{ fontWeight: 600, color: "var(--txt)", fontSize: 13, paddingTop: 4 }}>{s.t}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--mut)", lineHeight: 1.6 }}>{s.b}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {slide === "roi" && (
        <div className="pitch-slide">
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)", marginBottom: 4 }}>ROI — {users} users, {ftes} PMs</div>
          <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 16 }}>Slide 5 — Live from your ROI calculator inputs</div>
          <div className="saving-box">
            <div style={{ fontFamily: "var(--mono)", fontSize: 36, fontWeight: 700, color: "#085041" }}>{fmt(saving$)}</div>
            <div style={{ fontSize: 12, color: "#0F6E56", marginTop: 4 }}>Annual cost saving · ROI: {roi}% · Payback: {payback} months</div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", fontSize: 13, color: "var(--mut)" }}>
            <div>Traditional cost: <strong style={{ color: "#E24B4A" }}>{fmt(tradCost)}/yr</strong></div>
            <div>NexPlan total: <strong style={{ color: "#0F6E56" }}>{fmt(nexTotal)}/yr</strong></div>
          </div>
        </div>
      )}
      {slide === "market" && (
        <div className="pitch-slide">
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)", marginBottom: 4 }}>NexPlan vs Market</div>
          <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 16 }}>Slide 6 — Feature & cost comparison</div>
          <table className="tbl">
            <thead><tr><th>Tool</th><th>₹/user/yr</th><th>AI</th><th>Infra PM</th></tr></thead>
            <tbody>
              {MARKET.map(t => <tr key={t.name} className={t.name === "NexPlan" ? "nexrow" : ""}><td style={{ color: t.name === "NexPlan" ? "#0F6E56" : "var(--txt)", fontWeight: t.name === "NexPlan" ? 700 : 400 }}>{t.name}</td><td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>₹{t.price.toLocaleString("en-IN")}</td><td><span className={t.ai ? "chk" : "crs"}>{t.ai ? "✓" : "✗"}</span></td><td><span className={t.infra ? "chk" : "crs"}>{t.infra ? "✓" : "✗"}</span></td></tr>)}
            </tbody>
          </table>
        </div>
      )}
      {slide === "aicost" && (
        <div className="pitch-slide">
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)", marginBottom: 4 }}>AI Cost — What NexPlan Pays Anthropic</div>
          <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 16 }}>Slide 8 — All 9 endpoints · ₹{totalAI.toFixed(1)} worst case · ~₹5 optimised · 97% gross margin</div>
          <table className="tbl">
            <thead><tr><th>AI Feature</th><th>Model</th><th>Cost/user/mo</th></tr></thead>
            <tbody>
              {AI_ENDPOINTS.map(e => <tr key={e.name}><td>{e.name}</td><td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{e.model}</td><td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>₹{e.cost}</td></tr>)}
              <tr className="totrow"><td colSpan={2}><strong>TOTAL worst case</strong></td><td style={{ fontFamily: "var(--mono)" }}><strong>₹{totalAI.toFixed(1)}</strong></td></tr>
            </tbody>
          </table>
        </div>
      )}
      {(slide === "grades" || slide === "deploy" || slide === "pricing" || slide === "close") && (
        <div className="pitch-slide" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ fontSize: 36 }}>📊</div>
          <div style={{ fontWeight: 600, color: "var(--txt)", fontSize: 15 }}>Slide: {SLIDES.find(s => s.id === slide)?.label}</div>
          <div style={{ fontSize: 13, color: "var(--mut)", textAlign: "center", maxWidth: 400, lineHeight: 1.6 }}>Full slide content is in the downloadable PPTX. Download it to present to a CIO or CTO.</div>
          <a href="/downloads/NexPlan-CIO-Pitch.pptx" download className="dl-btn" style={{ marginTop: 8 }}>⬇ Download Full PPTX</a>
        </div>
      )}
    </>
  );

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{S}</style>
      <div className="shell">
        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="logo">NP</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#E1F5EE" }}>NexPlan Admin Panel</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#9FE1CB" }}>info@nexplan.io · Restricted access</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, background: "#FCEBEB", color: "#791F1F", padding: "3px 9px", borderRadius: 5, fontFamily: "var(--mono)", fontWeight: 700 }}>ADMIN ONLY</span>
            <a href="/dashboard" style={{ fontSize: 11, color: "#9FE1CB", textDecoration: "none" }}>← Dashboard</a>
          </div>
        </div>

        <div className="main">
          {/* Tab bar */}
          <div className="tab-bar">
            {[
              { id: "overview" as AdminTab, icon: "⚡", label: "Overview" },
              { id: "setup"    as AdminTab, icon: "🖥", label: "DC Setup Wizard" },
              { id: "roi"      as AdminTab, icon: "💰", label: "ROI Calculator" },
              { id: "pitch"    as AdminTab, icon: "📊", label: "CIO Pitch Deck" },
              { id: "audit"    as AdminTab, icon: "📋", label: "Audit Log" },
            ].map(t => (
              <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-lbl">{t.label}</span>
              </button>
            ))}
          </div>

          {tab === "overview" && <OverviewTab />}
          {tab === "setup"    && <SetupTab />}
          {tab === "roi"      && <ROITab />}
          {tab === "pitch"    && <PitchTab />}
          {tab === "audit"    && (
            <div className="card">
              {auditLog ?? (
                <div style={{ textAlign: "center", padding: 32, color: "var(--mut)", fontSize: 13 }}>
                  Audit log not available.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
