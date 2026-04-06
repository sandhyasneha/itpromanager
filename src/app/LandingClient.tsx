'use client'
import NexPlanLogo from '@/components/NexPlanLogo'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const FEATURES = [
  {
    id: 'kanban', icon: '📋', title: 'Kanban Board', subtitle: 'Drag & Drop Workflow',
    color: '#00d4ff',
    desc: 'Visual task management with Backlog → In Progress → Review → Done. Drag tasks, set priorities, assign team members and track due dates in real time.',
    bullets: ['Drag & drop task movement','Priority levels: Low → Critical','Assignee & due date tracking','Real-time status updates'],
  },
  {
    id: 'ai_pm', icon: '🤖', title: 'AI Project Manager', subtitle: 'Describe → Generate → Deploy',
    color: '#7c3aed',
    desc: 'Describe your IT project in plain English. AI generates a complete task breakdown with dates, priorities and assignees — instantly populating your Kanban board.',
    bullets: ['Describe project in plain English','AI generates 6-12 IT-specific tasks','Auto-sets start/end dates','One-click board population'],
  },
  {
    id: 'gantt', icon: '📅', title: 'Gantt Timeline', subtitle: 'Visual Project Timeline',
    color: '#22d3a5',
    desc: 'Interactive Gantt chart with daily columns, coloured progress bars, critical path analysis and weekend highlighting. See your entire project at a glance.',
    bullets: ['Daily column Gantt chart','Colour-coded by status','Critical path in red','Progress % per task'],
  },
  {
    id: 'pcr', icon: '🔀', title: 'PCR Workflow', subtitle: 'Project Change Requests',
    color: '#f59e0b',
    desc: 'Professional Project Change Request workflow with AI document generation, sponsor approval tracking and automatic project date updates.',
    bullets: ['AI generates PCR document','Sponsor approval workflow','Auto-updates project dates','Change history tracking'],
  },
  {
    id: 'risk', icon: '🛡️', title: 'Risk & Issue Register', subtitle: 'RAG Status Management',
    color: '#ef4444',
    desc: 'Professional risk and issue register with RAG status, probability/impact matrix and AI-suggested mitigations. Separate registers for risks and issues.',
    bullets: ['🔴🟡🟢 RAG status tracking','Probability × Impact matrix','✨ AI mitigation suggestions','Separate Risk & Issue tabs'],
  },
  {
    id: 'report', icon: '📊', title: 'AI Status Reports', subtitle: 'One-Click Stakeholder Updates',
    color: '#7c3aed',
    desc: 'Generate professional weekly/fortnightly/monthly status reports. AI analyses your tasks and risks, creates a polished report and emails all stakeholders.',
    bullets: ['Weekly / Fortnightly / Monthly','RAG status + executive summary','Auto-email to stakeholders','Full report history'],
  },
  {
    id: 'notifications', icon: '🔔', title: 'Smart Notifications', subtitle: 'Never Miss a Deadline',
    color: '#22d3a5',
    desc: 'Automated email alerts keep your team on track. Due date reminders, morning daily digest and instant overdue alerts — configured per project.',
    bullets: ['⏰ Due date reminders (1-3 days)','🌅 Morning daily digest','🚨 Instant overdue alerts','Per-project configuration'],
  },
  {
    id: 'kb', icon: '📚', title: 'IT Knowledge Base', subtitle: '42 Professional IT Guides',
    color: '#00d4ff',
    desc: '42 professional IT guides covering Cisco, Azure, AWS, VMware and more. Searchable, categorised and free for all users.',
    bullets: ['42 expert IT guides','Cisco, Azure, AWS, VMware','Network & Security runbooks','Free for all users'],
  },
  {
    id: 'stakeholder', icon: '🤝', title: 'Stakeholder Analysis', subtitle: 'Know Your Audience',
    color: '#f59e0b',
    desc: 'Map and manage every stakeholder in your project. Capture influence, interest and communication preferences so no one falls through the cracks.',
    bullets: ['Influence & interest mapping','Communication plan per stakeholder','Engagement status tracking','AI-suggested actions'],
  },
  {
    id: 'change_freeze', icon: '🧊', title: 'Change Freeze', subtitle: 'Lock Down Critical Periods',
    color: '#ef4444',
    desc: 'Define change freeze windows to protect critical go-live and BAU periods. Block unapproved changes and alert the team automatically.',
    bullets: ['Set freeze start & end dates','Block task & PCR changes','Auto-alert on freeze breach','Full freeze history log'],
  },
  {
    id: 'budget', icon: '💰', title: 'Budget Tracker', subtitle: 'Stay On Top of Project Spend',
    color: '#22d3a5',
    desc: 'Track project budget vs actual spend in real time. Log costs against tasks, monitor burn rate and get early warnings when you are heading over budget.',
    bullets: ['Budget vs actual dashboard','Cost logging per task','Burn rate tracking','Over-budget early warnings'],
  },
]

const STEPS = [
  { num: '01', icon: '🆕', title: 'Create Project', desc: 'Name your project, set dates and describe it for AI.' },
  { num: '02', icon: '🤖', title: 'AI Generates Plan', desc: 'Tasks, priorities and dates auto-created instantly.' },
  { num: '03', icon: '📋', title: 'Manage Board', desc: 'Drag tasks through Kanban columns as work progresses.' },
  { num: '04', icon: '🛡️', title: 'Track Risks', desc: 'Log risks and issues with RAG status and AI mitigations.' },
  { num: '05', icon: '📊', title: 'Report & Alert', desc: 'One click generates and emails a professional status report.' },
  { num: '06', icon: '🤝', title: 'Stakeholder Analysis', desc: 'Go to Reports in the left menu → Stakeholder Digest tab. View influence map, send digests and manage engagement — Portfolio Manager role required.' },
  { num: '07', icon: '🧊', title: 'Change Freeze', desc: 'Go to Settings in the left pane → Change Freeze Calendar. Define freeze windows — tasks in these periods are flagged on the Gantt. Portfolio Manager role required.' },
  { num: '08', icon: '💰', title: 'Budget Tracker', desc: 'Open project → ✏️ Edit Project → Budget tab. Set currency, total budget and contingency %. Save — the 💰 Budget button appears in the toolbar. Portfolio Manager role required.' },
]

export default function LandingClient() {
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)

  function go(idx: number) {
    if (idx === active) return
    setFading(true)
    setTimeout(() => { setActive(idx); setFading(false) }, 150)
  }

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true)
      setTimeout(() => { setActive(p => (p + 1) % FEATURES.length); setFading(false) }, 150)
    }, 4500)
    return () => clearInterval(t)
  }, [])

  const feat = FEATURES[active]

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="fixed w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 bg-accent -top-48 -left-48 pointer-events-none" />
      <div className="fixed w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 bg-accent2 -bottom-48 -right-48 pointer-events-none" />

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 md:px-12 py-5 backdrop-blur-xl bg-bg/70 border-b border-border">
        <NexPlanLogo size="sm" dark />
        <div className="hidden md:flex gap-8">
          {[['#features','Features'],['#how-it-works','How It Works'],['/kb','Knowledge Base'],['/pricing','Pricing'],['/about','About']].map(([h,l]) =>
            h.startsWith('#')
              ? <a key={l} href={h} className="text-text/80 text-sm hover:text-white transition-colors font-medium">{l}</a>
              : <Link key={l} href={h} className="text-text/80 text-sm hover:text-white transition-colors font-medium">{l}</Link>
          )}
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
          <Link href="/login" className="btn-primary text-sm px-4 py-2">Get Started Free</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-44 pb-20">
        {/* Product Hunt Badge */}
        <a href="https://www.producthunt.com/posts/nexplan" target="_blank" rel="noopener noreferrer" className="mb-6 hover:opacity-90 transition-opacity">
          <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=nexplan&theme=dark"
            alt="NexPlan on Product Hunt"
            style={{ height: 54, width: 234 }} />
        </a>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent3/10 border border-accent3/30 rounded-full text-accent3 text-xs font-mono mb-5">
          ✦ 100% Free — No credit card required
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/8 border border-accent/25 rounded-full text-accent text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          🤖 AI-Powered IT Project Management — All Features Live
        </div>
        <h1 className="font-syne font-black text-5xl md:text-7xl leading-[1.04] tracking-tight max-w-5xl mb-6">
          The <span className="text-accent glow-text">IT Project Manager</span><br/>Built for Real Engineers
        </h1>
        <p className="text-muted text-lg max-w-2xl leading-relaxed mb-6">
          AI project generation, Gantt charts, risk registers, PCR workflows, status reports and smart notifications —
          purpose-built for IT PMs managing real infrastructure projects.
        </p>
        <div className="flex flex-wrap gap-2.5 justify-center text-xs font-mono text-muted mb-10">
          {['🤖 AI Plan Generator','📅 Gantt Timeline','🛡️ Risk Register','📊 Status Reports','🔀 PCR Workflow','🔔 Smart Alerts','📚 42 IT Guides','📎 Attachments'].map(t => (
            <span key={t} className="px-3 py-1.5 bg-surface2 border border-border rounded-full">{t}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/login" className="btn-primary px-8 py-3 text-base">Start for Free →</Link>
          <a href="#features" className="btn-ghost px-8 py-3 text-base">See All Features</a>
        </div>
      </div>

      {/* STATS */}
      <div className="relative z-10 border-y border-border bg-surface/50 backdrop-blur-sm py-6 mb-20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['11+','Core Features'],['42','IT Knowledge Guides'],['100%','Free Forever'],['AI','Powered Intelligence']].map(([v,l]) => (
            <div key={l}>
              <p className="font-syne font-black text-3xl text-accent">{v}</p>
              <p className="text-muted text-sm mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE SHOWCASE */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <p className="font-mono-code text-accent text-xs tracking-widest uppercase mb-3">// Feature Showcase</p>
          <h2 className="font-syne font-black text-4xl md:text-5xl tracking-tight mb-4">Everything you need.<br/>Nothing you don't.</h2>
          <p className="text-muted max-w-xl mx-auto">Built by an IT PM who managed real migrations. Every feature solves a real problem.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Feature selector */}
          <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-2">
            {FEATURES.map((f, i) => (
              <button key={f.id} onClick={() => go(i)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
                  ${active === i ? 'shadow-lg' : 'border-border bg-surface hover:bg-surface2'}`}
                style={active === i ? { borderColor: f.color + '50', background: f.color + '10' } : {}}>
                <span className="text-xl shrink-0">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-syne font-bold text-xs ${active === i ? 'text-text' : 'text-text/60'}`}>{f.title}</p>
                  <p className="text-[10px] text-muted truncate hidden lg:block">{f.subtitle}</p>
                </div>
                {active === i && <span className="w-1 h-5 rounded-full shrink-0" style={{ background: f.color }}/>}
              </button>
            ))}
          </div>

          {/* Feature detail */}
          <div className={`lg:col-span-3 sticky top-24 transition-all duration-150 ${fading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
            <div className="card overflow-hidden" style={{ borderColor: feat.color + '40' }}>
              <div className="p-6" style={{ background: feat.color + '08' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{feat.icon}</span>
                  <div>
                    <p className="font-syne font-black text-2xl">{feat.title}</p>
                    <p className="text-xs font-mono-code" style={{ color: feat.color }}>{feat.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-text/75 leading-relaxed">{feat.desc}</p>
              </div>

              {/* Visual demo area */}
              <div className="p-6 bg-surface2/40 border-y border-border">
                <div className="grid grid-cols-2 gap-3">
                  {feat.bullets.map(b => (
                    <div key={b} className="flex items-center gap-2.5 bg-surface rounded-xl px-3 py-2.5">
                      <span className="text-sm shrink-0" style={{ color: feat.color }}>✓</span>
                      <span className="text-xs text-text/80 font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {FEATURES.map((_, i) => (
                    <button key={i} onClick={() => go(i)}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === active ? 20 : 8, height: 8,
                        background: i === active ? feat.color : '#30363d'
                      }}/>
                  ))}
                </div>
                <Link href="/login" className="btn-primary text-xs px-4 py-2">Try It Free →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how-it-works" className="relative z-10 border-t border-border py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="font-mono-code text-accent text-xs tracking-widest uppercase mb-3">// How It Works</p>
            <h2 className="font-syne font-black text-4xl tracking-tight mb-4">From zero to running project<br/>in under 5 minutes</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                <div className="card p-5 h-full hover:-translate-y-1 transition-transform duration-300 text-center">
                  <div className="text-3xl mb-3">{step.icon}</div>
                  <p className="font-mono-code text-xs text-muted mb-2">{step.num}</p>
                  <p className="font-syne font-bold text-sm mb-2">{step.title}</p>
                  <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute top-8 -right-3 z-10 text-border text-xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHO IT'S FOR */}
      <div className="relative z-10 border-t border-border py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="font-mono-code text-accent text-xs tracking-widest uppercase mb-3">// Built For</p>
            <h2 className="font-syne font-black text-4xl tracking-tight">Every role in the IT ecosystem</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon:'🧑‍💼', role:'IT Project Manager', desc:'End-to-end project lifecycle management with AI assistance', color:'text-accent', bg:'bg-accent/5 border-accent/20' },
              { icon:'🌐', role:'Network Engineer', desc:'Task tracking for migrations, upgrades and configurations', color:'text-accent3', bg:'bg-accent3/5 border-accent3/20' },
              { icon:'💰', role:'Project Sponsor', desc:'Clean status reports and PCR approvals in your inbox', color:'text-warn', bg:'bg-warn/5 border-warn/20' },
              { icon:'👥', role:'Stakeholder', desc:'Regular updates without chasing the PM', color:'text-accent2', bg:'bg-accent2/5 border-accent2/20' },
              { icon:'🔧', role:'DevOps Engineer', desc:'Deployment tracking with risk and issue register', color:'text-accent', bg:'bg-accent/5 border-accent/20' },
              { icon:'🧪', role:'QA Lead', desc:'Test task management with due date alerts', color:'text-accent3', bg:'bg-accent3/5 border-accent3/20' },
            ].map(r => (
              <div key={r.role} className={`card p-5 border ${r.bg} hover:-translate-y-1 transition-transform duration-300`}>
                <span className="text-3xl mb-3 block">{r.icon}</span>
                <p className={`font-syne font-bold text-sm mb-1.5 ${r.color}`}>{r.role}</p>
                <p className="text-xs text-muted leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY NEXPLAN */}
      <div className="relative z-10 border-t border-border py-24 bg-surface/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-mono-code text-accent text-xs tracking-widest uppercase mb-3">// Why NexPlan</p>
              <h2 className="font-syne font-black text-4xl tracking-tight mb-6">Built by an IT PM.<br/>For IT PMs.</h2>
              <p className="text-muted leading-relaxed mb-8">Most tools are built for software developers. NexPlan was built by someone who managed OSPF to BGP migrations, configured Palo Alto firewalls and ran data centre builds. Every feature solves a real IT PM pain point.</p>
              <div className="space-y-5">
                {[
                  { icon:'🤖', title:'AI that understands IT', desc:'Generates tasks specific to network migrations, data centre builds and infrastructure — not generic software sprints.' },
                  { icon:'🔀', title:'PCR workflow', desc:'Project Change Request management with AI documents and sponsor approval — missing from every other PM tool.' },
                  { icon:'📚', title:'Free IT Knowledge Base', desc:'42 professional IT guides covering Cisco, Azure, VMware. Your operations platform, not just a task tracker.' },
                ].map(d => (
                  <div key={d.title} className="flex items-start gap-4">
                    <span className="text-2xl mt-0.5">{d.icon}</span>
                    <div>
                      <p className="font-semibold text-sm mb-1">{d.title}</p>
                      <p className="text-xs text-muted leading-relaxed">{d.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label:'Generic PM Tool', items:['✗ Software-focused tasks','✗ No PCR workflow','✗ No IT knowledge base','✗ No IT-specific AI','✗ Expensive plans'], bad:true },
                { label:'NexPlan', items:['✓ IT-specific AI generation','✓ PCR with AI documents','✓ 42 IT guides included','✓ Understands IT projects','✓ 100% free forever'], bad:false },
              ].map(c => (
                <div key={c.label} className={`card p-5 ${c.bad ? 'opacity-50' : 'border-accent/30 bg-accent/5'}`}>
                  <p className={`font-syne font-bold text-sm mb-3 ${c.bad ? 'text-muted' : 'text-accent'}`}>{c.label}</p>
                  <div className="space-y-1.5">
                    {c.items.map(item => <p key={item} className={`text-xs ${c.bad ? 'text-muted' : 'text-text/80'}`}>{item}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 border-t border-border py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-mono-code text-accent text-xs tracking-widest uppercase mb-4">// Get Started Today</p>
          <h2 className="font-syne font-black text-5xl tracking-tight mb-5">
            Ready to manage IT projects<br/>the <span className="text-accent glow-text">right way?</span>
          </h2>
          <p className="text-muted text-lg mb-10">Free forever. No credit card. No limits. Built for IT professionals worldwide.</p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link href="/login" className="btn-primary px-10 py-4 text-lg">Create Free Account →</Link>
            <Link href="/kb" className="btn-ghost px-10 py-4 text-lg">Browse Knowledge Base</Link>
          </div>
          <p className="text-muted text-xs">Join IT professionals already using NexPlan · info@nexplan.io</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <NexPlanLogo size="sm" dark showTagline />
              <p className="text-muted text-sm leading-relaxed">Free AI-powered IT project management. Built for network engineers, IT PMs and infrastructure teams worldwide.</p>
            </div>
            <div>
              <p className="font-syne font-bold text-sm mb-3">Product</p>
              <div className="space-y-2">
                <a href="#features" className="block text-muted text-sm hover:text-accent transition-colors">Features</a>
                <Link href="/pricing" className="block text-muted text-sm hover:text-accent transition-colors">Pricing</Link>
                <Link href="/login" className="block text-muted text-sm hover:text-accent transition-colors">Sign Up Free</Link>
              </div>
            </div>
            <div>
              <p className="font-syne font-bold text-sm mb-3">Resources</p>
              <div className="space-y-2">
                <Link href="/kb" className="block text-muted text-sm hover:text-accent transition-colors">Knowledge Base</Link>
                <Link href="/help" className="block text-muted text-sm hover:text-accent transition-colors">Help Center</Link>
                <Link href="/about" className="block text-muted text-sm hover:text-accent transition-colors">About</Link>
              </div>
            </div>
            <div>
              <p className="font-syne font-bold text-sm mb-3">Contact</p>
              <div className="space-y-2">
                <a href="mailto:info@nexplan.io" className="block text-muted text-sm hover:text-accent transition-colors">📧 info@nexplan.io</a>
                <p className="text-muted text-sm">🌐 nexplan.io</p>
                <a href="https://x.com/NexplanIT" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted text-sm hover:text-accent transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  @NexplanIT
                </a>
                <a href="https://www.youtube.com/@Nexplan-PM" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted text-sm hover:text-[#0A66C2] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
                <a href="https://www.reddit.com/user/OkConsequence5906/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted text-sm hover:text-[#FF4500] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                  Reddit
                </a>
                <a href="https://www.youtube.com/@Nexplan-PM" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted text-sm hover:text-[#FF0000] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube
                </a>
              </div>

          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-muted text-xs">© 2026 NexPlan · Free for IT professionals worldwide · Built with ❤️ for Project Managers</p>
            <div className="flex items-center gap-4">
              <a href="https://x.com/NexplanIT" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent transition-colors" title="X / Twitter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.youtube.com/@Nexplan-PM" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-[#0A66C2] transition-colors" title="LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://www.youtube.com/@Nexplan-PM" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-[#FF0000] transition-colors" title="YouTube">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://www.reddit.com/user/OkConsequence5906/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-[#FF4500] transition-colors" title="Reddit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
              </a>
              <a href="https://www.producthunt.com/posts/nexplan" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-[#FF6154] transition-colors" title="Product Hunt">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.604 8.4h-3.405V12h3.405c.993 0 1.8-.807 1.8-1.8 0-.993-.807-1.8-1.8-1.8zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.604 14.4h-3.405V18H7.8V6h5.804c2.319 0 4.2 1.881 4.2 4.2 0 2.319-1.881 4.2-4.2 4.2z"/></svg>
              </a>

{/* Product Hunt Link */}
              <a 
                href="https://www.producthunt.com/posts/nexplan" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted hover:text-[#FF6154] transition-colors" 
                title="Product Hunt"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.604 8.4h-3.405V12h3.405c.993 0 1.8-.807 1.8-1.8 0-.993-.807-1.8-1.8-1.8zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.604 14.4h-3.405V18H7.8V6h5.804c2.319 0 4.2 1.881 4.2 4.2 0 2.319-1.881 4.2-4.2 4.2z"/></svg>
              </a>

              {/* YouTube Link */}
              <a 
                href="https://www.youtube.com/@Nexplan-PM4" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted hover:text-[#FF0000] transition-colors ml-3" 
                title="YouTube"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>

              {/* Email Link */}
              <a href="mailto:info@nexplan.io" className="text-muted text-xs hover:text-accent transition-colors ml-4">
                info@nexplan.io
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
