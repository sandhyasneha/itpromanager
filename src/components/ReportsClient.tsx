'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StakeholderDigest from '@/components/StakeholderDigest'

interface Project { id: string; name: string; color: string; end_date?: string }
interface Task {
  id: string; title: string; status: string; priority: string
  due_date?: string; project_id: string; assignee_name?: string
  assignee_email?: string; estimated_hours?: number; description?: string
}
interface Resource {
  id: string; project_id: string; assignee_name: string
  assignee_email?: string; available_hours_per_week: number; owner_id: string
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-danger bg-danger/10 border-danger/30',
  high:     'text-warn bg-warn/10 border-warn/30',
  medium:   'text-accent bg-accent/10 border-accent/30',
  low:      'text-muted bg-surface2 border-border',
}
const STATUS_LABEL: Record<string, string> = {
  backlog: 'Not Started', in_progress: 'In Progress',
  review: 'In Review', blocked: 'Blocked', done: 'Done',
}

function getDaysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
}

// ── Project Intelligence Hub component ─────────────────────
function ProjectIntelligenceHub({ projects, tasks }: { projects: Project[], tasks: Task[] }) {
  const [aiInsights, setAiInsights]   = useState<string | null>(null)
  const [aiLoading, setAiLoading]     = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [exportingPPT, setExportingPPT] = useState(false)

  async function exportToPPT() {
    setExportingPPT(true)
    try {
      const res = await fetch('/api/export-ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: projectHealth,
          tasks,
          risks: [],
          orgName: 'IT Portfolio',
          generatedBy: 'Portfolio Manager',
          aiInsights,
        })
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `NexPlan-Portfolio-Report-${new Date().toISOString().split('T')[0]}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('PPT export failed — please try again')
    } finally {
      setExportingPPT(false)
    }
  }

  const filteredTasks = selectedProject === 'all'
    ? tasks
    : tasks.filter(t => t.project_id === selectedProject)

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]))

  // ── Metrics ──────────────────────────────────────────────
  const total      = filteredTasks.length
  const done       = filteredTasks.filter(t => t.status === 'done').length
  const overdue    = filteredTasks.filter(t => t.due_date && getDaysUntil(t.due_date) < 0 && t.status !== 'done').length
  const blocked    = filteredTasks.filter(t => t.status === 'blocked').length
  const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length
  const critical   = filteredTasks.filter(t => t.priority === 'critical' && t.status !== 'done').length
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  // ── Project Health Score per project ─────────────────────
  const projectHealth = projects.map(p => {
    const pt       = tasks.filter(t => t.project_id === p.id)
    const pdone    = pt.filter(t => t.status === 'done').length
    const pover    = pt.filter(t => t.due_date && getDaysUntil(t.due_date) < 0 && t.status !== 'done').length
    const pblocked = pt.filter(t => t.status === 'blocked').length
    const pcrit    = pt.filter(t => t.priority === 'critical' && t.status !== 'done').length
    const total    = pt.length || 1

    // Health score: start at 100, deduct for issues
    let score = 100
    score -= (pover / total) * 40    // overdue tasks hurt most
    score -= (pblocked / total) * 25 // blocked tasks
    score -= (pcrit / total) * 20    // critical unfinished
    score += (pdone / total) * 15    // boost for completion
    score = Math.max(0, Math.min(100, Math.round(score)))

    const status = score >= 75 ? 'green' : score >= 50 ? 'amber' : 'red'
    const daysLeft = p.end_date ? getDaysUntil(p.end_date) : null

    return { ...p, score, status, pt, pdone, pover, pblocked, daysLeft }
  })

  // ── Risk Alerts ───────────────────────────────────────────
  const riskAlerts: { level: 'critical'|'high'|'medium'; message: string; project?: string }[] = []

  projectHealth.forEach(p => {
    if (p.pover > 0)
      riskAlerts.push({ level: 'critical', message: `${p.pover} overdue task${p.pover>1?'s':''} in "${p.name}"`, project: p.name })
    if (p.pblocked > 0)
      riskAlerts.push({ level: 'high', message: `${p.pblocked} blocked task${p.pblocked>1?'s':''} in "${p.name}"`, project: p.name })
    if (p.daysLeft !== null && p.daysLeft <= 7 && p.daysLeft >= 0 && p.pdone < p.pt.length)
      riskAlerts.push({ level: 'high', message: `"${p.name}" deadline in ${p.daysLeft} day${p.daysLeft!==1?'s':''}`, project: p.name })
    if (p.score < 50)
      riskAlerts.push({ level: 'critical', message: `"${p.name}" health score is critical (${p.score}/100)`, project: p.name })
  })

  if (critical > 0)
    riskAlerts.push({ level: 'critical', message: `${critical} critical priority task${critical>1?'s':''} still open` })
  if (completionRate < 20 && total > 5)
    riskAlerts.push({ level: 'medium', message: `Overall completion rate is low (${completionRate}%) — review task progress` })

  // ── Team Performance ──────────────────────────────────────
  const assigneeMap: Record<string, { total: number; done: number; overdue: number; blocked: number }> = {}
  filteredTasks.forEach(t => {
    if (!t.assignee_name) return
    if (!assigneeMap[t.assignee_name]) assigneeMap[t.assignee_name] = { total: 0, done: 0, overdue: 0, blocked: 0 }
    assigneeMap[t.assignee_name].total++
    if (t.status === 'done') assigneeMap[t.assignee_name].done++
    if (t.due_date && getDaysUntil(t.due_date) < 0 && t.status !== 'done') assigneeMap[t.assignee_name].overdue++
    if (t.status === 'blocked') assigneeMap[t.assignee_name].blocked++
  })
  const teamStats = Object.entries(assigneeMap)
    .map(([name, s]) => ({ name, ...s, rate: Math.round((s.done / (s.total || 1)) * 100) }))
    .sort((a, b) => b.rate - a.rate)

  // ── AI Insights ───────────────────────────────────────────
  async function generateInsights() {
    setAiLoading(true)
    setAiInsights(null)
    try {
      const summary = {
        totalProjects: projects.length,
        totalTasks: total,
        completedTasks: done,
        overdueTasks: overdue,
        blockedTasks: blocked,
        criticalTasks: critical,
        completionRate,
        projectHealth: projectHealth.map(p => ({
          name: p.name,
          score: p.score,
          status: p.status,
          overdue: p.pover,
          blocked: p.pblocked,
          daysLeft: p.daysLeft,
        })),
        teamPerformance: teamStats.slice(0, 5).map(t => ({
          name: t.name,
          completionRate: t.rate,
          overdue: t.overdue,
        })),
        topRisks: riskAlerts.filter(r => r.level === 'critical').map(r => r.message),
      }

      const res = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate insights')
      setAiInsights(data.insights || 'Unable to generate insights.')
    } catch {
      setAiInsights('Failed to generate insights. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const healthColor = (s: string) => s === 'green' ? 'text-accent3 bg-accent3/10 border-accent3/30' : s === 'amber' ? 'text-warn bg-warn/10 border-warn/30' : 'text-danger bg-danger/10 border-danger/30'
  const healthDot   = (s: string) => s === 'green' ? 'bg-accent3' : s === 'amber' ? 'bg-warn' : 'bg-danger'
  const riskColor   = (l: string) => l === 'critical' ? 'border-danger/40 bg-danger/5 text-danger' : l === 'high' ? 'border-warn/40 bg-warn/5 text-warn' : 'border-accent/40 bg-accent/5 text-accent'
  const riskIcon    = (l: string) => l === 'critical' ? '🔴' : l === 'high' ? '🟡' : '🔵'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-1">// AI-Powered</p>
          <h2 className="font-syne font-black text-2xl">Project Intelligence Hub</h2>
          <p className="text-muted text-sm mt-1">Real-time health scores, risk alerts & AI-powered recommendations</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="select text-sm py-1.5 w-44" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={exportToPPT} disabled={exportingPPT}
            className="btn-ghost px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-60 border border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
            {exportingPPT ? <><span className="animate-spin">⟳</span> Generating...</> : <>📊 Export PPT</>}
          </button>
          <button onClick={generateInsights} disabled={aiLoading}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-60">
            {aiLoading ? (
              <><span className="animate-spin">⟳</span> Analysing...</>
            ) : (
              <>🤖 Generate AI Insights</>
            )}
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Completion Rate', value: `${completionRate}%`, sub: `${done} of ${total} tasks done`, color: 'border-accent3/40', text: 'text-accent3' },
          { label: 'Overdue Tasks',   value: overdue,  sub: 'Require immediate attention', color: overdue > 0 ? 'border-danger/40' : 'border-border', text: overdue > 0 ? 'text-danger' : 'text-text' },
          { label: 'Blocked Tasks',   value: blocked,  sub: 'Waiting on dependencies',     color: blocked > 0 ? 'border-warn/40'   : 'border-border', text: blocked > 0 ? 'text-warn'   : 'text-text' },
          { label: 'Critical Open',   value: critical, sub: 'High priority unfinished',     color: critical > 0 ? 'border-danger/40': 'border-border', text: critical > 0 ? 'text-danger' : 'text-text' },
        ].map(s => (
          <div key={s.label} className={`card border ${s.color}`}>
            <p className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`font-syne font-black text-4xl tabular-nums ${s.text}`}>{s.value}</p>
            <p className="text-[11px] text-muted mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Project Health Scores ── */}
      <div className="card">
        <h3 className="font-syne font-bold text-lg mb-4">📊 Project Health Scores</h3>
        {projects.length === 0 ? (
          <p className="text-muted text-sm">No projects found.</p>
        ) : (
          <div className="space-y-3">
            {projectHealth.sort((a, b) => a.score - b.score).map(p => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-surface2 rounded-xl border border-border">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${healthDot(p.status)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {p.daysLeft !== null && (
                        <span className={`text-[10px] font-mono-code ${p.daysLeft < 7 ? 'text-danger' : p.daysLeft < 14 ? 'text-warn' : 'text-muted'}`}>
                          {p.daysLeft < 0 ? `${Math.abs(p.daysLeft)}d overdue` : `${p.daysLeft}d left`}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-lg border font-bold font-mono-code ${healthColor(p.status)}`}>
                        {p.score}/100
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${p.status === 'green' ? 'bg-accent3' : p.status === 'amber' ? 'bg-warn' : 'bg-danger'}`}
                      style={{ width: `${p.score}%` }} />
                  </div>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[10px] text-muted font-mono-code">{p.pt.length} tasks</span>
                    {p.pover > 0 && <span className="text-[10px] text-danger font-mono-code">⚠ {p.pover} overdue</span>}
                    {p.pblocked > 0 && <span className="text-[10px] text-warn font-mono-code">🔒 {p.pblocked} blocked</span>}
                    <span className="text-[10px] text-accent3 font-mono-code">✓ {p.pdone} done</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Risk Alerts + Team Performance (side by side on desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Risk Alerts */}
        <div className="card">
          <h3 className="font-syne font-bold text-lg mb-4">⚠️ Risk Prediction Alerts</h3>
          {riskAlerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-semibold text-sm">All Clear</p>
              <p className="text-muted text-xs mt-1">No risk alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {riskAlerts.slice(0, 8).map((alert, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${riskColor(alert.level)}`}>
                  <span className="shrink-0 mt-0.5">{riskIcon(alert.level)}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs uppercase tracking-wide opacity-70 mb-0.5">{alert.level}</p>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Performance */}
        <div className="card">
          <h3 className="font-syne font-bold text-lg mb-4">👥 Team Performance Analytics</h3>
          {teamStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">👤</p>
              <p className="font-semibold text-sm">No assignees yet</p>
              <p className="text-muted text-xs mt-1">Assign team members to tasks to see performance data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamStats.map(m => {
                const initials = m.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                const barColor = m.rate >= 70 ? '#22d3a5' : m.rate >= 40 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={m.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-[10px] font-black text-black shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold truncate">{m.name}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {m.overdue > 0 && <span className="text-[10px] text-danger font-mono-code">⚠ {m.overdue}</span>}
                          <span className="text-xs font-mono-code font-bold" style={{ color: barColor }}>{m.rate}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-surface2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.rate}%`, background: barColor }} />
                      </div>
                      <p className="text-[10px] text-muted mt-0.5 font-mono-code">{m.done}/{m.total} tasks completed · {m.blocked > 0 ? `${m.blocked} blocked` : 'no blockers'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Insights Panel ── */}
      <div className="card border border-accent/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-lg shrink-0">🤖</div>
            <div>
              <h3 className="font-syne font-bold text-lg">AI Insights & Recommendations</h3>
              <p className="text-xs text-muted">Powered by Claude AI — analysing your live project data</p>
            </div>
          </div>
          {aiInsights && (
            <button onClick={generateInsights} disabled={aiLoading}
              className="text-xs text-accent hover:underline font-mono-code disabled:opacity-50">
              ↻ Refresh
            </button>
          )}
        </div>

        {!aiInsights && !aiLoading && (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <p className="text-4xl mb-3">🧠</p>
            <p className="font-syne font-bold text-lg mb-1">Ready to Analyse Your Portfolio</p>
            <p className="text-muted text-sm mb-4 max-w-sm mx-auto">Click "Generate AI Insights" to get a personalised intelligence report based on your live project data.</p>
            <button onClick={generateInsights}
              className="btn-primary px-6 py-2.5 text-sm">
              🤖 Generate AI Insights
            </button>
          </div>
        )}

        {aiLoading && (
          <div className="text-center py-10">
            <div className="inline-flex items-center gap-3 text-accent">
              <span className="animate-spin text-2xl">⟳</span>
              <span className="font-syne font-semibold">Analysing your project portfolio...</span>
            </div>
            <p className="text-muted text-xs mt-2">This usually takes 5-10 seconds</p>
          </div>
        )}

        {aiInsights && !aiLoading && (
          <div className="prose prose-sm max-w-none">
            <div className="bg-surface2 rounded-xl p-5 border border-border text-sm leading-relaxed whitespace-pre-wrap font-sans text-text">
              {aiInsights}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ReportsClient ──────────────────────────────────────
export default function ReportsClient({ projects, tasks, resources, userId }: {
  projects: Project[]; tasks: Task[]; resources: Resource[]; userId: string
}) {
  const supabase = createClient()
  const [tab, setTab] = useState<'upcoming'|'resource'|'digest'|'intelligence'>('upcoming')
  const [bucket, setBucket]         = useState<'overdue'|'15'|'30'|'45'|'60'|'all'>('30')
  const [projectFilter, setProjectFilter] = useState('all')
  const [localResources, setLocalResources] = useState<Resource[]>(resources)
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [aiLoading, setAiLoading]   = useState<string|null>(null)
  const [editingRes, setEditingRes] = useState<string|null>(null)

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]))

  const tasksWithDue = localTasks.filter(t => t.due_date && t.status !== 'done')
  const byProject = projectFilter === 'all' ? tasksWithDue : tasksWithDue.filter(t => t.project_id === projectFilter)

  function inBucket(days: number, b: string) {
    if (b === 'all')    return true
    if (b === 'overdue') return days < 0
    if (b === '15')     return days >= 0 && days <= 15
    if (b === '30')     return days > 15 && days <= 30
    if (b === '45')     return days > 30 && days <= 45
    if (b === '60')     return days > 45 && days <= 60
    return false
  }

  const bucketTasks = byProject
    .map(t => ({ ...t, days: getDaysUntil(t.due_date!) }))
    .filter(t => inBucket(t.days, bucket))
    .sort((a, b) => a.days - b.days)

  const counts = {
    overdue: byProject.filter(t => getDaysUntil(t.due_date!) < 0).length,
    '15':    byProject.filter(t => { const d = getDaysUntil(t.due_date!); return d >= 0 && d <= 15 }).length,
    '30':    byProject.filter(t => { const d = getDaysUntil(t.due_date!); return d > 15 && d <= 30 }).length,
    '45':    byProject.filter(t => { const d = getDaysUntil(t.due_date!); return d > 30 && d <= 45 }).length,
    '60':    byProject.filter(t => { const d = getDaysUntil(t.due_date!); return d > 45 && d <= 60 }).length,
    all:     byProject.length,
  }

  const activeTasks = localTasks.filter(t => !['done','backlog'].includes(t.status) && t.assignee_name)
  const allNames = [...new Set([
    ...activeTasks.map(t => t.assignee_name!),
    ...localResources.map(r => r.assignee_name),
  ])]

  const resourceStats = allNames.map(name => {
    const myTasks   = activeTasks.filter(t => t.assignee_name === name)
    const allocated = myTasks.reduce((s, t) => s + (t.estimated_hours || 8), 0)
    const res       = localResources.find(r => r.assignee_name === name)
    const available = res?.available_hours_per_week || 40
    const pct       = Math.round((allocated / available) * 100)
    const status    = pct >= 85 ? 'over' : pct >= 80 ? 'risk' : 'ok'
    return { name, myTasks, allocated, available, pct, status, res, projectIds: [...new Set(myTasks.map(t => t.project_id))] }
  }).sort((a, b) => b.pct - a.pct)

  async function aiEstimate(taskId: string, title: string, desc?: string) {
    setAiLoading(taskId)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001', max_tokens: 50,
          messages: [{ role: 'user', content: `IT project task estimation expert. Estimate hours for: "${title}". Description: "${desc||'none'}". Reply with ONE number only. No text.` }]
        })
      })
      const data = await res.json()
      const hrs = parseFloat(data.content?.[0]?.text?.trim())
      if (!isNaN(hrs)) {
        await supabase.from('tasks').update({ estimated_hours: hrs }).eq('id', taskId)
        setLocalTasks(ts => ts.map(t => t.id === taskId ? { ...t, estimated_hours: hrs } : t))
      }
    } finally { setAiLoading(null) }
  }

  async function saveAvailableHours(name: string, hrs: number, projectId?: string) {
    const existing = localResources.find(r => r.assignee_name === name)
    if (existing) {
      await supabase.from('resource_availability').update({ available_hours_per_week: hrs }).eq('id', existing.id)
      setLocalResources(rs => rs.map(r => r.assignee_name === name ? { ...r, available_hours_per_week: hrs } : r))
    } else {
      const pid = projectId || projects[0]?.id
      if (!pid) return
      const { data } = await supabase.from('resource_availability')
        .insert({ assignee_name: name, available_hours_per_week: hrs, project_id: pid, owner_id: userId })
        .select().single()
      if (data) setLocalResources(rs => [...rs, data as Resource])
    }
    setEditingRes(null)
  }

  function exportUpcomingCSV() {
    const rows = [['Task','Project','Assignee','Due Date','Days','Priority','Status','Est. Hours']]
    bucketTasks.forEach(t => rows.push([
      t.title, projectMap[t.project_id]?.name||'', t.assignee_name||'',
      t.due_date||'', String(t.days), t.priority,
      STATUS_LABEL[t.status]||t.status, String(t.estimated_hours||''),
    ]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], {type:'text/csv'})), download: `nexplan-upcoming-${bucket}-${new Date().toISOString().split('T')[0]}.csv` })
    a.click()
  }

  function exportResourceCSV() {
    const rows = [['Name','Allocated Hrs','Available Hrs/Wk','Utilization %','Status','Tasks']]
    resourceStats.forEach(r => rows.push([
      r.name, String(r.allocated), String(r.available), r.pct+'%',
      r.status==='over'?'Overallocated':r.status==='risk'?'At Risk':'Healthy', String(r.myTasks.length),
    ]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], {type:'text/csv'})), download: `nexplan-resources-${new Date().toISOString().split('T')[0]}.csv` })
    a.click()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-1">// Portfolio Reports</p>
          <h1 className="font-syne font-black text-3xl">Reports</h1>
          <p className="text-muted text-sm mt-1">Upcoming deadlines, resource utilization & AI-powered intelligence</p>
        </div>
        {tab !== 'intelligence' && tab !== 'digest' && (
          <button onClick={tab === 'upcoming' ? exportUpcomingCSV : exportResourceCSV}
            className="btn-ghost px-4 py-2 text-sm flex items-center gap-2">
            📥 Export CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl w-fit flex-wrap">
        {([
          ['upcoming',     '📅 Upcoming & Overdue'],
          ['resource',     '👥 Resource Utilization'],
          ['digest',       '📧 Stakeholder Digest'],
          ['intelligence', '🧠 Intelligence Hub'],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── UPCOMING TAB ── */}
      {tab === 'upcoming' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 p-1 bg-surface2 rounded-xl flex-wrap">
              {([
                ['overdue','🚨 Overdue','text-danger'],
                ['15','15 Days','text-warn'],
                ['30','30 Days','text-accent'],
                ['45','45 Days','text-accent2'],
                ['60','60 Days','text-muted'],
                ['all','All','text-text'],
              ] as const).map(([b,label,col]) => (
                <button key={b} onClick={() => setBucket(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${bucket===b ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
                  {label}
                  <span className={`ml-1 font-mono-code text-[10px] ${bucket===b ? col : 'opacity-40'}`}>
                    ({counts[b]})
                  </span>
                </button>
              ))}
            </div>
            <select className="select text-sm py-1.5 w-44" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label:'🚨 Overdue',  count: counts.overdue, color:'text-danger', bg:'bg-danger/10 border-danger/30' },
              { label:'⏰ ≤15 Days', count: counts['15'],   color:'text-warn',   bg:'bg-warn/10 border-warn/30' },
              { label:'📅 ≤30 Days', count: counts['30'],   color:'text-accent', bg:'bg-accent/10 border-accent/30' },
              { label:'📋 ≤45 Days', count: counts['45'],   color:'text-accent2',bg:'bg-accent2/10 border-accent2/30' },
              { label:'🗓️ ≤60 Days',count: counts['60'],   color:'text-muted',  bg:'bg-surface2 border-border' },
            ].map(s => (
              <div key={s.label} className={`card border ${s.bg} text-center py-4`}>
                <p className="text-[10px] text-muted mb-1 font-semibold">{s.label}</p>
                <p className={`font-syne font-black text-4xl ${s.color}`}>{s.count}</p>
              </div>
            ))}
          </div>

          {bucketTasks.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-syne font-bold text-lg">No tasks in this window</p>
              <p className="text-muted text-sm mt-1">All clear for this time period!</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    {['Task','Project','Assignee','Due Date','Days','Priority','Status','Est. Hours'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-syne font-bold text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bucketTasks.map(t => {
                    const proj  = projectMap[t.project_id]
                    const over  = t.days < 0
                    const soon  = t.days >= 0 && t.days <= 15
                    return (
                      <tr key={t.id} className={`border-b border-border/40 hover:bg-surface2 transition-colors ${over ? 'bg-danger/5' : soon ? 'bg-warn/5' : ''}`}>
                        <td className="px-4 py-3 max-w-[180px]"><p className="font-semibold text-sm truncate">{t.title}</p></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: proj?.color||'#00d4ff' }}/>
                            <span className="text-xs text-muted truncate max-w-[100px]">{proj?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{t.assignee_name||'—'}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold font-mono-code ${over ? 'text-danger' : soon ? 'text-warn' : 'text-muted'}`}>
                            {over ? `${Math.abs(t.days)}d over` : `${t.days}d`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold border capitalize ${PRIORITY_COLOR[t.priority]||'text-muted'}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{STATUS_LABEL[t.status]||t.status}</td>
                        <td className="px-4 py-3">
                          {t.estimated_hours ? (
                            <span className="text-xs font-mono-code text-accent font-bold">{t.estimated_hours}h</span>
                          ) : (
                            <button onClick={() => aiEstimate(t.id, t.title, t.description)}
                              disabled={aiLoading === t.id}
                              className="text-[10px] px-2 py-1 bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent/20 transition-all disabled:opacity-50 whitespace-nowrap">
                              {aiLoading === t.id ? '⟳ ...' : '🤖 AI Estimate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── RESOURCE UTILIZATION TAB ── */}
      {tab === 'resource' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'🔴 Overallocated', count: resourceStats.filter(r=>r.status==='over').length,  color:'text-danger', bg:'bg-danger/10 border-danger/30',   sub:'85%+ utilization — immediate action' },
              { label:'🟡 At Risk',       count: resourceStats.filter(r=>r.status==='risk').length,  color:'text-warn',   bg:'bg-warn/10 border-warn/30',       sub:'80–85% — approaching burnout' },
              { label:'🟢 Healthy',       count: resourceStats.filter(r=>r.status==='ok').length,    color:'text-accent3',bg:'bg-accent3/10 border-accent3/30',  sub:'Under 80% — working well' },
            ].map(s => (
              <div key={s.label} className={`card border ${s.bg}`}>
                <p className="text-xs text-muted mb-1 font-semibold">{s.label}</p>
                <p className={`font-syne font-black text-4xl ${s.color}`}>{s.count}</p>
                <p className="text-[10px] text-muted mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {resourceStats.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-4xl mb-3">👥</p>
              <p className="font-syne font-bold text-lg mb-2">No resource data yet</p>
              <p className="text-muted text-sm max-w-sm mx-auto">
                Assign team members to tasks using the <strong>Assignee Name</strong> field in the Kanban Board task editor.
                Once assigned, utilization will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {resourceStats.map(r => {
                const barColor = r.status==='over' ? '#ef4444' : r.status==='risk' ? '#f59e0b' : '#22d3a5'
                const borderCls = r.status==='over' ? 'border-danger/30' : r.status==='risk' ? 'border-warn/30' : 'border-border'
                const isEditing = editingRes === r.name
                const initials = r.name.split(' ').map((n:string) => n[0]).join('').toUpperCase().slice(0,2)
                return (
                  <div key={r.name} className={`card border ${borderCls} space-y-4`}>
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex items-center gap-3 shrink-0 w-44">
                        <div className="w-11 h-11 rounded-full bg-surface2 border border-border flex items-center justify-center font-bold text-sm shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{r.name}</p>
                          <p className="text-xs text-muted">{r.myTasks.length} active task{r.myTasks.length!==1?'s':''}</p>
                        </div>
                      </div>
                      <div className="flex-1 min-w-[220px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted">{r.allocated}h allocated / {r.available}h available per week</span>
                          <span className="font-mono-code font-black text-base" style={{ color: barColor }}>{r.pct}%</span>
                        </div>
                        <div className="w-full h-5 bg-surface2 rounded-full overflow-hidden relative">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(r.pct, 100)}%`, background: barColor }}/>
                          <div className="absolute top-0 bottom-0 w-px bg-warn/60" style={{ left: '80%' }}/>
                          <div className="absolute top-0 bottom-0 w-px bg-danger/60" style={{ left: '85%' }}/>
                        </div>
                        <div className="flex justify-between text-[9px] text-muted mt-1 font-mono-code">
                          <span>0%</span>
                          <span className="text-warn/70" style={{marginLeft:'78%'}}>80%</span>
                          <span className="text-danger/70">85%</span>
                          <span>100%</span>
                        </div>
                        <div className="mt-2">
                          {r.status==='over' && <span className="text-xs bg-danger/10 text-danger border border-danger/30 px-3 py-1 rounded-lg font-semibold">🔴 Overallocated — reduce workload immediately</span>}
                          {r.status==='risk' && <span className="text-xs bg-warn/10 text-warn border border-warn/30 px-3 py-1 rounded-lg font-semibold">🟡 At Risk — approaching burnout threshold (80–85%)</span>}
                          {r.status==='ok'   && <span className="text-xs bg-accent3/10 text-accent3 border border-accent3/30 px-3 py-1 rounded-lg font-semibold">🟢 Healthy — working at good capacity</span>}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <div>
                              <label className="text-[10px] text-muted block mb-1">Hrs/week</label>
                              <input type="number" min="1" max="80" defaultValue={r.available}
                                id={`hrs-${r.name}`} className="input w-20 text-sm py-1.5 text-center"/>
                            </div>
                            <div className="flex flex-col gap-1 mt-4">
                              <button onClick={() => {
                                const el = document.getElementById(`hrs-${r.name}`) as HTMLInputElement
                                saveAvailableHours(r.name, parseFloat(el.value), r.projectIds[0])
                              }} className="btn-primary text-xs px-3 py-1.5">Save</button>
                              <button onClick={() => setEditingRes(null)} className="text-muted hover:text-text text-xs text-center">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setEditingRes(r.name)}
                            className="text-xs text-muted hover:text-accent transition-colors font-mono-code border border-border rounded-lg px-3 py-2 hover:border-accent/30">
                            {r.available}h/wk ✏️
                          </button>
                        )}
                      </div>
                    </div>
                    {r.myTasks.length > 0 && (
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs font-syne font-bold text-muted mb-2">Active Tasks</p>
                        <div className="flex flex-wrap gap-2">
                          {r.myTasks.map(t => {
                            const proj = projectMap[t.project_id]
                            return (
                              <div key={t.id} className="flex items-center gap-2 bg-surface2 border border-border rounded-xl px-3 py-2 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: proj?.color||'#00d4ff' }}/>
                                <span className="font-medium truncate max-w-[140px]">{t.title}</span>
                                <span className="text-muted shrink-0 hidden md:inline">{proj?.name}</span>
                                {t.estimated_hours ? (
                                  <span className="text-accent font-mono-code font-bold shrink-0">{t.estimated_hours}h</span>
                                ) : (
                                  <button onClick={() => aiEstimate(t.id, t.title, t.description)}
                                    disabled={aiLoading===t.id}
                                    className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent border border-accent/30 rounded font-semibold hover:bg-accent/20 disabled:opacity-50 shrink-0">
                                    {aiLoading===t.id ? '...' : '🤖'}
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'digest' && (
        <StakeholderDigest projects={projects} tasks={localTasks} userId={userId} />
      )}

      {tab === 'intelligence' && (
        <ProjectIntelligenceHub projects={projects} tasks={localTasks} />
      )}
    </div>
  )
}
