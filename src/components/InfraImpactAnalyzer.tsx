'use client'
import { useState } from 'react'
import type { Task, TaskStatus, Project } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

type AffectedCI = {
  name: string
  type: string
  impact: string
}

type RiskItem = {
  risk: string
  level: RiskLevel
  mitigation: string
}

type AnalysisResult = {
  summary: string
  changeType: string
  affectedCIs: AffectedCI[]
  risks: RiskItem[]
  justification: string
  implementationPlan: string[]
  preTestPlan: string[]
  postTestPlan: string[]
  backoutPlan: string[]
  stakeholders: string[]
  estimatedDuration: string
  suggestedTasks: { title: string; priority: string; description: string }[]
  serviceNowFields: {
    category: string
    impact: string
    urgency: string
    risk: string
    changeType: string
  }
}

const RISK_COLORS: Record<RiskLevel, string> = {
  critical: 'text-danger bg-danger/10 border-danger/30',
  high:     'text-warn bg-warn/10 border-warn/30',
  medium:   'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  low:      'text-accent3 bg-accent3/10 border-accent3/30',
}

const RISK_DOT: Record<RiskLevel, string> = {
  critical: 'bg-danger',
  high:     'bg-warn',
  medium:   'bg-yellow-500',
  low:      'bg-accent3',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InfraImpactAnalyzer({
  project,
  onImportTasks,
  onClose,
  userPlan = 'free',
  analysisCount = 0,
}: {
  project: Project | null
  onImportTasks: (tasks: { title: string; priority: string; description: string }[]) => void
  onClose: () => void
  userPlan?: 'free' | 'pro' | 'enterprise'
  analysisCount?: number
}) {
  const [step, setStep] = useState<'input' | 'analyzing' | 'result'>('input')
  const [description, setDescription] = useState('')
  const [serviceNowChange, setServiceNowChange] = useState('')
  const [changeDate, setChangeDate] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [importedTasks, setImportedTasks] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'implementation' | 'testing' | 'backout' | 'servicenow'>('overview')

  const FREE_LIMIT = 3
  const isLimitReached = userPlan === 'free' && analysisCount >= FREE_LIMIT

  async function runAnalysis() {
    if (!description.trim()) { setError('Please describe the infrastructure change'); return }
    if (isLimitReached) { setError('Free plan limit reached. Upgrade to Pro for unlimited analyses.'); return }
    setError('')
    setStep('analyzing')

    try {
      const systemPrompt = `You are an expert IT Infrastructure Change Manager with deep knowledge of ITIL, ITSM, network engineering, cloud infrastructure, and enterprise IT operations.

Analyse the infrastructure change described and produce a comprehensive impact analysis. Return ONLY valid JSON matching this exact structure:
{
  "summary": "2-3 sentence executive summary",
  "changeType": "Standard|Normal|Emergency",
  "affectedCIs": [{"name": "CI name", "type": "Server|Network|Application|Database|Storage|Cloud", "impact": "Direct|Indirect|Dependency"}],
  "risks": [{"risk": "Risk description", "level": "critical|high|medium|low", "mitigation": "Mitigation action"}],
  "justification": "Business and technical justification for this change",
  "implementationPlan": ["Step 1", "Step 2", "..."],
  "preTestPlan": ["Pre-implementation test 1", "..."],
  "postTestPlan": ["Post-implementation test 1", "..."],
  "backoutPlan": ["Backout step 1", "..."],
  "stakeholders": ["Role/Team to notify"],
  "estimatedDuration": "e.g. 4-6 weeks",
  "suggestedTasks": [{"title": "Task title", "priority": "low|medium|high|critical", "description": "Task description"}],
  "serviceNowFields": {"category": "Infrastructure", "impact": "1-High|2-Medium|3-Low", "urgency": "1-High|2-Medium|3-Low", "risk": "High|Moderate|Low|Very Low", "changeType": "Standard|Normal|Emergency"}
}

Generate 5-8 affected CIs, 4-6 risks, 6-10 implementation steps, 4-6 pre-tests, 4-6 post-tests, 4-6 backout steps, and 8-12 suggested tasks.`

      const userMessage = `Project: ${project?.name ?? 'Unknown'}
Change Description: ${description}
${serviceNowChange ? `ServiceNow Change Number: ${serviceNowChange}` : ''}
${changeDate ? `Planned Change Date: ${changeDate}` : ''}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      const data = await res.json()
      const text = data.content?.[0]?.text ?? ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid response')
      const parsed: AnalysisResult = JSON.parse(jsonMatch[0])
      setResult(parsed)
      setStep('result')
    } catch (e) {
      console.error(e)
      setError('Analysis failed. Please try again.')
      setStep('input')
    }
  }

  function handleImportTasks() {
    if (!result) return
    onImportTasks(result.suggestedTasks)
    setImportedTasks(true)
  }

  function handleDownloadPDF() {
    if (!result) return
    const content = generateReportText(result, project, description, serviceNowChange, changeDate)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(project?.name ?? 'project').replace(/\s+/g, '-')}-Impact-Analysis.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="card w-full max-w-4xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-lg">
              🔍
            </div>
            <div>
              <h2 className="font-syne font-black text-lg">Infra Impact Analyzer</h2>
              <p className="text-xs text-muted">
                {project?.name ?? 'No project selected'} 
                {userPlan === 'free' && (
                  <span className="ml-2 text-warn">· {FREE_LIMIT - analysisCount} analyses remaining (Free)</span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── INPUT STEP ── */}
          {step === 'input' && (
            <div className="p-5 space-y-5">
              {isLimitReached && (
                <div className="p-4 bg-warn/10 border border-warn/30 rounded-xl">
                  <p className="text-warn text-sm font-semibold">⚠️ Free plan limit reached ({FREE_LIMIT} analyses/month)</p>
                  <p className="text-muted text-xs mt-1">Upgrade to Pro for unlimited infrastructure impact analyses.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-2">
                  Describe the Infrastructure Change *
                </label>
                <textarea
                  className="input resize-none h-36 text-sm"
                  placeholder="e.g. Decommission ESX cluster in London DC — 12 VMs running finance and HR applications, migrating workloads to Azure. Includes network reconfiguration and DNS updates."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={isLimitReached}
                />
                <p className="text-xs text-muted mt-1">Be specific — include systems, locations, applications affected, and scope of change.</p>
              </div>

              {/* Optional fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-2">
                    ServiceNow Change Number <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <input
                    className="input text-sm"
                    placeholder="e.g. CHG0012345"
                    value={serviceNowChange}
                    onChange={e => setServiceNowChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-2">
                    Planned Change Date <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    className="input text-sm"
                    value={changeDate}
                    onChange={e => setChangeDate(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}

              {/* Examples */}
              <div className="bg-surface2 rounded-xl p-4">
                <p className="text-xs font-syne font-semibold text-muted mb-2">Example change descriptions:</p>
                <div className="space-y-1.5">
                  {[
                    'Upgrade Cisco core switches from IOS 15.x to 17.x across 3 sites — affects 200 users',
                    'Migrate on-premise SQL Server databases to Azure SQL — 5 databases, finance and CRM systems',
                    'Deploy new Palo Alto firewall replacing legacy ASA — includes rule migration and VPN reconfiguration',
                  ].map((ex, i) => (
                    <button key={i} onClick={() => setDescription(ex)}
                      className="w-full text-left text-xs text-muted hover:text-accent px-3 py-2 bg-surface rounded-lg hover:bg-accent/5 transition-colors">
                      → {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
                <button
                  onClick={runAnalysis}
                  disabled={!description.trim() || isLimitReached}
                  className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
                >
                  🔍 Run Impact Analysis
                </button>
              </div>
            </div>
          )}

          {/* ── ANALYZING STEP ── */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-3xl mb-6 animate-pulse">
                🔍
              </div>
              <h3 className="font-syne font-black text-xl mb-2">Analysing Infrastructure Change...</h3>
              <p className="text-muted text-sm max-w-md">
                AI is identifying affected systems, assessing risks, building implementation plan and generating tasks.
              </p>
              <div className="mt-8 space-y-2 text-left w-full max-w-sm">
                {[
                  '🔍 Identifying affected CIs...',
                  '⚠️ Assessing risks...',
                  '📋 Building implementation plan...',
                  '🧪 Creating test plans...',
                  '↩️ Generating backout plan...',
                  '✅ Generating tasks...',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RESULT STEP ── */}
          {step === 'result' && result && (
            <div className="flex flex-col">

              {/* Summary bar */}
              <div className="p-5 bg-accent/5 border-b border-accent/20">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent">
                        {result.changeType} Change
                      </span>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-surface2 border border-border text-muted">
                        ⏱ {result.estimatedDuration}
                      </span>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-surface2 border border-border text-muted">
                        🖥 {result.affectedCIs.length} CIs affected
                      </span>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-surface2 border border-border text-muted">
                        ⚠️ {result.risks.length} risks identified
                      </span>
                    </div>
                    <p className="text-sm text-text/80 leading-relaxed">{result.summary}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border px-5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: '📊 Overview' },
                  { id: 'implementation', label: '📋 Implementation' },
                  { id: 'testing', label: '🧪 Test Plans' },
                  { id: 'backout', label: '↩️ Back-out' },
                  { id: 'servicenow', label: '🔗 ServiceNow' },
                ].map(tab => (
                  <button key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all
                      ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5 space-y-5">

                {/* Overview tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    {/* Affected CIs */}
                    <div>
                      <h3 className="font-syne font-bold text-sm mb-3">🖥 Affected Configuration Items (CIs)</h3>
                      <div className="grid gap-2">
                        {result.affectedCIs.map((ci, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-surface2 rounded-xl border border-border">
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm">
                                {ci.type === 'Server' ? '🖥' : ci.type === 'Network' ? '🌐' : ci.type === 'Application' ? '📱' : ci.type === 'Database' ? '🗄' : ci.type === 'Storage' ? '💾' : '☁️'}
                              </span>
                              <div>
                                <p className="text-sm font-semibold">{ci.name}</p>
                                <p className="text-xs text-muted">{ci.type}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border
                              ${ci.impact === 'Direct' ? 'text-danger bg-danger/10 border-danger/30' :
                                ci.impact === 'Indirect' ? 'text-warn bg-warn/10 border-warn/30' :
                                'text-muted bg-surface border-border'}`}>
                              {ci.impact}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risks */}
                    <div>
                      <h3 className="font-syne font-bold text-sm mb-3">⚠️ Risk Assessment</h3>
                      <div className="space-y-2">
                        {result.risks.map((risk, i) => (
                          <div key={i} className={`p-3 rounded-xl border ${RISK_COLORS[risk.level]}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${RISK_DOT[risk.level]}`} />
                              <span className="text-xs font-bold uppercase">{risk.level}</span>
                            </div>
                            <p className="text-sm font-semibold mb-1">{risk.risk}</p>
                            <p className="text-xs opacity-80">🛡 {risk.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Justification */}
                    <div>
                      <h3 className="font-syne font-bold text-sm mb-2">📝 Justification</h3>
                      <p className="text-sm text-muted leading-relaxed bg-surface2 rounded-xl p-3">{result.justification}</p>
                    </div>

                    {/* Stakeholders */}
                    <div>
                      <h3 className="font-syne font-bold text-sm mb-3">👥 Stakeholders to Notify</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.stakeholders.map((s, i) => (
                          <span key={i} className="text-xs px-3 py-1.5 bg-accent2/10 border border-accent2/20 text-accent2 rounded-full font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Suggested Tasks */}
                    <div>
                      <h3 className="font-syne font-bold text-sm mb-3">✅ Suggested Tasks ({result.suggestedTasks.length})</h3>
                      <div className="space-y-1.5">
                        {result.suggestedTasks.map((task, i) => (
                          <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 bg-surface2 rounded-xl">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0
                              ${task.priority === 'critical' ? 'bg-danger/20 text-danger' :
                                task.priority === 'high' ? 'bg-warn/20 text-warn' :
                                task.priority === 'medium' ? 'bg-accent/20 text-accent' :
                                'bg-muted/20 text-muted'}`}>
                              {task.priority}
                            </span>
                            <div>
                              <p className="text-sm font-semibold">{task.title}</p>
                              <p className="text-xs text-muted">{task.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Implementation tab */}
                {activeTab === 'implementation' && (
                  <div className="space-y-4">
                    <h3 className="font-syne font-bold text-sm">📋 Implementation Plan</h3>
                    <ol className="space-y-2">
                      {result.implementationPlan.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-surface2 rounded-xl">
                          <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Testing tab */}
                {activeTab === 'testing' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-syne font-bold text-sm mb-3">🧪 Pre-Implementation Test Plan</h3>
                      <ol className="space-y-2">
                        {result.preTestPlan.map((test, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 bg-surface2 rounded-xl">
                            <span className="w-6 h-6 rounded-full bg-warn/20 text-warn text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-sm">{test}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <h3 className="font-syne font-bold text-sm mb-3">✅ Post-Implementation Test Plan</h3>
                      <ol className="space-y-2">
                        {result.postTestPlan.map((test, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 bg-surface2 rounded-xl">
                            <span className="w-6 h-6 rounded-full bg-accent3/20 text-accent3 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-sm">{test}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {/* Back-out tab */}
                {activeTab === 'backout' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-danger/5 border border-danger/20 rounded-xl">
                      <p className="text-xs text-danger font-semibold">⚠️ Back-out plan must be tested and approved before change window opens.</p>
                    </div>
                    <h3 className="font-syne font-bold text-sm">↩️ Back-out / Rollback Plan</h3>
                    <ol className="space-y-2">
                      {result.backoutPlan.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-surface2 rounded-xl">
                          <span className="w-6 h-6 rounded-full bg-danger/20 text-danger text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* ServiceNow tab */}
                {activeTab === 'servicenow' && (
                  <div className="space-y-5">
                    <div className="p-4 bg-surface2 rounded-xl border border-border">
                      <h3 className="font-syne font-bold text-sm mb-4">🔗 ServiceNow Change Fields</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Category', value: result.serviceNowFields.category },
                          { label: 'Change Type', value: result.serviceNowFields.changeType },
                          { label: 'Impact', value: result.serviceNowFields.impact },
                          { label: 'Urgency', value: result.serviceNowFields.urgency },
                          { label: 'Risk', value: result.serviceNowFields.risk },
                          { label: 'Change Number', value: serviceNowChange || 'Not provided' },
                          { label: 'Change Date', value: changeDate || 'Not set' },
                          { label: 'Short Description', value: description.slice(0, 60) + '...' },
                        ].map(field => (
                          <div key={field.label} className="bg-surface rounded-xl p-3">
                            <p className="text-xs text-muted mb-1">{field.label}</p>
                            <p className="text-sm font-semibold">{field.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                      <p className="text-sm font-semibold text-accent mb-2">🚀 ServiceNow Integration (Coming Soon)</p>
                      <p className="text-xs text-muted leading-relaxed">
                        Connect your ServiceNow instance to automatically update change records with this analysis.
                        Provide your ServiceNow URL and credentials in Organisation Settings to enable live sync.
                      </p>
                      {serviceNowChange && (
                        <div className="mt-3 p-3 bg-surface rounded-xl">
                          <p className="text-xs text-muted">Change <span className="text-accent font-bold">{serviceNowChange}</span> will be updated when integration is enabled.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step === 'result' && result && (
          <div className="p-4 border-t border-border flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <button onClick={() => { setStep('input'); setResult(null); setImportedTasks(false) }}
              className="btn-ghost text-sm px-4 py-2">
              ← New Analysis
            </button>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-border text-muted hover:text-text hover:border-accent/40 transition-all">
                📄 Download Report
              </button>
              <button
                onClick={handleImportTasks}
                disabled={importedTasks}
                className="btn-primary text-sm px-5 py-2 disabled:opacity-60">
                {importedTasks ? '✅ Tasks Imported' : `📋 Import ${result.suggestedTasks.length} Tasks to Board`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Report text generator ────────────────────────────────────────────────────

function generateReportText(
  result: AnalysisResult,
  project: Project | null,
  description: string,
  serviceNowChange: string,
  changeDate: string
): string {
  const line = '='.repeat(70)
  const divider = '-'.repeat(70)

  return `
INFRASTRUCTURE IMPACT ANALYSIS REPORT
${line}
Generated by NexPlan — nexplan.io
${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} ${new Date().toLocaleTimeString('en-GB')}

PROJECT: ${project?.name ?? 'Unknown'}
CHANGE TYPE: ${result.changeType}
ESTIMATED DURATION: ${result.estimatedDuration}
${serviceNowChange ? `SERVICENOW CHANGE: ${serviceNowChange}` : ''}
${changeDate ? `PLANNED CHANGE DATE: ${changeDate}` : ''}
${line}

CHANGE DESCRIPTION
${divider}
${description}

EXECUTIVE SUMMARY
${divider}
${result.summary}

JUSTIFICATION
${divider}
${result.justification}

AFFECTED CONFIGURATION ITEMS (${result.affectedCIs.length})
${divider}
${result.affectedCIs.map(ci => `• ${ci.name} [${ci.type}] — ${ci.impact} Impact`).join('\n')}

RISK ASSESSMENT (${result.risks.length} risks)
${divider}
${result.risks.map((r, i) => `${i + 1}. [${r.level.toUpperCase()}] ${r.risk}\n   Mitigation: ${r.mitigation}`).join('\n\n')}

IMPLEMENTATION PLAN
${divider}
${result.implementationPlan.map((s, i) => `${i + 1}. ${s}`).join('\n')}

PRE-IMPLEMENTATION TEST PLAN
${divider}
${result.preTestPlan.map((s, i) => `${i + 1}. ${s}`).join('\n')}

POST-IMPLEMENTATION TEST PLAN
${divider}
${result.postTestPlan.map((s, i) => `${i + 1}. ${s}`).join('\n')}

BACK-OUT / ROLLBACK PLAN
${divider}
${result.backoutPlan.map((s, i) => `${i + 1}. ${s}`).join('\n')}

STAKEHOLDERS TO NOTIFY
${divider}
${result.stakeholders.map(s => `• ${s}`).join('\n')}

SERVICENOW FIELDS
${divider}
Category: ${result.serviceNowFields.category}
Change Type: ${result.serviceNowFields.changeType}
Impact: ${result.serviceNowFields.impact}
Urgency: ${result.serviceNowFields.urgency}
Risk: ${result.serviceNowFields.risk}

SUGGESTED TASKS (${result.suggestedTasks.length})
${divider}
${result.suggestedTasks.map((t, i) => `${i + 1}. [${t.priority.toUpperCase()}] ${t.title}\n   ${t.description}`).join('\n\n')}

${line}
NexPlan — AI-Powered IT Project Management
nexplan.io | info@nexplan.io
`.trim()
}
