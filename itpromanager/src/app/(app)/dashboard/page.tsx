import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count: projectCount }, { count: taskCount }, { data: projects }, { data: tasks }] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', user!.id),
    supabase.from('tasks').select('*, projects!inner(owner_id)', { count: 'exact', head: true }).eq('projects.owner_id', user!.id),
    supabase.from('projects').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('tasks').select('*, projects!inner(owner_id)').eq('projects.owner_id', user!.id).eq('status', 'done').limit(100),
  ])

  const completedCount = tasks?.length ?? 0
  const atRisk = (projects ?? []).filter(p => p.status === 'active' && p.progress < 30).length

  const stats = [
    { label: 'Active Projects', value: projectCount ?? 0, delta: 'This workspace', icon: '📁', color: 'border-accent/30 hover:border-accent' },
    { label: 'Tasks Completed', value: completedCount, delta: 'All time', icon: '✅', color: 'border-accent3/30 hover:border-accent3' },
    { label: 'Team Members', value: 1, delta: 'Invite more soon', icon: '👥', color: 'border-accent2/30 hover:border-accent2' },
    { label: 'At Risk Items', value: atRisk, delta: atRisk > 0 ? 'Needs attention' : 'All good!', icon: atRisk > 0 ? '⚠️' : '✅', color: 'border-warn/30 hover:border-warn' },
  ]

  const activity = [
    { dot: 'bg-accent',  text: 'Welcome to ITProManager!', time: 'Just now' },
    { dot: 'bg-accent3', text: 'Your workspace is ready to use', time: '1m ago' },
    { dot: 'bg-accent2', text: 'Try creating your first project', time: '2m ago' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`card border transition-all duration-200 ${s.color}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-syne font-semibold text-muted uppercase tracking-wide">{s.label}</p>
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="font-syne font-black text-4xl mb-1">{s.value.toLocaleString()}</p>
            <p className="text-xs text-accent3">{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-syne font-bold">Recent Activity</h3>
            <span className="font-mono-code text-xs text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent3 animate-pulse"/>Live
            </span>
          </div>
          <div className="space-y-2">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface2 rounded-xl">
                <div className={`w-2 h-2 rounded-full shrink-0 ${a.dot}`}/>
                <p className="flex-1 text-sm">{a.text}</p>
                <span className="font-mono-code text-xs text-muted">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-syne font-bold">Projects</h3>
            <Link href="/project-plan" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          {(projects ?? []).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">📁</p>
              <p className="text-muted text-sm mb-4">No projects yet</p>
              <button className="btn-primary text-sm px-4 py-2">+ Create Project</button>
            </div>
          ) : (
            <div className="space-y-3">
              {(projects ?? []).map(p => (
                <Link href="/kanban" key={p.id} className="flex items-center gap-3 p-3 bg-surface2 rounded-xl hover:bg-surface transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted">{p.status}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-1.5 bg-border rounded-full">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: p.color }}/>
                    </div>
                    <p className="text-xs text-muted mt-1">{p.progress}%</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="font-syne font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon:'📋', label:'Open Kanban', href:'/kanban' },
            { icon:'📅', label:'Project Plan', href:'/project-plan' },
            { icon:'🗺️', label:'Network Diagram', href:'/network' },
            { icon:'📚', label:'Knowledge Base', href:'/knowledge' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="flex flex-col items-center gap-2 p-4 bg-surface2 rounded-xl hover:bg-surface hover:border hover:border-accent/30 border border-transparent transition-all text-center">
              <span className="text-2xl">{a.icon}</span>
              <span className="text-sm font-semibold">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
