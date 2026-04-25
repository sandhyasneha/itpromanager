/**
 * src/app/(corporate)/portal/(auth)/page.tsx
 *
 * Overview / dashboard page — matches mockup 2.
 */

import { cookies } from 'next/headers'
import { findWorkspaceByEmail } from '@/lib/corporate/whitelist'
import { LicenseStatusCard }    from '@/components/corporate/LicenseStatusCard'
import { ProductLicenseCard }   from '@/components/corporate/ProductLicenseCard'
import { DeveloperAssetsCard }  from '@/components/corporate/DeveloperAssetsCard'
import { ActivityLog }          from '@/components/corporate/ActivityLog'
import type { ActivityEvent }   from '@/components/corporate/ActivityLog'

export default async function PortalOverviewPage() {
  const cookieStore = await cookies()
  const email       = cookieStore.get('corp_email')?.value
  const workspace   = findWorkspaceByEmail(email)!

  const localPart  = (email ?? '').split('@')[0]
  const firstName  = (localPart.split(/[._-]/)[0] || 'there')
  const display    = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  // ── Mock activity feed (last 6 events) ────────────────────────────────
  // The `as const` assertion tells TypeScript these strings are the literal
  // values in ActivityEvent['icon'], not just generic strings.
  const activity: ActivityEvent[] = [
    { icon: 'eye',      action: 'License key viewed',     detail: 'Masked display in dashboard',                ts: 'Feb 18, 2026 · 09:42 AM' },
    { icon: 'download', action: 'Dockerfile downloaded',  detail: 'nexplan.Dockerfile.txt',                     ts: 'Feb 17, 2026 · 04:18 PM' },
    { icon: 'shield',   action: 'License rotated',        detail: 'Previous key revoked by ada@nexplan.io',     ts: 'Feb 14, 2026 · 11:05 AM' },
    { icon: 'user',     action: 'Member invited',         detail: 'maya@acme.com (developer role)',             ts: 'Feb 12, 2026 · 02:27 PM' },
    { icon: 'check',    action: 'Entitlements synced',    detail: 'All checks passed',                          ts: 'Feb 11, 2026 · 09:00 AM' },
    { icon: 'key',      action: 'API token issued',       detail: 'CI/CD deployment pipeline',                  ts: 'Feb 09, 2026 · 03:12 PM' },
  ]

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">

      {/* ── Welcome header ────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400 mb-1">
          Overview
        </p>
        <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
          Welcome back, {display}.
        </h1>
        <p className="text-[13px] text-slate-500 mt-1.5">
          Your enterprise license is active. Manage your developer assets and credentials below.
        </p>
      </div>

      {/* ── License status + 4 KPIs ───────────────────────────────────── */}
      <LicenseStatusCard workspace={workspace} />

      {/* ── License key + Developer assets, side by side ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProductLicenseCard  workspace={workspace} />
        <DeveloperAssetsCard workspace={workspace} />
      </div>

      {/* ── Activity log ──────────────────────────────────────────────── */}
      <ActivityLog events={activity} />
    </div>
  )
}
