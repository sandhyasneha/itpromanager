'use client'
import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NexPlanLogo from '@/components/NexPlanLogo'

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [billing, setBilling]           = useState<'monthly' | 'yearly'>('monthly')
  const [showModal, setShowModal]       = useState<'enterprise' | 'signup' | null>(null)
  const [form, setForm]                 = useState({ name: '', email: '', company: '', size: '', message: '' })
  const [submitted, setSubmitted]       = useState(false)
  const [sending, setSending]           = useState(false)
  const [checkingOut, setCheckingOut]   = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [userEmail, setUserEmail]       = useState<string | null>(null)
  const [userName, setUserName]         = useState<string | null>(null)
  const [userPlan, setUserPlan]         = useState<string>('free')
  const [signupStep, setSignupStep]     = useState<'options' | 'email'>('options')
  const [signupEmail, setSignupEmail]   = useState('')
  const [signupName, setSignupName]     = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupLoading, setSignupLoading]   = useState(false)
  const [signupError, setSignupError]       = useState('')
  const [signupDone, setSignupDone]         = useState(false)

  const proPrice  = billing === 'monthly' ? 5  : 49
  const proPeriod = billing === 'monthly' ? '/month' : '/year'
  const proCycle  = billing === 'monthly' ? 'billed monthly' : 'billed annually — save $11'

  // ── Get current user ─────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || null)
        supabase.from('profiles').select('full_name, plan')
          .eq('id', data.user.id).single()
          .then(({ data: profile }) => {
            if (profile) {
              setUserName(profile.full_name)
              setUserPlan(profile.plan || 'free')
            }
          })
      }
    })
  }, [])

  // ── Auto-checkout after login redirect ───────────────────────
  useEffect(() => {
    const autoCheckout = searchParams.get('checkout')
    const autoBilling  = searchParams.get('billing') as 'monthly' | 'yearly' | null
    if (autoCheckout === '1' && userEmail) {
      if (autoBilling) setBilling(autoBilling)
      setTimeout(() => handleUpgrade(autoBilling || billing), 500)
    }
  }, [userEmail, searchParams])

  // ── Checkout ─────────────────────────────────────────────────
  async function handleUpgrade(overrideBilling?: 'monthly' | 'yearly') {
    setCheckoutError('')
    const activeBilling = overrideBilling || billing

    // Not logged in → show signup modal
    if (!userEmail) {
      setShowModal('signup')
      return
    }

    if (userPlan === 'pro') {
      setCheckoutError('You are already on the Pro plan!')
      return
    }

    setCheckingOut(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing:   activeBilling,
          userEmail,
          userName:  userName || userEmail.split('@')[0],
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create checkout')
      window.location.href = data.url
    } catch (err: any) {
      setCheckoutError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setCheckingOut(false)
    }
  }

  // ── Google Sign In → then checkout ───────────────────────────
  async function handleGoogleSignIn() {
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/pricing?checkout=1&billing=${billing}`
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
  }

  // ── Email Sign Up → then checkout ────────────────────────────
  async function handleEmailSignup() {
    if (!signupEmail || !signupPassword || !signupName) {
      setSignupError('Please fill in all fields')
      return
    }
    setSignupLoading(true)
    setSignupError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email:    signupEmail,
        password: signupPassword,
        options:  {
          data:        { full_name: signupName },
          emailRedirectTo: `${window.location.origin}/pricing?checkout=1&billing=${billing}`,
        },
      })
      if (error) throw error
      setSignupDone(true)
    } catch (err: any) {
      setSignupError(err.message || 'Signup failed')
    } finally {
      setSignupLoading(false)
    }
  }

  // ── Enterprise form ───────────────────────────────────────────
  async function handleSubmit() {
    if (!form.name || !form.email) return
    setSending(true)
    try {
      await fetch('/api/send-task-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeEmail:   'info@nexplan.io',
          assigneeName:    'NexPlan Team',
          taskTitle:       `Enterprise Interest`,
          taskDescription: `Name: ${form.name}\nCompany: ${form.company}\nSize: ${form.size}\nMessage: ${form.message}`,
          projectName:     'Enterprise Leads',
          priority:        'high',
          assignedBy:      `${form.name} <${form.email}>`,
        }),
      })
      setSubmitted(true)
    } finally {
      setSending(false)
    }
  }

  const freeFeatures = [
    { icon: '📋', label: 'Unlimited Kanban boards & tasks' },
    { icon: '📅', label: 'Gantt Timeline & progress tracking' },
    { icon: '🛡️', label: 'AI Risk Mitigation suggestions' },
    { icon: '📬', label: 'Task assignment email notifications' },
    { icon: '📚', label: 'AI Knowledge Base — unlimited searches' },
    { icon: '🔍', label: 'Critical path analysis' },
    { icon: '🔔', label: 'Due date & overdue alerts' },
    { icon: '🌐', label: 'Google & email sign in' },
  ]

  const proFeatures = [
    { icon: '✓',  label: 'Everything in Community (Free)' },
    { icon: '🤖', label: 'AI Project Plan generator' },
    { icon: '📊', label: 'AI Status Reports — one click' },
    { icon: '🔀', label: 'PCR Document generator (PRINCE2)' },
    { icon: '✉️', label: 'AI Follow-Up emails for overdue tasks' },
    { icon: '💬', label: 'Task comments & activity log' },
    { icon: '🎫', label: 'Priority support tickets' },
    { icon: '⬇️', label: 'Excel export & advanced downloads' },
  ]

  const enterpriseFeatures = [
    { icon: '⚡', label: 'Everything in Pro' },
    { icon: '👥', label: 'Multi-team workspace' },
    { icon: '🔐', label: 'SSO / Active Directory' },
    { icon: '⚙️', label: 'Advanced admin controls' },
    { icon: '🔗', label: 'Custom integrations (ServiceNow, Jira)' },
    { icon: '🎯', label: 'Dedicated onboarding & training' },
    { icon: '📞', label: 'SLA & 24/7 priority support' },
    { icon: '🗂️', label: 'Custom project templates' },
  ]

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none"/>
      <div className="fixed w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 bg-accent -top-48 -left-48 pointer-events-none"/>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-5 backdrop-blur-xl bg-bg/70 border-b border-border">
        <Link href="/"><NexPlanLogo size="sm" /></Link>
        <div className="hidden md:flex gap-8">
          <Link href="/#features" className="text-muted text-sm hover:text-text transition-colors">Features</Link>
          <Link href="/kb"        className="text-muted text-sm hover:text-text transition-colors">Knowledge Base</Link>
          <Link href="/pricing"   className="text-accent text-sm font-semibold">Pricing</Link>
          <Link href="/docs"      className="text-muted text-sm hover:text-text transition-colors">Docs</Link>
          <Link href="/about"     className="text-muted text-sm hover:text-text transition-colors">About</Link>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
          <Link href="/login" className="btn-primary text-sm px-4 py-2">Get Started Free</Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-24">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent3/10 border border-accent3/30 rounded-full text-accent3 text-xs font-mono mb-6">
            ✦ Community plan always free · Pro plan $5/month
          </div>
          <h1 className="font-syne font-black text-5xl md:text-6xl mb-6">
            Simple, <span className="text-accent">honest</span> pricing.
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            NexPlan is a <strong className="text-text">gift to the IT project management community</strong>.
            Core features free forever. Unlock all AI features for just $5/month.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex gap-1 p-1 bg-surface2 rounded-xl border border-border">
            {(['monthly', 'yearly'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize
                  ${billing === b ? 'bg-accent text-black shadow' : 'text-muted hover:text-text'}`}>
                {b}
                {b === 'yearly' && (
                  <span className="ml-2 text-[10px] bg-accent3/20 text-accent3 px-1.5 py-0.5 rounded-full font-mono-code">
                    Save $11
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {checkoutError && (
          <div className="max-w-md mx-auto mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
            {checkoutError}
          </div>
        )}

        {/* Already Pro */}
        {userPlan === 'pro' && (
          <div className="max-w-md mx-auto mb-6 bg-accent2/10 border border-accent2/30 rounded-xl px-4 py-3 text-accent2 text-sm text-center">
            ⚡ You are already on the Pro plan! <Link href="/kanban" className="underline ml-1">Go to dashboard →</Link>
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">

          {/* Free */}
          <div className="card border-accent/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent2"/>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-2">Community</p>
                <h2 className="font-syne font-black text-4xl">Free</h2>
                <p className="text-muted text-sm mt-1">Forever. For everyone.</p>
              </div>
              <span className="text-3xl">🎁</span>
            </div>
            <p className="font-syne font-black text-2xl mb-1">$0</p>
            <p className="text-xs text-muted mb-6">no credit card required</p>
            <div className="space-y-2.5 mb-8">
              {freeFeatures.map(f => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <span className="text-accent3 shrink-0 text-sm">{f.icon}</span>
                  <span className="text-xs text-muted">{f.label}</span>
                </div>
              ))}
            </div>
            <Link href="/login" className="btn-primary w-full py-3 text-sm justify-center block text-center">
              Start Free Now →
            </Link>
            <p className="text-xs text-muted text-center mt-3">No credit card · No expiry</p>
          </div>

          {/* Pro */}
          <div className="card border-accent2/60 relative overflow-hidden shadow-2xl shadow-accent2/10 scale-[1.02]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent2 to-accent"/>
            <div className="absolute top-4 right-4">
              <span className="text-xs bg-accent2/10 text-accent2 border border-accent2/30 px-2 py-1 rounded-lg font-mono-code font-bold">
                ⚡ Most Popular
              </span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono-code text-xs text-accent2 uppercase tracking-widest mb-2">Pro</p>
                <h2 className="font-syne font-black text-4xl text-accent2">${proPrice}</h2>
                <p className="text-muted text-sm mt-1">{proCycle}</p>
              </div>
              <span className="text-3xl">⚡</span>
            </div>
            <p className="font-syne font-black text-2xl mb-1 text-accent2">
              ${proPrice}<span className="text-lg text-muted font-normal">{proPeriod}</span>
            </p>
            <p className="text-xs text-muted mb-6">{proCycle}</p>
            <div className="space-y-2.5 mb-8">
              {proFeatures.map(f => (
                <div key={f.label} className="flex items-start gap-2.5">
                  <span className="text-accent2 shrink-0 text-sm mt-0.5">{f.icon}</span>
                  <span className={`text-xs ${f.label.startsWith('Everything') ? 'text-text font-semibold' : 'text-muted'}`}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
            {userPlan === 'pro' ? (
              <div className="w-full py-3 text-sm font-bold text-center rounded-xl bg-accent2/10 text-accent2 border border-accent2/30">
                ✓ Current Plan
              </div>
            ) : (
              <button onClick={() => handleUpgrade()} disabled={checkingOut}
                className="w-full py-3 text-sm font-bold block text-center rounded-xl transition-all text-black disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #00d4ff)' }}>
                {checkingOut ? '⏳ Redirecting…' : userEmail ? 'Upgrade to Pro →' : 'Get Pro Now →'}
              </button>
            )}
            <p className="text-xs text-muted text-center mt-3">Cancel anytime · Instant access</p>
          </div>

          {/* Enterprise */}
          <div className="card border-accent3/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent3 to-accent"/>
            <div className="absolute top-4 right-4">
              <span className="text-xs bg-warn/10 text-warn border border-warn/30 px-2 py-1 rounded-lg font-mono-code">Coming Soon</span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono-code text-xs text-accent3 uppercase tracking-widest mb-2">Enterprise</p>
                <h2 className="font-syne font-black text-4xl text-accent3">Custom</h2>
                <p className="text-muted text-sm mt-1">For large organisations</p>
              </div>
              <span className="text-3xl">🏢</span>
            </div>
            <p className="font-syne font-black text-2xl mb-1">Custom</p>
            <p className="text-xs text-muted mb-6">volume pricing available</p>
            <div className="space-y-2.5 mb-8">
              {enterpriseFeatures.map(f => (
                <div key={f.label} className="flex items-start gap-2.5">
                  <span className="text-accent3 shrink-0 text-sm mt-0.5">{f.icon}</span>
                  <span className={`text-xs ${f.label.startsWith('Everything') ? 'text-text font-semibold' : 'text-muted'}`}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal('enterprise')}
              className="w-full py-3 border border-accent3/50 text-accent3 rounded-xl text-sm font-semibold hover:bg-accent3/10 transition-colors">
              Express Interest →
            </button>
            <p className="text-xs text-muted text-center mt-3">We will notify you on launch</p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-16 text-xs text-muted">
          {['🔒 Secure payments via Dodo Payments', '↩️ Cancel anytime', '⚡ Instant Pro access', '🌍 150+ countries supported', '💳 All major cards accepted'].map(b => (
            <span key={b}>{b}</span>
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="card mb-16 overflow-hidden">
          <h3 className="font-syne font-black text-xl mb-6 px-6 pt-6">Feature Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface2">
                  <th className="text-left text-xs font-syne font-bold text-muted uppercase tracking-wide py-3 px-6">Feature</th>
                  <th className="text-center text-xs font-syne font-bold text-accent    uppercase tracking-wide py-3 px-4">🎁 Free</th>
                  <th className="text-center text-xs font-syne font-bold text-accent2   uppercase tracking-wide py-3 px-4 bg-accent2/5">⚡ Pro</th>
                  <th className="text-center text-xs font-syne font-bold text-accent3   uppercase tracking-wide py-3 px-4">🏢 Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Kanban Board & Tasks',       free: true,  pro: true,  ent: true  },
                  { label: 'Gantt Timeline',             free: true,  pro: true,  ent: true  },
                  { label: 'AI Risk Mitigation',         free: true,  pro: true,  ent: true  },
                  { label: 'Task Assignment Emails',     free: true,  pro: true,  ent: true  },
                  { label: 'Knowledge Base',             free: true,  pro: true,  ent: true  },
                  { label: 'AI Project Plan Generator',  free: false, pro: true,  ent: true  },
                  { label: 'AI Status Reports',          free: false, pro: true,  ent: true  },
                  { label: 'PCR Document Generator',     free: false, pro: true,  ent: true  },
                  { label: 'AI Follow-Up Emails',        free: false, pro: true,  ent: true  },
                  { label: 'Comments & Activity Log',    free: false, pro: true,  ent: true  },
                  { label: 'Support Tickets',            free: false, pro: true,  ent: true  },
                  { label: 'Multi-Team Workspace',       free: false, pro: false, ent: true  },
                  { label: 'SSO / Active Directory',     free: false, pro: false, ent: true  },
                  { label: 'Custom Integrations',        free: false, pro: false, ent: true  },
                  { label: 'SLA & Priority Support',     free: false, pro: false, ent: true  },
                ].map((row, i) => (
                  <tr key={row.label} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-surface2/30'}`}>
                    <td className="py-3 px-6 text-sm text-muted">{row.label}</td>
                    <td className="py-3 px-4 text-center">{row.free ? <span className="text-accent3 text-lg">✓</span> : <span className="text-muted/30 text-lg">—</span>}</td>
                    <td className="py-3 px-4 text-center bg-accent2/5">{row.pro  ? <span className="text-accent3 text-lg">✓</span> : <span className="text-muted/30 text-lg">—</span>}</td>
                    <td className="py-3 px-4 text-center">{row.ent  ? <span className="text-accent3 text-lg">✓</span> : <span className="text-muted/30 text-lg">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Why free */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h3 className="font-syne font-black text-3xl mb-4">Why is the core free?</h3>
          <p className="text-muted leading-relaxed mb-4">
            NexPlan was built by an IT Project Manager, for IT Project Managers. Having spent years managing complex infrastructure projects with inadequate tools, our founder S. Ram created NexPlan as a <strong className="text-text">giveaway to the global PM community</strong>.
          </p>
          <p className="text-muted leading-relaxed">
            Every IT PM deserves access to professional-grade tools — regardless of company size, budget, or location. Pro and Enterprise plans fund the free community plan forever.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/about" className="btn-ghost px-6 py-3">Read our story →</Link>
            <button onClick={() => setShowModal('enterprise')} className="btn-ghost px-6 py-3">Contact Enterprise →</button>
          </div>
        </div>

        {/* FAQ */}
        <div className="card mb-16">
          <h3 className="font-syne font-black text-xl mb-6">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: 'Can I upgrade or downgrade anytime?',       a: 'Yes — upgrade to Pro instantly and downgrade back to Free at any time. No lock-in.' },
              { q: 'Will my data be safe if I downgrade?',      a: 'Yes. All your projects, tasks and history are kept even if you downgrade. You just lose access to Pro features.' },
              { q: 'Is the free plan really free forever?',     a: 'Yes. The Community plan is our gift to the IT PM community — no expiry, no credit card, no bait-and-switch.' },
              { q: 'What payment methods are accepted?',        a: 'Payments are handled securely by Dodo Payments. We accept all major credit and debit cards across 150+ countries.' },
              { q: 'Do I need a credit card for the free plan?',a: 'No. Sign up with Google or email — no payment details required for the Community plan.' },
              { q: 'How does Enterprise pricing work?',         a: 'Enterprise is custom-quoted based on team size and requirements. Contact us to discuss.' },
            ].map(faq => (
              <div key={faq.q} className="bg-surface2 rounded-xl p-4">
                <p className="font-syne font-bold text-sm mb-2">{faq.q}</p>
                <p className="text-xs text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── SIGNUP MODAL for unregistered users ── */}
      {showModal === 'signup' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setShowModal(null); setSignupStep('options'); setSignupError(''); setSignupDone(false) }}>
          <div className="card w-full max-w-md p-8" onClick={e => e.stopPropagation()}>

            {signupDone ? (
              /* ── Check email state ── */
              <div className="text-center py-4">
                <div className="text-5xl mb-4">📧</div>
                <h3 className="font-syne font-black text-xl mb-2">Check your email!</h3>
                <p className="text-muted text-sm leading-relaxed">
                  We sent a confirmation link to <strong className="text-text">{signupEmail}</strong>.
                  Click the link to verify your account — then you'll be taken straight to checkout.
                </p>
                <button onClick={() => { setShowModal(null); setSignupDone(false) }}
                  className="btn-ghost px-6 py-2 mt-6 text-sm">Close</button>
              </div>

            ) : signupStep === 'options' ? (
              /* ── Choose sign up method ── */
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-mono-code text-xs text-accent2 uppercase tracking-widest mb-1">⚡ Get Pro — ${proPrice}{proPeriod}</p>
                    <h3 className="font-syne font-black text-xl">Create your free account first</h3>
                    <p className="text-muted text-xs mt-1">Then we'll take you straight to checkout</p>
                  </div>
                  <button onClick={() => setShowModal(null)} className="text-muted hover:text-text text-xl">✕</button>
                </div>

                {/* Google */}
                <button onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-xl hover:bg-surface2 transition-colors text-sm font-semibold mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border"/>
                  <span className="text-xs text-muted">or</span>
                  <div className="flex-1 h-px bg-border"/>
                </div>

                <button onClick={() => setSignupStep('email')}
                  className="w-full py-3 border border-border rounded-xl hover:bg-surface2 transition-colors text-sm font-semibold mb-4">
                  Sign up with Email
                </button>

                <p className="text-xs text-muted text-center">
                  Already have an account?{' '}
                  <Link href={`/login?redirect=/pricing?checkout=1%26billing=${billing}`} className="text-accent hover:underline">
                    Sign in →
                  </Link>
                </p>
              </>

            ) : (
              /* ── Email signup form ── */
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <button onClick={() => setSignupStep('options')} className="text-xs text-muted hover:text-text mb-2 flex items-center gap-1">
                      ← Back
                    </button>
                    <h3 className="font-syne font-black text-xl">Create your account</h3>
                  </div>
                  <button onClick={() => setShowModal(null)} className="text-muted hover:text-text text-xl">✕</button>
                </div>

                {signupError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs mb-4">
                    {signupError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Full Name</label>
                    <input className="input text-sm w-full" placeholder="John Smith"
                      value={signupName} onChange={e => setSignupName(e.target.value)}/>
                  </div>
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Email</label>
                    <input type="email" className="input text-sm w-full" placeholder="john@company.com"
                      value={signupEmail} onChange={e => setSignupEmail(e.target.value)}/>
                  </div>
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Password</label>
                    <input type="password" className="input text-sm w-full" placeholder="Min 8 characters"
                      value={signupPassword} onChange={e => setSignupPassword(e.target.value)}/>
                  </div>
                </div>

                <button onClick={handleEmailSignup} disabled={signupLoading}
                  className="w-full py-3 mt-5 text-sm font-bold text-black rounded-xl disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #00d4ff)' }}>
                  {signupLoading ? 'Creating account…' : 'Create Account & Continue →'}
                </button>

                <p className="text-xs text-muted text-center mt-3">
                  By signing up you agree to our terms. No spam ever.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Enterprise Modal */}
      {showModal === 'enterprise' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setShowModal(null); setSubmitted(false); setForm({ name: '', email: '', company: '', size: '', message: '' }) }}>
          <div className="card w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-syne font-black text-2xl mb-2">Thank you!</h3>
                <p className="text-muted mb-6">We have received your interest. Our team will be in touch within 1–2 business days.</p>
                <button onClick={() => { setShowModal(null); setSubmitted(false) }} className="btn-primary px-6 py-2">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-mono-code text-xs text-accent3 uppercase tracking-widest mb-1">🏢 Enterprise Plan</p>
                    <h3 className="font-syne font-black text-xl">Register Your Interest</h3>
                  </div>
                  <button onClick={() => setShowModal(null)} className="text-muted hover:text-text text-xl">✕</button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Your Name *</label>
                      <input className="input text-sm" placeholder="John Smith"
                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
                    </div>
                    <div>
                      <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Work Email *</label>
                      <input type="email" className="input text-sm" placeholder="john@company.com"
                        value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Company Name</label>
                    <input className="input text-sm" placeholder="Acme Corporation"
                      value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}/>
                  </div>
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Company Size</label>
                    <select className="select text-sm" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                      <option value="">Select size</option>
                      <option>1–50 employees</option>
                      <option>51–200 employees</option>
                      <option>201–1000 employees</option>
                      <option>1000+ employees</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Tell us about your needs</label>
                    <textarea className="input text-sm resize-none h-20"
                      placeholder="How many team members? Current PM tools? Key requirements?"
                      value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}/>
                  </div>
                </div>
                <button onClick={handleSubmit} disabled={!form.name || !form.email || sending}
                  className="btn-primary w-full py-3 mt-5 disabled:opacity-50">
                  {sending ? 'Sending…' : 'Submit Interest →'}
                </button>
                <p className="text-xs text-muted text-center mt-3">We will respond within 1–2 business days</p>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="relative z-10 text-center py-8 text-muted text-sm border-t border-border">
        © 2025 NexPlan ·
        <a href="mailto:info@nexplan.io" className="text-accent hover:underline mx-2">info@nexplan.io</a> ·
        <Link href="/" className="hover:text-text mx-2">Home</Link>
      </footer>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg"/>}>
      <PricingContent />
    </Suspense>
  )
}
