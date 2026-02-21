'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const DEMO_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to NexPlan',
    subtitle: 'AI-Powered IT Project Management',
    description: 'Watch how NexPlan helps IT teams manage projects, tasks, and documentation — all in one place.',
    duration: 3000,
    screen: 'landing',
  },
  {
    id: 'dashboard',
    title: 'Your Project Dashboard',
    subtitle: 'Everything at a glance',
    description: 'Sign in and instantly see all your projects, tasks, team members and risks on one dashboard.',
    duration: 3500,
    screen: 'dashboard',
  },
  {
    id: 'create-project',
    title: 'Create a Project',
    subtitle: 'Step 1 — New Project',
    description: 'Click "+ New Project" and give it a name. NexPlan creates your Kanban board instantly.',
    duration: 3500,
    screen: 'create-project',
  },
  {
    id: 'kanban',
    title: 'Kanban Board',
    subtitle: 'Visual task management',
    description: 'Add tasks to your board. Drag and drop them across Backlog → In Progress → Review → Done.',
    duration: 4000,
    screen: 'kanban',
  },
  {
    id: 'drag',
    title: 'Drag & Drop Tasks',
    subtitle: 'Instant status updates',
    description: 'Drag "Configure BGP Router" from Backlog to In Progress. The status updates in real time.',
    duration: 4000,
    screen: 'drag',
  },
  {
    id: 'project-plan',
    title: 'Project Plan',
    subtitle: 'Gantt-style tracking',
    description: 'Switch to Project Plan view for a full task table with priorities, assignees, due dates and progress.',
    duration: 3500,
    screen: 'project-plan',
  },
  {
    id: 'knowledge-search',
    title: 'Knowledge Base Search',
    subtitle: 'Instant IT documentation',
    description: 'Search "OSPF to BGP migration" — NexPlan finds articles instantly or generates one with AI.',
    duration: 4000,
    screen: 'knowledge-search',
  },
  {
    id: 'ai-generate',
    title: 'AI Article Generation',
    subtitle: 'Powered by Claude AI',
    description: 'No article found? AI generates a full professional guide in seconds and saves it to your KB forever.',
    duration: 4500,
    screen: 'ai-generate',
  },
  {
    id: 'scope',
    title: 'AI Project Plan from Scope',
    subtitle: 'Upload any scope document',
    description: 'Upload your project scope document. AI reads it and generates a complete project plan with phases, steps and risks.',
    duration: 4000,
    screen: 'scope',
  },
  {
    id: 'cta',
    title: 'Ready to get started?',
    subtitle: '100% Free — No credit card required',
    description: 'Join IT teams worldwide using NexPlan to deliver projects on time.',
    duration: 99999,
    screen: 'cta',
  },
]

// Simulated screen components
function DashboardScreen({ animate }: { animate: boolean }) {
  const stats = [
    { label: 'Total Projects', value: 3, color: 'border-cyan-400/40' },
    { label: 'Tasks Completed', value: 12, color: 'border-emerald-400/40' },
    { label: 'Team Members', value: 5, color: 'border-purple-400/40' },
    { label: 'At Risk', value: 1, color: 'border-amber-400/40' },
  ]
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-lg">Dashboard</h2>
        <span className="text-xs text-cyan-400 font-mono">● Live</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div key={s.label} className={`bg-gray-800 border ${s.color} rounded-xl p-4 transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${i * 100}ms` }}>
            <p className="text-xs text-gray-400 mb-2">{s.label}</p>
            <p className="font-black text-3xl">{s.value}</p>
          </div>
        ))}
      </div>
      <div className={`bg-gray-800 border border-gray-700 rounded-xl p-4 transition-all duration-500 delay-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
        <p className="font-bold mb-3 text-sm">Recent Projects</p>
        {['SDWAN Rollout SG', 'Office Move Q2', 'Server Migration'].map((p, i) => (
          <div key={p} className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-0">
            <div className="w-2 h-2 rounded-full bg-cyan-400"/>
            <span className="text-sm flex-1">{p}</span>
            <div className="w-16 h-1.5 bg-gray-700 rounded-full">
              <div className="h-full rounded-full bg-cyan-400" style={{ width: `${[65, 40, 80][i]}%` }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CreateProjectScreen({ animate }: { animate: boolean }) {
  const [typed, setTyped] = useState('')
  const target = 'OSPF to BGP Migration'
  useEffect(() => {
    if (!animate) return
    let i = 0
    const t = setInterval(() => {
      if (i <= target.length) { setTyped(target.slice(0, i)); i++ }
      else clearInterval(t)
    }, 80)
    return () => clearInterval(t)
  }, [animate])
  return (
    <div className="p-6 space-y-4">
      <h2 className="font-bold text-lg mb-4">Create New Project</h2>
      <div className={`bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4 transition-all duration-500 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Project Name</label>
          <div className="bg-gray-900 border border-cyan-400/50 rounded-lg px-4 py-3 text-sm font-mono">
            {typed}<span className="animate-pulse text-cyan-400">|</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Start Date</label>
            <div className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-xs text-gray-400">01/03/2025</div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">End Date</label>
            <div className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-xs text-gray-400">30/06/2025</div>
          </div>
        </div>
        <div className="flex gap-2">
          {['#00d4ff','#7c3aed','#10b981','#f59e0b'].map(c => (
            <div key={c} className={`w-7 h-7 rounded-full border-2 ${c === '#00d4ff' ? 'border-white' : 'border-transparent'}`} style={{ background: c }}/>
          ))}
        </div>
        <div className={`w-full py-3 rounded-xl bg-cyan-400 text-black font-bold text-sm text-center transition-all duration-300 delay-1000 ${animate ? 'opacity-100' : 'opacity-0'}`}>
          Create Project →
        </div>
      </div>
    </div>
  )
}

function KanbanScreen({ animate }: { animate: boolean }) {
  const cols = [
    { title: 'Backlog', color: 'text-gray-400', border: 'border-gray-600', tasks: ['Scope review','Vendor selection','Risk assessment'] },
    { title: 'In Progress', color: 'text-cyan-400', border: 'border-cyan-400/30', tasks: ['Configure BGP Router','Update IP schema'] },
    { title: 'Review', color: 'text-amber-400', border: 'border-amber-400/30', tasks: ['Test failover'] },
    { title: 'Done', color: 'text-emerald-400', border: 'border-emerald-400/30', tasks: ['Project kickoff','Topology design'] },
  ]
  return (
    <div className="p-4">
      <h2 className="font-bold text-lg mb-4">Kanban Board — OSPF to BGP Migration</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {cols.map((col, ci) => (
          <div key={col.title} className={`flex-shrink-0 w-44 bg-gray-800 border ${col.border} rounded-xl p-3 transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: `${ci * 150}ms` }}>
            <p className={`font-bold text-xs mb-3 ${col.color}`}>{col.title} <span className="text-gray-500">({col.tasks.length})</span></p>
            {col.tasks.map((task, ti) => (
              <div key={task} className={`bg-gray-900 border border-gray-700 rounded-lg p-2.5 mb-2 text-xs transition-all duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: `${ci * 150 + ti * 100 + 300}ms` }}>
                <p className="font-semibold mb-1.5">{task}</p>
                <span className="bg-cyan-400/10 text-cyan-400 px-1.5 py-0.5 rounded text-[10px]">medium</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function DragScreen({ animate }: { animate: boolean }) {
  const [pos, setPos] = useState(0)
  useEffect(() => {
    if (!animate) { setPos(0); return }
    const t = setTimeout(() => setPos(1), 1000)
    return () => clearTimeout(t)
  }, [animate])
  return (
    <div className="p-4">
      <h2 className="font-bold text-lg mb-2">Drag & Drop Tasks</h2>
      <p className="text-gray-400 text-xs mb-4">Moving "Configure BGP Router" → In Progress</p>
      <div className="flex gap-3">
        <div className={`flex-1 bg-gray-800 border rounded-xl p-3 transition-all ${pos === 0 ? 'border-cyan-400/50' : 'border-gray-600'}`}>
          <p className="text-xs text-gray-400 font-bold mb-2">BACKLOG</p>
          {pos === 0 && (
            <div className="bg-cyan-400/10 border-2 border-cyan-400 border-dashed rounded-lg p-2.5 text-xs font-semibold text-cyan-400 animate-pulse">
              Configure BGP Router ✋
            </div>
          )}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs mt-2">Vendor selection</div>
        </div>
        <div className="flex items-center text-cyan-400 text-xl font-bold animate-pulse">→</div>
        <div className={`flex-1 bg-gray-800 border rounded-xl p-3 transition-all ${pos === 1 ? 'border-cyan-400/50' : 'border-gray-600'}`}>
          <p className="text-xs text-cyan-400 font-bold mb-2">IN PROGRESS</p>
          {pos === 1 && (
            <div className="bg-cyan-400/10 border border-cyan-400 rounded-lg p-2.5 text-xs font-semibold text-cyan-400">
              Configure BGP Router ✅
            </div>
          )}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs mt-2">Update IP schema</div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-4 animate-pulse">Status updated in real time in Supabase</p>
    </div>
  )
}

function ProjectPlanScreen({ animate }: { animate: boolean }) {
  const tasks = [
    { name: 'Scope Review', assignee: 'JS', priority: 'high', status: 'done', progress: 100 },
    { name: 'BGP Design', assignee: 'MK', priority: 'critical', status: 'in_progress', progress: 65 },
    { name: 'Router Config', assignee: 'JS', priority: 'high', status: 'in_progress', progress: 40 },
    { name: 'Testing', assignee: 'SR', priority: 'medium', status: 'backlog', progress: 0 },
    { name: 'Go Live', assignee: 'MK', priority: 'critical', status: 'backlog', progress: 0 },
  ]
  const statusColors: Record<string, string> = { done: 'text-emerald-400', in_progress: 'text-cyan-400', backlog: 'text-gray-500' }
  const priorityColors: Record<string, string> = { critical: 'bg-red-400/10 text-red-400', high: 'bg-amber-400/10 text-amber-400', medium: 'bg-cyan-400/10 text-cyan-400' }
  return (
    <div className="p-4">
      <h2 className="font-bold text-lg mb-4">Project Plan — Gantt View</h2>
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700">
              {['Task','Assignee','Priority','Status','Progress'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-gray-400 font-bold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr key={t.name} className={`border-b border-gray-700/50 transition-all duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: `${i * 120}ms` }}>
                <td className="px-3 py-2.5 font-semibold">{t.name}</td>
                <td className="px-3 py-2.5">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold">{t.assignee}</div>
                </td>
                <td className="px-3 py-2.5"><span className={`px-1.5 py-0.5 rounded text-[10px] ${priorityColors[t.priority]}`}>{t.priority}</span></td>
                <td className={`px-3 py-2.5 ${statusColors[t.status]}`}>{t.status.replace('_',' ')}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${t.progress}%` }}/>
                    </div>
                    <span className="text-gray-400">{t.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KnowledgeSearchScreen({ animate }: { animate: boolean }) {
  const [typed, setTyped] = useState('')
  const target = 'OSPF to BGP migration'
  useEffect(() => {
    if (!animate) { setTyped(''); return }
    let i = 0
    const t = setInterval(() => {
      if (i <= target.length) { setTyped(target.slice(0, i)); i++ }
      else clearInterval(t)
    }, 80)
    return () => clearTimeout(t)
  }, [animate])
  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold text-lg">Knowledge Base</h2>
      <div className="flex items-center gap-2 bg-gray-800 border border-cyan-400/50 rounded-xl px-4 py-3">
        <span className="text-gray-400">🔍</span>
        <span className="text-sm font-mono flex-1">{typed}<span className="animate-pulse text-cyan-400">|</span></span>
      </div>
      {typed.length > 8 && (
        <div className={`bg-cyan-400/5 border border-cyan-400/30 rounded-xl p-4 transition-all duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm text-gray-400 mb-3">No article found for <span className="text-cyan-400">"{typed}"</span></p>
          <button className="w-full py-3 bg-cyan-400 text-black font-bold rounded-xl text-sm animate-pulse">
            Generate AI Article for "{typed}" →
          </button>
        </div>
      )}
      <div className={`space-y-2 transition-all duration-500 delay-300 ${animate ? 'opacity-100' : 'opacity-0'}`}>
        {['How to Configure a Router','SD-WAN Deployment Guide','Office Move IT Checklist'].map(a => (
          <div key={a} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{a}</p>
              <p className="text-xs text-gray-500 mt-0.5">Networking · 3 min read</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-cyan-400 font-mono">Read</span>
              <span className="text-xs text-emerald-400 font-mono">Download</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AIGenerateScreen({ animate }: { animate: boolean }) {
  const [lines, setLines] = useState<string[]>([])
  const allLines = [
    '## OSPF to BGP Migration Guide',
    '',
    'OVERVIEW',
    'Migrating from OSPF to BGP enables better routing',
    'control across multi-vendor environments...',
    '',
    'STEP-BY-STEP GUIDE',
    '1. Document current OSPF topology',
    '2. Plan BGP AS number allocation',
    '3. Configure BGP on edge routers',
    '4. Redistribute OSPF routes into BGP',
    '5. Verify BGP peer adjacencies',
    '6. Test failover scenarios',
    '7. Decommission OSPF gradually',
    '',
    'BEST PRACTICES',
    '• Use route maps to control redistribution',
    '• Always test in lab before production',
    '',
    '✅ Saved to Knowledge Base',
  ]
  useEffect(() => {
    if (!animate) { setLines([]); return }
    let i = 0
    const t = setInterval(() => {
      if (i < allLines.length) { setLines(prev => [...prev, allLines[i]]); i++ }
      else clearInterval(t)
    }, 180)
    return () => clearInterval(t)
  }, [animate])
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-lg">AI Generating Article...</h2>
        <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2 py-1 rounded font-mono">Claude AI</span>
      </div>
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className={`${line.startsWith('##') ? 'text-cyan-400 font-bold' : line.startsWith('✅') ? 'text-emerald-400 font-bold' : line === '' ? 'h-2' : 'text-gray-300'}`}>
            {line}
          </div>
        ))}
        {lines.length > 0 && lines.length < allLines.length && (
          <span className="animate-pulse text-cyan-400">▋</span>
        )}
      </div>
    </div>
  )
}

function ScopeScreen({ animate }: { animate: boolean }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    if (!animate) { setPhase(0); return }
    const t1 = setTimeout(() => setPhase(1), 800)
    const t2 = setTimeout(() => setPhase(2), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [animate])
  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold text-lg">AI Project Plan from Scope Doc</h2>
      <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-500 ${phase >= 1 ? 'border-emerald-400 bg-emerald-400/5' : 'border-gray-600'}`}>
        {phase === 0 && <p className="text-gray-400 text-sm">Drop your scope document here (.txt, .pdf, .docx)</p>}
        {phase >= 1 && <p className="text-emerald-400 font-semibold text-sm">SDWAN_Rollout_Singapore.pdf uploaded ✓</p>}
      </div>
      {phase >= 2 && (
        <div className="bg-gray-800 border border-emerald-400/30 rounded-xl p-4 space-y-2 text-xs animate-fade-in">
          <p className="font-bold text-emerald-400 mb-2">AI Generated Project Plan:</p>
          {[
            'Phase 1: Discovery & Planning (2 weeks)',
            'Phase 2: Design & Procurement (3 weeks)',
            'Phase 3: Implementation (6 weeks)',
            'Phase 4: Testing & UAT (2 weeks)',
            'Phase 5: Go Live & Handover (1 week)',
            '',
            '⚠️ Risk: Vendor lead time may delay Phase 2',
            '⚠️ Risk: Staff training required before cutover',
          ].map((line, i) => (
            <p key={i} className={line.startsWith('⚠️') ? 'text-amber-400' : line === '' ? 'h-1' : 'text-gray-300'}>{line}</p>
          ))}
          <button className="mt-2 w-full py-2 border border-emerald-400/30 text-emerald-400 rounded-lg text-xs font-mono">Download Project Plan</button>
        </div>
      )}
    </div>
  )
}

function CTAScreen() {
  return (
    <div className="p-8 flex flex-col items-center text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-3xl">🚀</div>
      <div>
        <h2 className="font-black text-2xl mb-2">Ready to get started?</h2>
        <p className="text-gray-400 text-sm">Join IT teams worldwide using NexPlan</p>
      </div>
      <div className="space-y-3 w-full max-w-xs">
        <Link href="/login" className="block w-full py-3 bg-cyan-400 text-black font-bold rounded-xl text-sm text-center hover:bg-cyan-300 transition-colors">
          Start Free — No credit card needed →
        </Link>
        <Link href="/" className="block w-full py-3 bg-gray-800 border border-gray-600 text-gray-300 rounded-xl text-sm text-center hover:border-gray-400 transition-colors">
          Back to Home
        </Link>
      </div>
      <div className="flex gap-6 text-xs text-gray-500">
        <span>✓ Free forever</span>
        <span>✓ No credit card</span>
        <span>✓ AI powered</span>
      </div>
    </div>
  )
}

function LandingScreen() {
  return (
    <div className="p-6 flex flex-col items-center text-center space-y-4">
      <div className="font-black text-2xl">Nex<span className="text-cyan-400">Plan</span></div>
      <h1 className="font-black text-xl leading-tight">AI-Powered IT Project Management</h1>
      <p className="text-gray-400 text-sm">Kanban boards, AI project plans, knowledge base and network diagrams — built for IT teams.</p>
      <div className="flex gap-2 text-xs flex-wrap justify-center">
        {['📋 Kanban','🤖 AI Plans','📚 Knowledge Base','🗺️ Network Diagrams'].map(f => (
          <span key={f} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full">{f}</span>
        ))}
      </div>
    </div>
  )
}

export default function DemoClient() {
  const [currentStep, setCurrentStep] = useState(0)
  const [animate, setAnimate] = useState(false)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)
  const step = DEMO_STEPS[currentStep]

  function goToStep(idx: number) {
    setCurrentStep(idx)
    setAnimate(false)
    setProgress(0)
    setTimeout(() => setAnimate(true), 100)
  }

  useEffect(() => {
    setAnimate(false)
    setProgress(0)
    setTimeout(() => setAnimate(true), 100)
  }, [currentStep])

  useEffect(() => {
    if (paused || step.id === 'cta') return
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)

    const duration = step.duration
    const interval = 50
    let elapsed = 0

    progressRef.current = setInterval(() => {
      if (!paused) {
        elapsed += interval
        setProgress(Math.min((elapsed / duration) * 100, 100))
      }
    }, interval)

    timerRef.current = setTimeout(() => {
      if (currentStep < DEMO_STEPS.length - 1) goToStep(currentStep + 1)
    }, duration)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [currentStep, paused])

  function renderScreen() {
    switch (step.screen) {
      case 'landing': return <LandingScreen />
      case 'dashboard': return <DashboardScreen animate={animate} />
      case 'create-project': return <CreateProjectScreen animate={animate} />
      case 'kanban': return <KanbanScreen animate={animate} />
      case 'drag': return <DragScreen animate={animate} />
      case 'project-plan': return <ProjectPlanScreen animate={animate} />
      case 'knowledge-search': return <KnowledgeSearchScreen animate={animate} />
      case 'ai-generate': return <AIGenerateScreen animate={animate} />
      case 'scope': return <ScopeScreen animate={animate} />
      case 'cta': return <CTAScreen />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-2xl mb-6 flex items-center justify-between">
        <Link href="/" className="font-black text-xl">Nex<span className="text-cyan-400">Plan</span></Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">{currentStep + 1} / {DEMO_STEPS.length}</span>
          <Link href="/login" className="text-xs bg-cyan-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-cyan-300 transition-colors">
            Start Free →
          </Link>
        </div>
      </div>

      {/* Main demo window */}
      <div className="w-full max-w-2xl">
        {/* Browser chrome */}
        <div className="bg-gray-800 border border-gray-700 rounded-t-2xl px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/60"/>
            <div className="w-3 h-3 rounded-full bg-amber-400/60"/>
            <div className="w-3 h-3 rounded-full bg-emerald-400/60"/>
          </div>
          <div className="flex-1 bg-gray-900 rounded-lg px-4 py-1.5 text-xs text-gray-400 font-mono text-center">
            app.nexplan.io/{step.screen === 'landing' ? '' : step.screen}
          </div>
        </div>

        {/* Screen content */}
        <div className="bg-gray-900 border-x border-gray-700 min-h-[380px] overflow-hidden">
          {/* Fake sidebar */}
          <div className="flex h-full">
            {step.screen !== 'landing' && step.screen !== 'cta' && (
              <div className="w-12 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 gap-4 shrink-0">
                {['📊','📋','📅','📚','⚙️'].map((icon, i) => (
                  <div key={i} className={`text-base p-1.5 rounded-lg ${i === ['dashboard','kanban','project-plan','knowledge-search','knowledge-search','ai-generate','scope'].indexOf(step.screen) ? 'bg-cyan-400/10' : ''}`}>{icon}</div>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              {renderScreen()}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {step.id !== 'cta' && (
          <div className="bg-gray-800 border-x border-gray-700 h-1">
            <div className="h-full bg-cyan-400 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}/>
          </div>
        )}

        {/* Bottom bar */}
        <div className="bg-gray-800 border border-gray-700 rounded-b-2xl px-6 py-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-syne font-black text-lg">{step.title}</h3>
              <p className="text-cyan-400 text-xs font-mono mt-0.5">{step.subtitle}</p>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{step.description}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button onClick={() => currentStep > 0 && goToStep(currentStep - 1)}
              disabled={currentStep === 0}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-lg text-sm transition-colors">
              ← Prev
            </button>
            <button onClick={() => setPaused(p => !p)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
              {paused ? '▶ Play' : '⏸ Pause'}
            </button>
            <button onClick={() => currentStep < DEMO_STEPS.length - 1 && goToStep(currentStep + 1)}
              disabled={currentStep === DEMO_STEPS.length - 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-lg text-sm transition-colors">
              Next →
            </button>

            {/* Step dots */}
            <div className="flex gap-1.5 ml-auto">
              {DEMO_STEPS.map((_, i) => (
                <button key={i} onClick={() => goToStep(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? 'bg-cyan-400 w-4' : 'bg-gray-600 hover:bg-gray-400'}`}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
