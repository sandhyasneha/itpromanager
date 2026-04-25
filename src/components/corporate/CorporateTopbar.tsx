/**
 * src/components/corporate/CorporateTopbar.tsx
 *
 * Header strip across the top of the portal.
 * Matches the mockup: "WORKSPACE / Developer Portal" breadcrumb + search + bell.
 */

'use client'

import { usePathname } from 'next/navigation'
import type { CorporateWorkspace } from '@/lib/corporate/whitelist'

const PAGE_TITLES: Record<string, string> = {
  '/portal':            'Developer Portal',
  '/portal/licenses':   'Licenses',
  '/portal/downloads':  'Downloads',
  '/portal/activity':   'Activity',
  '/portal/settings':   'Settings',
}

export function CorporateTopbar({ workspace }: { workspace: CorporateWorkspace }) {
  const path  = usePathname()
  const title = PAGE_TITLES[path] ?? 'Workspace'

  return (
    <header className="h-[52px] px-8 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[12px]">
        <span className="font-mono text-slate-400 tracking-[0.12em] uppercase text-[10px]">
          Workspace
        </span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">{title}</span>
      </div>

      {/* ── Right side: search + bell ────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12px] text-slate-500 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <span>Search…</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-500 border border-slate-200">
            ⌘K
          </kbd>
        </button>

        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}
