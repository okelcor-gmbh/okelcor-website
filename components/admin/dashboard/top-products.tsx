"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";

type Product = { name: string; brand: string; views: number };

export default function TopProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoad]      = useState(true);
  const [err, setErr]           = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/posthog/funnel", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (res?.topProducts) {
      setProducts(res.topProducts);
      setErr(false);
    } else {
      setErr(true);
    }
    setLoad(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, same pattern as cart-context.tsx
  useEffect(() => { refresh(); }, [refresh]);

  const maxViews = products?.[0]?.views ?? 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-5 py-4">
        <Flame size={15} className="text-[#E85C1A]" />
        <div>
          <p className="text-[0.9rem] font-bold text-[#1a1a1a]">Top Products</p>
          <p className="text-[0.68rem] text-[#9ca3af]">Most viewed · last 7 days</p>
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="mb-1.5 h-3 w-36 animate-pulse rounded bg-[#e5e7eb]" />
                <div className="h-2 w-full animate-pulse rounded-full bg-[#e5e7eb]" />
              </div>
            ))}
          </div>
        ) : err || !products?.length ? (
          <div className="py-4 text-center">
            <p className="text-[0.83rem] text-[#9ca3af]">No product view data yet.</p>
            <p className="mt-1 text-[0.72rem] text-[#9ca3af]">Data appears after product_viewed events fire.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((p, i) => (
              <div key={i}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[0.82rem] font-semibold text-[#1a1a1a]">{p.name}</p>
                    <p className="text-[0.7rem] text-[#9ca3af]">{p.brand}</p>
                  </div>
                  <span className="shrink-0 text-[0.8rem] font-bold tabular-nums text-[#5c5e62]">{p.views} views</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f2f5]">
                  <div
                    className="h-full rounded-full bg-[#E85C1A] transition-all duration-700"
                    style={{ width: `${Math.round((p.views / maxViews) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-black/[0.04] px-5 py-3">
        <Link href="/admin/products" className="text-[0.75rem] font-semibold text-[#E85C1A] hover:underline">
          View all products →
        </Link>
      </div>
    </div>
  );
}
