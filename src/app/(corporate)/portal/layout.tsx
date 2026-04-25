/**
 * src/app/(corporate)/layout.tsx
 *
 * Layout for the corporate subdomain ONLY.
 * Authenticates via Supabase, then checks the email domain against the whitelist.
 * If either check fails → redirect to /login.
 *
 * The /login page itself OPTS OUT of this layout via its own page-level redirect.
 */

import type { ReactNode } from 'react'
import type { Metadata }  from 'next'

export const metadata: Metadata = {
  title:       'Corporate · Nexplan',
  description: 'Manage your enterprise developer resources, licenses, and deployment assets.',
  robots:      'noindex, nofollow',  // private portal — keep out of search
}

export default function CorporateLayout({ children }: { children: ReactNode }) {
  // The auth gate lives in (corporate)/portal/layout.tsx so /login can be public.
  // This top layout just sets metadata + base font/styles.
  return (
    <div className="min-h-screen bg-[#FAFAFB] text-slate-900 antialiased">
      {children}
    </div>
  )
}
