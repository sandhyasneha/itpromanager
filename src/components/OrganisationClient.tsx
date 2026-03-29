'use client'
import { useState } from 'react'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const INDUSTRY_OPTIONS = [
  'Information Technology', 'Banking & Finance', 'Telecommunications',
  'Healthcare', 'Government', 'Retail', 'Manufacturing', 'Energy & Utilities',
  'Education', 'Consulting', 'Other',
]

const ORG_ROLE_COLORS: Record<string, string> = {
  org_admin:       'bg-red-500/10 text-red-400 border-red-500/30',
  account_manager: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  pm:              'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  engineer:        'bg-green-500/10 text-green-400 border-green-500/30',
  viewer:          'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

const WS_STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/10 text-green-400 border-green-500/30',
  completed: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  on_hold:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
}

const COLORS = ['#00d4ff','#7c3aed','#22d3a5','#f59e0b','#ef4444','#06b6d4']

export default function OrganisationClient({
  org, isOwner, workspaces: initialWorkspaces, orgMembers: initialMembers,
  userId, userEmail, userRole
}: {
  org: any, isOwner: boolean, workspaces: any[], orgMembers: any[],
  userId: string, userEmail: string, userRole: string | null
}) {
  const supabase = createClient()
  const router   = useRouter()

  const [tab, setTab]               = useState(org ? 'workspaces' : 'setup')
  const [workspaces, setWorkspaces] = useState(initialWorkspaces)
  const [members, setMembers]       = useState(initialMembers)
  const [msg, setMsg]               = useState<{ type: 'success'|'error'; text: string } | null>(null)
  const [loading, setLoading]       = useState(false)

  // Create org form
  const [orgName, setOrgName]         = useState('')
  const [orgSlug, setOrgSlug]         = useState('')
  const [orgDesc, setOrgDesc]         = useState('')
  const [orgIndustry, setOrgIndustry] = useState('Information Technology')

  // Create workspace form
  const [showWsForm, setShowWsForm]   = useState(false)
  const [wsName, setWsName]           = useState('')
  const [wsClient, setWsClient]       = useState('')
  const [wsClientEmail, setWsClientEmail] = useState('')
  const [wsDesc, setWsDesc]           = useState('')
  const [wsColor, setWsColor]         = useState('#00d4ff')
  const [wsLoading, setWsLoading]     = useState(false)

  // Edit workspace form
  const [editingWs, setEditingWs]       = useState<any>(null)
  const [editWsName, setEditWsName]     = useState('')
  const [editWsClient, setEditWsClient] = useState('')
  const [editWsEmail, setEditWsEmail]   = useState('')
  const [editWsDesc, setEditWsDesc]     = useState('')
  const [editWsColor, setEditWsColor]   = useState('#00d4ff')
  const [editWsLoading, setEditWsLoading] = useState(false)

  // Invite member form
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteRole, setInviteRole]     = useState('pm')
  const [inviteSending, setInviteSending] = useState(false)

  // Settings
  const [settingsName, setSettingsName]         = useState(org?.name || '')
  const [settingsIndustry, setSettingsIndustry] = useState(org?.industry || '')
  const [settingsDesc, setSettingsDesc]         = useState(org?.description || '')
  const [settingsSaving, setSettingsSaving]     = useState(false)

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function openEditWs(ws: any) {
    setEditingWs(ws)
    setEditWsName(ws.name)
    setEditWsClient(ws.client_name || '')
    setEditWsEmail(ws.client_email || '')
    setEditWsDesc(ws.description || '')
    setEditWsColor(ws.color || '#00d4ff')
  }

  async function createOrganisation() {
    if (!orgName.trim() || !orgSlug.trim()) return
    setLoading(true)
    setMsg(null)
    try {
      const { data, error } = await supabase.from('organisations').insert({
        name: orgName.trim(), slug: orgSlug.trim(),
        description: orgDesc.trim() || null, industry: orgIndustry,
        owner_id: userId, plan: 'beta', status: 'active',
      }).select().single()
      if (error) throw error
      await supabase.from('organisation_members').insert({
        org_id: data.id, user_id: userId, email: userEmail,
        role: 'org_admin', status: 'active', joined_at: new Date().toISOString(),
      })
      await supabase.from('profiles').update({ org_id: data.id, org_role: 'org_admin' }).eq('id', userId)
      setMsg({ type: 'success', text: '🎉 Organisation created!' })
      setTimeout(() => router.refresh(), 1000)
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message.includes('slug') ? '❌ Slug already taken.' : `❌ ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  async function createWorkspace() {
    if (!wsName.trim() || !org) return
    setWsLoading(true)
    setMsg(null)
    try {
      const { data, error } = await supabase.from('workspaces').insert({
        org_id: org.id, name: wsName.trim(),
        client_name: wsClient.trim() || null, client_email: wsClientEmail.trim() || null,
        description: wsDesc.trim() || null, color: wsColor, created_by: userId, status: 'active',
      }).select().single()
      if (error) throw error
      setWorkspaces((ws: any[]) => [data, ...ws])
      setShowWsForm(false)
      setWsName(''); setWsClient(''); setWsClientEmail(''); setWsDesc('')
      setMsg({ type: 'success', text: `✅ Workspace "${data.name}" created!` })
      logAudit({ action: AUDIT_ACTIONS.WORKSPACE_CREATED, category: 'workspace',
        entityId: data.id, entityName: data.name, orgId: org.id })
    } catch (err: any) {
      setMsg({ type: 'error', text: `❌ ${err.message}` })
    } finally {
      setWsLoading(false)
    }
  }

  async function saveWorkspace() {
    if (!editingWs) return
    setEditWsLoading(true)
    try {
      const { error } = await supabase.from('workspaces').update({
        name: editWsName.trim(), client_name: editWsClient.trim() || null,
        client_email: editWsEmail.trim() || null, description: editWsDesc.trim() || null,
        color: editWsColor, updated_at: new Date().toISOString(),
      }).eq('id', editingWs.id)
      if (error) throw error
      setWorkspaces((ws: any[]) => ws.map(w => w.id === editingWs.id ? {
        ...w, name: editWsName, client_name: editWsClient,
        client_email: editWsEmail, description: editWsDesc, color: editWsColor,
      } : w))
      setMsg({ type: 'success', text: `✅ Workspace updated!` })
      logAudit({ action: AUDIT_ACTIONS.WORKSPACE_UPDATED, category: 'workspace',
        entityId: editingWs.id, entityName: editWsName, orgId: org?.id })
      setEditingWs(null)
    } catch (err: any) {
      setMsg({ type: 'error', text: `❌ ${err.message}` })
    } finally {
      setEditWsLoading(false)
    }
  }

  async function saveSettings() {
    if (!org) return
    setSettingsSaving(true)
    try {
      const { error } = await supabase.from('organisations').update({
        name: settingsName.trim(), industry: settingsIndustry,
        description: settingsDesc.trim() || null, updated_at: new Date().toISOString(),
      }).eq('id', org.id)
      if (error) throw error
      setMsg({ type: 'success', text: '✅ Settings saved!' })
    } catch (err: any) {
      setMsg({ type: 'error', text: `❌ ${err.message}` })
    } finally {
      setSettingsSaving(false)
    }
  }

  async function inviteMember() {
    if (!inviteEmail.trim() || !org) return
    setInviteSending(true)
    setMsg(null)
    try {
      const res  = await fetch('/api/org/invite-member', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: org.id, email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg({ type: 'success', text: `✅ Invitation sent to ${inviteEmail}` })
      logAudit({ action: AUDIT_ACTIONS.ORG_MEMBER_INVITED, category: 'org',
        entityName: inviteEmail, newValue: inviteEmail, orgId: org?.id,
        metadata: { role: inviteRole } })
      setInviteEmail('')
      router.refresh()
    } catch (err: any) {
      setMsg({ type: 'error', text: `❌ ${err.message}` })
    } finally {
      setInviteSending(false)
    }
  }

  async function updateWsStatus(wsId: string, status: string) {
    await supabase.from('workspaces').update({ status }).eq('id', wsId)
    setWorkspaces((ws: any[]) => ws.map(w => w.id === wsId ? { ...w, status } : w))
  }

  // ── No org — Setup screen ─────────────────────────────────
  if (!org) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-1">// Corporate</p>
          <h1 className="font-syne font-black text-3xl">Create Your Organisation</h1>
          <p className="text-muted text-sm mt-1">Set up your company account to manage multiple client workspaces and teams.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🏢', title: 'Client Workspaces', desc: 'Isolate each client\'s projects in their own workspace' },
            { icon: '👥', title: 'Team Management',   desc: 'Invite PMs and engineers to specific workspaces' },
            { icon: '📊', title: 'Portfolio View',    desc: 'See all client project health in one dashboard' },
          ].map(b => (
            <div key={b.title} className="card border border-accent/20 text-center p-5">
              <div className="text-3xl mb-2">{b.icon}</div>
              <p className="font-syne font-bold text-sm mb-1">{b.title}</p>
              <p className="text-xs text-muted">{b.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 p-4 bg-accent3/10 border border-accent3/30 rounded-xl">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-syne font-bold text-sm text-accent3">Free During Beta</p>
            <p className="text-xs text-muted">Completely free. No credit card required.</p>
          </div>
        </div>
        <div className="card space-y-4">
          <h3 className="font-syne font-bold text-lg">Organisation Details</h3>
          {msg && (
            <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${msg.type === 'success' ? 'bg-accent3/10 text-accent3 border border-accent3/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
              {msg.text}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Organisation Name *</label>
              <input className="input w-full" placeholder="e.g. NTT DATA"
                value={orgName} onChange={e => { setOrgName(e.target.value); setOrgSlug(generateSlug(e.target.value)) }}/>
            </div>
            <div>
              <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Organisation URL Slug *</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted font-mono-code bg-surface2 px-3 py-2.5 rounded-lg border border-border">nexplan.io/org/</span>
                <input className="input flex-1" placeholder="ntt-data"
                  value={orgSlug} onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}/>
              </div>
              <p className="text-xs text-muted mt-1">Lowercase letters, numbers and hyphens only</p>
            </div>
            <div>
              <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Industry</label>
              <select className="select w-full" value={orgIndustry} onChange={e => setOrgIndustry(e.target.value)}>
                {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Description (optional)</label>
              <textarea className="input w-full resize-none h-20 text-sm" placeholder="Brief description..."
                value={orgDesc} onChange={e => setOrgDesc(e.target.value)}/>
            </div>
          </div>
          <button onClick={createOrganisation} disabled={loading || !orgName.trim() || !orgSlug.trim()}
            className="btn-primary w-full py-3 text-sm font-bold disabled:opacity-50">
            {loading ? '⟳ Creating...' : '🏢 Create Organisation →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Org exists — Management screen ───────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-1">// Organisation</p>
          <h1 className="font-syne font-black text-3xl">{org.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted text-sm">{org.industry}</p>
            <span className="text-xs font-mono-code text-accent bg-accent/10 px-2 py-0.5 rounded">nexplan.io/org/{org.slug}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent3/10 text-accent3 border border-accent3/30">🎉 Beta — Free</span>
          </div>
        </div>
        {isOwner && (
          <button onClick={() => { setShowWsForm(true); setTab('workspaces') }}
            className="btn-primary px-5 py-2.5 text-sm">
            + New Client Workspace
          </button>
        )}
      </div>

      {/* Message */}
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${msg.type === 'success' ? 'bg-accent3/10 text-accent3 border border-accent3/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
          {msg.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Client Workspaces', value: workspaces.length,                                   icon: '🏢', color: 'border-accent/30' },
          { label: 'Active Workspaces', value: workspaces.filter((w:any) => w.status === 'active').length, icon: '✅', color: 'border-accent3/30' },
          { label: 'Team Members',      value: members.filter((m:any) => m.status === 'active').length,    icon: '👥', color: 'border-accent2/30' },
          { label: 'Pending Invites',   value: members.filter((m:any) => m.status === 'invited').length,   icon: '⏳', color: 'border-warn/30' },
        ].map(s => (
          <div key={s.label} className={`card border ${s.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-syne font-bold text-muted uppercase tracking-wide">{s.label}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className="font-syne font-black text-4xl tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl w-fit">
        {[['workspaces','🏢 Workspaces'],['members','👥 Team'],['settings','⚙️ Settings']].map(([t,label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* WORKSPACES TAB */}
      {tab === 'workspaces' && (
        <div className="space-y-4">
          {showWsForm && (
            <div className="card border border-accent/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-syne font-bold text-lg">➕ New Client Workspace</h3>
                <button onClick={() => setShowWsForm(false)} className="text-muted hover:text-text">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Workspace Name *</label>
                  <input className="input w-full" placeholder="e.g. UBS Bank — Network Upgrade 2026"
                    value={wsName} onChange={e => setWsName(e.target.value)}/>
                </div>
                <div>
                  <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Client Name</label>
                  <input className="input w-full" placeholder="e.g. UBS Bank"
                    value={wsClient} onChange={e => setWsClient(e.target.value)}/>
                </div>
                <div>
                  <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Client Contact Email</label>
                  <input className="input w-full" type="email" placeholder="client@ubsbank.com"
                    value={wsClientEmail} onChange={e => setWsClientEmail(e.target.value)}/>
                </div>
                <div>
                  <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Workspace Colour</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={wsColor} onChange={e => setWsColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"/>
                    <div className="flex gap-2">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setWsColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${wsColor === c ? 'border-text scale-110' : 'border-transparent'}`}
                          style={{ background: c }}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea className="input w-full resize-none h-16 text-sm" placeholder="Brief description of this client engagement..."
                  value={wsDesc} onChange={e => setWsDesc(e.target.value)}/>
              </div>
              <div className="flex gap-3">
                <button onClick={createWorkspace} disabled={wsLoading || !wsName.trim()}
                  className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
                  {wsLoading ? '⟳ Creating...' : '✅ Create Workspace'}
                </button>
                <button onClick={() => setShowWsForm(false)} className="btn-ghost px-6 py-2 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {workspaces.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-5xl mb-4">🏢</p>
              <p className="font-syne font-bold text-xl mb-2">No Client Workspaces Yet</p>
              <p className="text-muted text-sm mb-6 max-w-md mx-auto">
                Create a workspace for each client — e.g. "UBS Bank", "Citi Bank", "UPS".
              </p>
              <button onClick={() => setShowWsForm(true)} className="btn-primary px-6 py-2.5 text-sm">+ Create First Workspace</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws:any) => (
                <div key={ws.id} className="card hover:border-accent/40 transition-all"
                  style={{ borderLeft: `4px solid ${ws.color || '#00d4ff'}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-black shrink-0"
                        style={{ background: ws.color || '#00d4ff' }}>
                        {(ws.client_name || ws.name).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-syne font-bold text-sm">{ws.name}</p>
                        {ws.client_name && <p className="text-xs text-muted">{ws.client_name}</p>}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${WS_STATUS_COLORS[ws.status] || WS_STATUS_COLORS.active}`}>
                      {ws.status}
                    </span>
                  </div>
                  {ws.description && <p className="text-xs text-muted mb-3 line-clamp-2">{ws.description}</p>}
                  {ws.client_email && <p className="text-xs text-muted font-mono-code mb-3">📧 {ws.client_email}</p>}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <p className="text-[10px] text-muted font-mono-code">
                      {new Date(ws.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <button onClick={() => openEditWs(ws)}
                          className="text-xs text-accent hover:underline font-semibold">✏️ Edit</button>
                      )}
                      {isOwner && (
                        <select value={ws.status} onChange={e => updateWsStatus(ws.id, e.target.value)}
                          className="text-[10px] border border-border rounded px-1.5 py-1 bg-surface text-muted">
                          <option value="active">Active</option>
                          <option value="on_hold">On Hold</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MEMBERS TAB */}
      {tab === 'members' && (
        <div className="space-y-5">
          {isOwner && (
            <div className="card space-y-3">
              <h3 className="font-syne font-bold text-base">✉️ Invite Team Member</h3>
              <div className="flex gap-2 flex-wrap">
                <input type="email" placeholder="colleague@company.com"
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inviteMember()}
                  className="input flex-1 min-w-[200px] text-sm"/>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="select text-sm w-44">
                  <option value="account_manager">Account Manager</option>
                  <option value="pm">Project Manager</option>
                  <option value="engineer">Engineer</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button onClick={inviteMember} disabled={inviteSending || !inviteEmail.trim()}
                  className="btn-primary text-sm px-5 disabled:opacity-50">
                  {inviteSending ? '⟳' : '📨 Invite'}
                </button>
              </div>
            </div>
          )}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-syne font-bold text-base">Organisation Members</h3>
              <span className="font-mono-code text-xs text-muted">{members.length} total</span>
            </div>
            <div className="divide-y divide-border">
              {members.map((m:any) => {
                const name     = m.profiles?.full_name || m.email.split('@')[0]
                const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                const isMe     = m.user_id === userId
                return (
                  <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-xs font-black text-black shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {name} {isMe && <span className="text-xs text-muted">(you)</span>}
                      </p>
                      <p className="text-xs text-muted truncate font-mono-code">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-lg border font-bold ${ORG_ROLE_COLORS[m.role] || ORG_ROLE_COLORS.viewer}`}>
                        {m.role.replace('_', ' ')}
                      </span>
                      {m.status === 'invited' && <span className="text-xs text-warn font-mono-code">⏳ pending</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === 'settings' && (
        <div className="card space-y-4 max-w-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-syne font-bold text-lg">⚙️ Organisation Settings</h3>
            <button onClick={() => setTab('workspaces')} className="text-muted hover:text-text text-xl px-2">✕</button>
          </div>
          {msg && (
            <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${msg.type === 'success' ? 'bg-accent3/10 text-accent3 border border-accent3/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
              {msg.text}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Organisation Name</label>
              <input className="input w-full" value={settingsName} onChange={e => setSettingsName(e.target.value)}/>
            </div>
            <div>
              <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Industry</label>
              <select className="select w-full" value={settingsIndustry} onChange={e => setSettingsIndustry(e.target.value)}>
                {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Description</label>
              <textarea className="input w-full resize-none h-20 text-sm"
                value={settingsDesc} onChange={e => setSettingsDesc(e.target.value)}/>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveSettings} disabled={settingsSaving}
              className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
              {settingsSaving ? '⟳ Saving...' : '💾 Save Changes'}
            </button>
            <button onClick={() => setTab('workspaces')} className="btn-ghost px-6 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* WORKSPACE EDIT MODAL */}
      {editingWs && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditingWs(null)}>
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
              <h3 className="font-syne font-bold text-lg">✏️ Edit Workspace</h3>
              <button onClick={() => setEditingWs(null)} className="text-muted hover:text-text text-xl px-2">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Workspace Name *</label>
                  <input className="input w-full" value={editWsName} onChange={e => setEditWsName(e.target.value)}/>
                </div>
                <div>
                  <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Client Name</label>
                  <input className="input w-full" value={editWsClient} onChange={e => setEditWsClient(e.target.value)}/>
                </div>
                <div>
                  <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Client Email</label>
                  <input className="input w-full" type="email" value={editWsEmail} onChange={e => setEditWsEmail(e.target.value)}/>
                </div>
                <div>
                  <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Colour</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={editWsColor} onChange={e => setEditWsColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"/>
                    <div className="flex gap-2">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setEditWsColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${editWsColor === c ? 'border-text scale-110' : 'border-transparent'}`}
                          style={{ background: c }}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea className="input w-full resize-none h-16 text-sm"
                  value={editWsDesc} onChange={e => setEditWsDesc(e.target.value)}/>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveWorkspace} disabled={editWsLoading || !editWsName.trim()}
                  className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
                  {editWsLoading ? '⟳ Saving...' : '💾 Save Changes'}
                </button>
                <button onClick={() => setEditingWs(null)} className="btn-ghost px-6 py-2 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
