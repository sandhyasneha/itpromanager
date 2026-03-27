// src/app/(app)/organisation/dashboard/page.tsx
// Executive Portfolio Dashboard — cross-client view for Account Managers

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ExecutiveDashboardClient from '@/components/ExecutiveDashboardClient'

export default async function ExecutiveDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check user plan — only Enterprise users can access Executive Dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile || profile.plan !== 'enterprise') {
    redirect('/dashboard?msg=upgrade')
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user's org
  const { data: membership } = await serviceClient
    .from('organisation_members')
    .select('org_id, role, organisations(id, name, slug, industry)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const { data: ownedOrg } = await serviceClient
    .from('organisations')
    .select('id, name, slug, industry')
    .eq('owner_id', user.id)
    .single()

  const org = ownedOrg || (membership?.organisations as any)
  if (!org) redirect('/organisation')

  const orgId = org.id

  // Get all workspaces
  const { data: workspaces } = await serviceClient
    .from('workspaces')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  // Get workspace-assigned projects only (for Executive Dashboard)
  // Unassigned personal projects don't belong in the executive view
  const workspaceIds = (workspaces || []).map((w: any) => w.id)
  const { data: projects } = workspaceIds.length > 0
    ? await serviceClient
        .from('projects')
        .select('*')
        .in('workspace_id', workspaceIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Also get unassigned org projects count for the warning banner
  const { count: unassignedCount } = await serviceClient
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .is('workspace_id', null)

  // Get all tasks for these projects
  const projectIds = (projects || []).map((p: any) => p.id)
  const { data: tasks } = projectIds.length > 0
    ? await serviceClient.from('tasks').select('*').in('project_id', projectIds)
    : { data: [] }

  // Get all org members
  const { data: members } = await serviceClient
    .from('organisation_members')
    .select('*, profiles!organisation_members_user_id_fkey(full_name, email)')
    .eq('org_id', orgId)
    .eq('status', 'active')

  const safeCount: number = unassignedCount ?? 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ExecutiveDashboardClient
        org={org as any}
        workspaces={(workspaces || []) as any[]}
        projects={(projects || []) as any[]}
        tasks={(tasks || []) as any[]}
        members={(members || []) as any[]}
        userId={user.id as string}
        unassignedCount={safeCount}
      />
    </div>
  )
}
