// src/components/AuditLogTab.tsx
// Audit log viewer — shown inside Admin Panel for admin + account managers

'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuditLog {
  id: string
  org_id: string | null
  user_email: string
  user_name: string
  action: string
  category: string
  entity_name: string | null
  old_value: string | null
  new_value: string | null
  metadata: any
  created_at: string
}

const CATEGORY_COLORS: Record<string, string> = {
  task:      'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  project:   'bg-violet-500/10 text-violet-400 border-violet-500/30',
  org:       'bg-amber-500/10 text-amber-400 border-amber-500/30',
  workspace: 'bg-green-500/10 text-green-400 border-green-500/30',
  auth:      'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

const CATEGORY_ICONS: Record<string, string> = {
  task: '✅', project: '📋', org: '🏢', workspace: '📁', auth: '🔐'
}

function actionLabel(action: string, oldVal?: string | null, newVal?: string | null): string {
  const map: Record<string, string> = {
    'task.created':          'Created task',
    'task.assigned':         `Assigned task to ${newVal || ''}`,
    'task.status_changed':   `Status: ${oldVal || '?'} → ${newVal || '?'}`,
    'task.priority_changed': `Priority: ${oldVal || '?'} → ${newVal || '?'}`,
    'task.due_date_changed': `Due date changed to ${newVal || '?'}`,
    'task.deleted':          'Deleted task',
    'project.created':       'Created project',
    'project.updated':       'Updated project',
    'project.deleted':       'Deleted project',
    'org.member_invited':    `Invited ${newVal || ''} to organisation`,
    'org.member_joined':     `${newVal || ''} joined organisation`,
    'org.member_removed':    `Removed ${oldVal || ''} from organisation`,
    'org.updated':           'Updated organisation settings',
    'workspace.created':     'Created workspace',
    'workspace.updated':     'Updated workspace',
    'workspace.status_changed': `Workspace: ${oldVal || '?'} → ${newVal || '?'}`,
    'auth.login':            'Logged in',
    'auth.plan_upgraded':    `Plan upgraded to ${newVal || '?'}`,
  }
  return map[action] || action.replace('.', ': ').replace('_', ' ')
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AuditLogTab({ isNexPlanAdmin }: { isNexPlanAdmin: boolean }) {
  const supabase = createClient()
  const [logs, setLogs]           = useState<AuditLog[]>([])
  const [loading, setLoading]     = useState(true)
  const [category, setCategory]   = useState('all')
  const [search, setSearch]       = useState('')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [page, setPage]           = useState(0)
  const PAGE_SIZE = 50

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (category !== 'all') q = q.eq('category', category)
    if (dateFrom) q = q.gte('created_at', dateFrom)
    if (dateTo)   q = q.lte('created_at', dateTo + 'T23:59:59')

    const { data } = await q
    setLogs(data || [])
    setLoading(false)
  }, [category, dateFrom, dateTo, page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const filtered = logs.filter(l =>
    !search ||
    l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase())
  )

  function exportCSV() {
    const headers = ['Date', 'User', 'Email', 'Category', 'Action', 'Entity', 'Old Value', 'New Value']
    const rows = filtered.map(l => [
      new Date(l.created_at).toLocaleString('en-GB'),
      l.user_name || '',
      l.user_email || '',
      l.category,
      l.action,
      l.entity_name || '',
      l.old_value || '',
      l.new_value || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `NexPlan-AuditLog-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-syne font-black text-xl">🔍 Audit Log</h2>
          <p className="text-xs text-muted mt-0.5">
            Track all actions across projects, tasks and organisation
          </p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/20 transition-colors">
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <input
            className="input flex-1 min-w-[200px] text-sm"
            placeholder="Search by user, action, entity..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Category filter */}
          <select className="select text-sm w-40" value={category} onChange={e => { setCategory(e.target.value); setPage(0) }}>
            <option value="all">All Categories</option>
            <option value="task">✅ Tasks</option>
            <option value="project">📋 Projects</option>
            <option value="org">🏢 Organisation</option>
            <option value="workspace">📁 Workspaces</option>
            <option value="auth">🔐 Auth</option>
          </select>

          {/* Date range */}
          <input type="date" className="input text-sm w-40" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(0) }}/>
          <input type="date" className="input text-sm w-40" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(0) }}/>

          <button onClick={() => { setSearch(''); setCategory('all'); setDateFrom(''); setDateTo(''); setPage(0) }}
            className="btn-ghost text-sm px-3 py-2">
            ✕ Clear
          </button>
        </div>

        {/* Category quick filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'task', label: '✅ Tasks' },
            { key: 'project', label: '📋 Projects' },
            { key: 'org', label: '🏢 Org' },
            { key: 'workspace', label: '📁 Workspace' },
            { key: 'auth', label: '🔐 Auth' },
          ].map(c => (
            <button key={c.key} onClick={() => { setCategory(c.key); setPage(0) }}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                category === c.key
                  ? 'bg-accent/20 border-accent/50 text-accent'
                  : 'bg-surface2 border-border text-muted hover:text-text'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Events', value: filtered.length, color: 'text-text' },
          { label: 'Task Events', value: filtered.filter(l => l.category === 'task').length, color: 'text-cyan-400' },
          { label: 'Project Events', value: filtered.filter(l => l.category === 'project').length, color: 'text-violet-400' },
          { label: 'Org Events', value: filtered.filter(l => l.category === 'org').length, color: 'text-amber-400' },
          { label: 'Auth Events', value: filtered.filter(l => l.category === 'auth').length, color: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="card py-3 text-center">
            <p className={`font-syne font-black text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Log table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="text-3xl animate-spin mb-3">⟳</div>
            <p className="text-muted text-sm">Loading audit logs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-syne font-bold text-lg mb-1">No audit logs yet</p>
            <p className="text-muted text-sm">Events will appear here as users take actions</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-surface2/50 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wide">
              <div className="col-span-2">Time</div>
              <div className="col-span-2">User</div>
              <div className="col-span-1">Category</div>
              <div className="col-span-4">Action</div>
              <div className="col-span-3">Entity</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {filtered.map(log => (
                <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-surface2/30 transition-colors items-center">
                  {/* Time */}
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-text">{timeAgo(log.created_at)}</p>
                    <p className="text-[10px] text-muted font-mono-code">
                      {new Date(log.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* User */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-[9px] font-black text-black shrink-0">
                        {(log.user_name || log.user_email || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-text truncate">{log.user_name || '—'}</p>
                        <p className="text-[10px] text-muted truncate font-mono-code">{log.user_email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-span-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-lg border font-bold ${CATEGORY_COLORS[log.category] || CATEGORY_COLORS.task}`}>
                      {CATEGORY_ICONS[log.category]} {log.category}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-4">
                    <p className="text-xs text-text">
                      {actionLabel(log.action, log.old_value, log.new_value)}
                    </p>
                  </div>

                  {/* Entity */}
                  <div className="col-span-3">
                    {log.entity_name && (
                      <p className="text-xs text-accent font-semibold truncate">{log.entity_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length + page * PAGE_SIZE)} events
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={filtered.length < PAGE_SIZE}
                  className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
