// src/app/api/invite-member/route.ts
// Handles sending project invitations via email and generating join links

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = process.env.APP_URL || 'https://nexplan.io'

export async function POST(request: Request) {
  try {
    const supabase      = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, email, role } = await request.json()
    if (!projectId || !email || !role)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get project details
    const { data: project } = await serviceClient
      .from('projects').select('name, owner_id').eq('id', projectId).single()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Check inviter is admin or pm of this project
    const { data: inviterMember } = await serviceClient
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!inviterMember || !['admin', 'pm'].includes(inviterMember.role))
      return NextResponse.json({ error: 'Not authorized to invite' }, { status: 403 })

    // Get inviter profile
    const { data: inviterProfile } = await serviceClient
      .from('profiles').select('full_name, email').eq('id', user.id).single()

    // Check if already a member
    const { data: existing } = await serviceClient
      .from('project_members')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('email', email.toLowerCase())
      .single()

    if (existing?.status === 'active')
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })

    // Generate invite token
    const { data: member, error: insertError } = existing
      ? await serviceClient
          .from('project_members')
          .update({ role, status: 'invited', updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select('invite_token').single()
      : await serviceClient
          .from('project_members')
          .insert({
            project_id: projectId,
            email: email.toLowerCase(),
            role,
            status: 'invited',
            invited_by: user.id,
          })
          .select('invite_token').single()

    if (insertError) throw insertError

    const inviteUrl = `${APP_URL}/invite/${member.invite_token}`
    const roleLabel = role === 'admin' ? 'Administrator' : role === 'pm' ? 'Project Manager' : role === 'engineer' ? 'Engineer' : 'Viewer'
    const inviterName = inviterProfile?.full_name || inviterProfile?.email || 'A team member'

    // Send invite email
    await resend.emails.send({
      from:    'NexPlan <no-reply@nexplan.io>',
      to:      email,
      subject: `You've been invited to join "${project.name}" on NexPlan`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
        ✦ NexPlan
      </span>
    </div>

    <!-- Card -->
    <div style="background:#1e293b;border-radius:16px;padding:32px;border:1px solid #334155;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:12px;">🤝</div>
        <h1 style="color:#f1f5f9;font-size:22px;font-weight:800;margin:0 0 8px;">
          You're invited to collaborate!
        </h1>
        <p style="color:#94a3b8;font-size:14px;margin:0;">
          <strong style="color:#00d4ff;">${inviterName}</strong> has invited you to join a project on NexPlan
        </p>
      </div>

      <!-- Project Card -->
      <div style="background:#0f172a;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #334155;">
        <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Project</p>
        <p style="color:#f1f5f9;font-size:18px;font-weight:800;margin:0 0 12px;">${project.name}</p>
        <div style="display:inline-block;background:linear-gradient(135deg,#00d4ff20,#7c3aed20);border:1px solid #7c3aed40;border-radius:8px;padding:6px 14px;">
          <span style="color:#a78bfa;font-size:12px;font-weight:700;">Your Role: ${roleLabel}</span>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0 16px;">
        <a href="${inviteUrl}"
          style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#000;font-weight:800;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Accept Invitation →
        </a>
      </div>

      <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
        Or copy this link: <span style="color:#00d4ff;">${inviteUrl}</span>
      </p>

      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #334155;">
        <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
          This invite link expires in 7 days. If you did not expect this invitation, you can ignore this email.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <p style="color:#334155;font-size:11px;text-align:center;margin-top:24px;">
      © 2026 NexPlan · IT Project Management Platform · nexplan.io
    </p>
  </div>
</body>
</html>`,
    })

    return NextResponse.json({
      success: true,
      inviteUrl,
      token: member.invite_token,
      message: `Invitation sent to ${email}`
    })

  } catch (err: any) {
    console.error('[invite-member]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
