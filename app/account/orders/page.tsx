import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package, CreditCard, Landmark } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getCustomerFromCookie } from "@/lib/get-customer";
import type { ShipmentEvent, TradeDocument } from "@/lib/admin-api";

export const metadata: Metadata = {
  title: "My Orders",
  description: "View and track your Okelcor orders.",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  product_name: string;
  brand?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type Order = {
  ref: string;
  order_ref?: string;
  created_at: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  payment_method?: string;
  payment_status?: string;
  payment_url?: string | null;
  checkout_url?: string | null;
  carrier?: string;
  carrier_type?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  container_number?: string;
  tracking_status?: string;
  eta?: string;
  shipment_events?: ShipmentEvent[];
  declaration_required?: boolean | null;
  declaration_status?: "pending" | "signed" | "acknowledged" | null;
  declaration_signed_at?: string | null;
  declaration_signed_name?: string | null;
  country?: string | null;
  trade_documents?: TradeDocument[];
  // DOC-6 customer acceptance
  customer_acceptance_status?: "pending" | "accepted" | "rejected" | null;
  customer_accepted_at?: string | null;
  // DOC-7 payment milestones (customer-visible subset)
  payment_stage?: "pending_proforma" | "deposit_requested" | "deposit_paid" | "balance_due" | "balance_paid" | "shipment_released" | null;
  deposit_amount?: number | null;
  balance_amount?: number | null;
  deposit_paid_at?: string | null;
  balance_paid_at?: string | null;
  // Invoice (released tax invoice) — backend-computed, self-healed before response
  invoice_number?: string | null;
  invoice_available?: boolean;
  invoice_pending_release?: boolean;
  invoice_download_url?: string | null;
};

// ─── Status badge config ──────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<OrderStatus, { label: string; cls: string }> = {
  pending:    { label: "Pending",    cls: "bg-gray-100 text-gray-600" },
  confirmed:  { label: "Confirmed",  cls: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", cls: "bg-blue-100 text-blue-700" },
  shipped:    { label: "Shipped",    cls: "bg-orange-100 text-[#f4511e]" },
  delivered:  { label: "Delivered",  cls: "bg-green-100 text-green-700" },
  cancelled:  { label: "Cancelled",  cls: "bg-red-100 text-red-600" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchOrders(token: string, email: string): Promise<Order[]> {
  const API_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";

  const url = `${API_URL}/orders?email=${encodeURIComponent(email)}`;
  console.log("[orders] fetching:", url);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    console.log("[orders] status:", res.status, "data length:", Array.isArray(json.data) ? json.data.length : json);

    if (!res.ok) {
      console.error("[orders] API error:", res.status, json);
      return [];
    }

    return json.data ?? [];
  } catch (err) {
    console.error("[orders] fetch failed:", err);
    return [];
  }
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrdersPage() {
  const customer = await getCustomerFromCookie();
  if (!customer) redirect("/login?redirect=/account/orders");

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value ?? "";

  const orders = await fetchOrders(token, customer.email);

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[88px] sm:pt-[96px]">

        {/* Page header */}
        <div className="mb-6 sm:mb-8">
          <nav className="mb-3 flex items-center gap-1.5 text-[0.8rem] text-[var(--muted)] sm:mb-4 sm:text-[0.82rem]">
            <Link href="/" className="transition hover:text-[var(--foreground)]">Home</Link>
            <ChevronRight size={12} className="opacity-50" />
            <span className="font-medium text-[var(--foreground)]">My Orders</span>
          </nav>
          <h1 className="text-[1.6rem] font-extrabold tracking-tight text-[var(--foreground)] sm:text-2xl md:text-3xl">
            My Orders
          </h1>
          <p className="mt-1 text-[0.85rem] text-[var(--muted)] sm:text-[0.88rem]">{customer.email}</p>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center rounded-[22px] bg-[#efefef] px-6 py-14 text-center sm:px-8 sm:py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e0e0e0] sm:h-16 sm:w-16">
              <Package size={26} strokeWidth={1.5} className="text-[var(--muted)] sm:hidden" />
              <Package size={30} strokeWidth={1.5} className="hidden text-[var(--muted)] sm:block" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-[var(--foreground)] sm:mt-5 sm:text-xl">No orders yet</h2>
            <p className="mt-2 max-w-[300px] text-[0.88rem] text-[var(--muted)] sm:max-w-[340px] sm:text-[0.9rem]">
              When you place an order it will appear here.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex h-[44px] items-center rounded-full bg-[var(--primary)] px-6 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] sm:mt-6 sm:h-[46px] sm:px-7 sm:text-[0.9rem]"
            >
              Browse Catalogue
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[18px] bg-[#efefef] sm:rounded-[22px]">

            {/* ── Desktop / wide-tablet table (≥ 1024px) ── */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-black/[0.07]">
                    <th className="w-[180px] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] xl:px-6">Order Ref</th>
                    <th className="w-[110px] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] xl:px-6">Date</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] xl:px-6">Items</th>
                    <th className="w-[100px] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] xl:px-6">Total</th>
                    <th className="w-[150px] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] xl:px-6">Status</th>
                    <th className="w-[140px] px-5 py-4 text-right text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] xl:px-6" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => {
                    const paymentUrl = order.payment_url ?? order.checkout_url ?? null;
                    const showPayNow = order.payment_method === "stripe" && order.payment_status === "pending" && paymentUrl;
                    return (
                      <tr
                        key={order.ref}
                        className={`border-b border-black/[0.05] transition hover:bg-white/60 ${i % 2 === 0 ? "bg-white/30" : ""}`}
                      >
                        <td className="px-5 py-4 font-mono text-[0.88rem] font-bold text-[var(--foreground)] xl:px-6">
                          {order.ref}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[0.88rem] text-[var(--muted)] xl:px-6">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="max-w-[200px] px-5 py-4 xl:px-6">
                          <p className="truncate text-[0.88rem] text-[var(--muted)]">
                            <span className="font-medium text-[var(--foreground)]">
                              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </span>
                            {order.items[0] && (
                              <span>
                                {" · "}
                                {[order.items[0].brand, order.items[0].product_name].filter(Boolean).join(" ")}
                                {order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[0.88rem] font-semibold text-[var(--foreground)] xl:px-6">
                          €{Number(order.total).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 xl:px-6">
                          <div className="flex flex-col items-start gap-1.5">
                            <StatusBadge status={order.status} />
                            {order.payment_method === "stripe" && order.payment_status === "pending" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">
                                <CreditCard size={10} strokeWidth={2.5} />
                                Payment due
                              </span>
                            )}
                            {order.payment_method === "bank_transfer" && order.payment_status === "pending" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
                                <Landmark size={10} strokeWidth={2.5} />
                                Bank transfer
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right xl:px-6">
                          {showPayNow ? (
                            <a
                              href={paymentUrl!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-[0.8rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                            >
                              <CreditCard size={13} strokeWidth={2.2} /> Pay Now
                            </a>
                          ) : (
                            <Link
                              href={`/account/orders/${order.ref}`}
                              className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-[0.8rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                            >
                              Track Order <ChevronRight size={13} strokeWidth={2.2} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile / tablet cards (< 1024px) ── */}
            <div className="flex flex-col divide-y divide-black/[0.06] lg:hidden">
              {orders.map((order) => {
                const paymentUrl = order.payment_url ?? order.checkout_url ?? null;
                const showPayNow = order.payment_method === "stripe" && order.payment_status === "pending" && paymentUrl;
                const firstItem  = order.items[0];

                return (
                  <div key={order.ref} className="px-4 py-5 sm:px-6 sm:py-5">

                    {/* Top: ref + badges */}
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[0.88rem] font-bold text-[var(--foreground)] sm:text-[0.9rem]">
                          {order.ref}
                        </p>
                        <p className="mt-0.5 text-[0.76rem] text-[var(--muted)] sm:text-[0.78rem]">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusBadge status={order.status} />
                        {order.payment_method === "stripe" && order.payment_status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">
                            <CreditCard size={10} strokeWidth={2.5} />
                            Payment due
                          </span>
                        )}
                        {order.payment_method === "bank_transfer" && order.payment_status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
                            <Landmark size={10} strokeWidth={2.5} />
                            Bank transfer
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items preview */}
                    {firstItem && (
                      <p className="mt-2 truncate text-[0.82rem] text-[var(--muted)]">
                        <span className="font-medium text-[var(--foreground)]">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </span>
                        {" · "}
                        {[firstItem.brand, firstItem.product_name].filter(Boolean).join(" ")}
                        {order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}
                      </p>
                    )}

                    {/* Bottom: total + action */}
                    <div className="mt-3.5 flex items-center justify-between gap-3">
                      <p className="text-[1rem] font-extrabold text-[var(--foreground)] sm:text-[1.05rem]">
                        €{Number(order.total).toFixed(2)}
                      </p>
                      {showPayNow ? (
                        <a
                          href={paymentUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-[0.8rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                        >
                          <CreditCard size={13} strokeWidth={2.2} /> Pay Now
                        </a>
                      ) : (
                        <Link
                          href={`/account/orders/${order.ref}`}
                          className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-[0.8rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                        >
                          View Order <ChevronRight size={13} strokeWidth={2.2} />
                        </Link>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
