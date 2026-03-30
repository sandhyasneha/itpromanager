// src/app/api/cron/task-reminders/route.ts
// Daily cron job — sends due date reminders + overdue alerts
// Schedule in vercel.json: "0 8 * * *" (8am UTC daily)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today    = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayStr    = today.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  let remindersSent = 0
  let overduesSent  = 0
  const errors: string[] = []

  // ── Due Tomorrow Reminders ────────────────────────────────────
  const { data: dueTomorrow } = await serviceClient
    .from('tasks')
    .select('*, projects(name)')
    .eq('due_date', tomorrowStr)
    .not('status', 'eq', 'done')
    .not('assignee_email', 'is', null)

  for (const task of dueTomorrow || []) {
    if (!task.assignee_email) continue
    try {
      const html = buildReminderEmail({
        type: 'reminder',
        assigneeEmail: task.assignee_email,
        assigneeName: task.assignee_name || '',
        taskTitle: task.title,
        projectName: (task.projects as any)?.name || '',
        dueDate: task.due_date,
        priority: task.priority,
      })

      await sendEmail({
        to: task.assignee_email,
        subject: `⏰ Due Tomorrow: ${task.title}`,
        html,
      })
      remindersSent++
    } catch (e: any) {
      errors.push(`Reminder for ${task.id}: ${e.message}`)
    }
  }

  // ── Overdue Alerts ────────────────────────────────────────────
  const { data: overdue } = await serviceClient
    .from('tasks')
    .select('*, projects(name)')
    .lt('due_date', todayStr)
    .not('status', 'eq', 'done')
    .not('assignee_email', 'is', null)

  for (const task of overdue || []) {
    if (!task.assignee_email) continue
    const daysOverdue = Math.floor(
      (today.getTime() - new Date(task.due_date).getTime()) / 86400000
    )
    // Only alert on day 1 and day 3 to avoid spam
    if (daysOverdue !== 1 && daysOverdue !== 3) continue

    try {
      const html = buildReminderEmail({
        type: 'overdue',
        assigneeEmail: task.assignee_email,
        assigneeName: task.assignee_name || '',
        taskTitle: task.title,
        projectName: (task.projects as any)?.name || '',
        dueDate: task.due_date,
        priority: task.priority,
        daysOverdue,
      })

      await sendEmail({
        to: task.assignee_email,
        subject: `🚨 Overdue (${daysOverdue}d): ${task.title}`,
        html,
      })
      overduesSent++
    } catch (e: any) {
      errors.push(`Overdue for ${task.id}: ${e.message}`)
    }
  }

  console.log(`[task-reminders] Sent: ${remindersSent} reminders, ${overduesSent} overdue alerts`)
  return NextResponse.json({ remindersSent, overduesSent, errors })
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'NexPlan <notifications@nexplan.io>', to: [to], subject, html })
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message || 'Failed to send')
  }
}

function buildReminderEmail({ type, assigneeName, taskTitle, projectName, dueDate, priority, daysOverdue }: {
  type: 'reminder' | 'overdue'; assigneeEmail: string; assigneeName: string
  taskTitle: string; projectName: string; dueDate: string
  priority: string; daysOverdue?: number
}) {
  const APP_URL      = process.env.APP_URL || 'https://nexplan.io'
  const dueFmt       = new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const isOverdue    = type === 'overdue'
  const accentColor  = isOverdue ? '#ef4444' : '#f59e0b'
  const emoji        = isOverdue ? '🚨' : '⏰'
  const heading      = isOverdue ? `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` : 'Due Tomorrow'
  const message      = isOverdue
    ? `This task was due on <strong style="color:#ef4444;">${dueFmt}</strong> and is still open.`
    : `This task is due <strong style="color:#f59e0b;">tomorrow (${dueFmt})</strong>.`

  const priorityColor = priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f97316' : priority === 'medium' ? '#f59e0b' : '#94a3b8'
  const priorityLabel = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Normal'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>NexPlan Task ${heading}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;min-height:100vh;">
<tr><td align="center" style="padding:32px 16px;">

  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid #334155;">

    <!-- Top accent bar -->
    <tr><td style="background:linear-gradient(90deg,${accentColor},${isOverdue ? '#7c3aed' : '#00d4ff'});height:4px;font-size:0;">&nbsp;</td></tr>

    <!-- Header -->
    <tr>
      <td style="padding:28px 36px 24px;border-bottom:1px solid #334155;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="font-size:24px;font-weight:900;color:#00d4ff;letter-spacing:-0.5px;">✦ NexPlan</span>
            </td>
            <td align="right">
              <span style="background:${accentColor}22;color:${accentColor};font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;border:1px solid ${accentColor}55;letter-spacing:0.5px;">
                ${emoji} ${heading.toUpperCase()}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:36px;">

        <!-- Greeting -->
        <p style="color:#f1f5f9;font-size:18px;font-weight:700;margin:0 0 6px;">Hi ${assigneeName || 'there'} 👋</p>
        <p style="color:#94a3b8;font-size:15px;margin:0 0 28px;line-height:1.6;">${message}</p>

        <!-- Task Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #334155;border-left:4px solid ${accentColor};border-radius:14px;margin-bottom:28px;">
          <tr>
            <td style="padding:22px 24px;">
              <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">📋 Assigned Task</p>
              <h2 style="color:#f1f5f9;font-size:20px;font-weight:800;margin:0 0 14px;line-height:1.3;">${taskTitle}</h2>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;border-top:1px solid #1e293b;">
                    <span style="color:#64748b;font-size:12px;">Project</span>
                  </td>
                  <td align="right" style="padding:6px 0;border-top:1px solid #1e293b;">
                    <span style="color:#f1f5f9;font-size:12px;font-weight:600;">${projectName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;border-top:1px solid #1e293b;">
                    <span style="color:#64748b;font-size:12px;">Due Date</span>
                  </td>
                  <td align="right" style="padding:6px 0;border-top:1px solid #1e293b;">
                    <span style="color:${accentColor};font-size:12px;font-weight:700;">📅 ${dueFmt}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;border-top:1px solid #1e293b;">
                    <span style="color:#64748b;font-size:12px;">Priority</span>
                  </td>
                  <td align="right" style="padding:6px 0;border-top:1px solid #1e293b;">
                    <span style="background:${priorityColor}22;color:${priorityColor};font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;border:1px solid ${priorityColor}44;">
                      ${priorityLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:4px 0 28px;">
              <a href="${APP_URL}/my-tasks"
                style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#000;font-weight:800;font-size:15px;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
                View &amp; Update Task →
              </a>
            </td>
          </tr>
        </table>

        <!-- Tip box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #334155;border-radius:12px;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6;">
                💡 <strong style="color:#94a3b8;">Tip:</strong> You can update the task status directly from your 
                <a href="${APP_URL}/my-tasks" style="color:#00d4ff;text-decoration:none;">My Tasks</a> page
                or from the <a href="${APP_URL}/kanban" style="color:#00d4ff;text-decoration:none;">Kanban Board</a>.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#0f172a;border-top:1px solid #334155;padding:20px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="color:#00d4ff;font-size:14px;font-weight:900;">✦ NexPlan</span>
              <p style="color:#475569;font-size:11px;margin:4px 0 0;">AI-Powered IT Project Management</p>
            </td>
            <td align="right">
              <a href="${APP_URL}" style="color:#475569;font-size:11px;text-decoration:none;">nexplan.io</a>
              <span style="color:#334155;margin:0 6px;">·</span>
              <a href="${APP_URL}/settings" style="color:#475569;font-size:11px;text-decoration:none;">Manage Notifications</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

  </table>

  <!-- Disclaimer -->
  <p style="color:#334155;font-size:11px;text-align:center;margin:16px 0 0;">
    You received this because you have a task assigned in NexPlan.<br/>
    This email was sent to ${assigneeName || 'you'} via NexPlan.
  </p>

</td></tr>
</table>
</body>
</html>`
}
