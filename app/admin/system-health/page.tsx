"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Globe,
  Loader2,
  Mail,
  RefreshCw,
  Server,
  Shield,
  XCircle,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type HealthStatus   = "pass" | "warning" | "fail";
type HealthSeverity = "low" | "medium" | "high" | "critical";

type HealthCheck = {
  key:       string;
  label:     string;
  status:    HealthStatus;
  severity:  HealthSeverity;
  message:   string;
  fix_hint?: string | null;
};

type HealthGroup = {
  group:  string;
  label:  string;
  checks: HealthCheck[];
};

type HealthSummary = {
  total:    number;
  pass:     number;
  warning:  number;
  fail:     number;
  critical: number;
};

type HealthReport = {
  overall:      HealthStatus;
  generated_at: string;
  groups:       HealthGroup[];
  summary:      HealthSummary;
  last_backup?: string | null;
  failed_jobs?: number | null;
};

type ErrorEntry = {
  id?:         string | number;
  timestamp:   string;
  level:       string;
  route?:      string | null;
  method?:     string | null;
  message:     string;
  ip?:         string | null;
  request_id?: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupOverall(checks: HealthCheck[]): HealthStatus {
  if (checks.some((c) => c.status === "fail"))    return "fail";
  if (checks.some((c) => c.status === "warning")) return "warning";
  return "pass";
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function shortTs(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

// ── Status UI maps ────────────────────────────────────────────────────────────

const STATUS_ICON: Record<HealthStatus, React.ReactNode> = {
  pass:    <CheckCircle2 size={14} className="shrink-0 text-emerald-500" strokeWidth={2.2} />,
  warning: <AlertTriangle size={14} className="shrink-0 text-amber-500" strokeWidth={2.2} />,
  fail:    <XCircle size={14} className="shrink-0 text-red-500" strokeWidth={2.2} />,
};

const STATUS_PILL: Record<HealthStatus, string> = {
  pass:    "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  fail:    "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<HealthStatus, string> = {
  pass:    "Pass",
  warning: "Warning",
  fail:    "Fail",
};

const SEVERITY_PILL: Record<HealthSeverity, string> = {
  low:      "bg-gray-100 text-gray-500",
  medium:   "bg-blue-100 text-blue-600",
  high:     "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

const ERROR_LEVEL_PILL: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  error:    "bg-red-50 text-red-600",
  warning:  "bg-amber-100 text-amber-700",
  info:     "bg-blue-100 text-blue-600",
};

const GROUP_ICON: Record<string, React.ReactNode> = {
  application:  <Cpu    size={14} strokeWidth={1.8} />,
  database:     <Database size={14} strokeWidth={1.8} />,
  queue:        <Archive size={14} strokeWidth={1.8} />,
  backups:      <Archive size={14} strokeWidth={1.8} />,
  mail:         <Mail   size={14} strokeWidth={1.8} />,
  security:     <Shield size={14} strokeWidth={1.8} />,
  endpoints:    <Globe  size={14} strokeWidth={1.8} />,
  integrations: <Zap    size={14} strokeWidth={1.8} />,
};

const OVERALL_UI: Record<HealthStatus, { label: string; ring: string; text: string; dot: string }> = {
  pass:    { label: "All Systems Healthy",  ring: "ring-emerald-200 bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  warning: { label: "Issues Detected",      ring: "ring-amber-200 bg-amber-50",     text: "text-amber-700",   dot: "bg-amber-500" },
  fail:    { label: "Critical Problems",    ring: "ring-red-200 bg-red-50",         text: "text-red-700",     dot: "bg-red-500" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-black/[0.06] ${className ?? ""}`} />;
}

function CheckRow({ check }: { check: HealthCheck }) {
  return (
    <div className={`flex flex-col gap-0.5 border-b border-black/[0.05] px-4 py-2.5 last:border-0 ${
      check.status === "fail" ? "bg-red-50/40" : check.status === "warning" ? "bg-amber-50/30" : ""
    }`}>
      <div className="flex items-center gap-2.5">
        {STATUS_ICON[check.status] ?? STATUS_ICON.fail}
        <span className={`flex-1 text-[0.82rem] font-medium ${
          check.status === "fail" ? "text-[#1a1a1a]" : "text-[#374151]"
        }`}>
          {check.label}
        </span>
        {check.severity !== "low" && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${SEVERITY_PILL[check.severity]}`}>
            {check.severity}
          </span>
        )}
      </div>

      {check.message && (
        <p className="ml-[22px] text-[0.75rem] text-[#6b7280]">{check.message}</p>
      )}

      {(check.status === "fail" || check.status === "warning") && check.fix_hint && (
        <p className="ml-[22px] mt-0.5 text-[0.72rem] text-[#9ca3af]">
          <span className="font-semibold text-[#6b7280]">Fix: </span>{check.fix_hint}
        </p>
      )}
    </div>
  );
}

function GroupCard({ group }: { group: HealthGroup }) {
  const overall = groupOverall(group.checks);
  const icon    = GROUP_ICON[group.group.toLowerCase()] ?? <Server size={14} strokeWidth={1.8} />;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]">
      {/* Group header */}
      <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-4 py-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${STATUS_PILL[overall]} bg-opacity-40`}>
          {icon}
        </span>
        <span className="flex-1 text-[0.85rem] font-bold text-[#1a1a1a]">{group.label}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide ${STATUS_PILL[overall]}`}>
          {STATUS_LABEL[overall]}
        </span>
      </div>

      {/* Checks */}
      <div className="divide-y divide-black/[0.04]">
        {group.checks.length === 0 ? (
          <p className="px-4 py-3 text-[0.78rem] text-[#9ca3af]">No checks in this group.</p>
        ) : (
          group.checks.map((check) => (
            <CheckRow key={check.key} check={check} />
          ))
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/[0.06]">
      <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#9ca3af]">{label}</p>
      <p className={`text-[1.45rem] font-extrabold leading-none ${accent ?? "text-[#1a1a1a]"}`}>{value}</p>
      {sub && <p className="mt-1 text-[0.72rem] text-[#9ca3af]">{sub}</p>}
    </div>
  );
}

function ErrorsTable({ errors }: { errors: ErrorEntry[] }) {
  if (errors.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-6 py-8 text-center shadow-sm ring-1 ring-black/[0.06]">
        <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400" strokeWidth={1.5} />
        <p className="text-[0.85rem] font-semibold text-[#374151]">No recent errors</p>
        <p className="mt-0.5 text-[0.75rem] text-[#9ca3af]">Your application is running cleanly.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[0.8rem]">
          <thead>
            <tr className="border-b border-black/[0.06] bg-[#f9f9f9]">
              <th className="px-4 py-2.5 font-semibold text-[#6b7280]">Time</th>
              <th className="px-4 py-2.5 font-semibold text-[#6b7280]">Endpoint</th>
              <th className="px-4 py-2.5 font-semibold text-[#6b7280]">Level</th>
              <th className="px-4 py-2.5 font-semibold text-[#6b7280]">Message</th>
              <th className="px-4 py-2.5 font-semibold text-[#6b7280]">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {errors.map((e, i) => {
              const levelKey = e.level?.toLowerCase() as string;
              const pillCls  = ERROR_LEVEL_PILL[levelKey] ?? "bg-gray-100 text-gray-500";
              return (
                <tr key={e.id ?? i} className="hover:bg-[#fafafa]">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[0.72rem] text-[#6b7280]">
                    {shortTs(e.timestamp)}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-2.5 font-mono text-[0.72rem] text-[#374151]">
                    {e.method && <span className="mr-1 font-bold">{e.method}</span>}
                    {e.route ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${pillCls}`}>
                      {e.level}
                    </span>
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-2.5 text-[#374151]">{e.message}</td>
                  <td className="px-4 py-2.5 font-mono text-[0.72rem] text-[#9ca3af]">{e.ip ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
  const [report,      setReport]      = useState<HealthReport | null>(null);
  const [errors,      setErrors]      = useState<ErrorEntry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [running,     setRunning]     = useState(false);

  const fetchAll = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const [healthRes, errorsRes] = await Promise.all([
        fetch("/api/admin/system/health"),
        fetch("/api/admin/system/errors?limit=50"),
      ]);

      if (healthRes.status === 403) {
        setError("You do not have permission to view system health.");
        return;
      }
      if (healthRes.status === 404) {
        setError("Health check endpoint not available yet. Backend integration pending.");
        return;
      }
      if (!healthRes.ok) {
        const j = await healthRes.json().catch(() => ({})) as Record<string, unknown>;
        setError(typeof j.message === "string" ? j.message : "Failed to load health data.");
        return;
      }

      const healthJson = await healthRes.json().catch(() => ({})) as Record<string, unknown>;
      // Backend may wrap in data or return directly
      const raw = (healthJson.data ?? healthJson) as Record<string, unknown>;
      setReport(raw as unknown as HealthReport);

      if (errorsRes.ok) {
        const errorsJson = await errorsRes.json().catch(() => ({})) as Record<string, unknown>;
        const list = Array.isArray(errorsJson.data) ? errorsJson.data : Array.isArray(errorsJson.errors) ? errorsJson.errors : [];
        setErrors(list as ErrorEntry[]);
      }

      setLastChecked(new Date());
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
      setRunning(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived values ────────────────────────────────────────────────────────

  const summary    = report?.summary;
  const overall    = report?.overall ?? "pass";
  const overallUi  = OVERALL_UI[overall];
  const critCount  = summary?.critical ?? (report?.groups.flatMap((g) => g.checks).filter((c) => c.status === "fail" && c.severity === "critical").length ?? 0);
  const warnCount  = summary?.warning  ?? (report?.groups.flatMap((g) => g.checks).filter((c) => c.status === "warning").length ?? 0);
  const failCount  = summary?.fail     ?? (report?.groups.flatMap((g) => g.checks).filter((c) => c.status === "fail").length ?? 0);
  const lastBackup = report?.last_backup;
  const failedJobs = report?.failed_jobs ?? 0;

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-6 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <AlertTriangle size={36} className="mb-3 text-amber-400" strokeWidth={1.5} />
        <p className="mb-1 text-[1rem] font-bold text-[#1a1a1a]">Health check unavailable</p>
        <p className="mb-5 max-w-sm text-[0.83rem] text-[#6b7280]">{error}</p>
        <button
          type="button"
          onClick={fetchAll}
          className="flex items-center gap-2 rounded-full bg-[#E85C1A] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#d14f14]"
        >
          <RefreshCw size={14} strokeWidth={2.2} />
          Retry
        </button>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <Activity size={18} className="text-[#E85C1A]" strokeWidth={2} />
            <h1 className="text-[1.15rem] font-extrabold text-[#1a1a1a]">System Health</h1>
          </div>
          <p className="mt-0.5 text-[0.82rem] text-[#6b7280]">
            Infrastructure status, security posture, and endpoint monitoring
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {lastChecked && (
            <span className="flex items-center gap-1.5 text-[0.75rem] text-[#9ca3af]">
              <Clock size={12} strokeWidth={2} />
              Checked {timeAgo(lastChecked.toISOString())}
            </span>
          )}
          <button
            type="button"
            onClick={fetchAll}
            disabled={running}
            className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2 text-[0.82rem] font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
          >
            {running
              ? <Loader2 size={13} className="animate-spin" strokeWidth={2.5} />
              : <RefreshCw size={13} strokeWidth={2.5} />
            }
            {running ? "Running…" : "Run Health Check"}
          </button>
        </div>
      </div>

      {/* Overall status banner */}
      {report && (
        <div className={`mb-6 flex items-center gap-3 rounded-2xl px-5 py-3.5 ring-1 ${overallUi.ring}`}>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${overallUi.dot}`} />
          <span className={`text-[0.9rem] font-bold ${overallUi.text}`}>{overallUi.label}</span>
          {report.generated_at && (
            <span className="ml-auto text-[0.72rem] text-[#9ca3af]">
              Generated {timeAgo(report.generated_at)}
            </span>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          label="Overall"
          value={<span className={`text-[1rem] font-extrabold ${overallUi.text}`}>{overallUi.label}</span>}
        />
        <SummaryCard
          label="Critical"
          value={critCount}
          sub="need immediate fix"
          accent={critCount > 0 ? "text-red-600" : "text-[#1a1a1a]"}
        />
        <SummaryCard
          label="Warnings"
          value={warnCount}
          sub="review recommended"
          accent={warnCount > 0 ? "text-amber-600" : "text-[#1a1a1a]"}
        />
        <SummaryCard
          label="Failed Jobs"
          value={failedJobs ?? "—"}
          sub="in queue"
          accent={(failedJobs ?? 0) > 0 ? "text-red-600" : "text-[#1a1a1a]"}
        />
        <SummaryCard
          label="Last Backup"
          value={lastBackup ? timeAgo(lastBackup) : "—"}
          sub={lastBackup ? shortTs(lastBackup) : "not recorded"}
        />
        <SummaryCard
          label="Recent Errors"
          value={errors.length}
          sub="from error log"
          accent={errors.length > 0 ? "text-amber-600" : "text-[#1a1a1a]"}
        />
      </div>

      {/* Health check groups */}
      {report && report.groups.length > 0 ? (
        <>
          <h2 className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#9ca3af]">
            Health Checks
          </h2>
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {report.groups.map((group) => (
              <GroupCard key={group.group} group={group} />
            ))}
          </div>
        </>
      ) : (
        !loading && (
          <div className="mb-8 rounded-2xl bg-white px-6 py-8 text-center shadow-sm ring-1 ring-black/[0.06]">
            <Activity size={28} className="mx-auto mb-2 text-[#d1d5db]" strokeWidth={1.5} />
            <p className="text-[0.85rem] font-semibold text-[#374151]">No health checks returned</p>
            <p className="mt-0.5 text-[0.75rem] text-[#9ca3af]">The backend health endpoint may not be fully implemented yet.</p>
          </div>
        )
      )}

      {/* Fail/Warning summary quick-list */}
      {report && failCount > 0 && (
        <>
          <h2 className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#9ca3af]">
            Issues Requiring Attention
          </h2>
          <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]">
            {report.groups
              .flatMap((g) =>
                g.checks
                  .filter((c) => c.status !== "pass")
                  .map((c) => ({ ...c, groupLabel: g.label }))
              )
              .sort((a, b) => {
                const order: Record<HealthSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
              })
              .map((check) => (
                <div
                  key={check.key}
                  className={`flex items-start gap-3 border-b border-black/[0.05] px-4 py-3 last:border-0 ${
                    check.status === "fail" ? "bg-red-50/40" : "bg-amber-50/20"
                  }`}
                >
                  {STATUS_ICON[check.status]}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.82rem] font-semibold text-[#1a1a1a]">{check.label}</span>
                      <span className="text-[0.72rem] text-[#9ca3af]">· {check.groupLabel}</span>
                      {check.severity !== "low" && (
                        <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ${SEVERITY_PILL[check.severity]}`}>
                          {check.severity}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[0.75rem] text-[#6b7280]">{check.message}</p>
                    {check.fix_hint && (
                      <p className="mt-0.5 text-[0.72rem] text-[#9ca3af]">
                        <span className="font-semibold text-[#6b7280]">Fix: </span>{check.fix_hint}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* Recent errors */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#9ca3af]">
          Recent Errors
        </h2>
        {errors.length > 0 && (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[0.65rem] font-bold text-red-600">
            {errors.length}
          </span>
        )}
      </div>
      <ErrorsTable errors={errors} />

      {/* Safety note */}
      <p className="mt-6 text-center text-[0.7rem] text-[#d1d5db]">
        Secrets, tokens, and passwords are never exposed in this view.
      </p>
    </div>
  );
}
