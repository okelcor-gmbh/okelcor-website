"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export default function FetProof() {
  const { t } = useLanguage();

  return (
    <section className="w-full bg-[#0a0f1e] py-16 md:py-20">
      <div className="tesla-shell">

        {/* ── Heading ─────────────────────────────────────────────────────── */}
        <div className="mb-10 text-center md:mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" aria-hidden="true" />
            {t.fetProof.badge}
          </span>

          <h2 className="mt-4 text-[1.9rem] font-extrabold leading-tight tracking-tight text-white sm:text-[2.2rem] lg:text-[2.5rem]">
            {t.fetProof.heading}
          </h2>

          <p className="mx-auto mt-3 max-w-[540px] text-[0.97rem] leading-7 text-white/55">
            {t.fetProof.body}
          </p>
        </div>

        {/* ── Video pair ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">

          {/* Before */}
          <div className="relative overflow-hidden rounded-[18px]">
            <video
              src="/videos/fet-before-web.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full object-cover"
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
              {t.fetProof.beforeLabel}
            </span>
          </div>

          {/* After */}
          <div className="relative overflow-hidden rounded-[18px]">
            <video
              src="/videos/fet-after-web.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full object-cover"
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
              {t.fetProof.afterLabel}
            </span>
          </div>

        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col items-center gap-5 text-center">
          <p className="text-[0.85rem] font-medium text-white/40">
            {t.fetProof.result}
          </p>

          <Link
            href="/fet"
            className="inline-flex items-center gap-2 rounded-full bg-[#10b981] px-7 py-3.5 text-[0.92rem] font-bold text-white transition hover:bg-[#0d9e6e]"
          >
            {t.fetProof.cta} <ArrowRight size={15} strokeWidth={2.2} />
          </Link>
        </div>

      </div>
    </section>
  );
}
