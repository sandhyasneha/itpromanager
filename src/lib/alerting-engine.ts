/**
 * NexPlan — Milestone & Governance Alerting Engine
 *
 * Evaluates the project portfolio on a schedule, generates governance alerts,
 * and dispatches notifications via configured channels (email, Slack, webhook).
 *
 * Intended for: /packages/alerting-engine in the itpromanager monorepo
 */

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AlertCategory =
  | "budget"
  | "schedule"
  | "gate"
  | "compliance"
  | "deployment"
  | "resource";

export type NotificationChannel = "email" | "slack" | "webhook" | "in_app";

export type MilestoneStatus = "upcoming" | "overdue" | "completed" | "at_risk";
export type GateStatus = "pending" | "passed" | "failed" | "overdue" | "waived";
export type ProjectStatus =
  | "on_track"
  | "at_risk"
  | "critical"
  | "monitoring"
  | "completed";
export type DeploymentModel = "saas" | "data_center" | "hybrid" | "unset";

export interface Project {
  id: string;
  name: string;
  domain: string;
  status: ProjectStatus;
  approved_budget: number;
  eac: number;
  actual_spend: number;
  owner_id: string;
  milestones: Milestone[];
  gates: GateReview[];
  deployment_model: DeploymentModel;
  planned_end_date: Date;
  forecast_end_date: Date;
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  due_date: Date;
  status: MilestoneStatus;
  blocking: boolean;
  owner_id: string;
}

export interface GateReview {
  id: string;
  project_id: string;
  gate_name: string;
  gate_type: string;
  status: GateStatus;
  due_date: Date;
}

export interface GovernanceAlert {
  id: string;
  project_id: string | null;
  project_name: string | null;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  raised_at: Date;
  resolved: boolean;
  action_required: boolean;
  action_due_date: Date | null;
  metadata: Record<string, unknown>;
}

export interface NotificationRule {
  id: string;
  trigger:
    | "days_before_due"
    | "on_slip"
    | "on_overdue"
    | "on_status_change"
    | "on_eac_threshold";
  trigger_value?: number; // e.g. 30 for "30 days before due"
  channels: NotificationChannel[];
  recipients: string[]; // user IDs or role names
  severity_filter: "all" | "critical_only" | "high_and_above";
}

export interface AlertRecord {
  alert: GovernanceAlert;
  dedup_key: string; // prevents re-firing the same alert same day
}

// ─────────────────────────────────────────
// Thresholds (tuneable via env / config)
// ─────────────────────────────────────────

export const ALERT_THRESHOLDS = {
  /** EAC overrun % that triggers a high alert */
  EAC_HIGH_PCT: 0.1,
  /** EAC overrun % that triggers a critical alert */
  EAC_CRITICAL_PCT: 0.3,
  /** Days before milestone due to trigger early warning */
  MILESTONE_WARN_DAYS: [30, 14, 7, 1],
  /** Schedule slip days before project is flagged at-risk */
  SCHEDULE_SLIP_DAYS: 7,
  /** Schedule slip days before project is flagged critical */
  SCHEDULE_CRITICAL_DAYS: 21,
  /** Days a gate is overdue before critical alert */
  GATE_OVERDUE_CRITICAL_DAYS: 3,
} as const;

// ─────────────────────────────────────────
// Deduplication store (use Redis in prod)
// ─────────────────────────────────────────

const firedToday = new Set<string>();

function dedupKey(category: string, entityId: string, triggerType: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${date}:${category}:${entityId}:${triggerType}`;
}

function shouldFire(key: string): boolean {
  if (firedToday.has(key)) return false;
  firedToday.add(key);
  return true;
}

// ─────────────────────────────────────────
// Alert factory helpers
// ─────────────────────────────────────────

function makeAlert(
  partial: Omit<GovernanceAlert, "id" | "raised_at" | "resolved">
): GovernanceAlert {
  return {
    ...partial,
    id: crypto.randomUUID(),
    raised_at: new Date(),
    resolved: false,
  };
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ─────────────────────────────────────────
// Evaluators — one per alert category
// ─────────────────────────────────────────

/** Budget / EAC variance evaluator */
export function evaluateBudget(project: Project): GovernanceAlert[] {
  const alerts: GovernanceAlert[] = [];
  const variance = (project.eac - project.approved_budget) / project.approved_budget;

  if (variance >= ALERT_THRESHOLDS.EAC_CRITICAL_PCT) {
    const key = dedupKey("budget", project.id, "eac_critical");
    if (shouldFire(key)) {
      alerts.push(
        makeAlert({
          project_id: project.id,
          project_name: project.name,
          severity: "critical",
          category: "budget",
          title: `${project.name} — cost overrun ${(variance * 100).toFixed(0)}%`,
          description: `EAC $${(project.eac / 1e6).toFixed(1)}M exceeds approved budget $${(project.approved_budget / 1e6).toFixed(1)}M by ${(variance * 100).toFixed(0)}%. Escalate to steering committee.`,
          action_required: true,
          action_due_date: new Date(Date.now() + 3 * 86_400_000), // 3 days
          metadata: { variance_pct: variance, eac: project.eac, approved_budget: project.approved_budget },
        })
      );
    }
  } else if (variance >= ALERT_THRESHOLDS.EAC_HIGH_PCT) {
    const key = dedupKey("budget", project.id, "eac_high");
    if (shouldFire(key)) {
      alerts.push(
        makeAlert({
          project_id: project.id,
          project_name: project.name,
          severity: "high",
          category: "budget",
          title: `${project.name} — EAC trending ${(variance * 100).toFixed(0)}% over budget`,
          description: `Current EAC $${(project.eac / 1e6).toFixed(1)}M. Monitor closely and request revised plan from owner.`,
          action_required: true,
          action_due_date: new Date(Date.now() + 7 * 86_400_000),
          metadata: { variance_pct: variance, eac: project.eac },
        })
      );
    }
  }

  return alerts;
}

/** Schedule slippage evaluator */
export function evaluateSchedule(project: Project): GovernanceAlert[] {
  const alerts: GovernanceAlert[] = [];
  const slipDays = daysBetween(project.planned_end_date, project.forecast_end_date);

  if (slipDays >= ALERT_THRESHOLDS.SCHEDULE_CRITICAL_DAYS) {
    const key = dedupKey("schedule", project.id, "critical_slip");
    if (shouldFire(key)) {
      alerts.push(
        makeAlert({
          project_id: project.id,
          project_name: project.name,
          severity: "critical",
          category: "schedule",
          title: `${project.name} — ${slipDays}-day schedule slip`,
          description: `Forecast end date is ${slipDays} days past baseline. Executive review required.`,
          action_required: true,
          action_due_date: new Date(Date.now() + 2 * 86_400_000),
          metadata: { slip_days: slipDays },
        })
      );
    }
  } else if (slipDays >= ALERT_THRESHOLDS.SCHEDULE_SLIP_DAYS) {
    const key = dedupKey("schedule", project.id, "slip");
    if (shouldFire(key)) {
      alerts.push(
        makeAlert({
          project_id: project.id,
          project_name: project.name,
          severity: "high",
          category: "schedule",
          title: `${project.name} — timeline slippage ${slipDays} days`,
          description: `Revised plan required from project owner. Consider dependency review.`,
          action_required: true,
          action_due_date: new Date(Date.now() + 7 * 86_400_000),
          metadata: { slip_days: slipDays },
        })
      );
    }
  }

  return alerts;
}

/** Gate review evaluator */
export function evaluateGates(project: Project): GovernanceAlert[] {
  const alerts: GovernanceAlert[] = [];
  const now = new Date();

  for (const gate of project.gates) {
    if (gate.status === "overdue" || (gate.status === "pending" && gate.due_date < now)) {
      const overdueDays = daysBetween(gate.due_date, now);
      const severity: AlertSeverity =
        overdueDays >= ALERT_THRESHOLDS.GATE_OVERDUE_CRITICAL_DAYS ? "critical" : "high";
      const key = dedupKey("gate", gate.id, "overdue");
      if (shouldFire(key)) {
        alerts.push(
          makeAlert({
            project_id: project.id,
            project_name: project.name,
            severity,
            category: "gate",
            title: `${project.name} — ${gate.gate_name} gate overdue ${overdueDays}d`,
            description: `Gate checkpoint not completed. Delivery may be blocked until resolved.`,
            action_required: true,
            action_due_date: new Date(Date.now() + 1 * 86_400_000),
            metadata: { gate_id: gate.id, gate_type: gate.gate_type, overdue_days: overdueDays },
          })
        );
      }
    }
  }

  return alerts;
}

/** Milestone proximity and overdue evaluator */
export function evaluateMilestones(project: Project): GovernanceAlert[] {
  const alerts: GovernanceAlert[] = [];
  const now = new Date();

  for (const ms of project.milestones) {
    if (ms.status === "completed") continue;

    const daysUntil = daysBetween(now, ms.due_date);

    if (daysUntil < 0) {
      // Overdue
      const key = dedupKey("schedule", ms.id, "milestone_overdue");
      if (shouldFire(key)) {
        alerts.push(
          makeAlert({
            project_id: project.id,
            project_name: project.name,
            severity: ms.blocking ? "critical" : "high",
            category: "schedule",
            title: `${project.name} — milestone "${ms.name}" overdue ${Math.abs(daysUntil)}d`,
            description: ms.blocking
              ? `This milestone is blocking downstream work. Immediate escalation required.`
              : `Milestone past due. Owner ${ms.owner_id} should provide updated forecast.`,
            action_required: true,
            action_due_date: new Date(Date.now() + 1 * 86_400_000),
            metadata: { milestone_id: ms.id, days_overdue: Math.abs(daysUntil), blocking: ms.blocking },
          })
        );
      }
    } else {
      // Due soon — fire for each configured warning horizon
      for (const warnDays of ALERT_THRESHOLDS.MILESTONE_WARN_DAYS) {
        if (daysUntil <= warnDays) {
          const key = dedupKey("schedule", ms.id, `milestone_due_${warnDays}d`);
          if (shouldFire(key)) {
            alerts.push(
              makeAlert({
                project_id: project.id,
                project_name: project.name,
                severity: warnDays <= 7 ? "high" : "medium",
                category: "schedule",
                title: `${project.name} — "${ms.name}" due in ${daysUntil}d`,
                description: `Milestone due ${ms.due_date.toISOString().slice(0, 10)}. Confirm readiness with owner.`,
                action_required: warnDays <= 7,
                action_due_date: ms.due_date,
                metadata: { milestone_id: ms.id, days_until: daysUntil },
              })
            );
          }
          break; // Only fire the innermost warning horizon per cycle
        }
      }
    }
  }

  return alerts;
}

/** Deployment model decision evaluator */
export function evaluateDeployment(project: Project): GovernanceAlert[] {
  const alerts: GovernanceAlert[] = [];

  if (project.deployment_model === "unset") {
    const key = dedupKey("deployment", project.id, "model_unset");
    if (shouldFire(key)) {
      alerts.push(
        makeAlert({
          project_id: project.id,
          project_name: project.name,
          severity: "medium",
          category: "deployment",
          title: `${project.name} — deployment model not configured`,
          description:
            "SaaS vs Data Center decision pending. Environment provisioning is blocked until model is selected.",
          action_required: true,
          action_due_date: new Date(Date.now() + 5 * 86_400_000),
          metadata: { deployment_model: project.deployment_model },
        })
      );
    }
  }

  return alerts;
}

// ─────────────────────────────────────────
// Portfolio-level evaluation runner
// ─────────────────────────────────────────

export interface EvaluationResult {
  evaluated_at: Date;
  project_count: number;
  alerts_raised: GovernanceAlert[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export function evaluatePortfolio(projects: Project[]): EvaluationResult {
  const allAlerts: GovernanceAlert[] = [];

  for (const project of projects) {
    if (project.status === "completed") continue;

    allAlerts.push(
      ...evaluateBudget(project),
      ...evaluateSchedule(project),
      ...evaluateGates(project),
      ...evaluateMilestones(project),
      ...evaluateDeployment(project)
    );
  }

  const summary = allAlerts.reduce(
    (acc, a) => {
      acc[a.severity]++;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  );

  return {
    evaluated_at: new Date(),
    project_count: projects.length,
    alerts_raised: allAlerts.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return order[a.severity] - order[b.severity];
    }),
    summary,
  };
}

// ─────────────────────────────────────────
// Notification dispatcher
// ─────────────────────────────────────────

export interface NotificationPayload {
  alert: GovernanceAlert;
  channel: NotificationChannel;
  recipients: string[];
}

function matchesSeverityFilter(
  severity: AlertSeverity,
  filter: NotificationRule["severity_filter"]
): boolean {
  if (filter === "all") return true;
  if (filter === "critical_only") return severity === "critical";
  if (filter === "high_and_above") return severity === "critical" || severity === "high";
  return false;
}

export function buildNotificationPayloads(
  alerts: GovernanceAlert[],
  rules: NotificationRule[]
): NotificationPayload[] {
  const payloads: NotificationPayload[] = [];

  for (const alert of alerts) {
    for (const rule of rules) {
      if (!matchesSeverityFilter(alert.severity, rule.severity_filter)) continue;

      for (const channel of rule.channels) {
        payloads.push({
          alert,
          channel,
          recipients: rule.recipients,
        });
      }
    }
  }

  return payloads;
}

// ─────────────────────────────────────────
// Channel dispatchers (implement per env)
// ─────────────────────────────────────────

export interface DispatchResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
}

export async function dispatchEmail(
  payload: NotificationPayload,
  emailService: { send: (to: string[], subject: string, body: string) => Promise<void> }
): Promise<DispatchResult> {
  try {
    const subject = `[NexPlan ${payload.alert.severity.toUpperCase()}] ${payload.alert.title}`;
    const body = formatEmailBody(payload.alert);
    await emailService.send(payload.recipients, subject, body);
    return { channel: "email", success: true };
  } catch (err) {
    return { channel: "email", success: false, error: String(err) };
  }
}

export async function dispatchSlack(
  payload: NotificationPayload,
  slackService: { postMessage: (channel: string, blocks: unknown[]) => Promise<void> }
): Promise<DispatchResult> {
  try {
    const blocks = formatSlackBlocks(payload.alert);
    for (const channel of payload.recipients) {
      await slackService.postMessage(channel, blocks);
    }
    return { channel: "slack", success: true };
  } catch (err) {
    return { channel: "slack", success: false, error: String(err) };
  }
}

export async function dispatchWebhook(
  payload: NotificationPayload,
  endpoints: string[],
  signingSecret: string
): Promise<DispatchResult> {
  const body = JSON.stringify({
    event: "alert.created",
    alert: payload.alert,
    recipients: payload.recipients,
    sent_at: new Date().toISOString(),
  });

  const signature = await signPayload(body, signingSecret);

  try {
    await Promise.all(
      endpoints.map((url) =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-NexPlan-Signature": signature,
          },
          body,
        })
      )
    );
    return { channel: "webhook", success: true };
  } catch (err) {
    return { channel: "webhook", success: false, error: String(err) };
  }
}

// ─────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
  info: "⚪",
};

function formatEmailBody(alert: GovernanceAlert): string {
  return `
NexPlan Governance Alert
========================

Severity : ${alert.severity.toUpperCase()}
Category : ${alert.category}
Project  : ${alert.project_name ?? "Portfolio-wide"}

${alert.title}

${alert.description}

${alert.action_required && alert.action_due_date ? `Action required by: ${alert.action_due_date.toISOString().slice(0, 10)}` : ""}

Raised at: ${alert.raised_at.toISOString()}
Alert ID : ${alert.id}

View in NexPlan: https://app.nexplan.io/governance/alerts/${alert.id}
`.trim();
}

function formatSlackBlocks(alert: GovernanceAlert): unknown[] {
  const emoji = SEVERITY_EMOJI[alert.severity];
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji} *${alert.title}*\n${alert.description}`,
      },
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `*Project:* ${alert.project_name ?? "Portfolio"}` },
        { type: "mrkdwn", text: `*Severity:* ${alert.severity}` },
        { type: "mrkdwn", text: `*Category:* ${alert.category}` },
      ],
    },
    ...(alert.action_required
      ? [
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "View Alert" },
                url: `https://app.nexplan.io/governance/alerts/${alert.id}`,
                style: alert.severity === "critical" ? "danger" : "primary",
              },
            ],
          },
        ]
      : []),
  ];
}

async function signPayload(body: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─────────────────────────────────────────
// Scheduler entry point
// ─────────────────────────────────────────

/**
 * Main evaluation loop — call this from a cron job (e.g. every 15 minutes).
 *
 * @example
 * // In your cron handler:
 * import { runAlertCycle } from './alerting-engine';
 * await runAlertCycle({ fetchProjects, fetchRules, persistAlerts, dispatchAll });
 */
export async function runAlertCycle(deps: {
  fetchProjects: () => Promise<Project[]>;
  fetchRules: () => Promise<NotificationRule[]>;
  persistAlerts: (alerts: GovernanceAlert[]) => Promise<void>;
  dispatchAll: (payloads: NotificationPayload[]) => Promise<DispatchResult[]>;
}): Promise<EvaluationResult> {
  const [projects, rules] = await Promise.all([
    deps.fetchProjects(),
    deps.fetchRules(),
  ]);

  const result = evaluatePortfolio(projects);

  if (result.alerts_raised.length > 0) {
    await deps.persistAlerts(result.alerts_raised);
    const payloads = buildNotificationPayloads(result.alerts_raised, rules);
    await deps.dispatchAll(payloads);
  }

  console.info(
    `[NexPlan Alerting] ${result.evaluated_at.toISOString()} — ` +
      `${result.project_count} projects evaluated, ` +
      `${result.alerts_raised.length} alerts raised ` +
      `(critical:${result.summary.critical} high:${result.summary.high} ` +
      `medium:${result.summary.medium})`
  );

  return result;
}
