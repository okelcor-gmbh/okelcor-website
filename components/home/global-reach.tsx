"use client";

/* eslint-disable @next/next/no-img-element -- flags are tiny remote SVGs; next/image adds no value and would need remote-domain config */

/**
 * components/home/global-reach.tsx
 *
 * Slim "global reach" band under the hero — a continuously-scrolling marquee of
 * the countries Okelcor sources & delivers to, with crisp Twemoji SVG flags
 * (reliable on Windows, where native emoji flags render as letters).
 *
 * The country set reflects Okelcor's core markets (Europe, Africa, Middle East)
 * surfaced from admin delivery/inquiry insights. Swap the list to wire it to a
 * public aggregated endpoint later — the display stays the same.
 *
 * GSAP marquee (seamless via a duplicated track); pauses on hover; the country
 * name is real text so it reads fine even if a flag image fails to load.
 */

import { useRef } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

const COUNTRIES: { code: string; name: string }[] = [
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "PL", name: "Poland" },
  { code: "IT", name: "Italy" },
  { code: "GB", name: "United Kingdom" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "AE", name: "UAE" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "EG", name: "Egypt" },
];

// Two-letter ISO code → Twemoji regional-indicator SVG filename.
function flagUrl(code: string): string {
  const cp = code
    .toUpperCase()
    .split("")
    .map((c) => (0x1f1e6 + c.charCodeAt(0) - 65).toString(16))
    .join("-");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;
}

export default function GlobalReach() {
  const { t } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track || prefersReducedMotion()) return;
      // Track holds two identical copies; moving -50% loops seamlessly.
      tweenRef.current = gsap.to(track, {
        xPercent: -50,
        duration: 36,
        ease: "none",
        repeat: -1,
      });
      return () => tweenRef.current?.kill();
    },
    { scope: trackRef }
  );

  return (
    <section className="w-full border-b border-black/[0.06] bg-white py-6">
      <div className="tesla-shell flex flex-col items-center gap-4 sm:flex-row sm:gap-8">

        {/* Label */}
        <div className="flex shrink-0 items-center gap-2 text-[#5c5e62]">
          <Globe size={16} strokeWidth={2} className="text-[var(--primary)]" />
          <span className="text-[0.76rem] font-bold uppercase tracking-[0.16em]">{t.globalReach}</span>
        </div>

        {/* Marquee */}
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)]">
          <div
            ref={trackRef}
            className="flex w-max gap-2.5"
            onMouseEnter={() => tweenRef.current?.pause()}
            onMouseLeave={() => tweenRef.current?.resume()}
          >
            {[...COUNTRIES, ...COUNTRIES].map((c, i) => (
              <span
                key={`${c.code}-${i}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/[0.07] bg-[#f7f7f8] px-3 py-1.5"
              >
                <img
                  src={flagUrl(c.code)}
                  alt=""
                  width={18}
                  height={14}
                  loading="lazy"
                  className="h-[14px] w-auto rounded-[2px]"
                />
                <span className="whitespace-nowrap text-[0.8rem] font-semibold text-[#171a20]">{c.name}</span>
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
