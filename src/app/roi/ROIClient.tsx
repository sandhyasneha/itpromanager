"use client";

import { useState } from "react";

// ─── PM Grade/Level data — company agnostic ───────────────────────────────────
// Each company uses different terminology:
// IBM: Bands 5–11 | Accenture: Levels 9–13 | TCS: C0–C4 | Infosys: SA–VP
// Wipro: Grade 4–9 | Capgemini: G1–G5 | Generic: Junior–Director

const PM_GRADES = [
  { grade:"L1", title:"Junior PM / Associate PM",   ctcMin:500000,   ctcMax:900000,   complexity:"Small",         ibm:"Band 5",  accenture:"Level 9",  tcs:"C0–C1", typical:"Network config, device rollout, patch deployments" },
  { grade:"L2", title:"PM / Project Manager",        ctcMin:900000,   ctcMax:1500000,  complexity:"Small–Medium",  ibm:"Band 6",  accenture:"Level 10", tcs:"C1–C2", typical:"Server builds, VLAN setup, WAP installations" },
  { grade:"L3", title:"Senior PM",                   ctcMin:1500000,  ctcMax:2200000,  complexity:"Medium",        ibm:"Band 7",  accenture:"Level 11", tcs:"C2",    typical:"DC migration, ERP modules, cloud onboarding" },
  { grade:"L4", title:"Lead PM / Engagement Manager",ctcMin:2200000,  ctcMax:3200000,  complexity:"Medium–Large",  ibm:"Band 8",  accenture:"Level 11", tcs:"C3",    typical:"Multi-site rollouts, SD-WAN, security overhaul" },
  { grade:"L5", title:"Principal PM / PM Director",  ctcMin:3200000,  ctcMax:5000000,  complexity:"Large",         ibm:"Band 9–10",accenture:"Level 12", tcs:"C4",   typical:"Enterprise transformation, M&A integration" },
  { grade:"L6", title:"Programme Manager / VP PM",   ctcMin:5000000,  ctcMax:9000000,  complexity:"Programme",     ibm:"Band 11", accenture:"Level 13", tcs:"TL/VP", typical:"Portfolio governance, multi-year programmes" },
];

const ENGAGEMENT_MODELS = [
  { model:"FTE (Fixed Team)",        desc:"Organisation employs PMs on fixed annual CTC. Cost is headcount × CTC regardless of project volume." },
  { model:"T&M (Time & Material)",   desc:"PMs billed by the hour. NexPlan reduces non-billable planning time, increasing billable utilisation." },
  { model:"Managed Services",        desc:"Fixed price per project or per outcome. NexPlan reduces delivery cost, improving margin." },
  { model:"Staff Augmentation",      desc:"PMs supplied as contract resources. Lower grades deployable on complex projects with NexPlan." },
];

const MARKET_TOOLS = [
  { name:"Microsoft Project",  perUser:30000,  ai:false, infraPM:false, kanban:true,  autoTask:false, cioDash:false },
  { name:"Jira + Confluence",  perUser:18000,  ai:false, infraPM:false, kanban:true,  autoTask:false, cioDash:false },
  { name:"ServiceNow PPM",     perUser:85000,  ai:false, infraPM:true,  kanban:false, autoTask:false, cioDash:true  },
  { name:"Monday.com",         perUser:24000,  ai:false, infraPM:false, kanban:true,  autoTask:false, cioDash:false },
  { name:"Asana Business",     perUser:30000,  ai:false, infraPM:false, kanban:true,  autoTask:false, cioDash:false },
  { name:"NexPlan SaaS",       perUser:6000,   ai:true,  infraPM:true,  kanban:true,  autoTask:true,  cioDash:true  },
];

const COMPANY_LABELS: Record<string, string> = {
  generic:    "Generic (L1–L6)",
  ibm:        "IBM (Band 5–11)",
  accenture:  "Accenture (Level 9–13)",
  tcs:        "TCS (C0–C4)",
};

function fmt(n: number) {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr";
  if (n >= 100000)   return "₹" + (n / 100000).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN");
}
function fmtUSD(n: number) {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000)    return "$" + Math.round(n / 1000) + "K";
  return "$" + n;
}

export default function ROIClient() {
  const [users,      setUsers]      = useState(50);
  const [fteCount,   setFteCount]   = useState(10);
  const [gradeIdx,   setGradeIdx]   = useState(2);
  const [projectsPA, setProjectsPA] = useState(30);
  const [currency,   setCurrency]   = useState<"INR"|"USD">("INR");
  const [company,    setCompany]    = useState("generic");
  const [activeTab,  setActiveTab]  = useState<"calculator"|"grades"|"compare"|"pitch">("calculator");

  const grade   = PM_GRADES[gradeIdx];
  const avgCTC  = (grade.ctcMin + grade.ctcMax) / 2;
  const f = (n: number) => currency === "INR" ? fmt(n) : fmtUSD(n / 83);

  // Traditional cost
  const traditionalCost = avgCTC * fteCount;

  // NexPlan scenario — AI enables 1 PM to handle 3× projects
  const nexplanLicence   = users * 6000;
  const nexplanFTENeeded = Math.max(1, Math.ceil(fteCount / 3));
  const nexplanFTECost   = avgCTC * nexplanFTENeeded;
  const nexplanTotal     = nexplanLicence + nexplanFTECost;
  const saving           = traditionalCost - nexplanTotal;
  const roiPct           = Math.round((saving / traditionalCost) * 100);
  const paybackMonths    = saving > 0 ? Math.round(nexplanLicence / (saving / 12)) : 0;

  // Grade label by company
  const gradeLabel = (g: typeof PM_GRADES[0]) => {
    if (company === "ibm")       return g.ibm;
    if (company === "accenture") return g.accenture;
    if (company === "tcs")       return g.tcs;
    return g.grade;
  };

  return (
    <>
      <style>{`
        :root{--bg:#F4F3EF;--sur:#FFFFFF;--bdr:rgba(0,0,0,0.09);--txt:#1A1A18;--mut:#73726C;--acc:#0F6E56;--mono:'DM Mono','Fira Mono',monospace;--sans:'DM Sans',system-ui,sans-serif;}
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:var(--sans);background:var(--bg);}
        .shell{min-height:100vh;}
        .topbar{background:var(--sur);border-bottom:0.5px solid var(--bdr);padding:12px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;flex-wrap:wrap;gap:8px;}
        .logo{width:28px;height:28px;border-radius:7px;background:#0F6E56;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;font-weight:700;color:#E1F5EE;flex-shrink:0;}
        .main{max-width:1100px;margin:0 auto;padding:28px 24px;}
        .hero{background:linear-gradient(135deg,#085041 0%,#0F6E56 60%,#1D9E75 100%);border-radius:20px;padding:36px;margin-bottom:28px;color:#fff;position:relative;overflow:hidden;}
        .hero::after{content:'NexPlan';position:absolute;right:-20px;bottom:-30px;font-size:120px;font-weight:900;opacity:0.06;font-family:var(--mono);pointer-events:none;}
        .hero h1{font-size:26px;font-weight:700;margin-bottom:8px;}
        .hero p{font-size:14px;opacity:0.88;max-width:620px;line-height:1.7;}
        .tabs{display:flex;gap:6px;margin-bottom:24px;background:var(--sur);padding:5px;border-radius:12px;border:0.5px solid var(--bdr);flex-wrap:wrap;}
        .tab{padding:8px 16px;border-radius:8px;border:none;background:transparent;cursor:pointer;font-size:13px;font-weight:500;color:var(--mut);transition:all 0.15s;white-space:nowrap;}
        .tab.active{background:#0F6E56;color:#fff;}
        .controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
        .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px;}
        .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
        .card{background:var(--sur);border:0.5px solid var(--bdr);border-radius:14px;padding:20px;}
        .kpi{background:var(--sur);border:0.5px solid var(--bdr);border-radius:12px;padding:14px 16px;}
        .kpi-lbl{font-size:11px;color:var(--mut);margin-bottom:5px;}
        .kpi-val{font-family:var(--mono);font-size:20px;font-weight:700;line-height:1.2;}
        .kpi-sub{font-size:11px;color:var(--mut);margin-top:3px;}
        .sec-lbl{font-family:var(--mono);font-size:10px;letter-spacing:.08em;color:var(--mut);text-transform:uppercase;margin-bottom:12px;}
        .sl-row{margin-bottom:14px;}
        .sl-top{display:flex;justify-content:space-between;font-size:13px;color:var(--txt);margin-bottom:5px;}
        .sl-val{font-family:var(--mono);font-weight:600;color:#0F6E56;}
        input[type=range]{width:100%;accent-color:#0F6E56;height:4px;}
        .saving-card{background:#E1F5EE;border:1.5px solid #1D9E75;border-radius:16px;padding:28px;text-align:center;margin-bottom:20px;}
        .saving-num{font-family:var(--mono);font-size:44px;font-weight:700;color:#085041;line-height:1;}
        .saving-sub{font-size:13px;color:#0F6E56;margin-top:6px;}
        .saving-row{display:flex;gap:24px;justify-content:center;margin-top:20px;flex-wrap:wrap;}
        .saving-stat{text-align:center;}
        .saving-stat-val{font-family:var(--mono);font-size:20px;font-weight:700;}
        .saving-stat-lbl{font-size:11px;color:var(--mut);margin-top:2px;}
        .bar-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
        .bar-lbl{font-size:12px;color:var(--mut);width:180px;flex-shrink:0;}
        .bar-track{flex:1;height:7px;background:rgba(0,0,0,0.06);border-radius:4px;overflow:hidden;}
        .bar-fill{height:100%;border-radius:4px;}
        .bar-val{font-family:var(--mono);font-size:12px;color:var(--txt);width:70px;text-align:right;flex-shrink:0;}
        .grade-tbl{width:100%;border-collapse:collapse;}
        .grade-tbl th{text-align:left;font-size:10px;font-family:var(--mono);text-transform:uppercase;color:var(--mut);padding:8px 12px;border-bottom:0.5px solid var(--bdr);letter-spacing:.05em;}
        .grade-tbl td{padding:10px 12px;font-size:13px;border-bottom:0.5px solid var(--bdr);vertical-align:middle;}
        .grade-tbl tr:last-child td{border-bottom:none;}
        .grade-tbl tr.selected td{background:#E1F5EE;}
        .tool-tbl{width:100%;border-collapse:collapse;}
        .tool-tbl th{text-align:left;font-size:10px;font-family:var(--mono);text-transform:uppercase;color:var(--mut);padding:8px 12px;border-bottom:0.5px solid var(--bdr);letter-spacing:.05em;}
        .tool-tbl td{padding:10px 12px;font-size:13px;border-bottom:0.5px solid var(--bdr);vertical-align:middle;}
        .tool-tbl tr:last-child td{border-bottom:none;}
        .tool-tbl tr.nexplan td{background:#E1F5EE;font-weight:600;}
        .check{color:#1D9E75;font-size:15px;}
        .cross{color:#E24B4A;font-size:15px;}
        .badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:600;font-family:var(--mono);}
        .bg{background:#E1F5EE;color:#085041;}
        .bb{background:#E6F1FB;color:#0C447C;}
        .ba{background:#FAEEDA;color:#633806;}
        .pitch p{font-size:14px;color:var(--mut);line-height:1.75;margin-bottom:10px;}
        .pitch h2{font-size:17px;font-weight:600;color:var(--txt);margin:24px 0 8px;}
        .pitch ul{padding-left:20px;margin-bottom:10px;}
        .pitch li{font-size:14px;color:var(--mut);line-height:1.8;}
        .pitch strong{color:var(--txt);}
        .btn-group{display:flex;gap:6px;}
        .btn{padding:4px 12px;border-radius:6px;border:0.5px solid var(--bdr);background:var(--bg);color:var(--mut);cursor:pointer;font-size:11px;font-family:var(--mono);transition:all 0.15s;}
        .btn.active{background:#0F6E56;color:#fff;border-color:#0F6E56;}
        .note{background:var(--bg);border-radius:10px;padding:14px;font-size:12px;color:var(--mut);margin-top:14px;line-height:1.6;}
        @media(max-width:700px){.grid2,.grid3,.grid4{grid-template-columns:1fr;}.topbar{flex-direction:column;align-items:flex-start;}}
      `}</style>

      <div className="shell">
        {/* Topbar */}
        <div className="topbar">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="logo">NP</div>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:"var(--txt)"}}>NexPlan — ROI & Value Proposition</div>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--mut)"}}>Enterprise Sales Tool · Admin Only</div>
            </div>
          </div>
          <div className="controls">
            {/* Company terminology selector */}
            <div className="btn-group">
              {Object.entries(COMPANY_LABELS).map(([k,v]) => (
                <button key={k} className={`btn ${company===k?"active":""}`} onClick={()=>setCompany(k)}>{v}</button>
              ))}
            </div>
            {/* Currency */}
            <div className="btn-group">
              <button className={`btn ${currency==="INR"?"active":""}`} onClick={()=>setCurrency("INR")}>₹ INR</button>
              <button className={`btn ${currency==="USD"?"active":""}`} onClick={()=>setCurrency("USD")}>$ USD</button>
            </div>
            <span style={{fontSize:11,background:"#FCEBEB",color:"#791F1F",padding:"4px 10px",borderRadius:6,fontFamily:"var(--mono)"}}>ADMIN ONLY</span>
          </div>
        </div>

        <div className="main">

          {/* Hero */}
          <div className="hero">
            <h1>NexPlan Enterprise ROI Calculator</h1>
            <p>Built for CIO and CTO presentations. Quantify cost savings across FTE and T&M engagement models. Compare NexPlan against market alternatives. Works with any company's PM grading structure — IBM Bands, Accenture Levels, TCS grades, or your own.</p>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {[
              {id:"calculator", label:"💰 ROI Calculator"},
              {id:"grades",     label:"👔 PM Grades & FTE"},
              {id:"compare",    label:"📊 Market Comparison"},
              {id:"pitch",      label:"📋 Pitch Writeup"},
            ].map(t => (
              <button key={t.id} className={`tab ${activeTab===t.id?"active":""}`}
                onClick={()=>setActiveTab(t.id as any)}>{t.label}</button>
            ))}
          </div>

          {/* ══ TAB 1: ROI CALCULATOR ══ */}
          {activeTab==="calculator" && (<>
            <div className="grid2">
              <div className="card">
                <div className="sec-lbl">organisation inputs</div>

                <div className="sl-row">
                  <div className="sl-top"><span>Total NexPlan users</span><span className="sl-val">{users}</span></div>
                  <input type="range" min={10} max={500} step={10} value={users} onChange={e=>setUsers(+e.target.value)}/>
                  <div style={{fontSize:11,color:"var(--mut)",marginTop:3}}>Licence cost: {f(users*6000)}/yr at ₹6,000/user</div>
                </div>

                <div className="sl-row">
                  <div className="sl-top"><span>PM FTE headcount</span><span className="sl-val">{fteCount} FTEs</span></div>
                  <input type="range" min={1} max={100} step={1} value={fteCount} onChange={e=>setFteCount(+e.target.value)}/>
                  <div style={{fontSize:11,color:"var(--mut)",marginTop:3}}>
                    {COMPANY_LABELS[company]} · {grade.title}
                  </div>
                </div>

                <div className="sl-row">
                  <div className="sl-top">
                    <span>Average PM grade</span>
                    <span className="sl-val">{gradeLabel(grade)} — {grade.title}</span>
                  </div>
                  <input type="range" min={0} max={5} step={1} value={gradeIdx} onChange={e=>setGradeIdx(+e.target.value)}/>
                  <div style={{fontSize:11,color:"var(--mut)",marginTop:3}}>
                    Avg CTC: {f(grade.ctcMin)} – {f(grade.ctcMax)}
                  </div>
                </div>

                <div className="sl-row">
                  <div className="sl-top"><span>IT projects per year</span><span className="sl-val">{projectsPA}</span></div>
                  <input type="range" min={5} max={200} step={5} value={projectsPA} onChange={e=>setProjectsPA(+e.target.value)}/>
                  <div style={{fontSize:11,color:"var(--mut)",marginTop:3}}>
                    Cost per project (traditional): {f(Math.round(traditionalCost/projectsPA))}
                  </div>
                </div>

                <div className="note">
                  💡 <strong>NexPlan assumption:</strong> AI-assisted planning enables each PM to manage <strong style={{color:"#0F6E56"}}>3× more projects</strong>.
                  {fteCount} FTEs → {nexplanFTENeeded} FTEs needed with NexPlan.
                  Remaining {fteCount-nexplanFTENeeded} FTEs can be redeployed or cost-saved.
                </div>
              </div>

              <div className="card">
                <div className="sec-lbl">cost comparison</div>
                {[
                  {label:`Traditional PM FTE cost (${fteCount} PMs)`, val:traditionalCost,   color:"#E24B4A"},
                  {label:"NexPlan licence cost",                       val:nexplanLicence,    color:"#1D9E75"},
                  {label:`Reduced PM FTE cost (${nexplanFTENeeded} PMs)`, val:nexplanFTECost, color:"#BA7517"},
                  {label:"NexPlan total cost",                         val:nexplanTotal,      color:"#378ADD"},
                ].map(r => (
                  <div key={r.label} className="bar-row">
                    <div className="bar-lbl">{r.label}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{
                        width:`${Math.max(4,Math.round((r.val/traditionalCost)*100))}%`,
                        background:r.color
                      }}/>
                    </div>
                    <div className="bar-val">{f(r.val)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings hero */}
            <div className="saving-card">
              <div className="saving-num">{f(saving)}</div>
              <div className="saving-sub">Annual cost saving with NexPlan vs traditional PM structure</div>
              <div className="saving-row">
                {[
                  {val:`${roiPct}%`,                                         lbl:"ROI",                  color:"#085041"},
                  {val:`${paybackMonths} months`,                            lbl:"Payback period",       color:"#0C447C"},
                  {val:`${fteCount-nexplanFTENeeded} FTE`,                   lbl:"Headcount optimised",  color:"#791F1F"},
                  {val:f(saving*3),                                          lbl:"3-year saving",        color:"#633806"},
                ].map(s => (
                  <div key={s.lbl} className="saving-stat">
                    <div className="saving-stat-val" style={{color:s.color}}>{s.val}</div>
                    <div className="saving-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid4">
              {[
                {lbl:"vs Microsoft Project",  val:f((30000-6000)*users),  sub:`saving for ${users} users`, color:"#0F6E56"},
                {lbl:"vs Jira",               val:f((18000-6000)*users),  sub:`saving for ${users} users`, color:"#0F6E56"},
                {lbl:"vs ServiceNow PPM",     val:f((85000-6000)*users),  sub:`saving for ${users} users`, color:"#0F6E56"},
                {lbl:"Cost per project",      val:f(Math.round(nexplanTotal/projectsPA)), sub:"with NexPlan", color:"#0C447C"},
              ].map(k => (
                <div key={k.lbl} className="kpi">
                  <div className="kpi-lbl">{k.lbl}</div>
                  <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
                  <div className="kpi-sub">{k.sub}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* ══ TAB 2: PM GRADES ══ */}
          {activeTab==="grades" && (<>
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:12}}>
                <div>
                  <div className="sec-lbl">PM grade levels — universal reference</div>
                  <p style={{fontSize:13,color:"var(--mut)"}}>
                    Every company uses different terminology for PM grades. The selector above maps to your company's structure.
                    The key insight for CIOs: <strong style={{color:"var(--txt)"}}>NexPlan collapses the grade requirement</strong> — lower-grade PMs
                    can handle higher-complexity projects with AI assistance.
                  </p>
                </div>
              </div>

              {/* Terminology reference */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
                {[
                  {co:"IBM",        note:"Bands 5–11",       color:"#E6F1FB",tc:"#0C447C"},
                  {co:"Accenture",  note:"Levels 9–13",      color:"#E1F5EE",tc:"#085041"},
                  {co:"TCS/Infosys",note:"C0–C4 / SA–VP",    color:"#FAEEDA",tc:"#633806"},
                  {co:"Generic",    note:"L1–L6 / Jr–Director",color:"#F1EFE8",tc:"#444441"},
                ].map(c => (
                  <div key={c.co} style={{background:c.color,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:13,fontWeight:600,color:c.tc}}>{c.co}</div>
                    <div style={{fontSize:11,color:c.tc,opacity:0.8,marginTop:2}}>{c.note}</div>
                  </div>
                ))}
              </div>

              <table className="grade-tbl">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Title</th>
                    <th>Complexity</th>
                    <th>CTC Range ({currency})</th>
                    <th>Typical IT Projects</th>
                    <th>NexPlan Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {PM_GRADES.map((g, i) => (
                    <tr key={g.grade} className={i===gradeIdx?"selected":""}>
                      <td>
                        <div style={{fontFamily:"var(--mono)",fontWeight:700,color:"#0F6E56"}}>{gradeLabel(g)}</div>
                        <div style={{fontSize:10,color:"var(--mut)",marginTop:2}}>Generic: {g.grade}</div>
                      </td>
                      <td style={{fontWeight:500,color:"var(--txt)"}}>{g.title}</td>
                      <td><span className="badge bg">{g.complexity}</span></td>
                      <td style={{fontFamily:"var(--mono)",fontSize:12}}>
                        {currency==="INR"?fmt(g.ctcMin):fmtUSD(g.ctcMin/83)} –{" "}
                        {currency==="INR"?fmt(g.ctcMax):fmtUSD(g.ctcMax/83)}
                      </td>
                      <td style={{fontSize:12,color:"var(--mut)"}}>{g.typical}</td>
                      <td>
                        {i<=1 && <span className="badge bg">Handles L3–L4 work</span>}
                        {i===2 && <span className="badge bb">Handles L4–L5 work</span>}
                        {i>=3 && <span className="badge ba">Strategic oversight</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{marginTop:20,background:"#E1F5EE",borderRadius:12,padding:16}}>
                <div style={{fontSize:13,fontWeight:600,color:"#085041",marginBottom:6}}>
                  💡 Grade downlevelling saving — example for your selected grade ({gradeLabel(grade)})
                </div>
                <div style={{fontSize:13,color:"#0F6E56",lineHeight:1.7}}>
                  A {PM_GRADES[0].title} ({gradeLabel(PM_GRADES[0])} avg CTC: {f((PM_GRADES[0].ctcMin+PM_GRADES[0].ctcMax)/2)}) using NexPlan
                  can deliver work typically requiring a {grade.title} ({gradeLabel(grade)} avg CTC: {f(avgCTC)}).
                  <br/>
                  <strong>Saving per PM per year: {f(avgCTC - (PM_GRADES[0].ctcMin+PM_GRADES[0].ctcMax)/2)}</strong>
                  {" "}· For {fteCount} FTEs: <strong>{f((avgCTC - (PM_GRADES[0].ctcMin+PM_GRADES[0].ctcMax)/2)*fteCount)}/yr</strong>
                </div>
              </div>

              <div style={{marginTop:12,background:"var(--bg)",borderRadius:12,padding:16}}>
                <div className="sec-lbl">engagement model — how FTE count maps to cost</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {ENGAGEMENT_MODELS.map(m => (
                    <div key={m.model} style={{background:m.model.includes("T&M")?"#E1F5EE":"var(--sur)",border:"0.5px solid var(--bdr)",borderRadius:8,padding:12}}>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--txt)",marginBottom:4}}>{m.model}</div>
                      <div style={{fontSize:11,color:"var(--mut)",lineHeight:1.6}}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>)}

          {/* ══ TAB 3: MARKET COMPARISON ══ */}
          {activeTab==="compare" && (<>
            <div className="card">
              <div className="sec-lbl">NexPlan vs market — feature & cost per user/year</div>
              <table className="tool-tbl">
                <thead>
                  <tr>
                    <th style={{width:"22%"}}>Tool</th>
                    <th>Cost/user/yr</th>
                    <th>AI Insights</th>
                    <th>Infra PM</th>
                    <th>Kanban</th>
                    <th>Auto Tasks</th>
                    <th>CIO Dashboard</th>
                    <th>vs NexPlan ({users} users)</th>
                  </tr>
                </thead>
                <tbody>
                  {MARKET_TOOLS.map(t => (
                    <tr key={t.name} className={t.name.includes("NexPlan")?"nexplan":""}>
                      <td style={{color:t.name.includes("NexPlan")?"#0F6E56":"var(--txt)",fontWeight:t.name.includes("NexPlan")?700:400}}>
                        {t.name.includes("NexPlan")?"⭐ ":""}{t.name}
                      </td>
                      <td style={{fontFamily:"var(--mono)",fontSize:12,color:t.name.includes("NexPlan")?"#0F6E56":"var(--txt)"}}>
                        {currency==="INR"?fmt(t.perUser):fmtUSD(t.perUser/83)}
                      </td>
                      <td><span className={t.ai?"check":"cross"}>{t.ai?"✓":"✗"}</span></td>
                      <td><span className={t.infraPM?"check":"cross"}>{t.infraPM?"✓":"✗"}</span></td>
                      <td><span className={t.kanban?"check":"cross"}>{t.kanban?"✓":"✗"}</span></td>
                      <td><span className={t.autoTask?"check":"cross"}>{t.autoTask?"✓":"✗"}</span></td>
                      <td><span className={t.cioDash?"check":"cross"}>{t.cioDash?"✓":"✗"}</span></td>
                      <td style={{fontFamily:"var(--mono)",fontSize:12,color:t.name.includes("NexPlan")?"#085041":"#A32D2D",fontWeight:600}}>
                        {t.name.includes("NexPlan") ? "baseline" : `+${f((t.perUser-6000)*users)}/yr more`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{marginTop:20,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[
                  {title:"vs Jira (most common)",    saving:f((18000-6000)*users), note:"Same Kanban, no AI, no infra PM module, no CIO dashboard. NexPlan purpose-built for IT teams.", color:"#E1F5EE",tc:"#085041"},
                  {title:"vs ServiceNow PPM",         saving:f((85000-6000)*users), note:"ServiceNow requires 6–12 month implementation + professional services. NexPlan live in days.", color:"#E6F1FB",tc:"#0C447C"},
                  {title:"vs MS Project",             saving:f((30000-6000)*users), note:"No real-time collaboration, no AI, no portfolio governance dashboard. Desktop-era tool.", color:"#FAEEDA",tc:"#633806"},
                ].map(c => (
                  <div key={c.title} style={{background:c.color,borderRadius:12,padding:16}}>
                    <div style={{fontSize:13,fontWeight:600,color:c.tc,marginBottom:6}}>{c.title}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:18,fontWeight:700,color:c.tc,marginBottom:6}}>{c.saving} saved/yr</div>
                    <div style={{fontSize:12,color:c.tc,opacity:0.85,lineHeight:1.6}}>{c.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {/* ══ TAB 4: PITCH WRITEUP ══ */}
          {activeTab==="pitch" && (
            <div className="card pitch">
              <div className="sec-lbl">enterprise pitch — CIO / CTO presentation writeup</div>

              <h2>Executive Summary</h2>
              <p>NexPlan is a SaaS IT Project Management platform built specifically for Infrastructure, Network, Cloud, and Security delivery teams. It combines AI-assisted project planning, Kanban-based task management, and real-time CIO portfolio governance — in a single platform costing <strong>₹6,000/user/year</strong>, a fraction of enterprise alternatives.</p>
              <p>For an organisation with 20 IT Project Managers, NexPlan delivers <strong>40–65% reduction in PM labour costs</strong> and enables the same team to manage 3× more projects — without adding headcount.</p>

              <h2>The Problem Every CIO Faces</h2>
              <p>Organisations assign PMs to projects based on complexity, using grade/band structures (IBM Bands, Accenture Levels, TCS grades, etc.). This creates three persistent and expensive problems:</p>
              <ul>
                <li><strong>Knowledge bottleneck:</strong> Complex infrastructure projects (SD-WAN, DC migration, ERP rollout) need senior PMs with deep domain knowledge. These are scarce and expensive.</li>
                <li><strong>Grade inflation:</strong> Projects get assigned higher-grade PMs than necessary because lower-grade PMs lack the knowledge to plan them independently — even when the execution complexity is manageable.</li>
                <li><strong>Portfolio blindspot:</strong> CIOs have no real-time view of project health, budget vs EAC, and risk across the portfolio — without paying for ServiceNow or building custom dashboards.</li>
              </ul>

              <h2>How NexPlan Solves This</h2>
              <ul>
                <li><strong>AI-Generated Project Plans:</strong> Any PM enters the project scope — e.g., "Install 30 WAPs across 3 floors" — and NexPlan generates pre-requisite steps, implementation tasks, and post-implementation test cases automatically. No domain expertise required.</li>
                <li><strong>Auto-populated Kanban Board:</strong> Tasks created by AI are immediately available in Kanban. PMs assign, track, and update. Progress is visible in real time.</li>
                <li><strong>Any PM, Any Project:</strong> A junior PM (L1/L2) can manage a project normally requiring a Senior PM (L3/L4) with NexPlan's AI guidance. Grade downlevelling saves <strong>₹5L–₹12L per PM per year</strong>.</li>
                <li><strong>CIO Governance Dashboard:</strong> Live RAG status, health scores, task completion, budget utilisation, and overdue alerts — across all client workspaces — visible to CIOs at <strong>nexplan.io/governance</strong>.</li>
                <li><strong>T&M and FTE Model Support:</strong> Track actuals vs estimates, flag EAC variance, and generate stakeholder status reports automatically.</li>
              </ul>

              <h2>ROI for T&M Engagements</h2>
              <p>In T&M, every hour of PM time is billable. NexPlan reduces non-billable planning time (task creation, risk identification, status reporting) by an estimated <strong>40%</strong>, directly recovering billable hours.</p>
              <ul>
                <li>Average non-billable planning time per PM: ~8 hrs/week</li>
                <li>Recovered at billing rate ₹3,500–₹8,000/hr = <strong>₹14L–₹33L per PM per year recovered</strong></li>
                <li>NexPlan cost per PM: ₹6,000/yr</li>
                <li><strong>T&M ROI: 2,300% – 5,500% per PM</strong></li>
              </ul>

              <h2>ROI for FTE Engagements</h2>
              <p>In fixed FTE models, savings come from headcount optimisation and grade downlevelling:</p>
              <ul>
                <li>3 FTE PMs → 1 PM + NexPlan AI = 2 FTE headcount saved</li>
                <li>Grade downlevelling (L3→L1 on AI-assisted projects): <strong>₹8L–₹13L saved per PM/yr</strong></li>
                <li>For 20 PMs at L3 average CTC (₹18L): <strong>Total FTE saving ₹2.4Cr/yr</strong></li>
                <li>NexPlan for 100 users: ₹6L/yr</li>
                <li><strong>Net saving: ₹2.34Cr/yr · ROI: 390%</strong></li>
              </ul>

              <h2>Competitive Advantage Summary</h2>
              <ul>
                <li><strong>vs ServiceNow PPM:</strong> 14× cheaper, no 6-month implementation, no professional services. Comparable governance for IT portfolios under 500 projects.</li>
                <li><strong>vs Jira / MS Project:</strong> Purpose-built for IT infrastructure teams. AI task generation, infra PM workflows, CIO dashboard — none of these exist in Jira or MS Project.</li>
                <li><strong>vs Generic PM Tools (Monday, Asana):</strong> No understanding of infrastructure projects (VLAN, WAP, DC migration, SD-WAN). NexPlan's AI knows IT delivery.</li>
              </ul>

              <h2>Deployment Options</h2>
              <ul>
                <li><strong>SaaS (Recommended):</strong> Live in under 2 weeks. ₹6,000/user/year. SOC 2 compliant. Ideal for most enterprise engagements.</li>
                <li><strong>Data Center:</strong> On-premises deployment for regulated environments (banking, defence, FISC). Full data sovereignty. Timeline 8–14 weeks.</li>
                <li><strong>Multi-client workspace:</strong> One NexPlan instance for all client accounts — UPS, CITI BANK, NTT Data — each isolated with their own projects and governance view.</li>
              </ul>

              <div style={{background:"#0F6E56",borderRadius:14,padding:24,color:"#fff",marginTop:20}}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:10}}>Recommended Pitch Close for CIOs</div>
                <div style={{fontSize:14,lineHeight:1.8,opacity:0.92}}>
                  "NexPlan doesn't replace your Project Managers — it makes every PM on your team perform at the level of someone two grades above them. You get a Senior PM's output at a Junior PM's cost. For an organisation running {projectsPA} IT projects a year across {fteCount} PMs, that's not a software purchase — it's a <strong>structural cost reduction of {f(saving)} per year</strong>. At ₹6,000 per user per year, the ROI pays back in {paybackMonths} months."
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
