'use client'

import { useEffect, useState } from 'react'
import Link                    from 'next/link'

interface Props {
  open:        boolean
  licenceKey:  string
  onClose:     () => void
}

export function PostGenerateModal({ open, licenceKey, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function copy() {
    navigator.clipboard.writeText(licenceKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function downloadAsset(file: 'dockerfile' | 'compose' | 'env' | 'readme') {
    window.open(`/api/corporate/assets/dockerfile?file=${file}`, '_blank')
    // Mark step 2 as done
    fetch('/api/corporate/onboarding', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ step: 'assets_downloaded' }),
    })
  }

  function downloadAll() {
    const files: Array<'dockerfile' | 'compose' | 'env' | 'readme'> = ['dockerfile', 'compose', 'env', 'readme']
    files.forEach((f, i) => setTimeout(() => downloadAsset(f), i * 250))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-6 py-5 relative overflow-hidden rounded-t-2xl">
          <div
            aria-hidden
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur text-[10px] font-semibold tracking-wider text-white uppercase mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Licence Issued
              </div>
              <h2 className="text-[18px] font-bold text-white leading-tight">
                Your licence is ready 🎉
              </h2>
              <p className="text-[12px] text-indigo-100 mt-1">
                3 quick steps to get NexPlan running in your data centre.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 -m-1 transition-colors"
              title="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Step 1: Save the key */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-[12px] font-bold text-indigo-700">
              1
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-slate-900 mb-1">
                Save your licence key
              </h3>
              <p className="text-[12px] text-slate-500 mb-2 leading-relaxed">
                You won&apos;t see the full key again after closing this dialog. Store it somewhere safe (password manager / secret store).
              </p>
              <div className="flex gap-2">
                <code className="flex-1 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-600 truncate">
                  {licenceKey.slice(0, 30)}...{licenceKey.slice(-8)}
                </code>
                <button
                  onClick={copy}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors whitespace-nowrap"
                >
                  {copied ? '✓ Copied' : 'Copy key'}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Download files */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-[12px] font-bold text-indigo-700">
              2
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-slate-900 mb-1">
                Download deployment files
              </h3>
              <p className="text-[12px] text-slate-500 mb-2 leading-relaxed">
                4 files, pre-configured for your workspace: Dockerfile, docker-compose.yml, .env.template, README.md.
              </p>
              <button
                onClick={downloadAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download all 4 files
              </button>
            </div>
          </div>

          {/* Step 3: Run on server */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-[12px] font-bold text-indigo-700">
              3
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-slate-900 mb-1">
                Install on your server
              </h3>
              <p className="text-[12px] text-slate-500 mb-2 leading-relaxed">
                On your data-centre Linux server, place the 4 files in a folder, paste your licence key into <code className="bg-slate-100 px-1 rounded text-[10px]">.env</code>, and run:
              </p>
              <pre className="bg-slate-900 text-emerald-300 px-3 py-2 rounded-md text-[11px] font-mono overflow-x-auto leading-relaxed">
{`cp .env.template .env
nano .env   # paste your NEXPLAN_LICENCE_KEY
docker compose pull
docker compose up -d`}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 rounded-b-2xl">
          <p className="text-[11px] text-slate-500">
            Need more detail? Read the{' '}
            <Link href="/portal/setup-guide" className="text-indigo-600 hover:underline font-medium">
              full setup guide
            </Link>
            .
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[12px] font-semibold transition-colors"
          >
            Got it, I&apos;ll set it up later
          </button>
        </div>
      </div>
    </div>
  )
}
