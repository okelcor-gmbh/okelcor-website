/**
 * lib/market-intelligence.ts
 *
 * Types and presentation rules for the market scorecard.
 * Contract: FRONTEND_NOTE_market-intelligence.md in the API repo (Session 98).
 *
 * Two rules from that note are enforced here rather than left to each caller,
 * because getting either wrong turns an honest report into a misleading one:
 *
 *   - a null rate is "nobody asked", NOT "0%"
 *   - `demand: null` is "not recorded", NOT "no demand"
 */

export type MarketSignal =
  | "proven"
  | "buying_quietly"
  | "demand_not_served"
  | "interest_no_reach"
  | "demand_not_converting"
  | "reach_no_interest"
  | "reach_unmeasured"
  | "emerging";

export type MarketRow = {
  country_code: string;
  country: string;
  signal: MarketSignal;
  signal_label: string;
  recommended_action: string;
  priority: number;
  demand: {
    searches: number;
    visitors: number;
    unmet_searches: number;
    unmet_rate: number | null;
    top_unmet_terms: { term: string; searches: number }[];
  } | null;
  pipeline: { quotes: number; quotes_converted: number };
  commercial: {
    orders: number;
    revenue_by_currency: Record<string, number>;
    customers: number;
  };
  reach: { contacts: number; market_slugs: string[] };
  rates: { quote_to_order: number | null; quote_win_rate: number | null };
  reference: ReferenceStat[];
};

export type ReferenceStat = {
  metric: string;
  value: number;
  unit: string | null;
  period: string | null;
  source: string | null;
};

export type MarketReport = {
  available: boolean;
  period: { from: string; to: string };
  markets: MarketRow[];
  totals: { markets: number; by_signal: Record<string, number> };
  unmeasured: { country_code: string; country: string; reference: ReferenceStat[] }[];
  unrecognised: { source: string; value: string; rows: number }[];
  signals: Record<string, { label: string; action: string }>;
  meta: { search_recording: boolean; not_covered: string[] };
};

/**
 * Tone per signal. Amber is used for the two OPPORTUNITY states, not for
 * problems — this report is read to find somewhere to go, and colouring the
 * openings like warnings buries the point of the page.
 */
export const SIGNAL_TONE: Record<MarketSignal, { chip: string; dot: string }> = {
  proven:                { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  buying_quietly:        { chip: "bg-teal-50 text-teal-700 border-teal-200",          dot: "bg-teal-500" },
  demand_not_served:     { chip: "bg-amber-50 text-amber-800 border-amber-200",       dot: "bg-amber-500" },
  interest_no_reach:     { chip: "bg-orange-50 text-orange-800 border-orange-200",    dot: "bg-[#f4511e]" },
  demand_not_converting: { chip: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500" },
  reach_no_interest:     { chip: "bg-slate-100 text-slate-700 border-slate-200",      dot: "bg-slate-400" },
  reach_unmeasured:      { chip: "bg-slate-100 text-slate-700 border-slate-200",      dot: "bg-slate-400" },
  emerging:              { chip: "bg-slate-50 text-slate-500 border-slate-200",       dot: "bg-slate-300" },
};

/** The two states that mean "there is an opening here". */
export const OPPORTUNITY_SIGNALS: MarketSignal[] = ["interest_no_reach", "demand_not_served"];

/**
 * A null rate means the denominator was zero — nobody asked. Rendering that
 * as "0%" tells the reader a market failed to convert when in fact nothing
 * was ever put into it.
 */
export function rate(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`;
}

export function count(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(undefined).format(value);
}

/** "41,200.00 EUR · 8,300.00 USD" — never summed, see the contract note §6. */
export function revenue(byCurrency: Record<string, number>): string {
  const entries = Object.entries(byCurrency ?? {});
  if (entries.length === 0) return "—";
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([currency, value]) =>
      `${new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency}`)
    .join(" · ");
}

export function flag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/** ISO date `n` days before today, for the range presets. */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
