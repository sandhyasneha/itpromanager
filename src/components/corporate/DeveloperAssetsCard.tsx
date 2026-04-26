'use client'

import type { CorporateWorkspace } from '@/lib/corporate/whitelist'

interface AssetFile {
  type:        'dockerfile' | 'compose' | 'env' | 'readme'
  name:        string
  description: string
  size:        string
  icon:        React.ReactNode
}

const ASSETS: AssetFile[] = [
  {
    type:        'dockerfile',
    name:        'Dockerfile',
    description: 'Container image config (pulls the official NexPlan release).',
    size:        '~1 KB',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    type:        'compose',
    name:        'docker-compose.yml',
    description: 'One-command stack: NexPlan + PostgreSQL + networking.',
    size:        '~2 KB',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-600">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
  },
  {
    type:        'env',
    name:        '.env.template',
    description: 'Environment variables template — paste your licence key here.',
    size:        '~1 KB',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    type:        'readme',
    name:        'README.md',
    description: 'Step-by-step install guide tailored to your workspace.',
    size:        '~5 KB',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
]

export function DeveloperAssetsCard({ workspace }: { workspace: CorporateWorkspace }) {

  function download(asset: AssetFile) {
    // Hits the corporate asset API; auth via corp_email cookie
    window.location.href = `/api/corporate/assets/dockerfile?file=${asset.type}`
  }

  function downloadAll() {
    // Sequentially trigger all four downloads. Browsers throttle parallel
    // downloads but staggering with tiny delays gives a clean UX.
    ASSETS.forEach((a, i) => setTimeout(() => download(a), i * 250))
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-700">
              <path d="m21 16-4 4-4-4"/>
              <path d="M17 20V4"/>
              <path d="m3 8 4-4 4 4"/>
              <path d="M7 4v16"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">
              Deployment Assets
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Pre-configured for <strong>{workspace.company_name}</strong> · {workspace.domain}
            </p>
          </div>
        </div>
        <button
          onClick={downloadAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download All
        </button>
      </div>

      {/* Asset list */}
      <div className="space-y-2">
        {ASSETS.map(asset => (
          <div
            key={asset.type}
            className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                {asset.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[13px] font-semibold text-slate-900">{asset.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {asset.size}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {asset.description}
                </p>
              </div>
            </div>
            <button
              onClick={() => download(asset)}
              className="px-2.5 py-1 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 self-center"
            >
              Download
            </button>
          </div>
        ))}
      </div>

      {/* Hint */}
      <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
        💡 After downloading, place all four files in the same folder on your server, paste your
        licence key into <code className="bg-slate-100 px-1 rounded">.env</code>, and run <code className="bg-slate-100 px-1 rounded">docker compose up -d</code>.
        Full guide in <code className="bg-slate-100 px-1 rounded">README.md</code>.
      </p>
    </div>
  )
}
