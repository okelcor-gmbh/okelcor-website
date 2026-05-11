"use client";

// Pure-presentational. All data fetching is done in shop-catalogue.tsx so
// specials products start loading in parallel with the promotions API call —
// no user interaction required.

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Cloud,
  Disc3,
  Minus,
  Plus,
  ShoppingCart,
  Snowflake,
  Sun,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import type { Product } from "./data";

type CustomerType = "b2b" | "b2c" | "guest";

// ── Helpers ────────────────────────────────────────────────────────────────────

function resolvePrice(product: Product, ct: CustomerType): number {
  if (ct === "b2b") return product.price_b2b ?? product.price;
  if (ct === "b2c") return product.price_b2c ?? product.price;
  return product.price_b2c ?? product.price;
}

// ── Season badge ───────────────────────────────────────────────────────────────

function SeasonBadge({ season }: { season: string }) {
  if (!season) return null;
  const s = season.toLowerCase();
  const isWinter = s.includes("winter");
  const isSummer = s.includes("summer");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.63rem] font-semibold ${
        isWinter
          ? "bg-blue-50 text-blue-600"
          : isSummer
          ? "bg-amber-50 text-amber-600"
          : "bg-slate-50 text-slate-500"
      }`}
    >
      {isWinter ? <Snowflake size={10} /> : isSummer ? <Sun size={10} /> : <Cloud size={10} />}
      {season}
    </span>
  );
}

// ── Skeleton row ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <>
      {/* Desktop skeleton (sm+) */}
      <div className="hidden items-center gap-4 border-b border-[#e4f0e4] px-6 py-3.5 last:border-0 sm:flex">
        <div className="h-9 w-9 animate-pulse rounded-full bg-[#dbeeda]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-14 animate-pulse rounded bg-[#dbeeda]" />
          <div className="h-3 w-40 animate-pulse rounded bg-[#dbeeda]" />
        </div>
        <div className="w-[120px] space-y-1.5">
          <div className="h-2.5 w-20 animate-pulse rounded bg-[#dbeeda]" />
          <div className="h-2 w-10 animate-pulse rounded bg-[#dbeeda]" />
        </div>
        <div className="h-5 w-[90px] animate-pulse rounded-full bg-[#dbeeda]" />
        <div className="hidden w-[70px] lg:block">
          <div className="h-2.5 w-14 animate-pulse rounded bg-[#dbeeda]" />
        </div>
        <div className="w-[88px] space-y-1 text-right">
          <div className="ml-auto h-3.5 w-16 animate-pulse rounded bg-[#dbeeda]" />
        </div>
        <div className="h-7 w-[76px] animate-pulse rounded-full bg-[#dbeeda]" />
        <div className="h-8 w-[68px] animate-pulse rounded-full bg-[#dbeeda]" />
        <div className="hidden h-3 w-10 animate-pulse rounded bg-[#dbeeda] lg:block" />
      </div>
      {/* Mobile skeleton */}
      <div className="flex gap-3 border-b border-[#e4f0e4] px-4 py-4 last:border-0 sm:hidden">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[#dbeeda]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-12 animate-pulse rounded bg-[#dbeeda]" />
          <div className="h-3 w-32 animate-pulse rounded bg-[#dbeeda]" />
          <div className="h-2.5 w-24 animate-pulse rounded bg-[#dbeeda]" />
        </div>
        <div className="h-5 w-14 animate-pulse rounded bg-[#dbeeda]" />
      </div>
    </>
  );
}

// ── Product row ────────────────────────────────────────────────────────────────

function SpecialRow({
  product,
  customerType,
  discountPct,
}: {
  product: Product;
  customerType: CustomerType;
  discountPct?: number | null;
}) {
  const { addItem, openCart } = useCart();
  const [qty, setQty]       = useState(1);
  const [added, setAdded]   = useState(false);

  const price      = resolvePrice(product, customerType);
  const outOfStock = product.in_stock === false;

  function handleAdd() {
    if (outOfStock) return;
    addItem(product, qty);
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="border-b border-[#e4f0e4] last:border-0">

      {/* ── Desktop row (sm+) ── */}
      <div className="hidden items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#f5faf5] sm:flex sm:gap-4 sm:px-6">

        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4511e]/10">
          <Disc3 size={16} className="text-[#f4511e]" strokeWidth={1.8} />
        </div>

        {/* Brand + name */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-[#f4511e]">
            {product.brand}
          </p>
          <p className="truncate text-[0.88rem] font-semibold text-[#171a20]">
            {product.name}
          </p>
        </div>

        {/* Size + spec */}
        <div className="w-[120px] shrink-0">
          <p className="text-[0.82rem] font-semibold text-[#171a20]">{product.size}</p>
          {product.spec && (
            <p className="text-[0.72rem] text-[#5c5e62]">{product.spec}</p>
          )}
        </div>

        {/* Season */}
        <div className="w-[96px] shrink-0">
          <SeasonBadge season={product.season} />
        </div>

        {/* Stock */}
        <div className="hidden w-[70px] shrink-0 lg:block">
          {outOfStock ? (
            <span className="text-[0.72rem] font-semibold text-red-500">Out of stock</span>
          ) : (
            <span className="text-[0.72rem] font-semibold text-emerald-600">In stock</span>
          )}
        </div>

        {/* Price */}
        <div className="w-[88px] shrink-0 text-right">
          {discountPct != null && discountPct > 0 && (
            <p className="text-[0.63rem] font-semibold text-[#5c5e62] line-through">
              €{(price / (1 - discountPct / 100)).toFixed(2)}
            </p>
          )}
          <p className="text-[0.95rem] font-extrabold text-[#171a20]">
            €{price.toFixed(2)}
          </p>
        </div>

        {/* Quantity stepper */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={qty <= 1 || outOfStock}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#5c5e62] transition hover:border-[#f4511e]/40 hover:text-[#f4511e] disabled:opacity-30"
          >
            <Minus size={11} strokeWidth={2.5} />
          </button>
          <span className="w-6 text-center text-[0.82rem] font-semibold text-[#171a20]">
            {qty}
          </span>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => setQty((q) => q + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#5c5e62] transition hover:border-[#f4511e]/40 hover:text-[#f4511e] disabled:opacity-30"
          >
            <Plus size={11} strokeWidth={2.5} />
          </button>
        </div>

        {/* Add to cart */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.75rem] font-bold text-white transition disabled:opacity-40 ${
            added ? "bg-emerald-500" : "bg-[#f4511e] hover:bg-[#df4618] active:scale-[0.97]"
          }`}
        >
          {added ? <Check size={13} strokeWidth={2.5} /> : <ShoppingCart size={13} strokeWidth={2} />}
          {added ? "Added" : "Add"}
        </button>

        {/* View link */}
        <Link
          href={`/shop/${product.id}`}
          className="hidden shrink-0 text-[0.72rem] font-semibold text-[#5c5e62] transition hover:text-[#f4511e] lg:block"
        >
          View →
        </Link>
      </div>

      {/* ── Mobile card (< sm) ── */}
      <div className="px-4 py-4 sm:hidden">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4511e]/10">
            <Disc3 size={18} className="text-[#f4511e]" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-[#f4511e]">
              {product.brand}
            </p>
            <p className="text-[0.9rem] font-bold text-[#171a20]">{product.name}</p>
            <p className="mt-0.5 text-[0.78rem] text-[#5c5e62]">
              {product.size}{product.spec ? ` · ${product.spec}` : ""}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <SeasonBadge season={product.season} />
              {outOfStock ? (
                <span className="text-[0.68rem] font-semibold text-red-500">Out of stock</span>
              ) : (
                <span className="text-[0.68rem] font-semibold text-emerald-600">In stock</span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            {discountPct != null && discountPct > 0 && (
              <p className="text-[0.63rem] text-[#5c5e62] line-through">
                €{(price / (1 - discountPct / 100)).toFixed(2)}
              </p>
            )}
            <p className="text-[1rem] font-extrabold text-[#171a20]">€{price.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={qty <= 1 || outOfStock}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] text-[#5c5e62] disabled:opacity-30"
            >
              <Minus size={11} strokeWidth={2.5} />
            </button>
            <span className="w-6 text-center text-[0.85rem] font-semibold text-[#171a20]">{qty}</span>
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => setQty((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] text-[#5c5e62] disabled:opacity-30"
            >
              <Plus size={11} strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[0.82rem] font-bold text-white transition disabled:opacity-40 ${
              added ? "bg-emerald-500" : "bg-[#f4511e] hover:bg-[#df4618]"
            }`}
          >
            {added ? <Check size={14} strokeWidth={2.5} /> : <ShoppingCart size={14} strokeWidth={2} />}
            {added ? "Added to cart" : "Add to cart"}
          </button>

          <Link
            href={`/shop/${product.id}`}
            className="flex h-9 shrink-0 items-center rounded-full border border-[#e5e7eb] px-3 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e]/40 hover:text-[#f4511e]"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export type SpecialsProductListProps = {
  products: Product[];
  loading: boolean;
  brandName: string;
  discountPct?: number | null;
  customerType: CustomerType;
  onViewAll: () => void;
};

export default function SpecialsProductList({
  products,
  loading,
  brandName,
  discountPct,
  customerType,
  onViewAll,
}: SpecialsProductListProps) {
  // Do NOT return null here — the id="specials-section" div must always be in
  // the DOM once this component is mounted so the CTA scroll target exists.
  // Empty-state is handled inline in the rows section below.

  const SKELETON_COUNT = 5;

  return (
    <div
      id="specials-section"
      className="mb-6 overflow-hidden rounded-2xl border border-[#d1e8d1] bg-[#f0faf0] shadow-sm"
    >
      {/* ── Section header ── */}
      <div className="flex items-center justify-between border-b border-[#d1e8d1] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-emerald-500" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f4511e]">
                Specials
              </p>
              {discountPct != null && discountPct > 0 && (
                <span className="rounded-full bg-[#f4511e] px-2.5 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-widest text-white">
                  {discountPct}% OFF
                </span>
              )}
            </div>
            <p className="text-[0.82rem] font-semibold text-[#171a20]">
              {brandName} tyres — limited offer
            </p>
          </div>
        </div>

        {/* Desktop CTA */}
        <button
          type="button"
          onClick={onViewAll}
          className="hidden items-center gap-1 rounded-full border border-[#f4511e]/25 bg-white px-4 py-2 text-[0.78rem] font-semibold text-[#f4511e] transition hover:bg-[#fff0ec] sm:flex"
        >
          Shop {brandName} Tyres
          <ChevronRight size={14} strokeWidth={2.2} />
        </button>
      </div>

      {/* ── Desktop column headers (visible only when products loaded) ── */}
      {!loading && (
        <div className="hidden items-center gap-4 border-b border-[#d1e8d1] px-6 py-2 sm:flex">
          <div className="w-9 shrink-0" />
          <p className="flex-1 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
            Product
          </p>
          <p className="w-[120px] shrink-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
            Size / Spec
          </p>
          <p className="w-[96px] shrink-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
            Season
          </p>
          <p className="hidden w-[70px] shrink-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62] lg:block">
            Stock
          </p>
          <p className="w-[88px] shrink-0 text-right text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
            Price
          </p>
          <p className="w-[76px] shrink-0 text-center text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
            Qty
          </p>
          <div className="w-[68px] shrink-0" />
          <div className="hidden w-10 shrink-0 lg:block" />
        </div>
      )}

      {/* ── Rows ── */}
      <div>
        {loading ? (
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonRow key={i} />
          ))
        ) : products.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-[0.85rem] text-[#5c5e62]">
              No {brandName} specials available right now.
            </p>
          </div>
        ) : (
          products.map((p) => (
            <SpecialRow
              key={p.id}
              product={p}
              customerType={customerType}
              discountPct={discountPct}
            />
          ))
        )}
      </div>

      {/* ── Mobile CTA ── */}
      <div className="border-t border-[#d1e8d1] px-4 py-3 sm:hidden">
        <button
          type="button"
          onClick={onViewAll}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#f4511e]/25 bg-white py-2.5 text-[0.82rem] font-semibold text-[#f4511e] transition hover:bg-[#fff0ec]"
        >
          Shop all {brandName} Tyres
          <ChevronRight size={14} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
