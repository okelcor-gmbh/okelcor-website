"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Eye, ChevronLeft, ChevronRight, X, ShoppingBag, ShoppingCart,
} from "lucide-react";
import type { AdminOrder } from "@/lib/admin-api";
import EmptyState from "@/components/ui/empty-state";

// ── Types ─────────────────────────────────────────────────────────────────────

type Meta = {
  total?: number;
  current_page?: number;
  last_page?: number;
};

type Props = {
  orders: AdminOrder[];
  meta: Meta;
  currentStatus: string;
  currentPaymentStatus: string;
  currentQ: string;
  currentPage: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["all", "pending", "confirmed", "awaiting_proforma", "shipped", "delivered", "cancelled"] as const;

const STATUS_LABEL: Record<string, string> = {
  pending:           "Pending",
  confirmed:         "Confirmed",
  awaiting_proforma: "Awaiting Proforma",
  shipped:           "Shipped",
  delivered:         "Delivered",
  cancelled:         "Cancelled",
};
const PAYMENT_STATUS_OPTIONS = ["all", "paid", "unpaid", "refunded"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:            "bg-amber-100 text-amber-700",
  confirmed:          "bg-blue-100 text-blue-700",
  awaiting_proforma:  "bg-indigo-100 text-indigo-700",
  shipped:            "bg-purple-100 text-purple-700",
  delivered:          "bg-emerald-100 text-emerald-700",
  cancelled:          "bg-red-100 text-red-600",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid:      "bg-emerald-100 text-emerald-700",
  unpaid:    "bg-amber-100 text-amber-700",
  refunded:  "bg-slate-100 text-slate-600",
};

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold capitalize ${PAYMENT_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function SourceBadge({ source }: { source?: string | null }) {
  if (source === "ebay") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[0.65rem] font-bold text-green-700">
        <ShoppingBag size={9} strokeWidth={2.5} />
        eBay
      </span>
    );
  }
  return null;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function shortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrdersTable({
  orders, meta, currentStatus, currentPaymentStatus, currentQ, currentPage,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(currentQ);

  const buildUrl = (overrides: {
    status?: string;
    paymentStatus?: string;
    q?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    const statusVal        = overrides.status        ?? currentStatus;
    const paymentStatusVal = overrides.paymentStatus ?? currentPaymentStatus;
    const qVal             = overrides.q             ?? q;
    const pageVal          = overrides.page          ?? 1;
    if (statusVal        && statusVal !== "all")        params.set("status",         statusVal);
    if (paymentStatusVal && paymentStatusVal !== "all") params.set("payment_status", paymentStatusVal);
    if (qVal.trim())                                    params.set("q",              qVal.trim());
    if (pageVal > 1)                                    params.set("page",           String(pageVal));
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ page: 1 }));
  };

  const lastPage = meta.last_page ?? 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < lastPage;

  return (
    <>
      {/* Search + filter row */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        {/* Search input */}
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by order ref or customer…"
              className="h-10 w-full rounded-xl border border-black/[0.09] bg-white pl-9 pr-4 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl bg-[#1a1a1a] px-4 text-[0.875rem] font-semibold text-white transition hover:bg-[#333]"
          >
            Search
          </button>
          {q && (
            <button
              type="button"
              onClick={() => { setQ(""); router.push(buildUrl({ q: "", page: 1 })); }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.09] bg-white text-[#5c5e62] transition hover:text-red-500"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Status dropdown — no value = show all, no default filter */}
        <select
          value={currentStatus === "all" ? "" : currentStatus}
          onChange={(e) => router.push(buildUrl({ status: e.target.value || "all", page: 1 }))}
          className="h-10 rounded-xl border border-black/[0.09] bg-white px-3 pr-8 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10 cursor-pointer"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        {/* Payment status dropdown */}
        <select
          value={currentPaymentStatus === "all" ? "" : currentPaymentStatus}
          onChange={(e) => router.push(buildUrl({ paymentStatus: e.target.value || "all", page: 1 }))}
          className="h-10 rounded-xl border border-black/[0.09] bg-white px-3 pr-8 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10 cursor-pointer"
        >
          <option value="">All payments</option>
          {PAYMENT_STATUS_OPTIONS.filter((ps) => ps !== "all").map((ps) => (
            <option key={ps} value={ps} className="capitalize">{ps.charAt(0).toUpperCase() + ps.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                {["Order Ref", "Customer", "Status", "Payment", "Total", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={ShoppingCart}
                      heading="No orders found"
                      description="Orders will appear here once customers place them, or try adjusting your filters."
                      compact
                    />
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="group transition hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[0.82rem] font-semibold text-[#1a1a1a]">
                        {order.order_ref}
                      </span>
                      {order.source === "ebay" && (
                        <div className="mt-0.5">
                          <SourceBadge source={order.source} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">{order.customer_name}</p>
                      <p className="text-[0.73rem] text-[#5c5e62]">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {order.payment_status && (
                          <PaymentStatusBadge status={order.payment_status} />
                        )}
                        <span className="text-[0.78rem] capitalize text-[#5c5e62]">
                          {order.payment_method ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[0.875rem] font-semibold text-[#1a1a1a]">
                      €{Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                      {shortDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#E85C1A]/10 hover:text-[#E85C1A]"
                        title="View order"
                      >
                        <Eye size={14} strokeWidth={2} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
            <p className="text-[0.78rem] text-[#5c5e62]">
              Page {currentPage} of {lastPage}
              {typeof meta.total === "number" && ` · ${meta.total} orders`}
            </p>
            <div className="flex gap-2">
              <Link
                href={hasPrev ? buildUrl({ page: currentPage - 1 }) : "#"}
                aria-disabled={!hasPrev}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition ${hasPrev ? "bg-white text-[#1a1a1a] hover:border-[#E85C1A] hover:text-[#E85C1A]" : "pointer-events-none bg-[#f5f5f5] text-[#ccc]"}`}
              >
                <ChevronLeft size={14} />
              </Link>
              <Link
                href={hasNext ? buildUrl({ page: currentPage + 1 }) : "#"}
                aria-disabled={!hasNext}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition ${hasNext ? "bg-white text-[#1a1a1a] hover:border-[#E85C1A] hover:text-[#E85C1A]" : "pointer-events-none bg-[#f5f5f5] text-[#ccc]"}`}
              >
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
