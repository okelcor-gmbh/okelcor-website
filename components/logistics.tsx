"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/motion/reveal";
import { useLanguage } from "@/context/language-context";

export default function Logistics() {
  const { t } = useLanguage();

  return (
    <section className="w-full bg-[#f5f5f5] py-6">
      <div className="tesla-shell">
        <div className="grid gap-6 md:grid-cols-[1.35fr_0.9fr]">
          {/* Large logistics card */}
          <Reveal className="relative min-h-[400px] overflow-hidden rounded-[22px] sm:min-h-[400px] md:min-h-[580px]">
            <Image
              src="/images/pexels-einfoto-2091159.jpg"
              alt=""
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 57vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/12 to-black/55" />

            <div className="absolute bottom-0 left-0 right-0 z-10 p-5 sm:p-8 md:p-10">
              <p className="text-lg font-medium text-white/90">
                {t.logistics.eyebrow}
              </p>

              <h2 className="mt-2 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                {t.logistics.title}
              </h2>

              <p className="mt-4 max-w-2xl text-[1.02rem] leading-8 text-white/80">
                {t.logistics.body}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/tyre-supply-quotation"
                  className="inline-flex h-[48px] items-center justify-center rounded-full bg-[var(--primary)] px-6 text-[14px] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                >
                  {t.logistics.getQuote}
                </Link>

                <Link
                  href="/wholesale-tire-distributors-europe"
                  className="inline-flex h-[48px] items-center justify-center rounded-full bg-white px-6 text-[14px] font-semibold text-black transition hover:bg-gray-100"
                >
                  {t.logistics.learnMore}
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Side support card */}
          <Reveal delay={0.15} className="grid gap-6">
            <div className="relative overflow-hidden rounded-[22px] min-h-[300px]">
              <Image
                src="/images/pexels-stockphotoartist-8305319.jpg"
                alt=""
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 43vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/8 to-black/45" />

              <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
                <p className="text-base text-white/85">{t.logistics.flexibleSourcing}</p>
                <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  {t.logistics.usedTyres}
                </h3>
              </div>
            </div>

            <div className="rounded-[22px] bg-[#efefef] p-6 sm:p-8 md:p-10">
              <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
                {t.logistics.distEyebrow}
              </p>

              <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
                {t.logistics.distTitle}
              </h3>

              <p className="mt-4 text-[1rem] leading-8 text-[var(--muted)]">
                {t.logistics.distBody}
              </p>

              <div className="mt-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-[14px] font-semibold text-black transition hover:bg-[#f8f8f8]"
                >
                  {t.logistics.talkToSales}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
