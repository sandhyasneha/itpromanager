'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Feature Request', 'Bug Report', 'UI/UX Improvement', 'Performance', 'Documentation', 'General Feedback']
const AREAS = ['Dashboard', 'Kanban Board', 'Project Plan', 'Knowledge Base', 'AI Generator', 'Network Diagram', 'Settings', 'Overall App']
const ADMIN_EMAIL = 'admin@nexplan.io'

export default function FeedbackPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email === ADMIN_EMAIL) router.replace('/admin')
    })
  }, [])
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    rating: 0,
    category: 'General Feedback',
    title: '',
    message: '',
    feature_area: 'Overall App',
    priority: 'medium',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.message.trim() || form.rating === 0) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('feedback').insert({
      user_id: user!.id,
      user_email: user!.email,
      rating: form.rating,
      category: form.category,
      title: form.title,
      message: form.message,
      feature_area: form.feature_area,
      priority: form.priority,
      status: 'new',
    })
    setSaving(false)
    if (!error) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-accent3/10 border border-accent3/30 flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
        <h2 className="font-syne font-black text-2xl mb-3">Thank you!</h2>
        <p className="text-muted mb-2">Your feedback has been submitted successfully.</p>
        <p className="text-muted text-sm mb-8">Our team reviews every submission and uses it to shape what we build next.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => {
            setSubmitted(false)
            setForm({ rating: 0, category: 'General Feedback', title: '', message: '', feature_area: 'Overall App', priority: 'medium' })
          }} className="btn-ghost px-5 py-2">Submit Another</button>
          <button onClick={() => router.push('/dashboard')} className="btn-primary px-5 py-2">Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="font-syne font-black text-2xl mb-2">Share Your Feedback</h2>
        <p className="text-muted text-sm">Help us improve NexPlan. Your feedback goes directly to our team and shapes what we build next.</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Rating */}
        <div className="card p-6">
          <label className="block font-syne font-bold mb-4">
            How would you rate NexPlan overall? <span className="text-danger">*</span>
          </label>
          <div className="flex items-center gap-3">
            {[1,2,3,4,5].map(r => (
              <button type="button" key={r} onClick={() => setForm(f => ({ ...f, rating: r }))}
                className={`w-12 h-12 rounded-xl border-2 font-black text-xl transition-all duration-200 ${
                  form.rating >= r ? 'border-warn bg-warn/10 scale-110' : 'border-border text-muted hover:border-warn/50'
                }`}>
                {r <= 2 ? '😕' : r === 3 ? '😐' : r === 4 ? '😊' : '🤩'}
              </button>
            ))}
            {form.rating > 0 && (
              <span className="text-sm text-muted ml-1">
                {['','Needs work','Below average','Average','Good','Excellent!'][form.rating]}
              </span>
            )}
          </div>
        </div>

        {/* Category + Area + Priority */}
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Feedback Type</label>
              <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Feature Area</label>
              <select className="select" value={form.feature_area} onChange={e => setForm(f => ({ ...f, feature_area: e.target.value }))}>
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-2">How important is this to you?</label>
            <div className="flex gap-2">
              {[
                { val: 'low', label: 'Low', cls: 'hover:border-muted' },
                { val: 'medium', label: 'Medium', cls: 'hover:border-accent' },
                { val: 'high', label: 'High', cls: 'hover:border-warn' },
                { val: 'critical', label: 'Critical', cls: 'hover:border-danger' },
              ].map(p => (
                <button type="button" key={p.val} onClick={() => setForm(f => ({ ...f, priority: p.val }))}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    form.priority === p.val
                      ? p.val === 'critical' ? 'bg-danger/10 border-danger text-danger'
                        : p.val === 'high' ? 'bg-warn/10 border-warn text-warn'
                        : p.val === 'medium' ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-surface2 border-border text-muted'
                      : `border-border text-muted ${p.cls}`}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Title <span className="text-muted font-normal">(optional)</span></label>
            <input className="input" placeholder="Brief summary..."
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
          </div>
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">
              Feedback <span className="text-danger">*</span>
            </label>
            <textarea className="input min-h-[140px] resize-y"
              placeholder="What's working well? What could be better? What features would you love to see? Be as specific as you like..."
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}/>
            <p className="text-xs text-muted mt-1">{form.message.length} characters</p>
          </div>
        </div>

        <button type="submit"
          disabled={saving || form.rating === 0 || !form.message.trim()}
          className="btn-primary w-full py-3 text-base justify-center disabled:opacity-40">
          {saving ? 'Submitting...' : 'Submit Feedback →'}
        </button>
        <p className="text-xs text-muted text-center">We may reach out to you at your registered email for more details.</p>
      </form>
    </div>
  )
}
