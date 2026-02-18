'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const ROLES = ['IT Project Manager','Network Engineer','Sponsor','Stakeholder','Other']
const COUNTRIES = ['United States','United Kingdom','India','Australia','Canada','Singapore','Germany','South Africa','UAE','New Zealand','Other']

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => { if (data) setProfile(data) })
      }
    })
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ full_name: profile.full_name, role: profile.role, country: profile.country }).eq('id', user!.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-syne font-black text-2xl mb-6">Account Settings</h2>
      <div className="card p-8">
        {saved && <div className="mb-4 px-4 py-3 bg-accent3/10 border border-accent3/30 rounded-xl text-accent3 text-sm">✅ Profile updated!</div>}
        <form onSubmit={save} className="space-y-5">
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Full Name</label>
            <input className="input" value={profile.full_name ?? ''} onChange={e => setProfile(p => ({...p, full_name: e.target.value}))}/>
          </div>
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Email</label>
            <input className="input opacity-60 cursor-not-allowed" value={profile.email ?? ''} disabled/>
            <p className="text-xs text-muted mt-1">Email cannot be changed after signup</p>
          </div>
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Role</label>
            <select className="select" value={profile.role ?? ''} onChange={e => setProfile(p => ({...p, role: e.target.value as any}))}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Country</label>
            <select className="select" value={profile.country ?? ''} onChange={e => setProfile(p => ({...p, country: e.target.value}))}>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  )
}
