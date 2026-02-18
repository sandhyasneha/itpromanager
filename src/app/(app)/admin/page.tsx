import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const users = profiles ?? []
  const countries = Array.from(new Set(users.map((u) => u.country).filter(Boolean)))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',    value: users.length, icon: '👥', color: 'border-accent/30' },
          { label: 'Countries',      value: countries.length, icon: '🌍', color: 'border-accent2/30' },
          { label: 'PMs',            value: users.filter(u => u.role === 'IT Project Manager').length, icon: '🧑‍💼', color: 'border-accent3/30' },
          { label: 'Engineers',      value: users.filter(u => u.role === 'Network Engineer').length, icon: '🌐', color: 'border-warn/30' },
        ].map(s => (
          <div className=`card border ${s.color}`>
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-syne font-semibold text-muted uppercase">{s.label}</p>
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="font-syne font-black text-4xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-syne font-bold">Registered Users</h3>
          <span className="font-mono-code text-xs text-muted">{users.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Name','Email','Role','Country','Joined'].map(h => (
                  <th key={h} className="text-left text-xs font-syne font-bold text-muted uppercase tracking-wide pb-3 px-4 border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted">No users yet</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-surface2 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-[10px] font-black text-black shrink-0">
                        {(u.full_name ?? u.email ?? 'U').slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold">{u.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono-code text-xs text-muted">{u.email}</td>
                  <td className="px-4 py-3.5"><span className="tag-chip bg-accent/10 text-accent text-xs">{u.role ?? '—'}</span></td>
                  <td className="px-4 py-3.5 text-sm text-muted">{u.country ?? '—'}</td>
                  <td className="px-4 py-3.5 font-mono-code text-xs text-muted">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
