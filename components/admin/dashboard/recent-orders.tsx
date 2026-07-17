"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

type Order = {
  id:             number;
  ref:            string;
  customer:       string;
  email:          string;
  total:          number;
  status:         string;
  payment_status: string | null;
  created_at:     string;
};

// Status badge colours — pending is orange/prominent to draw attention
const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-[#fff1ec] text-[#E85C1A] ring-1 ring-[#E85C1A]/30",
  processing: "bg-amber-50  text-amber-700  ring-1 ring-amber-300/40",
  confirmed:  "bg-blue-50   text-blue-700   ring-1 ring-blue-300/40",
  shipped:    "bg-purple-50 text-purple-700 ring-1 ring-purple-300/40",
  delivered:  "bg-green-50  text-green-700  ring-1 ring-green-300/40",
  cancelled:  "bg-red-50    text-red-500    ring-1 ring-red-300/40",
};

function Badge({ s }: { s: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold capitalize ${STATUS_STYLES[s] ?? "bg-gray-100 text-gray-500"}`}
    >
      {s}
    </span>
  );
}

function isPendingOrder(o: Order): boolean {
  return (o.status === "pending" || o.status === "processing") && o.payment_status !== "paid";
}

function Row({
  o,
  onConfirm,
  confirming,
}: {
  o:          Order;
  onConfirm:  (id: number) => void;
  confirming: boolean;
}) {
  const pending = isPendingOrder(o);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition ${pending ? "bg-[#fffaf8]" : "hover:bg-[#fafafa]"}`}>
      {/* Order info — links to full detail */}
      <Link
        href={`/admin/orders/${o.id}`}
        className="flex min-w-0 flex-1 flex-col gap-0.5"
      >
        <p className="flex items-center gap-2 text-[0.8rem] font-semibold text-[#1a1a1a]">
          {o.ref}
          <Badge s={o.status} />
        </p>
        <p className="truncate text-[0.73rem] text-[#5c5e62]">{o.customer}</p>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        {/* "Confirm Payment" quick action — only on pending/processing orders */}
        {pending && (
          <button
            type="button"
            onClick={() => onConfirm(o.id)}
            disabled={confirming}
            title="Mark as confirmed + paid"
            className="flex items-center gap-1 rounded-lg bg-[#E85C1A] px-2.5 py-1 text-[0.7rem] font-semibold text-white transition hover:bg-[#d04d15] disabled:opacity-50"
          >
            {confirming ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <CheckCircle2 size={11} strokeWidth={2.5} />
            )}
            Confirm
          </button>
        )}

        <p className="text-[0.85rem] font-bold tabular-nums text-[#1a1a1a]">
          €{Number(o.total).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

const REFRESH = 30_000;

export default function RecentOrders() {
  const [orders,     setOrders]     = useState<Order[] | null>(null);
  const [loading,    setLoad]       = useState(true);
  const [confirming, setConfirming] = useState<Set<number>>(new Set());
  const [confirmed,  setConfirmed]  = useState<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/dashboard/stats", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (res?.recentOrders) setOrders(res.recentOrders);
    setLoad(false);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), REFRESH);
    return () => clearInterval(t);
  }, [refresh]);

  const handleConfirm = async (id: number) => {
    setConfirming(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed", payment_status: "paid" }),
      });
      if (res.ok) {
        // Optimistically update the order in the list
        setOrders(prev =>
          prev?.map(o =>
            o.id === id ? { ...o, status: "confirmed", payment_status: "paid" } : o
          ) ?? null
        );
        setConfirmed(prev => new Set(prev).add(id));
      }
    } catch { /* silently fail — UI stays unchanged */ }
    finally {
      setConfirming(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const pendingCount = orders?.filter(isPendingOrder).length ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Recent Orders</p>
          {pendingCount > 0 && (
            <span className="rounded-full bg-[#E85C1A] px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
              {pendingCount} pending
            </span>
          )}
        </div>
        <Link href="/admin/orders" className="text-[0.75rem] font-semibold text-[#E85C1A] hover:underline">
          View all →
        </Link>
      </div>

      <div className="divide-y divide-black/[0.04]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <div className="h-3.5 w-32 animate-pulse rounded bg-[#e5e7eb]" />
              <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-[#e5e7eb]" />
            </div>
          ))
        ) : orders === null ? (
          <p className="px-5 py-8 text-center text-[0.83rem] text-[#9ca3af]">
            Could not load orders.{" "}
            <button type="button" onClick={() => void refresh()} className="font-semibold text-[#E85C1A] hover:underline">
              Retry
            </button>
          </p>
        ) : orders.length === 0 ? (
          <p className="px-5 py-8 text-center text-[0.83rem] text-[#5c5e62]">No orders yet.</p>
        ) : (
          orders.map(o => (
            <Row
              key={o.id}
              o={o}
              onConfirm={handleConfirm}
              confirming={confirming.has(o.id)}
            />
          ))
        )}
      </div>

      {/* Summary footer when pending orders exist */}
      {!loading && pendingCount > 0 && (
        <div className="border-t border-[#E85C1A]/10 bg-[#fffaf8] px-5 py-2.5">
          <p className="text-[0.72rem] font-semibold text-[#E85C1A]">
            {pendingCount} order{pendingCount > 1 ? "s" : ""} awaiting payment confirmation
          </p>
        </div>
      )}
    </div>
  );
}
