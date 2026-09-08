"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle, AlertTriangle, CheckCircle2,
  Loader2, Mail, MailCheck, Send, Undo2, X,
} from "lucide-react";
import { canDo } from "@/lib/admin-permissions";
import { formatMoney } from "@/lib/currency";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStage =
  | "pending_proforma"
  | "deposit_requested"
  | "deposit_paid"
  | "balance_due"
  | "balance_paid"
  | "shipment_released";

type EmailRecord = Record<PaymentStage, string | null>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

// Stage index used for "is completed / is current / is pending" logic
const STAGE_INDEX: Record<PaymentStage, number> = {
  pending_proforma:    0,
  deposit_requested:   1,
  deposit_paid:        2,
  balance_due:         3,
  balance_paid:        4,
  shipment_released:   5,
};

const STAGE_LABEL: Record<PaymentStage, string> = {
  pending_proforma:  "Pending Proforma",
  deposit_requested: "Deposit Requested",
  deposit_paid:      "Deposit Paid",
  balance_due:       "Balance Due",
  balance_paid:      "Balance Paid",
  shipment_released: "Shipment Released",
};

const STAGE_BADGE: Record<PaymentStage, string> = {
  pending_proforma:  "bg-gray-100 text-gray-500",
  deposit_requested: "bg-amber-100 text-amber-700",
  deposit_paid:      "bg-blue-100 text-blue-700",
  balance_due:       "bg-orange-100 text-orange-700",
  balance_paid:      "bg-emerald-100 text-emerald-700",
  shipment_released: "bg-green-100 text-green-700",
};

// ── Confirmation modal ────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  body,
  warning,
  noteLabel,
  noteValue,
  onNoteChange,
  onConfirm,
  onCancel,
  loading,
  error,
  confirmLabel,
  confirmClass,
}: {
  title: string;
  body: string;
  warning?: string;
  noteLabel?: string;
  noteValue?: string;
  onNoteChange?: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  confirmLabel: string;
  confirmClass: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <p className="mb-4 text-[0.875rem] font-bold text-[#1a1a1a]">{title}</p>
        {warning && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.83rem] text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
            {warning}
          </div>
        )}
        <p className="mb-4 text-[0.875rem] text-[#5c5e62]">{body}</p>

        {noteLabel && onNoteChange !== undefined && (
          <div className="mb-4">
            <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
              {noteLabel} <span className="font-normal lowercase">(optional)</span>
            </p>
            <textarea
              value={noteValue}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={3}
              placeholder="Add a note…"
              className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#f4511e]/40 focus:ring-2 focus:ring-[#f4511e]/10"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[0.83rem] text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-9 rounded-full border border-black/[0.09] bg-white px-5 text-[0.83rem] font-semibold text-[#5c5e62] transition hover:border-black/20 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-9 rounded-full px-5 text-[0.83rem] font-semibold text-white transition disabled:opacity-50 ${confirmClass}`}
          >
            {loading
              ? <span className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" /> Working…</span>
              : confirmLabel
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PaymentMilestonesCard({
  orderId,
  adminRole,
  currency,
  initialStage,
  orderTotal,
  depositPercent,
  depositAmount,
  balanceAmount,
  depositPaidAt,
  balancePaidAt,
  shipmentReleasedAt,
  shipmentReleaseNote: initialReleaseNote,
  // DOC-8: email tracking fields (null = not sent, string = ISO sent-at)
  depositRequestedEmailAt,
  depositPaidEmailAt,
  balanceDueEmailAt,
  balancePaidEmailAt,
  shipmentReleasedEmailAt,
  // Session 90 — needed by the correction control: an order can read as paid
  // through payment_status as well as through the stage, and putting only one
  // of the two back leaves the customer still looking at "paid".
  paymentStatus: initialPaymentStatus,
  paymentMethod,
}: {
  orderId: number;
  adminRole: string;
  /** ISO 4217 code — defaults to EUR when the order predates currency support. */
  currency?: string | null;
  initialStage: PaymentStage;
  /** Order total — the base the deposit is calculated against. */
  orderTotal?: number | null;
  depositPercent?: number | null;
  depositAmount?: number | null;
  balanceAmount?: number | null;
  depositPaidAt?: string | null;
  balancePaidAt?: string | null;
  shipmentReleasedAt?: string | null;
  shipmentReleaseNote?: string | null;
  depositRequestedEmailAt?: string | null;
  depositPaidEmailAt?: string | null;
  balanceDueEmailAt?: string | null;
  balancePaidEmailAt?: string | null;
  shipmentReleasedEmailAt?: string | null;
  paymentStatus?: string | null;
  /** "stripe" means the gateway owns this payment and it cannot be hand-corrected. */
  paymentMethod?: string | null;
}) {
  const [stage,       setStage]       = useState<PaymentStage>(initialStage);
  // The deposit/balance split is now set either by generating a proforma or by
  // requesting the deposit, so it has to be live rather than read from props.
  const [split,       setSplit]       = useState({
    depositPercent: depositPercent ?? null,
    depositAmount:  depositAmount  ?? null,
    balanceAmount:  balanceAmount  ?? null,
  });
  const [depPaidAt,   setDepPaidAt]   = useState(depositPaidAt);
  const [balPaidAt,   setBalPaidAt]   = useState(balancePaidAt);
  const [releasedAt,  setReleasedAt]  = useState(shipmentReleasedAt);
  const [releaseNote, setReleaseNote] = useState(initialReleaseNote ?? "");

  // DOC-8: email sent tracking per stage
  const [emailSent, setEmailSent] = useState<EmailRecord>({
    pending_proforma:  null,
    deposit_requested: depositRequestedEmailAt ?? null,
    deposit_paid:      depositPaidEmailAt ?? null,
    balance_due:       balanceDueEmailAt ?? null,
    balance_paid:      balancePaidEmailAt ?? null,
    shipment_released: shipmentReleasedEmailAt ?? null,
  });
  const [resendLoading, setResendLoading] = useState<PaymentStage | null>(null);

  const [payStatus, setPayStatus] = useState(initialPaymentStatus ?? "pending");

  // Modal states
  const [modal,   setModal]   = useState<"deposit" | "balance_due" | "balance" | "release" | null>(null);
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Correction panel (Session 90) ─────────────────────────────────────────
  // The order manager reported the same problem twice: an order showing as
  // paid, the deposit not yet in, and nothing she could do about it. Session 76
  // closed the paths that were advancing orders on their own; what stayed open
  // is that every route through this ladder moves forward, so an order that
  // landed wrong for any reason stayed wrong until a developer edited the
  // database. This is the way back, and it is hers to use.
  const [corrOpen,    setCorrOpen]    = useState(false);
  const [corrStage,   setCorrStage]   = useState<PaymentStage>("pending_proforma");
  const [corrReset,   setCorrReset]   = useState(true);
  const [corrReason,  setCorrReason]  = useState("");
  const [corrLoading, setCorrLoading] = useState(false);
  const [corrError,   setCorrError]   = useState<string | null>(null);

  // ── Request-deposit form (pending_proforma only) ──────────────────────────
  // Generating a proforma no longer starts the ladder or e-mails anyone.
  // Asking the customer for money is now this deliberate, separate act.
  const [reqOpen,    setReqOpen]    = useState(false);
  const [reqBasis,   setReqBasis]   = useState<"percent" | "amount">("percent");
  const [reqPercent, setReqPercent] = useState(String(depositPercent ?? 50));
  const [reqAmount,  setReqAmount]  = useState("");
  const [reqNotify,  setReqNotify]  = useState(false);
  const [reqNotes,   setReqNotes]   = useState("");
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError,   setReqError]   = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "warning" } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const canMarkPaid = canDo(adminRole, "payments.mark_paid");
  const canRelease  = canDo(adminRole, "payments.release_shipment");
  const canCorrect  = canDo(adminRole, "payments.correct_state");
  const stageIdx    = STAGE_INDEX[stage];

  // Stripe writes its own payment state; a figure typed here would only
  // disagree with the gateway until somebody noticed. The backend refuses
  // these too — this just doesn't offer an action that would be refused.
  const gatewayManaged = paymentMethod === "stripe";

  // Somewhere this order is telling the customer he has paid. Either column
  // can be the one doing it, which is why both are offered together.
  const readsAsPaid = payStatus === "paid" || stageIdx >= STAGE_INDEX.deposit_paid;

  // Only ever backwards: recording that money arrived belongs to the actions
  // above, which notify the customer and record who confirmed it.
  const correctableStages = (Object.keys(STAGE_INDEX) as PaymentStage[])
    .filter((s) => STAGE_INDEX[s] < stageIdx);

  const showCorrection = canCorrect && !gatewayManaged
    && (correctableStages.length > 0 || payStatus === "paid");

  const closeModal = () => { setModal(null); setNote(""); setError(null); };

  function showActionToast(emailSentResult?: boolean) {
    if (emailSentResult === true) {
      setToast({ message: "Milestone updated. Customer has been notified by email.", variant: "success" });
    } else if (emailSentResult === false) {
      setToast({ message: "Milestone updated, but the customer notification email failed.", variant: "warning" });
    } else {
      setToast({ message: "Milestone updated.", variant: "success" });
    }
  }

  async function callAction(endpoint: string, body?: object): Promise<{ ok: boolean; emailSent?: boolean }> {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}/payment-milestones/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({})) as {
        message?: string;
        data?: {
          payment_stage?: PaymentStage;
          deposit_percent?: number | null;
          deposit_amount?: number | null;
          balance_amount?: number | null;
          deposit_paid_at?: string;
          balance_paid_at?: string;
          shipment_released_at?: string;
          email_sent?: boolean;
          // Backend may echo the updated email timestamps directly
          deposit_requested_email_sent_at?: string | null;
          deposit_paid_email_sent_at?: string | null;
          balance_due_email_sent_at?: string | null;
          balance_paid_email_sent_at?: string | null;
          shipment_released_email_sent_at?: string | null;
        };
      };
      if (!res.ok) {
        setError(json.message ?? "Action failed. Please try again.");
        return { ok: false };
      }
      // Update optimistic state from backend echo
      if (json.data?.payment_stage) setStage(json.data.payment_stage);
      // deposit-paid can be recorded straight from pending_proforma, in which
      // case the backend backfills the split — take its figures, not ours.
      setSplit((prev) => ({
        depositPercent: json.data?.deposit_percent ?? prev.depositPercent,
        depositAmount:  json.data?.deposit_amount  ?? prev.depositAmount,
        balanceAmount:  json.data?.balance_amount  ?? prev.balanceAmount,
      }));
      if (json.data?.deposit_paid_at) setDepPaidAt(json.data.deposit_paid_at);
      if (json.data?.balance_paid_at) setBalPaidAt(json.data.balance_paid_at);
      if (json.data?.shipment_released_at) setReleasedAt(json.data.shipment_released_at);
      // Update email tracking from backend echo
      setEmailSent((prev) => ({
        ...prev,
        ...(json.data?.deposit_requested_email_sent_at !== undefined && { deposit_requested: json.data!.deposit_requested_email_sent_at! }),
        ...(json.data?.deposit_paid_email_sent_at !== undefined      && { deposit_paid:      json.data!.deposit_paid_email_sent_at! }),
        ...(json.data?.balance_due_email_sent_at !== undefined       && { balance_due:       json.data!.balance_due_email_sent_at! }),
        ...(json.data?.balance_paid_email_sent_at !== undefined      && { balance_paid:      json.data!.balance_paid_email_sent_at! }),
        ...(json.data?.shipment_released_email_sent_at !== undefined && { shipment_released: json.data!.shipment_released_email_sent_at! }),
      }));
      return { ok: true, emailSent: json.data?.email_sent };
    } catch {
      setError("Network error. Please try again.");
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestDeposit() {
    setReqError(null);

    // Mirror the server's own bounds so an obvious mistake is caught before
    // the round trip; the server remains the authority on both.
    if (reqBasis === "amount") {
      const amt = Number(reqAmount);
      if (!reqAmount.trim() || !Number.isFinite(amt) || amt < 0.01) {
        setReqError("Enter the deposit amount agreed with the buyer."); return;
      }
      if (orderTotal != null && amt > orderTotal) {
        setReqError("The deposit cannot be more than the order total."); return;
      }
    } else {
      const pct = Number(reqPercent);
      if (!Number.isFinite(pct) || pct < 0.01 || pct > 100) {
        setReqError("Enter a deposit percentage between 0.01 and 100."); return;
      }
    }

    setReqLoading(true);
    try {
      const body: Record<string, unknown> = { notify_customer: reqNotify };
      if (reqBasis === "amount") body.deposit_amount  = Number(reqAmount);
      else                      body.deposit_percent = Number(reqPercent);
      if (reqNotes.trim()) body.notes = reqNotes.trim();

      const res  = await fetch(`/api/admin/orders/${orderId}/payment-milestones/request-deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({})) as {
        message?: string;
        code?: string;
        email_sent?: boolean;
        email_warning?: string | null;
        data?: {
          payment_stage?: PaymentStage;
          deposit_percent?: number | null;
          deposit_amount?: number | null;
          balance_amount?: number | null;
          deposit_requested_email_sent_at?: string | null;
        };
      };

      if (!res.ok) {
        // The three documented failures, said in the operator's terms.
        const byCode: Record<string, string> = {
          invalid_payment_stage: "The payment ladder has already been started on this order. Reload the page to see where it stands.",
          deposit_exceeds_total: "The deposit cannot be more than the order total.",
          order_total_missing:   "This order has no total to take a deposit against. Add the line items or an order total first.",
        };
        setReqError((json.code && byCode[json.code]) ?? json.message ?? "Could not request the deposit. Please try again.");
        return;
      }

      setStage(json.data?.payment_stage ?? "deposit_requested");
      setSplit((prev) => ({
        depositPercent: json.data?.deposit_percent ?? prev.depositPercent,
        depositAmount:  json.data?.deposit_amount  ?? prev.depositAmount,
        balanceAmount:  json.data?.balance_amount  ?? prev.balanceAmount,
      }));
      setEmailSent((prev) => ({
        ...prev,
        deposit_requested: json.data?.deposit_requested_email_sent_at
          ?? (json.email_sent ? new Date().toISOString() : null),
      }));
      setReqOpen(false);
      setReqNotes("");

      if (json.email_warning) {
        setToast({ message: json.email_warning, variant: "warning" });
      } else if (reqNotify) {
        setToast({ message: "Deposit requested. The customer has been e-mailed.", variant: "success" });
      } else {
        setToast({ message: "Deposit requested. The customer was not e-mailed.", variant: "success" });
      }
    } catch {
      setReqError("Network error. Please try again.");
    } finally {
      setReqLoading(false);
    }
  }

  async function handleDepositPaid() {
    const { ok, emailSent: es } = await callAction("deposit-paid", note ? { note } : undefined);
    if (ok) { setStage("deposit_paid"); setDepPaidAt(new Date().toISOString()); closeModal(); showActionToast(es); }
  }

  async function handleBalanceDue() {
    const { ok, emailSent: es } = await callAction("balance-due");
    if (ok) { setStage("balance_due"); closeModal(); showActionToast(es); }
  }

  async function handleBalancePaid() {
    const { ok, emailSent: es } = await callAction("balance-paid", note ? { note } : undefined);
    if (ok) { setStage("balance_paid"); setBalPaidAt(new Date().toISOString()); closeModal(); showActionToast(es); }
  }

  async function handleReleaseShipment() {
    const { ok, emailSent: es } = await callAction("release-shipment", note ? { note } : undefined);
    if (ok) { setStage("shipment_released"); setReleasedAt(new Date().toISOString()); setReleaseNote(note); closeModal(); showActionToast(es); }
  }

  async function handleCorrect() {
    setCorrError(null);

    if (corrReason.trim().length < 5) {
      setCorrError("Say why in a few words. It goes on the order's record, and it is what makes this safe to do.");
      return;
    }

    setCorrLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment-milestones/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_stage:        corrStage,
          reset_payment_status: corrReset,
          reason:               corrReason.trim(),
        }),
      });
      const json = await res.json().catch(() => ({})) as {
        message?: string;
        code?: string;
        data?: {
          payment_stage?: PaymentStage;
          payment_status?: string;
          deposit_paid_at?: string | null;
          balance_paid_at?: string | null;
          shipment_released_at?: string | null;
        };
      };

      if (!res.ok) {
        const byCode: Record<string, string> = {
          gateway_managed_payment:   "This order is paid through Stripe. Its payment state comes from the gateway and cannot be set by hand.",
          use_the_milestone_actions: "This only puts a payment state back. To record that money has arrived, use the milestone buttons above — they notify the customer and record who confirmed it.",
          nothing_to_correct:        "This order is already in that state. Nothing to change.",
        };
        setCorrError((json.code && byCode[json.code]) ?? json.message ?? "Could not correct the payment state. Please try again.");
        return;
      }

      setStage(json.data?.payment_stage ?? corrStage);
      setPayStatus(json.data?.payment_status ?? (corrReset ? "pending" : payStatus));
      // The backend clears the dates for any stage it rolled back — a date
      // saying the balance arrived is a claim, not a note, and leaving it
      // behind would leave the claim standing.
      setDepPaidAt(json.data?.deposit_paid_at ?? null);
      setBalPaidAt(json.data?.balance_paid_at ?? null);
      setReleasedAt(json.data?.shipment_released_at ?? null);
      setCorrOpen(false);
      setCorrReason("");
      setToast({
        message: json.message ?? "Payment state corrected. The customer was not notified.",
        variant: "success",
      });
    } catch {
      setCorrError("Network error. Please try again.");
    } finally {
      setCorrLoading(false);
    }
  }

  async function handleResendEmail(targetStage: PaymentStage) {
    setResendLoading(targetStage);
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}/payment-milestones/resend-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      });
      const json = await res.json().catch(() => ({})) as { message?: string };
      if (res.ok) {
        setEmailSent((prev) => ({ ...prev, [targetStage]: new Date().toISOString() }));
        setToast({ message: "Email resent to customer.", variant: "success" });
      } else {
        setToast({ message: json.message ?? "Failed to resend email. Please try again.", variant: "warning" });
      }
    } catch {
      setToast({ message: "Network error. Could not resend email.", variant: "warning" });
    } finally {
      setResendLoading(null);
    }
  }

  // ── Steps definition ──────────────────────────────────────────────────────

  type Step = {
    id: PaymentStage;
    label: string;
    sub?: string;
    date?: string | null;
    action?: { label: string; modal: typeof modal; show: boolean };
  };

  const steps: Step[] = [
    {
      id: "deposit_requested",
      label: "Deposit Requested",
      sub: split.depositAmount != null
        ? `${split.depositPercent ?? 50}% · ${formatMoney(split.depositAmount, currency)}`
        : split.depositPercent != null ? `${split.depositPercent}%` : undefined,
    },
    {
      id: "deposit_paid",
      label: "Deposit Paid",
      date: depPaidAt,
      action: {
        label: "Mark Deposit Paid",
        modal: "deposit",
        show: stageIdx === STAGE_INDEX.deposit_requested && canMarkPaid,
      },
    },
    {
      id: "balance_due",
      label: "Balance Due",
      sub: split.balanceAmount != null ? formatMoney(split.balanceAmount, currency) : undefined,
      action: {
        label: "Mark Balance Due",
        modal: "balance_due",
        show: stageIdx === STAGE_INDEX.deposit_paid && canMarkPaid,
      },
    },
    {
      id: "balance_paid",
      label: "Balance Paid",
      date: balPaidAt,
      action: {
        label: "Mark Balance Paid",
        modal: "balance",
        // Backend accepts this transition directly from deposit_paid too —
        // lets an order manager handle "customer already paid in full"
        // without a confusing forced intermediate balance_due step.
        show: (stageIdx === STAGE_INDEX.balance_due || stageIdx === STAGE_INDEX.deposit_paid) && canMarkPaid,
      },
    },
    {
      id: "shipment_released",
      label: "Shipment Released",
      date: releasedAt,
      sub: releaseNote || undefined,
      action: {
        label: "Release Shipment",
        modal: "release",
        show: stageIdx === STAGE_INDEX.balance_paid && canRelease,
      },
    },
  ];

  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#f4511e]">
            Payment Milestones
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* An order reads as paid through payment_status as well as through
                the stage, and the two can disagree — which is how an order at
                "Pending Proforma" was still telling the customer he had paid.
                Show both, so what the buyer sees is never hidden behind the
                one that happens to be on the ladder. */}
            {payStatus === "paid" && (
              <span
                className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.72rem] font-bold text-emerald-700"
                title="The customer's portal shows this order as paid."
              >
                Marked paid
              </span>
            )}
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${STAGE_BADGE[stage]}`}>
              {STAGE_LABEL[stage]}
            </span>
          </div>
        </div>

        {stage === "pending_proforma" ? (
          /* ── Resting state: nothing has been asked for yet ──────────────
             Generating a proforma calculates the split but no longer starts
             the ladder or e-mails the customer. This is the deliberate act
             that does both. The customer sees no schedule until it happens. */
          <div>
            <p className="text-[0.875rem] text-[#5c5e62]">
              No deposit has been requested yet. The customer sees no payment
              schedule until one is.
            </p>

            {!reqOpen ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {canMarkPaid ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setReqOpen(true); setReqError(null); }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#f4511e] px-4 text-[0.78rem] font-semibold text-white transition hover:bg-[#d04d15]"
                    >
                      <Send size={12} strokeWidth={2.2} />
                      Request Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModal("deposit"); setNote(""); setError(null); }}
                      className="text-[0.78rem] font-semibold text-[#5c5e62] underline-offset-2 transition hover:text-[#1a1a1a] hover:underline"
                    >
                      Deposit already received
                    </button>
                  </>
                ) : (
                  <p className="text-[0.78rem] text-[#9ca3af]">
                    An order manager starts the payment ladder.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-black/[0.08] bg-[#fafafa] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[0.78rem] font-bold text-[#1a1a1a]">Request Deposit</p>
                  <button
                    type="button"
                    onClick={() => { setReqOpen(false); setReqError(null); }}
                    disabled={reqLoading}
                    className="text-[#9ca3af] transition hover:text-[#5c5e62] disabled:opacity-50"
                  >
                    <X size={15} strokeWidth={2} />
                  </button>
                </div>

                {/* Percentage or an agreed round figure */}
                <div className="mb-3 flex gap-2">
                  {(["percent", "amount"] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => { setReqBasis(b); setReqError(null); }}
                      className={`h-7 rounded-full px-3 text-[0.73rem] font-semibold transition ${
                        reqBasis === b
                          ? "bg-[#1a1a1a] text-white"
                          : "border border-black/[0.1] bg-white text-[#5c5e62] hover:border-black/25"
                      }`}
                    >
                      {b === "percent" ? "Percentage" : "Agreed amount"}
                    </button>
                  ))}
                </div>

                {reqBasis === "percent" ? (
                  <div className="mb-3">
                    <label htmlFor="req-pct" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">
                      Deposit percentage
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="req-pct"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={reqPercent}
                        onChange={(e) => setReqPercent(e.target.value)}
                        className="h-9 w-28 rounded-lg border border-black/[0.1] bg-white px-3 text-[0.85rem] tabular-nums text-[#1a1a1a] outline-none transition focus:border-[#f4511e]/50 focus:ring-2 focus:ring-[#f4511e]/10"
                      />
                      <span className="text-[0.8rem] text-[#5c5e62]">%</span>
                      {orderTotal != null && Number(reqPercent) > 0 && (
                        <span className="text-[0.75rem] tabular-nums text-[#9ca3af]">
                          = {formatMoney(Math.round(orderTotal * Number(reqPercent)) / 100, currency)} of {formatMoney(orderTotal, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label htmlFor="req-amt" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">
                      Deposit amount
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="req-amt"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={reqAmount}
                        onChange={(e) => setReqAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="h-9 w-36 rounded-lg border border-black/[0.1] bg-white px-3 text-[0.85rem] tabular-nums text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e]/50 focus:ring-2 focus:ring-[#f4511e]/10"
                      />
                      {orderTotal != null && (
                        <span className="text-[0.75rem] tabular-nums text-[#9ca3af]">
                          of {formatMoney(orderTotal, currency)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[0.68rem] text-[#9ca3af]">
                      For a round figure agreed with the buyer. The percentage is derived from it.
                    </p>
                  </div>
                )}

                {/* Notification is a decision, not a default */}
                <label className="mb-3 flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={reqNotify}
                    onChange={(e) => setReqNotify(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#f4511e]"
                  />
                  <span className="text-[0.8rem] text-[#1a1a1a]">
                    Also e-mail the customer
                    <span className="mt-0.5 block text-[0.7rem] text-[#9ca3af]">
                      Leave unticked if the deposit was already agreed by phone or e-mail —
                      a duplicate request is worse than silence.
                    </span>
                  </span>
                </label>

                <div className="mb-3">
                  <label htmlFor="req-notes" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">
                    Note <span className="font-normal text-[#9ca3af]">(optional — goes to the audit trail)</span>
                  </label>
                  <textarea
                    id="req-notes"
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value.slice(0, 500))}
                    rows={2}
                    placeholder="e.g. Agreed 40% with Mr Adeyemi on the call of 8 Aug"
                    className="w-full resize-none rounded-lg border border-black/[0.1] bg-white px-3 py-2 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e]/50 focus:ring-2 focus:ring-[#f4511e]/10"
                  />
                  <p className="mt-1 text-right text-[0.66rem] tabular-nums text-[#c0c3c8]">{reqNotes.length}/500</p>
                </div>

                {reqError && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[0.8rem] text-red-700">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    {reqError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRequestDeposit}
                  disabled={reqLoading}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#f4511e] px-4 text-[0.78rem] font-semibold text-white transition hover:bg-[#d04d15] disabled:opacity-60"
                >
                  {reqLoading
                    ? <><Loader2 size={12} className="animate-spin" /> Requesting…</>
                    : <><Send size={12} strokeWidth={2.2} /> Request Deposit</>
                  }
                </button>
              </div>
            )}
          </div>
        ) : (
          <ol className="relative space-y-0 border-l-2 border-black/[0.06] pl-5">
            {steps.map((step, i) => {
              const idx    = STAGE_INDEX[step.id];
              const isDone = stageIdx > idx;
              const isCurr = stageIdx === idx;
              const isLast = i === steps.length - 1;
              const reached = isDone || isCurr;
              const sentAt  = emailSent[step.id];

              return (
                <li key={step.id} className={isLast ? "pb-0 pt-1" : "pb-5 pt-1"}>
                  {/* Timeline dot */}
                  <span
                    className={[
                      "absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white",
                      isDone  ? "border-emerald-500 bg-emerald-500"
                              : isCurr ? "border-[#f4511e] bg-[#f4511e]"
                              : "border-black/20",
                    ].join(" ")}
                    style={{ marginTop: "2px" }}
                  >
                    {isDone && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
                  </span>

                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-[0.875rem] font-semibold ${isDone ? "text-emerald-700" : isCurr ? "text-[#1a1a1a]" : "text-[#9ca3af]"}`}>
                        {step.label}
                      </p>
                      {step.sub && (
                        <p className={`mt-0.5 text-[0.75rem] ${isDone || isCurr ? "text-[#5c5e62]" : "text-[#b0b3b8]"}`}>
                          {step.sub}
                        </p>
                      )}
                      {step.date && isDone && (
                        <p className="mt-0.5 text-[0.72rem] text-emerald-600">
                          Confirmed {shortDate(step.date)}
                        </p>
                      )}

                      {/* ── Email status (DOC-8) ────────────────────────────
                          Only for stages this order has actually reached. A
                          stage that hasn't happened has no notification to
                          send, so offering the control there is noise.

                          An unsent notification is no longer flagged amber:
                          not e-mailing is now a legitimate choice (the deposit
                          request defaults to silent), so this states the fact
                          and offers the action without implying a failure. */}
                      {reached && (
                        sentAt ? (
                          <p className="mt-1 flex items-center gap-1 text-[0.7rem] text-emerald-600">
                            <MailCheck size={11} strokeWidth={2} />
                            Email sent {shortDate(sentAt)}
                          </p>
                        ) : (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[0.7rem] text-[#9ca3af]">
                              Customer not notified
                            </span>
                            <button
                              type="button"
                              onClick={() => handleResendEmail(step.id)}
                              disabled={resendLoading === step.id}
                              title={`Send the ${STAGE_LABEL[step.id]} notification now`}
                              className="inline-flex h-5 items-center gap-1 rounded-full border border-black/[0.12] bg-white px-2 text-[0.68rem] font-semibold text-[#5c5e62] transition hover:border-black/25 hover:text-[#1a1a1a] disabled:opacity-50"
                            >
                              {resendLoading === step.id
                                ? <Loader2 size={9} className="animate-spin" />
                                : <Mail size={9} strokeWidth={2.5} />
                              }
                              {resendLoading === step.id ? "…" : "Send now"}
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {/* Action button */}
                    {step.action?.show && (
                      <button
                        type="button"
                        onClick={() => { setModal(step.action!.modal); setNote(""); setError(null); }}
                        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-[#f4511e] px-3 text-[0.73rem] font-semibold text-white transition hover:bg-[#d04d15]"
                      >
                        {step.action.label}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {/* ── Correct the payment state (Session 90) ──────────────────────
            Everything above moves an order forward. This is the only way
            back, and it exists because "the website says he paid and he
            hasn't" was reported twice with no answer either time except to
            wait for a developer. Deliberately quiet — this is a repair, not
            part of the normal run of an order — but always reachable. */}
        {showCorrection && (
          <div className="mt-5 border-t border-black/[0.06] pt-4">
            {!corrOpen ? (
              <button
                type="button"
                onClick={() => {
                  setCorrOpen(true);
                  setCorrError(null);
                  setCorrStage(correctableStages[0] ?? "pending_proforma");
                  setCorrReset(payStatus === "paid");
                }}
                className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#5c5e62] underline-offset-2 transition hover:text-[#1a1a1a] hover:underline"
              >
                <Undo2 size={12} strokeWidth={2.2} />
                {readsAsPaid
                  ? "This isn't paid — correct the payment state"
                  : "Correct the payment state"}
              </button>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[0.78rem] font-bold text-[#1a1a1a]">Correct the payment state</p>
                  <button
                    type="button"
                    onClick={() => { setCorrOpen(false); setCorrError(null); }}
                    disabled={corrLoading}
                    className="text-[#9ca3af] transition hover:text-[#5c5e62] disabled:opacity-50"
                  >
                    <X size={15} strokeWidth={2} />
                  </button>
                </div>

                <p className="mb-3 text-[0.78rem] leading-relaxed text-[#5c5e62]">
                  Use this when the order shows a payment that has not arrived. It only
                  moves the order <strong>back</strong> — to record money that has come
                  in, use the buttons above. <strong>The customer is not e-mailed.</strong>
                </p>

                {correctableStages.length > 0 && (
                  <div className="mb-3">
                    <label htmlFor="corr-stage" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">
                      Put the order back to
                    </label>
                    <select
                      id="corr-stage"
                      value={corrStage}
                      onChange={(e) => setCorrStage(e.target.value as PaymentStage)}
                      className="h-9 rounded-lg border border-black/[0.1] bg-white px-3 text-[0.85rem] text-[#1a1a1a] outline-none transition focus:border-[#f4511e]/50 focus:ring-2 focus:ring-[#f4511e]/10"
                    >
                      {correctableStages.map((s) => (
                        <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[0.68rem] text-[#9ca3af]">
                      Payment dates for the steps being undone are cleared. E-mails already
                      sent stay on the record.
                    </p>
                  </div>
                )}

                {payStatus === "paid" && (
                  <label className="mb-3 flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={corrReset}
                      onChange={(e) => setCorrReset(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#f4511e]"
                    />
                    <span className="text-[0.8rem] text-[#1a1a1a]">
                      Also mark the payment as not yet received
                      <span className="mt-0.5 block text-[0.7rem] text-[#9ca3af]">
                        This order is flagged paid. Leave this ticked unless the money
                        really is in — it is the field the customer&apos;s portal reads.
                      </span>
                    </span>
                  </label>
                )}

                <div className="mb-3">
                  <label htmlFor="corr-reason" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">
                    Why <span className="font-normal text-[#9ca3af]">(required — goes on the order&apos;s record)</span>
                  </label>
                  <textarea
                    id="corr-reason"
                    value={corrReason}
                    onChange={(e) => setCorrReason(e.target.value.slice(0, 500))}
                    rows={2}
                    placeholder="e.g. Deposit has not arrived — this was never confirmed by anyone"
                    className="w-full resize-none rounded-lg border border-black/[0.1] bg-white px-3 py-2 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#f4511e]/50 focus:ring-2 focus:ring-[#f4511e]/10"
                  />
                  <p className="mt-1 text-right text-[0.66rem] tabular-nums text-[#c0c3c8]">{corrReason.length}/500</p>
                </div>

                {corrError && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[0.8rem] text-red-700">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    {corrError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCorrect}
                  disabled={corrLoading}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#1a1a1a] px-4 text-[0.78rem] font-semibold text-white transition hover:bg-black disabled:opacity-60"
                >
                  {corrLoading
                    ? <><Loader2 size={12} className="animate-spin" /> Correcting…</>
                    : <><Undo2 size={12} strokeWidth={2.2} /> Correct it</>
                  }
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mark Deposit Paid ── */}
      {modal === "deposit" && (
        <ConfirmModal
          title="Mark Deposit as Paid"
          body={split.depositAmount != null
            ? `Confirm that the deposit of ${formatMoney(split.depositAmount, currency)} has been received. The customer will be notified by email.`
            : "Confirm that the deposit has been received. The deposit / balance split will be calculated from the order total, and the customer will be notified by email."}
          noteLabel="Payment Reference"
          noteValue={note}
          onNoteChange={setNote}
          onConfirm={handleDepositPaid}
          onCancel={closeModal}
          loading={loading}
          error={error}
          confirmLabel="Confirm Deposit Received"
          confirmClass="bg-emerald-600 hover:bg-emerald-700"
        />
      )}

      {/* ── Mark Balance Due ── */}
      {modal === "balance_due" && (
        <ConfirmModal
          title="Mark Balance as Due"
          body={`Notify the system that the balance of ${formatMoney(split.balanceAmount, currency)} is now due. The customer will be sent a balance-due notification email.`}
          onConfirm={handleBalanceDue}
          onCancel={closeModal}
          loading={loading}
          error={error}
          confirmLabel="Mark Balance Due"
          confirmClass="bg-blue-600 hover:bg-blue-700"
        />
      )}

      {/* ── Mark Balance Paid ── */}
      {modal === "balance" && (
        <ConfirmModal
          title="Mark Balance as Paid"
          body={`Confirm that the balance payment of ${formatMoney(split.balanceAmount, currency)} has been received. The customer will be notified by email.`}
          noteLabel="Payment Reference"
          noteValue={note}
          onNoteChange={setNote}
          onConfirm={handleBalancePaid}
          onCancel={closeModal}
          loading={loading}
          error={error}
          confirmLabel="Confirm Balance Received"
          confirmClass="bg-emerald-600 hover:bg-emerald-700"
        />
      )}

      {/* ── Release Shipment ── */}
      {modal === "release" && (
        <ConfirmModal
          title="Release Shipment"
          body="All payments have been received. Confirm shipment release. The customer will receive a shipment-released notification."
          warning="This will unlock delivery note generation and signal the logistics team to proceed."
          noteLabel="Release Note"
          noteValue={note}
          onNoteChange={setNote}
          onConfirm={handleReleaseShipment}
          onCancel={closeModal}
          loading={loading}
          error={error}
          confirmLabel="Release Shipment"
          confirmClass="bg-[#f4511e] hover:bg-[#d04d15]"
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-[0.85rem] font-semibold text-white shadow-lg ${
            toast.variant === "success" ? "bg-emerald-600" : "bg-amber-600"
          }`}
        >
          {toast.variant === "success"
            ? <CheckCircle2 size={15} strokeWidth={2.5} />
            : <Mail size={15} strokeWidth={2} />
          }
          {toast.message}
        </div>
      )}
    </>
  );
}
