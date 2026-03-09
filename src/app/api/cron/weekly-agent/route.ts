// src/app/api/cron/weekly-agent/route.ts
// Vercel Cron — runs every Monday 08:00 UTC
// Scans all users → sends Pro Welcome or AI-personalised Free nudge email

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Helpers ──────────────────────────────────────────────────────
function getFirstName(fullName: string | null, email: string) {
  if (fullName) return fullName.split(' ')[0].trim()
  return email.split('@')[0]
}

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

// ── Send via Resend (same pattern as send-welcome/route.ts) ──────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'NexPlan <info@nexplan.io>',
      to,
      subject,
      html,
    }),
  })
  const data = await res.json()
  console.log(`Resend → ${to}:`, JSON.stringify(data))
  return res.ok
}

// ── Claude AI: personalised nudge body ───────────────────────────
async function generateNudgeBody(user: {
  name: string; role: string; country: string
  projectCount: number; taskCount: number; daysSinceJoin: number
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallbackNudgeBody(user)

  const prompt = `You are NexPlan's AI marketing agent. Write a punchy, personalised upgrade email body for a free user.

User:
- Name: ${user.name}
- Role: ${user.role}
- Country: ${user.country}
- Projects created: ${user.projectCount}
- Tasks created: ${user.taskCount}
- Days since joining: ${user.daysSinceJoin}

Return ONLY inner HTML content (no <html>/<body> tags — just inner div elements).
Use inline styles. Dark theme: bg #0d1117, accent #00d4ff, text #e6edf3, muted #6b7280.
Tone: Friendly, direct, creates FOMO. Reference their actual usage to feel personal.
Mention 3 Pro features relevant to their role. Under 300 words. No fluff.
Pro plan: $5/month or $50/year.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text || fallbackNudgeBody(user)
  } catch (e) {
    console.error('Claude error:', e)
    return fallbackNudgeBody(user)
  }
}

// ── Fallback nudge if Claude fails ───────────────────────────────
function fallbackNudgeBody(user: { name: string; role: string; projectCount: number; daysSinceJoin: number }) {
  return `
  <div style="background:linear-gradient(135deg,#00d4ff15,#7c3aed15);border:1px solid #00d4ff30;border-radius:20px;padding:32px;margin-bottom:20px;text-align:center;">
    <p style="font-size:48px;margin:0 0 12px;">⚡</p>
    <h2 style="color:#ffffff;font-size:24px;margin:0 0 8px;font-weight:900;">Hey ${user.name}, you're leaving AI on the table</h2>
    <p style="color:#9ca3af;font-size:14px;margin:0;line-height:1.6;">
      You've been on NexPlan for ${user.daysSinceJoin} days with ${user.projectCount} project${user.projectCount !== 1 ? 's' : ''}.
      As a <strong style="color:#e6edf3;">${user.role}</strong>, here's what Pro unlocks for you.
    </p>
  </div>
  <div style="background:#161b22;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #30363d;">
    <p style="color:#00d4ff;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">⚡ Pro Features You're Missing</p>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;">
      <span style="font-size:20px;">🤖</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">AI Project Plan Generator</p><p style="color:#6b7280;font-size:12px;margin:0;">Describe your project → AI builds the full task breakdown in 10 seconds</p></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;">
      <span style="font-size:20px;">📊</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">AI Status Reports</p><p style="color:#6b7280;font-size:12px;margin:0;">One-click professional reports emailed to stakeholders instantly</p></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;">
      <span style="font-size:20px;">🔀</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">PCR Document Generator</p><p style="color:#6b7280;font-size:12px;margin:0;">AI writes PRINCE2 change request documents automatically</p></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;">
      <span style="font-size:20px;">✉️</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">AI Follow-Up Emails</p><p style="color:#6b7280;font-size:12px;margin:0;">Automatically chase overdue tasks with personalised AI emails</p></div>
    </div>
  </div>
  <div style="background:#0d1f2d;border:1px solid #00d4ff30;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
    <p style="color:#00d4ff;font-size:28px;font-weight:900;margin:0;">$5<span style="font-size:15px;font-weight:400;color:#9ca3af;">/month</span></p>
    <p style="color:#6b7280;font-size:12px;margin:6px 0 0;">or <strong style="color:#e6edf3;">$50/year</strong> — save $10 · Cancel anytime</p>
  </div>`
}

// ── Pro Welcome Email ─────────────────────────────────────────────
function proWelcomeHtml(firstName: string, email: string, billing: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0d1117;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:32px 0 24px;">
    <h1 style="color:#00d4ff;font-size:32px;margin:0;font-weight:900;letter-spacing:-1px;">NexPlan</h1>
    <p style="color:#6b7280;font-size:12px;margin:6px 0 0;text-transform:uppercase;letter-spacing:2px;">AI-Powered IT Project Management</p>
  </div>
  <div style="background:linear-gradient(135deg,#7c3aed20,#00d4ff15);border:1px solid #7c3aed50;border-radius:20px;padding:32px;margin-bottom:20px;text-align:center;">
    <p style="font-size:48px;margin:0 0 12px;">⚡</p>
    <div style="display:inline-block;background:#7c3aed;color:#fff;padding:4px 16px;border-radius:999px;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Pro Member</div>
    <h2 style="color:#ffffff;font-size:26px;margin:8px 0;font-weight:900;">Welcome to NexPlan Pro, ${firstName}!</h2>
    <p style="color:#9ca3af;font-size:14px;margin:0;line-height:1.6;">You've unlocked the full power of AI-driven IT project management.<br/>Billed <strong style="color:#e6edf3;">${billing === 'yearly' ? '$50/year' : '$5/month'}</strong> — thank you for supporting NexPlan 🙏</p>
  </div>
  <div style="background:#161b22;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #7c3aed40;">
    <p style="color:#a78bfa;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">⚡ Your Pro Features Are Now Active</p>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;"><span style="font-size:20px;">🤖</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">AI Project Plan Generator</p><p style="color:#6b7280;font-size:12px;margin:0;">Describe your IT project → AI generates a complete task plan in 10 seconds</p></div></div>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;"><span style="font-size:20px;">📊</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">AI Status Reports</p><p style="color:#6b7280;font-size:12px;margin:0;">One-click professional stakeholder reports with RAG status — emailed instantly</p></div></div>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;"><span style="font-size:20px;">🔀</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">PCR Document Generator</p><p style="color:#6b7280;font-size:12px;margin:0;">AI writes PRINCE2-format change request documents automatically</p></div></div>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;"><span style="font-size:20px;">✉️</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">AI Follow-Up Emails</p><p style="color:#6b7280;font-size:12px;margin:0;">Personalised AI-written follow-ups for overdue tasks sent automatically</p></div></div>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #21262d;"><span style="font-size:20px;">💬</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">Comments & Activity Log</p><p style="color:#6b7280;font-size:12px;margin:0;">Full task comment threads and complete project activity history</p></div></div>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;"><span style="font-size:20px;">🎫</span><div><p style="color:#e6edf3;font-size:13px;font-weight:bold;margin:0 0 2px;">Priority Support</p><p style="color:#6b7280;font-size:12px;margin:0;">Your support tickets jump to the front of the queue</p></div></div>
  </div>
  <div style="background:#161b22;border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid #30363d;">
    <p style="color:#22d3a5;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Your Pro Account</p>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #21262d;"><span style="color:#6b7280;font-size:12px;">Email</span><span style="color:#e6edf3;font-size:12px;font-weight:bold;">${email}</span></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #21262d;"><span style="color:#6b7280;font-size:12px;">Plan</span><span style="color:#a78bfa;font-size:12px;font-weight:bold;">⚡ Pro</span></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#6b7280;font-size:12px;">Billing</span><span style="color:#e6edf3;font-size:12px;font-weight:bold;">${billing === 'yearly' ? '$50/year' : '$5/month'}</span></div>
  </div>
  <div style="text-align:center;margin-bottom:20px;">
    <a href="https://nexplan.io/kanban" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#00d4ff);color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:900;font-size:15px;">Go to My Dashboard →</a>
    <p style="color:#6b7280;font-size:12px;margin:12px 0 0;">Start with <strong style="color:#e6edf3;">AI Project Generator</strong> — describe your project and AI builds it instantly</p>
  </div>
  <div style="background:#0d2818;border:1px solid #22d3a530;border-radius:12px;padding:16px;margin-bottom:20px;">
    <p style="color:#22d3a5;font-size:12px;font-weight:bold;margin:0 0 6px;">💡 Pro Tip — Get Started in 60 Seconds</p>
    <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">Go to <strong style="color:#e6edf3;">Kanban Board → + Project</strong>, write your project description and click <strong style="color:#e6edf3;">"🤖 Generate with AI"</strong>. Your full task plan will be ready instantly.</p>
  </div>
  <div style="text-align:center;border-top:1px solid #21262d;padding-top:20px;">
    <p style="color:#6b7280;font-size:11px;margin:0 0 4px;">NexPlan · nexplan.io</p>
    <p style="color:#6b7280;font-size:11px;margin:0;">Questions? <a href="mailto:info@nexplan.io" style="color:#00d4ff;text-decoration:none;">info@nexplan.io</a></p>
    <p style="color:#4b5563;font-size:10px;margin:12px 0 0;">© 2026 NexPlan · Thank you for supporting free IT project management worldwide</p>
  </div>
</div></body></html>`
}

// ── Free Nudge Email wrapper ──────────────────────────────────────
function nudgeEmailHtml(email: string, aiBody: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0d1117;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:32px 0 24px;">
    <h1 style="color:#00d4ff;font-size:32px;margin:0;font-weight:900;letter-spacing:-1px;">NexPlan</h1>
    <p style="color:#6b7280;font-size:12px;margin:6px 0 0;text-transform:uppercase;letter-spacing:2px;">AI-Powered IT Project Management</p>
  </div>
  ${aiBody}
  <div style="text-align:center;margin:24px 0;">
    <a href="https://nexplan.io/pricing" style="display:inline-block;background:#00d4ff;color:#000;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:900;font-size:15px;">Unlock Pro for $5/month →</a>
    <p style="color:#6b7280;font-size:11px;margin:10px 0 0;">or $50/year · Cancel anytime · No lock-in</p>
  </div>
  <div style="text-align:center;border-top:1px solid #21262d;padding-top:20px;">
    <p style="color:#6b7280;font-size:11px;margin:0 0 4px;">NexPlan · nexplan.io</p>
    <p style="color:#6b7280;font-size:11px;margin:0;">Questions? <a href="mailto:info@nexplan.io" style="color:#00d4ff;text-decoration:none;">info@nexplan.io</a></p>
    <p style="color:#4b5563;font-size:10px;margin:12px 0 0;">© 2026 NexPlan · <a href="https://nexplan.io/unsubscribe?email=${encodeURIComponent(email)}" style="color:#4b5563;text-decoration:none;">Unsubscribe</a></p>
  </div>
</div></body></html>`
}

// ── Rotating nudge subjects ───────────────────────────────────────
const NUDGE_SUBJECTS = [
  (n: string) => `${n}, your IT projects deserve better than this 👀`,
  (n: string) => `⚡ ${n} — unlock AI for your IT projects ($5/month)`,
  (_n: string) => `Still managing IT projects manually? NexPlan Pro fixes that`,
  (n: string) => `${n}, you're 1 click away from AI project management`,
  (_n: string) => `🤖 Let AI write your next IT project plan — NexPlan Pro`,
]

// ── Main handler ─────────────────────────────────────────────────
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results = {
    proWelcomeSent: [] as string[],
    nudgesSent:     [] as string[],
    skipped:        [] as string[],
    errors:         [] as string[],
  }

  const cutoff = sevenDaysAgo()
  const now    = new Date()
  const weekNum = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))

  try {
    const { data: profiles, error: dbError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, country, plan, plan_billing, plan_updated_at, created_at')
      .not('email', 'is', null)

    if (dbError) throw new Error(`DB error: ${dbError.message}`)
    console.log(`Weekly agent: processing ${profiles?.length ?? 0} users`)

    for (const user of profiles ?? []) {
      try {
        const name  = getFirstName(user.full_name, user.email)
        const plan  = user.plan ?? 'free'
        const daysSinceJoin = Math.floor(
          (now.getTime() - new Date(user.created_at).getTime()) / 86400000
        )

        // ── New Pro this week → send Pro Welcome ─────────────
        if (plan === 'pro' && user.plan_updated_at && user.plan_updated_at >= cutoff) {
          const html = proWelcomeHtml(name, user.email, user.plan_billing ?? 'monthly')
          const ok   = await sendEmail(
            user.email,
            `⚡ Welcome to NexPlan Pro, ${name}! Your AI features are now active`,
            html
          )
          if (ok) {
            results.proWelcomeSent.push(user.email)
            await supabase.from('agent_logs').insert({
              user_id: user.id, user_email: user.email,
              action: 'pro_welcome_sent', plan: 'pro',
              note: `Pro welcome sent. Billing: ${user.plan_billing ?? 'monthly'}`,
            })
          } else {
            results.errors.push(`Pro welcome failed: ${user.email}`)
          }
          continue
        }

        // ── Free users (≥3 days) → upgrade nudge ────────────
        if (plan === 'free' && daysSinceJoin >= 3) {
          const { data: recentLog } = await supabase
            .from('agent_logs')
            .select('id')
            .eq('user_email', user.email)
            .eq('action', 'nudge_sent')
            .gte('created_at', cutoff)
            .maybeSingle()

          if (recentLog) { results.skipped.push(user.email); continue }

          const { count: projectCount } = await supabase
            .from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', user.id)
          const { count: taskCount } = await supabase
            .from('tasks').select('*', { count: 'exact', head: true }).eq('assigned_to', user.email)

          const aiBody  = await generateNudgeBody({
            name, role: user.role ?? 'IT Project Manager',
            country: user.country ?? 'Unknown',
            projectCount: projectCount ?? 0, taskCount: taskCount ?? 0, daysSinceJoin,
          })
          const html    = nudgeEmailHtml(user.email, aiBody)
          const subject = NUDGE_SUBJECTS[weekNum % NUDGE_SUBJECTS.length](name)
          const ok      = await sendEmail(user.email, subject, html)

          if (ok) {
            results.nudgesSent.push(user.email)
            await supabase.from('agent_logs').insert({
              user_id: user.id, user_email: user.email,
              action: 'nudge_sent', plan: 'free',
              note: `Nudge sent. Days: ${daysSinceJoin}, Projects: ${projectCount ?? 0}, Tasks: ${taskCount ?? 0}`,
            })
          } else {
            results.errors.push(`Nudge failed: ${user.email}`)
          }
          continue
        }

        results.skipped.push(user.email)

      } catch (userErr: any) {
        console.error(`Error ${user.email}:`, userErr)
        results.errors.push(`${user.email}: ${userErr.message}`)
      }
    }

    // Log run summary
    const summary = {
      pro_welcome: results.proWelcomeSent.length,
      nudges:      results.nudgesSent.length,
      skipped:     results.skipped.length,
      errors:      results.errors.length,
      ran_at:      now.toISOString(),
    }
    await supabase.from('agent_logs').insert({
      user_id: null, user_email: 'system@nexplan.io',
      action: 'agent_run_complete', plan: null,
      note: JSON.stringify(summary),
    })

    console.log('Agent complete:', summary)
    return NextResponse.json({ success: true, summary, detail: results })

  } catch (err: any) {
    console.error('Agent fatal:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
