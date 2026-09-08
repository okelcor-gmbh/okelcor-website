"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Info, ArrowRight } from "lucide-react";
import type {
  OperationsSummary, OperationsSummaryMeta, OperationsChannelRow,
} from "@/lib/admin-api";
import { formatMoney } from "@/lib/currency";

/**
 * The finance director's board: one row per sales channel, seven columns.
 *
 * Everything here is rendered as served. Nothing is summed, converted or
 * recomputed on this side — the three things most likely to be reported as
 * bugs are all deliberate, and each is labelled in place rather than left for
 * the reader to rediscover:
 *
 *  - `total.clients` is not the sum of the channel rows. One buyer who ordered
 *    on eBay and on the website is one client; adding the rows reports two.
 *  - `amount` is EUR only. Other currencies are listed, never converted — at
 *    today's rate a historic month's revenue would change on every open.
 *  - `invoice_variance` is the whole point of the two invoice columns. Two
 *    counts side by side without the difference is a mismatch sitting on
 *    screen looking like two facts.
 */

type Column = {
  key: keyof OperationsChannelRow;
  label: string;
  /** Definition key as served in `definitions`. */
  def: string;
};

const COLUMNS: Column[] = [
  { key: "orders_sent",      label: "Orders sent",      def: "orders_sent" },
  { key: "amount",           label: "Amount",           def: "amount" },
  { key: "clients",          label: "Clients",          def: "clients" },
  { key: "orders_confirmed", label: "Orders confirmed", def: "orders_confirmed" },
  { key: "website_invoices", label: "Our invoices",     def: "website_invoices" },
  { key: "finance_invoices", label: "Finance invoices", def: "finance_invoices" },
  // Session 87 split the fulfilment window in two. `in_transit` now covers the
  // whole of it and its count jumped on deploy — these two make the old figure
  // still readable, and `definitions` (rendered as tooltips) explains the new
  // meaning without a copy change here.
  { key: "ready_to_ship",    label: "Ready to ship",    def: "ready_to_ship" },
  { key: "shipped",          label: "Shipped",          def: "shipped" },
  { key: "in_transit",       label: "In transit",       def: "in_transit" },
];

function OtherCurrencies({ row }: { row: OperationsChannelRow }) {
  const others = row.amount_other_currencies ?? [];
  if (others.length === 0) return null;
  return (
    <span className="mt-0.5 block text-[0.68rem] font-normal text-[#8c8f94]">
      {others.map((o) => `+ ${formatMoney(o.amount, o.currency)}`).join(" · ")}
    </span>
  );
}

function Cell({
  row, col, financeAvailable, clientsHref,
}: {
  row: OperationsChannelRow;
  col: Column;
  financeAvailable: boolean;
  clientsHref: string;
}) {
  // A structural zero is not a real one. "0 invoices raised" and "we are not
  // recording them yet" are different statements, and the first is the one
  // that starts an argument between two departments.
  if (col.key === "finance_invoices" && !financeAvailable) {
    return (
      <td className="px-3 py-2.5 text-right text-[0.78rem] italic text-[#8c8f94]">
        not switched on yet
      </td>
    );
  }

  // The figure opens. It was the ask, and it is also the only way anyone can
  // check the number without asking a developer to run a query — which is
  // exactly the position two departments arguing over a board should not be in.
  if (col.key === "clients") {
    return (
      <td className="px-3 py-2.5 text-right">
        <Link
          href={`${clientsHref}&channel=${row.channel}`}
          className="rounded px-1 text-[0.83rem] font-semibold tabular-nums text-[#171a20] underline decoration-[#f4511e]/40 decoration-2 underline-offset-4 transition hover:decoration-[#f4511e]"
        >
          {row.clients ?? 0}
        </Link>
      </td>
    );
  }

  if (col.key === "ready_to_ship" && (row.ready_to_ship ?? 0) > 0) {
    return (
      <td className="px-3 py-2.5 text-right">
        <Link
          href="/admin/orders/in-transit"
          title="Paid and confirmed, not yet dispatched — the paperwork queue."
          className="rounded px-1 text-[0.83rem] font-semibold tabular-nums text-[#171a20] underline decoration-[#f4511e]/40 decoration-2 underline-offset-4 transition hover:decoration-[#f4511e]"
        >
          {row.ready_to_ship}
        </Link>
      </td>
    );
  }

  if (col.key === "amount") {
    return (
      <td className="px-3 py-2.5 text-right text-[0.83rem] tabular-nums text-[#171a20]">
        {formatMoney(row.amount, row.currency)}
        <OtherCurrencies row={row} />
      </td>
    );
  }

  return (
    <td className="px-3 py-2.5 text-right text-[0.83rem] tabular-nums text-[#171a20]">
      {String(row[col.key] ?? 0)}
    </td>
  );
}

function VarianceCell({
  row, financeAvailable, reconcileHref,
}: {
  row: OperationsChannelRow;
  financeAvailable: boolean;
  reconcileHref: string;
}) {
  if (!financeAvailable) {
    return <td className="px-3 py-2.5 text-right text-[0.78rem] text-[#8c8f94]">—</td>;
  }

  const v = row.invoice_variance ?? 0;

  if (v === 0) {
    return (
      <td className="px-3 py-2.5 text-right text-[0.83rem] tabular-nums text-[#5c5e62]">0</td>
    );
  }

  // Non-zero is the finding. It carries a word as well as a colour, and links
  // through to the reconciliation that names both sides.
  return (
    <td className="px-3 py-2.5 text-right">
      <Link
        href={`${reconcileHref}&channel=${row.channel}`}
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.78rem] font-bold tabular-nums text-amber-900 transition hover:bg-amber-200"
      >
        <AlertTriangle size={11} />
        {v > 0 ? `+${v}` : v}
        <ArrowRight size={11} />
      </Link>
    </td>
  );
}

export default function OperationsBoard({
  summary,
  meta,
}: {
  summary: OperationsSummary;
  meta: OperationsSummaryMeta;
}) {
  const [showDefs, setShowDefs] = useState(false);

  const financeAvailable = meta.finance_recording_available !== false;
  const defs = summary.definitions ?? {};
  const period = summary.period;
  const reconcileHref =
    `/admin/finance-invoices?tab=reconciliation&from=${period?.from ?? ""}&to=${period?.to ?? ""}`;
  const clientsHref =
    `/admin/operations/clients?from=${period?.from ?? ""}&to=${period?.to ?? ""}`;

  const rows = summary.channels ?? [];
  const anyOtherCurrency = [...rows, summary.total].some(
    (r) => (r?.amount_other_currencies?.length ?? 0) > 0,
  );

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                <th className="px-3 py-2.5 text-left text-[0.72rem] font-bold uppercase tracking-wider text-[#5c5e62]">
                  Channel
                </th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    // Served verbatim. Seven figures two departments will argue
                    // over are worthless if a column means something different
                    // to the reader than to the query that produced it.
                    title={defs[c.def] ?? undefined}
                    className="px-3 py-2.5 text-right text-[0.72rem] font-bold uppercase tracking-wider text-[#5c5e62]"
                  >
                    {c.label}
                    {defs[c.def] && <Info size={9} className="ml-1 inline align-super text-[#b0b3b8]" />}
                  </th>
                ))}
                <th
                  title={defs.invoice_variance ?? undefined}
                  className="px-3 py-2.5 text-right text-[0.72rem] font-bold uppercase tracking-wider text-[#5c5e62]"
                >
                  Variance
                  {defs.invoice_variance && <Info size={9} className="ml-1 inline align-super text-[#b0b3b8]" />}
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.channel} className="border-b border-black/[0.04] last:border-0">
                  <td className="px-3 py-2.5 text-[0.83rem] font-semibold text-[#171a20]">
                    {row.label}
                  </td>
                  {COLUMNS.map((c) => (
                    <Cell
                      key={c.key} row={row} col={c}
                      financeAvailable={financeAvailable} clientsHref={clientsHref}
                    />
                  ))}
                  <VarianceCell
                    row={row}
                    financeAvailable={financeAvailable}
                    reconcileHref={reconcileHref}
                  />
                </tr>
              ))}

              {summary.total && (
                <tr className="border-t-2 border-black/[0.08] bg-[#fafafa]">
                  <td className="px-3 py-2.5 text-[0.83rem] font-bold text-[#171a20]">
                    {summary.total.label}
                  </td>
                  {COLUMNS.map((c) => (
                    <Cell
                      key={c.key}
                      row={summary.total}
                      col={c}
                      financeAvailable={financeAvailable}
                      clientsHref={clientsHref}
                    />
                  ))}
                  <VarianceCell
                    row={summary.total}
                    financeAvailable={financeAvailable}
                    reconcileHref={reconcileHref}
                  />
                </tr>
              )}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 2} className="px-3 py-10 text-center text-[0.83rem] text-[#8c8f94]">
                    No orders in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* The two "this looks wrong but isn't" notes, stated where they arise. */}
      <div className="space-y-1 text-[0.72rem] leading-relaxed text-[#8c8f94]">
        <p>
          <strong className="font-semibold text-[#5c5e62]">All channels</strong> counts clients
          once. A buyer who ordered on both the website and eBay is one client, so this row is
          not the sum of the rows above it. Any client figure opens the list behind it.
        </p>
        {anyOtherCurrency && (
          <p>
            Amounts are <strong className="font-semibold text-[#5c5e62]">EUR only</strong>. Orders
            booked in another currency are listed beneath the figure and are not converted — a
            rate applied today would change a past month&apos;s total every time this page is
            opened.
          </p>
        )}
        {!financeAvailable && (
          <p>
            Finance invoice recording is not switched on yet, so that column and the variance are
            blank rather than zero.
          </p>
        )}
      </div>

      {Object.keys(defs).length > 0 && (
        <div className="rounded-2xl border border-black/[0.06] bg-white">
          <button
            type="button"
            onClick={() => setShowDefs((v) => !v)}
            className="flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-[0.78rem] font-semibold text-[#5c5e62] transition hover:text-[#171a20]"
          >
            <Info size={13} />
            What these columns mean
            <span className="ml-auto text-[#8c8f94]">{showDefs ? "Hide" : "Show"}</span>
          </button>
          {showDefs && (
            <dl className="space-y-2 border-t border-black/[0.06] px-4 py-3">
              {Object.entries(defs).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[0.75rem] font-bold text-[#171a20]">
                    {COLUMNS.find((c) => c.def === k)?.label ??
                      k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </dt>
                  {/* Verbatim — these strings are the agreement between the two
                      departments reading the board. Paraphrasing them here would
                      reintroduce exactly the ambiguity they were written to end. */}
                  <dd className="text-[0.75rem] leading-snug text-[#5c5e62]">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
