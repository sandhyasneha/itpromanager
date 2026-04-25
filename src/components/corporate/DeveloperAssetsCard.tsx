/**
 * src/components/corporate/DeveloperAssetsCard.tsx
 *
 * Right-side card listing downloadable developer assets — Dockerfile today,
 * Helm chart and Terraform module "coming soon".
 */

'use client'

import type { CorporateWorkspace } from '@/lib/corporate/whitelist'

export function DeveloperAssetsCard({ workspace }: { workspace: CorporateWorkspace }) {

  function download() {
    // Mock download — real version hits /api/corporate/assets/dockerfile and streams
    const dockerfile = `# Nexplan Enterprise Container — pre-injected for ${workspace.company_name}
# License ID: ${workspace.licence_id}
# Generated: ${new Date().toISOString()}

FROM nexplan/runtime:2.4.1
ENV NEXPLAN_LICENSE_KEY="<your-key-here>"
ENV NEXPLAN_WORKSPACE="${workspace.domain}"
EXPOSE 8080
CMD ["nexplan", "serve"]
`
    const blob = new Blob([dockerfile], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `nexplan.Dockerfile.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
            <path d="m21 16-4 4-4-4"/>
            <path d="M17 20V4"/>
            <path d="m3 8 4-4 4 4"/>
            <path d="M7 4v16"/>
          </svg>
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">
            Developer Assets
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Pre-configured resources for your team.
          </p>
        </div>
      </div>

      {/* ── Asset row: Dockerfile ───────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-slate-900">Dockerfile</span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                .txt
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Ready-to-use container config with your license pre-injected.
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
              <span>v2.4.1</span>
              <span>·</span>
              <span>Updated Feb 14</span>
              <span>·</span>
              <span>1.2 KB</span>
            </div>
          </div>
        </div>
        <button
          onClick={download}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold transition-colors whitespace-nowrap shrink-0 self-center"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download .txt
        </button>
      </div>

      {/* ── Coming-soon note ─────────────────────────────────────────── */}
      <p className="mt-4 text-[11px] text-slate-500">
        More assets (Helm chart, Terraform module) coming soon.
      </p>
    </div>
  )
}
