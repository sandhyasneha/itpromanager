'use client'
import { useState, useCallback } from 'react'
import PCRManager from '@/components/PCRManager'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createClient } from '@/lib/supabase/client'
import type { KanbanColumn, Task, TaskStatus, TaskPriority, Project } from '@/types'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:      'bg-muted/10 text-muted',
  medium:   'bg-accent/10 text-accent',
  high:     'bg-warn/10 text-warn',
  critical: 'bg-danger/10 text-danger',
}
const COL_BORDERS: Record<TaskStatus, string> = {
  backlog:     'border-border',
  in_progress: 'border-accent/30',
  review:      'border-warn/30',
  blocked:     'border-danger/30',
  done:        'border-accent3/30',
}
const STATUSES: TaskStatus[] = ['backlog', 'in_progress', 'review', 'blocked', 'done']

function buildColumns(tasks: Task[]): KanbanColumn[] {
  const META: Record<TaskStatus, { title: string; emoji: string; color: string }> = {
    backlog:     { title: 'Backlog',     emoji: '🗂',  color: 'text-muted' },
    in_progress: { title: 'In Progress', emoji: '⚡',  color: 'text-accent' },
    review:      { title: 'Review',      emoji: '👁',  color: 'text-warn' },
    blocked:     { title: 'Blocked',     emoji: '🚫',  color: 'text-danger' },
    done:        { title: 'Done',        emoji: '✅',  color: 'text-accent3' },
  }
  return STATUSES.map(id => ({ id, ...META[id], tasks: tasks.filter(t => t.status === id) }))
}

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24))
}

function addDays(date: string, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Timeline / Gantt View
function TimelineView({ tasks, project, onEditTask, onEditProject }: {
  tasks: Task[]
  project: Project | null
  onEditTask: (t: Task) => void
  onEditProject: () => void
}) {
  const allTasks = tasks.filter(t => t.start_date && t.end_date)
  const unscheduled = tasks.filter(t => !t.start_date || !t.end_date)

  if (!project?.start_date || !project?.end_date) {
    return (
      <div className="card text-center py-16">
        <p className="text-4xl mb-3">📅</p>
        <h3 className="font-syne font-bold text-lg mb-2">Set Project Dates First</h3>
        <p className="text-muted text-sm mb-4">Add a start and end date to your project to see the Gantt chart.</p>
        <button onClick={onEditProject} className="btn-primary px-5 py-2">Set Project Dates</button>
      </div>
    )
  }

  if (allTasks.length === 0) {
    return (
      <div className="card text-center py-16">
        <p className="text-4xl mb-3">🗓️</p>
        <h3 className="font-syne font-bold text-lg mb-2">No Tasks with Dates Yet</h3>
        <p className="text-muted text-sm">Click <strong>edit</strong> on any task card → add Start Date + End Date → it appears on the Gantt.</p>
      </div>
    )
  }

  const projectStart = project.start_date!
  const projectEnd   = project.end_date!
  const totalDays    = daysBetween(projectStart, projectEnd) + 1

  // Sort tasks by start date
  const sortedTasks = [...allTasks].sort((a, b) =>
    new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()
  )

  // Critical path
  const criticalTaskIds = new Set<string>()
  let latestEnd = projectStart
  sortedTasks.forEach(t => {
    if (t.end_date! >= latestEnd) { latestEnd = t.end_date!; criticalTaskIds.add(t.id) }
  })

  // Progress % per status
  const progressByStatus: Record<string, number> = {
    done: 100, in_progress: 50, review: 80, blocked: 25, backlog: 0,
  }

  // Overall project progress
  const totalProgress = Math.round(
    allTasks.reduce((sum, t) => sum + (progressByStatus[t.status] ?? 0), 0) / allTasks.length
  )

  // Done tasks count
  const doneCount = allTasks.filter(t => t.status === 'done').length

  // Build daily columns — group by month for headers, show every day
  const days: { date: Date; label: string; dayNum: number }[] = []
  const monthGroups: { label: string; startIdx: number; count: number }[] = []
  let curDate = new Date(projectStart + 'T00:00:00')
  const endDate = new Date(projectEnd + 'T00:00:00')
  let lastMonth = -1
  while (curDate <= endDate) {
    if (curDate.getMonth() !== lastMonth) {
      monthGroups.push({
        label: curDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        startIdx: days.length,
        count: 0,
      })
      lastMonth = curDate.getMonth()
    }
    monthGroups[monthGroups.length - 1].count++
    days.push({
      date: new Date(curDate),
      label: String(curDate.getDate()),
      dayNum: curDate.getDate(),
    })
    curDate.setDate(curDate.getDate() + 1)
  }

  const COL_W = 28 // px per day column
  const ROW_H = 44 // px per task row
  const NAME_W = 200 // px for task name column
  const today = new Date().toISOString().split('T')[0]
  const todayIdx = days.findIndex(d => d.date.toISOString().split('T')[0] === today)

  const barColors: Record<string, string> = {
    done:        '#22d3a5',
    in_progress: '#00d4ff',
    review:      '#f59e0b',
    blocked:     '#ef4444',
    backlog:     '#6b7280',
  }

  return (
    <div className="space-y-4">

      {/* Summary bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-6 flex-wrap text-sm">
            <div>
              <p className="text-xs text-muted font-mono-code">Target Date</p>
              <p className="font-syne font-bold">{new Date(projectEnd).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs text-muted font-mono-code">Duration</p>
              <p className="font-syne font-bold">{totalDays} days</p>
            </div>
            <div>
              <p className="text-xs text-muted font-mono-code">Tasks</p>
              <p className="font-syne font-bold">{doneCount} / {allTasks.length} done</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {[
              { color: '#22d3a5', label: 'Done' },
              { color: '#00d4ff', label: 'In Progress' },
              { color: '#f59e0b', label: 'Review' },
              { color: '#ef4444', label: 'Blocked / Critical' },
              { color: '#6b7280', label: 'Backlog' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: l.color }}/>
                {l.label}
              </span>
            ))}
          </div>
        </div>
        {/* Overall progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-surface2 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${totalProgress}%`, background: 'linear-gradient(90deg, #00d4ff, #22d3a5)' }}/>
          </div>
          <span className="text-sm font-syne font-bold text-accent3 w-12 text-right">{totalProgress}% completed</span>
        </div>
      </div>

      {/* Gantt chart */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${NAME_W + days.length * COL_W}px` }}>

            {/* Month headers row */}
            <div className="flex border-b border-border bg-surface2/50">
              <div style={{ width: NAME_W, minWidth: NAME_W }} className="shrink-0 border-r border-border px-3 flex items-center">
                <span className="text-xs font-syne font-bold text-muted uppercase tracking-wide">TASK</span>
              </div>
              <div className="flex">
                {monthGroups.map((mg, i) => (
                  <div key={i} className="border-r border-border/50 flex items-center justify-center"
                    style={{ width: mg.count * COL_W, height: 28 }}>
                    <span className="text-xs font-syne font-bold text-text px-2 truncate">{mg.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day number headers */}
            <div className="flex border-b border-border">
              <div style={{ width: NAME_W, minWidth: NAME_W }} className="shrink-0 border-r border-border h-7"/>
              <div className="flex">
                {days.map((d, i) => {
                  const isToday = i === todayIdx
                  const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6
                  return (
                    <div key={i}
                      className={`flex items-center justify-center border-r border-border/20 h-7
                        ${isToday ? 'bg-accent/20' : isWeekend ? 'bg-surface2/40' : ''}`}
                      style={{ width: COL_W, minWidth: COL_W }}>
                      <span className={`text-[9px] font-mono-code ${isToday ? 'text-accent font-bold' : isWeekend ? 'text-muted/50' : 'text-muted'}`}>
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Task rows */}
            {sortedTasks.map(t => {
              const taskStartIdx = daysBetween(projectStart, t.start_date!)
              const taskDuration = daysBetween(t.start_date!, t.end_date!) + 1
              const isCritical = criticalTaskIds.has(t.id)
              const progress = progressByStatus[t.status] ?? 0
              const barColor = isCritical ? '#ef4444' : barColors[t.status] || '#00d4ff'

              return (
                <div key={t.id} className={`flex border-b border-border/40 hover:bg-surface2/20 transition-colors group
                  ${isCritical ? 'bg-danger/5' : ''}`}
                  style={{ height: ROW_H }}>

                  {/* Task name cell */}
                  <div style={{ width: NAME_W, minWidth: NAME_W }}
                    className="shrink-0 border-r border-border px-3 flex flex-col justify-center cursor-pointer"
                    onClick={() => onEditTask(t)}>
                    <div className="flex items-center gap-1.5">
                      {isCritical && <span className="text-danger text-[10px]">⚠</span>}
                      <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{t.title}</span>
                    </div>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-mono-code w-fit mt-0.5 ${
                      t.priority === 'critical' ? 'bg-danger/10 text-danger' :
                      t.priority === 'high'     ? 'bg-warn/10 text-warn' :
                      t.priority === 'medium'   ? 'bg-accent/10 text-accent' : 'bg-surface2 text-muted'
                    }`}>{t.priority}</span>
                  </div>

                  {/* Day cells + bar */}
                  <div className="relative flex">
                    {days.map((d, i) => {
                      const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6
                      const isToday = i === todayIdx
                      return (
                        <div key={i}
                          className={`border-r border-border/10 h-full
                            ${isToday ? 'bg-accent/5' : isWeekend ? 'bg-surface2/30' : ''}`}
                          style={{ width: COL_W, minWidth: COL_W }}/>
                      )
                    })}

                    {/* Gantt bar */}
                    <div
                      className="absolute top-2.5 rounded-md cursor-pointer hover:brightness-110 transition-all overflow-hidden"
                      style={{
                        left: taskStartIdx * COL_W,
                        width: Math.max(taskDuration * COL_W, COL_W),
                        height: ROW_H - 20,
                        backgroundColor: barColor + '33',
                        border: `1.5px solid ${barColor}`,
                      }}
                      onClick={() => onEditTask(t)}
                      title={`${t.title}: ${t.start_date} → ${t.end_date} (${taskDuration} days) — ${progress}%`}>

                      {/* Progress fill */}
                      <div className="h-full rounded-sm transition-all"
                        style={{ width: `${progress}%`, backgroundColor: barColor, opacity: 0.7 }}/>

                      {/* Label */}
                      <div className="absolute inset-0 flex items-center px-2">
                        <span className="text-[10px] font-bold text-white whitespace-nowrap drop-shadow">
                          {taskDuration * COL_W > 50 ? `${progress}%` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Today line */}
            {todayIdx >= 0 && (
              <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: NAME_W + todayIdx * COL_W + COL_W / 2 }}>
                <div className="w-0.5 h-full bg-accent/60 relative">
                  <div className="absolute -top-1 -left-6 bg-accent text-black text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap">TODAY</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Critical path footer */}
        {criticalTaskIds.size > 0 && (
          <div className="px-4 py-2 bg-danger/5 border-t border-danger/20 flex items-center gap-2 flex-wrap">
            <span className="text-danger text-sm">⚠</span>
            <p className="text-xs text-danger font-semibold">Critical Path:</p>
            <p className="text-xs text-muted">{sortedTasks.filter(t => criticalTaskIds.has(t.id)).map(t => t.title).join(' → ')}</p>
          </div>
        )}
      </div>

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-3">
            ⏳ Unscheduled Tasks ({unscheduled.length}) — click to add dates
          </p>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map(t => (
              <button key={t.id} onClick={() => onEditTask(t)}
                className="flex items-center gap-2 px-3 py-2 bg-surface2 border border-dashed border-border hover:border-accent/50 rounded-xl text-xs transition-colors">
                <span className={`w-2 h-2 rounded-full ${
                  t.priority === 'critical' ? 'bg-danger' :
                  t.priority === 'high'     ? 'bg-warn' :
                  t.priority === 'medium'   ? 'bg-accent' : 'bg-muted'
                }`}/>
                {t.title}
                <span className="text-muted">+ dates</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Task Edit Modal
function TaskModal({ task, project, onSave, onClose, onDelete }: {
  task: Task
  project: Project | null
  onSave: (updates: Partial<Task>) => void
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    assignee_name: task.assignee_name ?? '',
    assignee_email: task.assignee_email ?? '',
    start_date: task.start_date ?? '',
    end_date: task.end_date ?? '',
    due_date: task.due_date ?? '',
    tags: (task.tags ?? []).join(', '),
  })
  const [sending, setSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const duration = form.start_date && form.end_date
    ? daysBetween(form.start_date, form.end_date) + 1
    : null

  async function sendEmail(projectName: string, assignedBy: string) {
    if (!form.assignee_email) return
    setSending(true)
    try {
      const res = await fetch('/api/send-task-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeEmail: form.assignee_email,
          assigneeName: form.assignee_name,
          taskTitle: form.title,
          taskDescription: form.description,
          projectName,
          priority: form.priority,
          startDate: form.start_date,
          endDate: form.end_date,
          duration,
          dueDate: form.due_date,
          assignedBy,
        }),
      })
      if (res.ok) setEmailSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
          <h3 className="font-syne font-black text-lg">Edit Task</h3>
          <button onClick={onClose} className="text-muted hover:text-text text-xl">✕</button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4 flex-1 min-h-0">
          {/* Title */}
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Task Title</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Description</label>
            <textarea className="input resize-none h-14" placeholder="Task details..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
          </div>

          {/* Priority + Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Priority</label>
              <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
                {['low','medium','high','critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Assignee Name</label>
              <input className="input" placeholder="John Smith" value={form.assignee_name}
                onChange={e => setForm(f => ({ ...f, assignee_name: e.target.value }))}/>
            </div>
          </div>

          {/* Timeline dates */}
          <div className="bg-surface2 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-syne font-bold text-accent uppercase tracking-wide">📅 Task Timeline</p>
              {project?.start_date && project?.end_date && (
                <span className="text-[10px] font-mono-code text-muted bg-surface px-2 py-1 rounded-lg">
                  Project: {new Date(project.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })} → {new Date(project.end_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Start Date</label>
                  <input type="date" className="input text-sm w-full" value={form.start_date}
                    onChange={e => {
                      const start = e.target.value
                      setForm(f => ({
                        ...f,
                        start_date: start,
                        end_date: f.end_date && f.end_date < start ? start : f.end_date
                      }))
                    }}/>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">End Date</label>
                  <input type="date" className="input text-sm w-full" value={form.end_date}
                    min={form.start_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Due Date (Deadline)</label>
                <input type="date" className="input text-sm w-full" value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}/>
              </div>
            </div>
            {duration && (
              <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg mt-3">
                <span className="text-accent text-sm">⏱</span>
                <span className="text-sm font-semibold text-accent">Duration: {duration} day{duration !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Tags (comma separated)</label>
            <input className="input" placeholder="network, router, config" value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}/>
          </div>

          {/* Assignee Email */}
          <div className="bg-surface2 rounded-xl p-4 space-y-3">
            <p className="text-xs font-syne font-bold text-accent2 uppercase tracking-wide">📧 Notify Assignee</p>
            <div>
              <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Assignee Email</label>
              <input type="email" className="input" placeholder="john@company.com" value={form.assignee_email}
                onChange={e => setForm(f => ({ ...f, assignee_email: e.target.value }))}/>
            </div>
            {form.assignee_email && (
              <div className="flex items-center gap-2">
                {emailSent ? (
                  <div className="flex items-center gap-2 text-accent3 text-sm font-semibold">
                    <span>✅</span> Email sent to {form.assignee_email}
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => sendEmail('Project', 'PM')}
                    disabled={sending}
                    className="flex items-center gap-2 px-4 py-2 bg-accent2/10 border border-accent2/30 text-purple-300 rounded-xl text-xs font-semibold hover:bg-accent2/20 transition-all disabled:opacity-50">
                    {sending
                      ? <><span className="w-3 h-3 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin"/>Sending...</>
                      : <><span>📧</span> Send Task Notification</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 pt-4 border-t border-border shrink-0">
          <button onClick={() => onDelete(task.id)} className="text-danger text-sm hover:underline">Delete Task</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
            <button onClick={() => onSave({
              title: form.title,
              description: form.description,
              priority: form.priority as TaskPriority,
              assignee_name: form.assignee_name,
              assignee_email: form.assignee_email || undefined,
              start_date: form.start_date || undefined,
              end_date: form.end_date || undefined,
              due_date: form.due_date || undefined,
              duration: duration ?? undefined,
              tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            })} className="btn-primary text-sm px-4 py-2">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Project Edit Modal
function ProjectModal({ project, onSave, onClose }: {
  project: Project
  onSave: (updates: Partial<Project>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: project.name,
    start_date: project.start_date ?? '',
    end_date: project.end_date ?? '',
    color: project.color ?? '#00d4ff',
  })

  const duration = form.start_date && form.end_date ? daysBetween(form.start_date, form.end_date) : null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-syne font-black text-lg">Edit Project</h3>
          <button onClick={onClose} className="text-muted hover:text-text">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Project Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </div>
          <div className="bg-surface2 rounded-xl p-4 space-y-3">
            <p className="text-xs font-syne font-bold text-accent uppercase tracking-wide">📅 Project Timeline</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Start Date</label>
                <input type="date" className="input text-sm" value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}/>
              </div>
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">End Date</label>
                <input type="date" className="input text-sm" value={form.end_date}
                  min={form.start_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}/>
              </div>
            </div>
            {duration && (
              <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg">
                <span className="text-accent">⏱</span>
                <span className="text-sm font-semibold text-accent">Total Duration: {duration} days</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-2">Project Colour</label>
            <div className="flex gap-2">
              {['#00d4ff','#7c3aed','#10b981','#f59e0b','#ef4444','#ec4899'].map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-125' : 'border-transparent'}`}
                  style={{ background: c }}/>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary text-sm px-4 py-2">Save Project</button>
        </div>
      </div>
    </div>
  )
}

export default function KanbanBoard({
  initialColumns, projects, initialProjectId,
}: {
  initialColumns: KanbanColumn[]
  projects: Project[]
  initialProjectId: string | null
  allTasks?: Task[]
}) {
  const supabase = createClient()
  const [columns, setColumns] = useState(initialColumns)
  const [projectId, setProjectId] = useState(initialProjectId)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'board' | 'timeline'>('board')
  const [showAddTask, setShowAddTask] = useState<TaskStatus | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddProject, setShowAddProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectStart, setNewProjectStart] = useState('')
  const [newProjectEnd, setNewProjectEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [localProjects, setLocalProjects] = useState(projects)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingProject, setEditingProject] = useState(false)
  const [showPCR, setShowPCR] = useState(false)
  const [showPCRWarning, setShowPCRWarning] = useState(false)
  const [showDownloadPlan, setShowDownloadPlan] = useState(false)

  const currentProject = localProjects.find(p => p.id === projectId) ?? null
  const allTasks = columns.flatMap(c => c.tasks)

  async function switchProject(newProjectId: string) {
    if (newProjectId === projectId) return
    setProjectId(newProjectId)
    setLoading(true)
    const { data } = await supabase.from('tasks').select('*').eq('project_id', newProjectId).order('position', { ascending: true })
    setColumns(buildColumns((data ?? []) as Task[]))
    setLoading(false)
  }

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return
    const srcId = source.droppableId as TaskStatus
    const dstId = destination.droppableId as TaskStatus
    setColumns(prev => {
      const next = prev.map(c => ({ ...c, tasks: [...c.tasks] }))
      const srcCol = next.find(c => c.id === srcId)!
      const dstCol = next.find(c => c.id === dstId)!
      const [moved] = srcCol.tasks.splice(source.index, 1)
      moved.status = dstId
      dstCol.tasks.splice(destination.index, 0, moved)
      return next
    })
    await supabase.from('tasks').update({ status: dstId, position: destination.index }).eq('id', draggableId)
  }, [supabase])

  async function addTask(colId: TaskStatus) {
    if (!newTaskTitle.trim() || !projectId) return
    setSaving(true)
    const { data } = await supabase.from('tasks').insert({
      project_id: projectId, title: newTaskTitle.trim(), status: colId,
      priority: 'medium', tags: [], position: columns.find(c => c.id === colId)?.tasks.length ?? 0,
    }).select().single()
    if (data) setColumns(prev => prev.map(c => c.id === colId ? { ...c, tasks: [...c.tasks, data as Task] } : c))
    setNewTaskTitle('')
    setShowAddTask(null)
    setSaving(false)
  }

  async function saveTask(updates: Partial<Task>) {
    if (!editingTask) return
    await supabase.from('tasks').update(updates).eq('id', editingTask.id)
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.map(t => t.id === editingTask.id ? { ...t, ...updates } : t)
    })))
    setEditingTask(null)
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setColumns(prev => prev.map(col => ({ ...col, tasks: col.tasks.filter(t => t.id !== id) })))
    setEditingTask(null)
  }

  async function saveProject(updates: Partial<Project>) {
    if (!projectId) return
    await supabase.from('projects').update(updates).eq('id', projectId)
    setLocalProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p))
    setEditingProject(false)
  }

  async function addProject() {
    if (!newProjectName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('projects').insert({
      name: newProjectName.trim(),
      owner_id: user!.id,
      color: '#00d4ff',
      status: 'active',
      progress: 0,
      start_date: newProjectStart || undefined,
      end_date: newProjectEnd || undefined,
    }).select().single()
    if (data) {
      setLocalProjects(p => [data as Project, ...p])
      setProjectId(data.id)
      setColumns(buildColumns([]))
      setNewProjectName('')
      setNewProjectStart('')
      setNewProjectEnd('')
      setShowAddProject(false)
    }
    setSaving(false)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {localProjects.length > 0 ? (
            <select className="select w-auto" value={projectId ?? ''} onChange={e => switchProject(e.target.value)}>
              {localProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <span className="text-muted text-sm">No projects yet</span>
          )}
          {currentProject && (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditingProject(true)}
                className="text-xs text-muted hover:text-accent font-mono-code px-2 py-1 border border-border rounded-lg transition-colors">
                {currentProject.start_date && currentProject.end_date
                  ? `📅 ${new Date(currentProject.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} → ${new Date(currentProject.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : '📅 Set project dates'}
              </button>
              {currentProject.start_date && currentProject.end_date && (
                <span className="text-xs font-mono-code text-accent bg-accent/10 px-2 py-1 rounded-lg">
                  {daysBetween(currentProject.start_date, currentProject.end_date)} days
                </span>
              )}
            </div>
          )}
          <button onClick={() => setShowAddProject(true)} className="btn-ghost text-sm px-3 py-2">+ Project</button>
          {currentProject && (
            <div className="flex items-center gap-1 p-1 bg-surface2 rounded-xl">
              {/* Board / Timeline toggle */}
              <button onClick={() => setView('board')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'board' ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
                📋 Board
              </button>
              <button
                onClick={() => {
                  if (!currentProject.start_date || !currentProject.end_date) { setShowPCRWarning(true); return }
                  setView('timeline')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'timeline' ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
                📅 Timeline
              </button>
              {/* Divider */}
              <div className="w-px h-4 bg-border mx-0.5"/>
              {/* PCR */}
              <button
                onClick={() => {
                  if (!currentProject.start_date || !currentProject.end_date) { setShowPCRWarning(true); return }
                  setShowPCR(true)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${currentProject.start_date && currentProject.end_date
                    ? 'text-warn hover:bg-warn/10 hover:text-warn'
                    : 'text-muted hover:text-warn'}`}>
                🔀 PCR
              </button>
              {/* Download Plan */}
              <button
                onClick={() => {
                  if (!currentProject.start_date || !currentProject.end_date) { setShowPCRWarning(true); return }
                  setShowDownloadPlan(true)
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-accent2 hover:bg-accent2/10"
                title="View & Download Project Plan">
                📥 Plan
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddTask('backlog')} className="btn-primary text-sm px-4 py-2" disabled={!projectId}>
            + Add Task
          </button>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-8">
            <h3 className="font-syne font-black text-xl mb-5">New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Project Name</label>
                <input className="input" placeholder="e.g. Network Migration Q2"
                  value={newProjectName} onChange={e => setNewProjectName(e.target.value)} autoFocus/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Start Date</label>
                  <input type="date" className="input text-sm" value={newProjectStart}
                    onChange={e => setNewProjectStart(e.target.value)}/>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">End Date</label>
                  <input type="date" className="input text-sm" value={newProjectEnd}
                    min={newProjectStart} onChange={e => setNewProjectEnd(e.target.value)}/>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setShowAddProject(false)} className="btn-ghost">Cancel</button>
              <button onClick={addProject} className="btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Edit Modal */}
      {editingProject && currentProject && (
        <ProjectModal project={currentProject} onSave={saveProject} onClose={() => setEditingProject(false)}/>
      )}

      {/* Download Plan Modal */}
      {showDownloadPlan && currentProject && (() => {
        if (!currentProject) return null
        const proj = currentProject
        const planTasks = [...allTasks].sort((a, b) =>
          new Date(a.start_date || '9999').getTime() - new Date(b.start_date || '9999').getTime()
        )
        const doneTasks = planTasks.filter(t => t.status === 'done').length
        const progress = planTasks.length > 0 ? Math.round((doneTasks / planTasks.length) * 100) : 0

        function fmtDate(d?: string) {
          if (!d) return '—'
          return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        }

        function downloadCSV() {
          const rows = [
            ['Project Plan:', proj.name],
            ['Start Date:', fmtDate(proj.start_date)],
            ['End Date:', fmtDate(proj.end_date)],
            ['Duration:', proj.start_date && proj.end_date ? `${daysBetween(proj.start_date, proj.end_date)} days` : '—'],
            ['Overall Progress:', `${progress}%`],
            ['Generated:', new Date().toLocaleDateString('en-GB')],
            [],
            ['Task', 'Status', 'Priority', 'Assignee', 'Start Date', 'End Date', 'Due Date', 'Duration', 'Tags'],
            ...planTasks.map(t => [
              t.title,
              t.status.replace('_', ' ').toUpperCase(),
              t.priority.toUpperCase(),
              t.assignee_name || '—',
              fmtDate(t.start_date),
              fmtDate(t.end_date),
              fmtDate(t.due_date),
              t.start_date && t.end_date ? `${daysBetween(t.start_date, t.end_date) + 1} days` : '—',
              (t.tags || []).join('; '),
            ])
          ]
          const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${proj.name.replace(/\s+/g, '-')}-Project-Plan.csv`
          a.click()
          URL.revokeObjectURL(url)
        }

        function downloadTXT() {
          const lines = [
            `PROJECT PLAN`,
            `${'='.repeat(60)}`,
            `Project  : ${proj.name}`,
            `Start    : ${fmtDate(proj.start_date)}`,
            `End      : ${fmtDate(proj.end_date)}`,
            `Duration : ${proj.start_date && proj.end_date ? daysBetween(proj.start_date, proj.end_date) + ' days' : '—'}`,
            `Progress : ${progress}% (${doneTasks}/${planTasks.length} tasks done)`,
            `Generated: ${new Date().toLocaleDateString('en-GB')}`,
            `${'='.repeat(60)}`,
            '',
            `TASK SCHEDULE`,
            `${'-'.repeat(60)}`,
            ...planTasks.map((t, i) => [
              `${String(i+1).padStart(2,'0')}. ${t.title}`,
              `    Status   : ${t.status.replace('_',' ').toUpperCase()}`,
              `    Priority : ${t.priority.toUpperCase()}`,
              `    Assignee : ${t.assignee_name || '—'}`,
              `    Start    : ${fmtDate(t.start_date)}`,
              `    End      : ${fmtDate(t.end_date)}`,
              `    Due      : ${fmtDate(t.due_date)}`,
              `    Duration : ${t.start_date && t.end_date ? daysBetween(t.start_date, t.end_date) + 1 + ' days' : '—'}`,
              t.description ? `    Notes    : ${t.description}` : '',
              '',
            ].filter(Boolean).join('\n')),
            `${'='.repeat(60)}`,
            `NexPlan — nexplan.io`,
          ]
          const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${proj.name.replace(/\s+/g, '-')}-Project-Plan.txt`
          a.click()
          URL.revokeObjectURL(url)
        }

        const statusColors: Record<string, string> = {
          done:        'text-accent3 bg-accent3/10',
          in_progress: 'text-accent bg-accent/10',
          review:      'text-warn bg-warn/10',
          blocked:     'text-danger bg-danger/10',
          backlog:     'text-muted bg-surface2',
        }

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDownloadPlan(false)}>
            <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
                <div>
                  <p className="font-mono-code text-xs text-accent2 uppercase tracking-widest mb-1">Project Plan</p>
                  <h2 className="font-syne font-black text-2xl">{proj.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={downloadTXT}
                    className="flex items-center gap-2 px-4 py-2 bg-accent2/10 border border-accent2/30 text-accent2 rounded-xl text-xs font-semibold hover:bg-accent2/20 transition-colors">
                    📄 Download TXT
                  </button>
                  <button onClick={downloadCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-accent3/10 border border-accent3/30 text-accent3 rounded-xl text-xs font-semibold hover:bg-accent3/20 transition-colors">
                    📊 Download CSV
                  </button>
                  <button onClick={() => setShowDownloadPlan(false)} className="text-muted hover:text-text text-xl ml-2">✕</button>
                </div>
              </div>

              {/* Project summary */}
              <div className="grid grid-cols-4 gap-3 p-6 pb-4 shrink-0">
                {[
                  { label: 'Start Date', value: fmtDate(proj.start_date) },
                  { label: 'End Date',   value: fmtDate(proj.end_date) },
                  { label: 'Duration',   value: proj.start_date && proj.end_date ? `${daysBetween(proj.start_date, proj.end_date)} days` : '—' },
                  { label: 'Progress',   value: `${progress}% (${doneTasks}/${planTasks.length})` },
                ].map(s => (
                  <div key={s.label} className="bg-surface2 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted font-mono-code mb-1">{s.label}</p>
                    <p className="font-syne font-bold text-sm">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="px-6 pb-4 shrink-0">
                <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00d4ff, #22d3a5)' }}/>
                </div>
              </div>

              {/* Task table */}
              <div className="overflow-y-auto flex-1 min-h-0">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface2 border-b border-border">
                    <tr>
                      {['#', 'Task', 'Status', 'Priority', 'Assignee', 'Start', 'End', 'Due', 'Duration'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-syne font-bold text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {planTasks.map((t, i) => (
                      <tr key={t.id} className="border-b border-border/40 hover:bg-surface2/30 transition-colors">
                        <td className="px-3 py-3 text-xs text-muted font-mono-code">{String(i+1).padStart(2,'0')}</td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-sm">{t.title}</p>
                          {t.assignee_name && <p className="text-xs text-muted">👤 {t.assignee_name}</p>}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-1 rounded-lg font-semibold whitespace-nowrap ${statusColors[t.status] || 'text-muted bg-surface2'}`}>
                            {t.status.replace('_',' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-1 rounded-lg font-mono-code ${
                            t.priority === 'critical' ? 'bg-danger/10 text-danger' :
                            t.priority === 'high'     ? 'bg-warn/10 text-warn' :
                            t.priority === 'medium'   ? 'bg-accent/10 text-accent' : 'bg-surface2 text-muted'
                          }`}>{t.priority}</span>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted whitespace-nowrap">{t.assignee_name || '—'}</td>
                        <td className="px-3 py-3 text-xs font-mono-code whitespace-nowrap text-accent">{fmtDate(t.start_date)}</td>
                        <td className="px-3 py-3 text-xs font-mono-code whitespace-nowrap text-accent">{fmtDate(t.end_date)}</td>
                        <td className="px-3 py-3 text-xs font-mono-code whitespace-nowrap text-warn">{fmtDate(t.due_date)}</td>
                        <td className="px-3 py-3 text-xs font-mono-code text-muted whitespace-nowrap">
                          {t.start_date && t.end_date ? `${daysBetween(t.start_date, t.end_date) + 1}d` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {planTasks.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-muted text-sm">No tasks added yet. Add tasks to your project to see the plan.</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-border shrink-0 flex items-center justify-between">
                <p className="text-xs text-muted font-mono-code">Generated by NexPlan · nexplan.io</p>
                <p className="text-xs text-muted">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* PCR Warning Modal — no project dates */}
      {showPCRWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPCRWarning(false)}>
          <div className="card w-full max-w-sm p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-4">📅</div>
            <h3 className="font-syne font-black text-xl mb-2">Project Dates Required</h3>
            <p className="text-muted text-sm leading-relaxed mb-6">
              To create a Project Change Request, your project must have a
              <strong className="text-text"> Start Date</strong> and
              <strong className="text-text"> End Date</strong> set first.
            </p>
            <div className="bg-surface2 rounded-xl p-3 mb-6 text-left">
              <p className="text-xs font-mono-code text-muted mb-2">How to set project dates:</p>
              <p className="text-xs text-muted">1. Click the <span className="text-accent font-semibold">📅 date pill</span> next to your project name</p>
              <p className="text-xs text-muted">2. Set Start Date and End Date</p>
              <p className="text-xs text-muted">3. Click Save Project</p>
              <p className="text-xs text-muted">4. Then click 📋 PCR</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPCRWarning(false)} className="btn-ghost flex-1 py-2">Close</button>
              <button onClick={() => { setShowPCRWarning(false); setEditingProject(true) }}
                className="btn-primary flex-1 py-2">Set Dates Now →</button>
            </div>
          </div>
        </div>
      )}

      {/* PCR Manager Modal */}
      {showPCR && currentProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPCR(false)}>
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-syne font-black text-xl">Change Requests</h2>
              <button onClick={() => setShowPCR(false)} className="text-muted hover:text-text text-xl">✕</button>
            </div>
            <PCRManager
              project={currentProject}
              onProjectUpdated={(updates) => {
                setLocalProjects(prev => prev.map(p => p.id === currentProject.id ? { ...p, ...updates } : p))
                setShowPCR(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskModal task={editingTask} project={currentProject} onSave={saveTask} onClose={() => setEditingTask(null)} onDelete={deleteTask}/>
      )}

      {!projectId ? (
        <div className="text-center py-24">
          <h3 className="font-syne font-bold text-xl mb-2">No project selected</h3>
          <p className="text-muted mb-6">Create a project to start managing your board.</p>
          <button onClick={() => setShowAddProject(true)} className="btn-primary">+ Create First Project</button>
        </div>
      ) : loading ? (
        <div className="text-center py-24"><p className="text-muted animate-pulse">Loading tasks...</p></div>
      ) : view === 'timeline' ? (
        <TimelineView tasks={allTasks} project={currentProject} onEditTask={setEditingTask} onEditProject={() => setEditingProject(true)}/>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {columns.map(col => (
              <div key={col.id} className={`flex-shrink-0 w-[272px] bg-surface border rounded-2xl p-4 ${COL_BORDERS[col.id]}`}>
                <div className="flex items-center gap-2 font-syne font-bold text-sm mb-4">
                  <span className={col.color}>{col.emoji} {col.title}</span>
                  <span className="w-5 h-5 rounded-md bg-surface2 flex items-center justify-center text-xs text-muted font-normal ml-auto">
                    {col.tasks.length}
                  </span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`min-h-[40px] rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-accent/5' : ''}`}>
                      {col.tasks.map((task, idx) => (
                        <Draggable key={task.id} draggableId={task.id} index={idx}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`bg-card border rounded-xl p-4 mb-2.5 cursor-grab transition-all duration-150 ${
                                snapshot.isDragging
                                  ? 'border-accent shadow-[0_8px_32px_rgba(0,0,0,0.6)] rotate-1 scale-105'
                                  : 'border-border hover:border-accent/40 hover:-translate-y-0.5'
                              }`}>
                              <p className="text-sm font-semibold mb-2.5 leading-snug">{task.title}</p>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                <span className={`tag-chip ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                                {task.tags?.map((tag: string) => (
                                  <span key={tag} className="tag-chip bg-accent2/10 text-purple-300">{tag}</span>
                                ))}
                              </div>
                              {/* Show dates if set */}
                              {task.start_date && task.end_date && (
                                <div className="mb-2 px-2 py-1.5 bg-accent/5 border border-accent/10 rounded-lg">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[10px] font-mono-code text-accent">
                                      {new Date(task.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                      {' → '}
                                      {new Date(task.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                                      ⏱ {task.duration ?? daysBetween(task.start_date, task.end_date) + 1}d
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                {task.assignee_name && (
                                  <div className="w-6 h-6 rounded-full bg-accent2 flex items-center justify-center text-[10px] font-bold text-white">
                                    {task.assignee_name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                {task.due_date && (
                                  <span className="font-mono-code text-[11px] text-muted ml-auto">
                                    Due: {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                                <button onClick={() => setEditingTask(task)}
                                  className="ml-auto text-[10px] text-muted hover:text-accent font-mono-code transition-colors">
                                  edit
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                {showAddTask === col.id ? (
                  <div className="mt-2">
                    <textarea className="input text-sm resize-none h-20 mb-2" placeholder="Task title..."
                      value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTask(col.id) }
                        if (e.key === 'Escape') { setShowAddTask(null); setNewTaskTitle('') }
                      }}/>
                    <div className="flex gap-2">
                      <button onClick={() => addTask(col.id)} className="btn-primary text-xs px-3 py-1.5" disabled={saving}>Add</button>
                      <button onClick={() => { setShowAddTask(null); setNewTaskTitle('') }} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddTask(col.id)}
                    className="w-full mt-2 py-2 border border-dashed border-border rounded-xl text-muted text-sm hover:border-accent/50 hover:text-accent transition-colors">
                    + Add card
                  </button>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}
