// src/app/(app)/client-portal/page.tsx
// Read-only client view — shows workspace health, Gantt, risks, export

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ClientPortalClient from '@/components/ClientPortalClient'

export default async function ClientPortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find which workspace this user's email is a contact for
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('email, full_name, plan')
    .eq('id', user.id)
    .single()

  const userEmail = profile?.email || user.email || ''

  // Find workspace where client_email matches
  const { data: workspace } = await serviceClient
    .from('workspaces')
    .select('*, organisations(name)')
    .eq('client_email', userEmail)
    .eq('status', 'active')
    .single()

  // Also check if they're an org member with viewer role
  const { data: orgMembership } = await serviceClient
    .from('organisation_members')
    .select('org_id, role, organisations(name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  // If no workspace found as client contact, redirect to dashboard
  if (!workspace && (!orgMembership || orgMembership.role !== 'viewer')) {
    redirect('/dashboard')
  }

  // Get projects in this workspace
  const workspaceId = workspace?.id
  const { data: projects } = workspaceId
    ? await serviceClient.from('projects').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false })
    : { data: [] }

  // Get tasks for these projects
  const projectIds = (projects || []).map((p: any) => p.id)
  const { data: tasks } = projectIds.length > 0
    ? await serviceClient.from('tasks').select('*').in('project_id', projectIds)
    : { data: [] }

  // Get risks
  const { data: risks } = projectIds.length > 0
    ? await serviceClient.from('risks').select('*').in('project_id', projectIds).eq('status', 'open').order('created_at', { ascending: false })
    : { data: [] }

  const orgName = (workspace?.organisations as any)?.name || (orgMembership?.organisations as any)?.name || 'Your Organisation'

  return (
    <ClientPortalClient
      workspace={workspace}
      projects={projects || []}
      tasks={tasks || []}
      risks={risks || []}
      orgName={orgName}
      clientName={profile?.full_name || userEmail.split('@')[0]}
      userId={user.id}
    />
  )
}
