/**
 * src/app/pitch/page.tsx
 * Admin-only CIO Pitch page
 * Route: nexplan.io/pitch
 *
 * Restricted to info@nexplan.io only.
 * Anyone else → redirect /dashboard
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PitchClient from "./PitchClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NexPlan CIO Pitch | Admin",
  description: "Internal CIO pitch deck and materials.",
  robots: "noindex, nofollow",
};

const ADMIN_EMAIL = "info@nexplan.io";

export default async function PitchPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");

  return <PitchClient />;
}
