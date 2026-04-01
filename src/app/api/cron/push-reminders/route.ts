// src/app/api/cron/push-reminders/route.ts
// Scheduled daily via Vercel Cron — sends overdue + due tomorrow push notifications

import { createClient } from '@/lib/supabase/server'
import { sendPushToUser, PushTemplates } from '@/lib/push'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  let dueTomorrowCount = 0
  let overdueCount = 0

  // ── Due tomorrow ──────────────────────────────────────────────────────────
  const { data: dueTomorrow } = await supabase
    .from('tasks')
    .select('id, title, assignee_id, project_id, projects(name)')
    .eq('due_date', tomorrow)
    .not('status', 'eq', 'done')
    .not('assignee_id', 'is', null)

  for (const task of dueTomorrow ?? []) {
    if (!task.assignee_id) continue
    const projectName = (task.projects as any)?.name ?? 'your project'
    await sendPushToUser(
      task.assignee_id,
      PushTemplates.taskDueTomorrow(task.title, projectName)
    )
    dueTomorrowCount++
  }

  // ── Overdue ───────────────────────────────────────────────────────────────
  const { data: overdue } = await supabase
    .from('tasks')
    .select('id, title, assignee_id, project_id, projects(name)')
    .lt('due_date', today)
    .not('status', 'eq', 'done')
    .not('assignee_id', 'is', null)

  for (const task of overdue ?? []) {
    if (!task.assignee_id) continue
    const projectName = (task.projects as any)?.name ?? 'your project'
    await sendPushToUser(
      task.assignee_id,
      PushTemplates.taskOverdue(task.title, projectName)
    )
    overdueCount++
  }

  return NextResponse.json({
    success: true,
    dueTomorrow: dueTomorrowCount,
    overdue: overdueCount,
  })
}
