/**
 * Alert cycle cron route handler
 * Drop into: src/app/api/jobs/alerts/route.ts
 *
 * Trigger via:
 *   - Vercel Cron (vercel.json)         → every 15 minutes
 *   - Supabase Edge Function cron       → pg_cron
 *   - External cron (e.g. cron-job.org) → POST with CRON_SECRET header
 *
 * Vercel cron config (add to vercel.json at repo root):
 * {
 *   "crons": [{
 *     "path": "/api/jobs/alerts",
 *     "schedule": "every 15 minutes"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import {
  evaluatePortfolio,
  buildNotificationPayloads,
  type Project,
  type NotificationRule,
} from "@/lib/alerting-engine";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorised(req: NextRequest): boolean {
  // Vercel Cron automatically sends this header in production
  const cronHeader = req.headers.get("x-vercel-cron");
  if (cronHeader === "1") return true;

  // Manual trigger / external cron — check shared secret
  const secret = req.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

// ─── Supabase admin client (bypasses RLS) ────────────────────────────────────

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,   // never expose this to the browser
    { auth: { persistSession: false } }
  );
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchProjects(): Promise<Project[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select(`
      id, name, domain, status, risk_score,
      approved_budget, eac, actual_spend, owner_id,
      planned_end_date, forecast_end_date,
      milestones(id, name, due_date, status, blocking, owner_id),
      gates:governance_gates(id, gate_name, gate_type, status, due_date)
    `)
    .neq("status", "completed");

  if (error) throw new Error(`fetchProjects: ${error.message}`);

  return (data ?? []).map(r => ({
    id:                r.id,
    name:              r.name,
    domain:            r.domain,
    status:            r.status,
    approved_budget:   r.approved_budget,
    eac:               r.eac,
    actual_spend:      r.actual_spend ?? 0,
    owner_id:          r.owner_id,
    milestones:        (r.milestones ?? []).map((m: any) => ({
      id:         m.id,
      project_id: r.id,
      name:       m.name,
      due_date:   new Date(m.due_date),
      status:     m.status,
      blocking:   m.blocking ?? false,
      owner_id:   m.owner_id,
    })),
    gates: (r.gates ?? []).map((g: any) => ({
      id:         g.id,
      project_id: r.id,
      gate_name:  g.gate_name,
      gate_type:  g.gate_type,
      status:     g.status,
      due_date:   new Date(g.due_date),
    })),
    deployment_model:    "unset" as const,
    planned_end_date:    new Date(r.planned_end_date),
    forecast_end_date:   new Date(r.forecast_end_date ?? r.planned_end_date),
  }));
}

async function fetchRules(): Promise<NotificationRule[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("notification_rules")
    .select("id, trigger, trigger_value, channels, recipients, severity_filter")
    .eq("active", true);

  if (error) throw new Error(`fetchRules: ${error.message}`);
  return data ?? [];
}

async function persistAlerts(alerts: ReturnType<typeof evaluatePortfolio>["alerts_raised"]) {
  if (alerts.length === 0) return;
  const supabase = getAdminClient();

  // Upsert — dedup_key prevents double-inserts if cron fires twice
  const rows = alerts.map(a => ({
    id:              a.id,
    project_id:      a.project_id,
    severity:        a.severity,
    category:        a.category,
    title:           a.title,
    description:     a.description,
    action_required: a.action_required,
    action_due_date: a.action_due_date?.toISOString().slice(0, 10) ?? null,
    raised_at:       a.raised_at.toISOString(),
    resolved:        false,
    metadata:        a.metadata ?? {},
  }));

  const { error } = await supabase
    .from("governance_alerts")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });

  if (error) throw new Error(`persistAlerts: ${error.message}`);
}

async function dispatchAll(
  payloads: ReturnType<typeof buildNotificationPayloads>
): Promise<void> {
  // For now: log to console. Wire real channels here:
  //   email  → Resend / SendGrid
  //   slack  → Slack Bolt / incoming webhook
  //   webhook → fetch() with HMAC signature
  for (const p of payloads) {
    console.info(
      `[NexPlan Alert] channel=${p.channel} severity=${p.alert.severity} ` +
      `title="${p.alert.title}" recipients=${p.recipients.join(",")}`
    );
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const [projects, rules] = await Promise.all([fetchProjects(), fetchRules()]);
    const result = evaluatePortfolio(projects);

    await persistAlerts(result.alerts_raised);
    const payloads = buildNotificationPayloads(result.alerts_raised, rules);
    await dispatchAll(payloads);

    const elapsed = Date.now() - startedAt;

    console.info(
      `[NexPlan Alert Cycle] ${result.evaluated_at.toISOString()} ` +
      `projects=${result.project_count} alerts=${result.alerts_raised.length} ` +
      `critical=${result.summary.critical} high=${result.summary.high} ` +
      `elapsed=${elapsed}ms`
    );

    return NextResponse.json({
      ok:         true,
      evaluated:  result.project_count,
      alerts:     result.alerts_raised.length,
      summary:    result.summary,
      elapsed_ms: elapsed,
    });
  } catch (err: any) {
    console.error("[NexPlan Alert Cycle] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Allow GET for manual health-check pings
export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, message: "Alert cycle route is reachable." });
}
