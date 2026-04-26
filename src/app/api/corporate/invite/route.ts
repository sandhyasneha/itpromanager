/**
 * src/app/api/corporate/onboarding/route.ts
 *
 * Tracks the corporate DC admin's onboarding progress.
 *
 * Steps tracked:
 *   1. licence_generated  — they clicked "Generate Key" at least once
 *   2. assets_downloaded  — they downloaded any deployment file
 *   3. licence_validated  — their container has actually phoned home (proof of install)
 *
 * Step 1 & 2 are stored in the corp_onboarding cookie (client-side, fast).
 * Step 3 is derived from the licence_activations table (server side, real).
 *
 * Returns: { steps: [{ id, label, done }], all_done: boolean }
 */

import { NextRequest, NextResponse }   from 'next/server'
import { cookies }                     from 'next/headers'
import { createClient as adminSB }     from '@supabase/supabase-js'
import { findWorkspaceByEmail }        from '@/lib/corporate/whitelist'

export const dynamic = 'force-dynamic'

interface OnboardingState {
  licence_generated: boolean
  assets_downloaded: boolean
  licence_validated: boolean
}

// ── GET: read current state ─────────────────────────────────────────────────
export async function GET() {
  const cookieStore = await cookies()
  const email       = cookieStore.get('corp_email')?.value
  const workspace   = findWorkspaceByEmail(email)

  if (!workspace) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Read client-tracked steps from cookie
  const cookieValue = cookieStore.get('corp_onboarding')?.value
  let clientSteps: Partial<OnboardingState> = {}
  try {
    if (cookieValue) clientSteps = JSON.parse(decodeURIComponent(cookieValue))
  } catch { /* malformed cookie - ignore */ }

  // Step 3 is real: check if any successful activation exists for this domain
  let licence_validated = false
  try {
    const db = adminSB(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    const { count } = await db
      .from('licence_activations')
      .select('*', { count: 'exact', head: true })
      .eq('domain', workspace.domain)
      .eq('success', true)

    licence_validated = (count ?? 0) > 0
  } catch (e) {
    // Don't fail the API — onboarding state is non-critical
    console.warn('[Onboarding] Could not check activations:', e)
  }

  // Also try to derive step 1 from server-side: if any licence has been
  // issued for this domain, step 1 is done (more reliable than cookie).
  let licence_generated = clientSteps.licence_generated ?? false
  if (!licence_generated) {
    try {
      const db = adminSB(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
      const { count } = await db
        .from('issued_licences')
        .select('*', { count: 'exact', head: true })
        .eq('allowed_domain', workspace.domain)
      licence_generated = (count ?? 0) > 0
    } catch { /* fall back to cookie value */ }
  }

  const steps = [
    {
      id:    'licence_generated',
      label: 'Generate your licence key',
      hint:  'Click "Generate New Key" in the Product Licence card.',
      done:  licence_generated,
    },
    {
      id:    'assets_downloaded',
      label: 'Download deployment files',
      hint:  'Get Dockerfile, docker-compose.yml, .env.template, README.md.',
      done:  clientSteps.assets_downloaded ?? false,
    },
    {
      id:    'licence_validated',
      label: 'Run NexPlan in your data centre',
      hint:  'Once your container starts, it phones home — this step ticks automatically.',
      done:  licence_validated,
    },
  ]

  const all_done = steps.every(s => s.done)

  return NextResponse.json({ steps, all_done })
}

// ── POST: mark a step as done (client-side flags only) ──────────────────────
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const email       = cookieStore.get('corp_email')?.value
  const workspace   = findWorkspaceByEmail(email)

  if (!workspace) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await req.json() as { step?: keyof OnboardingState }
  if (!body.step) {
    return NextResponse.json({ error: 'Missing step' }, { status: 400 })
  }

  // Read existing cookie
  const existing = cookieStore.get('corp_onboarding')?.value
  let state: Partial<OnboardingState> = {}
  try {
    if (existing) state = JSON.parse(decodeURIComponent(existing))
  } catch { /* ignore */ }

  // Set the requested flag
  state[body.step] = true

  // Write back
  const res = NextResponse.json({ ok: true, state })
  res.cookies.set({
    name:     'corp_onboarding',
    value:    encodeURIComponent(JSON.stringify(state)),
    path:     '/',
    maxAge:   60 * 60 * 24 * 90,  // 90 days
    sameSite: 'lax',
  })
  return res
}
