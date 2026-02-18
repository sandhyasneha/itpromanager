'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

const NAV = [
  { href: '/dashboard',     icon: '📊', label: 'Dashboard' },
  { href: '/kanban',        icon: '📋', label: 'Kanban Board' },
  { href: '/project-plan',  icon: '📅', label: 'Project Plan' },
  { href: '/network',       icon: '🗺️', label: 'Network Diagram' },
  { href: '/knowledge',     icon: '📚', label: 'Knowledge Base' },
]
const MGMT = [
  { href: '/admin',    icon: '🔐', label: 'Admin Panel' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const initials = profile?.full_name
    ?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? 'U'

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-surface border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="font-syne font-black text-lg">IT<span className="text-accent">Pro</span>Manager</div>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-black text-xs font-black shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-syne font-semibold text-sm truncate">{profile?.full_name ?? 'User'}</div>
          <div className="text-muted text-xs truncate">{profile?.role ?? 'IT Project Manager'}</div>
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
        <p className="font-mono-code text-muted text-[10px] tracking-widest uppercase px-3 mt-5 mb-2">Management</p>
        {MGMT.map(item => (
          <Link key={item.href} href={item.href}
            className={`nav-item mb-0.5 ${path.startsWith(item.href) ? 'active' : ''}`}>
            <span className="text-lg w-6 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-border">
        <button onClick={signOut} className="nav-item w-full text-left">
          <span className="text-lg w-6 text-center">🚪</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
