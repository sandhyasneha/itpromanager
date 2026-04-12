/**
 * src/app/(app)/admin/page.tsx
 *
 * ⚠ CORRECT PATH: src/app/(app)/admin/page.tsx
 * The (app) route group is required — do NOT place at src/app/admin/
 *
 * Unified Admin Panel — info@nexplan.io only
 * Tabs: Overview · DC Setup · ROI Calculator · CIO Pitch · Audit Log
 */

import { createClient } from "@/lib/supabase/server";
import { redirect }     from "next/navigation";
import AdminClient      from "./AdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NexPlan Admin Panel",
  description: "Internal admin panel — NexPlan operations",
  robots: "noindex, nofollow",
};

const ADMIN_EMAIL = "info@nexplan.io";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");

  return <AdminClient />;
}
