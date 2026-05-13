"use client";

import Link from "next/link";
import Reveal from "@/components/motion/reveal";
import { useLanguage } from "@/context/language-context";

export default function CompanyStory() {
  const { t } = useLanguage();
  const STATS = [
    { value: "500k+", label: t.about.story.statDaily },
    { value: "30+", label: t.about.story.statCountries },
    { value: "15+", label: t.about.story.statBrands },
  ];
  return (
    <section className="w-full bg-[#f5f5f5] py-8">
      <div className="tesla-shell">
        <Reveal className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">

          {/* Image panel */}
          <div className="relative min-h-[420px] overflow-hidden rounded-[22px] lg:min-h-[600px]">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-[1.03]"
              style={{
                backgroundImage:
                  "url('/images/pexels-baljinder-singh-112079620-34106714.png')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

            {/* Stat chips pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-10 grid grid-cols-3 gap-3 p-6 md:p-8">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-[14px] bg-white/10 px-3 py-3 backdrop-blur-sm"
                >
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="mt-0.5 text-[0.73rem] leading-4 text-white/80">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Content panel */}
          <div className="flex flex-col justify-center rounded-[22px] bg-[#efefef] p-6 sm:p-8 md:p-10 lg:p-12">
            <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
              {t.about.story.eyebrow}
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl lg:text-[2.6rem]">
              {t.about.story.title1}
              <br className="hidden md:block" /> {t.about.story.title2}
            </h2>

            <div className="mt-6 space-y-4 text-[1rem] leading-8 text-[var(--muted)]">
              <p>{t.about.story.p1}</p>
              <p>{t.about.story.p2}</p>
              <p>{t.about.story.p3}</p>
            </div>

            <div className="mt-8">
              <Link
                href="/tyre-supply-quotation"
                className="inline-flex h-[48px] items-center rounded-full bg-[var(--primary)] px-7 text-[0.9rem] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
              >
                {t.about.story.workWithUs}
              </Link>
            </div>
          </div>

        </Reveal>
      </div>
    </section>
  );
}
