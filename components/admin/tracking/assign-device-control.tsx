"use client";

/**
 * Admin: assign / clear the GPS tracking device a customer can track for an order.
 * PUT /api/admin/tracking/orders/{orderId}/device  body { tracking_device_id: "7" | null }
 * Device options are sourced from /api/admin/tracking/devices.
 */

import { useEffect, useState } from "react";
import { MapPin, Loader2, Check, AlertCircle } from "lucide-react";
import type { Device } from "@/lib/tracking";
import { statusStyle } from "@/lib/tracking";

export default function AssignTrackingDeviceControl({
  orderId,
  initialDeviceId,
  canManage,
}: {
  orderId: number;
  initialDeviceId?: string | number | null;
  canManage: boolean;
}) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [value, setValue] = useState<string>(initialDeviceId != null ? String(initialDeviceId) : "");
  const [saved, setSaved] = useState<string>(initialDeviceId != null ? String(initialDeviceId) : "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/tracking/devices", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (active) setDevices(Array.isArray(j.data) ? j.data : []); })
      .catch(() => { if (active) setDevices([]); });
    return () => { active = false; };
  }, []);

  const dirty = value !== saved;

  async function save() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/tracking/orders/${orderId}/device`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_device_id: value === "" ? null : value }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setSaved(value);
        setResult({ ok: true, msg: value === "" ? "Tracking device cleared." : "Tracking device assigned." });
      } else {
        setResult({ ok: false, msg: (json as { message?: string }).message ?? "Couldn't update the tracking device." });
      }
    } catch {
      setResult({ ok: false, msg: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <div className="mb-1 flex items-center gap-2">
        <MapPin size={15} strokeWidth={2} className="text-[#E85C1A]" />
        <p className="text-[0.85rem] font-bold text-[#1a1a1a]">Customer Tracking</p>
      </div>
      <p className="mb-2 text-[0.78rem] text-[#5c5e62]">
        Assign a GPS device to let the customer follow this delivery live on their order page.
      </p>
      <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[0.74rem] text-amber-700">
        Tip: assign the device <strong>before</strong> marking the order shipped — the shipped
        notification then includes a “track it live” link. Re-marking a shipped order won&apos;t resend it.
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={value}
          disabled={!canManage || busy}
          onChange={(e) => { setValue(e.target.value); setResult(null); }}
          className="h-10 min-w-[220px] rounded-xl border border-black/[0.1] bg-white px-3 text-[0.83rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/15 disabled:opacity-60"
        >
          <option value="">Not tracked</option>
          {devices.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.name} · {statusStyle(d.status).label}
            </option>
          ))}
          {/* Keep the currently-saved id selectable even if it's no longer in the device list. */}
          {saved !== "" && !devices.some((d) => String(d.id) === saved) && (
            <option value={saved}>Device #{saved}</option>
          )}
        </select>

        <button
          type="button"
          onClick={save}
          disabled={!canManage || busy || !dirty}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#E85C1A] px-4 text-[0.82rem] font-semibold text-white transition hover:bg-[#d44f12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : null}
          {value === "" && saved !== "" ? "Clear" : "Save"}
        </button>
      </div>

      {!canManage && (
        <p className="mt-2 text-[0.74rem] text-[#9ca3af]">You don&apos;t have permission to change this.</p>
      )}

      {result && (
        <p className={`mt-2 flex items-center gap-1.5 text-[0.78rem] ${result.ok ? "text-emerald-600" : "text-red-600"}`}>
          {result.ok ? <Check size={13} /> : <AlertCircle size={13} />} {result.msg}
        </p>
      )}
    </div>
  );
}
