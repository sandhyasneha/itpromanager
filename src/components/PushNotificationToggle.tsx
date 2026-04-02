'use client'
// src/components/PushNotificationToggle.tsx
// Drop this in your Settings page so users can enable/disable push notifications

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      checkSubscription()
    } else {
      setLoading(false)
    }
  }, [])

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function subscribe() {
    setLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
       applicationServerKey: urlBase64ToUint8Array(
          'BG8pbmjQ8rmL3XSw7PLRPv7NT0iT7SrlNZpQ_jYU-JCcqtzsGofQupTeLYu90y34va6eKij6WYkTM2So-CwXIlk'
        )

     const json = sub.toJSON()
     const p256dh = json.keys?.p256dh ?? ''
     const auth = json.keys?.auth ?? ''
     await fetch('/api/push/subscribe', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
    endpoint: json.endpoint,
    keys: { p256dh, auth },
  }),
})

      setSubscribed(true)
    } catch (e: any) {
      setError(e.message ?? 'Failed to enable notifications')
    } finally {
      setLoading(false)
    }
  }






  async function unsubscribe() {
    setLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (e: any) {
      setError(e.message ?? 'Failed to disable notifications')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <div className="card p-4">
        <p className="text-sm text-muted">
          Push notifications are not supported in your browser.
          Try Chrome or Edge on desktop, or Chrome on Android.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-syne font-bold text-base mb-1">Push Notifications</h3>
          <p className="text-sm text-muted leading-relaxed">
            Get notified when tasks are assigned to you, updated, due tomorrow, or overdue.
          </p>
          {error && <p className="text-xs text-danger mt-2">{error}</p>}
        </div>

        {/* Toggle */}
        <button
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none
            ${subscribed ? 'bg-accent' : 'bg-surface2 border border-border'}
            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
            ${subscribed ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {subscribed && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-accent3 font-semibold mb-2">You will be notified for:</p>
          <ul className="space-y-1">
            {[
              '📋 Task assigned to you',
              '🔄 Task status changed',
              '⏰ Task due tomorrow',
              '🚨 Task overdue',
            ].map(item => (
              <li key={item} className="text-xs text-muted flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent3 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
