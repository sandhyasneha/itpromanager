/**
 * src/components/corporate/ProductLicenseCard.tsx
 *
 * Shows the masked license key with reveal/copy buttons and the
 * "Generate New Key" action. Matches mockup 2 left card.
 */

'use client'

import { useState } from 'react'
import type { CorporateWorkspace } from '@/lib/corporate/whitelist'

export function ProductLicenseCard({ workspace }: { workspace: CorporateWorkspace }) {
  const [revealed, setRevealed] = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  // Mock visible key — real version fetches from /api/corporate/licence
  const fullKey = `${workspace.licence_id.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4) || 'XXXX'}-A4B9-7C2D-1234`
  const masked  = 'XXXX-XXXX-XXXX-' + fullKey.slice(-4)

  const display = revealed ? fullKey : masked

  function copy() {
    navigator.clipboard.writeText(fullKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function regen() {
    if (!confirm('Generating a new key will immediately revoke the current one. All running deployments using the current key will lose access. Continue?')) return
    setRegenerating(true)
    setTimeout(() => setRegenerating(false), 1200)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
              <path d="m21 2-9.6 9.6"/>
              <circle cx="7.5" cy="15.5" r="5.5"/>
              <path d="m21 2-3 3"/><path d="m18 5-3-3"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">
              Your Product License
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
              This key authorizes deployment of Nexplan binaries within your workspace.
              Treat it as a secret.
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-mono font-semibold tracking-wider text-emerald-700 uppercase shrink-0">
          Verified
        </span>
      </div>

      {/* ── Key field ───────────────────────────────────────────────── */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-500 mb-1.5">
          License Key
        </p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[13px] text-slate-700 select-all">
            <span className="flex-1 truncate">{display}</span>
            <button
              onClick={() => setRevealed(r => !r)}
              title={revealed ? 'Hide' : 'Reveal'}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
            >
              {revealed ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                  <line x1="2" y1="2" x2="22" y2="22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <button
            onClick={copy}
            title="Copy"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Footer: warning + regenerate ────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-100">
        <p className="text-[11px] text-slate-500 leading-relaxed flex-1">
          Generating a new key{' '}
          <span className="font-semibold text-red-600">immediately revokes</span>{' '}
          the current one.
        </p>
        <button
          onClick={regen}
          disabled={regenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-semibold transition-colors whitespace-nowrap"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={regenerating ? 'animate-spin' : ''}>
            <path d="M21 2v6h-6"/>
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
            <path d="M3 22v-6h6"/>
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
          </svg>
          {regenerating ? 'Generating…' : 'Generate New Key'}
        </button>
      </div>
    </div>
  )
}
