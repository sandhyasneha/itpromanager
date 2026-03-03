// ============================================================
// src/lib/logActivity.ts
// NEW FILE — does not replace anything existing
// Call this whenever a task field changes to record it
// in the task_activity_log table.
// ============================================================

import { createClient } from '@/lib/supabase/client'

export interface ActivityParams {
  taskId: string
  projectId: string
  actorName: string
  actorEmail: string
  actionType:
    | 'task_created'
    | 'status_change'
    | 'priority_change'
    | 'assignee_change'
    | 'due_date_change'
    | 'title_change'
    | 'comment_added'
    | 'attachment_added'
  fieldChanged?: string
  oldValue?: string | null
  newValue?: string | null
}

export async function logActivity(params: ActivityParams): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('task_activity_log').insert({
    task_id:       params.taskId,
    project_id:    params.projectId,
    actor_name:    params.actorName,
    actor_email:   params.actorEmail,
    action_type:   params.actionType,
    field_changed: params.fieldChanged ?? null,
    old_value:     params.oldValue ?? null,
    new_value:     params.newValue ?? null,
  })
  if (error) console.error('[logActivity]', error.message)
}
