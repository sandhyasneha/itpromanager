// src/app/api/debug-governance/route.ts
// TEMPORARY — delete after confirming data loads

import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET() {
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: workspaces, error: wErr } = await admin
    .from("workspaces").select("id, name").limit(5);

  const { data: projects, error: pErr } = await admin
    .from("projects").select("id, name, status, workspace_id").limit(5);

  const { data: tasks, error: tErr } = await admin
    .from("tasks").select("id, project_id, status").limit(5);

  return NextResponse.json({
    workspaces, wErr: wErr?.message,
    projects,   pErr: pErr?.message,
    tasks,      tErr: tErr?.message,
  });
}
