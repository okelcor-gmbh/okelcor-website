"use client";

import Reveal from "@/components/motion/reveal";
import { useStagger } from "@/hooks/useStagger";
import { useLanguage } from "@/context/language-context";

export default function RexCertified() {
  const { t } = useLanguage();

  // Stagger the three flex columns (badge → text → reg+CTA) after the card reveal.
  // delay: 0.3 lets the card fade mostly into view before the columns cascade.
  const columnsRef = useStagger<HTMLDivElement>({ stagger: 0.12, y: 16, delay: 0.3 });

  return (
    <section className="w-full bg-[#0e0e0e] py-12 md:py-16">
      <div className="tesla-shell">
        <Reveal className="rounded-[22px] border border-white/[0.08] bg-[#1a1a1a] px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.40)] sm:px-8 sm:py-8 md:px-12 md:py-10">
          <div ref={columnsRef} className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12">

            {/* Logo badge */}
            <div className="flex shrink-0 items-center justify-center rounded-[16px] bg-white p-5 shadow-sm md:h-[120px] md:w-[120px]">
              <img
                src="/rex-logo.svg"
                alt="REX Certified"
                width={90}
                height={90}
                loading="lazy"
                style={{ width: "90px", height: "auto" }}
                className="object-contain"
              />
            </div>

            {/* Text content */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
                {t.rex.eyebrow}
              </p>
              <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                {t.rex.title}
              </h2>
              <p className="mt-2 max-w-2xl text-[0.95rem] leading-7 text-white/60">
                {t.rex.body}
              </p>
            </div>

            {/* Registration + CTA */}
            <div className="flex shrink-0 flex-col items-center gap-3 md:items-end">
              <div className="text-center md:text-right">
                <p className="text-xl font-extrabold tracking-tight text-white">
                  DEREX76000242
                </p>
                <p className="mt-0.5 text-[0.82rem] text-white/50">
                  {t.rex.regNumber}
                </p>
              </div>
              <a
                href="https://ec.europa.eu/taxation_customs/online-services/online-services-and-databases-customs/rex-registered-exporter-system_en"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-[48px] items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-5 text-[13px] font-semibold text-white transition hover:bg-white/[0.12]"
              >
                {t.rex.verify}
              </a>
            </div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}
