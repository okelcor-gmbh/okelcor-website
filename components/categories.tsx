"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { gsap, ScrollTrigger, useGSAP, ease, scrollDefaults, prefersReducedMotion } from "@/lib/gsap";
import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/context/language-context";

const CARD_IMAGES = [
  "/images/pexels-piotr-arnoldes-7862031-6063163.png",
  "/images/pexels-furkanakt-29235902.png",
  "/images/Used tyres.png",
  "/images/OTR tyres.png",
];

type CardData = { label: string; title: string; subtitle: string };

function CategoryCard({
  card,
  image,
  orderNow,
  learnMore,
}: {
  card: CardData;
  image: string;
  orderNow: string;
  learnMore: string;
}) {
  const cardRef = useRef<HTMLElement>(null);
  // Cached rect — read once on mouseenter, not on every mousemove.
  const rectCache = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  const handleMouseEnter = () => {
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rectCache.current = { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    const rect = rectCache.current;
    if (!el || !rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 16;
    const rotateX = (0.5 - py) * 16;
    el.style.transition = "transform 0.1s ease";
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    rectCache.current = null;
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = "transform 0.5s ease";
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <article
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-[360px] min-w-[88%] snap-start overflow-hidden rounded-[22px] bg-black sm:h-[420px] md:h-[580px] md:min-w-[68%] lg:min-w-[62%]"
    >
      <Image
        src={image}
        alt={card.label}
        fill
        className="object-cover transition-transform duration-700 hover:scale-[1.03]"
        sizes="(max-width: 768px) 88vw, (max-width: 1200px) 68vw, 62vw"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/10 to-black/58" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/12" />
      <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-black/18 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/58 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white md:p-10">
        <div>
          <p className="text-[1rem] font-semibold md:text-[1.15rem]">{card.label}</p>
        </div>

        <div className="max-w-[500px]">
          <h2 className="text-[1.9rem] font-semibold leading-[0.94] tracking-[-0.045em] sm:text-[2.4rem] md:text-[3.5rem]">
            {card.title}
          </h2>

          <p className="mt-3 max-w-[540px] text-[1.04rem] font-medium text-white/95 md:text-[1.15rem]">
            {card.subtitle}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/tyre-supply-quotation"
              className="inline-flex h-[48px] items-center justify-center rounded-full bg-[var(--primary)] px-6 text-[1rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              {orderNow}
            </Link>

            <Link
              href="/shop"
              style={{ color: "#171a20" }}
              className="inline-flex h-[48px] items-center justify-center rounded-full bg-white/95 px-6 text-[1rem] font-semibold transition hover:bg-white"
            >
              {learnMore}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Categories() {
  const { t } = useLanguage();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Heading reveal — eyebrow + h2 fade up together as the section enters view.
  const headingRef = useReveal<HTMLDivElement>({ y: 20, duration: 0.6 });

  // Card stagger — targets the <article> elements inside the slider container.
  // Uses sliderRef directly (avoids a ref conflict with the scroll tracking ref).
  // Cards cascade in left-to-right with a small y offset when the row enters view.
  useGSAP(
    () => {
      const container = sliderRef.current;
      if (!container) return;

      const cards = Array.from(container.querySelectorAll<HTMLElement>("article"));
      if (!cards.length) return;

      const reduced = prefersReducedMotion();

      gsap.fromTo(
        cards,
        { opacity: 0, y: reduced ? 0 : 28 },
        {
          opacity: 1,
          y: 0,
          duration: reduced ? 0.01 : 0.65,
          ease: ease.entrance,
          stagger: reduced ? 0 : 0.1,
          scrollTrigger: {
            trigger: container,
            start: scrollDefaults.start,
            toggleActions: scrollDefaults.toggleActions,
            once: true,
          },
        }
      );
    },
    { scope: sliderRef, dependencies: [] }
  );

  const rafId = useRef<number | null>(null);

  const updateActiveIndex = () => {
    if (rafId.current !== null) return; // already scheduled
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (!sliderRef.current) return;

      const container = sliderRef.current;
      const children = Array.from(container.children) as HTMLElement[];
      if (!children.length) return;

      const containerCenter = container.scrollLeft + container.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;

      children.forEach((child, index) => {
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const distance = Math.abs(containerCenter - childCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    });
  };

  useEffect(() => {
    updateActiveIndex();
  }, []);

  const scrollToCard = (index: number) => {
    if (!sliderRef.current) return;

    const children = Array.from(sliderRef.current.children) as HTMLElement[];
    const target = children[index];
    if (!target) return;

    const leftOffset = target.offsetLeft - 24;

    sliderRef.current.scrollTo({
      left: leftOffset,
      behavior: "smooth",
    });

    setActiveIndex(index);
  };

  const scrollLeft = () => {
    const nextIndex = Math.max(0, activeIndex - 1);
    scrollToCard(nextIndex);
  };

  const scrollRight = () => {
    const nextIndex = Math.min(CARD_IMAGES.length - 1, activeIndex + 1);
    scrollToCard(nextIndex);
  };

  return (
    <section className="w-full bg-[#f5f5f5] py-6 md:py-8">
      <div className="tesla-shell">
        <div ref={headingRef} className="mb-6 px-1">
          <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
            {t.categories.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
            {t.categories.heading}
          </h2>
        </div>

        <div className="relative">
          <div
            ref={sliderRef}
            onScroll={updateActiveIndex}
            className="hide-scrollbar flex gap-7 overflow-x-auto scroll-smooth px-1 pb-4 snap-x snap-mandatory"
          >
            {t.categories.cards.map((card, i) => (
              <CategoryCard
                key={card.title}
                card={card}
                image={CARD_IMAGES[i]}
                orderNow={t.categories.orderNow}
                learnMore={t.categories.learnMore}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={scrollLeft}
            className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-[10px] bg-white/88 p-3 text-black shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition hover:bg-white md:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={scrollRight}
            className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-[10px] bg-white/88 p-3 text-black shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition hover:bg-white md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight size={24} strokeWidth={2} />
          </button>

          <div className="mt-4 flex items-center justify-center gap-3">
            {CARD_IMAGES.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollToCard(index)}
                className={`h-[12px] w-[12px] rounded-full transition ${
                  index === activeIndex ? "bg-[var(--foreground)]" : "bg-black/25"
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}