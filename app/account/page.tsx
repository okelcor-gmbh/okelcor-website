import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Package, FileText, Receipt, Building2, ShieldCheck,
  MapPin, User, ChevronRight, BadgeCheck, MailCheck, MailWarning,
  ShoppingCart, Tag, Clock,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AccessRequestsPanel from "@/components/account/access-requests-panel";
import ActivityPreview from "@/components/account/activity-preview";
import { getCustomerFromCookie } from "@/lib/get-customer";
import type { Customer } from "@/lib/customer-auth";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your Okelcor account.",
};

// ─── Card component ───────────────────────────────────────────────────────────

function DashCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition hover:border-[var(--primary)]/30 hover:shadow-[0_8px_30px_rgba(244,81,30,0.08)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f5f5f5] transition group-hover:bg-[var(--primary)]/10">
          <Icon size={20} strokeWidth={1.8} className="text-[var(--primary)]" />
        </div>
        {badge && (
          <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="font-bold text-[var(--foreground)]">{title}</p>
        <p className="mt-0.5 text-[0.82rem] text-[var(--muted)]">{description}</p>
      </div>
      <div className="mt-auto flex items-center gap-1 text-[0.82rem] font-semibold text-[var(--primary)] opacity-0 transition group-hover:opacity-100">
        View <ChevronRight size={13} strokeWidth={2.5} />
      </div>
    </Link>
  );
}

// ─── Account status card ──────────────────────────────────────────────────────

function StatusRow({
  icon: Icon,
  label,
  granted,
}: {
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

      {/* Email verification — applies to everyone */}
      <div
        className={`mb-4 flex items-start gap-3 rounded-2xl border p-4 ${
          verified ? "border-emerald-100 bg-emerald-50/60" : "border-amber-100 bg-amber-50/60"
        }`}
      >
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
            {verified
              ? "Your account is fully active."
              : "Check your inbox to confirm your email address."}
          </p>
        </div>
      </div>

      {/* B2B access matrix — only when the backend has set the flags */}
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

// ─── B2C Dashboard ────────────────────────────────────────────────────────────

function B2CDashboard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashCard
        href="/account/orders"
        icon={Package}
        title="Order History"
        description="Track and manage your tyre orders"
      />
      <DashCard
        href="/account/quotes"
        icon={FileText}
        title="Quote Requests"
        description="Track the status of your tyre quote requests"
      />
      <DashCard
        href="/account/invoices"
        icon={Receipt}
        title="Receipts & Invoices"
        description="View receipts for your purchases"
      />
      <DashCard
        href="/account/addresses"
        icon={MapPin}
        title="Saved Addresses"
        description="Manage your delivery addresses"
      />
      <DashCard
        href="/account/profile"
        icon={User}
        title="Profile Settings"
        description="Update your personal information"
      />
    </div>
  );
}

// ─── B2B Dashboard ────────────────────────────────────────────────────────────

function B2BDashboard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashCard
        href="/account/orders"
        icon={Package}
        title="Order History"
        description="Track and manage all your orders"
      />
      <DashCard
        href="/account/quotes"
        icon={FileText}
        title="Quote Requests"
        description="View and manage your quote requests"
      />
      <DashCard
        href="/account/invoices"
        icon={Receipt}
        title="Invoices"
        description="View paid invoices and billing records for your company."
      />
      <DashCard
        href="/account/company"
        icon={Building2}
        title="Company Details"
        description="Update your business information"
      />
      <DashCard
        href="/account/vat"
        icon={ShieldCheck}
        title="VAT Status"
        description="View your VAT registration and status"
      />
      <DashCard
        href="/account/profile"
        icon={User}
        title="Profile Settings"
        description="Update your personal information"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  if (!token) {
    redirect("/login?redirect=/account");
  }

  const customer = await getCustomerFromCookie();

  if (!customer) {
    redirect("/login?redirect=/account");
  }

  const isB2B = customer.customer_type === "b2b";
  const displayName = [customer.first_name, customer.last_name].filter(Boolean).join(" ");

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[96px]">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white">
              <span className="text-[1.05rem] font-extrabold">
                {customer.first_name?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                {isB2B ? "Business Account" : "Personal Account"}
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                {displayName || customer.email}
              </h1>
            </div>
          </div>

          {isB2B && customer.company_name && (
            <div className="mt-3 flex items-center gap-2">
              <Building2 size={14} strokeWidth={1.8} className="text-[var(--muted)]" />
              <p className="text-[0.88rem] text-[var(--muted)]">{customer.company_name}</p>
              {customer.vat_number && (
                <span className="rounded-full border border-black/[0.07] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                  VAT: {customer.vat_number}
                </span>
              )}
            </div>
          )}

          <p className="mt-1 text-[0.85rem] text-[var(--muted)]">{customer.email}</p>
        </div>

        {/* Top row — recent activity + account status */}
        <div className="mb-10 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <ActivityPreview />
          <AccountStatusCard customer={customer} isB2B={isB2B} />
        </div>

        {/* Dashboard cards */}
        <div className="mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            My Account
          </p>
        </div>

        {isB2B ? <B2BDashboard /> : <B2CDashboard />}

        {/* CRM-8: Request access for withheld permissions (B2B only) */}
        {isB2B && (
          <AccessRequestsPanel
            approvedForCheckout={customer.approved_for_checkout}
            approvedForDocuments={customer.approved_for_documents}
            approvedForWholesalePricing={customer.approved_for_wholesale_pricing}
          />
        )}

        {/* Quick links */}
        <div className="mt-10 rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Quick Actions</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-full border border-black/[0.08] px-5 py-2.5 text-[0.88rem] font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/40 hover:bg-[#fff5f3] hover:text-[var(--primary)]"
            >
              Browse Catalogue
            </Link>
            <Link
              href="/tyre-supply-quotation"
              className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Request a Quote
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-black/[0.08] px-5 py-2.5 text-[0.88rem] font-semibold text-[var(--foreground)] transition hover:border-black/20"
            >
              Contact Support
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </main>
  );
}
