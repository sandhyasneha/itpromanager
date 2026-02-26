'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  projectId: string
  projectName: string
  onClose: () => void
}

export default function NotificationSettings({ projectId, projectName, onClose }: Props) {
  const supabase = createClient()
  const [settings, setSettings] = useState({
    due_reminder: true,
    daily_digest: true,
    overdue_alerts: true,
    digest_time: '08:00',
    reminder_days: 1,
    notification_email: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testSent, setTestSent] = useState<string | null>(null)

  useEffect(() => { loadSettings() }, [projectId])

  async function loadSettings() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('notification_settings')
      .select('*').eq('project_id', projectId).eq('user_id', user!.id).single()
    if (data) {
      setSettings({
        due_reminder: data.due_reminder,
        daily_digest: data.daily_digest,
        overdue_alerts: data.overdue_alerts,
        digest_time: data.digest_time || '08:00',
        reminder_days: data.reminder_days || 1,
        notification_email: data.notification_email || user!.email || '',
      })
    } else {
      // Pre-fill with user email
      setSettings(s => ({ ...s, notification_email: user!.email || '' }))
    }
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('notification_settings').upsert({
      user_id: user!.id,
      project_id: projectId,
      ...settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,project_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function sendTest(type: 'due_reminder' | 'daily_digest' | 'overdue_alert') {
    if (!settings.notification_email) { alert('Please enter a notification email first'); return }
    setTesting(type)
    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          email: settings.notification_email,
          projectName,
          test: true,
        }),
      })
      setTestSent(type)
      setTimeout(() => setTestSent(null), 3000)
    } catch (e) { console.error(e) }
    setTesting(null)
  }

  if (loading) return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="card p-8 text-center">
        <p className="text-muted animate-pulse">Loading settings...</p>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="card w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
          <div>
            <p className="font-mono-code text-xs text-accent2 uppercase tracking-widest mb-1">🔔 Notifications</p>
            <h2 className="font-syne font-black text-xl">{projectName}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Email */}
          <div className="bg-surface2 rounded-xl p-4 space-y-3">
            <p className="font-syne font-bold text-sm text-accent uppercase tracking-wide">📧 Notification Email</p>
            <input className="input" type="email" placeholder="your@email.com"
              value={settings.notification_email}
              onChange={e => setSettings(s => ({ ...s, notification_email: e.target.value }))}/>
            <p className="text-xs text-muted">All notifications for this project will be sent to this email.</p>
          </div>

          {/* Due Date Reminder */}
          <div className={`rounded-xl p-4 border transition-all ${settings.due_reminder ? 'bg-accent/5 border-accent/20' : 'bg-surface2 border-border'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-semibold text-sm">Due Date Reminder</p>
                  <p className="text-xs text-muted">Email reminder before a task is due</p>
                </div>
              </div>
              <button onClick={() => setSettings(s => ({ ...s, due_reminder: !s.due_reminder }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.due_reminder ? 'bg-accent' : 'bg-surface2 border border-border'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.due_reminder ? 'translate-x-5' : 'translate-x-0.5'}`}/>
              </button>
            </div>
            {settings.due_reminder && (
              <div className="flex items-center gap-3 mt-3">
                <p className="text-xs text-muted">Send reminder</p>
                <select className="select text-sm py-1 w-auto"
                  value={settings.reminder_days}
                  onChange={e => setSettings(s => ({ ...s, reminder_days: Number(e.target.value) }))}>
                  <option value={1}>1 day</option>
                  <option value={2}>2 days</option>
                  <option value={3}>3 days</option>
                </select>
                <p className="text-xs text-muted">before due date</p>
                <button onClick={() => sendTest('due_reminder')} disabled={testing === 'due_reminder'}
                  className="ml-auto text-xs text-accent2 hover:underline font-semibold disabled:opacity-40">
                  {testSent === 'due_reminder' ? '✅ Sent!' : testing === 'due_reminder' ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            )}
          </div>

          {/* Daily Digest */}
          <div className={`rounded-xl p-4 border transition-all ${settings.daily_digest ? 'bg-accent3/5 border-accent3/20' : 'bg-surface2 border-border'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌅</span>
                <div>
                  <p className="font-semibold text-sm">Daily Digest</p>
                  <p className="text-xs text-muted">Morning summary of today's tasks</p>
                </div>
              </div>
              <button onClick={() => setSettings(s => ({ ...s, daily_digest: !s.daily_digest }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.daily_digest ? 'bg-accent3' : 'bg-surface2 border border-border'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.daily_digest ? 'translate-x-5' : 'translate-x-0.5'}`}/>
              </button>
            </div>
            {settings.daily_digest && (
              <div className="flex items-center gap-3 mt-3">
                <p className="text-xs text-muted">Send at</p>
                <input type="time" className="input text-sm py-1 w-auto"
                  value={settings.digest_time}
                  onChange={e => setSettings(s => ({ ...s, digest_time: e.target.value }))}/>
                <p className="text-xs text-muted">every morning</p>
                <button onClick={() => sendTest('daily_digest')} disabled={testing === 'daily_digest'}
                  className="ml-auto text-xs text-accent2 hover:underline font-semibold disabled:opacity-40">
                  {testSent === 'daily_digest' ? '✅ Sent!' : testing === 'daily_digest' ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            )}
          </div>

          {/* Overdue Alerts */}
          <div className={`rounded-xl p-4 border transition-all ${settings.overdue_alerts ? 'bg-danger/5 border-danger/20' : 'bg-surface2 border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="font-semibold text-sm">Overdue Alerts</p>
                  <p className="text-xs text-muted">Instant email when a task passes its due date</p>
                </div>
              </div>
              <button onClick={() => setSettings(s => ({ ...s, overdue_alerts: !s.overdue_alerts }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.overdue_alerts ? 'bg-danger' : 'bg-surface2 border border-border'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.overdue_alerts ? 'translate-x-5' : 'translate-x-0.5'}`}/>
              </button>
            </div>
            {settings.overdue_alerts && (
              <div className="flex justify-end mt-2">
                <button onClick={() => sendTest('overdue_alert')} disabled={testing === 'overdue_alert'}
                  className="text-xs text-accent2 hover:underline font-semibold disabled:opacity-40">
                  {testSent === 'overdue_alert' ? '✅ Sent!' : testing === 'overdue_alert' ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-accent2/5 border border-accent2/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-accent2 mb-2">📋 Active Notifications</p>
            <div className="space-y-1 text-xs text-muted">
              {settings.due_reminder && <p>⏰ Due reminders → {settings.reminder_days} day(s) before due date</p>}
              {settings.daily_digest && <p>🌅 Daily digest → every morning at {settings.digest_time}</p>}
              {settings.overdue_alerts && <p>🚨 Overdue alerts → immediately when task passes due date</p>}
              {!settings.due_reminder && !settings.daily_digest && !settings.overdue_alerts && (
                <p className="text-muted">No notifications enabled</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 border-t border-border">
          <button onClick={saveSettings} disabled={saving}
            className="btn-primary w-full py-3 text-sm disabled:opacity-40">
            {saving ? 'Saving...' : saved ? '✅ Settings Saved!' : 'Save Notification Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
