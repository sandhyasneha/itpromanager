// src/app/api/org/validate-invite/route.ts
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 })

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: member } = await serviceClient
      .from('organisation_members')
      .select('id, role, status, email, organisations(name)')
      .eq('invite_token', token)
      .single()

    if (!member) return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })

    return NextResponse.json({
      status:  member.status,
      role:    member.role,
      email:   member.email,
      orgName: (member.organisations as any)?.name,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
