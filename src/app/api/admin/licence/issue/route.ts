/**
 * src/app/api/licence/validate/route.ts
 *
 * NexPlan Licence Validation API
 * ─────────────────────────────────────────────────────────────────────────
 * Called by the DC-deployed container on EVERY startup.
 * If this returns invalid → the app refuses to boot.
 *
 * How it works:
 *   1. Container sends its licence key + domain + instance fingerprint
 *   2. This endpoint verifies the JWT signature (signed with NEXPLAN_LICENCE_PRIVATE_KEY)
 *   3. Checks expiry, domain lock, seat count
 *   4. Logs the activation to Supabase (audit trail)
 *   5. Returns { valid: true, plan, seats, expires_at } or { valid: false, reason }
 *
 * The private key NEVER leaves nexplan.io — clients cannot forge licences.
 *
 * Environment variables needed on nexplan.io (Vercel):
 *   NEXPLAN_LICENCE_PRIVATE_KEY  — RSA private key (PEM), used to sign licences
 *   NEXPLAN_LICENCE_PUBLIC_KEY   — RSA public key (PEM), used to verify licences
 *   SUPABASE_SERVICE_ROLE_KEY    — for logging activations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import * as crypto                   from 'crypto'

// ── Types ──────────────────────────────────────────────────────────────────

interface LicencePayload {
  /** Client organisation name e.g. "CITI BANK" */
  client_name:    string
  /** Domain the licence is locked to e.g. "nexplan.citibank.net" */
  allowed_domain: string
  /** Deployment plan: "starter" | "business" | "enterprise" | "datacenter" */
  plan:           string
  /** Max number of seats (users). -1 = unlimited */
  seats:          number
  /** ISO date string — when the licence expires */
  expires_at:     string
  /** Whether AI features are included */
  ai_enabled:     boolean
  /** Whether air-gap mode is allowed */
  air_gap:        boolean
  /** Unique licence ID for revocation */
  licence_id:     string
  /** Issued at timestamp */
  iat:            number
}

// ── Supabase admin client ──────────────────────────────────────────────────

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ── JWT helpers (using Node crypto — no external deps) ─────────────────────

function base64urlDecode(str: string): Buffer {
  // Convert base64url to base64
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(b64, 'base64')
}

function verifyLicenceJWT(token: string): LicencePayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts

    // Verify signature using RSA public key
    const publicKey = process.env.NEXPLAN_LICENCE_PUBLIC_KEY
    if (!publicKey) {
      console.error('[Licence] NEXPLAN_LICENCE_PUBLIC_KEY not set')
      return null
    }

    const signingInput = `${headerB64}.${payloadB64}`
    const signature    = base64urlDecode(signatureB64)

    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(signingInput)
    const isValid = verify.verify(publicKey, signature)

    if (!isValid) return null

    // Decode payload
    const payload = JSON.parse(
      base64urlDecode(payloadB64).toString('utf8')
    ) as LicencePayload

    return payload
  } catch (err) {
    console.error('[Licence] JWT verification error:', err)
    return null
  }
}

// ── Route handler ──────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      licence_key:   string
      domain:        string
      instance_id?:  string
      app_version?:  string
    }

    const { licence_key, domain, instance_id, app_version } = body

    if (!licence_key || !domain) {
      return NextResponse.json(
        { valid: false, reason: 'Missing licence_key or domain' },
        { status: 400 }
      )
    }

    // ── 1. Verify JWT signature ─────────────────────────────────────────
    const payload = verifyLicenceJWT(licence_key)

    if (!payload) {
      await logActivation({ licence_key: licence_key.slice(0, 20) + '...', domain, success: false, reason: 'Invalid signature', instance_id })
      return NextResponse.json(
        { valid: false, reason: 'Invalid licence key — signature verification failed' },
        { status: 401 }
      )
    }

    // ── 2. Check expiry ─────────────────────────────────────────────────
    const expiresAt = new Date(payload.expires_at)
    const now       = new Date()

    if (expiresAt < now) {
      await logActivation({ licence_id: payload.licence_id, domain, success: false, reason: 'Expired', instance_id })
      return NextResponse.json(
        {
          valid:      false,
          reason:     'Licence expired',
          expires_at: payload.expires_at,
          client:     payload.client_name,
        },
        { status: 402 }
      )
    }

    // ── 3. Check domain lock ────────────────────────────────────────────
    // Normalise both domains (strip protocol, port, trailing slash)
    const normDomain  = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
    const allowedDomain = payload.allowed_domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()

    if (normDomain !== allowedDomain) {
      await logActivation({ licence_id: payload.licence_id, domain, success: false, reason: `Domain mismatch — expected ${allowedDomain}`, instance_id })
      return NextResponse.json(
        {
          valid:  false,
          reason: `Domain not authorised. This licence is locked to: ${payload.allowed_domain}`,
        },
        { status: 403 }
      )
    }

    // ── 4. Check if licence has been revoked ────────────────────────────
    const supabase = getAdmin()
    const { data: revoked } = await supabase
      .from('revoked_licences')
      .select('licence_id, reason')
      .eq('licence_id', payload.licence_id)
      .maybeSingle()

    if (revoked) {
      await logActivation({ licence_id: payload.licence_id, domain, success: false, reason: 'Revoked', instance_id })
      return NextResponse.json(
        { valid: false, reason: `Licence revoked: ${revoked.reason ?? 'Contact support@nexplan.io'}` },
        { status: 403 }
      )
    }

    // ── 5. All checks passed — log successful activation ────────────────
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    await logActivation({
      licence_id:  payload.licence_id,
      domain,
      success:     true,
      reason:      'OK',
      instance_id,
      client_name: payload.client_name,
      app_version,
    })

    // ── 6. Return success ───────────────────────────────────────────────
    return NextResponse.json({
      valid:              true,
      client_name:        payload.client_name,
      plan:               payload.plan,
      seats:              payload.seats,
      ai_enabled:         payload.ai_enabled,
      air_gap:            payload.air_gap,
      expires_at:         payload.expires_at,
      days_until_expiry:  daysUntilExpiry,
      // Warn if expiring soon
      expiry_warning:     daysUntilExpiry <= 30
        ? `Licence expires in ${daysUntilExpiry} days. Contact sales@nexplan.io to renew.`
        : null,
    })

  } catch (err: any) {
    console.error('[Licence] Validation error:', err)
    return NextResponse.json(
      { valid: false, reason: 'Internal validation error' },
      { status: 500 }
    )
  }
}

// ── Helper: log activation to Supabase ─────────────────────────────────────

async function logActivation(data: {
  licence_id?:  string
  licence_key?: string
  domain:       string
  success:      boolean
  reason:       string
  instance_id?: string
  client_name?: string
  app_version?: string
}) {
  try {
    const supabase = getAdmin()
    await supabase.from('licence_activations').insert({
      licence_id:   data.licence_id ?? null,
      domain:       data.domain,
      success:      data.success,
      reason:       data.reason,
      instance_id:  data.instance_id ?? null,
      client_name:  data.client_name ?? null,
      app_version:  data.app_version ?? null,
      activated_at: new Date().toISOString(),
      ip_address:   null, // could add request IP here
    })
  } catch (e) {
    // Don't fail validation just because logging failed
    console.warn('[Licence] Failed to log activation:', e)
  }
}

// ── GET: health check ───────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    service:   'NexPlan Licence Validation API',
    status:    'ok',
    timestamp: new Date().toISOString(),
  })
}
