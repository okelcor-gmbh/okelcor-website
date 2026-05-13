import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileText, ArrowRight, MessageSquare } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getCustomerFromCookie } from "@/lib/get-customer";

export const metadata: Metadata = {
  title: "Quote Requests",
  description: "Track your Okelcor quote requests.",
};

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type NormalizedStatus = "received" | "reviewed" | "quoted" | "converted" | "closed";

type QuoteRequest = {
  id: number;
  ref: string;
  created_at: string;
  status: string;
  product_details: string;
  quantity: number;
  notes?: string;
  admin_notes?: string;
  order_id?: number | null;
  order_ref?: string | null;
  order_status?: string | null;
  order_total?: number | null;
  payment_method?: string | null;
  payment_status?: string | null;
};

// ─── Note Helpers ─────────────────────────────────────────────────────────────

const NOTE_BLOCKLIST = [
  "this is for testing purpose",
  "this is for testing purposes",
  "test",
  "testing",
  "lorem ipsum",
  "n/a",
  "na",
  "-",
  ".",
];

function isMeaningfulNote(text?: string | null): boolean {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return normalized.length > 0 && !NOTE_BLOCKLIST.includes(normalized);
}

// ─── Status Mapping ───────────────────────────────────────────────────────────

function normalizeStatus(raw: string): NormalizedStatus {
  const s = (raw ?? "").toLowerCase();
  if (s === "new" || s === "pending")          return "received";
  if (s === "reviewing" || s === "reviewed")   return "reviewed";
  if (s === "quoted" || s === "approved")                return "quoted";
  if (s === "converted" || s === "order_created")        return "converted";
  if (s === "closed" || s === "rejected")                return "closed";
  return "received";
}

const STEPS: { key: NormalizedStatus; label: string }[] = [
  { key: "received", label: "Request received" },
  { key: "reviewed", label: "Under review" },
  { key: "quoted",   label: "Quote prepared" },
  { key: "closed",   label: "Complete" },
];

const STEP_INDEX: Record<NormalizedStatus, number> = {
  received:  0,
  reviewed:  1,
  quoted:    2,
  converted: 3,
  closed:    3,
};

const STATUS_BADGE: Record<NormalizedStatus, { label: string; cls: string }> = {
  received: { label: "Request received", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  reviewed: { label: "Under review",     cls: "bg-blue-50 text-blue-700 border-blue-200" },
  quoted:    { label: "Quote prepared",  cls: "bg-green-50 text-green-700 border-green-200" },
  converted: { label: "Order created",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed:    { label: "Closed",         cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

// ─── Progress Tracker ─────────────────────────────────────────────────────────

function ProgressTracker({ status }: { status: NormalizedStatus }) {
  const current = STEP_INDEX[status];
  return (
    <div className="mt-4 flex items-start">
      {STEPS.map((step, i) => {
        const isCompleted = i < current;
        const isActive    = i === current;
        return (
          <div key={step.key} className={i < STEPS.length - 1 ? "flex flex-1 flex-col" : "flex flex-col"}>
            <div className="flex items-center">
              <div
                className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 transition-colors ${
                  isCompleted || isActive
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-black/20 bg-white"
                }`}
              />
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    isCompleted ? "bg-[var(--primary)]" : "bg-black/[0.08]"
                  }`}
                />
              )}
            </div>
            <p
              className={`mt-2 max-w-[64px] text-[0.6rem] font-semibold leading-tight ${
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

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchQuotes(token: string): Promise<QuoteRequest[]> {
  const API_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${API_URL}/auth/quotes`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function QuotesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/login?redirect=/account/quotes");

  const customer = await getCustomerFromCookie();
  if (!customer) redirect("/login?redirect=/account/quotes");

  const isB2B = customer.customer_type === "b2b";
  const quotes = await fetchQuotes(token);

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[96px]">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-[0.8rem] text-[var(--muted)]">
          <Link href="/account" className="hover:text-[var(--foreground)]">My Account</Link>
          <ChevronRight size={13} strokeWidth={2} />
          <span className="text-[var(--foreground)] font-medium">Quote Requests</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
              {isB2B ? "B2B" : "Personal"}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Quote Requests
            </h1>
          </div>
          <Link
            href="/tyre-supply-quotation"
            className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
          >
            New Quote <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>

        {quotes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-[22px] border border-black/[0.06] bg-white py-20 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f5]">
              <FileText size={24} strokeWidth={1.5} className="text-[var(--muted)]" />
            </div>
            <p className="mt-4 text-[1rem] font-bold text-[var(--foreground)]">
              No quote requests yet
            </p>
            <p className="mt-1 max-w-[300px] text-[0.85rem] leading-6 text-[var(--muted)]">
              You have not submitted any quote requests yet. Request a quote and our team will respond within 24 hours.
            </p>
            <Link
              href="/tyre-supply-quotation"
              className="mt-6 flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Request a Quote <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        ) : (
          /* Quote list */
          <div className="flex flex-col gap-4">
            {quotes.map((q) => {
              const normalized = normalizeStatus(q.status);
              const badge = STATUS_BADGE[normalized];
              return (
                <div
                  key={q.id}
                  className="rounded-[18px] border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                >
                  {/* Ref + badge */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[0.72rem] font-bold uppercase tracking-widest text-[var(--muted)]">
                        {q.ref || `#${q.id}`}
                      </p>
                      <p className="mt-0.5 text-[0.78rem] text-[var(--muted)]">
                        Submitted{" "}
                        {new Date(q.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[0.72rem] font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Product + quantity */}
                  <div className="mt-3 rounded-[10px] bg-[#f5f5f5] px-4 py-3">
                    <p className="font-semibold text-[var(--foreground)]">{q.product_details}</p>
                    <p className="mt-0.5 text-[0.82rem] text-[var(--muted)]">
                      Qty: {q.quantity} {q.quantity === 1 ? "unit" : "units"}
                    </p>
                  </div>

                  {/* Progress tracker */}
                  <ProgressTracker status={normalized} />

                  {/* Quoted CTA — only when no linked order exists yet */}
                  {normalized === "quoted" && !q.order_ref && (
                    <div className="mt-4 rounded-[10px] border border-green-100 bg-green-50/60 px-4 py-3.5">
                      <p className="text-[0.82rem] font-semibold text-green-800">
                        Your quote is ready.
                      </p>
                      <p className="mt-0.5 text-[0.8rem] leading-relaxed text-green-700">
                        Contact our team to confirm pricing, availability, and next steps.
                      </p>
                      <Link
                        href={`/contact?quote_ref=${encodeURIComponent(q.ref || String(q.id))}`}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-[0.82rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                      >
                        Contact Okelcor about this quote <ArrowRight size={13} strokeWidth={2.5} />
                      </Link>
                    </div>
                  )}

                  {/* Customer message */}
                  {isMeaningfulNote(q.notes) && (
                    <div className="mt-4 flex gap-2.5 rounded-[10px] border border-black/[0.05] bg-[#fafafa] px-4 py-3">
                      <MessageSquare
                        size={13}
                        strokeWidth={1.8}
                        className="mt-0.5 shrink-0 text-[var(--muted)]"
                      />
                      <div>
                        <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                          Your message
                        </p>
                        <p className="text-[0.82rem] leading-relaxed text-[var(--muted)]">
                          {q.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Okelcor response — rendered when backend supplies admin_notes */}
                  {isMeaningfulNote(q.admin_notes) && (
                    <div className="mt-2 flex gap-2.5 rounded-[10px] border border-[var(--primary)]/20 bg-[#fff5f3] px-4 py-3">
                      <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-[var(--primary)]" />
                      <div>
                        <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--primary)]">
                          Okelcor response
                        </p>
                        <p className="text-[0.82rem] leading-relaxed text-[var(--foreground)]">
                          {q.admin_notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Order created badge */}
                  {q.order_ref && (
                    <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-emerald-100 bg-emerald-50 px-4 py-2.5">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="text-[0.78rem] font-semibold text-emerald-800">Order created</span>
                      <Link
                        href={`/account/orders/${q.order_ref}`}
                        className="ml-1 text-[0.78rem] font-semibold text-emerald-700 underline transition hover:text-emerald-900"
                      >
                        {q.order_ref}
                      </Link>
                    </div>
                  )}

                  {/* View details */}
                  <div className="mt-4 flex justify-end border-t border-black/[0.05] pt-3">
                    <Link
                      href={`/account/quotes/${q.ref || q.id}`}
                      className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
                    >
                      View Details <ArrowRight size={13} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
