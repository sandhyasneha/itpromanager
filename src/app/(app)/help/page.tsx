'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getErrorDef } from '@/lib/errorCodes'

interface Step { step: string; detail?: string }
interface Guide {
  id: string; icon: string; title: string; subtitle: string
  category: string; color: string; estimated: string
  steps: Step[]; tips?: string[]; related?: string[]
}

// ── Existing guides (unchanged) ───────────────────────────────────────────
const GUIDES: Guide[] = [
  {
    id: 'create-project', icon: '🆕', title: 'Create Your First Project',
    subtitle: 'Set up a project manually or with AI', category: 'Getting Started',
    color: '#00d4ff', estimated: '2 min',
    steps: [
      { step: 'Click the "+ Project" button in the top-left sidebar', detail: 'The button appears above your project list. If you have no projects yet, you will also see a "Create First Project" button in the main area.' },
      { step: 'Enter your Project Name', detail: 'Use a clear, specific name — e.g. "OSPF to BGP Migration — Singapore" not just "Network Project".' },
      { step: 'Set Start Date and End Date', detail: 'These dates are required for the Gantt Timeline and PCR workflow. Click the date fields and select from the calendar.' },
      { step: 'Choose: Manual or AI Generation', detail: 'For Manual: click "+ Manual (no AI)" and your empty project is created. For AI: add a project description (next guide).' },
      { step: 'Your project appears in the sidebar', detail: 'Click the project name at any time to switch between projects. All data is saved automatically.' },
    ],
    tips: [
      'Be specific with project names — you may have multiple projects running simultaneously',
      'Always set dates — they unlock the Gantt Timeline and PCR workflow',
      'You can edit name, dates and colour anytime from the ✏️ edit button',
    ],
  },
  {
    id: 'ai-project', icon: '🤖', title: 'Generate a Project with AI',
    subtitle: 'Let AI create all tasks automatically', category: 'Getting Started',
    color: '#7c3aed', estimated: '3 min',
    steps: [
      { step: 'Click "+ Project" and fill in the Project Name and Dates', detail: 'All three fields are required before AI generation can run.' },
      { step: 'Write a detailed Project Description', detail: 'The more detail you provide, the better the AI tasks. Include: technology stack, locations, team size, key deliverables and any constraints.' },
      { step: 'Click "🤖 Generate with AI"', detail: 'AI analyses your description and generates 6–12 IT-specific tasks with start/end dates, priorities and relevant tags. This takes 5–10 seconds.' },
      { step: 'Review the generated tasks in the Preview table', detail: 'Check each task title, priority, start date and end date. Verify the tasks make sense for your project. You can regenerate if needed.' },
      { step: 'Click "✅ Create Project + X Tasks"', detail: 'Your project is created and all tasks are added to the Kanban Backlog column automatically.' },
      { step: 'Move tasks as work progresses', detail: 'Drag tasks from Backlog → In Progress → Review → Done as your team completes work.' },
    ],
    tips: [
      'Write at least 2–3 sentences in the description for best AI results',
      'Mention specific technologies (e.g. "Palo Alto", "Azure", "Cisco IOS") for IT-specific tasks',
      'Click "🔄 Regenerate" if the first set of tasks is not quite right',
      'After creation, you can add, edit or delete any AI-generated task',
    ],
  },
  {
    id: 'create-task', icon: '✅', title: 'Create & Manage Tasks',
    subtitle: 'Add tasks, set dates and track progress', category: 'Getting Started',
    color: '#22d3a5', estimated: '2 min',
    steps: [
      { step: 'Find the column where you want to add a task', detail: 'Tasks can be added to any column: Backlog, In Progress, Review, Blocked or Done.' },
      { step: 'Click "+ Add task" at the bottom of the column', detail: 'A text input appears at the bottom of the column.' },
      { step: 'Type the task title and press Enter or click the ✓ button', detail: 'Keep task titles clear and action-oriented — e.g. "Configure BGP on SG-RTR-01".' },
      { step: 'Click the task card to open the detail panel', detail: 'The right-side panel opens with all task fields: description, priority, assignee, dates and tags.' },
      { step: 'Fill in task details', detail: 'Add: Description, Priority (Low/Medium/High/Critical), Assignee Name, Start Date, End Date, Due Date and Tags.' },
      { step: 'Click "Save Changes" to update the task', detail: 'Changes are saved to the database immediately.' },
      { step: 'Drag the task to update its status', detail: 'Grab the task card and drag it to a different column to change its status.' },
    ],
    tips: [
      'Set Due Date = End Date for most tasks — the Gantt uses End Date for the timeline bar',
      'Use Tags to group related tasks (e.g. "network", "firewall", "testing")',
      'Mark tasks as Critical priority to highlight them in red on the Gantt chart',
      'Tasks with no start date will not appear on the Gantt Timeline',
    ],
  },
  {
    id: 'set-dates', icon: '📅', title: 'Setting Task & Project Dates',
    subtitle: 'Dates power the Gantt and notifications', category: 'Getting Started',
    color: '#00d4ff', estimated: '2 min',
    steps: [
      { step: 'Open a task by clicking on its card', detail: 'The detail panel opens on the right side of the screen.' },
      { step: 'Set Start Date — when work begins', detail: 'This is when you plan to start this task. The Gantt bar starts here.' },
      { step: 'Set End Date — when work should finish', detail: 'The Gantt bar ends here. This drives the timeline visual.' },
      { step: 'Set Due Date — the hard deadline', detail: 'Due Date triggers overdue alerts and daily digest notifications.' },
      { step: 'Project dates are set separately', detail: 'Edit your project with the ✏️ button → Details tab. Project Start and End dates define the boundaries for PCR and the overall timeline view.' },
    ],
    tips: [
      'All three date fields are independent — set all three for best Gantt and notification accuracy',
      'Tasks with no dates still appear on the Kanban board but not on the Gantt Timeline',
      'Overdue alerts fire when today is past the Due Date and the task is not Done',
    ],
  },
  {
    id: 'gantt-view', icon: '📊', title: 'Using the Gantt Timeline',
    subtitle: 'Visualise your project schedule', category: 'Gantt & Timeline',
    color: '#22d3a5', estimated: '3 min',
    steps: [
      { step: 'Click the "📅 Timeline" button in the toolbar', detail: 'The toolbar is at the top of the Kanban Board page.' },
      { step: 'The Gantt chart shows all tasks with dates', detail: 'Each task row has a coloured bar spanning its start to end date.' },
      { step: 'Read the colour coding', detail: '🟢 Green = Done. 🔴 Red = Critical. 🔵 Blue = In Progress. 🟡 Amber = Review. ⚫ Grey = Backlog.' },
      { step: 'Check the progress bar inside each task bar', detail: 'Backlog=0%, In Progress=50%, Review=80%, Done=100%.' },
      { step: 'Scroll horizontally to navigate time', detail: 'Today is highlighted with a vertical line.' },
      { step: 'Download the Timeline', detail: 'Click "⬇ Download" → choose TXT or CSV format.' },
    ],
    tips: [
      'Done tasks always show green regardless of critical status',
      'The Gantt auto-scrolls to today when first loaded',
      'Tasks are sorted by start date — earliest tasks appear at the top',
    ],
  },
  {
    id: 'download-plan', icon: '⬇️', title: 'Downloading Your Project Plan',
    subtitle: 'Export tasks and timeline as files', category: 'Gantt & Timeline',
    color: '#22d3a5', estimated: '1 min',
    steps: [
      { step: 'Click the "📋 Plan" button in the toolbar', detail: 'This opens the Download Plan modal.' },
      { step: 'Choose TXT or CSV format', detail: 'TXT is for email or documents. CSV is for Excel or Google Sheets.' },
      { step: 'Click the download button', detail: 'The file downloads immediately.' },
      { step: 'For timeline-only export, use the Timeline view', detail: 'Switch to Timeline view first, then click the download button.' },
    ],
    tips: [
      'TXT format is great to paste into a stakeholder email',
      'CSV format imports cleanly into Excel for further formatting',
    ],
  },
  {
    id: 'create-pcr', icon: '🔀', title: 'Raising a Project Change Request (PCR)',
    subtitle: 'Manage scope and date changes formally', category: 'PCR & Risk Register',
    color: '#f59e0b', estimated: '4 min',
    steps: [
      { step: 'Your project must have Start and End dates set', detail: 'If you see a warning, click the ✏️ project edit button and set dates first.' },
      { step: 'Click "🔀 PCR" in the toolbar', detail: 'This opens the PCR Manager.' },
      { step: 'Click "+ New PCR" to start a new change request', detail: 'A blank form appears.' },
      { step: 'Fill in the PCR details', detail: 'Title, Reason, Impact, and New End Date are required.' },
      { step: 'Click "✨ Generate AI Document"', detail: 'AI generates a professional PCR document. This takes 5–10 seconds.' },
      { step: 'Review and save the PCR', detail: 'Edit if needed. Click "Save PCR" to record it.' },
      { step: 'Update the PCR status as it progresses', detail: 'Draft → Under Review → Approved or Rejected. When Approved, click "Apply Date Change".' },
    ],
    tips: [
      'Each PCR is auto-numbered PCR-001, PCR-002 etc.',
      'Only Approved PCRs should have the date change applied',
      'Keep a record of all PCRs even if rejected',
    ],
  },
  {
    id: 'risk-register', icon: '🛡️', title: 'Managing Risks & Issues',
    subtitle: 'RAG status, mitigation and tracking', category: 'PCR & Risk Register',
    color: '#ef4444', estimated: '4 min',
    steps: [
      { step: 'Click "🛡️ Risks" in the toolbar', detail: 'The Risk & Issue Register modal opens.' },
      { step: 'Choose the correct tab: Risk Register or Issue Register', detail: 'A Risk is something that might happen. An Issue has already happened.' },
      { step: 'Click "+ Add Risk" or "+ Add Issue"', detail: 'The Add form opens.' },
      { step: 'Complete the risk details', detail: 'Title, Description, RAG Status, Probability, Impact and Owner are required.' },
      { step: 'Use "✨ AI Suggest" for mitigation plan', detail: 'Fill Title and Description first, then click AI Suggest.' },
      { step: 'Set Owner, Status and Review Date', detail: 'Status: Open, Mitigated, or Closed.' },
      { step: 'Click "Add Risk" to save', detail: 'The RAG dashboard updates automatically.' },
    ],
    tips: [
      'Red risks should have a mitigation plan and owner assigned immediately',
      'Review your risk register at every project status meeting',
      'AI mitigation suggestions are IT-specific',
    ],
  },
  {
    id: 'status-report', icon: '📊', title: 'Generating an AI Status Report',
    subtitle: 'One-click professional stakeholder report', category: 'AI Features',
    color: '#7c3aed', estimated: '3 min',
    steps: [
      { step: 'Click "📊 Report" in the toolbar', detail: 'The Status Report modal opens.' },
      { step: 'Go to the ⚙️ Settings tab first', detail: 'Configure: Report Frequency, Report Day, and Stakeholder Emails.' },
      { step: 'Click "Save Communication Settings"', detail: 'Settings are saved per-project.' },
      { step: 'Go to the 📊 Generate tab', detail: 'You will see a summary of your current tasks and open risks.' },
      { step: 'Click "🤖 Generate Report"', detail: 'AI analyses all your tasks, risks and issues. Takes 5–10 seconds.' },
      { step: 'Review the report on screen', detail: 'Shows: RAG banner, executive summary, health indicators, accomplishments, blockers and next period plan.' },
      { step: 'Download or email the report', detail: 'Click "📄 Download TXT" or "📧 Email to Stakeholders".' },
    ],
    tips: [
      'Configure stakeholder emails before generating',
      'You can regenerate as many times as needed before sending',
      'Reports are stored in history for audit trails',
    ],
  },
  {
    id: 'notifications-setup', icon: '🔔', title: 'Setting Up Notifications',
    subtitle: 'Due reminders, daily digest and overdue alerts', category: 'AI Features',
    color: '#22d3a5', estimated: '2 min',
    steps: [
      { step: 'Click "🔔 Alerts" in the toolbar', detail: 'The Notification Settings modal opens.' },
      { step: 'Enter your Notification Email', detail: 'Pre-filled with your account email.' },
      { step: 'Configure Due Date Reminders', detail: 'Toggle ON. Choose 1, 2 or 3 days before. Click "Send Test" to verify.' },
      { step: 'Configure Daily Digest', detail: 'Toggle ON. Set the time. Default is 08:00.' },
      { step: 'Configure Overdue Alerts', detail: 'Toggle ON. Fires when a task passes Due Date and is not Done.' },
      { step: 'Click "Save Notification Settings"', detail: 'Settings are saved per-project.' },
    ],
    tips: [
      'Test all three notification types when first setting up',
      'Notifications are per-project — configure each project separately',
    ],
  },
  {
    id: 'attachment', icon: '📎', title: 'Attaching Documents to a Project',
    subtitle: 'Upload SOW, project charter or reference docs', category: 'AI Features',
    color: '#00d4ff', estimated: '2 min',
    steps: [
      { step: 'Click the ✏️ edit button on your project', detail: 'This opens the Edit Project modal.' },
      { step: 'Click the "📎 Attachment" tab', detail: 'Shows existing attachment or an upload area.' },
      { step: 'Click the upload area to select a file', detail: 'Supported: PDF, Word (.docx), Text (.txt). Max 10MB.' },
      { step: 'Wait for the upload to complete', detail: 'You will see "✅ Uploaded successfully" when done.' },
      { step: 'Use View or Remove buttons', detail: 'View opens in a new tab. Remove deletes from storage.' },
    ],
    tips: [
      'Good docs to attach: Project Charter, SOW, Technical Specification, Network Diagrams',
    ],
  },

  // ── SUPPORT GUIDES (Phase 6) ──────────────────────────────
  {
    id: 'raise-ticket', icon: '🎫', title: 'Raising a Support Ticket',
    subtitle: 'Get help from the NexPlan team', category: 'Support',
    color: '#ef4444', estimated: '2 min',
    steps: [
      { step: 'Go to Settings in the left sidebar', detail: 'Settings is at the bottom of the left sidebar.' },
      { step: 'Scroll down to the Help & Support panel', detail: 'It appears below your profile form. You will see 3 tabs: Error History, My Tickets, and Raise Ticket.' },
      { step: 'Click the "+ Raise Ticket" tab', detail: 'The support ticket form appears.' },
      { step: 'Fill in the Subject', detail: 'Describe your issue briefly — e.g. "AI project generation not working" or "Email not sending".' },
      { step: 'Enter your Error Code if you have one', detail: 'If NexPlan showed you an error code (e.g. NXP-1001), enter it here. It helps the support team find the exact cause immediately. Leave blank if you do not have one.' },
      { step: 'Select Priority', detail: 'Low = minor inconvenience. Medium = feature not working. High = blocking your work. Critical = complete outage.' },
      { step: 'Write a description of your issue', detail: 'Describe what happened, what you were doing at the time, and what you expected to happen. The more detail the better.' },
      { step: 'Click "🎫 Raise Support Ticket"', detail: 'You will see "Ticket Raised!" — the support team is notified immediately.' },
    ],
    tips: [
      'Always include your error code (NXP-XXXX) if you have one — it cuts resolution time significantly',
      'Check your Error History tab first — it auto-fills the ticket form with the error code',
      'You can also email support@nexplan.io directly using the "Open Email ↗" button',
    ],
  },
  {
    id: 'error-history', icon: '🚨', title: 'Viewing Your Error History',
    subtitle: 'See past errors and their codes', category: 'Support',
    color: '#f59e0b', estimated: '1 min',
    steps: [
      { step: 'Go to Settings in the left sidebar', detail: 'Settings is at the bottom of the left sidebar.' },
      { step: 'Scroll down to the Help & Support panel', detail: 'Below your profile form.' },
      { step: 'Click the "📋 Error History" tab', detail: 'Any AI errors you have encountered are listed here.' },
      { step: 'Each entry shows: feature, error code and timestamp', detail: 'For example: "🤖 AI Project Plan — NXP-1001 — 2 hours ago".' },
      { step: 'Click "Raise ticket with this error →"', detail: 'The ticket form opens automatically with the error code and feature pre-filled. Just add a description and submit.' },
    ],
    tips: [
      'If Error History is empty — great news! All your AI features have been working correctly.',
      'Error codes starting with NXP-1xxx are AI errors, NXP-3xxx are email errors',
    ],
  },
  {
    id: 'track-ticket', icon: '📬', title: 'Tracking Your Support Tickets',
    subtitle: 'Check status and read admin responses', category: 'Support',
    color: '#22d3a5', estimated: '1 min',
    steps: [
      { step: 'Go to Settings → Help & Support', detail: 'Scroll down on the Settings page.' },
      { step: 'Click the "🎫 My Tickets" tab', detail: 'All tickets you have raised are listed here.' },
      { step: 'Check the status badge on each ticket', detail: 'Open = being reviewed. In Progress = team is working on it. Resolved = fixed. Closed = completed.' },
      { step: 'Look for the green "💬 Admin Response" box', detail: 'When the support team adds notes or a resolution, it appears here in green.' },
      { step: 'Raise a new ticket if the issue persists', detail: 'Click "+ Raise Ticket" to open a new request if the issue was not fully resolved.' },
    ],
    tips: [
      'You will see status updates reflected in real time — refresh the page if needed',
      'Resolved tickets stay in your history for future reference',
    ],
  },
  {
    id: 'error-codes', icon: '🔍', title: 'Understanding Error Codes',
    subtitle: 'What NXP-XXXX codes mean', category: 'Support',
    color: '#7c3aed', estimated: '2 min',
    steps: [
      { step: 'NexPlan uses structured error codes in the format NXP-XXXX', detail: 'When something goes wrong, you may see a code like NXP-1001 on screen. Note it down.' },
      { step: 'Understand the category from the number range', detail: 'NXP-1xxx = AI/Claude errors. NXP-2xxx = Database errors. NXP-3xxx = Email errors. NXP-4xxx = Login/Auth errors. NXP-5xxx = File/Upload errors. NXP-9xxx = General errors.' },
      { step: 'Include the code when raising a ticket', detail: 'Go to Settings → Help & Support → Raise Ticket and enter the code. It allows the team to identify the exact cause in seconds.' },
      { step: 'Try the action again after a few minutes', detail: 'Many NXP-1xxx errors are temporary AI timeouts. Waiting 1–2 minutes and retrying often resolves them.' },
      { step: 'Contact support if the error persists', detail: 'Raise a ticket or email support@nexplan.io with the error code.' },
    ],
    tips: [
      'NXP-1006 and NXP-1007 are temporary — they usually resolve on their own in a few minutes',
      'NXP-4001 (Login Failed) usually means wrong password — use "Forgot Password" to reset',
      'NXP-3001/3003 (Email errors) — check the assignee email address is correct',
    ],
  },
]

const CATEGORIES = ['All', 'Getting Started', 'Gantt & Timeline', 'PCR & Risk Register', 'AI Features', 'Support']

const CAT_COLORS: Record<string, string> = {
  'Getting Started':    '#00d4ff',
  'Gantt & Timeline':   '#22d3a5',
  'PCR & Risk Register':'#f59e0b',
  'AI Features':        '#7c3aed',
  'Support':            '#ef4444',
}

const CAT_ICONS: Record<string, string> = {
  'All':                '📚',
  'Getting Started':    '🚀',
  'Gantt & Timeline':   '📅',
  'PCR & Risk Register':'🛡️',
  'AI Features':        '🤖',
  'Support':            '🎫',
}

// ── Support Ticket Form (inline, no import needed) ──────────
function SupportTicketForm() {
  const supabase = createClient()
  const [tab, setTab]               = useState<'history' | 'tickets' | 'new'>('new')
  const [subject, setSubject]       = useState('')
  const [description, setDescription] = useState('')
  const [errorCode, setErrorCode]   = useState('')
  const [priority, setPriority]     = useState('medium')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [tickets, setTickets]       = useState<any[]>([])
  const [errorLogs, setErrorLogs]   = useState<any[]>([])
  const [userEmail, setUserEmail]   = useState('')
  const [userName, setUserName]     = useState('')
  const [userId, setUserId]         = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserEmail(user.email ?? '')
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profile) setUserName(profile.full_name || user.email?.split('@')[0] || 'User')
      const [{ data: t }, { data: l }] = await Promise.all([
        supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').eq('user_id', user.id).eq('response_status', 'error').order('created_at', { ascending: false }).limit(20),
      ])
      setTickets(t ?? [])
      setErrorLogs(l ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function submitTicket() {
    if (!subject.trim() || !description.trim()) return
    setSubmitting(true)
    await supabase.from('support_tickets').insert({
      user_id: userId, user_email: userEmail, user_name: userName,
      subject: subject.trim(), description: description.trim(),
      error_code: errorCode.trim().toUpperCase() || null,
      priority, status: 'open',
    })
    setSubmitted(true)
    setSubject(''); setDescription(''); setErrorCode(''); setPriority('medium')
    const { data: t } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setTickets(t ?? [])
    setTimeout(() => { setSubmitted(false); setTab('tickets') }, 2000)
    setSubmitting(false)
  }

  const STATUS_COLORS: Record<string, string> = {
    open:        'text-warn    bg-warn/10    border-warn/30',
    in_progress: 'text-accent  bg-accent/10  border-accent/30',
    resolved:    'text-accent3 bg-accent3/10 border-accent3/30',
    closed:      'text-muted   bg-surface2   border-border',
  }

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), days = Math.floor(diff/86400000)
    if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`
    if (h < 24) return `${h}h ago`; return `${days}d ago`
  }

  const FEATURE_LABELS: Record<string, string> = {
    project_plan: '🤖 AI Project Plan', risk_mitigation: '🛡 Risk Mitigation',
    status_report: '📊 Status Report', pcr_document: '🔀 PCR Document',
    ai_followup: '📧 AI Follow-Up', task_email: '📬 Task Email',
    knowledge_base: '📚 Knowledge Base', export_excel: '📊 Excel Export',
  }

  return (
    <div className="card p-6 mt-8">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">🎫</span>
        <div>
          <h3 className="font-syne font-black text-lg">Support Tickets</h3>
          <p className="text-xs text-muted">Raise a ticket, view your error history, or track existing tickets.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: '🚨 Errors',     value: errorLogs.length,                                    color: 'text-danger  bg-danger/10  border-danger/20'  },
          { label: '🎫 My Tickets', value: tickets.length,                                      color: 'text-warn    bg-warn/10    border-warn/20'    },
          { label: '✅ Resolved',   value: tickets.filter((t:any) => t.status==='resolved').length, color: 'text-accent3 bg-accent3/10 border-accent3/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 border text-center ${s.color}`}>
            <p className="text-[10px] text-muted font-mono-code mb-0.5">{s.label}</p>
            <p className={`font-syne font-black text-2xl ${s.color.split(' ')[0]}`}>{loading ? '…' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-5">
        {([
          ['new',     '+ Raise Ticket'],
          ['history', '📋 Error History'],
          ['tickets', '🎫 My Tickets'],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${tab === t
                ? t === 'new' ? 'bg-danger text-white shadow' : 'bg-surface text-text shadow'
                : 'text-muted hover:text-text'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-xs text-muted py-8 animate-pulse">Loading…</p>

      ) : tab === 'new' ? (
        submitted ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-syne font-bold text-lg mb-1">Ticket Raised!</p>
            <p className="text-xs text-muted">Our team will respond shortly. Redirecting…</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Email option */}
            <div className="bg-accent2/5 border border-accent2/20 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-accent2 mb-0.5">📧 Prefer email?</p>
                <p className="text-[10px] text-muted">Send directly to support@nexplan.io</p>
              </div>
              <a href={`mailto:support@nexplan.io?subject=${encodeURIComponent(subject || 'Support Request')}&body=${encodeURIComponent(`Error Code: ${errorCode || 'N/A'}\n\n${description || 'Please describe your issue here.'}`)}`}
                className="text-xs px-3 py-2 rounded-lg border border-accent2/30 text-accent2 hover:bg-accent2/10 shrink-0 transition-colors">
                Open Email ↗
              </a>
            </div>
            <div>
              <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Subject <span className="text-danger">*</span></label>
              <input className="input text-sm" placeholder="Briefly describe your issue"
                value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Error Code (if any)</label>
                <input className="input text-sm font-mono-code" placeholder="e.g. NXP-1001"
                  value={errorCode} onChange={e => setErrorCode(e.target.value.toUpperCase())} />
                {errorCode && getErrorDef(errorCode) && (
                  <p className="text-[10px] text-accent mt-1">✓ {getErrorDef(errorCode)!.title}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Priority</label>
                <select className="select text-sm" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Description <span className="text-danger">*</span></label>
              <textarea className="input text-sm resize-none h-28"
                placeholder="Describe what happened, what you were doing, and what you expected…"
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <button onClick={submitTicket} disabled={submitting || !subject.trim() || !description.trim()}
              className="btn-primary w-full py-3 text-sm disabled:opacity-40">
              {submitting ? 'Raising Ticket…' : '🎫 Raise Support Ticket'}
            </button>
          </div>
        )

      ) : tab === 'history' ? (
        <div className="space-y-2">
          {errorLogs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-syne font-bold text-sm mb-1">No errors recorded</p>
              <p className="text-xs text-muted">All your AI calls have been successful.</p>
            </div>
          ) : errorLogs.map((log: any) => (
            <div key={log.id} className="bg-surface2 border border-danger/20 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                <p className="text-xs font-semibold">{FEATURE_LABELS[log.feature] ?? log.feature}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {log.error_code && (
                    <span className="text-[10px] font-mono-code font-bold text-danger bg-danger/10 px-2 py-1 rounded-lg border border-danger/30">
                      {log.error_code}
                    </span>
                  )}
                  <span className="text-[10px] text-muted font-mono-code">{timeAgo(log.created_at)}</span>
                </div>
              </div>
              {log.error_code && getErrorDef(log.error_code) && (
                <p className="text-[10px] text-muted mb-2">{getErrorDef(log.error_code)!.userMessage}</p>
              )}
              {log.error_code && (
                <button onClick={() => {
                  setErrorCode(log.error_code)
                  setSubject(`Error with ${FEATURE_LABELS[log.feature] ?? log.feature}`)
                  setDescription(`I encountered error ${log.error_code} while using ${FEATURE_LABELS[log.feature] ?? log.feature} on ${new Date(log.created_at).toLocaleString('en-GB')}.\n\nPlease help resolve this issue.`)
                  setTab('new')
                }} className="text-[10px] text-accent hover:underline font-semibold">
                  Raise ticket with this error →
                </button>
              )}
            </div>
          ))}
        </div>

      ) : (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🎫</p>
              <p className="font-syne font-bold text-sm mb-1">No tickets raised yet</p>
              <button onClick={() => setTab('new')} className="btn-primary text-xs px-4 py-2 mt-2">+ Raise a Ticket</button>
            </div>
          ) : tickets.map((ticket: any) => (
            <div key={ticket.id} className="bg-surface2 border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <p className="font-syne font-bold text-sm">{ticket.subject}</p>
                <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold border capitalize shrink-0 ${STATUS_COLORS[ticket.status]}`}>
                  {ticket.status.replace('_',' ')}
                </span>
              </div>
              <p className="text-xs text-muted mb-2 line-clamp-2">{ticket.description}</p>
              <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted font-mono-code">
                {ticket.error_code && <span className="text-danger font-bold">🚨 {ticket.error_code}</span>}
                <span>Raised {timeAgo(ticket.created_at)}</span>
              </div>
              {ticket.admin_notes && (
                <div className="mt-3 bg-accent3/5 border border-accent3/20 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-accent3 mb-1">💬 Admin Response</p>
                  <p className="text-xs text-muted">{ticket.admin_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Help Centre Page ────────────────────────────────────
export default function HelpCenter() {
  const [selectedCat, setSelectedCat] = useState('All')
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null)
  const [search, setSearch] = useState('')

  const filtered = GUIDES.filter(g => {
    const matchesCat = selectedCat === 'All' || g.category === selectedCat
    const matchesSearch = !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      g.steps.some(s => s.step.toLowerCase().includes(search.toLowerCase()))
    return matchesCat && matchesSearch
  })

  const grouped = CATEGORIES.slice(1).reduce((acc, cat) => {
    const guides = filtered.filter(g => g.category === cat)
    if (guides.length > 0) acc[cat] = guides
    return acc
  }, {} as Record<string, Guide[]>)

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-2">// Help Center</p>
        <h1 className="font-syne font-black text-3xl mb-2">How-To Guides & Support</h1>
        <p className="text-muted text-sm">Step-by-step instructions for every NexPlan feature — and raise a support ticket if you need help.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
        <input className="input pl-10 w-full max-w-lg"
          placeholder="Search guides… e.g. 'create task', 'risk register', 'support ticket'"
          value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCat(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all
              ${selectedCat === cat
                ? 'bg-accent/10 border-accent/40 text-accent'
                : 'bg-surface2 border-border text-muted hover:text-text'}`}>
            {CAT_ICONS[cat]} {cat === 'All' ? 'All Guides' : cat}
            <span className="ml-1.5 font-mono-code opacity-60">
              ({cat === 'All' ? GUIDES.length : GUIDES.filter(g => g.category === cat).length})
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guide list */}
        <div className="lg:col-span-1 space-y-6">
          {Object.entries(grouped).map(([cat, guides]) => (
            <div key={cat}>
              <p className="text-xs font-syne font-bold uppercase tracking-widest mb-2"
                style={{ color: CAT_COLORS[cat] || '#6b7280' }}>
                {CAT_ICONS[cat]} {cat}
              </p>
              <div className="space-y-1.5">
                {guides.map(guide => (
                  <button key={guide.id} onClick={() => setSelectedGuide(guide)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all
                      ${selectedGuide?.id === guide.id ? 'shadow-md' : 'border-border bg-surface hover:bg-surface2'}`}
                    style={selectedGuide?.id === guide.id
                      ? { borderColor: guide.color + '50', background: guide.color + '10' } : {}}>
                    <span className="text-xl shrink-0 mt-0.5">{guide.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm leading-tight ${selectedGuide?.id === guide.id ? 'text-text' : 'text-text/80'}`}>
                        {guide.title}
                      </p>
                      <p className="text-xs text-muted mt-0.5 truncate">{guide.subtitle}</p>
                    </div>
                    <span className="text-[10px] font-mono-code text-muted shrink-0 mt-1">{guide.estimated}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm">No guides found for "{search}"</p>
              <button onClick={() => setSearch('')} className="text-xs text-accent mt-2 hover:underline">Clear search</button>
            </div>
          )}
        </div>

        {/* Guide detail */}
        <div className="lg:col-span-2">
          {!selectedGuide ? (
            <div className="card p-8 text-center sticky top-6">
              <p className="text-4xl mb-4">👈</p>
              <p className="font-syne font-bold text-lg mb-2">Select a guide to get started</p>
              <p className="text-muted text-sm mb-6">Choose any guide from the left to see step-by-step instructions</p>
              <div className="grid grid-cols-2 gap-3 text-left">
                {GUIDES.slice(0, 4).map(g => (
                  <button key={g.id} onClick={() => setSelectedGuide(g)}
                    className="flex items-start gap-3 p-3 bg-surface2 rounded-xl border border-border hover:border-accent/30 transition-colors text-left">
                    <span className="text-xl">{g.icon}</span>
                    <div>
                      <p className="font-semibold text-xs">{g.title}</p>
                      <p className="text-[10px] text-muted mt-0.5">{g.estimated}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted mt-4">👆 Or pick one of these popular guides</p>
            </div>
          ) : (
            <div className="card overflow-hidden sticky top-6">
              <div className="p-6 border-b border-border"
                style={{ background: selectedGuide.color + '08', borderColor: selectedGuide.color + '20' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{selectedGuide.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full border font-semibold"
                          style={{ color: selectedGuide.color, borderColor: selectedGuide.color + '40', background: selectedGuide.color + '15' }}>
                          {selectedGuide.category}
                        </span>
                        <span className="text-[10px] text-muted font-mono-code">⏱ {selectedGuide.estimated}</span>
                      </div>
                      <h2 className="font-syne font-black text-xl">{selectedGuide.title}</h2>
                      <p className="text-sm text-muted mt-0.5">{selectedGuide.subtitle}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedGuide(null)} className="text-muted hover:text-text shrink-0">✕</button>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <p className="text-xs font-syne font-bold text-muted uppercase tracking-widest mb-4">
                  Step-by-Step Instructions
                </p>
                <div className="space-y-4">
                  {selectedGuide.steps.map((s, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white font-mono-code shrink-0"
                          style={{ background: selectedGuide.color }}>
                          {i + 1}
                        </div>
                        {i < selectedGuide.steps.length - 1 && (
                          <div className="w-px flex-1 mt-2" style={{ background: selectedGuide.color + '30', minHeight: 16 }}/>
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="font-semibold text-sm text-text">{s.step}</p>
                        {s.detail && (
                          <p className="text-xs text-muted mt-1.5 leading-relaxed bg-surface2 rounded-xl px-3 py-2.5">
                            {s.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedGuide.tips && selectedGuide.tips.length > 0 && (
                  <div className="mt-6 bg-accent2/5 border border-accent2/20 rounded-xl p-4">
                    <p className="text-xs font-syne font-bold text-accent2 mb-3 uppercase tracking-wide">💡 Pro Tips</p>
                    <ul className="space-y-2">
                      {selectedGuide.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text/70">
                          <span className="text-accent2 mt-0.5 shrink-0">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <button onClick={() => {
                    const idx = GUIDES.findIndex(g => g.id === selectedGuide.id)
                    if (idx > 0) setSelectedGuide(GUIDES[idx - 1])
                  }} disabled={GUIDES.findIndex(g => g.id === selectedGuide.id) === 0}
                    className="flex items-center gap-2 text-xs text-muted hover:text-text disabled:opacity-30 font-semibold transition-colors">
                    ← Previous Guide
                  </button>
                  <span className="text-xs font-mono-code text-muted">
                    {GUIDES.findIndex(g => g.id === selectedGuide.id) + 1} / {GUIDES.length}
                  </span>
                  <button onClick={() => {
                    const idx = GUIDES.findIndex(g => g.id === selectedGuide.id)
                    if (idx < GUIDES.length - 1) setSelectedGuide(GUIDES[idx + 1])
                  }} disabled={GUIDES.findIndex(g => g.id === selectedGuide.id) === GUIDES.length - 1}
                    className="flex items-center gap-2 text-xs text-muted hover:text-text disabled:opacity-30 font-semibold transition-colors">
                    Next Guide →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Support Ticket Form — always visible at bottom */}
      <SupportTicketForm />

      {/* Footer */}
      <div className="mt-8 bg-surface2 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-syne font-bold">Still need help?</p>
          <p className="text-muted text-sm mt-1">Email us directly and we'll respond within 24 hours.</p>
        </div>
        <a href="mailto:support@nexplan.io" className="btn-primary px-6 py-2.5 text-sm shrink-0">
          📧 Email Support
        </a>
      </div>
    </div>
  )
}
