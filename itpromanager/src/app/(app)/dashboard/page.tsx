import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: projects },
    { data: allTasks },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*, projects!inner(owner_id)').eq('projects.owner_id', user!.id),
  ])

  const projectList = projects ?? []
  const taskList = allTasks ?? []
  const completedTasks = taskList.filter((t: any) => t.status === 'done')
  const blockedTasks = taskList.filter((t: any) => t.status === 'blocked')
  const inProgressTasks = taskList.filter((t: any) => t.status === 'in_progress')
  const atRiskProjects = projectList.filter((p: any) => p.status === 'active' && p.progress < 30)

  const stats = [
    { label: 'Total Projects', value: projectList.length, delta: `${projectList.filter((p: any) => p.status === 'active').length} active`, icon: 'PROJ', color: 'border-accent/40', href: '/kanban' },
    { label: 'Tasks Completed', value: completedTasks.length, delta: `${inProgressTasks.length} in progress`, icon: 'DONE', color: 'border-accent3/40', href: '/kanban' },
    { label: 'Team Members', value: 1, delta: 'Invite coming soon', icon: 'TEAM', color: 'border-accent2/40', href: '/dashboard' },
    { label: 'At Risk', value: atRiskProjects.length + blockedTasks.length, delta: `${blockedTasks.length} blocked tasks`, icon: 'RISK', color: atRiskProjects.length + blockedTasks.length > 0 ? 'border-warn/40' : 'border-accent3/40', href: '/kanban' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className={`card border ${s.color} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer group`}>
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs font-syne font-bold text-muted uppercase tracking-wider">{s.label}</p>
              <span className="text-xs font-mono-code text-muted bg-surface2 px-2 py-1 rounded-lg">{s.icon}</span>
            </div>
            <p className="font-syne font-black text-5xl mb-2 tabular-nums text-text">{s.value}</p>
            <p className="text-xs text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent3 inline-block"/>
              {s.delta}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-syne font-bold text-lg">Recent Activity</h3>
            <span className="font-mono-code text-xs text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent3 animate-pulse"/>Live
            </span>
          </div>
          <div className="space-y-2">
            {[
              { dot: 'bg-accent', text: 'Welcome to NexPlan!' },
              { dot: 'bg-accent3', text: `You have ${projectList.length} project${projectList.length !== 1 ? 's' : ''} in your workspace` },
              { dot: 'bg-accent2', text: `${taskList.length} total tasks across all projects` },
              { dot: 'bg-warn', text: `${completedTasks.length} tasks completed so far` },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 bg-surface2 rounded-xl">
                <div className={`w-2 h-2 rounded-full shrink-0 ${a.dot}`}/>
                <p className="flex-1 text-sm">{a.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs font-syne font-bold text-muted uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { icon: 'KB', label: 'Kanban', href: '/kanban' },
                { icon: 'PP', label: 'Project Plan', href: '/project-plan' },
                { icon: 'KN', label: 'Knowledge', href: '/knowledge' },
                { icon: 'ND', label: 'Network', href: '/network' },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className="flex flex-col items-center gap-2 p-3 bg-surface2 rounded-xl hover:bg-surface border border-transparent hover:border-accent/30 transition-all text-center">
                  <span className="text-xs font-mono-code text-accent">{a.icon}</span>
                  <span className="text-xs font-semibold text-muted">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-syne font-bold text-lg">Projects</h3>
            <Link href="/kanban" className="text-xs text-accent hover:underline font-mono-code">View all</Link>
          </div>
          {projectList.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted text-sm mb-4">No projects yet</p>
              <Link href="/kanban" className="btn-primary text-sm px-4 py-2">+ Create Project</Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {projectList.slice(0, 5).map((p: any) => {
                const projectTasks = taskList.filter((t: any) => t.project_id === p.id)
                const doneTasks = projectTasks.filter((t: any) => t.status === 'done')
                const progress = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : p.progress ?? 0
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

      {taskList.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-syne font-bold text-lg">Task Overview</h3>
            <Link href="/kanban" className="text-xs text-accent hover:underline font-mono-code">Open Board</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Backlog', count: taskList.filter((t: any) => t.status === 'backlog').length, color: 'bg-surface2 text-muted' },
              { label: 'In Progress', count: inProgressTasks.length, color: 'bg-accent/10 text-accent' },
              { label: 'Review', count: taskList.filter((t: any) => t.status === 'review').length, color: 'bg-warn/10 text-warn' },
              { label: 'Blocked', count: blockedTasks.length, color: 'bg-danger/10 text-danger' },
              { label: 'Done', count: completedTasks.length, color: 'bg-accent3/10 text-accent3' },
            ].map(s => (
              <Link href="/kanban" key={s.label}
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
