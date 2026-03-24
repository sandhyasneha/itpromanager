// src/components/TeamManager.tsx
// Team management modal — accessible from the 👥 Team button in Kanban toolbar

'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  email: string
  role: string
  status: string
  joined_at?: string
  user_id?: string
  profiles?: { full_name?: string }
}

const ROLE_OPTIONS = [
  { value: 'admin',    label: 'Admin',           desc: 'Full access + invite members' },
  { value: 'pm',       label: 'Project Manager',  desc: 'Manage tasks, PCR, risks' },
  { value: 'engineer', label: 'Engineer',         desc: 'View & update tasks' },
  { value: 'viewer',   label: 'Viewer',           desc: 'View only, no edits' },
]

const ROLE_COLORS: Record<string, string> = {
  admin:    'bg-red-500/10 text-red-400 border-red-500/30',
  pm:       'bg-violet-500/10 text-violet-400 border-violet-500/30',
  engineer: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  viewer:   'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

export default function TeamManager({
  projectId, projectName, currentUserId, isOwner, onClose
}: {
  projectId: string
  projectName: string
  currentUserId: string
  isOwner: boolean
  onClose: () => void
}) {
  const supabase = createClient()
  const [members, setMembers]         = useState<Member[]>([])
  const [loading, setLoading]         = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('engineer')
  const [sending, setSending]         = useState(false)
  const [joinLink, setJoinLink]       = useState('')
  const [joinLinkRole, setJoinLinkRole] = useState('engineer')
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [msg, setMsg]                 = useState<{ type: 'success'|'error'; text: string } | null>(null)

  useEffect(() => { loadMembers() }, [projectId])

  async function loadMembers() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/project-members?projectId=${projectId}`)
      const data = await res.json()
      if (res.ok) setMembers(data.members || [])
    } catch (e) {
      console.error('Failed to load members', e)
    }
    setLoading(false)
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return
    setSending(true)
    setMsg(null)
    try {
      const res  = await fetch('/api/invite-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg({ type: 'success', text: `✅ Invitation sent to ${inviteEmail}` })
      setInviteEmail('')
      loadMembers()
    } catch (err: any) {
      setMsg({ type: 'error', text: `❌ ${err.message}` })
    } finally {
      setSending(false)
    }
  }

  async function generateJoinLink() {
    setGeneratingLink(true)
    try {
      const res  = await fetch('/api/invite/join-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, role: joinLinkRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setJoinLink(data.joinLink)
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setGeneratingLink(false)
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(joinLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function updateRole(memberId: string, newRole: string) {
    await supabase.from('project_members').update({ role: newRole }).eq('id', memberId)
    setMembers(ms => ms.map(m => m.id === memberId ? { ...m, role: newRole } : m))
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this member from the project?')) return
    await supabase.from('project_members').update({ status: 'removed' }).eq('id', memberId)
    setMembers(ms => ms.filter(m => m.id !== memberId))
  }

  async function resendInvite(email: string, role: string) {
    setSending(true)
    const res = await fetch('/api/invite-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, email, role }),
    })
    setSending(false)
    if (res.ok) setMsg({ type: 'success', text: `✅ Invite resent to ${email}` })
  }

  const activeMembers  = members.filter(m => m.status === 'active')
  const pendingMembers = members.filter(m => m.status === 'invited')

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-syne font-black text-xl">👥 Team Members</h2>
            <p className="text-muted text-xs mt-0.5 truncate max-w-[300px]">{projectName}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-xl px-2">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Message */}
          {msg && (
            <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${
              msg.type === 'success'
                ? 'bg-accent3/10 text-accent3 border border-accent3/30'
                : 'bg-danger/10 text-danger border border-danger/30'
            }`}>
              {msg.text}
            </div>
          )}

          {/* Active Members */}
          <div>
            <h4 className="font-syne font-bold text-sm mb-3 flex items-center gap-2">
              Team Members
              <span className="text-xs font-mono-code text-muted bg-surface2 px-2 py-0.5 rounded-full">
                {activeMembers.length}
              </span>
            </h4>
            {loading ? (
              <p className="text-muted text-sm">Loading...</p>
            ) : (
              <div className="space-y-2">
                {activeMembers.map(m => {
                  const name     = m.profiles?.full_name || m.email.split('@')[0]
                  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                  const isMe     = m.user_id === currentUserId
                  const isMemberOwner = m.role === 'admin' && m.user_id !== currentUserId
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-surface2 rounded-xl border border-border">
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
                        {isOwner && !isMe ? (
                          <select value={m.role} onChange={e => updateRole(m.id, e.target.value)}
                            className="text-xs border border-border rounded-lg px-2 py-1 bg-surface text-text">
                            {ROLE_OPTIONS.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-lg border font-bold ${ROLE_COLORS[m.role] || ROLE_COLORS.viewer}`}>
                            {ROLE_OPTIONS.find(r => r.value === m.role)?.label || m.role}
                          </span>
                        )}
                        {isOwner && !isMe && (
                          <button onClick={() => removeMember(m.id)}
                            className="text-muted hover:text-danger transition-colors text-sm px-1">
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pending Invites */}
          {pendingMembers.length > 0 && (
            <div>
              <h4 className="font-syne font-bold text-sm mb-3 flex items-center gap-2">
                ⏳ Pending Invites
                <span className="text-xs font-mono-code text-muted bg-surface2 px-2 py-0.5 rounded-full">
                  {pendingMembers.length}
                </span>
              </h4>
              <div className="space-y-2">
                {pendingMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-warn/5 rounded-xl border border-warn/20">
                    <div className="w-9 h-9 rounded-full bg-warn/20 flex items-center justify-center text-xs font-black text-warn shrink-0">?</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono-code text-sm truncate">{m.email}</p>
                      <p className="text-xs text-muted">Invite pending</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-lg border font-bold ${ROLE_COLORS[m.role] || ROLE_COLORS.viewer}`}>
                        {ROLE_OPTIONS.find(r => r.value === m.role)?.label}
                      </span>
                      {isOwner && (
                        <>
                          <button onClick={() => resendInvite(m.email, m.role)} disabled={sending}
                            className="text-xs text-accent hover:underline font-semibold disabled:opacity-50">
                            Resend
                          </button>
                          <button onClick={() => removeMember(m.id)}
                            className="text-muted hover:text-danger transition-colors text-sm px-1">
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite by Email — only for owners/admins */}
          {isOwner && (
            <>
              <div className="border-t border-border pt-5">
                <h4 className="font-syne font-bold text-sm mb-3">✉️ Invite by Email</h4>
                <div className="flex gap-2 flex-wrap">
                  <input type="email" placeholder="colleague@company.com"
                    value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendInvite()}
                    className="input flex-1 min-w-[180px] text-sm"/>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className="select text-sm w-36">
                    {ROLE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button onClick={sendInvite} disabled={sending || !inviteEmail.trim()}
                    className="btn-primary text-sm px-4 disabled:opacity-50 whitespace-nowrap">
                    {sending ? '⟳' : '📨 Invite'}
                  </button>
                </div>
                <p className="text-xs text-muted mt-2">They'll receive an email with a link to join this project.</p>
              </div>

              {/* Share Join Link */}
              <div className="border-t border-border pt-5">
                <h4 className="font-syne font-bold text-sm mb-3">🔗 Share Join Link</h4>
                <p className="text-xs text-muted mb-3">Anyone with this link can join directly — no email needed.</p>
                <div className="flex gap-2 mb-3">
                  <select value={joinLinkRole} onChange={e => setJoinLinkRole(e.target.value)}
                    className="select text-sm w-36">
                    {ROLE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button onClick={generateJoinLink} disabled={generatingLink}
                    className="btn-ghost text-sm px-4 disabled:opacity-50">
                    {generatingLink ? '⟳' : '🔗 Generate'}
                  </button>
                </div>
                {joinLink && (
                  <div className="flex items-center gap-2 p-3 bg-surface2 rounded-xl border border-border">
                    <p className="font-mono-code text-xs text-muted flex-1 truncate">{joinLink}</p>
                    <button onClick={copyLink}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors">
                      {copied ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Role Legend */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-3">Role Permissions</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map(r => (
                <div key={r.value} className={`text-xs px-3 py-2 rounded-lg border ${ROLE_COLORS[r.value]}`}>
                  <span className="font-bold">{r.label}</span>
                  <span className="opacity-70 ml-1">— {r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
