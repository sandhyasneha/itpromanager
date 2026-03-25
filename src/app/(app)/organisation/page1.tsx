// src/app/(app)/organisation/page.tsx
// Organisation management page — create org, manage workspaces & members

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrganisationClient from '@/components/OrganisationClient'

export default async function OrganisationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if user owns an org
  const { data: myOrg } = await supabase
    .from('organisations')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  // Check if user is a member of an org
  const { data: membership } = await supabase
    .from('organisation_members')
    .select('*, organisations(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  // Load workspaces if org exists
  let workspaces: any[] = []
  let orgMembers: any[] = []
  const org = myOrg || membership?.organisations

  if (org) {
    const [{ data: ws }, { data: members }] = await Promise.all([
      supabase.from('workspaces').select('*').eq('org_id', org.id).order('created_at', { ascending: false }),
      supabase.from('organisation_members').select('*, profiles(full_name, email)').eq('org_id', org.id).neq('status', 'removed'),
    ])
    workspaces  = ws      ?? []
    orgMembers  = members ?? []
  }

  const profile = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <OrganisationClient
      org={org || null}
      isOwner={!!myOrg}
      workspaces={workspaces}
      orgMembers={orgMembers}
      userId={user.id}
      userEmail={user.email || ''}
      userRole={membership?.role || (myOrg ? 'org_admin' : null)}
    />
  )
}
