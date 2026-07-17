"use client";

import { useState, useCallback } from "react";
import {
  Search, Loader2, ExternalLink, AlertCircle,
  ShoppingBag, TrendingUp, TrendingDown, Minus,
  ChevronDown,
} from "lucide-react";
import type { AdminProduct } from "@/lib/admin-api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EbayItem {
  item_id?:           string;
  title?:             string;
  price?:             string | number;
  currency?:          string;
  condition?:         string;
  seller?:            string;
  quantity_available?: number;
  image?:             string;
  url?:               string;
}

interface SupplierSummary {
  count: number;
  currency?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  avg_price?: number | null;
}

interface MarketplaceLinks {
  alibaba?: string;
  made_in_china?: string;
}

interface YourProduct {
  id: number; sku: string; brand: string; name: string; size: string; type: string;
  price: number; price_b2b?: number | null; price_b2c?: number | null;
  price_vs_market_pct?: number | null;
}

// API shape: { data: EbayItem[], summary, marketplace_links, meta: { total: number }, note? }
interface SupplierSearchResponse {
  data?: EbayItem[];
  summary?: SupplierSummary;
  marketplace_links?: MarketplaceLinks;
  meta?: { total?: number };
  note?: string;
  message?: string;
}

interface ForProductResponse extends SupplierSearchResponse {
  your_product?: YourProduct;
}

type SearchState = "idle" | "loading" | "done" | "error";
type ProductType = "pcr" | "tbr" | "used" | "otr";

const TYPE_TABS: { value: ProductType | ""; label: string }[] = [
  { value: "",    label: "All" },
  { value: "pcr", label: "PCR" },
  { value: "tbr", label: "TBR" },
  { value: "used", label: "Used" },
  { value: "otr", label: "OTR" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAdminToken(): Promise<string> {
  try {
    const res = await fetch("/api/admin/token");
    if (!res.ok) return "";
    const { token } = await res.json() as { token?: string };
    return token ?? "";
  } catch {
    return "";
  }
}

function buildExternalUrl(base: string, query: string): string {
  return `${base}${encodeURIComponent(query)}`;
}

const EXTERNAL_LINKS = [
  { label: "Global Sources", base: "https://www.globalsources.com/search?keyword=" },
  { label: "DHgate",         base: "https://www.dhgate.com/wholesale/search.do?searchkey=" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-black/[0.06] bg-white">
      <div className="h-36 w-full bg-[#f0f2f5]" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 rounded bg-[#f0f2f5]" />
        <div className="h-3 w-1/2 rounded bg-[#f0f2f5]" />
        <div className="mt-2 h-5 w-1/3 rounded bg-[#f0f2f5]" />
      </div>
    </div>
  );
}

function EbayCard({ item }: { item: EbayItem }) {
  const priceNum = item.price != null ? parseFloat(String(item.price)) : NaN;
  const price = !isNaN(priceNum) ? `€${priceNum.toFixed(2)}` : "—";

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white transition hover:shadow-md">
      {/* Image */}
      {item.image ? (
        <div className="h-36 w-full shrink-0 bg-[#f8f8f8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.title ?? ""}
            className="h-full w-full object-contain p-2"
          />
        </div>
      ) : (
        <div className="flex h-36 w-full shrink-0 items-center justify-center bg-[#f8f8f8]">
          <ShoppingBag size={28} className="text-[#d1d5db]" />
        </div>
      )}

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-[0.8rem] font-medium leading-snug text-[#1a1a1a]">
          {item.title ?? "—"}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {item.condition && (
            <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[0.67rem] font-semibold text-[#5c5e62]">
              {item.condition}
            </span>
          )}
          {item.quantity_available != null && (
            <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[0.67rem] font-semibold text-[#5c5e62]">
              {item.quantity_available} avail.
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div>
            <p className="text-[1rem] font-extrabold text-[#1a1a1a]">{price}</p>
            {item.seller && (
              <p className="text-[0.68rem] text-[#9ca3af]">by {item.seller}</p>
            )}
          </div>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 rounded-lg bg-[#E85C1A] px-3 py-1.5 text-[0.72rem] font-semibold text-white transition hover:bg-[#d14f14]"
            >
              View <ExternalLink size={10} strokeWidth={2.2} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Price comparison strip ────────────────────────────────────────────────────

function PriceStrip({
  okelcorPrice,
  lowestEbay,
  priceVsMarketPct,
}: {
  okelcorPrice: number | null;
  lowestEbay: number | null;
  priceVsMarketPct?: number | null;
}) {
  if (okelcorPrice == null && lowestEbay == null) return null;

  const diff =
    okelcorPrice != null && lowestEbay != null
      ? okelcorPrice - lowestEbay
      : null;

  const MarginIcon =
    diff == null ? null
    : diff > 0   ? TrendingUp
    : diff < 0   ? TrendingDown
    : Minus;

  const marginColor =
    diff == null   ? ""
    : diff > 0     ? "text-emerald-600"
    : diff < 0     ? "text-red-500"
    : "text-[#5c5e62]";

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="border-b border-black/[0.06] px-5 py-3">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
          Price Comparison
        </p>
      </div>
      <div className="flex flex-wrap gap-0 divide-x divide-black/[0.06]">
        {okelcorPrice != null && (
          <div className="flex min-w-[160px] flex-1 flex-col gap-0.5 px-5 py-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">
              Okelcor Sell Price
            </p>
            <p className="text-[1.35rem] font-extrabold text-[#1a1a1a]">
              €{okelcorPrice.toFixed(2)}
            </p>
          </div>
        )}
        {lowestEbay != null && (
          <div className="flex min-w-[160px] flex-1 flex-col gap-0.5 px-5 py-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">
              Lowest eBay Buy Price
            </p>
            <p className="text-[1.35rem] font-extrabold text-[#1a1a1a]">
              €{lowestEbay.toFixed(2)}
            </p>
          </div>
        )}
        {diff != null && MarginIcon && (
          <div className="flex min-w-[180px] flex-1 flex-col gap-0.5 px-5 py-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">
              Margin Indicator
            </p>
            <div className={`flex items-center gap-1.5 ${marginColor}`}>
              <MarginIcon size={20} strokeWidth={2.2} />
              <p className="text-[1.35rem] font-extrabold">
                {diff >= 0 ? "+" : ""}€{diff.toFixed(2)}
              </p>
            </div>
            <p className="text-[0.7rem] text-[#9ca3af]">
              {diff > 0
                ? "Selling above buy price — positive margin"
                : diff < 0
                ? "Selling below buy price — review pricing"
                : "Break-even — no margin"}
            </p>
          </div>
        )}
        {priceVsMarketPct != null && (
          <div className="flex min-w-[180px] flex-1 flex-col gap-0.5 px-5 py-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">
              vs. Market (eBay resale avg.)
            </p>
            <p className={`text-[1.35rem] font-extrabold ${priceVsMarketPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {priceVsMarketPct >= 0 ? "+" : ""}{priceVsMarketPct.toFixed(1)}%
            </p>
            <p className="text-[0.7rem] text-[#9ca3af]">
              Resale-price benchmark only — not a wholesale-cost analysis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export default function SupplierIntel({ products }: { products: AdminProduct[] }) {
  const [query,          setQuery]          = useState("");
  const [selectedId,     setSelectedId]     = useState<number | "">("");
  const [typeFilter,     setTypeFilter]     = useState<ProductType | "">("");
  const [searchState,    setSearchState]    = useState<SearchState>("idle");
  const [ebayItems,      setEbayItems]      = useState<EbayItem[]>([]);
  const [ebayError,      setEbayError]      = useState<string | null>(null);
  const [summary,        setSummary]        = useState<SupplierSummary | null>(null);
  const [marketplaceLinks, setMarketplaceLinks] = useState<MarketplaceLinks | null>(null);
  const [otrNote,        setOtrNote]        = useState<string | null>(null);
  const [yourProduct,    setYourProduct]    = useState<YourProduct | null>(null);
  const [alibabaLoading, setAlibabaLoading] = useState(false);
  const [micLoading,     setMicLoading]     = useState(false);
  const [checkingMarket, setCheckingMarket] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedId) ?? null;
  const lowestEbayPrice = (() => {
    if (summary?.min_price != null) return summary.min_price;
    const nums = ebayItems
      .map((i) => parseFloat(String(i.price ?? "")))
      .filter((n) => !isNaN(n));
    return nums.length > 0 ? Math.min(...nums) : null;
  })();

  function normalizeType(raw?: string): ProductType | "" {
    const v = (raw ?? "").trim().toLowerCase();
    return (["pcr", "tbr", "used", "otr"] as const).includes(v as ProductType) ? (v as ProductType) : "";
  }

  // Sync product dropdown → query input + type filter
  const handleProductSelect = (id: number | "") => {
    setSelectedId(id);
    setYourProduct(null);
    if (id === "") return;
    const p = products.find((x) => x.id === id);
    if (p) {
      const q = [p.brand, p.size].filter(Boolean).join(" ").trim();
      setQuery(q);
      setTypeFilter(normalizeType(p.type));
    }
  };

  const applyResult = (json: SupplierSearchResponse | ForProductResponse) => {
    const items = (Array.isArray(json.data) ? json.data : []).slice(0, 20);
    setEbayItems(items);
    setSummary(json.summary ?? null);
    setMarketplaceLinks(json.marketplace_links ?? null);
    setOtrNote(json.note ?? null);
    setSearchState("done");
  };

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;

    setSearchState("loading");
    setEbayItems([]);
    setEbayError(null);
    setYourProduct(null);

    const token = await getAdminToken();
    try {
      const params = new URLSearchParams({ q });
      if (typeFilter) params.set("type", typeFilter);
      const url = `${API_BASE}/admin/supplier/search?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        setEbayError("eBay search failed — check the API key or try again.");
        setSearchState("error");
        return;
      }

      const json = await res.json() as SupplierSearchResponse;
      applyResult(json);
    } catch {
      setEbayError("Could not reach the supplier search service.");
      setSearchState("error");
    }
  }, [query, typeFilter]);

  const checkMarketForProduct = async (id: number) => {
    setCheckingMarket(true);
    setSearchState("loading");
    setEbayItems([]);
    setEbayError(null);
    setYourProduct(null);

    const token = await getAdminToken();
    try {
      const url = `${API_BASE}/admin/supplier/for-product/${id}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        setEbayError("Could not check the market for this product — try again.");
        setSearchState("error");
        return;
      }

      const json = await res.json() as ForProductResponse;
      setYourProduct(json.your_product ?? null);
      applyResult(json);
    } catch {
      setEbayError("Could not reach the supplier search service.");
      setSearchState("error");
    } finally {
      setCheckingMarket(false);
    }
  };

  const openAlibaba = async () => {
    if (marketplaceLinks?.alibaba) {
      window.open(marketplaceLinks.alibaba, "_blank", "noopener");
      return;
    }
    const q = query.trim();
    if (!q) return;
    setAlibabaLoading(true);
    const token = await getAdminToken();
    try {
      const url = `${API_BASE}/admin/supplier/alibaba-link?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json() as { url?: string; data?: { url?: string } };
        const link = json.url ?? json.data?.url;
        if (link) { window.open(link, "_blank", "noopener"); return; }
      }
    } catch { /* fall through to default */ } finally {
      setAlibabaLoading(false);
    }
    // Fallback: construct Alibaba search URL directly
    window.open(buildExternalUrl("https://www.alibaba.com/trade/search?SearchText=", q), "_blank", "noopener");
  };

  const openMadeInChina = async () => {
    if (marketplaceLinks?.made_in_china) {
      window.open(marketplaceLinks.made_in_china, "_blank", "noopener");
      return;
    }
    const q = query.trim();
    if (!q) return;
    setMicLoading(true);
    const token = await getAdminToken();
    try {
      const url = `${API_BASE}/admin/supplier/made-in-china-link?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json() as { url?: string; data?: { url?: string } };
        const link = json.url ?? json.data?.url;
        if (link) { window.open(link, "_blank", "noopener"); return; }
      }
    } catch { /* fall through to default */ } finally {
      setMicLoading(false);
    }
    // Fallback: construct Made-in-China search URL directly
    window.open(buildExternalUrl("https://www.made-in-china.com/multi-search/q=", q), "_blank", "noopener");
  };

  const isLoading = searchState === "loading";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Search bar ── */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
        <div className="border-b border-black/[0.06] px-5 py-4">
          <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
            Search
          </p>

          {/* Type tabs — tunes size-pattern parsing on the backend */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                onClick={() => setTypeFilter(tab.value)}
                className={`rounded-full px-3 py-1 text-[0.75rem] font-semibold transition ${
                  typeFilter === tab.value
                    ? "bg-[#E85C1A] text-white"
                    : "border border-black/[0.09] bg-white text-[#5c5e62] hover:border-[#E85C1A]/40 hover:text-[#E85C1A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Product pre-fill dropdown */}
          {products.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="relative max-w-sm flex-1">
                <select
                  value={selectedId}
                  onChange={(e) =>
                    handleProductSelect(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="h-9 w-full appearance-none rounded-lg border border-black/[0.09] bg-[#fafafa] pl-3 pr-8 text-[0.8rem] text-[#374151] outline-none transition focus:border-[#E85C1A] focus:ring-1 focus:ring-[#E85C1A]/20"
                >
                  <option value="">— Pre-fill from catalogue product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {[p.size, p.brand, p.name].filter(Boolean).join(" · ")}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              </div>
              {selectedProduct && (
                <button
                  type="button"
                  onClick={() => checkMarketForProduct(selectedProduct.id)}
                  disabled={checkingMarket}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#E85C1A]/30 bg-[#fff8f6] px-3 text-[0.8rem] font-semibold text-[#E85C1A] transition hover:bg-[#ffece6] disabled:opacity-50"
                >
                  {checkingMarket ? <Loader2 size={13} className="animate-spin" /> : <TrendingUp size={13} strokeWidth={2.2} />}
                  Check market for this product
                </button>
              )}
            </div>
          )}

          {/* Query input + Search button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="e.g. 205/55R16 Michelin"
                className="h-10 w-full rounded-lg border border-black/[0.09] bg-[#fafafa] pl-9 pr-3 text-[0.88rem] text-[#1a1a1a] outline-none placeholder:text-[#9ca3af] transition focus:border-[#E85C1A] focus:bg-white focus:ring-1 focus:ring-[#E85C1A]/20"
              />
            </div>
            <button
              type="button"
              onClick={runSearch}
              disabled={!query.trim() || isLoading}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#E85C1A] px-5 text-[0.85rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Search size={14} strokeWidth={2.2} />
              )}
              Search
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column results ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Left: eBay ── */}
        <div className="flex flex-col gap-4">
          {/* Column header */}
          <div className="flex items-center gap-3">
            {/* eBay wordmark — inline SVG to avoid external image fetch */}
            <svg viewBox="0 0 80 32" width="60" height="24" aria-label="eBay" fill="none">
              <text x="0" y="26" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="28">
                <tspan fill="#E53238">e</tspan>
                <tspan fill="#0064D2">B</tspan>
                <tspan fill="#F5AF02">a</tspan>
                <tspan fill="#86B817">y</tspan>
              </text>
            </svg>
            <div>
              <p className="text-[0.88rem] font-bold text-[#1a1a1a]">eBay Suppliers</p>
              <p className="text-[0.72rem] text-[#9ca3af]">Germany · up to 20 results</p>
            </div>
          </div>

          {/* Loading skeletons */}
          {isLoading && (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error */}
          {searchState === "error" && ebayError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {ebayError}
            </div>
          )}

          {/* Results grid */}
          {searchState === "done" && (
            <>
              {ebayItems.length === 0 ? (
                <div className="rounded-xl border border-black/[0.06] bg-white px-5 py-8 text-center">
                  {otrNote ? (
                    <>
                      <p className="text-[0.85rem] font-semibold text-[#1a1a1a]">Not an eBay category</p>
                      <p className="mt-1 text-[0.8rem] text-[#5c5e62]">{otrNote}</p>
                      <p className="mt-1 text-[0.75rem] text-[#9ca3af]">Use the global B2B marketplace links instead →</p>
                    </>
                  ) : (
                    <p className="text-[0.85rem] text-[#5c5e62]">No eBay results found for this query.</p>
                  )}
                </div>
              ) : (
                <>
                  {/* Summary stats */}
                  {summary && summary.count > 0 && (
                    <div className="grid grid-cols-3 gap-2 rounded-xl border border-black/[0.06] bg-white px-4 py-3">
                      {[
                        ["Results", String(summary.count)],
                        ["Avg. Price", summary.avg_price != null ? `€${summary.avg_price.toFixed(2)}` : "—"],
                        ["Range", summary.min_price != null && summary.max_price != null ? `€${summary.min_price.toFixed(0)}–${summary.max_price.toFixed(0)}` : "—"],
                      ].map(([label, value]) => (
                        <div key={label} className="text-center">
                          <p className="text-[0.95rem] font-extrabold text-[#1a1a1a]">{value}</p>
                          <p className="text-[0.65rem] uppercase tracking-wide text-[#9ca3af]">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[0.78rem] text-[#9ca3af]">
                    {ebayItems.length} result{ebayItems.length !== 1 ? "s" : ""} found
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {ebayItems.map((item, i) => (
                      <EbayCard key={item.item_id ?? i} item={item} />
                    ))}
                  </div>
                </>
              )}

              {/* Marketplace quick links — also returned inline with search results */}
              {marketplaceLinks && (marketplaceLinks.alibaba || marketplaceLinks.made_in_china) && (
                <div className="flex flex-wrap gap-2">
                  {marketplaceLinks.alibaba && (
                    <a href={marketplaceLinks.alibaba} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:border-[#FF6A00]/40 hover:text-[#FF6A00]">
                      Alibaba <ExternalLink size={10} />
                    </a>
                  )}
                  {marketplaceLinks.made_in_china && (
                    <a href={marketplaceLinks.made_in_china} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:border-[#E85C1A]/40 hover:text-[#E85C1A]">
                      Made-in-China <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}
            </>
          )}

          {/* Idle prompt */}
          {searchState === "idle" && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.1] bg-white py-12 text-center">
              <Search size={24} className="mb-3 text-[#d1d5db]" />
              <p className="text-[0.83rem] text-[#9ca3af]">Enter a tyre size, brand or SKU to search eBay Germany</p>
            </div>
          )}
        </div>

        {/* ── Right: Global B2B ── */}
        <div className="flex flex-col gap-4">
          {/* Column header */}
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 120 32" width="80" height="24" aria-label="Alibaba" fill="none">
              <text x="0" y="24" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="22" fill="#FF6A00">
                alibaba
              </text>
            </svg>
            <div>
              <p className="text-[0.88rem] font-bold text-[#1a1a1a]">Global Suppliers</p>
              <p className="text-[0.72rem] text-[#9ca3af]">Alibaba · B2B marketplaces</p>
            </div>
          </div>

          {/* Alibaba + Made-in-China search buttons */}
          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
            <div className="flex flex-col gap-2.5 px-5 py-5">
              <button
                type="button"
                onClick={openAlibaba}
                disabled={(!query.trim() && !marketplaceLinks?.alibaba) || alibabaLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-5 py-3 text-[0.88rem] font-semibold text-white transition hover:bg-[#e05e00] disabled:opacity-50"
              >
                {alibabaLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ExternalLink size={15} strokeWidth={2.2} />
                )}
                Search on Alibaba.com
              </button>
              <button
                type="button"
                onClick={openMadeInChina}
                disabled={(!query.trim() && !marketplaceLinks?.made_in_china) || micLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E85C1A] px-5 py-3 text-[0.88rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50"
              >
                {micLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ExternalLink size={15} strokeWidth={2.2} />
                )}
                Search on Made-in-China.com
              </button>
              <p className="mt-1 text-center text-[0.75rem] leading-relaxed text-[#9ca3af]">
                Neither marketplace provides a direct listings API. Buttons open a pre-filled search — Made-in-China is often the stronger channel for bulk TBR/OTR sourcing.
              </p>
            </div>

            {/* Quick links */}
            <div className="border-t border-black/[0.06] px-5 py-4">
              <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
                Other B2B marketplaces
              </p>
              <div className="flex flex-col gap-2">
                {EXTERNAL_LINKS.map(({ label, base }) => (
                  <a
                    key={label}
                    href={query.trim() ? buildExternalUrl(base, query.trim()) : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { if (!query.trim()) e.preventDefault(); }}
                    className="flex items-center justify-between rounded-lg border border-black/[0.07] px-4 py-2.5 text-[0.82rem] font-medium text-[#1a1a1a] transition hover:border-[#E85C1A]/40 hover:bg-[#fff8f6] hover:text-[#E85C1A]"
                  >
                    <span>Search on {label}</span>
                    <ExternalLink size={12} strokeWidth={2} className="shrink-0 text-[#9ca3af]" />
                  </a>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="bg-[#fafafa] px-5 py-3">
              <p className="text-[0.73rem] leading-relaxed text-[#9ca3af]">
                <span className="font-semibold text-[#5c5e62]">Tip:</span> For best results on Alibaba, use just the tyre size (e.g. <em>205/55R16</em>) or brand name without extra keywords.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Price comparison strip ── */}
      <PriceStrip
        okelcorPrice={yourProduct ? Number(yourProduct.price) : selectedProduct ? Number(selectedProduct.price) : null}
        lowestEbay={lowestEbayPrice}
        priceVsMarketPct={yourProduct?.price_vs_market_pct ?? null}
      />

    </div>
  );
}
