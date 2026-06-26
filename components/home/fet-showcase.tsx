"use client";

/**
 * components/home/fet-showcase.tsx
 *
 * Consolidated FET (Fuel Echo Tech) homepage section — replaces the four
 * separate FET strips (teaser / ROI / verified / proof) with one premium,
 * interactive section. Keeps the FET green design system (never Okelco orange).
 *
 * Left:  value prop + key result stats + certification pills + CTAs.
 * Right: interactive Before/After video comparison (tap to switch, crossfade).
 *
 * All copy reuses existing translations (fetTeaser / fetMega / fetProof /
 * fetVerified) — no new i18n keys. The full calculator + proof live on /fet.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, TrendingDown, Clock } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import Reveal from "@/components/motion/reveal";

const STAT_ICONS = [TrendingDown, Zap, Clock] as const;

export default function FetShowcase() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"before" | "after">("after");

  const stats = [
    { stat: "13.9%",       label: t.fetMega.labelFuelSavings },
    { stat: "€900–€1,300", label: t.fetMega.labelAnnualSavings },
    { stat: "3–5",         label: t.fetMega.labelPayback },
  ] as const;

  return (
    <section className="relative w-full overflow-hidden border-y border-[#e2e8e2] bg-[#f0f4f0] py-14 md:py-20">
      {/* Green ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-15%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.14),transparent_62%)] blur-2xl"
      />

      <div className="tesla-shell relative">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ── Left: copy ─────────────────────────────────── */}
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#166534]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                {t.fetTeaser.eyebrow}
              </span>

              <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-[1.1] tracking-tight text-[#111111] sm:text-4xl">
                {t.fetTeaser.title} — <span className="text-[#22c55e]">{t.fetTeaser.highlight}</span>
              </h2>

              <p className="mt-4 max-w-lg text-[1rem] leading-7 text-[#6b7280]">
                {t.fetTeaser.body}
              </p>

              {/* Key result stats */}
              <div className="mt-7 grid grid-cols-3 gap-3">
                {stats.map(({ stat, label }, i) => {
                  const Icon = STAT_ICONS[i] ?? Zap;
                  return (
                    <div
                      key={label}
                      className="rounded-2xl border border-[#e2e8e2] bg-white p-4 text-center"
                    >
                      <Icon size={16} strokeWidth={2} className="mx-auto text-[#22c55e]" />
                      <p className="mt-2 text-[1.35rem] font-extrabold leading-none text-[#111111]">{stat}</p>
                      <p className="mt-1.5 text-[0.68rem] leading-4 text-[#6b7280]">{label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Certification pills */}
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8e2] bg-white px-3 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#166534]">
                  <ShieldCheck size={13} strokeWidth={2} className="text-[#22c55e]" />
                  ISO 9001:2015
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#166534]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                  {t.fetVerified.fieldTested}
                </span>
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/fet"
                  className="group inline-flex h-[48px] items-center justify-center gap-2 rounded-full bg-[#22c55e] px-7 text-[14px] font-semibold text-white shadow-[0_14px_30px_rgba(34,197,94,0.25)] transition hover:bg-[#16a34a]"
                >
                  {t.fetTeaser.cta}
                  <ArrowRight size={16} strokeWidth={2.4} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/tyre-supply-quotation"
                  className="inline-flex h-[48px] items-center justify-center rounded-full border border-[#cdd8cd] bg-white px-7 text-[14px] font-semibold text-[#111111] transition hover:bg-[#f7faf7]"
                >
                  {t.fetMega.requestQuote}
                </Link>
              </div>
            </div>
          </Reveal>

          {/* ── Right: interactive before/after ────────────── */}
          <Reveal delay={0.12}>
            <div>
              {/* Toggle */}
              <div className="mb-3 inline-flex rounded-full border border-[#e2e8e2] bg-white p-1">
                {(["before", "after"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={[
                      "rounded-full px-5 py-2 text-[0.8rem] font-bold uppercase tracking-[0.12em] transition",
                      tab === key
                        ? key === "before"
                          ? "bg-[#111111] text-white"
                          : "bg-[#22c55e] text-white"
                        : "text-[#6b7280] hover:text-[#111111]",
                    ].join(" ")}
                  >
                    {key === "before" ? t.fetProof.beforeLabel : t.fetProof.afterLabel}
                  </button>
                ))}
              </div>

              {/* Video frame */}
              <div className="relative overflow-hidden rounded-[20px] border border-[#e2e8e2] bg-black shadow-[0_28px_65px_-26px_rgba(13,43,26,0.4)]">
                <div className="relative aspect-video">
                  <video
                    src="/videos/fet-before-web.mp4"
                    autoPlay muted loop playsInline
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${tab === "before" ? "opacity-100" : "opacity-0"}`}
                  />
                  <video
                    src="/videos/fet-after-web.mp4"
                    autoPlay muted loop playsInline
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${tab === "after" ? "opacity-100" : "opacity-0"}`}
                  />

                  {/* Result badge */}
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                    <TrendingDown size={13} strokeWidth={2.4} className="text-[#22c55e]" />
                    13.9% {t.fetMega.labelFuelSavings}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-center text-[0.8rem] text-[#6b7280]">
                {t.fetProof.result}
              </p>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
