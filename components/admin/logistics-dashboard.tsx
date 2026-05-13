"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  PackageCheck,
  AlertTriangle,
  FileWarning,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Loader2,
  X,
} from "lucide-react";
import { canDo } from "@/lib/admin-permissions";

// ── Types ─────────────────────────────────────────────────────────────────────

type DocPresence = {
  proforma_invoice: boolean;
  commercial_invoice: boolean;
  packing_list: boolean;
  delivery_note: boolean;
  shipment_document: boolean;
};

type LogisticsOrder = {
  id: number;
  order_ref: string;
  customer_name: string;
  country?: string | null;
  status: string;
  payment_status?: string | null;
  documents: DocPresence;
  missing: string[];
  eu_declaration_status?: "pending" | "signed" | "acknowledged" | null;
  reverse_charge?: boolean;
  risk_level?: "low" | "medium" | "high" | null;
  next_action?: string | null;
};

type LogisticsSummary = {
  ready_for_shipment: number;
  missing_documents: number;
  eu_compliance_pending: number;
  completed: number;
};

type Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type DashboardData = {
  summary: LogisticsSummary;
  orders: LogisticsOrder[];
  pagination?: Pagination;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const DOC_ABBR: Record<string, string> = {
  proforma_invoice:    "PI",
  commercial_invoice:  "CI",
  packing_list:        "PL",
  delivery_note:       "DN",
  shipment_document:   "SD",
};

const DOC_KEYS = ["proforma_invoice", "commercial_invoice", "packing_list", "delivery_note", "shipment_document"] as const;
type DocKey = typeof DOC_KEYS[number];

const GENERATE_ROUTE: Partial<Record<DocKey, string>> = {
  proforma_invoice:   "proforma",
  commercial_invoice: "commercial-invoice",
  packing_list:       "packing-list",
  delivery_note:      "delivery-note",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700",
  processing: "bg-blue-50 text-blue-700",
  confirmed:  "bg-blue-50 text-blue-700",
  shipped:    "bg-purple-50 text-purple-700",
  delivered:  "bg-emerald-50 text-emerald-700",
  cancelled:  "bg-red-50 text-red-700",
  refunded:   "bg-gray-100 text-gray-600",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid:    "bg-emerald-50 text-emerald-700",
  unpaid:  "bg-red-50 text-red-700",
  partial: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  refunded: "bg-gray-100 text-gray-600",
};

const EU_DECL_COLORS: Record<string, string> = {
  pending:      "bg-amber-50 text-amber-700",
  signed:       "bg-blue-50 text-blue-700",
  acknowledged: "bg-emerald-50 text-emerald-700",
};

const RISK_COLORS: Record<string, string> = {
  low:    "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high:   "bg-red-50 text-red-700",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—";
}

// ── Summary card ──────────────────────────────────────────────────────────────

type SummaryCardProps = {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  accent: string;
};

function SummaryCard({ label, value, icon, accent }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[1.6rem] font-extrabold leading-none text-[#1a1a1a]">
          {value ?? "—"}
        </p>
        <p className="mt-0.5 text-[0.78rem] text-[#5c5e62]">{label}</p>
      </div>
    </div>
  );
}

// ── Document pills ────────────────────────────────────────────────────────────

function DocPills({ documents, missing }: { documents: DocPresence; missing: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {DOC_KEYS.map((key) => {
        const present = documents[key];
        const required = missing.includes(key);
        let cls: string;
        if (present) {
          cls = "bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (required) {
          cls = "bg-red-50 text-red-600 border-red-200";
        } else {
          cls = "bg-gray-100 text-gray-400 border-gray-200";
        }
        return (
          <span
            key={key}
            title={cap(key)}
            className={`rounded border px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide ${cls}`}
          >
            {DOC_ABBR[key]}
          </span>
        );
      })}
    </div>
  );
}

// ── Quick-generate button ─────────────────────────────────────────────────────

function GenBtn({
  orderId,
  docKey,
  busy,
  onGenerate,
}: {
  orderId: number;
  docKey: DocKey;
  busy: boolean;
  onGenerate: (orderId: number, docKey: DocKey) => void;
}) {
  const label = DOC_ABBR[docKey];
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onGenerate(orderId, docKey)}
      title={`Generate ${cap(docKey)}`}
      className="flex items-center gap-1 rounded border border-dashed border-[#E85C1A]/40 bg-orange-50 px-2 py-0.5 text-[0.68rem] font-semibold text-[#E85C1A] transition hover:border-[#E85C1A] hover:bg-orange-100 disabled:opacity-50"
    >
      {busy ? (
        <Loader2 size={10} className="animate-spin" />
      ) : (
        <FilePlus2 size={10} />
      )}
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LogisticsDashboard({ adminRole }: { adminRole: string }) {
  const canManage = canDo(adminRole, "trade_documents.manage");

  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [filterStatus,      setFilterStatus]      = useState("");
  const [filterMissingDoc,  setFilterMissingDoc]  = useState("");
  const [filterRisk,        setFilterRisk]        = useState("");
  const [filterRcOnly,      setFilterRcOnly]      = useState(false);
  const [page,              setPage]              = useState(1);

  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [genError,   setGenError]   = useState<string | null>(null);
  const genErrorTimer               = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildQs = useCallback(() => {
    const p = new URLSearchParams();
    if (filterStatus)     p.set("status",            filterStatus);
    if (filterMissingDoc) p.set("missing_document",  filterMissingDoc);
    if (filterRisk)       p.set("risk_level",         filterRisk);
    if (filterRcOnly)     p.set("reverse_charge_only", "1");
    if (page > 1)         p.set("page",              String(page));
    return p.toString();
  }, [filterStatus, filterMissingDoc, filterRisk, filterRcOnly, page]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = buildQs();
    try {
      const res = await fetch(`/api/admin/logistics/dashboard${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { message?: string };
        setError(j.message ?? `Error ${res.status}`);
        setData(null);
      } else {
        const j = await res.json() as { data?: DashboardData } & Partial<DashboardData>;
        setData(j.data ?? (j as DashboardData));
      }
    } catch {
      setError("Network error. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [buildQs]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  function resetFilters() {
    setFilterStatus("");
    setFilterMissingDoc("");
    setFilterRisk("");
    setFilterRcOnly(false);
    setPage(1);
  }

  function applyFilter(setter: (v: string) => void, val: string) {
    setter(val);
    setPage(1);
  }

  async function handleGenerate(orderId: number, docKey: DocKey) {
    const route = GENERATE_ROUTE[docKey];
    if (!route) return;
    const key = `${orderId}-${docKey}`;
    setGenerating((prev) => ({ ...prev, [key]: true }));
    setGenError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/trade-documents/${route}`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { message?: string };
        const msg = j.message ?? "Generation failed.";
        setGenError(msg);
        if (genErrorTimer.current) clearTimeout(genErrorTimer.current);
        genErrorTimer.current = setTimeout(() => setGenError(null), 5000);
      } else {
        await fetchData();
      }
    } catch {
      setGenError("Network error during generation.");
      if (genErrorTimer.current) clearTimeout(genErrorTimer.current);
      genErrorTimer.current = setTimeout(() => setGenError(null), 5000);
    } finally {
      setGenerating((prev) => ({ ...prev, [key]: false }));
    }
  }

  const summary   = data?.summary;
  const orders    = data?.orders ?? [];
  const pagMeta   = data?.pagination;
  const hasFilter = !!(filterStatus || filterMissingDoc || filterRisk || filterRcOnly);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Ready for Shipment"
          value={summary?.ready_for_shipment}
          icon={<PackageCheck size={20} strokeWidth={1.8} className="text-emerald-600" />}
          accent="bg-emerald-50"
        />
        <SummaryCard
          label="Missing Documents"
          value={summary?.missing_documents}
          icon={<FileWarning size={20} strokeWidth={1.8} className="text-red-500" />}
          accent="bg-red-50"
        />
        <SummaryCard
          label="EU Compliance Pending"
          value={summary?.eu_compliance_pending}
          icon={<AlertTriangle size={20} strokeWidth={1.8} className="text-amber-500" />}
          accent="bg-amber-50"
        />
        <SummaryCard
          label="Completed"
          value={summary?.completed}
          icon={<CheckCircle2 size={20} strokeWidth={1.8} className="text-blue-500" />}
          accent="bg-blue-50"
        />
      </div>

      {/* Gen error toast */}
      {genError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <span>{genError}</span>
          <button
            type="button"
            onClick={() => setGenError(null)}
            className="shrink-0 text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[0.07] bg-white p-4">
        <select
          value={filterStatus}
          onChange={(e) => applyFilter(setFilterStatus, e.target.value)}
          className="rounded-lg border border-black/[0.08] bg-[#f5f5f5] px-3 py-1.5 text-[0.83rem] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#E85C1A]/30"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filterMissingDoc}
          onChange={(e) => applyFilter(setFilterMissingDoc, e.target.value)}
          className="rounded-lg border border-black/[0.08] bg-[#f5f5f5] px-3 py-1.5 text-[0.83rem] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#E85C1A]/30"
        >
          <option value="">Any missing doc</option>
          <option value="proforma_invoice">Missing PI</option>
          <option value="commercial_invoice">Missing CI</option>
          <option value="packing_list">Missing PL</option>
          <option value="delivery_note">Missing DN</option>
          <option value="shipment_document">Missing SD</option>
        </select>

        <select
          value={filterRisk}
          onChange={(e) => applyFilter(setFilterRisk, e.target.value)}
          className="rounded-lg border border-black/[0.08] bg-[#f5f5f5] px-3 py-1.5 text-[0.83rem] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#E85C1A]/30"
        >
          <option value="">All risk levels</option>
          <option value="high">High risk</option>
          <option value="medium">Medium risk</option>
          <option value="low">Low risk</option>
        </select>

        <label className="flex cursor-pointer items-center gap-2 text-[0.83rem] text-[#1a1a1a] select-none">
          <input
            type="checkbox"
            checked={filterRcOnly}
            onChange={(e) => { setFilterRcOnly(e.target.checked); setPage(1); }}
            className="h-4 w-4 rounded accent-[#E85C1A]"
          />
          Reverse charge only
        </label>

        <div className="ml-auto flex items-center gap-2">
          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-[0.78rem] text-[#5c5e62] transition hover:bg-[#f0f2f5]"
            >
              <X size={12} />
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-[#E85C1A]/30 bg-orange-50 px-3 py-1.5 text-[0.78rem] font-semibold text-[#E85C1A] transition hover:bg-orange-100 disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">

        {loading && !data && (
          <div className="flex items-center justify-center gap-2 py-20 text-[0.83rem] text-[#5c5e62]">
            <Loader2 size={16} className="animate-spin" />
            Loading logistics data…
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <AlertTriangle size={28} className="text-red-400" />
            <p className="text-[0.85rem] font-semibold text-[#1a1a1a]">Failed to load</p>
            <p className="text-[0.8rem] text-[#5c5e62]">{error}</p>
            <button
              type="button"
              onClick={() => void fetchData()}
              className="mt-2 rounded-lg bg-[#E85C1A] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#d04e15]"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <CheckCircle2 size={28} className="text-emerald-400" />
            <p className="text-[0.85rem] font-semibold text-[#1a1a1a]">No orders found</p>
            <p className="text-[0.8rem] text-[#5c5e62]">
              {hasFilter ? "No orders match the selected filters." : "There are no active shipments to review."}
            </p>
            {hasFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 text-[0.8rem] text-[#E85C1A] underline hover:no-underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!error && orders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.82rem]">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#f8f8f8]">
                  <th className="px-4 py-3 font-semibold text-[#5c5e62]">Order</th>
                  <th className="px-4 py-3 font-semibold text-[#5c5e62]">Customer</th>
                  <th className="px-4 py-3 font-semibold text-[#5c5e62]">Country</th>
                  <th className="px-4 py-3 font-semibold text-[#5c5e62]">Status</th>
                  <th className="px-4 py-3 font-semibold text-[#5c5e62]">Payment</th>
                  <th className="px-4 py-3 font-semibold text-[#5c5e62]">Documents</th>
                  <th className="px-4 py-3 font-semibold text-[#5c5e62]">EU Decl.</th>
                  <th className="px-4 py-3 font-semibold text-[#5c5e62]">Risk</th>
                  <th className="px-4 py-3 font-semibold text-[#5c5e62]">Next Action</th>
                  {canManage && (
                    <th className="px-4 py-3 font-semibold text-[#5c5e62]">Generate</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {orders.map((order) => {
                  const missingGenerable = order.missing.filter(
                    (d): d is DocKey => d in GENERATE_ROUTE,
                  );
                  return (
                    <tr
                      key={order.id}
                      className={`transition hover:bg-[#fafafa] ${
                        order.risk_level === "high" ? "bg-red-50/30" : ""
                      }`}
                    >
                      {/* Order ref */}
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#1a1a1a]">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-[#E85C1A] hover:underline"
                        >
                          {order.order_ref}
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="max-w-[160px] truncate px-4 py-3 text-[#1a1a1a]">
                        {order.customer_name || "—"}
                      </td>

                      {/* Country */}
                      <td className="whitespace-nowrap px-4 py-3 text-[#5c5e62]">
                        {order.country ?? "—"}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold ${
                            ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {cap(order.status)}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {order.payment_status ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold ${
                              PAYMENT_STATUS_COLORS[order.payment_status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {cap(order.payment_status)}
                          </span>
                        ) : (
                          <span className="text-[#5c5e62]">—</span>
                        )}
                      </td>

                      {/* Documents */}
                      <td className="px-4 py-3">
                        <DocPills documents={order.documents} missing={order.missing} />
                      </td>

                      {/* EU Declaration */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {order.eu_declaration_status ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold ${
                              EU_DECL_COLORS[order.eu_declaration_status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {cap(order.eu_declaration_status)}
                          </span>
                        ) : order.reverse_charge ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[0.72rem] font-semibold text-amber-700">
                            Required
                          </span>
                        ) : (
                          <span className="text-[0.72rem] text-[#5c5e62]">N/A</span>
                        )}
                      </td>

                      {/* Risk */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {order.risk_level ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold ${
                              RISK_COLORS[order.risk_level]
                            }`}
                          >
                            {cap(order.risk_level)}
                          </span>
                        ) : (
                          <span className="text-[0.72rem] text-[#5c5e62]">—</span>
                        )}
                      </td>

                      {/* Next action */}
                      <td className="max-w-[180px] px-4 py-3 text-[#5c5e62]">
                        {order.next_action ?? "—"}
                      </td>

                      {/* Quick-generate */}
                      {canManage && (
                        <td className="px-4 py-3">
                          {missingGenerable.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {missingGenerable.map((docKey) => (
                                <GenBtn
                                  key={docKey}
                                  orderId={order.id}
                                  docKey={docKey}
                                  busy={generating[`${order.id}-${docKey}`] ?? false}
                                  onGenerate={handleGenerate}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-[0.72rem] text-emerald-600">Complete</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagMeta && pagMeta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
            <p className="text-[0.78rem] text-[#5c5e62]">
              Page {pagMeta.current_page} of {pagMeta.last_page}
              &ensp;·&ensp;{pagMeta.total} orders
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagMeta.current_page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: pagMeta.last_page }, (_, i) => i + 1)
                .filter((p) =>
                  p === 1 ||
                  p === pagMeta.last_page ||
                  Math.abs(p - pagMeta.current_page) <= 1,
                )
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push("…");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-[0.78rem] text-[#5c5e62]">…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item as number)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-[0.78rem] font-medium transition ${
                        item === pagMeta.current_page
                          ? "bg-[#E85C1A] text-white"
                          : "border border-black/[0.08] text-[#1a1a1a] hover:bg-[#f0f2f5]"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
              <button
                type="button"
                disabled={pagMeta.current_page >= pagMeta.last_page || loading}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[0.75rem] text-[#5c5e62]">
        <span className="font-semibold text-[#1a1a1a]">Document pills:</span>
        <span className="flex items-center gap-1.5">
          <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">PI</span>
          Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 font-bold text-red-600">CI</span>
          Required but missing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-bold text-gray-400">PL</span>
          Not required
        </span>
        <span className="ml-2 text-[#5c5e62]">PI = Proforma · CI = Commercial Invoice · PL = Packing List · DN = Delivery Note · SD = Shipment Doc</span>
      </div>

    </div>
  );
}
