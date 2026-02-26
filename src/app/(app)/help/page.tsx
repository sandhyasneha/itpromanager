'use client'
import { useState } from 'react'

interface Step {
  step: string
  detail?: string
}
interface Guide {
  id: string
  icon: string
  title: string
  subtitle: string
  category: string
  color: string
  estimated: string
  steps: Step[]
  tips?: string[]
  related?: string[]
}

const GUIDES: Guide[] = [
  // ── GETTING STARTED ────────────────────────────────────────
  {
    id: 'create-project',
    icon: '🆕',
    title: 'Create Your First Project',
    subtitle: 'Set up a project manually or with AI',
    category: 'Getting Started',
    color: '#00d4ff',
    estimated: '2 min',
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
    id: 'ai-project',
    icon: '🤖',
    title: 'Generate a Project with AI',
    subtitle: 'Let AI create all tasks automatically',
    category: 'Getting Started',
    color: '#7c3aed',
    estimated: '3 min',
    steps: [
      { step: 'Click "+ Project" and fill in the Project Name and Dates', detail: 'All three fields are required before AI generation can run.' },
      { step: 'Write a detailed Project Description', detail: 'The more detail you provide, the better the AI tasks. Include: technology stack, locations, team size, key deliverables and any constraints. Example: "Migrate 15 Cisco routers from OSPF to BGP across Singapore, Hong Kong and India data centres. Includes pre-checks, config backup, staged cutover windows and rollback plans."' },
      { step: 'Click "🤖 Generate with AI"', detail: 'AI analyses your description and generates 6–12 IT-specific tasks with start/end dates, priorities and relevant tags. This takes 5–10 seconds.' },
      { step: 'Review the generated tasks in the Preview table', detail: 'Check each task title, priority, start date and end date. Verify the tasks make sense for your project. You can regenerate if needed.' },
      { step: 'Click "✅ Create Project + X Tasks"', detail: 'Your project is created and all tasks are added to the Kanban Backlog column automatically. The page reloads to show your populated board.' },
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
    id: 'create-task',
    icon: '✅',
    title: 'Create & Manage Tasks',
    subtitle: 'Add tasks, set dates and track progress',
    category: 'Getting Started',
    color: '#22d3a5',
    estimated: '2 min',
    steps: [
      { step: 'Find the column where you want to add a task', detail: 'Tasks can be added to any column: Backlog, In Progress, Review, Blocked or Done. Most new tasks should go into Backlog.' },
      { step: 'Click "+ Add task" at the bottom of the column', detail: 'A text input appears at the bottom of the column.' },
      { step: 'Type the task title and press Enter or click the ✓ button', detail: 'Keep task titles clear and action-oriented — e.g. "Configure BGP on SG-RTR-01" not just "Router".' },
      { step: 'Click the task card to open the detail panel', detail: 'The right-side panel opens with all task fields: description, priority, assignee, dates and tags.' },
      { step: 'Fill in task details', detail: 'Add: Description (what needs to be done), Priority (Low/Medium/High/Critical), Assignee Name, Start Date, End Date, Due Date and Tags.' },
      { step: 'Click "Save Changes" to update the task', detail: 'Changes are saved to the database immediately.' },
      { step: 'Drag the task to update its status', detail: 'Grab the task card and drag it to a different column to change its status. The status updates automatically.' },
    ],
    tips: [
      'Set Due Date = End Date for most tasks — the Gantt uses End Date for the timeline bar',
      'Use Tags to group related tasks (e.g. "network", "firewall", "testing")',
      'Mark tasks as Critical priority to highlight them in red on the Gantt chart',
      'Tasks with no start date will not appear on the Gantt Timeline',
    ],
  },
  {
    id: 'set-dates',
    icon: '📅',
    title: 'Setting Task & Project Dates',
    subtitle: 'Dates power the Gantt and notifications',
    category: 'Getting Started',
    color: '#00d4ff',
    estimated: '2 min',
    steps: [
      { step: 'Open a task by clicking on its card', detail: 'The detail panel opens on the right side of the screen.' },
      { step: 'Set Start Date — when work begins', detail: 'This is when you plan to start this task. The Gantt bar starts here.' },
      { step: 'Set End Date — when work should finish', detail: 'The Gantt bar ends here. This drives the timeline visual.' },
      { step: 'Set Due Date — the hard deadline', detail: 'Due Date triggers overdue alerts and daily digest notifications. Often the same as End Date but can differ — e.g. a task might end on Friday but the hard sign-off deadline is Monday.' },
      { step: 'Project dates are set separately', detail: 'Edit your project with the ✏️ button → Details tab. Project Start and End dates define the boundaries for PCR and the overall timeline view.' },
    ],
    tips: [
      'All three date fields are independent — set all three for best Gantt and notification accuracy',
      'Tasks with no dates still appear on the Kanban board but not on the Gantt Timeline',
      'Overdue alerts fire when today is past the Due Date and the task is not Done',
      'The Gantt auto-scrolls to today\'s date when you open the Timeline view',
    ],
  },

  // ── GANTT & TIMELINE ───────────────────────────────────────
  {
    id: 'gantt-view',
    icon: '📊',
    title: 'Using the Gantt Timeline',
    subtitle: 'Visualise your project schedule',
    category: 'Gantt & Timeline',
    color: '#22d3a5',
    estimated: '3 min',
    steps: [
      { step: 'Click the "📅 Timeline" button in the toolbar', detail: 'The toolbar is at the top of the Kanban Board page. Timeline is the second button after Board.' },
      { step: 'The Gantt chart shows all tasks with dates', detail: 'Each task row has a coloured bar spanning its start to end date. Tasks without dates are listed at the bottom as unscheduled.' },
      { step: 'Read the colour coding', detail: '🟢 Green = Done tasks (always green, always 100%). 🔴 Red = Critical priority tasks. 🔵 Blue = In Progress. 🟡 Amber = Review. ⚫ Grey = Backlog.' },
      { step: 'Check the progress bar inside each task bar', detail: 'The filled portion of the bar shows progress percentage: Backlog=0%, In Progress=50%, Review=80%, Done=100%.' },
      { step: 'Identify critical path tasks', detail: 'Tasks marked as Critical priority appear in red. These are your highest-risk tasks that could delay the project if not completed on time.' },
      { step: 'Scroll horizontally to navigate time', detail: 'The chart shows daily columns. Scroll right to see future dates, left to see past dates. Today is highlighted with a vertical line.' },
      { step: 'Download the Timeline', detail: 'Click "⬇ Download" → choose TXT or CSV format to export the timeline data for reporting or sharing.' },
    ],
    tips: [
      'Done tasks always show green regardless of critical status — so you can see completed critical work clearly',
      'Weekend columns are slightly dimmed to help identify working days',
      'The Gantt auto-scrolls to today when first loaded',
      'Tasks are sorted by start date — earliest tasks appear at the top',
    ],
  },
  {
    id: 'download-plan',
    icon: '⬇️',
    title: 'Downloading Your Project Plan',
    subtitle: 'Export tasks and timeline as files',
    category: 'Gantt & Timeline',
    color: '#22d3a5',
    estimated: '1 min',
    steps: [
      { step: 'Click the "📋 Plan" button in the toolbar', detail: 'This opens the Download Plan modal which shows all tasks sorted by start date.' },
      { step: 'Choose TXT or CSV format', detail: 'TXT is formatted for email or documents. CSV is for importing into Excel or Google Sheets.' },
      { step: 'Click the download button', detail: 'The file is downloaded to your browser immediately. No server required.' },
      { step: 'For timeline-only export, use the Timeline view', detail: 'Switch to Timeline view first, then click the download button to get only the Gantt data.' },
    ],
    tips: [
      'TXT format is great to paste into a stakeholder email or Word document',
      'CSV format imports cleanly into Excel for further formatting',
    ],
  },

  // ── PCR & RISK ─────────────────────────────────────────────
  {
    id: 'create-pcr',
    icon: '🔀',
    title: 'Raising a Project Change Request (PCR)',
    subtitle: 'Manage scope and date changes formally',
    category: 'PCR & Risk Register',
    color: '#f59e0b',
    estimated: '4 min',
    steps: [
      { step: 'Your project must have Start and End dates set', detail: 'PCR requires project dates. If you see a warning, click the ✏️ project edit button and set dates in the Details tab first.' },
      { step: 'Click "🔀 PCR" in the toolbar', detail: 'This opens the PCR Manager. The left panel shows existing PCRs; the right panel shows the form.' },
      { step: 'Click "+ New PCR" to start a new change request', detail: 'A blank form appears. Fill in all required fields.' },
      { step: 'Fill in the PCR details', detail: 'Title: Clear description of the change (e.g. "Extend HK Cutover by 2 Weeks"). Reason: Why is the change needed? Impact: What does this affect (scope, budget, timeline)? New End Date: The proposed new project end date.' },
      { step: 'Click "✨ Generate AI Document"', detail: 'AI generates a professional PCR document including: change summary, justification, impact analysis, risks and recommendation. This takes 5–10 seconds.' },
      { step: 'Review and save the PCR', detail: 'Read the AI-generated document. Edit if needed. Click "Save PCR" to record it.' },
      { step: 'Update the PCR status as it progresses', detail: 'Change status from Draft → Under Review → Approved or Rejected. When Approved, click "Apply Date Change" to automatically update your project end date.' },
    ],
    tips: [
      'Each PCR is auto-numbered PCR-001, PCR-002 etc. for formal tracking',
      'The AI document is a starting point — always review and edit before sending to sponsors',
      'Only Approved PCRs should have the date change applied to the project',
      'Keep a record of all PCRs even if rejected — they form your change history',
    ],
  },
  {
    id: 'risk-register',
    icon: '🛡️',
    title: 'Managing Risks & Issues',
    subtitle: 'RAG status, mitigation and tracking',
    category: 'PCR & Risk Register',
    color: '#ef4444',
    estimated: '4 min',
    steps: [
      { step: 'Click "🛡️ Risks" in the toolbar', detail: 'The Risk & Issue Register modal opens. You will see the RAG dashboard at the top showing counts of Red/Amber/Green risks and open issues.' },
      { step: 'Choose the correct tab: Risk Register or Issue Register', detail: 'A Risk is something that might happen (probabilistic). An Issue is something that has already happened and needs resolution.' },
      { step: 'Click "+ Add Risk" or "+ Add Issue"', detail: 'The Add form opens. Fill in all required fields.' },
      { step: 'Complete the risk details', detail: 'Title: Brief risk name. Description: Full explanation. RAG Status: Red (critical), Amber (watch), Green (low concern). Probability: How likely? Impact: If it occurs, how bad? Owner: Who is responsible for monitoring this risk?' },
      { step: 'Use "✨ AI Suggest" for mitigation plan', detail: 'Fill in Title and Description first, then click AI Suggest. AI generates a specific mitigation plan with bullet-pointed actions. You can edit or replace it.' },
      { step: 'Set Owner, Status and Review Date', detail: 'Status: Open (active risk), Mitigated (actions taken), Closed (no longer relevant). Review Date: When should this risk be re-assessed?' },
      { step: 'Click "Add Risk" to save', detail: 'The risk appears in the register table. The RAG dashboard updates automatically.' },
      { step: 'Update risks regularly', detail: 'Click Edit on any risk to update its RAG status as the project progresses. Risks that have been mitigated should be moved to "Mitigated" status.' },
    ],
    tips: [
      'Red risks should have a mitigation plan and owner assigned immediately',
      'Review your risk register at every project status meeting',
      'Issues need a resolution plan and deadline — treat them more urgently than risks',
      'The RAG dashboard at the top of the register gives your sponsor a quick health view',
      'AI mitigation suggestions are IT-specific — they understand network and infrastructure risks',
    ],
  },

  // ── AI FEATURES ────────────────────────────────────────────
  {
    id: 'status-report',
    icon: '📊',
    title: 'Generating an AI Status Report',
    subtitle: 'One-click professional stakeholder report',
    category: 'AI Features',
    color: '#7c3aed',
    estimated: '3 min',
    steps: [
      { step: 'Click "📊 Report" in the toolbar', detail: 'The Status Report modal opens with three tabs: Settings, Generate and History.' },
      { step: 'Go to the ⚙️ Settings tab first', detail: 'Configure: Report Frequency (Weekly/Fortnightly/Monthly), Report Day (Mon–Fri), and Stakeholder Emails (comma-separated list).' },
      { step: 'Click "Save Communication Settings"', detail: 'Settings are saved per-project. Different projects can have different frequencies and stakeholder lists.' },
      { step: 'Go to the 📊 Generate tab', detail: 'You will see a summary of your current tasks and open risks at the top.' },
      { step: 'Click "🤖 Generate Report"', detail: 'AI analyses all your tasks, risks and issues to generate a professional report. Takes 5–10 seconds.' },
      { step: 'Review the polished report on screen', detail: 'The report shows: coloured RAG banner, executive summary, health indicators (Overall/Schedule/Budget/Scope), accomplishments, in-progress work, blockers, risks summary and next period plan.' },
      { step: 'Download or email the report', detail: 'Click "📄 Download TXT" for a plain text version. Click "📧 Email to Stakeholders" to send the branded HTML email with TXT attachment to all configured stakeholder emails.' },
      { step: 'Check the 🕐 History tab', detail: 'All generated reports are saved with their RAG status and date. You can see your full reporting history here.' },
    ],
    tips: [
      'Configure stakeholder emails before generating — then every report is one click away from delivery',
      'The RAG status is determined by AI based on your tasks and risks — Red means urgent attention needed',
      'You can regenerate the report as many times as needed before sending',
      'The email subject includes the RAG status: [AMBER] Project Name — Week ending X',
      'Reports are stored in history — useful for audit trails and project reviews',
    ],
  },
  {
    id: 'notifications-setup',
    icon: '🔔',
    title: 'Setting Up Notifications',
    subtitle: 'Due reminders, daily digest and overdue alerts',
    category: 'AI Features',
    color: '#22d3a5',
    estimated: '2 min',
    steps: [
      { step: 'Click "🔔 Alerts" in the toolbar', detail: 'The Notification Settings modal opens for the current project.' },
      { step: 'Enter your Notification Email', detail: 'This is pre-filled with your account email. Change it if you want notifications to go to a different address for this project.' },
      { step: 'Configure Due Date Reminders', detail: 'Toggle ON to enable. Choose how many days before: 1 day (same day reminder the evening before), 2 days or 3 days. Click "Send Test" to verify the email arrives.' },
      { step: 'Configure Daily Digest', detail: 'Toggle ON to enable. Set the time you want the morning digest email. Default is 08:00. The digest lists all tasks starting or due today.' },
      { step: 'Configure Overdue Alerts', detail: 'Toggle ON to enable. An email fires automatically when a task passes its Due Date and is not marked as Done. Click "Send Test" to verify.' },
      { step: 'Click "Save Notification Settings"', detail: 'Settings are saved per-project. You can have different notification preferences for each project.' },
      { step: 'Verify with Send Test buttons', detail: 'Each notification type has a "Send Test" button. Click it to receive a sample email and confirm delivery before relying on it for real tasks.' },
    ],
    tips: [
      'Test all three notification types when first setting up to confirm your email is working',
      'Daily Digest only lists tasks that have a start date or due date set to today',
      'Overdue alerts fire once per task — not repeatedly every day',
      'Notifications are per-project — configure each project separately',
    ],
  },
  {
    id: 'attachment',
    icon: '📎',
    title: 'Attaching Documents to a Project',
    subtitle: 'Upload SOW, project charter or reference docs',
    category: 'AI Features',
    color: '#00d4ff',
    estimated: '2 min',
    steps: [
      { step: 'Click the project dates button or the ✏️ edit button on your project', detail: 'This opens the Edit Project modal.' },
      { step: 'Click the "📎 Attachment" tab', detail: 'The attachment tab shows any existing attachment or an upload area.' },
      { step: 'Click the upload area to select a file', detail: 'Supported formats: PDF, Word (.docx), Text (.txt). Maximum file size: 10MB.' },
      { step: 'Wait for the upload to complete', detail: 'The file uploads to secure cloud storage. You will see "✅ Uploaded successfully" when done.' },
      { step: 'Use the View or Remove buttons', detail: 'View opens the document in a new tab. Remove deletes it from storage.' },
    ],
    tips: [
      'Good documents to attach: Project Charter, Statement of Work (SOW), Technical Specification, Network Diagrams',
      'For AI projects, the 📝 Scope tab shows the AI-generated description as your project scope document',
      'Non-AI projects show the attachment tab only — AI projects show both Scope and Attachment',
    ],
  },
]

const CATEGORIES = ['All', 'Getting Started', 'Gantt & Timeline', 'PCR & Risk Register', 'AI Features']

const CAT_COLORS: Record<string, string> = {
  'Getting Started': '#00d4ff',
  'Gantt & Timeline': '#22d3a5',
  'PCR & Risk Register': '#f59e0b',
  'AI Features': '#7c3aed',
}

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
        <h1 className="font-syne font-black text-3xl mb-2">How-To Guides</h1>
        <p className="text-muted text-sm">Step-by-step instructions for every NexPlan feature</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
        <input className="input pl-10 w-full max-w-lg"
          placeholder="Search guides... e.g. 'create task', 'risk register', 'status report'"
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
            {cat === 'All' ? '📚 All Guides' :
             cat === 'Getting Started' ? '🚀 Getting Started' :
             cat === 'Gantt & Timeline' ? '📅 Gantt & Timeline' :
             cat === 'PCR & Risk Register' ? '🛡️ PCR & Risk' : '🤖 AI Features'}
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
                {cat}
              </p>
              <div className="space-y-1.5">
                {guides.map(guide => (
                  <button key={guide.id} onClick={() => setSelectedGuide(guide)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all
                      ${selectedGuide?.id === guide.id
                        ? 'shadow-md'
                        : 'border-border bg-surface hover:bg-surface2'}`}
                    style={selectedGuide?.id === guide.id
                      ? { borderColor: guide.color + '50', background: guide.color + '10' }
                      : {}}>
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
              {/* Quick start cards */}
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
              {/* Guide header */}
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

              {/* Steps */}
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

                {/* Tips */}
                {selectedGuide.tips && selectedGuide.tips.length > 0 && (
                  <div className="mt-6 bg-accent2/5 border border-accent2/20 rounded-xl p-4">
                    <p className="text-xs font-syne font-bold text-accent2 mb-3 uppercase tracking-wide">
                      💡 Pro Tips
                    </p>
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

                {/* Navigation between guides */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() => {
                      const idx = GUIDES.findIndex(g => g.id === selectedGuide.id)
                      if (idx > 0) setSelectedGuide(GUIDES[idx - 1])
                    }}
                    disabled={GUIDES.findIndex(g => g.id === selectedGuide.id) === 0}
                    className="flex items-center gap-2 text-xs text-muted hover:text-text disabled:opacity-30 font-semibold transition-colors">
                    ← Previous Guide
                  </button>
                  <span className="text-xs font-mono-code text-muted">
                    {GUIDES.findIndex(g => g.id === selectedGuide.id) + 1} / {GUIDES.length}
                  </span>
                  <button
                    onClick={() => {
                      const idx = GUIDES.findIndex(g => g.id === selectedGuide.id)
                      if (idx < GUIDES.length - 1) setSelectedGuide(GUIDES[idx + 1])
                    }}
                    disabled={GUIDES.findIndex(g => g.id === selectedGuide.id) === GUIDES.length - 1}
                    className="flex items-center gap-2 text-xs text-muted hover:text-text disabled:opacity-30 font-semibold transition-colors">
                    Next Guide →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer help strip */}
      <div className="mt-10 bg-surface2 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-syne font-bold">Can't find what you're looking for?</p>
          <p className="text-muted text-sm mt-1">Contact us and we'll help you out.</p>
        </div>
        <a href="mailto:info@nexplan.io"
          className="btn-primary px-6 py-2.5 text-sm shrink-0">
          📧 Email Support
        </a>
      </div>
    </div>
  )
}
