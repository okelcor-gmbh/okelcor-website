"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Search, Loader2, X, ExternalLink, Truck, UserX, ArrowLeft, ChevronLeft, ChevronRight,
} from "lucide-react";
import type {
  OperationsClient, OperationsClientDetail,
} from "@/lib/admin-api";
import { formatMoney } from "@/lib/currency";

/**
 * The list behind the board's Clients figure.
 *
 * `meta.total` here is guaranteed by a backend test to equal the board's
 * `clients` figure, so this page is the check on that number rather than a
 * second opinion about it — which is why nothing is filtered or counted on this
 * side beyond what was asked for in the query.
 */

const SORTS = [
  { value: "amount", label: "Spend" },
  { value: "orders", label: "Orders" },
  { value: "recent", label: "Most recent" },
  { value: "name",   label: "Name" },
] as const;

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .format(new Date(iso));
  } catch { return iso; }
}

// ── One client's orders ───────────────────────────────────────────────────────

function ClientDetail({
  email, from, to, channel, onClose,
}: {
  email: string; from: string; to: string; channel: string; onClose: () => void;
}) {
  const [detail, setDetail] = useState<OperationsClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notInPeriod, setNotInPeriod] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams({ email });
        if (from) p.set("from", from);
        if (to) p.set("to", to);
        if (channel && channel !== "all") p.set("channel", channel);
        const res = await fetch(`/api/admin/operations/clients/detail?${p}`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.status === 404 && json?.code === "no_orders_in_period") {
          // A real state, not an empty result: the client exists, just not in
          // this window. An empty table would say something different.
          setNotInPeriod(true);
          setDetail(null);
        } else if (!res.ok) {
          setError(json?.message ?? json?.error ?? "Could not load this client.");
        } else {
          setDetail((json?.data ?? null) as OperationsClientDetail | null);
          setNotInPeriod(false);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [email, from, to, channel]);

  const td = "px-3 py-2 text-[0.8rem] text-[#171a20]";
  const th = "px-3 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <div className="w-full max-w-3xl rounded-xl bg-white p-5">
        <div className="mb-3 flex items-start gap-2">
          <button
            type="button" onClick={onClose}
            className="rounded-lg p-1 text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20]"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h3 className="truncate text-[0.95rem] font-bold text-[#171a20]">
              {detail?.client.name || email}
            </h3>
            <p className="truncate font-mono text-[0.75rem] text-[#8c8f94]">{email}</p>
          </div>
          <button
            type="button" onClick={onClose}
            className="ml-auto rounded-lg p-1 text-[#8c8f94] transition hover:text-[#171a20]"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-10 text-[0.83rem] text-[#5c5e62]">
            <Loader2 size={14} className="animate-spin" /> Loading their orders…
          </div>
        ) : notInPeriod ? (
          <p className="rounded-xl bg-[#fafafa] px-3 py-3 text-[0.83rem] leading-snug text-[#5c5e62]">
            This client has no orders in the selected period. They exist — they just
            didn&apos;t order in this window. Widen the dates to see their history.
          </p>
        ) : error || !detail ? (
          <p className="rounded-xl bg-amber-50 px-3 py-3 text-[0.83rem] text-amber-900">
            {error ?? "No detail available."}
          </p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-black/[0.06] p-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#5c5e62]">Orders</p>
                <p className="mt-0.5 text-[1.15rem] font-bold tabular-nums text-[#171a20]">
                  {detail.totals.orders_count}
                </p>
              </div>
              <div className="rounded-xl border border-black/[0.06] p-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#5c5e62]">Amount</p>
                <p className="mt-0.5 text-[1.15rem] font-bold tabular-nums text-[#171a20]">
                  {formatMoney(detail.totals.amount, detail.totals.currency)}
                </p>
              </div>
              {/* The actionable figure: these are the orders needing documents. */}
              <div className={`rounded-xl border p-3 ${
                detail.totals.in_transit > 0 ? "border-[#f4511e]/30 bg-[#fff7f3]" : "border-black/[0.06]"
              }`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#5c5e62]">In transit</p>
                <p className="mt-0.5 text-[1.15rem] font-bold tabular-nums text-[#171a20]">
                  {detail.totals.in_transit}
                </p>
              </div>
            </div>

            {detail.totals.in_transit > 0 && (
              <p className="mb-3 flex items-start gap-1.5 rounded-xl bg-[#fff7f3] px-3 py-2 text-[0.78rem] leading-snug text-[#7c3a15]">
                <Truck size={13} className="mt-0.5 shrink-0" />
                {detail.totals.in_transit} of their orders{" "}
                {detail.totals.in_transit === 1 ? "is" : "are"} paid and dispatched — the ones
                most likely to need trade documents sent.
              </p>
            )}

            <div className="overflow-hidden rounded-xl border border-black/[0.06]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                    <th className={th}>Order</th>
                    <th className={th}>Channel</th>
                    <th className={th}>Status</th>
                    <th className={th}>Payment</th>
                    <th className={`${th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.orders.map((o) => (
                    <tr key={o.order_ref} className="border-b border-black/[0.04] last:border-0">
                      <td className={td}>
                        <span className="font-mono font-semibold">{o.order_ref}</span>
                        {o.in_transit && (
                          <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[#fff0e8] px-1.5 py-0.5 text-[0.62rem] font-bold text-[#7c3a15]">
                            <Truck size={8} /> in transit
                          </span>
                        )}
                      </td>
                      <td className={`${td} capitalize`}>{o.channel ?? "—"}</td>
                      <td className={`${td} capitalize`}>{o.status ?? "—"}</td>
                      <td className={`${td} capitalize`}>{o.payment_status ?? "—"}</td>
                      <td className={`${td} text-right tabular-nums`}>
                        {formatMoney(o.total, o.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── The list ──────────────────────────────────────────────────────────────────

export default function OperationsClients({
  from, to, channel,
}: {
  from: string; to: string; channel: string;
}) {
  const [rows, setRows] = useState<OperationsClient[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<string>("amount");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ per_page: "25", sort, page: String(page) });
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (channel && channel !== "all") p.set("channel", channel);
      if (query.trim()) p.set("q", query.trim());
      const res = await fetch(`/api/admin/operations/clients?${p}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUnavailable(json.message ?? json.error ?? "The clients list isn't available on this server yet.");
        setRows([]);
      } else {
        setUnavailable(null);
        setRows(Array.isArray(json.data) ? json.data : []);
        setMeta(json.meta ?? {});
      }
    } catch {
      setUnavailable("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [from, to, channel, sort, page, query]);

  useEffect(() => { void load(); }, [load]);

  const total = typeof meta.total === "number" ? meta.total : null;
  const lastPage = typeof meta.last_page === "number" ? meta.last_page : 1;
  const definition = typeof meta.definition === "string" ? meta.definition : null;

  const th = "px-3 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]";
  const td = "px-3 py-2.5 text-[0.8rem] text-[#171a20]";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(q); }}
          className="relative flex-1 min-w-[220px]"
        >
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8f94]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by e-mail, name or company…"
            className="h-9 w-full rounded-lg border border-black/[0.10] bg-white pl-8 pr-3 text-[0.83rem] focus:border-[#f4511e] focus:outline-none"
          />
        </form>

        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] focus:border-[#f4511e] focus:outline-none"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
        </select>
      </div>

      {definition && (
        <p className="text-[0.72rem] leading-snug text-[#8c8f94]">{definition}</p>
      )}

      {unavailable ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
          <p className="font-semibold">Not available on this server yet.</p>
          <p className="mt-0.5">{unavailable}</p>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-8 text-[0.83rem] text-[#5c5e62]">
          <Loader2 size={14} className="animate-spin" /> Loading clients…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-black/[0.06] bg-white p-8 text-center text-[0.83rem] text-[#8c8f94]">
          No clients in this period.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  <th className={th}>Client</th>
                  <th className={th}>Country</th>
                  <th className={`${th} text-right`}>Orders</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={th}>Channels</th>
                  <th className={th}>Last order</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.email} className="border-b border-black/[0.04] last:border-0 hover:bg-[#fafafa]">
                    <td className={td}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{c.name || c.company || c.email}</span>
                        {/*
                          No account is normal, not an error — plenty of confirmed
                          orders belong to buyers who never registered. Labelled
                          rather than left as a missing link, and no customer link
                          is rendered, because `customer_id` is null and the page
                          would 404.
                        */}
                        {c.has_account === false && (
                          <span
                            title="This buyer never registered an account. Their e-mail is the identity."
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.62rem] font-bold text-slate-600"
                          >
                            <UserX size={8} /> no account
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[0.7rem] text-[#8c8f94]">{c.email}</p>
                    </td>
                    <td className={td}>{c.country ?? "—"}</td>
                    <td className={`${td} text-right tabular-nums`}>{c.orders_count}</td>
                    <td className={`${td} text-right tabular-nums`}>
                      {formatMoney(c.amount, c.currency)}
                      {(c.other_currency_orders ?? 0) > 0 && (
                        <span
                          className="block text-[0.65rem] font-normal text-[#8c8f94]"
                          title="Orders booked in another currency are not converted into this figure."
                        >
                          +{c.other_currency_orders} in other currencies
                        </span>
                      )}
                    </td>
                    <td className={`${td} capitalize`}>{(c.channels ?? []).join(", ") || "—"}</td>
                    <td className={td}>{fmtDate(c.last_order_at)}</td>
                    <td className={`${td} text-right`}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setOpen(c.email)}
                          className="rounded-lg px-2 py-1 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20]"
                        >
                          Orders
                        </button>
                        {c.customer_id != null && (
                          <Link
                            href={`/admin/customers/${c.customer_id}`}
                            title="Open the customer record"
                            className="rounded-lg p-1.5 text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20]"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 border-t border-black/[0.06] px-3 py-2 text-[0.75rem] text-[#5c5e62]">
            <span className="tabular-nums">
              {total != null ? `${total} client${total === 1 ? "" : "s"}` : ""}
            </span>
            {lastPage > 1 && (
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg p-1 transition hover:bg-[#f0f2f5] disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="tabular-nums">{page} / {lastPage}</span>
                <button
                  type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg p-1 transition hover:bg-[#f0f2f5] disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {open && (
        <ClientDetail
          email={open} from={from} to={to} channel={channel}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
