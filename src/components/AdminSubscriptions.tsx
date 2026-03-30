'use client'
// ============================================================
// src/components/AdminSubscriptions.tsx
// NEW FILE — Add as a tab in AdminClient.tsx
// Admin can: configure plan features, assign plans to users,
// view all subscriptions, override individual users
// ============================================================

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FEATURE_DEFS, DEFAULT_PLAN_FEATURES, PLAN_DISPLAY, PLAN_PRICING,
  type Plan, type FeatureKey,
} from '@/lib/planConfig'

interface UserProfile {
  id: string
  email: string
  full_name: string
  plan: Plan
  plan_billing: string
  plan_expires_at: string | null
  plan_updated_at: string
  country: string
  role: string
  created_at: string
}

const PLANS: Plan[] = ['free', 'pro', 'enterprise']

const CAT_COLORS: Record<string, string> = {
  Core:          'text-accent',
  AI:            'text-accent2',
  Collaboration: 'text-accent3',
  Enterprise:    'text-warn',
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function AdminSubscriptions() {
  const supabase = createClient()
  const [tab, setTab] = useState<'users' | 'plans' | 'configure'>('users')

  // Users state
  const [users, setUsers]           = useState<UserProfile[]>([])
  const [loading, setLoading]       = useState(true)
  const [searchEmail, setSearch]    = useState('')
  const [filterPlan, setFilterPlan] = useState<'all' | Plan>('all')
  const [page, setPage]             = useState(1)
  const PAGE_SIZE = 20
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [newPlan, setNewPlan]         = useState<Plan>('free')
  const [newBilling, setNewBilling]   = useState<'monthly' | 'yearly'>('monthly')
  const [savingUser, setSavingUser]   = useState(false)

  // Plan config state
  const [planFeatures, setPlanFeatures] = useState<Record<Plan, FeatureKey[]>>({ ...DEFAULT_PLAN_FEATURES })
  const [savingPlan, setSavingPlan]     = useState<Plan | null>(null)
  const [savedPlan, setSavedPlan]       = useState<Plan | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    // Load users with plan info
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, plan, plan_billing, plan_expires_at, plan_updated_at, country, role, created_at')
      .order('created_at', { ascending: false })
    setUsers((profiles ?? []) as UserProfile[])

    // Load plan config from DB
    const { data: configs } = await supabase.from('plan_config').select('*')
    if (configs && configs.length > 0) {
      const updated = { ...DEFAULT_PLAN_FEATURES }
      configs.forEach((c: any) => {
        if (c.plan in updated) updated[c.plan as Plan] = c.features as FeatureKey[]
      })
      setPlanFeatures(updated)
    }
    setLoading(false)
  }

  // ── Assign plan to user ─────────────────────────────────
  async function assignPlan() {
    if (!editingUser) return
    setSavingUser(true)
    const { createClient: createServiceClient } = await import('@supabase/supabase-js').then(m => ({ createClient: m.createClient }))
    // Use regular supabase client (RLS disabled on profiles for admin)
    await supabase.from('profiles').update({
      plan:             newPlan,
      plan_billing:     newBilling,
      plan_updated_at:  new Date().toISOString(),
    }).eq('id', editingUser.id)

    // Log to subscriptions table
    await supabase.from('subscriptions').insert({
      user_id:    editingUser.id,
      user_email: editingUser.email,
      user_name:  editingUser.full_name,
      plan:       newPlan,
      billing:    newBilling,
      price_usd:  newPlan === 'pro' ? (newBilling === 'monthly' ? 5 : 50) : 0,
      status:     'active',
      assigned_by: 'admin',
    })

    // Update local state
    setUsers(us => us.map(u => u.id === editingUser.id
      ? { ...u, plan: newPlan, plan_billing: newBilling }
      : u
    ))
    setEditingUser(null)
    setSavingUser(false)
  }

  // ── Save plan config ────────────────────────────────────
  async function savePlanConfig(plan: Plan) {
    setSavingPlan(plan)
    await supabase.from('plan_config').update({
      features:   planFeatures[plan],
      updated_by: 'admin',
    }).eq('plan', plan)
    setSavingPlan(null)
    setSavedPlan(plan)
    setTimeout(() => setSavedPlan(null), 2000)
  }

  function toggleFeature(plan: Plan, feature: FeatureKey) {
    setPlanFeatures(prev => {
      const current = prev[plan] ?? []
      const updated = current.includes(feature)
        ? current.filter(f => f !== feature)
        : [...current, feature]
      return { ...prev, [plan]: updated }
    })
  }

  // ── Stats ───────────────────────────────────────────────
  const planCounts = PLANS.reduce((acc, p) => {
    acc[p] = users.filter(u => (u.plan ?? 'free') === p).length
    return acc
  }, {} as Record<Plan, number>)

  const filteredUsers = users.filter(u => {
    const matchPlan  = filterPlan === 'all' || (u.plan ?? 'free') === filterPlan
    const matchEmail = !searchEmail || u.email?.toLowerCase().includes(searchEmail.toLowerCase())
    return matchPlan && matchEmail
  })

  // Group features by category
  const categories = ['Core', 'AI', 'Collaboration', 'Enterprise']

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: '👥 Total Users', value: users.length,          color: 'text-muted   bg-surface2   border-border' },
          { label: '🎁 Free',        value: planCounts.free ?? 0,  color: 'text-accent  bg-accent/10  border-accent/20' },
          { label: '⚡ Pro',         value: planCounts.pro ?? 0,   color: 'text-accent2 bg-accent2/10 border-accent2/20' },
          { label: '🏢 Enterprise',  value: planCounts.enterprise ?? 0, color: 'text-accent3 bg-accent3/10 border-accent3/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border text-center ${s.color}`}>
            <p className="text-xs text-muted font-mono-code mb-1">{s.label}</p>
            <p className={`font-syne font-black text-3xl ${s.color.split(' ')[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-6">
        {([
          ['users',     '👥 Users & Plans'],
          ['plans',     '📋 Plan Summary'],
          ['configure', '⚙️ Configure Plans'],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
              ${tab === t ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted py-16 animate-pulse">Loading…</p>

      ) : tab === 'users' ? (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <input className="input text-sm flex-1 min-w-[200px]"
              placeholder="🔍 Search by email…"
              value={searchEmail} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            <div className="flex gap-1 p-1 bg-surface2 rounded-xl">
              {(['all', ...PLANS] as const).map(p => (
                <button key={p} onClick={() => setFilterPlan(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize
                    ${filterPlan === p ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
                  {p === 'all' ? 'All' : PLAN_DISPLAY[p].label}
                </button>
              ))}
            </div>
            <button onClick={loadAll} className="btn-ghost text-xs px-3 py-2">🔄 Refresh</button>
          </div>

          {/* Users table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface2 border-b border-border">
                  <tr>
                    {['User', 'Email', 'Plan', 'Billing', 'Plan Since', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-syne font-bold text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(user => {
                    const plan = (user.plan ?? 'free') as Plan
                    const d = PLAN_DISPLAY[plan]
                    return (
                      <tr key={user.id} className="border-b border-border/40 hover:bg-surface2/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-[10px] font-black text-black shrink-0">
                              {(user.full_name ?? user.email ?? 'U').slice(0,2).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold">{user.full_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono-code text-muted">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-1 rounded-lg font-semibold border ${d.bgColor} ${d.color} ${d.borderColor}`}>
                            {d.badge}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted capitalize">{user.plan_billing ?? 'monthly'}</td>
                        <td className="px-4 py-3 text-xs text-muted font-mono-code">
                          {user.plan_updated_at ? timeAgo(user.plan_updated_at) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setEditingUser(user); setNewPlan(plan); setNewBilling((user.plan_billing as any) ?? 'monthly') }}
                            className="text-xs text-accent hover:underline font-semibold">
                            Change Plan
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-muted text-sm">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredUsers.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-xs text-muted font-mono-code">
                  Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-border hover:bg-surface2 disabled:opacity-30 transition-colors">
                    ← Prev
                  </button>
                  {Array.from({ length: Math.ceil(filteredUsers.length/PAGE_SIZE) }, (_,i) => i+1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors
                        ${page === p ? 'bg-accent text-black' : 'border border-border hover:bg-surface2 text-muted'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(Math.ceil(filteredUsers.length/PAGE_SIZE), p+1))}
                    disabled={page === Math.ceil(filteredUsers.length/PAGE_SIZE)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-border hover:bg-surface2 disabled:opacity-30 transition-colors">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Change plan modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setEditingUser(null)}>
              <div className="card w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6 pb-4 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="font-mono-code text-xs text-muted mb-1">Change Plan</p>
                    <h3 className="font-syne font-black text-lg">{editingUser.full_name || editingUser.email}</h3>
                    <p className="text-xs text-muted font-mono-code">{editingUser.email}</p>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="text-muted hover:text-text text-xl">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-syne font-semibold text-muted mb-2">Select Plan</p>
                    <div className="space-y-2">
                      {PLANS.map(p => {
                        const d = PLAN_DISPLAY[p]
                        const pricing = PLAN_PRICING[p]
                        return (
                          <button key={p} onClick={() => setNewPlan(p)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all
                              ${newPlan === p ? `${d.bgColor} ${d.borderColor} ${d.color}` : 'bg-surface2 border-border text-muted hover:text-text'}`}>
                            <span className="font-semibold text-sm">{d.badge} {d.label}</span>
                            <span className="text-xs font-mono-code">
                              {pricing.monthly === 0 ? 'Free' : pricing.monthly === null ? 'Custom' : `$${pricing.monthly}/mo`}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {newPlan === 'pro' && (
                    <div>
                      <p className="text-xs font-syne font-semibold text-muted mb-2">Billing Period</p>
                      <div className="flex gap-2">
                        {(['monthly','yearly'] as const).map(b => (
                          <button key={b} onClick={() => setNewBilling(b)}
                            className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all capitalize
                              ${newBilling === b ? 'bg-accent2/10 border-accent2/40 text-accent2' : 'bg-surface2 border-border text-muted'}`}>
                            {b} {b === 'monthly' ? '($5)' : '($50/yr)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={assignPlan} disabled={savingUser}
                    className="btn-primary w-full py-3 text-sm disabled:opacity-40">
                    {savingUser ? 'Saving…' : `Assign ${PLAN_DISPLAY[newPlan].label} Plan`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>

      ) : tab === 'plans' ? (
        /* Plan summary */
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const d = PLAN_DISPLAY[plan]
            const features = planFeatures[plan] ?? []
            const pricing  = PLAN_PRICING[plan]
            const userCount = planCounts[plan] ?? 0
            return (
              <div key={plan} className={`card border ${d.borderColor}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`font-mono-code text-xs uppercase tracking-widest mb-1 ${d.color}`}>{d.label}</p>
                    <p className="font-syne font-black text-3xl">
                      {pricing.monthly === 0 ? 'Free' : pricing.monthly === null ? 'Custom' : `$${pricing.monthly}`}
                    </p>
                    {pricing.monthly !== null && pricing.monthly > 0 && (
                      <p className="text-xs text-muted">or ${pricing.yearly}/yr</p>
                    )}
                  </div>
                  <div className={`text-center px-3 py-2 rounded-xl ${d.bgColor} ${d.borderColor} border`}>
                    <p className={`font-syne font-black text-2xl ${d.color}`}>{userCount}</p>
                    <p className="text-[10px] text-muted">users</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {features.map(fk => {
                    const def = FEATURE_DEFS.find(f => f.key === fk)
                    if (!def) return null
                    return (
                      <div key={fk} className="flex items-center gap-2 text-xs">
                        <span className={`text-sm ${d.color}`}>✓</span>
                        <span className="text-muted">{def.icon} {def.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

      ) : (
        /* Configure plans */
        <div className="space-y-6">
          <div className="bg-warn/5 border border-warn/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-warn mb-1">⚠️ Important</p>
            <p className="text-xs text-muted">Changes here affect ALL users on that plan immediately. Saving applies instantly — no deployment needed.</p>
          </div>

          {PLANS.map(plan => {
            const d = PLAN_DISPLAY[plan]
            return (
              <div key={plan} className={`card border ${d.borderColor}`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className={`font-syne font-black text-xl ${d.color}`}>{d.badge} {d.label}</span>
                    <span className="text-xs text-muted font-mono-code">
                      {PLAN_PRICING[plan].monthly === 0 ? 'Free' : PLAN_PRICING[plan].monthly === null ? 'Custom' : `$${PLAN_PRICING[plan].monthly}/mo`}
                    </span>
                  </div>
                  <button onClick={() => savePlanConfig(plan)} disabled={savingPlan === plan}
                    className={`text-xs px-4 py-2 rounded-xl font-semibold border transition-all disabled:opacity-40
                      ${savedPlan === plan
                        ? 'text-accent3 bg-accent3/10 border-accent3/30'
                        : `${d.color} ${d.bgColor} ${d.borderColor} hover:opacity-80`}`}>
                    {savingPlan === plan ? 'Saving…' : savedPlan === plan ? '✅ Saved!' : 'Save Changes'}
                  </button>
                </div>

                {categories.map(cat => {
                  const catFeatures = FEATURE_DEFS.filter(f => f.category === cat)
                  return (
                    <div key={cat} className="mb-4">
                      <p className={`text-[10px] font-syne font-bold uppercase tracking-widest mb-2 ${CAT_COLORS[cat]}`}>
                        {cat}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {catFeatures.map(feat => {
                          const enabled = (planFeatures[plan] ?? []).includes(feat.key)
                          return (
                            <label key={feat.key}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all
                                ${enabled
                                  ? `${d.bgColor} ${d.borderColor}`
                                  : 'bg-surface2 border-border opacity-50'}`}>
                              <input type="checkbox" checked={enabled}
                                onChange={() => toggleFeature(plan, feat.key)}
                                className="rounded" />
                              <span className="text-sm">{feat.icon}</span>
                              <span className={`text-xs font-semibold ${enabled ? d.color : 'text-muted'}`}>
                                {feat.label}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
