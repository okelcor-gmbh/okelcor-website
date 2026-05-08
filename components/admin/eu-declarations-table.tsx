"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, Clock, AlertTriangle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EuDeclaration = {
  id: number;
  order_id: number;
  order_ref: string;
  customer_name: string;
  company_name?: string | null;
  email?: string | null;
  country?: string | null;
  vat_number?: string | null;
  status: "pending" | "signed" | "acknowledged";
  signed_at?: string | null;
  created_at: string;
  reminder_count?: number | null;
  last_reminder_at?: string | null;
};

type StatusFilter = "all" | "pending" | "signed" | "acknowledged";
type SummaryTab   = StatusFilter | "overdue";

interface Props {
  declarations: EuDeclaration[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function getDaysPending(dec: EuDeclaration): number | null {
  if (dec.status === "pending") return daysSince(dec.created_at);
  if (dec.status === "signed") {
    return dec.signed_at ? daysSince(dec.signed_at) : daysSince(dec.created_at);
  }
  return null; // acknowledged — no longer pending
}

function isOverdue(dec: EuDeclaration): boolean {
  return dec.status === "pending" && (getDaysPending(dec) ?? 0) > 14;
}

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

function getRowBg(dec: EuDeclaration): string {
  const days = getDaysPending(dec);
  switch (dec.status) {
    case "acknowledged": return "bg-emerald-50";
    case "signed":       return "bg-sky-50";
    case "pending":
      if (days !== null && days > 30) return "bg-red-50";
      if (days !== null && days > 14) return "bg-amber-50";
      return "bg-sky-50";
    default: return "";
  }
}

const STATUS_BADGE: Record<string, string> = {
  pending:      "bg-amber-100 text-amber-700",
  signed:       "bg-blue-100 text-blue-700",
  acknowledged: "bg-emerald-100 text-emerald-700",
};

const TABS: { key: SummaryTab; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "pending",      label: "Pending" },
  { key: "signed",       label: "Signed" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "overdue",      label: "Overdue" },
];

const TABLE_HEADERS = [
  "Order Ref",
  "Customer / Company",
  "Country",
  "Status",
  "Days Pending",
  "Reminders",
  "Last Reminder",
  "Signed",
  "Created",
  "",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function EuDeclarationsTable({ declarations }: Props) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [overdueOnly,  setOverdueOnly]  = useState(false);

  // ── Counts for summary tabs ──────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:          declarations.length,
    pending:      declarations.filter(d => d.status === "pending").length,
    signed:       declarations.filter(d => d.status === "signed").length,
    acknowledged: declarations.filter(d => d.status === "acknowledged").length,
    overdue:      declarations.filter(isOverdue).length,
  }), [declarations]);

  const activeTab: SummaryTab = overdueOnly ? "overdue" : statusFilter;

  function handleTab(tab: SummaryTab) {
    if (tab === "overdue") {
      setStatusFilter("pending");
      setOverdueOnly(true);
    } else {
      setStatusFilter(tab as StatusFilter);
      setOverdueOnly(false);
    }
    setSearch("");
  }

  const hasFilters = search.trim() !== "" || statusFilter !== "all" || overdueOnly;

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setOverdueOnly(false);
  }

  // ── Filtered rows ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return declarations.filter(dec => {
      if (statusFilter !== "all" && dec.status !== statusFilter) return false;
      if (overdueOnly && !isOverdue(dec)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hit = [
          dec.order_ref,
          dec.customer_name,
          dec.company_name,
          dec.email,
          dec.country,
        ].some(v => v?.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [declarations, statusFilter, overdueOnly, search]);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Summary tabs ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label }) => {
          const count  = counts[key];
          const active = activeTab === key;
          const danger = key === "overdue";
          return (
            <button
              key={key}
              onClick={() => handleTab(key)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition ${
                active
                  ? danger
                    ? "bg-red-600 text-white"
                    : "bg-[#E85C1A] text-white"
                  : "border border-black/[0.09] bg-white text-[#1a1a1a] hover:bg-[#f5f5f5]"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[0.68rem] font-bold ${
                active ? "bg-white/25 text-white" : "bg-[#f0f0f0] text-[#5c5e62]"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">

        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Order ref, customer, country…"
            className="w-full rounded-full border border-black/[0.1] bg-[#fafafa] py-2 pl-8 pr-4 text-[0.83rem] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#E85C1A]/40 focus:outline-none focus:ring-2 focus:ring-[#E85C1A]/10"
          />
        </div>

        {/* Status select */}
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value as StatusFilter);
            setOverdueOnly(false);
          }}
          className="rounded-full border border-black/[0.1] bg-[#fafafa] px-4 py-2 text-[0.83rem] text-[#1a1a1a] focus:border-[#E85C1A]/40 focus:outline-none focus:ring-2 focus:ring-[#E85C1A]/10"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="signed">Signed</option>
          <option value="acknowledged">Acknowledged</option>
        </select>

        {/* Overdue toggle */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={e => {
              setOverdueOnly(e.target.checked);
              if (e.target.checked) setStatusFilter("pending");
            }}
            className="h-4 w-4 rounded accent-[#E85C1A]"
          />
          <span className="text-[0.83rem] font-medium text-[#1a1a1a]">Overdue only</span>
          {counts.overdue > 0 && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[0.68rem] font-bold text-red-700">
              {counts.overdue}
            </span>
          )}
        </label>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:text-[#1a1a1a]"
          >
            <X size={12} strokeWidth={2.5} />
            Clear
          </button>
        )}
      </div>

      {/* ── Table / Empty states ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

        {filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            {declarations.length === 0 ? (
              /* Truly empty — no declarations at all */
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f5] text-2xl">
                  📋
                </div>
                <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">
                  No EU declarations yet
                </p>
                <p className="max-w-xs text-[0.8rem] text-[#5c5e62]">
                  Declarations appear here once intra-community B2B orders requiring
                  Gelangensbestätigung are created.
                </p>
              </>
            ) : (
              /* Filtered empty */
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f5]">
                  <Search size={20} className="text-[#9ca3af]" strokeWidth={1.8} />
                </div>
                <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">
                  No declarations match your filters
                </p>
                <p className="text-[0.8rem] text-[#5c5e62]">
                  Try adjusting or clearing the active filters.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-black/[0.09] bg-white px-4 py-1.5 text-[0.8rem] font-semibold text-[#1a1a1a] transition hover:border-[#E85C1A]/40 hover:text-[#E85C1A]"
                >
                  <X size={12} strokeWidth={2.5} />
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {TABLE_HEADERS.map((h, i) => (
                    <th
                      key={`${h}-${i}`}
                      className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filtered.map(dec => {
                  const days     = getDaysPending(dec);
                  const overdue  = isOverdue(dec);
                  const critical = dec.status === "pending" && (days ?? 0) > 30;

                  return (
                    <tr key={dec.id} className={getRowBg(dec)}>

                      {/* Order Ref */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${dec.order_ref}`}
                          className="font-mono text-[0.83rem] font-semibold text-[#E85C1A] hover:underline"
                        >
                          {dec.order_ref}
                        </Link>
                      </td>

                      {/* Customer / Company */}
                      <td className="px-4 py-3">
                        <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">
                          {dec.customer_name}
                        </p>
                        {dec.company_name && (
                          <p className="text-[0.75rem] text-[#5c5e62]">{dec.company_name}</p>
                        )}
                      </td>

                      {/* Country */}
                      <td className="px-4 py-3 text-[0.875rem] text-[#1a1a1a]">
                        {dec.country ?? "—"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold capitalize ${STATUS_BADGE[dec.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {dec.status}
                        </span>
                      </td>

                      {/* Days Pending + Overdue badge */}
                      <td className="px-4 py-3">
                        {days === null ? (
                          <span className="text-[0.83rem] text-[#5c5e62]">—</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[0.875rem] font-bold ${
                              critical ? "text-red-700"
                              : overdue ? "text-amber-700"
                              : "text-[#1a1a1a]"
                            }`}>
                              {days}d
                            </span>
                            {critical && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[0.68rem] font-bold text-red-700">
                                <AlertTriangle size={9} strokeWidth={2.5} />
                                Critical
                              </span>
                            )}
                            {!critical && overdue && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-bold text-amber-700">
                                <Clock size={9} strokeWidth={2.5} />
                                Overdue
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Reminder Count */}
                      <td className="px-4 py-3 text-[0.875rem]">
                        {dec.reminder_count != null ? (
                          <span className="font-semibold text-[#1a1a1a]">{dec.reminder_count}</span>
                        ) : (
                          <span className="text-[#5c5e62]">—</span>
                        )}
                      </td>

                      {/* Last Reminder */}
                      <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                        {shortDate(dec.last_reminder_at)}
                      </td>

                      {/* Signed */}
                      <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                        {shortDate(dec.signed_at)}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                        {shortDate(dec.created_at)}
                      </td>

                      {/* View */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/eu-declarations/${dec.id}`}
                          className="inline-flex h-7 items-center rounded-full border border-black/[0.09] bg-white px-3 text-[0.75rem] font-semibold text-[#1a1a1a] transition hover:border-[#E85C1A]/40 hover:text-[#E85C1A]"
                        >
                          View
                        </Link>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
