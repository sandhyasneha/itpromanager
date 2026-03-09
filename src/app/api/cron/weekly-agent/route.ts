// src/app/api/cron/weekly-agent/route.ts
// Vercel Cron — runs every Monday 08:00 UTC
// Personal plain-text style emails — designed to land in Primary tab

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

// ── Send via Resend — includes plain text for Primary tab ────────
async function sendEmail(
  to: string, subject: string, html: string, text: string
): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Ram from NexPlan <info@nexplan.io>',
      to,
      subject,
      html,
      text, // plain text version — key for Primary tab
    }),
  })
  const data = await res.json()
  console.log(`Resend → ${to}:`, JSON.stringify(data))
  return res.ok
}

// ── Claude AI: generate personal plain-text style nudge ──────────
async function generateNudgeContent(user: {
  name: string; role: string; country: string
  projectCount: number; taskCount: number; daysSinceJoin: number
}): Promise<{ html: string; text: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallbackNudgeContent(user)

  const prompt = `You are Ram, the founder of NexPlan (nexplan.io) — an AI-powered IT project management tool.
Write a short, genuine, founder-to-user personal email. NOT a marketing email. Like a real person checking in.

User:
- Name: ${user.name}
- Role: ${user.role}
- Country: ${user.country}
- Projects created: ${user.projectCount}
- Days since joining: ${user.daysSinceJoin}

Guidelines:
- Write like a real person, not a marketer
- Short — 4 to 6 sentences max
- No bullet points, no headers, no bold text, no emojis in the body
- Reference their actual usage naturally (projects, days)
- Mention ONE specific Pro feature most relevant to their role as an IT PM
- End with a genuine question to encourage a reply (replies = Primary tab!)
- Sign off as "Ram, Founder @ NexPlan"
- Subtle CTA: just mention they can upgrade at nexplan.io/pricing — no big button language

Return a JSON object with two fields:
{
  "text": "plain text version of the email (no HTML)",
  "html": "simple HTML version — NO gradients, NO heavy styling, just a clean white email with simple black text, max-width 600px, font-family Arial, font-size 14px, line-height 1.7, color #333. Just <p> tags and one simple link at the end."
}

Return ONLY the JSON, no explanation.`

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
    const raw  = data.content?.[0]?.text ?? ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (parsed.text && parsed.html) return parsed
    return fallbackNudgeContent(user)
  } catch (e) {
    console.error('Claude nudge error:', e)
    return fallbackNudgeContent(user)
  }
}

// ── Fallback nudge — plain personal style ────────────────────────
function fallbackNudgeContent(user: {
  name: string; role: string; projectCount: number; daysSinceJoin: number
}): { html: string; text: string } {
  const text = `Hi ${user.name},

I noticed you joined NexPlan ${user.daysSinceJoin} days ago and have created ${user.projectCount} project${user.projectCount !== 1 ? 's' : ''} — that's great to see.

I wanted to personally check in and ask — are you finding it useful for your IT project management work? Is there anything that isn't working the way you'd expect?

One thing I'd love for you to try is the AI Project Plan Generator on the Pro plan. As a ${user.role}, it can save you hours — just describe your project in plain English and it builds the full task breakdown instantly.

If you're curious, you can unlock it at nexplan.io/pricing for $5/month. But more importantly, I'd genuinely love to hear how things are going for you.

What's one thing you wish NexPlan did better?

Ram
Founder @ NexPlan
nexplan.io`

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;color:#333333;font-size:14px;line-height:1.7;">
  <p style="margin:0 0 16px;">Hi ${user.name},</p>
  <p style="margin:0 0 16px;">I noticed you joined NexPlan ${user.daysSinceJoin} days ago and have created ${user.projectCount} project${user.projectCount !== 1 ? 's' : ''} — that's great to see.</p>
  <p style="margin:0 0 16px;">I wanted to personally check in and ask — are you finding it useful for your IT project management work? Is there anything that isn't working the way you'd expect?</p>
  <p style="margin:0 0 16px;">One thing I'd love for you to try is the AI Project Plan Generator on the Pro plan. As a ${user.role}, it can save you hours — just describe your project in plain English and it builds the full task breakdown instantly.</p>
  <p style="margin:0 0 16px;">If you're curious, you can unlock it at <a href="https://nexplan.io/pricing" style="color:#0066cc;text-decoration:none;">nexplan.io/pricing</a> for $5/month. But more importantly, I'd genuinely love to hear how things are going for you.</p>
  <p style="margin:0 0 24px;">What's one thing you wish NexPlan did better?</p>
  <p style="margin:0 0 4px;">Ram</p>
  <p style="margin:0 0 4px;color:#666;">Founder @ NexPlan</p>
  <p style="margin:0;"><a href="https://nexplan.io" style="color:#0066cc;text-decoration:none;">nexplan.io</a></p>
  <hr style="border:none;border-top:1px solid #eeeeee;margin:32px 0 16px;" />
  <p style="font-size:11px;color:#999999;margin:0;">You're receiving this because you signed up at nexplan.io. <a href="https://nexplan.io/unsubscribe?email=${'{email}'}" style="color:#999999;">Unsubscribe</a></p>
</div></body></html>`

  return { text, html }
}

// ── Pro Welcome — personal plain style ───────────────────────────
function proWelcomeContent(firstName: string, email: string, billing: string): { html: string; text: string } {
  const price = billing === 'yearly' ? '$50/year' : '$5/month'

  const text = `Hi ${firstName},

This is Ram, founder of NexPlan. I just wanted to say a genuine thank you for upgrading to Pro — it really means a lot, especially at this stage of building NexPlan.

Your Pro features are now fully active. The ones I'd start with:

- AI Project Plan Generator: go to Kanban → + Project, describe your IT project and click "Generate with AI". Your full task plan will be ready in 10 seconds.
- AI Status Reports: one click and a professional RAG status report goes to all your stakeholders.
- PCR Document Generator: describe your change request and AI writes the full PRINCE2 document.

If you run into anything or have a feature request, just reply to this email — I read every reply personally.

Thanks again for the support.

Ram
Founder @ NexPlan
nexplan.io`

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;color:#333333;font-size:14px;line-height:1.7;">
  <p style="margin:0 0 16px;">Hi ${firstName},</p>
  <p style="margin:0 0 16px;">This is Ram, founder of NexPlan. I just wanted to say a genuine thank you for upgrading to Pro — it really means a lot, especially at this stage of building NexPlan.</p>
  <p style="margin:0 0 16px;">Your Pro features are now fully active. The ones I'd start with:</p>
  <p style="margin:0 0 8px;padding-left:16px;border-left:3px solid #0066cc;"><strong>AI Project Plan Generator</strong> — go to Kanban → + Project, describe your IT project and click "Generate with AI". Your full task plan will be ready in 10 seconds.</p>
  <p style="margin:8px 0 8px;padding-left:16px;border-left:3px solid #0066cc;"><strong>AI Status Reports</strong> — one click and a professional RAG status report goes to all your stakeholders.</p>
  <p style="margin:8px 0 16px;padding-left:16px;border-left:3px solid #0066cc;"><strong>PCR Document Generator</strong> — describe your change request and AI writes the full PRINCE2 document.</p>
  <p style="margin:0 0 16px;">If you run into anything or have a feature request, just reply to this email — I read every reply personally.</p>
  <p style="margin:0 0 24px;">Thanks again for the support.</p>
  <p style="margin:0 0 4px;">Ram</p>
  <p style="margin:0 0 4px;color:#666;">Founder @ NexPlan</p>
  <p style="margin:0 0 24px;"><a href="https://nexplan.io" style="color:#0066cc;text-decoration:none;">nexplan.io</a></p>
  <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:24px;">
    <p style="margin:0 0 4px;font-size:12px;color:#666;">Your account</p>
    <p style="margin:0 0 4px;font-size:13px;"><strong>${email}</strong> · Pro · ${price}</p>
    <p style="margin:0;font-size:12px;color:#666;"><a href="https://nexplan.io/kanban" style="color:#0066cc;text-decoration:none;">Go to your dashboard →</a></p>
  </div>
  <hr style="border:none;border-top:1px solid #eeeeee;margin:0 0 16px;" />
  <p style="font-size:11px;color:#999999;margin:0;">NexPlan · nexplan.io · <a href="mailto:info@nexplan.io" style="color:#999999;">info@nexplan.io</a></p>
</div></body></html>`

  return { text, html }
}

// ── Personal nudge subject lines — conversational not promotional ─
const NUDGE_SUBJECTS = [
  (n: string) => `${n}, quick question about your IT projects`,
  (n: string) => `Checking in — how is NexPlan working for you, ${n}?`,
  (_n: string) => `A personal note from the NexPlan founder`,
  (n: string) => `${n}, had a thought about your projects`,
  (_n: string) => `How are your IT projects going?`,
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

  const cutoff  = sevenDaysAgo()
  const now     = new Date()
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

        // ── New Pro this week → Pro Welcome ──────────────────
        if (plan === 'pro' && user.plan_updated_at && user.plan_updated_at >= cutoff) {
          const { html, text } = proWelcomeContent(name, user.email, user.plan_billing ?? 'monthly')
          const ok = await sendEmail(
            user.email,
            `Thank you for upgrading to NexPlan Pro, ${name}`,
            html,
            text
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

        // ── Free users (≥3 days) → personal nudge ────────────
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

          const { html, text } = await generateNudgeContent({
            name, role: user.role ?? 'IT Project Manager',
            country: user.country ?? 'Unknown',
            projectCount: projectCount ?? 0,
            taskCount: taskCount ?? 0,
            daysSinceJoin,
          })

          const subject = NUDGE_SUBJECTS[weekNum % NUDGE_SUBJECTS.length](name)
          const ok      = await sendEmail(user.email, subject, html, text)

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
