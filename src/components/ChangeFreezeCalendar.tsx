'use client'
// ============================================================
// src/components/ChangeFreezeCalendar.tsx
// NEW FILE — IT Change Freeze Calendar
// Admin: global freeze periods | PM: project-level freezes
// Integrates with Gantt — flags tasks during freeze windows
// ============================================================
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FreezePeriod {
  id:          string
  name:        string
  start_date:  string
  end_date:    string
  reason:      string
  scope:       'global' | 'project'
  project_id?: string
  project_name?:string
  color:       string
  created_by:  string
  created_at:  string
}

interface Project { id: string; name: string; color?: string }

const FREEZE_COLORS = [
  { label: 'Red',    value: '#ef4444' },
  { label: 'Amber',  value: '#f59e0b' },
  { label: 'Blue',   value: '#3b82f6' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Slate',  value: '#64748b' },
]

const PRESET_REASONS = [
  'Christmas / New Year Freeze',
  'Quarter-End Freeze',
  'Financial Year-End',
  'Major Product Release',
  'Audit Period',
  'Regulatory Compliance Window',
  'Data Centre Migration',
  'Disaster Recovery Test',
  'Custom',
]

function formatDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const e = new Date(end).toLocaleDateString('en-GB',   { day: 'numeric', month: 'short', year: 'numeric' })
  return `${s} → ${e}`
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - new Date().getTime()) / 86400000)
}

function isActive(start: string, end: string) {
  const now = new Date()
  return new Date(start) <= now && new Date(end) >= now
}

function isUpcoming(start: string) {
  return new Date(start) > new Date()
}

export default function ChangeFreezeCalendar({ isAdmin, userId }: { isAdmin: boolean; userId: string }) {
  const supabase = createClient()
  const [freezes,   setFreezes]   = useState<FreezePeriod[]>([])
  const [projects,  setProjects]  = useState<Project[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string|null>(null)
  const [filter,    setFilter]    = useState<'all'|'active'|'upcoming'|'past'>('all')

  const [form, setForm] = useState({
    name:       '',
    start_date: '',
    end_date:   '',
    reason:     PRESET_REASONS[0],
    customReason: '',
    scope:      'global' as 'global' | 'project',
    project_id: '',
    color:      '#ef4444',
  })

  // ── Load data ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: freezeData }, { data: projectData }] = await Promise.all([
        supabase.from('change_freezes').select('*').order('start_date', { ascending: true }),
        supabase.from('projects').select('id, name, color').eq('owner_id', userId),
      ])
      setFreezes(freezeData ?? [])
      setProjects(projectData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Save freeze ───────────────────────────────────────
  async function saveFreeeze() {
    if (!form.name || !form.start_date || !form.end_date) return
    if (new Date(form.start_date) > new Date(form.end_date)) return
    setSaving(true)
    const reason = form.reason === 'Custom' ? form.customReason : form.reason
    const project = projects.find(p => p.id === form.project_id)
    const { data, error } = await supabase.from('change_freezes').insert({
      name:         form.name,
      start_date:   form.start_date,
      end_date:     form.end_date,
      reason,
      scope:        isAdmin ? form.scope : 'project',
      project_id:   form.scope === 'project' ? form.project_id || null : null,
      project_name: form.scope === 'project' ? project?.name : null,
      color:        form.color,
      created_by:   userId,
    }).select().single()
    if (data) setFreezes(f => [...f, data])
    setSaving(false)
    setShowForm(false)
    setForm({ name:'', start_date:'', end_date:'', reason: PRESET_REASONS[0], customReason:'', scope:'global', project_id:'', color:'#ef4444' })
  }

  // ── Delete freeze ─────────────────────────────────────
  async function deleteFreeze(id: string) {
    setDeleting(id)
    await supabase.from('change_freezes').delete().eq('id', id)
    setFreezes(f => f.filter(x => x.id !== id))
    setDeleting(null)
  }

  // ── Filtered list ─────────────────────────────────────
  const filtered = freezes.filter(f => {
    if (filter === 'active')   return isActive(f.start_date, f.end_date)
    if (filter === 'upcoming') return isUpcoming(f.start_date)
    if (filter === 'past')     return new Date(f.end_date) < new Date()
    return true
  })

  const activeFreezes   = freezes.filter(f => isActive(f.start_date, f.end_date))
  const upcomingFreezes = freezes.filter(f => isUpcoming(f.start_date))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-syne font-black text-lg text-slate-900">🗓️ Change Freeze Calendar</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Define freeze windows — tasks scheduled during these periods will be flagged on the Gantt
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4 py-2">
          {showForm ? '✕ Cancel' : '+ Add Freeze Period'}
        </button>
      </div>

      {/* Active freeze banner */}
      {activeFreezes.length > 0 && (
        <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50 flex items-center gap-3">
          <span className="text-2xl animate-pulse">🔴</span>
          <div>
            <p className="font-syne font-bold text-sm text-red-700">
              Active Freeze: {activeFreezes.map(f => f.name).join(', ')}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Changes are frozen until {activeFreezes.map(f =>
                new Date(f.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              ).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="card border-2 border-cyan-100 bg-cyan-50/30 space-y-4">
          <p className="font-syne font-bold text-sm text-slate-800">New Freeze Period</p>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Freeze Name</label>
              <input className="input" placeholder="e.g. Christmas Freeze 2025"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            {/* Start date */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Start Date</label>
              <input type="date" className="input"
                value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>

            {/* End date */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">End Date</label>
              <input type="date" className="input"
                value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reason</label>
              <select className="select" value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
                {PRESET_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
              {form.reason === 'Custom' && (
                <input className="input mt-2" placeholder="Describe the freeze reason…"
                  value={form.customReason}
                  onChange={e => setForm(f => ({ ...f, customReason: e.target.value }))} />
              )}
            </div>

            {/* Scope — admin only gets global option */}
            {isAdmin && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Scope</label>
                <div className="flex gap-2">
                  {(['global','project'] as const).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, scope: s }))}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all
                        ${form.scope === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                      {s === 'global' ? '🌐 Global' : '📋 Project'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Project selector */}
            {(form.scope === 'project' || !isAdmin) && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Project</label>
                <select className="select" value={form.project_id}
                  onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                  <option value="">All my projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            {/* Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Colour</label>
              <div className="flex gap-2">
                {FREEZE_COLORS.map(c => (
                  <button key={c.value} onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all
                      ${form.color === c.value ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                    style={{ background: c.value }}
                    title={c.label} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={saveFreeeze} disabled={saving || !form.name || !form.start_date || !form.end_date}
              className="btn-primary px-6">
              {saving ? 'Saving…' : '💾 Save Freeze Period'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost px-6">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {([
          ['all',      `All (${freezes.length})`],
          ['active',   `🔴 Active (${activeFreezes.length})`],
          ['upcoming', `🔜 Upcoming (${upcomingFreezes.length})`],
          ['past',     'Past'],
        ] as const).map(([f, label]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
              ${filter === f ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Freeze list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <div className="animate-spin text-3xl mb-3">⏳</div>
          <p className="text-sm">Loading freeze periods…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="font-syne font-bold text-slate-700 mb-1">No freeze periods {filter !== 'all' ? `(${filter})` : 'yet'}</p>
          <p className="text-slate-400 text-sm">
            {filter === 'all' ? 'Add your first change freeze window above' : `No ${filter} freeze periods found`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => {
            const active   = isActive(f.start_date, f.end_date)
            const upcoming = isUpcoming(f.start_date)
            const past     = new Date(f.end_date) < new Date()
            const days     = upcoming ? daysUntil(f.start_date) : active ? daysUntil(f.end_date) : null
            const canDelete = isAdmin || f.created_by === userId

            return (
              <div key={f.id} className={`flex items-start gap-4 p-4 rounded-xl border-l-4 transition-all
                ${active   ? 'bg-red-50 border-red-200'    : ''}
                ${upcoming ? 'bg-amber-50 border-amber-200' : ''}
                ${past     ? 'bg-slate-50 border-slate-200 opacity-60' : ''}
                border-l-[5px]`}
                style={{ borderLeftColor: f.color }}>

                {/* Color dot */}
                <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ background: f.color }} />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-syne font-bold text-sm text-slate-900">{f.name}</span>
                    {active   && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold border border-red-200 animate-pulse">🔴 Active</span>}
                    {upcoming && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">🔜 In {days}d</span>}
                    {past     && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold border border-slate-200">Past</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border
                      ${f.scope === 'global' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-violet-100 text-violet-700 border-violet-200'}`}>
                      {f.scope === 'global' ? '🌐 Global' : `📋 ${f.project_name || 'Project'}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-mono-code">{formatDateRange(f.start_date, f.end_date)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{f.reason}</p>
                </div>

                {/* Duration badge */}
                <div className="text-center shrink-0">
                  <p className="font-syne font-black text-lg" style={{ color: f.color }}>
                    {Math.ceil((new Date(f.end_date).getTime() - new Date(f.start_date).getTime()) / 86400000)}
                  </p>
                  <p className="text-[10px] text-slate-400">days</p>
                </div>

                {/* Delete */}
                {canDelete && (
                  <button onClick={() => deleteFreeze(f.id)}
                    disabled={deleting === f.id}
                    className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                    {deleting === f.id ? '…' : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-xs font-semibold text-blue-700 mb-1">💡 How it works</p>
        <p className="text-xs text-blue-600 leading-relaxed">
          Tasks on the Gantt chart that fall within a freeze window will show a ⚠️ warning badge.
          Global freezes apply to all projects. Project-level freezes only flag tasks in the selected project.
          Freeze periods do not block task creation — they only display warnings.
        </p>
      </div>
    </div>
  )
}
