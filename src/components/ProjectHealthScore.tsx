'use client'
// ============================================================
// src/components/ProjectHealthScore.tsx
// NEW FILE — AI-powered Project Health Score widget
// Shows: numeric score 0-100, RAG gauge, AI one-liner,
//        per-project breakdown, trend indicators
// ============================================================
import { useState, useEffect } from 'react'

interface ProjectStat {
  id:         string
  name:       string
  color?:     string
  rag:        'red' | 'amber' | 'green'
  progress:   number
  tasks:      any[]
  overdue:    any[]
  blocked:    any[]
  redRisks:   any[]
  daysLeft:   number | null
}

interface Props {
  projects:      ProjectStat[]
  totalTasks:    number
  totalDone:     number
  totalOverdue:  number
  totalBlocked:  number
  totalRedRisks: number
  ragCounts:     { red: number; amber: number; green: number }
  portfolioPct:  number
}

// ── Score calculation engine ──────────────────────────────
function calculateHealthScore(props: Props): {
  score:       number
  grade:       'A' | 'B' | 'C' | 'D' | 'F'
  rag:         'red' | 'amber' | 'green'
  breakdown:   { label: string; score: number; max: number; icon: string }[]
  penalties:   string[]
  positives:   string[]
} {
  const { projects, totalTasks, totalDone, totalOverdue, totalBlocked, totalRedRisks, portfolioPct } = props

  let score = 100
  const penalties:  string[] = []
  const positives:  string[] = []

  // ── Completion rate (0-30 pts) ────────────────────────
  const completionScore = Math.round((portfolioPct / 100) * 30)

  // ── Overdue penalty (-5 per overdue task, max -25) ───
  const overduePenalty = Math.min(totalOverdue * 5, 25)
  if (totalOverdue > 0) penalties.push(`${totalOverdue} overdue task${totalOverdue > 1 ? 's' : ''}`)

  // ── Blocked penalty (-8 per blocked task, max -24) ───
  const blockedPenalty = Math.min(totalBlocked * 8, 24)
  if (totalBlocked > 0) penalties.push(`${totalBlocked} blocked task${totalBlocked > 1 ? 's' : ''}`)

  // ── Red risk penalty (-10 per red risk, max -20) ─────
  const riskPenalty = Math.min(totalRedRisks * 10, 20)
  if (totalRedRisks > 0) penalties.push(`${totalRedRisks} red risk${totalRedRisks > 1 ? 's' : ''}`)

  // ── At-risk projects penalty (-3 per red project) ────
  const redProjectPenalty = props.ragCounts.red * 3
  if (props.ragCounts.red > 0) penalties.push(`${props.ragCounts.red} project${props.ragCounts.red > 1 ? 's' : ''} at risk`)

  // ── Positives ─────────────────────────────────────────
  if (portfolioPct >= 80) positives.push('Strong completion rate')
  if (totalOverdue === 0) positives.push('All tasks on schedule')
  if (totalBlocked === 0) positives.push('No blockers')
  if (totalRedRisks === 0) positives.push('No red risks')
  if (props.ragCounts.green === projects.length && projects.length > 0) positives.push('All projects on track')

  // ── Final score ───────────────────────────────────────
  const finalScore = Math.max(0, Math.min(100,
    completionScore + (100 - 30) - overduePenalty - blockedPenalty - riskPenalty - redProjectPenalty
  ))

  // Simplified: base 70 + completion bonus - penalties
  const cleanScore = Math.max(0, Math.min(100,
    70 + Math.round((portfolioPct / 100) * 30) - overduePenalty - blockedPenalty - riskPenalty - redProjectPenalty
  ))

  const grade: 'A' | 'B' | 'C' | 'D' | 'F' =
    cleanScore >= 90 ? 'A' :
    cleanScore >= 75 ? 'B' :
    cleanScore >= 60 ? 'C' :
    cleanScore >= 45 ? 'D' : 'F'

  const rag: 'red' | 'amber' | 'green' =
    cleanScore >= 70 ? 'green' :
    cleanScore >= 45 ? 'amber' : 'red'

  const breakdown = [
    { label: 'Task Completion', score: Math.round((portfolioPct / 100) * 30), max: 30, icon: '✅' },
    { label: 'No Overdue',      score: Math.max(0, 25 - overduePenalty),       max: 25, icon: '📅' },
    { label: 'No Blockers',     score: Math.max(0, 24 - blockedPenalty),       max: 24, icon: '🚫' },
    { label: 'Risk Control',    score: Math.max(0, 21 - riskPenalty),          max: 21, icon: '🛡️' },
  ]

  return { score: cleanScore, grade, rag, breakdown, penalties, positives }
}

// ── AI explanation generator (client-side, no token cost) ─
function generateExplanation(health: ReturnType<typeof calculateHealthScore>, projects: ProjectStat[]): string {
  const { score, rag, penalties, positives } = health

  if (projects.length === 0) return "No projects yet — create your first project to start tracking portfolio health."

  if (rag === 'green') {
    if (score >= 95) return `Portfolio is in excellent shape — ${positives.join(', ')}. Keep up the momentum! 🚀`
    return `Portfolio is healthy — ${positives.slice(0, 2).join(' and ')}. ${penalties.length > 0 ? `Minor attention needed on ${penalties[0]}.` : 'All systems go!'}`
  }

  if (rag === 'amber') {
    const main = penalties.slice(0, 2).join(' and ')
    return `Portfolio needs attention — ${main}. Address these to move back to Green status. ${positives.length > 0 ? `Positive: ${positives[0]}.` : ''}`
  }

  // Red
  const critical = penalties.join(', ')
  return `Portfolio is at risk — ${critical}. Immediate action required on blocked tasks and overdue items to prevent project delays.`
}

// ── Gauge SVG ─────────────────────────────────────────────
function HealthGauge({ score, rag }: { score: number; rag: 'red' | 'amber' | 'green' }) {
  const color = rag === 'green' ? '#22d3a5' : rag === 'amber' ? '#f59e0b' : '#ef4444'
  const r = 54
  const cx = 70
  const cy = 70
  const circumference = Math.PI * r  // half circle
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="80" viewBox="0 0 140 85">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease', transformOrigin: 'center', transform: 'rotate(0deg)' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="26" fontWeight="900"
          fontFamily="Syne, sans-serif" fill={color}>
          {score}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10"
          fontFamily="DM Sans, sans-serif" fill="#94a3b8">
          out of 100
        </text>
      </svg>
    </div>
  )
}

export default function ProjectHealthScore({
  projects, totalTasks, totalDone, totalOverdue,
  totalBlocked, totalRedRisks, ragCounts, portfolioPct
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const health = calculateHealthScore({
    projects, totalTasks, totalDone, totalOverdue,
    totalBlocked, totalRedRisks, ragCounts, portfolioPct
  })

  const explanation = generateExplanation(health, projects)

  const RAG_STYLE = {
    green: { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Healthy',  color: '#22d3a5' },
    amber: { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700 border-amber-200',     dot: 'bg-amber-400',   label: 'Caution',  color: '#f59e0b' },
    red:   { bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700 border-red-200',           dot: 'bg-red-400',     label: 'At Risk',  color: '#ef4444' },
  }

  const style = RAG_STYLE[health.rag]

  const GRADE_STYLE: Record<string, string> = {
    A: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    B: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    C: 'text-amber-600 bg-amber-50 border-amber-200',
    D: 'text-orange-600 bg-orange-50 border-orange-200',
    F: 'text-red-600 bg-red-50 border-red-200',
  }

  if (projects.length === 0) return null

  return (
    <div className={`card border-2 ${style.border} ${style.bg} transition-all duration-500`}>

      {/* ── Header row ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${style.dot} animate-pulse shrink-0`} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-syne font-black text-base text-slate-900">Portfolio Health Score</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                {style.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              AI-calculated across {projects.length} project{projects.length > 1 ? 's' : ''} · {totalTasks} tasks
            </p>
          </div>
        </div>

        {/* Grade badge */}
        <div className={`text-center px-4 py-2 rounded-2xl border-2 font-syne font-black ${GRADE_STYLE[health.grade]}`}>
          <p className="text-3xl leading-none">{health.grade}</p>
          <p className="text-[9px] uppercase tracking-widest mt-0.5 opacity-70">Grade</p>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────── */}
      <div className="mt-4 grid md:grid-cols-3 gap-4">

        {/* Gauge */}
        <div className="flex flex-col items-center justify-center">
          <HealthGauge score={animated ? health.score : 0} rag={health.rag} />
          <div className="flex gap-2 mt-1">
            {(['green','amber','red'] as const).map(r => (
              <span key={r} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RAG_STYLE[r].badge}`}>
                {ragCounts[r]} {r}
              </span>
            ))}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">Score Breakdown</p>
          {health.breakdown.map(b => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span>{b.icon}</span>{b.label}
                </span>
                <span className="text-xs font-mono-code font-bold text-slate-700">
                  {b.score}/{b.max}
                </span>
              </div>
              <div className="h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: animated ? `${(b.score / b.max) * 100}%` : '0%',
                    background: b.score / b.max >= 0.8 ? '#22d3a5' : b.score / b.max >= 0.5 ? '#f59e0b' : '#ef4444'
                  }} />
              </div>
            </div>
          ))}
        </div>

        {/* AI explanation + signals */}
        <div className="space-y-3">
          <p className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">AI Analysis</p>

          {/* Explanation */}
          <div className={`p-3 rounded-xl border ${style.border} bg-white/60`}>
            <p className="text-xs text-slate-700 leading-relaxed">{explanation}</p>
          </div>

          {/* Penalties */}
          {health.penalties.length > 0 && (
            <div className="space-y-1">
              {health.penalties.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          )}

          {/* Positives */}
          {health.positives.length > 0 && (
            <div className="space-y-1">
              {health.positives.slice(0, 2).map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Per-project scores (expandable) ────────────── */}
      {projects.length > 1 && (
        <div className="mt-4 pt-4 border-t border-slate-200/60">
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
            {expanded ? 'Hide' : 'Show'} per-project health scores
          </button>

          {expanded && (
            <div className="mt-3 grid md:grid-cols-2 gap-2">
              {projects.map(p => {
                const pHealth = calculateHealthScore({
                  projects: [p],
                  totalTasks:    p.tasks.length,
                  totalDone:     p.tasks.filter((t: any) => t.status === 'done').length,
                  totalOverdue:  p.overdue.length,
                  totalBlocked:  p.blocked.length,
                  totalRedRisks: p.redRisks.length,
                  ragCounts:     { red: p.rag === 'red' ? 1 : 0, amber: p.rag === 'amber' ? 1 : 0, green: p.rag === 'green' ? 1 : 0 },
                  portfolioPct:  p.progress,
                })
                const ps = RAG_STYLE[pHealth.rag]
                return (
                  <div key={p.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${ps.border} bg-white/70`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || '#00d4ff' }} />
                    <span className="text-xs font-semibold text-slate-800 flex-1 truncate">{p.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pHealth.score}%`, background: ps.color }} />
                      </div>
                      <span className={`text-[11px] font-mono-code font-bold ${ps.text}`}>{pHealth.score}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${GRADE_STYLE[pHealth.grade]}`}>
                        {pHealth.grade}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
