'use client'
// ============================================================
// src/app/(app)/analytics/AnalyticsClient.tsx
// NEW FILE — Interactive analytics dashboard client component
// ============================================================
import { useState, useMemo } from 'react'

interface Props {
  currentUser:   any
  isAdmin:       boolean
  profiles:      any[]
  projects:      any[]
  tasks:         any[]
  auditLogs:     any[]
  subscriptions: any[]
}

// ── Helpers ───────────────────────────────────────────────
function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function shortDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// AI feature labels from audit log action
const AI_FEATURE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  'ai-project-manager': { label: 'AI Project Plan',    icon: '🤖', color: 'bg-violet-100 text-violet-700' },
  'ai-followup':        { label: 'AI Follow-Up Email', icon: '✉️', color: 'bg-cyan-100 text-cyan-700'     },
  'ai-status-report':   { label: 'AI Status Report',   icon: '📊', color: 'bg-blue-100 text-blue-700'     },
  'ai-risk':            { label: 'AI Risk Analysis',   icon: '🛡️', color: 'bg-orange-100 text-orange-700' },
  'ai-pcr':             { label: 'AI PCR Document',    icon: '🔀', color: 'bg-pink-100 text-pink-700'     },
  'kb-search':          { label: 'Knowledge Base',     icon: '📚', color: 'bg-green-100 text-green-700'   },
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${color}`}>
          {icon}
        </div>
      </div>
      <p className="font-syne font-black text-3xl text-slate-900 mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Mini bar chart ────────────────────────────────────────
function MiniBarChart({ data, color = '#00d4ff' }: {
  data: { label: string; value: number }[]
  color?: string
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-sm transition-all duration-500 relative group"
            style={{ height: `${Math.max((d.value / max) * 52, d.value > 0 ? 3 : 0)}px`, background: color, opacity: 0.8 }}>
            {d.value > 0 && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {d.value}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function AnalyticsClient({ currentUser, isAdmin, profiles, projects, tasks, auditLogs, subscriptions }: Props) {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'users' | 'activity'>('overview')

  const days  = period === '7d' ? getLast7Days() : getLast30Days()
  const cutoff = days[0]

  // ── Core metrics ─────────────────────────────────────────
  const totalUsers       = profiles.length
  const activeUsers      = profiles.filter(p => {
    const logs = auditLogs.filter(l => l.user_id === p.id && l.created_at >= cutoff)
    return logs.length > 0
  }).length
  const totalProjects    = projects.length
  const completedTasks   = tasks.filter(t => t.status === 'done').length
  const totalTasks       = tasks.length
  const completionRate   = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // ── Plan distribution ─────────────────────────────────────
  const planCounts = {
    free:       profiles.filter(p => (p.plan ?? 'free') === 'free').length,
    pro:        profiles.filter(p => p.plan === 'pro').length,
    enterprise: profiles.filter(p => p.plan === 'enterprise').length,
  }

  // ── Signup trend ──────────────────────────────────────────
  const signupTrend = days.map(day => ({
    label: shortDate(day),
    value: profiles.filter(p => p.created_at?.startsWith(day)).length,
  }))

  // ── AI usage stats ────────────────────────────────────────
  const aiLogs = auditLogs.filter(l =>
    l.created_at >= cutoff &&
    l.action_type === 'ai_call'
  )

  const aiByFeature = Object.entries(AI_FEATURE_MAP).map(([key, meta]) => ({
    key,
    ...meta,
    count: aiLogs.filter(l => l.action?.includes(key) || l.route?.includes(key)).length,
  })).sort((a, b) => b.count - a.count)

  const totalAiCalls = aiLogs.length
  const aiTrend = days.map(day => ({
    label: shortDate(day),
    value: aiLogs.filter(l => l.created_at?.startsWith(day)).length,
  }))

  // ── Feature usage (from audit logs) ──────────────────────
  const featureUsage = [
    { label: 'Kanban Board',    icon: '📋', count: auditLogs.filter(l => l.route?.includes('kanban') && l.created_at >= cutoff).length },
    { label: 'Project Plan',    icon: '📅', count: auditLogs.filter(l => l.route?.includes('project-plan') && l.created_at >= cutoff).length },
    { label: 'Knowledge Base',  icon: '📚', count: auditLogs.filter(l => l.route?.includes('knowledge') && l.created_at >= cutoff).length },
    { label: 'Reports',         icon: '📈', count: auditLogs.filter(l => l.route?.includes('report') && l.created_at >= cutoff).length },
    { label: 'Network Diagram', icon: '🗺️', count: auditLogs.filter(l => l.route?.includes('network') && l.created_at >= cutoff).length },
    { label: 'My Tasks',        icon: '✅', count: auditLogs.filter(l => l.route?.includes('my-tasks') && l.created_at >= cutoff).length },
  ].sort((a, b) => b.count - a.count)
  const maxFeature = Math.max(...featureUsage.map(f => f.count), 1)

  // ── Country breakdown ─────────────────────────────────────
  const countryMap: Record<string, number> = {}
  profiles.forEach(p => { if (p.country) countryMap[p.country] = (countryMap[p.country] ?? 0) + 1 })
  const countries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // ── Recent activity ───────────────────────────────────────
  const recentActivity = auditLogs
    .filter(l => l.created_at >= cutoff)
    .slice(0, 20)

  // ── Activity trend ────────────────────────────────────────
  const activityTrend = days.map(day => ({
    label: shortDate(day),
    value: auditLogs.filter(l => l.created_at?.startsWith(day)).length,
  }))

  const TABS = [
    { key: 'overview',  label: '📊 Overview'  },
    { key: 'ai',        label: '🤖 AI Usage'  },
    { key: 'users',     label: '👥 Users'     },
    { key: 'activity',  label: '🕐 Activity'  },
  ] as const

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-syne font-black text-2xl text-slate-900">
            {isAdmin ? 'Platform Analytics' : 'Your Usage Analytics'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? `Insights across all ${totalUsers} users` : 'Your personal NexPlan usage stats'}
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {(['7d', '30d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                ${period === p ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
              {p === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
              ${activeTab === t.key ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isAdmin ? (
              <>
                <StatCard icon="👥" label="Total Users"    value={totalUsers}    color="bg-cyan-50"    sub={`${activeUsers} active in period`} />
                <StatCard icon="📋" label="Total Projects" value={totalProjects} color="bg-violet-50"  sub={`${tasks.length} tasks total`} />
                <StatCard icon="🤖" label="AI Calls"       value={totalAiCalls} color="bg-blue-50"    sub={`in last ${period === '7d' ? '7' : '30'} days`} />
                <StatCard icon="✅" label="Completion Rate" value={`${completionRate}%`} color="bg-green-50" sub={`${completedTasks}/${totalTasks} tasks done`} />
              </>
            ) : (
              <>
                <StatCard icon="📋" label="My Projects"   value={projects.filter(p => p.owner_id === currentUser.id).length} color="bg-cyan-50" />
                <StatCard icon="✅" label="Tasks Done"    value={completedTasks} color="bg-green-50" sub={`${completionRate}% completion rate`} />
                <StatCard icon="🤖" label="AI Calls Used" value={totalAiCalls}  color="bg-violet-50" sub="in selected period" />
                <StatCard icon="🕐" label="Actions Taken" value={auditLogs.filter(l => l.created_at >= cutoff).length} color="bg-blue-50" sub="in selected period" />
              </>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* Signup / Activity trend */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne font-bold text-base text-slate-900">
                  {isAdmin ? 'New Signups' : 'Your Activity'}
                </h3>
                <span className="text-xs text-slate-400 font-mono-code">{period}</span>
              </div>
              <MiniBarChart
                data={isAdmin ? signupTrend : activityTrend}
                color="url(#grad1)"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-slate-400">{days[0] && shortDate(days[0])}</span>
                <span className="text-[10px] text-slate-400">{days[days.length-1] && shortDate(days[days.length-1])}</span>
              </div>
            </div>

            {/* AI usage trend */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne font-bold text-base text-slate-900">AI Usage Trend</h3>
                <span className="text-xs font-mono-code font-bold text-violet-600">{totalAiCalls} calls</span>
              </div>
              <MiniBarChart data={aiTrend} color="#7c3aed" />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-slate-400">{days[0] && shortDate(days[0])}</span>
                <span className="text-[10px] text-slate-400">{days[days.length-1] && shortDate(days[days.length-1])}</span>
              </div>
            </div>
          </div>

          {/* Feature usage */}
          <div className="card">
            <h3 className="font-syne font-bold text-base text-slate-900 mb-5">
              Most Used Features
            </h3>
            <div className="space-y-3">
              {featureUsage.map((f, i) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{f.icon}</span>
                      <span className="text-sm font-semibold text-slate-700">{f.label}</span>
                      {i === 0 && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">Top</span>}
                    </div>
                    <span className="text-sm font-mono-code font-bold text-slate-500">{f.count}</span>
                  </div>
                  <ProgressBar value={f.count} max={maxFeature}
                    color={i === 0 ? '#00d4ff' : i === 1 ? '#7c3aed' : '#94a3b8'} />
                </div>
              ))}
              {featureUsage.every(f => f.count === 0) && (
                <p className="text-slate-400 text-sm text-center py-4">No feature usage data yet for this period</p>
              )}
            </div>
          </div>

          {/* Plan distribution — admin only */}
          {isAdmin && (
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Free',       count: planCounts.free,       color: 'from-slate-400 to-slate-500',    bg: 'bg-slate-50',   text: 'text-slate-600',  badge: '🎁' },
                { label: 'Pro',        count: planCounts.pro,        color: 'from-cyan-400 to-violet-500',    bg: 'bg-cyan-50',    text: 'text-cyan-700',   badge: '⚡' },
                { label: 'Enterprise', count: planCounts.enterprise, color: 'from-violet-400 to-purple-600',  bg: 'bg-violet-50',  text: 'text-violet-700', badge: '🏢' },
              ].map(p => (
                <div key={p.label} className={`card ${p.bg} border-0`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono-code text-slate-400 uppercase tracking-widest mb-1">{p.badge} {p.label}</p>
                      <p className={`font-syne font-black text-4xl ${p.text}`}>{p.count}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {totalUsers > 0 ? Math.round((p.count / totalUsers) * 100) : 0}% of users
                      </p>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.color} opacity-20`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AI USAGE TAB ─────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="🤖" label="Total AI Calls" value={totalAiCalls} color="bg-violet-50" sub={`last ${period}`} />
            <StatCard icon="📊" label="Daily Average"  value={period === '7d' ? Math.round(totalAiCalls/7) : Math.round(totalAiCalls/30)} color="bg-blue-50" sub="calls per day" />
            <StatCard icon="⚡" label="Most Used"      value={aiByFeature[0]?.label ?? '—'} color="bg-cyan-50" />
            <StatCard icon="✅" label="Success Rate"
              value={`${auditLogs.length > 0 ? Math.round((auditLogs.filter(l => l.response_status !== 'error').length / auditLogs.length) * 100) : 100}%`}
              color="bg-green-50" sub="no errors" />
          </div>

          <div className="card">
            <h3 className="font-syne font-bold text-base text-slate-900 mb-2">AI Calls Over Time</h3>
            <p className="text-xs text-slate-400 mb-4">Daily AI feature usage — {period}</p>
            <MiniBarChart data={aiTrend} color="#7c3aed" />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-slate-400">{days[0] && shortDate(days[0])}</span>
              <span className="text-[10px] text-slate-400">{days[days.length-1] && shortDate(days[days.length-1])}</span>
            </div>
          </div>

          <div className="card">
            <h3 className="font-syne font-bold text-base text-slate-900 mb-5">AI Feature Breakdown</h3>
            {aiByFeature.every(f => f.count === 0) ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🤖</p>
                <p className="text-slate-400 text-sm">No AI usage recorded yet in this period</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {aiByFeature.map((f, i) => (
                  <div key={f.key}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-sm
                      ${i === 0 ? 'bg-violet-50 border-violet-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${f.color}`}>
                      {f.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800">{f.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <ProgressBar value={f.count} max={Math.max(...aiByFeature.map(x => x.count), 1)} color="#7c3aed" />
                      </div>
                    </div>
                    <span className="font-syne font-black text-2xl text-slate-700 shrink-0">{f.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI errors */}
          {isAdmin && (
            <div className="card">
              <h3 className="font-syne font-bold text-base text-slate-900 mb-4">Recent AI Errors</h3>
              {auditLogs.filter(l => l.response_status === 'error' && l.action_type === 'ai_call').length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-slate-400 text-sm">No AI errors — all systems healthy</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs
                    .filter(l => l.response_status === 'error' && l.action_type === 'ai_call')
                    .slice(0, 5)
                    .map((l, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                        <span className="text-red-500 text-lg">⚠️</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{l.route ?? l.action}</p>
                          <p className="text-xs text-slate-400 font-mono-code">{l.error_code} · {timeAgo(l.created_at)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── USERS TAB ─────────────────────────────────────── */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label="Total Users"  value={totalUsers}  color="bg-cyan-50" />
            <StatCard icon="🟢" label="Active Users" value={activeUsers} color="bg-green-50" sub={`in last ${period}`} />
            <StatCard icon="🎁" label="Free Users"   value={planCounts.free}  color="bg-slate-50" sub={`${totalUsers > 0 ? Math.round((planCounts.free/totalUsers)*100) : 0}% of total`} />
            <StatCard icon="⚡" label="Pro Users"    value={planCounts.pro}   color="bg-violet-50" sub={`${totalUsers > 0 ? Math.round((planCounts.pro/totalUsers)*100) : 0}% of total`} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Countries */}
            <div className="card">
              <h3 className="font-syne font-bold text-base text-slate-900 mb-4">Users by Country</h3>
              {countries.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No country data yet</p>
              ) : (
                <div className="space-y-3">
                  {countries.map(([country, count]) => (
                    <div key={country} className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700 w-32 truncate">{country}</span>
                      <div className="flex-1">
                        <ProgressBar value={count} max={countries[0][1]} color="#00d4ff" />
                      </div>
                      <span className="text-sm font-mono-code font-bold text-slate-500 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signup trend */}
            <div className="card">
              <h3 className="font-syne font-bold text-base text-slate-900 mb-1">New Signups</h3>
              <p className="text-xs text-slate-400 mb-4">{period === '7d' ? 'Last 7 days' : 'Last 30 days'}</p>
              <MiniBarChart data={signupTrend} color="#00d4ff" />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-slate-400">{shortDate(days[0])}</span>
                <span className="text-[10px] text-slate-400">{shortDate(days[days.length-1])}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">Total in period</span>
                <span className="font-syne font-black text-xl text-cyan-600">
                  {signupTrend.reduce((s, d) => s + d.value, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Most active users */}
          <div className="card">
            <h3 className="font-syne font-bold text-base text-slate-900 mb-4">Most Active Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['User', 'Plan', 'Actions', 'AI Calls', 'Country', 'Joined'].map(h => (
                      <th key={h} className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles
                    .map(p => ({
                      ...p,
                      actions: auditLogs.filter(l => l.user_id === p.id && l.created_at >= cutoff).length,
                      aiCalls: auditLogs.filter(l => l.user_id === p.id && l.action_type === 'ai_call' && l.created_at >= cutoff).length,
                    }))
                    .sort((a, b) => b.actions - a.actions)
                    .slice(0, 10)
                    .map(u => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                              {(u.full_name ?? u.email ?? 'U').slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{u.full_name || '—'}</p>
                              <p className="text-[11px] text-slate-400 font-mono-code truncate max-w-[120px]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-[11px] px-2 py-1 rounded-full font-bold
                            ${(u.plan ?? 'free') === 'pro' ? 'bg-violet-100 text-violet-700' :
                              (u.plan ?? 'free') === 'enterprise' ? 'bg-cyan-100 text-cyan-700' :
                              'bg-slate-100 text-slate-500'}`}>
                            {(u.plan ?? 'free') === 'pro' ? '⚡ Pro' : (u.plan ?? 'free') === 'enterprise' ? '🏢 Ent' : '🎁 Free'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-mono-code text-sm font-bold text-slate-700">{u.actions}</td>
                        <td className="py-3 pr-4 font-mono-code text-sm font-bold text-violet-600">{u.aiCalls}</td>
                        <td className="py-3 pr-4 text-sm text-slate-500">{u.country || '—'}</td>
                        <td className="py-3 font-mono-code text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Non-admin users tab */}
      {activeTab === 'users' && !isAdmin && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🔐</p>
          <p className="font-syne font-bold text-lg text-slate-800 mb-2">Admin Only</p>
          <p className="text-slate-400 text-sm">User analytics are only visible to administrators.</p>
        </div>
      )}

      {/* ── ACTIVITY TAB ─────────────────────────────────── */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne font-bold text-base text-slate-900">Activity Timeline</h3>
              <span className="text-xs text-slate-400 font-mono-code">
                {auditLogs.filter(l => l.created_at >= cutoff).length} events
              </span>
            </div>
            <MiniBarChart data={activityTrend} color="#0891b2" />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-slate-400">{shortDate(days[0])}</span>
              <span className="text-[10px] text-slate-400">{shortDate(days[days.length-1])}</span>
            </div>
          </div>

          <div className="card">
            <h3 className="font-syne font-bold text-base text-slate-900 mb-4">Recent Events</h3>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🕐</p>
                <p className="text-slate-400 text-sm">No activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((log, i) => {
                  const isAI    = log.action_type === 'ai_call'
                  const isLogin = log.action_type === 'login'
                  const isError = log.response_status === 'error'
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors
                      ${isError ? 'bg-red-50 border-red-100' :
                        isAI    ? 'bg-violet-50 border-violet-100' :
                        isLogin ? 'bg-cyan-50 border-cyan-100' :
                        'bg-slate-50 border-slate-100'}`}>
                      <span className="text-base shrink-0 mt-0.5">
                        {isError ? '⚠️' : isAI ? '🤖' : isLogin ? '🔑' : '⚡'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {log.action ?? log.route ?? 'Event'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {isAdmin && (
                            <span className="text-[11px] text-slate-400 font-mono-code truncate max-w-[140px]">
                              {log.user_email}
                            </span>
                          )}
                          {log.error_code && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-mono-code">
                              {log.error_code}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono-code shrink-0">
                        {timeAgo(log.created_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
