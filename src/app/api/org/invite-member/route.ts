// src/app/api/org/invite-member/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend  = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = process.env.APP_URL || 'https://nexplan.io'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orgId, email, role } = await request.json()
    if (!orgId || !email || !role)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get org details
    const { data: org } = await serviceClient
      .from('organisations').select('name, owner_id').eq('id', orgId).single()
    if (!org) return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })

    // Check inviter is org owner
    if (org.owner_id !== user.id)
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    // Get inviter profile
    const { data: inviter } = await serviceClient
      .from('profiles').select('full_name, email').eq('id', user.id).single()

    // Check if already a member
    const { data: existing } = await serviceClient
      .from('organisation_members')
      .select('id, status')
      .eq('org_id', orgId)
      .eq('email', email.toLowerCase())
      .single()

    if (existing?.status === 'active')
      return NextResponse.json({ error: 'Already a member' }, { status: 400 })

    // Insert or update member
    const { data: member } = existing
      ? await serviceClient.from('organisation_members')
          .update({ role, status: 'invited' }).eq('id', existing.id)
          .select('invite_token').single()
      : await serviceClient.from('organisation_members')
          .insert({ org_id: orgId, email: email.toLowerCase(), role, status: 'invited', invited_by: user.id })
          .select('invite_token').single()

    if (!member) return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
const inviteUrl = `${APP_URL}/org-invite/${member.invite_token}`
    const roleLabel   = role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    const inviterName = inviter?.full_name || inviter?.email || 'Your organisation admin'

    // Send invite email
    await resend.emails.send({
      from:    'NexPlan <no-reply@nexplan.io>',
      to:      email,
      subject: `You've been invited to join ${org.name} on NexPlan`,
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">✦ NexPlan</span>
    </div>
    <div style="background:#1e293b;border-radius:16px;padding:32px;border:1px solid #334155;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:12px;">🏢</div>
        <h1 style="color:#f1f5f9;font-size:22px;font-weight:800;margin:0 0 8px;">Organisation Invitation</h1>
        <p style="color:#94a3b8;font-size:14px;margin:0;">
          <strong style="color:#00d4ff;">${inviterName}</strong> has invited you to join <strong style="color:#f1f5f9;">${org.name}</strong>
        </p>
      </div>
      <div style="background:#0f172a;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #334155;">
        <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Organisation</p>
        <p style="color:#f1f5f9;font-size:18px;font-weight:800;margin:0 0 12px;">${org.name}</p>
        <div style="display:inline-block;background:linear-gradient(135deg,#00d4ff20,#7c3aed20);border:1px solid #7c3aed40;border-radius:8px;padding:6px 14px;">
          <span style="color:#a78bfa;font-size:12px;font-weight:700;">Your Role: ${roleLabel}</span>
        </div>
      </div>
      <div style="text-align:center;margin:28px 0 16px;">
        <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#000;font-weight:800;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Accept Invitation →
        </a>
      </div>
    </div>
    <p style="color:#334155;font-size:11px;text-align:center;margin-top:24px;">© 2026 NexPlan · nexplan.io</p>
  </div>
</body>
</html>`,
    })

    return NextResponse.json({ success: true, inviteUrl })
  } catch (err: any) {
    console.error('[org-invite]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
