import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  adminApiFetch,
  adminSafeFetch,
  AdminUnauthorizedError,
  type AdminQuote,
} from "@/lib/admin-api";
import QuotesTable from "@/components/admin/quotes-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quote Requests" };

type SearchParams = Promise<{
  status?: string;
  qualification_status?: string;
  lead_priority?: string;
  lead_customer_type?: string;
  assigned_to?: string;
  follow_up_due?: string;
  lead_source?: string;
  q?: string;
  page?: string;
}>;

// Pipeline summary shape returned by GET /admin/quote-requests/summary
type PipelineSummary = {
  new_count?: number;
  needs_review_count?: number;
  qualified_count?: number;
  proposal_sent_count?: number;
  follow_up_due_count?: number;
  unassigned_count?: number;
  high_priority_count?: number;
  spam_count?: number;
};

async function fetchSummary(): Promise<PipelineSummary> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/admin/quotes/summary`,
      { cache: "no-store" }
    );
    if (!res.ok) return {};
    return await res.json().catch(() => ({}));
  } catch {
    return {};
  }
}

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const {
    status, qualification_status, lead_priority, lead_customer_type,
    assigned_to, follow_up_due, lead_source, q, page,
  } = await searchParams;

  try {
    await adminApiFetch<AdminQuote[]>("/quote-requests", {
      params: { per_page: 1 },
      revalidate: false,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) redirect("/admin/login");
  }

  const params: Record<string, string | number> = { per_page: 20 };
  if (status && status !== "all")                       params.status = status;
  if (qualification_status && qualification_status !== "all") params.qualification_status = qualification_status;
  if (lead_priority && lead_priority !== "all")         params.lead_priority = lead_priority;
  if (lead_customer_type && lead_customer_type !== "all") params.lead_customer_type = lead_customer_type;
  if (assigned_to)                                      params.assigned_to = assigned_to;
  if (follow_up_due === "1")                            params.follow_up_due = 1;
  if (lead_source && lead_source !== "all")             params.lead_source = lead_source;
  if (q?.trim())                                        params.q = q.trim();
  if (page)                                             params.page = page;

  const [res, summary] = await Promise.all([
    adminSafeFetch<AdminQuote[]>("/quote-requests", { params, revalidate: false }),
    fetchSummary(),
  ]);

  const quotes: AdminQuote[] = Array.isArray(res?.data) ? res.data : [];
  const meta = res?.meta ?? {};

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
          Lead Pipeline
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          {typeof meta.total === "number"
            ? `${meta.total} request${meta.total !== 1 ? "s" : ""} total`
            : "Manage inbound quote requests and leads"}
        </p>
      </div>

      {/* ── Pipeline summary cards ── */}
      {Object.keys(summary).length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {[
            { label: "New",           value: summary.new_count,          qs: "?qualification_status=new",          color: "text-gray-700" },
            { label: "Needs Review",  value: summary.needs_review_count,  qs: "?qualification_status=needs_review",  color: "text-amber-700" },
            { label: "Qualified",     value: summary.qualified_count,     qs: "?qualification_status=qualified",     color: "text-emerald-700" },
            { label: "Proposal Sent", value: summary.proposal_sent_count, qs: "?qualification_status=proposal_sent", color: "text-blue-700" },
            { label: "Follow-up Due", value: summary.follow_up_due_count, qs: "?follow_up_due=1",                   color: "text-orange-700" },
            { label: "Unassigned",    value: summary.unassigned_count,    qs: "?assigned_to=none",                  color: "text-amber-600" },
            { label: "High Priority", value: summary.high_priority_count, qs: "?lead_priority=high",                color: "text-red-700" },
            { label: "Spam",          value: summary.spam_count,          qs: "?qualification_status=spam",          color: "text-purple-700" },
          ].map(({ label, value, qs, color }) =>
            value == null ? null : (
              <a
                key={label}
                href={`/admin/quotes${qs}`}
                className="flex flex-col rounded-xl border border-black/[0.07] bg-white px-3 py-3 shadow-sm transition hover:border-[#E85C1A]/40 hover:shadow-md"
              >
                <span className={`text-[1.3rem] font-extrabold leading-none ${color}`}>
                  {value}
                </span>
                <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#9ca3af]">
                  {label}
                </span>
              </a>
            )
          )}
        </div>
      )}

      <QuotesTable
        quotes={quotes}
        meta={meta}
        currentStatus={status ?? "all"}
        currentQualificationStatus={qualification_status ?? "all"}
        currentPriority={lead_priority ?? "all"}
        currentCustomerType={lead_customer_type ?? "all"}
        currentFollowUpDue={follow_up_due === "1"}
        currentQ={q ?? ""}
        currentPage={Number(page ?? 1)}
      />
    </div>
  );
}
