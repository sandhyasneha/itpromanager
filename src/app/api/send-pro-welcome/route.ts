// src/app/api/send-pro-welcome/route.ts
// Sends a personal Pro welcome email via Resend when user upgrades

import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email, fullName, billing } = await request.json()
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const firstName = fullName?.split(' ')[0] || email.split('@')[0]
    const price     = billing === 'yearly' ? '$49/year' : '$5/month'

    await resend.emails.send({
      from:    'Ram from NexPlan <info@nexplan.io>',
      to:      email,
      subject: `Welcome to NexPlan Pro, ${firstName}`,
      text: `Hi ${firstName},

Thank you so much for upgrading to NexPlan Pro.

This genuinely means a lot to me — you're one of our first Pro members and I wanted to personally reach out.

Your Pro plan (${price}) is now active. Here's what you've unlocked:

- AI Project Plan Generator — describe a project, get a full task plan in seconds
- AI Status Reports — one click generates and emails a professional report to all stakeholders
- PCR Document Generator — PRINCE2 change requests written by AI
- AI Follow-Up Emails — automatically chases overdue tasks
- Task comments & activity log
- Priority support — email me directly at info@nexplan.io

If you run into anything or have a feature request, just reply to this email. I read every message personally.

Thank you again for supporting NexPlan.

Ram
Founder, NexPlan
nexplan.io`,

      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 15px; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 32px 16px; background: #ffffff;">

<p style="font-size: 13px; color: #6b7280; margin-bottom: 24px;">NexPlan Pro · ${price}</p>

<p>Hi ${firstName},</p>

<p>Thank you so much for upgrading to NexPlan Pro.</p>

<p>This genuinely means a lot to me — you're one of our first Pro members and I wanted to personally reach out.</p>

<p>Your Pro plan is now active. Here's what you've unlocked:</p>

<ul style="padding-left: 20px; line-height: 2;">
  <li><strong>AI Project Plan Generator</strong> — describe a project, get a full task plan in seconds</li>
  <li><strong>AI Status Reports</strong> — one click generates and emails a professional report to all stakeholders</li>
  <li><strong>PCR Document Generator</strong> — PRINCE2 change requests written by AI</li>
  <li><strong>AI Follow-Up Emails</strong> — automatically chases overdue tasks</li>
  <li><strong>Task comments &amp; activity log</strong></li>
  <li><strong>Priority support</strong> — email me directly at info@nexplan.io</li>
</ul>

<p>If you run into anything or have a feature request, just reply to this email. I read every message personally.</p>

<p>Thank you again for supporting NexPlan.</p>

<p style="margin-top: 32px;">Ram<br>
<span style="color: #6b7280; font-size: 13px;">Founder, NexPlan · <a href="https://nexplan.io" style="color: #00b4d8;">nexplan.io</a></span>
</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
<p style="font-size: 11px; color: #9ca3af;">You're receiving this because you upgraded to NexPlan Pro. Questions? Reply to this email.</p>

</body>
</html>`,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Pro welcome email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
