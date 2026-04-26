'use client'

import { useEffect, useState } from 'react'
import type { CorporateWorkspace } from '@/lib/corporate/whitelist'
import { PostGenerateModal }       from './PostGenerateModal'

interface ActiveLicence {
  licence_id:  string
  plan:        string
  seats:       number
  ai_enabled:  boolean
  expires_at:  string
  issued_at:   string
}

interface IssueResponse {
  licence_id:     string
  licence_key:    string
  client_name:    string
  allowed_domain: string
  plan:           string
  seats:          number
  expires_at:     string
}

export function ProductLicenseCard({ workspace }: { workspace: CorporateWorkspace }) {
  const [activeLicence, setActiveLicence] = useState<ActiveLicence | null>(null)
  const [loadingActive, setLoadingActive] = useState(true)

  const [freshKey,   setFreshKey]   = useState<string | null>(null)
  const [revealed,   setRevealed]   = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Onboarding modal
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetch('/api/corporate/licence/issue', { method: 'GET' })
      .then(r => r.json())
      .then(data => {
        if (data.active_licence) setActiveLicence(data.active_licence)
        setLoadingActive(false)
      })
      .catch(() => setLoadingActive(false))
  }, [])

  async function generate() {
    const confirmMsg = activeLicence
      ? 'This will REVOKE the current key immediately.\n\n' +
        'All running NexPlan deployments using the current key will lose access ' +
        'within minutes (next licence revalidation).\n\n' +
        'Update your .env on the server with the new key after generating.\n\n' +
        'Continue?'
      : 'Generate your first NexPlan licence key for ' + workspace.company_name + '?'

    if (!confirm(confirmMsg)) return

    setGenerating(true)
    setError(null)
    setFreshKey(null)
    setRevealed(false)

    try {
      const r = await fetch('/api/corporate/licence/issue', { method: 'POST' })
      const data = await r.json() as IssueResponse | { error: string }

      if (!r.ok || 'error' in data) {
        setError(('error' in data && data.error) || 'Failed to generate licence')
        return
      }

      setFreshKey(data.licence_key)
      setRevealed(true)

      setActiveLicence({
        licence_id: data.licence_id,
        plan:       data.plan,
        seats:      data.seats,
        ai_enabled: true,
        expires_at: data.expires_at,
        issued_at:  new Date().toISOString(),
      })

      // Mark onboarding step 1 as done
      fetch('/api/corporate/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ step: 'licence_generated' }),
      }).catch(() => {})

      // Show the post-generate modal with the key + next steps
      setModalOpen(true)
    } catch (e: any) {
      setError(e.message ?? 'Network error')
    } finally {
      setGenerating(false)
    }
  }

  function copy() {
    if (!freshKey) return
    navigator.clipboard.writeText(freshKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const display = freshKey
    ? (revealed ? freshKey : 'eyJhbGci' + '•'.repeat(36) + freshKey.slice(-6))
    : (activeLicence
        ? `${activeLicence.licence_id.toUpperCase()} (full key shown only at generation)`
        : 'No licence yet — click Generate')

  return (
    <>
      <div id="product-licence" className="bg-white rounded-2xl border border-slate-200/80 p-6 transition-all">

        {/* Header */}
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
                Your Product Licence
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                Authorises NexPlan to run on <strong>{workspace.domain}</strong>. Treat the full key as a secret.
              </p>
            </div>
          </div>
          {activeLicence && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-mono font-semibold tracking-wider text-emerald-700 uppercase shrink-0">
              Active
            </span>
          )}
        </div>

        {/* Key field */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-500 mb-1.5">
            Licence Key
          </p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-700 select-all">
              <span className="flex-1 truncate">
                {loadingActive ? 'Loading…' : display}
              </span>
              {freshKey && (
                <button
                  onClick={() => setRevealed(r => !r)}
                  title={revealed ? 'Hide' : 'Reveal'}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                >
                  {revealed ? '🙈' : '👁'}
                </button>
              )}
            </div>
            {freshKey && (
              <button
                onClick={copy}
                title="Copy"
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors text-[11px] font-mono"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            )}
          </div>
          {activeLicence && !freshKey && (
            <p className="text-[10px] text-slate-400 mt-1.5">
              Key issued {new Date(activeLicence.issued_at).toLocaleDateString()} · Expires {activeLicence.expires_at}.
              For security the full key is shown only once at generation.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-100 text-[11px] text-red-700">
            {error}
          </div>
        )}

        {freshKey && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
            ⚠ <strong>Copy this key now.</strong> It will not be shown again after you leave this page.
            Add it to your server&apos;s <code className="bg-amber-100 px-1 rounded">.env</code> file as <code className="bg-amber-100 px-1 rounded">NEXPLAN_LICENCE_KEY</code>.
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 leading-relaxed flex-1">
            {activeLicence
              ? <>Generating a new key <span className="font-semibold text-red-600">immediately revokes</span> the current one.</>
              : <>No active licence. Click <strong>Generate</strong> to create one.</>}
          </p>
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-semibold transition-colors whitespace-nowrap"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={generating ? 'animate-spin' : ''}>
              <path d="M21 2v6h-6"/>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            {generating ? 'Generating…' : (activeLicence ? 'Generate New Key' : 'Generate Key')}
          </button>
        </div>
      </div>

      {/* Post-generation modal */}
      <PostGenerateModal
        open={modalOpen}
        licenceKey={freshKey ?? ''}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
