import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Handle errors from Supabase — show friendly page instead of raw error
  if (error || errorCode) {
    const isExpired = errorCode === 'otp_expired'
    return NextResponse.redirect(
      `${origin}/login?message=${isExpired ? 'link_expired' : 'auth_error'}`
    )
  }

  if (tokenHash) {
    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type as any) || 'email',
    })
    if (!verifyError) {
      if (type === 'recovery') return NextResponse.redirect(`${origin}/reset-password`)
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?message=link_expired`)
  }

  if (code) {
    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      if (type === 'recovery') return NextResponse.redirect(`${origin}/reset-password`)
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?message=link_expired`)
  }

  return NextResponse.redirect(`${origin}/login?message=auth_error`)
}
