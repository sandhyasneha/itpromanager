// ─────────────────────────────────────────────────────────────────────────────
// FILE 1: src/app/governance/deployment/page.tsx
// Route: localhost:3000/governance/deployment
// ─────────────────────────────────────────────────────────────────────────────

import DeploymentConfig from "./DeploymentConfig";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deployment Config — NTT Data | NexPlan",
  description: "Configure SaaS or Data Center deployment model for NTT Data enterprise onboarding.",
};

export default function DeploymentPage() {
  return <DeploymentConfig />;
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE 2: Navigation sidebar entry (add to your existing sidebar/nav component)
//
// Find your sidebar component — likely in:
//   src/components/Sidebar.tsx
//   src/components/Navigation.tsx
//   src/app/layout.tsx
//   src/components/AppShell.tsx
//
// Add this nav item alongside your existing items (about, pricing, etc.)
// ─────────────────────────────────────────────────────────────────────────────

/*

// Add to your nav items array:

{
  href:  "/governance",
  label: "Governance",
  icon:  <GovernanceIcon />,         // or use whatever icon library you have
  badge: unresolvedAlertCount,       // optional — shows red dot when > 0
}

// If you don't have an icon library, here's a simple inline SVG:

function GovernanceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor" opacity=".7"/>
      <rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor"/>
      <rect x="11" y="2" width="3" height="13" rx="1" fill="currentColor" opacity=".7"/>
    </svg>
  );
}

// For the alert badge (optional — shows live unresolved count):

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnresolvedAlertCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("governance_alerts")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false)
      .then(({ count: c }) => setCount(c ?? 0));
  }, []);
  return count;
}

// Then in your nav:

function NavItem({ href, label, icon }) {
  const alertCount = useUnresolvedAlertCount();
  return (
    <a href={href} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
      {icon}
      {label}
      {href === "/governance" && alertCount > 0 && (
        <span style={{
          position: "absolute", top: -4, right: -4,
          width: 16, height: 16, borderRadius: "50%",
          background: "#E24B4A", color: "#fff",
          fontSize: 10, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {alertCount > 9 ? "9+" : alertCount}
        </span>
      )}
    </a>
  );
}

*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE 3: vercel.json (repo root) — add cron schedule for alert cycle
// Create or merge into existing vercel.json at:
//   C:\Users\RAM\Desktop\projects\itpromanager\vercel.json
// ─────────────────────────────────────────────────────────────────────────────

/*

{
  "crons": [
    {
      "path": "/api/jobs/alerts",
      "schedule": "every 15 minutes"
    }
  ]
}

Also add to .env.local:
  CRON_SECRET=<generate a random string, e.g. openssl rand -hex 32>
  SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API>

*/
