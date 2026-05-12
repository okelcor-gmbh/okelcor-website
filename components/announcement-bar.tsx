"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const STORAGE_KEY = "okelcor_bar_dismissed_v1";
const ROTATE_MS = 4000;

type BarPromotion = {
  id: number;
  title: string;
  short_text?: string | null;
  emoji?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  placement?: string | null;
};

export default function AnnouncementBar() {
  const pathname              = usePathname();
  const [promos, setPromos]   = useState<BarPromotion[]>([]);
  const [idx, setIdx]         = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    fetch("/api/promotions/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const all: BarPromotion[] = Array.isArray(json?.data) ? json.data : [];
        const barPromos = all.filter(
          (p) => p.placement === "announcement_bar" || p.placement === "both"
        );
        if (barPromos.length > 0) {
          setPromos(barPromos);
          setVisible(true);
          document.documentElement.style.setProperty("--bar-h", "44px");
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (!visible || promos.length <= 1) return;
    timerRef.current = setInterval(
      () => setIdx((i) => (i + 1) % promos.length),
      ROTATE_MS
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, promos.length]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
    document.documentElement.style.setProperty("--bar-h", "0px");
  };

  const prev = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIdx((i) => (i - 1 + promos.length) % promos.length);
  };

  const next = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIdx((i) => (i + 1) % promos.length);
  };

  if (pathname?.startsWith("/admin")) return null;
  if (!visible || promos.length === 0) return null;

  const promo = promos[idx];
  const text = promo.short_text || promo.title;

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] flex h-[44px] items-center bg-[#f4511e] px-3">
      {promos.length > 1 && (
        <button
          type="button"
          onClick={prev}
          aria-label="Previous promotion"
          className="shrink-0 p-1 text-white/80 transition hover:text-white"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
      )}

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        {promo.emoji && (
          <span className="shrink-0 text-[1.1rem] leading-none">{promo.emoji}</span>
        )}
        <span className="truncate text-[0.82rem] font-semibold text-white">{text}</span>
        {promo.button_text && promo.button_link && (
          <Link
            href={promo.button_link}
            className="ml-2 shrink-0 rounded-full bg-white px-3 py-0.5 text-[0.72rem] font-bold text-[#f4511e] transition hover:bg-white/90"
          >
            {promo.button_text}
          </Link>
        )}
      </div>

      {promos.length > 1 && (
        <>
          <div className="mx-2 flex shrink-0 items-center gap-1">
            {promos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all ${
                  i === idx ? "h-1.5 w-4 bg-white" : "h-1.5 w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            aria-label="Next promotion"
            className="shrink-0 p-1 text-white/80 transition hover:text-white"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </>
      )}

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="ml-2 shrink-0 p-1 text-white/70 transition hover:text-white"
      >
        <X size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
