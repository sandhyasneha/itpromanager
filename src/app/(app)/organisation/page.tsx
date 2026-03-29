// src/app/(app)/organisation/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import OrganisationClient from '@/components/OrganisationClient'

export default async function OrganisationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client to bypass RLS for org data
  // Check user plan — only Enterprise users can access Organisation
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

  // Check if user owns an org
  const { data: myOrg } = await serviceClient
    .from('organisations')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  // Check if user is a member of an org
  const { data: membership } = await serviceClient
    .from('organisation_members')
    .select('*, organisations(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const org = myOrg || (membership?.organisations as any) || null

  let workspaces: any[] = []
  let orgMembers: any[] = []

  if (org) {
    const [{ data: ws }, { data: members }] = await Promise.all([
      serviceClient
        .from('workspaces')
        .select('*')
        .eq('org_id', org.id)
        .order('created_at', { ascending: false }),
      serviceClient
        .from('organisation_members')
        .select('*, profiles!organisation_members_user_id_fkey(full_name, email)')
        .eq('org_id', org.id)
        .neq('status', 'removed')
        .order('created_at', { ascending: true }),
    ])
    workspaces = ws      ?? []
    orgMembers = members ?? []
  }

  return (
    <OrganisationClient
      org={org}
      isOwner={!!myOrg}
      workspaces={workspaces}
      orgMembers={orgMembers}
      userId={user.id}
      userEmail={user.email || ''}
      userRole={membership?.role || (myOrg ? 'org_admin' : null)}
    />
  )
}
