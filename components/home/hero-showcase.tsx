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
import Image from "next/image";
import { useRouter } from "next/navigation";

const TYRE_SRC = "/car-wheel-disk-with-tyre-and-brakes-on-black-back-.webp";
import { Search, Truck, ShieldCheck, Boxes, BadgeCheck, Globe, ArrowRight, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { gsap, useGSAP, ease, prefersReducedMotion } from "@/lib/gsap";
import MagneticButton from "@/components/ui/magnetic-button";
import TyreRing from "./tyre-ring";

// Sample sizes for the animated "Find your size" typewriter placeholder.
const SIZE_SAMPLES = ["205/55 R16", "225/45 R17", "315/80 R22.5", "23.5 R25", "295/80 R22.5"];

const CHIP_ICONS = [BadgeCheck, ShieldCheck, Boxes, Globe] as const;
const ROTATE_MS = 3000;

// Shop filter target per product (aligned with the heroShowcase.products order)
const PRODUCT_HREFS = ["/shop?type=TBR", "/shop?type=PCR", "/shop?type=OTR", "/shop?type=USED"] as const;

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

      // Headline: flowing per-character reveal (subtle rise + fade).
      gsap.fromTo(
        ".hs-char",
        { opacity: 0, yPercent: 40 },
        { opacity: 1, yPercent: 0, duration: 0.5, ease: "power3.out", stagger: 0.018, delay: 0.05 }
      );

      // Entrance: text fades up (via CSS targets), cards scale/fade in staggered.
      gsap.fromTo(
        ".hs-fade",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.7, ease: ease.entrance, stagger: 0.08, delay: 0.15 }
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

      // Ambient motion — rings rotate, glows drift, route dashes flow.
      gsap.utils.toArray<Element>(".hs-ring").forEach((ring, i) => {
        gsap.to(ring, {
          rotation: i % 2 === 0 ? 360 : -360,
          duration: 90 + i * 40,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        });
      });

      gsap.to(".hs-glow", {
        x: "+=26",
        y: "-=20",
        duration: 10,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 1.4,
      });

      gsap.to(".hs-route", {
        attr: { "stroke-dashoffset": -180 },
        duration: 5,
        ease: "none",
        repeat: -1,
      });

      // Spin the tyre(s) slowly.
      gsap.utils.toArray<Element>(".hs-tyre").forEach((el, i) => {
        gsap.to(el, {
          rotation: 360,
          duration: 24 + i * 8,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        });
      });

      // Cursor-follow light (fine pointers only) — smooth lerp via quickTo.
      const section = sectionRef.current;
      const cursor = section?.querySelector(".hs-cursor");
      if (section && cursor && window.matchMedia("(pointer: fine)").matches) {
        const rect0 = section.getBoundingClientRect();
        gsap.set(cursor, { x: rect0.width * 0.7, y: rect0.height * 0.4, opacity: 0 });
        const xTo = gsap.quickTo(cursor, "x", { duration: 0.7, ease: "power3" });
        const yTo = gsap.quickTo(cursor, "y", { duration: 0.7, ease: "power3" });
        const onMove = (e: MouseEvent) => {
          const rect = section.getBoundingClientRect();
          xTo(e.clientX - rect.left);
          yTo(e.clientY - rect.top);
        };
        const onEnter = () => gsap.to(cursor, { opacity: 1, duration: 0.5 });
        const onLeave = () => gsap.to(cursor, { opacity: 0, duration: 0.5 });
        section.addEventListener("mousemove", onMove);
        section.addEventListener("mouseenter", onEnter);
        section.addEventListener("mouseleave", onLeave);
        return () => {
          section.removeEventListener("mousemove", onMove);
          section.removeEventListener("mouseenter", onEnter);
          section.removeEventListener("mouseleave", onLeave);
        };
      }
    },
    { scope: sectionRef }
  );

  const product = h.products[productIdx];

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-gradient-to-b from-white to-[#eef0f3] pt-20"
    >
      {/* Ambient background — soft, animated, low-opacity (decorative only) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hs-glow absolute right-[-8%] top-[-12%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,81,30,0.12),transparent_62%)] blur-2xl" />
        <div className="hs-glow absolute left-[-12%] bottom-[-22%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle_at_center,rgba(23,26,32,0.05),transparent_64%)] blur-2xl" />

        {/* faint dotted grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(rgba(23,26,32,0.7) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Slowly-rotating tyre rings — desktop only, fills the empty space */}
        <TyreRing className="hs-ring absolute right-[7%] top-[1%] hidden h-[380px] w-[380px] text-[#171a20] opacity-[0.05] lg:block" />
        <TyreRing className="hs-ring absolute left-[-3%] bottom-[2%] hidden h-[260px] w-[260px] text-[#171a20] opacity-[0.06] lg:block" />

        {/* Flowing shipping-route arc — desktop only */}
        <svg
          viewBox="0 0 600 300"
          fill="none"
          className="absolute left-1/2 top-1/2 hidden h-[440px] w-[780px] -translate-x-1/2 -translate-y-1/2 text-[var(--primary)] opacity-[0.10] lg:block"
        >
          <path
            className="hs-route"
            d="M30,250 C190,60 410,60 570,170"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 12"
          />
          <circle cx="30" cy="250" r="5" fill="currentColor" />
          <circle cx="570" cy="170" r="5" fill="currentColor" />
        </svg>

        {/* Cursor-follow light — desktop only (centred on the pointer via x/y) */}
        <div className="hs-cursor absolute left-0 top-0 -ml-[210px] -mt-[210px] hidden h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,81,30,0.10),transparent_60%)] blur-2xl lg:block" />

        {/* Slowly-spinning real tyre — fills the empty corner, behind the cards */}
        <Image
          src={TYRE_SRC}
          alt=""
          width={220}
          height={220}
          className="hs-tyre absolute bottom-[3%] right-[2%] hidden h-[210px] w-[210px] object-contain opacity-[0.7] mix-blend-multiply lg:block"
        />
      </div>

      <div className="tesla-shell relative">
        <div className="grid grid-cols-1 items-center gap-10 py-12 lg:min-h-[88vh] lg:grid-cols-2 lg:gap-10 lg:py-20">

          {/* ── Left: copy ─────────────────────────────────── */}
          <div>
            <span className="hs-fade inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c5e62] shadow-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" />
              {h.eyebrow}
            </span>

            <h1
              aria-label={h.title}
              className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-[3.4rem]"
            >
              <span aria-hidden="true">
                {h.title.split(" ").map((word, wi) => (
                  <span key={`${word}-${wi}`} className="mr-[0.25em] inline-block">
                    {Array.from(word).map((ch, ci) => (
                      <span key={ci} className="hs-char inline-block will-change-[transform,opacity]">
                        {ch}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            </h1>

            <p className="hs-fade mt-5 max-w-lg text-[1.05rem] leading-8 text-[var(--muted)]">
              {h.subtitle}
            </p>

            <div className="hs-fade mt-8 flex flex-wrap gap-3">
              <MagneticButton>
                <Link href="/tyre-supply-quotation" className="tesla-hero-btn-primary">
                  {t.hero.ctaPrimary}
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href="/shop"
                  className="inline-flex h-[44px] min-w-[140px] items-center justify-center rounded-full border border-black/15 bg-white px-6 text-[0.88rem] font-bold text-[var(--foreground)] transition hover:bg-[#f3f3f4] sm:h-[46px] sm:min-w-[160px] sm:px-7 sm:text-[0.95rem]"
                >
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[0.76rem] font-semibold text-[#5c5e62] shadow-sm"
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

            {/* Mobile: compact stack — rotating product + working search only
                (shipment/global story is covered by the flag strip below) */}
            <div className="flex flex-col gap-4 lg:hidden">
              <ProductCard refCb={(el) => (cardRefs.current[0] = el)} textRef={productTextRef} h={h} product={product} href={PRODUCT_HREFS[productIdx]} />
              <SearchCard refCb={(el) => (cardRefs.current[1] = el)} h={h} />
            </div>

            {/* Desktop: overlapping cluster — featured (wide) animated search on top */}
            <div className="relative hidden h-[520px] lg:block">
              <div className="absolute left-0 right-3 top-0">
                <SearchCard refCb={(el) => (cardRefs.current[1] = el)} h={h} feature />
              </div>
              <div className="absolute right-0 top-[235px] w-[290px]">
                <ProductCard refCb={(el) => (cardRefs.current[0] = el)} textRef={productTextRef} h={h} product={product} href={PRODUCT_HREFS[productIdx]} />
              </div>
              <div className="absolute bottom-0 left-0 w-[300px]">
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
  "rounded-2xl border border-black/[0.06] bg-white shadow-[0_24px_55px_-22px_rgba(23,26,32,0.22)] will-change-transform";

function TyreDisc() {
  // Real tyre product image; white bg vanishes via mix-blend on the white card.
  return (
    <Image
      src={TYRE_SRC}
      alt=""
      width={72}
      height={72}
      className="hs-tyre h-16 w-16 shrink-0 object-contain mix-blend-multiply"
    />
  );
}

function ProductCard({
  refCb, textRef, h, product, href,
}: {
  refCb: (el: HTMLDivElement | null) => void;
  textRef: React.RefObject<HTMLDivElement | null>;
  h: H;
  product: H["products"][number];
  href: string;
}) {
  return (
    <div ref={refCb} className={`${CARD_CLASS} group relative p-5 transition-shadow duration-300 hover:shadow-[0_30px_70px_-22px_rgba(23,26,32,0.32)]`}>
      <Link href={href} aria-label={`${product.cat} — ${product.size}`} className="absolute inset-0 z-10 rounded-2xl" />
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {h.inStock}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4f4f5] text-[#9ca3af] transition group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]">
          <ArrowUpRight size={15} strokeWidth={2.2} />
        </span>
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

// Normalise free-text size to the shop's expected "205/55R16" form, else fall
// back to a general (?q=) search so something always filters.
function shopHrefForSize(raw: string): string {
  const v = raw.trim();
  if (!v) return "/shop";
  const norm = v.replace(/\s+/g, "").toUpperCase();
  const isSize = /^\d{2,3}\/\d{2}R?\d{2}(\.\d)?$/.test(norm);
  if (isSize) {
    const withR = norm.includes("R") ? norm : norm.replace(/^(\d{2,3}\/\d{2})(\d{2})/, "$1R$2");
    return `/shop?size=${encodeURIComponent(withR)}`;
  }
  return `/shop?q=${encodeURIComponent(v)}`;
}

function SearchCard({
  refCb, h, feature = false,
}: {
  refCb: (el: HTMLDivElement | null) => void;
  h: H;
  feature?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState("");
  const [caret, setCaret] = useState(true);

  const animate = feature && !focused && value === "";

  // Typewriter placeholder — cycles through sample sizes.
  useEffect(() => {
    if (!animate) return;
    if (prefersReducedMotion()) { setTyped(SIZE_SAMPLES[0]); return; }
    let wordIdx = 0, charIdx = 0, deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = SIZE_SAMPLES[wordIdx];
      if (!deleting) {
        charIdx++;
        setTyped(word.slice(0, charIdx));
        if (charIdx >= word.length) { deleting = true; timer = setTimeout(tick, 1500); return; }
        timer = setTimeout(tick, 95);
      } else {
        charIdx--;
        setTyped(word.slice(0, Math.max(0, charIdx)));
        if (charIdx <= 0) { deleting = false; wordIdx = (wordIdx + 1) % SIZE_SAMPLES.length; timer = setTimeout(tick, 450); return; }
        timer = setTimeout(tick, 45);
      }
    };
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [animate]);

  // Caret blink.
  useEffect(() => {
    if (!animate || prefersReducedMotion()) return;
    const id = setInterval(() => setCaret((c) => !c), 530);
    return () => clearInterval(id);
  }, [animate]);

  const go = (raw: string) => router.push(shopHrefForSize(raw));
  const submit = (e: React.FormEvent) => { e.preventDefault(); go(value); };

  const placeholder = animate ? `${typed}${caret ? "▏" : " "}` : h.searchPlaceholder;

  return (
    <div ref={refCb} className={`${CARD_CLASS} ${feature ? "p-6" : "p-5"}`}>
      <p className="mb-2.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
        {h.searchTitle}
      </p>
      <form
        onSubmit={submit}
        className={`flex items-center gap-2 rounded-xl border border-black/[0.08] bg-[#fbfbfc] px-3 transition focus-within:border-[var(--primary)]/40 focus-within:ring-2 focus-within:ring-[var(--primary)]/10 ${feature ? "py-3.5" : "py-2.5"}`}
      >
        <Search size={feature ? 18 : 16} className="shrink-0 text-[#9ca3af]" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          aria-label={h.searchTitle}
          className={`min-w-0 flex-1 bg-transparent text-[#1a1a1a] outline-none placeholder:text-[#9ca3af] ${feature ? "text-[0.98rem]" : "text-[0.85rem]"}`}
        />
        <button
          type="submit"
          aria-label={h.searchTitle}
          className={`flex shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] transition hover:bg-[var(--primary-hover)] ${feature ? "h-8 w-8" : "h-6 w-6"}`}
        >
          <ArrowRight size={feature ? 15 : 13} strokeWidth={2.4} className="text-white" />
        </button>
      </form>

      {feature && (
        <div className="mt-3 flex flex-wrap gap-2">
          {["205/55 R16", "225/45 R17", "315/80 R22.5"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => go(s)}
              className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[0.72rem] font-semibold text-[#5c5e62] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[0.74rem] font-semibold text-[#5c5e62]">
        <Boxes size={13} className="text-[var(--primary)]" />
        {h.stockNote}
      </p>
    </div>
  );
}

function ShipmentCard({ refCb, h }: { refCb: (el: HTMLDivElement | null) => void; h: H }) {
  return (
    <div ref={refCb} className={`${CARD_CLASS} group relative p-5 transition-shadow duration-300 hover:shadow-[0_30px_70px_-22px_rgba(23,26,32,0.32)]`}>
      <Link href="/wholesale-tire-distributors-europe" aria-label={h.shipmentLabel} className="absolute inset-0 z-10 rounded-2xl" />
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
