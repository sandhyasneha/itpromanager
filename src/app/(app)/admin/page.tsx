import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from '@/components/AdminClient'

const ADMIN_EMAIL = 'admin@nexplan.io'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) redirect('/dashboard')

  const [
    { data: profiles },
    { data: projects },
    { data: tasks },
    { data: articles },
    { data: feedback },
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('projects').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('kb_articles').select('*'),
    supabase.from('feedback').select('*').order('created_at', { ascending: false }),
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
