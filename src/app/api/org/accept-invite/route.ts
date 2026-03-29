// src/app/api/org/accept-invite/route.ts
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json()
    if (!token || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: member } = await serviceClient
      .from('organisation_members')
      .select('id, status, org_id, role')
      .eq('invite_token', token)
      .single()

    if (!member) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
    if (member.status === 'active') return NextResponse.json({ error: 'Already accepted' }, { status: 400 })

    // Activate membership
    const { error } = await serviceClient
      .from('organisation_members')
      .update({ user_id: userId, status: 'active', joined_at: new Date().toISOString() })
      .eq('id', member.id)

    if (error) throw error

    // Update profile with org + upgrade to enterprise plan
    await serviceClient
      .from('profiles')
      .update({ 
        org_id: member.org_id, 
        org_role: member.role,
        plan: 'enterprise'  // Org members get enterprise access
      })
      .eq('id', userId)

    return NextResponse.json({ success: true, orgId: member.org_id })
  } catch (err: any) {
    console.error('[org-accept-invite]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
