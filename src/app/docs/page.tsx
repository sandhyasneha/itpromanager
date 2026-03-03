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
            { step: 2, title: 'Choose sign-in method', desc: 'Sign in with Google (fastest) or create an account with your work email.' },
            { step: 3, title: 'Fill in your profile', desc: 'Enter your Full Name, select your Role (IT Project Manager, Network Engineer etc.) and choose your Country.' },
            { step: 4, title: 'Check your inbox', desc: 'Confirm your email. A welcome email with your feature overview arrives automatically.' },
            { step: 5, title: 'You\'re in!', desc: 'You\'ll be taken directly to your Portfolio Dashboard. Your account is ready to use immediately.' },
          ]},
          { type: 'tip', text: 'Use "Sign in with Google" for the fastest experience — one click and you\'re in.' },
        ]
      },
      {
        id: 'dashboard',
        title: 'Understanding Your Portfolio Dashboard',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'Your Portfolio Dashboard gives you a real-time bird\'s-eye view of every project, risk, and overdue task at a glance.' },
          { type: 'steps', items: [
            { step: 1, title: 'Top Stats Row', desc: 'Four cards show: Total Projects, At Risk (🔴), Needs Attention (🟡), and Overdue Tasks. Numbers update in real time.' },
            { step: 2, title: 'Portfolio Progress Bar', desc: 'A single progress bar shows overall completion % across ALL your projects — Done, In Progress, Review, Blocked, and Backlog counts.' },
            { step: 3, title: 'Project Health Grid', desc: 'Every project listed with RAG status dot (🔴 At Risk / 🟡 Needs Attention / 🟢 On Track), progress bar, overdue count, red risk count, and days remaining.' },
            { step: 4, title: 'Overdue Tasks Panel', desc: 'Right column shows all overdue tasks sorted by most overdue first, with which project they belong to.' },
            { step: 5, title: 'Risk Summary Panel', desc: 'Red/Amber/Green risk counts plus the top red risks listed by project.' },
          ]},
          { type: 'tip', text: 'RAG status is calculated automatically: blocked tasks or 3+ overdue = Red, any overdue or red risks = Amber, everything else = Green.' },
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
          { type: 'intro', text: 'Create a project and your Kanban board is ready instantly with 5 columns.' },
          { type: 'steps', items: [
            { step: 1, title: 'Go to Kanban Board', desc: 'Click "Kanban Board" in the left sidebar.' },
            { step: 2, title: 'Click "+ New Project"', desc: 'Click the "+ New Project" button in the top toolbar.' },
            { step: 3, title: 'Enter project details', desc: 'Type your Project Name (e.g. "SDWAN Rollout Singapore"). Set Start and End dates for Timeline view.' },
            { step: 4, title: 'Use AI Generator', desc: 'Click "🤖 Generate with AI" — describe your IT project and AI creates a full task plan in seconds.' },
            { step: 5, title: 'Board is ready', desc: 'Your Kanban board appears with 5 columns: Backlog → In Progress → Review → Blocked → Done.' },
          ]},
          { type: 'tip', text: 'Try the AI generator first — describe your project in plain English and get a complete task plan instantly.' },
        ]
      },
      {
        id: 'create-task',
        title: 'How to Create & Edit Tasks',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'Add tasks to your board and set all details including assignee, due date, estimated hours and attachments.' },
          { type: 'steps', items: [
            { step: 1, title: 'Click "+ Add card"', desc: 'At the bottom of any column, click the "+ Add card" button. Backlog is recommended for new tasks.' },
            { step: 2, title: 'Type task title', desc: 'Enter the task name (e.g. "Configure BGP on edge router") and press Enter.' },
            { step: 3, title: 'Click "edit" to open detail panel', desc: 'Click the edit link on any card to open the full task editor.' },
            { step: 4, title: 'Set priority, dates, assignee', desc: 'Set Priority (Low/Medium/High/Critical), Start/End/Due dates, Assignee Name and Assignee Email.' },
            { step: 5, title: 'Set estimated hours', desc: 'Enter estimated hours for the task — this feeds into the Resource Utilization report.' },
            { step: 6, title: 'Attach files', desc: 'Upload PDF, Word or TXT files directly to the task using the attachment section.' },
            { step: 7, title: 'Send notifications', desc: 'Click "📧 Send Task Assignment Email" to notify the assignee, or "🤖 Send AI Follow-Up" for a reminder 1 day before due date.' },
          ]},
          { type: 'tip', text: 'Estimated hours is key for Resource Utilization — fill it in or click "🤖 AI" to get an instant AI estimate.' },
        ]
      },
      {
        id: 'drag-drop',
        title: 'How to Move Tasks (Drag & Drop)',
        time: '1 min read',
        content: [
          { type: 'intro', text: 'Move tasks between columns by dragging and dropping — status updates automatically.' },
          { type: 'steps', items: [
            { step: 1, title: 'Click and hold a task card', desc: 'Click and hold any task card. It lifts up slightly to show it\'s being dragged.' },
            { step: 2, title: 'Drag to the new column', desc: 'Drag to any column — In Progress, Review, Blocked, or Done.' },
            { step: 3, title: 'Release to drop', desc: 'Release the mouse. The status updates automatically in the database and reflects on the Team Member\'s My Tasks view instantly.' },
          ]},
          { type: 'tip', text: 'Team members see their task status update in real time on their My Tasks page when you move a card.' },
        ]
      },
      {
        id: 'timeline',
        title: 'How to Use the Gantt Timeline',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'Switch to Timeline view for a Gantt chart showing all tasks as horizontal bars across a calendar.' },
          { type: 'steps', items: [
            { step: 1, title: 'Set project dates', desc: 'Click the date pill next to your project name and set a Start and End date for the project.' },
            { step: 2, title: 'Add dates to tasks', desc: 'Edit each task and add Start Date + End Date. Tasks without dates appear in "Unscheduled Tasks".' },
            { step: 3, title: 'Click "📅 Timeline"', desc: 'In the top toolbar, click the "📅 Timeline" toggle to switch from Board to Timeline view.' },
            { step: 4, title: 'Read the Gantt chart', desc: 'Each task appears as a colour bar. Bar width = duration. Hover any bar to see task details.' },
            { step: 5, title: 'Critical Path', desc: 'Tasks on the critical path are highlighted in RED with ⚠. These tasks, if delayed, will delay the entire project.' },
          ]},
          { type: 'tip', text: 'Set task Start and End dates before switching to Timeline view — tasks without dates won\'t appear on the Gantt.' },
        ]
      },
    ]
  },
  {
    category: 'AI Features',
    icon: '🤖',
    articles: [
      {
        id: 'ai-project-generator',
        title: 'AI Project Plan Generator',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'Describe your IT project in plain English — AI generates a complete project plan with phases, tasks and risks in seconds.' },
          { type: 'steps', items: [
            { step: 1, title: 'Click "+ New Project"', desc: 'Go to Kanban Board and click "+ New Project" in the toolbar.' },
            { step: 2, title: 'Click "🤖 Generate with AI"', desc: 'In the new project modal, click the AI generate button.' },
            { step: 3, title: 'Describe your project', desc: 'Type a description like "SDWAN deployment across 5 office locations, 3 months timeline, team of 4 engineers".' },
            { step: 4, title: 'AI generates the plan', desc: 'Claude AI creates a structured project plan with phases, tasks, priorities and estimated durations tailored to IT infrastructure work.' },
            { step: 5, title: 'Review and create', desc: 'Review the generated plan and click Create. All tasks appear on your Kanban board immediately.' },
          ]},
          { type: 'tip', text: 'The more detail you give, the better the plan. Include team size, timeline, technology stack and any specific constraints.' },
        ]
      },
      {
        id: 'ai-status-reports',
        title: 'AI Status Reports & Email Delivery',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'Generate a professional project status report with one click and email it to all stakeholders automatically.' },
          { type: 'steps', items: [
            { step: 1, title: 'Open your project in Kanban', desc: 'Select the project you want to report on from the project dropdown.' },
            { step: 2, title: 'Click "📊 Status Report"', desc: 'Click the Status Report button in the top toolbar.' },
            { step: 3, title: 'AI generates the report', desc: 'Claude AI analyses your tasks, progress, risks and blockers and writes a professional status report with RAG status, summary, achievements, risks and next steps.' },
            { step: 4, title: 'Review the report', desc: 'Read through the generated report. Edit any section if needed.' },
            { step: 5, title: 'Add stakeholder emails', desc: 'Enter the email addresses of your stakeholders, sponsor or management team.' },
            { step: 6, title: 'Send report', desc: 'Click Send. A branded NexPlan email with the full report is delivered to all stakeholders instantly.' },
          ]},
          { type: 'tip', text: 'Status reports include RAG status, completion %, key achievements, risks, blockers and upcoming milestones — everything a sponsor needs.' },
        ]
      },
      {
        id: 'ai-followup',
        title: 'AI Follow-Up Emails for Team Members',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'Send AI-written personalised follow-up emails to team members the day before their task is due.' },
          { type: 'steps', items: [
            { step: 1, title: 'Open a task in Kanban', desc: 'Click "edit" on any task card to open the task detail panel.' },
            { step: 2, title: 'Set Assignee Email and Due Date', desc: 'Make sure the task has an Assignee Email and a Due Date set.' },
            { step: 3, title: 'Click "🤖 Send AI Follow-Up"', desc: 'Click the AI Follow-Up button. It shows the due date in the button label.' },
            { step: 4, title: 'AI writes the email', desc: 'Claude AI writes a personalised 2-3 sentence professional follow-up mentioning the task name, due date and what\'s needed.' },
            { step: 5, title: 'Email delivered', desc: 'A branded NexPlan email with an orange "Task Due Tomorrow" alert banner is sent to the assignee with a link to their My Tasks page.' },
          ]},
          { type: 'tip', text: 'Each AI follow-up is unique — AI personalises the message based on task name, priority and context. Never feels like a generic reminder.' },
        ]
      },
      {
        id: 'ai-kb',
        title: 'AI Knowledge Base Articles',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'Search for any IT topic — if no article exists, AI generates a comprehensive professional guide instantly.' },
          { type: 'steps', items: [
            { step: 1, title: 'Go to Knowledge Base', desc: 'Click "Knowledge Base" in the left sidebar.' },
            { step: 2, title: 'Search your topic', desc: 'Type any IT topic — "OSPF to BGP migration", "Azure AD setup", "Office relocation checklist".' },
            { step: 3, title: 'Browse results', desc: 'Matching articles appear instantly. 42+ articles pre-loaded covering Cisco, Azure, VMware, SDWAN and more.' },
            { step: 4, title: 'Generate if not found', desc: 'If no article found, click "Generate with AI". Claude AI writes a full professional guide in seconds.' },
            { step: 5, title: 'Article auto-saved', desc: 'The AI article is saved to your Knowledge Base permanently with an "AI" badge for future reference.' },
          ]},
          { type: 'tip', text: 'Every AI-generated article is saved and shared across your account — generate once, available forever.' },
        ]
      },
    ]
  },
  {
    category: 'Risk & PCR',
    icon: '🛡️',
    articles: [
      {
        id: 'risk-register',
        title: 'Risk & Issue Register',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'Track all project risks and issues with RAG status, probability, impact scoring and AI-suggested mitigations.' },
          { type: 'steps', items: [
            { step: 1, title: 'Open Risk Register', desc: 'In your project Kanban view, click the "🛡️ Risk Register" tab or button.' },
            { step: 2, title: 'Add a risk or issue', desc: 'Click "+ Add Risk". Enter a title, description, category (Technical/Resource/Schedule/Budget/Stakeholder), type (Risk or Issue) and owner.' },
            { step: 3, title: 'Set RAG status', desc: 'Set the RAG status: 🔴 Red (critical), 🟡 Amber (watch), 🟢 Green (low). This feeds directly into the Portfolio Dashboard health score.' },
            { step: 4, title: 'Score probability & impact', desc: 'Rate Probability (1-5) and Impact (1-5). Risk Score = Probability × Impact. Scores 15+ are flagged as critical.' },
            { step: 5, title: 'Get AI mitigation', desc: 'Click "🤖 AI Suggest Mitigation". Claude AI writes a professional mitigation strategy tailored to the specific risk.' },
            { step: 6, title: 'Update status', desc: 'As risks are resolved, update status to Mitigated or Closed. Dashboard RAG scores update automatically.' },
          ]},
          { type: 'tip', text: 'Red risks automatically push your project to "At Risk" status on the Portfolio Dashboard — stakeholders and sponsors see it immediately.' },
        ]
      },
      {
        id: 'pcr',
        title: 'PCR (Project Change Request) Workflow',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'Manage scope changes professionally with a full PCR workflow — from request to approval with AI-generated documents.' },
          { type: 'steps', items: [
            { step: 1, title: 'Open PCR panel', desc: 'In your project, click the "📝 PCR" tab to open the Project Change Request panel.' },
            { step: 2, title: 'Create a new PCR', desc: 'Click "+ New PCR". Enter the change title, description, reason for change, and impact on scope, cost and timeline.' },
            { step: 3, title: 'AI generates PCR document', desc: 'Click "🤖 Generate PCR Document". AI writes a formal change request document in professional format ready for sponsor review.' },
            { step: 4, title: 'Submit for approval', desc: 'Set status to "Submitted". The PCR is now in the approval queue.' },
            { step: 5, title: 'Sponsor approves/rejects', desc: 'Update status to Approved or Rejected once sponsor responds. All decisions are logged with timestamps.' },
            { step: 6, title: 'Implement approved changes', desc: 'Once approved, update your project tasks to reflect the scope change. The PCR record remains for audit trail.' },
          ]},
          { type: 'tip', text: 'PCR documents generated by AI follow PRINCE2/PMI format — professional enough for enterprise sponsors and audit reviews.' },
        ]
      },
    ]
  },
  {
    category: 'Reports',
    icon: '📊',
    articles: [
      {
        id: 'upcoming-report',
        title: 'Upcoming & Overdue Report',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'See all tasks due across every project organised by time bucket — overdue, 15, 30, 45 and 60 days.' },
          { type: 'steps', items: [
            { step: 1, title: 'Go to Reports', desc: 'Click "📈 Reports" in the left sidebar.' },
            { step: 2, title: 'Select "📅 Upcoming & Overdue" tab', desc: 'The upcoming report is the default tab.' },
            { step: 3, title: 'Choose a time bucket', desc: 'Click 🚨 Overdue, 15 Days, 30 Days, 45 Days, 60 Days, or All to filter tasks by deadline window.' },
            { step: 4, title: 'Filter by project', desc: 'Use the project dropdown to focus on a single project or view all projects together.' },
            { step: 5, title: 'AI Estimate hours', desc: 'For tasks without estimated hours, click "🤖 AI Estimate" — AI suggests hours based on task type and description.' },
            { step: 6, title: 'Export to CSV', desc: 'Click "📥 Export CSV" to download the report for stakeholder sharing or management review.' },
          ]},
          { type: 'tip', text: 'Use the 15-day bucket for weekly standups — it shows exactly what needs attention this sprint.' },
        ]
      },
      {
        id: 'resource-report',
        title: 'Resource Utilization Report',
        time: '3 min read',
        content: [
          { type: 'intro', text: 'Track workload across your team using the 80/85% utilization threshold model — identify overallocation before burnout happens.' },
          { type: 'steps', items: [
            { step: 1, title: 'Go to Reports → Resource Utilization', desc: 'Click "📈 Reports" in the sidebar, then select the "👥 Resource Utilization" tab.' },
            { step: 2, title: 'Assign team members to tasks', desc: 'For resources to appear, tasks must have an Assignee Name set. Do this in the Kanban task editor.' },
            { step: 3, title: 'Set estimated hours on tasks', desc: 'Each task needs estimated hours. Click "🤖 AI" next to any task to get an AI estimate, or enter manually.' },
            { step: 4, title: 'Read the workload bars', desc: 'Each team member shows a colour-coded workload bar: 🟢 Under 80% (healthy), 🟡 80-85% (at risk), 🔴 85%+ (overallocated).' },
            { step: 5, title: 'Adjust available hours', desc: 'Default is 40h/week per person. Click the ✏️ edit button next to any person to set their actual available hours (e.g. 32h for part-time).' },
            { step: 6, title: 'Rebalance workload', desc: 'Use the report to move tasks away from overallocated team members to those with capacity.' },
            { step: 7, title: 'Export to CSV', desc: 'Download the utilization report for HR or management review.' },
          ]},
          { type: 'tip', text: '80-85% is the functional threshold for risk. Above 85% leads to burnout, reduced quality and project delays. Act before it reaches 85%.' },
        ]
      },
    ]
  },
  {
    category: 'Team Members',
    icon: '👥',
    articles: [
      {
        id: 'my-tasks',
        title: 'My Tasks — Team Member View',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'Team members log in to nexplan.io and see only the tasks assigned to their email — no project setup needed.' },
          { type: 'steps', items: [
            { step: 1, title: 'PM assigns task to team member', desc: 'In the Kanban board task editor, the PM enters the team member\'s email in the "Assignee Email" field.' },
            { step: 2, title: 'Team member registers', desc: 'Team member creates a free NexPlan account using the same email address the PM used.' },
            { step: 3, title: 'Team member sees My Tasks', desc: 'After login, team member clicks "✅ My Tasks" in the sidebar. Only their assigned tasks appear — nothing else.' },
            { step: 4, title: 'View task details', desc: 'Click any task to see full description, due date, priority and project context.' },
            { step: 5, title: 'Update task status', desc: 'Click the status circle or use the dropdown to update: Not Started → In Progress → In Review → Done.' },
            { step: 6, title: 'PM sees update instantly', desc: 'The status change reflects immediately on the PM\'s Kanban board in real time.' },
          ]},
          { type: 'tip', text: 'Team members only see tasks assigned to their email — they never see other projects, tasks or any sensitive project data.' },
        ]
      },
      {
        id: 'notifications',
        title: 'Smart Notifications',
        time: '2 min read',
        content: [
          { type: 'intro', text: 'Automated email notifications keep your team on track — due date alerts, daily digests and overdue warnings.' },
          { type: 'steps', items: [
            { step: 1, title: 'Task Assignment Email', desc: 'When a PM clicks "📧 Send Task Assignment Email" in the task editor, the assignee receives a branded email with all task details.' },
            { step: 2, title: 'AI Follow-Up Email', desc: 'Click "🤖 Send AI Follow-Up" to send an AI-written personalised reminder 1 day before the task due date.' },
            { step: 3, title: 'Due Soon Alerts', desc: 'Tasks appearing as "Due Today" or "Overdue" are highlighted on the My Tasks board with colour-coded badges.' },
            { step: 4, title: 'Status Report Emails', desc: 'AI Status Reports can be emailed to any stakeholder with one click from the Kanban toolbar.' },
          ]},
          { type: 'tip', text: 'All emails are sent from info@nexplan.io with professional NexPlan branding — safe to forward to sponsors and management.' },
        ]
      },
      {
        id: 'attachments',
        title: 'Task Attachments',
        time: '1 min read',
        content: [
          { type: 'intro', text: 'Attach PDF, Word or TXT files directly to any task — scopes, specs, approvals or reference documents.' },
          { type: 'steps', items: [
            { step: 1, title: 'Open task editor', desc: 'Click "edit" on any task card to open the task detail panel.' },
            { step: 2, title: 'Scroll to Attachments section', desc: 'Find the Attachments section at the bottom of the task editor.' },
            { step: 3, title: 'Upload your file', desc: 'Click "Upload File" and select a PDF, Word (.docx) or TXT file. Max 10MB per file.' },
            { step: 4, title: 'File attached to task', desc: 'The file is stored securely and linked to the task. Anyone with task access can download it.' },
            { step: 5, title: 'Download anytime', desc: 'Click the filename in the Attachments section to download the file at any time.' },
          ]},
          { type: 'tip', text: 'Attach your project scope document directly to the task — then use AI to generate a project plan from it.' },
        ]
      },
    ]
  },
]

export default function DocsPage() {
  const [activeCategory, setActiveCategory] = useState('Getting Started')
  const [activeArticle, setActiveArticle] = useState<string | null>('create-account')

  const currentCat = DOCS.find(d => d.category === activeCategory)
  const currentArticle = currentCat?.articles.find(a => a.id === activeArticle)

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-syne font-black text-xl">Nex<span className="text-accent">Plan</span></Link>
            <span className="text-border">|</span>
            <span className="text-muted text-sm">How It Works</span>
          </div>
          <Link href="/dashboard" className="btn-primary text-sm px-4 py-2">Go to Dashboard →</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-8">

        {/* Left sidebar — categories */}
        <div className="w-56 shrink-0 space-y-1 sticky top-6 self-start">
          <p className="text-xs font-syne font-bold text-muted uppercase tracking-widest mb-4">Documentation</p>
          {DOCS.map(cat => (
            <div key={cat.category}>
              <button onClick={() => { setActiveCategory(cat.category); setActiveArticle(cat.articles[0].id) }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                  ${activeCategory === cat.category ? 'bg-accent/10 text-accent border border-accent/30' : 'text-muted hover:text-text hover:bg-surface2'}`}>
                <span>{cat.icon}</span>{cat.category}
              </button>
              {activeCategory === cat.category && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                  {cat.articles.map(a => (
                    <button key={a.id} onClick={() => setActiveArticle(a.id)}
                      className={`w-full text-left py-1.5 text-xs transition-colors truncate
                        ${activeArticle === a.id ? 'text-accent font-semibold' : 'text-muted hover:text-text'}`}>
                      {a.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="pt-4 border-t border-border mt-4">
            <p className="text-xs text-muted mb-2 font-semibold">Quick Links</p>
            {[
              { icon: '⚡', label: 'AI Generator',      id: 'ai-project-generator', cat: 'AI Features' },
              { icon: '📊', label: 'Status Reports',    id: 'ai-status-reports',    cat: 'AI Features' },
              { icon: '👥', label: 'Resource Report',   id: 'resource-report',      cat: 'Reports' },
              { icon: '✅', label: 'My Tasks',          id: 'my-tasks',             cat: 'Team Members' },
            ].map(q => (
              <button key={q.id} onClick={() => { setActiveCategory(q.cat); setActiveArticle(q.id) }}
                className="w-full text-left px-2 py-1.5 text-xs text-muted hover:text-accent transition-colors flex items-center gap-2">
                <span>{q.icon}</span>{q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Centre — article list */}
        <div className="w-56 shrink-0">
          <p className="text-xs font-syne font-bold text-muted uppercase tracking-widest mb-4">{currentCat?.icon} {activeCategory}</p>
          <div className="space-y-2">
            {currentCat?.articles.map(a => (
              <button key={a.id} onClick={() => setActiveArticle(a.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all
                  ${activeArticle === a.id
                    ? 'bg-accent/10 border-accent/30 text-text'
                    : 'bg-surface2 border-border text-muted hover:border-accent/20 hover:text-text'}`}>
                <p className="text-sm font-semibold leading-tight">{a.title}</p>
                <p className="text-[10px] mt-1 opacity-60">{a.time}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right — article content */}
        <div className="flex-1 min-w-0">
          {currentArticle ? (
            <div className="card max-w-2xl">
              <div className="mb-6">
                <p className="text-xs font-mono-code text-accent mb-2">{currentCat?.icon} {activeCategory}</p>
                <h1 className="font-syne font-black text-2xl mb-1">{currentArticle.title}</h1>
                <p className="text-xs text-muted">{currentArticle.time}</p>
              </div>

              <div className="space-y-6">
                {currentArticle.content.map((block: any, i: number) => {
                  if (block.type === 'intro') return (
                    <p key={i} className="text-muted leading-relaxed">{block.text}</p>
                  )
                  if (block.type === 'steps') return (
                    <div key={i} className="space-y-3">
                      {block.items.map((s: any) => (
                        <div key={s.step} className="flex gap-4 p-4 bg-surface2 rounded-xl border border-border">
                          <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-mono-code font-bold text-xs shrink-0 mt-0.5">
                            {s.step}
                          </div>
                          <div>
                            <p className="font-semibold text-sm mb-1">{s.title}</p>
                            <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                  if (block.type === 'tip') return (
                    <div key={i} className="flex gap-3 p-4 bg-accent3/10 border border-accent3/30 rounded-xl">
                      <span className="text-lg shrink-0">💡</span>
                      <p className="text-sm text-accent3 leading-relaxed">{block.text}</p>
                    </div>
                  )
                  return null
                })}
              </div>

              {/* Next article */}
              {(() => {
                const arts = currentCat?.articles || []
                const idx = arts.findIndex(a => a.id === activeArticle)
                const next = arts[idx + 1]
                return next ? (
                  <div className="mt-8 pt-6 border-t border-border flex justify-end">
                    <button onClick={() => setActiveArticle(next.id)}
                      className="btn-ghost text-sm px-4 py-2 flex items-center gap-2">
                      Next: {next.title} →
                    </button>
                  </div>
                ) : null
              })()}
            </div>
          ) : (
            <div className="card text-center py-16 text-muted">Select an article to read</div>
          )}
        </div>
      </div>
    </div>
  )
}
