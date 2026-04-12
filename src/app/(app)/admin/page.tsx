/**
 * src/app/(app)/admin/page.tsx
 * ⚠ CORRECT PATH: src/app/(app)/admin/page.tsx
 *
 * Unified Admin Panel — info@nexplan.io only
 * Passes existing AdminAuditLog as a prop to the new AdminClient
 * so the client component never directly imports it (avoids build errors).
 */

import { createClient }  from "@/lib/supabase/server";
import { redirect }      from "next/navigation";
import AdminClient       from "./AdminClient";
import type { Metadata } from "next";

// Import AdminAuditLog — it lives in the same folder as this page
// If it has a default export use this:
import AdminAuditLog from "./AdminAuditLog";
// If the above fails at build, try the named export instead:
// import { AdminAuditLog } from "./AdminAuditLog";
// Or if it's in src/components/:
// import AdminAuditLog from "@/components/AdminAuditLog";

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

  // Pass AdminAuditLog as a React node — client component never imports it directly
  return <AdminClient auditLog={<AdminAuditLog />} />;
}
