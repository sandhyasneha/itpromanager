import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Merge auth metadata into profile for OAuth users
  const mergedProfile = {
    ...profile,
    full_name: profile?.full_name
      ?? user.user_metadata?.full_name
      ?? user.user_metadata?.name
      ?? user.email?.split('@')[0]
      ?? 'User',
    email: profile?.email ?? user.email,
    role: profile?.role ?? user.user_metadata?.role ?? 'IT Project Manager',
    country: profile?.country ?? user.user_metadata?.country ?? 'Not set',
  }

  // Phase 6 — Log login event once per day per user
  // Uses service role client to bypass RLS and guarantee the write
  try {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentLogin } = await serviceClient
      .from('audit_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('action_type', 'login')
      .gte('created_at', oneDayAgo)
      .limit(1)
      .maybeSingle()

    if (!recentLogin) {
      const { error } = await serviceClient.from('audit_logs').insert({
        user_id:         user.id,
        user_email:      mergedProfile.email ?? user.email ?? 'unknown',
        user_name:       mergedProfile.full_name ?? 'unknown',
        action_type:     'login',
        feature:         'auth',
        model:           null,
        prompt_summary:  null,
        response_status: 'ok',
        error_code:      null,
        error_message:   null,
        duration_ms:     null,
        project_id:      null,
        project_name:    null,
        metadata: {
          role:    mergedProfile.role,
          country: mergedProfile.country,
        },
      })
      if (error) console.error('[audit] login insert failed:', error.message)
    }
  } catch (e) {
    console.error('[audit] login error:', e)
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar profile={mergedProfile} />
      <div className="flex-1 flex flex-col ml-[240px]">
        <Topbar profile={mergedProfile} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
