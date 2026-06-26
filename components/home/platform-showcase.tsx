"use client";

/**
 * components/home/platform-showcase.tsx
 *
 * Homepage "product UI" showcase — a rendered (not screenshotted) mock of the
 * customer order-tracking experience, blended into a premium section.
 *
 * Why a rendered mock instead of a screenshot:
 *   - crisp at any resolution / retina
 *   - no real customer data exposed (all values are illustrative)
 *   - animatable: the timeline cascades in on scroll, the card floats on parallax
 *
 * The timeline mirrors the real admin PaymentMilestonesCard (same dot states,
 * emerald = done, orange = current, grey = pending) so it reads as authentic.
 * All visible copy is i18n via t.platform.
 */

import Link from "next/link";
import { Check, CheckCircle2, FileText, Download, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import Reveal from "@/components/motion/reveal";
import { StaggerParent } from "@/components/motion/stagger";
import { useParallax } from "@/hooks/useParallax";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import TyreRing from "./tyre-ring";

// Illustrative demo data — not tied to any real order.
const ORDER_REF = "#OK-20418";
const STEP_STATE = ["done", "done", "current", "pending", "pending"] as const;
const STEP_SUB = ["50% · €12,400", "14 Jun 2026", "€12,400", null, null] as const;
const STEP_DATE = [null, "14 Jun 2026", null, null, null] as const;

export default function PlatformShowcase() {
  const { t } = useLanguage();
  const p = t.platform;
  const { containerRef, targetRef } = useParallax<HTMLDivElement>({ speed: 0.08 });

  // Ambient motion — matches the hero (rings rotate, glows drift). Reduced-safe.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<Element>(".ps-ring").forEach((ring, i) => {
        gsap.to(ring, {
          rotation: i % 2 === 0 ? 360 : -360,
          duration: 110 + i * 40,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        });
      });
      gsap.to(".ps-glow", {
        x: "+=22",
        y: "-=16",
        duration: 11,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 1.6,
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[#f5f5f5] py-16 md:py-24"
    >
      {/* Ambient — same animated, low-opacity visual language as the hero */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ps-glow absolute right-[-10%] top-1/2 h-[640px] w-[640px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,81,30,0.16),transparent_62%)] blur-2xl" />
        <div className="ps-glow absolute left-[-12%] bottom-[-20%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(23,26,32,0.05),transparent_64%)] blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(rgba(23,26,32,0.7) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <TyreRing className="ps-ring absolute left-[5%] top-[8%] hidden h-[300px] w-[300px] text-[#171a20] opacity-[0.05] lg:block" />
        <TyreRing className="ps-ring absolute right-[9%] bottom-[6%] hidden h-[220px] w-[220px] text-[#171a20] opacity-[0.05] lg:block" />
      </div>

      <div className="tesla-shell relative">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ── Left: copy ─────────────────────────────────── */}
          <Reveal>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
                {p.eyebrow}
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-extrabold leading-[1.08] tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-[2.9rem]">
                {p.heading}
              </h2>
              <p className="mt-5 max-w-lg text-[1.02rem] leading-8 text-[var(--muted)]">
                {p.body}
              </p>

              <ul className="mt-7 flex flex-col gap-4">
                {p.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10">
                      <Check size={14} strokeWidth={2.6} className="text-[var(--primary)]" />
                    </span>
                    <span className="text-[0.96rem] leading-7 text-[var(--foreground)]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href="/register"
                  className="group inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-7 text-[14px] font-semibold text-white shadow-[0_16px_32px_rgba(244,81,30,0.22)] transition hover:bg-[var(--primary-hover)]"
                >
                  {p.cta}
                  <ArrowRight size={16} strokeWidth={2.4} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Reveal>

          {/* ── Right: floating app-window mock ────────────── */}
          <div ref={targetRef} className="relative will-change-transform">
            <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-[0_28px_65px_-26px_rgba(23,26,32,0.25)]">

              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#fbfbfc] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <div className="ml-3 hidden flex-1 truncate rounded-md bg-[#f0f2f5] px-3 py-1 text-[0.68rem] text-[#9ca3af] sm:block">
                  app.okelcor.com/account/orders
                </div>
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-emerald-600 sm:ml-0">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {p.mock.live}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6">

                {/* Order header */}
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                      {p.mock.orderLabel}
                    </p>
                    <p className="mt-0.5 text-[1.05rem] font-extrabold text-[#1a1a1a]">{ORDER_REF}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-[0.72rem] font-bold text-orange-700">
                    {p.mock.statusLabel}
                  </span>
                </div>

                {/* Milestones */}
                <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">
                  {p.mock.milestonesTitle}
                </p>
                <StaggerParent stagger={0.08} className="space-y-0">
                  {p.mock.steps.map((label, i) => {
                    const state = STEP_STATE[i];
                    const isDone = state === "done";
                    const isCurr = state === "current";
                    const isLast = i === p.mock.steps.length - 1;
                    return (
                      <div key={label} className="flex gap-3">
                        {/* Dot + connector line (flex layout — never overlaps text) */}
                        <div className="flex flex-col items-center">
                          <span
                            className={[
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 bg-white",
                              isDone ? "border-emerald-500 bg-emerald-500"
                                : isCurr ? "border-[var(--primary)] bg-[var(--primary)]"
                                : "border-black/20",
                            ].join(" ")}
                          >
                            {isDone && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
                            {isCurr && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
                          </span>
                          {!isLast && <span className="mt-1 w-0.5 flex-1 rounded bg-black/[0.08]" />}
                        </div>

                        {/* Content */}
                        <div className={`min-w-0 ${isLast ? "pb-0" : "pb-4"}`}>
                          <p className={`text-[0.85rem] font-semibold ${isDone ? "text-emerald-700" : isCurr ? "text-[#1a1a1a]" : "text-[#9ca3af]"}`}>
                            {label}
                          </p>
                          {STEP_SUB[i] && (
                            <p className={`mt-0.5 text-[0.74rem] ${isDone || isCurr ? "text-[#5c5e62]" : "text-[#b0b3b8]"}`}>
                              {STEP_SUB[i]}
                            </p>
                          )}
                          {isDone && STEP_DATE[i] && (
                            <p className="mt-0.5 text-[0.7rem] text-emerald-600">
                              {p.mock.confirmed} {STEP_DATE[i]}
                            </p>
                          )}
                          {isCurr && (
                            <p className="mt-0.5 text-[0.7rem] font-medium text-[var(--primary)]">
                              {p.mock.inProgress}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </StaggerParent>

                {/* Trade documents */}
                <div className="mt-5 border-t border-black/[0.06] pt-4">
                  <p className="mb-2.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">
                    {p.mock.documentsTitle}
                  </p>
                  <div className="flex flex-col gap-2">
                    {p.mock.docs.map((doc) => (
                      <div
                        key={doc}
                        className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-[#fbfbfc] px-3 py-2.5 transition hover:border-[var(--primary)]/30 hover:bg-[#fff8f6]"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                          <FileText size={14} strokeWidth={1.9} className="text-[var(--primary)]" />
                        </span>
                        <span className="flex-1 truncate text-[0.82rem] font-medium text-[#1a1a1a]">{doc}</span>
                        <Download size={15} strokeWidth={2} className="shrink-0 text-[#9ca3af]" />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
