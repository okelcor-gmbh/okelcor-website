"use client";

/**
 * Premium unified "Track Your Order" experience for the customer order page.
 *
 * Combines, in one cohesive section:
 *  - a status hero (current state + live ETA countdown + progress bar),
 *  - an animated 4-step progress stepper,
 *  - the live GPS map (when the order is being tracked),
 *  - shipment details (carrier, copyable tracking ref, ETA),
 *  - a refined shipment-event timeline.
 *
 * Live data comes from /api/account/orders/{ref}/tracking (status-aware: polls
 * only while shipped, stops on delivered). Everything degrades gracefully — an
 * order with no live device still shows the stepper, details and events.
 */

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Package, CheckCircle2, Truck, PackageCheck, XCircle, Clock, Navigation,
  MapPin, Calendar, Copy, Check, RefreshCw,
} from "lucide-react";
import type { CustomerTracking } from "@/lib/tracking";
import { formatSpeed, formatDistance, lastSeen, formatCountdown } from "@/lib/tracking";
import type { OrderStatus } from "@/app/account/orders/page";

const DeliveryMap = dynamic(() => import("@/components/tracking/delivery-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-black/[0.05]" />,
});

const POLL_MS = 30_000;

type ShipmentEvent = {
  id: number;
  event_date?: string | null;
  status_label: string;
  location?: string | null;
  description?: string | null;
};

type Props = {
  orderRef: string;
  status: OrderStatus;
  createdAt?: string;
  carrier?: string | null;
  carrierType?: string | null;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  trackingStatus?: string | null;
  events?: ShipmentEvent[];
};

const CARRIER_TYPE_LABELS: Record<string, string> = {
  truck: "Truck Freight", road: "Road Freight", dhl: "DHL", sea: "Sea Freight", air: "Air Freight",
};

// ── Stepper config ──────────────────────────────────────────────────────────────
const STEPS: { key: OrderStatus; label: string; Icon: typeof Package }[] = [
  { key: "pending",   label: "Order Placed", Icon: Package },
  { key: "confirmed", label: "Confirmed",    Icon: CheckCircle2 },
  { key: "shipped",   label: "Shipped",      Icon: Truck },
  { key: "delivered", label: "Delivered",    Icon: PackageCheck },
];
const STEP_ORDER: Record<OrderStatus, number> = {
  pending: 0, confirmed: 1, processing: 1, shipped: 2, delivered: 3, cancelled: -1,
};

// ── Status hero meta ─────────────────────────────────────────────────────────────
type Accent = { ring: string; iconBg: string; iconText: string; bar: string; tint: string };
const ACCENTS: Record<string, Accent> = {
  prep:      { ring: "ring-blue-200",    iconBg: "bg-blue-50",    iconText: "text-blue-600",    bar: "bg-blue-500",            tint: "from-blue-50/60" },
  transit:   { ring: "ring-[var(--primary)]/25", iconBg: "bg-[var(--primary)]/10", iconText: "text-[var(--primary)]", bar: "bg-[var(--primary)]", tint: "from-[var(--primary)]/[0.06]" },
  delivered: { ring: "ring-emerald-200", iconBg: "bg-emerald-50", iconText: "text-emerald-600", bar: "bg-emerald-500",        tint: "from-emerald-50/70" },
  cancelled: { ring: "ring-red-200",     iconBg: "bg-red-50",     iconText: "text-red-600",     bar: "bg-red-400",            tint: "from-red-50/60" },
};

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[var(--muted)] transition hover:bg-[#f5f5f5] hover:text-[var(--foreground)]"
      aria-label="Copy tracking reference"
    >
      {copied ? <Check size={13} strokeWidth={2.2} className="text-emerald-600" /> : <Copy size={13} strokeWidth={1.9} />}
    </button>
  );
}

export default function OrderTracking({
  orderRef, status, createdAt, carrier, carrierType, trackingNumber,
  estimatedDelivery, trackingStatus, events = [],
}: Props) {
  const [live, setLive] = useState<CustomerTracking | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/account/orders/${orderRef}/tracking`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      setLive(json?.data ?? { available: false });
    } catch {
      setLive({ available: false });
    }
  }, [orderRef]);

  // Initial fetch (inline so setState stays inside the async closure).
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`/api/account/orders/${orderRef}/tracking`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (active) setLive(json?.data ?? { available: false });
      } catch {
        if (active) setLive({ available: false });
      }
    })();
    return () => { active = false; };
  }, [orderRef]);

  const isLive = !!live && live.available === true;
  const liveData = isLive ? (live as Extract<CustomerTracking, { available: true }>) : null;
  const delivered = liveData?.delivered === true || status === "delivered";
  const shouldPoll = !!liveData && liveData.order_status === "shipped" && !liveData.delivered;

  useEffect(() => {
    if (!shouldPoll) return;
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [shouldPoll, load]);

  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isLive]);

  // ── Derive hero state ──────────────────────────────────────────────────────
  const cancelled = status === "cancelled";
  const inTransit = status === "shipped" && !delivered;

  const heroKey = cancelled ? "cancelled" : delivered ? "delivered" : inTransit ? "transit" : "prep";
  const accent = ACCENTS[heroKey];
  const HeroIcon = cancelled ? XCircle : delivered ? PackageCheck : inTransit ? Truck : Package;

  const heroTitle = cancelled ? "Order cancelled"
    : delivered ? "Delivered"
    : inTransit ? "On its way"
    : "Preparing your order";

  const heroSubtitle = cancelled ? "This order has been cancelled."
    : delivered ? "Your order has arrived. Thank you for choosing Okelcor."
    : inTransit ? "Your order is in transit. Track its live progress below."
    : status === "confirmed" || status === "processing"
      ? "Your order is confirmed and being prepared for shipment."
      : "We've received your order and are getting it ready.";

  const eta = liveData?.eta;
  const showEtaBlock = inTransit && eta && eta.eta;
  const remainingMs = showEtaBlock ? new Date(eta!.eta as string).getTime() - now : 0;
  const progress = Math.max(0, Math.min(100, Math.round(eta?.progress_percent ?? 0)));

  const currentIdx = delivered ? 3 : (STEP_ORDER[status] ?? 0);
  const sortedEvents = [...events].sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));
  const currentStatusChip = trackingStatus ?? sortedEvents[sortedEvents.length - 1]?.status_label;

  return (
    <div className="overflow-hidden rounded-[18px] bg-[#efefef] sm:rounded-[24px]">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <MapPin size={16} strokeWidth={1.9} className="text-[var(--primary)] sm:hidden" />
        <MapPin size={18} strokeWidth={1.9} className="hidden text-[var(--primary)] sm:block" />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:text-[11px]">
          Track Your Order
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">

        {/* ── Status hero ── */}
        <div className={`relative overflow-hidden rounded-[18px] border border-black/[0.05] bg-gradient-to-br ${accent.tint} to-white p-5 sm:p-6`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${accent.iconBg} ring-4 ${accent.ring}`}>
              <HeroIcon size={26} strokeWidth={1.8} className={accent.iconText} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[1.3rem] font-extrabold leading-tight tracking-tight text-[var(--foreground)] sm:text-[1.5rem]">
                {heroTitle}
              </h2>
              <p className="mt-1 text-[0.85rem] leading-relaxed text-[var(--muted)]">{heroSubtitle}</p>

              {/* Live ETA countdown */}
              {showEtaBlock && (
                <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white/80 p-4 backdrop-blur-sm">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                        <Clock size={12} strokeWidth={2.2} /> Estimated arrival
                      </p>
                      <p className="mt-1 text-[1.7rem] font-extrabold leading-none text-[var(--foreground)]">
                        {formatCountdown(remainingMs)}
                      </p>
                    </div>
                    <p className="text-[0.85rem] font-semibold text-[var(--muted)]">
                      ~{new Date(eta!.eta as string).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                    <div className={`h-full rounded-full ${accent.bar} transition-[width] duration-700`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.74rem] text-[var(--muted)]">
                    {eta?.distance_remaining_km != null && (
                      <span className="flex items-center gap-1"><Navigation size={11} strokeWidth={2} /> {formatDistance(eta.distance_remaining_km)} to go</span>
                    )}
                    <span>{progress}% complete</span>
                    <span className="text-[#9ca3af]">Estimated · straight-line</span>
                  </div>
                </div>
              )}

              {/* Fallback ETA / delivered date when there's no live countdown */}
              {!showEtaBlock && !cancelled && (delivered || estimatedDelivery) && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-[0.8rem] font-semibold text-[var(--foreground)] ring-1 ring-black/[0.05]">
                  <Calendar size={13} strokeWidth={2} className={accent.iconText} />
                  {delivered
                    ? `Delivered ${liveData?.last_update ? formatDate(liveData.last_update) : estimatedDelivery ? formatDate(estimatedDelivery) : ""}`.trim()
                    : `Estimated delivery: ${formatDate(estimatedDelivery)}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stepper ── */}
        {!cancelled && <Stepper currentIdx={currentIdx} createdAt={createdAt} />}

        {/* ── Live map ── */}
        {isLive && liveData && (
          <div className="overflow-hidden rounded-[18px] border border-black/[0.05] bg-white">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                <MapPin size={12} strokeWidth={2.2} className="text-[var(--primary)]" /> Live location
              </p>
              {!delivered && (
                <span className="flex items-center gap-1.5 text-[0.72rem] text-[var(--muted)]">
                  {shouldPoll && <RefreshCw size={11} strokeWidth={2} className="text-emerald-500" aria-hidden="true" />}
                  Updated {lastSeen(liveData.last_update ?? liveData.position.fix_time)}
                </span>
              )}
            </div>
            <div className="h-[300px] w-full sm:h-[380px]">
              <DeliveryMap position={liveData.position} route={liveData.route} name={liveData.name} />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 text-[0.82rem] text-[var(--muted)]">
              {liveData.name && <span className="font-semibold text-[var(--foreground)]">{liveData.name}</span>}
              {!delivered && <span>Speed: {formatSpeed(liveData.position.speed_kmh)}</span>}
              {liveData.position.address && <span className="truncate">{liveData.position.address}</span>}
            </div>
          </div>
        )}

        {/* ── Shipment details ── */}
        {(carrier || trackingNumber || estimatedDelivery || currentStatusChip) && (
          <div className="rounded-[18px] border border-black/[0.05] bg-white p-4 sm:p-5">
            <p className="mb-3 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              <Truck size={12} strokeWidth={2.2} className="text-[var(--primary)]" /> Shipment details
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {carrier && (
                <span className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[0.82rem] font-semibold text-[var(--foreground)]">
                  <Truck size={13} strokeWidth={1.9} className="text-[var(--primary)]" /> {carrier}
                </span>
              )}
              {carrierType && CARRIER_TYPE_LABELS[carrierType] && (
                <span className="rounded-full bg-[#f5f5f5] px-3 py-1.5 text-[0.76rem] font-semibold text-[var(--muted)]">
                  {CARRIER_TYPE_LABELS[carrierType]}
                </span>
              )}
              {currentStatusChip && (
                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-[0.76rem] font-semibold text-[var(--primary)]">
                  {currentStatusChip}
                </span>
              )}
            </div>

            {(trackingNumber || estimatedDelivery) && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {trackingNumber && (
                  <div className="rounded-xl border border-black/[0.07] bg-[#fafafa] px-4 py-3">
                    <p className="text-[0.66rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Tracking Ref / Waybill</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="font-mono text-[0.88rem] font-bold tracking-wide text-[var(--foreground)]">{trackingNumber}</p>
                      <CopyBtn value={trackingNumber} />
                    </div>
                  </div>
                )}
                {estimatedDelivery && (
                  <div className="rounded-xl border border-black/[0.07] bg-[#fafafa] px-4 py-3">
                    <p className="text-[0.66rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Estimated Delivery</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar size={14} strokeWidth={1.9} className="shrink-0 text-[var(--primary)]" />
                      <p className="text-[0.88rem] font-semibold text-[var(--foreground)]">{formatDate(estimatedDelivery)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Event timeline ── */}
        {sortedEvents.length > 0 && <EventTimeline events={sortedEvents} />}

        {/* Empty hint when there's genuinely nothing yet */}
        {!isLive && !carrier && !trackingNumber && sortedEvents.length === 0 && !cancelled && (
          <p className="rounded-[14px] border border-black/[0.05] bg-white px-4 py-3.5 text-[0.83rem] text-[var(--muted)]">
            Detailed tracking will appear here once Okelcor dispatches your shipment.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────────────────
function Stepper({ currentIdx, createdAt }: { currentIdx: number; createdAt?: string }) {
  return (
    <div className="rounded-[18px] border border-black/[0.05] bg-white p-5 sm:p-6">
      {/* Mobile: vertical */}
      <div className="flex flex-col sm:hidden">
        {STEPS.map((step, i) => {
          const stepIdx = STEP_ORDER[step.key] ?? i;
          const done = stepIdx < currentIdx;
          const current = stepIdx === currentIdx;
          const isLast = i === STEPS.length - 1;
          const Icon = step.Icon;
          return (
            <div key={step.key} className="flex items-stretch gap-3">
              <div className="flex flex-col items-center">
                <div className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                  done ? "bg-emerald-500 text-white"
                    : current ? "bg-[var(--primary)] text-white ring-4 ring-[var(--primary)]/20 animate-pulse"
                    : "bg-[#f0f0f0] text-[var(--muted)]",
                ].join(" ")}>
                  <Icon size={17} strokeWidth={2} />
                </div>
                {!isLast && <div className={`my-1 w-[2px] flex-1 transition-colors ${done ? "bg-emerald-500" : "bg-black/10"}`} />}
              </div>
              <div className="pb-5 pt-2">
                <p className={`text-[0.9rem] font-bold leading-none ${current ? "text-[var(--primary)]" : done ? "text-emerald-600" : "text-[var(--muted)]"}`}>
                  {step.label}
                </p>
                {i === 0 && createdAt && <p className="mt-1 text-[0.74rem] text-[var(--muted)]">{formatDate(createdAt)}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden items-start sm:flex">
        {STEPS.map((step, i) => {
          const stepIdx = STEP_ORDER[step.key] ?? i;
          const done = stepIdx < currentIdx;
          const current = stepIdx === currentIdx;
          const isLast = i === STEPS.length - 1;
          const Icon = step.Icon;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && <div className={`h-[3px] flex-1 rounded-full transition-colors ${done || current ? "bg-emerald-500" : "bg-black/10"}`} />}
                <div className={[
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
                  done ? "bg-emerald-500 text-white"
                    : current ? "bg-[var(--primary)] text-white ring-4 ring-[var(--primary)]/20"
                    : "bg-[#f0f0f0] text-[var(--muted)]",
                ].join(" ")}>
                  <Icon size={18} strokeWidth={2} />
                </div>
                {!isLast && <div className={`h-[3px] flex-1 rounded-full transition-colors ${done ? "bg-emerald-500" : "bg-black/10"}`} />}
              </div>
              <p className={`mt-2.5 text-center text-[0.78rem] font-bold ${current ? "text-[var(--primary)]" : done ? "text-emerald-600" : "text-[var(--muted)]"}`}>
                {step.label}
              </p>
              {i === 0 && createdAt && <p className="text-center text-[0.72rem] text-[var(--muted)]">{formatDate(createdAt)}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Event timeline ─────────────────────────────────────────────────────────────
function EventTimeline({ events }: { events: ShipmentEvent[] }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-black/[0.05] bg-white">
      <p className="border-b border-black/[0.05] px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)] sm:px-5">
        Shipment Timeline
      </p>
      <ol className="flex flex-col px-4 py-2 sm:px-5">
        {events.map((ev, i) => {
          const isLatest = i === events.length - 1;
          const isFirst = i === 0;
          return (
            <li key={ev.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${isLatest ? "bg-[var(--primary)] ring-4 ring-[var(--primary)]/15" : "bg-black/20"}`} />
                {!isLatest && <div className="my-1 w-[2px] flex-1 bg-black/10" />}
              </div>
              <div className={`min-w-0 flex-1 ${isFirst ? "pt-0.5" : "pt-0.5"} pb-4`}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className={`text-[0.85rem] font-bold ${isLatest ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
                    {ev.status_label}
                  </span>
                  <span className="text-[0.74rem] text-[var(--muted)]">{formatDate(ev.event_date)}</span>
                </div>
                {ev.location && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <MapPin size={11} strokeWidth={1.8} className="shrink-0 text-[var(--muted)]" />
                    <span className="text-[0.77rem] text-[var(--muted)]">{ev.location}</span>
                  </div>
                )}
                {ev.description && <p className="mt-0.5 text-[0.8rem] leading-relaxed text-[var(--muted)]">{ev.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
