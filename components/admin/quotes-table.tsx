"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Eye, ChevronLeft, ChevronRight, X,
  CheckCircle2, XCircle, AlertOctagon, Loader2,
  AlertTriangle, Clock, User,
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
  currentQualificationStatus: string;
  currentPriority: string;
  currentCustomerType: string;
  currentFollowUpDue: boolean;
  currentQ: string;
  currentPage: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const WORKFLOW_TABS = ["all", "new", "reviewed", "quoted", "closed"] as const;

const QUAL_TABS = [
  { key: "all",              label: "All" },
  { key: "new",              label: "New" },
  { key: "needs_review",     label: "Needs Review" },
  { key: "qualified",        label: "Qualified" },
  { key: "proposal_sent",    label: "Proposal Sent" },
  { key: "customer_invited", label: "Invited" },
  { key: "converted",        label: "Converted" },
  { key: "rejected",         label: "Rejected" },
  { key: "spam",             label: "Spam" },
] as const;

// CRM-7 proposal status display
const PROPOSAL_STYLES: Record<string, string> = {
  draft:     "bg-amber-50 text-amber-700 border border-amber-200",
  ready:     "bg-blue-50 text-blue-700 border border-blue-200",
  sent:      "bg-indigo-50 text-indigo-700 border border-indigo-200",
  accepted:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected:  "bg-red-50 text-red-600 border border-red-200",
  expired:   "bg-gray-100 text-gray-500 border border-gray-200",
  converted: "bg-teal-50 text-teal-700 border border-teal-200",
};

const PROPOSAL_LABELS: Record<string, string> = {
  draft:     "P: Draft",
  ready:     "P: Ready",
  sent:      "P: Sent",
  accepted:  "P: Accepted",
  rejected:  "P: Rejected",
  expired:   "P: Expired",
  converted: "P: Converted",
};

function ProposalBadge({ status }: { status?: string | null }) {
  if (!status || status === "none") return null;
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.62rem] font-bold ${PROPOSAL_STYLES[status] ?? "bg-gray-100 text-gray-500 border border-gray-200"}`}>
      {PROPOSAL_LABELS[status] ?? `P: ${status}`}
    </span>
  );
}

const PRIORITY_TABS = [
  { key: "all",    label: "All Priority" },
  { key: "urgent", label: "Urgent" },
  { key: "high",   label: "High" },
  { key: "normal", label: "Normal" },
  { key: "low",    label: "Low" },
] as const;

const CUSTOMER_TYPE_TABS = [
  { key: "all",          label: "All Types" },
  { key: "dealer",       label: "Dealer" },
  { key: "workshop",     label: "Workshop" },
  { key: "fleet",        label: "Fleet" },
  { key: "exporter",     label: "Exporter" },
  { key: "private_buyer",label: "Private" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const WORKFLOW_STYLES: Record<string, string> = {
  new:      "bg-orange-100 text-orange-700",
  reviewed: "bg-blue-100 text-blue-700",
  quoted:   "bg-emerald-100 text-emerald-700",
  closed:   "bg-gray-100 text-gray-500",
};

const QUAL_STYLES: Record<string, string> = {
  new:              "bg-gray-100 text-gray-500",
  needs_review:     "bg-amber-100 text-amber-700",
  qualified:        "bg-emerald-100 text-emerald-700",
  proposal_sent:    "bg-blue-100 text-blue-700",
  customer_invited: "bg-purple-100 text-purple-700",
  converted:        "bg-teal-100 text-teal-700",
  rejected:         "bg-red-100 text-red-700",
  spam:             "bg-zinc-200 text-zinc-600",
  closed:           "bg-gray-100 text-gray-400",
};

const QUAL_LABELS: Record<string, string> = {
  new:              "New",
  needs_review:     "Needs Review",
  qualified:        "Qualified",
  proposal_sent:    "Proposal Sent",
  customer_invited: "Invited",
  converted:        "Converted",
  rejected:         "Rejected",
  spam:             "Spam",
  closed:           "Closed",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high:   "bg-amber-100 text-amber-700 border-amber-200",
  normal: "bg-gray-100 text-gray-500 border-gray-200",
  low:    "bg-gray-50 text-gray-400 border-gray-100",
};

function WorkflowBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold capitalize ${WORKFLOW_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function QualBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold ${QUAL_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {QUAL_LABELS[status] ?? status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  if (!priority || priority === "normal") return null;
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.normal}`}>
      {priority === "urgent" && <AlertTriangle size={9} className="mr-0.5 shrink-0" />}
      {priority}
    </span>
  );
}

function QualityScore({ score }: { score?: number | null }) {
  if (score == null) return null;
  const color = score >= 80
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : score >= 50 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[0.62rem] font-bold ${color}`}>
      {score}
    </span>
  );
}

function FollowUpIndicator({ followUpAt }: { followUpAt?: string | null }) {
  if (!followUpAt) return null;
  const due = new Date(followUpAt);
  const now = new Date();
  const isOverdue = due < now;
  const isDueSoon = !isOverdue && due.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
  if (!isOverdue && !isDueSoon) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[0.62rem] font-bold ${isOverdue ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
      <Clock size={9} className="shrink-0" />
      {isOverdue ? "Overdue" : "Due soon"}
    </span>
  );
}

function shortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}

function fmtFollowUp(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch { return iso; }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function QuotesTable({
  quotes: initialQuotes,
  meta,
  currentStatus,
  currentQualificationStatus,
  currentPriority,
  currentCustomerType,
  currentFollowUpDue,
  currentQ,
  currentPage,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(currentQ);
  const [actionPending, setActionPending] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const [optimisticQuotes, updateOptimistic] = useOptimistic(
    initialQuotes,
    (prev: AdminQuote[], { id, patch }: { id: number; patch: Partial<AdminQuote> }) =>
      prev.map((qt) => (qt.id === id ? { ...qt, ...patch } : qt))
  );

  const buildUrl = (overrides: Record<string, string | number | boolean | undefined>) => {
    const params = new URLSearchParams();
    const st = (overrides.status as string) ?? currentStatus;
    const qs = (overrides.qualification_status as string) ?? currentQualificationStatus;
    const pr = (overrides.lead_priority as string) ?? currentPriority;
    const ct = (overrides.lead_customer_type as string) ?? currentCustomerType;
    const fud = overrides.follow_up_due !== undefined ? overrides.follow_up_due : currentFollowUpDue;
    const qv = (overrides.q as string) ?? q;
    const pg = (overrides.page as number) ?? 1;
    if (st && st !== "all")  params.set("status", st);
    if (qs && qs !== "all")  params.set("qualification_status", qs);
    if (pr && pr !== "all")  params.set("lead_priority", pr);
    if (ct && ct !== "all")  params.set("lead_customer_type", ct);
    if (fud)                 params.set("follow_up_due", "1");
    if (qv.trim())           params.set("q", qv.trim());
    if (pg > 1)              params.set("page", String(pg));
    const s = params.toString();
    return `/admin/quotes${s ? `?${s}` : ""}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ page: 1 }));
  };

  async function doReview(id: number, action: "qualify" | "reject" | "spam") {
    setActionPending(id);
    const patch: Partial<AdminQuote> = {
      qualification_status: action === "qualify" ? "qualified" : action === "reject" ? "rejected" : "spam",
    };
    startTransition(() => updateOptimistic({ id, patch }));
    try {
      await fetch(`/api/admin/quotes/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch { /* silent */ }
    finally { setActionPending(null); }
  }

  const lastPage = meta.last_page ?? 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < lastPage;

  return (
    <>
      {/* ── Filters ── */}
      <div className="mb-4 flex flex-col gap-2.5">

        {/* Search + workflow */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
              <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search by ref, name, email, or company…"
                className="h-10 w-full rounded-xl border border-black/[0.09] bg-white pl-9 pr-4 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
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
          {/* Workflow status */}
          <div className="flex gap-1.5 overflow-x-auto">
            {WORKFLOW_TABS.map((s) => (
              <button key={s} type="button" onClick={() => router.push(buildUrl({ status: s, page: 1 }))}
                className={["h-10 whitespace-nowrap rounded-xl px-3 text-[0.78rem] font-semibold capitalize transition",
                  currentStatus === s ? "bg-[#1a1a1a] text-white" : "border border-black/[0.09] bg-white text-[#5c5e62] hover:border-[#1a1a1a] hover:text-[#1a1a1a]",
                ].join(" ")}>
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Qualification status tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">Pipeline</span>
          {QUAL_TABS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => router.push(buildUrl({ qualification_status: key, page: 1 }))}
              className={["h-7 whitespace-nowrap rounded-lg px-2.5 text-[0.73rem] font-semibold transition",
                currentQualificationStatus === key ? "bg-[#E85C1A] text-white" : "border border-black/[0.09] bg-white text-[#5c5e62] hover:border-[#E85C1A] hover:text-[#E85C1A]",
              ].join(" ")}>
              {label}
            </button>
          ))}
        </div>

        {/* Priority + customer type + follow-up filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">Priority</span>
            {PRIORITY_TABS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => router.push(buildUrl({ lead_priority: key, page: 1 }))}
                className={["h-7 whitespace-nowrap rounded-lg px-2.5 text-[0.73rem] font-semibold transition",
                  currentPriority === key ? "bg-[#1a1a1a] text-white" : "border border-black/[0.09] bg-white text-[#5c5e62] hover:bg-[#f5f5f5]",
                ].join(" ")}>
                {label}
              </button>
            ))}
          </div>
          {/* Customer type */}
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">Type</span>
            {CUSTOMER_TYPE_TABS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => router.push(buildUrl({ lead_customer_type: key, page: 1 }))}
                className={["h-7 whitespace-nowrap rounded-lg px-2.5 text-[0.73rem] font-semibold transition",
                  currentCustomerType === key ? "bg-[#1a1a1a] text-white" : "border border-black/[0.09] bg-white text-[#5c5e62] hover:bg-[#f5f5f5]",
                ].join(" ")}>
                {label}
              </button>
            ))}
          </div>
          {/* Follow-up due toggle */}
          <button type="button" onClick={() => router.push(buildUrl({ follow_up_due: !currentFollowUpDue, page: 1 }))}
            className={["flex h-7 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[0.73rem] font-semibold transition",
              currentFollowUpDue ? "bg-amber-500 text-white" : "border border-black/[0.09] bg-white text-[#5c5e62] hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700",
            ].join(" ")}>
            <Clock size={11} className="shrink-0" />
            Follow-up Due
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                {["Ref", "Requester", "Product", "Priority", "Pipeline Status", "Assigned", "Follow-up", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">{h}</th>
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
                  const effectiveQualStatus = quote.qualification_status ?? quote.review_status;
                  return (
                    <tr key={quote.id} className="group transition hover:bg-[#fafafa]">
                      {/* Ref */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[0.82rem] font-semibold text-[#1a1a1a]">
                          {quote.ref_number}
                        </span>
                        {quote.lead_source && (
                          <p className="mt-0.5 text-[0.65rem] text-[#9ca3af]">{quote.lead_source.replace(/_/g, " ")}</p>
                        )}
                      </td>
                      {/* Requester */}
                      <td className="px-4 py-3">
                        <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">{quote.full_name}</p>
                        <p className="text-[0.73rem] text-[#5c5e62]">{quote.email}</p>
                        {quote.company_name && <p className="text-[0.73rem] text-[#5c5e62]">{quote.company_name}</p>}
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {quote.quality_score != null && <QualityScore score={quote.quality_score} />}
                          {quote.lead_customer_type && quote.lead_customer_type !== "unknown" && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.62rem] font-semibold text-gray-500 capitalize">
                              {quote.lead_customer_type.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Product */}
                      <td className="px-4 py-3">
                        <p className="text-[0.83rem] capitalize text-[#5c5e62]">{quote.tyre_category}</p>
                        <p className="text-[0.73rem] text-[#9ca3af]">{quote.country}</p>
                        {quote.quantity && <p className="text-[0.73rem] text-[#9ca3af]">Qty: {quote.quantity}</p>}
                      </td>
                      {/* Priority */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <PriorityBadge priority={quote.lead_priority} />
                          <WorkflowBadge status={quote.status} />
                        </div>
                      </td>
                      {/* Pipeline Status + actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <QualBadge status={effectiveQualStatus} />
                          <ProposalBadge status={quote.proposal_status} />
                        </div>
                        {isPending ? (
                          <Loader2 size={13} className="mt-1 animate-spin text-[#E85C1A]" />
                        ) : (
                          effectiveQualStatus !== "qualified" &&
                          effectiveQualStatus !== "spam" &&
                          effectiveQualStatus !== "converted" && (
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
                      {/* Assigned */}
                      <td className="px-4 py-3">
                        {quote.assigned_to_name ? (
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="shrink-0 text-[#9ca3af]" />
                            <span className="text-[0.8rem] text-[#5c5e62]">{quote.assigned_to_name}</span>
                          </div>
                        ) : (
                          <span className="text-[0.78rem] italic text-[#9ca3af]">Unassigned</span>
                        )}
                      </td>
                      {/* Follow-up */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {quote.follow_up_at && (
                            <span className="text-[0.78rem] text-[#5c5e62]">{fmtFollowUp(quote.follow_up_at)}</span>
                          )}
                          <FollowUpIndicator followUpAt={quote.follow_up_at} />
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">
                        {shortDate(quote.created_at)}
                      </td>
                      {/* View */}
                      <td className="px-4 py-3">
                        <Link href={`/admin/quotes/${quote.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#E85C1A]/10 hover:text-[#E85C1A]"
                          title="View quote">
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
              <Link href={hasPrev ? buildUrl({ page: currentPage - 1 }) : "#"} aria-disabled={!hasPrev}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition ${hasPrev ? "bg-white text-[#1a1a1a] hover:border-[#E85C1A] hover:text-[#E85C1A]" : "pointer-events-none bg-[#f5f5f5] text-[#ccc]"}`}>
                <ChevronLeft size={14} />
              </Link>
              <Link href={hasNext ? buildUrl({ page: currentPage + 1 }) : "#"} aria-disabled={!hasNext}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition ${hasNext ? "bg-white text-[#1a1a1a] hover:border-[#E85C1A] hover:text-[#E85C1A]" : "pointer-events-none bg-[#f5f5f5] text-[#ccc]"}`}>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
