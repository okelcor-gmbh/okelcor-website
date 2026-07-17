"use client";

import Link from "next/link";
import { FileText, FileSignature, CreditCard, Truck } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import SectionHeading from "@/components/ui/section-heading";
import FadeUp from "@/components/motion/fade-up";

const STEP_ICONS = [FileText, FileSignature, CreditCard, Truck] as const;

export default function HowItWorks() {
  const { t } = useLanguage();
  const hiw = t.howItWorks;

  return (
    <section className="w-full bg-white py-14 md:py-20">
      <div className="tesla-shell">
        <FadeUp>
          <SectionHeading eyebrow={hiw.eyebrow} heading={hiw.heading} align="center" />
          <p className="mx-auto mt-3 max-w-[560px] text-center text-[1rem] leading-7 text-[var(--muted)]">
            {hiw.subheading}
          </p>
        </FadeUp>

        <div className="relative mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* Connecting line — desktop only */}
          <div className="pointer-events-none absolute left-0 right-0 top-[26px] hidden h-px bg-black/[0.08] lg:block" />

          {hiw.steps.map((step, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <FadeUp key={step.title} delay={i * 90} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="relative z-10 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[1.1rem] font-extrabold text-[var(--primary)] shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
                  {i + 1}
                </div>
                <div className="mt-4 flex items-center gap-2 lg:mt-5">
                  <Icon size={16} strokeWidth={1.9} className="text-[var(--primary)]" />
                  <h3 className="text-[1.05rem] font-bold text-[var(--foreground)]">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-2 max-w-[260px] text-[0.88rem] leading-6 text-[var(--muted)]">
                  {step.desc}
                </p>
              </FadeUp>
            );
          })}
        </div>

        <FadeUp className="mt-10 flex justify-center md:mt-12">
          <Link
            href="/tyre-supply-quotation"
            className="btn-cta inline-flex h-[50px] items-center justify-center rounded-full bg-[var(--primary)] px-8 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(244,81,30,0.22)] transition hover:bg-[var(--primary-hover)]"
          >
            {hiw.cta}
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}
