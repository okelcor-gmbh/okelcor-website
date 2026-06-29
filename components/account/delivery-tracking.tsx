"use client";

/**
 * Customer delivery tracking card. Calls /api/account/orders/{ref}/tracking and
 * renders a live Leaflet map (position + recent trail) with an "estimated arrival"
 * countdown and progress bar.
 *
 * Status-aware (mirrors the server contract):
 *  - available:false → render nothing, except a subtle note for reason "not_shipped".
 *  - live → poll every 30s ONLY while order_status === "shipped"; stop when delivered.
 *  - delivered:true → show the final position, no countdown, no poll.
 *  - eta may be null (no fix / destination not geocodable) → hide the countdown/bar.
 *
 * The countdown re-derives from eta.eta every second client-side; the 30s poll
 * refreshes the underlying numbers. It's an honest straight-line estimate, so the
 * UI labels it "Estimated".
 */

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, RefreshCw, Clock, CheckCircle2, Navigation } from "lucide-react";
import type { CustomerTracking } from "@/lib/tracking";
import { formatSpeed, formatDistance, lastSeen, formatCountdown } from "@/lib/tracking";

const DeliveryMap = dynamic(() => import("@/components/tracking/delivery-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-black/[0.04]" />,
});

const POLL_MS = 30_000;

export default function DeliveryTracking({ orderRef }: { orderRef: string }) {
  const [data, setData] = useState<CustomerTracking | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

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

  // Initial load.
  useEffect(() => { void load(); }, [load]);

  // Poll only while the order is live + shipped + not yet delivered.
  const live = !!data && data.available === true;
  const shouldPoll = live && (data as Extract<CustomerTracking, { available: true }>).order_status === "shipped"
    && !(data as Extract<CustomerTracking, { available: true }>).delivered;

  useEffect(() => {
    if (!shouldPoll) return;
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [shouldPoll, load]);

  // 1s tick so the countdown stays current between polls (only while live).
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);

  if (!loaded || !data) return null;

  // available:false — only surface the "not yet shipped" case; otherwise hide.
  if (!data.available) {
    if (data.reason === "not_shipped") {
      return (
        <div className="flex items-center gap-2.5 rounded-[18px] bg-[#efefef] px-4 py-3.5 text-[0.82rem] text-[var(--muted)] sm:rounded-[22px] sm:px-6">
          <MapPin size={15} strokeWidth={1.9} className="shrink-0 text-[var(--muted)]" />
          Live tracking starts once your order ships.
        </div>
      );
    }
    return null;
  }

  const delivered = data.delivered === true;
  const eta = data.eta;
  const showEta = !delivered && eta && eta.eta;
  const remainingMs = showEta ? new Date(eta!.eta as string).getTime() - now : 0;
  const progress = Math.max(0, Math.min(100, Math.round(eta?.progress_percent ?? 0)));

  return (
    <div className="overflow-hidden rounded-[18px] bg-[#efefef] sm:rounded-[22px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex items-center gap-2">
          <MapPin size={16} strokeWidth={1.9} className="text-[var(--primary)] sm:hidden" />
          <MapPin size={18} strokeWidth={1.9} className="hidden text-[var(--primary)] sm:block" />
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
            {delivered ? "Delivery" : "Live Tracking"}
          </p>
        </div>
        {delivered ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 size={12} strokeWidth={2.2} /> Delivered
          </span>
        ) : (
          <div className="flex items-center gap-2 text-[0.75rem] text-[var(--muted)]">
            {shouldPoll && <RefreshCw size={11} strokeWidth={2} className="text-emerald-500" aria-hidden="true" />}
            <span>Updated {lastSeen(data.last_update ?? data.position.fix_time)}</span>
          </div>
        )}
      </div>

      {/* Estimated arrival countdown + progress */}
      {showEta && (
        <div className="px-4 pb-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  <Clock size={12} strokeWidth={2.2} /> Estimated arrival
                </p>
                <p className="mt-1 text-[1.4rem] font-extrabold leading-none text-[var(--foreground)]">
                  {formatCountdown(remainingMs)}
                </p>
              </div>
              <p className="text-[0.82rem] text-[var(--muted)]">
                ~{new Date(eta!.eta as string).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.74rem] text-[var(--muted)]">
              {eta?.distance_remaining_km != null && (
                <span className="flex items-center gap-1">
                  <Navigation size={11} strokeWidth={2} /> {formatDistance(eta.distance_remaining_km)} to go
                </span>
              )}
              <span>{progress}% complete</span>
              <span className="text-[#9ca3af]">Estimated · straight-line</span>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-[300px] w-full sm:h-[360px]">
        <DeliveryMap position={data.position} route={data.route} name={data.name} />
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 text-[0.82rem] text-[var(--muted)] sm:px-6 lg:px-8">
        {data.name && <span className="font-semibold text-[var(--foreground)]">{data.name}</span>}
        {!delivered && <span>Speed: {formatSpeed(data.position.speed_kmh)}</span>}
        {data.position.address && <span className="truncate">{data.position.address}</span>}
      </div>
    </div>
  );
}
