"use client";

import { useState, useTransition, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, AlertCircle, ChevronDown, Paperclip,
  Download, ShoppingCart, ExternalLink, Loader2,
  CheckCircle, XCircle, AlertOctagon,
  UserPlus, User, Calendar, Flag, Tag, Save, X,
  Mail,
} from "lucide-react";
import CommunicationTimeline from "@/components/admin/communication-timeline";
import FollowUpEmailModal from "@/components/admin/follow-up-email-modal";
import QuoteItemsCard from "@/components/admin/quote-items-card";
import ProposalCard from "@/components/admin/proposal-card";
import { updateQuoteStatus } from "@/app/admin/quotes/actions";
import type { ConvertToOrderResult } from "@/app/admin/quotes/actions";
import type { AdminQuoteFull, QuoteItem } from "@/lib/admin-api";
import { formatIncoterm } from "@/lib/utils";
import QuoteConvertModal from "@/components/admin/quote-convert-modal";

const QUOTE_STATUSES = ["new", "reviewed", "quoted", "closed"] as const;
type QuoteStatus = (typeof QUOTE_STATUSES)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  new:      "bg-orange-100 text-orange-700",
  reviewed: "bg-blue-100 text-blue-700",
  quoted:   "bg-emerald-100 text-emerald-700",
  closed:   "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.75rem] font-bold capitalize ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function shortDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ENUM_LABELS: Record<string, string> = {
  grade_a:        "Grade A",
  grade_b:        "Grade B",
  mixed:          "Mixed",
  new:            "New",
  used:           "Used",
  delivery_terms: "Delivery Terms",
  shipping_terms: "Shipping Terms",
};

function formatEnum(value?: string | null): string | null {
  if (!value) return null;
  return ENUM_LABELS[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function InfoRow({ label, value, fallback }: { label: string; value?: string | null; fallback?: string }) {
  if (!value && !fallback) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">{label}</p>
      <p className={`text-[0.875rem] ${!value ? "italic text-[#9ca3af]" : "text-[#1a1a1a]"}`}>
        {value || fallback}
      </p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">{title}</p>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const REVIEW_STATUS_STYLES: Record<string, string> = {
  new:          "bg-gray-100 text-gray-500",
  needs_review: "bg-amber-100 text-amber-700",
  qualified:    "bg-emerald-100 text-emerald-700",
  rejected:     "bg-red-100 text-red-700",
  spam:         "bg-purple-100 text-purple-700",
};
const REVIEW_STATUS_LABELS: Record<string, string> = {
  new:          "New",
  needs_review: "Needs Review",
  qualified:    "Qualified",
  rejected:     "Rejected",
  spam:         "Spam",
};

export default function QuoteDetail({
  quote,
  adminRole,
}: {
  quote: AdminQuoteFull;
  adminRole?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<QuoteStatus>(
    QUOTE_STATUSES.includes(quote.status as QuoteStatus)
      ? (quote.status as QuoteStatus)
      : "new"
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // CRM-2 review state
  const [reviewStatus, setReviewStatus] = useState<string | undefined>(
    (quote as Record<string, unknown>).review_status as string | undefined
  );
  const [reviewPending, setReviewPending] = useState<string | null>(null);
  const [reviewMsg, setReviewMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertedOrder, setConvertedOrder] = useState<ConvertToOrderResult | null>(null);
  const [downloadingAttachment, setDownloadingAttachment] = useState(false);

  const isDirty = status !== quote.status;

  const effectiveOrderRef = convertedOrder?.order_ref ?? quote.order_ref ?? null;
  const effectiveOrderId  = convertedOrder?.order_id  ?? quote.order_id  ?? null;
  const isConverted       = !!(effectiveOrderRef || convertedOrder);

  const handleSave = () => {
    setSaveError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateQuoteStatus(quote.id, status);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.push("/admin/quotes");
      }
    });
  };

  function handleConvertSuccess(result: ConvertToOrderResult) {
    setConvertedOrder(result);
    setShowConvertModal(false);
  }

  async function doReview(action: "qualify" | "reject" | "spam") {
    setReviewPending(action);
    setReviewMsg(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quote.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReviewMsg({ type: "err", text: (json as Record<string, unknown>).error as string ?? `Action failed (HTTP ${res.status})` });
      } else {
        const next = action === "qualify" ? "qualified" : action === "reject" ? "rejected" : "spam";
        setReviewStatus(next);
        setReviewMsg({ type: "ok", text: (json as Record<string, unknown>).message as string ?? "Review status updated." });
      }
    } catch {
      setReviewMsg({ type: "err", text: "Network error — could not complete review action." });
    } finally {
      setReviewPending(null);
    }
  }

  // CRM-3 pipeline state
  const q = quote as Record<string, unknown>;
  const [pipeline, setPipeline] = useState({
    assigned_to:          (q.assigned_to         as number | null)  ?? null,
    assigned_to_name:     (q.assigned_to_name     as string)        ?? "",
    follow_up_at:         (q.follow_up_at         as string)        ?? "",
    lead_priority:        (q.lead_priority        as string)        ?? "normal",
    lead_customer_type:   (q.lead_customer_type   as string)        ?? "unknown",
    qualification_status: (q.qualification_status as string)        ?? "new",
    qualification_reason: (q.qualification_reason as string)        ?? "",
    internal_notes:       (q.internal_notes       as string)        ?? "",
  });
  const [pipelineSaving, setPipelineSaving] = useState(false);
  const [pipelineMsg, setPipelineMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Admin users for assign dropdown
  const [adminUsers, setAdminUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [adminUsersLoaded, setAdminUsersLoaded] = useState(false);

  // Convert to customer modal
  const [showConvertToCustomer, setShowConvertToCustomer] = useState(false);
  const [convertPending, setConvertPending] = useState(false);
  const [convertAction, setConvertAction] = useState<"invite" | "approve" | "pending_review">("invite");
  const [convertResult, setConvertResult] = useState<{ customer_id?: number; customer_exists?: boolean; message?: string } | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  // Structured conflict — backend returned a 409 or known conflict code
  const [convertConflict, setConvertConflict] = useState<{
    code: string;
    message: string;
    customer_id?: number;
  } | null>(null);

  const [showEmailModal, setShowEmailModal] = useState(false);

  // CRM-7 proposal state (tracked here so Convert to Order can gate on it)
  const [proposalStatus, setProposalStatus] = useState<string | null>(
    (quote as Record<string, unknown>).proposal_status as string | null ?? null
  );
  // CRM-7 persisted quote items (from QuoteItemsCard; undefined = still loading).
  // Held here so ProposalCard can build the draft body from the SAME persisted
  // source the editor writes to (quote_request_items) — not quote.tyre_items.
  const [quoteItems, setQuoteItems] = useState<QuoteItem[] | undefined>(undefined);
  const quoteItemCount = quoteItems?.length;

  // Convert to Order is gated if there is an active proposal that hasn't been accepted.
  // null / "none" = no proposal in use → no gate (backward compat with old quotes).
  const hasProposalGate = !!proposalStatus && proposalStatus !== "none";
  const proposalAccepted = proposalStatus === "accepted" || proposalStatus === "converted";
  const proposalGated = hasProposalGate && !proposalAccepted;
  const isSuperAdmin = adminRole === "super_admin";

  // Override confirmation state
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);

  const loadAdminUsers = async () => {
    if (adminUsersLoaded) return;
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [] }));
      setAdminUsers(Array.isArray(json.data) ? json.data : []);
    } catch { /* graceful */ }
    finally { setAdminUsersLoaded(true); }
  };

  const savePipeline = async () => {
    setPipelineSaving(true);
    setPipelineMsg(null);
    try {
      // Save qualification fields
      const qualRes = await fetch(`/api/admin/quotes/${quote.id}/qualification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qualification_status: pipeline.qualification_status || undefined,
          lead_priority:        pipeline.lead_priority        || undefined,
          lead_customer_type:   pipeline.lead_customer_type   || undefined,
          qualification_reason: pipeline.qualification_reason || undefined,
          internal_notes:       pipeline.internal_notes       || undefined,
          follow_up_at:         pipeline.follow_up_at         || undefined,
        }),
      });
      const qualJson = await qualRes.json().catch(() => ({}));
      if (!qualRes.ok) throw new Error((qualJson as Record<string, unknown>).error as string ?? `Error ${qualRes.status}`);

      // Save assign if changed
      if (pipeline.assigned_to !== (q.assigned_to as number | null)) {
        await fetch(`/api/admin/quotes/${quote.id}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigned_to: pipeline.assigned_to }),
        });
      }

      setPipelineMsg({ type: "ok", text: "Pipeline updated successfully." });
    } catch (err) {
      setPipelineMsg({ type: "err", text: err instanceof Error ? err.message : "Save failed." });
    } finally {
      setPipelineSaving(false);
    }
  };

  const assignToMe = async () => {
    setPipelineSaving(true);
    try {
      const meRes = await fetch("/api/admin/me", { cache: "no-store" });
      const me = await meRes.json().catch(() => ({}));
      const meData = (me as Record<string, unknown>).data as Record<string, unknown> ?? me as Record<string, unknown>;
      const meId   = meData.id   as number  | undefined;
      const meName = meData.name as string  | undefined;

      if (!meId) { setPipelineMsg({ type: "err", text: "Could not identify current admin." }); return; }

      await fetch(`/api/admin/quotes/${quote.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: meId }),
      });
      setPipeline((prev) => ({ ...prev, assigned_to: meId, assigned_to_name: meName ?? "Me" }));
      setPipelineMsg({ type: "ok", text: "Assigned to you." });
    } catch {
      setPipelineMsg({ type: "err", text: "Assignment failed." });
    } finally {
      setPipelineSaving(false);
    }
  };

  const KNOWN_CONFLICT_CODES = new Set(["customer_exists", "already_converted", "invalid_status"]);

  const doConvertToCustomer = async (extraBody?: Record<string, unknown>) => {
    setConvertPending(true);
    setConvertError(null);
    setConvertConflict(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quote.id}/convert-to-customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_action: convertAction, ...extraBody }),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;

      if (!res.ok) {
        // Parse the backend's message (may use "message" or "error" key)
        const backendMsg = (json.message ?? json.error ?? `Request failed (HTTP ${res.status})`) as string;
        const code       = json.code as string | undefined;
        const customerId = (json.customer_id ?? (json.data as Record<string, unknown> | undefined)?.customer_id) as number | undefined;

        // 409 Conflict or a known conflict code → structured conflict state, not a generic error
        if (res.status === 409 || (code && KNOWN_CONFLICT_CODES.has(code))) {
          setConvertConflict({ code: code ?? "conflict", message: backendMsg, customer_id: customerId });
          return;
        }

        throw new Error(backendMsg);
      }

      const result = (json.data ?? json) as { customer_id?: number; customer_exists?: boolean; message?: string };
      setConvertResult(result);
      setPipeline((prev) => ({ ...prev, qualification_status: "customer_invited" }));
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : "Conversion failed. Please try again.");
    } finally {
      setConvertPending(false);
    }
  };

  // Attachment
  const attachmentUrl  = quote.attachment_url ?? quote.attachment_path ?? null;
  const attachmentName = quote.attachment_original_name ?? quote.attachment_name ?? null;
  const hasAttachment  = !!(attachmentUrl || attachmentName);

  // Extract the numeric attachment ID from the new protected URL format:
  // https://api.okelcor.com/api/v1/admin/quote-attachments/{id}/download
  const attachmentId = useCallback((): string | null => {
    if (!attachmentUrl) return null;
    try {
      const parts = new URL(attachmentUrl).pathname.split("/").filter(Boolean);
      const dlIdx = parts.indexOf("download");
      return dlIdx > 0 ? parts[dlIdx - 1] : null;
    } catch { return null; }
  }, [attachmentUrl])();

  const handleDownloadAttachment = useCallback(async () => {
    if (!attachmentId) return;
    setDownloadingAttachment(true);
    try {
      const res = await fetch(`/api/admin/quote-attachments/${attachmentId}/download`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = attachmentName ?? `quote-attachment-${attachmentId}`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user can retry
    } finally {
      setDownloadingAttachment(false);
    }
  }, [attachmentId, attachmentName]);

  // Tyre items
  const hasTyreItems = Array.isArray(quote.tyre_items) && quote.tyre_items.length > 0;
  const isUsed       = quote.tyre_condition === "used";

  // Incoterm label
  const incotermLabel =
    quote.incoterm_type === "delivery_terms" ? "Delivery Terms" :
    quote.incoterm_type === "shipping_terms" ? "Shipping Terms" :
    "Incoterm";

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* ── Quote Status card ── */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Quote Status
          </p>

          {saveError && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
              <AlertCircle size={15} className="shrink-0" />
              {saveError}
            </div>
          )}
          {saved && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.83rem] text-emerald-700">
              <CheckCircle2 size={15} className="shrink-0" />
              Status updated successfully.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[0.83rem] text-[#5c5e62]">Current:</span>
              <StatusBadge status={quote.status} />
            </div>

            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                className="h-10 appearance-none rounded-xl border border-black/[0.09] bg-white pl-3.5 pr-9 text-[0.875rem] font-semibold text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              >
                {QUOTE_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !isDirty}
              className="h-10 rounded-full bg-[#E85C1A] px-6 text-[0.875rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save Status"}
            </button>
          </div>
        </div>

        {/* ── CRM-2: Quality Review card ── */}
        {(() => {
          const score = (quote as Record<string, unknown>).quality_score as number | null | undefined;
          const flags = (quote as Record<string, unknown>).quality_flags as string[] | null | undefined;
          const rejectionReason = (quote as Record<string, unknown>).rejection_reason as string | null | undefined;
          const hasQualityData = score != null || (flags && flags.length > 0) || reviewStatus;
          if (!hasQualityData) return null;
          return (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
                Quality Review
              </p>

              {reviewMsg && (
                <div className={`mb-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[0.83rem] ${reviewMsg.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                  {reviewMsg.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {reviewMsg.text}
                </div>
              )}

              <div className="flex flex-wrap items-start gap-6">
                {/* Score */}
                {score != null && (
                  <div>
                    <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Quality Score</p>
                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-[0.9rem] font-extrabold ${score >= 80 ? "bg-emerald-100 text-emerald-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {score}<span className="ml-0.5 text-[0.7rem] font-normal">/100</span>
                    </div>
                  </div>
                )}

                {/* Review status */}
                {reviewStatus && (
                  <div>
                    <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Review Status</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.78rem] font-bold ${REVIEW_STATUS_STYLES[reviewStatus] ?? "bg-gray-100 text-gray-500"}`}>
                      {REVIEW_STATUS_LABELS[reviewStatus] ?? reviewStatus}
                    </span>
                  </div>
                )}

                {/* Flags */}
                {flags && flags.length > 0 && (
                  <div>
                    <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Quality Flags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {flags.map((f) => (
                        <span key={f} className="rounded-md bg-red-50 px-2 py-0.5 font-mono text-[0.7rem] text-red-700">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection reason */}
                {rejectionReason && (
                  <div className="w-full">
                    <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Rejection Reason</p>
                    <p className="text-[0.875rem] text-[#1a1a1a]">{rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Review actions */}
              {reviewStatus !== "qualified" && reviewStatus !== "spam" && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-black/[0.06] pt-5">
                  <p className="mr-2 self-center text-[0.78rem] text-[#5c5e62]">Review actions:</p>
                  <button type="button" disabled={reviewPending !== null || reviewStatus === "qualified"}
                    onClick={() => doReview("qualify")}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[0.8rem] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
                    {reviewPending === "qualify" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                    Qualify
                  </button>
                  <button type="button" disabled={reviewPending !== null || reviewStatus === "rejected"}
                    onClick={() => doReview("reject")}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-[0.8rem] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50">
                    {reviewPending === "reject" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                    Reject
                  </button>
                  <button type="button" disabled={reviewPending !== null}
                    onClick={() => doReview("spam")}
                    className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-[0.8rem] font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50">
                    {reviewPending === "spam" ? <Loader2 size={13} className="animate-spin" /> : <AlertOctagon size={13} />}
                    Mark Spam
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── CRM-3: Lead Qualification card ── */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
              Lead Qualification
            </p>
            {/* Quick actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={pipelineSaving} onClick={assignToMe}
                className="flex items-center gap-1.5 rounded-xl border border-black/[0.1] px-3 py-1.5 text-[0.75rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f5f5f5] disabled:opacity-50">
                <User size={12} /> Assign to me
              </button>
              {pipeline.qualification_status !== "qualified" && (
                <button type="button" disabled={pipelineSaving}
                  onClick={() => { setPipeline((p) => ({ ...p, qualification_status: "qualified" })); }}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[0.75rem] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
                  <CheckCircle size={12} /> Mark Qualified
                </button>
              )}
              {pipeline.qualification_status !== "rejected" && (
                <button type="button" disabled={pipelineSaving}
                  onClick={() => { setPipeline((p) => ({ ...p, qualification_status: "rejected" })); }}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[0.75rem] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50">
                  <XCircle size={12} /> Reject
                </button>
              )}
              {pipeline.qualification_status !== "spam" && (
                <button type="button" disabled={pipelineSaving}
                  onClick={() => { setPipeline((p) => ({ ...p, qualification_status: "spam" })); }}
                  className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-[0.75rem] font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50">
                  <AlertOctagon size={12} /> Mark Spam
                </button>
              )}
              {(pipeline.qualification_status === "qualified" || pipeline.qualification_status === "proposal_sent") && (
                <button type="button" onClick={() => setShowConvertToCustomer(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1a1a1a] px-3 py-1.5 text-[0.75rem] font-semibold text-white transition hover:bg-[#333]">
                  <UserPlus size={12} /> Convert to Customer
                </button>
              )}
              <button type="button" onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[0.75rem] font-semibold text-blue-700 transition hover:bg-blue-100">
                <Mail size={12} /> Send Follow-up Email
              </button>
            </div>
          </div>

          {pipelineMsg && (
            <div className={`mb-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[0.83rem] ${pipelineMsg.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
              {pipelineMsg.type === "ok" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {pipelineMsg.text}
              <button type="button" onClick={() => setPipelineMsg(null)} className="ml-auto">
                <X size={13} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Assign owner */}
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-semibold text-[#5c5e62] uppercase tracking-[0.08em]">
                <User size={11} className="mb-0.5 mr-1 inline-block" />
                Assigned Owner
              </label>
              <select
                value={pipeline.assigned_to ?? ""}
                onFocus={loadAdminUsers}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  const name = adminUsers.find((u) => u.id === id)?.name ?? "";
                  setPipeline((p) => ({ ...p, assigned_to: id, assigned_to_name: name }));
                }}
                className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              >
                <option value="">— Unassigned —</option>
                {adminUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
                {!adminUsersLoaded && pipeline.assigned_to_name && (
                  <option value={pipeline.assigned_to ?? ""}>{pipeline.assigned_to_name}</option>
                )}
              </select>
            </div>

            {/* Follow-up date */}
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-semibold text-[#5c5e62] uppercase tracking-[0.08em]">
                <Calendar size={11} className="mb-0.5 mr-1 inline-block" />
                Follow-up Date
              </label>
              <input
                type="datetime-local"
                value={pipeline.follow_up_at ? pipeline.follow_up_at.slice(0, 16) : ""}
                onChange={(e) => setPipeline((p) => ({ ...p, follow_up_at: e.target.value ? `${e.target.value}:00Z` : "" }))}
                className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-semibold text-[#5c5e62] uppercase tracking-[0.08em]">
                <Flag size={11} className="mb-0.5 mr-1 inline-block" />
                Priority
              </label>
              <select
                value={pipeline.lead_priority}
                onChange={(e) => setPipeline((p) => ({ ...p, lead_priority: e.target.value }))}
                className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Customer type */}
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-semibold text-[#5c5e62] uppercase tracking-[0.08em]">
                <Tag size={11} className="mb-0.5 mr-1 inline-block" />
                Customer Type
              </label>
              <select
                value={pipeline.lead_customer_type}
                onChange={(e) => setPipeline((p) => ({ ...p, lead_customer_type: e.target.value }))}
                className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              >
                <option value="unknown">Unknown</option>
                <option value="private_buyer">Private Buyer</option>
                <option value="dealer">Dealer</option>
                <option value="workshop">Workshop</option>
                <option value="fleet">Fleet Operator</option>
                <option value="exporter">Exporter</option>
              </select>
            </div>

            {/* Qualification status */}
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-semibold text-[#5c5e62] uppercase tracking-[0.08em]">
                Pipeline Status
              </label>
              <select
                value={pipeline.qualification_status}
                onChange={(e) => setPipeline((p) => ({ ...p, qualification_status: e.target.value }))}
                className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              >
                <option value="new">New</option>
                <option value="needs_review">Needs Review</option>
                <option value="qualified">Qualified</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="customer_invited">Customer Invited</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
                <option value="spam">Spam</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Qualification reason */}
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-semibold text-[#5c5e62] uppercase tracking-[0.08em]">
                Qualification Reason
              </label>
              <input
                type="text"
                placeholder="Brief reason for status change…"
                value={pipeline.qualification_reason}
                onChange={(e) => setPipeline((p) => ({ ...p, qualification_reason: e.target.value }))}
                className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-[0.875rem] text-[#1a1a1a] outline-none transition placeholder:text-[#aaa] focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              />
            </div>

            {/* Internal notes — full width */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1.5 block text-[0.75rem] font-semibold text-[#5c5e62] uppercase tracking-[0.08em]">
                Internal Notes
              </label>
              <textarea
                rows={3}
                placeholder="Internal notes — not visible to the customer…"
                value={pipeline.internal_notes}
                onChange={(e) => setPipeline((p) => ({ ...p, internal_notes: e.target.value }))}
                className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition placeholder:text-[#aaa] focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="mt-5 flex justify-end">
            <button type="button" disabled={pipelineSaving} onClick={savePipeline}
              className="flex h-10 items-center gap-2 rounded-full bg-[#1a1a1a] px-6 text-[0.875rem] font-semibold text-white transition hover:bg-[#333] disabled:opacity-50">
              {pipelineSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {pipelineSaving ? "Saving…" : "Save Pipeline"}
            </button>
          </div>
        </div>

        {/* ── Convert to Customer modal ── */}
        {showConvertToCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Convert Lead to Customer</p>
                  <p className="mt-1 text-[0.83rem] text-[#5c5e62]">
                    Create a customer account from this lead&apos;s information.
                  </p>
                </div>
                {!convertPending && (
                  <button type="button" onClick={() => { setShowConvertToCustomer(false); setConvertResult(null); setConvertError(null); setConvertConflict(null); }}
                    className="shrink-0 text-[#9ca3af] hover:text-[#1a1a1a]">
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Lead summary */}
              <div className="mb-5 rounded-xl border border-black/[0.07] bg-[#fafafa] px-4 py-3.5 text-[0.83rem]">
                <p className="font-semibold text-[#1a1a1a]">{quote.full_name}</p>
                <p className="text-[#5c5e62]">{quote.email}</p>
                {quote.company_name && <p className="text-[#5c5e62]">{quote.company_name}</p>}
                <p className="text-[#5c5e62]">{quote.country}</p>
              </div>

              {/* ── Conflict state (409 / known conflict code) ── */}
              {convertConflict ? (
                <div className="flex flex-col gap-3">
                  {convertConflict.code === "customer_exists" ? (
                    <>
                      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-[0.83rem] text-amber-800">
                        <AlertCircle size={15} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">This email already belongs to a customer account.</p>
                          <p className="mt-0.5 text-amber-700">{convertConflict.message}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {convertConflict.customer_id && (
                          <Link
                            href={`/admin/customers/${convertConflict.customer_id}`}
                            className="flex items-center justify-center gap-2 rounded-full bg-[#E85C1A] px-6 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d14f14]"
                            onClick={() => setShowConvertToCustomer(false)}
                          >
                            <ExternalLink size={14} />
                            View Customer
                          </Link>
                        )}
                        <button
                          type="button"
                          disabled={convertPending}
                          onClick={() => doConvertToCustomer({ force_link: true })}
                          className="flex items-center justify-center gap-2 rounded-full border border-[#1a1a1a] px-6 py-2.5 text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
                        >
                          {convertPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                          Link Existing Customer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConvertConflict(null)}
                          className="rounded-full border border-black/[0.1] px-6 py-2 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]"
                        >
                          Back
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-[0.83rem] text-red-700">
                        <AlertCircle size={15} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold capitalize">{convertConflict.code.replace(/_/g, " ")}</p>
                          <p className="mt-0.5">{convertConflict.message}</p>
                        </div>
                      </div>
                      {convertConflict.customer_id && (
                        <Link
                          href={`/admin/customers/${convertConflict.customer_id}`}
                          className="flex items-center justify-center gap-2 rounded-full bg-[#E85C1A] px-6 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d14f14]"
                          onClick={() => setShowConvertToCustomer(false)}
                        >
                          <ExternalLink size={14} />
                          View Customer
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => { setShowConvertToCustomer(false); setConvertConflict(null); }}
                        className="rounded-full border border-black/[0.1] px-6 py-2.5 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              ) : convertError ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    {convertError}
                  </div>
                  <button type="button" onClick={() => setConvertError(null)}
                    className="rounded-full border border-black/[0.1] px-6 py-2.5 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]">
                    Try Again
                  </button>
                </div>
              ) : convertResult ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.83rem] text-emerald-800">
                    <CheckCircle2 size={15} className="shrink-0" />
                    {convertResult.message ?? (convertResult.customer_exists ? "Linked to existing customer." : "Customer account created.")}
                  </div>
                  {convertResult.customer_id && (
                    <Link href={`/admin/customers/${convertResult.customer_id}`}
                      className="flex items-center justify-center gap-2 rounded-full bg-[#E85C1A] px-6 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d14f14]"
                      onClick={() => setShowConvertToCustomer(false)}>
                      <ExternalLink size={14} />
                      View Customer Profile
                    </Link>
                  )}
                  <button type="button" onClick={() => { setShowConvertToCustomer(false); setConvertResult(null); }}
                    className="rounded-full border border-black/[0.1] px-6 py-2.5 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <p className="mb-2 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#5c5e62]">Onboarding Action</p>
                    <div className="flex flex-col gap-2">
                      {(["invite", "approve", "pending_review"] as const).map((action) => (
                        <label key={action} className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/[0.08] px-4 py-3 transition hover:border-[#E85C1A]/40 has-[:checked]:border-[#E85C1A] has-[:checked]:bg-orange-50/40">
                          <input type="radio" name="convertAction" value={action} checked={convertAction === action}
                            onChange={() => setConvertAction(action)}
                            className="mt-0.5 accent-[#E85C1A]" />
                          <div>
                            <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">
                              {action === "invite" ? "Create & Send Invitation" : action === "approve" ? "Create & Approve" : "Create (Pending Review)"}
                            </p>
                            <p className="text-[0.78rem] text-[#5c5e62]">
                              {action === "invite"
                                ? "Customer receives an invitation email to set their password."
                                : action === "approve"
                                ? "Account is created in approved state — customer can log in after setting a password."
                                : "Account created in pending_review state. Admin approval required before access."}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" disabled={convertPending}
                      onClick={() => { setShowConvertToCustomer(false); setConvertError(null); }}
                      className="flex-1 h-11 rounded-full border border-black/[0.1] text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5] disabled:opacity-50">
                      Cancel
                    </button>
                    <button type="button" disabled={convertPending} onClick={() => doConvertToCustomer()}
                      className="flex flex-1 h-11 items-center justify-center gap-2 rounded-full bg-[#1a1a1a] text-[0.875rem] font-semibold text-white transition hover:bg-[#333] disabled:opacity-50">
                      {convertPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                      {convertPending ? "Converting…" : "Convert"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── CRM-7: Quote Items card ── */}
        <QuoteItemsCard
          quoteId={quote.id}
          onItemsChange={setQuoteItems}
        />

        {/* ── CRM-7: Proposal Management card ── */}
        <ProposalCard
          quote={quote}
          onStatusChange={(s) => setProposalStatus(s)}
          items={quoteItems}
          itemCount={quoteItemCount}
        />

        {/* ── Order Conversion card ── */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Order Conversion
          </p>

          {isConverted ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <p className="text-[0.875rem] font-semibold text-emerald-800">
                  Converted to order:&nbsp;
                  <span className="font-extrabold">{effectiveOrderRef}</span>
                </p>
              </div>

              {effectiveOrderId != null ? (
                <Link
                  href={`/admin/orders/${effectiveOrderId}`}
                  className="flex items-center gap-1.5 rounded-full border border-[#E85C1A] px-5 py-2.5 text-[0.83rem] font-semibold text-[#E85C1A] transition hover:bg-[#E85C1A] hover:text-white"
                >
                  <ExternalLink size={13} />
                  View Order
                </Link>
              ) : (
                <Link
                  href={`/admin/orders?q=${encodeURIComponent(effectiveOrderRef ?? "")}`}
                  className="flex items-center gap-1.5 rounded-full border border-[#E85C1A] px-5 py-2.5 text-[0.83rem] font-semibold text-[#E85C1A] transition hover:bg-[#E85C1A] hover:text-white"
                >
                  <ExternalLink size={13} />
                  View Order
                </Link>
              )}
            </div>
          ) : quote.status === "quoted" ? (
            <div className="flex flex-col gap-4">
              {proposalGated ? (
                <>
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                    <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-[0.875rem] font-semibold text-amber-800">
                        Customer must accept the proposal before this lead can become an order.
                      </p>
                      <p className="mt-0.5 text-[0.78rem] text-amber-700">
                        Current proposal status:{" "}
                        <span className="font-bold capitalize">{proposalStatus?.replace(/_/g, " ")}</span>
                      </p>
                    </div>
                  </div>
                  {isSuperAdmin && !showOverrideConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowOverrideConfirm(true)}
                      className="self-start flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-[0.83rem] font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      <AlertCircle size={14} />
                      Force Convert (Super Admin Override)
                    </button>
                  )}
                  {showOverrideConfirm && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
                      <p className="mb-3 text-[0.875rem] font-semibold text-red-700">
                        Are you sure? This bypasses the proposal acceptance requirement.
                      </p>
                      <p className="mb-4 text-[0.8rem] text-red-600">
                        Only proceed if you have explicit off-channel confirmation from the customer.
                      </p>
                      <div className="flex gap-3">
                        <button type="button"
                          onClick={() => setShowOverrideConfirm(false)}
                          className="flex-1 rounded-full border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]">
                          Cancel
                        </button>
                        <button type="button"
                          onClick={() => { setShowOverrideConfirm(false); setShowConvertModal(true); }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-red-700">
                          <ShoppingCart size={14} />
                          Override &amp; Convert
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <p className="text-[0.83rem] text-[#5c5e62]">
                    {proposalAccepted
                      ? "The customer accepted the proposal. This quote can now be converted to an order."
                      : "This quote is ready to be converted into a confirmed order."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(true)}
                    className="flex items-center gap-2 rounded-full bg-[#E85C1A] px-6 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d14f14]"
                  >
                    <ShoppingCart size={15} />
                    Convert to Order
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[0.83rem] text-[#5c5e62]">
              Order conversion is available once this quote&apos;s status is set to{" "}
              <span className="font-semibold text-emerald-700">Quoted</span>.
            </p>
          )}
        </div>

        {/* ── CRM-5: Existing customer notice ── */}
        {(() => {
          const qr = quote as Record<string, unknown>;
          const customerId = qr.possible_customer_id as number | undefined;
          const customerName = qr.possible_customer_name as string | undefined;
          const isExisting = qr.lead_existing_customer as boolean | undefined;
          if (!customerId && !isExisting) return null;
          return (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="flex-1 min-w-0">
                <p className="text-[0.875rem] font-semibold text-amber-800">
                  This inquiry may belong to an existing customer.
                </p>
                {customerName && (
                  <p className="mt-0.5 text-[0.83rem] text-amber-700">{customerName}</p>
                )}
                <p className="mt-0.5 text-[0.78rem] text-amber-600">
                  Email match detected against the existing customer database.
                </p>
              </div>
              {customerId && (
                <Link
                  href={`/admin/customers/${customerId}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-2 text-[0.8rem] font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  <ExternalLink size={13} />
                  View Customer
                </Link>
              )}
            </div>
          );
        })()}

        {/* ── 1. Customer & Company ── */}
        <SectionCard title="Customer & Company">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Full Name"      value={quote.full_name} />
            <InfoRow label="Contact Person" value={quote.contact_person} />
            <InfoRow label="Email"          value={quote.email} />
            <InfoRow label="Phone"          value={quote.phone} />
            <InfoRow label="Company Name"   value={quote.company_name} />
            <InfoRow label="Business Type"  value={quote.business_type} />
            <InfoRow label="Country"        value={quote.country} />
            <InfoRow label="Submitted"      value={shortDate(quote.created_at)} />
            <InfoRow label="Last Updated"   value={shortDate(quote.updated_at)} />
            {(quote.company_address || quote.company_city || quote.company_postal_code) && (
              <div className="col-span-full flex flex-col gap-0.5">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Company Address</p>
                <p className="text-[0.875rem] text-[#1a1a1a]">
                  {[quote.company_address, quote.company_city, quote.company_postal_code]
                    .filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── 2. VAT & Compliance ── */}
        <SectionCard title="VAT & Compliance">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="VAT Number" value={quote.vat_number} fallback="Not provided" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">VAT Validated</p>
              {quote.vat_valid === true ? (
                <span className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-emerald-700">
                  <CheckCircle2 size={14} strokeWidth={2} /> Verified
                </span>
              ) : (
                <span className="text-[0.875rem] italic text-[#9ca3af]">Not verified</span>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── 3. Tyre Requirements ── */}
        <SectionCard title="Tyre Requirements">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Tyre Category"    value={quote.tyre_category} />
            <InfoRow label="Tyre Condition"   value={formatEnum(quote.tyre_condition)} />
            <InfoRow label="Brand Preference" value={quote.brand_preference} />
          </div>

          {/* Tyre items table — preferred path */}
          {hasTyreItems ? (
            <div className="mt-5">
              <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                Tyre Sizes &amp; Quantities
              </p>
              <div className="overflow-x-auto rounded-xl border border-black/[0.06]">
                <table className="w-full text-[0.875rem]">
                  <thead>
                    <tr className="border-b border-black/[0.06] bg-[#f8f8f8]">
                      <th className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">#</th>
                      <th className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Tyre Size</th>
                      <th className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.tyre_items?.map((item, i) => (
                      <tr key={i} className="border-b border-black/[0.04] last:border-0">
                        <td className="px-4 py-2.5 text-[#5c5e62]">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">{item.size || "—"}</td>
                        <td className="px-4 py-2.5 text-[#1a1a1a]">{item.quantity || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (quote.tyre_size || quote.quantity) ? (
            /* Legacy single-row fallback */
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Tyre Size" value={quote.tyre_size} fallback="Not provided" />
              <InfoRow label="Quantity"  value={quote.quantity}  fallback="Not provided" />
            </div>
          ) : null}

          {/* Used tyre sub-section — shown only when condition is "used" */}
          {isUsed && (
            <div className="mt-5 border-t border-black/[0.05] pt-5">
              <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                Used Tyre Specification
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label="Grade" value={formatEnum(quote.used_tyre_grade)} fallback="Not specified" />
              </div>
              {quote.used_tyre_notes && (
                <div className="mt-3 flex flex-col gap-0.5">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Condition Notes</p>
                  <p className="whitespace-pre-wrap text-[0.875rem] leading-relaxed text-[#1a1a1a]">
                    {quote.used_tyre_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── 4. Logistics & Terms ── */}
        <SectionCard title="Logistics & Terms">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label={incotermLabel}            value={quote.incoterm ? formatIncoterm(quote.incoterm) : undefined} fallback="Not specified" />
            <InfoRow label="Delivery Timeline"        value={quote.delivery_timeline} />
            <InfoRow label="Budget Range"             value={quote.budget_range} />
            <InfoRow label="Delivery Location / Port" value={quote.delivery_location} fallback="Not provided" />
          </div>
          {(quote.delivery_address || quote.delivery_city || quote.delivery_postal_code) && (
            <div className="mt-4 flex flex-col gap-0.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Delivery Address</p>
              <p className="text-[0.875rem] text-[#1a1a1a]">
                {[quote.delivery_address, quote.delivery_city, quote.delivery_postal_code]
                  .filter(Boolean).join(", ")}
              </p>
            </div>
          )}
        </SectionCard>

        {/* ── 5. Attachments & Notes ── */}
        <SectionCard title="Attachments & Notes">

          {/* Specification sheet */}
          <div className="mb-5">
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
              Specification Sheet
            </p>
            {hasAttachment ? (
              <div className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-[#f8f8f8] px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Paperclip size={15} strokeWidth={1.8} className="text-[#5c5e62]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[0.875rem] font-semibold text-[#1a1a1a]">
                      {attachmentName ?? "Specification sheet"}
                    </p>
                    <p className="text-[0.72rem] text-[#5c5e62]">
                      {[
                        quote.attachment_size != null ? formatBytes(quote.attachment_size) : null,
                        quote.attachment_mime ?? null,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                {attachmentId ? (
                  <button
                    type="button"
                    onClick={handleDownloadAttachment}
                    disabled={downloadingAttachment}
                    className="ml-4 flex shrink-0 items-center gap-1.5 rounded-full bg-[#E85C1A] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-60"
                  >
                    {downloadingAttachment
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Download size={13} strokeWidth={2} />
                    }
                    {downloadingAttachment ? "Downloading…" : "Download"}
                  </button>
                ) : (
                  <span className="ml-4 shrink-0 text-[0.78rem] text-[#5c5e62]">Download unavailable</span>
                )}
              </div>
            ) : (
              <p className="text-[0.83rem] italic text-[#9ca3af]">No specification sheet attached.</p>
            )}
          </div>

          {/* Customer notes */}
          <div className="mb-4">
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Customer Notes</p>
            {quote.notes ? (
              <p className="whitespace-pre-wrap text-[0.875rem] leading-relaxed text-[#1a1a1a]">
                {quote.notes}
              </p>
            ) : (
              <p className="text-[0.83rem] italic text-[#9ca3af]">None provided.</p>
            )}
          </div>

          {/* Internal admin notes */}
          {quote.admin_notes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
              <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-amber-700">
                Internal Admin Notes
              </p>
              <p className="whitespace-pre-wrap text-[0.875rem] leading-relaxed text-amber-900">
                {quote.admin_notes}
              </p>
            </div>
          )}
        </SectionCard>

        {/* ── CRM-6: Communication Timeline ── */}
        <SectionCard title="Communications">
          <div className="p-5">
            <CommunicationTimeline context="quote" entityId={quote.id} compact />
          </div>
        </SectionCard>

      </div>

      {/* ── CRM-6: Follow-up email modal ── */}
      {showEmailModal && (
        <FollowUpEmailModal
          quoteId={quote.id}
          recipientName={quote.full_name}
          recipientEmail={quote.email}
          onClose={() => setShowEmailModal(false)}
          onSent={() => setShowEmailModal(false)}
        />
      )}

      {/* ── Conversion modal ── */}
      {showConvertModal && (
        <QuoteConvertModal
          quote={quote}
          onClose={() => setShowConvertModal(false)}
          onSuccess={handleConvertSuccess}
        />
      )}
    </>
  );
}
