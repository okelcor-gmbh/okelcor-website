import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Receipt, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import InvoiceDownloadButton from "@/components/account/invoice-download-button";
import { getCustomerFromCookie } from "@/lib/get-customer";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Download and manage your Okelcor invoices.",
};

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = "paid" | "unpaid" | "overdue";

type Invoice = {
  id: number;
  invoice_number: string;
  issued_at: string;
  due_at?: string;
  amount: number;
  status: InvoiceStatus;
  pdf_url?: string;
  order_ref?: string;
  released_at?: string | null;
  tax_treatment?: string | null;
  // Backend-computed (self-healed before the response): the single source of
  // truth for whether the download is ready. Held/reverse-charge invoices are
  // omitted from this list entirely until released, so they never appear here.
  download_available?: boolean;
};

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; cls: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  paid:    { label: "Paid",    cls: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  unpaid:  { label: "Unpaid",  cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  overdue: { label: "Overdue", cls: "bg-red-50 text-red-600 border-red-200",       icon: AlertCircle },
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchInvoices(
  token: string,
): Promise<{ invoices: Invoice[]; fetchError: boolean }> {
  const API_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${API_URL}/auth/invoices`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("[invoices] API error:", res.status, await res.text().catch(() => ""));
      return { invoices: [], fetchError: true };
    }
    const json = await res.json();
    // Support both flat {data:[]} and paginated {data:{data:[]}} Laravel shapes.
    const list: Invoice[] = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json.data?.data)
      ? json.data.data
      : [];
    return { invoices: list, fetchError: false };
  } catch (err) {
    console.error("[invoices] fetch failed:", err);
    return { invoices: [], fetchError: true };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InvoicesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/login?redirect=/account/invoices");

  const customer = await getCustomerFromCookie();
  if (!customer) redirect("/login?redirect=/account/invoices");

  const isB2B = customer.customer_type === "b2b";
  const { invoices, fetchError } = await fetchInvoices(token);

  // Backend has a single tax-invoice artifact (no separate "receipt" document),
  // so we label consistently as "Invoices" for both account types.
  const pageLabel    = "Invoices";
  const accountLabel = isB2B ? "B2B" : "Personal";
  const emptyTitle   = "No invoices yet";
  const emptyBody    = isB2B
    ? "Paid orders will appear here after checkout."
    : "Your paid orders will appear here.";

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[96px]">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-[0.8rem] text-[var(--muted)]">
          <Link href="/account" className="hover:text-[var(--foreground)]">My Account</Link>
          <ChevronRight size={13} strokeWidth={2} />
          <span className="text-[var(--foreground)] font-medium">{pageLabel}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
            {accountLabel}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            {pageLabel}
          </h1>
        </div>

        {/* Fetch error banner */}
        {fetchError && (
          <div className="mb-4 rounded-[14px] border border-red-200 bg-red-50 px-5 py-4 text-[0.875rem] text-red-700">
            Unable to load invoices. Please refresh the page or{" "}
            <Link href="/contact" className="underline underline-offset-2">
              contact support
            </Link>{" "}
            if the problem persists.
          </div>
        )}

        {!fetchError && invoices.length === 0 ? (
          /* True empty state — API returned 200 with zero records */
          <div className="flex flex-col items-center justify-center rounded-[22px] border border-black/[0.06] bg-white py-20 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f5]">
              <Receipt size={24} strokeWidth={1.5} className="text-[var(--muted)]" />
            </div>
            <p className="mt-4 text-[1rem] font-bold text-[var(--foreground)]">{emptyTitle}</p>
            <p className="mt-1 max-w-[320px] text-[0.85rem] leading-6 text-[var(--muted)]">
              {emptyBody}
            </p>
            <Link
              href="/contact"
              className="mt-6 rounded-full border border-black/[0.08] px-6 py-3 text-[0.88rem] font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
            >
              Contact support
            </Link>
          </div>
        ) : invoices.length > 0 ? (
          /* Invoice list */
          <div className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            {/* Table header — desktop only */}
            <div className="hidden border-b border-black/[0.05] px-6 py-3 sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] sm:gap-4">
              {["Invoice", "Issued", "Due", "Amount", ""].map((h) => (
                <p key={h} className="text-[0.72rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">{h}</p>
              ))}
            </div>

            {invoices.map((inv, i) => {
              const s = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.unpaid;
              const Icon = s.icon;
              // Trust the backend's self-healed flag. Treat a missing flag as
              // available (legacy rows) — held invoices never reach this list.
              const canDownload = inv.download_available !== false;
              return (
                <div
                  key={inv.id}
                  className={`flex flex-col gap-3 px-6 py-4 sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center sm:gap-4 ${i !== invoices.length - 1 ? "border-b border-black/[0.05]" : ""}`}
                >
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{inv.invoice_number}</p>
                    {inv.order_ref && (
                      <p className="text-[0.78rem] text-[var(--muted)]">Order: {inv.order_ref}</p>
                    )}
                  </div>
                  <p className="text-[0.85rem] text-[var(--muted)]">
                    {new Date(inv.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-[0.85rem] text-[var(--muted)]">
                    {inv.due_at
                      ? new Date(inv.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </p>
                  <p className="font-bold text-[var(--foreground)]">€{inv.amount.toFixed(2)}</p>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.72rem] font-semibold ${s.cls}`}>
                      <Icon size={11} />
                      {s.label}
                    </span>
                    {canDownload ? (
                      <InvoiceDownloadButton invoiceId={inv.id} variant="icon" label={`Download ${inv.invoice_number}`} />
                    ) : (
                      <span className="rounded-full border border-black/[0.06] px-2.5 py-0.5 text-[0.68rem] font-medium text-[var(--muted)]">
                        Preparing
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <Footer />
    </main>
  );
}
