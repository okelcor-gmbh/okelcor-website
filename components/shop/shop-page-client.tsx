"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import CarFinder from "@/components/shop/car-finder";
import ShopCatalogue from "@/components/shop/shop-catalogue";
import { SHOP_REQUIRES_LOGIN } from "@/lib/flags";

export default function ShopPageClient({
  initialFilters,
  noNavbarPad,
  source = "shop",
}: {
  initialFilters?: Record<string, string>;
  noNavbarPad?: boolean;
  source?: "shop" | "seo-landing";
}) {
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const router = useRouter();
  const [prefilledSize, setPrefilledSize] = useState("");

  useEffect(() => {
    if (SHOP_REQUIRES_LOGIN && !isLoading && !isAuthenticated) {
      router.replace("/login?redirect=/shop");
    }
  }, [isLoading, isAuthenticated, router]);

  // Block render only when login is required and auth hasn't resolved yet.
  if (SHOP_REQUIRES_LOGIN && (isLoading || !isAuthenticated)) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ paddingTop: "calc(var(--bar-h, 0px) + 76px)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#f0f0f0] border-t-[var(--primary)]" />
          <p className="text-[0.85rem] text-[var(--muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={noNavbarPad ? undefined : { paddingTop: "calc(var(--bar-h, 0px) + 76px)" }}>
      <CarFinder onSizeSelect={setPrefilledSize} />
      <div id="shop-catalogue">
        <ShopCatalogue
          prefilledSize={prefilledSize}
          onPrefilledSizeConsumed={() => setPrefilledSize("")}
          initialFilters={initialFilters}
          source={source}
        />
      </div>
    </div>
  );
}
