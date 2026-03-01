import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, fullName, role, country } = await request.json()

    if (!email) return NextResponse.json({ error: 'No email provided' }, { status: 400 })
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

    const firstName = (fullName?.split(' ')[0] || 'there').trim()

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0d1117;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:32px 0 24px;">
    <h1 style="color:#00d4ff;font-size:32px;margin:0;font-weight:900;letter-spacing:-1px;">NexPlan</h1>
    <p style="color:#6b7280;font-size:12px;margin:6px 0 0;text-transform:uppercase;letter-spacing:2px;">AI-Powered IT Project Management</p>
  </div>
  <div style="background:linear-gradient(135deg,#00d4ff15,#7c3aed15);border:1px solid #00d4ff30;border-radius:20px;padding:32px;margin-bottom:20px;text-align:center;">
    <p style="font-size:48px;margin:0 0 12px;">🎉</p>
    <h2 style="color:#ffffff;font-size:26px;margin:0 0 8px;font-weight:900;">Welcome to NexPlan, ${firstName}!</h2>
    <p style="color:#9ca3af;font-size:14px;margin:0;line-height:1.6;">Your free AI-powered IT project management account is ready.<br/>Built for IT PMs, Network Engineers and Infrastructure Teams.</p>
  </div>
  <div style="background:#161b22;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #30363d;">
    <p style="color:#00d4ff;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">✦ What You Can Do with NexPlan</p>
    <div>
      <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;"><span style="font-size:20px;">🤖</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">AI Project Manager</p><p style="color:#6b7280;font-size:12px;margin:0;">Describe your IT project → AI generates a full task plan in seconds</p></div></div>
      <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;"><span style="font-size:20px;">📋</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">Kanban Board</p><p style="color:#6b7280;font-size:12px;margin:0;">Visual drag-and-drop board for all your project tasks</p></div></div>
      <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;"><span style="font-size:20px;">📅</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">Gantt Timeline</p><p style="color:#6b7280;font-size:12px;margin:0;">See your entire project schedule at a glance</p></div></div>
      <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;"><span style="font-size:20px;">🛡️</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">Risk & Issue Register</p><p style="color:#6b7280;font-size:12px;margin:0;">Track risks with RAG status and AI-suggested mitigations</p></div></div>
      <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;"><span style="font-size:20px;">📊</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">AI Status Reports</p><p style="color:#6b7280;font-size:12px;margin:0;">One-click reports emailed to all stakeholders</p></div></div>
      <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;"><span style="font-size:20px;">📚</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">IT Knowledge Base</p><p style="color:#6b7280;font-size:12px;margin:0;">42 professional IT guides — Cisco, Azure, VMware and more</p></div></div>
    </div>
  </div>
  <div style="background:#161b22;border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid #30363d;">
    <p style="color:#22d3a5;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Your Account</p>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #21262d;"><span style="color:#6b7280;font-size:12px;">Email</span><span style="color:#e6edf3;font-size:12px;font-weight:bold;">${email}</span></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #21262d;"><span style="color:#6b7280;font-size:12px;">Role</span><span style="color:#e6edf3;font-size:12px;font-weight:bold;">${role || 'IT Project Manager'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #21262d;"><span style="color:#6b7280;font-size:12px;">Country</span><span style="color:#e6edf3;font-size:12px;font-weight:bold;">${country || '—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#6b7280;font-size:12px;">Plan</span><span style="color:#22d3a5;font-size:12px;font-weight:bold;">✦ Free Forever</span></div>
  </div>
  <div style="text-align:center;margin-bottom:20px;">
    <a href="https://nexplan.io/kanban" style="display:inline-block;background:#00d4ff;color:#000;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:900;font-size:15px;">Go to My Dashboard →</a>
    <p style="color:#6b7280;font-size:12px;margin:12px 0 0;">Or visit the <a href="https://nexplan.io/help" style="color:#00d4ff;text-decoration:none;">Help Center</a> to learn how to use every feature</p>
  </div>
  <div style="background:#0d2818;border:1px solid #22d3a530;border-radius:12px;padding:16px;margin-bottom:20px;">
    <p style="color:#22d3a5;font-size:12px;font-weight:bold;margin:0 0 6px;">💡 Quick Start Tip</p>
    <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">Go to <strong style="color:#e6edf3;">Kanban Board → + Project</strong>, describe your current IT project and click <strong style="color:#e6edf3;">"Generate with AI"</strong>. Your full task plan will be ready in under 10 seconds.</p>
  </div>
  <div style="text-align:center;border-top:1px solid #21262d;padding-top:20px;">
    <p style="color:#6b7280;font-size:11px;margin:0 0 4px;">NexPlan · nexplan.io</p>
    <p style="color:#6b7280;font-size:11px;margin:0;">Questions? <a href="mailto:info@nexplan.io" style="color:#00d4ff;text-decoration:none;">info@nexplan.io</a></p>
    <p style="color:#4b5563;font-size:10px;margin:12px 0 0;">© 2026 NexPlan · Free for IT professionals worldwide</p>
  </div>
</div></body></html>`

    console.log('Sending welcome email to:', email)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'NexPlan <info@nexplan.io>',
        to: email,
        subject: `🎉 Welcome to NexPlan, ${firstName}! Your free IT PM account is ready`,
        html,
      }),
    })

    const data = await res.json()
    console.log('Resend response:', JSON.stringify(data))

    if (!res.ok) {
      console.error('Resend error:', data)
      return NextResponse.json({ error: data }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    console.error('Welcome email exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
