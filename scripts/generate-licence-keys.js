#!/usr/bin/env node
/**
 * scripts/generate-licence-keys.js
 *
 * Run ONCE to generate the RSA key pair for licence signing.
 * Store the output in Vercel environment variables — NEVER commit to git.
 *
 * Usage:
 *   node scripts/generate-licence-keys.js
 *
 * Then add to Vercel:
 *   NEXPLAN_LICENCE_PRIVATE_KEY = (the private key output)
 *   NEXPLAN_LICENCE_PUBLIC_KEY  = (the public key output)
 */

const crypto = require('crypto')

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength:  2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

console.log('\n╔══════════════════════════════════════════════════════════╗')
console.log('║          NexPlan Licence Key Pair Generated              ║')
console.log('╚══════════════════════════════════════════════════════════╝\n')

console.log('⚠  STORE THESE IN VERCEL ENV VARS — NEVER COMMIT TO GIT\n')

console.log('─── NEXPLAN_LICENCE_PRIVATE_KEY (keep secret!) ─────────────')
console.log(privateKey)

console.log('─── NEXPLAN_LICENCE_PUBLIC_KEY (can be public) ─────────────')
console.log(publicKey)

console.log('\n✅ Add both to Vercel: Settings → Environment Variables')
console.log('✅ The private key signs new licences (nexplan.io only)')
console.log('✅ The public key verifies licences (also in Docker image)\n')
