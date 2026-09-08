"use client";

/**
 * The eBay pricing audit board — every listed product with cost, price,
 * modelled eBay fees, and the net margin left, flagging loss-makers first.
 * Per-row live market comparison (competitor listings for the equivalent
 * tyre) loads on demand; "Apply" pushes an audited price correction to the
 * site and the live eBay offer in one step.
 */

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertCircle, AlertTriangle, CheckCircle2, HelpCircle, Loader2,
  RefreshCw, Search, TrendingUp, X,
} from "lucide-react";
import {
  getAudit, applyPrice, getMarket, getMarketByQuery, syncLive,
  type AuditRow, type AuditMeta, type AuditVerdict, type MarketComparison, type UnmatchedListing,
} from "@/app/admin/ebay-audit/actions";

const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const VERDICT_UI: Record<AuditVerdict, { label: string; cls: string }> = {
  loss:         { label: "Loss",         cls: "bg-red-100 text-red-700" },
  thin:         { label: "Thin",         cls: "bg-amber-100 text-amber-700" },
  healthy:      { label: "Healthy",      cls: "bg-emerald-100 text-emerald-700" },
  missing_cost: { label: "No cost",      cls: "bg-gray-200 text-gray-600" },
};

type Filter = "all" | "drift" | AuditVerdict;

export default function EbayAuditBoard() {
  const [rows, setRows]         = useState<AuditRow[]>([]);
  const [meta, setMeta]         = useState<AuditMeta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice]     = useState<string | null>(null);
  const [filter, setFilter]     = useState<Filter>("all");
  const [q, setQ]               = useState("");
  const [, startTransition]     = useTransition();

  // Per-row state
  const [markets, setMarkets]       = useState<Record<number, MarketComparison | "loading" | "error">>({});
  const [uMarkets, setUMarkets]     = useState<Record<string, MarketComparison | "loading" | "error">>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const [applying, setApplying]     = useState<number | null>(null);
  const [syncing, setSyncing]       = useState(false);

  const load = useCallback(() => {
    startTransition(async () => {
      const res = await getAudit();
      if (res.error || !res.rows) { setPageError(res.error ?? "Failed to load."); setLoading(false); return; }
      setRows(res.rows);
      setMeta(res.meta ?? null);
      setPageError(null);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => filter === "all" || (filter === "drift" ? r.price_drift !== null : r.verdict === filter))
      .filter((r) => !term ||
        `${r.sku ?? ""} ${r.brand ?? ""} ${r.name} ${r.size ?? ""}`.toLowerCase().includes(term))
      // Worst first: losses by biggest bleed, then thin, then missing cost.
      .sort((a, b) => {
        const rank: Record<AuditVerdict, number> = { loss: 0, thin: 1, missing_cost: 2, healthy: 3 };
        if (rank[a.verdict] !== rank[b.verdict]) return rank[a.verdict] - rank[b.verdict];
        return (a.net_margin ?? 0) - (b.net_margin ?? 0);
      });
  }, [rows, filter, q]);

  const checkMarket = (row: AuditRow) => {
    setMarkets((m) => ({ ...m, [row.id]: "loading" }));
    startTransition(async () => {
      const res = await getMarket(row.id);
      setMarkets((m) => ({ ...m, [row.id]: res.market ?? "error" }));
    });
  };

  // Market lookup for a listing with no product record — searched by its
  // own eBay title, compared against its own live price.
  const checkUnmatchedMarket = (l: UnmatchedListing) => {
    setUMarkets((m) => ({ ...m, [l.sku]: "loading" }));
    startTransition(async () => {
      const res = await getMarketByQuery(l.title ?? l.sku);
      let market = res.market;
      if (market && market.avg_price !== null && l.price !== null && market.avg_price > 0) {
        market = { ...market, vs_market_pct: Math.round(((l.price - market.avg_price) / market.avg_price) * 1000) / 10 };
      }
      setUMarkets((m) => ({ ...m, [l.sku]: market ?? "error" }));
    });
  };

  const doApply = (row: AuditRow) => {
    const draft = priceDrafts[row.id];
    const price = parseFloat(draft ?? "");
    if (!draft || isNaN(price) || price <= 0) { setNotice("Enter a valid new price first."); return; }
    if (!window.confirm(`Set ${row.sku ?? row.name} to ${fmt(price)} € on the site AND on eBay?`)) return;

    setApplying(row.id);
    startTransition(async () => {
      const res = await applyPrice(row.id, price);
      setApplying(null);
      if (res.error) { setNotice(res.error); return; }
      setNotice(res.message ?? "Price updated.");
      setPriceDrafts((d) => { const n = { ...d }; delete n[row.id]; return n; });
      load();
    });
  };

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={22} className="animate-spin text-[#f4511e]" /></div>;
  }

  if (pageError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <AlertTriangle size={32} className="mb-3 text-amber-400" strokeWidth={1.5} />
        <p className="mb-1 text-[1rem] font-bold text-[#1a1a1a]">eBay audit unavailable</p>
        <p className="mb-5 max-w-sm text-[0.83rem] text-[#6b7280]">{pageError}</p>
        <button type="button" onClick={() => { setLoading(true); load(); }}
          className="flex items-center gap-2 rounded-full bg-[#f4511e] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#df4618]">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const counts = meta?.counts;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <TrendingUp size={18} className="text-[#f4511e]" strokeWidth={2} />
          <div>
            <h1 className="text-[1.15rem] font-extrabold text-[#1a1a1a]">eBay Price Audit</h1>
            <p className="text-[0.8rem] text-[#6b7280]">
              Cost vs price vs eBay fees ({meta ? `${meta.fee_model.fee_percent}% + ${fmt(meta.fee_model.fee_fixed)} €` : "…"}) — worst first
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.72rem] text-[#9ca3af]">
            {meta?.live.fetched_at
              ? `Live eBay snapshot: ${new Date(meta.live.fetched_at).toLocaleString()} · ${meta.live.total_on_ebay} listings on eBay`
              : "No live snapshot yet — fetch to compare against real eBay prices"}
          </span>
          <button type="button" disabled={syncing}
            onClick={() => {
              setSyncing(true);
              startTransition(async () => {
                const res = await syncLive();
                setSyncing(false);
                setNotice(res.error ?? res.message ?? "Sync started.");
              });
            }}
            className="flex items-center gap-2 rounded-full bg-[#f4511e] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60">
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Fetch live from eBay
          </button>
          <button type="button" onClick={() => { setLoading(true); load(); }}
            className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#333]">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[0.83rem] text-blue-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}><X size={13} /></button>
        </div>
      )}

      {/* Summary cards */}
      {counts && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard label="Listed" value={counts.listed} />
          <SummaryCard label="Selling at a loss" value={counts.loss} accent={counts.loss > 0 ? "text-red-600" : undefined}
            sub={meta ? `−${fmt(meta.loss_per_full_sale)} € if each sells once` : undefined} />
          <SummaryCard label="Thin margin" value={counts.thin} accent={counts.thin > 0 ? "text-amber-600" : undefined}
            sub={meta ? `below ${meta.fee_model.thin_margin_percent}%` : undefined} />
          <SummaryCard label="Missing cost price" value={counts.missing_cost} accent={counts.missing_cost > 0 ? "text-gray-500" : undefined}
            sub="margin unknown — fill in cost" />
          <SummaryCard label="Healthy" value={counts.healthy} accent="text-emerald-600" />
        </div>
      )}

      {/* Reconciliation vs the live snapshot */}
      {counts && meta?.live.fetched_at && (counts.price_drift > 0 || counts.live_missing > 0 || counts.unmatched > 0) && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.8rem] text-amber-800">
          <AlertTriangle size={14} className="shrink-0 text-amber-500" />
          <span className="font-bold">eBay disagrees with the panel:</span>
          {counts.price_drift > 0 && <span>{counts.price_drift} price(s) differ on eBay</span>}
          {counts.live_missing > 0 && <span>· {counts.live_missing} marked listed but NOT on eBay</span>}
          {counts.unmatched > 0 && <span>· {counts.unmatched} live listing(s) unknown to the catalogue (below)</span>}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "loss", "thin", "missing_cost", "healthy", "drift"] as Filter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-[0.75rem] font-bold transition ${
              filter === f ? "bg-[#1a1a1a] text-white" : "bg-white text-[#5c5e62] ring-1 ring-black/[0.08] hover:bg-[#f0f2f5]"
            }`}>
            {f === "all"
              ? `All (${rows.length})`
              : f === "drift"
              ? `Differs from eBay (${counts?.price_drift ?? 0})`
              : `${VERDICT_UI[f].label} (${counts?.[f === "missing_cost" ? "missing_cost" : f] ?? 0})`}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sku, brand, size…"
            className="h-9 w-56 rounded-full border border-black/[0.09] bg-white pl-8 pr-3 text-[0.8rem] outline-none transition focus:border-[#f4511e]" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-[0.78rem]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-[#f8f9fa] text-[#6b7280]">
                <th className="px-3 py-2.5 font-bold">Product</th>
                <th className="px-3 py-2.5 text-right font-bold">Cost</th>
                <th className="px-3 py-2.5 text-right font-bold">Live on eBay</th>
                <th className="px-3 py-2.5 text-right font-bold">Fees est.</th>
                <th className="px-3 py-2.5 text-right font-bold">Net €</th>
                <th className="px-3 py-2.5 text-right font-bold">Net %</th>
                <th className="px-3 py-2.5 font-bold">Verdict</th>
                <th className="px-3 py-2.5 font-bold">Sold (90d)</th>
                <th className="px-3 py-2.5 font-bold">Market</th>
                <th className="px-3 py-2.5 text-right font-bold">Suggested</th>
                <th className="px-3 py-2.5 font-bold">New price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {visible.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-[#9ca3af]">Nothing matches this filter.</td></tr>
              )}
              {visible.map((r) => {
                const market = markets[r.id];
                return (
                  <tr key={r.id} className={r.verdict === "loss" ? "bg-red-50/40" : r.verdict === "thin" ? "bg-amber-50/30" : ""}>
                    <td className="max-w-[220px] px-3 py-2.5">
                      <p className="truncate font-bold text-[#1a1a1a]">{r.brand} {r.name}</p>
                      <p className="truncate text-[0.7rem] text-[#9ca3af]">
                        {r.size ?? ""} {r.season ? `· ${r.season}` : ""} {r.type ? `· ${r.type.toUpperCase()}` : ""} · {r.sku} · stock {r.stock}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono">{fmt(r.cost_price)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      {r.live_missing ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-bold text-red-700" title="Marked as listed in the panel, but eBay is not showing it">
                          NOT ON EBAY
                        </span>
                      ) : (
                        <>
                          <span className="font-mono font-bold">{fmt(r.ebay_price)}</span>
                          {r.live && r.live.status !== "published" && (
                            <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-gray-600">{r.live.status}</span>
                          )}
                          {r.price_drift !== null && (
                            <p className="text-[0.65rem] text-red-600" title="eBay's live price differs from what the tier formula (or the website price) says the offer should cost — re-push the listing from the Tyre Pricing flow">
                              should be: {fmt(r.expected_ebay_price)} ({r.price_drift > 0 ? "+" : ""}{fmt(r.price_drift)})
                            </p>
                          )}
                          {!r.live && !r.live_missing && (
                            <p className="text-[0.62rem] text-[#c2c6cc]">panel price — no snapshot</p>
                          )}
                        </>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[#6b7280]">−{fmt(r.fee_estimate)}</td>
                    <td className={`whitespace-nowrap px-3 py-2.5 text-right font-mono font-bold ${
                      r.net_margin === null ? "text-[#9ca3af]" : r.net_margin < 0 ? "text-red-600" : "text-emerald-700"
                    }`}>{fmt(r.net_margin)}</td>
                    <td className={`whitespace-nowrap px-3 py-2.5 text-right font-mono ${
                      r.net_margin_pct === null ? "text-[#9ca3af]" : r.net_margin_pct < 0 ? "text-red-600" : ""
                    }`}>{r.net_margin_pct === null ? "—" : `${r.net_margin_pct}%`}</td>
                    <td className="px-3 py-2.5">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${VERDICT_UI[r.verdict].cls}`}>
                        {VERDICT_UI[r.verdict].label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[#5c5e62]">
                      {r.sold_90d ? `${r.sold_90d.units} @ ${fmt(r.sold_90d.avg_price)}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {market === undefined && (
                        <button type="button" onClick={() => checkMarket(r)}
                          className="rounded-full border border-black/10 px-2.5 py-1 text-[0.68rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e]">
                          Check market
                        </button>
                      )}
                      {market === "loading" && <Loader2 size={13} className="animate-spin text-[#9ca3af]" />}
                      {market === "error" && <span className="text-[0.7rem] text-red-500">failed</span>}
                      {market !== undefined && market !== "loading" && market !== "error" && (
                        market.count > 0 && market.avg_price !== null ? (
                          <span className="text-[0.72rem]">
                            <span className="font-bold">Ø {fmt(market.avg_price)}</span>
                            <span className="text-[#9ca3af]"> ({market.count})</span>
                            {market.vs_market_pct !== null && (
                              <span className={market.vs_market_pct > 0 ? "text-red-600" : "text-emerald-700"}>
                                {" "}{market.vs_market_pct > 0 ? "+" : ""}{market.vs_market_pct}%
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[0.7rem] text-[#9ca3af]" title={market.note ?? undefined}>no comparables</span>
                        )
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      {r.suggested_price !== null ? (
                        <button type="button" title="Use as new price"
                          onClick={() => setPriceDrafts((d) => ({ ...d, [r.id]: String(r.suggested_price) }))}
                          className="font-mono font-bold text-[#f4511e] underline-offset-2 hover:underline">
                          {fmt(r.suggested_price)}
                        </button>
                      ) : <HelpCircle size={13} className="ml-auto text-[#d1d5db]" />}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <input type="number" step="0.01" min="0" placeholder="—"
                          value={priceDrafts[r.id] ?? ""}
                          onChange={(e) => setPriceDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                          className="h-7 w-20 rounded-lg border border-black/[0.09] px-2 text-right font-mono text-[0.75rem] outline-none transition focus:border-[#f4511e]" />
                        <button type="button" disabled={applying === r.id || !priceDrafts[r.id]}
                          onClick={() => doApply(r)}
                          className="rounded-full bg-[#f4511e] px-2.5 py-1 text-[0.68rem] font-bold text-white transition hover:bg-[#df4618] disabled:opacity-40">
                          {applying === r.id ? "…" : "Apply"}
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live eBay listings the catalogue does not know */}
      {meta && meta.unmatched_listings.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-[0.8rem] font-extrabold text-[#1a1a1a]">
            On eBay, but not in the panel ({meta.unmatched_listings.length})
          </h2>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
            <table className="w-full text-left text-[0.78rem]">
              <thead>
                <tr className="border-b border-black/[0.08] bg-[#f8f9fa] text-[#6b7280]">
                  <th className="px-3 py-2 font-bold">Listing</th>
                  <th className="px-3 py-2 font-bold">SKU</th>
                  <th className="px-3 py-2 text-right font-bold">Live price</th>
                  <th className="px-3 py-2 font-bold">Market</th>
                  <th className="px-3 py-2 text-right font-bold">Qty</th>
                  <th className="px-3 py-2 font-bold">Listing ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {meta.unmatched_listings.map((l) => {
                  const um = uMarkets[l.sku];
                  return (
                  <tr key={l.sku}>
                    <td className="max-w-[300px] truncate px-3 py-2 font-semibold text-[#1a1a1a]" title={l.title ?? undefined}>{l.title ?? "—"}</td>
                    <td className="px-3 py-2 font-mono font-bold">{l.sku}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmt(l.price)} {l.currency ?? ""}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {um === undefined && (
                        <button type="button" onClick={() => checkUnmatchedMarket(l)}
                          className="rounded-full border border-black/10 px-2.5 py-1 text-[0.68rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e]">
                          Check market
                        </button>
                      )}
                      {um === "loading" && <Loader2 size={13} className="animate-spin text-[#9ca3af]" />}
                      {um === "error" && <span className="text-[0.7rem] text-red-500">failed</span>}
                      {um !== undefined && um !== "loading" && um !== "error" && (
                        um.count > 0 && um.avg_price !== null ? (
                          <span className="text-[0.72rem]">
                            <span className="font-bold">Ø {fmt(um.avg_price)}</span>
                            <span className="text-[#9ca3af]"> ({um.count})</span>
                            {um.vs_market_pct !== null && (
                              <span className={um.vs_market_pct > 0 ? "text-red-600" : "text-emerald-700"}>
                                {" "}{um.vs_market_pct > 0 ? "+" : ""}{um.vs_market_pct}%
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[0.7rem] text-[#9ca3af]" title={um.note ?? undefined}>no comparables</span>
                        )
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">{l.quantity ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-[#9ca3af]">{l.listing_id ?? "—"}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-[0.72rem] text-[#9ca3af]">
            These are live on eBay with no matching product SKU in the catalogue — sales of these bypass the system&apos;s stock, cost, and margin tracking entirely.
          </p>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-[0.72rem] text-[#9ca3af]">
        <AlertCircle size={13} className="mt-0.5 shrink-0" />
        <span>
          Fees are modelled ({meta ? `${meta.fee_model.fee_percent}% + ${fmt(meta.fee_model.fee_fixed)} € per sale` : "…"}) — verify against a real eBay
          payout statement and correct EBAY_FEE_PERCENT / EBAY_FEE_FIXED if it differs. &ldquo;Apply&rdquo; changes the price on the website AND the live eBay
          listing together. Prices themselves are set on the Tyre Pricing page (Tyre100 cost × tier margin); drift here compares eBay&apos;s live price against
          what that formula says the offer should cost. Every change is logged. Rows without a cost price cannot be judged — fill in cost prices to complete the audit.
        </span>
      </p>
      <p className="mt-1 flex items-start gap-2 text-[0.72rem] text-[#9ca3af]">
        <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
        <span>&ldquo;Market&rdquo; searches live eBay listings for the same brand + size and shows the competitor average — the reference for what the market actually pays.</span>
      </p>
    </div>
  );
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/[0.06]">
      <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">{label}</p>
      <p className={`text-[1.35rem] font-extrabold leading-none ${accent ?? "text-[#1a1a1a]"}`}>{value}</p>
      {sub && <p className="mt-1 text-[0.68rem] text-[#9ca3af]">{sub}</p>}
    </div>
  );
}
