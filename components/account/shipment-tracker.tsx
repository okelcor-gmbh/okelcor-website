"use client";

import { useState } from "react";
import { Truck, Calendar, MapPin, Copy, Check, Package } from "lucide-react";

type ShipmentEvent = {
  id: number;
  event_date?: string | null;
  status_label: string;
  location?: string | null;
  description?: string | null;
};

type Props = {
  carrier?: string;
  carrierType?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  trackingStatus?: string;
  events?: ShipmentEvent[];
};

const CARRIER_TYPE_LABELS: Record<string, string> = {
  bus:  "Bus Freight",
  road: "Road Freight",
  dhl:  "DHL",
  sea:  "Sea Freight",
  air:  "Air Freight",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[var(--muted)] transition hover:bg-[#f0f0f0] hover:text-[var(--foreground)]"
      aria-label="Copy"
    >
      {copied
        ? <Check size={13} strokeWidth={2.2} className="text-green-600" />
        : <Copy size={13} strokeWidth={1.9} />
      }
    </button>
  );
}

export default function ShipmentTracker({
  carrier,
  carrierType,
  trackingNumber,
  estimatedDelivery,
  trackingStatus,
  events = [],
}: Props) {
  const hasInfo = !!(carrier || trackingNumber || estimatedDelivery || events.length);

  if (!hasInfo) {
    return (
      <div className="flex items-start gap-3 rounded-[10px] border border-black/[0.06] bg-white/70 px-4 py-3 sm:rounded-[12px] sm:px-5 sm:py-4">
        <Package size={16} strokeWidth={1.7} className="mt-0.5 shrink-0 text-[var(--muted)] sm:hidden" />
        <Package size={18} strokeWidth={1.7} className="mt-0.5 hidden shrink-0 text-[var(--muted)] sm:block" />
        <p className="text-[0.85rem] leading-6 text-[var(--muted)] sm:text-[0.88rem]">
          Tracking details will appear once Okelcor updates your shipment.
        </p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));
  const latestEvent = sorted[sorted.length - 1];
  const currentStatus = trackingStatus ?? latestEvent?.status_label;

  return (
    <div className="flex flex-col gap-3">

      {/* Carrier + current status chips */}
      {(carrier || currentStatus) && (
        <div className="flex flex-wrap items-center gap-2">
          {carrier && (
            <div className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5">
              <Truck size={13} strokeWidth={1.9} className="text-[var(--primary)]" />
              <span className="text-[0.82rem] font-semibold text-[var(--foreground)]">{carrier}</span>
            </div>
          )}
          {carrierType && CARRIER_TYPE_LABELS[carrierType] && (
            <span className="rounded-full bg-[#efefef] px-3 py-1 text-[0.76rem] font-semibold text-[var(--muted)]">
              {CARRIER_TYPE_LABELS[carrierType]}
            </span>
          )}
          {currentStatus && (
            <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[0.76rem] font-semibold text-[var(--primary)]">
              {currentStatus}
            </span>
          )}
        </div>
      )}

      {/* Tracking number + ETA */}
      {(trackingNumber || estimatedDelivery) && (
        <div className="flex flex-wrap gap-3">
          {trackingNumber && (
            <div className="flex flex-col gap-1 rounded-[12px] border border-black/[0.07] bg-white px-4 py-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                Tracking Ref / Waybill
              </p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-[0.88rem] font-bold tracking-wide text-[var(--foreground)]">
                  {trackingNumber}
                </p>
                <CopyBtn value={trackingNumber} />
              </div>
            </div>
          )}
          {estimatedDelivery && (
            <div className="flex flex-col gap-1 rounded-[12px] border border-black/[0.07] bg-white px-4 py-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                Estimated Delivery
              </p>
              <div className="flex items-center gap-2">
                <Calendar size={14} strokeWidth={1.9} className="shrink-0 text-[var(--primary)]" />
                <p className="text-[0.88rem] font-semibold text-[var(--foreground)]">
                  {formatDate(estimatedDelivery)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shipment timeline */}
      {sorted.length > 0 && (
        <div className="overflow-hidden rounded-[12px] border border-black/[0.07] bg-white">
          <p className="border-b border-black/[0.06] px-4 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            Shipment Timeline
          </p>
          <ol className="flex flex-col divide-y divide-black/[0.05]">
            {sorted.map((ev, i) => {
              const isLatest = i === sorted.length - 1;
              return (
                <li key={ev.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full ${isLatest ? "bg-[var(--primary)]" : "bg-black/20"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className={`text-[0.83rem] font-bold ${isLatest ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
                        {ev.status_label}
                      </span>
                      <span className="text-[0.74rem] text-[var(--muted)]">{formatDate(ev.event_date ?? undefined)}</span>
                    </div>
                    {ev.location && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <MapPin size={11} strokeWidth={1.8} className="shrink-0 text-[var(--muted)]" />
                        <span className="text-[0.77rem] text-[var(--muted)]">{ev.location}</span>
                      </div>
                    )}
                    {ev.description && (
                      <p className="mt-0.5 text-[0.8rem] text-[var(--muted)]">{ev.description}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
