'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NexPlanLogo from '@/components/NexPlanLogo'

export default function ResetPasswordPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [ready,    setReady]    = useState(false)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    // ── Method 1: exchange token from URL hash ─────────
    // Supabase puts #access_token=...&type=recovery in the URL
    async function exchangeToken() {
      try {
        const hash   = window.location.hash
        const params = new URLSearchParams(hash.replace('#', ''))
        const accessToken  = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type         = params.get('type')

        if (accessToken && type === 'recovery') {
          // Set the session manually from the URL tokens
          const { error } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken ?? '',
          })
          if (!error) {
            setReady(true)
            setVerifying(false)
            return
          }
        }

        // ── Method 2: check if already in recovery session ─
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setReady(true)
          setVerifying(false)
          return
        }

        // ── Method 3: listen for PASSWORD_RECOVERY event ───
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            setReady(true)
            setVerifying(false)
          }
        })

        // Timeout — if nothing fires after 5s show error
        setTimeout(() => {
          setVerifying(false)
          subscription.unsubscribe()
        }, 5000)

        return () => subscription.unsubscribe()

      } catch (e) {
        setVerifying(false)
      }
    }

    exchangeToken()
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      await supabase.auth.signOut()
      setTimeout(() => router.push('/login'), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden px-4">
      <div className="fixed w-[500px] h-[500px] rounded-full blur-[120px] opacity-5 bg-cyan-400 -top-48 -left-48 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <NexPlanLogo size="lg" showTagline />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">

          {/* ── Success ──────────────────────────────── */}
          {success && (
            <div className="text-center py-6">
              <p className="text-5xl mb-4">✅</p>
              <h2 className="font-syne font-black text-xl text-slate-900 mb-2">Password Updated!</h2>
              <p className="text-slate-500 text-sm">Redirecting you to login…</p>
            </div>
          )}

          {/* ── Verifying ────────────────────────────── */}
          {!success && verifying && (
            <div className="text-center py-6">
              <div className="text-4xl mb-4 animate-spin">⏳</div>
              <h2 className="font-syne font-black text-xl text-slate-900 mb-2">Verifying Reset Link</h2>
              <p className="text-slate-500 text-sm">Please wait…</p>
            </div>
          )}

          {/* ── Token expired / invalid ───────────────── */}
          {!success && !verifying && !ready && (
            <div className="text-center py-6">
              <p className="text-5xl mb-4">⚠️</p>
              <h2 className="font-syne font-black text-xl text-slate-900 mb-2">Link Expired or Invalid</h2>
              <p className="text-slate-500 text-sm mb-6">
                This reset link has expired or already been used.<br/>
                Please request a new one.
              </p>
              <a href="/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #7c3aed)' }}>
                ← Back to Login
              </a>
            </div>
          )}

          {/* ── Reset form ───────────────────────────── */}
          {!success && !verifying && ready && (
            <>
              <div className="mb-6">
                <h2 className="font-syne font-black text-xl text-slate-900 mb-1">Create New Password</h2>
                <p className="text-slate-500 text-sm">Choose a strong password for your NexPlan account.</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-syne font-semibold text-slate-500 mb-1.5">
                    New Password
                  </label>
                  <input className="input" type="password" placeholder="Min. 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)} required minLength={8}/>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-slate-500 mb-1.5">
                    Confirm New Password
                  </label>
                  <input className="input" type="password" placeholder="Repeat your password"
                    value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8}/>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((password.length / 16) * 100, 100)}%`,
                          background: password.length < 8 ? '#ef4444' : password.length < 12 ? '#f59e0b' : '#22d3a5'
                        }} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong ✓'}
                    </p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="btn-primary w-full justify-center py-3 mt-2">
                  {loading ? 'Updating Password…' : 'Set New Password →'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <a href="/login" className="hover:text-slate-600 transition-colors">← Back to Login</a>
        </p>
      </div>
    </div>
  )
}
