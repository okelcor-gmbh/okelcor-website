"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";

export default function OrderConfirmationAcceptance({
  orderRef,
  initialStatus,
}: {
  orderRef: string;
  initialStatus: "pending" | "accepted";
}) {
  const [status,  setStatus]  = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

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

  const handleAccept = async () => {
    setLoading(true);
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
      setLoading(false);
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
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
          >
            {loading ? "Accepting…" : <>Accept Order Confirmation <ArrowRight size={13} strokeWidth={2.5} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
