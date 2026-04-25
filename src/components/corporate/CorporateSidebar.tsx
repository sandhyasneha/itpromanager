/**
 * src/components/corporate/CorporateSidebar.tsx
 *
 * Left rail for the corporate portal. Matches the mockup:
 * - Top: "Corporate / Nexplan.io" tenant header
 * - Workspace tenant block: Acme Corp · Enterprise · 25 seats
 * - Workspace nav: Overview / Licenses / Downloads / Activity / Settings
 * - Bottom: user avatar + email + sign-out
 */

'use client'

import Link             from 'next/link'
import { usePathname }  from 'next/navigation'
import { useRouter }    from 'next/navigation'
import type { CorporateWorkspace } from '@/lib/corporate/whitelist'

const NAV = [
  { href: '/portal',           label: 'Overview',  icon: OverviewIcon  },
  { href: '/portal/licenses',  label: 'Licenses',  icon: LicensesIcon  },
  { href: '/portal/downloads', label: 'Downloads', icon: DownloadsIcon },
  { href: '/portal/activity',  label: 'Activity',  icon: ActivityIcon  },
  { href: '/portal/settings',  label: 'Settings',  icon: SettingsIcon  },
]

interface Props {
  workspace: CorporateWorkspace
  userEmail: string
  userName:  string
}

export function CorporateSidebar({ workspace, userEmail, userName }: Props) {
  const path   = usePathname()
  const router = useRouter()

  function signOut() {
    document.cookie = 'corp_email=; path=/; max-age=0'
    router.push('/login')
  }

  // Initials for avatars
  const wsInitials  = workspace.company_name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
  const userInit    = userName[0]?.toUpperCase() ?? 'U'

  return (
    <aside className="hidden md:flex flex-col w-[252px] shrink-0 bg-white border-r border-slate-200/80">

      {/* ── Tenant header (Corporate · Nexplan.io) ──────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
            <span className="text-white text-[12px] font-bold font-mono">N</span>
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-slate-900 leading-tight">Corporate</div>
            <div className="text-[11px] text-slate-500 font-mono leading-tight">Nexplan.io</div>
          </div>
        </div>
      </div>

      {/* ── Workspace tenant block ──────────────────────────────────────── */}
      <div className="px-3 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-bold">{wsInitials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-slate-900 leading-tight truncate">
              {workspace.company_name}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight mt-0.5 capitalize">
              {workspace.plan} · {workspace.seats} seats
            </div>
          </div>
        </div>
      </div>

      {/* ── Workspace nav ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400">
          Workspace
        </p>
        {NAV.map(item => {
          const Icon   = item.icon
          const active = item.href === '/portal'
            ? path === '/portal'
            : path.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] mb-0.5
                transition-colors
                ${active
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <Icon className="w-4 h-4 shrink-0" active={active} />
              <span className="truncate">{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
            </Link>
          )
        })}
      </nav>

      {/* ── User footer ─────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-3 py-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            <span className="text-slate-700 text-[11px] font-bold">{userInit}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-slate-900 leading-tight truncate">{userName}</div>
            <div className="text-[10px] text-slate-500 leading-tight truncate">{userEmail}</div>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ── Icons ──────────────────────────────────────────────────────────────── */

interface IconProps { className?: string; active?: boolean }
const stroke = (active?: boolean) => active ? 'currentColor' : 'currentColor'

function OverviewIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke()} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function LicensesIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-9.6 9.6"/>
      <circle cx="7.5" cy="15.5" r="5.5"/>
      <path d="m21 2-3 3"/><path d="m18 5-3-3"/>
    </svg>
  )
}
function DownloadsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}
function ActivityIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}
function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
