"use client";

import CopyButton from "./copy-button";
import { formatIncoterm } from "@/lib/utils";

type BankRow = { label: string; value: string; mono?: boolean; copy?: boolean; wide?: boolean };

const BASE_ROWS: BankRow[] = [
  { label: "Account Name",    value: "OKELCOR GMBH",                                            mono: true },
  { label: "Account Number",  value: "7609068",                                                  mono: true, copy: true },
  { label: "IBAN",            value: "BE74 9057 6090 6807",                                      mono: true, copy: true },
  { label: "BIC / SWIFT",     value: "TRWIBEB1XXX",                                              mono: true, copy: true },
  { label: "Bank",            value: "Wise" },
  { label: "Bank Address",    value: "Rue du Trône 100, 3rd Floor, 1050 Brussels, Belgium" },
  { label: "Payment Terms",   value: "50% against order confirmation and balance against bill of lading.", wide: true },
];


const TIMING = [
  { label: "SEPA transfers",        value: "1–2 working days" },
  { label: "International (SWIFT)", value: "4–5 working days" },
];

export default function BankTransferDetails({ orderRef, incoterm }: { orderRef?: string; incoterm?: string | null }) {
  const deliveryRow: BankRow = {
    label: "Delivery / Shipping Terms",
    value: formatIncoterm(incoterm),
    wide: true,
  };
  const ROWS = [...BASE_ROWS.slice(0, 6), deliveryRow, BASE_ROWS[BASE_ROWS.length - 1]];
  return (
    <div className="overflow-hidden rounded-[14px] border border-black/[0.07] bg-white">
      {/* Order Reference — prominent with copy */}
      {orderRef && (
        <div className="border-b border-[var(--primary)]/20 bg-[#fff8f5] px-4 py-3.5 sm:px-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
            Payment Reference / Order Ref
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="font-mono text-[1.05rem] font-extrabold tracking-widest text-[var(--foreground)]">
              {orderRef}
            </p>
            <CopyButton value={orderRef} />
          </div>
          <p className="mt-1 text-[0.72rem] text-[var(--muted)]">
            Include this reference in your transfer description.
          </p>
        </div>
      )}

      {/* Bank detail rows */}
      <div className="divide-y divide-black/[0.06]">
        {ROWS.map(({ label, value, mono, copy, wide }) => (
          <div key={label} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
            <p className="shrink-0 text-[0.77rem] text-[var(--muted)] sm:text-[0.8rem]">{label}</p>
            <div className={`flex min-w-0 items-center gap-2 ${wide ? "max-w-[210px] sm:max-w-[280px]" : ""}`}>
              <p className={`text-right text-[0.83rem] leading-snug sm:text-[0.86rem] ${
                mono
                  ? "font-mono font-bold tracking-wide text-[var(--foreground)]"
                  : "text-[var(--foreground)]"
              }`}>
                {value}
              </p>
              {copy && <CopyButton value={value} />}
            </div>
          </div>
        ))}
      </div>

      {/* Transfer timing */}
      <div className="border-t border-black/[0.06] bg-[#f9f9f9] px-4 py-3 sm:px-5">
        <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          Estimated Transfer Time
        </p>
        <div className="flex flex-col gap-1">
          {TIMING.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <p className="text-[0.77rem] text-[var(--muted)]">{label}</p>
              <p className="text-[0.77rem] font-semibold text-[var(--foreground)]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
