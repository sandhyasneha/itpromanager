import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/KanbanBoard'
import type { KanbanColumn, TaskStatus, Project, Task } from '@/types'

const COLUMNS: { id: TaskStatus; title: string; emoji: string; color: string }[] = [
  { id: 'backlog',     title: 'Backlog',      emoji: '🗂',  color: 'text-muted' },
  { id: 'in_progress', title: 'In Progress',  emoji: '⚡',  color: 'text-accent' },
  { id: 'review',      title: 'Review',       emoji: '👁',  color: 'text-warn' },
  { id: 'blocked',     title: 'Blocked',      emoji: '🚫',  color: 'text-danger' },
  { id: 'done',        title: 'Done',         emoji: '✅',  color: 'text-accent3' },
]

export default async function KanbanPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  const projectList = (projects ?? []) as Project[]
  const firstProject = projectList[0] ?? null

  let tasks: Task[] = []
  if (firstProject) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', firstProject.id)
      .order('position', { ascending: true })
    tasks = (data ?? []) as Task[]
  }

  const columns: KanbanColumn[] = COLUMNS.map(col => ({
    ...col,
    tasks: tasks.filter(t => t.status === col.id),
  }))

  return <KanbanBoard initialColumns={columns} projects={projectList} initialProjectId={firstProject?.id ?? null} />
}
