'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/types'

const TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/kanban':       'Kanban Board',
  '/project-plan': 'Project Plan',
  '/network':      'Network Diagram',
  '/knowledge':    'Knowledge Base',
  '/admin':        'Admin Panel',
  '/settings':     'Settings',
}

export default function Topbar({ profile }: { profile: Profile | null }) {
  const path = usePathname()
  const title = Object.entries(TITLES).find(([k]) => path.startsWith(k))?.[1] ?? 'NexPlan'

  const fullName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'User'
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 bg-surface border-b border-border">
      <h1 className="font-syne font-black text-xl">{title}</h1>
      <div className="flex items-center gap-3">
        <Link href="/project-plan" className="btn-ghost text-sm px-4 py-2">+ New Plan</Link>
        <Link href="/kanban" className="btn-primary text-sm px-4 py-2">+ New Project</Link>

        {/* Notification bell */}
        <div className="relative cursor-pointer p-2 hover:bg-surface2 rounded-lg transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-danger rounded-full text-[9px] font-bold flex items-center justify-center text-white">3</span>
        </div>

        {/* User avatar with tooltip */}
        <div className="relative group">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-surface2 transition-colors cursor-pointer border border-transparent hover:border-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-black text-xs font-black shrink-0">
              {initials}
            </div>
            <div className="hidden md:block">
              <p className="font-syne font-semibold text-sm leading-tight">{fullName}</p>
              <p className="text-[10px] text-muted leading-tight font-mono-code">{profile?.role ?? 'IT Project Manager'}</p>
            </div>
          </div>

          {/* Tooltip on hover */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-black text-sm font-black shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-syne font-bold text-sm truncate">{fullName}</p>
                <p className="text-xs text-muted truncate font-mono-code">{profile?.email}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted">Role: <span className="text-text">{profile?.role ?? 'IT Project Manager'}</span></p>
              <p className="text-xs text-muted">Country: <span className="text-text">{profile?.country ?? 'Not set'}</span></p>
            </div>
            <Link href="/settings" className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-surface2 hover:bg-border rounded-lg text-xs transition-colors">
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
