import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function getRAG(tasks: any[], risks: any[]): 'red' | 'amber' | 'green' {
  const blocked = tasks.filter(t => t.status === 'blocked').length
  const overdue = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false
    return new Date(t.due_date) < new Date(new Date().toDateString())
  }).length
  const redRisks = risks.filter(r => r.rag_status === 'red' && r.status === 'open').length
  if (blocked > 0 || overdue > 2 || redRisks > 1) return 'red'
  if (overdue > 0 || redRisks > 0) return 'amber'
  return 'green'
}

function getProgress(tasks: any[]): number {
  if (tasks.length === 0) return 0
  const weights: Record<string, number> = { done: 100, review: 80, in_progress: 50, blocked: 25, backlog: 0 }
  const total = tasks.reduce((sum, t) => sum + (weights[t.status] || 0), 0)
  return Math.round(total / tasks.length)
}

const RAG_CONFIG = {
  red:   { label: 'At Risk',         color: '#ef4444', bg: 'bg-danger/10',  border: 'border-danger/30',  dot: 'bg-danger' },
  amber: { label: 'Needs Attention', color: '#f59e0b', bg: 'bg-warn/10',    border: 'border-warn/30',    dot: 'bg-warn' },
  green: { label: 'On Track',        color: '#22d3a5', bg: 'bg-accent3/10', border: 'border-accent3/30', dot: 'bg-accent3' },
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: projects }, { data: allTasks }, { data: allRisks }, { data: profile }] = await Promise.all([
    supabase.from('projects').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*'),
    supabase.from('risk_register').select('*'),
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
  ])

  const projectList = projects ?? []
  const taskList = allTasks ?? []
  const riskList = allRisks ?? []
  const firstName = (profile?.full_name || 'there').split(' ')[0]

  const projectStats = projectList.map(p => {
    const tasks = taskList.filter(t => t.project_id === p.id)
    const risks = riskList.filter(r => r.project_id === p.id)
    const rag = getRAG(tasks, risks) as 'red' | 'amber' | 'green'
    const progress = getProgress(tasks)
    const overdue = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date(new Date().toDateString()))
    const blocked = tasks.filter(t => t.status === 'blocked')
    const redRisks = risks.filter(r => r.rag_status === 'red' && r.status === 'open')
    const daysLeft = p.end_date ? Math.ceil((new Date(p.end_date).getTime() - new Date().getTime()) / 86400000) : null
    return { ...p, tasks, risks, rag, progress, overdue, blocked, redRisks, daysLeft }
  })

  const totalTasks    = taskList.length
  const totalDone     = taskList.filter(t => t.status === 'done').length
  const totalOverdue  = taskList.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date(new Date().toDateString()))
  const totalBlocked  = taskList.filter(t => t.status === 'blocked')
  const totalRedRisks = riskList.filter(r => r.rag_status === 'red' && r.status === 'open')
  const portfolioPct  = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0
  const ragCounts     = { red: projectStats.filter(p => p.rag === 'red').length, amber: projectStats.filter(p => p.rag === 'amber').length, green: projectStats.filter(p => p.rag === 'green').length }

  const overdueWithProject = totalOverdue.map(t => ({
    ...t,
    projectName:  projectList.find(p => p.id === t.project_id)?.name  || 'Unknown',
    projectColor: projectList.find(p => p.id === t.project_id)?.color || '#00d4ff',
  })).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-1">// Portfolio Dashboard</p>
          <h1 className="font-syne font-black text-3xl">Good day, {firstName}! 👋</h1>
          <p className="text-muted text-sm mt-1">{new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
        <Link href="/kanban" className="btn-primary px-5 py-2.5 text-sm">Open Kanban Board →</Link>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects',     value: projectList.length,  sub: `${ragCounts.green} on track`,           color: 'text-accent',  border: 'border-accent/30',  bg: 'bg-accent/5' },
          { label: '🔴 At Risk',         value: ragCounts.red,       sub: `${totalBlocked.length} blocked tasks`,  color: 'text-danger',  border: 'border-danger/30',  bg: 'bg-danger/5' },
          { label: '🟡 Needs Attention', value: ragCounts.amber,     sub: `${totalRedRisks.length} red risks`,     color: 'text-warn',    border: 'border-warn/30',    bg: 'bg-warn/5' },
          { label: '⚠️ Overdue Tasks',   value: totalOverdue.length, sub: `across all projects`,                  color: totalOverdue.length > 0 ? 'text-danger' : 'text-accent3', border: totalOverdue.length > 0 ? 'border-danger/30' : 'border-accent3/30', bg: totalOverdue.length > 0 ? 'bg-danger/5' : 'bg-accent3/5' },
        ].map(s => (
          <div key={s.label} className={`card border ${s.border} ${s.bg}`}>
            <p className="text-xs font-syne font-bold text-muted uppercase tracking-wider mb-3">{s.label}</p>
            <p className={`font-syne font-black text-5xl mb-1 tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Portfolio progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-syne font-bold text-sm">Portfolio Overall Progress</p>
            <p className="text-xs text-muted">{totalDone} of {totalTasks} tasks complete across all projects</p>
          </div>
          <span className="font-syne font-black text-2xl text-accent">{portfolioPct}%</span>
        </div>
        <div className="w-full h-3 bg-surface2 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${portfolioPct}%` }}/>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted flex-wrap">
          {[
            { label: 'Done',        count: totalDone,                                                   color: 'bg-accent3' },
            { label: 'In Progress', count: taskList.filter(t => t.status === 'in_progress').length,    color: 'bg-accent' },
            { label: 'Review',      count: taskList.filter(t => t.status === 'review').length,          color: 'bg-warn' },
            { label: 'Blocked',     count: totalBlocked.length,                                         color: 'bg-danger' },
            { label: 'Backlog',     count: taskList.filter(t => t.status === 'backlog').length,         color: 'bg-border' },
          ].map(s => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.color}`}/>{s.count} {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Project Health Grid */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-syne font-bold text-lg">Project Health</h3>
              <p className="text-xs text-muted">RAG status across your portfolio</p>
            </div>
            <div className="flex gap-2 text-xs">
              {(Object.entries(ragCounts) as ['red'|'amber'|'green', number][]).map(([rag, count]) => (
                <span key={rag} className={`px-2.5 py-1 rounded-lg font-semibold border ${RAG_CONFIG[rag].bg} ${RAG_CONFIG[rag].border}`}
                  style={{ color: RAG_CONFIG[rag].color }}>
                  {count} {rag}
                </span>
              ))}
            </div>
          </div>

          {projectList.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-sm mb-3">No projects yet</p>
              <Link href="/kanban" className="btn-primary text-sm px-4 py-2">Create First Project →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projectStats.map(p => {
                const ragCfg = RAG_CONFIG[p.rag]
                return (
                  <Link href="/kanban" key={p.id}
                    className="flex items-center gap-4 p-4 bg-surface2 rounded-xl border border-border hover:border-accent/30 transition-all group">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${ragCfg.dot}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || '#00d4ff' }}/>
                        <p className="font-semibold text-sm truncate group-hover:text-accent transition-colors">{p.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${ragCfg.bg} ${ragCfg.border} shrink-0`}
                          style={{ color: ragCfg.color }}>{ragCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: p.color || '#00d4ff' }}/>
                        </div>
                        <span className="text-[10px] font-mono-code text-muted shrink-0">{p.progress}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs shrink-0">
                      <div className="text-center hidden md:block">
                        <p className="font-bold text-sm">{p.tasks.length}</p>
                        <p className="text-muted text-[10px]">Tasks</p>
                      </div>
                      {p.overdue.length > 0 && (
                        <div className="text-center">
                          <p className="font-bold text-sm text-danger">{p.overdue.length}</p>
                          <p className="text-muted text-[10px]">Overdue</p>
                        </div>
                      )}
                      {p.redRisks.length > 0 && (
                        <div className="text-center">
                          <p className="font-bold text-sm text-danger">{p.redRisks.length}</p>
                          <p className="text-muted text-[10px]">Red Risk</p>
                        </div>
                      )}
                      {p.daysLeft !== null && (
                        <div className="text-center hidden lg:block">
                          <p className={`font-bold text-sm ${p.daysLeft < 0 ? 'text-danger' : p.daysLeft < 7 ? 'text-warn' : 'text-muted'}`}>
                            {p.daysLeft < 0 ? `${Math.abs(p.daysLeft)}d over` : `${p.daysLeft}d`}
                          </p>
                          <p className="text-muted text-[10px]">{p.daysLeft < 0 ? 'overrun' : 'left'}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Overdue Tasks */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne font-bold text-base">🚨 Overdue Tasks</h3>
              <span className={`text-xs font-mono-code font-bold ${overdueWithProject.length > 0 ? 'text-danger' : 'text-accent3'}`}>
                {overdueWithProject.length}
              </span>
            </div>
            {overdueWithProject.length === 0 ? (
              <div className="text-center py-6 text-accent3">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm font-semibold">No overdue tasks!</p>
                <p className="text-xs text-muted mt-1">All tasks on schedule</p>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueWithProject.slice(0, 6).map((t: any) => {
                  const daysOver = Math.ceil((new Date().getTime() - new Date(t.due_date).getTime()) / 86400000)
                  return (
                    <div key={t.id} className="flex items-start gap-2.5 p-2.5 bg-danger/5 border border-danger/15 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-danger shrink-0 mt-1.5"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{t.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.projectColor }}/>
                          <p className="text-[10px] text-muted truncate">{t.projectName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-danger font-semibold shrink-0">{daysOver}d over</span>
                    </div>
                  )
                })}
                {overdueWithProject.length > 6 && (
                  <p className="text-xs text-muted text-center pt-1">+{overdueWithProject.length - 6} more</p>
                )}
              </div>
            )}
          </div>

          {/* Risk Summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne font-bold text-base">🛡️ Risk Summary</h3>
              <Link href="/kanban" className="text-xs text-accent hover:underline font-mono-code">View →</Link>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: '🔴 Red',   count: riskList.filter((r:any) => r.rag_status==='red'   && r.status==='open').length, color: 'text-danger' },
                { label: '🟡 Amber', count: riskList.filter((r:any) => r.rag_status==='amber' && r.status==='open').length, color: 'text-warn' },
                { label: '🟢 Green', count: riskList.filter((r:any) => r.rag_status==='green' && r.status==='open').length, color: 'text-accent3' },
              ].map(s => (
                <div key={s.label} className="bg-surface2 rounded-xl p-2.5 text-center">
                  <p className={`font-black text-2xl ${s.color}`}>{s.count}</p>
                  <p className="text-[10px] text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {totalRedRisks.length > 0 ? (
              <div className="space-y-1.5">
                {totalRedRisks.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="flex items-start gap-2 p-2.5 bg-danger/5 border border-danger/15 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-danger shrink-0 mt-1"/>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{r.title}</p>
                      <p className="text-[10px] text-muted">{projectList.find(p => p.id === r.project_id)?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted text-center py-2">No red risks — portfolio looks healthy ✅</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-syne font-bold text-base mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon:'📋', label:'Kanban Board',   sub:'Manage tasks',   href:'/kanban' },
                { icon:'📚', label:'Knowledge Base', sub:'42 IT guides',   href:'/knowledge' },
                { icon:'✅', label:'My Tasks',       sub:'Assigned to me', href:'/my-tasks' },
                { icon:'❓', label:'Help Center',    sub:'How-to guides',  href:'/help' },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  className="flex items-center gap-3 p-3 bg-surface2 rounded-xl border border-transparent hover:border-accent/30 transition-all group">
                  <span className="text-xl">{a.icon}</span>
                  <div>
                    <p className="text-xs font-semibold group-hover:text-accent transition-colors">{a.label}</p>
                    <p className="text-[10px] text-muted">{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
