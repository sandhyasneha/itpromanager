/**
 * src/components/corporate/ActivityLog.tsx
 *
 * Bottom card with a table of recent workspace events.
 */

export interface ActivityEvent {
  icon:    'eye' | 'download' | 'shield' | 'user' | 'check' | 'key'
  action:  string
  detail:  string
  ts:      string
}

const ICON_MAP: Record<ActivityEvent['icon'], React.ReactNode> = {
  eye:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  download: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  shield:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  user:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  check:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  key:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>,
}

export function ActivityLog({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-6 py-5 flex items-start justify-between gap-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">Activity Log</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Recent events from your workspace</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 mt-1.5">
          Last {events.length} events
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400">Action</th>
              <th className="text-left px-6 py-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400">Detail</th>
              <th className="text-right px-6 py-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      {ICON_MAP[e.icon]}
                    </div>
                    <span className="text-[13px] font-medium text-slate-900">{e.action}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-[12px] font-mono text-slate-600">{e.detail}</td>
                <td className="px-6 py-3.5 text-right text-[11px] font-mono text-slate-500 whitespace-nowrap">{e.ts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
