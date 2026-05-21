"use client";

import { CheckCircle2, Clock, CircleDot } from "lucide-react";

// ── Types & constants ─────────────────────────────────────────────────────────

type PaymentStage =
  | "pending_proforma"
  | "deposit_requested"
  | "deposit_paid"
  | "balance_due"
  | "balance_paid"
  | "shipment_released";

type Step = {
  key: PaymentStage;
  label: string;
  sublabel: string;
};

const STEPS: Step[] = [
  { key: "deposit_requested", label: "Deposit Requested",  sublabel: "Deposit invoice issued"   },
  { key: "deposit_paid",      label: "Deposit Confirmed",  sublabel: "Deposit payment received"  },
  { key: "balance_due",       label: "Balance Due",        sublabel: "Final balance invoice sent" },
  { key: "balance_paid",      label: "Balance Confirmed",  sublabel: "Full payment received"      },
  { key: "shipment_released", label: "Shipment Released",  sublabel: "Goods cleared for dispatch" },
];

const STAGE_INDEX: Record<string, number> = {
  pending_proforma:   -1,
  deposit_requested:   0,
  deposit_paid:        1,
  balance_due:         2,
  balance_paid:        3,
  shipment_released:   4,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return "";
  return `€${Number(n).toLocaleString("en-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function shortDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  paymentStage: string;
  depositAmount?: number | null;
  balanceAmount?: number | null;
  depositPaidAt?: string | null;
  balancePaidAt?: string | null;
  shipmentReleasedAt?: string | null;
};

export default function PaymentMilestoneProgress({
  paymentStage,
  depositAmount,
  balanceAmount,
  depositPaidAt,
  balancePaidAt,
  shipmentReleasedAt,
}: Props) {
  const currentIdx = STAGE_INDEX[paymentStage] ?? -1;

  // Extra notes to show under specific steps
  const stepDetails: Partial<Record<PaymentStage, string>> = {};
  if (depositAmount) {
    stepDetails["deposit_requested"] = fmt(depositAmount);
    stepDetails["deposit_paid"] = depositPaidAt ? `Paid ${shortDate(depositPaidAt)} · ${fmt(depositAmount)}` : fmt(depositAmount);
  }
  if (balanceAmount) {
    stepDetails["balance_due"] = fmt(balanceAmount);
    stepDetails["balance_paid"] = balancePaidAt ? `Paid ${shortDate(balancePaidAt)} · ${fmt(balanceAmount)}` : fmt(balanceAmount);
  }
  if (shipmentReleasedAt) {
    stepDetails["shipment_released"] = shortDate(shipmentReleasedAt);
  }

  return (
    <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
      <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
        Payment Progress
      </p>

      <ol className="relative flex flex-col gap-0">
        {STEPS.map((step, i) => {
          const stepIdx   = i;
          const isDone    = stepIdx < currentIdx;
          const isCurrent = stepIdx === currentIdx;
          const isPending = stepIdx > currentIdx;
          const isLast    = i === STEPS.length - 1;
          const detail    = stepDetails[step.key];

          return (
            <li key={step.key} className="flex items-stretch gap-4">
              {/* Left: icon + vertical connector */}
              <div className="flex flex-col items-center">
                <div className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  isDone    ? "bg-emerald-500 text-white" :
                  isCurrent ? "bg-[var(--primary)] text-white" :
                              "bg-white border border-black/10 text-[var(--muted)]",
                ].join(" ")}>
                  {isDone
                    ? <CheckCircle2 size={15} strokeWidth={2.5} />
                    : isCurrent
                    ? <CircleDot size={15} strokeWidth={2.2} />
                    : <Clock size={14} strokeWidth={1.8} />
                  }
                </div>
                {!isLast && (
                  <div className={`my-1 w-[2px] flex-1 min-h-[20px] transition-colors ${isDone ? "bg-emerald-400" : "bg-black/10"}`} />
                )}
              </div>

              {/* Right: text */}
              <div className={`pb-5 pt-1 ${isLast ? "pb-0" : ""}`}>
                <p className={[
                  "text-[0.88rem] font-semibold leading-tight",
                  isDone    ? "text-emerald-700" :
                  isCurrent ? "text-[var(--primary)]" :
                              "text-[var(--muted)]",
                ].join(" ")}>
                  {step.label}
                </p>
                <p className="mt-0.5 text-[0.75rem] text-[var(--muted)]">
                  {step.sublabel}
                </p>
                {detail && (
                  <p className={`mt-0.5 text-[0.75rem] font-medium ${isDone ? "text-emerald-600" : isCurrent ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>
                    {detail}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
