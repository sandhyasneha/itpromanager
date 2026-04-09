/**
 * src/app/api/governance/cio-data/route.ts
 *
 * Server-side API route that fetches all CIO dashboard data using
 * the Supabase SERVICE ROLE key — bypasses RLS completely.
 * Only accessible to admin/enterprise users (checked via anon client session).
 */

import { NextResponse }   from "next/server";
import { createClient }   from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET() {
  // 1. Verify the requesting user is authenticated using cookie session
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // 2. Use service role client to bypass RLS and read ALL org data
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 3. Fetch everything in parallel
  const [
    { data: workspaces },
    { data: projects },
    { data: tasks },
    { data: risks },
    { data: milestones },
  ] = await Promise.all([
    admin.from("workspaces").select("id, name, created_at").order("created_at"),
    admin.from("projects").select("id, name, status, progress, budget_total, end_date, scope, workspace_id, org_id").order("created_at"),
    admin.from("tasks").select("id, project_id, status, priority, due_date"),
    admin.from("risk_register").select("id, project_id, likelihood, impact, status").order("created_at"),
    admin.from("milestones").select("id, project_id, name, due_date, status").order("due_date"),
  ]);

  return NextResponse.json({
    workspaces: workspaces ?? [],
    projects:   projects   ?? [],
    tasks:      tasks      ?? [],
    risks:      risks      ?? [],
    milestones: milestones ?? [],
  });
}
