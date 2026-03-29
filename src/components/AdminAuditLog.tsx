// src/components/AdminAuditLog.tsx
// Combined audit log — shows both agent_logs (old) and activity_logs (new)

'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORY_COLORS: Record<string, string> = {
  task:      'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  project:   'bg-violet-500/10 text-violet-400 border-violet-500/30',
  org:       'bg-amber-500/10 text-amber-400 border-amber-500/30',
  workspace: 'bg-green-500/10 text-green-400 border-green-500/30',
  auth:      'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

function actionLabel(action: string, oldVal?: string | null, newVal?: string | null): string {
  const map: Record<string, string> = {
    'task.created':           'Created task',
    'task.assigned':          `Assigned to ${newVal || ''}`,
    'task.status_changed':    `Status: ${oldVal || '?'} → ${newVal || '?'}`,
    'task.priority_changed':  `Priority: ${oldVal || '?'} → ${newVal || '?'}`,
    'task.due_date_changed':  `Due date → ${newVal || '?'}`,
    'task.deleted':           'Deleted task',
    'project.created':        'Created project',
    'project.updated':        'Updated project',
    'project.deleted':        'Deleted project',
    'org.member_invited':     `Invited ${newVal || ''} to org`,
    'org.member_joined':      `Joined org`,
    'org.updated':            'Updated org settings',
    'workspace.created':      'Created workspace',
    'workspace.updated':      'Updated workspace',
    'workspace.status_changed': `Workspace: ${oldVal || '?'} → ${newVal || '?'}`,
    'auth.login':             'Logged in',
    'auth.plan_upgraded':     `Plan → ${newVal || '?'}`,
  }
  return map[action] || action.replace('.', ': ').replace(/_/g, ' ')
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminAuditLog() {
  const supabase = createClient()
  const [subTab, setSubTab]       = useState<'activity' | 'agent'>('activity')

  // Activity logs state
  const [actLogs, setActLogs]     = useState<any[]>([])
  const [actLoading, setActLoading] = useState(true)
  const [actCategory, setActCategory] = useState('all')
  const [actSearch, setActSearch] = useState('')
  const [actPage, setActPage]     = useState(0)

  // Agent logs state (existing)
  const [agentLogs, setAgentLogs] = useState<any[]>([])
  const [agentLoading, setAgentLoading] = useState(true)
  const [agentFilter, setAgentFilter] = useState('all')
  const [agentPage, setAgentPage] = useState(0)
  const PAGE = 50

  // Fetch activity logs
  const fetchActivity = useCallback(async () => {
    setActLoading(true)
    let q = supabase.from('activity_logs').select('*')
      .order('created_at', { ascending: false })
      .range(actPage * PAGE, (actPage + 1) * PAGE - 1)
    if (actCategory !== 'all') q = q.eq('category', actCategory)
    const { data } = await q
    setActLogs(data || [])
    setActLoading(false)
  }, [actCategory, actPage])

  // Fetch agent logs
  const fetchAgent = useCallback(async () => {
    setAgentLoading(true)
    let q = supabase.from('audit_logs').select('*')
      .order('created_at', { ascending: false })
      .range(agentPage * PAGE, (agentPage + 1) * PAGE - 1)
    if (agentFilter !== 'all') q = q.eq('action_type', agentFilter)
    const { data } = await q
    setAgentLogs(data || [])
    setAgentLoading(false)
  }, [agentFilter, agentPage])

  useEffect(() => { fetchActivity() }, [fetchActivity])
  useEffect(() => { fetchAgent() }, [fetchAgent])

  const filteredAct = actLogs.filter(l =>
    !actSearch ||
    l.user_email?.toLowerCase().includes(actSearch.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(actSearch.toLowerCase()) ||
    l.entity_name?.toLowerCase().includes(actSearch.toLowerCase()) ||
    l.action?.toLowerCase().includes(actSearch.toLowerCase())
  )

  function exportActivityCSV() {
    const rows = filteredAct.map(l => [
      new Date(l.created_at).toLocaleString('en-GB'),
      l.user_name || '', l.user_email || '', l.category,
      actionLabel(l.action, l.old_value, l.new_value),
      l.entity_name || '', l.old_value || '', l.new_value || '',
    ])
    const csv = [['Date','User','Email','Category','Action','Entity','Old','New'], ...rows]
      .map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `NexPlan-ActivityLog-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-syne font-black text-xl">🔍 Audit & Activity Logs</h2>
          <p className="text-xs text-muted mt-0.5">Track all actions across the platform</p>
        </div>
        <div className="flex gap-1 p-1 bg-surface2 rounded-xl">
          <button onClick={() => setSubTab('activity')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${subTab === 'activity' ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
            📋 Activity Log
          </button>
          <button onClick={() => setSubTab('agent')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${subTab === 'agent' ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
            🤖 Agent Logs
          </button>
        </div>
      </div>

      {/* ── ACTIVITY LOG ── */}
      {subTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input className="input flex-1 min-w-[200px] text-sm" placeholder="Search user, action, entity..."
              value={actSearch} onChange={e => setActSearch(e.target.value)}/>
            <select className="select text-sm w-40" value={actCategory} onChange={e => { setActCategory(e.target.value); setActPage(0) }}>
              <option value="all">All Categories</option>
              {['task','project','org','workspace','auth'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button onClick={exportActivityCSV}
              className="px-4 py-2 text-sm font-semibold bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/20">
              📥 CSV
            </button>
            <button onClick={fetchActivity} className="btn-ghost text-sm px-3 py-2">↺ Refresh</button>
          </div>

          {/* Quick filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {['all','task','project','org','workspace'].map(c => (
              <button key={c} onClick={() => { setActCategory(c); setActPage(0) }}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                  actCategory === c ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-surface2 border-border text-muted hover:text-text'
                }`}>
                {c === 'all' ? '📋 All' : c === 'task' ? '✅ Tasks' : c === 'project' ? '📋 Projects' : c === 'org' ? '🏢 Org' : '📁 Workspace'}
              </button>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            {actLoading ? (
              <div className="py-12 text-center text-muted">Loading...</div>
            ) : filteredAct.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-syne font-bold mb-1">No activity logs yet</p>
                <p className="text-xs text-muted">Events will appear here as users take actions on tasks, projects and the organisation</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-surface2/50 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wide">
                  <div className="col-span-2">Time</div>
                  <div className="col-span-2">User</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-4">Action</div>
                  <div className="col-span-2">Entity</div>
                </div>
                <div className="divide-y divide-border">
                  {filteredAct.map(log => (
                    <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-surface2/30 items-center">
                      <div className="col-span-2">
                        <p className="text-xs font-semibold">{timeAgo(log.created_at)}</p>
                        <p className="text-[10px] text-muted font-mono-code">
                          {new Date(log.created_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-semibold truncate">{log.user_name || '—'}</p>
                        <p className="text-[10px] text-muted truncate font-mono-code">{log.user_email}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-lg border font-bold ${CATEGORY_COLORS[log.category] || CATEGORY_COLORS.task}`}>
                          {log.category}
                        </span>
                      </div>
                      <div className="col-span-4">
                        <p className="text-xs text-text">{actionLabel(log.action, log.old_value, log.new_value)}</p>
                      </div>
                      <div className="col-span-2">
                        {log.entity_name && <p className="text-xs text-accent font-semibold truncate">{log.entity_name}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted">{filteredAct.length} events shown</p>
                  <div className="flex gap-2">
                    <button onClick={() => setActPage(p => Math.max(0, p - 1))} disabled={actPage === 0}
                      className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
                    <button onClick={() => setActPage(p => p + 1)} disabled={filteredAct.length < PAGE}
                      className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── AGENT LOGS (existing) ── */}
      {subTab === 'agent' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <select className="select text-sm w-40" value={agentFilter} onChange={e => { setAgentFilter(e.target.value); setAgentPage(0) }}>
              <option value="all">All Types</option>
              <option value="login">Logins</option>
              <option value="ai_call">AI Calls</option>
              <option value="error">Errors</option>
            </select>
            <button onClick={fetchAgent} className="btn-ghost text-sm px-3 py-2">↺ Refresh</button>
          </div>

          <div className="card p-0 overflow-hidden">
            {agentLoading ? (
              <div className="py-12 text-center text-muted">Loading...</div>
            ) : agentLogs.length === 0 ? (
              <div className="py-12 text-center text-muted">No agent logs found</div>
            ) : (
              <>
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-surface2/50 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wide">
                  <div className="col-span-2">Time</div>
                  <div className="col-span-2">User</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Feature</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Duration</div>
                </div>
                <div className="divide-y divide-border">
                  {agentLogs.map(log => (
                    <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-surface2/30 items-center">
                      <div className="col-span-2">
                        <p className="text-xs font-semibold">{timeAgo(log.created_at)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs truncate font-mono-code">{log.user_email || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-lg border font-bold bg-violet-500/10 text-violet-400 border-violet-500/30">
                          {log.action_type || '—'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted">{log.feature || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[10px] font-bold ${log.response_status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                          {log.response_status || '—'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted font-mono-code">{log.duration_ms ? `${log.duration_ms}ms` : '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted">{agentLogs.length} logs shown</p>
                  <div className="flex gap-2">
                    <button onClick={() => setAgentPage(p => Math.max(0, p - 1))} disabled={agentPage === 0}
                      className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
                    <button onClick={() => setAgentPage(p => p + 1)} disabled={agentLogs.length < PAGE}
                      className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
