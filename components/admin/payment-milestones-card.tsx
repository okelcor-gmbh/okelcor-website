"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle, AlertTriangle, CheckCircle2,
  Loader2, Mail, MailCheck, MailX, RotateCcw,
} from "lucide-react";
import { canDo } from "@/lib/admin-permissions";

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

function eur(amount?: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-DE", { style: "currency", currency: "EUR" }).format(amount);
}

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
              className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A]/40 focus:ring-2 focus:ring-[#E85C1A]/10"
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
  initialStage,
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
}: {
  orderId: number;
  adminRole: string;
  initialStage: PaymentStage;
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
}) {
  const [stage,       setStage]       = useState<PaymentStage>(initialStage);
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

  // Modal states
  const [modal,   setModal]   = useState<"deposit" | "balance_due" | "balance" | "release" | null>(null);
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "warning" } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const canMarkPaid = canDo(adminRole, "payments.mark_paid");
  const canRelease  = canDo(adminRole, "payments.release_shipment");
  const stageIdx    = STAGE_INDEX[stage];

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
      const res  = await fetch(`/api/admin/orders/${orderId}/payments/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({})) as {
        message?: string;
        data?: {
          payment_stage?: PaymentStage;
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

  async function handleDepositPaid() {
    const { ok, emailSent: es } = await callAction("mark-deposit-paid", note ? { note } : undefined);
    if (ok) { setStage("deposit_paid"); setDepPaidAt(new Date().toISOString()); closeModal(); showActionToast(es); }
  }

  async function handleBalanceDue() {
    const { ok, emailSent: es } = await callAction("mark-balance-due");
    if (ok) { setStage("balance_due"); closeModal(); showActionToast(es); }
  }

  async function handleBalancePaid() {
    const { ok, emailSent: es } = await callAction("mark-balance-paid", note ? { note } : undefined);
    if (ok) { setStage("balance_paid"); setBalPaidAt(new Date().toISOString()); closeModal(); showActionToast(es); }
  }

  async function handleReleaseShipment() {
    const { ok, emailSent: es } = await callAction("release-shipment", note ? { note } : undefined);
    if (ok) { setStage("shipment_released"); setReleasedAt(new Date().toISOString()); setReleaseNote(note); closeModal(); showActionToast(es); }
  }

  async function handleResendEmail(targetStage: PaymentStage) {
    setResendLoading(targetStage);
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}/payments/resend-milestone-email`, {
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
      sub: depositAmount != null
        ? `${depositPercent ?? 50}% · ${eur(depositAmount)}`
        : depositPercent != null ? `${depositPercent}%` : undefined,
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
      sub: balanceAmount != null ? eur(balanceAmount) : undefined,
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
        show: stageIdx === STAGE_INDEX.balance_due && canMarkPaid,
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
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Payment Milestones
          </p>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${STAGE_BADGE[stage]}`}>
            {STAGE_LABEL[stage]}
          </span>
        </div>

        {stage === "pending_proforma" ? (
          <p className="text-[0.875rem] text-[#5c5e62]">
            Generate the proforma invoice to begin milestone payment tracking.
          </p>
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
                              : isCurr ? "border-[#E85C1A] bg-[#E85C1A]"
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

                      {/* ── Email status (DOC-8) — only for reached milestones ── */}
                      {reached && (
                        sentAt ? (
                          <p className="mt-1 flex items-center gap-1 text-[0.7rem] text-emerald-600">
                            <MailCheck size={11} strokeWidth={2} />
                            Email sent {shortDate(sentAt)}
                          </p>
                        ) : (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[0.7rem] text-amber-600">
                              <MailX size={11} strokeWidth={2} />
                              Email not sent
                            </span>
                            <button
                              type="button"
                              onClick={() => handleResendEmail(step.id)}
                              disabled={resendLoading === step.id}
                              title={`Resend ${STAGE_LABEL[step.id]} notification`}
                              className="inline-flex h-5 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 text-[0.68rem] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                            >
                              {resendLoading === step.id
                                ? <Loader2 size={9} className="animate-spin" />
                                : <RotateCcw size={9} strokeWidth={2.5} />
                              }
                              {resendLoading === step.id ? "…" : "Resend"}
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
                        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-[#E85C1A] px-3 text-[0.73rem] font-semibold text-white transition hover:bg-[#d04d15]"
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
      </div>

      {/* ── Mark Deposit Paid ── */}
      {modal === "deposit" && (
        <ConfirmModal
          title="Mark Deposit as Paid"
          body={`Confirm that the deposit of ${eur(depositAmount)} has been received. The customer will be notified by email.`}
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
          body={`Notify the system that the balance of ${eur(balanceAmount)} is now due. The customer will be sent a balance-due notification email.`}
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
          body={`Confirm that the balance payment of ${eur(balanceAmount)} has been received. The customer will be notified by email.`}
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
          confirmClass="bg-[#E85C1A] hover:bg-[#d04d15]"
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
