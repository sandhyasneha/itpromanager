// src/app/api/invite/join-link/route.ts
// Generates a shareable join link for a project (like Google Docs share link)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const APP_URL = process.env.APP_URL || 'https://nexplan.io'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, role } = await request.json()

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate a join link token stored on the project itself
    const joinToken = Buffer.from(`${projectId}:${role}:${Date.now()}`).toString('base64url')
    const joinLink  = `${APP_URL}/join/${joinToken}`

    // Store join link token on project
    await serviceClient
      .from('projects')
      .update({ join_link_token: joinToken, join_link_role: role })
      .eq('id', projectId)

    return NextResponse.json({ success: true, joinLink, joinToken })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
