"use client";

import Link from "next/link";
import { useStagger } from "@/hooks/useStagger";
import { useLanguage } from "@/context/language-context";
import MagneticButton from "@/components/ui/magnetic-button";

export default function CTASection() {
  const { t } = useLanguage();
  const cardRef = useStagger<HTMLDivElement>({ stagger: 0.11, y: 18 });

  return (
    <section className="w-full bg-[#f5f5f5] py-10 md:py-12">
      <div className="tesla-shell">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-[22px] border border-black/[0.04] bg-[#efefef] px-4 py-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.06)] sm:px-6 sm:py-10 md:px-16 md:py-12"
        >
          <div className="pointer-events-none absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-[radial-gradient(ellipse_at_bottom,rgba(244,81,30,0.10),transparent_68%)]" />

          <div className="relative z-10">
            <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
              {t.cta.eyebrow}
            </p>

            <h2 className="mx-auto mt-4 max-w-4xl text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl md:text-4xl lg:text-5xl">
              {t.cta.title}
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-[1rem] leading-8 text-[var(--muted)]">
              {t.cta.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <MagneticButton>
                <Link
                  href="/tyre-supply-quotation"
                  className="cta-press inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-8 py-3 text-[14px] font-semibold text-white shadow-[0_16px_32px_rgba(244,81,30,0.22)] hover:bg-[var(--primary-hover)]"
                >
                  {t.cta.button}
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href="/shop"
                  className="cta-press inline-flex items-center justify-center rounded-full border border-black/10 bg-white/94 px-8 py-3 text-[14px] font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(0,0,0,0.06)] hover:bg-white"
                >
                  {t.cta.button2}
                </Link>
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
