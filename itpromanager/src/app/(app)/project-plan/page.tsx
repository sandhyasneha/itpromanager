import { createClient } from '@/lib/supabase/server'
import ProjectPlanClient from '@/components/ProjectPlanClient'

export default async function ProjectPlanPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  const projectList = projects ?? []
  let tasks: any[] = []

  if (projectList.length > 0) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .in('project_id', projectList.map((p: any) => p.id))
      .order('position', { ascending: true })
    tasks = data ?? []
  }

  return <ProjectPlanClient projects={projectList} tasks={tasks} />
}
