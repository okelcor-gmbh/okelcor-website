import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Clock, Truck, Receipt } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import InvoiceDownloadButton from "@/components/account/invoice-download-button";
import DeliveryTracking from "@/components/account/delivery-tracking";
import ShipmentTracker from "@/components/account/shipment-tracker";
import OrderPaymentCard from "@/components/account/order-payment-card";
import EntryCertificateCard from "@/components/account/entry-certificate-card";
import DeliveryConfirmationCard from "@/components/account/delivery-confirmation-card";
import TradeDocumentsCard from "@/components/account/trade-documents-card";
import OrderConfirmationAcceptance from "@/components/account/order-confirmation-acceptance";
import PaymentMilestoneProgress from "@/components/account/payment-milestone-progress";
import { getCustomerFromCookie } from "@/lib/get-customer";
import { StatusBadge, formatDate, type Order, type OrderStatus } from "../page";

// ─── Timeline config ──────────────────────────────────────────────────────────

const TIMELINE_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending",   label: "Order Placed" },
  { key: "confirmed", label: "Confirmed"    },
  { key: "shipped",   label: "Shipped"      },
  { key: "delivered", label: "Delivered"    },
];

const STEP_ORDER: Record<OrderStatus, number> = {
  pending:    0,
  confirmed:  1,
  processing: 1,  // maps to same step as confirmed
  shipped:    2,
  delivered:  3,
  cancelled: -1,
};

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchOrder(ref: string, token?: string): Promise<Order | null> {
  const API_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";

  // When a token is present, prefer the auth endpoint so the backend can
  // include customer-visible trade documents (order_confirmation, proforma, etc.).
  // If the auth endpoint is unavailable or returns any error (including 404 from
  // a not-yet-deployed route), fall back to the public endpoint so the page
  // still renders — the trade-documents fallback fetch below will retry.
  if (token) {
    try {
      const res = await fetch(`${API_URL}/auth/orders/${ref}`, {
        cache: "no-store",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) return json.data ?? null;
      // Auth endpoint failed — fall through to public endpoint below
    } catch {
      // Network error — fall through
    }
  }

  // Fallback to /orders/{ref} — mirrors the original working fetch: send the
  // token here too, because the backend uses it to verify ownership and may
  // return 404/401 for unauthenticated requests even on the "public" path.
  try {
    const res = await fetch(`${API_URL}/orders/${ref}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function fetchTradeDocuments(ref: string, token: string) {
  const API_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";

  try {
    const res = await fetch(`${API_URL}/auth/orders/${ref}/trade-documents`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    // Backend may wrap in { data: [...] } or return array directly
    const raw = json.data ?? json;
    return Array.isArray(raw) ? raw : null;
  } catch {
    return null;
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ ref: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params;
  return { title: `Order ${ref}` };
}

// ─── Timeline component ───────────────────────────────────────────────────────

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 sm:px-5 sm:py-4">
        <p className="text-[0.88rem] font-semibold text-red-700">
          This order has been cancelled.
        </p>
      </div>
    );
  }

  const currentIdx = STEP_ORDER[status] ?? 0;

  return (
    <>
      {/* ── Vertical timeline (mobile < sm) ── */}
      <div className="flex flex-col gap-0 sm:hidden">
        {TIMELINE_STEPS.map((step, i) => {
          const stepIdx   = STEP_ORDER[step.key] ?? i;
          const isDone    = stepIdx < currentIdx;
          const isCurrent = stepIdx === currentIdx;
          const isLast    = i === TIMELINE_STEPS.length - 1;

          return (
            <div key={step.key} className="flex items-stretch gap-3">
              {/* Left: circle + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold text-[0.75rem] transition-colors",
                    isDone
                      ? "border-green-500 bg-green-500 text-white"
                      : isCurrent
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-black/10 bg-white text-[var(--muted)]",
                  ].join(" ")}
                >
                  {isDone || isCurrent ? "✓" : i + 1}
                </div>
                {!isLast && (
                  <div className={`w-[2px] flex-1 my-1 transition-colors ${isDone ? "bg-[var(--primary)]" : "bg-black/10"}`} />
                )}
              </div>

              {/* Right: label */}
              <p
                className={[
                  "pb-4 pt-1.5 text-[0.85rem] font-semibold leading-none",
                  isCurrent ? "text-[var(--primary)]" : isDone ? "text-green-600" : "text-[var(--muted)]",
                ].join(" ")}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Horizontal timeline (sm+) ── */}
      <div className="hidden sm:flex items-start gap-0">
        {TIMELINE_STEPS.map((step, i) => {
          const stepIdx   = STEP_ORDER[step.key] ?? i;
          const isDone    = stepIdx < currentIdx;
          const isCurrent = stepIdx === currentIdx;
          const isLast    = i === TIMELINE_STEPS.length - 1;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div className={`h-[3px] flex-1 transition-colors ${isDone || isCurrent ? "bg-[var(--primary)]" : "bg-black/10"}`} />
                )}

                <div
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-bold text-[0.78rem] transition-colors",
                    isDone
                      ? "border-green-500 bg-green-500 text-white"
                      : isCurrent
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-black/10 bg-white text-[var(--muted)]",
                  ].join(" ")}
                >
                  {isDone || isCurrent ? "✓" : i + 1}
                </div>

                {!isLast && (
                  <div className={`h-[3px] flex-1 transition-colors ${isDone ? "bg-[var(--primary)]" : "bg-black/10"}`} />
                )}
              </div>

              <p
                className={[
                  "mt-2 text-center text-[0.75rem] font-semibold",
                  isCurrent ? "text-[var(--primary)]" : isDone ? "text-green-600" : "text-[var(--muted)]",
                ].join(" ")}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Invoice card ───────────────────────────────────────────────────────────────
// State → UI mapping per the backend contract:
//   invoice_available        → download button
//   invoice_pending_release  → "pending" message, paired with EU-certificate guidance
//   both false               → no invoice affordance (unpaid / pre-invoice)

function InvoiceCard({ order }: { order: Order }) {
  // Parse the numeric invoice id from the backend download URL so we can route
  // through our authenticated proxy (/api/account/invoices/{id}/download).
  const invoiceId = order.invoice_download_url?.match(/invoices\/(\d+)\/download/)?.[1] ?? null;

  if (order.invoice_available && invoiceId) {
    return (
      <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
        <div className="mb-3 flex items-center gap-2 sm:mb-4">
          <Receipt size={16} strokeWidth={1.9} className="text-[var(--primary)] sm:hidden" />
          <Receipt size={18} strokeWidth={1.9} className="hidden text-[var(--primary)] sm:block" />
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
            Invoice
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono font-semibold text-[var(--foreground)]">
              {order.invoice_number ?? "Tax invoice"}
            </p>
            <p className="text-[0.8rem] text-[var(--muted)]">Your tax invoice is ready to download.</p>
          </div>
          <InvoiceDownloadButton invoiceId={invoiceId} label="Download invoice" />
        </div>
      </div>
    );
  }

  if (order.invoice_pending_release) {
    const hint = order.declaration_required
      ? order.declaration_status === "signed"
        ? "We've received your EU entry certificate and are finalising your invoice."
        : order.declaration_status === "acknowledged"
        ? "Your certificate is confirmed — your invoice will be available here shortly."
        : "Please sign your EU entry certificate above to release your invoice."
      : "Your invoice is being prepared and will be available here shortly.";

    return (
      <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
        <div className="flex items-start gap-3">
          <Clock size={18} strokeWidth={1.9} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-[0.9rem] font-bold text-[var(--foreground)]">Invoice pending</p>
            <p className="mt-1 text-[0.83rem] leading-relaxed text-[var(--muted)]">{hint}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrderDetailPage({ params }: Props) {
  const { ref } = await params;
  const customer = await getCustomerFromCookie();
  if (!customer) redirect(`/login?redirect=/account/orders/${ref}`);

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  const order = await fetchOrder(ref, token);
  if (!order) {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="tesla-shell pb-16 pt-[88px] sm:pt-[96px]">
          <Link
            href="/account/orders"
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[0.82rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0] sm:mb-6 sm:text-[0.85rem]"
          >
            <ChevronLeft size={15} strokeWidth={2.2} /> My Orders
          </Link>
          <div className="rounded-[18px] bg-[#efefef] p-6 sm:rounded-[22px] sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
              Order not found
            </p>
            <p className="mt-2 text-[0.9rem] text-[var(--muted)]">
              We couldn&apos;t load order{" "}
              <span className="font-mono font-semibold text-[var(--foreground)]">{ref}</span>.
              It may not exist or you may not have access to it.
            </p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // If the order endpoint didn't include trade_documents (undefined), try the
  // dedicated /auth/orders/{ref}/trade-documents endpoint as a fallback.
  if (order.trade_documents === undefined && token) {
    const docs = await fetchTradeDocuments(ref, token);
    if (docs !== null) order.trade_documents = docs;
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[88px] sm:pt-[96px]">

        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-[0.8rem] text-[var(--muted)] sm:mb-6 sm:text-[0.82rem]">
          <Link href="/" className="transition hover:text-[var(--foreground)]">Home</Link>
          <span className="opacity-40">/</span>
          <Link href="/account/orders" className="transition hover:text-[var(--foreground)]">My Orders</Link>
          <span className="opacity-40">/</span>
          <span className="truncate font-medium text-[var(--foreground)]">{ref}</span>
        </nav>

        {/* Back button */}
        <Link
          href="/account/orders"
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[0.82rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0] sm:mb-6 sm:text-[0.85rem]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} /> Back to Orders
        </Link>

        <div className="flex flex-col gap-4 sm:gap-5">

          {/* ── Order summary header ── */}
          <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
                  Order Reference
                </p>
                <p className="mt-1 truncate font-mono text-[1.15rem] font-extrabold tracking-wide text-[var(--foreground)] sm:text-[1.35rem]">
                  {order.ref}
                </p>
                <p className="mt-1 text-[0.8rem] text-[var(--muted)] sm:text-[0.85rem]">
                  Placed on {formatDate(order.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {order.payment_status === "paid" ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-green-700">
                    Paid
                  </span>
                ) : order.payment_status === "pending" ? (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600">
                    Pending
                  </span>
                ) : (
                  <StatusBadge status={order.status} />
                )}
                <p className="text-[1.1rem] font-extrabold text-[var(--foreground)] sm:text-[1.25rem]">
                  €{Number(order.total).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* ── Acceptance banner (DOC-6) ── */}
          {(order.customer_acceptance_status === "pending" ||
            order.customer_acceptance_status === "rejected") && (
            <OrderConfirmationAcceptance
              orderRef={order.ref}
              initialStatus={order.customer_acceptance_status}
            />
          )}

          {(() => {
            // Before acceptance, suppress all payment blocks and the proforma document.
            // Exception: if payment is already paid (edge-case / legacy), always show confirmation.
            const acceptancePending = order.customer_acceptance_status === "pending";
            const paymentIsPaid     = order.payment_status === "paid";

            return (
              <>
                {/* ── Payment ── */}
                {order.payment_status && (paymentIsPaid || !acceptancePending) && (
                  <OrderPaymentCard
                    orderRef={order.ref}
                    paymentMethod={order.payment_method}
                    paymentStatus={order.payment_status}
                    paymentStage={order.payment_stage ?? undefined}
                    depositAmount={order.deposit_amount ?? undefined}
                    balanceAmount={order.balance_amount ?? undefined}
                  />
                )}

                {/* ── Payment milestones progress (DOC-7) ── */}
                {!acceptancePending &&
                  order.payment_stage &&
                  order.payment_stage !== "pending_proforma" && (
                  <PaymentMilestoneProgress
                    paymentStage={order.payment_stage}
                    depositAmount={order.deposit_amount}
                    balanceAmount={order.balance_amount}
                    depositPaidAt={order.deposit_paid_at}
                    balancePaidAt={order.balance_paid_at}
                  />
                )}

                {/* ── Delivery Confirmation ── */}
                {order.status === "delivered" && (
                  <DeliveryConfirmationCard
                    declarationRequired={order.declaration_required}
                    declarationStatus={order.declaration_status}
                  />
                )}

                {/* ── EU Entry Certificate ── */}
                {order.declaration_required === true && (
                  <EntryCertificateCard
                    orderRef={order.ref}
                    orderCountry={order.country}
                    status={order.declaration_status}
                    signedAt={order.declaration_signed_at}
                    signedName={order.declaration_signed_name}
                    paymentStatus={order.payment_status}
                    orderStatus={order.status}
                  />
                )}

                {/* ── Invoice (download / pending release) ── */}
                <InvoiceCard order={order} />

                {/* ── Trade Documents ── */}
                {order.trade_documents !== undefined && (
                  <TradeDocumentsCard
                    documents={order.trade_documents}
                    declarationRequired={order.declaration_required}
                    declarationStatus={order.declaration_status}
                    acceptancePending={acceptancePending}
                  />
                )}
              </>
            );
          })()}

          {/* ── Status timeline ── */}
          <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:mb-6 sm:text-[11px]">
              Order Status
            </p>
            <StatusTimeline status={order.status} />
          </div>

          {/* ── Live delivery tracking (self-hides when unavailable) ── */}
          <DeliveryTracking orderRef={order.ref} poll={order.status === "shipped"} />

          {/* ── Shipment details ── */}
          <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
              <Truck size={16} strokeWidth={1.9} className="text-[var(--primary)] sm:hidden" />
              <Truck size={18} strokeWidth={1.9} className="hidden text-[var(--primary)] sm:block" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
                Shipment Details
              </p>
            </div>

            <ShipmentTracker
              carrier={order.carrier}
              carrierType={order.carrier_type}
              trackingNumber={order.tracking_number}
              estimatedDelivery={order.estimated_delivery ?? order.eta}
              trackingStatus={order.tracking_status}
              events={order.shipment_events}
            />
          </div>

          {/* ── Order items ── */}
          <div className="overflow-hidden rounded-[18px] bg-[#efefef] sm:rounded-[22px]">
            <div className="border-b border-black/[0.07] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
                Order Items
              </p>
            </div>

            {/* ── Desktop table (≥ 1024px) ── */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] xl:px-8">Product</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] xl:px-8">Size</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] xl:px-8">Qty</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] xl:px-8">Unit Price</th>
                    <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] xl:px-8">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i} className={`border-b border-black/[0.04] ${i % 2 === 0 ? "bg-white/30" : ""}`}>
                      <td className="px-6 py-4 xl:px-8">
                        {item.brand && (
                          <p className="text-[0.75rem] font-bold uppercase tracking-wider text-[var(--primary)]">
                            {item.brand}
                          </p>
                        )}
                        <p className="text-[0.9rem] font-semibold text-[var(--foreground)]">
                          {item.product_name}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-[0.88rem] text-[var(--muted)] xl:px-8">{item.size ?? "—"}</td>
                      <td className="px-6 py-4 text-[0.88rem] text-[var(--foreground)] xl:px-8">{item.quantity}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-[0.88rem] text-[var(--muted)] xl:px-8">
                        €{Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-[0.9rem] font-semibold text-[var(--foreground)] xl:px-8">
                        €{Number(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-black/[0.08]">
                    <td colSpan={4} className="px-6 py-4 text-right text-[0.85rem] font-bold uppercase tracking-wider text-[var(--muted)] xl:px-8">
                      Total
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-[1.1rem] font-extrabold text-[var(--foreground)] xl:px-8">
                      €{Number(order.total).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── Mobile / tablet cards (< 1024px) ── */}
            <div className="flex flex-col divide-y divide-black/[0.05] lg:hidden">
              {order.items.map((item, i) => (
                <div key={i} className="px-4 py-4 sm:px-6 sm:py-5">
                  {item.brand && (
                    <p className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--primary)]">
                      {item.brand}
                    </p>
                  )}
                  <p className="text-[0.88rem] font-semibold text-[var(--foreground)] sm:text-[0.9rem]">{item.product_name}</p>
                  {item.size && (
                    <p className="mt-0.5 text-[0.76rem] text-[var(--muted)] sm:text-[0.78rem]">{item.size}</p>
                  )}
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <p className="text-[0.82rem] text-[var(--muted)]">
                      {item.quantity} × €{Number(item.unit_price).toFixed(2)}
                    </p>
                    <p className="text-[0.9rem] font-semibold text-[var(--foreground)]">
                      €{Number(item.subtotal).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
                <p className="text-[0.82rem] font-bold uppercase tracking-wider text-[var(--muted)] sm:text-[0.85rem]">Total</p>
                <p className="text-[1rem] font-extrabold text-[var(--foreground)] sm:text-[1.05rem]">
                  €{Number(order.total).toFixed(2)}
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
