"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck, CheckCircle2, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VATStatusPage() {
  const { customer, isLoading } = useCustomerAuth();

  if (isLoading) {
    return (
      <div>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      </div>
    );
  }

  const hasVat = !!customer?.vat_number;

  return (
    <div>

      <div className="">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-[0.8rem] text-[var(--muted)]">
          <Link href="/account" className="hover:text-[var(--foreground)]">My Account</Link>
          <ChevronRight size={13} strokeWidth={2} />
          <span className="text-[var(--foreground)] font-medium">VAT Status</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">B2B</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">VAT Status</h1>
        </div>

        <div className="max-w-[640px] space-y-5">

          {/* VAT number card */}
          <div className="rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={18} strokeWidth={1.8} className="text-[var(--primary)]" />
              <p className="font-bold text-[var(--foreground)]">VAT Registration</p>
            </div>

            {hasVat ? (
              <div className="space-y-4">
                <div className="rounded-[14px] border border-black/[0.05] bg-[#f5f5f5] px-5 py-4">
                  <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">VAT Number</p>
                  <p className="mt-1 text-[1.1rem] font-extrabold tracking-tight text-[var(--foreground)]">
                    {customer.vat_number}
                  </p>
                </div>

                {/* Status indicator — backend will drive this, for now show "on file" */}
                <div className="flex items-start gap-3 rounded-[14px] border border-green-200 bg-green-50 px-5 py-4">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">VAT number on file</p>
                    <p className="mt-0.5 text-[0.82rem] text-green-700">
                      Your VAT number has been recorded. Our team verifies EU VAT numbers against the VIES database. Verification status will be shown here once confirmed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-5 py-4">
                  <Clock size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-800">Verification pending</p>
                    <p className="mt-0.5 text-[0.82rem] text-amber-700">
                      Live VIES verification status requires backend integration. Contact our team if you need urgent VAT confirmation for your account.
                    </p>
                  </div>
                </div>

                <a
                  href={`https://ec.europa.eu/taxation_customs/vies/#/vat-validation`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[0.83rem] font-semibold text-[var(--primary)] hover:underline"
                >
                  Verify on EU VIES portal <ExternalLink size={13} />
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-5 py-4">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-800">No VAT number on file</p>
                    <p className="mt-0.5 text-[0.82rem] text-amber-700">
                      You have not provided a VAT number. B2B accounts with valid EU VAT numbers may qualify for tax-exempt wholesale pricing.
                    </p>
                  </div>
                </div>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                >
                  Contact support to add VAT
                </Link>
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <p className="font-semibold text-[var(--foreground)]">Why VAT matters for B2B orders</p>
            <ul className="mt-3 space-y-2 text-[0.83rem] leading-6 text-[var(--muted)]">
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                EU businesses with valid VAT numbers can receive intra-community supplies tax-exempt.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                Your VAT number is verified against the EU VIES database.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                Non-EU businesses should contact our team for applicable tax rules.
              </li>
            </ul>
            <div className="mt-4 border-t border-black/[0.05] pt-4">
              <Link
                href="/account/company"
                className="flex items-center gap-1.5 text-[0.83rem] font-semibold text-[var(--primary)] hover:underline"
              >
                <ChevronRight size={14} />
                Manage Company Details
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
