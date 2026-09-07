"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2, SlidersHorizontal } from "lucide-react";
import ProductGrid, { type CatalogueView } from "./product-grid";
import CatalogueFilters from "./catalogue-filters";
import ShopPromoBanner, { type ShopPromotion } from "./shop-promo-banner";
import ShopCampaignBanner, { type CampaignPromotion } from "./shop-campaign-banner";
import SpecialsProductList from "./specials-product-list";
import { type Product } from "./data";
import { type ActiveCampaign } from "./product-card";
import { useLanguage } from "@/context/language-context";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { getProductImageUrl } from "@/lib/utils";
import { trackTyreSpecSelected } from "@/lib/analytics";
import { usePrice } from "@/hooks/use-price";

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
  // Use primary_image first; do NOT fall back to p.image as that field may
  // contain an admin-set category/brand image rather than a product photo.
  const rawPrimary: string = p.primary_image || p.image_url || extractImagePath(p.images?.[0]) || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleryPaths: string[] = (p.images ?? []).map((x: any) => extractImagePath(x)).filter(Boolean);
  const allPaths = [rawPrimary, ...galleryPaths.filter((g) => g !== rawPrimary)].filter(Boolean);
  return {
    id:            p.id,
    // Without this every card and row falls back to the id URL — the slug
    // is the SEO address (Session 92), so it must survive the mapping.
    slug:          p.slug         ?? null,
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
    brand_image:   p.brand_image  ? getProductImageUrl(p.brand_image) : undefined,
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
  source?: "shop" | "seo-landing";
};

export default function ShopCatalogue({ prefilledSize, onPrefilledSizeConsumed, initialFilters, source = "shop" }: Props) {
  const { locale, t } = useLanguage();
  const { price } = usePrice();
  const { customer } = useCustomerAuth();
  const customerType: "b2b" | "b2c" | "guest" =
    customer?.customer_type === "b2b" ? "b2b" : customer ? "b2c" : "guest";

  // A guest picks which side of the catalogue they are browsing. Signed-in
  // customers already have a type; for everyone else this drives the
  // audience and price filters, remembered per browser. Defaults to the
  // retail view — a private buyer should never need to know what B2B means.
  const [guestSegment, setGuestSegment] = useState<"b2c" | "b2b">("b2c");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("shop-segment");
      if (stored === "b2b" || stored === "b2c") setGuestSegment(stored);
    } catch { /* storage unavailable */ }
  }, []);

  const changeGuestSegment = (seg: "b2c" | "b2b") => {
    setGuestSegment(seg);
    try { window.localStorage.setItem("shop-segment", seg); } catch { /* storage unavailable */ }
  };

  // The segment the API filters by: the account's own type wins; a guest's
  // toggle decides otherwise.
  const effectiveSegment: "b2b" | "b2c" =
    customerType === "guest" ? guestSegment : customerType;

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

  // Grid for people who shop with their eyes, list for people with a
  // spreadsheet open. Remembered per browser; storage can be unavailable
  // (private windows), so both sides are wrapped.
  const [view, setView] = useState<CatalogueView>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("shop-view");
      if (stored === "list" || stored === "grid") setView(stored);
    } catch { /* storage unavailable */ }
  }, []);

  const changeView = useCallback((v: CatalogueView) => {
    setView(v);
    try { window.localStorage.setItem("shop-view", v); } catch { /* storage unavailable */ }
  }, []);

  // ── Results ──────────────────────────────────────────────────────────────────
  const [products,    setProducts]    = useState<Product[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [apiError,    setApiError]    = useState<string | null>(null);

  // ── Inline + campaign promotions ─────────────────────────────────────────────
  const [inlinePromos, setInlinePromos] = useState<ShopPromotion[]>([]);
  const [campaignPromoRaw, setCampaignPromoRaw] = useState<CampaignPromotion | null>(null);

  // ── Specials products (pre-loaded from campaign brand on page load) ────────────
  const [specialsProducts, setSpecialsProducts] = useState<Product[]>([]);
  // Start as true so the skeleton renders immediately the moment the section
  // condition becomes truthy (after promotions load). Without this, React would
  // render the section with loading=false and products=[] for one frame before
  // the useEffect fires and sets loading=true, causing a null-flash.
  const [specialsLoading, setSpecialsLoading] = useState(true);

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

  // Apply URL initialFilters on first render and auto-search. With no
  // filters at all, still search: browse mode shows the in-stock catalogue.
  useEffect(() => {
    if (!initialFilters || Object.keys(initialFilters).length === 0) {
      setPendingAutoSearch(true);
      return;
    }
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
    runSearch(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoSearch]);

  // Load promotions on mount — split into inline strip + campaign hero
  useEffect(() => {
    fetch("/api/promotions/active", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const all: RawPromotion[] = Array.isArray(json?.data) ? json.data : [];

        // Campaign hero: first promotion whose placement is one of the known
        // campaign slots AND that has brand_name set.
        // Backend currently uses "shop_inline" — "shop_hero" is supported for future.
        const CAMPAIGN_PLACEMENTS = ["shop_hero", "shop_inline", "both"];
        const hero = all.find(
          (p) => CAMPAIGN_PLACEMENTS.includes(p.placement ?? "") && p.brand_name,
        );

        // Inline strip: unplaced / shop_inline / both, excluding the campaign hero
        // so it doesn't render both as a strip and a full banner.
        setInlinePromos(
          all.filter(
            (p) =>
              (!p.placement || p.placement === "shop_inline" || p.placement === "both") &&
              p.id !== hero?.id,
          ),
        );

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

  // Fetch specials products whenever campaign brand becomes known.
  // Runs for all customer types — targeting only affects product card badges,
  // not whether the specials section itself is shown.
  useEffect(() => {
    const brand = campaignPromoRaw?.brand_name;
    if (!brand) { setSpecialsLoading(false); return; }

    setSpecialsLoading(true);
    const params = new URLSearchParams({ brand, locale, limit: "8" });
    if (customerType === "b2b" || customerType === "b2c") {
      params.set("segment", customerType);
    }

    const fetchUrl = `${PRODUCTS_API}?${params.toString()}`;

    fetch(fetchUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json) return;
        const raw = Array.isArray(json.data) ? json.data : [];
        const list = raw
          .map(toProduct)
          .filter((p: Product) => p.price > 0)
          .slice(0, 8);
        setSpecialsProducts(list);
      })
      .catch(() => {})
      .finally(() => setSpecialsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignPromoRaw?.brand_name, customerType, locale]);

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

  const runSearch = useCallback((force = false) => {
    const hasInput =
      searchText.trim() || priceMin || priceMax || selBrand || selType ||
      selWidth || selHeight || selRim || selSeason || selSpeed || selLoad;
    // Browse mode: with nothing selected the shop shows everything in stock
    // rather than an empty page. An empty shop reads as a broken shop, and
    // no real platform greets a buyer with a search prompt and no products.
    const browsing = !hasInput;
    if (browsing && !force) return;

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({ locale });
    if (browsing) params.set("in_stock", "1");
    if (searchText.trim()) params.set("q",             searchText.trim());
    if (priceMin)          params.set("price_min",     priceMin);
    if (priceMax)          params.set("price_max",     priceMax);
    if (selBrand)          params.set("brand",         selBrand);
    if (selType)           params.set("type",          selType);
    if (selSeason)         params.set("season",        selSeason);
    if (selSpeed)          params.set("speed",         selSpeed);
    if (selLoad)           params.set("load_index",    selLoad);
    if (sortBy)            params.set("sort",          sortBy);
    // Segment-aware filtering: the backend now honours this for every
    // visitor, guests included — it decides both the tier prices and which
    // audience's listings appear at all.
    params.set("segment", effectiveSegment);

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
  }, [searchText, priceMin, priceMax, selBrand, selType, selWidth, selHeight, selRim, selSeason, selSpeed, selLoad, sortBy, locale, customerType, effectiveSegment]);

  // Every filter applies itself, debounced so three quick changes cost one
  // request. The old design made nothing happen until a Filter button was
  // found and pressed.
  const filtersReady = useRef(false);
  useEffect(() => {
    if (!filtersReady.current) { filtersReady.current = true; return; }
    const t = setTimeout(() => runSearch(true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceMin, priceMax, selBrand, selType, selWidth, selHeight, selRim, selSeason, selSpeed, selLoad]);

  // A guest flipping the audience toggle re-searches the other catalogue.
  useEffect(() => {
    if (hasSearched && customerType === "guest") runSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestSegment]);

  // Re-fetch when sort changes after results are already showing
  useEffect(() => {
    if (hasSearched) runSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const reset = () => {
    setSearchText("");
    setPriceMin(""); setPriceMax(""); setSelBrand(""); setSelType("");
    setSelWidth(""); setSelHeight(""); setSelRim("");
    setSelSeason(""); setSelSpeed(""); setSelLoad(""); setSortBy("");
    setApiError(null);
    // Back to browse mode rather than an empty page.
    setPendingAutoSearch(true);
  };

  const hasActiveFilters =
    searchText.trim() || priceMin || priceMax || selBrand || selType ||
    selWidth || selHeight || selRim || selSeason || selSpeed || selLoad;

  // ── Campaign derived values ───────────────────────────────────────────────────

  // Brand name that drives banner + specials visibility.
  // Not filtered by customer type — the section is visible to all users.
  const campaignBrand = campaignPromoRaw?.brand_name ?? null;

  // Product-card discount badge: only shown to the campaign's target segment.
  const activeCampaign: ActiveCampaign | null = (() => {
    if (!campaignPromoRaw?.brand_name || campaignPromoRaw?.discount_pct == null) return null;
    const ct = campaignPromoRaw.customer_type_target;
    if (ct === "b2c" && customerType === "b2b") return null;
    if (ct === "b2b" && customerType !== "b2b") return null;
    return { brand_name: campaignPromoRaw.brand_name, discount_pct: campaignPromoRaw.discount_pct };
  })();

  // ── CTA handlers ─────────────────────────────────────────────────────────────

  // Banner CTA ("Shop Rapid Tyres"): scroll-only, no filter change.
  const handleScrollToSpecials = useCallback(() => {
    document.getElementById("specials-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Specials "View all" CTA: apply brand filter, trigger search, scroll to results.
  const handleCampaignCta = useCallback((url: string) => {
    try {
      const parsed = new URL(url, window.location.origin);
      const brand = parsed.searchParams.get("brand");
      if (brand) setSelBrand(brand);
      const q = parsed.searchParams.get("q");
      if (q) setSearchText(q);
      const type = parsed.searchParams.get("type");
      if (type) setSelType(type);
    } catch { /* malformed url — still proceed */ }
    setPendingAutoSearch(true);
    // Update URL bar without triggering a Next.js navigation.
    try { window.history.pushState(null, "", url); } catch { /* SSR / unsupported */ }
    // Scroll to results grid once hasSearched becomes true and the div mounts.
    setTimeout(() => {
      const target =
        document.getElementById("catalogue-results") ??
        document.getElementById("shop-catalogue");
      target?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <section className="w-full bg-[#f5f5f5] py-6 md:py-10">
      <div className="tesla-shell">

        {/* ── Search row ── */}
        <div className="mb-5 flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] sm:left-3.5"
            />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch(true)}
              placeholder="Search by brand, size or article number"
              className="h-11 w-full rounded-md border border-black/15 bg-white pl-9 pr-3 text-[0.88rem] text-[#171a20] outline-none placeholder:text-[#9ca3af] transition-colors focus:border-[#f4511e] sm:pl-10"
            />
          </div>
          <button
            type="button"
            onClick={() => runSearch(true)}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-[#f4511e] text-white transition-colors hover:bg-[#df4618] sm:w-auto sm:gap-2 sm:px-6 sm:text-[0.88rem] sm:font-bold"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} strokeWidth={2.2} />}
            <span className="hidden sm:inline">Search</span>
          </button>
          {/* Guests choose their side of the catalogue; accounts have one */}
          {customerType === "guest" && (
            <div
              role="group"
              aria-label="Buying as"
              className="hidden h-11 shrink-0 items-center gap-1 rounded-md border border-black/15 bg-white p-1 md:flex"
            >
              {([
                { seg: "b2c", label: "Private buyer" },
                { seg: "b2b", label: "Trade buyer" },
              ] as const).map(({ seg, label }) => (
                <button
                  key={seg}
                  type="button"
                  aria-pressed={guestSegment === seg}
                  onClick={() => changeGuestSegment(seg)}
                  className={`h-full rounded px-3 text-[0.82rem] font-semibold transition-colors ${
                    guestSegment === seg
                      ? "bg-[#171a20] text-white"
                      : "text-[#5c5e62] hover:text-[#171a20]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Mobile: the sidebar folds behind this */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            aria-expanded={mobileFiltersOpen}
            className="flex h-11 items-center gap-1.5 rounded-md border border-black/15 bg-white px-3 text-[0.85rem] font-semibold text-[#171a20] lg:hidden"
          >
            <SlidersHorizontal size={14} strokeWidth={2.2} aria-hidden />
            Filters
          </button>
        </div>

        {/* Mobile twin of the desktop toggle above: without it, a phone
            guest could never reach the trade catalogue at all. */}
        {customerType === "guest" && (
          <div
            role="group"
            aria-label="Buying as"
            className="mb-4 flex h-11 items-center gap-1 rounded-md border border-black/15 bg-white p-1 md:hidden"
          >
            {([
              { seg: "b2c", label: "Private buyer" },
              { seg: "b2b", label: "Trade buyer" },
            ] as const).map(({ seg, label }) => (
              <button
                key={seg}
                type="button"
                aria-pressed={guestSegment === seg}
                onClick={() => changeGuestSegment(seg)}
                className={`h-full flex-1 rounded text-[0.85rem] font-semibold transition-colors ${
                  guestSegment === seg
                    ? "bg-[#171a20] text-white"
                    : "text-[#5c5e62]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {customerType === "guest" && guestSegment === "b2b" && (
          <p className="mb-4 rounded-md border border-black/10 bg-white px-4 py-2.5 text-[0.85rem] text-[#5c5e62]">
            You are browsing the trade catalogue. Prices shown are retail;{" "}
            <Link href="/register" className="font-semibold text-[#f4511e] hover:underline">open a trade account</Link>{" "}
            for wholesale terms, reviewed within one working day.
          </p>
        )}

        {/* ── Sidebar + results ── */}
        <div className="lg:grid lg:grid-cols-[256px_1fr] lg:items-start lg:gap-6">
          <aside className={`${mobileFiltersOpen ? "mb-5 block" : "hidden"} lg:sticky lg:top-[calc(var(--bar-h,0px)+92px)] lg:block`}>
            <CatalogueFilters
              values={{
                type: selType, width: selWidth, height: selHeight, rim: selRim,
                season: selSeason, brand: selBrand, priceMin, priceMax,
                speed: selSpeed, load: selLoad,
              }}
              onChange={(patch) => {
                if (patch.type      !== undefined) setSelType(patch.type);
                if (patch.width     !== undefined) setSelWidth(patch.width);
                if (patch.height    !== undefined) setSelHeight(patch.height);
                if (patch.rim       !== undefined) setSelRim(patch.rim);
                if (patch.season    !== undefined) setSelSeason(patch.season);
                if (patch.brand     !== undefined) setSelBrand(patch.brand);
                if (patch.priceMin  !== undefined) setPriceMin(patch.priceMin);
                if (patch.priceMax  !== undefined) setPriceMax(patch.priceMax);
                if (patch.speed     !== undefined) setSelSpeed(patch.speed);
                if (patch.load      !== undefined) setSelLoad(patch.load);
              }}
              onReset={reset}
              options={{
                brands, widths, heights, rims,
                seasons: SEASONS, speeds, loadIndexes, prices: PRICES,
              }}
              formatPrice={(v) => price(v, { compact: true })}
              hasActive={Boolean(hasActiveFilters)}
            />
          </aside>

          <div className="min-w-0">
        {/* ── Campaign banner + specials — below filter, above results ── */}
        {/* Hidden on SEO landing pages so the page's primary filtered results are not pushed down. */}
        {source !== "seo-landing" && campaignBrand && campaignPromoRaw && (
          <>
            <ShopCampaignBanner promo={campaignPromoRaw} onCtaClick={handleScrollToSpecials} />
            <SpecialsProductList
              products={specialsProducts}
              loading={specialsLoading}
              brandName={campaignBrand}
              discountPct={campaignPromoRaw.discount_pct}
              customerType={customerType}
              onViewAll={() =>
                handleCampaignCta(
                  campaignPromoRaw.button_link ??
                    `/shop?brand=${encodeURIComponent(campaignBrand)}`,
                )
              }
            />
          </>
        )}

        {/* ── Inline promo banner ── */}
        <ShopPromoBanner promotions={inlinePromos} />

        {/* ── Results ── */}
        {hasSearched && (
          <div id="catalogue-results">
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
                <ProductGrid
                  products={products}
                  total={resultCount}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  view={view}
                  onViewChange={changeView}
                  customerType={customerType}
                  guestSegment={guestSegment}
                  activeCampaign={activeCampaign}
                />
              </>
            )}
          </div>
        )}

        {/* Browse mode searches on arrival, so this is only ever a brief
            first-paint state. */}
        {!hasSearched && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-[#9ca3af]" />
          </div>
        )}

          </div>
        </div>

      </div>
    </section>
  );
}
