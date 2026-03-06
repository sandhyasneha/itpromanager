'use client'
// ============================================================
// src/components/PortfolioView.tsx
// NEW FILE — Portfolio Manager two-pane dashboard
// Left: project list with RAG + filter + search
// Right: portfolio overview OR selected project deep-dive
// Only visible to users with role = 'Portfolio Manager'
// ============================================================
import { useState, useMemo } from 'react'

interface Project {
  id:                  string
  name:                string
  color?:              string
  start_date?:         string
  end_date?:           string
  status?:             string
  budget_total?:       number | null
  budget_currency?:    string
  budget_contingency?: number | null
}

interface Task {
  id:          string
  project_id:  string
  title:       string
  status:      string
  priority:    string
  due_date?:   string
  updated_at?: string
  assignee_name?: string
}

interface Risk {
  id:         string
  project_id: string
  rag_status: string
  status:     string
  title:      string
  type:       string
}

interface Props {
  projects: Project[]
  tasks:    Task[]
  risks:    Risk[]
}

// ── Helpers ───────────────────────────────────────────────
function getRAG(tasks: Task[], risks: Risk[]): 'red' | 'amber' | 'green' {
  const overdue  = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()).length
  const blocked  = tasks.filter(t => t.status === 'blocked').length
  const redRisks = risks.filter(r => r.rag_status === 'red' && r.status === 'open').length
  if (blocked > 0 || redRisks > 1 || overdue > 3) return 'red'
  if (overdue > 0 || redRisks > 0) return 'amber'
  return 'green'
}

function getProgress(tasks: Task[]): number {
  if (!tasks.length) return 0
  const done = tasks.filter(t => t.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}

function calcVelocity(tasks: Task[]): number {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14)
  const done = tasks.filter(t => t.status === 'done' && t.updated_at && new Date(t.updated_at) >= cutoff).length
  return done / 2
}

function predictDelay(project: Project, tasks: Task[]): { delayDays: number; status: 'on_track' | 'at_risk' | 'delayed' | 'no_data'; predictedEnd: Date | null; velocity: number } {
  const remaining = tasks.filter(t => t.status !== 'done').length
  const velocity  = calcVelocity(tasks)
  const today     = new Date()
  const plannedEnd = project.end_date ? new Date(project.end_date) : null

  if (!tasks.length || project.status === 'completed') return { delayDays: 0, status: 'on_track', predictedEnd: plannedEnd, velocity }
  if (velocity === 0) {
    const delayDays = plannedEnd ? Math.max(0, Math.ceil((today.getTime() - plannedEnd.getTime()) / 86400000)) : 0
    return { delayDays, status: delayDays > 0 ? 'delayed' : 'no_data', predictedEnd: null, velocity }
  }
  const weeksLeft  = remaining / velocity
  const predictedEnd = new Date(today); predictedEnd.setDate(today.getDate() + Math.ceil(weeksLeft * 7))
  const delayDays = plannedEnd ? Math.ceil((predictedEnd.getTime() - plannedEnd.getTime()) / 86400000) : 0
  const status = delayDays > 14 ? 'delayed' : delayDays > 0 ? 'at_risk' : 'on_track'
  return { delayDays, status, predictedEnd, velocity }
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const RAG_CFG = {
  red:   { dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200',       label: 'At Risk'  },
  amber: { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Caution'  },
  green: { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'On Track' },
}

const DELAY_CFG = {
  on_track: { color: 'text-emerald-600', label: 'On Track' },
  at_risk:  { color: 'text-amber-600',   label: 'At Risk'  },
  delayed:  { color: 'text-red-600',     label: 'Delayed'  },
  no_data:  { color: 'text-slate-400',   label: 'No Data'  },
}

// ── Donut chart ───────────────────────────────────────────
function MiniDonut({ pct, color }: { pct: number; color: string }) {
  const r = 18; const circ = 2 * Math.PI * r
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5"/>
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} strokeLinecap="round"/>
    </svg>
  )
}

// ── Project Detail Panel ──────────────────────────────────
function ProjectDetail({ project, tasks, risks }: { project: Project; tasks: Task[]; risks: Risk[] }) {
  const today      = new Date()
  const rag        = getRAG(tasks, risks)
  const progress   = getProgress(tasks)
  const delay      = predictDelay(project, tasks)
  const ragCfg     = RAG_CFG[rag]
  const delayCfg   = DELAY_CFG[delay.status]

  const done       = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const blocked    = tasks.filter(t => t.status === 'blocked').length
  const overdue    = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < today)
  const redRisks   = risks.filter(r => r.rag_status === 'red' && r.status === 'open')
  const openRisks  = risks.filter(r => r.status === 'open')

  const statusCols = [
    { label: 'Done',        value: done,             color: '#22d3a5' },
    { label: 'In Progress', value: inProgress,        color: '#00d4ff' },
    { label: 'Blocked',     value: blocked,           color: '#ef4444' },
    { label: 'Backlog',     value: tasks.filter(t => t.status === 'backlog').length, color: '#94a3b8' },
  ]

  return (
    <div className="space-y-4">
      {/* Project header */}
      <div className="flex items-start gap-3">
        <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ background: project.color || '#00d4ff' }}/>
        <div className="flex-1">
          <h3 className="font-syne font-black text-lg text-slate-900">{project.name}</h3>
          <p className="text-xs text-slate-400 font-mono-code mt-0.5">
            {fmtDate(project.start_date)} → {fmtDate(project.end_date)}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${ragCfg.badge}`}>{ragCfg.label}</span>
      </div>

      {/* Progress + delay */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="relative">
            <MiniDonut pct={progress} color={project.color || '#00d4ff'} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700 rotate-90">{progress}%</span>
          </div>
          <div>
            <p className="font-syne font-black text-base text-slate-900">{done}/{tasks.length}</p>
            <p className="text-[10px] text-slate-400">tasks complete</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className={`font-syne font-black text-base ${delayCfg.color}`}>
            {delay.delayDays > 0 ? `+${delay.delayDays}d late` : delay.delayDays < 0 ? `${Math.abs(delay.delayDays)}d early` : 'On time'}
          </p>
          <p className="text-[10px] text-slate-400">predicted delivery</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {delay.predictedEnd ? fmtDate(delay.predictedEnd.toISOString().split('T')[0]) : '—'}
          </p>
        </div>
      </div>

      {/* Task breakdown */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-syne font-bold text-slate-600 mb-3">Task Breakdown</p>
        <div className="grid grid-cols-4 gap-2">
          {statusCols.map(s => (
            <div key={s.label} className="text-center">
              <p className="font-syne font-black text-lg" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Stacked bar */}
        <div className="flex h-2 rounded-full overflow-hidden mt-3 gap-px">
          {statusCols.map(s => (
            tasks.length > 0 && s.value > 0 ? (
              <div key={s.label} style={{ width: `${(s.value / tasks.length) * 100}%`, background: s.color }} />
            ) : null
          ))}
        </div>
      </div>

      {/* Overdue tasks */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-syne font-bold text-red-700 mb-2">🚨 Overdue Tasks ({overdue.length})</p>
          <div className="space-y-1.5">
            {overdue.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-700 truncate flex-1">{t.title}</p>
                <span className="text-[10px] text-red-600 font-mono-code shrink-0">{fmtDate(t.due_date)}</span>
              </div>
            ))}
            {overdue.length > 5 && <p className="text-[10px] text-red-400">+{overdue.length - 5} more</p>}
          </div>
        </div>
      )}

      {/* Red risks */}
      {redRisks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-syne font-bold text-red-700 mb-2">🛡️ Red Risks ({redRisks.length})</p>
          <div className="space-y-1.5">
            {redRisks.slice(0, 4).map(r => (
              <p key={r.id} className="text-xs text-slate-700">• {r.title}</p>
            ))}
          </div>
        </div>
      )}

      {/* Velocity */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-syne font-bold text-slate-600 mb-2">🔮 Velocity & Forecast</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-syne font-black text-base text-slate-700">{delay.velocity.toFixed(1)}</p>
            <p className="text-[9px] text-slate-400">tasks/week</p>
          </div>
          <div>
            <p className="font-syne font-black text-base text-slate-700">{tasks.filter(t => t.status !== 'done').length}</p>
            <p className="text-[9px] text-slate-400">remaining</p>
          </div>
          <div>
            <p className={`font-syne font-black text-base ${delayCfg.color}`}>{delayCfg.label}</p>
            <p className="text-[9px] text-slate-400">status</p>
          </div>
        </div>
      </div>

      {/* Budget (if set) */}
      {project.budget_total && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-syne font-bold text-emerald-700 mb-2">💰 Budget</p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="font-syne font-black text-base text-slate-700">
                {project.budget_currency === 'INR' ? '₹' : project.budget_currency === 'GBP' ? '£' : '$'}
                {Number(project.budget_total).toLocaleString()}
              </p>
              <p className="text-[9px] text-slate-400">total budget</p>
            </div>
            <div>
              <p className="font-syne font-black text-base text-amber-600">{project.budget_contingency ?? 15}%</p>
              <p className="text-[9px] text-slate-400">contingency</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Portfolio Overview (no project selected) ──────────────
function PortfolioOverview({ projects, tasks, risks }: Props) {
  const today = new Date()

  const allStats = projects.map(p => {
    const pt = tasks.filter(t => t.project_id === p.id)
    const pr = risks.filter(r => r.project_id === p.id)
    return { project: p, rag: getRAG(pt, pr), progress: getProgress(pt), delay: predictDelay(p, pt), tasks: pt, risks: pr }
  })

  const totalTasks    = tasks.length
  const totalDone     = tasks.filter(t => t.status === 'done').length
  const totalOverdue  = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < today)
  const totalBlocked  = tasks.filter(t => t.status === 'blocked').length
  const portfolioPct  = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0
  const redProjects   = allStats.filter(p => p.rag === 'red').length
  const delayedProjects = allStats.filter(p => p.delay.status === 'delayed').length

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-syne font-black text-lg text-slate-900">Portfolio Overview</h3>
        <p className="text-xs text-slate-400 mt-0.5">{projects.length} active projects · Click a project on the left for details</p>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Portfolio Completion', value: `${portfolioPct}%`, sub: `${totalDone}/${totalTasks} tasks`, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
          { label: 'At Risk Projects',     value: redProjects,         sub: 'red RAG status',                  color: 'text-red-600',  bg: 'bg-red-50 border-red-200'  },
          { label: 'Overdue Tasks',        value: totalOverdue.length, sub: 'across all projects',             color: totalOverdue.length > 0 ? 'text-red-600' : 'text-emerald-600', bg: totalOverdue.length > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200' },
          { label: 'Delayed Projects',     value: delayedProjects,     sub: 'by velocity forecast',            color: delayedProjects > 0 ? 'text-amber-600' : 'text-emerald-600', bg: delayedProjects > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
            <p className={`font-syne font-black text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{s.label}</p>
            <p className="text-[10px] text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* RAG summary table */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-syne font-bold text-slate-600 mb-3">RAG Summary</p>
        <div className="space-y-2">
          {allStats.sort((a,b) => {
            const o = { red:0, amber:1, green:2 }
            return o[a.rag] - o[b.rag]
          }).map(s => {
            const cfg = RAG_CFG[s.rag]
            const dc  = DELAY_CFG[s.delay.status]
            return (
              <div key={s.project.id} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}/>
                <p className="text-xs text-slate-700 flex-1 truncate">{s.project.name}</p>
                <span className="text-[10px] font-mono-code text-slate-400">{s.progress}%</span>
                <span className={`text-[10px] font-bold ${dc.color}`}>
                  {s.delay.delayDays > 0 ? `+${s.delay.delayDays}d` : s.delay.status === 'on_track' ? '✓' : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top overdue tasks */}
      {totalOverdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-syne font-bold text-red-700 mb-3">🚨 Top Overdue Tasks</p>
          <div className="space-y-2">
            {totalOverdue.slice(0, 6).map(t => {
              const proj = projects.find(p => p.id === t.project_id)
              return (
                <div key={t.id} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: proj?.color || '#ef4444' }}/>
                  <p className="text-xs text-slate-700 flex-1 truncate">{t.title}</p>
                  <span className="text-[10px] text-slate-400 shrink-0 truncate max-w-[80px]">{proj?.name}</span>
                  <span className="text-[10px] text-red-600 font-mono-code shrink-0">{fmtDate(t.due_date)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main PortfolioView ────────────────────────────────────
export default function PortfolioView({ projects, tasks, risks }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search,     setSearch]     = useState('')
  const [ragFilter,  setRagFilter]  = useState<'all' | 'red' | 'amber' | 'green'>('all')

  const projectStats = useMemo(() => projects.map(p => {
    const pt = tasks.filter(t => t.project_id === p.id)
    const pr = risks.filter(r => r.project_id === p.id)
    return { ...p, rag: getRAG(pt, pr), progress: getProgress(pt), delay: predictDelay(p, pt), taskCount: pt.length, overdueCount: pt.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()).length }
  }), [projects, tasks, risks])

  const filtered = projectStats.filter(p => {
    if (ragFilter !== 'all' && p.rag !== ragFilter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selected = selectedId ? projects.find(p => p.id === selectedId) : null
  const selectedTasks = selectedId ? tasks.filter(t => t.project_id === selectedId) : []
  const selectedRisks = selectedId ? risks.filter(r => r.project_id === selectedId) : []

  return (
    <div className="flex gap-0 h-[calc(100vh-200px)] min-h-[600px]">

      {/* ── LEFT PANE ──────────────────────────────────── */}
      <div className="w-72 shrink-0 border border-slate-200 rounded-l-2xl flex flex-col bg-white overflow-hidden">

        {/* Search */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-cyan-400"
              placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>

        {/* RAG filter */}
        <div className="flex gap-1 p-2 border-b border-slate-100">
          {(['all','red','amber','green'] as const).map(f => (
            <button key={f} onClick={() => setRagFilter(f)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all
                ${ragFilter === f
                  ? f === 'all' ? 'bg-slate-800 text-white' : f === 'red' ? 'bg-red-500 text-white' : f === 'amber' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-slate-600'}`}>
              {f === 'all' ? `All (${projectStats.length})` : f === 'red' ? '🔴' : f === 'amber' ? '🟡' : '🟢'}
            </button>
          ))}
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-xs">No projects found</p>
            </div>
          ) : filtered.map(p => {
            const cfg = RAG_CFG[p.rag]
            const dc  = DELAY_CFG[p.delay.status]
            const isSelected = selectedId === p.id
            return (
              <button key={p.id} onClick={() => setSelectedId(isSelected ? null : p.id)}
                className={`w-full text-left p-3 border-b border-slate-50 transition-all
                  ${isSelected ? 'bg-cyan-50 border-l-2 border-l-cyan-400' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}/>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || '#00d4ff' }}/>
                  <p className="text-xs font-syne font-bold text-slate-800 truncate flex-1">{p.name}</p>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.color || '#00d4ff' }}/>
                  </div>
                  <span className="text-[9px] font-mono-code text-slate-400 shrink-0">{p.progress}%</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[9px] font-bold ${dc.color}`}>
                    {p.delay.delayDays > 0 ? `+${p.delay.delayDays}d` : '✓'}
                  </span>
                  {p.overdueCount > 0 && (
                    <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{p.overdueCount} overdue</span>
                  )}
                  <span className="text-[9px] text-slate-400">{p.taskCount} tasks</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Left footer */}
        <div className="p-2 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-mono-code">{projects.length} projects · Portfolio Manager View</p>
        </div>
      </div>

      {/* ── RIGHT PANE ─────────────────────────────────── */}
      <div className="flex-1 border border-l-0 border-slate-200 rounded-r-2xl overflow-y-auto bg-slate-50 p-5">
        {selected ? (
          <ProjectDetail project={selected} tasks={selectedTasks} risks={selectedRisks} />
        ) : (
          <PortfolioOverview projects={projects} tasks={tasks} risks={risks} />
        )}
      </div>
    </div>
  )
}
