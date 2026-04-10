/**
 * src/app/roi/page.tsx
 * Admin-only ROI Calculator & Value Proposition
 * Route: nexplan.io/roi
 */

import { createClient } from "@/lib/supabase/server";
import { redirect }     from "next/navigation";
import ROIClient        from "./ROIClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NexPlan ROI Calculator | Admin",
  description: "Internal ROI and cost savings analysis for enterprise presentations.",
  robots: "noindex, nofollow",
};

const ADMIN_EMAIL = "info@nexplan.io";

export default async function ROIPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");
  return <ROIClient />;
}
