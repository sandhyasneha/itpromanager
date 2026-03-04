'use client'
// ============================================================
// src/components/AdminAuditLog.tsx
// NEW FILE — Add as a tab inside AdminClient.tsx
// Shows all AI calls, errors, support tickets with filters
// ============================================================

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ERROR_CODES, CATEGORY_COLORS, getErrorDef } from '@/lib/errorCodes'

interface AuditEntry {
  id: string
  user_email: string
  user_name: string
  action_type: string
  feature: string
  model: string | null
  prompt_summary: string | null
  response_status: string
  error_code: string | null
  error_message: string | null
  duration_ms: number | null
  project_name: string | null
  created_at: string
}

interface Ticket {
  id: string
  user_email: string
  user_name: string
  subject: string
  description: string
  error_code: string | null
  status: string
  priority: string
  admin_notes: string | null
  created_at: string
  updated_at: string
}

const FEATURE_LABELS: Record<string, string> = {
  project_plan:    '🤖 AI Project Plan',
  risk_mitigation: '🛡 Risk Mitigation',
  status_report:   '📊 Status Report',
  pcr_document:    '🔀 PCR Document',
  ai_followup:     '📧 AI Follow-Up',
  task_email:      '📬 Task Email',
  knowledge_base:  '📚 Knowledge Base',
  export_excel:    '📊 Excel Export',
}

const STATUS_COLORS: Record<string, string> = {
  open:        'text-warn    bg-warn/10    border-warn/30',
  in_progress: 'text-accent  bg-accent/10  border-accent/30',
  resolved:    'text-accent3 bg-accent3/10 border-accent3/30',
  closed:      'text-muted   bg-surface2   border-border',
}

const PRIORITY_COLORS: Record<string, string> = {
  low:      'text-muted   bg-surface2   border-border',
  medium:   'text-accent  bg-accent/10  border-accent/30',
  high:     'text-warn    bg-warn/10    border-warn/30',
  critical: 'text-danger  bg-danger/10  border-danger/30',
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function AdminAuditLog() {
  const supabase = createClient()
  const [tab, setTab]           = useState<'audit' | 'tickets' | 'error_codes'>('audit')
  const [logs, setLogs]         = useState<AuditEntry[]>([])
  const [tickets, setTickets]   = useState<Ticket[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<'all' | 'ai_call' | 'error'>('all')
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [errorSearch, setErrorSearch] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: l }, { data: t }] = await Promise.all([
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
    ])
    setLogs((l ?? []) as AuditEntry[])
    setTickets((t ?? []) as Ticket[])
    setLoading(false)
  }

  async function updateTicketStatus(ticketId: string, status: string) {
    await supabase.from('support_tickets').update({ status }).eq('id', ticketId)
    setTickets(ts => ts.map(t => t.id === ticketId ? { ...t, status } : t))
    if (selectedTicket?.id === ticketId) setSelectedTicket(t => t ? { ...t, status } : null)
  }

  async function saveAdminNotes(ticketId: string) {
    setSavingNotes(true)
    await supabase.from('support_tickets').update({ admin_notes: adminNotes }).eq('id', ticketId)
    setTickets(ts => ts.map(t => t.id === ticketId ? { ...t, admin_notes: adminNotes } : t))
    setSavingNotes(false)
  }

  const filteredLogs = logs.filter(l => {
    const matchFilter = filter === 'all' || l.action_type === filter
    const matchEmail  = !searchEmail || l.user_email.toLowerCase().includes(searchEmail.toLowerCase())
    return matchFilter && matchEmail
  })

  const errorLogs    = logs.filter(l => l.response_status === 'error')
  const aiLogs       = logs.filter(l => l.action_type === 'ai_call')
  const openTickets  = tickets.filter(t => t.status === 'open')

  // Error code search
  const allCodes = Object.values(ERROR_CODES)
  const filteredCodes = allCodes.filter(c =>
    !errorSearch ||
    c.code.toLowerCase().includes(errorSearch.toLowerCase()) ||
    c.title.toLowerCase().includes(errorSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(errorSearch.toLowerCase())
  )

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: '🤖 AI Calls',      value: aiLogs.length,      color: 'text-accent  bg-accent/10  border-accent/20' },
          { label: '🚨 Errors',         value: errorLogs.length,   color: 'text-danger  bg-danger/10  border-danger/20' },
          { label: '🎫 Open Tickets',   value: openTickets.length, color: 'text-warn    bg-warn/10    border-warn/20' },
          { label: '📋 Total Logs',     value: logs.length,        color: 'text-muted   bg-surface2   border-border' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border text-center ${s.color}`}>
            <p className="text-xs text-muted font-mono-code mb-1">{s.label}</p>
            <p className={`font-syne font-black text-3xl ${s.color.split(' ')[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-6">
        {([
          ['audit',       '📋 Audit Log'],
          ['tickets',     `🎫 Tickets${openTickets.length > 0 ? ` (${openTickets.length})` : ''}`],
          ['error_codes', '🔍 Error Codes'],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
              ${tab === t ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted py-16 animate-pulse">Loading audit data…</p>
      ) : tab === 'audit' ? (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <input
              className="input text-sm flex-1 min-w-[200px]"
              placeholder="🔍 Filter by user email…"
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
            />
            <div className="flex gap-1 p-1 bg-surface2 rounded-xl">
              {([['all','All'],['ai_call','AI Calls'],['error','Errors']] as const).map(([f, label]) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${filter === f ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={loadAll} className="btn-ghost text-xs px-3 py-2">🔄 Refresh</button>
          </div>

          {/* Log table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface2 border-b border-border">
                  <tr>
                    {['Time', 'User', 'Feature', 'Model', 'Status', 'Error Code', 'Duration'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-syne font-bold text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted text-sm">No logs found</td></tr>
                  ) : filteredLogs.map(log => (
                    <tr key={log.id}
                      className="border-b border-border/40 hover:bg-surface2/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedLog(log)}>
                      <td className="px-3 py-3 text-xs font-mono-code text-muted whitespace-nowrap">{timeAgo(log.created_at)}</td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-semibold">{log.user_name || '—'}</p>
                        <p className="text-[10px] text-muted font-mono-code">{log.user_email}</p>
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">{FEATURE_LABELS[log.feature] ?? log.feature}</td>
                      <td className="px-3 py-3 text-[10px] font-mono-code text-muted">{log.model?.replace('claude-','') ?? '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold border
                          ${log.response_status === 'ok'
                            ? 'text-accent3 bg-accent3/10 border-accent3/30'
                            : 'text-danger  bg-danger/10  border-danger/30'}`}>
                          {log.response_status === 'ok' ? '✅ OK' : '❌ Error'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {log.error_code ? (
                          <span className="text-[10px] font-mono-code font-bold text-danger bg-danger/10 px-2 py-1 rounded-lg border border-danger/30">
                            {log.error_code}
                          </span>
                        ) : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3 text-[10px] font-mono-code text-muted">
                        {log.duration_ms != null ? `${log.duration_ms}ms` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Log detail modal */}
          {selectedLog && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedLog(null)}>
              <div className="card w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                  <div>
                    <p className="font-mono-code text-xs text-muted mb-1">Audit Log Detail</p>
                    <h3 className="font-syne font-black text-lg">{FEATURE_LABELS[selectedLog.feature] ?? selectedLog.feature}</h3>
                  </div>
                  <button onClick={() => setSelectedLog(null)} className="text-muted hover:text-text text-xl">✕</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-3 text-sm">
                  {[
                    ['User',     `${selectedLog.user_name} (${selectedLog.user_email})`],
                    ['Time',     new Date(selectedLog.created_at).toLocaleString('en-GB')],
                    ['Feature',  selectedLog.feature],
                    ['Model',    selectedLog.model ?? '—'],
                    ['Status',   selectedLog.response_status],
                    ['Duration', selectedLog.duration_ms != null ? `${selectedLog.duration_ms}ms` : '—'],
                    ['Project',  selectedLog.project_name ?? '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-3">
                      <span className="text-xs text-muted w-20 shrink-0 font-syne font-semibold">{label}</span>
                      <span className="text-xs font-mono-code">{value}</span>
                    </div>
                  ))}
                  {selectedLog.prompt_summary && (
                    <div>
                      <p className="text-xs text-muted font-syne font-semibold mb-1">Request Summary</p>
                      <p className="text-xs bg-surface2 rounded-xl p-3 font-mono-code">{selectedLog.prompt_summary}</p>
                    </div>
                  )}
                  {selectedLog.error_code && (
                    <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
                      <p className="text-xs font-bold text-danger mb-2">🚨 {selectedLog.error_code}</p>
                      {getErrorDef(selectedLog.error_code) && (<>
                        <p className="text-xs font-semibold mb-1">{getErrorDef(selectedLog.error_code)!.title}</p>
                        <p className="text-xs text-muted mb-2">{getErrorDef(selectedLog.error_code)!.description}</p>
                        <p className="text-xs text-warn font-semibold">Resolution: </p>
                        <p className="text-xs text-muted">{getErrorDef(selectedLog.error_code)!.resolution}</p>
                      </>)}
                      {selectedLog.error_message && (
                        <p className="text-[10px] font-mono-code text-danger/70 mt-2 bg-danger/5 rounded p-2 break-all">{selectedLog.error_message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>

      ) : tab === 'tickets' ? (
        <>
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="card text-center py-16">
                <p className="text-3xl mb-3">🎫</p>
                <p className="font-syne font-bold text-lg mb-1">No support tickets yet</p>
                <p className="text-muted text-sm">Tickets raised by users will appear here.</p>
              </div>
            ) : tickets.map(ticket => (
              <div key={ticket.id}
                className="card hover:border-accent/30 cursor-pointer transition-all"
                onClick={() => { setSelectedTicket(ticket); setAdminNotes(ticket.admin_notes ?? '') }}>
                <div className="p-5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <p className="font-syne font-bold text-sm">{ticket.subject}</p>
                      <div className="flex gap-2 flex-wrap shrink-0">
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold border capitalize ${PRIORITY_COLORS[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold border capitalize ${STATUS_COLORS[ticket.status]}`}>
                          {ticket.status.replace('_',' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted line-clamp-2 mb-2">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-muted font-mono-code flex-wrap">
                      <span>👤 {ticket.user_name} ({ticket.user_email})</span>
                      {ticket.error_code && (
                        <span className="text-danger font-bold">🚨 {ticket.error_code}</span>
                      )}
                      <span>🕐 {timeAgo(ticket.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ticket detail modal */}
          {selectedTicket && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedTicket(null)}>
              <div className="card w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
                  <div>
                    <p className="font-mono-code text-xs text-muted mb-1">Support Ticket</p>
                    <h3 className="font-syne font-black text-lg">{selectedTicket.subject}</h3>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="text-muted hover:text-text text-xl">✕</button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-surface2 rounded-xl p-3">
                      <p className="text-muted mb-0.5">User</p>
                      <p className="font-semibold">{selectedTicket.user_name}</p>
                      <p className="font-mono-code text-muted text-[10px]">{selectedTicket.user_email}</p>
                    </div>
                    <div className="bg-surface2 rounded-xl p-3">
                      <p className="text-muted mb-0.5">Raised</p>
                      <p className="font-semibold">{new Date(selectedTicket.created_at).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>

                  {selectedTicket.error_code && (
                    <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
                      <p className="text-xs font-bold text-danger mb-1">🚨 Error Code: {selectedTicket.error_code}</p>
                      {getErrorDef(selectedTicket.error_code) && (
                        <>
                          <p className="text-xs font-semibold">{getErrorDef(selectedTicket.error_code)!.title}</p>
                          <p className="text-xs text-muted mt-1">{getErrorDef(selectedTicket.error_code)!.resolution}</p>
                        </>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-syne font-semibold text-muted mb-1.5">Description</p>
                    <p className="text-xs bg-surface2 rounded-xl p-3 leading-relaxed">{selectedTicket.description}</p>
                  </div>

                  <div>
                    <p className="text-xs font-syne font-semibold text-muted mb-1.5">Update Status</p>
                    <div className="flex gap-2 flex-wrap">
                      {(['open','in_progress','resolved','closed'] as const).map(s => (
                        <button key={s} onClick={() => updateTicketStatus(selectedTicket.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all capitalize
                            ${selectedTicket.status === s ? STATUS_COLORS[s] : 'bg-surface2 border-border text-muted hover:text-text'}`}>
                          {s.replace('_',' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-syne font-semibold text-muted mb-1.5">Admin Notes (internal)</p>
                    <textarea
                      className="input text-xs resize-none w-full h-20"
                      placeholder="Add resolution notes, steps taken…"
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                    />
                    <button onClick={() => saveAdminNotes(selectedTicket.id)} disabled={savingNotes}
                      className="btn-primary text-xs px-4 py-2 mt-2 disabled:opacity-40">
                      {savingNotes ? 'Saving…' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>

      ) : (
        /* Error Codes Reference */
        <>
          <div className="mb-4">
            <input
              className="input text-sm w-full"
              placeholder="🔍 Search error codes — e.g. NXP-1001 or AI or Email…"
              value={errorSearch}
              onChange={e => setErrorSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredCodes.map(def => (
              <div key={def.code} className="card p-4 hover:border-accent/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <span className={`text-xs font-mono-code font-bold px-2.5 py-1.5 rounded-lg border ${CATEGORY_COLORS[def.category]}`}>
                      {def.code}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-syne font-bold text-sm">{def.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${CATEGORY_COLORS[def.category]}`}>
                        {def.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted mb-2">{def.description}</p>
                    <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                      <div className="bg-surface2 rounded-lg p-2.5">
                        <p className="text-[10px] font-semibold text-accent mb-0.5">👤 User sees:</p>
                        <p className="text-[10px] text-muted">{def.userMessage}</p>
                      </div>
                      <div className="bg-surface2 rounded-lg p-2.5">
                        <p className="text-[10px] font-semibold text-warn mb-0.5">🔧 Admin resolution:</p>
                        <p className="text-[10px] text-muted">{def.resolution}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
