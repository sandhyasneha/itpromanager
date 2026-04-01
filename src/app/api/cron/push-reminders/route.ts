export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webpush = require('web-push')
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  async function sendPush(userId: string, payload: object) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)
    if (!subs?.length) return
    await Promise.allSettled(
      subs.map((sub: any) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ icon: '/icons/icon-192x192.png', url: '/my-tasks', ...payload })
        )
      )
    )
  }

  let dueTomorrowCount = 0
  let overdueCount = 0

  // Due tomorrow
  const { data: dueTomorrow } = await supabase
    .from('tasks')
    .select('id, title, assignee_id, projects(name)')
    .eq('due_date', tomorrow)
    .not('status', 'eq', 'done')
    .not('assignee_id', 'is', null)

  for (const task of dueTomorrow ?? []) {
    if (!task.assignee_id) continue
    await sendPush(task.assignee_id, {
      title: '⏰ Task Due Tomorrow',
      body: `"${task.title}" is due tomorrow`,
      tag: 'task-due-tomorrow',
    })
    dueTomorrowCount++
  }

  // Overdue
  const { data: overdue } = await supabase
    .from('tasks')
    .select('id, title, assignee_id, projects(name)')
    .lt('due_date', today)
    .not('status', 'eq', 'done')
    .not('assignee_id', 'is', null)

  for (const task of overdue ?? []) {
    if (!task.assignee_id) continue
    await sendPush(task.assignee_id, {
      title: '🚨 Task Overdue',
      body: `"${task.title}" is overdue`,
      tag: 'task-overdue',
    })
    overdueCount++
  }

  return NextResponse.json({ success: true, dueTomorrow: dueTomorrowCount, overdue: overdueCount })
}
