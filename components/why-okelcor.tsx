"use client";

import Link from "next/link";
import { StaggerParent, StaggerChild } from "@/components/motion/stagger";
import { useLanguage } from "@/context/language-context";

export default function WhyOkelcor() {
  const { t } = useLanguage();
  return (
    <section className="w-full bg-[#f5f5f5] py-12 md:py-16">
      <div className="tesla-shell">
        <StaggerParent className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-[1.1fr_0.55fr_1.1fr_0.55fr]">

          {/* Card 1 */}
          <StaggerChild className="rounded-[22px] border border-black/[0.05] bg-[#efefef] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_14px_38px_rgba(0,0,0,0.09)] sm:p-8 md:p-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl lg:text-5xl">
              {t.why.card1.title}
            </h2>
            <p className="mt-3 text-[1rem] leading-7 text-[var(--muted)]">
              {t.why.card1.body}
            </p>
            <div className="mt-4">
              <Link
                href="/wholesale-tire-distributors-europe"
                className="inline-flex h-[48px] items-center justify-center rounded-full bg-[var(--primary)] px-6 text-[14px] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
              >
                {t.why.card1.button}
              </Link>
            </div>
          </StaggerChild>

          {/* Image 1 — hidden on mobile */}
          <StaggerChild
            className="hidden rounded-[22px] border border-black/[0.05] bg-cover bg-center shadow-[0_4px_24px_rgba(0,0,0,0.05)] md:block"
            style={{
              minHeight: "280px",
              backgroundImage:
                "url('/images/pexels-franco-monsalvo-252430633-16242030.jpg')",
            }}
          />

          {/* Card 2 */}
          <StaggerChild className="rounded-[22px] border border-black/[0.05] bg-[#efefef] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_14px_38px_rgba(0,0,0,0.09)] sm:p-8 md:p-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl lg:text-5xl">
              {t.why.card2.title}
            </h2>
            <p className="mt-3 text-[1rem] leading-7 text-[var(--muted)]">
              {t.why.card2.body}
            </p>
            <div className="mt-4">
              <Link
                href="/tyre-supply-quotation"
                className="inline-flex h-[48px] items-center justify-center rounded-full bg-[var(--primary)] px-6 text-[14px] font-semibold text-white transition hover:bg-[var(--primary-hover)]"
              >
                {t.why.card2.button}
              </Link>
            </div>
          </StaggerChild>

          {/* Image 2 — hidden on mobile */}
          <StaggerChild
            className="hidden rounded-[22px] border border-black/[0.05] bg-cover bg-center shadow-[0_4px_24px_rgba(0,0,0,0.05)] md:block"
            style={{
              minHeight: "280px",
              backgroundImage:
                "url('/images/pexels-mavickty-16520868.jpg')",
            }}
          />

        </StaggerParent>
      </div>
    </section>
  );
}
