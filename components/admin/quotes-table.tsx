"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Eye, ChevronLeft, ChevronRight, X,
  CheckCircle2, XCircle, AlertOctagon, Loader2,
} from "lucide-react";
import type { AdminQuote } from "@/lib/admin-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Meta = {
  total?: number;
  current_page?: number;
  last_page?: number;
};

type Props = {
  quotes: AdminQuote[];
  meta: Meta;
  currentStatus: string;
  currentReviewStatus: string;
  currentQ: string;
  currentPage: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const WORKFLOW_TABS = ["all", "new", "reviewed", "quoted", "closed"] as const;

const REVIEW_TABS = [
  { key: "all",          label: "All Quality" },
  { key: "needs_review", label: "Needs Review" },
  { key: "qualified",    label: "Qualified" },
  { key: "rejected",     label: "Rejected" },
  { key: "spam",         label: "Spam" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const WORKFLOW_STYLES: Record<string, string> = {
  new:      "bg-orange-100 text-orange-700",
  reviewed: "bg-blue-100 text-blue-700",
  quoted:   "bg-emerald-100 text-emerald-700",
  closed:   "bg-gray-100 text-gray-500",
};

const REVIEW_STYLES: Record<string, string> = {
  new:          "bg-gray-100 text-gray-500",
  needs_review: "bg-amber-100 text-amber-700",
  qualified:    "bg-emerald-100 text-emerald-700",
  rejected:     "bg-red-100 text-red-700",
  spam:         "bg-purple-100 text-purple-700",
};

const REVIEW_LABELS: Record<string, string> = {
  new:          "New",
  needs_review: "Needs Review",
  qualified:    "Qualified",
  rejected:     "Rejected",
  spam:         "Spam",
};

function WorkflowBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold capitalize ${WORKFLOW_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function ReviewBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold ${REVIEW_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {REVIEW_LABELS[status] ?? status}
    </span>
  );
}

function QualityScore({ score }: { score?: number | null }) {
  if (score == null) return null;
  const color =
    score >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : score >= 50 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[0.62rem] font-bold ${color}`}>
      {score}
    </span>
  );
}

function shortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function QuotesTable({
  quotes: initialQuotes,
  meta,
  currentStatus,
  currentReviewStatus,
  currentQ,
  currentPage,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(currentQ);
  const [actionPending, setActionPending] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const [optimisticQuotes, updateOptimistic] = useOptimistic(
    initialQuotes,
    (prev: AdminQuote[], { id, review_status }: { id: number; review_status: string }) =>
      prev.map((qt) => (qt.id === id ? { ...qt, review_status } : qt))
  );

  const buildUrl = (overrides: {
    status?: string;
    review_status?: string;
    q?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    const statusVal = overrides.status ?? currentStatus;
    const reviewVal = overrides.review_status ?? currentReviewStatus;
    const qVal = overrides.q ?? q;
    const pageVal = overrides.page ?? 1;
    if (statusVal && statusVal !== "all") params.set("status", statusVal);
    if (reviewVal && reviewVal !== "all") params.set("review_status", reviewVal);
    if (qVal.trim()) params.set("q", qVal.trim());
    if (pageVal > 1) params.set("page", String(pageVal));
    const qs = params.toString();
    return `/admin/quotes${qs ? `?${qs}` : ""}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ page: 1 }));
  };

  async function doReview(id: number, action: "qualify" | "reject" | "spam") {
    setActionPending(id);
    const review_status = action === "qualify" ? "qualified" : action === "reject" ? "rejected" : "spam";
    startTransition(() => updateOptimistic({ id, review_status }));
    try {
      await fetch(`/api/admin/quotes/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch { /* silent — row still shows optimistic value */ }
    finally { setActionPending(null); }
  }

  const lastPage = meta.last_page ?? 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < lastPage;

  return (
    <>
      {/* ── Filters row ── */}
      <div className="mb-4 flex flex-col gap-3">

        {/* Search + workflow status */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by ref, name, or email…"
                className="h-10 w-full rounded-xl border border-black/[0.09] bg-white pl-9 pr-4 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              />
            </div>
            <button type="submit" className="h-10 rounded-xl bg-[#1a1a1a] px-4 text-[0.875rem] font-semibold text-white transition hover:bg-[#333]">
              Search
            </button>
            {q && (
              <button type="button" onClick={() => { setQ(""); router.push(buildUrl({ q: "", page: 1 })); }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.09] bg-white text-[#5c5e62] transition hover:text-red-500">
                <X size={14} />
              </button>
            )}
          </form>

          {/* Workflow status tabs */}
          <div className="flex gap-1.5 overflow-x-auto">
            {WORKFLOW_TABS.map((s) => (
              <button key={s} type="button" onClick={() => router.push(buildUrl({ status: s, page: 1 }))}
                className={[
                  "h-10 whitespace-nowrap rounded-xl px-3.5 text-[0.8rem] font-semibold capitalize transition",
                  currentStatus === s
                    ? "bg-[#1a1a1a] text-white"
                    : "border border-black/[0.09] bg-white text-[#5c5e62] hover:border-[#1a1a1a] hover:text-[#1a1a1a]",
                ].join(" ")}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Review status filter (CRM-2) */}
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">Quality</span>
          <div className="flex flex-wrap gap-1.5">
            {REVIEW_TABS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => router.push(buildUrl({ review_status: key, page: 1 }))}
                className={[
                  "h-8 whitespace-nowrap rounded-lg px-3 text-[0.75rem] font-semibold transition",
                  currentReviewStatus === key
                    ? "bg-[#E85C1A] text-white"
                    : "border border-black/[0.09] bg-white text-[#5c5e62] hover:border-[#E85C1A] hover:text-[#E85C1A]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                {["Ref", "Requester", "Category", "Country", "Qty", "Status", "Review", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {optimisticQuotes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[0.875rem] text-[#5c5e62]">
                    No quote requests found.
                  </td>
                </tr>
              ) : (
                optimisticQuotes.map((quote) => {
                  const isPending = actionPending === quote.id;
                  return (
                    <tr key={quote.id} className="group transition hover:bg-[#fafafa]">
                      {/* Ref */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[0.82rem] font-semibold text-[#1a1a1a]">
                          {quote.ref_number}
                        </span>
                      </td>
                      {/* Requester */}
                      <td className="px-4 py-3">
                        <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">{quote.full_name}</p>
                        <p className="text-[0.73rem] text-[#5c5e62]">{quote.email}</p>
                        {quote.company_name && (
                          <p className="text-[0.73rem] text-[#5c5e62]">{quote.company_name}</p>
                        )}
                        {quote.quality_score != null && (
                          <div className="mt-0.5">
                            <QualityScore score={quote.quality_score} />
                          </div>
                        )}
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3 text-[0.83rem] capitalize text-[#5c5e62]">
                        {quote.tyre_category}
                      </td>
                      {/* Country */}
                      <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                        {quote.country}
                      </td>
                      {/* Qty */}
                      <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                        {quote.quantity ?? "—"}
                      </td>
                      {/* Workflow status */}
                      <td className="px-4 py-3">
                        <WorkflowBadge status={quote.status} />
                      </td>
                      {/* Review status + actions */}
                      <td className="px-4 py-3">
                        <ReviewBadge status={quote.review_status} />
                        {isPending ? (
                          <Loader2 size={13} className="mt-1 animate-spin text-[#E85C1A]" />
                        ) : (
                          quote.review_status !== "qualified" &&
                          quote.review_status !== "spam" &&
                          quote.review_status !== "rejected" && (
                            <div className="mt-1 flex items-center gap-1">
                              <button type="button" title="Qualify" onClick={() => doReview(quote.id, "qualify")}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50">
                                <CheckCircle2 size={11} strokeWidth={2.5} />
                              </button>
                              <button type="button" title="Reject" onClick={() => doReview(quote.id, "reject")}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-red-200 text-red-500 transition hover:bg-red-50">
                                <XCircle size={11} strokeWidth={2.5} />
                              </button>
                              <button type="button" title="Mark as spam" onClick={() => doReview(quote.id, "spam")}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-purple-200 text-purple-600 transition hover:bg-purple-50">
                                <AlertOctagon size={11} strokeWidth={2.5} />
                              </button>
                            </div>
                          )
                        )}
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                        {shortDate(quote.created_at)}
                      </td>
                      {/* View */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/quotes/${quote.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#E85C1A]/10 hover:text-[#E85C1A]"
                          title="View quote"
                        >
                          <Eye size={14} strokeWidth={2} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
            <p className="text-[0.78rem] text-[#5c5e62]">
              Page {currentPage} of {lastPage}
              {typeof meta.total === "number" && ` · ${meta.total} requests`}
            </p>
            <div className="flex gap-2">
              <Link
                href={hasPrev ? buildUrl({ page: currentPage - 1 }) : "#"}
                aria-disabled={!hasPrev}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition ${hasPrev ? "bg-white text-[#1a1a1a] hover:border-[#E85C1A] hover:text-[#E85C1A]" : "pointer-events-none bg-[#f5f5f5] text-[#ccc]"}`}
              >
                <ChevronLeft size={14} />
              </Link>
              <Link
                href={hasNext ? buildUrl({ page: currentPage + 1 }) : "#"}
                aria-disabled={!hasNext}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition ${hasNext ? "bg-white text-[#1a1a1a] hover:border-[#E85C1A] hover:text-[#E85C1A]" : "pointer-events-none bg-[#f5f5f5] text-[#ccc]"}`}
              >
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
