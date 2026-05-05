"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Loader2, RotateCcw } from "lucide-react";
import ProductGrid from "./product-grid";
import ShopPromoBanner, { type ShopPromotion } from "./shop-promo-banner";
import ShopCampaignBanner, { type CampaignPromotion } from "./shop-campaign-banner";
import { type Product } from "./data";
import { type ActiveCampaign } from "./product-card";
import { useLanguage } from "@/context/language-context";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { getProductImageUrl } from "@/lib/utils";
import { trackTyreSpecSelected } from "@/lib/analytics";

// ── API ───────────────────────────────────────────────────────────────────────

// Products are fetched through the Next.js proxy to avoid CORS issues.
// Brands and specs also proxied — direct browser-to-API calls fail cross-origin.
const PRODUCTS_API = "/api/shop/products";
const BRANDS_API   = "/api/shop/brands";
const SPECS_API    = "/api/shop/specs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImagePath(entry: any): string {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  return entry.path ?? entry.url ?? entry.image_url ?? "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(p: any): Product {
  const rawPrimary: string = p.primary_image || p.image_url || p.image || extractImagePath(p.images?.[0]) || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleryPaths: string[] = (p.images ?? []).map((x: any) => extractImagePath(x)).filter(Boolean);
  // Primary first, then any gallery images that differ from primary
  const allPaths = [rawPrimary, ...galleryPaths.filter((p) => p !== rawPrimary)].filter(Boolean);
  return {
    id:            p.id,
    brand:         p.brand        ?? "",
    name:          p.name         ?? "",
    size:          p.size         ?? "",
    spec:          p.spec         ?? "",
    season:        p.season       ?? "",
    type:          p.type         ?? "",
    price:         Number(p.price ?? 0),
    price_b2b:     p.price_b2b != null && Number(p.price_b2b) > 0 ? Number(p.price_b2b) : undefined,
    price_b2c:     p.price_b2c != null && Number(p.price_b2c) > 0 ? Number(p.price_b2c) : undefined,
    sku:           p.sku          ?? "",
    description:   p.description  ?? "",
    primary_image: rawPrimary,
    image:         getProductImageUrl(rawPrimary),
    images:        allPaths.map(getProductImageUrl),
    // Normalise to strict boolean. Backend may return 0/1 integers or null.
    // ?? true would hide out-of-stock: 0 ?? true = 0, but 0 === false is false.
    in_stock:      p.in_stock != null ? Boolean(p.in_stock) : undefined,
  };
}

// ── Promotion type (superset of ShopPromotion + campaign fields) ──────────────

type RawPromotion = ShopPromotion & {
  brand_name?: string | null;
  customer_type_target?: string | null;
  discount_pct?: number | null;
  promo_code?: string | null;
};

// ── Fallback filter values (used until /products/specs loads) ─────────────────

const FALLBACK_WIDTHS       = ["145","155","165","175","185","195","205","215","225","235","245","255","265","275","285","295","305","315","325","335","345","355","365","375","385","395","405","415","425","435","445","455"];
const FALLBACK_HEIGHTS      = ["25","30","35","40","45","50","55","60","65","70","75","80","85","90","95"];
const FALLBACK_RIMS         = ["10","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","28","30"];
const FALLBACK_LOAD_INDEXES = ["62","67","70","71","72","75","79","80","82","84","85","87","88","91","94","95","96","98","100","101","102","103","104","106","108","109","112","114","116","118","121","125","128","130"];
const FALLBACK_SPEEDS       = ["F","G","H","J","K","L","M","N","P","Q","R","S","T","U","V","W","Y","Z"];

const SEASONS = ["Summer", "Winter", "All Season"];

// Price breakpoints: €29 → €539 in €10 steps
const PRICES: string[] = Array.from({ length: 52 }, (_, i) => String(29 + i * 10));

const SORT_OPTIONS = [
  { value: "",           label: "Default sort" },
  { value: "price_asc",  label: "Price: low → high" },
  { value: "price_desc", label: "Price: high → low" },
  { value: "newest",     label: "Newest first" },
];

// ── Dropdown style ─────────────────────────────────────────────────────────────

const sel =
  "h-10 min-w-0 flex-1 rounded-lg border border-[#e5e7eb] bg-white px-3 text-[0.82rem] text-[#374151] outline-none transition cursor-pointer focus:border-[#f4511e] focus:ring-1 focus:ring-[#f4511e]/20 disabled:opacity-40";

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  prefilledSize?: string;
  onPrefilledSizeConsumed?: () => void;
  initialFilters?: Record<string, string>;
};

export default function ShopCatalogue({ prefilledSize, onPrefilledSizeConsumed, initialFilters }: Props) {
  const { locale, t } = useLanguage();
  const { customer } = useCustomerAuth();
  const customerType: "b2b" | "b2c" | "guest" =
    customer?.customer_type === "b2b" ? "b2b" : customer ? "b2c" : "guest";

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [priceMin,   setPriceMin]   = useState("");
  const [priceMax,   setPriceMax]   = useState("");
  const [selBrand,   setSelBrand]   = useState("");
  const [selType,    setSelType]    = useState("");
  const [selWidth,   setSelWidth]   = useState("");
  const [selHeight,  setSelHeight]  = useState("");
  const [selRim,     setSelRim]     = useState("");
  const [selSeason,  setSelSeason]  = useState("");
  const [selSpeed,     setSelSpeed]     = useState("");
  const [selLoad,      setSelLoad]      = useState("");
  const [sortBy,       setSortBy]       = useState("");

  // ── Results ──────────────────────────────────────────────────────────────────
  const [products,    setProducts]    = useState<Product[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [apiError,    setApiError]    = useState<string | null>(null);

  // ── Inline + campaign promotions ─────────────────────────────────────────────
  const [inlinePromos, setInlinePromos] = useState<ShopPromotion[]>([]);
  const [campaignPromoRaw, setCampaignPromoRaw] = useState<CampaignPromotion | null>(null);

  // ── Dynamic filter options ───────────────────────────────────────────────────
  const [brands,      setBrands]      = useState<string[]>([]);
  const [widths,      setWidths]      = useState<string[]>(FALLBACK_WIDTHS);
  const [heights,     setHeights]     = useState<string[]>(FALLBACK_HEIGHTS);
  const [rims,        setRims]        = useState<string[]>(FALLBACK_RIMS);
  const [loadIndexes, setLoadIndexes] = useState<string[]>(FALLBACK_LOAD_INDEXES);
  const [speeds,      setSpeeds]      = useState<string[]>(FALLBACK_SPEEDS);

  // AbortController ref so we can cancel in-flight fetches
  const abortRef = useRef<AbortController | null>(null);

  // Triggers runSearch() one render after prefilledSize state is applied
  const [pendingAutoSearch, setPendingAutoSearch] = useState(false);

  // Apply URL initialFilters on first render and auto-search
  useEffect(() => {
    if (!initialFilters || Object.keys(initialFilters).length === 0) return;
    if (initialFilters.q)           setSearchText(initialFilters.q);
    if (initialFilters.type)        setSelType(initialFilters.type);
    if (initialFilters.brand)       setSelBrand(initialFilters.brand);
    if (initialFilters.season)      setSelSeason(initialFilters.season);
    if (initialFilters.speed)       setSelSpeed(initialFilters.speed);
    if (initialFilters.load_index)  setSelLoad(initialFilters.load_index);
    if (initialFilters.price_min)   setPriceMin(initialFilters.price_min);
    if (initialFilters.price_max)   setPriceMax(initialFilters.price_max);
    if (initialFilters.size) {
      const match = initialFilters.size.match(/^(\d+)\/(\d+)[Rr](\d+)/);
      if (match) { setSelWidth(match[1]); setSelHeight(match[2]); setSelRim(match[3]); }
    }
    setPendingAutoSearch(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Consume prefilledSize: parse "205/55R16" → width / height / rim, then auto-search
  useEffect(() => {
    if (!prefilledSize) return;
    const match = prefilledSize.match(/^(\d+)\/(\d+)[Rr](\d+)/);
    if (match) {
      setSelWidth(match[1]);
      setSelHeight(match[2]);
      setSelRim(match[3]);
      setPendingAutoSearch(true);
    }
    onPrefilledSizeConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledSize]);

  // Fire search after state from prefilledSize has settled
  useEffect(() => {
    if (!pendingAutoSearch) return;
    setPendingAutoSearch(false);
    runSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoSearch]);

  // Load promotions on mount — split into inline banner + campaign hero
  useEffect(() => {
    fetch("/api/promotions/active", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const all: RawPromotion[] = Array.isArray(json?.data) ? json.data : [];

        if (process.env.NODE_ENV === "development") {
          console.log("[shop-promotions] active count:", all.length);
          all.forEach((p) => console.log(`  • id=${p.id} placement=${p.placement} title="${p.title}" customer_type_target=${p.customer_type_target} brand_name=${p.brand_name}`));
        }

        setInlinePromos(
          all.filter((p) => !p.placement || p.placement === "shop_inline" || p.placement === "both")
        );

        const hero = all.find((p) => p.placement === "shop_hero");

        if (process.env.NODE_ENV === "development") {
          console.log("[shop-promotions] shopHeroCampaign:", hero ?? "none");
        }

        if (hero) {
          setCampaignPromoRaw({
            id:                   hero.id,
            title:                hero.title,
            subheadline:          hero.subheadline ?? null,
            button_text:          hero.button_text ?? null,
            button_link:          hero.button_link ?? null,
            image_url:            hero.image_url ?? null,
            brand_name:           hero.brand_name ?? null,
            discount_pct:         hero.discount_pct ?? null,
            promo_code:           hero.promo_code ?? null,
            customer_type_target: (hero.customer_type_target as CampaignPromotion["customer_type_target"]) ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Load brands + specs on mount
  useEffect(() => {
    fetch(BRANDS_API, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json.data)
          ? (json.data as unknown[]).filter((b): b is string => typeof b === "string" && !!b)
          : [];
        if (list.length) setBrands(list);
      })
      .catch(() => {});

    fetch(SPECS_API, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.widths?.length)        setWidths(json.data.widths);
        if (json.data?.heights?.length)       setHeights(json.data.heights);
        if (json.data?.rims?.length)          setRims(json.data.rims);
        if (json.data?.load_indexes?.length)  setLoadIndexes(json.data.load_indexes);
        if (json.data?.speed_ratings?.length) setSpeeds(json.data.speed_ratings);
      })
      .catch(() => {}); // stays on hardcoded fallbacks if endpoint not yet available
  }, []);

  // ── Search handler ───────────────────────────────────────────────────────────

  const runSearch = useCallback(() => {
    const hasInput =
      searchText.trim() || priceMin || priceMax || selBrand || selType ||
      selWidth || selHeight || selRim || selSeason || selSpeed || selLoad;
    if (!hasInput) return;

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({ locale });
    if (searchText.trim()) params.set("q",             searchText.trim());
    if (priceMin)          params.set("price_min",     priceMin);
    if (priceMax)          params.set("price_max",     priceMax);
    if (selBrand)          params.set("brand",         selBrand);
    if (selType)           params.set("type",          selType);
    if (selSeason)         params.set("season",        selSeason);
    if (selSpeed)          params.set("speed",         selSpeed);
    if (selLoad)           params.set("load_index",    selLoad);
    if (sortBy)            params.set("sort",          sortBy);
    // Segment-aware filtering: backend returns only products priced for this tier
    if (customerType === "b2b" || customerType === "b2c") {
      params.set("segment", customerType);
    }

    // Build size string from width / height / rim components
    let sizeStr = "";
    if (selWidth)  sizeStr  = selWidth;
    if (selHeight) sizeStr += (sizeStr ? "/" + selHeight : selHeight);
    if (selRim)    sizeStr += (sizeStr ? "R" + selRim   : "R" + selRim);
    if (sizeStr)   params.set("size", sizeStr);

    setIsLoading(true);
    setHasSearched(true);
    setApiError(null);

    // Fire tyre spec event when user searches with at least one size dimension
    if (selWidth || selHeight || selRim) {
      trackTyreSpecSelected({
        width:     selWidth  || undefined,
        height:    selHeight || undefined,
        rim:       selRim    || undefined,
        size:      sizeStr   || undefined,
        brand:     selBrand  || undefined,
        tyre_type: selType   || undefined,
      });
    }

    fetch(`${PRODUCTS_API}?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json._proxy_error) {
          // Proxy hit a network error or the upstream returned non-200
          setApiError(json._proxy_error ?? `API error (HTTP ${r.status})`);
          setProducts([]);
          setResultCount(0);
          return;
        }
        const allProducts = Array.isArray(json.data) ? json.data.map(toProduct) : [];
        // Client-side guard for segment pricing.
        // The public API may not include price_b2b / price_b2c as separate fields —
        // it may return only the base `price` field (already resolved for the segment
        // by the backend). So we only use the tier field when it is present; otherwise
        // we trust the backend's segment filter and fall back to checking price > 0.
        const list = allProducts.filter((p: Product) => {
          if (customerType === "b2b") {
            return p.price_b2b !== undefined ? p.price_b2b > 0 : p.price > 0;
          }
          if (customerType === "b2c") {
            return p.price_b2c !== undefined ? p.price_b2c > 0 : p.price > 0;
          }
          return p.price > 0; // guest: show all priced products
        });
        setProducts(list);
        setResultCount(typeof json.meta?.total === "number" ? json.meta.total : list.length);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setApiError("Could not reach the product catalogue. Please try again.");
          setProducts([]);
        }
      })
      .finally(() => setIsLoading(false));
  }, [searchText, priceMin, priceMax, selBrand, selType, selWidth, selHeight, selRim, selSeason, selSpeed, selLoad, sortBy, locale, customerType]);

  // Re-fetch when sort changes after results are already showing
  useEffect(() => {
    if (hasSearched) runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const reset = () => {
    setSearchText("");
    setPriceMin(""); setPriceMax(""); setSelBrand(""); setSelType("");
    setSelWidth(""); setSelHeight(""); setSelRim("");
    setSelSeason(""); setSelSpeed(""); setSelLoad(""); setSortBy("");
    setHasSearched(false);
    setProducts([]);
    setResultCount(0);
    setApiError(null);
  };

  const hasActiveFilters =
    searchText.trim() || priceMin || priceMax || selBrand || selType ||
    selWidth || selHeight || selRim || selSeason || selSpeed || selLoad;

  // ── Campaign targeting (re-derived on every render when customerType changes) ──
  // B2C campaigns: visible to guests + b2c, hidden from b2b.
  // B2B campaigns: visible only to b2b.
  // "all" or no target: visible to everyone.

  const campaignPromo: CampaignPromotion | null = (() => {
    if (!campaignPromoRaw) return null;
    const ct = campaignPromoRaw.customer_type_target;
    if (ct === "b2c" && customerType === "b2b") return null;
    if (ct === "b2b" && customerType !== "b2b") return null;
    if (process.env.NODE_ENV === "development") {
      console.log(`[shop-promotions] campaignPromo resolved — ct=${ct} customerType=${customerType} title="${campaignPromoRaw.title}"`);
    }
    return campaignPromoRaw;
  })();

  const activeCampaign: ActiveCampaign | null =
    campaignPromo?.brand_name && campaignPromo?.discount_pct != null
      ? { brand_name: campaignPromo.brand_name, discount_pct: campaignPromo.discount_pct }
      : null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <section className="w-full bg-[#f5f5f5] py-6 md:py-10">
      <div className="tesla-shell">

        {/* ── Campaign hero banner — below intro, above filters ── */}
        {campaignPromo && <ShopCampaignBanner promo={campaignPromo} />}

        {/* ── Filter bar ── */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">

          {/* Row 1 — text search */}
          <div className="flex items-center gap-2 border-b border-[#f0f0f0] px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] sm:left-3.5"
              />
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search by brand, size or article number"
                className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-[#fafafa] pl-9 pr-3 text-[0.85rem] text-[#171a20] outline-none placeholder:text-[#9ca3af] transition focus:border-[#f4511e] focus:bg-white focus:ring-1 focus:ring-[#f4511e]/20 sm:h-11 sm:pl-10 sm:pr-4 sm:text-[0.88rem]"
              />
            </div>
            {/* Icon-only on mobile, icon + label on sm+ */}
            <button
              type="button"
              onClick={runSearch}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f4511e] text-white transition hover:bg-[#d14f14] sm:h-11 sm:w-auto sm:gap-2 sm:px-6 sm:text-[0.88rem] sm:font-semibold"
            >
              <Search size={15} strokeWidth={2.2} />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Row 2 — dropdowns + action buttons */}
          {/* Mobile: 2-col grid so each dropdown gets a proper half-width cell.    */}
          {/* sm+: revert to flex-wrap (original behaviour).                        */}
          <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:flex sm:flex-wrap sm:items-center sm:px-5">

            {/* Min price */}
            <select value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className={sel}>
              <option value="">Min price</option>
              {PRICES.map((p) => <option key={p} value={p}>€{p}</option>)}
            </select>

            {/* Max price */}
            <select value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className={sel}>
              <option value="">Max price</option>
              {PRICES.map((p) => <option key={p} value={p}>€{p}</option>)}
            </select>

            {/* Brand */}
            <select value={selBrand} onChange={(e) => setSelBrand(e.target.value)} className={sel}>
              <option value="">Brand</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>

            {/* Width */}
            <select value={selWidth} onChange={(e) => setSelWidth(e.target.value)} className={sel}>
              <option value="">Width</option>
              {widths.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>

            {/* Height */}
            <select value={selHeight} onChange={(e) => setSelHeight(e.target.value)} className={sel}>
              <option value="">Height</option>
              {heights.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>

            {/* Rim */}
            <select value={selRim} onChange={(e) => setSelRim(e.target.value)} className={sel}>
              <option value="">Rim</option>
              {rims.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Season */}
            <select value={selSeason} onChange={(e) => setSelSeason(e.target.value)} className={sel}>
              <option value="">Season</option>
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Speed index */}
            <select value={selSpeed} onChange={(e) => setSelSpeed(e.target.value)} className={sel}>
              <option value="">Speed</option>
              {speeds.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Load index */}
            <select value={selLoad} onChange={(e) => setSelLoad(e.target.value)} className={sel}>
              <option value="">Load index</option>
              {loadIndexes.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>

            {/* Spacer — only on md+ to push buttons right */}
            <div className="hidden flex-1 md:block" />

            {/* Filter button — spans both columns on mobile, normal flex item on sm+ */}
            <button
              type="button"
              onClick={runSearch}
              className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-lg bg-[#f4511e] text-[0.82rem] font-semibold text-white transition hover:bg-[#d14f14] sm:col-auto sm:flex-none sm:px-5"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Search size={14} strokeWidth={2.2} />
              )}
              Filter
            </button>

            {/* Reset — spans both columns on mobile, normal flex item on sm+ */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={reset}
                className="col-span-2 flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#e5e7eb] text-[0.82rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e]/40 hover:text-[#f4511e] sm:col-auto sm:flex-none sm:px-4"
              >
                <RotateCcw size={13} strokeWidth={2} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ── Inline promo banner ── */}
        <ShopPromoBanner promotions={inlinePromos} />

        {/* ── Results ── */}
        {hasSearched && (
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-[#9ca3af]" />
              </div>
            ) : apiError ? (
              /* API / network error — something failed upstream */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                  <Search size={22} className="text-red-400" />
                </div>
                <p className="text-[0.95rem] font-semibold text-[#171a20]">Catalogue unavailable</p>
                <p className="mt-1 max-w-[340px] text-[0.83rem] leading-6 text-[#5c5e62]">
                  The product catalogue could not be reached right now. Please try again in a moment or contact support.
                </p>
                {process.env.NODE_ENV === "development" && (
                  <p className="mt-2 max-w-[400px] rounded bg-red-50 px-3 py-1.5 text-[0.75rem] text-red-600">
                    {apiError}
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Active filter chips */}
                {(selType || selBrand || selSeason || searchText.trim()) && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-[0.75rem] font-semibold text-[#5c5e62]">Filtered by:</span>
                    {selType    && <span className="inline-flex items-center gap-1 rounded-full bg-[#171a20] px-3 py-1 text-[0.72rem] font-semibold text-white">{selType} <button onClick={() => { setSelType(""); runSearch(); }} className="ml-0.5 opacity-70 hover:opacity-100">×</button></span>}
                    {selBrand   && <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f0f0] px-3 py-1 text-[0.72rem] font-semibold text-[#171a20]">{selBrand} <button onClick={() => { setSelBrand(""); runSearch(); }} className="ml-0.5 opacity-60 hover:opacity-100">×</button></span>}
                    {selSeason  && <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f0f0] px-3 py-1 text-[0.72rem] font-semibold text-[#171a20]">{selSeason} <button onClick={() => { setSelSeason(""); runSearch(); }} className="ml-0.5 opacity-60 hover:opacity-100">×</button></span>}
                    {searchText.trim() && <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f0f0] px-3 py-1 text-[0.72rem] font-semibold text-[#171a20]">&ldquo;{searchText}&rdquo; <button onClick={() => { setSearchText(""); runSearch(); }} className="ml-0.5 opacity-60 hover:opacity-100">×</button></span>}
                  </div>
                )}
                {/* Result count */}
                <p className="mb-4 text-[0.85rem] text-[#5c5e62]">
                  <span className="font-semibold text-[#171a20]">{resultCount}</span>{" "}
                  {resultCount === 1 ? t.shop.catalogue.product : t.shop.catalogue.products} found
                </p>
                <ProductGrid
                  products={products}
                  total={resultCount}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  customerType={customerType}
                  activeCampaign={activeCampaign}
                />
              </>
            )}
          </div>
        )}

        {/* ── Empty prompt (before first search) ── */}
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <Search size={22} className="text-[#9ca3af]" />
            </div>
            <p className="text-[0.95rem] font-semibold text-[#171a20]">Find your tyres</p>
            <p className="mt-1 max-w-[300px] text-[0.83rem] leading-6 text-[#5c5e62]">
              Use the filters above or type a brand, size or article number to search the catalogue.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
