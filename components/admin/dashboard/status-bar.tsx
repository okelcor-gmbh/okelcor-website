"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, FileText, Package, Wifi } from "lucide-react";

type Bar = {
  visitors:     number;
  pendingOrders: number;
  openQuotes:   number;
  lowStockCount: number;
};

const REFRESH = 30_000;

function Dot({ color }: { color: string }) {
  return (
    <span className={`relative flex h-2 w-2 shrink-0`}>
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${color}`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}

export default function StatusBar() {
  const [data, setData]   = useState<Bar | null>(null);
  const [stale, setStale] = useState(false);

  const refresh = useCallback(async () => {
    setStale(false);
    const [statsRes, phRes] = await Promise.all([
      fetch("/api/admin/dashboard/stats", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/posthog/dashboard", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (statsRes || phRes) {
      setData({
        visitors:      phRes?.activeUsersNow   ?? 0,
        pendingOrders: statsRes?.pendingOrders  ?? 0,
        openQuotes:    statsRes?.openQuotes     ?? 0,
        lowStockCount: statsRes?.lowStockCount  ?? 0,
      });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + poll, same pattern as cart-context.tsx
    refresh();
    const t = setInterval(() => { setStale(true); refresh(); }, REFRESH);
    return () => clearInterval(t);
  }, [refresh]);

  const items = [
    {
      href:  "/admin/analytics",
      icon:  <Wifi size={12} strokeWidth={2} />,
      dot:   "bg-emerald-500",
      label: `${data?.visitors ?? "—"} live visitors`,
      color: "text-emerald-700",
    },
    {
      href:  "/admin/orders",
      icon:  <ShoppingCart size={12} strokeWidth={2} />,
      dot:   (data?.pendingOrders ?? 0) > 0 ? "bg-amber-500" : "bg-gray-300",
      label: `${data?.pendingOrders ?? "—"} pending orders`,
      color: (data?.pendingOrders ?? 0) > 0 ? "text-amber-700" : "text-[#5c5e62]",
    },
    {
      href:  "/admin/quotes",
      icon:  <FileText size={12} strokeWidth={2} />,
      dot:   (data?.openQuotes ?? 0) > 0 ? "bg-blue-500" : "bg-gray-300",
      label: `${data?.openQuotes ?? "—"} open quotes`,
      color: (data?.openQuotes ?? 0) > 0 ? "text-blue-700" : "text-[#5c5e62]",
    },
    {
      href:  "/admin/products",
      icon:  <Package size={12} strokeWidth={2} />,
      dot:   (data?.lowStockCount ?? 0) > 0 ? "bg-red-500" : "bg-gray-300",
      label: `${data?.lowStockCount ?? "—"} low stock alerts`,
      color: (data?.lowStockCount ?? 0) > 0 ? "text-red-600" : "text-[#5c5e62]",
    },
  ];

  return (
    <div className={`mb-5 flex flex-wrap items-center gap-x-1 gap-y-2 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 transition-opacity ${stale ? "opacity-60" : ""}`}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition hover:bg-[#f5f5f7]"
        >
          <Dot color={item.dot} />
          <span className={`flex items-center gap-1.5 text-[0.78rem] font-semibold tabular-nums ${item.color}`}>
            {item.icon}
            {item.label}
          </span>
        </Link>
      ))}
      <span className="ml-auto text-[0.68rem] text-[#9ca3af]">auto-refreshes every 30s</span>
    </div>
  );
}
