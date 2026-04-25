#!/usr/bin/env node
/**
 * scripts/issue-licence.js
 *
 * CLI tool to issue a new NexPlan DC licence key.
 * Run on your local machine or in a GitHub Action.
 *
 * Usage:
 *   NEXPLAN_LICENCE_PRIVATE_KEY="$(cat private.pem)" \
 *   node scripts/issue-licence.js \
 *     --client "CITI BANK" \
 *     --domain "nexplan.citibank.net" \
 *     --plan enterprise \
 *     --seats 250 \
 *     --months 12
 */

const crypto = require('crypto')
const args   = process.argv.slice(2)

function getArg(name) {
  const i = args.indexOf(`--${name}`)
  return i !== -1 ? args[i + 1] : null
}

function base64urlEncode(buf) {
  return buf.toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function signJWT(payload, privateKeyPem) {
  const header     = { alg: 'RS256', typ: 'JWT' }
  const headerB64  = base64urlEncode(Buffer.from(JSON.stringify(header)))
  const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(payload)))
  const input      = `${headerB64}.${payloadB64}`
  const sign       = crypto.createSign('RSA-SHA256')
  sign.update(input)
  const sig = base64urlEncode(sign.sign(privateKeyPem))
  return `${input}.${sig}`
}

// ── Main ────────────────────────────────────────────────────────────────────

const privateKey = process.env.NEXPLAN_LICENCE_PRIVATE_KEY
if (!privateKey) {
  console.error('❌ NEXPLAN_LICENCE_PRIVATE_KEY environment variable not set')
  process.exit(1)
}

const client  = getArg('client')
const domain  = getArg('domain')
const plan    = getArg('plan')    || 'datacenter'
const seats   = parseInt(getArg('seats') || '-1')
const months  = parseInt(getArg('months') || '12')
const noAI    = args.includes('--no-ai')
const airGap  = args.includes('--air-gap')

if (!client || !domain) {
  console.error('❌ --client and --domain are required')
  console.error('Usage: node scripts/issue-licence.js --client "CITI BANK" --domain "nexplan.citibank.net"')
  process.exit(1)
}

const expiresAt = new Date()
expiresAt.setMonth(expiresAt.getMonth() + months)

const licenceId = `lic_${crypto.randomBytes(12).toString('hex')}`

const payload = {
  licence_id:     licenceId,
  client_name:    client,
  allowed_domain: domain.replace(/^https?:\/\//, '').toLowerCase(),
  plan,
  seats,
  ai_enabled:     !noAI,
  air_gap:        airGap,
  expires_at:     expiresAt.toISOString().split('T')[0],
  iat:            Math.floor(Date.now() / 1000),
}

const licenceKey = signJWT(payload, privateKey)

console.log('\n╔══════════════════════════════════════════════════════════╗')
console.log('║            NexPlan Licence Key Issued                    ║')
console.log('╚══════════════════════════════════════════════════════════╝\n')
console.log(`Client:     ${client}`)
console.log(`Domain:     ${payload.allowed_domain}`)
console.log(`Plan:       ${plan}`)
console.log(`Seats:      ${seats === -1 ? 'Unlimited' : seats}`)
console.log(`AI:         ${!noAI ? 'Enabled' : 'Disabled'}`)
console.log(`Air-gap:    ${airGap ? 'Enabled' : 'Disabled'}`)
console.log(`Expires:    ${payload.expires_at}`)
console.log(`Licence ID: ${licenceId}`)
console.log('\n─── NEXPLAN_LICENCE_KEY (send to client) ────────────────────')
console.log(licenceKey)
console.log('\n✅ Send this key to the client — add to their .env as NEXPLAN_LICENCE_KEY')
console.log(`✅ This licence only works on: ${payload.allowed_domain}\n`)
