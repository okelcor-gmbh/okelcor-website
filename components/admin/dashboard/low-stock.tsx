"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Package, AlertTriangle } from "lucide-react";

type Product = { id: number; name: string; brand: string; sku: string; stock: number };

export default function LowStock() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoad]      = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/dashboard/stats", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (res?.lowStockList) setProducts(res.lowStockList);
    setLoad(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, same pattern as cart-context.tsx
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Package size={15} className="text-[#5c5e62]" />
          <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Low Stock Alerts</p>
        </div>
        <Link href="/admin/products" className="text-[0.75rem] font-semibold text-[#E85C1A] hover:underline">
          Manage →
        </Link>
      </div>
      <div className="divide-y divide-black/[0.04]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <div className="h-3.5 w-32 animate-pulse rounded bg-[#e5e7eb]" />
              <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-[#e5e7eb]" />
            </div>
          ))
        ) : !products?.length ? (
          <div className="flex items-center gap-3 px-5 py-8">
            <span className="text-2xl">✅</span>
            <p className="text-[0.83rem] text-[#5c5e62]">All products well-stocked.</p>
          </div>
        ) : (
          products.map(p => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}`}
              className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-[#fafafa]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.82rem] font-semibold text-[#1a1a1a]">{p.name}</p>
                <p className="text-[0.72rem] text-[#5c5e62]">{p.brand} · {p.sku}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {p.stock <= 5 && <AlertTriangle size={12} className="text-red-500" />}
                <span
                  className={`text-[0.82rem] font-bold tabular-nums ${p.stock <= 5 ? "text-red-600" : "text-amber-600"}`}
                >
                  {p.stock} left
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
