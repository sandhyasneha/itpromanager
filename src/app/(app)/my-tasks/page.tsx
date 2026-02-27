import { createClient } from '@/lib/supabase/server'
import MyTasksBoard from '@/components/MyTasksBoard'

export default async function MyTasksPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const email = profile?.email || user?.email || ''

  // Load tasks assigned to this user's email
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, projects(id, name, color, start_date, end_date)')
    .eq('assignee_email', email)
    .order('due_date', { ascending: true })

  return (
    <MyTasksBoard
      tasks={tasks || []}
      userEmail={email}
      userName={profile?.full_name || email}
    />
  )
}
