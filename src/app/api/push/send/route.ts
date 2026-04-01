import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
const webpush = require('web-push')

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

// Called internally — send push to a specific user
export async function POST(req: Request) {
  const supabase = await createClient()

  // Verify caller is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, payload }: { userId: string; payload: PushPayload } = await req.json()
  if (!userId || !payload) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Fetch subscriptions for target user
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

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
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
