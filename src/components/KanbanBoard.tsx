'use client'
import { useState, useCallback } from 'react'
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

export default function KanbanBoard({
  initialColumns,
  projects,
  initialProjectId,
  allTasks,
}: {
  initialColumns: KanbanColumn[]
  projects: Project[]
  initialProjectId: string | null
  allTasks: Task[]
}) {
  const supabase = createClient()
  const [columns, setColumns] = useState(initialColumns)
  const [projectId, setProjectId] = useState(initialProjectId)
  const [showAddTask, setShowAddTask] = useState<TaskStatus | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddProject, setShowAddProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [saving, setSaving] = useState(false)

  // Switch project — filter allTasks client-side
  function switchProject(newProjectId: string) {
    setProjectId(newProjectId)
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: allTasks.filter(t => t.project_id === newProjectId && t.status === col.id)
    })))
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
      project_id: projectId,
      title: newTaskTitle.trim(),
      status: colId,
      priority: 'medium',
      tags: [],
      position: columns.find(c => c.id === colId)?.tasks.length ?? 0,
    }).select().single()

    if (data) {
      setColumns(prev => prev.map(c =>
        c.id === colId ? { ...c, tasks: [...c.tasks, data as Task] } : c
      ))
    }
    setNewTaskTitle('')
    setShowAddTask(null)
    setSaving(false)
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
    }).select().single()

    if (data) {
      projects.unshift(data as Project)
      switchProject(data.id)
      setNewProjectName('')
      setShowAddProject(false)
    }
    setSaving(false)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {projects.length > 0 ? (
            <select
              className="select w-auto"
              value={projectId ?? ''}
              onChange={e => switchProject(e.target.value)}>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-muted text-sm">No projects yet</span>
          )}
          <button onClick={() => setShowAddProject(true)} className="btn-ghost text-sm px-3 py-2">+ Project</button>
        </div>
        <button
          onClick={() => setShowAddTask('backlog')}
          className="btn-primary text-sm px-4 py-2"
          disabled={!projectId}>
          + Add Task
        </button>
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-8">
            <h3 className="font-syne font-black text-xl mb-2">New Project</h3>
            <p className="text-muted text-sm mb-5">Give your project a name to get started.</p>
            <input
              className="input mb-4"
              placeholder="e.g. Network Migration Q2"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addProject()}
              autoFocus/>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAddProject(false)} className="btn-ghost">Cancel</button>
              <button onClick={addProject} className="btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!projectId ? (
        <div className="text-center py-24">
          <h3 className="font-syne font-bold text-xl mb-2">No project selected</h3>
          <p className="text-muted mb-6">Create a project to start managing your Kanban board.</p>
          <button onClick={() => setShowAddProject(true)} className="btn-primary">+ Create First Project</button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {columns.map(col => (
              <div key={col.id} className={`flex-shrink-0 w-[272px] bg-surface border rounded-2xl p-4 ${COL_BORDERS[col.id]}`}>
                {/* Column header */}
                <div className="flex items-center gap-2 font-syne font-bold text-sm mb-4">
                  <span className={col.color}>{col.emoji} {col.title}</span>
                  <span className="w-5 h-5 rounded-md bg-surface2 flex items-center justify-center text-xs text-muted font-normal ml-auto">
                    {col.tasks.length}
                  </span>
                </div>

                {/* Cards */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[40px] rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-accent/5' : ''}`}>
                      {col.tasks.map((task, idx) => (
                        <Draggable key={task.id} draggableId={task.id} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-card border rounded-xl p-4 mb-2.5 cursor-grab transition-all duration-150 ${
                                snapshot.isDragging
                                  ? 'border-accent shadow-[0_8px_32px_rgba(0,0,0,0.6)] rotate-1 scale-105'
                                  : 'border-border hover:border-accent/40 hover:-translate-y-0.5'
                              }`}>
                              <p className="text-sm font-semibold mb-2.5 leading-snug">{task.title}</p>
                              <div className="flex flex-wrap gap-1.5 mb-3">
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
                                  <span className="font-mono-code text-[11px] text-muted ml-auto">
                                    {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add card */}
                {showAddTask === col.id ? (
                  <div className="mt-2">
                    <textarea
                      className="input text-sm resize-none h-20 mb-2"
                      placeholder="Task title..."
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      autoFocus
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
                  <button
                    onClick={() => setShowAddTask(col.id)}
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
