"use client";

/**
 * components/home/hero-showcase.tsx
 *
 * "Living operations" homepage hero — replaces the image slider.
 *
 * Left:  H1 + subtitle + CTAs + trust chips (SEO-preserving headline).
 * Right: a cluster of gently-floating product-UI cards (product / search /
 *        shipment) that tell the tyres → catalogue → global-logistics story
 *        at a glance. The product card rotates through tyre types to stay
 *        lively without a carousel.
 *
 * Dark premium theme. All copy via t.heroShowcase / t.hero. No financial data.
 * All values are illustrative (stock count, brand count, route, specs).
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Truck, ShieldCheck, Boxes, BadgeCheck, Globe, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { gsap, useGSAP, ease, prefersReducedMotion } from "@/lib/gsap";
import MagneticButton from "@/components/ui/magnetic-button";

const CHIP_ICONS = [BadgeCheck, ShieldCheck, Boxes, Globe] as const;
const ROTATE_MS = 3000;

export default function HeroShowcase() {
  const { t } = useLanguage();
  const h = t.heroShowcase;

  const sectionRef = useRef<HTMLElement>(null);
  const productTextRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [productIdx, setProductIdx] = useState(0);

  // ── Rotate the product card through tyre types ──────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setProductIdx((i) => (i + 1) % h.products.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [h.products.length]);

  // Crossfade the product text on each rotation
  useEffect(() => {
    if (prefersReducedMotion() || !productTextRef.current) return;
    gsap.fromTo(
      productTextRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );
  }, [productIdx]);

  // ── Entrance + idle float ───────────────────────────────────────────────────
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];

      // Entrance: text fades up (via CSS targets), cards scale/fade in staggered.
      gsap.fromTo(
        ".hs-fade",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.7, ease: ease.entrance, stagger: 0.08 }
      );
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: ease.entrance, stagger: 0.12, delay: 0.15 }
      );

      // Idle float — each card drifts on its own gentle loop.
      cards.forEach((card, i) => {
        gsap.to(card, {
          y: i % 2 === 0 ? -12 : 10,
          duration: 3 + i * 0.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 0.8 + i * 0.2,
        });
      });
    },
    { scope: sectionRef }
  );

  const product = h.products[productIdx];

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[#0b0b0c] pt-20"
    >
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-8%] top-[-10%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,81,30,0.20),transparent_60%)] blur-2xl" />
        <div className="absolute left-[-10%] bottom-[-20%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_64%)] blur-2xl" />
        {/* faint dotted grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="tesla-shell relative">
        <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 items-center gap-12 py-14 lg:min-h-[88vh] lg:grid-cols-2 lg:gap-10 lg:py-20">

          {/* ── Left: copy ─────────────────────────────────── */}
          <div>
            <span className="hs-fade inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" />
              {h.eyebrow}
            </span>

            <h1 className="hs-fade mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
              {h.title}
            </h1>

            <p className="hs-fade mt-5 max-w-lg text-[1.05rem] leading-8 text-white/60">
              {h.subtitle}
            </p>

            <div className="hs-fade mt-8 flex flex-wrap gap-3">
              <MagneticButton>
                <Link href="/tyre-supply-quotation" className="tesla-hero-btn-primary">
                  {t.hero.ctaPrimary}
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link href="/shop" className="tesla-hero-btn-secondary">
                  {t.hero.ctaSecondary}
                </Link>
              </MagneticButton>
            </div>

            {/* Trust chips */}
            <div className="hs-fade mt-9 flex flex-wrap gap-2.5">
              {h.chips.map((chip, i) => {
                const Icon = CHIP_ICONS[i] ?? BadgeCheck;
                return (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.76rem] font-semibold text-white/70"
                  >
                    <Icon size={13} strokeWidth={2} className="text-[var(--primary)]" />
                    {chip}
                  </span>
                );
              })}
            </div>
          </div>

          {/* ── Right: floating UI cluster ─────────────────── */}
          <div className="relative mx-auto w-full max-w-[520px]">

            {/* Mobile: simple stack */}
            <div className="flex flex-col gap-4 lg:hidden">
              <ProductCard refCb={(el) => (cardRefs.current[0] = el)} textRef={productTextRef} h={h} product={product} />
              <SearchCard refCb={(el) => (cardRefs.current[1] = el)} h={h} />
              <ShipmentCard refCb={(el) => (cardRefs.current[2] = el)} h={h} />
            </div>

            {/* Desktop: overlapping cluster */}
            <div className="relative hidden h-[480px] lg:block">
              <div className="absolute right-0 top-2 w-[300px]">
                <ProductCard refCb={(el) => (cardRefs.current[0] = el)} textRef={productTextRef} h={h} product={product} />
              </div>
              <div className="absolute left-0 top-[150px] w-[280px]">
                <SearchCard refCb={(el) => (cardRefs.current[1] = el)} h={h} />
              </div>
              <div className="absolute bottom-2 right-6 w-[290px]">
                <ShipmentCard refCb={(el) => (cardRefs.current[2] = el)} h={h} />
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────

type H = ReturnType<typeof useLanguage>["t"]["heroShowcase"];

const CARD_CLASS =
  "rounded-2xl border border-white/10 bg-white shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)] will-change-transform";

function TyreDisc() {
  return (
    <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle,#2b2b2b_0%,#121212_72%)] shadow-inner">
      <div className="absolute inset-1.5 rounded-full border-2 border-dashed border-white/15" />
      <div className="h-7 w-7 rounded-full bg-[#0b0b0c] ring-4 ring-[#262626]" />
    </div>
  );
}

function ProductCard({
  refCb, textRef, h, product,
}: {
  refCb: (el: HTMLDivElement | null) => void;
  textRef: React.RefObject<HTMLDivElement | null>;
  h: H;
  product: H["products"][number];
}) {
  return (
    <div ref={refCb} className={`${CARD_CLASS} p-5`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {h.inStock}
        </span>
        <Boxes size={16} className="text-[#c0c3c8]" />
      </div>
      <div className="flex items-center gap-4">
        <TyreDisc />
        <div ref={textRef} className="min-w-0">
          <p className="truncate text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
            {product.cat}
          </p>
          <p className="mt-0.5 text-[1.15rem] font-extrabold text-[#1a1a1a]">{product.size}</p>
        </div>
      </div>
    </div>
  );
}

function SearchCard({ refCb, h }: { refCb: (el: HTMLDivElement | null) => void; h: H }) {
  return (
    <div ref={refCb} className={`${CARD_CLASS} p-5`}>
      <p className="mb-2.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
        {h.searchTitle}
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-[#fbfbfc] px-3 py-2.5">
        <Search size={16} className="shrink-0 text-[#9ca3af]" />
        <span className="truncate text-[0.85rem] text-[#9ca3af]">{h.searchPlaceholder}</span>
        <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]">
          <ArrowRight size={13} strokeWidth={2.4} className="text-white" />
        </span>
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-[0.74rem] font-semibold text-[#5c5e62]">
        <Boxes size={13} className="text-[var(--primary)]" />
        {h.stockNote}
      </p>
    </div>
  );
}

function ShipmentCard({ refCb, h }: { refCb: (el: HTMLDivElement | null) => void; h: H }) {
  return (
    <div ref={refCb} className={`${CARD_CLASS} p-5`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
          {h.shipmentLabel}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[0.66rem] font-bold text-blue-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
          {h.shipmentStatus}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10">
          <Truck size={17} strokeWidth={1.9} className="text-[var(--primary)]" />
        </span>
        <p className="text-[0.92rem] font-extrabold text-[#1a1a1a]">{h.shipmentRoute}</p>
      </div>
      {/* Route progress */}
      <div className="mt-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="h-0.5 flex-1 rounded bg-[var(--primary)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
        <span className="h-0.5 flex-1 rounded bg-black/10" />
        <span className="h-2 w-2 rounded-full border-2 border-black/20 bg-white" />
      </div>
    </div>
  );
}
