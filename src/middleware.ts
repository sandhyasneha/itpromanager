import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Combined middleware:
 *   1. If host is corporate.nexplan.io   → handle corporate-portal routing
 *      (rewrite /, /login → /portal/* paths; block non-portal routes)
 *   2. Otherwise (nexplan.io, vercel.app, localhost) → run the existing
 *      Supabase session refresh — UNCHANGED behaviour from before.
 *
 * NOTE: corporate-portal pages don't use Supabase auth yet (mock cookie
 * `corp_email` is read by the portal layout instead). When real Supabase
 * SSO is wired into the corporate flow, we can simply remove the early
 * return and let the corporate request also pass through updateSession.
 */
export async function middleware(request: NextRequest) {
  const rawHost = (
    request.headers.get('host') ||
    request.headers.get('x-forwarded-host') ||
    ''
  ).toLowerCase().split(':')[0].trim()

  const isCorporate =
    rawHost === 'corporate.nexplan.io' ||
    rawHost === 'corporate.localhost' ||
    rawHost.startsWith('corporate.')

  // ── Corporate subdomain: route to /portal/* ─────────────────────────
  if (isCorporate) {
    const url  = request.nextUrl.clone()
    const path = url.pathname

    // /  →  /portal
    if (path === '/' || path === '') {
      url.pathname = '/portal'
      return NextResponse.rewrite(url)
    }

    // /login  →  /portal/login
    if (path === '/login') {
      url.pathname = '/portal/login'
      return NextResponse.rewrite(url)
    }

    // Allow paths under /portal and a few static prefixes
    const allowedPrefixes = [
      '/portal',
      '/api/corporate',
      '/_next',
      '/favicon',
      '/icon',
      '/apple-icon',
      '/manifest',
    ]

    const isAllowed = allowedPrefixes.some(
      p => path === p || path.startsWith(p + '/')
    )

    if (isAllowed) {
      // Pass through — the route handler/page will respond
      return NextResponse.next()
    }

    // Anything else on the corporate subdomain → 404
    url.pathname = '/portal/not-found'
    return NextResponse.rewrite(url)
  }

  // ── Main app (nexplan.io etc.): existing Supabase session logic ─────
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
