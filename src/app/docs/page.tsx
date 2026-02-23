'use client'
import Link from 'next/link'
import { useState } from 'react'

const DOCS = [
  {
    category: 'Getting Started',
    icon: '🚀',
    articles: [
      {
        id: 'create-account',
        title: 'How to Create Your Account',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'Getting started with NexPlan takes less than 2 minutes. No credit card required.' },
          { type: 'steps', items: [
            { step: 1, title: 'Go to nexplan.io', desc: 'Open your browser and go to www.nexplan.io. Click "Get Started Free" or "Sign In".' },
            { step: 2, title: 'Choose sign-in method', desc: 'You can sign in with Google (fastest), Microsoft, Facebook, or create an account with your work email.' },
            { step: 3, title: 'Fill in your profile', desc: 'Enter your Full Name, select your Role (IT Project Manager, Network Engineer etc.) and choose your Country.' },
            { step: 4, title: 'You\'re in!', desc: 'You\'ll be taken directly to your Dashboard. Your account is ready to use immediately.' },
          ]},
          { type: 'tip', text: 'Use "Sign in with Google" for the fastest experience — one click and you\'re in.' },
        ]
      },
      {
        id: 'dashboard',
        title: 'Understanding Your Dashboard',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'Your Dashboard gives you a real-time overview of all your projects and tasks at a glance.' },
          { type: 'steps', items: [
            { step: 1, title: 'Stats Cards', desc: 'Four cards show Total Projects, Tasks Completed, Team Members, and At Risk items. Click any card to navigate to the relevant section.' },
            { step: 2, title: 'Recent Projects', desc: 'See your most recently active projects with progress bars.' },
            { step: 3, title: 'Navigation Sidebar', desc: 'Use the left sidebar to navigate between Dashboard, Kanban, Project Plan, Knowledge Base, Feedback and Settings.' },
          ]},
        ]
      },
    ]
  },
  {
    category: 'Kanban Board',
    icon: '📋',
    articles: [
      {
        id: 'create-project',
        title: 'How to Create a Project',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'Projects are the foundation of NexPlan. Each project has its own Kanban board, timeline and tasks.' },
          { type: 'steps', items: [
            { step: 1, title: 'Go to Kanban Board', desc: 'Click "Kanban Board" in the left sidebar.' },
            { step: 2, title: 'Click "+ Project"', desc: 'Click the "+ Project" button in the toolbar at the top.' },
            { step: 3, title: 'Enter project details', desc: 'Type your Project Name (e.g. "SDWAN Rollout Singapore"). Optionally set a Start Date and End Date — these are needed for the Timeline view.' },
            { step: 4, title: 'Create Project', desc: 'Click "Create Project". Your new Kanban board is ready immediately with 5 columns: Backlog, In Progress, Review, Blocked, Done.' },
          ]},
          { type: 'tip', text: 'Always set a project Start Date and End Date — this unlocks the Timeline and Gantt chart view.' },
        ]
      },
      {
        id: 'create-task',
        title: 'How to Create a Task / Card',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'Tasks are the cards on your Kanban board. Each task belongs to a column and represents a piece of work.' },
          { type: 'steps', items: [
            { step: 1, title: 'Select your project', desc: 'Use the dropdown at the top of the Kanban board to select which project you want to add a task to.' },
            { step: 2, title: 'Click "+ Add card"', desc: 'At the bottom of any column, click the "+ Add card" button. You can add to any column — Backlog is recommended for new tasks.' },
            { step: 3, title: 'Type task title', desc: 'Enter the task name (e.g. "Configure BGP on edge router"). Press Enter or click "Add" to save.' },
            { step: 4, title: 'Task is created!', desc: 'Your task card appears in the column. Click "edit" on the card to add more details.' },
          ]},
          { type: 'tip', text: 'Press Enter to quickly add a task, or Escape to cancel.' },
        ]
      },
      {
        id: 'edit-task',
        title: 'How to Edit a Task — Dates, Assignee & Email',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'Each task can have a full set of details including dates, assignee, priority and email notifications.' },
          { type: 'steps', items: [
            { step: 1, title: 'Click "edit" on any card', desc: 'Every task card has a small "edit" link at the bottom right. Click it to open the Edit Task modal.' },
            { step: 2, title: 'Update task title & description', desc: 'Edit the task name and add a description with more details about what needs to be done.' },
            { step: 3, title: 'Set Priority', desc: 'Choose from Low, Medium, High or Critical. Critical tasks appear highlighted on the board.' },
            { step: 4, title: 'Add Assignee', desc: 'Enter the Assignee Name (person responsible for this task).' },
            { step: 5, title: 'Set Timeline dates', desc: 'Add Start Date and End Date. The Duration auto-calculates (e.g. "14 days"). Also set a Due Date (deadline).' },
            { step: 6, title: 'Send email notification', desc: 'Enter the Assignee Email address. A "📧 Send Task Notification" button appears. Click it to send a professional branded email to the assignee with all task details.' },
            { step: 7, title: 'Save Changes', desc: 'Click "Save Changes" to save all updates to the task.' },
          ]},
          { type: 'tip', text: 'Tasks with Start Date + End Date appear on the Timeline / Gantt chart view.' },
        ]
      },
      {
        id: 'drag-drop',
        title: 'How to Move Tasks (Drag & Drop)',
        time: '1 min read',
        content: [
          { type: 'intro', text: 'Moving tasks between columns is how you track progress in NexPlan.' },
          { type: 'steps', items: [
            { step: 1, title: 'Click and hold a task card', desc: 'Click and hold any task card. It will lift up slightly to show it\'s being dragged.' },
            { step: 2, title: 'Drag to the new column', desc: 'Drag the card to any other column — In Progress, Review, Blocked, or Done.' },
            { step: 3, title: 'Release to drop', desc: 'Release the mouse button to drop the task in the new column. The status updates automatically in the database.' },
          ]},
          { type: 'tip', text: 'Move tasks from Backlog → In Progress when you start working on them, and to Done when complete.' },
        ]
      },
      {
        id: 'timeline',
        title: 'How to Use the Timeline / Gantt View',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'The Timeline view shows all your tasks as a Gantt chart so you can see the full project schedule and critical path.' },
          { type: 'steps', items: [
            { step: 1, title: 'Set project dates first', desc: 'Click the date pill next to your project name (or it shows "📅 Set project dates"). Set a project Start and End date.' },
            { step: 2, title: 'Add dates to tasks', desc: 'Edit each task and add Start Date + End Date. Tasks without dates appear in the "Unscheduled Tasks" section.' },
            { step: 3, title: 'Click "📅 Timeline"', desc: 'In the top right toolbar, click the "📅 Timeline" toggle button to switch from Board to Timeline view.' },
            { step: 4, title: 'View the Gantt chart', desc: 'Each task appears as a bar. The bar width represents the duration. Month headers show along the top.' },
            { step: 5, title: 'Critical Path', desc: 'Tasks on the critical path are highlighted in RED with a ⚠ warning. These tasks, if delayed, will delay your entire project.' },
            { step: 6, title: 'Click any task bar', desc: 'Click any bar or task row to open the edit modal and update dates.' },
          ]},
          { type: 'tip', text: 'The critical path is automatically calculated — no manual setup needed.' },
        ]
      },
    ]
  },
  {
    category: 'Knowledge Base & AI',
    icon: '📚',
    articles: [
      {
        id: 'search-kb',
        title: 'How to Search the Knowledge Base',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'The Knowledge Base contains IT articles and documentation. Search for any IT topic and find or generate guides instantly.' },
          { type: 'steps', items: [
            { step: 1, title: 'Go to Knowledge Base', desc: 'Click "Knowledge Base" in the left sidebar.' },
            { step: 2, title: 'Type your search', desc: 'Type any IT topic in the search box (e.g. "SDWAN deployment", "BGP configuration", "Office move checklist").' },
            { step: 3, title: 'Browse results', desc: 'Matching articles appear instantly. Click any article to read the full guide.' },
            { step: 4, title: 'Filter by category', desc: 'Use the left sidebar categories to filter by Networking, Security, Cloud, Server & VM, Migration etc.' },
          ]},
          { type: 'tip', text: 'Try searching for topics relevant to your current project — you may find ready-made runbooks and checklists.' },
        ]
      },
      {
        id: 'ai-article',
        title: 'How to Generate an AI Article',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'If no article exists for your search, NexPlan\'s AI can generate a full professional guide in seconds.' },
          { type: 'steps', items: [
            { step: 1, title: 'Search for a topic', desc: 'Type your IT topic in the Knowledge Base search. If no results found, the AI generator appears.' },
            { step: 2, title: 'Click "Generate AI Article"', desc: 'Click the "Generate with AI" button that appears when no results are found.' },
            { step: 3, title: 'AI generates the article', desc: 'Claude AI generates a comprehensive professional guide covering overview, step-by-step instructions, best practices and common mistakes.' },
            { step: 4, title: 'Article auto-saved', desc: 'The article is automatically saved to your Knowledge Base with an "AI" badge. It\'s available for your whole team.' },
          ]},
          { type: 'tip', text: 'AI-generated articles are saved permanently — search the same topic again and it loads instantly next time.' },
        ]
      },
      {
        id: 'scope-upload',
        title: 'How to Generate a Project Plan from a Scope Document',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'Upload any project scope document and AI will generate a complete project plan with phases, tasks, timeline and risks.' },
          { type: 'steps', items: [
            { step: 1, title: 'Go to Knowledge Base', desc: 'Click "Knowledge Base" in the left sidebar.' },
            { step: 2, title: 'Click "Upload Scope Document"', desc: 'Find the "Upload Scope Document" section and click to upload your file (.txt, .pdf or .docx).' },
            { step: 3, title: 'AI reads your document', desc: 'Claude AI analyses your scope document — project objectives, deliverables, constraints and stakeholders.' },
            { step: 4, title: 'Project plan generated', desc: 'A complete project plan appears with phases (Discovery, Design, Implementation, Testing, Go Live), tasks for each phase, estimated timeline, and key risks.' },
            { step: 5, title: 'Download or use it', desc: 'Download the project plan or use it as the basis for your NexPlan project.' },
          ]},
          { type: 'tip', text: 'The more detailed your scope document, the better the AI-generated project plan will be.' },
        ]
      },
    ]
  },
]

export default function DocsPage() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null)
  const [openCategory, setOpenCategory] = useState<string>('Kanban Board')

  const activeArticle = DOCS.flatMap(d => d.articles).find(a => a.id === activeDoc)

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none"/>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-5 backdrop-blur-xl bg-bg/70 border-b border-border">
        <Link href="/" className="font-syne font-black text-xl">Nex<span className="text-accent">Plan</span></Link>
        <div className="hidden md:flex gap-8">
          <Link href="/#features" className="text-muted text-sm hover:text-text transition-colors">Features</Link>
          <Link href="/pricing" className="text-muted text-sm hover:text-text transition-colors">Pricing</Link>
          <Link href="/docs" className="text-accent text-sm font-semibold">Docs</Link>
          <Link href="/about" className="text-muted text-sm hover:text-text transition-colors">About</Link>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
          <Link href="/login" className="btn-primary text-sm px-4 py-2">Get Started Free</Link>
        </div>
      </nav>

      <div className="relative z-10 pt-24 max-w-6xl mx-auto px-6 pb-16">
        {/* Header */}
        <div className="py-10 border-b border-border mb-8">
          <p className="font-mono-code text-accent text-xs tracking-widest uppercase mb-3">// Documentation</p>
          <h1 className="font-syne font-black text-4xl mb-2">NexPlan Docs</h1>
          <p className="text-muted">Step-by-step guides for every feature. Updated as new features are released.</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 shrink-0">
            <div className="sticky top-28 space-y-1">
              {DOCS.map(cat => (
                <div key={cat.category}>
                  <button
                    onClick={() => setOpenCategory(openCategory === cat.category ? '' : cat.category)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface2 transition-colors text-left">
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span className="font-syne font-bold text-sm">{cat.category}</span>
                    </div>
                    <span className={`text-muted text-xs transition-transform ${openCategory === cat.category ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {openCategory === cat.category && (
                    <div className="ml-4 space-y-0.5 mt-1">
                      {cat.articles.map(article => (
                        <button key={article.id}
                          onClick={() => setActiveDoc(article.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeDoc === article.id
                              ? 'bg-accent/10 text-accent font-semibold'
                              : 'text-muted hover:text-text hover:bg-surface2'
                          }`}>
                          {article.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-border mt-4">
                <p className="text-xs font-mono-code text-muted px-3 mb-2">Need help?</p>
                <a href="mailto:info@nexplan.io"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-surface2 transition-colors text-sm text-muted hover:text-text">
                  📧 info@nexplan.io
                </a>
                <Link href="/login"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-surface2 transition-colors text-sm text-muted hover:text-text">
                  💬 In-app feedback
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {!activeDoc ? (
              /* Landing — show all categories as cards */
              <div className="space-y-8">
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: '⚡', label: 'Quick Start', desc: 'Set up your first project in under 5 minutes', id: 'create-project' },
                    { icon: '📧', label: 'Email Notifications', desc: 'Assign tasks and notify your team instantly', id: 'edit-task' },
                    { icon: '🤖', label: 'AI Features', desc: 'Generate articles and project plans with AI', id: 'ai-article' },
                  ].map(q => (
                    <button key={q.id} onClick={() => { setActiveDoc(q.id); setOpenCategory(DOCS.find(d => d.articles.find(a => a.id === q.id))?.category ?? '') }}
                      className="card text-left hover:border-accent/40 hover:-translate-y-0.5 transition-all">
                      <span className="text-2xl mb-2 block">{q.icon}</span>
                      <p className="font-syne font-bold text-sm mb-1">{q.label}</p>
                      <p className="text-xs text-muted">{q.desc}</p>
                    </button>
                  ))}
                </div>

                {DOCS.map(cat => (
                  <div key={cat.category}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{cat.icon}</span>
                      <h2 className="font-syne font-black text-xl">{cat.category}</h2>
                    </div>
                    <div className="space-y-2">
                      {cat.articles.map(article => (
                        <button key={article.id}
                          onClick={() => { setActiveDoc(article.id); setOpenCategory(cat.category) }}
                          className="w-full card text-left hover:border-accent/40 flex items-center justify-between group transition-all">
                          <div>
                            <p className="font-syne font-semibold">{article.title}</p>
                            <p className="text-xs text-muted mt-1">{article.time}</p>
                          </div>
                          <span className="text-muted group-hover:text-accent transition-colors text-xl">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="card border-accent/20 text-center py-8">
                  <p className="text-2xl mb-2">📖</p>
                  <h3 className="font-syne font-bold text-lg mb-2">More docs coming soon</h3>
                  <p className="text-muted text-sm">Docs are extended as new features are released based on user feedback.</p>
                  <Link href="/login" className="btn-primary text-sm px-5 py-2 mt-4 inline-block">Submit Feedback →</Link>
                </div>
              </div>
            ) : activeArticle ? (
              /* Article view */
              <div>
                <button onClick={() => setActiveDoc(null)} className="flex items-center gap-2 text-muted hover:text-accent text-sm mb-6 transition-colors">
                  ← Back to Docs
                </button>

                <div className="mb-8">
                  <p className="text-xs font-mono-code text-accent mb-2">
                    {DOCS.find(d => d.articles.find(a => a.id === activeDoc))?.category}
                  </p>
                  <h1 className="font-syne font-black text-3xl mb-2">{activeArticle.title}</h1>
                  <p className="text-xs text-muted font-mono-code">{activeArticle.time}</p>
                </div>

                <div className="space-y-6">
                  {activeArticle.content.map((block, i) => {
                    if (block.type === 'intro') {
                      return (
                        <p key={i} className="text-muted text-lg leading-relaxed border-l-2 border-accent pl-4">
                          {block.text}
                        </p>
                      )
                    }
                    if (block.type === 'steps' && block.items) {
                      return (
                        <div key={i} className="space-y-4">
                          {block.items.map((item) => (
                            <div key={item.step} className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent font-syne font-black text-sm shrink-0 mt-0.5">
                                {item.step}
                              </div>
                              <div className="flex-1 pb-4 border-b border-border/50">
                                <p className="font-syne font-bold mb-1">{item.title}</p>
                                <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    if (block.type === 'tip') {
                      return (
                        <div key={i} className="flex gap-3 p-4 bg-accent3/5 border border-accent3/20 rounded-xl">
                          <span className="text-accent3 text-xl shrink-0">💡</span>
                          <p className="text-sm text-accent3 leading-relaxed"><strong>Pro Tip:</strong> {block.text}</p>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>

                {/* Next article */}
                <div className="mt-12 pt-8 border-t border-border flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-muted mb-1">Was this helpful?</p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-surface2 hover:bg-accent3/10 hover:text-accent3 rounded-lg text-sm transition-colors">👍 Yes</button>
                      <button className="px-3 py-1.5 bg-surface2 hover:bg-danger/10 hover:text-danger rounded-lg text-sm transition-colors">👎 No</button>
                    </div>
                  </div>
                  <Link href="/login" className="btn-primary text-sm px-5 py-2">Try it in NexPlan →</Link>
                </div>
              </div>
            ) : null}
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
