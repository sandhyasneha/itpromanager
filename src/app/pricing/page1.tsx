'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function PricingPage() {
  const [showModal, setShowModal] = useState<'enterprise' | 'ids' | null>(null)
  const [form, setForm] = useState({ name: '', email: '', company: '', size: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSubmit() {
    if (!form.name || !form.email) return
    setSending(true)
    try {
      await fetch('/api/send-task-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeEmail: 'info@nexplan.io',
          assigneeName: 'NexPlan Team',
          taskTitle: `Enterprise Interest: ${showModal === 'ids' ? 'AI/ML IDS' : 'Enterprise Plan'}`,
          taskDescription: `Name: ${form.name}\nCompany: ${form.company}\nSize: ${form.size}\nMessage: ${form.message}`,
          projectName: 'Enterprise Leads',
          priority: 'high',
          assignedBy: `${form.name} <${form.email}>`,
        }),
      })
      setSubmitted(true)
    } finally {
      setSending(false)
    }
  }
  const freeFeatures = [
    'Unlimited Kanban boards',
    'Unlimited projects & tasks',
    'AI Knowledge Base — unlimited searches',
    'AI article generation',
    'Upload scope document → AI project plan',
    'Project timeline & Gantt view',
    'Critical path analysis',
    'Task email notifications',
    'Network diagram builder',
    'Project Plan with progress tracking',
    'Google & email sign in',
    'In-app feedback & support',
  ]

  const comingSoonFree = [
    'AI Project Manager — auto-generate full project from description',
    'Stakeholder auto-reports — one click executive summary',
    'Change Advisory Board (CAB) workflow',
    'Async voice notes on tasks',
    'Team collaboration & @mentions',
    'Network topology auto-generator',
    'ITIL-aligned incident management',
    'Custom project templates',
  ]

  const enterpriseFeatures = [
    { icon: '🏢', title: 'Everything in Community', desc: 'All free features included' },
    { icon: '👥', title: 'Multi-team Workspace', desc: 'Manage multiple teams under one organisation' },
    { icon: '🔐', title: 'SSO / Active Directory', desc: 'Single sign-on and enterprise auth' },
    { icon: '⚙️', title: 'Advanced Admin Controls', desc: 'Role management, audit logs, usage analytics' },
    { icon: '🔗', title: 'Custom Integrations', desc: 'ServiceNow, Jira, Slack, Teams and more' },
    { icon: '🎯', title: 'Dedicated Onboarding', desc: 'White-glove setup and training' },
    { icon: '📞', title: 'SLA & Priority Support', desc: '24/7 enterprise support with guaranteed SLA' },
    { icon: '🗂️', title: 'Custom Project Templates', desc: 'Build and share templates across your organisation' },
  ]

  const idsFeatures = [
    { icon: '🧠', title: 'ML Anomaly Detection', desc: 'Machine learning identifies unusual network traffic patterns in real time — beyond signature-based detection' },
    { icon: '⚡', title: 'Real-Time Threat Alerts', desc: 'Instant notifications when threats are detected — port scans, DDoS attempts, data exfiltration patterns' },
    { icon: '📋', title: 'Auto Incident Creation', desc: 'Threats automatically create Kanban incidents with severity, assignee and SLA — no manual logging' },
    { icon: '📊', title: 'Live Traffic Dashboard', desc: 'Visual network traffic monitoring with ML confidence scores and geographic threat mapping' },
    { icon: '🔍', title: 'Behavioural Analysis', desc: 'LSTM time-series models learn your normal traffic baseline and flag deviations with precision' },
    { icon: '🛡️', title: 'Zero-Day Protection', desc: 'ML detects previously unknown threats that signature-based systems miss entirely' },
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
          <Link href="/kb" className="text-muted text-sm hover:text-text transition-colors">Knowledge Base</Link>
          <Link href="/pricing" className="text-accent text-sm font-semibold">Pricing</Link>
          <Link href="/docs" className="text-muted text-sm hover:text-text transition-colors">Docs</Link>
          <Link href="/about" className="text-muted text-sm hover:text-text transition-colors">About</Link>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
          <Link href="/login" className="btn-primary text-sm px-4 py-2">Get Started Free</Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-24">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent3/10 border border-accent3/30 rounded-full text-accent3 text-xs font-mono mb-6">
            ✦ Community plan always free · Enterprise coming soon
          </div>
          <h1 className="font-syne font-black text-5xl md:text-6xl mb-6">
            Simple, <span className="text-accent">honest</span> pricing.
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            NexPlan is a <strong className="text-text">gift to the IT project management community</strong>. Core features free forever. Enterprise plan launching soon with advanced AI security.
          </p>
        </div>

        {/* Pricing cards — 3 columns */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">

          {/* Free plan */}
          <div className="card border-accent/40 relative overflow-hidden md:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent2"/>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-2">Community</p>
                <h2 className="font-syne font-black text-4xl">Free</h2>
                <p className="text-muted text-sm mt-1">Forever. For everyone.</p>
              </div>
              <span className="text-3xl">🎁</span>
            </div>
            <div className="space-y-2.5 mb-8">
              {freeFeatures.map(f => (
                <div key={f} className="flex items-start gap-2.5">
                  <span className="text-accent3 mt-0.5 shrink-0 text-sm">✓</span>
                  <span className="text-xs text-muted">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/login" className="btn-primary w-full py-3 text-sm justify-center block text-center">
              Start Free Now →
            </Link>
            <p className="text-xs text-muted text-center mt-3">No credit card · No expiry</p>
          </div>

          {/* Enterprise */}
          <div className="card border-accent2/40 relative overflow-hidden md:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent2 to-purple-400"/>
            <div className="absolute top-4 right-4">
              <span className="text-xs bg-warn/10 text-warn border border-warn/30 px-2 py-1 rounded-lg font-mono-code">Coming Soon</span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono-code text-xs text-accent2 uppercase tracking-widest mb-2">Enterprise</p>
                <h2 className="font-syne font-black text-4xl text-accent2">TBD</h2>
                <p className="text-muted text-sm mt-1">For large organisations</p>
              </div>
              <span className="text-3xl">🏢</span>
            </div>
            <div className="space-y-2.5 mb-8">
              {enterpriseFeatures.map(f => (
                <div key={f.title} className="flex items-start gap-2.5">
                  <span className="text-accent2 mt-0.5 shrink-0 text-sm">{f.icon}</span>
                  <div>
                    <span className="text-xs text-text font-semibold">{f.title}</span>
                    <p className="text-xs text-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal('enterprise')}
              className="w-full py-3 border border-accent2/50 text-accent2 rounded-xl text-sm font-semibold hover:bg-accent2/10 transition-colors block text-center">
              Express Interest →
            </button>
            <p className="text-xs text-muted text-center mt-3">We will notify you on launch</p>
          </div>

          {/* Enterprise Security — IDS */}
          <div className="card relative overflow-hidden border-danger/30 md:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-danger to-warn"/>
            <div className="absolute top-4 right-4">
              <span className="text-xs bg-danger/10 text-danger border border-danger/30 px-2 py-1 rounded-lg font-mono-code">🔒 Enterprise</span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono-code text-xs text-danger uppercase tracking-widest mb-2">Security AI</p>
                <h2 className="font-syne font-black text-3xl text-danger">AI/ML IDS</h2>
                <p className="text-muted text-sm mt-1">Intrusion Detection System</p>
              </div>
              <span className="text-3xl">🛡️</span>
            </div>
            <p className="text-xs text-muted mb-4 leading-relaxed">
              Enterprise-grade AI/ML Intrusion Detection — monitors your network 24/7 and auto-creates security incidents in NexPlan.
            </p>
            <div className="space-y-2.5 mb-8">
              {idsFeatures.map(f => (
                <div key={f.title} className="flex items-start gap-2.5">
                  <span className="shrink-0 text-sm mt-0.5">{f.icon}</span>
                  <div>
                    <span className="text-xs text-text font-semibold">{f.title}</span>
                    <p className="text-xs text-muted leading-snug">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal('ids')}
              className="w-full py-3 border border-danger/50 text-danger rounded-xl text-sm font-semibold hover:bg-danger/10 transition-colors block text-center">
              Register Interest →
            </button>
            <p className="text-xs text-muted text-center mt-3">Early access for enterprise teams</p>
          </div>
        </div>

        {/* IDS Deep Dive Banner */}
        <div className="relative card border-danger/20 overflow-hidden mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-danger/5 to-warn/5 pointer-events-none"/>
          <div className="relative flex items-start gap-6 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🧠</span>
                <div>
                  <p className="font-mono-code text-xs text-danger uppercase tracking-widest">Coming — Enterprise</p>
                  <h3 className="font-syne font-black text-2xl">AI/ML Intrusion Detection System</h3>
                </div>
              </div>
              <p className="text-muted leading-relaxed mb-4">
                Most IDS tools rely on <strong className="text-text">signature databases</strong> — they only catch known threats. NexPlan Enterprise uses <strong className="text-text">machine learning models</strong> trained on real network traffic to detect anomalies that signatures miss entirely, including zero-day attacks.
              </p>
              <p className="text-muted leading-relaxed">
                When a threat is detected, NexPlan automatically creates a <strong className="text-text">security incident on your Kanban board</strong>, assigns it to your security engineer, sets severity and SLA — so your team responds immediately without manual logging.
              </p>
            </div>
            <div className="w-full md:w-72 shrink-0">
              <div className="bg-surface2 rounded-xl p-4 border border-border font-mono-code text-xs space-y-2">
                <p className="text-danger font-bold">🚨 THREAT DETECTED</p>
                <p className="text-muted">Type: <span className="text-warn">Port Scan</span></p>
                <p className="text-muted">Source: <span className="text-text">192.168.1.45</span></p>
                <p className="text-muted">Confidence: <span className="text-accent3">94%</span></p>
                <p className="text-muted">Severity: <span className="text-danger">CRITICAL</span></p>
                <div className="border-t border-border pt-2 mt-2">
                  <p className="text-accent3">✓ Incident auto-created</p>
                  <p className="text-accent3">✓ Engineer notified</p>
                  <p className="text-accent3">✓ SLA timer started</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Free features */}
        <div className="card border-accent2/20 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🚀</span>
            <div>
              <h3 className="font-syne font-black text-xl">Coming Soon — Still Free</h3>
              <p className="text-muted text-sm">Features we are building next, all included in the free community plan</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {comingSoonFree.map(f => (
              <div key={f} className="flex items-start gap-3 p-3 bg-surface2 rounded-xl">
                <span className="text-accent2 mt-0.5 shrink-0">⏳</span>
                <span className="text-sm text-muted">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why free */}
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="font-syne font-black text-3xl mb-4">Why is the core free?</h3>
          <p className="text-muted leading-relaxed mb-4">
            NexPlan was built by an IT Project Manager, for IT Project Managers. Having spent years managing complex infrastructure projects with inadequate tools, our founder S. Ram created NexPlan as a <strong className="text-text">giveaway to the global PM community</strong>.
          </p>
          <p className="text-muted leading-relaxed">
            Every IT PM deserves access to professional-grade tools — regardless of company size, budget, or location. Enterprise features fund the free community plan forever.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/about" className="btn-ghost px-6 py-3">Read our story →</Link>
            <button onClick={() => setShowModal('enterprise')} className="btn-ghost px-6 py-3">Contact Enterprise →</button>
          </div>
        </div>
      </div>

      {/* Interest Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setShowModal(null); setSubmitted(false); setForm({ name: '', email: '', company: '', size: '', message: '' }) }}>
          <div className="card w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-syne font-black text-2xl mb-2">Thank you!</h3>
                <p className="text-muted mb-6">We have received your interest. Our team will be in touch within 1-2 business days.</p>
                <button onClick={() => { setShowModal(null); setSubmitted(false) }} className="btn-primary px-6 py-2">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-1">
                      {showModal === 'ids' ? '🛡️ AI/ML IDS' : '🏢 Enterprise Plan'}
                    </p>
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
                      <option>1-50 employees</option>
                      <option>51-200 employees</option>
                      <option>201-1000 employees</option>
                      <option>1000+ employees</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Tell us about your needs</label>
                    <textarea className="input text-sm resize-none h-20"
                      placeholder={showModal === 'ids' ? 'How many devices on your network? Current security tools?' : 'How many team members? Current PM tools?'}
                      value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}/>
                  </div>
                </div>
                <button onClick={handleSubmit} disabled={!form.name || !form.email || sending}
                  className="btn-primary w-full py-3 mt-5 disabled:opacity-50">
                  {sending ? 'Sending...' : 'Submit Interest →'}
                </button>
                <p className="text-xs text-muted text-center mt-3">We will respond within 1-2 business days</p>
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
