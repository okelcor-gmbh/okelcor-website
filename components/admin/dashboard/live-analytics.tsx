"use client";
import { useCallback, useEffect, useState } from "react";
import { Globe, Eye } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type PhData = {
  activeUsersNow: number;
  sessionsToday:  number;
  topPages:       { path: string; views: number }[];
  topCountries:   { code: string; name: string; visits: number }[];
  trafficSources: { source: string; visits: number }[];
};

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  return code.toUpperCase().split("").map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("");
}

const PIE_COLORS = ["#E85C1A", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 shadow-sm">
      <p className="text-[0.78rem] font-semibold text-[#1a1a1a]">{payload[0]?.name}</p>
      <p className="text-[0.72rem] text-[#5c5e62]">{payload[0]?.value} visits</p>
    </div>
  );
}

const REFRESH = 30_000;

export default function LiveAnalytics() {
  const [data, setData]    = useState<PhData | null>(null);
  const [loading, setLoad] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/posthog/dashboard", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (res) setData(res);
    setLoad(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + poll, same pattern as cart-context.tsx
    refresh();
    const t = setInterval(refresh, REFRESH);
    return () => clearInterval(t);
  }, [refresh]);

  const maxViews = data?.topPages[0]?.views ?? 1;

  return (
    <div className="space-y-5">

      {/* Top Countries */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-5 py-4">
          <Globe size={15} className="text-[#5c5e62]" />
          <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Top Countries Today</p>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                <div className="h-5 w-7 animate-pulse rounded bg-[#e5e7eb]" />
                <div className="h-3 flex-1 animate-pulse rounded bg-[#e5e7eb]" />
                <div className="h-3 w-8 animate-pulse rounded bg-[#e5e7eb]" />
              </div>
            ))
          ) : !data?.topCountries?.length ? (
            <p className="px-5 py-6 text-center text-[0.83rem] text-[#5c5e62]">No data yet today.</p>
          ) : (
            data.topCountries.slice(0, 8).map(c => (
              <div key={c.code} className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-lg leading-none">{countryFlag(c.code)}</span>
                <span className="flex-1 text-[0.82rem] text-[#1a1a1a]">{c.name}</span>
                <span className="text-[0.8rem] font-semibold tabular-nums text-[#5c5e62]">{c.visits}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Pages */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Eye size={15} className="text-[#5c5e62]" />
            <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Top Pages Today</p>
          </div>
          <span className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wide text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3">
                <div className="mb-1.5 h-3 w-40 animate-pulse rounded bg-[#e5e7eb]" />
                <div className="h-1.5 w-full animate-pulse rounded-full bg-[#e5e7eb]" />
              </div>
            ))
          ) : !data?.topPages?.length ? (
            <p className="px-5 py-6 text-center text-[0.83rem] text-[#5c5e62]">No pageviews yet.</p>
          ) : (
            data.topPages.map(p => (
              <div key={p.path} className="px-5 py-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="max-w-[70%] truncate text-[0.8rem] text-[#1a1a1a]">{p.path || "/"}</span>
                  <span className="text-[0.78rem] font-semibold tabular-nums text-[#5c5e62]">{p.views}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f2f5]">
                  <div
                    className="h-full rounded-full bg-[#E85C1A]"
                    style={{ width: `${Math.round((p.views / maxViews) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Traffic Sources Donut */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        <div className="border-b border-black/[0.06] px-5 py-4">
          <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Traffic Sources Today</p>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex h-[180px] items-center justify-center">
              <div className="h-32 w-32 animate-pulse rounded-full bg-[#e5e7eb]" />
            </div>
          ) : !data?.trafficSources?.length ? (
            <p className="py-8 text-center text-[0.83rem] text-[#5c5e62]">No source data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.trafficSources}
                  dataKey="visits"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {data.trafficSources.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: "0.72rem", color: "#5c5e62" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
