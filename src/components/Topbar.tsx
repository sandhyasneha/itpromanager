'use client'
import { usePathname } from 'next/navigation'
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
  const title = Object.entries(TITLES).find(([k]) => path.startsWith(k))?.[1] ?? 'ITProManager'
  const initials = profile?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) ?? 'U'

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 bg-surface border-b border-border">
      <h1 className="font-syne font-black text-xl">{title}</h1>
      <div className="flex items-center gap-3">
        <a href="/kanban" className="btn-ghost text-sm px-4 py-2">✨ AI Generate</a>
        <button className="btn-primary text-sm px-4 py-2">+ New Project</button>
        <div className="relative cursor-pointer">
          <span className="text-xl">🔔</span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[10px] font-bold flex items-center justify-center text-white">3</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-black text-xs font-black">
          {initials}
        </div>
      </div>
    </header>
  )
}
