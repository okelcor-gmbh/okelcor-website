"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import { gsap, useGSAP, ease, prefersReducedMotion } from "@/lib/gsap";
import { useLanguage } from "@/context/language-context";
import type { HeroSlide } from "@/lib/api";
import MagneticButton from "@/components/ui/magnetic-button";

type HeroProps = {
  slides?: HeroSlide[];
};

const FET_SLIDE = {
  label:    "Also Available",
  title:    "Fuel Echo Tech",
  subtitle: "Save fuel, improve performance and reduce emissions for any vehicle or fleet.",
  videoSrc: "/videos/video with fx desktop.mp4",
} as const;

type DisplaySlot = { type: "fet" } | { type: "api"; apiIndex: number };

/**
 * Builds the ordered display sequence:
 *   0 API slides → [FET]
 *   1 API slide  → [api[0], FET]
 *   2+ API slides → [api[0], FET, api[1], …, api[n-1], FET]
 *
 * FET appears at position 1 (after the first API slide) and again at the end
 * so users see it early and once more before the loop restarts.
 */
function buildDisplaySlots(apiCount: number): DisplaySlot[] {
  if (apiCount === 0) return [{ type: "fet" }];
  if (apiCount === 1) return [{ type: "api", apiIndex: 0 }, { type: "fet" }];
  const slots: DisplaySlot[] = [{ type: "api", apiIndex: 0 }, { type: "fet" }];
  for (let i = 1; i < apiCount; i++) slots.push({ type: "api", apiIndex: i });
  slots.push({ type: "fet" });
  return slots;
}

export default function Hero({ slides: apiSlides }: HeroProps) {
  const { t } = useLanguage();
  const apiCount     = apiSlides?.length ?? 0;
  const displaySlots = buildDisplaySlots(apiCount);
  const slideCount   = displaySlots.length;

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videoErrors, setVideoErrors] = useState<Set<number>>(new Set());
  const [videoReady, setVideoReady] = useState<Set<number>>(new Set());

  const sectionRef = useRef<HTMLElement>(null);
  const bgContainerRef = useRef<HTMLDivElement>(null);
  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const depthOrbRef = useRef<HTMLDivElement>(null);
  const accentGlowRef = useRef<HTMLDivElement>(null);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const prevIndexRef = useRef(0);
  const isFirstRender = useRef(true);

  const handleVideoError = (i: number) => {
    setVideoErrors((prev) => new Set(prev).add(i));
  };

  // Per-slide duration: 8 s for FET (more text to read), 6 s for all others.
  // setTimeout re-fires on every index change so each slide gets its own timer.
  const slideDuration = displaySlots[index]?.type === "fet" ? 8000 : 6000;

  useEffect(() => {
    if (isPaused) return;

    const id = window.setInterval(() => {
      setIndex((prev) => {
        prevIndexRef.current = prev;
        return prev === slideCount - 1 ? 0 : prev + 1;
      });
    }, slideDuration);

    return () => window.clearInterval(id);
  }, [isPaused, index, slideCount, slideDuration]);

  // Pause / play the current video element when the slider is toggled
  useEffect(() => {
    const videoEl = videoRefs.current[index];
    if (!videoEl) return;
    if (isPaused) {
      videoEl.pause();
    } else {
      videoEl.play().catch(() => {});
    }
  }, [isPaused, index]);

  const goTo = (next: number) => {
    prevIndexRef.current = index;
    setIndex(next);
  };

  const goPrev = () => goTo(index === 0 ? slideCount - 1 : index - 1);
  const goNext = () => goTo(index === slideCount - 1 ? 0 : index + 1);

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();

      bgRefs.current.forEach((el) => {
        if (el) gsap.set(el, { opacity: 0 });
      });

      if (reduced) {
        if (bgRefs.current[0]) gsap.set(bgRefs.current[0], { opacity: 1 });
        return;
      }

      try {
        const textEase = "power3.out";
        const dur = 0.8;
        const stagger = 0.15;

        gsap
          .timeline()
          .fromTo(
            bgRefs.current[0],
            { opacity: 0, scale: 1.07 },
            { opacity: 1, scale: 1.04, duration: 1.6, ease: ease.smooth }
          )
          .addLabel("textIn", "-=0.7")
          .fromTo(
            labelRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: dur, ease: textEase },
            "textIn"
          )
          .fromTo(
            titleRef.current,
            { opacity: 0, x: -40 },
            { opacity: 1, x: 0, duration: dur, ease: textEase },
            `textIn+=${stagger}`
          )
          .fromTo(
            subtitleRef.current,
            { opacity: 0, x: -40 },
            { opacity: 1, x: 0, duration: dur, ease: textEase },
            `textIn+=${stagger * 2}`
          )
          .fromTo(
            buttonsRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: dur, ease: textEase },
            `textIn+=${stagger * 3}`
          );

        // Single ScrollTrigger driving all three parallax layers — one scroll
        // listener instead of three, same visual output.
        if (sectionRef.current) {
          const parallaxTl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.8,
            },
          });
          if (bgContainerRef.current) {
            parallaxTl.to(bgContainerRef.current, { y: 80, ease: "none" }, 0);
          }
          if (depthOrbRef.current) {
            parallaxTl.to(depthOrbRef.current, { y: 110, x: 24, ease: "none" }, 0);
          }
          if (accentGlowRef.current) {
            parallaxTl.to(accentGlowRef.current, { y: -52, x: -18, ease: "none" }, 0);
          }
        }
      } catch {
        bgRefs.current.forEach((el, i) => {
          if (el) gsap.set(el, { opacity: i === 0 ? 1 : 0, scale: 1.04 });
        });
        gsap.set(
          [labelRef.current, titleRef.current, subtitleRef.current, buttonsRef.current].filter(Boolean),
          { clearProps: "opacity,x,y" }
        );
      }
    },
    { scope: sectionRef }
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const reduced = prefersReducedMotion();
    const prev = prevIndexRef.current;
    const curr = index;

    if (reduced) {
      bgRefs.current.forEach((el, i) => {
        if (el) gsap.set(el, { opacity: i === curr ? 1 : 0 });
      });
      return;
    }

    const dur = 0.8;
    const stagger = 0.15;
    const textEase = "power3.out";

    const tl = gsap.timeline();

    tl.set(labelRef.current, { opacity: 0, y: -20, x: 0 })
      .set(titleRef.current, { opacity: 0, x: -40, y: 0 })
      .set(subtitleRef.current, { opacity: 0, x: -40, y: 0 })
      .set(buttonsRef.current, { opacity: 0, y: 20, x: 0 })
      .to(bgRefs.current[prev], { opacity: 0, duration: 0.9, ease: ease.smooth }, 0)
      .to(bgRefs.current[curr], { opacity: 1, duration: 0.9, ease: ease.smooth }, 0)
      .to(labelRef.current, { opacity: 1, y: 0, duration: dur, ease: textEase }, 0.15)
      .to(titleRef.current, { opacity: 1, x: 0, duration: dur, ease: textEase }, 0.15 + stagger)
      .to(subtitleRef.current, { opacity: 1, x: 0, duration: dur, ease: textEase }, 0.15 + stagger * 2)
      .to(buttonsRef.current, { opacity: 1, y: 0, duration: dur, ease: textEase }, 0.15 + stagger * 3);

    return () => {
      tl.kill();
    };
  }, [index]);

  const isFetSlide = displaySlots[index]?.type === "fet";
  const currentApiIndex = !isFetSlide && displaySlots[index]?.type === "api"
    ? (displaySlots[index] as { type: "api"; apiIndex: number }).apiIndex
    : -1;

  const slideText = isFetSlide
    ? { label: FET_SLIDE.label, title: FET_SLIDE.title, subtitle: FET_SLIDE.subtitle }
    : {
        label:    apiSlides?.[currentApiIndex]?.label    ?? "",
        title:    apiSlides?.[currentApiIndex]?.title    ?? "",
        subtitle: apiSlides?.[currentApiIndex]?.subtitle ?? "",
      };

  const getSlideMedia = (
    i: number
  ): { type: "image" | "video" | "none"; src: string } => {
    const slot = displaySlots[i];
    if (!slot || slot.type === "fet") return { type: "video", src: FET_SLIDE.videoSrc };
    const { apiIndex } = slot;
    const slide = apiSlides?.[apiIndex];
    if (!slide) return { type: "none", src: "" };
    if (slide.media_type === "video" && slide.video_url && !videoErrors.has(i)) {
      return { type: "video", src: slide.video_url };
    }
    if (slide.media_type === "image" && slide.image_url) {
      return { type: "image", src: slide.image_url };
    }
    return { type: "none", src: "" };
  };

  const currentIsVideo = getSlideMedia(index).type === "video";

  return (
    <section ref={sectionRef} className="w-full pt-20">
      <div className="relative min-h-[80vh] overflow-hidden">
        <div ref={bgContainerRef} className="absolute inset-0 will-change-transform" aria-hidden="true">
          {Array.from({ length: slideCount }, (_, i) => {
            const media = getSlideMedia(i);
            return (
              <div
                key={i}
                ref={(el) => { bgRefs.current[i] = el; }}
                className="absolute inset-0 scale-[1.06] overflow-hidden bg-[#111]"
                style={{ opacity: 0 }}
              >
                {media.type === "video" ? (
                  <video
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={media.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    poster="/images/hero-poster.jpg"
                    onError={() => handleVideoError(i)}
                    onLoadedData={() => setVideoReady((prev) => new Set(prev).add(i))}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${videoReady.has(i) ? "opacity-100" : "opacity-0"}`}
                  />
                ) : media.type === "image" ? (
                  <Image
                    src={media.src}
                    alt=""
                    fill
                    priority={i === 0}
                    className="object-cover"
                    sizes="100vw"
                  />
                ) : (
                  /* API unavailable — branded dark gradient placeholder */
                  <div className="absolute inset-0 bg-[#0f0f0f]" />
                )}
              </div>
            );
          })}
        </div>

        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{ backgroundColor: currentIsVideo ? "rgba(0,0,0,0.50)" : "rgba(0,0,0,0.35)" }}
          aria-hidden="true"
        />
        <div
          ref={depthOrbRef}
          className="pointer-events-none absolute -right-[10%] top-[10%] z-[1] hidden h-[34vw] w-[34vw] max-h-[420px] max-w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_52%,transparent_72%)] blur-2xl lg:block"
          aria-hidden="true"
        />
        <div
          ref={accentGlowRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[42%] bg-[radial-gradient(ellipse_at_bottom,rgba(244,81,30,0.20),transparent_64%)]"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={goPrev}
          className="hero-nav-btn absolute left-8 top-1/2 z-20 hidden -translate-y-1/2 md:flex"
          aria-label="Previous slide"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={goNext}
          className="hero-nav-btn absolute right-8 top-1/2 z-20 hidden -translate-y-1/2 md:flex"
          aria-label="Next slide"
        >
          <ChevronRight size={22} strokeWidth={2} />
        </button>

        <div className="relative z-10 flex h-full flex-col justify-center px-5 pb-6 pt-8 text-center md:px-10 md:pb-8 md:pt-12">
          <div className="flex flex-1 items-center justify-center">
            <div className="mx-auto w-full max-w-5xl">
              <div className="flex flex-col items-center">
                  <span
                    ref={labelRef}
                    className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] backdrop-blur-sm ${
                      isFetSlide
                        ? "border-[#22c55e]/40 bg-[#22c55e]/15 text-[#22c55e]"
                        : "border-white/20 bg-white/10 text-white/90"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: isFetSlide ? "#22c55e" : "var(--primary)" }}
                      aria-hidden="true"
                    />
                    {slideText.label}
                  </span>

                  <h1
                    ref={titleRef}
                    className="hero-title max-w-5xl text-white"
                  >
                    {slideText.title}
                  </h1>

                  <p
                    ref={subtitleRef}
                    className="hero-subtitle mt-3 max-w-4xl text-white"
                  >
                    {slideText.subtitle}
                  </p>

                  <div
                    ref={buttonsRef}
                    className="mt-6 flex flex-wrap justify-center gap-3"
                  >
                    {isFetSlide ? (
                      <>
                        <MagneticButton>
                          <Link href="/fet" className="tesla-hero-btn-fet">
                            Learn More
                          </Link>
                        </MagneticButton>
                        <MagneticButton>
                          <Link href="/tyre-supply-quotation" className="tesla-hero-btn-primary">
                            Request a Quote
                          </Link>
                        </MagneticButton>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
            </div>
          </div>

        </div>

        {/* Play/Pause — absolute bottom-left */}
        <button
          type="button"
          onClick={() => setIsPaused((prev) => !prev)}
          className="hero-control-btn absolute bottom-6 left-6 z-20 hidden md:inline-flex"
          aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
        </button>

        {/* Pagination dots — absolute bottom-center */}
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
          {Array.from({ length: slideCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`hero-dot ${i === index ? "hero-dot-active" : ""}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
