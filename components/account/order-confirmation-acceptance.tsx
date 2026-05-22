"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";

type AcceptanceStatus = "pending" | "accepted" | "rejected";

export default function OrderConfirmationAcceptance({
  orderRef,
  initialStatus,
}: {
  orderRef: string;
  initialStatus: AcceptanceStatus;
}) {
  const [status,       setStatus]       = useState<AcceptanceStatus>(initialStatus);
  const [showDecline,  setShowDecline]  = useState(false);
  const [reason,       setReason]       = useState("");
  const [loading,      setLoading]      = useState<"accept" | "decline" | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  if (status === "accepted") {
    return (
      <div className="flex items-start gap-3 rounded-[18px] border border-emerald-200 bg-emerald-50/60 p-4 sm:rounded-[22px] sm:p-6">
        <CheckCircle2 size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald-600 sm:hidden" />
        <CheckCircle2 size={20} strokeWidth={1.8} className="mt-0.5 hidden shrink-0 text-emerald-600 sm:block" />
        <div>
          <p className="text-[0.9rem] font-bold text-emerald-900 sm:text-[0.95rem]">
            Order confirmation accepted.
          </p>
          <p className="mt-1 text-[0.83rem] leading-relaxed text-emerald-800 sm:text-[0.85rem]">
            Thank you. Okelcor will now proceed with the proforma invoice and payment details.
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-start gap-3 rounded-[18px] border border-gray-200 bg-gray-50/80 p-4 sm:rounded-[22px] sm:p-6">
        <XCircle size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-gray-400 sm:hidden" />
        <XCircle size={20} strokeWidth={1.8} className="mt-0.5 hidden shrink-0 text-gray-400 sm:block" />
        <div>
          <p className="text-[0.9rem] font-bold text-[var(--foreground)] sm:text-[0.95rem]">
            You declined this order confirmation.
          </p>
          <p className="mt-1 text-[0.83rem] leading-relaxed text-[var(--muted)] sm:text-[0.85rem]">
            If you&apos;d like to proceed, please contact Okelcor to discuss your order.
          </p>
        </div>
      </div>
    );
  }

  const handleAccept = async () => {
    setLoading("accept");
    setError(null);
    try {
      const res = await fetch(
        `/api/account/orders/${encodeURIComponent(orderRef)}/accept-order-confirmation`,
        { method: "POST" },
      );
      if (res.ok) {
        setStatus("accepted");
      } else {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setError(json.message ?? "Failed to accept. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleDecline = async () => {
    setLoading("decline");
    setError(null);
    try {
      const res = await fetch(
        `/api/account/orders/${encodeURIComponent(orderRef)}/reject-order-confirmation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reason.trim() ? { reason: reason.trim() } : {}),
        },
      );
      if (res.ok) {
        setStatus("rejected");
      } else {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setError(json.message ?? "Failed to decline. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-[18px] border border-blue-200 bg-blue-50/50 p-4 sm:rounded-[22px] sm:p-6">
      <div className="flex items-start gap-3">
        <Clock size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-blue-500 sm:hidden" />
        <Clock size={20} strokeWidth={1.8} className="mt-0.5 hidden shrink-0 text-blue-500 sm:block" />
        <div className="flex-1">
          <p className="text-[0.9rem] font-bold text-[var(--foreground)] sm:text-[0.95rem]">
            Action required: Review order confirmation
          </p>
          <p className="mt-1 text-[0.83rem] leading-relaxed text-[var(--muted)] sm:text-[0.85rem]">
            Please accept the order confirmation before Okelcor can issue your proforma invoice and process your order.
          </p>

          {error && (
            <p className="mt-2 text-[0.83rem] text-red-600">{error}</p>
          )}

          {!showDecline ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAccept}
                disabled={loading !== null}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
              >
                {loading === "accept"
                  ? "Accepting…"
                  : <>Accept Order Confirmation <ArrowRight size={13} strokeWidth={2.5} /></>
                }
              </button>
              <button
                type="button"
                onClick={() => { setShowDecline(true); setError(null); }}
                disabled={loading !== null}
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 py-2.5 text-[0.85rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f5f5f5] disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Reason <span className="font-normal lowercase tracking-normal opacity-60">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Let us know why you&apos;re declining…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition focus:border-[var(--primary)]/40 focus:ring-2 focus:ring-[var(--primary)]/10"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-5 py-2.5 text-[0.85rem] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  {loading === "decline" ? "Declining…" : "Confirm Decline"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDecline(false); setReason(""); setError(null); }}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 py-2.5 text-[0.85rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f5f5f5] disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
