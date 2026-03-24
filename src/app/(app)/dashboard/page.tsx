import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProjectHealthScore from '@/components/ProjectHealthScore'
import DelayPredictor from '@/components/DelayPredictor'
import DashboardTabs from '@/components/DashboardTabs'
import type { Project } from '@/types'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Load owned projects + member rows + profile in parallel
  const [{ data: ownedProjects }, { data: memberRows }, { data: allTasks }, { data: allRisks }, { data: profile }] = await Promise.all([
    supabase.from('projects').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('project_members').select('project_id, role').eq('user_id', user!.id).eq('status', 'active'),
    supabase.from('tasks').select('*'),
    supabase.from('risk_register').select('*'),
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
  ])

  // Load shared projects
  let sharedProjects: Project[] = []
  if (memberRows && memberRows.length > 0) {
    const ownedIds  = new Set((ownedProjects ?? []).map(p => p.id))
    const sharedIds = memberRows.map(m => m.project_id).filter(id => !ownedIds.has(id))
    if (sharedIds.length > 0) {
      const { data: shared } = await supabase
        .from('projects').select('*').in('id', sharedIds).order('created_at', { ascending: false })
      sharedProjects = (shared ?? []) as Project[]
    }
  }

  // Combine owned + shared
  const membershipMap: Record<string, string> = {}
  ;(memberRows ?? []).forEach(m => { membershipMap[m.project_id] = m.role })

  const projectList = [
    ...(ownedProjects ?? []).map(p => ({ ...p, userRole: 'owner' })),
    ...sharedProjects.map(p => ({ ...p, userRole: membershipMap[p.id] || 'viewer' })),
  ]

  const taskList = allTasks ?? []
  const riskList = allRisks ?? []
  const firstName = (profile?.full_name || 'there').split(' ')[0]
  const isPortfolioManager = profile?.role === 'Portfolio Manager'

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

  const totalTasks    = taskList.filter(t => projectList.some(p => p.id === t.project_id)).length
  const totalDone     = taskList.filter(t => t.status === 'done' && projectList.some(p => p.id === t.project_id)).length
  const totalOverdue  = taskList.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date(new Date().toDateString()) && projectList.some(p => p.id === t.project_id))
  const totalBlocked  = taskList.filter(t => t.status === 'blocked' && projectList.some(p => p.id === t.project_id))
  const totalRedRisks = riskList.filter(r => r.rag_status === 'red' && r.status === 'open' && projectList.some(p => p.id === r.project_id))
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

      {/* AI PROJECT HEALTH SCORE */}
      <ProjectHealthScore
        projects={projectStats}
        totalTasks={totalTasks}
        totalDone={totalDone}
        totalOverdue={totalOverdue.length}
        totalBlocked={totalBlocked.length}
        totalRedRisks={totalRedRisks.length}
        ragCounts={ragCounts}
        portfolioPct={portfolioPct}
      />

      {/* PORTFOLIO TABS — Portfolio Manager only */}
      {isPortfolioManager && (
        <DashboardTabs
          projects={projectList}
          tasks={taskList}
          risks={allRisks ?? []}
        />
      )}

      {/* DELAY PREDICTOR */}
      <DelayPredictor projects={projectList} tasks={taskList} />

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
            { label: 'Done',        count: totalDone,                                                color: 'bg-accent3' },
            { label: 'In Progress', count: taskList.filter(t => t.status === 'in_progress').length, color: 'bg-accent' },
            { label: 'Review',      count: taskList.filter(t => t.status === 'review').length,      color: 'bg-warn' },
            { label: 'Blocked',     count: taskList.filter(t => t.status === 'blocked').length,     color: 'bg-danger' },
            { label: 'Backlog',     count: taskList.filter(t => t.status === 'backlog').length,     color: 'bg-muted' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.color}`}/>
              <span>{s.count} {s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Projects + Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-syne font-bold text-lg">Your Projects</h2>
            <Link href="/kanban" className="text-xs text-accent font-mono-code hover:underline">View All →</Link>
          </div>
          {projectList.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-syne font-bold text-lg mb-2">No projects yet</p>
              <p className="text-muted text-sm mb-4">Create your first project or ask a PM to invite you</p>
              <Link href="/kanban" className="btn-primary px-5 py-2">+ Create Project</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projectStats.map(p => {
                const ragCfg = RAG_CONFIG[p.rag as 'red' | 'amber' | 'green']
                return (
                  <Link key={p.id} href="/kanban"
                    className={`card border ${ragCfg.border} hover:-translate-y-0.5 transition-all flex items-center gap-4`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ragCfg.dot}`}/>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-syne font-bold text-sm truncate">{p.name}</p>
                          {(p as any).userRole && (p as any).userRole !== 'owner' && (
                            <span className="text-[10px] font-mono-code bg-accent/10 text-accent px-1.5 py-0.5 rounded shrink-0">
                              {((p as any).userRole as string).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ragCfg.bg} border ${ragCfg.border}`}
                          style={{ color: ragCfg.color }}>{ragCfg.label}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: p.color || '#00d4ff' }}/>
                          </div>
                          <span className="text-[10px] font-mono-code text-muted shrink-0">{p.progress}%</span>
                        </div>
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
