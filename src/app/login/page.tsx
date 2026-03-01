'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ROLES = ['IT Project Manager','Network Engineer','Sponsor','Stakeholder','DevOps Engineer','QA Lead','Other']
const COUNTRIES = ['United States','United Kingdom','India','Australia','Canada','Singapore','Germany','South Africa','UAE','New Zealand','Other']

type Tab = 'signin' | 'signup' | 'forgot'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('signin')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    email: '', password: '', full_name: '',
    role: 'IT Project Manager', country: 'United States'
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const switchTab = (t: Tab) => { setTab(t); setError(''); setSuccess('') }

  async function handleOAuth() {
    setOauthLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) { setError(error.message); setOauthLoading(false) }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Please enter your full name'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, role: form.role, country: form.country },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      setError(error.message)
    } else {
      // Send welcome email
      try {
        await fetch('/api/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            fullName: form.full_name,
            role: form.role,
            country: form.country,
          }),
        })
      } catch (e) { console.error('Welcome email failed:', e) }
      setSuccess('🎉 Account created! Check your email to confirm, then sign in. A welcome email is on its way!')
    }
    setLoading(false)
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email) { setError('Please enter your email address'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSuccess(`✅ Password reset email sent to ${form.email}. Check your inbox and click the link to create a new password.`)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden px-4">
      <div className="fixed w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 bg-accent -top-48 -left-48 pointer-events-none" />
      <div className="fixed w-[400px] h-[400px] rounded-full blur-[100px] opacity-8 bg-accent2 -bottom-32 -right-32 pointer-events-none" />
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-syne font-black text-2xl mb-1">Nex<span className="text-accent">Plan</span></div>
          <p className="text-muted text-sm">AI-Powered IT Project Management</p>
        </div>

        <div className="card p-8">

          {/* ── FORGOT PASSWORD TAB ── */}
          {tab === 'forgot' ? (
            <>
              <button onClick={() => switchTab('signin')}
                className="flex items-center gap-2 text-xs text-muted hover:text-text mb-6 transition-colors">
                ← Back to Sign In
              </button>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-2xl mb-4">🔐</div>
                <h2 className="font-syne font-black text-xl mb-1">Forgot Password?</h2>
                <p className="text-muted text-sm leading-relaxed">Enter your registered email and we'll send you a link to create a new password.</p>
              </div>

              {error && <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">{error}</div>}
              {success && <div className="mb-4 px-4 py-3 bg-accent3/10 border border-accent3/30 rounded-xl text-accent3 text-sm">{success}</div>}

              {!success && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Registered Email</label>
                    <input className="input" type="email" placeholder="jane@company.com"
                      value={form.email} onChange={e => set('email', e.target.value)} required/>
                  </div>
                  <button type="submit" disabled={loading}
                    className="btn-primary w-full justify-center py-3 disabled:opacity-50">
                    {loading ? 'Sending...' : 'Send Reset Link →'}
                  </button>
                </form>
              )}

              {success && (
                <button onClick={() => switchTab('signin')} className="btn-primary w-full justify-center py-3 mt-2">
                  Back to Sign In →
                </button>
              )}
            </>
          ) : (
            <>
              {/* ── SIGNIN / SIGNUP TABS ── */}
              <div className="flex gap-1 bg-bg rounded-xl p-1 mb-7">
                {(['signup', 'signin'] as const).map(t => (
                  <button key={t} onClick={() => switchTab(t)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-syne font-semibold transition-all
                      ${tab === t ? 'bg-surface2 text-text' : 'text-muted hover:text-text'}`}>
                    {t === 'signup' ? 'Create Account' : 'Sign In'}
                  </button>
                ))}
              </div>

              {/* Google OAuth only */}
              <button onClick={handleOAuth} disabled={oauthLoading}
                className="w-full flex items-center justify-center gap-3 py-3 bg-surface2 border border-border rounded-xl text-sm hover:border-accent/50 transition-colors disabled:opacity-60 mb-5">
                {oauthLoading ? <span className="animate-spin text-lg">⟳</span> :
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4"/>
                    <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.02c-.72.48-1.63.76-2.7.76-2.07 0-3.82-1.4-4.45-3.27H1.87v2.07A7.9 7.9 0 0 0 8.98 17z" fill="#34A853"/>
                    <path d="M4.53 10.53a4.8 4.8 0 0 1 0-3.06V5.4H1.87a7.9 7.9 0 0 0 0 7.2l2.66-2.07z" fill="#FBBC05"/>
                    <path d="M8.98 4.2c1.17 0 2.22.4 3.05 1.2l2.28-2.28A7.9 7.9 0 0 0 8.98 1a7.9 7.9 0 0 0-7.11 4.4l2.66 2.07c.63-1.87 2.38-3.27 4.45-3.27z" fill="#EA4335"/>
                  </svg>}
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5 text-muted text-xs">
                <div className="flex-1 h-px bg-border" />or use email<div className="flex-1 h-px bg-border" />
              </div>

              {error && <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">{error}</div>}
              {success && <div className="mb-4 px-4 py-3 bg-accent3/10 border border-accent3/30 rounded-xl text-accent3 text-sm">{success}</div>}

              <form onSubmit={tab === 'signup' ? handleSignup : handleSignin} className="space-y-4">
                {tab === 'signup' && (
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Full Name *</label>
                    <input className="input" placeholder="Jane Smith"
                      value={form.full_name} onChange={e => set('full_name', e.target.value)} required/>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Email Address *</label>
                  <input className="input" type="email" placeholder="jane@company.com"
                    value={form.email} onChange={e => set('email', e.target.value)} required/>
                </div>
                {tab === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Role</label>
                      <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Country</label>
                      <select className="select" value={form.country} onChange={e => set('country', e.target.value)}>
                        {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-syne font-semibold text-muted">Password *</label>
                    {tab === 'signin' && (
                      <button type="button" onClick={() => switchTab('forgot')}
                        className="text-xs text-accent hover:underline font-medium">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input className="input" type="password" placeholder="Min. 8 characters"
                    value={form.password} onChange={e => set('password', e.target.value)} required minLength={8}/>
                </div>
                <button type="submit" className="btn-primary w-full justify-center py-3 mt-1" disabled={loading}>
                  {loading ? 'Please wait…' : tab === 'signup' ? 'Create Free Account →' : 'Sign In →'}
                </button>
              </form>

              <p className="text-center text-xs text-muted mt-5">
                {tab === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                <button onClick={() => switchTab(tab === 'signup' ? 'signin' : 'signup')}
                  className="text-accent hover:underline font-medium">
                  {tab === 'signup' ? 'Sign in' : 'Sign up free'}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          <a href="/" className="hover:text-text transition-colors">← Back to nexplan.io</a>
        </p>
      </div>
    </div>
  )
}
