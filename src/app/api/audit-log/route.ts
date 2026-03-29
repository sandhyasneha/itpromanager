// src/app/api/audit-log/route.ts
// Central audit logging API — called from client and server actions

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const {
      action, category, entityId, entityName,
      oldValue, newValue, metadata, orgId
    } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user profile
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name, email, org_id')
      .eq('id', user.id)
      .single()

    const resolvedOrgId = orgId || profile?.org_id || null

    await serviceClient.from('activity_logs').insert({
      org_id:      resolvedOrgId,
      user_id:     user.id,
      user_email:  profile?.email || user.email,
      user_name:   profile?.full_name || user.email?.split('@')[0],
      action,
      category,
      entity_id:   entityId   || null,
      entity_name: entityName || null,
      old_value:   oldValue   || null,
      new_value:   newValue   || null,
      metadata:    metadata   || null,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[audit-log]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
