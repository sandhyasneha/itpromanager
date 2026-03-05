'use client'
// ============================================================
// src/components/UpgradePrompt.tsx
// NEW FILE — Shown as overlay when free user clicks a Pro feature
// Usage:
//   import { useUpgradePrompt, UpgradePromptModal } from '@/components/UpgradePrompt'
//   const { showUpgrade, UpgradeModal } = useUpgradePrompt()
//   ...
//   if (!canAccess(userPlan, 'ai_project_plan')) { showUpgrade('ai_project_plan'); return }
//   ...
//   <UpgradeModal />
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { FEATURE_DEFS, PLAN_PRICING, type FeatureKey } from '@/lib/planConfig'

interface UpgradePromptProps {
  feature:  FeatureKey | null
  onClose:  () => void
}

export function UpgradePromptModal({ feature, onClose }: UpgradePromptProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  if (!feature) return null

  const def = FEATURE_DEFS.find(f => f.key === feature)
  const price = billing === 'monthly' ? PLAN_PRICING.pro.monthly : PLAN_PRICING.pro.yearly
  const period = billing === 'monthly' ? '/month' : '/year'
  const saving = billing === 'yearly' ? 'Save $10 vs monthly' : ''

  const PRO_FEATURES = FEATURE_DEFS.filter(f =>
    ['ai_project_plan','ai_status_report','pcr_document','ai_followup','comments_activity','support_tickets'].includes(f.key)
  )

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono-code text-accent2 uppercase tracking-widest">⚡ Pro Feature</span>
            <button onClick={onClose} className="text-muted hover:text-text text-lg">✕</button>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{def?.icon ?? '🔒'}</span>
            <div>
              <h3 className="font-syne font-black text-xl">{def?.label ?? 'Pro Feature'}</h3>
              <p className="text-xs text-muted">{def?.description}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Billing toggle */}
          <div className="flex gap-1 p-1 bg-surface2 rounded-xl">
            {(['monthly','yearly'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize
                  ${billing === b ? 'bg-accent2 text-black shadow' : 'text-muted hover:text-text'}`}>
                {b}
                {b === 'yearly' && <span className="ml-1 text-[9px] opacity-80">(-17%)</span>}
              </button>
            ))}
          </div>

          {/* Price */}
          <div className="text-center py-2">
            <div className="flex items-end justify-center gap-1">
              <span className="font-syne font-black text-5xl text-accent2">${price}</span>
              <span className="text-muted text-sm mb-2">{period}</span>
            </div>
            {saving && (
              <p className="text-xs text-accent3 font-semibold mt-1">🎉 {saving}</p>
            )}
          </div>

          {/* Pro features list */}
          <div className="space-y-2">
            <p className="text-xs font-syne font-semibold text-muted uppercase tracking-wide">Everything in Pro:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRO_FEATURES.map(f => (
                <div key={f.key} className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg
                  ${f.key === feature ? 'bg-accent2/10 border border-accent2/30 text-accent2 font-semibold' : 'text-muted'}`}>
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link href="/pricing"
            className="btn-primary w-full py-3 text-sm text-center block font-bold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #00d4ff)' }}
            onClick={onClose}>
            Upgrade to Pro — ${price}{period} →
          </Link>

          <p className="text-[10px] text-muted text-center">
            Cancel anytime · Instant access · No hidden fees
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Hook for easy usage anywhere ─────────────────────────────
export function useUpgradePrompt() {
  const [upgradeFeature, setUpgradeFeature] = useState<FeatureKey | null>(null)

  function showUpgrade(feature: FeatureKey) {
    setUpgradeFeature(feature)
  }

  function closeUpgrade() {
    setUpgradeFeature(null)
  }

  const UpgradeModal = () => (
    <UpgradePromptModal feature={upgradeFeature} onClose={closeUpgrade} />
  )

  return { showUpgrade, closeUpgrade, UpgradeModal, upgradeFeature }
}

// ── Lock badge — show on feature buttons that are locked ─────
export function LockBadge({ plan = 'Pro' }: { plan?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono-code font-bold
      text-accent2 bg-accent2/10 border border-accent2/30 px-1.5 py-0.5 rounded-md ml-1.5">
      🔒 {plan}
    </span>
  )
}
