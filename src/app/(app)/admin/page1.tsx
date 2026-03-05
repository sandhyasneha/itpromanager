import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AdminClient from '@/components/AdminClient'

const ADMIN_EMAIL = 'admin@nexplan.io'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) redirect('/dashboard')

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: profiles },
    { data: projects },
    { data: tasks },
    { data: articles },
    { data: feedback },
  ] = await Promise.all([
    adminClient.from('profiles').select('*').order('created_at', { ascending: false }),
    adminClient.from('projects').select('*'),
    adminClient.from('tasks').select('*'),
    adminClient.from('kb_articles').select('*'),
    adminClient.from('feedback').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <AdminClient
      profiles={profiles ?? []}
      projects={projects ?? []}
      tasks={tasks ?? []}
      articles={articles ?? []}
      feedback={feedback ?? []}
    />
  )
}
