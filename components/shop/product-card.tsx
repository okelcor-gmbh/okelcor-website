"use client";

import Link from "next/link";
import type { Product } from "./data";
export type { Product } from "./data";
import { useLanguage } from "@/context/language-context";
import { useDepthTilt } from "@/hooks/useDepthTilt";

const PLACEHOLDER = "/images/tyre-placeholder.png";

type CustomerType = "b2b" | "b2c" | "guest";

export type ActiveCampaign = {
  brand_name: string;
  discount_pct: number;
};

function resolvePrice(product: Product, customerType: CustomerType) {
  if (customerType === "b2b") {
    const wholesalePrice = product.price_b2b ?? product.price;
    return { displayPrice: wholesalePrice, badge: "wholesale" as const, showGuestNudge: false };
  }
  if (customerType === "b2c") {
    const retailPrice = product.price_b2c ?? product.price;
    return { displayPrice: retailPrice, badge: "retail" as const, showGuestNudge: false };
  }
  // Guest — show retail price, nudge if a wholesale price exists
  const retailPrice = product.price_b2c ?? product.price;
  const nudge = product.price_b2b != null;
  return { displayPrice: retailPrice, badge: null, showGuestNudge: nudge };
}

export default function ProductCard({
  product,
  priority = false,
  customerType = "guest",
  activeCampaign,
}: {
  product: Product;
  priority?: boolean;
  customerType?: CustomerType;
  activeCampaign?: ActiveCampaign | null;
}) {
  const { t } = useLanguage();
  const cardRef = useDepthTilt<HTMLDivElement>({ maxRotate: 4, maxShift: 6, scale: 1.008 });

  const imageUrl = product.image || PLACEHOLDER;
  const { displayPrice, badge, showGuestNudge } = resolvePrice(product, customerType);

  return (
    <div
      ref={cardRef}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      {/* Image area — full tyre visible, no cropping */}
      <div className="relative flex h-44 items-center justify-center bg-white p-4 sm:h-52">
        <img
          src={imageUrl}
          alt={`${product.brand} ${product.name}`}
          loading={priority ? "eager" : "lazy"}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
          className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04] ${product.in_stock === false ? "opacity-50" : ""}`}
        />
        {product.in_stock === false && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            Out of Stock
          </span>
        )}
        {activeCampaign && product.brand.trim().toLowerCase() === activeCampaign.brand_name.trim().toLowerCase() && (
          <span className="absolute right-2 top-2 rounded-full bg-[#f4511e] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow">
            {activeCampaign.discount_pct}% OFF
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col border-t border-gray-100 p-4">
        {/* Brand + type badge */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
            {product.brand}
          </p>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
            {product.type}
          </span>
        </div>

        {/* Product name — max 2 lines */}
        <h3 className="mt-1.5 line-clamp-2 text-[0.95rem] font-bold leading-snug text-[var(--foreground)]">
          {product.name}
        </h3>

        {/* Size & spec */}
        <p className="mt-1 text-[0.8rem] text-gray-400">
          {product.size}{product.spec ? ` · ${product.spec}` : ""}
        </p>

        {/* Price */}
        <div className="mt-3">
          {badge === "wholesale" && (
            <span className="mb-1 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-[0.63rem] font-bold uppercase tracking-wide text-green-700">
              B2B Wholesale Price
            </span>
          )}
          {badge === "retail" && (
            <span className="mb-1 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[0.63rem] font-bold uppercase tracking-wide text-blue-700">
              Retail Price
            </span>
          )}
          <p className="text-[1.25rem] font-extrabold tracking-tight text-[var(--foreground)]">
            €{displayPrice.toFixed(2)}
          </p>
          <p className="text-[0.72rem] text-gray-400">{t.shop.card.shipping}</p>
          {showGuestNudge && (
            <Link
              href="/account/login"
              className="mt-0.5 block text-[0.7rem] font-medium text-[var(--primary)] hover:underline"
            >
              Sign in for wholesale pricing →
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link
            href={`/shop/${product.id}`}
            className="flex h-[40px] flex-1 items-center justify-center rounded-full bg-[var(--primary)] text-[0.82rem] font-semibold text-white shadow-[0_8px_20px_rgba(244,81,30,0.20)] transition hover:bg-[var(--primary-hover)]"
          >
            {t.shop.card.viewDetails}
          </Link>
          <Link
            href="/quote"
            className="flex h-[40px] items-center justify-center rounded-full border border-gray-200 bg-white px-4 text-[0.82rem] font-semibold text-[var(--foreground)] transition hover:border-gray-300 hover:bg-gray-50"
          >
            {t.shop.card.quote}
          </Link>
        </div>
      </div>
    </div>
  );
}
