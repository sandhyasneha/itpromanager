'use client'
import { useState, useRef } from 'react'
import type { KanbanColumn, Task, TaskStatus } from '@/types'

const PRIORITY_COLORS: Record<string, string> = {
  low:      'bg-muted/10 text-muted',
  medium:   'bg-accent/10 text-accent',
  high:     'bg-warn/10 text-warn',
  critical: 'bg-danger/10 text-danger',
}

const COL_META: Record<string, { emoji: string; color: string; title: string }> = {
  backlog:     { emoji: '🗂',  color: 'text-muted',   title: 'Backlog'     },
  in_progress: { emoji: '⚡',  color: 'text-accent',  title: 'In Progress' },
  review:      { emoji: '👁',  color: 'text-warn',    title: 'Review'      },
  blocked:     { emoji: '🚫',  color: 'text-danger',  title: 'Blocked'     },
  done:        { emoji: '✅',  color: 'text-accent3', title: 'Done'        },
}

const STATUSES: TaskStatus[] = ['backlog', 'in_progress', 'review', 'blocked', 'done']

export function MobileKanban({
  columns,
  onEditTask,
  onMoveTask,
  newTaskTitle,
  setNewTaskTitle,
  showAddTask,
  setShowAddTask,
  addTask,
  saving,
}: {
  columns: KanbanColumn[]
  onEditTask: (task: Task) => void
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void
  newTaskTitle: string
  setNewTaskTitle: (v: string) => void
  showAddTask: TaskStatus | null
  setShowAddTask: (v: TaskStatus | null) => void
  addTask: (colId: TaskStatus) => void
  saving: boolean
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [sheetTask, setSheetTask] = useState<Task | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0 && activeIdx < columns.length - 1) setActiveIdx(i => i + 1)
    if (dx > 0 && activeIdx > 0) setActiveIdx(i => i - 1)
    touchStartX.current = null
    touchStartY.current = null
  }

  const col = columns[activeIdx]
  const meta = COL_META[col.id] ?? { emoji: '📋', color: 'text-muted', title: col.id }

  return (
    <div className="flex flex-col">
      {/* Column tab pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar px-1 mb-3">
        {columns.map((c, i) => {
          const m = COL_META[c.id]
          return (
            <button key={c.id} onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${activeIdx === i ? 'bg-accent/10 border-accent text-accent' : 'bg-surface2 border-border text-muted'}`}>
              {m.emoji} {m.title}
              <span className="bg-surface rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{c.tasks.length}</span>
            </button>
          )
        })}
      </div>

      {/* Swipe area */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className={`font-syne font-bold text-base ${meta.color}`}>
            {meta.emoji} {meta.title}
            <span className="ml-2 text-xs text-muted font-normal">({col.tasks.length})</span>
          </h2>
          <div className="flex items-center gap-1 text-[10px] text-muted">
            {activeIdx > 0 && <span>prev</span>}
            <span>swipe</span>
            {activeIdx < columns.length - 1 && <span>next</span>}
          </div>
        </div>

        <div className="space-y-2.5 pb-4">
          {col.tasks.length === 0 && (
            <div className="text-center py-12 text-muted">
              <p className="text-3xl mb-2">{meta.emoji}</p>
              <p className="text-sm">No tasks in {meta.title}</p>
            </div>
          )}
          {col.tasks.map(task => (
            <div key={task.id} onClick={() => setSheetTask(task)}
              className="bg-card border border-border rounded-xl p-4 active:scale-95 transition-transform cursor-pointer">
              <p className="text-sm font-semibold mb-2 leading-snug">{task.title}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className={`tag-chip ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                {task.tags?.map((tag: string) => (
                  <span key={tag} className="tag-chip bg-accent2/10 text-purple-300">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                {task.assignee_name && (
                  <div className="w-6 h-6 rounded-full bg-accent2 flex items-center justify-center text-[10px] font-bold text-white">
                    {task.assignee_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                {task.due_date && (
                  <span className="font-mono text-[11px] text-muted ml-auto">
                    Due: {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {showAddTask === col.id ? (
          <div className="mt-2">
            <textarea className="input text-sm resize-none h-20 mb-2 w-full" placeholder="Task title..."
              value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTask(col.id) }
                if (e.key === 'Escape') { setShowAddTask(null); setNewTaskTitle('') }
              }}/>
            <div className="flex gap-2">
              <button onClick={() => addTask(col.id)} className="btn-primary text-xs px-3 py-2 flex-1" disabled={saving}>Add Task</button>
              <button onClick={() => { setShowAddTask(null); setNewTaskTitle('') }} className="btn-ghost text-xs px-3 py-2">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddTask(col.id)}
            className="w-full mt-2 py-3 border border-dashed border-border rounded-xl text-muted text-sm hover:border-accent/50 hover:text-accent transition-colors">
            + Add card
          </button>
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 py-3">
        {columns.map((_, i) => (
          <button key={i} onClick={() => setActiveIdx(i)}
            className={`rounded-full transition-all ${activeIdx === i ? 'w-5 h-2 bg-accent' : 'w-2 h-2 bg-border'}`} />
        ))}
      </div>

      {/* Bottom sheet */}
      {sheetTask && (
        <MobileBottomSheet
          task={sheetTask}
          onClose={() => setSheetTask(null)}
          onMoveTask={(taskId, newStatus) => { onMoveTask(taskId, newStatus); setSheetTask(null) }}
          onOpenFullEdit={(task) => { setSheetTask(null); onEditTask(task) }}
          onDelete={() => setSheetTask(null)}
        />
      )}
    </div>
  )
}

export function MobileBottomSheet({
  task, onClose, onMoveTask, onOpenFullEdit, onDelete,
}: {
  task: Task
  onClose: () => void
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void
  onOpenFullEdit: (task: Task) => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl border-t border-border shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex-1 pr-3">
            <p className="font-syne font-black text-base truncate">{task.title}</p>
            <p className="text-xs text-muted mt-0.5">
              {COL_META[task.status]?.emoji} {COL_META[task.status]?.title}
              {task.assignee_name ? ` · ${task.assignee_name}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-muted text-xl shrink-0">X</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {task.description && (
            <div className="bg-surface2 rounded-xl p-3">
              <p className="text-xs text-muted leading-relaxed">{task.description}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`tag-chip ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
            {task.due_date && (
              <span className="tag-chip bg-surface2 text-muted">
                Due: {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-syne font-semibold text-muted mb-2">Move to column</p>
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.filter(s => s !== task.status).map(s => {
                const meta = COL_META[s]
                return (
                  <button key={s} onClick={() => { onMoveTask(task.id, s); onClose() }}
                    className="py-2.5 rounded-xl text-xs font-bold border-2 border-border bg-surface2 text-muted active:scale-95 transition-all flex flex-col items-center gap-1">
                    <span className="text-base">{meta.emoji}</span>
                    <span>{meta.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-3 shrink-0">
          <button onClick={() => { onDelete(task.id); onClose() }}
            className="px-4 py-3 rounded-xl text-sm font-bold text-danger bg-danger/10 border border-danger/30">
            Delete
          </button>
          <button onClick={() => { onClose(); onOpenFullEdit(task) }}
            className="flex-1 py-3 rounded-xl text-sm font-bold btn-primary">
            Full Edit
          </button>
        </div>
      </div>
    </>
  )
}
