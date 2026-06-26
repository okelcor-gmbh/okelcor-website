"use client";

import Link from "next/link";
import Reveal from "@/components/motion/reveal";
import SectionHeading from "@/components/ui/section-heading";
import { useLanguage } from "@/context/language-context";

export default function WhoWeServeSection() {
  const { t } = useLanguage();

  return (
    <section className="w-full bg-[#f5f5f5] py-12 md:py-16">
      <div className="tesla-shell">
        {/* Section header */}
        <SectionHeading eyebrow={t.whoWeServe.eyebrow} heading={t.whoWeServe.heading} align="center" className="mb-5" />

        <Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* For Businesses */}
            <div className="group relative min-h-[420px] overflow-hidden rounded-[22px]">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ backgroundImage: "url('/images/pexels-andris-ivanovs-296481283-19891668.png')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
              <div className="absolute bottom-0 left-0 right-0 p-7 md:p-8">
                <span className="inline-flex items-center rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white">
                  {t.whoWeServe.business.label}
                </span>
                <h3 className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-white md:text-3xl">
                  {t.whoWeServe.business.title}
                </h3>
                <p className="mt-2 max-w-[480px] text-[0.92rem] leading-6 text-white/80">
                  {t.whoWeServe.business.body}
                </p>
                <div className="mt-4">
                  <Link
                    href="/tyre-supply-quotation"
                    className="inline-flex h-[48px] items-center justify-center rounded-full bg-[var(--primary)] px-6 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                  >
                    {t.whoWeServe.business.cta}
                  </Link>
                </div>
              </div>
            </div>

            {/* For Drivers */}
            <div className="group relative min-h-[420px] overflow-hidden rounded-[22px]">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ backgroundImage: "url('/images/pexels-mikebirdy-250307.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
              <div className="absolute bottom-0 left-0 right-0 p-7 md:p-8">
                <span className="inline-flex items-center rounded-full border border-white/60 bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                  {t.whoWeServe.driver.label}
                </span>
                <h3 className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-white md:text-3xl">
                  {t.whoWeServe.driver.title}
                </h3>
                <p className="mt-2 max-w-[480px] text-[0.92rem] leading-6 text-white/80">
                  {t.whoWeServe.driver.body}
                </p>
                <div className="mt-4">
                  <Link
                    href="/shop"
                    className="inline-flex h-[48px] items-center justify-center rounded-full border border-white/80 bg-white px-6 text-[0.88rem] font-semibold text-[var(--foreground)] transition hover:bg-white/90"
                  >
                    {t.whoWeServe.driver.cta}
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}
