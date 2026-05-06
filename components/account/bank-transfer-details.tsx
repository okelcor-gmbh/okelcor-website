"use client";

import CopyButton from "./copy-button";

type BankRow = { label: string; value: string; mono?: boolean; copy?: boolean; wide?: boolean };

const ROWS: BankRow[] = [
  { label: "Delivery Term",  value: "CIF" },
  { label: "Payment Terms",  value: "50% against order confirmation and balance against bill of lading.", wide: true },
  { label: "Account Name",   value: "OKELCOR GMBH",           mono: true },
  { label: "IBAN",           value: "BE74 9057 6090 6807",     mono: true, copy: true },
  { label: "SWIFT / BIC",    value: "TRWIBEB1XXX",             mono: true, copy: true },
  { label: "Bank",           value: "Wise" },
  { label: "Bank Address",   value: "Rue du Trone 100, 3rd Floor, 1050 Brussels, Belgium" },
];

export default function BankTransferDetails({ orderRef }: { orderRef?: string }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-black/[0.07] bg-white">
      {orderRef && (
        <div className="border-b border-black/[0.07] bg-[#f9f9f9] px-4 py-3 sm:px-5">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Order Reference
          </p>
          <p className="mt-0.5 font-mono text-[0.95rem] font-extrabold tracking-wide text-[var(--foreground)]">
            {orderRef}
          </p>
        </div>
      )}
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
    </div>
  );
}
