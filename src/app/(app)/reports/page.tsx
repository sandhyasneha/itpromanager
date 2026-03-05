import { createClient } from "@/lib/supabase/server"
import ReportsClient from "@/components/ReportsClient"

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: projects }, { data: allTasks }, { data: resources }] = await Promise.all([
    supabase.from("projects").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").order("due_date", { ascending: true }),
    supabase.from("resource_availability").select("*").eq("owner_id", user!.id),
  ])

  const projectList = projects ?? []
  const taskList = allTasks ?? []
  const projectIds = new Set(projectList.map((p: any) => p.id))
  const myTasks = taskList.filter((t: any) => projectIds.has(t.project_id))

  return (
    <ReportsClient
      projects={projectList}
      tasks={myTasks}
      resources={resources ?? []}
      userId={user!.id}
    />
  )
}
