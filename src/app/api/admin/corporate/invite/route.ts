/**
 * src/app/api/admin/corporate/invite/route.ts
 *
 * Admin-only: send a welcome email to a corporate workspace.
 * Use this AFTER you've added their domain to whitelist.ts.
 *
 * Body: { email: "admin@citibank.com" }
 *   - email must match a whitelisted domain
 *   - we look up the workspace from the whitelist
 *   - send welcome email with onboarding instructions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { findWorkspaceByEmail }      from '@/lib/corporate/whitelist'
import { sendCorporateWelcomeEmail } from '@/lib/corporate/welcome-email'

const ADMIN_EMAIL = 'info@nexplan.io'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // ── Auth: must be the admin ──────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await req.json() as { email?: string }
    if (!body.email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const target = body.email.trim().toLowerCase()

    // ── Validate they're in the whitelist ────────────────────────────────
    const workspace = findWorkspaceByEmail(target)
    if (!workspace) {
      return NextResponse.json(
        {
          error: 'Email domain not in whitelist. Add to src/lib/corporate/whitelist.ts first.',
        },
        { status: 400 }
      )
    }

    // ── Send the welcome email ───────────────────────────────────────────
    const result = await sendCorporateWelcomeEmail({
      to:        target,
      workspace,
      inviter:   user.email,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Failed to send email: ' + (result.reason ?? 'unknown') },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok:        true,
      email_id:  result.id,
      sent_to:   target,
      workspace: workspace.company_name,
    })

  } catch (err: any) {
    console.error('[Corporate Invite] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
