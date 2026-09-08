"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Activity, RefreshCw, Users, TrendingUp, Clock, Eye, AlertCircle, Loader2 } from "lucide-react";

const REFRESH_MS = 30_000;

type Stats = {
  activeUsersNow:    number;
  sessionsToday:     number;
  sessionsYesterday: number;
  topPages:          { path: string; views: number }[];
  recentEvents:      { timestamp: string; event: string; url: string }[];
};

function fmtTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

function sessionDelta(today: number, yesterday: number): { label: string; up: boolean } {
  if (yesterday === 0) return { label: "no data yesterday", up: true };
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return {
    label: `${pct >= 0 ? "+" : ""}${pct}% vs yesterday`,
    up:    pct >= 0,
  };
}

function EventBadge({ name }: { name: string }) {
  const map: Record<string, string> = {
    "$pageview":          "bg-blue-100 text-blue-700",
    "product_viewed":     "bg-violet-100 text-violet-700",
    "add_to_cart":        "bg-green-100 text-green-700",
    "checkout_started":   "bg-amber-100 text-amber-700",
    "quote_requested":    "bg-orange-100 text-orange-700",
    "tyre_spec_selected": "bg-cyan-100 text-cyan-700",
    "$identify":          "bg-gray-100 text-gray-600",
  };
  const cls = map[name] ?? "bg-[#f0f2f5] text-[#5c5e62]";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${cls}`}>
      {name}
    </span>
  );
}

export default function PostHogPanel() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [errStep, setErrStep]   = useState<string | null>(null);
  const [lastRefresh, setLast]  = useState<Date | null>(null);
  const [age, setAge]           = useState(0);
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null);
  const ageRef                  = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrStep(null);
    try {
      const res = await fetch("/api/admin/posthog/stats", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        setErrStep(json.step ?? null);
      } else {
        setStats(json);
        setLast(new Date());
        setAge(0);
      }
    } catch {
      setError("Network error — could not reach the stats endpoint.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 30s auto-refresh
  useEffect(() => {
    fetchStats();
    timerRef.current = setInterval(fetchStats, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchStats]);

  // Age counter (seconds since last refresh)
  useEffect(() => {
    ageRef.current = setInterval(() => setAge((a) => a + 1), 1000);
    return () => {
      if (ageRef.current) clearInterval(ageRef.current);
    };
  }, []);

  const notConfigured = errStep === "config" || error?.includes("not configured");
  const maxViews = stats?.topPages[0]?.views ?? 1;
  const delta = stats ? sessionDelta(stats.sessionsToday, stats.sessionsYesterday) : null;

  return (
    <div className="mt-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d4ed8]">
            <Activity size={16} strokeWidth={2} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[1rem] font-extrabold text-[#1a1a1a]">PostHog</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Real-time
              </span>
            </div>
            <p className="text-[0.78rem] text-[#5c5e62]">
              {lastRefresh
                ? `Last refreshed ${age}s ago · auto-refreshes every 30s`
                : "Loading…"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5] disabled:opacity-50"
          >
            <RefreshCw size={13} strokeWidth={2} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <a
            href="https://app.posthog.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
          >
            <ExternalLink size={13} strokeWidth={2} />
            Open PostHog
          </a>
        </div>
      </div>

      {/* Not configured */}
      {notConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-amber-500" />
          <p className="text-[0.95rem] font-extrabold text-[#1a1a1a]">PostHog not configured</p>
          <p className="mt-2 text-[0.83rem] leading-6 text-[#5c5e62]">
            Add these environment variables to enable PostHog analytics:
          </p>
          <div className="mx-auto mt-4 max-w-md rounded-xl bg-white px-5 py-4 text-left font-mono text-[0.78rem] text-[#1a1a1a] shadow-sm">
            <p className="text-green-600">NEXT_PUBLIC_POSTHOG_KEY=phc_…</p>
            <p className="text-green-600">POSTHOG_PERSONAL_API_KEY=phc_…</p>
            <p className="text-green-600">NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com</p>
          </div>
        </div>
      )}

      {/* Error (not config related) */}
      {error && !notConfigured && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          {errStep && (
            <p className="mb-1 font-bold uppercase tracking-wide text-red-500 text-[0.7rem]">
              Failed at step: {errStep}
            </p>
          )}
          <p className="break-words leading-5">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !stats && !error && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#9ca3af]" />
        </div>
      )}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {/* Active users now */}
            <div className="flex items-center gap-5 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8]">
                <Users size={20} strokeWidth={1.8} className="text-white" />
              </div>
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">
                  Active Right Now
                </p>
                <p className="mt-0.5 text-2xl font-extrabold text-[#1a1a1a]">
                  {stats.activeUsersNow}
                </p>
                <p className="mt-0.5 text-[0.72rem] text-[#5c5e62]">last 5 minutes</p>
              </div>
            </div>

            {/* Sessions today */}
            <div className="flex items-center gap-5 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500">
                <TrendingUp size={20} strokeWidth={1.8} className="text-white" />
              </div>
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">
                  Sessions Today
                </p>
                <p className="mt-0.5 text-2xl font-extrabold text-[#1a1a1a]">
                  {stats.sessionsToday}
                </p>
                {delta && (
                  <p className={`mt-0.5 text-[0.72rem] font-semibold ${delta.up ? "text-emerald-600" : "text-red-500"}`}>
                    {delta.label}
                  </p>
                )}
              </div>
            </div>

            {/* Sessions yesterday */}
            <div className="flex items-center gap-5 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6b7280]">
                <Clock size={20} strokeWidth={1.8} className="text-white" />
              </div>
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">
                  Sessions Yesterday
                </p>
                <p className="mt-0.5 text-2xl font-extrabold text-[#1a1a1a]">
                  {stats.sessionsYesterday}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom grid: top pages + recent events */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Top pages today */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-5 py-4">
                <Eye size={15} className="text-[#5c5e62]" />
                <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">Top Pages Today</p>
              </div>
              <div className="divide-y divide-black/[0.04]">
                {stats.topPages.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[0.83rem] text-[#5c5e62]">
                    No pageviews yet today.
                  </p>
                ) : (
                  stats.topPages.map((p) => (
                    <div key={p.path} className="px-5 py-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="max-w-[70%] truncate text-[0.82rem] text-[#1a1a1a]">
                          {p.path || "/"}
                        </span>
                        <span className="text-[0.8rem] font-semibold text-[#5c5e62]">{p.views}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f2f5]">
                        <div
                          className="h-full rounded-full bg-[#1d4ed8]"
                          style={{ width: `${Math.round((p.views / maxViews) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live events feed */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <Activity size={15} className="text-[#5c5e62]" />
                  <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">Live Events</p>
                </div>
                <span className="text-[0.72rem] text-[#9ca3af]">last 10</span>
              </div>
              <div className="divide-y divide-black/[0.04]">
                {stats.recentEvents.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[0.83rem] text-[#5c5e62]">
                    No events in the last 2 hours.
                  </p>
                ) : (
                  stats.recentEvents.map((e, i) => (
                    <div key={i} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <EventBadge name={e.event} />
                          <p className="mt-1 truncate text-[0.78rem] text-[#5c5e62]">
                            {e.url
                              ? e.url.replace(/^https?:\/\/[^/]+/, "") || "/"
                              : "—"}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[0.72rem] text-[#9ca3af]">
                          {fmtTimestamp(e.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
