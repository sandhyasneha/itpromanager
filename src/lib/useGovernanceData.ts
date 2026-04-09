"use client";

/**
 * useGovernanceData.ts — src/lib/useGovernanceData.ts
 * Uses your real projects table columns exactly as they exist.
 * Auto-classifies domain from project name when scope is null.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus = "on_track" | "at_risk" | "critical" | "monitoring";
export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertCategory = "budget" | "schedule" | "gate" | "compliance" | "deployment";

export interface Project {
  id: string;
  name: string;
  domain: string;
  status: ProjectStatus;
  riskScore: number;
  approvedBudget: number;
  eac: number;
  owner: string;
}

export interface Milestone {
  id: string;
  projectName: string;
  name: string;
  dueDate: string;
  daysUntil: number;
  status: "upcoming" | "overdue" | "at_risk";
}

export interface GovernanceAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  actionRequired: boolean;
}

export interface BudgetDomain {
  label: string;
  spent: number;
  color: string;
}

export interface PortfolioKPIs {
  activeProjects: number;
  onTrackRate: number;
  onTrackDeltaPP: number;
  budgetUtilised: number;
  budgetCap: number;
  atRiskCount: number;
  criticalCount: number;
  deliverablesDue30d: number;
}

// ─── Auto domain classifier ───────────────────────────────────────────────────
// Reads project name + scope keywords and assigns a domain

function classifyDomain(name: string, scope: string | null): string {
  const text = `${name} ${scope ?? ""}`.toLowerCase();

  if (/wifi|wap|wireless|access.?point|wi-fi/i.test(text))          return "Networking";
  if (/router|routing|ospf|bgp|sdwan|sd-wan|cisco|switch/i.test(text)) return "Networking";
  if (/firewall|palo.?alto|security|zero.?trust/i.test(text))        return "Security";
  if (/server|sql|azure|cloud|migration|virtual|p2v|physical/i.test(text)) return "Infrastructure";
  if (/ai|analytics|data|platform|genesys|crm/i.test(text))          return "Analytics";
  if (/training|pmp|project.?manager|onboarding/i.test(text))        return "Operations";
  if (/budget|finance|cost|finops/i.test(text))                       return "FinOps";
  return "IT Projects";
}

// ─── Domain colours ───────────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  Networking:     "#378ADD",
  Security:       "#E24B4A",
  Infrastructure: "#1D9E75",
  Analytics:      "#BA7517",
  Operations:     "#888780",
  FinOps:         "#534AB7",
  "IT Projects":  "#5F5E5A",
};

// ─── Status normaliser ────────────────────────────────────────────────────────

function normaliseStatus(raw: string | null, endDate: string | null): ProjectStatus {
  // First check if overdue by end date
  if (endDate) {
    const end = new Date(endDate);
    const now = new Date();
    const daysOverdue = Math.round((now.getTime() - end.getTime()) / 86_400_000);
    if (daysOverdue > 14) return "critical";
    if (daysOverdue > 0)  return "at_risk";
  }

  if (!raw) return "monitoring";
  const s = raw.toLowerCase();
  if (s === "completed" || s === "done" || s === "closed") return "on_track";
  if (s === "blocked"   || s === "overdue")                return "critical";
  if (s === "at_risk"   || s === "at-risk")                return "at_risk";
  if (s === "active"    || s === "on_track")               return "on_track";
  return "monitoring";
}

// ─── Risk score from project data ─────────────────────────────────────────────

function calcRiskScore(status: ProjectStatus, progress: number | null, endDate: string | null): number {
  let score = 0.3; // base

  // Status contribution
  if (status === "critical")  score += 0.5;
  else if (status === "at_risk") score += 0.3;
  else if (status === "on_track") score -= 0.1;

  // Low progress + near deadline contribution
  if (progress === 0 && endDate) {
    const daysLeft = Math.round((new Date(endDate).getTime() - Date.now()) / 86_400_000);
    if (daysLeft < 7)  score += 0.4;
    else if (daysLeft < 30) score += 0.2;
    else if (daysLeft < 0)  score += 0.5;
  }

  return Math.min(Math.max(score, 0.05), 0.99);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface GovernanceData {
  kpis:          PortfolioKPIs | null;
  projects:      Project[];
  milestones:    Milestone[];
  alerts:        GovernanceAlert[];
  budgetDomains: BudgetDomain[];
  loading:       boolean;
  error:         string | null;
  refetch:       () => void;
}

export function useGovernanceData(): GovernanceData {
  const [projects,      setProjects]      = useState<Project[]>([]);
  const [milestones,    setMilestones]    = useState<Milestone[]>([]);
  const [alerts,        setAlerts]        = useState<GovernanceAlert[]>([]);
  const [budgetDomains, setBudgetDomains] = useState<BudgetDomain[]>([]);
  const [kpis,          setKpis]          = useState<PortfolioKPIs | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [tick,          setTick]          = useState(0);

  const refetch = () => setTick(t => t + 1);

  useEffect(() => {
    const supabase = createClient();
    let cancelled  = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // ── Projects ──────────────────────────────────────────────────────
        const { data: projRows, error: projErr } = await supabase
          .from("projects")
          .select("id, name, status, scope, progress, budget_total, owner_id, end_date")
          .order("created_at", { ascending: false });

        if (projErr) throw projErr;

        const now = new Date();

        const mappedProjects: Project[] = (projRows ?? []).map(r => {
          const domain = classifyDomain(r.name, r.scope);
          const status = normaliseStatus(r.status, r.end_date);
          const risk   = calcRiskScore(status, r.progress, r.end_date);
          return {
            id:             r.id,
            name:           r.name,
            domain,
            status,
            riskScore:      risk,
            approvedBudget: r.budget_total ? Number(r.budget_total) : 0,
            eac:            r.budget_total ? Number(r.budget_total) : 0,
            owner:          r.owner_id
              ? String(r.owner_id).slice(0, 8) + "…"
              : "—",
          };
        });

        // Sort by risk score descending (most at-risk first)
        mappedProjects.sort((a, b) => b.riskScore - a.riskScore);

        // ── Budget domains ────────────────────────────────────────────────
        const domainMap: Record<string, number> = {};
        const domainCount: Record<string, number> = {};
        for (const p of mappedProjects) {
          domainCount[p.domain] = (domainCount[p.domain] ?? 0) + 1;
          // Use budget if set, otherwise count projects (1 unit each)
          domainMap[p.domain] = (domainMap[p.domain] ?? 0) + (p.approvedBudget || 1);
        }
        const mappedDomains: BudgetDomain[] = Object.entries(domainMap)
          .sort(([, a], [, b]) => b - a)
          .map(([label, spent]) => ({
            label,
            spent,
            color: DOMAIN_COLORS[label] ?? "#888780",
          }));

        // ── Auto-generate governance alerts from project state ─────────────
        // (until real governance_alerts table is populated)
        const autoAlerts: GovernanceAlert[] = [];

        // Overdue projects
        for (const p of mappedProjects) {
          if (p.status === "critical") {
            autoAlerts.push({
              id:             `auto-${p.id}`,
              severity:       "critical",
              category:       "schedule",
              title:          `${p.name} — overdue or blocked`,
              description:    `Project is past end date or blocked. Immediate review required.`,
              actionRequired: true,
            });
          } else if (p.status === "at_risk") {
            autoAlerts.push({
              id:             `auto-ar-${p.id}`,
              severity:       "high",
              category:       "schedule",
              title:          `${p.name} — at risk`,
              description:    `Project end date approaching with 0% progress. Review needed.`,
              actionRequired: true,
            });
          }
        }

        // Try real governance_alerts table too
        let dbAlerts: GovernanceAlert[] = [];
        try {
          const { data: alertRows } = await supabase
            .from("governance_alerts")
            .select("id, severity, category, title, description, action_required")
            .eq("resolved", false)
            .order("severity", { ascending: true })
            .limit(6);

          if (alertRows?.length) {
            dbAlerts = alertRows.map(r => ({
              id:             r.id,
              severity:       r.severity as AlertSeverity,
              category:       r.category as AlertCategory,
              title:          r.title,
              description:    r.description ?? "",
              actionRequired: r.action_required ?? false,
            }));
          }
        } catch { /* table may not have all columns yet */ }

        // Merge: real DB alerts first, then auto-generated, cap at 6
        const mergedAlerts = [...dbAlerts, ...autoAlerts].slice(0, 6);

        // ── Milestones ────────────────────────────────────────────────────
        // Use project end_date as a milestone proxy until milestones table is populated
        const endDateMilestones: Milestone[] = (projRows ?? [])
          .filter(r => r.end_date)
          .map(r => {
            const due       = new Date(r.end_date);
            const daysUntil = Math.round((due.getTime() - now.getTime()) / 86_400_000);
            return {
              id:          `ms-${r.id}`,
              projectName: r.name,
              name:        "Project deadline",
              dueDate:     due.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
              daysUntil,
              status:      (daysUntil < 0 ? "overdue" : daysUntil <= 7 ? "at_risk" : "upcoming") as Milestone["status"],
            };
          })
          .sort((a, b) => a.daysUntil - b.daysUntil)
          .slice(0, 6);

        // Try real milestones table
        let dbMilestones: Milestone[] = [];
        try {
          const thirtyDaysOut = new Date();
          thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
          const { data: msRows } = await supabase
            .from("milestones")
            .select("id, name, due_date, status, project_id")
            .neq("status", "completed")
            .lte("due_date", thirtyDaysOut.toISOString().slice(0, 10))
            .order("due_date", { ascending: true })
            .limit(6);

          if (msRows?.length) {
            dbMilestones = msRows.map(r => {
              const due       = new Date(r.due_date);
              const daysUntil = Math.round((due.getTime() - now.getTime()) / 86_400_000);
              const proj      = mappedProjects.find(p => p.id === r.project_id);
              return {
                id:          r.id,
                projectName: proj?.name ?? "—",
                name:        r.name,
                dueDate:     due.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
                daysUntil,
                status:      (daysUntil < 0 ? "overdue" : daysUntil <= 7 ? "at_risk" : "upcoming") as Milestone["status"],
              };
            });
          }
        } catch { /* skip */ }

        const finalMilestones = dbMilestones.length ? dbMilestones : endDateMilestones;

        // ── KPIs ──────────────────────────────────────────────────────────
        const total     = mappedProjects.length;
        const onTrack   = mappedProjects.filter(p => p.status === "on_track").length;
        const atRisk    = mappedProjects.filter(p => p.status === "at_risk" || p.status === "critical").length;
        const critical  = mappedProjects.filter(p => p.status === "critical").length;
        const totalBudget = mappedProjects.reduce((s, p) => s + p.approvedBudget, 0);
        const overdueDue30 = finalMilestones.filter(m => m.status === "overdue" || m.status === "at_risk").length;

        if (!cancelled) {
          setProjects(mappedProjects);
          setBudgetDomains(mappedDomains);
          setMilestones(finalMilestones);
          setAlerts(mergedAlerts);
          setKpis({
            activeProjects:     total,
            onTrackRate:        total > 0 ? onTrack / total : 0,
            onTrackDeltaPP:     0,
            budgetUtilised:     totalBudget,
            budgetCap:          totalBudget || 1,
            atRiskCount:        atRisk,
            criticalCount:      critical,
            deliverablesDue30d: finalMilestones.length,
          });
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load governance data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tick]);

  return { kpis, projects, milestones, alerts, budgetDomains, loading, error, refetch };
}
