"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Package, Truck } from "lucide-react";
import { canDo } from "@/lib/admin-permissions";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStage =
  | "pending_proforma"
  | "deposit_requested"
  | "deposit_paid"
  | "balance_due"
  | "balance_paid"
  | "shipment_released";

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
            {loading ? <span className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" /> Working…</span> : confirmLabel}
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
}) {
  const [stage,       setStage]       = useState<PaymentStage>(initialStage);
  const [depPaidAt,   setDepPaidAt]   = useState(depositPaidAt);
  const [balPaidAt,   setBalPaidAt]   = useState(balancePaidAt);
  const [releasedAt,  setReleasedAt]  = useState(shipmentReleasedAt);
  const [releaseNote, setReleaseNote] = useState(initialReleaseNote ?? "");

  // Modal states
  const [modal,   setModal]   = useState<"deposit" | "balance_due" | "balance" | "release" | null>(null);
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const canMarkPaid   = canDo(adminRole, "payments.mark_paid");
  const canRelease    = canDo(adminRole, "payments.release_shipment");
  const stageIdx      = STAGE_INDEX[stage];

  const closeModal = () => { setModal(null); setNote(""); setError(null); };

  async function callAction(endpoint: string, body?: object) {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}/payments/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({})) as { message?: string; data?: { payment_stage?: PaymentStage; deposit_paid_at?: string; balance_paid_at?: string; shipment_released_at?: string } };
      if (!res.ok) {
        setError(json.message ?? "Action failed. Please try again.");
        return false;
      }
      // Update local state from response if backend echoes fields
      if (json.data?.payment_stage) setStage(json.data.payment_stage);
      if (json.data?.deposit_paid_at) setDepPaidAt(json.data.deposit_paid_at);
      if (json.data?.balance_paid_at) setBalPaidAt(json.data.balance_paid_at);
      if (json.data?.shipment_released_at) setReleasedAt(json.data.shipment_released_at);
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleDepositPaid() {
    const ok = await callAction("mark-deposit-paid", note ? { note } : undefined);
    if (ok) { setStage("deposit_paid"); setDepPaidAt(new Date().toISOString()); closeModal(); }
  }

  async function handleBalanceDue() {
    const ok = await callAction("mark-balance-due");
    if (ok) { setStage("balance_due"); closeModal(); }
  }

  async function handleBalancePaid() {
    const ok = await callAction("mark-balance-paid", note ? { note } : undefined);
    if (ok) { setStage("balance_paid"); setBalPaidAt(new Date().toISOString()); closeModal(); }
  }

  async function handleReleaseShipment() {
    const ok = await callAction("release-shipment", note ? { note } : undefined);
    if (ok) { setStage("shipment_released"); setReleasedAt(new Date().toISOString()); setReleaseNote(note); closeModal(); }
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
              const idx      = STAGE_INDEX[step.id];
              const isDone   = stageIdx > idx;
              const isCurr   = stageIdx === idx;
              const isLast   = i === steps.length - 1;

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
          body={`Confirm that the deposit of ${eur(depositAmount)} has been received.`}
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
          body={`Notify the system that the balance of ${eur(balanceAmount)} is now due from the customer.`}
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
          body={`Confirm that the balance payment of ${eur(balanceAmount)} has been received.`}
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
          body="All payments have been received. Confirm shipment release to proceed with logistics."
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
    </>
  );
}
