import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { adminApiFetch, AdminUnauthorizedError } from "@/lib/admin-api";
import DataQualityIssuesTable from "@/components/admin/data-quality-issues-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer Data Quality" };

type Summary = {
  total_customers?: number;
  clean_count?: number;
  needs_review_count?: number;
  duplicate_suspected_count?: number;
  incomplete_count?: number;
  personal_email_count?: number;
};

async function fetchSummary(): Promise<Summary> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/admin/customers/data-quality/summary`,
      { cache: "no-store" }
    );
    if (!res.ok) return {};
    return await res.json().catch(() => ({}));
  } catch { return {}; }
}

export default async function DataQualityPage() {
  // Auth guard
  try {
    await adminApiFetch("/customers?per_page=1", { revalidate: false });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const summary = await fetchSummary();
  const hasSummary = Object.keys(summary).length > 0;

  const summaryCards = [
    { label: "Total Customers", value: summary.total_customers,          href: "/admin/customers",                                            color: "text-[#1a1a1a]" },
    { label: "Clean",           value: summary.clean_count,               href: "/admin/customers?data_review_status=clean",                   color: "text-emerald-700" },
    { label: "Needs Review",    value: summary.needs_review_count,        href: "/admin/customers/data-quality?status=needs_review",           color: "text-amber-700" },
    { label: "Duplicates",      value: summary.duplicate_suspected_count, href: "/admin/customers/data-quality?status=duplicate_suspected",    color: "text-orange-700" },
    { label: "Incomplete",      value: summary.incomplete_count,          href: "/admin/customers/data-quality?flag=incomplete_profile",       color: "text-red-700" },
    { label: "Personal Email",  value: summary.personal_email_count,      href: "/admin/customers/data-quality?flag=personal_email_for_b2b",  color: "text-purple-700" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
          Customer Data Quality
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Detect duplicates, incomplete profiles, and data issues across the customer database.
        </p>
      </div>

      {/* Summary cards */}
      {hasSummary && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {summaryCards.map(({ label, value, href, color }) =>
            value == null ? null : (
              <a key={label} href={href}
                className="flex flex-col rounded-xl border border-black/[0.07] bg-white px-3 py-3 shadow-sm transition hover:border-[#E85C1A]/40 hover:shadow-md">
                <span className={`text-[1.3rem] font-extrabold leading-none ${color}`}>{value}</span>
                <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#9ca3af]">
                  {label}
                </span>
              </a>
            )
          )}
        </div>
      )}

      {!hasSummary && (
        <div className="mb-6 rounded-2xl border border-black/[0.07] bg-white px-5 py-4 text-[0.83rem] text-[#9ca3af]">
          Summary data unavailable — backend endpoint not yet deployed. Issues table is still functional.
        </div>
      )}

      {/* Issues table */}
      <DataQualityIssuesTable />
    </div>
  );
}
