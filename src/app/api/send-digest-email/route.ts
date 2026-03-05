import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }
  try {
    const { to, subject, html, text } = await request.json()
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const recipients = Array.isArray(to) ? to : [to]
    const emailHtml = html ?? `<html><body><pre style="font-family:Arial;font-size:14px;line-height:1.7;">${text}</pre><br/><a href="https://www.nexplan.io/dashboard">View Dashboard →</a></body></html>`
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'NexPlan <info@nexplan.io>', to: recipients, subject, html: emailHtml }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message ?? 'Send failed' }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}