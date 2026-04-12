"use client";

/**
 * src/app/pitch/PitchClient.tsx
 *
 * CIO Pitch page — serves the NexPlan-CIO-Pitch.pptx for download
 * + renders all slide content inline as a visual deck preview.
 * Restricted to info@nexplan.io via page.tsx server check.
 */

import { useState } from "react";

// ── AI Cost data (9 endpoints, April 2026) ─────────────────────────────────
const AI_ENDPOINTS = [
  { name: "AI Project Manager (scope → plan)", model: "Sonnet 4.6", tokens: "3,500", calls: 4, cost: 14.8 },
  { name: "Generate Insights",                model: "Sonnet 4.6", tokens: "2,300", calls: 6, cost: 14.4 },
  { name: "Status Report generation",         model: "Haiku 4.5",  tokens: "1,800", calls: 4, cost: 0.8  },
  { name: "Risk mitigation suggestions",      model: "Haiku 4.5",  tokens: "1,200", calls: 3, cost: 0.4  },
  { name: "AI text generation",               model: "Haiku 4.5",  tokens: "700",   calls: 5, cost: 0.3  },
  { name: "AI follow-up suggestions",         model: "Haiku 4.5",  tokens: "500",   calls: 4, cost: 0.2  },
  { name: "Network diagram generation",       model: "Sonnet 4.6", tokens: "1,400", calls: 2, cost: 3.1  },
  { name: "PCR generation",                   model: "Haiku 4.5",  tokens: "1,200", calls: 2, cost: 0.3  },
  { name: "Infra impact analysis",            model: "Sonnet 4.6", tokens: "1,700", calls: 2, cost: 3.5  },
];

const MARKET = [
  { name: "Microsoft Project",  price: 30000, ai: false, infra: false, kanban: true,  auto: false, dash: false },
  { name: "Jira + Confluence",  price: 18000, ai: false, infra: false, kanban: true,  auto: false, dash: false },
  { name: "ServiceNow PPM",     price: 85000, ai: false, infra: true,  kanban: false, auto: false, dash: true  },
  { name: "Monday.com",         price: 24000, ai: false, infra: false, kanban: true,  auto: false, dash: false },
  { name: "NexPlan",            price: 6000,  ai: true,  infra: true,  kanban: true,  auto: true,  dash: true  },
];

const TIERS = [
  { name: "Starter",    users: "≤25",    price: "₹1,00,000/yr", perUser: "₹4,000",  ai: "5M tokens/mo",  margin: "95.5%", color: "#0C447C", bg: "#E6F1FB" },
  { name: "Business",   users: "≤100",   price: "₹3,50,000/yr", perUser: "₹3,500",  ai: "20M tokens/mo", margin: "94.9%", color: "#0F6E56", bg: "#E1F5EE", highlight: true },
  { name: "Enterprise", users: "Unlimited", price: "₹8,00,000+/yr", perUser: "Custom", ai: "50M tokens/mo", margin: "86.3%", color: "#085041", bg: "#F0FAF6" },
  { name: "Data Center",users: "Any",    price: "₹5,00,000+/yr", perUser: "Custom",  ai: "Own key/Ollama", margin: "~100%", color: "#633806", bg: "#FAEEDA" },
];

const SOLUTIONS = [
  { num: "01", title: "AI-Generated Project Plans",  body: "PM enters scope in plain English. NexPlan generates pre-requisite steps, tasks, and post-implementation tests. Any PM, any complexity." },
  { num: "02", title: "Auto-populated Kanban Board", body: "Tasks created by AI go straight to Kanban. PMs coordinate — not plan from scratch. 40% non-billable time saved." },
  { num: "03", title: "Grade Downlevelling",         body: "Band 5 PM delivers Band 7–8 outcomes with AI guidance. ₹8–13L saved per PM per year." },
  { num: "04", title: "CIO Governance Dashboard",    body: "Live RAG, health scores, budget vs EAC, milestones — across all workspaces. Replaces ₹85K/user ServiceNow at ₹6K/user." },
];

const DEPLOY = [
  { name: "SaaS (Managed)",    sub: "nexplan.io · Recommended", color: "#0F6E56", items: ["Go-live in 2–4 weeks", "₹6,000/user/year all-inclusive", "AI powered by Claude (bundled)", "SOC 2 · ISO 27001 · 99.95% SLA"] },
  { name: "Data Center",        sub: "Your servers · Air-gap",   color: "#0C447C", items: ["Docker / Kubernetes deploy", "LDAP / SAML / Azure AD SSO", "Air-gap mode — no internet needed", "FISC · PCI-DSS · data sovereignty"] },
  { name: "Local LLM (Ollama)", sub: "Zero API cost",            color: "#633806", items: ["Ollama on your GPU server", "No Anthropic API needed", "llama3, mistral, qwen2 supported", "Runs 100% inside your network"] },
];

const fmt = (n: number) => {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN");
};

type Slide = "overview" | "problem" | "solution" | "grades" | "roi" | "market" | "deploy" | "aicost" | "pricing" | "close";
const SLIDES: { id: Slide; label: string }[] = [
  { id: "overview", label: "Title" },
  { id: "problem",  label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "grades",   label: "PM Grades" },
  { id: "roi",      label: "ROI" },
  { id: "market",   label: "Market" },
  { id: "deploy",   label: "Deploy" },
  { id: "aicost",   label: "AI Cost" },
  { id: "pricing",  label: "Pricing" },
  { id: "close",    label: "Close" },
];

export default function PitchClient() {
  const [slide, setSlide] = useState<Slide>("overview");
  const [users, setUsers] = useState(50);
  const [pmCount, setPmCount] = useState(10);

  const nexplanCost = users * 6000;
  const tradCost = pmCount * 1700000; // avg band 7 CTC
  const nexplanPMs = Math.max(1, Math.ceil(pmCount / 3));
  const nexplanPMCost = nexplanPMs * 1700000;
  const totalNexplan = nexplanCost + nexplanPMCost;
  const saving = tradCost - totalNexplan;
  const roiPct = Math.round((saving / tradCost) * 100);
  const payback = saving > 0 ? Math.round(nexplanCost / (saving / 12)) : 0;

  const totalAICost = AI_ENDPOINTS.reduce((a, e) => a + e.cost, 0);

  return (
    <>
      <style>{`
        :root{--bg:#F4F3EF;--sur:#fff;--bdr:rgba(0,0,0,0.09);--txt:#1A1A18;--mut:#73726C;--acc:#0F6E56;--dk:#085041;--mono:'DM Mono','Fira Mono',monospace;--sans:'DM Sans',system-ui,sans-serif;}
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:var(--sans);background:var(--bg);}
        .topbar{background:#085041;padding:10px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20;}
        .logo{width:28px;height:28px;border-radius:7px;background:#1D9E75;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;font-weight:700;color:#E1F5EE;}
        .main{max-width:1100px;margin:0 auto;padding:24px;}
        .hero-bar{background:linear-gradient(135deg,#085041,#0F6E56 60%,#1D9E75);border-radius:16px;padding:28px 32px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
        .slide-nav{display:flex;gap:4px;margin-bottom:20px;background:var(--sur);padding:5px;border-radius:12px;border:0.5px solid var(--bdr);flex-wrap:wrap;}
        .snav{padding:7px 13px;border-radius:8px;border:none;background:transparent;cursor:pointer;font-size:11px;font-weight:500;color:var(--mut);transition:all 0.12s;white-space:nowrap;}
        .snav.active{background:#0F6E56;color:#fff;}
        .slide{background:var(--sur);border:0.5px solid var(--bdr);border-radius:14px;padding:24px;min-height:420px;}
        .slide-title{font-size:20px;font-weight:700;color:var(--txt);margin-bottom:4px;}
        .slide-sub{font-size:13px;color:var(--mut);margin-bottom:20px;}
        .card{background:var(--bg);border:0.5px solid var(--bdr);border-radius:10px;padding:14px 16px;}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
        .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
        .kpi{background:var(--sur);border:0.5px solid var(--bdr);border-radius:10px;padding:12px 14px;}
        .kpi-lbl{font-size:10px;color:var(--mut);margin-bottom:4px;}
        .kpi-val{font-family:var(--mono);font-size:18px;font-weight:700;}
        .prob-card{background:var(--sur);border:0.5px solid #FECACA;border-radius:10px;padding:14px;border-left:3px solid #E24B4A;}
        .sol-card{background:var(--sur);border:0.5px solid #D4EDE4;border-radius:10px;padding:14px;}
        .sol-num{width:28px;height:28px;border-radius:6px;background:#0F6E56;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;font-weight:700;color:#fff;flex-shrink:0;}
        .saving-box{background:#E1F5EE;border:1.5px solid #1D9E75;border-radius:14px;padding:24px;text-align:center;margin-bottom:16px;}
        .saving-num{font-family:var(--mono);font-size:40px;font-weight:700;color:#085041;}
        .tbl{width:100%;border-collapse:collapse;}
        .tbl th{text-align:left;font-size:10px;font-family:var(--mono);text-transform:uppercase;color:var(--mut);padding:7px 10px;border-bottom:0.5px solid var(--bdr);letter-spacing:.05em;}
        .tbl td{padding:8px 10px;font-size:12px;border-bottom:0.5px solid var(--bdr);vertical-align:middle;}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl tr.nexrow td{background:#E1F5EE;font-weight:600;}
        .tbl tr.totrow td{background:#E1F5EE;font-weight:700;}
        .chk{color:#1D9E75;font-size:14px;}
        .crs{color:#E24B4A;font-size:14px;}
        .tier{background:var(--sur);border:0.5px solid var(--bdr);border-radius:12px;padding:16px;}
        .tier.hl{border:2px solid #0F6E56;background:#F0FAF6;}
        .deploy-card{background:var(--sur);border:0.5px solid var(--bdr);border-radius:12px;padding:16px;}
        .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;font-family:var(--mono);}
        .dl-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:8px;border:none;background:#0F6E56;color:#fff;font-weight:600;cursor:pointer;font-size:14px;text-decoration:none;}
        .dl-btn:hover{background:#085041;}
        .sl-row{margin-bottom:12px;}
        .sl-top{display:flex;justify-content:space-between;font-size:12px;color:var(--txt);margin-bottom:4px;}
        .sl-val{font-family:var(--mono);font-weight:600;color:#0F6E56;}
        input[type=range]{width:100%;accent-color:#0F6E56;}
        .bar-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
        .bar-lbl{font-size:11px;color:var(--mut);width:170px;flex-shrink:0;}
        .bar-track{flex:1;height:6px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden;}
        .bar-fill{height:100%;border-radius:3px;}
        .bar-val{font-family:var(--mono);font-size:11px;color:var(--txt);width:60px;text-align:right;flex-shrink:0;}
        .note-box{background:#E6F1FB;border-radius:8px;padding:10px 12px;font-size:11px;color:#0C447C;margin-top:10px;line-height:1.6;}
        @media(max-width:700px){.grid2,.grid3,.grid4{grid-template-columns:1fr;}}
      `}</style>

      {/* Topbar */}
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="logo">NP</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#E1F5EE" }}>NexPlan — CIO Pitch Deck</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#9FE1CB" }}>Admin only · info@nexplan.io · CONFIDENTIAL</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, background: "#FCEBEB", color: "#791F1F", padding: "3px 10px", borderRadius: 5, fontFamily: "var(--mono)", fontWeight: 700 }}>CONFIDENTIAL</span>
          <a href="/downloads/NexPlan-CIO-Pitch.pptx" download className="dl-btn" style={{ fontSize: 12, padding: "7px 16px" }}>
            ⬇ Download PPTX
          </a>
        </div>
      </div>

      <div className="main">

        {/* Hero bar */}
        <div className="hero-bar">
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>CIO Pitch Deck — NexPlan</div>
            <div style={{ fontSize: 13, color: "#9FE1CB" }}>AI-Powered IT Project Management · 10 slides · April 2026</div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { val: "14×", lbl: "cheaper than ServiceNow" },
              { val: "247%", lbl: "ROI (50-user example)" },
              { val: "5 mo", lbl: "payback period" },
            ].map(s => (
              <div key={s.lbl} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700, color: "#E1F5EE" }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "#9FE1CB" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
          <a href="/downloads/NexPlan-CIO-Pitch.pptx" download className="dl-btn">⬇ Download Pitch PPTX</a>
        </div>

        {/* Slide navigator */}
        <div className="slide-nav">
          {SLIDES.map((s, i) => (
            <button key={s.id} className={`snav ${slide === s.id ? "active" : ""}`} onClick={() => setSlide(s.id)}>
              {i + 1}. {s.label}
            </button>
          ))}
        </div>

        {/* ── SLIDE 1: TITLE ── */}
        {slide === "overview" && (
          <div className="slide" style={{ background: "linear-gradient(135deg,#085041,#0F6E56 60%,#1D9E75)", color: "#fff" }}>
            <div style={{ fontSize: 13, color: "#9FE1CB", marginBottom: 8, fontFamily: "var(--mono)" }}>SLIDE 1 — TITLE</div>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>AI-Powered IT<br />Project Management</div>
            <div style={{ fontSize: 18, color: "#9FE1CB", marginBottom: 32 }}>for Enterprise Infrastructure Teams</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { val: "14×", lbl: "cheaper than ServiceNow" },
                { val: "3×", lbl: "more projects per PM" },
                { val: "40-65%", lbl: "PM labour cost reduction" },
              ].map(s => (
                <div key={s.lbl} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px 20px", textAlign: "center", minWidth: 140 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, color: "#E1F5EE" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#9FE1CB", marginTop: 4 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 32, fontSize: 11, color: "#5DCAA5" }}>nexplan.io · CONFIDENTIAL — For authorised CIO / CTO presentation only</div>
          </div>
        )}

        {/* ── SLIDE 2: PROBLEM ── */}
        {slide === "problem" && (
          <div className="slide">
            <div className="slide-title">The Problem Every CIO Faces</div>
            <div className="slide-sub">Slide 2 — Three persistent and expensive problems in IT delivery organisations</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { t: "Grade inflation cost", b: "Projects get assigned senior PMs (Band 7–9) even when execution complexity doesn't warrant it — because junior PMs lack domain knowledge to plan independently." },
                { t: "Knowledge bottleneck", b: "Complex infra projects (SD-WAN, DC migration, ERP) need scarce, expensive specialists. Hiring takes months. Projects stall." },
                { t: "Portfolio blindspot",  b: "CIOs have no real-time view of RAG status, budget vs EAC, task progress — without paying ₹85,000/user/yr for ServiceNow." },
              ].map(p => (
                <div key={p.t} className="prob-card">
                  <div style={{ fontWeight: 600, color: "var(--txt)", marginBottom: 6 }}>{p.t}</div>
                  <div style={{ fontSize: 13, color: "var(--mut)", lineHeight: 1.6 }}>{p.b}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SLIDE 3: SOLUTION ── */}
        {slide === "solution" && (
          <div className="slide">
            <div className="slide-title">How NexPlan Solves This</div>
            <div className="slide-sub">Slide 3 — Four core capabilities</div>
            <div className="grid2">
              {SOLUTIONS.map(s => (
                <div key={s.num} className="sol-card">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <div className="sol-num">{s.num}</div>
                    <div style={{ fontWeight: 600, color: "var(--txt)", fontSize: 14, paddingTop: 4 }}>{s.title}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mut)", lineHeight: 1.6 }}>{s.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SLIDE 4: PM GRADES ── */}
        {slide === "grades" && (
          <div className="slide">
            <div className="slide-title">PM Grade Economics — The NexPlan Advantage</div>
            <div className="slide-sub">Slide 4 — Any PM, any complexity. AI fills the knowledge gap.</div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Grade</th><th>Title</th><th>Avg CTC/yr</th><th>Projects managed</th><th>With NexPlan AI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["L1 (Band 5)", "Junior PM",    "₹7L",   "Small only",    "→ Handles L3 work"],
                  ["L2 (Band 6)", "PM",            "₹12L",  "Small–Medium",  "→ Handles L4 work"],
                  ["L3 (Band 7)", "Senior PM",     "₹18L",  "Medium",        "→ Handles L5 work"],
                  ["L4 (Band 8)", "Lead PM",       "₹27L",  "Medium–Large",  "→ Handles programme"],
                  ["L5 (Band 9)", "Principal PM",  "₹41L",  "Large",         "→ Strategic oversight"],
                  ["L6 (Band 11)","VP / Head PM",  "₹70L+", "Programme",     "→ Board-level only"],
                ].map(([g, t, c, p, n]) => (
                  <tr key={g}>
                    <td style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "#0F6E56" }}>{g}</td>
                    <td style={{ fontWeight: 500 }}>{t}</td>
                    <td style={{ fontFamily: "var(--mono)" }}>{c}</td>
                    <td style={{ color: "var(--mut)" }}>{p}</td>
                    <td style={{ color: "#0F6E56", fontWeight: 600 }}>{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 14, background: "#E1F5EE", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#085041", fontWeight: 600 }}>
              With NexPlan AI: a Band 5 PM delivers Band 7 outcomes → saves ₹11L per PM per year
            </div>
          </div>
        )}

        {/* ── SLIDE 5: ROI ── */}
        {slide === "roi" && (
          <div className="slide">
            <div className="slide-title">ROI Calculator</div>
            <div className="slide-sub">Slide 5 — Adjust for your organisation</div>

            <div className="grid2" style={{ marginBottom: 16 }}>
              <div className="card">
                <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", color: "var(--mut)", marginBottom: 12, letterSpacing: ".06em" }}>organisation inputs</div>
                <div className="sl-row">
                  <div className="sl-top"><span>NexPlan users</span><span className="sl-val">{users}</span></div>
                  <input type="range" min={10} max={500} step={10} value={users} onChange={e => setUsers(+e.target.value)} />
                </div>
                <div className="sl-row">
                  <div className="sl-top"><span>PM FTE headcount</span><span className="sl-val">{pmCount}</span></div>
                  <input type="range" min={1} max={50} step={1} value={pmCount} onChange={e => setPmCount(+e.target.value)} />
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", color: "var(--mut)", marginBottom: 12, letterSpacing: ".06em" }}>cost comparison</div>
                {[
                  { lbl: `Traditional (${pmCount} PMs @ Band 7 avg)`, val: tradCost,      color: "#E24B4A" },
                  { lbl: "NexPlan licence",                            val: nexplanCost,   color: "#1D9E75" },
                  { lbl: `Reduced PM team (${nexplanPMs} PMs)`,        val: nexplanPMCost, color: "#BA7517" },
                  { lbl: "NexPlan total",                              val: totalNexplan,  color: "#378ADD" },
                ].map(r => (
                  <div key={r.lbl} className="bar-row">
                    <div className="bar-lbl">{r.lbl}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.max(4, Math.round((r.val / tradCost) * 100))}%`, background: r.color }} />
                    </div>
                    <div className="bar-val">{fmt(r.val)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="saving-box">
              <div className="saving-num">{fmt(saving)}</div>
              <div style={{ fontSize: 13, color: "#0F6E56", marginTop: 4 }}>Annual cost saving with NexPlan</div>
              <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
                {[
                  { val: `${roiPct}%`, lbl: "ROI", color: "#085041" },
                  { val: `${payback} mo`, lbl: "Payback period", color: "#0C447C" },
                  { val: `${pmCount - nexplanPMs} FTE`, lbl: "Headcount optimised", color: "#791F1F" },
                  { val: fmt(saving * 3), lbl: "3-year saving", color: "#633806" },
                ].map(s => (
                  <div key={s.lbl} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "var(--mut)" }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SLIDE 6: MARKET ── */}
        {slide === "market" && (
          <div className="slide">
            <div className="slide-title">NexPlan vs Market</div>
            <div className="slide-sub">Slide 6 — Feature & cost comparison</div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tool</th><th>₹/user/yr</th><th>AI Insights</th><th>Infra PM</th><th>Kanban</th><th>Auto Tasks</th><th>CIO Dashboard</th><th>vs NexPlan ({users} users)</th>
                </tr>
              </thead>
              <tbody>
                {MARKET.map(t => (
                  <tr key={t.name} className={t.name === "NexPlan" ? "nexrow" : ""}>
                    <td style={{ fontWeight: t.name === "NexPlan" ? 700 : 400, color: t.name === "NexPlan" ? "#0F6E56" : "var(--txt)" }}>{t.name === "NexPlan" ? "⭐ " : ""}{t.name}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: t.name === "NexPlan" ? "#0F6E56" : "var(--txt)" }}>₹{t.price.toLocaleString("en-IN")}</td>
                    <td><span className={t.ai ? "chk" : "crs"}>{t.ai ? "✓" : "✗"}</span></td>
                    <td><span className={t.infra ? "chk" : "crs"}>{t.infra ? "✓" : "✗"}</span></td>
                    <td><span className={t.kanban ? "chk" : "crs"}>{t.kanban ? "✓" : "✗"}</span></td>
                    <td><span className={t.auto ? "chk" : "crs"}>{t.auto ? "✓" : "✗"}</span></td>
                    <td><span className={t.dash ? "chk" : "crs"}>{t.dash ? "✓" : "✗"}</span></td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: t.name === "NexPlan" ? "#085041" : "#A32D2D", fontWeight: 600 }}>
                      {t.name === "NexPlan" ? "baseline" : `+${fmt((t.price - 6000) * users)}/yr`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, fontSize: 11, color: "#A32D2D", fontWeight: 600, textAlign: "center" }}>
              NexPlan is 14× cheaper than ServiceNow · 3× cheaper than Jira · Purpose-built for IT infrastructure teams
            </div>
          </div>
        )}

        {/* ── SLIDE 7: DEPLOY ── */}
        {slide === "deploy" && (
          <div className="slide">
            <div className="slide-title">Deployment Options</div>
            <div className="slide-sub">Slide 7 — SaaS, Data Center, or Local LLM</div>
            <div className="grid3">
              {DEPLOY.map(d => (
                <div key={d.name} className="deploy-card">
                  <div style={{ height: 4, borderRadius: 2, background: d.color, marginBottom: 12 }} />
                  <div style={{ fontWeight: 700, color: "var(--txt)", marginBottom: 2 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 12 }}>{d.sub}</div>
                  {d.items.map(item => (
                    <div key={item} style={{ fontSize: 12, color: "var(--mut)", marginBottom: 5 }}>✓  {item}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SLIDE 8: AI COST ── */}
        {slide === "aicost" && (
          <div className="slide">
            <div className="slide-title">AI Cost — What NexPlan Pays Anthropic</div>
            <div className="slide-sub">Slide 8 — All 9 AI endpoints · Full token audit · April 2026</div>
            <table className="tbl">
              <thead>
                <tr><th>AI Feature</th><th>Model</th><th>Tokens/call</th><th>Calls/user/mo</th><th>Cost/user/mo</th></tr>
              </thead>
              <tbody>
                {AI_ENDPOINTS.map(e => (
                  <tr key={e.name}>
                    <td>{e.name}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{e.model}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11, textAlign: "center" }}>{e.tokens}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11, textAlign: "center" }}>{e.calls}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11, textAlign: "center" }}>₹{e.cost}</td>
                  </tr>
                ))}
                <tr className="totrow">
                  <td colSpan={4}>TOTAL (worst case, no caching)</td>
                  <td style={{ fontFamily: "var(--mono)" }}>₹{totalAICost.toFixed(1)}/mo</td>
                </tr>
              </tbody>
            </table>
            <div className="note-box">
              With prompt caching + Batch API: ~₹5/user/mo · ₹60/user/yr · vs ₹500 you charge · <strong>97% gross margin on AI</strong>
            </div>
          </div>
        )}

        {/* ── SLIDE 9: PRICING ── */}
        {slide === "pricing" && (
          <div className="slide">
            <div className="slide-title">Pricing Tiers</div>
            <div className="slide-sub">Slide 9 — 2× cheaper than Jira, all AI included</div>
            <div className="grid4">
              {TIERS.map(t => (
                <div key={t.name} className={`tier ${t.highlight ? "hl" : ""}`}>
                  <div style={{ height: 3, borderRadius: 2, background: t.color, marginBottom: 10 }} />
                  <div style={{ fontWeight: 700, color: "var(--txt)", marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: t.color, marginBottom: 2 }}>{t.price}</div>
                  <div style={{ fontSize: 10, color: "var(--mut)", marginBottom: 10 }}>{t.users} users</div>
                  {[
                    { lbl: "Per user/yr", val: t.perUser },
                    { lbl: "AI budget",   val: t.ai },
                    { lbl: "Gross margin",val: t.margin },
                  ].map(r => (
                    <div key={r.lbl} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                      <span style={{ color: "var(--mut)" }}>{r.lbl}</span>
                      <span style={{ fontFamily: "var(--mono)", fontWeight: 600, color: t.color }}>{r.val}</span>
                    </div>
                  ))}
                  {t.highlight && (
                    <div style={{ marginTop: 8, background: "#0F6E56", color: "#fff", borderRadius: 5, padding: "3px 0", textAlign: "center", fontSize: 10, fontWeight: 700 }}>MOST POPULAR</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: "#A32D2D", textAlign: "center", fontWeight: 600 }}>
              Jira charges ₹18,000/user/yr · No AI · No infra PM module · No CIO dashboard
            </div>
          </div>
        )}

        {/* ── SLIDE 10: CLOSE ── */}
        {slide === "close" && (
          <div className="slide" style={{ background: "linear-gradient(135deg,#085041,#0F6E56)", color: "#fff" }}>
            <div style={{ fontSize: 13, color: "#9FE1CB", marginBottom: 8, fontFamily: "var(--mono)" }}>SLIDE 10 — CLOSING PITCH</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#E1F5EE", marginBottom: 20 }}>The Pitch Close</div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, marginBottom: 20, fontSize: 15, lineHeight: 1.8, color: "#E1F5EE", fontStyle: "italic" }}>
              "NexPlan doesn't replace your Project Managers — it makes every PM perform at the level of someone two grades above them. You get Band 7 output at Band 5 cost.<br /><br />
              For an organisation running 30+ IT projects a year, that's not a software purchase — it's a structural cost reduction of {fmt(saving)} per year. At ₹6,000/user/year, the ROI pays back in {payback} months."
            </div>
            {["nexplan.io — live today, SaaS, go-live in 2 weeks",
              "Data Center option for banks, defence, FISC-regulated entities",
              "No per-project fees · One annual licence · Everything included",
              "Free trial available — contact info@nexplan.io"].map(b => (
              <div key={b} style={{ fontSize: 13, color: "#9FE1CB", marginBottom: 8 }}>→  {b}</div>
            ))}
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <a href="/downloads/NexPlan-CIO-Pitch.pptx" download className="dl-btn">⬇ Download Full Pitch PPTX</a>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
