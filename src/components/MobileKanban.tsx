'use client'
import { useState, useRef, useCallback } from 'react'
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

// ─── Move To Sheet (shown on long press) ─────────────────────────────────────

function MoveToSheet({
  task,
  onClose,
  onMove,
}: {
  task: Task
  onClose: () => void
  onMove: (taskId: string, newStatus: TaskStatus) => void
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl border-t border-border shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="px-5 py-3 border-b border-border">
          <p className="font-syne font-black text-base truncate">{task.title}</p>
          <p className="text-xs text-muted mt-0.5">Move to column</p>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-3">
          {STATUSES.filter(s => s !== task.status).map(s => {
            const meta = COL_META[s]
            return (
              <button
                key={s}
                onClick={() => { onMove(task.id, s); onClose() }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-border bg-surface2 text-left active:scale-95 transition-all"
              >
                <span className="text-2xl">{meta.emoji}</span>
                <div>
                  <p className={`text-sm font-bold ${meta.color}`}>{meta.title}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-5 pb-6">
          <button onClick={onClose} className="w-full py-3 rounded-xl btn-ghost text-sm font-semibold">
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Task Card with tap + long press ─────────────────────────────────────────

function MobileTaskCard({
  task,
  onTap,
  onLongPress,
}: {
  task: Task
  onTap: () => void
  onLongPress: () => void
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)
  const [pressing, setPressing] = useState(false)

  function startPress() {
    didLongPress.current = false
    setPressing(true)
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setPressing(false)
      onLongPress()
    }, 500)
  }

  function endPress() {
    setPressing(false)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (!didLongPress.current) {
      onTap()
    }
    didLongPress.current = false
  }

  function cancelPress() {
    setPressing(false)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    didLongPress.current = false
  }

  return (
    <div
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={cancelPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      className={`bg-card border border-border rounded-xl p-4 transition-all duration-150 cursor-pointer select-none
        ${pressing ? 'scale-95 border-accent/60 bg-accent/5' : 'active:scale-95'}`}
    >
      <p className="text-sm font-semibold mb-2 leading-snug">{task.title}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className={`tag-chip ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
        {task.tags?.map((tag: string) => (
          <span key={tag} className="tag-chip bg-accent2/10 text-purple-300">{tag}</span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        {task.assignee_name && (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-accent2 flex items-center justify-center text-[10px] font-bold text-white">
              {task.assignee_name.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[11px] text-muted">{task.assignee_name.split(' ')[0]}</span>
          </div>
        )}
        {task.due_date && (
          <span className="font-mono text-[11px] text-muted ml-auto">
            Due: {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
      {/* Long press hint */}
      <p className="text-[10px] text-muted/50 mt-2">Tap to edit · Hold to move</p>
    </div>
  )
}

// ─── Main MobileKanban ────────────────────────────────────────────────────────

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
  const [moveTask, setMoveTask] = useState<Task | null>(null)
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
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
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
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all
                ${activeIdx === i ? 'bg-accent/10 border-accent text-accent' : 'bg-surface2 border-border text-muted'}`}>
              {m.emoji} {m.title}
              <span className="bg-surface rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{c.tasks.length}</span>
            </button>
          )
        })}
      </div>

      {/* Swipe area */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {/* Column header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className={`font-syne font-bold text-base ${meta.color}`}>
            {meta.emoji} {meta.title}
            <span className="ml-2 text-xs text-muted font-normal">({col.tasks.length})</span>
          </h2>
          <div className="text-[10px] text-muted">swipe to change column</div>
        </div>

        {/* Tasks */}
        <div className="space-y-2.5 pb-4">
          {col.tasks.length === 0 && (
            <div className="text-center py-12 text-muted">
              <p className="text-3xl mb-2">{meta.emoji}</p>
              <p className="text-sm">No tasks in {meta.title}</p>
            </div>
          )}
          {col.tasks.map(task => (
            <MobileTaskCard
              key={task.id}
              task={task}
              onTap={() => onEditTask(task)}
              onLongPress={() => setMoveTask(task)}
            />
          ))}
        </div>

        {/* Add task */}
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

      {/* Move To sheet — shown on long press */}
      {moveTask && (
        <MoveToSheet
          task={moveTask}
          onClose={() => setMoveTask(null)}
          onMove={(taskId, newStatus) => { onMoveTask(taskId, newStatus); setMoveTask(null) }}
        />
      )}
    </div>
  )
}
