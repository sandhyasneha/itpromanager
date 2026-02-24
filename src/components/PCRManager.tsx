'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types'

interface PCR {
  id: string
  pcr_number: string
  title: string
  reason: string
  impact: string
  original_end_date: string
  new_end_date: string
  status: 'pending' | 'approved' | 'rejected' | 'approved_with_conditions'
  requested_by: string
  approved_by?: string
  approval_date?: string
  approver_notes?: string
  ai_document?: string
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  pending:                   'bg-warn/10 text-warn border-warn/30',
  approved:                  'bg-accent3/10 text-accent3 border-accent3/30',
  rejected:                  'bg-danger/10 text-danger border-danger/30',
  approved_with_conditions:  'bg-accent/10 text-accent border-accent/30',
}

const STATUS_LABELS: Record<string, string> = {
  pending:                   '⏳ Pending Approval',
  approved:                  '✅ Approved',
  rejected:                  '❌ Rejected',
  approved_with_conditions:  '⚠️ Approved with Conditions',
}

export default function PCRManager({ project, onProjectUpdated }: {
  project: Project
  onProjectUpdated: (updates: Partial<Project>) => void
}) {
  const supabase = createClient()
  const [pcrs, setPcrs] = useState<PCR[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [viewPCR, setViewPCR] = useState<PCR | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedDoc, setGeneratedDoc] = useState('')

  const [form, setForm] = useState({
    title: '',
    reason: '',
    impact: '',
    new_end_date: '',
    requested_by: '',
    approver_notes: '',
  })

  useEffect(() => {
    loadPCRs()
  }, [project.id])

  async function loadPCRs() {
    const { data } = await supabase
      .from('project_change_requests')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
    setPcrs((data ?? []) as PCR[])
  }

  async function generatePCR() {
    if (!form.reason || !form.new_end_date) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-pcr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          originalEndDate: project.end_date
            ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Not set',
          newEndDate: new Date(form.new_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          reason: form.reason,
          impact: form.impact,
          requestedBy: form.requested_by,
        }),
      })
      const data = await res.json()
      if (data.content) setGeneratedDoc(data.content)
    } finally {
      setGenerating(false)
    }
  }

  async function savePCR() {
    if (!form.title || !form.reason || !form.new_end_date) return
    setSaving(true)
    const pcrNumber = `PCR-${new Date().getFullYear()}-${String(pcrs.length + 1).padStart(3, '0')}`
    const { data } = await supabase.from('project_change_requests').insert({
      project_id: project.id,
      pcr_number: pcrNumber,
      title: form.title,
      reason: form.reason,
      impact: form.impact,
      original_end_date: project.end_date || null,
      new_end_date: form.new_end_date,
      status: 'pending',
      requested_by: form.requested_by,
      ai_document: generatedDoc || null,
    }).select().single()

    if (data) {
      setPcrs(prev => [data as PCR, ...prev])
      setShowCreate(false)
      setGeneratedDoc('')
      setForm({ title: '', reason: '', impact: '', new_end_date: '', requested_by: '', approver_notes: '' })
    }
    setSaving(false)
  }

  async function approvePCR(pcr: PCR, status: PCR['status'], notes: string) {
    await supabase.from('project_change_requests').update({
      status,
      approver_notes: notes,
      approval_date: new Date().toISOString().split('T')[0],
    }).eq('id', pcr.id)

    // If approved, update project end date
    if (status === 'approved' || status === 'approved_with_conditions') {
      await supabase.from('projects').update({ end_date: pcr.new_end_date }).eq('id', project.id)
      onProjectUpdated({ end_date: pcr.new_end_date })
    }

    setPcrs(prev => prev.map(p => p.id === pcr.id ? { ...p, status, approver_notes: notes } : p))
    setViewPCR(null)
  }

  function downloadPCR(pcr: PCR) {
    const blob = new Blob([pcr.ai_document || `PCR: ${pcr.title}\n\nReason: ${pcr.reason}\n\nImpact: ${pcr.impact}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pcr.pcr_number}-${project.name.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-syne font-black text-lg">Project Change Requests</h3>
          <p className="text-xs text-muted font-mono-code">{project.name}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4 py-2">
          + New PCR
        </button>
      </div>

      {/* PCR List */}
      {pcrs.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-3xl mb-3">📋</p>
          <p className="font-syne font-bold mb-1">No Change Requests Yet</p>
          <p className="text-muted text-sm">Create a PCR when the project scope or timeline needs to change.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pcrs.map(pcr => (
            <div key={pcr.id} className="card hover:border-accent/30 transition-all cursor-pointer"
              onClick={() => setViewPCR(pcr)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono-code text-xs text-accent">{pcr.pcr_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border font-semibold ${STATUS_STYLES[pcr.status]}`}>
                      {STATUS_LABELS[pcr.status]}
                    </span>
                  </div>
                  <p className="font-syne font-bold">{pcr.title}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-1">{pcr.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted">End date change</p>
                  <p className="text-xs font-mono-code">
                    {pcr.original_end_date
                      ? new Date(pcr.original_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : 'N/A'}
                    {' → '}
                    <span className="text-warn">{new Date(pcr.new_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {new Date(pcr.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create PCR Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}>
          <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
              <div>
                <h3 className="font-syne font-black text-xl">New Project Change Request</h3>
                <p className="text-xs text-muted font-mono-code">{project.name}</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-muted hover:text-text text-xl">✕</button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1 min-h-0">
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">PCR Title *</label>
                <input className="input" placeholder="e.g. Extended timeline due to scope addition"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Original End Date</label>
                  <input type="date" className="input text-sm" value={project.end_date ?? ''} disabled
                    style={{ opacity: 0.6 }}/>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">New Proposed End Date *</label>
                  <input type="date" className="input text-sm" value={form.new_end_date}
                    min={project.end_date || undefined}
                    onChange={e => setForm(f => ({ ...f, new_end_date: e.target.value }))}/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Reason for Change *</label>
                <textarea className="input resize-none h-20"
                  placeholder="Why is this change needed? Include technical, resource or scope reasons..."
                  value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}/>
              </div>

              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Impact Analysis</label>
                <textarea className="input resize-none h-20"
                  placeholder="What is the impact on schedule, cost, resources and risks?"
                  value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}/>
              </div>

              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Requested By (PM Name)</label>
                <input className="input" placeholder="Your name"
                  value={form.requested_by} onChange={e => setForm(f => ({ ...f, requested_by: e.target.value }))}/>
              </div>

              {/* AI Generate */}
              <div className="bg-surface2 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-syne font-bold text-accent uppercase tracking-wide">🤖 AI Document Generation</p>
                  <button onClick={generatePCR}
                    disabled={!form.reason || !form.new_end_date || generating}
                    className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50">
                    {generating ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"/>
                        Generating...
                      </span>
                    ) : '✨ Generate PCR Document'}
                  </button>
                </div>
                {generatedDoc ? (
                  <div className="bg-bg rounded-xl p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-muted whitespace-pre-wrap font-mono-code leading-relaxed">{generatedDoc}</pre>
                  </div>
                ) : (
                  <p className="text-xs text-muted">Fill in reason and new end date, then click Generate to create a formal PCR document with AI.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 pt-4 border-t border-border shrink-0">
              <button onClick={() => setShowCreate(false)} className="btn-ghost px-4 py-2">Cancel</button>
              <button onClick={savePCR} disabled={!form.title || !form.reason || !form.new_end_date || saving}
                className="btn-primary px-4 py-2 disabled:opacity-50">
                {saving ? 'Saving...' : '💾 Save PCR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View / Approve PCR Modal */}
      {viewPCR && (
        <ViewPCRModal
          pcr={viewPCR}
          onApprove={(status, notes) => approvePCR(viewPCR, status, notes)}
          onDownload={() => downloadPCR(viewPCR)}
          onClose={() => setViewPCR(null)}
        />
      )}
    </div>
  )
}

function ViewPCRModal({ pcr, onApprove, onDownload, onClose }: {
  pcr: PCR
  onApprove: (status: PCR['status'], notes: string) => void
  onDownload: () => void
  onClose: () => void
}) {
  const [notes, setNotes] = useState(pcr.approver_notes ?? '')
  const [tab, setTab] = useState<'details' | 'document'>('details')

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono-code text-sm text-accent">{pcr.pcr_number}</span>
              <span className={`text-xs px-2 py-1 rounded-lg border font-semibold ${STATUS_STYLES[pcr.status]}`}>
                {STATUS_LABELS[pcr.status]}
              </span>
            </div>
            <h3 className="font-syne font-black text-lg">{pcr.title}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-border shrink-0">
          {(['details', 'document'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                ${tab === t ? 'bg-surface2 text-text' : 'text-muted hover:text-text'}`}>
              {t === 'document' ? '📄 AI Document' : '📋 Details'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-6 flex-1 min-h-0">
          {tab === 'details' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface2 rounded-xl p-3">
                  <p className="text-xs text-muted font-mono-code mb-1">Original End Date</p>
                  <p className="font-semibold">{pcr.original_end_date
                    ? new Date(pcr.original_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Not set'}</p>
                </div>
                <div className="bg-warn/5 border border-warn/20 rounded-xl p-3">
                  <p className="text-xs text-muted font-mono-code mb-1">New Proposed End Date</p>
                  <p className="font-semibold text-warn">{new Date(pcr.new_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-syne font-semibold text-muted mb-2">Reason for Change</p>
                <div className="bg-surface2 rounded-xl p-3">
                  <p className="text-sm text-muted leading-relaxed">{pcr.reason}</p>
                </div>
              </div>
              {pcr.impact && (
                <div>
                  <p className="text-xs font-syne font-semibold text-muted mb-2">Impact Analysis</p>
                  <div className="bg-surface2 rounded-xl p-3">
                    <p className="text-sm text-muted leading-relaxed">{pcr.impact}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs text-muted">
                <p>Requested by: <span className="text-text font-semibold">{pcr.requested_by || 'N/A'}</span></p>
                <p>Raised: <span className="text-text font-semibold">{new Date(pcr.created_at).toLocaleDateString('en-GB')}</span></p>
              </div>

              {/* Approval section */}
              {pcr.status === 'pending' && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-syne font-bold text-muted uppercase tracking-wide mb-3">Approver Decision</p>
                  <textarea className="input resize-none h-16 mb-3 text-sm"
                    placeholder="Add approval notes or conditions..."
                    value={notes} onChange={e => setNotes(e.target.value)}/>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => onApprove('approved', notes)}
                      className="flex-1 py-2 bg-accent3/10 border border-accent3/30 text-accent3 rounded-xl text-sm font-semibold hover:bg-accent3/20 transition-colors">
                      ✅ Approve — Update Project End Date
                    </button>
                    <button onClick={() => onApprove('approved_with_conditions', notes)}
                      className="flex-1 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl text-sm font-semibold hover:bg-accent/20 transition-colors">
                      ⚠️ Approve with Conditions
                    </button>
                    <button onClick={() => onApprove('rejected', notes)}
                      className="w-full py-2 bg-danger/5 border border-danger/20 text-danger rounded-xl text-sm font-semibold hover:bg-danger/10 transition-colors">
                      ❌ Reject
                    </button>
                  </div>
                </div>
              )}

              {pcr.status !== 'pending' && pcr.approver_notes && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-syne font-semibold text-muted mb-2">Approver Notes</p>
                  <div className="bg-surface2 rounded-xl p-3">
                    <p className="text-sm text-muted">{pcr.approver_notes}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {pcr.ai_document ? (
                <>
                  <div className="bg-surface2 rounded-xl p-4 max-h-96 overflow-y-auto mb-4">
                    <pre className="text-xs text-muted whitespace-pre-wrap font-mono-code leading-relaxed">{pcr.ai_document}</pre>
                  </div>
                  <button onClick={onDownload} className="btn-primary w-full py-2.5">
                    📥 Download PCR Document
                  </button>
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-3xl mb-3">📄</p>
                  <p className="text-muted text-sm">No AI document was generated for this PCR.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
