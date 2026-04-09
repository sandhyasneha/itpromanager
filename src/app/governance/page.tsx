/**
 * src/app/governance/page.tsx
 * Fetches all data directly using service role — no intermediate API route needed.
 */

import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient }                from "@/lib/supabase/server";
import { redirect }                    from "next/navigation";
import GovernanceDashboard             from "./GovernanceDashboard";
import type { Metadata }               from "next";

export const metadata: Metadata = {
  title: "CIO Governance Dashboard | NexPlan",
  description: "Workspace-level IT project governance for CIOs.",
};

export default async function GovernancePage() {
  // Auth check
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Use service role to bypass RLS
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [
    { data: workspaces },
    { data: projects },
    { data: tasks },
    { data: risks },
    { data: milestones },
  ] = await Promise.all([
    admin.from("workspaces").select("id, name, created_at").order("created_at"),
    admin.from("projects").select("id, name, status, progress, budget_total, end_date, scope, workspace_id").order("created_at"),
    admin.from("tasks").select("id, project_id, status, priority, due_date"),
    admin.from("risk_register").select("id, project_id, likelihood, impact, status"),
    admin.from("milestones").select("id, project_id, name, due_date, status").order("due_date"),
  ]);

  return (
    <GovernanceDashboard
      workspaces={workspaces ?? []}
      projects={projects   ?? []}
      tasks={tasks         ?? []}
      risks={risks         ?? []}
      milestones={milestones ?? []}
    />
  );
}
