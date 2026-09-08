"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, Download, FileText, Loader2, ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import type { ProfitabilityDashboard, ProfitabilityRow } from "@/lib/admin-api";
import { formatMoney } from "@/lib/currency";
import { canDo } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { SERIES, CHART_INK } from "@/lib/behaviour-analytics";

/**
 * Profit per order: the finalized revenue invoice minus supplier invoices and
 * fees, computed server-side in ONE service — this panel renders figures, it
 * never re-derives them. The export is the document finance signs, so the
 * verified column travels everywhere the number does.
 */

type Tab = "orders" | "dashboard";

const TH = "px-3 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]";
const TD = "px-3 py-2 text-[0.8rem] text-[#171a20]";

const chip = (active: boolean) =>
  `rounded-full px-3 py-1 text-[0.75rem] font-semibold transition ${
    active ? "bg-[#171a20] text-white" : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]"
  }`;

function profitClass(profit?: number | null): string {
  if (profit == null) return "text-[#8c8f94]";
  return profit >= 0 ? "text-emerald-700" : "text-red-600";
}

export default function ProfitabilityPanel({
  initialTab, from, to, channel,
}: {
  initialTab: Tab;
  from: string;
  to: string;
  channel: string;
}) {
  const { role, permissions } = useAdminPermissions();
  const canExport = canDo(role ?? "", "orders.export", permissions);

  const [tab, setTab] = useState<Tab>(initialTab);

  // ── Orders tab state ──────────────────────────────────────────────────────
  const [rows, setRows] = useState<ProfitabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [verified, setVerified] = useState<string>("all");
  const [hasRevenue, setHasRevenue] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ per_page: "50", page: String(page) });
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (channel && channel !== "all") p.set("channel", channel);
      if (verified !== "all") p.set("verified", verified);
      if (hasRevenue !== "all") p.set("has_revenue", hasRevenue);
      const res = await fetch(`/api/admin/finance/profitability?${p}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.meta?.profitability_available === false) {
        setUnavailable(json.message ?? json.error ?? "Profitability isn't available on this server yet.");
        setRows([]);
      } else {
        setUnavailable(null);
        setRows(Array.isArray(json.data) ? json.data : []);
        setLastPage(Number(json?.meta?.last_page ?? 1));
        setTotal(Number(json?.meta?.total ?? 0));
      }
    } catch {
      setUnavailable("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [from, to, channel, verified, hasRevenue, page]);

  useEffect(() => { void load(); }, [load]);
  // Filters changing must not strand the reader on a page that no longer exists.
  useEffect(() => { setPage(1); }, [from, to, channel, verified, hasRevenue]);

  const exportHref = (() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (channel && channel !== "all") p.set("channel", channel);
    if (verified !== "all") p.set("verified", verified);
    if (hasRevenue !== "all") p.set("has_revenue", hasRevenue);
    const q = p.toString();
    return `/api/admin/finance/profitability/export${q ? `?${q}` : ""}`;
  })();

  const tabBtn = (t: Tab) =>
    `rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition ${
      tab === t ? "bg-[#171a20] text-white" : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setTab("orders")} className={tabBtn("orders")}>
          Orders
        </button>
        <button type="button" onClick={() => setTab("dashboard")} className={tabBtn("dashboard")}>
          Dashboard
        </button>
        {canExport && !unavailable && (
          <a
            href={exportHref}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-[#171a20] px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition hover:bg-black"
          >
            <Download size={13} /> Export CSV
          </a>
        )}
      </div>

      {tab === "dashboard" ? (
        <Dashboard />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#8c8f94]">Verified</span>
              {(["all", "no", "yes"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setVerified(v)} className={chip(verified === v)}>
                  {v === "all" ? "All" : v === "yes" ? "Signed off" : "Needs sign-off"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#8c8f94]">Revenue invoice</span>
              {(["all", "yes", "no"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setHasRevenue(v)} className={chip(hasRevenue === v)}>
                  {v === "all" ? "All" : v === "yes" ? "Recorded" : "Missing"}
                </button>
              ))}
            </div>
          </div>

          {unavailable ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
              <p className="font-semibold">Not available on this server yet.</p>
              <p className="mt-0.5">{unavailable}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-8 text-[0.83rem] text-[#5c5e62]">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-black/[0.06] bg-white p-8 text-center text-[0.83rem] text-[#8c8f94]">
              {verified !== "all" || hasRevenue !== "all"
                ? "Nothing matches these filters in this period."
                : "No confirmed orders in this period."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                      <th className={TH}>Order</th>
                      <th className={TH}>Date</th>
                      <th className={TH}>Customer</th>
                      <th className={TH}>Order total</th>
                      <th className={TH}>Revenue invoice</th>
                      <th className={TH}>Suppliers</th>
                      <th className={TH}>Fees</th>
                      <th className={TH}>Profit</th>
                      <th className={TH}>Margin</th>
                      <th className={TH}>Sign-off</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.order_id} className="border-b border-black/[0.04] last:border-0 hover:bg-[#fafafa]">
                        <td className={TD}>
                          <Link href={`/admin/orders/${r.order_id}`} className="font-semibold text-[#171a20] underline-offset-2 hover:underline">
                            {r.order_ref}
                          </Link>
                          {r.channel === "ebay" && (
                            <span className="ml-1.5 rounded bg-[#f0f2f5] px-1.5 py-0.5 text-[0.62rem] font-bold uppercase text-[#5c5e62]">eBay</span>
                          )}
                        </td>
                        <td className={`${TD} whitespace-nowrap text-[#5c5e62]`}>{r.order_date ?? "—"}</td>
                        <td className={TD}>{r.customer_name ?? "—"}</td>
                        <td className={`${TD} tabular-nums`}>{formatMoney(r.order_total, r.order_currency)}</td>
                        <td className={`${TD} tabular-nums`}>
                          {r.revenue_amount == null ? (
                            <span className="text-[#8c8f94]">not recorded</span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              {formatMoney(r.revenue_amount, r.currency)}
                              {r.revenue_has_file && <FileText size={11} className="text-[#8c8f94]" aria-label="PDF attached" />}
                            </span>
                          )}
                        </td>
                        <td className={`${TD} tabular-nums`}>{formatMoney(r.supplier_costs, r.currency)}</td>
                        <td className={`${TD} tabular-nums`}>{formatMoney(r.fees, r.currency)}</td>
                        <td className={`${TD} tabular-nums font-semibold ${profitClass(r.profit)}`}>
                          {r.profit == null ? "—" : formatMoney(r.profit, r.currency)}
                          {r.mixed_currency && (
                            <span className="ml-1 text-[0.65rem] font-normal text-amber-600" title="Costs in another currency are excluded, never converted.">
                              mixed ccy
                            </span>
                          )}
                        </td>
                        <td className={`${TD} tabular-nums`}>{r.margin_percent == null ? "—" : `${r.margin_percent}%`}</td>
                        <td className={TD}>
                          {r.verified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700" title={r.verified_by ? `${r.verified_by} · ${r.verified_at ?? ""}` : undefined}>
                              <ShieldCheck size={13} /> {r.verified_by ?? "verified"}
                            </span>
                          ) : (
                            <span className="text-[#8c8f94]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {lastPage > 1 && (
                <div className="flex items-center justify-between border-t border-black/[0.06] px-3 py-2 text-[0.75rem] text-[#5c5e62]">
                  <span>{total} orders</span>
                  <span className="flex items-center gap-2">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                      className="rounded-full bg-[#f0f2f5] px-3 py-1 font-semibold disabled:opacity-40">Prev</button>
                    <span className="tabular-nums">{page} / {lastPage}</span>
                    <button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}
                      className="rounded-full bg-[#f0f2f5] px-3 py-1 font-semibold disabled:opacity-40">Next</button>
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────

function Dashboard() {
  const [data, setData] = useState<ProfitabilityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/finance/profitability/dashboard");
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || json?.meta?.profitability_available === false || !json.data) {
          setUnavailable(json.message ?? json.error ?? "Profitability isn't available on this server yet.");
        } else {
          setData(json.data as ProfitabilityDashboard);
        }
      } catch {
        if (!cancelled) setUnavailable("Could not reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-8 text-[0.83rem] text-[#5c5e62]">
        <Loader2 size={14} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (unavailable || !data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
        <p className="font-semibold">Not available on this server yet.</p>
        <p className="mt-0.5">{unavailable}</p>
      </div>
    );
  }

  const t = data.totals;
  const chartRows = data.months.map((m) => ({
    label: m.label.split(" ")[0],
    Revenue: m.revenue_eur,
    Profit: m.profit_eur,
  }));

  const tile = "rounded-xl border border-black/[0.06] bg-white p-4";
  const tileLabel = "text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]";
  const tileValue = "mt-1 text-[1.25rem] font-bold tabular-nums text-[#171a20]";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className={tile}>
          <p className={tileLabel}>Revenue invoiced</p>
          <p className={tileValue}>{formatMoney(t.revenue_eur, "EUR")}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>Costs</p>
          <p className={tileValue}>{formatMoney(t.costs_eur, "EUR")}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>Profit</p>
          <p className={`${tileValue} ${profitClass(t.profit_eur)}`}>{formatMoney(t.profit_eur, "EUR")}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>Margin</p>
          <p className={tileValue}>{t.margin_percent == null ? "—" : `${t.margin_percent}%`}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>Signed off</p>
          <p className={tileValue}>{t.verified} / {t.orders_with_revenue}</p>
        </div>
      </div>

      <div className="rounded-xl border border-black/[0.06] bg-white p-4">
        <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-wider text-[#5c5e62]">
          Revenue vs profit, {data.year} (EUR)
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART_INK.label }} stroke={CHART_INK.axis} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: CHART_INK.label }} stroke={CHART_INK.axis} tickLine={false} width={70} />
              <Tooltip formatter={(v) => formatMoney(Number(v), "EUR")} />
              <Line type="linear" dataKey="Revenue" stroke={SERIES.searches} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="Profit" stroke={SERIES.empty} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                <th className={TH}>Month</th>
                <th className={TH}>Orders</th>
                <th className={TH} title={data.definitions.revenue}>Revenue</th>
                <th className={TH} title={data.definitions.supplier_costs}>Suppliers</th>
                <th className={TH} title={data.definitions.fees}>Fees</th>
                <th className={TH} title={data.definitions.profit}>Profit</th>
                <th className={TH} title={data.definitions.margin_percent}>Margin</th>
                <th className={TH} title={data.definitions.verified}>Signed off</th>
              </tr>
            </thead>
            <tbody>
              {data.months.map((m) => (
                <tr key={m.key} className="border-b border-black/[0.04] last:border-0">
                  <td className={`${TD} font-semibold`}>{m.label}</td>
                  <td className={`${TD} tabular-nums`}>
                    {m.orders}
                    {m.non_eur_orders > 0 && (
                      <span className="ml-1 text-[0.65rem] text-amber-600" title={data.definitions.eur_only}>
                        +{m.non_eur_orders} non-EUR
                      </span>
                    )}
                  </td>
                  <td className={`${TD} tabular-nums`}>{formatMoney(m.revenue_eur, "EUR")}</td>
                  <td className={`${TD} tabular-nums`}>{formatMoney(m.supplier_costs_eur, "EUR")}</td>
                  <td className={`${TD} tabular-nums`}>{formatMoney(m.fees_eur, "EUR")}</td>
                  <td className={`${TD} tabular-nums font-semibold ${profitClass(m.profit_eur)}`}>{formatMoney(m.profit_eur, "EUR")}</td>
                  <td className={`${TD} tabular-nums`}>{m.margin_percent == null ? "—" : `${m.margin_percent}%`}</td>
                  <td className={`${TD} tabular-nums`}>
                    {m.orders_with_revenue > 0 ? (
                      <span className={m.verified === m.orders_with_revenue ? "text-emerald-700" : ""}>
                        {m.verified === m.orders_with_revenue && <CheckCircle2 size={12} className="mr-1 inline" />}
                        {m.verified} / {m.orders_with_revenue}
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-black/[0.06] px-3 py-2 text-[0.72rem] text-[#8c8f94]">
          {data.definitions.buckets} {data.definitions.eur_only}
        </p>
      </div>
    </div>
  );
}
