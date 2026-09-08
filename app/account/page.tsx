import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Package, FileText, ChevronRight, BadgeCheck, MailCheck, MailWarning,
  ShoppingCart, Tag, Clock, LifeBuoy, CreditCard, PenLine, ArrowRight,
  Building2,
} from "lucide-react";
import AccessRequestsPanel from "@/components/account/access-requests-panel";
import ActivityPreview from "@/components/account/activity-preview";
import { getCustomerFromCookie } from "@/lib/get-customer";
import type { Customer } from "@/lib/customer-auth";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your Okelcor account.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

// ─── Data (server-side, same sources the section pages read) ──────────────────

type OrderSummary = {
  ref: string;
  order_ref?: string;
  created_at: string;
  status: string;
  payment_status?: string;
  payment_url?: string | null;
  checkout_url?: string | null;
  declaration_can_sign?: boolean | null;
  items: { quantity: number }[];
  total: number;
};

type QuoteSummary = { id: number; ref: string; status: string; order_ref?: string | null };

async function fetchJson<T>(path: string, token: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

const ORDER_STATUS_STYLE: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700",
  confirmed:  "bg-blue-50 text-blue-700",
  processing: "bg-indigo-50 text-indigo-700",
  shipped:    "bg-purple-50 text-purple-700",
  delivered:  "bg-emerald-50 text-emerald-700",
  cancelled:  "bg-red-50 text-red-600",
};

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function StatTile({ href, label, value, accent }: { href: string; label: string; value: number; accent?: boolean }) {
  return (
    <Link href={href}
      className="group rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition hover:border-[var(--primary)]/30">
      <p className={`text-[1.7rem] font-extrabold leading-none tracking-tight ${accent && value > 0 ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
        {value}
      </p>
      <p className="mt-1.5 flex items-center gap-1 text-[0.78rem] font-semibold text-[var(--muted)] transition group-hover:text-[var(--foreground)]">
        {label}
        <ChevronRight size={12} strokeWidth={2.5} className="opacity-0 transition group-hover:opacity-100" />
      </p>
    </Link>
  );
}

function AttentionRow({ href, icon: Icon, title, sub }: {
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  sub: string;
}) {
  return (
    <Link href={href}
      className="group flex items-center gap-3.5 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 transition hover:border-amber-300">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
        <Icon size={16} strokeWidth={2} className="text-amber-600" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[0.86rem] font-bold text-[var(--foreground)]">{title}</p>
        <p className="truncate text-[0.75rem] text-[var(--muted)]">{sub}</p>
      </div>
      <ChevronRight size={15} strokeWidth={2.4} className="ml-auto shrink-0 text-amber-500 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

// ─── Account status (kept from the previous dashboard) ────────────────────────

function StatusRow({ icon: Icon, label, granted }: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  granted: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <Icon size={15} strokeWidth={1.9} className="text-[var(--muted)]" />
        <span className="text-[0.84rem] font-medium text-[var(--foreground)]">{label}</span>
      </div>
      {granted ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.7rem] font-bold text-emerald-700">
          <BadgeCheck size={12} strokeWidth={2.2} /> Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[0.7rem] font-bold text-amber-700">
          <Clock size={12} strokeWidth={2.2} /> Pending
        </span>
      )}
    </div>
  );
}

function AccountStatusCard({ customer, isB2B }: { customer: Customer; isB2B: boolean }) {
  const verified = customer.email_verified;
  return (
    <div className="rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
        Account Status
      </p>
      <div className={`mb-4 flex items-start gap-3 rounded-2xl border p-4 ${
        verified ? "border-emerald-100 bg-emerald-50/60" : "border-amber-100 bg-amber-50/60"
      }`}>
        {verified ? (
          <MailCheck size={20} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald-600" />
        ) : (
          <MailWarning size={20} strokeWidth={1.8} className="mt-0.5 shrink-0 text-amber-600" />
        )}
        <div>
          <p className="text-[0.86rem] font-bold text-[var(--foreground)]">
            {verified ? "Email verified" : "Verify your email"}
          </p>
          <p className="mt-0.5 text-[0.78rem] leading-snug text-[var(--muted)]">
            {verified ? "Your account is fully active." : "Check your inbox to confirm your email address."}
          </p>
        </div>
      </div>
      {isB2B && (
        <div className="divide-y divide-black/[0.05]">
          <StatusRow icon={ShoppingCart} label="Checkout" granted={customer.approved_for_checkout !== false} />
          <StatusRow icon={FileText} label="Trade documents" granted={customer.approved_for_documents !== false} />
          <StatusRow icon={Tag} label="Wholesale pricing" granted={customer.approved_for_wholesale_pricing !== false} />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/login?redirect=/account");

  const customer = await getCustomerFromCookie();
  if (!customer) redirect("/login?redirect=/account");

  const isB2B = customer.customer_type === "b2b";
  const displayName = [customer.first_name, customer.last_name].filter(Boolean).join(" ");

  // The customer's actual situation, from the same endpoints the section
  // pages read — the dashboard shows their data, not a menu.
  const [orders, quotes] = await Promise.all([
    fetchJson<OrderSummary>(`/orders?email=${encodeURIComponent(customer.email)}`, token),
    fetchJson<QuoteSummary>("/auth/quotes", token),
  ]);

  const openOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const quotesAwaiting = quotes.filter(
    (q) => ["quoted", "approved"].includes((q.status ?? "").toLowerCase()) && !q.order_ref
  );

  // What needs the customer to act, right now.
  const attention: { key: string; node: React.ReactNode }[] = [];
  for (const o of orders) {
    const ref = o.order_ref || o.ref;
    if ((o.payment_url || o.checkout_url) && o.payment_status !== "paid" && !["cancelled", "delivered"].includes(o.status)) {
      attention.push({
        key: `pay-${ref}`,
        node: <AttentionRow key={`pay-${ref}`} href={`/account/orders/${encodeURIComponent(ref)}`}
          icon={CreditCard} title={`Payment open on order ${ref}`}
          sub={`${eur.format(o.total)} — pay online to keep the order moving`} />,
      });
    }
    if (o.declaration_can_sign) {
      attention.push({
        key: `sign-${ref}`,
        node: <AttentionRow key={`sign-${ref}`} href={`/account/orders/${encodeURIComponent(ref)}`}
          icon={PenLine} title={`Entry certificate to sign for ${ref}`}
          sub="One signature — required for the intra-EU delivery record" />,
      });
    }
  }
  for (const q of quotesAwaiting) {
    attention.push({
      key: `quote-${q.ref}`,
      node: <AttentionRow key={`quote-${q.ref}`} href={`/account/quotes/${encodeURIComponent(q.ref)}`}
        icon={FileText} title={`Your quote ${q.ref} is ready`}
        sub="Review the prepared offer and accept it to place the order" />,
    });
  }

  const recentOrders = orders.slice(0, 3);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
          {isB2B ? "Business Account" : "Personal Account"}
        </p>
        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
          Welcome back{displayName ? `, ${displayName.split(" ")[0]}` : ""}
        </h1>
        {isB2B && customer.company_name && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Building2 size={14} strokeWidth={1.8} className="text-[var(--muted)]" />
            <p className="text-[0.85rem] text-[var(--muted)]">{customer.company_name}</p>
            {customer.vat_number && (
              <span className="rounded-full border border-black/[0.07] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                VAT: {customer.vat_number}
              </span>
            )}
          </div>
        )}
      </div>

      {/* The numbers that matter */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile href="/account/orders" label="Orders in progress" value={openOrders.length} accent />
        <StatTile href="/account/quotes" label="Quotes awaiting you" value={quotesAwaiting.length} accent />
        <StatTile href="/account/orders" label="Orders placed" value={orders.length} />
        <StatTile href="/account/quotes" label="Quote requests" value={quotes.length} />
      </div>

      {/* Needs your attention — only exists when something actually does */}
      {attention.length > 0 && (
        <div className="mb-6 rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Needs your attention
          </p>
          <div className="space-y-2.5">{attention.slice(0, 4).map((a) => a.node)}</div>
        </div>
      )}

      {/* Recent orders + status/activity */}
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Recent Orders</p>
            {orders.length > 0 && (
              <Link href="/account/orders"
                className="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-[var(--primary)] transition hover:gap-1.5">
                All orders <ArrowRight size={12} strokeWidth={2.5} />
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-[0.86rem] text-[var(--muted)]">
                No orders yet — your orders and their live tracking will appear here.
              </p>
              <Link href="/shop"
                className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]">
                Browse the catalogue
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.05]">
              {recentOrders.map((o) => {
                const ref = o.order_ref || o.ref;
                const units = o.items?.reduce((n, i) => n + (i.quantity ?? 0), 0) ?? 0;
                return (
                  <Link key={ref} href={`/account/orders/${encodeURIComponent(ref)}`}
                    className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] transition group-hover:bg-[var(--primary)]/10">
                      <Package size={15} strokeWidth={2} className="text-[var(--primary)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[0.83rem] font-bold text-[var(--foreground)]">{ref}</p>
                      <p className="text-[0.73rem] text-[var(--muted)]">
                        {shortDate(o.created_at)}{units > 0 ? ` · ${units} tyre${units === 1 ? "" : "s"}` : ""}
                      </p>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-3">
                      <span className="hidden text-[0.85rem] font-bold tabular-nums text-[var(--foreground)] sm:block">
                        {eur.format(o.total)}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${ORDER_STATUS_STYLE[o.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {o.status}
                      </span>
                      <ChevronRight size={14} strokeWidth={2.4} className="text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--foreground)]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <AccountStatusCard customer={customer} isB2B={isB2B} />
          <ActivityPreview />
        </div>
      </div>

      {/* CRM-8: request access for withheld permissions (B2B only) */}
      {isB2B && (
        <AccessRequestsPanel
          approvedForCheckout={customer.approved_for_checkout}
          approvedForDocuments={customer.approved_for_documents}
          approvedForWholesalePricing={customer.approved_for_wholesale_pricing}
        />
      )}

      {/* Quick actions */}
      <div className="mt-6 rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/shop"
            className="rounded-full border border-black/[0.08] px-5 py-2.5 text-[0.88rem] font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/40 hover:bg-[#fff5f3] hover:text-[var(--primary)]">
            Browse Catalogue
          </Link>
          <Link href="/tyre-supply-quotation"
            className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]">
            Request a Quote
          </Link>
          <Link href="/account/claims"
            className="rounded-full border border-black/[0.08] px-5 py-2.5 text-[0.88rem] font-semibold text-[var(--foreground)] transition hover:border-black/20">
            Report a Problem
          </Link>
          <Link href="/contact"
            className="rounded-full border border-black/[0.08] px-5 py-2.5 text-[0.88rem] font-semibold text-[var(--foreground)] transition hover:border-black/20">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
