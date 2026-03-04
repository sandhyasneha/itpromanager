// ============================================================
// src/lib/errorCodes.ts
// NEW FILE — NexPlan Error Code Definitions
// Format: NXP-XXXX
//   NXP-1xxx = AI / Claude errors
//   NXP-2xxx = Database errors
//   NXP-3xxx = Email / Resend errors
//   NXP-4xxx = Auth errors
//   NXP-5xxx = File / Upload errors
//   NXP-9xxx = Unknown / General errors
// ============================================================

export interface ErrorCodeDefinition {
  code: string
  title: string
  description: string
  category: 'AI' | 'Database' | 'Email' | 'Auth' | 'File' | 'General'
  userMessage: string       // shown to the user
  resolution: string        // how to fix or what admin should check
}

export const ERROR_CODES: Record<string, ErrorCodeDefinition> = {

  // ── AI / Claude Errors (1xxx) ──────────────────────────────
  'NXP-1001': {
    code: 'NXP-1001',
    category: 'AI',
    title: 'AI Project Plan Generation Failed',
    description: 'Claude API did not return a valid task list when generating a project plan.',
    userMessage: 'AI could not generate your project plan. Please try again or create tasks manually.',
    resolution: 'Check Claude API key, model availability, and request payload in /api/ai-project-manager.',
  },
  'NXP-1002': {
    code: 'NXP-1002',
    category: 'AI',
    title: 'AI Risk Mitigation Failed',
    description: 'Claude API failed to generate risk mitigation suggestions.',
    userMessage: 'AI could not generate risk suggestions. Please try again.',
    resolution: 'Check Claude API key and /api/ai-risk-mitigation route for errors.',
  },
  'NXP-1003': {
    code: 'NXP-1003',
    category: 'AI',
    title: 'AI Status Report Generation Failed',
    description: 'Claude API failed to generate the status report content.',
    userMessage: 'AI could not generate your status report. Please try again.',
    resolution: 'Check Claude API key and /api/ai-status-report route.',
  },
  'NXP-1004': {
    code: 'NXP-1004',
    category: 'AI',
    title: 'AI PCR Document Generation Failed',
    description: 'Claude API failed to generate PRINCE2 PCR document.',
    userMessage: 'AI could not generate the PCR document. Please try again.',
    resolution: 'Check Claude API key and /api/ai-pcr route.',
  },
  'NXP-1005': {
    code: 'NXP-1005',
    category: 'AI',
    title: 'AI Follow-Up Email Generation Failed',
    description: 'Claude API failed to generate the AI follow-up email content.',
    userMessage: 'AI follow-up email could not be generated. Please try again.',
    resolution: 'Check Claude API key and /api/ai-followup route.',
  },
  'NXP-1006': {
    code: 'NXP-1006',
    category: 'AI',
    title: 'AI Response Timeout',
    description: 'Claude API took too long to respond and the request timed out.',
    userMessage: 'AI is taking too long to respond. Please try again in a moment.',
    resolution: 'Check Anthropic service status. Consider increasing timeout in API routes.',
  },
  'NXP-1007': {
    code: 'NXP-1007',
    category: 'AI',
    title: 'AI Rate Limit Exceeded',
    description: 'Claude API rate limit hit — too many requests in a short period.',
    userMessage: 'AI is busy right now. Please wait a moment and try again.',
    resolution: 'Check Anthropic usage dashboard. Consider request queuing or rate limiting per user.',
  },
  'NXP-1008': {
    code: 'NXP-1008',
    category: 'AI',
    title: 'AI Invalid Response Format',
    description: 'Claude API returned a response that could not be parsed as expected JSON.',
    userMessage: 'AI returned an unexpected response. Please try again.',
    resolution: 'Check the system prompt and JSON parsing logic in the relevant API route.',
  },

  // ── Database Errors (2xxx) ─────────────────────────────────
  'NXP-2001': {
    code: 'NXP-2001',
    category: 'Database',
    title: 'Task Save Failed',
    description: 'Supabase failed to save task updates to the database.',
    userMessage: 'Your task could not be saved. Please try again.',
    resolution: 'Check Supabase logs, RLS policies on tasks table, and network connectivity.',
  },
  'NXP-2002': {
    code: 'NXP-2002',
    category: 'Database',
    title: 'Project Creation Failed',
    description: 'Supabase failed to insert a new project record.',
    userMessage: 'Your project could not be created. Please try again.',
    resolution: 'Check Supabase logs and RLS policies on projects table.',
  },
  'NXP-2003': {
    code: 'NXP-2003',
    category: 'Database',
    title: 'Risk Register Save Failed',
    description: 'Supabase failed to save a risk or issue to the register.',
    userMessage: 'Risk could not be saved. Please try again.',
    resolution: 'Check Supabase logs and RLS policies on risk_register table.',
  },
  'NXP-2004': {
    code: 'NXP-2004',
    category: 'Database',
    title: 'Data Load Failed',
    description: 'Supabase failed to fetch data for the requested page or feature.',
    userMessage: 'Could not load your data. Please refresh the page.',
    resolution: 'Check Supabase connection, RLS policies, and network connectivity.',
  },

  // ── Email / Resend Errors (3xxx) ──────────────────────────
  'NXP-3001': {
    code: 'NXP-3001',
    category: 'Email',
    title: 'Task Assignment Email Failed',
    description: 'Resend failed to send the task assignment notification email.',
    userMessage: 'Assignment email could not be sent. Please check the email address and try again.',
    resolution: 'Check Resend API key, sender domain verification, and /api/send-task-email route.',
  },
  'NXP-3002': {
    code: 'NXP-3002',
    category: 'Email',
    title: 'Status Report Email Failed',
    description: 'Resend failed to send the AI status report to stakeholders.',
    userMessage: 'Status report email could not be sent. Please try again.',
    resolution: 'Check Resend API key and stakeholder email addresses.',
  },
  'NXP-3003': {
    code: 'NXP-3003',
    category: 'Email',
    title: 'AI Follow-Up Email Failed to Send',
    description: 'Resend failed to deliver the AI-generated follow-up email.',
    userMessage: 'Follow-up email could not be sent. Please check the assignee email address.',
    resolution: 'Check Resend API key and /api/ai-followup route for delivery errors.',
  },
  'NXP-3004': {
    code: 'NXP-3004',
    category: 'Email',
    title: 'Welcome Email Failed',
    description: 'Resend failed to send the welcome email to a new user on signup.',
    userMessage: 'Welcome email could not be sent. Your account is still active.',
    resolution: 'Check Resend API key and welcome email template.',
  },

  // ── Auth Errors (4xxx) ────────────────────────────────────
  'NXP-4001': {
    code: 'NXP-4001',
    category: 'Auth',
    title: 'Login Failed',
    description: 'User authentication failed — incorrect credentials or account issue.',
    userMessage: 'Login failed. Please check your email and password.',
    resolution: 'Check Supabase Auth logs. User may need to reset password.',
  },
  'NXP-4002': {
    code: 'NXP-4002',
    category: 'Auth',
    title: 'Session Expired',
    description: 'User session expired and could not be refreshed.',
    userMessage: 'Your session has expired. Please log in again.',
    resolution: 'Check Supabase JWT expiry settings and refresh token configuration.',
  },
  'NXP-4003': {
    code: 'NXP-4003',
    category: 'Auth',
    title: 'Unauthorized Access',
    description: 'User attempted to access a resource they do not have permission for.',
    userMessage: 'You do not have permission to access this feature.',
    resolution: 'Check RLS policies and user role assignments in project_members table.',
  },
  'NXP-4004': {
    code: 'NXP-4004',
    category: 'Auth',
    title: 'Google OAuth Failed',
    description: 'Google OAuth sign-in failed or was cancelled.',
    userMessage: 'Google sign-in failed. Please try again or use email/password.',
    resolution: 'Check Google OAuth credentials in Supabase Auth settings.',
  },

  // ── File / Upload Errors (5xxx) ───────────────────────────
  'NXP-5001': {
    code: 'NXP-5001',
    category: 'File',
    title: 'File Upload Failed',
    description: 'Supabase Storage failed to upload the project attachment.',
    userMessage: 'File could not be uploaded. Please check the file size (max 10MB) and try again.',
    resolution: 'Check Supabase Storage bucket permissions and file size limits.',
  },
  'NXP-5002': {
    code: 'NXP-5002',
    category: 'File',
    title: 'Excel Export Failed',
    description: 'The Excel export generation failed on the server.',
    userMessage: 'Excel export could not be generated. Please try again.',
    resolution: 'Check /api/export-excel route and ExcelJS dependencies.',
  },
  'NXP-5003': {
    code: 'NXP-5003',
    category: 'File',
    title: 'Invalid File Type',
    description: 'User attempted to upload a file type that is not allowed.',
    userMessage: 'This file type is not supported. Please upload PDF, Word (.docx), or TXT files only.',
    resolution: 'No action needed — user error. File type validation is working correctly.',
  },

  // ── General / Unknown Errors (9xxx) ──────────────────────
  'NXP-9001': {
    code: 'NXP-9001',
    category: 'General',
    title: 'Unknown Error',
    description: 'An unexpected error occurred that does not match a known category.',
    userMessage: 'Something went wrong. Please try again or raise a support ticket.',
    resolution: 'Check server logs and audit_logs table for full error details.',
  },
  'NXP-9002': {
    code: 'NXP-9002',
    category: 'General',
    title: 'Network Error',
    description: 'A network request failed — possibly due to connectivity issues.',
    userMessage: 'Network error. Please check your connection and try again.',
    resolution: 'Check server availability and Vercel function logs.',
  },
}

// ── Helper: get error definition by code ──────────────────
export function getErrorDef(code: string): ErrorCodeDefinition | null {
  return ERROR_CODES[code] ?? null
}

// ── Helper: get user-facing message for a code ────────────
export function getUserMessage(code: string): string {
  return ERROR_CODES[code]?.userMessage ?? 'Something went wrong. Please try again.'
}

// ── Helper: categorise an error and return its code ───────
export function categoriseError(feature: string, error: unknown): string {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  if (msg.includes('rate limit') || msg.includes('429'))        return 'NXP-1007'
  if (msg.includes('timeout') || msg.includes('timed out'))     return 'NXP-1006'
  if (msg.includes('parse') || msg.includes('json'))            return 'NXP-1008'

  if (feature === 'project_plan')   return 'NXP-1001'
  if (feature === 'risk_mitigation') return 'NXP-1002'
  if (feature === 'status_report')  return 'NXP-1003'
  if (feature === 'pcr_document')   return 'NXP-1004'
  if (feature === 'ai_followup')    return 'NXP-1005'

  if (feature === 'task_email')     return 'NXP-3001'
  if (feature === 'status_email')   return 'NXP-3002'
  if (feature === 'export_excel')   return 'NXP-5002'
  if (feature === 'file_upload')    return 'NXP-5001'

  return 'NXP-9001'
}

// ── Category colours for UI ───────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  AI:       'text-accent  bg-accent/10  border-accent/30',
  Database: 'text-warn    bg-warn/10    border-warn/30',
  Email:    'text-accent2 bg-accent2/10 border-accent2/30',
  Auth:     'text-danger  bg-danger/10  border-danger/30',
  File:     'text-accent3 bg-accent3/10 border-accent3/30',
  General:  'text-muted   bg-surface2   border-border',
}
