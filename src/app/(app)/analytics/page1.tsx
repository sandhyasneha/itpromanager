'use client'
// ============================================================
// src/app/(app)/analytics/page.tsx
// NEW FILE — User Analytics Dashboard
// Shows: active users, feature usage, AI call stats,
//        signup trends, country breakdown, plan distribution
// ============================================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from './AnalyticsClient'

const ADMIN_EMAIL = 'info@nexplan.io'

export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isAdmin = user.email === ADMIN_EMAIL

  // ── Fetch all data server-side ─────────────────────────
  const [
    { data: profiles },
    { data: projects },
    { data: tasks },
    { data: auditLogs },
    { data: subscriptions },
  ] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, country, role, plan, created_at'),
    supabase.from('projects').select('id, owner_id, created_at, status'),
    supabase.from('tasks').select('id, project_id, status, created_at, updated_at'),
    isAdmin
      ? supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500)
      : supabase.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
    isAdmin
      ? supabase.from('subscriptions').select('*').order('created_at', { ascending: false })
      : { data: [] },
  ])

  return (
    <AnalyticsClient
      currentUser={user}
      isAdmin={isAdmin}
      profiles={profiles ?? []}
      projects={projects ?? []}
      tasks={tasks ?? []}
      auditLogs={auditLogs ?? []}
      subscriptions={subscriptions ?? []}
    />
  )
}
