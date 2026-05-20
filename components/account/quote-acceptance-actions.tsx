"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, XCircle } from "lucide-react";

type AcceptanceStatus = "pending" | "accepted" | "rejected" | null | undefined;

export default function QuoteAcceptanceActions({
  quoteRef,
  proposalDocUrl,
  initialStatus,
}: {
  quoteRef: string;
  proposalDocUrl?: string | null;
  initialStatus: AcceptanceStatus;
}) {
  const [status,        setStatus]        = useState<AcceptanceStatus>(initialStatus);
  const [showReject,    setShowReject]     = useState(false);
  const [rejectReason,  setRejectReason]  = useState("");
  const [loading,       setLoading]       = useState<"accept" | "reject" | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  if (status === "accepted") {
    return (
      <div className="flex items-start gap-3 rounded-[22px] border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8">
        <CheckCircle2 size={20} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-[0.95rem] font-bold text-emerald-900">Quote accepted.</p>
          <p className="mt-1 text-[0.85rem] leading-relaxed text-emerald-800">
            Thank you for your confirmation. Okelcor will proceed to prepare your proforma invoice and next steps.
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-start gap-3 rounded-[22px] border border-gray-200 bg-gray-50 p-6 sm:p-8">
        <XCircle size={20} strokeWidth={1.8} className="mt-0.5 shrink-0 text-gray-500" />
        <div>
          <p className="text-[0.95rem] font-bold text-gray-700">Quote declined.</p>
          <p className="mt-1 text-[0.85rem] leading-relaxed text-gray-600">
            You have declined this quote. If you&apos;d like to discuss alternatives, please contact Okelcor.
          </p>
        </div>
      </div>
    );
  }

  if (status !== "pending") return null;

  const handleAccept = async () => {
    setLoading("accept");
    setError(null);
    try {
      const res = await fetch(`/api/account/quotes/${encodeURIComponent(quoteRef)}/accept`, {
        method: "POST",
      });
      if (res.ok) {
        setStatus("accepted");
      } else {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setError(json.message ?? "Failed to accept quote. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading("reject");
    setError(null);
    try {
      const res = await fetch(`/api/account/quotes/${encodeURIComponent(quoteRef)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rejectReason.trim() ? { reason: rejectReason.trim() } : {}),
      });
      if (res.ok) {
        setStatus("rejected");
      } else {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setError(json.message ?? "Failed to decline quote. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-[22px] border border-blue-200 bg-blue-50/50 p-6 sm:p-8">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">
        Action Required
      </p>
      <p className="mb-1 text-[0.95rem] font-bold text-[var(--foreground)]">
        Please review and respond to this quote.
      </p>
      <p className="mb-5 text-[0.85rem] leading-relaxed text-[var(--muted)]">
        Okelcor has prepared a quote for your request. Please accept to proceed, or decline if you wish to make changes.
      </p>

      {proposalDocUrl && (
        <a
          href={proposalDocUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[0.82rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0]"
        >
          <ExternalLink size={13} strokeWidth={2} />
          View Quote Document
        </a>
      )}

      {error && (
        <p className="mb-3 text-[0.83rem] text-red-600">{error}</p>
      )}

      {!showReject ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
          >
            {loading === "accept" ? "Accepting…" : <>Accept Quote <ArrowRight size={13} strokeWidth={2.5} /></>}
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-5 py-2.5 text-[0.85rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f5f5f5] disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              Reason <span className="font-normal text-[var(--muted)] lowercase tracking-normal">(optional)</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Let us know why you're declining this quote…"
              rows={3}
              className="w-full resize-none rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-[0.88rem] text-[var(--foreground)] placeholder:text-[var(--muted)]/60 focus:border-[var(--primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleReject}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-5 py-2.5 text-[0.85rem] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {loading === "reject" ? "Declining…" : "Confirm Decline"}
            </button>
            <button
              type="button"
              onClick={() => { setShowReject(false); setRejectReason(""); setError(null); }}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-5 py-2.5 text-[0.85rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f5f5f5] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
