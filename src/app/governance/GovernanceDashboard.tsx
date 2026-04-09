"use client";

interface Workspace { id: string; name: string; created_at: string; }
interface Project   { id: string; name: string; status: string | null; progress: number | null; budget_total: string | null; end_date: string | null; scope: string | null; workspace_id: string | null; }
interface Task      { id: string; project_id: string; status: string; priority: string | null; due_date: string | null; }
interface Risk      { id: string; project_id: string; likelihood: string | null; impact: string | null; status: string | null; }
interface Milestone { id: string; project_id: string; name: string; due_date: string; status: string; }

interface Props { workspaces: Workspace[]; projects: Project[]; tasks: Task[]; risks: Risk[]; milestones: Milestone[]; }

// ─── Task status helpers ──────────────────────────────────────────────────────
// Your actual statuses: backlog | in_progress | review | done

function isDone(s: string)       { return s === "done"; }
function isActive(s: string)     { return s === "in_progress" || s === "review"; }
function isBacklog(s: string)    { return s === "backlog"; }
function isComplete(pct: number | null, status: string | null) {
  return status === "completed" || (pct ?? 0) >= 100;
}

// ─── RAG ──────────────────────────────────────────────────────────────────────

function getRAG(p: Project, tasks: Task[], risks: Risk[]): "R" | "A" | "G" {
  const now = Date.now();
  const projTasks = tasks.filter(t => t.project_id === p.id);
  const total     = projTasks.length;
  const done      = projTasks.filter(t => isDone(t.status)).length;
  const donePct   = total > 0 ? done / total : 0;

  // RED
  if (p.status === "blocked") return "R";
  if (p.end_date && new Date(p.end_date).getTime() < now && !isComplete(p.progress, p.status)) return "R";
  if (risks.some(r => r.project_id === p.id && r.impact === "high" && r.status !== "closed")) return "R";

  // AMBER
  if (p.end_date) {
    const daysLeft = Math.round((new Date(p.end_date).getTime() - now) / 86_400_000);
    if (daysLeft < 14 && donePct < 0.5) return "A";
    if (daysLeft < 30 && donePct < 0.25) return "A";
  }
  if (total > 0 && donePct < 0.2 && (p.progress ?? 0) < 20) return "A";

  return "G";
}

const RAG_STYLE = {
  R: { bg:"#FCEBEB", text:"#791F1F", dot:"#E24B4A", label:"Red"   },
  A: { bg:"#FAEEDA", text:"#633806", dot:"#EF9F27", label:"Amber" },
  G: { bg:"#E1F5EE", text:"#085041", dot:"#1D9E75", label:"Green" },
};

// ─── Health score ─────────────────────────────────────────────────────────────

function healthScore(p: Project, tasks: Task[], risks: Risk[]): number {
  if (isComplete(p.progress, p.status)) return 100;

  const now       = Date.now();
  const projTasks = tasks.filter(t => t.project_id === p.id);
  const total     = projTasks.length;
  const done      = projTasks.filter(t => isDone(t.status)).length;
  const active    = projTasks.filter(t => isActive(t.status)).length;
  const donePct   = total > 0 ? done / total : 0;

  let score = 60; // base

  // Task completion contribution (+30 max)
  score += Math.round(donePct * 30);

  // Active tasks bonus (+10 max)
  if (total > 0) score += Math.min(Math.round((active / total) * 10), 10);

  // Deadline penalty
  if (p.end_date) {
    const daysLeft = Math.round((new Date(p.end_date).getTime() - now) / 86_400_000);
    if (daysLeft < 0)  score -= 30;
    else if (daysLeft < 7)  score -= 15;
    else if (daysLeft < 14) score -= 10;
    else if (daysLeft < 30) score -= 5;
  }

  // Risk penalty
  const highRisks = risks.filter(r => r.project_id === p.id && r.impact === "high" && r.status !== "closed").length;
  score -= highRisks * 15;

  // Status
  if (p.status === "blocked") score -= 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function healthColor(s: number) {
  return s >= 70 ? "#1D9E75" : s >= 40 ? "#EF9F27" : "#E24B4A";
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function fmt(n: number | null) {
  if (!n) return "—";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + Math.round(n / 1_000) + "K";
  return "$" + n;
}

function daysLeft(d: string | null): number | null {
  if (!d) return null;
  return Math.round((new Date(d).getTime() - Date.now()) / 86_400_000);
}

// ─── Workspace card ───────────────────────────────────────────────────────────

function WorkspaceCard({ ws, wsProjects, tasks, risks, milestones }: {
  ws: Workspace; wsProjects: Project[]; tasks: Task[]; risks: Risk[]; milestones: Milestone[];
}) {
  const allTasks    = tasks.filter(t => wsProjects.some(p => p.id === t.project_id));
  const doneTasks   = allTasks.filter(t => isDone(t.status)).length;
  const activeTasks = allTasks.filter(t => isActive(t.status)).length;
  const backlogT    = allTasks.filter(t => isBacklog(t.status)).length;
  const totalBudget = wsProjects.reduce((s, p) => s + (p.budget_total ? Number(p.budget_total) : 0), 0);
  const avgHealth   = wsProjects.length > 0
    ? Math.round(wsProjects.reduce((s, p) => s + healthScore(p, tasks, risks), 0) / wsProjects.length) : 0;
  const ragCounts   = { R: 0, A: 0, G: 0 };
  wsProjects.forEach(p => ragCounts[getRAG(p, tasks, risks)]++);
  const completionPct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  return (
    <div style={{ background:"var(--np-surface)", border:"0.5px solid var(--np-border)", borderRadius:16, overflow:"hidden", marginBottom:20 }}>

      {/* Header */}
      <div style={{ padding:"14px 20px", borderBottom:"0.5px solid var(--np-border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:10, background:"#0F6E56", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, color:"#E1F5EE", fontFamily:"var(--np-mono)", flexShrink:0 }}>
            {ws.name.slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:500, color:"var(--np-text)" }}>{ws.name}</div>
            <div style={{ fontSize:11, color:"var(--np-muted)" }}>{wsProjects.length} project{wsProjects.length !== 1 ? "s" : ""} · {allTasks.length} tasks</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {(["R","A","G"] as const).filter(r => ragCounts[r] > 0).map(r => (
            <div key={r} style={{ display:"flex", alignItems:"center", gap:5, background:RAG_STYLE[r].bg, color:RAG_STYLE[r].text, padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:500 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:RAG_STYLE[r].dot }} />
              {ragCounts[r]} {RAG_STYLE[r].label}
            </div>
          ))}
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"var(--np-bg)", border:"0.5px solid var(--np-border)", padding:"4px 12px", borderRadius:20 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:healthColor(avgHealth) }} />
            <span style={{ fontFamily:"var(--np-mono)", fontSize:13, fontWeight:700, color:healthColor(avgHealth) }}>{avgHealth}</span>
            <span style={{ fontSize:11, color:"var(--np-muted)" }}>/ 100</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", borderBottom:"0.5px solid var(--np-border)" }}>
        {[
          { label:"Projects",    value: String(wsProjects.length), color:"#378ADD" },
          { label:"Done",        value: `${doneTasks}/${allTasks.length}`, color:"#1D9E75" },
          { label:"In progress", value: String(activeTasks), color:"#BA7517" },
          { label:"Backlog",     value: String(backlogT), color:"var(--np-muted)" },
          { label:"Budget",      value: fmt(totalBudget), color:"var(--np-text)" },
        ].map((s, i) => (
          <div key={s.label} style={{ padding:"10px 0", textAlign:"center", borderRight: i < 4 ? "0.5px solid var(--np-border)" : "none" }}>
            <div style={{ fontFamily:"var(--np-mono)", fontSize:17, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:10, color:"var(--np-muted)", marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Completion bar */}
      {allTasks.length > 0 && (
        <div style={{ padding:"8px 20px", borderBottom:"0.5px solid var(--np-border)", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:11, color:"var(--np-muted)", flexShrink:0 }}>Completion</span>
          <div style={{ flex:1, height:4, background:"rgba(0,0,0,0.06)", borderRadius:2 }}>
            <div style={{ height:"100%", borderRadius:2, background:"#1D9E75", width:`${completionPct}%` }} />
          </div>
          <span style={{ fontFamily:"var(--np-mono)", fontSize:11, color:"#1D9E75", flexShrink:0 }}>{completionPct}%</span>
        </div>
      )}

      {/* Projects */}
      <div style={{ padding:"12px 20px" }}>
        {wsProjects.length === 0 ? (
          <div style={{ textAlign:"center", padding:"20px 0", fontSize:13, color:"var(--np-muted)" }}>No projects linked to this workspace yet.</div>
        ) : (
          <>
            <div style={{ fontFamily:"var(--np-mono)", fontSize:10, letterSpacing:".08em", color:"var(--np-muted)", textTransform:"uppercase", marginBottom:10 }}>projects</div>
            {wsProjects.map(p => {
              const rag   = getRAG(p, tasks, risks);
              const rs    = RAG_STYLE[rag];
              const hs    = healthScore(p, tasks, risks);
              const pt    = tasks.filter(t => t.project_id === p.id);
              const pDone = pt.filter(t => isDone(t.status)).length;
              const pAct  = pt.filter(t => isActive(t.status)).length;
              const pBack = pt.filter(t => isBacklog(t.status)).length;
              const dl    = daysLeft(p.end_date);
              const pMs   = milestones.filter(m => m.project_id === p.id && m.status !== "completed").slice(0,2);

              return (
                <div key={p.id} style={{ border:"0.5px solid var(--np-border)", borderLeft:`3px solid ${rs.dot}`, borderRadius:10, padding:"12px 14px", marginBottom:8, background:"var(--np-bg)" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:13, fontWeight:500, color:"var(--np-text)" }}>{p.name}</span>
                        <span style={{ fontSize:11, background:rs.bg, color:rs.text, padding:"2px 8px", borderRadius:20, fontWeight:500, flexShrink:0 }}>{rag} — {rs.label}</span>
                        {p.status && <span style={{ fontSize:11, color:"var(--np-muted)", background:"var(--np-surface)", padding:"2px 8px", border:"0.5px solid var(--np-border)", borderRadius:20, flexShrink:0 }}>{p.status}</span>}
                      </div>
                      {p.scope && p.scope.trim() && (
                        <div style={{ fontSize:11, color:"var(--np-muted)", marginTop:4 }}>
                          {p.scope.slice(0,120)}{p.scope.length > 120 ? "…" : ""}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign:"center", flexShrink:0, minWidth:52 }}>
                      <div style={{ fontFamily:"var(--np-mono)", fontSize:20, fontWeight:700, color:healthColor(hs), lineHeight:1 }}>{hs}</div>
                      <div style={{ fontSize:9, color:"var(--np-muted)", marginTop:2 }}>health</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--np-muted)", marginBottom:3 }}>
                      <span>Progress</span>
                      <span style={{ fontFamily:"var(--np-mono)" }}>{p.progress ?? 0}%</span>
                    </div>
                    <div style={{ height:4, background:"rgba(0,0,0,0.06)", borderRadius:2 }}>
                      <div style={{ height:"100%", borderRadius:2, background:healthColor(hs), width:`${p.progress ?? 0}%` }} />
                    </div>
                  </div>

                  {/* Task counts + deadline + budget */}
                  <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
                    <div style={{ display:"flex", gap:10 }}>
                      {[
                        { label:"Done",     val:pDone,  color:"#1D9E75" },
                        { label:"Active",   val:pAct,   color:"#BA7517" },
                        { label:"Backlog",  val:pBack,  color:"var(--np-muted)" },
                      ].map(s => (
                        <div key={s.label} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11 }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background:s.color, flexShrink:0 }} />
                          <span style={{ color:"var(--np-muted)" }}>{s.label}:</span>
                          <span style={{ fontFamily:"var(--np-mono)", fontWeight:500, color:"var(--np-text)" }}>{s.val}</span>
                        </div>
                      ))}
                    </div>
                    {dl !== null && (
                      <span style={{ fontSize:11, color: dl < 0 ? "#A32D2D" : dl < 14 ? "#BA7517" : "var(--np-muted)", fontFamily:"var(--np-mono)" }}>
                        {dl < 0 ? `⚠ ${Math.abs(dl)}d overdue` : `${dl}d left · ${p.end_date}`}
                      </span>
                    )}
                    {p.budget_total && Number(p.budget_total) > 0 && (
                      <span style={{ fontSize:11, color:"var(--np-muted)" }}>
                        Budget: <span style={{ fontFamily:"var(--np-mono)", color:"var(--np-text)" }}>{fmt(Number(p.budget_total))}</span>
                      </span>
                    )}
                  </div>

                  {/* Milestones */}
                  {pMs.length > 0 && (
                    <div style={{ marginTop:8, display:"flex", gap:6, flexWrap:"wrap" }}>
                      {pMs.map(m => {
                        const md = daysLeft(m.due_date);
                        return (
                          <span key={m.id} style={{ fontSize:11, background:"var(--np-surface)", border:"0.5px solid var(--np-border)", borderRadius:6, padding:"3px 8px", color: md !== null && md < 0 ? "#A32D2D" : "var(--np-muted)" }}>
                            🏁 {m.name} · {m.due_date}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GovernanceDashboard({ workspaces, projects, tasks, risks, milestones }: Props) {
  const now          = Date.now();
  const totalTasks   = tasks.length;
  const doneTasks    = tasks.filter(t => isDone(t.status)).length;
  const activeTasks  = tasks.filter(t => isActive(t.status)).length;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const overdueProjCount = projects.filter(p => p.end_date && new Date(p.end_date).getTime() < now && !isComplete(p.progress, p.status)).length;

  const ragAll = { R:0, A:0, G:0 };
  projects.forEach(p => ragAll[getRAG(p, tasks, risks)]++);

  const avgHealth = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + healthScore(p, tasks, risks), 0) / projects.length) : 0;

  const unlinked = projects.filter(p => !workspaces.find(w => w.id === p.workspace_id));

  return (
    <>
      <style>{`
        :root{--np-bg:#F4F3EF;--np-surface:#FFFFFF;--np-border:rgba(0,0,0,0.09);--np-text:#1A1A18;--np-muted:#73726C;--np-mono:'DM Mono','Fira Mono',monospace;--np-sans:'DM Sans',system-ui,sans-serif;}
        @media(prefers-color-scheme:dark){:root{--np-bg:#141412;--np-surface:#1E1E1B;--np-border:rgba(255,255,255,0.08);--np-text:#E8E6DF;--np-muted:#888780;}}
        .np-shell{font-family:var(--np-sans);background:var(--np-bg);min-height:100vh;}
        .np-topbar{background:var(--np-surface);border-bottom:0.5px solid var(--np-border);padding:12px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;}
        .np-logo{width:28px;height:28px;border-radius:7px;background:#0F6E56;display:flex;align-items:center;justify-content:center;font-family:var(--np-mono);font-size:12px;font-weight:700;color:#E1F5EE;}
        .np-main{padding:20px 24px;max-width:1200px;margin:0 auto;}
        .np-lbl{font-family:var(--np-mono);font-size:10px;letter-spacing:.08em;color:var(--np-muted);margin-bottom:10px;text-transform:uppercase;}
        .np-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:16px;}
        .np-kpi{background:var(--np-surface);border:0.5px solid var(--np-border);border-radius:12px;padding:14px 16px;}
        .np-rag{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;}
        @media(max-width:900px){.np-kpis{grid-template-columns:repeat(3,1fr);}.np-rag{grid-template-columns:1fr;}}
        @media(max-width:600px){.np-kpis{grid-template-columns:1fr 1fr;}.np-main{padding:12px;}}
      `}</style>

      <div className="np-shell">
        <div className="np-topbar">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div className="np-logo">NP</div>
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:"var(--np-text)" }}>NexPlan</div>
              <div style={{ fontFamily:"var(--np-mono)", fontSize:10, color:"var(--np-muted)" }}>CIO Governance Dashboard</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <a href="/governance" style={{ fontFamily:"var(--np-mono)", fontSize:10, padding:"4px 10px", borderRadius:6, border:"0.5px solid var(--np-border)", background:"var(--np-bg)", color:"var(--np-muted)", textDecoration:"none" }}>↻ Refresh</a>
            <div style={{ fontSize:12, fontWeight:500, background:"#E1F5EE", color:"#085041", borderRadius:6, padding:"4px 10px" }}>CIO View</div>
          </div>
        </div>

        <div className="np-main">
          <div className="np-lbl" style={{ marginTop:20 }}>portfolio snapshot</div>

          {/* KPIs */}
          <div className="np-kpis">
            {[
              { label:"Workspaces",       value: workspaces.length,       sub:`${projects.length} total projects`,      color:"#0F6E56", fill:Math.min(workspaces.length*25,100) },
              { label:"Avg health",        value: `${avgHealth}/100`,       sub:"across all projects",                   color:healthColor(avgHealth), fill:avgHealth },
              { label:"Task completion",   value: `${completionPct}%`,      sub:`${doneTasks} done · ${activeTasks} active`, color:"#1D9E75", fill:completionPct },
              { label:"Overdue projects",  value: overdueProjCount,         sub:overdueProjCount>0?"needs attention":"all on schedule", color:overdueProjCount>0?"#E24B4A":"#1D9E75", fill:Math.min(overdueProjCount*15,100) },
              { label:"Total tasks",       value: totalTasks,               sub:`${tasks.filter(t=>isBacklog(t.status)).length} in backlog`, color:"var(--np-text)", fill:Math.min(totalTasks*2,100) },
            ].map(k => (
              <div key={k.label} className="np-kpi">
                <div style={{ fontSize:11, color:"var(--np-muted)", marginBottom:5 }}>{k.label}</div>
                <div style={{ fontFamily:"var(--np-mono)", fontSize:22, fontWeight:700, color:k.color }}>{k.value}</div>
                <div style={{ fontSize:11, color:"var(--np-muted)", marginTop:3 }}>{k.sub}</div>
                <div style={{ marginTop:8, height:3, background:"rgba(0,0,0,0.06)", borderRadius:2 }}>
                  <div style={{ height:"100%", borderRadius:2, background:typeof k.color === "string" && k.color.startsWith("#") ? k.color : "#888780", width:`${k.fill}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* RAG bar */}
          <div className="np-rag">
            {(["R","A","G"] as const).map(r => (
              <div key={r} style={{ display:"flex", alignItems:"center", gap:12, background:RAG_STYLE[r].bg, border:`0.5px solid ${RAG_STYLE[r].dot}40`, padding:"12px 18px", borderRadius:12 }}>
                <div style={{ width:12, height:12, borderRadius:"50%", background:RAG_STYLE[r].dot, flexShrink:0 }} />
                <div>
                  <div style={{ fontFamily:"var(--np-mono)", fontSize:24, fontWeight:700, color:RAG_STYLE[r].dot, lineHeight:1 }}>{ragAll[r]}</div>
                  <div style={{ fontSize:12, color:RAG_STYLE[r].text, marginTop:2 }}>{RAG_STYLE[r].label} projects</div>
                </div>
                {ragAll[r] > 0 && (
                  <div style={{ marginLeft:"auto", fontSize:11, color:RAG_STYLE[r].text }}>
                    {r === "R" ? "Needs immediate attention" : r === "A" ? "Monitor closely" : "On track"}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Workspace cards */}
          <div className="np-lbl">client workspaces</div>
          {workspaces.length === 0 ? (
            <div style={{ textAlign:"center", padding:40, color:"var(--np-muted)", fontSize:14 }}>No workspaces found.</div>
          ) : (
            workspaces.map(ws => (
              <WorkspaceCard key={ws.id} ws={ws}
                wsProjects={projects.filter(p => p.workspace_id === ws.id)}
                tasks={tasks} risks={risks} milestones={milestones} />
            ))
          )}

          {/* Unlinked projects */}
          {unlinked.length > 0 && (
            <>
              <div className="np-lbl" style={{ marginTop:8 }}>unassigned projects ({unlinked.length})</div>
              <WorkspaceCard ws={{ id:"_", name:"No Workspace", created_at:"" }}
                wsProjects={unlinked} tasks={tasks} risks={risks} milestones={milestones} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
