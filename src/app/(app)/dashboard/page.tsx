import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: projects }, { data: allTasks }] = await Promise.all([
    supabase.from('projects').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*, projects!inner(owner_id)').eq('projects.owner_id', user!.id),
  ])

  const projectList = projects ?? []
  const taskList = allTasks ?? []
  const completedTasks = taskList.filter((t: any) => t.status === 'done')
  const blockedTasks = taskList.filter((t: any) => t.status === 'blocked')
  const inProgressTasks = taskList.filter((t: any) => t.status === 'in_progress')
  const atRisk = projectList.filter((p: any) => p.status === 'active' && p.progress < 30).length + blockedTasks.length

  const stats = [
    { label: 'Total Projects', value: projectList.length, delta: `${projectList.filter((p: any) => p.status === 'active').length} active`, color: 'border-accent/40 hover:border-accent', href: '/project-plan' },
    { label: 'Tasks Completed', value: completedTasks.length, delta: `${inProgressTasks.length} in progress`, color: 'border-accent3/40 hover:border-accent3', href: '/kanban' },
    { label: 'Team Members', value: 1, delta: 'Invite coming soon', color: 'border-accent2/40 hover:border-accent2', href: '/settings' },
    { label: 'At Risk', value: atRisk, delta: `${blockedTasks.length} blocked tasks`, color: atRisk > 0 ? 'border-warn/40 hover:border-warn' : 'border-accent3/40 hover:border-accent3', href: '/kanban' },
  ]

  return (
    <div className="space-y-6">
      {/* Clickable Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className={`card border ${s.color} transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer group`}>
            <p className="text-xs font-syne font-bold text-muted uppercase tracking-wider mb-4">{s.label}</p>
            <p className="font-syne font-black text-5xl mb-2 tabular-nums">{s.value}</p>
            <p className="text-xs text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent3 inline-block"/>
              {s.delta}
            </p>
            <p className="text-xs text-accent mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-mono-code">Click to open →</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-syne font-bold text-lg">Recent Activity</h3>
            <span className="font-mono-code text-xs text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent3 animate-pulse"/>Live
            </span>
          </div>
          <div className="space-y-2 mb-6">
            {[
              { dot: 'bg-accent', text: `${projectList.length} project${projectList.length !== 1 ? 's' : ''} in your workspace` },
              { dot: 'bg-accent3', text: `${completedTasks.length} tasks completed out of ${taskList.length} total` },
              { dot: 'bg-accent2', text: `${inProgressTasks.length} tasks currently in progress` },
              { dot: 'bg-warn', text: atRisk > 0 ? `${atRisk} items need attention` : 'All projects on track!' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 bg-surface2 rounded-xl">
                <div className={`w-2 h-2 rounded-full shrink-0 ${a.dot}`}/>
                <p className="flex-1 text-sm">{a.text}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-syne font-bold text-muted uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Kanban Board', href: '/kanban', desc: 'View tasks' },
                { label: 'Project Plan', href: '/project-plan', desc: 'Plan projects' },
                { label: 'Knowledge Base', href: '/knowledge', desc: 'Find guides' },
                { label: 'Network Diagram', href: '/network', desc: 'View diagrams' },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className="flex flex-col p-3 bg-surface2 rounded-xl hover:bg-surface border border-transparent hover:border-accent/30 transition-all group">
                  <span className="text-sm font-semibold group-hover:text-accent transition-colors">{a.label}</span>
                  <span className="text-xs text-muted mt-0.5">{a.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-syne font-bold text-lg">Projects</h3>
            <Link href="/project-plan" className="text-xs text-accent hover:underline font-mono-code">View all →</Link>
          </div>
          {projectList.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted text-sm mb-4">No projects yet</p>
              <Link href="/project-plan" className="btn-primary text-sm px-4 py-2">+ Create Project</Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {projectList.slice(0, 6).map((p: any) => {
                const projectTasks = taskList.filter((t: any) => t.project_id === p.id)
                const done = projectTasks.filter((t: any) => t.status === 'done')
                const progress = projectTasks.length > 0 ? Math.round((done.length / projectTasks.length) * 100) : p.progress ?? 0
                return (
                  <Link href="/kanban" key={p.id}
                    className="flex items-center gap-3 p-3 bg-surface2 rounded-xl hover:bg-surface border border-transparent hover:border-accent/20 transition-all group">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color ?? '#00d4ff' }}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-accent transition-colors">{p.name}</p>
                      <p className="text-xs text-muted">{projectTasks.length} tasks</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="w-14 h-1.5 bg-border rounded-full mb-1">
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: p.color ?? '#00d4ff' }}/>
                      </div>
                      <p className="text-[10px] text-muted font-mono-code">{progress}%</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Task Overview */}
      {taskList.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-syne font-bold text-lg">Task Overview</h3>
            <Link href="/kanban" className="text-xs text-accent hover:underline font-mono-code">Open Kanban Board →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Backlog', count: taskList.filter((t: any) => t.status === 'backlog').length, color: 'bg-surface2 text-muted', href: '/kanban' },
              { label: 'In Progress', count: inProgressTasks.length, color: 'bg-accent/10 text-accent', href: '/kanban' },
              { label: 'Review', count: taskList.filter((t: any) => t.status === 'review').length, color: 'bg-warn/10 text-warn', href: '/kanban' },
              { label: 'Blocked', count: blockedTasks.length, color: 'bg-danger/10 text-danger', href: '/kanban' },
              { label: 'Done', count: completedTasks.length, color: 'bg-accent3/10 text-accent3', href: '/kanban' },
            ].map(s => (
              <Link href={s.href} key={s.label}
                className={`flex flex-col items-center p-4 rounded-xl ${s.color} hover:scale-105 transition-transform cursor-pointer`}>
                <span className="font-syne font-black text-3xl tabular-nums">{s.count}</span>
                <span className="text-xs font-semibold mt-1">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
