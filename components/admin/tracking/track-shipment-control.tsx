"use client";

/**
 * Admin: on-demand live carrier tracking (GLS / DHL / ocean freight incl.
 * Maersk) — models eBay's own "Track shipment" view so staff no longer have
 * to log into the carrier's site separately. Works for any order (manual or
 * eBay-sourced) once it has a carrier + tracking number.
 *
 * GET /api/admin/orders/{id}/shipment-tracking — live carrier-API call,
 * persists new events server-side. Fetched on demand (button open), not polled.
 */

import { useState } from "react";
import { Truck, Loader2, AlertCircle, MapPin, RefreshCw, X, ExternalLink } from "lucide-react";

type ShipmentTrackingEvent = {
  event_date?: string | null;
  time?: string | null;
  location?: string | null;
  status_label: string;
  description?: string | null;
};

type ShipmentTracking = {
  carrier: string;
  tracking_number: string;
  stage: "preparing" | "in_transit" | "delivered" | string;
  /** Deep link to the carrier's own public tracking page (GLS/DHL/Maersk). Null if unrecognized. */
  tracking_url?: string | null;
  events: ShipmentTrackingEvent[];
};

const STAGES: { key: string; label: string }[] = [
  { key: "preparing",  label: "Preparing" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered",  label: "Delivered" },
];

export default function TrackShipmentControl({
  orderId,
  carrier,
  trackingNumber,
}: {
  orderId: number;
  carrier?: string | null;
  trackingNumber?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ShipmentTracking | null>(null);

  if (!carrier && !trackingNumber) return null;

  async function load() {
    setOpen(true); setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment-tracking`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { message?: string }).message ?? "Couldn't fetch shipment tracking.");
        setData(null);
      } else {
        setData((json as { data?: ShipmentTracking }).data ?? null);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const stageIdx = STAGES.findIndex((s) => s.key === data?.stage);

  return (
    <>
      <button
        type="button"
        onClick={load}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-black/[0.12] bg-white px-3 text-[0.8rem] font-semibold text-[#1a1a1a] transition hover:border-[#E85C1A] hover:text-[#E85C1A]"
      >
        <Truck size={14} strokeWidth={2} /> Track Shipment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 text-[0.9rem] font-bold text-[#1a1a1a]">
                <Truck size={16} strokeWidth={2} className="text-[#E85C1A]" /> Track Shipment
              </p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-[#9ca3af] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]">
                <X size={16} />
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-[0.85rem] text-[#5c5e62]">
                <Loader2 size={16} className="animate-spin" /> Fetching live tracking…
              </div>
            )}

            {!loading && error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}

            {!loading && !error && data && (
              <div className="flex flex-col gap-5">
                {/* 3-node stage stepper */}
                <div className="flex items-start">
                  {STAGES.map((s, i) => {
                    const done = stageIdx >= 0 && i < stageIdx;
                    const current = i === stageIdx;
                    return (
                      <div key={s.key} className="flex flex-1 flex-col items-center">
                        <div className="flex w-full items-center">
                          {i > 0 && <div className={`h-[3px] flex-1 rounded-full ${done || current ? "bg-emerald-500" : "bg-black/10"}`} />}
                          <div className={[
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold",
                            done ? "bg-emerald-500 text-white"
                              : current ? "bg-[#E85C1A] text-white ring-4 ring-[#E85C1A]/20"
                              : "bg-[#f0f0f0] text-[#9ca3af]",
                          ].join(" ")}>
                            {i + 1}
                          </div>
                          {i < STAGES.length - 1 && <div className={`h-[3px] flex-1 rounded-full ${done ? "bg-emerald-500" : "bg-black/10"}`} />}
                        </div>
                        <p className={`mt-2 text-center text-[0.72rem] font-bold ${current ? "text-[#E85C1A]" : done ? "text-emerald-600" : "text-[#9ca3af]"}`}>
                          {s.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Shipping overview */}
                <div className="rounded-xl bg-[#f5f5f5] px-4 py-3">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Shipping Overview</p>
                  <p className="mt-1 text-[0.88rem] font-semibold text-[#1a1a1a]">
                    {data.carrier} · <span className="font-mono">{data.tracking_number}</span>
                  </p>
                  {data.tracking_url && (
                    <a
                      href={data.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#E85C1A] hover:underline"
                    >
                      <ExternalLink size={12} strokeWidth={2} /> Track on {data.carrier}&apos;s site
                    </a>
                  )}
                </div>

                {/* Events, newest first */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Tracking Events</p>
                    <button type="button" onClick={load} className="flex items-center gap-1 text-[0.72rem] font-semibold text-[#E85C1A] hover:underline">
                      <RefreshCw size={11} strokeWidth={2} /> Refresh
                    </button>
                  </div>
                  {data.events.length === 0 ? (
                    <p className="text-[0.83rem] text-[#9ca3af]">
                      No tracking events yet{data.tracking_url ? " — track directly using the link above." : "."}
                    </p>
                  ) : (
                    <ol className="flex flex-col gap-3">
                      {data.events.map((ev, i) => (
                        <li key={i} className="flex gap-2.5 border-l-2 border-black/[0.08] pl-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <span className="text-[0.82rem] font-bold text-[#1a1a1a]">{ev.status_label}</span>
                              <span className="text-[0.72rem] text-[#9ca3af]">
                                {ev.event_date}{ev.time ? ` · ${ev.time}` : ""}
                              </span>
                            </div>
                            {ev.location && (
                              <p className="mt-0.5 flex items-center gap-1 text-[0.76rem] text-[#5c5e62]">
                                <MapPin size={10} strokeWidth={2} /> {ev.location}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
