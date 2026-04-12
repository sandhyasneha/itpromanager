/**
 * src/app/setup/page.tsx
 * DC Setup Wizard — accessible to admin only
 * Route: nexplan.io/setup (or nexplan.citibank.net/setup for DC clients)
 */
import { createClient } from "@/lib/supabase/server";
import { redirect }     from "next/navigation";
import DCSetupWizard    from "./DCSetupWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NexPlan Setup Wizard",
  description: "Data Center configuration wizard",
  robots: "noindex, nofollow",
};

export default async function SetupPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only admin can access setup wizard
  const { data: profile } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("id", user.id)
    .single();

  if (profile?.app_role !== "admin" && user.email !== "info@nexplan.io") {
    redirect("/dashboard");
  }

  return <DCSetupWizard />;
}
