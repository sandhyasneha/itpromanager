'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Task { id: string; title: string; status: string; priority: string; assignee_name?: string }
interface Risk { id: string; type: string; title: string; rag_status: string; status: string }
interface Project {
  id: string; name: string; start_date?: string; end_date?: string
  report_frequency?: string; stakeholder_emails?: string[]; report_day?: string
}
interface Report {
  overall_rag: 'red' | 'amber' | 'green'
  executive_summary: string
  period_label: string
  accomplishments: string[]
  in_progress: string[]
  blockers: string[]
  risks_summary: string
  next_period_plan: string[]
  overall_health: string
  schedule_status: string
  budget_status: string
  scope_status: string
}

const RAG_CONFIG = {
  red:   { label: 'Red',   bg: 'bg-danger',  text: 'text-white', light: 'bg-danger/10 text-danger border-danger/30' },
  amber: { label: 'Amber', bg: 'bg-warn',    text: 'text-white', light: 'bg-warn/10 text-warn border-warn/30' },
  green: { label: 'Green', bg: 'bg-accent3', text: 'text-white', light: 'bg-accent3/10 text-accent3 border-accent3/30' },
}

const STATUS_DOT: Record<string, string> = {
  'On Track': 'text-accent3', 'At Risk': 'text-warn', 'Delayed': 'text-danger',
  'Off Track': 'text-danger', 'Under Review': 'text-warn', 'Over Budget': 'text-danger',
  'Change Pending': 'text-warn', 'Changed': 'text-danger',
}

export default function StatusReport({ project, tasks, onClose }: {
  project: Project
  tasks: Task[]
  onClose: () => void
}) {
  const supabase = createClient()
  const [tab, setTab] = useState<'settings' | 'generate' | 'history'>('settings')
  const [settings, setSettings] = useState({
    frequency: project.report_frequency || 'weekly',
    report_day: project.report_day || 'friday',
    stakeholder_emails: (project.stakeholder_emails || []).join(', '),
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [risks, setRisks] = useState<Risk[]>([])
  const [pastReports, setPastReports] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    loadRisks()
    loadPastReports()
  }, [project.id])

  async function loadRisks() {
    const { data } = await supabase.from('risk_register').select('*').eq('project_id', project.id)
    setRisks(data || [])
  }

  async function loadPastReports() {
    const { data } = await supabase.from('status_reports').select('*')
      .eq('project_id', project.id).order('created_at', { ascending: false }).limit(10)
    setPastReports(data || [])
  }

  async function saveSettings() {
    setSavingSettings(true)
    const emails = settings.stakeholder_emails
      .split(',').map(e => e.trim()).filter(Boolean)
    await supabase.from('projects').update({
      report_frequency: settings.frequency,
      report_day: settings.report_day,
      stakeholder_emails: emails,
    }).eq('id', project.id)
    setSavingSettings(false)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  async function generateReport() {
    setGenerating(true)
    setReport(null)
    try {
      const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      const res = await fetch('/api/generate-status-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          tasks,
          risks,
          frequency: settings.frequency,
          reportDate,
        }),
      })
      const data = await res.json()
      if (data.report) {
        setReport(data.report)
        // Save to history
        const emails = settings.stakeholder_emails.split(',').map(e => e.trim()).filter(Boolean)
        await supabase.from('status_reports').insert({
          project_id: project.id,
          report_date: new Date().toISOString().split('T')[0],
          frequency: settings.frequency,
          overall_rag: data.report.overall_rag,
          report_content: JSON.stringify(data.report),
          sent_to: emails,
        })
        await loadPastReports()
      }
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  async function sendReportEmail() {
    if (!report) return
    setSending(true)
    const emails = settings.stakeholder_emails.split(',').map(e => e.trim()).filter(Boolean)
    if (emails.length === 0) { alert('Please add stakeholder emails in Settings first'); setSending(false); return }

    const txtContent = generateTXT(report)
    try {
      await fetch('/api/send-status-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails,
          projectName: project.name,
          report,
          txtContent,
          frequency: settings.frequency,
        }),
      })
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch (e) { console.error(e) }
    setSending(false)
  }

  function generateTXT(r: Report) {
    const line = '='.repeat(60)
    const dash = '-'.repeat(60)
    return `${line}
PROJECT STATUS REPORT
${line}
Project  : ${project.name}
Period   : ${r.period_label}
Date     : ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
Frequency: ${settings.frequency.toUpperCase()}
Overall  : ${r.overall_rag.toUpperCase()} — ${r.overall_health}
${line}

EXECUTIVE SUMMARY
${dash}
${r.executive_summary}

PROJECT HEALTH
${dash}
Overall  : ${r.overall_health}
Schedule : ${r.schedule_status}
Budget   : ${r.budget_status}
Scope    : ${r.scope_status}

ACCOMPLISHMENTS THIS PERIOD
${dash}
${r.accomplishments.map((a, i) => `${i+1}. ${a}`).join('\n')}

IN PROGRESS
${dash}
${r.in_progress.map((a, i) => `${i+1}. ${a}`).join('\n')}

${r.blockers.length > 0 ? `BLOCKERS / ESCALATIONS\n${dash}\n${r.blockers.map((b, i) => `${i+1}. ${b}`).join('\n')}\n\n` : ''}RISKS & ISSUES
${dash}
${r.risks_summary}

PLAN FOR NEXT PERIOD
${dash}
${r.next_period_plan.map((a, i) => `${i+1}. ${a}`).join('\n')}

${line}
Generated by NexPlan · nexplan.io
${line}`
  }

  function downloadTXT() {
    if (!report) return
    const txt = generateTXT(report)
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-')}-Status-Report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ragCfg = report ? RAG_CONFIG[report.overall_rag] : null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="card w-full max-w-4xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
          <div>
            <p className="font-mono-code text-xs text-accent2 uppercase tracking-widest mb-1">📊 Status Report</p>
            <h2 className="font-syne font-black text-2xl">{project.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface2 rounded-xl mx-6 mt-4 shrink-0">
          {([['settings','⚙️ Communication Settings'],['generate','📊 Generate Report'],['history','🕐 History']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
                ${tab === t ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 p-6">

          {/* ── SETTINGS TAB ── */}
          {tab === 'settings' && (
            <div className="space-y-6 max-w-lg">
              <div className="bg-surface2 rounded-xl p-5 space-y-4">
                <p className="font-syne font-bold text-sm text-accent uppercase tracking-wide">📅 Report Frequency</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['weekly','fortnightly','monthly'] as const).map(f => (
                    <button key={f} onClick={() => setSettings(s => ({ ...s, frequency: f }))}
                      className={`py-3 rounded-xl text-sm font-semibold capitalize border transition-all
                        ${settings.frequency === f
                          ? 'bg-accent/10 border-accent/40 text-accent'
                          : 'bg-surface border-border text-muted hover:text-text'}`}>
                      {f === 'weekly' ? '📅 Weekly' : f === 'fortnightly' ? '📆 Fortnightly' : '🗓️ Monthly'}
                      <p className="text-[10px] font-normal mt-0.5 opacity-70">
                        {f === 'weekly' ? 'Every week' : f === 'fortnightly' ? 'Every 2 weeks' : 'Once a month'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-surface2 rounded-xl p-5 space-y-4">
                <p className="font-syne font-bold text-sm text-accent uppercase tracking-wide">📅 Report Day</p>
                <div className="grid grid-cols-5 gap-2">
                  {['monday','tuesday','wednesday','thursday','friday'].map(day => (
                    <button key={day} onClick={() => setSettings(s => ({ ...s, report_day: day }))}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all
                        ${settings.report_day === day
                          ? 'bg-accent/10 border-accent/40 text-accent'
                          : 'bg-surface border-border text-muted hover:text-text'}`}>
                      {day.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-surface2 rounded-xl p-5 space-y-3">
                <p className="font-syne font-bold text-sm text-accent uppercase tracking-wide">📧 Stakeholder Emails</p>
                <p className="text-xs text-muted">Separate multiple emails with commas</p>
                <textarea className="input min-h-[80px] resize-none text-sm"
                  placeholder="sponsor@company.com, stakeholder@company.com, director@company.com"
                  value={settings.stakeholder_emails}
                  onChange={e => setSettings(s => ({ ...s, stakeholder_emails: e.target.value }))}/>
                <p className="text-xs text-muted">
                  📬 Reports will be sent to {settings.stakeholder_emails.split(',').filter(e => e.trim()).length} recipient(s)
                </p>
              </div>

              <div className="bg-accent2/5 border border-accent2/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-accent2 mb-1">📋 Current Configuration</p>
                <p className="text-sm text-muted">
                  Status reports will be generated <span className="text-text font-semibold">{settings.frequency}</span> on <span className="text-text font-semibold capitalize">{settings.report_day}s</span> and sent to <span className="text-text font-semibold">{settings.stakeholder_emails.split(',').filter(e=>e.trim()).length} stakeholder(s)</span>.
                </p>
              </div>

              <button onClick={saveSettings} disabled={savingSettings}
                className="btn-primary w-full py-3 text-sm disabled:opacity-40">
                {savingSettings ? 'Saving...' : settingsSaved ? '✅ Settings Saved!' : 'Save Communication Settings'}
              </button>
            </div>
          )}

          {/* ── GENERATE TAB ── */}
          {tab === 'generate' && (
            <div className="space-y-6">
              {/* Config summary */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-surface2 px-4 py-2 rounded-xl text-sm">
                  <span className="text-muted">Frequency:</span>
                  <span className="font-semibold capitalize text-accent">{settings.frequency}</span>
                </div>
                <div className="flex items-center gap-2 bg-surface2 px-4 py-2 rounded-xl text-sm">
                  <span className="text-muted">Tasks:</span>
                  <span className="font-semibold">{tasks.length} total · {tasks.filter(t=>t.status==='done').length} done</span>
                </div>
                <div className="flex items-center gap-2 bg-surface2 px-4 py-2 rounded-xl text-sm">
                  <span className="text-muted">Risks:</span>
                  <span className="font-semibold">{risks.filter(r=>r.status==='open').length} open</span>
                </div>
                <button onClick={generateReport} disabled={generating}
                  className="btn-primary px-6 py-2 text-sm ml-auto disabled:opacity-40">
                  {generating ? '🤖 Generating...' : '🤖 Generate Report'}
                </button>
              </div>

              {/* Generated Report — Polished View */}
              {report && ragCfg && (
                <div className="space-y-4">

                  {/* RAG Banner */}
                  <div className={`rounded-2xl p-6 ${ragCfg.bg}`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-white/70 text-xs font-mono-code uppercase tracking-widest mb-1">{report.period_label}</p>
                        <h3 className="font-syne font-black text-2xl text-white">{project.name}</h3>
                        <p className="text-white/80 text-sm mt-1">{report.executive_summary}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Overall Status</p>
                        <div className="bg-white/20 rounded-xl px-6 py-3">
                          <p className="text-white font-black text-xl">{report.overall_rag.toUpperCase()}</p>
                          <p className="text-white/80 text-xs">{report.overall_health}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Health indicators */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Overall',  value: report.overall_health },
                      { label: 'Schedule', value: report.schedule_status },
                      { label: 'Budget',   value: report.budget_status },
                      { label: 'Scope',    value: report.scope_status },
                    ].map(h => (
                      <div key={h.label} className="bg-surface2 rounded-xl p-3 text-center border border-border">
                        <p className="text-xs text-muted font-mono-code mb-1">{h.label}</p>
                        <p className={`text-sm font-bold ${STATUS_DOT[h.value] || 'text-text'}`}>{h.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Main content grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Accomplishments */}
                    <div className="bg-surface2 rounded-xl p-4">
                      <p className="font-syne font-bold text-sm text-accent3 mb-3">✅ Accomplishments</p>
                      <ul className="space-y-2">
                        {report.accomplishments.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-accent3 mt-0.5 shrink-0">•</span>
                            <span className="text-text/80">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* In Progress */}
                    <div className="bg-surface2 rounded-xl p-4">
                      <p className="font-syne font-bold text-sm text-accent mb-3">⚡ In Progress</p>
                      <ul className="space-y-2">
                        {report.in_progress.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-accent mt-0.5 shrink-0">•</span>
                            <span className="text-text/80">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Blockers */}
                    {report.blockers.length > 0 && (
                      <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
                        <p className="font-syne font-bold text-sm text-danger mb-3">🚫 Blockers / Escalations</p>
                        <ul className="space-y-2">
                          {report.blockers.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-danger mt-0.5 shrink-0">⚠</span>
                              <span className="text-text/80">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next period */}
                    <div className="bg-surface2 rounded-xl p-4">
                      <p className="font-syne font-bold text-sm text-accent2 mb-3">🎯 Next Period Plan</p>
                      <ul className="space-y-2">
                        {report.next_period_plan.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-accent2 mt-0.5 shrink-0">→</span>
                            <span className="text-text/80">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Risks */}
                  <div className="bg-warn/5 border border-warn/20 rounded-xl p-4">
                    <p className="font-syne font-bold text-sm text-warn mb-2">⚠️ Risks & Issues</p>
                    <p className="text-sm text-text/80">{report.risks_summary}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={downloadTXT}
                      className="flex items-center gap-2 px-4 py-2 bg-surface2 border border-border text-muted hover:text-text rounded-xl text-sm font-semibold transition-colors">
                      📄 Download TXT
                    </button>
                    <button onClick={sendReportEmail} disabled={sending || sent}
                      className="flex items-center gap-2 px-6 py-2 btn-primary text-sm disabled:opacity-40">
                      {sent ? '✅ Sent!' : sending ? '📧 Sending...' : `📧 Email to Stakeholders (${settings.stakeholder_emails.split(',').filter(e=>e.trim()).length})`}
                    </button>
                    <button onClick={generateReport} disabled={generating}
                      className="flex items-center gap-2 px-4 py-2 bg-surface2 border border-border text-muted hover:text-text rounded-xl text-sm font-semibold transition-colors disabled:opacity-40">
                      🔄 Regenerate
                    </button>
                  </div>
                </div>
              )}

              {!report && !generating && (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📊</p>
                  <p className="text-muted text-sm">Click "Generate Report" to create your {settings.frequency} status report</p>
                  <p className="text-xs text-muted mt-1">AI will analyse your tasks, risks and issues to generate a professional report</p>
                </div>
              )}

              {generating && (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3 animate-pulse">🤖</p>
                  <p className="text-muted text-sm">AI is generating your status report...</p>
                  <p className="text-xs text-muted mt-1">Analysing {tasks.length} tasks and {risks.length} risks</p>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === 'history' && (
            <div>
              {pastReports.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🕐</p>
                  <p className="text-muted text-sm">No reports generated yet.</p>
                  <button onClick={() => setTab('generate')} className="btn-primary mt-4 px-6 py-2 text-sm">
                    Generate First Report
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastReports.map(r => {
                    const rag = RAG_CONFIG[r.overall_rag as keyof typeof RAG_CONFIG] || RAG_CONFIG.amber
                    const parsed = r.report_content ? JSON.parse(r.report_content) : null
                    return (
                      <div key={r.id} className="bg-surface2 rounded-xl p-4 border border-border hover:border-accent/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold border ${rag.light}`}>
                              <span className={`w-2 h-2 rounded-full ${rag.bg}`}/>
                              {rag.label}
                            </span>
                            <div>
                              <p className="font-semibold text-sm">{parsed?.period_label || r.report_date}</p>
                              <p className="text-xs text-muted capitalize">{r.frequency} report · {parsed?.overall_health}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted">
                            {r.sent_to?.length > 0 && <span>📧 {r.sent_to.length} recipients</span>}
                            <span>{new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</span>
                          </div>
                        </div>
                        {parsed?.executive_summary && (
                          <p className="text-xs text-muted mt-2 line-clamp-2">{parsed.executive_summary}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
