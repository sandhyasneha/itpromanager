// src/lib/planConfig.ts
// Central plan configuration — matches plan_config table in Supabase

export type Plan = 'free' | 'pro' | 'enterprise'

export type FeatureKey =
  | 'kanban'
  | 'gantt'
  | 'risk_mitigation'
  | 'task_email'
  | 'knowledge_base'
  | 'progress_tracking'
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

// ── Feature definitions ─────────────────────────────────────────
export const FEATURE_DEFS: {
  key: FeatureKey
  label: string
  icon: string
  category: 'Core' | 'AI' | 'Collaboration' | 'Enterprise'
}[] = [
  // Core
  { key: 'kanban',            label: 'Kanban Board',              icon: '📋', category: 'Core' },
  { key: 'gantt',             label: 'Gantt Timeline',            icon: '📅', category: 'Core' },
  { key: 'risk_mitigation',   label: 'Risk & Issue Register',     icon: '🛡️', category: 'Core' },
  { key: 'task_email',        label: 'Task Assignment Emails',    icon: '📬', category: 'Core' },
  { key: 'knowledge_base',    label: 'IT Knowledge Base',         icon: '📚', category: 'Core' },
  { key: 'progress_tracking', label: 'Progress Tracking',         icon: '📊', category: 'Core' },
  // AI
  { key: 'ai_project_plan',   label: 'AI Project Plan Generator', icon: '🤖', category: 'AI' },
  { key: 'ai_status_report',  label: 'AI Status Reports',         icon: '📈', category: 'AI' },
  { key: 'pcr_document',      label: 'PCR Document Generator',    icon: '🔀', category: 'AI' },
  { key: 'ai_followup',       label: 'AI Follow-Up Emails',       icon: '✉️', category: 'AI' },
  // Collaboration
  { key: 'comments_activity', label: 'Comments & Activity Log',   icon: '💬', category: 'Collaboration' },
  { key: 'support_tickets',   label: 'Priority Support Tickets',  icon: '🎫', category: 'Collaboration' },
  // Enterprise
  { key: 'multi_team',        label: 'Multi-Team Workspace',      icon: '👥', category: 'Enterprise' },
  { key: 'sso',               label: 'SSO / Active Directory',    icon: '🔐', category: 'Enterprise' },
  { key: 'advanced_admin',    label: 'Advanced Admin Controls',   icon: '⚙️', category: 'Enterprise' },
  { key: 'custom_integrations', label: 'Custom Integrations',     icon: '🔗', category: 'Enterprise' },
]

// ── Default plan features (mirrors plan_config table) ──────────
export const DEFAULT_PLAN_FEATURES: Record<Plan, FeatureKey[]> = {
  free: [
    'kanban', 'gantt', 'risk_mitigation',
    'task_email', 'knowledge_base', 'progress_tracking',
  ],
  pro: [
    'kanban', 'gantt', 'risk_mitigation',
    'task_email', 'knowledge_base', 'progress_tracking',
    'ai_project_plan', 'ai_status_report', 'pcr_document',
    'ai_followup', 'comments_activity', 'support_tickets',
  ],
  enterprise: [
    'kanban', 'gantt', 'risk_mitigation',
    'task_email', 'knowledge_base', 'progress_tracking',
    'ai_project_plan', 'ai_status_report', 'pcr_document',
    'ai_followup', 'comments_activity', 'support_tickets',
    'multi_team', 'sso', 'advanced_admin', 'custom_integrations',
  ],
}

// ── Plan display config (badges, colours) ──────────────────────
export const PLAN_DISPLAY: Record<Plan, {
  label: string
  badge: string
  color: string
  bgColor: string
  borderColor: string
}> = {
  free: {
    label:       'Community',
    badge:       '🎁 Free',
    color:       'text-accent',
    bgColor:     'bg-accent/10',
    borderColor: 'border-accent/30',
  },
  pro: {
    label:       'Pro',
    badge:       '⚡ Pro',
    color:       'text-accent2',
    bgColor:     'bg-accent2/10',
    borderColor: 'border-accent2/30',
  },
  enterprise: {
    label:       'Enterprise',
    badge:       '🏢 Enterprise',
    color:       'text-accent3',
    bgColor:     'bg-accent3/10',
    borderColor: 'border-accent3/30',
  },
}

// ── Plan pricing (mirrors plan_config table) ────────────────────
export const PLAN_PRICING: Record<Plan, {
  monthly: number | null
  yearly:  number | null
}> = {
  free:       { monthly: 0,    yearly: 0    },
  pro:        { monthly: 5,    yearly: 50   },
  enterprise: { monthly: null, yearly: null },
}

// ── Helper: check if a user's plan includes a feature ──────────
export function hasFeature(plan: Plan | null | undefined, feature: FeatureKey): boolean {
  const p = plan ?? 'free'
  return DEFAULT_PLAN_FEATURES[p]?.includes(feature) ?? false
}
