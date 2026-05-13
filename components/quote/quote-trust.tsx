"use client";

import { useState } from "react";
import { Tag, Globe, Headphones, ChevronDown } from "lucide-react";
import { StaggerParent, StaggerChild } from "@/components/motion/stagger";
import Reveal from "@/components/motion/reveal";
import { useLanguage } from "@/context/language-context";

const TRUST_ICONS = [Tag, Globe, Headphones];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-black/[0.07] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="pr-4 text-[0.95rem] font-semibold text-[var(--foreground)]">{q}</span>
        <span
          className="flex shrink-0 transition-transform duration-250 ease-out"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDown size={17} className="text-[var(--muted)]" />
        </span>
      </button>
      {/* CSS grid-rows trick: animates from 0fr → 1fr with no layout reads */}
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="pb-4 text-[0.88rem] leading-7 text-[var(--muted)]">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function QuoteTrust() {
  const { t } = useLanguage();
  return (
    <section className="w-full bg-[#f5f5f5] pb-12 pt-4">
      <div className="tesla-shell flex flex-col gap-6">

        {/* Trust blocks */}
        <StaggerParent className="grid gap-5 md:grid-cols-3">
          {t.quote.trust.blocks.map((block, i) => {
            const Icon = TRUST_ICONS[i];
            return (
            <StaggerChild key={block.title}>
              <div className="flex flex-col rounded-[22px] bg-[#efefef] p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)]/10">
                  <Icon size={19} strokeWidth={1.8} className="text-[var(--primary)]" />
                </div>
                <h3 className="mt-5 text-[1rem] font-extrabold text-[var(--foreground)]">{block.title}</h3>
                <p className="mt-2 text-[0.88rem] leading-6 text-[var(--muted)]">{block.body}</p>
              </div>
            </StaggerChild>
            );
          })}
        </StaggerParent>

        {/* FAQ */}
        <Reveal className="rounded-[22px] bg-[#efefef] px-7 py-6 md:px-10 md:py-8">
          <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
            {t.quote.trust.faqEyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-3xl">
            {t.quote.trust.faqHeading}
          </h2>
          <div className="mt-6">
            {t.quote.trust.faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          {/* Outbound freight partner links */}
          <div className="mt-6 border-t border-black/[0.07] pt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] text-[var(--muted)]">
            <span>Shipped via trusted freight partners:</span>
            <a
              href="https://www.hapag-lloyd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] hover:underline"
            >
              Hapag-Lloyd
            </a>
            <span>·</span>
            <a
              href="https://www.dbschenker.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] hover:underline"
            >
              DB Schenker
            </a>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
