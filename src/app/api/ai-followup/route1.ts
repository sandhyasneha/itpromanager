import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { taskTitle, taskDescription, assigneeName, assigneeEmail, projectName, dueDate, priority, taskId, projectId } = await request.json()

    // Generate personalised AI follow-up message
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Write a professional, friendly follow-up message for an IT team member about a task due tomorrow.

Task: ${taskTitle}
Description: ${taskDescription || 'No description'}
Project: ${projectName}
Due Date: ${dueDate}
Priority: ${priority}
Assignee: ${assigneeName || 'Team Member'}

Write 2-3 sentences only. Be direct and professional. Mention the task name and due date. Ask them to log in to NexPlan and update the status. Do NOT use markdown, bullets or headers. Plain text only.`
        }]
      })
    })

    const aiData = await aiRes.json()
    const aiMessage = aiData.content?.[0]?.text || `Hi ${assigneeName || 'there'}, this is a reminder that your task "${taskTitle}" on project ${projectName} is due tomorrow. Please log in to NexPlan and update the task status.`

    const dueDateFormatted = new Date(dueDate).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    const priorityColor: Record<string, string> = {
      critical: '#ef4444', high: '#f59e0b', medium: '#00d4ff', low: '#6b7280'
    }
    const pColor = priorityColor[priority] || '#00d4ff'

    const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0d1117;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#00d4ff;font-size:26px;margin:0;font-weight:900;">NexPlan</h1>
    <p style="color:#6b7280;font-size:11px;margin:4px 0 0;">AI Task Follow-Up</p>
  </div>

  <div style="background:#f59e0b;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:rgba(0,0,0,0.7);font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">⏰ Task Due Tomorrow</p>
    <h2 style="color:#000;font-size:20px;margin:0 0 4px;font-weight:900;">${taskTitle}</h2>
    <p style="color:rgba(0,0,0,0.7);font-size:13px;margin:0;">Project: ${projectName}</p>
  </div>

  <div style="background:#161b22;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #30363d;">
    <p style="color:#e6edf3;font-size:14px;line-height:1.6;margin:0;">${aiMessage}</p>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
    <div style="background:#161b22;border-radius:12px;padding:14px;text-align:center;border:1px solid #30363d;">
      <p style="color:#6b7280;font-size:10px;text-transform:uppercase;margin:0 0 4px;">Due Date</p>
      <p style="color:#f59e0b;font-size:13px;font-weight:bold;margin:0;">${dueDateFormatted}</p>
    </div>
    <div style="background:#161b22;border-radius:12px;padding:14px;text-align:center;border:1px solid #30363d;">
      <p style="color:#6b7280;font-size:10px;text-transform:uppercase;margin:0 0 4px;">Priority</p>
      <p style="color:${pColor};font-size:13px;font-weight:bold;margin:0;text-transform:capitalize;">${priority}</p>
    </div>
  </div>

  <div style="text-align:center;margin-bottom:20px;">
    <a href="https://nexplan.io/my-tasks"
      style="display:inline-block;background:#00d4ff;color:#000;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">
      Update My Task Status →
    </a>
  </div>

  <div style="text-align:center;border-top:1px solid #30363d;padding-top:16px;">
    <p style="color:#6b7280;font-size:11px;margin:0;">NexPlan · nexplan.io · AI-Powered IT Project Management</p>
    <p style="color:#6b7280;font-size:10px;margin:6px 0 0;">You received this because a task was assigned to ${assigneeEmail}</p>
  </div>
</div>
</body></html>`

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'NexPlan <info@nexplan.io>',
        to: assigneeEmail,
        subject: `⏰ Task Due Tomorrow — ${taskTitle} · ${projectName}`,
        html,
      }),
    })

    const emailData = await emailRes.json()

    // Log it
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()
    await supabase.from('ai_followup_log').insert({
      task_id: taskId,
      project_id: projectId,
      sent_to: assigneeEmail,
      due_date: dueDate,
    })

    return NextResponse.json({ success: true, emailId: emailData.id })
  } catch (err: any) {
    console.error('AI follow-up error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
