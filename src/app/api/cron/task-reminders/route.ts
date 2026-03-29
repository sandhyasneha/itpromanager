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

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0f172a;">
    <div style="background:${accentColor};padding:3px 0;"></div>
    <div style="background:#1e293b;padding:24px 32px;border-bottom:1px solid #334155;">
      <span style="font-size:22px;font-weight:900;color:#00d4ff;">✦ NexPlan</span>
      <span style="color:#94a3b8;font-size:13px;margin-left:12px;">${emoji} Task ${heading}</span>
    </div>
    <div style="padding:32px;">
      <p style="color:#f1f5f9;font-size:17px;font-weight:700;margin:0 0 8px;">
        Hi ${assigneeName || 'there'},
      </p>
      <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">${message}</p>

      <div style="background:#0f172a;border:1px solid #334155;border-left:4px solid ${accentColor};border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Task</p>
        <h2 style="color:#f1f5f9;font-size:18px;font-weight:800;margin:0 0 8px;">${taskTitle}</h2>
        <p style="color:#94a3b8;font-size:13px;margin:0;">Project: <strong style="color:#f1f5f9;">${projectName}</strong></p>
        <p style="color:${accentColor};font-size:13px;margin:8px 0 0;">📅 Due: ${dueFmt}</p>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="${APP_URL}/my-tasks" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#000;font-weight:800;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
          Update Task Status →
        </a>
      </div>
    </div>
    <div style="background:#7c3aed;padding:12px;text-align:center;">
      <p style="color:#fff;font-size:12px;margin:0;">NexPlan · nexplan.io</p>
    </div>
  </div>
</body>
</html>`
}
