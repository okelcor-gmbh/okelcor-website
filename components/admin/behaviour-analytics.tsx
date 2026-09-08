"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  AlertCircle, AlertTriangle, ArrowRight, BarChart2, Clock,
  Info, PackageX, RefreshCw, Search, Table2,
} from "lucide-react";
import Link from "next/link";
import {
  CHART_INK, SERIES, compactNumber, dimensionLabel, fullNumber, percent,
  relativeDays, shortDate, shortDay, stockPresentation,
  type BehaviourDimension, type BehaviourMeta, type BehaviourReport,
} from "@/lib/behaviour-analytics";

// ── Range presets ─────────────────────────────────────────────────────────────
// One filter row above everything it scopes — never a filter per chart.
const RANGES = [
  { days: 7,   label: "7 days" },
  { days: 30,  label: "30 days" },
  { days: 90,  label: "90 days" },
  { days: 365, label: "12 months" },
] as const;

// ── Small pieces ──────────────────────────────────────────────────────────────

function Card({
  title, subtitle, children, tone = "plain", right,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: "plain" | "primary";
  right?: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border bg-white ${
        tone === "primary" ? "border-[#f4511e]/25 shadow-sm" : "border-black/[0.06]"
      }`}
    >
      {(title || right) && (
        <header className="flex flex-wrap items-center gap-2 border-b border-black/[0.05] px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-[0.875rem] font-bold text-[#1a1a1a]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[0.75rem] leading-snug text-[#5c5e62]">{subtitle}</p>}
          </div>
          {right && <div className="ml-auto shrink-0">{right}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Supporting figure. Proportional digits — `tabular-nums` makes 121 look loose. */
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#8c8f94]">{label}</p>
      <p className="mt-1 text-[1.35rem] font-bold leading-none text-[#1a1a1a]">{value}</p>
      {hint && <p className="mt-1 text-[0.72rem] text-[#8c8f94]">{hint}</p>}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-[0.83rem] text-[#8c8f94]">{children}</p>;
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 shadow-md">
      {label != null && (
        <p className="mb-1 text-[0.72rem] font-semibold text-[#1a1a1a]">
          {typeof label === "string" && /^\d{4}-\d{2}-\d{2}/.test(label) ? shortDate(label) : String(label)}
        </p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-[0.75rem] text-[#5c5e62]">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-mono font-semibold text-[#1a1a1a]">{fullNumber(p.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Horizontal ranked bars for one dimension.
 *
 * One series, so one hue for every bar and no legend — the title names it. The
 * value is printed beside each bar, which doubles as this chart's table view.
 */
function DimensionBars({
  rows, limit = 8, unit = "searches",
}: { rows: BehaviourDimension[]; limit?: number; unit?: string }) {
  if (rows.length === 0) return <EmptyHint>Nothing recorded in this period yet.</EmptyHint>;
  const top = rows.slice(0, limit);
  const max = Math.max(...top.map((r) => r.searches), 1);

  return (
    <ul className="space-y-2.5">
      {top.map((r) => (
        <li key={r.value} className="grid grid-cols-[minmax(64px,110px)_1fr_auto] items-center gap-3">
          <span className="truncate text-[0.8rem] font-medium text-[#1a1a1a]" title={dimensionLabel(r.value)}>
            {dimensionLabel(r.value)}
          </span>
          {/* Thin mark, 4px rounded data-end, anchored to the baseline. */}
          <span className="h-2.5 w-full overflow-hidden rounded-full bg-[#f2f4f5]">
            <span
              className="block h-full rounded-r-[4px]"
              style={{ width: `${Math.max((r.searches / max) * 100, 2)}%`, background: SERIES.bar }}
            />
          </span>
          <span className="text-right text-[0.78rem] font-semibold tabular-nums text-[#1a1a1a]">
            {fullNumber(r.searches)}
            {r.empty_searches ? (
              <span className="ml-1.5 font-normal text-[#8c8f94]" title={`${r.empty_searches} of these returned nothing`}>
                ({r.empty_searches} empty)
              </span>
            ) : null}
          </span>
        </li>
      ))}
      <li className="pt-1 text-[0.7rem] text-[#8c8f94]">Measured in {unit}.</li>
    </ul>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function BehaviourAnalytics() {
  const [days, setDays]       = useState<number>(30);
  const [report, setReport]   = useState<BehaviourReport | null>(null);
  const [meta, setMeta]       = useState<BehaviourMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [notDeployed, setNotDeployed] = useState(false);
  const [showDailyTable, setShowDailyTable] = useState(false);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    setNotDeployed(false);
    try {
      const res  = await fetch(`/api/admin/analytics/behaviour?days=${d}`);
      const json = await res.json().catch(() => ({})) as {
        data?: BehaviourReport; meta?: BehaviourMeta; message?: string;
      };
      if (res.status === 404 || res.status === 405 || res.status === 501) {
        setNotDeployed(true);
        return;
      }
      if (!res.ok) {
        setError(json.message ?? `Could not load the report (${res.status}).`);
        return;
      }
      setReport(json.data ?? null);
      setMeta(json.meta ?? null);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  const s      = report?.summary;
  const daily  = report?.daily ?? [];
  const unmet  = report?.unmet_demand ?? [];
  // Only the rows that need a decision. "available" is the happy path and would
  // bury the two that aren't.
  const stock  = (report?.demand_vs_stock ?? []).filter((r) => r.status !== "available");
  const rim    = report?.size_demand?.rim ?? [];
  const funnel = report?.funnel;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header + the page's own blind spots ── */}
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#1a1a1a]">Customer behaviour</h1>
        <p className="mt-1 max-w-3xl text-[0.8rem] leading-relaxed text-[#5c5e62]">
          What people search the catalogue for, and what they ask for that we can&apos;t supply.
        </p>
        {/* Stated on the page, not just in the contract: a screen called "customer
            behaviour" that quietly omits page views invites the reader to conclude
            they aren't happening. */}
        <p className="mt-2 flex max-w-3xl items-start gap-1.5 text-[0.72rem] leading-relaxed text-[#8c8f94]">
          <Info size={12} className="mt-0.5 shrink-0" />
          <span>
            {meta?.not_covered
              ?? "Page views, scroll depth, click paths and time on page never reach this API and are not represented here."}
            {" "}
            <Link href="/admin/analytics" className="font-semibold text-[#5c5e62] underline underline-offset-2 hover:text-[#1a1a1a]">
              Site analytics
            </Link>{" "}
            covers those separately.
          </span>
        </p>
      </div>

      {/* ── One filter row, scoping everything below ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-full bg-[#f0f2f5] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              aria-pressed={days === r.days}
              className={`h-8 rounded-full px-3.5 text-[0.78rem] font-semibold transition ${
                days === r.days ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#5c5e62] hover:text-[#1a1a1a]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => load(days)}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/[0.1] bg-white px-3.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:border-black/25 hover:text-[#1a1a1a] disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
        {report?.range?.from && (
          <p className="text-[0.72rem] text-[#8c8f94]">
            {shortDate(report.range.from)} → {shortDate(report.range.to)}
          </p>
        )}
      </div>

      {notDeployed && (
        <Card>
          <div className="flex items-start gap-2.5 text-[0.83rem] text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">This report isn&apos;t available on the server yet.</p>
              <p className="mt-1">
                It needs the behaviour analytics endpoint and its migration. Nothing is
                being lost in the meantime — searches start being recorded the moment it
                is deployed.
              </p>
            </div>
          </div>
        </Card>
      )}

      {error && !notDeployed && (
        <Card>
          <div className="flex items-start gap-2.5 text-[0.83rem] text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        </Card>
      )}

      {/* `available: false` is not "no demand" — say which it is. An empty chart
          here would assert that customers aren't searching. */}
      {report && report.available === false && (
        <Card>
          <div className="flex items-start gap-2.5">
            <Clock size={15} className="mt-0.5 shrink-0 text-[#5c5e62]" />
            <div>
              <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">No searches recorded yet</p>
              <p className="mt-1 max-w-2xl text-[0.8rem] leading-relaxed text-[#5c5e62]">
                {report.reason ?? "Collection has only just started, so there is nothing to report."}
              </p>
              <p className="mt-2 text-[0.78rem] text-[#8c8f94]">
                This is not a sign that nobody is searching — it means nothing has been
                collected yet
                {report.range?.from ? <> (collecting since {shortDate(report.range.from)})</> : null}.
                A week is roughly when these lists start to mean something.
              </p>
            </div>
          </div>
        </Card>
      )}

      {report?.available && (
        // Held at reduced opacity while refetching rather than replaced by a
        // skeleton — no layout jump, and the previous slice stays readable.
        <div className={`flex flex-col gap-5 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>

          {/* ═══ 1. Unmet demand — the most prominent thing on the page ═══
              Every row is a product to stock or a word the catalogue doesn't
              recognise. It's the only list here that changes a purchasing
              decision, so it sits above the volume charts. */}
          <Card
            tone="primary"
            title="Asked for, and we returned nothing"
            subtitle="Each of these is either a product worth stocking or a term the catalogue doesn't recognise for something already sold."
            right={
              unmet.length > 0
                ? <span className="rounded-full bg-[#f4511e] px-2.5 py-1 text-[0.72rem] font-bold text-white">{unmet.length}</span>
                : undefined
            }
          >
            {unmet.length === 0 ? (
              <EmptyHint>Every search in this period returned results. Nothing to act on.</EmptyHint>
            ) : (
              <div className="-mx-1 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="border-b border-black/[0.06] text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#8c8f94]">
                      <th className="px-1 pb-2">Searched for</th>
                      <th className="px-1 pb-2 text-right">Searches</th>
                      <th className="px-1 pb-2 text-right">People</th>
                      <th className="px-1 pb-2 text-right">Last asked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {unmet.map((u) => (
                      <tr key={u.term} className="transition hover:bg-[#fafafa]">
                        <td className="px-1 py-2.5">
                          <span className="font-mono text-[0.83rem] font-semibold text-[#1a1a1a]">{u.term}</span>
                        </td>
                        <td className="px-1 py-2.5 text-right text-[0.83rem] font-semibold tabular-nums text-[#1a1a1a]">
                          {fullNumber(u.searches)}
                        </td>
                        <td className="px-1 py-2.5 text-right text-[0.83rem] tabular-nums text-[#5c5e62]">
                          {fullNumber(u.visitors)}
                        </td>
                        <td className="px-1 py-2.5 text-right text-[0.78rem] text-[#5c5e62]">
                          {relativeDays(u.last_searched)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ═══ 2. Demand against stock ═══
              A product nobody could buy sold nothing, which in a sales report is
              indistinguishable from a product nobody wanted. */}
          <Card
            title="Brands people searched for but couldn't buy"
            subtitle="Out of stock and not stocked are different problems, so they carry different labels — one is a restock, the other a range decision."
          >
            {stock.length === 0 ? (
              <EmptyHint>Everything searched for was available. Nothing to act on.</EmptyHint>
            ) : (
              <ul className="space-y-2">
                {stock.map((row) => {
                  const p = stockPresentation(row.status);
                  return (
                    <li
                      key={row.brand}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.05] bg-[#fafafa] px-3.5 py-2.5"
                    >
                      <PackageX size={14} className="shrink-0 text-[#8c8f94]" />
                      <span className="text-[0.85rem] font-semibold text-[#1a1a1a]">{row.brand}</span>
                      {/* Icon + label, never colour alone. */}
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.72rem] font-bold ${p.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                        {p.label}
                      </span>
                      <span className="text-[0.78rem] text-[#5c5e62]">
                        <span className="font-semibold tabular-nums text-[#1a1a1a]">{fullNumber(row.searches)}</span> searches
                        {" · "}
                        <span className="tabular-nums">{fullNumber(row.in_stock_products)}</span> of{" "}
                        <span className="tabular-nums">{fullNumber(row.products)}</span> in stock
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#5c5e62]">
                        {p.action} <ArrowRight size={11} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* ═══ 3. Empty rate — the one hero figure — and the trend ═══ */}
          <Card
            title="Searches that found nothing"
            subtitle="A rising no-result rate is the earliest sign the catalogue is drifting away from what people ask for."
            right={
              <button
                type="button"
                onClick={() => setShowDailyTable((v) => !v)}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-black/[0.1] bg-white px-3 text-[0.72rem] font-semibold text-[#5c5e62] transition hover:border-black/25 hover:text-[#1a1a1a]"
              >
                <Table2 size={11} /> {showDailyTable ? "Hide table" : "Show table"}
              </button>
            }
          >
            <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#8c8f94]">
                    No-result rate
                  </p>
                  {/* The single hero figure on this view. Same sans as everything
                      else, proportional digits. */}
                  <p className="mt-1 text-[3rem] font-bold leading-none tracking-tight text-[#1a1a1a]">
                    {percent(s?.empty_rate)}
                  </p>
                  <p className="mt-1.5 text-[0.75rem] text-[#5c5e62]">
                    {fullNumber(s?.empty_searches)} of {fullNumber(s?.searches)} searches
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                  <Stat label="Searches" value={compactNumber(s?.searches)} />
                  <Stat label="Visitors" value={compactNumber(s?.visitors)} />
                  <Stat label="Avg results" value={s?.avg_results != null ? s.avg_results.toFixed(1) : "—"} />
                  {report.signed_in_share && (
                    <Stat
                      label="Signed in"
                      value={percent(report.signed_in_share.signed_in_percent)}
                      hint={`${fullNumber(report.signed_in_share.signed_in)} searches`}
                    />
                  )}
                </div>
              </div>

              <div>
                {daily.length === 0 ? (
                  <EmptyHint>No daily data in this period.</EmptyHint>
                ) : (
                  <>
                    {/* Height includes the x-axis band so the axis labels can't be
                        cropped into a nested scrollbar. Zero days are plotted as
                        zeros — the series is gap-free on purpose, and a gap would
                        read as missing data rather than "nobody searched". */}
                    <div style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={daily} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={shortDay}
                            tick={{ fill: CHART_INK.label, fontSize: 11 }}
                            axisLine={{ stroke: CHART_INK.axis }}
                            tickLine={false}
                            minTickGap={24}
                          />
                          <YAxis
                            tick={{ fill: CHART_INK.label, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend
                            verticalAlign="top"
                            align="right"
                            height={28}
                            iconType="plainline"
                            wrapperStyle={{ fontSize: 12, color: "#5c5e62" }}
                          />
                          <Line
                            type="monotone" dataKey="searches" name="Searches"
                            stroke={SERIES.searches} strokeWidth={2} dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
                          />
                          <Line
                            type="monotone" dataKey="empty_searches" name="Found nothing"
                            stroke={SERIES.empty} strokeWidth={2} dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* The table view — so no value is reachable only by hovering. */}
                    {showDailyTable && (
                      <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-black/[0.06]">
                        <table className="w-full text-left text-[0.78rem]">
                          <thead className="sticky top-0 bg-[#fafafa]">
                            <tr className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#8c8f94]">
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2 text-right">Searches</th>
                              <th className="px-3 py-2 text-right">Found nothing</th>
                              <th className="px-3 py-2 text-right">Visitors</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/[0.04]">
                            {daily.map((d) => (
                              <tr key={d.date}>
                                <td className="px-3 py-1.5 text-[#5c5e62]">{shortDate(d.date)}</td>
                                <td className="px-3 py-1.5 text-right tabular-nums text-[#1a1a1a]">{fullNumber(d.searches)}</td>
                                <td className="px-3 py-1.5 text-right tabular-nums text-[#1a1a1a]">{fullNumber(d.empty_searches)}</td>
                                <td className="px-3 py-1.5 text-right tabular-nums text-[#5c5e62]">{fullNumber(d.visitors)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* ═══ 4. Demand breakdowns — rim size first ═══ */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Rim sizes people search for" subtitle="The way a tyre buyer actually thinks about fitment.">
              {rim.length === 0 ? (
                <EmptyHint>No size filters recorded yet.</EmptyHint>
              ) : (
                <div style={{ height: Math.max(200, rim.slice(0, 10).length * 34 + 40) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rim.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 4, right: 32, bottom: 4, left: 4 }}
                      barCategoryGap={6}
                    >
                      <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: CHART_INK.label, fontSize: 11 }}
                        axisLine={false} tickLine={false} allowDecimals={false}
                      />
                      <YAxis
                        type="category" dataKey="value" width={56}
                        tickFormatter={(v: string) => `R${v}`}
                        tick={{ fill: "#1a1a1a", fontSize: 11 }}
                        axisLine={{ stroke: CHART_INK.axis }} tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                      {/* One series → one hue for every bar, and no legend: the
                          card title names it. 4px rounded data-end. */}
                      <Bar dataKey="searches" name="Searches" fill={SERIES.bar} radius={[0, 4, 4, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Most searched terms" subtitle="What people typed, most-asked first.">
              {(report.top_searches ?? []).length === 0 ? (
                <EmptyHint>Nothing recorded in this period yet.</EmptyHint>
              ) : (
                <ul className="divide-y divide-black/[0.04]">
                  {(report.top_searches ?? []).slice(0, 10).map((t) => (
                    <li key={t.term} className="flex items-center gap-3 py-2">
                      <Search size={12} className="shrink-0 text-[#c9cdd1]" />
                      <span className="min-w-0 flex-1 truncate font-mono text-[0.8rem] text-[#1a1a1a]" title={t.term}>
                        {t.term}
                      </span>
                      {t.empty_searches ? (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[0.68rem] font-semibold text-amber-800">
                          {t.empty_searches} empty
                        </span>
                      ) : null}
                      <span className="shrink-0 text-[0.8rem] font-semibold tabular-nums text-[#1a1a1a]">
                        {fullNumber(t.searches)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Brands" subtitle="Brand filters applied to the catalogue.">
              <DimensionBars rows={report.brand_demand ?? []} />
            </Card>

            <Card title="Categories" subtitle="Which part of the range people filter into.">
              <DimensionBars rows={report.category_demand ?? []} />
            </Card>

            <Card title="Seasons" subtitle="Summer, winter and all-season filters.">
              <DimensionBars rows={report.season_demand ?? []} />
            </Card>

            <Card title="Countries" subtitle="Where the searches came from.">
              <DimensionBars rows={report.countries ?? []} />
            </Card>
          </div>

          {/* ═══ 5. Saved fitments + the three counts ═══ */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Saved fitments" subtitle="Sizes customers chose to keep — a stronger signal than a single search.">
              {(report.saved_fitments ?? []).length === 0 ? (
                <EmptyHint>No fitments saved in this period.</EmptyHint>
              ) : (
                <ul className="divide-y divide-black/[0.04]">
                  {(report.saved_fitments ?? []).slice(0, 10).map((f) => (
                    <li key={f.size} className="flex items-center gap-3 py-2">
                      <span className="min-w-0 flex-1 truncate font-mono text-[0.8rem] font-semibold text-[#1a1a1a]">
                        {f.size}
                      </span>
                      <span className="text-[0.78rem] tabular-nums text-[#5c5e62]">
                        {fullNumber(f.saves)} saves · {fullNumber(f.customers)} customers
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Three counts of three separate populations, side by side.
                Deliberately NOT drawn as a narrowing funnel with arrows: nothing
                joins a search to an order here, and the funnel graphic would make
                a claim about individual journeys that this data cannot support. */}
            {funnel && (
              <Card title="Searches, inquiries and orders" subtitle="Three separate counts over the same period — not one journey.">
                <div className="grid grid-cols-3 gap-4">
                  <Stat label="Searches" value={compactNumber(funnel.searches)} hint={`${compactNumber(funnel.visitors)} visitors`} />
                  <Stat label="Inquiries" value={compactNumber(funnel.inquiries)} />
                  <Stat label="Orders" value={compactNumber(funnel.orders)} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-black/[0.05] pt-4">
                  <Stat
                    label="Inquiries per visitor"
                    value={percent(funnel.inquiry_rate_per_visitor, 2)}
                    hint="Proportion, not a conversion path"
                  />
                  <Stat
                    label="Orders per visitor"
                    value={percent(funnel.order_rate_per_visitor, 2)}
                    hint="Proportion, not a conversion path"
                  />
                </div>
                <p className="mt-4 flex items-start gap-1.5 text-[0.72rem] leading-relaxed text-[#8c8f94]">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  {funnel.note
                    ?? "Counts of three separate populations over the same period. Searches are anonymous and orders are not, so these figures are not linked to one another."}
                </p>
              </Card>
            )}
          </div>

          {/* ═══ Provenance ═══ */}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] text-[#8c8f94]">
            <BarChart2 size={12} />
            {meta?.covers && <span>{meta.covers}</span>}
            {meta?.generated_at && <span>· Generated {shortDate(meta.generated_at)}</span>}
          </p>
        </div>
      )}

      {loading && !report && (
        <Card>
          <div className="flex items-center justify-center gap-2 py-10 text-[0.83rem] text-[#5c5e62]">
            <RefreshCw size={14} className="animate-spin" /> Loading the report…
          </div>
        </Card>
      )}
    </div>
  );
}
