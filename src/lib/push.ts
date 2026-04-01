// src/lib/push.ts
// Helper to send push notifications from server-side code (API routes, cron jobs)

const webpush = require('web-push')
import { createClient } from '@/lib/supabase/server'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export type PushPayload = {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return { sent: 0 }

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon ?? '/icons/icon-192x192.png',
          url: payload.url ?? '/my-tasks',
          tag: payload.tag ?? 'nexplan',
        })
      )
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return { sent }
}

// ─── Notification templates ───────────────────────────────────────────────────

export const PushTemplates = {
  taskAssigned: (taskTitle: string, projectName: string, assignedBy: string): PushPayload => ({
    title: '📋 New Task Assigned',
    body: `${assignedBy} assigned you "${taskTitle}" in ${projectName}`,
    url: '/my-tasks',
    tag: 'task-assigned',
  }),

  taskStatusChanged: (taskTitle: string, newStatus: string, changedBy: string): PushPayload => ({
    title: '🔄 Task Updated',
    body: `${changedBy} moved "${taskTitle}" to ${newStatus.replace('_', ' ')}`,
    url: '/my-tasks',
    tag: 'task-status',
  }),

  taskDueTomorrow: (taskTitle: string, projectName: string): PushPayload => ({
    title: '⏰ Task Due Tomorrow',
    body: `"${taskTitle}" in ${projectName} is due tomorrow`,
    url: '/my-tasks',
    tag: 'task-due-tomorrow',
  }),

  taskOverdue: (taskTitle: string, projectName: string): PushPayload => ({
    title: '🚨 Task Overdue',
    body: `"${taskTitle}" in ${projectName} is overdue`,
    url: '/my-tasks',
    tag: 'task-overdue',
  }),
}
