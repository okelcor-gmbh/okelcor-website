"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, ShoppingCart, Users, Zap, BarChart2, DollarSign, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { useCountUp } from "./count-up";

type Metrics = {
  revenueToday:           number;
  revenueYesterday:       number;
  pendingRevenueToday:    number;
  ordersToday:            number;
  ordersYesterday:        number;
  ordersConfirmedToday:   number;
  ordersPendingToday:     number;
  newCustomersToday:      number;
  newCustomersYesterday:  number;
  activeSessionsNow:      number;
  sessionsToday:          number;
  avgOrderValueToday:     number;
  avgOrderValueYesterday: number;
  conversionRate:         number;
  aovPeriodLabel:         string | null;
  aovPaidOrdersCount:     number | null;
  aovManualOrdersCount:   number | null;
};

function pctDelta(a: number, b: number): number | null {
  if (b === 0) return null;
  return Math.round(((a - b) / b) * 100);
}

function Trend({ current, prev }: { current: number; prev: number }) {
  const delta = pctDelta(current, prev);
  if (delta === null) return <span className="text-[0.7rem] text-[#9ca3af]">no data</span>;
  const Icon  = delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const color = delta === 0 ? "text-[#9ca3af]" : delta > 0 ? "text-emerald-600" : "text-red-500";
  return (
    <span className={`flex items-center gap-0.5 text-[0.72rem] font-semibold ${color}`}>
      <Icon size={11} strokeWidth={2.5} />
      {delta >= 0 ? "+" : ""}{delta}% vs yesterday
    </span>
  );
}

function fmtCurrency(n: number): string {
  return `€${n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toFixed(2)}`;
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 h-10 w-10 animate-pulse rounded-xl bg-[#e5e7eb]" />
      <div className="h-3 w-20 animate-pulse rounded bg-[#e5e7eb]" />
      <div className="mt-2 h-7 w-28 animate-pulse rounded bg-[#e5e7eb]" />
    </div>
  );
}

// ── Specialised Revenue card (shows confirmed + pending split) ────────────────

function RevenueTodayCard({
  confirmed,
  confirmedYesterday,
  pending,
}: {
  confirmed:          number;
  confirmedYesterday: number;
  pending:            number;
}) {
  const animated = useCountUp(Math.round(confirmed));

  return (
    <div className="group flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E85C1A]">
          <DollarSign size={18} strokeWidth={1.8} className="text-white" />
        </div>
        <Trend current={confirmed} prev={confirmedYesterday} />
      </div>
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">Revenue Today</p>
        <p className="mt-0.5 text-2xl font-extrabold text-[#1a1a1a]">
          {`€${animated >= 1000 ? (animated / 1000).toFixed(1) + "k" : animated.toFixed(2)}`}
        </p>
        {pending > 0 ? (
          <p className="mt-0.5 text-[0.7rem] font-semibold text-[#E85C1A]">
            + {fmtCurrency(pending)} pending
          </p>
        ) : (
          <p className="mt-0.5 text-[0.7rem] text-[#9ca3af]">confirmed only</p>
        )}
      </div>
    </div>
  );
}

// ── Orders Today card (shows confirmed + pending split) ───────────────────────

function OrdersTodayCard({
  total,
  totalYesterday,
  confirmed,
  pending,
}: {
  total:          number;
  totalYesterday: number;
  confirmed:      number;
  pending:        number;
}) {
  const animated = useCountUp(total);

  return (
    <div className="group flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
          <ShoppingCart size={18} strokeWidth={1.8} className="text-white" />
        </div>
        <Trend current={total} prev={totalYesterday} />
      </div>
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">Orders Today</p>
        <p className="mt-0.5 text-2xl font-extrabold text-[#1a1a1a]">{animated.toLocaleString()}</p>
        {(confirmed > 0 || pending > 0) ? (
          <p className="mt-0.5 text-[0.7rem] text-[#5c5e62]">
            <span className="text-emerald-600 font-semibold">{confirmed} confirmed</span>
            {pending > 0 && (
              <> · <span className="font-semibold text-[#E85C1A]">{pending} pending</span></>
            )}
          </p>
        ) : (
          <p className="mt-0.5 text-[0.7rem] text-[#9ca3af]">no orders yet</p>
        )}
      </div>
    </div>
  );
}

// ── Generic metric card ───────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, note, icon: Icon, accent, trend, format = "number",
}: {
  label:   string;
  value:   number;
  sub?:    string;
  note?:   string;
  icon:    React.ElementType;
  accent:  string;
  trend?:  { current: number; prev: number };
  format?: "currency" | "number" | "pct";
}) {
  const animated = useCountUp(value);
  return (
    <div className="group flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={18} strokeWidth={1.8} className="text-white" />
        </div>
        {trend && <Trend current={trend.current} prev={trend.prev} />}
      </div>
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold text-[#1a1a1a]">
          {format === "currency"
            ? `€${animated >= 1000 ? (animated / 1000).toFixed(1) + "k" : animated.toLocaleString()}`
            : format === "pct"
            ? `${animated}%`
            : animated.toLocaleString()}
        </p>
        {sub && <p className="mt-0.5 text-[0.7rem] text-[#9ca3af]">{sub}</p>}
        {note && <p className="mt-0.5 text-[0.68rem] italic text-[#c0c3c8]">{note}</p>}
      </div>
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────────────────

const REFRESH = 30_000;

export default function HeroMetrics() {
  const [m, setM]             = useState<Metrics | null>(null);
  const [loading, setL]       = useState(true);
  const [stale, setStale]     = useState(false);
  const [fetchErr, setFetchErr] = useState(false);
  const hasData               = useRef(false);

  // background=true → preserve existing data on failure instead of wiping it
  const refresh = useCallback(async (background = false) => {
    if (background) setStale(true);
    const [statsRes, phRes] = await Promise.all([
      fetch("/api/admin/dashboard/stats",   { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/posthog/dashboard", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    if (statsRes) {
      hasData.current = true;
      setFetchErr(false);
      setStale(false);
      setM({
        revenueToday:           statsRes.revenueToday           ?? 0,
        revenueYesterday:       statsRes.revenueYesterday       ?? 0,
        pendingRevenueToday:    statsRes.pendingRevenueToday    ?? 0,
        ordersToday:            statsRes.ordersToday            ?? 0,
        ordersYesterday:        statsRes.ordersYesterday        ?? 0,
        ordersConfirmedToday:   statsRes.ordersConfirmedToday   ?? 0,
        ordersPendingToday:     statsRes.ordersPendingToday     ?? 0,
        newCustomersToday:      statsRes.newCustomersToday      ?? 0,
        newCustomersYesterday:  statsRes.newCustomersYesterday  ?? 0,
        activeSessionsNow:      phRes?.activeUsersNow           ?? 0,
        sessionsToday:          phRes?.sessionsToday            ?? 0,
        avgOrderValueToday:     statsRes.avgOrderValueToday     ?? 0,
        avgOrderValueYesterday: statsRes.avgOrderValueYesterday ?? 0,
        conversionRate:         statsRes.conversionRate         ?? 0,
        aovPeriodLabel:         statsRes.aovPeriodLabel         ?? null,
        aovPaidOrdersCount:     statsRes.aovPaidOrdersCount     ?? null,
        aovManualOrdersCount:   statsRes.aovManualOrdersCount   ?? null,
      });
    } else if (!hasData.current) {
      // Only mark error on first-load failure — background failure just keeps stale=true
      setFetchErr(true);
    }
    setL(false);
  }, []);

  useEffect(() => {
    void refresh(false);
    const t = setInterval(() => void refresh(true), REFRESH);
    return () => clearInterval(t);
  }, [refresh]);

  // First load in progress
  if (loading && m === null) {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  // First load failed
  if (m === null && fetchErr) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
        <AlertCircle size={18} className="shrink-0 text-[#9ca3af]" />
        <p className="text-[0.83rem] text-[#5c5e62]">Could not load dashboard metrics.</p>
        <button
          type="button"
          onClick={() => void refresh(false)}
          className="ml-auto flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#E85C1A] hover:underline"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6 transition-opacity duration-300 ${stale ? "opacity-60" : ""}`}>

      <RevenueTodayCard
        confirmed={m?.revenueToday ?? 0}
        confirmedYesterday={m?.revenueYesterday ?? 0}
        pending={m?.pendingRevenueToday ?? 0}
      />

      <OrdersTodayCard
        total={m?.ordersToday ?? 0}
        totalYesterday={m?.ordersYesterday ?? 0}
        confirmed={m?.ordersConfirmedToday ?? 0}
        pending={m?.ordersPendingToday ?? 0}
      />

      <MetricCard
        label="New Customers"
        value={m?.newCustomersToday ?? 0}
        sub="today"
        icon={Users}
        accent="bg-violet-500"
        trend={{ current: m?.newCustomersToday ?? 0, prev: m?.newCustomersYesterday ?? 0 }}
      />

      <MetricCard
        label="Active Right Now"
        value={m?.activeSessionsNow ?? 0}
        sub="last 5 minutes"
        icon={Activity}
        accent="bg-emerald-500"
      />

      <MetricCard
        label="Conversion Rate"
        value={m?.conversionRate ?? 0}
        sub={m && m.sessionsToday > 0 ? `${m.sessionsToday} sessions today` : "from order analytics"}
        format="pct"
        icon={BarChart2}
        accent="bg-amber-500"
      />

      <MetricCard
        label="Avg Order Value"
        value={Math.round(m?.avgOrderValueToday ?? 0)}
        sub={[
          m?.aovPeriodLabel,
          m?.aovPaidOrdersCount != null ? `${m.aovPaidOrdersCount} paid orders` : null,
        ].filter(Boolean).join(" · ") || "confirmed orders only"}
        note={(m?.aovManualOrdersCount ?? 0) > 0 ? "includes manual/imported orders" : undefined}
        format="currency"
        icon={Zap}
        accent="bg-cyan-500"
        trend={{ current: m?.avgOrderValueToday ?? 0, prev: m?.avgOrderValueYesterday ?? 0 }}
      />

    </div>
  );
}
