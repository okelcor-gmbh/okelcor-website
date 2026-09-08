"use client";

/**
 * The tier pricing board — the model agreed with the order manager:
 * Tyre100's price (cost_price) is the truth, the tier sets the margin
 * (premium 15% / midrange 20% / budget 30%), the website price bakes in
 * Stripe's 3%, and the eBay offer swaps that for the 9.5% eBay uplift.
 * Assign tiers (per brand or per row), preview both channel prices,
 * apply to the website. eBay offers pick the formula price up
 * automatically on their next push.
 */

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertCircle, AlertTriangle, BookOpen, Calculator, Loader2, RefreshCw, Search, X,
} from "lucide-react";
import {
  getPricingPreview, setTier, applyPricing,
  type PricingRow, type PricingMeta, type PriceTier,
} from "@/app/admin/pricing/actions";

const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TIERS: { value: PriceTier; label: string }[] = [
  { value: "premium",  label: "Premium" },
  { value: "midrange", label: "Mid-range" },
  { value: "budget",   label: "Budget" },
];

type Filter = "all" | "ready" | "missing_tier" | "missing_cost" | "would_change";

export default function TierPricingBoard() {
  const [rows, setRows]           = useState<PricingRow[]>([]);
  const [meta, setMeta]           = useState<PricingMeta | null>(null);
  const [loading, setLoading]     = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice]       = useState<string | null>(null);
  const [filter, setFilter]       = useState<Filter>("all");
  const [q, setQ]                 = useState("");
  const [, startTransition]       = useTransition();

  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [busyRow, setBusyRow]     = useState<number | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);

  // Step-by-step guide — open by default until this person closes it once.
  const [guideOpen, setGuideOpen] = useState(true);
  const [guideTab, setGuideTab]   = useState<"steps" | "table">("steps");
  useEffect(() => {
    try { if (localStorage.getItem("tier_pricing_guide_seen") === "1") setGuideOpen(false); } catch {}
  }, []);
  const toggleGuide = () => {
    setGuideOpen((v) => {
      try { localStorage.setItem("tier_pricing_guide_seen", "1"); } catch {}
      return !v;
    });
  };

  // Brand sweep controls
  const [sweepBrand, setSweepBrand] = useState("");
  const [sweepTier, setSweepTier]   = useState<PriceTier>("premium");
  const [sweeping, setSweeping]     = useState(false);

  const load = useCallback(() => {
    startTransition(async () => {
      const res = await getPricingPreview();
      if (res.error || !res.rows) { setPageError(res.error ?? "Failed to load."); setLoading(false); return; }
      setRows(res.rows);
      setMeta(res.meta ?? null);
      setPageError(null);
      setLoading(false);
      setSelected(new Set());
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => {
        switch (filter) {
          case "ready":        return r.website_price !== null;
          case "missing_tier": return r.tier === null;
          case "missing_cost": return r.cost_price === null;
          case "would_change": return r.price_change !== null;
          default:             return true;
        }
      })
      .filter((r) => !term ||
        `${r.sku ?? ""} ${r.brand ?? ""} ${r.name} ${r.size ?? ""}`.toLowerCase().includes(term));
  }, [rows, filter, q]);

  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const setRowTier = (row: PricingRow, tier: PriceTier) => {
    setBusyRow(row.id);
    startTransition(async () => {
      const res = await setTier(tier, { ids: [row.id] });
      setBusyRow(null);
      if (res.error) { setNotice(res.error); return; }
      load();
    });
  };

  const doSweep = () => {
    if (!sweepBrand) { setNotice("Pick a brand first."); return; }
    const label = TIERS.find((t) => t.value === sweepTier)?.label ?? sweepTier;
    if (!window.confirm(`Set EVERY ${sweepBrand} product to ${label}?`)) return;
    setSweeping(true);
    startTransition(async () => {
      const res = await setTier(sweepTier, { brand: sweepBrand });
      setSweeping(false);
      setNotice(res.error ?? res.message ?? "Tier assigned.");
      if (!res.error) load();
    });
  };

  const doApply = (target: { ids: number[] } | { all: true }) => {
    const n = "all" in target ? (meta?.counts.would_change ?? 0) : target.ids.length;
    const scope = "all" in target ? `all ${n} product(s) the formula can price` : `${n} selected product(s)`;
    if (!window.confirm(`Write the formula's website price for ${scope}? eBay offers pick up their price on the next push.`)) return;
    setApplyingAll(true);
    startTransition(async () => {
      const res = await applyPricing(target);
      setApplyingAll(false);
      if (res.error) { setNotice(res.error); return; }
      const skipped = res.skipped && res.skipped.length > 0
        ? ` Skipped: ${res.skipped.map((s) => `${s.sku ?? s.id} (${s.reason})`).join(", ")}`
        : "";
      setNotice((res.message ?? "Prices updated.") + skipped);
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
        <p className="mb-1 text-[1rem] font-bold text-[#1a1a1a]">Tier pricing unavailable</p>
        <p className="mb-5 max-w-sm text-[0.83rem] text-[#6b7280]">{pageError}</p>
        <button type="button" onClick={() => { setLoading(true); load(); }}
          className="flex items-center gap-2 rounded-full bg-[#f4511e] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#df4618]">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const counts = meta?.counts;
  const model  = meta?.pricing_model;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calculator size={18} className="text-[#f4511e]" strokeWidth={2} />
          <div>
            <h1 className="text-[1.15rem] font-extrabold text-[#1a1a1a]">Tyre Pricing</h1>
            <p className="text-[0.8rem] text-[#6b7280]">
              Give each brand a tier, check the new prices, apply. eBay prices itself on the next push.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <button type="button" disabled={applyingAll}
              onClick={() => doApply({ ids: Array.from(selected) })}
              className="flex items-center gap-2 rounded-full bg-[#f4511e] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60">
              {applyingAll ? <Loader2 size={13} className="animate-spin" /> : <Calculator size={13} />}
              Apply to {selected.size} selected
            </button>
          )}
          <button type="button" disabled={applyingAll || (counts?.would_change ?? 0) === 0}
            onClick={() => doApply({ all: true })}
            className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#333] disabled:opacity-40">
            {applyingAll ? <Loader2 size={13} className="animate-spin" /> : <Calculator size={13} />}
            Apply formula to all ({counts?.would_change ?? 0})
          </button>
          <button type="button" onClick={() => { setLoading(true); load(); }}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[0.8rem] font-semibold text-[#1a1a1a] ring-1 ring-black/[0.08] transition hover:bg-[#f0f2f5]">
            <RefreshCw size={13} /> Refresh
          </button>
          <button type="button" onClick={toggleGuide}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[0.8rem] font-semibold text-[#1a1a1a] ring-1 ring-black/[0.08] transition hover:bg-[#f0f2f5]">
            <BookOpen size={13} /> How this works
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[0.83rem] text-blue-800">
          <span className="min-w-0 break-words">{notice}</span>
          <button type="button" onClick={() => setNotice(null)}><X size={13} /></button>
        </div>
      )}

      {/* The guide, in the words of the person doing the work. Two tabs:
          the four steps, and how to read every column of the table. */}
      {guideOpen && model && (
        <div className="mb-5 rounded-xl border border-[#f4511e]/20 bg-[#fff8f5] p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {([["steps", "How pricing works"], ["table", "Reading the table"]] as ["steps" | "table", string][]).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setGuideTab(key)}
                className={`rounded-full px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.14em] transition ${
                  guideTab === key ? "bg-[#f4511e] text-white" : "bg-white text-[#5c5e62] ring-1 ring-black/[0.06] hover:text-[#1a1a1a]"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {guideTab === "steps" && (
            <ol className="grid gap-3 text-[0.83rem] leading-relaxed text-[#1a1a1a] md:grid-cols-2 xl:grid-cols-4">
              <li className="rounded-lg bg-white p-3.5 ring-1 ring-black/[0.05]">
                <span className="mb-1 block font-extrabold">1. Cost price in</span>
                Every product needs its <strong>Tyre100 cost</strong>, the price we pay the supplier.
                It arrives with the product CSV import. Rows without it show under
                &ldquo;No Tyre100 cost&rdquo; and are never repriced.
              </li>
              <li className="rounded-lg bg-white p-3.5 ring-1 ring-black/[0.05]">
                <span className="mb-1 block font-extrabold">2. Pick the tier</span>
                Use &ldquo;Assign a whole brand&rdquo; below. <strong>Premium {model.margins.premium}%</strong> for Michelin and
                Continental, <strong>Mid-range {model.margins.midrange}%</strong> for Hankook and Falken,
                <strong> Budget {model.margins.budget}%</strong> for Rapid and other value brands. The tier is the profit margin.
              </li>
              <li className="rounded-lg bg-white p-3.5 ring-1 ring-black/[0.05]">
                <span className="mb-1 block font-extrabold">3. Check the new prices</span>
                Look down the <strong>Change</strong> column before anything else. Big red numbers mean big price
                cuts. If a cut looks wrong, check the cost price first, then the tier. The
                &ldquo;Reading the table&rdquo; tab walks through every column with a real tyre.
              </li>
              <li className="rounded-lg bg-white p-3.5 ring-1 ring-black/[0.05]">
                <span className="mb-1 block font-extrabold">4. Apply</span>
                &ldquo;Apply formula to all&rdquo; writes the New website price to the site. eBay listings take
                their eBay price automatically the next time they are pushed or updated. Nothing to type there.
              </li>
            </ol>
          )}

          {guideTab === "table" && (
            <div className="text-[0.83rem] leading-relaxed text-[#1a1a1a]">
              <div className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-lg bg-white p-3.5 ring-1 ring-black/[0.05]">
                  <span className="mb-1 block font-extrabold">Tyre100 cost</span>
                  What we pay the supplier for one tyre. Everything else is built on this number.
                </div>
                <div className="rounded-lg bg-white p-3.5 ring-1 ring-black/[0.05]">
                  <span className="mb-1 block font-extrabold">Price now</span>
                  What okelcor.com charges today, before the formula. The old price, nothing more.
                </div>
                <div className="rounded-lg bg-white p-3.5 ring-1 ring-black/[0.05]">
                  <span className="mb-1 block font-extrabold">New website price</span>
                  Cost, plus the tier margin, plus the {model.stripe_fee_percent}% card fee.
                  This is what Apply writes to the site.
                </div>
                <div className="rounded-lg bg-white p-3.5 ring-1 ring-black/[0.05]">
                  <span className="mb-1 block font-extrabold">New eBay price</span>
                  Same cost and margin, but with the {model.ebay_uplift_percent}% eBay charges instead of the card
                  fee. Pushed to eBay on the next listing update. The live eBay price sits on the eBay Price Audit page.
                </div>
                <div className="rounded-lg bg-white p-3.5 ring-1 ring-black/[0.05]">
                  <span className="mb-1 block font-extrabold">Change</span>
                  New website price minus Price now. <span className="font-semibold text-red-600">Red and negative:</span> Apply
                  lowers the site price by that amount. <span className="font-semibold text-emerald-700">Green and positive:</span> it rises.
                  Blank: already matching.
                </div>
              </div>
              <div className="rounded-lg bg-white p-3.5 ring-1 ring-black/[0.05]">
                <span className="mb-1 block font-extrabold">A real tyre, worked through</span>
                A Michelin CrossClimate with a Tyre100 cost of <strong>126.93</strong> on the Premium tier:
                126.93 plus {model.margins.premium}% margin is 145.97. Website adds the {model.stripe_fee_percent}% card
                fee: <strong>150.35</strong>. eBay adds its {model.ebay_uplift_percent}% instead: <strong>159.84</strong>.
                If the site charged 205.28 before, Change reads <strong className="text-red-600">minus 54.93</strong>,
                because the agreed margin prices this tyre 54.93 below the old price. That is a decision to look
                at before you press Apply, and exactly what the column exists to show you.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      {counts && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard label="Products" value={counts.total} />
          <SummaryCard label="Ready to price" value={counts.ready} accent="text-emerald-600" sub="cost + tier set" />
          <SummaryCard label="Would change" value={counts.would_change} accent={counts.would_change > 0 ? "text-[#f4511e]" : undefined} sub="site price ≠ formula" />
          <SummaryCard label="No tier yet" value={counts.missing_tier} accent={counts.missing_tier > 0 ? "text-amber-600" : undefined} sub="assign below" />
          <SummaryCard label="No Tyre100 cost" value={counts.missing_cost} accent={counts.missing_cost > 0 ? "text-gray-500" : undefined} sub="fill in cost price" />
        </div>
      )}

      {/* Brand sweep */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/[0.06]">
        <span className="text-[0.78rem] font-bold text-[#1a1a1a]">Assign a whole brand:</span>
        <select value={sweepBrand} onChange={(e) => setSweepBrand(e.target.value)}
          className="h-8 rounded-lg border border-black/[0.09] bg-white px-2 text-[0.78rem] outline-none focus:border-[#f4511e]">
          <option value="">Pick a brand…</option>
          {(meta?.brands ?? []).map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={sweepTier} onChange={(e) => setSweepTier(e.target.value as PriceTier)}
          className="h-8 rounded-lg border border-black/[0.09] bg-white px-2 text-[0.78rem] outline-none focus:border-[#f4511e]">
          {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button type="button" disabled={sweeping || !sweepBrand} onClick={doSweep}
          className="rounded-full bg-[#1a1a1a] px-3.5 py-1.5 text-[0.75rem] font-bold text-white transition hover:bg-[#333] disabled:opacity-40">
          {sweeping ? "…" : "Set tier"}
        </button>
        <span className="text-[0.72rem] text-[#9ca3af]">Tiers are usually a brand-level call. Michelin is premium everywhere.</span>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([
          ["all", `All (${rows.length})`],
          ["would_change", `Would change (${counts?.would_change ?? 0})`],
          ["ready", `Ready (${counts?.ready ?? 0})`],
          ["missing_tier", `No tier (${counts?.missing_tier ?? 0})`],
          ["missing_cost", `No cost (${counts?.missing_cost ?? 0})`],
        ] as [Filter, string][]).map(([f, label]) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-[0.75rem] font-bold transition ${
              filter === f ? "bg-[#1a1a1a] text-white" : "bg-white text-[#5c5e62] ring-1 ring-black/[0.08] hover:bg-[#f0f2f5]"
            }`}>
            {label}
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
          <table className="w-full min-w-[1000px] text-left text-[0.78rem]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-[#f8f9fa] text-[#6b7280]">
                <th className="w-8 px-3 py-2.5">
                  <input type="checkbox" aria-label="Select all visible"
                    checked={visible.length > 0 && visible.every((r) => selected.has(r.id))}
                    onChange={(e) => setSelected(e.target.checked ? new Set(visible.map((r) => r.id)) : new Set())} />
                </th>
                <th className="px-3 py-2.5 font-bold">Product</th>
                <th className="px-3 py-2.5 font-bold">Tier</th>
                <th className="px-3 py-2.5 text-right font-bold" title="What we pay the supplier, imported with the product CSV">Tyre100 cost</th>
                <th className="px-3 py-2.5 text-right font-bold" title="What the website charges right now">Price now</th>
                <th className="px-3 py-2.5 text-right font-bold" title="What the website WILL charge after Apply: cost + margin + card fee">New website price</th>
                <th className="px-3 py-2.5 text-right font-bold" title="What the eBay listing will be pushed at: cost + margin + eBay charges">New eBay price</th>
                <th className="px-3 py-2.5 text-right font-bold" title="New website price minus Price now. Negative (red) = the site price would DROP by this much when you Apply; positive (green) = it would rise. Blank = already matching.">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {visible.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#9ca3af]">Nothing matches this filter.</td></tr>
              )}
              {visible.map((r) => (
                <tr key={r.id} className={r.price_change !== null ? "bg-orange-50/40" : ""}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" aria-label={`Select ${r.sku ?? r.name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td className="max-w-[240px] px-3 py-2.5">
                    <p className="truncate font-bold text-[#1a1a1a]">
                      {r.brand} {r.name}
                      {r.ebay_listed && <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[0.6rem] font-bold text-blue-700">eBay</span>}
                      {!r.is_active && <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[0.6rem] font-bold text-gray-600">inactive</span>}
                    </p>
                    <p className="truncate text-[0.7rem] text-[#9ca3af]">
                      {r.size ?? ""} {r.season ? `· ${r.season}` : ""} {r.type ? `· ${r.type.toUpperCase()}` : ""} · {r.sku} · stock {r.stock}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <select value={r.tier ?? ""} disabled={busyRow === r.id}
                      onChange={(e) => e.target.value && setRowTier(r, e.target.value as PriceTier)}
                      className={`h-7 rounded-lg border px-1.5 text-[0.72rem] outline-none focus:border-[#f4511e] ${
                        r.tier === null ? "border-amber-300 bg-amber-50 text-amber-700" : "border-black/[0.09] bg-white"
                      }`}>
                      <option value="">no tier</option>
                      {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono">{fmt(r.cost_price)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[#6b7280]">{fmt(r.current_price)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-bold">{fmt(r.website_price)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-bold text-blue-800">{fmt(r.ebay_price)}</td>
                  <td className={`whitespace-nowrap px-3 py-2.5 text-right font-mono font-bold ${
                    r.price_change === null ? "text-[#c2c6cc]" : r.price_change > 0 ? "text-emerald-700" : "text-red-600"
                  }`}>
                    {r.price_change === null ? "—" : `${r.price_change > 0 ? "+" : ""}${fmt(r.price_change)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-[0.72rem] text-[#9ca3af]">
        <AlertCircle size={13} className="mt-0.5 shrink-0" />
        <span>
          &ldquo;Tyre100 cost&rdquo; is the supplier price, imported with the product CSV. &ldquo;Apply&rdquo; writes the New website price to the site.
          The New eBay price is NOT pushed from here: every eBay list or update carries it automatically, so re-push listings from the eBay page
          after repricing. Margins and fees are configurable without a deploy.
        </span>
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
