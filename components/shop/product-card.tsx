"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, CheckCircle2, ChevronDown, ArrowRight } from "lucide-react";
import type { Product } from "./data";
export type { Product } from "./data";
import { useLanguage } from "@/context/language-context";
import { useDepthTilt } from "@/hooks/useDepthTilt";
import { useCompare } from "@/context/compare-context";

const PLACEHOLDER = "/images/tyre-placeholder.svg";

type CustomerType = "b2b" | "b2c" | "guest";

// Resolve the best image for a product:
// 1. primary_image (processed full URL)
// 2. brand_image (brand-level fallback, full URL from backend)
// 3. neutral tyre placeholder
function resolveImage(product: import("./data").Product): string {
  if (product.primary_image) return product.image;
  if (product.brand_image) return product.brand_image;
  return PLACEHOLDER;
}

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
  const { toggle, isComparing, isFull } = useCompare();
  const [showSpecs, setShowSpecs] = useState(false);

  const imageUrl = resolveImage(product);
  const { displayPrice, badge, showGuestNudge } = resolvePrice(product, customerType);
  const comparing = isComparing(product.id);

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
      <div className="flex flex-1 flex-col border-t border-gray-100 p-4 pt-7">
        {/* Floating primary CTA — straddles the image/content boundary */}
        <Link
          href={`/shop/${product.id}`}
          className="relative z-10 -mt-11 mb-3 flex h-[42px] w-full items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] text-[0.83rem] font-bold text-white shadow-[0_10px_24px_rgba(244,81,30,0.32)] transition hover:bg-[var(--primary-hover)] hover:shadow-[0_12px_28px_rgba(244,81,30,0.4)]"
        >
          {t.shop.card.viewDetails}
          <ArrowRight size={14} strokeWidth={2.4} />
        </Link>

        {/* Brand + type badge + compare toggle */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
            {product.brand}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
              {product.type}
            </span>
            <button
              type="button"
              onClick={() => toggle(product)}
              disabled={!comparing && isFull}
              title={comparing ? "Remove from comparison" : isFull ? "Compare list full (max 4)" : "Add to comparison"}
              className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                comparing
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-gray-200 bg-white text-gray-400 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
              }`}
            >
              <ArrowLeftRight size={10} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* Product name — max 2 lines */}
        <h3 className="mt-1.5 line-clamp-2 text-[0.95rem] font-bold leading-snug text-[var(--foreground)]">
          {product.name}
        </h3>

        {/* Size & spec */}
        <p className="mt-1 text-[0.8rem] text-gray-400">
          {product.size}{product.spec ? ` · ${product.spec}` : ""}
        </p>

        {/* Show specs disclosure */}
        <button
          type="button"
          onClick={() => setShowSpecs((v) => !v)}
          className="mt-1.5 flex items-center gap-1 text-[0.72rem] font-semibold text-gray-500 transition hover:text-[var(--foreground)]"
        >
          {t.shop.card.showSpecs}
          <ChevronDown size={12} strokeWidth={2.4} className={`transition-transform ${showSpecs ? "rotate-180" : ""}`} />
        </button>
        {showSpecs && (
          <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-100 bg-gray-50/60 px-3 text-[0.76rem]">
            {[
              [t.shop.accordion.season, product.season],
              [t.shop.accordion.tyreType, product.type],
              ["SKU", product.sku],
            ].filter(([, v]) => !!v).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-[var(--foreground)]">{value}</span>
              </div>
            ))}
          </div>
        )}

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
          {product.in_stock !== false && (
            <p className="mt-0.5 flex items-center gap-1 text-[0.72rem] font-semibold text-emerald-600">
              <CheckCircle2 size={12} strokeWidth={2.2} /> {t.shop.card.inStock}
            </p>
          )}
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

        {/* Secondary action — primary CTA already floats above */}
        <Link
          href="/tyre-supply-quotation"
          className="mt-4 flex h-[38px] items-center justify-center rounded-full border border-gray-200 bg-white text-[0.8rem] font-semibold text-[var(--foreground)] transition hover:border-gray-300 hover:bg-gray-50"
        >
          {t.shop.card.quote}
        </Link>
      </div>
    </div>
  );
}
