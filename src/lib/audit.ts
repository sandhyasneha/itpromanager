// src/lib/audit.ts
// Client-side audit logging helper

export async function logAudit(params: {
  action: string
  category: 'task' | 'project' | 'org' | 'workspace' | 'auth'
  entityId?: string
  entityName?: string
  oldValue?: string
  newValue?: string
  metadata?: Record<string, any>
  orgId?: string
}) {
  try {
    await fetch('/api/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch (e) {
    // Silent fail — audit logging should never break the app
    console.warn('[audit]', e)
  }
}

// Action constants
export const AUDIT_ACTIONS = {
  // Tasks
  TASK_CREATED:         'task.created',
  TASK_ASSIGNED:        'task.assigned',
  TASK_STATUS_CHANGED:  'task.status_changed',
  TASK_PRIORITY_CHANGED:'task.priority_changed',
  TASK_DUE_DATE_CHANGED:'task.due_date_changed',
  TASK_DELETED:         'task.deleted',
  // Projects
  PROJECT_CREATED:      'project.created',
  PROJECT_UPDATED:      'project.updated',
  PROJECT_DELETED:      'project.deleted',
  // Organisation
  ORG_MEMBER_INVITED:   'org.member_invited',
  ORG_MEMBER_JOINED:    'org.member_joined',
  ORG_MEMBER_REMOVED:   'org.member_removed',
  ORG_UPDATED:          'org.updated',
  // Workspace
  WORKSPACE_CREATED:    'workspace.created',
  WORKSPACE_UPDATED:    'workspace.updated',
  WORKSPACE_STATUS:     'workspace.status_changed',
  // Auth
  USER_LOGIN:           'auth.login',
  USER_PLAN_UPGRADED:   'auth.plan_upgraded',
}
