"use client";

/**
 * components/home/scroll-progress.tsx
 *
 * Thin scroll-progress bar pinned to the very top of the viewport — a quiet,
 * premium reading cue (Linear/Stripe-style). Updates a CSS transform directly
 * (no React state) and throttles with rAF for smooth, cheap rendering.
 */

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = fillRef.current;
      if (!el) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      el.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        ref={fillRef}
        className="h-full w-full origin-left bg-gradient-to-r from-[var(--primary)] to-[#ff7a45]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
