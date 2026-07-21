"use client";

import { useCallback, useEffect, useState } from "react";

export type MarketOption = { market: string; contact_count: number };

/**
 * Markets are auto-discovered server-side from real contact data (grouped
 * by the `market` column) — not a hardcoded list. Fetched once per mount;
 * call `refresh()` after creating a contact under a brand-new market so it
 * shows up without a full page reload.
 */
export function useMarketOptions() {
  const [markets, setMarkets] = useState<MarketOption[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/marketing-contacts/markets");
      const json = await res.json().catch(() => ({ data: [] }));
      setMarkets(Array.isArray(json.data) ? json.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { markets, loading, refresh };
}

function label(market: string) {
  return market.charAt(0).toUpperCase() + market.slice(1);
}

const NEW_MARKET_SENTINEL = "__new__";
const BASE_CLASS =
  "h-9 rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] focus:border-[#f4511e] focus:outline-none";

/**
 * Two modes:
 * - "filter": plain dropdown of discovered markets only — filtering by a
 *   market with zero contacts is meaningless, so no way to add one here.
 * - "create": adds a "+ New market" option that reveals a free-text input,
 *   for import/manual-add flows that can genuinely tag something new.
 *
 * Note: the backend does not normalise (slugify) market values embedded
 * inside an imported CSV's own column, only ones supplied here directly —
 * so this component doesn't attempt client-side dedup/casing fixes either;
 * it shows exactly what `/markets` returns.
 */
export function MarketSelect({
  markets,
  value,
  onChange,
  mode,
  allLabel = "All markets",
  className,
}: {
  markets: MarketOption[];
  value: string;
  onChange: (market: string) => void;
  mode: "filter" | "create";
  allLabel?: string;
  className?: string;
}) {
  const isKnownMarket = markets.some((m) => m.market === value);
  const [creatingNew, setCreatingNew] = useState(mode === "create" && value !== "" && !isKnownMarket);

  if (mode === "filter") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={className ?? BASE_CLASS}>
        <option value="">{allLabel}</option>
        {markets.map((m) => (
          <option key={m.market} value={m.market}>
            {label(m.market)} ({m.contact_count})
          </option>
        ))}
      </select>
    );
  }

  if (creatingNew) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          autoFocus
          placeholder="New market name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={
            className ??
            "h-9 flex-1 rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
          }
        />
        <button
          type="button"
          onClick={() => {
            setCreatingNew(false);
            onChange("");
          }}
          className="shrink-0 text-[0.78rem] text-[#5c5e62] hover:text-[#171a20]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === NEW_MARKET_SENTINEL) {
          setCreatingNew(true);
          onChange("");
        } else {
          onChange(e.target.value);
        }
      }}
      className={className ?? BASE_CLASS}
    >
      <option value="">Select market…</option>
      {markets.map((m) => (
        <option key={m.market} value={m.market}>
          {label(m.market)} ({m.contact_count})
        </option>
      ))}
      <option value={NEW_MARKET_SENTINEL}>+ New market</option>
    </select>
  );
}
