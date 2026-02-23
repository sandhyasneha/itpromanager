import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { assigneeEmail, assigneeName, taskTitle, taskDescription, projectName, priority, startDate, endDate, duration, dueDate, assignedBy } = await request.json()

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  const priorityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#00d4ff',
    low: '#6b7280',
  }
  const priorityColor = priorityColors[priority] ?? '#00d4ff'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:900;color:#ffffff;margin:0;">
        Nex<span style="color:#00d4ff;">Plan</span>
      </h1>
      <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">AI-Powered IT Project Management</p>
    </div>

    <!-- Card -->
    <div style="background:#13131a;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
      
      <!-- Top bar -->
      <div style="background:#00d4ff;padding:4px;"></div>
      
      <div style="padding:32px;">
        <p style="color:#6b7280;font-size:13px;margin:0 0 8px;font-family:monospace;">NEW TASK ASSIGNED</p>
        <h2 style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 24px;">
          📋 ${taskTitle}
        </h2>

        <!-- Task details -->
        <div style="background:#0a0a0f;border-radius:12px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="color:#6b7280;font-size:12px;padding:8px 0;font-family:monospace;width:120px;">PROJECT</td>
              <td style="color:#ffffff;font-size:14px;font-weight:600;padding:8px 0;">${projectName}</td>
            </tr>
            <tr style="border-top:1px solid #1e1e2e;">
              <td style="color:#6b7280;font-size:12px;padding:8px 0;font-family:monospace;">PRIORITY</td>
              <td style="padding:8px 0;">
                <span style="background:${priorityColor}20;color:${priorityColor};font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px;border:1px solid ${priorityColor}40;">
                  ${priority.toUpperCase()}
                </span>
              </td>
            </tr>
            ${startDate ? `
            <tr style="border-top:1px solid #1e1e2e;">
              <td style="color:#6b7280;font-size:12px;padding:8px 0;font-family:monospace;">START DATE</td>
              <td style="color:#ffffff;font-size:14px;padding:8px 0;">${new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>` : ''}
            ${endDate ? `
            <tr style="border-top:1px solid #1e1e2e;">
              <td style="color:#6b7280;font-size:12px;padding:8px 0;font-family:monospace;">END DATE</td>
              <td style="color:#ffffff;font-size:14px;padding:8px 0;">${new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>` : ''}
            ${duration ? `
            <tr style="border-top:1px solid #1e1e2e;">
              <td style="color:#6b7280;font-size:12px;padding:8px 0;font-family:monospace;">DURATION</td>
              <td style="color:#00d4ff;font-size:14px;font-weight:700;padding:8px 0;">⏱ ${duration} day${duration !== 1 ? 's' : ''}</td>
            </tr>` : ''}
            ${dueDate ? `
            <tr style="border-top:1px solid #1e1e2e;">
              <td style="color:#6b7280;font-size:12px;padding:8px 0;font-family:monospace;">DUE DATE</td>
              <td style="color:#f59e0b;font-size:14px;font-weight:600;padding:8px 0;">⚠️ ${new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>` : ''}
            ${assignedBy ? `
            <tr style="border-top:1px solid #1e1e2e;">
              <td style="color:#6b7280;font-size:12px;padding:8px 0;font-family:monospace;">ASSIGNED BY</td>
              <td style="color:#ffffff;font-size:14px;padding:8px 0;">${assignedBy}</td>
            </tr>` : ''}
          </table>
        </div>

        ${taskDescription ? `
        <div style="background:#0a0a0f;border-left:3px solid #00d4ff;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
          <p style="color:#6b7280;font-size:11px;font-family:monospace;margin:0 0 8px;">DESCRIPTION</p>
          <p style="color:#d1d5db;font-size:14px;line-height:1.6;margin:0;">${taskDescription}</p>
        </div>` : ''}

        <!-- CTA -->
        <div style="text-align:center;">
          <a href="https://www.nexplan.io/kanban" 
            style="display:inline-block;background:#00d4ff;color:#000000;font-weight:800;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
            View Task on NexPlan →
          </a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#374151;font-size:12px;">
        You received this because a task was assigned to you on NexPlan.<br/>
        <a href="https://www.nexplan.io" style="color:#00d4ff;">www.nexplan.io</a> · 
        <a href="mailto:info@nexplan.io" style="color:#6b7280;">info@nexplan.io</a>
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NexPlan <notifications@nexplan.io>',
        to: [assigneeEmail],
        subject: `📋 New Task Assigned: ${taskTitle} — ${projectName}`,
        html,
      }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message ?? 'Send failed' }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    return NextResponse.json({ error: 'Email service error' }, { status: 500 })
  }
}
