'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ROLES = ['IT Project Manager','Network Engineer','Sponsor','Stakeholder','Other']
const COUNTRIES = ['United States','United Kingdom','India','Australia','Canada','Singapore','Germany','South Africa','UAE','New Zealand','Other']

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => {
            if (data) setProfile(data)
            else setProfile({
              email: user.email,
              full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
              role: user.user_metadata?.role ?? 'IT Project Manager',
              country: user.user_metadata?.country ?? 'United States',
            })
          })
      }
    })
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').upsert({
      id: user!.id,
      email: user!.email,
      full_name: profile.full_name,
      role: profile.role,
      country: profile.country,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      // Force refresh so topbar picks up new name
      router.refresh()
    }, 1500)
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-syne font-black text-2xl mb-6">Account Settings</h2>
      <div className="card p-8">
        {saved && (
          <div className="mb-4 px-4 py-3 bg-accent3/10 border border-accent3/30 rounded-xl text-accent3 text-sm">
            Profile updated! Refreshing...
          </div>
        )}
        <form onSubmit={save} className="space-y-5">
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Full Name</label>
            <input className="input" value={profile.full_name ?? ''} onChange={e => setProfile((p: any) => ({...p, full_name: e.target.value}))} placeholder="Your full name"/>
          </div>
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Email</label>
            <input className="input opacity-60 cursor-not-allowed" value={profile.email ?? ''} disabled/>
            <p className="text-xs text-muted mt-1">Email cannot be changed after signup</p>
          </div>
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Role</label>
            <select className="select" value={profile.role ?? 'IT Project Manager'} onChange={e => setProfile((p: any) => ({...p, role: e.target.value}))}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Country</label>
            <select className="select" value={profile.country ?? 'United States'} onChange={e => setProfile((p: any) => ({...p, country: e.target.value}))}>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
