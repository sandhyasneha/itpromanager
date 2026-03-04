// ============================================================
// src/lib/auditLog.ts
// NEW FILE — Call this from any API route or component
// to log AI calls and errors into the audit_logs table.
// ============================================================

import { createClient } from '@/lib/supabase/client'
import { categoriseError } from '@/lib/errorCodes'

export interface AuditLogParams {
  userEmail:      string
  userName:       string
  userId?:        string
  actionType:     'ai_call' | 'error'
  feature:        string          // e.g. 'project_plan', 'risk_mitigation'
  model?:         string          // e.g. 'claude-sonnet-4-20250514'
  promptSummary?: string          // short description of what was requested
  responseStatus: 'ok' | 'error'
  errorCode?:     string          // e.g. 'NXP-1001'
  errorMessage?:  string
  durationMs?:    number
  projectId?:     string
  projectName?:   string
  metadata?:      Record<string, unknown>
}

export async function auditLog(params: AuditLogParams): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from('audit_logs').insert({
      user_id:        params.userId        ?? null,
      user_email:     params.userEmail,
      user_name:      params.userName,
      action_type:    params.actionType,
      feature:        params.feature,
      model:          params.model         ?? null,
      prompt_summary: params.promptSummary ?? null,
      response_status: params.responseStatus,
      error_code:     params.errorCode     ?? null,
      error_message:  params.errorMessage  ?? null,
      duration_ms:    params.durationMs    ?? null,
      project_id:     params.projectId     ?? null,
      project_name:   params.projectName   ?? null,
      metadata:       params.metadata      ?? null,
    })
  } catch (err) {
    // Never let audit logging crash the main flow
    console.error('[auditLog] Failed to write audit log:', err)
  }
}

// ── Convenience: log a successful AI call ─────────────────
export async function logAICall(params: Omit<AuditLogParams, 'actionType' | 'responseStatus'>): Promise<void> {
  await auditLog({ ...params, actionType: 'ai_call', responseStatus: 'ok' })
}

// ── Convenience: log an error with auto error code ────────
export async function logError(
  params: Omit<AuditLogParams, 'actionType' | 'responseStatus' | 'errorCode'>,
  error: unknown
): Promise<string> {
  const errorCode = categoriseError(params.feature, error)
  const errorMessage = error instanceof Error ? error.message : String(error)
  await auditLog({
    ...params,
    actionType:     'error',
    responseStatus: 'error',
    errorCode,
    errorMessage,
  })
  return errorCode   // return so the UI can show it to the user
}


// ── Server-side version (for API routes using service role) ─
// Use this in /api/* routes where you have the user info from the request body

export interface ServerAuditParams extends AuditLogParams {
  supabaseUrl:  string
  supabaseKey:  string
}

export async function serverAuditLog(params: AuditLogParams & {
  supabaseClient: ReturnType<typeof createClient>
}): Promise<void> {
  try {
    await params.supabaseClient.from('audit_logs').insert({
      user_id:         params.userId        ?? null,
      user_email:      params.userEmail,
      user_name:       params.userName,
      action_type:     params.actionType,
      feature:         params.feature,
      model:           params.model         ?? null,
      prompt_summary:  params.promptSummary ?? null,
      response_status: params.responseStatus,
      error_code:      params.errorCode     ?? null,
      error_message:   params.errorMessage  ?? null,
      duration_ms:     params.durationMs    ?? null,
      project_id:      params.projectId     ?? null,
      project_name:    params.projectName   ?? null,
      metadata:        params.metadata      ?? null,
    })
  } catch (err) {
    console.error('[serverAuditLog] Failed:', err)
  }
}
