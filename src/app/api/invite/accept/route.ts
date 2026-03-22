// src/app/api/invite/accept/route.ts
// Accepts an invite — links user_id to the project_members record

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json()
    if (!token || !userId)
      return NextResponse.json({ error: 'Missing token or userId' }, { status: 400 })

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get invite
    const { data: member } = await serviceClient
      .from('project_members')
      .select('id, status, email, project_id')
      .eq('invite_token', token)
      .single()

    if (!member) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
    if (member.status === 'active') return NextResponse.json({ error: 'Already accepted' }, { status: 400 })

    // Get user email to verify match (optional security check)
    const { data: profile } = await serviceClient
      .from('profiles').select('email').eq('id', userId).single()

    // Activate membership
    const { error } = await serviceClient
      .from('project_members')
      .update({
        user_id:   userId,
        status:    'active',
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id)

    if (error) throw error

    return NextResponse.json({ success: true, projectId: member.project_id })

  } catch (err: any) {
    console.error('[invite-accept]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
