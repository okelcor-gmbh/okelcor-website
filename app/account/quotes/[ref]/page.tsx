import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, MessageSquare,
  Package, CheckCircle2, ArrowRight, Paperclip,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import OrderPaymentCard from "@/components/account/order-payment-card";
import QuoteAcceptanceActions from "@/components/account/quote-acceptance-actions";
import { getCustomerFromCookie } from "@/lib/get-customer";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderItem = {
  product_name: string;
  brand?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type QuoteDetail = {
  id: number;
  ref: string;
  status: string;
  created_at: string;
  // product
  product_details?: string;
  tyre_category?: string;
  brand_preference?: string;
  tyre_size?: string;
  quantity?: string | number;
  budget_range?: string;
  // delivery
  delivery_address?: string;
  delivery_city?: string;
  delivery_postal_code?: string;
  delivery_location?: string;
  delivery_timeline?: string;
  country?: string;
  // notes
  notes?: string;
  admin_notes?: string;
  // attachment
  attachment_url?: string | null;
  // pricing
  quoted_price?: number | null;
  // linked order
  order_id?: number | null;
  order_ref?: string | null;
  order_status?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  // order breakdown (populated when backend returns items with the quote)
  order_subtotal_net?: number | null;
  order_tax_rate?: number | null;
  order_tax_amount?: number | null;
  order_tax_treatment?: string | null;
  order_is_reverse_charge?: boolean | null;
  order_delivery_cost?: number | null;
  order_total?: number | null;
  order_items?: OrderItem[];
  // DOC-6 customer acceptance
  customer_acceptance_status?: "pending" | "accepted" | "rejected" | null;
  customer_accepted_at?: string | null;
  proposal_doc_url?: string | null;
};

type DetailStatus = "received" | "reviewed" | "quoted" | "converted" | "closed";

// ─── Note helper ──────────────────────────────────────────────────────────────

const NOTE_BLOCKLIST = [
  "this is for testing purpose", "this is for testing purposes",
  "test", "testing", "lorem ipsum", "n/a", "na", "-", ".",
];

function isMeaningfulNote(text?: string | null): boolean {
  if (!text) return false;
  const n = text.trim().toLowerCase();
  return n.length > 0 && !NOTE_BLOCKLIST.includes(n);
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function normalizeStatus(raw: string): DetailStatus {
  const s = (raw ?? "").toLowerCase();
  if (s === "new" || s === "pending")               return "received";
  if (s === "reviewing" || s === "reviewed")        return "reviewed";
  if (s === "quoted" || s === "approved")           return "quoted";
  if (s === "converted" || s === "order_created")   return "converted";
  if (s === "closed" || s === "rejected")           return "closed";
  return "received";
}

const STATUS_BADGE: Record<DetailStatus, { label: string; cls: string }> = {
  received:  { label: "Request received", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  reviewed:  { label: "Under review",     cls: "bg-blue-50 text-blue-700 border-blue-200" },
  quoted:    { label: "Quote prepared",   cls: "bg-green-50 text-green-700 border-green-200" },
  converted: { label: "Order created",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed:    { label: "Closed",           cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

// ─── Progress tracker ─────────────────────────────────────────────────────────

const PROGRESS_STEPS = [
  { key: "received",  label: "Request received" },
  { key: "reviewed",  label: "Under review" },
  { key: "quoted",    label: "Quote prepared" },
  { key: "converted", label: "Order created" },
] as const;

const PROGRESS_STEP_INDEX: Record<DetailStatus, number> = {
  received:  0,
  reviewed:  1,
  quoted:    2,
  converted: 3,
  closed:    -1,
};

function ProgressTracker({ status }: { status: DetailStatus }) {
  if (status === "closed") return null;
  const current = PROGRESS_STEP_INDEX[status];

  return (
    <div className="mt-6 flex items-start">
      {PROGRESS_STEPS.map((step, i) => {
        const isCompleted = i < current;
        const isActive    = i === current;
        const isLast      = i === PROGRESS_STEPS.length - 1;
        return (
          <div key={step.key} className={isLast ? "flex flex-col" : "flex flex-1 flex-col"}>
            <div className="flex items-center">
              <div
                className={`h-3 w-3 shrink-0 rounded-full border-2 transition-colors ${
                  isCompleted || isActive
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-black/20 bg-white"
                }`}
              />
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    isCompleted ? "bg-[var(--primary)]" : "bg-black/[0.08]"
                  }`}
                />
              )}
            </div>
            <p
              className={`mt-2 max-w-[72px] text-[0.63rem] font-semibold leading-tight ${
                isActive
                  ? "text-[var(--foreground)]"
                  : isCompleted
                  ? "text-[var(--muted)]"
                  : "text-black/25"
              }`}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Detail row helper ────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="text-[0.88rem] text-[var(--foreground)]">{value}</p>
    </div>
  );
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchQuoteDetail(ref: string, token: string): Promise<QuoteDetail | null> {
  const API_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${API_URL}/auth/quotes/${encodeURIComponent(ref)}`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json ?? null;
  } catch {
    return null;
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ ref: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params;
  return { title: `Quote ${ref}` };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function QuoteDetailPage({ params }: Props) {
  const { ref } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect(`/login?redirect=/account/quotes/${ref}`);

  const customer = await getCustomerFromCookie();
  if (!customer) redirect(`/login?redirect=/account/quotes/${ref}`);

  const quote = await fetchQuoteDetail(ref, token!);
  if (!quote) notFound();

  const normalized  = normalizeStatus(quote.status);
  const badge       = STATUS_BADGE[normalized];
  const hasOrder    = !!quote.order_ref;
  const hasItems    = Array.isArray(quote.order_items) && quote.order_items.length > 0;
  const hasTotal    = quote.order_total != null;

  const submittedDate = new Date(quote.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const deliveryAddress = [
    quote.delivery_address,
    quote.delivery_city,
    quote.delivery_postal_code,
  ].filter(Boolean).join(", ") || null;

  const quantityDisplay =
    quote.quantity != null
      ? `${quote.quantity} unit${Number(quote.quantity) !== 1 ? "s" : ""}`
      : undefined;

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[96px]">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-[0.8rem] text-[var(--muted)]">
          <Link href="/account" className="transition hover:text-[var(--foreground)]">My Account</Link>
          <ChevronRight size={13} strokeWidth={2} className="opacity-50" />
          <Link href="/account/quotes" className="transition hover:text-[var(--foreground)]">Quote Requests</Link>
          <ChevronRight size={13} strokeWidth={2} className="opacity-50" />
          <span className="font-medium text-[var(--foreground)]">{quote.ref || ref}</span>
        </nav>

        {/* Back button */}
        <Link
          href="/account/quotes"
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[0.85rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} /> Back to Quotes
        </Link>

        <div className="flex flex-col gap-5">

          {/* ── Header ── */}
          <div className="rounded-[22px] bg-[#efefef] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                  Quote Reference
                </p>
                <p className="mt-1 font-mono text-[1.35rem] font-extrabold tracking-wide text-[var(--foreground)]">
                  {quote.ref || ref}
                </p>
                <p className="mt-1 text-[0.85rem] text-[var(--muted)]">
                  Submitted {submittedDate}
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-[0.78rem] font-semibold ${badge.cls}`}>
                {badge.label}
              </span>
            </div>

            <ProgressTracker status={normalized} />
          </div>

          {/* ── Closed banner ── */}
          {normalized === "closed" && (
            <div className="rounded-[22px] border border-gray-200 bg-gray-50 px-6 py-5 sm:px-8">
              <p className="text-[0.9rem] font-semibold text-gray-700">
                This quote request has been closed.
              </p>
              {isMeaningfulNote(quote.admin_notes) && (
                <p className="mt-1.5 text-[0.85rem] leading-relaxed text-gray-600">
                  {quote.admin_notes}
                </p>
              )}
            </div>
          )}

          {/* ── Request details ── */}
          <div className="rounded-[22px] bg-[#efefef] p-6 sm:p-8">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
              Request Details
            </p>
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Tyre category"     value={quote.tyre_category} />
              <DetailRow label="Brand preference"  value={quote.brand_preference} />
              <DetailRow label="Tyre size"         value={quote.tyre_size} />
              <DetailRow label="Quantity"          value={quantityDisplay} />
              <DetailRow label="Budget range"      value={quote.budget_range} />
              <DetailRow label="Delivery timeline" value={quote.delivery_timeline} />
              <DetailRow label="Country"           value={quote.country} />
              <DetailRow label="Delivery location" value={quote.delivery_location} />
              {deliveryAddress && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <DetailRow label="Delivery address" value={deliveryAddress} />
                </div>
              )}
              {/* Fallback for older records */}
              {!quote.tyre_category && quote.product_details && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <DetailRow label="Product details" value={quote.product_details} />
                </div>
              )}
            </div>
          </div>

          {/* ── Attachment ── */}
          {quote.attachment_url && (
            <div className="flex items-center gap-3 rounded-[22px] border border-black/[0.06] bg-white px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5]">
                <Paperclip size={16} strokeWidth={1.8} className="text-[var(--muted)]" />
              </div>
              <div className="flex-1">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Attached document
                </p>
                <p className="mt-0.5 text-[0.85rem] font-semibold text-[var(--foreground)]">
                  {quote.attachment_url.split("/").pop() ?? "attachment"}
                </p>
              </div>
              <a
                href={quote.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#f5f5f5] px-4 py-2 text-[0.82rem] font-semibold text-[var(--foreground)] transition hover:bg-[#ebebeb]"
              >
                Download <ArrowRight size={13} strokeWidth={2.2} />
              </a>
            </div>
          )}

          {/* ── Customer message ── */}
          {isMeaningfulNote(quote.notes) && (
            <div className="flex gap-3 rounded-[22px] border border-black/[0.05] bg-white px-6 py-5">
              <MessageSquare size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[var(--muted)]" />
              <div>
                <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Your message
                </p>
                <p className="text-[0.88rem] leading-relaxed text-[var(--foreground)]">
                  {quote.notes}
                </p>
              </div>
            </div>
          )}

          {/* ── Okelcor response ── */}
          {normalized !== "closed" && isMeaningfulNote(quote.admin_notes) && (
            <div className="flex gap-3 rounded-[22px] border border-[var(--primary)]/20 bg-[#fff5f3] px-6 py-5">
              <div className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full bg-[var(--primary)]" />
              <div>
                <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--primary)]">
                  Okelcor response
                </p>
                <p className="text-[0.88rem] leading-relaxed text-[var(--foreground)]">
                  {quote.admin_notes}
                </p>
              </div>
            </div>
          )}

          {/* ── Quoted price block ── */}
          {quote.quoted_price != null && normalized !== "closed" && (
            <div className="rounded-[22px] bg-[#efefef] p-6 sm:p-8">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                Quoted Price
              </p>
              <p className="text-[2rem] font-extrabold tracking-tight text-[var(--foreground)]">
                €{Number(quote.quoted_price).toFixed(2)}
              </p>
              <p className="mt-1 text-[0.82rem] text-[var(--muted)]">
                Total quoted price including all items
              </p>
            </div>
          )}

          {/* ── Quoted, no order yet ── */}
          {normalized === "quoted" && !hasOrder && (
            <>
              {/* Acceptance actions (shown when acceptance is pending or already resolved) */}
              {quote.customer_acceptance_status != null && (
                <QuoteAcceptanceActions
                  quoteRef={quote.ref || ref}
                  proposalDocUrl={quote.proposal_doc_url}
                  initialStatus={quote.customer_acceptance_status}
                />
              )}

              {/* Generic "ready" block shown when no acceptance flow is active */}
              {quote.customer_acceptance_status == null && (
                <div className="rounded-[22px] border border-green-200 bg-green-50/60 p-6 sm:p-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={20}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0 text-green-600"
                    />
                    <div>
                      <p className="text-[0.95rem] font-bold text-green-900">
                        Your quote is ready.
                      </p>
                      <p className="mt-1 text-[0.85rem] leading-relaxed text-green-800">
                        Okelcor is preparing your order details. Our team will be in touch
                        shortly to confirm availability and next steps.
                      </p>
                      <Link
                        href={`/contact?quote_ref=${encodeURIComponent(quote.ref || ref)}`}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                      >
                        Contact Okelcor about this quote <ArrowRight size={13} strokeWidth={2.5} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Linked order ── */}
          {hasOrder && (
            <>
              {/* Order banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-[#efefef] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Package size={18} strokeWidth={1.8} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                      Order created from this quote
                    </p>
                    <p className="mt-0.5 font-mono text-[1rem] font-extrabold text-[var(--foreground)]">
                      {quote.order_ref}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/account/orders/${quote.order_ref ?? ""}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[0.82rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0]"
                >
                  View Full Order <ChevronRight size={13} strokeWidth={2.2} />
                </Link>
              </div>

              {/* Payment card — handles stripe / bank_transfer / paid states */}
              {quote.payment_status && (
                <OrderPaymentCard
                  orderRef={quote.order_ref!}
                  paymentMethod={quote.payment_method ?? undefined}
                  paymentStatus={quote.payment_status}
                />
              )}

              {/* Order items table */}
              {hasItems && (
                <div className="overflow-hidden rounded-[22px] bg-[#efefef]">
                  <div className="border-b border-black/[0.07] px-6 py-5 sm:px-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                      Order Items
                    </p>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-black/[0.06]">
                          {["Product", "Size", "Qty", "Unit price", "Subtotal"].map((h, hi) => (
                            <th
                              key={h}
                              className={`px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] ${hi === 4 ? "text-right" : ""}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {quote.order_items!.map((item, i) => (
                          <tr
                            key={i}
                            className={`border-b border-black/[0.04] ${i % 2 === 0 ? "bg-white/30" : ""}`}
                          >
                            <td className="px-6 py-4">
                              {item.brand && (
                                <p className="text-[0.75rem] font-bold uppercase tracking-wider text-[var(--primary)]">
                                  {item.brand}
                                </p>
                              )}
                              <p className="text-[0.9rem] font-semibold text-[var(--foreground)]">
                                {item.product_name}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-[0.88rem] text-[var(--muted)]">
                              {item.size ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-[0.88rem] text-[var(--foreground)]">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 text-[0.88rem] text-[var(--muted)]">
                              €{Number(item.unit_price).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-[0.9rem] font-semibold text-[var(--foreground)]">
                              €{Number(item.subtotal).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {hasTotal && (
                        <tfoot className="border-t border-black/[0.08]">
                          {quote.order_subtotal_net != null && (
                            <tr>
                              <td colSpan={4} className="px-6 py-2 text-right text-[0.82rem] text-[var(--muted)]">
                                Subtotal (net)
                              </td>
                              <td className="px-6 py-2 text-right text-[0.88rem] text-[var(--foreground)]">
                                €{Number(quote.order_subtotal_net).toFixed(2)}
                              </td>
                            </tr>
                          )}
                          {quote.order_delivery_cost != null && (
                            <tr>
                              <td colSpan={4} className="px-6 py-2 text-right text-[0.82rem] text-[var(--muted)]">
                                Delivery
                              </td>
                              <td className="px-6 py-2 text-right text-[0.88rem] text-[var(--foreground)]">
                                {Number(quote.order_delivery_cost) === 0
                                  ? "Free"
                                  : `€${Number(quote.order_delivery_cost).toFixed(2)}`}
                              </td>
                            </tr>
                          )}
                          {(quote.order_tax_amount != null || quote.order_is_reverse_charge) && (
                            <tr>
                              <td colSpan={4} className="px-6 py-2 text-right text-[0.82rem] text-[var(--muted)]">
                                {quote.order_is_reverse_charge
                                  ? "VAT (Reverse Charge)"
                                  : `VAT${quote.order_tax_rate ? ` (${quote.order_tax_rate}%)` : ""}`}
                              </td>
                              <td className="px-6 py-2 text-right text-[0.88rem] text-[var(--foreground)]">
                                {quote.order_is_reverse_charge
                                  ? "€0.00"
                                  : `€${Number(quote.order_tax_amount).toFixed(2)}`}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-4 text-right text-[0.85rem] font-bold uppercase tracking-wider text-[var(--muted)]"
                            >
                              Total
                            </td>
                            <td className="px-6 py-4 text-right text-[1.1rem] font-extrabold text-[var(--foreground)]">
                              €{Number(quote.order_total).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="flex flex-col divide-y divide-black/[0.05] md:hidden">
                    {quote.order_items!.map((item, i) => (
                      <div key={i} className="px-5 py-4">
                        {item.brand && (
                          <p className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--primary)]">
                            {item.brand}
                          </p>
                        )}
                        <p className="text-[0.9rem] font-semibold text-[var(--foreground)]">
                          {item.product_name}
                        </p>
                        {item.size && (
                          <p className="mt-0.5 text-[0.78rem] text-[var(--muted)]">{item.size}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-[0.82rem] text-[var(--muted)]">
                            {item.quantity} × €{Number(item.unit_price).toFixed(2)}
                          </p>
                          <p className="font-semibold text-[var(--foreground)]">
                            €{Number(item.subtotal).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {hasTotal && (
                      <>
                        {quote.order_subtotal_net != null && (
                          <div className="flex items-center justify-between px-5 py-3">
                            <p className="text-[0.82rem] text-[var(--muted)]">Subtotal (net)</p>
                            <p className="text-[0.88rem] text-[var(--foreground)]">
                              €{Number(quote.order_subtotal_net).toFixed(2)}
                            </p>
                          </div>
                        )}
                        {quote.order_delivery_cost != null && (
                          <div className="flex items-center justify-between px-5 py-3">
                            <p className="text-[0.82rem] text-[var(--muted)]">Delivery</p>
                            <p className="text-[0.88rem] text-[var(--foreground)]">
                              {Number(quote.order_delivery_cost) === 0
                                ? "Free"
                                : `€${Number(quote.order_delivery_cost).toFixed(2)}`}
                            </p>
                          </div>
                        )}
                        {(quote.order_tax_amount != null || quote.order_is_reverse_charge) && (
                          <div className="flex items-center justify-between px-5 py-3">
                            <p className="text-[0.82rem] text-[var(--muted)]">
                              {quote.order_is_reverse_charge
                                ? "VAT (Reverse Charge)"
                                : `VAT${quote.order_tax_rate ? ` (${quote.order_tax_rate}%)` : ""}`}
                            </p>
                            <p className="text-[0.88rem] text-[var(--foreground)]">
                              {quote.order_is_reverse_charge
                                ? "€0.00"
                                : `€${Number(quote.order_tax_amount).toFixed(2)}`}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between px-5 py-4">
                          <p className="text-[0.85rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Total
                          </p>
                          <p className="text-[1.05rem] font-extrabold text-[var(--foreground)]">
                            €{Number(quote.order_total).toFixed(2)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Order total only — when no items array returned */}
              {!hasItems && hasTotal && (
                <div className="rounded-[22px] bg-[#efefef] px-6 py-5 sm:px-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                        Order Total
                      </p>
                      <p className="mt-1 text-[0.82rem] text-[var(--muted)]">
                        {[
                          quote.order_subtotal_net != null && `Net €${Number(quote.order_subtotal_net).toFixed(2)}`,
                          quote.order_is_reverse_charge
                            ? "VAT (Reverse Charge)"
                            : quote.order_tax_amount != null && `VAT €${Number(quote.order_tax_amount).toFixed(2)}`,
                          quote.order_delivery_cost != null &&
                            (Number(quote.order_delivery_cost) === 0
                              ? "Free delivery"
                              : `Delivery €${Number(quote.order_delivery_cost).toFixed(2)}`),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <p className="text-[1.5rem] font-extrabold text-[var(--foreground)]">
                      €{Number(quote.order_total).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      <Footer />
    </main>
  );
}
