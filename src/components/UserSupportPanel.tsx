'use client'
// ============================================================
// src/components/UserSupportPanel.tsx
// NEW FILE — Add this to the user's Settings page
// Shows user's own error history + lets them raise tickets
// ============================================================

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getErrorDef, getUserMessage, CATEGORY_COLORS } from '@/lib/errorCodes'

interface AuditEntry {
  id: string
  feature: string
  response_status: string
  error_code: string | null
  error_message: string | null
  duration_ms: number | null
  project_name: string | null
  created_at: string
}

interface Ticket {
  id: string
  subject: string
  description: string
  error_code: string | null
  status: string
  priority: string
  admin_notes: string | null
  created_at: string
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

export default function UserSupportPanel() {
  const supabase = createClient()
  const [tab, setTab]             = useState<'history' | 'tickets' | 'new_ticket'>('history')
  const [logs, setLogs]           = useState<AuditEntry[]>([])
  const [tickets, setTickets]     = useState<Ticket[]>([])
  const [loading, setLoading]     = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName]   = useState('')
  const [userId, setUserId]       = useState('')

  // New ticket form
  const [subject, setSubject]         = useState('')
  const [description, setDescription] = useState('')
  const [errorCode, setErrorCode]     = useState('')
  const [priority, setPriority]       = useState('medium')
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    setUserEmail(user.email ?? '')
    setUserId(user.id)

    // Get profile name
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    if (profile) setUserName(profile.full_name || user.email?.split('@')[0] || 'User')

    const [{ data: l }, { data: t }] = await Promise.all([
      supabase.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setLogs((l ?? []) as AuditEntry[])
    setTickets((t ?? []) as Ticket[])
    setLoading(false)
  }

  async function submitTicket() {
    if (!subject.trim() || !description.trim()) return
    setSubmitting(true)

    const { error } = await supabase.from('support_tickets').insert({
      user_id:     userId,
      user_email:  userEmail,
      user_name:   userName,
      subject:     subject.trim(),
      description: description.trim(),
      error_code:  errorCode.trim().toUpperCase() || null,
      priority,
      status:      'open',
    })

    if (!error) {
      setSubmitted(true)
      setSubject('')
      setDescription('')
      setErrorCode('')
      setPriority('medium')
      await loadData()
      setTimeout(() => { setSubmitted(false); setTab('tickets') }, 2000)
    }
    setSubmitting(false)
  }

  const errorLogs = logs.filter(l => l.response_status === 'error')

  return (
    <div className="card p-6">
      <div className="mb-5">
        <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-1">🎫 Support</p>
        <h2 className="font-syne font-black text-xl">Help & Support</h2>
        <p className="text-xs text-muted mt-1">View your error history and raise support tickets.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: '🚨 Errors',        value: errorLogs.length,  color: 'text-danger  bg-danger/10  border-danger/20' },
          { label: '🎫 My Tickets',    value: tickets.length,    color: 'text-warn    bg-warn/10    border-warn/20' },
          { label: '✅ Resolved',      value: tickets.filter(t => t.status === 'resolved').length, color: 'text-accent3 bg-accent3/10 border-accent3/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 border text-center ${s.color}`}>
            <p className="text-[10px] text-muted font-mono-code mb-0.5">{s.label}</p>
            <p className={`font-syne font-black text-2xl ${s.color.split(' ')[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-5">
        {([
          ['history',    '📋 Error History'],
          ['tickets',    '🎫 My Tickets'],
          ['new_ticket', '+ Raise Ticket'],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${tab === t
                ? t === 'new_ticket' ? 'bg-accent text-black shadow' : 'bg-surface text-text shadow'
                : 'text-muted hover:text-text'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-xs text-muted py-8 animate-pulse">Loading…</p>

      ) : tab === 'history' ? (
        <div className="space-y-2">
          {errorLogs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-syne font-bold text-sm mb-1">No errors recorded</p>
              <p className="text-xs text-muted">All your AI calls have been successful.</p>
            </div>
          ) : errorLogs.map(log => {
            const def = log.error_code ? getErrorDef(log.error_code) : null
            return (
              <div key={log.id} className="bg-surface2 border border-danger/20 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div>
                    <p className="text-xs font-semibold">{FEATURE_LABELS[log.feature] ?? log.feature}</p>
                    {log.project_name && <p className="text-[10px] text-muted">{log.project_name}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.error_code && (
                      <span className="text-[10px] font-mono-code font-bold text-danger bg-danger/10 px-2 py-1 rounded-lg border border-danger/30">
                        {log.error_code}
                      </span>
                    )}
                    <span className="text-[10px] text-muted font-mono-code">{timeAgo(log.created_at)}</span>
                  </div>
                </div>
                {def && (
                  <p className="text-[10px] text-muted mb-2">{def.userMessage}</p>
                )}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-[10px] text-muted font-mono-code">
                    {new Date(log.created_at).toLocaleString('en-GB')}
                  </p>
                  {log.error_code && (
                    <button
                      onClick={() => {
                        setErrorCode(log.error_code!)
                        setSubject(`Error with ${FEATURE_LABELS[log.feature] ?? log.feature}`)
                        setDescription(`I encountered error ${log.error_code} while using ${FEATURE_LABELS[log.feature] ?? log.feature} on ${new Date(log.created_at).toLocaleString('en-GB')}.\n\nPlease help resolve this issue.`)
                        setTab('new_ticket')
                      }}
                      className="text-[10px] text-accent hover:underline font-semibold">
                      Raise ticket with this error →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      ) : tab === 'tickets' ? (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🎫</p>
              <p className="font-syne font-bold text-sm mb-1">No tickets raised yet</p>
              <p className="text-xs text-muted mb-4">Having an issue? Raise a support ticket.</p>
              <button onClick={() => setTab('new_ticket')} className="btn-primary text-xs px-4 py-2">
                + Raise a Ticket
              </button>
            </div>
          ) : tickets.map(ticket => (
            <div key={ticket.id} className="bg-surface2 border border-border rounded-xl p-4 hover:border-accent/20 transition-colors">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <p className="font-syne font-bold text-sm">{ticket.subject}</p>
                <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold border capitalize shrink-0 ${STATUS_COLORS[ticket.status]}`}>
                  {ticket.status.replace('_',' ')}
                </span>
              </div>
              <p className="text-xs text-muted mb-2 line-clamp-2">{ticket.description}</p>
              <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted font-mono-code">
                {ticket.error_code && (
                  <span className="text-danger font-bold">🚨 {ticket.error_code}</span>
                )}
                <span>Raised {timeAgo(ticket.created_at)}</span>
              </div>
              {ticket.admin_notes && (
                <div className="mt-3 bg-accent3/5 border border-accent3/20 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-accent3 mb-1">💬 Admin Response</p>
                  <p className="text-xs text-muted">{ticket.admin_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

      ) : (
        /* New ticket form */
        <div className="space-y-4">
          {submitted ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-syne font-bold text-lg mb-1">Ticket Raised!</p>
              <p className="text-xs text-muted">Our team will respond shortly. Redirecting to your tickets…</p>
            </div>
          ) : (<>
            {/* Email link option */}
            <div className="bg-accent2/5 border border-accent2/20 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-accent2 mb-0.5">📧 Prefer email?</p>
                <p className="text-[10px] text-muted">Send directly to support@nexplan.io</p>
              </div>
              <a
                href={`mailto:support@nexplan.io?subject=${encodeURIComponent(subject || 'Support Request')}&body=${encodeURIComponent(`Error Code: ${errorCode || 'N/A'}\n\n${description || 'Please describe your issue here.'}`)}`}
                className="btn-ghost text-xs px-3 py-2 shrink-0 border border-accent2/30 text-accent2 hover:bg-accent2/10">
                Open Email ↗
              </a>
            </div>

            <div>
              <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Subject <span className="text-danger">*</span></label>
              <input className="input text-sm" placeholder="Briefly describe your issue"
                value={subject} onChange={e => setSubject(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Error Code (if any)</label>
                <input className="input text-sm font-mono-code" placeholder="e.g. NXP-1001"
                  value={errorCode} onChange={e => setErrorCode(e.target.value.toUpperCase())} />
                {errorCode && getErrorDef(errorCode) && (
                  <p className="text-[10px] text-accent mt-1">✓ {getErrorDef(errorCode)!.title}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Priority</label>
                <select className="select text-sm" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Description <span className="text-danger">*</span></label>
              <textarea className="input text-sm resize-none h-28"
                placeholder="Describe what happened, what you were doing, and what you expected…"
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <button onClick={submitTicket} disabled={submitting || !subject.trim() || !description.trim()}
              className="btn-primary w-full py-3 text-sm disabled:opacity-40">
              {submitting ? 'Raising Ticket…' : '🎫 Raise Support Ticket'}
            </button>
          </>)}
        </div>
      )}
    </div>
  )
}
