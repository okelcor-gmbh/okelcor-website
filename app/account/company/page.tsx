"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Building2, Save, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { updateCustomerProfile } from "@/lib/customer-auth";

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[0.93rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

const inputReadonlyCls =
  "w-full rounded-[12px] border border-black/[0.05] bg-[#f5f5f5] px-4 py-3 text-[0.93rem] text-[var(--muted)] cursor-not-allowed";

const INDUSTRIES = [
  "Automotive Retail",
  "Automotive Wholesale",
  "Fleet Management",
  "Logistics & Transport",
  "Construction",
  "Agriculture",
  "Mining",
  "Tyre Manufacturing",
  "Tyre Distribution",
  "Other",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.82rem] font-semibold text-[var(--foreground)]">{label}</label>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyDetailsPage() {
  const { customer, isLoading, refreshCustomer } = useCustomerAuth();
  const isB2B = customer?.customer_type === "b2b";

  const [companyName, setCompanyName] = useState(customer?.company_name ?? "");
  const [industry, setIndustry]       = useState(customer?.industry ?? "");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Keep form in sync after initial load
  if (!isLoading && customer) {
    if (companyName === "" && customer.company_name) setCompanyName(customer.company_name);
    if (industry    === "" && customer.industry)     setIndustry(customer.industry);
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateCustomerProfile({ company_name: companyName, industry });
      await refreshCustomer();
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="tesla-shell pb-16 pt-[96px]">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-[0.8rem] text-[var(--muted)]">
          <Link href="/account" className="hover:text-[var(--foreground)]">My Account</Link>
          <ChevronRight size={13} strokeWidth={2} />
          <span className="text-[var(--foreground)] font-medium">Company Details</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">B2B</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Company Details</h1>
        </div>

        <div className="max-w-[640px] space-y-5">

          {/* Company information card */}
          <div className="rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-center gap-2">
              <Building2 size={18} strokeWidth={1.8} className="text-[var(--primary)]" />
              <p className="font-bold text-[var(--foreground)]">Business Information</p>
            </div>

            <div className="flex flex-col gap-4">
              <Field label="Company Name">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company name"
                  className={inputCls}
                />
              </Field>

              <Field label="Industry">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={inputCls + " appearance-none"}
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </Field>

              {isB2B && (
                <Field label="VAT Number">
                  <input
                    type="text"
                    value={customer?.vat_number ?? "—"}
                    readOnly
                    className={inputReadonlyCls}
                  />
                  <p className="mt-1 text-[0.75rem] text-[var(--muted)]">
                    VAT number cannot be changed here.{" "}
                    <Link href="/contact" className="text-[var(--primary)] hover:underline">
                      Contact support
                    </Link>{" "}
                    to update it.
                  </p>
                </Field>
              )}

              <Field label="Account Email">
                <input
                  type="email"
                  value={customer?.email ?? ""}
                  readOnly
                  className={inputReadonlyCls}
                />
              </Field>
            </div>

            {error && (
              <p className="mt-4 rounded-[10px] bg-red-50 px-4 py-2 text-[0.82rem] text-red-600">{error}</p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </span>
                ) : (
                  <>
                    <Save size={14} strokeWidth={2.2} />
                    Save Changes
                  </>
                )}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-[0.85rem] font-semibold text-green-600">
                  <CheckCircle2 size={15} />
                  Saved
                </span>
              )}
            </div>
          </div>

          {/* VAT card link — B2B only */}
          {isB2B && (
            <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">VAT Registration Status</p>
                  <p className="mt-0.5 text-[0.83rem] text-[var(--muted)]">View your VAT validation and registration details</p>
                </div>
                <Link
                  href="/account/vat"
                  className="flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--primary)] hover:underline"
                >
                  View <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </main>
  );
}
