'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  backlog:     'bg-surface2 text-muted',
  in_progress: 'bg-accent/10 text-accent',
  review:      'bg-warn/10 text-warn',
  blocked:     'bg-danger/10 text-danger',
  done:        'bg-accent3/10 text-accent3',
}

const PRIORITY_COLORS: Record<string, string> = {
  low:      'bg-muted/10 text-muted',
  medium:   'bg-accent/10 text-accent',
  high:     'bg-warn/10 text-warn',
  critical: 'bg-danger/10 text-danger',
}

export default function ProjectPlanClient({ projects, tasks }: { projects: any[], tasks: any[] }) {
  const supabase = createClient()
  const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id ?? '')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localTasks, setLocalTasks] = useState(tasks)
  const [localProjects, setLocalProjects] = useState(projects)
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', status: 'backlog', due_date: '', assignee_name: '' })
  const [newProject, setNewProject] = useState({ name: '', description: '', start_date: '', end_date: '', color: '#00d4ff' })

  const projectTasks = localTasks.filter(t => t.project_id === selectedProject)
  const currentProject = localProjects.find(p => p.id === selectedProject)
  const doneTasks = projectTasks.filter(t => t.status === 'done')
  const progress = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0

  async function addProject() {
    if (!newProject.name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('projects').insert({
      name: newProject.name, description: newProject.description,
      start_date: newProject.start_date || null, end_date: newProject.end_date || null,
      color: newProject.color, owner_id: user!.id, status: 'active', progress: 0,
    }).select().single()
    if (data) { setLocalProjects(p => [data, ...p]); setSelectedProject(data.id) }
    setNewProject({ name: '', description: '', start_date: '', end_date: '', color: '#00d4ff' })
    setShowAddProject(false); setSaving(false)
  }

  async function addTask() {
    if (!newTask.title.trim() || !selectedProject) return
    setSaving(true)
    const { data } = await supabase.from('tasks').insert({
      project_id: selectedProject, title: newTask.title, priority: newTask.priority,
      status: newTask.status, due_date: newTask.due_date || null,
      assignee_name: newTask.assignee_name || null, tags: [], position: projectTasks.length,
    }).select().single()
    if (data) setLocalTasks(t => [...t, data])
    setNewTask({ title: '', priority: 'medium', status: 'backlog', due_date: '', assignee_name: '' })
    setShowAddTask(false); setSaving(false)
  }

  async function updateTaskStatus(taskId: string, status: string) {
    setLocalTasks(t => t.map(task => task.id === taskId ? { ...task, status } : task))
    await supabase.from('tasks').update({ status }).eq('id', taskId)
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {localProjects.length > 0 ? (
            <select className="select w-auto" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              {localProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <span className="text-muted text-sm">No projects yet</span>
          )}
          <button onClick={() => setShowAddProject(true)} className="btn-ghost text-sm px-3 py-2">+ New Project</button>
        </div>
        <button onClick={() => setShowAddTask(true)} className="btn-primary text-sm px-4 py-2" disabled={!selectedProject}>+ Add Task</button>
      </div>

      {/* Project header */}
      {currentProject && (
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-syne font-black text-2xl mb-1">{currentProject.name}</h2>
              {currentProject.description && <p className="text-muted text-sm">{currentProject.description}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs font-mono-code text-muted">
                {currentProject.start_date && <span>Start: {new Date(currentProject.start_date).toLocaleDateString()}</span>}
                {currentProject.end_date && <span>Due: {new Date(currentProject.end_date).toLocaleDateString()}</span>}
                <span>{projectTasks.length} tasks</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-syne font-black text-3xl text-accent">{progress}%</p>
                <p className="text-xs text-muted">Complete</p>
              </div>
              <div className="w-32 h-2 bg-border rounded-full">
                <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }}/>
              </div>
            </div>
          </div>

          {/* Mini Gantt legend */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-border flex-wrap">
            {Object.entries(STATUS_COLORS).map(([s, c]) => (
              <span key={s} className={`text-xs px-2 py-1 rounded-lg font-mono-code ${c}`}>
                {s.replace('_', ' ')} ({projectTasks.filter(t => t.status === s).length})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tasks Table */}
      {localProjects.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📅</p>
          <h3 className="font-syne font-bold text-xl mb-2">No projects yet</h3>
          <p className="text-muted mb-6">Create your first project to start planning</p>
          <button onClick={() => setShowAddProject(true)} className="btn-primary">+ Create Project</button>
        </div>
      ) : projectTasks.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📋</p>
          <h3 className="font-syne font-bold text-xl mb-2">No tasks yet</h3>
          <p className="text-muted mb-6">Add tasks to start building your project plan</p>
          <button onClick={() => setShowAddTask(true)} className="btn-primary">+ Add First Task</button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['#','Task','Assignee','Priority','Status','Due Date','Gantt'].map(h => (
                    <th key={h} className="text-left text-xs font-syne font-bold text-muted uppercase tracking-wide py-4 px-5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectTasks.map((task, idx) => (
                  <tr key={task.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors group">
                    <td className="py-4 px-5 font-mono-code text-xs text-muted">{idx + 1}</td>
                    <td className="py-4 px-5">
                      <p className="text-sm font-semibold">{task.title}</p>
                      {task.description && <p className="text-xs text-muted mt-0.5">{task.description}</p>}
                    </td>
                    <td className="py-4 px-5">
                      {task.assignee_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-accent2 flex items-center justify-center text-[10px] font-bold text-white">
                            {task.assignee_name.slice(0,2).toUpperCase()}
                          </div>
                          <span className="text-sm">{task.assignee_name}</span>
                        </div>
                      ) : <span className="text-muted text-xs">Unassigned</span>}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`text-xs px-2 py-1 rounded-lg font-mono-code ${PRIORITY_COLORS[task.priority] ?? ''}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <select
                        value={task.status}
                        onChange={e => updateTaskStatus(task.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-lg font-mono-code border-none outline-none cursor-pointer ${STATUS_COLORS[task.status] ?? ''}`}
                        style={{ background: 'transparent' }}>
                        <option value="backlog">backlog</option>
                        <option value="in_progress">in progress</option>
                        <option value="review">review</option>
                        <option value="blocked">blocked</option>
                        <option value="done">done</option>
                      </select>
                    </td>
                    <td className="py-4 px-5 font-mono-code text-xs text-muted whitespace-nowrap">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex gap-1">
                        {['backlog','in_progress','review','blocked','done'].map(s => (
                          <div key={s} className={`h-2.5 w-6 rounded-sm transition-all ${task.status === s || (
                            s === 'done' && task.status === 'done' ? true :
                            s === 'in_progress' && ['in_progress','review','blocked','done'].includes(task.status) ? true :
                            s === 'review' && ['review','done'].includes(task.status) ? true : false
                          ) ? 'opacity-100' : 'opacity-20'} ${
                            s === 'done' ? 'bg-accent3' :
                            s === 'blocked' ? 'bg-danger' :
                            s === 'review' ? 'bg-warn' :
                            s === 'in_progress' ? 'bg-accent' : 'bg-muted'
                          }`}/>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-8">
            <h3 className="font-syne font-black text-xl mb-6">New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Project Name *</label>
                <input className="input" placeholder="e.g. Network Migration Q2" value={newProject.name} onChange={e => setNewProject(p => ({...p, name: e.target.value}))} autoFocus/>
              </div>
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Description</label>
                <input className="input" placeholder="Brief description..." value={newProject.description} onChange={e => setNewProject(p => ({...p, description: e.target.value}))}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Start Date</label>
                  <input type="date" className="input" value={newProject.start_date} onChange={e => setNewProject(p => ({...p, start_date: e.target.value}))}/>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">End Date</label>
                  <input type="date" className="input" value={newProject.end_date} onChange={e => setNewProject(p => ({...p, end_date: e.target.value}))}/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Color</label>
                <div className="flex gap-2">
                  {['#00d4ff','#7c3aed','#10b981','#f59e0b','#ef4444','#ec4899'].map(c => (
                    <button key={c} onClick={() => setNewProject(p => ({...p, color: c}))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${newProject.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ background: c }}/>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowAddProject(false)} className="btn-ghost">Cancel</button>
              <button onClick={addProject} className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-8">
            <h3 className="font-syne font-black text-xl mb-6">Add Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Task Title *</label>
                <input className="input" placeholder="e.g. Configure VLAN segmentation" value={newTask.title} onChange={e => setNewTask(t => ({...t, title: e.target.value}))} autoFocus/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Priority</label>
                  <select className="select" value={newTask.priority} onChange={e => setNewTask(t => ({...t, priority: e.target.value}))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Status</label>
                  <select className="select" value={newTask.status} onChange={e => setNewTask(t => ({...t, status: e.target.value}))}>
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Assignee Name</label>
                  <input className="input" placeholder="John Smith" value={newTask.assignee_name} onChange={e => setNewTask(t => ({...t, assignee_name: e.target.value}))}/>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Due Date</label>
                  <input type="date" className="input" value={newTask.due_date} onChange={e => setNewTask(t => ({...t, due_date: e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowAddTask(false)} className="btn-ghost">Cancel</button>
              <button onClick={addTask} className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
