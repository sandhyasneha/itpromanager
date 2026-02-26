import { NextResponse } from 'next/server'

function buildEmail(type: string, projectName: string, tasks: any[], test: boolean) {
  const today = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  if (type === 'daily_digest') {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayTasks = test
      ? [{ title: 'Example Task 1', status: 'in_progress', priority: 'high', due_date: todayStr, assignee_name: 'You' },
         { title: 'Example Task 2', status: 'backlog', priority: 'medium', due_date: todayStr, assignee_name: 'You' }]
      : tasks.filter(t => t.start_date === todayStr || t.due_date === todayStr).filter(t => t.status !== 'done')

    const statusColors: Record<string,string> = { in_progress:'#00d4ff', review:'#f59e0b', blocked:'#ef4444', backlog:'#6b7280' }
    const priColors: Record<string,string> = { critical:'#ef4444', high:'#f59e0b', medium:'#00d4ff', low:'#6b7280' }

    return {
      subject: `🌅 Daily Digest — ${projectName} — ${today}`,
      html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0d1117;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:20px;">
    <h1 style="color:#00d4ff;font-size:26px;margin:0;">NexPlan</h1>
    <p style="color:#6b7280;font-size:11px;margin:4px 0 0;">Daily Digest</p>
  </div>
  <div style="background:#161b22;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:#22d3a5;font-size:13px;font-weight:bold;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">🌅 Good Morning!</p>
    <h2 style="color:white;font-size:20px;margin:0 0 4px;">${projectName}</h2>
    <p style="color:#6b7280;font-size:12px;margin:0;">${today}</p>
  </div>
  ${todayTasks.length === 0
    ? `<div style="background:#161b22;border-radius:12px;padding:20px;text-align:center;">
        <p style="color:#22d3a5;font-size:14px;margin:0;">✅ No tasks due today — great work!</p>
       </div>`
    : `<div style="background:#161b22;border-radius:12px;padding:16px;margin-bottom:12px;">
        <p style="color:#00d4ff;font-size:12px;font-weight:bold;margin:0 0 12px;text-transform:uppercase;">📋 Today's Tasks (${todayTasks.length})</p>
        ${todayTasks.map(t => `
        <div style="padding:10px;background:#0d1117;border-radius:8px;margin-bottom:8px;border-left:3px solid ${statusColors[t.status]||'#6b7280'};">
          <p style="color:white;font-size:13px;font-weight:bold;margin:0 0 4px;">${t.title}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span style="color:${statusColors[t.status]||'#6b7280'};font-size:11px;text-transform:capitalize;">${t.status.replace('_',' ')}</span>
            <span style="color:${priColors[t.priority]||'#6b7280'};font-size:11px;text-transform:capitalize;">• ${t.priority}</span>
            ${t.assignee_name ? `<span style="color:#6b7280;font-size:11px;">• ${t.assignee_name}</span>` : ''}
          </div>
        </div>`).join('')}
       </div>`
  }
  <div style="text-align:center;border-top:1px solid #30363d;padding-top:16px;margin-top:16px;">
    <a href="https://nexplan.io/kanban" style="background:#00d4ff;color:#000;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;">View Project Board →</a>
    <p style="color:#6b7280;font-size:11px;margin:12px 0 0;">NexPlan · nexplan.io</p>
  </div>
</div>
</body></html>`
    }
  }

  if (type === 'due_reminder') {
    const task = test
      ? { title: 'Example Task — Router Configuration', due_date: new Date(Date.now()+86400000).toISOString().split('T')[0], priority: 'high', assignee_name: 'You' }
      : tasks[0]
    return {
      subject: `⏰ Due Tomorrow — ${task?.title || 'Task'} · ${projectName}`,
      html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0d1117;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:20px;">
    <h1 style="color:#00d4ff;font-size:26px;margin:0;">NexPlan</h1>
  </div>
  <div style="background:#f59e0b;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:rgba(0,0,0,0.7);font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">⏰ Due Tomorrow</p>
    <h2 style="color:#000;font-size:20px;margin:0 0 4px;">${task?.title}</h2>
    <p style="color:rgba(0,0,0,0.7);font-size:13px;margin:0;">Project: ${projectName}</p>
  </div>
  <div style="background:#161b22;border-radius:12px;padding:16px;margin-bottom:16px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="text-align:center;background:#0d1117;border-radius:8px;padding:12px;">
        <p style="color:#6b7280;font-size:10px;text-transform:uppercase;margin:0 0 4px;">Due Date</p>
        <p style="color:#f59e0b;font-size:14px;font-weight:bold;margin:0;">${task?.due_date ? new Date(task.due_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'}</p>
      </div>
      <div style="text-align:center;background:#0d1117;border-radius:8px;padding:12px;">
        <p style="color:#6b7280;font-size:10px;text-transform:uppercase;margin:0 0 4px;">Priority</p>
        <p style="color:#f59e0b;font-size:14px;font-weight:bold;margin:0;text-transform:capitalize;">${task?.priority || 'medium'}</p>
      </div>
    </div>
  </div>
  <div style="text-align:center;">
    <a href="https://nexplan.io/kanban" style="background:#f59e0b;color:#000;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;">Update Task →</a>
    <p style="color:#6b7280;font-size:11px;margin:12px 0 0;">NexPlan · nexplan.io</p>
  </div>
</div>
</body></html>`
    }
  }

  // overdue_alert
  const task = test
    ? { title: 'Example Overdue Task', due_date: new Date(Date.now()-86400000).toISOString().split('T')[0], priority: 'high', assignee_name: 'You' }
    : tasks[0]
  return {
    subject: `🚨 Overdue Alert — ${task?.title || 'Task'} · ${projectName}`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0d1117;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:20px;">
    <h1 style="color:#00d4ff;font-size:26px;margin:0;">NexPlan</h1>
  </div>
  <div style="background:#ef4444;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">🚨 Task Overdue</p>
    <h2 style="color:white;font-size:20px;margin:0 0 4px;">${task?.title}</h2>
    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">Project: ${projectName}</p>
  </div>
  <div style="background:#2d0c0c;border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:16px;margin-bottom:16px;">
    <p style="color:#ef4444;font-size:13px;margin:0;">This task passed its due date of <strong>${task?.due_date ? new Date(task.due_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—'}</strong> and is still not marked as Done. Please review and take action.</p>
  </div>
  <div style="text-align:center;">
    <a href="https://nexplan.io/kanban" style="background:#ef4444;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;">Resolve Now →</a>
    <p style="color:#6b7280;font-size:11px;margin:12px 0 0;">NexPlan · nexplan.io</p>
  </div>
</div>
</body></html>`
  }
}

export async function POST(request: Request) {
  try {
    const { type, email, projectName, tasks = [], test = false } = await request.json()
    const { subject, html } = buildEmail(type, projectName, tasks, test)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'NexPlan <info@nexplan.io>',
        to: email,
        subject,
        html,
      }),
    })

    const data = await res.json()
    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    console.error('Notification send error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
