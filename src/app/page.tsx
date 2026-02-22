import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Glow orbs */}
      <div className="fixed w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 bg-accent -top-48 -left-48 pointer-events-none" />
      <div className="fixed w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 bg-accent2 -bottom-48 -right-48 pointer-events-none" />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-5 backdrop-blur-xl bg-bg/70 border-b border-border">
        <div className="font-syne font-black text-xl">Nex<span className="text-accent">Plan</span></div>
        <div className="hidden md:flex gap-8">
          {['Features','Pricing','Docs','About'].map(l => (
            <span key={l} className="text-muted text-sm cursor-pointer hover:text-text transition-colors">{l}</span>
          ))}
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
          <Link href="/login" className="btn-primary text-sm px-4 py-2">Get Started Free</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-44 pb-24">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent3/10 border border-accent3/30 rounded-full text-accent3 text-xs font-mono mb-6">
          ✦ 100% Free — No credit card required
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/8 border border-accent/25 rounded-full text-accent text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          🚀 AI-Powered Project Intelligence
        </div>
        <h1 className="font-syne font-black text-5xl md:text-7xl leading-[1.04] tracking-tight max-w-4xl mb-6">
          The <span className="text-accent glow-text">IT Project Manager</span><br/>Tool Built for Real Teams
        </h1>
        <p className="text-muted text-lg max-w-2xl leading-relaxed mb-12">
          Kanban workflows, AI-generated project plans, network diagrams, and a knowledge base —
          purpose-built for IT PMs, Engineers, Sponsors &amp; Stakeholders.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/login" className="btn-primary px-8 py-3 text-base">Start for Free →</Link>
          <Link href="/demo" className="btn-ghost px-8 py-3 text-base">View Demo</Link>
        </div>
      </div>

      {/* FEATURES */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <p className="font-mono-code text-accent text-xs tracking-widest uppercase mb-3">// Core Features</p>
        <h2 className="font-syne font-black text-4xl tracking-tight mb-12">
          Everything a PM needs,<br/>nothing they don't.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon:'📋', title:'Kanban Workflow', desc:'Visual drag-and-drop boards with custom columns, priority tags, assignees and due dates.', color:'bg-accent/10' },
            { icon:'🤖', title:'AI Plan Generator', desc:'Describe your project and AI generates a full plan with milestones, tasks and timelines.', color:'bg-accent2/10' },
            { icon:'🗺️', title:'Network Diagrams', desc:'Generate high-level network architecture diagrams automatically from project inputs.', color:'bg-accent3/10' },
            { icon:'📚', title:'Knowledge Base', desc:'Centralized docs hub for runbooks, SOPs, lessons learned and team wikis.', color:'bg-warn/10' },
            { icon:'📊', title:'Project Dashboard', desc:'Real-time KPIs, project health scores, budget tracking and resource utilization.', color:'bg-accent/10' },
            { icon:'🔐', title:'SSO Authentication', desc:'Sign in with Gmail, Microsoft Outlook, or Facebook. Email mandatory for access.', color:'bg-accent2/10' },
          ].map(f => (
            <div key={f.title} className="card hover:border-accent/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center text-2xl mb-4`}>{f.icon}</div>
              <h3 className="font-syne font-bold text-base mb-2">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ROLES */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <p className="font-mono-code text-accent text-xs tracking-widest uppercase mb-3">// Built for</p>
        <h2 className="font-syne font-black text-4xl tracking-tight mb-8">Every role in the project ecosystem</h2>
        <div className="flex gap-3 flex-wrap">
          {['🧑‍💼 IT Project Manager','🌐 Network Engineer','💰 Project Sponsor','👥 Stakeholder','🔧 DevOps Engineer','🧪 QA Lead'].map((r, i) => (
            <span key={r} className={`px-5 py-2.5 rounded-full border text-sm ${i < 4 ? 'border-accent/40 text-accent bg-accent/8' : 'border-border text-muted'}`}>{r}</span>
          ))}
        </div>
      </div>

      <footer className="relative z-10 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="font-syne font-black text-lg mb-2">Nex<span className="text-accent">Plan</span></div>
              <p className="text-muted text-sm leading-relaxed">Free AI-powered project management tool built for IT professionals worldwide.</p>
            </div>
            <div>
              <p className="font-syne font-bold text-sm mb-3">Product</p>
              <div className="space-y-2">
                <Link href="/demo" className="block text-muted text-sm hover:text-accent transition-colors">View Demo</Link>
                <Link href="/login" className="block text-muted text-sm hover:text-accent transition-colors">Sign Up Free</Link>
                <Link href="/login" className="block text-muted text-sm hover:text-accent transition-colors">Sign In</Link>
              </div>
            </div>
            <div>
              <p className="font-syne font-bold text-sm mb-3">Contact</p>
              <div className="space-y-2">
                <a href="mailto:info@nexplan.io" className="block text-muted text-sm hover:text-accent transition-colors">📧 info@nexplan.io</a>
                <p className="text-muted text-sm">🌐 www.nexplan.io</p>
                <p className="text-muted text-sm">Support via in-app feedback form</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-muted text-xs">© 2025 NexPlan · Free for IT professionals worldwide · Built with ❤️ for Project Managers</p>
            <p className="text-muted text-xs">Contact: <a href="mailto:info@nexplan.io" className="text-accent hover:underline">info@nexplan.io</a></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
