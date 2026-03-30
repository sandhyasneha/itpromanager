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

  // Fetch tasks assigned to logged-in user with project info
  const { data: tasks, error } = await supabase
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
      updated_at,
      project_id,
      assignee_id,
      projects (
        id,
        name
      )
    `
    )
    .eq("assignee_id", user.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching tasks:", error);
  }

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
      tasks={tasks ?? []}
      profile={profile}
      projects={projects ?? []}
      userId={user.id}
    />
  );
}
