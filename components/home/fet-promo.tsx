"use client";

/**
 * components/home/fet-promo.tsx
 *
 * Subtle, first-visit FET promo — a small dismissible card that slides in at the
 * bottom-left a few seconds after load to spotlight the FET product line without
 * congesting the Okelcor homepage.
 *
 * - first visit only (localStorage), dismiss = gone until storage is cleared
 * - delayed entrance, Esc to close, slide/fade animation
 * - FET green design system (never Okelco orange); copy reused from t.fetTeaser
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X, Zap, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/language-context";

const KEY = "fet_promo_seen";
const DELAY_MS = 3500;

export default function FetPromo() {
  const { t } = useLanguage();
  const [render, setRender] = useState(false);
  const [shown, setShown] = useState(false);

  const dismiss = useCallback(() => {
    setShown(false);
    try { localStorage.setItem(KEY, "1"); } catch { /* storage blocked — ignore */ }
    setTimeout(() => setRender(false), 300);
  }, []);

  // First-visit, delayed entrance.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(KEY) === "1"; } catch { /* ignore */ }
    if (seen) return;
    const timer = setTimeout(() => {
      setRender(true);
      requestAnimationFrame(() => setShown(true));
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Esc to close.
  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [render, dismiss]);

  if (!render) return null;

  return (
    <div
      role="region"
      aria-label="FET Engine Treatment"
      className={`fixed bottom-4 left-4 right-4 z-[70] transition-all duration-300 ease-out sm:right-auto sm:max-w-[360px] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#e2e8e2] bg-white shadow-[0_24px_60px_-20px_rgba(13,43,26,0.38)]">
        <div className="h-1 w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a]" />

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#f0f4f0] hover:text-[#111111]"
        >
          <X size={15} />
        </button>

        <div className="p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dcfce7]">
              <Zap size={17} strokeWidth={2} className="text-[#16a34a]" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534]">
              {t.fetTeaser.eyebrow}
            </span>
          </div>

          <h3 className="mt-3 pr-6 text-[1.02rem] font-extrabold leading-snug text-[#111111]">
            {t.fetTeaser.title} — <span className="text-[#22c55e]">{t.fetTeaser.highlight}</span>
          </h3>

          <p className="mt-1.5 line-clamp-2 text-[0.83rem] leading-5 text-[#6b7280]">
            {t.fetTeaser.body}
          </p>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f0f4f0] px-2.5 py-1 text-[0.72rem] font-bold text-[#166534]">
            13.9% {t.fetMega.labelFuelSavings}
          </span>

          <Link
            href="/fet"
            onClick={dismiss}
            className="group mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[#22c55e] px-4 text-[0.85rem] font-semibold text-white transition hover:bg-[#16a34a]"
          >
            {t.fetTeaser.cta}
            <ArrowRight size={15} strokeWidth={2.2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
