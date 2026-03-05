// ============================================================
// src/lib/planConfig.ts
// NEW FILE — Feature definitions, plan checks, upgrade helpers
// ============================================================

export type Plan = 'free' | 'pro' | 'enterprise'

// ── Feature keys ─────────────────────────────────────────────
export type FeatureKey =
  | 'kanban'
  | 'gantt'
  | 'progress_tracking'
  | 'risk_mitigation'
  | 'task_email'
  | 'knowledge_base'
  | 'ai_project_plan'
  | 'ai_status_report'
  | 'pcr_document'
  | 'ai_followup'
  | 'comments_activity'
  | 'support_tickets'
  | 'multi_team'
  | 'sso'
  | 'advanced_admin'
  | 'custom_integrations'

// ── Feature metadata ──────────────────────────────────────────
export interface FeatureDef {
  key:         FeatureKey
  label:       string
  description: string
  icon:        string
  category:    'Core' | 'AI' | 'Collaboration' | 'Enterprise'
}

export const FEATURE_DEFS: FeatureDef[] = [
  // Core
  { key: 'kanban',           label: 'Kanban Board & Tasks',         icon: '📋', category: 'Core',         description: 'Full Kanban board with drag-and-drop task management' },
  { key: 'gantt',            label: 'Gantt Timeline',               icon: '📅', category: 'Core',         description: 'Visual project timeline with Gantt chart view' },
  { key: 'progress_tracking',label: 'Project Progress Tracking',    icon: '📊', category: 'Core',         description: 'Track project completion and task progress' },
  { key: 'risk_mitigation',  label: 'AI Risk Mitigation',           icon: '🛡️', category: 'Core',         description: 'AI-powered risk register with mitigation suggestions' },
  { key: 'task_email',       label: 'Task Assignment Emails',       icon: '📬', category: 'Core',         description: 'Email notifications when tasks are assigned' },
  { key: 'knowledge_base',   label: 'Knowledge Base',               icon: '📚', category: 'Core',         description: 'AI-powered knowledge base with article search' },
  // AI
  { key: 'ai_project_plan',  label: 'AI Project Plan Generator',    icon: '🤖', category: 'AI',           description: 'Generate full project plans with AI from a description' },
  { key: 'ai_status_report', label: 'AI Status Reports',            icon: '📈', category: 'AI',           description: 'One-click AI-generated stakeholder status reports' },
  { key: 'pcr_document',     label: 'PCR Document Generator',       icon: '🔀', category: 'AI',           description: 'AI-generated Project Change Request documents' },
  { key: 'ai_followup',      label: 'AI Follow-Up Emails',          icon: '✉️', category: 'AI',           description: 'AI-personalised follow-up emails for overdue tasks' },
  // Collaboration
  { key: 'comments_activity',label: 'Comments & Activity Log',      icon: '💬', category: 'Collaboration', description: 'Task comments and full activity history' },
  { key: 'support_tickets',  label: 'Support Tickets',              icon: '🎫', category: 'Collaboration', description: 'Raise and track support tickets with the NexPlan team' },
  // Enterprise
  { key: 'multi_team',       label: 'Multi-Team Workspace',         icon: '👥', category: 'Enterprise',   description: 'Manage multiple teams under one organisation' },
  { key: 'sso',              label: 'SSO / Active Directory',       icon: '🔐', category: 'Enterprise',   description: 'Single sign-on and enterprise authentication' },
  { key: 'advanced_admin',   label: 'Advanced Admin Controls',      icon: '⚙️', category: 'Enterprise',   description: 'Role management, audit logs and usage analytics' },
  { key: 'custom_integrations', label: 'Custom Integrations',       icon: '🔗', category: 'Enterprise',   description: 'ServiceNow, Jira, Slack, Teams and more' },
]

// ── Default features per plan (fallback if DB unavailable) ───
export const DEFAULT_PLAN_FEATURES: Record<Plan, FeatureKey[]> = {
  free: [
    'kanban', 'gantt', 'progress_tracking',
    'risk_mitigation', 'task_email', 'knowledge_base',
  ],
  pro: [
    'kanban', 'gantt', 'progress_tracking',
    'risk_mitigation', 'task_email', 'knowledge_base',
    'ai_project_plan', 'ai_status_report', 'pcr_document',
    'ai_followup', 'comments_activity', 'support_tickets',
  ],
  enterprise: [
    'kanban', 'gantt', 'progress_tracking',
    'risk_mitigation', 'task_email', 'knowledge_base',
    'ai_project_plan', 'ai_status_report', 'pcr_document',
    'ai_followup', 'comments_activity', 'support_tickets',
    'multi_team', 'sso', 'advanced_admin', 'custom_integrations',
  ],
}

// ── Plan display config ───────────────────────────────────────
export const PLAN_DISPLAY: Record<Plan, {
  label: string; color: string; bgColor: string; borderColor: string; badge: string
}> = {
  free: {
    label:       'Community',
    color:       'text-accent',
    bgColor:     'bg-accent/10',
    borderColor: 'border-accent/30',
    badge:       '🎁 Free',
  },
  pro: {
    label:       'Pro',
    color:       'text-accent2',
    bgColor:     'bg-accent2/10',
    borderColor: 'border-accent2/30',
    badge:       '⚡ Pro',
  },
  enterprise: {
    label:       'Enterprise',
    color:       'text-accent3',
    bgColor:     'bg-accent3/10',
    borderColor: 'border-accent3/30',
    badge:       '🏢 Enterprise',
  },
}

// ── Check if a plan has a feature ────────────────────────────
export function planHasFeature(
  plan: Plan,
  feature: FeatureKey,
  planFeatures?: Record<Plan, FeatureKey[]>
): boolean {
  const features = planFeatures ?? DEFAULT_PLAN_FEATURES
  return features[plan]?.includes(feature) ?? false
}

// ── Check if user can access a feature ───────────────────────
export function canAccess(
  userPlan: Plan | null | undefined,
  feature:  FeatureKey,
  planFeatures?: Record<Plan, FeatureKey[]>
): boolean {
  const plan = userPlan ?? 'free'
  return planHasFeature(plan, feature, planFeatures)
}

// ── Get minimum plan required for a feature ──────────────────
export function minPlanForFeature(
  feature: FeatureKey,
  planFeatures?: Record<Plan, FeatureKey[]>
): Plan {
  const features = planFeatures ?? DEFAULT_PLAN_FEATURES
  if (features.free?.includes(feature))       return 'free'
  if (features.pro?.includes(feature))        return 'pro'
  return 'enterprise'
}

// ── Upgrade prompt message ────────────────────────────────────
export function upgradeMessage(feature: FeatureKey): string {
  const def = FEATURE_DEFS.find(f => f.key === feature)
  const label = def?.label ?? feature
  return `${label} is available on the Pro plan. Upgrade for $5/month to unlock all AI features.`
}

// ── Plan pricing ─────────────────────────────────────────────
export const PLAN_PRICING = {
  free:       { monthly: 0,    yearly: 0    },
  pro:        { monthly: 5,    yearly: 50   },
  enterprise: { monthly: null, yearly: null }, // custom
}
