/**
 * Customer behaviour analytics — types and presentation helpers.
 *
 * Everything the endpoint returns is already aggregated. Nothing here recomputes
 * a figure from a series; the helpers are formatting and labelling only.
 */

export type BehaviourStockStatus = "not_stocked" | "all_out_of_stock" | "available";

export type BehaviourDay = {
  date: string;
  searches: number;
  visitors: number;
  empty_searches: number;
};

export type BehaviourTerm = {
  term: string;
  searches: number;
  visitors: number;
  empty_searches?: number;
  best_results?: number;
};

export type BehaviourUnmet = {
  term: string;
  searches: number;
  visitors: number;
  last_searched?: string | null;
};

export type BehaviourStockRow = {
  brand: string;
  searches: number;
  products: number;
  in_stock_products: number;
  status: BehaviourStockStatus | string;
};

/** Shared shape of the brand / category / season / country breakdowns. */
export type BehaviourDimension = {
  value: string;
  searches: number;
  empty_searches?: number;
};

export type BehaviourReport = {
  range?: { from?: string; to?: string; days?: number };
  available: boolean;
  /** Present when `available` is false — say this, never draw an empty chart. */
  reason?: string | null;
  summary?: {
    searches: number;
    visitors: number;
    empty_searches: number;
    empty_rate: number;
    avg_results: number;
  };
  daily?: BehaviourDay[];
  top_searches?: BehaviourTerm[];
  unmet_demand?: BehaviourUnmet[];
  demand_vs_stock?: BehaviourStockRow[];
  brand_demand?: BehaviourDimension[];
  category_demand?: BehaviourDimension[];
  season_demand?: BehaviourDimension[];
  countries?: BehaviourDimension[];
  size_demand?: {
    rim?: BehaviourDimension[];
    width?: BehaviourDimension[];
    height?: BehaviourDimension[];
  };
  saved_fitments?: { size: string; saves: number; customers: number }[];
  funnel?: {
    searches: number;
    visitors: number;
    inquiries: number;
    orders: number;
    inquiry_rate_per_visitor?: number;
    order_rate_per_visitor?: number;
    note?: string;
  };
  signed_in_share?: {
    searches: number;
    signed_in: number;
    signed_in_percent: number;
  };
};

export type BehaviourMeta = {
  generated_at?: string | null;
  covers?: string | null;
  /** Rendered on the page. A "behaviour" dashboard that hides its blind spots invites
   *  someone to conclude the missing things aren't happening. */
  not_covered?: string | null;
};

// ── Chart palette ─────────────────────────────────────────────────────────────
// Validated for this surface rather than chosen by eye:
//   node validate_palette.js "#f4511e,#2a78d6" --mode light --surface "#ffffff"
//   → lightness band PASS · chroma PASS · CVD ΔE 26.3 PASS (≥8)
//     · normal-vision ΔE 34.2 PASS (≥15) · contrast 3.51:1 / 4.42:1 PASS (≥3:1)
// Two series only, so two slots. `#f4511e` is the admin accent, kept as slot 1 so
// the page reads as part of this panel; blue is the CVD-safe partner (warm/cool).
export const SERIES = {
  searches: "#f4511e",
  empty:    "#2a78d6",
  /** Single-series bars: one hue for every bar. Never a value-ramp — bar length
   *  already encodes magnitude, and colouring by value spends the identity
   *  channel re-encoding it. */
  bar:      "#f4511e",
} as const;

export const CHART_INK = {
  grid:  "#eceff1",   // solid hairline, one shade off the surface — never dashed
  axis:  "#c9cdd1",
  label: "#8c8f94",
} as const;

// ── Formatting ────────────────────────────────────────────────────────────────

/** Stat-tile / hero figures: compact, and proportional figures (no tabular-nums). */
export function compactNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 1_000_000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
  }
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function fullNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-GB").format(n);
}

export function percent(n: number | null | undefined, dp = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(dp)}%`;
}

/** Axis ticks: "01 Aug". */
export function shortDay(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" })
      .format(new Date(iso));
  } catch { return iso; }
}

export function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .format(new Date(iso));
  } catch { return iso; }
}

/** "2 days ago" — recency is the point of `last_searched`, not the timestamp. */
export function relativeDays(iso?: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return shortDate(iso);
}

// ── Stock status ──────────────────────────────────────────────────────────────
// Two different actions, so two different treatments — and never colour alone:
// each ships an icon and a label. Rendered as a tinted badge with dark text
// (the admin's existing badge language) rather than raw status hues, which keeps
// the text well clear of contrast limits.

export type StockPresentation = {
  label: string;
  /** What someone should actually do about it. */
  action: string;
  badge: string;
  dot: string;
};

const STOCK: Record<string, StockPresentation> = {
  all_out_of_stock: {
    label:  "All out of stock",
    action: "Restock",
    badge:  "bg-red-50 text-red-700 border-red-200",
    dot:    "bg-red-500",
  },
  not_stocked: {
    label:  "Not stocked",
    action: "Range decision",
    badge:  "bg-amber-50 text-amber-800 border-amber-200",
    dot:    "bg-amber-500",
  },
  available: {
    label:  "Available",
    action: "—",
    badge:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot:    "bg-emerald-500",
  },
};

export function stockPresentation(status: string): StockPresentation {
  return STOCK[status] ?? {
    label:  status.replace(/_/g, " "),
    action: "—",
    badge:  "bg-gray-100 text-gray-700 border-gray-200",
    dot:    "bg-gray-400",
  };
}

/** Category codes come back lowercase (`tbr`); tyre categories are acronyms. */
export function dimensionLabel(value: string): string {
  const v = value.trim();
  if (/^(tbr|pcr|otr|suv|van|4x4)$/i.test(v)) return v.toUpperCase();
  return v.charAt(0).toUpperCase() + v.slice(1);
}
