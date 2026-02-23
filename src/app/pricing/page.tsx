import Link from 'next/link'

export const metadata = {
  title: 'Pricing — NexPlan | Free for IT Professionals',
  description: 'NexPlan is completely free for all IT Project Managers and the PM community. No credit card required.',
}

export default function PricingPage() {
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

  const comingSoon = [
    'AI Project Manager — auto-generate full project from description',
    'Stakeholder auto-reports — one click executive summary',
    'Change Advisory Board (CAB) workflow',
    'Async voice notes on tasks',
    'Team collaboration & @mentions',
    'Network topology auto-generator',
    'ITIL-aligned incident management',
    'Custom project templates',
  ]

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Grid bg */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none"/>
      <div className="fixed w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 bg-accent -top-48 -left-48 pointer-events-none"/>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-5 backdrop-blur-xl bg-bg/70 border-b border-border">
        <Link href="/" className="font-syne font-black text-xl">Nex<span className="text-accent">Plan</span></Link>
        <div className="hidden md:flex gap-8">
          <Link href="/#features" className="text-muted text-sm hover:text-text transition-colors">Features</Link>
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
            ✦ Always Free — No hidden costs ever
          </div>
          <h1 className="font-syne font-black text-5xl md:text-6xl mb-6">
            Simple, <span className="text-accent">honest</span> pricing.
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            NexPlan is a <strong className="text-text">gift to the IT project management community</strong>. Every feature, forever free. No credit card. No trial. No catch.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Free plan */}
          <div className="card border-accent/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent2"/>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-2">Community Plan</p>
                <h2 className="font-syne font-black text-4xl">Free</h2>
                <p className="text-muted text-sm mt-1">Forever. For everyone.</p>
              </div>
              <span className="text-3xl">🎁</span>
            </div>
            <div className="space-y-3 mb-8">
              {freeFeatures.map(f => (
                <div key={f} className="flex items-start gap-3">
                  <span className="text-accent3 mt-0.5 shrink-0">✓</span>
                  <span className="text-sm text-muted">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/login" className="btn-primary w-full py-3 text-base justify-center block text-center">
              Start Free Now →
            </Link>
            <p className="text-xs text-muted text-center mt-3">No credit card · No account limits · No expiry</p>
          </div>

          {/* Enterprise — coming soon */}
          <div className="card border-border/50 relative overflow-hidden opacity-70">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-border to-border"/>
            <div className="absolute top-4 right-4">
              <span className="text-xs bg-warn/10 text-warn border border-warn/30 px-2 py-1 rounded-lg font-mono-code">Coming Soon</span>
            </div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="font-mono-code text-xs text-muted uppercase tracking-widest mb-2">Enterprise Plan</p>
                <h2 className="font-syne font-black text-4xl text-muted">TBD</h2>
                <p className="text-muted text-sm mt-1">For large organisations</p>
              </div>
              <span className="text-3xl">🏢</span>
            </div>
            <div className="space-y-3 mb-8">
              {[
                'Everything in Community plan',
                'Multi-team workspace',
                'SSO / Active Directory integration',
                'Advanced admin controls',
                'SLA & priority support',
                'Custom integrations',
                'Dedicated onboarding',
                'Usage analytics & audit logs',
              ].map(f => (
                <div key={f} className="flex items-start gap-3">
                  <span className="text-muted mt-0.5 shrink-0">○</span>
                  <span className="text-sm text-muted">{f}</span>
                </div>
              ))}
            </div>
            <button disabled className="w-full py-3 border border-border text-muted rounded-xl text-base font-semibold cursor-not-allowed">
              Contact Us — Coming Soon
            </button>
            <p className="text-xs text-muted text-center mt-3">Email us at info@nexplan.io to be notified</p>
          </div>
        </div>

        {/* Coming soon features */}
        <div className="card border-accent2/20 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🚀</span>
            <div>
              <h3 className="font-syne font-black text-xl">Coming Soon — Still Free</h3>
              <p className="text-muted text-sm">Features we're building next, all included in the free plan</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {comingSoon.map(f => (
              <div key={f} className="flex items-start gap-3 p-3 bg-surface2 rounded-xl">
                <span className="text-accent2 mt-0.5 shrink-0">⏳</span>
                <span className="text-sm text-muted">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why free */}
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="font-syne font-black text-3xl mb-4">Why is it free?</h3>
          <p className="text-muted leading-relaxed mb-4">
            NexPlan was built by an IT Project Manager, for IT Project Managers. Having spent years managing complex infrastructure projects with inadequate tools, our founder S. Ram created NexPlan as a <strong className="text-text">giveaway to the global PM community</strong>.
          </p>
          <p className="text-muted leading-relaxed">
            Every IT PM deserves access to professional-grade tools — regardless of company size, budget, or location. That's the NexPlan mission.
          </p>
          <div className="mt-8">
            <Link href="/about" className="btn-ghost px-6 py-3">Read our story →</Link>
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center py-8 text-muted text-sm border-t border-border">
        © 2025 NexPlan ·
        <a href="mailto:info@nexplan.io" className="text-accent hover:underline mx-2">info@nexplan.io</a> ·
        <Link href="/" className="hover:text-text mx-2">Home</Link>
      </footer>
    </div>
  )
}
