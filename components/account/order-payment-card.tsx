"use client";

import { useState } from "react";
import { CreditCard, CheckCircle, Landmark, Clock } from "lucide-react";
import BankTransferDetails from "./bank-transfer-details";

type Props = {
  orderRef: string;
  paymentMethod?: string;
  paymentStatus?: string;
};

export default function OrderPaymentCard({ orderRef, paymentMethod, paymentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayNow() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/orders/${orderRef}/checkout`, {
        method: "POST",
      });

      let json: Record<string, unknown> = {};
      try { json = await res.json(); } catch { /* non-JSON */ }

      if (res.status === 401) {
        setError("Your session has expired. Please log in again.");
        setLoading(false);
        return;
      }
      if (res.status === 409) {
        const msg = (json?.message ?? json?.error) as string | undefined;
        setError(msg ?? "This order is not awaiting payment.");
        setLoading(false);
        return;
      }
      if (res.status === 422) {
        const msg = (json?.message ?? json?.error) as string | undefined;
        setError(msg ?? "This order cannot be paid via Stripe.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const msg = (json?.message ?? json?.error) as string | undefined;
        setError(msg ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const data = (json?.data ?? json) as Record<string, unknown>;
      const checkoutUrl = data?.checkout_url as string | undefined;
      const returnedRef = (data?.order_ref as string | undefined) ?? orderRef;

      if (!checkoutUrl) {
        setError("No payment URL was returned. Please contact support.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("stripe_order_ref", returnedRef);
      window.location.href = checkoutUrl;
    } catch {
      setError("Could not connect to the payment service. Please try again.");
      setLoading(false);
    }
  }

  // ── Paid ──────────────────────────────────────────────────────────────────────
  if (paymentStatus === "paid") {
    return (
      <div className="rounded-[22px] bg-[#efefef] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={18} strokeWidth={2} className="text-green-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-green-700">
              Payment Complete
            </p>
            <p className="mt-0.5 text-[0.85rem] text-[var(--muted)]">
              Your payment has been received. Thank you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Stripe pending ────────────────────────────────────────────────────────────
  if (paymentStatus === "pending" && paymentMethod === "stripe") {
    return (
      <div className="rounded-[22px] bg-[#efefef] p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard size={17} strokeWidth={1.9} className="text-[var(--primary)]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
            Payment Required
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <p className="text-[0.88rem] leading-relaxed text-[var(--muted)]">
            Complete your payment securely with Stripe.
          </p>
          <button
            onClick={handlePayNow}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--primary)] px-7 py-3 text-[0.9rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CreditCard size={16} strokeWidth={2} />
            {loading ? "Redirecting…" : "Pay securely with Stripe"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[0.85rem] text-red-700">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Bank transfer pending ─────────────────────────────────────────────────────
  if (paymentStatus === "pending" && paymentMethod === "bank_transfer") {
    return (
      <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
        <div className="mb-3 flex items-center gap-2 sm:mb-4">
          <Landmark size={16} strokeWidth={1.9} className="text-[var(--foreground)] sm:hidden" />
          <Landmark size={17} strokeWidth={1.9} className="hidden text-[var(--foreground)] sm:block" />
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--foreground)] sm:text-[11px]">
            Bank Transfer Instructions
          </p>
        </div>
        <p className="mb-4 text-[0.85rem] leading-relaxed text-[var(--muted)] sm:text-[0.88rem]">
          Please transfer the order amount to the account below. Quote your order reference in the
          payment description. Your order will be processed once the transfer is received.
        </p>
        <BankTransferDetails orderRef={orderRef} />
      </div>
    );
  }

  // ── Other pending / unknown method ────────────────────────────────────────────
  if (paymentStatus === "pending") {
    return (
      <div className="rounded-[22px] bg-[#efefef] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Clock size={18} strokeWidth={1.9} className="text-amber-600" />
          </div>
          <p className="text-[0.88rem] leading-relaxed text-[var(--muted)]">
            Awaiting payment instructions from Okelcor.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
