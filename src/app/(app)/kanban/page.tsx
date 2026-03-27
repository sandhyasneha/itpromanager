// src/app/(app)/kanban/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import KanbanBoard from '@/components/KanbanBoard'
import type { KanbanColumn, TaskStatus, Project, Task } from '@/types'

const COLUMNS: { id: TaskStatus; title: string; emoji: string; color: string }[] = [
  { id: 'backlog',      title: 'Backlog',     emoji: '🗂',  color: 'text-muted' },
  { id: 'in_progress',  title: 'In Progress', emoji: '⚡',  color: 'text-accent' },
  { id: 'review',       title: 'Review',      emoji: '👁',  color: 'text-warn' },
  { id: 'blocked',      title: 'Blocked',     emoji: '🚫',  color: 'text-danger' },
  { id: 'done',         title: 'Done',        emoji: '✅',  color: 'text-accent3' },
]

export default async function KanbanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Fetch projects (owned + shared) ─────────────────────────
  const { data: ownedProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: memberRows } = await supabase
    .from('project_members')
    .select('project_id, role')
    .eq('user_id', user!.id)
    .eq('status', 'active')

  let sharedProjects: Project[] = []
  if (memberRows && memberRows.length > 0) {
    const ownedIds  = new Set((ownedProjects ?? []).map(p => p.id))
    const sharedIds = memberRows.map(m => m.project_id).filter(id => !ownedIds.has(id))
    if (sharedIds.length > 0) {
      const { data: shared } = await supabase
        .from('projects')
        .select('*')
        .in('id', sharedIds)
        .order('created_at', { ascending: false })
      sharedProjects = (shared ?? []) as Project[]
    }
  }

  const membershipMap: Record<string, string> = {}
  ;(memberRows ?? []).forEach(m => { membershipMap[m.project_id] = m.role })

  const projectList = [
    ...(ownedProjects ?? []).map(p => ({ ...p, userRole: 'owner' })),
    ...sharedProjects.map(p => ({ ...p, userRole: membershipMap[p.id] || 'viewer' })),
  ] as (Project & { userRole: string })[]

  // ── Fetch all tasks ──────────────────────────────────────────
  let allTasks: Task[] = []
  if (projectList.length > 0) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .in('project_id', projectList.map(p => p.id))
      .order('position', { ascending: true })
    allTasks = (data ?? []) as Task[]
  }

  // ── Fetch org membership + workspaces (service client) ───────
  let orgId: string | null = null
  let orgWorkspaces: { id: string; name: string; client_name?: string; color?: string }[] = []

  try {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user belongs to an org (owned or member)
    const [{ data: ownedOrg }, { data: membership }] = await Promise.all([
      serviceClient.from('organisations').select('id').eq('owner_id', user!.id).single(),
      serviceClient.from('organisation_members')
        .select('org_id').eq('user_id', user!.id).eq('status', 'active').single(),
    ])

    orgId = ownedOrg?.id || membership?.org_id || null

    if (orgId) {
      const { data: workspaces } = await serviceClient
        .from('workspaces')
        .select('id, name, client_name, color')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .order('name')
      orgWorkspaces = workspaces || []
    }
  } catch (e) {
    // User not in an org — that's fine
  }

  const firstProject = projectList[0] ?? null
  const columns: KanbanColumn[] = COLUMNS.map(col => ({
    ...col,
    tasks: allTasks.filter(t => t.project_id === firstProject?.id && t.status === col.id),
  }))

  return (
    <KanbanBoard
      initialColumns={columns}
      projects={projectList}
      initialProjectId={firstProject?.id ?? null}
      allTasks={allTasks}
      currentUserId={user!.id}
      orgId={orgId}
      orgWorkspaces={orgWorkspaces}
    />
  )
}
