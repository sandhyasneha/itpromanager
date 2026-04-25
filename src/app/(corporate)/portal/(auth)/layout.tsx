/**
 * src/app/(corporate)/portal/(auth)/layout.tsx
 *
 * Auth gate + sidebar/topbar shell for authenticated portal pages.
 * Anything inside /portal/(auth)/* requires a valid corp_email cookie
 * matching a whitelisted domain.
 *
 * The (auth) route group does NOT add to the URL — pages here resolve to
 * /portal, /portal/licenses, /portal/downloads, etc.
 *
 * Login lives at /portal/login (outside this group) so it doesn't render
 * the sidebar.
 */

import type { ReactNode } from 'react'
import { cookies }        from 'next/headers'
import { redirect }       from 'next/navigation'
import { findWorkspaceByEmail } from '@/lib/corporate/whitelist'
import { CorporateSidebar }     from '@/components/corporate/CorporateSidebar'
import { CorporateTopbar }      from '@/components/corporate/CorporateTopbar'

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const email       = cookieStore.get('corp_email')?.value
  const workspace   = findWorkspaceByEmail(email)

  if (!workspace) redirect('/portal/login')

  const localPart   = (email ?? '').split('@')[0]
  const firstName   = localPart.split(/[._-]/)[0]
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  return (
    <div className="min-h-screen flex bg-[#FAFAFB]">
      <CorporateSidebar workspace={workspace} userEmail={email!} userName={displayName} />
      <div className="flex-1 flex flex-col min-w-0">
        <CorporateTopbar workspace={workspace} />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
