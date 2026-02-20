import { createClient } from '@/lib/supabase/server'
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
