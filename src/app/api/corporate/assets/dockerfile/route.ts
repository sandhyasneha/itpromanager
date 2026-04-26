/**
 * src/app/api/corporate/licence/issue/route.ts
 *
 * Self-serve license issuance for corporate users.
 * Called from the corporate portal "Generate Key" button.
 *
 * Auth: corp_email cookie (set during /portal/login)
 * Workspace: looked up from whitelist
 * Output: a real signed JWT licence key, locked to the user's corporate domain
 *
 * Differences from /api/admin/licence/issue (the admin-only one):
 *   - No need to specify client_name, allowed_domain, plan, seats
 *     → all derived from the user's corp_email + whitelist
 *   - Fixed 12-month duration for self-serve (admins can issue longer)
 *   - Tracks who self-issued via the corp_email cookie value
 */

import { NextRequest, NextResponse }      from 'next/server'
import { cookies }                        from 'next/headers'
import { createClient as adminSB }        from '@supabase/supabase-js'
import { findWorkspaceByEmail }           from '@/lib/corporate/whitelist'
import * as crypto                        from 'crypto'

// ── JWT signing helpers (RSA-SHA256, no external deps) ────────────────────

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function signLicence(payload: object, privateKeyPem: string): string {
  const header     = { alg: 'RS256', typ: 'JWT' }
  const headerB64  = base64urlEncode(Buffer.from(JSON.stringify(header)))
  const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(payload)))
  const input      = `${headerB64}.${payloadB64}`
  const sign       = crypto.createSign('RSA-SHA256')
  sign.update(input)
  return `${input}.${base64urlEncode(sign.sign(privateKeyPem))}`
}

// ── Route handler ──────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth: read the corp_email cookie ──────────────────────────────
    const cookieStore = await cookies()
    const email       = cookieStore.get('corp_email')?.value
    const workspace   = findWorkspaceByEmail(email)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Not signed in or domain not authorised' },
        { status: 401 }
      )
    }

    // ── 2. Validate licence keys are configured on server ────────────────
    const privateKey = process.env.NEXPLAN_LICENCE_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Licence signing not configured. Contact support@nexplan.io' },
        { status: 500 }
      )
    }

    // ── 3. Build the licence payload ─────────────────────────────────────
    const licence_id = `lic_${crypto.randomBytes(12).toString('hex')}`
    const issuedAt   = new Date()
    const expiresAt  = new Date(issuedAt)
    expiresAt.setMonth(expiresAt.getMonth() + 12) // 12-month default for self-serve

    const payload = {
      licence_id,
      client_name:    workspace.company_name,
      allowed_domain: workspace.domain,
      plan:           workspace.plan,
      seats:          workspace.seats,
      ai_enabled:     true,
      air_gap:        false, // can be toggled later via dashboard
      expires_at:     expiresAt.toISOString().split('T')[0],
      iat:            Math.floor(issuedAt.getTime() / 1000),
    }

    // ── 4. Sign the JWT ──────────────────────────────────────────────────
    const licence_key = signLicence(payload, privateKey)

    // ── 5. Persist to Supabase + revoke previous licences for same domain ─
    const db = adminSB(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Revoke any active licences on the same domain (only one active at a time)
    const { data: existing } = await db
      .from('issued_licences')
      .select('licence_id')
      .eq('allowed_domain', workspace.domain)

    if (existing && existing.length > 0) {
      const ids = existing.map(r => r.licence_id)
      await db.from('revoked_licences').upsert(
        ids.map(id => ({
          licence_id: id,
          reason:     `Auto-revoked: replaced by self-serve regeneration on ${issuedAt.toISOString().split('T')[0]}`,
          revoked_by: email,
        })),
        { onConflict: 'licence_id' }
      )
    }

    // Insert the new licence
    await db.from('issued_licences').insert({
      licence_id,
      client_name:    workspace.company_name,
      allowed_domain: workspace.domain,
      plan:           workspace.plan,
      seats:          workspace.seats,
      ai_enabled:     true,
      air_gap:        false,
      expires_at:     payload.expires_at,
      issued_by:      email!,
      issued_at:      issuedAt.toISOString(),
      licence_key:    licence_key.slice(0, 50) + '...', // truncated reference
      notes:          'Self-issued via corporate portal',
    })

    // ── 6. Return the full key to the client ─────────────────────────────
    return NextResponse.json({
      licence_id,
      licence_key,    // ← full JWT, displayed once in the portal
      client_name:    workspace.company_name,
      allowed_domain: workspace.domain,
      plan:           workspace.plan,
      seats:          workspace.seats,
      expires_at:     payload.expires_at,
      issued_at:      issuedAt.toISOString(),
    })

  } catch (err: any) {
    console.error('[Corporate Licence Issue] Error:', err)
    return NextResponse.json(
      { error: err.message ?? 'Internal error' },
      { status: 500 }
    )
  }
}

// ── GET: return current active licence summary for the workspace ───────────
export async function GET() {
  try {
    const cookieStore = await cookies()
    const email       = cookieStore.get('corp_email')?.value
    const workspace   = findWorkspaceByEmail(email)

    if (!workspace) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const db = adminSB(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Find the most recent NON-revoked licence for this domain
    const { data: revokedRows } = await db
      .from('revoked_licences')
      .select('licence_id')
    const revokedIds = (revokedRows ?? []).map(r => r.licence_id)

    let q = db
      .from('issued_licences')
      .select('licence_id, plan, seats, ai_enabled, expires_at, issued_at')
      .eq('allowed_domain', workspace.domain)
      .order('issued_at', { ascending: false })
      .limit(1)

    if (revokedIds.length > 0) {
      q = q.not('licence_id', 'in', `(${revokedIds.map(id => `"${id}"`).join(',')})`)
    }

    const { data: latest } = await q.maybeSingle()

    return NextResponse.json({
      workspace: {
        company_name:  workspace.company_name,
        domain:        workspace.domain,
        plan:          workspace.plan,
        seats:         workspace.seats,
        seats_in_use:  workspace.seats_in_use,
        renewal_at:    workspace.renewal_at,
      },
      active_licence: latest ?? null,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
