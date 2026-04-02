import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MyTasksClient from "./MyTasksClient";

export const metadata = {
  title: "My Tasks — NexPlan",
};

export default async function MyTasksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const userEmail = user.email ?? '';

  // Fetch tasks assigned to logged-in user with project info
  const { data: rawTasks, error } = await supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      description,
      status,
      priority,
      due_date,
      created_at,
      project_id,
      assignee_id,
      assignee_email,
      assignee_name,
      projects (
        id,
        name
      )
    `
    )
    .eq("assignee_email", userEmail)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching tasks:", error);
  }

  // Normalize projects from array to single object
  const tasks = (rawTasks ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    description: t.description as string | null,
    status: t.status as string,
    priority: t.priority as string,
    due_date: t.due_date as string | null,
    created_at: t.created_at as string,
    project_id: t.project_id as string | null,
    assignee_id: t.assignee_id as string | null,
    projects: Array.isArray(t.projects)
      ? (t.projects[0] as { id: string; name: string } | null) ?? null
      : (t.projects as { id: string; name: string } | null) ?? null,
  }));

  // Fetch user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Fetch projects for filter dropdown
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  return (
    <MyTasksClient
      tasks={tasks}
      profile={profile}
      projects={projects ?? []}
      userId={user.id}
    />
  );
}
