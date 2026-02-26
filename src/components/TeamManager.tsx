'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  user_id: string
  role: 'pm' | 'viewer' | 'sponsor'
  joined_at: string
  invited_by: string
  profiles: {
    full_name: string
    email: string
    role: string
  } | null
}

interface Props {
  projectId: string
  projectName: string
  currentUserId: string
  isOwner: boolean
  onClose: () => void
}

const ROLES = {
  pm:      { label: 'Project Manager', icon: '🧑‍💼', color: 'text-accent',  bg: 'bg-accent/10 border-accent/30',  desc: 'Full access — can edit tasks, risks, PCR and settings' },
  viewer:  { label: 'Viewer',          icon: '👁',   color: 'text-muted',   bg: 'bg-surface2 border-border',       desc: 'Read only — can view tasks, Gantt and reports' },
  sponsor: { label: 'Sponsor',         icon: '💰',   color: 'text-warn',    bg: 'bg-warn/10 border-warn/30',       desc: 'Can view reports, approve PCRs and see risk register' },
}

export default function TeamManager({ projectId, projectName, currentUserId, isOwner, onClose }: Props) {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'pm' | 'viewer' | 'sponsor'>('viewer')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadMembers() }, [projectId])

  async function loadMembers() {
    setLoading(true)
    const { data } = await supabase
      .from('project_members')
      .select('*, profiles(full_name, email, role)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setMembers((data || []) as Member[])
    setLoading(false)
  }

  async function addMember() {
    if (!email.trim()) return
    setAdding(true)
    setError('')
    setSuccess('')

    // Look up user by email in profiles table
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (profileErr || !profile) {
      setError(`No registered user found with email "${email}". They must sign up at nexplan.io first.`)
      setAdding(false)
      return
    }

    if (profile.id === currentUserId) {
      setError('You are already the project owner.')
      setAdding(false)
      return
    }

    // Check if already a member
    const existing = members.find(m => m.user_id === profile.id)
    if (existing) {
      setError(`${profile.full_name || email} is already a member of this project.`)
      setAdding(false)
      return
    }

    const { error: insertErr } = await supabase.from('project_members').insert({
      project_id: projectId,
      user_id: profile.id,
      role,
      invited_by: currentUserId,
    })

    if (insertErr) {
      setError('Failed to add member: ' + insertErr.message)
    } else {
      setSuccess(`✅ ${profile.full_name || email} added as ${ROLES[role].label}`)
      setEmail('')
      setRole('viewer')
      await loadMembers()
    }
    setAdding(false)
  }

  async function updateRole(memberId: string, newRole: 'pm' | 'viewer' | 'sponsor') {
    await supabase.from('project_members').update({ role: newRole }).eq('id', memberId)
    setMembers(m => m.map(x => x.id === memberId ? { ...x, role: newRole } : x))
  }

  async function removeMember(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from this project?`)) return
    await supabase.from('project_members').delete().eq('id', memberId)
    setMembers(m => m.filter(x => x.id !== memberId))
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
          <div>
            <p className="font-mono-code text-xs text-accent2 uppercase tracking-widest mb-1">👥 Team Members</p>
            <h2 className="font-syne font-black text-xl">{projectName}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Role legend */}
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(ROLES) as [string, typeof ROLES.pm][]).map(([key, r]) => (
              <div key={key} className={`rounded-xl p-3 border ${r.bg}`}>
                <p className={`font-semibold text-xs mb-1 ${r.color}`}>{r.icon} {r.label}</p>
                <p className="text-[10px] text-muted leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>

          {/* Add member — owner only */}
          {isOwner && (
            <div className="bg-surface2 rounded-xl p-4 space-y-3">
              <p className="font-syne font-bold text-sm">➕ Add Team Member</p>
              <p className="text-xs text-muted">The person must already have a NexPlan account at nexplan.io</p>
              <div className="flex gap-3">
                <input className="input flex-1 text-sm"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMember()}/>
                <select className="select text-sm w-36"
                  value={role}
                  onChange={e => setRole(e.target.value as any)}>
                  <option value="viewer">👁 Viewer</option>
                  <option value="pm">🧑‍💼 PM</option>
                  <option value="sponsor">💰 Sponsor</option>
                </select>
                <button onClick={addMember} disabled={adding || !email.trim()}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-40 shrink-0">
                  {adding ? 'Adding...' : 'Add'}
                </button>
              </div>
              {error && <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
              {success && <p className="text-xs text-accent3 bg-accent3/10 border border-accent3/20 rounded-lg px-3 py-2">{success}</p>}
            </div>
          )}

          {/* Members list */}
          <div>
            <p className="font-syne font-bold text-sm mb-3">
              Team Members
              <span className="ml-2 font-mono-code text-xs text-muted font-normal">({members.length + 1} total)</span>
            </p>

            <div className="space-y-2">
              {/* Owner row */}
              <div className="flex items-center gap-3 px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                  👑
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">You (Project Owner)</p>
                  <p className="text-xs text-muted">Full access · Cannot be removed</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-accent/10 text-accent border border-accent/30">
                  Owner
                </span>
              </div>

              {loading ? (
                <div className="text-center py-6 text-muted text-sm animate-pulse">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <p className="text-2xl mb-2">👥</p>
                  <p className="text-sm">No team members yet.</p>
                  {isOwner && <p className="text-xs mt-1">Add a colleague using their registered email above.</p>}
                </div>
              ) : (
                members.map(member => {
                  const profile = member.profiles
                  const name = profile?.full_name || profile?.email || 'Unknown User'
                  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                  const roleCfg = ROLES[member.role]

                  return (
                    <div key={member.id} className="flex items-center gap-3 px-4 py-3 bg-surface2 border border-border rounded-xl hover:border-accent/20 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-xs font-bold text-text shrink-0 border border-border">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{name}</p>
                        <p className="text-xs text-muted truncate">{profile?.email}</p>
                      </div>

                      {isOwner ? (
                        <select
                          value={member.role}
                          onChange={e => updateRole(member.id, e.target.value as any)}
                          className="select text-xs py-1 w-32 shrink-0">
                          <option value="viewer">👁 Viewer</option>
                          <option value="pm">🧑‍💼 PM</option>
                          <option value="sponsor">💰 Sponsor</option>
                        </select>
                      ) : (
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border shrink-0 ${roleCfg.bg} ${roleCfg.color}`}>
                          {roleCfg.icon} {roleCfg.label}
                        </span>
                      )}

                      {isOwner && (
                        <button onClick={() => removeMember(member.id, name)}
                          className="text-danger/50 hover:text-danger text-xs font-semibold ml-1 shrink-0 transition-colors">
                          ✕
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Access info for non-owners */}
          {!isOwner && (
            <div className="bg-surface2 rounded-xl p-4 border border-border">
              <p className="text-xs text-muted">
                <span className="font-semibold text-text">Your role: </span>
                {ROLES[members.find(m => m.user_id === currentUserId)?.role || 'viewer'].icon}{' '}
                {ROLES[members.find(m => m.user_id === currentUserId)?.role || 'viewer'].label}
                {' · '}
                {ROLES[members.find(m => m.user_id === currentUserId)?.role || 'viewer'].desc}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 pt-0 border-t border-border">
          <button onClick={onClose} className="btn-ghost w-full py-2.5 text-sm">Close</button>
        </div>
      </div>
    </div>
  )
}
