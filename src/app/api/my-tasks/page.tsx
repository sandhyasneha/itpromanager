'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  start_date?: string
  end_date?: string
  tags?: string[]
  assignee_name?: string
  projects: {
    id: string
    name: string
    color: string
    start_date?: string
    end_date?: string
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; next: string }> = {
  backlog:     { label: 'Not Started', color: 'text-muted',   bg: 'bg-surface2',    border: 'border-border',      next: 'in_progress' },
  in_progress: { label: 'In Progress', color: 'text-accent',  bg: 'bg-accent/10',   border: 'border-accent/30',   next: 'review' },
  review:      { label: 'In Review',   color: 'text-warn',    bg: 'bg-warn/10',     border: 'border-warn/30',     next: 'done' },
  blocked:     { label: 'Blocked',     color: 'text-danger',  bg: 'bg-danger/10',   border: 'border-danger/30',   next: 'in_progress' },
  done:        { label: 'Done',        color: 'text-accent3', bg: 'bg-accent3/10',  border: 'border-accent3/30',  next: 'done' },
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-muted', medium: 'text-accent', high: 'text-warn', critical: 'text-danger',
}

function isOverdue(task: Task) {
  if (!task.due_date || task.status === 'done') return false
  return new Date(task.due_date) < new Date(new Date().toDateString())
}

function isDueToday(task: Task) {
  if (!task.due_date || task.status === 'done') return false
  return task.due_date === new Date().toISOString().split('T')[0]
}

function isDueSoon(task: Task) {
  if (!task.due_date || task.status === 'done') return false
  const diff = (new Date(task.due_date).getTime() - new Date().getTime()) / 86400000
  return diff > 0 && diff <= 3
}

export default function MyTasksBoard({ tasks: initialTasks, userEmail, userName }: {
  tasks: Task[]
  userEmail: string
  userName: string
}) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'done'>('active')

  const overdue  = tasks.filter(t => isOverdue(t))
  const dueToday = tasks.filter(t => isDueToday(t))
  const active   = tasks.filter(t => !['done'].includes(t.status) && !isOverdue(t))
  const done     = tasks.filter(t => t.status === 'done')

  const filtered = filter === 'all'     ? tasks
                 : filter === 'active'  ? tasks.filter(t => t.status !== 'done')
                 : filter === 'overdue' ? tasks.filter(t => isOverdue(t))
                 : done

  async function updateStatus(taskId: string, newStatus: string) {
    setUpdating(taskId)
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    if (!error) {
      setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
      if (selectedTask?.id === taskId) setSelectedTask(t => t ? { ...t, status: newStatus } : null)
    }
    setUpdating(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-2">// My Tasks</p>
        <h1 className="font-syne font-black text-3xl mb-1">Welcome back, {userName.split(' ')[0]}!</h1>
        <p className="text-muted text-sm">{userEmail} · Your assigned tasks across all projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: '🚨 Overdue',    value: overdue.length,  color: 'text-danger',  bg: 'bg-danger/10 border-danger/20' },
          { label: '📅 Due Today',  value: dueToday.length, color: 'text-warn',    bg: 'bg-warn/10 border-warn/20' },
          { label: '⚡ Active',     value: active.length,   color: 'text-accent',  bg: 'bg-accent/10 border-accent/20' },
          { label: '✅ Done',       value: done.length,     color: 'text-accent3', bg: 'bg-accent3/10 border-accent3/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border text-center ${s.bg}`}>
            <p className="text-xs text-muted font-mono-code mb-1">{s.label}</p>
            <p className={`font-syne font-black text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-5 w-fit">
        {([['active','⚡ Active'],['all','📋 All'],['overdue','🚨 Overdue'],['done','✅ Done']] as const).map(([f, label]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${filter === f ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
            {label}
            <span className="ml-1.5 font-mono-code opacity-50">
              ({f === 'active' ? tasks.filter(t => t.status !== 'done').length
                : f === 'overdue' ? overdue.length
                : f === 'done' ? done.length
                : tasks.length})
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">{filter === 'done' ? '🎉' : '✅'}</p>
          <p className="font-syne font-bold text-lg mb-2">
            {filter === 'done' ? 'No completed tasks yet' :
             filter === 'overdue' ? 'No overdue tasks — great work!' :
             'No active tasks'}
          </p>
          <p className="text-muted text-sm">Your PM will assign tasks to {userEmail}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => {
            const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.backlog
            const overdueTsk = isOverdue(task)
            const todayTsk = isDueToday(task)
            const soonTsk = isDueSoon(task)

            return (
              <div key={task.id}
                className={`card hover:border-accent/30 transition-all cursor-pointer
                  ${overdueTsk ? 'border-danger/30 bg-danger/5' : ''}`}
                onClick={() => setSelectedTask(task)}>
                <div className="flex items-start gap-4 p-5">
                  {/* Status toggle button */}
                  <button
                    onClick={e => { e.stopPropagation(); if (task.status !== 'done') updateStatus(task.id, STATUS_CONFIG[task.status]?.next || 'in_progress') }}
                    disabled={updating === task.id || task.status === 'done'}
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                      ${task.status === 'done' ? 'bg-accent3 border-accent3 text-white' : 'border-border hover:border-accent bg-transparent'}
                      ${updating === task.id ? 'animate-pulse' : ''}`}
                    title={task.status === 'done' ? 'Done' : `Mark as ${STATUS_CONFIG[task.status]?.next?.replace('_',' ')}`}>
                    {task.status === 'done' && <span className="text-xs">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <p className={`font-semibold text-sm ${task.status === 'done' ? 'line-through text-muted' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {overdueTsk && <span className="text-[10px] bg-danger/10 text-danger border border-danger/30 px-2 py-0.5 rounded-full font-semibold">🚨 Overdue</span>}
                        {todayTsk && <span className="text-[10px] bg-warn/10 text-warn border border-warn/30 px-2 py-0.5 rounded-full font-semibold">📅 Due Today</span>}
                        {soonTsk && !todayTsk && <span className="text-[10px] bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-semibold">⏰ Due Soon</span>}
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted mt-1.5 line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2.5 flex-wrap text-xs text-muted">
                      {task.projects && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: task.projects.color || '#00d4ff' }}/>
                          {task.projects.name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={overdueTsk ? 'text-danger font-semibold' : todayTsk ? 'text-warn font-semibold' : ''}>
                          📅 {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span className={`font-semibold capitalize ${PRIORITY_COLORS[task.priority] || 'text-muted'}`}>
                        {task.priority}
                      </span>
                      {(task.tags || []).map(tag => (
                        <span key={tag} className="bg-surface2 px-1.5 py-0.5 rounded font-mono-code text-[10px]">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Quick status selector */}
                  <select
                    value={task.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updateStatus(task.id, e.target.value)}
                    disabled={updating === task.id}
                    className="select text-xs py-1.5 w-32 shrink-0 disabled:opacity-40">
                    <option value="backlog">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done ✅</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTask(null)}>
          <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
              <div>
                <p className="text-xs font-mono-code text-muted mb-1">{selectedTask.projects?.name}</p>
                <h3 className="font-syne font-black text-lg">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-muted hover:text-text text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {selectedTask.description && (
                <div>
                  <p className="text-xs font-syne font-semibold text-muted mb-1.5">Description</p>
                  <p className="text-sm text-text/80 bg-surface2 rounded-xl p-3">{selectedTask.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {selectedTask.due_date && (
                  <div className="bg-surface2 rounded-xl p-3">
                    <p className="text-muted mb-0.5">Due Date</p>
                    <p className={`font-semibold ${isOverdue(selectedTask) ? 'text-danger' : isDueToday(selectedTask) ? 'text-warn' : 'text-text'}`}>
                      {new Date(selectedTask.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
                <div className="bg-surface2 rounded-xl p-3">
                  <p className="text-muted mb-0.5">Priority</p>
                  <p className={`font-semibold capitalize ${PRIORITY_COLORS[selectedTask.priority]}`}>{selectedTask.priority}</p>
                </div>
              </div>

              {/* Status update */}
              <div>
                <p className="text-xs font-syne font-semibold text-muted mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button key={key}
                      onClick={() => updateStatus(selectedTask.id, key)}
                      disabled={updating === selectedTask.id}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-left
                        ${selectedTask.status === key ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-surface2 border-border text-muted hover:text-text'}
                        disabled:opacity-40`}>
                      {key === 'backlog' ? '🗂 Not Started' :
                       key === 'in_progress' ? '⚡ In Progress' :
                       key === 'review' ? '👁 In Review' :
                       key === 'blocked' ? '🚫 Blocked' : '✅ Done'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
