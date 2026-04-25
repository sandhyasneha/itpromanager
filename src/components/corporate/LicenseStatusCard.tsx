/**
 * src/components/corporate/LicenseStatusCard.tsx
 *
 * Top status card with the green dot + ACTIVE pill + KPI strip.
 * Matches mockup 2 row 1.
 */

import type { CorporateWorkspace } from '@/lib/corporate/whitelist'

const KPI_ICONS = {
  plan:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  seats:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  renewal: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  api:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
}

export function LicenseStatusCard({ workspace }: { workspace: CorporateWorkspace }) {
  const renewalDate = new Date(workspace.renewal_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const kpis = [
    { key: 'plan',    label: 'Plan',          value: 'Enterprise', icon: KPI_ICONS.plan },
    { key: 'seats',   label: 'Seats In Use',  value: `${workspace.seats_in_use} / ${workspace.seats}`, icon: KPI_ICONS.seats },
    { key: 'renewal', label: 'Renewal',       value: renewalDate, icon: KPI_ICONS.renewal },
    { key: 'api',     label: 'API Usage',     value: '62% of quota', icon: KPI_ICONS.api },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">

      {/* ── Status row ──────────────────────────────────────────────── */}
      <div className="px-6 py-5 flex items-center gap-4">
        <div className="relative w-3 h-3 shrink-0">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
          <span className="absolute inset-0 rounded-full bg-emerald-500" />
        </div>

        <div className="flex-1">
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 mb-0.5">
            Status
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-semibold text-slate-900">License is active</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-mono font-semibold tracking-wider text-emerald-700 uppercase">
              Active
            </span>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">
            All entitlements verified · Last sync 4 minutes ago
          </p>
        </div>

        <button className="text-[12px] text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors font-medium whitespace-nowrap">
          View entitlements
        </button>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-slate-100">
        {kpis.map((k, i) => (
          <div
            key={k.key}
            className={`px-6 py-4 ${i < 3 ? 'lg:border-r border-slate-100' : ''} ${i % 2 === 0 ? 'border-r lg:border-r' : ''} ${i < 2 ? 'border-b lg:border-b-0' : ''} border-slate-100`}
          >
            <div className="flex items-center gap-1.5 mb-1.5 text-slate-400">
              {k.icon}
              <span className="text-[10px] font-semibold tracking-[0.12em] uppercase">{k.label}</span>
            </div>
            <div className="text-[15px] font-semibold text-slate-900">{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
