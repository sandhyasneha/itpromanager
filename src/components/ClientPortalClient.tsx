'use client'
import { useState, useMemo } from 'react'

const COL_W = 28
const NAME_W = 220

function healthScore(tasks: any[]): number {
  if (!tasks.length) return 75
  const done    = tasks.filter(t => t.status === 'done').length
  const blocked = tasks.filter(t => t.status === 'blocked').length
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
  let score = Math.round((done / tasks.length) * 60) + 30
  score -= blocked * 8
  score -= overdue * 5
  return Math.max(10, Math.min(100, score))
}

function ragFromScore(s: number) { return s >= 70 ? 'green' : s >= 40 ? 'amber' : 'red' }

function RagBadge({ rag }: { rag: string }) {
  const styles = { green: 'bg-green-500/10 text-green-400 border-green-500/30', amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30', red: 'bg-red-500/10 text-red-400 border-red-500/30' }
  const labels = { green: '🟢 On Track', amber: '🟡 Needs Attention', red: '🔴 At Risk' }
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${styles[rag as keyof typeof styles]}`}>{labels[rag as keyof typeof labels]}</span>
}

const STATUS_COLORS: Record<string, string> = {
  done: '#22d3a5', in_progress: '#00d4ff', review: '#f59e0b', blocked: '#ef4444', backlog: '#6b7280'
}

export default function ClientPortalClient({
  workspace, projects, tasks, risks, orgName, clientName, userId
}: {
  workspace: any; projects: any[]; tasks: any[]; risks: any[]
  orgName: string; clientName: string; userId: string
}) {
  const [activeTab, setActiveTab]     = useState<'overview' | 'gantt' | 'risks'>('overview')
  const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id || '')
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingPPT, setExportingPPT] = useState(false)

  const currentProject = projects.find(p => p.id === selectedProject) || projects[0]
  const projectTasks   = tasks.filter(t => t.project_id === currentProject?.id)
  const scheduledTasks = projectTasks.filter(t => t.start_date && t.end_date)

  // Portfolio health
  const projectStats = useMemo(() => projects.map(p => {
    const pt    = tasks.filter(t => t.project_id === p.id)
    const done  = pt.filter(t => t.status === 'done').length
    const score = healthScore(pt)
    const rag   = ragFromScore(score)
    const pct   = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0
    return { ...p, score, rag, pct, done, taskCount: pt.length }
  }), [projects, tasks])

  const totalTasks = tasks.length
  const totalDone  = tasks.filter(t => t.status === 'done').length
  const overdue    = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
  const pct        = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  // Gantt timeline
  const startDate = currentProject?.start_date
  const endDate   = currentProject?.end_date
  const days      = useMemo(() => {
    if (!startDate || !endDate) return []
    const arr = []
    let cur = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    while (cur <= end) {
      arr.push({ date: new Date(cur), label: String(cur.getDate()), isWeekend: cur.getDay() === 0 || cur.getDay() === 6 })
      cur.setDate(cur.getDate() + 1)
    }
    return arr
  }, [startDate, endDate])

  const monthGroups = useMemo(() => {
    const groups: { label: string; count: number }[] = []
    days.forEach(d => {
      const label = d.date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      if (groups.length === 0 || groups[groups.length - 1].label !== label) groups.push({ label, count: 1 })
      else groups[groups.length - 1].count++
    })
    return groups
  }, [days])

  const todayStr  = new Date().toISOString().split('T')[0]
  const todayIdx  = days.findIndex(d => d.date.toISOString().split('T')[0] === todayStr)
  const projStart = startDate || ''

  function daysBetween(a: string, b: string) {
    return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
  }

  async function exportReport(type: 'pdf' | 'ppt') {
    type === 'pdf' ? setExportingPDF(true) : setExportingPPT(true)
    try {
      const res = await fetch(`/api/export-${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: projectStats,
          tasks,
          risks,
          orgName: workspace?.name || orgName,
          generatedBy: clientName,
          aiInsights: null,
        })
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${workspace?.name || 'Report'}-${new Date().toISOString().split('T')[0]}.${type}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert(`${type.toUpperCase()} export failed`)
    } finally {
      type === 'pdf' ? setExportingPDF(false) : setExportingPPT(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono-code text-accent uppercase tracking-widest">// Client Portal</span>
            <span className="text-xs bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-bold">Read Only</span>
          </div>
          <h1 className="font-syne font-black text-3xl">
            {workspace?.client_name || workspace?.name || orgName}
          </h1>
          <p className="text-muted text-sm mt-1">
            Welcome back, <span className="text-text font-semibold">{clientName}</span> · {orgName} Portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportReport('pdf')} disabled={exportingPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 disabled:opacity-50">
            {exportingPDF ? '⟳ Generating...' : '📄 Export PDF'}
          </button>
          <button onClick={() => exportReport('ppt')} disabled={exportingPPT}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-500/10 border border-violet-500/30 text-violet-400 rounded-xl hover:bg-violet-500/20 disabled:opacity-50">
            {exportingPPT ? '⟳ Generating...' : '📊 Export PPT'}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Projects', value: projects.length, color: 'text-accent border-accent/30' },
          { label: 'Completion', value: `${pct}%`, color: 'text-green-400 border-green-500/30' },
          { label: 'Overdue', value: overdue, color: overdue > 0 ? 'text-amber-400 border-amber-500/30' : 'text-green-400 border-green-500/30' },
          { label: 'Open Risks', value: risks.filter(r => r.rag_status === 'red').length, color: risks.filter(r => r.rag_status === 'red').length > 0 ? 'text-red-400 border-red-500/30' : 'text-green-400 border-green-500/30' },
        ].map(k => (
          <div key={k.label} className={`card border ${k.color.split(' ')[1]}`}>
            <p className={`font-syne font-black text-3xl ${k.color.split(' ')[0]}`}>{k.value}</p>
            <p className="text-xs text-muted font-bold uppercase tracking-wide mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl w-fit">
        {[['overview','📊 Overview'],['gantt','📅 Timeline'],['risks','⚠️ Risks']].map(([t, label]) => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectStats.map(p => (
              <div key={p.id} className="card cursor-pointer hover:border-accent/40 transition-all"
                style={{ borderLeft: `4px solid ${p.color || '#00d4ff'}` }}
                onClick={() => { setSelectedProject(p.id); setActiveTab('gantt') }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-syne font-bold text-sm">{p.name}</p>
                    {p.start_date && p.end_date && (
                      <p className="text-xs text-muted mt-0.5">
                        {new Date(p.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} →{' '}
                        {new Date(p.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <RagBadge rag={p.rag} />
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">Progress</span>
                    <span className="text-green-400 font-bold">{p.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.rag === 'green' ? '#22d3a5' : p.rag === 'amber' ? '#f59e0b' : '#ef4444' }}/>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>{p.done} of {p.taskCount} tasks done</span>
                  <span className="text-accent">View Timeline →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GANTT TAB */}
      {activeTab === 'gantt' && (
        <div className="space-y-4">
          {/* Project selector */}
          {projects.length > 1 && (
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted font-semibold uppercase tracking-wide">Project:</label>
              <select className="select text-sm w-auto" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {!currentProject?.start_date || !currentProject?.end_date ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-syne font-bold text-lg">No timeline set for this project</p>
            </div>
          ) : scheduledTasks.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-syne font-bold text-lg">No scheduled tasks yet</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <div style={{ minWidth: `${NAME_W + days.length * COL_W}px` }}>
                  {/* Month headers */}
                  <div className="flex border-b border-border bg-surface2/50">
                    <div style={{ width: NAME_W, minWidth: NAME_W }} className="shrink-0 border-r border-border px-3 flex items-center">
                      <span className="text-xs font-bold text-muted uppercase">TASK</span>
                    </div>
                    <div className="flex">
                      {monthGroups.map((mg, i) => (
                        <div key={i} className="border-r border-border/50 flex items-center justify-center" style={{ width: mg.count * COL_W, height: 28 }}>
                          <span className="text-xs font-syne font-bold text-text px-2 truncate">{mg.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Day headers */}
                  <div className="flex border-b border-border">
                    <div style={{ width: NAME_W, minWidth: NAME_W }} className="shrink-0 border-r border-border h-7"/>
                    <div className="flex">
                      {days.map((d, i) => (
                        <div key={i} className={`flex items-center justify-center border-r border-border/20 h-7 ${i === todayIdx ? 'bg-accent/20' : d.isWeekend ? 'bg-surface2/40' : ''}`}
                          style={{ width: COL_W, minWidth: COL_W }}>
                          <span className={`text-[9px] font-mono-code ${i === todayIdx ? 'text-accent font-bold' : d.isWeekend ? 'text-muted/50' : 'text-muted'}`}>{d.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Task rows */}
                  {scheduledTasks.map(t => {
                    const startIdx = daysBetween(projStart, t.start_date!)
                    const duration = daysBetween(t.start_date!, t.end_date!) + 1
                    const col      = STATUS_COLORS[t.status] || STATUS_COLORS.backlog
                    const pct      = t.status === 'done' ? 100 : t.status === 'review' ? 80 : t.status === 'in_progress' ? 50 : t.status === 'blocked' ? 20 : 0
                    return (
                      <div key={t.id} className="flex border-b border-border/30 hover:bg-surface2/20">
                        <div style={{ width: NAME_W, minWidth: NAME_W }} className="shrink-0 border-r border-border px-3 py-2 flex flex-col justify-center">
                          <p className="text-xs font-semibold text-text truncate">{t.title}</p>
                          <p className="text-[10px] text-muted">{t.status.replace('_', ' ')}</p>
                        </div>
                        <div className="flex relative" style={{ height: 40 }}>
                          {days.map((d, i) => (
                            <div key={i} className={`border-r border-border/10 h-full ${d.isWeekend ? 'bg-surface2/20' : ''}`}
                              style={{ width: COL_W, minWidth: COL_W }}/>
                          ))}
                          {startIdx >= 0 && startIdx < days.length && (
                            <div className="absolute top-2 rounded-full flex items-center overflow-hidden"
                              style={{ left: startIdx * COL_W + 2, width: Math.max(duration * COL_W - 4, COL_W - 4), height: 22, background: col + '30', border: `1px solid ${col}` }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col }}/>
                              <span className="absolute left-2 text-[9px] font-bold text-white truncate px-1">{t.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RISKS TAB */}
      {activeTab === 'risks' && (
        <div className="space-y-3">
          {risks.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-syne font-bold text-lg text-green-400">No open risks at this time</p>
              <p className="text-muted text-sm mt-1">Your portfolio is looking healthy</p>
            </div>
          ) : risks.map((r: any) => {
            const col = r.rag_status === 'red' ? 'border-red-500/30 bg-red-500/5' : r.rag_status === 'amber' ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5'
            const textCol = r.rag_status === 'red' ? 'text-red-400' : r.rag_status === 'amber' ? 'text-amber-400' : 'text-green-400'
            return (
              <div key={r.id} className={`card border ${col}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`font-syne font-bold text-sm ${textCol}`}>{r.title}</p>
                    {r.description && <p className="text-xs text-muted mt-1">{r.description}</p>}
                    {r.mitigation && <p className="text-xs text-accent mt-1">💡 Mitigation: {r.mitigation}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${col} ${textCol}`}>
                      {r.rag_status?.toUpperCase() || 'MEDIUM'}
                    </span>
                    {r.owner && <span className="text-xs text-muted">Owner: {r.owner}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
