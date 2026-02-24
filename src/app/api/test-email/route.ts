import { NextResponse } from 'next/server'

export async function GET() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set in Vercel' })
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NexPlan <info@nexplan.io>',
        to: ['info@nexplan.io'],
        subject: '✅ NexPlan Email Test',
        html: '<h1>Email working!</h1>',
      }),
    })
    const data = await res.json()
    return NextResponse.json({ status: res.status, ok: res.ok, resend_response: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
