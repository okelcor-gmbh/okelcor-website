"use client";

/**
 * Customer delivery tracking card. Calls /api/account/orders/{ref}/tracking;
 * renders a live Leaflet map (position + recent trail) when available:true, and
 * nothing at all when unavailable. Polls every ~30s while the order is in transit.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, RefreshCw } from "lucide-react";
import type { CustomerTracking } from "@/lib/tracking";
import { formatSpeed, lastSeen } from "@/lib/tracking";

const DeliveryMap = dynamic(() => import("@/components/tracking/delivery-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-black/[0.04]" />,
});

const POLL_MS = 30_000;

export default function DeliveryTracking({
  orderRef,
  poll = false,
}: {
  orderRef: string;
  /** Poll continuously (e.g. while the order is shipped/in transit). */
  poll?: boolean;
}) {
  const [data, setData] = useState<CustomerTracking | null>(null);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/account/orders/${orderRef}/tracking`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      setData(json?.data ?? { available: false });
    } catch {
      setData({ available: false });
    } finally {
      setLoaded(true);
    }
  }, [orderRef]);

  useEffect(() => {
    void load();
    if (poll) {
      timer.current = setInterval(() => void load(), POLL_MS);
      return () => { if (timer.current) clearInterval(timer.current); };
    }
  }, [load, poll]);

  // Render nothing until we know, and nothing when there's no live tracking.
  if (!loaded || !data || !data.available) return null;

  return (
    <div className="overflow-hidden rounded-[18px] bg-[#efefef] sm:rounded-[22px]">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex items-center gap-2">
          <MapPin size={16} strokeWidth={1.9} className="text-[var(--primary)] sm:hidden" />
          <MapPin size={18} strokeWidth={1.9} className="hidden text-[var(--primary)] sm:block" />
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
            Live Tracking
          </p>
        </div>
        <div className="flex items-center gap-2 text-[0.75rem] text-[var(--muted)]">
          {poll && <RefreshCw size={11} strokeWidth={2} className="text-emerald-500" aria-hidden="true" />}
          <span>Updated {lastSeen(data.last_update ?? data.position.fix_time)}</span>
        </div>
      </div>

      <div className="h-[300px] w-full sm:h-[360px]">
        <DeliveryMap position={data.position} route={data.route} name={data.name} />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 text-[0.82rem] text-[var(--muted)] sm:px-6 lg:px-8">
        {data.name && <span className="font-semibold text-[var(--foreground)]">{data.name}</span>}
        <span>Speed: {formatSpeed(data.position.speed_kmh)}</span>
        {data.position.address && <span className="truncate">{data.position.address}</span>}
      </div>
    </div>
  );
}
