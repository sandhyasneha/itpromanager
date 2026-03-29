// src/app/api/send-task-assignment/route.ts
// Sends email when a task is assigned to a team member

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const {
      assigneeEmail, assigneeName, assignedBy,
      taskTitle, taskDescription, taskPriority,
      taskDueDate, projectName, taskId
    } = await request.json()

    if (!assigneeEmail || !taskTitle) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const APP_URL = process.env.APP_URL || 'https://nexplan.io'
    const dueText = taskDueDate
      ? new Date(taskDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    const priorityColor = {
      critical: '#ef4444', high: '#f59e0b',
      medium: '#00d4ff', low: '#94a3b8'
    }[taskPriority as string] || '#00d4ff'

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0f172a;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#00d4ff,#7c3aed);padding:3px 0;"></div>
    <div style="background:#1e293b;padding:24px 32px;border-bottom:1px solid #334155;">
      <span style="font-size:22px;font-weight:900;color:#00d4ff;">✦ NexPlan</span>
      <span style="color:#94a3b8;font-size:13px;margin-left:12px;">Task Assignment</span>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#f1f5f9;font-size:18px;font-weight:700;margin:0 0 8px;">
        Hi ${assigneeName || assigneeEmail.split('@')[0]},
      </p>
      <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">
        <strong style="color:#00d4ff;">${assignedBy || 'Your PM'}</strong> has assigned you a task on <strong style="color:#f1f5f9;">${projectName || 'a project'}</strong>.
      </p>

      <!-- Task Card -->
      <div style="background:#0f172a;border:1px solid #334155;border-left:4px solid ${priorityColor};border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span style="background:${priorityColor}20;color:${priorityColor};border:1px solid ${priorityColor}40;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;">${taskPriority || 'medium'}</span>
        </div>
        <h2 style="color:#f1f5f9;font-size:18px;font-weight:800;margin:0 0 10px;">${taskTitle}</h2>
        ${taskDescription ? `<p style="color:#94a3b8;font-size:14px;margin:0 0 12px;line-height:1.6;">${taskDescription}</p>` : ''}
        ${dueText ? `
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;">
          <span style="color:#f59e0b;font-size:13px;">📅 Due: <strong>${dueText}</strong></span>
        </div>` : ''}
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${APP_URL}/my-tasks" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#000;font-weight:800;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
          View My Tasks →
        </a>
      </div>

      <p style="color:#475569;font-size:13px;text-align:center;margin:0;">
        Update task status at <a href="${APP_URL}/my-tasks" style="color:#00d4ff;">${APP_URL}/my-tasks</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#7c3aed;padding:12px;text-align:center;">
      <p style="color:#fff;font-size:12px;margin:0;">NexPlan — AI-Powered IT Project Management · nexplan.io</p>
    </div>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'NexPlan <notifications@nexplan.io>',
        to: [assigneeEmail],
        subject: `📋 Task Assigned: ${taskTitle} — ${projectName || 'NexPlan'}`,
        html,
      })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to send email')
    return NextResponse.json({ success: true, id: data.id })

  } catch (err: any) {
    console.error('[send-task-assignment]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
