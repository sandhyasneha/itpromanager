/**
 * middleware.ts (REPO ROOT — same level as next.config.js)
 *
 * Routes corporate.nexplan.io to the (corporate) route group.
 * Behaviour:
 *
 *   Hostname = corporate.nexplan.io
 *     /             → /portal           (rewrite, shows the dashboard at /)
 *     /login        → /login            (no rewrite — sign-in page)
 *     /portal/*     → /portal/*         (no rewrite — already correct)
 *     /admin, /dashboard, etc → 404      (main-app routes blocked)
 *
 *   Hostname = nexplan.io / itpromanager.vercel.app
 *     unchanged — all main-app routes work as before
 *
 * NOTE: keep this minimal. Auth checks happen inside (corporate)/layout.tsx,
 * not here, so middleware stays fast and the only job here is host routing.
 *
 * If you already have a middleware.ts, MERGE this logic in — don't replace.
 */

import { NextRequest, NextResponse } from 'next/server'

const CORPORATE_HOST = 'corporate.nexplan.io'

// Routes that are ALLOWED on the corporate subdomain (everything else 404s)
const CORPORATE_ALLOWED_PREFIXES = [
  '/portal',
  '/login',
  '/api/corporate',     // corporate-only API routes
  '/_next',             // Next.js internals
  '/favicon',
  '/icon',
  '/apple-icon',
  '/manifest',
]

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const url  = req.nextUrl.clone()

  // ── Only act on the corporate subdomain ────────────────────────────────
  const isCorporate = host.startsWith(CORPORATE_HOST) || host.startsWith('corporate.localhost')
  if (!isCorporate) return NextResponse.next()

  const path = url.pathname

  // Root → portal dashboard (will redirect to /login if not authed by layout)
  if (path === '/') {
    url.pathname = '/portal'
    return NextResponse.rewrite(url)
  }

  // Allow listed prefixes
  const isAllowed = CORPORATE_ALLOWED_PREFIXES.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p))
  if (!isAllowed) {
    // Anything else on the corporate subdomain → 404
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
