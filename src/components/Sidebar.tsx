'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',       icon: '📊' },
  { href: '/kanban',        label: 'Kanban Board',     icon: '📋' },
  { href: '/project-plan',  label: 'Project Plan',     icon: '📅' },
  { href: '/network',       label: 'Network Diagram',  icon: '🗺️' },
  { href: '/knowledge',     label: 'Knowledge Base',   icon: '📚' },
]

const ADMIN_NAV = [
  { href: '/admin',    label: 'Admin Panel',  icon: '🔐' },
  { href: '/settings', label: 'Settings',     icon: '⚙️' },
]

const USER_NAV = [
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

const ADMIN_EMAIL = 'admin@nexplan.io'

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isAdmin = profile?.email === ADMIN_EMAIL
  const fullName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'User'
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const mgmtNav = isAdmin ? ADMIN_NAV : USER_NAV

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-surface border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="font-syne font-black text-lg">
          Nex<span className="text-accent">Plan</span>
          {isAdmin && <span className="ml-2 text-[10px] bg-danger/20 text-danger px-2 py-0.5 rounded font-mono-code align-middle">ADMIN</span>}
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isAdmin ? 'bg-gradient-to-br from-danger to-warn text-white' : 'bg-gradient-to-br from-accent to-accent2 text-black'}`}>
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-syne font-semibold text-sm truncate">{fullName}</div>
          <div className="text-muted text-xs truncate">{isAdmin ? 'Administrator' : (profile?.role ?? 'IT Project Manager')}</div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <p className="font-mono-code text-muted text-[10px] tracking-widest uppercase px-3 mb-2">Workspace</p>
        {NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={`nav-item mb-0.5 ${path.startsWith(item.href) ? 'active' : ''}`}>
            <span className="text-lg w-6 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <p className="font-mono-code text-muted text-[10px] tracking-widest uppercase px-3 mt-5 mb-2">
          {isAdmin ? 'Administration' : 'Account'}
        </p>
        {mgmtNav.map(item => (
          <Link key={item.href} href={item.href}
            className={`nav-item mb-0.5 ${path.startsWith(item.href) ? 'active' : ''}`}>
            <span className="text-lg w-6 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-border">
        <button onClick={signOut} className="nav-item w-full text-left text-danger hover:bg-danger/10">
          <span className="text-lg w-6 text-center">🚪</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
