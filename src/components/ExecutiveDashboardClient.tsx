'use client'
import { useState, useMemo } from 'react'

const STATUS_COLORS: Record<string, string> = {
  done:        'text-green-400 bg-green-500/10 border-green-500/30',
  in_progress: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  review:      'text-amber-400 bg-amber-500/10 border-amber-500/30',
  blocked:     'text-red-400 bg-red-500/10 border-red-500/30',
  backlog:     'text-slate-400 bg-slate-500/10 border-slate-500/30',
}

function healthScore(projTasks: any[]): number {
  if (!projTasks.length) return 70
  const done     = projTasks.filter(t => t.status === 'done').length
  const blocked  = projTasks.filter(t => t.status === 'blocked').length
  const overdue  = projTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
  let score = Math.round((done / projTasks.length) * 60)
  score += 30
  score -= blocked * 8
  score -= overdue * 5
  return Math.max(10, Math.min(100, score))
}

function ragFromScore(score: number) {
  if (score >= 70) return 'green'
  if (score >= 40) return 'amber'
  return 'red'
}

function RagBadge({ rag }: { rag: string }) {
  const map = {
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    red:   'bg-red-500/10 text-red-400 border-red-500/30',
  }
  const label = { green: '🟢 On Track', amber: '🟡 Attention', red: '🔴 At Risk' }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${map[rag as keyof typeof map] || map.green}`}>
      {label[rag as keyof typeof label] || 'On Track'}
    </span>
  )
}

export default function ExecutiveDashboardClient({
  org, workspaces, projects, tasks, members, userId
}: {
  org: any; workspaces: any[]; projects: any[]; tasks: any[]; members: any[]; userId: string
}) {
  const [selectedWs, setSelectedWs] = useState<string>('all')
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingPPT, setExportingPPT] = useState(false)

  // Compute stats per project
  const projectStats = useMemo(() => projects.map(p => {
    const pt    = tasks.filter(t => t.project_id === p.id)
    const done  = pt.filter(t => t.status === 'done').length
    const blocked = pt.filter(t => t.status === 'blocked').length
    const overdue = pt.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
    const score = healthScore(pt)
    const rag   = ragFromScore(score)
    const pct   = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0
    return { ...p, score, rag, pct, done, blocked, overdue, taskCount: pt.length }
  }), [projects, tasks])

  // Compute stats per workspace
  const wsStats = useMemo(() => workspaces.map(ws => {
    const wsProjects = projectStats.filter(p => p.workspace_id === ws.id)
    const wsTasks    = tasks.filter(t => wsProjects.some((p: any) => p.id === t.project_id))
    const done       = wsTasks.filter(t => t.status === 'done').length
    const overdue    = wsTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
    const score      = wsProjects.length > 0
      ? Math.round(wsProjects.reduce((s: number, p: any) => s + p.score, 0) / wsProjects.length)
      : 70
    const rag        = ragFromScore(score)
    const pct        = wsTasks.length > 0 ? Math.round((done / wsTasks.length) * 100) : 0
    return { ...ws, score, rag, pct, projectCount: wsProjects.length, taskCount: wsTasks.length, done, overdue }
  }), [workspaces, projectStats, tasks])

  // Filtered projects
  const filteredProjects = selectedWs === 'all'
    ? projectStats
    : projectStats.filter(p => p.workspace_id === selectedWs)

  // Portfolio totals
  const totalTasks   = tasks.length
  const totalDone    = tasks.filter(t => t.status === 'done').length
  const totalOverdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
  const totalBlocked = tasks.filter(t => t.status === 'blocked').length
  const portfolioPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0
  const atRisk       = projectStats.filter(p => p.rag === 'red').length
  const onTrack      = projectStats.filter(p => p.rag === 'green').length

  async function exportReport(type: 'pdf' | 'ppt') {
    type === 'pdf' ? setExportingPDF(true) : setExportingPPT(true)
    try {
      const endpoint = type === 'pdf' ? '/api/export-pdf' : '/api/export-ppt'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: projectStats,
          tasks,
          risks: [],
          orgName: org.name,
          generatedBy: 'Portfolio Manager',
          aiInsights: null,
        })
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${org.name.replace(/\s+/g, '-')}-Executive-Report-${new Date().toISOString().split('T')[0]}.${type}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(`${type.toUpperCase()} export failed — please try again`)
    } finally {
      type === 'pdf' ? setExportingPDF(false) : setExportingPPT(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-1">// Executive Dashboard</p>
          <h1 className="font-syne font-black text-3xl">{org.name}</h1>
          <p className="text-muted text-sm mt-1">{org.industry} · Portfolio Overview</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => exportReport('pdf')} disabled={exportingPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50">
            {exportingPDF ? '⟳ Generating...' : '📄 Export PDF'}
          </button>
          <button onClick={() => exportReport('ppt')} disabled={exportingPPT}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-500/10 border border-violet-500/30 text-violet-400 rounded-xl hover:bg-violet-500/20 transition-colors disabled:opacity-50">
            {exportingPPT ? '⟳ Generating...' : '📊 Export PPT'}
          </button>
        </div>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Workspaces', value: workspaces.length, color: 'border-accent/30 text-accent' },
          { label: 'Projects', value: projects.length, color: 'border-accent/30 text-accent' },
          { label: 'Total Tasks', value: totalTasks, color: 'border-slate-500/30 text-slate-300' },
          { label: 'Completion', value: `${portfolioPct}%`, color: 'border-green-500/30 text-green-400' },
          { label: 'At Risk', value: atRisk, color: atRisk > 0 ? 'border-red-500/30 text-red-400' : 'border-green-500/30 text-green-400' },
          { label: 'Overdue', value: totalOverdue, color: totalOverdue > 0 ? 'border-amber-500/30 text-amber-400' : 'border-green-500/30 text-green-400' },
        ].map(k => (
          <div key={k.label} className={`card border ${k.color.split(' ')[0]}`}>
            <p className={`font-syne font-black text-3xl tabular-nums ${k.color.split(' ')[1]}`}>{k.value}</p>
            <p className="text-xs text-muted font-bold uppercase tracking-wide mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Portfolio progress bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-syne font-bold text-text">Portfolio Completion</p>
          <p className="text-sm font-syne font-black text-green-400">{portfolioPct}%</p>
        </div>
        <div className="w-full h-3 bg-surface2 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${portfolioPct}%`, background: 'linear-gradient(90deg, #00d4ff, #22d3a5)' }}/>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted">
          <span className="text-green-400">✅ {totalDone} done</span>
          <span className="text-cyan-400">⚡ {tasks.filter(t => t.status === 'in_progress').length} in progress</span>
          <span className="text-red-400">🚫 {totalBlocked} blocked</span>
          <span className="text-amber-400">⚠️ {totalOverdue} overdue</span>
          <span className="text-green-400 ml-auto">🟢 {onTrack} on track</span>
          <span className="text-red-400">🔴 {atRisk} at risk</span>
        </div>
      </div>

      {/* Client Workspace Cards */}
      <div>
        <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-3">// Client Workspaces</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wsStats.map(ws => (
            <div key={ws.id}
              className={`card cursor-pointer transition-all hover:border-accent/40 ${selectedWs === ws.id ? 'border-accent/60 bg-accent/5' : ''}`}
              style={{ borderLeft: `4px solid ${ws.color || '#00d4ff'}` }}
              onClick={() => setSelectedWs(selectedWs === ws.id ? 'all' : ws.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black text-black shrink-0"
                    style={{ background: ws.color || '#00d4ff' }}>
                    {(ws.client_name || ws.name).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-syne font-bold text-sm">{ws.name}</p>
                    {ws.client_name && <p className="text-xs text-muted">{ws.client_name}</p>}
                  </div>
                </div>
                <RagBadge rag={ws.rag} />
              </div>

              {/* Mini health bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">Health Score</span>
                  <span className={ws.rag === 'green' ? 'text-green-400' : ws.rag === 'amber' ? 'text-amber-400' : 'text-red-400'}>
                    {ws.score}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${ws.score}%`,
                      background: ws.rag === 'green' ? '#22d3a5' : ws.rag === 'amber' ? '#f59e0b' : '#ef4444'
                    }}/>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs border-t border-border pt-3">
                <div><p className="font-bold text-text">{ws.projectCount}</p><p className="text-muted">Projects</p></div>
                <div><p className="font-bold text-green-400">{ws.pct}%</p><p className="text-muted">Done</p></div>
                <div><p className={`font-bold ${ws.overdue > 0 ? 'text-amber-400' : 'text-muted'}`}>{ws.overdue}</p><p className="text-muted">Overdue</p></div>
                <div><p className="font-bold text-text">{ws.taskCount}</p><p className="text-muted">Tasks</p></div>
              </div>
            </div>
          ))}

          {workspaces.length === 0 && (
            <div className="card col-span-3 text-center py-12">
              <p className="text-4xl mb-3">🏢</p>
              <p className="font-syne font-bold text-lg mb-1">No Client Workspaces</p>
              <p className="text-muted text-sm">Go to Organisation to create client workspaces</p>
            </div>
          )}
        </div>
      </div>

      {/* Projects Table */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="font-mono-code text-xs text-accent uppercase tracking-widest">
            // Projects {selectedWs !== 'all' && `— ${wsStats.find(w => w.id === selectedWs)?.name || ''}`}
          </p>
          {selectedWs !== 'all' && (
            <button onClick={() => setSelectedWs('all')} className="text-xs text-muted hover:text-text underline">
              ← Show all workspaces
            </button>
          )}
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface2/50">
                  {['Project', 'Workspace', 'Health', 'Progress', 'Tasks', 'Done', 'Overdue', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-syne font-bold text-muted uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProjects.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">No projects found</td></tr>
                ) : filteredProjects.map(p => {
                  const ws = workspaces.find(w => w.id === p.workspace_id)
                  return (
                    <tr key={p.id} className="hover:bg-surface2/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: p.color || '#00d4ff' }}/>
                          <p className="font-semibold text-sm text-text">{p.name}</p>
                        </div>
                        {p.start_date && p.end_date && (
                          <p className="text-xs text-muted mt-0.5 ml-4">
                            {new Date(p.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })} →{' '}
                            {new Date(p.end_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ws ? (
                          <span className="text-xs px-2 py-0.5 rounded-full border font-semibold text-text border-border"
                            style={{ borderColor: ws.color + '60' }}>
                            {ws.client_name || ws.name}
                          </span>
                        ) : <span className="text-xs text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-surface2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{
                                width: `${p.score}%`,
                                background: p.rag === 'green' ? '#22d3a5' : p.rag === 'amber' ? '#f59e0b' : '#ef4444'
                              }}/>
                          </div>
                          <span className={`text-xs font-bold tabular-nums ${p.rag === 'green' ? 'text-green-400' : p.rag === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>
                            {p.score}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-surface2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-green-400"
                              style={{ width: `${p.pct}%` }}/>
                          </div>
                          <span className="text-xs text-green-400 font-bold tabular-nums">{p.pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text font-semibold">{p.taskCount}</td>
                      <td className="px-4 py-3 text-sm text-green-400 font-semibold">{p.done}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${p.overdue > 0 ? 'text-amber-400' : 'text-muted'}`}>
                          {p.overdue}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <RagBadge rag={p.rag} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Team Overview */}
      {members.length > 0 && (
        <div>
          <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-3">// Team Overview</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {members.map((m: any) => {
              const name     = m.profiles?.full_name || m.email?.split('@')[0] || 'Team Member'
              const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              const mTasks   = tasks.filter(t => t.assignee_email === m.email)
              const mDone    = mTasks.filter(t => t.status === 'done').length
              const mRate    = mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0
              return (
                <div key={m.id} className="card flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-xs font-black text-black shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{name}</p>
                    <p className="text-xs text-muted truncate">{m.role?.replace('_', ' ')}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1.5 bg-surface2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-400" style={{ width: `${mRate}%` }}/>
                      </div>
                      <span className="text-[10px] text-green-400 font-bold">{mRate}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
