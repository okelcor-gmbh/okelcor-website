"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus, Loader2, Table2, Info, Download } from "lucide-react";
import type { OperationsReport } from "@/lib/admin-api";
import { CHART_INK, SERIES, fullNumber } from "@/lib/behaviour-analytics";
import { formatMoney } from "@/lib/currency";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

/**
 * The transaction report.
 *
 * **`series` is fed in as served and never rebuilt from `periods`.** Two places
 * that aggregate are two places that can disagree about a number the business is
 * reading, and the disagreement would surface as an argument rather than as a
 * bug report.
 *
 * **The datasets are not plotted on one chart.** `amount` is money and the rest
 * are counts; putting them on a shared axis would mean a second y-scale, which
 * is the single most misleading thing a chart can do — a line crossing another
 * would imply a relationship that only exists because of how the two axes were
 * scaled. They are drawn as small multiples instead, one unit per chart.
 *
 * Order counts share a unit and a meaning, so those two go together — exactly
 * the two-series pair the palette was validated for.
 */

const GRANULARITIES = [
  { value: "day",   label: "Daily" },
  { value: "week",  label: "Weekly" },
  { value: "month", label: "Monthly" },
] as const;

type Row = Record<string, string | number>;

/**
 * Transpose the served parallel arrays into recharts rows — **not** an
 * aggregation: every value comes from `series` exactly as sent.
 *
 * Each entry names the dataset by `metric` *and* `channel`, which is the order
 * the datasets are filtered in: pick the measure, then pick whose it is.
 * `channel` defaults to `all`, which is also the only channel present when the
 * report was asked for one specific channel.
 */
function toRows(
  report: OperationsReport,
  picks: { key: string; metric: string; channel?: string }[],
): Row[] {
  const labels = report.series?.labels ?? [];
  const sets = report.series?.datasets ?? [];
  return labels.map((label, i) => {
    const row: Row = { label };
    for (const p of picks) {
      const want = p.channel ?? "all";
      const ds = sets.find(
        (d) => d.metric === p.metric && (d.channel ?? "all") === want,
      );
      // Empty periods arrive as zeros and are plotted as zeros. Dropping them
      // makes "we sold nothing in July" and "July is missing" look identical.
      row[p.key] = ds?.data?.[i] ?? 0;
    }
    return row;
  });
}

function ChartTooltip({
  active, payload, label, money,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-black/[0.08] bg-white px-2.5 py-1.5 shadow-sm">
      <p className="mb-0.5 text-[0.72rem] font-bold text-[#171a20]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-[0.72rem] text-[#5c5e62]">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}
          <span className="ml-auto font-semibold tabular-nums text-[#171a20]">
            {money ? formatMoney(p.value) : fullNumber(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

function Chart({
  rows, lines, money, height = 240,
}: {
  rows: Row[];
  lines: { key: string; name: string; color: string }[];
  money?: boolean;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_INK.label, fontSize: 11 }}
            axisLine={{ stroke: CHART_INK.axis }}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={{ fill: CHART_INK.label, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={money ? 72 : 44}
            tickFormatter={(v: number) => (money ? formatMoney(v).replace(/[.,]00$/, "") : String(v))}
          />
          <Tooltip content={<ChartTooltip money={money} />} />
          {/* A legend only when there is more than one series — with one, the
              panel title already names it and a legend box is furniture. */}
          {lines.length > 1 && (
            <Legend
              verticalAlign="top" align="right" height={26} iconType="plainline"
              wrapperStyle={{ fontSize: 12, color: "#5c5e62" }}
            />
          )}
          {lines.map((l) => (
            <Line
              key={l.key}
              // Straight segments, not a smoothed curve. These are discrete
              // period buckets — there is no value at mid-May — and a curve
              // drawn through them asserts one. It reads worst around an empty
              // period, where smoothing turns "4 orders, then none, then 4"
              // into a gentle decline that never happened.
              type="linear" dataKey={l.key} name={l.name}
              stroke={l.color} strokeWidth={2} dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
              // Recharts draws a line in by animating `stroke-dasharray` from
              // zero. On a reporting surface that adds nothing, and it has two
              // real costs: the line is invisible until rAF runs — so a chart in
              // a background tab renders empty until it is focused — and any
              // screenshot of the page catches it mid-draw, which is how this
              // was found. The figures should be on screen the moment the panel is.
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChangeTiles({ report }: { report: OperationsReport }) {
  const change = report.change;
  if (!change?.metrics) return null;

  const LABELS: Record<string, string> = {
    orders_sent: "Orders sent",
    orders_confirmed: "Orders confirmed",
    amount: "Amount",
    clients: "Clients",
  };

  return (
    <>
      <p className="text-[0.75rem] text-[#8c8f94]">
        {change.from} → {change.to}
      </p>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Object.entries(change.metrics).map(([metric, m]) => {
          const up = m.direction === "up";
          const down = m.direction === "down";
          const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
          const money = metric === "amount";
          return (
            <div key={metric} className="rounded-xl border border-black/[0.06] bg-white p-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#5c5e62]">
                {LABELS[metric] ?? metric.replace(/_/g, " ")}
              </p>
              <p className="mt-0.5 text-[1.15rem] font-bold tabular-nums text-[#171a20]">
                {money ? formatMoney(m.current) : fullNumber(m.current)}
              </p>
              <p className={`mt-0.5 flex items-center gap-1 text-[0.72rem] font-semibold ${
                up ? "text-emerald-700" : down ? "text-red-600" : "text-[#8c8f94]"
              }`}>
                <Icon size={11} />
                <span className="tabular-nums">
                  {m.delta > 0 ? "+" : ""}{money ? formatMoney(m.delta) : fullNumber(m.delta)}
                </span>
                <span className="text-[#8c8f94]">
                  {/*
                    Null off a zero baseline. A change from nothing is undefined,
                    not large — and "+100%" there reads as a measured fact rather
                    than an artefact of dividing by zero.
                  */}
                  {m.percent == null
                    ? m.previous === 0 && m.current > 0 ? "· new" : "· —"
                    : `· ${m.percent > 0 ? "+" : ""}${m.percent}%`}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function OperationsReportPanel({
  from, to, channel,
}: {
  from: string; to: string; channel: string;
}) {
  const [report, setReport] = useState<OperationsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [granularity, setGranularity] = useState("month");
  const [showTable, setShowTable] = useState(false);
  /** "combined" plots the served `all` series; "split" compares the channels. */
  const [channelView, setChannelView] = useState<"combined" | "split">("combined");

  // Narrower than reading the report: `support` can see this page and cannot
  // export, so the control is absent rather than present and 403ing. `can()`
  // rather than `canDo(role, …)` because it also returns false while the role
  // is still being read, which is the documented guard against a flash of a
  // control the user turns out not to have.
  const { can } = useAdminPermissions();
  const canExport = can("orders.export");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ granularity });
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (channel && channel !== "all") p.set("channel", channel);
      const res = await fetch(`/api/admin/operations/report?${p}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUnavailable(json.message ?? json.error ?? "The report isn't available on this server yet.");
        setReport(null);
      } else {
        setUnavailable(null);
        setReport((json.data ?? null) as OperationsReport | null);
      }
    } catch {
      setUnavailable("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [from, to, channel, granularity]);

  useEffect(() => { void load(); }, [load]);

  const panel = "rounded-xl border border-black/[0.06] bg-white p-4";

  if (unavailable) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
        <p className="font-semibold">Not available on this server yet.</p>
        <p className="mt-0.5">{unavailable}</p>
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-8 text-[0.83rem] text-[#5c5e62]">
        <Loader2 size={14} className="animate-spin" /> Building the report…
      </div>
    );
  }

  // Only offered when the server actually split the channels. Asked for one
  // channel, `channel_split` is false and there is nothing to compare.
  const canSplit = report.channel_split === true;
  const split = canSplit && channelView === "split";

  const has = (m: string) => (report.series?.datasets ?? []).some((d) => d.metric === m);

  /**
   * One chart per measure, always at most two series.
   *
   * Combined: the two order counts together — same unit, the comparison that
   * matters, and exactly the pair the palette was validated for. Split: each
   * measure gets its own chart of website vs eBay, which keeps every chart to
   * two series and never puts money and counts on one axis.
   */
  const CHANNEL_SERIES = [
    { key: "normal", name: "Website", color: SERIES.searches },
    { key: "ebay",   name: "eBay",    color: SERIES.empty },
  ];

  const byChannel = (metric: string) => ({
    rows: toRows(report, CHANNEL_SERIES.map((c) => ({
      key: c.key, metric, channel: c.key,
    }))),
    lines: CHANNEL_SERIES.map((c) => ({ key: c.key, name: c.name, color: c.color })),
  });

  const exportHref = (() => {
    const p = new URLSearchParams({ granularity });
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (channel && channel !== "all") p.set("channel", channel);
    return `/api/admin/operations/report/export?${p}`;
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {GRANULARITIES.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGranularity(g.value)}
              className={`rounded-full px-3 py-1.5 text-[0.78rem] font-semibold transition ${
                granularity === g.value
                  ? "bg-[#171a20] text-white"
                  : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        {canSplit && (
          <div className="flex gap-1 border-l border-black/[0.10] pl-2">
            {([["combined", "Combined"], ["split", "Website vs eBay"]] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setChannelView(v)}
                className={`rounded-full px-3 py-1.5 text-[0.78rem] font-semibold transition ${
                  channelView === v
                    ? "bg-[#171a20] text-white"
                    : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-[#f0f2f5] px-3 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#e5e7eb]"
        >
          <Table2 size={13} /> {showTable ? "Hide" : "Show"} table
        </button>

        {canExport && (
          // A real link, not a fetch: the response is a streamed attachment and
          // the browser saves it. Carries the current filter state, so the file
          // matches the screen it was taken from.
          <a
            href={exportHref}
            className="flex items-center gap-1.5 rounded-full bg-[#171a20] px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-black"
          >
            <Download size={13} /> Export CSV
          </a>
        )}
      </div>

      <ChangeTiles report={report} />

      {split ? (
        <>
          {(["orders_sent", "orders_confirmed", "amount", "clients"] as const)
            .filter(has)
            .map((metric) => {
              const { rows, lines } = byChannel(metric);
              const money = metric === "amount";
              const TITLES: Record<string, string> = {
                orders_sent: "Orders sent", orders_confirmed: "Orders confirmed",
                amount: "Amount (EUR)", clients: "Clients",
              };
              return (
                <div key={metric} className={panel}>
                  <h3 className="mb-2 text-[0.85rem] font-bold text-[#171a20]">
                    {TITLES[metric]} — website vs eBay
                  </h3>
                  <Chart rows={rows} lines={lines} money={money} />
                  {metric === "clients" && report.note && (
                    <p className="mt-2 flex items-start gap-1.5 text-[0.72rem] leading-snug text-[#8c8f94]">
                      <Info size={12} className="mt-0.5 shrink-0" />
                      {report.note}
                    </p>
                  )}
                </div>
              );
            })}
        </>
      ) : (
      <>
      {(has("orders_sent") || has("orders_confirmed")) && (
        <div className={panel}>
          <h3 className="mb-2 text-[0.85rem] font-bold text-[#171a20]">Orders</h3>
          <Chart
            rows={toRows(report, [
              { key: "orders_sent", metric: "orders_sent" },
              { key: "orders_confirmed", metric: "orders_confirmed" },
            ])}
            lines={[
              { key: "orders_sent",      name: "Orders sent",      color: SERIES.searches },
              { key: "orders_confirmed", name: "Orders confirmed", color: SERIES.empty },
            ]}
          />
        </div>
      )}

      {has("amount") && (
        <div className={panel}>
          {/* Its own chart, because money and counts cannot share a y-axis
              without inventing a relationship between them. */}
          <h3 className="mb-2 text-[0.85rem] font-bold text-[#171a20]">Amount (EUR)</h3>
          <Chart
            rows={toRows(report, [{ key: "amount", metric: "amount" }])}
            lines={[{ key: "amount", name: "Amount", color: SERIES.bar }]}
            money
          />
        </div>
      )}

      {has("clients") && (
        <div className={panel}>
          <h3 className="mb-2 text-[0.85rem] font-bold text-[#171a20]">Clients</h3>
          <Chart
            rows={toRows(report, [{ key: "clients", metric: "clients" }])}
            lines={[{ key: "clients", name: "Clients", color: SERIES.bar }]}
          />
          {report.note && (
            <p className="mt-2 flex items-start gap-1.5 text-[0.72rem] leading-snug text-[#8c8f94]">
              <Info size={12} className="mt-0.5 shrink-0" />
              {report.note}
            </p>
          )}
        </div>
      )}
      </>
      )}

      {/* The table twin, so no value is reachable only by hovering. */}
      {showTable && (
        <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {["Period", "Orders sent", "Orders confirmed", "Amount", "Clients"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-3 py-2 text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62] ${
                        i === 0 ? "text-left" : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.periods.map((p) => (
                  <tr key={p.key} className="border-b border-black/[0.04] last:border-0">
                    <td className="px-3 py-2 text-[0.8rem] text-[#171a20]">{p.label}</td>
                    <td className="px-3 py-2 text-right text-[0.8rem] tabular-nums">{p.orders_sent}</td>
                    <td className="px-3 py-2 text-right text-[0.8rem] tabular-nums">{p.orders_confirmed}</td>
                    <td className="px-3 py-2 text-right text-[0.8rem] tabular-nums">
                      {formatMoney(p.amount, p.currency)}
                    </td>
                    <td className="px-3 py-2 text-right text-[0.8rem] tabular-nums">{p.clients}</td>
                  </tr>
                ))}
              </tbody>
              {report.totals && (
                <tfoot>
                  <tr className="border-t-2 border-black/[0.08] bg-[#fafafa]">
                    <td className="px-3 py-2 text-[0.8rem] font-bold text-[#171a20]">Total</td>
                    <td className="px-3 py-2 text-right text-[0.8rem] font-bold tabular-nums">
                      {report.totals.orders_sent ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-[0.8rem] font-bold tabular-nums">
                      {report.totals.orders_confirmed ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-[0.8rem] font-bold tabular-nums">
                      {formatMoney(report.totals.amount)}
                    </td>
                    {/* Counted over the whole range by its own query — one buyer
                        ordering in two months is one client, so this is
                        deliberately less than the column above it. */}
                    <td
                      className="px-3 py-2 text-right text-[0.8rem] font-bold tabular-nums"
                      title="Counted distinctly across the whole range, so not the sum of the column above."
                    >
                      {report.totals.clients ?? "—"}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <p className="border-t border-black/[0.06] px-3 py-2 text-[0.72rem] text-[#8c8f94]">
            The client total is counted across the whole range, so it is not the sum of the
            client column — one buyer ordering in two months is one client.
          </p>
        </div>
      )}
    </div>
  );
}
