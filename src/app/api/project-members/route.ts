// src/app/api/project-members/route.ts
// Returns all active members of a project
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'No projectId' }, { status: 400 })

    // Verify requester is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Use service client to bypass RLS
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify requester is a member of this project
    const { data: membership } = await serviceClient
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

    // Fetch all members with profile info
    const { data: members, error } = await serviceClient
      .from('project_members')
      .select('*, profiles!project_members_user_id_fkey(full_name, avatar_url)')
      .eq('project_id', projectId)
      .neq('status', 'removed')
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ members, userRole: membership.role })

  } catch (err: any) {
    console.error('[project-members]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
