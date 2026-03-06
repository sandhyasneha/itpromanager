'use client'
// ============================================================
// src/components/BudgetTracker.tsx
// NEW FILE — Budget Tracker
// Shows total budget, contingency, effective budget,
// schedule overrun cost estimate and RAG status
// Only visible if PM has set a budget on the project
// ============================================================

interface Project {
  id:                  string
  name:                string
  start_date?:         string
  end_date?:           string
  status?:             string
  budget_total?:       number | string | null
  budget_currency?:    string
  budget_contingency?: number | string | null
}

interface Task {
  id:        string
  title:     string
  status:    string
  priority:  string
  due_date?: string
  project_id: string
}

interface Props {
  project: Project
  tasks:   Task[]
  onClose: () => void
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', GBP: '£', EUR: '€', INR: '₹', AED: 'د.إ', SGD: 'S$',
}

function fmt(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOLS[currency] ?? '$'
  if (amount >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000)     return `${sym}${(amount / 1_000).toFixed(1)}K`
  return `${sym}${amount.toFixed(0)}`
}

// ── Donut ring chart (SVG) ────────────────────────────────
function DonutRing({ pct, color, size = 120, stroke = 14 }: {
  pct: number; color: string; size?: number; stroke?: number
}) {
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}/>
    </svg>
  )
}

export default function BudgetTracker({ project, tasks, onClose }: Props) {
  const total       = Number(project.budget_total ?? 0)
  const contPct     = Number(project.budget_contingency ?? 15)
  const currency    = project.budget_currency ?? 'USD'
  const sym         = CURRENCY_SYMBOLS[currency] ?? '$'

  const contingency    = total * contPct / 100
  const effectiveBudget = total - contingency

  // Schedule overrun calculation
  const today        = new Date()
  const plannedEnd   = project.end_date ? new Date(project.end_date) : null
  const plannedStart = project.start_date ? new Date(project.start_date) : null
  const plannedDays  = plannedStart && plannedEnd
    ? Math.ceil((plannedEnd.getTime() - plannedStart.getTime()) / 86400000)
    : null

  const overrunDays  = plannedEnd && today > plannedEnd && project.status !== 'completed'
    ? Math.ceil((today.getTime() - plannedEnd.getTime()) / 86400000)
    : 0

  const dailyBurnRate = plannedDays && plannedDays > 0
    ? effectiveBudget / plannedDays
    : 0

  const overrunCost    = overrunDays * dailyBurnRate
  const totalAtRisk    = overrunCost
  const atRiskPct      = effectiveBudget > 0 ? (totalAtRisk / effectiveBudget) * 100 : 0
  const budgetUsedPct  = effectiveBudget > 0 ? Math.min((totalAtRisk / effectiveBudget) * 100, 100) : 0

  // Task stats
  const totalTasks  = tasks.length
  const doneTasks   = tasks.filter(t => t.status === 'done').length
  const overdue     = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < today).length
  const blocked     = tasks.filter(t => t.status === 'blocked').length
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // RAG
  const rag = atRiskPct === 0
    ? { label: 'On Budget',    color: '#22d3a5', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', ring: '#22d3a5' }
    : atRiskPct < 30
    ? { label: 'Minor Overrun', color: '#f59e0b', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   ring: '#f59e0b' }
    : atRiskPct < 70
    ? { label: 'At Risk',       color: '#ef4444', bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     ring: '#ef4444' }
    : { label: 'Over Budget',   color: '#7f1d1d', bg: 'bg-red-100',    border: 'border-red-300',     text: 'text-red-800',     ring: '#ef4444' }

  // AI-style recommendation
  const recommendation = overrunDays === 0
    ? project.status === 'completed'
      ? `Project delivered within planned timeline. No budget overrun from schedule slippage.`
      : `Project is currently within its planned timeline. Monitor weekly to maintain on-budget status.`
    : `Schedule has overrun by ${overrunDays} day${overrunDays > 1 ? 's' : ''}. At a daily burn rate of ${fmt(dailyBurnRate, currency)}/day, estimated additional cost is ${fmt(overrunCost, currency)}. ${atRiskPct > 50 ? 'Escalate to steering committee and review scope immediately.' : 'Review blockers and overdue tasks to get back on track.'}`

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-mono-code text-emerald-500 uppercase tracking-widest mb-1">💰 Budget Tracker</p>
            <h2 className="font-syne font-black text-xl text-slate-900">{project.name}</h2>
            {project.start_date && project.end_date && (
              <p className="text-xs text-slate-400 mt-0.5 font-mono-code">
                {new Date(project.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                {' → '}
                {new Date(project.end_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                {plannedDays ? ` · ${plannedDays} days planned` : ''}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl p-1">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Budget overview cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Budget',      value: fmt(total, currency),          sub: '100% allocated',                    color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
              { label: 'Contingency Reserve', value: fmt(contingency, currency),  sub: `${contPct}% buffer`,                color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
              { label: 'Effective Budget',  value: fmt(effectiveBudget, currency), sub: 'Available for delivery',           color: 'text-cyan-600',  bg: 'bg-cyan-50 border-cyan-200' },
            ].map(c => (
              <div key={c.label} className={`rounded-xl border p-4 text-center ${c.bg}`}>
                <p className={`font-syne font-black text-2xl ${c.color}`}>{c.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{c.label}</p>
                <p className="text-[10px] text-slate-400">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Main RAG + donut */}
          <div className={`rounded-2xl border-2 p-5 ${rag.border} ${rag.bg}`}>
            <div className="flex items-center gap-6">

              {/* Donut */}
              <div className="relative shrink-0">
                <DonutRing pct={budgetUsedPct} color={rag.ring} size={110} stroke={12} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={`font-syne font-black text-lg leading-none ${rag.text}`}>
                    {Math.round(atRiskPct)}%
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">at risk</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-syne font-black ${rag.text}`}>{rag.label}</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${rag.border} ${rag.text} ${rag.bg}`}>
                    {overrunDays > 0 ? `${overrunDays}d overrun` : 'On schedule'}
                  </span>
                </div>

                {/* Budget bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Effective Budget</span>
                      <span className="font-bold">{fmt(effectiveBudget, currency)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-cyan-400 transition-all duration-700" style={{ width: '100%' }}/>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Schedule Overrun Cost</span>
                      <span className="font-bold" style={{ color: rag.color }}>{fmt(overrunCost, currency)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(budgetUsedPct, 100)}%`, background: rag.color }}/>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Contingency Remaining</span>
                      <span className="font-bold text-amber-600">
                        {fmt(Math.max(contingency - overrunCost, 0), currency)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400 transition-all duration-700"
                        style={{ width: `${Math.min(Math.max((contingency - overrunCost) / contingency * 100, 0), 100)}%` }}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Daily Burn Rate',    value: fmt(dailyBurnRate, currency),  sub: 'per day',          color: 'text-slate-700' },
              { label: 'Overrun Days',       value: `${overrunDays}d`,             sub: 'past planned end', color: overrunDays > 0 ? 'text-red-600' : 'text-emerald-600' },
              { label: 'Tasks Complete',     value: `${completionPct}%`,           sub: `${doneTasks}/${totalTasks}`, color: 'text-cyan-600' },
              { label: 'Overdue Tasks',      value: overdue,                        sub: `${blocked} blocked`, color: overdue > 0 ? 'text-red-600' : 'text-emerald-600' },
            ].map(m => (
              <div key={m.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <p className={`font-syne font-black text-xl ${m.color}`}>{m.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{m.label}</p>
                <p className="text-[10px] text-slate-400">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Projected final cost */}
          {overrunDays > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-syne font-black text-red-700 mb-2">📈 Projected Final Cost</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-slate-500">Original Budget</p>
                  <p className="font-syne font-black text-base text-slate-700">{fmt(total, currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Overrun Cost</p>
                  <p className="font-syne font-black text-base text-red-600">+{fmt(overrunCost, currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Projected Total</p>
                  <p className="font-syne font-black text-base text-red-700">{fmt(total + overrunCost, currency)}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Recommendation */}
          <div className="bg-slate-800 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl shrink-0">🧠</span>
            <div>
              <p className="text-xs font-syne font-black text-white mb-1">AI Budget Assessment</p>
              <p className="text-xs text-slate-300 leading-relaxed">{recommendation}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="text-[10px] text-slate-400 bg-slate-50 rounded-xl p-3 leading-relaxed">
            <span className="font-bold text-slate-500">How overrun cost is calculated: </span>
            Overrun Cost = Schedule Overrun Days × (Effective Budget ÷ Planned Duration).
            This estimates the additional cost of the project running beyond its planned end date.
            Contingency absorbs overrun first — if overrun exceeds contingency, the project is over budget.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-400 font-mono-code">
            💰 Budget set: {fmt(total, currency)} {currency} · {contPct}% contingency
          </p>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
