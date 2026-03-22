'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminAuditLog from '@/components/AdminAuditLog'
import AdminSubscriptions from '@/components/AdminSubscriptions'
import { PLAN_DISPLAY, type Plan } from '@/lib/planConfig'

const STATUS_COLORS: Record<string, string> = {
  new:         'bg-accent/10 text-accent border-accent/30',
  reviewing:   'bg-warn/10 text-warn border-warn/30',
  planned:     'bg-accent2/10 text-purple-300 border-accent2/30',
  implemented: 'bg-accent3/10 text-accent3 border-accent3/30',
  declined:    'bg-danger/10 text-danger border-danger/30',
}

const PRIORITY_COLORS: Record<string, string> = {
  low:      'text-muted',
  medium:   'text-accent',
  high:     'text-warn',
  critical: 'text-danger',
}

const TABS = ['Overview', 'Feedback', 'Users', 'Audit Log', 'Subscriptions']
const PAGE_SIZE = 15

export default function AdminClient({ profiles, projects, tasks, articles, feedback }: {
  profiles: any[], projects: any[], tasks: any[], articles: any[], feedback: any[]
}) {
  const supabase = createClient()
  const [tab, setTab]                   = useState('Overview')
  const [feedbackList, setFeedbackList] = useState(feedback)
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
  const [filterStatus, setFilterStatus]   = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [adminNote, setAdminNote]         = useState('')
  const [savingNote, setSavingNote]       = useState(false)
  const [userPage, setUserPage]           = useState(1)
  const [userSearch, setUserSearch]       = useState('')

  const totalPages = Math.ceil(profiles.length / PAGE_SIZE)
  const pagedUsers = profiles.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE)
  const filteredUsers = userSearch.trim()
    ? profiles.filter(u =>
        u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.country?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.ip_country?.toLowerCase().includes(userSearch.toLowerCase())
      )
    : pagedUsers

  const stats = [
    { label: 'Total Users',    value: profiles.length,                                     color: 'border-accent/40',  icon: '👥' },
    { label: 'Total Projects', value: projects.length,                                     color: 'border-accent2/40', icon: '📋' },
    { label: 'Total Tasks',    value: tasks.length,                                        color: 'border-accent3/40', icon: '✅' },
    { label: 'KB Articles',    value: articles.length,                                     color: 'border-warn/40',    icon: '📚' },
    { label: 'Feedback Items', value: feedbackList.length,                                 color: 'border-danger/40',  icon: '💬' },
    { label: 'New Feedback',   value: feedbackList.filter(f => f.status === 'new').length, color: 'border-accent/40',  icon: '🔔' },
  ]

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const signupsByDay = last7.map(day => ({
    date:  day,
    count: profiles.filter((u: any) => u.created_at?.startsWith(day)).length,
    label: new Date(day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  }))
  const maxSignups = Math.max(...signupsByDay.map(d => d.count), 1)

  const countryMap: Record<string, number> = {}
  profiles.forEach((u: any) => {
    const c = u.ip_country || u.country
    if (c) countryMap[c] = (countryMap[c] ?? 0) + 1
  })
  const countries = Object.entries(countryMap).sort((a, b) => b[1] - a[1])

  const filteredFeedback = feedbackList.filter(f => {
    const matchStatus = filterStatus === 'all' || f.status === filterStatus
    const matchCat    = filterCategory === 'all' || f.category === filterCategory
    return matchStatus && matchCat
  })
  const categories = [...new Set(feedbackList.map(f => f.category))]

  const ratingCounts = [1,2,3,4,5].map(r => ({
    rating: r,
    count:  feedbackList.filter(f => f.rating === r).length,
    emoji:  r <= 2 ? '😕' : r === 3 ? '😐' : r === 4 ? '😊' : '🤩',
  }))
  const avgRating = feedbackList.length > 0
    ? (feedbackList.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedbackList.length).toFixed(1)
    : '—'

  async function updateFeedbackStatus(id: string, status: string) {
    await fetch('/api/admin/feedback', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status } : f))
    if (selectedFeedback?.id === id) setSelectedFeedback((f: any) => ({ ...f, status }))
  }

  async function saveNote(id: string) {
    setSavingNote(true)
    await fetch('/api/admin/feedback', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, admin_note: adminNote }) })
    setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, admin_note: adminNote } : f))
    setSelectedFeedback((f: any) => ({ ...f, admin_note: adminNote }))
    setSavingNote(false)
  }

  function openFeedback(f: any) {
    setSelectedFeedback(f)
    setAdminNote(f.admin_note ?? '')
    if (f.status === 'new') updateFeedbackStatus(f.id, 'reviewing')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-syne font-black text-2xl">Admin Dashboard</h2>
          <p className="text-muted text-sm mt-1">NexPlan platform management</p>
        </div>
        <span className="text-xs bg-danger/10 text-danger px-3 py-1.5 rounded-lg font-mono-code border border-danger/20">
          🔐 Administrator
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === t ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
            {t === 'Audit Log'     ? '🔍 Audit Log'     :
             t === 'Subscriptions' ? '💳 Subscriptions' : t}
            {t === 'Feedback' && feedbackList.filter(f => f.status === 'new').length > 0 && (
              <span className="ml-2 w-4 h-4 bg-danger rounded-full text-[10px] text-white inline-flex items-center justify-center">
                {feedbackList.filter(f => f.status === 'new').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(s => (
              <div key={s.label} className={`card border ${s.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-syne font-bold text-muted uppercase tracking-wider">{s.label}</p>
                  <span className="text-xl">{s.icon}</span>
                </div>
                <p className="font-syne font-black text-5xl tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-syne font-bold text-lg mb-5">User Signups — Last 7 Days</h3>
            <div className="flex items-end gap-3 h-36">
              {signupsByDay.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-mono-code text-muted">{d.count || ''}</span>
                  <div className="w-full rounded-t-lg bg-accent/10 relative" style={{ height: '80px' }}>
                    <div className="absolute bottom-0 w-full rounded-t-lg bg-accent transition-all duration-700"
                      style={{ height: `${(d.count / maxSignups) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}/>
                  </div>
                  <span className="text-[10px] text-muted font-mono-code">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {countries.length > 0 && (
            <div className="card">
              <h3 className="font-syne font-bold text-lg mb-4">Users by Country <span className="text-xs text-muted font-normal ml-1">(IP detected)</span></h3>
              <div className="space-y-2">
                {countries.slice(0, 10).map(([country, count]) => (
                  <div key={country} className="flex items-center gap-3">
                    <span className="text-sm text-muted w-32 truncate">{country}</span>
                    <div className="flex-1 bg-surface2 rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: `${(count / profiles.length) * 100}%` }}/>
                    </div>
                    <span className="font-mono-code text-xs text-muted w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FEEDBACK */}
      {tab === 'Feedback' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <select className="select w-auto text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              {['new','reviewing','planned','implemented','declined'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select w-auto text-sm" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
            </select>
            <span className="self-center text-sm text-muted font-mono-code">{filteredFeedback.length} items</span>
          </div>

          {filteredFeedback.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-muted">No feedback yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredFeedback.map(f => (
                <div key={f.id} onClick={() => openFeedback(f)}
                  className="card cursor-pointer hover:border-accent/40 transition-all hover:-translate-y-0.5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-lg border font-mono-code ${STATUS_COLORS[f.status] ?? STATUS_COLORS.new}`}>{f.status}</span>
                      <span className="text-xs bg-surface2 px-2 py-1 rounded-lg text-muted">{f.category}</span>
                      <span className="text-xs bg-surface2 px-2 py-1 rounded-lg text-muted">{f.feature_area}</span>
                      <span className={`text-xs font-semibold ${PRIORITY_COLORS[f.priority]}`}>↑ {f.priority}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-lg">{[,'😕','😕','😐','😊','🤩'][f.rating]}</span>
                      <span className="font-syne font-bold">{f.rating}/5</span>
                    </div>
                  </div>
                  {f.title && <p className="font-syne font-bold mb-1">{f.title}</p>}
                  <p className="text-sm text-muted line-clamp-2">{f.message}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="font-mono-code text-xs text-muted">{f.user_email}</span>
                    <span className="font-mono-code text-xs text-muted">{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USERS */}
      {tab === 'Users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <input
              className="input text-sm w-64"
              placeholder="Search name, email, country…"
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setUserPage(1) }}
            />
            <span className="text-xs text-muted font-mono-code">
              {userSearch ? `${filteredUsers.length} results` : `${profiles.length} total · Page ${userPage} of ${totalPages}`}
            </span>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['#','User','Email','Plan','Role','Country (Selected)','Country (IP)','IP Address','Projects','Joined'].map(h => (
                      <th key={h} className="text-left text-xs font-syne font-bold text-muted uppercase tracking-wide py-3 px-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u: any, idx: number) => {
                    const userProjects = projects.filter((p: any) => p.owner_id === u.id).length
                    const rowNum = userSearch ? idx + 1 : (userPage - 1) * PAGE_SIZE + idx + 1
                    return (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                        <td className="px-4 py-3 font-mono-code text-xs text-muted">{rowNum}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-[10px] font-black text-black shrink-0">
                              {(u.full_name ?? u.email ?? 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold whitespace-nowrap">{u.full_name ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono-code text-xs text-muted">{u.email}</td>
                        <td className="px-4 py-3">
                          {(() => {
                            const plan = (u.plan ?? 'free') as Plan
                            const d = PLAN_DISPLAY[plan]
                            return (
                              <span className={`text-[11px] px-2 py-1 rounded-lg font-semibold border ${d.bgColor} ${d.color} ${d.borderColor}`}>
                                {d.badge}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-lg whitespace-nowrap">{u.role ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">{u.country ?? '—'}</td>
                        <td className="px-4 py-3">
                          {u.ip_country
                            ? <span className="text-xs bg-accent3/10 text-accent3 px-2 py-1 rounded-lg font-mono-code">{u.ip_country}</span>
                            : <span className="text-xs text-muted/40">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 font-mono-code text-xs text-muted/60">{u.ip_address ?? '—'}</td>
                        <td className="px-4 py-3 font-mono-code text-xs text-accent">{userProjects}</td>
                        <td className="px-4 py-3 font-mono-code text-xs text-muted whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!userSearch && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-xs text-muted font-mono-code">
                  Showing {(userPage - 1) * PAGE_SIZE + 1}–{Math.min(userPage * PAGE_SIZE, profiles.length)} of {profiles.length} users
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-border hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setUserPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors
                        ${userPage === p ? 'bg-accent text-black' : 'border border-border hover:bg-surface2 text-muted'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setUserPage(p => Math.min(totalPages, p + 1))} disabled={userPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-border hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUDIT LOG */}
      {tab === 'Audit Log' && <AdminAuditLog />}

      {/* SUBSCRIPTIONS */}
      {tab === 'Subscriptions' && <AdminSubscriptions />}

      {/* FEEDBACK DETAIL MODAL */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFeedback(null)}>
          <div className="card w-full max-w-2xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 pb-4 border-b border-border shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-xs px-2 py-1 rounded-lg border font-mono-code ${STATUS_COLORS[selectedFeedback.status]}`}>{selectedFeedback.status}</span>
                  <span className="text-xs bg-surface2 px-2 py-1 rounded-lg text-muted">{selectedFeedback.category}</span>
                  <span className="text-xs bg-surface2 px-2 py-1 rounded-lg text-muted">{selectedFeedback.feature_area}</span>
                </div>
                <h3 className="font-syne font-black text-lg">{selectedFeedback.title || selectedFeedback.category}</h3>
                <p className="text-xs text-muted font-mono-code mt-1">{selectedFeedback.user_email} · {new Date(selectedFeedback.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedFeedback(null)} className="text-muted hover:text-text text-xl px-2">✕</button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 flex-1">
              <div className="flex items-center gap-3 p-4 bg-surface2 rounded-xl">
                <span className="text-3xl">{[,'😕','😕','😐','😊','🤩'][selectedFeedback.rating]}</span>
                <div>
                  <p className="font-bold">{selectedFeedback.rating}/5 stars</p>
                  <p className="text-xs text-muted">Priority: <span className={PRIORITY_COLORS[selectedFeedback.priority]}>{selectedFeedback.priority}</span></p>
                </div>
              </div>

              <div>
                <p className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-2">Feedback</p>
                <p className="text-sm leading-relaxed bg-surface2 rounded-xl p-4">{selectedFeedback.message}</p>
              </div>

              <div>
                <p className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {['new','reviewing','planned','implemented','declined'].map(s => (
                    <button key={s} onClick={() => updateFeedbackStatus(selectedFeedback.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedFeedback.status === s ? STATUS_COLORS[s] : 'border-border text-muted hover:border-accent/50'
                      }`}>
                      {s === 'new' ? '🔔 New' : s === 'reviewing' ? '👁 Reviewing' : s === 'planned' ? '📅 Planned' : s === 'implemented' ? '✅ Implemented' : '❌ Declined'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-2">Admin Notes</p>
                <textarea className="input resize-none h-24 text-sm"
                  placeholder="Add internal notes about this feedback..."
                  value={adminNote} onChange={e => setAdminNote(e.target.value)}/>
                <button onClick={() => saveNote(selectedFeedback.id)} disabled={savingNote}
                  className="btn-primary text-xs px-4 py-2 mt-2">
                  {savingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
