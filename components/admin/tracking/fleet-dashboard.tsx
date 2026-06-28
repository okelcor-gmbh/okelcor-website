"use client";

/**
 * Admin fleet dashboard. Live map of all tracking devices (markers coloured by
 * status), a device list, and — on selecting a device — its recent route polyline
 * plus a trips panel. Geofences render from WKT. A banner surfaces the Traccar
 * connection status. All data via the admin tracking proxies (graceful).
 */

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  MapPin, AlertTriangle, Loader2, RefreshCw, Gauge, Clock, Route as RouteIcon,
} from "lucide-react";
import type { Device, Geofence, Position, Trip, TrackingStatus } from "@/lib/tracking";
import {
  statusStyle, formatSpeed, formatDistance, formatDuration, lastSeen,
} from "@/lib/tracking";

const FleetMap = dynamic(() => import("@/components/tracking/fleet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#eef0f2]">
      <Loader2 size={22} className="animate-spin text-[#E85C1A]" />
    </div>
  ),
});

const DEVICE_POLL_MS = 30_000;

export default function FleetDashboard() {
  const [status, setStatus] = useState<TrackingStatus | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [routePoints, setRoutePoints] = useState<Position[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Top-level data ────────────────────────────────────────────────────────
  const loadDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tracking/devices", { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [] }));
      setDevices(Array.isArray(json.data) ? json.data : []);
    } catch { /* keep last */ }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [st, gf] = await Promise.all([
        fetch("/api/admin/tracking/status", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/admin/tracking/geofences", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);
      if (!active) return;
      setStatus(st ?? null);
      setGeofences(Array.isArray(gf?.data) ? gf.data : []);
      await loadDevices();
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [loadDevices]);

  // Poll device positions while the page is open.
  useEffect(() => {
    const t = setInterval(() => void loadDevices(), DEVICE_POLL_MS);
    return () => clearInterval(t);
  }, [loadDevices]);

  // ── Selected device detail (route + trips) ──────────────────────────────────
  const selectDevice = useCallback(async (id: number) => {
    setSelectedId(id);
    setDetailLoading(true);
    setRoutePoints([]);
    setTrips([]);
    try {
      const [route, trip] = await Promise.all([
        fetch(`/api/admin/tracking/devices/${id}/route`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/admin/tracking/devices/${id}/trips`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);
      setRoutePoints(Array.isArray(route?.data) ? route.data : []);
      setTrips(Array.isArray(trip?.data) ? trip.data : []);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const selectedDevice = devices.find((d) => d.id === selectedId) ?? null;
  const showBanner = status && status.connected === false;

  return (
    <div className="flex flex-col gap-4">
      {/* Connection banner */}
      {showBanner && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-[0.85rem] font-bold text-amber-800">
              {status?.configured ? "Tracking server disconnected" : "Tracking not configured"}
            </p>
            <p className="mt-0.5 text-[0.8rem] text-amber-700">
              {status?.message ?? "Live device data is unavailable right now."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Device list */}
        <div className="flex max-h-[560px] flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
            <p className="text-[0.8rem] font-bold text-[#1a1a1a]">
              Devices {devices.length > 0 && <span className="text-[#9ca3af]">({devices.length})</span>}
            </p>
            <button
              type="button"
              onClick={() => void loadDevices()}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-black/[0.05] hover:text-[#1a1a1a]"
              aria-label="Refresh devices"
            >
              <RefreshCw size={13} strokeWidth={2} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#E85C1A]" /></div>
            ) : devices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <MapPin size={22} className="text-[#9ca3af]" />
                <p className="text-[0.82rem] font-semibold text-[#1a1a1a]">No devices</p>
                <p className="text-[0.75rem] text-[#9ca3af]">Devices appear once the tracking server is connected.</p>
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.05]">
                {devices.map((d) => {
                  const s = statusStyle(d.status);
                  const active = d.id === selectedId;
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => void selectDevice(d.id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#fafafa] ${active ? "bg-[#E85C1A]/[0.05]" : ""}`}
                      >
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.85rem] font-semibold text-[#1a1a1a]">{d.name}</p>
                          <p className="text-[0.72rem] text-[#9ca3af]">
                            {d.position ? `${formatSpeed(d.position.speed_kmh)} · ${lastSeen(d.position.fix_time ?? d.last_update)}` : "No fix yet"}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.66rem] font-semibold ${s.chip}`}>{s.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="h-[420px] overflow-hidden rounded-2xl border border-black/[0.07] bg-[#eef0f2] lg:h-[560px]">
          <FleetMap
            devices={devices}
            geofences={geofences}
            routePoints={routePoints}
            selectedDeviceId={selectedId}
            onSelectDevice={(id) => void selectDevice(id)}
          />
        </div>
      </div>

      {/* Route / trips panel */}
      {selectedDevice && (
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <RouteIcon size={16} strokeWidth={2} className="text-[#E85C1A]" />
              <p className="text-[0.9rem] font-bold text-[#1a1a1a]">{selectedDevice.name}</p>
              <span className="text-[0.75rem] text-[#9ca3af]">— route &amp; trips (last 24h)</span>
            </div>
            {detailLoading && <Loader2 size={15} className="animate-spin text-[#E85C1A]" />}
          </div>

          {!detailLoading && routePoints.length === 0 && trips.length === 0 ? (
            <p className="py-4 text-center text-[0.82rem] text-[#9ca3af]">No movement recorded in the last 24 hours.</p>
          ) : (
            <>
              <p className="mb-3 text-[0.8rem] text-[#5c5e62]">
                {routePoints.length > 0
                  ? `${routePoints.length} position points plotted on the map above.`
                  : "No route points in this window."}
              </p>

              {trips.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {trips.map((t, i) => (
                    <div key={i} className="rounded-xl border border-black/[0.07] bg-[#fafafa] p-3.5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#9ca3af]">Trip {i + 1}</span>
                        <span className="text-[0.72rem] text-[#9ca3af]">{lastSeen(t.start_time)}</span>
                      </div>
                      <p className="truncate text-[0.8rem] font-semibold text-[#1a1a1a]" title={t.start_address ?? ""}>
                        {t.start_address ?? "—"}
                      </p>
                      <p className="truncate text-[0.8rem] text-[#5c5e62]" title={t.end_address ?? ""}>
                        → {t.end_address ?? "—"}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.74rem] text-[#5c5e62]">
                        <span className="flex items-center gap-1"><RouteIcon size={11} /> {formatDistance(t.distance_km)}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {formatDuration(t.duration_ms)}</span>
                        <span className="flex items-center gap-1"><Gauge size={11} /> {formatSpeed(t.avg_speed_kmh)} avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
