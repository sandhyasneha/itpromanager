/**
 * middleware.ts (REPO ROOT — same level as next.config.js)
 *
 * Routes corporate.nexplan.io to the (corporate) route group.
 *
 * URL the user sees           →  Actual file rendered
 * ─────────────────────────────────────────────────────────────
 * corporate.nexplan.io/           →  /portal               (overview)
 * corporate.nexplan.io/login      →  /portal/login         (sign-in)
 * corporate.nexplan.io/portal     →  /portal               (no rewrite)
 * corporate.nexplan.io/portal/*   →  /portal/*             (no rewrite)
 *
 * On nexplan.io / itpromanager.vercel.app — middleware does NOTHING,
 * so the main app behaves exactly as before.
 *
 * IMPORTANT: if you already have a middleware.ts at the repo root,
 * MERGE this logic into it — don't replace.
 */

import { NextRequest, NextResponse } from 'next/server'

const CORPORATE_HOSTS = [
  'corporate.nexplan.io',
  'corporate.localhost',     // for local dev — add to your hosts file
]

// Paths that exist (or rewrite-target paths) on the corporate subdomain
const CORPORATE_ALLOWED_PREFIXES = [
  '/portal',
  '/api/corporate',
  '/_next',
  '/favicon',
  '/icon',
  '/apple-icon',
  '/manifest',
]

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase()
  const isCorporate = CORPORATE_HOSTS.some(h => host === h || host.startsWith(h + ':'))
  if (!isCorporate) return NextResponse.next()

  const url  = req.nextUrl.clone()
  const path = url.pathname

  // ── Friendly URL mappings ────────────────────────────────────────────
  // /          → /portal
  if (path === '/' || path === '') {
    url.pathname = '/portal'
    return NextResponse.rewrite(url)
  }

  // /login     → /portal/login
  if (path === '/login') {
    url.pathname = '/portal/login'
    return NextResponse.rewrite(url)
  }

  // ── Allow paths under /portal and a few static prefixes ──────────────
  const isAllowed = CORPORATE_ALLOWED_PREFIXES.some(
    p => path === p || path.startsWith(p + '/')
  )
  if (!isAllowed) {
    url.pathname = '/portal/not-found'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  // Skip static assets entirely
  matcher: [
    '/((?!_next/static|_next/image|.*\\..*).*)',
  ],
}
