import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ADMIN_EMAIL = 'admin@nexplan.io'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Protect admin route
  if (user?.email !== ADMIN_EMAIL) redirect('/dashboard')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')

  const { data: articles } = await supabase
    .from('kb_articles')
    .select('*')

  const users = profiles ?? []
  const projectList = projects ?? []
  const taskList = tasks ?? []
  const articleList = articles ?? []

  const countrySet = new Set(users.map((u: any) => u.country).filter(Boolean))
  const countries: string[] = []
  countrySet.forEach((c: any) => countries.push(c))

  const stats = [
    { label: 'Total Users', value: users.length, color: 'border-accent/40' },
    { label: 'Total Projects', value: projectList.length, color: 'border-accent2/40' },
    { label: 'Total Tasks', value: taskList.length, color: 'border-accent3/40' },
    { label: 'KB Articles', value: articleList.length, color: 'border-warn/40' },
    { label: 'Countries', value: countries.length, color: 'border-danger/40' },
    { label: 'AI Articles', value: articleList.filter((a: any) => a.is_ai_generated).length, color: 'border-accent/40' },
  ]

  // User signups per day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const signupsByDay = last7Days.map(day => ({
    date: day,
    count: users.filter((u: any) => u.created_at?.startsWith(day)).length,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-syne font-black text-2xl">Admin Dashboard</h2>
          <p className="text-muted text-sm mt-1">NexPlan platform overview</p>
        </div>
        <span className="text-xs bg-danger/10 text-danger px-3 py-1.5 rounded-lg font-mono-code border border-danger/20">
          Administrator Access
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`card border ${s.color}`}>
            <p className="text-xs font-syne font-bold text-muted uppercase tracking-wider mb-3">{s.label}</p>
            <p className="font-syne font-black text-5xl tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Signup Activity */}
      <div className="card">
        <h3 className="font-syne font-bold text-lg mb-5">User Signups — Last 7 Days</h3>
        <div className="flex items-end gap-3 h-32">
          {signupsByDay.map(d => {
            const max = Math.max(...signupsByDay.map(x => x.count), 1)
            const height = Math.max((d.count / max) * 100, 4)
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-mono-code text-muted">{d.count}</span>
                <div className="w-full rounded-t-lg bg-accent/20 relative" style={{ height: '80px' }}>
                  <div className="absolute bottom-0 w-full rounded-t-lg bg-accent transition-all duration-500"
                    style={{ height: `${height}%` }}/>
                </div>
                <span className="text-[10px] text-muted font-mono-code">
                  {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Countries */}
      {countries.length > 0 && (
        <div className="card">
          <h3 className="font-syne font-bold text-lg mb-4">Users by Country</h3>
          <div className="flex flex-wrap gap-2">
            {countries.map(c => {
              const count = users.filter((u: any) => u.country === c).length
              return (
                <div key={c} className="flex items-center gap-2 px-3 py-2 bg-surface2 rounded-xl">
                  <span className="text-sm font-semibold">{c}</span>
                  <span className="text-xs font-mono-code text-accent bg-accent/10 px-1.5 py-0.5 rounded">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-syne font-bold text-lg">Registered Users</h3>
          <span className="font-mono-code text-xs text-muted">{users.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['User', 'Email', 'Role', 'Country', 'Projects', 'Joined'].map(h => (
                  <th key={h} className="text-left text-xs font-syne font-bold text-muted uppercase tracking-wide py-3 px-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted">No users yet</td></tr>
              ) : users.map((u: any) => {
                const userProjects = projectList.filter((p: any) => p.owner_id === u.id).length
                return (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-[10px] font-black text-black shrink-0">
                          {(u.full_name ?? u.email ?? 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold">{u.full_name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono-code text-xs text-muted">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-lg">{u.role ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted">{u.country ?? '—'}</td>
                    <td className="px-5 py-3.5 font-mono-code text-xs text-accent">{userProjects}</td>
                    <td className="px-5 py-3.5 font-mono-code text-xs text-muted">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
