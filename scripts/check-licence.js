#!/usr/bin/env node
/**
 * scripts/check-licence.js
 *
 * Runs INSIDE the Docker container on every startup (before Next.js boots).
 * Called from the container entrypoint / docker-compose command.
 *
 * Checks:
 *   1. NEXPLAN_LICENCE_KEY env var exists
 *   2. Calls api.nexplan.io/api/licence/validate
 *   3. If valid → continues startup
 *   4. If invalid → prints error and exits (container won't start)
 *
 * In air-gap mode (NEXPLAN_AIR_GAP=true):
 *   Falls back to local verification using the public key baked into the image.
 *   No internet connection required.
 */

const crypto  = require('crypto')
const fs      = require('fs')
const https   = require('https')
const http    = require('http')

const LICENCE_KEY  = process.env.NEXPLAN_LICENCE_KEY
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const AIR_GAP      = process.env.NEXPLAN_AIR_GAP === 'true'
const VALIDATE_URL = 'https://nexplan.io/api/licence/validate'
const APP_VERSION  = process.env.NEXPLAN_VERSION || 'unknown'

// ── Helpers ──────────────────────────────────────────────────────────────────

function base64urlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(b64, 'base64')
}

function decodePayload(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(base64urlDecode(parts[1]).toString('utf8'))
  } catch {
    return null
  }
}

function verifyOffline(token) {
  // Load public key baked into image
  let publicKey
  try {
    publicKey = process.env.NEXPLAN_LICENCE_PUBLIC_KEY
      || fs.readFileSync('/app/licence.pub', 'utf8')
  } catch {
    console.error('[Licence] Public key not found in container')
    return null
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [h, p, sig] = parts
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(`${h}.${p}`)
    if (!verify.verify(publicKey, base64urlDecode(sig))) return null
    return decodePayload(token)
  } catch {
    return null
  }
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data    = JSON.stringify(body)
    const parsed  = new URL(url)
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout:  8000,
    }
    const lib = parsed.protocol === 'https:' ? https : http
    const req = lib.request(options, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve(JSON.parse(body)) }
        catch { reject(new Error('Invalid JSON response')) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')) })
    req.write(data)
    req.end()
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║             NexPlan Licence Verification                 ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')

  // ── 1. Check key exists ───────────────────────────────────────────────
  if (!LICENCE_KEY) {
    console.error('❌ NEXPLAN_LICENCE_KEY is not set in environment.')
    console.error('   Set it in your .env file and restart.')
    console.error('   Contact support@nexplan.io if you need a new key.\n')
    process.exit(1)
  }

  // ── 2. Decode payload for domain check ───────────────────────────────
  const payload = decodePayload(LICENCE_KEY)
  if (!payload) {
    console.error('❌ Licence key is malformed — cannot decode payload.')
    process.exit(1)
  }

  const domain = APP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()

  // ── 3. Air-gap mode: verify locally ──────────────────────────────────
  if (AIR_GAP) {
    console.log('🔒 Air-gap mode — verifying licence offline...')
    const verified = verifyOffline(LICENCE_KEY)

    if (!verified) {
      console.error('❌ Licence signature invalid.')
      process.exit(1)
    }

    // Check expiry
    const expires = new Date(verified.expires_at)
    if (expires < new Date()) {
      console.error(`❌ Licence expired on ${verified.expires_at}`)
      console.error('   Contact sales@nexplan.io to renew.')
      process.exit(1)
    }

    // Check domain
    if (verified.allowed_domain !== domain) {
      console.error(`❌ Domain mismatch. Licence is for: ${verified.allowed_domain}`)
      console.error(`   This instance is running on: ${domain}`)
      process.exit(1)
    }

    const days = Math.ceil((expires - new Date()) / 86400000)
    console.log(`✅ Licence valid (offline) — ${verified.client_name}`)
    console.log(`   Plan: ${verified.plan} | Seats: ${verified.seats === -1 ? 'Unlimited' : verified.seats}`)
    console.log(`   Expires: ${verified.expires_at} (${days} days)\n`)
    return
  }

  // ── 4. Online validation ──────────────────────────────────────────────
  console.log('🌐 Validating licence with nexplan.io...')

  try {
    const result = await httpPost(VALIDATE_URL, {
      licence_key: LICENCE_KEY,
      domain:      APP_URL,
      instance_id: process.env.NEXPLAN_INSTANCE_ID || `dc-${Date.now()}`,
      app_version: APP_VERSION,
    })

    if (!result.valid) {
      console.error(`\n❌ Licence invalid: ${result.reason}`)
      if (result.expires_at) console.error(`   Expired: ${result.expires_at}`)
      console.error('   Contact support@nexplan.io\n')
      process.exit(1)
    }

    const days = result.days_until_expiry
    console.log(`✅ Licence valid — ${result.client_name}`)
    console.log(`   Plan: ${result.plan} | Seats: ${result.seats === -1 ? 'Unlimited' : result.seats}`)
    console.log(`   AI: ${result.ai_enabled ? 'Enabled' : 'Disabled'} | Expires in: ${days} days`)

    if (result.expiry_warning) {
      console.warn(`\n⚠  ${result.expiry_warning}\n`)
    } else {
      console.log()
    }

  } catch (err) {
    // Network error — fall back to offline verification
    console.warn(`⚠  Could not reach nexplan.io (${err.message})`)
    console.warn('   Falling back to offline verification...')

    const verified = verifyOffline(LICENCE_KEY)
    if (!verified) {
      console.error('❌ Offline verification also failed. Cannot start.')
      process.exit(1)
    }

    const expires = new Date(verified.expires_at)
    if (expires < new Date()) {
      console.error(`❌ Licence expired: ${verified.expires_at}`)
      process.exit(1)
    }

    const days = Math.ceil((expires - new Date()) / 86400000)
    console.log(`✅ Licence valid (offline fallback) — ${verified.client_name}`)
    console.log(`   Expires: ${verified.expires_at} (${days} days)\n`)
  }
}

main().catch(err => {
  console.error('[Licence Check] Fatal error:', err)
  process.exit(1)
})
