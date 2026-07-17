"use client";
import { useCallback, useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

type ChartPoint = { date: string; confirmed: number; pending: number };

function SkeletonChart() {
  return (
    <div className="flex h-[180px] items-end gap-2 px-2 pb-2">
      {[60, 40, 80, 55, 90, 45, 70].map((h, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-t-sm bg-[#e5e7eb]" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const confirmed = payload.find((p: { dataKey: string }) => p.dataKey === "confirmed")?.value ?? 0;
  const pending   = payload.find((p: { dataKey: string }) => p.dataKey === "pending")?.value ?? 0;
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 shadow-sm">
      <p className="mb-1.5 text-[0.72rem] font-semibold text-[#5c5e62]">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#E85C1A]" />
          <span className="text-[0.72rem] text-[#5c5e62]">Confirmed</span>
          <span className="ml-auto text-[0.85rem] font-bold tabular-nums text-[#E85C1A]">
            €{Number(confirmed).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
          </span>
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#f4b08a]" />
            <span className="text-[0.72rem] text-[#5c5e62]">Pending</span>
            <span className="ml-auto text-[0.82rem] font-semibold tabular-nums text-[#f4845a]">
              €{Number(pending).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtEur(n: number) {
  return `€${n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toFixed(2)}`;
}

export default function RevenueChart() {
  const [data,    setData]    = useState<ChartPoint[] | null>(null);
  const [loading, setLoad]    = useState(true);
  const [totals,  setTotals]  = useState({ confirmed: 0, pending: 0 });

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/dashboard/stats", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);

    if (res?.revenueChart) {
      const chart: ChartPoint[] = res.revenueChart;
      setData(chart);
      setTotals({
        confirmed: chart.reduce((s, p) => s + (p.confirmed ?? 0), 0),
        pending:   chart.reduce((s, p) => s + (p.pending   ?? 0), 0),
      });
    }
    setLoad(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + poll, same pattern as cart-context.tsx
    void refresh();
    const t = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="flex items-start justify-between border-b border-black/[0.06] px-5 py-4">
        <div>
          <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Revenue — Last 7 Days</p>
          {!loading && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <p className="text-[0.78rem] tabular-nums text-[#5c5e62]">
                Confirmed:{" "}
                <strong className="text-[#1a1a1a]">
                  {fmtEur(totals.confirmed)}
                </strong>
              </p>
              {totals.pending > 0 && (
                <p className="text-[0.75rem] font-semibold tabular-nums text-[#E85C1A]">
                  + {fmtEur(totals.pending)} pending
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff1ec]">
          <span className="text-[0.7rem] font-black text-[#E85C1A]">7D</span>
        </div>
      </div>

      <div className="px-2 py-3">
        {loading ? (
          <SkeletonChart />
        ) : data === null ? (
          <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-[#9ca3af]">
            <p className="text-[0.82rem]">Chart data unavailable.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={data ?? []} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="confirmedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#E85C1A" stopOpacity={0.20} />
                  <stop offset="60%" stopColor="#E85C1A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f4845a" stopOpacity={0.12} />
                  <stop offset="60%" stopColor="#f4845a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f0f0f0" strokeOpacity={0.6} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Pending — lighter, dashed stroke, behind confirmed */}
              <Area
                type="monotone"
                dataKey="pending"
                stroke="#f4845a"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="url(#pendingGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#f4845a", strokeWidth: 0 }}
              />
              {/* Confirmed — solid, prominent */}
              <Area
                type="monotone"
                dataKey="confirmed"
                stroke="#E85C1A"
                strokeWidth={2}
                fill="url(#confirmedGrad)"
                dot={{ r: 3, fill: "#E85C1A", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#E85C1A" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      {!loading && data !== null && (
        <div className="flex items-center gap-4 border-t border-black/[0.04] px-5 py-2.5">
          <span className="flex items-center gap-1.5 text-[0.72rem] text-[#5c5e62]">
            <span className="h-0.5 w-4 rounded bg-[#E85C1A]" />
            Confirmed revenue
          </span>
          <span className="flex items-center gap-1.5 text-[0.72rem] text-[#9ca3af]">
            <span
              className="h-0.5 w-4 rounded"
              style={{ background: "repeating-linear-gradient(90deg,#f4845a 0,#f4845a 4px,transparent 4px,transparent 7px)" }}
            />
            Pending
          </span>
        </div>
      )}
    </div>
  );
}
