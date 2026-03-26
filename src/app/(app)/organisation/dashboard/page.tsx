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

  // Get all projects in this org
  const { data: projects } = await serviceClient
    .from('projects')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

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

  return (
    <ExecutiveDashboardClient
      org={org}
      workspaces={workspaces || []}
      projects={projects || []}
      tasks={tasks || []}
      members={members || []}
      userId={user.id}
    />
  )
}
