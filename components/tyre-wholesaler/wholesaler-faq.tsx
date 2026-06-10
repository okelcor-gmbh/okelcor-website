"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Reveal from "@/components/motion/reveal";
import { WHOLESALER_FAQS } from "./data";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-black/[0.07] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="pr-4 text-[0.95rem] font-semibold text-[var(--foreground)]">{q}</span>
        <span
          className="flex shrink-0 transition-transform duration-200 ease-out"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDown size={17} className="text-[var(--muted)]" />
        </span>
      </button>
      <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="pb-4 text-[0.88rem] leading-7 text-[var(--muted)]">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function WholesalerFaq() {
  return (
    <section className="w-full bg-[#f5f5f5] pb-16 md:pb-20">
      <div className="tesla-shell">
        <Reveal className="rounded-[22px] bg-[#efefef] px-7 py-6 md:px-10 md:py-8">
          <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
            Wholesale FAQs
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-3xl">
            Buying tyres at wholesale — answered
          </h2>
          <div className="mt-6">
            {WHOLESALER_FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
