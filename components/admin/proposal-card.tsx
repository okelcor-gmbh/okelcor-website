"use client";

import { useState } from "react";
import {
  FileText, Send, CheckCircle2, XCircle, Clock, AlertCircle,
  Copy, Loader2, AlertTriangle, RotateCcw, X, Check,
} from "lucide-react";
import type { AdminQuoteFull, ProposalStatus } from "@/lib/admin-api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function longDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

function fmtCurrency(amount?: number | null, currency?: string | null): string {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-DE", {
      style: "currency",
      currency: currency ?? "EUR",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch { return `${amount}`; }
}

function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ── Status display map ────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  none:      "bg-gray-100 text-gray-500",
  draft:     "bg-amber-100 text-amber-700",
  ready:     "bg-blue-100 text-blue-700",
  sent:      "bg-indigo-100 text-indigo-700",
  accepted:  "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-700",
  expired:   "bg-gray-100 text-gray-500",
  converted: "bg-teal-100 text-teal-700",
};

const STATUS_LABELS: Record<string, string> = {
  none:      "No Proposal",
  draft:     "Draft",
  ready:     "Ready to Send",
  sent:      "Sent — Awaiting Response",
  accepted:  "Accepted",
  rejected:  "Rejected",
  expired:   "Expired",
  converted: "Converted to Order",
};

function ProposalBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.75rem] font-bold ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProposalState {
  proposal_status: string;
  proposal_number: string | null;
  proposal_sent_at: string | null;
  proposal_accepted_at: string | null;
  proposal_rejected_at: string | null;
  proposal_expires_at: string | null;
  proposal_acceptance_token: string | null;
  proposal_rejection_reason: string | null;
  proposal_total: number | null;
  proposal_currency: string | null;
}

interface Props {
  quote: AdminQuoteFull;
  onStatusChange?: (status: ProposalStatus | string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProposalCard({ quote, onStatusChange }: Props) {
  const q = quote as Record<string, unknown>;

  const [proposal, setProposal] = useState<ProposalState>({
    proposal_status:           (q.proposal_status           as string) ?? "none",
    proposal_number:           (q.proposal_number           as string | null) ?? null,
    proposal_sent_at:          (q.proposal_sent_at          as string | null) ?? null,
    proposal_accepted_at:      (q.proposal_accepted_at      as string | null) ?? null,
    proposal_rejected_at:      (q.proposal_rejected_at      as string | null) ?? null,
    proposal_expires_at:       (q.proposal_expires_at       as string | null) ?? null,
    proposal_acceptance_token: (q.proposal_acceptance_token as string | null) ?? null,
    proposal_rejection_reason: (q.proposal_rejection_reason as string | null) ?? null,
    proposal_total:            (q.proposal_total            as number | null) ?? null,
    proposal_currency:         (q.proposal_currency         as string | null) ?? null,
  });

  const [loading, setLoading] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [msg,     setMsg]     = useState<string | null>(null);

  // Void modal
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason,    setVoidReason]    = useState("");

  // Copy link feedback
  const [copied, setCopied] = useState(false);

  const ps = proposal.proposal_status;
  const expired = ps === "sent" && isExpired(proposal.proposal_expires_at);

  // ── Action helper ──────────────────────────────────────────────────────────

  async function doAction(
    action: string,
    body: Record<string, unknown> = {}
  ) {
    setLoading(action);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/admin/quotes/${quote.id}/proposal/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        const errMsg = (json.message ?? json.error ?? `Action failed (HTTP ${res.status})`) as string;
        setError(errMsg);
        return;
      }
      // Merge updated proposal fields from backend response
      const data = (json.data ?? json) as Record<string, unknown>;
      const next: Partial<ProposalState> = {};
      const fields: (keyof ProposalState)[] = [
        "proposal_status", "proposal_number", "proposal_sent_at",
        "proposal_accepted_at", "proposal_rejected_at", "proposal_expires_at",
        "proposal_acceptance_token", "proposal_rejection_reason",
        "proposal_total", "proposal_currency",
      ];
      for (const f of fields) {
        if (data[f] !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (next as Record<string, unknown>)[f] = data[f] as any;
        }
      }
      const newStatus = (next.proposal_status ?? ps) as string;
      setProposal((prev) => ({ ...prev, ...next }));
      onStatusChange?.(newStatus);
      setMsg((json.message as string | undefined) ?? "Updated successfully.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(null);
    }
  }

  // ── Copy acceptance link ───────────────────────────────────────────────────

  function copyLink() {
    if (!proposal.proposal_acceptance_token) return;
    const url = `${window.location.origin}/proposals/accept/${proposal.proposal_acceptance_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // ── Re-draft (from rejected / expired) ────────────────────────────────────

  function handleRedraft() {
    doAction("draft");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
              Proposal Management
            </p>
            <ProposalBadge status={expired ? "expired" : ps} />
          </div>
          {proposal.proposal_number && (
            <span className="font-mono text-[0.78rem] font-semibold text-[#5c5e62]">
              {proposal.proposal_number}
            </span>
          )}
        </div>

        {/* ── Feedback messages ── */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)}><X size={13} /></button>
          </div>
        )}
        {msg && !error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.83rem] text-emerald-800">
            <CheckCircle2 size={14} className="shrink-0" />
            <span className="flex-1">{msg}</span>
            <button type="button" onClick={() => setMsg(null)}><X size={13} /></button>
          </div>
        )}

        {/* ── State: none / no proposal yet ── */}
        {(ps === "none" || !ps) && (
          <div className="flex flex-col gap-3">
            <p className="text-[0.83rem] text-[#5c5e62]">
              No proposal has been created for this quote yet. Create a draft to begin the proposal workflow.
            </p>
            <div>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => doAction("draft")}
                className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
              >
                {loading === "draft" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {loading === "draft" ? "Creating…" : "Create Draft Proposal"}
              </button>
            </div>
          </div>
        )}

        {/* ── State: draft ── */}
        {ps === "draft" && (
          <div className="flex flex-col gap-4">
            <p className="text-[0.83rem] text-[#5c5e62]">
              A draft proposal has been created. Mark it ready once pricing and items are confirmed.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => doAction("mark-ready")}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading === "mark-ready" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {loading === "mark-ready" ? "Updating…" : "Mark Ready"}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => setShowVoidModal(true)}
                className="flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-[0.875rem] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <X size={14} />
                Void Proposal
              </button>
            </div>
          </div>
        )}

        {/* ── State: ready ── */}
        {ps === "ready" && (
          <div className="flex flex-col gap-4">
            <p className="text-[0.83rem] text-[#5c5e62]">
              The proposal is ready. Send it to the customer to request their acceptance.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => doAction("send")}
                className="flex items-center gap-2 rounded-full bg-[#E85C1A] px-5 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50"
              >
                {loading === "send" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {loading === "send" ? "Sending…" : "Send Proposal"}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => setShowVoidModal(true)}
                className="flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-[0.875rem] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <X size={14} />
                Void Proposal
              </button>
            </div>
          </div>
        )}

        {/* ── State: sent ── */}
        {ps === "sent" && (
          <div className="flex flex-col gap-4">
            {/* Timeline rows */}
            <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] divide-y divide-black/[0.05]">
              {proposal.proposal_sent_at && (
                <div className="flex items-center justify-between px-4 py-2.5 text-[0.83rem]">
                  <span className="text-[#5c5e62] flex items-center gap-1.5">
                    <Send size={12} className="shrink-0" /> Sent
                  </span>
                  <span className="font-semibold text-[#1a1a1a]">{longDate(proposal.proposal_sent_at)}</span>
                </div>
              )}
              {proposal.proposal_expires_at && (
                <div className="flex items-center justify-between px-4 py-2.5 text-[0.83rem]">
                  <span className={`flex items-center gap-1.5 ${expired ? "text-red-600 font-semibold" : "text-[#5c5e62]"}`}>
                    <Clock size={12} className="shrink-0" /> {expired ? "Expired" : "Expires"}
                  </span>
                  <span className={`font-semibold ${expired ? "text-red-700" : "text-[#1a1a1a]"}`}>
                    {longDate(proposal.proposal_expires_at)}
                  </span>
                </div>
              )}
              {proposal.proposal_total != null && (
                <div className="flex items-center justify-between px-4 py-2.5 text-[0.83rem]">
                  <span className="text-[#5c5e62]">Proposal Total</span>
                  <span className="font-extrabold text-[#1a1a1a]">
                    {fmtCurrency(proposal.proposal_total, proposal.proposal_currency)}
                  </span>
                </div>
              )}
            </div>

            {expired ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.83rem] text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                This proposal has expired. Create a new proposal to continue.
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[0.83rem] text-blue-800">
                <Clock size={14} className="mt-0.5 shrink-0" />
                Awaiting customer response. The customer received an email with an acceptance link.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {proposal.proposal_acceptance_token && (
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex items-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 py-2.5 text-[0.875rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f5f5f5]"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Acceptance Link"}
                </button>
              )}
              {!expired && (
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => doAction("send")}
                  className="flex items-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 py-2.5 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5] disabled:opacity-50"
                >
                  {loading === "send" ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  {loading === "send" ? "Resending…" : "Resend"}
                </button>
              )}
              {(expired || ps === "sent") && (
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={handleRedraft}
                  className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
                >
                  {loading === "draft" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  Create New Proposal
                </button>
              )}
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => setShowVoidModal(true)}
                className="flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-[0.875rem] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <X size={14} />
                Void
              </button>
            </div>
          </div>
        )}

        {/* ── State: accepted ── */}
        {ps === "accepted" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-[0.875rem] font-bold text-emerald-800">Proposal Accepted</p>
                <p className="mt-0.5 text-[0.8rem] text-emerald-700">
                  The customer accepted this proposal. &ldquo;Convert to Order&rdquo; is now unlocked.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] divide-y divide-black/[0.05]">
              {proposal.proposal_accepted_at && (
                <div className="flex items-center justify-between px-4 py-2.5 text-[0.83rem]">
                  <span className="text-[#5c5e62]">Accepted on</span>
                  <span className="font-semibold text-[#1a1a1a]">{longDate(proposal.proposal_accepted_at)}</span>
                </div>
              )}
              {proposal.proposal_total != null && (
                <div className="flex items-center justify-between px-4 py-2.5 text-[0.83rem]">
                  <span className="text-[#5c5e62]">Agreed Total</span>
                  <span className="font-extrabold text-[#1a1a1a]">
                    {fmtCurrency(proposal.proposal_total, proposal.proposal_currency)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── State: rejected ── */}
        {ps === "rejected" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
              <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="text-[0.875rem] font-bold text-red-700">Proposal Rejected</p>
                {proposal.proposal_rejection_reason && (
                  <p className="mt-1 text-[0.8rem] text-red-600">
                    <span className="font-semibold">Reason: </span>
                    {proposal.proposal_rejection_reason}
                  </p>
                )}
                {proposal.proposal_rejected_at && (
                  <p className="mt-0.5 text-[0.78rem] text-red-500">
                    {longDate(proposal.proposal_rejected_at)}
                  </p>
                )}
              </div>
            </div>
            <div>
              <button
                type="button"
                disabled={loading !== null}
                onClick={handleRedraft}
                className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
              >
                {loading === "draft" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {loading === "draft" ? "Creating…" : "Create New Proposal"}
              </button>
            </div>
          </div>
        )}

        {/* ── State: expired ── */}
        {ps === "expired" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-[0.875rem] font-bold text-gray-700">Proposal Expired</p>
                <p className="mt-0.5 text-[0.8rem] text-gray-500">
                  This proposal passed its expiry date without a response.
                </p>
              </div>
            </div>
            <div>
              <button
                type="button"
                disabled={loading !== null}
                onClick={handleRedraft}
                className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
              >
                {loading === "draft" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {loading === "draft" ? "Creating…" : "Create New Proposal"}
              </button>
            </div>
          </div>
        )}

        {/* ── State: converted ── */}
        {ps === "converted" && (
          <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal-600" />
            <div>
              <p className="text-[0.875rem] font-bold text-teal-800">Converted to Order</p>
              <p className="mt-0.5 text-[0.8rem] text-teal-700">
                This proposal was accepted and converted to an order.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Void modal ── */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Void Proposal</p>
                <p className="mt-1 text-[0.83rem] text-[#5c5e62]">
                  This will cancel the current proposal. You can create a new one afterwards.
                </p>
              </div>
              <button type="button" onClick={() => { setShowVoidModal(false); setVoidReason(""); }}
                className="shrink-0 text-[#9ca3af] hover:text-[#1a1a1a]">
                <X size={18} />
              </button>
            </div>
            <div className="mb-5">
              <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                Reason <span className="font-normal lowercase tracking-normal text-[#9ca3af]">(optional)</span>
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                rows={3}
                placeholder="Why is this proposal being voided?"
                className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A]/40 focus:ring-2 focus:ring-[#E85C1A]/10"
              />
            </div>
            <div className="flex gap-3">
              <button type="button"
                onClick={() => { setShowVoidModal(false); setVoidReason(""); }}
                disabled={loading === "void"}
                className="flex-1 h-11 rounded-full border border-black/[0.1] text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5] disabled:opacity-50">
                Cancel
              </button>
              <button type="button"
                disabled={loading === "void"}
                onClick={async () => {
                  await doAction("void", voidReason.trim() ? { reason: voidReason.trim() } : {});
                  setShowVoidModal(false);
                  setVoidReason("");
                }}
                className="flex flex-1 h-11 items-center justify-center gap-2 rounded-full bg-red-600 text-[0.875rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                {loading === "void" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                {loading === "void" ? "Voiding…" : "Void Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
