"use client";

import Link from "next/link";
import Reveal from "@/components/motion/reveal";
import { useLanguage } from "@/context/language-context";

export default function TyreHighlightsSection() {
  const { t } = useLanguage();

  return (
    <section className="w-full bg-[#f5f5f5] py-12 md:py-16">
      <div className="tesla-shell">
        <Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* Used Tyres */}
            <div className="overflow-hidden rounded-[22px] border border-black/[0.05] bg-[#efefef] shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(0,0,0,0.10)]">
              <div
                className="relative min-h-[220px] overflow-hidden transition-transform duration-700 hover:scale-[1.02] sm:min-h-[260px]"
                style={{
                  backgroundImage: "url('/images/pexels-jonathanborba-18372024.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />
              </div>
              <div className="flex flex-col p-6 sm:p-7 md:p-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
                  {t.used.eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-extrabold leading-snug tracking-tight text-[var(--foreground)] sm:text-2xl">
                  {t.used.title}
                </h2>
                <p className="mt-3 text-[0.92rem] leading-7 text-[var(--muted)]">
                  {t.used.body}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/shop"
                    className="inline-flex h-[48px] items-center justify-center rounded-full bg-[var(--primary)] px-5 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                  >
                    {t.used.viewCatalogue}
                  </Link>
                  <Link
                    href="/tyre-supply-quotation"
                    className="inline-flex h-[48px] items-center justify-center rounded-full border border-black/10 bg-white px-5 text-[0.88rem] font-semibold text-[var(--foreground)] transition hover:bg-[#f0f0f0]"
                  >
                    {t.used.requestQuote}
                  </Link>
                </div>
              </div>
            </div>

            {/* TBR Tyres */}
            <div className="overflow-hidden rounded-[22px] border border-black/[0.05] bg-[#efefef] shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(0,0,0,0.10)]">
              <div
                className="relative min-h-[220px] overflow-hidden transition-transform duration-700 hover:scale-[1.02] sm:min-h-[260px]"
                style={{
                  backgroundImage: "url('/images/pexels-biplabsau-5359359.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="flex flex-col p-6 sm:p-7 md:p-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
                  {t.tbr.eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-extrabold leading-snug tracking-tight text-[var(--foreground)] sm:text-2xl">
                  {t.tbr.title}
                </h2>
                <p className="mt-3 text-[0.92rem] leading-7 text-[var(--muted)]">
                  {t.tbr.body}
                </p>
                <div className="mt-4">
                  <Link
                    href="/tyre-supply-quotation"
                    className="inline-flex h-[48px] items-center justify-center rounded-full bg-[var(--primary)] px-5 text-[0.88rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                  >
                    {t.tbr.getQuote}
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
