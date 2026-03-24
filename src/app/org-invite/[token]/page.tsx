// src/app/org-invite/[token]/page.tsx
// Handles accepting an organisation invitation

'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type State = 'loading' | 'ready' | 'accepting' | 'success' | 'error' | 'already'

export default function OrgInvitePage() {
  const { token } = useParams<{ token: string }>()
  const router    = useRouter()
  const supabase  = createClient()

  const [state, setState]       = useState<State>('loading')
  const [invite, setInvite]     = useState<any>(null)
  const [user, setUser]         = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Fetch invite details using service route
      const res  = await fetch(`/api/org/validate-invite?token=${token}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Invalid or expired invite link')
        setState('error')
        return
      }

      if (data.status === 'active') { setState('already'); return }

      setInvite(data)
      setState('ready')
    }
    load()
  }, [token])

  async function acceptInvite() {
    setState('accepting')
    try {
      const res  = await fetch('/api/org/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId: user?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState('success')
      setTimeout(() => router.push('/organisation'), 2000)
    } catch (err: any) {
      setErrorMsg(err.message)
      setState('error')
    }
  }

  const roleLabel = (r: string) => r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-black" style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ✦ NexPlan
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

          {state === 'loading' && (
            <div className="text-center py-8">
              <div className="text-3xl animate-spin mb-4">⟳</div>
              <p className="text-slate-400">Validating your invitation...</p>
            </div>
          )}

          {state === 'ready' && invite && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">🏢</div>
                <h1 className="text-2xl font-black text-white mb-2">Organisation Invite!</h1>
                <p className="text-slate-400 text-sm">
                  You've been invited to join an organisation on NexPlan
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Organisation</p>
                <p className="text-white text-lg font-black mb-3">{invite.orgName}</p>
                <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-1.5">
                  <span className="text-violet-400 text-xs font-bold">Your Role: {roleLabel(invite.role)}</span>
                </div>
              </div>

              {!user ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-amber-400 text-sm font-semibold mb-1">⚠️ Sign in required</p>
                  <p className="text-amber-300/70 text-xs mb-3">Sign in to accept this invitation.</p>
                  <Link href={`/login?redirect=/org-invite/${token}`}
                    className="inline-block bg-amber-500 text-black text-xs font-bold px-4 py-2 rounded-lg">
                    Sign In / Sign Up →
                  </Link>
                </div>
              ) : (
                <button onClick={acceptInvite}
                  className="w-full py-3.5 rounded-xl font-black text-black text-base"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
                  ✅ Accept Invitation
                </button>
              )}
            </div>
          )}

          {state === 'accepting' && (
            <div className="text-center py-8">
              <div className="text-3xl animate-spin mb-4">⟳</div>
              <p className="text-slate-400">Joining organisation...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-black text-white">You're in!</h2>
              <p className="text-slate-400 text-sm">Redirecting to your organisation...</p>
            </div>
          )}

          {state === 'already' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-xl font-black text-white">Already a Member</h2>
              <p className="text-slate-400 text-sm">You already have access to this organisation.</p>
              <Link href="/organisation"
                className="inline-block mt-2 px-6 py-2.5 rounded-xl font-bold text-black text-sm"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
                Go to Organisation →
              </Link>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">❌</div>
              <h2 className="text-xl font-black text-white">Invalid Invite</h2>
              <p className="text-slate-400 text-sm">{errorMsg}</p>
              <Link href="/"
                className="inline-block mt-2 px-6 py-2.5 rounded-xl font-bold text-black text-sm"
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
