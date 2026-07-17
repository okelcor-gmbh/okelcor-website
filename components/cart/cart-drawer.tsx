"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCart, type CartItem } from "@/context/cart-context";
import { gsap, ease } from "@/lib/gsap";
import { useLanguage } from "@/context/language-context";
import type { Translations } from "@/lib/translations";

type CartT = Translations["cart"];

function CartItemRow({ item, t }: { item: CartItem; t: CartT }) {
  const { removeItem, updateQuantity } = useCart();
  const { product, quantity } = item;
  const lineTotal = product.price * quantity;

  return (
    <div className="flex gap-4 py-4">
      {/* Thumbnail */}
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-[#f0f0f0]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
              {product.brand}
            </p>
            <p className="mt-0.5 truncate text-[0.9rem] font-semibold text-[var(--foreground)]">
              {product.name}
            </p>
            <p className="text-[0.8rem] text-[var(--muted)]">
              {product.size} · {product.spec}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(product.id)}
            className="shrink-0 rounded-full p-1 text-[var(--muted)] transition hover:bg-black/[0.06] hover:text-[var(--foreground)]"
            aria-label={t.removeItem}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Qty + price row */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center overflow-hidden rounded-full border border-black/10 bg-white">
            <button
              type="button"
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="flex h-7 w-7 items-center justify-center transition hover:bg-black/[0.05]"
              aria-label={t.decrease}
            >
              <Minus size={12} strokeWidth={2.5} />
            </button>
            <span className="min-w-[28px] text-center text-[0.82rem] font-semibold text-[var(--foreground)]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(product.id, quantity + 1)}
              className="flex h-7 w-7 items-center justify-center transition hover:bg-black/[0.05]"
              aria-label={t.increase}
            >
              <Plus size={12} strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-[0.95rem] font-extrabold text-[var(--foreground)]">
            €{lineTotal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { items, totalItems, subtotal, isOpen, closeCart, clearCart } =
    useCart();
  const { t } = useLanguage();
  const ct = t.cart;

  const drawerRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Set initial hidden state synchronously before first paint
  useEffect(() => {
    if (drawerRef.current) gsap.set(drawerRef.current, { x: "100%", autoAlpha: 0 });
    if (backdropRef.current) gsap.set(backdropRef.current, { autoAlpha: 0 });
  }, []);

  // Slide in / slide out on isOpen change
  useEffect(() => {
    const drawer = drawerRef.current;
    const backdrop = backdropRef.current;

    if (isOpen) {
      // Backdrop fade in
      if (backdrop) {
        gsap.to(backdrop, {
          autoAlpha: 1,
          duration: 0.22,
          ease: ease.smooth,
          overwrite: true,
        });
      }
      // Drawer slide in from right
      if (drawer) {
        gsap.set(drawer, { autoAlpha: 1 });
        gsap.fromTo(
          drawer,
          { x: "100%" },
          { x: "0%", duration: 0.38, ease: ease.drawer, overwrite: true }
        );
      }
    } else {
      // Backdrop fade out — onInterrupt mirrors onComplete so it never
      // gets stuck blocking pointer events if the tween is killed mid-flight
      if (backdrop) {
        const hideBackdrop = () => { gsap.set(backdrop, { autoAlpha: 0 }); };
        gsap.to(backdrop, {
          autoAlpha: 0,
          duration: 0.24,
          ease: ease.smooth,
          overwrite: true,
          onComplete: hideBackdrop,
          onInterrupt: hideBackdrop,
        });
      }
      // Drawer slide out to right
      if (drawer) {
        const hideDrawer = () => { gsap.set(drawer, { autoAlpha: 0 }); };
        gsap.to(drawer, {
          x: "100%",
          duration: 0.32,
          ease: ease.smooth,
          overwrite: true,
          onComplete: hideDrawer,
          onInterrupt: hideDrawer,
        });
      }
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop — always in DOM, visibility controlled by GSAP autoAlpha */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
        style={{ visibility: "hidden" }}
        onClick={closeCart}
      />

      {/* Drawer — always in DOM, slides in/out via GSAP */}
      <aside
        ref={drawerRef}
        className="fixed right-0 top-0 z-[70] flex h-screen w-full max-w-[420px] flex-col bg-white shadow-[-16px_0_48px_rgba(0,0,0,0.12)]"
        style={{ visibility: "hidden" }}
      >
        {/* Header */}
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-black/[0.07] px-5">
          <div className="flex items-center gap-2.5">
            <ShoppingCart size={20} strokeWidth={1.9} />
            <span className="text-[1rem] font-extrabold text-[var(--foreground)]">
              {ct.title}
            </span>
            {totalItems > 0 && (
              <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[11px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="rounded-full px-3 py-1.5 text-[0.78rem] font-semibold text-[var(--muted)] transition hover:bg-black/[0.05] hover:text-[var(--foreground)]"
              >
                {ct.clearAll}
              </button>
            )}
            <button
              type="button"
              onClick={closeCart}
              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-black/[0.06]"
              aria-label={ct.closeCart}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Item list */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingCart
              size={44}
              strokeWidth={1.3}
              className="text-black/20"
            />
            <p className="text-[1rem] font-semibold text-[var(--foreground)]">
              {ct.emptyTitle}
            </p>
            <p className="text-[0.88rem] text-[var(--muted)]">
              {ct.emptyBody}
            </p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="mt-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              {ct.browseCatalogue}
            </Link>

            <div className="mt-5 w-full border-t border-black/[0.06] pt-5">
              <p className="mb-3 text-[0.76rem] font-semibold uppercase tracking-wide text-[var(--muted)]">
                {ct.shopByCategory}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  ["/shop?type=USED", ct.categoryUsed],
                  ["/shop?type=PCR", "PCR"],
                  ["/shop?type=TBR", "TBR"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeCart}
                    className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-[0.8rem] font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="hide-scrollbar flex-1 overflow-y-auto px-5">
            <div className="divide-y divide-black/[0.06]">
              {items.map((item) => (
                <CartItemRow key={item.product.id} item={item} t={ct} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-black/[0.07] px-5 py-5">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-[0.9rem] text-[var(--muted)]">
                {ct.subtotal} ({totalItems} {totalItems === 1 ? ct.item : ct.items})
              </span>
              <span className="text-[1.25rem] font-extrabold text-[var(--foreground)]">
                €{subtotal.toFixed(2)}
              </span>
            </div>
            <p className="mt-0.5 text-[0.76rem] text-[var(--muted)]">
              {ct.priceNote}
            </p>

            {/* CTAs */}
            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex h-[48px] items-center justify-center rounded-full bg-[var(--primary)] text-[0.95rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
              >
                {ct.checkout}
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="flex h-[44px] items-center justify-center rounded-full border border-black/10 bg-white text-[0.9rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f5f5f5]"
              >
                {ct.continueShopping}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
