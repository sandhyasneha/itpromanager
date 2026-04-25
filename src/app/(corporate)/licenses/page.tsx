/**
 * src/app/(corporate)/login/page.tsx
 *
 * Sign-in page for corporate.nexplan.io.
 * UI matches the mockup: centred card, "Corporate Access Only" badge,
 * work email field, "Continue with Single Sign-On" button.
 *
 * Mock auth: any email whose domain is whitelisted will be accepted.
 * Real auth: wire to Supabase Auth + magic link / SAML.
 */

'use client'

import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import { isCorporateEmail } from '@/lib/corporate/whitelist'

export default function CorporateLoginPage() {
  const router = useRouter()
  const [email,     setEmail]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const trimmed = email.trim().toLowerCase()

    // ── Step 1: validate it looks like an email ─────────────────────────
    if (!trimmed.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid work email address.')
      setSubmitting(false)
      return
    }

    // ── Step 2: check it's a whitelisted corporate domain ───────────────
    if (!isCorporateEmail(trimmed)) {
      setError(
        'This email isn\'t recognised as a corporate workspace. ' +
        'Contact it-support@nexplan.io if you believe this is an error.'
      )
      setSubmitting(false)
      return
    }

    // ── Step 3 (mock): set a session cookie + redirect to portal ────────
    // Real version: trigger SSO flow (Supabase magic link / Azure AD / SAML)
    document.cookie = `corp_email=${encodeURIComponent(trimmed)}; path=/; max-age=86400; samesite=lax`
    router.push('/portal')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* ── Background grid pattern ─────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
          backgroundSize:  '40px 40px',
          maskImage:       'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      {/* Subtle gradient wash */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.06), transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md">

        {/* ── Logo + tenant identifier ────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold font-mono">N</span>
            </div>
            <span className="text-[15px] font-semibold text-slate-900 tracking-tight">
              Corporate · Nexplan.io
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-700 font-medium">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Corporate Access Only
          </span>
        </div>

        {/* ── Sign-in card ────────────────────────────────────────────── */}
        <form
          onSubmit={handleSignIn}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] p-7"
        >
          <div className="mb-5">
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight mb-1.5">
              Sign in to Corporate
            </h1>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Manage your enterprise developer resources, licenses, and deployment assets.
            </p>
          </div>

          <label className="block">
            <span className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-500 mb-1.5">
              Work Email
            </span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-[14px] placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                         transition-colors"
            />
          </label>

          {error && (
            <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-100 text-[12px] text-red-700 leading-relaxed">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white text-[13px] font-semibold flex items-center justify-center gap-2
                       transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            {submitting ? 'Verifying…' : 'Continue with Single Sign-On'}
            <span className="ml-1">→</span>
          </button>

          <p className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            By continuing, you agree to your organisation&apos;s{' '}
            <a href="#" className="text-slate-900 hover:underline font-medium">
              Acceptable Use Policy
            </a>
            . Access is restricted to verified corporate identities.
          </p>
        </form>

        {/* ── Help link ────────────────────────────────────────────────── */}
        <p className="mt-5 text-center text-[12px] text-slate-500">
          Need help? Contact{' '}
          <a href="mailto:it-support@nexplan.io" className="text-slate-900 hover:underline font-medium">
            it-support@nexplan.io
          </a>
        </p>
      </div>
    </div>
  )
}
