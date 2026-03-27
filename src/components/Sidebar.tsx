'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Profile } from '@/types'
import NexPlanLogo from '@/components/NexPlanLogo'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',      icon: '📊' },
  { href: '/kanban',       label: 'Kanban Board',    icon: '📋' },
  { href: '/project-plan', label: 'Project Plan',    icon: '📅' },
  { href: '/network',      label: 'Network Diagram', icon: '🗺️' },
  { href: '/knowledge',    label: 'Knowledge Base',  icon: '📚' },
  { href: '/my-tasks',     label: 'My Tasks',        icon: '✅' },
  { href: '/reports',      label: 'Reports',         icon: '📈' },
  { href: '/analytics',    label: 'Analytics',       icon: '🔬' },
  { href: '/help',         label: 'Help Center',     icon: '❓' },
]

const ADMIN_NAV = [
  { href: '/admin',    label: 'Admin Panel', icon: '🔐' },
  { href: '/settings', label: 'Settings',    icon: '⚙️' },
]

const USER_NAV = [
  { href: '/feedback', label: 'Feedback', icon: '💬' },
  { href: '/settings', label: 'Settings',  icon: '⚙️' },
]

const ADMIN_EMAIL = 'info@nexplan.io'

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const path     = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false) }, [path])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // ── Capture IP/country on first load ─────────────────────
  useEffect(() => {
    if (!profile?.id) return
    // Only capture once per session using sessionStorage
    const key = `ip_captured_${profile.id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/api/capture-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.id }),
    }).catch(() => {}) // silent fail — not critical
  }, [profile?.id])

  const isAdmin  = profile?.email === ADMIN_EMAIL
  const fullName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'User'
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const mgmtNav  = isAdmin ? ADMIN_NAV : USER_NAV
  const plan     = (profile as any)?.plan ?? 'free'

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const SidebarContent = () => (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200 w-[240px]">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NexPlanLogo size="md" />
          {isAdmin && (
            <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-mono-code border border-red-200">
              ADMIN
            </span>
          )}
        </div>
        {/* Close button — mobile only */}
        <button onClick={() => setOpen(false)}
          className="md:hidden p-1 rounded-lg hover:bg-slate-100 text-slate-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* User profile */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-50">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 text-white
            ${isAdmin ? 'bg-gradient-to-br from-red-500 to-orange-400' : 'bg-gradient-to-br from-cyan-400 to-violet-500'}`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-syne font-bold text-sm text-slate-900 truncate">{fullName}</div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded-full font-bold
                ${plan === 'pro' ? 'bg-violet-100 text-violet-700' :
                  plan === 'enterprise' ? 'bg-cyan-100 text-cyan-700' :
                  'bg-slate-200 text-slate-500'}`}>
                {plan === 'pro' ? '⚡ Pro' : plan === 'enterprise' ? '🏢 Enterprise' : '🎁 Free'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <p className="font-mono-code text-slate-400 text-[10px] tracking-widest uppercase px-3 mb-2">
          Workspace
        </p>
        {NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={`nav-item mb-0.5 ${path.startsWith(item.href) ? 'active' : ''}`}>
            <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}

        {/* Corporate — Enterprise plan only */}
        {plan === 'enterprise' && (
          <>
            <p className="font-mono-code text-slate-400 text-[10px] tracking-widest uppercase px-3 pt-4 pb-1">Corporate</p>
            <Link href="/organisation"
              className={`nav-item mb-0.5 ${path.startsWith('/organisation') && !path.includes('dashboard') ? 'active' : ''}`}>
              <span className="text-base w-5 text-center shrink-0">🏢</span>
              <span className="truncate">Organisation</span>
            </Link>
            <Link href="/organisation/dashboard"
              className={`nav-item mb-0.5 ${path.includes('/organisation/dashboard') ? 'active' : ''}`}>
              <span className="text-base w-5 text-center shrink-0">📊</span>
              <span className="truncate">Exec Dashboard</span>
            </Link>
          </>
        )}

        <p className="font-mono-code text-slate-400 text-[10px] tracking-widest uppercase px-3 mt-5 mb-2">
          {isAdmin ? 'Administration' : 'Account'}
        </p>
        {mgmtNav.map(item => (
          <Link key={item.href} href={item.href}
            className={`nav-item mb-0.5 ${path.startsWith(item.href) ? 'active' : ''}`}>
            <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Upgrade banner — free users only */}
      {plan === 'free' && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-cyan-50 to-violet-50 border border-cyan-100">
          <p className="text-xs font-syne font-bold text-slate-800 mb-1">⚡ Upgrade to Pro</p>
          <p className="text-[11px] text-slate-500 mb-2">Unlock AI features for $5/mo</p>
          <Link href="/pricing"
            className="block w-full text-center text-xs font-bold py-1.5 rounded-lg text-white"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
            Upgrade Now →
          </Link>
        </div>
      )}

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-slate-100">
        <button onClick={signOut}
          className="nav-item w-full text-left text-red-400 hover:bg-red-50 hover:text-red-600">
          <span className="text-base w-5 text-center shrink-0">🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 z-50">
        <SidebarContent />
      </div>

      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-md border border-slate-200">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-700">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      {/* ── Mobile sidebar overlay ── */}
      {open && (
        <>
          <div className="sidebar-overlay md:hidden" onClick={() => setOpen(false)} />
          <div className="md:hidden fixed left-0 top-0 bottom-0 z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  )
}
