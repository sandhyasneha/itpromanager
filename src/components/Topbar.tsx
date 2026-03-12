'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import NexPlanLogo from '@/components/NexPlanLogo'

const TITLES: Record<string, { label: string; icon: string }> = {
  '/dashboard':    { label: 'Dashboard',      icon: '📊' },
  '/kanban':       { label: 'Kanban Board',    icon: '📋' },
  '/project-plan': { label: 'Project Plan',    icon: '📅' },
  '/network':      { label: 'Network Diagram', icon: '🗺️' },
  '/knowledge':    { label: 'Knowledge Base',  icon: '📚' },
  '/my-tasks':     { label: 'My Tasks',        icon: '✅' },
  '/reports':      { label: 'Reports',         icon: '📈' },
  '/analytics':    { label: 'Analytics',       icon: '🔬' },
  '/admin':        { label: 'Admin Panel',     icon: '🔐' },
  '/settings':     { label: 'Settings',        icon: '⚙️' },
  '/help':         { label: 'Help Center',     icon: '❓' },
}

const ADMIN_EMAIL = 'info@nexplan.io'

export default function Topbar({ profile }: { profile: Profile | null }) {
  const path     = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [showDropdown, setShowDropdown] = useState(false)

  const match    = Object.entries(TITLES).find(([k]) => path.startsWith(k))
  const title    = match?.[1]?.label ?? 'NexPlan'
  const icon     = match?.[1]?.icon  ?? '✦'
  const fullName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'User'
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const isAdmin  = profile?.email === ADMIN_EMAIL
  const plan     = (profile as any)?.plan ?? 'free'

  async function signOut() {
    setShowDropdown(false)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between
      px-4 md:px-8 py-3.5
      bg-white/80 backdrop-blur-xl
      border-b border-slate-200">

      {/* Left — title */}
      <div className="flex items-center gap-3 ml-12 md:ml-0">
        <div className="md:hidden">
          <NexPlanLogo size="sm" />
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h1 className="font-syne font-black text-lg text-slate-900">{title}</h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Upgrade badge — free users only */}
        {plan === 'free' && (
          <Link href="/pricing"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white mr-1"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
            ⚡ Upgrade to Pro
          </Link>
        )}

        {/* Quick actions */}
        <Link href="/project-plan" className="hidden md:inline-flex btn-ghost text-sm px-4 py-2">
          + New Plan
        </Link>
        <Link href="/kanban" className="hidden md:inline-flex btn-primary text-sm px-4 py-2">
          + New Project
        </Link>

        {/* Notification bell */}
        <div className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">3</span>
        </div>

        {/* User avatar dropdown */}
        <div className="relative">
          <button onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0
              ${isAdmin ? 'bg-gradient-to-br from-red-400 to-orange-400' : 'bg-gradient-to-br from-cyan-400 to-violet-500'}`}>
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="font-syne font-semibold text-sm text-slate-900 leading-tight">{fullName}</p>
              <p className="text-[10px] text-slate-400 leading-tight font-mono-code">
                {plan === 'pro' ? '⚡ Pro' : plan === 'enterprise' ? '🏢 Enterprise' : '🎁 Free'}
              </p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 hidden md:block">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">

                {/* Header with Close ✕ button */}
                <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0
                        ${isAdmin ? 'bg-gradient-to-br from-red-400 to-orange-400' : 'bg-gradient-to-br from-cyan-400 to-violet-500'}`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-syne font-bold text-sm text-slate-900 truncate">{fullName}</p>
                        <p className="text-xs text-cyan-600 truncate font-mono-code">{profile?.email}</p>
                      </div>
                    </div>
                    {/* ✕ Close button */}
                    <button onClick={() => setShowDropdown(false)}
                      className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition-colors shrink-0 ml-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full
                      ${plan === 'pro' ? 'bg-violet-100 text-violet-700' :
                        plan === 'enterprise' ? 'bg-cyan-100 text-cyan-700' :
                        'bg-slate-100 text-slate-500'}`}>
                      {plan === 'pro' ? '⚡ Pro Plan' : plan === 'enterprise' ? '🏢 Enterprise' : '🎁 Free Plan'}
                    </span>
                    {plan === 'free' && (
                      <Link href="/pricing" onClick={() => setShowDropdown(false)}
                        className="text-[11px] font-bold text-violet-600 hover:underline">
                        Upgrade →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  {[
                    { href: '/settings',  label: 'Settings',       icon: '⚙️' },
                    { href: '/analytics', label: 'Usage Analytics', icon: '🔬' },
                    { href: '/help',      label: 'Help Center',     icon: '❓' },
                    ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel', icon: '🔐' }] : []),
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Mobile quick actions */}
                <div className="p-2 border-t border-slate-100 md:hidden">
                  <Link href="/project-plan" onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50">
                    📅 New Project Plan
                  </Link>
                  <Link href="/kanban" onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50">
                    📋 New Kanban Board
                  </Link>
                </div>

                {/* ── Sign Out ── */}
                <div className="p-2 border-t border-slate-100">
                  <button onClick={signOut}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left">
                    <span>🚪</span>
                    Sign Out
                  </button>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
