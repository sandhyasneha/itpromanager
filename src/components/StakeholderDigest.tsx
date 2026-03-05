'use client'
// ============================================================
// src/components/StakeholderDigest.tsx
// NEW FILE — AI Stakeholder Digest Email
// PM selects project → AI drafts digest → PM edits → Send/Copy
// ============================================================
import { useState, useCallback } from 'react'

interface Project { id: string; name: string; color?: string; end_date?: string; status?: string }
interface Task {
  id: string; title: string; status: string; priority: string
  due_date?: string; project_id: string; assignee_name?: string; updated_at?: string
}

interface Props {
  projects: Project[]
  tasks:    Task[]
  userId:   string
}

function getWeekRange() {
  const now   = new Date()
  const start = new Date(now); start.setDate(now.getDate() - 7)
  const end   = new Date(now); end.setDate(now.getDate() + 7)
  return { start, end }
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function healthLabel(tasks: Task[]): { label: string; emoji: string; rag: string } {
  const blocked = tasks.filter(t => t.status === 'blocked').length
  const overdue = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()).length
  if (blocked > 0 || overdue > 2) return { label: 'At Risk',         emoji: '🔴', rag: 'red'   }
  if (overdue > 0)                 return { label: 'Needs Attention', emoji: '🟡', rag: 'amber' }
  return                                  { label: 'On Track',        emoji: '🟢', rag: 'green' }
}

function buildDigestPrompt(project: Project, tasks: Task[], pmName: string): string {
  const { start, end } = getWeekRange()
  const projectTasks   = tasks.filter(t => t.project_id === project.id)
  const completed      = projectTasks.filter(t => t.status === 'done')
  const inProgress     = projectTasks.filter(t => t.status === 'in_progress')
  const upcoming       = projectTasks.filter(t =>
    t.due_date && new Date(t.due_date) >= new Date() && new Date(t.due_date) <= end && t.status !== 'done'
  )
  const overdue        = projectTasks.filter(t =>
    t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()
  )
  const blocked        = projectTasks.filter(t => t.status === 'blocked')
  const health         = healthLabel(projectTasks)
  const progress       = projectTasks.length > 0
    ? Math.round((completed.length / projectTasks.length) * 100) : 0
  const daysLeft       = project.end_date
    ? Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / 86400000) : null

  return `You are an IT Project Manager writing a professional weekly stakeholder digest email.

Project: ${project.name}
PM Name: ${pmName}
Date: ${formatDate(new Date())}
Overall Status: ${health.emoji} ${health.label}
Progress: ${progress}% complete (${completed.length}/${projectTasks.length} tasks done)
${daysLeft !== null ? `Days to deadline: ${daysLeft} days` : ''}

Completed this week (${completed.slice(-5).length} tasks):
${completed.slice(-5).map(t => `- ${t.title}`).join('\n') || '- None this week'}

In Progress (${inProgress.length} tasks):
${inProgress.slice(0, 5).map(t => `- ${t.title}`).join('\n') || '- None'}

Upcoming next 7 days (${upcoming.length} tasks):
${upcoming.slice(0, 5).map(t => `- ${t.title} (due ${t.due_date})`).join('\n') || '- None scheduled'}

Overdue items (${overdue.length}):
${overdue.map(t => `- ${t.title} (was due ${t.due_date})`).join('\n') || '- None'}

Blocked items (${blocked.length}):
${blocked.map(t => `- ${t.title}`).join('\n') || '- None'}

Write a professional, concise stakeholder digest email with these exact sections:
1. Subject line (start with "Subject: ")
2. Opening greeting
3. Project Status Summary (1-2 sentences with RAG status)
4. ✅ Completed This Week
5. 🔄 Currently In Progress  
6. 📅 Upcoming This Week
7. ⚠️ Overdue Items (only if any, else skip)
8. 🚫 Blockers (only if any, else skip)
9. 📊 Health Score & Progress
10. Brief closing with next update date

Keep it professional, factual, under 300 words. Do NOT use markdown headers with ##. Use the emoji section headers exactly as listed above.`
}

export default function StakeholderDigest({ projects, tasks, userId }: Props) {
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [pmName,          setPmName]          = useState<string>('')
  const [recipients,      setRecipients]      = useState<string>('')
  const [subject,         setSubject]         = useState<string>('')
  const [body,            setBody]            = useState<string>('')
  const [loading,         setLoading]         = useState(false)
  const [sending,         setSending]         = useState(false)
  const [sent,            setSent]            = useState(false)
  const [copied,          setCopied]          = useState(false)
  const [error,           setError]           = useState<string>('')
  const [step,            setStep]            = useState<'select'|'draft'|'edit'>('select')

  const project = projects.find(p => p.id === selectedProject)
  const projectTasks = tasks.filter(t => t.project_id === selectedProject)
  const health = project ? healthLabel(projectTasks) : null

  // ── Generate AI draft ─────────────────────────────────
  async function generateDraft() {
    if (!project || !pmName.trim()) return
    setLoading(true)
    setError('')
    try {
      const prompt = buildDigestPrompt(project, tasks, pmName)
      const res  = await fetch('/api/ai-project-manager', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const text: string = data.content?.[0]?.text ?? data.reply ?? data.message ?? ''

      // Extract subject line
      const subjectMatch = text.match(/Subject:\s*(.+)/i)
      if (subjectMatch) {
        setSubject(subjectMatch[1].trim())
        setBody(text.replace(/Subject:\s*.+\n?/i, '').trim())
      } else {
        setSubject(`Project Update: ${project.name} — ${formatDate(new Date())}`)
        setBody(text.trim())
      }
      setStep('edit')
    } catch (e) {
      setError('Failed to generate digest. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Send via Resend ───────────────────────────────────
  async function sendEmail() {
    if (!recipients.trim() || !body.trim()) return
    setSending(true)
    setError('')
    try {
      const emailList = recipients.split(',').map(e => e.trim()).filter(Boolean)
      const res = await fetch('/api/send-digest-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          to:      emailList,
          subject: subject,
          html:    `<html><body style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#334155;max-width:640px;margin:0 auto;padding:32px 16px;">
            <h1 style="font-size:22px;font-weight:900;color:#0f172a;">Nex<span style="color:#06b6d4;">Plan</span></h1>
            <p style="color:#64748b;font-size:12px;margin:2px 0 24px;">IT Project Intelligence</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
              ${body.replace(/\n/g, '<br/>')}
            </div>
            <p style="color:#94a3b8;font-size:11px;margin-top:24px;text-align:center;">
              Sent via NexPlan Stakeholder Digest · <a href="https://www.nexplan.io" style="color:#06b6d4;">nexplan.io</a>
            </p>
          </body></html>`,
          text: body,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? data.message ?? 'Failed to send. Please try again.')
      } else {
        setSent(true)
        setTimeout(() => setSent(false), 4000)
      }
    } catch (err: any) {
      setError('Network error — please check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  // ── Copy to clipboard ─────────────────────────────────
  async function copyToClipboard() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const RAG_STYLE = {
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red:   'bg-red-50 border-red-200 text-red-700',
  }

  return (
    <div className="space-y-6 p-1">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-syne font-black text-lg text-slate-900">📧 Stakeholder Digest</h3>
          <p className="text-sm text-slate-500 mt-0.5">AI-generated weekly project update email — review, edit and send</p>
        </div>
        {step === 'edit' && (
          <button onClick={() => { setStep('select'); setBody(''); setSubject('') }}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            ← New digest
          </button>
        )}
      </div>

      {/* ── STEP 1: Select project ─────────────────────── */}
      {step === 'select' && (
        <div className="space-y-5">

          {/* Project cards */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Select Project</p>
            {projects.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No projects found</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {projects.map(p => {
                  const pt     = tasks.filter(t => t.project_id === p.id)
                  const ph     = healthLabel(pt)
                  const done   = pt.filter(t => t.status === 'done').length
                  const pct    = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0
                  const active = selectedProject === p.id
                  return (
                    <button key={p.id} onClick={() => setSelectedProject(p.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all
                        ${active ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color || '#00d4ff' }} />
                        <span className="font-syne font-bold text-sm text-slate-900 truncate">{p.name}</span>
                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${RAG_STYLE[ph.rag as keyof typeof RAG_STYLE]}`}>
                          {ph.emoji} {ph.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: p.color || '#00d4ff' }} />
                        </div>
                        <span className="text-[10px] font-mono-code text-slate-400">{pct}%</span>
                        <span className="text-[10px] text-slate-400">{pt.length} tasks</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* PM name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Your Name (PM)</label>
            <input className="input" placeholder="e.g. S. Ram" value={pmName}
              onChange={e => setPmName(e.target.value)} />
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Recipient Emails <span className="text-slate-400 font-normal normal-case">(comma separated)</span>
            </label>
            <input className="input" placeholder="sponsor@company.com, cto@company.com, stakeholder@company.com"
              value={recipients} onChange={e => setRecipients(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-100">{error}</p>}

          <button onClick={generateDraft}
            disabled={!selectedProject || !pmName.trim() || loading}
            className="btn-primary w-full justify-center py-3">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
                </svg>
                Generating AI digest…
              </span>
            ) : '🤖 Generate Stakeholder Digest'}
          </button>
        </div>
      )}

      {/* ── STEP 2: Edit & Send ────────────────────────── */}
      {step === 'edit' && (
        <div className="space-y-4">

          {/* Status banner */}
          {health && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${RAG_STYLE[health.rag as keyof typeof RAG_STYLE]}`}>
              {health.emoji} {project?.name} — {health.label}
              <span className="ml-auto text-xs font-normal opacity-70">
                {projectTasks.filter(t => t.status === 'done').length}/{projectTasks.length} tasks complete
              </span>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Subject Line</label>
            <input className="input font-semibold" value={subject}
              onChange={e => setSubject(e.target.value)} />
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Recipients</label>
            <input className="input" placeholder="sponsor@company.com, cto@company.com"
              value={recipients} onChange={e => setRecipients(e.target.value)} />
          </div>

          {/* Email body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email Body</label>
              <span className="text-[10px] text-slate-400 font-mono-code">{body.length} chars</span>
            </div>
            <textarea
              className="input min-h-[320px] resize-y font-mono-code text-xs leading-relaxed"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            <p className="text-[11px] text-slate-400 mt-1">✏️ Review and edit the AI draft above before sending</p>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-100">{error}</p>}
          {sent  && <p className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">✅ Digest sent successfully!</p>}

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={sendEmail}
              disabled={sending || !recipients.trim() || !body.trim()}
              className="btn-primary flex-1 justify-center py-2.5">
              {sending ? 'Sending…' : '📤 Send Email'}
            </button>
            <button onClick={copyToClipboard}
              className="btn-ghost flex-1 justify-center py-2.5">
              {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
            </button>
            <button onClick={generateDraft}
              disabled={loading}
              className="btn-ghost px-4 py-2.5"
              title="Regenerate">
              {loading ? '…' : '🔄'}
            </button>
          </div>

          {/* Preview toggle */}
          <details className="group">
            <summary className="text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-600 list-none flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="group-open:rotate-180 transition-transform">
                <path d="m6 9 6 6 6-6"/>
              </svg>
              Preview formatted email
            </summary>
            <div className="mt-3 p-4 bg-white border border-slate-200 rounded-xl">
              <p className="font-semibold text-sm text-slate-800 mb-3 pb-2 border-b border-slate-100">
                Subject: {subject}
              </p>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {body}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
