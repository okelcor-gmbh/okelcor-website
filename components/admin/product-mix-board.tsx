"use client";

/**
 * Promotion insight — the marketing team's two questions on one page:
 * are we selling used or new tyres (so we know which to promote), and
 * which sizes do repeat buyers keep coming back for, in which countries
 * (so those become country-targeted bundles).
 */

import { useCallback, useEffect, useState, useTransition } from "react";
import { AlertTriangle, Loader2, Package, RefreshCw, Repeat, TrendingUp } from "lucide-react";
import {
  getProductMix,
  type ProductMix, type ProductMixMeta,
} from "@/app/admin/analytics/product-mix/actions";

const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const WINDOWS = [30, 90, 180, 365];

export default function ProductMixBoard() {
  const [days, setDays]       = useState(90);
  const [data, setData]       = useState<ProductMix | null>(null);
  const [meta, setMeta]       = useState<ProductMixMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [, startTransition]   = useTransition();

  const load = useCallback((window: number) => {
    setLoading(true);
    startTransition(async () => {
      const res = await getProductMix(window);
      if (res.error || !res.data) { setError(res.error ?? "Failed to load."); setLoading(false); return; }
      setData(res.data);
      setMeta(res.meta ?? null);
      setError(null);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={22} className="animate-spin text-[#f4511e]" /></div>;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <AlertTriangle size={32} className="mb-3 text-amber-400" strokeWidth={1.5} />
        <p className="mb-1 text-[1rem] font-bold text-[#1a1a1a]">Promotion insight unavailable</p>
        <p className="mb-5 max-w-sm text-[0.83rem] text-[#6b7280]">{error}</p>
        <button type="button" onClick={() => load(days)}
          className="flex items-center gap-2 rounded-full bg-[#f4511e] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#df4618]">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const used = data?.by_condition.find((c) => c.condition === "used");
  const knew = data?.by_condition.find((c) => c.condition === "new");
  const unknown = data?.by_condition.find((c) => c.condition === "unknown");

  // The direct answer to "should we promote used or new": compare revenue
  // and margin, in words.
  let verdict: string | null = null;
  if (used && knew) {
    const leader = used.revenue >= knew.revenue ? "Used" : "New";
    const ratio  = Math.min(used.revenue, knew.revenue) > 0
      ? (Math.max(used.revenue, knew.revenue) / Math.min(used.revenue, knew.revenue)).toFixed(1)
      : null;
    verdict = `${leader} tyres lead${ratio ? ` (${ratio}× the revenue of the other)` : ""} over the last ${days} days`;
    if (used.est_margin !== null && knew.est_margin !== null) {
      const marginLeader = used.est_margin >= knew.est_margin ? "used" : "new";
      verdict += `; ${marginLeader} tyres carried the larger estimated margin.`;
    } else {
      verdict += ".";
    }
  } else if (used || knew) {
    verdict = `Only ${used ? "used" : "new"} tyres sold in this window.`;
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <TrendingUp size={18} className="text-[#f4511e]" strokeWidth={2} />
          <div>
            <h1 className="text-[1.15rem] font-extrabold text-[#1a1a1a]">Promotion Insight</h1>
            <p className="text-[0.8rem] text-[#6b7280]">What actually sells — used vs new, sizes, repeat buyers, countries</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {WINDOWS.map((w) => (
            <button key={w} type="button" onClick={() => setDays(w)}
              className={`rounded-full px-3 py-1.5 text-[0.75rem] font-bold transition ${
                days === w ? "bg-[#1a1a1a] text-white" : "bg-white text-[#5c5e62] ring-1 ring-black/[0.08] hover:bg-[#f0f2f5]"
              }`}>
              {w}d
            </button>
          ))}
        </div>
      </div>

      {/* The answer, in words */}
      {verdict && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-[0.85rem] font-semibold text-emerald-800">
          {verdict}
        </div>
      )}

      {/* Condition cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[{ label: "Used tyres", row: used }, { label: "New tyres", row: knew }].map(({ label, row }) => (
          <div key={label} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">{label}</p>
            {row ? (
              <>
                <p className="text-[1.6rem] font-extrabold leading-none text-[#1a1a1a]">{fmt(row.revenue)} €</p>
                <p className="mt-1 text-[0.78rem] text-[#6b7280]">
                  {row.units} tyres · {row.orders} orders
                  {row.est_margin !== null && <> · est. margin <span className={row.est_margin < 0 ? "font-bold text-red-600" : "font-bold text-emerald-700"}>{fmt(row.est_margin)} €</span></>}
                </p>
                <p className="mt-1.5 text-[0.72rem] text-[#9ca3af]">
                  Website {row.channels.website} · eBay {row.channels.ebay}
                </p>
              </>
            ) : (
              <p className="text-[0.83rem] italic text-[#9ca3af]">No sales in this window.</p>
            )}
          </div>
        ))}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Data quality</p>
          <p className="text-[0.83rem] text-[#5c5e62]">
            {unknown ? `${unknown.units} sold tyre(s) matched no product — condition unknown.` : "Every sold line matched a product."}
          </p>
          <p className="mt-1.5 text-[0.72rem] text-[#9ca3af]">
            {meta?.repeat_customer_count} repeat customer(s) all-time. {meta?.satisfied_definition}
          </p>
        </div>
      </div>

      {/* Bundle suggestions */}
      {data && data.bundles.length > 0 && (
        <div className="mb-6">
          <div className="mb-2.5 flex items-center gap-2">
            <Package size={15} className="text-[#5c5e62]" />
            <h2 className="text-[0.875rem] font-extrabold text-[#1a1a1a]">Bundle suggestions</h2>
            <span className="text-[0.72rem] text-[#9ca3af]">sizes repeat buyers keep reordering, in the country where the demand lives</span>
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
            <ul className="divide-y divide-black/[0.05]">
              {data.bundles.map((b, i) => (
                <li key={i} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Repeat size={14} className="shrink-0 text-[#f4511e]" />
                  <span className="flex-1 text-[0.85rem] font-semibold text-[#1a1a1a]">{b.suggestion}</span>
                  <span className="text-[0.72rem] text-[#9ca3af]">{b.evidence}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Top sizes */}
      <h2 className="mb-2.5 text-[0.875rem] font-extrabold text-[#1a1a1a]">Top selling sizes</h2>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[0.8rem]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-[#f8f9fa] text-[#6b7280]">
                <th className="px-3 py-2.5 font-bold">Size</th>
                <th className="px-3 py-2.5 font-bold">Condition</th>
                <th className="px-3 py-2.5 text-right font-bold">Tyres sold</th>
                <th className="px-3 py-2.5 text-right font-bold">Revenue</th>
                <th className="px-3 py-2.5 text-right font-bold">From repeat buyers</th>
                <th className="px-3 py-2.5 font-bold">Where</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {(data?.top_sizes ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9ca3af]">No identifiable sales in this window.</td></tr>
              )}
              {(data?.top_sizes ?? []).map((s, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-3 py-2.5 font-bold text-[#1a1a1a]">{s.size} <span className="font-normal text-[#9ca3af]">{s.type}</span></td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${s.condition === "used" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {s.condition}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{s.units}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{fmt(s.revenue)}</td>
                  <td className="px-3 py-2.5 text-right">
                    {s.repeat_customers > 0
                      ? <span className="font-semibold text-emerald-700">{s.repeat_units} tyres · {s.repeat_customers} buyer(s)</span>
                      : <span className="text-[#c2c6cc]">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {s.countries.map((c) => (
                      <span key={c.country} className="mr-1 inline-block rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[0.68rem] font-semibold text-[#5c5e62]">
                        {c.country} ({c.units})
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
