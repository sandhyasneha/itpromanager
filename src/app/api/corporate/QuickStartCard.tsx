'use client'

import { useEffect, useState } from 'react'
import Link                    from 'next/link'

interface OnboardingStep {
  id:    string
  label: string
  hint:  string
  done:  boolean
}

interface OnboardingState {
  steps:    OnboardingStep[]
  all_done: boolean
}

const STEP_CTA: Record<string, { label: string; href: string; scrollTo?: string }> = {
  licence_generated: {
    label:    'Generate now',
    href:     '#product-licence',
    scrollTo: 'product-licence',
  },
  assets_downloaded: {
    label:    'Download files',
    href:     '#deployment-assets',
    scrollTo: 'deployment-assets',
  },
  licence_validated: {
    label:    'Setup guide',
    href:     '/portal/setup-guide',
  },
}

export function QuickStartCard() {
  const [state,   setState]   = useState<OnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [hidden,  setHidden]  = useState(false)

  useEffect(() => {
    fetch('/api/corporate/onboarding')
      .then(r => r.json())
      .then((data: OnboardingState) => {
        setState(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading)         return null
  if (!state)          return null
  if (state.all_done)  return null
  if (hidden)          return null

  const completedCount = state.steps.filter(s => s.done).length
  const totalCount     = state.steps.length
  const progressPct    = (completedCount / totalCount) * 100

  function handleStepClick(stepId: string) {
    const cta = STEP_CTA[stepId]
    if (!cta) return
    if (cta.scrollTo) {
      const el = document.getElementById(cta.scrollTo)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Pulse it briefly
        el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2')
        setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2'), 2000)
      }
    } else {
      window.location.href = cta.href
    }
  }

  return (
    <div className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50/30 rounded-2xl border border-indigo-100 p-5 mb-2 overflow-hidden">

      {/* Decorative gradient blob */}
      <div
        aria-hidden
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)' }}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M5 12 3 17l5-2 5-5-3-3z"/>
              <path d="m9 9 3 3"/>
              <path d="M21 3 14 10"/>
            </svg>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900 leading-tight">
              Get NexPlan running in 3 steps
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {completedCount} of {totalCount} complete · ~15 minutes total
            </p>
          </div>
        </div>
        <button
          onClick={() => setHidden(true)}
          className="text-slate-300 hover:text-slate-500 transition-colors p-1 -m-1"
          title="Hide for now"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="relative mb-4 h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="relative space-y-2">
        {state.steps.map((step, i) => {
          const cta = STEP_CTA[step.id]
          return (
            <div
              key={step.id}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all
                ${step.done
                  ? 'bg-emerald-50/60 border border-emerald-100'
                  : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm'}
              `}
            >
              {/* Step number / check */}
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px] font-semibold
                ${step.done
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'}
              `}>
                {step.done ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  i + 1
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-semibold ${step.done ? 'text-slate-500 line-through decoration-emerald-400/60' : 'text-slate-900'}`}>
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {step.hint}
                </div>
              </div>

              {/* Action button */}
              {!step.done && cta && (
                <button
                  onClick={() => handleStepClick(step.id)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  {cta.label} →
                </button>
              )}
              {step.done && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 shrink-0">
                  Done
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Help footer */}
      <div className="relative mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          Stuck? Read the{' '}
          <Link href="/portal/setup-guide" className="text-indigo-600 hover:underline font-medium">
            full setup guide
          </Link>
          {' '}or email{' '}
          <a href="mailto:corporate@nexplan.io" className="text-indigo-600 hover:underline font-medium">
            corporate@nexplan.io
          </a>
        </p>
      </div>
    </div>
  )
}
