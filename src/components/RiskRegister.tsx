'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Risk {
  id: string
  project_id: string
  risk_number: string
  type: 'risk' | 'issue'
  title: string
  description: string
  rag_status: 'red' | 'amber' | 'green'
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  mitigation_plan?: string
  owner?: string
  status: 'open' | 'mitigated' | 'closed' | 'resolved'
  ai_mitigation?: string
  raised_date?: string
  review_date?: string
}

interface Props {
  projectId: string
  projectName: string
  onClose: () => void
}

const RAG = {
  red:   { label: 'Red',   bg: 'bg-danger/10',  text: 'text-danger',  dot: 'bg-danger',  border: 'border-danger/30' },
  amber: { label: 'Amber', bg: 'bg-warn/10',    text: 'text-warn',    dot: 'bg-warn',    border: 'border-warn/30' },
  green: { label: 'Green', bg: 'bg-accent3/10', text: 'text-accent3', dot: 'bg-accent3', border: 'border-accent3/30' },
}

const PROB_IMPACT = {
  low:    { label: 'Low',    color: 'text-accent3' },
  medium: { label: 'Medium', color: 'text-warn' },
  high:   { label: 'High',   color: 'text-danger' },
}

const STATUS_COLORS: Record<string, string> = {
  open:      'bg-danger/10 text-danger',
  mitigated: 'bg-warn/10 text-warn',
  resolved:  'bg-accent3/10 text-accent3',
  closed:    'bg-surface2 text-muted',
}

const emptyForm = {
  type: 'risk' as 'risk' | 'issue',
  title: '',
  description: '',
  rag_status: 'amber' as 'red' | 'amber' | 'green',
  probability: 'medium' as 'low' | 'medium' | 'high',
  impact: 'medium' as 'low' | 'medium' | 'high',
  mitigation_plan: '',
  owner: '',
  status: 'open' as 'open' | 'mitigated' | 'closed' | 'resolved',
  raised_date: new Date().toISOString().split('T')[0],
  review_date: '',
}

export default function RiskRegister({ projectId, projectName, onClose }: Props) {
  const supabase = createClient()
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'risk' | 'issue'>('risk')
  const [showForm, setShowForm] = useState(false)
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [viewingRisk, setViewingRisk] = useState<Risk | null>(null)

  useEffect(() => { loadRisks() }, [projectId])

  async function loadRisks() {
    setLoading(true)
    const { data } = await supabase
      .from('risk_register')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setRisks(data || [])
    setLoading(false)
  }

  async function generateAIMitigation() {
    if (!form.title || !form.description) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/generate-mitigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          description: form.description,
          rag_status: form.rag_status,
          probability: form.probability,
          impact: form.impact,
          projectName,
        }),
      })
      const data = await res.json()
      setForm(f => ({ ...f, mitigation_plan: data.mitigation }))
    } catch (e) {
      console.error(e)
    } finally {
      setAiLoading(false)
    }
  }

  async function saveRisk() {
    if (!form.title || !form.description) return
    setSaving(true)

    const existingCount = risks.filter(r => r.type === form.type).length
    const prefix = form.type === 'risk' ? 'RISK' : 'ISSUE'
    const riskNumber = editingRisk?.risk_number || `${prefix}-${String(existingCount + 1).padStart(3, '0')}`

    const payload = { ...form, project_id: projectId, risk_number: riskNumber }

    if (editingRisk) {
      await supabase.from('risk_register').update(payload).eq('id', editingRisk.id)
    } else {
      await supabase.from('risk_register').insert(payload)
    }

    await loadRisks()
    setShowForm(false)
    setEditingRisk(null)
    setForm(emptyForm)
    setSaving(false)
  }

  async function deleteRisk(id: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from('risk_register').delete().eq('id', id)
    setRisks(r => r.filter(x => x.id !== id))
  }

  function openEdit(risk: Risk) {
    setEditingRisk(risk)
    setForm({
      type: risk.type, title: risk.title, description: risk.description,
      rag_status: risk.rag_status, probability: risk.probability, impact: risk.impact,
      mitigation_plan: risk.mitigation_plan || '', owner: risk.owner || '',
      status: risk.status, raised_date: risk.raised_date || '',
      review_date: risk.review_date || '',
    })
    setViewingRisk(null)
    setShowForm(true)
  }

  const filtered = risks.filter(r => r.type === activeTab)
  const redCount   = risks.filter(r => r.rag_status === 'red'   && r.status === 'open').length
  const amberCount = risks.filter(r => r.rag_status === 'amber' && r.status === 'open').length
  const greenCount = risks.filter(r => r.rag_status === 'green' && r.status === 'open').length
  const issueCount = risks.filter(r => r.type === 'issue' && r.status === 'open').length

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="card w-full max-w-5xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
          <div>
            <p className="font-mono-code text-xs text-warn uppercase tracking-widest mb-1">Risk & Issue Register</p>
            <h2 className="font-syne font-black text-2xl">{projectName}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditingRisk(null); setForm({ ...emptyForm, type: activeTab }); setShowForm(true) }}
              className="btn-primary text-sm px-4 py-2">
              + Add {activeTab === 'risk' ? 'Risk' : 'Issue'}
            </button>
            <button onClick={onClose} className="text-muted hover:text-text text-xl">✕</button>
          </div>
        </div>

        {/* RAG Summary */}
        <div className="grid grid-cols-4 gap-3 p-6 pb-4 shrink-0">
          {[
            { label: '🔴 Red Risks',    value: redCount,   color: 'text-danger',  bg: 'bg-danger/10'  },
            { label: '🟡 Amber Risks',  value: amberCount, color: 'text-warn',    bg: 'bg-warn/10'    },
            { label: '🟢 Green Risks',  value: greenCount, color: 'text-accent3', bg: 'bg-accent3/10' },
            { label: '⚠️ Open Issues',  value: issueCount, color: 'text-accent',  bg: 'bg-accent/10'  },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-border`}>
              <p className="text-xs text-muted font-mono-code mb-1">{s.label}</p>
              <p className={`font-syne font-black text-2xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface2 rounded-xl mx-6 mb-4 shrink-0">
          {(['risk', 'issue'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                ${activeTab === tab ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
              {tab === 'risk' ? '🛡️ Risk Register' : '⚠️ Issue Register'}
              <span className="ml-2 text-xs font-mono-code opacity-60">
                ({risks.filter(r => r.type === tab).length})
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 min-h-0 px-6">
          {loading ? (
            <div className="text-center py-10 text-muted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">{activeTab === 'risk' ? '🛡️' : '⚠️'}</p>
              <p className="text-muted">No {activeTab}s added yet.</p>
              <button onClick={() => { setEditingRisk(null); setForm({ ...emptyForm, type: activeTab }); setShowForm(true) }}
                className="btn-primary mt-4 px-6 py-2 text-sm">
                + Add First {activeTab === 'risk' ? 'Risk' : 'Issue'}
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface2 border-b border-border">
                <tr>
                  {['#', 'Title', 'RAG', 'Probability', 'Impact', 'Owner', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-syne font-bold text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(risk => (
                  <tr key={risk.id} className="border-b border-border/40 hover:bg-surface2/30 transition-colors">
                    <td className="px-3 py-3 text-xs font-mono-code text-muted whitespace-nowrap">{risk.risk_number}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-sm">{risk.title}</p>
                      <p className="text-xs text-muted truncate max-w-[200px]">{risk.description}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold border
                        ${RAG[risk.rag_status].bg} ${RAG[risk.rag_status].text} ${RAG[risk.rag_status].border}`}>
                        <span className={`w-2 h-2 rounded-full ${RAG[risk.rag_status].dot}`}/>
                        {RAG[risk.rag_status].label}
                      </span>
                    </td>
                    <td className={`px-3 py-3 text-xs font-semibold capitalize ${PROB_IMPACT[risk.probability].color}`}>
                      {risk.probability}
                    </td>
                    <td className={`px-3 py-3 text-xs font-semibold capitalize ${PROB_IMPACT[risk.impact].color}`}>
                      {risk.impact}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">{risk.owner || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg font-semibold capitalize ${STATUS_COLORS[risk.status]}`}>
                        {risk.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewingRisk(risk)}
                          className="text-xs text-accent hover:text-accent/80 font-semibold">View</button>
                        <button onClick={() => openEdit(risk)}
                          className="text-xs text-muted hover:text-text font-semibold">Edit</button>
                        <button onClick={() => deleteRisk(risk.id)}
                          className="text-xs text-danger/60 hover:text-danger font-semibold">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border shrink-0">
          <p className="text-xs text-muted font-mono-code">
            {risks.length} total · {risks.filter(r => r.status === 'open').length} open · Generated by NexPlan
          </p>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
              <h3 className="font-syne font-black text-xl">
                {editingRisk ? 'Edit' : 'New'} {form.type === 'risk' ? '🛡️ Risk' : '⚠️ Issue'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-text text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2">
                {(['risk', 'issue'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize border
                      ${form.type === t ? 'bg-warn/10 border-warn/40 text-warn' : 'bg-surface2 border-border text-muted hover:text-text'}`}>
                    {t === 'risk' ? '🛡️ Risk' : '⚠️ Issue'}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">
                  Title <span className="text-danger">*</span>
                </label>
                <input className="input" placeholder={`Brief ${form.type} title...`}
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea className="input min-h-[80px] resize-none" placeholder={`Describe the ${form.type} in detail...`}
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
              </div>

              {/* RAG / Probability / Impact */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">RAG Status</label>
                  <div className="flex flex-col gap-1.5">
                    {(['red','amber','green'] as const).map(r => (
                      <button key={r} onClick={() => setForm(f => ({ ...f, rag_status: r }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all
                          ${form.rag_status === r
                            ? `${RAG[r].bg} ${RAG[r].text} ${RAG[r].border}`
                            : 'bg-surface2 border-border text-muted hover:border-border/80'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${RAG[r].dot}`}/>
                        {RAG[r].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Probability</label>
                  <div className="flex flex-col gap-1.5">
                    {(['low','medium','high'] as const).map(p => (
                      <button key={p} onClick={() => setForm(f => ({ ...f, probability: p }))}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border capitalize transition-all
                          ${form.probability === p ? `${PROB_IMPACT[p].color} bg-surface border-border` : 'bg-surface2 border-border text-muted hover:text-text'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Impact</label>
                  <div className="flex flex-col gap-1.5">
                    {(['low','medium','high'] as const).map(i => (
                      <button key={i} onClick={() => setForm(f => ({ ...f, impact: i }))}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border capitalize transition-all
                          ${form.impact === i ? `${PROB_IMPACT[i].color} bg-surface border-border` : 'bg-surface2 border-border text-muted hover:text-text'}`}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mitigation Plan */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-syne font-semibold text-muted">Mitigation Plan</label>
                  <button onClick={generateAIMitigation} disabled={aiLoading || !form.title || !form.description}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-accent2/10 border border-accent2/30 text-accent2 rounded-lg hover:bg-accent2/20 transition-colors disabled:opacity-40 font-semibold">
                    {aiLoading ? '⏳ Generating...' : '✨ AI Suggest'}
                  </button>
                </div>
                <textarea className="input min-h-[80px] resize-none"
                  placeholder="How will this risk/issue be mitigated or resolved?"
                  value={form.mitigation_plan}
                  onChange={e => setForm(f => ({ ...f, mitigation_plan: e.target.value }))}/>
              </div>

              {/* Owner / Status / Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Owner</label>
                  <input className="input" placeholder="Who owns this risk?"
                    value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}/>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Status</label>
                  <select className="select" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                    <option value="open">Open</option>
                    <option value="mitigated">Mitigated</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Raised Date</label>
                  <input type="date" className="input" value={form.raised_date}
                    onChange={e => setForm(f => ({ ...f, raised_date: e.target.value }))}/>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Review Date</label>
                  <input type="date" className="input" value={form.review_date}
                    onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))}/>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => { setShowForm(false); setEditingRisk(null); setForm(emptyForm) }}
                className="btn-ghost flex-1 py-2.5">Cancel</button>
              <button onClick={saveRisk} disabled={saving || !form.title || !form.description}
                className="btn-primary flex-1 py-2.5 disabled:opacity-40">
                {saving ? 'Saving...' : editingRisk ? 'Update' : `Add ${form.type === 'risk' ? 'Risk' : 'Issue'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Risk Detail Modal */}
      {viewingRisk && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
          onClick={() => setViewingRisk(null)}>
          <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
              <div>
                <p className="font-mono-code text-xs text-muted mb-1">{viewingRisk.risk_number}</p>
                <h3 className="font-syne font-black text-xl">{viewingRisk.title}</h3>
              </div>
              <button onClick={() => setViewingRisk(null)} className="text-muted hover:text-text text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border
                  ${RAG[viewingRisk.rag_status].bg} ${RAG[viewingRisk.rag_status].text} ${RAG[viewingRisk.rag_status].border}`}>
                  <span className={`w-2 h-2 rounded-full ${RAG[viewingRisk.rag_status].dot}`}/>
                  {RAG[viewingRisk.rag_status].label}
                </span>
                <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold capitalize ${STATUS_COLORS[viewingRisk.status]}`}>
                  {viewingRisk.status}
                </span>
                <span className="text-xs bg-surface2 px-3 py-1.5 rounded-lg text-muted">
                  P: <span className={`font-semibold ${PROB_IMPACT[viewingRisk.probability].color}`}>{viewingRisk.probability}</span>
                </span>
                <span className="text-xs bg-surface2 px-3 py-1.5 rounded-lg text-muted">
                  I: <span className={`font-semibold ${PROB_IMPACT[viewingRisk.impact].color}`}>{viewingRisk.impact}</span>
                </span>
              </div>

              <div>
                <p className="text-xs font-syne font-semibold text-muted mb-1">Description</p>
                <p className="text-sm text-text/80 bg-surface2 rounded-xl p-3">{viewingRisk.description}</p>
              </div>

              {viewingRisk.mitigation_plan && (
                <div>
                  <p className="text-xs font-syne font-semibold text-muted mb-1">Mitigation Plan</p>
                  <p className="text-sm text-text/80 bg-surface2 rounded-xl p-3">{viewingRisk.mitigation_plan}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                {viewingRisk.owner && (
                  <div className="bg-surface2 rounded-xl p-3">
                    <p className="text-muted mb-0.5">Owner</p>
                    <p className="font-semibold">{viewingRisk.owner}</p>
                  </div>
                )}
                {viewingRisk.raised_date && (
                  <div className="bg-surface2 rounded-xl p-3">
                    <p className="text-muted mb-0.5">Raised</p>
                    <p className="font-semibold">{new Date(viewingRisk.raised_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</p>
                  </div>
                )}
                {viewingRisk.review_date && (
                  <div className="bg-surface2 rounded-xl p-3">
                    <p className="text-muted mb-0.5">Review Date</p>
                    <p className="font-semibold">{new Date(viewingRisk.review_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => { openEdit(viewingRisk) }} className="btn-ghost flex-1 py-2">Edit</button>
              <button onClick={() => setViewingRisk(null)} className="btn-primary flex-1 py-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
