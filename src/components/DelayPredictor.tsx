'use client'
// ============================================================
// src/components/DelayPredictor.tsx
// NEW FILE — Project Delay Predictor
// Calculates task completion velocity → predicts finish date
// Shows per-project delay risk on Dashboard
// ============================================================

interface Project {
  id:         string
  name:       string
  color?:     string
  start_date?: string
  end_date?:  string
  status?:    string
}

interface Task {
  id:          string
  project_id:  string
  status:      string
  priority:    string
  due_date?:   string
  updated_at?: string
  created_at?: string
}

interface Props {
  projects: Project[]
  tasks:    Task[]
}

// ── Velocity calculation ──────────────────────────────────
// Count tasks moved to 'done' in the last 14 days
function calcVelocity(tasks: Task[]): number {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const recentDone = tasks.filter(t =>
    t.status === 'done' &&
    t.updated_at &&
    new Date(t.updated_at) >= cutoff
  ).length
  // Tasks per week (14-day window ÷ 2)
  return recentDone / 2
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000)
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface ProjectPrediction {
  project:          Project
  totalTasks:       number
  doneTasks:        number
  remainingTasks:   number
  velocityPerWeek:  number
  weeksToComplete:  number | null
  predictedEnd:     Date | null
  plannedEnd:       Date | null
  delayDays:        number    // negative = early, positive = late
  status:           'on_track' | 'at_risk' | 'delayed' | 'no_data' | 'completed'
  recommendation:   string
}

function predict(project: Project, tasks: Task[]): ProjectPrediction {
  const totalTasks     = tasks.length
  const doneTasks      = tasks.filter(t => t.status === 'done').length
  const remainingTasks = tasks.filter(t => t.status !== 'done').length
  const velocityPerWeek = calcVelocity(tasks)
  const plannedEnd     = project.end_date ? new Date(project.end_date) : null
  const today          = new Date()

  // Already completed
  if (project.status === 'completed') {
    return { project, totalTasks, doneTasks, remainingTasks: 0, velocityPerWeek, weeksToComplete: 0, predictedEnd: plannedEnd, plannedEnd, delayDays: 0, status: 'completed', recommendation: 'Project completed.' }
  }

  // No tasks
  if (totalTasks === 0) {
    return { project, totalTasks, doneTasks, remainingTasks, velocityPerWeek, weeksToComplete: null, predictedEnd: null, plannedEnd, delayDays: 0, status: 'no_data', recommendation: 'No tasks found. Add tasks to enable delay prediction.' }
  }

  // All done
  if (remainingTasks === 0) {
    return { project, totalTasks, doneTasks, remainingTasks, velocityPerWeek, weeksToComplete: 0, predictedEnd: today, plannedEnd, delayDays: plannedEnd ? daysBetween(today, plannedEnd) * -1 : 0, status: 'on_track', recommendation: 'All tasks complete. Project ready to close.' }
  }

  // No velocity — no tasks completed recently
  if (velocityPerWeek === 0) {
    const delayDays = plannedEnd ? Math.max(0, daysBetween(plannedEnd, today)) : 0
    return {
      project, totalTasks, doneTasks, remainingTasks, velocityPerWeek,
      weeksToComplete: null, predictedEnd: null, plannedEnd, delayDays,
      status: delayDays > 0 ? 'delayed' : 'at_risk',
      recommendation: `No tasks completed in the last 14 days. With ${remainingTasks} tasks remaining, team velocity needs to increase immediately.`,
    }
  }

  const weeksToComplete = remainingTasks / velocityPerWeek
  const predictedEnd    = new Date(today)
  predictedEnd.setDate(today.getDate() + Math.ceil(weeksToComplete * 7))

  const delayDays = plannedEnd ? daysBetween(plannedEnd, predictedEnd) : 0

  let status: ProjectPrediction['status'] = 'on_track'
  if (delayDays > 14)      status = 'delayed'
  else if (delayDays > 0)  status = 'at_risk'
  else                     status = 'on_track'

  // Recommendation
  let recommendation = ''
  if (status === 'on_track') {
    recommendation = `At ${velocityPerWeek.toFixed(1)} tasks/week, project is on track to complete ${delayDays < 0 ? `${Math.abs(delayDays)} days early` : 'on time'} by ${formatDate(predictedEnd)}.`
  } else if (status === 'at_risk') {
    const neededVelocity = plannedEnd ? (remainingTasks / (daysBetween(today, plannedEnd) / 7)) : 0
    recommendation = `At current pace, project will finish ${delayDays} days late. Team needs ${neededVelocity.toFixed(1)} tasks/week to deliver on time.`
  } else {
    const neededVelocity = plannedEnd ? (remainingTasks / Math.max(daysBetween(today, plannedEnd) / 7, 0.1)) : 0
    recommendation = `Project is ${delayDays} days behind schedule. ${velocityPerWeek.toFixed(1)} tasks/week current vs ${neededVelocity.toFixed(1)} needed. Escalate to steering committee.`
  }

  return { project, totalTasks, doneTasks, remainingTasks, velocityPerWeek, weeksToComplete, predictedEnd, plannedEnd, delayDays, status, recommendation }
}

// ── Status config ─────────────────────────────────────────
const STATUS_CFG = {
  on_track:  { label: 'On Track',   dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',  bar: '#22d3a5' },
  at_risk:   { label: 'At Risk',    dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',        bar: '#f59e0b' },
  delayed:   { label: 'Delayed',    dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200',              bar: '#ef4444' },
  no_data:   { label: 'No Data',    dot: 'bg-slate-300',   badge: 'bg-slate-50 text-slate-500 border-slate-200',        bar: '#94a3b8' },
  completed: { label: 'Completed',  dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 border-blue-200',           bar: '#3b82f6' },
}

export default function DelayPredictor({ projects, tasks }: Props) {
  const today = new Date()

  // Only show active projects with tasks
  const activePredictions = projects
    .filter(p => p.status !== 'cancelled')
    .map(p => predict(p, tasks.filter(t => t.project_id === p.id)))
    .filter(p => p.totalTasks > 0)
    .sort((a, b) => {
      // Sort: delayed first, then at_risk, then on_track
      const order = { delayed: 0, at_risk: 1, no_data: 2, on_track: 3, completed: 4 }
      return order[a.status] - order[b.status]
    })

  if (activePredictions.length === 0) return null

  const delayedCount  = activePredictions.filter(p => p.status === 'delayed').length
  const atRiskCount   = activePredictions.filter(p => p.status === 'at_risk').length
  const onTrackCount  = activePredictions.filter(p => p.status === 'on_track').length

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-syne font-black text-base">🔮 Project Delay Predictor</h3>
          <p className="text-xs text-muted mt-0.5">Velocity-based delivery forecast — based on last 14 days of task completions</p>
        </div>
        <div className="flex gap-2">
          {delayedCount  > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">{delayedCount} Delayed</span>}
          {atRiskCount   > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{atRiskCount} At Risk</span>}
          {onTrackCount  > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">{onTrackCount} On Track</span>}
        </div>
      </div>

      {/* Project rows */}
      <div className="space-y-3">
        {activePredictions.map(pred => {
          const cfg        = STATUS_CFG[pred.status]
          const completePct = pred.totalTasks > 0 ? Math.round((pred.doneTasks / pred.totalTasks) * 100) : 0

          return (
            <div key={pred.project.id}
              className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">

              {/* Row 1: Project name + status badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pred.project.color || '#00d4ff' }}/>
                  <p className="font-syne font-bold text-sm text-slate-900 truncate">{pred.project.name}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badge}`}>
                  {cfg.label}
                  {pred.delayDays > 0 && ` · ${pred.delayDays}d late`}
                  {pred.delayDays < 0 && pred.status === 'on_track' && ` · ${Math.abs(pred.delayDays)}d early`}
                </span>
              </div>

              {/* Row 2: Progress bar + stats */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>{pred.doneTasks}/{pred.totalTasks} tasks done</span>
                  <span className="font-bold">{completePct}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${completePct}%`, background: cfg.bar }}/>
                </div>
              </div>

              {/* Row 3: Key metrics */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="font-syne font-black text-sm text-slate-700">
                    {pred.velocityPerWeek > 0 ? pred.velocityPerWeek.toFixed(1) : '—'}
                  </p>
                  <p className="text-[9px] text-slate-400">tasks/week</p>
                </div>
                <div className="text-center">
                  <p className="font-syne font-black text-sm text-slate-700">{pred.remainingTasks}</p>
                  <p className="text-[9px] text-slate-400">remaining</p>
                </div>
                <div className="text-center">
                  <p className={`font-syne font-black text-sm ${pred.delayDays > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {pred.delayDays > 0 ? `+${pred.delayDays}d` : pred.delayDays < 0 ? `${pred.delayDays}d` : '0d'}
                  </p>
                  <p className="text-[9px] text-slate-400">variance</p>
                </div>
                <div className="text-center">
                  <p className="font-syne font-black text-sm text-slate-700">
                    {pred.predictedEnd ? formatDate(pred.predictedEnd) : pred.plannedEnd ? formatDate(pred.plannedEnd) : '—'}
                  </p>
                  <p className="text-[9px] text-slate-400">predicted end</p>
                </div>
              </div>

              {/* Row 4: AI recommendation */}
              <div className="flex items-start gap-2 bg-slate-800/5 rounded-lg px-3 py-2">
                <span className="text-sm shrink-0">🧠</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">{pred.recommendation}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-slate-400 mt-3 text-center">
        Velocity calculated from tasks completed in last 14 days · Updates on page refresh
      </p>
    </div>
  )
}
