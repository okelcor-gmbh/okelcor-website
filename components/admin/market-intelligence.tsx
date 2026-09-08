"use client";

/**
 * Market intelligence — which market to enter next.
 *
 * Written for the marketing team, not for a developer. That drives three
 * decisions here:
 *
 *  - the opportunities are lifted to the top, not buried in a sortable table
 *  - every market carries the ACTION it implies, in words, next to its numbers
 *  - the three honesty blocks (unrecognised / unmeasured / caveats) are always
 *    rendered, never behind a toggle. They are the difference between a tool
 *    people trust and a dashboard that quietly misleads.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, AlertTriangle, Download, Globe2, Info, Loader2, RefreshCw,
  Search, Target, TrendingUp, Users, Megaphone, ChevronDown, ChevronRight,
} from "lucide-react";
import {
  OPPORTUNITY_SIGNALS, SIGNAL_TONE, count, daysAgo, flag, rate, revenue, today,
  type MarketReport, type MarketRow,
} from "@/lib/market-intelligence";

const RANGES = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 180, label: "6 months" },
  { days: 365, label: "12 months" },
] as const;

export default function MarketIntelligence() {
  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number>(90);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams({ from: daysAgo(days), to: today() });

    try {
      const res = await fetch(`/api/admin/analytics/markets?${qs}`, { cache: "no-store" });

      if (res.status === 404 || res.status === 405) {
        setError("not_deployed");
        return;
      }
      if (res.status === 403) {
        setError("You don't have access to market analytics.");
        return;
      }
      if (!res.ok) {
        setError(`Could not load the report (error ${res.status}).`);
        return;
      }

      const json = await res.json();
      setReport(json.data ?? null);
    } catch {
      setError("Network error loading the report.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void load(); }, [load]);

  const opportunities = (report?.markets ?? []).filter((m) =>
    OPPORTUNITY_SIGNALS.includes(m.signal));

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
            Market intelligence
          </p>
          <h1 className="mt-0.5 text-[1.15rem] font-extrabold text-[#1a1a1a]">
            Where should Okelcor sell next?
          </h1>
          <p className="mt-1 max-w-2xl text-[0.85rem] leading-relaxed text-[#5c5e62]">
            One row per country, joining what people searched for, what they asked
            about, what they bought, and whether we have anyone to talk to there.
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-black/[0.09] bg-white p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                className={[
                  "h-8 rounded-lg px-3 text-[0.78rem] font-semibold transition",
                  days === r.days ? "bg-[#171a20] text-white" : "text-[#5c5e62] hover:text-[#1a1a1a]",
                ].join(" ")}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void load()}
            title="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.09] bg-white text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e]"
          >
            <RefreshCw size={15} />
          </button>

          <a
            href={`/api/admin/analytics/markets/export?from=${daysAgo(days)}&to=${today()}`}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#f4511e] px-5 text-[0.82rem] font-semibold text-white transition hover:bg-[#d44d10]"
          >
            <Download size={15} /> Export
          </a>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={22} className="animate-spin text-[#f4511e]" />
        </div>
      ) : error === "not_deployed" ? (
        <Notice
          tone="info"
          title="Market intelligence isn't live yet"
          body="The backend for this report is built but not deployed. Nothing is broken — there is simply nothing to read yet."
        />
      ) : error ? (
        <Notice tone="error" title="Could not load the report" body={error} />
      ) : !report || report.markets.length === 0 ? (
        <Notice
          tone="info"
          title="No market activity in this window"
          body="Nothing was searched, asked or bought from any recognised country in this period. Try a longer range."
        />
      ) : (
        <div className="space-y-6">
          {!report.meta.search_recording && (
            <Notice
              tone="warn"
              title="Search demand is not being recorded"
              body="Every demand column below is blank rather than zero. Silence here means nothing yet — it is not evidence that nobody is looking."
            />
          )}

          {opportunities.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-[0.875rem] font-bold text-[#1a1a1a]">
                <Target size={15} className="text-[#f4511e]" />
                Openings worth acting on
                <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[0.7rem] font-semibold text-[#5c5e62]">
                  {opportunities.length}
                </span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {opportunities.slice(0, 6).map((m) => (
                  <OpportunityCard key={m.country_code} market={m} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[0.875rem] font-bold text-[#1a1a1a]">
              <Globe2 size={15} className="text-[#5c5e62]" />
              Every market
              <span className="text-[0.75rem] font-normal text-[#9ca3af]">
                ranked by opportunity, then size — not alphabetical
              </span>
            </h2>

            <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead>
                    <tr className="border-b border-black/[0.06] text-[0.7rem] uppercase tracking-wider text-[#9ca3af]">
                      <th className="px-4 py-3 font-bold">Market</th>
                      <th className="px-4 py-3 font-bold">State</th>
                      <th className="px-4 py-3 text-right font-bold">Searches</th>
                      <th className="px-4 py-3 text-right font-bold">Not found</th>
                      <th className="px-4 py-3 text-right font-bold">Quotes</th>
                      <th className="px-4 py-3 text-right font-bold">Orders</th>
                      <th className="px-4 py-3 text-right font-bold">Revenue</th>
                      <th className="px-4 py-3 text-right font-bold">Contacts</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {report.markets.map((m) => (
                      <MarketTableRow
                        key={m.country_code}
                        market={m}
                        open={expanded === m.country_code}
                        onToggle={() =>
                          setExpanded(expanded === m.country_code ? null : m.country_code)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {report.unmeasured.length > 0 && (
            <section className="rounded-xl border border-black/[0.06] bg-white p-5">
              <h2 className="flex items-center gap-2 text-[0.875rem] font-bold text-[#1a1a1a]">
                <Info size={15} className="text-[#5c5e62]" /> Not measured yet
              </h2>
              <p className="mt-1 text-[0.8rem] leading-relaxed text-[#5c5e62]">
                Outside data exists for these countries and nobody has visited from
                them. They are kept out of the ranking on purpose — a zero here would
                read as &ldquo;no demand&rdquo; when it means &ldquo;never measured&rdquo;.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {report.unmeasured.map((u) => (
                  <li
                    key={u.country_code}
                    className="rounded-xl border border-black/[0.07] bg-[#fafafa] px-3 py-2 text-[0.8rem]"
                  >
                    <span className="mr-1.5">{flag(u.country_code)}</span>
                    <span className="font-semibold text-[#1a1a1a]">{u.country}</span>
                    {u.reference[0] && (
                      <span className="ml-2 text-[0.72rem] text-[#9ca3af]">
                        {u.reference[0].metric}: {count(u.reference[0].value)}{" "}
                        {u.reference[0].unit ?? ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.unrecognised.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="flex items-center gap-2 text-[0.875rem] font-bold text-amber-900">
                <AlertTriangle size={15} /> Countries we could not read
              </h2>
              <p className="mt-1 text-[0.8rem] leading-relaxed text-amber-800">
                These were stored in a form the report could not match to a country,
                so <strong>the rows above are missing them</strong>. Correcting the
                spelling at the source puts that business back into its market.
              </p>
              <ul className="mt-3 space-y-1.5">
                {report.unrecognised.map((u) => (
                  <li key={`${u.source}-${u.value}`} className="text-[0.8rem] text-amber-900">
                    <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono">{u.value}</code>
                    <span className="ml-2 text-amber-700">
                      in {u.source} — {u.rows} row{u.rows === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-black/[0.06] bg-[#fafafa] p-5">
            <h2 className="flex items-center gap-2 text-[0.8rem] font-bold text-[#5c5e62]">
              <Info size={14} /> What this report cannot tell you
            </h2>
            <ul className="mt-2 space-y-1.5">
              {report.meta.not_covered.map((line) => (
                <li key={line} className="text-[0.78rem] leading-relaxed text-[#5c5e62]">
                  · {line}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function OpportunityCard({ market }: { market: MarketRow }) {
  const tone = SIGNAL_TONE[market.signal];

  return (
    <article className="rounded-xl border border-[#f4511e]/25 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-[1.4rem] leading-none">{flag(market.country_code)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-extrabold text-[#1a1a1a]">{market.country}</p>
          <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[0.68rem] font-bold ${tone.chip}`}>
            {market.signal_label}
          </span>
        </div>
      </div>

      <p className="mt-3 text-[0.82rem] leading-relaxed text-[#5c5e62]">
        {market.recommended_action}
      </p>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-black/[0.05] pt-3">
        {market.demand && (
          <Metric icon={Search} label="Searches" value={count(market.demand.searches)} />
        )}
        {market.demand && market.demand.unmet_searches > 0 && (
          <Metric
            icon={AlertCircle}
            label="Found nothing"
            value={`${count(market.demand.unmet_searches)} (${rate(market.demand.unmet_rate)})`}
          />
        )}
        <Metric icon={TrendingUp} label="Quotes" value={count(market.pipeline.quotes)} />
        <Metric icon={Users} label="Contacts" value={count(market.reach.contacts)} />
      </div>

      {market.demand && market.demand.top_unmet_terms.length > 0 && (
        <p className="mt-3 text-[0.76rem] text-[#5c5e62]">
          <span className="font-semibold text-[#1a1a1a]">Asked for, not found:</span>{" "}
          {market.demand.top_unmet_terms.map((t) => `${t.term} (${t.searches})`).join(", ")}
        </p>
      )}

      {market.signal === "interest_no_reach" && (
        <Link
          href={`/admin/marketing?country=${encodeURIComponent(market.country)}`}
          className="mt-4 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#f4511e] transition hover:underline"
        >
          <Megaphone size={13} /> Build a list for {market.country}
        </Link>
      )}

      {market.signal !== "interest_no_reach" && market.reach.market_slugs.length > 0 && (
        <Link
          href={`/admin/marketing?market=${encodeURIComponent(market.reach.market_slugs[0])}`}
          className="mt-4 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#f4511e] transition hover:underline"
        >
          <Megaphone size={13} /> Campaign to {market.reach.contacts} contacts
        </Link>
      )}
    </article>
  );
}

function MarketTableRow({
  market, open, onToggle,
}: {
  market: MarketRow; open: boolean; onToggle: () => void;
}) {
  const tone = SIGNAL_TONE[market.signal];

  return (
    <>
      <tr className="text-[0.83rem] transition hover:bg-[#fafafa]">
        <td className="px-4 py-3">
          <span className="mr-2">{flag(market.country_code)}</span>
          <span className="font-semibold text-[#1a1a1a]">{market.country}</span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.68rem] font-bold ${tone.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {market.signal_label}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-[#5c5e62]">
          {market.demand ? count(market.demand.searches) : "—"}
        </td>
        <td className="px-4 py-3 text-right text-[#5c5e62]">
          {market.demand ? rate(market.demand.unmet_rate) : "—"}
        </td>
        <td className="px-4 py-3 text-right text-[#5c5e62]">{count(market.pipeline.quotes)}</td>
        <td className="px-4 py-3 text-right text-[#5c5e62]">{count(market.commercial.orders)}</td>
        <td className="px-4 py-3 text-right text-[#5c5e62]">
          {revenue(market.commercial.revenue_by_currency)}
        </td>
        <td className="px-4 py-3 text-right text-[#5c5e62]">{count(market.reach.contacts)}</td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? "Collapse" : "Expand"}
            className="text-[#9ca3af] transition hover:text-[#1a1a1a]"
          >
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        </td>
      </tr>

      {open && (
        <tr className="bg-[#fafafa]">
          <td colSpan={9} className="px-4 py-4">
            <p className="text-[0.82rem] leading-relaxed text-[#1a1a1a]">
              <span className="font-bold">What to do: </span>
              {market.recommended_action}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[0.78rem] text-[#5c5e62]">
              <span>Unique visitors: <strong>{market.demand ? count(market.demand.visitors) : "—"}</strong></span>
              <span>Quotes converted: <strong>{count(market.pipeline.quotes_converted)}</strong></span>
              <span>Quote → order: <strong>{rate(market.rates.quote_to_order)}</strong></span>
              <span>Customers: <strong>{count(market.commercial.customers)}</strong></span>
              {market.reach.market_slugs.length > 0 && (
                <span>Campaign markets: <strong>{market.reach.market_slugs.join(", ")}</strong></span>
              )}
            </div>

            {market.demand && market.demand.top_unmet_terms.length > 0 && (
              <p className="mt-3 text-[0.78rem] text-[#5c5e62]">
                <span className="font-semibold text-[#1a1a1a]">Searched here and not found: </span>
                {market.demand.top_unmet_terms.map((t) => `${t.term} (${t.searches}×)`).join(", ")}
              </p>
            )}

            {market.reference.length > 0 && (
              <div className="mt-3 rounded-xl border border-black/[0.07] bg-white px-3 py-2">
                <p className="text-[0.72rem] font-bold uppercase tracking-wider text-[#9ca3af]">
                  Imported market data
                </p>
                <ul className="mt-1 space-y-0.5">
                  {market.reference.map((r) => (
                    <li key={`${r.metric}-${r.period}`} className="text-[0.78rem] text-[#5c5e62]">
                      {r.metric.replace(/_/g, " ")}: <strong>{count(r.value)}</strong>{" "}
                      {r.unit ?? ""} {r.period ? `(${r.period})` : ""}
                      {r.source && <span className="text-[#9ca3af]"> · {r.source}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function Metric({
  icon: Icon, label, value,
}: {
  icon: typeof Search; label: string; value: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[0.78rem] text-[#5c5e62]">
      <Icon size={13} className="text-[#9ca3af]" />
      {label}: <strong className="text-[#1a1a1a]">{value}</strong>
    </span>
  );
}

function Notice({
  tone, title, body,
}: {
  tone: "info" | "warn" | "error"; title: string; body: string;
}) {
  const cls = {
    info:  "border-black/[0.07] bg-white text-[#5c5e62]",
    warn:  "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-700",
  }[tone];

  const Icon = tone === "info" ? Info : tone === "warn" ? AlertTriangle : AlertCircle;

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-5 ${cls}`}>
      <Icon size={17} className="mt-[2px] shrink-0" />
      <div>
        <p className="text-[0.875rem] font-bold">{title}</p>
        <p className="mt-0.5 text-[0.82rem] leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
