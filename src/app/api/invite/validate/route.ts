// src/app/api/invite/validate/route.ts
// Validates an invite token and returns project/inviter details

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'No token provided' }, { status: 400 })

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: member, error } = await serviceClient
      .from('project_members')
      .select(`
        id, role, status, email,
        project:projects(id, name),
        inviter:profiles!project_members_invited_by_fkey(full_name, email)
      `)
      .eq('invite_token', token)
      .single()

    if (error || !member)
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 })

    return NextResponse.json({
      status:       member.status,
      role:         member.role,
      email:        member.email,
      projectName:  (member.project as any)?.name,
      projectId:    (member.project as any)?.id,
      inviterName:  (member.inviter as any)?.full_name || (member.inviter as any)?.email,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
