'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase puts the token in the URL hash after redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else { setSuccess(true); setTimeout(() => router.push('/dashboard'), 2000) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden px-4">
      <div className="fixed w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 bg-accent -top-48 -left-48 pointer-events-none" />
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-syne font-black text-2xl mb-1">Nex<span className="text-accent">Plan</span></div>
          <p className="text-muted text-sm">AI-Powered IT Project Management</p>
        </div>

        <div className="card p-8">
          {success ? (
            <div className="text-center py-6">
              <p className="text-5xl mb-4">✅</p>
              <h2 className="font-syne font-black text-xl mb-2">Password Updated!</h2>
              <p className="text-muted text-sm">Redirecting you to your dashboard...</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-6">
              <p className="text-4xl mb-4 animate-pulse">🔐</p>
              <h2 className="font-syne font-black text-xl mb-2">Verifying Reset Link</h2>
              <p className="text-muted text-sm">Please wait while we verify your reset link...</p>
              <p className="text-xs text-muted mt-3">If nothing happens, <a href="/login" className="text-accent hover:underline">go back to login</a></p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-syne font-black text-xl mb-1">Create New Password</h2>
                <p className="text-muted text-sm">Choose a strong password for your NexPlan account.</p>
              </div>

              {error && <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">{error}</div>}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">New Password</label>
                  <input className="input" type="password" placeholder="Min. 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)} required minLength={8}/>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Confirm New Password</label>
                  <input className="input" type="password" placeholder="Repeat your password"
                    value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8}/>
                </div>
                <button type="submit" disabled={loading}
                  className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-50">
                  {loading ? 'Updating Password...' : 'Set New Password →'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          <a href="/login" className="hover:text-text transition-colors">← Back to Login</a>
        </p>
      </div>
    </div>
  )
}
