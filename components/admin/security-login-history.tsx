"use client";

import { useCallback, useEffect, useState } from "react";
import {
  History,
  Loader2,
  ShieldCheck,
  ShieldOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type LoginStatus = "success" | "failed" | "2fa_required";

type LoginEntry = {
  id: number;
  admin_id: number;
  admin_name: string;
  admin_email: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  status: LoginStatus;
  two_factor_used: boolean;
  created_at: string;
};

type Meta = {
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDT(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function parseDevice(ua?: string): string {
  if (!ua) return "—";
  if (/iPhone|iPad/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}

function parseBrowser(ua?: string): string {
  if (!ua) return "—";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua)) return "Opera";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  if (/Chrome\//i.test(ua)) return "Chrome";
  return "Browser";
}

const STATUS_META: Record<
  LoginStatus,
  { icon: React.ElementType; label: string; cls: string }
> = {
  success:      { icon: CheckCircle2, label: "Success",      cls: "text-emerald-600" },
  failed:       { icon: XCircle,      label: "Failed",       cls: "text-red-600" },
  "2fa_required": { icon: AlertCircle, label: "2FA Required", cls: "text-amber-600" },
};

const PER_PAGE = 20;

// ── Component ──────────────────────────────────────────────────────────────────

export default function SecurityLoginHistory() {
  const [entries, setEntries] = useState<LoginEntry[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    current_page: 1,
    last_page: 1,
    per_page: PER_PAGE,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchHistory = useCallback(
    async (pg: number, from: string, to: string) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(pg), per_page: String(PER_PAGE) });
      if (from) params.set("date_from", from);
      if (to) params.set("date_to", to);

      try {
        const res = await fetch(
          `/api/admin/security/login-history?${params}`,
          { cache: "no-store" }
        );
        const json = await res.json().catch(() => null);

        if (!json || json._unavailable) {
          setUnavailable(true);
          setEntries([]);
        } else {
          setUnavailable(false);
          setEntries(json.data ?? []);
          setMeta(
            json.meta ?? {
              total: 0,
              current_page: pg,
              last_page: 1,
              per_page: PER_PAGE,
            }
          );
        }
      } catch {
        setUnavailable(true);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchHistory(page, dateFrom, dateTo);
  }, [fetchHistory, page, dateFrom, dateTo]);

  const handleDateFilter = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-5 py-4">
        <History size={15} className="text-[#5c5e62]" />
        <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">
          Admin Login History
        </p>
        {!unavailable && meta.total > 0 && (
          <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[0.72rem] font-semibold text-[#5c5e62]">
            {meta.total.toLocaleString()}
          </span>
        )}

        {/* Date filters */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <CalendarDays size={13} className="text-[#9ca3af]" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFilter(e.target.value, dateTo)}
            className="h-8 rounded-lg border border-black/[0.09] bg-[#fafafa] px-2.5 text-[0.75rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A] focus:ring-1 focus:ring-[#E85C1A]/20"
            title="From date"
          />
          <span className="text-[0.72rem] text-[#9ca3af]">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateFilter(dateFrom, e.target.value)}
            className="h-8 rounded-lg border border-black/[0.09] bg-[#fafafa] px-2.5 text-[0.75rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A] focus:ring-1 focus:ring-[#E85C1A]/20"
            title="To date"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => handleDateFilter("", "")}
              className="text-[0.72rem] text-[#9ca3af] underline hover:text-[#5c5e62]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-[#9ca3af]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-[0.82rem]">Loading history…</span>
        </div>
      ) : unavailable ? (
        <div className="px-5 py-12 text-center">
          <History size={28} className="mx-auto mb-3 text-[#d1d5db]" />
          <p className="text-[0.85rem] font-semibold text-[#5c5e62]">
            Login history not available
          </p>
          <p className="mt-1 text-[0.75rem] text-[#9ca3af]">
            Implement{" "}
            <code className="rounded bg-[#f5f5f7] px-1.5 py-0.5 font-mono">
              GET /admin/security/login-history
            </code>{" "}
            on the backend to enable this view.
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-[#9ca3af]">
          <CheckCircle2 size={26} className="text-emerald-400" />
          <p className="text-[0.85rem] font-semibold text-[#5c5e62]">
            No login records found
          </p>
          <p className="text-[0.75rem]">
            {dateFrom || dateTo
              ? "Try clearing the date filter."
              : "No admin logins have been recorded yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                <th className="px-5 py-3 text-left text-[0.72rem] font-bold uppercase tracking-wide text-[#5c5e62]">
                  Admin
                </th>
                <th className="px-5 py-3 text-left text-[0.72rem] font-bold uppercase tracking-wide text-[#5c5e62]">
                  IP
                </th>
                <th className="px-5 py-3 text-left text-[0.72rem] font-bold uppercase tracking-wide text-[#5c5e62]">
                  Device / Browser
                </th>
                <th className="px-5 py-3 text-left text-[0.72rem] font-bold uppercase tracking-wide text-[#5c5e62]">
                  Time
                </th>
                <th className="px-5 py-3 text-left text-[0.72rem] font-bold uppercase tracking-wide text-[#5c5e62]">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-[0.72rem] font-bold uppercase tracking-wide text-[#5c5e62]">
                  2FA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {entries.map((entry) => {
                const s = STATUS_META[entry.status] ?? STATUS_META.failed;
                const StatusIcon = s.icon;
                return (
                  <tr key={entry.id} className="hover:bg-[#fafafa]">
                    <td className="px-5 py-3.5">
                      <p className="text-[0.82rem] font-semibold text-[#1a1a1a]">
                        {entry.admin_name}
                      </p>
                      <p className="text-[0.72rem] text-[#9ca3af]">
                        {entry.admin_email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[0.78rem] text-[#5c5e62]">
                        {entry.ip_address ?? "—"}
                      </p>
                      {entry.location && (
                        <p className="text-[0.68rem] text-[#9ca3af]">
                          {entry.location}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[0.78rem] text-[#5c5e62]">
                        {parseDevice(entry.user_agent)}
                      </p>
                      <p className="text-[0.68rem] text-[#9ca3af]">
                        {parseBrowser(entry.user_agent)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-[0.78rem] text-[#5c5e62]">
                      {fmtDT(entry.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`flex items-center gap-1.5 text-[0.78rem] font-semibold ${s.cls}`}
                      >
                        <StatusIcon size={13} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {entry.two_factor_used ? (
                        <span className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-emerald-600">
                          <ShieldCheck size={13} />
                          Yes
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[0.75rem] text-[#9ca3af]">
                          <ShieldOff size={13} />
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !unavailable && meta.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3.5">
          <p className="text-[0.75rem] text-[#9ca3af]">
            Page {meta.current_page} of {meta.last_page} ·{" "}
            {meta.total.toLocaleString()} total
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f5f5f7] disabled:opacity-40"
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from(
              { length: Math.min(5, meta.last_page) },
              (_, i) => {
                const start = Math.max(
                  1,
                  Math.min(page - 2, meta.last_page - 4)
                );
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
              }
            )}
            <button
              type="button"
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f5f5f7] disabled:opacity-40"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
