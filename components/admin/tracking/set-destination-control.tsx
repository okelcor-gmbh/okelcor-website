"use client";

/**
 * Admin: set / clear an order's delivery destination, which powers the customer
 * ETA + progress bar. Two ways in — drop a pin on the map (or paste coordinates),
 * or type an address for the backend to geocode. On geocode failure (422
 * { code: "geocode_failed" }) we prompt the admin to drop a pin instead.
 *
 * PUT /api/admin/tracking/orders/{id}/destination
 *   body { lat, lon } | { address } | {}   ({} clears it)
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { Crosshair, Loader2, Check, AlertCircle, Search, Trash2 } from "lucide-react";

const LocationPickerMap = dynamic(() => import("@/components/tracking/location-picker-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-black/[0.04]" />,
});

type Pin = { lat: number; lon: number };

function validLat(n: number) { return Number.isFinite(n) && n >= -90 && n <= 90; }
function validLon(n: number) { return Number.isFinite(n) && n >= -180 && n <= 180; }

export default function SetDestinationControl({
  orderId,
  initialLat,
  initialLon,
  canManage,
}: {
  orderId: number;
  initialLat?: number | null;
  initialLon?: number | null;
  canManage: boolean;
}) {
  const hasInitial = initialLat != null && initialLon != null;
  const [pin, setPin] = useState<Pin | null>(hasInitial ? { lat: initialLat!, lon: initialLon! } : null);
  const [latText, setLatText] = useState(hasInitial ? String(initialLat) : "");
  const [lonText, setLonText] = useState(hasInitial ? String(initialLon) : "");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState<"pin" | "address" | "clear" | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function applyPin(lat: number, lon: number) {
    setPin({ lat, lon });
    setLatText(lat.toFixed(6));
    setLonText(lon.toFixed(6));
    setResult(null);
  }

  function onCoordText(which: "lat" | "lon", v: string) {
    const lat = which === "lat" ? parseFloat(v) : parseFloat(latText);
    const lon = which === "lon" ? parseFloat(v) : parseFloat(lonText);
    if (which === "lat") setLatText(v); else setLonText(v);
    if (validLat(lat) && validLon(lon)) setPin({ lat, lon });
    setResult(null);
  }

  async function put(body: object): Promise<Response> {
    return fetch(`/api/admin/tracking/orders/${orderId}/destination`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function savePin() {
    if (!pin) return;
    setBusy("pin"); setResult(null);
    try {
      const res = await put({ lat: pin.lat, lon: pin.lon });
      const json = await res.json().catch(() => ({}));
      setResult(res.ok
        ? { ok: true, msg: "Destination set. The customer ETA updates on their next refresh." }
        : { ok: false, msg: (json as { message?: string }).message ?? "Couldn't save the destination." });
    } catch {
      setResult({ ok: false, msg: "Network error — please try again." });
    } finally { setBusy(null); }
  }

  async function saveAddress() {
    if (!address.trim()) return;
    setBusy("address"); setResult(null);
    try {
      const res = await put({ address: address.trim() });
      const json = await res.json().catch(() => ({})) as { message?: string; code?: string; dest_lat?: number; dest_lon?: number; data?: { dest_lat?: number; dest_lon?: number } };
      if (res.ok) {
        const dLat = json.dest_lat ?? json.data?.dest_lat;
        const dLon = json.dest_lon ?? json.data?.dest_lon;
        if (dLat != null && dLon != null) applyPin(dLat, dLon);
        setResult({ ok: true, msg: "Address located and destination set." });
      } else if (res.status === 422 && json.code === "geocode_failed") {
        setResult({ ok: false, msg: "Couldn't locate that address — drop a pin on the map instead." });
      } else {
        setResult({ ok: false, msg: json.message ?? "Couldn't set the destination." });
      }
    } catch {
      setResult({ ok: false, msg: "Network error — please try again." });
    } finally { setBusy(null); }
  }

  async function clear() {
    setBusy("clear"); setResult(null);
    try {
      const res = await put({});
      if (res.ok) {
        setPin(null); setLatText(""); setLonText(""); setAddress("");
        setResult({ ok: true, msg: "Destination cleared." });
      } else {
        const json = await res.json().catch(() => ({}));
        setResult({ ok: false, msg: (json as { message?: string }).message ?? "Couldn't clear the destination." });
      }
    } catch {
      setResult({ ok: false, msg: "Network error — please try again." });
    } finally { setBusy(null); }
  }

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <div className="mb-1 flex items-center gap-2">
        <Crosshair size={15} strokeWidth={2} className="text-[#E85C1A]" />
        <p className="text-[0.85rem] font-bold text-[#1a1a1a]">Delivery Destination</p>
      </div>
      <p className="mb-3 text-[0.78rem] text-[#5c5e62]">
        Sets the target for the customer&apos;s ETA and progress bar. We auto-geocode the delivery
        address; use this to fix it when that fails — drop a pin, paste coordinates, or type an address.
      </p>

      {/* Map picker */}
      <div className="h-[220px] overflow-hidden rounded-xl border border-black/[0.08] bg-[#eef0f2]">
        <LocationPickerMap value={pin} onPick={canManage ? applyPin : () => {}} />
      </div>
      <p className="mt-1.5 text-[0.72rem] text-[#9ca3af]">Click the map to drop the destination pin.</p>

      {/* Coordinates */}
      <div className="mt-3 flex flex-wrap items-end gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-[0.7rem] font-semibold text-[#5c5e62]">Latitude</span>
          <input
            value={latText}
            disabled={!canManage || busy !== null}
            onChange={(e) => onCoordText("lat", e.target.value)}
            placeholder="48.1351"
            inputMode="decimal"
            className="h-10 w-36 rounded-xl border border-black/[0.1] bg-white px-3 text-[0.83rem] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[0.7rem] font-semibold text-[#5c5e62]">Longitude</span>
          <input
            value={lonText}
            disabled={!canManage || busy !== null}
            onChange={(e) => onCoordText("lon", e.target.value)}
            placeholder="11.5820"
            inputMode="decimal"
            className="h-10 w-36 rounded-xl border border-black/[0.1] bg-white px-3 text-[0.83rem] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15 disabled:opacity-60"
          />
        </label>
        <button
          type="button"
          onClick={savePin}
          disabled={!canManage || busy !== null || !pin}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#E85C1A] px-4 text-[0.82rem] font-semibold text-white transition hover:bg-[#d44f12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "pin" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Save pin
        </button>
      </div>

      {/* Address geocode */}
      <div className="mt-3 border-t border-black/[0.06] pt-3">
        <div className="flex flex-wrap items-end gap-2.5">
          <label className="flex min-w-[240px] flex-1 flex-col gap-1">
            <span className="text-[0.7rem] font-semibold text-[#5c5e62]">…or locate from an address</span>
            <input
              value={address}
              disabled={!canManage || busy !== null}
              onChange={(e) => { setAddress(e.target.value); setResult(null); }}
              placeholder="Musterstr. 1, 80331 München, DE"
              className="h-10 rounded-xl border border-black/[0.1] bg-white px-3 text-[0.83rem] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15 disabled:opacity-60"
            />
          </label>
          <button
            type="button"
            onClick={saveAddress}
            disabled={!canManage || busy !== null || !address.trim()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-black/[0.12] bg-white px-4 text-[0.82rem] font-semibold text-[#1a1a1a] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "address" ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Locate
          </button>
        </div>
      </div>

      {/* Clear */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={clear}
          disabled={!canManage || busy !== null || (!pin && !hasInitial)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[0.8rem] font-semibold text-[#9ca3af] transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "clear" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Clear destination
        </button>

        {result && (
          <p className={`flex items-center gap-1.5 text-right text-[0.78rem] ${result.ok ? "text-emerald-600" : "text-red-600"}`}>
            {result.ok ? <Check size={13} className="shrink-0" /> : <AlertCircle size={13} className="shrink-0" />} {result.msg}
          </p>
        )}
      </div>

      {!canManage && (
        <p className="mt-2 text-[0.74rem] text-[#9ca3af]">You don&apos;t have permission to change this.</p>
      )}
    </div>
  );
}
