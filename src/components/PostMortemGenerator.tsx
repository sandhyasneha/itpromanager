'use client'
// ============================================================
// src/components/PostMortemGenerator.tsx
// NEW FILE — AI Post-Mortem / Lessons Learned Generator
// Triggered when project status = completed
// Sections: What Went Well, What Went Wrong, Root Cause,
// Lessons Learned, Recommendations, Timeline vs Actual,
// Risk & Issues Summary
// ============================================================
import { useState } from 'react'

interface Project {
  id:          string
  name:        string
  description?: string
  start_date?: string
  end_date?:   string
  color?:      string
  status?:     string
}

interface Task {
  id:          string
  title:       string
  status:      string
  priority:    string
  due_date?:   string
  created_at?: string
  updated_at?: string
  project_id:  string
  assignee_name?: string
}

interface Props {
  project:  Project
  tasks:    Task[]
  onClose:  () => void
}

// ── Section config ─────────────────────────────────────────
const SECTIONS = [
  { id: 'summary',         emoji: '📋', title: 'Executive Summary' },
  { id: 'went_well',       emoji: '✅', title: 'What Went Well' },
  { id: 'went_wrong',      emoji: '⚠️', title: 'What Went Wrong' },
  { id: 'root_cause',      emoji: '🔍', title: 'Root Cause Analysis' },
  { id: 'lessons',         emoji: '🎓', title: 'Lessons Learned' },
  { id: 'recommendations', emoji: '🚀', title: 'Recommendations for Next Project' },
  { id: 'timeline',        emoji: '📅', title: 'Timeline vs Actual' },
  { id: 'risks',           emoji: '🛡️', title: 'Risk & Issues Summary' },
]

// ── Build AI prompt ────────────────────────────────────────
function buildPrompt(project: Project, tasks: Task[]): string {
  const done     = tasks.filter(t => t.status === 'done')
  const overdue  = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date())
  const blocked  = tasks.filter(t => t.status === 'blocked')
  const backlog  = tasks.filter(t => t.status === 'backlog')
  const total    = tasks.length
  const pct      = total > 0 ? Math.round((done.length / total) * 100) : 0

  const plannedDays = project.start_date && project.end_date
    ? Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / 86400000)
    : null

  const priorities = {
    critical: tasks.filter(t => t.priority === 'critical').length,
    high:     tasks.filter(t => t.priority === 'high').length,
    medium:   tasks.filter(t => t.priority === 'medium').length,
    low:      tasks.filter(t => t.priority === 'low').length,
  }

  return `You are an expert IT Project Manager writing a professional post-mortem / lessons learned report for a completed IT project.

PROJECT DETAILS:
- Project Name: ${project.name}
- Description: ${project.description || 'Not provided'}
- Planned Start: ${project.start_date || 'Not set'}
- Planned End: ${project.end_date || 'Not set'}
- Planned Duration: ${plannedDays ? `${plannedDays} days` : 'Not set'}

TASK STATISTICS:
- Total Tasks: ${total}
- Completed: ${done.length} (${pct}%)
- Overdue at closure: ${overdue.length}
- Blocked tasks remaining: ${blocked.length}
- Incomplete (backlog): ${backlog.length}
- Priority breakdown — Critical: ${priorities.critical}, High: ${priorities.high}, Medium: ${priorities.medium}, Low: ${priorities.low}

COMPLETED TASKS (sample):
${done.slice(0, 10).map(t => `- ${t.title}${t.assignee_name ? ` (${t.assignee_name})` : ''}`).join('\n') || 'None'}

OVERDUE / INCOMPLETE TASKS:
${overdue.slice(0, 8).map(t => `- ${t.title} (was due ${t.due_date})`).join('\n') || 'None'}

BLOCKED TASKS:
${blocked.map(t => `- ${t.title}`).join('\n') || 'None'}

Write a detailed, professional post-mortem report with EXACTLY these sections in order. Use the exact section headers shown:

## Executive Summary
(2-3 sentences summarising the project outcome, completion rate and overall assessment)

## ✅ What Went Well
(Bullet points — at least 4 specific positive aspects based on the data)

## ⚠️ What Went Wrong
(Bullet points — at least 4 specific issues or challenges based on the data. If completion is 100% and no blockers, note minor improvements)

## 🔍 Root Cause Analysis
(For each major issue identified in "What Went Wrong", provide a root cause. Use the "5 Whys" approach where applicable)

## 🎓 Lessons Learned
(Bullet points — at least 5 concrete lessons the team should carry forward)

## 🚀 Recommendations for Next Project
(Bullet points — at least 5 specific, actionable recommendations for future similar IT projects)

## 📅 Timeline vs Actual
(Analyse the planned vs actual timeline based on the data provided. Comment on task completion rates, overdue items and what this means for future planning)

## 🛡️ Risk & Issues Summary
(Summarise risks that materialised based on blocked/overdue tasks. Identify patterns. Recommend risk mitigation improvements)

Be specific, professional and constructive. Base all observations on the actual project data provided. Write as if presenting to a steering committee. Use UK English spelling.`
}

// ── Parse sections from AI response ───────────────────────
function parseSections(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  const sectionMap: Record<string, string> = {
    'Executive Summary':                     'summary',
    'What Went Well':                        'went_well',
    'What Went Wrong':                       'went_wrong',
    'Root Cause Analysis':                   'root_cause',
    'Lessons Learned':                       'lessons',
    'Recommendations for Next Project':      'recommendations',
    'Timeline vs Actual':                    'timeline',
    'Risk & Issues Summary':                 'risks',
  }

  // Split by ## headers
  const parts = text.split(/^##\s+/m).filter(Boolean)
  for (const part of parts) {
    const lines = part.split('\n')
    const header = lines[0].replace(/[✅⚠️🔍🎓🚀📅🛡️📋]/g, '').trim()
    const body   = lines.slice(1).join('\n').trim()
    for (const [key, id] of Object.entries(sectionMap)) {
      if (header.includes(key)) {
        result[id] = body
        break
      }
    }
  }

  // If parsing failed, put everything in summary
  if (Object.keys(result).length === 0) {
    result['summary'] = text
  }

  return result
}

// ── Format section content ────────────────────────────────
function SectionContent({ text }: { text: string }) {
  const lines = text.split('\n').filter(l => l.trim())
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')
        const isNumber = /^\d+\./.test(line.trim())
        const clean    = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
        if (!clean) return null
        if (isBullet || isNumber) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-2" />
              <p className="text-sm text-slate-700 leading-relaxed">{clean}</p>
            </div>
          )
        }
        return <p key={i} className="text-sm text-slate-700 leading-relaxed">{clean}</p>
      })}
    </div>
  )
}

export default function PostMortemGenerator({ project, tasks, onClose }: Props) {
  const [generating, setGenerating]   = useState(false)
  const [sections,   setSections]     = useState<Record<string, string>>({})
  const [rawText,    setRawText]       = useState('')
  const [activeSection, setActiveSection] = useState('summary')
  const [error,      setError]         = useState('')
  const [copying,    setCopying]       = useState(false)
  const [generated,  setGenerated]     = useState(false)

  // Stats for the header
  const total   = tasks.length
  const done    = tasks.filter(t => t.status === 'done').length
  const overdue = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()).length
  const blocked = tasks.filter(t => t.status === 'blocked').length
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      const prompt = buildPrompt(project, tasks)
      const res  = await fetch('/api/ai-text', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'AI request failed'); return }
      const text = data.text ?? ''
      if (!text.trim()) { setError('AI returned empty response. Please try again.'); return }
      setRawText(text)
      setSections(parseSections(text))
      setGenerated(true)
      setActiveSection('summary')
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function copyAll() {
    await navigator.clipboard.writeText(rawText)
    setCopying(true)
    setTimeout(() => setCopying(false), 2500)
  }

  async function copySection() {
    const text = sections[activeSection] ?? ''
    await navigator.clipboard.writeText(
      `${SECTIONS.find(s => s.id === activeSection)?.emoji} ${SECTIONS.find(s => s.id === activeSection)?.title}\n\n${text}`
    )
    setCopying(true)
    setTimeout(() => setCopying(false), 2500)
  }

  const gradeColor = pct >= 90 ? 'text-emerald-600' : pct >= 70 ? 'text-amber-600' : 'text-red-600'
  const gradeBg    = pct >= 90 ? 'bg-emerald-50 border-emerald-200' : pct >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* ── Header ───────────────────────────────────── */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-code text-purple-500 uppercase tracking-widest">Post-Mortem Report</span>
              <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full font-bold">
                ✅ Project Completed
              </span>
            </div>
            <h2 className="font-syne font-black text-xl text-slate-900">{project.name}</h2>
            {project.start_date && project.end_date && (
              <p className="text-xs text-slate-400 mt-0.5 font-mono-code">
                {new Date(project.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                {' → '}
                {new Date(project.end_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl p-1">✕</button>
        </div>

        {/* ── Stats bar ────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100">
          {[
            { label: 'Tasks Done',    value: `${done}/${total}`, sub: `${pct}% complete`,  color: gradeColor, bg: gradeBg },
            { label: 'Overdue',       value: overdue,            sub: 'at closure',         color: overdue > 0 ? 'text-red-600' : 'text-emerald-600', bg: overdue > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200' },
            { label: 'Blocked',       value: blocked,            sub: 'unresolved',         color: blocked > 0 ? 'text-amber-600' : 'text-emerald-600', bg: blocked > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200' },
            { label: 'Duration',      value: project.start_date && project.end_date ? `${Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / 86400000)}d` : 'N/A', sub: 'planned', color: 'text-slate-700', bg: 'bg-white border-slate-200' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
              <p className={`font-syne font-black text-xl ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-slate-400">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Generate prompt or Report view ───────────── */}
        {!generated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-4">🧠</div>
            <h3 className="font-syne font-black text-xl text-slate-900 mb-2">Generate Post-Mortem Report</h3>
            <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
              AI will analyse all {total} tasks, {overdue} overdue items, {blocked} blockers and project timeline
              to generate a full lessons learned report for your steering committee.
            </p>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-100 mb-4">{error}</p>
            )}
            <button onClick={generate} disabled={generating}
              className="px-8 py-3 rounded-xl text-white font-bold text-sm transition-all"
              style={{ background: generating ? '#94a3b8' : 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
                  </svg>
                  Analysing project data…
                </span>
              ) : '🧠 Generate Post-Mortem Report'}
            </button>
            <p className="text-xs text-slate-400 mt-3">Takes 15-20 seconds · Uses AI text analysis</p>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">

            {/* ── Sidebar nav ──────────────────────────── */}
            <div className="w-52 shrink-0 border-r border-slate-100 overflow-y-auto bg-slate-50">
              <div className="p-3 space-y-1">
                {SECTIONS.map(s => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2
                      ${activeSection === s.id
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'}`}>
                    <span>{s.emoji}</span>
                    <span className="leading-tight">{s.title}</span>
                    {sections[s.id] && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Section content ───────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <h3 className="font-syne font-black text-sm text-slate-900">
                  {SECTIONS.find(s => s.id === activeSection)?.emoji}{' '}
                  {SECTIONS.find(s => s.id === activeSection)?.title}
                </h3>
                <div className="flex gap-2">
                  <button onClick={copySection}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                    {copying ? '✅ Copied' : '📋 Copy Section'}
                  </button>
                  <button onClick={copyAll}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                    📄 Copy Full Report
                  </button>
                  <button onClick={() => { setGenerated(false); setSections({}); setRawText('') }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                    🔄 Regenerate
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {sections[activeSection] ? (
                  <SectionContent text={sections[activeSection]} />
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-2xl mb-2">📄</p>
                    <p className="text-sm">Section not generated yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-400 font-mono-code">
            🧠 AI-generated · Based on {total} tasks · {new Date().toLocaleDateString('en-GB')}
          </p>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
