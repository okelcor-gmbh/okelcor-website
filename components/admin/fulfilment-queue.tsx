import Link from "next/link";
import { FileText, Ship, ArrowRight } from "lucide-react";
import type { AdminOrder } from "@/lib/admin-api";
import { formatMoney } from "@/lib/currency";

/**
 * The fulfilment queue, in two sections.
 *
 * They are different jobs — *raise the paperwork and move the status* against
 * *this is on the water, chase the carrier* — and one list containing both gets
 * worked in the wrong order. Ready-to-ship comes first because it is the one
 * that was asked for: it is where the commercial invoice gets raised and the
 * status moved to shipped, and it is the half that used not to appear at all
 * until the order had already been dispatched.
 *
 * Deliberately lean. This is a work list, not a browsable index: no status or
 * payment filters, because `fulfilment_stage` is already defined in terms of
 * both and a second filter on top can only produce empty lists that look like
 * bugs. Search lives on the Orders page, which is where searching belongs.
 */

function age(iso?: string | null): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(days) || days < 0) return "—";
  if (days === 0) return "today";
  return `${days}d`;
}

function Section({
  title, hint, icon: Icon, accent, orders, total, emptyText,
}: {
  title: string;
  hint: string;
  icon: typeof FileText;
  accent: boolean;
  orders: AdminOrder[];
  total: number | null;
  emptyText: string;
}) {
  const th = "px-3 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]";
  const td = "px-3 py-2.5 text-[0.8rem] text-[#171a20]";

  return (
    <section className={`overflow-hidden rounded-2xl border bg-white ${
      accent ? "border-[#f4511e]/30" : "border-black/[0.06]"
    }`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] px-4 py-3">
        <Icon size={15} className={accent ? "text-[#f4511e]" : "text-[#5c5e62]"} />
        <h2 className="text-[0.9rem] font-bold text-[#171a20]">{title}</h2>
        {total != null && (
          <span className={`rounded-full px-2 py-0.5 text-[0.72rem] font-bold tabular-nums ${
            accent ? "bg-[#f4511e] text-white" : "bg-[#f0f2f5] text-[#5c5e62]"
          }`}>
            {total}
          </span>
        )}
        <p className="w-full text-[0.75rem] leading-snug text-[#8c8f94] sm:w-auto sm:flex-1">
          {hint}
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="px-4 py-8 text-center text-[0.83rem] text-[#8c8f94]">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                <th className={th}>Order</th>
                <th className={th}>Customer</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={`${th} text-right`}>Age</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-black/[0.04] last:border-0 hover:bg-[#fafafa]">
                  <td className={td}>
                    <span className="font-mono font-semibold">{o.order_ref}</span>
                    {o.channel === "ebay" && (
                      <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[0.62rem] font-bold text-green-700">
                        eBay
                      </span>
                    )}
                  </td>
                  <td className={td}>
                    <p className="font-semibold">{o.customer_name}</p>
                    <p className="text-[0.7rem] text-[#8c8f94]">{o.customer_email}</p>
                  </td>
                  <td className={`${td} capitalize`}>{o.status}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {formatMoney(o.total, o.currency)}
                  </td>
                  <td className={`${td} text-right tabular-nums text-[#5c5e62]`}>
                    {age(o.created_at)}
                  </td>
                  <td className={`${td} text-right`}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20]"
                    >
                      Open <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total != null && orders.length > 0 && total > orders.length && (
        <p className="border-t border-black/[0.06] px-4 py-2 text-[0.72rem] text-[#8c8f94]">
          Showing {orders.length} of {total}, newest first — the list endpoint has no other
          order. The longest-waiting orders are at the end.
        </p>
      )}
    </section>
  );
}

export default function FulfilmentQueue({
  readyToShip, readyTotal, inTransit, inTransitTotal,
}: {
  readyToShip: AdminOrder[];
  readyTotal: number | null;
  inTransit: AdminOrder[];
  inTransitTotal: number | null;
}) {
  return (
    <div className="space-y-5">
      <Section
        title="Ready to ship"
        hint="Paid and confirmed, not yet dispatched — raise the commercial invoice and move the status."
        icon={FileText}
        accent
        orders={readyToShip}
        total={readyTotal}
        emptyText="Nothing waiting on paperwork."
      />
      <Section
        title="In transit"
        hint="Dispatched and on the way — chase the carrier and keep tracking current."
        icon={Ship}
        accent={false}
        orders={inTransit}
        total={inTransitTotal}
        emptyText="Nothing on the water."
      />
    </div>
  );
}
