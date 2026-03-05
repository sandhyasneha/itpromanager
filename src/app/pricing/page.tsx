'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function PricingPage() {
  const [billing, setBilling]     = useState<'monthly' | 'yearly'>('monthly')
  const [showModal, setShowModal] = useState<'enterprise' | null>(null)
  const [form, setForm]           = useState({ name: '', email: '', company: '', size: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending]     = useState(false)

  const proPrice  = billing === 'monthly' ? 5  : 50
  const proPeriod = billing === 'monthly' ? '/month' : '/year'
  const proCycle  = billing === 'monthly' ? 'billed monthly' : 'billed annually — save $10'

  async function handleSubmit() {
    if (!form.name || !form.email) return
    setSending(true)
    try {
      await fetch('/api/send-task-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeEmail: 'info@nexplan.io',
          assigneeName:  'NexPlan Team',
          taskTitle:     `Enterprise Interest`,
          taskDescription: `Name: ${form.name}\nCompany: ${form.company}\nSize: ${form.size}\nMessage: ${form.message}`,
          projectName:   'Enterprise Leads',
          priority:      'high',
          assignedBy:    `${form.name} <${form.email}>`,
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
    { icon: '✓', label: 'Everything in Community (Free)' },
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
        <Link href="/" className="font-syne font-black text-xl">Nex<span className="text-accent">Plan</span></Link>
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
                    Save 17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing cards — 3 columns */}
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

          {/* Pro — highlighted */}
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
                <h2 className="font-syne font-black text-4xl text-accent2">
                  ${proPrice}
                </h2>
                <p className="text-muted text-sm mt-1">{proCycle}</p>
              </div>
              <span className="text-3xl">⚡</span>
            </div>
            <p className="font-syne font-black text-2xl mb-1 text-accent2">${proPrice}<span className="text-lg text-muted font-normal">{proPeriod}</span></p>
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
            <Link href="/login"
              className="w-full py-3 text-sm font-bold block text-center rounded-xl transition-all text-black"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #00d4ff)' }}>
              Upgrade to Pro →
            </Link>
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
                  { label: 'Kanban Board & Tasks',          free: true,  pro: true,  ent: true  },
                  { label: 'Gantt Timeline',                free: true,  pro: true,  ent: true  },
                  { label: 'Progress Tracking',             free: true,  pro: true,  ent: true  },
                  { label: 'AI Risk Mitigation',            free: true,  pro: true,  ent: true  },
                  { label: 'Task Assignment Emails',        free: true,  pro: true,  ent: true  },
                  { label: 'Knowledge Base',                free: true,  pro: true,  ent: true  },
                  { label: 'AI Project Plan Generator',     free: false, pro: true,  ent: true  },
                  { label: 'AI Status Reports',             free: false, pro: true,  ent: true  },
                  { label: 'PCR Document Generator',        free: false, pro: true,  ent: true  },
                  { label: 'AI Follow-Up Emails',           free: false, pro: true,  ent: true  },
                  { label: 'Comments & Activity Log',       free: false, pro: true,  ent: true  },
                  { label: 'Support Tickets',               free: false, pro: true,  ent: true  },
                  { label: 'Multi-Team Workspace',          free: false, pro: false, ent: true  },
                  { label: 'SSO / Active Directory',        free: false, pro: false, ent: true  },
                  { label: 'Custom Integrations',           free: false, pro: false, ent: true  },
                  { label: 'SLA & Priority Support',        free: false, pro: false, ent: true  },
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
              { q: 'Can I upgrade or downgrade anytime?', a: 'Yes — upgrade to Pro instantly and downgrade back to Free at any time. No lock-in.' },
              { q: 'Will my data be safe if I downgrade?', a: 'Yes. All your projects, tasks and history are kept even if you downgrade. You just lose access to Pro features.' },
              { q: 'Is the free plan really free forever?', a: 'Yes. The Community plan is our gift to the IT PM community — no expiry, no credit card, no bait-and-switch.' },
              { q: 'What payment methods are accepted?', a: 'Pro plan payments are handled securely. We accept all major credit and debit cards.' },
              { q: 'Do I need to add a credit card for the free plan?', a: 'No. Sign up with Google or email — no payment details required for the Community plan.' },
              { q: 'How does Enterprise pricing work?', a: 'Enterprise is custom-quoted based on team size and requirements. Contact us to discuss.' },
            ].map(faq => (
              <div key={faq.q} className="bg-surface2 rounded-xl p-4">
                <p className="font-syne font-bold text-sm mb-2">{faq.q}</p>
                <p className="text-xs text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Enterprise Interest Modal */}
      {showModal && (
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
