"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert, Lock, AlertTriangle, UserPlus, KeyRound, Settings,
  RefreshCw, Filter, Unlock, Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, Ban, Activity,
} from "lucide-react";
import TwoFactorStatus from "@/components/admin/two-factor-status";

// ── Types ──────────────────────────────────────────────────────────────────────

type EventType =
  | "failed_login"
  | "suspicious_activity"
  | "new_registration"
  | "password_reset"
  | "account_changes"
  | "account_lockout"
  | "account_unlock"
  | "account_suspend"
  | "account_ban";

type Severity = "info" | "warning" | "critical";

type SecurityEvent = {
  id: number;
  type: EventType;
  customer_id?: number;
  customer_email?: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  description: string;
  created_at: string;
  severity: Severity;
};

type EventsMeta = { total: number; current_page: number; last_page: number; per_page: number };

type Summary = {
  locked_today: number;
  failed_attempts_today: number;
  new_registrations_today: number;
  suspicious_accounts: number;
  suspended_today: number;
  banned_today: number;
  _unavailable?: boolean;
};

type FilterTab = "all" | EventType;

// ── Constants ──────────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",                label: "All Events" },
  { key: "failed_login",       label: "Failed Login" },
  { key: "suspicious_activity", label: "Suspicious Activity" },
  { key: "account_lockout",    label: "Account Lockouts" },
  { key: "new_registration",   label: "New Registrations" },
  { key: "password_reset",     label: "Password Resets" },
  { key: "account_changes",    label: "Account Changes" },
];

const EVENT_META: Record<EventType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  failed_login:       { icon: Lock,         color: "text-red-600",    bg: "bg-red-50",     label: "Failed Login" },
  suspicious_activity:{ icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50",   label: "Suspicious Activity" },
  new_registration:   { icon: UserPlus,     color: "text-emerald-600",bg: "bg-emerald-50", label: "New Registration" },
  password_reset:     { icon: KeyRound,     color: "text-blue-600",   bg: "bg-blue-50",    label: "Password Reset" },
  account_changes:    { icon: Settings,     color: "text-purple-600", bg: "bg-purple-50",  label: "Account Changed" },
  account_lockout:    { icon: Lock,         color: "text-red-700",    bg: "bg-red-100",    label: "Account Locked" },
  account_unlock:     { icon: Unlock,       color: "text-emerald-600",bg: "bg-emerald-50", label: "Account Unlocked" },
  account_suspend:    { icon: ShieldAlert,  color: "text-orange-600", bg: "bg-orange-50",  label: "Account Suspended" },
  account_ban:        { icon: Ban,          color: "text-red-700",    bg: "bg-red-100",    label: "Account Banned" },
};

const SEVERITY_BADGE: Record<Severity, string> = {
  info:     "bg-blue-50 text-blue-700",
  warning:  "bg-amber-50 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

const PER_PAGE = 25;

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDT(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, color, bg,
}: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-[0.7rem] text-[#5c5e62]">{label}</p>
        <p className={`text-[1.4rem] font-extrabold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function EventRow({
  event, onUnlock,
}: {
  event: SecurityEvent;
  onUnlock: (customerId: number) => void;
}) {
  const meta = EVENT_META[event.type] ?? {
    icon: Activity, color: "text-[#5c5e62]", bg: "bg-[#f5f5f7]", label: event.type,
  };
  const Icon = meta.icon;
  const isLocked = event.type === "account_lockout";
  const isSuspicious = event.type === "suspicious_activity" || event.severity === "critical";

  return (
    <div className={`flex items-start gap-4 px-5 py-3.5 transition-colors ${isSuspicious ? "bg-red-50/60" : "hover:bg-[#fafafa]"}`}>
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
        <Icon size={14} className={meta.color} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.82rem] font-semibold text-[#1a1a1a]">{meta.label}</span>
          <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${SEVERITY_BADGE[event.severity]}`}>
            {event.severity}
          </span>
        </div>
        <p className="mt-0.5 text-[0.78rem] text-[#5c5e62] line-clamp-1">{event.description}</p>
        <div className="mt-1 flex flex-wrap gap-3 text-[0.7rem] text-[#9ca3af]">
          {event.customer_email && (
            <span>
              {event.customer_id ? (
                <Link href={`/admin/customers/${event.customer_id}`} className="text-[#E85C1A] hover:underline">
                  {event.customer_email}
                </Link>
              ) : (
                event.customer_email
              )}
            </span>
          )}
          {event.ip_address && <span>IP: {event.ip_address}</span>}
          {event.location && <span>{event.location}</span>}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[0.72rem] text-[#9ca3af]" title={fmtDT(event.created_at)}>
          {timeAgo(event.created_at)}
        </span>
        {isLocked && event.customer_id && (
          <button
            type="button"
            onClick={() => onUnlock(event.customer_id!)}
            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[0.72rem] font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Unlock size={11} />
            Unlock
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [events, setEvents]     = useState<SecurityEvent[]>([]);
  const [meta, setMeta]         = useState<EventsMeta>({ total: 0, current_page: 1, last_page: 1, per_page: PER_PAGE });
  const [filter, setFilter]     = useState<FilterTab>("all");
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);
  const [unavailable, setUnavail] = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSummary = useCallback(async () => {
    const res = await fetch("/api/admin/security/summary", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (res) setSummary(res);
  }, []);

  const fetchEvents = useCallback(async (tab: FilterTab, pg: number, quiet = false) => {
    if (!quiet) setLoading(true); else setRefresh(true);
    const params = new URLSearchParams({ page: String(pg), per_page: String(PER_PAGE) });
    if (tab !== "all") params.set("type", tab);

    const res = await fetch(`/api/admin/security/events?${params}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);

    if (!res) {
      setEvents([]); setLoading(false); setRefresh(false); return;
    }
    if (res._unavailable) { setUnavail(true); setEvents([]); setLoading(false); setRefresh(false); return; }
    setUnavail(false);
    setEvents(res.data ?? []);
    setMeta(res.meta ?? { total: 0, current_page: pg, last_page: 1, per_page: PER_PAGE });
    setLoading(false); setRefresh(false);
  }, []);

  // Initial + filter/page changes
  useEffect(() => {
    fetchSummary();
    fetchEvents(filter, page);
  }, [fetchSummary, fetchEvents, filter, page]);

  // Auto-refresh every 30s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      fetchSummary();
      fetchEvents(filter, page, true);
    }, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchSummary, fetchEvents, filter, page]);

  const handleFilterChange = (tab: FilterTab) => {
    setFilter(tab); setPage(1);
  };

  const handleUnlock = async (customerId: number) => {
    const res = await fetch(`/api/admin/customers/${customerId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate" }),
    }).then(r => r.json()).catch(() => null);

    if (res?.success || res?.message) {
      showToast("Account unlocked successfully.", true);
      fetchSummary();
      fetchEvents(filter, page, true);
    } else {
      showToast(res?.error ?? "Failed to unlock account.", false);
    }
  };

  const summaryStats = [
    { icon: Lock,          label: "Accounts Locked Today",     value: summary?.locked_today ?? 0,          color: "text-red-600",    bg: "bg-red-50" },
    { icon: AlertTriangle, label: "Failed Attempts Today",      value: summary?.failed_attempts_today ?? 0, color: "text-amber-600",  bg: "bg-amber-50" },
    { icon: UserPlus,      label: "New Registrations Today",    value: summary?.new_registrations_today ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: ShieldAlert,   label: "Suspicious Accounts",        value: summary?.suspicious_accounts ?? 0,   color: summary?.suspicious_accounts ? "text-red-700" : "text-[#5c5e62]", bg: summary?.suspicious_accounts ? "bg-red-100" : "bg-[#f5f5f7]" },
    { icon: Ban,           label: "Suspended Today",            value: summary?.suspended_today ?? 0,       color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-4 md:p-6 lg:p-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[0.82rem] font-semibold shadow-lg ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link href="/admin" className="mb-3 inline-flex items-center gap-1.5 text-[0.78rem] text-[#5c5e62] hover:text-[#1a1a1a]">
          <ChevronLeft size={14} /> Dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">Admin</p>
            <h1 className="mt-0.5 flex items-center gap-2 text-2xl font-extrabold text-[#1a1a1a]">
              <ShieldAlert size={22} className="text-[#E85C1A]" />
              Security & Events Log
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[0.72rem] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Auto-refreshes every 30s
            </div>
            <button
              type="button"
              onClick={() => { fetchSummary(); fetchEvents(filter, page, true); }}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-semibold text-[#1a1a1a] shadow-sm transition hover:bg-[#f5f5f7] disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* 2FA */}
      <TwoFactorStatus />

      {/* Summary Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryStats.map(s => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} bg={s.bg} />
        ))}
      </div>

      {/* Suspicious accounts alert */}
      {!summary?._unavailable && (summary?.suspicious_accounts ?? 0) > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5">
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <p className="flex-1 text-[0.82rem] font-semibold text-red-800">
            {summary!.suspicious_accounts} account{summary!.suspicious_accounts !== 1 ? "s" : ""} flagged for suspicious activity — review and take action below.
          </p>
          <button
            type="button"
            onClick={() => handleFilterChange("suspicious_activity")}
            className="shrink-0 rounded-xl bg-red-600 px-3 py-1.5 text-[0.75rem] font-bold text-white transition hover:bg-red-700"
          >
            View Suspicious
          </button>
        </div>
      )}

      {/* Events Log Card */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

        {/* Card header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Activity size={15} className="text-[#5c5e62]" />
            <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">Security Events</p>
            {!unavailable && meta.total > 0 && (
              <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[0.72rem] font-semibold text-[#5c5e62]">
                {meta.total.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[0.72rem] text-[#9ca3af]">
            <Filter size={11} />
            Filter active
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0.5 overflow-x-auto border-b border-black/[0.06] px-4 py-2">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleFilterChange(t.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[0.75rem] font-semibold transition ${
                filter === t.key
                  ? "bg-[#E85C1A] text-white"
                  : "text-[#5c5e62] hover:bg-[#f5f5f7] hover:text-[#1a1a1a]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#9ca3af]">
            <Loader2 size={24} className="animate-spin" />
            <p className="text-[0.82rem]">Loading security events…</p>
          </div>
        ) : unavailable ? (
          <div className="px-5 py-14 text-center">
            <ShieldAlert size={32} className="mx-auto mb-3 text-[#d1d5db]" />
            <p className="text-[0.88rem] font-semibold text-[#5c5e62]">Security API not yet configured on the backend.</p>
            <p className="mt-1 text-[0.75rem] text-[#9ca3af]">
              Implement <code className="rounded bg-[#f5f5f7] px-1.5 py-0.5 font-mono">GET /admin/security/events</code> to enable this log.
            </p>
            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-dashed border-[#e5e7eb] p-4 text-left text-[0.72rem] text-[#9ca3af]">
              <p className="mb-2 font-bold text-[#5c5e62]">Required backend security rules:</p>
              <ul className="space-y-1 leading-relaxed">
                <li>• Lock account after 5 consecutive failed logins</li>
                <li>• Auto-suspend after 10+ failed logins in 1 hour</li>
                <li>• Log every login attempt (IP, device, timestamp)</li>
                <li>• Log every admin action on a customer account</li>
                <li>• Invalidate all sessions on suspend/ban</li>
                <li>• Flag email + IP on ban</li>
              </ul>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-[#9ca3af]">
            <CheckCircle2 size={28} className="text-emerald-400" />
            <p className="text-[0.85rem] font-semibold text-[#5c5e62]">No events found</p>
            <p className="text-[0.75rem]">
              {filter === "all" ? "No security events recorded yet." : `No "${filter.replace(/_/g, " ")}" events match your filter.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {events.map(ev => (
              <EventRow key={ev.id} event={ev} onUnlock={handleUnlock} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !unavailable && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3.5">
            <p className="text-[0.75rem] text-[#9ca3af]">
              Page {meta.current_page} of {meta.last_page} · {meta.total.toLocaleString()} total
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f5f5f7] disabled:opacity-40"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, meta.last_page - 4));
                const n = start + i;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-[0.75rem] font-semibold transition ${
                      n === page
                        ? "bg-[#E85C1A] text-white"
                        : "border border-black/[0.08] text-[#5c5e62] hover:bg-[#f5f5f7]"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={page >= meta.last_page}
                onClick={() => setPage(p => p + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f5f5f7] disabled:opacity-40"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backend rules reference card */}
      <div className="mt-5 rounded-2xl border border-dashed border-[#e5e7eb] bg-white px-6 py-5">
        <p className="mb-3 text-[0.78rem] font-extrabold uppercase tracking-wide text-[#5c5e62]">Auto-Protection Rules (Backend)</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-[0.75rem] text-[#5c5e62]">
          <div className="flex items-start gap-2.5">
            <Lock size={13} className="mt-0.5 shrink-0 text-red-500" />
            <span><b className="text-[#1a1a1a]">5 failed logins</b> → account locked, admin alerted</span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldAlert size={13} className="mt-0.5 shrink-0 text-amber-500" />
            <span><b className="text-[#1a1a1a]">10+ failed logins / hour</b> → auto-suspend + flag as suspicious</span>
          </div>
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
            <span><b className="text-[#1a1a1a]">Suspicious accounts</b> shown in dashboard alert banner</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Ban size={13} className="mt-0.5 shrink-0 text-red-500" />
            <span><b className="text-[#1a1a1a]">Suspend / ban</b> → all active sessions invalidated immediately</span>
          </div>
          <div className="flex items-start gap-2.5">
            <KeyRound size={13} className="mt-0.5 shrink-0 text-blue-500" />
            <span><b className="text-[#1a1a1a]">Every login attempt</b> logged with IP, device, location, timestamp</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Settings size={13} className="mt-0.5 shrink-0 text-purple-500" />
            <span><b className="text-[#1a1a1a]">All admin actions</b> on customer accounts are audit-logged</span>
          </div>
        </div>
      </div>

    </div>
  );
}
