"use client";
import { useCallback, useEffect, useState } from "react";
import { TrendingDown } from "lucide-react";

type FunnelStep = { step: string; count: number };

function pct(current: number, top: number) {
  if (top === 0) return 0;
  return Math.round((current / top) * 100);
}

function DropBadge({ from, to }: { from: number; to: number }) {
  if (from === 0) return null;
  const drop = Math.round(((from - to) / from) * 100);
  if (drop <= 0) return null;
  return (
    <span className="flex items-center gap-0.5 text-[0.68rem] font-semibold text-red-500">
      <TrendingDown size={10} strokeWidth={2} />
      -{drop}%
    </span>
  );
}

export default function FunnelCard() {
  const [funnel, setFunnel] = useState<FunnelStep[] | null>(null);
  const [loading, setLoad]  = useState(true);
  const [err, setErr]       = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/posthog/funnel", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (res?.funnel) {
      setFunnel(res.funnel);
      setErr(false);
    } else {
      setErr(true);
    }
    setLoad(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, same pattern as cart-context.tsx
  useEffect(() => { refresh(); }, [refresh]);

  const top = funnel?.[0]?.count ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="border-b border-black/[0.06] px-5 py-4">
        <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Conversion Funnel</p>
        <p className="text-[0.72rem] text-[#5c5e62]">Today · sessions per stage</p>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="mb-1.5 h-3 w-32 animate-pulse rounded bg-[#e5e7eb]" />
                <div className="h-3 w-full animate-pulse rounded-full bg-[#e5e7eb]" />
              </div>
            ))}
          </div>
        ) : err ? (
          <p className="py-4 text-center text-[0.83rem] text-[#9ca3af]">PostHog not configured.</p>
        ) : (
          <div className="space-y-4">
            {(funnel ?? []).map((step, i) => (
              <div key={step.step}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[0.8rem] font-semibold text-[#1a1a1a]">{step.step}</span>
                  <div className="flex items-center gap-2">
                    {i > 0 && <DropBadge from={funnel![i - 1].count} to={step.count} />}
                    <span className="text-[0.83rem] font-bold tabular-nums text-[#1a1a1a]">{step.count}</span>
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#f0f2f5]">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-[#E85C1A] transition-all duration-700"
                    style={{ width: `${pct(step.count, top)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-right text-[0.67rem] text-[#9ca3af]">{pct(step.count, top)}% of shop visits</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
