// src/app/join/[token]/page.tsx
// Handles joining via a shared link (no email required)

'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NexPlanLogo from '@/components/NexPlanLogo'
import Link from 'next/link'

export default function JoinProjectPage() {
  const { token } = useParams<{ token: string }>()
  const router    = useRouter()
  const supabase  = createClient()
  const [state, setState]   = useState<'loading'|'ready'|'joining'|'success'|'error'>('loading')
  const [project, setProject] = useState<any>(null)
  const [user, setUser]       = useState<any>(null)
  const [role, setRole]       = useState('engineer')
  const [error, setError]     = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Decode token to get projectId and role
      try {
        const decoded   = atob(token.replace(/-/g, '+').replace(/_/g, '/'))
        const [projectId, linkRole] = decoded.split(':')
        setRole(linkRole || 'engineer')

        const { data: proj } = await supabase
          .from('projects').select('id, name').eq('id', projectId).eq('join_link_token', token).single()

        if (!proj) { setError('This join link is invalid or has been disabled.'); setState('error'); return }
        setProject(proj)
        setState('ready')
      } catch {
        setError('Invalid join link.')
        setState('error')
      }
    }
    load()
  }, [token])

  async function joinProject() {
    if (!user || !project) return
    setState('joining')
    try {
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single()

      // Check if already a member
      const { data: existing } = await supabase
        .from('project_members')
        .select('id, status')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .single()

      if (existing?.status === 'active') {
        router.push('/kanban')
        return
      }

      // Add as member
      const { error } = await supabase.from('project_members').upsert({
        project_id: project.id,
        user_id:    user.id,
        email:      profile?.email || '',
        role,
        status:     'active',
        joined_at:  new Date().toISOString(),
      }, { onConflict: 'project_id,email' })

      if (error) throw error
      setState('success')
      setTimeout(() => router.push('/kanban'), 2000)
    } catch (err: any) {
      setError(err.message)
      setState('error')
    }
  }

  const roleLabel = (r: string) =>
    r === 'admin' ? 'Administrator' : r === 'pm' ? 'Project Manager' : r === 'engineer' ? 'Engineer' : 'Viewer'

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><NexPlanLogo size="lg" /></div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

          {state === 'loading' && (
            <div className="text-center py-8">
              <div className="text-3xl animate-spin mb-4">⟳</div>
              <p className="text-slate-400">Loading project...</p>
            </div>
          )}

          {state === 'ready' && project && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">🔗</div>
                <h1 className="text-2xl font-black text-white mb-2">Join Project</h1>
                <p className="text-slate-400 text-sm">You've been invited to collaborate on NexPlan</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Project</p>
                <p className="text-white text-lg font-black mb-3">{project.name}</p>
                <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-1.5">
                  <span className="text-violet-400 text-xs font-bold">Your Role: {roleLabel(role)}</span>
                </div>
              </div>
              {!user ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-amber-400 text-sm font-semibold mb-1">⚠️ Sign in required</p>
                  <Link href={`/login?redirect=/join/${token}`}
                    className="mt-2 inline-block bg-amber-500 text-black text-xs font-bold px-4 py-2 rounded-lg">
                    Sign In / Sign Up →
                  </Link>
                </div>
              ) : (
                <button onClick={joinProject}
                  className="w-full py-3.5 rounded-xl font-black text-black text-base"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
                  ✅ Join Project
                </button>
              )}
            </div>
          )}

          {state === 'joining' && (
            <div className="text-center py-8">
              <div className="text-3xl animate-spin mb-4">⟳</div>
              <p className="text-slate-400">Joining project...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-black text-white">You're in!</h2>
              <p className="text-slate-400 text-sm">Redirecting to your project...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">❌</div>
              <h2 className="text-xl font-black text-white">Link Invalid</h2>
              <p className="text-slate-400 text-sm">{error}</p>
              <Link href="/" className="inline-block mt-2 px-6 py-2.5 rounded-xl font-bold text-black text-sm"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
                Go to NexPlan →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
